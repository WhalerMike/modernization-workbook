---
title: "Building Defender XDR"
subtitle: "A developer workbook for the Defender XDR implementation guide"
description: "A developer workbook for the Defender XDR implementation guide: a code-first companion for the developers who build the checks that prove Microsoft Defender XDR is doing on Windows clients and Windows Server what the agency decided. Unified RBAC roles and the Graph read path; onboarding coverage and sensor health against the inventory; prevention settings on each device against its ring's stage; Attack Surface Reduction through audit, warn and block, ring by ring; exposure without Security Exposure Management, which isn't available in GCC, and incidents against the severity table; custom detections kept as code, tested and deployed through Microsoft Graph; identity signals and automation matched to the response ladder; the monthly evidence run with the guide's metrics; and a runbook for test and production. Each chapter builds on tested code in the repository's examples folder, runs a lab against fixtures with no tenant, then a step in a test tenant, and lists the verified facts, the federal requirements and evidence, the dangers and a checklist."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-defender-xdr
listing:
  - id: chapters
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
last-reviewed: 2026-11-17
---
# Building Defender XDR {.unnumbered}

*A developer workbook for the Defender XDR implementation guide*

::: {.callout-important appearance="default"}
## Status: draft, waiting for the owner's review
All nine chapters are written, and every page waits for the owner's review; until a page is approved it is listed in the weekly source watch issue. Chapter 09, the deployment runbook, hasn't been run against a live tenant. Every external claim was checked against Microsoft Learn (on November 11, 2026 for the guide, and again on November 17, 2026 for the pages this workbook adds), NIST's OSCAL catalog or fedramp.gov, and each chapter keeps its verification log in the repository. The code is illustrative: its tests pass against fictional fixtures and stand-in runners, and it has not been run against a production tenant. A story deck and a narrated tour for each chapter are planned.
:::

The [Defender XDR implementation guide](../../../books/guides/defender-xdr-implementation.md) turns a Defender license into defended endpoints in ten gates: access, onboarding, prevention, Attack Surface Reduction, exposure, incidents, detections, identity signals, automation, and operations and evidence. Each gate says what to configure, what to validate with a Learn command or query, and what the ISSO keeps. It doesn't build the software that runs those checks every week, compares them with the agency's plans, and keeps the evidence.

This workbook builds that software. It is code first. Every chapter begins with the guide's Validate step and the Microsoft Learn page behind it, then walks through the code in the repository's [`examples/defender-xdr`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/defender-xdr) folder that runs it at fleet scale, with tests. Each has a lab that runs on a laptop against a fictional estate with no tenant at all, then a short step in a test tenant with a way to back it out. Each lists the facts the code depends on, footnoted to Learn with the date it was read, then the federal requirement the step supports, the KSI it aligns to and what the ISSO keeps, the dangers and a checklist.

The target estate is a civilian agency at FedRAMP Moderate in Microsoft 365 GCC with commercial Azure, Windows clients and Windows Server 2019 and later. The kit reads through Microsoft Graph on `graph.microsoft.com`, which GCC uses,[^xdri-deployments] and takes an explicit cloud name with no default. Security Exposure Management isn't available in GCC; Chapter 05 records it as a disposition with the guide's interim path, and no code assumes it. Learn doesn't state the GCC availability of the custom detection API; Chapter 06 deploys through it and keeps a portal path from the same files.

## The pieces and how they connect

