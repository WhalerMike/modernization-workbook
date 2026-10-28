# Verification — Chapter 07, Who Governs the Architecture

Writer for Chapters 07, 09 and 10. New chapter; no source pages.

## Sources opened

Opened October 28, 2026: OMB Circular A-130 (2016 revision) PDF on whitehouse.gov, §5.a(2) and Appendix I §4.b(5); NIST SP 800-53 Rev. 5 release 5.2.0 OSCAL catalog (usnistgov/oscal-content on GitHub; catalog metadata reads version 5.2.0, last modified October 22, 2026), statements and discussion for CM-3, CM-3(4), CM-4, CM-8, PL-8, PM-5, PM-7, SA-3, SA-8, SA-10, SA-11, SA-11(1), SA-15, SA-17, SA-22 and SR-4; the SP 800-53B Low, Moderate and High baseline profiles in the same repository; OMB M-26-10 PDF (Section 1); OMB M-26-05 PDF; NIST SP 800-218 (SSDF 1.1) PDF, Table 1; CSRC SP 800-218 final page, SP 800-218 Rev. 1 ipd page and SSDF project page; CISA SBOM page and "2026 Minimum Elements for a Software Bill of Materials (SBOM)" resource page; GitHub Docs "About protected branches"; dora.dev "Trunk-based development"; Michael Nygard's 2011 Cognitect blog post; slsa.dev specification page. Workbook pages read for settled facts and links: Book 00 Ch07, Book 13 Ch04 and Ch09, Book 01 Ch12, Book 14 Ch07 (SSDF and SBOM positions).

Manual checks: none needed for this chapter. All sources opened without sign-in.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A-130: agencies "shall develop an enterprise architecture" with baseline, target and transition plan; should include upgrade, replacement and disposition plans | Federal policy | verified | A-130 §5.a(2) |
| 2 | PM-7 develop and maintain an EA with security, privacy and risk in view | Federal policy | verified | SP 800-53 5.2.0 PM-7 |
| 3 | PL-8 system security and privacy architectures describe integration into the EA and are updated as the EA changes | Federal policy | verified | PL-8 statement a.3, b |
| 4 | SA-17 developer design consistent with the organization's security and privacy architecture | Federal policy | verified | SA-17 statement a |
| 5 | CM-3 elements; quote "with explicit consideration for security and privacy impact analyses" | Federal policy | verified | CM-3 statement b |
| 6 | CM-3(4) security and privacy representatives on the change control element | Federal policy; board membership | verified | CM-3(4) |
| 7 | CM-4 impact analysis before implementation | Federal policy | verified | CM-4 |
| 8 | SA-3, SA-8, SA-10, SA-11, SA-15 content as summarized | Federal policy; gates | verified | Statements in the 5.2.0 catalog |
| 9 | Most named controls are in the Moderate baseline; SA-17 is High only; SA-11(1) is in no baseline | Federal policy | verified | 800-53B profiles: Moderate includes PL-8, CM-3, CM-3(4), CM-4, SA-3, SA-8, SA-10, SA-11, SA-15, CM-8, SA-22, CM-2; High adds SA-17; SA-11(1) absent from all three |
| 10 | FITARA: covered CFO Act agency can't contract for IT unless the CIO has reviewed and approved; restated by M-26-10 (March 31, 2026) | Federal policy | verified | M-26-10 §1 |
| 11 | SA-22 replace components when support ends | Standards | verified | SA-22 |
| 12 | Nygard 2011 ADR format: title, context, decision, status, consequences; numbered sequentially; in the project repo; reversed decisions marked superseded | Standards | verified | Cognitect blog, Nov 15, 2011 |
| 13 | Gate design (four gates), board composition, decision table, tiers adopt/trial/contain/retire, RACI | Board; gates | restated-as-design | Program design, labeled as such |
| 14 | DORA: merge to trunk at least once a day, three or fewer active branches, no code freezes; associated with higher performance; DORA run by Google Cloud | Git practice | verified | dora.dev |
| 15 | SSDF PW.7: decide code review and/or analysis; perform against secure coding standards; record issues | Git practice | verified | SP 800-218 Table 1, PW.7.1–7.2 |
| 16 | GitHub branch protection: required approvals, dismiss stale approvals, code owners, status checks, signed commits, apply to administrators | Git practice | verified | GitHub Docs |
| 17 | GitLab, Azure Repos and Bitbucket have equivalents | Git practice | restated as general statement, not footnoted to each vendor; low-risk | — |
| 18 | SSDF PO.3.3 configure tools to generate artifacts; PS.3.2 provenance "e.g., in a software bill of materials [SBOM]" | Git practice | verified | SP 800-218 Table 1 |
| 19 | SSDF 1.1 Feb 2022 final; 1.2 draft (SP 800-218 Rev. 1 ipd) Dec 17, 2025; comments closed Jan 30, 2026; no final | Git practice | verified | CSRC pages; consistent with Book 14 Ch07 and Book 12 Ch08 |
| 20 | SLSA specification at version 1.2; defines build provenance levels | Git practice | verified (version); levels described generically | slsa.dev/spec |
| 21 | SR-4 document, monitor, maintain provenance | Git practice | verified | SR-4 |
| 22 | M-26-05 (Jan 23, 2026) rescinded M-22-18 and M-23-16; "shall continue to maintain a complete inventory of software and hardware"; may require SBOM on request | SBOM section | verified | M-26-05; matches crosswalk |
| 23 | CISA 2026 Minimum Elements for an SBOM, July 29, 2026, with NSA, FBI, international partners; replaces NTIA 2021 elements | SBOM section | verified | CISA resource page; consistent with Book 14 Ch07 |
| 24 | SA-3 asks for a defined life cycle with security and privacy roles; doesn't prescribe waterfall | Agile | verified (statement content); "doesn't ask for a waterfall" is a reading of the statement | SA-3 |
| 25 | Authorizing official alone accepts residual risk; significance threshold set in the continuous monitoring strategy | Gates; RACI | settled fact (Book 14); restated | Book 14, Book 00 Ch07 |
| 26 | Board reviews, doesn't vote; one decider per decision | Board | consistent with Book 13 Ch09 | Book 13 Ch09 |

## Notes

- No agency, program or system names. A case-insensitive grep of all three chapters, their verification files and diagram sources for the coordinator's list of agency terms returned zero hits on Oct 28, 2026.
- The word "requires" is used only with a cited requirement (A-130, M-26-10/FITARA). Controls are described as what the control "asks."
