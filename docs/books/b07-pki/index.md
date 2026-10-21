---
title: "Book 07 — PKI & Certificates"
subtitle: "AD CS to Cloud PKI, Entra CBA and Federal PKI: why certificates outlive every migration, what the target PKI is, who owns the certificate estate, and how to migrate and retire the old CAs"
description: "Book 07 of the Federal Modernization Workbook: why certificates outlive every migration, what AD CS holds up, hardening the CAs that stay, the target PKI of Cloud PKI, AD CS and Federal PKI, who owns the certificate estate, device and user certificates through Intune and Entra CBA, coexistence and migration, and lifecycle, monitoring and decommissioning."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: b07-pki
book: B07
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

# Book 07 — PKI & Certificates: AD CS to Cloud PKI, Entra CBA and Federal PKI {.unnumbered}

::: {.callout-important appearance="default"}
## Status — draft book
This book replaces the workbook's PKI Modernization Guide with one ordered book. Every external claim was checked against a primary source on October 20, 2026 and carries a footnote. The guide's PowerShell assessment module isn't reproduced here: it stays in the repository's [`archive/b07-pki/`](https://github.com/WhalerMike/modernization-workbook/tree/main/archive/b07-pki) folder, with the rest of the original guide, until it has had a technical review. The guide's old address forwards to this page.
:::

::: {.callout-tip}
## Download and present
**[b07-pki-bundle.docx](../../../downloads/b07-pki-bundle.docx)**: the whole book as one Word document, regenerated on every site deploy.

**15-minute presentation**: the Why / What / Who / How deck is on the [Presentations](../../presentations/index.md#book-07) page; its narrated, self-running edition is being recorded.
:::

Every other migration in this workbook changes which system answers "who is this?" Certificates are how that answer gets proved: domain controllers prove themselves with them, Wi-Fi and VPN trust devices because of them, servers encrypt with them, and PIV cards are them. They also run on their own clock. A certificate issued last year keeps working after the directory it came from is cut over, right up to the day it expires and finds nothing to renew it. That's why the PKI can't be retired on the directory's schedule. The target isn't one replacement for AD CS but four issuers, each serving the subjects only it can: Microsoft Cloud PKI for Intune-managed devices, a smaller and hardened AD CS for what still depends on Active Directory, the Federal PKI for PIV, and a public CA for names the internet must trust. One lifecycle platform keeps them owned and renewed. For this program that platform is CyberArk Certificate Manager (now part of Palo Alto Networks), because the program already has a CyberArk relationship and doesn't need a second certificate-lifecycle vendor.

## Why, what, who, how

| | Question | Chapters |
|---|---|---|
| **Why** | Why do certificates outlive every migration? | [01](01-why-certificates-outlive-every-migration.md) |
| **What** | What AD CS holds up today, how to harden what stays, and what the target PKI is | [02](02-what-ad-cs-holds-up.md), [03](03-hardening-what-stays.md), [04](04-the-target-pki.md) |
| **Who** | Who decides and who does the work for the certificate estate | [05](05-who-owns-the-certificate-estate.md) |
| **How** | Issue device and user certificates, run both PKIs through the migration, and keep the estate renewed and checkable until the old CAs retire | [06](06-device-and-user-certificates.md), [07](07-coexistence-and-migration.md), [08](08-lifecycle-monitoring-and-decommissioning.md) |

Appendices: [A — Cloud PKI and CBA deployment checklists](appendix-a-deployment-checklists.md) · [B — Certificate template migration matrix](appendix-b-template-migration-matrix.md)

## Reading paths

- **Executives (20 minutes):** Chapters 01, 04 and 05, or the 15-minute presentation.
- **Architects:** Chapters 01–05, then 07.
- **PKI, identity and endpoint engineers:** Chapters 02–03 and 06–08, with both appendices at hand.
- **Security operations and assessors:** Chapters 03, 05 and 08.

## Where this book sits in the workbook

This is Book 07 of the [Federal Modernization Workbook](../index.md). [Book 02 — Identity & Directory](../b02-identity/04-the-hidden-migration-surface.md) finds the PKI as one of the hidden dependencies on Active Directory. [Book 03 — HR-Driven Identity](../b03-hr-identity/09-credentials-and-certificates.md) covers PIV issuance and termination. [Book 05 — Devices & Endpoints](../b05-devices/index.md) covers the Intune certificate profiles, and [Book 06 — Data Platform](../b06-data-platform/22-where-sql-server-touches-adcs.md) covers where SQL Server depends on AD CS. For control-level depth on certificates, tokens and cryptographic identity, see the Federal Compliance book [Certificates, Tokens and Cryptographic Identity](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/compliance/Vol_I_Book_03_Certificates_Tokens_Cryptographic_Identity.md).

## Chapters

::: {#chapters}
:::
