# Chapter 05 (Book 20, Chapters 05 to 07): Rights Management and recovery, message encryption, co-authoring.

function Compare-IpProperty {
    <#
    .SYNOPSIS
        The differences between an exported object and the properties a plan expects, as "Name is 'x', plan
        says 'y'" strings. A boolean in the plan is compared as true or false.
    .EXAMPLE
        Compare-IpProperty -Item @{ OTPEnabled = 'True' } -Expected @{ OTPEnabled = $true }
    #>
    param([AllowNull()]$Item, [Parameter(Mandatory)][Collections.IDictionary]$Expected)
    foreach ($k in ($Expected.Keys | Sort-Object)) {
        $v = Get-IpV $Item $k; $w = $Expected[$k]
        $same = if ($w -is [bool]) { (Test-IpBool $v) -eq $w } else { "$v" -ieq "$w" }
        if (-not $same) { "$k is '$v', plan says '$w'" }
    }
}

function Get-IpRuleExpectation {
    <#
    .SYNOPSIS
        What a mail flow rule's stage means: audit is State Enabled in an audit mode; enforce is State Enabled,
        Mode Enforce; retired is State Disabled.
    .EXAMPLE
        Get-IpRuleExpectation -Stage enforce
    #>
    param([Parameter(Mandatory)][ValidateSet('audit', 'enforce', 'retired')][string]$Stage)
    switch ($Stage) {
        'audit' { @{ State = 'Enabled'; Modes = @('Audit', 'AuditAndNotify') } }
        'enforce' { @{ State = 'Enabled'; Modes = @('Enforce') } }
        'retired' { @{ State = 'Disabled'; Modes = @() } }
    }
}

