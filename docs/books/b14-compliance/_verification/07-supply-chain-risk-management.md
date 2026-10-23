# Verification — Chapter 07, Supply Chain Risk Management

Checked October 21, 2026 by writer W4. Sources: `docs/compliance/Vol_IV_Book_02_Supply_Chain_Risk_Management.md` (3,621 words), `docs/projects/supply-chain-charter.md` (616 words) and `docs/projects/supply-chain-plan.md` (200 words). All three are archived after the book is built and aren't linked. Control text and baselines come from NIST's OSCAL catalog (SP 800-53 Rev. 5, release 5.2.0, last modified May 11, 2026) and the OSCAL Low, Moderate, High and Privacy baseline profiles, parsed locally. FedRAMP class membership was read from the fedramp.gov 2026 Rev5 control reference page for SR. M-26-05, SP 800-161 Rev. 1 upd. 1, CISA's 2026 SBOM minimum elements and the CycloneDX 1.6 and 1.7 JSON schemas were downloaded and read in full where cited. GitHub Actions inputs were read from each action's README and GitHub Docs. No personal data was sent to any site. Book 12 Ch06 owns BOD 26-04 and the remediation queue; this chapter links it rather than restating the directive.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Program principles: inventory before remediate; risk-based timelines; SaaS gated on recorded authorization; continuous evidence; named risk owner | Opening | restated-as-design | Charter §5 (program design) |
| 2 | SR family has 12 base controls; PM-30 is the org-wide strategy control | What the controls ask for | verified | NIST OSCAL catalog 5.2.0 |
| 3 | Control statements for PM-30, SR-1 to SR-12, SR-2(1), SR-11(1), SR-11(2); SR-8 choices "notification of supply chain compromises" / "results of assessments or audits" | Controls table | verified | NIST OSCAL catalog |
| 4 | NIST baselines: SR-1/2/2(1)/3/5/8/10/11/11(1)/11(2)/12 in L/M/H; SR-6 M/H; SR-9, SR-9(1) H; SR-4, SR-7, PM-30 in none | Controls table | verified | OSCAL baseline profiles |
| 5 | FedRAMP classes: SR-1, 2, 2(1), 3, 5, 8, 10, 11, 11(1), 11(2), 12 B/C/D; SR-6 C/D; SR-9 D; SR-4, SR-7 none | Controls table | verified (new) | fedramp.gov/2026 Rev5 control reference, SR |
| 6 | Source: pipeline closes SR-10 and SR-11 | Three points | corrected | Control text: SR-11 anti-counterfeit policy, SR-11(1) training, SR-11(2) repair control are hardware/property processes; pipeline contributes software evidence only |
| 7 | Source omitted SR-12 and SR-9 | Controls table; closure record | corrected (added) | NIST catalog and baselines |
| 8 | Closure through governance artifacts, not network technology | Three points | restated-as-design | Source "Closure Necessity" box, translated |
| 9 | SP 800-161 Rev. 1 published May 2022, updated Nov 1, 2024 | SP 800-161 | verified | csrc.nist.gov SP 800-161r1 upd1 page |
| 10 | Three levels: enterprise, mission/business process, operational, with deliverables | SP 800-161 | verified | SP 800-161r1 upd1 PDF §2.3 |
| 11 | Acquisition: products supplied with SBOM per agency-approved protocols; SBOMs for purchased, open source, in-house; three options for open source without SBOM | SP 800-161 | verified (new) | SP 800-161r1 upd1 PDF §3 and CM-8 supplemental guidance |
| 12 | Nov 2024 update revised online Appendix F: SBOM language; vulnerability advisory report elements per ISO/IEC 29147 | SP 800-161 | verified (new) | SP 800-161r1 upd1 change log |
| 13 | Source: SP 800-161 "mandates" VDR | Formats/VDR | corrected | SP 800-161 is guidance; the 2024 update adds VAR elements per ISO/IEC 29147 |
| 14 | M-26-05 Jan 23, 2026 rescinds M-22-18 and M-23-16 | Federal position | verified | M-26-05 PDF |
| 15 | M-26-05: inventory and risk-matched assurance policies required; attestation form and SBOM-on-request clause optional; cloud footnote runtime production environment; references SSDF, CISA 2025 draft, HBOM framework; quotes | Federal position table | verified | M-26-05 PDF |
| 16 | Source: framework "mandatory" under EO 14028 §4, M-22-18, M-23-16 | Correction callout | corrected | M-26-05 |
| 17 | EO 14028 §4(e)(vii) directed NIST guidance incl. providing SBOM; §4(f) minimum elements; source's "mandates SBOM for software sold to government" | Federal position | corrected | EO 14028, 86 FR 26633, govinfo |
| 18 | EO 14306 (June 6, 2025) amended EO 14144: consortium by Aug 1, 2025; preliminary SSDF update by Dec 1, 2025; final within 120 days; no attestation provision | Federal position | verified (new) | EO 14306, 90 FR 24723, govinfo |
| 19 | SSDF 1.2 (SP 800-218 Rev. 1) IPD Dec 17, 2025; comments closed Jan 30, 2026; no final; SSDF 1.1 Feb 2022 still final | Federal position | verified (new) | csrc.nist.gov r1/ipd page; r1/final returns 404; SP 800-218 final page |
| 20 | CISA attestation form released Mar 11, 2024; page now marked archived ("may not reflect current policy or programs") | Federal position | verified (new) | cisa.gov attestation form page |
| 21 | SPDX = ISO/IEC 5962:2021; current version 3.0 | Formats | verified | spdx.dev specifications page |
| 22 | CycloneDX latest 1.7 (2025-10-21); covers SBOM, SaaSBOM, HBOM, VDR, VEX | Formats | verified | cyclonedx.org specification overview |
| 23 | ECMA-424 2nd edition Dec 2025 defines CycloneDX 1.7 | Formats | verified (new) | ecma-international.org ECMA-424 page |
| 24 | CSAF 2.0 OASIS Standard Nov 18, 2022; five profiles incl. VEX; VEX tests: status required; known_not_affected needs impact statement; known_affected needs action statement | Formats | verified | OASIS CSAF 2.0 OS, §4 and §6.1.27 |
| 25 | OpenVEX 0.2.0 statuses, required fields, justification list, status rules | Formats; code | verified | openvex/spec OPENVEX-SPEC.md |
| 26 | CycloneDX analysis.state, justification, response enums; rating fields; affects.ref | Formats; code | verified | CycloneDX bom-1.6 and bom-1.7 schemas |
| 27 | Status crosswalk across formats | Formats table | restated-as-design | Column values verified (25, 24, 26); row alignment is program design |
| 28 | CISA: accept any widely used interoperable format; avoid deprecated versions for new software; SPDX and CycloneDX named | Formats | verified (new) | CISA 2026 minimum elements, Machine-Processable Data |
| 29 | Source: NTIA 2021 minimum elements + "CISA 2025 update" | Correction callout | corrected | CISA 2025 page: draft, comments to Oct 3, 2025; CISA 2026 final July 29, 2026 replaces NTIA |
| 30 | 2026 elements: 17 fields; 10 new; Supplier Name → Component Producer; "do not create new requirements"; unknown explicit; transitive dependencies, no minimum depth; applies to OSS, AI, SaaS; 17 partner organizations | What an SBOM must contain | verified (new) | CISA 2026 PDF, Intro, Notable Updates, Coverage, App. A Table 1, App. B |
| 31 | CISA field → CycloneDX field mapping | SBOM table | restated-as-design | Field names verified in CycloneDX 1.6/1.7 schema |
| 32 | Source used metadata.author; schema uses authors; component author deprecated | SBOM table note | corrected | CycloneDX 1.6 schema |
| 33 | NTIA table "Syft satisfies all automatically" | — | removed | Not verifiable; replaced with field mapping |
| 34 | CycloneDX VDR description; aligned with ISO/IEC 29147:2018 | VDR | verified | cyclonedx.org/capabilities/vdr |
| 35 | KEV feed fields cveID, dateAdded, dueDate, forensicTriage; top-level vulnerabilities | VDR; code | verified | KEV JSON feed, catalog 2026.10.21 |
| 36 | Source: KEV dueDate drives the SLA; "BOD 26-04 14-day SLA" in tech table | VDR | corrected | Deadline comes from BOD 26-04 four-factor model; linked to Book 12 Ch06 instead of restated |
| 37 | FedRAMP "VDR" vs CycloneDX "VDR" acronym collision | VDR | verified | FedRAMP VDR page; CycloneDX VDR page |
| 38 | VEX authoring steps; review cycle | Exploitability statements | restated-as-design | Source; "30-day internal triage SLA" and "every 90 days" dropped as internal |
| 39 | Source justification protected_by_mitigating_control invalid in OpenVEX | Exploitability statements; code | corrected | OpenVEX spec; CycloneDX schema |
| 40 | sbom-action@v0; format values spdx, spdx-json, cyclonedx, cyclonedx-json (no cyclonedx-xml); auto release upload needs contents: write, actions: read | Code | verified; source format value corrected | anchore/sbom-action README |
| 41 | scan-action@v7; inputs sbom, output-format (cyclonedx-json valid), output-file, fail-build default true, severity-cutoff default medium | Code | verified; source @v3 corrected | anchore/scan-action README |
| 42 | actions/attest@v4, subject-path, sbom-path; permissions id-token, contents, attestations; gh attestation verify | Code | verified (new) | GitHub Docs how-to |
| 43 | actions/checkout@v6 current | Code | verified | scan-action README examples |
| 44 | azure/login@v3 with OIDC, client-id/tenant-id/subscription-id, id-token: write; environment AzureUSGovernment | Code | verified (new); replaces SAS token | Azure/login README; Microsoft Learn OIDC page |
| 45 | az storage blob upload supports --auth-mode login and --tier | Code | verified | Azure CLI reference |
| 46 | Immutability is a policy (time-based retention, legal hold); all access tiers support it; source's "Azure Blob immutable tier" + Archive | Code note | corrected | Microsoft Learn immutable storage overview |
| 47 | Source "7 years (NARA standard)" retention | Code note | removed | Retention per the records schedule (program design) |
| 48 | Source Python: .json and .read not called | Code | corrected | Python semantics |
| 49 | KQL datetime_diff(period, d1, d2) = d1 − d2; now() | Code | verified; source `now` corrected | Microsoft Learn datetime_diff() |
| 50 | Source manifest JSON (truncated slsa_provenance_url line) | — | removed | Damaged; superseded by attestations and the evidence contract |
| 51 | KSI-SCR-MIT and KSI-SCR-MON statements | FedRAMP | verified (new) | fedramp.gov/2026 KSI Supply Chain Risk page |
| 52 | Source KSI-SCR / KSI-CMT-VTD / "KSI-011 to KSI-014" mappings | — | removed | Internal numbering; real 2026 KSI IDs used instead |
| 53 | NTC-0014 June 16, 2026: VDR and VER mandatory Dec 7, 2026; grace to Mar 7, 2027; revocation after | FedRAMP | verified | fedramp.gov/notices/0014 |
| 54 | VDR: detection includes supply chain monitoring; VDR-TFR-KEV (SHOULD, even if fully mitigated); VDR-CSO-AKE | FedRAMP | verified | fedramp.gov/2026 VDR page |
| 55 | VER: evaluate exploitability, internet reachability, PAIN N0–N5; persistent reporting; monthly human-readable (MUST); JSON by class (MAY A; SHOULD B monthly, C 14 days, D 7 days) | FedRAMP | verified (new) | fedramp.gov/2026 VER page |
| 56 | VER-AGM-RVR (SHOULD review, SHOULD automate; note on N>2) and VER-AGM-MAP (SHOULD maintain POA&Ms) | FedRAMP | verified (new) | fedramp.gov/2026 VER page |
| 57 | Provisioning gate checks certification and agency authorization | FedRAMP | restated-as-design | Linked to Book 00 Ch06 and Book 10 |
| 58 | Source vendor matrix with FedRAMP package IDs and vendor VEX formats (Cisco, Infoblox) | Supplier disclosure | removed | Status must be read from Marketplace at review time; vendor claims not verified; replaced by supplier record template |
| 59 | Microsoft CSAF since Nov 12, 2024 via provider-metadata | Supplier disclosure | verified (new) | MSRC blog 2024-11 |
| 60 | Microsoft VEX for all Microsoft-assigned CVEs, Sept 8, 2026 | Supplier disclosure | verified (new) | MSRC blog 2026-09 |
| 61 | SLSA current 1.2; Build L0–L3 names and requirements; Source L4 two-party review | Build provenance | verified | slsa.dev v1.2 build-track-basics and source-requirements |
| 62 | Source "Level 3: hardened build, two-party review" | Build provenance | corrected | SLSA 1.2: two-party review is Source L4 |
| 63 | Source "SLSA is the NIST-endorsed framework" | — | removed | Not verified |
| 64 | GitHub attestations = Build L2; reusable workflows → Build L3; public-good Sigstore vs GitHub instance; not a security guarantee | Build provenance | verified (new) | GitHub Docs artifact attestations concept page |
| 65 | Closure record per control | Closure record | restated-as-design | Source closure table, corrected per #6, #7 |
| 66 | Ownership table; AO alone accepts residual risk | Who owns what | restated-as-design | Settled (brief; Book 13 Ch09) |
| 67 | Source checklist dates Jul–Dec 2026 | Who owns what | corrected | Passed; replaced by phase-relative sequence from the plan |
| 68 | Source "Sentinel KSI dashboard," "Part 11 chain," "VEX Portal," "GPG-signed" | — | removed | Internal references or unverifiable; signing restated via attestations |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol IV Bk 02 front matter, draft banner, Date Code, agency shortcodes | — | Internal stamps and agency placeholders; never carried |
| What This Document Addresses | Opening; Federal position; FedRAMP | Mandate framing corrected (#14–17); Dec 7 deadlines kept for FedRAMP only |
| The Supply-Chain Evidence Framework and the Dec 7, 2026 Deadline (tiers table) | Evidence pipeline; FedRAMP | Tier table replaced by the pipeline figure; BOD 26-04 deferred to Book 12 Ch06 |
| Architecture: Pipeline Overview (ASCII diagram) | Figure ch07-evidence-pipeline | Redrawn as a house-style diagram |
| SBOM Generation with Syft; GitHub Actions Integration | Illustrative code (workflow) | Corrected (#40–47) |
| SBOM Content Requirements (NTIA Minimum Elements) | What an SBOM must contain | Replaced by CISA 2026 elements (#29–33) |
| Vulnerability Disclosure Report; VDR Fields (XML) | VDR; CycloneDX JSON example | XML corrected and restated as JSON (#26) |
| CISA KEV Integration; kev_triage.py | VDR; kev_join.py | Script fixed (#48); deadline logic deferred to Book 12 Ch06 |
| VEX; VEX Status Values | Formats; status crosswalk | 30-day triage SLA dropped |
| VEX Document Structure (OpenVEX) | OpenVEX example | Agency placeholders removed; justification corrected (#39) |
| VEX Authoring Process | Exploitability statements | Kept as design; GPG/Azure Blob specifics generalized |
| Vendor Disclosure Matrix | Supplier disclosure | Replaced by a supplier record template (#58); Microsoft example verified |
| NIST SP 800-53 Rev 5 Control Closure: SR Family | Controls table; Closure record | Corrected and extended (#2–7) |
| Closure Necessity — SR family | Three points | Restated plainly without the doctrine name |
| KSI-CMT Evidence Contract (KSI-011–014) | — | Internal rule numbers; replaced by the real FedRAMP KSI-SCR rules (#51–52); change-log evidence covered by Book 13 Ch04 |
| SLSA Supply Chain Levels | Build provenance | Corrected (#61–64) |
| Damaged figure-alt fragment after SLSA table | — | Converter debris; not carried |
| Continuous Monitoring Integration; Sentinel Dashboard; KQL | Illustrative code (KQL) | Query fixed (#49); dashboard list dropped as product-specific |
| Evidence Manifest (JSON) | — | Damaged and superseded by attestations plus the evidence contract (Book 12 Ch02) |
| Implementation Checklist | Who owns what (sequence) | Dates passed; restated by phase (#67) |
| Technology Stack Summary | Code notes; Formats | Product table dropped; each tool's facts verified where used |
| References | Footnotes | Each reference re-verified on its primary source or dropped |
| Charter §1–4 Purpose, Problem, Objectives, Scope | Opening | Summarized; Book 00 Ch06 carries the charter in full |
| Charter §5 Guiding Principles | Opening | Carried as program design |
| Charter §6 Success Criteria; §7 Approach; Plan §2–4 | Who owns what (sequence) | Merged into the five-step sequence |
| Charter §8 Risks and Assumptions | Supplier disclosure; Federal position | Vendor-format risk addressed by accepting SPDX, CycloneDX, CSAF, OpenVEX |
| Charter §9 Governance; §10 Next Steps | Who owns what | Owners named by role; AO as risk owner |

## Additions, October 23, 2026 (federal framework crosswalk follow-up)

Every claim was checked against the primary source on October 23, 2026. Sources: research briefs on investment and acquisition, and on service, accessibility and records (program working files).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-26-10 §2: request vendor utilization and pricing; disclosure provisions in solicitations and contracts after Mar 31, 2026; vendors include resellers | Supplier disclosure | verified (quoted, page images) | OMB M-26-10 §2, n.8 |
| 2 | M-26-10 gives no clause wording | Supplier disclosure | verified (absence in memo) | OMB M-26-10 p.4 |
