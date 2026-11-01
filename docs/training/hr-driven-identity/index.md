---
title: "Learning path: HR-Driven Identity in Microsoft Entra ID"
subtitle: "Seven modules, one per gate of the HR-driven identity implementation guide, each with a lab on fixtures and a lab in your own test tenant"
description: "A learning path in seven modules for identity engineers, developers, HR systems analysts and ISSO reviewers: name one writer for every account state, run contractors from their own source, make joiners ready on day one, assign access from HR attributes and review what a move leaves, check certificate-based authentication, time separations, and find lifecycle drift and file the evidence. Each module links the guide's gate, the developer workbook's chapter and Book 03, runs the chapter's Lab 1 with no tenant, points to Lab 2 for a test tenant, and ends with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 03"
last-reviewed: 2026-11-01
series-order: 0
listing:
  - id: hr-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
---

# Learning path: HR-Driven Identity in Microsoft Entra ID {.unnumbered}

The HR pipeline makes an account exist. This learning path teaches what happens to that account afterward: how the HR record decides every change, and how you prove that it did. You work through the seven gates of [HR-Driven Identity: An Implementation Guide](../../books/guides/hr-driven-identity-implementation.md) in order. In each module you run the tested code from the developer workbook [*Building HR-Driven Identity*](../../project-plans/developer-workbooks/hr-driven-identity/index.md) on your laptop, then read what the same step takes in a test tenant.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat the guide, the workbook or [Book 03](../../books/b03-hr-identity/index.md). They tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for

| Role | What you get from the path |
|---|---|
| Identity engineer | The order of work in the tenant for each gate, and the checks that prove it |
| Developer | The code in `examples/hr-lifecycle`: what each tool reads, the rules it applies and the output it writes |
| HR systems analyst | Which HR and contractor facts drive each account change, and what goes wrong when they arrive late or wrong |
| ISSO reviewer | The federal requirement each gate meets, and the evidence you keep to show it |

**Level:** intermediate. **Product:** Microsoft Entra ID, with Microsoft Entra ID Governance. **Scope:** a civilian agency at FedRAMP Moderate, in Microsoft 365 GCC with commercial Azure, as the [workbook](../../project-plans/developer-workbooks/hr-driven-identity/index.md) assumes.

## Prerequisites

- [Book 03, HR-Driven Identity](../../books/b03-hr-identity/index.md): at least its [overview](../../books/b03-hr-identity/01-overview-and-applicability.md). The modules link its chapters for the design; you don't need to read the whole book first.
- [Microsoft Automation, Module 1: Graph and Azure Foundations](../ms-automation-foundations.md): the clouds and endpoints, signing in from a script, permissions and paging.
- [Microsoft Automation, Module 2: Microsoft Entra ID through Microsoft Graph](../ms-automation-entra.md): reading users, groups, Conditional Access and logs through Graph.
- Python basics: you can run a script from a shell and read JSON. If you're new to Python, start with [the Python tutorial](https://docs.python.org/3/tutorial/).
- The guide's [path on one page](../../books/guides/hr-driven-identity-implementation.md#the-path-on-one-page): five minutes, and every module refers back to it.

## What you'll be able to do

When you finish the path, you'll be able to:

- name one writer for every account-state transition and HR-mastered value, and find writes by anyone else in the audit log;
- compute each contractor's earliest end and reconcile the contractor register, the card system and the directory without changing anything;
- keep Lifecycle Workflows definitions as reviewed code, plan each change as a new workflow or a new version, and measure day-one readiness;
- lint access package assignment policies before they reach the tenant, and list what a move leaves behind for review;
- check the certificate-based authentication trust store and each CRL against your cloud's limits;
- measure separation-to-block and separation-to-revocation for every leaver;
- turn the lifecycle drift classes and the six metrics into a hash-chained evidence package an ISSO can verify.

## Modules

Work through them in order. Module 7 reads what Modules 1, 2, 3, 4 and 6 produce.