function Invoke-IpProtection {
    <#
    .SYNOPSIS
        Checks the protection side of the export against the plan: the Rights Management service is enabled
        and the super user feature is off with no standing super users; the IRM and message encryption
        settings; every planned mail flow rule in the state and mode its stage says, applying its template;
        and co-authoring on encrypted files. Writes results.csv and mail-flow-rules.csv.
    .EXAMPLE
        Invoke-IpProtection -Settings $s -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/protection -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$SnapshotPath, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf)
    $out = New-IpRunFolder -OutputPath $OutputPath
    $plan = Get-IpPlan -Settings $Settings
    $snap = Read-IpSnapshot -Path $SnapshotPath
    $rows = [Collections.Generic.List[object]]::new()

    $aip = ($snap.aipConfiguration | Where-Object { $_ } | Select-Object -First 1)
    if (-not $aip) { $rows.Add((New-IpCheck -Id 'RMS-01' -Status Info -Subject 'Rights Management' -Detail 'not read (reads.rightsManagement is off); run the G5 Validate commands by hand')) }
    else {
        $rm = $plan.rightsManagement
        $state = "$(Get-IpV $aip 'FunctionalState')"
        $rows.Add((New-IpCheck -Id 'RMS-01' -Status $(if (-not $state -or $state -eq 'Enabled') { 'Pass' } else { 'Fail' }) -Subject 'Rights Management service' -Detail $(if ($state) { "FunctionalState $state" } else { 'FunctionalState not in the export; confirm with Get-AipService' })))
        $su = "$(Get-IpV $aip 'SuperUsersEnabled')"; $users = @(Get-IpV $aip 'SuperUsers' | Where-Object { $_ })
        $wantSu = if ($rm -and $rm.Contains('superUserFeature')) { "$($rm.superUserFeature)" } else { 'Disabled' }
        $rows.Add((New-IpCheck -Id 'RMS-02' -Status $(if ($su -eq $wantSu) { 'Pass' } else { 'Fail' }) -Subject 'Super user feature' -Detail $(if ($su -eq $wantSu) { "$su at rest" } else { "${su}: a standing ability to decrypt everything. Run the recovery procedure's last step, or explain the open recovery ticket" })))
        $rows.Add((New-IpCheck -Id 'RMS-03' -Status $(if (-not $users.Count) { 'Pass' } else { 'Fail' }) -Subject 'Super users' -Detail $(if ($users.Count) { "standing super user(s): $($users -join ', ')" } else { 'none standing' })))
    }

    $irm = ($snap.irmConfiguration | Where-Object { $_ } | Select-Object -First 1)
    if ($plan.Contains('irm')) {
        $d = @(if ($irm) { Compare-IpProperty -Item $irm -Expected $plan.irm } else { 'irm-configuration.json is missing' })
        $rows.Add((New-IpCheck -Id 'IRM-01' -Status $(if ($d.Count) { 'Fail' } else { 'Pass' }) -Subject 'IRM configuration' -Detail $(if ($d.Count) { $d -join '; ' } else { 'as planned' })))
    }
    $n = 0
    foreach ($o in @($plan.ome)) {
        if (-not $o) { continue }
        $n++
        $cfg = ($snap.omeConfiguration | Where-Object { $_ -and "$(Get-IpV $_ 'Identity', 'Name')" -eq $o.identity } | Select-Object -First 1)
        $d = @(if ($cfg) { Compare-IpProperty -Item $cfg -Expected $o.properties } else { 'not in the export' })
        $rows.Add((New-IpCheck -Id ('OME-{0:d2}' -f $n) -Status $(if ($d.Count) { 'Fail' } else { 'Pass' }) -Subject $o.identity -Detail $(if ($d.Count) { $d -join '; ' } else { 'as planned' })))
    }
    $table = [Collections.Generic.List[object]]::new()
    $n = 0
    foreach ($t in @($plan.transportRules)) {
        if (-not $t) { continue }
        $n++
        $e = Get-IpRuleExpectation -Stage $t.stage
        $r = ($snap.transportRules | Where-Object { $_ -and "$(Get-IpV $_ 'Name')" -eq $t.name } | Select-Object -First 1)
        $bad = @()
        if (-not $r) { $bad += 'not in the export' }
        else {
            $state = "$(Get-IpV $r 'State')"; $mode = "$(Get-IpV $r 'Mode')"
            if ($state -ne $e.State) { $bad += "State $state, stage $($t.stage) needs $($e.State)" }
            if ($e.Modes.Count -and $mode -notin $e.Modes) { $bad += "Mode $mode, stage $($t.stage) needs $($e.Modes -join ' or ')" }
            if ($t.Contains('template') -and "$(Get-IpV $r 'ApplyRightsProtectionTemplate')" -ne $t.template) { $bad += "applies '$(Get-IpV $r 'ApplyRightsProtectionTemplate')', plan says '$($t.template)'" }
            $table.Add([pscustomobject]@{ Rule = $t.name; Stage = $t.stage; State = $state; Mode = $mode; Template = "$(Get-IpV $r 'ApplyRightsProtectionTemplate')"; Findings = ($bad -join '; ') })
        }
        $rows.Add((New-IpCheck -Id ('MFR-{0:d2}' -f $n) -Status $(if ($bad.Count) { 'Fail' } else { 'Pass' }) -Subject $t.name -Detail $(if ($bad.Count) { $bad -join '; ' } else { "$($t.stage), as planned" })))
    }
    if ($plan.Contains('policyConfig')) {
        $pc = ($snap.policyConfig | Where-Object { $_ } | Select-Object -First 1)
        $d = @(if ($pc) { Compare-IpProperty -Item $pc -Expected $plan.policyConfig } else { 'policy-config.json is missing' })
        $rows.Add((New-IpCheck -Id 'COA-01' -Status $(if ($d.Count) { 'Fail' } else { 'Pass' }) -Subject 'Co-authoring on encrypted files' -Detail $(if ($d.Count) { $d -join '; ' } else { 'as planned' })))
    }
    Write-IpCsv -Path (Join-Path $out 'mail-flow-rules.csv') -Rows $table.ToArray() -Columns Rule, Stage, State, Mode, Template, Findings
    Complete-IpRun -Task protection -Rows $rows.ToArray() -OutputPath $out -AsOf $AsOf -Settings $Settings -SnapshotPath $SnapshotPath
}
