---
title: "Building the Daily Checks Workbook"
subtitle: "A developer workbook for the Daily Checks Dashboard implementation guide"
description: "A developer workbook for putting the operator runbook's daily checks on one Azure Monitor workbook: a code-first companion for the developers who build the workbook template, its validator, the fixture renderer and the deployment behind the Daily Checks Dashboard implementation guide. Four chapters: the daily checks and where each one lives, the template and its validator, what each tab would show, and the runbook for test and production. Each code chapter starts from Microsoft Learn, builds tested code in examples/daily-checks-workbook, runs a lab against a fictional workspace's fixtures with no tenant, then a step in a test workspace. The workbook is a view, not evidence."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-daily-checks
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
reviewed-sha256: e5a3c089e6764a33eda6cd6ccfd0faf8f9b2a7272416c3ef6038504817c06694
last-reviewed: 2026-11-19
---
# Building the Daily Checks Workbook {.unnumbered}

*A developer workbook for the Daily Checks Dashboard implementation guide*

::: {.callout-important appearance="default"}
## Status: draft, waiting for review
All four chapters are written and waiting for the owner's review. Every external claim carries a note and a read date against Microsoft Learn or a workbook page, and each chapter keeps its verification log in the repository. The code is illustrative: its 52 tests pass against a fictional workspace's fixtures, but it hasn't been deployed to a live subscription, and no Lab 2 has been run by the authors. Chapter 04, the deployment runbook, hasn't been run against a live subscription.
:::

The [Daily Checks Dashboard implementation guide](../../../books/guides/daily-checks-dashboard-implementation.md) puts the daily checks of the operator runbook, [Book 15, Chapter 12](../../../books/b15-day2-operations/12-the-day-two-runbook.md), on one Azure Monitor workbook in the Sentinel workspace, one tab per check, with a link out to the portal that holds the data where Log Analytics doesn't. The guide holds the design, the sources, their GCC availability and the requirements. It doesn't give anyone the software that keeps the workbook as reviewed code: a template built from a manifest, a validator that catches the edits people make in the portal, a way to see what each tab would show without a tenant, and a deployment that previews every change and records what it did.

This workbook is that software, in the repository's [`examples/daily-checks-workbook`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/daily-checks-workbook) folder. Each code chapter starts with Microsoft Learn's own material, says what it leaves to the agency, and builds only that, with tests. Each has a lab that runs on a laptop against one fictional workspace for `contoso.example`, read on two mornings, then a short step in a test workspace with a way to back it out.

