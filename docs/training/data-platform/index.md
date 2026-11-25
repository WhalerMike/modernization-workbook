---
title: "Learning path: Data Platform and SQL Server Identity"
subtitle: "Ten modules, one per chapter of Building SQL Server Identity: the estate and its consolidation gate, the authentication audit, Azure Arc, Microsoft Entra logins and the parallel run, groups, NTLM, the application chain, AD CS, closure and drift, and a rehearsed deployment"
description: "A learning path in ten modules for database administrators, identity engineers, application owners and ISSO reviewers, built on Book 06 and its runbooks R01 to R10: classifying the SQL Server estate retain, consolidate, retire or review; auditing how each instance authenticates; settling each instance's Arc-eligibility category; planning Microsoft Entra logins as reviewable T-SQL and judging the parallel run; mapping Windows groups to Entra groups; finding NTLM and the SPN fixes; moving the application chain's connection strings; listing AD CS dependencies; projecting the closure record and comparing runs; and rehearsing a deployment to a test instance, sealed into a hash chain. Each module runs a chapter's Lab 1 on the kit's fictional estate, points to its Lab 2 in a test instance, and ends with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 06"
series-order: 0
date-modified: 2026-11-25
listing:
  - id: dp-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: pending
---
# Learning path: Data Platform and SQL Server Identity {.unnumbered}

For twenty years, SQL Server has trusted Active Directory to say who is connecting. [Book 06](../../books/b06-data-platform/index.md) ends that inheritance, one instance at a time: it inventories the estate and decides what to keep, audits how each instance authenticates, brings each one under Azure Arc, moves its logins to Microsoft Entra ID through a parallel run, takes NTLM out of its connections, moves the applications' connection strings, and proves closure with a record and an audit trail. Its runbooks R01 to R10 are the step-by-step build.

This learning path teaches you to do that work in code. You run the tested PowerShell from the developer workbook [*Building SQL Server Identity*](../../project-plans/developer-workbooks/sql-server-identity/index.md) on your laptop, against a fictional estate of eight instances for `contoso.example`, then read what the same step takes on a test instance. Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat Book 06 or the workbook: they tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for

| Role | What you get from the path |
|---|---|
| Database administrator | Every module: the estate, the audit, the login plan, the parallel run, the SPN fixes and the rehearsed deployment |
| Identity engineer | Modules 3, 4, 5 and 10: Arc and the engine's identity, Entra logins, groups and roles, and the cutover |
| Application owner | Modules 4 and 7: what the parallel run needs from the application, and its connection strings |
| PKI engineer | Module 8: the certificates SQL Server depends on |
| ISSO reviewer | Every module's federal requirement and summary, and Modules 9 and 10 in full |

