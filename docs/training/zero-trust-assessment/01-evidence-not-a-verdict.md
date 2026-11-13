---
title: "Module 1: Evidence, not a verdict"
description: "Guide Steps 1 and 6: what Microsoft's Zero Trust Assessment checks, the four things it isn't (a verdict, a substitute for ScubaGear, a supported product, a detector), how to read its rubric and its six statuses, and why a skipped test is neither a failure nor a pass. Lab 1 reads a fictional export's statuses and skip reasons and normalizes them. About 40 minutes, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 11"
series-order: 1
review-status: pending
last-reviewed: 2026-11-11
---
# Module 1: Evidence, not a verdict {.unnumbered}

*Part of the [Zero Trust Assessment learning path](index.md). Guide [Step 1](../../books/guides/zero-trust-assessment-implementation.md#zta-step-1) and [Step 6](../../books/guides/zero-trust-assessment-implementation.md#zta-step-6). About 40 minutes.*

**Watch:** the narrated deck for this module (about @@Training_ZTA_Module_1@@ minutes, captions): [▶ Watch](../../presentations/watch.html?v=Training_ZTA_Module_1_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_ZTA_Module_1_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-zta-module-1) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-zta-module-1/Training_ZTA_Module_1_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-zta-module-1/Training_ZTA_Module_1_Narrated.vtt). The deck files join the next edition.

## Introduction (3 minutes)

The Zero Trust Assessment is a PowerShell module that tests a tenant against hundreds of configuration items drawn from Microsoft's configuration guidance for Entra, Intune, Azure networking and Purview. Release 3.1.0, the current release, holds 364 tests in seven pillars. It is read-only, it is free, and it is the assessment component of Microsoft's Zero Trust Workshop.

What it produces is a reading of the configuration on one day. In this module you learn what that reading can and can't tell you, and you see, on a fictional export, why the tool's six statuses have to be sorted before anyone counts them.

**The federal requirement.** Scoping and reading the assessment supports NIST SP 800-53 CA-2 (control assessments) and CA-7 (continuous monitoring). The full table is the guide's [Step 1](../../books/guides/zero-trust-assessment-implementation.md#zta-step-1).

| Requirement | KSI | Evidence |
|---|---|---|
| CA-2: plan the assessment and its scope | KSI-PIY-RIS | The approved decision record |
| CA-2: assessment results reviewed by the owners | KSI-PIY-RIS | Each pillar owner's reading notes |
| CA-7: the frequency of assessment | KSI-MLA-EVC | The calendar entry and its owner |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines its own evidence up with them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)).

## Learning objectives (1 minute)

After this module, you'll be able to:

- say what the Zero Trust Assessment checks and name the four things it isn't;
- explain why it doesn't replace ScubaGear under BOD 25-01;
- read the Risk Level, User Impact and Implementation Cost rubric;
- name the six statuses a test can end in, and sort a skip reason into Book 11's taxonomy.

## Prerequisites (1 minute)

- [Book 11, Chapter 05](../../books/b11-zero-trust/05-two-assessment-tools.md). Read it in Unit 1.
- PowerShell 7.1 or later, and the kit's folder `examples/zta-results`.

## Unit 1: What it checks, and what it isn't (8 minutes)

