<#
.SYNOPSIS
    The check catalog: every check ID in the guides' CHECKS list, its track, the function that
    implements it, where it reads, and the least-privileged permission or role it needs, with
    the Microsoft Learn page that states it. The README's permissions table is this table.

.NOTES
    Permissions checked on Microsoft Learn on October 29, 2026 unless the Note says otherwise.
    Graph permissions are the same names for delegated and application use unless noted;
    delegated calls also need the signed-in user to hold a role that can read the data
    (Global Reader covers every Entra read here).
#>

$script:VkLearn = @{
    Users       = 'https://learn.microsoft.com/graph/api/user-list?view=graph-rest-1.0'
    UserRes     = 'https://learn.microsoft.com/graph/api/resources/user?view=graph-rest-1.0'
    LcwList     = 'https://learn.microsoft.com/graph/api/identitygovernance-lifecycleworkflowscontainer-list-workflows?view=graph-rest-1.0'
    LcwResults  = 'https://learn.microsoft.com/graph/api/identitygovernance-workflow-list-userprocessingresults?view=graph-rest-1.0'
    LcwSettings = 'https://learn.microsoft.com/graph/api/identitygovernance-lifecyclemanagementsettings-get?view=graph-rest-1.0'
    LcwLimits   = 'https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-execution-limits'
    Groups      = 'https://learn.microsoft.com/graph/api/group-list?view=graph-rest-1.0'
    Members     = 'https://learn.microsoft.com/graph/api/group-list-members?view=graph-rest-1.0'
    Transitive  = 'https://learn.microsoft.com/graph/api/group-list-transitivemembers?view=graph-rest-1.0'
    Evaluate    = 'https://learn.microsoft.com/graph/api/group-evaluatedynamicmembership?view=graph-rest-beta'
    Validate    = 'https://learn.microsoft.com/entra/identity/users/groups-dynamic-rule-validation'
    AuMembers   = 'https://learn.microsoft.com/graph/api/administrativeunit-list-members?view=graph-rest-1.0'
    Devices     = 'https://learn.microsoft.com/graph/api/device-list?view=graph-rest-1.0'
    Autopilot   = 'https://learn.microsoft.com/graph/api/intune-enrollment-windowsautopilotdeviceidentity-list?view=graph-rest-1.0'
    DevConfig   = 'https://learn.microsoft.com/graph/api/intune-deviceconfig-deviceconfiguration-list?view=graph-rest-1.0'
    Managed     = 'https://learn.microsoft.com/graph/api/intune-devices-manageddevice-list?view=graph-rest-1.0'
    ArgArc      = 'https://learn.microsoft.com/azure/azure-arc/servers/resource-graph-samples'
    ArgPolicy   = 'https://learn.microsoft.com/azure/governance/policy/samples/resource-graph-samples'
    ArcAgent    = 'https://learn.microsoft.com/azure/azure-arc/servers/agent-release-notes'
    Aum         = 'https://learn.microsoft.com/azure/update-manager/query-logs'
    ArgTables   = 'https://learn.microsoft.com/azure/governance/resource-graph/reference/supported-tables-resources'
    Apps        = 'https://learn.microsoft.com/graph/api/application-list?view=graph-rest-1.0'
    Sps         = 'https://learn.microsoft.com/graph/api/serviceprincipal-list?view=graph-rest-1.0'
    Ca          = 'https://learn.microsoft.com/graph/api/conditionalaccessroot-list-policies?view=graph-rest-1.0'
    CaWorkload  = 'https://learn.microsoft.com/entra/identity/conditional-access/workload-identity'
    AppRoleTo   = 'https://learn.microsoft.com/graph/api/serviceprincipal-list-approleassignedto?view=graph-rest-1.0'
    RoleAssign  = 'https://learn.microsoft.com/graph/api/rbacapplication-list-roleassignments?view=graph-rest-1.0'
    AdUser      = 'https://learn.microsoft.com/powershell/module/activedirectory/get-aduser'
    Agents      = 'https://learn.microsoft.com/graph/api/agentidentity-list?view=graph-rest-1.0'
    AgentSponsr = 'https://learn.microsoft.com/graph/api/agentidentity-list-sponsors?view=graph-rest-1.0'
    AzRoles     = 'https://learn.microsoft.com/azure/role-based-access-control/built-in-roles'
    PimAzure    = 'https://learn.microsoft.com/azure/role-based-access-control/pim-integration'
    McModes     = 'https://learn.microsoft.com/azure/governance/machine-configuration/concepts/remediation-options'
    McArg       = 'https://learn.microsoft.com/azure/governance/machine-configuration/how-to/view-compliance'
    SpSignIn    = 'https://learn.microsoft.com/graph/api/reportroot-list-serviceprincipalsigninactivities?view=graph-rest-beta'
}

