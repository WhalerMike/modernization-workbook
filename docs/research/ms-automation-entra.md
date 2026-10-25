---
title: "Microsoft Automation, Module 2: Microsoft Entra ID through Microsoft Graph"
subtitle: "An implementation guide: the Graph APIs, least-privileged permissions and data shapes behind users, groups, Conditional Access, PIM, applications, logs and authentication methods, with five tested read-only checks mapped to ScubaGear"
description: "Research draft: how to read and evidence Microsoft Entra ID through Microsoft Graph for Books 02 and 04. It covers users and sign-in activity, groups and membership, Conditional Access policies and named locations, PIM eligibility and assignment schedules, applications and their credentials, consent grants, audit and sign-in logs and their retention, authentication-method registration, risky users, what differs in US Government clouds, and five read-only checks in Python and PowerShell tied to ScubaGear policies."
research-status: draft
research-type: implementation guide
research-book: "Books 02, 04"
date-modified: 2026-10-25
last-reviewed: 2026-10-25
---

# Microsoft Automation, Module 2: Microsoft Entra ID through Microsoft Graph {.unnumbered}

[Book 02](../books/b02-identity/index.md) builds the Entra ID target, and [Book 04](../books/b04-access/index.md) puts access behind Conditional Access, PIM and application governance. Both ask for evidence a script can collect: who hasn't signed in, what the Conditional Access policies say, who holds a privileged role permanently, which applications still have passwords, and who can't yet use phishing-resistant MFA. This module maps each of those questions to the Graph API that answers it, the least-privileged permission, and the shape of the data. Five of them are built as tested, read-only checks.

It assumes [Module 1](ms-automation-foundations.md): the right cloud's endpoints, app-only sign-in without a secret, paging, throttling and batching.

