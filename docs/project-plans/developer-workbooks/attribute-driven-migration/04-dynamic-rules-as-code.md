---
title: "Chapter 04 — Dynamic Rules as Code"
description: "Keeping dynamic membership rules in Git as code: one file per group with an owner and membership tests, a parser and offline evaluator for the rule syntax Learn documents, a linter for the guards every access rule needs, a shadow diff on every change, and an incident path built on Learn's own pause and resume samples (pinned in the repository) with the record they leave out, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-attribute-driven-migration
part: How
series-order: 4
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: pending
aliases:
  - /docs/books/b19-developer-workbook/04-dynamic-rules-as-code.html
---

# Chapter 04 — Dynamic Rules as Code

*A dynamic rule is access policy written as a one-line expression. Treat it as code: review it, test it against people you can name, see whom a change adds and removes before it ships, and know how to stop the engine safely when one goes wrong.*

::: {.callout-note}
## In this chapter
The rules that place people and devices in dynamic membership groups, which the Attribute-Driven Migration uses for access, licensing and policy. You keep the rules in Git, one file per group, and check every change with code: a linter for the guards Book 03 requires, membership tests against a fictional population, and a shadow diff. For incidents, you start from Learn's own pause and resume samples, which the repository keeps as a pinned copy, run them against a fake tenant, and add the record they leave out. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can write a dynamic rule as a reviewed file with tests, explain every finding the linter raises, show whom a rule change adds and removes before it reaches the tenant, and pause and resume dynamic processing in an incident without turning on anything that was off on purpose. For each rule in the code you can say whether it is Microsoft's contract, Microsoft's sample, or the program's own design.

**Audience.** Developers and identity engineers who own the group library, and the reviewers who approve rule changes. You should be comfortable in PowerShell 7. You don't need a tenant until Lab 2.

## Where the rules sit

In the migration, a person's access follows their HR record: HR attributes land in coded slots (`extensionAttribute10` for organization, `11` for worker type, `12` for position category), and dynamic membership rules read those slots ([Book 03, Chapter 10](../../../books/b03-hr-identity/10-from-attributes-to-access.md)). Every rule that grants access ANDs two guards at the top: `(user.accountEnabled -eq true)` and `(user.userType -eq "Member")`. The validation kit already reads the rules live in a tenant (VK-DG-01 to VK-DG-07, [Chapter 03](03-writing-a-validation-kit-check.md)). This chapter moves the same checks earlier, into the pull request that changes a rule.

What Learn says about the engine sets the stakes:

- A rule is `<property> <operator> <value>` expressions joined with `-and`, `-or` and `-not`. Comparisons bind tightest, then `-not`, then `-and`, then `-or`. The body can't exceed 3,072 characters.[^c04-rules]
- String and regex comparisons aren't case sensitive; property names are.[^c04-rules] `fin-led` matches `"FIN-LED"`, so the HR side has to keep codes clean.
- A tenant can have at most 15,000 dynamic membership groups.[^c04-rules] Each unique user in a dynamic group needs a Microsoft Entra ID P1 license.[^c04-rules]
- Processing is sequential per tenant. Changes are usually applied within a few hours but can take more than 24, and `-match`, `-contains` and `memberOf` slow it down.[^c04-processing]
- `memberOf` is a preview that ends on November 3, 2026. After that date, groups that use it stop updating and stay in their last state. It is available only in the public cloud.[^c04-memberof]
- An agent's user account is a user to the engine and is included by user rules unless the rule excludes it.[^c04-rules] Learn doesn't yet name the property to exclude it with, so the guards in this chapter can't include that clause (see [the book index](index.md#changes-from-the-first-outline)).

## Start with Learn's samples

### What Learn gives you

For writing rules, Learn gives you its syntax page, with a table of properties and operators and an example for each,[^c04-rules] and a page on writing efficient rules.[^c04-efficient] There is no Microsoft sample library of rules or rule tests. Microsoft's own testing tool is Graph's `evaluateDynamicMembership` action, which is beta and delegated only.[^c04-evaluate]

