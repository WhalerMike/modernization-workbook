# Verification — Chapter 06, Who Owns the Endpoint

Checked October 20, 2026. Sources: `docs/projects/endpoint-device-charter.md` (§9 Governance and Ownership,
§4 Scope, §8 Risks; linked, stays in place), `docs/projects/endpoint-device-plan.md` (linked), and the role and
path content of the intune-arc and device-and-server path pages (roles lines in manual-path §1; governed-path
approval model). Migration-wide roles and RMF definitions are linked to Book 02 Chapter 06, not repeated.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Charter names sponsor, lead (to be named) and four domain leads | Where the roles come from | verified | endpoint-device-charter.md §9 |
| 2 | Charter puts domain unjoin and app packaging redesign out of initial scope | Roles | verified | endpoint-device-charter.md §4 |
| 3 | Roles, decide/do/consult split, matrix, one decider per row | Throughout | restated-as-design | Program model |
| 4 | Customer responsible for Arc RBAC, rotating onboarding credentials, agent/extension updates | Server infrastructure | verified | Learn, Security overview for Arc-enabled servers (Responsibilities) |
| 5 | Defender for Servers P1 and P2 provide MDE Plan 2 capabilities incl. EDR | Security operations | verified | Learn, Common questions about Defender for Servers |
| 6 | Help Desk Operator can retire, wipe and run remote tasks | Help desk | verified | Learn, Built-in role permissions for Intune |
| 7 | Helpdesk Administrator reads LAPS metadata, not password; Cloud Device Admin and Intune Admin read password; custom role with P1/P2 | Help desk; LAPS paragraph | verified | Learn, Windows LAPS in Microsoft Entra ID |
| 8 | Pausing a ring after a pilot problem | Matrix comment | verified | Learn, Walkthrough: Use CSPs and MDMs to configure Windows Update client policies |
| 9 | Mark device noncompliant defaults to 0 days, schedule 0–365; retire list needs explicit admin retire | Compliance note | verified | Learn, Configure actions for noncompliant devices |
| 10 | Update rings set deferrals/deadlines/restarts; Autopatch may own rings; don't assign custom rings to Autopatch devices | Update rings note | verified | Learn, Manage Windows Update ring policies |
| 11 | Retire keeps personal data and unenrolls; wipe factory-resets | Retirement note | verified | Learn, Device action: retire; Wipe devices with Intune |
| 12 | Retire in MDM first; disable before delete; deletion unrecoverable; BitLocker keys lost; hybrid devices cleaned in AD and synced; Entra-only delete returns as Pending | Retirement note | verified | Learn, Manage stale devices in Microsoft Entra ID |
| 13 | Deleting device loses Entra-stored LAPS password | Retirement note | verified | Learn, Windows LAPS in Microsoft Entra ID (FAQ) |
| 14 | Server retirement: remove extensions, disconnect, uninstall; stale resources show Disconnected | Retirement note | verified | Learn, Uninstall the Connected Machine agent |
| 15 | Intune Administrator is privileged; don't use it or GA for routine Intune admin | Three role systems | verified | Learn, RBAC with Microsoft Intune |
| 16 | Cloud Device Administrator: enable/disable/delete devices, read BitLocker keys only | Three role systems | verified | Learn, Microsoft Entra built-in roles |
| 17 | Intune built-in role list; Intune Role Administrator is the only role that can assign permissions | Three role systems | verified | Learn, RBAC with Microsoft Intune |
| 18 | Scope tags limit visible objects | Three role systems | verified | Learn, Permissions, scope tags, and approvals for deployments |
| 19 | Unlicensed admins since June 2021; older accounts and nested-group admins need license | Three role systems | verified | Learn, RBAC with Microsoft Intune |
| 20 | Arc Onboarding vs Resource Administrator; Contributor is indirect admin because extensions run privileged scripts | Three role systems | verified | Learn, Arc security — Identity and authorization |
| 21 | Endpoint Security Manager manages security baselines, compliance, CA, MDE | Role map | verified | Learn, Built-in role permissions for Intune |
| 22 | Team-to-role mapping table; PIM-eligible privileged roles | Role map | restated-as-design | Program model built from verified role definitions |
| 23 | Source: "Intune Administrator (via PIM) for endpoints" | Role map | corrected | Learn advises against routine use; mapping uses Intune RBAC roles, Intune Admin only via PIM for tenant tasks |
| 24 | Multi Admin Approval: protected resources, no self-approval, GA/Intune Admin still need approver, approver security group directly assigned to an Intune role | Second approver | verified | Learn, Use access policies to require multi admin approval |
| 25 | GPO-habit replacement table | Closing table | restated-as-design | Program synthesis of verified facts above |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| endpoint-device-charter §9 Governance and Ownership | Where the roles come from | Charter stays in place and is linked |
| endpoint-device-charter §4 Scope (out of scope: unjoin, packaging, non-Windows) | Roles (sponsor, app owners) | Non-Windows note covered by Chapter 05 "whole denominator" rule |
| endpoint-device-charter §8 Risks (attribute population) | Chapter 05 Key risks | — |
| endpoint-device-charter §1–3, 5–7, 10 | — | Not role content; charter is linked, not archived |
| endpoint-device-plan (phases) | Chapter 05 Four phases | Plan is linked, not archived |
| manual-path §1 Roles (least privilege) line | Chapter 05 Prerequisites; this chapter's role map | Intune Administrator line corrected |
| governed-path §3 approval model (approval reference, ceiling) | Second approver; Chapter 05 ladder | — |
| guides governed-and-retrofit — "AO must sign" | Roles (authorizing official); Chapter 05 How to choose | — |
