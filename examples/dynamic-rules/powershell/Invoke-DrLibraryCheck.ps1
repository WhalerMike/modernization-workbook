#Requires -Version 7.1
<#
.SYNOPSIS
The pull request check for the rule library: lint every rule, run every rule's membership tests,
and for each rule file changed since -BaseRef, show whom the change adds and removes.

.DESCRIPTION
Offline: reads the library, the population fixture and git. Exit codes: 0 passed (warnings and
information allowed), 2 findings, 1 error. Writes check-results.json beside -OutputPath.

.EXAMPLE
pwsh ./powershell/Invoke-DrLibraryCheck.ps1 -BaseRef origin/main
#>
[CmdletBinding()]
param(
    [string]$Library = (Join-Path $PSScriptRoot '..\rules'),
    [string]$Population = (Join-Path $PSScriptRoot '..\tests\fixtures\population.json'),
    [string]$BaseRef,
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\out')
)
$ErrorActionPreference = 'Stop'
try {
    Import-Module (Join-Path $PSScriptRoot 'DynamicRules.psm1') -Force
    $lib = @(Get-DrLibrary -Path $Library)
    $pop = @(Get-Content -LiteralPath $Population -Raw | ConvertFrom-Json)
    $findings = @(Invoke-DrLibraryTest -Library $lib -Population $pop)

    $diffs = @()
    if ($BaseRef) {
        $root = (git rev-parse --show-toplevel).Trim()
        Push-Location $root
        try {
            $libFromRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\rules') -Relative) -replace '\\', '/' -replace '^\./', ''
            $changed = @(git diff --name-only "$BaseRef" -- "$libFromRoot" | Where-Object { $_ -like '*.json' })
            foreach ($path in $changed) {
                $name = Split-Path -Leaf $path
                $new = $lib | Where-Object { $_.file -eq $name }
                $oldText = git show "${BaseRef}:$path" 2>$null
                $old = if ($LASTEXITCODE -eq 0) { ($oldText -join "`n") | ConvertFrom-Json } else { $null }
                if (-not $new) { $diffs += [pscustomobject]@{ File = $name; Change = 'removed'; Adds = @(); Removes = @() }; continue }
                if (-not $old) {
                    $diffs += [pscustomobject]@{ File = $name; Change = 'new'; Adds = @(Get-DrMembers -Rule $new.membershipRule -Population $pop); Removes = @() }
                    continue
                }
                $d = Compare-DrRule -Current $old.membershipRule -Proposed $new.membershipRule -Population $pop
                $diffs += [pscustomobject]@{ File = $name; Change = 'changed'; Adds = $d.Adds; Removes = $d.Removes }
            }
        } finally { Pop-Location }
    }

    New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    [ordered]@{ base_ref = $BaseRef; rules = $lib.Count; findings = $findings; shadow = $diffs } |
        ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $OutputPath 'check-results.json') -Encoding utf8NoBOM

    $findings | Format-Table Severity, Rule, Group, Issue -AutoSize -Wrap | Out-String | Write-Host
    foreach ($d in $diffs) { Write-Host ("{0} ({1}): adds {2}; removes {3}" -f $d.File, $d.Change, ($d.Adds -join ', '), ($d.Removes -join ', ')) }
    $bad = @($findings | Where-Object Severity -EQ 'Finding').Count
    Write-Host ("{0} rule(s); {1} finding(s), {2} warning(s); {3} changed file(s)" -f $lib.Count, $bad, @($findings | Where-Object Severity -EQ 'Warn').Count, $diffs.Count)
    if ($bad -gt 0) { exit 2 }
    exit 0
} catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
}
