---
title: "Privileged Access: An Implementation Guide"
description: "A gated guide for making privileged access just-in-time in Microsoft Entra ID and Azure: inventory every privileged assignment by tier; build and test the emergency access accounts first, so nobody is locked out; put the administrators behind Conditional Access, report-only then enforced, with the PIM activation gate; hold PIM role settings for Microsoft Entra roles as code and convert standing assignments; govern the PRV role-assignable groups with PIM for Groups; bring Azure Owner, Contributor and User Access Administrator under PIM; run access reviews of every privileged role and group; and keep evidence and drift on a schedule for the ISSO. Each gate states the federal requirement it supports with its KSI, the evidence an ISSO keeps, availability in GCC and GCC High, an interim path, and the read-only check in the privileged access kit that proves it."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: implementation guide
research-book: "Book 04"
review-status: approved
reviewed-sha256: 92273b96e4128629c8b6854f8dd2755a3e35be484efaf5fad0f9fb6f450eebcb
last-reviewed: 2026-11-08
---
# Privileged Access: An Implementation Guide

*Standing privilege is the attack path; this guide removes it gate by gate, and builds the way back in before it locks the door.*

::: {.callout-note}
## In this guide
How an agency makes every human privileged assignment in Microsoft Entra ID and Azure eligible, approved and time-bound, as gated steps an operator can run. First, how to read the guide and its checks, the track at a glance, prerequisites and the path on one page. Then eight gates: inventory every privileged assignment by tier; build and test the emergency access accounts before anything else; put administrators behind Conditional Access and the PIM activation gate; hold PIM role settings for Microsoft Entra roles as code and convert standing assignments; govern the PRV groups with PIM for Groups; bring Azure resource roles under PIM; review every privileged role and group; and keep evidence and drift on a schedule. Each gate carries its federal requirements with their KSIs, availability in GCC and GCC High, an interim path, a **Validate** step that names the kit's read-only check, a *Try it* box and rollback. Then the dangers, the evidence, rollback, a checklist and what couldn't be verified.
:::

## How to read this guide

[Book 04](../b04-access/index.md) holds the design: why standing privilege fails ([Chapter 02](../b04-access/02-why-standing-privilege-fails.md)), the program's tiers and emergency access standard ([Chapter 04](../b04-access/04-privileged-roles-and-tiers.md)), the Conditional Access library ([Chapter 07](../b04-access/07-the-conditional-access-policy-library.md)), the PIM build ([Chapter 08](../b04-access/08-pim-self-request-with-approval.md)), access governance ([Chapter 09](../b04-access/09-access-governance.md)), access as code and evidence ([Chapter 10](../b04-access/10-access-as-code-and-evidence.md)) and each role's settings ([Appendix B](../b04-access/appendix-b-pim-role-settings.md)). The developer workbook [*Building Privileged Access*](../../project-plans/developer-workbooks/privileged-access/index.md) builds the code. This guide doesn't restate either. Each step says what to do, in what order, links the chapter that explains why, and adds the gate, the federal requirement and the ISSO's evidence, and what's available in a government cloud.

The [Privileged Access & Administrative Identity plan](../../project-plans/privileged-access.md) schedules the work. Its five gates (Gate 0 to Gate 4) are the CISO's approvals; this guide's eight gates (G1 to G8) are the operator's checkpoints inside them. [The path on one page](#the-path-on-one-page) maps one to the other.

**Where the facts come from.** Facts carried from Book 04 and from the workbook's chapters rely on their own verification logs. Microsoft Learn facts reuse the chapters' footnotes, with the date each chapter read the page. The one Learn page this guide read again was checked on November 2, 2026; the [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/privileged-access-implementation.md) lists every claim. *(Design guidance)* marks the program's recommendations; *(inference)* marks a conclusion the sources support but don't state. The audience is a civilian agency at FedRAMP Moderate in Microsoft 365 GCC with commercial Azure, where Entra ID runs in Microsoft's commercial cloud and Graph is `graph.microsoft.com`; GCC High uses `graph.microsoft.us` and Azure Government's `management.usgovcloudapi.net`.[^pag-deployments] The examples use the fictional tenant `contoso.example`.

**The checks.** Each **Validate** step names a read-only check from the privileged access kit, [`examples/privileged-access`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/privileged-access). The kit has no `VK-` IDs; its checks are the chapters' entry scripts and their rule IDs. Where a script can also write, the check is its dry run: the client refuses every method but `GET` unless `-Apply` is given ([Chapter 04, the calls](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-calls-and-their-permissions)). The checks are fixture-tested, not proven against a live tenant.

| Check | Rules | What it reports | Gate |
|---|---|---|---|
| `Invoke-PaInventory.ps1` | PA-INV-01 to 09 | Every Entra and Azure role assignment, active and eligible, direct or through a group, with a tier; standing Tier 0 and Tier 1 privilege, too many Global Administrators or subscription Owners, roles outside PRV groups, root-scope elevation | G1 |
| `Invoke-PaEmergencyCheck.ps1` | PA-EA-01 to 10 | Each emergency account against the standard: cloud-only, permanent active Global Administrator, phishing-resistant methods, excluded from every enforced policy, drilled within 90 days; writes the alert as a template | G2 |
| `Invoke-PaCaAdmin.ps1 -CheckOnly`, then its dry run | PA-CA-01 to 09 | The administrator policies, the strength and the contexts as files: the emergency exclusion, the 14 roles, the gate's shape; then what a run would change, with nothing sent | G3 |
| `Invoke-PaPimRoleSettings.ps1` (dry run) | PA-PIM-01 to 09 | Each role's PIM rules against its reviewed file: the lockout guards, the tier caps, the wave order, standing assignments still to convert | G4 |
| `Invoke-PaPimAlertCheck.ps1` | PA-PIM-10 to 13 | The PIM notification settings of the highly privileged roles, and of groups that hold them: no added recipient on the assignment alert or on Global Administrator activation | G4 |
| `Invoke-PaPimGroups.ps1` (dry run) | PA-PG-01 to 09 | The PRV groups and their member and owner schedules and policies against the reviewed file | G5 |
| `Invoke-PaAzurePim.ps1` (dry run) | PA-AZ-01 to 06 | Azure role settings by tier at every governed scope; standing Owner, Contributor and User Access Administrator | G6 |
| `Invoke-PaAccessReviews.ps1 -Mode Plan`, `-Mode Evidence` | PA-AR-01 to 14; PA-AR-E01 to E08 | The review series as files, then each decision as evidence | G7 |
| `Invoke-PaEvidenceRun.ps1` with `pa_evidence.py` | PA-AUD-01 to 04 | A scheduled run of G1 and G2's checks plus the PIM audit, compared with the last run, packaged and chained | G8 |

: The privileged access kit's read-only checks {.striped .hover}

The validation kit's [VK-CA-01](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit) adds a tenant-wide cross-check: every Conditional Access persona policy excludes the emergency access group.

