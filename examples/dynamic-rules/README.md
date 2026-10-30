# Dynamic rules as code

A library of dynamic membership rules kept in Git, with a parser and an offline evaluator for the rule grammar Learn documents, a linter, membership tests per rule, a shadow diff for every change, and a pause manifest for incidents. It is the code for the [Developer Workbook, Chapter 04](../../docs/books/b19-developer-workbook/04-dynamic-rules-as-code.md). The live checks on groups already in a tenant stay in the validation kit (VK-DG-01 to VK-DG-07).

Illustrative: tested against fixtures and a fake tenant, not proven against a production tenant. The evaluator follows Learn's rule syntax page; where it and the service could differ, Lab 2 compares it with Graph's own `evaluateDynamicMembership` (beta).

## Start with Learn's samples

Learn publishes five PowerShell samples for pausing and resuming dynamic membership processing during an incident ([PowerShell samples for dynamic membership processing](https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership-powershell-samples)). A pinned, unmodified copy of their Learn source pages is in [`../third_party/dynamic-membership-samples`](../third_party/dynamic-membership-samples/SNAPSHOT.md). `tests/LearnSamples.Tests.ps1` runs each script, unmodified, against a fake tenant and pins what it does:

| Learn's samples, on their own | What this example adds |
|---|---|
| Handle all three US clouds' Graph hosts and request only the scopes for the phases chosen | Kept: `Get-DrGraphEndpoint` uses the same hosts |
| An answer the cloud prompt doesn't recognize (`GCCHigh`) selects the worldwide endpoint | `Get-DrGraphEndpoint` refuses an unknown cloud |
| Pause all records nothing about what it paused | `New-DrPauseManifest` records every collection's state first |
| Resume noncritical turns on every paused collection, including one paused on purpose before the incident | `Invoke-DrResume` resumes only what this manifest paused |
| Nothing enforces the wait Learn asks for before resuming (12 hours on the samples page, 24 in the processing guidance) | Noncritical resumes wait 24 hours by default, the stricter |
| Interactive prompts only | `-Apply` to act, a dry run without it, and a script block for the Graph call so tests use a fake tenant |

The rule-writing side has no Microsoft sample to start from, only Learn's syntax page and its examples, so the library, linter and evaluator follow that page.

## Layout

```
rules/*.json                       the library: one file per group (kind, owner, rule, critical, tests)
powershell/DynamicRules.psm1       parser, evaluator, linter, shadow diff, pause manifest and resume
powershell/Invoke-DrLibraryCheck.ps1  the pull request check: lint, test, shadow diff against a base branch
tests/DynamicRules.Tests.ps1       Pester 5: the module against fixtures
tests/LearnSamples.Tests.ps1       Pester 5: Learn's five samples against a fake tenant
tests/LearnSampleHarness.ps1       extracts a sample from its pinned page and runs it with fakes
tests/fixtures/population.json     fictional users and devices
tests/fixtures/book03-patterns.json  Book 03, Chapter 10's rule pattern table, as published
```

## Run

PowerShell 7.1 or later and Pester 5. No module, tenant or network:

```powershell
pwsh ./powershell/Invoke-DrLibraryCheck.ps1 -BaseRef origin/main
Invoke-Pester ./tests
```

Exit codes for the check: 0 passed (warnings and information allowed), 2 findings, 1 error. It writes `out/check-results.json`.

## Linter rules

| Rule | Severity | Checks |
|---|---|---|
| DR-01 | Finding | The rule parses |
| DR-02 | Finding | At most 3,072 characters (Learn's limit) |
| DR-03 | Finding | A user rule ANDs `(user.accountEnabled -eq true)` at the top |
| DR-04 | Finding | A user rule ANDs `(user.userType -eq "Member")` at the top |
| DR-05 | Finding | No display-name attribute (`department`, `jobTitle`, `companyName`), as VK-DG-02 |
| DR-06 | Finding | No `memberOf` (preview ending November 3, 2026; public cloud only) |
| DR-07 | Warn | `-match`, `-notMatch`, `-contains`, `-notContains` (Learn: slower processing) |
| DR-08 | Warn | Three or more `-or` tests of one property (Learn: use `-in`) |
| DR-09 | Finding | Reads user and device properties together, or disagrees with the file's kind |
| DR-10 | Info | `-ne` or `-notIn` on a coded slot also admits an empty slot |
| DR-11 | Finding | A membership test in the library fails |

## Known limits

- The evaluator doesn't evaluate `-le` and `-ge` dates (`employeeHireDate`) or `memberOf`; a test that needs them reports an error rather than guessing.
- Learn doesn't yet name the property a rule uses to exclude agents' user accounts, so the guards can't include that clause.
- The pause manifest is a JSON object in memory; keep it with the incident record. Nothing here writes it for you.
