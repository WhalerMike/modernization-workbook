---
title: "Learning path: Building the Attribute-Driven Migration"
subtitle: "Nine modules that teach you to build, test and evidence the software the Attribute-Driven Migration runs on, one Book 19 chapter at a time, in the order of the implementation guide's gates"
description: "Research draft: a learning path in nine modules for developers, platform engineers, identity engineers and ISSO reviewers. Each module maps one chapter of Book 19, Building the Attribute-Driven Migration, to the implementation guide's gates it serves, runs the chapter's Lab 1 on the kit's fixtures with no tenant, points to Lab 2 in a non-production environment, names the federal requirement with its KSI and evidence, and ends with a knowledge check. Chapter 02 is taught by the Microsoft Automation path's Module 1."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 19"
series-order: 0
date-modified: 2026-11-02
listing:
  - id: adm-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: approved
reviewed-sha256: a0ed4e27ff8330b12c52d722632b4cb2a6f3cb99ef0eb7b68a121b759d5f6532
last-reviewed: 2026-11-03
---
# Learning path: Building the Attribute-Driven Migration {.unnumbered}

The Attribute-Driven Migration moves an agency from Active Directory to Microsoft Entra ID by placing people, devices and servers in policy through attributes, not OU placement. Two long documents describe it. [Attribute-Driven Migration: An Implementation Guide](../../books/guides/attribute-driven-migration-implementation.md) tells the people who **run** the migration what has to be true at each of its ten gates, and how to prove it. [Book 19, *Building the Attribute-Driven Migration*](../../books/b19-developer-workbook/index.md) teaches the people who **build** the software those gates rely on.

This path teaches Book 19 in the order of the guide's gates. Each module takes one chapter, says which gates its code serves, runs the chapter's Lab 1 on your laptop, and checks what you learned. Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat the guide or the workbook. They tell you what to read, what to run, and what the ISSO keeps.

## About this path

