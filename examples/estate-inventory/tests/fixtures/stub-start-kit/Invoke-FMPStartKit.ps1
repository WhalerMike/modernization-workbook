#Requires -Version 5.1
# A stand-in for examples/start-kit/Invoke-FMPStartKit.ps1 in the tests: it reads nothing and writes a
# run folder the shape the Start Kit writes, so the live path (a Windows PowerShell 5.1 child
# process, its arguments and the run it finds) runs without a forest.
param(
    [Parameter(Mandatory)][string]$OutputPath,
    [string]$Tier = 'A',
    [string]$Forest,
    [string[]]$Domain,
    [switch]$Quiet,
    [switch]$SkipSql,
    [switch]$SkipNps,
    [string]$ServerListPath
)
$run = Join-Path $OutputPath "2026-01-01-0000-stub-tier$Tier"
$null = New-Item -ItemType Directory -Force -Path (Join-Path $run 'ServerServices')
'ComputerName,ServiceName,StartName' | Set-Content -LiteralPath (Join-Path $run 'ServerServices\ServerServices.csv')
[ordered]@{
    Schema = 'stub'; RunId = Split-Path -Leaf $run; Edition = "$($PSVersionTable.PSEdition) $($PSVersionTable.PSVersion)"
    Arguments = [ordered]@{ Tier = $Tier; Forest = $Forest; Domain = @($Domain); Quiet = [bool]$Quiet; SkipSql = [bool]$SkipSql; SkipNps = [bool]$SkipNps }
} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $run 'AssessmentManifest.json')
"Stub Start Kit in $($PSVersionTable.PSEdition) $($PSVersionTable.PSVersion): $run"
