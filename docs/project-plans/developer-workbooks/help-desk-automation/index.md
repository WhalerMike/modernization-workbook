---
title: "Building Help Desk Automation"
subtitle: "A developer workbook for the help desk automation kit and Book 15, Chapter 12's everyday tasks"
description: "A developer workbook for the help desk automation kit: a code-first companion for the developers who turn Book 15, Chapter 12's everyday help desk and audit tasks from emails under standing administrator rights into typed requests and schedules. A typed change to one user, planned and applied only with the approved plan's SHA-256; the pending admin consent review; the morning synchronization check, the custom role review and the event-log forwarding check as read-only scheduled jobs on the platform host; ServiceNow catalog items with typed variables, approved in SailPoint; the request pipeline that re-reads the approval and delivers a one-time secret on a separate channel; and a runbook that deploys it all to a test environment and then production. Each chapter starts from the vendor's own documentation, builds on tested code in the repository's examples folder, runs a lab against fixtures with no tenant, then a step in a test tenant, and lists the verified facts, the federal requirements and evidence, the dangers and a checklist."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-help-desk-automation
listing:
  - id: chapters
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-27
review-status: pending
---
# Building Help Desk Automation {.unnumbered}

*A developer workbook for the help desk automation kit and Book 15, Chapter 12's everyday tasks*

::: {.callout-important appearance="default"}
## Status: pending review
All six chapters are written and wait for the owner's review. Chapter 06, the deployment runbook, hasn't been run against a live tenant. Every external claim was checked against the vendor's own documentation (Microsoft Learn for Microsoft Entra ID, Microsoft Graph, Azure and Windows Server; SailPoint's published API specification; ServiceNow's documentation through *Building Ticket-to-Machine*), NIST's OSCAL catalog or fedramp.gov, and each chapter keeps its verification log in the repository. The code is illustrative. Its tests pass against fictional fixtures; it has not been run against a production tenant.
:::

[Book 15, Chapter 12](../../../books/b15-day2-operations/12-the-day-two-runbook.md) takes eight everyday help desk and audit tasks as they arrive at many service desks (by email, under standing administrator rights, closed with a reply) and rewrites each as a governed procedure. It says what each task must prove and which controls it supports. It doesn't build the software that does the work.

This workbook is for the developers who build it. It is code first. Every chapter begins with what Microsoft Learn, ServiceNow or SailPoint documents (the call, its least privilege, what it returns), then walks through the code in the repository's [`examples/help-desk-automation`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/help-desk-automation) folder, with tests. Each has a lab that runs on a laptop against fictional fixtures with no tenant, then a short step in a test tenant, instance or SailPoint sandbox with a way to back it out. Each lists the facts the code depends on, footnoted to the vendor's page with the date it was read, then the federal requirement the step supports, the KSI it aligns to and what the ISSO keeps, the dangers and a checklist.

The kit already exists. The chapters explain it, run it and say where it stops. Where a lab turned up a fault in the kit, the kit was fixed in the same change, with a test.

The target estate is a civilian agency at FedRAMP Moderate in Microsoft 365 GCC with commercial Azure, with ServiceNow as the service desk and SailPoint Identity Security Cloud for identity governance. GCC uses the worldwide Graph endpoint, `graph.microsoft.com`.[^hti-deployments]

## Where it runs

