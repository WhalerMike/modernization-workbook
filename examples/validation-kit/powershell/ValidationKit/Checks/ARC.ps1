<#
.SYNOPSIS
    Azure Arc track (servers): VK-ARC-01 to VK-ARC-05. Read-only: Azure Resource Graph KQL only.
    Sources: Attribute-Driven Migration guide, "Azure Arc track" and "What neither tool reaches";
    Book 05, Chapter 09; Book 06, Runbook R04. Role: Reader on the scope (Resource Graph returns
    only the resources the caller can read).
#>

$script:VkArgMachines = @'
resources
| where type =~ 'microsoft.hybridcompute/machines'
| project id = tolower(id), name, resourceGroup, subscriptionId, location, tags,
    status = tostring(properties.status), agentVersion = tostring(properties.agentVersion),
    osType = tostring(properties.osType), osName = tostring(properties.osName),
    computerName = tostring(properties.osProfile.computerName), lastStatusChange = tostring(properties.lastStatusChange)
'@

$script:VkArgPolicyStates = @'
policyresources
| where type =~ 'microsoft.policyinsights/policystates'
| where tolower(tostring(properties.resourceType)) == 'microsoft.hybridcompute/machines'
| project resourceId = tolower(tostring(properties.resourceId)), complianceState = tostring(properties.complianceState),
    policyAssignmentName = tostring(properties.policyAssignmentName), policyDefinitionName = tostring(properties.policyDefinitionName)
'@

$script:VkArgMaintenance = @'
maintenanceresources
| where type =~ 'microsoft.maintenance/configurationassignments'
| project id = tolower(id), resourceId = tolower(tostring(properties.resourceId)),
    maintenanceConfigurationId = tostring(properties.maintenanceConfigurationId), filter = properties.filter
'@

$script:VkArgPatch = @'
patchassessmentresources
| where type =~ 'microsoft.hybridcompute/machines/patchassessmentresults'
| project machineId = tolower(substring(id, 0, indexof(tolower(id), '/patchassessmentresults'))),
    lastModifiedDateTime = tostring(properties.lastModifiedDateTime), status = tostring(properties.status)
'@

function Get-VkArcMachines {
    param($Context)
    @(Get-VkData -Context $Context -Name 'arcMachines' -Source ResourceGraph -Uri $script:VkArgMachines)
}

function Get-VkTag {
    param($Machine, [string]$Name)
    $tags = Get-VkValue $Machine 'tags'
    if ($null -eq $tags) { return $null }
    foreach ($p in $tags.PSObject.Properties) { if ($p.Name -ieq $Name) { return "$($p.Value)" } }
    if ($tags -is [System.Collections.IDictionary]) { foreach ($k in $tags.Keys) { if ("$k" -ieq $Name) { return "$($tags[$k])" } } }
    $null
}

function Invoke-VkArc01 {
    <#
    .SYNOPSIS
        Implements VK-ARC-01: lists Arc-enabled servers missing a tag the tag taxonomy requires
        (tag-taxonomy.json), or carrying a value it doesn't allow.
    .EXAMPLE
        # From the kit folder: against the fictional "fail" fixture tenant (no sign-in).
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkArc01 -Context $ctx
    .DESCRIPTION
    #>
    <# VK-ARC-01. Tags required by tag-taxonomy.json (required, and allowed values per tag) missing or invalid on each Arc server. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-ARC-01' $Context {
        param($Context)
        $machines = Get-VkArcMachines $Context
        if ($machines.Count -eq 0) { return Get-VkNotApplicable 'No Arc-enabled servers in scope' }
        $tax = Read-VkInputJson -Context $Context -Option 'TagTaxonomyFile'
        if ($null -eq $tax) { throw 'No tag taxonomy (tag-taxonomy.json) found in -InputPath or config/' }
        $required = @($tax.required)
        $allowed = Get-VkValue $tax 'allowed'
        $rows = foreach ($m in $machines) {
            $missing = @($required | Where-Object { Test-VkBlank (Get-VkTag $m $_) })
            $invalid = @()
            if ($allowed) {
                foreach ($p in $allowed.PSObject.Properties) {
                    $v = Get-VkTag $m $p.Name
                    if (-not (Test-VkBlank $v) -and @($p.Value) -notcontains $v) { $invalid += "$($p.Name)=$v" }
                }
            }
            if ($missing.Count + $invalid.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $m.name -ObjectId $m.id -Issue 'Tag taxonomy not met' -Data ([ordered]@{ Missing = $missing; Invalid = $invalid; ResourceGroup = $m.resourceGroup })
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} server(s); required tags {1}' -f $machines.Count, ($required -join ', '))
    }
}

