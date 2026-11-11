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
| 44 | A Domain Admin signing in to a member server trusted for delegation risks domain compromise; mark sensitive accounts "cannot be delegated" | Tier placements | verified | c04-not-delegated |
| 45 | Protected Users members cannot be delegated; add after testing | Tier placements | verified | c04-not-delegated |

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
| H1 | Every tier is held by cloud-only accounts; Microsoft Zero Trust guidance makes privileged accounts cloud-native | Five placements | verified (added Oct 31, 2026) | c04-cloud-only <https://learn.microsoft.com/entra/fundamentals/zero-trust-protect-identities> |
| H2 | HISG recommends cloud-only privileged accounts so lateral movement reaches only lower-privilege accounts | Same | verified (added) | c04-hisg, HISG §3.1.1 <https://www.cisa.gov/resources-tools/services/hybrid-identity-solutions-guidance-hisg> |
| H3 | MS.AAD.7.3v1 is a SCuBA mandatory policy under BOD 25-01 | Same | verified (added) | Book 02 Appendix A crosswalk row and BOD 25-01 Required Configurations |
| H4 | Administrators keep a synchronized account for daily work and a separate cloud-only account for the role | Same | restated-as-design | program position |

## Decision of Nov 8, 2026

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| N8-1 | Example group `PRV-T2-UserAdmin-AU-Finance` renamed `PRV-T2-UserAdmin-Finance` (and `PRV-T2-GroupsAdmin-AU-Finance` to `PRV-T2-GroupsAdmin-Finance`); the scope segment names the AU's department | Group naming paragraph (Book 02 comparison) | decision of Nov 8; design naming | Mike's decision of Nov 8, 2026, item 1 |

## Additions, November 9, 2026 (held items after the baseline edition)

Item 204 of the Nov 7 sort: the tiers table said "three places with three meanings," but AD Tier 0 (this chapter), the Tier 1 server policy (Chapter 07, CA026) and the device security tier (Book 05 Ch08; Book 03 Ch06) are further meanings. Book 05 Ch03's coverage tiers are one more meaning, added so the count (seven) is complete. Heading renamed; its old anchor kept for Chapter 06's link.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| T1 | AD DS tier model: Tier 0 identity control plane (DCs, AD FS, AD CS, Entra Connect, Tier 0 admins), Tier 1 member servers and enterprise applications, Tier 2 end-user devices and accounts | Tiers table, Active Directory tier row | verified (new) | c04-ad-tier <https://learn.microsoft.com/windows-server/identity/ad-ds/tier-model> |
| T2 | AD tier model puts member servers and server administrator roles in Tier 1 | Server tier row | verified (new) | c04-ad-tier |
| T3 | Server tier is used only as Tier 1 (CA026, mapped from CA-011 "Tier 1 servers") | Server tier row | restated (internal) | Chapter 07 policy table and numbering map |
| T4 | Device `extensionAttribute11` values `Tier0`, `Tier1`, `Tier2`, `UNPOSITIONED`; `Tier0` is PAWs, `Tier2` standard workstations | Device security tier row | restated (internal) | Book 05 Ch08 device attribute schema, CP-002, CP-003 |
| T5 | Four coverage tiers, managed to isolated or retired | Coverage tier row | restated (internal) | Book 05 Ch03, What Intune and Arc don't reach |
| T6 | The AD tier model requires a PAW of the same tier for each tier | Paragraph after the table | verified (new) | c04-ad-tier, section "Privileged access workstations (PAWs) required for each tier" |

## Learn coverage pass, November 9, 2026

Citations added from the Learn coverage map (covered-uncited pages). No content removed or changed in meaning.

