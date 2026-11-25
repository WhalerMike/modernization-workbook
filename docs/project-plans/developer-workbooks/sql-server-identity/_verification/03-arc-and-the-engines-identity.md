# Verification — Chapter 03, Arc and the Engine's Identity

New material, written November 24, 2026. Code: `examples/sql-server-identity` (new in this change). Every Microsoft fact was read on Microsoft Learn on November 24, 2026 with WebFetch; the Book 06 citations it reuses (Chapter 09 `c09-arc-sql`, `c09-mi-2025`, `c09-appreg-2022`; Runbook R04 `r04-gov-identity`, `r04-entra-sql`) and Microsoft Automation Module 4's (`m4-argov`, `m4-azps`, `m4-hcmachine`) were re-read that day rather than carried.

Lab 1 was run by hand on November 24, 2026 on Windows 11, PowerShell 7 with Pester 5, from `examples/sql-server-identity`; the `text` blocks are that run's output, and `out/` was deleted afterwards. `scripts/kit_captures.py sql` makes the published captures.

## Claims log

| # | Claim (short) | Where | Source URL | Read | Result |
|---|---|---|---|---|---|
| 1 | Arc-enabled SQL Server supports SQL Server 2014 and later | Start with; Verified facts | <https://learn.microsoft.com/sql/sql-server/azure-arc/overview> | Nov 24, 2026 | verified (Supported configurations) |
| 2 | Entra authentication through Arc "requires SQL Server 2022 (16.x) or later" | Start with; Verified facts | same as 1 | Nov 24, 2026 | verified (quoted) |
| 3 | The Microsoft Entra Authentication setting is disabled by default, configured on the extension per instance | Start with; Verified facts | same as 1 | Nov 24, 2026 | verified (Settings table: "Disabled", "Extension per instance") |
| 4 | Entra authentication available for license-only, SA or subscription, and pay-as-you-go | Start with; Verified facts | same as 1 | Nov 24, 2026 | verified (license table) |
| 5 | SQL Server 2022: app registration, certificate in Azure Key Vault downloaded by the Arc agent; set from Microsoft Entra ID and Purview, Set Admin | Start with; Lab 2; Verified facts | <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial> | Nov 24, 2026 | verified |
| 6 | SQL Server 2025: system-assigned managed identity as primary managed identity, inbound and outbound; system-assigned only; Windows Server only; needs the Azure public cloud; disabling not advisable | Start with; Verified facts | <https://learn.microsoft.com/sql/sql-server/azure-arc/managed-identity> | Nov 24, 2026 | verified |
| 7 | Failover cluster instances don't support Entra authentication | Start with; Verified facts | <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> | Nov 24, 2026 | verified (also in the managed identity limitations) |
| 8 | Resource Graph needs at least read; "No results are returned" without it; data "isn't strongly consistent" | Start with; Verified facts | <https://learn.microsoft.com/azure/governance/resource-graph/overview> | Nov 24, 2026 | verified (quoted) |
| 9 | `Search-AzGraph -First` 1 to 1,000, default 100; `-SkipToken`; "keeping id in the results is mandatory to get back a skip token" | Start with; Dangers; Verified facts | <https://learn.microsoft.com/powershell/module/az.resourcegraph/search-azgraph> | Nov 24, 2026 | verified (parameters; Example 3 note) |
| 10 | Arc machine `status`: `Connected`, `Disconnected`, `Error`, `AwaitingConnection` | Start with; Verified facts | <https://learn.microsoft.com/rest/api/hybridcompute/machines/get> (2026-09-01) | Nov 24, 2026 | verified (StatusTypes) |
| 11 | "Office 365 and Office 365 GCC are paired with Microsoft Entra ID in Azure" | Start with; Verified facts | <https://learn.microsoft.com/azure/security/fundamentals/feature-availability#microsoft-365-integration> | Nov 24, 2026 | verified (quoted; only the GCC clause used) |
| 12 | WD-028 (Arc in a commercial subscription in the GCC tenant); WD-085 (commercial Azure) superseded by WD-155 | Start with | `docs/about/decision-register.md` (repository) | Nov 24, 2026 | verified in the repository |
| 13 | The snapshot's three queries, the cloud check and the category rules | The code | `Export-SqlArcSnapshot.ps1`, `SqlIdentity.psm1` `Get-SqlArcCategory` | Nov 24, 2026 | verified against the code and the `Chapter 03` tests (5 passed); the queries now project `id` and end `order by id asc`, and a named instance's Arc resource name `HOST_INSTANCE` becomes `HOST\INSTANCE` |
| 14 | Lab 1 outputs | Lab 1 | local run | Nov 24, 2026 | verified by running |
| 15 | Lab 2 | Lab 2 | — | — | not run (no test subscription). `Export-SqlArcSnapshot.ps1` now parses (PowerShell parser, no errors) |

## Book 06 against the kit

- Book 06, Chapter 07 defines Category 1 to include "the system-assigned managed identity is available". The kit reads the agent's status, the extension's state and the Entra setting, not the managed identity itself; R04's token check is where the identity is proved. The chapter says Category 1 still waits for R04's token and test-login checks.
- No other disagreement found between Chapters 09 and 10, R04 and the kit.

## Update after the kit's fixes (November 24, 2026)

Lab 1 was re-run on November 24, 2026, after the kit's fixes (89 Pester tests pass), with `python scripts/kit_captures.py sql`, which runs every Lab 1 command exactly as written, in order, in a scratch copy of `examples/`; each `text` block is now that run's output (Windows names keep their backslashes, which the capture writes as forward slashes). `examples/sql-server-identity/out` doesn't exist afterwards.

- **Cluster row.** SQLFCI04's `Agent` now reads `cluster: see its nodes`; the step 2 text and the cluster danger say so, and the old workaround ("read the node machines yourself because the check says `not installed`") is gone.
- **Paging.** The ">1,000 rows" danger now says the snapshot pages (every query projects `id` and sorts by it, as Microsoft Automation, Module 4 does), and Lab 2, step 2 still compares the machine count with the portal.
- **Named instances.** The snapshot table and Lab 2's `<instance-name>` placeholder say a named instance is `HOST\INSTANCE`, matching Chapter 02's snapshot.

## Federal requirements and evidence

Controls and KSIs are only the `ARC` step's in `config/requirements.json` (CM-8, CM-6, IA-5; KSI-PIY-GIV, KSI-SVC-ACM, KSI-IAM-SNU); no new pair. Claim language: "supports" and "provides evidence for", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
