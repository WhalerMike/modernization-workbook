# Chapter 07 (guide G8 and G9): identity and cloud-app signals in one query, and Defender's automation matched
# to the response ladder.

function Invoke-XdrSignalsCheck {
    <#
    .SYNOPSIS
        Gate 8's check: the guide's cross-source query (users with alerts from more than one service in 7
        days), as a priority list. The check passes when rows come back and at least one names a source other
        than Defender for Endpoint, which shows the identity and cloud-app sources feeding alerts. A user who
        is an emergency access account (settings 'emergencyAccessAccounts') is flagged for the IR lead.
        Writes priority.csv, summary.json and the manifest. Reads only.
    .EXAMPLE
        Invoke-XdrSignalsCheck -Settings $s -Invoker $inv -OutputPath out/signals -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf)
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $ea = @($Settings['emergencyAccessAccounts'] | ForEach-Object { "$_".ToLowerInvariant() })
    $rows = @(Invoke-XdrHunting -Invoker $Invoker -Name cross-source-users -OutputPath $out | ForEach-Object {
            $upn = "$(Get-XdrV $_ 'AccountUpn')"
            $src = @(Get-XdrV $_ 'SourceList' | ForEach-Object { "$_" })
            [pscustomobject][ordered]@{
                AccountUpn = $upn; AccountObjectId = "$(Get-XdrV $_ 'AccountObjectId')"; Sources = [int](Get-XdrV $_ 'Sources'); SourceList = ($src -join '; ')
                Alerts = [int](Get-XdrV $_ 'Alerts'); EmergencyAccess = ($upn.ToLowerInvariant() -in $ea)
                Action = $(if ($upn.ToLowerInvariant() -in $ea) { 'Emergency access account: page the IR lead; a human decides any containment' } elseif ([int](Get-XdrV $_ 'Sources') -ge 3) { 'Priority: three or more sources' } else { 'Review in the weekly hunt' })
            } })
    $rows = @($rows | Sort-Object @{ e = 'EmergencyAccess'; Descending = $true }, @{ e = 'Sources'; Descending = $true }, @{ e = 'Alerts'; Descending = $true })
    Write-XdrCsv -Path (Join-Path $out 'priority.csv') -Rows $rows -Columns AccountUpn, AccountObjectId, Sources, SourceList, Alerts, EmergencyAccess, Action
    $services = @($rows | ForEach-Object { $_.SourceList -split '; ' } | Where-Object { $_ } | Sort-Object -Unique)
    $beyond = @($services | Where-Object { $_ -notlike '*Defender for Endpoint*' })
    $sum = [ordered]@{ asOf = (ConvertTo-XdrUtc $AsOf); users = $rows.Count; services = $services; emergencyAccess = @($rows | Where-Object EmergencyAccess).Count
        feeding = $(if ($rows.Count -and $beyond.Count) { 'identity or cloud-app sources are feeding alerts' } else { 'no row names a source beyond the endpoint: check the Defender for Identity sensors and the Cloud Apps connectors' }) }
    Write-XdrJson -Path (Join-Path $out 'summary.json') -Value $sum
    $null = Write-XdrManifest -OutputPath $out -Task signals -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds @($Invoker.Calls) -Extra @{ result = $(if ($rows.Count -and $beyond.Count) { 'Pass' } else { 'Fail' }) }
    [pscustomobject]@{ Rows = $rows; Summary = $sum; OutputPath = $out }
}

function ConvertTo-XdrVersion {
    <#
    .SYNOPSIS
        Parses a version string such as 10.8470.26100.1, or returns nothing.
    .EXAMPLE
        ConvertTo-XdrVersion '10.8470.26100.1'
    #>
    param([AllowNull()][AllowEmptyString()][string]$Text)
    $v = $null
    if ($Text -and [version]::TryParse($Text.Trim().TrimStart('v'), [ref]$v)) { return $v }
    $null
}

