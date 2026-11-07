---
title: "Building HR-Driven Identity"
subtitle: "A developer workbook for the Identity Lifecycle & Provisioning project"
description: "A developer workbook for the Identity Lifecycle & Provisioning project and the HR-driven identity implementation guide: a code-first companion for the developers who build the writer register and its audit scan, the contractor source with enforced end dates, Lifecycle Workflows definitions as code with the Temporary Access Pass bridge, access packages assigned from HR attributes with the mover's residual review, the certificate-based authentication checks, separation timing from the logs, and the lifecycle drift classes and metrics that reach the ISSO, then a runbook that deploys all of it to a test tenant and on to production. Each chapter starts from Microsoft Learn's own procedure, builds tested code in the repository's examples folder, runs a lab against fixtures with no tenant, then a step in a test tenant, and lists the verified Graph facts, the federal requirements and evidence, the dangers and a checklist."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-hr-driven-identity
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
review-status: approved
reviewed-sha256: 58eaf5ec8397c0d176f316a9683b2c6489775992604995a97699185b54a019e6
last-reviewed: 2026-11-07
---
# Building HR-Driven Identity {.unnumbered}

*A developer workbook for the Identity Lifecycle & Provisioning project*

::: {.callout-important appearance="default"}
## Status: approved
All eight chapters are written; Chapter 08, the deployment runbook, is the newest and hasn't been run against a live tenant. This page was approved in the owner's review of the November 2, 2026 packet, and an approved page that changes goes back on the weekly source watch issue's list. Chapters 01 to 07 have narrated tours, recorded on November 2, 2026; Chapter 08 has none. Every external claim was checked against Microsoft Learn, a federal source or a workbook chapter on November 1, 2026 (Chapter 08 on November 2, 2026, with a few carried from earlier readings and dated in their notes) and carries a note, and each chapter keeps its verification log in the repository. The code is illustrative. Its tests pass against fixtures, but it has not been run against a production tenant.
:::

The [HR-driven identity implementation guide](../../../books/guides/hr-driven-identity-implementation.md) runs the lifecycle that happens to a person after the HR pipeline makes the account exist, as seven gates: one writer for every account state, employees and contractors from their sources, joiners ready on day one, access assigned from HR attributes with a review of what a move leaves behind, PIV and CAC credentials tied to HR events, separations timed, and the record kept true with evidence. It says what to configure and what the ISSO keeps. It doesn't teach anyone to build the software that holds those settings as reviewed code, reads the logs that prove each gate, and hands the ISSO numbers a reviewer can check.

This workbook is for the developers who build that software. It is code first, and it starts from Microsoft. Each chapter begins with Microsoft Learn's own procedure for the gate's feature, and builds only what Learn leaves to you, in the repository's [`examples/hr-lifecycle`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hr-lifecycle) folder, with tests. Each has a lab that runs on a laptop against fixtures with no tenant at all, then a short step in a test tenant with a way to back it out. Each lists the Graph facts the code depends on (endpoints, the least-privileged permission, availability in the US Government clouds, release stage), footnoted to Microsoft Learn with the date the page was read, then the federal requirement the gate proves and what the ISSO keeps, the dangers and a checklist.

Much of the HR lifecycle's code already exists, and this workbook doesn't rebuild it. The first developer workbook, [Book 19](../../../books/b19-developer-workbook/index.md), builds the HR-to-Entra middleware, the Graph client pattern for the government clouds, the validation kit, dynamic rules as code, Lifecycle Workflows custom task extensions and the drift pipeline. [*Building Privileged Access*](../privileged-access/index.md) builds PIM and the reviews of privileged roles. The chapters link to them where a gate needs them, and add only what the gates need that they don't.

The target estate is Microsoft 365 GCC (Moderate) with commercial Azure. GCC uses the worldwide endpoints: `login.microsoftonline.com` and `graph.microsoft.com`. GCC High and DoD have separate hosts.[^hwi-deployments] Every tool takes an explicit cloud name and has no default.

## The pieces and how they connect

