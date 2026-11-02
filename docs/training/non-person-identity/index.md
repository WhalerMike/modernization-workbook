---
title: "Learning path: Non-Person Identity in Microsoft Entra ID"
subtitle: "Ten modules, one per chapter of the developer workbook, in the order of the implementation guide's six gates, each with a lab on fixtures and a lab in your own test tenant"
description: "A learning path in ten modules for identity engineers, Active Directory engineers, developers, AI governance staff and ISSO reviewers: inventory every service account and workload identity, give each one owners and a sponsor, decide its target, set the credential rules, cut its privilege, put Conditional Access on it, convert it with a parallel run, govern AI agent identities, and find drift and file the evidence. Each module links the guide's gate, the developer workbook's chapter and its exact-command Lab 1 with no tenant, points to Lab 2 for a test tenant, and ends with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Books 02, 04, 17"
last-reviewed: 2026-11-02
series-order: 0
listing:
  - id: npi-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
---

# Learning path: Non-Person Identity in Microsoft Entra ID {.unnumbered}

A person leaves and HR tells you. A service account's owner leaves and nothing tells you. This learning path teaches you to build the record that HR gives you for people: every non-person identity listed, owned, decided, credentialed, scoped and watched. You work through the six gates of [Non-Person Identity: An Implementation Guide](../../books/guides/non-person-identity-implementation.md) in order. In each module you run the tested code from the developer workbook [*Building Non-Person Identity*](../../project-plans/developer-workbooks/non-person-identity/index.md) on your laptop, then read what the same step takes in a test tenant.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat the guide or the workbook. They tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for

| Role | What you get from the path |
|---|---|
| Identity engineer | The order of work in the tenant for each gate, and the checks that prove it |
| Active Directory engineer | The service accounts, MSAs, gMSAs and dMSAs, and the Kerberos accounts that stay on an island |
| Developer | The code in `examples/non-person-identity`: what each script reads, the rules it applies, the plan it writes and the manifest it keeps |
| AI governance staff | Agent identities, blueprints and sponsors, and the checks that hold them to the program's rule |
| ISSO reviewer | The federal requirement each gate meets, the KSI it lines up with, and the evidence you keep |

**Level:** intermediate. **Products:** Microsoft Entra ID, Microsoft Entra Workload ID, Microsoft Entra Agent ID, Azure Key Vault and Active Directory Domain Services. **Scope:** a civilian agency at FedRAMP Moderate, in Microsoft 365 GCC with commercial Azure, with an on-premises Active Directory, as the [workbook](../../project-plans/developer-workbooks/non-person-identity/index.md) assumes.

## Prerequisites

