#Requires -Version 7.1
<#
.SYNOPSIS
Build one machine configuration release offline: compile, clean the MOF, package and write the
policy definition with Learn's GuestConfiguration cmdlets, check both, and write provenance.json.

.DESCRIPTION
Nothing here signs in to Azure or uploads anything. Publishing (upload, New-AzPolicyDefinition,
assignment) follows Learn's own commands, run only on output this script passed. Exit codes:
0 passed (warnings allowed), 2 findings, 1 error.

.EXAMPLE
pwsh ./powershell/Invoke-McBuild.ps1 -Name TlsServerProtocols -Version 1.0.0 `
    -ContentUri https://stcontosomc.blob.core.windows.net/machine-configuration -OutputPath ./out
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Name,
    [Parameter(Mandatory)][ValidatePattern('^\d+\.\d+\.\d+$')][string]$Version,
    # Container URI the package will be published to; the package file name is appended.
    [Parameter(Mandatory)][string]$ContentUri,
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\out'),
    [string]$Registry = (Join-Path $PSScriptRoot '..\config\releases.json'),
    # Optional folder of saved modules (Save-Module), put first on PSModulePath for this run only.
    [string]$ModulePath,
    [string]$BuiltAt = [datetime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
)
$ErrorActionPreference = 'Stop'
try {
    Import-Module (Join-Path $PSScriptRoot 'McPipeline.psm1') -Force
    $root = Resolve-Path (Join-Path $PSScriptRoot '..')
    $release = Get-McReleaseEntry -Path $Registry -Name $Name
    $required = Import-PowerShellDataFile (Join-Path $root 'RequiredModules.psd1')
    if ($ModulePath) { $env:PSModulePath = (Resolve-Path $ModulePath).Path + [IO.Path]::PathSeparator + $env:PSModulePath }
    foreach ($m in $required.Keys) {
        if (-not (Get-Module -ListAvailable -Name $m | Where-Object { "$($_.Version)" -eq $required[$m] })) {
            throw "Module $m $($required[$m]) not found. Save-Module -Name $m -RequiredVersion $($required[$m]) -Path <folder>, then pass -ModulePath <folder>."
        }
    }
    Import-Module PSDesiredStateConfiguration -RequiredVersion $required.PSDesiredStateConfiguration -Force
    Import-Module GuestConfiguration -RequiredVersion $required.GuestConfiguration -Force

    $package = "$($Name)_$Version"
    $out = Join-Path $OutputPath $package
    if (Test-Path -LiteralPath $out) { Remove-Item -LiteralPath $out -Recurse -Force }
    New-Item -ItemType Directory -Path $out -Force | Out-Null

    # 1. Compile (Learn: author a configuration), then remove build-host data from the MOF.
    . (Join-Path $root $release.script)
    & $Name -OutputPath (Join-Path $out 'compiled') | Out-Null
    $mof = ConvertTo-McCleanMof -Path (Join-Path $out 'compiled\localhost.mof') -Destination (Join-Path $out "$package.mof")

    # 2. Package (Learn: New-GuestConfigurationPackage), then check it.
    $type = Get-McPackageType -Mode $release.mode
    $pkg = New-GuestConfigurationPackage -Name $package -Configuration $mof.FullName -Type $type -Path $out -Force
    $findings = @(Test-McPackage -Path $pkg.Path -Name $package -ExpectedType $type)

    # 3. Policy definition (Learn: New-GuestConfigurationPolicy) from the local package, then check it.
    $policyParams = @{
        PolicyId         = $release.policyId
        ContentUri       = ($ContentUri.TrimEnd('/') + "/$package.zip")
        DisplayName      = $release.displayName
        Description      = $release.description
        Path             = Join-Path $out 'policy'
        Platform         = $release.platform
        PolicyVersion    = $Version
        Mode             = $release.mode
        LocalContentPath = $pkg.Path
    }
    if ($release.mode -cne 'Audit' -and $release['owner_tag']) { $policyParams.Tag = $release.owner_tag }
    if ($release.identity -eq 'system') { $policyParams.UseSystemAssignedIdentity = $true }
    elseif ($release.identity -match '^/subscriptions/') { $policyParams.ManagedIdentityResourceId = $release.identity; $policyParams.ExcludeArcMachines = $true }
    $policy = New-GuestConfigurationPolicy @policyParams
    $findings += @(Test-McPolicy -Path $policy.Path -PackagePath $pkg.Path -Release $release -Version $Version)

    # 4. Provenance and findings.
    $prov = Get-McProvenance -Release $release -Version $Version -MofPath $mof.FullName -PackagePath $pkg.Path `
        -PolicyPath $policy.Path -Modules $required -BuiltAt $BuiltAt -Findings $findings
    $prov | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $out 'provenance.json') -Encoding utf8NoBOM
    ConvertTo-Json -InputObject @($findings) -Depth 5 | Set-Content -LiteralPath (Join-Path $out 'findings.json') -Encoding utf8NoBOM
    Remove-Item -LiteralPath (Join-Path $out 'compiled') -Recurse -Force

    $findings | Format-Table Severity, Rule, Issue -AutoSize -Wrap | Out-String | Write-Host
    Write-Host ("{0}: package {1}, policy {2}; {3} finding(s), {4} warning(s), {5} info" -f $package,
        $prov.package.sha256.Substring(0, 12), (Split-Path -Leaf $policy.Path), $prov.findings.Finding, $prov.findings.Warn, $prov.findings.Info)
    if ($prov.findings.Finding -gt 0) { exit 2 }
    exit 0
} catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
}
