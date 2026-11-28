---
title: "Learning path: Help Desk Automation"
subtitle: "Six modules: the typed change, the consent review, the scheduled checks, requests through ServiceNow and SailPoint, the request pipeline and its one-time secret, and an optional module on the deployment runbook, each with a lab on fixtures and a pointer to a lab in your own test environment"
description: "A learning path in six modules for service desk leads, identity engineers, ServiceNow and SailPoint engineers, developers and ISSO reviewers: how Book 15, Chapter 12's everyday help desk and audit tasks move from emails under standing administrator rights to typed requests and read-only schedules. A typed change applied only with its approved hash; the pending admin consent review; the morning synchronization check, the custom role review and the event-log forwarding check on the platform host; catalog items approved in SailPoint; the pipeline that re-reads the approval and hands a one-time secret to one person on a separate channel; and, optionally, the runbook that deploys it all. Each module links the developer workbook's chapter, runs its exact-command Lab 1 with no tenant, points to Lab 2 for a test environment, and ends with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 0
listing:
  - id: ht-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: pending
---
# Learning path: Help Desk Automation {.unnumbered}

Most service desks still do their riskiest work the same way: an email arrives, someone with standing administrator rights does what it asks, and the reply closes it. [Book 15, Chapter 12](../../books/b15-day2-operations/12-the-day-two-runbook.md) rewrites eight of those tasks as governed procedures. This learning path teaches you to run the code that carries them out: a typed change that applies only with an approved hash, read-only checks on a schedule, requests that arrive as typed catalog items and are approved in SailPoint, and a pipeline that hands a one-time secret to one person on a separate channel. In each module you run the tested code from the developer workbook [*Building Help Desk Automation*](../../project-plans/developer-workbooks/help-desk-automation/index.md) on your laptop, then read what the same step takes in a test environment.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat the workbook or Book 15. They tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for

| Role | What you get from the path |
|---|---|
| Service desk lead | Why a request carries a choice and never a command, what the agent records before a reset, and how the secret reaches the person |
| Identity engineer | The typed changes and the source of authority, the synchronization check, the role register and the two apps' least privilege |
| ServiceNow and SailPoint engineers | The catalog items, the hand-off, the access profiles and their approval schemes, and why the pipeline re-reads SailPoint |
| Developer | The code in `examples/help-desk-automation`: the checks, the plan and its hash, the scheduled jobs and the pipeline |
| ISSO reviewer | The federal requirements each module supports, the KSI it aligns to and the evidence you keep |

**Level:** intermediate. **Products:** Microsoft Entra ID and Microsoft Graph, Microsoft Entra Connect, Intune role-based access, Azure Monitor Agent and Azure Arc, ServiceNow and SailPoint Identity Security Cloud. **Scope:** a civilian agency at FedRAMP Moderate in Microsoft 365 GCC with commercial Azure, as the [workbook](../../project-plans/developer-workbooks/help-desk-automation/index.md) assumes.

## Prerequisites

- [Book 15, Chapter 12](../../books/b15-day2-operations/12-the-day-two-runbook.md), its eight daily tasks: forty minutes, and every module refers back to them.
- For Modules 4 and 5, the [Ticket-to-Machine learning path](../ticket-to-machine/index.md)'s Modules 2 and 6, which teach the ServiceNow and SailPoint clients and the re-read rule this path reuses.
- PowerShell basics: you can run a script, import a module and read the objects it returns.

## Get the code {#get-the-code}

