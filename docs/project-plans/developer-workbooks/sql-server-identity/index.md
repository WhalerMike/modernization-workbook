---
title: "Building SQL Server Identity"
subtitle: "A developer workbook for Book 06, Data Platform: SQL Server Identity"
description: "A developer workbook for ending SQL Server's dependence on Windows and SQL authentication: a code-first companion to Book 06 and its runbooks for the developers and DBAs who classify the estate, audit each instance's logins, settle Arc eligibility, plan the Entra logins and judge the parallel run, map the groups, find the NTLM, scan the application chain, find the AD CS certificates, and keep the closure record. Ten chapters. Each code chapter starts from Microsoft Learn, builds tested code in examples/sql-server-identity, runs a lab against a fictional estate's fixtures with no instance, then a step in a test instance; the last is the runbook for test and production."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-sql-server-identity
listing:
  - id: chapters
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Building SQL Server Identity {.unnumbered}

*A developer workbook for Book 06, Data Platform: SQL Server Identity*

::: {.callout-important appearance="default"}
## Status: draft, awaiting review
All ten chapters are written and wait for the editor's review. Every external claim carries a note and a read date against Microsoft Learn or a workbook page, and each chapter keeps its verification log in the repository. The code is illustrative: its 90 tests pass against a fictional estate's fixtures, but it hasn't been run against a live SQL Server, domain or subscription, and no Lab 2 has been run by the authors. Chapter 10, the deployment runbook, hasn't been run against a live instance. The narrated chapter tours and a story deck are planned, not yet built.
:::

[Book 06](../../../books/b06-data-platform/index.md) explains why SQL Server's inheritance of Windows authentication has to end and what the destination is: every instance on Microsoft Entra authentication through Azure Arc, NTLM gone, SQL logins refused, and a closure record that shows it. Its ten runbooks, R01 to R10, are the step-by-step guide. They name the program's own scripts, which aren't in this repository. Book 06 doesn't give anyone software that runs those steps on their own estate: a classifier for the consolidation gate, an audit that reads the logins and says what each finding means, a check that joins the audit to Arc, a login plan that writes reviewable T-SQL, a judge for the parallel run, and the closure record kept as data.

This workbook is that software, in the repository's [`examples/sql-server-identity`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/sql-server-identity) folder. Each code chapter starts with Microsoft Learn's own material, says what it leaves to the agency, and builds only that, with tests. Each has a lab that runs on a laptop against one fictional estate for `contoso.example`, eight instances audited on two days thirty days apart, then a short step in a test instance with a way to back it out.

**The rule.** Read first, change last. Nine of the ten chapters only read. Chapter 04 writes T-SQL for review and runs none of it. Only Chapter 10's deployment scripts can change an instance, and only with `-Apply` and the SHA-256 the approver approved. The cutover disables the superseded users and SQL logins and denies `CONNECT SQL` to the superseded Windows groups, never dropping anything, so the rollback restores them at once.

