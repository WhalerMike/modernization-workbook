---
title: "Module 4: Reconcile, re-run and keep the evidence"
description: "Guide Steps 9 and 10: compare two runs and tell a fixed finding from one the tool simply didn't evaluate; reconcile with ScubaGear and, where the agency runs AWS, with AWS Security Hub CSPM through the setting and the NIST SP 800-53 control; set the cadence; and seal each run as timestamped, hashed, chained evidence the ISSO checks with sha256sum alone. Lab 1 compares the fictional runs, seals them and breaks the seal on purpose; Lab 2 re-runs your test tenant and compares. About 50 minutes, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 11"
series-order: 4
review-status: pending
last-reviewed: 2026-11-11
---
# Module 4: Reconcile, re-run and keep the evidence {.unnumbered}

*Part of the [Zero Trust Assessment learning path](index.md). Guide [Step 9](../../books/guides/zero-trust-assessment-implementation.md#zta-step-9) and [Step 10](../../books/guides/zero-trust-assessment-implementation.md#zta-step-10). About 50 minutes.*

**Watch:** the narrated deck for this module (about @@Training_ZTA_Module_4@@ minutes, captions): [▶ Watch](../../presentations/watch.html?v=Training_ZTA_Module_4_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_ZTA_Module_4_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-zta-module-4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-zta-module-4/Training_ZTA_Module_4_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-zta-module-4/Training_ZTA_Module_4_Narrated.vtt). The deck files join the next edition.

## Introduction (3 minutes)

A single run is a reading. A program needs the readings over time: which findings were fixed, which came back, and which only seemed to disappear because the run lost a connection. It also needs the Zero Trust Assessment's findings lined up with ScubaGear's, and, where the agency runs AWS, with Security Hub CSPM's, so one setting under one control is one finding with one owner. And it needs every run sealed so an assessor can check months later that the files are the ones the tool and the kit wrote. This module does all three.

**The federal requirement.**

| Requirement | KSI | Evidence |
|---|---|---|
| CA-7: assessment at a defined frequency, changes between runs analyzed; correlation across tools | KSI-MLA-EVC, KSI-SVC-ACM | Each `comparison.json`; the reconciliation table |
| AU-9 and AU-11: evidence protected and kept | KSI-MLA-OSM, KSI-SVC-VRI | `records/`, `records.csv`, `SHA256SUMS`, the exports |
| CA-5: the POA&M regenerated from each run | None listed | The register and the POA&M items |

## Learning objectives (1 minute)

After this module, you'll be able to:

- compare two runs and explain the five kinds of change, including *no longer evaluated*;
- say why runs from different tool versions aren't compared without a recorded review;
- reconcile a finding across the Zero Trust Assessment, ScubaGear and Security Hub CSPM through the control, and state what each tool can't see;
- set a cadence and seal a run's evidence package, then check it, and see a broken one fail.

## Prerequisites (1 minute)

- [Module 3](03-from-results-to-a-closure-register.md)'s Lab 1, whose `out` folder this module's Lab 1 uses.
- Book 11, [Chapter 10, Reconcile at the control](../../books/b11-zero-trust/10-evidence-not-verdicts.md#reconcile-at-the-control-not-tool-to-tool). Read it in Unit 2.

## Unit 1: Comparing runs (6 minutes)

Read the guide's [Step 10](../../books/guides/zero-trust-assessment-implementation.md#zta-step-10), first step. The comparison sorts every test into new, regressed, fixed, still open, no longer evaluated, changed or unchanged. *No longer evaluated* is the one that matters most: a finding that is now skipped, planned, unable to evaluate or missing isn't fixed, and counting it as fixed would turn a lost connection into remediation. A new tool release adds tests and moves every denominator, so the kit refuses to compare runs from different versions until someone records that they reviewed the change.

## Unit 2: Reconciling with ScubaGear and Security Hub CSPM (8 minutes)

Read the guide's [Step 9](../../books/guides/zero-trust-assessment-implementation.md#zta-step-9). Tools with different identifiers can't be matched to each other; each is matched to the setting and the NIST SP 800-53 control. CISA maps every SCuBA policy to SP 800-53 controls; AWS's Security Hub CSPM tags each control finding with its related requirements, such as `NIST.800-53.r5 AC-4`. Two cautions from the sources themselves: Security Hub CSPM's NIST standard supports only a subset of the framework's requirements, with automated checks only, and a control with no corresponding resources reports PASSED at the account level. Each tool sees only its own platform. Oracle Cloud Infrastructure's Cloud Guard and Google Cloud's Security Command Center play the same role on their clouds ([Book 12, Chapter 08](../../books/b12-security-operations/08-cloud-native-posture.md)).

## Unit 3: Cadence and the evidence package (6 minutes)

Read the cadence table in the guide's [Step 10](../../books/guides/zero-trust-assessment-implementation.md#zta-step-10): monthly, after each remediation wave, before a tool upgrade reaches production, and a quarterly trend review. Microsoft's Global Secure Access operations guidance includes a weekly scheduled digest; the guide explains the two cautions before adopting it as written. The evidence package for a run is the export's hash and the export, the normalized results, the dispositions, the reviews and exceptions with their hashes, the register, the comparison, and the chained records with `SHA256SUMS`.

## Exercise: Lab 1, fixtures, no tenant (20 minutes) {#zta-lab-1}
You compare Module 3's two runs, seal the second run's evidence, check it, then break it on purpose. Work in `examples/zta-results`, with PowerShell 7.1 or later, after Module 3's Lab 1.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/zta-results`. Each step below says what it does and what to look for.

```powershell
# Step 1: Compare the two runs
./Invoke-ZtaCompare.ps1 -PreviousPath out/run1 -CurrentPath out/run2 -OutputPath out/compare

# Step 2: Read what changed
(Get-Content -Raw out/compare/comparison.json | ConvertFrom-Json).rows | Where-Object change -In 'no-longer-evaluated', 'regressed', 'new' | Format-Table testId, change, previous, current

# Step 3: Seal the second run's evidence
./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -RunPath out/run2 -AsOf 2026-11-10T20:00:00Z
./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -RunPath out/run2-register -AsOf 2026-11-10T20:01:00Z
./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -RunPath out/compare -AsOf 2026-11-10T20:02:00Z

# Step 4: Check the package
./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -Check -Package re-run -RunDate 2026-11-10

# Step 5: Break it on purpose
Add-Content -Path out/evidence/runs/0002-register-2026-11-10/register.csv -Value 'edited'
./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -Check

# Step 6: Clean up
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Compare the two runs.**

    ```powershell
    ./Invoke-ZtaCompare.ps1 -PreviousPath out/run1 -CurrentPath out/run2 -OutputPath out/compare
    ```

    Expected output:

    ```text
      new                     2
      regressed               1
      fixed                   3
      still-open             12
      no-longer-evaluated     2
      changed                 2
      unchanged              12
    Written to out/compare: comparison.json, comparison.md, manifest.json
    ```

2. **Read what changed.**

    ```powershell
    (Get-Content -Raw out/compare/comparison.json | ConvertFrom-Json).rows | Where-Object change -In 'no-longer-evaluated', 'regressed', 'new' | Format-Table testId, change, previous, current
    ```

    Expected output:

    ```text
    testId change              previous           current
    ------ ------              --------           -------
    21783  regressed           Pass               Fail
    21860  no-longer-evaluated Fail               Skipped-Disconnected
    21941  new                 absent             Fail
    41032  no-longer-evaluated Fail               Skipped-Disconnected
    41050  new                 Unable-to-Evaluate Fail
    ```

    The second run lost its Azure and Exchange connections, so `21860` and `41032` weren't evaluated: they still need a run that connects. `41050` is new because the first run timed out on it, not because something broke.

3. **Seal the second run's evidence.**

    ```powershell
    ./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -RunPath out/run2 -AsOf 2026-11-10T20:00:00Z
    ./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -RunPath out/run2-register -AsOf 2026-11-10T20:01:00Z
    ./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -RunPath out/compare -AsOf 2026-11-10T20:02:00Z
    ```

    Expected output:

    ```text
    Record 1: Pass (NORMALIZE, EVIDENCE)
    Controls: AU-9, CA-2, CA-7, CM-6
    KSIs:     KSI-MLA-EVC, KSI-MLA-OSM, KSI-PIY-RIS, KSI-SVC-ACM, KSI-SVC-VRI
    Written to out/evidence: records/, runs/, records.csv, SHA256SUMS
    Record 2: Pass (REGISTER, EVIDENCE)
    Controls: AU-9, CA-5, CA-7, RA-7
    KSIs:     KSI-MLA-EVC, KSI-MLA-OSM, KSI-SVC-VRI
    Written to out/evidence: records/, runs/, records.csv, SHA256SUMS
    Record 3: Pass (COMPARE, EVIDENCE)
    Controls: AU-9, CA-7, CM-6
    KSIs:     KSI-CMT-RMV, KSI-MLA-EVC, KSI-MLA-OSM, KSI-SVC-ACM, KSI-SVC-VRI
    Written to out/evidence: records/, runs/, records.csv, SHA256SUMS
    ```

4. **Check the package.**

    ```powershell
    ./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -Check -Package re-run -RunDate 2026-11-10
    ```

    Expected output:

    ```text
    SUMS             Pass  16 files match SHA256SUMS
    CHAIN            Pass  3 records, chain unbroken
    STEP-NORMALIZE   Pass  a passing record covers it for 2026-11-10
    STEP-REGISTER    Pass  a passing record covers it for 2026-11-10
    STEP-COMPARE     Pass  a passing record covers it for 2026-11-10
    ```

5. **Break it on purpose.** Edit one file in the sealed package and check again.

    ```powershell
    Add-Content -Path out/evidence/runs/0002-register-2026-11-10/register.csv -Value 'edited'
    ./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -Check
    ```

    Expected output:

    ```text
    SUMS             Fail  runs/0002-register-2026-11-10/register.csv changed
    CHAIN            Fail  runs/0002-register-2026-11-10/register.csv doesn't match 0002-register-2026-11-10.json
    ```

6. **Clean up.**

    ```powershell
    Remove-Item -Recurse -Force out
    ```

## Exercise: Lab 2, a second run in your test tenant {#zta-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/zta-results`. Each step below says what it does and what to look for.

In PowerShell 7:

```powershell
# Step 2: Re-run the assessment and normalize it
New-Item -ItemType Directory -Path <report-folder-2>
Invoke-ZtAssessment -Path <report-folder-2> -DisableTelemetry -NoBrowser
./Invoke-ZtaNormalize.ps1 -ExportPath <report-folder-2> -OutputPath out/lab2-run2
./Invoke-ZtaRegister.ps1 -RunPath out/lab2-run2 -OutputPath out/lab2-run2-register

# Step 3: Compare and seal
./Invoke-ZtaCompare.ps1 -PreviousPath out/lab2 -CurrentPath out/lab2-run2 -OutputPath out/lab2-compare
./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/lab2-run2
./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/lab2-run2-register
./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/lab2-compare
./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -Check -Package re-run -RunDate <run-date>
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 4: Optional, where you have an AWS test account with Security Hub CSPM and its NIST SP 800-53 standard enabled
aws securityhub get-findings --region <region> \
  --filters '{"ComplianceAssociatedStandardsId":[{"Value":"standards/nist-800-53/v/5.0.0","Comparison":"EQUALS"}],"RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}' \
  --query 'Findings[].{control:Compliance.SecurityControlId,status:Compliance.Status,requirements:Compliance.RelatedRequirements}' \
  --output json > securityhub-nist.json
```

In PowerShell 7:

```powershell
# Step 5: Back it out
Remove-Item -Recurse -Force out, <report-folder-2>
```

:::

<!-- labs:end -->

You make one change in the test tenant that a finding from Module 3's Lab 2 points to, re-run the assessment, compare, and seal both runs. Work in `examples/zta-results`, on the assessment host, connected as in [Module 2](02-running-the-assessment-safely.md)'s Lab 2. You'll replace `<report-folder-2>` (a new, empty folder for the second run), `<evidence-folder>` (a protected folder), `<run-date>` (the second run's date, `yyyy-mm-dd`) and, for the optional AWS step, `<region>`.

1. **Make one change** that a finding in `out/lab2-register/register.csv` points to, in the test tenant, through the page its `remediationPage` names, under a change record.

2. **Re-run the assessment and normalize it.**

    ```powershell
    New-Item -ItemType Directory -Path <report-folder-2>
    Invoke-ZtAssessment -Path <report-folder-2> -DisableTelemetry -NoBrowser
    ./Invoke-ZtaNormalize.ps1 -ExportPath <report-folder-2> -OutputPath out/lab2-run2
    ./Invoke-ZtaRegister.ps1 -RunPath out/lab2-run2 -OutputPath out/lab2-run2-register
    ```

3. **Compare and seal.**

    ```powershell
    ./Invoke-ZtaCompare.ps1 -PreviousPath out/lab2 -CurrentPath out/lab2-run2 -OutputPath out/lab2-compare
    ./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/lab2-run2
    ./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/lab2-run2-register
    ./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/lab2-compare
    ./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -Check -Package re-run -RunDate <run-date>
    ```

    The finding you fixed shows as `fixed`. If it shows as `no-longer-evaluated`, the second run didn't connect to the service that test reads.

4. **Optional, where you have an AWS test account with Security Hub CSPM and its NIST SP 800-53 standard enabled:** pull its active NIST findings and add one row to the guide's reconciliation table for a control both platforms report.

    ```bash
    aws securityhub get-findings --region <region> \
      --filters '{"ComplianceAssociatedStandardsId":[{"Value":"standards/nist-800-53/v/5.0.0","Comparison":"EQUALS"}],"RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}' \
      --query 'Findings[].{control:Compliance.SecurityControlId,status:Compliance.Status,requirements:Compliance.RelatedRequirements}' \
      --output json > securityhub-nist.json
    ```

5. **Back it out.** Revert the test-tenant change under its change record if you don't keep it; then delete the outputs and both report folders, and finish Module 2's Lab 2 back-out.

    ```powershell
    Remove-Item -Recurse -Force out, <report-folder-2>
    ```

## Knowledge check (5 minutes)

1. A finding Failed last month and is Skipped-Disconnected this month. What is it?
    a. Fixed.
    b. No longer evaluated: not fixed; fix the run's connection and re-run.
    c. A new finding.

2. Two runs come from releases 3.1.0 and 3.2.0. What does the kit do?
    a. Compares them, because the tenant is the same.
    b. Refuses until someone records that they reviewed what changed between the versions.
    c. Converts the older run to the newer version.

3. A Security Hub CSPM control reports PASSED at the account level. What should you check?
    a. Nothing; PASSED is a pass.
    b. Whether any resource corresponds to the control: AWS produces an account-level PASSED when none does.
    c. Whether the Zero Trust Assessment also passed.

4. What does the ISSO need to check a sealed evidence folder without the kit?
    a. The kit and PowerShell.
    b. `sha256sum -c SHA256SUMS` in the folder.
    c. A login to the tenant.

5. A Zero Trust Assessment Failed and a ScubaGear Fail land on the same setting under the same control. How many findings is that?
    a. Two, one per tool.
    b. One finding with two pieces of evidence, routed to one owner; the ScubaGear finding carries the BOD 25-01 reporting.
    c. None, because the tools disagree on identifiers.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and Lab 1, step 2.
2. **b.** See Unit 1.
3. **b.** See Unit 2 and the guide's [Step 9](../../books/guides/zero-trust-assessment-implementation.md#zta-step-9).
4. **b.** See the guide's [Step 10](../../books/guides/zero-trust-assessment-implementation.md#zta-step-10), step 2.
5. **b.** See Unit 2 and [Book 11, Chapter 10](../../books/b11-zero-trust/10-evidence-not-verdicts.md#reconcile-at-the-control-not-tool-to-tool).
:::

## Summary (2 minutes)

You compared two runs and told a fix from a lost connection, reconciled across tools through the control, set a cadence, and sealed, checked and broke an evidence package. **Evidence an ISSO keeps from this module:** each comparison, the reconciliation table, and the chained records with `SHA256SUMS` and the exports, by the records schedule.

::: {.callout-tip}
## Continue the path
[← Previous: Module 3](03-from-results-to-a-closure-register.md) · [Learning path](index.md) · [The guide](../../books/guides/zero-trust-assessment-implementation.md)
:::
