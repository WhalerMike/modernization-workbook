---
title: "Attribute-Driven Migration, Module 2: Write a Validation Kit Check"
subtitle: "Build and read VK-SYNC-02, the check that soft match and hard-match takeover are blocked, and learn why a read-only check still has to ask for the least privilege it can"
description: "Research draft: Module 2 of the Attribute-Driven Migration learning path. You learn the anatomy of a validation kit check, its catalog entry, its three severities, the default-to-unsafe rule and the safety tests, then run VK-SYNC-02 on the kit's fixtures and an export, see each of its outcomes and break it on purpose. Guide Gate 3; Book 19, Chapter 03."
research-status: draft
research-type: training module
research-book: "Book 19"
series-order: 2
date-modified: 2026-11-02
review-status: approved
reviewed-sha256: 175235376502d6a53d8348a0b886c260aa2efb33004d3cc6b0d1e2469654539e
last-reviewed: 2026-11-03
---
# Attribute-Driven Migration, Module 2: Write a Validation Kit Check {.unnumbered}

**Learning path:** [Building the Attribute-Driven Migration](index.md) · Module 2 of 9 · 45 minutes · Guide [Gate 3](../../books/guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync) · Workbook [Chapter 03](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-adm-module-2) (the deck files come with the next edition) · [▶ Watch](../../presentations/watch.html?v=Training_ADM_Module_2_Narrated) (about 13 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_ADM_Module_2_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-2/Training_ADM_Module_2_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-2/Training_ADM_Module_2_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_ADM_03_Validation_Kit_Check_Narrated).

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

Every gate in the guide ends with a **Validate** step, and most of them name a validation kit check. The kit is the executable form of those steps. This module teaches how a check is built, through one new check. Before any AD user is synchronized into a tenant that already has cloud accounts, a soft or hard match left open lets an AD object take over a cloud account. VK-SYNC-02 asks whether both blocks are on, and if not, whether an approved window says why. The guide lists it as Gate 3's optional match-blocking check in [Where the kits stop](../../books/guides/attribute-driven-migration-implementation.md#where-the-kits-stop).

**The federal requirement.** A check is monitoring evidence only if it can't change what it reads and can't pass when it didn't look. From [Chapter 03's table](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#federal-requirements-and-evidence):

| Requirement | KSI | Evidence the ISSO keeps |
|---|---|---|
| CM-6; CA-7; AC-2: an AD object can't take over a cloud account unnoticed | KSI-MLA-EVC | The run's `Results/ValidationResults.json` |
| CM-6: a deviation is approved, documented and has an end | KSI-MLA-EVC | The window date in the run's options, and the change record |
| AC-6: no standing Global Administrator identity for a scheduled check | KSI-IAM-ELP | The run's evidence block, which says the read came from an export; the kit's catalog |
| SA-11; CM-7 Least Functionality: the kit can only read | KSI-CMT-VTD | The repository's test results, including `Safety.Tests.ps1` |
| SI-7 Software, Firmware, and Information Integrity; AU-3 (Lab 2) | KSI-SVC-VRI | `ValidationManifest.json`, with a SHA-256 for every file of the run |
| CM-3; CM-5: the remediation is a write under change control, never the check | KSI-CMT-LMC | The change record the finding opens |

: Chapter 03's requirements, KSIs and evidence for this module {.striped .hover}

Key Security Indicators are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)). Which output supports which control is the program's reading *(design guidance)*.

### Learning objectives

In this module, you'll:

- Describe the parts of a check: catalog entry, function, rows and outcome, fixtures and tests.
- Explain Finding, Warn and Info, and why a missing value reads as off.
- Explain why VK-SYNC-02 is optional and prefers an export to a live read.
- Run the check on fixtures and on an export, and see Pass, Fail and Warn.
- Explain what the safety tests refuse, and why a new check inherits them.

### Prerequisites

- [Module 1](01-the-hr-middleware.md), and [Microsoft Automation, Module 1](../ms-automation-foundations.md) for permissions and roles.
- PowerShell 7 and Pester 5.5 or later. You read PowerShell, and you know Pester's `Describe` and `It`.

## Unit 2: Why this check, and the lesson in its catalog entry

*8 minutes*

The read is `GET /directory/onPremisesSynchronization`, and its permission looks harmless. But Learn lists no application permission for it, and for delegated access only Global Administrator. A read-only check, run live, would need the most powerful role in the tenant. So VK-SYNC-02 is optional, prefers an export someone already signed in can save, and names the role in its catalog entry. Read:

