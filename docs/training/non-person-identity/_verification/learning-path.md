# Verification — Learning path: Non-Person Identity in Microsoft Entra ID

Files: `docs/training/non-person-identity/index.md` and its twelve modules, `01-inventory.md` to `12-service-account-migration.md` (Module 12 added November 9, 2026; see its section below).
Example code: `examples/non-person-identity` (with `deploy/` for Module 11), and `examples/drift-pipeline` for Module 10.
Verified: 2026-11-02

Method:
- The path adds no new facts. Every fact a module states is carried by link from the non-person identity implementation guide (`docs/books/guides/non-person-identity-implementation.md`) or the developer workbook *Building Non-Person Identity* (Chapters 01 to 11), and relies on those pages' own verification logs and footnotes. New writing is limited to the path, the module framing, objectives, unit glue, knowledge-check questions and time estimates.
- Workbook Chapter 11 (the deployment runbook) wasn't on `main` when the first ten modules were written. Module 11 was added for it on November 2, 2026. Chapter 11 is held for review and hasn't been run against a live tenant; Module 11 says so, and its Lab 2 is a pointer to the chapter's stages, not a lab anyone has run.
- Status update, November 20, 2026: Chapter 11 was approved on November 18, 2026, and Module 11 on November 20, 2026. Chapter 11 still hasn't been run against a live tenant, and Module 11 now says it is approved but not run. The line above records the status when the module was written.
- Each knowledge-check answer links the section that teaches it; the answer was checked against that section's text.
- Every Lab 1 command in the modules was run on November 2, 2026 (Windows 11, PowerShell 7.6.9 with Pester 5.9.0, Python 3.14.3, Git Bash) in scratch copies of `examples/non-person-identity`, with `examples/third_party` and `examples/drift-pipeline` beside it, in the order the modules give them. The output was compared with the workbook chapter's Lab 1 and with the kit's real output in `data/kit-captures/npi/`. All matched. `examples/drift-pipeline`'s pytest suite was run in the repository: 142 passed. Nothing was sent to a tenant.
- Lab 2 is a pointer to each chapter's Lab 2 and wasn't run, as the pages say.
- Time estimates are the program's planning figures *(design guidance)*, not measurements.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Lab 1 needs PowerShell 7.1 or later with Pester 5; Module 10 also needs Python 3.10 or later with pytest and PyYAML, and `sha256sum` | Path: What you need for the labs | carried | The Labs page's rows for Chapters 01 to 10, generated from each chapter's Lab 1 |
| 2 | Lab 2 needs a worldwide or GCC test tenant, never production; some add a subscription, a vault, a test domain or Workload ID Premium | Path; every module's Lab 2 | carried | Workbook Chapters 01 to 10, Lab 2 |
| 3 | The Lab 2 steps weren't run by the authors | Path; every module | carried | Workbook Chapters 01 to 10, Lab 2 |
| 4 | The workbook has no hosted sandbox | Path | design (statement about the workbook itself) | — |
| 5 | Each gate's requirements and KSIs | Every module's introduction | carried | The guide's Validate (G1) to (G6) steps, its AI agents section and its Evidence table |
| 6 | Each module's requirement table: the KSI for each control and the evidence file | Every module's introduction | carried | Workbook Chapters 01 to 10, Federal requirements and evidence |
| 7 | Each Lab 1 command's expected output, Modules 1 to 10 | Every module's Lab 1 | carried and re-run November 2, 2026; matched | Workbook Chapters 01 to 10, Lab 1; `data/kit-captures/npi/` |
| 8 | The full Pester suite passes 513 tests | Every module's last Lab 1 step | carried and re-run | `data/kit-captures/npi/01-7.txt` and the matching captures for each chapter; re-run in a full copy |
| 9 | Modules 2, 4, 8 and 9 add Chapter 01's (and, where the chapter needs it, Chapter 02's) run as step 1, so their step numbers are one ahead of the chapter's; each page says so | Modules 2, 4, 8 and 9, Lab 1 | design (module framing) | The chapters run the same command before their step 1 |
| 10 | In the orphan rule's apply run, the disables record `DisabledOn 2026-10-30` and the claim window ends `2026-11-29` | Module 2, Lab 1 | observed in the re-run; carried | Workbook Chapter 02, Lab 1; `out/orphan-apply/results.json` |
| 11 | CA001 stays `enabled` after the workload Conditional Access apply | Module 6, Lab 1 | observed in the re-run; carried (the chapter says "untouched") | Workbook Chapter 08, Lab 1 |
| 12 | Module 10's step 7 opens a second, POSIX shell at the repository root and runs `cd examples/drift-pipeline` | Module 10, Lab 1 | design (makes the folder change an exact command) | Workbook Chapter 10, Lab 1: steps 7 to 10 run in `examples/drift-pipeline` |
| 13 | Chapters 01 to 10 each have a narrated tour, linked from its module; Chapter 11 has none yet, as Module 11 says | Every module; path | carried | `docs/presentations/index.md`, Building Non-Person Identity chapter tours |
| 14 | The path's order (G4's Chapters 07 and 08 before G5's Chapters 05 and 06) and its eleven modules, with the runbook last | Path: Modules | design | The guide's gate order; the chapters' Lab 1 lengths; Chapter 11's steps each name their gate |
| 15 | Module 11's requirement table: each control, its KSI and the evidence record | Module 11, Introduction | carried | Chapter 11, Requirements, KSIs and evidence, and the step tables (change record, preflight, smoke test, Step 1.7, Step 1.8); no KSI ID added |
| 16 | Module 11's Lab 1 output: the template's placeholder error, preflight 12 Pass 1 Warn, smoke test 8 Pass, rollback plan 7 actions with SHA-256 2d365b30..., the unapproved hash refused, 7 WouldApply, production preflight 14 Pass with PF-11, evidence 4 of 9 rows and NO-GO, 55 Pester tests | Module 11, Lab 1 | carried and re-run November 2, 2026; matched | Chapter 11, Dry run on the kit's fixtures; `deploy/tests` |
| 17 | Module 11's Lab 1 splits the chapter's one dry-run block into steps, and adds the template check (step 1), the unapproved-hash refusal as its own command (step 5), the evidence-record listing (step 9, the chapter's pre-flight step 4 command on the dry run's folder) and the deploy tests (step 10) | Module 11, Lab 1 | design (module framing) | Chapter 11's text describes each result |

