---
title: "Training"
subtitle: "Learning paths: modules to work through in order, and the vendors' own training mapped to the workbook's roles"
description: "The Federal Modernization Workbook's training: the Microsoft Automation learning path in four modules, the Ticket-to-Machine and HR-Driven Identity learning paths in seven modules each, the Privileged Access learning path in eight modules, the Attribute-Driven Migration learning path in nine modules, the Non-Person Identity learning path in eleven modules, the Provider Notices learning path in nine modules, the Zero Trust Assessment learning path in four modules, the Defender XDR learning path in five modules, the Azure Security Engineering learning path in five modules, and external learning paths from product vendors."
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
      - "!labs.md"
      - "!ticket-to-machine/**"
      - "!hr-driven-identity/**"
      - "!privileged-access/**"
      - "!attribute-driven-migration/**"
      - "!non-person-identity/**"
      - "!provider-notices/**"
      - "!zero-trust-assessment/**"
      - "!defender-xdr/**"
      - "!azure-security/**"
    type: table
    fields: [title, research-status, last-reviewed, description]
    field-display-names: *names
    sort: "title asc"
    sort-ui: false
    filter-ui: false
review-status: approved
reviewed-sha256: 67f62d44236aebb15cc8f65718375a760a18bb8dc39f787ed2ae52ca8039d762
last-reviewed: 2026-11-09
---
# Training {.unnumbered}