For running the engine, Learn publishes five PowerShell samples for an incident: when a rule change or a mass update starts moving members you didn't intend, pause processing, then resume it in order.[^c04-samples]

| Sample | What it does |
|---|---|
| Pause all | Pauses every dynamic group and dynamic administrative unit that is `On` |
| Pause specific | Pauses the IDs you type |
| Pause all except | Pauses everything that is `On` except the IDs you type |
| Resume specific critical | Resumes the IDs you type; run it first |
| Resume noncritical | Resumes up to 100 paused groups and 100 paused administrative units per run, after the critical ones |

Each script runs in two phases (groups, then administrative units), asks for `yes` before each, asks for the cloud, and requests only the scopes for the phases you choose: `Group.ReadWrite.All` with Groups Administrator, `AdministrativeUnit.ReadWrite.All` with Privileged Role Administrator.[^c04-samples]

### The pinned copy

The scripts live only inside Learn's pages, so the repository pins the pages themselves: the overview and the five sample pages, from MicrosoftDocs/entra-docs at commit `07cb73d` (October 30, 2026), unmodified, with the repository's MIT code license.[^c04-samples-code] `snapshot.json` records each file's SHA-256 and a unit test checks them. The weekly source watch reports new commits to the sample pages. Updating the copy is a reviewed pull request, as in [Chapter 01](01-the-hr-to-entra-middleware.md#the-pinned-copy).

`tests/LearnSampleHarness.ps1` extracts each script from its pinned page at test time and runs it, unmodified, against a fake tenant. Only the commands it calls outside itself are replaced: the prompts, the screen output, `Start-Sleep`, and the four Graph PowerShell cmdlets it uses.

### What they leave to you

Running the five samples against the fake tenant shows what they do well and what they leave to you. Each row is pinned by a test in `tests/LearnSamples.Tests.ps1`.

| Learn's samples, run as published | Why it matters | What `examples/dynamic-rules` adds |
|---|---|---|
| Pause all skips a group that is already paused, pauses the rest, and signs in to the cloud chosen with only the scopes needed | — | Kept as the model: the same cloud hosts and the same two phases |
| Pause all records nothing about what it paused | Afterwards, nobody can tell which groups the incident paused and which were paused before it | `New-DrPauseManifest` records every collection's state before anything changes; `Invoke-DrPause` records what it paused |
| Resume noncritical turns on every paused group, including one that was paused on purpose before the incident | A group held for review, or frozen while its rule was being fixed, starts moving members again | `Invoke-DrResume` resumes only collections this manifest paused, and refuses any other ID |
| An answer the cloud prompt doesn't recognize, such as `GCCHigh`, selects the worldwide endpoint | In a GCC High or DoD tenant, the run signs in to the wrong cloud | `Get-DrGraphEndpoint` refuses a cloud name it doesn't know |
| Nothing in the resume scripts enforces a wait | Learn asks for one: 12 hours on the samples page,[^c04-samples] at least 24 in its processing guidance[^c04-processing] | Noncritical resumes wait 24 hours after the pause by default, the stricter of the two |
| A throttled request is retried once, then counted as failed | In a large tenant some collections stay unpaused; the summary shows the count | The manifest lists every collection, so a second pause run picks up the rest |
| Interactive only | Fine at 2 a.m. by hand; not testable, not repeatable | `-Apply` to act and a dry run without it; the Graph call is a script block, so the tests use a fake tenant |

**The verdict.** Use Learn's samples as the model for the incident path, and keep them pinned for comparison. The program's runbook uses the manifest-based functions, because during recovery the questions are "what did we pause?" and "what was already off?", and the samples can't answer them.

## The code: what `examples/dynamic-rules` adds

[`examples/dynamic-rules`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/dynamic-rules) is one PowerShell module, one check script, the rule library and two test files.

