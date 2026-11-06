---
title: "Module 10: Find drift and file the evidence"
description: "Gate G6 and workbook Chapter 10: run the register and the ownership check on a schedule, compare them with a baseline a reviewer approved by its SHA-256, find credentials added outside the pipeline from the audit log, read the review cycle, compare the AI use-case inventory vintages, and hand the ISSO hash-chained packages and a period summary they can check with sha256sum alone. About 75 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04, 17"
series-order: 10
review-status: approved
reviewed-sha256: 87e52d6518b059380c7ba222934f70125c2f734013795d5cc82a77dda751b38c
last-reviewed: 2026-11-03
---
# Module 10: Find drift and file the evidence {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). Gate G6 Lifecycle. Workbook [Chapter 10](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md). About 75 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.4/Training_NPI_Module_10.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_10_Narrated) (about 16 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_10_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-10/Training_NPI_Module_10_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-10/Training_NPI_Module_10_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_NPI_10_Drift_Evidence_Narrated).

## Introduction (3 minutes)

Every gate before this one ends in a state: an owner, a target, a credential, a scope. This module keeps that state true. A credential added by hand, a new consent grant, an app nobody has used in 90 days or an owner who left all show up as drift against a baseline someone approved.

Then the evidence has to reach the ISSO in a form they can trust without trusting you. Each run is packaged with a SHA-256 for every file and chained to the one before. The ISSO checks a package with `sha256sum` alone, and a period summary shows whether the checks ran every day with no gap.

**The federal requirement.** The guide's [Validate (G6 Lifecycle)](../../books/guides/non-person-identity-implementation.md#step-6-run-the-lifecycle) step names AC-2(3), AC-6(7), AU-6 and CA-7, with KSIs KSI-IAM-AAM, KSI-MLA-RVL and KSI-MLA-EVC. The workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| CM-2 Baseline Configuration; CM-3 | KSI-CMT-RMV, KSI-MLA-EVC, KSI-SVC-ACM (CM-2); KSI-CMT-RVP (CM-3) | `drift/baseline-candidate.json` and the approved SHA-256 |
| CA-7 Continuous Monitoring; AC-2 | KSI-MLA-EVC (CA-7); KSI-IAM-SNU (AC-2) | `drift/findings.json`, NPI-DRF-01 to -06 |
| AC-2(4); AU-6; SI-4 System Monitoring | KSI-MLA-LET, KSI-MLA-RVL; KSI-IAM-SUS (SI-4) | `drift/events.json`; NPI-DRF-07 and -08 |
| AC-2(3) Disable Accounts | KSI-IAM-AAM | `drift/signin-activity.json`; NPI-DRF-04 |
| AC-6(7) Review of User Privileges | KSI-IAM-AAM, KSI-IAM-JIT | `drift/review-cycle.json`; NPI-REV-01 to -04 |
| AU-9; SI-7 | KSI-MLA-OSM (AU-9); KSI-SVC-VRI (SI-7) | `EVIDENCE-MANIFEST.json`, `SHA256SUMS`, `summary.md`; `PERIOD-MANIFEST.json` |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain why the drift run compares with a baseline only when a reviewer approved its SHA-256;
- read the drift findings, and say when a credential counts as added inside the pipeline;
- compare two AI use-case inventory vintages against the register;
- package two runs, chained, verify a package with `sha256sum`, and assemble a period for the ISSO;
- show that an edited file and a package chained out of order are both refused.

## Prerequisites (1 minute)

- [Module 1](01-inventory.md) and [Module 2](02-owners-and-the-orphan-rule.md): the drift run runs Chapters 01 and 02 unchanged.
- [Module 4](04-credential-rules.md): the rotation pipeline's credential log decides what counts as inside the pipeline.
- [Module 9](09-ai-agent-identities.md), for the sponsor attestations and the vintage comparison.

## Unit 1: The gate and the evidence (8 minutes)

Read the guide's [Step 6](../../books/guides/non-person-identity-implementation.md#step-6-run-the-lifecycle): owner change, orphans, access reviews of owners, and disable first, then delete. Then read the guide's [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) section: run the checks on the continuous monitoring cadence and file their output with the date, the tenant and the check version.

