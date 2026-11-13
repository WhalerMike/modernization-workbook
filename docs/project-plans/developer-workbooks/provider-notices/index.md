---
title: "Building Provider Notices"
subtitle: "A developer workbook for the provider notices implementation guide"
description: "A developer workbook for the provider notices implementation guide: a code-first companion for the developers who build the software that collects the notices cloud providers send about an agency's own tenant, account, tenancy or project (scheduled maintenance, retirements, health and security advisories, upcoming changes and incidents), holds each as one record, routes the ones that need action to an owner as a Ticket-to-Machine typed task, writes a weekly digest and keeps hashed evidence. One chapter per provider (Azure Service Health with the alert policy, Microsoft 365, Oracle Cloud Infrastructure, AWS Health and Google Cloud Personalized Service Health), then routing, the digest and evidence, and a runbook that deploys the kit to a test environment and then production. Each chapter starts from the provider's own documentation, builds on tested code in the repository's examples folder, runs a lab against fixtures with no tenant, then a step in a test tenant, and lists the verified facts, the federal requirements and evidence, the dangers and a checklist."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-provider-notices
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
reviewed-sha256: ee289916eb360adc8926a9eedf8588783a03fb6f5c6787727678ed40b251fbb2
last-reviewed: 2026-11-09
---
# Building Provider Notices {.unnumbered}

*A developer workbook for the provider notices implementation guide*

::: {.callout-important appearance="default"}
## Status: written, waiting for the owner's review
All eight chapters are written and wait for the owner's review; none is approved yet. Chapter 08, the deployment runbook, hasn't been run against a live tenant, account, tenancy or project. Every chapter has a narrated tour; see *Narrated chapter tours* below. Every external claim was checked against the provider's own documentation (Microsoft Learn for Azure and Microsoft 365, Oracle's documentation for OCI, AWS's for AWS Health, Google Cloud's for Personalized Service Health), NIST's OSCAL catalog or fedramp.gov on November 9, 2026, and each chapter keeps its verification log in the repository. The code is illustrative. Its tests pass against fictional fixtures and stand-in tools; it has not been run against a production tenant.
:::

The [Provider Notices implementation guide](../../../books/guides/provider-notices-implementation.md) runs one job as seven gates: collect the notices each cloud provider publishes about the agency's own estate, hold each one as a single record, give every notice that needs action an owner with a due date, put the rest in a weekly digest, and keep the evidence. It says what to configure, what the ISSO keeps and what each government cloud offers. It doesn't teach anyone to build the software that does the reading, the routing and the record keeping.

This workbook is for the developers who build that software. It is code first, and it starts from each provider. Every chapter begins with what the provider documents (the API, the least-privileged reader, the government cloud), then walks through the code in the repository's [`examples/provider-notices`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/provider-notices) folder that reads it, with tests. Each has a lab that runs on a laptop against fictional fixtures with no tenant at all, then a short step in a test tenant, account, tenancy or project with a way to back it out. Each lists the facts the code depends on, footnoted to the provider's own page with the date it was read, then the federal requirement the step supports, the KSI it aligns to and what the ISSO keeps, the dangers and a checklist.

The kit already exists: phase 1 of this work built it with the guide. The chapters don't rebuild it; they explain it, run it and say where it stops. Where a lab turned up a fault in the kit, the kit was fixed in the same change, with a test.

The target estate is a civilian agency at FedRAMP Moderate in Microsoft 365 GCC with commercial Azure, with workloads in Oracle Cloud Infrastructure and possibly AWS or Google Cloud. GCC uses the worldwide Graph endpoint, `graph.microsoft.com`; GCC High and DoD have separate hosts.[^pni-deployments] An agency whose HR platform runs on Oracle Cloud Infrastructure reads that tenancy's announcements in Chapter 03, so platform maintenance reaches the HR system's owners before it lands. Every tool takes an explicit cloud name for each provider and has no default.

## The pieces and how they connect

