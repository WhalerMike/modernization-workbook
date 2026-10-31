#Requires -Version 7.5
<#
.SYNOPSIS
    Read-only Microsoft Entra ID and Intune checks through Microsoft Graph PowerShell, for the
    workbook's automation Modules 1, 2 and 3. The same rules as python/entra_tasks.py and
    python/intune_tasks.py, tested against the same fixtures and expected results.

.DESCRIPTION
    Connect-FmwGraph picks the right cloud (GCC is the worldwide service; GCC High and DoD
    have their own environments) and signs in with a certificate or a managed identity,
    never a client secret. Get-FmwGraphCollection follows @odata.nextLink, and checks every
    page with Assert-FmwGraphCall: the token stays on the cloud's Graph host, a task makes only
    the calls graph-calls.json declares for it, and a beta call must be declared. Test-FmwTokenRole
    compares a token's roles with a task's permissions, and Test-FmwSessionRole does the same for the
    Graph PowerShell session through Get-MgContext; the Invoke-Fmw*Task functions stop before any call if
    the session lacks a permission (Assert-FmwSessionRole). Get-FmwBetaCollection reads a beta
    collection without depending on it (developer workbook, Chapter 02). The Test-* and
    ConvertTo-* functions are pure: they take Graph objects and return findings, so they
    can be tested without a tenant.

    Requires the Microsoft.Graph.Authentication module for Connect-MgGraph, Get-MgContext and
    Invoke-MgGraphRequest; the pure functions need nothing.
#>

Set-StrictMode -Version Latest

$script:GlobalAdmin = '62e90394-69f5-4237-9190-012177145e10'   # Global Administrator role template ID

# Microsoft Learn, "Use Microsoft Graph PowerShell authentication commands" (Get-MgEnvironment),
# "Microsoft Graph national cloud deployments" and "Compare Azure Government and global Azure".
# GCC is the worldwide service, paired with Microsoft Entra ID in commercial Azure, so its Azure
# Resource Manager host is the commercial one. The same values as CLOUDS in python/graphkit.py.
$script:Clouds = @{
    global  = @{ Environment = 'Global';   Login = 'https://login.microsoftonline.com'; Graph = 'https://graph.microsoft.com';    Arm = 'https://management.azure.com';          AzureEnvironment = 'AzureCloud' }
    gcc     = @{ Environment = 'Global';   Login = 'https://login.microsoftonline.com'; Graph = 'https://graph.microsoft.com';    Arm = 'https://management.azure.com';          AzureEnvironment = 'AzureCloud' }
    gcchigh = @{ Environment = 'USGov';    Login = 'https://login.microsoftonline.us';  Graph = 'https://graph.microsoft.us';     Arm = 'https://management.usgovcloudapi.net'; AzureEnvironment = 'AzureUSGovernment' }
    dod     = @{ Environment = 'USGovDoD'; Login = 'https://login.microsoftonline.us';  Graph = 'https://dod-graph.microsoft.us'; Arm = 'https://management.usgovcloudapi.net'; AzureEnvironment = 'AzureUSGovernment' }
}
$script:ConnectedCloud = $null

# Every Graph call the tasks make, with its least-privileged permission: the file python/graphkit.py reads.
$script:Calls = @((Get-Content -Raw -Path (Join-Path $PSScriptRoot '..' 'graph-calls.json') | ConvertFrom-Json -AsHashtable)['calls'])

$script:Permissions = [ordered]@{
    'stale-users'      = @('User.Read.All', 'AuditLog.Read.All')
    'ca-export'        = @('Policy.Read.All')
    'pim-report'       = @('RoleEligibilitySchedule.Read.Directory', 'RoleAssignmentSchedule.Read.Directory', 'RoleManagement.Read.Directory')
    'app-credentials'  = @('Application.Read.All')
    'mfa-registration' = @('AuditLog.Read.All')
}

# See python/entra_tasks.py: confirm these names against your own report output.
$script:PhishingResistant = @('passKeyDeviceBound', 'passKeyDeviceBoundAuthenticator', 'passKeyDeviceBoundWindowsHello', 'windowsHelloForBusiness', 'fido2SecurityKey')

