---
title: "Book 01 — The Transformation Arc"
subtitle: "Client-server to hybrid cloud: why modernization is so hard, what changes across identity, policy, services, compute and access, who leads it, and how to analyze, plan and deliver it in gated phases"
description: "Book 01 of the Federal Modernization Workbook: the end-to-end move from a domain-joined client/server estate to cloud identity, cloud device management and governed hybrid operations, and the map to the books that carry each part in depth."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b01-transformation-arc
book: B01
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

# Book 01 — The Transformation Arc: Client-Server to Hybrid Cloud {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book replaces the workbook's *Client-Server to Hybrid-Cloud* series, the *Modernization Journey* whitepaper, the modernization overview page and an earlier copy of the series' opening chapters. Every external claim was checked against a primary source on October 20–21, 2026 and carries a footnote. The earlier pages are kept in the repository's [`archive/b01-transformation-arc/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b01-transformation-arc) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-note}
## Guidance, not policy
The Federal Modernization Workbook is independent guidance. It isn't federal policy or an official government publication. Where it says a federal document requires something, it cites that document, and the document governs; [Appendix A](appendix-a-requirements-mapping.md) maps each requirement to its source. The program design (the five prerequisites, the gates, the phases and the rollback points) is the workbook's own recommendation. The target state assumes Microsoft's cloud: Microsoft Entra ID, Microsoft Intune, Azure Arc and the Microsoft 365 government clouds. [Appendix B](appendix-b-applicability.md) says where that applies and what changes on other platforms.
:::

::: {.callout-tip}
## Download and present
**[b01-transformation-arc-bundle.docx](../../../downloads/b01-transformation-arc-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation (about 15 minutes narrated)**: the Why / What / Who / How deck and its narrated, self-running edition, with built-in captions, are on the [Presentations](../../presentations/index.md#book-01) page.

**Executive briefing (about 30 minutes live, 25 narrated)**: the transformation at decision level, who leads it and the roadmap's gates, on the [Presentations](../../presentations/index.md#executive-b01) page.
:::

Most agencies run on a client/server estate built around Active Directory, and for twenty years that directory quietly did governance nobody wrote down. Where a user or a computer sat in the tree decided what it could reach, which settings it received and who could change it; its domain controllers answered names, issued certificates and authorized network access. Moving to cloud identity, cloud device management and hybrid operations removes that machinery piece by piece, and each piece fails in its own way, often long after the cutover is declared done. That is why modernization is hard: it is a governance rebuild, not a platform swap. This book is the arc of that rebuild from end to end. It analyzes the estate before anything moves, plans the work as gated phases with a rollback at every step, and treats leadership's job as conducting the orchestra rather than playing the instruments. It is also the map of the workbook: each chapter carries the argument at the level of the whole program and links the book that owns the detail.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why is modernization so hard, and what governance was hiding in the directory? | [01](01-why-modernization-is-hard.md), [02](02-the-problem.md) |
| **What** | What changes: the platform foundation, identity, policy, network services, compute and the access plane | [03](03-platform-foundation.md), [04](04-identity-transformation.md), [05](05-policy-transformation.md), [06](06-network-services.md), [07](07-compute-transformation.md), [08](08-access-plane.md) |
| **Who** | Who leads, decides and does the work across the program | [09](09-who-leads-the-transformation.md) |
| **How** | Analyze the estate, turn the analysis into a plan and deliver it, and follow the migration roadmap | [10](10-analyzing-the-estate.md), [11](11-analysis-plan-delivery.md), [12](12-migration-roadmap.md) |

Appendices: [A — Requirements mapping](appendix-a-requirements-mapping.md) · [B — Applicability](appendix-b-applicability.md)

## The books behind each chapter

| Book 01 chapter | Carried in depth by |
|---|---|
| [04 Identity transformation](04-identity-transformation.md) | [Book 02 — Identity & Directory](../b02-identity/index.md), [Book 03 — HR-Driven Identity](../b03-hr-identity/index.md) |
| [05 Policy transformation](05-policy-transformation.md), [07 Compute transformation](07-compute-transformation.md) | [Book 05 — Devices & Endpoints](../b05-devices/index.md), [Book 06 — Data Platform](../b06-data-platform/index.md) |
| [06 Network services](06-network-services.md) | [Book 08 — DNS, DHCP & IPAM](../b08-ddi/index.md), [Book 09 — Network & Transport](../b09-network/index.md) |
| [08 The access plane](08-access-plane.md) | [Book 04 — Access & Privilege](../b04-access/index.md), [Book 07 — PKI & Certificates](../b07-pki/index.md) |

## Reading paths

- **Executives (20 minutes):** Chapters 01, 02 and 09, or the 15-minute presentation.
- **Architects:** Chapters 01–08, then 12.
- **Program managers:** Chapters 09–12, with Appendix A.
- **New to the workbook:** this book first, then the book for your part of the estate.

## Where this book sits in the workbook

This is Book 01 of the [Federal Modernization Workbook](../index.md), and its overview. The other published books each take one part of the arc and carry it in depth; see the table above.

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This book has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/b01-transformation-arc).

<!-- revisions:end -->