| Learn page | Where cited | Date read | Supports |
|---|---|---|---|
| [Understand Microsoft Entra role concepts](https://learn.microsoft.com/entra/identity/role-based-access-control/concept-understand-roles) | Built-in roles and the privileged label, first sentence, c04-role-concepts | Nov 9, 2026 | A role is a set of permissions assigned to a principal at a scope |
| [Create a custom role in Microsoft Entra ID](https://learn.microsoft.com/entra/identity/role-based-access-control/custom-create) | Least-privileged choices, c04-custom-roles | Nov 9, 2026 | Custom role as a narrower grant |
| [Understanding least privilege with Microsoft Entra ID Governance](https://learn.microsoft.com/entra/id-governance/scenarios/least-privileged) | Same, c04-custom-roles | Nov 9, 2026 | Minimum access for the task; least-privileged roles |
| [Secure resource isolation in a single tenant](https://learn.microsoft.com/entra/architecture/secure-single-tenant) | Least-privileged choices, AU scoping, c04-secure-isolation | Nov 9, 2026 | Administrative units restrict a role's permissions to part of the organization |
| [Introduction to delegated administration and isolated environments](https://learn.microsoft.com/entra/architecture/secure-introduction) | Same, c04-secure-isolation | Nov 9, 2026 | Administrative units for role management |
| [Secure access practices for administrators in Microsoft Entra ID](https://learn.microsoft.com/entra/identity/role-based-access-control/security-planning) | Five placements, cloud-only bullet, c04-security-planning | Nov 9, 2026 | Privileged accounts cloud-only with no ties to on-premises AD |
| [Appendix D: Securing Built-in Administrator Accounts](https://learn.microsoft.com/windows-server/identity/ad-ds/plan/security-best-practices/appendix-d--securing-built-in-administrator-accounts-in-active-directory) | Five placements, AD Tier 0 not delegated, c04-ad-least-privilege | Nov 9, 2026 | "Account is sensitive and cannot be delegated" on privileged accounts |
| [Implementing Least-Privilege Administrative Models](https://learn.microsoft.com/windows-server/identity/ad-ds/plan/security-best-practices/implementing-least-privilege-administrative-models) | Same, c04-ad-least-privilege | Nov 9, 2026 | Delegation lets an account's credentials be used on other systems; the flag prevents it |
| [Guidance about how to configure protected accounts](https://learn.microsoft.com/windows-server/identity/ad-ds/manage/how-to-configure-protected-accounts) | Same, c04-ad-least-privilege | Nov 9, 2026 | Protected Users for administrator accounts |
| [Microsoft Entra ID Governance deployment guide to govern privileged identities](https://learn.microsoft.com/entra/architecture/governance-deployment-privileged-identities) | How a role reaches a person, c04-gov-privileged | Nov 9, 2026 | Eligible vs active PIM assignments; PIM for Entra roles, Azure roles and groups |
| [Best practices to secure with Microsoft Entra ID](https://learn.microsoft.com/entra/architecture/secure-best-practices) | Azure RBAC (PIM for Azure roles), Privileged access workstations, Emergency access accounts, c04-secure-best | Nov 9, 2026 | No standing access via PIM; privileged access from secure workstations; two cloud-only emergency accounts |
| [Implementing Secure Administrative Hosts](https://learn.microsoft.com/windows-server/identity/ad-ds/plan/security-best-practices/implementing-secure-administrative-hosts) | Privileged access workstations; Domain controllers subsection, c04-admin-hosts | Nov 9, 2026 | Never administer a trusted system from a less-trusted host |

Also cited for the first time in this chapter, through the additions below: Best practices for securing Active Directory, Appendix E, Appendix F and Appendix G (securing the Enterprise Admins, Domain Admins and Administrators groups), and Avenues to Compromise.

## Additions, November 9, 2026 (Learn gaps)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| D1 | A DC can read and write anything in AD DS; a compromised one leaves the forest untrustworthy without a known good backup | Domain controllers while they remain Tier 0 | verified (new) | c04-dc-secure <https://learn.microsoft.com/windows-server/identity/ad-ds/plan/security-best-practices/securing-domain-controllers-against-attack> |
| D2 | AD security in three parts: reduce attack surface, monitor, plan for compromise | Same | verified (new) | c04-ad-best <https://learn.microsoft.com/windows-server/identity/ad-ds/plan/security-best-practices/best-practices-for-securing-active-directory> |
| D3 | Administer DCs only from higher-trust hosts; RDP to DCs only from authorized users and systems, by GPO and Windows Firewall | Same, hardening list | verified (new) | c04-dc-secure; c04-admin-hosts |
| D4 | Block internet from DCs and prevent browsers; privileged browsing from DCs seen in assessments | Same | verified (new) | c04-dc-secure; c04-avenues <https://learn.microsoft.com/windows-server/identity/ad-ds/plan/security-best-practices/avenues-to-compromise> |
| D5 | Patch and manage DCs separately from general servers | Same | verified (new) | c04-dc-secure |
| D6 | Newest supported Windows Server, Server Core preferred, minimal software | Same | verified (new) | c04-dc-secure |
| D7 | Windows Server 2019 minimum while DCs remain; 2016 gone by Jan 12, 2027 | Same | program assumption | program baseline (stated as an assumption) |
| D8 | Enterprise Admins, Domain Admins, Administrators hold no day-to-day accounts; changes alert | Same | verified (new) | c04-ad-groups (Appendices E, F, G) |
| D9 | Use Advanced Audit Policy subcategories; Group Policy may misreport effective policy, auditpol.exe doesn't | Same, monitoring | verified (new) | c04-ad-monitor <https://learn.microsoft.com/windows-server/identity/ad-ds/plan/security-best-practices/monitoring-active-directory-for-signs-of-compromise> |
| D10 | Appendix L High events 4719, 4765, 4794; High means investigate one occurrence; test against baseline first | Same | verified (new) | c04-events <https://learn.microsoft.com/windows-server/identity/ad-ds/plan/appendix-l--events-to-monitor> |
| D11 | Read-only `auditpol /get` commands | Same, code block | command (read-only) | c04-ad-monitor |
| D12 | A compromised forest can't be fully restored without a record of every change or a known good backup; changes replicate to all DCs | Same, planning for compromise | verified (new) | c04-ad-compromise <https://learn.microsoft.com/windows-server/identity/ad-ds/plan/security-best-practices/planning-for-compromise> |
| S1 | Entra sign-in to Azure Linux VMs and Arc-enabled Linux servers via OpenSSH certificates (AADSSHLoginForLinux, system-assigned managed identity, `az ssh vm`); no SSH keys distributed; disabled accounts lose access | Azure RBAC, "Privileged SSH to Linux servers" | verified (new) | c04-linux-ssh <https://learn.microsoft.com/entra/identity/devices/howto-vm-sign-in-azure-ad-linux> |
| S2 | VM Administrator Login allows sudo; VM User Login doesn't | Same | verified (new) | c04-linux-ssh |
| S3 | Conditional Access through the Azure Linux VM Sign-In app; device checks only with the Azure CLI on Windows and macOS | Same | verified (new) | c04-linux-ssh |
| S4 | Azure Policy flags VMs without Entra sign-in and unapproved local accounts | Same | verified (new) | c04-linux-ssh |
| S5 | Supported clouds: Azure Global and Azure Government; GCC, GCC High and DoD breakdown not yet specified | Same | verified (new); breakdown not yet specified | c04-linux-ssh |
| S6 | SSH admin is server-tier (T1) as eligible VM Administrator Login on the resource group; identity-infrastructure servers are T0; local accounts and long-lived keys are findings | Same, second paragraph | restated-as-design | program position (consistent with the Azure RBAC placements table) |
| S7 | Read-only Azure CLI checks for role assignments and the extension | Same, code block | command (read-only) | c04-linux-ssh |

## Additions, November 11, 2026 (Zero Trust Assessment closure, B04-01, CM-01)

New subsection "Reference architecture, exclusions and evidence" under Emergency access accounts. The build, alert template and drill script stay in the Privileged Access implementation guide (Step 2); this subsection links to them.

| # | Claim (short) | Where | Verdict | Source | Checked |
|---|---|---|---|---|---|
| Z1 | Two or more cloud-only *.onmicrosoft.com accounts; passkey (FIDO2) recommended or CBA; methods differ from normal admins; credentials don't expire or fall to cleanup | Reference architecture table | verified | https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access | Nov 11, 2026 |
| Z2 | Credentials in separate secure, fireproof locations; authorized-user list reviewed; safe combinations changed regularly and after departures | Same, Custody row | verified | https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access (Store account credentials safely; Validate accounts regularly) | Nov 11, 2026 |
| Z3 | Global Administrator permanent active in PIM; designated secure workstation or PAW | Same | verified | https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access | Nov 11, 2026 |
| Z4 | Dedicated group excluded from CA policies that block or restrict sign-in; report-only policies need no exclusion | Same; exclusion rules | verified | https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access (Conditional Access considerations) | Nov 11, 2026 |
| Z5 | Learn's sample alert queries SigninLogs by object ID; threshold greater than 0; severity 0 | Monitoring row | verified | https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access (Monitor sign-in and audit logs) | Nov 11, 2026 |
| Z6 | Non-interactive and audit tables added to the alert | Monitoring row; Telemetry | restated-as-design | program addition; the guide's Step 2 footnote gives the non-interactive logging of FIDO2 refresh-token sign-ins | Nov 11, 2026 |
| Z7 | Validate at least every 90 days, after staff changes and after subscription changes; tell security monitoring first | Validation row; Evidence | verified | https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access (Validate accounts regularly) | Nov 11, 2026 |
| Z8 | Contingency Conditional Access policies suggested by Learn | Contingency row | verified | https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access (Conditional Access considerations) | Nov 11, 2026 |
| Z9 | Post-use review decides drill, real emergency or misuse | Day-two ownership | verified | https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access (Prepare a post-mortem team) | Nov 11, 2026 |
| Z10 | Passwordless (FIDO2), CBA, Conditional Access, PIM available in Azure for US Government; GCC pairs with Entra in commercial Azure, GCC High and DoD with Azure Government | Applies | verified | https://learn.microsoft.com/entra/identity/authentication/feature-availability; https://learn.microsoft.com/azure/security/fundamentals/feature-availability | Nov 11, 2026 |
| Z11 | Five exclusion rules, two test records per drill, owners and cadence | Exclusion rules; Evidence; Day-two | restated-as-design | program position | Nov 11, 2026 |
| Z12 | KQL union of SigninLogs, AADNonInteractiveUserSignInLogs, AuditLogs | Telemetry | unverifiable (illustrative, not run) | labelled illustrative in the page | Nov 11, 2026 |