## Found during the re-run

- Module 11's step 10, run on November 3, 2026 in the same PowerShell session as steps 1 to 9, printed `PassedCount 54`, `FailedCount 1`: the end-to-end test "run preflight, smoke test and rollback end to end, and exit 0" checks `$LASTEXITCODE`, which step 8's exit code 1 leaves set. In a new session it printed 55 passed. Fixed in the test, not the page: the test now clears `$LASTEXITCODE` before it runs the scripts, and step 10 run in the same session after step 8 prints 55 passed.
- Module 11's step 1 and step 5 end in an error by design. In a non-interactive `pwsh -c` session, the step 5 refusal ends the session; pasted line by line, the shell carries on, as with Chapters 04, 06 and 09.
- The kit's Learn sample tests need `examples/third_party` beside `examples/non-person-identity`, and two `NpiDrift` tests read fixtures from `examples/drift-pipeline`. A learner with a full clone has both. A copy of the kit folder alone fails those tests. The pages don't need to say so, because the labs run in a clone.
- When the refusal in Chapters 04, 06 and 09 of an unapproved plan hash runs in a non-interactive `pwsh -c` session, the refusal ends that session with exit code 1. Pasted line by line, as the labs mean, the shell carries on. The chapters don't state the exit code, and the modules don't either.
- Chapter 10's Lab 1 doesn't say "Work in `examples/...`", because it uses two folders, so the generated command list names no folder. Module 10 keeps that, and adds the `cd` line to step 7.

## Kit follow-up (November 9, 2026)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| K1 | Module 3's Lab 1: `waves 1 (1, 1 HIGH), 2 (4, 1 HIGH)`, `D-NP4`, and wave 2 now holds `svc-intranet`, which Chapter 03's fixture re-platforms to a gMSA | Module 3, steps 3 and 6 | re-run November 9, 2026; matched | Chapter 03, Lab 1 |
| K2 | Module 8's Lab 1 makes Chapters 01 to 03's runs first and passes `-MatrixRun` and `-ProgramDatesPath`; its findings, plan, island list, dry run and refusal are pasted from that run (5 Finding, 1 Warn, 2 Info; 6 island rows, 4 ready; plan `e8fb8355…`). The knowledge check's questions 1 and 2 follow Chapter 03's rules: `KeepKerberos` ends by D08 with the authorizing official's acceptance and an SPN owner; `svc-webfront` is kept on Kerberos rather than blocked | Module 8, steps 1 and 4 to 9; Knowledge check | re-run November 9, 2026; matched | Chapter 06, Lab 1 |
| K3 | Module 6 names `D-NP5` in its enforcement step; Module 9 shows `D-NP6` and plan `5a800246…`; Module 6's sign-in summary hash is `da391f12…` | Modules 6 and 9 | matched against captures 08-6, 08-8, 09-5, 09-8 and 09-10, November 9, 2026 | Chapters 08 and 09, Lab 1 |
| K4 | Module 11 says Conditional Access is enabled ring by ring; its rollback plan hash is `0cb6515f…` | Module 11, description, Unit 2, step 4 and 5, Knowledge check | re-run November 9, 2026; matched | Chapter 11 |


