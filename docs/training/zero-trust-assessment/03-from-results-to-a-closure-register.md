---
title: "Module 3: From results to a closure register"
description: "Guide Steps 7 and 8: normalize every result to Book 11's seven results with the kit, work the dispositions for what didn't run, record the review of each Investigate result, then open the closure register: one entry per finding with the closure chain's fields, routed to the page that remediates its family, weighed, and with each exception checked against its approver. Lab 1 runs two fictional runs through the kit; Lab 2 runs your test tenant's export. About 55 minutes, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 11"
series-order: 3
review-status: pending
last-reviewed: 2026-11-11
---
# Module 3: From results to a closure register {.unnumbered}

*Part of the [Zero Trust Assessment learning path](index.md). Guide [Step 7](../../books/guides/zero-trust-assessment-implementation.md#zta-step-7) and [Step 8](../../books/guides/zero-trust-assessment-implementation.md#zta-step-8). About 55 minutes.*

## Introduction (3 minutes)

A report that says "17 failed" can't be acted on. Someone has to decide which of those are real findings, who owns each, which page in the workbook remediates it, what comes first, and which are accepted for now and by whom. In this module the results kit does the mechanical part: it normalizes every result, lists what didn't run with what to do about it, and writes a closure-register entry per finding, routed and weighed. People do the rest, and the register shows where.

**The federal requirement.**

| Requirement | KSI | Evidence |
|---|---|---|
| CA-2, CA-7, CM-6: results normalized and counted honestly | KSI-PIY-RIS, KSI-MLA-EVC, KSI-SVC-ACM | `results.json`, `summary.json`, `dispositions.csv`, the reviews file |
| CA-5: each finding's planned remediation | None listed in Book 13, Appendix A | `register.json`, `register.csv` |
| RA-7: findings weighed against risk tolerance; exceptions approved by the right official | None listed | The weighting rationale; the exceptions file |

## Learning objectives (1 minute)

After this module, you'll be able to:

- normalize a Zero Trust Assessment export and read its counts by result and pillar;
- work the dispositions for results that are neither a pass nor a finding;
- record the review of an Investigate result;
- read a closure-register entry and say what is filled, what a person fills, and who decides closure;
- route a finding to its family's remediation page, and check an exception's approver.

## Prerequisites (1 minute)

- [Module 1](01-evidence-not-a-verdict.md). [Module 2](02-running-the-assessment-safely.md)'s Lab 2 for this module's Lab 2.
- Book 11, [Chapter 08, finding families](../../books/b11-zero-trust/08-close-before-you-assess.md#finding-families) and [Chapter 10, the closure chain](../../books/b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain). Read them in Unit 2.

## Unit 1: Normalize and dispose (8 minutes)

Read the guide's [Step 7](../../books/guides/zero-trust-assessment-implementation.md#zta-step-7). The kit writes each result twice, the tool's status and the normalized one, and never copies the tool's result text, which can name tenant objects. Everything that is neither a pass nor a finding lands in `dispositions.csv` with what to do: a licensing decision, a fix and re-run, a recorded reason, or a boundary finding. If the export comes from a version the kit's taxonomy wasn't reviewed for, or carries a status or reason it doesn't know, it says so, and counts that result as Unable-to-Evaluate rather than guessing.

## Unit 2: The register, the families and the weighting (12 minutes)

Read the guide's [Step 8](../../books/guides/zero-trust-assessment-implementation.md#zta-step-8), then Book 11's [finding families](../../books/b11-zero-trust/08-close-before-you-assess.md#finding-families) and [closure chain](../../books/b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain).

- **One entry per finding**, with the closure chain's fields: the finding and tool version, the attack path, the owner, the dependencies, the change, the pilot, the enforcement, the test, the evidence, the residual risk, the reassessment, the weighting and the closure decision. The kit fills what it knows from the tool and the family table and leaves placeholders for what a person decides. It never marks a finding ready for closure; the authorizing official or assessor decides.
- **Routing.** Each test ID routes to a finding family and the page that remediates it: emergency access to Book 04, Chapter 04; standing privilege to Book 04, Chapter 08; DDoS and WAF to the Azure Security Engineering guide; and so on. A finding no family covers is *unrouted* and goes to the program lead. In release 3.1.0, the email and collaboration threat-protection tests have no family yet.
- **Weighing.** The default priority is severity divided by effort, in buckets P1 to P4. The owner then weighs exploitability, blast radius, exposure, compensating controls, effort and dependency order, and writes why.
- **Exceptions.** An exception with an expiry is the CISO's; one without is a standing risk acceptance for the authorizing official. The kit marks each one a governed exception, a lapsed acceptance or a wrong approver.

## Exercise: Lab 1, fixtures, no tenant (25 minutes) {#zta-lab-1}
You normalize and register two fictional runs of a Contoso tenant, two weeks apart. Work in `examples/zta-results`, with PowerShell 7.1 or later. Keep the `out` folder: Module 4 uses it.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/zta-results`. Each step below says what it does and what to look for.

```powershell
# Step 1: Normalize the first run
./Invoke-ZtaNormalize.ps1 -ExportPath tests/fixtures/run-2026-10-27 -OutputPath out/run1

# Step 2: Read the dispositions
Import-Csv out/run1/dispositions.csv | Format-Table testId, normalized, skippedBecause

# Step 3: Write the register for the first run
./Invoke-ZtaRegister.ps1 -RunPath out/run1 -OutputPath out/run1-register

# Step 4: Read the top of the register
Import-Csv out/run1-register/register.csv | Select-Object -First 5 | Format-Table testId, family, bucket, priority, owner

# Step 5: Normalize the second run with the review recorded
Get-Content -Raw tests/fixtures/inputs/reviews.csv
./Invoke-ZtaNormalize.ps1 -ExportPath tests/fixtures/run-2026-11-10 -OutputPath out/run2 -ReviewsPath tests/fixtures/inputs/reviews.csv

# Step 6: Write the second register with the exceptions
Get-Content -Raw tests/fixtures/inputs/exceptions.csv
./Invoke-ZtaRegister.ps1 -RunPath out/run2 -OutputPath out/run2-register -ExceptionsPath tests/fixtures/inputs/exceptions.csv
Import-Csv out/run2-register/register.csv | Where-Object disposition -NE 'actionable' | Format-Table testId, disposition, exceptionApprover, exceptionExpires
```

:::

<!-- labs:end -->

1. **Normalize the first run.**

    ```powershell
    ./Invoke-ZtaNormalize.ps1 -ExportPath tests/fixtures/run-2026-10-27 -OutputPath out/run1
    ```

    Expected output:

    ```text
    Zero Trust Assessment 3.1.0: 33 tests
      Pass                        8
      Fail                       17
      Planned                     1
      Skipped-Licensing           2
      Skipped-Disconnected        1
      Skipped-Not-Applicable      2
      Unable-to-Evaluate          2
    Findings: 17 (1 Investigate)
    Written to out/run1: results.json, results.csv, summary.json, summary.md, dispositions.csv, manifest.json
    ```

    Sixteen tests the tool marked Failed and one Investigate make 17 findings. The eight that are neither are in their own columns.

2. **Read the dispositions.**

    ```powershell
    Import-Csv out/run1/dispositions.csv | Format-Table testId, normalized, skippedBecause
    ```

    Expected output:

    ```text
    testId normalized             skippedBecause
    ------ ----------             --------------
    21800  Planned                UnderConstruction
    21883  Skipped-Licensing      NotLicensedEntraWorkloadID
    24548  Unable-to-Evaluate
    25416  Skipped-Not-Applicable NotApplicable
    27018  Skipped-Not-Applicable NotApplicable
    35005  Skipped-Disconnected   NotConnectedToService
    41050  Unable-to-Evaluate     TimeoutReached
    61009  Skipped-Licensing      NoCompatibleLicenseFound
    ```

    `24548` ended in Error, and `41050` timed out: both are a run to fix, not a control to fail.

3. **Write the register for the first run.**

    ```powershell
    ./Invoke-ZtaRegister.ps1 -RunPath out/run1 -OutputPath out/run1-register
    ```

    Expected output:

    ```text
    Register: 17 findings  P1 3  P2 10  P3 4  P4 0
    Governed exceptions: 0
    WARNING: Unrouted (assign a family): 41032
    Written to out/run1-register: register.json, register.csv, manifest.json
    ```

    `41032`, the Safe Links test, has no finding family: the program lead routes it.

4. **Read the top of the register.**

    ```powershell
    Import-Csv out/run1-register/register.csv | Select-Object -First 5 | Format-Table testId, family, bucket, priority, owner
    ```

    Expected output:

    ```text
    testId family            bucket priority owner
    ------ ------            ------ -------- -----
    24824  device-compliance P1     80       Endpoint engineering
    25533  ddos-waf-exposure P1     80       Platform team, with network engineering
    41032  unrouted          P1     80       Zero Trust program lead, to route
    21837  device-compliance P2     48       Endpoint engineering
    21772  app-secrets       P2     40       Application owners, with the platform teams
    ```

    `21837` is the Investigate result: its severity is weighted down until a person confirms it.

5. **Normalize the second run with the review recorded.** The reviews file confirms the Investigate result.

    ```powershell
    Get-Content -Raw tests/fixtures/inputs/reviews.csv
    ./Invoke-ZtaNormalize.ps1 -ExportPath tests/fixtures/run-2026-11-10 -OutputPath out/run2 -ReviewsPath tests/fixtures/inputs/reviews.csv
    ```

    Expected output:

    ```text
    testId,decision,reviewer,reviewedOn,note
    21837,confirmed,Endpoint engineering (example),2026-11-11,The device limit is 50 and Book 05 sets 10

    Zero Trust Assessment 3.1.0: 34 tests
      Pass                       10
      Fail                       15
      Planned                     1
      Skipped-Licensing           2
      Skipped-Disconnected        3
      Skipped-Not-Applicable      2
      Unable-to-Evaluate          1
    Findings: 15 (1 Investigate)
    Written to out/run2: results.json, results.csv, summary.json, summary.md, dispositions.csv, manifest.json
    ```

6. **Write the second register with the exceptions.**

    ```powershell
    Get-Content -Raw tests/fixtures/inputs/exceptions.csv
    ./Invoke-ZtaRegister.ps1 -RunPath out/run2 -OutputPath out/run2-register -ExceptionsPath tests/fixtures/inputs/exceptions.csv
    Import-Csv out/run2-register/register.csv | Where-Object disposition -NE 'actionable' | Format-Table testId, disposition, exceptionApprover, exceptionExpires
    ```

    Expected output:

    ```text
    testId,approverRole,approvedOn,expires,rationale,compensatingControl
    25533,CISO,2026-10-30,2027-01-31,Public IPs move behind Front Door Premium in the January change window,DDoS infrastructure protection on the platform
    21885,ISSO,2026-09-01,,A legacy partner application keeps a localhost redirect URI,none

    Register: 15 findings  P1 1  P2 10  P3 4  P4 0
    Governed exceptions: 1
    WARNING: Exceptions to fix (lapsed or wrong approver): 21885
    Written to out/run2-register: register.json, register.csv, manifest.json

    testId disposition        exceptionApprover exceptionExpires
    ------ -----------        ----------------- ----------------
    25533  governed-exception CISO              2027-01-31
    21885  wrong-approver     ISSO
    ```

    The `21885` exception has no end date, so it is a standing risk acceptance: only the authorizing official can approve it.

## Exercise: Lab 2, your test tenant's export {#zta-lab-2}
*Not timed. Not run by the authors.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/zta-results`. Each step below says what it does and what to look for.

```powershell
# Step 1: Normalize the export
./Invoke-ZtaNormalize.ps1 -ExportPath <report-folder> -OutputPath out/lab2 -ReviewsPath <reviews-file>
Import-Csv out/lab2/dispositions.csv | Format-Table testId, normalized, skippedBecause

# Step 2: Write the register
./Invoke-ZtaRegister.ps1 -RunPath out/lab2 -OutputPath out/lab2-register -ExceptionsPath <exceptions-file>
Import-Csv out/lab2-register/register.csv | Format-Table testId, family, bucket, owner

# Step 4: Back it out
Remove-Item -Recurse -Force out/lab2, out/lab2-register
```

:::

<!-- labs:end -->

You run the same steps on the export from [Module 2](02-running-the-assessment-safely.md)'s Lab 2. Work in `examples/zta-results`, on the assessment host. You'll replace `<report-folder>` (Module 2's report folder), `<reviews-file>` and `<exceptions-file>` (your copies of `templates/reviews.template.csv` and `templates/exceptions.template.csv`, filled for your test tenant).

1. **Normalize the export.**

    ```powershell
    ./Invoke-ZtaNormalize.ps1 -ExportPath <report-folder> -OutputPath out/lab2 -ReviewsPath <reviews-file>
    Import-Csv out/lab2/dispositions.csv | Format-Table testId, normalized, skippedBecause
    ```

2. **Write the register.**

    ```powershell
    ./Invoke-ZtaRegister.ps1 -RunPath out/lab2 -OutputPath out/lab2-register -ExceptionsPath <exceptions-file>
    Import-Csv out/lab2-register/register.csv | Format-Table testId, family, bucket, owner
    ```

3. **Compare** the register with the report's pillar tabs: every Failed and Investigate test has an entry, and no Skipped test does. Note any unrouted test for your program lead.

4. **Back it out.** The outputs hold your test tenant's test results; delete them when you finish Module 4.

    ```powershell
    Remove-Item -Recurse -Force out/lab2, out/lab2-register
    ```

## Knowledge check (5 minutes)

1. A test the tool marked Error is counted as:
    a. a failure;
    b. Unable-to-Evaluate: fix the run, or verify by hand;
    c. a pass.

2. Who marks a register entry ready for closure?
    a. The kit, when the next run passes.
    b. The pillar owner, when the change record closes.
    c. The authorizing official, for a plan of action and milestones item, or the assessor, for an assessment finding; the register records who decided.

3. An exception has no expiry and was approved by the CISO. What does the kit report?
    a. A governed exception.
    b. A wrong approver: a standing exception is the authorizing official's decision.
    c. A lapsed acceptance.

4. Why does the Investigate result rank below other High-risk findings of the same effort?
    a. The kit weights Investigate below Failed until a review confirms it.
    b. Investigate tests are always Low risk.
    c. It doesn't; the order is alphabetical.

5. The Safe Links finding is unrouted. What happens to it?
    a. It is dropped from the register.
    b. It stays in the register, owned by the Zero Trust program lead, who routes it.
    c. It is counted as a pass until a family exists.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and Lab 1, step 2.
2. **c.** See Unit 2 and [Book 11, Chapter 10](../../books/b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain).
3. **b.** See Unit 2 and Lab 1, step 6.
4. **a.** See Lab 1, step 4, and `config/taxonomy.json`'s scoring.
5. **b.** See Unit 2 and Lab 1, step 3.
:::

## Summary (2 minutes)

You normalized two runs, worked their dispositions, recorded a review, and opened a closure register routed to the pages that remediate each family, with exceptions checked against their approvers. **Evidence an ISSO keeps from this module:** the normalized results and summary, the dispositions, the reviews and exceptions files, and the register.

::: {.callout-tip}
## Continue the path
[← Previous: Module 2](02-running-the-assessment-safely.md) · [Learning path](index.md) · [Next: Module 4, Reconcile, re-run and keep the evidence →](04-reconcile-re-run-and-keep-the-evidence.md)
:::
