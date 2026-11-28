---
title: "Learning path: Application Modernization"
subtitle: "Eight modules, one per chapter of Building Application Modernization: the contract and the schema, moving and proving the data, an agent that only proposes, the front end and Section 508, the application's own identity through to a sealed evidence pack, and shutting down an application the portfolio retires"
description: "A learning path in eight modules for developers, data engineers, identity engineers, accessibility testers and ISSO reviewers, built on Book 18 and its reference implementation: the API contract and the schema a service owns; loading a legacy Db2 or Oracle schema into PostgreSQL by stated rules; proving the move three ways, with a delta during coexistence; an AI agent that can only propose what a person decides; the React front end with an automated WCAG 2.0 A and AA check and what it can't decide; and the application's own Microsoft Entra identity through Book 18 Appendix A's work packages, from redirect URIs and assignment to the post-change test and a sealed evidence pack; and the end of an application's life, through Book 18 Appendix B's six shutdown gates and the decommission plan. Each module runs a chapter's Lab 1 on fixtures, points to its Lab 2 in a test environment, and ends with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 18"
series-order: 0
listing:
  - id: am-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: approved
reviewed-sha256: 8440b3cc306126e53a20074930fd0d4826e9b564f1618cb0a619350547c8371d
last-reviewed: 2026-11-25
---
# Learning path: Application Modernization {.unnumbered}

An agency modernizes its applications one at a time, onto one target architecture, with the data moved and proved, AI that proposes rather than acts, accessibility built in, and each application's own identity cleaned up and evidenced. This learning path teaches you to do each of those in code. You work through [Book 18](../../books/b18-application-modernization/index.md)'s reference implementation in the order an application moves: its contract and schema, its data, its agent, its front end, then its identity, and, when it's retired or replaced, its shutdown. In each module you run the tested code from the developer workbook [*Building Application Modernization*](../../project-plans/developer-workbooks/application-modernization/index.md) on your laptop, then read what the same step takes in a test environment.

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat Book 18 or the workbook. They tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for

| Role | What you get from the path |
|---|---|
| Developer | Modules 1, 4 and 5: the contract test, problem details, the agent's guards and the front end's tests |
| Data engineer and data owner | Modules 2 and 3: the transform rules, the three checks, the delta and the report |
| Identity engineer | Modules 6 and 7: the snapshot, the redirect URI check, assignment, the gated write path, the sign-in check and the sealed pack |
| Accessibility tester and product manager | Module 5: what the automated check finds and what you still test by hand |
| Application owner retiring or replacing an application | Module 8: the six shutdown gates, the plan and its commands for the owning teams |
| ISSO reviewer | Every module's federal requirement table and summary, Module 7's step table, and Module 8's manifest |

**Level:** intermediate. **Products and tools:** Java 21 and Spring Boot, PostgreSQL, Flyway, React and Vitest, axe-core, Docker Compose, Microsoft Graph PowerShell and Microsoft Entra ID. **Scope:** a civilian agency at FedRAMP Moderate, in Microsoft 365 GCC with commercial Azure, as the [workbook](../../project-plans/developer-workbooks/application-modernization/index.md) assumes.

## Prerequisites

- Book 18, [Chapter 01](../../books/b18-application-modernization/01-a-portfolio-not-a-rewrite.md) and [Chapter 08](../../books/b18-application-modernization/08-the-reference-implementation.md): twenty minutes, and every module refers back to them.
- You can run commands in PowerShell 7 and read Java or JavaScript.

## Get the code {#get-the-code}

