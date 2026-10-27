# Verification — Runbook R02, Estate Discovery & the Consolidation Gate

File: `docs/books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md`
Source: the same file (former Implementation Companion Book 02)
Verified: 2026-10-20

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | 2027-04-01 "backstop … does not move" | Why this runbook runs first | restated-as-design: program planning anchor, not a Microsoft deadline (consistent with Chapters 02, 07, 14); added that NTLM is deprecated, NTLMv1 removed in Windows Server 2025, NTLMv2 to be removed in a future release with no date | learn.microsoft.com/windows-server/get-started/removed-deprecated-features-windows-server |
| 2 | Spec3-D1.8 discovers via "remote registry / AD" | 1a | corrected: discovers via MSSQLSvc SPNs (live AD query or D1.5 file) plus `-TargetServers`, then reads services over CIM `Win32_Service`; no registry enumeration in the code despite its synopsis | program source |
| 3 | Discovery-only D1.8 emits SQLVersion/SQLVersionMajor/SQLEdition/AuthenticationMode | 1a | corrected: those fields are populated only with `-QueryInstances`; `Unknown` otherwise | program source |
| 4 | Spec1-D1.5 gives a "forest-wide" SPN trail | 1a | corrected: queries one domain per run (`-DomainController`, `-SearchBase`) | program source |
| 5 | D1.5 `SPNs[]`/`Orphans[]` surface "instances generating Kerberos traffic with no SPN" | 1a | corrected: an AD query can't see traffic; `Orphans` = SPNs on disabled objects or objects with no logon in 180 days; `Duplicates` also emitted | program source |
| 6 | `Find-DbaInstance -ComputerName (hosts.txt)` "surfaces instances no inventory records" | 1b | corrected: with `-ComputerName` it scans only the listed hosts; example changed to `-DiscoveryType DomainServer, DataSourceEnumeration`; default scan excludes SqlConnect | dbatools.io/Find-DbaInstance |
| 7 | `setspn -T * -Q MSSQLSvc/*` is "forest-wide" | 1b | corrected: `-T *` without `-F` targets the current domain; added `-F` | learn.microsoft.com/windows-server/administration/windows-commands/setspn |
| 8 | Third instrument: Azure Migrate dependency analysis, MAP Toolkit, Data Migration Assistant | 1b, Lens 3 | corrected: DMA retired July 16, 2025; MAP Toolkit removed (no current Microsoft status page found; development end reported only by third parties); replaced by Azure Migrate discovery and assessment plus Arc migration assessment | dma-overview; migrate-services-overview; whats-happening-azure-data-studio |
| 9 | `New-FMPEstateInventory` parameters `-AuthAuditPath`, `-SpnInventoryPath`, `-FindInstancePath`, `-OutputPath`; dedup on host\instance; `discovered_by`; review never defaulted to retain | 1c | verified (program source); added `-ZombieThresholdDays` (default 400) | program source |
| 10 | Function "applies the gate" | 1c | corrected/qualified: automated pass uses only version and a last-access-days field; discovery-only input → nearly all `review`; Lens 3 and target choice are human judgment | program source |
| 11 | Output file names in the example (`sqlserver-auth-audit.json`, `kerberos-spn-inventory.json`) | 1c | corrected to the scripts' actual pattern `<prefix>_Spec<n>_D1.<n>_<name>_<domain>_<timestamp>` (prefix rendered FMP) | program source |
| 12 | Zombie = no connections in 400+ days; 4% of 16-core example | Lens 1 | restated-as-design (program threshold and illustrative example) | — |
| 13 | `sys.dm_db_index_usage_stats` gives a last-access signal | Lens 1 | verified with correction: counters reset at engine start; rows removed when a DB is detached/shut down; can't prove 400 days of disuse alone; added `sqlserver_start_time` query | sys-dm-db-index-usage-stats-transact-sql |
| 14 | `FROM EXTERNAL PROVIDER` requires SQL Server 2022 (v16+) | Lens 2 | verified | azure-ad-authentication-sql-server-overview |
| 15 | "Book 03 formalizes this as Category 3" | Lens 2 | corrected reference to Chapter 07 | Chapter 07 |
| 16 | (added) SQL Server 2025 can use the Arc MI for Entra auth | Lens 2 | verified | sql/sql-server/azure-arc/managed-identity |
| 17 | (added) Entra auth not supported on FCIs | Lens 2, Step 3 | verified | azure-ad-authentication-sql-server-overview |
| 18 | Linked-server query columns (`sys.servers` is_linked, data_source, product; `sys.linked_logins` uses_self_credential, remote_name) | Lens 3 | verified; added VIEW SERVER SECURITY STATE (2022+) and column meanings | sys-linked-logins-transact-sql |
| 19 | Azure SQL MI "natively Entra-integrated"; Azure SQL Database option | Step 3 | verified (Entra authentication supported for both) | azure-ad-authentication-sql-server-overview |
| 20 | "the program decision §1" / "the directory modernization program §3.2" | throughout | removed (de-branding residue); restated as "the program's consolidation-gate decision" | — |
| 21 | Network sweeps generate probe traffic IDS can flag | Safety | restated-as-design (operational advice) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | title, `doc-type`, `status`, `lifecycle_review` 2027-04-01; `subtitle` folded into description; `canon-source` removed |
| docx H1 block; Download callout (Book_02.docx) | removed | Word file not on the site |
| Companion note callout | edited | became thesis, "In this runbook" and "Pairs with" (Chapters 03–06) |
| The Phase-0 instrument callout | edited | "Narrative Book 02 Chapter 2" → Chapter 04; residue removed |
| Why this book runs before everything else | edited | claim 1; Book 06/09 → R06/R09; Books 03–10 → Runbooks R03–R10 |
| Step 1 intro | kept | — |
| 1a — What the shipped scripts already give you | edited | claims 2–5; illustrative-code warning added before first code block |
| 1b — The broader sweep | edited | claims 6–8 |
| 1c — Fuse the sources | edited | claims 9–11 |
| What the inventory must capture | kept | — |
| Step 2 intro | kept | — |
| Lens 1 — Utilization and zombie detection | edited | claim 13; query extended |
| Lens 2 — Version and end-of-life posture | edited | claims 14–17 |
| Lens 3 — Dependency mapping | edited | claim 18; Book 03 → R03, Book 08 → R08; DMA replaced |
| Step 3 — The gate (table, targets, constraints) | edited | table references renumbered; FCI added to constraints; claim 19 |
| Consolidation execution warning | kept | — |
| Feeding the rest of the series | edited | renumbered |
| Safety | edited | probe-traffic note added; renumbered |
| Closing italic footer | removed | duplicated the body; canon residue |
| — | added | "Continue the book" callout (R01 ← → R03) |