function Invoke-XdrAutomationCheck {
    <#
    .SYNOPSIS
        Gate 9's check: the device groups export (each group's remediation level and the kind the agency
        recorded: workstation, pilot or server) against the ladder (config/ladder.json); the attack disruption
        exclusions (each approved with a review date not yet passed, and every emergency access account
        excluded as an identity); and each device's sensor version against the minimum Contain User needs.
        Writes groups.csv, exclusions.csv, sensor.csv, summary.json and the manifest. Reads files only: the
        portal holds these settings and Learn names no Graph API for them.
    .EXAMPLE
        Invoke-XdrAutomationCheck -Settings $s -OutputPath out/automation -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf,
        [string]$DeviceGroupsPath, [string]$ExclusionsPath, [string]$DeviceStatePath, [string]$LadderPath = (Join-Path $script:ConfigRoot 'ladder.json'))
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $ladder = Read-XdrJson -Path $LadderPath
    $now = Get-XdrDate $AsOf
    $groups = @(Read-XdrCsv -Path (Get-XdrInput -Settings $Settings -Name deviceGroups -Override $DeviceGroupsPath) | ForEach-Object {
            $kind = "$($_.Kind)"; $lvl = "$($_.RemediationLevel)"
            $allowed = @(if ($ladder.allowed.Contains($kind)) { $ladder.allowed[$kind] })
            $status = if ($lvl -notin @($ladder.levels)) { 'Fail' } elseif (-not $allowed.Count) { 'Fail' } elseif ($lvl -in $allowed) { 'Pass' } elseif ($kind -eq 'workstation' -and "$($_.ExceptionId)") { 'Pass' } else { 'Fail' }
            $detail = if ($lvl -notin @($ladder.levels)) { "'$lvl' is not one of Defender's five levels" } elseif (-not $allowed.Count) { "kind '$kind' isn't workstation, pilot or server" } elseif ($lvl -in $allowed) { 'matches the ladder' } elseif ($status -eq 'Pass') { "recorded exception $($_.ExceptionId)" } else { "the ladder allows $($allowed -join ' or ')" }
            [pscustomobject][ordered]@{ Name = "$($_.Name)"; Kind = $kind; RemediationLevel = $lvl; Status = $status; Detail = $detail } })
    $exc = @(Read-XdrCsv -Path (Get-XdrInput -Settings $Settings -Name automationExclusions -Override $ExclusionsPath) | ForEach-Object {
            $rev = if ("$($_.ReviewBy)") { Get-XdrDate $_.ReviewBy } else { $null }
            $ok = [bool]("$($_.Approver)" -and $rev -and $rev -gt $now)
            [pscustomobject][ordered]@{ Type = "$($_.Type)"; Value = "$($_.Value)"; Reason = "$($_.Reason)"; Approver = "$($_.Approver)"; ReviewBy = "$($_.ReviewBy)"; Status = $(if ($ok) { 'Pass' } else { 'Fail' }); Detail = $(if ($ok) { 'approved, review date ahead' } elseif (-not "$($_.Approver)") { 'no approver' } else { 'review date passed' }) } })
    $eaRows = foreach ($a in @($Settings['emergencyAccessAccounts'])) {
        $hit = @($exc | Where-Object { $_.Type -eq 'Identity' -and $_.Value -ieq $a -and $_.Status -eq 'Pass' })
        [pscustomobject][ordered]@{ Type = 'Identity'; Value = $a; Reason = 'emergency access account'; Approver = ''; ReviewBy = ''; Status = $(if ($hit.Count) { 'Pass' } else { 'Fail' }); Detail = $(if ($hit.Count) { 'excluded from automated containment' } else { 'emergency access account is not in the identity exclusions' }) }
    }
    $min = ConvertTo-XdrVersion $ladder.containUserMinimumSense
    $states = Read-XdrDeviceStates -Path (Get-XdrInput -Settings $Settings -Name deviceStates -Override $DeviceStatePath)
    $sensor = @(foreach ($k in $states.Keys) {
            $v = ConvertTo-XdrVersion "$($states[$k].senseVersion)"
            [pscustomobject][ordered]@{ DeviceName = $k; SenseVersion = "$($states[$k].senseVersion)"; Minimum = "$($ladder.containUserMinimumSense)"; Status = $(if ($v -and $v -ge $min) { 'Pass' } else { 'Fail' }) }
        })
    Write-XdrCsv -Path (Join-Path $out 'groups.csv') -Rows $groups -Columns Name, Kind, RemediationLevel, Status, Detail
    Write-XdrCsv -Path (Join-Path $out 'exclusions.csv') -Rows (@($exc) + @($eaRows)) -Columns Type, Value, Reason, Approver, ReviewBy, Status, Detail
    Write-XdrCsv -Path (Join-Path $out 'sensor.csv') -Rows $sensor -Columns DeviceName, SenseVersion, Minimum, Status
    $sum = [ordered]@{ asOf = (ConvertTo-XdrUtc $AsOf); groups = $groups.Count; groupsOffLadder = @($groups | Where-Object Status -EQ 'Fail').Count
        exclusions = $exc.Count; exclusionsLapsed = @($exc | Where-Object Status -EQ 'Fail').Count; emergencyAccessNotExcluded = @($eaRows | Where-Object Status -EQ 'Fail').Count
        devicesBelowContainUserSensor = @($sensor | Where-Object Status -EQ 'Fail' | ForEach-Object DeviceName) }
    Write-XdrJson -Path (Join-Path $out 'summary.json') -Value $sum
    $bad = $sum.groupsOffLadder + $sum.exclusionsLapsed + $sum.emergencyAccessNotExcluded
    $null = Write-XdrManifest -OutputPath $out -Task automation -AsOf $AsOf -Mode 'Files' -Environment $Settings.environment -Extra @{ result = $(if ($bad) { 'Fail' } else { 'Pass' }); inputs = 'files: the device groups export, the attack disruption exclusions, device states' }
    [pscustomobject]@{ Groups = $groups; Exclusions = @($exc) + @($eaRows); Sensor = $sensor; Summary = $sum; OutputPath = $out }
}
