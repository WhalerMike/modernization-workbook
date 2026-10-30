---
title: "Chapter 09 — Drift Pipelines and Evidence to the ISSO"
description: "A scheduled GitHub Actions pipeline that signs in with a federated credential and no secret, runs the validation kit read-only, compares each run with the last, opens findings for what is new, changed or unverified, and packages the run with the other kits' provenance, a SHA-256 per file and a hash chain for the ISSO. It starts from Learn's Azure Login sample workflows (pinned in the repository), checks them offline, and builds only what they leave out, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-attribute-driven-migration
part: How
series-order: 9
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: pending
---

# Chapter 09 — Drift Pipelines and Evidence to the ISSO

*A check that runs when someone remembers is a spot check. A check that runs every day, says what moved since yesterday, and leaves evidence nobody can edit afterwards is continuous monitoring.*

::: {.callout-note}
## In this chapter
How the read-only checks from [Chapter 03](03-writing-a-validation-kit-check.md) become a scheduled pipeline. You start from Learn's sample workflows for signing in to Azure from GitHub Actions with a federated credential, which the repository keeps as a pinned copy, and check them offline. Then you build on `examples/drift-pipeline` for what they leave to you: a schedule, pinned actions, the right sign-in and Graph host for GCC, GCC High and DoD, a comparison of each run with the last, findings opened and closed by fingerprint, and an evidence package for the ISSO with a SHA-256 per file, the other kits' provenance and a hash chain to the previous package. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant and a test subscription.
:::

## Goal and audience

**Goal.** By the end of this chapter you can run the validation kit on a schedule with no secret stored anywhere, explain every line of the drift report it produces, open and close findings without leaking names into the issue tracker, and hand the ISSO a package they can verify with `sha256sum` and nothing else. For each rule in the code you can say whether it is Microsoft's contract, Microsoft's sample, GitHub's documentation, or the program's own design.

**Audience.** Platform and pipeline engineers who own the scheduled checks, and the ISSOs and reviewers who receive the evidence. You should be comfortable with Python and GitHub Actions. You don't need a tenant until Lab 2.

## Where the pipeline sits

Three pages already say what this pipeline must produce. This chapter builds it and doesn't repeat them.

- [Book 13, Chapter 06](../../../books/b13-governance/06-the-drift-engine.md) defines the drift engine: drift is measured against a versioned record, not a snapshot, and each check's cadence is set by the book that owns it.
- [Book 13, Chapter 04](../../../books/b13-governance/04-change-control-and-provenance.md#no-closure-counts-unless-it-carries-its-proof) says no closure counts unless it carries its proof, and that reports are derivations that can be re-run.
- [Book 12, Chapter 02](../../../books/b12-security-operations/02-the-evidence-contract.md) defines the evidence contract, and says a finding closes only when a later observation shows the fixed state.

The pipeline is a small part of that design. Each validation kit check already compares the tenant with the program's record or rule: VK-HR-01 with the HR join, VK-DG-01 with the guards, VK-CA-01 with the governed-group list. The pipeline adds the second comparison: this run against the last. That finds *change*. Whether a change is drift from the record is still the check's answer, not the pipeline's. A finding that was there yesterday and is still there today is not new, but it is still open.

The comparison also enforces Book 12's closing rule in code. A finding is resolved only when the same check read the tenant again and didn't report it. A check that ended in `Error` proves nothing, so its findings stay open as *unverified*.

## Why GitHub Actions

Learn documents two ways to run a scheduled job that signs in to Azure without a secret: GitHub Actions with the Azure Login action, and Azure Pipelines with a workload identity federation service connection. This chapter uses GitHub Actions, for three reasons.

- Learn publishes complete sample workflows for it, including the Azure US Government sign-in, on one page.[^c09-oidc] That is the sample this chapter starts from.
- The Azure Login action is Microsoft's own, published with its source and its declared inputs.[^c09-login-action]
- For Azure Pipelines, Learn's automatic app registration with workload identity federation doesn't apply to the Azure US Government environment; that needs the manual method.[^c09-ado-wif] The estate in this chapter is GCC with commercial Azure, so either would work there, but one pipeline that also documents the GCC High and DoD path is simpler to hand on.

*Design guidance:* an agency standardized on Azure Pipelines can use the same comparator, packager and tests. Only the workflow file changes.

GitHub Actions details that Learn doesn't cover (the schedule, the token's claims, action pinning, artifact retention) are cited to GitHub's own documentation, which Learn's page itself points to.[^c09-oidc]

