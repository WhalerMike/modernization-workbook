# Verification — Chapter 13, Who Owns the Data Platform

Checked October 20, 2026. New chapter. Sources: `docs/projects/data-platform-charter.md` (§4 Scope, §9 Governance and Ownership; linked, stays in place); the role content of Chapters 01–12 and 14–23, Runbooks R01–R10 and Appendices A–B in this folder (what each team does at each step); Book 02 Chapter 06 and Book 05 Chapter 06 (linked for the general model and the RMF roles, not repeated). External facts re-opened on the dates shown in the footnotes.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Charter: sponsor and lead to be named; four domain leads (Database Authentication, Application-Tier Identity, Secrets Lifecycle, Evidence) | Where the roles come from | verified | data-platform-charter.md §9 |
| 2 | Charter initial phase excludes full consolidation/platform replacement and app code changes beyond authentication configuration | Where the roles come from | verified | data-platform-charter.md §4 |
| 3 | Reading of the charter against Chapter 06's gate (verdict in scope, execution needs own funding) | Where the roles come from | restated-as-design | Program model |
| 4 | AO only official who can accept security/privacy risk; approves POA&Ms | Where the roles come from; AO | verified | NIST SP 800-37r2 App. D (Authorizing Official) |
| 5 | System owner definition; decides access with information owner | Where the roles come from; matrix comment | verified | NIST SP 800-37r2 App. D (System Owner, fn 122) |
| 6 | Information owner/steward definition | Where the roles come from | verified | NIST SP 800-37r2 App. D |
| 7 | System security officer maintains posture, principal advisor on controls | Where the roles come from | verified | NIST SP 800-37r2 App. D |
| 8 | Avoid conflicts of interest when one person holds several roles | Where the roles come from | verified | NIST SP 800-37r2 App. D, fn 113 |
| 9 | Common control provider definition (identity team framing) | Identity team | verified (framing is design) | NIST SP 800-37r2 App. D |
| 10 | Mission/business owner may serve as AO | CIO and data leadership | verified | NIST SP 800-37r2 App. D |
| 11 | Entra admin is granted sysadmin; changing admin doesn't remove previous login | Data platform team | verified | Learn, Set up Entra auth with app registration (Arc) |
| 12 | ALTER ANY LOGIN / ALTER ANY USER can create Entra logins/users | Data platform team | verified | Same |
| 13 | ##MS_LoginManager## creates/modifies logins without GRANT; reader roles; securityadmin ≈ sysadmin; ##MS_SecurityDefinitionReader## can view password hashes | Data platform team; permissions table | verified | Learn, Server-level roles |
| 14 | MI needs User.Read.All, GroupMember.Read.All, Application.Read.All, assigned directly; only Privileged Role Administrator or higher can grant | Identity team; figure 2 | verified | Learn, Set up managed identity (Arc, SQL 2025) |
| 15 | App registration admin consent needs Privileged Role Administrator or higher | Identity team | verified | Learn, Set up Entra auth with app registration; Learn, Enable Entra auth without Arc |
| 16 | Privileged Role Administrator manages assignments for all roles incl. Global Administrator | Identity team | verified | Learn, Microsoft Entra built-in roles |
| 17 | PIM for Groups can require MFA, justification, approval, limit duration | Identity team | verified | Learn, PIM for Groups |
| 18 | PIM-eligible users need P2 or ID Governance; role-assignable groups need e.g. Privileged Role Admin; Groups Admin/Identity Governance Admin for others; no RMAU support; AU-scoped assignments | Identity team; permissions table | verified | Learn, Assign eligibility for a group in PIM |
| 19 | Onboarding role only for onboarding SP; Contributor = indirect administrator (extensions run privileged scripts); Resource Administrator manages | Server infrastructure; permissions table | verified | Learn, Identity and authorization (Arc servers) |
| 20 | Connecting SQL Server to Arc needs Onboarding or Contributor + Resource Administrator + Reader on RG | Server infrastructure | verified | Learn, Microsoft Entra authentication for SQL Server (Remarks) |
| 21 | Owner/Contributor on SQL Server resource can disable/enable SQL auth; same permissions as setting Entra admin; RBAC is the recovery path | Server infrastructure; permissions table | verified | Learn, Disable SQL authentication (Permissions, Prepare) |
| 22 | Agent token endpoint answers only local admins and Hybrid agent extension applications group | Server infrastructure | verified | Learn, Identity and authorization (Arc servers) |
| 23 | BULK permissions equivalent to sysadmin because OPENROWSET BULK can read the tokens folder | Server infrastructure | verified | Learn, Managed identity for SQL Server enabled by Azure Arc (Limitations) |
| 24 | Key Vault Certificate User and Secrets User for the Arc machine; certificate validity at most 12 months | Server infrastructure | verified | Learn, Set up Entra auth with app registration |
| 25 | 2027-04-01 is the program's NTLM backstop, not a Microsoft deadline; open Phase C question owned by the elimination program | Security, ISSO, AO | restated-as-design | Consistent with Chapter 15 (program design) |
| 26 | Reports Reader is least-privileged role to read audit and sign-in logs | Help desk; permissions table | verified | Learn, Least privileged roles by task |
| 27 | Helpdesk Administrator resets passwords for non-admins; can mean assuming identity; can't change credentials of role-assignable group members | Help desk; permissions table | verified | Learn, Microsoft Entra built-in roles (Helpdesk Administrator) |
| 28 | Roles, decide/do/consult split, matrix rows, one decider per row, permission map | Throughout | restated-as-design | Program model built from verified role definitions |
| 29 | Narrow ##MS_ roles exist only on SQL Server 2022 and later | Permissions for each team | verified | Learn, Server-level roles |