- [Chapter 03: why this check](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#why-this-check).
- [The catalog entry, and the lesson in it](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#the-catalog-entry-and-the-lesson-in-it).
- The guide's [Gate 3, step 4](../../books/guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync): block soft and hard match outside a planned window.

## Unit 3: Rows, outcome and safety

*8 minutes*

A **Finding** fails the check. A **Warn** needs a person but isn't a failure: here, a block that is off inside an approved window, until the window's last day. An **Info** row is context and isn't counted. A missing value reads as off, so an unexpected response produces a Finding, not a silent Pass. The safety tests fail the build on any state-changing command anywhere in the kit. Read:

- [Rows and outcome](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#rows-and-outcome).
- [Fixtures and tests](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#fixtures-and-tests).
- [The safety tests](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#the-safety-tests), including where the remediation goes instead.

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*17 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/validation-kit`. Each step below says what it does and what to look for.

```powershell
# Step 1: Run the check against the fail fixture
Import-Module ./powershell/ValidationKit -Force
$r = Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf 2026-10-30)
$r | Select-Object CheckId, Status, Count
$r.Details | Format-Table Severity, Issue
$r.Evidence.Queries | Format-Table Source, Query

# Step 2: Open a matching window until October 31, then run on the day after it closes
(Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf 2026-10-30 -Option @{ MatchWindowOpenUntil = '2026-10-31' })).Status
(Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf 2026-11-01 -Option @{ MatchWindowOpenUntil = '2026-10-31' })).Status

# Step 3: Feed it an export
New-Item -ItemType Directory -Force -Path ./inputs | Out-Null
Set-Content -Path ./inputs/onprem-sync-export.json -Value '{"value":[{"id":"x","features":{"blockSoftMatchEnabled":true,"blockCloudObjectTakeoverThroughHardMatchEnabled":false}}]}'
$r = Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -InputPath ./inputs -AsOf 2026-10-30)
$r | Select-Object CheckId, Status, Count
$r.Evidence.Queries | Format-Table Source, Query

# Step 4: See what a live run would ask for
Get-VkRequiredScope -Checks (Get-VkCheckCatalog -CheckId VK-SYNC-02)
(Get-VkCheckCatalog -CheckId VK-SYNC-02).DelegatedRole

# Step 5: Confirm it isn't in a default run
(Get-VkCheckCatalog).Id -contains 'VK-SYNC-02'

# Step 6: Run the whole kit's tests
pwsh -NoProfile -Command "Invoke-Pester -Path tests/powershell"

# Step 7: Make it fail for the right reason
$f = './powershell/ValidationKit/Checks/SYNC.ps1'
(Get-Content -Raw $f).Replace("Name = 'blockSoftMatchEnabled'", "Name = 'blockSoftMatch'") | Set-Content -NoNewline $f
Import-Module ./powershell/ValidationKit -Force
(Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf 2026-10-30)).Status
(Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/pass -AsOf 2026-10-30)).Status

# Step 7: Make it fail for the right reason
(Get-Content -Raw $f).Replace("Name = 'blockSoftMatch'", "Name = 'blockSoftMatchEnabled'") | Set-Content -NoNewline $f
Import-Module ./powershell/ValidationKit -Force
(Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/pass -AsOf 2026-10-30)).Status

