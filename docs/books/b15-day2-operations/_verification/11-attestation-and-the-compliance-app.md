# Verification — Chapter 11, Attestation, Evidence and the Compliance Application

Writer W7. Sources: `docs/compliance/Vol_VII_Book_04_Control_Attestation_Evidence_KSI.md`, `docs/compliance/Vol_VII_Book_05_ServiceNow_Compliance_App.md`, `docs/compliance/Vol_VI_Book_07_Evidence_ConMon_Pipeline.md`, `docs/compliance/Compliance_ServiceNow_Kit_Expansion_Roadmap.md` (archived after the build; not linked). Primary sources opened October 21, 2026: NIST SP 800-37 Rev. 2 PDF and SP 800-137 PDF (text extracted with pypdf); SP 800-53 Rev. 5 release 5.2.0 OSCAL catalog and the Low/Moderate/High baseline profiles (usnistgov/oscal-content, read with Python); GitHub release API for usnistgov/OSCAL (latest = v1.2.3, 2026-08-07); FedRAMP KSI reference page (46 IDs, 10 theme prefixes counted from the page); FedRAMP 20x Security Decision Record rules page; FedRAMP Marketplace `products.json` (meta last_change 2026-10-21); ServiceNow docs: Policy and Compliance Management structural overview (Zurich), CAM release notes (Xanadu), combined CAM release notes Xanadu→Australia, MID Server (Xanadu), "Test your apps with the ATF" (Xanadu); Microsoft Learn: Defender for Cloud ServiceNow integration overview, Defender for Cloud support matrix, Microsoft Graph national cloud deployments; CIO Influence reprint of the C1Secure press release (July 15, 2026). ServiceNow's marketing product page for CAM returned HTTP 403 and was not used.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Systems prove what they can observe; people attest only what no system can see | System evidence first | restated-as-design | Program position; Book 13 Ch07 |
| 2 | SP 800-37: begin with automated tools and fill gaps with manual assessments | System evidence first | verified | SP 800-37r2 App. F |
| 3 | SP 800-137: neither manual nor automated alone; all controls assessed even if not automatable | System evidence first | verified | SP 800-137 Exec Summary / Ch 2 |
| 4 | Control-class table (configuration / event / process / decision) | System evidence first | restated-as-design | Program position |
| 5 | Four-step loop map → test → gap → emit | Attestation loop | restated-as-design | Source (Vol VII Book 04) |
| 6 | Platform control records are a projection of the authoritative control map; map wins | Attestation loop | restated-as-design | Source; Book 14 Ch11 rule 1 |
| 7 | CA-2 text: implemented correctly, operating as intended, producing desired outcome | CA-2 | verified | 800-53 r5 5.2.0 catalog |
| 8 | CA-2(1) independent assessors at Moderate | CA-2 | verified | Moderate profile |
| 9 | Control test reads "actioned" posture → standing indicator | CA-2 | restated-as-design | Source |
| 10 | CA-5 text: update POA&M based on assessments, audits, continuous monitoring | CA-5 | verified | 5.2.0 catalog |
| 11 | POA&M closes on re-test; slipped milestone escalates; never a spreadsheet | CA-5 | restated-as-design | Source |
| 12 | CA-7 elements (metrics, frequencies, ongoing assessment, correlation, response, reporting) | Emit | verified | 5.2.0 catalog (CA-7 a–g) |
| 13 | OSCAL current release 1.2.3, Aug 7, 2026 | Emit | verified | GitHub release API |
| 14 | Source: attestation emitted "as FedRAMP 20x KSI evidence" into the agency package | KSI correction | corrected — KSIs bind providers; tag as vocabulary only | FedRAMP KSI page; SDR-CSX-KSI (audience: providers) |
| 15 | 46 KSIs in 10 themes | KSI correction | verified | FedRAMP KSI page (counted 46 IDs, 10 prefixes) |
| 16 | Source theme `KSI-CM` | KSI correction | corrected — no such theme; change management is `KSI-CMT` | FedRAMP KSI page |
| 17 | ITSM platform = workflow record, not evidence store | Platform role | restated-as-design | Source |
| 18 | PCM: indicators scheduled daily/weekly/monthly/quarterly; attestation; issue = gap | What ServiceNow provides | verified | ServiceNow PCM structural overview (Zurich) |
| 19 | CAM: standardized authorization package, seven RMF stages; POA&M single pane; POA&Ms include all package issues | What ServiceNow provides | verified | CAM release notes (Xanadu) |
| 20 | CAM OSCAL: SSP export (Xanadu); SSP and POA&M generation from package, POA&M import (Zurich); AP and AR import/export (Australia) | What ServiceNow provides | verified | Combined CAM release notes Xanadu→Australia |
| 21 | Defender for Cloud → ServiceNow Configuration Compliance and ITSM integration | What ServiceNow provides | verified | MS Learn integration-servicenow |
| 22 | ServiceNow integration GA in Azure, NA in Azure Government | What ServiceNow provides | verified | MS Learn support matrix |
| 23 | Partner app (announced July 2026) mirrors 46 KSIs in CAM; planned for the Store | What ServiceNow provides | verified as an announcement only (press release; capability not verified) | CIO Influence reprint |
| 24 | ServiceNow GCC: FedRAMP Certified, Class D, High, 2019-08-12, 101 authorizations | What ServiceNow provides | verified; corrects the source's "never cite High" | FedRAMP products.json F1305072116 |
| 25 | Recommendation: buy native first, build only reconciliation, closure gate, map check | Build, buy or both | restated-as-design | Program recommendation |
| 26 | Native coverage table | Build, buy or both | verified per rows 18–22; "agency adds" column is design | As above |
| 27 | Scoped app record model (ingest, reconcile, gate, REST, map, flows, MID script, ATF, update set) | If you build one | restated-as-design | Source (Vol VII Book 05); internal names translated |
| 28 | MID Server is a Java application running as a Windows service; mediator between network and instance | Boundary | verified | ServiceNow MID Server doc (Xanadu) |
| 29 | Least-privilege connector identities; no standing tenant admin | Boundary | restated-as-design | Source |
| 30 | GCC uses worldwide Graph/portal endpoints; GCC High/DoD use their own | Standing it up | verified (source said "commercial endpoints that serve the GCC Moderate boundary"; reworded to Microsoft's terms) | MS Learn Graph deployments |
| 31 | ATF purpose; run property disabled by default; run only on non-production | Standing it up | verified | ServiceNow "Test your apps with the ATF" (Xanadu) |
| 32 | ATF test_mode proves the workflow, not native surfaces | Standing it up | restated-as-design | Source honest limit |
| 33 | Control map as JSON; CI check of control set vs map; per-entry attributes are review items | Control map | restated-as-design | Source; source's script/file names removed |
| 34 | Evidence-contract record shape and the four verdict values | Pipeline | restated-as-design | Source (Vol VI Book 07); Book 12 Ch02 |
| 35 | Collect / correlate / bind / emit | Pipeline | restated-as-design | Source |
| 36 | AU-6(1) in Moderate and High | Pipeline controls | verified | Baseline profiles |
| 37 | Source listed AU-12(1) as a deployed control at Moderate | Pipeline controls | corrected — AU-12(1) is High only; adopted as design | Baseline profiles |
| 38 | One pipeline for AWS too; no per-cloud package | One pipeline | restated-as-design | Source (Phase 5 seam), internal phase name dropped |
| 39 | Kit portfolio phases, dates, issue numbers, requirement IDs, draft version numbers | What else the platform can carry | removed (internal counts and roadmap dates not verifiable) | — |
| 40 | Identity governance kit as next candidate; requirements-before-build and sub-prod gates | What else the platform can carry | restated-as-design | Roadmap doc |
| 41 | Microsoft access reviews / lifecycle workflows cover part of identity governance | What else | verified via Book 04 Ch09 (link, not re-footnoted) | Book 04 Ch09 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol VII B04 — banners, Series Context, Date Code | — | Internal framing and draft stamps; not carried |
| Vol VII B04 — What This Document Addresses | Opening; Attestation loop | |
| Vol VII B04 — The Attestation Model (table) | Attestation loop table | |
| Vol VII B04 — Spine-as-SSOT callout | Attestation loop ("control map" paragraph) | Vocabulary translated ("authoritative control map") |
| Vol VII B04 — Assessed Control State (CA-2) | CA-2 subsection | |
| Vol VII B04 — POA&M (CA-5) | CA-5 subsection | Lifecycle detail left to Book 14 Ch11 |
| Vol VII B04 — OSCAL/KSI Emit (CA-7) | Emit subsection; KSI correction | KSI claim corrected |
| Vol VII B04 — "workflow hub, not evidence lake" note | The platform is the workflow record | |
| Vol VII B04 — One Pipeline, Every Estate (Phase 5) | One pipeline, every estate | Phase name dropped |
| Vol VII B04 — Closure Provenance / Closure Necessity callouts | Attestation loop rules; Honest limits; Ch12 human-only closures | Doctrine names dropped; substance kept |
| Vol VII B04 — Authorities Closed Here table | CA-2/CA-5/CA-7 subsections | Generated table, slot and "tool-attestable" columns not carried (internal) |
| Vol VII B04 — Honest Limits | Honest limits | |
| Vol VII B04 — Cross-References, Provenance | Links to Book 12/13/14 and Ch08/09 | Internal volume references dropped; vendor-currency caveat carried |
| Vol VII B05 — Series Context; starter-skeleton note | The compliance application, if you build one (intro) | Internal paths dropped |
| Vol VII B05 — App Record Model table | "What it contains" table | Internal file names generalized |
| Vol VII B05 — Connectors & Prerequisites | Boundary and least privilege; native coverage table | |
| Vol VII B05 — Import & Wire-Up (7 steps) | Standing it up | Property names generalized; endpoint text corrected |
| Vol VII B05 — Boundary & Governance | Boundary and least privilege | |
| Vol VII B05 — The Control Map (JSON + CI check) | The control map is data | `slot` replaced with `evidence_category`; `ksi` renamed `ksi_tag`; boundary value neutralized |
| Vol VII B05 — Closure Necessity | Opening of "if you build one"; build/buy | Doctrine name dropped |
| Vol VII B05 — Honest Limits | Standing it up (ATF limit); Boundary (scope creep); Honest limits | |
| Vol VII B05 — Cross-References, Provenance (build-vs-buy note) | What ServiceNow already provides; Build, buy or both | Expanded with verified native coverage |
| Vol VI B07 — What This Document Addresses | Evidence pipeline intro | |
| Vol VI B07 — The Evidence Contract (JSON) | One record, every source | Book-number source value neutralized |
| Vol VI B07 — Deployable Artifacts table | Four stages; controls table | Merged |
| Vol VI B07 — The Pipeline (4 steps) | Four stages | |
| Vol VI B07 — Closure Necessity | Evidence pipeline intro | |
| Vol VI B07 — Controls Operationalized | Controls the pipeline supports | AU-12(1) baseline corrected |
| Vol VI B07 — Honest Limits | Honest limits ("sees only what emits") | |
| Vol VI B07 — Cross-References, Provenance | Links to Book 12 Ch02 | |
| Roadmap §1 Purpose and numbering reconciliation | — | Internal sequencing scheme; not carried |
| Roadmap §2 Doctrine guardrails | Boundary and least privilege; control map check; What else (requirements before build) | Guardrail 3 ("never cite High") corrected by marketplace data |
| Roadmap §3 Kit Phase 1 table | What else the platform can carry (first sentence) | Status column and issue numbers dropped |
| Roadmap §4 Kit Phase 2 | What else — identity and access governance | Requirement IDs, draft version, tracking issue dropped |
| Roadmap §5 Kit Phase 3+ | What else — further candidates | |
| Roadmap §6 Sequencing & gates | What else — two gates | Diagram and dates dropped |
| Roadmap §7 Immediate next actions | — | Internal backlog; not carried |
| Roadmap §8 Cross-references | — | Internal paths |
