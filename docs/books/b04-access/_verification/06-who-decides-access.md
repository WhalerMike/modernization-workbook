# Verification — Chapter 06, Who Decides Access

Checked October 20, 2026. Source: `docs/operational-guides/helpdesk-entra-operations/enterprise-application-access-governance.md`
(roles, RACI, risk classification, ownership, workflows A–C, group governance, ServiceNow model, audit, exceptions,
document control). Also read for the authority split: `helpdesk-flow.md` and `help-desk-administrative-responsibilities.md`
in the same folder (linked, not consolidated). Book 02 Chapters 05, 06 and 09 read for consistency. Access-package and
access-review mechanics are Chapter 09's.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | AC-5: identify duties requiring separation; define access authorizations; discussion on dividing functions and separating access-control and audit administration | Deciding isn't doing | verified | NIST SP 800-53 Rev. 5, AC-5 (PDF text extracted) |
| 2 | Three separation rules (approvers don't execute, etc.) | Deciding isn't doing | restated-as-design | Program model from source RACI/SoD |
| 3 | Role set, decision rights and Entra role assignments per role | The roles | restated-as-design | Program model; source role table adapted (ISSO, AO, security ops, identity engineering added) |
| 4 | Source: "Microsoft Entra ID does not provide a native Help Desk role" | Help desk | corrected | Learn, Entra built-in roles: Helpdesk Administrator exists; the source's point (no single role combines app assignment and hybrid identity work) restated as a design reason for a PAG |
| 5 | Global Administrator permanently held only by emergency accounts | The roles | restated-as-design | Consistent with Book 02 Ch 09 emergency access standard |
| 6 | Help desk authorized / not authorized list | Help desk | restated-as-design | help-desk-administrative-responsibilities.md authority boundaries |
| 7 | Application Administrator: manage all apps; consent to delegated and non-Graph application permissions; add credentials and impersonate apps | What each role can do | verified | Learn, Entra built-in roles |
| 8 | Cloud Application Administrator: same minus application proxy | What each role can do | verified | Same |
| 9 | Source: help desk PAG grants Application Administrator yet "does not approve access" | What each role can do | corrected | Same: the role can grant most consents and impersonate apps; separation is procedural unless the role is narrowed. Program recommendation added (custom role) |
| 10 | Privileged Role Administrator can grant consent for any permission/API | What each role can do | verified | Learn, Grant tenant-wide admin consent |
| 11 | Global Administrator required to turn on the workflow; only GA approves workflow requests for Graph app roles | What each role can do | verified | Learn, Configure the admin consent workflow |
| 12 | Owners can manage the app and impersonate it | What each role can do | verified | Learn, Overview of enterprise application ownership |
| 13 | Custom role with `servicePrincipals/appRoleAssignedTo/update`, app or tenant scope, requires P1 | What each role can do | verified | Learn, Create custom roles to manage enterprise apps |
| 14 | Microsoft warning that App Admin assignment allows impersonation / elevation | What each role can do | verified | Learn, Entra built-in roles |
| 15 | Security Reader / Security Operator for investigation | The roles | verified | Learn, Entra built-in roles (role list) |
| 16 | Tier criteria, approvers, cadences, owner and alerting requirements | Risk tiers | restated-as-design | Source classification framework and matrix |
| 17 | Unclassified apps treated as Tier 1 | Risk tiers | restated-as-design | Source callout |
| 18 | Source example scopes `Mail.ReadWrite.All (App)` | Risk tiers | corrected | Learn, Graph permissions reference: application permission is `Mail.ReadWrite` |
| 19 | Mandatory request fields, catalog items, SLAs, escalation | Request | restated-as-design | Source ServiceNow model, generalized to "the ITSM tool" |
| 20 | Access approval chain and 3-business-day SLA; Tier 1 four-hour IGO hold window | Approval | restated-as-design | Source Workflow A |
| 21 | Admin consent chain by tier and escalation rules | Who approves admin consent | restated-as-design | Source Workflow B and escalation table |
| 22 | Source critical trigger: "\*.All at application level" | Who approves admin consent | corrected | Learn, Graph permissions reference: `Mail.ReadWrite` and `Mail.Send` application permissions have no `.All` suffix; trigger changed to the program's risk level |
| 23 | Who executes grants: PRA for Graph app permissions; Cloud App Admin otherwise | Who approves admin consent | verified | Learn, Grant tenant-wide admin consent |
| 24 | Source Workflow B step 5: "Help Desk Operator activates Privileged Role via PIM" before consent | Who approves admin consent | corrected | Conflicts with the source's own prohibition and help-desk guide; execution moved to an IGO-office role holder |
| 25 | Revocation: existing tokens remain valid; users can re-consent | Who approves admin consent | verified | Learn, Review permissions granted to enterprise applications (re-consent); Ch 05 claim 32 (tokens) |
| 26 | Revocation SLAs (1 business day; 2 hours incident) and 24-hour owner notice | Request; revocation | restated-as-design | Source |
| 27 | Group-based assignment requires P1/P2; security groups only | Assignment | verified | Learn, Manage users and groups assignment; Use a group to manage access to SaaS applications |
| 28 | Source: nested groups not honored for app assignment | Assignment | verified | Learn, Manage users and groups assignment ("doesn't cascade to nested groups") |
| 29 | Assignment required; apps requiring assignment need admin consent | Assignment | verified | Learn, Manage users and groups assignment |
| 30 | Naming convention, dynamic vs assigned policy, three-party SoD, group lifecycle | Assignment | restated-as-design | Source group governance model |
| 31 | Review cadences, certification and removal deadlines, annual consent review | Review | restated-as-design | Source scheduled access reviews (mechanics left to Ch 09) |
| 32 | A0–A3/OOS authority levels, pipelines and the task table | Authority split | restated-as-design | helpdesk-flow.md crosswalk; A0/A1 meanings inferred from its task examples and generalized (no product name for the IGA platform) |
| 33 | Cloud-only password reset via automation; synced/federated users reset on premises or SSPR writeback | Authority split | restated-as-design | helpdesk-flow.md (ServiceNow Spoke limitation is that page's sourced claim; linked, not re-cited) |
| 34 | Microsoft-originated mail forced to A3; verify in audit log within 4 hours; escalate within 1 hour | Authority split | restated-as-design | Source notification-handling table; helpdesk-flow.md |
| 35 | Source: notifications come from a specific Microsoft sender address | Authority split | removed | Sender address not verified on Learn; chapter refers to "any message that appears to come from Microsoft" |
| 36 | Three preconditions before execution | Authority split | restated-as-design | help-desk-administrative-responsibilities.md |
| 37 | Owner transfer procedure and orphan policy (30 days, suspend day 31) | Ownership changes | restated-as-design | Source |
| 38 | At least two owners; `serviceManagementReference` | Ownership changes | verified | Learn, Overview of enterprise application ownership |
| 39 | Suspend by deactivating the app | Ownership changes | verified | Learn, Application and service principal objects (deactivate) — cited in Ch 05 |
| 40 | Exception process, authority table, 6-month maximum, register, renewal escalation | Exceptions | restated-as-design | Source; AO rows and client-secret row are program additions |
| 41 | Break-glass invocation criteria, dual custody, 4-hour limit, 24-hour review, credential re-secure | Emergency access | restated-as-design | Source Workflow C; account design deferred to Book 02 Ch 09 |
| 42 | Source break-glass trigger "MFA failure" | Emergency access | restated-as-design | Reworded to "normal privileged access through PIM isn't available"; Book 02 Ch 09 notes emergency accounts also use phishing-resistant MFA |
| 43 | Responsibility matrix | Matrix | restated-as-design | Source RACI expanded |
| 44 | Source: Entra audit/sign-in/PIM retention "30 days (free) / 90 days (P1/P2)" | Evidence | corrected | Learn, Microsoft Entra data retention: 7 days Free, 30 days P1/P2 |
| 45 | Agency retention minimums (1 year; 3 years; 3/7 years tickets); 24-hour gap reporting | Evidence | restated-as-design | Source |
| 46 | Alert list | Evidence | restated-as-design | Source SIEM alerts; credential-added alert added by the program |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter / series note (IDG-GOV-003 numbering, issuing authority) | — | Document-control metadata of the source policy; not book content |
| Purpose | Ch 06 opening | |
| Scope | Ch 06 opening ("every application in scope") | Detailed scope list stays in the linked guide |
| Out of scope | — | Policy boundary statements (SDLC policy, consumer accounts, licensing policy) stay in the linked guide |
| Governing authority | Ch 06 The roles (IGO, CISO) | Deputy-IGO delegation detail left in the guide |
| Policy framework alignment | — | Framework list (FISMA, 800-207, M-22-09, CISA ZTMM) not re-asserted here; the book's federal framing lives in Chapters 01 and 10 |
| Definitions and key terms | Ch 05 (object and permission terms), Ch 06 (role and process terms) | |
| Role definitions | Ch 06 The roles (table, corrected) | |
| No native Help Desk role callout | Ch 06 What each Entra role can actually do (corrected) | |
| RACI matrix | Ch 06 The responsibility matrix (expanded) | |
| Risk classification framework, Tiers 1–3, matrix, reclassification | Ch 06 Risk tiers set the approval chain | |
| Ownership requirement; owner responsibilities; backup owner | Ch 06 Application owners and business approvers; Ch 05 Ownership | |
| Application Registry (fields table) | Ch 06 Request (fields) and Evidence | Field-by-field registry schema stays in the linked guide |
| Assigning and updating Application Owners (portal steps) | — | Click-path runbook stays in the linked guide |
| Ownership transfer procedure | Ch 06 Ownership changes and orphaned apps | |
| Orphaned application policy | Ch 06 Ownership changes and orphaned apps | |
| Workflow A — standard group-based access | Ch 06 Approval; Authority split (execution steps) | Step-by-step table condensed; full table in the linked guide |
| Workflow B — Admin Consent request; escalation table | Ch 06 Who approves admin consent (diagram ch06-approval-chain-by-tier; corrected trigger and executor) | |
| Workflow C — emergency / break-glass | Ch 06 Emergency access | |
| Group-based access mandate and rationale | Ch 06 Assignment | Rationale bullets condensed |
| Group naming convention | Ch 06 Assignment | |
| Group lifecycle (creation, population, review, deprovisioning) | Ch 06 Assignment (last paragraph) | |
| Nested group policy | Ch 06 Assignment (verified) | |
| Dynamic vs assigned groups; dynamic attribute governance | Ch 06 Assignment (group type table) | |
| Separation of duties: three-party model | Ch 06 Assignment (SoD table) | |
| Complete group governance reference table | Ch 06 Assignment (merged into group type table) | |
| Admin Consent governance sections | Ch 05 (what, types, scopes) and Ch 06 (approval, revocation, evidence) | See Ch 05 ledger |
| Microsoft Security notification email handling | Ch 06 Authority split (routing rules) | Sender address removed (unverified) |
| ServiceNow as system of record | Ch 06 The enterprise-application approval model (lead) | Generalized to "ITSM tool" |
| ServiceNow catalog items | Ch 06 Request (catalog table) | |
| Mandatory RITM fields | Ch 06 Request (fields table) | |
| ServiceNow SLA definitions | Ch 06 Request (SLA column and escalation sentence) | Per-row escalation timings left in the guide |
| Automated notifications | — | Notification matrix stays in the linked guide |
| Audit log retention | Ch 06 Evidence and monitoring (corrected native retention) | |
| SIEM integration callout | Ch 06 Evidence and monitoring | |
| Mandatory audit events | Ch 06 Evidence and monitoring (alerts) | Category-by-category event list left in the guide; Chapter 10 owns evidence |
| Scheduled access reviews (quarterly, semi-annual, annual, consent review) | Ch 06 Review | Review mechanics belong to Chapter 09 |
| Annual governance review | Ch 06 The roles (IGO duty) | Agenda list left in the guide |
| Required SIEM alerts | Ch 06 Evidence and monitoring (alert table, one alert added) | |
| Compliance mapping table | — | Control mapping belongs to Vol IX Book 06 / Chapter 10 (linked) |
| Policy exceptions and waivers (statement, process, authority, duration, register, callout) | Ch 06 Exceptions | |
| Document control (version history, review cycle, owner, distribution, certification, signatures, effectivity) | — | Source policy's own document control; not book content |
| ServiceNow automation alignment | Ch 06 Authority split (automation paragraph, link to Help Desk Flow) | Spoke quotation stays in helpdesk-flow.md where it is sourced |
