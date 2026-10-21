# Test Plans — The Catalog, Not the Plans

**One place to answer the question “what tests govern what?”**

A program this ambitious needs more than a pile of tests. It needs a catalog — one place you can look to answer the question “what tests govern what?”

The catalog does not restate the individual plans. It names them, scopes them, and points at their canonical home. Doctrinal templates live as reviewed documents; executable suites live under a tests directory. Either way, everything appears in one table.

## The entry rules

Three rules keep the catalog honest.

1. **Every plan has a canonical entry.** No plans live only on wikis, tickets, or in someone’s head. If a plan governs behavior, it is in the catalog with a document identifier or a path.
2. **Every plan declares its pass signal.** Executable plans emit an exit code, a structured report, or a test-result stream. Doctrinal reviews name the reviewer and the date. A plan whose pass signal is “seems fine” is not a plan; it is an essay.
3. **Retired plans stay in the catalog.** They move to deprecated and carry a pointer to their successor. This is how audit trails stay intact as the program evolves.

## What runs in continuous integration

Four categories of checks typically run on every relevant change as blocking gates:

- Discovery and drift smoke tests
- Schema validation of every registry against its schema
- Metadata validation on every authoritative document
- Drift findings emitted by the walker

Test results stay inside the provenance chain — no side-channel spreadsheets.

## Companion pages

- [Training](training.md) — how the program works
- [Education](education.md) — narrative-led onboarding

---

*Cleaned extraction for project use.*