function Invoke-VkArc02 {
    <#
    .SYNOPSIS
        Implements VK-ARC-02: lists Arc machines that are Disconnected or Expired, or run an agent
        older than MinSupportedAgentVersion.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z' -Option @{ MinSupportedAgentVersion = '1.58' }
        Invoke-VkArc02 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-ARC-02. Machines Disconnected or Expired, and agents older than MinSupportedAgentVersion.
    Microsoft supports only agent versions released within the last year (release notes); the
    default 1.58 is the program's reading of that window on October 29, 2026 (1.69 was released
    in October 2026, one version a month). Set it from the release notes when you run.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-ARC-02' $Context {
        param($Context)
        $machines = Get-VkArcMachines $Context
        if ($machines.Count -eq 0) { return Get-VkNotApplicable 'No Arc-enabled servers in scope' }
        $min = ConvertTo-VkVersion "$($Context.Options['MinSupportedAgentVersion'])"
        $rows = foreach ($m in $machines) {
            $issues = @()
            if (@('Disconnected', 'Expired') -contains "$($m.status)") { $issues += "Status $($m.status)" }
            $v = ConvertTo-VkVersion "$($m.agentVersion)"
            if ($null -eq $v) { $issues += 'Agent version unknown' }
            elseif ($min -and $v -lt $min) { $issues += "Agent $($m.agentVersion) older than $min" }
            if ($issues.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $m.name -ObjectId $m.id -Issue ($issues -join '; ') -Data ([ordered]@{ Status = $m.status; Agent = $m.agentVersion; LastStatusChange = $m.lastStatusChange })
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('Minimum supported agent {0}' -f $min)
    }
}