| Piece | What it is | Where |
|---|---|---|
| Implementation guide | The seven gates: steps, federal requirements and evidence, government-cloud availability, interim paths, **Validate** and rollback | [HR-Driven Identity: An Implementation Guide](../../../books/guides/hr-driven-identity-implementation.md) |
| This workbook | One chapter per gate: the code the gate needs, labs, verified facts, evidence; and a runbook for test and production | This page and its eight chapters |
| Code | `examples/hr-lifecycle`: eight Python tools, configuration as reviewed JSON, the runbook's `deploy/` scripts, fixtures and 80 pytest tests (57 in `tests`, 23 in `deploy/tests`); `examples/drift-pipeline/python/hr_evidence.py` packages its runs | [`examples/hr-lifecycle`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hr-lifecycle) |
| Design | Why HR is the source of authority, the attribute authority map, joiner, mover and leaver, credentials, access, drift and the phase model | [Book 03](../../../books/b03-hr-identity/index.md) |
| Schedule | The project's tasks, decisions and gates | [Identity Lifecycle & Provisioning plan](../../identity-lifecycle.md) |
| Code it builds on | The middleware, Graph clients, validation kit, dynamic rules, custom task extensions and drift pipeline | [Book 19](../../../books/b19-developer-workbook/index.md) |
| Decks | One deck series per guide, at the level of its gates: two narrated parts, G1–G3 and G4–G7; each with a deck, a narrated deck and a video | [Presentations](../../../presentations/index.md#implementation-hr-driven-identity-part-1) |
| Training | A learning path in seven modules built from the guide, these chapters and their labs, with knowledge checks | [Learning path: HR-Driven Identity in Microsoft Entra ID](../../../training/hr-driven-identity/index.md) |

: The pieces of HR-driven identity and where each lives {.striped .hover}

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| Start with Microsoft's procedure | What Learn gives you for the gate's feature, and what it leaves to you, as a table of gaps pinned by tests |
| The code | What exists in `examples/` already, what this chapter adds, and the tests |
| Lab 1: fixtures, no tenant | Commands you can run anywhere, with the output they gave when the chapter was written |
| Lab 2: test tenant | The smallest step a test tenant needs, and how to back it out; not run by the authors |
| Verified facts | Endpoints, least-privileged permissions, US Government availability and release stage, each footnoted |
| Federal requirements and evidence | The gate and requirement the code helps prove, and what the ISSO keeps |
| Dangers | What breaks in production, and the guard the code has for it |
| Checklist | What a reviewer checks before the code ships |

Chapter 08 is built differently: it is a runbook, not a gate, so it has no labs. It takes the code from the seven chapters to a live test environment and then to production, every step a command block or an exact admin center path, with its outputs shown from fixture mode and its live results written as expectations.

*Design guidance* in this workbook is marked as such: it is the program's position, not a vendor statement. Preview and beta features carry their stage wherever they appear. None of the chapters pins a Microsoft sample under `examples/third_party`: Learn's procedures for these features are portal steps and request examples, which the chapters cite and the code follows, rather than runnable samples to keep.

## Chapters

The outline follows the guide's gates, in order. Chapter 07 reads the outputs of Chapters 01, 02, 03, 04 and 06. Chapter 08 runs all of them, first against a test tenant and then in production.

| # | Chapter | Gate | Plan tasks | Starts from | What you build | Status |
|---|---|---|---|---|---|---|
| 01 | [The writer register as code](01-the-writer-register-as-code.md) | G1 Writers | I1.2, I1.4 | Learn's directoryAudits API and audit activity list | The lifecycle rows of the register as reviewed JSON, a check of its shape (WR-01 to WR-09), a scan of the directory audit log for second writers (WS-01, WS-02 and WS-04) and the saved audit queries | Written |
| 02 | [Contractor sources and enforced end dates](02-contractor-sources-and-end-dates.md) | G2 Sources | D-I3, I5.2 | Learn's API-driven inbound provisioning and bulkUpload | The earliest end per contractor, an extract `examples/hcm-entra` turns into SCIM requests, a read-only reconciliation (CR-01 to CR-05) and the sponsor review settings | Written |
| 03 | [Joiner workflows as code and the Temporary Access Pass bridge](03-joiner-workflows-as-code.md) | G3 Joiners | I2.3, I4.3 | Learn's Create workflow, createNewVersion and built-in task pages | Workflows as reviewed v1.0 bodies, a lint (JW-01 to JW-14, with JW-15 in the plan) including the pass's lifetime, a plan of creates and new versions, and day-one readiness | Written |
| 04 | [Access from attributes and the mover's residual review](04-access-from-attributes-and-the-mover-review.md) | G4 Access and movers | I4.4, I4.5 | Learn's automatic assignment policy page and Create assignmentPolicies | Assignment policies as reviewed bodies, a lint (AA-01 to AA-09) with overlap and the `memberOf` quarantine, a scan of an export, and the mover's residual review with the transfer-to-review interval | Written |
| 05 | [Certificate-based authentication checks](05-certificate-based-authentication-checks.md) | G5 Credentials | I1.6 | Learn's CRL page and the PKI and X.509 method APIs | A CRL measurement, and a check (CB-01 to CB-13) of the trust store, each CRL against the cloud's limit, the multifactor mapping and the phishing-resistant strength | Written |
| 06 | [Separation timing from the logs](06-separation-timing.md) | G6 Separation | I4.1, I4.2, I4.6 | Learn's audit activities, userProcessingResults and the catch-up window | Separation-to-block and separation-to-revocation per leaver, late separations, uncollected cards, re-enables and failed runs (ST-01 to ST-09) | Written |
| 07 | [Lifecycle drift, metrics and evidence](07-lifecycle-drift-and-evidence.md) | G7 Drift and evidence | IG5 | Book 19, Chapter 09's drift pipeline | The six lifecycle drift classes and six metrics as one run (LD-01 to LD-08), packaged with a hash chain and assembled into a period by `hr_evidence.py` | Written |
| 08 | [Deploying to a test tenant, then to production](08-deploying-to-test-and-production.md) | G1 to G7 | — | The guide's gate order and rollback table; Learn's pilot and on-demand guidance | One settings file per environment with no secrets (DS-01 to DS-05), a pre-flight (PF-01 to PF-06), a smoke test with a synthetic joiner, mover and leaver (SM-01 to SM-07), go/no-go criteria, first-week monitoring and a rehearsed rollback (RB-01, RB-02) | Written; not run against a live tenant |

Microsoft Entra ID Governance, which Lifecycle Workflows, entitlement management and access reviews use, is available in GCC, GCC High and DoD.[^hwi-availability]

<!-- tour:begin (generated by the tour build; not part of the reviewed page) -->

## Narrated chapter tours

Chapters 01 to 07 each have a narrated tour: a deck in Why, What, Who and How order, a self-running edition with captions, and a video. The tours were recorded on November 2, 2026 from the approved chapters, and a tour is re-recorded when its chapter changes. All of them are also on the [Watch page](../../../presentations/watch.md).

| # | Chapter | Watch | Length | Deck | Narrated deck |
|---|---|---|---|---|---|
| 01 | [The Writer Register as Code](01-the-writer-register-as-code.md) | [▶ Watch](../../../presentations/watch.html?v=DW_HR_01_Writer_Register_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_HR_01_Writer_Register_Narrated.mp4) | 11 min | [DW_HR_01_Writer_Register.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-01-writer-register) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-01-writer-register) |
| 02 | [Contractor Sources and Enforced End Dates](02-contractor-sources-and-end-dates.md) | [▶ Watch](../../../presentations/watch.html?v=DW_HR_02_Contractor_End_Dates_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_HR_02_Contractor_End_Dates_Narrated.mp4) | 11 min | [DW_HR_02_Contractor_End_Dates.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-02-contractor-end-dates) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-02-contractor-end-dates) |
| 03 | [Joiner Workflows as Code and the Temporary Access Pass Bridge](03-joiner-workflows-as-code.md) | [▶ Watch](../../../presentations/watch.html?v=DW_HR_03_Joiner_Workflows_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_HR_03_Joiner_Workflows_Narrated.mp4) | 11 min | [DW_HR_03_Joiner_Workflows.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-03-joiner-workflows) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-03-joiner-workflows) |
| 04 | [Access from Attributes and the Mover's Residual Review](04-access-from-attributes-and-the-mover-review.md) | [▶ Watch](../../../presentations/watch.html?v=DW_HR_04_Access_From_Attributes_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_HR_04_Access_From_Attributes_Narrated.mp4) | 11 min | [DW_HR_04_Access_From_Attributes.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-04-access-from-attributes) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-04-access-from-attributes) |
| 05 | [Certificate-Based Authentication Checks](05-certificate-based-authentication-checks.md) | [▶ Watch](../../../presentations/watch.html?v=DW_HR_05_CBA_Checks_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_HR_05_CBA_Checks_Narrated.mp4) | 11 min | [DW_HR_05_CBA_Checks.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-05-cba-checks) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-05-cba-checks) |
| 06 | [Separation Timing from the Logs](06-separation-timing.md) | [▶ Watch](../../../presentations/watch.html?v=DW_HR_06_Separation_Timing_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_HR_06_Separation_Timing_Narrated.mp4) | 11 min | [DW_HR_06_Separation_Timing.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-06-separation-timing) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-06-separation-timing) |
| 07 | [Lifecycle Drift, Metrics and Evidence](07-lifecycle-drift-and-evidence.md) | [▶ Watch](../../../presentations/watch.html?v=DW_HR_07_Drift_Metrics_Evidence_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_HR_07_Drift_Metrics_Evidence_Narrated.mp4) | 11 min | [DW_HR_07_Drift_Metrics_Evidence.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-07-drift-metrics-evidence) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-hr-07-drift-metrics-evidence) |