function Get-FmwCloud {
    <#
    .SYNOPSIS
        Returns the sign-in, Graph and Azure Resource Manager endpoints and the Connect-MgGraph
        environment name for a cloud. GCC uses the worldwide service; GCC High and DoD have their own.
    .EXAMPLE
        (Get-FmwCloud -Cloud gcchigh).Graph   # https://graph.microsoft.us
    #>
    param([Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud)
    $script:Clouds[$Cloud]
}

function Connect-FmwGraph {
    <#
    .SYNOPSIS
        Signs in to Microsoft Graph app-only in the chosen cloud, with a certificate or a managed
        identity (never a client secret), and remembers the cloud for later calls.
    .EXAMPLE
        Connect-FmwGraph -Cloud gcchigh -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
    #>

    <# App-only sign-in: a certificate from the CurrentUser or LocalMachine store, or a managed identity. #>
    [CmdletBinding(DefaultParameterSetName = 'Certificate')]
    param(
        [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
        [Parameter(Mandatory, ParameterSetName = 'Certificate')][string]$TenantId,
        [Parameter(Mandatory, ParameterSetName = 'Certificate')][string]$ClientId,
        [Parameter(Mandatory, ParameterSetName = 'Certificate')][string]$CertificateThumbprint,
        [Parameter(Mandatory, ParameterSetName = 'ManagedIdentity')][switch]$Identity,
        [Parameter(ParameterSetName = 'ManagedIdentity')][string]$ManagedIdentityClientId
    )
    $envName = (Get-FmwCloud $Cloud).Environment
    $script:ConnectedCloud = $Cloud
    if ($PSCmdlet.ParameterSetName -eq 'Certificate') {
        Connect-MgGraph -Environment $envName -TenantId $TenantId -ClientId $ClientId -CertificateThumbprint $CertificateThumbprint -NoWelcome
    } elseif ($ManagedIdentityClientId) {
        Connect-MgGraph -Environment $envName -Identity -ClientId $ManagedIdentityClientId -NoWelcome
    } else {
        Connect-MgGraph -Environment $envName -Identity -NoWelcome
    }
}

function Get-FmwGraphCall {
    <#
    .SYNOPSIS
        Returns the Graph calls declared in graph-calls.json, or only those for one task.
        Throws when no call is declared for the task.
    .EXAMPLE
        Get-FmwGraphCall -Task pim-report | ForEach-Object { $_['id'] }
    #>

    <# The declared Graph calls (graph-calls.json), or one task's. #>
    param([string]$Task)
    if (-not $Task) { return , @($script:Calls) }
    $c = @($script:Calls | Where-Object { $_['tasks'] -contains $Task })
    if (-not $c) { throw "No calls declared for task '$Task' in graph-calls.json" }
    , $c
}

function Get-FmwCallPermission {
    <#
    .SYNOPSIS
        Returns the least-privileged permissions a task's declared Graph calls need, sorted and
        without duplicates.
    .EXAMPLE
        Get-FmwCallPermission -Task pim-report
    #>

    <# The union of the least-privileged permissions a task's calls need, sorted. #>
    param([Parameter(Mandatory)][string]$Task)
    $calls = Get-FmwGraphCall -Task $Task
    , @($(foreach ($c in $calls) { $c['permissions'] }) | Sort-Object -Unique -CaseSensitive)
}

function Assert-FmwGraphCall {
    <#
    .SYNOPSIS
        Checks one Graph call before it is sent: the URI must stay on the cloud's Graph host, and the
        call must be declared in graph-calls.json for the task. Throws on a refused call; returns the matching call.
    .EXAMPLE
        Assert-FmwGraphCall -Method GET -Uri '/v1.0/deviceManagement/deviceCompliancePolicies/cp1/assignments' -Cloud gcc -Task compliance-coverage
    #>

    <#
    Refuse a Graph call this run wasn't given: an absolute URI on another host than the cloud's Graph
    host (so the token never leaves), an undeclared call when a task is named, any beta call no listed
    call declares, or a call graph-calls.json says this cloud doesn't offer. Returns the matching call.
    #>
    param(
        [Parameter(Mandatory)][string]$Method,
        [Parameter(Mandatory)][string]$Uri,
        [Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
        [string]$Task
    )
    $graphHost = ([uri](Get-FmwCloud $Cloud).Graph).Host
    if ($Uri -match '^[a-z]+://') {
        $u = [uri]$Uri
        if ($u.Scheme -ne 'https' -or $u.Host -ne $graphHost) { throw "Refusing to send the token to ${Uri}: not https://$graphHost" }
        $path = $u.AbsolutePath
    } else {
        $path = ($Uri -split '\?', 2)[0]
    }
    $parts = $path.TrimStart('/') -split '/', 2
    $version = $parts[0]
    $rest = '/' + $(if ($parts.Count -gt 1) { $parts[1] } else { '' })
    if ($version -notin @('v1.0', 'beta')) { throw "Unknown Graph version in $Uri; use /v1.0 or /beta" }
    $declared = if ($Task) { Get-FmwGraphCall -Task $Task } else { Get-FmwGraphCall }
    $call = $null
    foreach ($c in $declared) {
        $rx = '^' + ([regex]::Escape($c['path']) -replace '\\\{[^}]+}', '[^/]+') + '$'
        if ($c['method'] -eq $Method.ToUpperInvariant() -and $c['version'] -eq $version -and $rest -match $rx) { $call = $c; break }
    }
    if (-not $call -and ($Task -or $version -ne 'v1.0')) {
        $kind = if ($version -eq 'beta') { 'beta call' } else { 'call' }
        throw "Undeclared ${kind}: $Method /$version$rest; add it to graph-calls.json with its permission"
    }
    if ($call -and $call.ContainsKey('not_in_clouds') -and $call['not_in_clouds'] -contains $Cloud) {
        throw "$($call['id']) isn't offered in $Cloud (graph-calls.json not_in_clouds)"
    }
    $call
}

function Get-FmwGraphCollection {
    <#
    .SYNOPSIS
        Returns every item of a Graph collection, following @odata.nextLink. Each page is checked
        with Assert-FmwGraphCall (cloud host, declared calls) before it is sent.
    .EXAMPLE
        # After Connect-FmwGraph
        Get-FmwGraphCollection -Uri '/v1.0/identity/conditionalAccess/policies' -Task ca-export
    #>

    <#
    Every item of a collection, following @odata.nextLink. Each page is checked by Assert-FmwGraphCall
    and sent with the same headers. Invoke-MgGraphRequest relies on the Graph PowerShell SDK's own
    retry handling for throttled calls.
    #>
    param(
        [Parameter(Mandatory)][string]$Uri,
        [switch]$Advanced,
        [string]$Task,
        [ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud = $script:ConnectedCloud
    )
    if (-not $Cloud) { throw 'No cloud: run Connect-FmwGraph first, or pass -Cloud' }
    $headers = @{ 'x-ms-throttle-priority' = 'Low' }
    if ($Advanced) { $headers['ConsistencyLevel'] = 'eventual' }
    $next = $Uri
    while ($next) {
        $null = Assert-FmwGraphCall -Method GET -Uri $next -Cloud $Cloud -Task $Task
        $page = Invoke-MgGraphRequest -Method GET -Uri $next -Headers $headers -OutputType Hashtable
        foreach ($item in $page['value']) { $item }
        $next = $page['@odata.nextLink']
    }
}

function Get-FmwBetaCollection {
    <#
    .SYNOPSIS
        Reads a beta collection without depending on it. A refused call, or a 400, 404 or 501 from
        Graph, returns available = false with the reason instead of an error.
    .EXAMPLE
        Get-FmwBetaCollection -Path '/deviceManagement/windowsAutopilotDeviceIdentities' -Task autopilot-profiles -Cloud gcchigh
    #>

    <#
    Read a beta collection without depending on it: @{ stage; available; items; reason }. A refused call
    (undeclared, or not offered in this cloud) and a 400, 404 or 501 from Graph give available = false,
    so the report says "not evaluated". Anything else, including 403, still throws.
    #>
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Task,
        [ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud = $script:ConnectedCloud
    )
    $uri = '/beta' + $(if ($Path.StartsWith('/')) { $Path } else { "/$Path" })
    try { $null = Assert-FmwGraphCall -Method GET -Uri $uri -Cloud $Cloud -Task $Task }
    catch { return [ordered]@{ stage = 'beta'; available = $false; items = @(); reason = $_.Exception.Message } }
    try {
        $items = @(Get-FmwGraphCollection -Uri $uri -Task $Task -Cloud $Cloud)
        [ordered]@{ stage = 'beta'; available = $true; items = $items; reason = '' }
    } catch {
        if ($_.Exception.Message -match '\b(400|404|501)\b|BadRequest|ResourceNotFound|NotFound') {
            return [ordered]@{ stage = 'beta'; available = $false; items = @(); reason = $_.Exception.Message }
        }
        throw
    }
}

function Get-FmwTokenRole {
    <#
    .SYNOPSIS
        Returns the roles claim (application permissions) of an access token. The token is decoded,
        not validated: this is a pre-flight check only.
    .EXAMPLE
        # $token holds an app-only access token for Microsoft Graph
        Get-FmwTokenRole -Token $token
    #>

    <# The roles claim (application permissions) of an access token. Read, not validated: a pre-flight check only. #>
    param([Parameter(Mandatory)][string]$Token)
    $parts = $Token.Split('.')
    if ($parts.Count -lt 2) { throw 'Not a JWT access token' }
    $p = $parts[1].Replace('-', '+').Replace('_', '/')
    $p += '=' * ((4 - $p.Length % 4) % 4)
    $claims = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($p)) | ConvertFrom-Json -AsHashtable
    if ($claims.ContainsKey('roles')) { , @($claims['roles']) } else { , @() }
}

function Test-FmwTokenRole {
    <#
    .SYNOPSIS
        Compares a token's roles with the permissions a task needs. Returns Missing (needed, not held)
        and Extra (held, not used).
    .EXAMPLE
        # $token holds an app-only access token for Microsoft Graph
        Test-FmwTokenRole -Token $token -Needed (Get-FmwCallPermission -Task ca-export)
    #>

    <# What the token lacks for the task (Missing) and holds beyond it (Extra: unused permissions). #>
    param([Parameter(Mandatory)][string]$Token, [Parameter(Mandatory)][AllowEmptyCollection()][string[]]$Needed)
    $have = Get-FmwTokenRole -Token $Token
    [ordered]@{
        Missing = @($Needed | Where-Object { $_ -cnotin $have } | Sort-Object -Unique -CaseSensitive)
        Extra   = @($have | Where-Object { $_ -cnotin $Needed } | Sort-Object -Unique -CaseSensitive)
    }
}

function Test-FmwSessionRole {
    <#
    .SYNOPSIS
        Compares the permissions of the current app-only Graph PowerShell session (Get-MgContext Scopes)
        with those a task needs, and returns Missing and Extra. Throws when there is no session or it is delegated.
    .EXAMPLE
        # After Connect-FmwGraph
        Test-FmwSessionRole -Needed (Get-FmwCallPermission -Task pim-report)
    #>

    <#
    The same pre-flight as Test-FmwTokenRole, for a Graph PowerShell session, whose token the module
    never sees. Learn's app-only guide shows Get-MgContext's Scopes holding the application's
    permissions in an AppOnly session; the SDK fills Scopes from the token's scp claim, or else its
    roles claim (research-gaps.md row 16). An app-only session has no scp, so Scopes is the roles claim.
    Returns Missing and Extra like Test-FmwTokenRole. Throws when there is no session, or a delegated one.
    #>
    param([Parameter(Mandatory)][AllowEmptyCollection()][string[]]$Needed)
    $ctx = Get-MgContext
    if (-not $ctx) { throw 'No Microsoft Graph session: run Connect-FmwGraph first' }
    if ("$($ctx.AuthType)" -eq 'Delegated') { throw 'A delegated session: the tasks run app-only (Connect-FmwGraph)' }
    $have = @($ctx.Scopes | Where-Object { $_ })
    [ordered]@{
        Missing = @($Needed | Where-Object { $_ -cnotin $have } | Sort-Object -Unique -CaseSensitive)
        Extra   = @($have | Where-Object { $_ -cnotin $Needed } | Sort-Object -Unique -CaseSensitive)
    }
}

function Assert-FmwSessionRole {
    <#
    .SYNOPSIS
        Stops before a live task when the Graph session lacks a permission the task's calls need,
        and warns for each permission the session holds that the task doesn't use.
    .EXAMPLE
        Assert-FmwSessionRole -Task stale-users
    #>

    <# Before a live task: stop if the session lacks a permission the task's calls need; warn for each extra one. #>
    param([Parameter(Mandatory)][string]$Task)
    $audit = Test-FmwSessionRole -Needed (Get-FmwCallPermission -Task $Task)
    if ($audit.Missing.Count) { throw "The session lacks $($audit.Missing -join ', '); grant the task's permissions (graph-calls.json) and retry" }
    foreach ($extra in $audit.Extra) { Write-Warning "The session also holds $extra, which task $Task doesn't use" }
}

function ConvertTo-FmwUtc {
    <#
    .SYNOPSIS
        Converts a string, DateTime or DateTimeOffset to a UTC DateTimeOffset. Returns $null for an
        empty value.
    .EXAMPLE
        ConvertTo-FmwUtc -Value '2026-07-01T00:00:00Z'
    #>
    param($Value)
    if ($null -eq $Value -or "$Value" -eq '') { return $null }
    if ($Value -is [datetime]) { return [datetimeoffset]::new($Value.ToUniversalTime(), [timespan]::Zero) }
    if ($Value -is [datetimeoffset]) { return $Value.ToUniversalTime() }
    [datetimeoffset]::Parse([string]$Value, [cultureinfo]::InvariantCulture).ToUniversalTime()
}

function Format-FmwUtc {
    <#
    .SYNOPSIS
        Formats a date as a UTC ISO 8601 string ending in Z, such as 2026-07-01T00:00:00Z. Returns
        $null for $null.
    .EXAMPLE
        Format-FmwUtc -Value (ConvertTo-FmwUtc '2026-07-01T00:00:00Z')   # 2026-07-01T00:00:00Z
    #>
    param($Value)
    if ($null -eq $Value) { return $null }
    $Value.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [cultureinfo]::InvariantCulture)
}

function Get-FmwDays {
    <# Whole days from $From to $To, floored like Python's timedelta.days. #>
    param([datetimeoffset]$From, [datetimeoffset]$To)
    [int][math]::Floor(($To - $From).TotalDays)
}

function Get-FmwValue {
    param($Object, [string]$Name, $Default = $null)
    if ($null -eq $Object) { return $Default }
    if ($Object -is [System.Collections.IDictionary]) { if ($Object.Contains($Name)) { return $Object[$Name] } else { return $Default } }
    $p = $Object.PSObject.Properties[$Name]
    if ($p) { $p.Value } else { $Default }
}

function Test-FmwStaleUser {
    <#
    .SYNOPSIS
        Lists enabled member accounts with no interactive or non-interactive sign-in for -Days days as
        of -AsOf, skipping accounts created within that window. Makes no Graph call.
    .EXAMPLE
        $users = (Get-Content ./tests/fixtures/users.json -Raw | ConvertFrom-Json -AsHashtable -DateKind String).users
        Test-FmwStaleUser -Users $users -AsOf ([datetimeoffset]'2026-10-25T00:00:00Z') -Days 90
    #>

    <# Enabled members with no interactive or non-interactive sign-in in $Days days. Needs Entra ID P1 for signInActivity. #>
    param([Parameter(Mandatory)][object[]]$Users, [Parameter(Mandatory)][datetimeoffset]$AsOf, [int]$Days = 90)
    $rows = [System.Collections.Generic.List[object]]::new()
    foreach ($u in $Users) {
        if (-not (Get-FmwValue $u 'accountEnabled' $true) -or (Get-FmwValue $u 'userType' 'Member') -ne 'Member') { continue }
        $act = Get-FmwValue $u 'signInActivity'
        $seen = @((ConvertTo-FmwUtc (Get-FmwValue $act 'lastSignInDateTime')), (ConvertTo-FmwUtc (Get-FmwValue $act 'lastNonInteractiveSignInDateTime'))) | Where-Object { $null -ne $_ }
        $last = if ($seen) { ($seen | Sort-Object -Descending)[0] } else { $null }
        $created = ConvertTo-FmwUtc (Get-FmwValue $u 'createdDateTime')
        if ($null -eq $last -and $created -and (Get-FmwDays $created $AsOf) -lt $Days) { continue }
        $idle = if ($last) { Get-FmwDays $last $AsOf } else { $null }
        if ($null -eq $idle -or $idle -ge $Days) {
            $rows.Add([ordered]@{ id = $u.id; userPrincipalName = [string](Get-FmwValue $u 'userPrincipalName' ''); lastSignIn = (Format-FmwUtc $last); daysIdle = $idle })
        }
    }
    , @($rows | Sort-Object @{ e = { $null -ne $_.daysIdle } }, @{ e = { - [int]($_.daysIdle ?? 0) } }, @{ e = { $_.userPrincipalName } })
}

function ConvertTo-FmwCaExport {
    <#
    .SYNOPSIS
        Summarizes Conditional Access policies (name, state, grant controls, report-only) with counts
        by state, and keys the full policies and named locations by ID for export. Makes no Graph call.
    .EXAMPLE
        $ca = Get-Content ./tests/fixtures/ca.json -Raw | ConvertFrom-Json -AsHashtable -DateKind String
        (ConvertTo-FmwCaExport -Policies $ca.policies -NamedLocations $ca.namedLocations).counts
    #>
    param([Parameter(Mandatory)][object[]]$Policies, [object[]]$NamedLocations = @())
    $summary = [System.Collections.Generic.List[object]]::new()
    foreach ($p in ($Policies | Sort-Object { [string](Get-FmwValue $_ 'displayName' '') })) {
        $grant = Get-FmwValue $p 'grantControls'
        $controls = @(Get-FmwValue $grant 'builtInControls' @()) | Sort-Object
        if (Get-FmwValue $grant 'authenticationStrength') { $controls = @($controls) + 'authenticationStrength' }
        $summary.Add([ordered]@{
                id          = $p.id
                displayName = [string](Get-FmwValue $p 'displayName' '')
                state       = [string](Get-FmwValue $p 'state' '')
                grant       = @($controls)
                reportOnly  = ((Get-FmwValue $p 'state') -eq 'enabledForReportingButNotEnforced')
            })
    }
    $counts = [ordered]@{}
    foreach ($s in 'enabled', 'enabledForReportingButNotEnforced', 'disabled') { $counts[$s] = @($summary | Where-Object { $_.state -eq $s }).Count }
    $byId = [ordered]@{}; foreach ($p in $Policies) { $byId[$p.id] = $p }
    $locs = [ordered]@{}; foreach ($n in $NamedLocations) { $locs[$n.id] = $n }
    [ordered]@{ summary = @($summary); counts = $counts; policies = $byId; namedLocations = $locs }
}

function Test-FmwPim {
    <#
    .SYNOPSIS
        Checks role assignments against ScubaGear MS.AAD.7.1v1 (2 to 8 Global Administrators) and
        MS.AAD.7.4v1 (no permanent active assignment to a privileged role). Makes no Graph call.
    .EXAMPLE
        $pim = Get-Content ./tests/fixtures/pim.json -Raw | ConvertFrom-Json -AsHashtable -DateKind String
        Test-FmwPim -RoleDefinitions $pim.roleDefinitions -Eligibility $pim.eligibility -Assignments $pim.assignments -PrivilegedRoleIds 62e90394-69f5-4237-9190-012177145e10
    #>

    <# ScubaGear MS.AAD.7.1v1 (2 to 8 Global Administrators) and MS.AAD.7.4v1 (no permanent active privileged assignment). #>
    param([object[]]$RoleDefinitions, [object[]]$Eligibility = @(), [object[]]$Assignments = @(), [Parameter(Mandatory)][string[]]$PrivilegedRoleIds)
    $names = @{}
    foreach ($r in $RoleDefinitions) {
        $names[[string](Get-FmwValue $r 'templateId' $r.id)] = [string](Get-FmwValue $r 'displayName' '')
        $names[[string]$r.id] = [string](Get-FmwValue $r 'displayName' '')
    }
    $permanent = [System.Collections.Generic.List[object]]::new()
    foreach ($a in $Assignments) {
        if ($PrivilegedRoleIds -notcontains $a.roleDefinitionId -or (Get-FmwValue $a 'assignmentType') -ne 'Assigned') { continue }
        $exp = Get-FmwValue (Get-FmwValue $a 'scheduleInfo') 'expiration'
        $type = Get-FmwValue $exp 'type'
        if (($null -eq $type -or $type -in 'noExpiration', 'notSpecified') -and -not (Get-FmwValue $exp 'endDateTime')) {
            $permanent.Add([ordered]@{ principalId = $a.principalId; roleDefinitionId = $a.roleDefinitionId; role = [string]$names[$a.roleDefinitionId]; memberType = [string](Get-FmwValue $a 'memberType' '') })
        }
    }
    $ga = @(@($Eligibility) + @($Assignments) | Where-Object { $_.roleDefinitionId -eq $script:GlobalAdmin } | ForEach-Object { $_.principalId } | Sort-Object -Unique)
    [ordered]@{
        globalAdministrators = $ga.Count
        'MS.AAD.7.1v1'       = if ($ga.Count -ge 2 -and $ga.Count -le 8) { 'pass' } else { 'fail' }
        permanentActive      = @($permanent | Sort-Object @{ e = { $_.role } }, @{ e = { $_.principalId } })
        'MS.AAD.7.4v1'       = if ($permanent.Count -eq 0) { 'pass' } else { 'fail' }
    }
}

function Test-FmwAppCredential {
    <#
    .SYNOPSIS
        Lists every application password and certificate with its lifetime and days left, flagged
        against ScubaGear MS.AAD.5.5v1, 5.6v1 and 5.7v1, and marked expired or expiring. Makes no Graph call.
    .EXAMPLE
        $apps = (Get-Content ./tests/fixtures/apps.json -Raw | ConvertFrom-Json -AsHashtable -DateKind String).applications
        Test-FmwAppCredential -Applications $apps -AsOf ([datetimeoffset]'2026-10-25T00:00:00Z')
    #>

    <# ScubaGear MS.AAD.5.5v1 (no app passwords), 5.6v1 (password lifetime <= 180 days), 5.7v1 (certificate <= 365). #>
    param([Parameter(Mandatory)][object[]]$Applications, [Parameter(Mandatory)][datetimeoffset]$AsOf, [int]$ExpiringDays = 30)
    $rows = [System.Collections.Generic.List[object]]::new()
    foreach ($app in $Applications) {
        foreach ($set in @(
                @{ Kind = 'password'; Creds = @(Get-FmwValue $app 'passwordCredentials' @()); Limit = 180; Rule = 'MS.AAD.5.6v1' },
                @{ Kind = 'certificate'; Creds = @(Get-FmwValue $app 'keyCredentials' @()); Limit = 365; Rule = 'MS.AAD.5.7v1' })) {
            foreach ($c in $set.Creds) {
                if ($null -eq $c) { continue }
                $start = ConvertTo-FmwUtc (Get-FmwValue $c 'startDateTime'); $end = ConvertTo-FmwUtc (Get-FmwValue $c 'endDateTime')
                $lifetime = if ($start -and $end) { Get-FmwDays $start $end } else { $null }
                $left = if ($end) { Get-FmwDays $AsOf $end } else { $null }
                $flags = [System.Collections.Generic.List[string]]::new()
                if ($set.Kind -eq 'password') { $flags.Add('MS.AAD.5.5v1') }
                if ($null -ne $lifetime -and $lifetime -gt $set.Limit) { $flags.Add($set.Rule) }
                if ($null -ne $left -and $left -lt 0) { $flags.Add('expired') } elseif ($null -ne $left -and $left -le $ExpiringDays) { $flags.Add('expiring') }
                $rows.Add([ordered]@{
                        appId = [string](Get-FmwValue $app 'appId' ''); displayName = [string](Get-FmwValue $app 'displayName' ''); kind = $set.Kind
                        keyId = [string](Get-FmwValue $c 'keyId' ''); lifetimeDays = $lifetime; daysLeft = $left; flags = @($flags)
                    })
            }
        }
    }
    , @($rows | Sort-Object @{ e = { if ($null -ne $_.daysLeft) { $_.daysLeft } else { 1000000 } } }, @{ e = { $_.displayName } }, @{ e = { $_.keyId } })
}

function Test-FmwMfaRegistration {
    <#
    .SYNOPSIS
        Counts members who aren't MFA registered or have no phishing-resistant method, and lists admins
        without one, toward ScubaGear MS.AAD.3.1v1. Makes no Graph call.
    .EXAMPLE
        $mfa = Get-Content ./tests/fixtures/mfa.json -Raw | ConvertFrom-Json -AsHashtable
        Test-FmwMfaRegistration -Details $mfa.registrationDetails
    #>

    <# Counts toward ScubaGear MS.AAD.3.1v1 (phishing-resistant MFA for all users). #>
    param([Parameter(Mandatory)][object[]]$Details)
    $members = @($Details | Where-Object { (Get-FmwValue $_ 'userType' 'member') -eq 'member' })
    $hasPr = { param($d) [bool](@(Get-FmwValue $d 'methodsRegistered' @()) | Where-Object { $script:PhishingResistant -contains $_ }) }
    [ordered]@{
        members                         = $members.Count
        notMfaRegistered                = @($members | Where-Object { -not (Get-FmwValue $_ 'isMfaRegistered' $false) }).Count
        noPhishingResistantMethod       = @($members | Where-Object { -not (& $hasPr $_) }).Count
        admins                          = @($members | Where-Object { Get-FmwValue $_ 'isAdmin' $false }).Count
        adminsNoPhishingResistantMethod = @($members | Where-Object { (Get-FmwValue $_ 'isAdmin' $false) -and -not (& $hasPr $_) } | ForEach-Object { $_.userPrincipalName } | Sort-Object)
    }
}

function Invoke-FmwEntraTask {
    <#
    .SYNOPSIS
        Runs one read-only Entra ID task after Connect-FmwGraph: checks the session's permissions,
        reads the data from Graph and returns the findings. For ca-export, -OutDirectory also writes the policies as JSON.
    .EXAMPLE
        Invoke-FmwEntraTask -Task pim-report -PrivilegedRoleIds 62e90394-69f5-4237-9190-012177145e10, e8611ab8-c189-46e8-94e1-60213ab1f814
    #>

    <# Fetch from Graph (after Connect-FmwGraph) and evaluate. Read-only. #>
    param(
        [Parameter(Mandatory)][ValidateSet('stale-users', 'ca-export', 'pim-report', 'app-credentials', 'mfa-registration')][string]$Task,
        [int]$Days = 90,
        [string[]]$PrivilegedRoleIds = @($script:GlobalAdmin),
        [string]$OutDirectory
    )
    Assert-FmwSessionRole -Task $Task
    $asOf = [datetimeoffset]::UtcNow
    switch ($Task) {
        'stale-users' { Test-FmwStaleUser -Users @(Get-FmwGraphCollection '/v1.0/users?$select=id,userPrincipalName,accountEnabled,userType,createdDateTime,signInActivity&$top=500' -Task $Task) -AsOf $asOf -Days $Days }
        'ca-export' {
            $export = ConvertTo-FmwCaExport -Policies @(Get-FmwGraphCollection '/v1.0/identity/conditionalAccess/policies' -Task $Task) -NamedLocations @(Get-FmwGraphCollection '/v1.0/identity/conditionalAccess/namedLocations' -Task $Task)
            if ($OutDirectory) {
                New-Item -ItemType Directory -Force -Path $OutDirectory | Out-Null
                foreach ($id in $export.policies.Keys) { $export.policies[$id] | ConvertTo-Json -Depth 20 | Set-Content -Path (Join-Path $OutDirectory "$id.json") -Encoding utf8NoBOM }
                $export.namedLocations | ConvertTo-Json -Depth 20 | Set-Content -Path (Join-Path $OutDirectory 'named-locations.json') -Encoding utf8NoBOM
            }
            [ordered]@{ summary = $export.summary; counts = $export.counts }
        }
        'pim-report' {
            Test-FmwPim -RoleDefinitions @(Get-FmwGraphCollection '/v1.0/roleManagement/directory/roleDefinitions?$select=id,templateId,displayName,isBuiltIn' -Task $Task) `
                -Eligibility @(Get-FmwGraphCollection '/v1.0/roleManagement/directory/roleEligibilitySchedules' -Task $Task) `
                -Assignments @(Get-FmwGraphCollection '/v1.0/roleManagement/directory/roleAssignmentSchedules' -Task $Task) -PrivilegedRoleIds $PrivilegedRoleIds
        }
        'app-credentials' { Test-FmwAppCredential -Applications @(Get-FmwGraphCollection '/v1.0/applications?$select=id,appId,displayName,passwordCredentials,keyCredentials&$top=999' -Task $Task) -AsOf $asOf }
        'mfa-registration' { Test-FmwMfaRegistration -Details @(Get-FmwGraphCollection '/v1.0/reports/authenticationMethods/userRegistrationDetails' -Task $Task) }
    }
}

# ------------------------------------------------------------ Intune (Module 3)
# The same rules as python/intune_tasks.py. Read-only; no task selects a user's name, email or UPN.

$script:IntunePermissions = [ordered]@{
    'noncompliant-devices' = @('DeviceManagementManagedDevices.Read.All', 'DeviceManagementConfiguration.Read.All')
    'compliance-coverage'  = @('DeviceManagementManagedDevices.Read.All', 'DeviceManagementConfiguration.Read.All')
    'stale-checkin'        = @('DeviceManagementManagedDevices.Read.All')
    'device-posture'       = @('DeviceManagementManagedDevices.Read.All')
    'autopilot-profiles'   = @('DeviceManagementServiceConfig.Read.All')   # beta endpoint
}
$script:DeviceSelect = 'id,deviceName,operatingSystem,osVersion,complianceState,lastSyncDateTime,complianceGracePeriodExpirationDateTime,isEncrypted,managedDeviceOwnerType,azureADDeviceId'
$script:StatusSelect = 'id,deviceDisplayName,status,lastReportedDateTime'
$script:AutopilotSelect = 'id,serialNumber,groupTag,enrollmentState,lastContactedDateTime,managedDeviceId,deploymentProfileAssignmentStatus,deploymentProfileAssignmentDetailedStatus,deploymentProfileAssignedDateTime'
$script:ExclusionTarget = '#microsoft.graph.exclusionGroupAssignmentTarget'
$script:AttentionStates = @('noncompliant', 'inGracePeriod', 'error', 'conflict')
$script:FailingStatuses = @('nonCompliant', 'error', 'conflict')
$script:NotAppliedStatuses = @('notApplicable', 'notAssigned')

function Get-FmwIntunePermission {
    <#
    .SYNOPSIS
        Returns the least-privileged application permissions for one Intune task, or the sorted
        union for all of them.
    .EXAMPLE
        Get-FmwIntunePermission -Task autopilot-profiles
    #>

    <# The least-privileged application permissions for one Intune task, or all of them. #>
    param([ValidateSet('noncompliant-devices', 'compliance-coverage', 'stale-checkin', 'device-posture', 'autopilot-profiles')][string]$Task)
    if ($Task) { return , @($script:IntunePermissions[$Task]) }
    , @($script:IntunePermissions.Values | ForEach-Object { $_ } | Sort-Object -Unique)
}

function Get-FmwNameCount {
    param([object[]]$Devices)
    $c = [System.Collections.Generic.Dictionary[string, int]]::new([System.StringComparer]::Ordinal)
    foreach ($d in $Devices) { $n = [string](Get-FmwValue $d 'deviceName' ''); $c[$n] = 1 + $(if ($c.ContainsKey($n)) { $c[$n] } else { 0 }) }
    , $c
}

function Test-FmwIntuneNoncompliant {
    <#
    .SYNOPSIS
        Lists managed devices whose compliance state needs attention (noncompliant, in grace period,
        error or conflict) with the policies that report them failing, and counts by state.
    .EXAMPLE
        $intune = Get-Content ./tests/fixtures/intune.json -Raw | ConvertFrom-Json -AsHashtable -DateKind String
        Test-FmwIntuneNoncompliant -Devices $intune.managedDevices -Policies $intune.compliancePolicies
    #>

    <# Devices whose compliance state needs attention, with the policies that report them failing. Joined on device name. #>
    param([Parameter(Mandatory)][object[]]$Devices, [object[]]$Policies = @())
    $counts = Get-FmwNameCount $Devices
    $failing = [System.Collections.Generic.Dictionary[string, System.Collections.Generic.HashSet[string]]]::new([System.StringComparer]::Ordinal)
    foreach ($p in $Policies) {
        foreach ($s in @(Get-FmwValue $p 'deviceStatuses' @())) {
            if ($null -eq $s) { continue }
            $st = [string](Get-FmwValue $s 'status' '')
            if ($script:FailingStatuses -cnotcontains $st) { continue }
            $n = [string](Get-FmwValue $s 'deviceDisplayName' '')
            if (-not $failing.ContainsKey($n)) { $failing[$n] = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal) }
            [void]$failing[$n].Add("$(Get-FmwValue $p 'displayName' '') ($st)")
        }
    }
    $rows = [System.Collections.Generic.List[object]]::new()
    foreach ($d in $Devices) {
        $state = [string](Get-FmwValue $d 'complianceState' 'unknown')
        if ($script:AttentionStates -cnotcontains $state) { continue }
        $name = [string](Get-FmwValue $d 'deviceName' '')
        $fp = if ($failing.ContainsKey($name)) { @($failing[$name] | Sort-Object) } else { @() }
        $rows.Add([ordered]@{
                id              = $d.id
                deviceName      = $name
                operatingSystem = [string](Get-FmwValue $d 'operatingSystem' '')
                complianceState = $state
                graceExpires    = (Format-FmwUtc (ConvertTo-FmwUtc (Get-FmwValue $d 'complianceGracePeriodExpirationDateTime')))
                failingPolicies = @($fp)
                nameNotUnique   = ($counts[$name] -gt 1)
            })
    }
    $sorted = @($rows | Sort-Object @{ e = { [array]::IndexOf($script:AttentionStates, $_.complianceState) } }, @{ e = { $_.deviceName } }, @{ e = { $_.id } })
    $byState = [ordered]@{}
    foreach ($s in $script:AttentionStates) { $byState[$s] = @($sorted | Where-Object { $_.complianceState -ceq $s }).Count }
    [ordered]@{ devices = $sorted; counts = $byState }
}

function Test-FmwIntuneComplianceCoverage {
    <#
    .SYNOPSIS
        Finds compliance policies with no assignment or only exclusions, and managed devices that
        no compliance policy reports on. Also lists device names that aren't unique.
    .EXAMPLE
        $intune = Get-Content ./tests/fixtures/intune.json -Raw | ConvertFrom-Json -AsHashtable -DateKind String
        Test-FmwIntuneComplianceCoverage -Devices $intune.managedDevices -Policies $intune.compliancePolicies
    #>

    <# Compliance policies with no assignment or only exclusions; managed devices no compliance policy reports on. #>
    param([Parameter(Mandatory)][object[]]$Devices, [object[]]$Policies = @())
    $rows = [System.Collections.Generic.List[object]]::new()
    foreach ($p in ($Policies | Sort-Object @{ e = { [string](Get-FmwValue $_ 'displayName' '') } }, @{ e = { $_.id } })) {
        $types = @(@(Get-FmwValue $p 'assignments' @()) | Where-Object { $null -ne $_ } | ForEach-Object { [string](Get-FmwValue (Get-FmwValue $_ 'target') '@odata.type' '') })
        $include = @($types | Where-Object { $_ -cne $script:ExclusionTarget })
        $finding = if ($types.Count -eq 0) { 'unassigned' } elseif ($include.Count -eq 0) { 'exclusionOnly' } else { $null }
        $rows.Add([ordered]@{
                id             = $p.id
                displayName    = [string](Get-FmwValue $p 'displayName' '')
                type           = ([string](Get-FmwValue $p '@odata.type' '')).Replace('#microsoft.graph.', '')
                includeTargets = $include.Count
                excludeTargets = $types.Count - $include.Count
                finding        = $finding
            })
    }
    $covered = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    foreach ($p in $Policies) {
        foreach ($s in @(Get-FmwValue $p 'deviceStatuses' @())) {
            if ($null -ne $s -and $script:NotAppliedStatuses -cnotcontains [string](Get-FmwValue $s 'status' '')) { [void]$covered.Add([string](Get-FmwValue $s 'deviceDisplayName' '')) }
        }
    }
    $uncovered = @($Devices | Where-Object { -not $covered.Contains([string](Get-FmwValue $_ 'deviceName' '')) } |
            ForEach-Object { [ordered]@{ id = $_.id; deviceName = [string](Get-FmwValue $_ 'deviceName' ''); operatingSystem = [string](Get-FmwValue $_ 'operatingSystem' '') } } |
            Sort-Object @{ e = { $_.deviceName } }, @{ e = { $_.id } })
    $counts = Get-FmwNameCount $Devices
    [ordered]@{
        policies                    = @($rows)
        policyFindings              = @($rows | Where-Object { $_.finding }).Count
        devicesWithNoPolicyReported = $uncovered
        ambiguousNames              = @($counts.Keys | Where-Object { $counts[$_] -gt 1 } | Sort-Object)
    }
}

function Test-FmwIntuneStaleCheckin {
    <#
    .SYNOPSIS
        Lists managed devices whose last Intune sync is at least -ValidityDays old, or that never
        synced, banded as beyondValidity, beyondCleanup (-CleanupDays) or noSync.
    .EXAMPLE
        $intune = Get-Content ./tests/fixtures/intune.json -Raw | ConvertFrom-Json -AsHashtable -DateKind String
        Test-FmwIntuneStaleCheckin -Devices $intune.managedDevices -AsOf ([datetimeoffset]'2026-10-30T00:00:00Z') -ValidityDays 30 -CleanupDays 120
    #>

    <# Managed devices whose last Intune sync is older than the compliance validity period or the cleanup age. #>
    param([Parameter(Mandatory)][object[]]$Devices, [Parameter(Mandatory)][datetimeoffset]$AsOf, [int]$ValidityDays = 14, [int]$CleanupDays = 90)
    $rows = [System.Collections.Generic.List[object]]::new()
    foreach ($d in $Devices) {
        $last = ConvertTo-FmwUtc (Get-FmwValue $d 'lastSyncDateTime')
        if ($last -and $last.Year -le 1970) { $last = $null }   # placeholder date: never synced
        $days = if ($last) { Get-FmwDays $last $AsOf } else { $null }
        if ($null -ne $days -and $days -lt $ValidityDays) { continue }
        $band = if ($null -eq $days) { 'noSync' } elseif ($days -ge $CleanupDays) { 'beyondCleanup' } else { 'beyondValidity' }
        $rows.Add([ordered]@{
                id = $d.id; deviceName = [string](Get-FmwValue $d 'deviceName' ''); operatingSystem = [string](Get-FmwValue $d 'operatingSystem' '')
                lastSync = (Format-FmwUtc $last); daysSinceSync = $days; band = $band
            })
    }
    , @($rows | Sort-Object @{ e = { $null -ne $_.daysSinceSync } }, @{ e = { - [int]($_.daysSinceSync ?? 0) } }, @{ e = { $_.deviceName } }, @{ e = { $_.id } })
}

function ConvertTo-FmwVersionPart {
    <# '10.0.22631.4317' -> 10, 0, 22631, 4317; a part that isn't a number counts as 0. #>
    param([string]$Value)
    , @(([string]$Value).Split('.') | ForEach-Object { if ($_ -match '^\d+$') { [int]$_ } else { 0 } })
}

function Test-FmwVersionBelow {
    <#
    .SYNOPSIS
        Returns $true when a dotted version is lower than -Floor, compared part by part. A missing
        or non-numeric part counts as 0.
    .EXAMPLE
        Test-FmwVersionBelow -Version '10.0.22631.4317' -Floor '10.0.26100'   # True
    #>
    param([string]$Version, [Parameter(Mandatory)][string]$Floor)
    $a = ConvertTo-FmwVersionPart $Version; $b = ConvertTo-FmwVersionPart $Floor
    $n = [math]::Max($a.Count, $b.Count)
    for ($i = 0; $i -lt $n; $i++) {
        $x = if ($i -lt $a.Count) { $a[$i] } else { 0 }; $y = if ($i -lt $b.Count) { $b[$i] } else { 0 }
        if ($x -ne $y) { return $x -lt $y }
    }
    $false
}

function Test-FmwIntunePosture {
    <#
    .SYNOPSIS
        Lists devices that don't report encryption on the platforms in -EncryptionOs, or whose OS
        version is below the floor for their platform in -OsFloors, with counts.
    .EXAMPLE
        $intune = Get-Content ./tests/fixtures/intune.json -Raw | ConvertFrom-Json -AsHashtable -DateKind String
        Test-FmwIntunePosture -Devices $intune.managedDevices -OsFloors @{ Windows = '10.0.26200'; iOS = '26.0' }
    #>

    <# Devices not reporting encryption (on the platforms named), or below the OS floor for their platform. #>
    param([Parameter(Mandatory)][object[]]$Devices, [System.Collections.IDictionary]$OsFloors = @{ Windows = '10.0.26100' }, [string[]]$EncryptionOs = @('Windows', 'macOS'))
    $rows = [System.Collections.Generic.List[object]]::new()
    foreach ($d in $Devices) {
        $os = [string](Get-FmwValue $d 'operatingSystem' '')
        $enc = Get-FmwValue $d 'isEncrypted'
        $findings = [System.Collections.Generic.List[string]]::new()
        if ($EncryptionOs -ccontains $os -and -not ($enc -is [bool] -and $enc)) { $findings.Add('notEncrypted') }
        if ($OsFloors.Contains($os) -and (Test-FmwVersionBelow ([string](Get-FmwValue $d 'osVersion' '')) $OsFloors[$os])) { $findings.Add('belowOsFloor') }
        if ($findings.Count) {
            $rows.Add([ordered]@{
                    id = $d.id; deviceName = [string](Get-FmwValue $d 'deviceName' ''); operatingSystem = $os
                    osVersion = [string](Get-FmwValue $d 'osVersion' ''); isEncrypted = $enc; findings = @($findings)
                })
        }
    }
    $sorted = @($rows | Sort-Object @{ e = { $_.deviceName } }, @{ e = { $_.id } })
    [ordered]@{
        devices      = @($Devices).Count
        notEncrypted = @($sorted | Where-Object { $_.findings -ccontains 'notEncrypted' }).Count
        belowOsFloor = @($sorted | Where-Object { $_.findings -ccontains 'belowOsFloor' }).Count
        findings     = $sorted
    }
}

function Test-FmwAutopilotProfile {
    <#
    .SYNOPSIS
        Counts Windows Autopilot registrations by deployment profile assignment status (a beta-only
        property) and lists every one that isn't assignedInSync.
    .EXAMPLE
        $intune = Get-Content ./tests/fixtures/intune.json -Raw | ConvertFrom-Json -AsHashtable -DateKind String
        Test-FmwAutopilotProfile -Identities $intune.autopilotDevices
    #>

    <# Autopilot registrations by deployment profile assignment status (a beta-only property); every one not assignedInSync is listed. #>
    param([Parameter(Mandatory)][object[]]$Identities)
    $counts = [System.Collections.Generic.Dictionary[string, int]]::new([System.StringComparer]::Ordinal)
    $rows = [System.Collections.Generic.List[object]]::new()
    foreach ($a in $Identities) {
        $status = [string](Get-FmwValue $a 'deploymentProfileAssignmentStatus' '')
        if (-not $status) { $status = 'unknown' }
        $counts[$status] = 1 + $(if ($counts.ContainsKey($status)) { $counts[$status] } else { 0 })
        if ($status -cne 'assignedInSync') {
            $rows.Add([ordered]@{
                    id = $a.id; serialNumber = [string](Get-FmwValue $a 'serialNumber' ''); groupTag = [string](Get-FmwValue $a 'groupTag' '')
                    status = $status; detail = [string](Get-FmwValue $a 'deploymentProfileAssignmentDetailedStatus' ''); enrollmentState = [string](Get-FmwValue $a 'enrollmentState' '')
                })
        }
    }
    $byStatus = [ordered]@{}
    foreach ($k in ($counts.Keys | Sort-Object -CaseSensitive)) { $byStatus[$k] = $counts[$k] }
    [ordered]@{
        total     = @($Identities).Count
        counts    = $byStatus
        notInSync = @($rows | Sort-Object @{ e = { $_.status } }, @{ e = { $_.serialNumber } }, @{ e = { $_.id } })
    }
}

function Get-FmwIntuneCompliancePolicy {
    <# Each compliance policy with its assignments and per-device statuses embedded (the shape the Test- functions read). #>
    param([Parameter(Mandatory)][string]$Task)
    foreach ($p in @(Get-FmwGraphCollection '/v1.0/deviceManagement/deviceCompliancePolicies?$select=id,displayName' -Task $Task)) {
        $base = "/v1.0/deviceManagement/deviceCompliancePolicies/$($p['id'])"
        $p['assignments'] = @(Get-FmwGraphCollection "$base/assignments" -Task $Task)
        $p['deviceStatuses'] = @(Get-FmwGraphCollection "$base/deviceStatuses?`$select=$script:StatusSelect" -Task $Task)
        $p
    }
}

function Invoke-FmwIntuneTask {
    <#
    .SYNOPSIS
        Runs one read-only Intune task after Connect-FmwGraph: checks the session's permissions, reads
        devices and compliance policies from Graph and returns the findings. autopilot-profiles reads beta.
    .EXAMPLE
        Invoke-FmwIntuneTask -Task device-posture -OsFloors @{ Windows = '10.0.26100' }
    #>

    <# Fetch from Graph (after Connect-FmwGraph) and evaluate. Read-only. autopilot-profiles reads the beta endpoint. #>
    param(
        [Parameter(Mandatory)][ValidateSet('noncompliant-devices', 'compliance-coverage', 'stale-checkin', 'device-posture', 'autopilot-profiles')][string]$Task,
        [int]$ValidityDays = 14,
        [int]$CleanupDays = 90,
        [System.Collections.IDictionary]$OsFloors = @{ Windows = '10.0.26100' }
    )
    Assert-FmwSessionRole -Task $Task
    if ($Task -eq 'autopilot-profiles') {
        # Beta, read without depending on it: not offered in GCC High or DoD, or a changed beta shape,
        # gives "not evaluated" instead of a failed run.
        $beta = Get-FmwBetaCollection -Path "/deviceManagement/windowsAutopilotDeviceIdentities?`$select=$script:AutopilotSelect" -Task $Task
        if (-not $beta.available) { return [ordered]@{ stage = 'beta'; evaluated = $false; reason = $beta.reason } }
        $r = [ordered]@{ stage = 'beta'; evaluated = $true }
        $eval = Test-FmwAutopilotProfile -Identities $beta.items
        foreach ($k in $eval.Keys) { $r[$k] = $eval[$k] }
        return $r
    }
    $devices = @(Get-FmwGraphCollection "/v1.0/deviceManagement/managedDevices?`$select=$script:DeviceSelect" -Task $Task)
    switch ($Task) {
        'noncompliant-devices' { Test-FmwIntuneNoncompliant -Devices $devices -Policies @(Get-FmwIntuneCompliancePolicy -Task $Task) }
        'compliance-coverage' { Test-FmwIntuneComplianceCoverage -Devices $devices -Policies @(Get-FmwIntuneCompliancePolicy -Task $Task) }
        'stale-checkin' { Test-FmwIntuneStaleCheckin -Devices $devices -AsOf ([datetimeoffset]::UtcNow) -ValidityDays $ValidityDays -CleanupDays $CleanupDays }
        'device-posture' { Test-FmwIntunePosture -Devices $devices -OsFloors $OsFloors }
    }
}

Export-ModuleMember -Function Get-FmwCloud, Connect-FmwGraph, Get-FmwGraphCollection, Get-FmwGraphCall, Get-FmwCallPermission, Assert-FmwGraphCall, Get-FmwBetaCollection, Get-FmwTokenRole, Test-FmwTokenRole, Test-FmwSessionRole, Assert-FmwSessionRole, Test-FmwStaleUser, ConvertTo-FmwCaExport, Test-FmwPim, Test-FmwAppCredential, Test-FmwMfaRegistration, Invoke-FmwEntraTask, ConvertTo-FmwUtc, Format-FmwUtc,
    Get-FmwIntunePermission, Test-FmwIntuneNoncompliant, Test-FmwIntuneComplianceCoverage, Test-FmwIntuneStaleCheckin, Test-FmwIntunePosture, Test-FmwAutopilotProfile, Test-FmwVersionBelow, Invoke-FmwIntuneTask
