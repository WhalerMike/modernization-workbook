# Chapter 01 (guide G1): the unified RBAC role design against the role export, and the Graph read path.

function Read-XdrRoleExport {
    <#
    .SYNOPSIS
        Reads the role export the operator files from the Defender portal (System > Permissions > Microsoft
        Defender XDR > Roles): one row per role, with Role, Permissions and Groups (each list separated by
        semicolons) and DataSources.
    .EXAMPLE
        Read-XdrRoleExport -Path tests/fixtures/inputs/role-export.csv
    #>
    param([Parameter(Mandatory)][string]$Path)
    foreach ($r in Read-XdrCsv -Path $Path) {
        [pscustomobject][ordered]@{
            Role        = "$($r.Role)".Trim()
            Permissions = @("$($r.Permissions)".Split(';') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
            Groups      = @("$($r.Groups)".Split(';') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
            DataSources = "$($r.DataSources)"
        }
    }
}

function Test-XdrRoleDesign {
    <#
    .SYNOPSIS
        Compares the role export with the program's role design (config/roles.json): each designed role
        exists with exactly its permissions; a restricted permission (Advanced live response) is held only by
        the roles allowed it; every assigned group is one PIM governs (settings 'pimGroups'); no emergency
        access group holds a Defender role (settings 'emergencyAccessGroups'). Returns one row per check.
    .EXAMPLE
        Test-XdrRoleDesign -Export (Read-XdrRoleExport -Path x.csv) -Settings $s
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][object[]]$Export, [Parameter(Mandatory)][hashtable]$Settings, [string]$DesignPath = (Join-Path $script:ConfigRoot 'roles.json'))
    $design = Read-XdrJson -Path $DesignPath
    $pim = @($Settings['pimGroups']); $ea = @($Settings['emergencyAccessGroups'])
    $rows = [Collections.Generic.List[object]]::new()
    foreach ($d in $design.roles) {
        $e = @($Export | Where-Object { $_.Role -eq $d.name })
        if (-not $e.Count) { $rows.Add((New-XdrCheck -Id 'ROLE' -Status Fail -Subject $d.name -Detail 'designed role is missing from the export')); continue }
        $missing = @($d.permissions | Where-Object { $_ -notin $e[0].Permissions })
        $extra = @($e[0].Permissions | Where-Object { $_ -notin $d.permissions })
        $ok = -not $missing.Count -and -not $extra.Count
        $detail = if ($ok) { "$($d.permissions.Count) permissions match the design" } else { (@($(if ($missing.Count) { "missing: $($missing -join ', ')" }), $(if ($extra.Count) { "extra: $($extra -join ', ')" })) | Where-Object { $_ }) -join '; ' }
        $rows.Add((New-XdrCheck -Id 'ROLE' -Status $(if ($ok) { 'Pass' } else { 'Fail' }) -Subject $d.name -Detail $detail))
    }
    foreach ($e in $Export) { if ($e.Role -notin @($design.roles | ForEach-Object name)) { $rows.Add((New-XdrCheck -Id 'ROLE' -Status Warn -Subject $e.Role -Detail 'role in the export is not in the design: record a decision or remove it')) } }
    foreach ($perm in $design.restricted.Keys) {
        $holders = @($Export | Where-Object { $perm -in $_.Permissions } | ForEach-Object Role)
        $bad = @($holders | Where-Object { $_ -notin @($design.restricted[$perm]) })
        $rows.Add((New-XdrCheck -Id 'RESTRICTED' -Status $(if ($bad.Count) { 'Fail' } else { 'Pass' }) -Subject $perm -Detail $(if ($bad.Count) { "held by $($bad -join ', '); only $(@($design.restricted[$perm]) -join ', ') may hold it" } else { "held only by $(@($holders) -join ', ')" })))
    }
    foreach ($e in $Export) {
        $standing = @($e.Groups | Where-Object { $_ -notin $pim })
        $rows.Add((New-XdrCheck -Id 'PIM' -Status $(if ($standing.Count) { 'Fail' } else { 'Pass' }) -Subject $e.Role -Detail $(if ($standing.Count) { "assigned to a group PIM doesn't govern: $($standing -join ', ')" } else { "assigned only to PIM-governed groups ($($e.Groups -join ', '))" })))
    }
    $eaHit = @($Export | Where-Object { @($_.Groups | Where-Object { $_ -in $ea }).Count } | ForEach-Object Role)
    $rows.Add((New-XdrCheck -Id 'EMERGENCY' -Status $(if ($eaHit.Count) { 'Fail' } else { 'Pass' }) -Subject 'Emergency access groups' -Detail $(if ($eaHit.Count) { "an emergency access group holds a Defender role: $($eaHit -join ', ')" } else { 'no emergency access group holds a Defender role' })))
    $rows.ToArray()
}

