---
title: "Module 7: Routing to owners"
description: "Gate G6 and workbook Chapter 06: write and check a routing file of ordered rules, route two weeks of fictional notices from five providers as a dry run, read a Ticket-to-Machine task payload with its severity, response window, the provider's own action date and the five clauses of the request chain, and see why a re-run writes nothing and a provider's closure asks for the re-read instead of closing the task. About 65 minutes, with a lab on fixtures and a ServiceNow developer instance lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 13, 15"
series-order: 7
review-status: approved
reviewed-sha256: e78a3494b2d1d420f92c99dd36ce9c9ec5014c318b397fd31403b90885739c27
last-reviewed: 2026-11-09
---
# Module 7: Routing to owners {.unnumbered}

*Part of the [Provider Notices learning path](index.md). Gate G6 Routing. Workbook [Chapter 06](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md). About 65 minutes.*

**Watch:** the narrated deck for this module (about @@Training_PN_Module_7@@ minutes, captions): [▶ Watch](../../presentations/watch.html?v=Training_PN_Module_7_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PN_Module_7_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-pn-module-7) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-7/Training_PN_Module_7_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-7/Training_PN_Module_7_Narrated.vtt). The deck files join the next edition.

**Also:** the chapter's narrated tour, about @@DW_PN_06_Routing_Owners_TTM_Tasks@@ minutes: [▶ Watch](../../presentations/watch.html?v=DW_PN_06_Routing_Owners_TTM_Tasks_Narrated).

## Introduction (3 minutes)

A notice nobody owns is the problem this path started with. Routing is where each notice that needs action gets an owner: a typed task in the service desk's front door, with a severity, a response window and the provider's own date kept beside it. The rest go in the weekly digest. Providers repeat the same notice every week, so the router remembers what it has routed and writes nothing for a notice that hasn't changed. And a provider closing its notice isn't the agency's work being done: a retirement can close on the provider's side while the agency still runs the retired version.

In this module you check the lab's routing, route two fictional weeks from all five providers as a dry run, read one payload in full, and watch a re-run write nothing.

