# Shared setup for the validation kit's Pester tests. Dot-source it in BeforeAll.
#
# Microsoft Graph PowerShell, Az and RSAT usually aren't installed where the tests run, and
# Pester can only mock a command that exists, so stubs are defined first. Every stub throws if
# it's called unmocked, so no test can reach a tenant, Azure or a domain.

$script:KitRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$script:FixtureRoot = Join-Path (Join-Path $script:KitRoot 'tests') 'fixtures'
$global:VkTestFixtureRoot = $script:FixtureRoot
$script:AsOf = '2026-10-29T00:00:00Z'
$script:TestOptions = @{ BaselineAssignmentName = 'server-baseline' }

$stubBody = {
    [CmdletBinding()]
    param($Method, $Uri, $Headers, $Body, $ContentType, $OutputType, $Query, $First, $SkipToken, $Subscription,
        $Environment, $Scopes, $TenantId, $ClientId, $CertificateThumbprint, [switch]$Identity, [switch]$NoWelcome, $Tenant,
        $Scope, $LDAPFilter, $Filter, $Properties)
    throw "Stub $($MyInvocation.MyCommand.Name) was called without a mock."
}
foreach ($n in 'Invoke-MgGraphRequest', 'Connect-MgGraph', 'Get-MgContext', 'Search-AzGraph', 'Connect-AzAccount',
    'Get-AzRoleEligibilitySchedule', 'Get-ADUser', 'Get-ADServiceAccount') {
    if (-not (Get-Command -Name $n -ErrorAction SilentlyContinue)) { Set-Item -Path "function:global:$n" -Value $stubBody }
}

Import-Module (Join-Path (Join-Path (Join-Path $script:KitRoot 'powershell') 'ValidationKit') 'ValidationKit.psd1') -Force

function global:Get-TestContext([string]$Kind, [switch]$IncludePreview, [hashtable]$Option = @{ BaselineAssignmentName = 'server-baseline' }) {
    Get-VkRunContext -FixturePath (Join-Path $global:VkTestFixtureRoot $Kind) -AsOf '2026-10-29T00:00:00Z' -Option $Option -IncludePreview:$IncludePreview
}
