# Microsoft automation reference: Graph and Resource Manager clients, Entra ID, Intune and Azure Arc checks

> **Status: illustrative. Unit-tested against fixtures, not proven against live tenants.**
> This is the example code for the four modules of the [Microsoft Automation learning path](../../docs/training/index.md): [Module 1: Graph and Azure Automation Foundations](../../docs/training/ms-automation-foundations.md), [Module 2: Microsoft Entra ID through Microsoft Graph](../../docs/training/ms-automation-entra.md), [Module 3: Intune through Microsoft Graph](../../docs/training/ms-automation-intune.md) and [Module 4: Azure Arc through Azure Resource Manager and Resource Graph](../../docs/training/ms-automation-arc.md). Every API, permission and limit it relies on was checked against Microsoft Learn: on October 25, 2026 for Modules 1 and 2, on October 30, 2026 for Module 3, and on November 3, 2026 for Module 4, rechecked on November 11, 2026. The pages give the sources. It isn't an endorsement by any agency, and no agency has adopted it.

## What it does

Equivalent Python and PowerShell implementations of five **read-only** Entra ID checks, each tied to the ScubaGear policy it evidences:

| Task | Graph calls | Least-privileged application permissions | Finding |
|---|---|---|---|
| `stale-users` | `GET /users?$select=...,signInActivity&$top=500` | `User.Read.All`, `AuditLog.Read.All` (and Entra ID P1 or P2 for `signInActivity`) | Enabled members with no interactive or non-interactive sign-in in N days (default 90) |
| `ca-export` | `GET /identity/conditionalAccess/policies`, `.../namedLocations` | `Policy.Read.All` | One sorted JSON file per policy, for diffing, plus a summary of state and grant controls |
| `pim-report` | `GET /roleManagement/directory/roleDefinitions`, `roleEligibilitySchedules`, `roleAssignmentSchedules` | `RoleManagement.Read.Directory`, `RoleEligibilitySchedule.Read.Directory`, `RoleAssignmentSchedule.Read.Directory` | MS.AAD.7.1v1 (2 to 8 Global Administrators) and MS.AAD.7.4v1 (no permanent active assignment to a privileged role) |
| `app-credentials` | `GET /applications?$select=...,passwordCredentials,keyCredentials` | `Application.Read.All` | Every secret and certificate, flagged against MS.AAD.5.5v1, 5.6v1 and 5.7v1, plus expired and expiring |
| `mfa-registration` | `GET /reports/authenticationMethods/userRegistrationDetails` | `AuditLog.Read.All` | Members without MFA, without a phishing-resistant method, and administrators without one (toward MS.AAD.3.1v1) |

