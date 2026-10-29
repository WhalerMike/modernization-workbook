<#
.SYNOPSIS
    Intune track (end-user devices): VK-INT-01 to VK-INT-06. Read-only.
    Sources: Attribute-Driven Migration guide, "Intune track", "Which end-user devices Intune
    covers" and "Dynamic device groups"; Book 05, Chapters 03, 04, 08 and 10.
#>

# Permission: Device.Read.All (least privileged for List devices).
$script:VkDevicesUri = '/v1.0/devices?$select=id,deviceId,displayName,accountEnabled,operatingSystem,operatingSystemVersion,trustType,isManaged,approximateLastSignInDateTime,extensionAttributes&$top=999'

function Get-VkDevices {
    param($Context)
    @(Get-VkData -Context $Context -Name 'devices' -Uri $script:VkDevicesUri)
}

function Invoke-VkInt01 {
    <# VK-INT-01. Enabled managed devices with an empty tier, role or environment slot (Book 05, Chapter 08's device attribute schema). #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-INT-01' $Context {
        param($Context)
        $slots = @($Context.Options['DeviceSlots'])
        $managed = @(Get-VkDevices $Context | Where-Object { (Get-VkValue $_ 'isManaged' $false) -and (Get-VkValue $_ 'accountEnabled' $true) })
        $rows = foreach ($d in $managed) {
            $missing = @($slots | Where-Object { $null -eq (Get-VkExtensionAttribute $d $_) })
            if ($missing.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $d.displayName -ObjectId $d.id -Issue 'Managed device missing provisioning-written attributes' -Data ([ordered]@{ Missing = $missing; TrustType = (Get-VkValue $d 'trustType') })
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} managed device(s); slots {1}' -f $managed.Count, ($slots -join ', '))
    }
}

function Invoke-VkInt02 {
    <# VK-INT-02. Enabled devices with no sign-in in StaleDays, and names held by both a hybrid-joined (ServerAD) and an Entra-joined (AzureAD) object. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-INT-02' $Context {
        param($Context)
        $days = [int]$Context.Options['StaleDays']
        $devices = Get-VkDevices $Context
        $rows = [System.Collections.Generic.List[object]]::new()
        foreach ($d in $devices) {
            if (-not (Get-VkValue $d 'accountEnabled' $true)) { continue }
            $seen = ConvertTo-VkUtc (Get-VkValue $d 'approximateLastSignInDateTime')
            if ($null -eq $seen -or (Get-VkDays $seen $Context.AsOf) -gt $days) {
                $idle = if ($seen) { Get-VkDays $seen $Context.AsOf } else { 'never' }
                $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $d.displayName -ObjectId $d.id -Issue "Stale: no sign-in in more than $days days" -Data ([ordered]@{ LastSignIn = (Format-VkUtc $seen); DaysIdle = $idle; TrustType = (Get-VkValue $d 'trustType') })))
            }
        }
        $byName = $devices | Where-Object { -not (Test-VkBlank $_.displayName) } | Group-Object { "$($_.displayName)".ToUpperInvariant() }
        foreach ($g in $byName) {
            $types = @($g.Group | ForEach-Object { Get-VkValue $_ 'trustType' })
            if ($types -contains 'ServerAD' -and $types -contains 'AzureAD') {
                $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $g.Group[0].displayName -ObjectId (@($g.Group | ForEach-Object { $_.id }) -join ',') -Issue 'Hybrid-joined and Entra-joined objects for the same device name' -Data ([ordered]@{ TrustTypes = $types })))
            }
        }
        Get-VkOutcome -Rows $rows.ToArray() -Message ('Stale threshold {0} days; Microsoft recommends a timeframe of at least 21 days' -f $days)
    }
}