Download [help-desk-automation.zip](../../../downloads/help-desk-automation.zip) to your Downloads folder. It holds the kit itself. Unzip it into `C:\FMWLabs\help-desk-automation` (in Windows' **Extract All**, type that folder in place of the one it suggests), so you work in `C:\FMWLabs\help-desk-automation`. Every lab command runs from there, as it does from `examples/help-desk-automation` in a clone of the repository. The kit is PowerShell 7.1 or later, with Pester 5; it has no Python steps. [Get a path's code](../index.md#get-the-code) says why each step is there.

In PowerShell (Windows PowerShell 5.1 or PowerShell 7):

```powershell
Expand-Archive -Path $HOME\Downloads\help-desk-automation.zip -DestinationPath C:\FMWLabs\help-desk-automation -Force
Set-Location C:\FMWLabs\help-desk-automation
Get-ChildItem C:\FMWLabs\help-desk-automation -Recurse -File | Unblock-File
```

In Git Bash on Windows:

```bash
mkdir -p /c/FMWLabs
unzip -o ~/Downloads/help-desk-automation.zip -d /c/FMWLabs/help-desk-automation
cd /c/FMWLabs/help-desk-automation
```

In Bash on Linux or macOS, which use `~/FMWLabs` in place of `C:\FMWLabs`:

```bash
mkdir -p ~/FMWLabs
unzip -o ~/Downloads/help-desk-automation.zip -d ~/FMWLabs/help-desk-automation
cd ~/FMWLabs/help-desk-automation
```

Check it works, in PowerShell 7.1 or later:

```powershell
Invoke-Pester -Path tests -Output None -PassThru | Select-Object PassedCount, FailedCount
```

It prints `PassedCount` 64 and `FailedCount` 0.

## What you'll be able to do

When you finish the path, you'll be able to:

- explain why a request may carry a change id, a user and a value, and never a command;
- plan a typed change, have it approved by its hash, and show why an edited plan, a wrong hash or a moved value is refused;
- produce the pending admin consent register and send the broad and overdue requests to the identity governance approver;
- run the morning synchronization check, the custom role review and the event-log forwarding check as read-only jobs with dated, hashed evidence;
- trace a request from a ServiceNow catalog item through the agency's system access management tool to a SailPoint approval;
- explain why the pipeline re-reads the approval, when it refuses, and where a one-time secret goes and doesn't go;
- optionally, dry-run the deployment of the jobs and the pipeline to the platform host, under the two gMSAs the decisions name.

## Modules

Work through them in order. Module 1 is the pattern every other module reuses. Modules 2 and 3 are the read-only jobs; Modules 4 and 5 are the request-driven tasks, and need Module 1. Module 6, the deployment runbook, is optional: it is for whoever deploys the kit.

| # | Module | Book 15, Chapter 12 | Workbook chapter | Time |
|---|---|---|---|---|
| 1 | [Parameters travel, commands don't](01-parameters-travel-commands-dont.md) | Task 5 | [01](../../project-plans/developer-workbooks/help-desk-automation/01-the-typed-change.md) | 50 min |
| 2 | [Consent requests and the approver](02-consent-requests-and-the-approver.md) | Task 3 | [02](../../project-plans/developer-workbooks/help-desk-automation/02-the-consent-request-review.md) | 35 min |
| 3 | [The morning checks on a schedule](03-the-morning-checks-on-a-schedule.md) | Tasks 6, 7 and 8 | [03](../../project-plans/developer-workbooks/help-desk-automation/03-scheduled-checks-sync-roles-and-logs.md) | 50 min |
| 4 | [From catalog item to approval](04-from-catalog-item-to-approval.md) | Tasks 1, 2, 4 and 5 | [04](../../project-plans/developer-workbooks/help-desk-automation/04-requests-in-servicenow-and-sailpoint.md) | 40 min |
| 5 | [The pipeline and the separate channel](05-the-pipeline-and-the-separate-channel.md) | Tasks 1, 2, 4 and 5 | [05](../../project-plans/developer-workbooks/help-desk-automation/05-the-request-pipeline-and-the-one-time-secret.md) | 50 min |
| 6 | [Deploying to test and production (optional)](06-deploying-to-test-and-production.md) | All eight, through the [stage steps](../../project-plans/developer-workbooks/help-desk-automation/06-deploying-to-test-and-production.md#stage-1-test) | [06](../../project-plans/developer-workbooks/help-desk-automation/06-deploying-to-test-and-production.md) | 40 min |

: The modules of the Help Desk Automation learning path {.striped .hover}

**Total time:** about 3 hours 45 minutes with each module's Lab 1, or 4 hours 25 minutes with the optional Module 6. Lab 2, in your own test environment, isn't counted.

**If you're an ISSO reviewer,** read each module's introduction, its federal requirement table and its summary, and skip the labs. The workbook's [reading paths](../../project-plans/developer-workbooks/help-desk-automation/index.md#reading-paths) suggest an order for each role.

Each module follows the same units: an introduction with the federal requirements it supports, learning objectives, prerequisites, one or two concept units, Lab 1, Lab 2, a knowledge check and a summary.

## What you need for the labs

**Lab 1: a laptop, no tenant.** Every module's Lab 1 runs the code in [`examples/help-desk-automation`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/help-desk-automation) against the kit's fictional fixtures: a `contoso.example` tenant with five users, three pending consent requests, three custom roles, two Arc servers, and a ServiceNow queue of eleven requested items with their SailPoint approvals. You need PowerShell 7.1 or later with Pester 5. Each lab writes its results to a dated folder under `C:\FMWLabs\results`, outside the kit. Nothing in Lab 1 signs in to anything or sends a request.

**Lab 2: your own test environment.** Each Lab 2 needs a Microsoft Entra test tenant, and Modules 3 to 5 add an Azure test subscription, a ServiceNow Personal Developer Instance or a SailPoint sandbox, never production, with fictional data. Each module says which. **The authors didn't run the Lab 2 steps.** Each one ends with a way to back it out.

**Your configuration stays at work.** The labs use the kit's fictional lists. The agency's own typed changes, limits, role register and catalog items are written at work, from the kit's templates and its [Copilot prompts](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/copilot-prompts.md) in Microsoft 365 Copilot Chat, and stay on agency storage.

## How this path fits with the other pieces

| Piece | Where |
|---|---|
| The tasks | [Book 15, Chapter 12](../../books/b15-day2-operations/12-the-day-two-runbook.md) |
| Where each part runs | [WD-181](../../about/decision-register.md#wd-181), [WD-182](../../about/decision-register.md#wd-182) and [WD-183](../../about/decision-register.md#wd-183) |
| The code and its labs | [*Building Help Desk Automation*](../../project-plans/developer-workbooks/help-desk-automation/index.md) |
| The clients and the re-read rule | The [Ticket-to-Machine learning path](../ticket-to-machine/index.md) |
| Every run's permissions | [Permissions by Run](../../reference/permissions-by-run.md#help-desk-automation) |

: Where each piece of help desk automation lives {.striped .hover}

## Modules in this path

::: {#ht-modules}
:::

---

*Original content for project use. Every fact is carried by link from the workbook and Book 15, Chapter 12; the claims log is in the repository.*
