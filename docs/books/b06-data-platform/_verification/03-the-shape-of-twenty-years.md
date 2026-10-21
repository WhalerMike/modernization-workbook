# Verification — Chapter 03, The Shape of Twenty Years

Checked October 20, 2026. Sources: the existing page (former Book 02, Chapter 1) verified and upgraded in place, plus the archived front page `docs/case-studies/sql-server-narrative/Book_02.md`, carried into the opening callout and landing diagram.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Consolidation assessment classifies retain / consolidate / retire before any login is touched | Opening callout (from Book_02) and opening prose | restated-as-design | SQL Server engine-authentication decision (program) |
| 2 | "The 2027-04-01 deadline is fixed … a deadline that does not move" | Opening | corrected | It's the program's backstop, not an external deadline (Retiring NTLM FAQ, see Chapter 02 log); now "the program's 2027-04-01 backstop … a date the program has committed not to move" |
| 3 | Instance sprawl by accretion (dev→prod, vendor test, silent Express) | Instance sprawl | restated-as-design | Illustrative pattern (unchanged) |
| 4 | Versions in the estate: 2008–2022 | Instance sprawl | edited | SQL Server 2025 (released Nov 18, 2025) added: Lifecycle, SQL Server 2025 |
| 5 | "Several of those versions are out of support and receive no security updates" | Instance sprawl | corrected | 2008 R2, 2012, 2014 and (since July 14, 2026) 2016 are past extended support; 2014 and 2016 still have paid ESUs (2014 to July 2027, 2016 to July 2029); ESUs require SA or subscription and last ≤ 3 years; 2017 ends Oct 12, 2027. Sources: Learn, SQL Server end of support options; Lifecycle pages for 2008 R2, 2012, 2014, 2016, 2017 |
| 6 | Mixed Standard/Enterprise licensing, partial Software Assurance | Instance sprawl | restated-as-design | Pattern (unchanged) |
| 7 | 40 believed vs 110 found | Instance sprawl | restated-as-design | Already labeled illustrative (unchanged) |
| 8 | Orphaned, zombie, near-duplicate databases | Database sprawl | restated-as-design | Pattern (unchanged) |
| 9 | Zombie DB may carry a valid SQL login that discovery reports as active | Database sprawl | restated-as-design | Argument (unchanged) |
| 10 | 400-day zombie example | Database sprawl | restated-as-design | Illustrative (unchanged) |
| 11 | Cross-domain logins, linked servers, multi-domain service accounts | Forest entanglement | restated-as-design | Pattern (unchanged) |
| 12 | Consolidation is when identity resolution is cheapest | Forest entanglement | restated-as-design | Argument (unchanged) |
| 13 | Renumbering: "previous book" → Chapters 01–02; "Books 03 through 10" → Chapters 07 through 22; "Chapter 1" H1 → Chapter 03 | throughout | corrected | Brief map |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Book_02 front matter (subtitle "Assessing and Consolidating Twenty Years of Forest Sprawl Before the Migration"; description) | Chapter description; opening callout | edited |
| Book_02 callout ("You do not migrate the estate in the shape you discover it…") | Opening callout "You don't migrate the estate in the shape you discover it", with a map of Chapters 03–06 | kept (extended) |
| Book_02 landing figure `book-02-assess-before-migrating.svg` | After the callout, `#fig-c03-assess-before-migrating` | kept; source edited: tags "Chapter 1–2 / 3 / 4" → "Chapters 03–04 / 05 / 06", "Books 03–10" → "Chapters 07–22" |
| Book_02 "Download this book" | — | removed: per-book bundle no longer exists |
| Book_02 "Chapters" listing | Opening callout's chapter map | edited |
| Book_02 "Place in the dependency chain: Steps 1–2 — Inventory and Rationalize" | Opening callout | edited |
| Book_02 Authoritative references (EoS options; Arc overview; MI T-SQL login migration tutorial; cloud-first guidance) | EoS options → this chapter's footnote; cloud-first guidance → Chapter 04; Arc overview → Chapter 02 context | edited — the MI Windows-user migration tutorial belongs to the login-migration chapters (11–12), not the Why part; not carried here |
| Book_02 Continue callout | Continue callout | edited |
| Ch1 In this chapter | In this chapter | kept |
| Ch1 opening prose (2 paragraphs) | Opening prose | edited (claim 2, renumbering) |
| Ch1 Instance Sprawl | Instance sprawl | edited (claims 4–5) |
| Ch1 Database Sprawl | Database sprawl | kept |
| Ch1 Forest Entanglement | Forest entanglement | kept (renumbering) |
| Ch1 "What Book 02 establishes" | "What this chapter establishes" | kept |
| Diagram `book-02-ch01-three-forms-of-sprawl` | After the opening prose | kept; source unchanged ("Versions from 2008 to 2022" still accurate for the legacy population) |

## Consistency fixes, round 2 (2026-10-21)

Book-wide consistency pass. *Design-consistency* rows restate a program choice the same way everywhere and need no new note; *factual* rows were re-researched against the primary source on 2026-10-21 and carry their own footnote.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| CR2-1 | Zombie definition "no connection in over a year" changed to "400 or more days, the program's zombie threshold" (matches Chapter 05 and Runbook R02's `-ZombieThresholdDays` default of 400) | line 48 | design-consistency | — |
