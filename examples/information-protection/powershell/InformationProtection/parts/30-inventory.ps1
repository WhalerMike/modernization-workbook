# Chapter 03 (Book 20, Chapter 01): the class register against the tenant's sensitive information types and the content counts.

function Invoke-IpInventory {
    <#
    .SYNOPSIS
        Checks the class register (inputs.classRegister) against the export: every class has an owner and a
        label; every sensitive information type a class names is in the tenant's catalog; and, where the
        export read content explorer, how many items each type finds in Exchange, OneDrive and SharePoint.
        Writes results.csv and inventory.csv.
    .EXAMPLE
        Invoke-IpInventory -Settings $s -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/inventory -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$SnapshotPath, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf)
    $out = New-IpRunFolder -OutputPath $OutputPath
    $snap = Read-IpSnapshot -Path $SnapshotPath
    $classes = @(Read-IpCsv -Path (Get-IpInput -Settings $Settings -Name classRegister))
    $catalog = @{}; foreach ($t in @($snap.sitCatalog)) { if ($t) { $catalog["$(Get-IpV $t 'Name')".ToLowerInvariant()] = $true } }
    $counts = @($snap.contentExplorer | Where-Object { $_ })
    $rows = [Collections.Generic.List[object]]::new()
    $inv = [Collections.Generic.List[object]]::new()
    if (-not $catalog.Count) { $rows.Add((New-IpCheck -Id 'INV-00' -Status Fail -Subject 'SIT catalog' -Detail 'sit-catalog.json is missing or empty')) }
    $n = 0
    foreach ($c in $classes) {
        $n++
        $sits = @("$($c.sits)" -split ';\s*' | Where-Object { $_ })
        $problems = @()
        if (Test-IpPlaceholder "$($c.owner)") { $problems += 'no owner' }
        if (Test-IpPlaceholder "$($c.label)") { $problems += 'no label' }
        $unknown = @($sits | Where-Object { $catalog.Count -and -not $catalog.Contains($_.ToLowerInvariant()) })
        if ($unknown.Count) { $problems += "not in the tenant's catalog: $($unknown -join ', ')" }
        $mine = @($counts | Where-Object { "$($_.class)" -eq "$($c.class)" } | ForEach-Object { [pscustomobject]$_ })
        foreach ($x in $mine) { $inv.Add([pscustomobject]@{ Class = $c.class; SensitiveInformationType = $x.tagName; Workload = $x.workload; Items = $x.totalCount }) }
        $found = 0; foreach ($x in $mine) { $found += [int]$x.totalCount }
        $where = if (-not $counts.Count) { 'content counts not read (reads.inventory is off)' }
        elseif (-not $mine.Count) { 'no content counts for this class' }
        else { "$found item(s): " + ((@($mine | Group-Object workload | ForEach-Object { $t = 0; foreach ($x in $_.Group) { $t += [int]$x.totalCount }; "$($_.Name) $t" })) -join ', ') }
        $st = if ($problems.Count) { 'Fail' } elseif (-not $sits.Count) { 'Warn' } else { 'Pass' }
        if (-not $sits.Count) { $problems += 'no sensitive information type named: the class is labeled by default or by hand, not found by detection' }
        $rows.Add((New-IpCheck -Id ('INV-{0:d2}' -f $n) -Status $st -Subject $c.class -Detail ((@($problems) + @($where)) -join '; ')))
    }
    Write-IpCsv -Path (Join-Path $out 'inventory.csv') -Rows $inv.ToArray() -Columns Class, SensitiveInformationType, Workload, Items
    Complete-IpRun -Task inventory -Rows $rows.ToArray() -OutputPath $out -AsOf $AsOf -Settings $Settings -SnapshotPath $SnapshotPath
}
