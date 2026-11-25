# Chapter 07 (Book 20, Chapters 10 and 11): audit on, retained, and the synthetic events found.

function Search-IpSyntheticEvent {
    <#
    .SYNOPSIS
        Searches the audit log (Exchange Online PowerShell, Search-UnifiedAuditLog) for the synthetic events
        the plan names, by the test user, from when the test started, and writes them with the test record
        as one JSON file. Reads only.
    .EXAMPLE
        Search-IpSyntheticEvent -Settings $s -Runner $r -UserId test.user@contoso.example -StartedAt 2026-11-24T09:00:00Z -OutputPath out/synthetic.json -AsOf 2026-11-24T13:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Runner, [Parameter(Mandatory)][string]$UserId,
        [Parameter(Mandatory)][string]$StartedAt, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf)
    $plan = Get-IpPlan -Settings $Settings
    $ops = @($plan.audit.synthetic.operations)
    & $Runner.Connect 'exo' $Settings
    try {
        $hits = @(& $Runner.Invoke 'Search-UnifiedAuditLog' @{ StartDate = (Get-IpDate $StartedAt); EndDate = (Get-IpDate $AsOf); UserIds = $UserId; Operations = $ops; ResultSize = 5000 })
    } finally { & $Runner.Disconnect 'exo' }
    $events = @($hits | ForEach-Object { [ordered]@{ CreationDate = (ConvertTo-IpUtc (Get-IpV $_ 'CreationDate')); UserIds = "$(Get-IpV $_ 'UserIds')"; Operations = "$(Get-IpV $_ 'Operations')"; RecordType = "$(Get-IpV $_ 'RecordType')" } })
    Write-IpJson -Path $OutputPath -Value ([ordered]@{ startedAt = (ConvertTo-IpUtc $StartedAt); searchedAt = (ConvertTo-IpUtc $AsOf); user = $UserId; operations = $ops; events = $events })
    [pscustomobject]@{ Path = $OutputPath; Events = $events.Count }
}

function Invoke-IpAudit {
    <#
    .SYNOPSIS
        Checks the audit floor: unified audit ingestion is on (as read in Exchange Online PowerShell); every
        retention policy the plan names exists with its duration; and, given a synthetic-event search, each
        operation the plan expects was found within the planned time after the test started. Writes
        results.csv and synthetic.csv.
    .EXAMPLE
        Invoke-IpAudit -Settings $s -SnapshotPath tests/fixtures/snapshots/2026-11-24 -SyntheticPath tests/fixtures/synthetic/2026-11-24.json -OutputPath out/audit -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$SnapshotPath, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [string]$SyntheticPath)
    $out = New-IpRunFolder -OutputPath $OutputPath
    $plan = Get-IpPlan -Settings $Settings
    $snap = Read-IpSnapshot -Path $SnapshotPath
    $rows = [Collections.Generic.List[object]]::new()
    $st = ($snap.auditStatus | Where-Object { $_ } | Select-Object -First 1)
    $on = Test-IpBool (Get-IpV $st 'UnifiedAuditLogIngestionEnabled')
    $rows.Add((New-IpCheck -Id 'AUD-01' -Status $(if ($on) { 'Pass' } else { 'Fail' }) -Subject 'Unified audit ingestion' -Detail $(if (-not $st) { 'audit-status.json is missing' } elseif ($on) { 'on' } else { 'off: every other Purview signal goes dark. Read it in Exchange Online PowerShell; Security & Compliance PowerShell always says False' })))
    $n = 0
    foreach ($p in @($plan.audit.retention | Where-Object { $_ })) {
        $n++
        $r = ($snap.auditRetention | Where-Object { $_ -and "$(Get-IpV $_ 'Name')" -eq $p.name } | Select-Object -First 1)
        $d = if (-not $r) { 'not in the export' } elseif ("$(Get-IpV $r 'RetentionDuration')" -ne $p.duration) { "RetentionDuration $(Get-IpV $r 'RetentionDuration'), plan says $($p.duration)" } else { '' }
        $rows.Add((New-IpCheck -Id ('RET-{0:d2}' -f $n) -Status $(if ($d) { 'Fail' } else { 'Pass' }) -Subject $p.name -Detail $(if ($d) { $d } else { "$($p.duration), priority $(Get-IpV $r 'Priority')" })))
    }
    $table = [Collections.Generic.List[object]]::new()
    if (-not $SyntheticPath) { $rows.Add((New-IpCheck -Id 'SYN-00' -Status Info -Subject 'Synthetic events' -Detail 'no search given: run the synthetic-event test, then Search-IpSyntheticEvents.ps1')) }
    else {
        $syn = Read-IpJson -Path $SyntheticPath
        $start = Get-IpDate $syn.startedAt
        $within = [double]$plan.audit.synthetic.withinHours
        $n = 0
        foreach ($op in @($plan.audit.synthetic.operations)) {
            $n++
            $hit = ($syn.events | Where-Object { $_.Operations -eq $op } | Sort-Object { Get-IpDate $_.CreationDate } | Select-Object -First 1)
            $lag = if ($hit) { [math]::Round(((Get-IpDate $hit.CreationDate) - $start).TotalHours, 1) } else { $null }
            $ok = $hit -and $lag -le $within
            $d = if (-not $hit) { "not found in the search of $($syn.searchedAt)" } elseif (-not $ok) { "found $lag h after the test started; target $within h" } else { "found, $lag h after the test started" }
            $rows.Add((New-IpCheck -Id ('SYN-{0:d2}' -f $n) -Status $(if ($ok) { 'Pass' } else { 'Fail' }) -Subject $op -Detail $d))
            $table.Add([pscustomobject]@{ Operation = $op; Found = [bool]$hit; CreationDate = $(if ($hit) { $hit.CreationDate } else { '' }); HoursAfterStart = $lag })
        }
        Copy-Item -LiteralPath $SyntheticPath -Destination (Join-Path $out 'synthetic-search.json')
    }
    Write-IpCsv -Path (Join-Path $out 'synthetic.csv') -Rows $table.ToArray() -Columns Operation, Found, CreationDate, HoursAfterStart
    Complete-IpRun -Task audit -Rows $rows.ToArray() -OutputPath $out -AsOf $AsOf -Settings $Settings -SnapshotPath $SnapshotPath
}
