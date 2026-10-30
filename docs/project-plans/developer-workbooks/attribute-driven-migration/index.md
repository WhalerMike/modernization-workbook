---
title: "Building the Attribute-Driven Migration"
subtitle: "Why the Attribute-Driven Migration needs code with tests, not only runbooks: the HR middleware, Graph clients for the government clouds, validation kit checks, dynamic rules as code, Lifecycle Workflows extensions, Group Policy and machine configuration as code, Ansible beside Arc, and drift pipelines that hand evidence to the ISSO"
description: "A developer workbook for the Attribute-Driven Migration project: a code-first companion for the developers who build its middleware, automation, checks and pipelines. Each chapter builds on runnable code in the repository's examples folder, runs a lab against fixtures with no tenant, then a step in a test tenant, and lists the verified Graph and Azure facts, the dangers and a checklist."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-attribute-driven-migration
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
lifecycle_review: 2027-04-01
review-status: pending
aliases:
  - /docs/books/b19-developer-workbook/index.html
---

# Building the Attribute-Driven Migration {.unnumbered}

*A developer workbook for the Attribute-Driven Migration project*

::: {.callout-important appearance="default"}
## Status: draft, under review
This workbook is new material and is being written in stages. Chapters 01 and 03 are written. The others are outlined below and will follow. Every page is held for the owner's review: until a page is approved it is listed in the weekly source watch issue, and an approved page that changes goes back on that list. The narrated chapter tours will be recorded only after a chapter is approved. Every external claim was checked against Microsoft Learn or a workbook chapter on October 30, 2026 and carries a note, and each chapter keeps its verification log in the repository. The code is illustrative. Its tests pass against fixtures, but it has not been run against a production tenant.
:::

The [Attribute-Driven Migration](../../../books/guides/attribute-driven-migration.md) moves an agency from Active Directory to Microsoft Entra ID by placing every person, device and server in policy through attributes instead of OU placement. Its operator material already exists: the companion guide, the [implementation guide](../../../books/guides/attribute-driven-migration-implementation.md) with its ten gates, the [project plan](../../attribute-driven-migration.md) and the narrated decks. Those tell an operator what to do and how to prove it was done. They don't teach anyone to build the software the migration runs on: the middleware between the HR system and Entra ID, the Graph clients, the checks that prove each gate, the rule library, the workflow extensions, and the pipelines that catch drift and hand evidence to the ISSO.

This workbook is for the developers who build those pieces. It is code first. Each chapter starts from working code in the repository's [`examples`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples) folder, extends it where the chapter needs to, and adds tests. Each has a lab that runs on a laptop against fixtures with no tenant at all, then a short step in a test tenant. Each lists the Graph and Azure facts the code depends on (endpoints, the least-privileged permission, availability in the US Government clouds), footnoted to Microsoft Learn with the date the page was read, then the dangers and a checklist.

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| The code | The example it builds on, what this chapter adds, and the tests |
| Lab 1: fixtures, no tenant | Steps you can run anywhere, with the expected output |
| Lab 2: test tenant | The smallest change a test tenant needs, and how to back it out |
| Verified facts | Endpoints, least-privileged permissions, national cloud availability and release stage, each footnoted |
| Dangers | What breaks in production, and the guard the code has for it |
| Checklist | What a reviewer checks before the code ships |

*Design guidance* in this workbook is marked as such: it is the program's position, not a vendor statement. Preview and beta features carry their stage wherever they appear.

## Chapters

