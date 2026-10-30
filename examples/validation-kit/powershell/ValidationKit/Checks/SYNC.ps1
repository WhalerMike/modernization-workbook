<#
.SYNOPSIS
    Sync: VK-SYNC-01. Read-only.
    Sources: Attribute-Driven Migration implementation guide, Gate 3; Book 02, Chapter 10
    (Phase 1 attribute spot check); Book 03, Chapter 12 (Phase 3 shadow mode).
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
