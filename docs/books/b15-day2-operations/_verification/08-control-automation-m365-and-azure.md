# Verification — Chapter 08, Control Compliance Automation: Microsoft 365 and Azure

Writer W6. Sources: `docs/compliance/Vol_VII_Book_02_M365_Control_Compliance_Automation.md` and `docs/compliance/Vol_VII_Book_03_Azure_Control_Compliance_Automation.md` (whole pages). Kept consistent with Book 11 Ch04/Ch05 (ScubaGear, BOD 25-01), Book 12 Ch02 (evidence contract fields and `disposition` rule), Ch06 (BOD 26-04 clock), Ch07 (Update Manager, patch record), Ch08 (Defender for Cloud in Azure Government, owned-tool-first), Book 13 Ch10 (native tools vs. evidence record; ticket to machine), Book 14 Ch11 (vendor scores are not assessment evidence), Book 10 Ch05/Ch09 (landing-zone initiative; feature register).

All sources opened October 21, 2026: Microsoft pages through the Microsoft Learn MCP search/fetch tools; CISA, NIST, FedRAMP, ScubaGear (GitHub) and ServiceNow pages through WebFetch. No personal data sent to any site.

Internal vocabulary translated: "coordination layer" kept in lower case as Book 13 uses it; "Closure Necessity" callouts dropped (argument kept as prose); "Vol III/VI/VII Book NN" cross-references replaced by links to published Books 04, 10, 11, 12, 13, 14 and B15 Ch07/Ch09/Ch11/Ch12; "Theme E", "compliance spine", `render_authorities_table.py`, "Expansion Plan §16", "Vendor Currency Doctrine", "Management-Plane Coordination Doctrine" removed; "KSI-*" evidence-slot columns not carried (KSIs bind providers); `{{< meta agency.short >}}` and the internal banner/draft stamp not carried.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Five-step loop (test, detect, raise, actuate, close with evidence) | One loop | restated-as-design | Source; Book 13 Ch10 |
| 2 | ITSM platform holds read, not standing write; AC-6 rationale | One loop | restated-as-design (AC-6 cited as the control, not as requiring this) | NIST SP 800-53 Rev. 5 |
| 3 | Task closes on a re-test (`disposition` rule) | One loop | verified against published Book 12 Ch02 | Book 12 Ch02 |
| 4 | ScubaGear queries M365 APIs with PowerShell, evaluates with OPA/Rego, outputs HTML, JSON, CSV | ScubaGear | verified | ScubaGear README v1.8.0 |
| 5 | `-M365Environment` values commercial/gcc/gcchigh/dod; required for GCC High/DoD and Power Platform | ScubaGear | verified | ScubaGear parameters.md v1.8.0 |
| 6 | BOD 25-01: deploy all SCuBA tools by April 25, 2025; continuous reporting via CISA solution or quarterly machine-readable submission | ScubaGear | verified | CISA BOD 25-01 page |
| 7 | Source: "SCuBA (operationalized under BOD 25-01)" defines baselines; conformance tooling measures, doesn't fix | ScubaGear | verified/restated | BOD 25-01; Book 11 Ch04 |
| 8 | Policy ID example `MS.AAD.1.1v1` "Legacy authentication SHALL be blocked" | ScubaGear | verified | ScubaGear aad.md v1.8.0 |
| 9 | Finding-to-task mapping held as data; change vs incident | ScubaGear | restated-as-design | Source |
| 10 | Omitted policies appear as "Omitted" with rationale; CISA expects approval through risk process | ScubaGear | verified via published Book 11 Ch04 (linked, not re-footnoted) | Book 11 Ch04 (CISA implementation guidance) |
| 11 | Graph List conditionalAccessPolicies: `Policy.Read.All`; Global Reader/Security Reader; available in global, US Gov L4, L5 | Graph | verified | Microsoft Learn "List policies" |
| 12 | GCC uses graph.microsoft.com; GCC High graph.microsoft.us; DoD dod-graph.microsoft.us; app registration in matching cloud | Graph | verified | Microsoft Learn "Microsoft Graph national cloud deployments" |
| 13 | CA exceptions as requests with security approver and expiry; expired-but-present exclusion = high severity | Graph | restated-as-design | Source |
| 14 | Management Activity API endpoints: manage-gcc.office.com, manage.office365.us, manage.protection.apps.mil | Purview | verified | Microsoft Learn Management Activity API reference |
| 15 | Audit (Standard) 180 days; Audit (Premium) one year default for Entra ID/Exchange/OneDrive/SharePoint; up to 10 years with add-on; Management Activity API for longer retention | Purview | verified | Microsoft Learn "Learn about auditing solutions" |
| 16 | GCC: Audit Standard, 1-yr and 10-yr retention, increased API bandwidth available | Purview | verified | Microsoft Learn GCC Purview planning page |
| 17 | Label/DLP changes as change records; DLP override/mass label removal as incident with review | Purview | restated-as-design | Source |
| 18 | Source: Purview "covers AU-10 / SC-28" | Purview | not carried as a claim; data-protection controls left to Book 12 Ch09 | — |
| 19 | Compliance Manager premium regulations include FedRAMP Moderate and FedRAMP SSP High Baseline; Data Protection Baseline included; GCC/GCC High/DoD get CMMC included | Compliance Manager | verified | Microsoft Learn regulations list |
| 20 | Universal templates not usable by GCC Moderate, GCC High, DoD | Compliance Manager | verified | Microsoft Learn "Learn about regulations" |
| 21 | Automated testing sources: built-in, Secure Score, Defender for Cloud (Azure, AWS, GCP) | Compliance Manager | verified | Microsoft Learn improvement actions |
| 22 | Improvement action statuses refresh every 24 hours; export testing history to Excel; assessment export is a snapshot | Compliance Manager | verified | Microsoft Learn improvement actions; assessments |
| 23 | GCC: Compliance Manager available; continuous compliance assessments rolling out; alerts in development | Compliance Manager | verified | Microsoft Learn GCC Purview planning page |
| 24 | High compliance score isn't absolute measure of compliance | Compliance Manager | verified via published Book 14 Ch11 (linked) | Book 14 Ch11 (Compliance Manager FAQ) |
| 25 | "No documented feed into another system" for Compliance Manager | Compliance Manager | restated: writer found only Excel exports in Microsoft Learn; stated as what the documentation shows | Microsoft Learn pages above |
| 26 | Azure Policy FedRAMP Moderate built-in initiative for Azure and a separate Azure Government initiative | Azure Policy | verified | Microsoft Learn samples fedramp-moderate, gov-fedramp-moderate |
| 27 | "Compliant ... refers only to the policy definitions themselves..." caveat; manual policies | Azure Policy | verified (quote) | Microsoft Learn fedramp-moderate sample |
| 28 | Standard evaluation every 24 hours; ~15 minutes after resource change; on-demand scan | Azure Policy | verified | Microsoft Learn "Get compliance data" evaluation triggers |
| 29 | Exemption categories Waiver/Mitigated; `expiresOn`; not deleted at expiry, no longer honored; compliance substate queryable | Azure Policy | verified | Microsoft Learn exemption structure |
| 30 | Exemptions only from approved ITSM request; other exemptions are findings | Azure Policy | restated-as-design | Source (exemption discipline) |
| 31 | Defender regulatory compliance standards are Azure Policy initiatives; non-automatable controls greyed; no-resource standards hidden | Defender | verified | Microsoft Learn regulatory compliance standards; assign standards |
| 32 | Assigning a standard requires any plan except Servers P1 / APIs P1 | Defender | verified | Microsoft Learn assign standards |
| 33 | Available standards: FedRAMP 'H' & 'M' (Azure); NIST SP 800-53 R5.1.1 (Azure, AWS, GCP) | Defender | verified | Microsoft Learn regulatory compliance standards |
| 34 | Continuous export of regulatory compliance (stream or weekly snapshot) to Log Analytics/Event Hubs; workflow automation on assessment change | Defender | verified | Microsoft Learn "Improve regulatory compliance" |
| 35 | Regulatory compliance, continuous export, workflow automation GA in Azure and Azure Government | Defender | verified | Microsoft Learn support matrix |
| 36 | Continuous export sends only on state change | Defender | verified via published Book 12 Ch02 (linked) | Book 12 Ch02 |
| 37 | Source: Defender "within the GCC Moderate boundary" | Defender | corrected: Defender for Cloud is an Azure service (commercial or Azure Government), as Book 12 Ch08 established; GCC tenants pair with commercial Entra ID | Book 12 Ch08; Microsoft Learn CMMC page |
| 38 | ARG: PolicyResources policystates; SecurityResources regulatorycompliancestandards with passed/failed/skipped/unsupported counts | Resource Graph | verified | Microsoft Learn ARG sample queries (Policy, Defender) |
| 39 | Azure Resource Graph GA in Azure Government | Resource Graph | verified | Microsoft Learn Azure Government GA roadmap |
| 40 | ARG max 1,000 records per request; page with skip token | Resource Graph | verified | Microsoft Learn paging guidance; Search-AzGraph |
| 41 | Defender ServiceNow integration: incidents/changes/problems; governance rules with owner and timeframe; sync every 24 hrs; requires Defender CSPM | Routes | verified | Microsoft Learn ServiceNow integration overview; connect; governance rule |
| 42 | ServiceNow integration GA in Azure, NA in Azure Government | Routes | verified | Microsoft Learn support matrix |
| 43 | Defender's ServiceNow integration also targets the Configuration Compliance module | Routes/overlap | verified | Microsoft Learn ServiceNow integration overview |
| 44 | ServiceNow Configuration Compliance imports Defender test results, "does not calculate the test results, but imports them"; CI lookup rules; remediation tasks (Yokohama) | Routes/overlap | verified | ServiceNow docs, Configuration Compliance imported data for Defender for Cloud |
| 45 | GCC tenants pair with Entra ID in commercial | Routes | verified | Microsoft Learn CMMC page ("both Office 365 Commercial and Office 365 GCC pair with Microsoft Entra ID") |
| 46 | One route per source | Routes | restated-as-design | — |
| 47 | BOD 26-04 title, date, exposure + KEV deadlines, mandatory for FCEB | Clock | verified | CISA BOD 26-04 page |
| 48 | Source: PAIN-rating table (VDR-TFR-PVR) as the agency's "SLA by exposure"; KEV "must" be remediated by catalog date | Clock | corrected: VDR rules "apply to all providers with FedRAMP Certifications"; timeframes are SHOULD; tables vary by class A–D as well as PAIN and exposure; KEV rule is SHOULD for providers. Agency clock is BOD 26-04 (Book 12 Ch06). Table not reproduced | FedRAMP VDR page; Book 14 Ch11 consistent |
| 49 | CAM automates seven-step RMF; 800-53A objectives mapped to Rev. 5; POA&M; workspace; separate subscription (`com.sn_irm_cont_auth_monitor`) | Overlap | verified | ServiceNow docs, Continuous Authorization and Monitoring (Yokohama) |
| 50 | CAM OSCAL import landing page; SSP and catalog import/export | Overlap | verified | ServiceNow CAM release notes (Yokohama) |
| 51 | Cmdlets: Connect-AzAccount -Environment, Connect-MgGraph -Environment USGov, Search-AzGraph -First/-SkipToken (response .SkipToken), Get-MgIdentityConditionalAccessPolicy | Code | verified | Microsoft Learn Search-AzGraph (example 3 uses `$response.SkipToken`); Get-MgIdentityConditionalAccessPolicy reference; Graph SDK national clouds page (`Connect-MgGraph -Environment USGov`) |
| 52 | PolicyResources/PolicyState property names `policySetDefinitionName`, `complianceState`, `resourceId`, `policyDefinitionReferenceId`, `timestamp` | Code | verified | Microsoft Learn PolicyState model (Policy Insights SDK reference) and ARG samples |
| 53 | Automated remediation (`deployIfNotExists`/`modify`) still carries a change record | Honest limits | restated-as-design | Source |
| 54 | Source: Update Manager/Arc SI-2 engine, MDVM, PAIN-based SLA; Arc bounded to guest OS | Azure | not repeated; linked to Book 12 Ch06/Ch07 which verified them; Arc bound restated in Ch09 limits | Book 12 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| M365 — banners, draft stamp, series context box | — | Internal stamps and agency shortcode; not carried. Context (M365 as SaaS control plane; actuation platform-native) kept in opening |
| M365 — What This Document Addresses | Opening; Microsoft 365 sections | Control list kept as the control map |
| M365 — The M365 Compliance Loop (table) | One loop on every surface (table, Figure 1) | — |
| M365 — Why ServiceNow does not actuate M365 directly | One loop: "The coordination platform reads; it doesn't write" | — |
| M365 — Control Family 1: SCuBA drift (CM-6) | ScubaGear and the secure configuration baselines | "Vol VI Book 06 SCuBA-as-code" → Book 11 links |
| M365 — Control Family 2: account lifecycle and CA exceptions (AC-2) | Microsoft Graph for identity state | "Vol VI Book 02" break-glass mandate → Book 04 / Book 02 Ch05 links |
| M365 — Control Family 3: Purview data protection | Purview audit and data protection | AU-10/SC-28 depth left to Book 12 Ch09 |
| M365 — Continuous Monitoring Roll-Up (CA-7) | Control map (CA-7 row); Chapter 11 link | — |
| M365 — Closure Necessity callout | Opening argument; One loop | Capitalized doctrine name dropped |
| M365 — Authorities Closed Here table | The control map for this chapter | KSI and evidence-slot columns, spine/script provenance not carried |
| M365 — Honest Limits | Honest limits | — |
| M365 — Cross-References | Inline links to published books | Internal volume IDs dropped |
| M365 — Provenance, References | Footnotes | Internal expansion-plan reference dropped |
| Azure — What This Document Addresses | Opening; Azure sections | CM-2 registration note not carried (internal bookkeeping) |
| Azure — Control engines table | Azure sections | Update Manager row linked to Book 12 Ch07 |
| Azure — Arc bounded note | Chapter 09 honest limits (guest-OS bound); Book 12 Ch07 link | OCI follow-up note not carried (internal roadmap) |
| Azure — Control Engine 1: Azure Policy | Azure Policy and the FedRAMP regulatory compliance initiatives | Exemption discipline kept and grounded in the exemption schema |
| Azure — Control Engine 2: Defender for Cloud / MDVM | Defender for Cloud regulatory compliance; patch/vuln paragraph | Vulnerability queue left to Book 12 Ch06 |
| Azure — Control Engine 3: Update Manager + Arc | One paragraph linking Book 12 Ch06/Ch07 | Duplicates Book 12 Ch07 |
| Azure — PAIN-rating note | The clock on each task | Corrected (provider rules); table not reproduced |
| Azure — Scan is not remediation note | One loop; Book 12 Ch07 link | Duplicates Book 12 Ch07 |
| Azure — CA-7 roll-up | Control map; Chapter 09 "One contract" | — |
| Azure — Closure Necessity callout | Opening argument | Doctrine name dropped |
| Azure — Authorities Closed Here | Control map | KSI columns not carried |
| Azure — Honest Limits | Honest limits ("closed" lags; automated remediation still a change record) | Arc bullet moved to Chapter 09 |
| Azure — Cross-References, Provenance, References | Inline links, footnotes | Internal IDs dropped |
| (new) | Getting results into the ITSM platform; Where ServiceNow's own products overlap; illustrative collector | Required by the brief |
