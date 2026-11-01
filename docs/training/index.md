---
title: "Training"
subtitle: "Learning paths: modules to work through in order, and the vendors' own training mapped to the workbook's roles"
description: "The Federal Modernization Workbook's training: the Microsoft Automation learning path in three modules, the Ticket-to-Machine and HR-Driven Identity learning paths in seven modules each, and external learning paths from product vendors."
doc-type: section-landing
fmw-eyebrow: "Training"
listing:
  - id: training-microsoft
    contents:
      - "ms-automation-*.md"
    type: table
    fields: [title, research-status, last-reviewed, description]
    field-display-names: &names
      research-status: "Status"
      last-reviewed: "Reviewed"
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
  - id: training-ttm
    contents:
      - "ticket-to-machine/[0-9][0-9]-*.md"
    type: table
    fields: [title, research-status, last-reviewed, description]
    field-display-names: *names
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
  - id: training-external
    contents:
      - "*.md"
      - "!index.md"
      - "!ms-automation-*.md"
      - "!ticket-to-machine/**"
      - "!hr-driven-identity/**"
    type: table
    fields: [title, research-status, last-reviewed, description]
    field-display-names: *names
    sort: "title asc"
    sort-ui: false
    filter-ui: false
---

# Training {.unnumbered}

Training pages teach a skill step by step, in the order you should learn it. They work like a [Microsoft Learn learning path](https://learn.microsoft.com/training/): a short series of modules, each building on the one before.

Each page keeps its status label (draft or in review) until it is reviewed and proved. See [Status labels](../about/sources-and-verification.md#status-labels) for what each label means.

## Microsoft Automation learning path

Three modules that teach you to script Microsoft Entra ID and Intune through Microsoft Graph in a federal tenant: which cloud's endpoints to call, how a script signs in without a secret, which least-privileged permissions each read needs, and how to turn the results into evidence. Each module is in Microsoft Learn's form: an introduction with the federal requirement it meets, objectives, concept units, **Where agencies are** with government-cloud availability, a lab on fixtures with no tenant, a lab in your own test tenant, a knowledge check and a summary. The code is [`examples/ms-automation`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation), in Python and PowerShell.

| | |
|---|---|
| **Level** | Intermediate |
| **Roles** | Developer, identity engineer, endpoint (Intune) engineer, ISSO reviewer |
| **Products** | Microsoft Graph, Microsoft Entra ID, Microsoft Intune |
| **Scope** | A FedRAMP Moderate civilian agency, most often in Microsoft 365 GCC with commercial Azure; each module says what differs in GCC High and DoD |
| **Modules** | 3 (three more are planned) |
| **Time** | About 4 hours 25 minutes, not counting the Lab 2 exercises |

**Prerequisites.** You can run commands in a terminal and read Python or PowerShell, and you know what an access token is. For the design behind the checks, skim [Book 02](../books/b02-identity/index.md), [Book 04](../books/b04-access/index.md) and [Book 05](../books/b05-devices/index.md); the modules link the chapters they use.

| # | Module | What you learn | Books | Time |
|---|---|---|---|---|
| 1 | [Graph and Azure Foundations](ms-automation-foundations.md) | Clouds and endpoints, signing in without a secret, permissions and consent, tools, paging, throttling, batching and delta | 02, 04, 05, 06, 10, 15 | 85 min |
| 2 | [Microsoft Entra ID through Microsoft Graph](ms-automation-entra.md) | Users, groups, Conditional Access, PIM, applications, logs and authentication methods; five checks mapped to ScubaGear | 02, 04 | 95 min |
| 3 | [Intune through Microsoft Graph](ms-automation-intune.md) | Managed devices, compliance, configuration, assignment filters, Autopilot, v1.0 versus beta; five checks mapped to NIST SP 800-53 Moderate | 05 | 85 min |

: The Microsoft Automation modules in order {.striped .hover}

Work through them in order: Module 1 sets up what the other two use. The developer workbook's [Chapter 02](../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md) goes deeper on the Graph client, and the [Ticket-to-Machine](ticket-to-machine/index.md) and [HR-Driven Identity](hr-driven-identity/index.md) paths build on Module 1. **If you're an ISSO reviewer,** read each module's introduction, Where agencies are and summary, and skip the labs.

### What you need for the Microsoft Automation labs

**Lab 1: fixtures, no tenant.** Every Lab 1 runs on a laptop against the kit's fictional fixtures, and nothing signs in or sends a request. You need:

- a copy of the repository, so you can work in `examples/ms-automation`;
- Python 3.10 or later, with `pytest`;
- PowerShell 7.5 or later with Pester 5, for the PowerShell steps and tests;
- a Bash-compatible shell for the commands as written.

Run every command from `examples/ms-automation`. Module 2's lab writes an `out` folder there; delete it afterward.

**Lab 2: your test tenant.** Each Lab 2 registers one app with a certificate and only the read permissions its checks need, runs them read-only, and ends by deleting the app registration. You need a test tenant in the worldwide or GCC cloud, never production, with fictional data; Microsoft Entra ID P1 or P2 for Module 2's sign-in and PIM data; an Intune license and a few test devices for Module 3; and an administrator who can grant admin consent. **The authors haven't run the Lab 2 steps.**

**Watch:** each module has a narrated deck, about 13 to 14 minutes, linked from the module's page.

::: {#training-microsoft}
:::

## Ticket-to-Machine learning path

[Learning path: Ticket-to-Machine on ServiceNow and SailPoint](ticket-to-machine/index.md) teaches you to build, test and evidence Book 13's Ticket-to-Machine loop on ServiceNow and SailPoint Identity Security Cloud, in seven modules mapped to the example guide's gates and the developer workbook's chapters. Each module has a lab on fixtures with no tenant, a pointer to a lab in your own test instance, and a knowledge check. Start with the path page for the roles, prerequisites and what you need for the labs.

::: {#training-ttm}
:::

## HR-Driven Identity learning path

Seven modules, one per gate of the [HR-driven identity implementation guide](../books/guides/hr-driven-identity-implementation.md), each with a lab on fixtures and a lab in your own test tenant. Start at the [learning path](hr-driven-identity/index.md).

## External learning paths

Vendors' own training, organized by role and linked to the books that use it.

::: {#training-external}
:::
