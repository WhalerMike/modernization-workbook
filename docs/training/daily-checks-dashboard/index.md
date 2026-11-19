---
title: "Learning path: The Daily Checks on One Dashboard"
subtitle: "Two modules: one workbook with a tab per daily check, then reading it, deploying it and keeping the evidence, each with labs and a knowledge check"
description: "A learning path in two modules for security operations, operators and ISSO reviewers, built from the Daily Checks Dashboard implementation guide and its developer workbook: what Azure and Microsoft 365 offer for dashboards, which daily checks fit one Azure Monitor workbook and from which table, GCC availability, and the template kept as reviewed code with its validator; then what each tab shows on a morning a source stops, the reachability check, the deployment with what-if and an approved hash, and why the workbook is a view and never evidence. Each module links its chapters' Lab 1 on fixtures and Lab 2 in a test workspace, and ends with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 0
listing:
  - id: dc-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: pending
---
# Learning path: The Daily Checks on One Dashboard {.unnumbered}

The operator runbook has ten daily checks, and most of them are done one portal at a time. This learning path puts them on one Azure Monitor workbook, one tab per check, and teaches the rule that comes with it: the workbook is a view, not evidence. You work through [The Daily Checks on One Dashboard: An Implementation Guide](../../books/guides/daily-checks-dashboard-implementation.md) in two modules, with the labs of its developer workbook, [*Building the Daily Checks Workbook*](../../project-plans/developer-workbooks/daily-checks/index.md).

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat the guide or the chapters. They tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for {#dc-who}

| Role | What you get from the path |
|---|---|
| Security operations (the workspace owner) | The sources, the template and its validator, the deployment and the reachability check |
| Operators (identity, devices, applications, data, network) | What each tab shows, what STALE means, and where each finding goes |
| ISSO reviewer | What the kit records, and why no render or screenshot is in the package; read each module's introduction and summary and skip the labs |

**Level:** intermediate. **Products:** Azure Monitor workbooks, Microsoft Sentinel, Log Analytics, Azure Resource Manager what-if, Microsoft Entra ID, Microsoft Intune, Microsoft Defender XDR. **Scope:** a civilian agency on Microsoft 365 GCC (Moderate) with its Sentinel workspace in commercial Azure, as the guide's [starting state](../../books/guides/daily-checks-dashboard-implementation.md#how-to-read) describes.

## Prerequisites {#dc-prerequisites}

- [Book 15, Chapter 12: The Day-Two Operator Runbook and Validation](../../books/b15-day2-operations/12-the-day-two-runbook.md), its cadence tables and the telemetry-completeness check. About 20 minutes.
- PowerShell 7.1 or later with Pester 5 for Lab 1; the Azure CLI for Lab 2.

## What you'll be able to do {#dc-outcomes}

When you finish the path, you'll be able to:

- say which daily checks fit a workbook, from which table, and which are a link out to another portal;
- give each source's GCC availability, and say why a preview or unspecified source is a link-out;
- build the workbook's template from reviewed files and catch a portal edit with the validator;
- read a tab as ATTENTION, CLEAR, STALE, NO DATA or LINK-OUT, and say why a stale source never shows clear;
- deploy the workbook with what-if and an approved hash, and roll it back;
- say what the kit records as evidence, and why the workbook itself never is.

## Modules {#dc-module-list}

| # | Module | Guide steps | Labs | Time |
|---|---|---|---|---|
| 1 | [One workbook, one tab per daily check](01-one-workbook-one-tab-per-check.md) | 1, 2 | Lab 1 (chapters [01](../../project-plans/developer-workbooks/daily-checks/01-the-daily-checks-and-where-each-lives.md#lab-1-fixtures-no-tenant), [02](../../project-plans/developer-workbooks/daily-checks/02-the-workbook-template-and-its-validator.md#lab-1-fixtures-no-tenant)), Lab 2 | 40 min, plus Lab 2 |
| 2 | [Reading it, deploying it and keeping the evidence](02-reading-deploying-and-the-evidence.md) | 3 to 6 | Lab 1 (chapter [03](../../project-plans/developer-workbooks/daily-checks/03-what-each-tab-would-show.md#lab-1-fixtures-no-tenant)), the runbook (chapter [04](../../project-plans/developer-workbooks/daily-checks/04-deploying-to-test-and-production.md)), Lab 2 | 40 min, plus Lab 2 |

: The modules of the Daily Checks Dashboard learning path {.striped .hover}

**Total time:** about 1 hour 20 minutes of reading, Lab 1 and knowledge checks. Lab 2 isn't counted: it needs a test subscription and workspace.

**Labs.** **Lab 1** is in the developer workbook: the kit in `examples/daily-checks-workbook` run on a laptop against a fictional workspace's fixtures, every command a copy-paste block with the kit's real output beside it. **Lab 2** is each chapter's step in a test workspace, never production. **The authors haven't run the Lab 2s.** [The Labs page](../labs.md#dc) lists every lab in the path.

::: {#dc-modules}
:::