**The example code:** [examples/ms-automation on GitHub](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation). Equivalent Python (`entra_tasks.py`) and PowerShell (`FmwGraph.psm1`) implement the five checks under [The five checks](#the-five-checks). They're **illustrative: unit-tested against fixtures, not proven against live tenants**.

## The APIs at a glance

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

## Users and sign-in activity

`signInActivity` is how a script finds dormant accounts. It holds `lastSignInDateTime` (interactive) and `lastNonInteractiveSignInDateTime`. Microsoft notes that some users reach resources only through clients, so the non-interactive date belongs in any inactivity check alongside the interactive one.[^m2-signinact] Three constraints:

- **License and permission.** Details for `signInActivity` require Microsoft Entra ID P1 or P2 and the `AuditLog.Read.All` permission.[^m2-userlist]
- **Page size.** Selecting or filtering on `signInActivity` caps the page at 500 users, against 999 otherwise.[^m2-userlist]
- **It must be selected.** The property is returned only when it's named in `$select`.[^m2-userres]

For change tracking, `/users/delta` follows the Module 1 pattern. Any query parameter other than `$deltatoken` and `$skiptoken` has to be in the first delta request, and Graph carries it in the links that follow.[^m2-userdelta]

## Groups and membership

Use `transitiveMembers` when the question is who is effectively in a group, nested groups included; `members` returns only direct members. Which features honor nested membership varies by feature, so check each feature's documentation before assuming either way *(design guidance)*. The transitive call costs 5 resource units against 3 for direct `members` ([Module 1](ms-automation-foundations.md#four-request-patterns)). `GroupMember.ReadBasic.All` is enough to read membership. Members of a type the app has no permission to read come back with only `id` and `@odata.type`.[^m2-transitive]

## Conditional Access

Reading needs only `Policy.Read.All`.[^m2-calist] Each policy's `state` is `enabled`, `disabled` or `enabledForReportingButNotEnforced`, the last being report-only.[^m2-caov] Book 04's rollout depends on knowing which policies are report-only. CA022, phishing-resistant MFA for everyone, starts that way.

Creating a policy needs `Policy.Read.All` and `Policy.ReadWrite.ConditionalAccess`. Microsoft notes "a known permissions issue" that may need consent to more permissions. For a person signing in, the least-privileged roles are Conditional Access Administrator and Security Administrator.[^m2-capost] Book 04 Chapter 10 keeps the policies as code. Here that means a pipeline holds the write permission, and the evidence collector holds only the read *(design guidance)*.

The `ca-export` check writes one JSON file per policy with sorted keys, so a policy change shows up as a readable diff between two exports.

## Privileged Identity Management

The current PIM APIs are under `/roleManagement/directory`.[^m2-pim] Two kinds of schedule matter:

- **Eligibility schedules** (`roleEligibilitySchedules`): who may activate a role.[^m2-elig]
- **Assignment schedules** (`roleAssignmentSchedules`): who holds it now. `assignmentType` is `Assigned` for a direct assignment and `Activated` for an activation. `memberType` says whether the assignment is `Direct`, through a `Group`, or `Inherited`.[^m2-rasched]

An assignment's end is in `scheduleInfo.expiration`. Its `type` is `notSpecified`, `noExpiration`, `afterDateTime` or `afterDuration`.[^m2-exp] An `Assigned` schedule with no expiration is **permanent active**, which is what ScubaGear MS.AAD.7.4v1 forbids for highly privileged roles.

Changes go through schedule requests (`roleAssignmentScheduleRequests`), whose `action` is one of the following:[^m2-assignreq]
- an administrator's `adminAssign`, `adminUpdate`, `adminRemove`, `adminExtend` or `adminRenew`;
- a user's `selfActivate`, `selfDeactivate`, `selfExtend` or `selfRenew`.

Writes need `RoleAssignmentSchedule.ReadWrite.Directory`. For a signed-in person, the least-privileged role for writes is Privileged Role Administrator.[^m2-assignreq] Microsoft describes PIM as "a feature of Microsoft Entra ID Governance".[^m2-pim] Role IDs are stable built-in template IDs: Global Administrator is `62e90394-69f5-4237-9190-012177145e10` and Privileged Role Administrator is `e8611ab8-c189-46e8-94e1-60213ab1f814`.[^m2-roles]

## Applications and their credentials

An application object's `passwordCredentials` (secrets) and `keyCredentials` (certificates) each carry `startDateTime` and `endDateTime`, in UTC.[^m2-pwcred][^m2-keycred] Those dates are enough to test ScubaGear's three application rules:[^m2-scuba]

- no application passwords (MS.AAD.5.5v1);
- passwords valid for at most 180 days (MS.AAD.5.6v1);
- certificates valid for at most 365 days (MS.AAD.5.7v1).

Microsoft's [app management policies](graph-practice-crosswalk.md#entra-id) enforce the same limits going forward. The check finds what existed before they were turned on.

Two related reads for consent review ([Book 04, Chapter 05](../books/b04-access/05-applications-and-workload-identities.md)):

- `appRoleAssignedTo` on a service principal shows who has been given the application's roles.[^m2-approle]
- `oauth2PermissionGrants` lists delegated permission grants. Its least-privileged read permission is `Directory.Read.All`.[^m2-oauth]

## Logs and retention

Directory audits and sign-ins both need `AuditLog.Read.All`.[^m2-audit][^m2-signins] A sign-in's `appliedConditionalAccessPolicies` is filled in only for callers allowed to read Conditional Access data. A log reader without that permission sees sign-ins but not which policies applied.[^m2-signins]

Entra ID keeps **audit logs and sign-ins for seven days on the Free tier and 30 days with P1 or P2**.[^m2-retention] That's why ScubaGear MS.AAD.4.1v1 requires sending the logs to the security operations center, as the [crosswalk](graph-practice-crosswalk.md#entra-id) notes. A Graph script is a way to *check* logs, not to keep them.

## Authentication methods

`userRegistrationDetails` gives one row per user with `isMfaRegistered`, `isPasswordlessCapable`, `isAdmin`, `userType` (`member` or `guest`) and `methodsRegistered`.[^m2-regres] It's the quickest way to track progress toward ScubaGear MS.AAD.3.1v1, phishing-resistant MFA for all users.

One caution. Microsoft documents `methodsRegistered` only by example: "mobilePhone, email, passKeyDeviceBound".[^m2-regres] A check that counts phishing-resistant users has to choose which method names to count, and should be confirmed against a real report *(inference)*. The example code keeps that list in one place for that reason.

Reading one user's registered methods needs `UserAuthenticationMethod.Read.All`. That API isn't available in the China cloud, though it is in GCC High and DoD.[^m2-authmethods] The tenant's allowed methods come from the authentication methods policy, which needs `Policy.Read.AuthenticationMethod`.[^m2-ampolicy]

## What differs in US Government clouds

The APIs above are the same in GCC High and DoD. The endpoints differ (Module 1), and so do some features. Microsoft's US Government feature table for Entra ID, as of January 2026, lists:[^m2-govfeatures]

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

## The five checks

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

## Status and review

**Draft.** Every API, permission, property and limit was checked against Microsoft Learn and the ScubaGear baseline on October 25, 2026. Inferences and design guidance are labeled. The checks are tested against fixtures only.

To move this page to **In review**:
- a reviewer confirms the permissions table;
- someone runs the five checks against a test tenant and compares the results with the Entra admin center.

To move it to **Proved**: record that comparison here, including which method names your tenant's registration report uses. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Module 1: Foundations](ms-automation-foundations.md), the [Microsoft practice crosswalk](graph-practice-crosswalk.md), [Book 02 — Identity & Directory](../books/b02-identity/index.md) and [Book 04 — Access & Privilege](../books/b04-access/index.md).

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