**The federal requirement.** Gate G6 supports SI-5 c and d, CM-3 b and f, CM-4 and CP-2 e. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Step 6](../../books/guides/provider-notices-implementation.md#step-6-route-notices-to-owners) names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| CM-3 b (review proposed changes): the routing checked before it runs | KSI-CMT-LMC, KSI-CMT-RVP | `Read-PnRouting` on the agency's routing file |
| SI-5 c and d: disseminate to the people who act, and implement in the established time frames | KSI-SCR-MON | `tasks/`, `tasks.json`, `routing.csv` |
| CM-3 b and f; CM-4 (impact analyses) | KSI-CMT-LMC, KSI-CMT-RVP | The payloads for `change`, `retirement` and `maintenance`, and the change records they open |
| CP-2 e | KSI-RPL-ARP | Payloads with `contingency_review: true` |
| SI-5 d; CM-3 f: routed once, re-runs write nothing, closure asks for the re-read | KSI-SCR-MON, KSI-CMT-LMC | `state.json`, `routing.csv` |

No KSI cites base CM-4; KSI-CMT-LMC and KSI-CMT-VTD cite CM-4(2), as the guide records. KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/provider-notices-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- write routing rules in the right order, and say why security advisories and retirements come before the general action-required rule;
- route a collection as a dry run and read what each payload is for: create, update or close;
- read a task payload: severity, priority, response window, the provider's own date, the contingency review flag and the five clauses;
- explain why a re-run writes nothing, and why a provider's closure asks for the re-read instead of closing the task;
- say where the agency's routing is written and kept.

## Prerequisites (1 minute)

- At least one of [Modules 2 to 6](index.md#modules).
- [Book 13, Appendix B](../../books/b13-governance/appendix-b-ticket-to-machine-reference.md): the typed task, its lanes and the five-clause request chain.

## Unit 1: The operating model and the gate (10 minutes)

Read:

- Book 15's [From notice to task to closure](../../books/b15-day2-operations/14-provider-notices.md#from-notice-to-task-to-closure): rules tried in order, a task is a typed task, close on the re-read, changes go through change control.
- The guide's [Step 6](../../books/guides/provider-notices-implementation.md#step-6-route-notices-to-owners): write the routing at work, check it, route as a dry run, and send only once the endpoint exists. Then its Interim path and the Validate (G6) callout: every security advisory and retirement routes to a task, and a second run on the same collection writes no payload.

## Unit 2: The router (12 minutes)

Read the workbook chapter in this order:

- [What the program gives you](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#what-the-program-gives-you) and [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#what-it-leaves-to-you): the finding contract's severities (P1 immediate, P2 one hour, P3 24 hours, P4 72 hours; program design) and what notices need on top.
- [The routing file](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#the-routing-file), [The payload](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#the-payload) and [Runs and state](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#runs-and-state).
- [Dangers](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#dangers).
- The kit's [Copilot prompts](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/provider-notices/copilot-prompts.md): how the agency drafts and reviews its own routing at work, in Microsoft 365 Copilot Chat.

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Chapter 06, Lab 1](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#lab-1-fixtures-no-tenant), which explains each result. Work in `examples/provider-notices`, in PowerShell 7. The teams in the lab's routing are fictional. Step 9 also reads the finding contract in `examples/servicenow-sailpoint`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/provider-notices`. Each step below says what it does and what to look for.

```powershell
# Step 1: Check the lab's routing
Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
(Read-PnRouting -Path config/routing.json).rules | ForEach-Object { [pscustomobject]@{ id = $_.id; route = $_.route; severity = $_.severity; group = $_.assignmentGroup } } | Format-Table

# Step 2: Try the template as it ships
Read-PnRouting -Path templates/routing.template.json

# Step 3: Collect every provider from the day-one fixtures
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/day1

# Step 4: Route them, as a dry run
./Invoke-PnRoute.ps1 -NoticesPath out/day1/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day1-route -AsOf 2026-11-09T12:00:00Z

# Step 5: Read one payload
$p = Read-PnJson -Path out/day1-route/tasks/create-azure-RT5J-6KL.json
[pscustomobject]$p | Format-List action, dedupe_key, severity, priority, response_window_seconds, response_due, action_required, action_due, assignment_group, contingency_review, controls, ksis
[pscustomobject]$p.ticket_to_machine | Format-List lane, c1_origin, c2_approver_role, c3_action, c4_reread_check, c5_evidence_kept

# Step 6: Route the same collection again, on a copy of the state
Copy-Item out/state.json out/state-rerun.json
./Invoke-PnRoute.ps1 -NoticesPath out/day1/notices.json -RoutingPath config/routing.json -StatePath out/state-rerun.json -OutputPath out/day1-rerun -AsOf 2026-11-09T13:00:00Z

# Step 7: Collect and route the second week
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -AsOf 2026-11-16T12:00:00Z -OutputPath out/day2
./Invoke-PnRoute.ps1 -NoticesPath out/day2/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day2-route -AsOf 2026-11-16T12:00:00Z

# Step 8: Read what each payload is for
Import-Csv out/day2-route/routing.csv | Where-Object action | Format-Table change, ruleId, action, severity, noticeId

# Step 9: Run the router's tests
Invoke-Pester -Path tests/Router.Tests.ps1 -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Check the lab's routing:**

    ```powershell
    Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
    (Read-PnRouting -Path config/routing.json).rules | ForEach-Object { [pscustomobject]@{ id = $_.id; route = $_.route; severity = $_.severity; group = $_.assignmentGroup } } | Format-Table
    ```

    ```text
    id  route  severity group
    --  -----  -------- -----
    R01 task   P2       Security Operations (example)
    R02 task   P3       Cloud Platform Engineering (example)
    R03 task   P3       Cloud Platform Engineering (example)
    R04 task   P2       Service Desk (example)
    R05 task   P3       Cloud Operations (example)
    R06 ignore
    ```

    Six rules, in the order they are tried.

2. **Try the template as it ships:**

    ```powershell
    Read-PnRouting -Path templates/routing.template.json
    ```

    Expect an error: `Exception: Routing templates/routing.template.json still has a <placeholder>.` It runs only once every value is filled in at work.

3. **Collect every provider from the day-one fixtures:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/day1
    ```

    22 notices from five providers, as in Module 1.

4. **Route them, as a dry run:**

    ```powershell
    ./Invoke-PnRoute.ps1 -NoticesPath out/day1/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day1-route -AsOf 2026-11-09T12:00:00Z
    ```

    ```text
    Notices: 22 new, 0 changed, 0 unchanged, 0 no longer listed
    Routes:  12 task, 9 digest only, 1 ignored
    Payloads: 12 create, 0 update, 0 close
    ```

    Then one line per payload, and `Dry run: 12 payloads written to out/day1-route/tasks, nothing sent.` The Microsoft Viva post is ignored by R06; the rest that need no task go to the digest.

5. **Read one payload:**

    ```powershell
    $p = Read-PnJson -Path out/day1-route/tasks/create-azure-RT5J-6KL.json
    [pscustomobject]$p | Format-List action, dedupe_key, severity, priority, response_window_seconds, response_due, action_required, action_due, assignment_group, contingency_review, controls, ksis
    [pscustomobject]$p.ticket_to_machine | Format-List lane, c1_origin, c2_approver_role, c3_action, c4_reread_check, c5_evidence_kept
    ```

    The Azure retirement: `severity : P3` with `response_window_seconds : 86400`, so `response_due : 2026-11-10T12:00:00Z`; Microsoft's retirement date kept apart in `action_due : 2027-09-30T00:00:00Z`; `contingency_review : True`; and `lane : Human decision`, with `c4_reread_check : The next collection shows the notice closed or no longer listed, or the named resources no longer affected`.

6. **Route the same collection again, on a copy of the state:**

    ```powershell
    Copy-Item out/state.json out/state-rerun.json
    ./Invoke-PnRoute.ps1 -NoticesPath out/day1/notices.json -RoutingPath config/routing.json -StatePath out/state-rerun.json -OutputPath out/day1-rerun -AsOf 2026-11-09T13:00:00Z
    ```

    Expect `Notices: 0 new, 0 changed, 22 unchanged, 0 no longer listed`, `Payloads: 0 create, 0 update, 0 close` and `No payloads: nothing new or changed needs a task.`

7. **Collect and route the second week:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -AsOf 2026-11-16T12:00:00Z -OutputPath out/day2
    ./Invoke-PnRoute.ps1 -NoticesPath out/day2/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day2-route -AsOf 2026-11-16T12:00:00Z
    ```

    ```text
    Notices: 2 new, 6 changed, 15 unchanged, 1 no longer listed
    Routes:  12 task, 10 digest only, 1 ignored
    Payloads: 1 create, 4 update, 1 close
    ```

8. **Read what each payload is for:**

    ```powershell
    Import-Csv out/day2-route/routing.csv | Where-Object action | Format-Table change, ruleId, action, severity, noticeId
    ```

    Six rows. The Azure and OCI rescheduled maintenance windows and the updated Microsoft 365 post are `changed` updates; the Azure incident the provider no longer lists is an `absent` update asking for the re-read; the new Microsoft 365 post `m365:MC900005` is a `new` create; and the AWS security notification AWS closed is a `close` that also asks for the re-read.

9. **Run the router's tests,** including the one that reads the finding contract:

    ```powershell
    Invoke-Pester -Path tests/Router.Tests.ps1 -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    Expect `PassedCount 31`, `FailedCount 0`.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, a ServiceNow developer instance (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 06, Lab 2](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#lab-2-a-servicenow-developer-instance). It has the exact commands.

- **You need:** a ServiceNow Personal Developer Instance or a sub-production instance, never production, with an endpoint you build to accept the payload (its shape is the agency's and not yet specified), and a token for a test integration user; Lab 1's steps 3 and 4 run first.
- **What you do:** put the token in the environment for this session only, never in a file; send one payload through the kit's sender; and check the record's assignment group, priority, description and five clauses in the instance.
- **Back-out:** step 3 deletes the test record in the instance, clears the token and deletes `out`.

## Knowledge check (5 minutes)

1. Why do the security and retirement rules come before the general action-required rule?
    a. Alphabetical order
    b. Rules are tried in order and the first match wins, and a retirement is often also marked action required; the retirement rule carries the contingency review
    c. The router sorts rules by severity
    d. The order doesn't matter
2. A task's `response_due` is tomorrow and its `action_due` is in ten months. Which is right?
    a. One of them is a mistake
    b. Both: the response window says how fast the owner picks the task up; the provider's date says when the work must be done
    c. `action_due` overrides `response_due`
    d. The kit should set both to the provider's date
3. You route the same collection twice. What does the second run write?
    a. The same 12 payloads again
    b. Nothing: the state holds each notice's fingerprint, and unchanged notices write no payload
    c. 12 update payloads
    d. 12 close payloads
4. AWS closes its security notification. What does the router do?
    a. Closes the task
    b. Deletes the task
    c. Writes a `close` payload that asks for the re-read (C4); the task is resolved on the agency's own check
    d. Ignores it
5. Where is the agency's own routing written and kept?
    a. In the public repository, beside the kit
    b. At work, from the kit's template, with the Copilot prompts in Microsoft 365 Copilot Chat if that helps, and kept inside the agency's boundary
    c. In the provider's portal
    d. In the digest

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in Book 15's [From notice to task to closure](../../books/b15-day2-operations/14-provider-notices.md#from-notice-to-task-to-closure) and [The routing file](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#the-routing-file).
2. **b.** Taught in [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#what-it-leaves-to-you) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#dangers).
3. **b.** Taught in [Runs and state](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#runs-and-state).
4. **c.** Taught in [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#what-it-leaves-to-you) and the guide's [Step 6](../../books/guides/provider-notices-implementation.md#step-6-route-notices-to-owners).
5. **b.** Taught in the guide's [prerequisites](../../books/guides/provider-notices-implementation.md#prerequisites) and [The routing file](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#the-routing-file).
:::

## Summary (2 minutes)

You checked six routing rules, saw the template refused, routed 22 notices into 12 task payloads, read one with both its dates and its five clauses, watched a re-run write nothing, and read the second week's create, updates and close.

**The evidence an ISSO keeps** for G6 from this module: each routing run's `tasks/`, `tasks.json`, `routing.csv`, `state.json` and manifest, dated; the reviewed routing file's SHA-256; and the change records the payloads open. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#checklist).

**Next:** [Module 8: Digest, evidence and go/no-go](08-digest-evidence-and-go-no-go.md).
