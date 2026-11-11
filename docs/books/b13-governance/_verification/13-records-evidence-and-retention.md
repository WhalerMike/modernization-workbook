# Verification — Chapter 13, Records, Evidence and Retention

New chapter, written November 2, 2026 (no source pages consolidated). It builds on, and doesn't repeat, Book 00 Chapter 10 (records-before-hardware checklist), this book's Chapter 09 ("Who keeps the record as a record"), Book 12 Chapters 10 and 12 (log retention), and the federal framework crosswalk's records rows. Primary sources only (NARA, the CFR, the U.S. Code and OMB), each opened on November 2, 2026: the NARA PDFs and OMB PDFs were downloaded and their text extracted with pypdf; the eCFR parts were read through the eCFR renderer; the U.S. Code sections on govinfo.gov (2023 edition). Kit behavior was read in the repository at commit 221143d2 (`examples/servicenow-sailpoint/clients/python/evidence_export.py`, `examples/servicenow-sailpoint/deploy/step_evidence.py` and `record.py`, `examples/drift-pipeline/README.md`, `python/drift_pipeline.py`, `workflow/drift-pipeline.yml`), and the deploy folders of the privileged access, non-person identity, HR lifecycle and drift-pipeline kits on their open branches (described generically, since they aren't on main yet).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Federal record: recorded information made or received, preserved or appropriate for preservation as evidence of the government's organization, functions, policies, decisions, procedures, operations or other activities, or for informational value | Four things | verified | 44 U.S.C. §3301(a)(1)(A) |
| 2 | Exclusions: library and museum material; "duplicate copies of records preserved only for convenience" | Four things | verified | 44 U.S.C. §3301(a)(1)(B) |
| 3 | Statutory definition repeated in 36 CFR 1220.18; key terms explained in 1222.10 | Table | verified | 36 CFR 1220.18, 1222.10 |
| 4 | GRS 3.1 and 3.2 each say they don't apply to "system data or content" | Four things | verified | GRS 3.1 (T30) intro; GRS 3.2 (T33) intro |
| 5 | "If a clear determination cannot be made, the materials should be treated as records" | Four things | verified | 36 CFR 1222.16(b)(1) |
| 6 | Record status of copies doesn't depend on unique information; duplicates may each be records depending on use | Four things | verified | 36 CFR 1222.12(d) |
| 7 | Unscheduled records "must be treated as permanent until a final disposition is approved" | Four things | verified | 36 CFR 1220.18 |
| 8 | Nonrecord materials segregable; purged when no longer needed; no NARA approval | Four things | verified | 36 CFR 1222.14(b), 1222.16(b)(2)–(3) |
| 9 | Archivist promulgates schedules for records common to several or all agencies; authorizations mandatory | When evidence is a record | verified | 44 U.S.C. §3303a(b), (d) |
| 10 | M-26-14: searchable 6 months, retrievable a year; minimums don't relieve agencies of records schedules | When evidence is a record | verified (quoted) | M-26-14 App. B item 1 |
| 11 | GRS 3.2 items 035–036 revision "Drafting" in Transmittal 38, as of October 2026 | When evidence is a record; GRS table | verified | NARA GRS Status Updates (page last reviewed Oct 20, 2026) |
| 12 | GRS 3.1 item 020: scope and "Destroy 3 years after ... obsolete, completed, terminated or superseded"; DAA-GRS-2013-0005-0004 | GRS table | verified | GRS 3.1, T30 |
| 13 | GRS 3.1 item 030: scope incl. quoted change-documentation phrase; "Destroy 5 years after system is superseded ... terminated, defunded, or no longer needed"; DAA-GRS-2013-0005-0005 | GRS table; Transfer | verified | GRS 3.1, T30 |
| 14 | GRS 3.1 item 040: responses to findings, follow-up, metrics, vulnerability assessment reports, compliance reviews; "Destroy 5 years after the project/activity/transaction is completed or superseded"; DAA-GRS-2013-0005-0010 | GRS table | verified | GRS 3.1, T30 |
| 15 | GRS 3.2 item 010: SSPs, network vulnerability assessments, risk surveys, service test plans, test files and data; destroy 1 year after system superseded or no longer needed; DAA-GRS-2013-0006-0001 | GRS table | verified | GRS 3.2, T33 |
| 16 | GRS 3.2 item 020: incident records; destroy 3 years after follow-up complete; note that significant incidents need separate scheduling (SF 115); DAA-GRS-2013-0006-0002 | GRS table; notes | verified | GRS 3.2, T33 |
| 17 | GRS 3.2 item 030: destroy when business use ceases; DAA-GRS-2013-0006-0003. Item 031: destroy 6 years after password altered or account terminated; DAA-GRS-2013-0006-0004 | GRS table; Transfer | verified | GRS 3.2, T33 |
| 18 | GRS 3.2 item 035: full packet capture, destroy when 72 hours old, DAA-GRS-2022-0005-0001; item 036: cybersecurity event logs, destroy when 30 months old, DAA-GRS-2022-0005-0002; both cite M-21-31 | GRS table | verified | GRS 3.2, T33 |
| 19 | GRS 3.2 items 040, 041: backups; DAA-GRS-2013-0006-0005, -0006 | GRS table; Immutable storage | verified | GRS 3.2, T33 |
| 20 | GRS 4.1 item 020: records management program records incl. "disposal authorizations, schedules, and reports"; "transferring, destroying, and retrieving records"; destroy no sooner than 6 years after completed or superseded; DAA-GRS-2013-0002-0007 | GRS table; hold step 5 | verified | GRS 4.1, T34 |
| 21 | GRS 5.1 item 020: non-recordkeeping copies; destroy immediately after copying to a recordkeeping system; DAA-GRS-2016-0016-0002 | GRS table; kit table | verified | GRS 5.1, T28 |
| 22 | GRS 5.2 item 010: transitory (generally < 180 days), not evidence of decision-making; exclusion for extracts that significantly change content; DAA-GRS-2022-0009-0001. Item 020: intermediary, "sole purpose of creating a subsequent record"; destroy upon creation or update of final record or when no longer needed, whichever later; DAA-GRS-2022-0009-0002 | GRS table; notes; kit table | verified | GRS 5.2, T34 |
| 23 | Transmittal numbers and dates for each schedule | Notes | verified | Each GRS PDF header |
| 24 | All federal records, including contractor-maintained, must be covered by an agency schedule or the GRS | Disposition authority | verified (quoted) | 36 CFR 1225.10 |
| 25 | Application of approved schedules is mandatory | Disposition authority | verified | 36 CFR 1226.10 |
| 26 | Definitions of disposition and disposition authority | Disposition authority | verified | 36 CFR 1220.18 |
| 27 | Directive within six months; "must cite the legal authority (GRS or SF 115 and item numbers)" | Disposition authority | verified (quoted) | 36 CFR 1226.12(a) |
| 28 | Unlawful destruction includes unscheduled/permanent disposal, early disposal of temporary records, and disposal of records under FOIA request, litigation hold or other hold | Disposition authority; Holds | verified (quoted) | 36 CFR 1230.3(b) |
| 29 | Agency heads must report unauthorized destruction to NARA; statute: notify the Archivist of actual, impending or threatened unlawful destruction | Disposition authority | verified | 36 CFR 1230.10(d), 1230.14; 44 U.S.C. §3106(a) |
| 30 | As between an agency schedule and a GRS item, the shorter retention period is required, subject to §2909 | Disposition authority | verified (quoted) | 44 U.S.C. §3303a(b) |
| 31 | NARA withdrawal of disposal authorizations (44 U.S.C. 2909), notified in writing | Disposition authority; Holds | verified | 36 CFR 1226.16 |
| 32 | Retention register, purge jobs read the register, retention change is a governed edit | Disposition authority | restated-as-design | Program design; consistent with Book 12 Ch12 |
| 33 | Electronic recordkeeping must "Apply records hold or freeze on disposition when required" | Holds; Immutable storage | verified (quoted) | 36 CFR 1236.20(b)(7) |
| 34 | Temporary extension: special circumstances; NARA written approval unless < 1 year, court order, or schedule change requested; destroy after circumstances elapse | Holds | verified | 36 CFR 1226.18(a), (c); 1226.20(a) |
| 35 | Extension consistent with the Privacy Act; statute-required disposal not overridden unless court-ordered | Holds; Immutable storage | verified | 36 CFR 1226.18(a)(1)–(2) |
| 36 | Who issues holds (counsel, FOIA office, records officer) | Holds | restated-as-design | Program design |
| 37 | Kits' packaging scripts don't delete; drift pipeline refuses to overwrite an existing package | Suspend steps | verified in code | `drift_pipeline.py` (package: "already exists; an evidence package is written once"); no delete calls in `evidence_export.py`, `deploy/*.py`, `drift_pipeline.py` |
| 38 | Drift pipeline keeps the drift report as a workflow artifact for 7 days | Suspend steps; kit table | verified in code | `workflow/drift-pipeline.yml` (`retention-days: 7`) |
| 39 | Six steps to suspend a purge or rotation | Suspend steps | restated-as-design | Program design |
| 40 | Authenticity and integrity controls (quoted) | Immutable storage | verified (quoted) | 36 CFR 1236.10(b), (c) |
| 41 | Locked policy can't be shortened (Azure immutable storage) | Immutable storage | cross-reference, not re-verified here | Book 19 Ch09 "Verified facts" (Microsoft Learn, accessed Oct 30, 2026) |
| 42 | Five WORM interactions | Immutable storage | restated-as-design, each tied to the CFR provision cited | 36 CFR 1226.18, 1230.3, 1236.20 |
| 43 | Recordkeeping functionalities: declare, capture, organize (associate with schedule), security, access, preserve, execute disposition | Immutable storage | verified | 36 CFR 1236.20(b)(1)–(7) |
| 44 | Backups "must not be used as the agency electronic recordkeeping system" | Immutable storage | verified (quoted) | 36 CFR 1236.20(c) |
| 45 | Plan migration before retirement; keep link between records and metadata, including migration metadata | Transfer | verified (quoted) | 36 CFR 1236.14(a), (b)(3) |
| 46 | Records must be "located, retrieved, presented, and interpreted" | Transfer | verified (quoted) | 36 CFR 1236.10(d) |
| 47 | Keep the verify commands with the evidence store | Transfer | restated-as-design | Program design |
| 48 | Permanent records transferred when schedule says or after 30 years; documentation with electronic records | Transfer | verified | 36 CFR 1235.12, 1235.48 |
| 49 | After June 30, 2024, permanent records transferred electronically with appropriate metadata | Transfer | verified | M-23-07 §1.2 |
| 50 | None of the GRS items in the table is permanent | Transfer | verified | Each item reads "Temporary" |
| 51 | Records officer authority: assign responsibility to a person and office with appropriate authority; responsibilities in each program area; records requirements in system design | Who owns what | verified | 36 CFR 1220.34(a), (d), (e) |
| 52 | ISSO, system owner, steward, counsel rows | Who owns what | restated-as-design | Program design; consistent with Ch09 and Book 12 Ch10 |
| 53 | Kit outputs (file names, folders, what each holds) | Kit table | verified in code | `evidence_export.py`, `deploy/step_evidence.py`, drift-pipeline README; other kits' READMEs; open runbook branches for the other deploy folders |
| 54 | Likely records category per kit output | Kit table | restated-as-design (marked "design guidance", to confirm with the records officer) | GRS items above |

## Unverified or open

- GRS 3.2 items 035 and 036 are under revision (Transmittal 38, Drafting). The table gives the current text; recheck when Transmittal 38 is issued.
- Whether a particular agency has its own schedule items for audit evidence or compliance records can't be checked from public sources; the chapter tells the reader to confirm every row with the records officer.
- The deploy folders for the privileged access, non-person identity, HR lifecycle and drift-pipeline kits were read on their open branches, not on main; the kit table describes them generically ("as each kit adds it").
- The locked-policy fact (row 41) rests on Book 19 Chapter 09's Microsoft Learn citation, not on a source opened for this chapter, because this chapter's sources are limited to NARA, the CFR, the U.S. Code and OMB.

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| (none) | — | New chapter; nothing consolidated or archived |

## Zero Trust closure, Phase 4, November 11, 2026

Added control states and an evidence checklist after the hold procedure (G-01, G-02, G-05, G-06). No new claim; the authority is the 36 CFR rows above.