| Piece | What it is | Where |
|---|---|---|
| Implementation guide | The seven gates: steps, federal requirements and evidence, government-cloud availability, interim paths, **Validate** and rollback | [Provider Notices: An Implementation Guide](../../../books/guides/provider-notices-implementation.md) |
| This workbook | One chapter per gate: the code the gate needs, labs, verified facts, evidence; and a runbook for test and production | This page and its eight chapters |
| Code | `examples/provider-notices`: four entry scripts, one PowerShell module with a collector and normalizer per provider, the router, the digest and the evidence chain, the runbook's `deploy/` scripts, fictional fixtures for two weeks, and 165 Pester tests (140 in `tests`, 25 in `deploy/tests`) | [`examples/provider-notices`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/provider-notices) |
| The task pattern | Ticket-to-Machine: the typed task, its lanes and the five clauses of the request chain | [Book 13, Chapter 10](../../../books/b13-governance/10-ticket-to-machine.md) and [Appendix B](../../../books/b13-governance/appendix-b-ticket-to-machine-reference.md); [*Building Ticket-to-Machine*](../ticket-to-machine/index.md) |
| Story deck | One narrated deck, about 16 minutes, that follows one fictional Azure retirement notice through every gate, with the kit's own fixtures | *One Retirement Notice, End to End*: [▶ Watch](../../../presentations/watch.html?v=PN_Story_One_Retirement_Notice_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/PN_Story_One_Retirement_Notice_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/pn-story-one-retirement-notice) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/pn-story-one-retirement-notice/PN_Story_One_Retirement_Notice_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/pn-story-one-retirement-notice/PN_Story_One_Retirement_Notice_Narrated.vtt) |
| Decks and videos | The guide's two-part implementation deck series, and a narrated tour for each chapter | [Implementation guide](../../../books/guides/provider-notices-implementation.md#watch-or-download) and *Narrated chapter tours* below |
| Training path | Nine modules, one per gate plus the why and an optional runbook module, each with a chapter's Lab 1 and a knowledge check | [Learning path: Provider Notices](../../../training/provider-notices/index.md) |
| The operations view | Why notices go unread, who owns each kind, from notice to task to closure, the weekly digest and the evidence, for the people who run day two | [Book 15, Chapter 14](../../../books/b15-day2-operations/14-provider-notices.md) |
| Where the email goes today | Service health email routed to the help desk supervisor, and why nothing is approved on the strength of an email | [Book 15, Chapter 03](../../../books/b15-day2-operations/03-intake-triage-and-routing.md) |
| Your routing | Neutral templates and Microsoft 365 Copilot Chat prompts to write the agency's own routing at work | [`templates/`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/provider-notices/templates) and [`copilot-prompts.md`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/provider-notices/copilot-prompts.md) |

: The pieces of provider notices and where each lives {.striped .hover}

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| Start with the provider's documentation | What the provider gives you, and what it leaves to you, as a table of gaps the kit's tests pin |
| The code | What the kit does for this provider or step, and the tests |
| Lab 1: fixtures, no tenant | Commands you can run anywhere, with the output they gave when the chapter was written |
| Lab 2: a test tenant | The smallest step a test tenant, account, tenancy or project needs, and how to back it out; not run by the authors |
| Verified facts | Endpoints, least-privileged permissions, government-cloud availability and plan requirements, each footnoted |
| Federal requirements and evidence | The step, the requirement it supports, the KSI it aligns to, and what the ISSO keeps |
| Dangers | What breaks in production, and the guard the code has for it |
| Checklist | What a reviewer checks before the code ships |

Chapter 08 is built differently: it is a runbook, not a gate, so it has no labs. It takes the kit from the seven chapters to a live test environment and then to production, every step a command block, with its outputs shown from fixture mode and its live results written as expectations.

*Design guidance* in this workbook is marked as such: it is the program's position, not a provider's statement. Where a provider's documentation didn't settle a fact, the chapter says *not yet specified* and its verification log lists it.

## Chapters

