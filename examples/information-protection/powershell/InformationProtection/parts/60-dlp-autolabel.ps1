# Chapter 06 (Book 20, Chapters 08, 09 and 11): DLP and auto-labeling stages, and the exception register.

# A stage in the plan, and the Mode values Learn gives for New-DlpCompliancePolicy and
# New-AutoSensitivityLabelPolicy that it allows.
$script:StageModes = @{
    simulation = @('TestWithoutNotifications', 'TestWithNotifications')
    notify     = @('TestWithNotifications')
    enforce    = @('Enable')
    retired    = @('Disable')
}

function Test-IpStage {
    <#
    .SYNOPSIS
        Compares exported policies with the plan's stages: one row per planned policy (missing, or in a Mode
        its stage doesn't allow), and one row for exported policies the plan doesn't name.
    .EXAMPLE
        Test-IpStage -Prefix DLP -Planned $plan.dlpPolicies -Exported $snap.dlpPolicies
    #>
    param([Parameter(Mandatory)][string]$Prefix, [AllowNull()][object[]]$Planned, [AllowNull()][object[]]$Exported, [string]$Noun = 'policy')
    $n = 0
    foreach ($p in @($Planned | Where-Object { $_ })) {
        $n++
        if (-not $script:StageModes.Contains("$($p.stage)")) { throw "Plan: $($p.name) has stage '$($p.stage)'; use simulation, notify, enforce or retired." }
        $e = ($Exported | Where-Object { $_ -and "$(Get-IpV $_ 'Name')" -eq $p.name } | Select-Object -First 1)
        $id = '{0}-{1:d2}' -f $Prefix, $n
        if (-not $e) { New-IpCheck -Id $id -Status Fail -Subject $p.name -Detail 'not in the export'; continue }
        $mode = "$(Get-IpV $e 'Mode')"; $ok = $mode -in $script:StageModes["$($p.stage)"]
        $why = if ($ok) { "$mode, as stage $($p.stage) says" }
        elseif ($mode -eq 'Enable') { "$mode, but the plan's stage is $($p.stage): enforcing without the approval the plan records" }
        elseif ($p.stage -eq 'enforce') { "$mode, but the plan's stage is enforce: enforcement is off" }
        else { "$mode, but the plan's stage is $($p.stage) ($($script:StageModes["$($p.stage)"] -join ' or '))" }
        New-IpCheck -Id $id -Status $(if ($ok) { 'Pass' } else { 'Fail' }) -Subject $p.name -Detail $why
    }
    $names = @($Planned | Where-Object { $_ } | ForEach-Object { "$($_.name)" })
    $extra = @($Exported | Where-Object { $_ -and "$(Get-IpV $_ 'Name')" -notin $names } | ForEach-Object { "$(Get-IpV $_ 'Name') ($(Get-IpV $_ 'Mode'))" })
    New-IpCheck -Id "$Prefix-EXTRA" -Status $(if ($extra.Count) { 'Fail' } else { 'Pass' }) -Subject "Exported $Noun not in the plan" -Detail $(if ($extra.Count) { $extra -join ', ' } else { 'none' })
}

