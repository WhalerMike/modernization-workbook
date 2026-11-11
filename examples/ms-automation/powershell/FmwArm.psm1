#Requires -Version 7.5
<#
.SYNOPSIS
    Read-only Azure Arc and Azure Policy checks through Azure Resource Graph, for the workbook's
    Microsoft Automation Module 4. The same rules as python/arc_tasks.py, tested against the same
    fixtures and expected results.

.DESCRIPTION
    Connect-FmwAzure signs in to the right Azure cloud (commercial for GCC; Azure Government for
    GCC High and DoD) with a certificate or a managed identity, never a client secret. The
    identity needs only the Reader role. Get-FmwArgRows pages a Resource Graph query with
    -SkipToken. The Test-* functions are pure: they take query rows and return findings, so they
    can be tested without a subscription.

    Needs Az.Accounts and Az.ResourceGraph for Connect-FmwAzure, Get-FmwArgRows and
    Invoke-FmwArcTask; the pure functions need nothing.
#>

Set-StrictMode -Version Latest

$script:Kit = Split-Path -Parent $PSScriptRoot
$script:AzureEnv = @{ global = 'AzureCloud'; gcc = 'AzureCloud'; gcchigh = 'AzureUSGovernment'; dod = 'AzureUSGovernment' }

# The same queries as python/arc_tasks.py: a string id on every row so paging works, no take or limit,
# no extension settings, and each sorted by a unique column so pages don't repeat or skip rows.
$script:Q = @{
    machines      = @"
resources
| where type =~ 'microsoft.hybridcompute/machines'
| project id = tolower(id), name, subscriptionId, resourceGroup,
    status = tostring(properties.status), osType = tostring(properties.osType),
    osName = tostring(properties.osName), osSku = tostring(properties.osSku), osVersion = tostring(properties.osVersion),
    privateLinkScopeResourceId = tostring(properties.privateLinkScopeResourceId),
    esuEligibility = tostring(properties.licenseProfile.esuProfile.esuEligibility),
    esuAssignment = tostring(properties.licenseProfile.esuProfile.licenseAssignmentState)
| order by id asc
"@
    extensions    = @"
resources
| where type =~ 'microsoft.hybridcompute/machines/extensions'
| project id = tolower(id), machineId = tolower(substring(id, 0, indexof(id, '/extensions'))), name,
    publisher = tostring(properties.publisher), extensionType = tostring(properties.type),
    provisioningState = tostring(properties.provisioningState), version = tostring(properties.typeHandlerVersion)
| order by id asc
"@
    sqlInstances  = @"
resources
| where type =~ 'microsoft.azurearcdata/sqlserverinstances'
| project id = tolower(id), name, version = tostring(properties.version), edition = tostring(properties.edition),
    status = tostring(properties.status), hostId = tolower(tostring(properties.containerResourceId)),
    licenseType = tostring(properties.licenseType), currentVersion = tostring(properties.currentVersion)
| order by id asc
"@
    assignments   = @"
policyresources
| where type =~ 'microsoft.authorization/policyassignments'
| project id = tolower(id), name, displayName = tostring(properties.displayName),
    enforcementMode = tostring(properties.enforcementMode), scope = tostring(properties.scope)
| order by id asc
"@
    policyStates  = @"
policyresources
| where type =~ 'microsoft.policyinsights/policystates'
| extend assignmentId = tolower(tostring(properties.policyAssignmentId)), state = tostring(properties.complianceState)
| summarize nonCompliant = countif(state =~ 'NonCompliant'), compliant = countif(state =~ 'Compliant'),
    exempt = countif(state =~ 'Exempt'), total = count() by assignmentId
| order by assignmentId asc
"@
}
$script:TaskQueries = [ordered]@{
    'arc-extensions'   = @('machines', 'extensions')
    'arc-private-link' = @('machines')
    'lifecycle'        = @('machines', 'sqlInstances')
    'sql-inventory'    = @('machines', 'sqlInstances')
    'policy-summary'   = @('assignments', 'policyStates')
}
$script:Evidences = @{
    'arc-extensions'   = @('NIST SP 800-53 SI-4', 'NIST SP 800-53 SI-3', 'NIST SP 800-53 AU-12', 'NIST SP 800-53 CM-8')
    'arc-private-link' = @('NIST SP 800-53 SC-7')
    'lifecycle'        = @('NIST SP 800-53 SA-22', 'NIST SP 800-53 SI-2')
    'sql-inventory'    = @('NIST SP 800-53 CM-8', 'NIST SP 800-53 CM-8(1)')
    'policy-summary'   = @('NIST SP 800-53 CA-7', 'NIST SP 800-53 CM-6', 'NIST SP 800-53 CM-2')
}
# Each entry is "any one of", as publisher/type alternatives separated by '|'.
$script:DefaultRequired = @{
    windows = @('Microsoft.Azure.Monitor/AzureMonitorWindowsAgent', 'Microsoft.Azure.AzureDefenderForServers/MDE.Windows')
    linux   = @('Microsoft.Azure.Monitor/AzureMonitorLinuxAgent', 'Microsoft.Azure.AzureDefenderForServers/MDE.Linux')
}

