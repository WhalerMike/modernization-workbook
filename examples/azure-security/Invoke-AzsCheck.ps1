#Requires -Version 7.1
<#
.SYNOPSIS
    Runs the Azure security kit's read-only checks for one area of the Azure Security Engineering guide, or
    all of them, and writes a run folder for each: the rows read, findings.json and findings.csv,
    summary.json, raw/ (every response), manifest.json, and for the exposure area the register. Fixture
    mode (-FixturePath) reads files and sends nothing; without it the kit runs az graph query and az rest
    --method get against commercial Azure, signed in as a Reader.
.PARAMETER Area
    baseline (Step 1), exposure (Step 2), ddos (Step 3), waf (Step 4), edge (Step 5), firewall (Step 6),
    private (Steps 7 and 8), policy (Step 9), or all.
.EXAMPLE
    ./Invoke-AzsCheck.ps1 -Area ddos -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/week1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/week1/ddos
.EXAMPLE
    ./Invoke-AzsCheck.ps1 -Area all -SettingsPath settings.test.json -OutputPath out/live -AllowUnverified
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('baseline', 'exposure', 'ddos', 'waf', 'edge', 'firewall', 'private', 'policy', 'all')][string]$Area,
    [Parameter(Mandatory)][string]$SettingsPath,
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$FixturePath,
    [string]$AsOf = ([DateTime]::UtcNow.ToString('o')),
    [string]$PreviousRegisterPath,
    [string]$DefenderExposurePath,
    [switch]$AllowUnverified
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/AzureSecurity/AzureSecurity.psm1') -Force

$settings = Read-AzsSettings -Path $SettingsPath
$invoker = if ($FixturePath) { New-AzsFixtureInvoker -Path $FixturePath } else { New-AzsLiveInvoker -Settings $settings -AllowUnverified:$AllowUnverified }
$prev = if ($PreviousRegisterPath) { Read-AzsJson -Path $PreviousRegisterPath } else { $null }
$defender = if ($DefenderExposurePath) { @(Import-Csv -LiteralPath $DefenderExposurePath | ForEach-Object { @{ resourceId = $_.resourceId; source = $_.source } }) } else { $null }
$areas = if ($Area -eq 'all') { @('baseline', 'exposure', 'ddos', 'waf', 'edge', 'firewall', 'private', 'policy') } else { @($Area) }
$total = [ordered]@{ Finding = 0; Warn = 0; Info = 0 }
foreach ($a in $areas) {
    $out = if ($Area -eq 'all') { Join-Path $OutputPath $a } else { $OutputPath }
    $r = Invoke-AzsCheck -Area $a -Settings $settings -Invoker $invoker -AsOf $AsOf -OutputPath $out -PreviousRegister $prev -DefenderExposure $defender
    foreach ($k in 'Finding', 'Warn', 'Info') { $total[$k] += $r.Counts[$k] }
    if ($Area -eq 'all') { Write-Host ('{0,-9} {1,3} Finding, {2,3} Warn, {3,3} Info' -f $a, $r.Counts.Finding, $r.Counts.Warn, $r.Counts.Info) }
    else {
        Write-Host $r.Line
        Write-Host ("Findings: {0} Finding, {1} Warn, {2} Info" -f $r.Counts.Finding, $r.Counts.Warn, $r.Counts.Info)
        if (Test-Path -LiteralPath (Join-Path $out 'plan-prevention.txt')) { Write-Host 'Plan: plan-prevention.txt holds the reviewed commands to switch to Prevention; none was run.' }
        if (Test-Path -LiteralPath (Join-Path $out 'plan-deny.txt')) { Write-Host 'Plan: plan-deny.txt holds the Draft + Deployment commands to move to Deny; none was run.' }
        if ($a -eq 'exposure') { Write-Host 'The register is a map of the attack surface: keep it inside the boundary, never in a public repository.' }
        Write-Host ("Written to {0} ({1} calls, every one a read; manifest.json lists each file's SHA-256)" -f $out, $r.Calls)
    }
}
if ($Area -eq 'all') {
    $null = Write-AzsManifest -OutputPath $OutputPath -Task check-all -AsOf (ConvertTo-AzsUtc $AsOf) -Mode $invoker.Mode -Environment "$($settings.environment)" -TenantId "$($settings.tenantId)" -Extra @{ areas = $areas }
    Write-Host ("Total:    {0,3} Finding, {1,3} Warn, {2,3} Info. Written to {3}" -f $total.Finding, $total.Warn, $total.Info, $OutputPath)
}
