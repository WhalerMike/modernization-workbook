#Requires -Version 7.5
<#
.SYNOPSIS
    Read-only Azure Arc and Azure Policy checks through Azure Resource Graph, for the workbook's
    Microsoft Automation Module 4. The same rules as python/arc_tasks.py, tested against the same
    fixtures and expected results.

.DESCRIPTION
    Connect-FmwAzure signs in to the right Azure cloud (commercial for GCC) with a certificate or a managed identity, never a client secret. The
    identity needs only the Reader role. Get-FmwArgRows pages a Resource Graph query with
    -SkipToken. The Test-* functions are pure: they take query rows and return findings, so they
    can be tested without a subscription.

    Needs Az.Accounts and Az.ResourceGraph for Connect-FmwAzure, Get-FmwArgRows and
    Invoke-FmwArcTask; the pure functions need nothing.
#>

Set-StrictMode -Version Latest

$script:Kit = Split-Path -Parent $PSScriptRoot
$script:AzureEnv = @{ global = 'AzureCloud'; gcc = 'AzureCloud' }

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
    esuAssignment = tostring(properties.licenseProfile.esuProfile.licenseAssignmentState),
    sqlDiscovered = coalesce(tobool(properties.detectedProperties.mssqldiscovered), tobool(properties.mssqlDiscovered), false),
    dnsFqdn = tolower(tostring(properties.dnsFqdn)), machineFqdn = tolower(tostring(properties.machineFqdn)),
    domainName = tolower(tostring(properties.domainName)), computerName = tolower(tostring(properties.osProfile.computerName))
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
| project id = tolower(id), name, subscriptionId, resourceGroup, serviceType = tostring(properties.serviceType),
    version = tostring(properties.version), edition = tostring(properties.edition),
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

# A sqlServerInstances resource is a Database Engine instance unless serviceType names an associated
# service (SSAS, SSIS, SSRS, PBIRS). Learn gives Engine as the default.
function Test-FmwSqlEngine($Row) { $t = Get-FmwArmValue $Row 'serviceType' ''; (-not $t) -or $t -eq 'Engine' }

function Get-FmwTally([object[]]$Rows, [scriptblock]$Key) {
    $o = [ordered]@{}
    foreach ($v in (@($Rows | Where-Object { $null -ne $_ } | ForEach-Object $Key) | Sort-Object -CaseSensitive)) { $o[$v] = 1 + [int]($o[$v] ?? 0) }
    $o
}

function Get-FmwScopeNote([object[]]$Machines) {
    $n = @($Machines | Where-Object { $null -ne $_ }).Count
    [ordered]@{ machinesInScope = $n; emptyScope = ($n -eq 0) }
}