**Level:** intermediate. **Products and tools:** SQL Server 2016 to 2025, Azure Arc, Azure Resource Graph, Microsoft Entra ID, PowerShell 7.1 and Pester 5. **Scope:** a civilian agency at FedRAMP Moderate, in a Microsoft 365 GCC (Moderate) tenant whose Arc resources are in commercial Azure (`AzureCloud`), as [decision WD-028](../../about/decision-register.md#wd-028) records.

## Prerequisites

- Book 06, [Chapter 01, *What Windows Authentication Actually Is*](../../books/b06-data-platform/01-what-windows-authentication-actually-is.md): the Kerberos foundation, the NTLM fallback, the service account and `sa`. Every module refers back to it.
- You can run commands in PowerShell 7 and read a little T-SQL and JSON.
- For Module 3, if you haven't read Azure resources in bulk before: [Microsoft Automation, Module 4](../ms-automation-arc.md), which reads Arc-enabled SQL Server through Azure Resource Graph.

## Get the code {#get-the-code}

Download [sql-server-identity-code.zip](../../../downloads/sql-server-identity-code.zip) to your Downloads folder. It holds `sql-server-identity`, the kit every lab uses: the `SqlIdentity` module, its entry scripts, the deployment scripts, the configuration and the fictional fixtures. Unzip it into `C:\FMWLabs\sql-server-identity-code` (in Windows' **Extract All**, type that folder in place of the one it suggests), so you work in `C:\FMWLabs\sql-server-identity-code\sql-server-identity`. Every lab command runs from there, as it does from `examples/sql-server-identity` in a clone of the repository. The kit needs PowerShell 7.1 or later, and its tests need Pester 5. [Get a path's code](../index.md#get-the-code) says why each step is there.

In PowerShell (Windows PowerShell 5.1 or PowerShell 7):

```powershell
Expand-Archive -Path $HOME\Downloads\sql-server-identity-code.zip -DestinationPath C:\FMWLabs\sql-server-identity-code -Force
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
Get-ChildItem C:\FMWLabs\sql-server-identity-code -Recurse -File | Unblock-File
```

In Git Bash on Windows:

```bash
mkdir -p /c/FMWLabs
unzip -o ~/Downloads/sql-server-identity-code.zip -d /c/FMWLabs/sql-server-identity-code
cd /c/FMWLabs/sql-server-identity-code/sql-server-identity
```

In Bash on Linux or macOS, which use `~/FMWLabs` in place of `C:\FMWLabs`:

```bash
mkdir -p ~/FMWLabs
unzip -o ~/Downloads/sql-server-identity-code.zip -d ~/FMWLabs/sql-server-identity-code
cd ~/FMWLabs/sql-server-identity-code/sql-server-identity
```

Check the kit, in PowerShell 7 from that folder, with its own Pester tests:

```powershell
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -Output None -PassThru | Select-Object PassedCount, FailedCount
```

Expected output:

```text
PassedCount FailedCount
----------- -----------
         90           0
```

## Modules

Work through the modules in order. Each one builds on the one before, and the times are estimates for the reading, the Lab 1 exercise and the knowledge check.

| # | Module | Book 06 runbook | Workbook chapter | Time |
|---|---|---|---|---|
| 1 | [The estate and the consolidation gate](01-the-estate-and-the-consolidation-gate.md) | [R02](../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md) | [01](../../project-plans/developer-workbooks/sql-server-identity/01-the-estate-and-the-consolidation-gate.md) | 50 min |
| 2 | [The authentication audit](02-the-authentication-audit.md) | [R03](../../books/b06-data-platform/r03-the-authentication-audit.md) | [02](../../project-plans/developer-workbooks/sql-server-identity/02-the-authentication-audit.md) | 50 min |
| 3 | [Arc and the engine's identity](03-arc-and-the-engines-identity.md) | [R04](../../books/b06-data-platform/r04-arc-deployment-and-managed-identity.md) | [03](../../project-plans/developer-workbooks/sql-server-identity/03-arc-and-the-engines-identity.md) | 55 min |
| 4 | [Entra logins and the parallel run](04-entra-logins-and-the-parallel-run.md) | [R05](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md) | [04](../../project-plans/developer-workbooks/sql-server-identity/04-entra-logins-and-the-parallel-run.md) | 60 min |
| 5 | [Groups, roles and the perimeter](05-groups-roles-and-the-perimeter.md) | [R07](../../books/b06-data-platform/r07-groups-aus-and-the-conditional-access-perimeter.md) | [05](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md) | 45 min |
| 6 | [NTLM and the SPNs](06-ntlm-and-the-spns.md) | [R06](../../books/b06-data-platform/r06-ntlm-detection-and-remediation.md) | [06](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md) | 50 min |
| 7 | [The application chain](07-the-application-chain.md) | [R08](../../books/b06-data-platform/r08-application-chain-and-connection-strings.md) | [07](../../project-plans/developer-workbooks/sql-server-identity/07-the-application-chain.md) | 50 min |
| 8 | [AD CS dependencies](08-ad-cs-dependencies.md) | [R10](../../books/b06-data-platform/r10-certificate-discovery-for-adcs.md) | [08](../../project-plans/developer-workbooks/sql-server-identity/08-ad-cs-dependencies.md) | 40 min |
| 9 | [Closure, drift and evidence](09-closure-drift-and-evidence.md) | [R09](../../books/b06-data-platform/r09-continuous-monitoring-and-closure.md) | [09](../../project-plans/developer-workbooks/sql-server-identity/09-closure-drift-and-evidence.md) | 55 min |
| 10 | [Deploying to test and production](10-deploying-to-test-and-production.md) | [R05](../../books/b06-data-platform/r05-login-migration-and-parallel-run.md), [Appendix B](../../books/b06-data-platform/appendix-b-ato-kit.md) | [10](../../project-plans/developer-workbooks/sql-server-identity/10-deploying-to-test-and-production.md) | 70 min |

: The modules of the Data Platform and SQL Server Identity learning path {.striped .hover}

**Total time:** about 8 hours 45 minutes with each module's Lab 1. Lab 2, on your own test instance, isn't counted: how long it takes depends on your environment and your approvals.

**If you're an ISSO reviewer,** read each module's introduction, its federal requirement and its summary, and skip the labs. Modules 9 and 10 are yours in full.

Each module follows the same units: an introduction with the federal requirements it supports, learning objectives, prerequisites, two concept units, Lab 1, Lab 2, a knowledge check and a summary.

## What you need for the labs

**Lab 1: a laptop, no instance.** Every module's Lab 1 runs the kit against its fictional fixtures: an estate of eight instances, two audit snapshots thirty days apart, an Arc snapshot, groups, NTLM events, four applications' configuration files and the instances' certificates. Nothing connects to SQL Server, Azure or Microsoft Entra ID. You need PowerShell 7.1 or later with Pester 5, and the kit unzipped as [Get the code](#get-the-code) says.

Every step runs in PowerShell 7, top to bottom in one window. Each lab starts by making its own results folder, `C:\FMWLabs\results\data-platform-NN\lab1\<run>`, where `NN` is the module's number and `<run>` is the date and time you start, in UTC, such as `2026-11-25T143005Z`. Each run writes only there, so running a lab again never overwrites an earlier run, and unzipping a newer copy of the kit never touches your results. The data's dates are the fixtures' own, so every run's output matches the module's page; only the folder name changes. Nothing needs cleaning up: each lab ends by listing every run you've made of it.

**Lab 2: your own test instance.** Each module's Lab 2 points to the workbook chapter's Lab 2, on a test SQL Server instance, a test subscription in commercial Azure or a test Entra tenant, never production. **The authors haven't run the Lab 2 steps.** Each one ends with a way to back it out. Module 10's test-stage runbook is the real deployment; nothing in it has been run with `-Apply` by the authors.

## How this path fits with the other pieces

| Piece | Where |
|---|---|
| Why and what | [Book 06](../../books/b06-data-platform/index.md), the data platform book |
| The step-by-step build | Book 06's runbooks, starting at [R01, Prerequisites](../../books/b06-data-platform/r01-prerequisites.md) |
| The code and its labs | [*Building SQL Server Identity*](../../project-plans/developer-workbooks/sql-server-identity/index.md); every lab on the [Labs](../labs.md#sql) page |
| Discovering instances | [R02: Run this step with the workbook's Start Kit](../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#run-this-step-with-the-workbooks-start-kit), whose output Module 1 classifies, and [1d: Reconcile the forest with Azure Arc](../../books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#reconcile-the-forest-with-azure-arc) |
| Reading Arc in bulk | [Microsoft Automation, Module 4](../ms-automation-arc.md) |
| SQL Server's service accounts | The [Non-Person Identity learning path](../non-person-identity/index.md) and the [service account migration guide](../../books/guides/service-account-migration.md) |
| Everything on this topic | The [Data Platform and SQL Server](../../topics/data-platform.md) topic page |

: Where each piece of the data platform work lives {.striped .hover}

## Modules in this path

::: {#dp-modules}
:::

## Status and review

**Draft.** The path and its knowledge checks are new writing; every fact they rely on is on a linked page and carries that page's verification. Each module's Lab 1 commands were run in PowerShell 7 against the kit, unzipped from `sql-server-identity-code.zip` into `C:\FMWLabs`, on November 25, 2026, and the expected output shown is what they printed. To move this path to **In review**, a reviewer works through it end to end and confirms each knowledge-check answer against the linked section. What each status means is in [Status labels](../../about/sources-and-verification.md#status-labels).

::: {.callout-tip}
## Start the path
[Module 1: The estate and the consolidation gate →](01-the-estate-and-the-consolidation-gate.md)
:::
