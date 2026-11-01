---
title: "Book 18 — Application Modernization"
subtitle: "Why modernizing thousands of legacy mission applications is a portfolio decision, not a rewrite: triage, the target reference architecture, moving the data off DB2 and Oracle, generative and agentic AI with owners, compliance by design, architecture governance, a runnable reference implementation, TOGAF and Zachman, and running the portfolio in waves"
description: "Book 18 of the Federal Modernization Workbook: how an agency with thousands of legacy mission applications decides, one application at a time, whether to retire, retain, rehost, replatform, refactor or rebuild it; the target reference architecture of Java and Spring Boot services, React front ends, Node.js where it fits, API-first contracts and containers; moving data from DB2 and Oracle to PostgreSQL or SQL Server with schema conversion, validation, cut-over and coexistence; generative and agentic AI with an identity and an owner for every agent; NIST SP 800-53, privacy, data governance and OMB Circular A-130 built into the design; the review board, standards, patterns and gates that govern it; a runnable reference implementation; the mapping to TOGAF and Zachman; and running the portfolio in waves."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b18-application-modernization
book: B18
listing:
  - id: chapters
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Book 18 — Application Modernization: A Portfolio, Not a Rewrite {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book is new material; it replaces no earlier workbook pages. Every external claim was checked against a primary source between October 28 and 29, 2026 and carries a note, and each chapter keeps its verification log in the repository. Product versions and support windows (Java, Spring Boot, Node.js, React, PostgreSQL) and the status of migration tools are stated as of those dates. The reference implementation in Chapter 08 is illustrative: its tests pass against a real PostgreSQL engine, but it has not been run against a real DB2 or Oracle database or in production.
:::

::: {.callout-tip}
## Download, run and present
**[b18-application-modernization-bundle.docx](../../../downloads/b18-application-modernization-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**Reference implementation**: a Spring Boot service over PostgreSQL, a React front end, a DB2/Oracle to PostgreSQL migration with row-count, checksum and aggregate validation, and an agentic AI pattern with a stub model, in the repository's [`examples/app-modernization`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/app-modernization) folder. [Chapter 08](08-the-reference-implementation.md) walks through it.

**15-minute presentation (about 9 minutes narrated)**: the Why / What / Who / How deck is on the [Presentations](../../presentations/index.md#book-18) page.

**Executive briefing (about 30 minutes live, 13 narrated)**: for the CIO, chief architect, portfolio owners, CISO, privacy officer and authorizing officials: the application as the unit of decision, triage, one target architecture, proving the data, AI with an owner, compliance by design and the decisions to make, on the [Presentations](../../presentations/index.md#executive-b18) page.

**Technical deep dive (about 50 minutes live, 19 narrated)**: triage scoring, the target architecture, moving and proving the data, AI guardrails, controls and gates, the reference implementation, TOGAF and Zachman, and the waves, in modules on the [Presentations](../../presentations/index.md#technical-b18) page.
:::

Most agencies run hundreds or thousands of mission applications, many of them written decades ago on mainframes, in COBOL, PL/SQL or early Java, against DB2 or Oracle databases, by people who have since retired. Each one works, after a fashion, and each one costs more to keep running every year. The temptation is a grand rewrite. It rarely ends well: the program runs years late, the old system keeps running beside it, and the knowledge buried in the old code is lost on the way. Book 18 treats application modernization as a portfolio problem instead. The unit of decision is the application. Each one gets a disposition (retire, retain, rehost, replatform, refactor or rebuild) from a scored triage that can be run across thousands of applications, not a study per system. The ones that change land on one target reference architecture, so the agency builds and authorizes a pattern once and reuses it. Their data moves with proof that nothing was lost. Generative and agentic AI join the architecture only with an identity and an accountable owner for every agent. And the whole portfolio runs under standards, patterns and review gates that produce the evidence federal compliance asks for, mapped to the TOGAF and Zachman frameworks architects already use, and delivered in waves.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why is application modernization a portfolio decision, not a rewrite? | [01](01-a-portfolio-not-a-rewrite.md) |
| **What** | Triage, the target reference architecture, moving the data, generative and agentic AI, and compliance by design | [02](02-triaging-the-portfolio.md), [03](03-the-target-reference-architecture.md), [04](04-moving-the-data.md), [05](05-generative-and-agentic-ai.md), [06](06-compliance-by-design.md) |
| **Who** | Who governs the architecture: the review board, standards, patterns and gates | [07](07-who-governs-the-architecture.md) |
| **How** | The reference implementation, the TOGAF and Zachman mapping, and running the portfolio in waves | [08](08-the-reference-implementation.md), [09](09-togaf-and-zachman.md), [10](10-running-the-portfolio-in-waves.md) |

## Reading paths

- **Executives, CIOs and portfolio owners (20 minutes):** Chapters 01, 02 and 10.
- **Enterprise and solution architects:** Chapters 03, 07 and 09.
- **Database and data teams:** Chapter 04, with [Book 06](../b06-data-platform/index.md) when the target is SQL Server.
- **AI and application teams:** Chapters 05 and 08, with [Book 17](../b17-ai-identity/index.md).
- **ISSOs, privacy officers and authorizing officials:** Chapter 06, with [Book 14](../b14-compliance/index.md).

## Where this book sits in the workbook

This is Book 18 of the [Federal Modernization Workbook](../index.md). The program's phases and gates, which the waves in Chapter 10 follow, are in [Book 01, Chapter 12](../b01-transformation-arc/12-migration-roadmap.md); decision rights in [Book 00, Chapter 07](../b00-orientation/07-who-runs-the-program.md). The identity side of a SQL Server target, from Windows Authentication to Microsoft Entra ID and connection strings, is [Book 06](../b06-data-platform/index.md). The cloud boundary the target platform runs in is [Book 10](../b10-cloud-boundary/index.md); change control and provenance [Book 13](../b13-governance/index.md); authorization, supply chain and privacy controls [Book 14](../b14-compliance/index.md); and identities and owners for AI agents [Book 17](../b17-ai-identity/index.md).

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.1**, in [edition 2026.11](../../about/archive.md#edition-2026-11) (November 1, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/b18-application-modernization).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.1 | [2026.11](../../about/archive.md#edition-2026-11) | 2026-11-01 | Move the decks and narration audio out of git, onto edition 2026.10 ([#260](https://github.com/WhalerMike/modernization-workbook/pull/260)); Retire Research: move each page to a home by type (guides, training, reference, evaluations, explainers) ([#269](https://github.com/WhalerMike/modernization-workbook/pull/269)) |
| 1.0 | [2026.10](../../about/archive.md#edition-2026-10) | 2026-10-31 | First edition (5 merged changes since the book began) |

: Versions of this book, newest first {.striped .hover}

<!-- revisions:end -->