Three decisions settle it. [WD-181](../../../about/decision-register.md#wd-181): the four read-only jobs run on the platform host as Windows scheduled tasks under the one assessment gMSA, `gmsa-fmpassess$`, and sign in to Graph and Azure as the help desk audit reader app, which holds no write permission. [WD-182](../../../about/decision-register.md#wd-182): the request-driven tasks arrive as ServiceNow catalog items, go through the agency's system access management tool to SailPoint for approval, and run in a pipeline on the platform host under its own gMSA (an example name is `gmsa-fmphelpdesk$`), never the assessment gMSA, signed in as the help desk request worker app; the pipeline re-reads the approval from SailPoint, and a one-time secret is cleared after two hours. [WD-183](../../../about/decision-register.md#wd-183): both gMSAs are part of the platform host's one Active Directory exception.

## The pieces and how they connect

| Piece | What it is | Where |
|---|---|---|
| The tasks | The eight everyday tasks and their governed procedure | [Book 15, Chapter 12](../../../books/b15-day2-operations/12-the-day-two-runbook.md) |
| This workbook | One chapter per part of the kit, and a runbook for test and production | This page and its six chapters |
| Code | `examples/help-desk-automation`: one PowerShell 7 module, its configuration, the platform host's `deploy/` scripts and the data collection rule, the ServiceNow and SailPoint templates, fictional fixtures and 64 Pester tests | [`examples/help-desk-automation`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/help-desk-automation) |
| The clients and the re-read rule | How the kit's clients reach ServiceNow and SailPoint, and why a result is re-read before a task closes | [*Building Ticket-to-Machine*](../ticket-to-machine/index.md), Chapters [02](../ticket-to-machine/02-servicenow-client-and-least-privilege.md), [03](../ticket-to-machine/03-sailpoint-client-and-scopes.md) and [05](../ticket-to-machine/05-the-re-read-rule.md) |
| Permissions | Every run's least privilege, built from the kit's `config/calls.json` | [Permissions by Run](../../../reference/permissions-by-run.md#help-desk-automation) |
| The host | The platform host itself, and its interfaces | [The platform host guide](../../../books/guides/platform-host-implementation.md); [Book 10, Appendix B](../../../books/b10-cloud-boundary/appendix-b-platform-host-interfaces.md) |
| Training path | Six modules, one per chapter, each with the chapter's Lab 1 and a knowledge check | [Learning path: Help Desk Automation](../../../training/help-desk-automation/index.md) |
| Your configuration | Neutral templates and Microsoft 365 Copilot Chat prompts to write the agency's own lists at work | [`config/`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/help-desk-automation/config) and [`copilot-prompts.md`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/help-desk-automation/copilot-prompts.md) |

: The pieces of help desk automation and where each lives {.striped .hover}

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| Start with the documentation | What the vendor gives you, and what it leaves to you, as a table the kit's tests pin |
| The code | What the kit does, and the tests |
| Lab 1: fixtures, no tenant | Commands you can run anywhere, with the output they gave when the chapter was written |
| Lab 2 | The smallest step a test tenant, instance or sandbox needs, and how to back it out; not run by the authors |
| Verified facts | Calls, least-privileged permissions and limits, each footnoted |
| Federal requirements and evidence | The step, the requirement it supports, the KSI it aligns to, and what the ISSO keeps |
| Dangers | What breaks in production, and the guard the code has for it |
| Checklist | What a reviewer checks before the code ships |

Chapter 06 is built differently: it is a runbook, so it has no labs. Its outputs from fixture mode are dated, and its live results are written as expectations.

*Design guidance* in this workbook is marked as such: it is the program's position, not a vendor's statement. Where a vendor's documentation didn't settle a fact, the chapter says *not yet specified* and its verification log lists it.

## Chapters

| # | Chapter | Book 15, Chapter 12 task | What you build or run | Status |
|---|---|---|---|---|
| 01 | [The typed change](01-the-typed-change.md) | 5 | A change to one user from a list, a plan with its SHA-256, and an apply that refuses any other hash or a value that moved | Written |
| 02 | [The consent request review](02-the-consent-request-review.md) | 3 | The pending admin consent register, the overdue and broad requests, and the scheduled run | Written |
| 03 | [Scheduled checks: synchronization, roles and log forwarding](03-scheduled-checks-sync-roles-and-logs.md) | 6, 7 and 8 | Three read-only jobs, the data collection rule, the job runner and the four scheduled tasks | Written |
| 04 | [Requests in: ServiceNow catalog items and the SailPoint approval](04-requests-in-servicenow-and-sailpoint.md) | 1, 2, 4 and 5 | The four catalog items, the hand-off, the access profiles and their approval schemes | Written |
| 05 | [The request pipeline and the one-time secret](05-the-request-pipeline-and-the-one-time-secret.md) | 1, 2, 4 and 5 | The queue, the re-read approval, the four tasks' scripts, the secret's separate channel and its clearing | Written |
| 06 | [Deploying to test and production](06-deploying-to-test-and-production.md) | All eight | The gMSAs, the apps, the folders, the jobs, the rule, the pipeline, a smoke test, the rollback and the go/no-go | Written; not run against a live tenant |

: Chapters of Building Help Desk Automation {.striped .hover}

## Reading paths

- **Anyone new to the tasks:** [Book 15, Chapter 12](../../../books/b15-day2-operations/12-the-day-two-runbook.md), then Chapter 01.
- **Developers new to the kit:** Chapter 01 for the checks and the hash every other part reuses, then Chapter 05.
- **Whoever runs ServiceNow or SailPoint:** Chapter 04, with [*Building Ticket-to-Machine*](../ticket-to-machine/index.md) for the clients.
- **ISSOs and reviewers of the code:** each chapter's federal requirements and checklist, then Chapter 06's go/no-go.
- **Whoever runs the change:** Chapter 06, after every chapter's first lab.
- **Learners:** the [Help Desk Automation learning path](../../../training/help-desk-automation/index.md), six modules, each with a chapter's Lab 1 as its exercise and a knowledge check.

## Where this workbook sits

This is one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook, listed on the [Ticket-to-Machine topic](../../../topics/ticket-to-machine.md). The operating model is Book 15's [Chapter 12](../../../books/b15-day2-operations/12-the-day-two-runbook.md); the requests follow the Ticket-to-Machine pattern of [Book 13, Chapter 10](../../../books/b13-governance/10-ticket-to-machine.md).

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This workbook has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/project-plans/developer-workbooks/help-desk-automation).

<!-- revisions:end -->

[^hti-deployments]: Microsoft Learn, "National cloud deployments" (GCC continues using the worldwide endpoints), <https://learn.microsoft.com/graph/deployments> (read November 9, 2026; carried from *Building Provider Notices*).
