# Verification — Chapter 10, Running the Portfolio in Waves

Writer for Chapters 07, 09 and 10. New chapter; no source pages.

## Sources opened

Opened October 28, 2026: AWS Prescriptive Guidance, "Phases of a large migration" (Guide for AWS large migrations) and "Task 5: Defining the wave planning process" (Portfolio playbook for AWS large migrations); Microsoft Learn Cloud Adoption Framework "Migration wave planning" and "Plan your migration" (through the Microsoft Learn MCP search tool); dora.dev "DORA's software delivery performance metrics"; Technology Modernization Fund pages on tmf.cio.gov ("Agency and project fit," "Process," "2026 Call for Proposals"); Pub. L. 115-91 on govinfo.gov (Title X, Subtitle G, §1077); 40 U.S.C. §11312 (2023 edition) on govinfo.gov; OMB M-26-10 PDF; OMB Circular A-130 PDF (§5.a(1), footnote 6, §5.a(1)(c)(ii)); SP 800-53 5.2.0 OSCAL catalog (PM-5, CM-8, SA-22). Workbook: Book 01 Ch12 (phases, gates, authorities); `docs/research/federal-framework-crosswalk.md` Framework status.

Manual checks: none. Note on the crosswalk: its TMF row quotes the 2026 call as saying competitive projects "take no more than three years." The pages opened today (the 2026 call page and the fit page) don't contain that phrase; the fit page says competitive projects are "typically less than $25M and use a five year repayment timeline." The PDF linked from the call page (`TMF-Call-for-Proposals-AI-2.pdf`, September 2026) doesn't contain it either. The call page appears to have been revised since October 23. Flagged for the editor as a possibly stale settled fact; the chapter uses the fit page's wording.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Program phases 0–6 and gate names G0–G5; gate authorities (steward G0, G1, G4; steward and sponsor G2; sponsor and steering committee G3; sponsor and CIO G5); weeks illustrative | Phases | settled fact, linked | Book 01 Ch12 |
| 2 | G5 requires no live production dependency on AD authentication | Phases table | settled fact | Book 01 Ch12 Phase 5 gate |
| 3 | Application meaning of each phase; pilot composition; wave sizes; long-tail rules | Throughout | restated-as-design | Program design |
| 4 | AWS: early waves few servers, low complexity, lower environments; "fail fast" | Planning waves | verified | AWS wave planning task |
| 5 | AWS: move group definition; example rules shared database, same owner | Planning waves | verified | AWS wave planning task |
| 6 | AWS: plan 4–5 waves in advance; wave planning ongoing, not one-off | Planning waves | verified | AWS wave planning task |
| 7 | Microsoft: start simpler, non-production first, critical later; add one or two complex representative workloads to early waves | Planning waves | verified | CAF Migration wave planning / Plan your migration |
| 8 | Microsoft: group by shared databases, APIs, authentication, network; group together when unsure | Planning waves | verified | CAF Plan your migration |
| 9 | Microsoft: define only the next wave in detail | Planning waves | verified | CAF Migration wave planning |
| 10 | AWS "migration factory" term; initialize then implement; four workstreams; portfolio vs migration workstream roles | Factory | verified | AWS Phases of a large migration |
| 11 | DORA change lead time and change fail rate definitions | Metrics | verified | dora.dev metrics guide |
| 12 | TMF: "must improve, retire, or replace existing federal IT systems"; typically < $25M; five-year repayment timeline; aim for full repayment; outcomes ideally within 12 months | Funding | verified | TMF fit page |
| 13 | TMF process: IPP, FPP, Board votes; funding released in stages on milestones; repayment typically begins within a year of first transfer | Funding | verified | TMF process page |
| 14 | 2026 call: legacy modernization and cybersecurity continue; AI adoption and permitting priorities; IPPs by Oct 20, 2026 | Funding | verified | TMF 2026 call page |
| 15 | MGT Act §1077: CFO Act agencies (31 U.S.C. 901(b)) may establish fund; uses incl. improve/retire/replace, cloud transition, reimburse TMF; 3-year availability then Treasury; no supplanting O&M; prioritize CIO-approved cost-savings; savings may be reprogrammed into the fund | Funding | verified | Pub. L. 115-91 §1077(b) |
| 16 | 40 U.S.C. §11312 quote "for maximizing the value" | Funding | verified | govinfo |
| 17 | M-26-10: CIOs advise whether to continue, modify or terminate; no IT contract without CIO approval | Funding | verified | M-26-10 §1 |
| 18 | A-130: applications inventoried when obtained and updated "on an ongoing basis"; unprotectable systems "a high priority for upgrade, replacement, or retirement" | Keeping triage current | verified | A-130 footnote 6; §5.a(1)(c)(ii) |
| 19 | PM-5, CM-8 inventories reviewed/updated; SA-22 replace unsupported components | Keeping triage current | verified | SP 800-53 5.2.0 |
| 20 | "400 applications a year" in failure modes | Failure modes | illustrative number, not a claim about any agency | — |

## Notes

- No agency, program or system names; no portfolio size attributable to any agency.
