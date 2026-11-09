---
title: "Learning path: Provider Notices"
subtitle: "Nine modules: why notices go unread, one module per provider, routing, the digest and evidence, and an optional module on the deployment runbook, each with a lab on fixtures and a pointer to a lab in your own test environment"
description: "A learning path in nine modules for cloud platform leads, Microsoft 365 service owners, developers, service desk and change managers, and ISSO reviewers: why the notices cloud providers send about the agency's own estate go unread, then Azure Service Health with Service Health alerts, the Microsoft 365 Message center, Oracle Cloud Infrastructure announcements, AWS Health and its support plan, Google Cloud incidents and the maintenance gap, routing notices to owners as Ticket-to-Machine tasks, and the weekly digest, evidence and go/no-go; then, optionally, the runbook that deploys it all to a test environment and production. Each module links the guide's gate, the developer workbook's chapter and its exact-command Lab 1 with no tenant, points to Lab 2 for a test environment, and ends with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 0
listing:
  - id: pn-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: approved
reviewed-sha256: e248fe1e17d48b226c3c28c44735d7166b68dae422a62908d1c0b2be5c1f127c
last-reviewed: 2026-11-09
---
# Learning path: Provider Notices {.unnumbered}

Every cloud provider tells the agency, in writing and ahead of time, what it will change, retire or patch in the agency's own tenant, account, tenancy or project. The notices land in a portal or one person's inbox, and nobody owns them. This learning path teaches you to read each provider's notices from its own record, hold every notice as one record, give the ones that need action an owner and a due date, and keep the evidence. You work through the seven gates of [Provider Notices: An Implementation Guide](../../books/guides/provider-notices-implementation.md) in order. In each module you run the tested code from the developer workbook [*Building Provider Notices*](../../project-plans/developer-workbooks/provider-notices/index.md) on your laptop, then read what the same step takes in a test environment.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat the guide, the workbook or [Book 15, Chapter 14](../../books/b15-day2-operations/14-provider-notices.md). They tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for

| Role | What you get from the path |
|---|---|
| Cloud platform lead | Azure Service Health with its alert policy, Oracle Cloud Infrastructure announcements, AWS Health and Google Cloud incidents: the reader each needs, its cloud, and the check that proves it |
| Microsoft 365 service owner | Message center posts and service health issues, read on the tenant's own Graph host, and who said a post needs action |
| Developer | The code in `examples/provider-notices`: the notice record and its fingerprint, the five collectors, the router, the digest and the evidence chain |
| Service desk and change manager | The routing file, the task payloads, why a re-run writes nothing, and why a task closes only on the re-read |
| ISSO reviewer | The federal requirements each gate supports, the KSI it aligns to, the evidence you keep, and the go/no-go |

**Level:** intermediate. **Products:** Azure Service Health and Azure Resource Graph, Azure Policy, the Microsoft Graph service communications API, Oracle Cloud Infrastructure Announcements, AWS Health and Google Cloud Personalized Service Health. **Scope:** a civilian agency at FedRAMP Moderate, in Microsoft 365 GCC with commercial Azure, with workloads in Oracle Cloud Infrastructure and possibly AWS or Google Cloud, as the [workbook](../../project-plans/developer-workbooks/provider-notices/index.md) assumes. An agency whose HR platform runs on Oracle Cloud Infrastructure reads that tenancy's announcements in Module 4.

## Prerequisites

- [Book 15, Chapter 14](../../books/b15-day2-operations/14-provider-notices.md): why notices go unread, the six kinds of notice and who owns each. Module 1 reads it with you.
- The guide's [track at a glance](../../books/guides/provider-notices-implementation.md#the-track-at-a-glance) and [path on one page](../../books/guides/provider-notices-implementation.md#the-path-on-one-page): ten minutes, and every module refers back to them.
- [Book 13, Appendix B](../../books/b13-governance/appendix-b-ticket-to-machine-reference.md), the Ticket-to-Machine reference, before Module 7.
- PowerShell basics: you can run a script, import a module and read the objects it returns.

## What you'll be able to do

When you finish the path, you'll be able to:

- explain why provider notices go unread, and name the six kinds of notice and who owns each;
- read every notice each enabled provider publishes about the agency's estate, with the least-privileged reader, in the cloud the settings name;
- tell a provider's own action date from one the kit's rule inferred, from the record's `actionBasis`;
- plan Service Health alerts at scale with Azure Policy, applied only with an approved SHA-256;
- record what each provider doesn't cover: Google Cloud's planned maintenance, an AWS account without a qualifying AWS Support plan, a realm or package the kit can't read;
- route the notices that need action to an owner as Ticket-to-Machine typed tasks, de-duplicated across runs, closed only on the re-read;
- write the weekly digest, record every run as hashed and chained evidence, and say whether a stage passes the go/no-go;
- optionally, dry-run the deployment to a test environment and production, with a pre-flight, a weekly run, a stage check and a rollback plan.

## Modules

Work through them in order. Module 1 is the why and the record; Modules 2 to 6 are the five providers, one gate each, and are independent: an agency that doesn't use AWS or Google Cloud can skip Module 5 or 6. Modules 7 and 8 need at least one provider. Module 9, the deployment runbook, is optional: it is for whoever deploys the kit, and it runs every gate's code in one safe order.

