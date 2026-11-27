# Help desk automation

> **Status: illustrative.** Tested on its fictional fixtures (`tests/`), not run against a live tenant. Review every line, run it first in a test tenant, and run any change only with `-Apply` and the approved plan's SHA-256.

Scripts for the everyday help desk and audit tasks in [Book 15, Chapter 12](../../docs/books/b15-day2-operations/12-the-day-two-runbook.md), so a task runs from a typed request or a schedule instead of from an email under standing administrator rights. This first part covers two of them:

| Task (Book 15, Chapter 12) | What the pack does | Reads or changes | Where it runs |
|---|---|---|---|
| 5. Running a script for a requester | `New-HtTypedChangePlan` checks a typed request and plans one change to one user; `Invoke-HtTypedChange` applies it only with the approved plan's SHA-256 | Plans read; applying changes one user | Approved request: a person with a just-in-time role, or the approved pipeline |
| 3. Admin consent requests | `Get-HtPendingConsentRequest` lists the pending requests and flags old and broad ones; the verdict stays with the identity governance approver | Reads only | Scheduled on the platform host ([WD-181](../../docs/about/decision-register.md#wd-181)) |

## The rule the typed change enforces

"Parameters travel; commands don't" (Book 15, Chapter 12). A request names a change from [`config/typed-changes.json`](config/typed-changes.json) and supplies a user and a value. Nothing else is accepted, and the pack's own script is the only thing that runs. It never runs a command pasted from a request.

| Check | What it refuses |
|---|---|
| HT-01 | A change that isn't in `config/typed-changes.json` |
| HT-02 | A user synchronized from on-premises: its source of authority is the on-premises directory, so the change belongs there or in the HR record (Microsoft Learn, *Update user*) |
| HT-03 | A value the change doesn't accept (its list or pattern) |
| HT-04 | A user who is disabled or doesn't exist: a disabled account goes to the security office |
| HT-05 | Nothing to change: the user already has the value |
| HT-06 | A request id that isn't a ticket number |
| HT-07 | When applying: the value changed since the plan was made |
| HT-08 | When applying: the plan's SHA-256 isn't the approved one, or the plan was edited |

## Run it on the fixtures

From the `help-desk-automation` folder, in PowerShell 7.1 or later:

```powershell
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
$p = New-HtTypedChangePlan -RequestId REQ-2026-0501 -User avery.lane@contoso.example -ChangeId set-records-flag -Value RetainAll -OutputPath out/plan -FixturePath tests/fixtures
$p
```

`Ready` is `True` and `PlanSha256` is the hash an approver approves. A dry run changes nothing:

```powershell
Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 $p.PlanSha256 -OutputPath out/apply -FixturePath tests/fixtures
```

The pending consent requests on the fixtures:

```powershell
Get-HtPendingConsentRequest -OutputPath out/consent -FixturePath tests/fixtures -AsOf 2026-11-27
Get-Content out/consent/findings.json
```

Two applications are pending. One has waited 15 days (HT-CR-01) and asks for `Files.ReadWrite.All`, which the identity governance approver decides (HT-CR-02).

The tests:

```powershell
Invoke-Pester -Path tests
```

## In a test tenant

```powershell
Connect-MgGraph -Scopes (Get-HtRequiredPermission -Task consent-requests).GraphPermissions -NoWelcome
Get-HtPendingConsentRequest -OutputPath out/consent
```

A typed change in a test tenant: plan it, have someone other than the requester approve the plan's SHA-256, then apply it with a role activated through PIM against the ticket:

```powershell
Connect-MgGraph -Scopes (Get-HtRequiredPermission -Task typed-change-apply).GraphPermissions -NoWelcome
$p = New-HtTypedChangePlan -RequestId REQ-2026-0501 -User <test user UPN> -ChangeId set-department -Value <value> -OutputPath out/plan
Invoke-HtTypedChange -PlanPath $p.PlanPath -ApprovedPlanSha256 <approved SHA-256> -OutputPath out/apply -Apply
```

## Permissions

Every Graph call is declared, with its task and least privilege, in [`config/calls.json`](config/calls.json). The module refuses any call that isn't declared, and a test checks it. From Microsoft Learn (read November 27, 2026):

| Task | Calls | Least-privileged permission |
|---|---|---|
| `typed-change-plan` | Get user | `User.Read.All` |
| `typed-change-apply` | Get user, update user | `User.Read.All`, `User.ReadUpdate.All` |
| `consent-requests` | List appConsentRequests, list userConsentRequests | `ConsentRequest.Read.All` |

## Evidence

Each plan, apply and review writes JSON with the SHA-256 of what it wrote and the controls and KSIs from [`config/requirements.json`](config/requirements.json): AC-2, CM-3 and KSI-CMT-LMC for the plan; AC-2, AC-6, CM-3, KSI-CMT-LMC and KSI-IAM-JIT for the change; AC-6, AC-20, CA-7, SA-9 and KSI-IAM-ELP for the consent review. The evidence supports those controls; the assessor decides them. KSIs are FedRAMP's provider indicators, which the agency lines its own evidence up with.

## At work

The pack is neutral, and every name in it is invented. Copy `config/typed-changes.json` and `config/consent-review.json`, edit them at work, and keep your copies inside the agency. [`copilot-prompts.md`](copilot-prompts.md) has prompts for Microsoft 365 Copilot Chat to help fill them in.

## Next

The scheduled platform host jobs (the morning synchronization check and the custom role review, with event-log forwarding through Azure Monitor Agent) and the request-driven tasks through the agency's system access management tool, SailPoint and ServiceNow (password reset, authenticator reset, account creation) follow in this kit.
