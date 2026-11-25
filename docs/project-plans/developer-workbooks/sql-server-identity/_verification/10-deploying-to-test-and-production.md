# Verification — Chapter 10, Deploying to Test and Production

New material, written November 24, 2026. Code: `examples/sql-server-identity/deploy` (new in this change). Every Microsoft fact was read on Microsoft Learn on November 24, 2026 with WebFetch; the Book 06 citations it reuses (Runbook R05 `r05-sql-entra-tutorial`, `r05-alter-login`, `r05-disable-sql`; Appendix B `aB-lockout`; R08 `r08-entra-sql`) were re-read that day rather than carried.

This chapter is a runbook with no Lab 1 or Lab 2. Every `text` block is real output from the kit's dry runs, re-run on November 24, 2026 after the kit's fixes, in a scratch copy of `examples/sql-server-identity`, with the chapter's commands and these values for the placeholders: `<settings-test>` = `deploy/settings.test.example.json`, `<settings-production>` = `deploy/settings.production.example.json`, `<out-test>` = `out/test`, `<out-production>` = `out/production`, `<chain-path>` = `out/evidence/chain.jsonl`, `<instance-name>` = `SQLPRD01`, `<mapping-csv>` = `tests/fixtures/mapping/sqlprd01-mapping.csv`, the approved hashes from `plan.json`, `-AsOf 2026-12-20` for the seal; the AUDIT, ARC and PARALLEL runs from the day-1 and day-30 fixtures (the exporters need a live instance). Nothing was run with `-Apply`, and nothing against a live instance.

## Claims log

| # | Claim (short) | Where | Source URL | Read | Result |
|---|---|---|---|---|---|
| 1 | `ALTER ANY LOGIN` or `sysadmin` creates Entra logins; `sp_addsrvrolemember` by a `sysadmin` member | Before you start | <https://learn.microsoft.com/sql/sql-server/azure-arc/entra-authentication-setup-tutorial> | Nov 24, 2026 | verified |
| 2 | Disabling a `sysadmin` member needs `CONTROL SERVER`; disable doesn't end existing sessions; `DISABLE` can't deny a Windows group (error 15151, by design) | Before you start; step 10 | <https://learn.microsoft.com/sql/t-sql/statements/alter-login-transact-sql> | Nov 24, 2026 | verified |
| 3 | Token audience `https://database.windows.net/` | The token | <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> | Nov 24, 2026 | verified |
| 4 | `Invoke-Sqlcmd -AccessToken` takes a string or a `SecureString`; `-Encrypt` Mandatory/Optional/Strict, new in v22 | The token; Tools | <https://learn.microsoft.com/powershell/module/sqlserver/invoke-sqlcmd> | Nov 24, 2026 | verified |
| 5 | `az account get-access-token --resource` | The token; steps | <https://learn.microsoft.com/cli/azure/account#az-account-get-access-token> | Nov 24, 2026 | verified |
| 6 | `HAS_PERMS_BY_NAME(NULL, NULL, '<permission>')` checks a server permission for the caller | Step 4 | <https://learn.microsoft.com/sql/t-sql/functions/has-perms-by-name-transact-sql> | Nov 24, 2026 | verified |
| 7 | Disable SQL Authentication reversed in the portal under Azure RBAC | Rollback | <https://learn.microsoft.com/sql/sql-server/azure-arc/disable-sql-authentication> | Nov 24, 2026 | verified |
| 8 | Single-user mode: a local Administrators member connects as `sysadmin` | Rollback | <https://learn.microsoft.com/sql/database-engine/configure-windows/connect-to-sql-server-when-system-administrators-are-locked-out> | Nov 24, 2026 | verified |
| 9 | Preflight checks (PF-01 to PF-07), plan hashes, hash refusal, dry run, the seal's refusals, the rehearsal seal and PF-06 | Stage 1; Go or no-go; Stage 2 | `deploy/*.ps1`, `Add-SqlEvidenceRecord`, `config/requirements.json` | Nov 24, 2026 | verified by running and against the tests |
| 12 | `DENY` on a server permission takes a login mapped to a Windows group; `CONTROL SERVER` needed; `DENY` doesn't apply to `sysadmin` members | Before you start; step 10 | <https://learn.microsoft.com/sql/t-sql/statements/deny-server-permissions-transact-sql>; <https://learn.microsoft.com/sql/t-sql/statements/deny-transact-sql> | Nov 24, 2026 | verified |
| 13 | `Get-AzAccessToken` returns the token as a `SecureString` in newer releases | The token | <https://learn.microsoft.com/powershell/module/az.accounts/get-azaccesstoken> | Nov 24, 2026 | verified (same page as Chapter 04's claim 13) |
| 10 | 30-day windows | Steps 8, 11 | `config/thresholds.json`; Book 06 R05 | Nov 24, 2026 | verified in the repository |
| 11 | Live run of the runbook | all | — | — | not run |

