---
title: "Book_03 — Discovery: The Authentication Audit"
subtitle: "the authentication audit script, the Arc-Eligibility Classification, and the Compliance-Monitoring Telemetry Sink"
description: "No migration survives contact with an estate it has not measured. Describes the authentication-audit script (`the authentication audit script`) discovery instrument — what it captures (instances, authentication mode, login types, service accounts, SPN registration), the three-category Arc-eligibility classification that drives migration sequencing, and how its output feeds the compliance-monitoring pipeline as a living compliance record rather than a point-in-time spreadsheet."
doc-type: sql-server-narrative-book
audience: [Technical, Customer]
family: sql-server-narrative
series-order: 03
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
listing:
  - id: book-chapters
    contents:
      - "Book_03_CPT_*.md"
    type: table
    fields: [title]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
---

::: {.content-visible when-format="docx"}
# Book_03 — Discovery: The Authentication Audit
:::

::: {.callout-note}
Where Book 02 measured the estate to decide what survives, this book measures the **authentication posture** of what remains. `the authentication audit script` is the instrument, the Arc-eligibility classification is its most consequential output, and the per-instance compliance record — not a spreadsheet — is its deliverable.
:::

![What the authentication audit reads on each instance, and where its output goes.](../../images/sql-server/diagrams/svg/book-03-audit-inputs-and-record.svg){fig-alt="On every retained instance the audit reads the version, edition and host OS, the authentication mode, every login by type, the engine service account and SPN, and linked servers; it produces a per-instance compliance record and an Arc-eligibility category, both sent to compliance monitoring."}

::: {.callout-tip}
## Download this book
**[Book_03-bundle.docx](../../../downloads/Book_03-bundle.docx)** — every chapter of this book concatenated into one Word document. Regenerated on every site deploy.
:::

## Chapters

::: {#book-chapters}
:::

## Authoritative references

Checked 19 October 2026.

- [sys.server_principals (Transact-SQL)](https://learn.microsoft.com/en-us/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql?view=sql-server-ver17)
- [sys.dm_exec_connections (Transact-SQL)](https://learn.microsoft.com/en-us/sql/relational-databases/system-dynamic-management-views/sys-dm-exec-connections-transact-sql?view=sql-server-ver17)
- [Change server authentication mode](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/change-server-authentication-mode?view=sql-server-ver17)
- [Register a Service Principal Name for Kerberos connections](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/register-a-service-principal-name-for-kerberos-connections?view=sql-server-ver17)
- [Overview of NTLM auditing enhancements in Windows 11, version 24H2, Windows Server 2019, and later versions (Microsoft Support)](https://support.microsoft.com/en-us/servicing/os/windows/2025/07/overview-of-ntlm-auditing-enhancements-in-windows-11-version-24h2-and-windows-server-2025)

::: {.callout-tip}
## Continue the series
[← Previous: Book 02 — The Estate Itself](Book_02.md) · [Index](index.md) · [Next: Book 04 — Arc as the Identity Bridge →](Book_04.md)
:::
