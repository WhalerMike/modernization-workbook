<#
.SYNOPSIS
    Adds a sample plan's predecessor links to the Azure Boards work items
    imported from its <plan>-azure-boards.csv.

.DESCRIPTION
    Azure Boards' CSV import creates parent-child links but no other link
    type, so a plan's dependencies have to be added afterward. This script
    finds the plan's imported work items by their tags (every item carries
    fmw-<plan> and fmw-id-<ID>), reads <plan>-dependencies.csv and adds a
    Predecessor link from each successor to each of its predecessors.

    Azure Boards links don't hold lag or start-to-start timing; each work
    item's description keeps those from the plan.

    Requirements: the Azure CLI with the azure-devops extension
    (az extension add --name azure-devops), signed in with az login, and
    permission to edit work items in the project. Running it twice is safe:
    links that already exist are skipped.

.EXAMPLE
    ./add-azure-boards-links.ps1 -Organization https://dev.azure.com/contoso -Project Modernization -Plan program-master-schedule -WhatIf

.NOTES
    From the Federal Modernization Workbook's sample project plans
    (docs/project-plans). Not yet run against a live organization: try it on
    a scratch project first.
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)] [string] $Organization,
    [Parameter(Mandatory)] [string] $Project,
    [Parameter(Mandatory)] [ValidatePattern('^[a-z0-9-]+$')] [string] $Plan,
    [string] $DependencyFile = (Join-Path $PSScriptRoot "$Plan-dependencies.csv")
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'The Azure CLI (az) is not installed. Install it, then run: az extension add --name azure-devops'
}
if (-not (Test-Path -LiteralPath $DependencyFile)) {
    throw "Dependency file not found: $DependencyFile"
}
$dependencies = Import-Csv -LiteralPath $DependencyFile

# Find the plan's imported work items.
$wiql = "SELECT [System.Id], [System.Tags] FROM workitems WHERE [System.TeamProject] = @project AND [System.Tags] CONTAINS 'fmw-$Plan'"
$items = az boards query --wiql $wiql --org $Organization --project $Project --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'az boards query failed; check the organization, project and sign-in.' }
if (-not $items) { throw "No work items tagged fmw-$Plan in project $Project. Import $Plan-azure-boards.csv first." }

# Map each plan ID (from its fmw-id-<ID> tag) to its work item ID.
$workItem = @{}
foreach ($item in $items) {
    $tags = $item.fields.'System.Tags'
    if ($null -eq $tags) {
        $tags = (az boards work-item show --id $item.id --org $Organization --output json | ConvertFrom-Json).fields.'System.Tags'
    }
    foreach ($t in ("$tags" -split ';\s*')) {
        if ($t -like 'fmw-id-*') { $workItem[$t.Substring(7)] = $item.id }
    }
}
Write-Host "Found $($workItem.Count) work items for $Plan."

$added = 0; $skipped = 0; $missing = 0
foreach ($d in $dependencies) {
    $successor = $workItem[$d.Successor]
    $predecessor = $workItem[$d.Predecessor]
    if (-not $successor -or -not $predecessor) {
        Write-Warning "Skipped $($d.Predecessor) -> $($d.Successor): work item not found."
        $missing++
        continue
    }
    $what = "$($d.Predecessor) (#$predecessor) -> $($d.Successor) (#$successor), $($d.Type), lag $($d.'Lag (working days)') d"
    if (-not $PSCmdlet.ShouldProcess($what, 'Add Predecessor link')) { continue }
    $out = az boards work-item relation add --id $successor --relation-type Predecessor --target-id $predecessor --org $Organization --output none 2>&1
    if ($LASTEXITCODE -eq 0) {
        $added++
    } elseif ("$out" -match 'already exists|Relation already exists') {
        $skipped++
    } else {
        throw "Failed to add $what`n$out"
    }
}
Write-Host "Predecessor links: $added added, $skipped already there, $missing not found."
