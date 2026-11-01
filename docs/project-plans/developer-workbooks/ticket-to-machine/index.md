---
title: "Building Ticket-to-Machine"
subtitle: "A developer workbook for the Ticket-to-Machine loop on ServiceNow and SailPoint"
description: "A developer workbook for the Ticket-to-Machine loop on ServiceNow and SailPoint Identity Security Cloud: a code-first companion for the developers who build the typed identity finding, the ServiceNow and SailPoint clients and their least privilege, drift events raised as typed tasks, the re-read rule that closes a finding only on evidence, the drift reconciliation, the evidence records an ISSO reads, and the one-writer-per-attribute check. Each chapter builds tested code in the repository's examples folder, runs a lab against fixtures with no tenant, then a step in a ServiceNow developer instance or a SailPoint sandbox, and lists the verified vendor facts, the federal requirements and evidence, the dangers and a checklist."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-ticket-to-machine
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
# Building Ticket-to-Machine {.unnumbered}

*A developer workbook for the Ticket-to-Machine loop on ServiceNow and SailPoint*

::: {.callout-important appearance="default"}
## Status: draft, under review
This workbook is new material. All eight chapters are written. Every page is held for the owner's review: until a page is approved it is listed in the weekly source watch issue, and an approved page that changes goes back on that list. Narrated chapter tours will be recorded only after a chapter is approved. Every vendor fact was checked against ServiceNow's, SailPoint's or Microsoft's own documentation, or the FedRAMP Marketplace, on November 1, 2026 and carries a note, and each chapter keeps its verification log in the repository. The code is illustrative. Its tests pass against fixtures and mocked responses, but it has not been run against a live ServiceNow instance or SailPoint tenant.
:::

