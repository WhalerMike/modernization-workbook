# Verification — Chapter 05, Rationalization: Utilization, Versions and Dependencies

Checked October 20, 2026. Source: the existing page (former Book 02, Chapter 3) verified and upgraded in place.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Three lenses drive the retain / consolidate / retire decision | Opening | restated-as-design | Unchanged |
| 2 | Utilization metrics per instance and per database | Utilization | verified (new support) / restated-as-design | Learn, Azure Migrate discovery (config daily, perf every 30 s); metric list is program design |
| 3 | Zombie definition; retiring zombies is the most effective surface reduction | Utilization | restated-as-design | Argument (unchanged) |
| 4 | 4% of a 16-core Enterprise license example | Utilization | restated-as-design | Illustrative (unchanged) |
| 5 | `FROM EXTERNAL PROVIDER` "requires SQL Server 2022" | Version posture | corrected | Learn, CREATE LOGIN: "available for Arc-enabled SQL Server 2022 and later versions"; Learn, Entra authentication for SQL Server (2022 and later; non-Arc setup also documented). Now "SQL Server 2022 and later" |
| 6 | Earlier versions "2019, 2017, 2016, or the out-of-support 2012 and 2008" | Version posture | corrected | 2016 and 2014 are also out of extended support (2016 since July 14, 2026; 2014 since July 9, 2024): Learn, SQL Server end of support options; Lifecycle, SQL Server 2016 |
| 7 | Category 3 classification | Version posture | verified (cross-reference) | Chapter 07 (renumbered from Book 03) |
| 8 | SQL 2012 is a security-update liability | Version posture | verified / edited | Lifecycle, SQL Server 2012: extended support ended July 12, 2022; ESU Year 3 ended July 2025 |
| 9 | "Upgrade in place to 2022 and then migrate" is usually wrong | Version posture | verified (new support) / restated-as-design | Learn, Upgrade SQL Server (2012–2019 → 2022 in place; 2008/2008 R2 need side-by-side or migration); Learn, Supported version and edition upgrades (SQL Server 2025) (from 2014 SP3+); "2022 or 2025" now named |
| 10 | Licensing dividend from consolidation | Version posture | restated-as-design | Unchanged |
| 11 | `sys.servers`, `sys.linked_logins` reveal linked-server web | Dependency mapping | verified | Learn, sys.linked_logins (row per linked-server login mapping; `server_id` from `sys.servers`) |
| 12 | Agent jobs, replication, SSIS/SSRS/SSAS footprint | Dependency mapping | restated-as-design | Unchanged |
| 13 | Azure Migrate dependency analysis and DMA compatibility findings | Dependency mapping | corrected | Learn, Dependency analysis (agentless); DMA retired July 16, 2025 (Learn, Overview of DMA) → SSMS migration component (Learn, Upgrade SQL Server using the migration component in SSMS) |
| 14 | Upstream apps, many LDAP-bound; bridge to application chain | Dependency mapping | restated-as-design | Unchanged; "Book 08" → Chapters 18–19 |
| 15 | Combined-picture examples | The combined picture | restated-as-design | Unchanged |
| 16 | Footnote `b02c03-entra-sql` was attached to a callout list item it didn't support | Callout | corrected | Moved into the Version posture prose where it supports the 2022+ claim |
| 17 | Renumbering: "Chapter 4" → Chapter 06; "Book 03" → Chapters 07–08; "Book 08" → Chapters 18–19 | throughout | corrected | Brief map |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| In this chapter | In this chapter | kept |
| Opening | Opening | kept (renumbering) |
| Utilization and Zombie Detection | Utilization and zombie detection | edited (claim 2) |
| Version and End-of-Life Posture | Version and end-of-life posture | edited (claims 5–9) |
| Dependency Mapping | Dependency mapping | edited (claims 11–14) |
| The Combined Picture | The combined picture | kept |
| "What Book 02 establishes — Chapter 3" | "What this chapter establishes" | edited (version point added; stray footnote removed) |
| Footnotes `b02c03-create-login`, `b02c03-entra-sql` | `c05-create-login`, `c05-entra-sql` | kept; re-opened |
| Diagram `book-02-ch03-rationalization-lenses` | Same position | kept; source edited: "From Chapter 2" → "From Chapter 04"; "(Book 08)" → "(Chapters 18–19)" |
