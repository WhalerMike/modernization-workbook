# Verification — Chapter 01, Overview and Applicability

Editor pass of 2026-10-20. Every URL below was opened (or, for PDFs, downloaded and text-searched) on that date and returned HTTP 200.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Microsoft: IT staff "have relied on manual methods to create, update, and delete employees"; error prone and hard to manage | The proposal | corrected (quote kept; added "insecure", which the same sentence on the page includes) | Microsoft Learn, What is HR-driven provisioning? |
| 2 | HR-driven provisioning definition; "the HR systems become the source of authority" | The proposal | verified | Same |
| 3 | Federal HR 2.0 consolidates agency HR systems onto Oracle Fusion Cloud HCM | The proposal | verified; added the memo's count ("more than 100 unique Core HCM software systems") | OMB/OPM memo Dec 10, 2025, p. 1; OPM award release; Oracle release Jun 11, 2026 |
| 4 | HR data "cleaned for the move" | The proposal | corrected to "reviewed and migrated"; the memo's Appendix C asks agencies to review data and prepare for migration, it does not describe a cleansing program | Memo, §II and Appendix C |
| 5 | Microsoft's path: transfer user source of authority to the cloud, govern with Entra ID Governance, keep AD accounts only where apps need them | The proposal | verified | Microsoft Learn, Transfer user SOA; Transition to the cloud |
| 6 | OMB M-22-09, NIST SP 800-207 and CISA ZTMM are the federal Zero Trust frame; identity is ZTMM's first pillar | Why now | verified (footnotes added; ZTMM v2.0 §5.1 is Identity) | M-22-09; SP 800-207; ZTMM v2.0 |
| 7 | SASE is how Zero Trust is delivered at the edge | Why now | restated-as-design ("In this book's design") — no federal document defines SASE that way | — |
| 8 | TIC 3.0 opened the path for agencies | Why now | verified and made specific: M-19-26 removed the physical TIC access-point requirement | OMB M-19-26 |
| 9 | Conditional Access and dynamic groups read employee attributes | Why now | verified (dynamic membership rules evaluate user attributes) | Microsoft Learn, dynamic membership rules |
| 10 | API-driven inbound provisioning and Lifecycle Workflows realize the provisioning layer; Microsoft documents Oracle Fusion Cloud HCM specifically | Architecture | verified (footnote added) | Microsoft Learn, Oracle HCM provisioning tutorial |
| 11 | GCC (GCC-Moderate) with Entra ID in the commercial cloud, FedRAMP Moderate | Where this book applies | verified; reworded to "whose Entra ID tenant runs in Microsoft's commercial Azure cloud" | Microsoft Learn, Plan for Microsoft 365 Government GCC; Cross-cloud collaboration |
| 12 | Federal HR 2.0 memo initially excludes military personnel and the Intelligence Community | Where it doesn't apply | verified; wording aligned to "Intelligence Community agencies" | Memo, p. 1, note 3 |
| 13 | No OPM document mandates or specifies Entra ID integration | One caution | restated-as-design (program finding); consistent with the memo, the OPM Core HCM page and the solicitation, none of which name Entra ID | Memo; OPM Core HCM page; Solicitation 24322626R0007 Amd 4 |
| 14 | OMB M-19-17 sets the federal enterprise ICAM policy framework | One caution | verified (footnote added) | OMB M-19-17 |
| 15 | FICAM ILM Playbook is best practice, not policy; recommends authoritative workforce sources for creation and termination; supplies joiner-mover-leaver doctrine | One caution | corrected: playbook says "not official policy"; recommends designating HR systems as the authoritative source; its lifecycle is creation / modification / deletion, which JML builds on (it does not use the words joiner-mover-leaver) | IDManagement.gov ILM Playbook (v1.4, March 2026) |
| 16 | Evidence Act is not a one-system-of-record requirement | One caution | verified as a negative statement of the book's position; no change | (see Chapter 02 log) |
| 17 | Wrong link: directory migration guide at `../../books/b02-identity/09-…` | Where it doesn't apply | corrected to `../b02-identity/index.md` and `../b02-identity/09-building-the-entra-target.md` (file exists) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited: added `part: Why`; `lifecycle_review` 2027-04-01; "series" → "book" in description | — |
| Thesis line | edited: "series" → "book" | — |
| In this chapter | edited: "series" → "book" | — |
| The proposal | edited: new opening paragraph stating the book's Why (access is decided by identity attributes; attributes come from tickets; two migrations rebuild both ends; start HR-driven identity); existing paragraphs kept with footnotes added and item 4 corrected; figure gets `#fig-ch01-thesis` | — |
| Why now (was a bold run-in paragraph) | edited: converted to `### Why now` (no fake bold heading); footnotes added; SASE restated as design; TIC 3.0 made specific | — |
| Why together (was a bold run-in paragraph) | edited: converted to `### Why together`; text kept | — |
| The problem | kept | — |
| The modernization outcomes | kept ("series" → "book") | — |
| The architecture in one paragraph | edited: Oracle HCM tutorial footnote added | — |
| The ask | kept | — |
| Authority boundaries | kept | — |
| Architectural principles | kept (bold run-in principle names retained; they lead their own paragraphs, they are not headings) | — |
| Where this series applies | edited: heading "series" → "book"; GCC bullet reworded and footnoted | — |
| Where it doesn't apply as written | edited: memo footnote; Book 02 links fixed | — |
| One caution, stated up front | edited: M-19-17 and ILM footnotes; ILM wording corrected (item 15) | — |
| The enterprise data architecture contribution | kept (chapter references checked against the new numbering) | — |
| What success looks like | kept | — |
| Continue the series | edited: "Continue the book"; Previous → book index; Book index; Next → Chapter 02 | — |
| Footnotes | edited: keys renamed `c00-*` → `c01-*`; access dates updated to Oct 20, 2026; 12 new footnotes | — |