The outline follows the guide's gates, in order. Chapters 01 to 05 are independent: read the providers the agency uses. Chapter 06 routes what they collect, Chapter 07 reports and records it, and Chapter 08 runs all of it, first in a test environment and then in production.

| # | Chapter | Gate | Starts from | What you build or run | Status |
|---|---|---|---|---|---|
| 01 | [The notice record and Azure Service Health](01-the-notice-record-and-azure-service-health.md) | G1 Azure | Learn's Resource Graph samples for Service Health; the Service Health alert policy | The common record and its fingerprint, the Azure collector, and the alert policy as a plan applied only with its approved hash | Written; review pending |
| 02 | [Microsoft 365 Message center and service health](02-microsoft-365-message-center-and-service-health.md) | G2 Microsoft 365 | Learn's service communications API | The Graph reader on the tenant's own host, and who said action is required | Written; review pending |
| 03 | [Oracle Cloud Infrastructure announcements](03-oracle-cloud-infrastructure-announcements.md) | G3 OCI | Oracle's Announcements CLI and policy reference | The announcement reader, latest in each chain, with affected resources, and the realm guard | Written; review pending |
| 04 | [AWS Health](04-aws-health.md) | G4 AWS | AWS Health API and its GovCloud page | The event reader in batches of ten, the support-plan error, and the partition guard | Written; review pending |
| 05 | [Google Cloud Personalized Service Health](05-google-cloud-personalized-service-health.md) | G5 Google Cloud | Google's Personalized Service Health API | The incident reader, and the gaps: no planned maintenance, not in the Assured Workloads FedRAMP or IL packages | Written; review pending |
| 06 | [Routing to owners and Ticket-to-Machine tasks](06-routing-to-owners-and-ticket-to-machine-tasks.md) | G6 Routing | The finding contract and the request chain | The routing file and its checks, task payloads, de-duplication across runs and the re-read rule | Written; review pending |
| 07 | [The weekly digest and evidence](07-the-weekly-digest-and-evidence.md) | G7 Digest and evidence | The guide's evidence table | The digest's five sections, hashed and chained evidence records, and a stage's coverage check | Written; review pending |
| 08 | [Deploying to test and production](08-deploying-to-test-and-production.md) | G1 to G7 | The guide's gate order and rollback table | One settings file per environment, a pre-flight (PF-01 to PF-07), Stage 1 in a test environment with a staged enable, a smoke test and a rehearsed rollback, the go/no-go, Stage 2 in production, and the evidence | Written; not run against a live tenant |

: Chapters of Building Provider Notices {.striped .hover}

<!-- tour:begin (generated by the tour build; not part of the reviewed page) -->

## Narrated chapter tours

Every chapter has a narrated tour: a deck in Why, What, Who and How order, a self-running edition with captions, and a video. The tours were recorded on November 12, 2026 from the approved chapters, and a tour is re-recorded when its chapter changes. All of them are also on the [Watch page](../../../presentations/watch.md).

