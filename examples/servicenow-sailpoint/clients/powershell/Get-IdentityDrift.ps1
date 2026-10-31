#Requires -Version 7.2
<#
.SYNOPSIS
Read-only drift reconciliation: HR extract vs Microsoft Graph vs SailPoint ISC, joined on employeeId.

.DESCRIPTION
Emits findings for the Book 03 drift classes this script can compute: missing identity,
stale access, orphan account, attribute drift, and unauthorized write (only when an Entra
audit extract is supplied or fetched). Credential and schema drift are reported as not
computed. Output: JSON (findings plus what was and wasn't computed) and CSV.

Nothing here writes to Entra ID or ISC. -PushToServiceNow lists what it would send
unless -Apply is also given.

Illustrative: unit-tested with Pester against mocked responses, not yet proven against
live tenants.

.EXAMPLE
./Get-IdentityDrift.ps1 -HrCsv ./hr.csv -GraphUsersJson ./users.json -IscIdentitiesJson ./ids.json -IscAccountsJson ./accts.json

.EXAMPLE
./Get-IdentityDrift.ps1 -HrCsv ./hr.csv -ConfigPath ../../config/config.example.json -IncludeAuditSince 2026-10-17T00:00:00Z
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)][string]$HrCsv,
    [string]$ConfigPath,
    [string]$GraphUsersJson,
    [string]$IscIdentitiesJson,
    [string]$IscAccountsJson,
    [string]$EntraAuditJson,
    [string]$IncludeAuditSince,
    [switch]$SkipGraph,
    [switch]$SkipIsc,
    [string]$OutJson = 'identity-drift.json',
    [string]$OutCsv = 'identity-drift.csv',
    [switch]$PushToServiceNow,
    [switch]$Apply
)

Import-Module (Join-Path $PSScriptRoot 'IdentityKit.psm1') -Force

function Read-KitJsonFile([string]$Path) {
    <#
    .SYNOPSIS
    Read a JSON file and return its items: the 'value' array of a Graph-style page, or the
    parsed content as an array. Returns $null when no path is given.
    .EXAMPLE
    $graphUsers = Read-KitJsonFile ./tests/fixtures/graph_users.json
    #>
    if (-not $Path) { return $null }
    $data = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    if ($data -isnot [array] -and $null -ne $data.value) { return @($data.value) }
    return @($data)
}

$config = Get-KitConfig -Path $ConfigPath
$hr = Import-KitHrCsv -Path $HrCsv
$splat = @{ Hr = $hr; Options = @{
        isc_employee_id_attribute = $config.ISC_EMPLOYEE_ID_ATTRIBUTE
        isc_authoritative_sources = @("$($config.ISC_AUTHORITATIVE_SOURCES)" -split ',' | Where-Object { $_ })
        allowed_writer_app_ids    = @("$($config.ALLOWED_WRITER_APP_IDS)" -split ',' | Where-Object { $_ })
    }
}

$graphUsers = Read-KitJsonFile $GraphUsersJson
$audit = Read-KitJsonFile $EntraAuditJson
if ($null -eq $graphUsers -and -not $SkipGraph) {
    $gh = Get-KitGraphHeader -Config $config
    $graphRoot = (Get-KitGraphEndpoint -Config $config)[1]
    $graphUsers = @(Get-KitGraphPaged -Headers $gh -Uri "$graphRoot/v1.0/users?`$select=id,userPrincipalName,displayName,employeeId,accountEnabled,department,userType&`$expand=manager(`$select=id,employeeId)&`$top=999")
    if ($IncludeAuditSince) {
        $filter = [uri]::EscapeDataString("activityDateTime ge $IncludeAuditSince and category eq 'UserManagement'")
        $audit = @(Get-KitGraphPaged -Headers $gh -Uri "$graphRoot/v1.0/auditLogs/directoryAudits?`$filter=$filter")
    }
}
if ($null -ne $graphUsers) { $splat.GraphUsers = $graphUsers }
if ($null -ne $audit) { $splat.EntraAudit = $audit }

$identities = Read-KitJsonFile $IscIdentitiesJson
$accounts = Read-KitJsonFile $IscAccountsJson
if (($null -eq $identities -or $null -eq $accounts) -and -not $SkipIsc) {
    $ih = Get-KitIscHeader -Config $config
    $isc = Get-KitIscBaseUrl -Config $config
    if ($null -eq $identities) {
        $body = @{ indices = @('identities'); query = @{ query = '*' }
            queryResultFilter = @{ includes = @('id', 'name', 'displayName', 'employeeNumber', 'attributes', 'manager', 'accounts', 'disabled') } }
        $identities = @(Get-KitIscSearchPaged -BaseUrl $isc -Headers $ih -Body $body)
    }
    if ($null -eq $accounts) {
        $accounts = @(Get-KitIscListPaged -Uri "$isc/v3/accounts" -Headers $ih -Filters 'uncorrelated eq true')
    }
}
if ($null -ne $identities) { $splat.IscIdentities = $identities }
if ($null -ne $accounts) { $splat.IscUncorrelated = $accounts }

$result = Get-KitIdentityDriftFinding @splat
Export-KitDriftResult -Result $result -JsonPath $OutJson -CsvPath $OutCsv
$counts = [ordered]@{}
foreach ($f in $result.findings) { $counts[$f.drift_class] = 1 + [int]$counts[$f.drift_class] }
[pscustomobject]@{ counts = $counts; not_computed = $result.not_computed; out_json = $OutJson; out_csv = $OutCsv }

if ($PushToServiceNow) {
    $sn = Get-KitSnHeader -Config $config
    Send-KitFindingToServiceNow -Finding $result.findings -Config $config -Headers $sn -Apply:$Apply -WhatIf:$WhatIfPreference
}
