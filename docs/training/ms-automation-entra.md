---
title: "Microsoft Automation, Module 2: Microsoft Entra ID through Microsoft Graph"
subtitle: "Learn the Graph APIs, least-privileged permissions and data shapes behind users, groups, Conditional Access, PIM, applications, logs and authentication methods, then run five read-only checks mapped to ScubaGear on fixtures and in your test tenant"
description: "Research draft: Module 2 of the Microsoft Automation learning path, for Books 02 and 04. You learn users and sign-in activity, groups and membership, Conditional Access policies and named locations, PIM eligibility and assignment schedules, applications and their credentials, consent grants, audit and sign-in logs and their retention, authentication-method registration, risky users and what differs in US Government clouds. Lab 1 runs five read-only checks in Python and PowerShell against fixtures; Lab 2 runs them read-only against your test tenant."
research-status: draft
research-type: training module
research-book: "Books 02, 04"
series-order: 2
date-modified: 2026-11-01
last-reviewed: 2026-11-01
aliases:
  - /docs/research/ms-automation-entra.html
---

# Microsoft Automation, Module 2: Microsoft Entra ID through Microsoft Graph {.unnumbered}

**Learning path:** [Microsoft Automation](index.md#microsoft-automation-learning-path) · Module 2 of 3 · 95 minutes · Code: [examples/ms-automation](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation) (`entra_tasks.py`, `FmwGraph.psm1`)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.1/Training_MS_Automation_Module_2.pptx) · [Narrated deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.1/Training_MS_Automation_Module_2_Narrated.pptx) (about 13 minutes, captions) · [▶ Watch](../presentations/watch.html?v=Training_MS_Automation_Module_2_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_MS_Automation_Module_2_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-ms-automation-module-2/Training_MS_Automation_Module_2_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-ms-automation-module-2/Training_MS_Automation_Module_2_Narrated.vtt).

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

[Book 02](../books/b02-identity/index.md) builds the Entra ID target, and [Book 04](../books/b04-access/index.md) puts access behind Conditional Access, PIM and application governance. Both ask for evidence a script can collect: who hasn't signed in, what the Conditional Access policies say, who holds a privileged role permanently, which applications still have passwords, and who can't yet use phishing-resistant MFA.

Your ISSO asks for those answers every month, and today someone gets them by clicking through the admin center and pasting screenshots. In this module you map each question to the Graph API that answers it, the least-privileged permission, and the shape of the data. Five of them are built as tested, read-only checks, in Python and PowerShell, which you run in the labs. They're **illustrative: unit-tested against fixtures, not proven against live tenants**.

**The federal requirement.** BOD 25-01 makes ScubaGear's mandatory Entra ID policies required for in-scope tenants, with continuous reporting to CISA. Four of the checks produce evidence for those policies: Conditional Access settings (MS.AAD.1.1v1, 2.1v1, 2.3v1, 3.1v1 and 3.6v1), the Global Administrator count (MS.AAD.7.1v1), permanent active privileged assignments (MS.AAD.7.4v1) and phishing-resistant registration (toward MS.AAD.3.1v1 and 3.6v1). The application-credential check reads MS.AAD.5.5v1 to 5.7v1, and the stale-user check supports Book 02's account lifecycle. In NIST SP 800-53 terms that's account management (AC-2), least privilege for privileged accounts (AC-6(5)), multifactor authentication (IA-2(1), IA-2(2)) and continuous monitoring (CA-7). Don't restate them: which policies are mandatory, and the control mapping, are in [Book 02, Appendix A](../books/b02-identity/appendix-a-federal-requirements-crosswalk.md#cisa-bod-25-01-and-the-scuba-baselines), and OMB M-22-09's phishing-resistant requirement is in its [M-22-09 section](../books/b02-identity/appendix-a-federal-requirements-crosswalk.md#omb-m-22-09).

### Learning objectives

In this module, you'll:

- Name the Graph API and least-privileged application permission for each of Book 02's and Book 04's evidence questions.
- Read sign-in activity, group membership, Conditional Access state, PIM schedules, application credentials and registration details, and the traps in each.
- Explain why Entra ID's own log retention means a script checks logs but doesn't keep them.
- Say which Entra ID features differ in GCC High and DoD, and why the table doesn't apply to GCC.
- Run the five checks on fixtures in Python and PowerShell, and read each finding against its ScubaGear policy.

### Prerequisites

- [Module 1](ms-automation-foundations.md): the right cloud's endpoints, app-only sign-in without a secret, paging, throttling and batching.
- For Lab 1: the [lab tools](index.md#what-you-need-for-the-microsoft-automation-labs). No tenant until Lab 2.

## Unit 2: The APIs at a glance

*8 minutes*

Every API below is generally available in Graph v1.0. Each one's reference page lists it as available in the global service (which GCC uses), US Government L4 (GCC High) and L5 (DoD).[^m2-cloudtables] The permission is the least-privileged *application* permission the page lists. The Book column is where the workbook uses it.

| Question | Graph API (v1.0) | Least-privileged application permission | Book |
|---|---|---|---|
| Who is in the directory, and when did they last sign in? | `GET /users` with `$select=...,signInActivity` | `User.Read.All`, plus `AuditLog.Read.All` for `signInActivity`[^m2-userlist] | B02 Ch 10 |
| What changed since the last run? | `GET /users/delta` | `User.Read.All`[^m2-userdelta] | B02 Ch 10 |
| Who is in a group, including nested groups? | `GET /groups/{id}/transitiveMembers` | `GroupMember.ReadBasic.All`[^m2-transitive] | B04 Ch 07 |
| What do the Conditional Access policies say? | `GET /identity/conditionalAccess/policies` and `/namedLocations` | `Policy.Read.All`[^m2-calist][^m2-nlist] | B04 Ch 07, 10 |
| Create or change a Conditional Access policy | `POST /identity/conditionalAccess/policies` | `Policy.Read.All` and `Policy.ReadWrite.ConditionalAccess`[^m2-capost] | B04 Ch 10 |
| Who is eligible for a privileged role? | `GET /roleManagement/directory/roleEligibilitySchedules` | `RoleEligibilitySchedule.Read.Directory`[^m2-elig] | B04 Ch 08 |
| Who holds a role now, and until when? | `GET /roleManagement/directory/roleAssignmentSchedules` | `RoleAssignmentSchedule.Read.Directory`[^m2-assign] | B04 Ch 08 |
| What are a role's PIM settings? | `GET /policies/roleManagementPolicyAssignments` | `RoleManagementPolicy.Read.Directory`[^m2-rolepolicy] | B04 App B |
| Which applications have passwords or certificates, and when do they expire? | `GET /applications` with `$select=...,passwordCredentials,keyCredentials` | `Application.Read.All`[^m2-applist] | B04 Ch 05 |
| Who has been given an application's roles? | `GET /servicePrincipals/{id}/appRoleAssignedTo` | `Application.Read.All`[^m2-approle] | B04 Ch 05 |
| Which delegated permissions have been consented? | `GET /oauth2PermissionGrants` | `Directory.Read.All`[^m2-oauth] | B04 Ch 05 |
| What happened in the directory? | `GET /auditLogs/directoryAudits` | `AuditLog.Read.All`[^m2-audit] | B15 Ch 08 |
| Who signed in, and which policies applied? | `GET /auditLogs/signIns` | `AuditLog.Read.All`[^m2-signins] | B15 Ch 08 |
| Who has registered which authentication methods? | `GET /reports/authenticationMethods/userRegistrationDetails` | `AuditLog.Read.All`[^m2-regdetails] | B04 Ch 07 |
| Which methods does the tenant allow? | `GET /policies/authenticationMethodsPolicy` | `Policy.Read.AuthenticationMethod`[^m2-ampolicy] | B02 Ch 09 |
| Who does ID Protection consider risky? | `GET /identityProtection/riskyUsers` | `IdentityRiskyUser.Read.All`[^m2-risky] | B04 Ch 03 |

## Unit 3: Users, groups and Conditional Access

*12 minutes*

### Users and sign-in activity

`signInActivity` is how a script finds dormant accounts. It holds `lastSignInDateTime` (interactive) and `lastNonInteractiveSignInDateTime`. Microsoft notes that some users reach resources only through clients, so the non-interactive date belongs in any inactivity check alongside the interactive one.[^m2-signinact] Three constraints:

- **License and permission.** Details for `signInActivity` require Microsoft Entra ID P1 or P2 and the `AuditLog.Read.All` permission.[^m2-userlist]
- **Page size.** Selecting or filtering on `signInActivity` caps the page at 500 users, against 999 otherwise.[^m2-userlist]
- **It must be selected.** The property is returned only when it's named in `$select`.[^m2-userres]

For change tracking, `/users/delta` follows the Module 1 pattern. Any query parameter other than `$deltatoken` and `$skiptoken` has to be in the first delta request, and Graph carries it in the links that follow.[^m2-userdelta]

### Groups and membership

Use `transitiveMembers` when the question is who is effectively in a group, nested groups included; `members` returns only direct members. Which features honor nested membership varies by feature, so check each feature's documentation before assuming either way *(design guidance)*. The transitive call costs 5 resource units against 3 for direct `members` ([Module 1](ms-automation-foundations.md#four-request-patterns)). `GroupMember.ReadBasic.All` is enough to read membership. Members of a type the app has no permission to read come back with only `id` and `@odata.type`.[^m2-transitive]

### Conditional Access

Reading needs only `Policy.Read.All`.[^m2-calist] Each policy's `state` is `enabled`, `disabled` or `enabledForReportingButNotEnforced`, the last being report-only.[^m2-caov] Book 04's rollout depends on knowing which policies are report-only. CA022, phishing-resistant MFA for everyone, starts that way.

Creating a policy needs `Policy.Read.All` and `Policy.ReadWrite.ConditionalAccess`. Microsoft notes "a known permissions issue" that may need consent to more permissions. For a person signing in, the least-privileged roles are Conditional Access Administrator and Security Administrator.[^m2-capost] Book 04 Chapter 10 keeps the policies as code. Here that means a pipeline holds the write permission, and the evidence collector holds only the read *(design guidance)*.

The `ca-export` check writes one JSON file per policy with sorted keys, so a policy change shows up as a readable diff between two exports.

## Unit 4: Privileged Identity Management and applications

*12 minutes*

### Privileged Identity Management

The current PIM APIs are under `/roleManagement/directory`.[^m2-pim] Two kinds of schedule matter:

- **Eligibility schedules** (`roleEligibilitySchedules`): who may activate a role.[^m2-elig]
- **Assignment schedules** (`roleAssignmentSchedules`): who holds it now. `assignmentType` is `Assigned` for a direct assignment and `Activated` for an activation. `memberType` says whether the assignment is `Direct`, through a `Group`, or `Inherited`.[^m2-rasched]

An assignment's end is in `scheduleInfo.expiration`. Its `type` is `notSpecified`, `noExpiration`, `afterDateTime` or `afterDuration`.[^m2-exp] An `Assigned` schedule with no expiration is **permanent active**, which is what ScubaGear MS.AAD.7.4v1 forbids for highly privileged roles.

Changes go through schedule requests (`roleAssignmentScheduleRequests`), whose `action` is one of the following:[^m2-assignreq]

- an administrator's `adminAssign`, `adminUpdate`, `adminRemove`, `adminExtend` or `adminRenew`;
- a user's `selfActivate`, `selfDeactivate`, `selfExtend` or `selfRenew`.

Writes need `RoleAssignmentSchedule.ReadWrite.Directory`. For a signed-in person, the least-privileged role for writes is Privileged Role Administrator.[^m2-assignreq] Microsoft describes PIM as "a feature of Microsoft Entra ID Governance".[^m2-pim] Role IDs are stable built-in template IDs: Global Administrator is `62e90394-69f5-4237-9190-012177145e10` and Privileged Role Administrator is `e8611ab8-c189-46e8-94e1-60213ab1f814`.[^m2-roles]

### Applications and their credentials

An application object's `passwordCredentials` (secrets) and `keyCredentials` (certificates) each carry `startDateTime` and `endDateTime`, in UTC.[^m2-pwcred][^m2-keycred] Those dates are enough to test ScubaGear's three application rules:[^m2-scuba]

- no application passwords (MS.AAD.5.5v1);
- passwords valid for at most 180 days (MS.AAD.5.6v1);
- certificates valid for at most 365 days (MS.AAD.5.7v1).

Microsoft's [app management policies](../reference/graph-practice-crosswalk.md#entra-id) enforce the same limits going forward. The check finds what existed before they were turned on.

Two related reads for consent review ([Book 04, Chapter 05](../books/b04-access/05-applications-and-workload-identities.md)):

- `appRoleAssignedTo` on a service principal shows who has been given the application's roles.[^m2-approle]
- `oauth2PermissionGrants` lists delegated permission grants. Its least-privileged read permission is `Directory.Read.All`.[^m2-oauth]

## Unit 5: Logs and authentication methods

*8 minutes*

### Logs and retention

Directory audits and sign-ins both need `AuditLog.Read.All`.[^m2-audit][^m2-signins] A sign-in's `appliedConditionalAccessPolicies` is filled in only for callers allowed to read Conditional Access data. A log reader without that permission sees sign-ins but not which policies applied.[^m2-signins]

Entra ID keeps **audit logs and sign-ins for seven days on the Free tier and 30 days with P1 or P2**.[^m2-retention] That's why ScubaGear MS.AAD.4.1v1 requires sending the logs to the security operations center, as the [crosswalk](../reference/graph-practice-crosswalk.md#entra-id) notes. A Graph script is a way to *check* logs, not to keep them.

### Authentication methods

`userRegistrationDetails` gives one row per user with `isMfaRegistered`, `isPasswordlessCapable`, `isAdmin`, `userType` (`member` or `guest`) and `methodsRegistered`.[^m2-regres] It's the quickest way to track progress toward ScubaGear MS.AAD.3.1v1, phishing-resistant MFA for all users.

One caution. Microsoft documents `methodsRegistered` only by example: "mobilePhone, email, passKeyDeviceBound".[^m2-regres] A check that counts phishing-resistant users has to choose which method names to count, and should be confirmed against a real report *(inference)*. The example code keeps that list in one place for that reason.

Reading one user's registered methods needs `UserAuthenticationMethod.Read.All`. That API isn't available in the China cloud, though it is in GCC High and DoD.[^m2-authmethods] The tenant's allowed methods come from the authentication methods policy, which needs `Policy.Read.AuthenticationMethod`.[^m2-ampolicy]

## Unit 6: Where agencies are

*6 minutes*

**The starting state.** Most agencies on this path run a Microsoft 365 GCC tenant, synchronized from Active Directory, with Conditional Access in place and some policies still report-only, permanent role assignments left from before PIM, and applications that still hold client secrets. Some run GCC High. [Book 02, Appendix A](../books/b02-identity/appendix-a-federal-requirements-crosswalk.md#filter-1-government-cloud-availability) filters every identity control by government-cloud availability, licensing and Active Directory friction.

**What differs in US Government clouds.** The APIs in [Unit 2](#unit-2-the-apis-at-a-glance) are the same in GCC High and DoD. The endpoints differ ([Module 1](ms-automation-foundations.md#clouds-and-endpoints)), and so do some features. Microsoft's US Government feature table for Entra ID, as of January 2026, lists:[^m2-govfeatures]

- **Available:**
  - Conditional Access;
  - PIM;
  - access reviews;
  - entitlement management;
  - Lifecycle Workflows;
  - ID Protection's risky-account reports.
- **Partial:** HR-driven provisioning, which depends on the HR app.
- **Not available:**
  - the My Staff delegated user management portal;
  - the *Microsoft Entra threat intelligence* risk detection.

A GCC tenant uses the commercial Entra ID service, so this table doesn't apply to it.

One Conditional Access difference matters for the export. Multifactor authentication's Trusted IPs feature isn't supported in Azure Government; Microsoft's guidance is to use Conditional Access policies with named locations instead.[^m2-trustedips] In a GCC High or DoD tenant, then, the named locations that `ca-export` writes are where network-based MFA exceptions live.

**Interim paths** *(design guidance)*:

- **Phishing-resistant MFA isn't enforced for everyone yet.** Run `mfa-registration` on a schedule and keep CA022 report-only until the counts say it's safe, as Book 04 rolls it out; Book 02's appendix covers the alternative MFA policy required in the meantime.
- **Permanent privileged assignments remain.** `pim-report` lists them; move each one to eligible in PIM through the change process, and run the report again to show it.
- **Applications still have secrets.** `app-credentials` lists them with their lifetimes; replace each with a certificate or federated credential ([Module 1](ms-automation-foundations.md#signing-in-as-a-workload)), then turn on app management policies.
- **Logs aren't leaving Entra ID yet.** Treat that as the first fix: the retention window above is the evidence you lose each day.

## Unit 7: The five checks {#the-five-checks}

*5 minutes*

Each check is read-only and tied to the ScubaGear policy it evidences. The Python and PowerShell versions produce the same results for the same fixtures.

| Check | What it reports | ScubaGear |
|---|---|---|
| `stale-users` | Enabled members with no interactive or non-interactive sign-in in 90 days; never-signed-in accounts older than 90 days | Supports Book 02's account lifecycle (no ScubaGear policy) |
| `ca-export` | Every policy as sorted JSON, plus counts of enabled, report-only and disabled | Evidence for MS.AAD.1.1v1, 2.1v1, 2.3v1, 3.1v1 and 3.6v1 settings |
| `pim-report` | Global Administrator count; every permanent active assignment to a role you name as privileged | MS.AAD.7.1v1, MS.AAD.7.4v1 |
| `app-credentials` | Every secret and certificate with its lifetime and days to expiry | MS.AAD.5.5v1, 5.6v1, 5.7v1 |
| `mfa-registration` | Members without MFA, without a phishing-resistant method, and administrators without one | Toward MS.AAD.3.1v1 and 3.6v1 |

The permissions for all five together are:

- `User.Read.All`, `AuditLog.Read.All` and `Policy.Read.All`;
- `RoleManagement.Read.Directory`, `RoleEligibilitySchedule.Read.Directory` and `RoleAssignmentSchedule.Read.Directory`;
- `Application.Read.All`.

That's a reader's set: none of them can change the tenant. Grant only the ones for the checks you run.

## Unit 8: Exercise: Lab 1 (fixtures, no tenant)

*25 minutes*

You run each check against the kit's fictional tenant and read each finding against its policy. Work in `examples/ms-automation`. `--from-json` evaluates a saved Graph response instead of calling Graph, and `--as-of` fixes the evaluation time so your output matches this page.

1. Find the stale accounts.

   ```bash
   python python/entra_tasks.py --from-json tests/fixtures/users.json --as-of 2026-10-25T00:00:00Z stale-users
   ```

   Expected output:

   ```text
   [
     {
       "id": "u3",
       "userPrincipalName": "cy@contoso.example",
       "lastSignIn": null,
       "daysIdle": null
     },
     {
       "id": "u2",
       "userPrincipalName": "ben@contoso.example",
       "lastSignIn": "2026-07-01T00:00:00Z",
       "daysIdle": 116
     },
     {
       "id": "u7",
       "userPrincipalName": "fay@contoso.example",
       "lastSignIn": "2026-07-27T00:00:00Z",
       "daysIdle": 90
     }
   ]
   ```

   `cy` has never signed in and is older than 90 days. Open `tests/fixtures/users.json`: `ben`'s interactive sign-in was May 1, but his `lastSignIn` is July 1, his non-interactive date, because the check uses the later of the two. `dee` has never signed in either, but her account is less than 90 days old; `eve` is disabled; and the guest isn't a member. None of them is listed.

2. Export Conditional Access.

   ```bash
   python python/entra_tasks.py --from-json tests/fixtures/ca.json ca-export --out out/ca
   ```

   The summary lists three policies and ends with the counts:

   ```text
     "counts": {
       "enabled": 1,
       "enabledForReportingButNotEnforced": 1,
       "disabled": 1
     }
   ```

   CA022, phishing-resistant MFA for all users, shows `"reportOnly": true`. The folder `out/ca` now holds `named-locations.json`, `p-legacy.json`, `p-old.json` and `p-pr.json`: one sorted file per policy, ready to diff.

3. Report privileged assignments for Global Administrator and Privileged Role Administrator.

   ```bash
   python python/entra_tasks.py --from-json tests/fixtures/pim.json pim-report --role e8611ab8-c189-46e8-94e1-60213ab1f814
   ```

   Expected output:

   ```text
   {
     "globalAdministrators": 3,
     "MS.AAD.7.1v1": "pass",
     "permanentActive": [
       {
         "principalId": "bg1",
         "roleDefinitionId": "62e90394-69f5-4237-9190-012177145e10",
         "role": "Global Administrator",
         "memberType": "Direct"
       },
       {
         "principalId": "x9",
         "roleDefinitionId": "e8611ab8-c189-46e8-94e1-60213ab1f814",
         "role": "Privileged Role Administrator",
         "memberType": "Direct"
       }
     ],
     "MS.AAD.7.4v1": "fail"
   }
   ```

   Global Administrator is always in the list; `--role` adds Privileged Role Administrator. Three Global Administrators is within two to eight, so 7.1 passes; two permanent active assignments fail 7.4.

4. Check application credentials.

   ```bash
   python python/entra_tasks.py --from-json tests/fixtures/apps.json --as-of 2026-10-25T00:00:00Z app-credentials
   ```

   Expected: five credentials, most urgent first. The first is `Legacy report`'s password `k4`, with `"lifetimeDays": 92`, `"daysLeft": -54` and the flags `MS.AAD.5.5v1` and `expired`. `HR connector`'s password `k1` (365 days) carries `MS.AAD.5.5v1` and `MS.AAD.5.6v1`. Two certificates carry `MS.AAD.5.7v1`: `k3` (374 days, also `expiring`) and `k5` (1,827 days). Only certificate `k2`, 365 days, has no flag.

5. Check MFA registration.

   ```bash
   python python/entra_tasks.py --from-json tests/fixtures/mfa.json --as-of 2026-10-25T00:00:00Z mfa-registration
   ```

   Expected output:

   ```text
   {
     "members": 4,
     "notMfaRegistered": 1,
     "noPhishingResistantMethod": 2,
     "admins": 2,
     "adminsNoPhishingResistantMethod": [
       "ben@contoso.example"
     ]
   }
   ```

   Guests aren't counted as members. `ben` is an administrator without a phishing-resistant method: a finding against MS.AAD.3.6v1.

6. Run two of the same checks in PowerShell. Start `pwsh` in `examples/ms-automation`, then:

   ```powershell
   Import-Module ./powershell/FmwGraph.psm1
   $d = Get-Content -Raw tests/fixtures/pim.json | ConvertFrom-Json -AsHashtable -DateKind String
   Test-FmwPim -RoleDefinitions $d.roleDefinitions -Eligibility $d.eligibility -Assignments $d.assignments -PrivilegedRoleIds 62e90394-69f5-4237-9190-012177145e10, e8611ab8-c189-46e8-94e1-60213ab1f814 | ConvertTo-Json -Depth 5
   $u = Get-Content -Raw tests/fixtures/users.json | ConvertFrom-Json -AsHashtable -DateKind String
   Test-FmwStaleUser -Users $u.users -AsOf '2026-10-25T00:00:00Z' -Days 90 | ConvertTo-Json
   ```

   Expected: the same JSON as steps 3 and 1. The Pester tests compare every PowerShell check with the Python results in `tests/fixtures/expected.json`, so the two versions can't drift apart.

7. Run the Entra ID tests, then delete the `out` folder.

   ```bash
   python -m pytest -q -p no:cacheprovider tests/python/test_graphkit_and_tasks.py
   ```

   Expected: `20 passed`.

**Check your work:** for each finding, you can name the ScubaGear policy it evidences and the Graph property it came from.

## Unit 9: Exercise: Lab 2 (your test tenant)

*Not timed. Not run by the authors.*

You run the same checks read-only against a test tenant and compare them with the Microsoft Entra admin center.

- **You need:** a test tenant in the worldwide or GCC cloud, never production, with fictional users; Microsoft Entra ID P1 or P2 for `signInActivity` and PIM data as [Unit 3](#users-and-sign-in-activity) notes; a Privileged Role Administrator to grant admin consent ([Module 1](ms-automation-foundations.md#signing-in-as-a-workload)); Python with `pip install azure-identity`, or Microsoft Graph PowerShell.

1. **Register one app** in the tenant's own cloud, with a certificate credential and no secret.
2. **Grant only the application permissions for the checks you run**, and admin consent:

   | Check | Permissions |
   |---|---|
   | `stale-users` | `User.Read.All`, `AuditLog.Read.All` |
   | `ca-export` | `Policy.Read.All` |
   | `pim-report` | `RoleManagement.Read.Directory`, `RoleEligibilitySchedule.Read.Directory`, `RoleAssignmentSchedule.Read.Directory` |
   | `app-credentials` | `Application.Read.All` |
   | `mfa-registration` | `AuditLog.Read.All` |

   These are the lists `permissions_for(load_calls('<task>'))` prints from `graph-calls.json`.
3. **Run the checks.** In Python: `python python/entra_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem pim-report`, and the same for each task (`ca-export` needs `--out <folder>`). The client checks the token's permissions first: a missing one stops the run before any Graph call, and an extra one prints a warning. In PowerShell: `Connect-FmwGraph -Cloud gcc -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>`, then `Invoke-FmwEntraTask -Task pim-report`.
4. **Compare** each result with the admin center: the Global Administrator count and permanent assignments in PIM, the policy states in Conditional Access, and the credentials under App registrations. Record which method names your tenant's registration report uses ([Unit 5](#authentication-methods)).
5. **Back it out.** Remove the permissions, delete the app registration and its certificate, and delete the output folders and saved results: they hold the tenant's user names and policies.

## Unit 10: Knowledge check

*5 minutes*

1. A user's interactive sign-in was 120 days ago, but a client signed in for them non-interactively last week. Does `stale-users` report them?
   a. Yes: the interactive sign-in is older than 90 days.
   b. No: the check uses the later of the two dates.
   c. Only if the account was created in the last 90 days.

2. A role assignment schedule has `assignmentType` `Assigned` and an expiration `type` of `noExpiration`. What is it?
   a. An eligible assignment.
   b. A permanent active assignment, which MS.AAD.7.4v1 forbids for highly privileged roles.
   c. An activation that ends after its duration.

3. Why doesn't a Graph script replace sending the logs to the security operations center?
   a. Entra ID keeps audit and sign-in logs for at most 30 days, with P1 or P2.
   b. Graph can't read sign-in logs.
   c. `AuditLog.Read.All` can't be granted to an app.

4. Which least-privileged application permission does `ca-export` need?
   a. `Policy.ReadWrite.ConditionalAccess`
   b. `Directory.Read.All`
   c. `Policy.Read.All`

5. Your tenant is GCC High. Where should network-based MFA exceptions live?
   a. In MFA's Trusted IPs setting.
   b. In Conditional Access named locations, because Trusted IPs isn't supported in Azure Government.
   c. Nowhere: GCC High doesn't support Conditional Access.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Microsoft notes that some users reach resources only through clients, so the check uses both dates. See [Users and sign-in activity](#users-and-sign-in-activity), and `ben` in Lab 1, step 1.
2. **b.** An `Assigned` schedule with no expiration is permanent active. See [Privileged Identity Management](#privileged-identity-management).
3. **a.** Seven days on Free and 30 with P1 or P2; that's why MS.AAD.4.1v1 sends logs to the SOC. See [Logs and retention](#logs-and-retention).
4. **c.** Reading needs only `Policy.Read.All`; writing belongs in a pipeline. See [Conditional Access](#conditional-access).
5. **b.** Microsoft's guidance for Azure Government is named locations in Conditional Access, which is available there. See [Unit 6: Where agencies are](#unit-6-where-agencies-are).
:::

## Unit 11: Summary

*3 minutes*

You mapped Book 02's and Book 04's evidence questions to Graph APIs and their least-privileged permissions, learned the traps in sign-in activity, group membership, PIM schedules, credentials and registration details, and saw what differs in GCC High and DoD. In Lab 1 you ran the five checks on fixtures in Python and PowerShell and read each finding against its ScubaGear policy.

**Evidence an ISSO keeps from this module:** each check's dated output, with the app's permissions and consent record; the `ca-export` folder in Git, so every policy change is a diff; the PIM and application-credential findings with the change records that closed them; and the ScubaGear results beside them for the policies BOD 25-01 makes mandatory, as [Book 02, Appendix A](../books/b02-identity/appendix-a-federal-requirements-crosswalk.md#cisa-bod-25-01-and-the-scuba-baselines) lists them. [Book 04, Chapter 10](../books/b04-access/10-access-as-code-and-evidence.md#the-evidence-package-for-a-period) assembles the package for a period.

::: {.callout-tip}
## Continue the path
[Previous: Module 1](ms-automation-foundations.md) · [Learning path](index.md#microsoft-automation-learning-path) · [Next: Module 3, Intune through Microsoft Graph →](ms-automation-intune.md)
:::

## Status and review

**Draft.** Every API, permission, property and limit was checked against Microsoft Learn and the ScubaGear baseline on October 25, 2026. The Trusted IPs difference in Azure Government was added on November 1, 2026 with its own source. Inferences and design guidance are labeled. The checks are tested against fixtures only, and the Lab 1 commands were run on November 1, 2026; the output shown is what they printed. The [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/training/_verification/ms-automation-entra.md) lists the November 1 additions.

To move this page to **In review**:
- a reviewer confirms the permissions table;
- someone runs the five checks against a test tenant and compares the results with the Entra admin center.

To move it to **Proved**: record that comparison here, including which method names your tenant's registration report uses. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Module 1: Foundations](ms-automation-foundations.md), the [Microsoft practice crosswalk](../reference/graph-practice-crosswalk.md), [Book 02 — Identity & Directory](../books/b02-identity/index.md) and [Book 04 — Access & Privilege](../books/b04-access/index.md).

[^m2-cloudtables]: The national cloud deployment table on each API's Microsoft Graph v1.0 reference page, cited for each API below, accessed October 25, 2026.
[^m2-userlist]: Microsoft Learn, "List users" (updated May 16, 2025), <https://learn.microsoft.com/en-us/graph/api/user-list>, accessed October 25, 2026.
[^m2-userdelta]: Microsoft Learn, "user: delta" (updated October 22, 2024), <https://learn.microsoft.com/en-us/graph/api/user-delta>, accessed October 25, 2026.
[^m2-userres]: Microsoft Learn, "user resource type" (signInActivity; updated January 10, 2025), <https://learn.microsoft.com/en-us/graph/api/resources/user>, accessed October 25, 2026.
[^m2-signinact]: Microsoft Learn, "signInActivity resource type" (updated July 22, 2024), <https://learn.microsoft.com/en-us/graph/api/resources/signinactivity>, accessed October 25, 2026.
[^m2-transitive]: Microsoft Learn, "List group transitive members" (updated May 20, 2024), <https://learn.microsoft.com/en-us/graph/api/group-list-transitivemembers>, accessed October 25, 2026.
[^m2-calist]: Microsoft Learn, "List policies" (Conditional Access; updated October 17, 2024), <https://learn.microsoft.com/en-us/graph/api/conditionalaccessroot-list-policies>, accessed October 25, 2026.
[^m2-nlist]: Microsoft Learn, "List namedLocations" (updated October 17, 2024), <https://learn.microsoft.com/en-us/graph/api/conditionalaccessroot-list-namedlocations>, accessed October 25, 2026.
[^m2-capost]: Microsoft Learn, "Create conditionalAccessPolicy" (updated October 17, 2024), <https://learn.microsoft.com/en-us/graph/api/conditionalaccessroot-post-policies>, accessed October 25, 2026.
[^m2-caov]: Microsoft Learn, "conditionalAccessPolicy resource type" (updated July 22, 2024), <https://learn.microsoft.com/en-us/graph/api/resources/conditionalaccesspolicy>, accessed October 25, 2026.
[^m2-pim]: Microsoft Learn, "Manage Microsoft Entra role assignments using the PIM APIs" (updated August 29, 2025), <https://learn.microsoft.com/en-us/graph/api/resources/privilegedidentitymanagementv3-overview>, accessed October 25, 2026.
[^m2-elig]: Microsoft Learn, "List roleEligibilitySchedules" (updated April 4, 2024), <https://learn.microsoft.com/en-us/graph/api/rbacapplication-list-roleeligibilityschedules>, accessed October 25, 2026.
[^m2-assign]: Microsoft Learn, "List roleAssignmentSchedules" (updated April 4, 2024), <https://learn.microsoft.com/en-us/graph/api/rbacapplication-list-roleassignmentschedules>, accessed October 25, 2026.
[^m2-rasched]: Microsoft Learn, "unifiedRoleAssignmentSchedule resource type" (updated June 12, 2024), <https://learn.microsoft.com/en-us/graph/api/resources/unifiedroleassignmentschedule>, accessed October 25, 2026.
[^m2-exp]: Microsoft Learn, "expirationPattern resource type" (updated July 26, 2024), <https://learn.microsoft.com/en-us/graph/api/resources/expirationpattern>, accessed October 25, 2026.
[^m2-assignreq]: Microsoft Learn, "Create roleAssignmentScheduleRequests" (updated April 4, 2024), <https://learn.microsoft.com/en-us/graph/api/rbacapplication-post-roleassignmentschedulerequests>, accessed October 25, 2026.
[^m2-rolepolicy]: Microsoft Learn, "List roleManagementPolicyAssignments" (updated April 4, 2024), <https://learn.microsoft.com/en-us/graph/api/policyroot-list-rolemanagementpolicyassignments>, accessed October 25, 2026.
[^m2-roles]: Microsoft Learn, "Microsoft Entra built-in roles" (template IDs; updated July 17, 2026), <https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/permissions-reference>, accessed October 25, 2026.
[^m2-applist]: Microsoft Learn, "List applications" (updated May 16, 2025), <https://learn.microsoft.com/en-us/graph/api/application-list>, accessed October 25, 2026.
[^m2-pwcred]: Microsoft Learn, "passwordCredential resource type" (updated July 29, 2024), <https://learn.microsoft.com/en-us/graph/api/resources/passwordcredential>, accessed October 25, 2026.
[^m2-keycred]: Microsoft Learn, "keyCredential resource type" (updated September 26, 2024), <https://learn.microsoft.com/en-us/graph/api/resources/keycredential>, accessed October 25, 2026.
[^m2-scuba]: CISA, ScubaGear Microsoft Entra ID baseline (`aad.md`, released with v2.0.0), policies MS.AAD.3.1v1, 3.6v1, 4.1v1, 5.5v1 to 5.7v1, 7.1v1 and 7.4v1, <https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/aad.md>, accessed October 25, 2026.
[^m2-approle]: Microsoft Learn, "List appRoleAssignments granted for a service principal" (updated October 15, 2024), <https://learn.microsoft.com/en-us/graph/api/serviceprincipal-list-approleassignedto>, accessed October 25, 2026.
[^m2-oauth]: Microsoft Learn, "List oAuth2PermissionGrants (delegated permission grants)" (updated July 11, 2024), <https://learn.microsoft.com/en-us/graph/api/oauth2permissiongrant-list>, accessed October 25, 2026.
[^m2-audit]: Microsoft Learn, "List directoryAudits" (updated August 13, 2024), <https://learn.microsoft.com/en-us/graph/api/directoryaudit-list>, accessed October 25, 2026.
[^m2-signins]: Microsoft Learn, "List signIns" (updated July 30, 2024), <https://learn.microsoft.com/en-us/graph/api/signin-list>, accessed October 25, 2026.
[^m2-retention]: Microsoft Learn, "Microsoft Entra data retention" (updated January 6, 2026), <https://learn.microsoft.com/en-us/entra/identity/monitoring-health/reference-reports-data-retention>, accessed October 25, 2026.
[^m2-regdetails]: Microsoft Learn, "List userRegistrationDetails" (updated July 30, 2024), <https://learn.microsoft.com/en-us/graph/api/authenticationmethodsroot-list-userregistrationdetails>, accessed October 25, 2026.
[^m2-regres]: Microsoft Learn, "userRegistrationDetails resource type" (updated July 22, 2024), <https://learn.microsoft.com/en-us/graph/api/resources/userregistrationdetails>, accessed October 25, 2026.
[^m2-authmethods]: Microsoft Learn, "List methods" (updated September 13, 2024), <https://learn.microsoft.com/en-us/graph/api/authentication-list-methods>, accessed October 25, 2026.
[^m2-ampolicy]: Microsoft Learn, "Get authenticationMethodsPolicy" (updated May 1, 2024), <https://learn.microsoft.com/en-us/graph/api/authenticationmethodspolicy-get>, accessed October 25, 2026.
[^m2-risky]: Microsoft Learn, "List riskyUsers" (updated October 17, 2024), <https://learn.microsoft.com/en-us/graph/api/riskyuser-list>, accessed October 25, 2026.
[^m2-govfeatures]: Microsoft Learn, "Microsoft Entra feature availability" in Azure for US Government (updated January 15, 2026), <https://learn.microsoft.com/en-us/entra/identity/authentication/feature-availability>, accessed October 25, 2026.
[^m2-trustedips]: Microsoft Learn, "Compare Azure Government and global Azure," section "Identity" (limitations with multifactor authentication: Trusted IPs isn't supported; use Conditional Access policies with named locations), <https://learn.microsoft.com/en-us/azure/azure-government/compare-azure-government-global-azure#identity>, read November 1, 2026.
