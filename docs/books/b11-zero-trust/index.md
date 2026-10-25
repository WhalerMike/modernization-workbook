---
title: "Book 11 — Zero Trust & Assessment"
subtitle: "Why Zero Trust is a property of the whole agency, not a product: what the mandates actually require, how SCuBA and the assessment tools fit, who owns it, and how to assess honestly and turn the findings into a program"
description: "Book 11 of the Federal Modernization Workbook: Zero Trust as a whole-agency property, governance principles, what CISA's maturity model and M-22-09 require, SCuBA and BOD 25-01, ScubaGear and Microsoft's Zero Trust Assessment, networks and virtualized estates beyond Microsoft 365, who owns Zero Trust, closing before assessing, running the assessment, and evidence rather than verdicts."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b11-zero-trust
book: B11
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

# Book 11 — Zero Trust & Assessment: A Whole-Agency Property {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book replaces the workbook's Zero Trust whitepapers (whole-agency unification, governance principles and governance model, the ScubaGear integration, the SCuBA and Zero Trust Assessment relationship, and closing BOD 25-01 before assessing), the Zero Trust executive brief, the assessment guide and the Zero Trust spec. Every external claim was checked against a primary source on October 21, 2026 and carries a footnote. The earlier pages are kept in the repository's [`archive/b11-zero-trust/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b11-zero-trust) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-tip}
## Download and present
**[b11-zero-trust-bundle.docx](../../../downloads/b11-zero-trust-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation (about 13 minutes narrated)**: the Why / What / Who / How deck is on the [Presentations](../../presentations/index.md#book-11) page.

**Executive briefing (about 30 minutes live, 22 narrated)**: for CISOs and authorizing officials, on the [Presentations](../../presentations/index.md#executive-b11) page.

**Technical deep dive (about 50 minutes live, 18 narrated)**: the mandates, BOD 25-01 and the two assessment tools, ownership and closing before assessing, and running the assessment for evidence, in modules on the [Presentations](../../presentations/index.md#technical-b11) page.
:::

Zero Trust maturity is a property of the whole agency: its identities, devices, networks, applications and data, across every cloud, every on-premises system and every virtualized estate. No single product or tenant score can certify it, because each tool sees only the part of the estate it was built for, and an attacker needs only the part nobody assessed. A whole-agency picture needs one naming and identity plane underneath the tools. CISA's Zero Trust Maturity Model and OMB M-22-09 set the direction; CISA's SCuBA baselines and BOD 25-01 set the required configuration for the agency's cloud tenants. The order matters: close the known BOD 25-01 findings before assessing, so the assessment measures the target state rather than gaps everyone already knew about. And the assessment tools, CISA's ScubaGear and Microsoft's Zero Trust Assessment, produce evidence for the program to act on, not verdicts to report.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why is Zero Trust a whole-agency property, and what principles govern it? | [01](01-a-whole-agency-property.md), [02](02-governance-principles.md) |
| **What** | What the mandates actually require, what SCuBA and BOD 25-01 demand, how the two assessment tools relate, and what lies beyond Microsoft 365 | [03](03-what-the-mandates-require.md), [04](04-scuba-and-bod-25-01.md), [05](05-two-assessment-tools.md), [06](06-beyond-microsoft-365.md) |
| **Who** | Who owns Zero Trust, pillar by pillar | [07](07-who-owns-zero-trust.md) |
| **How** | Close before you assess, run the assessment and ingest its evidence, and turn findings into a program | [08](08-close-before-you-assess.md), [09](09-running-the-assessment.md), [10](10-evidence-not-verdicts.md) |

Appendix: [A — Requirements mapping: pillars, controls and books](appendix-a-requirements-mapping.md)

## Reading paths

- **Executives (20 minutes):** Chapters 01, 03 and 07, or the 15-minute presentation.
- **CISO staff and architects:** Chapters 01–06, then 10.
- **Assessment and SOC teams:** Chapters 04, 05, 08 and 09.
- **Authorizing officials:** Chapters 03, 08 and 10, with Appendix A.

## Where this book sits in the workbook

This is Book 11 of the [Federal Modernization Workbook](../index.md). The pillars are carried in depth elsewhere: identity in [Book 02](../b02-identity/index.md) and [Book 03](../b03-hr-identity/index.md), access in [Book 04](../b04-access/index.md), devices in [Book 05](../b05-devices/index.md), networks in [Book 08](../b08-ddi/index.md) and [Book 09](../b09-network/index.md), and the cloud boundary in [Book 10](../b10-cloud-boundary/index.md). [Appendix A](appendix-a-requirements-mapping.md) maps each pillar and control to the book that closes it.

## Chapters

::: {#chapters}
:::