## Revision 2026-10-21 — review fixes

Applied from the verified review of Books 02–05. Sources were opened again on Oct 21, 2026.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | Microsoft's object-level sense of SOA glossed as "which directory masters the account object" | The proposal, second bullet | restated | c01-soa <https://learn.microsoft.com/en-us/entra/identity/hybrid/user-source-of-authority-overview> |

## Addition, October 25, 2026: Oracle Core HCM to Entra implementation research

Applied from the research page `docs/books/guides/hcm-entra-implementation.md`; every source below was opened on Oct 25, 2026.

| # | Claim | Where | Verdict | Source note |
|---|---|---|---|---|
| 1 | "No OPM document mandates or specifies Entra ID integration" | One caution, stated up front | corrected (narrowed): no OPM document specifies Entra integration *for the agency's own directory*; the solicitation names OPM's Entra-based solution for the platform's own sign-in and users and lists an HR-fed identity interconnection only as a sample | c01-pws (Solicitation Amd 4, PWS §5.1.1(3) p. 26; Appendix B p. 95) |

## Revision 2026-10-29 — four tracks and companion-guide alignment

Added the HR-track framing to *Where it doesn't apply as written* (non-person identities and devices/servers point to their tracks) and an end state with *How you know you're there* after *What success looks like*. No new Microsoft facts and no new footnotes.

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A non-person identity has no HR record; owner and sponsor are its accountability; lifecycle follows the owning record and credential expiry | Where it doesn't apply | restated-as-design (shared FRAMING.md); links guide #non-person-identity-track | — |
| 2 | HR never describes a device or a server; a device rule can't read its owner's attributes | Where it doesn't apply | carried; verified in Ch 06 this revision (device rule properties are the device's own) | Ch 06 log, row 5 |
| 3 | End-state goal and how-you-know criteria | What success looks like | restated-as-design, labelled *(design guidance)*; book gates linked in Appendix C | — |
| 4 | AC-2, PS-4, PS-5, IA-4 mapping | What success looks like | carried; links Chapter 11 #control-support-nist-sp-800-53-rev.-5 (c11-nist-80053, checked Oct 20) — no new footnote | Ch 11 |
