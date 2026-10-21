# Verification — Chapter 04, Help Desk Authority in Entra ID

Writer W3. Source: `docs/operational-guides/helpdesk-entra-operations/help-desk-administrative-responsibilities.md` (about 10,430 words), shared with Appendix A. This chapter carries the authority model and the high-risk tasks; Appendix A carries the task reference.

Method, October 21, 2026: Microsoft claims checked on Microsoft Learn through the Learn MCP fetch and search tools (permissions reference, privileged roles and permissions, least privileged roles by task, administrative units, restricted management units, role-assignable groups, PIM role settings and approval, Temporary Access Pass, MFA method management, Graph user resource and sensitive actions, Entra Connect existing-tenant matching, audit activity reference, data retention). Federal claims checked on pages.nist.gov and csrc.nist.gov (SP 800-63B-4), cisa.gov (AA23-320A) and fedramp.gov (AC controls, catalog 5.2.0). Consistency checked against Book 02 Ch05, Book 04 Ch04, Ch06, Ch08 and Appendix B. No personal data sent anywhere.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Entra ID has no single help desk role covering all help desk work | Built-in roles | verified (by role definitions) | permissions-reference |
| 2 | Password, Helpdesk, Authentication, User and Privileged Authentication Administrator all carry the privileged label | Built-in roles | verified | permissions-reference; privileged-roles-permissions (IsPrivileged output) |
| 3 | Password Administrator: resets passwords only; can reset non-admins, Directory Readers, Guest Inviter, Password Admin | Roles table | verified | permissions-reference; privileged-roles-permissions "Who can reset passwords" |
| 4 | Helpdesk Administrator: change passwords, invalidate refresh tokens, manage service requests, monitor service health; target list | Roles table | verified | privileged-roles-permissions (role richDescription and table) |
| 5 | Authentication Administrator: set/reset/delete methods, require re-registration, revoke remembered MFA, sensitive actions for some users; target list incl. other Auth Admins | Roles table | verified | permissions-reference; privileged-roles-permissions |
| 6 | User Administrator: create users, most properties, groups, licenses, reset passwords, delete/restore some users, can't manage MFA | Roles table | verified | permissions-reference |
| 7 | Privileged Authentication Administrator acts on every user incl. Global Admins | Roles table | verified | permissions-reference |
| 8 | Tier placements (Tier 2 for four roles, Tier 0 for PAA) | Roles table | verified against Book 04 Ch04 | Book 04 |
| 9 | Members/owners of role-assignable groups resettable only by PAA and GA | Whose account | verified | privileged-roles-permissions |
| 10 | Users with a role scoped to a restricted management AU are in the same protected row | Whose account | verified | privileged-roles-permissions |
| 11 | Sensitive properties list (accountEnabled, phones, otherMails, passwordProfile, UPN, onPremisesImmutableId, delete/restore) | Whose account | verified | privileged-roles-permissions; Graph "Working with users" |
| 12 | AU-scoped roles: methods, passwords, sensitive properties, delete/restore apply only to non-admin members | Whose account | verified | admin-units-assign-roles |
| 13 | Authentication Administrator can delete, disable, enable users and update UPN for some users | Capability | verified | privileged-roles-permissions (role permissions list and sensitive-actions table) |
| 14 | User Administrator can delete users, create guests, change licenses, reset limited admins | Capability | verified | permissions-reference; delegate-by-task |
| 15 | Application Administrator can consent to delegated and non-Graph application permissions and create enterprise apps | Capability | verified | delegate-by-task (enterprise applications table); consistent with Book 04 Ch06 |
| 16 | Custom role with appRoleAssignedTo/update, scope one app or tenant, P1 | Capability | verified | custom-enterprise-apps |
| 17 | Source: Helpdesk Administrator covers only password resets and basic M365 tasks; not used | Corrections | corrected | privileged-roles-permissions |
| 18 | Source: password reset rights map to Authentication Administrator | Corrections | corrected: Password Administrator least privileged | delegate-by-task |
| 19 | Source: Hybrid Identity Administrator resets ImmutableID | Corrections | corrected: role scope is Connect, cloud provisioning, PTA, PHS, seamless SSO, federation; it isn't among roles that can update onPremisesImmutableId | permissions-reference; Graph users "Who can perform sensitive actions" |
| 20 | Source: role-assignable groups need P2 | Corrections | corrected: P1; PIM activation P2 | groups-concept |
| 21 | Source: Authentication Administrator can temporarily disable MFA | Corrections | corrected: no per-user MFA or MFA settings management; Authentication Policy Administrator manages MFA settings; restated program path (TAP) | privileged-roles-permissions "Compare authentication roles"; permissions-reference |
| 22 | MSOnline and AzureAD PowerShell deprecated; Graph PowerShell replaces them | Corrections | verified | Learn "Upgrade from Azure AD PowerShell to Microsoft Graph PowerShell" |
| 23 | Roles assignable at AU scope (Auth, Helpdesk, Password, User, Groups, License; not App, Cloud App, Hybrid Identity) | Scope | verified (list) | admin-units-assign-roles |
| 24 | P1 per AU administrator, Free for members | Scope | verified | admin-units-assign-roles |
| 25 | AUs limit changes, not visibility; no nesting; dynamic AU members need P1 | Scope | verified | administrative-units (opened Oct 21, 2026) |
| 26 | Microsoft's CEO example for restricted management AUs | Restricted AUs | verified | admin-units-restricted-management |
| 27 | Only unit-scoped admins change members; GA/PRA can manage the unit, assign themselves, audited | Restricted AUs | verified | admin-units-restricted-management |
| 28 | Restricted setting fixed at creation | Restricted AUs | verified | admin-units-restricted-management |
| 29 | RMAU members can't be managed by PIM, entitlement management, lifecycle workflows, access reviews | Restricted AUs | verified | admin-units-restricted-management |
| 30 | Executive-support pattern | Restricted AUs | restated-as-design | — |
| 31 | "Privileged Access Group" was the former name of PIM for Groups until January 2023 | Delivery | verified | concept-pim-for-groups |
| 32 | One role-assignable group per role and scope, PRV-T2 naming, access package | Delivery | restated-as-design (Book 04 Ch04 convention) | Book 04 |
| 33 | Role-assignable groups: no dynamic, no nesting, property set at creation, max 500 | Delivery | verified | groups-concept |
| 34 | Helpdesk Admins can reset other Helpdesk Admins; Auth Admins other Auth Admins | Delivery | verified | privileged-roles-permissions |
| 35 | PIM settings per role, all assignments follow them | PIM | verified | pim-how-to-change-default-settings |
| 36 | Tier 2 values: 8 h, ticket, 180 days, approval not required with risk acceptance | PIM | verified against Book 04 App B | Book 04 |
| 37 | Ticket field information-only, not correlated | PIM | verified | pim-how-to-change-default-settings |
| 38 | Source: justifications without a valid request number automatically flagged within 24 hours | PIM | restated-as-design (SIEM correlation the program builds) | — |
| 39 | Activation maximum 1 to 24 hours | PIM | verified | pim-how-to-change-default-settings |
| 40 | Source: 4 h / 2 h windows, supervisor PIM approval for all, 12-month eligibility | PIM | not carried as stated; aligned to Book 04 App B (8 h ceiling, 180 days); shorter windows mentioned as an option with the per-role caveat | Book 04 |
| 41 | Approvers can't self-approve; 24 h window; expiry | PIM | verified | pim-approval-workflow |
| 42 | Hybrid Identity and Application Administrator are Tier 1 with Tier 1 approver group | PIM | verified against Book 04 Ch04/App B | Book 04 |
| 43 | Quarterly review of help desk role membership | Onboarding | verified against Book 04 App B Tier 2 cadence; source's quarterly review consistent | Book 04 |
| 44 | Offboarding: no governance approval for removals; remove active assignment and revoke sessions | Offboarding | restated-as-design | — |
| 45 | Scattered Spider calls help desks to reset passwords/move MFA; recommends phishing-resistant MFA and vishing training | Proofing | verified | CISA AA23-320A (Nov 16, 2023; updated Jul 29, 2025) |
| 46 | SP 800-63B-4 (July 2025) recovery methods: saved codes, issued codes, recovery contacts, repeated proofing | Proofing | verified | pages.nist.gov 800-63B-4 sec 4.2; csrc record "July 2025", final 07/31/25 |
| 47 | AAL2 recovery options | Proofing | verified | 800-63B-4 sec 4.2 |
| 48 | Recovery must notify the subscriber | Proofing | verified | 800-63B-4 sec 4.2 |
| 49 | Re-proof against PIV/HR record; never email or caller-supplied number | Proofing | restated-as-design (source said "agency-approved out-of-band verification, not email alone") | — |
| 50 | Require re-register MFA deactivates hardware OATH, deletes phones, Authenticator, software OATH | TAP and MFA | verified | howto-mfa-userdevicesettings |
| 51 | Revoke sessions invalidates refresh tokens | TAP and MFA | verified | howto-mfa-userdevicesettings |
| 52 | TAP definition, who can issue (Auth Admin members not self; PAA admins), policy by Auth Policy Admin, policy scope | TAP | verified | howto-authentication-temporary-access-pass |
| 53 | TAP lifetimes 10 min–30 days; defaults 1 h min/default, 8 h max; one-time; one per user | TAP | verified | same |
| 54 | 10-minute registration window for one-time TAP | TAP | verified | same |
| 55 | TAP expiry caps tokens at issuance but doesn't end sessions; sign-in frequency governs | TAP | verified | same |
| 56 | TAP not with NPS extension or AD FS adapter; not for external guests | TAP | verified | same |
| 57 | Users replacing lost credentials should remove old methods | TAP | verified | same |
| 58 | Recovery sequence (six steps) | TAP | restated-as-design | — |
| 59 | High-risk definition and two-approver rule | High-risk | restated-as-design | — |
| 60 | AC-5 identify duties and define authorizations for separation; AC-6(9) log privileged functions | High-risk | verified | FedRAMP AC page, catalog 5.2.0 |
| 61 | Wrong mapping makes the wrong object the source of authority | High-risk table | verified | how-to-connect-install-existing-tenant (caution) |
| 62 | Matching evaluated only for new objects; changing existing objects errors | ImmutableID | verified | same |
| 63 | Fix duplicate conflicts by setting on-prem mS-DS-ConsistencyGuid to cloud ImmutableID | ImmutableID | verified | same |
| 64 | For synced users, updatability depends on source of authority and sync state | ImmutableID | verified | Graph "Update user" note 3 |
| 65 | From July 1, 2026 hard match blocked when onPremisesObjectIdentifier set or target privileged/eligible; not a general repair tool | ImmutableID | verified | how-to-connect-install-existing-tenant |
| 66 | Microsoft advises blocking hard match unless needed, re-enable after | ImmutableID | verified | same |
| 67 | Source: help desk executes ImmutableID reset via PowerShell after dual approval | ImmutableID | corrected: moved to identity engineering; approvals kept | as above |
| 68 | Second-approver checks (verification, exact specification, urgency) | High-risk | restated-as-design | — |
| 69 | Audit activity names: "Add member to role completed (PIM activation)", "Reset password", "Admin deleted security info", "Admin registered security info", "Update user", "Delete user", "Add app role assignment to group" | Evidence | verified | reference-audit-activities |
| 70 | Audit and sign-in logs 30 days with P1/P2, 7 days Free; longer via Azure Monitor or Purview Audit | Evidence | verified | reference-reports-data-retention |
| 71 | Three SIEM rules | Evidence | restated-as-design | — |
| 72 | Reports Reader least privileged for logs; source said Application Administrator needed | Evidence | corrected | delegate-by-task |
| 73 | Applied CA details need policy read permission; Security Reader is least privileged for both | Evidence | verified | how-to-view-applied-conditional-access-policies |
| 74 | Source: AD-to-Entra mapping table (Auth Admin for password reset on OUs; Groups Admin for group ACLs; PIM eligible not standing) | Scope | corrected/carried: password resets → Password/Helpdesk Admin; Groups Admin and eligible-only kept | delegate-by-task; Book 02 Ch05 |
| 75 | Source: AU membership driven by `extensionAttribute2 -eq "IT"` | Scope | not carried as a literal; Book 02 Ch05 owns AU rules (it uses department and extensionAttribute6) | Book 02 |
| 76 | Source: Admin consent approval reserved to IGO or GA | Boundary | not restated; linked to Book 04 Ch06, which verified who approves | Book 04 |
| 77 | Source: notification sender `MSSecurity-noreply@microsoft.com` | Not carried | removed: couldn't find the sender address on Microsoft Learn's admin consent workflow pages; replaced with "never act from the email" | admin consent workflow pages searched |

