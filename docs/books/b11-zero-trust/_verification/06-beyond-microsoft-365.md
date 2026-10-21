# Verification — Chapter 06, Beyond Microsoft 365: Networks, Other Clouds and Virtualized Estates

Checked October 21, 2026 by writer W2. Source: `docs/whitepapers/zero-trust-whole-agency-unification.md` (v1.1, shared with Ch01; Ch01 carries the incident narrative and the opening framing, Ch05 the SCuBA and Zero Trust Assessment comparison). EO 14028, M-22-09, ZTMM v2.0, SP 800-207 and the CISA/FBI ESXiArgs advisory (IC3 copy) were downloaded and read as text; CISA, FedRAMP, AWS, Broadcom and Microsoft pages were fetched directly or through the Microsoft Learn MCP tools; CVE data came from the NVD CVE API; control text from the OSCAL Rev. 5 catalog, release 5.2.0.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | EO 14028 §10(k): "throughout all aspects of the infrastructure" | Scope | verified | EO 14028 §10(k) |
| 2 | M-22-09 "also addresses on-premise and hybrid systems"; complete device inventory | Scope | verified | M-22-09 §III, §III.B |
| 3 | ZTMM device definition includes servers and networking equipment; cloud and virtual asset list | Scope | verified | ZTMM §5.2 |
| 4 | ZTMM Optimal: "comprehensive, at- or near-real-time view of all assets across vendors and service providers" | Scope | verified | ZTMM Table 3 |
| 5 | ZTMM aligned to one administrative domain or accreditation boundary; assess reliance on service providers | Scope | verified | ZTMM §5 (p. 12) |
| 6 | SP 800-207 assumptions 4 and 6 | Scope | verified | SP 800-207 §2.2 |
| 7 | SP 800-207 multi-cloud: "no difference between enterprise-owned..."; PEPs at each application and data source; providers implement similar functionality differently | Scope | verified | SP 800-207 §4.2 |
| 8 | SP 800-207 detailed knowledge of assets and subjects; incomplete knowledge leads PE to deny | Scope | verified | SP 800-207 §7.3 |
| 9 | Source: "NIST SP 800-207 states the core logic as infrastructure-agnostic by design" | Scope | corrected | SP 800-207 says its tenets "attempt to be technology agnostic" and requires consistent policy across enterprise and non-enterprise infrastructure; the chapter quotes those instead |
| 10 | BOD 25-01 scope: production tenants of products with a final SCuBA baseline | Where the baseline stops | verified | BOD 25-01 page |
| 11 | Required configurations list Microsoft 365 services (Entra ID, Defender, Exchange Online, Power Platform, SharePoint/OneDrive, Teams) and Google Workspace with due date December 1, 2026 | Where the baseline stops | verified | CISA Required Configurations page (policy IDs MS.AAD/DEFENDER/EXO/POWERPLATFORM/SHAREPOINT/TEAMS; GWS.CALENDAR/CHAT/COMMONCONTROLS/DRIVEDOCS/GMAIL/GROUPS/MEET, due 12/01/2026) |
| 12 | Source table: SCuBA scope includes Power BI; Google Workspace "since 10 Jul 2026" | Where the baseline stops | corrected / removed | No MS.POWERBI policy on the required configurations page; GWS policies show "Date Added" July/September 2023 and due date 12/01/2026, not July 10, 2026. The chapter states only what the page shows; the tool comparison is Ch05's |
| 13 | BOD 25-01 doesn't reach on-premises AD | Where the baseline stops | verified (settled in Book 09/Book 01; Ch04) | Brief's settled facts; BOD 25-01 scope |
| 14 | Source: "BOD 25-01 is M365-specific" | Where the baseline stops | corrected | It now also lists Google Workspace |
| 15 | CM-8 items a.1 to a.3 quoted | One inventory | verified | SP 800-53 Rev. 5.2.0 CM-8 |
| 16 | M-22-09 CDM inventories; CISA "will work toward" cloud-oriented CDM, possibly via provider interfaces | One inventory | verified | M-22-09 §III.B.1 |
| 17 | BOD 23-01: 7-day discovery, 14-day enumeration, 72-hour CDM ingestion, cloud VMs in scope | One inventory | verified | BOD 23-01 page |
| 18 | Source: CM-8 and BOD 23-01 "both require a single, authoritative accounting" | One inventory | restated-as-design | Neither says "one inventory"; the chapter presents the single-inventory reading as the program's, grounded in CM-8's no-duplicate-accounting item |
| 19 | SC-20, SC-21, SC-22 statements | One naming authority | verified | SP 800-53 Rev. 5.2.0 |
| 20 | Source: SC-20/21/22 "apply the same requirement regardless of whether a workload sits on-network, behind a CSP's native DNS..." | One naming authority | restated-as-design | The controls apply to the organization's resolution service; "authoritative before the fact" is the program's position |
| 21 | ZTMM Networks Traditional: macro-segmentation, bulk traffic VPN tunnels | No implicit trust | verified | ZTMM Table 4 |
| 22 | M-22-09 "move away from ... broad enterprise-wide network" | No implicit trust | verified | M-22-09 §III.C.5 |
| 23 | SP 800-207 assumption 1: private network not an implicit trust zone | No implicit trust | verified | SP 800-207 §2.2 |
| 24 | VPN, default VNet and flat virtualized segment are the same mistake | No implicit trust | restated-as-design | Author's argument |
| 25 | ESXiArgs: over 3,800 servers; encrypts VM configuration files | Hypervisor | verified | CISA/FBI AA23-039A (also IC3 PDF) |
| 26 | Source: ESXiArgs exploited CVE-2021-21974 | Hypervisor | corrected (in Ch01; Ch06 now summarizes and links) | AA23-039A names no CVE ("may be exploiting known vulnerabilities"; disable SLP "which ESXiArgs may leverage"). NVD: CVE-2021-21974 is the OpenSLP heap overflow published Feb 24, 2021 |
| 27 | CVE-2024-37085: "ESX Admins" by default; not built in; matched by name, not SID | Hypervisor | verified | Microsoft Threat Intelligence, July 29, 2024 |
| 28 | Source: attacker "could delete and recreate" the group | Hypervisor | corrected | NVD describes recreating the group after deletion; Microsoft says the in-the-wild method was creating a group that didn't exist (renaming and privilege refresh also described, not observed). The chapter states both |
| 29 | Akira and Black Basta deployments | Hypervisor | verified (moved to Ch01's account; not repeated) | Microsoft, July 29, 2024 |
| 30 | CISA KEV added July 30, 2024 | Hypervisor | verified | NVD record `cisaExploitAdd` |
| 31 | "Many security products have limited visibility and protection for an ESXi hypervisor"; forward ESXi logs to a SIEM | Hypervisor | verified | Microsoft, July 29, 2024 |
| 32 | Source: compromise of ESXi/vCenter happens "without a single guest-OS-level EDR, identity, or network control ever generating an alert" | Hypervisor | restated-as-design | Softened to "guest posture says little about the host"; the absolute claim isn't documented |
| 33 | vCenter: local identity source plus only one external IdP | Hypervisor | verified | Broadcom KB 406895; vSphere 9.0 Entra federation page |
| 34 | Entra ID federation over OIDC with SCIM from vSphere 8.0 Update 2 | Hypervisor | verified | Broadcom vSphere 9.0 docs; KB 322179 |
| 35 | Federation docs cover vCenter sign-in, not ESXi host authentication | Hypervisor | verified (absence noted) | Broadcom vSphere 9.0 Entra federation page |
| 36 | Source: "vCenter's SSO domain is frequently its own identity source" | Hypervisor | corrected | Restated precisely: vCenter keeps a local identity source alongside at most one external provider |
| 37 | SP 800-207 §5.1 quotes on PE/PA | Unification layer | verified | SP 800-207 §5.1 |
| 38 | SP 800-207 §5.6 proprietary formats and lock-in | Unification layer | verified | SP 800-207 §5.6 |
| 39 | Unification layer minimum (Tier 0, own telemetry, blast radius, open formats) | Unification layer | restated-as-design | Author's argument |
| 40 | AWS Security Hub CSPM NIST 800-53 standard supports "a subset"; no manual-check requirements | Provider tools | verified | AWS Security Hub User Guide |
| 41 | Azure Policy: "Compliant" refers only to policy definitions; "only a partial view" | Provider tools | verified | Microsoft Learn, NIST SP 800-53 Rev. 5 initiative |
| 42 | Broadcom VCF security and compliance guidelines; disclaimer on assumptions | Provider tools | verified | github.com/vmware/vcf-security-and-compliance-guidelines |
| 43 | FedRAMP "certifies the cloud service offering"; "each agency still authorizes its own federal information systems"; risk for configuration and integrations; configure identity, logging, monitoring | Provider tools | verified | FedRAMP Consolidated Rules for 2026, "Using a FedRAMP Certified Cloud Service" |
| 44 | Reconcile at the control level because tools use different identifiers and severity models | Provider tools | restated-as-design | Author's argument |
| 45 | Whole-agency score test (six items) | What a score requires | restated-as-design | Author's argument |

## Carry-forward ledger

Covers every section of the shared source. Rows marked Ch01 or Ch05 are the other writers' share; this chapter links to them rather than repeating them.

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, DOCX download callout | — | Site mechanics |
| Companion-paper callout | Ch06 opening paragraph (links Ch01, Ch04, Ch05); Ch02 holds the principles | Section-number cross-references to the companion paper dropped |
| Problem / solution / ask box | Problem: Ch06 opening; solution: "What a whole-agency score requires"; ask: items 1, 5 and the final paragraph | Also used by Ch01 |
| Executive summary | Ch06 opening and chapter structure | Overlaps Ch01 "The case in one paragraph" |
| §1 Why one system, not three | Ch06 opening (three exercises, "three partial assessments", scan confirms but can't unify) | — |
| §1 Storm-0558 | Ch01 "Two incidents that sat beneath any single tool" | Not repeated in Ch06: identity-provider incident, Ch01's subject |
| §1 ESXiArgs and CVE-2024-37085 recap | Ch01 (full narrative); Ch06 "The hypervisor is a distinct threat class" (summary, link, corrections) | — |
| §2 root issue: same naming and identity plane; SP 800-207 policy logic | Ch06 opening; "What the federal documents say about scope" | "Infrastructure-agnostic" corrected (claim 9) |
| §2 hypervisor as a distinct threat class | "The hypervisor is a distinct threat class"; figure ch06-beneath-the-guest | — |
| §2 vCenter SSO and federation risk | Same section, final paragraph | Corrected and updated with vSphere 8.0 U2 federation facts |
| §2 Fact 1: one inventory (CM-8, BOD 23-01) | "One authoritative asset inventory" | Corrected (claim 18) |
| §2 Fact 2: one naming authority (SC-20/21/22) | "One naming and address-resolution authority" | Restated (claim 20) |
| §2 Fact 3: VPN-perimeter thinking | "No implicit trust from any boundary" | — |
| §2 Fourth fact: unification layer as highest-value target | "The unification layer becomes the target" | Added SP 800-207 §5.1 and §5.6 support |
| §2 BOD 25-01 legal-scope parenthesis | "Where the Microsoft 365 baseline stops" | Corrected: list now includes Google Workspace |
| §2 practical consequence | Ch06 opening and "What a whole-agency score requires" | — |
| §3 SCuBA vs Zero Trust Assessment table and overlap analysis | Ch05 | Not repeated; Ch06 figure ch06-who-answers keeps one row for each |
| §3 "even Microsoft did not converge them"; multiply by every CSP | "Each provider's tool answers for its own platform" | — |
| §3 governance principle: ownership can't be delegated to a CSP tool | Same section, final paragraph; "What a whole-agency score requires" item 5; Ch07 | — |
| §3 practical guidance bullets (keep ScubaGear, add ZTA, reconcile at control level, GCC caveat) | Ch05 (first, second, fourth); Ch06 (control-level reconciliation) | GCC caveat is Ch05's |
| §3 "none of this substitutes for agency-level reconciliation" | "Each provider's tool answers for its own platform" | — |
| §4 Conclusion ("horse before the cart") | Final paragraph ("Unify first; then let assessment confirm it") | Idiom dropped |
| Sources list | Footnotes, each re-opened | Office 365 GCC service description and CSRB report not cited here (Ch05 and Ch01 respectively) |