**The rule.** The workbook is a view, not evidence. [Book 12, Chapter 12](../../../books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md#what-an-assessor-verifies) calls a dashboard "a picture of the evidence." Every tab carries a banner that says so, the validator fails a tab without it, and the kit refuses to record a rendered view as evidence. What it does record is the template's validation, the plan, the deployment, the reachability check and the replication probe's run.

**GCC.** The target is Microsoft 365 GCC (Moderate) with the Sentinel workspace in commercial Azure, `management.azure.com`. The kit has one cloud, `AzureCloud`, and no default. Where a source's GCC availability is *not yet specified* on Learn (Entra Health monitoring, Connect Health for sync and for AD DS), its tab is a link out.[^dcwi-guide]

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| Start with Microsoft's documentation | What Learn gives you, and what it leaves to you, as a table of gaps pinned by tests |
| The code | What the chapter adds, and the tests |
| Lab 1: fixtures, no tenant | Exact commands on the fictional workspace, with the kit's real output |
| Lab 2: a test workspace | Exact commands in a test subscription, with a back-out step; not run by the authors |
| Verified facts | Tables, roles, API versions and GCC availability, each footnoted |
| Federal requirements and evidence | What each output proves, the SP 800-53 controls it supports and the KSIs it aligns to |
| Dangers and checklist | What breaks in production, the guard for it, and what a reviewer checks |

*Design guidance* in this workbook is the program's position, not a vendor statement.

## Chapters

| # | Chapter | Guide steps | What you build | Status |
|---|---|---|---|---|
| 01 | [The daily checks and where each one lives](01-the-daily-checks-and-where-each-lives.md) | 1 | The manifest: twelve tabs, one per daily check (the synchronization servers, the domain controllers and the request-driven admin changes among them), each with its tables, link-outs, GCC note and fit | Written |
| 02 | [The workbook template and its validator](02-the-workbook-template-and-its-validator.md) | 2 | The gallery template built from the manifest, and checks DC-V-01 to -10 for it or any portal export | Written |
| 03 | [What each tab would show](03-what-each-tab-would-show.md) | 1, 5 | The renderer that shows ATTENTION, CLEAR, STALE, NO DATA or LINK-OUT from saved results; the reachability check; the replication probe | Written |
| 04 | [Deploying to test and production](04-deploying-to-test-and-production.md) | 3, 4, 6 | The runbook: settings per environment, preflight PF-01 to -06, plan and what-if, deploy by approved hash, rollback, evidence | Written; not run against a live subscription |

<!-- tour:begin (generated by the tour build; not part of the reviewed page) -->

## Narrated chapter tours

Every chapter has a narrated tour: a deck in Why, What, Who and How order, a self-running edition with captions, and a video. The tours were recorded on November 19, 2026 from the approved chapters, and a tour is re-recorded when its chapter changes. All of them are also on the [Watch page](../../../presentations/watch.md).

| # | Chapter | Watch | Length | Deck | Narrated deck |
|---|---|---|---|---|---|
| 01 | [The Daily Checks and Where Each One Lives](01-the-daily-checks-and-where-each-lives.md) | [▶ Watch](../../../presentations/watch.html?v=DW_DC_01_Daily_Checks_Where_Each_Lives_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_DC_01_Daily_Checks_Where_Each_Lives_Narrated.mp4) | 8 min | [DW_DC_01_Daily_Checks_Where_Each_Lives.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-dc-01-daily-checks-where-each-lives) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-dc-01-daily-checks-where-each-lives) |
| 02 | [The Workbook Template and Its Validator](02-the-workbook-template-and-its-validator.md) | [▶ Watch](../../../presentations/watch.html?v=DW_DC_02_Template_And_Validator_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_DC_02_Template_And_Validator_Narrated.mp4) | 6 min | [DW_DC_02_Template_And_Validator.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-dc-02-template-and-validator) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-dc-02-template-and-validator) |
| 03 | [What Each Tab Would Show](03-what-each-tab-would-show.md) | [▶ Watch](../../../presentations/watch.html?v=DW_DC_03_What_Each_Tab_Would_Show_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_DC_03_What_Each_Tab_Would_Show_Narrated.mp4) | 8 min | [DW_DC_03_What_Each_Tab_Would_Show.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-dc-03-what-each-tab-would-show) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-dc-03-what-each-tab-would-show) |
| 04 | [Deploying to Test and Production](04-deploying-to-test-and-production.md) | [▶ Watch](../../../presentations/watch.html?v=DW_DC_04_Deploying_Test_Production_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_DC_04_Deploying_Test_Production_Narrated.mp4) | 6 min | [DW_DC_04_Deploying_Test_Production.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-dc-04-deploying-test-production) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-dc-04-deploying-test-production) |

<!-- tour:end -->

## Reading paths

- **Anyone, first:** the story deck *Two Mornings, One Workspace*, about 6 minutes with captions, which follows one fictional workspace, `contoso.example`, through two mornings, the one after its Entra diagnostic setting stopped and the next, through every chapter, with the kit's own fixtures, a "Try it" command and a one-question check per scene: [▶ Watch](../../../presentations/watch.html?v=DC_Story_Two_Mornings_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DC_Story_Two_Mornings_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dc-story-two-mornings) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/dc-story-two-mornings/DC_Story_Two_Mornings_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/dc-story-two-mornings/DC_Story_Two_Mornings_Narrated.vtt).
- **Developers new to the project:** the guide's [How to read this guide](../../../books/guides/daily-checks-dashboard-implementation.md#how-to-read) and [tab table](../../../books/guides/daily-checks-dashboard-implementation.md#tabs), then Chapter 01.
- **Security operations:** Chapters 02 and 03, then Chapter 04.
- **Operators:** Chapter 03, which shows what a stale source looks like.
- **ISSOs and reviewers of the code:** each chapter's requirements table and checklist, and Chapter 04's evidence.
- **Learners:** the [learning path](../../../training/daily-checks-dashboard/index.md), whose two modules each link two chapters' Lab 1.

## Where this workbook sits

This is one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook, the code behind the [Daily Checks Dashboard implementation guide](../../../books/guides/daily-checks-dashboard-implementation.md) beside its [learning path](../../../training/daily-checks-dashboard/index.md). It links instead of rebuilding: the daily checks and what each proves are Book 15, Chapter 12's; the synchronization probe whose result the sync tab reads is that chapter's task 6; the emergency access accounts are [*Building Privileged Access*](../privileged-access/index.md)'s. The code downloads as one zip, [daily-checks-workbook-code.zip](../../../../downloads/daily-checks-workbook-code.zip), from the [Downloads](../../../downloads.md) page, and the [Labs](../../../training/labs.md#dc) page lists every lab.

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This workbook has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/project-plans/developer-workbooks/daily-checks).

<!-- revisions:end -->

[^dcwi-guide]: [The Daily Checks on One Dashboard: An Implementation Guide, GCC availability](../../../books/guides/daily-checks-dashboard-implementation.md#availability), whose sources were read on Microsoft Learn on November 18, 2026.