<!-- labs:begin labs (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Labs for this guide
Every gate's hands-on work is a lab in the developer workbook [*Building Privileged Access*](../../project-plans/developer-workbooks/privileged-access/index.md): Lab 1 on a laptop with the kit's fixtures, Lab 2 in a non-production environment. [The Labs page](../../training/labs.md#pa) lists them chapter by chapter, with what each needs and a direct link; each gate below ends with a *Try it* box that links its own.
:::

<!-- labs:end -->

## The track at a glance

**The goal.** No human holds a privileged role all the time. A role reaches a person only through a `PRV-<tier>-<role>` role-assignable group, as an eligible assignment ([Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md#how-a-role-reaches-a-person)). Activation asks again for phishing-resistant proof from a compliant device, a justification, a ticket and, for Tier 0 and Tier 1, a second person's approval ([Book 04, Chapter 08](../b04-access/08-pim-self-request-with-approval.md#settings-by-tier)). Learn's rule is zero permanently active assignments, except the emergency access accounts.[^pag-pim-plan]

**The tiers** are the program's *(design guidance)*, from [Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md#the-programs-privilege-tiers):

| Tier | Plane | Examples | Activation |
|---|---|---|---|
| T0 | Control plane | Global, Privileged Role, Privileged Authentication, Security and Conditional Access Administrator | 4 hours, approval by `PIM-Approvers-T0`, context `c1`, eligibility 90 days |
| T1 | Management plane | Exchange, SharePoint, Intune, Application and Hybrid Identity Administrator | 8 hours, approval by `PIM-Approvers-T1`, context `c1`, eligibility 180 days |
| T2 | Scoped operations | User, Groups and Helpdesk Administrator, scoped to administrative units | 8 hours, approval optional with a risk acceptance, eligibility 180 days |
| Read-only | Visibility | Global Reader, Security Reader | 8 hours, no approval, eligibility 365 days |

: The program's privilege tiers {.striped .hover}

**The order is fixed.** Emergency access first, then the activation gate, then the role settings, "because switching on approval before the emergency accounts exist is the one sequence that locks the agency out" ([workbook index](../../project-plans/developer-workbooks/privileged-access/index.md)). The pilot class is Tier 1, the owner's decision for D-A5; Tier 0 follows once the pilot matches its files ([Chapter 04](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-context-the-code-depends-on)).

**Done when** *(design guidance, from the plan's Gates 3 and 4)*:

- every human privileged assignment is eligible, in Entra ID and in Azure;
- only the emergency accounts and documented service principals stand, each named with a rationale the authorizing official accepted;
- every privileged role and PRV group is reviewed on the approved cadence;
- every elevation in the period has evidence, and a Tier 0 drift is handled as an incident.

## Prerequisites {#prerequisites}

- **Decisions the plan puts first.** The tier model (D-A1), emergency credentials and custody (D-A2), approvers by tier (D-A3), the write path for access as code (D-A4), the pilot class (D-A5), the review cadence (D-A6) and PAW enforcement (D-A7), each with its owner and decide-by week in the [plan](../../project-plans/privileged-access.md#decision-points).
- **Licenses.** Conditional Access and role-assignable groups need Microsoft Entra ID P1; just-in-time activation through PIM needs P2.[^pag-rag] Users with eligible or time-bound Azure assignments need P2 or Microsoft Entra ID Governance.[^pag-az-integration] Access reviews need Entra ID Governance for every reviewer and reviewed user; the program budgets that, the stricter of Learn's pages.[^pag-ar-licensing] Reviews of service principals also need Workload ID Premium.[^pag-ar-pim-review] Analyzing sign-in logs in Log Analytics needs P1 or P2.[^pag-analyze]
- **Logs leaving Entra ID.** Audit logs are kept 30 days with P1 or P2, seven on Free, and a retention change isn't retroactive.[^pag-retention] Route `AuditLogs`, `SignInLogs` and `NonInteractiveUserSignInLogs` to the workspace before G2; creating the diagnostic setting needs at least Security Administrator.[^pag-streams] The plan's A1.3 sets 365-day retention.
- **Separate identities for reading and writing.** Every check reads as an app with a certificate or managed identity, never a secret, and holds only its task's read permissions. Writes run as a different identity, and only for `-Apply` runs *(design guidance)*. The workbook's chapters list each task's least-privileged permission:

| Task | Read (the check) | Write (`-Apply` only) |
|---|---|---|
| Inventory (G1) | `RoleManagement.Read.Directory`, `RoleAssignmentSchedule.Read.Directory`, `RoleEligibilitySchedule.Read.Directory`, `GroupMember.ReadBasic.All`, `User.ReadBasic.All`; Azure Reader | None |
| Emergency access (G2) | `User.Read.All`, `UserAuthenticationMethod.Read.All`, `RoleAssignmentSchedule.Read.Directory`, `GroupMember.ReadBasic.All`, `User.ReadBasic.All`, `Policy.Read.All` | None |
| Conditional Access (G3) | `Policy.Read.All`, `AuthenticationContext.Read.All`, `Policy.Read.AuthenticationMethod` | `Policy.ReadWrite.ConditionalAccess`, `AuthenticationContext.ReadWrite.All` |
| PIM for Entra roles (G4) | `RoleManagementPolicy.Read.Directory`, `RoleEligibilitySchedule.Read.Directory`, `RoleAssignmentSchedule.Read.Directory`; the alert check adds `RoleManagementPolicy.Read.AzureADGroup` | `RoleManagementPolicy.ReadWrite.Directory`, `RoleEligibilitySchedule.ReadWrite.Directory`; converting adds `RoleAssignmentSchedule.ReadWrite.Directory` |
| PIM for Groups (G5) | `Group.ReadBasic.All` and three `*.Read.AzureADGroup` permissions | The `*.ReadWrite.AzureADGroup` permissions the plan lists |
| Azure PIM (G6) | Reader | User Access Administrator, time-bound |
| Access reviews (G7) | `AccessReview.Read.All`; Azure Reader | `AccessReview.ReadWrite.All`; User Access Administrator for Azure series |
| Evidence (G8) | The nine Graph read permissions of G1, G2 and `AuditLog.Read.All`; Azure Reader | None |

: Permissions by task, from the workbook's chapters {.striped .hover}

## The path on one page

| Gate | Done when | Validate with | Workbook chapter | Plan tasks and gate |
|---|---|---|---|---|
| [G1 Privileged inventory](#step-1-inventory-every-privileged-assignment) | Every Entra and Azure privileged assignment, active and eligible, is listed with a tier; standing privilege outside an owned exception is a finding | `Invoke-PaInventory.ps1` (PA-INV) | [01](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md) | A0.1, A0.2, D-A1; Gate 0 |
| [G2 Emergency access](#step-2-build-and-test-emergency-access-first) | Two or more accounts meet the standard, are excluded from every enforced policy, alerted on and drilled within 90 days | `Invoke-PaEmergencyCheck.ps1` (PA-EA); VK-CA-01 | [02](../../project-plans/developer-workbooks/privileged-access/02-emergency-access-as-code.md) | A0.4, D-A2, A1.1; Gate 1 |
| [G3 Conditional Access for administrators](#step-3-put-administrators-behind-conditional-access) | The administrator policies and the activation gate are files, created report-only, then enforced as their own change; `PIM-Activation-c1` is On | `Invoke-PaCaAdmin.ps1` (PA-CA) | [03](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md) | A1.2, A1.5, A2.3, A2.5, A2.6, D-A7; Gates 1 and 2 |
| [G4 PIM for Entra roles](#step-4-pim-for-microsoft-entra-roles) | Every role's settings match its reviewed file; standing human assignments converted, wave by wave | `Invoke-PaPimRoleSettings.ps1` (PA-PIM) | [04](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md) | A1.4, A1.6, A2.1, A2.2, A3.1, D-A3, D-A4, D-A5; Gates 1 to 3 |
| [G5 PIM for Groups](#step-5-pim-for-groups-and-the-prv-groups) | Every PRV group is role-assignable, holds no group, and its members and owners match the reviewed file, each with an end and a ticket | `Invoke-PaPimGroups.ps1` (PA-PG) | [05](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md) | A2.1, A3.3; Gates 2 and 3 |
| [G6 PIM for Azure resources](#step-6-pim-for-azure-resources) | Owner, Contributor and User Access Administrator eligible at every governed scope; at most three subscription Owners | `Invoke-PaAzurePim.ps1` (PA-AZ) | [06](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md) | A0.2, A3.2; Gate 3 |
| [G7 Access reviews](#step-7-review-every-privileged-role-and-group) | Every privileged role and PRV group has a review series on the tier's cadence; decisions are read back as evidence | `Invoke-PaAccessReviews.ps1` (PA-AR) | [07](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md) | A2.7, A3.7, D-A6; Gates 2 and 3 |
| [G8 Evidence and drift](#step-8-keep-evidence-and-drift-on-a-schedule) | The checks run on a schedule; Tier 0 drift is an incident; the period's packages chain with no gap | `Invoke-PaEvidenceRun.ps1`, `pa_evidence.py` (PA-AUD) | [08](../../project-plans/developer-workbooks/privileged-access/08-evidence-and-drift.md) | A1.3, A2.4, A3.6, A4.2, A4.3; Gates 3 and 4 |

: The eight gates of privileged access {.striped .hover}

The deployment runbook for these gates, test then production, is the workbook's [Chapter 09](../../project-plans/developer-workbooks/privileged-access/09-deploying-to-test-and-production.md).

## Step 1: Inventory every privileged assignment {#step-1-inventory-every-privileged-assignment}

You can't make privilege just-in-time until you can list it. A role reaches a person four ways (permanent or time-bound, eligible or active), and a role on a group reaches every member ([Chapter 01](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#what-the-inventory-has-to-hold)).

**Prerequisites.** None in the tenant: the read changes nothing. The tier model (D-A1) drafted, as `config/tiers.json`.

**Steps.**

1. **Read active and eligible, not active alone.** Learn's own all-roles sample lists active assignments only. Under PIM almost every human holder becomes eligible, so an active-only list shrinks as the project succeeds ([Chapter 01, what it leaves to you](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#what-it-leaves-to-you)).
2. **Expand every role-assignable group to its members**, so the people behind `PRV-T0-GlobalAdmin` are counted.
3. **Read Azure at every scope you govern.** Owner, Contributor and User Access Administrator are privileged administrator roles too.[^pag-az-roles] The read covers only the scopes you list; write down the gap to the full hierarchy.
4. **Give every row a tier** from `config/tiers.json`, keyed by role template ID. A role not in the file is Unclassified, never assumed safe *(design guidance)*.
5. **Name the exceptions.** `exceptions.csv` holds only the emergency accounts and service principals that can't activate, each with an owner and a reason. An exception without an owner doesn't count.
6. **Hand the non-human rows to their track.** App registrations and service principals in privileged roles (plan task A0.3) are the [non-person identity guide's Step 4](non-person-identity-implementation.md#directory-roles).

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| AC-2 (account management) and AC-6(5) (privileged accounts restricted to defined roles), Moderate baseline[^pag-moderate] | KSI-IAM-JIT | `inventory.json` and `inventory.csv`: every assignment with its tier, in the access-controlled evidence store |
| AC-6; BOD 25-01 MS.AAD.7.4v1, no permanent active assignment to a highly privileged role, emergency accounts excepted[^pag-bod][^pag-scuba] | KSI-IAM-JIT, KSI-IAM-ELP | PA-INV-01 and PA-INV-07 in `findings.json`; `exceptions.csv`, kept by the governance office |
| MS.AAD.7.1v1, at least two and at most eight Global Administrators[^pag-bod] | KSI-IAM-JIT | PA-INV-04 in `findings.json`. The check flags five or more, Learn's stricter limit,[^pag-best] or fewer than two users |
| AU-9 (protection of audit information) | KSI-MLA-OSM | `manifest.json`: every call, its permission, and each file's SHA-256 |

: Gate 1 requirements and evidence. Mapping from [Chapter 01](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#federal-requirements-and-evidence) {.striped .hover}

The KSI column names the FedRAMP 20x Key Security Indicators whose related SP 800-53 controls include the row's control.[^pag-ksi] KSIs are indicators for cloud service providers: the agency authorizes its own system and lines its evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../b00-orientation/appendix-b-engagement-archetype.md)). Which record supports which indicator is the program's mapping *(design guidance)*.

**Government-cloud availability.** Every Graph call in the read lists the global service, US Government L4 and L5. Entra ID P1 and P2 for GCC are hosted in Azure commercial; Microsoft Entra ID Governance, which PIM needs, is available in GCC, GCC High and DoD ([Chapter 01, which cloud](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#which-cloud-for-this-read)).[^pag-availability] The code takes the cloud as an explicit name, with no default.

**Interim path.** Before the reader app is consented, a Global Reader can download active assignments from the admin center as a CSV; Lab 2 compares it with the inventory. That file has no eligible rows, so it is a cross-check, not the inventory ([Chapter 01](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#what-microsoft-gives-you)).

::: {.callout-important}
## Validate (G1 Privileged inventory)
- **`Invoke-PaInventory.ps1`** reads every Entra role assignment, active and eligible, groups expanded, and the Azure schedules at each scope listed. Pass: every role is classified (no PA-INV-05 without an owner and decision), and every PA-INV-01 and PA-INV-07 Finding has a ticket.
- The counts by state match the admin center's download plus PIM's eligible list.
- Gate owner: the CISO, with the tier model approved (plan Gate 0).
:::

<!-- labs:begin try-g1 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G1 Privileged inventory
- **On a laptop, no tenant:** [Chapter 01, Lab 1](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#lab-1-fixtures-no-tenant) of *Privileged Inventory as Code*
- **In test tenant:** [Chapter 01, Lab 2](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#lab-2-test-tenant)
- **As training:** [Module 1: Inventory every privileged assignment](../../training/privileged-access/01-privileged-inventory.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** Nothing to roll back: the check only reads. Delete lab copies; the inventory names every privileged holder.

## Step 2: Build and test emergency access first {#step-2-build-and-test-emergency-access-first}

This is the one step that can't move. Learn documents the lockout: every Global Administrator and Privileged Role Administrator eligible, approval required, and no approvers, so nobody can approve and administration is locked.[^pag-pim-settings] No role is made eligible and no approval is switched on until this gate passes ([Book 04, Chapter 08, Step 0](../b04-access/08-pim-self-request-with-approval.md#step-0-establish-emergency-access-accounts-first)).

**Prerequisites.** D-A2: the credential type and dual custody. Logs reaching the workspace.

**Steps.**

1. **Build the accounts to Learn's standard,** which Book 04 adopts: two or more cloud-only accounts on `*.onmicrosoft.com`, neither synchronized nor federated; a passkey (FIDO2) or certificate-based authentication, different from the normal administrators' methods; Global Administrator assigned active and permanent in PIM; credentials that don't expire.[^pag-emergency] Book 04 adds dual custody and a post-use review ([Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts)).
2. **Exclude them through one group** from every Conditional Access policy that blocks or restricts sign-in. Nobody else goes in that group: everyone in it skips every policy.
3. **Alert on any use.** Learn's sample alert watches interactive sign-ins only. Add the non-interactive sign-in table and the audit log, matched by object ID, never by name. Learn says new FIDO2 sign-ins that get a refresh token are logged as non-interactive.[^pag-noninteractive] Deploy the alert from the reviewed template at severity 0, any result fires ([Chapter 02, the alert](../../project-plans/developer-workbooks/privileged-access/02-emergency-access-as-code.md#the-alert)).
4. **Drill at least every 90 days.** Sign in, do an administrative task against the current Conditional Access set, record it in `emergency-validations.csv` with a ticket, and tell security operations first.
5. **Record the configuration as code.** `emergency-access.json` names the accounts and the group by object ID. It must match Chapter 01's `exceptions.csv`.

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| AC-2, emergency accounts as a defined account type; MS.AAD.7.3v1, cloud-only privileged accounts; MS.AAD.7.4v1's exception for them[^pag-bod][^pag-scuba] | KSI-IAM-JIT | PA-EA-01 to 05, 07 and 10 in `findings.json` with no Finding |
| IA-2(1), MFA to privileged accounts; MS.AAD.3.6v1, phishing-resistant MFA for highly privileged roles[^pag-bod] | KSI-IAM-APM | PA-EA-06: no phone, app, OATH, email or Temporary Access Pass method |
| AC-2(2): permanent emergency accounts are a documented deviation; drills are part of its compensating controls *(design guidance)* | KSI-IAM-AAM, KSI-IAM-JIT | PA-EA-09 and the drill tickets |
| AC-2(4), AU-6, SI-4: automated audit actions, review and monitoring | KSI-MLA-RVL, KSI-MLA-LET, KSI-IAM-SUS | `emergency-alert.json`, its deployment record, and the alert's firing during a drill |

: Gate 2 requirements and evidence. Mapping from [Chapter 02](../../project-plans/developer-workbooks/privileged-access/02-emergency-access-as-code.md#federal-requirements-and-evidence) {.striped .hover}

**Government-cloud availability.** Passkeys (FIDO2) and certificate-based authentication are available in Azure for US Government.[^pag-availability] The alert template names no host, but its API version and Entra diagnostic settings to an Azure Government workspace weren't confirmed for GCC High (workbook research gaps, row 7).

**Interim path.** If an older account holds only a password, replace it before this gate closes: mandatory MFA for the admin portals stops a password alone from signing in where Microsoft enforces it ([Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md#emergency-access-accounts)). Until the alert is deployed, review the accounts' sign-ins and audit rows by hand every day with the same query *(design guidance)*.

::: {.callout-important}
## Validate (G2 Emergency access)
- **`Invoke-PaEmergencyCheck.ps1`** shows no Finding for any emergency account. Every PA-EA-06 Warn (no passkey) has certificate-based authentication confirmed.
- PA-EA-08 shows every enforced policy excludes the accounts. A report-only policy without the group is Info; it needs the exclusion before it's enforced.
- **VK-CA-01** reports every persona policy excluding the emergency access group.
- The deployed alert matches `emergency-alert.json`, and the last drill fired it.
- Gate owner: the CISO (part of the plan's Gate 1, "emergency access accounts tested").
:::

<!-- labs:begin try-g2 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G2 Emergency access
- **On a laptop, no tenant:** [Chapter 02, Lab 1](../../project-plans/developer-workbooks/privileged-access/02-emergency-access-as-code.md#lab-1-fixtures-no-tenant) of *Emergency Access Accounts as Code*
- **In test tenant:** [Chapter 02, Lab 2](../../project-plans/developer-workbooks/privileged-access/02-emergency-access-as-code.md#lab-2-test-tenant)
- **As training:** [Module 2: Emergency access first](../../training/privileged-access/02-emergency-access-first.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** None for the accounts: they are the rollback for every other gate. An alert rule rolls back by redeploying the previous template.

## Step 3: Put administrators behind Conditional Access {#step-3-put-administrators-behind-conditional-access}

Book 04's Wave 2 is the administrator set of six policies: CA003 (phishing-resistant MFA by group and by role), CA004 (compliant device), CA005 (trusted networks), CA025 (PAW only), CA026 (server and Arc administration) and CA027 (Azure management for operators only). The kit holds five of them; CA026 isn't a file yet. Its activation gate is context `c1` and the policy `PIM-Activation-c1`, which asks again for the strength and a compliant device at the moment of elevation ([Book 04, Chapter 07](../b04-access/07-the-conditional-access-policy-library.md#wave-2-administrators); [Chapter 08, Step 2](../b04-access/08-pim-self-request-with-approval.md#step-2-build-the-authentication-context-and-its-policy)).

**Prerequisites.** Gate G2 passed, and one emergency account signed in. Every administrator has at least one phishing-resistant method registered (plan task A1.2): Learn warns that enforcing first risks locking you out.[^pag-admin-phish]

**Steps.**

1. **Keep every object as a file** in `ca-policies/`: the contexts `c1` and `c2`, the strength `FMP-Privileged-SeparateDevice`, the five Wave 2 policies the kit holds (CA026 isn't built yet), `PIM-Activation-c1` and `ProtectedActions-c2`. A per-tenant map resolves the group and location IDs.
2. **Run the pre-merge check on every pull request.** Every file excludes the emergency group, whatever its state, because a file is enforced by changing one word *(design guidance)*. CA003 targets all 14 roles Learn recommends.[^pag-admin-phish]
3. **Create everything report-only.** The plan creates contexts and the strength before the policies that use them. Every new policy lands report-only.
4. **Read a week of report-only results** in the sign-in log before enforcing ([Book 04, Chapter 10, change control](../b04-access/10-access-as-code-and-evidence.md#change-control)). Learn warns a report-only compliant-device policy can prompt Mac, iOS and Android users for a certificate.[^pag-report-only]
5. **Enforce as its own change,** ring by ring, with an emergency sign-in tested before and after (plan task A2.6). The code needs `-AllowEnforce` for it.
6. **Turn `PIM-Activation-c1` On before G4 selects `c1`.** Learn: create and enable the policy before selecting the context in PIM. If no policy targets the context, PIM falls back to MFA, but not when the policy is off, report-only, or excludes the user. Don't also scope the policy to a directory role: at activation the user doesn't hold it yet.[^pag-pim-settings] Set sign-in frequency to **Every time**; even then a 10-minute window applies across Entra roles, Azure roles and PIM for Groups.[^pag-pim-settings]
7. **Protect the gate itself.** Whoever edits Conditional Access can weaken the gate; Learn says to treat those roles as highly privileged.[^pag-pim-settings] Context `c2` is for protected actions on the Conditional Access permissions (plan task A2.3). The code defines `c2` and its policy but doesn't assign protected actions, which Graph documents only in beta.[^pag-protected]

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| IA-2(1); OMB M-22-09, phishing-resistant MFA;[^pag-m2209] MS.AAD.3.6v1[^pag-bod] | KSI-IAM-APM | The strength file and CA003, with PA-CA-06 and PA-CA-07 clear |
| AC-3 (access enforcement): compliant device, trusted network, PAW, operators only for Azure management | KSI-IAM-ELP | CA004, CA005, CA025 and CA027 in the repository |
| AC-6(1) and AC-6(10): a fresh proof at activation and on protected actions | KSI-IAM-JIT | `PIM-Activation-c1`, `ProtectedActions-c2` and the contexts, with PA-CA-04, 05 and 08 clear |
| CM-3, CM-3(2), CM-4 (change control, testing, impact analysis) | KSI-CMT-LMC, KSI-CMT-RMV, KSI-CMT-VTD | The pull request's check run, `plan.json` and `requests.json`, the report-only sign-in review, and each apply's `manifest.json` |

: Gate 3 requirements and evidence. Mapping from [Chapter 03](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#federal-requirements-and-evidence) {.striped .hover}

**Government-cloud availability.** Conditional Access and PIM are available in Azure for US Government; the policy, context, strength and template calls list L4 and L5.[^pag-availability] In Azure Government, Azure management is a different application from the one CA025 and CA027 name, so a GCC High program changes those two files ([Book 04, Chapter 07](../b04-access/07-the-conditional-access-policy-library.md#government-cloud-notes)). Protected actions' availability in the US Government clouds isn't stated on the pages read (research gaps, row 38).

**Interim path.** Where PAWs aren't issued yet, D-A7 allows enforcing CA004 and CA025 with a time-bound exclusion group for those administrators ([plan, decisions](../../project-plans/privileged-access.md#decision-points)). Until protected actions are assigned, G8's drift comparison is what catches an edit to the gate.

::: {.callout-important}
## Validate (G3 Conditional Access for administrators)
- **`Invoke-PaCaAdmin.ps1 -CheckOnly`** reads the files only and exits 0 with no Finding. On the repository as merged it shows five Warn while the gate and three compliant-device policies are report-only.
- The dry run (no `-Apply`) against the tenant shows NoChange for every file, and `PIM-Activation-c1` On, so PA-CA-04 is clear.
- Gate owner: the CISO, after the report-only review (plan Gates 1 and 2).
:::

<!-- labs:begin try-g3 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G3 Conditional Access for administrators
- **On a laptop, no tenant:** [Chapter 03, Lab 1](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#lab-1-fixtures-no-tenant) of *Conditional Access for Administrators and the Activation Gate*
- **In test tenant:** [Chapter 03, Lab 2](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md#lab-2-test-tenant)
- **As training:** [Module 3: Conditional Access for administrators and the activation gate](../../training/privileged-access/03-conditional-access-and-the-activation-gate.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** Change the file's state to report-only or disabled and apply. Never delete ([Book 04, Chapter 07, rollback](../b04-access/07-the-conditional-access-policy-library.md#rollback)).

## Step 4: PIM for Microsoft Entra roles {#step-4-pim-for-microsoft-entra-roles}

Each role has its own settings, and in Graph each role's policy has 17 rules with fixed IDs. The program manages the seven activation and assignment rules and leaves notifications alone ([Chapter 04](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-context-the-code-depends-on)).

**Prerequisites.** G2 passed. G3's `PIM-Activation-c1` On. Approver groups built with at least two approvers per tier (D-A3, plan task A1.4). D-A4, the write path.

**Steps.**

1. **Hold Appendix B as one file per role**, 22 in all, with the tier caps in `tiers.json` ([Appendix B](../b04-access/appendix-b-pim-role-settings.md)). Activation is at most four hours for Tier 0 and eight for the rest; Learn's pages give one to 24 hours and at most eight, and the code follows the stricter.[^pag-pim-settings][^pag-pim-api] An active assignment lasts at most 15 days, the owner's decision.
2. **Name approvers by group**, never leave the list empty, and never let the approver group be the role's eligible group. With no approvers, the active Privileged Role and Global Administrators become the approvers, and under PIM there are none.[^pag-pim-settings]
3. **Plan one wave as a dry run.** Wave 1 is Tier 1 (D-A5), then Tier 0, Tier 2 and read-only. The plan refuses a wave until the earlier ones match their files. Keep `before.json` from the run: it is the back-out.
4. **Apply from the reviewed plan.** Rule updates go first, then eligibility for the `PRV` groups, so each request meets the new rule. `-Apply` also needs `-ActivationGateChecked`: a person's statement that G3 shows the gate On, because v1.0 can't read it (research gaps, row 44).
5. **Convert standing assignments**: eligible first, activation confirmed with a ticket, then remove the active assignment ([Book 04, Chapter 08, Step 5](../b04-access/08-pim-self-request-with-approval.md#step-5-convert-standing-assignments-to-eligible)). Only `-Apply -Convert` removes, with its own permission. Emergency accounts and documented exceptions are never planned for removal.
6. **Run Book 04's validation test plan** after the build and after any change ([Book 04, Chapter 08](../b04-access/08-pim-self-request-with-approval.md#validation-test-plan)).

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| AC-6 and AC-2: least privilege in time; conditions for role membership | KSI-IAM-JIT | The role files and `tiers.json`, with PA-PIM-04 clear |
| AC-3; MS.AAD.7.6v1, approval to activate Global Administrator[^pag-bod] | KSI-IAM-JIT | `global-administrator.json` and its rows in `diff.csv` |
| AC-5 (separation of duties): no approver group approves its own role; reader and writer are different identities | KSI-IAM-JIT | PA-PIM-03 clear; the two apps' consent records |
| AC-6(5); MS.AAD.7.4v1 and MS.AAD.7.5v1, no permanent active assignment and provisioning only through a PAM system[^pag-bod] | KSI-IAM-JIT | PA-PIM-08 and PA-PIM-09; `confirmed-activations.csv` with tickets |
| AU-6; MS.AAD.7.7v1 and MS.AAD.7.8v1, an alert on every eligible or active highly privileged assignment and on Global Administrator activation[^pag-bod] | KSI-MLA-RVL | PA-PIM-10 to PA-PIM-13 clear in `out/pim-alerts/findings.json` |
| CM-3 and CM-4(2): the change reviewed, applied in order, and verified | KSI-CMT-LMC, KSI-CMT-RMV, KSI-CMT-VTD | `plan.json`, `diff.csv`, `before.json`, an empty `verify.csv`, and `manifest.json` with each write body's SHA-256 |

: Gate 4 requirements and evidence. Mapping from [Chapter 04](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#federal-requirements-and-evidence) {.striped .hover}

**Government-cloud availability.** Every call is Graph v1.0 and lists the global service, L4 and L5; PIM is available in Azure for US Government.[^pag-availability] The authentication context on activation is labeled preview on two Learn pages and generally available in the release notes; the workbook treats it as preview (research gaps, row 42).

**Interim path.** Book 04's [Appendix B script](../b04-access/appendix-b-pim-role-settings.md#applying-a-tiers-settings-with-powershell) applies five rules to a list of roles with `-WhatIf`. Use it only for a role the code doesn't cover yet, and record the change for G8's drift baseline *(design guidance)*.

::: {.callout-important}
## Validate (G4 PIM for Entra roles)
- **`Invoke-PaPimRoleSettings.ps1`**, as a dry run by the reader app, shows an empty `diff.csv` for every applied wave and no Finding: PA-PIM-01 (approval with no approver) and PA-PIM-02 (emergency accounts) clear.
- PA-PIM-09 lists no standing human assignment outside an exception in the converted waves.
- **`Invoke-PaPimAlertCheck.ps1`** reports no PA-PIM-10 (a highly privileged role with no added recipient on its assignment alert, MS.AAD.7.7v1) and no PA-PIM-11 (Global Administrator activation with no added recipient, MS.AAD.7.8v1). For each group that holds one of those roles, such as a PRV group, it reports no PA-PIM-12 or PA-PIM-13: the same two alerts on the group's PIM for Groups member policy, as CISA's baseline asks. It only reads ([Chapter 04](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-alert-check)).
- Book 04's validation tests 1 to 12 pass for the pilot class (plan task A2.8). Tests 13 and 14 wait: 13 needs protected actions assigned and 14 needs PAWs issued, which Step 3's interim path allows to come later.
- Gate owner: the CISO (plan Gate 2 for the pilot class, Gate 3 for every tier).
:::

<!-- labs:begin try-g4 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G4 PIM for Entra roles
- **On a laptop, no tenant:** [Chapter 04, Lab 1](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#lab-1-fixtures-no-tenant) of *PIM for Microsoft Entra Roles as Code*
- **In test tenant:** [Chapter 04, Lab 2](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#lab-2-test-tenant)
- **As training:** [Module 4: PIM for Microsoft Entra roles as code](../../training/privileged-access/04-pim-for-entra-roles.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** `-Apply -RestoreFrom <run folder>` puts back the rules that run's `before.json` recorded and removes the eligibility it created. A removed standing assignment comes back only by an approved change with an end date.

## Step 5: PIM for Groups and the PRV groups {#step-5-pim-for-groups-and-the-prv-groups}

Two Microsoft features meet in a PRV group. Only a group created role-assignable can hold an Entra role; the property can't be changed later, and a tenant has at most 500 such groups.[^pag-rag] PIM for Groups governs just-in-time membership and ownership of a group, but not of a dynamic or synchronized group.[^pag-pim-groups] For an Entra role the group holds an eligible assignment; for privilege that isn't an Entra role, members are eligible for the group itself ([Chapter 05](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#what-the-prv-groups-have-to-hold)).

**Prerequisites.** G4's wave for the roles the groups hold. The approver groups.

**Steps.**

1. **Create each PRV group by hand**, as a Privileged Role Administrator, role-assignable, with assigned membership. The pipeline only plans the creation, so its app never holds `RoleManagement.ReadWrite.Directory` *(design guidance)*.
2. **Hold `prv-groups.json` as the reviewed file**: each group, its tier, what it holds, and its members and owners, each active or eligible, with an end date and a ticket.
3. **No group in a PRV group, and no eligible service principal.** An eligible group hides its people from the review; service principals can't activate.
4. **No owners on a Tier 0 group,** because owners manage membership. Elsewhere, never eligible owners without an active owner: Learn says the last active owner can't be removed, so the activation can't be ended.[^pag-pim-groups]
5. **Approval for Tier 0 and Tier 1 activation**, by the tier's group, at most four hours for Tier 0 and eight for Tier 1 *(design guidance, from Appendix B)*.
6. **Plan, review, apply.** Rules go first, then grants, then removals. The apply refuses more than five removals by default, the sign of a truncated file. Every member and owner policy selects the authentication context `c1`, the activation gate from G3, so `-Apply` also refuses a plan that selects it unless you pass `-ActivationGateChecked`, a person's statement that `PIM-Activation-c1` is On ([Chapter 05](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md)).
7. **Defer access packages for PRV membership** (plan task A3.3). When they come, an access package's expiration must not exceed the group's own eligibility expiry ([Chapter 05](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#what-the-prv-groups-have-to-hold)).

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| AC-6(5); MS.AAD.7.5v1[^pag-bod] | KSI-IAM-JIT | PA-PG-01, 02, 03 and 05 clear: named for its tier, role-assignable, assigned, no nested group |
| AC-6, AC-5; MS.AAD.7.4v1[^pag-bod] | KSI-IAM-JIT | PA-PG-06, 07 and 08 clear: every grant ends, Tier 0 groups have no owners, no group approves itself |
| AC-2: access nobody reviewed is found | KSI-IAM-JIT | PA-PG-09: schedules and groups outside the file |
| CM-3, CM-4(2) | KSI-CMT-LMC, KSI-CMT-VTD | `diff.txt`, `plan.json`, `results.json`, and a rerun showing no change |

: Gate 5 requirements and evidence. Mapping from [Chapter 05](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#federal-requirements-and-evidence) {.striped .hover}

**Government-cloud availability.** Every PIM for Groups API page read lists the global service, L4 and L5; Entra ID Governance is available in GCC, GCC High and DoD.[^pag-availability]

**Interim path.** Until the PRV groups are in PIM for Groups, assign members directly with an end date in the reviewed file, and review the groups in G7 *(design guidance)*.

::: {.callout-important}
## Validate (G5 PIM for Groups)
- **`Invoke-PaPimGroups.ps1`**, as a dry run with the four read permissions, shows `Plan: 0 change(s)` and no Finding.
- PA-PG-04 warns at 450 role-assignable groups, before the limit bites.
- Gate owner: the CISO (plan Gates 2 and 3).
:::

<!-- labs:begin try-g5 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G5 PIM for Groups
- **On a laptop, no tenant:** [Chapter 05, Lab 1](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#lab-1-fixtures-no-tenant) of *PIM for Groups and the PRV Groups*
- **In test tenant:** [Chapter 05, Lab 2](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md#lab-2-test-tenant)
- **As training:** [Module 5: PIM for Groups and the PRV groups](../../training/privileged-access/05-pim-for-groups.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** Restore the previous `prv-groups.json` from Git and apply it; the plan converges the tenant back. A group can't be taken back out of PIM once onboarded.[^pag-pim-groups-api]

## Step 6: PIM for Azure resources {#step-6-pim-for-azure-resources}

PIM for Azure resources runs through Azure Resource Manager, not Graph. The caller needs at least Owner or User Access Administrator on the resource.[^pag-pim-apis] Role settings aren't inherited: a subscription's settings don't reach its resource groups.[^pag-az-settings]

**Prerequisites.** G1's Azure rows. The governed scopes chosen: every management group, subscription and resource group you'll set.

**Steps.**

1. **Write the desired state**: governed scopes, roles, settings per tier, eligible holders, and allowed standing assignments with owners. Tier 0 activates for four hours and Tier 1 for eight, with approval, a ticket, bounded eligibility and no permanent active assignment *(design guidance, from Appendix B)*.
2. **Set every governed scope.** A resource group left out keeps whatever settings it has.
3. **Plan as Reader.** Policies first, then new eligibility, then removal of standing Owner, Contributor and User Access Administrator. Eligible first, so no holder loses the role before they can activate it.
4. **Leave service principals and managed identities standing**, with an owner and a reason: they can't be made eligible.[^pag-az-integration]
5. **Apply as User Access Administrator, time-bound,** never Owner. The plan never removes the applying identity's own standing assignment; decide it last, from another session.
6. **Remove root-scope User Access Administrator.** A Global Administrator who elevates gets it on every subscription; Book 04 treats it as a Tier 0 event.[^pag-elevate]
7. **Keep at most three Owners per subscription**, Microsoft's best practice.[^pag-az-best]

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| AC-6, AC-6(1): each tier's settings | KSI-IAM-JIT | The `~` lines in `diff.txt` against `desired.json` |
| AC-6, AC-6(5), AC-2: standing privilege, root elevation, too many Owners | KSI-IAM-JIT, KSI-IAM-ELP | PA-AZ-01 to 06 in `findings.json`, each Finding with a decision and ticket |
| CM-3, CM-4(2) | KSI-CMT-LMC, KSI-CMT-VTD | `state.json` (the back-out), `plan.json`, and an empty `diff-after.txt` |

: Gate 6 requirements and evidence. Mapping from [Chapter 06](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#federal-requirements-and-evidence). BOD 25-01's Entra ID policies cover Entra roles, not Azure roles {.striped .hover}

**Government-cloud availability.** Entra ID Governance is available in GCC, GCC High and DoD.[^pag-availability] No Learn page read states the PIM Resource Manager API's availability in Azure Government (research gaps, row 65). The API version is `2020-10-01`. The older `/beta/privilegedAccess/azureResources` endpoint is deprecated; Learn still says, as of November 2, 2026, that it "will stop returning data on October 28, 2026," a date now past. Don't use it.[^pag-pim-apis]

**Interim path.** Until a scope is governed, G1's inventory reports its standing Owners (PA-INV-01, PA-INV-08) on every run, and each one carries a ticket *(design guidance)*.

::: {.callout-important}
## Validate (G6 PIM for Azure resources)
- **`Invoke-PaAzurePim.ps1`**, as a dry run with Reader, shows no difference at any governed scope and no PA-AZ-01 Finding. Every PA-AZ-02, 03 and 05 has a decision.
- No subscription has more than three Owners (PA-AZ-06).
- Gate owner: the CISO (plan Gate 3, task A3.2).
:::

<!-- labs:begin try-g6 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G6 PIM for Azure resources
- **On a laptop, no tenant:** [Chapter 06, Lab 1](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#lab-1-fixtures-no-tenant) of *PIM for Azure Resources*
- **In test tenant:** [Chapter 06, Lab 2](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#lab-2-test-tenant)
- **As training:** [Module 6: PIM for Azure resources](../../training/privileged-access/06-pim-for-azure-resources.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** Remove what the run added and restore each policy from the run's `state.json` ([Chapter 06, Lab 2](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md#lab-2-test-tenant)).

## Step 7: Review every privileged role and group {#step-7-review-every-privileged-role-and-group}

The approval gate controls the use of privilege; reviews control who keeps it. Book 04 sets one series per role, Tier 0 monthly and the rest quarterly (D-A6), plus a series for each `PRV-*` group, because a role review of a group shows the group, not its members ([Book 04, Chapter 09, cadence](../b04-access/09-access-governance.md#cadence)).

**Prerequisites.** G4 and G5 for the roles and groups reviewed. Entra ID Governance licenses.

**Steps.**

1. **Hold every series in one file**, named `PAR-...`, with reviewers who aren't the assignees, a fallback reviewer, auto-apply, justification, and the tier's cadence. A monthly review lasts at most 27 days.[^pag-ar-pim-review]
2. **Remove access on silence, except one series.** A Global Administrator review with "remove access" on silence would remove the emergency accounts' permanent assignment in one missed month. That series uses "no change," and an unreviewed item becomes an evidence finding (PA-AR-06, the owner's decision). Learn cautions that auto-apply with a default decision can revoke all access.[^pag-ar-settings]
3. **Give each PRV group its own membership series.** Reviews of PIM for Groups groups are a preview feature.[^pag-ar-pim-groups]
4. **Plan, review, apply.** The code creates and updates; it never deletes, because deleting a series deletes its decisions. A scope change is left to a person.
5. **Read the decisions back** after each instance closes: `decisions.csv` and the evidence findings.
6. **Azure role series** go through a Resource Manager API Learn publishes only in preview; the code sends them only with `-IncludePreview`.[^pag-ar-arm]

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| AC-6(7) and AC-2: privileges reviewed at a defined frequency and removed when not needed. Both leave the frequency to the agency; D-A6 sets it | KSI-IAM-AAM, KSI-IAM-JIT | The series file; PA-AR-01, 02, 05, 08, 09 and 14 clear |
| AC-5: no self-review | KSI-IAM-JIT | PA-AR-01 and PA-AR-E06 |
| AC-6(7), AC-2: decisions applied | KSI-IAM-AAM, KSI-IAM-JIT | `decisions.csv`, `instances.json`, PA-AR-E01 to E08 |
| AU-11: decisions kept beyond the series | KSI-MLA-OSM | The evidence exported before any series is replaced |

: Gate 7 requirements and evidence. Mapping from [Chapter 07](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#federal-requirements-and-evidence) {.striped .hover}

**Government-cloud availability.** Entra ID Governance is available in GCC, GCC High and DoD; the Graph access reviews APIs list L4 and L5.[^pag-availability] The Azure role review API's availability in Azure Government wasn't confirmed (research gaps, row 72).

**Interim path.** Until the Azure series run, G1's inventory and G6's PA-AZ-04 are the monthly check on Azure eligibility; the subscription owner attests in the ticket *(design guidance)*.

::: {.callout-important}
## Validate (G7 Access reviews)
- **`Invoke-PaAccessReviews.ps1 -Mode Plan`** (GET only) shows NoChange for every series and no Finding.
- **`Invoke-PaAccessReviews.ps1 -Mode Evidence`** shows a closed instance within 35 days for monthly series and 100 days for quarterly ones (PA-AR-E02), every denial applied (PA-AR-E03) and no emergency account denied (PA-AR-E08).
- Gate owner: the identity governance officer (plan tasks A2.7 and A3.7).
:::

<!-- labs:begin try-g7 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G7 Access reviews
- **On a laptop, no tenant:** [Chapter 07, Lab 1](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#lab-1-fixtures-no-tenant) of *Access Reviews of Privileged Roles*
- **In test tenant:** [Chapter 07, Lab 2](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md#lab-2-test-tenant)
- **As training:** [Module 7: Access reviews of privileged roles](../../training/privileged-access/07-access-reviews.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** An update applies only to future instances; revert the file and apply. Export the evidence before a person replaces or deletes any series.

## Step 8: Keep evidence and drift on a schedule {#step-8-keep-evidence-and-drift-on-a-schedule}

Configuration evidence proves a setting existed; operational evidence proves it did its job ([Book 04, Chapter 10](../b04-access/10-access-as-code-and-evidence.md#what-the-assessor-reads)). A drift on a Tier 0 object is a security incident ([Book 04, Chapter 10](../b04-access/10-access-as-code-and-evidence.md#drift-detection-and-closure)).

**Prerequisites.** G1 and G2's checks running clean. Logs in the workspace. An evidence store with a locked time-based retention policy.

**Steps.**

1. **Schedule the run.** `Invoke-PaEvidenceRun.ps1` runs G1's inventory, G2's check and a PIM audit read, and writes one folder with `run.json`. The plan's A3.6 sets drift every six hours; the sample workflow runs daily *(design guidance)*.
2. **Read the audit before it expires.** Graph keeps 30 days. Each window starts where the last ended, so no hour goes unread. Correlate an activation by `roleAssignmentRequestId`, which stays the same across approval and scheduled start.[^pag-pim-audit]
3. **Act on the audit findings.** PA-AUD-01: a role assigned outside PIM, which Learn rates high risk. PA-AUD-02: a Tier 0 or Tier 1 activation with no approval. PA-AUD-03: self-approval. PA-AUD-04: a PIM setting changed, which Learn says always to alert on for the top roles.[^pag-secops]
4. **Compare by fingerprint.** `pa_evidence.py compare` marks Tier 0 drift as an incident. A task that failed stays unverified, never resolved.
5. **Keep names out of the tracker.** Issue drafts carry rule titles and object IDs; names stay in the evidence store.
6. **Package and chain.** `pa_evidence.py package` writes a manifest, `SHA256SUMS` and the previous package's hash. `period` assembles the month for the plan's Gate 4.
7. **Route the PIM alerts** (plan task A2.4): the assigned-outside-PIM alert reaches the SIEM ([Book 04, Chapter 08, Step 7](../b04-access/08-pim-self-request-with-approval.md#step-7-notifications-and-pim-alerts)).

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| CA-7 (continuous monitoring) | KSI-MLA-EVC | One folder per run; the drift report; the period summary |
| AC-6(9), AC-2(4), AU-11: privileged functions logged and kept | KSI-MLA-LET, KSI-IAM-JIT, KSI-MLA-OSM | `pim-audit/events.json`, `requests.json`, `summary.json` |
| AU-6; MS.AAD.7.5v1 and MS.AAD.7.6v1[^pag-bod] | KSI-MLA-RVL | PA-AUD-01 and PA-AUD-02 |
| AC-5, CM-3 | KSI-IAM-JIT, KSI-CMT-LMC | PA-AUD-03 and PA-AUD-04, each reconciled with a reviewed change |
| SI-4, IR-4: Tier 0 drift as an incident | KSI-MLA-EVC, KSI-IAM-SUS | Each Tier 0 incident by fingerprint, matched to its incident record |
| AU-9 | KSI-MLA-OSM | `EVIDENCE-MANIFEST.json`, `SHA256SUMS`, and `pa_evidence.py verify` output |

: Gate 8 requirements and evidence. Mapping from [Chapter 08](../../project-plans/developer-workbooks/privileged-access/08-evidence-and-drift.md#federal-requirements-and-evidence) {.striped .hover}

**Government-cloud availability.** List directoryAudits is available in the global service, L4 and L5; Entra ID Governance in GCC, GCC High and DoD.[^pag-availability] The sample workflow signs in with a federated credential; in Azure Government its audience differs ([Chapter 08, verified facts](../../project-plans/developer-workbooks/privileged-access/08-evidence-and-drift.md#verified-facts)).

**Interim path.** Until G3 to G7's outputs join the run (research gaps, row 88), run each chapter's dry run on the same schedule and file its `manifest.json` with the package *(design guidance)*. A gap older than 30 days can only be read from the workspace; attach it to the package by hand.

::: {.callout-important}
## Validate (G8 Evidence and drift)
- **`Invoke-PaEvidenceRun.ps1`** shows all three tasks `OK` in `run.json`, with nine read permissions and nothing that writes.
- **`pa_evidence.py verify`** passes on the newest package, and `period` shows no chain break and no coverage gap.
- Every Tier 0 incident in the period has an incident record. The authorizing official accepts the residual standing privilege, named with a rationale (plan task A4.2).
- Gate owner: the CISO (plan Gates 3 and 4). Recurring.
:::

<!-- labs:begin try-g8 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G8 Evidence and drift
- **On a laptop, no tenant:** [Chapter 08, Lab 1](../../project-plans/developer-workbooks/privileged-access/08-evidence-and-drift.md#lab-1-fixtures-no-tenant) of *Evidence and Drift for the ISSO*
- **In test tenant:** [Chapter 08, Lab 2](../../project-plans/developer-workbooks/privileged-access/08-evidence-and-drift.md#lab-2-test-tenant)
- **As training:** [Module 8: Evidence and drift for the ISSO](../../training/privileged-access/08-evidence-and-drift.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** None. This is the standing loop. A wrong drift is closed at the source: redeploy the repository's version, or back-port an intended change through a pull request ([Book 04, Chapter 10](../b04-access/10-access-as-code-and-evidence.md#drift-detection-and-closure)).

## Dangers and how to avoid them {#dangers}

| Danger | What goes wrong | Mitigation |
|---|---|---|
| **Approval before emergency access** | The documented lockout: nobody can approve, and nobody is active[^pag-pim-settings] | G2 first; PA-PIM-02 blocks every G4 write until the accounts hold Global Administrator |
| **`c1` selected while its policy is report-only** | No gate, and no MFA fallback either[^pag-pim-settings] | PA-CA-04; `-ActivationGateChecked` only after G3 shows it On |
| **An active-only inventory** | The list shrinks as holders become eligible, and Gate 0 passes on an empty table | Read eligibility (G1) |
| **A review that removes the emergency accounts** | One missed month removes Global Administrator from the accounts kept for the day everything else fails | PA-AR-06; "no change" on that series; PA-AR-E08 |
| **Eligible owner, no active owner** | The owner activates and can't be deactivated[^pag-pim-groups] | PA-PG-07 and guard G4 |
| **A standing Azure Owner removed before eligibility exists** | The holder loses access mid-task | Eligible first, removal last, in one ordered plan (G6) |
| **Whoever edits Conditional Access edits the gate** | The activation gate is weakened | Conditional Access Administrator is Tier 0; protected actions on `c2`; G8's drift |
| **A day nobody read** | An activation in the gap has no evidence | Each audit window starts where the last ended; coverage gaps reported |
| **An alert nobody reads** | MS.AAD.7.7v1 and MS.AAD.7.8v1 ask for alerts on highly privileged assignments and on Global Administrator activation ([Book 02, Appendix A](../b02-identity/appendix-a-federal-requirements-crosswalk.md#cisa-bod-25-01-and-the-scuba-baselines)); PA-PIM-10 to PA-PIM-13 prove a recipient is set, not that the mail arrives or is acted on | Send the recipient to a monitored mailbox; route PIM's own alerts to the SIEM (A2.4); test with one activation in the test tenant |
| **Names in the tracker** | Privileged holders listed for everyone with repository access | Rule titles and object IDs only (G8) |

: Dangers in privileged access {.striped .hover}

## Evidence {#evidence}

Each gate's table names what the ISSO keeps. Together they make one file:

| Gate | Evidence | Key requirements | KSIs |
|---|---|---|---|
| G1 | Inventory, findings, exceptions, manifest | AC-2, AC-6, AC-6(5); MS.AAD.7.1v1, 7.4v1 | KSI-IAM-JIT, KSI-IAM-ELP, KSI-MLA-OSM |
| G2 | Emergency findings, drill records, the alert template and its firings | AC-2, AC-2(2), AC-2(4), IA-2(1), AU-6, SI-4; MS.AAD.3.6v1, 7.3v1 | KSI-IAM-JIT, KSI-IAM-APM, KSI-IAM-AAM, KSI-MLA-RVL, KSI-MLA-LET, KSI-IAM-SUS |
| G3 | Policy files, check runs, plans, report-only review | IA-2(1), AC-3, AC-6(1), AC-6(10), CM-3, CM-4; MS.AAD.3.6v1 | KSI-IAM-APM, KSI-IAM-ELP, KSI-IAM-JIT, KSI-CMT-LMC |
| G4 | Role files, plan, `before.json`, `verify.csv`, conversion tickets, the alert check's findings | AC-2, AC-3, AC-5, AC-6, AC-6(5), AU-6, CM-3, CM-4(2); MS.AAD.7.4v1, 7.5v1, 7.6v1, 7.7v1, 7.8v1 | KSI-IAM-JIT, KSI-MLA-RVL, KSI-CMT-LMC, KSI-CMT-VTD |
| G5 | `prv-groups.json`, findings, plan and results | AC-2, AC-5, AC-6, AC-6(5), CM-3; MS.AAD.7.4v1, 7.5v1 | KSI-IAM-JIT, KSI-CMT-LMC |
| G6 | Desired state, `state.json`, findings, `diff-after.txt` | AC-2, AC-6, AC-6(1), AC-6(5), CM-3, CM-4(2) | KSI-IAM-JIT, KSI-IAM-ELP, KSI-CMT-VTD |
| G7 | Series file, decisions, instances, evidence findings | AC-2, AC-5, AC-6(7), AU-11 | KSI-IAM-AAM, KSI-IAM-JIT, KSI-MLA-OSM |
| G8 | Runs, drift reports, packages, period summary, incident records | CA-7, AC-6(9), AU-6, AU-9, AU-11, SI-4, IR-4; MS.AAD.7.5v1, 7.6v1 | KSI-MLA-EVC, KSI-MLA-RVL, KSI-MLA-OSM, KSI-IAM-SUS |

: Evidence by gate {.striped .hover}

Every control named is in the NIST SP 800-53B Moderate baseline.[^pag-moderate] AC-2(7) isn't, and an agency that tailors it in can point to the same rows ([Chapter 01](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md#federal-requirements-and-evidence)). OMB M-22-09 asks agencies to move toward more granular, dynamically defined permissions; time-bound privilege is the program's choice, not its mandate ([Chapter 04](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#federal-requirements-and-evidence)). Book 04's [assessment evidence](../b04-access/08-pim-self-request-with-approval.md#assessment-evidence) and [control mapping](../b04-access/08-pim-self-request-with-approval.md#control-mapping-fedramp-moderate) carry the rest. File every check run with its date, tenant and kit version.

## Rollback

| Gate | Rollback |
|---|---|
| G1 Inventory | None: read-only |
| G2 Emergency access | None for the accounts; redeploy the previous alert template |
| G3 Conditional Access | Policy back to report-only or disabled through its file; never delete |
| G4 PIM for Entra roles | `-Apply -RestoreFrom` the run's `before.json` |
| G5 PIM for Groups | Apply the previous `prv-groups.json` |
| G6 Azure PIM | Remove what the run added; restore policies from `state.json` |
| G7 Access reviews | Revert the file and apply; export evidence before any replacement |
| G8 Evidence and drift | Standing loop: close each drift at the source |

: Rollback by gate {.striped .hover}

## Checklist

- [ ] Every Entra and Azure privileged assignment inventoried, active and eligible, with a tier; exceptions owned (G1)
- [ ] Two or more emergency accounts meet the standard, excluded through one group, alerted on, drilled within 90 days (G2)
- [ ] Administrator policies and the activation gate held as files, created report-only, enforced as their own change; `PIM-Activation-c1` On (G3)
- [ ] Every role's settings match its file, approvers named, standing human assignments converted wave by wave (G4)
- [ ] PRV groups role-assignable, no nested groups, no Tier 0 owners, every grant with an end and a ticket (G5)
- [ ] Azure Owner, Contributor and User Access Administrator eligible at every governed scope; at most three Owners (G6)
- [ ] Every privileged role and PRV group reviewed on the tier's cadence, the Global Administrator series on "no change" (G7)
- [ ] Evidence runs scheduled, chained with no gap; Tier 0 drift handled as an incident; residual privilege accepted (G8)

## What couldn't be verified {#what-couldnt-be-verified}

- **The alert check's reach (MS.AAD.7.7v1, MS.AAD.7.8v1).** `Invoke-PaPimAlertCheck.ps1` reads the PIM notification settings of the eight highly privileged roles ([Chapter 04](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md#the-alert-check)). It reads the same settings in the PIM for Groups member policy of each group that holds one of those roles, as CISA's baseline asks. That a recipient is set doesn't show the mail arrives; only a live activation in the test tenant does. The check hasn't been run in GCC High or DoD, where the PIM for Groups read isn't confirmed either (Chapter 04's research gaps, row 113).
- **G3 to G7 in the scheduled run.** The evidence run reads the inventory, emergency access and the PIM audit only. Conditional Access, PIM settings, PIM for Groups, Azure PIM and reviews aren't in it yet (research gaps, row 88).
- **Azure PIM activations and elevate access in the audit evidence.** The directory audit log covers Entra roles; the run doesn't read Azure's own logs, and no alert is built on the elevate-access event (rows 69 and 89).
- **Azure Government.** Not confirmed: the alert template's API version (row 7), the PIM Resource Manager API (row 65), the Azure review API (row 72), and protected actions (row 38).
- **Stages.** The authentication context on activation is preview on two Learn pages and generally available in the release notes (row 42). Reviews of PIM for Groups groups are preview.
- **Service principal members of PRV groups.** Graph v1.0 doesn't return them as group members, so the inventory doesn't list them (row 91).
- **Where approvals are logged.** If an approval is logged only under the access review service, PA-AUD-02 fires: it fails closed (row 85).
- **CA026.** Book 04's Wave 2 has six policies; the kit holds five, because CA026 isn't a file yet (plan task A2.5 covers CA025 to CA027).
- **PRV membership through access packages** (plan task A3.3) isn't built (row 58).
- **The deployment runbook.** The workbook's [Chapter 09](../../project-plans/developer-workbooks/privileged-access/09-deploying-to-test-and-production.md) takes the gates to a test tenant and then production, but it hasn't been run against a live tenant.
- **Tenant behavior.** Nothing in this guide was run in a tenant. The checks are fixture-tested, and every Lab 2 is unrun by the authors.

The row numbers are the workbook's [research gaps log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/project-plans/developer-workbooks/privileged-access/_verification/research-gaps.md).

## Back to the books

[Book 04](../b04-access/index.md) · [Book 04, Chapter 04](../b04-access/04-privileged-roles-and-tiers.md) · [Book 04, Chapter 08](../b04-access/08-pim-self-request-with-approval.md) · [Book 04, Chapter 10](../b04-access/10-access-as-code-and-evidence.md) · [Appendix B](../b04-access/appendix-b-pim-role-settings.md) · [Privileged Access & Administrative Identity plan](../../project-plans/privileged-access.md) · [Building Privileged Access](../../project-plans/developer-workbooks/privileged-access/index.md) (the developer workbook) · [Non-person identity guide](non-person-identity-implementation.md) · [Privileged Access Management book](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_III_Book_01_Privileged_Access_Management.md) (PAW hardware baseline)

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 2.0**, in [edition 2026.11.5](../../about/archive.md#edition-2026-11-5) (November 8, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/privileged-access-implementation.md).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 2.0 | [2026.11.5](../../about/archive.md#edition-2026-11-5) | 2026-11-08 | Release 2.0, the baseline: checked against every other book; Draft becomes Baseline; Edition 2026.11.4: record the edition and point deck links at it ([#362](https://github.com/WhalerMike/modernization-workbook/pull/362)); Guides and explainers: fix inconsistency findings (Oracle platform, Wave 2 count, emergency class, name change, contractor source) ([#442](https://github.com/WhalerMike/modernization-workbook/pull/442)); Decisions pass: guides, reference and training ([#455](https://github.com/WhalerMike/modernization-workbook/pull/455)); Approve 116 gated pages (Nov 7); fix RMF map stale-review test ([#457](https://github.com/WhalerMike/modernization-workbook/pull/457)); Consistency read D: Books 15-19, guides, non-book pages ([#483](https://github.com/WhalerMike/modernization-workbook/pull/483)); Approve 15 gated pages (Nov 8, after the consistency read) ([#490](https://github.com/WhalerMike/modernization-workbook/pull/490)) |
| 1.2 | [2026.11.4](../../about/archive.md#edition-2026-11-4) | 2026-11-05 | Deck and audio links point at edition 2026.11.4 |
| 1.1 | [2026.11.3](../../about/archive.md#edition-2026-11-3) | 2026-11-05 | Privileged Access: fixes found preparing a live test-tenant run ([#332](https://github.com/WhalerMike/modernization-workbook/pull/332)); Review gate: Mike's approval of the 15 implementation guides gated on November 3 ([#348](https://github.com/WhalerMike/modernization-workbook/pull/348)) |
| 1.0 | [2026.11.2](../../about/archive.md#edition-2026-11-2) | 2026-11-02 | Privileged Access implementation guide: eight gates, emergency access first ([#325](https://github.com/WhalerMike/modernization-workbook/pull/325)); Privileged Access kit: PIM alert check covers PIM for Groups (PA-PIM-12, PA-PIM-13) ([#328](https://github.com/WhalerMike/modernization-workbook/pull/328)) |

: Versions of this guide, newest first {.striped .hover}

<!-- revisions:end -->

[^pag-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments>, and "Compare Azure Government and global Azure," guidance for developers, <https://learn.microsoft.com/azure/azure-government/compare-azure-government-global-azure> (accessed Oct 30, 2026, as read for the workbook's Chapter 01).
[^pag-pim-plan]: Microsoft Learn, "Plan a Privileged Identity Management deployment," type of assignments, <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-deployment-plan> (accessed Oct 30, 2026, as read for the workbook's Chapter 01).
[^pag-rag]: Microsoft Learn, "Use Microsoft Entra groups to manage role assignments" (role-assignable at creation only; at most 500; P1, and P2 for PIM activation), <https://learn.microsoft.com/entra/identity/role-based-access-control/groups-concept> (accessed Oct 30, 2026, as read for the workbook's Chapter 05).
[^pag-az-integration]: Microsoft Learn, "Eligible and time-bound role assignments in Azure RBAC," PIM functionality (users only can be eligible; P2 or ID Governance), <https://learn.microsoft.com/azure/role-based-access-control/pim-integration> (accessed Oct 30, 2026, as read for the workbook's Chapter 06).
[^pag-ar-licensing]: Microsoft Learn, "Microsoft Entra ID Governance licensing fundamentals," features by license and access reviews, <https://learn.microsoft.com/entra/id-governance/licensing-fundamentals> (accessed Oct 30, 2026, as read for the workbook's Chapter 07).
[^pag-ar-pim-review]: Microsoft Learn, "Create an access review of Azure resource and Microsoft Entra roles in PIM" (Workload ID Premium for service principals; monthly review at most 27 days), <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-create-roles-and-resource-roles-review> (accessed Oct 30, 2026, as read for the workbook's Chapter 07).
[^pag-analyze]: Microsoft Learn, "Analyze Microsoft Entra activity logs with Log Analytics," prerequisites, <https://learn.microsoft.com/entra/identity/monitoring-health/howto-analyze-activity-logs-log-analytics> (accessed Oct 30, 2026, as read for the workbook's Chapter 02).
[^pag-retention]: Microsoft Learn, "Microsoft Entra data retention," activity reports, <https://learn.microsoft.com/entra/identity/monitoring-health/reference-reports-data-retention> (accessed Oct 30, 2026, as read for the workbook's Chapter 08).
[^pag-streams]: Microsoft Learn, "What are the identity logs you can stream to an endpoint?," <https://learn.microsoft.com/entra/identity/monitoring-health/concept-diagnostic-settings-logs-options>, and "Integrate Microsoft Entra logs with Azure Monitor logs," prerequisites, <https://learn.microsoft.com/entra/identity/monitoring-health/howto-integrate-activity-logs-with-azure-monitor-logs> (accessed Oct 30, 2026, as read for the workbook's Chapter 02).
[^pag-az-roles]: Microsoft Learn, "Azure built-in roles for Privileged," <https://learn.microsoft.com/azure/role-based-access-control/built-in-roles/privileged> (accessed Oct 30, 2026, as read for the workbook's Chapter 01).
[^pag-best]: Microsoft Learn, "Best practices for Microsoft Entra roles," sections 5 to 7 (fewer than five Global Administrators), <https://learn.microsoft.com/entra/identity/role-based-access-control/best-practices> (accessed Oct 30, 2026, as read for the workbook's Chapter 01).
[^pag-availability]: Microsoft Learn, "Microsoft Entra feature availability" (Conditional Access, PIM, passkeys and CBA available in Azure for US Government; Microsoft Entra ID Governance in GCC, GCC High and DoD), <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Oct 30, 2026, as read for the workbook's Chapters 01 to 08). The L4 and L5 rows are each Graph method's national cloud table, as the chapters cite them.
[^pag-pim-settings]: Microsoft Learn, "Configure Microsoft Entra role settings in Privileged Identity Management" (the lockout; approvers; activation 1 to 24 hours; authentication context before PIM; fallback; every-time sign-in frequency and the 10-minute window; Conditional Access roles as highly privileged), <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-change-default-settings> (accessed Oct 30 and 31, 2026, as read for the workbook's Chapters 03 and 04).
[^pag-pim-api]: Microsoft Learn, "Manage Microsoft Entra role assignments by using PIM APIs" (activation at most eight hours), <https://learn.microsoft.com/graph/api/resources/privilegedidentitymanagementv3-overview?view=graph-rest-1.0> (accessed Oct 30, 2026, as read for the workbook's Chapter 04).
[^pag-emergency]: Microsoft Learn, "Manage emergency access accounts in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access> (accessed Oct 30, 2026, as read for the workbook's Chapter 02).
[^pag-noninteractive]: Microsoft Learn, "What are non-interactive user sign-ins in Microsoft Entra?," <https://learn.microsoft.com/entra/identity/monitoring-health/concept-noninteractive-sign-ins> (accessed Oct 31, 2026, as read for the workbook's Chapter 02).
[^pag-admin-phish]: Microsoft Learn, "Require phishing-resistant multifactor authentication for administrators" (14 roles; register methods before enforcing), <https://learn.microsoft.com/entra/identity/conditional-access/policy-admin-phish-resistant-mfa> (accessed Oct 30, 2026, as read for the workbook's Chapter 03).
[^pag-report-only]: Microsoft Learn, "Analyze Conditional Access policy impact" (report-only; compliant-device prompts on macOS, iOS and Android), <https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-report-only> (accessed Oct 30, 2026, as read for the workbook's Chapter 03).
[^pag-protected]: Microsoft Learn, "What are protected actions in Microsoft Entra ID?," <https://learn.microsoft.com/entra/identity/role-based-access-control/protected-actions-overview>, and "Add, test, or remove protected actions in Microsoft Entra ID" (Graph assignment in beta), <https://learn.microsoft.com/entra/identity/role-based-access-control/protected-actions-add> (accessed Oct 30, 2026, as read for the workbook's Chapter 03).
[^pag-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 20, 2026; carried from the workbook's Chapter 03).
[^pag-pim-groups]: Microsoft Learn, "Privileged Identity Management (PIM) for Groups" (dynamic and synchronized groups not managed; the last active owner can't be removed), <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/concept-pim-for-groups> (accessed Oct 30, 2026, as read for the workbook's Chapter 05).
[^pag-pim-groups-api]: Microsoft Learn, "Govern membership and ownership of groups by using PIM for Groups" (onboarding on first schedule or policy update; a group can't be taken out of PIM), <https://learn.microsoft.com/graph/api/resources/privilegedidentitymanagement-for-groups-api-overview?view=graph-rest-1.0> (accessed Oct 30, 2026, as read for the workbook's Chapter 05).
[^pag-pim-apis]: Microsoft Learn, "Privileged Identity Management APIs," PIM API history and permissions (Azure resources through Resource Manager, at least Owner or User Access Administrator; Iteration 2 deprecated and "will stop returning data on October 28, 2026"; PIM alerts APIs in preview), <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-apis> (accessed Oct 30, 2026 for the workbook's Chapter 06; read again November 2, 2026).
[^pag-az-settings]: Microsoft Learn, "Configure Azure resource role settings in Privileged Identity Management" (settings per role and resource; not inherited), <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-resource-roles-configure-role-settings> (accessed Oct 30, 2026, as read for the workbook's Chapter 06).
[^pag-elevate]: Microsoft Learn, "Azure roles, Microsoft Entra roles, and classic subscription administrator roles," do Azure roles and Microsoft Entra roles overlap, <https://learn.microsoft.com/azure/role-based-access-control/rbac-and-directory-admin-roles> (accessed Oct 30, 2026, as read for the workbook's Chapter 01).
[^pag-az-best]: Microsoft Learn, "Best practices for Azure RBAC," limit the number of subscription owners, <https://learn.microsoft.com/azure/role-based-access-control/best-practices> (accessed Oct 30, 2026, as read for the workbook's Chapter 01).
[^pag-ar-settings]: Microsoft Learn, "accessReviewScheduleSettings resource type" (auto-apply with a default decision can revoke all access), <https://learn.microsoft.com/graph/api/resources/accessreviewschedulesettings?view=graph-rest-1.0> (accessed Oct 30, 2026, as read for the workbook's Chapter 07).
[^pag-ar-pim-groups]: Microsoft Learn, "Create an access review of PIM for Groups in Microsoft Entra ID (preview)," <https://learn.microsoft.com/entra/id-governance/create-access-review-pim-for-groups> (accessed Oct 30, 2026, as read for the workbook's Chapter 07).
[^pag-ar-arm]: Microsoft Learn, "Microsoft.Authorization accessReviewScheduleDefinitions 2021-12-01-preview" (ARM template reference, version list), <https://learn.microsoft.com/azure/templates/microsoft.authorization/2021-12-01-preview/accessreviewscheduledefinitions> (accessed Oct 30, 2026, as read for the workbook's Chapter 07).
[^pag-pim-audit]: Microsoft Learn, "View audit history for Microsoft Entra roles in Privileged Identity Management," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-use-audit-log> (accessed Oct 30, 2026, as read for the workbook's Chapter 08).
[^pag-secops]: Microsoft Learn, "Microsoft Entra security operations for Privileged Identity Management," <https://learn.microsoft.com/entra/architecture/security-operations-privileged-identity-management> (accessed Oct 30, 2026, as read for the workbook's Chapter 08).
[^pag-moderate]: National Institute of Standards and Technology, SP 800-53B Moderate baseline, release 5.2.0 OSCAL profile (includes AC-2, AC-2(2), AC-2(4), AC-3, AC-5, AC-6, AC-6(1), AC-6(5), AC-6(7), AC-6(9), AC-6(10), AU-2, AU-6, AU-9, AU-11, CA-7, CM-3, CM-3(2), CM-4, CM-4(2), CM-6, IA-2(1), IA-5(2), IR-4 and SI-4; AC-2(7) isn't selected), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json> (accessed Nov 2, 2026, as read for the workbook's Chapters 01 to 08).
[^pag-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, indicator statements and "Related SP 800-53 Controls," <https://www.fedramp.gov/2026/reference/key-security-indicators/> (accessed Nov 2, 2026, as read for the workbook's Chapters 01 to 08).
[^pag-bod]: Cybersecurity and Infrastructure Security Agency, "BOD 25-01: Implementing Secure Practices for Cloud Services Required Configurations," Microsoft Entra ID policies MS.AAD.3.6v1, MS.AAD.7.1v1, MS.AAD.7.3v1, MS.AAD.7.4v1, MS.AAD.7.5v1, MS.AAD.7.6v1, MS.AAD.7.7v1 and MS.AAD.7.8v1, <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations> (accessed Nov 2, 2026, as read for the workbook's Chapters 01 to 08).
[^pag-scuba]: Cybersecurity and Infrastructure Security Agency, ScubaGear Microsoft Entra ID secure configuration baseline (`aad.md`), MS.AAD.7.4v1 and its exception for emergency access accounts, <https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/aad.md> (accessed Nov 2, 2026, as read for the workbook's Chapters 01 and 02).
