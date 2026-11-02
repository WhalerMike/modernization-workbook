# Verification — Learning path: Building the Attribute-Driven Migration

Files: `docs/training/attribute-driven-migration/index.md` and its nine modules, `01-the-hr-middleware.md` to `09-deploying-to-test-and-production.md`.
Example code: `examples/hcm-entra`, `examples/validation-kit`, `examples/dynamic-rules`, `examples/group-policy-as-code`, `examples/machine-configuration`, `examples/ansible`, `examples/lifecycle-extensions`, `examples/drift-pipeline`
Verified: 2026-11-02

Method:
- The path adds no new facts. Every fact a module states is carried by link from Book 19, *Building the Attribute-Driven Migration* (Chapters 01 and 03 to 10), the ADM implementation guide `docs/books/guides/attribute-driven-migration-implementation.md`, or the Microsoft Automation path's Module 1, and relies on those pages' own verification logs (`docs/books/b19-developer-workbook/_verification/`, `docs/books/guides/_verification/attribute-driven-migration-implementation.md`). New writing is limited to the path, the module framing, objectives, unit glue, knowledge-check questions and time estimates.
- Each module's requirement table is a subset of the chapter's *Federal requirements and evidence* table (Chapter 10: its per-step requirements tables), copied without change to the control, the KSI or the evidence. No new control or KSI ID is introduced. The KSI framing sentence is the chapters' own.
- Each knowledge-check answer links the section that teaches it; the answer was checked against that section's text.
- Expected output shown in a module is the kit's real output: from the captures in `data/kit-captures/adm` (Chapters 01, 03, 04, 05, 06 and 09), or, where there is no capture, from the chapter's own Lab 1 text (Chapters 07, 08 and 10).
- Lab 1 commands were re-run on 2026-11-02 (Windows 11, Python 3.14.3, PowerShell 7.6.9, Git Bash), in a scratch copy of the examples or in this worktree with the outputs deleted afterwards, as the claims log says.
- Lab 2 is a pointer to each chapter's Lab 2 and wasn't run, as the pages say.
- Time estimates are the program's planning figures *(design guidance)*, not measurements.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Module 1, Lab 1 steps 1 to 7: counts, quarantine reasons, extract hash, `identical`, the broken row, the hold (exit 3), `70 passed` | Module 1 | verified (re-run 2026-11-02) | Captures 01-2 to 01-8; Chapter 01, Lab 1 |
| 2 | Module 2, Lab 1 steps 1 to 7: Fail 2, Warn then Fail, Input, the scope and role, `False`, 297 Pester tests, Fail/Fail/Pass | Module 2 | verified (steps 1 to 6 re-run 2026-11-02; step 7 from capture) | Captures 03-1 to 03-8 |
| 3 | Module 3, Lab 1: the resume turns on "Held for review"; the GCC High answer hits the worldwide host; DR-05 and DR-03; the five members; the library check exit 0 and, broken, exit 2 with DR-10, DR-11 and `adds u06`; 70 tests | Module 3 | verified (steps 1 to 5 re-run 2026-11-02, step 4 and 5 in the worktree because they need Git; 70 tests from capture 04-9: a scratch copy without `docs/` gives 69 and 1 failure, because one test reads Book 03's table) | Captures 04-1 to 04-9; Chapter 04, Lab 1 |
| 4 | Module 4, Lab 1 steps 1 to 7: VK-INT-07's five rows, two POSTs and no GET, the eleven-row plan, GPC-08, Create/NoChange, Created, the scopes and ID, `usgov` exit 1, Drift exit 2, 46 tests | Module 4 | verified (steps 1 and 3 to 7 re-run 2026-11-02; step 2 and the second apply in step 6 from captures) | Captures 06-1 to 06-10 |
| 5 | Module 5, Lab 1 results | Module 5 | carried, not re-run: step 1 downloads three modules from the PowerShell Gallery, which this session didn't do; there are no captures for Chapter 07 | Chapter 07, Lab 1 text |
| 6 | Module 6, Lab 1 results | Module 6 | carried, not re-run: step 1 installs Ansible collections and the lab needs a Linux control node; there are no captures for Chapter 08. On Windows, `python -m pytest examples/ansible/tests` gave `74 passed, 16 skipped` and the `updatemanager` copy gave `line 3: unknown patch_owner 'updatemanager'`, exit 1, as the chapter says | Chapter 08, Lab 1 text; re-run 2026-11-02 for the two Windows checks |
| 7 | Module 7, Lab 1 steps 1 to 7: eight lint results, the GCC High failure, the PT15M LX-11, the three runs' last lines, the build, WX-03 twice, 55 tests | Module 7 | verified (re-run 2026-11-02; the Azure Government refusal in step 5 from capture 05-9) | Captures 05-1 to 05-13 |
| 8 | Module 8, Lab 1 steps 1 to 9: lint results, cloud hosts, baseline and day 2 counts, the two manifest hashes, the issue counts, 16 files, the two refusals, 142 tests | Module 8 | verified (re-run 2026-11-02; 142 tests in the worktree, about two minutes) | Captures 09-1 to 09-12 |
| 9 | Module 9, Lab 1 steps 2 to 7: preflight pass, the rollback plan, NO-GO (5 failed), 2 of 17 rows, `sha256sum` OK, PF-10 refusal, 46 tests | Module 9 | verified (re-run 2026-11-02 in the worktree from an empty `out`; the smoke and evidence-check hashes differ per run, so the module doesn't show them) | Chapter 10, *Try the scripts against fixtures first* |
| 10 | Chapter 10 is held for review and not run against a live tenant | Module 9 | carried | Chapter 10, status callout |
| 11 | Each module's gate mapping | Path index; every module | carried | Chapter 10's stage order table and step-to-gate map (Chapters 01, 04, 05, 06, 07, 08, 09); the guide's *Where the kits stop* (VK-SYNC-02 at Gate 3) and Gate 0's Validate step (VK-INT-07) |
| 12 | Gates 1 and 6 have no Book 19 chapter | Path index | carried | The guide's Gate 1 and Gate 6 Validate steps; Book 19's chapter table |
| 13 | Chapter 02 is taught by Microsoft Automation, Module 1, whose Lab 2 is Chapter 02's Lab 2 | Path index; Labs page | carried | `docs/training/ms-automation-foundations.md`, header and Unit 8 |
| 14 | Each chapter's narrated tour and its length | Every module | carried | Book 19 index, narrated chapter tours |
| 15 | Each module's requirement, KSI and evidence rows | Every module's introduction | carried | Each chapter's *Federal requirements and evidence* table; Chapter 10's per-step tables |
| 16 | Lab 2 steps, prerequisites and back-out | Every module | not verified: not run by the authors, as the chapters mark them | Each chapter's Lab 2 |
| 17 | Unit and path times | Every module; the path index | design (estimates) | — |

## Found while building the path

- Chapter 10's evidence records are numbered within the stage's `out` folder, so the numbers in its dry-run output (`001-preflight.json` to `007-smoke.json`) hold only from an empty `out`. A run after Chapter 09's tests, which leave an `out` folder behind, printed `003-preflight.json`. Module 9 starts with `rm -rf out`. Chapter 10 wasn't changed.
- `scripts/generate_labs.py` matched Validate headings written `G1 ...` only. The ADM guide writes `Gate 0: ...`, so the script now accepts both, and gives those blocks the key `try-gN`. The labs blocks sit outside the reviewed body, so the guide's review hash still matches.