## Learn gMSA coverage pass (November 9, 2026)

| # | Claim | Where | Verdict | Source |
|---|---|---|---|---|
| G1 | gMSA prerequisites now name one KDS root key for the forest, a forest-unique name and an interval set only at creation | Module 8, Unit 1 | verified November 9, 2026 | Non-Person Identity guide, Step 2 (Learn, Manage group Managed Service Accounts; Create gMSAs for Windows containers) |
| G2 | Optional reading: the service account guide's Migrations A and B | Module 8, Unit 1 | link added | — |

## Module 12: Migrate a service account (November 9, 2026)

Added at the program owner's request of November 9, 2026 for a training module for the guide *Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities* (`docs/books/guides/service-account-migration.md`). It joins this path as Module 12, a companion to Module 8, rather than a standalone module, because its lab is Chapters 06 and 05's kit and its prerequisites are Modules 3 and 8. It adds no gate, so its row in the index names no G number, and the guide's Validate boxes don't list it. The module adds no new facts: its units are reading lists of the guide's sections, which rely on the guide's own verification log (`docs/books/guides/_verification/service-account-migration.md`) and footnotes.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| M1 | The requirement table: each step's controls, KSIs and evidence | Module 12, Introduction | carried | The guide's "Federal requirements and evidence" table, rows A3/B1, A4, A6/B3, C1 to C4, Island |
| M2 | Lab 1, step 2: the 17 Learn sample tests, by name, all Passed | Module 12, Lab 1 | run November 9, 2026; matched | `tests/KerberosIslandSamples.Tests.ps1`; Chapter 06, Lab 1, step 1 (`PassedCount 17`) |
| M3 | Lab 1, steps 3 and 5: the Kerberos plan summary (plan `e8fb8355…`) and `DryRun: 4 WouldSend` | Module 12, Lab 1 | run November 9, 2026; matched | Module 8, steps 4 and 8; Chapter 06, Lab 1 |
| M4 | Lab 1, step 4: `CreateGmsa` for `svc-intranet` sends `New-ADServiceAccount` with a name, DNS host name, a hosts group and `AES256`; `CompleteDmsaMigration` for `svc-hrsync` sends the dMSA and the superseded account's DN, 40 days after it started | Module 12, Lab 1 | run November 9, 2026; observed in `kerberos-plan.json` | Chapter 06, "The check and the plan"; the guide's A3 and B3 |
| M5 | Lab 1, steps 6 and 7: the conversion plan summary (plan `5ec0a52c…`) and the eight conversions with their legacy credential, target and parallel run | Module 12, Lab 1 | run November 9, 2026; matched | Module 7, steps 3 and 6; Chapter 05, Lab 1 |
| M6 | `svc-intranet` runs an IIS application pool on INTRA01 and INTRA02 in Chapter 06's fixture and deploys the intranet site from GitHub Actions in Chapter 05's; `msa-print01$` is an sMSA | Module 12, Lab 1, steps 5 and 7 | observed in the fixtures | `kerberos-plan.json` reason; `tests/fixtures/ch05/conversions.json`; `tests/fixtures/estate.json` |
| M7 | The step-2 tests map to the guide's B1 (state step fails as published), B2 (one service restarted), A3 (AES256 added), A4 (a person's step on each host) and A7 (disable, not delete) | Module 12, Lab 1, step 2 | carried | The guide's Migrations A and B; the test names |
| M8 | Knowledge-check answers | Module 12 | checked against the linked sections | The guide's comparison, decision path, rules, Migrations A to C, Dangers |
| M9 | Time, 65 minutes; path total 12 hours 25 minutes | Module 12; index | design (planning figures) | — |

The Lab 1 commands were run on November 9, 2026 (Windows 11, PowerShell 7 with Pester 5.9.0) in a scratch copy of `examples/non-person-identity`, with `examples/third_party` and `examples/drift-pipeline` beside it, outside the repository; the full suite passed 513 tests in the same copy. Lab 2 is a pointer to the guide's Migration A and Chapter 06's Lab 2, and wasn't run.

*For project use.*

