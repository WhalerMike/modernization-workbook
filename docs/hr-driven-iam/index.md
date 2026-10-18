---
title: "HR-Driven Identity"
subtitle: "From the HR System of Record to Entra ID — how hire, transfer, and separation records become accounts, access, and evidence"
description: "One series for HR-driven identity in a federal civilian agency: why the HR system of record is the source of authority, the Federal HR 2.0 program, attribute authority, the API-driven provisioning pipeline, one canonical attribute schema, joiner-mover-leaver with Lifecycle Workflows, credentials and certificates, attribute-derived access, drift and evidence, the phased execution plan, and an illustrative reference deployment."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: hr-driven-iam
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
lifecycle_review: 2027-01-01
---

# HR-Driven Identity: From the HR System of Record to Entra ID {.unnumbered}

::: {.callout-important appearance="default"}
## Status — Draft series
This series consolidates what used to be nine separate pages on HR-driven identity (two execution plans, a vendor-neutral lifecycle guide, three reference-deployment write-ups, a whitepaper, an architecture note and a dynamic-group library) into one ordered reading sequence, and adds a chapter on credentials and certificates. It's a **draft**. Program facts about Federal HR 2.0 are dated and change; check them at engagement time.
:::

::: {.callout-tip}
## Download the full series
**[hr-driven-iam-bundle.docx](../../downloads/hr-driven-iam-bundle.docx)** — every chapter concatenated into one Word document. Regenerated on every site deploy.

One chapter at a time: [00](../../downloads/hr-driven-iam-00.docx) · [01](../../downloads/hr-driven-iam-01.docx) · [02](../../downloads/hr-driven-iam-02.docx) · [03](../../downloads/hr-driven-iam-03.docx) · [04](../../downloads/hr-driven-iam-04.docx) · [05](../../downloads/hr-driven-iam-05.docx) · [06](../../downloads/hr-driven-iam-06.docx) · [07](../../downloads/hr-driven-iam-07.docx) · [08](../../downloads/hr-driven-iam-08.docx) · [09](../../downloads/hr-driven-iam-09.docx) · [10](../../downloads/hr-driven-iam-10.docx) · [11](../../downloads/hr-driven-iam-11.docx)
:::

An agency's identity platform can prove, cryptographically and at every hop, that a claim was signed by the party allowed to sign it. It can't tell you whether the claim is *true*: whether the person behind the credential still works for the agency, still holds the position the access was granted for, still reports to the supervisor who approved it. That is an employment fact, and it lives in exactly one system: the human capital system of record.

This series is about wiring that system to Microsoft Entra ID so that accounts, access, and their removal become *consequences* of HR records rather than tickets. It's written for a federal civilian agency in the commercial Microsoft cloud at GCC-Moderate / FedRAMP Moderate, receiving its HR data from the government-wide Federal HR 2.0 platform (Oracle Fusion Cloud HCM), and it stays source-agnostic wherever it can.

## Reading sequence

Chapters 00–02 make the case and set the context. Chapters 03–05 define the data: who owns which attribute and what it's called everywhere. Chapters 06–09 turn the data into lifecycle, credentials, access and evidence. Chapter 10 is the execution plan and Chapter 11 an illustrative deployment.

::: {#chapters}
:::

## How this series relates to other parts of the site

- **[SQL Server Identity Transformation, Book 07](../case-studies/sql-server-narrative/Book_07.md)** applies the attribute-to-access chain of Chapter 08 to SQL Server logins and database roles.
- **[SQL Server Identity Transformation, Book 10](../case-studies/sql-server-narrative/Book_10.md)** covers the move from AD CS to Microsoft Cloud PKI; Chapter 07 covers only the certificate steps of the leaver sequence.
- **[Federal Compliance Vol I Book 04](../compliance/Vol_I_Book_04_HRIT_Identity_Org_SSOT.md)** carries the control-closure argument (AC-2, IA-4, PS-4, PS-5, SI-12) for the same architecture.
- **[Client-Server to Hybrid-Cloud, Chapter 04](../client-server-to-hybrid-cloud/04-identity-transformation.md)** covers the move from the OU tree to attribute-driven structure.
- **[The AD → Entra ID Identity Modernization Guide](../operational-guides/identity/identity-modernization.md)** covers directory migration, the companion dimension to inbound provisioning.