| # | Chapter | Builds on | What you build | Status |
|---|---|---|---|---|
| 01 | [The HR-to-Entra middleware](01-the-hr-to-entra-middleware.md) | Microsoft's CSV2SCIM sample (pinned in `examples/third_party/csv2scim`), then `examples/hcm-entra` | Start from Microsoft's sample, then add what it leaves to you: validation that fails closed, quarantine, ordering, a mass-disable hold, pacing, the US Government clouds, least privilege, and a provenance manifest | Written |
| 02 | Graph clients for the government clouds | `examples/ms-automation` | One client pattern for worldwide, GCC High and DoD: the token authority and Graph host per cloud, least-privileged scopes per call, paging with `@odata.nextLink`, `Retry-After`, and how to call beta paths without depending on them | Planned |
| 03 | [Writing a validation kit check](03-writing-a-validation-kit-check.md) | `examples/validation-kit` | A new check, VK-SYNC-02, from the catalog entry through pass and fail fixtures and Pester tests to the GET-only safety rule, and what to do when the read needs a privileged role | Written |
| 04 | Dynamic rules as code | `examples/validation-kit` (VK-DG-01 to VK-DG-04) | A rule library in Git: one file per group, a linter for the guards every user rule needs, rule tests through the beta `evaluateDynamicMembership` action (VK-DG-03), and shadow diffs (VK-DG-04) in CI before a rule changes | Planned |
| 05 | Lifecycle Workflows custom extensions | new example | One reusable Logic App per integration, called by Lifecycle Workflows custom task extensions, with its own managed identity, a callback, and tests that run without a tenant | Planned |
| 06 | Moving Group Policy as code | `examples/validation-kit` (VK-INT-07) | Read the Group Policy analytics reports (beta) to decide what moves, then create settings catalog policies through Graph from reviewed JSON, with a dry run and a diff | Planned |
| 07 | Machine configuration packages | new example | A DSC configuration compiled, packaged with `New-GuestConfigurationPackage`, signed with `Protect-GuestConfigurationPackage`, tested locally, and published as policy with `New-GuestConfigurationPolicy`, all from a pipeline | Planned |
| 08 | Ansible beside Arc | `examples/ansible` | Playbooks and a dynamic inventory that respect one owning tool per setting, read `config_owner` and `patch_owner` from the CMDB, and onboard servers to Arc in waves | Planned |
| 09 | Drift pipelines and evidence to the ISSO | the kits' run outputs | A scheduled pipeline that runs the checks, compares each run with the last, opens findings, and packages evidence with hashes and provenance for the ISSO | Planned |

Chapter 02 is the foundation chapters 01 and 03 lean on. They were written first because their code already exists; read Chapter 02 when it arrives before you build a new Graph client of your own.

### Changes from the first outline

- **Chapter 01 starts from Microsoft's sample.** Microsoft publishes CSV2SCIM for this integration and documents it on Learn. The chapter runs it first, on the same HR fixture, and builds the hardened client only for what the sample leaves out. The repository keeps a pinned copy so the labs stay stable.
- **Chapter 03's worked example is a new check.** The outline proposed walking through an existing check. The chapter builds VK-SYNC-02 instead, because its live read needs Global Administrator, which makes it the clearest case for the kit's rule that a read-only check still has to ask for the least privilege it can.
- **Chapter 04 will cover agents' user accounts.** Learn says an agent's user account is evaluated by user-based membership rules like any other user, and that a rule can exclude such accounts, but its rule property tables, read on October 30, 2026, don't name the property to use.[^i-agentusers] The chapter will give the clause when Learn documents it, and VK-DG-01's guards will grow to match.
- **Chapter 08 needs one input first.** The [Ansible guide](../../../books/guides/ansible-configuration-automation.md) names a `patch_owner` field in the CMDB, but the sample CMDB export in `examples/ansible` doesn't carry it yet. The chapter will add the column, with tests, before it relies on it.

## Reading paths

- **Developers new to the migration:** the [companion guide](../../../books/guides/attribute-driven-migration.md) first, then Chapter 01.
- **Developers extending the validation kit:** Chapter 03, then Chapter 04.
- **Platform and pipeline engineers:** Chapters 07, 08 and 09.
- **ISSOs and reviewers of the code:** the checklists at the end of each chapter, and Chapter 09.

## Where this workbook sits

This is the developer workbook for the [Attribute-Driven Migration project](../../attribute-driven-migration.md), one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook. The HR side of the migration, its schema and its lifecycle rules are [Book 03](../../../books/b03-hr-identity/index.md). The directory, sync and matching are [Book 02](../../../books/b02-identity/index.md). Devices, Intune and Azure Arc are [Book 05](../../../books/b05-devices/index.md). Change control, provenance and the drift engine are [Book 13](../../../books/b13-governance/index.md). The gates each chapter's code proves are in the [implementation guide](../../../books/guides/attribute-driven-migration-implementation.md).

## Chapters

::: {#chapters}
:::

[^i-agentusers]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Oct 30, 2026).
