# Chapter 04 (Book 20, Chapters 02 to 04): labels, label policies and container labels against the plan.

function Get-IpRightsHolder {
    <#
    .SYNOPSIS
        The identities an encrypting label grants rights to, lowercase, from EncryptionRightsDefinitions
        ("identity:RIGHT,RIGHT;identity:RIGHT").
    .EXAMPLE
        Get-IpRightsHolder 'contoso.example:VIEW,EDIT;holders@contoso.example:VIEW'
    #>
    param([AllowNull()][AllowEmptyString()][string]$Definitions)
    if (-not $Definitions) { return @() }
    @($Definitions -split ';' | Where-Object { $_.Trim() } | ForEach-Object { ($_ -split ':', 2)[0].Trim().ToLowerInvariant() } | Sort-Object -Unique)
}

function Find-IpLabel {
    <#
    .SYNOPSIS
        A label from the export by its Name, DisplayName or Guid, or $null.
    .EXAMPLE
        Find-IpLabel -Labels $snap.labels -Name 'CUI Basic'
    #>
    param([AllowNull()][object[]]$Labels, [Parameter(Mandatory)][string]$Name)
    ($Labels | Where-Object { $_ -and ("$(Get-IpV $_ 'Name')" -ieq $Name -or "$(Get-IpV $_ 'DisplayName')" -ieq $Name -or "$(Get-IpV $_ 'Guid')" -ieq $Name) } | Select-Object -First 1)
}

function Test-IpBool {
    <#
    .SYNOPSIS
        A value read as true or false ("True", $true, "1" are true).
    .EXAMPLE
        Test-IpBool 'True'
    #>
    param([AllowNull()]$Value)
    "$Value" -in @('True', 'true', '1', 'Enabled')
}