<!-- tour:end -->

## Reading paths

- **Developers new to the project:** the guide's [path on one page](../../../books/guides/hr-driven-identity-implementation.md#the-path-on-one-page), Book 19's [Chapter 01](../../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md) for the feed, then Chapter 01 here.
- **Developers building the lifecycle automation:** Chapters 03, 04 and 06, with Book 19's [Chapter 05](../../../books/b19-developer-workbook/05-lifecycle-workflows-custom-extensions.md) for the custom task extensions.
- **Credentialing and PKI engineers:** Chapter 05, then Chapter 06's card rules.
- **ISSOs and reviewers of the code:** each chapter's federal requirements and checklist, then Chapter 07's period summary.
- **Whoever runs the change:** Chapter 08, after every chapter's labs.

## Where this workbook sits

This is the developer workbook for the [HR-driven identity implementation guide](../../../books/guides/hr-driven-identity-implementation.md) and the [Identity Lifecycle & Provisioning project](../../identity-lifecycle.md), one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook. The design is [Book 03](../../../books/b03-hr-identity/index.md); the pipeline that makes the account exist is [Building Book 03's HR Pipeline](../../../books/guides/hcm-entra-implementation.md) and Book 19's [Chapter 01](../../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md). The Graph client pattern every tool follows, one cloud table, a declared call list with its least-privileged permission and no default cloud, is [Book 19, Chapter 02](../../../books/b19-developer-workbook/02-graph-clients-for-government-clouds.md). The drift pipeline Chapter 07 extends is [Book 19, Chapter 09](../../../books/b19-developer-workbook/09-drift-pipelines-and-evidence.md).

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.4**, in [edition 2026.11.4](../../../about/archive.md#edition-2026-11-4) (November 5, 2026). Every edition is kept on the [Archive](../../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/project-plans/developer-workbooks/hr-driven-identity).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.4 | [2026.11.4](../../../about/archive.md#edition-2026-11-4) | 2026-11-05 | Deck and audio links point at edition 2026.11.4 |
| 1.3 | [2026.11.3](../../../about/archive.md#edition-2026-11-3) | 2026-11-05 | Review gate: Mike's approval of the 53 pages in the November 2 review packet ([#334](https://github.com/WhalerMike/modernization-workbook/pull/334)) |
| 1.2 | [2026.11.2](../../../about/archive.md#edition-2026-11-2) | 2026-11-02 | HR-Driven Identity labs: exact commands for every step, real output, commands lists ([#293](https://github.com/WhalerMike/modernization-workbook/pull/293)); Tours: HR-Driven Identity's seven chapter tours, and the Privileged Access, Non-Person Identity and Book 19 tours with real kit output ([#297](https://github.com/WhalerMike/modernization-workbook/pull/297)); Lab command lists: the cleanup after the last step is labeled "After the steps", not with the step before it ([#300](https://github.com/WhalerMike/modernization-workbook/pull/300)); HR-Driven Identity: federal requirements and KSIs for every scripted step ([#304](https://github.com/WhalerMike/modernization-workbook/pull/304)); Building HR-Driven Identity, Chapter 08: deploying to test and production ([#308](https://github.com/WhalerMike/modernization-workbook/pull/308)) |
| 1.1 | [2026.11.1](../../../about/archive.md#edition-2026-11-1) | 2026-11-01 | Edition 2026.11: record the edition, and publish the four gate-level decks and videos ([#282](https://github.com/WhalerMike/modernization-workbook/pull/282)) |
| 1.0 | [2026.11](../../../about/archive.md#edition-2026-11) | 2026-11-01 | Building HR-Driven Identity: a developer workbook with labs ([#276](https://github.com/WhalerMike/modernization-workbook/pull/276)); Learning path: HR-Driven Identity in Microsoft Entra ID ([#278](https://github.com/WhalerMike/modernization-workbook/pull/278)); Gate-level deck series for HR-Driven Identity and Ticket-to-Machine (sources) ([#280](https://github.com/WhalerMike/modernization-workbook/pull/280)) |

: Versions of this workbook, newest first {.striped .hover}

<!-- revisions:end -->

[^hwi-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (read November 1, 2026; carried from Book 19, Chapter 02).
[^hwi-availability]: Microsoft Learn, "Microsoft Entra feature availability," other Microsoft Entra products, <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
