---
title: "Book_09 — The Transformed Posture: Continuous Governance and the 2027 Milestone"
subtitle: "What Done Looks Like — Closure Conditions, Drift Detection, and the Network-Level NTLM Block"
description: "Transformations do not complete — they achieve a posture. Describes the operational steady-state of a fully transformed SQL Server estate, the five closure conditions for the SQL Server authentication transformation, how regression is detected through compliance drift events and behavioral telemetry, and the program's 2027-04-01 NTLM backstop in its proper context: not a completion date, but the date the network block is applied."
doc-type: sql-server-narrative-book
audience: [Technical, Customer]
family: sql-server-narrative
series-order: 09
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
listing:
  - id: book-chapters
    contents:
      - "Book_09_CPT_*.md"
    type: table
    fields: [title]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
---

::: {.content-visible when-format="docx"}
# Book_09 — The Transformed Posture: Continuous Governance and the 2027 Milestone
:::

::: {.callout-note}
A transformation that achieves a completed state and then stops monitoring is a transformation that will regress. The transformed posture is not a permanent state achieved by a one-time action — it is an ongoing condition maintained by continuous monitoring, automated drift detection, and a governance process that treats regression as a compliance violation.
:::

![The transformed posture is a loop that never stops.](../../images/sql-server/diagrams/svg/book-09-continuous-compliance-loop.svg){fig-alt="Every scheduled run audits the full estate, writes per-instance compliance records and compares them with the last run; any drift is a compliance violation that opens remediation and returns to the satisfied state."}

::: {.callout-tip}
## Download this book
**[Book_09-bundle.docx](../../../downloads/Book_09-bundle.docx)** — every chapter of this book concatenated into one Word document. Regenerated on every site deploy.
:::

## Chapters

::: {#book-chapters}
:::

**Place in the [dependency chain](series-overview.md#the-dependency-chain):** Step 9 — Demonstrate sustained posture.

## Authoritative references

Checked 19 October 2026.

- [Disable SQL Authentication — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/disable-sql-authentication?view=sql-server-ver17)
- [sys.dm_exec_connections (Transact-SQL)](https://learn.microsoft.com/en-us/sql/relational-databases/system-dynamic-management-views/sys-dm-exec-connections-transact-sql?view=sql-server-ver17)
- [Sign-in logs in Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-sign-ins)
- [Microsoft Defender for SQL servers on machines overview](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-sql-on-machines-overview)
- [SQL Server Audit (Database Engine)](https://learn.microsoft.com/en-us/sql/relational-databases/security/auditing/sql-server-audit-database-engine?view=sql-server-ver17)
- [CISA Zero Trust Maturity Model, Version 2.0](https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf)

::: {.callout-tip}
## Continue the series
[← Previous: Book 08 — The Application Chain](Book_08.md) · [Index](index.md) · [Next: Book 10 — Certificate Authority →](Book_10.md)
:::