## Carry-forward ledger

Covers every section of the source. "App A" is `appendix-a-help-desk-task-reference.md`.

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter; series notice (Document 1 of 3, companion PIM and IGO documents) | — | Internal series navigation; the companions' subjects are Book 04 Ch08 (PIM) and Book 04 Ch06 (governance officer, consent), linked instead |
| Purpose and scope — Purpose (no native help desk role; PAG model) | Ch04 opening, Built-in roles, How the roles reach a technician | Corrected (Helpdesk Admin, PAG naming) |
| Scope — what this guide governs | Ch04 In this chapter; App A section structure | — |
| Scope — what it does not cover (GA, consent approval, CA, service principals, SAM admin, Governance features, role assignment) | Ch04 Authority boundary; App A escalation matrix | — |
| Applicability (help desk personnel, contractors, acknowledgment records) | Ch04 Onboarding (training before first activation) | Personnel acknowledgment records are staffing; Chapter 10 (who runs day two) owns staffing |
| Authority boundaries table | Ch04 Authority boundary (identity edges); Book 04 Ch06 boundary linked | Corrected rows: license changes and password resets now carry their least-privileged roles |
| Prohibited action callout (never approve admin consent) | Ch04 High-risk (consent never help desk); App A escalation | Linked to Book 04 Ch06 |
| PAG — How this replaces OU-based delegation (AD-to-Entra table) | Ch04 Scope: administrative units | Corrected mapping (see claim 74) |
| PAG — Why group-based assignment | Ch04 How the roles reach a technician | Reframed on Book 04 Ch04 pattern |
| PAG naming convention (Entra-HelpDesk-Operators / IDM-HelpDesk-Operations) | Ch04 Delivery (PRV-T2 naming) | Replaced by Book 04's per-role naming convention |
| Licensing note (P2 for role-assignable groups) | Ch04 Corrections table | Corrected to P1 |
| PIM configuration table | Ch04 PIM settings for help desk roles | Aligned to Book 04 App B (claim 40) |
| Full audit trail | Ch04 Evidence every action leaves | Auto-flagging restated as design (claim 38) |
| Onboarding a technician | Ch04 Onboarding and offboarding | Condensed; identity governance platform request kept generic |
| Offboarding a technician | Ch04 Onboarding and offboarding | — |
| Assigned Entra roles and their scope (four-role table) | Ch04 Built-in roles, Capability is not authority, Corrections | Application and Hybrid Identity Administrator removed from the help desk (Book 04 Tier 1) |
| Callout: no native help desk role / Helpdesk Admin not used | Ch04 Corrections table | Corrected |
| SAM — three-platform model (IGA, ITSM, Entra) | Ch04 opening link to Ch03 | Routing and platform roles are Chapter 03's subject (helpdesk-flow source); product name of the IGA platform not carried |
| SAM — key principle (help desk is downstream) | Ch04 boundary; Book 04 Ch06 "executes, never decides" | — |
| SAM actors table | App A approval column (business approver, application owner, governance officer) | Actor-by-actor table is Chapter 03's routing material |
| How SAM auto-routes to ServiceNow (three conditions) | App A "How to read" (assigned ticket, approvals complete) | Detailed status rules belong to Chapter 03 |
| SAM automation vs help desk manual action | App A task tables | Corrected roles (custom app role; ImmutableID out of help desk; OneDrive provisioning) |
| Microsoft Security notifications (what, warning, triage steps, table) | App A Diagnostics and notifications; escalation matrix | Sender address removed (claim 77) |
| ServiceNow request types (six RITM types) | App A task rows (app assignment, revocation, consent, ImmutableID, MFA reset, OneDrive) | "RITM" vocabulary replaced with "ticket" |
| Admin consent triage procedure (seven steps) | App A notifications paragraph and escalation matrix | Full approval chain is Book 04 Ch06 |
| Admin consent escalation decision tree | App A escalation matrix (consent rows) | — |
| Enterprise app — assigning a group (11 steps) | App A Groups and application access row | Portal click path condensed; role corrected to custom role |
| Enterprise app — removing a group | App A revocation row | — |
| Enterprise app — validating assignments (read-only) | App A read-assignments row | Corrected role (appRoleAssignedTo/read) |
| Authorization summary for enterprise app actions | App A Groups and application access table | — |
| Hybrid — warning callout | Ch04 Why ImmutableID repair left the help desk | — |
| Hybrid — ImmutableID reset procedure (10 steps, Connect-MgGraph, Get-MgUser, Update-MgUser, Start-ADSyncSyncCycle, MSOnline) | Ch04 ImmutableID section; App A Hybrid identity rows and Script 2 (read-only comparison) | State-changing steps not carried as help desk procedure (claim 67); MSOnline dropped (claim 22) |
| Hybrid — sync mismatch identification | App A Hybrid identity (check sync state, 30-minute scheduler) | — |
| Hybrid — Entra Connect health checks | App A Connect Health row | Corrected: Azure RBAC Reader on Connect Health |
| Hybrid — escalation to Tier 3 | App A stop conditions paragraph | — |
| OneDrive — overview | App A OneDrive triage intro | — |
| OneDrive — common causes table | App A OneDrive triage table | Corrected: path limit 400 chars; UPN change "might" break sync; provisioning |
| OneDrive — step-by-step triage | App A OneDrive table and Script 4 | Steps condensed into the table |
| OneDrive — Entra-specific resolution actions | App A OneDrive and Diagnostics rows | Corrected roles: Reports/Security Reader for logs; License Administrator; SharePoint Administrator for pre-provisioning |
| OneDrive — auto-routing triggers (self-service, SAM alert, Azure Monitor webhook) | — | Intake mechanics are Chapter 03 and Chapter 05 (catalogs) |
| OneDrive — approval requirements by resolution | App A task rows' approval column | — |
| OneDrive — full resolution workflow (nine steps) | App A OneDrive section | Generic ticket lifecycle is Chapter 03 |
| OneDrive callouts: CA, UPN change, password reset sign-out, ad hoc fixes | App A OneDrive table; Ch04 High-risk (urgency to emergency change) | UPN "always" corrected |
| Escalation matrix | App A Escalation matrix | Rows updated to corrected roles |
| Audit — PIM elevation logging | Ch04 Evidence | Auto-flag restated as design |
| Audit — enterprise app change documentation | App A evidence column; Ch04 Evidence (ticket record) | — |
| Audit — SLA table | App A Service levels | Labeled program design; app-access SLA defers to Book 04 Ch06 |
| Audit — quarterly access reviews | Ch04 Onboarding and offboarding | Annual re-authorization folded into Book 04's 180-day eligibility expiry |
| Audit — audit log retention, no export | Ch04 Evidence (30 days, SIEM, no export) | — |
| Audit — non-compliance reporting | App A Conditions a supervisor reports | — |
| Document control — version history, review cycle, owner and approval, related documents | — | Document administration of the source; not workbook content |
| ServiceNow automation alignment (Entra ID Spoke) | — | Chapter 03 (helpdesk-flow source, which repeats this callout) and Chapter 05 own ServiceNow automation |