function Invoke-XdrAccessCheck {
    <#
    .SYNOPSIS
        Gate 1's check: the cloud and Graph host the settings name, a first read of incidents (Learn's
        Get-MgSecurityIncident -Top 5, as a Graph GET), the role design against the role export, and the
        permissions each kit task needs. Writes results.json, results.csv, permissions.csv, raw/ and the
        manifest. Reads only.
    .EXAMPLE
        Invoke-XdrAccessCheck -Settings $s -Invoker $inv -OutputPath out/access -AsOf 2026-11-16T12:00:00Z
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][hashtable]$Settings, [Parameter(Mandatory)]$Invoker, [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$AsOf, [string]$RoleExportPath)
    $out = New-XdrRunFolder -OutputPath $OutputPath
    $cloud = Get-XdrCloud -Cloud $Settings.cloud
    $rows = [Collections.Generic.List[object]]::new()
    $rows.Add((New-XdrCheck -Id 'CLOUD' -Status Pass -Subject $Settings.cloud -Detail "Graph $($cloud.Graph) (environment $($cloud.GraphEnvironment)); portal $($cloud.Portal)"))
    try {
        $r = Invoke-XdrCall -Invoker $Invoker -CallId incidents-list -Arguments @{ top = 5 }
        $items = @(@(Get-XdrV $r 'value') | Where-Object { $null -ne $_ } | Select-Object -First 5)
        Write-XdrJson -Path (Join-Path $out 'raw/incidents-top.json') -Value @{ value = $items }
        $rows.Add((New-XdrCheck -Id 'READ' -Status Pass -Subject 'incidents-list' -Detail "$($items.Count) incident(s) returned with no permission error"))
    }
    catch { $rows.Add((New-XdrCheck -Id 'READ' -Status Fail -Subject 'incidents-list' -Detail $_.Exception.Message)) }
    $exportPath = Get-XdrInput -Settings $Settings -Name roleExport -Override $RoleExportPath
    foreach ($c in Test-XdrRoleDesign -Export @(Read-XdrRoleExport -Path $exportPath) -Settings $Settings) { $rows.Add($c) }
    $perm = @(Get-XdrRequiredPermission)
    Write-XdrCsv -Path (Join-Path $out 'permissions.csv') -Rows $perm -Columns Call, Method, Permission, Roles, Writes, Doc
    Write-XdrJson -Path (Join-Path $out 'results.json') -Value @($rows)
    Write-XdrCsv -Path (Join-Path $out 'results.csv') -Rows $rows -Columns Id, Status, Subject, Detail
    $fail = @($rows | Where-Object Status -EQ 'Fail').Count
    $null = Write-XdrManifest -OutputPath $out -Task access -AsOf $AsOf -Mode $Invoker.Mode -Environment $Settings.environment -CallIds @($Invoker.Calls) -Extra @{ result = $(if ($fail) { 'Fail' } else { 'Pass' }); failed = $fail }
    [pscustomobject]@{ Rows = $rows.ToArray(); Failed = $fail; OutputPath = $out }
}
