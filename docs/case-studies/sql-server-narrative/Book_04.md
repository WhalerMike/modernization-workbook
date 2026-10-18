---
title: "Book_04 — Arc as the Identity Bridge"
subtitle: "How the Azure Connected Machine Agent Gives the SQL Server Engine a Cloud-Native Identity"
description: "Arc is not an end state — it is the bridge. Before a SQL Server instance can accept Entra ID-issued tokens, the host must have a cloud-native identity, and that identity comes from the Azure Connected Machine agent. Describes what Arc provides (the ARM resource identity, the system-assigned managed identity, and the instance's Entra identity — an app registration with a Key Vault certificate on SQL Server 2022, the managed identity itself on SQL Server 2025), the architecturally-independent two-layer distinction between SQL engine Entra auth and OS-level Entra login, and the Arc deployment sequencing for SQL Server hosts."
doc-type: sql-server-narrative-book
audience: [Technical, Customer]
family: sql-server-narrative
series-order: 04
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
listing:
  - id: book-chapters
    contents:
      - "Book_04_CPT_*.md"
    type: table
    fields: [title]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
---

::: {.content-visible when-format="docx"}
# Book_04 — Arc as the Identity Bridge
:::

::: {.callout-note}
Without Arc, the SQL Server engine has no cloud-native identity; without that identity, there is nothing to anchor the instance's Entra identity — the managed identity on SQL Server 2025, or the app registration certificate the Arc agent installs on SQL Server 2022 — and no mechanism to accept Entra ID-issued tokens.[^b04-entra-sql][^b04-mi-2025][^b04-appreg-2022] This book explains exactly what Arc does and does not change — and why SQL engine Entra auth (Layer 1) must not be blocked on the domain unjoin that OS-level Entra login (Layer 2) requires.
:::

![What Azure Arc connects: the on-premises host, Azure Resource Manager and Microsoft Entra ID.](../../images/sql-server/diagrams/svg/book-04-arc-identity-bridge.svg){fig-alt="The Connected Machine agent on the on-premises host projects it into Azure Resource Manager; the Azure extension for SQL Server and the instance's Entra identity let the engine validate Entra tokens."}

::: {.callout-tip}
## Download this book
**[Book_04-bundle.docx](../../../downloads/Book_04-bundle.docx)** — every chapter of this book concatenated into one Word document. Regenerated on every site deploy.
:::

## Chapters

::: {#book-chapters}
:::

[^b04-appreg-2022]: Microsoft Learn, [Set up Microsoft Entra authentication with app registration — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/entra-authentication-setup-tutorial?view=sql-server-ver17).
[^b04-mi-2025]: Microsoft Learn, [Managed identity overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/managed-identity?view=sql-server-ver17).
[^b04-entra-sql]: Microsoft Learn, [Microsoft Entra authentication for SQL Server overview](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview?view=sql-server-ver17).

## Authoritative references

Checked 19 October 2026.

- [Prerequisites — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/prerequisites?view=sql-server-ver17)
- [Connected Machine agent network requirements](https://learn.microsoft.com/en-us/azure/azure-arc/servers/network-requirements)
- [Access Azure resources with managed identity on Azure Arc-enabled servers](https://learn.microsoft.com/en-us/azure/azure-arc/servers/managed-identity-authentication)
- [Set up Microsoft Entra authentication with app registration (SQL Server 2022)](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/entra-authentication-setup-tutorial?view=sql-server-ver17)
- [Set up managed identity and Microsoft Entra authentication (SQL Server 2025)](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/microsoft-entra-authentication-with-managed-identity?view=sql-server-ver17)
- [Managed identity overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/managed-identity?view=sql-server-ver17)
- [Enable Microsoft Entra authentication for SQL Server on Windows without Azure Arc](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/microsoft-entra-authentication-sql-server-enable-without-arc?view=sql-server-ver17)

::: {.callout-tip}
## Continue the series
[← Previous: Book 03 — Discovery](Book_03.md) · [Index](index.md) · [Next: Book 05 — The Login Migration →](Book_05.md)
:::
