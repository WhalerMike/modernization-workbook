---
title: "Learning path: Privileged Access in Microsoft Entra ID and Azure"
subtitle: "Eight modules, one per chapter of the Privileged Access developer workbook, each with a lab on fixtures and a lab in your own test tenant"
description: "A learning path in eight modules for developers, identity engineers, platform engineers and ISSO reviewers: inventory every privileged assignment, check the emergency access accounts before anything else, keep Conditional Access for administrators and PIM settings for roles, groups and Azure resources as reviewed code, review privileged access, and file the evidence. Each module links the developer workbook's chapter, the project plan and Book 04, runs the chapter's Lab 1 with no tenant, points to Lab 2 for a test tenant, and ends with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 04"
series-order: 0
listing:
  - id: pa-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: approved
reviewed-sha256: f653b3b355e811a535c034e49a8f02de842de8ad0628f76e0f67de89df745b64
last-reviewed: 2026-11-07
---
# Learning path: Privileged Access in Microsoft Entra ID and Azure {.unnumbered}

Privilege should be just-in-time, by tier, and provable. This learning path teaches you to build the software that gets an estate there: code that reads every privileged assignment, checks the emergency access accounts, holds Conditional Access, PIM and access review settings as reviewed files, and hands the ISSO evidence a reviewer can check. You work through Chapters 01 to 08 of the developer workbook [*Building Privileged Access*](../../project-plans/developer-workbooks/privileged-access/index.md) in order; operators who deploy the kit also read its Chapter 09, the deployment runbook. In each module you run the workbook's tested code on your laptop, then read what the same step takes in a test tenant.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat the workbook, the project plan or [Book 04](../../books/b04-access/index.md). They tell you what to read, in what order, what to run, and what to check you understood.

::: {.callout-note}
## Where this path comes from
The path was written before the [Privileged Access implementation guide](../../books/guides/privileged-access-implementation.md) existed, so it follows the workbook rather than the guide. Its eight modules match the guide's eight gates one for one: Module N teaches gate GN. The path draws on two sources:

- the developer workbook [*Building Privileged Access*](../../project-plans/developer-workbooks/privileged-access/index.md), for the code, the labs and the federal requirements and evidence;
- the project plan [Privileged Access & Administrative Identity](../../project-plans/privileged-access.md), for the phases, the gates and the decisions.

Book 04's [privileged tiers](../../books/b04-access/04-privileged-roles-and-tiers.md), its [PIM build](../../books/b04-access/08-pim-self-request-with-approval.md) and its [access as code](../../books/b04-access/10-access-as-code-and-evidence.md) carry the design. Each module names the plan phase and tasks its chapter serves.
:::

::: {.callout-important}
## Emergency access first
One order in this project can't move. The plan says that "switching on approval before the emergency accounts exist is the one sequence that locks the agency out" ([critical path](../../project-plans/privileged-access.md#critical-path)). Learn documents the lockout: every Global Administrator and Privileged Role Administrator eligible, approval required, and no approvers selected, so no one can approve ([Chapter 02](../../project-plans/developer-workbooks/privileged-access/02-emergency-access-as-code.md#why-this-comes-first)).

So Module 2 checks the emergency access accounts before any module changes a setting, and every module that writes has a guard against locking people out:

| Module | The guard |
|---|---|
| 2 | PA-EA-01 to PA-EA-10 check each account against the standard, and an alert fires on any sign-in or audit event for them |
| 3 | PA-CA-01 fails a policy file that doesn't exclude the emergency access exclusion group; `-Apply` refuses a policy that leaves the group out |
| 4 | PA-PIM-01 refuses approval with no approver; PA-PIM-02 refuses any change until the emergency accounts hold Global Administrator, active, permanent and direct |
| 5 | PA-PG-G4 refuses eligible owners with no active owner; PA-PG-G6 refuses more removals than `-MaxRemovals`, the sign of a wrong or truncated file |
| 6 | Eligible first, then the removal, so no holder loses a role before they can activate it |
| 7 | PA-AR-06 refuses a review that would remove the emergency accounts' Global Administrator when reviewers don't respond |
| 8 | Every run repeats Module 2's check, and a new or changed emergency access finding is a Tier 0 incident |

: Where each module guards against the lockout {.striped .hover}
:::

## Who this path is for