Download [app-modernization.zip](../../../downloads/app-modernization.zip) to your Downloads folder. It holds the kit the labs of Modules 1 to 7 use: the Spring Boot service, the migration tool, the React front end, the PowerShell module and the fixtures. Unzip it into `C:\FMWLabs\app-modernization` (in Windows' **Extract All**, type that folder in place of the one it suggests), so you work in `C:\FMWLabs\app-modernization`. Every lab command runs from there, as it does from `examples/app-modernization` in a clone of the repository. Modules 1 to 4 need Java 21; Module 5 needs Node.js 24; Modules 1 to 7 need PowerShell 7.4 or later, and Modules 6 and 7 need Pester 5. Module 8 uses its own kit, [app-retirement.zip](../../../downloads/app-retirement.zip), unzipped into `C:\FMWLabs\app-retirement` as its lab says, with PowerShell 7.1 or later and Pester 5. [Get a path's code](../index.md#get-the-code) says why each step is there.

In PowerShell (Windows PowerShell 5.1 or PowerShell 7):

```powershell
Expand-Archive -Path $HOME\Downloads\app-modernization.zip -DestinationPath C:\FMWLabs\app-modernization -Force
Set-Location C:\FMWLabs\app-modernization
Get-ChildItem C:\FMWLabs\app-modernization -Recurse -File | Unblock-File
```

In Git Bash on Windows:

```bash
mkdir -p /c/FMWLabs
unzip -o ~/Downloads/app-modernization.zip -d /c/FMWLabs/app-modernization
cd /c/FMWLabs/app-modernization
```

In Bash on Linux or macOS, which use `~/FMWLabs` in place of `C:\FMWLabs`:

```bash
mkdir -p ~/FMWLabs
unzip -o ~/Downloads/app-modernization.zip -d ~/FMWLabs/app-modernization
cd ~/FMWLabs/app-modernization
chmod +x mvnw
```

Check it works, in PowerShell 7.4 or later with Pester 5, with Module 6, Lab 1, Step 10:

```powershell
Invoke-Pester -Path tests/Identity.Tests.ps1 -FullNameFilter 'The snapshot*', 'WP4*', 'WP5*', 'The write path*' -Output None -PassThru | Select-Object PassedCount, FailedCount
```

It prints `PassedCount` 26 and `FailedCount` 0.

## What you'll be able to do

When you finish the path, you'll be able to:

- show that a service implements exactly the operations its contract documents, with errors as problem details and its schema in one file;
- load a legacy schema by stated rules, prove the load three ways, catch damage by key, and run a delta from the last watermark;
- read an agent's audit and show that no record changed until a person decided;
- run an automated WCAG 2.0 A and AA check on every screen state, and say what it leaves to a trained tester;
- take an application's identity snapshot, clean its redirect URIs with DNS proof and a regression test, require assignment without locking anyone out, and apply each plan only with its approved SHA-256;
- read the sign-ins since a change, seal the evidence pack, and line every step's evidence up with its controls and KSIs;
- check a retired application against the six shutdown gates, hand each owning team its removal commands, and file a plan whose manifest shows any later edit.

## Modules

Work through them in order. Modules 1 to 5 follow the application. Modules 6 and 7 are the application's identity: an identity engineer can start at Module 6. Module 8 is the end of an application's life and stands on its own.

| # | Module | Book 18 | Workbook chapter | Time |
|---|---|---|---|---|
| 1 | [The contract and the schema](01-the-contract-and-the-schema.md) | Chapters 01, 03 and 08 | [01](../../project-plans/developer-workbooks/application-modernization/01-the-contract-and-the-schema-the-service-owns.md) | 55 min |
| 2 | [Moving the data](02-moving-the-data.md) | Chapter 04 | [02](../../project-plans/developer-workbooks/application-modernization/02-moving-the-data-the-transform-and-the-load.md) | 50 min |
| 3 | [Proving the move](03-proving-the-move.md) | Chapter 04 | [03](../../project-plans/developer-workbooks/application-modernization/03-proving-the-move.md) | 50 min |
| 4 | [An agent that only proposes](04-an-agent-that-only-proposes.md) | Chapter 05 | [04](../../project-plans/developer-workbooks/application-modernization/04-an-agent-that-only-proposes.md) | 55 min |
| 5 | [The front end and Section 508](05-the-front-end-and-section-508.md) | Chapters 03 and 06 | [05](../../project-plans/developer-workbooks/application-modernization/05-the-front-end-its-accessibility-check-and-the-containers.md) | 50 min |
| 6 | [The application's identity](06-the-applications-identity.md) | Appendix A, WP1 to WP5; Chapter 10 | [06](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md) | 70 min |
| 7 | [The evidence pack](07-the-evidence-pack.md) | Appendix A, WP6 | [07](../../project-plans/developer-workbooks/application-modernization/07-the-post-change-test-and-the-evidence-pack.md) | 55 min |
| 8 | [Shutting down a retired application](08-shutting-down-a-retired-application.md) | Appendix B, R1 to R6 | [08](../../project-plans/developer-workbooks/application-modernization/08-shutting-down-a-retired-application.md) | 45 min |

: The modules of the Application Modernization learning path {.striped .hover}

**Total time:** about 7 hours 10 minutes with each module's Lab 1. Lab 2, in your own test environment, isn't counted: how long it takes depends on your environment and your approvals. The first lab in each of Modules 1, 2 and 5 also downloads Maven, PostgreSQL binaries or npm packages, which can take several minutes.

**If you're an ISSO reviewer,** read each module's introduction, its federal requirement table and its summary, and skip the labs. Modules 7 and 8 are yours in full.

Each module follows the same units: an introduction with the federal requirements it supports, learning objectives, prerequisites, two concept units, Lab 1, Lab 2, a knowledge check and a summary.

## What you need for the labs

**Lab 1: a laptop, no tenant.** Every module's Lab 1 runs a kit's code against its fictional fixtures: Modules 1 to 7 run [`examples/app-modernization`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/app-modernization) with five applicants and six cases for the service, a synthetic Db2-style database of about fifty cases for the migration, a fake service for the front end, one fictional application, *Case Triage (fictional)*, for the identity modules, and another, *Grants Tracker (fictional)*, for the retirement module, from [`examples/app-retirement`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/app-retirement). The Java tests start a real PostgreSQL 18 server themselves; nothing signs in to anything. You need Java 21, Node.js 24 for Module 5, and PowerShell 7.4 or later with Pester 5 (7.1 or later for Module 8). Each lab writes an `out` folder and deletes it at the end.

**Lab 2: your own test environment.** Each module's Lab 2 needs its own environment, never production: a test PostgreSQL server (Modules 1 and 4), a test copy of a legacy database (Modules 2 and 3), a test host with Docker (Module 5), or a Microsoft Entra test tenant (Modules 6, 7 and 8). **The authors didn't run the Lab 2 steps.** Each one ends with a way to back it out.

## How this path fits with the other pieces

| Piece | Where |
|---|---|
| Why and what | [Book 18 — Application Modernization](../../books/b18-application-modernization/index.md) |
| The code and its labs | [*Building Application Modernization*](../../project-plans/developer-workbooks/application-modernization/index.md); every lab on the [Labs](../labs.md#am) page |
| The application's identity, WP1 to WP3 | The [Non-Person Identity learning path](../non-person-identity/index.md) |
| The governance record | [Book 13, Chapter 14](../../books/b13-governance/14-application-secret-and-configuration-governance.md) |

: Where each piece of application modernization lives {.striped .hover}

## Modules in this path

::: {#am-modules}
:::

---

*Original content for project use. Every fact is carried by link from Book 18 and the workbook; the claims log is in the repository.*
