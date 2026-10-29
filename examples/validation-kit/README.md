# Validation kit: read-only checks for the track implementation guides

> **Status: illustrative. Unit-tested against fixtures, not tested against a live tenant.**
> These checks are the executable form of the **Validate** step at each gate of the track implementation guides: the [Intune track](../../docs/books/guides/intune-track-implementation.md), the [Azure Arc track](../../docs/books/guides/arc-track-implementation.md) and the [non-person identity track](../../docs/books/guides/non-person-identity-implementation.md). They build on the [Attribute-Driven Migration guide](../../docs/books/guides/attribute-driven-migration.md). The HR checks follow the guide's Stages 1 and 2 and its "Lifecycle Workflows at scale" section. The kit reads Microsoft Graph, Azure Resource Graph and, optionally, Active Directory. It changes nothing in any of them. Review every function, sign the module, and run it first in a test tenant. No agency has endorsed or adopted it.

**Download:** [validation-kit.zip](https://whalermike.github.io/modernization-workbook/downloads/validation-kit.zip). It's rebuilt from this folder on every site deploy. **Source:** [examples/validation-kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit). The zip also holds a plain-text copy of every script, module, fixture and test, named with `.txt` added (`Invoke-ValidationKit.ps1.txt`). It's there for tools that refuse `.ps1` files. Run the originals.

## What a check returns

Each check is one function named after its ID: `VK-HR-01` is `Invoke-VkHr01` and `VK-INT-04` is `Invoke-VkInt04`. Each returns one object with these fields:

| Field | What it holds |
|---|---|
| `CheckId`, `Track`, `Title` | The check ID, as the guides cite it; its track (`HR`, `DG`, `INT`, `ARC`, `NPI`); what it checks |
| `Status` | `Pass`, `Fail`, `Warn`, `NotApplicable` or `Error`. A read that fails gives `Error`, never `Pass`. |
| `Count` | The rows that need action, Finding and Warn (Info rows give context and don't count) |
| `Details` | One row per object: `Severity`, `Object`, `ObjectId`, `Issue`, `Detail` |
| `Evidence` | The mode (`Live` or `Fixture`), every query sent or file read, with the time of each, the permissions and role the check needs, its release stage, and when it was collected |

`Fail` means at least one Finding row. `Warn` means rows that need review but aren't a finding, such as conflict candidates or a least-privilege review list. `NotApplicable` means the tenant has nothing to check, such as no Arc servers, or that an input wasn't supplied. The message says which.

## Prerequisites

- **Windows PowerShell 5.1 or PowerShell 7.** The tests run on both.
- **Microsoft Graph PowerShell** (`Microsoft.Graph.Authentication`) for every Graph check. The kit calls only `Connect-MgGraph` and `Invoke-MgGraphRequest`, following the pattern in the [Microsoft automation reference](../ms-automation/README.md).
- **Az.Accounts** and **Az.ResourceGraph** for the Arc track and `VK-NPI-07`. `VK-ARC-06` also needs **Az.Resources** for `Get-AzRoleEligibilitySchedule`.
- **ActiveDirectory** (RSAT) only for a live `VK-NPI-06`. Skip it with `-SkipAD`, or use an export as a fixture.
- **Pester 5.5 or later** to run the tests. Windows PowerShell ships with Pester 3.4, so install Pester 5 for it.
- **Cloud.** `-Cloud gcc` (the default) uses the worldwide Graph endpoint, `https://graph.microsoft.com`, and the `AzureCloud` environment, as GCC (Moderate) does. `gcchigh` and `dod` exist for High-only use: they point at `graph.microsoft.us` and `dod-graph.microsoft.us` and the `AzureUSGovernment` environment.

## Permissions each check needs

Grant only what the checks you run need. A delegated run asks for the union of the selected checks' Graph permissions, and `Get-VkRequiredScope` prints them. An app-only run (a certificate or a managed identity, never a secret) needs the same names, granted as application permissions with admin consent. In a delegated run the signed-in user also needs the role shown. Global Reader covers every Entra read. Intune reads need an Intune role such as Read Only Operator, and Azure reads need Reader on the subscriptions or management group. The Learn column links the page that states each permission. Those pages were checked on October 29, 2026.

| Check | Reads | Graph permission (least privileged read) | Role | Stage | Learn |
|---|---|---|---|---|---|
| VK-HR-01 | Graph | `User.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/user-list?view=graph-rest-1.0) |
| VK-HR-02 | Graph | `User.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/user-list?view=graph-rest-1.0) |
| VK-HR-03 | Graph + Input | `User.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/user-list?view=graph-rest-1.0) |
| VK-HR-04 | Graph | `User.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/user-list?view=graph-rest-1.0) |
| VK-HR-05 | Graph | `User.Read.All`, `User-LifeCycleInfo.Read.All`, `LifecycleWorkflows-Workflow.Read.All`, `LifecycleWorkflows-Reports.Read.All` | Global Reader or Lifecycle Workflows Administrator | v1.0 | [1](https://learn.microsoft.com/graph/api/identitygovernance-lifecycleworkflowscontainer-list-workflows?view=graph-rest-1.0) [2](https://learn.microsoft.com/graph/api/identitygovernance-workflow-list-userprocessingresults?view=graph-rest-1.0) [3](https://learn.microsoft.com/graph/api/resources/user?view=graph-rest-1.0) |
| VK-HR-06 | Graph | `LifecycleWorkflows.Read.All`, `LifecycleWorkflows-Workflow.Read.All` | Global Reader or Lifecycle Workflows Administrator | v1.0 | [1](https://learn.microsoft.com/graph/api/identitygovernance-lifecyclemanagementsettings-get?view=graph-rest-1.0) [2](https://learn.microsoft.com/graph/api/identitygovernance-lifecycleworkflowscontainer-list-workflows?view=graph-rest-1.0) [3](https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-execution-limits) |
| VK-DG-01 | Graph | `Group.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/group-list?view=graph-rest-1.0) |
| VK-DG-02 | Graph | `Group.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/group-list?view=graph-rest-1.0) |
| VK-DG-03 | Graph (beta) | `Group.Read.All`, `User.Read.All`, `Device.Read.All` | Groups Administrator (delegated only; application permissions not supported) | beta | [1](https://learn.microsoft.com/graph/api/group-evaluatedynamicmembership?view=graph-rest-beta) [2](https://learn.microsoft.com/entra/identity/users/groups-dynamic-rule-validation) |
| VK-DG-04 | Graph + Input | `GroupMember.ReadBasic.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/group-list-members?view=graph-rest-1.0) |
| VK-DG-05 | Graph + Input | `Group.Read.All`, `GroupMember.ReadBasic.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/group-list?view=graph-rest-1.0) [2](https://learn.microsoft.com/graph/api/group-list-transitivemembers?view=graph-rest-1.0) |
| VK-DG-06 | Graph | `Group.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/group-list?view=graph-rest-1.0) |
| VK-DG-07 | Graph + Input | `AdministrativeUnit.Read.All`, `Group.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/administrativeunit-list-members?view=graph-rest-1.0) [2](https://learn.microsoft.com/graph/api/group-list?view=graph-rest-1.0) |
| VK-INT-01 | Graph | `Device.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/device-list?view=graph-rest-1.0) |
| VK-INT-02 | Graph | `Device.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/device-list?view=graph-rest-1.0) |
| VK-INT-03 | Graph + Input | `DeviceManagementServiceConfig.Read.All` | Intune Read Only Operator or Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/intune-enrollment-windowsautopilotdeviceidentity-list?view=graph-rest-1.0) |
| VK-INT-04 | Graph | `DeviceManagementConfiguration.Read.All`, `Group.Read.All` | Intune Read Only Operator or Global Reader | v1.0 (settings catalog: beta, with -IncludeBeta) | [1](https://learn.microsoft.com/graph/api/intune-deviceconfig-deviceconfiguration-list?view=graph-rest-1.0) [2](https://learn.microsoft.com/graph/api/group-list?view=graph-rest-1.0) |
| VK-INT-05 | Graph | `DeviceManagementConfiguration.Read.All`, `Group.Read.All`, `GroupMember.ReadBasic.All`, `Device.Read.All` | Intune Read Only Operator or Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/intune-deviceconfig-deviceconfiguration-list?view=graph-rest-1.0) [2](https://learn.microsoft.com/graph/api/group-list-members?view=graph-rest-1.0) |
| VK-INT-06 | Graph + Input | `DeviceManagementManagedDevices.Read.All` | Intune Read Only Operator or Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/intune-devices-manageddevice-list?view=graph-rest-1.0) |
| VK-ARC-01 | ResourceGraph + Input | none | Reader on the subscriptions or management group | GA | [1](https://learn.microsoft.com/azure/azure-arc/servers/resource-graph-samples) |
| VK-ARC-02 | ResourceGraph | none | Reader | GA | [1](https://learn.microsoft.com/azure/azure-arc/servers/resource-graph-samples) [2](https://learn.microsoft.com/azure/azure-arc/servers/agent-release-notes) |
| VK-ARC-03 | ResourceGraph | none | Reader | GA | [1](https://learn.microsoft.com/azure/governance/policy/samples/resource-graph-samples) |
| VK-ARC-04 | ResourceGraph + Input | none | Reader | GA | [1](https://learn.microsoft.com/azure/azure-arc/servers/resource-graph-samples) |
| VK-ARC-05 | ResourceGraph | none | Reader | GA | [1](https://learn.microsoft.com/azure/update-manager/query-logs) [2](https://learn.microsoft.com/azure/governance/resource-graph/reference/supported-tables-resources) |
| VK-ARC-06 | ResourceGraph + ResourceManager + Input | none | Reader (includes Microsoft.Authorization/roleAssignments/read and roleEligibilitySchedules/read) | GA | [1](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles) [2](https://learn.microsoft.com/azure/role-based-access-control/pim-integration) [3](https://learn.microsoft.com/azure/governance/resource-graph/reference/supported-tables-resources) |
| VK-ARC-07 | ResourceGraph + Input | none | Reader | GA | [1](https://learn.microsoft.com/azure/governance/machine-configuration/concepts/remediation-options) [2](https://learn.microsoft.com/azure/governance/machine-configuration/how-to/view-compliance) |
| VK-NPI-01 | Graph | `Application.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/application-list?view=graph-rest-1.0) [2](https://learn.microsoft.com/graph/api/serviceprincipal-list?view=graph-rest-1.0) |
| VK-NPI-02 | Graph | `Application.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/application-list?view=graph-rest-1.0) |
| VK-NPI-03 | Graph + Input | `Application.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/application-list?view=graph-rest-1.0) |
| VK-NPI-04 | Graph | `Policy.Read.All`, `Application.Read.All` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/conditionalaccessroot-list-policies?view=graph-rest-1.0) [2](https://learn.microsoft.com/entra/identity/conditional-access/workload-identity) |
| VK-NPI-05 | Graph | `Application.Read.All`, `RoleManagement.Read.Directory` | Global Reader | v1.0 | [1](https://learn.microsoft.com/graph/api/serviceprincipal-list-approleassignedto?view=graph-rest-1.0) [2](https://learn.microsoft.com/graph/api/rbacapplication-list-roleassignments?view=graph-rest-1.0) |
| VK-NPI-06 | ActiveDirectory (optional) or fixture | none | Authenticated domain user (default read) | n/a | [1](https://learn.microsoft.com/powershell/module/activedirectory/get-aduser) |
| VK-NPI-07 | Graph + ResourceGraph | `Application.Read.All` | Global Reader; Reader | v1.0 / GA | [1](https://learn.microsoft.com/graph/api/serviceprincipal-list?view=graph-rest-1.0) [2](https://learn.microsoft.com/azure/governance/resource-graph/reference/supported-tables-resources) |
| VK-NPI-08 | Graph | `AgentIdentity.Read.All` | Agent ID Administrator or Global Reader | v1.0 (Agent ID platform generally available April 2026) | [1](https://learn.microsoft.com/graph/api/agentidentity-list?view=graph-rest-1.0) [2](https://learn.microsoft.com/graph/api/agentidentity-list-sponsors?view=graph-rest-1.0) |
| VK-NPI-09 | Graph (beta) | `AuditLog.Read.All`, `Application.Read.All` | Reports Reader | beta; documented for the global service (which GCC uses), not for US Government L4 or L5 | [1](https://learn.microsoft.com/graph/api/reportroot-list-serviceprincipalsigninactivities?view=graph-rest-beta) |


Notes on the table:

- **Pages checked.** The Lifecycle Workflows, group, group member, administrative unit member, device, Autopilot, managed device, device configuration, evaluateDynamicMembership, agent identity, service principal sign-in activity, Resource Graph, Update Manager, machine configuration and built-in role pages were read on October 29, 2026. The users, applications, Conditional Access and directory role permissions come from the [Microsoft automation reference](../ms-automation/README.md), which checked them on October 25, 2026. The `appRoleAssignedTo` and Conditional Access for workload identities pages weren't re-read for this kit, so confirm them before you grant the permissions.
- **List groups.** Learn's List groups page names a write permission, `Group-NestingSupport.ReadWrite.All`, as the least privileged one. The kit uses the read-only `Group.Read.All` instead, which returns `membershipRule`.
- **Lifecycle Workflows.** For listing workflows, Learn names `LifecycleWorkflows-Workflow.ReadBasic.All` as the least privileged permission, but it doesn't say which properties that permission returns. The kit reads execution conditions and settings, so it asks for `LifecycleWorkflows-Workflow.Read.All`. Reading `employeeLeaveDateTime` needs `User-LifeCycleInfo.Read.All`. The user resource page says so; it wasn't re-read on October 29.
- **VK-DG-03** works with delegated permissions only, because Learn lists no application permission for evaluateDynamicMembership. The portal's equivalent, the Validate rules tab, needs at least Groups Administrator. An app-only run therefore reports `VK-DG-03` as `Error`.
- **VK-NPI-08.** Learn lists only `AgentIdentity.ReadWrite.All` (application) for the per-agent sponsors call, and the kit doesn't request it. It asks for sponsors through `$expand` on the list call, which needs `AgentIdentity.Read.All`. Where the tenant doesn't return sponsors that way, the row is a Warn saying the sponsor wasn't readable. That behavior hasn't been seen against a live tenant.
- **VK-NPI-09** is **optional and preview**. It reads Graph's beta `servicePrincipalSignInActivities` report, which Learn documents for the global service, which GCC uses, but not for US Government L4 or L5. It's off by default. It runs only with `-IncludePreview`, and it reports `NotApplicable` for `-Cloud gcchigh` or `dod`.

## Run it

```powershell
# Every default check against the fictional "fail" tenant; no sign-in. (Arc baseline name supplied.)
.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -FixturePath .\tests\fixtures\fail -AsOf 2026-10-29 -Option @{ BaselineAssignmentName = 'server-baseline' }

# HR track and dynamic groups, live: delegated sign-in with exactly the read scopes those checks need.
# Inputs (exceptions.csv, hr-export.csv, rule-tests.json, shadow-pairs.csv, the last snapshot) come from D:\Inputs.
.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track HR, DG -InputPath D:\Inputs

# Intune track, app-only with a certificate, including settings catalog policies (beta).
.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track INT, DG -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint> -IncludeBeta

# Arc track: Reader on the subscriptions; name the baseline assignment; CMDB, break-glass and wave lists in D:\Inputs.
.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track ARC -InputPath D:\Inputs -Option @{ BaselineAssignmentName = 'arc-baseline'; Subscriptions = @('<subscription-id>') }

# Non-person identities, with the optional preview check and without AD.
.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track NPI -IncludePreview -SkipAD

# One check, from a session that already signed in.
Import-Module .\powershell\ValidationKit
Connect-VkGraph -Cloud gcc -Scopes (Get-VkRequiredScope -Checks (Get-VkCheckCatalog -CheckId VK-HR-01))
Invoke-VkHr01 -Context (Get-VkRunContext -InputPath D:\Inputs)
```

`-Track` takes `HR`, `DG`, `INT`, `ARC` and `NPI`, and `-CheckId` takes one or more IDs. With neither, every default check runs. `-Option` overrides a threshold or an input file name. The keys and defaults are in `$script:VkDefaultOptions` in `powershell/ValidationKit/Private/Core.ps1`. They include `StaleDays` (90), `ExpiringDays` (30), `MaxSecretDays` (180), `MaxCertificateDays` (365), `MinOwners` (2), `LookbackDays` (30) and `CatchUpDays` (3) for Lifecycle Workflows, `DeltaThresholdPercent` (10) and `DeltaThresholdMinimum` (5), `MinSupportedAgentVersion` (1.58), `PatchAssessmentDays` (7), `SpInactiveDays` (90), the coded slots (`extensionAttribute10` to `12`) and the device slots (`extensionAttribute11` to `13`). Sign the module and run it under an `AllSigned` or `RemoteSigned` policy rather than bypassing execution policy.

### Inputs

Some checks compare the tenant with the program's own records. Put the files in `-InputPath`. Fixture runs read them from the fixture folder. A missing input makes that check `NotApplicable`, never `Pass`. Three inputs ship with defaults in `config/`: the platform coverage matrix (taken from the companion guide's coverage table), the Arc tag taxonomy (Book 05, Chapter 09) and the list of high-privilege Graph permissions. Replace them with the agency's own.

| File | Columns | Used by |
|---|---|---|
| `exceptions.csv` | `UserPrincipalName` or `Id`, `Owner`, `Reason` | VK-HR-01 to 03 (an exception with no owner doesn't count) |
| `hr-export.csv` | `OrgCode`, `Count` | VK-HR-03 |
| `rule-tests.json` | `Label`, `MemberId`, `GroupId` or `MembershipRule`, `Expected` | VK-DG-03 |
| `shadow-pairs.csv` | `CurrentGroupId`, `ProposedGroupId` | VK-DG-04 |
| `membership-snapshot.json` | The `Snapshot\membership-snapshot.json` of the previous run | VK-DG-05 |
| `au-group-map.csv`, `restricted-au-reasons.csv` | `AdministrativeUnitId`, `GroupId`; `AdministrativeUnitId`, `Reason`, `DecisionRef` | VK-DG-07 |
| `autopilot-group-tags.csv` | `GroupTag`, `Meaning` | VK-INT-03 |
| `platform-matrix.csv` (default in `config/`) | `OperatingSystem`, `MinVersion`, `Coverage` (Managed, Limited, NotSupported), `Note` | VK-INT-06 |
| `tag-taxonomy.json` (default in `config/`) | `required`, `allowed` | VK-ARC-01 |
| `cmdb.csv` | `Name`, `Tier` (1 to 4), `Owner`, `config_owner` | VK-ARC-04, VK-ARC-07 |
| `break-glass.csv`, `onboarding-waves.csv` | `PrincipalId`, `Name`; `Scope`, `Wave`, `Status` (Open or Closed) | VK-ARC-06 |
| `secret-exceptions.csv` | `AppId`, `Reason` | VK-NPI-03 |
| `high-privilege-graph-roles.json` (default in `config/`) | Graph application permission names | VK-NPI-05 |

### What a run writes

Everything goes under `<OutputPath>\<run-id>`. The run ID is `YYYY-MM-DD-HHmm-<host>-<live|fixture>`, in UTC.

```text
<run-id>\
├── ValidationManifest.json   who, when (UTC), host, mode, cloud, options, the scopes requested, every
│                             check's status and queries, PowerShell and module versions, and the size
│                             and SHA-256 of every other file
├── Results\        ValidationResults.csv (one row per check, with its queries and collection time),
│                   ValidationResults.json (with every detail row and the full evidence)
├── Details\        <CheckId>.csv for each check that has rows
├── Summary\        ValidationSummary.md (the one-page summary), ValidationSummary.json
└── Snapshot\       membership-snapshot.json: this run's dynamic group counts, the next run's VK-DG-05 input
```

The results name users, devices and service principals, so store them as the agency's data classification requires.

## How the guides' Validate steps map to the checks

| Guide and gate | Checks |
|---|---|
| Attribute-Driven Migration, Stage 2 (prove the attributes are true) | VK-HR-01, VK-HR-02, VK-HR-03, VK-HR-04 |
| Attribute-Driven Migration, Stage 4 (dynamic groups), dynamic group dangers | VK-DG-01, VK-DG-02, VK-DG-03, VK-DG-04, VK-DG-05, VK-DG-06 |
| Attribute-Driven Migration, Stage 5 (administrative units) | VK-DG-07 |
| Attribute-Driven Migration, Lifecycle Workflows at scale | VK-HR-05, VK-HR-06 |
| [Intune track](../../docs/books/guides/intune-track-implementation.md), Step 0.4 (coverage matrix and tiers) | VK-INT-06 |
| Intune track, Step 1.5 (close every other write path) | VK-INT-01, VK-INT-03, VK-DG-05, VK-NPI-05 |
| Intune track, Step 2.4 (one owning policy per setting) | VK-DG-01 to VK-DG-04, VK-DG-06, VK-INT-04, VK-INT-05 |
| Intune track, Steps 3.2 to 3.6 (policy library, rings, residual cleanup) | VK-INT-01, VK-INT-04, VK-INT-05 |
| Intune track, Step 5 (wave runbook and rollback) | VK-INT-01, VK-INT-03, VK-INT-05, VK-DG-05 |
| Intune track, Step 6 (stale devices, drift) | VK-INT-01, VK-INT-02, VK-INT-03, VK-DG-05, VK-DG-06 |
| [Arc track](../../docs/books/guides/arc-track-implementation.md), Gate 1 (inventory) | VK-ARC-04 |
| Arc track, Gate 2 (tag taxonomy) | VK-ARC-01 |
| Arc track, Gate 3 (each onboarding wave) | VK-ARC-01, VK-ARC-02, VK-ARC-04, VK-NPI-01, VK-NPI-02, VK-NPI-07 |
| Arc track, Gate 4 (baseline) | VK-ARC-03 |
| Arc track, Gate 5 (Update Manager) | VK-ARC-05 |
| Arc track, Gate 6 (access) | VK-ARC-06 |
| Arc track, Step 7 (two tools on one setting) and Gate 8 (standing) | VK-ARC-01 to VK-ARC-07 |
| [Non-person identity track](../../docs/books/guides/non-person-identity-implementation.md), G1 (inventory) | VK-NPI-01, VK-NPI-06, VK-NPI-07, VK-NPI-08 |
| Non-person identity track, G2 (decision) | VK-NPI-03, VK-NPI-06 |
| Non-person identity track, G3 (credential rules) | VK-NPI-02, VK-NPI-03 |
| Non-person identity track, G4 (least privilege) | VK-NPI-04, VK-NPI-05, VK-NPI-07 |
| Non-person identity track, G5 (conversion) | VK-NPI-03, VK-NPI-06 |
| Non-person identity track, G6 (lifecycle) | VK-NPI-01, VK-NPI-02, VK-NPI-08, and VK-NPI-09 (optional, preview) |


## How read-only is enforced

- **No write cmdlets.** `tests/powershell/Safety.Tests.ps1` parses every script and module in the kit and fails the build on any command with a state-changing verb, including `Set-`, `New-`, `Remove-`, `Update-`, `Add-`, `Enable-`, `Disable-`, `Grant-`, `Revoke-`, `Reset-`, `Start-` (except `Start-Sleep`), `Stop-`, `Publish-` and `Send-`. It also fails on `Out-File`, `Export-Csv`, `Set-Content`, `Invoke-RestMethod`, `Invoke-WebRequest`, `Invoke-AzRestMethod`, `Invoke-Command`, `Invoke-Expression`, run-command cmdlets, any native program, file redirection, and any .NET file write outside the guarded writers.
- **Graph GET only.** Every `Invoke-MgGraphRequest` must carry a literal `-Method GET`. There is one exception, and the test pins it to one place: a POST to the beta `evaluateDynamicMembership` action inside `Invoke-VkRuleValidation`, for VK-DG-03. That action evaluates a rule and changes nothing. A test asserts it's the only non-GET Graph call in the kit. Graph beta paths are limited to a declared list: rule evaluation, settings catalog policies and the service principal sign-in report.
- **The token stays home.** Graph calls go to the cloud's own Graph host. A `nextLink` that points anywhere else is refused.
- **Azure and AD reads.** Azure is read through `Search-AzGraph` (Resource Graph) and `Get-AzRoleEligibilitySchedule`. AD is read through `Get-ADUser` and `Get-ADServiceAccount`.
- **Writes only under `-OutputPath`.** Every file goes through three guarded writers that refuse a path outside the registered output root. The runner test checks that nothing lands elsewhere, including in the kit itself.
- **Throttling.** Low throttle priority (`x-ms-throttle-priority: Low`), paging through `@odata.nextLink` and Resource Graph skip tokens, and retries of 429, 503 and 504 after `Retry-After` (or exponential backoff) on top of the SDK's own retry.

A planted-violation test proves the safety checks catch each kind of violation.

## Test it

```text
pwsh -NoProfile -Command "Invoke-Pester -Path tests/powershell"
powershell -NoProfile -Command "Import-Module Pester -MinimumVersion 5.5; Invoke-Pester -Path tests/powershell"
```

The fixtures describe a fictional tenant, `contoso.example`, in two versions. `tests/fixtures/pass` has none of the problems. `tests/fixtures/fail` plants each problem the checks exist to find. `Checks.Tests.ps1` runs every check against both and asserts its status and count on each, and then checks the specific rows for the checks with the most logic. `Client.Tests.ps1` exercises the live path with Graph, Resource Graph and AD mocked: paging, retry, the host check, the single POST, a check run live, and delegated sign-in with the computed scopes. `Runner.Tests.ps1` runs the whole kit end to end. The tests prove the code does what this README says against the fixtures, on both PowerShell editions. They don't prove that your tenant returns the same shapes.

## Known limits

- **Not tested live.** Property names follow Microsoft Learn. A tenant can return shapes the fixtures don't have. Run every check in a test tenant first, and compare a few rows by hand.
- **VK-HR-05** evaluates Lifecycle Workflows scope rules only when they're made of `property eq|ne 'value'` clauses joined by `and`. Any other rule gives a Warn row instead of a Finding, so confirm those rows in the workflow history. It doesn't model the *Time based attribute V2* preview trigger, which has no catch-up window.
- **VK-HR-06.** Learn notes that a per-workflow execution limit set in the admin center "isn't currently reflected in the API", so confirm a finding in the admin center before you act on it.
- **VK-INT-05** finds candidates: devices that two policies of the same type reach. It doesn't compare individual settings. Confirm each candidate in Intune's per-setting status.
- **VK-INT-06** can't tell Windows 10 LTSC (supported) from Windows 10 non-LTSC (limited) by version number, so both show as Limited. Check the SKU.
- **VK-ARC-02's default minimum agent version (1.58)** is the program's reading of "versions released within the last year" on October 29, 2026. Set it from the release notes when you run.
- **VK-ARC-05.** Resource Graph keeps patch assessment results for 7 days, so a longer window can't be measured there. The dynamic-scope filter shape the kit matches (resource groups, OS types, locations and tags) hasn't been checked against a live tenant.
- **VK-ARC-06** evaluates assignments at machine, resource group and subscription scope. It doesn't evaluate management-group assignments, because Resource Graph's role assignment rows don't say which subscriptions a management group holds. A user is flagged unless it's on the break-glass list. Check non-person assignees' owners with VK-NPI-01.
- **VK-ARC-07** flags `ApplyAndMonitor`, `ApplyAndAutoCorrect` and `DeployAndAutoCorrect`. Learn says `assignmentType` is case sensitive and spells it both `ApplyAndMonitor` and `ApplyandMonitor`, so the kit compares without regard to case.
- **VK-NPI-03** lists every app with a client secret unless `secret-exceptions.csv` records why it must keep one. Whether a certificate or federated credential is possible is a judgment the kit can't make.
- **VK-NPI-06** treats a user object with an SPN, or a name that starts with `svc`, as a service account. Change the hint with `ServiceAccountNameHint`.

```
examples/validation-kit/
  README.md
  Invoke-ValidationKit.ps1               the runner: select, sign in, run, write results, summary, manifest
  config/                                default platform matrix, tag taxonomy, high-privilege Graph permissions
  powershell/ValidationKit/
    ValidationKit.psd1, .psm1            the module (one function per check ID)
    Private/Core.ps1                     context, data access, Graph and Resource Graph clients, writers, manifest
    Private/Catalog.ps1                  every check's track, source, permission, role, stage and Learn page
    Checks/HR.ps1, DG.ps1, INT.ps1, ARC.ps1, NPI.ps1
  tests/fixtures/pass, tests/fixtures/fail    the fictional tenant, with and without the problems
  tests/powershell/                      Pester 5: checks, live client, safety (AST), runner
```