function Invoke-IpLabels {
    <#
    .SYNOPSIS
        Compares the label export with the plan: every planned label exists with its encryption, header
        marking, rights holders and container properties; no label the plan doesn't have; the priority order;
        every planned label policy with its labels, scope, exclusion group and settings (defaults, mandatory
        labeling), in the planned order. Writes results.csv and labels.csv.
    .EXAMPLE
        Invoke-IpLabels -Settings $s -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/labels -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$SnapshotPath, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf)
    $out = New-IpRunFolder -OutputPath $OutputPath
    $plan = Get-IpPlan -Settings $Settings
    $snap = Read-IpSnapshot -Path $SnapshotPath
    $labels = @($snap.labels | Where-Object { $_ })
    $rows = [Collections.Generic.List[object]]::new()
    $table = [Collections.Generic.List[object]]::new()
    $n = 0
    foreach ($p in @($plan.labels)) {
        $n++
        $l = Find-IpLabel -Labels $labels -Name $p.name
        $id = 'LBL-{0:d2}' -f $n
        if (-not $l) { $rows.Add((New-IpCheck -Id $id -Status Fail -Subject $p.name -Detail 'not in the export')); continue }
        $bad = @()
        $enc = Test-IpBool (Get-IpV $l 'EncryptionEnabled')
        if ($p.Contains('encryption') -and $enc -ne [bool]$p.encryption) { $bad += "encryption $(if ($enc) { 'on' } else { 'off' }), plan says $(if ($p.encryption) { 'on' } else { 'off' })" }
        if ($p.Contains('header')) {
            $h = if (Test-IpBool (Get-IpV $l 'ApplyContentMarkingHeaderEnabled')) { "$(Get-IpV $l 'ApplyContentMarkingHeaderText')" } else { '' }
            if ($h -cne "$($p.header)") { $bad += "header '$h', plan says '$($p.header)'" }
        }
        if ($p.Contains('rightsTo')) {
            $have = @(Get-IpRightsHolder "$(Get-IpV $l 'EncryptionRightsDefinitions')")
            $want = @($p.rightsTo | ForEach-Object { "$_".ToLowerInvariant() } | Sort-Object -Unique)
            if (($have -join ';') -ne ($want -join ';')) { $bad += "rights go to $(if ($have.Count) { $have -join ', ' } else { 'nobody' }), plan says $($want -join ', ')" }
        }
        if ($p.Contains('properties')) {
            foreach ($k in ($p.properties.Keys | Sort-Object)) {
                $v = Get-IpV $l $k
                if ("$v" -ine "$($p.properties[$k])") { $bad += "$k is '$v', plan says '$($p.properties[$k])'" }
            }
        }
        $table.Add([pscustomobject]@{ Label = $p.name; Priority = Get-IpV $l 'Priority'; Encryption = $enc; Header = "$(Get-IpV $l 'ApplyContentMarkingHeaderText')"; RightsTo = (@(Get-IpRightsHolder "$(Get-IpV $l 'EncryptionRightsDefinitions')") -join '; '); Findings = ($bad -join '; ') })
        $rows.Add((New-IpCheck -Id $id -Status $(if ($bad.Count) { 'Fail' } else { 'Pass' }) -Subject $p.name -Detail $(if ($bad.Count) { $bad -join '; ' } else { 'as planned' })))
    }
    $planned = @($plan.labels | ForEach-Object { "$($_.name)".ToLowerInvariant() })
    $extra = @($labels | Where-Object { "$(Get-IpV $_ 'Name')".ToLowerInvariant() -notin $planned -and "$(Get-IpV $_ 'DisplayName')".ToLowerInvariant() -notin $planned } | ForEach-Object { "$(Get-IpV $_ 'DisplayName')" })
    $rows.Add((New-IpCheck -Id 'LBL-EXTRA' -Status $(if ($extra.Count) { 'Fail' } else { 'Pass' }) -Subject 'Labels not in the plan' -Detail $(if ($extra.Count) { "$($extra -join ', '): unpublish or add to the plan with a decision record; never delete a label" } else { 'none' })))
    $order = @($plan.labels | Where-Object { $_.Contains('priority') } | Sort-Object { [int]$_.priority } | ForEach-Object { $l = Find-IpLabel -Labels $labels -Name $_.name; if ($l) { [pscustomobject]@{ Name = $_.name; Priority = [int](Get-IpV $l 'Priority') } } })
    $inOrder = $true; for ($i = 1; $i -lt $order.Count; $i++) { if ($order[$i].Priority -le $order[$i - 1].Priority) { $inOrder = $false } }
    $rows.Add((New-IpCheck -Id 'LBL-ORDER' -Status $(if ($inOrder) { 'Pass' } else { 'Fail' }) -Subject 'Label priority' -Detail $(if ($inOrder) { "$($order.Count) labels in the planned order" } else { 'export order: ' + (@($order | Sort-Object Priority | ForEach-Object Name) -join ' < ') })))

    $policies = @($snap.labelPolicies | Where-Object { $_ })
    $n = 0
    foreach ($p in @($plan.labelPolicies)) {
        $n++
        $id = 'POL-{0:d2}' -f $n
        $pol = ($policies | Where-Object { "$(Get-IpV $_ 'Name')" -ieq $p.name } | Select-Object -First 1)
        if (-not $pol) { $rows.Add((New-IpCheck -Id $id -Status Fail -Subject $p.name -Detail 'not in the export')); continue }
        $bad = @()
        $have = @(@(Get-IpV $pol 'Labels', 'ScopedLabels') | Where-Object { $_ } | ForEach-Object { $l = Find-IpLabel -Labels $labels -Name "$_"; if ($l) { "$(Get-IpV $l 'Name')" } else { "$_" } } | Sort-Object -Unique)
        $want = @($p.labels | ForEach-Object { $l = Find-IpLabel -Labels $labels -Name "$_"; if ($l) { "$(Get-IpV $l 'Name')" } else { "$_" } } | Sort-Object -Unique)
        $miss = @($want | Where-Object { $_ -notin $have }); $more = @($have | Where-Object { $_ -notin $want })
        if ($miss.Count) { $bad += "missing label(s): $($miss -join ', ')" }
        if ($more.Count) { $bad += "label(s) not in the plan: $($more -join ', ')" }
        $scope = @(@(Get-IpV $pol 'ExchangeLocation') | ForEach-Object { if ($_ -is [string]) { $_ } else { "$(Get-IpV $_ 'Name', 'DisplayName')" } })
        if ($p.Contains('scope') -and "$($p.scope)" -notin $scope) { $bad += "scope is $(if ($scope.Count) { $scope -join ', ' } else { 'empty' }), plan says $($p.scope)" }
        if ($p.Contains('exclusion')) {
            $ex = @(@(Get-IpV $pol 'ExchangeLocationException') | ForEach-Object { if ($_ -is [string]) { $_ } else { "$(Get-IpV $_ 'Name', 'DisplayName')" } })
            if ("$($p.exclusion)" -notin $ex) { $bad += "exclusion group $($p.exclusion) not set" }
        }
        if ($p.Contains('settings')) {
            $set = ConvertFrom-IpSettingList (Get-IpV $pol 'Settings')
            foreach ($k in ($p.settings.Keys | Sort-Object)) {
                $want1 = "$($p.settings[$k])"; $l = Find-IpLabel -Labels $labels -Name $want1
                $ok1 = $set.Contains($k.ToLowerInvariant()) -and ($set[$k.ToLowerInvariant()] -ieq $want1 -or ($l -and $set[$k.ToLowerInvariant()] -ieq "$(Get-IpV $l 'Guid')"))
                if (-not $ok1) { $bad += "setting $k is '$(if ($set.Contains($k.ToLowerInvariant())) { $set[$k.ToLowerInvariant()] } else { 'not set' })', plan says '$want1'" }
            }
        }
        $rows.Add((New-IpCheck -Id $id -Status $(if ($bad.Count) { 'Fail' } else { 'Pass' }) -Subject $p.name -Detail $(if ($bad.Count) { $bad -join '; ' } else { 'as planned' })))
    }
    $po = @($plan.labelPolicies | ForEach-Object { $x = $_.name; $pol = ($policies | Where-Object { "$(Get-IpV $_ 'Name')" -ieq $x } | Select-Object -First 1); if ($pol) { [int](Get-IpV $pol 'Priority') } })
    $pOk = $true; for ($i = 1; $i -lt $po.Count; $i++) { if ($po[$i] -le $po[$i - 1]) { $pOk = $false } }
    $rows.Add((New-IpCheck -Id 'POL-ORDER' -Status $(if ($pOk) { 'Pass' } else { 'Fail' }) -Subject 'Label policy order' -Detail $(if ($pOk) { 'policies in the planned order' } else { 'the export''s policy priorities are not in the planned order' })))
    Write-IpCsv -Path (Join-Path $out 'labels.csv') -Rows $table.ToArray() -Columns Label, Priority, Encryption, Header, RightsTo, Findings
    Complete-IpRun -Task labels -Rows $rows.ToArray() -OutputPath $out -AsOf $AsOf -Settings $Settings -SnapshotPath $SnapshotPath
}
