---
title: "Book 20 — Information Protection & Microsoft Purview"
subtitle: "Why protection has to travel with the data: classes and owners, sensitivity labels and defaults, container labels, Rights Management and recovery, message encryption, SharePoint and OneDrive, DLP, auto-labeling, audit and insider risk, AI data security, and the operations and evidence that keep it working"
description: "Book 20 of the Federal Modernization Workbook: the data pillar engineered with Microsoft Purview. The agency's data classes, owners and federal overlay decisions; a small sensitivity label taxonomy and the reference architecture with its trust boundaries and control planes; publishing labels with justified defaults; container labels for Teams, groups and SharePoint sites; activating Rights Management with just-in-time super-user recovery; Exchange message encryption; label integration and legacy IRM in SharePoint and OneDrive; DLP and endpoint controls; auto-labeling and sensitive information types; Purview Audit, Insider Risk Management and Communication Compliance under a charter; Data Security Posture Management for AI and Microsoft 365 Copilot; and the change control, RACI, evidence catalog and metrics that operate it, with licensing and government-cloud availability stated for each feature."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b20-information-protection
book: B20
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
lifecycle_review: 2027-05-01
---

# Book 20 — Information Protection & Microsoft Purview: Protection That Travels With the Data {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book is new material, written for the Zero Trust Assessment closure update of November 2026, and every page is a draft awaiting the editor's review. It isn't part of Release 2.0, the baseline edition ([Status labels](../../about/sources-and-verification.md#status-labels)). Every external claim was checked against a primary source on November 11, 2026, Microsoft Learn first for product behavior, licensing and government-cloud availability, and each chapter keeps its verification log in the repository. Purview features differ a great deal between the commercial cloud, GCC, GCC High and DoD, and change often: each chapter states availability per feature from Learn as read on that date, and says "not yet specified" where Learn is silent. The commands are taken from Learn and haven't been run against a production tenant; run them against a test tenant first.
:::

An agency that has hardened identity, devices and the network still lets a legitimate user on a compliant device send a file to an approved destination, whatever the file holds. Nothing upstream said what the payload was. Book 20 is the workbook's home for the Zero Trust data pillar: deciding what the agency's data classes are and who owns them, turning them into sensitivity labels that travel with the content, encrypting what has to stay protected outside the tenant and keeping a tested way back into it, stopping sensitive data from leaving through DLP, finding what users didn't label, watching it through audit and insider risk, and governing what AI assistants can reach. It is engineered with Microsoft Purview, and every procedure follows the workbook's implementation conventions: the five control states, the How-section template, authority labels, the evidence checklist, change safety and the Zero Trust mapping block ([Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md)).

Book 20 links where another book already owns the subject. The federal CUI framework and its mapping to labels, the label taxonomy as code, the first DLP baseline and the three meanings of "customer-managed key" are in [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md); the data platform and the SQL Server estate are [Book 06](../b06-data-platform/index.md); telemetry, detection and the evidence contract are [Book 12](../b12-security-operations/index.md); authorization, privacy and the control crosswalk are [Book 14](../b14-compliance/index.md).

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why does protection have to travel with the data, and what has to be decided first? | [01](01-data-inventory-and-classification.md) |
| **What** | The reference architecture and the sensitivity label design | [02](02-sensitivity-label-architecture.md) |
| **How** | Publishing and defaults, containers, Rights Management, message encryption, SharePoint and OneDrive, DLP, auto-labeling, audit and insider risk, and AI data security | [03](03-label-publication-and-defaults.md), [04](04-teams-groups-and-sharepoint-containers.md), [05](05-rights-management-and-recovery.md), [06](06-exchange-message-encryption.md), [07](07-sharepoint-and-onedrive.md), [08](08-dlp-and-endpoint-controls.md), [09](09-auto-labeling-and-sensitive-information-types.md), [10](10-audit-insider-risk-and-communication-compliance.md), [11](11-ai-data-security.md) |
| **Who** | Who operates it, and what an assessor can inspect | [12](12-operations-and-evidence.md), [Appendix A](appendix-a-requirements-mapping.md) |

## The book's required artifacts

| Artifact | Where |
|---|---|
| Reference architecture diagram, with trust boundaries and control planes | [Chapter 02](02-sensitivity-label-architecture.md#the-reference-architecture) |
| Decision record template, with license, cloud availability, prerequisite and compensating-control fields | [Chapter 01](01-data-inventory-and-classification.md#decision-record-template) |
| Implementation checklist, with pilot, enforcement, rollback, exception and validation steps | [Chapter 12](12-operations-and-evidence.md#implementation-checklist) |
| RACI: policy owner, platform owner, operator, security monitor, help desk and assessor | [Chapter 12](12-operations-and-evidence.md#raci) |
| Evidence catalog: configuration, test, operational, exception and reassessment artifacts | [Chapter 12](12-operations-and-evidence.md#evidence-catalog) |
| Metrics of protected coverage and control effectiveness | [Chapter 12](12-operations-and-evidence.md#metrics) |

: Where to find each required artifact {.striped .hover}

## Reading paths

- **CIOs, CISOs and data owners (20 minutes):** Chapters 01 and 12, and the reference architecture in Chapter 02.
- **Purview and Microsoft 365 engineers:** Chapters 02 to 09, in order.
- **Records officers and privacy officials:** Chapters 01, 05 and 10, with [Book 14, Chapter 08](../b14-compliance/08-privacy-pii-processing.md).
- **Security operations:** Chapters 08, 10 and 12, with [Book 12](../b12-security-operations/index.md).
- **AI program owners:** Chapter 11, with [Book 17](../b17-ai-identity/index.md).
- **ISSOs and assessors:** Chapter 12 and Appendix A, with [Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md) for the closure chain.

## Where this book sits in the workbook

This is Book 20 of the [Federal Modernization Workbook](../index.md). It owns the data pillar of the agency's Zero Trust program ([Book 11](../b11-zero-trust/index.md)). The groups that labels grant rights to come from the identity lifecycle in [Book 03](../b03-hr-identity/index.md); Conditional Access, PIM and emergency access are [Book 04](../b04-access/index.md); managed and onboarded devices are [Book 05](../b05-devices/index.md); drift detection is [Book 13](../b13-governance/index.md); the help desk is [Book 15](../b15-day2-operations/index.md); user training on labels and encrypted mail is [Book 16](../b16-people/index.md); and identities for AI agents are [Book 17](../b17-ai-identity/index.md).

## Chapters

::: {#chapters}
:::