Equivalent Python and PowerShell implementations of five **read-only** Intune checks (Module 3). They complement the [validation kit](../validation-kit/README.md)'s VK-INT-01 to VK-INT-06, which read Entra device objects, group tags and assignment design, by reading Intune's own records. Each is tied to the federal requirement it evidences (the program's mapping; Module 3 explains it):

| Task | Graph calls | Least-privileged application permissions | Finding | Evidences |
|---|---|---|---|---|
| `noncompliant-devices` | `GET /deviceManagement/managedDevices`, `.../deviceCompliancePolicies` with each policy's `assignments` and `deviceStatuses` | `DeviceManagementManagedDevices.Read.All`, `DeviceManagementConfiguration.Read.All` | Devices in `noncompliant`, `inGracePeriod`, `error` or `conflict`, with the failing policies and grace-period end | NIST SP 800-53 CM-6; OMB M-22-09 device-level signal; supports ScubaGear MS.AAD.3.7v1 |
| `compliance-coverage` | The same | The same | Compliance policies with no assignment or only exclusions; managed devices no policy reports on | CM-2, CM-6; supports MS.AAD.3.7v1 |
| `stale-checkin` | `GET /deviceManagement/managedDevices` | `DeviceManagementManagedDevices.Read.All` | Devices with no Intune sync in the validity period (default 14 days) or the cleanup age (default 90), or no sync at all | CM-8; M-22-09 device inventory |
| `device-posture` | `GET /deviceManagement/managedDevices` | `DeviceManagementManagedDevices.Read.All` | Windows and macOS devices not reporting encryption; devices below the OS floor (default Windows 10.0.26100) | SC-28(1), AC-19(5); SI-2, CM-6 |
| `autopilot-profiles` | `GET /beta/deviceManagement/windowsAutopilotDeviceIdentities` (**beta**) | `DeviceManagementServiceConfig.Read.All` | Registrations whose deployment profile assignment isn't `assignedInSync` | CM-8(1), CM-2 |

No Intune task selects a user's name, email address or user principal name, and none asks for `DeviceManagementManagedDevices.PrivilegedOperations.All`, the permission behind retire, wipe and sync.

Equivalent Python and PowerShell implementations of five **read-only** Azure Arc and Azure Policy checks (Module 4), through Azure Resource Graph. Every one needs only the **Reader** role on the subscriptions or management group in scope: Azure tokens carry no permission list, so Azure RBAC decides at each call. They complement the validation kit's VK-ARC-01 to VK-ARC-07 (tags, agent status and version, baseline compliance per server, CMDB coverage, Update Manager scoping, role assignments, two tools on one setting):

| Task | Resource Graph tables | Role | Finding | Evidences |
|---|---|---|---|---|
| `arc-extensions` | `resources`: `microsoft.hybridcompute/machines` and `.../machines/extensions` | Reader | Servers missing Azure Monitor Agent or Defender for Endpoint (`MDE.Windows`, `MDE.Linux`), and extensions not `Succeeded` | NIST SP 800-53 SI-4, SI-3, AU-12, CM-8 |
| `arc-private-link` | `resources`: machines | Reader | Servers with no Azure Arc private link scope, so they reach Azure over public endpoints | SC-7 |
| `lifecycle` | `resources`: machines and `microsoft.azurearcdata/sqlserverinstances` | Reader | Windows Server and SQL Server versions past, or within 180 days of, the end of support, against `arc-lifecycle.json` | SA-22, SI-2 |
| `sql-inventory` | `resources`: SQL Server instances and machines | Reader | SQL Server instances by version and edition; instances disconnected or whose host isn't a connected Arc machine in scope | CM-8, CM-8(1) |
| `policy-summary` | `policyresources`: `microsoft.authorization/policyassignments` and `microsoft.policyinsights/policystates` | Reader | Per assignment: enforcement mode and compliance counts; `DoNotEnforce` assignments; states for assignments outside the scope | CA-7, CM-6, CM-2 |

No Arc query reads an extension's `settings` or `protectedSettings`, none uses `take` or `limit`, which would stop Resource Graph from paging, and each ends sorted by a unique column (`order by id asc`, or `order by assignmentId asc` for the policy-state summary), as Microsoft's pagination guidance advises, so pages don't repeat or skip rows.

The Python version also has a small Graph client, `python/graphkit.py`, standard library only, that:

- picks the endpoints for the cloud: `gcc` and `global` use `login.microsoftonline.com` and `graph.microsoft.com`; an unknown cloud name is an error, never a default;
- knows the Azure Resource Manager host that goes with them: `management.azure.com` (GCC runs with commercial Azure);
- refuses to send its token to any other host, including an `@odata.nextLink` that points elsewhere;
- makes only the calls `graph-calls.json` declares for the task, and checks the token's `roles` claim against the task's permissions before a live run (missing stops the run; extra is a warning);
- follows `@odata.nextLink`, sending the same headers on every page;
- retries 429, 503 and 504 after `Retry-After` (seconds or an HTTP date), backing off exponentially when the header is missing;
- refuses a `/beta` call that no declared call names, and reads the one beta collection through `try_beta`, so a missing beta shape, or a cloud where the feature isn't offered, gives "not evaluated" instead of a failed run;
- batches at most 20 requests per `$batch`, checking each one and retrying throttled items;
- tracks `@odata.deltaLink`;
- sends `x-ms-throttle-priority: Low`, because these are background jobs.

The Azure Resource Manager client, `python/armkit.py`, also standard library only:

- uses the cloud's Resource Manager host (`management.azure.com` for `gcc` and `global`) and a token for that resource, never a Graph token;
- refuses to send its token to any other host, including a `nextLink` that points elsewhere;
- makes only the calls `arm-calls.json` declares, each with its api-version and the Azure RBAC action it's checked against (Reader covers them all);
- pages Resource Graph with `$skipToken`, repeating the same query and scopes, and raises instead of returning part of a result when Resource Graph reports `resultTruncated` with no token;
- retries 429, 503 and 504 after `Retry-After`, or after Resource Graph's `x-ms-user-quota-resets-after` when there's no `Retry-After`;
- refuses a Resource Graph query with no scope, since an empty scope can't be told from no access.

The PowerShell module, `powershell/FmwGraph.psm1`, uses `Connect-MgGraph -Environment` and `Invoke-MgGraphRequest` from Microsoft Graph PowerShell for the same thing, and reads the same `graph-calls.json` (`Assert-FmwGraphCall`, `Get-FmwCallPermission`, `Test-FmwTokenRole`, `Test-FmwSessionRole`, `Get-FmwBetaCollection`).

The [developer workbook's Chapter 02](../../docs/books/b19-developer-workbook/02-graph-clients-for-government-clouds.md) explains each rule, starting from Microsoft's own Graph SDK snippets, which `examples/third_party/msgraph-snippets-python` pins and `tests/python/test_learn_sample.py` runs against stand-ins.

## Run it

Requires Python 3.10 or later, or PowerShell 7.5 or later.

```text
# Evaluate saved Graph responses (no tenant needed):
python python/entra_tasks.py --from-json tests/fixtures/apps.json --as-of 2026-10-25T00:00:00Z app-credentials

# Against a tenant, as an app with a certificate (pip install azure-identity):
python python/entra_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem stale-users --days 90
```

```powershell
Import-Module ./powershell/FmwGraph.psm1
Connect-FmwGraph -Cloud gcc -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
Invoke-FmwEntraTask -Task pim-report -PrivilegedRoleIds 62e90394-69f5-4237-9190-012177145e10, e8611ab8-c189-46e8-94e1-60213ab1f814
Invoke-FmwIntuneTask -Task device-posture -OsFloors @{ Windows = '10.0.26100' }
```

```text
# Intune checks against saved Graph responses:
python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z stale-checkin

# Against a GCC tenant, with a managed identity:
python python/intune_tasks.py --cloud gcc --tenant <tenant-id> noncompliant-devices
python python/intune_tasks.py --cloud gcc --tenant <tenant-id> device-posture --os-floor Windows=10.0.26100
```

```text
# Arc checks against saved Resource Graph rows:
python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z lifecycle

# Against commercial Azure (a GCC tenant's subscriptions), as an app with a certificate and the Reader role:
python python/arc_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem --subscription <subscription-id> arc-extensions
```

```powershell
Import-Module ./powershell/FmwArm.psm1
Connect-FmwAzure -Cloud gcc -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
Invoke-FmwArcTask -Task lifecycle | ConvertTo-Json -Depth 8
```

**Sign-in.** Both versions sign in as an application, with a certificate or a managed identity. Neither accepts a client secret. Grant only the permissions in the table for the tasks you run; an administrator must consent to application permissions. `pim-report` checks Global Administrator by default; pass the template IDs of the other roles you treat as highly privileged.

## Test it

```text
python -m pytest -q -p no:cacheprovider tests/python
pwsh -NoProfile -Command "Invoke-Pester -Path tests/powershell"
```

The fixtures describe a fictional tenant at `contoso.example`. `tests/fixtures/expected.json` holds the Python results (the Intune results under its `intune` key), and the PowerShell tests compare their own results with it, so the two versions must agree. The Intune fixture, `tests/fixtures/intune.json`, includes a duplicate device name, a device with a placeholder sync date and an Autopilot device in every profile status. The client is tested with a fake transport that covers:

- paging;
- the host check;
- Retry-After waits, and giving up after the retry limit;
- error codes;
- chunks of 20 in `$batch`, with throttled items retried;
- delta links;
- the advanced-query header.

The Arc fixture, `tests/fixtures/arc.json`, is one fictional subscription: seven Arc servers (Windows Server 2012 R2 to 2025, and two Linux), five SQL Server instances and four policy assignments. `tests/fixtures/expected-arc.json` holds the Python results, and `tests/powershell/FmwArm.Tests.ps1` compares the PowerShell results with it. `armkit.py` is tested with a fake transport for `$skipToken` paging, a truncated result, the scope rule, `Retry-After` and the quota-reset header, `nextLink`, the host check and undeclared calls. Two tests guard the read-only claim: every declared call is a read, and the module parses with no Az cmdlet that writes. A test in each language fails if a query isn't sorted by a unique column or uses `take` or `limit`.

Nothing calls the network. The tests prove the code does what this README says against the fixtures. They don't prove that your tenant returns the same shapes.

## Known limits

- **Read-only.** Nothing here writes to a tenant. Changing Conditional Access or PIM needs higher permissions, and belongs in a reviewed pipeline, as Book 04 Chapter 10 describes.
- **Phishing-resistant method names.** Microsoft documents `methodsRegistered` only by example (`mobilePhone`, `email`, `passKeyDeviceBound`). The other names in the list (`windowsHelloForBusiness`, `fido2SecurityKey` and the passkey variants) are Graph's names for those methods in other APIs. Confirm them against your own report before relying on the count.
- **Global Administrator count.** It counts each principal holding the role, eligible or active, once. A group assigned to the role counts as one principal; expand groups if your rule counts people.
- **Sort order.** Both versions sort the same fields, but PowerShell's string comparison is culture-aware and Python's is ordinal. Names that differ only in case or accents may sort differently.
- **Intune compliance status is joined on device name.** `deviceComplianceDeviceStatus` carries `deviceDisplayName`, and Microsoft doesn't document how its `id` relates to the managed device. Both compliance checks flag names held by more than one device.
- **`isEncrypted` is what Intune reports.** It doesn't say which method or volume. Confirm a `notEncrypted` finding in Intune's encryption report.
- **Beta.** `autopilot-profiles` reads `deploymentProfileAssignmentStatus`, which is only in the beta endpoint.
- **No export jobs.** Creating an Intune `reports/exportJobs` job needs a write permission, so the checks page through the list APIs instead.
- **Throttling in PowerShell.** `Invoke-MgGraphRequest` relies on the Graph PowerShell SDK's own retry handling. The PowerShell module doesn't add its own retry loop.
- **The token check reads, it doesn't validate.** `audit_roles` and `Test-FmwTokenRole` decode the `roles` claim of the run's own token as a pre-flight check. They never make an authorization decision. In PowerShell, `Connect-MgGraph` holds the token, so `Test-FmwSessionRole` reads the session's permissions from `Get-MgContext`'s `Scopes`, which in an app-only session holds the token's `roles` claim (Learn, "Use app-only authentication with the Microsoft Graph PowerShell SDK"). `Invoke-FmwEntraTask` and `Invoke-FmwIntuneTask` stop before any call when the session lacks a permission, and warn for each extra one.
- **Arc: an empty result can mean no access.** Resource Graph returns only resources the caller can read, with no error for the rest. Every Arc result that reads machines carries `machinesInScope` and `emptyScope`; treat `emptyScope: true` as "check the role", never as a clean result.
- **Arc: the OS is matched on text.** `lifecycle` matches `osSku`, then `osName`, against the product names in `arc-lifecycle.json`, the order Microsoft's own Resource Graph sample uses. A product not in the table is listed under `notInTable`, never counted as supported. Linux distributions aren't in the table.
- **Arc: SQL Server ESU coverage isn't read.** A SQL Server 2014 or 2016 instance past its extended end date but inside the ESU years is `esuNotConfirmed`; confirm its ESU subscription separately. Windows Server ESU assignment is read from the machine's `licenseProfile`, and counts only inside the ESU years: Windows Server 2012 and 2012 R2 ESUs ended on October 13, 2026. Where two Learn pages give different ESU end dates, `arc-lifecycle.json` uses the earlier one and says so in the row's `esuNote` (SQL Server 2014: July 8, 2027 in the ESU FAQ, July 12, 2027 on the lifecycle page).
- **Arc: Resource Graph isn't strongly consistent.** Microsoft says its data "is indexed with a short latency", so a change made minutes ago may not show yet.

```
examples/ms-automation/
  README.md
  graph-calls.json                every Graph call the tasks make, with permission and stage; both clients read it
  python/graphkit.py              Graph client: clouds, calls, paging, retry, beta, batch, delta
  python/entra_tasks.py           the five Entra ID checks and a command line
  python/intune_tasks.py          the five Intune checks and a command line
  arm-calls.json                  every Resource Manager call the Arc tasks make, with api-version and RBAC action
  arc-lifecycle.json              Windows Server and SQL Server support end dates, from Microsoft's lifecycle pages
  python/armkit.py                Resource Manager client: clouds, calls, Resource Graph paging, retry
  python/arc_tasks.py             the five Azure Arc and Azure Policy checks and a command line
  powershell/FmwGraph.psm1        the same Entra ID and Intune checks for Microsoft Graph PowerShell
  powershell/FmwArm.psm1          the same Arc checks for Az PowerShell (Az.Accounts, Az.ResourceGraph)
  tests/fixtures/                 fictional tenant data, expected.json and expected-arc.json
  tests/python/                   pytest
  tests/powershell/               Pester 5
```
