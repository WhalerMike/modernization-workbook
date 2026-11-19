#Requires -Version 7.1
<#
.SYNOPSIS
    Builds workbook/daily-checks.workbook.json from config/manifest.json and queries/*.kql. With -Check,
    writes nothing and exits 1 if the committed template differs from the build (the tests run this).
.EXAMPLE
    ./New-DcWorkbookTemplate.ps1 -Check
#>
[CmdletBinding()]
param([switch]$Check)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/DailyChecks/DailyChecks.psm1') -Force
$path = Join-Path $PSScriptRoot 'workbook/daily-checks.workbook.json'
$text = (ConvertTo-DcJson (New-DcTemplate)) + "`n"
if ($Check) {
    $same = (Test-Path -LiteralPath $path) -and ([IO.File]::ReadAllText($path) -eq $text)
    Write-Host $(if ($same) { 'workbook/daily-checks.workbook.json matches the manifest and queries' } else { 'workbook/daily-checks.workbook.json is out of date: run ./New-DcWorkbookTemplate.ps1' })
    if (-not $same) { exit 1 }
    return
}
Write-DcText -Path $path -Text $text
Write-Host "Wrote workbook/daily-checks.workbook.json ($((Get-DcFileHash -Path $path).Substring(0, 12))...)"
