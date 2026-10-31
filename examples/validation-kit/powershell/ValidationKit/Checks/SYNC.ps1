<#
.SYNOPSIS
    Sync: VK-SYNC-01, VK-SYNC-02 (optional) and VK-SYNC-03. Read-only.
    Sources: Attribute-Driven Migration implementation guide, Gate 3; Book 02, Chapter 09
    (filtering) and Chapter 10 (Phase 1 attribute spot check and object counts); Book 03,
    Chapter 12 (Phase 3 shadow mode); Developer Workbook, Chapter 03 (VK-SYNC-02 is its worked
    example).
#>

function Invoke-VkSync01 {
    <#
    VK-SYNC-01. The coded slots for a sample of users, as AD holds them (ad-slot-export.csv:
    EmployeeId and one column per coded slot, such as extensionAttribute10), compared with the
    same slots in Entra ID, joined on employeeId. The kit doesn't read AD for this check: the
    export is an input, so the operator chooses the sample and the read happens with the
    operator's own tools. Reports a sample row with no Entra user, a key held by more than one
    Entra user, and each slot whose value differs (blank on one side counts). A slot missing
    from the export's columns isn't compared. Permission: User.Read.All. NotApplicable when
    the export isn't supplied.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-SYNC-01' $Context {
        param($Context)
        $export = Read-VkInputCsv -Context $Context -Option 'AdSlotExportFile'
        if ($null -eq $export) { return Get-VkNotApplicable "No AD slot export ($($Context.Options['AdSlotExportFile'])) supplied" }
        $slots = @($Context.Options['CodedSlots'])
        $byKey = @{}
        foreach ($u in @(Get-VkData -Context $Context -Name 'users' -Uri $script:VkUsersUri)) {
            $k = "$(Get-VkValue $u 'employeeId' '')".Trim()
            if (-not $k) { continue }
            if (-not $byKey.ContainsKey($k)) { $byKey[$k] = [System.Collections.Generic.List[object]]::new() }
            $byKey[$k].Add($u)
        }
        $n = 0; $compared = 0
        $rows = foreach ($r in $export) {
            $key = "$(Get-VkValue $r 'EmployeeId' '')".Trim()
            if (-not $key) { continue }
            $n++
            $found = @()
            if ($byKey.ContainsKey($key)) { $found = @($byKey[$key]) }
            if ($found.Count -eq 0) {
                ConvertTo-VkFinding -Severity Finding -Object $key -Issue 'In the AD sample, but no Entra user holds this employeeId' -Data ([ordered]@{ EmployeeId = $key })
                continue
            }
            if ($found.Count -gt 1) {
                ConvertTo-VkFinding -Severity Finding -Object $key -Issue 'More than one Entra user holds this employeeId: the slots can''t be compared' -Data ([ordered]@{ EmployeeId = $key; Users = @($found | ForEach-Object { $_.userPrincipalName }) })
                continue
            }
            $u = $found[0]
            $compared++
            $diff = [ordered]@{}
            foreach ($s in $slots) {
                if (-not $r.PSObject.Properties[$s]) { continue }
                $ad = "$($r.$s)".Trim()
                $entra = "$(Get-VkExtensionAttribute $u $s)"
                if ($ad -cne $entra) { $diff[$s] = '{0} -> {1}' -f $(if ($ad) { $ad } else { '(blank)' }), $(if ($entra) { $entra } else { '(blank)' }) }
            }
            if ($diff.Count -gt 0) {
                $data = [ordered]@{ EmployeeId = $key }
                foreach ($k in $diff.Keys) { $data[$k] = $diff[$k] }
                ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue ('Slot value in Entra ID differs from AD: {0}' -f (@($diff.Keys) -join ', ')) -Data $data
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} sample row(s), {1} compared, slots {2} (AD -> Entra ID)' -f $n, $compared, ($slots -join ', '))
    }
}

$script:VkOnPremSyncUri = '/v1.0/directory/onPremisesSynchronization'

function Invoke-VkSync02 {
    <#
    VK-SYNC-02 (optional). Whether the tenant blocks soft match (blockSoftMatchEnabled) and
    cloud object takeover through hard match (blockCloudObjectTakeoverThroughHardMatchEnabled).
    Learn advises keeping both on except while a matching procedure needs them off. Each one
    that is off is a Finding, or a Warn while MatchWindowOpenUntil (an approved window's last
    day) hasn't passed. softMatchOnUpnEnabled is reported as Info: once on, it can't be turned
    off. Learn lists Global Administrator as the only role for this read, delegated only, so the
    check prefers an export (onprem-sync-export.json, the GET's response saved by that
    administrator) and reads Graph only when no export is supplied. NotApplicable when the
    tenant has no synchronization object.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-SYNC-02' $Context {
        param($Context)
        $export = Read-VkInputJson -Context $Context -Option 'OnPremSyncExportFile'
        if ($null -ne $export) {
            $items = @($export)
            if ($export.PSObject.Properties['value']) { $items = @($export.value) }
        } else {
            $items = @(Get-VkData -Context $Context -Name 'onPremisesSynchronization' -Uri $script:VkOnPremSyncUri)
        }
        $items = @($items | Where-Object { $null -ne $_ })
        if ($items.Count -eq 0) { return Get-VkNotApplicable 'The tenant has no on-premises directory synchronization object' }

        $until = "$($Context.Options['MatchWindowOpenUntil'])".Trim()
        $windowOpen = $false
        if ($until) { $windowOpen = (ConvertTo-VkUtc $until).UtcDateTime.Date -ge $Context.AsOf.UtcDateTime.Date }
        $severity = if ($windowOpen) { 'Warn' } else { 'Finding' }
        $flags = @(
            @{ Name = 'blockSoftMatchEnabled'; Issue = 'Soft match is not blocked' },
            @{ Name = 'blockCloudObjectTakeoverThroughHardMatchEnabled'; Issue = 'Cloud object takeover through hard match is not blocked' }
        )
        $rows = foreach ($o in $items) {
            $f = Get-VkValue $o 'features'
            foreach ($flag in $flags) {
                if ((Get-VkValue $f $flag.Name $false) -ne $true) {
                    $data = [ordered]@{ Feature = $flag.Name; Value = 'false' }
                    if ($until) { $data['MatchWindowOpenUntil'] = $until }
                    ConvertTo-VkFinding -Severity $severity -Object 'onPremisesSynchronization' -ObjectId "$($o.id)" -Issue $flag.Issue -Data $data
                }
            }
            if ((Get-VkValue $f 'softMatchOnUpnEnabled' $false) -eq $true) {
                ConvertTo-VkFinding -Severity Info -Object 'onPremisesSynchronization' -ObjectId "$($o.id)" -Issue 'Soft match on UPN is on; it cannot be turned off once enabled' -Data ([ordered]@{ Feature = 'softMatchOnUpnEnabled'; Value = 'true' })
            }
        }
        $msg = if ($windowOpen) { "Matching window open until $until" } else { '' }
        Get-VkOutcome -Rows @($rows) -Message $msg
    }
}

