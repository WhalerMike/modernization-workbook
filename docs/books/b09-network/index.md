---
title: "Book 09 — Network & Transport"
subtitle: "Transport is a physics decision; control is a compliance decision: why physics decides the architecture, what TIC 3.0 and the network control plane require, who owns the network, and how to move branches without a compliance regression"
description: "Book 09 of the Federal Modernization Workbook: the speed-of-light floor, transport versus control, what TIC 3.0 and M-26-14 actually require, logical centralization and token-based security, SD-WAN and SASE, legacy protocols on re-routed paths, 802.1X and RADIUS, the reference architecture, who owns the network, the long interim, field-office WAN transformation, Microsoft 365 traffic, and sequencing, cost and evidence."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b09-network
book: B09
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

# Book 09 — Network & Transport: Physics, Control and the Order of Operations {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book brings together the workbook's *Physics of a Single Source of Truth* series, the branch-networking whitepapers (*The Branch Edge Gap*, *The Long Interim*, *SD-WAN vs. DIA Under TIC 3.0*, *Network Transport and Governance*, and the field-office WAN paper), the Microsoft 365 Optimize exemption instruments, and the short SD-WAN, SASE and RADIUS pages. Every external claim was checked against a primary source on October 20–21, 2026 and carries a footnote. The earlier pages are kept in the repository's [`archive/b09-network/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b09-network) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-tip}
## Download and present
**[b09-network-bundle.docx](../../../downloads/b09-network-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation**: the Why / What / Who / How deck is on the [Presentations](../../presentations/index.md#book-09) page.
:::

Every other book in this workbook moves something: identities, devices, databases, certificates, names. This one is about the paths they move over, and the one constraint no product removes. Light in fiber covers about 200 kilometers per millisecond, and conversational voice leaves the network roughly 70 to 100 milliseconds one way. A field office that hairpins through a distant data center spends much of that on the detour, and a faster circuit doesn't straighten the path. So the architecture follows physics: centralize the source of truth logically, then need less global synchronization rather than trying to make it faster. The second idea is the book's spine: **transport is a physics decision; control is a compliance decision.** Direct internet access, MPLS, satellite and 5G are pipes that close one control family, telecommunications diversity. The governor above them, SD-WAN and the security service edge enforcing TIC 3.0 policy, closes the protection controls and is itself attack surface. Done in the wrong order, lighting up fast connections before the governor is live, modernization becomes a compliance regression with better latency.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why does physics decide the architecture, and why are transport and control separate decisions? | [01](01-why-physics-decides-the-architecture.md), [02](02-transport-is-physics-control-is-compliance.md) |
| **What** | What federal policy actually requires, and what the target network looks like: centralization and tokens, SD-WAN and SASE, legacy protocols on new paths, network access control and the reference architecture | [03](03-what-tic-3-requires.md), [04](04-logical-centralization-and-token-security.md), [05](05-sd-wan-sase-and-governed-transport.md), [06](06-legacy-protocols-on-re-routed-paths.md), [07](07-network-access-control.md), [08](08-reference-architecture.md) |
| **Who** | Who decides and who does the work for the network and its transport | [09](09-who-owns-the-network.md) |
| **How** | Hold a safe posture through the long interim, transform a field-office WAN, handle Microsoft 365 traffic, and sequence, cost and evidence the change | [10](10-the-long-interim.md), [11](11-field-office-wan-transformation.md), [12](12-microsoft-365-traffic.md), [13](13-sequencing-cost-and-evidence.md) |

Appendices: [A — Optimize exemption decision instruments](appendix-a-optimize-exemption-instruments.md) · [B — Requirements mapping and sources](appendix-b-requirements-mapping.md) · [C — Glossary](appendix-c-glossary.md)

## Reading paths

- **Executives (20 minutes):** Chapters 01, 02 and 13, or the 15-minute presentation.
- **Network and security architects:** Chapters 01–08, then 13.
- **Authorizing officials and boundary owners:** Chapters 02, 03, 09 and 12, with Appendices A and B.
- **Program managers and acquisition:** Chapters 09, 10, 11 and 13.
- **Identity and endpoint engineers:** Chapters 04, 06 and 07.

## Where this book sits in the workbook

This is Book 09 of the [Federal Modernization Workbook](../index.md). [Book 08 — DNS, DHCP & IPAM](../b08-ddi/index.md) governs the name layer that SD-WAN interception and encrypted DNS touch ([Chapter 05](../b08-ddi/05-edge-interception-and-bypass.md)). [Book 07 — PKI & Certificates](../b07-pki/index.md) issues the certificates 802.1X depends on, and [Book 04 — Access & Privilege](../b04-access/index.md) turns network location into one signal among many. [Book 05 — Devices & Endpoints](../b05-devices/index.md) and [Book 06 — Data Platform](../b06-data-platform/index.md) carry the device and database work that moves over these paths. For control-level depth, the Federal Compliance volumes on [802.1X network access control](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_I_Book_02_Network_Access_Control_802_1X.md), [network modernization](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_I_Book_05_Network_Modernization.md) and [telecommunications modernization](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_I_Book_06_Federal_Telecommunications_Modernization.md) remain in the repository.

## Chapters

::: {#chapters}
:::
