---
title: "Book 17 — AI Identity Governance"
subtitle: "Why AI agents need identities and owners: what federal AI rules require and don't, the use-case inventory as an identity source, the kinds of AI identity, owners and lifecycle, credentials and least privilege, monitoring and shadow AI, who owns AI identity, the inventory scan, and evidence for authorization"
description: "Book 17 of the Federal Modernization Workbook: why AI systems and agents need governed identities and accountable owners, what M-25-21, M-25-22 and the 2026 executive orders require and what they don't (there is no AI-specific ATO), the federal AI use-case inventory read as an identity source, workload identities and Microsoft Entra Agent ID, sponsors and the AI identity lifecycle, credentials and access policy for AI, monitoring, drift and shadow AI, who owns AI identity governance, running the inventory scan for an agency or centrally, and evidence and authorization for AI systems."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b17-ai-identity
book: B17
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

# Book 17 — AI Identity Governance: Every AI System Needs an Identity and an Owner {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book replaces the workbook's AI identity governance operational guide (its overview, the governed path and the central deployment model) and the federal AI governance readiness brief. Every external claim was checked against a primary source on October 21–22, 2026 and carries a note. Federal AI policy and the identity platforms for AI agents are both moving quickly; the release stage and government-cloud availability of each feature are stated as of those dates. The replaced pages are kept in the repository's [`archive/b17-ai-identity/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b17-ai-identity) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-tip}
## Download and present
**[b17-ai-identity-bundle.docx](../../../downloads/b17-ai-identity-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation (about 12 minutes narrated)**: the Why / What / Who / How deck is on the [Presentations](../../presentations/index.md#book-17) page.

**Executive briefing (about 30 minutes live, 14 narrated)**: for the CIO, CISO, Chief AI Officer, authorizing officials and privacy officer: why AI agents need identities, what federal AI rules require, ownership and lifecycle, shadow AI and the decisions to make, on the [Presentations](../../presentations/index.md#executive-b17) page.

**Technical deep dive (about 50 minutes live, 19 narrated)**: AI agents as identities and the federal rules, the inventory and the kinds of AI identity, owners, credentials and least privilege, and monitoring, shadow AI, the scan and the evidence, in modules on the [Presentations](../../presentations/index.md#technical-b17) page.
:::

AI systems sign in. They hold tokens, call APIs, read records and, increasingly, act: an agent can open a ticket, change a setting or send a message on its own. To the directory each one is an identity, but most were deployed outside the identity program, with no owner of record, no organizational placement, no credential lifecycle and no leaver process. The federal AI use-case inventory lists these systems and reports whether each has an authorization and the required risk practices in place, but it has no fields for who owns the identity, what credential it uses or what it can reach. Book 17 treats AI governance as, in large part, identity governance applied to a new kind of principal. It sets out what federal AI rules require and what they don't: there is no AI-specific authorization to operate, and AI systems go through the agency's existing process. It then reads the inventory as an identity source, sorts AI access by whose token a system presents, and gives every AI identity an accountable human sponsor, credentials without stored secrets, least-privilege access, monitoring and drift findings, and a lifecycle that ends. It closes with the inventory scan, run by an agency or centrally, and the evidence an authorizing official needs for an AI system.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why do AI agents need identities and owners, and what do federal AI rules require, and not require? | [01](01-ai-agents-need-identities.md), [02](02-what-federal-ai-rules-require.md) |
| **What** | The inventory as an identity source, the kinds of AI identity, owners and lifecycle, credentials and least privilege, and monitoring, drift and shadow AI | [03](03-the-inventory-as-an-identity-source.md), [04](04-kinds-of-ai-identity.md), [05](05-owners-sponsors-and-lifecycle.md), [06](06-credentials-and-least-privilege.md), [07](07-monitoring-drift-and-shadow-ai.md) |
| **Who** | Who owns AI identity governance, from the Chief AI Officer to the agent's sponsor | [08](08-who-owns-ai-identity.md) |
| **How** | Run the inventory scan, for one agency or centrally, and evidence AI systems for authorization | [09](09-running-the-inventory-scan.md), [10](10-evidence-and-authorization.md) |

Appendix: [A — Requirements mapping: AI rules to identity controls](appendix-a-requirements-mapping.md)

## Reading paths

- **Executives, Chief AI Officers and CIOs (20 minutes):** Chapters 01, 02 and 08, or the 15-minute presentation.
- **Identity and access teams:** Chapters 04, 05 and 06.
- **Security operations:** Chapter 07.
- **AI governance and inventory leads:** Chapters 03 and 09.
- **ISSOs, assessors and authorizing officials:** Chapters 02 and 10, with Appendix A.

## Where this book sits in the workbook

This is Book 17 of the [Federal Modernization Workbook](../index.md). [Book 18, Application Modernization](../b18-application-modernization/index.md), applies this book to AI built into modernized applications. Workload identities and the Entra target are in [Book 02, Chapter 09](../b02-identity/09-building-the-entra-target.md); the human joiner, mover and leaver lifecycle in [Book 03](../b03-hr-identity/index.md); Conditional Access, application consent and workload identities in [Book 04](../b04-access/index.md); the evidence contract and identity telemetry in [Book 12](../b12-security-operations/index.md); the drift model in [Book 13](../b13-governance/index.md); authorization and continuous monitoring in [Book 14](../b14-compliance/index.md); SaaS and OAuth integration governance in [Book 15, Chapter 06](../b15-day2-operations/06-saas-integration-governance.md); and the training M-25-21 requires for people who use and oversee AI in [Book 16](../b16-people/index.md).

## Chapters

::: {#chapters}
:::