function Invoke-VkInt03 {
    <# VK-INT-03. Autopilot devices with an empty group tag, or one not in autopilot-group-tags.csv (GroupTag column). #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-INT-03' $Context {
        param($Context)
        # Permission: DeviceManagementServiceConfig.Read.All.
        $ap = @(Get-VkData -Context $Context -Name 'autopilotDevices' -Uri '/v1.0/deviceManagement/windowsAutopilotDeviceIdentities')
        if ($ap.Count -eq 0) { return Get-VkNotApplicable 'No Windows Autopilot devices registered' }
        $tagRows = Read-VkInputCsv -Context $Context -Option 'AutopilotTagsFile'
        $known = @($tagRows | ForEach-Object { "$($_.GroupTag)".Trim() } | Where-Object { $_ })
        $rows = foreach ($d in $ap) {
            $tag = "$(Get-VkValue $d 'groupTag' '')".Trim()
            $data = [ordered]@{ Serial = (Get-VkValue $d 'serialNumber'); GroupTag = $tag }
            if ($tag -eq '') {
                ConvertTo-VkFinding -Severity Finding -Object (Get-VkValue $d 'serialNumber' $d.id) -ObjectId $d.id -Issue 'No group tag' -Data $data
            } elseif ($null -ne $tagRows -and $known -notcontains $tag) {
                ConvertTo-VkFinding -Severity Finding -Object (Get-VkValue $d 'serialNumber' $d.id) -ObjectId $d.id -Issue 'Group tag not in the controlled vocabulary' -Data $data
            }
        }
        $msg = '{0} Autopilot device(s)' -f $ap.Count
        if ($null -eq $tagRows) { $msg += '; no autopilot-group-tags.csv, so only empty tags were checked' }
        Get-VkOutcome -Rows @($rows) -Message $msg
    }
}

function Get-VkIntunePolicies {
    # Device configuration and compliance policies with their assignments (v1.0), plus settings
    # catalog policies (beta) when -IncludeBeta. Permission: DeviceManagementConfiguration.Read.All.
    param($Context)
    $out = [System.Collections.Generic.List[object]]::new()
    foreach ($set in @(
            @{ Name = 'deviceConfigurations'; Uri = '/v1.0/deviceManagement/deviceConfigurations?$expand=assignments'; Kind = 'Configuration' },
            @{ Name = 'deviceCompliancePolicies'; Uri = '/v1.0/deviceManagement/deviceCompliancePolicies?$expand=assignments'; Kind = 'Compliance' })) {
        foreach ($p in @(Get-VkData -Context $Context -Name $set.Name -Uri $set.Uri)) {
            $out.Add([pscustomobject]@{ Kind = $set.Kind; Type = "$(Get-VkValue $p '@odata.type' $set.Kind)"; Policy = $p })
        }
    }
    if ($Context.IncludeBeta) {
        foreach ($p in @(Get-VkData -Context $Context -Name 'configurationPolicies' -Uri '/beta/deviceManagement/configurationPolicies?$expand=assignments' -Optional)) {
            if ($null -eq $p) { continue }
            $out.Add([pscustomobject]@{ Kind = 'SettingsCatalog'; Type = "settingsCatalog:$(Get-VkValue $p 'platforms'):$(Get-VkValue $p 'technologies')"; Policy = $p })
        }
    }
    $out.ToArray()
}

function Get-VkPolicyName { param($Policy) "$(Get-VkValue $Policy 'displayName' (Get-VkValue $Policy 'name' $Policy.id))" }

