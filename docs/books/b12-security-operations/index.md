---
title: "Book 12 — Security Operations & Telemetry"
subtitle: "Why you can't defend what you can't see: emitting telemetry from every plane under one evidence contract, turning a log warehouse into detection and response, and feeding vulnerability, patch, posture and data findings into one queue an assessor can verify"
description: "Book 12 of the Federal Modernization Workbook: why visibility comes first, the evidence contract and its join key, identity, platform and Microsoft 365 telemetry, SIEM and XDR detection, vulnerability management under BOD 26-04, patch and configuration baselines, cloud-native posture, CUI classification and data protection, who runs security operations, detection engineering and response automation, and continuous monitoring evidence and metrics."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b12-security-operations
book: B12
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

# Book 12 — Security Operations & Telemetry: You Can't Defend What You Can't See {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book replaces the workbook's three-part SIEM telemetry emission guide and its telemetry specification, and draws on the Security Operations volumes of the Federal Compliance series, which stay in the repository for control-level depth. Every external claim was checked against a primary source on October 21, 2026 and carries a note. The replaced pages are kept in the repository's [`archive/b12-security-operations/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b12-security-operations) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-tip}
## Download and present
**[b12-security-operations-bundle.docx](../../../downloads/b12-security-operations-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation**: the Why / What / Who / How deck is on the [Presentations](../../presentations/index.md#book-12) page.
:::

Detection and response are only as good as the telemetry that reaches them. A log warehouse isn't a detection engine: storing everything satisfies nobody's requirement to analyze it, and the gaps that matter most, a plane that never emitted, a connector that shows green while no data arrives, a log tier that raises no alerts, stay silent until an incident finds them. Book 12 starts from that problem. Telemetry has to be emitted deliberately from every plane, identity, cloud platform, Microsoft 365, endpoints, network and data, under one evidence contract whose join key is authoritative asset identity plus time. Vulnerability, patch, configuration, posture and data-protection findings then land in the same queue, against federal clocks such as BOD 26-04's remediation timelines and M-26-14's logging requirements. Detections need rules, rules need response, and both need evidence an assessor can verify. And remediation has no substitute: a finding closes only when the thing is fixed, with proof.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why can't you defend what you can't see, and why is the evidence contract the precondition? | [01](01-you-cant-defend-what-you-cant-see.md), [02](02-the-evidence-contract.md) |
| **What** | What each plane must emit, how a SIEM and XDR turn logs into detection, and how vulnerability, patch, configuration, posture and data protection feed the queue | [03](03-identity-telemetry.md), [04](04-platform-and-m365-telemetry.md), [05](05-from-log-warehouse-to-detection.md), [06](06-vulnerability-management.md), [07](07-patch-configuration-and-baselines.md), [08](08-cloud-native-posture.md), [09](09-data-protection-and-classification.md) |
| **Who** | Who runs security operations, who owns each plane, detection and playbook, and who accepts residual risk | [10](10-who-runs-security-operations.md) |
| **How** | Engineer detections and automate response within the actuation ladder, then evidence the whole system with continuous monitoring and metrics | [11](11-detection-engineering-and-response.md), [12](12-evidence-metrics-and-continuous-monitoring.md) |

Appendix: [A — Requirements mapping: controls, mandates and books](appendix-a-requirements-mapping.md)

## Reading paths

- **Executives (20 minutes):** Chapters 01, 10 and 12, or the 15-minute presentation.
- **SOC and detection engineers:** Chapters 02, 05 and 11, then 03 and 04.
- **Platform and cloud engineers:** Chapters 03, 04, 07 and 08.
- **Vulnerability and patch teams:** Chapters 06 and 07.
- **Data protection and records:** Chapters 09 and 12.
- **ISSOs and authorizing officials:** Chapters 01, 10 and 12, with Appendix A.

## Where this book sits in the workbook

This is Book 12 of the [Federal Modernization Workbook](../index.md). The identity and access signals it collects are designed in [Book 02](../b02-identity/index.md) and [Book 04](../b04-access/index.md), the devices and servers that emit them in [Book 05](../b05-devices/index.md), DNS logging and Protective DNS in [Book 08](../b08-ddi/index.md), CISA telemetry continuity at the network edge in [Book 09, Chapter 03](../b09-network/03-what-tic-3-requires.md), feature availability by government cloud in [Book 10](../b10-cloud-boundary/index.md), and SCuBA assessment evidence in [Book 11](../b11-zero-trust/index.md). For control-level depth, the Federal Compliance [Security Operations volumes](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_III_Book_00_Security_Operations_Overview.md) remain in the repository.

## Chapters

::: {#chapters}
:::