**GCC.** The target is Microsoft 365 GCC (Moderate). Arc for SQL Server runs in commercial Azure, `AzureCloud`, decided as [WD-028](../../../about/decision-register.md#wd-028) and [WD-085](../../../about/decision-register.md#wd-085); the kit's Arc check refuses results from any other cloud.

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| Start with Microsoft's documentation | What Learn gives you, and what it leaves to you |
| The code | What the chapter adds, and the tests |
| Lab 1: fixtures, no tenant | Exact commands on the fictional estate, with the kit's real output |
| Lab 2: a test instance | Exact commands against a test instance, tenant or subscription, with a back-out step; not run by the authors |
| Verified facts | Versions, permissions, views and settings, each footnoted |
| Federal requirements and evidence | What each output proves, the SP 800-53 controls it supports and the KSIs it aligns to |
| Dangers and checklist | What breaks in production, the guard for it, and what a reviewer checks |

*Design guidance* in this workbook is the program's position, not a vendor statement.

## Chapters

| # | Chapter | Book 06 | What you build | Status |
|---|---|---|---|---|
| 01 | [The estate and the consolidation gate](01-the-estate-and-the-consolidation-gate.md) | Ch 03 to 06, R02 | The classifier: retain, consolidate (shared or dedicated target), retire or review, with the constraint that changed each answer | Written |
| 02 | [The authentication audit](02-the-authentication-audit.md) | Ch 07 to 08, R03 | The login census by type, the findings and their severities, and the first-pass Arc-eligibility category; a read-only snapshot exporter | Written |
| 03 | [Arc and the engine's identity](03-arc-and-the-engines-identity.md) | Ch 09 to 10, R04 | The Arc check that settles Category 1, 2 or 3 from Azure Resource Graph | Written |
| 04 | [Entra logins and the parallel run](04-entra-logins-and-the-parallel-run.md) | Ch 11 to 12, R05 | The login plan (create, cutover, rollback T-SQL) and the parallel run's judge | Written |
| 05 | [Groups, roles and the perimeter](05-groups-roles-and-the-perimeter.md) | Ch 16 to 17, R07 | The group map: four Active Directory patterns to dynamic, assigned, mail-only or split | Written |
| 06 | [NTLM and the SPNs](06-ntlm-and-the-spns.md) | Ch 14 to 15, R06 | The NTLM audit: SPNs, remote sessions, linked servers and clients, with the `setspn` fixes for review | Written |
| 07 | [The application chain](07-the-application-chain.md) | Ch 18 to 19, R08 | The connection-string scan: stored passwords, the database axis and the target mode by driver | Written |
| 08 | [AD CS dependencies](08-ad-cs-dependencies.md) | Ch 22, R10 | The certificate reader: classes, AD CS issuers and expiry | Written |
| 09 | [Closure, drift and evidence](09-closure-drift-and-evidence.md) | Ch 20 to 21, R09 | The closure record on the five conditions, and the drift check | Written |
| 10 | [Deploying to test and production](10-deploying-to-test-and-production.md) | R05, App B | The runbook: settings per environment, preflight PF-01 to -07, plan by phase with hashes, deploy and rollback by approved hash, the evidence chain (a dry run seals only as a rehearsal) | Written; not run against a live instance |

## Narrated decks

Not built yet. Planned, one session at a time with the other deck work: a narrated tour for each chapter, and a story deck that follows SQLPRD01 from the estate inventory through the parallel run to its closure record, with the drift on SQLPRD06 on day 30.

## Reading paths

- **Developers and DBAs new to the project:** [Book 06's introduction](../../../books/b06-data-platform/index.md) and [Runbook R01](../../../books/b06-data-platform/r01-prerequisites.md), then Chapter 01.
- **DBAs migrating one instance:** Chapters 02, 03 and 04, then Chapter 10.
- **Identity engineers:** Chapters 04 and 05.
- **Application owners:** Chapter 07.
- **PKI owners:** Chapter 08, then [Book 07](../../../books/b07-pki/index.md).
- **ISSOs and reviewers of the code:** each chapter's requirements table and checklist, and Chapters 09 and 10.

## Where this workbook sits

This is one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook, the code behind [Book 06](../../../books/b06-data-platform/index.md) and the [Data Platform project plan](../../data-platform.md). It links instead of rebuilding: instance discovery is the [Start Kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit)'s; the engine's service account is the Data Platform project's to convert, by the method of the [service account guide](../../../books/guides/service-account-migration.md), and [*Building Non-Person Identity*](../non-person-identity/index.md) hands SQL Server accounts here; PIM for the `sysadmin` group is [*Building Privileged Access*](../privileged-access/index.md)'s; drift becomes a task through [*Building Ticket-to-Machine*](../ticket-to-machine/index.md); the certificate lifecycle is [Book 07](../../../books/b07-pki/index.md)'s. Every page on the subject is on the [Data Platform and SQL Server topic hub](../../../topics/data-platform.md). The code downloads as one zip, [sql-server-identity-code.zip](../../../../downloads/sql-server-identity-code.zip), from the [Downloads](../../../downloads.md) page, and the [Labs](../../../training/labs.md#sql) page lists every lab.

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This workbook has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/project-plans/developer-workbooks/sql-server-identity).

<!-- revisions:end -->
