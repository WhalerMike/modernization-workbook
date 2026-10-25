---
title: "Book 15 — Compliance Automation & Day-2 Operations"
subtitle: "Why modernization succeeds or fails at the help desk: intake and triage, help-desk authority in Entra ID, the service catalogs, SaaS integration governance, the CMDB, control compliance automation across clouds, who runs day two, attestation, and the operator runbook"
description: "Book 15 of the Federal Modernization Workbook: why a modernized estate is judged on day two, intake, triage and routing, help-desk authority and identity verification, the ITSM and Teams telephony catalogs, SaaS integration governance, the CMDB and asset identity, control compliance automation for Microsoft 365, Azure, AWS and VMware, who runs day two, attestation and the compliance application, and the day-two runbook and validation harnesses."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b15-day2-operations
book: B15
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

# Book 15 — Compliance Automation & Day-2 Operations: Where Modernization Becomes Routine {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book replaces the workbook's help-desk Entra operations guide, the day-two operator runbook, the ServiceNow compliance-kit roadmap, and the Federal Compliance series' implementation, automation and day-two operations volumes that cover the help desk, ITSM and telephony catalogs, SaaS integration, the CMDB, control compliance automation, attestation, the evidence pipeline and validation harnesses. Every external claim was checked against a primary source on October 21–22, 2026 and carries a note. The replaced pages are kept in the repository's [`archive/b15-day2-operations/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b15-day2-operations) folder, and their old addresses forward to the chapters that replaced them.
:::

::: {.callout-tip}
## Download and present
**[b15-day2-operations-bundle.docx](../../../downloads/b15-day2-operations-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation (about 12 minutes narrated)**: the Why / What / Who / How deck is on the [Presentations](../../presentations/index.md#book-15) page.

**Technical deep dive (about 50 minutes live, 19 narrated)**: intake and triage, help desk authority in Entra ID, catalogs and the CMDB, and control automation, in modules on the [Presentations](../../presentations/index.md#technical-b15) page.

**Research (draft)**: the Microsoft automation reference, [Module 1: Graph and Azure Foundations](../../research/ms-automation-foundations.md) and [Module 2: Microsoft Entra ID through Microsoft Graph](../../research/ms-automation-entra.md), covers the endpoints, sign-in, permissions and request patterns behind this book's control automation, with tested read-only checks in Python and PowerShell; it's on the [Research](../../research/index.md) page.
:::

A modernized estate is judged on day two. The test is whether the help desk can reset, unlock, provision and recover safely under the new model, without becoming the easiest way in: help desks are a favored target for social engineering, and NIST's recovery guidance and CISA's advisories say so plainly. It is also whether every request reaches one front door, is routed by its authority class, is approved by the right person and leaves evidence behind; whether the CMDB knows what exists; and whether control evidence is produced continuously by automation in each cloud rather than assembled before an audit. Book 15 is about that work. It sets out the help desk's least-privileged roles in Entra ID and the identity checks that come before any sensitive action, the service catalogs, the governance of SaaS integrations, the CMDB as a reconciled projection of authoritative sources, and control compliance automation for Microsoft 365, Azure, AWS and VMware. It is candid about what each platform already provides, including the ITSM platform's own compliance and continuous-monitoring applications, and builds only what they lack. Operations is where modernization either becomes routine or quietly reverts.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why does modernization succeed or fail at the help desk, and why is day two where compliance lives or dies? | [01](01-the-help-desk-decides.md), [02](02-day-two-is-where-compliance-lives.md) |
| **What** | Intake and triage, help-desk authority in Entra ID, the service catalogs, SaaS integration governance, the CMDB, and control compliance automation across clouds | [03](03-intake-triage-and-routing.md), [04](04-help-desk-authority-in-entra.md), [05](05-the-service-catalogs.md), [06](06-saas-integration-governance.md), [07](07-the-cmdb-and-asset-identity.md), [08](08-control-automation-m365-and-azure.md), [09](09-control-automation-aws-and-vmware.md) |
| **Who** | Who executes, who approves, and who owns each catalog, runbook and record | [10](10-who-runs-day-two.md) |
| **How** | Attest and evidence controls through the compliance application, and run the day-two runbook with harnesses that test the automation itself | [11](11-attestation-and-the-compliance-app.md), [12](12-the-day-two-runbook.md) |

Appendix: [A — Help desk task reference](appendix-a-help-desk-task-reference.md)

## Reading paths

- **Executives (20 minutes):** Chapters 01, 02 and 10, or the 15-minute presentation.
- **Service desk managers and staff:** Chapters 03 and 04, with Appendix A.
- **ITSM and ServiceNow platform teams:** Chapters 05, 07 and 11.
- **Cloud and platform engineers:** Chapters 06, 08 and 09.
- **Operations leads and ISSOs:** Chapters 10, 11 and 12.

## Where this book sits in the workbook

This is Book 15 of the [Federal Modernization Workbook](../index.md). Privileged access and the help desk's role tiers are in [Book 04](../b04-access/index.md); routine remediation as a ticket to a machine, and the governance roles, in [Book 13](../b13-governance/index.md); the evidence contract and security operations in [Book 12](../b12-security-operations/index.md); and the authorization package and continuous monitoring in [Book 14](../b14-compliance/index.md). Training for the help desk and the wider workforce is [Book 16](../b16-people/index.md).

## Chapters

::: {#chapters}
:::