# Step 8: Clean up
Remove-Item -Recurse -Force ./inputs
```

:::

<!-- labs:end -->

You run the check on its fail fixture, inside and after a matching window, and on an export; you see what a live run would ask for, run the kit's tests, then break the check on purpose. Work in `examples/validation-kit`, in PowerShell 7. Nothing here signs in. These are the steps of [Chapter 03, Lab 1](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#lab-1-fixtures-no-tenant), which explains each result.

1. **Run the check against the fail fixture.**

   ```powershell
   Import-Module ./powershell/ValidationKit -Force
   $r = Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf 2026-10-30)
   $r | Select-Object CheckId, Status, Count
   $r.Details | Format-Table Severity, Issue
   $r.Evidence.Queries | Format-Table Source, Query
   ```

   Expected output:

   ```text
   CheckId    Status Count
   -------    ------ -----
   VK-SYNC-02 Fail       2

   Severity Issue
   -------- -----
   Finding  Soft match is not blocked
   Finding  Cloud object takeover through hard match is not blocked
   Info     Soft match on UPN is on; it cannot be turned off once enabled

   Source          Query
   ------          -----
   Graph (fixture) fixture:onPremisesSynchronization.json <= /v1.0/directory/onPremisesSynchronization
   ```

2. **Open a matching window until October 31, then run on the day after it closes.**

   ```powershell
   (Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf 2026-10-30 -Option @{ MatchWindowOpenUntil = '2026-10-31' })).Status
   (Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf 2026-11-01 -Option @{ MatchWindowOpenUntil = '2026-10-31' })).Status
   ```

   Expected: `Warn`, then `Fail`. Nobody edited anything.

3. **Feed it an export.** The first two commands make an `inputs` folder with an export that blocks soft match but not hard-match takeover.

   ```powershell
   New-Item -ItemType Directory -Force -Path ./inputs | Out-Null
   Set-Content -Path ./inputs/onprem-sync-export.json -Value '{"value":[{"id":"x","features":{"blockSoftMatchEnabled":true,"blockCloudObjectTakeoverThroughHardMatchEnabled":false}}]}'
   $r = Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -InputPath ./inputs -AsOf 2026-10-30)
   $r | Select-Object CheckId, Status, Count
   $r.Evidence.Queries | Format-Table Source, Query
   ```

   Expected: `VK-SYNC-02 Fail 1`, and the evidence's source is `Input`, query `onprem-sync-export.json`.

4. **See what a live run would ask for.**

   ```powershell
   Get-VkRequiredScope -Checks (Get-VkCheckCatalog -CheckId VK-SYNC-02)
   (Get-VkCheckCatalog -CheckId VK-SYNC-02).DelegatedRole
   ```

   Expected output:

   ```text
   OnPremDirectorySynchronization.Read.All
   Global Administrator (the only role Learn lists; delegated only, no application permission)
   ```

5. **Confirm it isn't in a default run.**

   ```powershell
   (Get-VkCheckCatalog).Id -contains 'VK-SYNC-02'
   ```

   Expected: `False`.

6. **Run the whole kit's tests.**

   ```powershell
   pwsh -NoProfile -Command "Invoke-Pester -Path tests/powershell"
   ```

   Expected: `Tests Passed: 297, Failed: 0`.

7. **Make it fail for the right reason.** The first two commands change your copy of the check to read `blockSoftMatch`, a property that doesn't exist; the next three reload the module and run the fail and pass fixtures.

   ```powershell
   $f = './powershell/ValidationKit/Checks/SYNC.ps1'
   (Get-Content -Raw $f).Replace("Name = 'blockSoftMatchEnabled'", "Name = 'blockSoftMatch'") | Set-Content -NoNewline $f
   Import-Module ./powershell/ValidationKit -Force
   (Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf 2026-10-30)).Status
   (Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/pass -AsOf 2026-10-30)).Status
   ```

   Expected: `Fail`, then `Fail`. The pass fixture fails too, because the missing value reads as off. Put it back and run the pass fixture again:

   ```powershell
   (Get-Content -Raw $f).Replace("Name = 'blockSoftMatch'", "Name = 'blockSoftMatchEnabled'") | Set-Content -NoNewline $f
   Import-Module ./powershell/ValidationKit -Force
   (Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/pass -AsOf 2026-10-30)).Status
   ```

   Expected: `Pass`.

8. **Clean up.**

   ```powershell
   Remove-Item -Recurse -Force ./inputs
   ```

**Check your work:** for any state of the two blocks and any window date, you can say what the check reports and why.

## Unit 5: Exercise: Lab 2 (your test tenant)

*Not timed. Not run by the authors.*

A Global Administrator of a test tenant saves the response of the one privileged read to a file; you run the check on that export as any user, compare the result with the export line by line, and delete the export once the run's evidence is stored. Follow [Chapter 03, Lab 2](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#lab-2-test-tenant).

- **You need:** a test tenant with Microsoft Entra Connect or Cloud Sync configured. Only the export step needs Global Administrator; nothing in the kit runs with that role.
- **Back it out:** step 4 deletes the export. It isn't evidence by itself; the run's manifest is.

## Unit 6: Knowledge check

*5 minutes*

1. The fixture says soft match isn't blocked, and an approved matching window ends today. What does VK-SYNC-02 report tomorrow, if nothing changes?
   a. Warn, because the window was approved.
   b. Fail, because the day after the window's last day the same state is a Finding again.
   c. NotApplicable.

2. Why is VK-SYNC-02 left out of a default run?
   a. It's in preview.
   b. Its live read needs Global Administrator, so it runs only when named, and prefers an export.
   c. It's slow.

3. A response comes back without the `blockSoftMatchEnabled` property. What does the check report?
   a. Pass, because nothing says the block is off.
   b. A Finding, because a missing value reads as off.
   c. An error.

4. Your new check seems to need its own HTTP call. What does Chapter 03 tell you to do?
   a. Add an `Invoke-RestMethod` call with `-Method GET`.
   b. Add what it needs to the kit's single data path, where the safety tests already look.
   c. Mark the check optional.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [rows and outcome](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#rows-and-outcome) and step 2 of the lab.
2. **b.** See [the catalog entry, and the lesson in it](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#the-catalog-entry-and-the-lesson-in-it) and steps 4 and 5 of the lab.
3. **b.** See [rows and outcome](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#rows-and-outcome) and step 7 of the lab.
4. **b.** See [the safety tests](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#the-safety-tests).
:::

## Unit 7: Summary

*2 minutes*

You built your understanding of a check from its catalog entry to its safety tests, and saw how one check asks for the least privilege it can when its read needs the most powerful role.

**Evidence an ISSO keeps from this module:** the run's results, details, summary and `ValidationManifest.json` in the evidence store; the window date and its change record; the Entra sign-in log for the one privileged export; and the change record for any remediation, which is never made by the check. Before shipping a new check, work through the [Chapter 03 checklist](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 1](01-the-hr-middleware.md) · [Learning path](index.md) · [Next: Module 3, Keep dynamic rules as code →](03-dynamic-rules-as-code.md)
:::