# VK-SYNC-03: export column -> how Entra ID holds the synced value. Compared case-insensitively
# for names and addresses, exactly otherwise.
$script:VkParityMap = [ordered]@{
    UserPrincipalName = 'onPremisesUserPrincipalName'
    SamAccountName    = 'onPremisesSamAccountName'
    Mail              = 'mail'
    EmployeeId        = 'employeeId'
    EmployeeType      = 'employeeType'
    Department        = 'department'
    Enabled           = 'accountEnabled'
}
$script:VkParityCaseless = @('UserPrincipalName', 'SamAccountName', 'Mail')

function Get-VkParityValue {
    # The Entra ID side of one export column, as a string ('' when unset).
    param($User, [string]$Column)
    if ($Column -like 'extensionAttribute*') { $v = Get-VkValue (Get-VkValue $User 'onPremisesExtensionAttributes') $Column }
    else { $v = Get-VkValue $User $script:VkParityMap[$Column] }
    if ($null -eq $v) { return '' }
    if ($v -is [bool]) { if ($v) { return 'True' } else { return 'False' } }
    "$v".Trim()
}

function Invoke-VkSync03 {
    <#
    VK-SYNC-03. Sync parity for the whole estate: the Start Kit's AD export (ad-user-export.csv
    from Get-FMPAttributeSurvey) against Entra ID, joined on the on-premises SID
    (onPremisesSecurityIdentifier), which doesn't depend on the key being right. Reports:
    an AD user in sync scope with no Entra user; one marked DoNotSync (DoNotSyncSlot) that is
    in Entra ID anyway; a matched user whose Entra object no longer syncs; each attribute in
    ParityAttributes and the coded slots that differs; and a synced Entra user whose AD object
    isn't in the export, when the export covers that domain (onPremisesDomainName). In scope
    means not DoNotSync and, with SyncScopeDomains set, in one of those domains: the sync
    engine's OU and group filters aren't read, so record them beside the result. Permission:
    User.Read.All. NotApplicable without the export.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-SYNC-03' $Context {
        param($Context)
        $export = Read-VkInputCsv -Context $Context -Option 'AdUserExportFile'
        if ($null -eq $export) { return Get-VkNotApplicable "No AD user export ($($Context.Options['AdUserExportFile'])) supplied; the Start Kit's Get-FMPAttributeSurvey writes it" }
        $columns = @(@($Context.Options['ParityAttributes']) + @($Context.Options['CodedSlots']) | Select-Object -Unique)
        $unknown = @($columns | Where-Object { $_ -notlike 'extensionAttribute*' -and -not $script:VkParityMap.Contains($_) })
        if ($unknown.Count) { throw "ParityAttributes names columns VK-SYNC-03 can't map: $($unknown -join ', ')" }
        $dnsSlot = "$($Context.Options['DoNotSyncSlot'])"
        $dnsValue = "$($Context.Options['DoNotSyncValue'])"
        $domains = @($Context.Options['SyncScopeDomains'] | Where-Object { $_ } | ForEach-Object { "$_".ToLowerInvariant() })

        $bySid = @{}
        foreach ($u in @(Get-VkData -Context $Context -Name 'users' -Uri $script:VkUsersUri)) {
            $sid = "$(Get-VkValue $u 'onPremisesSecurityIdentifier' '')".Trim().ToUpperInvariant()
            if ($sid) { $bySid[$sid] = $u }
        }
        $exportDomains = @{}
        $seen = @{}
        $inScope = 0; $matched = 0
        $rows = foreach ($r in $export) {
            $sid = "$(Get-VkValue $r 'SID' '')".Trim().ToUpperInvariant()
            if (-not $sid) { continue }
            $domain = "$(Get-VkValue $r 'Domain' '')".Trim().ToLowerInvariant()
            if ($domain) { $exportDomains[$domain] = $true }
            $name = "$(Get-VkValue $r 'SamAccountName' '')"
            if ($domain) { $name = "$name@$domain" }
            $u = $null
            if ($bySid.ContainsKey($sid)) { $u = $bySid[$sid]; $seen[$sid] = $true }
            $excluded = $dnsSlot -and "$(Get-VkValue $r $dnsSlot '')".Trim() -eq $dnsValue
            $outside = $domains.Count -gt 0 -and $domains -notcontains $domain
            if ($excluded -or $outside) {
                if ($u -and $excluded) {
                    ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue "Marked $dnsValue in AD ($dnsSlot), but in Entra ID" -Data ([ordered]@{ AdAccount = $name })
                }
                continue
            }
            $inScope++
            if (-not $u) {
                ConvertTo-VkFinding -Severity Finding -Object $name -Issue 'In sync scope in AD, but no Entra user carries its SID' -Data ([ordered]@{ Sid = $sid; EmployeeId = "$(Get-VkValue $r 'EmployeeId' '')" })
                continue
            }
            $matched++
            if ((Get-VkValue $u 'onPremisesSyncEnabled') -ne $true) {
                ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue 'Matched on SID, but the Entra user no longer syncs from AD (onPremisesSyncEnabled isn''t true)' -Data ([ordered]@{ AdAccount = $name })
                continue
            }
            $diff = [ordered]@{}
            foreach ($c in $columns) {
                if (-not $r.PSObject.Properties[$c]) { continue }
                $ad = "$($r.$c)".Trim()
                $entra = Get-VkParityValue $u $c
                $same = if ($script:VkParityCaseless -contains $c) { $ad -ieq $entra } else { $ad -ceq $entra }
                if (-not $same) { $diff[$c] = '{0} -> {1}' -f $(if ($ad) { $ad } else { '(blank)' }), $(if ($entra) { $entra } else { '(blank)' }) }
            }
            if ($diff.Count) {
                $data = [ordered]@{ AdAccount = $name }
                foreach ($k in $diff.Keys) { $data[$k] = $diff[$k] }
                ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue ('Entra ID differs from AD: {0}' -f (@($diff.Keys) -join ', ')) -Data $data
            }
        }
        $rows = @($rows)
        $orphans = 0; $elsewhere = 0
        foreach ($sid in $bySid.Keys) {
            if ($seen.ContainsKey($sid)) { continue }
            $u = $bySid[$sid]
            if ((Get-VkValue $u 'onPremisesSyncEnabled') -ne $true) { continue }
            $d = "$(Get-VkValue $u 'onPremisesDomainName' '')".Trim().ToLowerInvariant()
            if ($d -and -not $exportDomains.ContainsKey($d)) { $elsewhere++; continue }
            $orphans++
            $rows += ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue 'Synced from AD, but its AD object isn''t in the export' -Data ([ordered]@{ Sid = $sid; OnPremisesDomainName = $d })
        }
        if ($elsewhere) { $rows += ConvertTo-VkFinding -Severity Info -Object '(other domains)' -Issue "$elsewhere synced user(s) from domains the export doesn't cover weren't compared" }
        Get-VkOutcome -Rows $rows -Message ('{0} AD user(s) in scope, {1} matched on SID, {2} synced Entra user(s) with no AD object in the export; compared {3}' -f $inScope, $matched, $orphans, ($columns -join ', '))
    }
}