::: {.callout-note}
## An example, not an endorsement
[Book 13's Ticket-to-Machine loop](../../../books/b13-governance/appendix-b-ticket-to-machine-reference.md) is vendor-neutral on purpose. This workbook builds it on two named products, ServiceNow and SailPoint Identity Security Cloud (ISC), because the program's example guide and kit use them. Other products can fill the same slots, and naming these is not a recommendation by any agency.
:::

[Book 13, Chapter 10](../../../books/b13-governance/10-ticket-to-machine.md) argues that a ticket should authorize a machine, not send a person to a console, and that a finding closes only when a re-read proves the result. [Appendix B](../../../books/b13-governance/appendix-b-ticket-to-machine-reference.md) gives the loop, the five-clause request chain, the lanes, the tempo and the evidence record. The example guide [Ticket-to-Machine on ServiceNow and SailPoint](../../../books/guides/ttm-servicenow-sailpoint.md) walks that loop through two products and finds four gaps between them and the loop. The implementation example [Integrating ServiceNow and SailPoint (Pass 1)](../../../books/guides/snow-sailpoint-integration-kit.md) explains a kit of scripts, [`examples/servicenow-sailpoint`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint), that builds three of the loop's identity steps. Those say what the loop must do and what the kit does. They don't teach a developer to extend, test and ship that code.

This workbook does. It is code first. Each chapter starts from the code already in the kit, adds what the chapter needs, with tests, and runs a lab on a laptop against the kit's fixtures with no tenant at all. Then it gives the smallest step in a ServiceNow Personal Developer Instance or a SailPoint sandbox tenant, with a way to back it out. Each lists the vendor facts the code depends on (endpoints, authentication, the least-privileged role or scope, FedRAMP status), footnoted to the vendor's own page with the date it was read, then what the chapter's output proves and for whom, the dangers and a checklist.

The estate is a FedRAMP Moderate civilian one: ServiceNow's Government Community Cloud (FedRAMP High) as the front door and the record, SailPoint ISC (FedRAMP Moderate) for identity governance,[^ttmi-fedramp] and Microsoft 365 GCC for the directory, which uses the worldwide endpoints `login.microsoftonline.com` and `graph.microsoft.com`.[^ttmi-deployments] Every chapter says where an endpoint or a feature's availability matters.

## The pieces and how they connect

| Piece | What it is | Where |
|---|---|---|
| Book chapters | The vendor-neutral design: the tempo, the qualifying change classes, the actuation ladder and the five-clause chain, the lanes and the evidence record | [Book 13, Chapter 10](../../../books/b13-governance/10-ticket-to-machine.md) and [Appendix B](../../../books/b13-governance/appendix-b-ticket-to-machine-reference.md); the drift classes in [Book 03, Chapter 11](../../../books/b03-hr-identity/11-drift-metrics-and-evidence.md) |
| Example guide | The loop on ServiceNow and SailPoint, the four gaps, and each product's federal status | [Ticket-to-Machine on ServiceNow and SailPoint](../../../books/guides/ttm-servicenow-sailpoint.md) |
| Implementation example | Pass 1 of the kit: drift to a typed task, the re-read rule, the drift reconciliation; and what Pass 2 plans | [Integrating ServiceNow and SailPoint (Pass 1)](../../../books/guides/snow-sailpoint-integration-kit.md) |
| Developer workbook | This workbook: eight chapters, each building on the kit with labs and tests | [Chapters](#chapters-table) below |
| Code | The kit: ISC workflows, the ServiceNow Scripted REST resource and business rule, Python and PowerShell clients, fixtures and tests, and this workbook's additions | [`examples/servicenow-sailpoint` on GitHub](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint) |
| Decks and videos | The narrated deck for Book 13's Appendix B, and the narrated research deck for the example guide | [Presentations](../../../presentations/index.md#reference-b13) · [▶ Watch the example guide's deck](../../../presentations/watch.html?v=Research_TTM_ServiceNow_SailPoint_Narrated) |
| Training | A learning path built from the example guide, the decks and this workbook's labs | Planned |
| Word edition | This workbook as one document | [building-ticket-to-machine-bundle.docx](../../../../downloads/building-ticket-to-machine-bundle.docx) |

How they connect: the book chapters set what the loop must prove. The example guide says where the two products fall short of it. The implementation example says what the kit builds to close the gap. This workbook builds on the kit, chapter by chapter, and every chapter's lab runs the kit's own code. The decks present the book and the guide; the training path, when it is written, will link this workbook's labs rather than repeat them.

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| The code | What exists in the kit, what this chapter adds, and the tests |
| Lab 1: fixtures, no tenant | Commands that run on a laptop against the kit's fixtures, with the expected output. Every one was run before it was written down |
| Lab 2: a test instance | The smallest step in a ServiceNow Personal Developer Instance or a SailPoint sandbox, and how to back it out. Not run by the authors |
| The verified facts | Endpoints, authentication, the least-privileged role or scope, FedRAMP status, each footnoted to the vendor's page |
| Federal requirements and evidence | What the chapter's output proves, for which control or requirement, and who keeps it |
| Dangers | What breaks in production, and the guard the code has for it |
| Checklist | What a reviewer checks before the code ships |

*Design guidance* marks the program's own positions; *(inference)* marks a mapping the vendor doesn't state. Where a vendor's documentation doesn't settle a point, the chapter says so under "What couldn't be verified" and the kit's README keeps it on the verify list.

## Chapters {#chapters-table}

The arc follows the loop's five steps and the kit's three builds. Chapter 01 sets the record every other chapter writes or reads. Chapters 02 and 03 build the two clients and fix their least privilege before any call is made. Chapters 04 to 06 are the kit's Builds 1 to 3. Chapter 07 turns closed findings into the evidence an ISSO reads, and Chapter 08 builds the one Pass 2 check that runs offline today.

| # | Chapter | Loop step | Builds on | What you build | Status |
|---|---|---|---|---|---|
| 01 | [The loop and the typed task](01-the-loop-and-the-typed-task.md) | 3 Raise a typed task | The data contract in the kit's README and the Scripted REST script | `finding_contract.py`: the contract checked before posting, mirrored from the script by a test; the de-duplication key and the tempo | Written |
| 02 | [The ServiceNow client and least privilege](02-servicenow-client-and-least-privilege.md) | 3, 5 | `kit_common.py` (tokens, paging, retries) | `config/calls.json`, every call with its task and least privilege; `kit_calls.py`; a test that fails on any undeclared call; the ServiceNow roles split by task | Written |
| 03 | [The SailPoint client and its scopes](03-sailpoint-client-and-scopes.md) | 1, 2, 5 | `kit_common.py`'s ISC token, search and list paging | The ISC and Graph rows of the call list, and a comparison of an API client's granted scopes with what each task needs | Written |
| 04 | [Drift to a typed task](04-drift-to-a-typed-task.md) | 2, 3 (Build 1) | The ISC workflows and the Scripted REST resource | `workflow_payload.py`: each workflow's body resolved against a sample event and checked; two fixes, multivalued changes reverted and the attribute in the de-duplication key | Written |
| 05 | [The re-read rule](05-the-re-read-rule.md) | 5 (Build 2, Gap 1) | The business rule and `reread_verification.py` | An offline mode over saved records and reads, and a guard that never verifies an intended state with nothing to check | Written |
| 06 | [Drift reconciliation](06-drift-reconciliation.md) | 1, 2 (Build 3) | `identity_drift.py` | `drift_compare.py`: run over run, new, persisting and resolved, refusing runs that computed different classes | Written |
| 07 | [Evidence records for Book 13 and the ISSO](07-evidence-records.md) | 5, clause 5 | The re-read client's evidence and Book 13's record shape | `evidence_export.py`: one record per closed finding, integrity and window checks, a manifest and a hash chain, and a verifier | Written |
| 08 | [One writer per attribute](08-one-writer-per-attribute.md) | Pass 2, gap 4 | The kit page's plan for Pass 2 | `writer_check.py`: Entra inbound provisioning's mappings and SailPoint's provisioning policies compared, offline | Written |

Pass 2's other items, one approver per authority class, change records on demand, the SailPoint half of the evidence export and email intake, need a live instance or product internals the documentation doesn't give, so no chapter builds them yet.

## Reading paths

- **Developers new to the loop:** [Book 13, Appendix B](../../../books/b13-governance/appendix-b-ticket-to-machine-reference.md) for the loop and the evidence record, then Chapter 01.
- **Developers building the ServiceNow side:** Chapters 01, 02, 04 and 05, in that order.
- **Identity engineers on the SailPoint side:** Chapters 03, 04 and 06, then 08.
- **ISSOs and reviewers of the code:** Chapter 07, then the checklist and the federal requirements section of every chapter.

## Where this workbook sits

This is one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook. Its design is [Book 13](../../../books/b13-governance/index.md), Chapter 10 and Appendix B; its drift classes are [Book 03, Chapter 11](../../../books/b03-hr-identity/11-drift-metrics-and-evidence.md)'s; its intake and authority split are [Book 15, Chapter 03](../../../books/b15-day2-operations/03-intake-triage-and-routing.md)'s. The loop's actuation ceiling for each pilot class is decision D-M4 in the [Continuous Monitoring project plan](../../continuous-monitoring.md). Where an agency has no identity governance product, [Book 15, Chapter 13](../../../books/b15-day2-operations/13-building-day-two-automation-in-house.md) describes building the ServiceNow side in house; this workbook's ServiceNow chapters apply there too.

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This workbook has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/project-plans/developer-workbooks/ticket-to-machine).

<!-- revisions:end -->

[^ttmi-fedramp]: FedRAMP Marketplace data, <https://www.fedramp.gov/marketplace/products.json> (last change November 1, 2026): ServiceNow Government Community Cloud (F1305072116), FedRAMP Certified, High, JAB, authorized August 12, 2019; SailPoint Identity Security Cloud (FR2001938710A), FedRAMP Certified, Moderate, agency path, authorized June 5, 2024 (read November 1, 2026).
[^ttmi-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," service root endpoints, <https://learn.microsoft.com/graph/deployments> (read November 1, 2026).