- The guide's [track at a glance](../../books/guides/non-person-identity-implementation.md#the-track-at-a-glance) and [path on one page](../../books/guides/non-person-identity-implementation.md#the-path-on-one-page): ten minutes, and every module refers back to them.
- [Book 02, Chapter 09: service accounts](../../books/b02-identity/09-building-the-entra-target.md#service-accounts) and [Book 04, Chapter 05](../../books/b04-access/05-applications-and-workload-identities.md), for the design. The modules link the sections they use.
- [Microsoft Automation, Module 1: Graph and Azure Foundations](../ms-automation-foundations.md): the clouds and endpoints, signing in as a workload, and permissions.
- PowerShell basics: you can run a script, import a module and read the objects it returns. Module 10 also runs Python.

## What you'll be able to do

When you finish the path, you'll be able to:

- read every service account, MSA, gMSA, dMSA, app registration, service principal and managed identity into one register, with a risk and a candidate target;
- check each identity for two human owners and a sponsor, and plan the orphan rule as disable, never delete;
- turn Book 02's migration path matrix into a decision for every identity, with HIGH-risk accounts in the first wave;
- hold the app management policy as reviewed JSON, and plan certificate rotation through Key Vault;
- sweep service principals for broad permissions and roles, and put Tier 1 service principals under Conditional Access for workload identities, report-only first;
- plan conversions to managed identities, federated credentials, gMSAs and dMSAs, with a parallel run and a way back;
- check AI agent identities and blueprints against the program's sponsor and credential rules;
- find drift against an approved baseline and hand the ISSO an evidence package they can verify.

## Modules

Work through them in order. They follow the guide's gates, G1 to G6, with the guide's AI agents section after the gates it builds on. So the workbook's chapters come in a slightly different order: Chapters 07 and 08 (G4) come before Chapters 05 and 06 (G5).

| # | Module | Gate | Workbook chapter | Time |
|---|---|---|---|---|
| 1 | [Inventory every non-person identity](01-inventory.md) | G1 Inventory | [01](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md) | 55 min |
| 2 | [Owners, sponsors and the orphan rule](02-owners-and-the-orphan-rule.md) | G1 Inventory, G6 Lifecycle | [02](../../project-plans/developer-workbooks/non-person-identity/02-ownership-and-the-orphan-rule.md) | 60 min |
| 3 | [Decide each identity's target](03-decide-the-target.md) | G2 Decision | [03](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md) | 55 min |
| 4 | [Set the credential rules](04-credential-rules.md) | G3 Credential rules | [04](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md) | 65 min |
| 5 | [Cut the privilege of service principals](05-least-privilege.md) | G4 Least privilege | [07](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md) | 60 min |
| 6 | [Conditional Access for workload identities](06-conditional-access.md) | G4 Least privilege | [08](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md) | 65 min |
| 7 | [Convert to managed identities and federation](07-federation-and-managed-identities.md) | G5 Conversion | [05](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md) | 60 min |
| 8 | [Convert Kerberos accounts to gMSAs and dMSAs](08-gmsa-dmsa-and-the-kerberos-island.md) | G5 Conversion | [06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md) | 60 min |
| 9 | [Govern AI agent identities](09-ai-agent-identities.md) | AI agents | [09](../../project-plans/developer-workbooks/non-person-identity/09-ai-agent-identities.md) | 65 min |
| 10 | [Find drift and file the evidence](10-drift-and-evidence.md) | G6 Lifecycle | [10](../../project-plans/developer-workbooks/non-person-identity/10-drift-and-evidence.md) | 75 min |

: The modules of the Non-Person Identity learning path {.striped .hover}

**Total time:** about 10 hours 20 minutes, with each module's Lab 1. Lab 2, in your own test tenant, isn't counted: how long it takes depends on your tenant and your approvals.

**Why ten modules.** The guide has six gates, but G1, G4 and G5 each need two workbook chapters, and every chapter's Lab 1 is 7 to 14 steps. A module that ran two of those labs would take two hours. So each module teaches one chapter, and the gate column shows where it sits in the guide. The guide's [SQL Server](../../books/guides/non-person-identity-implementation.md#sql-server) section has no chapter of its own: Module 1 shows its accounts handed to the Data Platform plan.

**If you're an ISSO reviewer,** read each module's introduction, its federal requirement table and its summary, and skip the labs. Module 10 is yours in full. The workbook's [reading paths](../../project-plans/developer-workbooks/non-person-identity/index.md#reading-paths) suggest an order for each role.

Each module follows the same units: an introduction with the federal requirement it meets, learning objectives, prerequisites, one to three concept units, Lab 1, Lab 2, a knowledge check and a summary.

## What you need for the labs

**Lab 1: a laptop, no tenant.** Every module's Lab 1 runs the code in [`examples/non-person-identity`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/non-person-identity) against the kit's fictional fixtures, for the fictional tenant and the domain `corp.contoso.example`. You need:

- a copy of the repository, so you can work in `examples/non-person-identity`;
- PowerShell 7.1 or later with Pester 5;
- for Module 10, also Python 3.10 or later with pytest and PyYAML, and a shell with `sha256sum` (Linux, macOS or Git Bash).

Run every command from `examples/non-person-identity`, in PowerShell 7. Each lab writes an `out` folder there and deletes it at the end. Nothing in Lab 1 signs in to anything or sends a request.

**Lab 2: your own test tenant.** Lab 2 needs a Microsoft Entra test tenant in the worldwide or GCC cloud, never production, with fictional data. Some modules add a test Azure subscription, a Key Vault, a test Active Directory domain or Workload ID Premium. Each module says which. The workbook has no hosted sandbox: you bring the tenant. **The authors didn't run the Lab 2 steps.** Each one ends with a way to back it out. Read the [guide's prerequisites](../../books/guides/non-person-identity-implementation.md#prerequisites) for the roles and licenses before you start.

## How this path fits with the other pieces

The guide is finished when it has [four pieces](https://github.com/WhalerMike/modernization-workbook/blob/main/CONTRIBUTING.md#an-implementation-guide-is-finished-when-it-has-all-four-pieces): the guide, a narrated deck series, a developer workbook and a training path. This path is the training piece. Each workbook chapter already has a narrated tour, and each module links it. Narrated decks for the modules themselves come later.

| Piece | Where |
|---|---|
| The design | [Book 02, Chapters 09 and 10](../../books/b02-identity/09-building-the-entra-target.md#modernizing-service-accounts), [Book 04, Chapters 05 and 06](../../books/b04-access/05-applications-and-workload-identities.md), [Book 17](../../books/b17-ai-identity/index.md) |
| The gates | [Non-Person Identity: An Implementation Guide](../../books/guides/non-person-identity-implementation.md) |
| The code and its labs | [*Building Non-Person Identity*](../../project-plans/developer-workbooks/non-person-identity/index.md) |
| The schedule | [Non-Person Identity Modernization project](../../project-plans/non-person-identity.md) |
| The federal sources | The guide's [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) table and the [federal framework crosswalk](../../reference/federal-framework-crosswalk.md) |

: Where each piece of non-person identity lives {.striped .hover}

## Modules in this path

::: {#npi-modules}
:::

---

*Original content for project use. Every fact is carried by link from the guide and the workbook; the claims log is in the repository.*
