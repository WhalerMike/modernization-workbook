# Verification — Chapter 04, Attribute Authority

File: `docs/books/b03-hr-identity/04-attribute-authority.md`
Diagram sources: `docs/images/diagrams/b03-hr-identity/src/ch04-authority-map.flow.yaml`, `ch04-identifier-layers.flow.yaml`
Verified: 2026-10-20

The chapter had no footnotes before this pass. Twelve were added.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Core HCM for Federal HR 2.0 is Oracle Fusion Cloud HCM | Opening | verified | opm.gov news release (award to Oracle); FedRAMP Marketplace data (Oracle Fusion Cloud includes HCM) |
| 2 | Delivered as SaaS under the provider's own authorization | Opening | verified, made specific: FedRAMP authorization (OPM: "FedRAMP-certified, cloud-based SaaS"; Marketplace: Fusion Cloud FedRAMP Authorized, Moderate) | opm.gov release; GSA marketplace-fedramp-gov-data data.json, product F1603257882 |
| 3 | A position exists independently of any incumbent | Record table | verified | Oracle "Considerations for Using Jobs and Positions" |
| 4 | Assignment carries organization, location, supervisor, effective date | Record table | verified (Oracle `empassignment` feed covers assignment and manager changes) | Oracle "Employee Feeds" |
| 5 | HCM records are effective-dated; future-dated changes exist before they take effect | Effective dating | verified; one sentence added quoting Oracle's model | Oracle "Date Effectivity" |
| 6 | IA-4: authorization to assign, select, assign, prevent reuse for a defined period | Identifiers | verified | NIST SP 800-53 Rev. 5 (OSCAL catalog text, IA-4 a–d) |
| 7 | IA-4(4) status characterization, e.g. contractor | Worker type | verified; wording tightened (the control says "characteristics"; the discussion names contractors) | SP 800-53 Rev. 5, IA-4(4) and discussion |
| 8 | PIV credential identifiers change when the credential is reissued | Identifier table | verified; "FASC-N/UUID" made precise as "FASC-N and card UUID" | FIPS 201-3 (reissuance generates new FASC-N and card UUID) |
| 9 | (Added) FIPS 201-3 optional cardholder UUID is a persistent cardholder identifier | After identifier table | verified (added, with a design note that it can't replace the enterprise key) | FIPS 201-3, CHUID section |
| 10 | (Added) Entra `employeeId` max 16 characters, so the enterprise key must fit | Identifier decision | verified (added) | Graph user resource type |
| 11 | Enterprise person key choice, Mainframe PIN example, rehire re-links the same person | Identifier decision | restated-as-design (program position; generic example, no agency named) | — |
| 12 | (Added) Core HCM Change Worker Type converts contingent worker to employee in one transaction | Worker type | verified (added; Oracle 26B Redwood feature) | Oracle 26B What's New |
| 13 | Worker type drives member/guest, licensing, CA baseline | Worker type | restated-as-design (unchanged; program design) | — |
| 14 | HR is a Privacy Act system of records; OPM/GOVT-1 governs general personnel records | Privacy | verified | Federal Register 88 FR (Aug 17, 2023), OPM/GOVT-1 modified SORN |
| 15 | Moving HR data to the directory needs "a routine-use basis" | Privacy | corrected (per coordinator note from the Chapter 07 editor, verified): within the maintaining agency the basis is normally need-to-know, 5 U.S.C. 552a(b)(1); a routine use is a disclosure outside the agency (A-108). Section heading and "In this chapter" line renamed from "identity is a routine-use consumer" to the disclosure-basis framing; determination left to the privacy office | 5 U.S.C. 552a(b)(1), (b)(3); OMB Circular A-108 (Dec 2016), "Routine Uses" |
| 16 | PIA update, minimization, SSN not a join key | Privacy | restated-as-design | — |
| 17 | Operating rules (one master, no manual edits, corrections upstream, provenance) | Operating rules | restated-as-design | — |
| 18 | Writeback carries only username, work email, work phone | Operating rules | verified as consistent with Microsoft's Oracle HCM guide (detailed and footnoted in Chapter 05) | Microsoft Learn Oracle HCM tutorial |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | kept | edited: added `part: What`; `lifecycle_review` 2027-01-01 → 2027-04-01 |
| Thesis line, "In this chapter" | kept | edited: privacy item reworded to match the corrected section |
| What a human capital system actually owns | kept | edited: FedRAMP authorization made explicit, footnotes on position and assignment rows |
| System of record versus identity provider | kept | unchanged |
| Effective dating: truth with a timeline | kept | edited: one sentence with Oracle's date-effectivity definition |
| Authoritative versus derived attributes (incl. authority map diagram and table) | kept | unchanged |
| One person, layered identifiers (incl. diagram and table) | kept | edited: card UUID precision, cardholder UUID note, 16-character `employeeId` limit; diagram fig-alt and source body changed "PIV FASC-N or UUID" → "PIV FASC-N or card UUID" |
| The worker-type boundary | kept | edited: Oracle Change Worker Type sentence; IA-4(4) wording |
| Privacy: identity is a routine-use consumer | kept as "Privacy: the disclosure basis for identity" | edited: need-to-know vs routine use corrected (claim 15) |
| Operating rules | kept | unchanged |
| Continue the series | kept as "Continue the book" | edited to Book 02 callout style; full Chapter 03 title; "Book index" |

Diagram source note: the comment headers in `ch04-*.flow.yaml` still say "Chapter 03" (pre-renumbering); comments aren't rendered, so left alone.

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Defines *source of authority* once: HR owns personnel facts; Microsoft's object-level Source of Authority (SOA) is called *object SOA* in this book | System of record versus identity provider | verified | c04-soa <https://learn.microsoft.com/en-us/entra/identity/hybrid/user-source-of-authority-overview> |
| R2 | OMB Circular A-108 cited with the same whitehouse.gov URL used in Ch07 and Appendix B | c04-a108 footnote | verified (URL unified) | <https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A108/omb_circular_a-108.pdf> |

## Addition, October 25, 2026: Oracle Core HCM to Entra implementation research

Applied from the research page `docs/research/hcm-entra-implementation.md`; every source below was opened on Oct 25, 2026.

| # | Claim | Where | Verdict | Source note |
|---|---|---|---|---|
| 1 | Lifecycle Workflows' Enable, Disable and Delete user tasks can write account state for synced AD accounts through the provisioning agent | Operating rules | added | c04-lcw-tasks; c04-lcw-onprem |
| 2 | Rule: one writer per state transition, recorded in the authority map | Operating rules | added (design guidance) | c04-lcw-tasks; c04-lcw-onprem |
| 3 | Oracle Fusion Cloud "FedRAMP Authorized, Moderate" (c04-fedramp-fusion) | What a human capital system owns | not changed (out of this pass's scope): Marketplace now shows F1603257882 as FedRAMP Certified, Class C / Moderate, certified Jan 13, 2020; whether OPM's Core HCM instance runs under this package wasn't verified | research page he-fr |

## Change, October 30, 2026: duty location and E911

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "E911 records" replaced with "the fallback emergency address and emergency-notification scoping (never the caller's 911 location)", linked to Chapter 10 | Authority table, Duty location row | corrected: the 911 rules ask for the caller's dispatchable location (47 CFR 9.3, 9.16), and Teams screens calls that rely on an address assigned to the user's number; the HR duty station can only select that fallback | Chapter 10 c10-cfr93, c10-cfr916, c10-remote-loc |
| H1 | HISG's "source of identity" is the directory governing sign-in: on-premises under federation, PTA and password sync; the cloud identity service under cloud primary | System of record versus identity provider | verified (added Oct 31, 2026) | c04-hisg, HISG §3.1.1–3.1.4 <https://www.cisa.gov/resources-tools/services/hybrid-identity-solutions-guidance-hisg> |
| H2 | HISG doesn't address HR; in this book's terms its source of identity is the object SOA and identity platform | Same | restated-as-design | book's terminology mapping; HISG scope §1.2 |
