# Verification — Chapter 04, The Estate Inventory

Checked October 20, 2026. Source: the existing page (former Book 02, Chapter 2) verified and upgraded in place. `Find-DbaInstance` checked on dbatools.io (community tool; not Microsoft).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Inventory before change | Opening | verified (new support) | Learn, Microsoft Entra cloud-first identity guidance for IT architects |
| 2 | Estate discovery vs authentication audit (denominator) | Opening | restated-as-design | Program argument (unchanged) |
| 3 | Inventory fields (version, edition, build, OS, domain, service account, DB size, last access, recovery model, owner) | What the inventory must capture | restated-as-design | Program specification (unchanged) |
| 4 | Inventory is re-run, not a snapshot | What the inventory must capture | restated-as-design | Unchanged |
| 5 | Browser on UDP 1434; instances on TCP 1433 and dynamic ports | Discovery instruments | verified / edited | Learn, SQL Server Browser service (1433 default instance; named instances and Express dynamic by default; Browser claims UDP 1434); Learn, Configure the Windows Firewall |
| 6 | `Find-DbaInstance` combines SPN lookups, Browser, port scans, service enumeration across a range or domain | Discovery instruments | verified / edited | dbatools, Find-DbaInstance (discovery types DomainSPN, Domain, DataSourceEnumeration, IPRange; scan types Browser, SQLService, SPN, TCPPort, DNSResolve, Ping, SqlConnect). Added: community tool, goes through software approval (program design) |
| 7 | "Every instance that successfully negotiates Kerberos must register an `MSSQLSvc` SPN" | Discovery instruments | edited | Learn, Register an SPN: registered automatically at startup when permitted, else manually; wording now "has an SPN registered for it, by the engine or an administrator" |
| 8 | Forest-wide query `setspn -Q MSSQLSvc/*` | Discovery instruments | corrected | Learn, Setspn: `-Q` alone queries the domain; forest-wide needs `-F` (with `-T`). Now `setspn -T <forest-root-domain> -F -Q MSSQLSvc/*`. Added: the trail misses instances whose registration failed |
| 9 | Stale SPN / Kerberos-without-SPN findings feed the audit | Discovery instruments | restated-as-design | Unchanged |
| 10 | Azure Migrate with dependency analysis enumerates instances and resource use at fleet scale | Discovery instruments | verified / edited | Learn, Discover installed software inventory… (SQL instance/DB discovery; config 24 h, perf 30 s); Learn, Dependency analysis (agentless TCP connection data; Azure Government supported; agent-based classic only) |
| 11 | MAP Toolkit enumerates instances | Discovery instruments | verified | Learn, Migrate from SQL Server: Pre-migration (MAP still listed for discovery) |
| 12 | Data Migration Assistant assesses per-DB compatibility | Discovery instruments | corrected | Learn, Overview of Data Migration Assistant: DMA retired July 16, 2025. Replaced by the SQL Server migration component in SSMS (Learn, Upgrade SQL Server using the migration component in SSMS) |
| 13 | Arc-enabled SQL Server produces a migration readiness assessment | Discovery instruments | verified (new) | Learn, Migrate with the link — Azure SQL Managed Instance |
| 14 | Tools useful independent of an Azure target decision | Discovery instruments | restated-as-design | Unchanged |
| 15 | "A canonical estate-discovery spec does not yet exist"; Phase 0 gap | Phase 0 section | corrected (internal consistency) | Runbook R02 (`r02-estate-discovery-and-consolidation-gate.md`) documents `New-FMPEstateInventory` as the shipped Phase 0 instrument that closes this gap. Section retitled "The Phase 0 discovery instrument"; history of the gap kept |
| 16 | Renumbering: "Book 03" → Chapters 07–08; "Chapter 3" → Chapter 05; "later books" → later chapters | throughout | corrected | Brief map |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| In this chapter | In this chapter | edited (Phase 0 closure) |
| Opening (2 paragraphs) | Opening | edited (claim 1, renumbering) |
| What the Inventory Must Capture | What the inventory must capture | kept |
| Discovery Instruments | Discovery instruments | edited (claims 5–14) |
| Why a Canonical Estate-Discovery Spec Does Not Yet Exist | The Phase 0 discovery instrument | edited (claim 15); the gap's history and the "naming the gap" argument kept |
| "What Book 02 establishes — Chapter 2" | "What this chapter establishes" | edited (point 3 updated) |
| Footnote `b02c02-spn` | `c04-spn` | kept; re-opened |
| Diagram `book-02-ch02-discovery-instruments` | Same position | kept; source edited: `setspn -Q` → `setspn -F -Q`; "Every instance ever set up for Kerberos" → "Every instance with a registered SPN, forest-wide"; "Azure Migrate, MAP, DMA" → "Azure Migrate, MAP, SSMS migration"; "Chapter 3" → "Chapter 05". fig-alt updated to match |