## Unit 2: Drift against an approved baseline (12 minutes)

Read the workbook chapter in this order:

- [What the evidence has to show](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#what-the-evidence-has-to-show): state, events and drift.
- [The approved baseline](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#the-approved-baseline): a fingerprint over 20 governance columns.
- [The register drift findings](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#the-register-drift-findings): NPI-DRF-01 to -09, and what "inside the pipeline" means.
- [The review cycle](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#the-review-cycle) and [the annual vintage comparison](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#the-annual-vintage-comparison).

## Unit 3: What the ISSO receives (8 minutes)

- [The package and the chain](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#the-package-and-the-chain): what the packager checks before it writes, and why it doesn't sign.
- [What the ISSO receives](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#what-the-isso-receives): the period, the controls table and the Gate 7 table.

## Exercise: Lab 1, fixtures, no tenant (30 minutes)

This is the workbook's [Chapter 10, Lab 1](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#lab-1-fixtures-no-tenant), which explains each result. Steps 1 to 6 run in `examples/non-person-identity` in PowerShell 7. Steps 7 to 10 run in `examples/drift-pipeline` in a POSIX shell (Git Bash on Windows). Step 11 runs in both. The tenant is fictional.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

In PowerShell 7:

```powershell
# Step 1: Run Microsoft's rule over the fixture
Invoke-Pester -Path tests/NpiDrift.Tests.ps1 -FullNameFilter '*as published*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 2: List what the run needs
Import-Module ./powershell/NpiDrift/NpiDrift.psm1
(Get-NpiDriftPermission -Task drift-run).GraphPermissions -join ', '

# Step 3: Run the first day, with no baseline
$lab = @{ Cloud = 'gcc'; TenantId = 'c0ffee00-0000-4000-8000-000000000001'; OutputPath = 'out/runs'; InputPath = 'tests/fixtures/inputs'
    AuditFixturePath = 'tests/fixtures/ch10/audit.json'; SignInFixturePath = 'tests/fixtures/ch10/signin-activity.json'
    ContractPath = 'tests/fixtures/ch10/contract'; PipelineIdentitiesPath = 'tests/fixtures/ch10/inputs/pipeline-identities.csv' }
./Invoke-NpiDriftRun.ps1 @lab -FixturePath tests/fixtures/ch10/estate-day1.json -AsOf 2026-10-29T06:00:00Z

# Step 4: Approve the baseline and run the second day
$base = 'out/runs/2026-10-29T0600Z-fixture/drift/baseline-candidate.json'
$sha = (Get-FileHash $base -Algorithm SHA256).Hash.ToLower()
./Invoke-NpiDriftRun.ps1 @lab -FixturePath tests/fixtures/ch10/estate-day2.json -AsOf 2026-10-30T06:00:00Z -BaselinePath $base -ApprovedBaselineSha256 $sha

# Step 5: Read the drift
Get-Content out/runs/2026-10-30T0600Z-fixture/drift/findings.json -Raw | ConvertFrom-Json | Group-Object Rule, Severity | Sort-Object Name | Format-Table Name, Count

# Step 6: Compare the AI use-case inventory vintages
./Invoke-NpiVintage.ps1 -RegisterRun out/runs/2026-10-30T0600Z-fixture/inventory -Vintage 2026 `
    -CurrentPath tests/fixtures/ch10/vintage/ai-inventory-2026.csv -PriorPath tests/fixtures/ch10/vintage/ai-inventory-2025.csv `
    -UseCaseMapPath tests/fixtures/ch10/vintage/ai-use-cases.csv -ServiceRecordsPath tests/fixtures/inputs/service-records.csv -OutputPath out/vintage
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 7: Package both days, chained
cd examples/drift-pipeline
DAY1=tests/fixtures/npi-runs/2026-10-29T0600Z-fixture
DAY2=tests/fixtures/npi-runs/2026-10-30T0600Z-fixture
python python/npi_evidence.py package --run $DAY1 --out out/evidence
python python/npi_evidence.py package --run $DAY2 \
  --previous-manifest out/evidence/2026-10-29T0600Z-fixture/EVIDENCE-MANIFEST.json --out out/evidence

# Step 8: Verify the second package
python python/npi_evidence.py verify out/evidence/2026-10-30T0600Z-fixture
(cd out/evidence/2026-10-30T0600Z-fixture && sha256sum -c --quiet SHA256SUMS)
grep -c contoso out/evidence/2026-10-30T0600Z-fixture/summary.md

# Step 9: Assemble the period for the ISSO, with the vintage
python python/npi_evidence.py period --evidence out/evidence --since 2026-10-28T06:00:00Z --until 2026-10-30T06:00:00Z \
  --vintage tests/fixtures/npi-vintage/vintage-2026 --out out/periods
cat out/periods/period-2026-10-28_2026-10-30/period-summary.md

# Step 10: Break it on purpose
echo edited >> out/evidence/2026-10-30T0600Z-fixture/summary.md
python python/npi_evidence.py verify out/evidence/2026-10-30T0600Z-fixture
python python/npi_evidence.py package --run $DAY1 --previous-manifest out/evidence/2026-10-30T0600Z-fixture/EVIDENCE-MANIFEST.json --out out/swap
python python/workflow_lint.py workflow/npi-evidence.yml
```

In PowerShell 7:

```powershell
# Step 11: Run the tests
Invoke-Pester -Path tests
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 11: Run the tests
python -m pytest tests -q
```

In PowerShell 7:

```powershell
# After the steps
Remove-Item -Recurse -Force out
```

In a POSIX shell (Git Bash on Windows):

```bash
# After the steps
rm -rf out
```

:::

<!-- labs:end -->

1. **Run Microsoft's rule over the fixture:**

    ```powershell
    Invoke-Pester -Path tests/NpiDrift.Tests.ps1 -FullNameFilter '*as published*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expect `PassedCount 11`, `FailedCount 0`, `NotRunCount 40`.

2. **List what the run needs:**

    ```powershell
    Import-Module ./powershell/NpiDrift/NpiDrift.psm1
    (Get-NpiDriftPermission -Task drift-run).GraphPermissions -join ', '
    ```

    Expect `Application.Read.All, AuditLog.Read.All, Directory.Read.All, User.Read.All`. Nothing ends in `ReadWrite`.

3. **Run the first day, with no baseline:**

    ```powershell
    $lab = @{ Cloud = 'gcc'; TenantId = 'c0ffee00-0000-4000-8000-000000000001'; OutputPath = 'out/runs'; InputPath = 'tests/fixtures/inputs'
        AuditFixturePath = 'tests/fixtures/ch10/audit.json'; SignInFixturePath = 'tests/fixtures/ch10/signin-activity.json'
        ContractPath = 'tests/fixtures/ch10/contract'; PipelineIdentitiesPath = 'tests/fixtures/ch10/inputs/pipeline-identities.csv' }
    ./Invoke-NpiDriftRun.ps1 @lab -FixturePath tests/fixtures/ch10/estate-day1.json -AsOf 2026-10-29T06:00:00Z
    ```

    Expect `inventory OK, ownership OK, drift OK`, `baseline none: this run is a baseline candidate`, and `Drift findings: 14 Finding, 4 Warn, 5 Info; baseline candidate SHA-256 604ee088ae43a964072671234833aeb71bccd082fa9ce4032a55d2fc4b146cc8`.

4. **Approve the baseline and run the second day:**

    ```powershell
    $base = 'out/runs/2026-10-29T0600Z-fixture/drift/baseline-candidate.json'
    $sha = (Get-FileHash $base -Algorithm SHA256).Hash.ToLower()
    ./Invoke-NpiDriftRun.ps1 @lab -FixturePath tests/fixtures/ch10/estate-day2.json -AsOf 2026-10-30T06:00:00Z -BaselinePath $base -ApprovedBaselineSha256 $sha
    ```

    Expect `baseline 2026-10-29T0600Z-fixture (604ee088ae43…)` and `Drift findings: 18 Finding, 11 Warn, 5 Info`. In a real run, a second person reviews the candidate and passes you its hash.

5. **Read the drift:**

    ```powershell
    Get-Content out/runs/2026-10-30T0600Z-fixture/drift/findings.json -Raw | ConvertFrom-Json | Group-Object Rule, Severity | Sort-Object Name | Format-Table Name, Count
    ```

    Expect twelve rows. `NPI-DRF-07, Finding 3` holds the three credentials added outside the pipeline. The pipeline's two certificate rotations aren't there: both are by a listed identity and in the credential log. `NPI-DRF-08, Finding 1` is Mail Automation's new grant for all users.

6. **Compare the AI use-case inventory vintages:**

    ```powershell
    ./Invoke-NpiVintage.ps1 -RegisterRun out/runs/2026-10-30T0600Z-fixture/inventory -Vintage 2026 `
        -CurrentPath tests/fixtures/ch10/vintage/ai-inventory-2026.csv -PriorPath tests/fixtures/ch10/vintage/ai-inventory-2025.csv `
        -UseCaseMapPath tests/fixtures/ch10/vintage/ai-use-cases.csv -ServiceRecordsPath tests/fixtures/inputs/service-records.csv -OutputPath out/vintage
    ```

    Expect `Vintage 2026: 5 changes (1 AuthorizationChanged, 1 Left, 2 New, 1 Retired); findings 3 Finding, 2 Warn, 1 Info`.

7. **Package both days, chained.** Open a second shell, a POSIX shell, at the root of your copy of the repository. Steps 7 to 10 run in `examples/drift-pipeline`, in that shell; step 11 runs in both. The runs are the repository's copies of the two you just made:

    ```bash
    cd examples/drift-pipeline
    DAY1=tests/fixtures/npi-runs/2026-10-29T0600Z-fixture
    DAY2=tests/fixtures/npi-runs/2026-10-30T0600Z-fixture
    python python/npi_evidence.py package --run $DAY1 --out out/evidence
    python python/npi_evidence.py package --run $DAY2 \
      --previous-manifest out/evidence/2026-10-29T0600Z-fixture/EVIDENCE-MANIFEST.json --out out/evidence
    ```

    Expect two lines of JSON. The second ends `"new": 19, "open": 80, "package": "2026-10-30T0600Z-fixture", "resolved": 1}`.

8. **Verify the second package:**

    ```bash
    python python/npi_evidence.py verify out/evidence/2026-10-30T0600Z-fixture
    (cd out/evidence/2026-10-30T0600Z-fixture && sha256sum -c --quiet SHA256SUMS)
    grep -c contoso out/evidence/2026-10-30T0600Z-fixture/summary.md
    ```

    Expect `"files": 21` from `verify`, no output from `sha256sum` (it exits 0), and `0` from `grep`: no user principal name in the summary.

9. **Assemble the period for the ISSO, with the vintage:**

    ```bash
    python python/npi_evidence.py period --evidence out/evidence --since 2026-10-28T06:00:00Z --until 2026-10-30T06:00:00Z \
      --vintage tests/fixtures/npi-vintage/vintage-2026 --out out/periods
    cat out/periods/period-2026-10-28_2026-10-30/period-summary.md
    ```

    It exits `2`, with `"chain_breaks": 0, "closed": 1, "complete": false, "coverage_gaps": 0, "opened": 19, "packages": 2`. The summary shows AC-2 incomplete without Chapter 03's findings.

10. **Break it on purpose:**

    ```bash
    echo edited >> out/evidence/2026-10-30T0600Z-fixture/summary.md
    python python/npi_evidence.py verify out/evidence/2026-10-30T0600Z-fixture
    python python/npi_evidence.py package --run $DAY1 --previous-manifest out/evidence/2026-10-30T0600Z-fixture/EVIDENCE-MANIFEST.json --out out/swap
    python python/workflow_lint.py workflow/npi-evidence.yml
    ```

    `verify` exits `1`: `summary.md doesn't match its SHA-256`. The swapped package exits `1`: `this run (2026-10-29T06:00:00Z) isn't later than the previous package (2026-10-30T06:00:00Z)`. The workflow lints with `0 finding(s), 0 warning(s)`.

11. **Run the tests.** In `examples/non-person-identity`, in PowerShell:

    ```powershell
    Invoke-Pester -Path tests
    ```

    In `examples/drift-pipeline`, in the POSIX shell:

    ```bash
    python -m pytest tests -q
    ```

    Expect 513 Pester tests and 142 pytest tests passed.

Delete `out` in both folders when you're done. In `examples/non-person-identity`:

```powershell
Remove-Item -Recurse -Force out
```

In `examples/drift-pipeline`:

```bash
rm -rf out
```

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 10, Lab 2](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#lab-2-test-tenant). It has the exact commands.

- **You need:** a test tenant in the worldwide or GCC cloud with Microsoft Entra ID P1 or P2, never production, with fictional people; Chapter 01's test host; and Chapter 02's Lab 2 inputs.
- **What you do:** register a reader app with a certificate and the four read permissions, run a baseline and have it approved, make three changes by hand (two secrets and one consent grant), run the drift run, check the activity names against the admin center's audit log, then package and verify the test runs.
- **Back-out:** step 7 removes both secrets and the consent grant, removes the four permissions and the Reader assignment, deletes the reader app and its certificate, and deletes `out/runs-test` and the packages.

## Knowledge check (5 minutes)

1. When does the drift run compare with a baseline?
    a. Always, with the last run
    b. Only when it's passed a baseline whose SHA-256 a reviewer approved, for this tenant and cloud
    c. Only on the first of the month
    d. Never; it reports the state only
2. A certificate rotation appears in the audit log. When does it count as inside the pipeline?
    a. When a person made it during business hours
    b. When the initiator is a listed pipeline identity and the target and key ID are in the rotation pipeline's credential log
    c. When it's a certificate, not a secret
    d. Always, if it's on Deploy Bot
3. An app hasn't signed in for 120 days. What does the drift run do?
    a. Deletes it
    b. Disables it
    c. Raises NPI-DRF-04 as a Warn; nothing here writes, and retirement is the decommission process
    d. Nothing
4. You append a line to a packaged `summary.md` and run `verify`. What happens?
    a. It passes, because the summary isn't evidence
    b. It exits 1: `summary.md doesn't match its SHA-256`
    c. It rewrites the hash
    d. It warns and exits 0
5. Why does the period exit 2 on the fixtures?
    a. The chain is broken
    b. The evidence is incomplete: some chapters haven't sent their findings, so a control such as AC-2 is "evidence incomplete"
    c. There's a coverage gap
    d. The vintage failed

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [The approved baseline](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#the-approved-baseline).
2. **b.** Two independent records must agree. Taught in [The register drift findings](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#the-register-drift-findings).
3. **c.** Taught in [The register drift findings](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#the-register-drift-findings) and the chapter's [Dangers](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#dangers).
4. **b.** Taught in [The package and the chain](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#the-package-and-the-chain) and the chapter's [Lab 1](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#lab-1-fixtures-no-tenant).
5. **b.** Taught in [What the ISSO receives](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#what-the-isso-receives) and the chapter's [Lab 1](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#lab-1-fixtures-no-tenant).
:::

## Summary (2 minutes)

You ran two days of drift against an approved baseline, found three credentials added outside the pipeline, compared two AI inventory vintages, packaged and chained both days, assembled a period for the ISSO, and saw an edited file and a swapped package refused.

**The evidence an ISSO keeps** for G6: each day's package (`EVIDENCE-MANIFEST.json`, `SHA256SUMS`, `summary.md` and the run), the approved baseline's SHA-256, the vintage comparison, and the period's `PERIOD-MANIFEST.json` and `period-summary.md`, signed by the identity governance officer. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md#checklist).

**Next:** [Module 11: Deploy to test, then production](11-deploying-to-test-and-production.md).
