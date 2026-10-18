---
title: "Book_11 — Epilogue: The Platform Question"
subtitle: "After the Authentication Transformation — Choosing a Platform per Data Domain"
description: "An epilogue to the ten-book SQL Server Identity Transformation series. Once the estate is rationalized and its authentication migrated, the platform question asks what to do with each retained data domain: stay on SQL Server or re-platform. The decision is made per data domain, after the forced authentication move, with the same parallel-run discipline."
doc-type: sql-server-narrative-book
audience: [Technical, Customer]
family: sql-server-narrative
series-order: 11
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

::: {.content-visible when-format="docx"}
# Book_11 — Epilogue: The Platform Question
:::

::: {.callout-note}
## An epilogue, not an eleventh migration step
Books 01–10 are the SQL Server Identity Transformation. This epilogue starts where they end: with a rationalized estate whose authentication has moved to Microsoft Entra ID. Nothing in Books 01–10 depends on it.
:::

::: {.callout-tip}
## Download this book
**[Book_11-bundle.docx](../../../downloads/Book_11-bundle.docx)** — this epilogue as one Word document. Regenerated on every site deploy.
:::

## The Fragmentation Cost

The authentication transformation produces a rationalized estate. The platform question asks what to do with that estate. Twenty years of accretion have produced overlapping instances, duplicated data domains, and no single authoritative source for any given subject. The goal is fewer authoritative platforms: one authoritative database per data domain.

## Three Destinations

![The three candidate destinations for a retained data domain.](../../images/sql-server/diagrams/svg/book-11-three-destinations.svg){fig-alt="Three candidate destinations — stay on SQL Server, re-platform to PostgreSQL, re-platform to Oracle — each evaluated on the same ten dimensions with evidence per data domain."}

Every retained data domain ends at one of three candidate destinations: stay on SQL Server, re-platform to PostgreSQL, or re-platform to Oracle. Each can satisfy the forced requirement — authentication that is observable and conditionable in the identity plane. This epilogue doesn't rank them. Which one fits depends on the data domain, so the decision is made with a framework rather than a verdict.

## Decision Framework

Score each candidate destination for each data domain on the same dimensions, and record the evidence behind each score:

| Dimension | Evidence required per data domain |
| --- | --- |
| Migration effort | Schema and code inventory (procedures, functions, triggers, jobs), conversion estimate, test scope |
| Application compatibility | Driver and connection-string support for every consuming application; vendor support statements |
| Operational maturity | Monitoring, patching, backup and runbook coverage the operating team already has for the platform |
| HA/DR fit | Required RPO and RTO against the platform's supported HA and DR topologies |
| Identity integration | How the platform authenticates to the chosen identity plane, verified in its own documentation |
| Licensing exposure | Current and projected license cost from the agency's own agreements |
| Portability | Dependence on platform-specific features; exit path |
| Data-domain consolidation opportunity | Which duplicate copies of the domain the move would retire |
| Required skills | Staff skills today, and the training or hiring the move needs |
| Switching cost | Parallel-run duration, dual-running cost, contract terms |

Two data domains can reach different answers, and that is normal. The goal is fewer authoritative platforms, not a single vendor.

## Decision Sequence

![The platform decision comes after the forced authentication move.](../../images/sql-server/diagrams/svg/book-11-decision-sequence.svg){fig-alt="Step 1 audit and rationalize, step 2 the forced authentication move on the retained set, step 3 choose a platform per data domain with the same parallel-run discipline."}

1. Audit and rationalize first (Books 02–03). Inventory every instance, surface silent NTLM fallback, and classify each instance retire, consolidate or retain.
2. Do the forced authentication move on the retained set (Books 04–06): Arc-enable, stand up Entra logins alongside Windows logins, cut over, retire the old logins.
3. Then make the platform choice per data domain. Re-platforming follows the same parallel-run discipline — establish the target, validate in parallel, cut over only after the validation window. Never drop before you observe.

::: {.callout-note title="What Book 11 establishes"}
1. The authentication transformation produces the inventory that scopes the platform decision.
2. The decision is made per data domain against a common set of dimensions and evidence, and two estates with two answers is normal.
3. The goal is fewer authoritative platforms, not a single vendor.
:::

**Place in the [dependency chain](series-overview.md#the-dependency-chain):** Epilogue, after step 9.

## Authoritative references

Checked 19 October 2026.

- [Migrate SQL Server Windows users and groups to SQL Managed Instance using T-SQL](https://learn.microsoft.com/en-us/azure/azure-sql/managed-instance/migrate-sql-server-users-to-instance-transact-sql-tsql-tutorial?view=azuresql)
- [Microsoft Entra authentication for SQL Server overview](https://learn.microsoft.com/en-us/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview?view=sql-server-ver17)
- [SQL Server enabled by Azure Arc — overview](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/overview?view=sql-server-ver17)

::: {.callout-tip}
## Continue the series
[← Previous: Book 10 — Certificate Authority](Book_10.md) · [Index](index.md) · [Next: Appendix A — Requirements Mapping →](Appendix_A_Requirements_Mapping.md)
:::
