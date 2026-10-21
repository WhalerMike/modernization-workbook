# Verification — Chapter 01, People, Not Tools, Close the Gap

Writer W1. Sources: `docs/compliance/Vol_V_Book_00_Training_Certification_Overview.md` (864 words), `docs/compliance/training-index.md` (2,333 words), `docs/program/education.md` (259 words), `docs/program/training.md` (250 words). The chapter is mostly the book's design argument; its external claims are the federal timing requirements for training. Primary sources opened October 22, 2026: the eCFR versioner API text of 5 CFR part 930 subpart C (downloaded with curl, generic user agent, no identifying headers), the NIST SP 800-53 Rev. 5 release 5.2.0 OSCAL catalog (AT-2, AT-3 statements parsed locally), and the OMB Circular A-130 PDF (text extracted locally). The book-by-book table was built from the B00–B14 `index.md` descriptions and each book's "who" chapter (thesis lines and section headings), read in the worktree; Book 15 (`b15-day2-operations`) isn't in this worktree, so its row follows the B16 brief's settled facts and links the book's index only.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | What each book B00–B14 changes in people's work (table rows) | What each book changes | verified (internal) | Each book's `index.md` description and its "who" chapter in the worktree |
| 2 | Book 15 row: help desk verifies identity before reset/recovery, written authority model, routing to approver | Same | restated-as-design | B16 `_BRIEF.md` settled facts; Book 15 not in this worktree — linked by index path only |
| 3 | Book 04 Ch06: help desk executes, never decides | Same; Tools enforce | verified (internal) | `b04-access/06-who-decides-access.md`, "Help desk and cloud services" |
| 4 | Book 13 Ch09: platform can detect every drift and still decay; it can't decide | Tools enforce | verified (internal) | `b13-governance/09-who-governs.md` thesis line |
| 5 | Risk moves from configuration to judgment; five decisions list | Tools enforce | restated-as-design | — |
| 6 | Education's six ideas; formats (walkthrough, self-serve path, auditor briefing) | Education before training | restated-as-design | Book 00 Ch04 Principle 13 (internal); source `education.md`, internal vocabulary translated |
| 7 | Training's two audiences (people who change the record; people who run and read the tools) and what "done" means for each | Same | restated-as-design | Source `training.md` contributor/operator tracks, translated |
| 8 | Training last is paid for twice | Why training last costs twice | restated-as-design | Labeled "the program's observation" |
| 9 | Book 00 Ch09 lists user resistance / help desk spikes with training as mitigation, pausing the wave as response | Same | verified (internal) | `b00-orientation/09-design-pilot-and-rollout.md` risk table |
| 10 | 5 CFR 930.301(b): awareness material to new employees before access; (d): training on significant change in environment or procedures, or on entering a new position needing role-specific training (quoted) | Same | verified | eCFR versioner, part 930 subpart C, as of 2026-10-01 |
| 11 | SP 800-53 AT-2 a.2 "when required by system changes"; AT-3 a.1 before access/duties, a.2 on system changes | Same | verified | OSCAL catalog 5.2.0, AT-2 and AT-3 statements |
| 12 | IR-2 and CP-3 carry the same system-change trigger | Same | verified | OSCAL catalog 5.2.0 (as settled in Book 14 Ch09 claims log) |
| 13 | A-130 App. I §4.h(5): role-based training "before authorizing access" | Same | verified | A-130 PDF |
| 14 | Gates G0–G5 and their technical exit criteria | Gate readiness table | verified (internal) | `b01-transformation-arc/12-migration-roadmap.md` |
| 15 | Training criterion and evidence per gate | Same; figure 2 | restated-as-design | — |
| 16 | Roster sources: HR-driven identity record, eligible roles, system inventory, IR and contingency plans | Gate readiness | verified (internal) | Book 14 Ch09, "Tier membership is a fact the agency already holds" and AT-4 section |
| 17 | Training gap at a gate passes only as a named, dated exception | Same | restated-as-design | Mirrors Book 13 exception handling |
| 18 | AT family + IR-2/CP-3 is a control family with evidence; covered in Book 14 Ch09 | Training is also a control | verified (internal) | Book 14 Ch09 |
| 19 | Source treated KSI-CED-RAT (training KSI) as the agency's own obligation and last checklist item | Same | corrected | Book 14 Ch09 "Cloud providers and the training indicator" (KSI binds cloud providers) |
| 20 | A-130 §5.c(3) "track performance of workforce development training"; §5.c(2) workforce has appropriate knowledge and skills | Same | verified | A-130 PDF, Main Body §5.c |
| 21 | Book 17 AI Identity Governance is planned | How this book is organized | verified (internal) | `docs/books/index.md` table |
| 22 | "Ten of the series' twenty-nine internal KSI rules are attestable by ScuBA-class tooling alone; the other nineteen…" | Not carried | removed | Internal rule counts (B16 brief: no internal counts); the underlying point (tools measure drift from an intended state but can't author one) is carried as design in the opening and "Tools enforce" |
| 23 | Training-index FedRAMP 20x timeline (Class A opens Aug 3, 2026; 20x mandatory Jan 2027; BOD 26-04 VDR/VER due Dec 7, 2026) | Not carried | removed | Out of scope for the people view; the federal clock is Book 14 Ch02's ground. Not re-verified here |
| 24 | Training-index "Track A … which FedRAMP 20x KSI category evaluates that closure" etc. | Not carried here | — | Belongs to Ch03 (W2) |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Vol V Book 00 — front matter, "Draft Proposal" banner, Date Code, internal-only banner | — | Stamps and agency shortcode; workbook carries none |
| Vol V Book 00 — Volume Purpose (the workforce as authors of the evidence state; competency is itself a control) | Ch01 opening, "Tools enforce; people decide", "Training is also a control" | Internal KSI rule counts and evidence-slot vocabulary dropped (claim 22); `training-effectiveness-record` translated to "training records / evidence" and linked to Book 14 Ch09 |
| Vol V Book 00 — Volume Purpose, two tracks (compliance, implementation) | Ch01 "Education before training" (pointer); detail in Ch03, Ch04 | Track content is W2's |
| Vol V Book 00 — Books in This Volume table (Books 01–04) | Ch01 "Education before training" and "How this book is organized" (Ch03–Ch06) | Volume/book numbering replaced by workbook chapters |
| Vol V Book 00 — Relationship to Vol IV Book 05 (AT program vs academy) | Ch01 "Training is also a control" (Book 14 Ch09 states the controls; this book teaches) | Volume cross-references replaced with Book 14 Ch09 link |
| Vol V Book 00 — How This Volume Fits the Program (truth vs enforcement planes; produces trained operators and the training record) | Ch01 "Training is also a control" (trained people and records) | Plane terminology and "Theme F" are internal vocabulary; not carried |
| Vol V Book 00 — Where This Volume's Evidence Lands — Volume X | — | Engine/substrate binding; outside the workbook (hard rule: no engine) |
| training-index — callouts "Two academies", "Not part of the governance engine", "Living program" | — | Engine positioning and project status; not carried |
| training-index — What this program is (20-book corpus, two tracks table, vendor catalog) | Ch01 "Education before training" (tracks named); tracks to Ch03/Ch04, vendor catalog to Ch06 | Corpus numbering is the Federal Compliance series'; Book 14 Ch12 maps it |
| training-index — Relationship to governance engines | — | Engine positioning; not carried |
| training-index — Provenance status warning | — | Repository status note |
| training-index — The 20-book corpus table (slots, KSI categories) | — (Ch03 / Appendix A) | Evidence-slot and KSI mapping belongs to the compliance track (W2) and the curriculum map (W5) |
| training-index — Program structure (orientation, pick a track, vendor training, capstone) | Ch01 "Education before training" (orientation → tracks); capstone to Ch05 | FedRAMP 20x dates not carried (claim 23) |
| training-index — Core Compliance Pathway (nine-book spine) | — (Ch03 / Appendix A) | Compliance-track content |
| training-index — The `<engine>` token and commands | — | Engine CLI; Ch05 (W3) decides any tool-neutral capstone form |
| training-index — Completion criteria (Track A, Track B) | — (Ch05) | Assessment and certification is W3's |
| training-index — Expansion roadmap | — | Project history |
| training-index — Next | Ch01 "How this book is organized" | — |
| education.md — distinction education vs training | Ch01 "Education before training" | — |
| education.md — The learning arc (six ideas) | Ch01 "Education before training", translated (no "canonical object", "adapters") | — |
| education.md — Formats (90-minute walkthrough, self-serve path, 45-minute auditor briefing) | Ch01 (named, pointer); detail in Ch09 (W5) | Durations left to Ch09 |
| education.md — Companion pages | — | Links to archived pages; replaced by chapter links |
| training.md — One program, two tracks (contributor, operator) and shared core | Ch01 "Education before training", translated as two audiences | "Consumer rule", "topology" are internal vocabulary; not carried |
| training.md — Assessment ("not a certification — a path to doing the real work") | — (Ch05) | W3 reconciles with Vol V Book 03 certification |
| training.md — Companion pages | — | Archived links |
