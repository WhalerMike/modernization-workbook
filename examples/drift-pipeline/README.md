# Drift pipeline: compare validation kit runs and package evidence for the ISSO

> **Status: illustrative. Unit-tested against fixtures, not run against a live tenant or Azure.**
> Review every line, and run it first against a test tenant and a test subscription.

A scheduled pipeline runs the [validation kit](../validation-kit/README.md) read-only, compares each run with the last, opens findings for what's new or changed, and hands the ISSO an evidence package with a SHA-256 per file and the provenance from the other kits. The [developer workbook *Building the Attribute-Driven Migration*, Chapter 09](../../docs/project-plans/developer-workbooks/attribute-driven-migration/09-drift-pipelines-and-evidence.md) walks through it.

It starts from Microsoft's sample: Learn's [Use the Azure Login action with OpenID Connect](https://learn.microsoft.com/azure/developer/github/connect-from-azure-openid-connect), whose three workflows are pinned in [`../third_party/azure-login-oidc-sample`](../third_party/azure-login-oidc-sample/SNAPSHOT.md), and the Azure Login action's `action.yml`, pinned in [`../third_party/azure-login-action`](../third_party/azure-login-action/SNAPSHOT.md). Both are checked offline; nothing here signs in.

## Layout

```
python/drift_pipeline.py      compare, issues, package, verify, cloud (standard library only)
python/workflow_lint.py       offline checks for a sign-in workflow (needs PyYAML)
workflow/drift-pipeline.yml   the sample workflow for GCC (NOT active in this repository)
tests/test_drift_pipeline.py  pytest, fixtures only
tests/test_workflow_lint.py   pytest, Learn's pinned samples and the sample workflow
tests/make_fixtures.py        rewrites the two fictional kit runs in tests/fixtures/runs
tests/fixtures/provenance/    provenance files the other kits wrote from their own fixtures
```

## Commands

Python 3.10 or later; PyYAML for the workflow checks. Work in this folder.

| Command | What it does | Exit codes |
|---|---|---|
| `python python/drift_pipeline.py compare [--previous <kit-run>] --current <kit-run> --out <dir> [--allow-tenant-mismatch]` | Checks both runs against their own `ValidationManifest.json`, refuses runs that can't be compared, and writes `drift-report.json` and `drift-summary.md`. Without `--previous`, the run is the baseline | 0 no drift, 2 drift, 1 refused |
| `python python/drift_pipeline.py issues --diff <dir>/drift-report.json --out <file>` | Drafts what to open, comment on and close, one entry per finding, keyed by a fingerprint. No object names unless `--include-names` | 0, 1 |
| `python python/drift_pipeline.py package --kit-run <kit-run> --diff <report> --provenance <kind>=<file> ... [--previous-manifest <file>] --out <dir>` | Writes `<dir>/<run-id>/` with the kit run, the drift report, the provenance files, `EVIDENCE-MANIFEST.json` and `SHA256SUMS` | 0, 1 |
| `python python/drift_pipeline.py verify <package>` | Rechecks every file, `SHA256SUMS` and the kit run's own manifest | 0, 1 |
| `python python/drift_pipeline.py cloud --name gcc\|gcchigh\|dod` | Prints the sign-in authority, Graph host, Azure environment, token audience and Graph PowerShell environment for a cloud | 0, 1 |
| `python python/workflow_lint.py <workflow.yml>` or `--learn-samples` | Checks a workflow offline (rules WF-01 to WF-12) | 0, 2 findings, 1 |

Provenance kinds: `hcm-entra` (`provenance.json`, schema `fmp-hcm-provenance/1`), `machine-configuration` (`provenance.json`, `fmp-mc-provenance/1`) and `dynamic-rules` (`check-results.json`). Anything else is refused.

## What counts as drift

| Result | Meaning | Opens |
|---|---|---|
| new | A Finding or Warn row the previous run didn't have | an issue |
| changed | The same check and object with a different severity or issue text | an issue (or a comment when only the severity moved); the old one closes as superseded |
| detail only | The same finding with a different `Detail` value | nothing; recorded in the report |
| resolved | A row gone from a check that read the tenant this run | closes the issue |
| unverified | The check ended in `Error` or `NotApplicable`, or didn't run | an issue; earlier findings stay open |
| unchanged | The same row | nothing |

Runs are refused when the mode or cloud differs, when the current run isn't later, or when either fails its own manifest. They are also refused when their manifests record different tenant IDs (compared without regard to case), or when either records none, as a manifest written before the kit recorded the tenant doesn't. `--allow-tenant-mismatch` compares them anyway, for a reviewed exception, and writes the reason into the report's notes; it doesn't bypass the other refusals. The drift report and the evidence manifest carry each run's `tenant_id`. A changed `-Option` value is noted in the report.

## Test

```bash
python -m pytest tests -q
```

74 tests, no tenant and no network.

## Not covered

- It doesn't run the validation kit or sign in; the workflow does both, and it hasn't been run against Azure.
- It doesn't sign the package. The SHA-256 manifest shows that nothing changed after packaging; the immutable container keeps it from changing afterwards. Signing is open (see the chapter's verification log).
- It trusts the tenant ID the kit wrote into its manifest; it can't check it against the tenant. Still keep one pipeline, one environment and one evidence container per tenant (*design guidance*).
