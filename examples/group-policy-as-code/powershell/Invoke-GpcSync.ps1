#Requires -Version 7.1
<#
.SYNOPSIS
    The pull request and release step for the settings catalog library: lint, read the tenant,
    diff, and with -Apply create the policies that are missing.

.DESCRIPTION
    Without -Apply it is a dry run: it signs in with DeviceManagementConfiguration.Read.All only,
    sends GET only, and prints what it would create. With -Apply it signs in with
    DeviceManagementConfiguration.ReadWrite.All and creates each missing policy, unassigned, then
    reads it back. It writes nothing when the lint has a finding or a policy is Drift or Duplicate.
    It never sends PATCH or DELETE.

    -WithPlan also reads Group Policy analytics (beta) and traces every setting in the library to
    the move plan (rule GPC-08).

    -FixturePath reads a fixture tenant instead of signing in (labs and tests).

    Writes <OutputPath>/sync-record.json. Exit codes: 0 clean, 2 something needs a person
    (a finding, Drift, Duplicate, or a created policy that doesn't read back the same), 1 error.

    Illustrative: tested against fixtures, not against a production tenant.

.EXAMPLE
    pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -WithPlan

.EXAMPLE
    pwsh ./powershell/Invoke-GpcSync.ps1 -Cloud gcc -TenantId <test-tenant-id>
    pwsh ./powershell/Invoke-GpcSync.ps1 -Cloud gcc -TenantId <test-tenant-id> -Apply
#>
[CmdletBinding()]
param(
    [string]$LibraryPath = (Join-Path $PSScriptRoot '../policies'),
    [ValidateSet('gcc', 'global', 'gcchigh', 'dod')][string]$Cloud = 'gcc',
    [switch]$Apply,
    [switch]$WithPlan,
    [string]$FixturePath,
    [string]$OutputPath = (Join-Path $PSScriptRoot '../out'),
    [string]$TenantId,
    # App-only sign-in with a certificate; the app needs the same permission as an application permission.
    [string]$ClientId,
    [string]$CertificateThumbprint,
    [switch]$SkipConnect
)

$ErrorActionPreference = 'Stop'
try {
    Import-Module (Join-Path $PSScriptRoot 'GroupPolicyAsCode.psm1') -Force
    $cloudInfo = Get-GpcCloud -Cloud $Cloud
    $library = @(Read-GpcLibrary -Path $LibraryPath)

    if ($FixturePath) {
        $fake = New-GpcFixtureInvoke -Path $FixturePath
        $invoke = $fake.Invoke
    } else {
        if (-not $SkipConnect) {
            $action = if ($Apply) { 'Apply' } else { 'DryRun' }
            if ($ClientId) {
                Connect-MgGraph -Environment $cloudInfo.Environment -TenantId $TenantId -ClientId $ClientId -CertificateThumbprint $CertificateThumbprint -NoWelcome
            } else {
                Connect-MgGraph -Environment $cloudInfo.Environment -TenantId $TenantId -Scopes (Get-GpcRequiredScope -Action $action) -NoWelcome
            }
        }
        $invoke = { param($Method, $Uri, $Body, $Headers) Invoke-MgGraphRequest -Method $Method -Uri $Uri -Body $Body -Headers $Headers }
    }

    $plan = if ($WithPlan) { @(Get-GpcMovePlan -Invoke $invoke -Cloud $Cloud) } else { $null }
    $record = Invoke-GpcSync -Library $library -Invoke $invoke -Cloud $Cloud -Plan $plan -Apply:$Apply

    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    [IO.File]::WriteAllText((Join-Path $OutputPath 'sync-record.json'), (($record | ConvertTo-Json -Depth 20) -replace "`r`n", "`n") + "`n")

    "{0} against {1} ({2} library file(s))" -f $record.Mode, $record.GraphHost, $library.Count
    if (@($record.Findings).Count) { $record.Findings | Format-Table Severity, Rule, File, Issue -AutoSize -Wrap | Out-String -Width 200 }
    $record.Results | ForEach-Object {
        $detail = @()
        if (@($_.Added).Count) { $detail += 'adds ' + ($_.Added -join ', ') }
        if (@($_.Removed).Count) { $detail += 'removes ' + ($_.Removed -join ', ') }
        if (@($_.Changed).Count) { $detail += 'changes ' + ($_.Changed -join ', ') }
        if (@($_.Properties).Count) { $detail += 'properties ' + ($_.Properties -join ', ') }
        '{0,-15} {1}{2}' -f $_.Action, $_.Name, $(if ($detail) { ': ' + ($detail -join '; ') } else { '' })
    }
    exit $record.ExitCode
} catch {
    Write-Error $_.Exception.Message -ErrorAction Continue
    exit 1
}
