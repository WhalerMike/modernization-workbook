---
title: "Book_10 — Certificate Authority: From ADCS to Microsoft Cloud PKI"
subtitle: "The Infrastructure Dependency Most SQL Server Transformation Documents Ignore"
description: "The transformation inventory classifies the ADCS-to-Microsoft Cloud PKI transformation as 'Not Yet Defined.' Documents why the SQL Server narrative cannot be complete without addressing certificate infrastructure: three distinct SQL Server capabilities — TLS encryption, certificate-mapped logins, and Certificate-Based Authentication as the Kerberos/NTLM-elimination program's NTLM-replacement interim posture — depend on ADCS-issued certificates. Analytical and motivational; cites no normative architecture decision because none has been authored."
doc-type: sql-server-narrative-book
audience: [Technical, Customer]
family: sql-server-narrative
series-order: 10
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
listing:
  - id: book-chapters
    contents:
      - "Book_10_CPT_*.md"
    type: table
    fields: [title]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
---

::: {.content-visible when-format="docx"}
# Book_10 — Certificate Authority: From ADCS to Microsoft Cloud PKI
:::

::: {.callout-warning}
This book documents a **"Not Yet Defined"** gap from the transformation inventory. The content is analytical and motivational — it identifies the dependencies, names the gap, and describes what the as-yet-unwritten ADCS-migration architecture decision must address. `Get-CertBasedAuthAudit.ps1` is the discovery instrument. Do not cite this book as normative governance for ADCS-migration decisions.
:::

![The three places SQL Server depends on ADCS-issued certificates.](../../images/sql-server/diagrams/svg/book-10-adcs-dependencies.svg){fig-alt="ADCS, being decommissioned, issues TLS server certificates, the certificates behind certificate-mapped type C logins, and the certificates for certificate-based authentication used as an interim posture."}

::: {.callout-tip}
## Download this book
**[Book_10-bundle.docx](../../../downloads/Book_10-bundle.docx)** — every chapter of this book concatenated into one Word document. Regenerated on every site deploy.
:::

## Chapters

::: {#book-chapters}
:::

## Authoritative references

Checked 19 October 2026.

- [Microsoft Cloud PKI for Microsoft Intune](https://learn.microsoft.com/en-us/intune/intune-service/protect/microsoft-cloud-pki-overview)
- [Microsoft Intune Government service overview](https://learn.microsoft.com/en-us/intune/fundamentals/government-service)
- [Encrypt connections by importing a certificate](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/enable-encrypted-connections-to-the-database-engine?view=sql-server-ver17)
- [CREATE LOGIN (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-login-transact-sql?view=sql-server-ver17)
- [Microsoft Entra certificate-based authentication overview](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-certificate-based-authentication)

::: {.callout-tip}
## Continue the series
[← Previous: Book 09 — The Transformed Posture](Book_09.md) · [Index](index.md) · [Next: Book 11 — Epilogue: The Platform Question →](Book_11.md)
:::
