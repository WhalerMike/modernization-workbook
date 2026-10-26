# Verification — Chapter 08, Cloud-Native Posture

Checked October 21, 2026 by writer W5. Source: `docs/compliance/Vol_III_Book_04_Cloud_Native_Posture.md` (2,220 words). FedRAMP's Consolidated Rules for 2026 Key Security Indicators page and the 20x Class C ruleset index were fetched directly from fedramp.gov and their text extracted; the FedRAMP Marketplace dataset (`products.json`, last changed October 21, 2026) was downloaded and queried for every offering the chapter names, including the `certified_services` and `service_description` fields. NIST SP 800-53 Rev. 5.2.0 control text came from NIST's OSCAL catalog JSON. Microsoft claims came from the Microsoft Learn MCP tools (search and fetch). AWS, Google Cloud, Oracle, Kubernetes, NIST CSRC and Broadcom pages were fetched directly. No personal data was sent to any site; requests used default or generic user-agent strings.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CM-6 statement: most restrictive mode, implement, approve deviations, monitor and control changes | CSPM | verified | SP 800-53 Rev. 5.2.0 OSCAL, CM-6 |
| 2 | Source: "Microsoft Defender for Cloud … available within GCC at FedRAMP Moderate" | Owned-tool-first; per-platform table | corrected | Defender for Cloud is an Azure service in the FedRAMP High scope of Azure and Azure Government (Microsoft Learn compliance scope page); Marketplace lists Azure Commercial and Azure Government at Class D. GCC is Microsoft 365; GCC tenants pair with Entra ID in commercial Azure (Azure feature availability page, AIP note 1) |
| 3 | FedRAMP: each agency "still authorizes its own federal information systems"; AO accepts risk for "the configuration selected, the integrations enabled" | Owned-tool-first rule 4 | verified | fedramp.gov/2026/agencies/use/ |
| 4 | Source's "Moderate-exclusive rule" / "High-covers-Moderate boundary treatment" | Owned-tool-first rule 4 | restated-as-design | Stated as the program's rule, anchored to the FedRAMP use page and Book 10 Ch03 |
| 5 | Defender for Cloud: Foundational CSPM free; Defender CSPM plan GA in Azure and Azure Government | Table | verified | Learn, Defender for Cloud support matrices (cloud support) |
| 6 | Source: AWS Config + Security Hub "FedRAMP-authorized, above Moderate (AWS GovCloud Class D)" | Table; corrections | corrected | products.json: AWS Config and AWS Security Hub CSPM in `certified_services` of both AWS US East/West (Class C, Moderate) and AWS GovCloud (Class D) |
| 7 | Security Hub is now named "AWS Security Hub CSPM" | Table | corrected (naming) | AWS Security Hub User Guide intro page; products.json service name |
| 8 | AWS Config NIST 800-53 Rev 5 conformance pack exists; packs "are not designed to fully ensure compliance" | Table; footnote | verified | AWS Config Developer Guide page |
| 9 | Google: Security Command Center posture; Assured Workloads has Data Boundary for FedRAMP Moderate and FedRAMP High packages; both inside Google Services offering, Class D | Table | verified / corrected | Google SCC overview; Assured Workloads control packages page; products.json FR1805751477 (SCC and Assured Workloads named in service description). Source said Assured Workloads "is the Moderate control package"; it offers Moderate and High packages within a Class D offering |
| 10 | OCI Cloud Guard; in OCI-Government Cloud offering, Class D | Table | verified | Oracle Cloud Guard docs; products.json FR1900048743 description names Cloud Guard |
| 11 | Source: OCI Cloud Guard "DISA IL5 / JAB" | Table | removed | IL5 not checked; JAB history not relevant under 2026 rules; chapter states Marketplace class only |
| 12 | Defender for Cloud doesn't cover OCI | Table; reach | verified | Learn multicloud support matrix, plan availability lists Azure, AWS, GCP only |
| 13 | Source: "VMware Aria Operations for Compliance" | Table | corrected / restated | Product name not confirmable (Broadcom techdocs page JS-rendered; docs.vmware.com redirects). Replaced with VMware's documented VCF 9.1 STIG workflow: InSpec audit, Ansible and PowerCLI remediation, SAF CLI checklists (Broadcom VCF blog, July 14, 2026) |
| 14 | VMware customer-operated software has no FedRAMP certification of its own; inherits agency authorization | Table | restated-as-design | Consistent with Book 10 Ch03 on agency-installed software; stated as program treatment |
| 15 | Source: Prisma Cloud "FedRAMP High-only" | Corrections | corrected | products.json: Palo Alto Networks Government Cloud Services (FR1913470600, Class C) and GCS-HIGH (FR2317253567, Class D) both describe Prisma Cloud and Cortex Cloud |
| 16 | Source: Wiz for Government "FedRAMP High-only" | Corrections | corrected (partial) | products.json: Wiz for U.S. Government FR2308034636A Certified Class D; Wiz Moderate for U.S. Government FR2308034636 In Process, Class C |
| 17 | Defender CSPM, Defender for Servers, Defender for Containers GA on Azure, AWS, GCP | Reach | verified | Learn multicloud support matrix |
| 18 | AWS connector "isn't available on the national government clouds" incl. Azure Government | Reach | verified (new) | Learn, Connect AWS accounts, prerequisites note |
| 19 | Azure Government: CIEM, DevOps security, code-to-runtime mapping, data and AI dashboard NA; agentless VM scanning, internet exposure analysis, regulatory compliance, Defender for Containers GA; attack path listed both NA and GA | Reach | verified (new); inconsistency flagged | Learn cloud support matrix (two rows: "Attack path" NA, "Attack path analysis" GA) |
| 20 | CNAPP view-to-control table (CM-6, RA-5, SC-7, AC-6, SA-11) | CNAPP | restated-as-design | Source's mapping; program's control map |
| 21 | SSDF SP 800-218 v1.1 Feb 2022; Rev. 1 (v1.2) IPD Dec 17, 2025 | CNAPP footnote | verified (new) | CSRC pages |
| 22 | Attack path: cloud security graph; starts at external entry point; follows lateral movement to critical target | CNAPP | verified | Learn, "Security explorer and attack paths" |
| 23 | NIST SP 800-190 Application Container Security Guide, Sept 2017 | Kubernetes | verified (new) | CSRC page |
| 24 | Defender for Containers scans ACR, ECR, Google registries; running-container scan in preview multicloud; gated deployment "audit or block"; binary drift detect and block; antimalware; DNS; MITRE ATT&CK mapping | Kubernetes | verified | Learn, Introduction to Defender for Containers |
| 25 | CM-7 statement | Kubernetes | verified | SP 800-53 OSCAL CM-7 |
| 26 | Pod Security Admission; privileged pods "disable most security mechanisms"; enforce mode rejects | Kubernetes | verified (new) | kubernetes.io PSA and PSS pages (v1.37 docs) |
| 27 | Azure Policy for Kubernetes extends Gatekeeper, "an admission controller webhook for Open Policy Agent"; AKS and Arc; EKS/GKE supported without conformance validation | Kubernetes | verified (new) | Learn, Azure Policy for Kubernetes; Arc extensions release page |
| 28 | Program admission baseline (no privileged, approved registries, no unscanned, no mutable tags) | Kubernetes | restated-as-design | Source's list, labeled as program design |
| 29 | SI-3 statement | Kubernetes | verified | SP 800-53 OSCAL SI-3 |
| 30 | Continuous export GA in Azure and Azure Government | Evidence | verified | Learn cloud support matrix |
| 31 | Source: posture "rolls up to CISA CDM and the FedRAMP 20x KSI pipeline" | Evidence | restated | Chapter keeps the evidence-contract routing and links Ch02/Ch12; no CDM claim made |
| 32 | Consolidated Rules for 2026 launched June 24, 2026; KSI control mappings updated Oct 13, 2026; themes and named indicators | KSI | verified (new) | fedramp.gov KSI page changelogs |
| 33 | Source's KSI mapping (KSI-CMT = configuration baseline, KSI-SVC = hardening/admission/IaC, KSI-MLA = vulnerability + runtime) | KSI | corrected | Remapped to current named indicators: KSI-SVC-ACM, KSI-CNA-EIS, KSI-MLA-EVC, KSI-CNA-MAT, KSI-CNA-RNT, KSI-CMT-RMV, KSI-IAM-ELP, KSI-MLA-OSM, each with FedRAMP's text and related controls quoted from the page |
| 34 | KSIs are written for cloud service providers / offerings, not agency systems | KSI | verified / restated | KSI text refers to "the cloud service offering" and "the provider"; the KSIs sit under the 20x certification rules for providers. Use as agency vocabulary is labeled program design |
| 35 | Vulnerability findings handled in separate VDR and VER rulesets | KSI | verified (new) | fedramp.gov 20x Class C ruleset index (VDR, VER listed) |
| 36 | A pilot-era numbered KSI scheme (for example KSI-CMT-01) existed | KSI | removed | The 2025 Phase One page and PDF return 404; claim dropped |
| 37 | Source RA-5 authority driver "CISA BOD 26-04" | Control map | not carried | Directive verification belongs to Ch06 (W4); this chapter cites no directive for RA-5 |
| 38 | Source: Defender for Cloud does "multi-cloud CSPM/CWPP ingestion across Azure, AWS, and GCP" | Owned-tool-first | verified | Learn multicloud support matrix |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, `content-hidden` FOUO banner, "Draft Proposal — Subject to Review", Date Code | — | Stamps dropped per brief |
| "Provisional position" callout (series slot 22, intended Volume III home) | — | Internal series-placement note; not reader content |
| Series Context callout | Opening paragraphs | Recast as the Ch06/Ch07 handoff |
| What This Document Addresses | Opening; three disciplines list | Carried |
| CSPM — Misconfiguration Is the Cloud's Dominant Risk (CM-6) | "CSPM: CM-6 applied to cloud resources" | Carried; "dominant class of cloud incidents" statistic-like phrasing softened to "where many cloud failures start" (no source given) |
| The Moderate decision — owned-tool priority (callout + table) | "The owned-tool-first decision…", per-platform table, corrections, reach section | Carried and corrected (claims 2, 6–16, 18–19); agency-specific "Owned today" column replaced by a treatment column (agency-agnostic) |
| GCP/OCI adoption-default paragraph | Per-platform table and rule 3 | Carried |
| Prisma Cloud / Wiz paragraph | Corrections bullet 3 | Carried and corrected; "Product Inventory Questionnaire's flag list" reference dropped (internal artifact) |
| CNAPP — One Platform, Four Overlapping Views (table) | CNAPP table and attack-path paragraph | Carried; "this series" column rewritten as workbook cross-references |
| Kubernetes & Container Security (CM-7, SI-3) | Kubernetes section | Carried and expanded with verified mechanisms |
| Feeding the Evidence Fabric | "Feeding the evidence contract" | Carried; "Multi-Cloud Evidence Fabric book" → Ch02 and Ch12 |
| NIST control closure — generated authorities table | "The control map for this chapter" | Condensed to function and layer; product-laden CM-6 cell moved to the per-platform table; generated-from-spine provenance note dropped (internal tooling); tool-attestable column dropped |
| FedRAMP 20x KSI Alignment | KSI section | Carried and corrected (claim 33) |
| Platform Selection Status callout | Per-platform table, corrections and takeaways | Merged; ownership statements generalized |
| References table | Footnotes | Replaced by footnotes to pages actually opened; the Prisma/Wiz vendor blog links and AWS 2021 What's New link not used (Marketplace data is the primary source) |

## Source watch, October 26, 2026

Re-checked after the weekly source watch (issue #160) reported a change in a cited source. Checked October 26, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| Wiz Moderate for U.S. Government (FR2308034636, In Process) was removed from the Marketplace data on Oct 26, 2026; Wiz for U.S. Government (FR2308034636A) still Certified, Class D | bullet, step 3 and `c08-marketplace` updated |