Read Book 11, [Chapter 05](../../books/b11-zero-trust/05-two-assessment-tools.md), sections *The two tools at a glance* and *Where they overlap, and where they don't*. Then read the guide's [Step 1](../../books/guides/zero-trust-assessment-implementation.md#zta-step-1). Four points to take away:

- **Not a verdict.** A finding is evidence for a decision a named person makes; a pass rate isn't a maturity stage.
- **Not a substitute for ScubaGear.** BOD 25-01 names CISA's SCuBA tools, and ScubaGear covers Exchange Online mail flow, Teams, SharePoint sharing and Power Platform, which the Zero Trust Assessment doesn't test.
- **Not a supported product.** It is a community project maintained by Microsoft employees, provided as is.
- **Not a detector.** Microsoft's own operations guidance calls it a configuration-posture check, to be paired with alerts.

The decision record in the guide's [template](../../books/guides/zero-trust-assessment-implementation.md#zta-decision-record) writes each of these down, with the scope, the run account, the cadence and the pinned version.

## Unit 2: Reading the report (8 minutes)

Read the guide's [Step 6](../../books/guides/zero-trust-assessment-implementation.md#zta-step-6). Each test carries three ratings from Microsoft's rubric: Risk Level (High means potential environment-wide exposure), User Impact (how many non-privileged users act or are told) and Implementation Cost (from targeted actions to programs). Each test ends in one of six statuses:

| Status | What it means |
|---|---|
| Passed | The configuration matched |
| Failed | It didn't |
| Investigate | The tool needs a person to look before it's a finding or not |
| Skipped | The test didn't run, with a reason: not licensed, not connected, not applicable, not supported, timed out |
| Planned | The test is still under construction in the tool |
| Error | The test couldn't be evaluated |

: The Zero Trust Assessment's statuses {.striped .hover}

A pillar owner reads their tab with those filters and notes every Investigate, Skipped and Error result, and every Failed result whose feature may not exist in the tenant's cloud. The guide's example: Microsoft's Exchange Online service description says impersonation protection and spoof intelligence aren't yet available in GCC High and DoD, so a failed impersonation test there is a boundary finding.

## Unit 3: Why skipped isn't failed (6 minutes)

Read Book 11, [Chapter 10, A normalized result taxonomy](../../books/b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy). The program records every result twice: the tool's value, unchanged, and one of seven normalized results. A test skipped for a missing license is a licensing decision; one skipped because a service wasn't connected is a gap in the run; neither is a failed control, and neither is a pass. Investigate counts as a finding until a person reviews it.

## Exercise: Lab 1, fixtures, no tenant (12 minutes) {#zta-lab-1}
You read a fictional export the way the kit does, and sort its statuses. Work in `examples/zta-results`, with PowerShell 7.1 or later. The export is `tests/fixtures/run-2026-10-27`: a fictional Contoso tenant, in the shape release 3.1.0 writes.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/zta-results`. Each step below says what it does and what to look for.

```powershell
# Step 1: Read the export's metadata
$e = Get-Content -Raw tests/fixtures/run-2026-10-27/zt-export/ZeroTrustAssessmentReport.json | ConvertFrom-Json
$e | Select-Object CurrentVersion, TenantName, @{ n = 'Tests'; e = { $_.Tests.Count } }, EndOfJson | Format-List

# Step 2: Count the tool's statuses
$e.Tests | Group-Object TestStatus -NoElement | Sort-Object Name | Format-Table Name, Count

# Step 3: List what didn't run, with its reason
$e.Tests | Where-Object TestStatus -In 'Skipped', 'Planned' | Sort-Object TestId | Format-Table TestId, TestStatus, TestSkipped

# Step 4: Sort the reasons into the taxonomy
Import-Module ./powershell/ZtaResults/ZtaResults.psm1
foreach ($s in 'NotLicensedEntraWorkloadID', 'NotConnectedToService', 'NotApplicable', 'TimeoutReached') { '{0,-28} {1}' -f $s, (ConvertTo-ZtaResult -Test @{ TestId = '0'; TestStatus = 'Skipped'; TestSkipped = $s }).normalized }
'{0,-28} {1}' -f 'Investigate', (ConvertTo-ZtaResult -Test @{ TestId = '0'; TestStatus = 'Investigate' }).normalized
```

:::

<!-- labs:end -->

1. **Read the export's metadata.** The file is the one the tool writes in its report folder, under `zt-export`.

    ```powershell
    $e = Get-Content -Raw tests/fixtures/run-2026-10-27/zt-export/ZeroTrustAssessmentReport.json | ConvertFrom-Json
    $e | Select-Object CurrentVersion, TenantName, @{ n = 'Tests'; e = { $_.Tests.Count } }, EndOfJson | Format-List
    ```

    Expected output:

    ```text
    CurrentVersion : 3.1.0
    TenantName     : Contoso
    Tests          : 33
    EndOfJson      : EndOfJson
    ```

    `EndOfJson` is the marker the tool writes last; a file without it is incomplete.

2. **Count the tool's statuses.**

    ```powershell
    $e.Tests | Group-Object TestStatus -NoElement | Sort-Object Name | Format-Table Name, Count
    ```

    Expected output:

    ```text
    Name        Count
    ----        -----
    Error           1
    Failed         16
    Investigate     1
    Passed          8
    Planned         1
    Skipped         6
    ```

    A pass rate taken from these numbers would divide 8 by a total that moves with licensing and connections. That is why the program doesn't report one.

3. **List what didn't run, with its reason.**

    ```powershell
    $e.Tests | Where-Object TestStatus -In 'Skipped', 'Planned' | Sort-Object TestId | Format-Table TestId, TestStatus, TestSkipped
    ```

    Expected output:

    ```text
    TestId TestStatus TestSkipped
    ------ ---------- -----------
    21800  Planned    UnderConstruction
    21883  Skipped    NotLicensedEntraWorkloadID
    25416  Skipped    NotApplicable
    27018  Skipped    NotApplicable
    35005  Skipped    NotConnectedToService
    41050  Skipped    TimeoutReached
    61009  Skipped    NoCompatibleLicenseFound
    ```

4. **Sort the reasons into the taxonomy** with the kit's own function.

    ```powershell
    Import-Module ./powershell/ZtaResults/ZtaResults.psm1
    foreach ($s in 'NotLicensedEntraWorkloadID', 'NotConnectedToService', 'NotApplicable', 'TimeoutReached') { '{0,-28} {1}' -f $s, (ConvertTo-ZtaResult -Test @{ TestId = '0'; TestStatus = 'Skipped'; TestSkipped = $s }).normalized }
    '{0,-28} {1}' -f 'Investigate', (ConvertTo-ZtaResult -Test @{ TestId = '0'; TestStatus = 'Investigate' }).normalized
    ```

    Expected output:

    ```text
    NotLicensedEntraWorkloadID   Skipped-Licensing
    NotConnectedToService        Skipped-Disconnected
    NotApplicable                Skipped-Not-Applicable
    TimeoutReached               Unable-to-Evaluate
    Investigate                  Fail
    ```

    Four skips, four different meanings, and none of them a failure. The Investigate result is a finding until someone reviews it ([Module 3](03-from-results-to-a-closure-register.md)).

## Knowledge check (5 minutes)

1. An agency already runs the Zero Trust Assessment monthly. Can it stop running ScubaGear?
    a. Yes: the Zero Trust Assessment covers identity, which is most of the SCuBA baselines.
    b. No: BOD 25-01 names CISA's SCuBA tools, and ScubaGear covers Exchange Online, Teams, SharePoint and Power Platform policies the Zero Trust Assessment doesn't test.
    c. Only in GCC High.

2. A test is Skipped with `NotLicensedEntraIDP2`. How is it counted?
    a. As a failed control.
    b. As a pass, because nothing was found.
    c. As Skipped-Licensing: a licensing decision, neither a failure nor a pass.

3. What does Investigate mean?
    a. The test failed and the tool wants a ticket opened.
    b. The tool needs a person to look; it counts as a finding until the review confirms or dismisses it.
    c. The test is under construction.

4. A failed anti-phishing impersonation test in a GCC High tenant is most likely:
    a. a boundary finding, because Microsoft's service description says the feature isn't yet available there;
    b. a configuration change to make today;
    c. a reason to report the tenant to CISA.

5. Which of these does the Zero Trust Assessment do?
    a. Detect an attack in real time.
    b. Read the tenant's configuration and compare it with Microsoft's guidance, without changing anything.
    c. Close a finding when the next run passes.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [Book 11, Chapter 05](../../books/b11-zero-trust/05-two-assessment-tools.md#where-they-overlap-and-where-they-dont) and Unit 1.
2. **c.** See Unit 3 and the guide's [Step 7](../../books/guides/zero-trust-assessment-implementation.md#zta-step-7).
3. **b.** See Unit 2.
4. **a.** See Unit 2 and the guide's [Step 6](../../books/guides/zero-trust-assessment-implementation.md#zta-step-6).
5. **b.** It is read-only and a posture check; closure is the authorizing official's or assessor's decision ([Book 11, Chapter 10](../../books/b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain)).
:::

## Summary (2 minutes)

You saw what the Zero Trust Assessment checks and what it isn't, read its rubric and statuses, and sorted a fictional export's skips into Book 11's taxonomy. **Evidence an ISSO keeps from this module:** the approved decision record, and each pillar owner's dated reading notes.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Next: Module 2, Running the assessment safely →](02-running-the-assessment-safely.md)
:::