function Get-FmwArmValue {
    param($Object, [string]$Name, $Default = $null)
    if ($null -eq $Object) { return $Default }
    if ($Object -is [System.Collections.IDictionary]) { if ($Object.Contains($Name) -and $null -ne $Object[$Name]) { return $Object[$Name] } else { return $Default } }
    $p = $Object.PSObject.Properties[$Name]
    if ($p -and $null -ne $p.Value) { $p.Value } else { $Default }
}

function ConvertTo-FmwArmUtc {
    param($Value)
    if ($null -eq $Value -or "$Value" -eq '') { return $null }
    if ($Value -is [datetimeoffset]) { return $Value.ToUniversalTime() }
    if ($Value -is [datetime]) { return [datetimeoffset]::new($Value.ToUniversalTime(), [timespan]::Zero) }
    [datetimeoffset]::Parse([string]$Value, [cultureinfo]::InvariantCulture).ToUniversalTime()
}

function Get-FmwArmDays([datetimeoffset]$From, [datetimeoffset]$To) { [int][math]::Floor(($To - $From).TotalDays) }

function Get-FmwScopeNote([object[]]$Machines) {
    $n = @($Machines | Where-Object { $null -ne $_ }).Count
    [ordered]@{ machinesInScope = $n; emptyScope = ($n -eq 0) }
}

