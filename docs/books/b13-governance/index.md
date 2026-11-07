---
title: "Book 13 — Governance, Drift & Evidence"
subtitle: "Why compliance decays the day after the audit: one authoritative record, controlled and provenanced change, deterministic rules, continuous drift detection, system-produced evidence, adapters, and a tempo where routine remediation goes to a machine"
description: "Book 13 of the Federal Modernization Workbook: why point-in-time compliance decays, drift as the primary threat, one authoritative record and its six planes, change control and provenance, deterministic governance and the three-layer rule model, the drift engine, evidence over attestation, the adapter model, who governs, ticket to machine, reciprocity and ongoing authorization, governance at scale, and records, evidence and retention."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b13-governance
book: B13
listing:
  - id: chapters
    contents:
      - "[0-9][0-9]-*.md"
      - "appendix-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Book 13 — Governance, Drift & Evidence: Governance That Doesn't Decay {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book replaces the workbook's executive governance series, its architecture doctrine pages (single source of truth, the six planes, change control and provenance, the three-layer rule model, the drift engine, the evidence chain), the governance executive briefs, the modernization governance and ticket-to-machine whitepapers, and the continuous-monitoring project charter and plan. Every external claim was checked against a primary source and carries a note with its own check date. The earlier pages are kept in the repository's [`archive/b13-governance/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b13-governance) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-tip}
