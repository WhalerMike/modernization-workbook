# Privileged access as code

Read-only code for the [developer workbook *Building Privileged Access*](../../docs/project-plans/developer-workbooks/privileged-access/index.md), the code-first companion to the [Privileged Access & Administrative Identity project plan](../../docs/project-plans/privileged-access.md) and [Book 04](../../docs/books/b04-access/index.md).

- **Chapter 01, the privileged inventory:** Microsoft Entra role assignments (active and eligible), role-assignable groups expanded to their members, and Azure role assignment and eligibility schedules, each row given a tier from `config/tiers.json`, with findings PA-INV-01 to PA-INV-09.
- **Chapter 02, the emergency access accounts:** the accounts checked against Learn's standard and Book 04's (findings PA-EA-01 to PA-EA-10), and the alert on their use written as an ARM template for review.

Illustrative: tested against fixtures and a fake Graph and Resource Manager, not proven against a production tenant. Every call is a GET. Nothing here writes to a tenant or deploys anything.

## Start with Microsoft's samples

Learn publishes the samples these chapters start from inside two pages, pinned unmodified in [`../third_party/entra-role-assignments-page`](../third_party/entra-role-assignments-page/SNAPSHOT.md) and [`../third_party/entra-emergency-access-page`](../third_party/entra-emergency-access-page/SNAPSHOT.md). `tests/MicrosoftSamples.Tests.ps1` runs them offline and pins what they do and leave out. The chapters' gap tables cite those tests.

## Layout

```
Invoke-PaInventory.ps1                      Chapter 01: read, classify, find, write the run with a manifest
Invoke-PaEmergencyCheck.ps1                 Chapter 02: check the accounts, write the alert template
config/calls.json                           every call: GET, version, path, least-privileged permission or Azure role, Learn page
config/tiers.json                           the program's tiers (Design guidance): Entra template IDs, Azure built-in roles
powershell/PrivilegedAccess/                the module: clouds, the reader, the fake, the inventory, the emergency check
tests/MicrosoftSamples.Tests.ps1            Pester 5: Learn's samples, run as published
tests/PrivilegedInventory.Tests.ps1         Pester 5: Chapter 01
tests/EmergencyAccess.Tests.ps1             Pester 5: Chapter 02
tests/LearnSampleHarness.ps1                extracts and runs the pinned samples against stand-ins
tests/fixtures/tenant.json                  a fictional tenant (contoso.example)
tests/fixtures/signin-export.json           fictional exported sign-in and audit rows
tests/fixtures/inputs/                      exceptions.csv, emergency-access.json, emergency-validations.csv
```

## Permissions

Grant only what the task you run needs; `Get-PaRequiredPermission -Task inventory` (or `emergency-access`) prints them. The Learn page for each call is in `config/calls.json`; the pages were read on October 30, 2026.

| Task | Microsoft Graph (application, or delegated with the role shown) | Azure |
|---|---|---|
| `inventory` | `RoleManagement.Read.Directory`, `RoleAssignmentSchedule.Read.Directory`, `RoleEligibilitySchedule.Read.Directory`, `GroupMember.ReadBasic.All`, `User.ReadBasic.All`; delegated: Global Reader | Reader on each scope listed |
| `emergency-access` | `User.Read.All`, `UserAuthenticationMethod.Read.All`, `RoleAssignmentSchedule.Read.Directory`, `GroupMember.ReadBasic.All`, `User.ReadBasic.All`, `Policy.Read.All`; delegated: Global Reader | none |

## Clouds

`-Cloud gcc` (the default) uses the worldwide endpoints, `graph.microsoft.com` and commercial `management.azure.com`, as Microsoft 365 GCC with commercial Azure does. `gcchigh` and `dod` use `graph.microsoft.us` and `dod-graph.microsoft.us` with Azure Government's `management.usgovcloudapi.net`. Any other name throws; there is no default. The live invoker refuses to run if the Graph or Azure session is signed in to another cloud.

## Run the tests

```powershell
Invoke-Pester -Path tests
```

PowerShell 7.1 or later and Pester 5. No module, tenant or network is needed.
