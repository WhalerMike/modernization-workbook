# Verification — Federal Framework Crosswalk (research)

File: `docs/reference/federal-framework-crosswalk.md`
Verified: 2026-10-29 (this log covers the Moderate-civilian reframe; the page's framework statuses were checked on 2026-10-23 and 2026-10-28 and are described on the page)

Method:
- New facts come from the coordinator's verified fact pack of 2026-10-29 (primary sources read that day). No personal data was sent to any site.

Verdicts: **verified** (the source says it); **inference** (labelled on the page); **restated** (an existing fact reworded, source unchanged).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | SCuBA baselines cover Microsoft 365 and Google Workspace only; ScubaGear and ScubaGoggles are the assessment tools | Additions, October 29; CISA table, SCuBA row | verified | scuba (CISA SCuBA project page) |
| 2 | BOD 25-01 applies to Federal Civilian Executive Branch agencies; "shall" policies mandatory for in-scope tenants; Required Configurations list Microsoft 365 and Google Workspace | Additions, October 29 | verified | bod2501 (BOD 25-01; Required Configurations page) |
| 3 | CM-6: the agency sets settings from organization-defined common secure configurations, which can come from vendors, federal agencies, consortia and others; no STIG requirement | Additions, October 29 | verified | cm6 (SP 800-53 Rev. 5 OSCAL catalog) |
| 4 | CIS Benchmarks: prescriptive configuration recommendations for more than 25 vendor product families | Additions, October 29 | verified | cis (CIS Benchmarks page) |
| 5 | SP 800-70 Rev. 5 (May 2026) superseded Rev. 4; NCP repository at ncp.nist.gov | NIST table, NCP row | verified | ncp (SP 800-70 Rev. 5; NIST NCP page) |
| 6 | DISA STIGs reclassified from "Cited as current" to an optional High-only reference; Book 11 removed from its citing books (Book 11 Chapter 09 no longer names STIGs) | Other federal sources, DISA STIGs row | restated (workbook policy, Moderate civilian not DoD) | Brief; Book 11 Chapter 09 |
| 7 | DoD Cloud Computing SRG (IL4/IL5) labelled a High-only tier comparison | Other federal sources, DoD SRG row | restated | Brief |

Kept unchanged: the FedRAMP Rev5 Low/Moderate/High baselines row (a tier list, not a target).

## Additions, October 30, 2026

Verified: 2026-10-30. Sources: OMB's memoranda list (read 2026-10-30) and a repository grep for M-24-10, M-24-18, M-25-21 and M-25-22. Details are in `omb-ai-memos-m-25-21-m-25-22.md` in this folder.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 8 | M-25-21 and M-25-22 not amended or rescinded; M-26-04 is the only later AI memo | Additions, October 30 | verified | OMB memoranda list (accessed Oct 30, 2026) |
| 9 | Book 15 Ch13 cites M-24-10, M-25-21 and M-25-22; Book 18 Ch05 cites M-25-21 and M-25-22; citing-book lists updated | OMB memoranda table, M-24-10, M-25-21 and M-25-22 rows | verified (repository grep) | — |
| 10 | No page cites M-24-10 or M-24-18 as current | Additions, October 30 | verified (repository grep) | — |

## The authority register, November 2, 2026

Verified: 2026-11-02. A new section, "The authority register," adds applicability, mandatory status, responsible role, workbook location, evidence, residual obligation, verification date and change trigger for 24 core authorities. The existing tables and matrix rows are unchanged.

| # | Claim (short) | Verdict | Source |
|---|---|---|---|
| 11 | A-130 App I §5.a: NIST guidelines' "concepts and principles ... must be applied", with latitude; §4.a, §4.c(4), §5.c as cited | verified | A-130 PDF |
| 12 | FISMA §3554(a)(1), (a)(3), (b) | verified | govinfo |
| 13 | Privacy Act (e)(4) SORNs, (e)(10) safeguards | verified | govinfo |
| 14 | 44 U.S.C. §3303a(b), (d): GRS mandatory | verified | govinfo |
| 15 | Section 508 page lists 29 U.S.C. §794d and M-24-08; no replacement memo | verified | section508.gov |
| 16 | HSPD-12, August 27, 2004; no rescission notice | verified | dhs.gov |
| 17 | M-22-09 §A Identity actions | verified | M-22-09 PDF |
| 18 | BOD 25-01 scope, Q1 inventory, deviations accepted by AOs | verified | cisa.gov |
| 19 | BOD 26-04 revokes BOD 19-02 and 22-01; KEV clock; quarterly attestation; asset tagging | verified | cisa.gov |
| 20 | KEV catalog entries cite BOD 26-04 | verified | cisa.gov |
| 21 | ZTMM v2.0; described as one of many roadmaps; page marked archived | verified | cisa.gov |
| 22 | TIC 3.0 under M-19-26; core guidance set | verified | cisa.gov |
| 23 | FedRAMP changelog: RFC-0035 (Oct 14, 2026), RFC-0036 (Oct 15, 2026) | verified | fedramp.gov |
| 24 | SP 800-37 r2, 800-53 r5 (5.2.0), 800-53A r5 (5.2.0), 800-60 v1 r1, 800-63-4, 800-137, 800-161 r1 upd1, 800-207, FIPS 199, 200, 201-3: current, no newer revision listed | verified | csrc.nist.gov publication pages |
| 25 | Mandatory status, responsible roles, residual obligations, change triggers | inference (program reading of the sources) | — |
