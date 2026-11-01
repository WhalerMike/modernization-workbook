---
title: "Book 05 — Devices & Endpoints"
subtitle: "Group Policy to Intune and Azure Arc: why the policy model can't move as it is, what replaces it, who owns the endpoint, and how to migrate"
description: "Book 05 of the Federal Modernization Workbook: why Group Policy can't come to the cloud, the hybrid-join trap, where device and server data lives, Intune-first onboarding, the governed, manual and retrofit paths, who owns the endpoint, the GPO sunset program and policy migration, servers under Azure Arc, and operating and evidencing the fleet."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b05-devices
book: B05
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

# Book 05 — Devices & Endpoints: Group Policy to Intune and Azure Arc {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book consolidates the workbook's device and server modernization pages (the Group Policy sunset guides, the Intune policy migration guide, Intune-first onboarding, the Intune and Azure Arc path guides, the hybrid-join whitepaper and their short companion pages) into one ordered book. Every external claim was checked against a primary source on October 20, 2026 and carries a footnote. The earlier pages are kept in the repository's [`archive/b05-devices/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b05-devices) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-tip}
## Download and present
**[b05-devices-bundle.docx](../../../downloads/b05-devices-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation (about 12 minutes narrated)**: the Why / What / Who / How deck and its narrated, self-running edition are on the [Presentations](../../presentations/index.md#book-05) page.

**Technical deep dive (about 50 minutes live, 27 narrated)**: onboarding, the GPO sunset, Azure Arc and operating the fleet, in modules on the [Presentations](../../presentations/index.md#technical-b05) page.

**Executive briefing (about 30 minutes live, 17 narrated)**: for the CIO, CISO and endpoint lead: why Group Policy can't come to the cloud, Intune-first onboarding, compliance as the access signal, the GPO sunset, servers under Azure Arc and the support dates, with each decision's owner and timing, on the [Presentations](../../presentations/index.md#executive-b05) page.

**Under review**: [Who Names the Device After AD?](../explainers/device-naming-after-ad.md) explains device naming and DNS registration once Active Directory retires.

**Draft**: the Microsoft automation reference, [Module 3: Intune through Microsoft Graph](../../training/ms-automation-intune.md), covers the Graph APIs, least-privileged permissions and beta status behind this book's compliance, configuration and Autopilot evidence, with five tested read-only checks. It builds on [Module 1: Graph and Azure Foundations](../../training/ms-automation-foundations.md).
:::

For twenty years Group Policy did a great deal of governance without anyone writing it down. Where a computer sat in the OU tree decided which settings it got, in which order, and which ones won. Moving devices to Entra ID and Intune removes that machinery. Nothing in the cloud reads the OU tree, and Intune applies policy by assignment, not by precedence. So the settings, the targeting and the exceptions all have to be stated again on purpose. Servers follow a different road: Intune doesn't manage Windows Server, so servers come under governance through Azure Arc and Azure Policy. This book is the plan for both, and for the hybrid-join shortcut that looks like progress but isn't an end state.

## Two tracks in this book

The workbook moves an Active Directory estate on [four tracks](../guides/attribute-driven-migration.md#four-tracks), each with its own source of truth. This book carries two of them:

- **The Intune track: end-user devices.** Workstations, laptops and mobile devices, in Chapters 03, 04 and 08; summarized in the companion guide's [Intune track](../guides/attribute-driven-migration.md#intune-track).
- **The Azure Arc track: servers.** Servers on premises and in other clouds, in Chapter 09; summarized in the guide's [Arc track](../guides/attribute-driven-migration.md#arc-track).

Each track also runs as gated steps with read-only validation checks: the [Intune track implementation guide](../guides/intune-track-implementation.md) and the [Azure Arc Track: Implementation Guide](../guides/arc-track-implementation.md).

On both tracks the attributes come from device provisioning and the procurement or asset record, written at enrollment or Arc onboarding. They don't come from HR. HR never describes a device or a server, and a device rule can't read its owner's attributes ([Chapter 03](03-where-device-and-server-data-lives.md#three-stores-that-policy-reads)). The end state, and how you know you've reached it, is in the guide's [What this migration accomplishes](../guides/attribute-driven-migration.md#what-this-migration-accomplishes). In the program's mapping, the two tracks produce the evidence for NIST SP 800-53 CM-8 (system component inventory), CM-2 (baseline configuration) and CM-6 (configuration settings), set out in [Chapter 10](10-operating-and-evidencing-the-fleet.md#reporting-and-the-evidence-an-assessor-reads).

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why can't Group Policy come to the cloud, and why isn't hybrid join the answer? | [01](01-why-group-policy-cant-come-to-the-cloud.md), [02](02-the-hybrid-join-trap.md) |
| **What** | What is authoritative for devices and servers, how new devices start governed, and which path each estate takes | [03](03-where-device-and-server-data-lives.md), [04](04-intune-first-onboarding.md), [05](05-the-governed-manual-and-retrofit-paths.md) |
| **Who** | Who decides and who does the work for the endpoint | [06](06-who-owns-the-endpoint.md) |
| **How** | Sunset Group Policy, migrate the policy, bring servers under Arc, and run and evidence the fleet | [07](07-the-gpo-sunset-program.md), [08](08-gpo-to-intune-policy-migration.md), [09](09-servers-under-azure-arc.md), [10](10-operating-and-evidencing-the-fleet.md) |

Appendix: [A — GPO to Intune crosswalk](appendix-a-gpo-to-intune-crosswalk.md)

## Reading paths

- **Executives (20 minutes):** Chapters 01, 02 and 06, or the 15-minute presentation.
- **Architects:** Chapters 01–06, then 09.
- **Endpoint and server engineers:** Chapters 03–05, then 07–10 with Appendix A at hand.

## Where this book sits in the workbook

This is Book 05 of the [Federal Modernization Workbook](../index.md). It builds on [Book 02 — Identity & Directory](../b02-identity/index.md) for the directory migration, and hands device compliance to [Book 04 — Access & Privilege](../b04-access/index.md), where Conditional Access decides what a compliant device may reach. The [Endpoint & Device Modernization project](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/projects/endpoint-device-charter.md) ([plan](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/projects/endpoint-device-plan.md)) delivers it, and Book 01's chapters on [policy](../b01-transformation-arc/05-policy-transformation.md) and [compute](../b01-transformation-arc/07-compute-transformation.md) tell the same story at the level of the whole estate.

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.2**, in [edition 2026.11.1](../../about/archive.md#edition-2026-11-1) (November 1, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/b05-devices).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.2 | [2026.11.1](../../about/archive.md#edition-2026-11-1) | 2026-11-01 | Edition 2026.11: record the edition, and publish the four gate-level decks and videos ([#282](https://github.com/WhalerMike/modernization-workbook/pull/282)) |
| 1.1 | [2026.11](../../about/archive.md#edition-2026-11) | 2026-11-01 | Move the decks and narration audio out of git, onto edition 2026.10 ([#260](https://github.com/WhalerMike/modernization-workbook/pull/260)); Retire Research: move each page to a home by type (guides, training, reference, evaluations, explainers) ([#269](https://github.com/WhalerMike/modernization-workbook/pull/269)); Content rules: one home per type, and the federal layers every guide carries ([#271](https://github.com/WhalerMike/modernization-workbook/pull/271)) |
| 1.0 | [2026.10](../../about/archive.md#edition-2026-10) | 2026-10-31 | First edition (26 merged changes since the book began) |

: Versions of this book, newest first {.striped .hover}

<!-- revisions:end -->
