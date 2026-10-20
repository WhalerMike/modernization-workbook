# Verification — Chapter 06, The Retain, Consolidate, Retire Decision

Checked October 20, 2026. Source: the existing page (former Book 02, Chapter 4) verified and upgraded in place. The original page had no footnotes; three were added.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Only retain instances and consolidation targets are migrated; normative per the engine-authentication decision | Opening | restated-as-design | Program decision (unchanged) |
| 2 | Retain: supported version or in-place path "to SQL Server 2022" | Three classifications | edited | "2022 or later" (Entra auth applies to 2022 and later: Learn, Entra authentication for SQL Server) |
| 3 | Consolidate-into-target and retire definitions | Three classifications | restated-as-design | Unchanged |
| 4 | Target: fewer modern SQL Server 2022 instances via stacking | Target-state options | edited | "2022 or 2025" (matches the existing figure); added verified constraint: Entra auth unsupported on failover cluster instances, supported on standalone and availability groups (Learn, Entra authentication for SQL Server) |
| 5 | Azure SQL MI: near-full compatibility PaaS, removes host and patching | Target-state options | verified / edited | Learn, SQL Server end of support options (MI "closely matches the features of an on-premises instance"; T-SQL differences; 32 TB combined limit) |
| 6 | Azure SQL Database / elastic pools for database-scoped workloads | Target-state options | verified / edited | Same page (cross-database queries, linked servers, Agent jobs may need changes) |
| 7 | Category 1 starting position; migrated in Book 05 | Target-state options | corrected | Renumbered to Chapters 07–08 and Chapters 11–12 |
| 8 | MI "natively Entra-integrated"; destination still Entra-only | Target-state options | verified / edited | Learn, Microsoft Entra-only authentication with Azure SQL (supported on SQL Database and MI; disables SQL authentication, including administrators) |
| 9 | Constraints: collation, version-locked vendor apps, compliance isolation, indivisible dependencies | What can't be consolidated | restated-as-design | Program assessment criteria (unchanged; converted to a list) |
| 10 | Constrained consolidation or retain | What can't be consolidated | restated-as-design | Unchanged |
| 11 | Identity dividend; consolidation gates the migration | The identity dividend | restated-as-design | Argument (unchanged); link to Runbook R02 added |
| 12 | Renumbering: "Books 03 through 10" → Chapters 07 through 22; "Book 03" → Chapters 07–08; "Book 05" → Chapters 11–12; "Chapter 1" → Chapter 03 | throughout | corrected | Brief map |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| In this chapter | In this chapter | kept |
| Opening | Opening | kept (renumbering) |
| The Three Classifications | The three classifications | edited (claim 2) |
| Target-State Options | Target-state options | edited (claims 4–8; options as a list) |
| What Cannot Be Consolidated | What can't be consolidated | kept (as a list) |
| The Identity Dividend | The identity dividend | kept (R02 link added) |
| "What Book 02 establishes — Chapter 4" | "What this chapter establishes" | kept |
| Diagram `book-02-ch04-retain-consolidate-retire` | Same position | kept; source edited: "Book 03 audit, then Books 04–06" → "Chapters 07–08 audit, then Chapters 09–15" |
| Diagram `book-02-ch04-target-state-options` | Same position | kept; source unchanged (its FCI and 2022/2025 statements verified) |
