# Verification — Runbook R01, Prerequisites & Using This Companion

File: `docs/books/b06-data-platform/r01-prerequisites.md`
Source: the same file (former Implementation Companion Book 01, `docs/sql-server-implementation/Book_01.md`)
Verified: 2026-10-20

Internal tooling claims were checked against the program's source repository (`tools/discovery/`, `tools/powershell/`); those modules are published there under the program's original prefix and are rendered here with the `FMP` prefix.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Roster: every listed function exists (`New-FMPEstateInventory`, the three `Test-FMPArc*`, `Invoke-FMPArcOnboarding`, `New-FMPEntraLoginMapping`, `New-FMPEntraLoginScript`, `Test-FMPLoginParallelRun`, `New-FMPSpnRemediationPlan`, `Get-FMPNtlmGpoReport`, `New-FMPEntraGroupClassification`, `New-FMPGroupLoginScript`, `New-FMPAppConnectionPlan`, `New-FMPClosureRecord`, `Compare-FMPClosureRun`, `New-FMPSqlCertificatePlan`; `Export-FMPEntraGroups` in FMPIdentityAssessment; `New-FMPPKIMigrationPlan` in FMPPlanGenerators) | Roster table | verified (program source) | program repository, module function list |
| 2 | Spec scripts D1.4, D1.5, D1.7, D1.8, D1.9, D1.10 exist in `tools/discovery/` | Roster table | verified (program source) | program repository |
| 3 | Pester tests run under PowerShell 7 | Step 1 | verified (program CI workflow runs `shell: pwsh`) | program repository `.github/workflows/pester.yml` |
| 4 | Seal computed by stdlib Python (`json` + `hashlib`); package not imported | Step 1 | restated-as-design (program tooling) | — |
| 5 | Tooling lives in the program's repository, not in this workbook; `[tools/discovery/]` bracket links had no target | Intro | corrected (links removed; location stated) | — |
| 6 | Login and group script generators have no `-Server`/`-Execute` parameter | Step 3 | verified (program source: `-MappingPath`, `-OutputPath`, `-IncludeUnresolved`; `-ClassificationPath`, `-OutputPath`) | program repository |
| 7 | `Invoke-FMPArcOnboarding` declares `SupportsShouldProcess`, plans by default, executes only with `-Execute` + confirmation | Step 3 | verified (program source; ConfirmImpact High). Source said "defaults to a -WhatIf-style preview"; reworded to "plans unless -Execute and confirm" | program repository |
| 8 | "Sovereign clouds (GCC-Moderate / Azure Government)" resolve the cloud-correct audience | Step 3 | corrected: GCC-Moderate isn't an Azure cloud; module accepts `AzureCloud` and `AzureUSGovernment` (the agent's `--cloud` values also include `AzureChinaCloud`); GCC uses Entra public and Azure Government subscriptions can't be associated with a public directory | azcmagent-connect; documentation-government-plan-identity |
| 9 | `azcmagent show -j` emits agent status as JSON | Step 4 | verified | azcmagent-show |
| 10 | "an IMDS token" | Step 4 | corrected to "a captured managed-identity token response" (Arc uses its own local identity endpoint; see R04) | — |
| 11 | "the `[api]` extra" for Graph/ARM writes | Step 1 | removed (program packaging detail with no meaning outside the repository) | — |
| 12 | Provenance: "the directory modernization program Transformation #7; the program decision ×4" | Provenance, footer | removed (de-branding residue with no resolvable reference); restated as the narrative decisions in Chapters 06 and 09 | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | title to `Runbook R01 — …`; `doc-type` to `workbook-chapter`; `status` to `draft`; `lifecycle_review` 2027-01-01 → 2027-04-01; `subtitle` folded into the description; `canon-source` removed (de-branded path that resolves nowhere) |
| docx-only H1 block | removed | replaced by a normal H1 |
| "Download this book" callout (Book_01.docx) | removed | the Word file doesn't exist on the site; this page is the runbook |
| Companion note callout | edited | became thesis line, "In this runbook" callout and the "Pairs with" line (Chapters 01–02) |
| What this companion automates (roster) | edited | "Book NN" column → linked Runbook RNN; location of tooling stated |
| Step 1 — Install the toolchain | edited | module comments renumbered; illustrative-code warning added before the first code block |
| Step 2 — The evidence model | kept | Book 09 → Runbook R09 |
| Step 3 — The safety model | edited | cloud sentence corrected (claim 8) |
| Production safety warning | kept | heading shortened (GCC-Moderate/FedRAMP parenthetical dropped; the content is unchanged) |
| Step 4 — Offline / snapshot pattern | edited | claim 10 |
| Step 5 — The run order | edited | Books 02–10 → linked Runbooks R02–R10 |
| Provenance | edited | claim 12 |
| Safety | kept | renumbered references |
| Closing italic footer | removed | duplicated the roster; its canon line was residue (claim 12) |
| — | added | "Continue the book" callout (previous: Chapter 23; next: R02) |
