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

**15-minute presentation**: the Why / What / Who / How deck and its narrated, self-running edition are on the [Presentations](../../presentations/index.md#book-05) page.
:::

For twenty years Group Policy did a great deal of governance without anyone writing it down. Where a computer sat in the OU tree decided which settings it got, in which order, and which ones won. Moving devices to Entra ID and Intune removes that machinery. Nothing in the cloud reads the OU tree, and Intune applies policy by assignment, not by precedence. So the settings, the targeting and the exceptions all have to be stated again on purpose. Servers follow a different road: Intune doesn't manage Windows Server, so servers come under governance through Azure Arc and Azure Policy. This book is the plan for both, and for the hybrid-join shortcut that looks like progress but isn't an end state.

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

This is Book 05 of the [Federal Modernization Workbook](../index.md). It builds on [Book 02 — Identity & Directory](../b02-identity/index.md) for the directory migration, and hands device compliance to [Book 04 — Access & Privilege](../b04-access/index.md), where Conditional Access decides what a compliant device may reach. The [Endpoint & Device Modernization project](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/projects/endpoint-device-charter.md) ([plan](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/projects/endpoint-device-plan.md)) delivers it, and the Client-Server to Hybrid-Cloud chapters on [policy](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/client-server-to-hybrid-cloud/05-policy-transformation.md) and [compute](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/client-server-to-hybrid-cloud/07-compute-transformation.md) tell the same story at the level of the whole estate.

## Chapters

::: {#chapters}
:::