function Invoke-VkInt04 {
    <#
    VK-INT-04. Exclusions that target a dynamic device group are findings (a dynamic exclusion
    computed late lets the policy reach the device first; Book 05, Chapter 08). Inclusions of
    dynamic device groups are listed with whether a filter narrows them.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-INT-04' $Context {
        param($Context)
        $dyn = @{}
        foreach ($g in Get-VkDynamicGroups $Context) { if (Test-VkDeviceRule "$($g.membershipRule)") { $dyn["$($g.id)"] = $g } }
        $rows = [System.Collections.Generic.List[object]]::new()
        $policies = @(Get-VkIntunePolicies $Context)
        foreach ($entry in $policies) {
            $p = $entry.Policy
            foreach ($a in @(Get-VkValue $p 'assignments' @())) {
                $t = Get-VkValue $a 'target'
                $type = "$(Get-VkValue $t '@odata.type')"
                $gid = "$(Get-VkValue $t 'groupId')"
                if (-not $dyn.ContainsKey($gid)) { continue }
                $gName = $dyn[$gid].displayName
                if ($type -like '*exclusionGroupAssignmentTarget') {
                    $rows.Add((ConvertTo-VkFinding -Severity Finding -Object (Get-VkPolicyName $p) -ObjectId $p.id -Issue 'Exclusion uses a dynamic device group' -Data ([ordered]@{ Kind = $entry.Kind; Group = $gName })))
                } else {
                    $filter = Get-VkValue $t 'deviceAndAppManagementAssignmentFilterId'
                    $rows.Add((ConvertTo-VkFinding -Severity Info -Object (Get-VkPolicyName $p) -ObjectId $p.id -Issue 'Included through a dynamic device group' -Data ([ordered]@{ Kind = $entry.Kind; Group = $gName; Filter = $(if (Test-VkBlank $filter) { 'none' } else { "$(Get-VkValue $t 'deviceAndAppManagementAssignmentFilterType') $filter" }) })))
                }
            }
        }
        Get-VkOutcome -Rows $rows.ToArray() -Message ('{0} policies read; {1} dynamic device group(s)' -f $policies.Count, $dyn.Count)
    }
}

function Invoke-VkInt05 {
    <#
    VK-INT-05. Conflict candidates: a device that two or more policies of the same type reach,
    through included groups (exclusions removed) or All devices. Same type is the policy's
    @odata.type (configuration and compliance) or platform and technology (settings catalog);
    the kit doesn't compare individual settings, so each row is a candidate to confirm in the
    Intune per-setting status report.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-INT-05' $Context {
        param($Context)
        $allDevices = @(Get-VkDevices $Context | Where-Object { Get-VkValue $_ 'isManaged' $false } | ForEach-Object { "$($_.id)" })
        $reach = @{}
        foreach ($entry in @(Get-VkIntunePolicies $Context)) {
            $p = $entry.Policy
            $in = [System.Collections.Generic.HashSet[string]]::new()
            $out = [System.Collections.Generic.HashSet[string]]::new()
            foreach ($a in @(Get-VkValue $p 'assignments' @())) {
                $t = Get-VkValue $a 'target'
                $type = "$(Get-VkValue $t '@odata.type')"
                if ($type -like '*allDevicesAssignmentTarget') { foreach ($d in $allDevices) { [void]$in.Add($d) }; continue }
                $gid = "$(Get-VkValue $t 'groupId')"
                if (Test-VkBlank $gid) { continue }
                $members = @(Get-VkGroupMemberIds $Context $gid)
                if ($type -like '*exclusionGroupAssignmentTarget') { foreach ($m in $members) { [void]$out.Add($m) } }
                elseif ($type -like '*groupAssignmentTarget') { foreach ($m in $members) { [void]$in.Add($m) } }
            }
            foreach ($d in $in) {
                if ($out.Contains($d)) { continue }
                $k = "$d|$($entry.Type)"
                if (-not $reach.ContainsKey($k)) { $reach[$k] = [System.Collections.Generic.List[string]]::new() }
                $reach[$k].Add((Get-VkPolicyName $p))
            }
        }
        $names = @{}
        foreach ($d in Get-VkDevices $Context) { $names["$($d.id)"] = $d.displayName }
        $rows = foreach ($k in ($reach.Keys | Sort-Object)) {
            $list = @($reach[$k] | Sort-Object -Unique)
            if ($list.Count -lt 2) { continue }
            $dev, $ptype = $k.Split('|', 2)
            ConvertTo-VkFinding -Severity Warn -Object (Get-VkValue $names $dev $dev) -ObjectId $dev -Issue 'Reached by more than one policy of the same type (conflict candidate)' -Data ([ordered]@{ PolicyType = $ptype; Policies = $list })
        }
        Get-VkOutcome -Rows @($rows)
    }
}