## Start with Learn's sample

### What Learn gives you

Learn's page "Use the Azure Login action with OpenID Connect" has three workflows.[^c09-oidc]

| Sample | What it does |
|---|---|
| Azure CLI only | Signs in with `azure/login@v2` and runs `az account show` with `azure/cli@v2` |
| Azure CLI and Azure PowerShell | The same, with `enable-AzPSSession: true` and `azure/powershell@v2` running `Get-AzContext` |
| Azure US Government | One step: `azure/login@v2` with `environment: 'AzureUSGovernment'` and `audience: api://AzureADTokenExchangeUSGov` |

Each job asks for `id-token: write` and nothing else. The client ID, tenant ID and subscription ID come from GitHub secrets, which Learn recommends "for security reasons". The `audience` input defaults to `api://AzureADTokenExchange` for public clouds and must be changed for the others.[^c09-oidc] Before the workflow runs, the app registration (or a user-assigned managed identity) needs a federated credential that trusts the repository.[^c09-fic]

### The pinned copy

The workflows exist only inside the Learn page, so the repository pins the page itself: `connect-from-azure-openid-connect.md` from MicrosoftDocs/azure-dev-docs at commit `23900ce` (October 28, 2026), unmodified, with the repository's MIT code license.[^c09-oidc-code] It also pins the Azure Login action's `action.yml` at release v3.1.0, because the offline checks read its declared inputs and defaults.[^c09-login-action] Each copy has a `snapshot.json` with a SHA-256 per file, checked by a unit test, and a source-watch feed that reports new upstream commits. Updating either is a reviewed pull request, as in [Chapter 01](01-the-hr-to-entra-middleware.md#the-pinned-copy).

`python/workflow_lint.py` extracts each workflow from the pinned page at test time and parses it as YAML. Nothing runs and nothing signs in. Twelve rules (WF-01 to WF-12) check what Learn, the action and GitHub's documentation require of a workflow that runs unattended.

### What it leaves to you

Checking the three samples offline shows what they do well and what they leave to you. Each row is pinned by a test in `tests/test_workflow_lint.py` or `tests/test_drift_pipeline.py`.

| Learn's samples, checked as published | Why it matters | What `examples/drift-pipeline` adds |
|---|---|---|
| Sign in with OIDC; `id-token: write` on the job and nothing else; IDs in secrets; inputs the action declares | — | Kept as the model: the same sign-in, the same secrets, the same single grant on the job that signs in |
| They run on `push`; there is no schedule (WF-02) | Drift isn't found because someone pushed a commit | `schedule` once a day and `workflow_dispatch` |
| `azure/login@v2`, `azure/cli@v2` and `azure/powershell@v2` are tags (WF-05), and v2 is an older major version than the current Azure Login release, v3.1.0 (WF-08)[^c09-login-action] | A tag can be moved; GitHub advises pinning an action to a full commit SHA[^c09-gh-secure] | Every action pinned to a commit, Azure Login to v3.1.0's |
| `azcliversion: latest` and `azPSVersion: latest` (WF-09) | The tool that produced the evidence changes without a review | Exact versions from repository variables |
| The US Government sample doesn't parse as YAML: `with:` is indented under `uses:` (WF-01) | Copied as is, the workflow can't run. Its environment and audience pair is right once the indentation is fixed (a test does that in memory) | The linter catches it; a cloud table gives each cloud's values |
| The job names no environment (WF-10) | The token's subject then depends on the branch or event,[^c09-gh-oidc] and a federated credential matches one subject exactly[^c09-fic] | The job runs in the `drift-gcc` environment; the credential's subject is that environment |
| They stop at `az account show` | No Graph token, and nothing about GCC High and DoD, which share a sign-in authority and Azure environment but have different Graph hosts[^c09-graph-clouds] | A cloud table for GCC, GCC High and DoD, checked against the workflow (WF-12); a Graph token for the profile's host |
| No workflow-level permissions, no concurrency group, no timeout (WF-03, WF-11 warnings) | Two runs can overlap and compare against each other | `permissions: {}` at the top, a concurrency group, timeouts |
| Nothing after sign-in | No comparison, no findings, no evidence | `compare`, `issues`, `package` and `verify` |

**The verdict.** Use Learn's sign-in exactly: the federated credential, the action, the secrets, the single grant. Pin it, schedule it, and put the rest of the pipeline behind it. Fix the US Government sample's indentation before you copy it.

## The code: what `examples/drift-pipeline` adds

[`examples/drift-pipeline`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/drift-pipeline) is two Python files, one sample workflow and two test files. `drift_pipeline.py` uses only the standard library; `workflow_lint.py` needs PyYAML.

### The workflow

`workflow/drift-pipeline.yml` is a sample for a GCC tenant with commercial Azure. It isn't active in this repository: it sits under `examples/`, not `.github/workflows/`, and has never run against Azure. It has two jobs.

- **`check`** runs in the `drift-gcc` environment with `contents: read` and `id-token: write`. It signs in with Azure Login, gets a Graph token for the profile's Graph host with `Get-AzAccessToken -AsSecureString`,[^c09-azaccesstoken] connects Microsoft Graph PowerShell with it,[^c09-mggraph] and runs the validation kit with `-SkipConnect`. Then it fetches and verifies the previous evidence package, compares, packages, and writes the package to an immutable container.
- **`findings`** has `contents: read` and `issues: write`, and no Azure access at all. It downloads the drift report and opens or closes issues.

*Design guidance:* the identity that can read the tenant never writes to the tracker, and the job that writes to the tracker can't request a token. WF-04 fails a workflow that puts both grants on one job.

The validation kit's own sign-in supports a certificate or a managed identity ([Chapter 03](03-writing-a-validation-kit-check.md)). A federated credential reaches it through `-SkipConnect`, after `Connect-MgGraph -AccessToken`. VK-DG-03 is delegated only, so an app-only run reports it as `Error` every time, as the kit's README says. The pipeline lists it as unverified on every run, which is the truth: nothing app-only can prove it.

### Clouds

`cloud_profile()` holds one row per cloud. An unknown name is refused, never mapped to worldwide.

| Cloud | Sign-in authority | Graph host | Azure Login `environment` | `audience` | `Connect-MgGraph -Environment` |
|---|---|---|---|---|---|
| `gcc` | `login.microsoftonline.com` | `graph.microsoft.com` | `AzureCloud` | `api://AzureADTokenExchange` | `Global` |
| `gcchigh` | `login.microsoftonline.us` | `graph.microsoft.us` | `AzureUSGovernment` | `api://AzureADTokenExchangeUSGov` | `USGov` |
| `dod` | `login.microsoftonline.us` | `dod-graph.microsoft.us` | `AzureUSGovernment` | `api://AzureADTokenExchangeUSGov` | `USGovDoD` |

Learn says an app in a Microsoft 365 GCC environment keeps using the worldwide endpoints, and lists the GCC High and DoD Graph hosts.[^c09-graph-clouds] The audiences per cloud are on Learn's federated credential pages,[^c09-mi-trust] and the Graph PowerShell environment names on `Connect-MgGraph`'s page.[^c09-mggraph] Tokens for one cloud don't work in another.[^c09-graph-clouds] The trap is DoD: Azure Login's `AzureUSGovernment` covers both GCC High and DoD, so the Graph host has to come from the profile, not from the sign-in.

### Compare

`load_run()` reads a kit run and checks it against the kit's own `ValidationManifest.json`: every listed file with the same SHA-256, nothing missing, nothing added, and `ReadOnly: true`. A run edited after the kit wrote it is refused.

`compare()` takes the Finding and Warn rows (the kit's `Count`; Info rows don't count) and keys each by check, object ID and issue. It refuses to compare runs from different modes or clouds, or a "current" run that isn't later. A changed `-Option` value, such as `MaxSecretDays`, is noted, because it can move findings without the tenant moving.

| Result | Meaning | In the tracker |
|---|---|---|
| new | A row the previous run didn't have | opens an issue |
| changed | Same check and object, different severity or issue text | opens an issue (or comments, when only the severity moved); the old one closes as superseded |
| detail only | Same finding, different `Detail` (a count of days, a list of policies) | nothing; recorded in the report |
| resolved | Gone from a check that read the tenant this run | closes the issue, citing the run and the kit manifest's hash |
| unverified | The check ended in `Error` or `NotApplicable`, or didn't run | opens one issue per check; earlier findings stay open |

Each finding has a fingerprint: the first 16 hex characters of a SHA-256 over check, object and issue. The same finding gets the same fingerprint in every run, so the findings job can find its open issue and never opens a duplicate.

### Findings without names

`issue_drafts()` writes the check, the severity, the object ID, the issue and the fingerprint. It leaves out the object's name, which for most checks is a user principal name. *Design guidance:* the evidence store is access-controlled and holds the names; the tracker is read by more people and doesn't need them. `--include-names` turns them on. A first run is a baseline: it records every finding and opens one summary issue, not hundreds.

### The evidence package

`package()` writes `<run-id>/` with:

- `kit-run/`: the validation kit run as written, including its own manifest;
- `drift/drift-report.json` and `drift/drift-summary.md`;
- `provenance/<kind>/`: the latest provenance from the other kits, recognized by schema and summarized: `provenance.json` from `examples/hcm-entra` (Chapter 01), `provenance.json` from `examples/machine-configuration` (Chapter 07), and `check-results.json` from `examples/dynamic-rules` (Chapter 04). An unknown file is refused, and one older than 30 days is noted;
- `EVIDENCE-MANIFEST.json`: the run, the cloud, the kit manifest's hash, the drift counts, the provenance summaries, the GitHub run identifiers, a SHA-256 and size for every file, and the previous package's run ID and manifest hash;
- `SHA256SUMS`: every file, the manifest included, in the format `sha256sum -c` reads.

The previous package's manifest hash makes the packages a chain. A package that was replaced, or a day that is missing, shows up as a break. The same inputs give the same bytes, so a package can be rebuilt from its inputs and compared, which is Book 13's "reports are derivations". `verify()` is what the ISSO runs; `sha256sum -c SHA256SUMS` gives the same answer without our code.

The packager doesn't sign. The hashes show that nothing changed after packaging; the container's locked time-based retention policy keeps it from changing afterwards: blobs can be created and read, but not modified or deleted, until the retention interval ends.[^c09-immutable] Signing is an open question in the verification log.

### The tests

`tests/test_drift_pipeline.py` has 44 tests: loading and refusing runs, every result type, issue drafts, provenance, packaging, the hash chain, verification and the cloud table. `tests/test_workflow_lint.py` has 20: Learn's three samples as published, the pinned action, and the sample workflow with one defect introduced at a time. Neither needs a tenant or a network. The fixtures are two fictional kit runs for `contoso.example`, one day apart, written by `tests/make_fixtures.py`, and the provenance files the other kits wrote from their own fixtures.

::: {.callout-important}
## Illustrative code
The commands below check Learn's pinned samples offline and run the example against fixtures. The sample workflow has been parsed and linted, not run: nothing in this chapter has signed in to Azure. Review the code, and run Lab 2 in a test tenant and a test subscription, before it produces evidence anyone relies on.
:::

## Lab 1: fixtures, no tenant

You need Python 3.10 or later with PyYAML and pytest, and a shell with `sha256sum` (Linux, macOS or Git Bash). Work in `examples/drift-pipeline`.

1. **Check Learn's samples offline:**

   ```bash
   python python/workflow_lint.py --learn-samples
   ```

   Exit `2`. Sample 1 has five findings (WF-02, WF-05 twice, WF-08, WF-09) and four warnings; sample 2 has seven findings, including three unpinned actions and two `latest` versions; sample 3 has one: `WF-01 Not valid YAML (mapping values are not allowed here)`.

2. **Check the sample workflow:** `python python/workflow_lint.py workflow/drift-pipeline.yml`. Exit `0`: `0 finding(s), 0 warning(s)`.

3. **Print a cloud's hosts:** `python python/drift_pipeline.py cloud --name dod`. The authority is `https://login.microsoftonline.us`, the Graph host `https://dod-graph.microsoft.us`, the Azure environment `AzureUSGovernment`. Try `--name usgov`: exit `1`, unknown cloud.

4. **Record a baseline and package it:**

   ```bash
   PREV=tests/fixtures/runs/previous/2026-10-28-0617-fixture-runner-fixture
   CURR=tests/fixtures/runs/current/2026-10-29-0617-fixture-runner-fixture
   P="--provenance hcm-entra=tests/fixtures/provenance/hcm-entra/provenance.json --provenance machine-configuration=tests/fixtures/provenance/machine-configuration/provenance.json --provenance dynamic-rules=tests/fixtures/provenance/dynamic-rules/check-results.json"
   python python/drift_pipeline.py compare --current $PREV --out out/day1
   python python/drift_pipeline.py package --kit-run $PREV --diff out/day1/drift-report.json $P --out out/evidence
   ```

   The compare exits `2` with `"baseline": true` and ten new findings. The package's `evidence_manifest_sha256` is `968fe4ea…`.

5. **Compare the next day:**

   ```bash
   python python/drift_pipeline.py compare --previous $PREV --current $CURR --out out/day2
   cat out/day2/drift-summary.md
   ```

   Exit `2`: new 3, resolved 1, changed 1, detail only 1, unchanged 6, unverified checks 2. The table shows VK-CA-01 `Pass` to `Fail`, VK-NPI-03 `Fail` to `Error`, and VK-PIV-01 `Pass` to `not run`. VK-NPI-03's finding is unverified, not resolved: its read failed with a 403.

6. **Draft the findings:**

   ```bash
   python python/drift_pipeline.py issues --diff out/day2/drift-report.json --out out/day2/issues.json
   ```

   `{"close": 2, "comment": 0, "open": 6}`: three new findings, one changed (VK-ARC-02, whose issue text moved from the agent version to "Status Disconnected"), two unverified checks, and two closes, one for `frank` (resolved) and one for the superseded VK-ARC-02 row. Search `issues.json` for `gina@contoso.example`: it isn't there. Her object ID is.

7. **Package and verify the second run, chained to the first:**

   ```bash
   python python/drift_pipeline.py package --kit-run $CURR --diff out/day2/drift-report.json $P \
     --previous-manifest out/evidence/2026-10-28-0617-fixture-runner-fixture/EVIDENCE-MANIFEST.json --out out/evidence
   python python/drift_pipeline.py verify out/evidence/2026-10-29-0617-fixture-runner-fixture
   (cd out/evidence/2026-10-29-0617-fixture-runner-fixture && sha256sum -c --quiet SHA256SUMS)
   ```

   The manifest hash is `6668a0ff…`, `verify` reports 16 files, and `sha256sum` exits `0`. Open `EVIDENCE-MANIFEST.json`: `previous.evidence_manifest_sha256` is the day 1 hash, `968fe4ea…`.

8. **Break it on purpose.** Append a line to `out/evidence/2026-10-29-0617-fixture-runner-fixture/drift/drift-summary.md` and run `verify` again: exit `1`, `drift/drift-summary.md doesn't match its SHA-256`. Then swap the runs: `compare --previous $CURR --current $PREV` exits `1`: the current run isn't later than the previous one.

9. **Run the tests:** `python -m pytest tests -q`.

**Expected result:** 64 tests passing, and each row of the gap table seen with your own eyes.

## Lab 2: test tenant and test subscription

Use a test tenant and a test subscription, never production, and a private test repository, `contoso-example/estate-checks`, holding the validation kit and this example.

1. **Register the app and trust the repository.** Register an app in the test tenant. With Application Administrator, Cloud Application Administrator or ownership of the app,[^c09-fic] add a federated credential with Learn's command, `az ad app federated-credential create --id <app-object-id> --parameters credential.json`, where `credential.json` has the issuer `https://token.actions.githubusercontent.com`, the subject `repo:contoso-example/estate-checks:environment:drift-gcc` and the audience `api://AzureADTokenExchange`.[^c09-fic] In GCC High or DoD, the audience is `api://AzureADTokenExchangeUSGov`.[^c09-mi-trust] Learn warns that a wrong subject is accepted without error and only fails at sign-in, and that a new credential can take a few minutes to propagate (`AADSTS70021`).[^c09-fic-limits]
2. **Grant only the reads.** Grant the app the Graph application permissions the app-capable checks need, with admin consent; `Get-VkRequiredScope` prints them ([Chapter 03](03-writing-a-validation-kit-check.md)). Assign Reader on the test subscription for the Arc checks.
3. **Make the evidence container.** In the test subscription, create a storage account and a container, `drift-evidence`, and assign **Storage Blob Data Contributor** on the container to the app; the upload uses `--auth-mode login`.[^c09-blob-cli] Add a time-based retention policy to the container and **leave it unlocked**. Learn says an unlocked policy is for testing and can be deleted; a locked one can't be deleted or shortened, and blocks deleting the account while any blob is retained.[^c09-immutable][^c09-immutable-container]
4. **Set up the repository.** Create the `drift-gcc` environment, limited to the default branch. Add the secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` and `AZURE_SUBSCRIPTION_ID`, the variables `EVIDENCE_STORAGE_ACCOUNT`, `AZ_PS_VERSION` and `GRAPH_PS_VERSION` (exact versions), and the labels `drift`, `new`, `changed`, `unverified` and `baseline`. Copy the workflow to `.github/workflows/drift.yml` in the test repository, and run `workflow_lint.py` on the copy.
5. **Run it by hand.** Start it from the Actions tab (`workflow_dispatch`). The first run is the baseline: one package in the container, one issue. Confirm that the Graph sign-in works with the SecureString token on the pinned Graph PowerShell version: Learn's pages disagree on that parameter's type (see the verified facts).
6. **Make a change and run again.** Create an enabled test member with no `employeeId` (VK-HR-01 reports it), then run the workflow. Expect one new finding and one issue, and a second package whose `previous` points at the first. Download it and run `sha256sum -c SHA256SUMS`.
7. **Let the schedule run.** GitHub runs a scheduled workflow on the latest commit of the default branch, may delay it under load, and, in a public repository, disables it after 60 days with no activity.[^c09-gh-events] Check the next day that a package arrived; a missing day is a break in the chain.
8. **Back it out.** Delete the federated credential (`az ad app federated-credential delete`),[^c09-fic] the app registration and its role assignments. Delete the unlocked retention policy, then the container. Close the test issues, and delete the test repository or its workflow and environment.

In production, lock the retention policy once Lab 2 passes. Learn recommends locking it within a reasonable time, typically less than 24 hours, and says an unlocked policy is only for short-term testing.[^c09-immutable]

## Verified facts

| Item | Value | Source |
|---|---|---|
| Sign-in from GitHub Actions | `azure/login` with `client-id`, `tenant-id`, `subscription-id` from secrets; the job needs `id-token: write` | [^c09-oidc] |
| Azure Login audience | Default `api://AzureADTokenExchange` for public clouds; set it for others; US Government sample uses `api://AzureADTokenExchangeUSGov` with `environment: AzureUSGovernment` | [^c09-oidc] [^c09-login-action] |
| Audiences per cloud | Global `api://AzureADTokenExchange`; US Government `api://AzureADTokenExchangeUSGov`; China `api://AzureADTokenExchangeChina` | [^c09-mi-trust] |
| Federated credential for GitHub | Issuer `https://token.actions.githubusercontent.com`; subject `repo:<org>/<repo>:environment:<name>` for a job with an environment; one audience; no wildcards | [^c09-fic] [^c09-gh-oidc] |
| Who can add one | The app's owner, Application Administrator, Cloud Application Administrator, Global Administrator or Hybrid Identity Administrator | [^c09-fic] |
| Limits | 20 federated credentials per app or user-assigned managed identity; issuer and subject unique per app; propagation can take minutes (`AADSTS70021`) | [^c09-fic-limits] |
| Graph hosts | GCC: `graph.microsoft.com`; GCC High: `graph.microsoft.us`; DoD: `dod-graph.microsoft.us`; US Government sign-in `login.microsoftonline.us`; tokens not interchangeable | [^c09-graph-clouds] |
| Graph PowerShell environments | `Global`, `USGov`, `USGovDoD`; `-AccessToken` typed `SecureString` | [^c09-mggraph] |
| Graph token from the Azure sign-in | `Get-AzAccessToken -AsSecureString -ResourceUrl <graph host>`; the URL must match the current Azure environment | [^c09-azaccesstoken] |
| Azure Pipelines alternative | Automatic workload identity app registration not for Azure US Government | [^c09-ado-wif] |
| Immutable evidence | Time-based retention, 1 to 146,000 days; locked policy can't be deleted or shortened; container policy extended at most five times; unlocked is for testing | [^c09-immutable] [^c09-immutable-container] |
| Writing evidence | Storage Blob Data Contributor; `az storage blob` data commands with `--auth-mode login` | [^c09-blob-cli] |
| Schedule | Default branch, latest commit; every 5 minutes at most; can be delayed under load; UTC by default; disabled after 60 days without activity in a public repository | [^c09-gh-events] |
| Artifact retention | `retention-days` can't exceed the repository, organization or enterprise limit | [^c09-gh-artifacts] |
| Release stage | Azure Login v3.1.0 (September 10, 2026), runs on Node 24; flexible federated identity credentials are a preview and aren't used here | [^c09-login-action] [^c09-fic] |

Three places where sources state things differently, recorded so a later edit doesn't loosen the code:

- **Graph token type.** `Connect-MgGraph`'s reference page types `-AccessToken` as `SecureString`;[^c09-mggraph] a Learn troubleshooting article says Microsoft Graph PowerShell 2.28.0 and later accept only a plain string.[^c09-idx14102] The workflow passes the `SecureString`, which keeps the token out of plain text, and Lab 2 step 5 confirms it on the pinned version.
- **Issuer with a trailing slash.** Learn's federated credential page shows the GitHub issuer both with and without a trailing slash in its examples.[^c09-fic] It also says the issuer must match the token's `iss` claim, which GitHub documents without the slash.[^c09-gh-oidc] The lab uses the form without the slash.
- **Pull request subject.** Learn writes the pull request subject as `repo:<org>/<repo>:pull-request`;[^c09-fic] GitHub documents `pull_request`.[^c09-gh-oidc] The pipeline doesn't run on pull requests, so it uses neither.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A failed read reported as a fix | A 403 makes yesterday's findings disappear, and their issues close | `Error`, `NotApplicable` and "not run" leave findings unverified; only a check that read the tenant resolves them |
| A run edited after the kit wrote it | The comparison, and the evidence, describe a run that never happened | `load_run()` checks every file against the kit's own manifest; `verify()` checks the package |
| Comparing a fixture run with a live one, or two clouds | Every finding looks new or resolved | `compare()` refuses a different mode or cloud, or runs out of order |
| A threshold changed between runs | Findings move with no change in the tenant | Changed options are noted in the report |
| A secret in the pipeline | It leaks, or expires and the checks stop | A federated credential; WF-06 fails `creds`; no secret is stored |
| A moved action tag | Code you didn't review signs in to your tenant | Actions pinned to commits (WF-05); source watch on Azure Login |
| The wrong Graph host in DoD | The run signs in to Azure Government and calls the GCC High Graph host | Cloud table; WF-12 checks the workflow's host against its cloud |
| A subject that doesn't match | Sign-in fails, and Learn says the credential was created without error | An environment-scoped subject; Lab 2 step 5 run by hand first |
| The token that reads the tenant can write elsewhere | A compromised step edits issues, or more | Two jobs; WF-04 fails a job with `id-token: write` and another write grant |
| Names in the tracker | User principal names reach everyone with read access to the repository | Object IDs only, unless `--include-names` |
| Evidence changed or deleted later | The ISSO can't rely on it | `--overwrite` never used; a locked retention policy in production; the hash chain |
| A day without a run | A schedule delayed, dropped or disabled leaves a gap nobody notices | The chain records the previous run; check the newest package's date |
| Stale provenance | A package cites a build or HR run from months ago | Provenance older than 30 days is noted in the manifest |
| A locked policy in a test account | The test account can't be deleted until retention ends | Lab 2 leaves the policy unlocked |

## Checklist

- [ ] The workflow passes `workflow_lint.py` with no findings, and every action is pinned to a commit.
- [ ] The app has a federated credential whose subject is the pipeline's environment, and no client secret or certificate.
- [ ] The app has only the Graph read permissions and Azure Reader the selected checks need.
- [ ] The cloud in the workflow, the Azure environment, the audience and the Graph host agree (`cloud --name` prints them).
- [ ] The job that signs in has no write grant besides `id-token`; the job that writes issues has no Azure access.
- [ ] A check that errors leaves its findings open; issues close only on a run that read the tenant.
- [ ] Issue bodies carry object IDs, not names.
- [ ] Each package verifies with `sha256sum -c SHA256SUMS`, and its `previous` hash matches the package before it.
- [ ] The evidence container has a locked time-based retention policy in production, and the pipeline never overwrites.
- [ ] Someone checks that a package arrived every day.
- [ ] The pinned Learn page and `action.yml` match their manifests, and every upstream commit since the pin has been reviewed.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 07 — Machine Configuration Packages](07-machine-configuration-packages.md) · [Book index](index.md)
:::

