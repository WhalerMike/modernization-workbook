# Verification — Chapter 23, Epilogue: The Platform Question

Checked October 20, 2026. Source: the existing page (former Book_11 epilogue), verified and upgraded in place.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Goal of fewer authoritative platforms, one per data domain | The fragmentation cost | restated-as-design | Program position (unchanged) |
| 2 | Three candidate destinations; framework not verdict | Three destinations | restated-as-design | Program position (unchanged) |
| 3 | Each destination can satisfy the forced requirement (observable, conditionable authentication) | Three destinations | verified (newly footnoted) | Learn, Entra authentication for SQL Server; Learn, Entra authentication in Azure Database for PostgreSQL flexible server; Oracle AI Database Security Guide, Authenticating and Authorizing Microsoft Azure Users |
| 4 | Each platform's own docs are the authority on identity integration | Three destinations | restated-as-design | Added; matches the framework's identity-integration row |
| 5 | Ten-dimension decision framework | Decision framework | restated-as-design | Unchanged |
| 6 | CIO and data leadership decide per domain | Decision framework | restated-as-design | Added; cross-link to Chapter 13 |
| 7 | Decision sequence: audit/rationalize, forced auth move, then platform choice with parallel run | Decision sequence | restated-as-design | Unchanged; references renumbered |
| 8 | Windows users/groups remapped to Entra logins on SQL MI with ALTER USER … WITH LOGIN | Decision sequence | verified | Learn, Migrate SQL Server Windows users and groups to SQL Managed Instance using T-SQL |
| 9 | Charter leaves full consolidation and platform replacement out of the initial phase | Epilogue callout | verified | data-platform-charter.md §4 |
| 10 | "Authoritative references, checked 19 October 2026" list (3 links) | Former end section | corrected | All three re-opened Oct 20, 2026; two converted to footnotes cited in text (Entra overview, MI migration tutorial). The Arc overview link was not cited by any claim and was dropped |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | Front matter | edited: title "Chapter 23 — Epilogue: The Platform Question"; `doc-type: workbook-chapter`; `lifecycle_review: 2027-04-01`; description no longer says "ten-book series"; `subtitle` removed for consistency with Books 02–05 |
| docx-only H1 block | H1 | edited: replaced with a normal H1 |
| (none) | Thesis line and "In this chapter" callout | added |
| "An epilogue, not an eleventh migration step" callout | Same callout | edited: Books 01–10 → Chapters 01–22; charter scope note added |
| "Download this book" callout | — | removed: bundle links are not used in Books 02–05 |
| The Fragmentation Cost | The fragmentation cost | kept (heading sentence-cased) |
| Three Destinations (+ figure) | Three destinations | edited: footnoted identity support per platform; figure kept |
| Decision Framework (table) | Decision framework | kept; one ownership sentence added |
| Decision Sequence (+ figure, list) | Decision sequence | edited: Books 02–03 → Chapters 03–08; Books 04–06 → Chapters 09–12 and 14–15; MI remap example added |
| "What Book 11 establishes" callout | "What Chapter 23 establishes" | kept, retitled |
| "Place in the dependency chain" line | Closing paragraph | edited: old index anchor `#the-dependency-chain` replaced by a plain statement of the reading order |
| Authoritative references | Footnotes | edited (see claims log #10) |
| Continue the series callout | Continue the book | edited: Previous → Chapter 22; Next → Runbook R01 per the reading order |

## Diagrams

- `book-11-three-destinations.flow.yaml` — source edited: "(Books 04–05)" → "(Chapters 09–12)". Needs re-rendering.
- `book-11-decision-sequence.flow.yaml` — source edited: "(Books 02–03)" → "(Chapters 03–08)". Needs re-rendering.
