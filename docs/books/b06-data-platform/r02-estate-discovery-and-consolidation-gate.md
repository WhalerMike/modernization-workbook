---
title: "Runbook R02 — Estate Discovery & the Consolidation Gate"
description: "How to assess and consolidate a twenty-year SQL Server estate before any login is touched: the discovery the audit family provides (Spec3-D1.8 instance enumeration, the Spec1-D1.5 MSSQLSvc SPN trail), the broader Find-DbaInstance, setspn and Azure Migrate sweep, the three rationalization lenses, and New-FMPEstateInventory, which fuses the sources into one deduplicated inventory and applies the retain / consolidate / retire gate. Discovery is read-only; consolidation execution is review-required."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 102
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Runbook R02 — Estate Discovery & the Consolidation Gate

*Count everything first, decide what survives second, and spend the authentication migration only on what survives.*

::: {.callout-note}
## In this runbook
The Phase 0 discovery and rationalization runbook. It builds the estate inventory from three kinds of instrument, applies three rationalization lenses (utilization, version, dependencies), and classifies every instance retain, consolidate or retire. Discovery is read-only and runs first. The consolidation it leads to, database moves and instance retirement, is review-required and belongs to the program's migration plan, not to this runbook.
:::

**Pairs with:** [Chapter 03 — The Shape of Twenty Years](03-the-shape-of-twenty-years.md), [Chapter 04 — The Estate Inventory](04-the-estate-inventory.md), [Chapter 05 — Rationalization](05-rationalization.md) and [Chapter 06 — The Retain, Consolidate, Retire Decision](06-retain-consolidate-retire.md). Those chapters explain why you assess and consolidate before you migrate; this runbook is how.

