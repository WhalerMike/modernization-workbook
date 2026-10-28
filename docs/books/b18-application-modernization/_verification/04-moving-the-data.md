# Verification — Chapter 04, Moving the Data: DB2 and Oracle to PostgreSQL or SQL Server

## Sources opened

All opened October 28, 2026: PostgreSQL versioning policy page and postgresql.org home page (latest releases); PostgreSQL 18 documentation pages "Date/Time Types" and "CREATE SEQUENCE"; Oracle Database 23ai SQL Language Reference pages "Data Types" and "Nulls"; AWS DMS User Guide pages "AWS DMS data validation," "Converting database schemas using DMS Schema Conversion," "Creating tasks for ongoing replication using AWS DMS" and "Using IBM Db2 for z/OS databases as a source"; AWS SCT User Guide pages "What is the AWS Schema Conversion Tool?" and "Using extension packs"; AWS Prescriptive Guidance pattern on SERIALLY_REUSABLE packages; Microsoft Learn (MCP tools) pages "SQL Server Migration Assistant," "What's new in SSMA for Db2," "Install SSMA for Db2 client," "What's new in SSMA for Oracle," "What is Microsoft Copilot in SSMA for Oracle?," "Sequence numbers," "Scheduler Agent Supervisor pattern" and "Implement the Transactional Outbox pattern by using Azure Cosmos DB"; Ora2Pg home and Features pages and its GitHub releases page. A web search for an AWS SCT end-of-support notice found none (only the separate DMS Fleet Advisor retirement). No manual checks were needed. Reference-implementation behavior is taken from the editor's description of `examples/app-modernization/` and stated only as what it does, with a link to Chapter 08.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | PostgreSQL 18 first released Sept 25, 2025, supported to Nov 14, 2030; PG 19 RC 1 Oct 15, 2026 | Target engine table | verified | postgresql.org versioning; home page |
| 2 | Five-year support per major version; PG 14 no fixes after Nov 12, 2026 | Target engine table | verified | postgresql.org versioning; home page |
| 3 | SQL Server 2025 (17.x), 2022, 2019 are SSMA targets, plus Azure SQL DB and MI | Target engine table; tools table | verified | Microsoft Learn, SSMA overview |
| 4 | Target-engine fit factors | Target engine table | restated-as-design | — |
| 5 | Oracle DATE stores year to second, no fractional seconds or time zone | Type mapping | verified | Oracle SQL Reference, Data Types |
| 6 | PostgreSQL `date` has no time of day; `timestamp without time zone` holds both | Type mapping | verified | PG 18 docs, Table 8.9 |
| 7 | Oracle NUMBER precision 1–38, scale −84 to 127 | Type mapping | verified | Oracle SQL Reference, Data Types |
| 8 | Oracle treats zero-length character value as null and recommends not relying on it | Type mapping | verified | Oracle SQL Reference, Nulls |
| 9 | PostgreSQL and SQL Server distinguish empty string from null | Type mapping | restated as consequence of #8; not separately footnoted (standard behavior of both engines) | — |
| 10 | DMS: non-"C" PK collation on PostgreSQL target changes sort order vs Oracle and validation fails | Type mapping | verified | DMS validation, Limitations |
| 11 | Both engines have sequences; neither guarantees gapless numbers (rollback, cache loss) | Type mapping | verified | PG CREATE SEQUENCE Notes; Microsoft Learn Sequence numbers, Limitations |
| 12 | Advance sequences past max migrated key; gapless business numbers need own counter | Type mapping | restated-as-design | — |
| 13 | AWS conversion of Oracle packages: `package$member` functions; package variables via `aws_oracle_ext` helper functions | Packages | verified | AWS Prescriptive Guidance pattern (converted code); SCT extension pack page |
| 14 | SSMA adds a schema of emulation functions to the target | Packages | verified (SSMA for Db2 extension pack adds a schema with tables, procedures and emulation UDFs) | Microsoft Learn, Install SSMA for Db2 |
| 15 | Emulation-schema calls tracked as technical debt | Packages | restated-as-design | — |
| 16 | Draft text "AWS's own guidance notes that its emulation doesn't reproduce every Oracle function" | Packages | removed (came from a search summary of a page not opened) | — |
| 17 | SCT sources/targets: Oracle 10.1+, Db2 LUW 9.1–11.5, Db2 z/OS 12 → PostgreSQL etc.; FedRAMP compliance statement | Tools table | verified | AWS SCT user guide |
| 18 | No SCT end-of-support notice found | Tools table | verified as negative search result | Web search; SCT user guide |
| 19 | DMS SC: built on SCT engine; paths incl. Oracle, Db2 LUW, Db2 z/OS (API/CLI only) → Aurora/RDS PostgreSQL; gen AI on those paths; cross-Region inference | Tools table | verified | DMS Schema Conversion page |
| 20 | DMS SC Region table lists no AWS GovCloud (US) Region | Tools table | verified (Region table read in full) | DMS Schema Conversion page |
| 21 | SSMA for Db2 sources: z/OS 9.0+, LUW 9.8+, Db2 for i 7.1+; current v10.6 | Tools table | verified | SSMA Db2 install; What's new |
| 22 | SSMA for Oracle v10.6; Copilot GA from v10.4; BYOK Azure OpenAI or Microsoft-managed endpoint with Entra ID (GA in 10.6); generated code must be reviewed, validated, tested | Tools table | verified | SSMA Oracle What's new; Copilot overview |
| 23 | Ora2Pg: GPL v3; Oracle, MySQL/MariaDB, SQL Server → PostgreSQL; v25.0 April 20, 2025; cost assessment; diff "for test purposes"; no DB2 | Tools table | verified | Ora2Pg site, Features; GitHub releases |
| 24 | Only AWS's tools (of those listed) convert DB2 to PostgreSQL | Tools discussion | verified by comparison of the table's sources | Rows 17–23 |
| 25 | AI-assisted conversion puts the model endpoint in the migration boundary | Tools discussion | restated-as-design | — |
| 26 | Three checks and their blind spots | Proving | restated-as-design | — |
| 27 | Reference implementation: per-table counts, order-independent SHA-256 after transform, independent SUM/COUNT-per-status reconciliation, `--since` delta mode | Proving; coexistence | restated as the reference implementation's behavior (per editor's brief), linked to Ch08 | — |
| 28 | DMS validation: row-by-row after full load; validates CDC changes; failures table; validation-only tasks for cut-over window | Proving | verified | DMS validation |
| 29 | DMS validation limits: PK/unique index; no views; no Oracle LONG; continuously modified rows; outside writes; stops above 10,000 failed/suspended | Proving | verified | DMS validation, Limitations |
| 30 | Validation report kept with cut-over decision | Proving | restated-as-design | — |
| 31 | Three cut-over strategies, their fit and risks; system of record during parallel run | Cutting over | restated-as-design | — |
| 32 | DMS CDC reads Oracle via LogMiner or binary reader; SQL Server via MS-Replication or MS-CDC | Coexistence | verified | DMS CDC page |
| 33 | DMS CDC "does not provide real-time replication"; no latency SLA; minutes or more | Coexistence | verified (quote) | DMS CDC page |
| 34 | Db2 for z/OS source: full load only; CDC not supported | Coexistence | verified | DMS Db2 z/OS source, Limitations |
| 35 | Dual writes "don't share a transaction" | Coexistence | verified (quote) | Azure Architecture Center, Scheduler Agent Supervisor |
| 36 | DMS bidirectional replication not "a full multi-master solution"; no conflict detection or resolution | Coexistence | verified (quote) | DMS CDC page |
| 37 | Transactional outbox saves the record and its event in one transaction and relays afterward | Coexistence | verified | Azure Architecture Center, Transactional Outbox |
| 38 | Draft text claimed Chapter 03 describes the outbox pattern | Coexistence | corrected (Chapter 03 doesn't; cited Microsoft's pattern page instead) | — |
| 39 | One writer per table; no app dual writes; reverse replication fallback; continuous validation | Coexistence | restated-as-design | — |
| 40 | SQL Server identity work is in Book 06 Ch12 and Ch19 | SQL Server target | verified against Book 06 chapter titles and descriptions | Workbook |
| 41 | SSMA supports Microsoft Entra authentication to the target | SQL Server target | verified (SSMA for Db2 v8.5) | SSMA Db2 What's new |
