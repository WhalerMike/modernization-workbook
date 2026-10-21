---
title: "Help Desk Flow — Intake, Triage, and Routing"
subtitle: "How an email request becomes a governed, routed, and executed task across ServiceNow, SAM, and the Microsoft Entra ID Spoke"
doc-type: operational-guide
audience: [Customer, Operator, Technical]
author: Michael Stratton
date: "June 2026"
status: Active
repo-path: docs/customer-documents/operational-guides/helpdesk-entra-operations/helpdesk-flow.qmd
created-at: 2026-06-09
updated-at: 2026-06-09
format:
  html:
    toc: true
    toc-depth: 2
lifecycle: adopted
tiers_adopted: [1]
lifecycle_review: 2026-12-09
---

# Help Desk Flow — Intake, Triage, and Routing {.unnumbered}

The three governance documents in this set say **who owns what** and **who
approves what**. This page is the *operations* half: **how a request gets into
ServiceNow, gets triaged, and gets routed** to the right approval pipeline — and
how you describe, modify, and create those flows. It builds on ServiceNow's
shipped capabilities (Email Accounts, Email Filters[^sn-ef], Inbound Email Actions[^sn-iea], Flow
Designer[^sn-fd]) and the **Microsoft Entra ID Spoke**[^sn-spoke], so most routine tasks execute
automatically and the Help Desk performs only the residual manual work.

::: {.callout-tip title="The one rule"}
Nothing is handled as ad-hoc email to the Cloud Services team. **Every request is
triaged inside ServiceNow first, then routed to the ServiceNow or SAM approval
pipeline by the authority the task requires.** Cloud Services is the higher-level
review when the Help Desk (and automation) cannot perform a task.
:::

::: {.callout-important title="Integrating ServiceNow's shipped functions — not reinventing them"}
This is an **integration and customization** of capabilities ServiceNow already
ships — not a new automation engine. ServiceNow's **Microsoft Entra ID Spoke**
"provides spoke actions to automate Microsoft Entra ID tasks for application management, audit logs, device management, group management, license management, organization management, password management, service principal management, user authentication, and user management".[^sn-spoke] This kit routes those shipped actions through the agency's
Help Desk authority model and the ServiceNow / SAM approval pipelines, and fills
only the gaps the spoke does not cover.
:::

## The recommended target architecture

ServiceNow is the single front door. An inbound request is redirected into a
ServiceNow triage queue, classified by required authority, and routed to the
ServiceNow pipeline (manager approval) or the SAM pipeline (owner / IGO
approval). Execution prefers a **Microsoft Entra ID Spoke** action where one
exists; the Help Desk performs the manual gaps.

### The four recommendations

1. **Make ServiceNow the single front door.** Redirect the Cloud Services mailbox
   into a ServiceNow triage queue (Exchange transport rule → Inbound Email
   Action), and add a Business Rule that pulls any ticket landing directly on
   Cloud Services back into triage.
2. **Triage by required authority** — A0/A1 → ServiceNow, A2/A3 → SAM, OOS →
   escalate — with all `@microsoft.com` mail forced to A3, escalate-only.
3. **Automate execution with the Entra ID Spoke; reserve people for the gaps.**
4. **Cloud Services is escalation review, not the routine queue.** Approval sits
   with the requester's manager (A1) or the application owner / IGO (A2/A3).

## Task ↔ Entra ID Spoke capability crosswalk

`Execution` is the recommended default: **Spoke** = Flow Designer auto-executes;
**Manual** = a Help Desk task; **SAM** = SAM connector; **Escalate/OOS** = out of
the team's hands.

| Task | Spoke category | Tier | Execution |
|---|---|---|---|
| Password reset — **cloud-only** user | Password management | A0 | Spoke (Delegated work/school grant) |
| Password reset — **hybrid / federated** user | — (synced from on-prem AD) | A0 | Manual — on-prem AD / SSPR writeback |
| Sign-in / audit-log retrieval | Audit logs | A0 | Spoke (read-only) |
| MFA / auth-method reset | User authentication | A1 | Spoke |
| License assign / remove | License management | A1 | Spoke |
| User enable / update / assign manager | User management | A1 | Spoke |
| Add user to security group | Group management | A1/A2 | Spoke |
| Group creation + owner management | Group management | A2 | Spoke |
| Access-certification revocation | Group management | A2 | Spoke |
| User create / disable (joiner / leaver) | User management | A2 | Spoke (via SAM lifecycle) |
| Device enable / disable / delete | Device management | A2 / OOS | Spoke / device team |
| Enterprise App access (group → app role) | Group + Application mgmt | A2 | Spoke for membership; manual one-time group→app-role binding |
| OneDrive provisioning / client-side | none (M365) | A0/A1 | Manual |
| ImmutableID hard-match repair | none | A3 | Manual (Graph) |
| Admin Consent | none (governance) | A3 | Escalate — never auto |
| Conditional Access | none | OOS | Manual / Security Admin |
| Directory role / Service Principal | App / SP mgmt (governance keeps manual) | OOS | Manual / Identity Eng |