function Invoke-IpDlp {
    <#
    .SYNOPSIS
        Checks DLP against the plan and the exception register: each planned policy in the Mode its stage
        allows; no unplanned policy; every rule-level recipient-domain exception and policy-level sender
        exception in the register; no register entry past its expiry. Writes results.csv and exceptions.csv.
    .EXAMPLE
        Invoke-IpDlp -Settings $s -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/dlp -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$SnapshotPath, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf)
    $out = New-IpRunFolder -OutputPath $OutputPath
    $plan = Get-IpPlan -Settings $Settings
    $snap = Read-IpSnapshot -Path $SnapshotPath
    $now = Get-IpDate $AsOf
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($r in @(Test-IpStage -Prefix DLP -Planned @($plan.dlpPolicies) -Exported @($snap.dlpPolicies))) { $rows.Add($r) }
    $register = @(Read-IpCsv -Path (Get-IpInput -Settings $Settings -Name exceptions))
    $found = [Collections.Generic.List[object]]::new()
    foreach ($rule in @($snap.dlpRules | Where-Object { $_ })) {
        $pol = "$(Get-IpV $rule 'ParentPolicyName', 'Policy')"
        foreach ($d in @(Get-IpV $rule 'ExceptIfRecipientDomainIs' | Where-Object { $_ })) { $found.Add([pscustomobject]@{ Kind = 'dlp-recipient-domain'; Policy = $pol; Target = "$d"; Where = "rule $(Get-IpV $rule 'Name')" }) }
    }
    foreach ($p in @($snap.dlpPolicies | Where-Object { $_ })) {
        foreach ($g in @(Get-IpV $p 'ExchangeSenderMemberOfException' | Where-Object { $_ })) {
            $gn = if ($g -is [string]) { $g } else { "$(Get-IpV $g 'Name', 'DisplayName')" }
            $found.Add([pscustomobject]@{ Kind = 'dlp-sender-group'; Policy = "$(Get-IpV $p 'Name')"; Target = $gn; Where = 'policy' })
        }
    }
    $table = [Collections.Generic.List[object]]::new()
    $n = 0
    foreach ($f in $found) {
        $n++
        $e = ($register | Where-Object { $_.kind -eq $f.Kind -and $_.target -ieq $f.Target -and $_.policy -eq $f.Policy } | Select-Object -First 1)
        $st = if (-not $e) { 'Fail' } elseif ((Get-IpDate $e.expires) -lt $now) { 'Fail' } else { 'Pass' }
        $d = if (-not $e) { "$($f.Kind) $($f.Target) on $($f.Policy) ($($f.Where)) has no entry in the exception register" } elseif ($st -eq 'Fail') { "$($e.id) expired $($e.expires)" } else { "$($e.id), approved by $($e.approver), expires $($e.expires)" }
        $rows.Add((New-IpCheck -Id ('EXC-{0:d2}' -f $n) -Status $st -Subject "$($f.Policy): $($f.Target)" -Detail $d))
        $table.Add([pscustomobject]@{ Kind = $f.Kind; Policy = $f.Policy; Target = $f.Target; Register = $(if ($e) { $e.id } else { '' }); Expires = $(if ($e) { $e.expires } else { '' }); Status = $st })
    }
    $expired = @($register | Where-Object { $_.expires -and (Get-IpDate $_.expires) -lt $now })
    $rows.Add((New-IpCheck -Id 'EXC-EXPIRED' -Status $(if ($expired.Count) { 'Fail' } else { 'Pass' }) -Subject 'Exception register' -Detail $(if ($expired.Count) { "past expiry: $(@($expired | ForEach-Object { "$($_.id) ($($_.kind), $($_.expires))" }) -join ', ')" } else { "$($register.Count) entr(ies), none past expiry" })))
    Write-IpCsv -Path (Join-Path $out 'exceptions.csv') -Rows $table.ToArray() -Columns Kind, Policy, Target, Register, Expires, Status
    Complete-IpRun -Task dlp -Rows $rows.ToArray() -OutputPath $out -AsOf $AsOf -Settings $Settings -SnapshotPath $SnapshotPath
}

function Invoke-IpAutoLabel {
    <#
    .SYNOPSIS
        Checks auto-labeling against the plan: each planned policy in the Mode its stage allows (a policy in
        Enable that the plan still has in simulation is labeling without approval); no unplanned policy; and
        every custom sensitive information type the plan names is in the tenant's catalog. Writes results.csv.
    .EXAMPLE
        Invoke-IpAutoLabel -Settings $s -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/autolabel -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$SnapshotPath, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf)
    $out = New-IpRunFolder -OutputPath $OutputPath
    $plan = Get-IpPlan -Settings $Settings
    $snap = Read-IpSnapshot -Path $SnapshotPath
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($r in @(Test-IpStage -Prefix AUTO -Planned @($plan.autoLabelPolicies) -Exported @($snap.autoLabelPolicies))) { $rows.Add($r) }
    $n = 0
    foreach ($t in @($plan.customSits | Where-Object { $_ })) {
        $n++
        $e = ($snap.sitCatalog | Where-Object { $_ -and "$(Get-IpV $_ 'Name')" -eq $t } | Select-Object -First 1)
        $rows.Add((New-IpCheck -Id ('SIT-{0:d2}' -f $n) -Status $(if ($e) { 'Pass' } else { 'Fail' }) -Subject $t -Detail $(if ($e) { "in the catalog, publisher $(Get-IpV $e 'Publisher')" } else { 'not in the catalog: import its rule package and test it with Test-DataClassification' })))
    }
    Complete-IpRun -Task autolabel -Rows $rows.ToArray() -OutputPath $out -AsOf $AsOf -Settings $Settings -SnapshotPath $SnapshotPath
}