Training pages teach a skill step by step, in the order you should learn it. They work like a [Microsoft Learn learning path](https://learn.microsoft.com/training/): a short series of modules, each building on the one before.

**Looking for a lab?** [Labs](labs.md) lists every hands-on lab in the workbook, chapter by chapter: what each needs, where it runs, and a direct link.

Each page keeps its status label (draft or in review) until it is reviewed and proved. See [Status labels](../about/sources-and-verification.md#status-labels) for what each label means.

## Microsoft Automation learning path

Four modules that teach you to script Microsoft Entra ID and Intune through Microsoft Graph, and Azure Arc-enabled servers through Azure Resource Manager and Resource Graph, in a federal tenant: which cloud's endpoints to call, how a script signs in without a secret, which least-privileged permissions each read needs, and how to turn the results into evidence. Each module is in Microsoft Learn's form: an introduction with the federal requirements it supports, objectives, concept units, **Where agencies are** with government-cloud availability, a lab on fixtures with no tenant, a lab in your own test tenant, a knowledge check and a summary. The code is [`examples/ms-automation`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ms-automation), in Python and PowerShell.

| | |
|---|---|
| **Level** | Intermediate |
| **Roles** | Developer, identity engineer, endpoint (Intune) engineer, server (Arc) engineer, ISSO reviewer |
| **Products** | Microsoft Graph, Microsoft Entra ID, Microsoft Intune, Azure Resource Manager, Azure Resource Graph, Azure Arc, Azure Policy |
| **Scope** | A FedRAMP Moderate civilian agency, most often in Microsoft 365 GCC with commercial Azure; each module says what differs in GCC High and DoD |
| **Modules** | 4 (two more are planned) |
| **Time** | About 5 hours 55 minutes, not counting the Lab 2 exercises |

**Prerequisites.** You can run commands in a terminal and read Python or PowerShell, and you know what an access token is. For the design behind the checks, skim [Book 02](../books/b02-identity/index.md), [Book 04](../books/b04-access/index.md), [Book 05](../books/b05-devices/index.md) and [Book 06](../books/b06-data-platform/index.md); the modules link the chapters they use.

| # | Module | What you learn | Books | Time |
|---|---|---|---|---|
| 1 | [Graph and Azure Foundations](ms-automation-foundations.md) | Clouds and endpoints, signing in without a secret, permissions and consent, tools, paging, throttling, batching and delta | 02, 04, 05, 06, 10, 15 | 85 min |
| 2 | [Microsoft Entra ID through Microsoft Graph](ms-automation-entra.md) | Users, groups, Conditional Access, PIM, applications, logs and authentication methods; four of its five checks mapped to ScubaGear | 02, 04 | 89 min |
| 3 | [Intune through Microsoft Graph](ms-automation-intune.md) | Managed devices, compliance, configuration, assignment filters, Autopilot, v1.0 versus beta; five checks mapped to NIST SP 800-53 Moderate | 05 | 86 min |
| 4 | [Azure Arc through Azure Resource Manager and Resource Graph](ms-automation-arc.md) | Resource Manager versus Graph, Azure RBAC, Resource Graph paging and its traps, Arc machines, extensions, SQL Server, policy and product lifecycle; five Reader-only checks mapped to NIST SP 800-53 Moderate | 05, 06 | 95 min |

: The Microsoft Automation modules in order {.striped .hover}

Work through them in order: Module 1 sets up what the other three use. The developer workbook's [Chapter 02](../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md) goes deeper on the Graph client, and the [Ticket-to-Machine](ticket-to-machine/index.md), [HR-Driven Identity](hr-driven-identity/index.md), [Non-Person Identity](non-person-identity/index.md), [Privileged Access](privileged-access/index.md) and [Attribute-Driven Migration](attribute-driven-migration/index.md) paths build on Module 1. **If you're an ISSO reviewer,** read each module's introduction, Where agencies are and summary, and skip the labs.

### What you need for the Microsoft Automation labs

**Lab 1: fixtures, no tenant.** Every Lab 1 runs on a laptop against the kit's fictional fixtures, and nothing signs in or sends a request. You need:

- a copy of the repository, so you can work in `examples/ms-automation`;
- Python 3.10 or later, with `pytest`;
- PowerShell 7.5 or later with Pester 5, for the PowerShell steps and tests;
- a Bash-compatible shell for the commands as written.

Run every command from `examples/ms-automation`. Module 2's lab writes an `out` folder there; delete it afterward.

**Lab 2: your test tenant.** Each Lab 2 registers one app with a certificate and only the read permissions its checks need, runs them read-only, and ends by deleting the app registration. You need a test tenant in the worldwide or GCC cloud for learning, never production, with fictional data (before a gate passes, rehearse once in your agency's own cloud, as [Book 16](../books/b16-people/06-vendor-training-and-labs.md#what-changes-in-the-government-clouds) describes); Microsoft Entra ID P1 or P2 for Module 2's sign-in data, and P2 or Microsoft Entra ID Governance for its PIM data; an Intune license and a few test devices for Module 3; for Module 4, a test subscription with a few Arc-enabled servers, someone who can assign the Reader role on it, and `Az.Accounts` and `Az.ResourceGraph` for the PowerShell steps; and an administrator who can grant admin consent. **The authors haven't run the Lab 2 steps.**

**Watch:** each module has a narrated deck, about 13 to 16 minutes, linked from the module's page; Module 4's is [here](../presentations/watch.html?v=Training_MS_Automation_Module_4_Narrated).

::: {#training-microsoft}
:::

## Ticket-to-Machine learning path

[Learning path: Ticket-to-Machine on ServiceNow and SailPoint](ticket-to-machine/index.md) teaches you to build, test and evidence Book 13's Ticket-to-Machine loop on ServiceNow and SailPoint Identity Security Cloud, in seven modules mapped to the example guide's gates and the developer workbook's chapters. Each module has a lab on fixtures with no tenant, a pointer to a lab in your own test instance, and a knowledge check. Start with the path page for the roles, prerequisites and what you need for the labs.

::: {#training-ttm}
:::

## HR-Driven Identity learning path

Seven modules, one per gate of the [HR-driven identity implementation guide](../books/guides/hr-driven-identity-implementation.md), each with a lab on fixtures and a lab in your own test tenant. Start at the [learning path](hr-driven-identity/index.md).

## Privileged Access learning path

Eight modules, one per chapter (01 to 08) of the developer workbook [*Building Privileged Access*](../project-plans/developer-workbooks/privileged-access/index.md); operators who deploy the kit also use its Chapter 09, the deployment runbook. Each with a lab on fixtures and a lab in your own test tenant. It follows the workbook and the [project plan](../project-plans/privileged-access.md), and its modules match the gates of the [implementation guide](../books/guides/privileged-access-implementation.md) one for one. Emergency access comes first, and every module that writes has a guard against locking people out. Start at the [learning path](privileged-access/index.md).

## Attribute-Driven Migration learning path

Nine modules that teach [Book 19, *Building the Attribute-Driven Migration*](../books/b19-developer-workbook/index.md), one chapter each, in the order of the [implementation guide's](../books/guides/attribute-driven-migration-implementation.md) gates. Each runs the chapter's Lab 1 on fixtures (Chapter 10 has no Lab 1; its module runs the chapter's fixture dry run), points to its Lab 2 in a non-production environment, names the federal requirement with its KSI and evidence, and ends with a knowledge check. Chapter 02 is taught by the Microsoft Automation path's [Module 1](ms-automation-foundations.md). Start at the [learning path](attribute-driven-migration/index.md).

## Non-Person Identity learning path

Eleven modules, one per chapter of the developer workbook *Building Non-Person Identity*, in the order of the six gates of the [non-person identity implementation guide](../books/guides/non-person-identity-implementation.md): inventory, ownership and the orphan rule, the decision, credential rules, least privilege and Conditional Access for workload identities, conversion, AI agent identities, drift and evidence, and the deployment to test, then production. Each has a lab on fixtures and a lab in your own test tenant. Start at the [learning path](non-person-identity/index.md).

## Provider Notices learning path

Nine modules on the notices cloud providers send about the agency's own estate, in the order of the seven gates of the [provider notices implementation guide](../books/guides/provider-notices-implementation.md): why notices go unread and the one record every notice becomes; Azure Service Health with Service Health alerts; the Microsoft 365 Message center; Oracle Cloud Infrastructure announcements; AWS Health and its support plan; Google Cloud incidents and the maintenance gap; routing notices to owners as Ticket-to-Machine tasks; and the weekly digest, evidence and go/no-go. A ninth, optional module dry-runs the deployment to test, then production. Each module runs a chapter's Lab 1 from the developer workbook [*Building Provider Notices*](../project-plans/developer-workbooks/provider-notices/index.md) on fixtures, points to its Lab 2 in a test environment, and ends with a knowledge check. Start at the [learning path](provider-notices/index.md).

## Zero Trust Assessment learning path

Four modules on running Microsoft's Zero Trust Assessment as evidence rather than a verdict, in the order of the ten steps of the [Zero Trust Assessment implementation guide](../books/guides/zero-trust-assessment-implementation.md): what the assessment checks and why a skipped test is neither a failure nor a pass; running it safely, from the host and consent to the connection in each cloud and the hashed export; normalizing the results and opening a closure register routed to the pages that remediate each finding; and comparing runs, reconciling with ScubaGear and AWS Security Hub CSPM, and sealing the evidence. Lab 1 runs on the results kit's fictional fixtures with no tenant; Lab 2 runs in your own test tenant; each module ends with a knowledge check. Start at the [learning path](zero-trust-assessment/index.md).

## Defender XDR learning path

Five modules on engineering and operating Microsoft Defender XDR on Windows clients and Windows Server, in the order of the ten gates of the [Defender XDR implementation guide](../books/guides/defender-xdr-implementation.md): the service architecture, government-cloud availability, unified RBAC roles and onboarding with proof of sensor health; endpoint prevention and Attack Surface Reduction through audit, warn and block; exposure management without Security Exposure Management, and incidents triaged to a severity table; advanced hunting, custom detections deployed as code through Microsoft Graph, and identity and cloud-app signals; and automation levels set to the response ladder, with the monthly evidence run. The guide has no kit or developer workbook yet, so each module's lab runs the guide's own Validate commands in your own test tenant; each module ends with a knowledge check. Start at the [learning path](defender-xdr/index.md).

## Azure Security Engineering learning path

Five modules on engineering and proving the security of an agency's Azure estate, in the order of the ten steps of the [Azure Security Engineering implementation guide](../books/guides/azure-security-implementation.md): the security baseline in audit and the exposure register; DDoS protection on every public IP and the web application firewall from detection to prevention; an origin nothing can reach around Front Door or Application Gateway, and egress through Azure Firewall; Private Link, private DNS and Key Vault; and the security initiative, expiring exemptions, the operating model and the evidence. GCC Moderate with commercial Azure first, Azure Government as side notes, and the AWS, Google Cloud and Oracle Cloud Infrastructure equivalents. The guide has no kit or developer workbook yet, so each module's lab runs the guide's own checks in your test subscription; each module ends with a knowledge check. Start at the [learning path](azure-security/index.md).

## External learning paths

Vendors' own training, organized by role and linked to the books that use it.

::: {#training-external}
:::