| # | Chapter | Watch | Length | Deck | Narrated deck |
|---|---|---|---|---|---|
| 01 | [The Notice Record and Azure Service Health](01-the-notice-record-and-azure-service-health.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PN_01_Notice_Record_Azure_Service_Health_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PN_01_Notice_Record_Azure_Service_Health_Narrated.mp4) | 12 min | [DW_PN_01_Notice_Record_Azure_Service_Health.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-01-notice-record-azure-service-health) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-01-notice-record-azure-service-health) |
| 02 | [Microsoft 365 Message Center and Service Health](02-microsoft-365-message-center-and-service-health.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PN_02_M365_Message_Center_Service_Health_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PN_02_M365_Message_Center_Service_Health_Narrated.mp4) | 11 min | [DW_PN_02_M365_Message_Center_Service_Health.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-02-m365-message-center-service-health) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-02-m365-message-center-service-health) |
| 03 | [Oracle Cloud Infrastructure Announcements](03-oracle-cloud-infrastructure-announcements.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PN_03_OCI_Announcements_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PN_03_OCI_Announcements_Narrated.mp4) | 11 min | [DW_PN_03_OCI_Announcements.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-03-oci-announcements) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-03-oci-announcements) |
| 04 | [AWS Health](04-aws-health.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PN_04_AWS_Health_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PN_04_AWS_Health_Narrated.mp4) | 12 min | [DW_PN_04_AWS_Health.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-04-aws-health) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-04-aws-health) |
| 05 | [Google Cloud Personalized Service Health](05-google-cloud-personalized-service-health.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PN_05_Google_Personalized_Service_Health_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PN_05_Google_Personalized_Service_Health_Narrated.mp4) | 11 min | [DW_PN_05_Google_Personalized_Service_Health.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-05-google-personalized-service-health) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-05-google-personalized-service-health) |
| 06 | [Routing to Owners and Ticket-to-Machine Tasks](06-routing-to-owners-and-ticket-to-machine-tasks.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PN_06_Routing_Owners_TTM_Tasks_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PN_06_Routing_Owners_TTM_Tasks_Narrated.mp4) | 13 min | [DW_PN_06_Routing_Owners_TTM_Tasks.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-06-routing-owners-ttm-tasks) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-06-routing-owners-ttm-tasks) |
| 07 | [The Weekly Digest and Evidence](07-the-weekly-digest-and-evidence.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PN_07_Weekly_Digest_Evidence_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PN_07_Weekly_Digest_Evidence_Narrated.mp4) | 12 min | [DW_PN_07_Weekly_Digest_Evidence.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-07-weekly-digest-evidence) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-07-weekly-digest-evidence) |
| 08 | [Deploying to Test and Production](08-deploying-to-test-and-production.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PN_08_Deploying_Test_Production_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PN_08_Deploying_Test_Production_Narrated.mp4) | 14 min | [DW_PN_08_Deploying_Test_Production.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-08-deploying-test-production) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-pn-08-deploying-test-production) |

<!-- tour:end -->

## Reading paths

- **Anyone new to provider notices:** Book 15's [Chapter 14](../../../books/b15-day2-operations/14-provider-notices.md) for why and who, then the guide.
- **Developers new to the kit:** the guide's [path on one page](../../../books/guides/provider-notices-implementation.md#the-path-on-one-page), then Chapter 01 for the record every provider fills.
- **Developers who own one provider:** Chapter 01's record, then that provider's chapter.
- **Whoever runs the service desk and change process:** Chapter 06, with [*Building Ticket-to-Machine*](../ticket-to-machine/index.md) for the receiving side.
- **ISSOs and reviewers of the code:** each chapter's federal requirements and checklist, then Chapter 07.
- **Whoever runs the change:** Chapter 08, after every chapter's first lab.
- **Learners:** the [Provider Notices learning path](../../../training/provider-notices/index.md), nine modules in the order of the guide's gates, each with a chapter's Lab 1 as its exercise and a knowledge check.

## Where this workbook sits

This is the developer workbook for the [Provider Notices implementation guide](../../../books/guides/provider-notices-implementation.md), one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook. The operating model is Book 15's [Chapter 14, Provider Notices in Day-Two Operations](../../../books/b15-day2-operations/14-provider-notices.md): why notices go unread, who owns each kind, and how a notice becomes a task and closes. Book 15's [Chapter 03](../../../books/b15-day2-operations/03-intake-triage-and-routing.md) routes the provider's email today, and the guide replaces the email with the provider's own API. The routing it builds is the Ticket-to-Machine pattern of [Book 13](../../../books/b13-governance/10-ticket-to-machine.md).

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This workbook has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/project-plans/developer-workbooks/provider-notices).

<!-- revisions:end -->

[^pni-deployments]: Microsoft Learn, "National cloud deployments" (GCC continues using the worldwide endpoints), <https://learn.microsoft.com/graph/deployments> (read November 9, 2026; carried from the provider notices guide's verification log).
