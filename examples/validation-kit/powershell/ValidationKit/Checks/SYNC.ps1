<#
.SYNOPSIS
    Sync: VK-SYNC-01 and VK-SYNC-02 (optional). Read-only.
    Sources: Attribute-Driven Migration implementation guide, Gate 3; Book 02, Chapter 10
    (Phase 1 attribute spot check); Book 03, Chapter 12 (Phase 3 shadow mode); Developer
    Workbook, Chapter 03 (VK-SYNC-02 is its worked example).
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
