#Requires -Version 7.1
<#
.SYNOPSIS
    Chapter 08: Conditional Access for workload identities.
      -Mode Check    the pre-merge check on workload-ca/ and the scope file (no tenant; exit 1 on a Finding)
      -Mode Plan     check the scope against the tenant, plan CA015 and CA037 per ring, and write the
                     requests; a dry run unless -Apply. New policies are created report-only; a ring is
                     enforced only with -AllowEnforce, a D-N5 record and the reviewed -SignInSummaryPath.
      -Mode SignIns  read the service principal sign-in logs (Graph beta) and summarize the report-only
                     results per principal and ring; prints the summary's SHA-256 for the review record.
.EXAMPLE
    # Lab 1: against the fake, nothing leaves the machine.
    ./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud gcc -ScopePath tests/fixtures/ch08/scope.json -FixturePath tests/fixtures/ch08/tenant.json -OutputPath out/wca
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('Check', 'Plan', 'SignIns')][string]$Mode,
    [Parameter(Mandatory)][string]$ScopePath,
    [ValidateSet('global', 'gcc', 'gcchigh', 'dod')][string]$Cloud,
    [string]$OutputPath,
    [string]$FixturePath,
    [string]$RepositoryPath = (Join-Path $PSScriptRoot 'workload-ca'),
    [datetime]$AsOf,
    [datetime]$From,
    [datetime]$To,
    [string]$SignInSummaryPath,
    [switch]$Apply,
    [switch]$AllowEnforce
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'powershell/NpiWorkloadCa/NpiWorkloadCa.psm1') -Force