| Piece | What it is | Where |
|---|---|---|
| Implementation guide | The ten gates: steps, Validate, GCC availability per feature, metrics, the evidence catalog, requirements and KSIs, rollback | [Defender XDR Engineering & Operations: An Implementation Guide](../../../books/guides/defender-xdr-implementation.md) |
| This workbook | The code each gate needs, labs, verified facts and evidence; and a runbook for test and production | This page and its nine chapters |
| Code | `examples/defender-xdr`: thirteen entry scripts, one PowerShell module with a file per gate, the runbook's `deploy/` scripts, a fictional `contoso.example` estate, and Pester tests | [`examples/defender-xdr`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/defender-xdr); [defender-xdr-code.zip](../../../../downloads/defender-xdr-code.zip) |
| Setting values | The antivirus, firewall and Attack Surface Reduction policies ES-001 to ES-005 | [Book 05, Chapter 08](../../../books/b05-devices/08-gpo-to-intune-policy-migration.md#endpoint-security-policies) |
| Security operations | The Defender XDR connector, vulnerability management, the rule lifecycle, the response ladder, the metric set | [Book 12](../../../books/b12-security-operations/index.md), Chapters 05, 06, 11 and 12 |
| Closure | The normalized results and the closure register, where Chapter 05's Exposure Management disposition goes | [Book 11, Chapter 10](../../../books/b11-zero-trust/10-evidence-not-verdicts.md); the [Zero Trust Assessment results kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/zta-results) |
| Story deck | One narrated deck, about 16 minutes, that follows one fictional macro document, `invoice.docm`, on a ring 0 workstation that tries to start encoded PowerShell, through every chapter, with the kit's own fixtures, a "Try it" command and a one-question check per scene | *One Office Macro, End to End*: [▶ Watch](../../../presentations/watch.html?v=XDR_Story_One_Office_Macro_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/XDR_Story_One_Office_Macro_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/xdr-story-one-office-macro) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/xdr-story-one-office-macro/XDR_Story_One_Office_Macro_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/xdr-story-one-office-macro/XDR_Story_One_Office_Macro_Narrated.vtt) |
| Training path | Five modules built from the guide, each with a Lab 2 in a test tenant and now a chapter's Lab 1 | [Learning path: Defender XDR Engineering and Operations](../../../training/defender-xdr/index.md) |
| Your inputs | Neutral templates and Microsoft 365 Copilot Chat prompts to fill the inventory, registers, plans and exports at work | [`templates/`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/defender-xdr/templates) and [`copilot-prompts.md`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/defender-xdr/copilot-prompts.md) |

: The pieces of Defender XDR engineering and where each lives {.striped .hover}

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| Start with Microsoft Learn's commands | What the guide's Validate step and Learn give you, and what they leave to you, as a table of gaps the kit's tests pin |
| The code | What the kit reads, what it decides, and the tests |
| Lab 1: fixtures, no tenant | Commands you can run anywhere, with the output they gave when the chapter was written |
| Lab 2: a test tenant | The smallest step a test tenant needs, and how to back it out; not run by the authors |
| Verified facts | Endpoints, least-privileged permissions, roles, GCC availability, each footnoted |
| Federal requirements and evidence | What the output proves, the requirement it supports, the KSI it aligns to, and who keeps it |
| Dangers | What breaks in production, and the guard the code has for it |
| Checklist | What a reviewer checks before the code ships |

Chapter 09 is built differently: it is a runbook, not a gate, so it has no labs. It takes the kit to a live test tenant and then production, every step a command block, with fixture-mode output shown and the live results written as expectations.

*Design guidance* in this workbook is marked as such: it is the program's position, not Microsoft's. Where Learn didn't settle a fact, the chapter says *not yet specified* and the [research gaps](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/project-plans/developer-workbooks/defender-xdr/_verification/research-gaps.md) list it.

## Where to start

- **Developers new to the kit:** the guide's [path on one page](../../../books/guides/defender-xdr-implementation.md#the-path-on-one-page), then Chapter 01 for the read path every chapter uses.
- **The platform owner:** Chapters 02 to 04, for coverage, prevention and Attack Surface Reduction ring by ring.
- **The SOC lead and the detection engineer:** Chapters 05 to 07.
- **ISSOs and reviewers of the code:** each chapter's federal requirements and checklist, then Chapter 08.
- **Whoever runs the change:** Chapter 09, after every chapter's first lab.
- **Learners:** the [learning path](../../../training/defender-xdr/index.md), five modules, each pointing to the chapters' Lab 1.

## Where this workbook sits

This is the developer workbook for the [Defender XDR implementation guide](../../../books/guides/defender-xdr-implementation.md), one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook. It follows the shape of [*Building Privileged Access*](../privileged-access/index.md) and [*Building Provider Notices*](../provider-notices/index.md), and its evidence records are the same chain those kits keep.

## Chapters

::: {#chapters}
:::

<!-- tour:begin (generated by the tour build; not part of the reviewed page) -->

## Narrated chapter tours

Every chapter has a narrated tour: a deck in Why, What, Who and How order, a self-running edition with captions, and a video. The tours were recorded on November 17, 2026 from the draft chapters, before their review, and a tour is re-recorded when its chapter changes. All of them are also on the [Watch page](../../../presentations/watch.md).

| # | Chapter | Watch | Length | Deck | Narrated deck |
|---|---|---|---|---|---|
| 01 | [Access and the Graph Read Path](01-access-and-the-graph-read-path.md) | [▶ Watch](../../../presentations/watch.html?v=DW_XDR_01_Access_Graph_Read_Path_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_XDR_01_Access_Graph_Read_Path_Narrated.mp4) | 8 min | [DW_XDR_01_Access_Graph_Read_Path.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-01-access-graph-read-path) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-01-access-graph-read-path) |
| 02 | [Onboarding Coverage and Sensor Health](02-onboarding-coverage-and-sensor-health.md) | [▶ Watch](../../../presentations/watch.html?v=DW_XDR_02_Onboarding_Coverage_Sensor_Health_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_XDR_02_Onboarding_Coverage_Sensor_Health_Narrated.mp4) | 8 min | [DW_XDR_02_Onboarding_Coverage_Sensor_Health.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-02-onboarding-coverage-sensor-health) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-02-onboarding-coverage-sensor-health) |
| 03 | [Prevention Through Audit](03-prevention-through-audit.md) | [▶ Watch](../../../presentations/watch.html?v=DW_XDR_03_Prevention_Through_Audit_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_XDR_03_Prevention_Through_Audit_Narrated.mp4) | 8 min | [DW_XDR_03_Prevention_Through_Audit.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-03-prevention-through-audit) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-03-prevention-through-audit) |
| 04 | [Attack Surface Reduction: Audit, Warn, Block](04-attack-surface-reduction-audit-warn-block.md) | [▶ Watch](../../../presentations/watch.html?v=DW_XDR_04_ASR_Audit_Warn_Block_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_XDR_04_ASR_Audit_Warn_Block_Narrated.mp4) | 9 min | [DW_XDR_04_ASR_Audit_Warn_Block.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-04-asr-audit-warn-block) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-04-asr-audit-warn-block) |
| 05 | [Exposure and Incidents](05-exposure-and-incidents.md) | [▶ Watch](../../../presentations/watch.html?v=DW_XDR_05_Exposure_Incidents_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_XDR_05_Exposure_Incidents_Narrated.mp4) | 9 min | [DW_XDR_05_Exposure_Incidents.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-05-exposure-incidents) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-05-exposure-incidents) |
| 06 | [Detections as Code](06-detections-as-code.md) | [▶ Watch](../../../presentations/watch.html?v=DW_XDR_06_Detections_As_Code_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_XDR_06_Detections_As_Code_Narrated.mp4) | 8 min | [DW_XDR_06_Detections_As_Code.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-06-detections-as-code) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-06-detections-as-code) |
| 07 | [Identity Signals and Automation Boundaries](07-identity-signals-and-automation-boundaries.md) | [▶ Watch](../../../presentations/watch.html?v=DW_XDR_07_Identity_Signals_Automation_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_XDR_07_Identity_Signals_Automation_Narrated.mp4) | 8 min | [DW_XDR_07_Identity_Signals_Automation.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-07-identity-signals-automation) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-07-identity-signals-automation) |
| 08 | [The Monthly Evidence Run](08-the-monthly-evidence-run.md) | [▶ Watch](../../../presentations/watch.html?v=DW_XDR_08_Monthly_Evidence_Run_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_XDR_08_Monthly_Evidence_Run_Narrated.mp4) | 9 min | [DW_XDR_08_Monthly_Evidence_Run.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-08-monthly-evidence-run) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-08-monthly-evidence-run) |
| 09 | [Deploying to Test and Production](09-deploying-to-test-and-production.md) | [▶ Watch](../../../presentations/watch.html?v=DW_XDR_09_Deploying_Test_Production_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_XDR_09_Deploying_Test_Production_Narrated.mp4) | 9 min | [DW_XDR_09_Deploying_Test_Production.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-09-deploying-test-production) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-xdr-09-deploying-test-production) |

<!-- tour:end -->

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This workbook has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/project-plans/developer-workbooks/defender-xdr).

<!-- revisions:end -->

[^xdri-deployments]: Microsoft Learn, "National cloud deployments" (GCC uses the worldwide endpoints), <https://learn.microsoft.com/graph/deployments> (accessed November 9, 2026; carried from the Defender XDR guide's verification log).
