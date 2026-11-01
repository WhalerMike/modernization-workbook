---
title: "Learning path: Ticket-to-Machine on ServiceNow and SailPoint"
subtitle: "Seven modules that teach you to build, test and evidence Book 13's Ticket-to-Machine loop on ServiceNow and SailPoint Identity Security Cloud, gate by gate, with labs on fixtures and in your own test instance"
description: "Research draft: a learning path in seven modules for developers, identity governance engineers, ServiceNow engineers and ISSO reviewers. Each module maps to the example implementation guide's gates and the developer workbook's chapters, runs a lab against the kit's fixtures with no tenant, points to a lab in your own developer instance or sandbox, and ends with a knowledge check."
research-status: draft
research-type: training module
research-book: "Books 13, 15"
series-order: 0
date-modified: 2026-11-01
last-reviewed: 2026-11-01
---

# Learning path: Ticket-to-Machine on ServiceNow and SailPoint {.unnumbered}

In this learning path, you build the identity half of [Book 13's Ticket-to-Machine loop](../../books/b13-governance/appendix-b-ticket-to-machine-reference.md#the-coordination-loop) on two named products: ServiceNow as the front door and the record, and SailPoint Identity Security Cloud (ISC) for identity governance. You learn it in the order the example implementation guide builds it, one or two gates per module, and you prove each step with the developer workbook's tested code.

The path doesn't repeat those pages. Each module frames the work, sets your objectives, sends you to the exact guide, workbook and book sections that teach it, runs the workbook's Lab 1 as an exercise, and checks what you learned.

::: {.callout-note}
## An example, not an endorsement
The loop is vendor-neutral. This path uses ServiceNow and SailPoint because the [example guide](../../books/guides/ttm-servicenow-sailpoint.md) and the [developer workbook](../../project-plans/developer-workbooks/ticket-to-machine/index.md) do. Naming them isn't a recommendation by the program or any agency.
:::

## About this path

| | |
|---|---|
| **Level** | Intermediate |
| **Roles** | Developer, identity governance (IGA) engineer, ITSM (ServiceNow) engineer, ISSO reviewer |
| **Products** | ServiceNow (a Personal Developer Instance for Lab 2), SailPoint Identity Security Cloud (a sandbox tenant for Lab 2), Microsoft Graph (read only) |
| **Scope** | A FedRAMP Moderate civilian estate, as the guide's [starting state](../../books/guides/ttm-servicenow-sailpoint.md#where-agencies-start) describes |
| **Modules** | 7 |
| **Time** | About 5 hours 40 minutes, not counting the optional Lab 2 exercises |

## What you'll be able to do

When you finish this path, you'll be able to:

- Explain the loop's five steps, and say which file in the kit performs each one.
- Validate an identity finding payload on a laptop and predict what ServiceNow will do with it.
- Configure and verify least privilege for every ServiceNow role, ISC scope and Graph permission the kit uses.
- Detect an attribute with two writers before it causes drift that never settles.
- Measure identity drift run over run, and explain why a run that skipped a class can't be compared.
- Predict the finding an ISC event produces, and test a workflow change before you import it.
- Verify that a finding closes only on a re-read, never on a ticket status.
- Produce and verify the evidence package an ISSO keeps for the period.

## Prerequisites

- **The design.** Read [Book 13, Chapter 10](../../books/b13-governance/10-ticket-to-machine.md) for why a ticket should authorize a machine, and skim [Appendix B](../../books/b13-governance/appendix-b-ticket-to-machine-reference.md) for the loop, the request chain and the evidence record.
- **Microsoft Graph, for the modules that read it.** Modules 2, 3, 4 and 6 involve Microsoft Graph permissions or reads. If you haven't scripted Graph before, work through [Microsoft Automation, Module 1](../ms-automation-foundations.md) first: [the clouds and endpoints](../ms-automation-foundations.md#clouds-and-endpoints), [signing in as a workload](../ms-automation-foundations.md#signing-in-as-a-workload) and [permissions](../ms-automation-foundations.md#permissions).
- **Code.** You can read Python and JSON, run commands in a terminal, and read a little JavaScript. PowerShell is optional: the kit has a PowerShell client and Pester tests, but the labs here use the Python tools.

## Watch first (optional)

- The workbook's story deck, *One Drift Case, End to End*: one fictional person's drifted department followed through every module's gate, with the Lab 1 command and a knowledge check for each scene, about 20 minutes: [deck folder on GitHub](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/ttm-story-one-drift-case) (the deck and video follow when they are uploaded).
- The narrated deck for the example guide: [▶ Watch](../../presentations/watch.html?v=Research_TTM_ServiceNow_SailPoint_Narrated), about 10 minutes.
- The narrated deck for Book 13's Appendix B: [Presentations](../../presentations/index.md#reference-b13).

## Modules

Work through the modules in order. Each one builds on the one before, and the times are estimates for the reading, the Lab 1 exercise and the knowledge check.

| # | Module | Guide gates | Workbook chapters | Time |
|---|---|---|---|---|
| 1 | [The loop and the typed task](01-the-loop-and-the-typed-task.md) | [G4](../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door) | [01](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md) | 50 min |
| 2 | [The boundary and least privilege](02-boundary-and-least-privilege.md) | [G1](../../books/guides/ttm-servicenow-sailpoint.md#step-1-confirm-the-authorization-boundary) | [02](../../project-plans/developer-workbooks/ticket-to-machine/02-servicenow-client-and-least-privilege.md), [03](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md) | 60 min |
| 3 | [One writer per attribute](03-one-writer-per-attribute.md) | [G2](../../books/guides/ttm-servicenow-sailpoint.md#step-2-decide-the-writers-and-the-approvers) | [08](../../project-plans/developer-workbooks/ticket-to-machine/08-one-writer-per-attribute.md) | 40 min |
| 4 | [Sources and the starting drift](04-sources-and-starting-drift.md) | [G3](../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift) | [06](../../project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md) | 45 min |
| 5 | [Drift to a typed task](05-drift-to-a-typed-task.md) | [G3](../../books/guides/ttm-servicenow-sailpoint.md#step-3-connect-the-sources-and-measure-the-starting-drift), [G4](../../books/guides/ttm-servicenow-sailpoint.md#step-4-open-the-front-door) | [04](../../project-plans/developer-workbooks/ticket-to-machine/04-drift-to-a-typed-task.md) | 45 min |
| 6 | [Actuation and the re-read rule](06-actuation-and-the-re-read.md) | [G5](../../books/guides/ttm-servicenow-sailpoint.md#step-5-actuate-on-the-native-surface), [G6](../../books/guides/ttm-servicenow-sailpoint.md#step-6-close-only-on-a-re-read) | [05](../../project-plans/developer-workbooks/ticket-to-machine/05-the-re-read-rule.md) | 55 min |
| 7 | [Evidence for the ISSO](07-evidence-for-the-isso.md) | [G7](../../books/guides/ttm-servicenow-sailpoint.md#step-7-operate-the-tempo) | [07](../../project-plans/developer-workbooks/ticket-to-machine/07-evidence-records.md) | 45 min |

: The modules in order {.striped .hover}

Module 1 starts at Gate 4 because every other gate writes or reads the record that gate defines. From Module 2 on, the modules follow the guide's gate order.

**If you're an ISSO reviewer,** you can read each module's introduction, its federal requirement and its summary, and skip the labs. Module 7 is yours in full. The workbook's [reading paths](../../project-plans/developer-workbooks/ticket-to-machine/index.md#reading-paths) suggest an order for each role.

## What you need for the labs

Every module has two exercises.

**Lab 1: fixtures, no tenant.** Every Lab 1 runs on a laptop against the kit's fictional fixtures. You need:

- a copy of the repository, so you can work in [`examples/servicenow-sailpoint`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint);
- Python 3.10 or later, with `pytest` and `requests`;
- Node.js 18 or later, for the steps that run the ServiceNow scripts' tests;
- a Bash-compatible shell for the commands as written. PowerShell 7 with Pester 5 is needed only for the kit's PowerShell tests, which these labs don't run.

Run every command from `examples/servicenow-sailpoint`. The labs write to an `out` folder there; delete it after each module.

**Lab 2: your test instance.** Each Lab 2 is a short pointer to the workbook chapter's Lab 2. **The authors haven't run them**, and the workbook has no hosted sandbox: you bring your own. Depending on the module, you need:

- a ServiceNow Personal Developer Instance, never production ([Chapter 01, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#lab-2-a-servicenow-developer-instance));
- a SailPoint ISC sandbox tenant. How an agency gets one is between it and SailPoint ([Chapter 03, Lab 2](../../project-plans/developer-workbooks/ticket-to-machine/03-sailpoint-client-and-scopes.md#lab-2-a-sailpoint-sandbox-tenant));
- for Modules 3, 4 and 6, a test Entra tenant in the worldwide or GCC cloud, with synthetic data.

Every Lab 2 ends with a back-out step. Do it before you leave the module.

## Where this path sits

This path is the fourth of the guide's [four pieces](https://github.com/WhalerMike/modernization-workbook/blob/main/CONTRIBUTING.md#an-implementation-guide-is-finished-when-it-has-all-four-pieces): the [example guide](../../books/guides/ttm-servicenow-sailpoint.md), its narrated deck, the [developer workbook](../../project-plans/developer-workbooks/ticket-to-machine/index.md) and this path. The kit and its Pass 1 scope are explained in [Integrating ServiceNow and SailPoint (Pass 1)](../../books/guides/snow-sailpoint-integration-kit.md). Federal sources are in the [federal framework crosswalk](../../reference/federal-framework-crosswalk.md).

## Status and review

**Draft.** The path and its knowledge checks are new writing; every fact they rely on is on a linked page and carries that page's verification. Each module's Lab 1 commands were run against the kit on November 1, 2026, and the expected output shown is what they printed. To move this path to **In review**, a reviewer works through it end to end and confirms each knowledge-check answer against the linked section. What each status means is in [Status labels](../../about/sources-and-verification.md#status-labels).

::: {.callout-tip}
## Start the path
[Module 1: The loop and the typed task →](01-the-loop-and-the-typed-task.md)
:::