$scope = Read-NpiWcaScope -Path $ScopePath
$repo = Read-NpiWcaRepository -Path $RepositoryPath
if (-not $PSBoundParameters.ContainsKey('AsOf')) {
    $AsOf = if ($FixturePath) { [datetime]::Parse((Get-Content -LiteralPath $FixturePath -Raw | ConvertFrom-Json).asOf, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } else { [datetime]::UtcNow }
}
$check = @(Test-NpiWcaRepository -Repository $repo -Scope $scope -AsOf $AsOf)
$count = { param($f) '{0} Finding, {1} Warn, {2} Info' -f @($f | Where-Object Severity -EQ 'Finding').Count, @($f | Where-Object Severity -EQ 'Warn').Count, @($f | Where-Object Severity -EQ 'Info').Count }

if ($Mode -eq 'Check') {
    Write-Output "Pre-merge check: $(& $count $check)"
    foreach ($x in $check) { Write-Output ("  {0} {1,-7} {2}: {3}" -f $x.Rule, $x.Severity, $x.Object, $x.Message) }
    if (@($check | Where-Object Severity -EQ 'Finding').Count) { exit 1 }
    return
}

if (-not $Cloud) { throw "-Cloud is required for -Mode $Mode; there is no default." }
if (-not $OutputPath) { throw "-OutputPath is required for -Mode $Mode." }
if ($scope['cloud'] -ne $Cloud) { throw "The scope is for cloud '$($scope['cloud'])', not '$Cloud'." }
$tenantId = [string]$scope['tenantId']

$newClient = {
    param([string]$Task)
    if ($FixturePath) { return New-NpiWcaClient -Cloud $Cloud -Task $Task -Invoke $script:Fake.Invoke }
    New-NpiWcaClient -Cloud $Cloud -Task $Task -Invoke (New-NpiLiveInvoker -Cloud $Cloud -TenantId $tenantId -SkipAzure -AllowWrite:($Task -eq 'wca-apply'))
}
if ($FixturePath) { $script:Fake = New-NpiWcaFixtureInvoker -Path $FixturePath -Cloud $Cloud; $runMode = 'Fixture' } else { $runMode = 'Live' }

if ($Mode -eq 'SignIns') {
    if (-not $PSBoundParameters.ContainsKey('From') -or -not $PSBoundParameters.ContainsKey('To')) { throw '-From and -To are required for -Mode SignIns.' }
    # A date with no zone is UTC, as the sign-in log's createdDateTime is.
    if ($From.Kind -eq 'Unspecified') { $From = [datetime]::SpecifyKind($From, 'Utc') }
    if ($To.Kind -eq 'Unspecified') { $To = [datetime]::SpecifyKind($To, 'Utc') }
    $client = & $newClient 'wca-signins'
    $rows = Get-NpiWcaSignIn -Client $client -From $From -To $To
    $summary = Get-NpiWcaSignInSummary -SignIns $rows -Scope $scope -Repository $repo -From $From -To $To
    $null = Export-NpiWcaRun -OutputPath $OutputPath -Cloud $Cloud -Task 'wca-signins' -Mode $runMode -TenantId $tenantId -Evidence $client.Evidence -Files @{ 'signin-summary.json' = $summary } -Extra @{ scopeSha256 = $scope['_sha256'] }
    Write-Output ("Service principal sign-ins {0} to {1} ({2} days): {3} read" -f $summary.from, $summary.to, $summary.days, @($rows).Count)
    foreach ($r in $summary.rings) {
        Write-Output ("{0}: {1}" -f $r.ring, $(if ($r.ready) { 'ready for enforcement' } else { 'not ready' }))
        foreach ($p in $r.principals) { Write-Output ("  {0,-16} {1,-12} sign-ins {2}{3}" -f $p.name, $p.status, $p.signIns, $(if (@($p.outsideEgress).Count) { "; outside the egress ranges: $(@($p.outsideEgress) -join ', ')" } else { '' })) }
    }
    Write-Output "Summary SHA-256: $(Get-NpiFileHash -Path (Join-Path $OutputPath 'signin-summary.json'))"
    return
}

# Plan
$task = if ($Apply) { 'wca-apply' } else { 'wca-read' }
$client = & $newClient $task
$tenantCheck = Test-NpiWcaTenantScope -Client $client -Scope $scope
$findings = @($check) + @($tenantCheck.Findings)
$enforcement = Get-NpiWcaEnforcement -Scope $scope -AllowEnforce:$AllowEnforce -SignInSummaryPath $SignInSummaryPath
$tenant = Get-NpiWcaTenant -Client $client
$plan = @(Get-NpiWcaPlan -Repository $repo -Scope $scope -Tenant $tenant -Enforcement $enforcement -AsOf $AsOf)
$requests = @(Invoke-NpiWcaPlan -Client $client -Plan $plan -Findings $findings -EgressName $scope['egress']['name'])
$alert = New-NpiWcaAlertRule -Repository $repo -Scope $scope
$null = Export-NpiWcaRun -OutputPath $OutputPath -Cloud $Cloud -Task $task -Mode "$runMode-$(if ($Apply) { 'Apply' } else { 'DryRun' })" -TenantId $tenantId -Evidence $client.Evidence `
    -Extra @{ scopeSha256 = $scope['_sha256']; enforcement = $enforcement } -Files @{
    'findings.json'   = @($findings)
    'plan.json'       = @($plan | Select-Object Kind, Name, Ring, Action, Changes, Note)
    'requests.json'   = @($requests)
    'alert-rule.json' = $alert
}

Write-Output "Checks: $(& $count $findings)"
foreach ($x in @($findings | Where-Object Severity -NE 'Info')) { Write-Output ("  {0} {1,-7} {2}: {3}" -f $x.Rule, $x.Severity, $x.Object, $x.Message) }
Write-Output ("Plan: {0}" -f ((@($plan) | Group-Object Action | Sort-Object Name | ForEach-Object { "$($_.Count) $($_.Name)" }) -join ', '))
if ($Apply) { Write-Output ("Apply: {0} request(s) sent" -f @($requests | Where-Object Sent).Count) }
else { Write-Output ("Dry run: {0} request(s) written to requests.json, none sent; rerun with -Apply to send them" -f $requests.Count) }
