---
title: "Book 14 — Federal Compliance & Authorization"
subtitle: "Why every control needs proof, not a promise: the federal clock, the Moderate baseline and the crosswalk, closure with proof, the program-management, contingency, supply-chain, privacy and training controls, who owns compliance, and the authorization package"
description: "Book 14 of the Federal Modernization Workbook: proof rather than promise, the federal compliance clock, the NIST Moderate baseline and FedRAMP classes, the control crosswalk, closing controls with their proof, program management, contingency planning, supply chain risk management, privacy and PII processing, training and awareness controls, who owns compliance, the authorization package and continuous monitoring, and a map of the Federal Compliance series."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b14-compliance
book: B14
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

# Book 14 — Federal Compliance & Authorization: Proof, Not a Promise {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book replaces the Federal Compliance series' orientation volume (its executive summary and brief, control crosswalk and product inventory questionnaire), the governance and assurance volume, the series overviews and volume summaries, the evidence contract specification, the federal compliance whitepaper, the test-plan catalog and the supply-chain project charter and plan. The series' other volumes stay in the repository for control-level depth, and [Chapter 12](12-the-series-as-a-map.md) maps each one to the book that carries it. Every external claim was checked against a primary source on October 21, 2026 and carries a note. The replaced pages are kept in the repository's [`archive/b14-compliance/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b14-compliance) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-tip}
## Download and present
**[b14-compliance-bundle.docx](../../../downloads/b14-compliance-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation (about 11 minutes narrated)**: the Why / What / Who / How deck is on the [Presentations](../../presentations/index.md#book-14) page.

**Executive briefing (about 30 minutes live, 15 narrated)**: for authorizing officials, the CISO, CIO and ISSOs: proof over promises, the federal clock, closure with proof, who owns compliance and the authorization package, with each decision's owner and timing, on the [Presentations](../../presentations/index.md#executive-b14) page.
:::

A control that is described in a plan but can't be shown working is a promise. An authorization built on promises decays the day after the assessment. Book 14 is about the proof. It starts with who owes which proof: the cloud provider proves its service under FedRAMP's 2026 rules, the agency proves its own system and its own controls, and the authorizing official alone decides whether the residual risk is acceptable. It sets out the federal clock that now drives the work, from BOD 26-04's remediation timelines to M-26-15's post-quantum plan. It keeps two facts apart that are often blurred: what NIST's Moderate baseline contains and what FedRAMP's classes contain. Then it works through the control families the other books don't carry in depth: program management, contingency planning, supply chain risk management, privacy and PII processing, and training and awareness. The rule throughout is that a control closes only when the mechanism that closes it exists and its proof is recorded. The book ends with the authorization package itself, continuous monitoring and ongoing authorization, and a map of the whole Federal Compliance series to the books that carry it.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why does every control need proof, not a promise, and what does the federal clock require now? | [01](01-proof-not-a-promise.md), [02](02-the-federal-clock.md) |
| **What** | The baseline and the crosswalk, closure with proof, and the program-management, contingency, supply-chain, privacy and training controls | [03](03-the-baseline-and-the-crosswalk.md), [04](04-closure-with-proof.md), [05](05-program-management-controls.md), [06](06-contingency-and-continuity.md), [07](07-supply-chain-risk-management.md), [08](08-privacy-pii-processing.md), [09](09-training-and-awareness-controls.md) |
| **Who** | Who owns compliance, from the ISSO to the authorizing official | [10](10-who-owns-compliance.md) |
| **How** | Build the authorization package and run continuous monitoring, and use the series as a map | [11](11-the-authorization-package.md), [12](12-the-series-as-a-map.md) |

Appendices: [A — Control crosswalk](appendix-a-control-crosswalk.md) · [B — Product inventory questionnaire](appendix-b-product-inventory-questionnaire.md)

## Reading paths

- **Executives (20 minutes):** Chapters 01, 02 and 10, or the 15-minute presentation.
- **ISSOs and compliance teams:** Chapters 03, 04 and 11, with both appendices.
- **Authorizing officials:** Chapters 01, 02, 10 and 11.
- **Privacy offices:** Chapter 08. **Supply chain and acquisition:** Chapter 07. **Continuity planners:** Chapter 06.
- **Anyone choosing what to read next:** Chapter 12.

## Where this book sits in the workbook

This is Book 14 of the [Federal Modernization Workbook](../index.md). The evidence contract it relies on is in [Book 12, Chapter 02](../b12-security-operations/02-the-evidence-contract.md); evidence over attestation, the drift model and reciprocity are in [Book 13](../b13-governance/index.md); and the FedRAMP 2026 rules and the authorization boundary in [Book 10](../b10-cloud-boundary/index.md). Training in depth is [Book 16](../b16-people/index.md).

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.2**, in [edition 2026.11.1](../../about/archive.md#edition-2026-11-1) (November 1, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/b14-compliance).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.2 | [2026.11.1](../../about/archive.md#edition-2026-11-1) | 2026-11-01 | Edition 2026.11: record the edition, and publish the four gate-level decks and videos ([#282](https://github.com/WhalerMike/modernization-workbook/pull/282)) |
| 1.1 | [2026.11](../../about/archive.md#edition-2026-11) | 2026-11-01 | Move the decks and narration audio out of git, onto edition 2026.10 ([#260](https://github.com/WhalerMike/modernization-workbook/pull/260)) |
| 1.0 | [2026.10](../../about/archive.md#edition-2026-10) | 2026-10-31 | First edition (15 merged changes since the book began) |

: Versions of this book, newest first {.striped .hover}

<!-- revisions:end -->