## Figures, November 22, 2026

Each figure is reused from the page named in its caption and carries that page's own verification; the caption restates what the figure shows, and was checked against this module's text.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 18 | Figure `b04-access/ch05-app-object-model` (reused) | Module 1, Unit 1 | carried | Book 04, Chapter 05 and its log |
| 19 | Figure `guides/npi-ownership-and-orphan-rule` (new): two technical owners, business approver, federal sponsor; owner's HR event starts a transfer 10 business days ahead; orphan reclassified Tier 1, disabled first, 30 days to claim, then retired | Module 2, Unit 2 | verified (Learn re-read Nov 22, 2026: an owner per service account, disable then delete); owners, sponsor, 10 days, Tier 1 and 30 days are program design (guide Step 6, Orphans, D-NP2; SA guide S9) | Learn, "Govern on-premises service accounts" (https://learn.microsoft.com/entra/architecture/service-accounts-govern-on-premises) |
| 20 | Figure `guides/service-identity-decision-path` (reused, from #699): questions 1 to 8, five targets plus the time-limited Keep/KeepKerberos exception, question 9 | Module 3, Unit 1 | carried | The NPI and service account guides and their logs (decision path fixed in #697) |
| 21 | Figure `guides/workload-credential-order` (new): managed identity, federation, vaulted certificate (new ones capped at 180 days), new client secrets blocked by app management policy, documented exception only | Module 4, Unit 2 | verified (Learn re-read Nov 22, 2026: passwordAddition, asymmetricKeyLifetime, managed identity credentials unreachable); order and exception rule from the guide's Steps 2 and 3 | Learn, "Configure app management policies" (https://learn.microsoft.com/entra/identity/enterprise-apps/configure-app-management-policies); "Securing managed identities" (https://learn.microsoft.com/entra/architecture/service-accounts-managed-identities) |
| 22 | Figure `b04-access/ch06-approval-chain-by-tier` (reused) | Module 5, Unit 2 | carried | Book 04, Chapter 06 and its log |
| 23 | Figure `guides/npi-workload-conditional-access` (new): single-tenant service principals assigned directly; not managed identities or multitenant apps; location and service principal risk; Block only; Workload ID Premium; report-only, 14-day review, CISO decision, enforce by ring | Module 6, Unit 3 | verified (Learn re-read Nov 22, 2026); 14 days, rings and D-NP5 are program design (workbook Chapter 08) | Learn, "Conditional Access for workload identities" (https://learn.microsoft.com/entra/identity/conditional-access/workload-identity); "Securing workload identities" (https://learn.microsoft.com/entra/id-protection/concept-workload-identity-risk) |
| 24 | Figure `guides/npi-federated-credential-exchange` (new, sequence): token exchange with exact, case-sensitive issuer, subject and audience match; wrong subject accepted at creation; AADSTS70021 while propagating; 30-day parallel run | Module 7, Unit 3 | verified (Learn re-read Nov 22, 2026); pre-checks and the 30-day run are program design | Learn, "Workload identity federation" (https://learn.microsoft.com/entra/workload-id/workload-identity-federation) and its considerations page |
| 25 | Figure `guides/gmsa-dmsa-and-the-kerberos-island` (new): one KDS root key per forest, retriever group, gMSA settings, dMSA conditions, disable after the 30-day run (gMSA deleted after 90 days by a person; an account superseded by a dMSA is never deleted, per #697), island table | Module 8, Unit 2 | verified (Learn re-read Nov 22, 2026); the gMSA OU and deletion rules are program decisions the guide records (WD-161, WD-167) | Learn, "Secure group managed service accounts" (https://learn.microsoft.com/entra/architecture/service-accounts-group-managed); dMSA overview |
| 26 | Figure `b17-ai-identity/ch04-agent-id-objects` (reused) | Module 9, Unit 1 | carried | Book 17, Chapter 04 and its log |
| 27 | Figure `b13-governance/ch06-drift-pipeline` (reused) | Module 10, Unit 2 | carried | Book 13, Chapter 06 and its log |
| 28 | Figure `developer-workbooks/deploy-test-to-production` (new): pre-flight, test stage, go/no-go, production in stages, evidence; no row counts | Module 11 | restated-as-design (no Learn page); worded to hold for all three runbooks (ADM 11 rows, NPI 9, PN 7) | Book 19, Chapter 10; NPI workbook Chapter 11; PN workbook Chapter 08 |
| 29 | Figure `guides/service-identity-decision-path` (reused, from #699) | Module 12, Unit 1 | carried | The service account guide and its log |