function Connect-FmwAzure {
    <#
    .SYNOPSIS
        Signs in to the Azure cloud that matches the tenant, as an app with a certificate or as a managed identity.
    .DESCRIPTION
        GCC and global use commercial Azure (AzureCloud); GCC High and DoD use Azure Government
        (AzureUSGovernment). Never a client secret. The identity needs only the Reader role on the
        subscriptions or management group the checks read.
    .EXAMPLE
        Connect-FmwAzure -Cloud gcc -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
    .EXAMPLE
        Connect-FmwAzure -Cloud gcchigh -Identity
    #>
    [CmdletBinding(DefaultParameterSetName = 'Certificate')]
    param(
        [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
        [Parameter(Mandatory, ParameterSetName = 'Certificate')][string]$TenantId,
        [Parameter(Mandatory, ParameterSetName = 'Certificate')][string]$ClientId,
        [Parameter(Mandatory, ParameterSetName = 'Certificate')][string]$CertificateThumbprint,
        [Parameter(Mandatory, ParameterSetName = 'ManagedIdentity')][switch]$Identity,
        [Parameter(ParameterSetName = 'ManagedIdentity')][string]$ManagedIdentityClientId
    )
    $environment = $script:AzureEnv[$Cloud]
    if ($PSCmdlet.ParameterSetName -eq 'Certificate') {
        Connect-AzAccount -Environment $environment -ServicePrincipal -Tenant $TenantId -ApplicationId $ClientId -CertificateThumbprint $CertificateThumbprint | Out-Null
    } elseif ($ManagedIdentityClientId) {
        Connect-AzAccount -Environment $environment -Identity -AccountId $ManagedIdentityClientId | Out-Null
    } else {
        Connect-AzAccount -Environment $environment -Identity | Out-Null
    }
}

function Get-FmwArgRows {
    <#
    .SYNOPSIS
        Runs a Resource Graph query and returns every row, paging with -SkipToken.
    .DESCRIPTION
        Asks for 1,000 rows a page (Resource Graph's maximum) and repeats the same query and scope with
        the skip token until there is none. Resource Graph returns only resources the caller can read,
        so an empty result can mean no access: the checks report emptyScope instead of a clean result.
    .EXAMPLE
        Get-FmwArgRows -Query "resources | where type =~ 'microsoft.hybridcompute/machines' | project id = tolower(id), name" -Subscription <subscription-id>
    #>
    param([Parameter(Mandatory)][string]$Query, [Parameter(Mandatory)][string[]]$Subscription)
    $token = $null
    do {
        $page = if ($token) { Search-AzGraph -Query $Query -Subscription $Subscription -First 1000 -SkipToken $token } else { Search-AzGraph -Query $Query -Subscription $Subscription -First 1000 }
        foreach ($row in $page.Data) { $row }
        $token = $page.SkipToken
    } while ($token)
}

function Get-FmwArcLifecycleTable {
    <#
    .SYNOPSIS
        Reads the product lifecycle table (arc-lifecycle.json), longest product name first.
    .EXAMPLE
        Get-FmwArcLifecycleTable | Select-Object kind, product, extendedEnd
    #>
    param([string]$Path = (Join-Path $script:Kit 'arc-lifecycle.json'))
    $rows = (Get-Content -Raw -Path $Path | ConvertFrom-Json -AsHashtable -DateKind String).products
    @($rows | Sort-Object @{ e = { - $_.product.Length } })
}

function Test-FmwArcExtension {
    <#
    .SYNOPSIS
        Arc servers missing a required extension, and extensions not in the Succeeded state.
    .DESCRIPTION
        Required by default: Azure Monitor Agent and Defender for Endpoint, per OS type, as publisher/type.
        Evidences NIST SP 800-53 SI-4, SI-3, AU-12 and CM-8.
    .EXAMPLE
        $arc = Get-Content -Raw tests/fixtures/arc.json | ConvertFrom-Json -AsHashtable
        (Test-FmwArcExtension -Machines $arc.machines -Extensions $arc.extensions).findings.name
    #>
    param([object[]]$Machines = @(), [object[]]$Extensions = @(), [hashtable]$Required = $script:DefaultRequired)
    $byMachine = @{}
    foreach ($e in $Extensions) { if (-not $byMachine.ContainsKey($e.machineId)) { $byMachine[$e.machineId] = [System.Collections.Generic.List[object]]::new() }; $byMachine[$e.machineId].Add($e) }
    $findings = [System.Collections.Generic.List[object]]::new(); $unhealthy = 0
    foreach ($m in ($Machines | Sort-Object { $_.name.ToLowerInvariant() })) {
        $exts = if ($byMachine.ContainsKey($m.id)) { @($byMachine[$m.id]) } else { @() }
        $have = @($exts | ForEach-Object { ('{0}/{1}' -f (Get-FmwArmValue $_ 'publisher' ''), (Get-FmwArmValue $_ 'extensionType' '')).ToLowerInvariant() })
        $groups = $Required[(Get-FmwArmValue $m 'osType' '').ToLowerInvariant()]
        $missing = [System.Collections.Generic.List[string]]::new()
        foreach ($g in @($groups)) {
            if ($null -eq $g) { continue }
            $alternatives = @($g -split '\|')
            if (-not ($alternatives | Where-Object { $have -contains $_.ToLowerInvariant() })) { $missing.Add(($alternatives -join ' or ')) }
        }
        $bad = [System.Collections.Generic.List[object]]::new()
        foreach ($e in ($exts | Sort-Object { $_.name.ToLowerInvariant() })) {
            if ((Get-FmwArmValue $e 'provisioningState' '') -ne 'Succeeded') {
                $bad.Add([ordered]@{ extension = ('{0}/{1}' -f (Get-FmwArmValue $e 'publisher' ''), (Get-FmwArmValue $e 'extensionType' '')); provisioningState = (Get-FmwArmValue $e 'provisioningState' ''); version = (Get-FmwArmValue $e 'version' '') })
            }
        }
        if ($missing.Count -or $bad.Count) {
            $findings.Add([ordered]@{ id = $m.id; name = $m.name; osType = (Get-FmwArmValue $m 'osType' ''); status = (Get-FmwArmValue $m 'status' ''); missing = @($missing); notSucceeded = @($bad) })
        }
        $unhealthy += $bad.Count
    }
    $note = Get-FmwScopeNote $Machines
    [ordered]@{
        machinesInScope = $note.machinesInScope; emptyScope = $note.emptyScope
        machinesWithFindings = $findings.Count
        missingRequired = @($findings | Where-Object { $_.missing.Count -gt 0 }).Count
        extensionsNotSucceeded = $unhealthy
        findings = @($findings)
    }
}

function Test-FmwArcPrivateLink {
    <#
    .SYNOPSIS
        Arc servers not assigned to an Azure Arc private link scope, so they reach Azure over public endpoints.
    .DESCRIPTION
        Evidences NIST SP 800-53 SC-7.
    .EXAMPLE
        $arc = Get-Content -Raw tests/fixtures/arc.json | ConvertFrom-Json -AsHashtable
        (Test-FmwArcPrivateLink -Machines $arc.machines).findings.name
    #>
    param([object[]]$Machines = @())
    $public = @($Machines | Where-Object { -not (Get-FmwArmValue $_ 'privateLinkScopeResourceId' '') } | Sort-Object { $_.name.ToLowerInvariant() } | ForEach-Object {
            [ordered]@{ id = $_.id; name = $_.name; subscriptionId = (Get-FmwArmValue $_ 'subscriptionId' ''); resourceGroup = (Get-FmwArmValue $_ 'resourceGroup' '') } })
    $scopes = [ordered]@{}
    foreach ($s in ($Machines | ForEach-Object { (Get-FmwArmValue $_ 'privateLinkScopeResourceId' '').ToLowerInvariant() } | Where-Object { $_ } | Sort-Object)) { $scopes[$s] = 1 + [int]($scopes[$s] ?? 0) }
    $note = Get-FmwScopeNote $Machines
    [ordered]@{ machinesInScope = $note.machinesInScope; emptyScope = $note.emptyScope; publicEndpoint = $public.Count; privateLinkScopes = $scopes; findings = $public }
}

function Get-FmwLifecycleState($Row, [datetimeoffset]$AsOf, [int]$Window, $EsuAssigned) {
    $ext = ConvertTo-FmwArmUtc $Row.extendedEnd
    $esu = ConvertTo-FmwArmUtc (Get-FmwArmValue $Row 'esuEnd')
    if ($AsOf -lt $ext) { return @((($(Get-FmwArmDays $AsOf $ext) -le $Window) ? 'endingSoon' : 'supported'), $Row.extendedEnd) }
    # ESUs open: before esuEnd, or offered with no published end date (esuAvailable, no esuEnd).
    if (($esu -and $AsOf -lt $esu) -or (-not $esu -and (Get-FmwArmValue $Row 'esuAvailable' $false))) { return @((($EsuAssigned -eq $true) ? 'esuCovered' : 'esuNotConfirmed'), (Get-FmwArmValue $Row 'esuEnd')) }
    @('unsupported', ((Get-FmwArmValue $Row 'esuEnd') ?? $Row.extendedEnd))
}

function Test-FmwArcLifecycle {
    <#
    .SYNOPSIS
        Arc servers and SQL Server instances on products past, or near, the end of support.
    .DESCRIPTION
        Matches the OS on osSku, then osName, against arc-lifecycle.json. States: unsupported,
        esuNotConfirmed, esuCovered, endingSoon (within -WindowDays) and supported. A product not in
        the table is listed under notInTable, never counted as supported. Evidences SA-22 and SI-2.
    .EXAMPLE
        $arc = Get-Content -Raw tests/fixtures/arc.json | ConvertFrom-Json -AsHashtable
        (Test-FmwArcLifecycle -Machines $arc.machines -SqlInstances $arc.sqlInstances -AsOf '2026-11-03T00:00:00Z').counts
    #>
    param([object[]]$Machines = @(), [object[]]$SqlInstances = @(), [Parameter(Mandatory)][datetimeoffset]$AsOf, [int]$WindowDays = 180, [object[]]$Table = (Get-FmwArcLifecycleTable))
    $rows = [System.Collections.Generic.List[object]]::new(); $unknown = [System.Collections.Generic.List[object]]::new()
    $match = { param($text, $kind) $t = "$text".ToLowerInvariant(); $Table | Where-Object { $_.kind -eq $kind -and $t.Contains($_.product.ToLowerInvariant()) } | Select-Object -First 1 }
    foreach ($m in ($Machines | Sort-Object { $_.name.ToLowerInvariant() })) {
        $label = (Get-FmwArmValue $m 'osSku' '') ; if (-not $label) { $label = Get-FmwArmValue $m 'osName' '' }
        $p = & $match $label 'os'
        if (-not $p) { $unknown.Add([ordered]@{ id = $m.id; name = $m.name; kind = 'os'; label = $label }); continue }
        $assigned = switch (Get-FmwArmValue $m 'esuAssignment' '') { 'Assigned' { $true } 'NotAssigned' { $false } default { $null } }
        $s = Get-FmwLifecycleState $p $AsOf $WindowDays $assigned
        $rows.Add([ordered]@{ id = $m.id; name = $m.name; kind = 'os'; product = $p.product; state = $s[0]; date = $s[1] })
    }
    foreach ($q in ($SqlInstances | Sort-Object { $_.name.ToLowerInvariant() })) {
        $p = & $match (Get-FmwArmValue $q 'version' '') 'sql'
        if (-not $p) { $unknown.Add([ordered]@{ id = $q.id; name = $q.name; kind = 'sql'; label = (Get-FmwArmValue $q 'version' '') }); continue }
        $s = Get-FmwLifecycleState $p $AsOf $WindowDays $null   # a SQL Server ESU subscription isn't read: confirm it separately
        $rows.Add([ordered]@{ id = $q.id; name = $q.name; kind = 'sql'; product = $p.product; state = $s[0]; date = $s[1] })
    }
    $order = @('unsupported', 'esuNotConfirmed', 'esuCovered', 'endingSoon', 'supported')
    $counts = [ordered]@{}; foreach ($o in $order) { $counts[$o] = @($rows | Where-Object { $_.state -eq $o }).Count }
    $findings = @($rows | Where-Object { $_.state -ne 'supported' } | Sort-Object @{ e = { $order.IndexOf($_.state) } }, @{ e = { $_.kind } }, @{ e = { $_.name.ToLowerInvariant() } })
    $note = Get-FmwScopeNote $Machines
    [ordered]@{ asOf = $AsOf.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [cultureinfo]::InvariantCulture); windowDays = $WindowDays
        machinesInScope = $note.machinesInScope; emptyScope = $note.emptyScope; counts = $counts; findings = $findings; notInTable = @($unknown) }
}

function Test-FmwArcSql {
    <#
    .SYNOPSIS
        SQL Server instances enabled by Arc: counts by version and edition, and instances whose host isn't a connected Arc machine in scope.
    .DESCRIPTION
        Evidences NIST SP 800-53 CM-8 and CM-8(1).
    .EXAMPLE
        $arc = Get-Content -Raw tests/fixtures/arc.json | ConvertFrom-Json -AsHashtable
        (Test-FmwArcSql -Machines $arc.machines -SqlInstances $arc.sqlInstances).findings.name
    #>
    param([object[]]$Machines = @(), [object[]]$SqlInstances = @())
    $hosts = @{}; foreach ($m in $Machines) { $hosts[$m.id] = $m }
    $findings = [System.Collections.Generic.List[object]]::new()
    foreach ($s in ($SqlInstances | Sort-Object { $_.name.ToLowerInvariant() })) {
        $h = $hosts[(Get-FmwArmValue $s 'hostId' '')]
        $reasons = [System.Collections.Generic.List[string]]::new()
        if ((Get-FmwArmValue $s 'status' '') -ne 'Connected') { $reasons.Add("instance status $((Get-FmwArmValue $s 'status' '') ? (Get-FmwArmValue $s 'status' '') : 'missing')") }
        if ($null -eq $h) { $reasons.Add('host not found among the Arc machines in scope') }
        elseif ((Get-FmwArmValue $h 'status' '') -ne 'Connected') { $reasons.Add("host status $((Get-FmwArmValue $h 'status' '') ? (Get-FmwArmValue $h 'status' '') : 'missing')") }
        if ($reasons.Count) { $findings.Add([ordered]@{ id = $s.id; name = $s.name; version = (Get-FmwArmValue $s 'version' ''); host = ($h ? $h.name : $null); reasons = @($reasons) }) }
    }
    $count = { param($key) $o = [ordered]@{}; foreach ($v in ($SqlInstances | ForEach-Object { $x = Get-FmwArmValue $_ $key ''; $x ? $x : 'Unknown' } | Sort-Object)) { $o[$v] = 1 + [int]($o[$v] ?? 0) }; $o }
    [ordered]@{ instances = @($SqlInstances).Count; byVersion = (& $count 'version'); byEdition = (& $count 'edition'); findings = @($findings) }
}

function Test-FmwArcPolicy {
    <#
    .SYNOPSIS
        Per policy assignment: enforcement mode and compliance counts; flags DoNotEnforce and noncompliant assignments.
    .DESCRIPTION
        Evidences NIST SP 800-53 CA-7, CM-6 and CM-2.
    .EXAMPLE
        $arc = Get-Content -Raw tests/fixtures/arc.json | ConvertFrom-Json -AsHashtable
        (Test-FmwArcPolicy -Assignments $arc.assignments -PolicyStates $arc.policyStates).notEnforced
    #>
    param([object[]]$Assignments = @(), [object[]]$PolicyStates = @())
    $counts = @{}; foreach ($s in $PolicyStates) { $counts[$s.assignmentId] = $s }
    $rows = @(foreach ($a in $Assignments) {
            $c = $counts[$a.id]
            $mode = Get-FmwArmValue $a 'enforcementMode' ''; if (-not $mode) { $mode = 'Default' }
            $dn = Get-FmwArmValue $a 'displayName' ''; if (-not $dn) { $dn = $a.name }
            [ordered]@{ id = $a.id; displayName = $dn; enforcementMode = $mode
                nonCompliant = [int](Get-FmwArmValue $c 'nonCompliant' 0); compliant = [int](Get-FmwArmValue $c 'compliant' 0)
                exempt = [int](Get-FmwArmValue $c 'exempt' 0); total = [int](Get-FmwArmValue $c 'total' 0) }
        }) | Sort-Object @{ e = { - $_.nonCompliant } }, @{ e = { $_.displayName.ToLowerInvariant() } }
    $known = @($Assignments | ForEach-Object { $_.id })
    [ordered]@{
        assignments = @($rows).Count
        notEnforced = @($rows | Where-Object { $_.enforcementMode -eq 'DoNotEnforce' } | ForEach-Object { $_.displayName })
        withNonCompliant = @($rows | Where-Object { $_.nonCompliant -gt 0 })
        noStates = @($rows | Where-Object { $_.total -eq 0 } | ForEach-Object { $_.displayName })
        statesForUnknownAssignments = @($PolicyStates | Where-Object { $known -notcontains $_.assignmentId } | ForEach-Object { $_.assignmentId } | Sort-Object)
    }
}

function Invoke-FmwArcTask {
    <#
    .SYNOPSIS
        Runs one Arc check against Azure (after Connect-FmwAzure) and returns its result with the controls it evidences. Read-only.
    .DESCRIPTION
        Queries every subscription the identity can see unless -Subscription is given. Needs only Reader.
    .EXAMPLE
        Connect-FmwAzure -Cloud gcc -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
        Invoke-FmwArcTask -Task lifecycle | ConvertTo-Json -Depth 8
    #>
    param(
        [Parameter(Mandatory)][ValidateSet('arc-extensions', 'arc-private-link', 'lifecycle', 'sql-inventory', 'policy-summary')][string]$Task,
        [string[]]$Subscription,
        [int]$WindowDays = 180
    )
    if (-not $Subscription) { $Subscription = @(Get-AzSubscription | Where-Object { $_.State -eq 'Enabled' } | ForEach-Object { $_.Id }) }
    if (-not $Subscription) { throw 'The identity can see no subscriptions: assign it Reader on the subscriptions or management group in scope.' }
    $data = @{}
    foreach ($name in $script:TaskQueries[$Task]) { $data[$name] = @(Get-FmwArgRows -Query $script:Q[$name] -Subscription $Subscription) }
    $result = switch ($Task) {
        'arc-extensions' { Test-FmwArcExtension -Machines $data.machines -Extensions $data.extensions }
        'arc-private-link' { Test-FmwArcPrivateLink -Machines $data.machines }
        'lifecycle' { Test-FmwArcLifecycle -Machines $data.machines -SqlInstances $data.sqlInstances -AsOf ([datetimeoffset]::UtcNow) -WindowDays $WindowDays }
        'sql-inventory' { Test-FmwArcSql -Machines $data.machines -SqlInstances $data.sqlInstances }
        'policy-summary' { Test-FmwArcPolicy -Assignments $data.assignments -PolicyStates $data.policyStates }
    }
    [ordered]@{ task = $Task; evidences = $script:Evidences[$Task]; result = $result }
}

Export-ModuleMember -Function Connect-FmwAzure, Get-FmwArgRows, Get-FmwArcLifecycleTable, Test-FmwArcExtension, Test-FmwArcPrivateLink, Test-FmwArcLifecycle, Test-FmwArcSql, Test-FmwArcPolicy, Invoke-FmwArcTask