### One file per group

Each group is a JSON file in `rules/`:

```json
{
  "displayName": "FIN-LED everyone but contractors",
  "kind": "user",
  "owner": "FIN-LED access owner",
  "critical": false,
  "membershipRule": "(user.accountEnabled -eq true) -and (user.userType -eq \"Member\") -and (user.extensionAttribute10 -eq \"FIN-LED\") -and (user.extensionAttribute11 -ne \"CTR\") -and (user.extensionAttribute11 -ne null)",
  "tests": [
    { "member": "u01", "expected": true },
    { "member": "u02", "expected": false },
    { "member": "u06", "expected": false }
  ]
}
```

The owner is the person who approves changes. `critical` marks the groups an incident responder resumes first. The tests name members of `tests/fixtures/population.json`, a fictional population built to exercise each guard: a disabled employee, a guest with a copied organization code, a worker with an empty worker-type slot, a lower-case code, a manager and their reports, and three devices. The six rules are Book 03's patterns, with the guards in place.

### Parse and evaluate offline

`ConvertFrom-DrRule` parses the grammar on Learn's syntax page: the twelve comparison operators, written with or without the hyphen, `-in` lists, `-any` and `-all` over collections, `null`, `system.now -plus`, backtick-escaped quotation marks, the direct reports form, and Learn's precedence.[^c04-rules] Learn's own examples sometimes print an en dash for the hyphen (`–eq`), which the parser accepts. `Test-DrMember` evaluates a parsed rule against one fixture object, case-insensitively, as Learn says the engine compares.

The evaluator is for tests and reviews, and it isn't the engine. It refuses `memberOf` and the date comparisons rather than guess. Lab 2 runs the same rules through Graph's own evaluator for the same test users.

### Lint

