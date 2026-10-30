---
title: "Chapter 02 — Emergency Access Accounts as Code"
description: "Check the emergency access accounts against Learn's standard as code, and write the alert on their use as a reviewed ARM template, starting from Learn's own emergency access page and its sample alert queries (pinned in the repository) and adding what they leave to you: a check of every account, its methods, its Global Administrator assignment, the exclusion group and every enforced Conditional Access policy, and an alert that also sees non-interactive sign-ins and audit events, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-privileged-access
part: How
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: pending
---

# Chapter 02 — Emergency Access Accounts as Code

*The emergency accounts are the one standing privilege the program keeps on purpose, so they get checked every run and watched every minute, by code someone reviewed.*

::: {.callout-note}
## In this chapter
The check and the alert behind the plan's tasks A0.4 and A1.1: "existing emergency access accounts located and checked against the standard," then "two emergency accounts built to the standard, excluded by one group, alerted and tested." You start with Learn's emergency access page, which sets the standard and gives three sample alert queries, pinned in the repository, and you run the queries offline over fictional log rows to see what they catch and what they miss. Then you use `examples/privileged-access` for what they leave to you: a check of each account against the standard, and the alert as an ARM template that also sees non-interactive sign-ins and audit events. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can check, from code, that each emergency access account meets the standard, and produce the alert on their use as a template a reviewer can read and a pipeline can deploy. You can say, for each rule, whether it is Learn's standard, Learn's sample, or the program's own design.

**Audience.** Developers who build the project's foundation, the identity engineers who own the accounts, and the security operations staff who receive the alert. You should read PowerShell 7 and KQL. You don't need a tenant until Lab 2.

## Why this comes first

Book 04, Chapter 08's Step 0 is the only step that can't move: approval switched on before the emergency accounts exist is the documented lockout, and the project plan's critical path note says the same ([Book 04, Chapter 08](../../../books/b04-access/08-pim-self-request-with-approval.md#step-0-establish-emergency-access-accounts-first)). Learn names the case: every Global Administrator and Privileged Role Administrator eligible, approval required, and no approvers selected, so no one can approve and administration is locked.[^pa02-emergency] The emergency accounts are also the program's main documented exception to "zero permanently active assignments."[^pa02-pim-plan] Chapter 01's inventory reports them as Info only because `exceptions.csv` names them. This chapter makes sure the exception is what it claims to be.

### Which cloud, for this check and this alert

The check reads Microsoft Graph: `graph.microsoft.com` for GCC, `graph.microsoft.us` for GCC High and `dod-graph.microsoft.us` for DoD.[^pa02-deployments] The alert runs in Azure Monitor, over the Log Analytics workspace that receives the tenant's Entra logs. For Microsoft 365 GCC with commercial Azure, that workspace and the alert sit in a commercial subscription, deployed through `management.azure.com`. The template the code writes names no host, so the same file deploys in Azure Government for a GCC High or DoD tenant; whether every piece of it is available there wasn't confirmed (research gaps, row 7). Passkeys (FIDO2) and certificate-based authentication, the two methods Learn names for these accounts, are available in Azure for US Government.[^pa02-availability]

## Start with Microsoft's sample

### What Microsoft gives you

Learn's page *Manage emergency access accounts in Microsoft Entra ID* is Microsoft's standard and procedure.[^pa02-emergency] It asks for two or more cloud-only accounts on the `*.onmicrosoft.com` domain, neither federated nor synchronized; passkey (FIDO2) or certificate-based authentication, different from the normal administrator accounts' methods; Global Administrator assigned as active and permanent in PIM; exclusion from Conditional Access policies that block or restrict sign-in, through a dedicated group, with report-only policies needing no exclusion; credentials and devices that don't expire; monitoring of sign-in and audit logs with alerts; and validation at least every 90 days, including a check that no one registered MFA or self-service password reset to an individual's device or personal details.[^pa02-emergency] Book 04, Chapter 04 adopts the same standard and adds dual custody and a post-use review ([Book 04, Chapter 04](../../../books/b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts)).

For the alert, the page gives three sample Azure Monitor queries, on one object ID, on two, and on a user principal name, and walks through creating the log search alert rule and its action group in the Azure portal: severity 0, threshold greater than 0.[^pa02-emergency]