| | |
|---|---|
| **Level** | Intermediate |
| **Roles** | Developer, platform engineer, identity engineer, Intune engineer, ISSO reviewer |
| **Products** | Microsoft Entra ID and its API-driven inbound provisioning, Lifecycle Workflows, Microsoft Intune, Azure Arc, Azure Policy machine configuration, GitHub Actions; Microsoft Graph throughout |
| **Scope** | A civilian agency at FedRAMP Moderate, usually in Microsoft 365 GCC with commercial Azure, as the [guide](../../books/guides/attribute-driven-migration-implementation.md#how-to-use-this-guide) sets out |
| **Modules** | 9, and Microsoft Automation's Module 1 for Chapter 02 |
| **Time** | About 7 hours 25 minutes, not counting the Lab 2 exercises |

## What you'll be able to do

When you finish this path, you'll be able to:

- send HR records to Entra ID through a client that refuses bad rows, orders leavers first, holds a mass disable and ties every batch to its inputs by hash;
- add a validation kit check that reads only, asks for the least privilege it can, and can't pass when it didn't look;
- keep dynamic group rules in Git with tests, a linter for the guards and a shadow diff, and pause and resume them safely in an incident;
- turn Group Policy into a reviewed move plan and settings catalog files, and create only what a dry run showed;
- build a machine configuration package whose MOF is the same every time, and refuse a definition the release registry doesn't allow;
- plan an Arc onboarding wave from a CMDB export, with both owners tagged, before anything runs;
- build a Lifecycle Workflows custom extension that calls back honestly, in the right cloud, and blocks before it revokes;
- run the drift pipeline, read what changed since the last run, and hand the ISSO a package `sha256sum` verifies;
- dry-run the deployment runbook's pre-flight check, smoke test, rollback plan and evidence check.

## Prerequisites

- **The migration.** Read the guide's [path on one page](../../books/guides/attribute-driven-migration-implementation.md#the-path-on-one-page) and its [one identifier through every gate](../../books/guides/attribute-driven-migration-implementation.md#one-identifier-through-every-gate): ten minutes, and every module refers back to them. [This workbook or the implementation guide?](../../books/b19-developer-workbook/index.md#workbook-or-guide) says how the two documents divide the work.
- **Microsoft Graph and the government clouds.** Work through [Microsoft Automation, Module 1: Graph and Azure Foundations](../ms-automation-foundations.md) first. It is this path's lesson for [Book 19, Chapter 02](../../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md): see [Chapter 02 is taught elsewhere](#chapter-02-is-taught-elsewhere).
- **Code.** You can read PowerShell 7 and Python, run commands in a terminal, and read JSON. Module 6 also reads Ansible playbooks, and Module 8 a GitHub Actions workflow.

## Modules

Work through the modules in order. The times are estimates for the reading, the Lab 1 exercise and the knowledge check.

| # | Module | Guide gates | Workbook chapters | Time |
|---|---|---|---|---|
| 1 | [Send HR records through a middleware that fails closed](01-the-hr-middleware.md) | [G2](../../books/guides/attribute-driven-migration-implementation.md#gate-2-prove-the-attributes), [G3](../../books/guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync) | [01](../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md) | 55 min |
| 2 | [Write a validation kit check](02-a-validation-kit-check.md) | [G3](../../books/guides/attribute-driven-migration-implementation.md#gate-3-map-the-attributes-through-sync) | [03](../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md) | 45 min |
| 3 | [Keep dynamic rules as code](03-dynamic-rules-as-code.md) | [G4](../../books/guides/attribute-driven-migration-implementation.md#gate-4-the-dynamic-group-library-and-administrative-units) | [04](../../books/b19-developer-workbook/04-dynamic-rules-as-code.md) | 50 min |
| 4 | [Move Group Policy as code](04-group-policy-as-code.md) | [G0](../../books/guides/attribute-driven-migration-implementation.md#gate-0-read-the-ou-tree), [G5](../../books/guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions), [G8](../../books/guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) | [06](../../books/b19-developer-workbook/06-group-policy-as-code.md) | 50 min |
| 5 | [Build machine configuration packages](05-machine-configuration.md) | [G5](../../books/guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions) | [07](../../books/b19-developer-workbook/07-machine-configuration-packages.md) | 45 min |
| 6 | [Onboard servers with Ansible beside Arc](06-ansible-beside-arc.md) | [G5](../../books/guides/attribute-driven-migration-implementation.md#gate-5-personas-and-targeting-conventions), [G8](../../books/guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) | [08](../../books/b19-developer-workbook/08-ansible-beside-arc.md) | 45 min |
| 7 | [Extend Lifecycle Workflows](07-lifecycle-workflows-extensions.md) | [G7](../../books/guides/attribute-driven-migration-implementation.md#gate-7-prove-a-mover-across-the-tracks), [G8](../../books/guides/attribute-driven-migration-implementation.md#gate-8-cut-over-and-retire-the-ou-tree) | [05](../../books/b19-developer-workbook/05-lifecycle-workflows-custom-extensions.md) | 50 min |
| 8 | [Run the drift pipeline and hand over the evidence](08-drift-and-evidence.md) | [G9](../../books/guides/attribute-driven-migration-implementation.md#gate-9-keep-the-attributes-true) | [09](../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md) | 55 min |
| 9 | [Deploy to test, then production](09-deploying-to-test-and-production.md) | Every gate, through the [step-to-gate map](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#step-to-gate-map) | [10](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md) | 50 min |

: The modules in order {.striped .hover}

### Why one module per chapter

The path follows Book 19's chapters, not the guide's gates, for four reasons:

- **The labs live in the chapters.** Every chapter has a Lab 1 on fixtures and a Lab 2 in a non-production environment, written as exact commands. The guide's gates have none: their Validate steps run the validation kit against a live tenant.
- **So do the federal tables.** Each chapter has a *Federal requirements and evidence* table with a KSI for every row. The gates name their evidence but not their controls.
- **The gates and chapters don't line up one to one.** Gate 5 needs three chapters (06, 07 and 08). Gate 8 draws on three (05, 06 and 08). Gates 1 and 6 have no chapter at all.
- **The order still follows the gates.** The modules are sorted by the first gate each chapter serves, using [Chapter 10's step-to-gate map](../../books/b19-developer-workbook/10-deploying-to-test-and-production.md#step-to-gate-map). That's why Chapter 05, which serves Gates 7 and 8, comes after Chapters 06 to 08.

Each module's *Guide gates* column comes from that map, or from the gate's own Validate step: Module 2's check, VK-SYNC-02, is Gate 3's match-blocking check in [Where the kits stop](../../books/guides/attribute-driven-migration-implementation.md#where-the-kits-stop), and Module 4's first step runs VK-INT-07, which [Gate 0's Validate step](../../books/guides/attribute-driven-migration-implementation.md#gate-0-read-the-ou-tree) names.

### Gates with no module

- **Gate 1, schema and slots,** is a signed register, not code. Its Validate step runs the Start Kit's attribute survey and VK-HR-01, VK-HR-04 and VK-HR-07, checks the kit already has. Module 2 teaches how such a check is built and how to read its result.
- **Gate 6, PIV and CAC binding,** runs VK-PIV-01. No Book 19 chapter builds code for it.

### Chapter 02 is taught elsewhere {#chapter-02-is-taught-elsewhere}

[Book 19, Chapter 02, Graph clients for the government clouds](../../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md) is the foundation the other chapters lean on. The [Microsoft Automation path's Module 1](../ms-automation-foundations.md) already teaches it: the same `examples/ms-automation` client, the clouds and endpoints, signing in without a secret, least privilege per call, paging and throttling. Its Lab 2 is Chapter 02's Lab 2. This path doesn't repeat it. Do Module 1 first, then [Chapter 02, Lab 1](../../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md#lab-1-fixtures-no-tenant), which runs the same client against Microsoft's own SDK snippets.

Two more Microsoft Automation modules help as background: [Module 2](../ms-automation-entra.md) for groups and Conditional Access through Graph (this path's Module 3), and [Module 3](../ms-automation-intune.md) for the settings catalog and Intune's v1.0 and beta APIs (this path's Module 4).

**If you're an ISSO reviewer,** read each module's introduction, its federal requirement, its summary and the chapter's checklist, and skip the labs. Module 8 is yours in full. Book 19's [reading paths](../../books/b19-developer-workbook/index.md#reading-paths) suggest an order for each role.

## What you need for the labs

Every module has two exercises.

**Lab 1: fixtures, no tenant.** Every Lab 1 runs on a laptop against the kits' fictional fixtures, and nothing signs in. Clone the repository and work in the `examples` folder each module names, or download [attribute-driven-migration-code.zip](../../../downloads/attribute-driven-migration-code.zip), which holds every folder the chapters use. You need:

- PowerShell 7 with Pester 5, for Modules 2, 3, 4 and 5 (Module 5 needs Windows);
- Python 3.10 or later with pytest, for Modules 1, 7, 8 and 9 (Module 8 also needs PyYAML);
- a POSIX shell, such as Git Bash on Windows, for the `bash` blocks;
- for Module 6, a disposable Linux control node or WSL with `ansible-core`, `ansible-lint` and `yamllint`.

Module 5's first step and Module 6's first step download pinned modules and collections, from the PowerShell Gallery and from Ansible Galaxy. Each chapter says which versions.

**Lab 2: a non-production environment.** Each Lab 2 is a short pointer to the chapter's Lab 2. **The authors haven't run them.** Depending on the module you need a test Entra tenant, never production, with fictional users; Entra ID Governance licenses for Module 7; Intune licenses for Module 4; a test Azure subscription and a disposable server for Modules 5 and 6; and a private test repository for Module 8. Every Lab 2 ends with a back-out step. Do it before you leave the module.

## Where this path sits

This path is the training piece of the Attribute-Driven Migration project. The design is in the [companion guide](../../books/guides/attribute-driven-migration.md). The gates are in the [implementation guide](../../books/guides/attribute-driven-migration-implementation.md), and the schedule is in the [project plan](../../project-plans/attribute-driven-migration.md). The code and its labs are in [Book 19](../../books/b19-developer-workbook/index.md), and every lab is listed on the [Labs page](../labs.md#adm). Each chapter has a narrated tour, listed in Book 19's [narrated chapter tours](../../books/b19-developer-workbook/index.md#narrated-chapter-tours); the narrated decks for these modules come later. Federal sources are in the [federal framework crosswalk](../../reference/federal-framework-crosswalk.md).

## Status and review

**Draft.** The path, its framing and its knowledge checks are new writing; every fact they rely on is on a linked page and carries that page's verification. Where a module shows output, it is the kit's real output, from the captures in [`data/kit-captures/adm`](https://github.com/WhalerMike/modernization-workbook/tree/main/data/kit-captures/adm) or from the chapter's own text, and the Lab 1 commands of Modules 1 to 4, 7, 8 and 9 were run again on November 2, 2026. To move this path to **In review**, a reviewer works through it end to end and confirms each knowledge-check answer against the linked section. What each status means is in [Status labels](../../about/sources-and-verification.md#status-labels).

## Modules in this path

::: {#adm-modules}
:::

::: {.callout-tip}
## Start the path
[Module 1: Send HR records through a middleware that fails closed →](01-the-hr-middleware.md)
:::
