# Chapter 01: the settings, the cloud, the snapshot's tenant, the role register and the permissions per read.

function Get-IpMemberId {
    <#
    .SYNOPSIS
        The identities a role group member can be matched by (lowercase): its sign-in name, address or name.
        Learn's Get-RoleGroupMember page lists no output properties, so the kit accepts any of them.
    .EXAMPLE
        Get-IpMemberId @{ WindowsLiveID = 'a@contoso.example' }
    #>
    param([AllowNull()]$Member)
    if ($Member -is [string]) { return @($Member.ToLowerInvariant()) }
    @('WindowsLiveID', 'UserPrincipalName', 'PrimarySmtpAddress', 'Name' | ForEach-Object { Get-IpV $Member $_ } | Where-Object { $_ } | ForEach-Object { "$_".ToLowerInvariant() })
}

function Invoke-IpAccess {
    <#
    .SYNOPSIS
        Checks that the settings name a known cloud and a tenant, that the snapshot came from that tenant, and
        that every Purview role group in the role register holds exactly the people it names, with reviews in
        date. Writes results.csv, role-groups.csv and permissions.csv.
    .EXAMPLE
        Invoke-IpAccess -Settings $s -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/access -AsOf 2026-11-24T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)][string]$SnapshotPath, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf)
    $out = New-IpRunFolder -OutputPath $OutputPath
    $now = Get-IpDate $AsOf
    $rows = [Collections.Generic.List[object]]::new()
    $rows.Add((New-IpCheck -Id 'ACC-01' -Status Pass -Subject 'Settings' -Detail "environment $($Settings.environment), cloud $($Settings.cloud), tenant $($Settings.tenantDomain)"))
    $m = Join-Path $SnapshotPath 'manifest.json'
    if (-not (Test-Path -LiteralPath $m)) { $rows.Add((New-IpCheck -Id 'ACC-02' -Status Fail -Subject 'Snapshot' -Detail 'no manifest.json: export it with Export-IpBaseline.ps1')) }
    else {
        $sm = Read-IpJson -Path $m
        $ok = "$($sm.tenantId)" -eq "$($Settings.tenantId)" -and "$($sm.cloud)" -eq "$($Settings.cloud)"
        $rows.Add((New-IpCheck -Id 'ACC-02' -Status $(if ($ok) { 'Pass' } else { 'Fail' }) -Subject 'Snapshot' -Detail "exported $($sm.asOf) from tenant $($sm.tenantId) ($($sm.cloud))$(if (-not $ok) { '; not the settings'' tenant or cloud' })"))
    }
    $snap = Read-IpSnapshot -Path $SnapshotPath
    $register = @(Read-IpCsv -Path (Get-IpInput -Settings $Settings -Name roleRegister))
    $actual = @{}; foreach ($g in @($snap.roleGroups)) { if ($g) { $actual["$(Get-IpV $g 'Name')"] = @(Get-IpV $g 'Members') } }
    $detail = [Collections.Generic.List[object]]::new()
    $n = 0
    foreach ($grp in @($register | Group-Object roleGroup | Sort-Object Name)) {
        $n++
        $want = @($grp.Group | ForEach-Object { "$($_.member)".ToLowerInvariant() })
        if (-not $actual.Contains($grp.Name)) { $rows.Add((New-IpCheck -Id ('ROLE-{0:d2}' -f $n) -Status Fail -Subject $grp.Name -Detail 'not in the export: export again with this role register')); continue }
        $have = @($actual[$grp.Name] | ForEach-Object { $ids = @(Get-IpMemberId $_); [pscustomobject]@{ Ids = $ids; Show = $(if ($ids.Count) { $ids[0] } else { '(unnamed)' }) } })
        $extra = @($have | Where-Object { $ids = $_.Ids; -not @($ids | Where-Object { $_ -in $want }).Count } | ForEach-Object Show)
        $missing = @($want | Where-Object { $w = $_; -not @($have | Where-Object { $w -in $_.Ids }).Count })
        $late = @($grp.Group | Where-Object { $_.reviewBy -and (Get-IpDate $_.reviewBy) -lt $now } | ForEach-Object member)
        foreach ($x in $extra) { $detail.Add([pscustomobject]@{ RoleGroup = $grp.Name; Member = $x; Finding = 'holds the role but is not in the register' }) }
        foreach ($x in $missing) { $detail.Add([pscustomobject]@{ RoleGroup = $grp.Name; Member = $x; Finding = 'in the register but does not hold the role' }) }
        foreach ($x in $late) { $detail.Add([pscustomobject]@{ RoleGroup = $grp.Name; Member = $x; Finding = 'review overdue' }) }
        $st = if ($extra.Count -or $missing.Count) { 'Fail' } elseif ($late.Count) { 'Warn' } else { 'Pass' }
        $d = if ($st -eq 'Pass') { "$($want.Count) member(s), as the register says" } else { (@(if ($extra.Count) { "not in the register: $($extra -join ', ')" }; if ($missing.Count) { "missing: $($missing -join ', ')" }; if ($late.Count) { "review overdue: $($late -join ', ')" }) -join '; ') }
        $rows.Add((New-IpCheck -Id ('ROLE-{0:d2}' -f $n) -Status $st -Subject $grp.Name -Detail $d))
    }
    Write-IpCsv -Path (Join-Path $out 'role-groups.csv') -Rows $detail.ToArray() -Columns RoleGroup, Member, Finding
    Write-IpCsv -Path (Join-Path $out 'permissions.csv') -Rows @(Get-IpRequiredPermission) -Columns Read, Cmdlet, Shell, Role, File, Doc
    Complete-IpRun -Task access -Rows $rows.ToArray() -OutputPath $out -AsOf $AsOf -Settings $Settings -SnapshotPath $SnapshotPath
}