## Carry-forward ledger

New chapter; there is no source page to carry forward. The ledger records where each role's content was drawn from.

| Source § | Went to | Or why not carried |
|---|---|---|
| Data Platform charter §9 Governance and Ownership | Where the roles come from | — |
| Data Platform charter §4 Scope (out of scope, initial phase) | Where the roles come from | — |
| Data Platform charter §1–3, 5–8, 10 | Not carried | Purpose and approach are covered by Chapters 01–02 and 20–21; linked instead |
| Chapters 04, 07, 11, 14–15, 20; Runbooks R02, R03, R05, R06, R09 (DBA work) | The data platform team | — |
| Chapters 16–17 (data owner reviews rule; identity team builds groups, AUs, PIM) | Identity team; app and data owners; matrix | — |
| Chapters 18–19; Runbook R08 (app owner, code owner, connection-string gates) | Application owners and their developers | — |
| Chapters 09–10; Runbook R04 (Arc, extension, Key Vault, Graph grants) | Server infrastructure; identity team | — |
| Chapter 12 (five decisions; non-production window sign-off) | Matrix rows and comments | — |
| Chapter 15 unresolved-decision callout | Security, the ISSO and the authorizing official | — |
| Chapter 22 (certificate dependencies, unwritten ADCS decision) | Server infrastructure; matrix | — |
| Chapter 23 (platform choice per domain) | CIO and data leadership | — |
| Appendix B (break-glass, BULK permissions, Graph least privilege) | Server infrastructure; matrix | — |
| Book 02 Chapter 06 (RMF roles, Entra roles, tools) | Linked in opening | Not repeated, per brief |
| Book 05 Chapter 06 (server infrastructure, Arc RBAC) | Linked in opening; Arc RBAC facts re-verified | Not repeated beyond the SQL-specific consequences |

## Diagrams

- `docs/images/sql-server/diagrams/src/b06-ch13-decide-and-do.flow.yaml` — new (needs rendering).
- `docs/images/sql-server/diagrams/src/b06-ch13-instance-handoffs.flow.yaml` — new (needs rendering).
