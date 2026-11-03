---
title: "Attribute-Driven Migration, Module 3: Keep Dynamic Rules as Code"
subtitle: "Write each dynamic group as a reviewed file with tests, lint it for the guards every user rule needs, show whom a change adds and removes, and pause and resume safely in an incident"
description: "Research draft: Module 3 of the Attribute-Driven Migration learning path. You learn what Learn's dynamic membership samples leave to you, the rule library's one file per group, the offline evaluator, the linter's guards, the shadow diff and the pause manifest, then run Learn's samples against a fake tenant, lint Book 03's rule table, evaluate a rule, and break a rule on purpose. Guide Gate 4; Book 19, Chapter 04."
research-status: draft
research-type: training module
research-book: "Book 19"
series-order: 3
date-modified: 2026-11-02
last-reviewed: 2026-11-02
---

# Attribute-Driven Migration, Module 3: Keep Dynamic Rules as Code {.unnumbered}

**Learning path:** [Building the Attribute-Driven Migration](index.md) · Module 3 of 9 · 50 minutes · Guide [Gate 4](../../books/guides/attribute-driven-migration-implementation.md#gate-4-the-dynamic-group-library-and-administrative-units) · Workbook [Chapter 04](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-adm-module-3) (the deck files come with the next edition) · [▶ Watch](../../presentations/watch.html?v=Training_ADM_Module_3_Narrated) (about 14 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_ADM_Module_3_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-3/Training_ADM_Module_3_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-adm-module-3/Training_ADM_Module_3_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_ADM_04_Dynamic_Rules_Narrated).

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

Gate 4 replaces "who sits under the Finance branch" with "who carries the Finance code." A dynamic rule is access policy: one edit can remove hundreds of people at once. So the guide asks for every rule on codes, with guards, tested against named users and shadowed before it grants anything. In this module you keep the rules as files in Git, with tests and a linter, and you see what Learn's incident samples do when a group was paused on purpose.

**The federal requirement.** A rule change is a configuration change, and its review is the evidence. From [Chapter 04's table](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#federal-requirements-and-evidence):

| Requirement | KSI | Evidence the ISSO keeps |
|---|---|---|
| AC-2; AC-3: the guards keep disabled accounts and guests out | KSI-IAM-ELP | The rule library and its fixture, in the repository |
| CM-3; CM-4 Impact Analyses: every rule passes its tests, and each change's adds and removes are listed | KSI-CMT-VTD; KSI-CMT-LMC | The pull request, with `out/check-results.json` |
| CM-3(2) Testing, Validation, and Documentation of Changes: a broken rule fails the check | KSI-CMT-VTD | The pull request's check run |
| SA-11; SR-3: Learn's samples run unchanged and are pinned | KSI-SCR-MIT; KSI-CMT-VTD | `snapshot.json` and `LearnSamples.Tests.ps1` |
| CM-3: the incident pause records each state first, and the resume touches only what it paused (Lab 2) | KSI-CMT-LMC | `drill-manifest.json`, with the incident or drill record |
| AC-6: the session asks only for what creating groups and evaluating rules need (Lab 2) | KSI-IAM-ELP | The Entra sign-in and audit logs |

: Chapter 04's requirements, KSIs and evidence for this module {.striped .hover}

Key Security Indicators are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)). Which output supports which control is the program's reading *(design guidance)*.

### Learning objectives

In this module, you'll:

- Describe what Learn's pause and resume samples do well, and what they leave to you.
- Write a rule as one file with an owner and tests.
- Explain the guards the linter enforces, and why it works on the parsed rule.
- Run the pull request check and read its shadow diff.
- Explain how the pause manifest keeps a resume from turning on a group paused on purpose.

### Prerequisites

- [Module 2](02-a-validation-kit-check.md), for how the VK-DG checks Gate 4 names are built.
- Optional: [Microsoft Automation, Module 2](../ms-automation-entra.md), for groups and membership through Graph.
- PowerShell 7.1 or later and Pester 5, and a Git clone of the repository: step 4 compares the library with `HEAD`.