### The pinned copy

The queries exist only inside the Learn page, so the repository pins the page's source, unmodified, in [`examples/third_party/entra-emergency-access-page`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/third_party/entra-emergency-access-page): `security-emergency-access.md` from MicrosoftDocs/entra-docs at commit `07cb73d` (October 30, 2026), retrieved October 30, 2026, with the repository's MIT licenses.[^pa02-sample-src] `snapshot.json` records each file's SHA-256, checked against the upstream git blob hashes; a unit test checks them, and the weekly source watch reports new commits to the page.

`tests/LearnSampleHarness.ps1` extracts the three queries from the pinned page and evaluates their filters over `tests/fixtures/signin-export.json`, six fictional rows in a workspace's table shapes, with a small evaluator that handles only the queries' shape: a table, one `where` of `Column == "value"` terms joined by `or`, and a `project`. Anything else throws, so a new upstream shape fails the tests instead of being half-read. It isn't a KQL engine, and nothing is sent to a workspace.

### What it leaves to you

Each row is pinned by a test: in `tests/MicrosoftSamples.Tests.ps1` for the sample, and in `tests/EmergencyAccess.Tests.ps1` for the example.

| Learn's sample, as published | Why it matters | What `examples/privileged-access` adds |
|---|---|---|
| Three queries, all on `SigninLogs`, matching `UserId` | — | Kept as the model: the first leg of the alert's query, matched by object ID |
| With real object IDs, catches both interactive sign-ins in the export | — | Kept |
| Uses Learn's placeholder object IDs and `user@yourdomain.onmicrosoft.com` | A query copied as published alerts on nothing | IDs come from `emergency-access.json`; `Get-PaEmergencyQuery` refuses a UPN and Learn's placeholder IDs |
| Misses the non-interactive sign-in in the export | A refreshed token in a stolen session is a non-interactive sign-in, a separate log category and table[^pa02-noninteractive] [^pa02-streams] | `AADNonInteractiveUserSignInLogs` leg[^pa02-table-ni] |
| Misses both audit events: a role change made by an emergency account, and a security method registered on one | The page asks to monitor sign-in and audit logs;[^pa02-emergency] a method added to the account is the start of a takeover | `AuditLogs` leg, by `InitiatedBy` or by `TargetResources`[^pa02-table-audit] |
| The UPN query misses the account after a rename | Rename, then sign in, and nothing fires | Object IDs only |
| The rule, severity, threshold and action group are portal steps | Nothing to review, diff or redeploy | `New-PaEmergencyAlertRule`: a `scheduledQueryRules` template with Learn's severity and threshold, tested |
| The standard is a checklist in prose | Each item is checked by hand, if at all | `Test-PaEmergencyAccess`: PA-EA-01 to PA-EA-10, every run |

**The verdict.** Keep Learn's object-ID query as the core of the alert, and Learn's portal settings (severity 0, any result fires) as its values. Don't deploy the samples as published: they watch one of the three places an emergency account shows up.

## The code: `examples/privileged-access`

This chapter adds `Test-PaEmergencyAccess`, `Get-PaEmergencyQuery`, `New-PaEmergencyAlertRule` and `Find-PaEmergencyActivity` to the module from [Chapter 01](01-privileged-inventory-as-code.md), and the entry script `Invoke-PaEmergencyCheck.ps1`. It uses the same reader: declared calls only, GET only, the cloud's own host, every page.

### The configuration

`emergency-access.json` names the accounts and the exclusion group by object ID, with optional `minimumAccounts` (2) and `maxValidationAgeDays` (90). `Read-PaEmergencyConfig` refuses a UPN where an ID belongs. `emergency-validations.csv` records each drill: account, date, result and ticket. Learn's 90 days and two accounts are the defaults.[^pa02-emergency]

### The check

`Test-PaEmergencyAccess` reads each account, its methods, its active role assignments, the exclusion group and every Conditional Access policy, and reports:

| Rule | Severity | What it flags | Source |
|---|---|---|---|
| PA-EA-01 | Finding | Fewer than two accounts configured | Learn[^pa02-emergency] |
| PA-EA-02 | Finding | An account not on `*.onmicrosoft.com` | Learn[^pa02-emergency] |
| PA-EA-03 | Finding | An account synchronized from on-premises | Learn[^pa02-emergency] |
| PA-EA-04 | Finding | A disabled account | *Design guidance* |
| PA-EA-05 | Finding | Global Administrator not active, permanent and direct: eligible only, time-bound, activated or inherited | Learn[^pa02-emergency] |
| PA-EA-06 | Finding; Warn | A registered phone, Microsoft Authenticator, software OATH, email or Temporary Access Pass method (Finding); no passkey registered, so confirm certificate-based authentication (Warn) | Learn: passkey or CBA, and no MFA registered to an individual's device[^pa02-emergency] |
| PA-EA-07 | Finding | An account not in the exclusion group | Learn[^pa02-emergency] |
| PA-EA-08 | Finding; Info | An enforced policy that doesn't exclude an account, through the group or directly (Finding); a report-only policy that doesn't exclude the group (Info) | Learn: report-only policies need no exclusion;[^pa02-emergency] *Design guidance* for treating every enforced policy as one that restricts |
| PA-EA-09 | Finding | No passing validation, or the last one older than 90 days | Learn[^pa02-emergency] |
| PA-EA-10 | Finding | A member of the exclusion group that isn't an emergency account | *Design guidance*: everyone in that group skips every policy |