### What the ServiceNow Entra ID Spoke ships

ServiceNow's Microsoft Entra ID Spoke (formerly the Microsoft Azure Active
Directory spoke) is a prebuilt Integration Hub spoke with actions across ten
categories — **application management, audit logs, device management, group
management, license management, organization management, password management,
service principal management, user authentication, and user management** — plus
sample flows and subflows you clone.[^sn-spoke] It authenticates via a custom OAuth
app and calls Microsoft Graph, so each action carries the matching Graph permission
and admin consent. Microsoft's role reference describes the Application
Administrator role the app-management actions run under as one that "allows users
to add, manage, and configure enterprise applications and app registrations".[^ms-graph]
For the on-premises side of a hybrid estate, ServiceNow also ships a separate
**Microsoft Active Directory spoke**; this kit's manual ImmutableID path covers the
hybrid hard-match the Entra ID Spoke does not.

::: {.callout-warning title="Two limits that matter on a hybrid, work/school estate"}
- **Password reset only covers cloud-only users.** ServiceNow's Reset Password action "resets the password of users created in Entra ID only and does not reset the password of the federated users"[^sn-spoke] — so **synced / federated users' password resets stay on-prem** (SSPR with password writeback, or on-prem AD), not the Spoke.
- **No app-only for password / session actions.** Reset Password, Change Password, and Revoke Sign-in Sessions are **not supported as Application (app-only) permissions** — they require a **Delegated (work/school)** connection. (The spoke's pervasive "Not supported" entries are for *personal Microsoft accounts*, which a federal tenant never uses.)
:::

::: {.callout-note title="Coverage is release-dependent"}
Per-action Spoke coverage varies by version — validate against your installed
Microsoft Entra ID Spoke. The Spoke authenticates via a custom OAuth app and
calls Microsoft Graph, so each action needs the matching Graph permission and
admin consent.[^ms-graph] The Spoke requires ServiceNow Integration Hub; without
it, every "Spoke" cell becomes a manual Help Desk task and the flow shape is
unchanged.
:::

## Mechanism A — redirect an email into the triage queue

An Exchange Online transport rule routes mail addressed to the Cloud Services
mailbox to the ServiceNow inbound address; a *New*-type Inbound Email Action
creates the record in a triage queue with the assignee left blank.

```powershell
# Exchange Online — route Cloud Services intake to ServiceNow.  # CONFIGURE addresses
New-TransportRule -Name "Route Cloud Services intake to ServiceNow" `
  -SentTo "cloud-services@agency.gov" `
  -BlindCopyTo "servicenow-inbound@agency.gov"   # address tied to the ServiceNow Email Account
```

A Business Rule catches "assigned to Cloud Services but never triaged" and
reroutes it — Cloud Services is escalation-only, not the routine intake queue.

## The triage decision

Triage applies the authority matrix. Any mail from `@microsoft.com` — especially
`MSSecurity-noreply@microsoft.com` — is forced to A3, escalate-only, and is never
actioned from the email.

## The two approval pipelines

**ServiceNow pipeline (A0 / A1)** — Flow Designer asks the requester's manager
for approval, then executes: a Spoke action where one exists, otherwise an SCTASK
to the Help Desk.

**SAM pipeline (A2 / A3)** — SAM owns the access decision and certification; on
approval it provisions via its Entra connector or raises a ServiceNow RITM →
SCTASK for the gap.

::: {.callout-warning title="Admin Consent never auto-executes"}
Admin Consent (A3) is never executed by the Help Desk or Cloud Services — triage,
verify in the Entra audit log, and escalate to the Application Owner → IGO.
:::

## How to describe, modify, and create a task flow

A flow is fully described by **one row** of a Flow Definition table; building it
wires that row into the mechanisms above.

| Field | Meaning | Example |
|---|---|---|
| Task type | Short name | `enterprise-app-access` |
| Email match | Email Filter / Inbound Action condition | subject/body matches `access to <app>` |
| Authority | A0 / A1 / A2 / A3 / OOS | A2 |
| Approver | Who owns the decision | Manager + Application Owner |
| Pipeline | ServiceNow or SAM | SAM |
| Execution | Spoke action / manual SCTASK / SAM connector | SAM connector, else SCTASK |
| SLA | Time target + escalation | 3 business days |

**To create a flow:** (1) define the row; (2) add the Email Filter / Inbound
Action condition; (3) set the tier in the routing matrix (the kit's
`$RequestRoutingTable`); (4) clone the Flow Designer approval subflow and set the
approver; (5) wire execution (Spoke action, SCTASK, or SAM); (6) test with a
sample email and confirm the audit trail. **To modify:** change the row, then the
one mechanism it points at, and re-test.

## Worked example — "I need access to the Payroll app" (A2 → SAM)

The email is redirected into triage, classified A2, and raised as a SAM access
request. The manager and Application Owner approve; SAM provisions the group
membership through the Entra ID Spoke, or raises an SCTASK to Cloud Services for
the one-time group→app-role binding. The complete chain is recorded in SAM and
ServiceNow, with the Entra audit-log reference attached.

## Configuration reference

| Artifact | Where | Purpose |
|---|---|---|
| Exchange transport rule | Exchange Online | Redirect Cloud Services mail → ServiceNow inbound |
| Email Account | ServiceNow → Email Accounts | Connect the inbound mailbox |
| Email Filters | ServiceNow → Filters | Drop loops/junk; pre-route |
| Inbound Email Action (New) | ServiceNow → Inbound Actions | Create the triage record, assignee blank |
| Reroute Business Rule | ServiceNow → Business Rules | Pull Cloud-Services-assigned mail back to triage |
| Triage subflow / classifier | Flow Designer / kit `scripts/` | Classify by authority |
| Approval subflows | Flow Designer | Manager / Owner / IGO approval + SLA |
| Entra ID Spoke actions | Integration Hub | Execute covered tasks automatically |

::: {.callout-note title="Companion kit"}
The runnable companion — the implementation-path guide, the routing module, and
the request-triage classifier — ships in the
Help Desk / Cloud Services Operations Kit.
This page is reference material for review and adaptation, not validated against a
live tenant; pilot the Exchange rule and Inbound Email Action before tenant-wide
enablement.
:::

## References

**ServiceNow documentation**

- *Inbound email actions* — <https://www.servicenow.com/docs/bundle/yokohama-platform-administration/page/administer/notification/concept/c_InboundEmailActions.html>
- *Email filters* — <https://www.servicenow.com/docs/r/platform-administration/c_EmailFilters.html>
- *Flow Designer approvals overview* — <https://www.servicenow.com/community/workflow-automation-articles/flow-designer-approvals-overview-workflow-automation-center-of/ta-p/2528202>
- *Microsoft Entra ID Spoke (Integration Hub)* — <https://www.servicenow.com/docs/bundle/zurich-integrate-applications/page/administer/integrationhub/concept/microsoft-azure-ad-spoke.html>

**Microsoft documentation**

- *Microsoft Entra built-in roles* (Application Administrator, Hybrid Identity Administrator, Helpdesk Administrator) — <https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/permissions-reference>
- *Privileged Identity Management (PIM) for Groups* — <https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/concept-pim-for-groups>
- *What is Privileged Identity Management?* — <https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure>
- *Enable Microsoft Entra self-service password reset* — <https://learn.microsoft.com/en-us/entra/identity/authentication/tutorial-enable-sspr>

[^sn-ef]: ServiceNow, *Email filters*. <https://www.servicenow.com/docs/r/platform-administration/c_EmailFilters.html>
[^sn-iea]: ServiceNow, *Inbound email actions*. <https://www.servicenow.com/docs/bundle/yokohama-platform-administration/page/administer/notification/concept/c_InboundEmailActions.html>
[^sn-fd]: ServiceNow, *Flow Designer approvals overview*. <https://www.servicenow.com/community/workflow-automation-articles/flow-designer-approvals-overview-workflow-automation-center-of/ta-p/2528202>
[^sn-spoke]: ServiceNow, *Microsoft Entra ID Spoke (formerly Microsoft Azure Active Directory spoke), Integration Hub*. <https://www.servicenow.com/docs/bundle/zurich-integrate-applications/page/administer/integrationhub/concept/microsoft-azure-ad-spoke.html>
[^ms-graph]: Microsoft, *Microsoft Entra built-in roles* — the Spoke calls Microsoft Graph and needs the matching role/permission consent. <https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/permissions-reference>