## Unit 2: The gate and what Learn's samples leave to you

*8 minutes*

Every governed rule uses one of two patterns, requires `accountEnabled`, excludes guests, and reads codes, never display names. Learn's dynamic membership processing samples pause and resume groups in an incident, but record nothing about what they paused, resume a group that was held for review, and fall back to the worldwide endpoint on an answer they don't recognize. Read:

- The guide's [Gate 4](../../books/guides/attribute-driven-migration-implementation.md#gate-4-the-dynamic-group-library-and-administrative-units), steps 1 to 6.
- [Chapter 04: where the rules sit](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#where-the-rules-sit).
- [Chapter 04: what Learn's samples leave to you](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#what-they-leave-to-you).

## Unit 3: The library, the linter, the shadow diff and the pause

*10 minutes*

Each group is a JSON file with an owner, a `critical` flag and tests that name members of a fictional population. The linter applies eleven rules on the parsed rule, because a guard inside an `-or` protects nothing. The pull request check lints, tests and lists each changed rule's adds and removes. The pause manifest records every collection's state before an incident pause. Read:

- [One file per group](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#one-file-per-group).
- [Lint](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#lint).
- [The shadow diff](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#the-shadow-diff).
- [The pause manifest](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#the-pause-manifest).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*20 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/dynamic-rules`. Each step below says what it does and what to look for.

```powershell
# Step 1: Run Learn's samples against the fake tenant
. ./tests/LearnSampleHarness.ps1
$pages = '../third_party/dynamic-membership-samples/scripts'
$t = New-FakeTenant -Collections @(
    @{ id = '11111111-1111-1111-1111-111111111111'; displayName = 'FIN-LED all members'; kind = 'group'; state = 'On' },
    @{ id = '22222222-2222-2222-2222-222222222222'; displayName = 'Held for review'; kind = 'group'; state = 'Paused' })
$answers = 'yes', 'USGov', 'yes', 'yes', 'yes'   # run, cloud, groups phase, AU phase, confirm account
Invoke-LearnSample -Page "$pages/powershell-pause-all-dynamic-membership.md" -Tenant $t -Answers $answers | Out-Null
$t.Connected = $null
Invoke-LearnSample -Page "$pages/powershell-resume-noncritical-dynamic-membership.md" -Tenant $t -Answers $answers | Out-Null
$t.Collections.Values | Select-Object displayName, state

# Step 1: Run Learn's samples against the fake tenant
$t = New-FakeTenant -Collections @(
    @{ id = '11111111-1111-1111-1111-111111111111'; displayName = 'FIN-LED all members'; kind = 'group'; state = 'On' })
Invoke-LearnSample -Page "$pages/powershell-pause-all-dynamic-membership.md" -Tenant $t -Answers 'yes', 'GCCHigh', 'yes', 'yes', 'yes' | Out-Null
$t.Calls[0].Uri

# Step 2: Lint Book 03's rule table
Import-Module ./powershell/DynamicRules.psm1
Get-Content ./tests/fixtures/book03-patterns.json -Raw | ConvertFrom-Json |
    ForEach-Object { Test-DrRule -Rule $_.membershipRule -Kind $_.kind -Group $_.pattern } |
    Format-Table Severity, Rule, Group, Issue

# Step 3: Evaluate a rule against the population
$pop = Get-Content ./tests/fixtures/population.json -Raw | ConvertFrom-Json
Get-DrMembers -Population $pop -Rule '(user.accountEnabled -eq true) -and (user.userType -eq "Member") -and (user.extensionAttribute10 -eq "FIN-LED")'

# Step 4: Run the pull request check
pwsh ./powershell/Invoke-DrLibraryCheck.ps1 -BaseRef HEAD

# Step 5: Break a rule on purpose
$f = './rules/fin-led-not-contractors.json'
(Get-Content -Raw $f).Replace(' -and (user.extensionAttribute11 -ne null)', '') | Set-Content -NoNewline $f

# Step 5: Break a rule on purpose
pwsh ./powershell/Invoke-DrLibraryCheck.ps1 -BaseRef HEAD

# Step 5: Break a rule on purpose
(Get-Content -Raw $f).Replace('-ne \"CTR\")"', '-ne \"CTR\") -and (user.extensionAttribute11 -ne null)"') | Set-Content -NoNewline $f

# Step 6: Run the tests
Invoke-Pester ./tests
```

:::

<!-- labs:end -->

You run Learn's samples against a fake tenant, lint Book 03's rule table, evaluate a rule, run the pull request check and break a rule on purpose. Work in `examples/dynamic-rules`, in PowerShell 7. These are the steps of [Chapter 04, Lab 1](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#lab-1-fixtures-no-tenant), which explains each result.

1. **Run Learn's samples against the fake tenant.** One group is on, and one was paused before the incident.

   ```powershell
   . ./tests/LearnSampleHarness.ps1
   $pages = '../third_party/dynamic-membership-samples/scripts'
   $t = New-FakeTenant -Collections @(
       @{ id = '11111111-1111-1111-1111-111111111111'; displayName = 'FIN-LED all members'; kind = 'group'; state = 'On' },
       @{ id = '22222222-2222-2222-2222-222222222222'; displayName = 'Held for review'; kind = 'group'; state = 'Paused' })
   $answers = 'yes', 'USGov', 'yes', 'yes', 'yes'   # run, cloud, groups phase, AU phase, confirm account
   Invoke-LearnSample -Page "$pages/powershell-pause-all-dynamic-membership.md" -Tenant $t -Answers $answers | Out-Null
   $t.Connected = $null
   Invoke-LearnSample -Page "$pages/powershell-resume-noncritical-dynamic-membership.md" -Tenant $t -Answers $answers | Out-Null
   $t.Collections.Values | Select-Object displayName, state
   ```

   Expected output:

   ```text
   displayName         state
   -----------         -----
   FIN-LED all members On
   Held for review     On
   ```

   "Held for review" was paused on purpose, and the resume turned it on. Now run the pause with `GCCHigh` as the cloud answer, and read the first call's address:

   ```powershell
   $t = New-FakeTenant -Collections @(
       @{ id = '11111111-1111-1111-1111-111111111111'; displayName = 'FIN-LED all members'; kind = 'group'; state = 'On' })
   Invoke-LearnSample -Page "$pages/powershell-pause-all-dynamic-membership.md" -Tenant $t -Answers 'yes', 'GCCHigh', 'yes', 'yes', 'yes' | Out-Null
   $t.Calls[0].Uri
   ```

   Expected: the address starts `https://graph.microsoft.com/v1.0/groups`, the worldwide host.

2. **Lint Book 03's rule table.**

   ```powershell
   Import-Module ./powershell/DynamicRules.psm1
   Get-Content ./tests/fixtures/book03-patterns.json -Raw | ConvertFrom-Json |
       ForEach-Object { Test-DrRule -Rule $_.membershipRule -Kind $_.kind -Group $_.pattern } |
       Format-Table Severity, Rule, Group, Issue
   ```

   Expected: two rows, `Finding DR-05 Legal employer` (a display-name attribute instead of a coded slot) and `Info DR-03 Direct reports`.

3. **Evaluate a rule against the population.**

   ```powershell
   $pop = Get-Content ./tests/fixtures/population.json -Raw | ConvertFrom-Json
   Get-DrMembers -Population $pop -Rule '(user.accountEnabled -eq true) -and (user.userType -eq "Member") -and (user.extensionAttribute10 -eq "FIN-LED")'
   ```

   Expected: `u01`, `u02`, `u06`, `u08`, `u09`. The guards keep out `u04` (disabled) and `u05` (a guest).

4. **Run the pull request check.**

   ```powershell
   pwsh ./powershell/Invoke-DrLibraryCheck.ps1 -BaseRef HEAD
   ```

   Expected: `6 rule(s); 0 finding(s), 0 warning(s); 0 changed file(s)`, exit 0.

5. **Break a rule on purpose.** This deletes the empty-slot clause from one rule:

   ```powershell
   $f = './rules/fin-led-not-contractors.json'
   (Get-Content -Raw $f).Replace(' -and (user.extensionAttribute11 -ne null)', '') | Set-Content -NoNewline $f
   ```

   Run the check again:

   ```powershell
   pwsh ./powershell/Invoke-DrLibraryCheck.ps1 -BaseRef HEAD
   ```

   Expected: exit 2. The linter notes `DR-10`, the test for `u06` fails (`DR-11`), and the shadow diff prints `fin-led-not-contractors.json (changed): adds u06`. Put the clause back:

   ```powershell
   (Get-Content -Raw $f).Replace('-ne \"CTR\")"', '-ne \"CTR\") -and (user.extensionAttribute11 -ne null)"') | Set-Content -NoNewline $f
   ```

6. **Run the tests.**

   ```powershell
   Invoke-Pester ./tests
   ```

   Expected: `Tests Passed: 70`.

**Check your work:** for any rule change, you can say which guard it needs, whom it adds and removes, and what an incident pause would do to it.

## Unit 5: Exercise: Lab 2 (your test tenant)

*Not timed. Not run by the authors.*

Sign in to the right cloud with the least you need, create the library's groups paused, compare the offline evaluator with Graph's beta evaluator for every test, turn processing on and shadow-diff live with VK-DG-04, and drill an incident pause and resume. Follow [Chapter 04, Lab 2](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#lab-2-test-tenant).

- **You need:** a test tenant, never production, with fictional users whose slots match the population fixture, and a Groups Administrator for the delegated session.
- **Back it out:** step 6 deletes the test groups, then lists every dynamic group and unit that isn't on, to confirm nothing is left paused that the record didn't pause before.

## Unit 6: Knowledge check

*5 minutes*

1. Learn's resume sample runs after an incident. What happens to a group that was paused for review before the incident?
   a. It stays paused.
   b. It's turned on with the rest.
   c. The sample asks first.

2. Why does the linter work on the parsed rule, not on its text?
   a. Parsing is faster.
   b. A guard inside an `-or` protects nothing, and a text search can't tell the difference.
   c. Learn requires it.

3. You delete `-and (user.extensionAttribute11 -ne null)` from a rule. What does the pull request check show?
   a. Exit 0, because the rule still parses.
   b. Exit 2: DR-10, a failed test for `u06`, and the shadow diff `adds u06`.
   c. Exit 1, because the file changed.

4. An incident responder resumes collections from the pause manifest. Which ones can it resume?
   a. Every paused collection in the tenant.
   b. Only collections this manifest paused; it refuses any other ID.
   c. Only critical collections.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [what Learn's samples leave to you](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#what-they-leave-to-you) and step 1 of the lab.
2. **b.** See [Lint](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#lint).
3. **b.** See [the shadow diff](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#the-shadow-diff) and step 5 of the lab.
4. **b.** Critical collections can be resumed at once by ID; the rest wait. See [the pause manifest](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#the-pause-manifest).
:::

## Unit 7: Summary

*2 minutes*

You kept the rules as reviewed files with tests, linted them for the guards, saw whom a one-clause change adds, and saw why an incident pause needs a record of what was paused before.

**Evidence an ISSO keeps from this module:** the rule library and its commits, each pull request's check run and `check-results.json`; in Lab 2, the Entra audit log for the paused creation, the evaluator comparison, VK-DG-04's shadow diff and the drill manifest. Gate 4's own evidence, VK-DG-01 to 07 and the restriction decision per unit, is in the guide's [Gate 4](../../books/guides/attribute-driven-migration-implementation.md#gate-4-the-dynamic-group-library-and-administrative-units). Before shipping a rule change, work through the [Chapter 04 checklist](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 2](02-a-validation-kit-check.md) · [Learning path](index.md) · [Next: Module 4, Move Group Policy as code →](04-group-policy-as-code.md)
:::
