#Requires -Version 7.2
<#
.SYNOPSIS
Re-read before close: verify ServiceNow records "Awaiting verification" against live state.

.DESCRIPTION
For each record in the awaiting-verification state, reads its intended state
(u_intended_state), re-reads the subject from its system of record (ISC account,
ISC identity via Search, or the Entra user via Microsoft Graph), then:
  match    -> closes the record and writes the evidence (query, timestamp, result hash)
              to the record and as a JSON attachment;
  mismatch -> reopens the record with a work note;
  pending  -> the ISC copy predates the change; left alone until the grace period ends.

Read-only by default (prints what it would do). -Apply writes; -WhatIf previews -Apply.
Illustrative: unit-tested with Pester against mocked responses, not yet proven against
live tenants.

.EXAMPLE
./Invoke-ReReadVerification.ps1 -ConfigPath ../../config/config.example.json

.EXAMPLE
./Invoke-ReReadVerification.ps1 -Apply -GraceHours 12
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$ConfigPath,
    [string]$Table,
    [double]$GraceHours = 24,
    [switch]$Apply,
    [string]$OutJson
)

Import-Module (Join-Path $PSScriptRoot 'IdentityKit.psm1') -Force

$config = Get-KitConfig -Path $ConfigPath
if (-not $Table) { $Table = $config.SN_FINDING_TABLE }
$sn = Get-KitSnHeader -Config $config
$records = @(Get-KitAwaitingRecord -Config $config -Headers $sn -Table $Table)
$systems = @($records | ForEach-Object { if ($_.u_system) { $_.u_system } else { 'isc_account' } } | Sort-Object -Unique)
$isc = if ($systems | Where-Object { $_ -like 'isc_*' }) { Get-KitIscHeader -Config $config } else { @{} }
$graph = if ($systems -contains 'entra_user') { Get-KitGraphHeader -Config $config } else { @{} }

$results = @(Invoke-KitReReadVerification -Record $records -Config $config -SnHeaders $sn -IscHeaders $isc -GraphHeaders $graph -Table $Table -Apply:$Apply -GraceHours $GraceHours -WhatIf:$WhatIfPreference)
if ($OutJson) { $results | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $OutJson -Encoding utf8NoBOM }
$results
