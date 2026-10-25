#Requires -Version 7.5
<#
.SYNOPSIS
    Read-only Microsoft Entra ID checks through Microsoft Graph PowerShell, for the workbook's
    automation Modules 1 and 2. The same rules as python/entra_tasks.py, tested against the
    same fixtures and expected results.

.DESCRIPTION
    Connect-FmwGraph picks the right cloud (GCC is the worldwide service; GCC High and DoD
    have their own environments) and signs in with a certificate or a managed identity,
    never a client secret. Get-FmwGraphCollection follows @odata.nextLink. The Test-* and
    ConvertTo-* functions are pure: they take Graph objects and return findings, so they
    can be tested without a tenant.

    Requires the Microsoft.Graph.Authentication module for Connect-MgGraph and
    Invoke-MgGraphRequest; the pure functions need nothing.
#>

Set-StrictMode -Version Latest

$script:GlobalAdmin = '62e90394-69f5-4237-9190-012177145e10'   # Global Administrator role template ID

# Microsoft Learn, "Use Microsoft Graph PowerShell authentication commands" (Get-MgEnvironment).
$script:Clouds = @{
    global  = @{ Environment = 'Global';   Graph = 'https://graph.microsoft.com' }
    gcc     = @{ Environment = 'Global';   Graph = 'https://graph.microsoft.com' }
    gcchigh = @{ Environment = 'USGov';    Graph = 'https://graph.microsoft.us' }
    dod     = @{ Environment = 'USGovDoD'; Graph = 'https://dod-graph.microsoft.us' }
}

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
    param([Parameter(Mandatory)][ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud)
    $script:Clouds[$Cloud]
}

function Connect-FmwGraph {
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
    if ($PSCmdlet.ParameterSetName -eq 'Certificate') {
        Connect-MgGraph -Environment $envName -TenantId $TenantId -ClientId $ClientId -CertificateThumbprint $CertificateThumbprint -NoWelcome
    } elseif ($ManagedIdentityClientId) {
        Connect-MgGraph -Environment $envName -Identity -ClientId $ManagedIdentityClientId -NoWelcome
    } else {
        Connect-MgGraph -Environment $envName -Identity -NoWelcome
    }
}

function Get-FmwGraphCollection {
    <# Every item of a collection, following @odata.nextLink. Invoke-MgGraphRequest retries throttled calls itself. #>
    param([Parameter(Mandatory)][string]$Uri, [switch]$Advanced)
    $headers = @{ 'x-ms-throttle-priority' = 'Low' }
    if ($Advanced) { $headers['ConsistencyLevel'] = 'eventual' }
    $next = $Uri
    while ($next) {
        $page = Invoke-MgGraphRequest -Method GET -Uri $next -Headers $headers -OutputType Hashtable
        foreach ($item in $page['value']) { $item }
        $next = $page['@odata.nextLink']
    }
}

function ConvertTo-FmwUtc {
    param($Value)
    if ($null -eq $Value -or "$Value" -eq '') { return $null }
    if ($Value -is [datetime]) { return [datetimeoffset]::new($Value.ToUniversalTime(), [timespan]::Zero) }
    if ($Value -is [datetimeoffset]) { return $Value.ToUniversalTime() }
    [datetimeoffset]::Parse([string]$Value, [cultureinfo]::InvariantCulture).ToUniversalTime()
}

function Format-FmwUtc {
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
    <# Fetch from Graph (after Connect-FmwGraph) and evaluate. Read-only. #>
    param(
        [Parameter(Mandatory)][ValidateSet('stale-users', 'ca-export', 'pim-report', 'app-credentials', 'mfa-registration')][string]$Task,
        [int]$Days = 90,
        [string[]]$PrivilegedRoleIds = @($script:GlobalAdmin),
        [string]$OutDirectory
    )
    $asOf = [datetimeoffset]::UtcNow
    switch ($Task) {
        'stale-users' { Test-FmwStaleUser -Users @(Get-FmwGraphCollection '/v1.0/users?$select=id,userPrincipalName,accountEnabled,userType,createdDateTime,signInActivity&$top=500') -AsOf $asOf -Days $Days }
        'ca-export' {
            $export = ConvertTo-FmwCaExport -Policies @(Get-FmwGraphCollection '/v1.0/identity/conditionalAccess/policies') -NamedLocations @(Get-FmwGraphCollection '/v1.0/identity/conditionalAccess/namedLocations')
            if ($OutDirectory) {
                New-Item -ItemType Directory -Force -Path $OutDirectory | Out-Null
                foreach ($id in $export.policies.Keys) { $export.policies[$id] | ConvertTo-Json -Depth 20 | Set-Content -Path (Join-Path $OutDirectory "$id.json") -Encoding utf8NoBOM }
                $export.namedLocations | ConvertTo-Json -Depth 20 | Set-Content -Path (Join-Path $OutDirectory 'named-locations.json') -Encoding utf8NoBOM
            }
            [ordered]@{ summary = $export.summary; counts = $export.counts }
        }
        'pim-report' {
            Test-FmwPim -RoleDefinitions @(Get-FmwGraphCollection '/v1.0/roleManagement/directory/roleDefinitions?$select=id,templateId,displayName,isBuiltIn') `
                -Eligibility @(Get-FmwGraphCollection '/v1.0/roleManagement/directory/roleEligibilitySchedules') `
                -Assignments @(Get-FmwGraphCollection '/v1.0/roleManagement/directory/roleAssignmentSchedules') -PrivilegedRoleIds $PrivilegedRoleIds
        }
        'app-credentials' { Test-FmwAppCredential -Applications @(Get-FmwGraphCollection '/v1.0/applications?$select=id,appId,displayName,passwordCredentials,keyCredentials&$top=999') -AsOf $asOf }
        'mfa-registration' { Test-FmwMfaRegistration -Details @(Get-FmwGraphCollection '/v1.0/reports/authenticationMethods/userRegistrationDetails') }
    }
}

Export-ModuleMember -Function Get-FmwCloud, Connect-FmwGraph, Get-FmwGraphCollection, Test-FmwStaleUser, ConvertTo-FmwCaExport, Test-FmwPim, Test-FmwAppCredential, Test-FmwMfaRegistration, Invoke-FmwEntraTask, ConvertTo-FmwUtc, Format-FmwUtc