## Book 06 against the kit

- **Group logins (resolved).** `cutover.sql` now denies `CONNECT SQL` to `CONTOSO\PayrollUsers` and `CONTOSO\SQL-Admins` and `rollback.sql` grants it back; the chapter's "don't run or approve a group line" warning is gone. Open: whether the deny holds for `CONTOSO\SQL-Admins`, a `sysadmin` member (Learn: `DENY` doesn't apply to `sysadmin` members); the chapter has the test stage try it with a member.
- **The seal accepts dry runs (resolved).** `Add-SqlEvidenceRecord` refuses a stage whose `DEPLOY` runs weren't `applied` unless `-Rehearsal`, records `instance`, `rehearsal` and each run's `mode`, and PF-06 accepts only a non-rehearsal test record for the same instance. The chapter's manual "check the modes before you seal" block is gone; it shows both refusals, the rehearsal seal, and production preflight failing PF-06 on the rehearsal-only chain.
- **PF-06 matches stage and instance, not the change.** The chapter says to confirm the record against the change record.
- **PRE's title (resolved).** It now reads "Preflight: settings, cloud, Arc eligibility, mapping, break-glass, sa and the earlier stage's evidence"; it no longer names the deployer's rights, which `Test-SqlPreflight.ps1`'s help says Chapter 10 checks by hand. The chapter's hand check stays.
- **Preflight and the audit's findings.** PF-07 now warns on `sa` (a warning, not a failure: it shows `warn` and preflight still passes). A mode changed without a restart still isn't read by preflight; the chapter keeps "resolve every `highest` and `high` finding first".
- **`-AccessToken` (resolved).** `[object]` in both scripts; a `SecureString` is converted. The chapter's token paragraph says either form works.
- **Stages don't require RB or EVIDENCE.** `config/requirements.json` `stages` omits RB; the chapter still runs the rollback dry run before cutover and includes it in the seal.

## Update after the kit's fixes (November 24, 2026)

- Outputs changed: preflight (PF-07 row, new PRE title), the cutover and rollback hashes and lines, the rollback dry run's wording ("Would restore 4 logins"), the seal (now `-Instance`, refusals, the rehearsal record `7da3923c168740d3`), and production preflight (PF-06 against the rehearsal-only chain). The hash-refusal block now shows only the message: PowerShell prints it below the script line that threw.
- Found while re-running: run from a PowerShell session that changed folder with `cd`/`Set-Location`, every entry script fails to write its output, because the scripts write with .NET (`[IO.File]::WriteAllText`, `AppendAllText`) on relative paths, which resolve against the process's working directory, not PowerShell's location. The re-run set the process directory first. Kit problem, recorded in the research gaps.

## Federal requirements and evidence

Controls and KSIs are the `PRE`, `PLAN`, `DEPLOY`, `RB` and `EVIDENCE` steps' in `config/requirements.json`; no new pair. Claim language: "supports" and "provides evidence for", never "satisfies".

## Review gate

`review-status: pending`. Not approved here.
