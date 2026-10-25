---
title: "Projects"
subtitle: "Sample project plans for the modernization program: work breakdown, schedule network, critical path, decision points and gates, ready to adapt and baseline"
description: "Sample PMP-style project plans for the Federal Modernization Program: the program's integrated master schedule and one plan per complementary project, each with a work breakdown, a computed critical path, the decision points that hold it, gates with approvers and criteria, and downloads for Microsoft Project and Excel."
doc-type: section-landing
fmw-eyebrow: "Projects"
listing:
  - id: project-plans
    contents:
      - "*.md"
      - "!index.md"
    type: table
    fields: [title, plan-type, plan-books, plan-weeks, description]
    field-display-names:
      plan-type: "Type"
      plan-books: "Built from"
      plan-weeks: "Weeks"
    sort: "plan-type asc"
    sort-ui: false
    filter-ui: false
---

# Projects {.unnumbered}

The books say what to do and in what order. These plans turn that order into schedules a project manager can baseline: every task with a duration, an owner and its dependencies, the critical path computed from the network rather than asserted, and the decisions that have to be made, by whom and by when, for the path to hold.

::: {.callout-note}
## Samples, not commitments
Every plan here is an illustrative sample built from the books. The durations are sized so the gates land on the weeks [Book 01, Chapter 12](../books/b01-transformation-arc/12-migration-roadmap.md) gives; they aren't estimates for any agency. Replace them with the agency's own numbers from its Phase 0 assessment, then baseline the result. The plans name roles, not people, and no specific agency.
:::

## The plans

::: {#project-plans}
:::

The program master schedule is the integrated plan. Each project plan rolls up to it, and where a project's milestone is something the program waits for, the program plan carries it as a linked milestone. The program's Gate G1, for example, waits on the Identity Lifecycle plan's HR feed, so both plans show the same date and the float between them.

| Plan | Status | Built from |
|---|---|---|
| [Program master schedule](program-master-schedule.md) | Sample ready | [Book 00, Chapters 05 and 09](../books/b00-orientation/05-the-program-plan.md); [Book 01, Chapter 12](../books/b01-transformation-arc/12-migration-roadmap.md) |
| [Identity Lifecycle & Provisioning](identity-lifecycle.md) | Sample ready | [Book 03, Chapter 12](../books/b03-hr-identity/12-execution-plan.md) |
| Endpoint & Device Modernization | Planned | [Book 05](../books/b05-devices/index.md) |
| Network & Access Modernization | Planned | [Book 08](../books/b08-ddi/index.md), [Book 09](../books/b09-network/index.md) |
| Privileged Access & Administrative Identity | Planned | [Book 04](../books/b04-access/index.md) |
| Data Platform Identity Transformation | Planned | [Book 06](../books/b06-data-platform/index.md) |
| Continuous Monitoring & Evidence Fabric | Planned | [Book 13](../books/b13-governance/index.md) |
| Supply Chain & Software Bill of Materials | Planned | [Book 14](../books/b14-compliance/index.md) |

: The plan set, following the seven projects in [Book 00, Chapter 06](../books/b00-orientation/06-the-project-portfolio.md) {.striped .hover}

## How to read a plan

Each plan has the same sections, in the order a project manager reviews them.

| Section | What it tells you |
|---|---|
| **Plan at a glance** | Type, sponsor, plan manager, computed duration, and how much of the work sits on the critical path |
| **Schedule** | A Gantt chart: critical-path tasks in red, other tasks in blue with their float, gates and decisions as diamonds |
| **Critical path** | The chain of tasks with zero float, in order, and the near-critical tasks that join it once their float is spent |
| **Decision points** | Each decision with its owner, what it unblocks, the last week it can be made without moving the finish, and what a late decision costs |
| **Gates** | Each gate's approver and criteria; a gate is the next phase's entry condition |
| **Work breakdown and schedule** | Every task by phase: owner, duration, predecessors, weeks and float, each linked to the chapter it comes from |
| **Responsibility, assumptions, risks** | One owner per row, what the dates assume, and the risks that would move them |
| **Baseline and change control** | When to baseline, how to report, and how a change to a date gets made |

: The sections of every plan {.striped}

Three terms carry most of the meaning:

- **Critical path.** The longest chain of dependent tasks through the plan. Its length is the plan's duration, and a day lost on it is a day lost at the finish. It's computed with the critical path method: a forward pass for the earliest dates and a backward pass for the latest.
- **Total float.** How many working days a task can slip before it moves the finish. Critical tasks have none. Reporting float, rather than percent complete, shows where the schedule can still absorb trouble.
- **Decide by.** A decision's late finish: the last week it can be made without moving the finish. A decision with zero float is on the critical path, and the meeting that makes it belongs on the calendar before the plan is baselined.

## Using a plan

Each plan downloads as a Microsoft Project file (XML) and as a CSV for Excel, with every dependency, owner and float. Each also has a YAML source in the repository. To adapt one in the repository, edit its durations, owners and dependencies, then run:

```bash
python scripts/project_plans/build.py
```

The script recomputes the critical path and regenerates the page, the chart and both downloads; `--check` reports any output that no longer matches its source.
