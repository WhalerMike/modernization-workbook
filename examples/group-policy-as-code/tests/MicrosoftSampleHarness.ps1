# Runs Microsoft's pinned settings catalog samples (examples/third_party/mggraph-intune-samples)
# offline, unmodified, against the fake Graph in GroupPolicyAsCode.psm1. Only the commands the
# scripts call outside themselves are replaced: Read-Host, Write-Host, Invoke-MgGraphRequest, and
# the Microsoft.Graph.Beta.DeviceManagement module they import (an empty stand-in module, so
# nothing is installed). Nothing signs in or calls a network.

$script:SampleRoot = Join-Path $PSScriptRoot '../../third_party/mggraph-intune-samples/SettingsCatalog'

function Get-SamplePath {
    param([Parameter(Mandatory)][ValidateSet('Import', 'Export')][string]$Name)
    $file = if ($Name -eq 'Import') { 'SettingsCatalog_Import_FromJSON.ps1' } else { 'SettingsCatalog_Export.ps1' }
    (Resolve-Path (Join-Path $script:SampleRoot $file)).Path
}

function Invoke-MicrosoftSample {
    <#
    Run one sample with scripted answers to its Read-Host prompts, against a fake Graph from
    New-GpcFixtureInvoke. Returns @{ Graph; Output; Prompts; Connected }.
    #>
    param(
        [Parameter(Mandatory)][ValidateSet('Import', 'Export')][string]$Name,
        [Parameter(Mandatory)]$Graph,
        [Parameter(Mandatory)][string[]]$Answers
    )
    $global:SampleGraph = $Graph
    $global:SampleAnswers = [Collections.Generic.Queue[string]]::new([string[]]$Answers)
    $global:SampleRun = [pscustomobject]@{ Graph = $Graph; Output = [Collections.Generic.List[string]]::new(); Prompts = [Collections.Generic.List[string]]::new(); Connected = $null }

    # An empty stand-in for the module the samples import, on a temporary module path.
    $modRoot = Join-Path ([IO.Path]::GetTempPath()) ('gpc-sample-mods-' + [guid]::NewGuid().Guid.Substring(0, 8))
    $modDir = Join-Path $modRoot 'Microsoft.Graph.Beta.DeviceManagement'
    New-Item -ItemType Directory -Force -Path $modDir | Out-Null
    Set-Content -LiteralPath (Join-Path $modDir 'Microsoft.Graph.Beta.DeviceManagement.psm1') -Value '# stand-in for tests'
    $oldPath = $env:PSModulePath
    $env:PSModulePath = $modRoot + [IO.Path]::PathSeparator + $env:PSModulePath
    try {
        function global:Read-Host { param([Parameter(Position = 0)]$Prompt) $global:SampleRun.Prompts.Add("$Prompt"); if ($global:SampleAnswers.Count -eq 0) { return '' }; $global:SampleAnswers.Dequeue() }
        function global:Write-Host { param([Parameter(Position = 0, ValueFromRemainingArguments)]$Object, $ForegroundColor) $global:SampleRun.Output.Add((@($Object) -join ' ')) }
        function global:Connect-MgGraph { param($Environment, $Scopes) $global:SampleRun.Connected = @{ Environment = $Environment; Scopes = $Scopes } }
        function global:Invoke-MgGraphRequest { param($Method = 'GET', $Uri, $Body, $Headers) & $global:SampleGraph.Invoke $Method $Uri $Body $Headers }
        $path = Get-SamplePath -Name $Name
        # A 'break' in the sample's error paths stops this one-pass loop, not the caller.
        foreach ($once in 1) { & $path *> $null }
    } finally {
        foreach ($f in 'Read-Host', 'Write-Host', 'Connect-MgGraph', 'Invoke-MgGraphRequest') {
            Remove-Item "function:global:$f" -ErrorAction SilentlyContinue
        }
        Remove-Module Microsoft.Graph.Beta.DeviceManagement -ErrorAction SilentlyContinue
        $env:PSModulePath = $oldPath
        Remove-Item -LiteralPath $modRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
    $global:SampleRun
}
