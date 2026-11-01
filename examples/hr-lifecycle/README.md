# HR lifecycle: the code behind *Building HR-Driven Identity*

> **Status: illustrative. Unit-tested against fixtures, not run against a live tenant.**
> Review every line, and run it first against a test tenant.

The tools the [HR-driven identity implementation guide](../../docs/books/guides/hr-driven-identity-implementation.md)'s gates need that the rest of `examples/` doesn't already give. The developer workbook [*Building HR-Driven Identity*](../../docs/project-plans/developer-workbooks/hr-driven-identity/index.md) walks through them, one chapter per gate.

Everything here reads or plans; nothing writes to a tenant. `graph_export.py` makes the Graph reads, GET only, each with the least-privileged permission from its Learn page (`config/calls.json`). The other tools read those exports, or the fixtures shaped like them, and write an output folder with a `manifest.json` that holds a SHA-256 per file. Where a change has to reach the tenant (a workflow version, an assignment policy), the tool writes the request body for review, and Microsoft's Graph PowerShell cmdlet or the reviewed pipeline sends it.

## What it builds on, and doesn't repeat

| Need | Where it lives |
|---|---|
| The HR feed, SCIM bulk requests and provenance | [`examples/hcm-entra`](../hcm-entra/README.md) (Book 19, Chapter 01); `contractor_source.py` writes an extract in its layout |
| The Graph client pattern for government clouds | Book 19, Chapter 02 |
| Read-only checks (VK-HR-01 to 07, VK-DG-05, VK-PIV-01) | [`examples/validation-kit`](../validation-kit/README.md) (Book 19, Chapter 03) |
| Dynamic group rules: parser, lint, shadow diff | [`examples/dynamic-rules`](../dynamic-rules/README.md) (Book 19, Chapter 04) |
| Custom task extensions and the leaver order check | [`examples/lifecycle-extensions`](../lifecycle-extensions/README.md) (Book 19, Chapter 05) |
| Drift comparison and evidence packages | [`examples/drift-pipeline`](../drift-pipeline/README.md) (Book 19, Chapter 09); `hr_evidence.py` there packages this kit's runs |
| PIM and reviews of privileged roles | [`examples/privileged-access`](../privileged-access/README.md) (*Building Privileged Access*) |

## Layout

```
config/calls.json              every Graph call, its task and least-privileged permission (GET only)
config/writer-register.json    Gate 1: one writer and a backstop per transition and HR-mastered value
config/contractor-rules.json   Gate 2: earliest-end rules and the sponsor review settings
config/workflows/*.json        Gate 3: Lifecycle Workflows definitions as reviewed v1.0 bodies
config/access/*.json           Gate 4: access package assignment policies as reviewed v1.0 bodies
config/cba-expected.json       Gate 5: the issuing CAs, PIV policy OIDs and each cloud's CRL limits
config/separation.json         Gate 6: the separation thresholds
config/drift.json              Gate 7: the six metrics and their thresholds
python/hrlc_core.py            shared: clouds, calls, findings, the output folder (not a command)
python/graph_export.py         the GET-only reader for a task's calls
python/writer_register.py      Chapter 01: check the register; scan the audit log for second writers
python/contractor_source.py    Chapter 02: earliest end, the extract, reconciliation, the sponsor review
python/joiner_workflows.py     Chapter 03: lint, plan new versions, day-one readiness
python/access_assignment.py    Chapter 04: lint policies, the memberOf scan, the mover's residual
python/cba_check.py            Chapter 05: measure CRLs; check the CBA configuration
python/separation_timing.py    Chapter 06: separation-to-block and separation-to-revocation
python/lifecycle_drift.py      Chapter 07: drift classes, the six metrics, the run folder
tests/                         pytest, fixtures only (tests/fixtures/ch01 to ch07)
```

## Commands

Python 3.10 or later, standard library only. Work in this folder. Every tool takes `--help`.

| Command | Rules | Exit codes |
|---|---|---|
| `python python/graph_export.py --task <task> --list` or `--cloud <cloud> --out <dir>` | — | 0, 1 |
| `python python/writer_register.py check` / `scan` | WR-01 to WR-09; WS-01 to WS-04 | 0, 2 findings, 1 |
| `python python/contractor_source.py extract` / `reconcile` / `review` | CS-01 to CS-04; CR-01 to CR-05 | 0, 2, 1 |
| `python python/joiner_workflows.py lint` / `plan` / `readiness` | JW-01 to JW-15; JR-01 | 0, 2, 1 |
| `python python/access_assignment.py lint` / `memberof-scan` / `residual` | AA-01 to AA-09; MS-01; RV-01, RV-02 | 0, 2, 1 |
| `python python/cba_check.py measure` / `check` | CB-01 to CB-13 | 0, 2, 1 |
| `python python/separation_timing.py measure` | ST-01 to ST-09 | 0, 2, 1 |
| `python python/lifecycle_drift.py run` | LD-01 to LD-08 | 0, 2, 1 |

Clouds: `gcc` (`graph.microsoft.com`), `gcchigh` (`graph.microsoft.us`), `dod` (`dod-graph.microsoft.us`). There is no default.

## Test

```bash
python -m pytest tests -q
```

57 tests, no tenant and no network. `examples/drift-pipeline/tests/test_hr_evidence.py` also builds runs from this kit's fixtures, so the drift pipeline's suite runs when this kit changes.

## Not covered

- It doesn't write to a tenant. Plans and review settings are bodies for review; send them with Graph PowerShell or the reviewed pipeline.
- The audit `modifiedProperties` names in the writer register, `requestorManager` as an access review reviewer, and the workflow execution limit (which Learn says isn't in the API) are unconfirmed; the workbook's verification logs list them.
- It hasn't been run against a tenant.
