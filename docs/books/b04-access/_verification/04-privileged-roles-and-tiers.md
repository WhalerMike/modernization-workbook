# Verification — Chapter 04, Privileged Roles and Tiers

Checked 2026-10-20 against Microsoft Learn (Learn MCP search and fetch), AWS documentation, Broadcom TechDocs, NIST CSRC and the NIST OSCAL content repository. Footnote keys are `c04-*` in the chapter.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Entra role = permissions + scope; built-in roles have immutable template IDs; some carry PRIVILEGED label | Built-in roles | verified | c04-roles-ref |
| 2 | Definition of a privileged permission (delegate management, modify credentials/authn/authz policies, access restricted data) | Built-in roles | verified | c04-privileged |
| 3 | Privileged label still preview; Graph listing beta only (`isPrivileged eq true`) | Built-in roles | verified | c04-privileged |
| 4 | Global Reader and Security Reader labeled; Exchange, SharePoint, Teams, Groups Admin, Reports Reader, Compliance Admin not labeled | Built-in roles | verified | c04-roles-ref |
| 5 | Fewer than five GAs; fewer than ten privileged role assignments | Built-in roles | verified | c04-privileged |
| 6 | Least-privileged-by-task reference exists and recommends narrower scope/custom roles | Least-privileged choices | verified | c04-by-task |
| 7 | Task table rows (Password Admin, PAA for privileged admins, Authentication Admin for methods, CA Admin, Security Reader for CA read, Reports Reader for logs, PRA for PIM, Security Reader for PIM audit) | Least-privileged choices | verified | c04-by-task |
| 8 | Cloud Application Administrator can grant tenant-wide admin consent | Least-privileged choices | verified | c04-admin-consent |
| 9 | Enterprise access model "replaces" AD tier model (source wording in Vol III and briefing) | Tiers | corrected: model *builds on* the AD tier model; Tier 0 → control plane, Tier 1 → management + data/workload planes, Tier 2 → user + app access; hierarchy prevents control of higher planes from lower | c04-eam |
| 10 | Privileged intermediaries (PAM tools, jump hosts, runbooks, high-privilege SPs) are control-plane assets | Tiers | verified | c04-privileged |
| 11 | Security levels enterprise / specialized / privileged and their populations | Tiers | verified | c04-levels |
| 12 | Program tiers T0/T1/T2/read-only, membership and gate values | Tiers | restated-as-design (from source guide's tiering table; hour values fixed to single values; Password Admin added to T2) | — |
| 13 | CA Admin / Security Admin can weaken auth-context gate; treat as highly privileged | Tiers | verified | c04-pim-settings |
| 14 | Three "tier" vocabularies crosswalk (B02 Ch05, B04 Ch06, this chapter) | Tiers | restated-as-design | — |
| 15 | Role-assignable group restrictions: isAssignableToRole at creation only/immutable; assigned membership only; no nesting; PRA to create; owners delegable; PAA to change members' credentials; RoleManagement.ReadWrite.Directory; 500 per tenant; P1 (P2 for PIM) | Role-assignable groups | verified; corrected the brief's "only GA/PRA/owner can manage" to PRA by default plus delegated owners | c04-rag |
| 16 | Two ways to model eligibility through a group | Two ways | verified | c04-graph-tutorial, c04-pim-groups |
| 17 | Exchange/SharePoint/Purview roles slow to activate under active-group + eligible-membership pattern | Two ways | verified | c04-pim-groups |
| 18 | Microsoft recommends approval for eligible assignments of groups used to elevate into roles | Two ways | verified | c04-rag |
| 19 | PIM for Groups: renamed Jan 2023; two policies; not required to be role-assignable; >500 in PIM vs 500 RAG; dynamic and AD-synced groups unsupported | PIM for Groups | verified | c04-pim-groups |
| 20 | PIM for Groups license P2 or Governance for eligible users and approvers | PIM for Groups | verified (search excerpt of licensing page) | c04-licensing |
| 21 | Double activation when eligible group holds eligible Azure role | PIM for Groups | verified | c04-azure-activate |
| 22 | Entitlement management Entra roles in packages is preview and being limited to non-privileged roles | Layer 1 | verified (added) | c04-em-roles |
| 23 | Azure privileged administrator roles: Owner, Contributor, UAA, RBAC Admin (source/brief omitted one) | Azure RBAC | corrected: list also includes Reservations Administrator | c04-azure-steps |
| 24 | Azure RBAC best practices incl. max 3 subscription owners, conditions on delegation | Azure RBAC | verified (search excerpt) | c04-azure-best |
| 25 | PIM for Azure resources at MG/sub/RG/resource; P2 or Governance | Azure RBAC | verified | c04-azure-activate |
| 26 | Elevate access assigns UAA at root `/`; remove after use | Azure RBAC | verified | c04-azure-elevate |
| 27 | Owner/Contributor don't grant VM Entra sign-in; VM Admin/User Login do; intentional audited separation; assign at RG or above | Azure RBAC | verified (added) | c04-vm-signin |
| 28 | Azure tier placements table | Azure RBAC | restated-as-design | — |
| 29 | AWS permission sets create Identity Center-controlled roles; session 1 h default/12 h max; portal 8 h default/90 days max | AWS | verified | c04-aws-permsets |
| 30 | AWS IAM best practices least privilege, temporary credentials, Access Analyzer | AWS | verified | c04-aws-iam-best |
| 31 | Access Analyzer unused-access findings; priced per role/user per month | AWS | verified | c04-aws-analyzer |
| 32 | AWS temporary elevated access = partner solutions; TEAM is aws-samples open source, customer-operated | AWS | verified; corrected source framing that treated TEAM as an AWS capability | c04-aws-tea, c04-aws-team |
| 33 | vSphere privileges → roles → permissions; global permissions; system roles immutable | VMware | verified (vSphere 9.0 docs) | c04-vsphere-authz |
| 34 | vCenter federation with Entra ID over OIDC + SCIM from vSphere 8.0 U2 | VMware | verified (9.0 docs page) | c04-vsphere-entra |
| 35 | CIEM engine covers Azure/AWS but not vCenter | VMware | restated (link to Vol VII Book 08's own Honest Limits; not an external claim here) | — |
| 36 | PAW device controls at privileged level; deployment with Intune/Autopilot/ESP/device group | PAW | verified; flagged as dated reference guidance (Windows 10, old product names) | c04-paw-devices, c04-paw-deploy |
| 37 | PAW enforcement = CA004 + CA025 (block non-PAW) | PAW | restated-as-design, consistent with Chapter 07 | — |
| 38 | Emergency access: ≥2 cloud-only onmicrosoft.com, permanent active GA, passkey/CBA, different methods, non-expiring, alert, validate every 90 days, use PAW/secure workstation | Emergency access | verified | c04-emergency |
| 39 | Exclude emergency accounts from *all* CA policies (Vol III wording) | Emergency access | corrected: exclude from policies that block or restrict sign-in; report-only need none | c04-emergency |
| 40 | Mandatory MFA phases (Oct 2024 portals; Oct 1, 2025 CLI/PowerShell/IaC) apply to emergency accounts; public cloud only | Emergency access | verified; added the sovereign-cloud caveat Book 02 lacks | c04-mandatory-mfa |
| 41 | Break-glass password in two sealed envelopes as sole credential (Vol III) | Emergency access | corrected: superseded by phishing-resistant method guidance | c04-emergency |
| 42 | NIST AC-2, AC-2(1), AC-6, AC-6(1), (2), (5), (7), (9), (10) text summaries | Federal requirements | verified (Rev. 5, release 5.2.0 catalog) | c04-nist |
| 43 | All mapped controls in SP 800-53B Moderate baseline; AC-2(7) not selected at Moderate | Federal requirements | verified (OSCAL Moderate profile 5.2.0, checked by script) | c04-nist-moderate |

## 2. Carry-forward ledger

Chapter 04 draws on the two Federal Compliance books (which stay in place and are linked) and on the tiering section of the PIM guide; the rest of the PIM guide is carried in Chapter 08's ledger.

| Source page § | Went to | Or why not carried |
|---|---|---|
| access-plane/pim-self-request-approval.md — Role tiering (table, "scope before you gate" tip) | Ch04 "The program's privilege tiers"; "Least-privileged choices" (scope first); Appendix B | — |
| access-plane/pim-self-request-approval.md — protected-action/CA-admin dependency argument | Ch04 placement of CA Admin in T0 | Build detail in Ch08 Step 6 |
| Vol III Book 01 — What this document addresses; standing privilege problem; before/after | Ch04 opening (by reference to Ch02) | Argument already made in Chapter 02; Vol III linked |
| Vol III Book 01 — Entra PIM architecture: eligible vs active; activation flow | Ch08 "Eligible, not active" | Vol III's "1–8 hours" and "approval window configurable, 1–4 hours" are wrong (1–24 h; 24 h fixed); corrected in Ch08 |
| Vol III Book 01 — Roles to protect with PIM (table) | Ch04 tiers; Azure RBAC table (subscription Owner/Contributor) | — |
| Vol III Book 01 — Enumerating and converting standing assignments (scripts) | Ch08 Step 5 (create-then-remove order) | Vol III script removes before creating and uses `noExpiration`; not reproduced; Ch08 notes not to copy that order |
| Vol III Book 01 — PIM policy configuration script | Ch08 Step 4 (corrected rule shapes) | Vol III's scope `Policy.ReadWrite.RoleManagement` and policy lookup not carried; Ch08 uses verified Graph lookup and scopes |
| Vol III Book 01 — Just-in-time server access (Arc SSH/RDP, scripts) | Ch04 Azure RBAC (VM Admin Login, link) | Long runbook stays in Vol III (linked, per brief) |
| Vol III Book 01 — PAW baseline, Intune compliance, WDAC, CA "require PAW" policy | Ch04 PAW section (Microsoft guidance, CA004/CA025) | Hardware/WDAC/compliance-policy runbook stays in Vol III (linked); Vol III's CA policy superseded by Ch07 CA025 |
| Vol III Book 01 — Emergency access accounts, alert rule, quarterly test | Ch04 Emergency access; Ch08 Step 0 | Sentinel alert JSON stays in Vol III; password-in-safe credential model corrected |
| Vol III Book 01 — Session management (AC-11, AC-12, IA-11, auth context c1) | Ch08 Step 2 (auth context c1 with sign-in frequency every time) | AC-11/AC-12 session-lock profiles are device/CA concerns covered by Ch07 and Vol III |
| Vol III Book 01 — Privileged access beyond Entra (multi-cloud, SailPoint, CyberArk) | Ch04 AWS / VMware sections, links | Vendor positioning not reproduced |
| Vol III Book 01 — NIST control closure table; FedRAMP 20x KSI note | Ch04 federal requirements; Ch08 control mapping | KSI-IAM-JIT is cited by Chapter 07 as Ch08's job; KSI detail not re-verified here |
| Vol VII Book 08 — What this addresses; engine table; CIEM loop; CA-7; closure necessity; authorities table | Ch04 Azure/AWS/VMware sections (by link) | ServiceNow/SailPoint coordination design stays in Vol VII Book 08 |
| Vol VII Book 08 — Honest limits (VMware gap, GCP later, scan lag) | Ch04 VMware paragraph | — |
| Vol VII Book 08 — Cross-references, provenance, references | — | Navigation and provenance for that book only |

## 3. Notes for the editor

- **Tier vocabulary.** Book 02 Ch05 (delegation Tier 1–3) and Book 04 Ch06 (app risk Tier 1–3) use "tier" differently; this chapter adds a crosswalk table and writes privilege tiers as T0/T1/T2.
- **Book 02 Ch09 emergency-access text** says mandatory MFA "applies to them too" without the public-cloud-only caveat; consider adding it there.
- **Diagram sources:** `docs/images/diagrams/b04-access/src/ch04-tier-model.flow.yaml`, `ch04-role-group-pim.flow.yaml` (not rendered; YAML parses).

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | "Administrative unit (AU)" expanded at first use in prose and in the figure's alt text, with Microsoft's definition | Least-privileged choices; tiers figure alt | verified | c04-au <https://learn.microsoft.com/entra/identity/role-based-access-control/administrative-units> |
| R2 | Tier 1 example list adds Authentication Policy and Compliance Administrator, matching Appendix B | Program's privilege tiers table | restated-as-design | Appendix B (internal) |
