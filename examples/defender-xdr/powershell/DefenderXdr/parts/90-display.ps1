# What the entry scripts print: the few lines an operator reads, with the run folder for the rest.

function Get-XdrShortText {
    <#
    .SYNOPSIS
        Text cut to a length with an ellipsis, for a table column.
    .EXAMPLE
        Get-XdrShortText 'Block all Office applications from creating child processes' 30
    #>
    param([AllowNull()][AllowEmptyString()][string]$Text, [int]$Max = 44)
    if (-not $Text -or $Text.Length -le $Max) { return $Text }
    $Text.Substring(0, $Max - 3) + '...'
}

function Show-XdrResult {
    <#
    .SYNOPSIS
        Prints a run's result for the operator: the findings that need someone, and a closing line naming the
        run folder's files. The full result is in the folder.
    .EXAMPLE
        Show-XdrResult -Task coverage -Result $r -OutputPath out/coverage
    #>
    param([Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)]$Result, [Parameter(Mandatory)][string]$OutputPath)
    switch ($Task) {
        'coverage' {
            $Result.ByRing | Format-Table Ring, InScope, Protected, NotActive, NotOnboarded, Excepted, ProtectedPercent -AutoSize | Out-Host
            @($Result.Rows | Where-Object Ticket) | Format-Table DeviceName, Ring, OnboardingStatus, SensorHealthState, Status -AutoSize | Out-Host
            $s = $Result.Summary
            Write-Host ("Coverage: {0} of {1} in-scope devices protected ({2}%), {3} excepted, {4} ticket(s), {5} not in the inventory." -f $s.protected, $s.inScope, $s.protectedCoveragePercent, $s.excepted, $s.tickets, $s.notInInventory)
            Write-Host "Written to ${OutputPath}: coverage.csv, by-ring.csv, tickets.csv, summary.json, raw/, manifest.json"
        }
        'prevention' {
            $Result.Drift | Format-Table DeviceName, Ring, Check, Expected, Actual -AutoSize | Out-Host
            $Result.Events | Format-Table ActionType, Events, Devices -AutoSize | Out-Host
            $s = $Result.Summary
            Write-Host ("Prevention: {0} device(s), {1} checks, {2} drift on {3} device(s); {4} with no state file. Last 7 days: {5} blocked, {6} audited, {7} tampering attempt(s)." -f $s.devicesChecked, $s.checks, $s.drift, @($s.devicesWithDrift).Count, @($s.noStateFile).Count, $s.blocked, $s.audited, $s.tamperingAttempts)
            Write-Host "Written to ${OutputPath}: device-checks.csv, drift.csv, events.csv, summary.json, raw/, manifest.json"
        }
        'asr' {
            @($Result.Readiness | Group-Object Ring | ForEach-Object { [pscustomobject][ordered]@{ Ring = $_.Name; Ready = @($_.Group | Where-Object Status -EQ 'Ready').Count; Hold = @($_.Group | Where-Object Status -EQ 'Hold').Count; Block = @($_.Group | Where-Object Status -EQ 'Done').Count; Attention = @($_.Group | Where-Object Status -In 'Fail', 'Warn').Count } }) | Format-Table -AutoSize | Out-Host
            @($Result.Readiness | Where-Object { $r = $_; $_.Status -in 'Fail', 'Warn' -or ($_.Status -eq 'Hold' -and ($_.OpenHits -gt 0 -or @($Result.Readiness | Where-Object { $_.Ring -eq $r.Ring -and $_.Status -eq 'Ready' }).Count)) } | Select-Object Ring, @{ n = 'Rule'; e = { Get-XdrShortText $_.Rule 40 } }, Mode, Days, OpenHits, Status, @{ n = 'Why'; e = { $_.Note } }) | Format-Table -AutoSize -Wrap | Out-Host
            @($Result.Devices | Where-Object Status -EQ 'Fail' | Group-Object DeviceName | ForEach-Object { [pscustomobject]@{ DeviceName = $_.Name; RulesNotAsPlanned = $_.Count; Example = "$(@($_.Group)[0].Planned) planned, $(@($_.Group)[0].Device) on the device" } }) | Format-Table -AutoSize | Out-Host
            $s = $Result.Summary
            Write-Host ("ASR: {0} rule-ring pair(s) ready for their next stage, {1} held, {2} in block, {3} plan error(s), {4} warning(s); {5} device mismatch(es); {6} expired exclusion(s)." -f $s.ready, $s.hold, $s.done, $s.planErrors, $s.warnings, $s.deviceMismatches, $s.expiredExclusions)
            Write-Host "Written to ${OutputPath}: matrix.csv, readiness.csv, device-checks.csv, exclusions-expired.csv, oma-uri/, summary.json, raw/, manifest.json"
        }
        'exposure' {
            $Result.Vulnerabilities | Format-Table SoftwareName, RecommendedSecurityUpdate, CVEs, Devices -AutoSize | Out-Host
            $Result.Exposed | Format-Table DeviceName, ExposureLevel, IsInternetFacing, MachineGroup, Owner, Status -AutoSize | Out-Host
            $s = $Result.Summary
            Write-Host ("Exposure: {0} CVE(s) across {1} software row(s); {2} exposed device(s), {3} with no owner. Security Exposure Management in {4}: {5} ({6})." -f $s.cves, $s.softwareRows, $s.exposedDevices, $s.unowned, $Result.Disposition.cloud, $Result.Disposition.availability, $(if ($Result.Disposition.normalizedResult) { $Result.Disposition.normalizedResult } else { 'no disposition needed' }))
            Write-Host "Written to ${OutputPath}: vulnerabilities.csv, exposed.csv, unowned.csv, exposure-management.json, summary.json, raw/, manifest.json"
        }
        'incidents' {
            $Result.Rows | Format-Table Id, Severity, Status, AgeHours, TriageWindowHours, Classification, Finding -AutoSize | Out-Host
            $s = $Result.Summary
            Write-Host ("Incidents: {0} in the window, {1} open; {2} past their triage window, {3} untriaged inside it, {4} closed without a classification." -f $s.incidents, $s.open, $s.overdueTriage, $s.untriaged, $s.closedWithoutClassification)
            Write-Host "Written to ${OutputPath}: incidents.csv, findings.csv, by-severity.csv, summary.json, raw/, manifest.json"
        }
        'detections' {
            @($Result.Validation | Where-Object Status -EQ 'Fail') | Format-Table Subject, Id, Detail -AutoSize -Wrap | Out-Host
            $Result.Tests | Format-Table RuleId, Window, Rows, Expected, Status -AutoSize | Out-Host
            $p = $Result.Plan
            @($p.actions | ForEach-Object { [pscustomobject]@{ Rule = $_.ruleId; Plan = $_.action; Changed = (@($_.changed) -join ', ') } }) +
            @($p.held | ForEach-Object { [pscustomobject]@{ Rule = $_.ruleId; Plan = 'held'; Changed = $_.reason } }) +
            @($p.orphans | ForEach-Object { [pscustomobject]@{ Rule = $_.ruleId; Plan = 'orphan'; Changed = "deployed ($($_.status)), not in the repository" } }) | Format-Table Rule, Plan, Changed -AutoSize -Wrap | Out-Host
            $s = $Result.Summary
            Write-Host ("Detections: {0} rule(s); {1} validation failure(s); tests {2} passed, {3} failed. Plan via {4}: {5} create, {6} update, {7} held, {8} orphan(s), {9} unchanged." -f $s.rules, $s.validationFailures, $s.testsPassed, $s.testsFailed, $s.deployVia, $s.create, $s.update, $s.held, $s.orphans, $s.unchanged)
            Write-Host ("Plan SHA-256: {0}" -f $s.planSha256)
            Write-Host "Written to ${OutputPath}: validation.csv, tests.csv, deployed-rules.json, plan.json, plan.sha256, summary.json, raw/, manifest.json"
        }
        'signals' {
            $Result.Rows | Format-Table AccountUpn, Sources, Alerts, Action -AutoSize -Wrap | Out-Host
            $s = $Result.Summary
            Write-Host ("Signals: {0} user(s) with alerts from more than one source; {1} emergency access account(s); {2}." -f $s.users, $s.emergencyAccess, $s.feeding)
            Write-Host "Written to ${OutputPath}: priority.csv, summary.json, raw/, manifest.json"
        }
        'automation' {
            $Result.Groups | Format-Table Name, Kind, RemediationLevel, Status -AutoSize | Out-Host
            @($Result.Exclusions | Where-Object Status -EQ 'Fail') | Format-Table Type, Value, Detail -AutoSize | Out-Host
            @($Result.Sensor | Where-Object Status -EQ 'Fail') | Format-Table DeviceName, SenseVersion, Minimum -AutoSize | Out-Host
            $s = $Result.Summary
            Write-Host ("Automation: {0} of {1} device group(s) off the ladder; {2} lapsed exclusion(s); {3} emergency access account(s) not excluded; {4} device(s) below the Contain User sensor version." -f $s.groupsOffLadder, $s.groups, $s.exclusionsLapsed, $s.emergencyAccessNotExcluded, @($s.devicesBelowContainUserSensor).Count)
            Write-Host "Written to ${OutputPath}: groups.csv, exclusions.csv, sensor.csv, summary.json, manifest.json"
        }
        default { throw "Unknown task '$Task'." }
    }
}