function Get-VkCoverage {
    # The matrix row that applies: the highest MinVersion at or below the device's version for its OS.
    param($Matrix, [string]$Os, [string]$Version)
    $v = ConvertTo-VkVersion $Version
    $rows = @($Matrix | Where-Object { "$($_.OperatingSystem)" -ieq $Os })
    if ($rows.Count -eq 0) { return $null }
    $best = $null
    foreach ($r in $rows) {
        $min = ConvertTo-VkVersion "$($r.MinVersion)"
        if ($null -eq $min -or $null -eq $v) { continue }
        if ($v -ge $min -and ($null -eq $best -or $min -gt (ConvertTo-VkVersion "$($best.MinVersion)"))) { $best = $r }
    }
    if ($best) { return $best }
    [pscustomobject]@{ OperatingSystem = $Os; MinVersion = ''; Coverage = 'NotSupported'; Note = 'Below every version in the coverage matrix' }
}

function Invoke-VkInt06 {
    <#
    VK-INT-06. Managed devices by OS, version and ownership against platform-matrix.csv
    (OperatingSystem, MinVersion, Coverage Managed|Limited|NotSupported, Note). The kit ships a
    default matrix in config/ taken from the guide's coverage table; replace it with the agency's.
    NotSupported is a finding; Limited and an OS missing from the matrix are warnings.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-INT-06' $Context {
        param($Context)
        # Permission: DeviceManagementManagedDevices.Read.All.
        $md = @(Get-VkData -Context $Context -Name 'managedDevices' -Uri '/v1.0/deviceManagement/managedDevices?$select=id,deviceName,operatingSystem,osVersion,managedDeviceOwnerType,azureADDeviceId,lastSyncDateTime')
        $matrix = Read-VkInputCsv -Context $Context -Option 'PlatformMatrixFile'
        if ($null -eq $matrix) { throw 'No platform matrix (platform-matrix.csv) found in -InputPath or config/' }
        $rows = [System.Collections.Generic.List[object]]::new()
        foreach ($d in $md) {
            $os = "$(Get-VkValue $d 'operatingSystem' '')"; $ver = "$(Get-VkValue $d 'osVersion' '')"
            $cov = Get-VkCoverage -Matrix $matrix -Os $os -Version $ver
            $data = [ordered]@{ OS = $os; Version = $ver; Ownership = (Get-VkValue $d 'managedDeviceOwnerType') }
            if ($null -eq $cov) {
                $rows.Add((ConvertTo-VkFinding -Severity Warn -Object $d.deviceName -ObjectId $d.id -Issue 'Operating system not in the coverage matrix' -Data $data))
            } elseif ($cov.Coverage -eq 'NotSupported') {
                $data['Note'] = $cov.Note
                $rows.Add((ConvertTo-VkFinding -Severity Finding -Object $d.deviceName -ObjectId $d.id -Issue 'Out-of-support platform' -Data $data))
            } elseif ($cov.Coverage -eq 'Limited') {
                $data['Note'] = $cov.Note
                $rows.Add((ConvertTo-VkFinding -Severity Warn -Object $d.deviceName -ObjectId $d.id -Issue 'Limited coverage' -Data $data))
            }
        }
        foreach ($g in ($md | Group-Object { '{0}|{1}|{2}' -f (Get-VkValue $_ 'operatingSystem'), (ConvertTo-VkVersion "$(Get-VkValue $_ 'osVersion')"), (Get-VkValue $_ 'managedDeviceOwnerType') } | Sort-Object Name)) {
            $os, $ver, $own = $g.Name.Split('|')
            $rows.Add((ConvertTo-VkFinding -Severity Info -Object 'Inventory' -Issue 'Devices by OS, version and ownership' -Data ([ordered]@{ OS = $os; Version = $ver; Ownership = $own; Devices = $g.Count })))
        }
        Get-VkOutcome -Rows $rows.ToArray() -Message ('{0} managed device(s)' -f $md.Count)
    }
}
