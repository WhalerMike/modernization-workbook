#Requires -Version 7.1
<#
.SYNOPSIS
    Validates a workbook gallery template against the manifest (DC-V-01 to DC-V-10): the kit's own template by
    default, or one exported from the portal's Advanced Editor (Gallery Template tab). Prints a summary per
    check and every failure, and exits 1 on any failure. With -OutputPath, also writes results.json and a
    hashed manifest.json that Invoke-DcEvidence.ps1 can record.
.EXAMPLE
    ./Test-DcWorkbook.ps1
.EXAMPLE
    ./Test-DcWorkbook.ps1 -TemplatePath tests/fixtures/exported/edited.workbook.json
#>
[CmdletBinding()]
param(
    [string]$TemplatePath = (Join-Path $PSScriptRoot 'workbook/daily-checks.workbook.json'),
    [string]$OutputPath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
    [string]$Environment = 'lab'
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DailyChecks/DailyChecks.psm1') -Force
$rows = if ($OutputPath) { @(Invoke-DcValidate -TemplatePath $TemplatePath -OutputPath $OutputPath -AsOf $AsOf -Environment $Environment) } else { @(Test-DcTemplate -Path $TemplatePath) }
foreach ($g in ($rows | Group-Object Check | Sort-Object Name)) {
    $f = @($g.Group | Where-Object Status -EQ 'Fail').Count
    Write-Host ('{0}  {1,2} checked  {2}' -f $g.Name, $g.Count, $(if ($f) { "$f FAILED" } else { 'pass' }))
}
$fails = @($rows | Where-Object Status -EQ 'Fail')
foreach ($r in $fails) { Write-Host ('FAIL {0} {1}: {2}' -f $r.Check, $(if ($r.Tab) { $r.Tab } else { '(workbook)' }), $r.Detail) }
Write-Host $(if ($fails.Count) { "$($fails.Count) of $($rows.Count) checks failed" } else { "All $($rows.Count) checks pass" })
if ($OutputPath) { Write-Host "Written to $OutputPath`: results.json, manifest.json" }
if ($fails.Count) { exit 1 }
