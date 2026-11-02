# Drift pipeline: compare validation kit runs and package evidence for the ISSO

> **Status: illustrative. Unit-tested against fixtures, not run against a live tenant or Azure.**
> Review every line, and run it first against a test tenant and a test subscription.

A scheduled pipeline runs the [validation kit](../validation-kit/README.md) read-only, compares each run with the last, opens findings for what's new or changed, and hands the ISSO an evidence package with a SHA-256 per file and the provenance from the other kits. The [developer workbook *Building the Attribute-Driven Migration*, Chapter 09](../../docs/books/b19-developer-workbook/09-drift-pipelines-and-evidence.md) walks through it.

It starts from Microsoft's sample: Learn's [Use the Azure Login action with OpenID Connect](https://learn.microsoft.com/azure/developer/github/connect-from-azure-openid-connect), whose three workflows are pinned in [`../third_party/azure-login-oidc-sample`](../third_party/azure-login-oidc-sample/SNAPSHOT.md), and the Azure Login action's `action.yml`, pinned in [`../third_party/azure-login-action`](../third_party/azure-login-action/SNAPSHOT.md). Both are checked offline; nothing here signs in.

## Layout

```
python/drift_pipeline.py      compare, issues, package, verify, cloud (standard library only)
python/workflow_lint.py       offline checks for a sign-in workflow (needs PyYAML)
python/hr_evidence.py         package, verify and assemble a period of HR lifecycle runs (Building HR-Driven Identity, Chapter 07)
workflow/drift-pipeline.yml   the sample workflow for GCC (NOT active in this repository)
tests/test_drift_pipeline.py  pytest, fixtures only
tests/test_workflow_lint.py   pytest, Learn's pinned samples and the sample workflow
tests/test_hr_evidence.py     pytest, runs that examples/hr-lifecycle writes from its own fixtures
tests/make_fixtures.py        rewrites the two fictional kit runs in tests/fixtures/runs
tests/fixtures/provenance/    provenance files the other kits wrote from their own fixtures
deploy/adm_deploy.py          the deployment runbook's settings file: load, refuse secrets and placeholders, print ADM_* variables
deploy/preflight.py           pre-flight checks before a stage; read-only live probes with --live
deploy/smoke_test.py          go or no-go after a stage, from the files the kits wrote
deploy/rollback.py            record each change a stage makes; write its rollback, newest first
deploy/environment.example.json  the settings template (placeholders only, no secrets)
tests/test_deploy.py          pytest, the four deploy scripts against fixtures and a fake runner
tests/fixtures/deploy/        fictional test and production settings for contoso.example
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

179 tests, no tenant and no network. `tests/test_hr_evidence.py` builds its runs with `examples/hr-lifecycle`, so its suite also runs when that kit changes.

## Deploying to test and production

`deploy/` holds the scripts [Book 19, Chapter 10](../../docs/books/b19-developer-workbook/10-deploying-to-test-and-production.md) runs to take the Attribute-Driven Migration kits from Lab 2 to a live test environment and then production. One settings file per stage, copied from `deploy/environment.example.json`, carries every value the runbook's commands read; the same commands run against both stages. The file holds no secret: the deployment identities sign in with a certificate (the drift pipeline with a federated credential), and the loader refuses any key or value that looks like a secret, and any placeholder left unfilled. Python 3.10 or later, standard library only. Work in this folder.

| Command | What it does | Exit codes |
|---|---|---|
| `python deploy/adm_deploy.py env --settings <file> --shell bash\|pwsh [--wave <id>]` | Prints the settings as `ADM_*` variables, with the per-cloud values (Graph host, Azure environment, Graph PowerShell environment, Arc playbook) derived from `cloud_profile()` | 0, 1 refused |
| `python deploy/preflight.py --settings <file> [--other <file>] [--test-smoke-report <file>] [--live] [--out <dir>]` | Checks PF-01 to PF-10 offline: schema, no secret, no placeholder, cloud, certificates outside the repository, kits present, the machine configuration release and Lifecycle Workflows registry, test and production apart, and for production a go/no-go record that points at a passing live test smoke report with the CISO's and identity engineering's approvals. `--live` runs read-only probes PF-11 to PF-16 (Azure CLI cloud, tenant, subscription and identity; PowerShell modules; certificate files); without it they're printed, not run | 0, 2 failed, 1 |
| `python deploy/smoke_test.py --settings <file> [--kit-run <dir>] [--hcm-provenance <file>] [--dynamic-rules <file>] [--mc-provenance <file> --mc-mode <mode>] [--deploy-record <file>] --out <dir> [--fixture]` | SM-01 to SM-13 on what the kits wrote: the validation kit run against its own manifest, the tenant, cloud and mode, the required checks `Pass` and no unexpected `Error`; the HR run not held and its quarantine within the limit; the rule library and machine configuration build clean; every recorded change with a rollback. Writes `smoke-report.json`. `--fixture` accepts the kits' fixture runs, and such a report can never promote | 0 go, 2 no-go, 1 |
| `python deploy/rollback.py add --settings <file> --kind <kind> --id <id> [--name <name>] [--note <text>]` | Appends one change to the stage's `deploy-record.json` | 0, 1 |
| `python deploy/rollback.py plan --settings <file> [--out <dir>]` | Writes `rollback-cloud.ps1`, `rollback-ad.ps1` and `rollback-manual.md`, newest change first, and runs nothing. Production re-enables and pauses; the test stage removes what it created | 0, 1 |
| `python deploy/rollback.py kinds` | Lists the kinds of change the rollback knows | 0 |

Nobody has run these scripts against a live tenant: the live probes and the rollback scripts are tested with a fake runner and read back, not executed.

## HR-driven identity evidence

`python/hr_evidence.py` packages the runs `examples/hr-lifecycle/python/lifecycle_drift.py` writes (the lifecycle drift classes and the six lifecycle metrics), using this file's hashing and the same rules: one tenant per chain, a package written once, a period with a gap or a broken chain isn't complete. The developer workbook *Building HR-Driven Identity*, Chapter 07, walks through it.

| Command | What it does | Exit codes |
|---|---|---|
| `python python/hr_evidence.py package --run <run> [--previous-manifest <file>] --out <dir>` | Checks the run against its own manifests and writes `<dir>/<run-id>/` with the run, `summary.md`, `EVIDENCE-MANIFEST.json` and `SHA256SUMS` | 0, 1 |
| `python python/hr_evidence.py verify <package>` | Rechecks every file and the run inside | 0, 1 |
| `python python/hr_evidence.py period --evidence <dir> --since <date> --until <date> --out <dir>` | Verifies the period's packages, the chain and the coverage; gives each metric's series and the Gate 7 criteria | 0 complete, 2 not, 1 |

## Not covered

- It doesn't run the validation kit or sign in; the workflow does both, and it hasn't been run against Azure.
- It doesn't sign the package. The SHA-256 manifest shows that nothing changed after packaging; the immutable container keeps it from changing afterwards. Signing is open (see the chapter's verification log).
- It trusts the tenant ID the kit wrote into its manifest; it can't check it against the tenant. Still keep one pipeline, one environment and one evidence container per tenant (*design guidance*).
