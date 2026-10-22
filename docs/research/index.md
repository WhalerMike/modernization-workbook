---
title: "Research"
subtitle: "The staging area for the workbook: explainers, product deep dives and implementation guides, reviewed and proved before they are published"
description: "The Federal Modernization Workbook's research area: explainers, product deep dives and implementation guides published for review and validation before they are moved into the workbook's production guidance."
doc-type: section-landing
fmw-eyebrow: "Research"
listing:
  - id: research-explainers
    contents:
      - "*.md"
      - "!index.md"
    include:
      research-type: "explainer"
    type: table
    fields: [title, research-book, research-status, date-modified, description]
    field-display-names: &names
      research-book: "Book"
      research-status: "Status"
      date-modified: "Updated"
    sort: "title asc"
    sort-ui: false
    filter-ui: false
  - id: research-deep-dives
    contents:
      - "*.md"
      - "!index.md"
    include:
      research-type: "product deep dive"
    type: table
    fields: [title, research-book, research-status, date-modified, description]
    field-display-names: *names
    sort: "title asc"
    sort-ui: false
    filter-ui: false
  - id: research-implementation
    contents:
      - "*.md"
      - "!index.md"
    include:
      research-type: "implementation guide"
    type: table
    fields: [title, research-book, research-status, date-modified, description]
    field-display-names: *names
    sort: "title asc"
    sort-ui: false
    filter-ui: false
---

# Research {.unnumbered}

Research is the workbook's staging area. New work starts here, in the open: an explainer, a product deep dive or an implementation guide is written, reviewed and proved before it is published into the workbook's production guidance. Nothing here is production guidance until it is published.

::: {.callout-note}
## How research moves to production
1. **Draft:** being written. Expect gaps and changes.
2. **In review:** complete and sourced, open for comment. Its conclusions may still change.
3. **Proved:** reviewed, and validated in practice, for example in a lab, a pilot or a test tenant, with the evidence recorded on the item's page.
4. **Published:** moved into production. The research page stays as the record of its sources, review and evidence.
:::

Each type of research has its own home in production:

| Type | What it is | Where it is published |
|---|---|---|
| **Explainer** | A plain-language account of a concept, for people learning the area | A book chapter or appendix, or a deck on the [Presentations](../presentations/index.md) page |
| **Product deep dive** | One product judged against a book's requirements, with the evidence for and against it | A production *Product evaluations* section |
| **Implementation guide** | How to build one book's design on a named product, following the book's phases and gates | A production *Implementation* set, one guide per book and product, linked from the book |

The workbook books themselves stay vendor-neutral: they set out what to achieve and why. Product deep dives and implementation guides add the "how, on this product", and reach production only by passing through review and proof here.

Research follows the same rules as the books: every external claim is checked against a primary source and noted, no specific agency is named, and the site is independent analysis, not an official government publication. Where research recommends a product, the recommendation is the program's own analysis, with the evidence for and against it; it is not an endorsement by any agency. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

## Explainers

::: {#research-explainers}
:::

## Product deep dives

::: {#research-deep-dives}
:::

## Implementation guides

None yet. The first is planned to implement Book 08's DDI design on Infoblox.

::: {#research-implementation}
:::
