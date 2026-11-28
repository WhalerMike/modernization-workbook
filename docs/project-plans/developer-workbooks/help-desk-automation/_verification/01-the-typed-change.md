# Verification — Chapter 01, The Typed Change

New material, written November 27, 2026. Code: `examples/help-desk-automation` (`New-HtTypedChangePlan`, `Invoke-HtTypedChange`, `Get-HtSha256`, `Invoke-HtGraph`, `config/typed-changes.json`, `config/calls.json`). Microsoft Learn's *Update user* page was re-read on November 27, 2026 with WebFetch (the Microsoft Learn MCP tools weren't available in this session); the other Learn pages are carried with their original read dates.

**Two kit changes with this chapter.** Found while running Lab 1: (1) `Write-HtJson`, the plan's `plan.sha256` and the run reports wrote with `[IO.File]::WriteAllText` and a relative path, which .NET resolves against the process's starting folder, not the PowerShell location, so a reader who opened PowerShell elsewhere and ran `Set-Location` got an error and a plan whose hash was the empty file's (`e3b0c442…`). They now resolve the path through PowerShell first (`Resolve-HtPath`, `Write-HtText`). (2) The plan's `plannedUtc` and the evidence's `runUtc` were the machine's local time with a `Z`; they now convert to UTC. Tests added: "writes a relative output path under the PowerShell location", and the `plannedUtc` assertion in "plans a valid change".

Lab 1 was run with `python scripts/kit_captures.py ht` on Windows 11, PowerShell 7.6 with Pester 5, on November 27, 2026; the output is `data/kit-captures/ht/01-*.txt`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `PATCH /users/{id}`; least privileged `User.ReadUpdate.All`, higher `User.ReadWrite.All`, `Directory.ReadWrite.All` | Start with; Verified facts | verified Nov 27 | `ht01-update` |
| 2 | Synced users: source of authority; `onPremisesExtensionAttributes` read-only for an `onPremisesSyncEnabled` user (quoted) | Start with; Verified facts | verified Nov 27 | `ht01-update` |
| 3 | Get user, `User.Read.All` | Start with | carried (kit `config/calls.json`, read Nov 27) | `ht01-get` |
| 4 | GCC uses `graph.microsoft.com` | Start with | carried (PN index) | `ht01-deployments` |
| 5 | `selfActivate` / `selfDeactivate`; MFA for self-activation | Lab 2 step 4, 6 | carried (PA Ch08, read Nov 27); `selfDeactivate` not re-read | `ht01-activate` |
| 6 | User Administrator template ID `fe930be7-…` | Lab 2 | carried (Book 04, Appendix B) | — |
| 7 | HT-01 to HT-08 and what each refuses | The code | read in the module and tests | kit |
| 8 | Lab 1 outputs (permissions, five changes, plan and hash, four refusals, dry run, HT-08 twice, HT-07, apply verified, 17 tests) | Lab 1 | verified by running the commands | `data/kit-captures/ht/01-*.txt` |
| 9 | Lab 2 behavior | Lab 2 | not run | — |

## Not yet specified

N1 whether sending `null` clears an extension attribute for a delegated caller; N2 `selfDeactivate`'s request body (the lab sends the same principal, role and scope as the activation).

## Federal requirements and evidence

Three rows. Controls and KSIs are `config/requirements.json` for `typed-change-plan` (AC-2, CM-3; KSI-CMT-LMC) and `typed-change-apply` (AC-2, AC-6, CM-3; KSI-CMT-LMC, KSI-IAM-JIT); no new pair. Claim language: "supports", never "satisfies".

## Overlap search (origin/main, November 27, 2026)

Searched `docs/books`, `docs/project-plans`, `docs/training`, `docs/topics`, `docs/reference` and `presentations/*/build.js`, `slides.js`, `narration.json` for "typed change", "parameters travel", `New-HtTypedChangePlan`, "help-desk-automation". Found: Book 15, Chapter 12, task 5 (the rule; linked, not restated), its one-paragraph note on the kit (consistent), `docs/downloads.md` (consistent), Permissions by Run (generated from the same file). No deck covers the kit. No conflict.