PA-EA-08 checks every enforced policy rather than deciding which ones "block or restrict," the same rule Book 04, Chapter 10's pre-merge check applies to the repository's policy files ([Book 04, Chapter 10](../../../books/b04-access/10-access-as-code-and-evidence.md#a-pre-merge-check-for-the-emergency-access-exclusion)). Reading which policies restrict sign-in is a judgment the code shouldn't make. The two differ on report-only policies: Book 04, Chapter 10's check fails them too, while Learn and Book 04, Chapter 04 say they need no exclusion. The code follows Learn and reports them as Info (research gaps, row 5).

The check needs six permissions, each the least-privileged for its call:

| Call | Least-privileged permission | Delegated role |
|---|---|---|
| Get a user (`accountEnabled`, `onPremisesSyncEnabled`) | `User.Read.All`; neither property is in the basic profile[^pa02-user-get] [^pa02-users-basic] | — |
| List a user's authentication methods | `UserAuthenticationMethod.Read.All`[^pa02-methods] | Global Reader, Authentication Administrator or Privileged Authentication Administrator |
| List roleAssignmentScheduleInstances, filtered by principal | `RoleAssignmentSchedule.Read.Directory`[^pa02-rasi] | Global Reader (read) |
| List the exclusion group's members | `GroupMember.ReadBasic.All`, with `User.ReadBasic.All` for members' names[^pa02-members] | — |
| List Conditional Access policies | `Policy.Read.All`[^pa02-ca-list] | Global Reader or Security Reader |

### The alert

`Get-PaEmergencyQuery` writes one query from the account IDs: Learn's `SigninLogs` filter, the same filter on `AADNonInteractiveUserSignInLogs`, and `AuditLogs` rows where an account is the initiator or a target. It doesn't use `union isfuzzy=true`, so a table that the diagnostic setting doesn't send makes the query fail rather than return nothing. *Design guidance.* `New-PaEmergencyAlertRule` wraps it in an ARM template for `Microsoft.Insights/scheduledQueryRules`, API version `2023-12-01`, kind `LogAlert`:[^pa02-sqr] severity 0 and a static threshold of greater than 0, as Learn's procedure sets;[^pa02-emergency] a `Count` aggregation, evaluated every 5 minutes over a 5-minute window (*Design guidance*; Learn leaves the frequency to you); the workspace as its scope and the action group you name. It checks that the scope is a Log Analytics workspace and the action group is one. It returns the template and deploys nothing: deployment is the reviewed pipeline's job, and Lab 2's.

The alert's data has two prerequisites outside the code. The tenant's diagnostic setting must send `AuditLogs`, `SignInLogs` and `NonInteractiveUserSignInLogs` to the workspace, which needs at least Security Administrator,[^pa02-integrate] [^pa02-streams] and analyzing sign-in logs in Log Analytics needs Microsoft Entra ID P1 or P2.[^pa02-analyze]

`Find-PaEmergencyActivity` applies the same match to exported rows offline, for a lab, a drill review or a comparison with another query. It is not a KQL engine; the query itself is first run against a real workspace in Lab 2.

### The tests

This chapter's tests are the 7 in the Chapter 02 block of `tests/MicrosoftSamples.Tests.ps1`, Learn's queries as published, and the 29 in `tests/EmergencyAccess.Tests.ps1`: the configuration, every rule on the fixture and each rule on its own against a tenant brought up to the standard, the query's tables and refusals, the offline match, the template's values and refusals, and the entry script's manifest. With Chapter 01's, 78 Pester tests pass under PowerShell 7, with no module, tenant or network.

::: {.callout-important}
## Illustrative code
The commands below run Learn's pinned queries over fictional rows, and the example against a fictional tenant served by a fake. They show what the code does, not that a workspace or a tenant returns the same shapes. Review the code and the template, and run Lab 2 in a test tenant, before either touches production.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/privileged-access`.

1. **Run Learn's queries over the export:**

   ```powershell
   Invoke-Pester -Path tests/MicrosoftSamples.Tests.ps1 -FullNameFilter '*Chapter 02*' -Output None -PassThru |
       Select-Object PassedCount, FailedCount
   ```

   `PassedCount 7`, `FailedCount 0`. Read the third to fifth tests: of five emergency events in the export, Learn's two-ID query finds the two interactive sign-ins.

2. **List the permissions the check needs:**

   ```powershell
   Import-Module ./powershell/PrivilegedAccess/PrivilegedAccess.psm1
   (Get-PaRequiredPermission -Task emergency-access).GraphPermissions -join ', '
   ```

   `GroupMember.ReadBasic.All, Policy.Read.All, RoleAssignmentSchedule.Read.Directory, User.Read.All, User.ReadBasic.All, UserAuthenticationMethod.Read.All`.

3. **Check the fictional tenant's accounts and write the alert template:**

   ```powershell
   ./Invoke-PaEmergencyCheck.ps1 -FixturePath tests/fixtures/tenant.json -ConfigPath tests/fixtures/inputs/emergency-access.json `
       -ValidationsPath tests/fixtures/inputs/emergency-validations.csv -AsOf 2026-10-30 -OutputPath out/emergency `
       -WorkspaceResourceId /subscriptions/22222222-2222-4222-8222-222222222222/resourceGroups/rg-logs/providers/Microsoft.OperationalInsights/workspaces/law-identity `
       -ActionGroupResourceId /subscriptions/22222222-2222-4222-8222-222222222222/resourceGroups/rg-logs/providers/Microsoft.Insights/actionGroups/ag-soc -Location eastus
   ```

   ```text
   Emergency access: 9 Finding, 0 Warn, 1 Info
   Alert rule written to emergency-alert.json for review; deploy it with your reviewed pipeline
   Written to out/emergency (manifest.json lists every request and file hash)
   ```

4. **Read the findings:**

   ```powershell
   Get-Content out/emergency/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object
   ```

   `ea01` passes. `ea02` fails five ways: PA-EA-02 (it's on `contoso.example`), PA-EA-05 (its Global Administrator assignment ends on December 31), PA-EA-06 (a phone method), PA-EA-07 (not in the exclusion group) and PA-EA-09 (last validated May 1). PA-EA-08 names three enforced policies, `CA001-All-Block-legacy-authentication`, `CA004-Admins-Require-compliant-device` and `PIM-Activation-c1`, and reports the report-only `CA090-Emergency-accounts-Report-sign-ins` as Info. PA-EA-10 names `carl.ops@contoso.example`, who is in the exclusion group and shouldn't be.

5. **Match the same export with the example's rule:**

   ```powershell
   $rows = (Get-Content tests/fixtures/signin-export.json -Raw | ConvertFrom-Json).rows
   Find-PaEmergencyActivity -Rows $rows -AccountId 0e000000-0000-4000-8000-000000000001, 0e000000-0000-4000-8000-000000000002 |
       Format-Table Source, AccountId, OperationName
   ```

   Five rows: two from `SigninLogs`, one from `AADNonInteractiveUserSignInLogs`, and two from `AuditLogs` (`Add member to role`, initiated by `ea02`, and `User registered security info`, which targets `ea01`). Dana's ordinary sign-in isn't matched.

6. **See the guards:**

   ```powershell
   Get-PaEmergencyQuery -AccountId ea01@contosoexample.onmicrosoft.com
   $t = Get-Content out/emergency/emergency-alert.json -Raw | ConvertFrom-Json
   $t.resources[0].type, $t.resources[0].apiVersion, $t.resources[0].properties.severity -join ' | '
   ```

   `'ea01@contosoexample.onmicrosoft.com' isn't an object ID`, then `Microsoft.Insights/scheduledQueryRules | 2023-12-01 | 0`.

7. **Run the tests:**

   ```powershell
   Invoke-Pester -Path tests
   ```

**Expected result:** 78 tests passing, and each row of the gap table seen with your own eyes. Delete `out` when you're done.

## Lab 2: test tenant

Use a test tenant in the worldwide or GCC cloud with a test Azure subscription, never production. If the test tenant's emergency accounts are real, treat the drill in step 5 as Learn's validation drill: tell security operations first, and record it.[^pa02-emergency]

1. **Send the logs.** As at least Security Administrator, add a diagnostic setting that sends `AuditLogs`, `SignInLogs` and `NonInteractiveUserSignInLogs` to a test Log Analytics workspace.[^pa02-integrate] Wait for data to arrive.
2. **Register the reader app** in the worldwide admin center with a certificate, grant the six application permissions from Lab 1, step 2, with admin consent, and nothing else.
3. **Run the check** with the test accounts' IDs in your own `emergency-access.json`:

   ```powershell
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
   ./Invoke-PaEmergencyCheck.ps1 -Cloud gcc -ConfigPath emergency-access.json -ValidationsPath emergency-validations.csv -OutputPath out/emergency-test `
       -WorkspaceResourceId <workspace-resource-id> -ActionGroupResourceId <action-group-resource-id> -Location <region> -TenantId <tenant-id>
   ```

   Create the action group first, in the portal as Learn describes, with a test mailbox.[^pa02-emergency]
4. **Run the query by hand.** Paste the query from `emergency-alert.json` into the workspace's Logs and run it over the last day. It must run without an error; an error that names a table means the diagnostic setting doesn't send it (research gaps, row 8).
5. **Deploy the alert and drill.** Review `emergency-alert.json`, deploy it as at least Monitoring Contributor,[^pa02-emergency] with `New-AzResourceGroupDeployment -ResourceGroupName <test-rg> -TemplateFile out/emergency-test/emergency-alert.json`, then sign in with one test emergency account from the designated workstation and perform one administrative read. Within two evaluation periods the action group's mailbox should receive the alert. Record the drill in `emergency-validations.csv` and rerun step 3: PA-EA-09 clears for that account.
6. **Back it out.** Delete the alert rule and the action group, remove the six permissions, delete the reader app and its certificate, remove the diagnostic setting if you created it for the lab, and delete `out/emergency-test`.

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| Emergency access standard | Two or more cloud-only accounts on `*.onmicrosoft.com`; passkey or CBA, different from normal admin methods; Global Administrator active and permanent; excluded from policies that block or restrict, through one group; report-only needs no exclusion; monitor sign-in and audit logs; validate at least every 90 days | — | GA | [^pa02-emergency] |
| Sample alert | `SigninLogs` filtered by `UserId` or `UserPrincipalName`; severity 0; threshold greater than 0; at least Monitoring Contributor to create | — | — | [^pa02-emergency] |
| Permanent active assignments | Zero, except the emergency access accounts | — | — | [^pa02-pim-plan] |
| Log categories | `AuditLogs`, `SignInLogs`, `NonInteractiveUserSignInLogs` (and others) through a diagnostic setting; Security Administrator to create one | — | — | [^pa02-streams] [^pa02-integrate] |
| Non-interactive sign-ins | Done on behalf of a user, for example a token refresh; table `AADNonInteractiveUserSignInLogs` | — | — | [^pa02-noninteractive] [^pa02-table-ni] |
| `AuditLogs` | `InitiatedBy` and `TargetResources` are dynamic columns | — | — | [^pa02-table-audit] |
| Log Analytics for sign-in logs | Microsoft Entra ID P1 or P2 | — | — | [^pa02-analyze] |
| Log search alert rule | `Microsoft.Insights/scheduledQueryRules` `2023-12-01`; `criteria.allOf` with `query`, `timeAggregation`, `operator`, `threshold`, `failingPeriods` | Not confirmed for Azure Government | GA | [^pa02-sqr] |
| Get a user | `User.Read.All` (application); basic profile excludes `accountEnabled` and `onPremisesSyncEnabled` | — | v1.0 | [^pa02-user-get] [^pa02-users-basic] |
| List authentication methods | `UserAuthenticationMethod.Read.All` for other users; Global Reader, Authentication Administrator or Privileged Authentication Administrator | Passkey methods list: L4 and L5 | v1.0 | [^pa02-methods] [^pa02-fido2] |
| List roleAssignmentScheduleInstances | `RoleAssignmentSchedule.Read.Directory`; filter on `principalId` | L4 and L5 | v1.0 | [^pa02-rasi] |
| List group members | `GroupMember.ReadBasic.All` | — | v1.0 | [^pa02-members] |
| List Conditional Access policies | `Policy.Read.All` | — | v1.0 | [^pa02-ca-list] |
| Passkeys and CBA | Available in Azure for US Government | Available | GA | [^pa02-availability] |

Two places where the sources differ, recorded so a later edit doesn't loosen the code:

- **Report-only policies.** Learn says report-only policies need no exclusion, and Book 04, Chapter 04 agrees; Book 04, Chapter 10's pre-merge check fails report-only policy files that don't exclude the group. The code reports them as Info and asks for the exclusion before enforcement (research gaps, row 5).
- **Individual emergency accounts.** Learn allows individual emergency accounts for administrators as an alternative to shared ones.[^pa02-emergency] Book 04's standard says the accounts aren't tied to an individual. The code checks neither, because Graph can't tell; the program's position is Book 04's. *Design guidance.*

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Approval switched on before the accounts pass | The documented lockout | The plan's Gate 1 needs "emergency access accounts tested"; this check is that test, every run |
| An alert copied from Learn with the placeholder IDs | It never fires | Placeholders and UPNs refused; IDs only from the configuration |
| An alert on interactive sign-ins only | A stolen session's token refreshes, and a method added to the account, go unseen | Non-interactive and audit legs; tests pin the sample's misses |
| A table the workspace doesn't receive | A fuzzy union returns nothing, and silence looks like safety | No `isfuzzy`; Lab 2 runs the query by hand first |
| An exclusion group with extra members | Someone else skips every Conditional Access policy | PA-EA-10 |
| A Global Administrator assignment that expires | The account stops working in the emergency it's for | PA-EA-05 flags time-bound, activated and inherited assignments |
| A phone or app method on the account | It depends on one person's device | PA-EA-06 |
| A drill nobody records | No one knows whether the accounts still work | PA-EA-09 from `emergency-validations.csv` |
| A deployed rule nobody reviewed | The alert is edited in the portal and drifts | The template is code; the planned Chapter 08 compares it with what's deployed |
| Emergency account names in output | Findings name the accounts | The output folder is evidence; delete lab copies |

## Checklist

- [ ] `emergency-access.json` lists two or more accounts and the exclusion group by object ID, and matches `exceptions.csv` from Chapter 01.
- [ ] The run shows no Finding for any emergency account, and every PA-EA-06 Warn has CBA confirmed.
- [ ] Every enforced Conditional Access policy excludes the group, and the group holds only the emergency accounts.
- [ ] Every account has a passing validation within 90 days, with its ticket.
- [ ] The diagnostic setting sends `AuditLogs`, `SignInLogs` and `NonInteractiveUserSignInLogs`, and the query ran without error in the workspace.
- [ ] The deployed alert matches `emergency-alert.json`, with severity 0, threshold greater than 0, and the security operations action group.
- [ ] The reader app holds exactly the six Graph permissions, with a certificate or managed identity.
- [ ] The pinned Learn page matches its manifest, and every upstream commit since the pin has been reviewed.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 01 — Privileged Inventory as Code](01-privileged-inventory-as-code.md) · [Workbook index](index.md)
:::

[^pa02-emergency]: Microsoft Learn, "Manage emergency access accounts in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access> (accessed Oct 30, 2026).
[^pa02-pim-plan]: Microsoft Learn, "Plan a Privileged Identity Management deployment," type of assignments, <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-deployment-plan> (accessed Oct 30, 2026).
[^pa02-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
[^pa02-availability]: Microsoft Learn, "Microsoft Entra feature availability," Microsoft Entra ID, authentication, <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Oct 30, 2026).
[^pa02-sample-src]: Microsoft, MicrosoftDocs/entra-docs, `docs/identity/role-based-access-control/security-emergency-access.md` at commit `07cb73d6c6380414eecd040ba5e14c1c94d48b66` (October 30, 2026; the page last changed June 4, 2026), MIT License, <https://github.com/MicrosoftDocs/entra-docs/blob/07cb73d6c6380414eecd040ba5e14c1c94d48b66/docs/identity/role-based-access-control/security-emergency-access.md> (accessed Oct 30, 2026); pinned copy in `examples/third_party/entra-emergency-access-page`.
[^pa02-noninteractive]: Microsoft Learn, "What are non-interactive user sign-ins in Microsoft Entra?," <https://learn.microsoft.com/entra/identity/monitoring-health/concept-noninteractive-sign-ins> (accessed Oct 30, 2026).
[^pa02-streams]: Microsoft Learn, "What are the identity logs you can stream to an endpoint?," activity log options, <https://learn.microsoft.com/entra/identity/monitoring-health/concept-diagnostic-settings-logs-options> (accessed Oct 30, 2026).
[^pa02-table-ni]: Microsoft Learn, "AADNonInteractiveUserSignInLogs" (Azure Monitor table reference), <https://learn.microsoft.com/azure/azure-monitor/reference/tables/aadnoninteractiveusersigninlogs> (accessed Oct 30, 2026).
[^pa02-table-audit]: Microsoft Learn, "AuditLogs" (Azure Monitor table reference), columns, <https://learn.microsoft.com/azure/azure-monitor/reference/tables/auditlogs> (accessed Oct 30, 2026).
[^pa02-sqr]: Microsoft Learn, "Microsoft.Insights scheduledQueryRules 2023-12-01" (ARM template reference), <https://learn.microsoft.com/azure/templates/microsoft.insights/2023-12-01/scheduledqueryrules> (accessed Oct 30, 2026).
[^pa02-integrate]: Microsoft Learn, "Integrate Microsoft Entra logs with Azure Monitor logs," prerequisites and send logs to Azure Monitor, <https://learn.microsoft.com/entra/identity/monitoring-health/howto-integrate-activity-logs-with-azure-monitor-logs> (accessed Oct 30, 2026).
[^pa02-analyze]: Microsoft Learn, "Analyze Microsoft Entra activity logs with Log Analytics," prerequisites, <https://learn.microsoft.com/entra/identity/monitoring-health/howto-analyze-activity-logs-log-analytics> (accessed Oct 30, 2026).
[^pa02-user-get]: Microsoft Learn, "Get a user," permissions, <https://learn.microsoft.com/graph/api/user-get?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa02-users-basic]: Microsoft Learn, "Working with users in Microsoft Graph," user basic profile properties, <https://learn.microsoft.com/graph/api/resources/users?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa02-methods]: Microsoft Learn, "List methods," permissions acting on other users, <https://learn.microsoft.com/graph/api/authentication-list-methods?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa02-fido2]: Microsoft Learn, "List fido2AuthenticationMethod," <https://learn.microsoft.com/graph/api/fido2authenticationmethod-list?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa02-rasi]: Microsoft Learn, "List roleAssignmentScheduleInstances," <https://learn.microsoft.com/graph/api/rbacapplication-list-roleassignmentscheduleinstances?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa02-members]: Microsoft Learn, "List group members," permissions, <https://learn.microsoft.com/graph/api/group-list-members?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^pa02-ca-list]: Microsoft Learn, "List policies" (conditionalAccessRoot), <https://learn.microsoft.com/graph/api/conditionalaccessroot-list-policies?view=graph-rest-1.0> (accessed Oct 30, 2026; read for the validation kit's VK-CA-01).
