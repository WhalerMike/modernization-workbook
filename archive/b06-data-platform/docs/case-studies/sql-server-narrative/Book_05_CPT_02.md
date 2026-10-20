---
title: "What the Engine-Authentication Decision Settles"
doc-type: sql-server-narrative-chapter
audience: [Technical, Customer]
family: sql-server-narrative
book: "05"
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 2 — What the Engine-Authentication Decision Settles

*The five governance positions that turn the migration pattern into enforceable canon.*

::: {.callout-note}
## In this chapter
The five decisions the engine-authentication decision records — that consolidation gates auth migration, that the parallel-run sequence is required, that SQL Authentication is eliminated and `sa` disabled and renamed, that pre-2022 instances are upgrade-or-except with a Certificate-Based Authentication interim posture, and that the per-instance compliance record is the closure artifact.
:::

![The five positions of the engine-authentication decision, in operational order, ending in the closure record.](../../images/sql-server/diagrams/svg/book-05-ch02-five-decisions.svg){fig-alt="Five decisions in order: consolidation gates migration, parallel run required, SQL authentication eliminated with sa disabled and renamed, pre-2022 instances upgraded or excepted, and the per-instance compliance record as the closure artifact."}

Chapter 1's pattern covers the engineering case, Windows logins migrated through `FROM EXTERNAL PROVIDER`,[^b05c02-create-login] but leaves governance positions that need a decision, not a narrative. The SQL Server engine-authentication decision (currently proposed) is the engine-layer companion to the Kerberos/NTLM-elimination program (protocol layer) and the Arc non-domain-join requirement (server and OS layer). It answers all five positions, in operational order.

## Decision 1 — Consolidation Precedes and Gates Auth Migration

::: {.callout-tip title="Established in Book 02"}
Every instance is classified retain, consolidate-into-target, or retire before any migration work; Arc-eligibility Categories 1–3 are layered on top.
:::

The decision makes that assessment the normative prerequisite for this book. Only retain instances and consolidation targets are migrated; migrating logins on instances about to be retired or collapsed is wasted effort. Consolidating into fewer SQL Server 2022 or later targets, Azure SQL Managed Instance, or Arc-enabled SQL is also the natural moment to retire cross-domain login sprawl, orphaned SPNs, and shared service accounts.

## Decision 2 — The Parallel-Run Sequence Is Required

On every retain or target instance, Windows logins (type U users, type G groups) and SQL Authentication logins (type S) migrate to Entra external-provider logins through Chapter 1's parallel run, which is required for production. The letters are the values of `sys.server_principals.type`, not mnemonics: **S** SQL login, **U** Windows login, **G** Windows group, **E** external (Entra) login.[^b05c02-principals] There is no type `W` — a discovery query written against one returns zero rows and reports a clean instance, which is how a typo becomes a false attestation of closure.

Non-production instances may compress the 30-day observation window only with documented owner sign-off. Disable-and-observe keeps every cutover reversible inside the window, so a wrong mapping locks no one out.

## Decision 3 — SQL Authentication Eliminated; sa Disabled and Renamed

Every active type-S login on a retain or target instance migrates to a service-principal or managed-identity login, or carries a documented exception with a named compensating control and a sunset date. Open-ended retention is not an option: SQL Authentication is invisible to Conditional Access and Defender for Identity.[^b05c02-ca]

`sa` is disabled and renamed on every production instance. Any retained emergency recovery is a documented, monitored break-glass procedure, not an active `sa`. An enabled `sa` with a non-rotated password is the authentication audit's highest-priority finding.

## Decision 4 — Pre-2022 Instances Are Upgrade-or-Except

External-provider logins require SQL Server 2022 or later with the Azure extension on an Arc-enabled host, so a pre-2022 Category 3 instance cannot accept them regardless of Arc status.[^b05c02-arc-sql] A Category 3 retain instance either upgrades and follows the Category 2-to-1 pathway or files a sunset-dated exception, though most Category 3 instances should be retire or consolidation candidates. An exception records the reason, the compensating control (for example, an identity-protection product that applies MFA or block policies to Kerberos and NTLM at the domain controller),[^b05c02-silverfort] the maximum duration, and acknowledgement that the 2027-04-01 NTLM block is network-level and ignores engine-layer exceptions.

Connections that cannot reach Kerberos or Entra OAuth by that date use Certificate-Based Authentication, the authorized interim posture, which makes the ADCS-to-Cloud-PKI transformation (Not Yet Defined in the transformation inventory) a hard dependency for the exception long tail.

## Decision 5 — The Per-Instance Compliance Record Is the Closure Artifact

An instance is closed when its compliance record simultaneously shows SQL authentication refused (`LoginMode = 1`; on SQL Server 2025, Disable SQL Authentication as well), zero active type-S logins outside the exception registry, zero active type-U or type-G logins, `sa` disabled and renamed, the Arc Connected Machine agent enrolled and healthy, the Azure extension for SQL Server deployed with Entra authentication configured, and — for human principals — Conditional Access MFA enforcement satisfied for SQL Server resource sign-ins over a defined validation period.[^b05c02-auth-mode][^b05c02-arc-servers][^b05c02-disable-sql]

"Done" becomes a queryable posture instead of a claim. Because no engine setting blocks Windows authentication, the record evidences the Entra-exclusive posture rather than reading a mode switch (Book 09). Closure is continuously verified: the authentication audit runs on a schedule, and drift (`LoginMode` reverting, a new type-S, U, or G login, the Arc agent going offline) is a violation that triggers remediation.

::: {.callout-note title="What Book 05 establishes — Chapter 2"}
1. Consolidation gates migration, and the parallel run is required in production.
2. SQL Authentication is eliminated and `sa` disabled and renamed; pre-2022 instances upgrade or carry a sunset-dated exception.
3. The per-instance compliance record is the continuously re-verified closure artifact.
:::

[^b05c02-create-login]: Microsoft Learn, [CREATE LOGIN (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-login-transact-sql?view=sql-server-ver17).
[^b05c02-principals]: Microsoft Learn, [sys.server_principals (Transact-SQL)](https://learn.microsoft.com/en-us/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql?view=sql-server-ver17).
[^b05c02-ca]: Microsoft Learn, [What is Conditional Access?](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview).

[^b05c02-silverfort]: Third-party source (vendor case study), Silverfort, [Customer case study: preventing NTLM-based lateral movement with Silverfort](https://www.silverfort.com/blog/customer-case-study-preventing-ntlm-based-lateral-movement-with-silverfort/). Cited as an example of the control category, not an endorsement.
[^b05c02-arc-sql]: Microsoft Learn, [Overview — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/overview?view=sql-server-ver17).
[^b05c02-disable-sql]: Microsoft Learn, [Disable SQL Authentication — SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/disable-sql-authentication?view=sql-server-ver17).
[^b05c02-arc-servers]: Microsoft Learn, [Azure Arc-enabled servers overview](https://learn.microsoft.com/en-us/azure/azure-arc/servers/overview).
[^b05c02-auth-mode]: Microsoft Learn, [Change server authentication mode](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/change-server-authentication-mode?view=sql-server-ver17).