::: {.callout-note}
## The Phase 0 instrument
[Chapter 04](04-the-estate-inventory.md) names the Phase 0 denominator as a gap: the authentication audit (`Spec3-D1.8`, [Runbook R03](r03-the-authentication-audit.md)) measures the authentication posture of instances that are already known, but estate discovery runs earlier and casts wider to establish the **denominator**. The program closes that gap with `New-FMPEstateInventory` (`tools/powershell/FMPSqlServerMigration/` in the program's repository), which fuses the discovery outputs into one deduplicated inventory and applies the retain / consolidate / retire gate. The individual instruments below remain the sources it consumes.
:::

## Why this runbook runs before everything else

Effort is finite, and the program's 2027-04-01 NTLM backstop ([Runbook R06](r06-ntlm-detection-and-remediation.md), [Runbook R09](r09-continuous-monitoring-and-closure.md)) doesn't move. That date is the program's own planning anchor, not a Microsoft deadline: Microsoft has deprecated NTLM, removed NTLMv1 from Windows Server 2025, and says NTLMv2 will be removed from Windows Server in a future release, without a published date ([Chapter 02](02-why-the-inheritance-must-end.md)).[^r02-ntlm-deprecated] Migrating the logins of an instance only to retire it three months later is wasted work measured against a fixed date. The program's consolidation-gate decision makes the sequencing normative: classify every instance **retain**, **consolidate into a target**, or **retire** *before* any login is touched. Only **retain** instances and the **consolidation targets** enter the authentication migration that Runbooks R03 to R10 describe.

The deliverable of this runbook is one row per instance with that classification, justified by the three rationalization lenses. Everything downstream operates on the surviving set.

## Step 1 — Build the estate inventory (read-only)

The defining property of a twenty-year estate is that the inventory doesn't already exist in complete form. The instances that matter most are the ones nobody is managing, so they have to be *discovered*, not retrieved from a list. No single instrument finds every instance. Combine three, each blind to what the others surface.

### 1a — What the program's discovery scripts give you

Two pieces of the sweep are backed by the program's scripts in `tools/discovery/`:

- **`Spec3-D1.8-Get-SQLServerAuthAudit.ps1`** finds instances from their `MSSQLSvc` SPNs (a live Active Directory query) and from an explicit `-TargetServers` list, then reads each host's SQL Server services over CIM (`Win32_Service`) to record the engine, Agent, SSRS, SSIS and SSAS service accounts. It emits `ServerName`, `InstanceName`, `Port`, `DiscoveryMethod` and the service-account fields. `SQLVersion`, `SQLVersionMajor`, `SQLEdition` and `AuthenticationMode` are filled in only when the script connects to the instance (`-QueryInstances`); in discovery-only form they read `Unknown`. Run it here in its discovery-only form (no `-QueryInstances`) to seed the inventory; [Runbook R03](r03-the-authentication-audit.md) is where you run the deep audit on the *surviving* set.
- **`Spec1-D1.5-Get-KerberosSPNInventory.ps1`** gives the domain's SPN trail, including every `MSSQLSvc` SPN: every instance registered for Kerberos, including hosts that are otherwise off the radar. Run it once per domain (it takes `-DomainController` and `-SearchBase`). Its `Duplicates` and `Orphans` arrays surface duplicate SPNs and SPNs registered on disabled objects or on objects with no logon in 180 days, typically decommissioned hosts. Both are consolidation-relevant findings.

::: {.callout-warning}
## Illustrative, not tested against your estate
The commands and queries in this runbook are illustrative. They haven't been tested against a production forest or SQL Server estate. Review them, run them first in a test environment, and coordinate network sweeps with your security operations team before you run them.
:::

```powershell
# Read-only inventory seed from the audit script and the SPN trail.
# Each writes JSON and CSV named FMP_Spec<n>_D1.<n>_<name>_<domain>_<timestamp>.* under -OutputPath.
./Spec3-D1.8-Get-SQLServerAuthAudit.ps1 -OutputPath .\output          # instances (no -QueryInstances)
./Spec1-D1.5-Get-KerberosSPNInventory.ps1 -OutputPath .\output        # SPN trail for the current domain
```

### 1b — The broader sweep (the wider denominator)

The program's scripts find instances that have an SPN or that you already name. They don't find a SQL Server Express instance that an application installer dropped on an application server. Cast wider with the general-purpose instruments [Chapter 04](04-the-estate-inventory.md) names.

`Find-DbaInstance` from the open-source dbatools module scans only the computers you give it when you pass `-ComputerName`; to find hosts nobody listed, give it a discovery type instead. `DomainServer` finds every enabled Windows Server computer in Active Directory, `DataSourceEnumeration` uses the same UDP broadcast that SQL Server Management Studio uses, and `IPRange` sweeps subnets. The default scan types probe each candidate (TCP port, SQL Browser, SPN, service and DNS checks) without logging in to SQL Server.[^r02-dbatools]

```powershell
# Network and directory sweep: surfaces instances no inventory records.
Find-DbaInstance -DiscoveryType DomainServer, DataSourceEnumeration |
    Export-Csv .\output\estate-find-dbainstance.csv -NoTypeInformation

# Forest-wide SPN trail (an independent signal; cross-check against the Spec1-D1.5 output).
# -T * targets the current forest when combined with -F; without -F the query covers only the current domain.
setspn -T * -F -Q MSSQLSvc/* > .\output\estate-spn-trail.txt
```

The `setspn` query modifiers are `-F` (query at forest rather than domain level), `-T` (the target domain or forest, with `*` meaning the current one) and `-Q` (query for existing SPNs).[^r02-setspn]

Microsoft's migration-assessment tooling is the third instrument. Azure Migrate's discovery and assessment tool and the migration assessment in SQL Server enabled by Azure Arc capture workload, dependency and compatibility data the first two can't, and they're useful here for what they reveal about the estate regardless of any decision to land on Azure.[^r02-azure-migrate][^r02-ads] The Data Migration Assistant that older guidance names was retired on July 16, 2025, so don't plan around it.[^r02-dma]

### 1c — Fuse the sources into one inventory: `New-FMPEstateInventory`

No single instrument finds every instance, and run side by side they double-count the ones they all see. `New-FMPEstateInventory` is the program's Phase 0 instrument that fuses them. It reads the `Spec3-D1.8` discovery output and, optionally, the `Spec1-D1.5` SPN trail and a `Find-DbaInstance` export. It keys every instance on host and instance name, so the same instance seen by several instruments deduplicates, and it records a `discovered_by` set so coverage is auditable. It then applies a first-pass gate (Step 3) to each instance and emits a sealed, reproducible inventory envelope: the **denominator** the rest of the series operates on.

```powershell
Import-Module ./tools/powershell/FMPSqlServerMigration

# Fuse the discovery outputs, classify, and emit the sealed estate inventory.
New-FMPEstateInventory `
    -AuthAuditPath    .\output\FMP_Spec3_D1.8_SQLServerAuthAudit_<domain>_<timestamp>.json `
    -SpnInventoryPath .\output\FMP_Spec1_D1.5_SPNInventory_<domain>_<timestamp>.json `
    -FindInstancePath .\output\estate-find-dbainstance.csv `
    -OutputPath       .\output\estate-inventory.json
```

::: {.callout-tip}
## Run this step with the workbook's Start Kit
The workbook's own read-only implementation of steps 1a to 1c is in the Start Kit: [start-kit.zip](../../../downloads/start-kit.zip), or [examples/start-kit on GitHub](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit). One command reads the MSSQLSvc SPNs of every domain in the forest, the computer objects and service accounts that suggest SQL Server, and, with `-ProbeNetwork`, the SQL Browser on each host they found (or `Find-DbaInstance` when dbatools is installed). It counts each instance once, records which sources saw it and whether they agree, and applies the first-pass gate described below:

```powershell
Import-Module .\powershell\FMPSqlEstate
Invoke-FMPSqlEstateDiscovery -OutputPath D:\Assessment\sql -ProbeNetwork -ProbeAllServers -QueryInstances
```

`-QueryInstances` adds the read-only T-SQL pass: version, edition, authentication mode, logins by type, databases, last use and linked servers, under a login with `VIEW SERVER STATE` (`VIEW SERVER PERFORMANCE STATE` on SQL Server 2022 and later). The output, `SqlEstate.csv` and `SqlEstate.json`, uses the audit's field names and adds counts by version, edition, domain and authentication mode. It's illustrative: unit-tested against fixtures, not proven against a live estate.
:::

The program's function is pure derivation over the read-only discovery output: it reads no live host or directory and changes nothing. Its `classification` counts (retain, consolidate, retire, review) and its `denominator` are the gate's headline numbers. Know what the automated pass can and can't see:

- It classifies on two signals only: the engine version and a last-access age in days. An instance with a last-access age at or above `-ZombieThresholdDays` (default 400) is classified retire; a pre-2022 engine is classified consolidate; a SQL Server 2022 or later engine is classified retain.
- An instance whose signal is insufficient lands in **review**, never silently in retain. Discovery-only `Spec3-D1.8` output carries no version, so on its own almost every instance lands in review. Supply versions (from the R03 deep audit) and last-access ages (from Lens 1) to get a meaningful first pass.
- The dependency lens (Lens 3) and the choice of consolidation target are human judgment the function doesn't make. Treat its output as a first pass that the architects confirm or override, with the reason recorded.

### What the inventory must capture

For every instance: version, edition and build (support and licensing posture), host operating system (Arc and upgrade envelope), domain-join state and owning domain (the forest-entanglement picture), and the service-account identity and its source domain. For every database: size, **last-access timestamp**, recovery model and owning application (the utilization and zombie picture). Like the audit it precedes, the inventory is **re-run, not snapshotted**: instances appear and disappear across a multi-month assessment.

## Step 2 — Apply the three rationalization lenses (read-only)

An inventory establishes what exists; rationalization establishes what each item is worth keeping. Apply three lenses to every instance and database, and combine them. No single lens decides.

### Lens 1 — Utilization and zombie detection

Capture sustained and peak CPU, memory, storage and connection counts per instance; per database, the last-access timestamp, recent query workload and backup-restore history. A database with **no connections in 400 or more days**, no restores consumed and a retired owning application is a **zombie**: the cleanest retirement candidate, and the fastest way to shrink the migration surface. Every login it carries, including long-forgotten SQL-authenticated service accounts with valid passwords, leaves the pipeline before it enters it. Utilization also rightsizes survivors: an instance at 4% of a 16-core Enterprise license is a consolidation source, not a retain.

The index-usage DMV is a useful last-access signal, with one limit you must account for: its counters are initialized to empty whenever the Database Engine starts, and a database's rows are removed when it's detached or shut down (for example by `AUTO_CLOSE`).[^r02-index-usage] It can therefore show recent use, but it can't prove 400 days of disuse unless the instance has been running that long. Read the engine start time alongside it, and take the long-horizon evidence from login auditing, backup history and the application portfolio.

```sql
-- How far back do the usage counters reach?
SELECT sqlserver_start_time FROM sys.dm_os_sys_info;

-- Per-database last-access signal since that time. A database with no row hasn't been
-- read or written through an index since the start time. Combine with backup history
-- and the application portfolio before judging.
SELECT  DB_NAME(database_id)      AS database_name,
        MAX(last_user_seek)       AS last_seek,
        MAX(last_user_scan)       AS last_scan,
        MAX(last_user_lookup)     AS last_lookup,
        MAX(last_user_update)     AS last_update
FROM    sys.dm_db_index_usage_stats
GROUP BY database_id
ORDER BY database_name;
```

### Lens 2 — Version and end-of-life posture

The `CREATE LOGIN ... FROM EXTERNAL PROVIDER` syntax the whole transformation depends on needs **SQL Server 2022 (16.x) or later** on premises.[^r02-entra-sql] An earlier engine can't accept Microsoft Entra logins, whatever else changes; [Chapter 07](07-the-authentication-audit.md) calls this Category 3. Read it off the R03 audit fields once the deep audit has run: `SQLVersionMajor` and the computed `MigrationTarget` already say "upgrade to SQL 2022 + Arc" for pre-2022 instances. For most aged instances the right answer isn't "upgrade in place" but "consolidate the surviving workload onto a modern target and retire the old engine," which also reclaims core licenses.

Two platform facts shape the target choice. On SQL Server 2025 the engine can use the Arc server's system-assigned managed identity for Entra authentication, so a new consolidation target built on 2025 avoids the app registration and certificate that SQL Server 2022 needs ([Runbook R04](r04-arc-deployment-and-managed-identity.md)).[^r02-sql-mi] And Entra authentication isn't supported on SQL Server failover cluster instances, so a clustered workload consolidates onto a standalone instance or an availability group, or carries an exception.[^r02-entra-sql]

### Lens 3 — Dependency mapping

This is the lens that most often overturns a naive plan. An instance that looks idle by connection count may be the silent target of a linked-server chain, replication, an SSIS package or a quarterly cross-database query. Map these *before* moving anything:

```sql
-- Linked-server web (often cross-domain): the forest-entanglement signal.
-- SQL Server 2022 and later require VIEW SERVER SECURITY STATE to read sys.linked_logins.
SELECT  s.name AS linked_server, s.data_source, s.product,
        ll.uses_self_credential, ll.remote_name
FROM    sys.servers AS s
LEFT JOIN sys.linked_logins AS ll ON ll.server_id = s.server_id
WHERE   s.is_linked = 1;
```

`uses_self_credential = 1` means the session passes its own credentials to the linked server; `0` means a stored remote login (`remote_name`) is used, with a password that SQL Server stores but doesn't expose.[^r02-linked-logins] Cross-reference the `LinkedServers` array from the [Runbook R03](r03-the-authentication-audit.md) audit, the SQL Server Agent job inventory, the replication configuration and the SSIS, SSRS and SSAS footprint. Azure Migrate dependency analysis and the Arc migration assessment supplement the in-engine views. This lens is also the bridge to [Runbook R08](r08-application-chain-and-connection-strings.md): the upstream LDAP-bound applications it surfaces are exactly what `Spec3-D1.9` inventories there.

## Step 3 — The retain / consolidate / retire decision (the gate)

The three lenses resolve to one classification per instance. The program's consolidation-gate decision makes it the normative prerequisite: engine-layer authentication migration runs only on **retain** instances and on the **consolidation targets** that absorb consolidated workloads.

| Classification | Meaning | Enters authentication migration? |
|---|---|---|
| **retain** | Load-bearing; supported version or a clear path to SQL Server 2022 or later; no dependency argues for collapse | **Yes**: proceeds to the [R03](r03-the-authentication-audit.md) audit and Arc eligibility |
| **consolidate into a target (source)** | The workload migrates to a modern target, then the source is retired | No: the *target* is migrated, not the source |
| **retire** | Zombie, or the owning application is decommissioned | **No**: no login ever enters the pipeline |

Target-state options for absorbing consolidated workloads: SQL Server 2022 or later on an Arc-enabled host (the Category 1 starting position that [Runbook R03](r03-the-authentication-audit.md) audits and [Runbook R05](r05-login-migration-and-parallel-run.md) migrates), Azure SQL Managed Instance, or Azure SQL Database and elastic pools, both of which support Microsoft Entra authentication natively.[^r02-entra-sql] Choose the target *during* the assessment, so authentication is migrated **once, in final shape**, on the target, not twice.

Record the constraints honestly: collation conflicts, version-locked vendor applications, compliance-isolation requirements, failover cluster instances, and indivisible cross-instance dependency clusters each convert an apparent consolidation candidate into either constrained consolidation (a dedicated, not shared, target) or retain in place. Recording the constraint is what makes the plan executable rather than aspirational.

::: {.callout-warning}
## Consolidation execution is review-required
Discovery and rationalization are read-only. The execution they justify (moving databases, retiring instances, collapsing cross-domain identity into Entra-backed identity at the target) changes production. Sequence it through the program's migration plan and change control; this runbook stops at the classified inventory that gates that work.
:::

## Feeding the rest of the series

The classified inventory is the surface that Runbooks R03 to R10 operate on. The forest-spanning identity sprawl (cross-domain logins, orphaned SPNs in collapsing domains, shared service accounts) is resolved once, at the target, rather than re-pointed instance by instance. That is why the program makes this decision the gate: the authentication transformation is spent only on the estate that survives.

## Safety

Every script and query in this runbook reads; none changes a security posture. `Spec3-D1.8` in discovery-only form and `Spec1-D1.5` read Active Directory and host service configuration; `Find-DbaInstance`, `setspn -Q` and the DMV queries are inventory reads; and `New-FMPEstateInventory` derives over their captured output without touching anything live. Network sweeps do generate probe traffic that intrusion detection can flag, so schedule them with security operations. Changes to production security posture begin in [Runbook R04](r04-arc-deployment-and-managed-identity.md) (Arc) and [Runbook R05](r05-login-migration-and-parallel-run.md) (logins), and only on the **retain** and **target** set this runbook defines.

::: {.callout-tip}
## Continue the book
[← Previous: Runbook R01 — Prerequisites & Using This Companion](r01-prerequisites.md) · [Book index](index.md) · [Next: Runbook R03 — The Authentication Audit →](r03-the-authentication-audit.md)
:::

[^r02-ntlm-deprecated]: Microsoft Learn, "Features removed or no longer developed in Windows Server," Windows Server 2025, NTLM, <https://learn.microsoft.com/windows-server/get-started/removed-deprecated-features-windows-server> (accessed Oct 20, 2026).

[^r02-dbatools]: dbatools, "Find-DbaInstance," <https://dbatools.io/Find-DbaInstance> (accessed Oct 20, 2026).

[^r02-setspn]: Microsoft Learn, "setspn," <https://learn.microsoft.com/windows-server/administration/windows-commands/setspn> (accessed Oct 20, 2026).

[^r02-azure-migrate]: Microsoft Learn, "What is Azure Migrate?," integrated tools, <https://learn.microsoft.com/azure/migrate/migrate-services-overview> (accessed Oct 20, 2026).

[^r02-ads]: Microsoft Learn, "What's happening with Azure Data Studio," SQL Server assessment replaced by migration assessment with SQL Server enabled by Azure Arc, <https://learn.microsoft.com/sql/tools/whats-happening-azure-data-studio> (accessed Oct 20, 2026).

[^r02-dma]: Microsoft Learn, "Overview of Data Migration Assistant," <https://learn.microsoft.com/sql/dma/dma-overview> (accessed Oct 20, 2026).

[^r02-index-usage]: Microsoft Learn, "sys.dm_db_index_usage_stats (Transact-SQL)," remarks, <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-objects/sys-dm-db-index-usage-stats-transact-sql> (accessed Oct 20, 2026).

[^r02-entra-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server," <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Oct 20, 2026).

[^r02-sql-mi]: Microsoft Learn, "Managed identity for SQL Server enabled by Azure Arc," <https://learn.microsoft.com/sql/sql-server/azure-arc/managed-identity> (accessed Oct 20, 2026).

[^r02-linked-logins]: Microsoft Learn, "sys.linked_logins (Transact-SQL)," <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-linked-logins-transact-sql> (accessed Oct 20, 2026).