| # | Module | Gate | Workbook chapter | Time |
|---|---|---|---|---|
| 1 | [Why provider notices go unread](01-why-provider-notices-go-unread.md) | Before the gates: the track at a glance | [01](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md) | 45 min |
| 2 | [Azure Service Health and alerts](02-azure-service-health-and-alerts.md) | G1 Azure Service Health | [01](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md) | 55 min |
| 3 | [Microsoft 365 Message center](03-microsoft-365-message-center.md) | G2 Microsoft 365 | [02](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md) | 50 min |
| 4 | [Oracle Cloud Infrastructure announcements](04-oci-announcements.md) | G3 Oracle Cloud Infrastructure | [03](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md) | 45 min |
| 5 | [AWS Health and the support plan](05-aws-health-and-the-support-plan.md) | G4 AWS Health | [04](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md) | 50 min |
| 6 | [Google incidents and the maintenance gap](06-google-incidents-and-the-maintenance-gap.md) | G5 Google Cloud | [05](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md) | 45 min |
| 7 | [Routing to owners](07-routing-to-owners.md) | G6 Routing | [06](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md) | 65 min |
| 8 | [Digest, evidence and go/no-go](08-digest-evidence-and-go-no-go.md) | G7 Digest and evidence | [07](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md) | 60 min |
| 9 | [Deploying to test and production (optional)](09-deploying-to-test-and-production.md) | Every gate, through the [stage steps](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md#stage-1-test) | [08](../../project-plans/developer-workbooks/provider-notices/08-deploying-to-test-and-production.md) | 55 min |

: The modules of the Provider Notices learning path {.striped .hover}

**Total time:** about 6 hours 55 minutes with each module's Lab 1, or 7 hours 50 minutes with the optional Module 9. Lab 2, in your own test environment, isn't counted: how long it takes depends on your tenant, account, tenancy or project and your approvals.

**Why nine modules.** The guide has seven gates. Workbook Chapter 01 holds two things: the notice record every provider fills, and the Azure collector. The record is what makes the other modules make sense, so Module 1 teaches it with the reason notices go unread, and Module 2 teaches Azure. Chapter 08, the runbook, serves every gate and isn't a gate itself, so it is a module of its own, and optional.

**If you're an ISSO reviewer,** read each module's introduction, its federal requirement table and its summary, and skip the labs. Modules 1 and 8 are yours in full. The workbook's [reading paths](../../project-plans/developer-workbooks/provider-notices/index.md#reading-paths) suggest an order for each role.

Each module follows the same units: an introduction with the federal requirements it supports, learning objectives, prerequisites, one or two concept units, Lab 1, Lab 2, a knowledge check and a summary.

## What you need for the labs

**Lab 1: a laptop, no tenant.** Every module's Lab 1 runs the code in [`examples/provider-notices`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/provider-notices) against the kit's fictional fixtures: two weeks of notices from every provider, `tests/fixtures/day1` and `day2`, for fictional `contoso.example` subscriptions, a tenant, a tenancy, AWS's documentation account `111122223333` and a project. You need:

- a copy of the repository, so you can work in `examples/provider-notices` (Module 7's router test also reads `examples/servicenow-sailpoint`, which the repository and the kit's download include);
- PowerShell 7.1 or later with Pester 5.

Run every command from `examples/provider-notices`, in PowerShell 7. Each lab writes an `out` folder there and deletes it at the end. Nothing in Lab 1 signs in to anything or sends a request.

**Lab 2: your own test environment.** Each provider's Lab 2 needs that provider's test environment, never production, with fictional data: an Azure test subscription, a Microsoft 365 test tenant in the worldwide or GCC cloud, an OCI test tenancy, an AWS test account (with a qualifying AWS Support plan, or the error is the result), a Google Cloud test project, or a ServiceNow developer instance. Each module says which. The workbook has no hosted sandbox: you bring the environment. **The authors didn't run the Lab 2 steps.** Each one ends with a way to back it out. Read the [guide's prerequisites](../../books/guides/provider-notices-implementation.md#prerequisites) for the roles and permissions before you start.

**Your routing stays at work.** The labs use the kit's fictional routing, `config/routing.json`. The agency's own routing, settings files, notices, digests and evidence are written at work, from the kit's templates and its [Copilot prompts](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/provider-notices/copilot-prompts.md) in Microsoft 365 Copilot Chat, and stay on agency storage.

## How this path fits with the other pieces

The guide is finished when it has [four pieces](https://github.com/WhalerMike/modernization-workbook/blob/main/CONTRIBUTING.md#an-implementation-guide-is-finished-when-it-has-all-four-pieces): the guide, a narrated deck series, a developer workbook and a training path. This path is the training piece. The narrated decks for these modules, and the workbook chapters' narrated tours, come later; each module will link its own.

| Piece | Where |
|---|---|
| The operating model | [Book 15, Chapter 14](../../books/b15-day2-operations/14-provider-notices.md), with [Chapter 03](../../books/b15-day2-operations/03-intake-triage-and-routing.md) for today's email routing |
| The gates | [Provider Notices: An Implementation Guide](../../books/guides/provider-notices-implementation.md) |
| The code and its labs | [*Building Provider Notices*](../../project-plans/developer-workbooks/provider-notices/index.md) |
| The task pattern | [Book 13, Chapter 10](../../books/b13-governance/10-ticket-to-machine.md) and [Appendix B](../../books/b13-governance/appendix-b-ticket-to-machine-reference.md); the [Ticket-to-Machine learning path](../ticket-to-machine/index.md) |
| The federal sources | The guide's [Evidence](../../books/guides/provider-notices-implementation.md#evidence) table and the [federal framework crosswalk](../../reference/federal-framework-crosswalk.md) |

: Where each piece of provider notices lives {.striped .hover}

## Modules in this path

::: {#pn-modules}
:::

---

*Original content for project use. Every fact is carried by link from the guide, the workbook and Book 15, Chapter 14; the claims log is in the repository.*