## Download and present
**[b13-governance-bundle.docx](../../../downloads/b13-governance-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation (about 13 minutes narrated)**: the Why / What / Who / How deck is on the [Presentations](../../presentations/index.md#book-13) page.

**Ticket-to-Machine reference (about 10 minutes narrated)**: Appendix B as a narrated walk-through of the coordination loop, the lanes, the tempo and the worked examples, on the [Presentations](../../presentations/index.md#reference-b13) page.

**Technical deep dive (about 50 minutes live, 19 narrated)**: drift and the authoritative record, deterministic rules and the drift engine, evidence and adapters, and who governs, reciprocity and scale, in modules on the [Presentations](../../presentations/index.md#technical-b13) page.

**Executive briefing (about 30 minutes live, 14 narrated)**: for the CIO, CISO, authorizing officials and program office: why compliance decays, one record and one change path, no new AD dependencies from G0, evidence that re-runs, the drift engine, exceptions and ongoing authorization, with each decision's owner and timing, on the [Presentations](../../presentations/index.md#executive-b13) page.
:::

A point-in-time assessment measures a moment. The estate starts drifting the next morning: a setting changes, an exception outlives its reason, a copy of the record starts being written to, and nothing fails loudly. NIST's own guidance calls traditional reauthorization "static" and says ongoing authorization isn't practical without substantial automation. Book 13 is about the governance that makes it practical. It starts from one authoritative record, a single source of truth whose every change is controlled and provenanced. Rules evaluate deterministically against that record, and a drift engine compares the actual state of every platform to it, continuously. Evidence is produced by the systems rather than attested by people, and adapters translate each platform into the same evidence. Routine remediation becomes a ticket to a machine, with people kept on the decisions that matter and the actuation ladder setting how far automation may go. Done that way, one body of continuously produced evidence supports each agency's ongoing authorization, and reuse of authorizations across agencies becomes a matter of evidence rather than paperwork. That evidence, and the authoritative record itself, are also federal records: [Chapter 13](13-records-evidence-and-retention.md) separates the program's meanings of "record" from the legal one and sets out the retention, hold and transfer rules that apply.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why does compliance decay the day after the audit, and why is drift the primary threat? | [01](01-why-governance-decays.md), [02](02-drift-is-the-primary-threat.md) |
| **What** | One authoritative record, controlled change, deterministic rules, the drift engine, evidence over attestation, and the adapters that make it platform-neutral | [03](03-one-authoritative-record.md), [04](04-change-control-and-provenance.md), [05](05-deterministic-governance.md), [06](06-the-drift-engine.md), [07](07-evidence-over-attestation.md), [08](08-the-adapter-model.md) |
| **Who** | Who keeps the record, approves rule changes, reviews drift and accepts exceptions | [09](09-who-governs.md) |
| **How** | Run at machine tempo, support reciprocity and ongoing authorization, govern at scale, and keep the evidence as federal records | [10](10-ticket-to-machine.md), [11](11-reciprocity-and-one-authorization.md), [12](12-governance-at-scale.md), [13](13-records-evidence-and-retention.md) |

Appendices: [A — Requirements mapping](appendix-a-requirements-mapping.md) · [B — Ticket-to-machine reference](appendix-b-ticket-to-machine-reference.md)

## Reading paths

- **Executives (20 minutes):** Chapters 01, 09 and 11, or the 15-minute presentation.
- **Governance leads and stewards:** Chapters 03, 04, 06 and 09, then 12.
- **Engineers building the platform:** Chapters 05, 06, 07 and 08, with Appendix B.
- **ISSOs and authorizing officials:** Chapters 01, 07, 09 and 11, with Appendix A.
- **Records officers:** Chapter 13, which separates the authoritative record and audit evidence from a federal record and says which records rules apply to the evidence the kits produce, then Chapter 09.

## Where this book sits in the workbook

This is Book 13 of the [Federal Modernization Workbook](../index.md). The principles it puts into operation are in [Book 00, Chapter 04](../b00-orientation/04-the-principles.md); the transformation engine and its actuation ladder in [Book 01, Chapter 11](../b01-transformation-arc/11-analysis-plan-delivery.md); the evidence contract and the security-operations side of continuous monitoring in [Book 12](../b12-security-operations/index.md); and the FedRAMP 2026 rules and the authorization boundary in [Book 10](../b10-cloud-boundary/index.md). The Federal Compliance [Governance Platform Integration Overview](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_X_Book_00_Governance_Substrate_Integration_Overview.md) remains in the repository for control-level depth.

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.5**, in [edition 2026.11.4](../../about/archive.md#edition-2026-11-4) (November 5, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/b13-governance).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.5 | [2026.11.4](../../about/archive.md#edition-2026-11-4) | 2026-11-05 | Approve ten pages on Mike's word, and drop two names from the briefs ([#360](https://github.com/WhalerMike/modernization-workbook/pull/360)); Sweep stale wording, and link sources on every deck ([#361](https://github.com/WhalerMike/modernization-workbook/pull/361)) |
| 1.4 | [2026.11.3](../../about/archive.md#edition-2026-11-3) | 2026-11-05 | Book decks: narration names the book or the original source, and 68 videos re-exported ([#344](https://github.com/WhalerMike/modernization-workbook/pull/344)) |
| 1.3 | [2026.11.2](../../about/archive.md#edition-2026-11-2) | 2026-11-02 | Book 13, Chapter 13: records, evidence and retention ([#316](https://github.com/WhalerMike/modernization-workbook/pull/316)); Privacy for workforce identity: Book 03 Chapter 14, and privacy sections in six books ([#317](https://github.com/WhalerMike/modernization-workbook/pull/317)) |
| 1.2 | [2026.11.1](../../about/archive.md#edition-2026-11-1) | 2026-11-01 | Edition 2026.11: record the edition, and publish the four gate-level decks and videos ([#282](https://github.com/WhalerMike/modernization-workbook/pull/282)) |
| 1.1 | [2026.11](../../about/archive.md#edition-2026-11) | 2026-11-01 | Move the decks and narration audio out of git, onto edition 2026.10 ([#260](https://github.com/WhalerMike/modernization-workbook/pull/260)); Retire Research: move each page to a home by type (guides, training, reference, evaluations, explainers) ([#269](https://github.com/WhalerMike/modernization-workbook/pull/269)) |
| 1.0 | [2026.10](../../about/archive.md#edition-2026-10) | 2026-10-31 | First edition (17 merged changes since the book began) |

: Versions of this book, newest first {.striped .hover}

<!-- revisions:end -->