| Role | What you get from the path |
|---|---|
| Developer | The code in `examples/privileged-access`: what each script reads, the rules it applies, the plan it writes and the guards that stop it |
| Identity engineer | The order of work in the tenant, the least privilege each task needs, and the checks that prove it |
| Platform engineer (Azure) | Module 1's Azure read and Module 6's PIM for Azure resources |
| ISSO reviewer | The federal requirements each chapter supports, and the evidence you keep for them |

**Level:** intermediate. **Products:** Microsoft Entra ID with Privileged Identity Management, Microsoft Entra ID Governance, Azure Resource Manager and Azure Monitor. **Scope:** Microsoft 365 GCC (Moderate) with commercial Azure, as the [workbook](../../project-plans/developer-workbooks/privileged-access/index.md) assumes. GCC uses the worldwide endpoints; GCC High and DoD have separate hosts, and each chapter says so where an endpoint matters.

## Prerequisites

- [Book 04, Chapter 04](../../books/b04-access/04-privileged-roles-and-tiers.md): the program's tiers, and how a role reaches a person. The workbook's [reading paths](../../project-plans/developer-workbooks/privileged-access/index.md#reading-paths) start here.
- The project plan's [gates](../../project-plans/privileged-access.md#gates) and [decision points](../../project-plans/privileged-access.md#decision-points): five minutes, and the modules refer back to them.
- [Microsoft Automation, Module 1: Graph and Azure Foundations](../ms-automation-foundations.md): the clouds and endpoints, signing in from a script, permissions and paging.
- [Microsoft Automation, Module 2: Microsoft Entra ID through Microsoft Graph](../ms-automation-entra.md): reading Conditional Access, PIM and logs through Graph.
- PowerShell 7: you can run a script and read its output. Module 8 also uses Python and a POSIX shell.

## What you'll be able to do

When you finish the path, you'll be able to:

- list every privileged assignment, active and eligible, direct or through a group, in Entra and Azure, with a tier and the findings a reviewer acts on;
- check each emergency access account against Learn's standard, and build the alert on their use as a reviewed template;
- keep the administrator policies and the activation gate as files, check them before merge, and create every new policy report-only;
- hold PIM role settings for Entra roles, the PRV groups and Azure resources as reviewed code, and apply a change only after a dry run;
- define every privileged access review series as code, and read back the decisions as evidence;
- run the privileged reads on a schedule, compare runs without putting names in the tracker, and hand the ISSO a hash-chained period.

## Modules

Work through them in order. The modules follow the workbook's chapters, which follow the plan's phases. Module 8 reads what Modules 1 and 2 produce.

| # | Module | Plan phase and tasks | Workbook chapter | Time |
|---|---|---|---|---|
| 1 | [Inventory every privileged assignment](01-privileged-inventory.md) | Phase 0: A0.1, A0.2; Gate 0 | [01](../../project-plans/developer-workbooks/privileged-access/01-privileged-inventory-as-code.md) | 50 min |
| 2 | [Emergency access first](02-emergency-access-first.md) | Phase 0: A0.4; Phase 1: A1.1 | [02](../../project-plans/developer-workbooks/privileged-access/02-emergency-access-as-code.md) | 55 min |
| 3 | [Conditional Access for administrators and the activation gate](03-conditional-access-and-the-activation-gate.md) | Phase 1: A1.5; Phase 2: A2.3, A2.5, A2.6 | [03](../../project-plans/developer-workbooks/privileged-access/03-conditional-access-for-administrators.md) | 55 min |
| 4 | [PIM for Microsoft Entra roles as code](04-pim-for-entra-roles.md) | Phase 1: A1.6; Phase 2: A2.1, A2.2; Phase 3: A3.1 | [04](../../project-plans/developer-workbooks/privileged-access/04-pim-for-entra-roles-as-code.md) | 55 min |
| 5 | [PIM for Groups and the PRV groups](05-pim-for-groups.md) | Phase 2: A2.1; Phase 3: A3.3 | [05](../../project-plans/developer-workbooks/privileged-access/05-pim-for-groups.md) | 55 min |
| 6 | [PIM for Azure resources](06-pim-for-azure-resources.md) | Phase 3: A3.2 | [06](../../project-plans/developer-workbooks/privileged-access/06-pim-for-azure-resources.md) | 50 min |
| 7 | [Access reviews of privileged roles](07-access-reviews.md) | Phase 2: A2.7; Phase 3: A3.7 | [07](../../project-plans/developer-workbooks/privileged-access/07-access-reviews-of-privileged-roles.md) | 55 min |
| 8 | [Evidence and drift for the ISSO](08-evidence-and-drift.md) | Phase 3: A3.6; Phase 4: A4.3; Gate 4 | [08](../../project-plans/developer-workbooks/privileged-access/08-evidence-and-drift.md) | 65 min |

: The modules of the Privileged Access learning path {.striped .hover}

**Total time:** about 7 hours 20 minutes, with each module's Lab 1. Lab 2, in your own test tenant, isn't counted: how long it takes depends on your tenant and your approvals.

**Why eight modules.** There is one module per workbook chapter from 01 to 08 (Chapter 09 is the deployment runbook, for operators who deploy the kit). Each chapter builds a different skill, with its own PowerShell module, call list, findings and Lab 1, so no two fit in one module of under an hour. Modules 4, 5 and 6 all hold PIM settings as code, but they differ in what matters: Module 4 has the lockout guard and the rollout waves, Module 5 the group rules and the removal guard, and Module 6 goes through Azure Resource Manager, not Graph, with Azure roles instead of Graph permissions.

Each module follows the same units: an introduction with the federal requirements it supports, learning objectives, prerequisites, one or two concept units, Lab 1, Lab 2, a knowledge check and a summary.

**If you're an ISSO reviewer,** read each module's introduction, its federal requirement and its summary, and skip the labs. Module 8 is yours in full. The workbook's checklists at the end of each chapter are what you check before the code ships.

## What you need for the labs

**Lab 1: a laptop, no tenant.** Every module's Lab 1 runs the code in [`examples/privileged-access`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/privileged-access) against a fictional `contoso.example` tenant served by a fake. Nothing signs in and nothing leaves the machine. You need:

- a copy of the repository, or the code as one zip from the [Labs page](../labs.md#pa);
- PowerShell 7.1 or later with Pester 5;
- for Module 8 only: Python 3.10 or later with pytest and PyYAML, and a shell with `sha256sum` (Linux, macOS or Git Bash).

Run every PowerShell command from `examples/privileged-access`, in one PowerShell 7 session per module: later steps use the module and variables an earlier step loaded. Module 8's POSIX steps run in `examples/drift-pipeline`. Each lab writes to an `out` folder; delete it when you're done, because it names the fixture's privileged holders.

**Lab 2: your own test tenant.** Lab 2 needs a test tenant in the worldwide or GCC cloud for learning, never production, with fictional people (before a gate passes, rehearse once in your agency's own cloud, as [Book 16](../../books/b16-people/06-vendor-training-and-labs.md#what-changes-in-the-government-clouds) describes). Depending on the module you also need a test Azure subscription, Microsoft Entra ID P1, P2 or Microsoft Entra ID Governance licenses, and a Log Analytics workspace; each module says which. Lab 2 is a pointer to the workbook chapter's Lab 2, which gives every step as a command or a portal path and ends with a back-out. The workbook has no hosted sandbox: you bring the tenant. **This path's authors didn't run the Lab 2 steps,** and the workbook says its code hasn't been run against a production tenant.

## How this path fits with the other pieces

| Piece | Where |
|---|---|
| The design | [Book 04](../../books/b04-access/index.md), Chapters 04 to 10 and [Appendix B](../../books/b04-access/appendix-b-pim-role-settings.md) |
| The schedule, gates and decisions | [Privileged Access & Administrative Identity plan](../../project-plans/privileged-access.md) |
| The code and its labs | [*Building Privileged Access*](../../project-plans/developer-workbooks/privileged-access/index.md), with a narrated tour per chapter |
| Every lab in one place | [Labs](../labs.md#pa) |
| The federal sources | [Federal framework crosswalk](../../reference/federal-framework-crosswalk.md) |

: Where each piece of privileged access lives {.striped .hover}

The [implementation guide](../../books/guides/privileged-access-implementation.md) runs the same eight steps as gated work for an operator. Each module links its narrated deck and video. Each workbook chapter's narrated tour is on the [workbook index](../../project-plans/developer-workbooks/privileged-access/index.md).

## Status and review

**Draft.** The path and its knowledge checks are new writing; every fact they rely on is on a linked page and carries that page's verification. Each module's Lab 1 commands were run against the kit on November 2, 2026, and the expected output shown is what the kit printed, as recorded in its [kit captures](https://github.com/WhalerMike/modernization-workbook/tree/main/data/kit-captures/pa). What each status means is in [Status labels](../../about/sources-and-verification.md#status-labels).

## Modules in this path

::: {#pa-modules}
:::

---

*Original content for project use. Every fact is carried by link from the workbook, the project plan and Book 04; the claims log is in the repository.*
