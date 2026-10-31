---
title: "Book 02 — Identity & Directory"
subtitle: "Active Directory to Entra ID: why identity matters, what changes, who owns it, and how to do it"
description: "Book 02 of the Federal Modernization Workbook: why identity is the control plane of a modern federal estate, how Active Directory and Entra ID differ, the hidden dependency surface and delegation model, who owns which decisions, and the discovery, assessment, build and migration steps, with a reference deployment and federal requirements crosswalk."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b02-identity
book: B02
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

# Book 02 — Identity & Directory: Active Directory to Entra ID {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book consolidates twenty-two earlier workbook pages on identity and directory modernization (whitepapers, operational guides, reference architecture, learning pages and framing case studies) into one ordered book. Every external claim was checked against a primary source on October 20, 2026 and carries a footnote. The earlier pages are kept in the repository's [`archive/b02-identity/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b02-identity) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-tip}
## Download and present
**[b02-identity-bundle.docx](../../../downloads/b02-identity-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation (about 12 minutes narrated)**: the Why / What / Who / How deck and its narrated, self-running edition are on the [Presentations](../../presentations/index.md#book-02) page.

**Technical deep dive (about 50 minutes live, 24 narrated)**: assessing the forest, then building the Entra ID target and migrating, in modules on the [Presentations](../../presentations/index.md#technical-b02) page.

**Executive briefing (about 30 minutes live, 16 narrated)**: for the CIO, CISO and identity program lead: the case for Entra ID as the identity plane, the hidden migration surface, delegation without OUs, the phased migration and retiring AD last, with each decision's owner and timing, on the [Presentations](../../presentations/index.md#executive-b02) page.

**Research (draft)**: the Microsoft automation reference, [Module 1: Graph and Azure Foundations](../../research/ms-automation-foundations.md) and [Module 2: Microsoft Entra ID through Microsoft Graph](../../research/ms-automation-entra.md), covers the endpoints, sign-in, permissions and request patterns for scripting this book's Entra ID target, with tested read-only checks in Python and PowerShell; it's on the [Research](../../research/index.md) page.
:::

Every access decision in a modern federal estate starts with a question about identity: who is this, is the claim about them still true, and what is this device or workload allowed to do? For twenty-five years Active Directory answered those questions inside the network perimeter, and it quietly took on much more: DNS, certificates, Wi-Fi and VPN authentication, file shares, time, application logins, and the organization chart encoded as OUs. Zero Trust moves the decision to the identity provider and evaluates it on every request. Moving from Active Directory to Entra ID is therefore not a directory upgrade. It decides whether every later control works.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why does identity matter, and why can't AD simply be lifted into the cloud? | [01](01-why-identity-matters.md), [02](02-the-structural-problem.md) |
| **What** | What actually changes: the concepts, the hidden dependencies, the delegation model | [03](03-ad-and-entra-side-by-side.md), [04](04-the-hidden-migration-surface.md), [05](05-delegation-without-ous.md) |
| **Who** | Who decides, who does the work, and which tools do what | [06](06-who-owns-the-migration.md) |
| **How** | Discover, assess, build the target, migrate and govern, with a reference deployment | [07](07-read-only-discovery.md), [08](08-assessing-the-forest.md), [09](09-building-the-entra-target.md), [10](10-migrating-and-governing.md), [11](11-reference-deployment.md) |

**What this book accomplishes.** It moves the directory: every object the forest holds, and the four jobs the OU tree did (delegation, policy scope, accountability and security scope), re-expressed in Entra ID as attributes, groups, administrative units and policy ([what the migration accomplishes](../guides/attribute-driven-migration.md#what-this-migration-accomplishes)). The forest holds four populations that move by [four tracks](../guides/attribute-driven-migration.md#four-tracks), each with its own source of truth. Book 02 moves the directory for all four, but its chapters work mostly on two of them: the directory side of the HR track (user objects, groups, administrative units and Lifecycle Workflows), and the non-person identity track (service accounts in [Chapter 09](09-building-the-entra-target.md#modernizing-service-accounts) and Phase 4 in [Chapter 10](10-migrating-and-governing.md#phase-4-service-account-modernization)). The HR source itself is [Book 03](../b03-hr-identity/index.md); devices and servers, the Intune and Arc tracks, are [Book 05](../b05-devices/index.md). The controls this work supports, in the program's mapping, are in [Appendix A](appendix-a-federal-requirements-crosswalk.md#nist-sp-800-53-rev.-5-control-mapping): AC-2 account management for the joiner, mover and leaver loop, and IA-2 and IA-5 for authentication and authenticators; [Chapter 10](10-migrating-and-governing.md#compliance-manager-and-the-fedramp-20x-indicators) maps the service account work to IA-5 for non-user authenticators.

Appendices: [A — Federal requirements crosswalk](appendix-a-federal-requirements-crosswalk.md) · [B — Forest assessment module](appendix-b-forest-assessment-module.md) · [C — Identity assessment module](appendix-c-identity-assessment-module.md)

## Reading paths

- **Executives (20 minutes):** Chapters 01, 02 and 06, or the 15-minute presentation.
- **Architects:** Chapters 01–06, then 11, then Appendix A.
- **Engineers running the work:** Chapters 03–05 for the model, then 07–10 with Appendices B and C at hand.

## Where this book sits in the workbook

This is Book 02 of the [Federal Modernization Workbook](../index.md). The workforce side of identity, with HR as the source of authority, is in [HR-Driven Identity](../b03-hr-identity/index.md). The SQL Server estate's move off Windows authentication is in the [SQL Server Identity Transformation](../b06-data-platform/index.md) series.

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.0**, in [edition 2026.10](../../about/archive.md#edition-2026-10) (October 31, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/b02-identity).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.0 | [2026.10](../../about/archive.md#edition-2026-10) | 2026-10-31 | First edition (35 merged changes since the book began) |

: Versions of this book, newest first {.striped .hover}

<!-- revisions:end -->