function Invoke-VkArc03 {
    <#
    .SYNOPSIS
        Implements VK-ARC-03: per Arc server, the Azure Policy states of the baseline assignment
        (BaselineAssignmentName). A server that is NonCompliant, or has no state, fails it;
        NotApplicable until the assignment is named.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z' -Option @{ BaselineAssignmentName = 'server-baseline' }
        Invoke-VkArc03 -Context $ctx
    .DESCRIPTION
    #>
    <# VK-ARC-03. Per server, the policy states of the baseline assignment (BaselineAssignmentName): NonCompliant, or no state at all. #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-ARC-03' $Context {
        param($Context)
        $name = "$($Context.Options['BaselineAssignmentName'])"
        if (Test-VkBlank $name) { return Get-VkNotApplicable 'Set -Option @{ BaselineAssignmentName = ''<assignment name>'' } to name the baseline assignment' }
        $machines = Get-VkArcMachines $Context
        if ($machines.Count -eq 0) { return Get-VkNotApplicable 'No Arc-enabled servers in scope' }
        $states = @(Get-VkData -Context $Context -Name 'policyStates' -Source ResourceGraph -Uri $script:VkArgPolicyStates | Where-Object { "$($_.policyAssignmentName)" -ieq $name })
        $rows = foreach ($m in $machines) {
            $mine = @($states | Where-Object { "$($_.resourceId)" -ieq "$($m.id)" })
            if ($mine.Count -eq 0) {
                ConvertTo-VkFinding -Severity Finding -Object $m.name -ObjectId $m.id -Issue 'No policy state for the baseline assignment: not assigned or not yet evaluated' -Data ([ordered]@{ Assignment = $name })
                continue
            }
            $bad = @($mine | Where-Object { $_.complianceState -eq 'NonCompliant' })
            if ($bad.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $m.name -ObjectId $m.id -Issue 'Non-compliant with the baseline' -Data ([ordered]@{ Assignment = $name; NonCompliantDefinitions = @($bad | ForEach-Object { $_.policyDefinitionName }) })
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ("Baseline assignment '{0}'" -f $name)
    }
}

function Invoke-VkArc04 {
    <#
    .SYNOPSIS
        Implements VK-ARC-04: lists servers in the CMDB export (cmdb.csv) that are neither
        Arc-enabled nor assigned to tier 2, 3 or 4: the CM-8 inventory gap.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkArc04 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-ARC-04. Every server in the CMDB export (cmdb.csv: Name, Tier, Owner) is either Arc-enabled
    or assigned to tier 2, 3 or 4 of the guide's strategy for what neither tool reaches. One that
    is neither is a CM-8 gap (the program's mapping).
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-ARC-04' $Context {
        param($Context)
        $cmdb = Read-VkInputCsv -Context $Context -Option 'CmdbFile'
        if ($null -eq $cmdb) { return Get-VkNotApplicable 'No CMDB export (cmdb.csv with Name and Tier columns) was supplied' }
        $names = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
        foreach ($m in Get-VkArcMachines $Context) {
            foreach ($n in @($m.name, $m.computerName)) { if (-not (Test-VkBlank $n)) { [void]$names.Add("$n".Split('.')[0]) } }
        }
        $rows = foreach ($s in $cmdb) {
            $short = "$($s.Name)".Trim().Split('.')[0]
            if ($short -eq '') { continue }
            $tier = "$(Get-VkValue $s 'Tier' '')".Trim()
            if ($names.Contains($short)) { continue }
            if (@('2', '3', '4') -contains $tier) { continue }
            ConvertTo-VkFinding -Severity Finding -Object $s.Name -Issue 'In the CMDB, not Arc-enabled, and not assigned to tier 2-4' -Data ([ordered]@{ Tier = $(if ($tier) { $tier } else { 'none' }); Owner = (Get-VkValue $s 'Owner' '') })
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} CMDB server(s) against {1} Arc server name(s)' -f $cmdb.Count, $names.Count)
    }
}

function Test-VkDynamicScope {
    # Whether a maintenance configuration assignment's dynamic-scope filter matches a machine:
    # resource groups, OS types, locations and tags (Any or All). The filter's shape follows
    # Update Manager's dynamic scoping and wasn't checked against a live tenant.
    param($Filter, $Machine, [string]$AssignmentId)
    if ($null -eq $Filter) { return $false }
    $sub = ([regex]::Match($AssignmentId, '^/subscriptions/([^/]+)', 'IgnoreCase')).Groups[1].Value
    if ($sub -and "$($Machine.subscriptionId)" -ine $sub) { return $false }
    $rgs = @(Get-VkValue $Filter 'resourceGroups' @())
    if ($rgs.Count -gt 0 -and -not (@($rgs | Where-Object { "$_" -ieq "$($Machine.resourceGroup)" }).Count)) { return $false }
    $os = @(Get-VkValue $Filter 'osTypes' @())
    if ($os.Count -gt 0 -and -not (@($os | Where-Object { "$_" -ieq "$($Machine.osType)" }).Count)) { return $false }
    $locs = @(Get-VkValue $Filter 'locations' @())
    if ($locs.Count -gt 0 -and -not (@($locs | Where-Object { "$_" -ieq "$($Machine.location)" }).Count)) { return $false }
    $ts = Get-VkValue $Filter 'tagSettings'
    $tags = Get-VkValue $ts 'tags'
    if ($tags) {
        $hits = 0; $total = 0
        foreach ($p in $tags.PSObject.Properties) {
            $total++
            $v = Get-VkTag $Machine $p.Name
            if ($null -ne $v -and @($p.Value) -contains $v) { $hits++ }
        }
        if ("$(Get-VkValue $ts 'filterOperator' 'Any')" -ieq 'All') { if ($hits -lt $total) { return $false } }
        elseif ($total -gt 0 -and $hits -eq 0) { return $false }
    }
    $true
}

function Invoke-VkArc05 {
    <#
    .SYNOPSIS
        Implements VK-ARC-05: lists Arc servers that no Update Manager schedule covers, or that
        have no patch assessment in the last PatchAssessmentDays days.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkArc05 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-ARC-05. Each Arc server is in an Update Manager schedule, by a resource-level
    configuration assignment or a dynamic scope, and has a patch assessment from the last
    PatchAssessmentDays days. Resource Graph keeps assessment results for 7 days, so a longer
    window can't be measured there.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-ARC-05' $Context {
        param($Context)
        $machines = Get-VkArcMachines $Context
        if ($machines.Count -eq 0) { return Get-VkNotApplicable 'No Arc-enabled servers in scope' }
        $assign = @(Get-VkData -Context $Context -Name 'maintenanceAssignments' -Source ResourceGraph -Uri $script:VkArgMaintenance)
        $assess = @(Get-VkData -Context $Context -Name 'patchAssessments' -Source ResourceGraph -Uri $script:VkArgPatch)
        $days = [int]$Context.Options['PatchAssessmentDays']
        $rows = foreach ($m in $machines) {
            $id = "$($m.id)"
            $static = @($assign | Where-Object { "$($_.resourceId)" -ieq $id -or "$($_.id)".StartsWith($id + '/', [System.StringComparison]::OrdinalIgnoreCase) })
            $dynamic = @($assign | Where-Object { Test-VkBlank $_.resourceId } | Where-Object { Test-VkDynamicScope -Filter (Get-VkValue $_ 'filter') -Machine $m -AssignmentId "$($_.id)" })
            $issues = @()
            if ($static.Count + $dynamic.Count -eq 0) { $issues += 'Not in any Update Manager schedule (no assignment or dynamic scope)' }
            $last = @($assess | Where-Object { "$($_.machineId)" -ieq $id } | ForEach-Object { ConvertTo-VkUtc $_.lastModifiedDateTime } | Sort-Object -Descending | Select-Object -First 1)
            if ($last.Count -eq 0) { $issues += "No patch assessment in the last $days days" }
            elseif ((Get-VkDays $last[0] $Context.AsOf) -gt $days) { $issues += "Last patch assessment $(Get-VkDays $last[0] $Context.AsOf) days ago" }
            if ($issues.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $m.name -ObjectId $id -Issue ($issues -join '; ') -Data ([ordered]@{ PatchGroup = (Get-VkTag $m 'PatchGroup'); LastAssessment = $(if ($last.Count) { Format-VkUtc $last[0] } else { 'none' }) })
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} server(s); assessment window {1} days' -f $machines.Count, $days)
    }
}

# Built-in Azure role IDs (Microsoft Learn, "Azure built-in roles", checked October 29, 2026).
$script:VkRoleOwner = '8e3af657-a8ff-443c-a75c-2fe8c4bcb635'
$script:VkRoleContributor = 'b24988ac-6180-42a0-ab88-20f7382dd24c'
$script:VkRoleOnboarding = 'b64e21ea-ac4e-4cdf-9dc9-5b892992bee7'
$script:VkAdminLoginRoles = @{
    '1c0163c0-47e6-4577-8991-ea5c82e286e4' = 'Virtual Machine Administrator Login'
    'fb879df8-f326-4884-b1cf-06f3ad86be52' = 'Virtual Machine User Login'
    '602da2ba-a5c2-41da-b01d-5360126ab525' = 'Virtual Machine Local User Login'
    'a6333a3e-0164-44c3-b281-7a577aff287f' = 'Windows Admin Center Administrator Login'
    'cd570a14-e51a-42ad-bac8-bafd67325302' = 'Azure Connected Machine Resource Administrator'
}
$script:VkArgRoleAssignments = "authorizationresources | where type =~ 'microsoft.authorization/roleassignments' | project id, principalId = tostring(properties.principalId), principalType = tostring(properties.principalType), roleDefinitionId = tostring(properties.roleDefinitionId), scope = tostring(properties.scope)"

function Get-VkRoleGuid { param([string]$RoleDefinitionId) ("$RoleDefinitionId" -split '/')[-1].ToLowerInvariant() }

function Test-VkScopeCovers {
    # True when $Outer is $Inner or one of its ancestors in the ARM scope path.
    param([string]$Outer, [string]$Inner)
    $o = "$Outer".TrimEnd('/').ToLowerInvariant(); $i = "$Inner".TrimEnd('/').ToLowerInvariant()
    ($i -eq $o) -or $i.StartsWith($o + '/')
}

function Invoke-VkArc06 {
    <#
    .SYNOPSIS
        Implements VK-ARC-06: reviews role assignments on Arc scopes. Fails on Owner or Contributor
        outside break-glass.csv, active admin or login roles with no PIM eligibility, onboarding
        grants with no open wave, and users assigned where groups are expected.
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkArc06 -Context $ctx | Select-Object -ExpandProperty Details
    .DESCRIPTION
    #>
    <#
    VK-ARC-06. Role assignments on Arc scopes (each machine, its resource group, its subscription),
    from Resource Graph, with PIM eligibility from Get-AzRoleEligibilitySchedule per subscription.
    Findings: Owner or Contributor held by anyone not in break-glass.csv (PrincipalId, Name);
    admin or login roles assigned active with no PIM eligibility behind them; Azure Connected
    Machine Onboarding on any scope not covered by an Open wave in onboarding-waves.csv
    (Scope, Wave, Status); and individual users as assignees, where groups are expected.
    Management-group assignments aren't evaluated: Resource Graph's role assignment rows don't
    say which subscriptions a management group holds.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-ARC-06' $Context {
        param($Context)
        $machines = Get-VkArcMachines $Context
        if ($machines.Count -eq 0) { return Get-VkNotApplicable 'No Arc-enabled servers in scope' }
        $scopes = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
        $subs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
        foreach ($m in $machines) {
            [void]$scopes.Add("$($m.id)")
            [void]$scopes.Add("/subscriptions/$($m.subscriptionId)/resourcegroups/$($m.resourceGroup)")
            [void]$scopes.Add("/subscriptions/$($m.subscriptionId)")
            [void]$subs.Add("$($m.subscriptionId)")
        }
        $ras = @(Get-VkData -Context $Context -Name 'arcRoleAssignments' -Source ResourceGraph -Uri $script:VkArgRoleAssignments)
        $subList = @($subs)
        $elig = @(Get-VkData -Context $Context -Name 'arcRoleEligibility' -Source ResourceManager -Uri ('Get-AzRoleEligibilitySchedule -Scope /subscriptions/' + ($subList -join ',')) -Reader {
                foreach ($s in $subList) {
                    foreach ($e in @(Get-AzRoleEligibilitySchedule -Scope "/subscriptions/$s")) {
                        [pscustomobject]@{ principalId = "$($e.PrincipalId)"; roleDefinitionId = "$($e.RoleDefinitionId)"; scope = "$($e.Scope)" }
                    }
                }
            })
        $breakGlass = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
        foreach ($b in (Read-VkInputCsv -Context $Context -Option 'BreakGlassFile')) { if (-not (Test-VkBlank $b.PrincipalId)) { [void]$breakGlass.Add("$($b.PrincipalId)".Trim()) } }
        $openWaves = @((Read-VkInputCsv -Context $Context -Option 'OnboardingWavesFile') | Where-Object { $_ -and "$($_.Status)" -ieq 'Open' })
        $rows = foreach ($ra in $ras) {
            $role = Get-VkRoleGuid $ra.roleDefinitionId
            $scope = "$($ra.scope)".TrimEnd('/')
            $onArc = $scopes.Contains($scope)
            $issues = @()
            $isBreakGlass = $breakGlass.Contains("$($ra.principalId)")
            if ($role -eq $script:VkRoleOnboarding) {
                if (@($openWaves | Where-Object { Test-VkScopeCovers -Outer $_.Scope -Inner $scope }).Count -eq 0) { $issues += 'Azure Connected Machine Onboarding left on a scope with no open wave' }
            }
            if ($onArc) {
                if (@($script:VkRoleOwner, $script:VkRoleContributor) -contains $role -and -not $isBreakGlass) {
                    $name = 'Contributor'
                    if ($role -eq $script:VkRoleOwner) { $name = 'Owner' }
                    $issues += "$name held outside the break-glass accounts"
                }
                if ($script:VkAdminLoginRoles.ContainsKey($role)) {
                    $eligible = @($elig | Where-Object { "$($_.principalId)" -ieq "$($ra.principalId)" -and (Get-VkRoleGuid $_.roleDefinitionId) -eq $role -and (Test-VkScopeCovers -Outer $_.scope -Inner $scope) })
                    if ($eligible.Count -eq 0) { $issues += "$($script:VkAdminLoginRoles[$role]) assigned active, not PIM-eligible" }
                }
                if ("$($ra.principalType)" -eq 'User' -and -not $isBreakGlass) { $issues += 'Individual user as assignee; assign a group' }
            }
            if ($issues.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $scope -ObjectId $ra.principalId -Issue ($issues -join '; ') -Data ([ordered]@{ Role = $role; PrincipalType = $ra.principalType })
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} role assignment(s) read; {1} Arc scope(s); {2} PIM eligibility record(s); {3} open wave(s)' -f $ras.Count, $scopes.Count, $elig.Count, $openWaves.Count)
    }
}

$script:VkArgGuestAssignments = "guestconfigurationresources | where type =~ 'microsoft.guestconfiguration/guestconfigurationassignments' | project id = tolower(id), name, machineId = tolower(tostring(properties.targetResourceId)), assignmentType = tostring(properties.guestConfiguration.assignmentType), complianceStatus = tostring(properties.complianceStatus)"

function Invoke-VkArc07 {
    <#
    .SYNOPSIS
        Implements VK-ARC-07: lists servers whose configuration owner isn't machine configuration
        but which carry an enforcing machine configuration assignment (two tools on one setting).
    .EXAMPLE
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkArc07 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-ARC-07. Two tools on one setting: a server whose configuration owner (cmdb.csv config_owner,
    else its ConfigOwner tag) isn't machine configuration, but which carries a machine
    configuration assignment that changes the machine (ApplyAndMonitor, ApplyAndAutoCorrect or
    DeployAndAutoCorrect; Audit only reports). Learn says assignmentType is case sensitive and
    spells it both ApplyAndMonitor and ApplyandMonitor, so the kit compares without case.
    A server with no recorded owner and an enforcing assignment is a warning.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-ARC-07' $Context {
        param($Context)
        $machines = Get-VkArcMachines $Context
        if ($machines.Count -eq 0) { return Get-VkNotApplicable 'No Arc-enabled servers in scope' }
        # Owner spellings vary by source (the Arc guide's ArcMachineConfiguration tag, the Ansible example's
        # arc_machine_configuration, "machine configuration"), so compare letters and digits only, without an
        # "azure" or "arc" prefix.
        $mcValues = @($Context.Options['MachineConfigurationOwnerValues'] | ForEach-Object { ("$_".ToLowerInvariant() -replace '[^a-z0-9]', '') -replace '^(azure|arc)+', '' })
        $owners = @{}
        foreach ($s in (Read-VkInputCsv -Context $Context -Option 'CmdbFile')) {
            $o = Get-VkValue $s 'config_owner'
            if (Test-VkBlank $o) { $o = Get-VkValue $s 'ConfigOwner' }
            if (-not (Test-VkBlank $o)) { $owners["$($s.Name)".Trim().Split('.')[0].ToLowerInvariant()] = "$o".Trim() }
        }
        $ga = @(Get-VkData -Context $Context -Name 'guestConfigurationAssignments' -Source ResourceGraph -Uri $script:VkArgGuestAssignments)
        $enforcing = @('applyandmonitor', 'applyandautocorrect', 'deployandautocorrect')
        $rows = foreach ($m in $machines) {
            $mine = @($ga | Where-Object {
                    $target = "$($_.machineId)"
                    if (Test-VkBlank $target) { $target = ("$($_.id)" -split '/providers/microsoft.guestconfiguration/', 2)[0] }
                    ($target -ieq "$($m.id)") -and ($enforcing -contains "$($_.assignmentType)".ToLowerInvariant())
                })
            if ($mine.Count -eq 0) { continue }
            $owner = $owners["$($m.name)".ToLowerInvariant()]
            $from = 'CMDB'
            if (-not $owner) { $owner = Get-VkTag $m 'ConfigOwner'; $from = 'tag' }
            $ownerText = 'none'
            if ($owner) { $ownerText = "$owner ($from)" }
            $data = [ordered]@{ Owner = $ownerText; Assignments = @($mine | ForEach-Object { "$($_.name):$($_.assignmentType)" }) }
            if (Test-VkBlank $owner) {
                ConvertTo-VkFinding -Severity Warn -Object $m.name -ObjectId $m.id -Issue 'Enforcing machine configuration assignment on a server with no recorded configuration owner' -Data $data
            } elseif ($mcValues -notcontains (("$owner".ToLowerInvariant() -replace '[^a-z0-9]', '') -replace '^(azure|arc)+', '')) {
                ConvertTo-VkFinding -Severity Finding -Object $m.name -ObjectId $m.id -Issue 'Configuration owned by another tool, but machine configuration also enforces settings' -Data $data
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} server(s); {1} guest assignment(s) read' -f $machines.Count, $ga.Count)
    }
}
