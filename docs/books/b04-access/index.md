---
title: "Book 04 — Access & Privilege"
subtitle: "Conditional Access, privileged roles, applications and access governance: why every access decision is a policy decision, and how to run it"
description: "Book 04 of the Federal Modernization Workbook: why access is a policy decision and why standing privilege fails, the Conditional Access model, privileged roles and tiers, applications and workload identities, who decides access, the Conditional Access policy library, PIM self-request with approval, access governance, and access as code with the evidence it produces."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b04-access
book: B04
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

# Book 04 — Access & Privilege: Every Access Decision Is a Policy Decision {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book consolidates the workbook's access-plane pages (the Conditional Access policy library, PIM self-request with approval, the Conditional Access principles and their short companion pages) into one ordered book, and draws on the Federal Compliance books and the Help Desk guide for privileged access, application governance and access as code, which stay in place and are linked. Every external claim was checked against a primary source on October 20, 2026 and carries a footnote. The consolidated pages are kept in the repository's [`archive/b04-access/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b04-access) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-tip}
## Download and present
**[b04-access-bundle.docx](../../../downloads/b04-access-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation (about 9 minutes narrated)**: the Why / What / Who / How deck and its narrated, self-running edition are on the [Presentations](../../presentations/index.md#book-04) page.

**Technical deep dive (about 50 minutes live, 21 narrated)**: the Conditional Access library, PIM and access governance, in modules on the [Presentations](../../presentations/index.md#technical-b04) page.

**Executive briefing (about 30 minutes live, 14 narrated)**: for the CISO, CIO and identity governance officer: access as policy, the Conditional Access baseline, phishing-resistant MFA, privileged tiers and just-in-time access, applications as identities and access governance, with each decision's owner and timing, on the [Presentations](../../presentations/index.md#executive-b04) page.

**Research (draft)**: the Microsoft automation reference, [Module 1: Graph and Azure Foundations](../../research/ms-automation-foundations.md) and [Module 2: Microsoft Entra ID through Microsoft Graph](../../research/ms-automation-entra.md), covers the endpoints, sign-in, permissions and request patterns for evidencing this book's Conditional Access, PIM and application rules through Microsoft Graph, with tested read-only checks in Python and PowerShell; it's on the [Research](../../research/index.md) page.
:::

Zero Trust moves every access decision to a policy engine and makes it on every request. In Microsoft Entra ID that engine is Conditional Access: it reads who is signing in, from what device, to what, with what risk, and decides block, grant, or grant with conditions. Access that used to follow from group membership and network location now follows from policy, so the policy library becomes the agency's access control in practice. The same is true of privilege. A standing administrator is an open door; an eligible one, activated just in time with approval and a fresh strong sign-in, is a decision made and recorded each time. This book is the policy, the privilege model and the governance that keep both honest.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why is every access decision a policy decision, and why does standing privilege fail? | [01](01-access-is-a-policy-decision.md), [02](02-why-standing-privilege-fails.md) |
| **What** | What the policy engine evaluates, how privilege is structured, and how applications and workloads get access | [03](03-the-conditional-access-model.md), [04](04-privileged-roles-and-tiers.md), [05](05-applications-and-workload-identities.md) |
| **Who** | Who decides access and who does the work | [06](06-who-decides-access.md) |
| **How** | The policy library, PIM with approval, access governance, and access as code with its evidence | [07](07-the-conditional-access-policy-library.md), [08](08-pim-self-request-with-approval.md), [09](09-access-governance.md), [10](10-access-as-code-and-evidence.md) |

Appendices: [A — Conditional Access policy templates](appendix-a-conditional-access-templates.md) · [B — PIM role settings reference](appendix-b-pim-role-settings.md)

## Reading paths

- **Executives (20 minutes):** Chapters 01, 02 and 06, or the 15-minute presentation.
- **Architects:** Chapters 01–06, then 10.
- **Identity engineers:** Chapters 03–05, then 07–09 with both appendices at hand.

## Where this book sits in the workbook

This is Book 04 of the [Federal Modernization Workbook](../index.md). It builds on [Book 02 — Identity & Directory](../b02-identity/index.md) and [Book 03 — HR-Driven Identity](../b03-hr-identity/index.md), whose attributes drive the policy targeting here, and it is the authoritative home of the Conditional Access library and the PIM settings that Book 02 introduces. For depth it links to the Federal Compliance books on [privileged access management](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_III_Book_01_Privileged_Access_Management.md), [native cloud IAM](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_VII_Book_08_Native_IAM_RBAC_Access_Governance.md), [identity and access as code](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_VI_Book_02_Identity_Access_as_Code.md), [identity and access governance](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_IX_Book_06_Identity_Access_Governance.md) and [app registration governance](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_IX_Book_03_App_Registration_Governance.md), to the Help Desk guide on [enterprise application access](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/operational-guides/helpdesk-entra-operations/enterprise-application-access-governance.md), and to the [Privileged Access project](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/projects/privileged-access-charter.md).

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.0**, in [edition 2026.10](../../about/archive.md#edition-2026-10) (October 31, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/b04-access).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.0 | [2026.10](../../about/archive.md#edition-2026-10) | 2026-10-31 | First edition (30 merged changes since the book began) |

: Versions of this book, newest first {.striped .hover}

<!-- revisions:end -->