$script:VkCatalog = @(
    # ---- HR track (people) ----
    @{ Id = 'VK-HR-01'; Track = 'HR'; Title = 'Enabled member users with no employeeId (uncorrelated), excluding listed exception owners'
        Source = 'Graph'; GraphPermissions = @('User.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Users) }
    @{ Id = 'VK-HR-02'; Track = 'HR'; Title = 'Coded attribute coverage: empty organization code (extensionAttribute10), worker type (11) or position category (12)'
        Source = 'Graph'; GraphPermissions = @('User.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Users) }
    @{ Id = 'VK-HR-03'; Track = 'HR'; Title = 'Code-value counts per organization code, reconciled with an HR export'
        Source = 'Graph + Input'; GraphPermissions = @('User.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Users) }
    @{ Id = 'VK-HR-04'; Track = 'HR'; Title = 'Duplicate employeeId values'
        Source = 'Graph'; GraphPermissions = @('User.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Users) }
    @{ Id = 'VK-HR-05'; Track = 'HR'; Title = 'Lifecycle Workflows: hire or leave trigger date in the past with no processing record (late HR data, the 3-day catch-up)'
        Source = 'Graph'; GraphPermissions = @('User.Read.All', 'User-LifeCycleInfo.Read.All', 'LifecycleWorkflows-Workflow.Read.All', 'LifecycleWorkflows-Reports.Read.All')
        DelegatedRole = 'Global Reader or Lifecycle Workflows Administrator'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.LcwList, $VkLearn.LcwResults, $VkLearn.UserRes) }
    @{ Id = 'VK-HR-06'; Track = 'HR'; Title = 'Lifecycle Workflows execution limits (quarantine thresholds) configured; workflow count against the 100 ceiling'
        Source = 'Graph'; GraphPermissions = @('LifecycleWorkflows.Read.All', 'LifecycleWorkflows-Workflow.Read.All')
        DelegatedRole = 'Global Reader or Lifecycle Workflows Administrator'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.LcwSettings, $VkLearn.LcwList, $VkLearn.LcwLimits) }

    # ---- Dynamic groups and administrative units ----
    @{ Id = 'VK-DG-01'; Track = 'DG'; Title = 'Dynamic user groups whose rule lacks accountEnabled and userType guards'
        Source = 'Graph'; GraphPermissions = @('Group.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Groups) }
    @{ Id = 'VK-DG-02'; Track = 'DG'; Title = 'Dynamic rules that reference display-name attributes (department, jobTitle, companyName) instead of coded slots'
        Source = 'Graph'; GraphPermissions = @('Group.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Groups) }
    @{ Id = 'VK-DG-03'; Track = 'DG'; Title = 'Rule test against named users before a change (Microsoft Graph rule validation, beta)'
        Source = 'Graph (beta)'; GraphPermissions = @('Group.Read.All', 'User.Read.All', 'Device.Read.All'); DelegatedRole = 'Groups Administrator (delegated only; application permissions not supported)'
        AzureRole = ''; Stage = 'beta'; Learn = @($VkLearn.Evaluate, $VkLearn.Validate) }
    @{ Id = 'VK-DG-04'; Track = 'DG'; Title = 'Shadow diff: a proposed or replacement dynamic group compared with the group it replaces (adds and removes)'
        Source = 'Graph + Input'; GraphPermissions = @('GroupMember.ReadBasic.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Members) }
    @{ Id = 'VK-DG-05'; Track = 'DG'; Title = 'Membership delta over a threshold since the last snapshot, for user and device groups'
        Source = 'Graph + Input'; GraphPermissions = @('Group.Read.All', 'GroupMember.ReadBasic.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Groups, $VkLearn.Transitive) }
    @{ Id = 'VK-DG-06'; Track = 'DG'; Title = 'Paused dynamic processing, and rules using the memberOf preview'
        Source = 'Graph'; GraphPermissions = @('Group.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Groups) }
    @{ Id = 'VK-DG-07'; Track = 'DG'; Title = 'Administrative units: dynamic unit rules mirror their group rules; restricted units listed with their reason'
        Source = 'Graph + Input'; GraphPermissions = @('AdministrativeUnit.Read.All', 'Group.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.AuMembers, $VkLearn.Groups) }

    # ---- Intune track (end-user devices) ----
    @{ Id = 'VK-INT-01'; Track = 'INT'; Title = 'Managed devices missing provisioning-written extension attributes (tier, role, environment)'
        Source = 'Graph'; GraphPermissions = @('Device.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Devices) }
    @{ Id = 'VK-INT-02'; Track = 'INT'; Title = 'Stale devices beyond a threshold, and hybrid-joined plus Entra-joined duplicates'
        Source = 'Graph'; GraphPermissions = @('Device.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Devices) }
    @{ Id = 'VK-INT-03'; Track = 'INT'; Title = 'Autopilot devices with no group tag, or an unknown one'
        Source = 'Graph + Input'; GraphPermissions = @('DeviceManagementServiceConfig.Read.All'); DelegatedRole = 'Intune Read Only Operator or Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Autopilot) }
    @{ Id = 'VK-INT-04'; Track = 'INT'; Title = 'Policy assignment coverage: dynamic device groups versus filters; exclusions that use dynamic device groups'
        Source = 'Graph'; GraphPermissions = @('DeviceManagementConfiguration.Read.All', 'Group.Read.All'); DelegatedRole = 'Intune Read Only Operator or Global Reader'; AzureRole = ''; Stage = 'v1.0 (settings catalog: beta, with -IncludeBeta)'; Learn = @($VkLearn.DevConfig, $VkLearn.Groups) }
    @{ Id = 'VK-INT-05'; Track = 'INT'; Title = 'Devices in more than one group that assigns the same setting (conflict candidates)'
        Source = 'Graph'; GraphPermissions = @('DeviceManagementConfiguration.Read.All', 'Group.Read.All', 'GroupMember.ReadBasic.All', 'Device.Read.All'); DelegatedRole = 'Intune Read Only Operator or Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.DevConfig, $VkLearn.Members) }
    @{ Id = 'VK-INT-06'; Track = 'INT'; Title = 'Platform inventory by OS, version and ownership, against the coverage matrix (out-of-support platforms flagged)'
        Source = 'Graph + Input'; GraphPermissions = @('DeviceManagementManagedDevices.Read.All'); DelegatedRole = 'Intune Read Only Operator or Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Managed) }

    # ---- Arc track (servers) ----
    @{ Id = 'VK-ARC-01'; Track = 'ARC'; Title = 'Arc-enabled servers missing required tags (the tag taxonomy as input)'
        Source = 'ResourceGraph + Input'; GraphPermissions = @(); DelegatedRole = ''; AzureRole = 'Reader on the subscriptions or management group'; Stage = 'GA'; Learn = @($VkLearn.ArgArc) }
    @{ Id = 'VK-ARC-02'; Track = 'ARC'; Title = 'Agent status: disconnected or expired machines, and agent versions out of support'
        Source = 'ResourceGraph'; GraphPermissions = @(); DelegatedRole = ''; AzureRole = 'Reader'; Stage = 'GA'; Learn = @($VkLearn.ArgArc, $VkLearn.ArcAgent) }
    @{ Id = 'VK-ARC-03'; Track = 'ARC'; Title = 'Azure Policy compliance for the baseline assignment, per server'
        Source = 'ResourceGraph'; GraphPermissions = @(); DelegatedRole = ''; AzureRole = 'Reader'; Stage = 'GA'; Learn = @($VkLearn.ArgPolicy) }
    @{ Id = 'VK-ARC-04'; Track = 'ARC'; Title = 'Servers in the CMDB not Arc-enabled and not assigned to tier 2-4 (CM-8 gap)'
        Source = 'ResourceGraph + Input'; GraphPermissions = @(); DelegatedRole = ''; AzureRole = 'Reader'; Stage = 'GA'; Learn = @($VkLearn.ArgArc) }
    @{ Id = 'VK-ARC-05'; Track = 'ARC'; Title = 'Update Manager scoping coverage, and machines with no patch assessment in N days'
        Source = 'ResourceGraph'; GraphPermissions = @(); DelegatedRole = ''; AzureRole = 'Reader'; Stage = 'GA'; Learn = @($VkLearn.Aum, $VkLearn.ArgTables) }
    @{ Id = 'VK-ARC-06'; Track = 'ARC'; Title = 'Role assignments on Arc scopes: Owner or Contributor outside break-glass, active admin or login roles, onboarding grants with no open wave, users where groups are expected'
        Source = 'ResourceGraph + ResourceManager + Input'; GraphPermissions = @(); DelegatedRole = ''; AzureRole = 'Reader (includes Microsoft.Authorization/roleAssignments/read and roleEligibilitySchedules/read)'; Stage = 'GA'; Learn = @($VkLearn.AzRoles, $VkLearn.PimAzure, $VkLearn.ArgTables) }
    @{ Id = 'VK-ARC-07'; Track = 'ARC'; Title = 'Two tools on one setting: servers whose config owner is not machine configuration but which carry an enforcing machine configuration assignment'
        Source = 'ResourceGraph + Input'; GraphPermissions = @(); DelegatedRole = ''; AzureRole = 'Reader'; Stage = 'GA'; Learn = @($VkLearn.McModes, $VkLearn.McArg) }

    # ---- Non-person identity track ----
    @{ Id = 'VK-NPI-01'; Track = 'NPI'; Title = 'Service principals and app registrations with no owner, or fewer than two owners'
        Source = 'Graph'; GraphPermissions = @('Application.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Apps, $VkLearn.Sps) }
    @{ Id = 'VK-NPI-02'; Track = 'NPI'; Title = 'Client secrets and certificates expiring within N days, and those valid longer than the policy maximum'
        Source = 'Graph'; GraphPermissions = @('Application.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Apps) }
    @{ Id = 'VK-NPI-03'; Track = 'NPI'; Title = 'Apps using password credentials (secrets) where certificate or federated credentials are possible'
        Source = 'Graph + Input'; GraphPermissions = @('Application.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Apps) }
    @{ Id = 'VK-NPI-04'; Track = 'NPI'; Title = 'Workload identities not covered by Conditional Access for workload identities (single-tenant SPs)'
        Source = 'Graph'; GraphPermissions = @('Policy.Read.All', 'Application.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.Ca, $VkLearn.CaWorkload) }
    @{ Id = 'VK-NPI-05'; Track = 'NPI'; Title = 'Service principals with high-privilege Graph app roles or directory roles (a least-privilege review list)'
        Source = 'Graph'; GraphPermissions = @('Application.Read.All', 'RoleManagement.Read.Directory'); DelegatedRole = 'Global Reader'; AzureRole = ''; Stage = 'v1.0'; Learn = @($VkLearn.AppRoleTo, $VkLearn.RoleAssign) }
    @{ Id = 'VK-NPI-06'; Track = 'NPI'; Title = 'AD service accounts: password never expires, old passwords, SPNs, not gMSA'
        Source = 'ActiveDirectory (optional) or fixture'; GraphPermissions = @(); DelegatedRole = 'Authenticated domain user (default read)'; AzureRole = ''; Stage = 'n/a'; Learn = @($VkLearn.AdUser) }
    @{ Id = 'VK-NPI-07'; Track = 'NPI'; Title = 'Managed identities and their role assignments (for inventory)'
        Source = 'Graph + ResourceGraph'; GraphPermissions = @('Application.Read.All'); DelegatedRole = 'Global Reader'; AzureRole = 'Reader'; Stage = 'v1.0 / GA'; Learn = @($VkLearn.Sps, $VkLearn.ArgTables) }
    @{ Id = 'VK-NPI-08'; Track = 'NPI'; Title = 'AI agent identities, where the tenant exposes them: sponsor present'
        Source = 'Graph'; GraphPermissions = @('AgentIdentity.Read.All'); DelegatedRole = 'Agent ID Administrator or Global Reader'; AzureRole = ''; Stage = 'v1.0 (Agent ID platform generally available April 2026)'; Learn = @($VkLearn.Agents, $VkLearn.AgentSponsr) }
    @{ Id = 'VK-NPI-09'; Track = 'NPI'; Title = 'Optional, preview: service principals with no sign-in activity in N days (service principal sign-in activity report, beta)'
        Source = 'Graph (beta)'; GraphPermissions = @('AuditLog.Read.All', 'Application.Read.All'); DelegatedRole = 'Reports Reader'; AzureRole = ''
        Stage = 'beta; documented for the global service (which GCC uses), not for US Government L4 or L5'; Optional = $true; Preview = $true; Learn = @($VkLearn.SpSignIn) }
)

function Get-VkFunctionName {
    # VK-HR-01 -> Invoke-VkHr01; VK-INT-04 -> Invoke-VkInt04.
    param([Parameter(Mandatory)][string]$CheckId)
    $parts = $CheckId.Split('-')
    $track = $parts[1].Substring(0, 1).ToUpperInvariant() + $parts[1].Substring(1).ToLowerInvariant()
    "Invoke-Vk$track$($parts[2])"
}

function Get-VkCheckCatalog {
    <#
    .SYNOPSIS
        The catalog entries, all or filtered by -Track or -CheckId, each with its function name.
    #>
    [CmdletBinding()]
    param([string[]]$Track, [string[]]$CheckId, [switch]$IncludeOptional)
    $rows = foreach ($c in $script:VkCatalog) {
        [pscustomobject][ordered]@{
            Id               = $c.Id
            Track            = $c.Track
            Title            = $c.Title
            Function         = Get-VkFunctionName $c.Id
            Source           = $c.Source
            GraphPermissions = @($c.GraphPermissions)
            DelegatedRole    = $c.DelegatedRole
            AzureRole        = $c.AzureRole
            Stage            = $c.Stage
            Optional         = [bool]$c['Optional']
            Preview          = [bool]$c['Preview']
            Learn            = @($c.Learn)
        }
    }
    if ($CheckId) {
        $unknown = @($CheckId | Where-Object { @($script:VkCatalog.Id) -notcontains $_ })
        if ($unknown.Count -gt 0) { throw "Unknown check ID: $($unknown -join ', ')" }
        $rows = @($rows | Where-Object { $CheckId -contains $_.Id })
    }
    elseif (-not $IncludeOptional) { $rows = @($rows | Where-Object { -not $_.Optional }) }
    if ($Track) { $rows = @($rows | Where-Object { $Track -contains $_.Track }) }
    if ($CheckId -and $CheckId.Count -eq 1 -and -not $Track) { return $rows[0] }
    @($rows)
}

function Get-VkRequiredScope {
    <# The union of Graph permissions the selected checks need: the scopes for a delegated sign-in. #>
    param([object[]]$Checks)
    @($Checks | ForEach-Object { $_.GraphPermissions } | Where-Object { $_ } | Sort-Object -Unique)
}

function Invoke-VkCheck {
    <# Runs one check by ID. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$CheckId, [Parameter(Mandatory)]$Context)
    $fn = Get-VkFunctionName $CheckId
    $null = Get-VkCheckCatalog -CheckId $CheckId
    & $fn -Context $Context
}
