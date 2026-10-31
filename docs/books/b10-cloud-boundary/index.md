---
title: "Book 10 — Cloud Boundary & Landing Zone"
subtitle: "Why the authorization boundary, not the product catalog, decides what an agency can use: what changed at FedRAMP, what GCC leaves out, how the landing zone makes the boundary concrete, who owns it, and how to compensate and evidence it"
description: "Book 10 of the Federal Modernization Workbook: the invisible boundary, FedRAMP's 2026 rules, GCC and the commercial feature gap, the landing zone, IPAM and network as code, the front door, who owns the boundary, in-boundary equivalents and documented exceptions, alternative collaboration paths, and evidencing the boundary in the authorization package."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b10-cloud-boundary
book: B10
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

# Book 10 — Cloud Boundary & Landing Zone: What the Boundary Lets You Use {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book replaces the workbook's Boundary Impact Model, the cloud boundary case studies, the FedRAMP 20x feature-gap whitepaper, the Google Workspace collaboration path, the cloud modernization spec and the platform host's Git server interface paper. Every external claim was checked against a primary source on October 20–21, 2026 and carries a footnote. The earlier pages are kept in the repository's [`archive/b10-cloud-boundary/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b10-cloud-boundary) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-tip}
## Download and present
**[b10-cloud-boundary-bundle.docx](../../../downloads/b10-cloud-boundary-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation (about 13 minutes narrated)**: the Why / What / Who / How deck is on the [Presentations](../../presentations/index.md#book-10) page.

**Executive briefing (about 30 minutes live, 21 narrated)**: for authorizing officials and ISSOs, on the [Presentations](../../presentations/index.md#executive-b10) page.

**Technical deep dive (about 50 minutes live, 18 narrated)**: the boundary and the 2026 FedRAMP rules, GCC and the feature gap, the landing zone, IPAM as code and the front door, and the authorization package, in modules on the [Presentations](../../presentations/index.md#technical-b10) page.
:::

A cloud product's feature list describes the commercial service. What an agency can actually use is decided by three separate checks, each with its own owner. First, the provider documents, feature by feature, what its government cloud environment leaves out: Microsoft's network connectivity reporting in the Microsoft 365 admin center, for example, supports commercial tenants "but not GCC Moderate, GCC High, or DoD."[^c00-netconn] Second, FedRAMP certifies a named cloud service offering at a Certification Class, and the provider's assessment scope says what that certification covers; Microsoft 365 GCC, for example, is listed as FedRAMP Certified at Class C.[^c00-marketplace] Third, the agency authorizes its own system: FedRAMP says each agency "still authorizes its own federal information systems."[^c00-fedramp-use] A feature can pass one check and fail another, so none of them stands in for the other two. The book's worked case is Microsoft 365 GCC, with GCC High for comparison, and Azure, including Azure Government, where Microsoft lists each security feature as generally available, in preview or not available.[^c00-azfeature] Much of what these checks remove is invisible. A feature that isn't offered in a government cloud rarely announces itself; a design simply depends on it, and the gap surfaces later as missing data or a capability that never arrives. FedRAMP's 2026 rules changed the vocabulary (services are certified in Classes A through D, and "the boundary" is now a set of scope rules rather than a drawn shape) and gave agencies more to ask a provider for. The landing zone is where the boundary becomes concrete, in management groups, subscriptions, policy, address authority and the front door every change passes through. When a capability is outside the boundary, an agency has three responses: compensate in-boundary, use a documented exception, or choose an alternative path, and in every case evidence the choice in its own authorization package. Going without the capability is also a legitimate outcome when someone decides it and records it.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why does the boundary decide what you can use, and why is so much of it invisible? | [01](01-why-the-boundary-decides.md), [02](02-the-invisible-boundary.md) |
| **What** | What changed at FedRAMP, what GCC leaves out, and how the landing zone, IPAM, network as code and the front door make the boundary concrete | [03](03-what-changed-at-fedramp.md), [04](04-gcc-and-the-feature-gap.md), [05](05-the-landing-zone.md), [06](06-ipam-and-network-as-code.md), [07](07-the-front-door.md) |
| **Who** | Who owns the boundary, and who decides inside it | [08](08-who-owns-the-boundary.md) |
| **How** | Compensate or take a documented exception, choose an alternative path when that's the honest answer, and evidence the boundary in the authorization package | [09](09-equivalents-and-exceptions.md), [10](10-alternative-collaboration-paths.md), [11](11-the-authorization-package.md) |

Appendices: [A — What to ask a cloud provider for](appendix-a-what-to-ask-for.md) · [B — Platform host interface reference](appendix-b-platform-host-interfaces.md)

## Reading paths

- **Executives (20 minutes):** Chapters 01, 04 and 08, or the 15-minute presentation.
- **Architects:** Chapters 01–07, then 09.
- **Authorizing officials and ISSOs:** Chapters 02, 03, 08, 09 and 11, with Appendix A.
- **Cloud platform engineers:** Chapters 05–07, with Appendix B.

## Where this book sits in the workbook

This is Book 10 of the [Federal Modernization Workbook](../index.md). [Book 08 — DNS, DHCP & IPAM](../b08-ddi/index.md) owns the name and address layer the landing zone depends on, and [Book 09 — Network & Transport](../b09-network/index.md) the TIC 3.0 and transport decisions at its edge. [Book 04 — Access & Privilege](../b04-access/index.md) carries Conditional Access, and [Book 01, Chapter 03](../b01-transformation-arc/03-platform-foundation.md) the platform host whose interfaces Appendix B lists. For control-level depth, the Federal Compliance volumes on the [cloud landing zone](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_I_Book_01_Cloud_Landing_Zone_IPAM_FedRAMP.md), [landing zone and network as code](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_VI_Book_01_Landing_Zone_Network_as_Code.md) and [the landing zone front door](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_IX_Book_02_Landing_Zone_Front_Door.md) remain in the repository.

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This book has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/b10-cloud-boundary).

<!-- revisions:end -->

[^c00-netconn]: Microsoft Learn, "Network connectivity in the Microsoft 365 Admin Center," <https://learn.microsoft.com/en-us/microsoft-365/enterprise/office-365-network-mac-perf-overview?view=o365-worldwide> (accessed Oct 21, 2026).
[^c00-marketplace]: FedRAMP Marketplace product data, <https://www.fedramp.gov/marketplace/products.json>, `last_change` 2026-10-21T16:12:00Z (accessed Oct 21, 2026). Listing MSO365MT, "Microsoft 365 Government Community Cloud & Supporting Services": `status` FedRAMP Certified, `cert_class` Class C.
[^c00-fedramp-use]: FedRAMP, "Using a FedRAMP Certified Cloud Service," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/agencies/use/> (accessed Oct 21, 2026).
[^c00-azfeature]: Microsoft Learn, "Cloud feature availability for US Government customers," <https://learn.microsoft.com/azure/security/fundamentals/feature-availability> (accessed Oct 21, 2026).