`Test-DrRule` applies eleven rules (DR-01 to DR-11; the [README](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/dynamic-rules#linter-rules) lists them). Two matter most. DR-03 and DR-04 require the guards to be ANDed at the top of the rule: a guard inside an `-or` protects nothing, and a regular expression over the rule text can't tell the difference, which is why the linter works on the parsed tree. DR-10 notes that `-ne` or `-notIn` on a coded slot also admits someone whose slot is empty; add `(… -ne null)` if an empty slot must not qualify (*design guidance*).

Run against Book 03, Chapter 10's own rule pattern table, the linter found three things. The **Legal employer** pattern had no `userType` guard, so a guest whose `companyName` matched would have qualified (DR-04); it now has the guard, fixed in the same change as this chapter. It still reads `companyName`, a display-name attribute (DR-05), because the row exists to show that case. The **Exclusion** pattern admits a worker whose type slot is empty (DR-10), the open question the owner of Book 03 has to decide. The **Direct reports** pattern can't carry guards at all, because Learn says that rule can't be combined with any other, so the linter only notes it (DR-03, Info).[^c04-rules]

### The shadow diff

`Compare-DrRule` evaluates the current and proposed rule over the population and lists whom the change adds and removes. `Invoke-DrLibraryCheck.ps1` is the pull request check: it lints every rule, runs every test, and for each rule file changed since `-BaseRef`, prints the adds and removes and writes them to `out/check-results.json`. The live equivalent, against real groups, is VK-DG-04.

### The pause manifest

`New-DrPauseManifest` reads every dynamic group and dynamic administrative unit, with its processing state, through the same Graph calls Learn's samples make, and returns a record: when, which cloud, why, and each collection's state before. `Invoke-DrPause` pauses only what was `On`, minus any exceptions, and adds each ID it paused to the record. `Invoke-DrResume -Ids` resumes named critical collections at once. Without `-Ids`, it resumes the next batch, and only after the wait. It refuses any ID the record didn't pause. Each function takes the Graph call as a script block: `Invoke-MgGraphRequest` in a tenant, a fake in the tests.

### The tests

`tests/DynamicRules.Tests.ps1` has 57 tests: the parser, the evaluator, the linter, the library, Book 03's table, the shadow diff, and pause and resume against a fake Graph. `tests/LearnSamples.Tests.ps1` has 13 tests that run Learn's five scripts against the fake tenant. Neither needs a module, a tenant or a network.

::: {.callout-important}
## Illustrative code
The commands below run Learn's pinned samples and the example as published in the repository, against fixtures and a fake tenant. The evaluator follows Learn's syntax page but isn't the service. Review the code, and run Lab 2 in a test tenant, before it governs real groups.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later and Pester 5. Work in `examples/dynamic-rules`.

1. **Run Learn's samples against the fake tenant:**

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

   Both groups end `On`. "Held for review" was paused before the incident, and the resume turned it on. Run the pause again with `GCCHigh` as the cloud answer and read `$t.Calls[0].Uri`: `https://graph.microsoft.com/…`.

2. **Lint Book 03's rule table:**

   ```powershell
   Import-Module ./powershell/DynamicRules.psm1
   Get-Content ./tests/fixtures/book03-patterns.json -Raw | ConvertFrom-Json |
       ForEach-Object { Test-DrRule -Rule $_.membershipRule -Kind $_.kind -Group $_.pattern } |
       Format-Table Severity, Rule, Group, Issue
   ```

   Three rows: DR-10 on Exclusion, DR-05 on Legal employer, and the DR-03 note on Direct reports. A test checks that the fixture still matches Book 03's table row for row.

3. **Evaluate a rule against the population:**

   ```powershell
   $pop = Get-Content ./tests/fixtures/population.json -Raw | ConvertFrom-Json
   Get-DrMembers -Population $pop -Rule '(user.accountEnabled -eq true) -and (user.userType -eq "Member") -and (user.extensionAttribute10 -eq "FIN-LED")'
   ```

   `u01, u02, u06, u08, u09`. `u04` (disabled) and `u05` (guest) are out because of the guards. `u08`, whose code is `fin-led` in lower case, is in.

4. **Run the pull request check:**

   ```powershell
   pwsh ./powershell/Invoke-DrLibraryCheck.ps1 -BaseRef HEAD
   ```

   Exit `0`: six rules, no findings, no changed files.

5. **Break a rule on purpose.** In `rules/fin-led-not-contractors.json`, delete ` -and (user.extensionAttribute11 -ne null)` and run the check again. Exit `2`. The linter notes DR-10, the test for `u06` fails (DR-11), and the shadow diff prints `adds u06`. Put the clause back.

6. **Run the tests:** `Invoke-Pester ./tests`.

**Expected result:** 70 tests passing, and each difference in the table above seen with your own eyes.

## Lab 2: test tenant

Use a test tenant, never production, with fictional users whose slots match the population fixture.

1. **Sign in to the right cloud with the least you need.** Creating groups needs `Group.ReadWrite.All` delegated (or `Group.Create` for an application) with Groups Administrator.[^c04-newgroup] Reading test results with Graph's evaluator needs only `User.Read.All` (or `Device.Read.All`) when you supply the rule. The action is beta and delegated only. It is listed for the global service, US Government L4 and L5.[^c04-evaluate]
2. **Create the groups from the library.** For each file, `New-MgGroup` with `GroupTypes = @('DynamicMembership')`, `MembershipRule` from the file and `MembershipRuleProcessingState = 'Paused'`. Paused groups can be compared before they move anyone.
3. **Compare the offline evaluator with Graph's.** For each test in each file, call `POST /beta/groups/evaluateDynamicMembership` with the test user's object ID and the rule, and compare `membershipRuleEvaluationResult` with `expected`.[^c04-evaluate] The validation kit's VK-DG-03 does this from a `rule-tests.json` file. Any difference between the two evaluators is a finding against the offline one: record the rule and the user.
4. **Turn processing on and shadow-diff live.** Set each group `On`, wait for **Update complete** on the group's overview page,[^c04-create] and run VK-DG-04 with a pair of groups whose rules differ by one clause.
5. **Drill an incident.** Build the Graph script block, then take the record, pause, and resume:

   ```powershell
   $invoke = { param($Method, $Uri, $Body, $Headers) Invoke-MgGraphRequest -Method $Method -Uri $Uri -Body $Body -Headers $Headers }
   $m = New-DrPauseManifest -Invoke $invoke -Cloud USGov -Reason 'Drill'
   Invoke-DrPause -Manifest $m -Invoke $invoke            # dry run: what would pause
   Invoke-DrPause -Manifest $m -Invoke $invoke -Apply
   Invoke-DrResume -Manifest $m -Invoke $invoke -Ids $criticalIds -Apply
   ```

   `$criticalIds` holds the object IDs of the groups whose library files say `critical`. Save `$m` as JSON with the incident record. In a drill, resume the rest with `-WaitHours 0` and say so in the record; in a real incident, keep the default.
6. **Back it out.** Delete the test groups. Then confirm that no dynamic group or administrative unit in the tenant is paused unless the record says it was paused before.

## Verified facts

| Item | Value | Source |
|---|---|---|
| Rule length | At most 3,072 characters | [^c04-rules] |
| Case | String and regex operations aren't case sensitive; property names are | [^c04-rules] |
| Operator precedence | Comparisons, then `-not`, `-and`, `-or` | [^c04-rules] |
| Extension attributes | `extensionAttribute1` to `15` as string properties; multi-value extension properties aren't supported | [^c04-rules] |
| Direct reports | Can't be combined with other rules; adds the manager too | [^c04-rules] |
| Dynamic groups per tenant | 15,000 | [^c04-rules] |
| License | Microsoft Entra ID P1 for each unique user in a dynamic group | [^c04-rules] |
| Processing time | Usually within a few hours; can exceed 24; `Match`, `Contains` and `memberOf` slow it | [^c04-processing] |
| `memberOf` | Preview ending November 3, 2026; then stops updating; public cloud only; 500 per tenant | [^c04-memberof] |
| Evaluate a rule | `POST /beta/groups/evaluateDynamicMembership`; delegated only; `User.Read.All` or `Device.Read.All` with a rule, plus `Group.Read.All` with a group ID; global, US Government L4 and L5 | [^c04-evaluate] |
| Pause and resume | `membershipRuleProcessingState` `On` or `Paused`; Groups Administrator for groups, Privileged Role Administrator for administrative units | [^c04-samples] [^c04-group] |
| Waiting before resuming | At least 12 hours (samples page) or at least 24 hours (processing guidance) | [^c04-samples] [^c04-processing] |
| Create a dynamic group | `Group.ReadWrite.All` delegated, `Group.Create` application | [^c04-newgroup] |
| Agents' user accounts | Included by user rules unless excluded; the property to exclude them isn't documented | [^c04-rules] |

One thing Learn states differently on two pages, recorded so a later edit doesn't loosen the code: the samples page says to resume noncritical collections after at least 12 hours, and the processing guidance says to wait a minimum of 24 hours and check the audit logs first. The code defaults to 24. Separately, the rules page says a condition can exclude agents' user accounts but names no property; the code doesn't invent one.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A guard inside an `-or` | Disabled accounts or guests qualify, and a text search for the guard still finds it | DR-03 and DR-04 work on the parsed rule, at the top level |
| A rule change that moves hundreds of people | Access, licenses and policy follow within hours | Tests per rule, the shadow diff in the pull request, then VK-DG-04 live |
| A code typed in the wrong case | `fin-led` matches `FIN-LED`, because the engine compares without case | Code-list validation at the HR source ([Chapter 01](01-the-hr-to-entra-middleware.md)); a fixture user that proves it |
| An empty slot under `-ne` | A worker with no type passes "everyone but contractors" | DR-10, and the `-ne null` clause where an empty slot must not qualify |
| `memberOf` after November 3, 2026 | The group stops updating and holds stale access | DR-06 in the pull request; VK-DG-06 live |
| Resuming everything after an incident | Groups paused on purpose start moving members again | The pause manifest; resume only what it paused |
| The wrong cloud | A GCC High tenant is signed in to as worldwide | `Get-DrGraphEndpoint` refuses unknown names |
| Resuming too soon | The backlog returns | 24-hour default for noncritical resumes; critical ones by name |
| Trusting the offline evaluator | A difference from the engine goes unnoticed | Lab 2 step 3 compares it with Graph's evaluator for every test |
| Agents' user accounts in access groups | User rules include them by default | Open: add the clause when Learn names the property; review membership of access groups until then |

## Checklist

- [ ] Every dynamic group has a file in `rules/` with an owner, a kind and at least one test for a member and one for a non-member.
- [ ] `Invoke-DrLibraryCheck.ps1 -BaseRef <base>` exits `0` on the pull request, and its shadow diff is in the review.
- [ ] Every user rule ANDs `accountEnabled` and `userType` at the top.
- [ ] No rule uses `memberOf`; no access rule reads `department`, `jobTitle` or `companyName`.
- [ ] Each `-ne` or `-notIn` on a coded slot is a decision about empty slots, written down.
- [ ] The offline evaluator agrees with Graph's `evaluateDynamicMembership` for every test, in the test tenant.
- [ ] The incident runbook takes a pause manifest before pausing, and resumes from it, critical groups first.
- [ ] The pinned Learn samples match their manifest, and every upstream commit since the pin has been reviewed.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 03 — Writing a Validation Kit Check](03-writing-a-validation-kit-check.md) · [Workbook index](index.md) · [Next: Chapter 05 — Lifecycle Workflows Custom Extensions →](05-lifecycle-workflows-custom-extensions.md)
:::

[^c04-rules]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Oct 30, 2026).
[^c04-efficient]: Microsoft Learn, "Create simpler, more efficient rules for dynamic membership groups in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-rule-more-efficient> (accessed Oct 30, 2026).
[^c04-processing]: Microsoft Learn, "Understand and manage dynamic group processing in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/manage-dynamic-group> (accessed Oct 30, 2026).
[^c04-memberof]: Microsoft Learn, "Configure dynamic membership groups with the memberOf operator in the Entra Admin Center (preview)," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-rule-member-of> (accessed Oct 30, 2026).
[^c04-evaluate]: Microsoft Learn, "group: evaluateDynamicMembership," <https://learn.microsoft.com/graph/api/group-evaluatedynamicmembership?view=graph-rest-beta> (accessed Oct 30, 2026).
[^c04-samples]: Microsoft Learn, "PowerShell samples for dynamic membership processing," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership-powershell-samples>, and its five sample pages (accessed Oct 30, 2026).
[^c04-samples-code]: Microsoft, MicrosoftDocs/entra-docs, `docs/identity/users/scripts` and `docs/identity/users/groups-dynamic-membership-powershell-samples.md` at commit `07cb73d6c6380414eecd040ba5e14c1c94d48b66` (October 30, 2026), code under the MIT License, <https://github.com/MicrosoftDocs/entra-docs/tree/07cb73d6c6380414eecd040ba5e14c1c94d48b66/docs/identity/users/scripts> (accessed Oct 30, 2026); pinned copy in `examples/third_party/dynamic-membership-samples`.
[^c04-create]: Microsoft Learn, "Create or update a dynamic membership group in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-create-rule> (accessed Oct 30, 2026).
[^c04-group]: Microsoft Learn, "group resource type," <https://learn.microsoft.com/graph/api/resources/group?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^c04-newgroup]: Microsoft Learn, "New-MgGroup," <https://learn.microsoft.com/powershell/module/microsoft.graph.groups/new-mggroup?view=graph-powershell-1.0> (accessed Oct 30, 2026).
