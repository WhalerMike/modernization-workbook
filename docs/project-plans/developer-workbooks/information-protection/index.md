---
title: "Building Information Protection"
subtitle: "A developer workbook for the information protection implementation guide"
description: "A developer workbook for the information protection implementation guide: a code-first companion for the developers who build the read-only checks that prove Microsoft Purview is doing what Book 20 and the agency's plan say. The Security & Compliance and Exchange Online read path and the Purview role register; the configuration baseline export of Book 20, Chapter 12; the class register against the tenant's sensitive information types; labels, label policies and container labels against the plan; Rights Management with the super user feature off, message encryption and mail flow rules; DLP and auto-labeling from simulation to enforcement with the exception register; audit and the synthetic events; drift between two exports with the change tickets that explain it, the metrics and the evidence chain; and a runbook for test and production. Each chapter builds on tested code in the repository's examples folder, runs a lab against fixtures with no tenant, then a step in a test tenant, and lists the verified facts, the federal requirements and evidence, the dangers and a checklist."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-information-protection
listing:
  - id: chapters
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Building Information Protection {.unnumbered}

*A developer workbook for the information protection implementation guide*

::: {.callout-important appearance="default"}
## Status: draft, awaiting review
All nine chapters are written and wait for the owner's review. Chapter 09, the deployment runbook, hasn't been run against a live tenant. Every Microsoft fact was checked on Microsoft Learn, on November 11, 2026 for Book 20 and on November 24, 2026 for the pages this workbook adds, and the verification log is in the repository. The code is illustrative: its tests pass against fictional fixtures and stand-in runners, and it has not been run against a production tenant. No narrated tours exist yet.
:::

The [information protection implementation guide](../../../books/guides/information-protection-implementation.md) builds [Book 20](../../../books/b20-information-protection/index.md) in twelve gates, from the data classes and the inventory through labels, Rights Management, message encryption, DLP, auto-labeling, audit and AI data security to operations. Each gate says what done looks like and gives a read-only Validate command from Learn. It doesn't build the software that runs those reads every month, compares them with the agency's plan, notices what changed and keeps the evidence.

This workbook builds that software. It is code first. Each chapter starts from the guide's Validate step and the Book 20 procedure behind it. It then walks through the code in [`examples/information-protection`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/information-protection) that runs the reads at tenant scale, with tests. Each chapter has two labs:

- **Lab 1** runs on a laptop against a fictional tenant, with no tenant at all.
- **Lab 2** is a short step in a test tenant, with a way to back it out.

Each chapter also lists the facts the code depends on, footnoted to Learn, the federal requirement the step supports with its KSI and what the ISSO keeps, the dangers, and a checklist.

The target is a civilian agency at FedRAMP Moderate in Microsoft 365 GCC. The kit runs in PowerShell 7 and uses three shells, one at a time:

- **Security & Compliance PowerShell and Exchange Online PowerShell**, from the ExchangeOnlineManagement module. Both connect the same way in Microsoft 365 and in GCC.
- **The AIPService module**, for the Rights Management configuration.

It writes nothing to the tenant. Two of the guide's Validate steps stay manual:

- **SharePoint tenant settings.** In PowerShell 7, Learn documents the SharePoint module only through Windows PowerShell 5.1 compatibility.
- **DSPM for AI.** It has no read cmdlet.

## The pieces and how they connect

The agency's plan and registers, and a monthly export of the tenant, feed seven checks. Two exports a month apart feed the drift check, with the change list that explains them. Every run becomes a hashed, chained evidence record.

| Chapter | Guide gates | Kit |
|---|---|---|
| [01 Access and the read path](01-access-and-the-read-path.md) | G1, G10 | `Invoke-IpAccess.ps1`; `config/calls.json` |
| [02 The baseline export](02-the-baseline-export.md) | G12 | `Export-IpBaseline.ps1` |
| [03 The data inventory](03-the-data-inventory.md) | G1 | `Invoke-IpInventory.ps1` |
| [04 Labels, policies and containers](04-labels-policies-and-containers.md) | G2, G3, G4 | `Invoke-IpLabels.ps1` |
| [05 Rights Management and message encryption](05-rights-management-and-message-encryption.md) | G5, G6, G7 | `Invoke-IpProtection.ps1` |
| [06 DLP and auto-labeling](06-dlp-and-auto-labeling.md) | G8, G9, G11 | `Invoke-IpDlp.ps1`, `Invoke-IpAutoLabel.ps1` |
| [07 Audit and the synthetic events](07-audit-and-the-synthetic-events.md) | G10, G11 | `Search-IpSyntheticEvents.ps1`, `Invoke-IpAudit.ps1` |
| [08 Drift, metrics and the monthly evidence run](08-drift-metrics-and-the-monthly-evidence-run.md) | G12 | `Invoke-IpDrift.ps1`, `Invoke-IpMonthlyRun.ps1`, `Invoke-IpEvidence.ps1` |
| [09 Deploying to test and production](09-deploying-to-test-and-production.md) | G12 | `deploy/` |

: Chapters, the gates they serve and the kit {.striped .hover}

**What the kit reads, and what it doesn't.** It reads the configuration that decides protection: the labels and their rights, the policies that publish them, the modes of DLP and auto-labeling, the Rights Management and mail settings, audit, and the role groups. It doesn't read content or user activity. The exceptions are the content explorer counts in Chapter 03 and the synthetic-event search in Chapter 07, which reads only the test user's events.

## Before you start

- PowerShell 7.1 or later and Pester 5 for Lab 1; nothing else.
- For Lab 2, a test tenant, never production. Use an account that holds the read roles in `config/calls.json` through PIM, with PowerShell 7.6 for ExchangeOnlineManagement 3.10 or later, and AIPService 3.1.0.0 or later.
- The fixtures are fictional (`contoso.example`). Your own plan, registers and exports stay inside the agency's boundary ([the kit's README](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/information-protection/README.md#your-inputs-stay-at-work)).

## Chapters

::: {#chapters}
:::