| # | Module | Gate | Workbook chapter | Time |
|---|---|---|---|---|
| 1 | [Name one writer for every account state](01-one-writer-per-state.md) | G1 Writers | [01](../../project-plans/developer-workbooks/hr-driven-identity/01-the-writer-register-as-code.md) | 50 min |
| 2 | [Run contractors from their own source](02-contractor-sources.md) | G2 Sources | [02](../../project-plans/developer-workbooks/hr-driven-identity/02-contractor-sources-and-end-dates.md) | 50 min |
| 3 | [Make joiners ready on day one](03-joiners-and-the-temporary-access-pass.md) | G3 Joiners | [03](../../project-plans/developer-workbooks/hr-driven-identity/03-joiner-workflows-as-code.md) | 50 min |
| 4 | [Assign access from attributes and review what a move leaves](04-access-and-movers.md) | G4 Access and movers | [04](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md) | 50 min |
| 5 | [Check certificate-based authentication](05-certificate-based-authentication.md) | G5 Credentials | [05](../../project-plans/developer-workbooks/hr-driven-identity/05-certificate-based-authentication-checks.md) | 45 min |
| 6 | [Time separations from the logs](06-separation-timing.md) | G6 Separation | [06](../../project-plans/developer-workbooks/hr-driven-identity/06-separation-timing.md) | 45 min |
| 7 | [Find lifecycle drift and file the evidence](07-drift-and-evidence.md) | G7 Drift and evidence | [07](../../project-plans/developer-workbooks/hr-driven-identity/07-lifecycle-drift-and-evidence.md) | 60 min |

: The modules of the HR-Driven Identity learning path {.striped .hover}

**Total time:** about 5 hours 50 minutes, with each module's Lab 1. Lab 2, in your own test tenant, isn't counted: how long it takes depends on your tenant and your approvals.

Each module follows the same units: an introduction with the federal requirement it meets, learning objectives, prerequisites, one to three concept units, Lab 1, Lab 2, a knowledge check and a summary.

## What you need for the labs

**Lab 1: a laptop, no tenant.** Every module's Lab 1 runs the code in [`examples/hr-lifecycle`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hr-lifecycle) against fictional fixtures. Its [README](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/hr-lifecycle/README.md) asks for Python 3.10 or later and the standard library; the step that runs the tests also needs pytest. Clone the repository, and work in `examples/hr-lifecycle`. Module 2 also calls `examples/hcm-entra`, and Module 7 calls `examples/drift-pipeline`, both from the same clone. The commands are written for a bash shell, as in the workbook. Nothing in Lab 1 signs in to anything or sends a request.

**Lab 2: your own test tenant.** Lab 2 needs a Microsoft Entra test tenant in the worldwide or GCC cloud, never production, and Microsoft Entra ID Governance trial or test licenses for the modules that use Lifecycle Workflows, entitlement management or access reviews. Module 5 also needs certificate-based authentication configured for a test CA. The workbook has no hosted sandbox: you bring the tenant. **The authors didn't run the Lab 2 steps.** They are written from Microsoft Learn's procedures, and each one ends with a way to back it out. Read the [guide's prerequisites](../../books/guides/hr-driven-identity-implementation.md#prerequisites) for the licenses and roles before you start.

## How this path fits with the other pieces

The guide is finished when it has [four pieces](https://github.com/WhalerMike/modernization-workbook/blob/main/CONTRIBUTING.md#an-implementation-guide-is-finished-when-it-has-all-four-pieces): the guide, a narrated deck series, a developer workbook and a training path. This path is the training piece. The deck series is still planned; when it exists, each module will link its deck.

| Piece | Where |
|---|---|
| The design | [Book 03](../../books/b03-hr-identity/index.md) |
| The gates | [HR-Driven Identity: An Implementation Guide](../../books/guides/hr-driven-identity-implementation.md) |
| The code and its labs | [*Building HR-Driven Identity*](../../project-plans/developer-workbooks/hr-driven-identity/index.md), on [Book 19](../../books/b19-developer-workbook/index.md) |
| The schedule | [Identity Lifecycle & Provisioning plan](../../project-plans/identity-lifecycle.md) |
| The federal sources | [Federal framework crosswalk](../../reference/federal-framework-crosswalk.md) |

: Where each piece of HR-driven identity lives {.striped .hover}

## Modules in this path

::: {#hr-modules}
:::

---

*Original content for project use. Every fact is carried by link from the guide, the workbook and the books; the claims log is in the repository.*
