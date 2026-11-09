---
title: "Book 00 — Orientation & Program"
subtitle: "Why modernize, and why now: the case for one governed program, how the workbook is organized, and the program's charter, principles, plan, projects and decision rights"
description: "Book 00 of the Federal Modernization Workbook: why the client/server estate has to be modernized now, how the workbook is built and how to read it, and the Federal Modernization Program itself: its charter, fifteen principles, phases and gates, complementary projects, governance, and the work from pre-flight to steady state."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b00-orientation
book: B00
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

# Book 00 — Orientation & Program: Why Modernize, and Why Now {.unnumbered}

::: {.callout-important appearance="default"}
## Status — baseline book
This book is part of Release 2.0, the workbook's baseline edition: it is complete, checked against every other book and approved by the workbook's editor, and later changes are tracked against Release 2.0. Baseline is not a claim of independent peer review ([Status labels](../../about/sources-and-verification.md#status-labels)). This book replaces the workbook's modernization overview brief, the federal modernization case study and its framing pattern, the modernization principles, the guide to using the repository, and the program's master project plan and its short twin. Every external claim was checked against a primary source, on the date given in its note, and carries that note. The earlier pages are kept in the repository's [`archive/b00-orientation/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b00-orientation) folder, and their old addresses forward to the chapters that replaced them. The repository's own [charter](https://github.com/WhalerMike/modernization-workbook/blob/main/PROJECT-CHARTER.md) and [plan](https://github.com/WhalerMike/modernization-workbook/blob/main/PROJECT-PLAN.md) stay where they are; Chapters 03 and 05 are their book editions.
:::

::: {.callout-note}
## Guidance, not federal policy
The Federal Modernization Workbook is independent technical guidance. Where it says a law, memorandum, directive or standard *requires* something, it cites that source and the note gives the passage. Everything else, including the program's prerequisites, phases, gates, principles and decision rights, is the workbook's own recommendation, offered as one way to meet those requirements, not as a requirement itself. The reference design targets Microsoft's identity and management stack (Entra ID, Intune, Azure Arc and the Microsoft 365 government clouds). [Book 01, Appendix B](../b01-transformation-arc/appendix-b-applicability.md) says what still applies when an agency's stack differs.
:::

::: {.callout-tip}
## Download and present
**[b00-orientation-bundle.docx](../../../downloads/b00-orientation-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation (about 12 minutes narrated)**: the Why / What / Who / How deck is on the [Presentations](../../presentations/index.md#book-00) page.

**Executive briefing (about 30 minutes live, 23 narrated)**: the decisions leadership must make, with owners and timing, on the [Presentations](../../presentations/index.md#executive-b00) page.
:::

Most federal IT estates still run on a client/server model built around Active Directory, and for twenty years that directory quietly did governance nobody wrote down: where an account or a computer sat in the tree decided what it could reach and who could change it. Federal policy and vendor lifecycles now set clocks the estate can't ignore, from Zero Trust and cloud-configuration directives to logging rules and end-of-support dates. Meeting them one product at a time rebuilds the same governance gaps in a new place. Book 00 makes the case for running modernization as one governed program, explains how the workbook is built and how to read it, and sets out that program: a charter with measurable success criteria, fifteen principles, a plan of seven phases and six gates, seven chartered complementary projects and an eighth that draws on two of them, clear decision rights, and the work from pre-flight to steady state. The other books carry each domain in depth.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why modernize now, and how is this workbook meant to be used? | [01](01-why-modernize-now.md), [02](02-how-to-use-this-workbook.md) |
| **What** | The program's charter, its principles, its plan of phases and gates, and the complementary projects | [03](03-the-charter.md), [04](04-the-principles.md), [05](05-the-program-plan.md), [06](06-the-project-portfolio.md) |
| **Who** | Who runs the program, and who decides what | [07](07-who-runs-the-program.md) |
| **How** | Pre-flight and the assessment; design, pilot and rollout; retirement, steady state and measuring success | [08](08-pre-flight-and-assessment.md), [09](09-design-pilot-and-rollout.md), [10](10-retirement-steady-state-and-success.md) |

Appendices: [A — Risk register and control traceability](appendix-a-risk-register-and-traceability.md) · [B — The engagement archetype (illustrative)](appendix-b-engagement-archetype.md) · [C — Funding and acquiring the program](appendix-c-funding-and-acquisition.md)

## Reading paths

- **Executives and sponsors (20 minutes):** Chapters 01, 03 and 07, or the 15-minute presentation.
- **Program and project managers:** Chapters 03, 05, 06 and 07, then 08–10, with Appendix A.
- **Architects and technical leads:** Chapters 01, 04 and 05, then the domain books from [Book 01](../b01-transformation-arc/index.md).
- **New readers of the workbook:** Chapter 02 first.

## Where this book sits in the workbook

This is Book 00 of the [Federal Modernization Workbook](../index.md), the front door to the series. [Book 01 — The Transformation Arc](../b01-transformation-arc/index.md) carries the technical arc and sets the roadmap's phases and gates, which this book's plan follows; [Book 01, Chapter 09](../b01-transformation-arc/09-who-leads-the-transformation.md) holds the program-wide decision matrix. Each principle in [Chapter 04](04-the-principles.md) names the book and chapter that carry it in depth, and each project in [Chapter 06](06-the-project-portfolio.md) names its book.

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.4**, in [edition 2026.11.4](../../about/archive.md#edition-2026-11-4) (November 5, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/b00-orientation).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.4 | [2026.11.4](../../about/archive.md#edition-2026-11-4) | 2026-11-05 | Approve ten pages on Mike's word, and drop two names from the briefs ([#360](https://github.com/WhalerMike/modernization-workbook/pull/360)); Sweep stale wording, and link sources on every deck ([#361](https://github.com/WhalerMike/modernization-workbook/pull/361)) |
| 1.3 | [2026.11.3](../../about/archive.md#edition-2026-11-3) | 2026-11-05 | Book decks: narration names the book or the original source, and 68 videos re-exported ([#344](https://github.com/WhalerMike/modernization-workbook/pull/344)); Source links: slides link their sources, YouTube descriptions, and sources on the Watch page ([#349](https://github.com/WhalerMike/modernization-workbook/pull/349)); Source Register: a permanent row for every source, under revision control ([#350](https://github.com/WhalerMike/modernization-workbook/pull/350)); Book 00 Chapter 01: the workbook's Windows Server planning standard ([#352](https://github.com/WhalerMike/modernization-workbook/pull/352)); YouTube descriptions: a bare link names its Source Register row ([#354](https://github.com/WhalerMike/modernization-workbook/pull/354)); Decks and narration: the Windows Server standard in ten decks ([#355](https://github.com/WhalerMike/modernization-workbook/pull/355)) |
| 1.2 | [2026.11.1](../../about/archive.md#edition-2026-11-1) | 2026-11-01 | Edition 2026.11: record the edition, and publish the four gate-level decks and videos ([#282](https://github.com/WhalerMike/modernization-workbook/pull/282)) |
| 1.1 | [2026.11](../../about/archive.md#edition-2026-11) | 2026-11-01 | Move the decks and narration audio out of git, onto edition 2026.10 ([#260](https://github.com/WhalerMike/modernization-workbook/pull/260)); Retire Research: move each page to a home by type (guides, training, reference, evaluations, explainers) ([#269](https://github.com/WhalerMike/modernization-workbook/pull/269)) |
| 1.0 | [2026.10](../../about/archive.md#edition-2026-10) | 2026-10-31 | First edition (23 merged changes since the book began) |

: Versions of this book, newest first {.striped .hover}

<!-- revisions:end -->