[^c09-oidc]: Microsoft Learn, "Use the Azure Login action with OpenID Connect," <https://learn.microsoft.com/azure/developer/github/connect-from-azure-openid-connect> (accessed Oct 30, 2026).
[^c09-oidc-code]: Microsoft, MicrosoftDocs/azure-dev-docs, `articles/github/connect-from-azure-openid-connect.md` at commit `23900ce00d955ff876f1a2df6a00d52f1a2f3df3` (October 28, 2026), code under the MIT License, <https://github.com/MicrosoftDocs/azure-dev-docs/blob/23900ce00d955ff876f1a2df6a00d52f1a2f3df3/articles/github/connect-from-azure-openid-connect.md> (accessed Oct 30, 2026); pinned copy in `examples/third_party/azure-login-oidc-sample`.
[^c09-login-action]: Microsoft, Azure/login, `action.yml` at release v3.1.0, commit `a641126d1b8aa4d1fa005f4f92df94a3a4c4c906` (September 10, 2026), MIT License, <https://github.com/Azure/login/blob/a641126d1b8aa4d1fa005f4f92df94a3a4c4c906/action.yml>, and its releases page, <https://github.com/Azure/login/releases> (accessed Oct 30, 2026); pinned copy in `examples/third_party/azure-login-action`. Learn has no page for the action's inputs beyond the sample.
[^c09-fic]: Microsoft Learn, "Configure an app to trust an external identity provider," <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust> (accessed Oct 30, 2026).
[^c09-fic-limits]: Microsoft Learn, "Important considerations and restrictions for federated identity credentials," <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-considerations> (accessed Oct 30, 2026).
[^c09-mi-trust]: Microsoft Learn, "Configure an application to trust a managed identity," <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-config-app-trust-managed-identity> (accessed Oct 30, 2026).
[^c09-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
[^c09-mggraph]: Microsoft Learn, "Connect-MgGraph," <https://learn.microsoft.com/powershell/module/microsoft.graph.authentication/connect-mggraph?view=graph-powershell-1.0> (accessed Oct 30, 2026).
[^c09-azaccesstoken]: Microsoft Learn, "Get-AzAccessToken," <https://learn.microsoft.com/powershell/module/az.accounts/get-azaccesstoken> (accessed Oct 30, 2026).
[^c09-idx14102]: Microsoft Learn, "Microsoft Graph PowerShell throws error 'IDX14102: Unable to decode the header'," <https://learn.microsoft.com/troubleshoot/entra/entra-id/users-groups-entra-apis/unable-to-decode-header-error> (accessed Oct 30, 2026).
[^c09-ado-wif]: Microsoft Learn, "Connect to Azure with an Azure Resource Manager service connection," <https://learn.microsoft.com/azure/devops/pipelines/library/connect-to-azure?view=azure-devops> (accessed Oct 30, 2026).
[^c09-immutable]: Microsoft Learn, "Store business-critical blob data with immutable storage in a write once, read many (WORM) state," <https://learn.microsoft.com/azure/storage/blobs/immutable-storage-overview> (accessed Oct 30, 2026).
[^c09-immutable-container]: Microsoft Learn, "Configure immutability policies for containers," <https://learn.microsoft.com/azure/storage/blobs/immutable-policy-configure-container-scope> (accessed Oct 30, 2026).
[^c09-blob-cli]: Microsoft Learn, "Quickstart: Create, download, and list blobs with Azure CLI," <https://learn.microsoft.com/azure/storage/blobs/storage-quickstart-blobs-cli> (accessed Oct 30, 2026).
[^c09-gh-events]: GitHub Docs, "Events that trigger workflows" (`schedule`, `workflow_dispatch`), <https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows> (accessed Oct 30, 2026). Learn doesn't cover GitHub's scheduler.
[^c09-gh-oidc]: GitHub Docs, "OpenID Connect reference," <https://docs.github.com/en/actions/reference/security/oidc> (accessed Oct 30, 2026). Learn's Azure Login page points here for the token's claims.
[^c09-gh-secure]: GitHub Docs, "Secure use reference," <https://docs.github.com/en/actions/reference/security/secure-use> (accessed Oct 30, 2026).
[^c09-gh-artifacts]: GitHub Docs, "Store and share data with workflow artifacts," <https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/storing-and-sharing-data-from-a-workflow> (accessed Oct 30, 2026).