## Start Kit link, October 27, 2026

Checked October 27, 2026; no personal data sent to any site.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| S1 | Added "Run this step with the workbook's Start Kit" callout with the download, the command and what it reads and writes | 1c | added | examples/start-kit (PR in this change); tests/powershell, 118 Pester tests passing on Windows PowerShell 5.1 and PowerShell 7, Oct 27, 2026 |
| S2 | "The function is pure derivation" → "The program's function", so it can't be read as the kit's | 1c | clarified | — |
| S3 | `VIEW SERVER STATE`, and `VIEW SERVER PERFORMANCE STATE` on SQL Server 2022 and later, for the usage DMVs | Callout | verified | learn.microsoft.com/sql/relational-databases/system-dynamic-management-objects/sys-dm-db-index-usage-stats-transact-sql; .../system-dynamic-management-objects (permissions table), fetched Oct 27, 2026 |
| S4 | The kit's network signal sends [MC-SQLR] CLNT_UCAST_EX and parses SVR_RESP (0x05, two-byte length, `ServerName;…;InstanceName;…;IsClustered;…;Version;…;tcp;<port>;;`) | Kit only | verified | learn.microsoft.com/openspecs/windows_protocols/mc-sqlr/2e1560c9-5097-4023-9f5e-72b9ff1ec3b1, fetched Oct 27, 2026 |