function Connect-FmwAzure {
    <#
    .SYNOPSIS
        Signs in to the Azure cloud that matches the tenant, as an app with a certificate or as a managed identity.
    .DESCRIPTION
        GCC and global use commercial Azure (AzureCloud). Never a client secret. The identity needs only the Reader role on the
        subscriptions or management group the checks read.
    .EXAMPLE
        Connect-FmwAzure -Cloud gcc -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
    .EXAMPLE
        Connect-FmwAzure -Cloud gcc -Identity
    #>
    [CmdletBinding(DefaultParameterSetName = 'Certificate')]
    param(
        [Parameter(Mandatory)][ValidateSet('global', 'gcc')][string]$Cloud,
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
        Arc servers and SQL Server Database Engine instances on products past, or near, the end of support.
    .DESCRIPTION
        Matches the OS on osSku, then osName, against arc-lifecycle.json. Associated services (SSAS, SSIS,
        SSRS, PBIRS) are left out: their installation's Engine instance already reports its lifecycle. States: unsupported,
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
    foreach ($q in ($SqlInstances | Where-Object { Test-FmwSqlEngine $_ } | Sort-Object { $_.name.ToLowerInvariant() })) {
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
        SQL Server enabled by Arc: Database Engine instances and the machines that host them, counted separately, with breakdowns.
    .DESCRIPTION
        instances counts Engine resources only; associatedServices counts SSAS, SSIS, SSRS and PBIRS installs by
        serviceType. hostMachines counts the distinct containerResourceId values among Engine instances: one
        machine can host several. machinesSqlDiscovered counts Arc machines whose detectedProperties say SQL
        Server is installed; discoveredWithoutInstance lists those with no instance resource. Breakdowns by
        version, edition, status, licenseType, subscription and resource group cover Engine instances. Findings:
        resources whose host isn't a connected Arc machine in scope. Evidences NIST SP 800-53 CM-8 and CM-8(1).
    .EXAMPLE
        $arc = Get-Content -Raw tests/fixtures/arc.json | ConvertFrom-Json -AsHashtable
        Test-FmwArcSql -Machines $arc.machines -SqlInstances $arc.sqlInstances | Select-Object -Property instances, hostMachines
    #>
    param([object[]]$Machines = @(), [object[]]$SqlInstances = @(), $Estate)
    $hosts = @{}; foreach ($m in $Machines) { $hosts[$m.id] = $m }
    $engine = @($SqlInstances | Where-Object { Test-FmwSqlEngine $_ })
    $findings = [System.Collections.Generic.List[object]]::new()
    foreach ($s in ($SqlInstances | Sort-Object { $_.name.ToLowerInvariant() })) {
        $h = $hosts[(Get-FmwArmValue $s 'hostId' '')]
        $reasons = [System.Collections.Generic.List[string]]::new()
        if ((Get-FmwArmValue $s 'status' '') -ne 'Connected') { $reasons.Add("instance status $((Get-FmwArmValue $s 'status' '') ? (Get-FmwArmValue $s 'status' '') : 'missing')") }
        if ($null -eq $h) { $reasons.Add('host not found among the Arc machines in scope') }
        elseif ((Get-FmwArmValue $h 'status' '') -ne 'Connected') { $reasons.Add("host status $((Get-FmwArmValue $h 'status' '') ? (Get-FmwArmValue $h 'status' '') : 'missing')") }
        $svc = Get-FmwArmValue $s 'serviceType' ''; if (-not $svc) { $svc = 'Engine' }
        if ($reasons.Count) { $findings.Add([ordered]@{ id = $s.id; name = $s.name; serviceType = $svc; version = (Get-FmwArmValue $s 'version' ''); host = ($h ? $h.name : $null); reasons = @($reasons) }) }
    }
    $hostIds = @($SqlInstances | ForEach-Object { Get-FmwArmValue $_ 'hostId' '' } | Where-Object { $_ })
    $discovered = @($Machines | Where-Object { (Get-FmwArmValue $_ 'sqlDiscovered' $false) -eq $true })
    $or = { param($row, $key) $x = Get-FmwArmValue $row $key ''; $x ? $x : 'Unknown' }
    $note = Get-FmwScopeNote $Machines
    $result = [ordered]@{
        machinesInScope = $note.machinesInScope; emptyScope = $note.emptyScope
        resources = @($SqlInstances).Count
        instances = $engine.Count
        associatedServices = (Get-FmwTally @($SqlInstances | Where-Object { -not (Test-FmwSqlEngine $_) }) { $_.serviceType })
        hostMachines = @($engine | ForEach-Object { Get-FmwArmValue $_ 'hostId' '' } | Where-Object { $_ } | Sort-Object -Unique).Count
        machinesSqlDiscovered = $discovered.Count
        discoveredWithoutInstance = @($discovered | Where-Object { $hostIds -notcontains $_.id } | ForEach-Object { $_.name } | Sort-Object { $_.ToLowerInvariant() })
        byVersion = (Get-FmwTally $engine { & $or $_ 'version' })
        byEdition = (Get-FmwTally $engine { & $or $_ 'edition' })
        byStatus = (Get-FmwTally $engine { & $or $_ 'status' })
        byLicenseType = (Get-FmwTally $engine { & $or $_ 'licenseType' })
        bySubscription = (Get-FmwTally $engine { & $or $_ 'subscriptionId' })
        byResourceGroup = (Get-FmwTally $engine { '{0}/{1}' -f (& $or $_ 'subscriptionId'), (& $or $_ 'resourceGroup').ToLowerInvariant() })
        findings = @($findings)
    }
    if ($null -ne $Estate) { $result['forestGap'] = Test-FmwArcSqlGap -Estate $Estate -Machines $Machines -SqlInstances $SqlInstances }
    $result
}

function Get-FmwMachineName($Machine) {
    # (fully qualified names, short names) an Arc machine answers to, lowercase.
    $fq = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($n in @((Get-FmwArmValue $Machine 'dnsFqdn' ''), (Get-FmwArmValue $Machine 'machineFqdn' ''))) { if ($n) { [void]$fq.Add($n.ToLowerInvariant()) } }
    $cn = (Get-FmwArmValue $Machine 'computerName' '').ToLowerInvariant(); $dom = (Get-FmwArmValue $Machine 'domainName' '').ToLowerInvariant()
    if ($cn -and $dom) { [void]$fq.Add("$cn.$dom") }
    $short = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($n in $fq) { [void]$short.Add($n.Split('.')[0]) }
    if ($cn) { [void]$short.Add($cn.Split('.')[0]) }
    $nm = (Get-FmwArmValue $Machine 'name' '').ToLowerInvariant(); if ($nm) { [void]$short.Add($nm) }
    , @(@($fq), @($short))
}

function Test-FmwArcSqlGap {
    <#
    .SYNOPSIS
        Reconciles the forest's SQL Server hosts (the Start Kit's SqlEstate.json) with Azure Arc: the SQL Servers that aren't in Arc.
    .DESCRIPTION
        Matches each directory host to an Arc machine on its fully qualified name, case-insensitively, or on
        its short name when exactly one Arc machine has it. Categories: notInArc (the gap list),
        arcWithoutSqlResource, inArc, arcNotInDirectory (inForest or notInForest) and excludedStale. The same
        rules as evaluate_forest_gap in python/arc_tasks.py. Evidences NIST SP 800-53 CM-8 and CM-8(1).
    .EXAMPLE
        $arc = Get-Content -Raw tests/fixtures/forest-gap.json | ConvertFrom-Json -AsHashtable
        $estate = Get-Content -Raw tests/fixtures/sql-estate-forest.json | ConvertFrom-Json -AsHashtable
        (Test-FmwArcSqlGap -Estate $estate -Machines $arc.machines -SqlInstances $arc.sqlInstances).hosts
    #>
    param([Parameter(Mandatory)]$Estate, [object[]]$Machines = @(), [object[]]$SqlInstances = @())
    $meta = Get-FmwArmValue $Estate 'Metadata'
    $domains = @(@(Get-FmwArmValue $meta 'Domains' @()) | ForEach-Object { "$_".ToLowerInvariant() } | Sort-Object -Unique)
    $perHost = @{}
    foreach ($a in @(Get-FmwArmValue $Estate 'InstanceAudits' @())) { $n = (Get-FmwArmValue $a 'ServerName' '').ToLowerInvariant(); $perHost[$n] = 1 + [int]($perHost[$n] ?? 0) }
    $hosts = @{}
    foreach ($h in @(Get-FmwArmValue $Estate 'Hosts' @())) { $hosts[(Get-FmwArmValue $h 'Host' '').ToLowerInvariant()] = $h }
    foreach ($n in @($perHost.Keys)) { if (-not $hosts.ContainsKey($n)) { $hosts[$n] = @{ Host = $n; DirectoryState = 'Unknown' } } }

    $byFqdn = @{}; $byShort = @{}
    foreach ($m in $Machines) {
        $names = Get-FmwMachineName $m
        foreach ($n in $names[0]) { if (-not $byFqdn.ContainsKey($n)) { $byFqdn[$n] = [System.Collections.Generic.List[object]]::new() }; $byFqdn[$n].Add($m) }
        foreach ($n in $names[1]) { if (-not $byShort.ContainsKey($n)) { $byShort[$n] = [System.Collections.Generic.List[object]]::new() }; $byShort[$n].Add($m) }
    }
    $engineHosts = @{}
    foreach ($s in $SqlInstances) { $hid = Get-FmwArmValue $s 'hostId' ''; if ($hid -and (Test-FmwSqlEngine $s)) { $engineHosts[$hid] = 1 + [int]($engineHosts[$hid] ?? 0) } }
    $match = {
        param([string]$hostName, [string]$dns)
        foreach ($n in @($hostName, $dns)) {
            if ($n -and $n.Contains('.') -and $byFqdn.ContainsKey($n) -and @($byFqdn[$n] | ForEach-Object { $_.id } | Sort-Object -Unique).Count -eq 1) { return , @($byFqdn[$n][0], 'fqdn') }
        }
        $c = [ordered]@{}
        $s = $hostName.Split('.')[0]
        if ($byShort.ContainsKey($s)) { foreach ($x in $byShort[$s]) { $c[$x.id] = $x } }
        if ($hostName.Contains('.')) { foreach ($k in @($c.Keys)) { if (@((Get-FmwMachineName $c[$k])[0]).Count -gt 0) { $c.Remove($k) } } }
        if ($c.Count -eq 1) { return , @(@($c.Values)[0], 'shortName') }
        , @($null, ($c.Count -gt 1 ? 'ambiguousShortName' : ''))
    }

    $rows = [System.Collections.Generic.List[object]]::new(); $matched = @{}
    foreach ($name in ($hosts.Keys | Sort-Object)) {
        $h = $hosts[$name]
        $r = & $match $name ((Get-FmwArmValue $h 'DNSHostName' '').ToLowerInvariant())
        $m = $r[0]; $how = $r[1]
        if ($m) { $matched[$m.id] = $true }
        $state = Get-FmwArmValue $h 'DirectoryState' 'Unknown'; if (-not $state) { $state = 'Unknown' }
        if ($state -in 'Stale', 'NoComputerObject', 'Ambiguous') { $cat = 'excludedStale'; $reason = Get-FmwArmValue $h 'StateReason' ''; if (-not $reason) { $reason = $state } }
        elseif ($null -eq $m) { $cat = 'notInArc'; $reason = ($how -eq 'ambiguousShortName') ? 'Short name matches several Arc machines; match by hand' : 'No Arc machine with this name' }
        elseif ($engineHosts[$m.id]) { $cat = 'inArc'; $reason = '' }
        else {
            $cat = 'arcWithoutSqlResource'
            $reason = ((Get-FmwArmValue $m 'sqlDiscovered' $false) -eq $true) ? 'Arc detected SQL Server, but no Database Engine instance resource: the Azure extension for SQL Server may be missing, or the instances excluded' : "No Database Engine instance resource, and Arc didn't detect SQL Server"
        }
        $rows.Add([ordered]@{ category = $cat; host = $name; domain = (Get-FmwArmValue $h 'Domain' ''); directoryState = $state
                operatingSystem = (Get-FmwArmValue $h 'OperatingSystem' ''); directoryInstances = [int]($perHost[$name] ?? 0)
                arcMachine = ($m ? $m.name : $null); arcStatus = ($m ? (Get-FmwArmValue $m 'status' '') : $null)
                arcInstances = ($m ? [int]($engineHosts[$m.id] ?? 0) : 0); matchedBy = ($how ? $how : $null); reason = $reason })
    }
    foreach ($m in ($Machines | Sort-Object { $_.name.ToLowerInvariant() })) {
        if ($matched[$m.id] -or -not ($engineHosts[$m.id] -or (Get-FmwArmValue $m 'sqlDiscovered' $false) -eq $true)) { continue }
        $dom = (Get-FmwArmValue $m 'domainName' '').ToLowerInvariant()
        $where = ($domains -contains $dom) ? 'inForest' : 'notInForest'
        $reason = ($where -eq 'inForest') ? 'Domain-joined in a domain the discovery read, but no SPN or other signal found SQL Server here' : "Not in a domain the discovery read ($($dom ? $dom : 'no domain')): a workgroup server or another forest"
        $fq = @((Get-FmwMachineName $m)[0] | Sort-Object -CaseSensitive)
        $os = Get-FmwArmValue $m 'osSku' ''; if (-not $os) { $os = Get-FmwArmValue $m 'osName' '' }
        $rows.Add([ordered]@{ category = 'arcNotInDirectory'; host = ($fq.Count ? $fq[0] : $m.name.ToLowerInvariant()); domain = $dom; directoryState = $where
                operatingSystem = $os; directoryInstances = 0; arcMachine = $m.name; arcStatus = (Get-FmwArmValue $m 'status' '')
                arcInstances = [int]($engineHosts[$m.id] ?? 0); matchedBy = $null; reason = $reason })
    }
    $order = @('notInArc', 'arcWithoutSqlResource', 'inArc', 'arcNotInDirectory', 'excludedStale')
    $sorted = @($rows | Sort-Object @{ e = { $order.IndexOf($_.category) } }, @{ e = { $_.host } })   # hosts are lowercase
    $counts = [ordered]@{}; foreach ($o in $order) { $counts[$o] = @($sorted | Where-Object { $_.category -eq $o }).Count }
    $note = Get-FmwScopeNote $Machines
    [ordered]@{
        machinesInScope = $note.machinesInScope; emptyScope = $note.emptyScope
        forestDomains = $domains
        directoryHosts = $hosts.Count
        directoryInstances = [int](($perHost.Values | Measure-Object -Sum).Sum ?? 0)
        hosts = $counts
        instancesNotInArc = [int]((@($sorted | Where-Object { $_.category -eq 'notInArc' }) | ForEach-Object { $_.directoryInstances } | Measure-Object -Sum).Sum ?? 0)
        arcNotInDirectory = [ordered]@{ inForest = @($sorted | Where-Object { $_.category -eq 'arcNotInDirectory' -and $_.directoryState -eq 'inForest' }).Count
            notInForest = @($sorted | Where-Object { $_.category -eq 'arcNotInDirectory' -and $_.directoryState -eq 'notInForest' }).Count }
        gapList = $sorted
    }
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
        [int]$WindowDays = 180,
        # sql-inventory only: the Start Kit's SqlEstate.json, to reconcile the forest's SQL Server hosts with Arc.
        [string]$EstatePath
    )
    if (-not $Subscription) { $Subscription = @(Get-AzSubscription | Where-Object { $_.State -eq 'Enabled' } | ForEach-Object { $_.Id }) }
    if (-not $Subscription) { throw 'The identity can see no subscriptions: assign it Reader on the subscriptions or management group in scope.' }
    $data = @{}
    foreach ($name in $script:TaskQueries[$Task]) { $data[$name] = @(Get-FmwArgRows -Query $script:Q[$name] -Subscription $Subscription) }
    $result = switch ($Task) {
        'arc-extensions' { Test-FmwArcExtension -Machines $data.machines -Extensions $data.extensions }
        'arc-private-link' { Test-FmwArcPrivateLink -Machines $data.machines }
        'lifecycle' { Test-FmwArcLifecycle -Machines $data.machines -SqlInstances $data.sqlInstances -AsOf ([datetimeoffset]::UtcNow) -WindowDays $WindowDays }
        'sql-inventory' {
            $estate = if ($EstatePath) { Get-Content -Raw -Path $EstatePath | ConvertFrom-Json -AsHashtable -DateKind String } else { $null }
            Test-FmwArcSql -Machines $data.machines -SqlInstances $data.sqlInstances -Estate $estate
        }
        'policy-summary' { Test-FmwArcPolicy -Assignments $data.assignments -PolicyStates $data.policyStates }
    }
    [ordered]@{ task = $Task; evidences = $script:Evidences[$Task]; result = $result }
}

Export-ModuleMember -Function Connect-FmwAzure, Get-FmwArgRows, Get-FmwArcLifecycleTable, Test-FmwArcExtension, Test-FmwArcPrivateLink, Test-FmwArcLifecycle, Test-FmwArcSql, Test-FmwArcSqlGap, Test-FmwArcPolicy, Invoke-FmwArcTask
