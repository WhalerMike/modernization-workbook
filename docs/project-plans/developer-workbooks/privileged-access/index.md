---
title: "Building Privileged Access"
subtitle: "A developer workbook for the Privileged Access & Administrative Identity project"
description: "A developer workbook for the Privileged Access & Administrative Identity project: a code-first companion for the developers who build its inventory, emergency access checks, PIM settings as code, Conditional Access for administrators, access reviews and evidence. Each chapter starts from Microsoft Learn and Microsoft's own samples, builds tested code in the repository's examples folder, runs a lab against fixtures with no tenant, then a step in a test tenant, and lists the verified Graph and Azure facts, the dangers and a checklist."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-privileged-access
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
review-status: approved
reviewed-sha256: 9feacf1fa045ef3aed318a5d6df8da560c8b7de0112f6d4fe4ed21a13cc62e43
last-reviewed: 2026-10-31
---
# Building Privileged Access {.unnumbered}

*A developer workbook for the Privileged Access & Administrative Identity project*

::: {.callout-important appearance="default"}
## Status: draft, under review
This workbook is new material. All eight chapters are written. Every page is held for the owner's review: until a page is approved it is listed in the weekly source watch issue, and an approved page that changes goes back on that list. Narrated chapter tours will be recorded only after a chapter is approved. Every external claim was checked against Microsoft Learn or a workbook chapter on October 30, 2026 and carries a note, and each chapter keeps its verification log in the repository. The code is illustrative. Its tests pass against fixtures, but it has not been run against a production tenant.
:::

The [Privileged Access & Administrative Identity project](../../privileged-access.md) builds the privileged half of [Book 04](../../../books/b04-access/index.md): emergency access first, then PIM self-request with approval for one role class, then every tier, then the evidence and the residual risk. Its operator material already exists: Book 04's [privileged tiers](../../../books/b04-access/04-privileged-roles-and-tiers.md), the [PIM build](../../../books/b04-access/08-pim-self-request-with-approval.md), the [role settings reference](../../../books/b04-access/appendix-b-pim-role-settings.md), the [reviews](../../../books/b04-access/09-access-governance.md) and [access as code](../../../books/b04-access/10-access-as-code-and-evidence.md), and the project plan with its gates. Those tell an operator what to configure and how to prove it. They don't teach anyone to build the software that reads the privileged estate, holds its settings as reviewed code, and hands the ISSO evidence a reviewer can check.

This workbook is for the developers who build that software. It is code first, and it starts from Microsoft. Each chapter begins with Microsoft Learn's own procedure or sample, runs it offline against fakes, and builds only what it leaves out, in the repository's [`examples`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples) folder, with tests. Each has a lab that runs on a laptop against fixtures with no tenant at all, then a short step in a test tenant with a way to back it out. Each lists the Graph and Azure facts the code depends on (endpoints, the least-privileged permission, availability in the US Government clouds, release stage), footnoted to Microsoft Learn with the date the page was read, then the dangers and a checklist.

The target estate is Microsoft 365 GCC (Moderate) with commercial Azure. GCC uses the worldwide endpoints: `login.microsoftonline.com`, `graph.microsoft.com` and `management.azure.com`. GCC High and DoD have separate hosts.[^pai-deployments] Every chapter says so where an endpoint matters.

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| Start with Microsoft's sample | What Learn or Microsoft's sample gives you, the pinned copy, and what it leaves to you, as a table of gaps pinned by tests |
| The code | The example it builds, what it adds to Microsoft's sample, and the tests |
| Lab 1: fixtures, no tenant | Steps you can run anywhere, with the expected output |
| Lab 2: test tenant | The smallest change a test tenant needs, and how to back it out |
| Verified facts | Endpoints, least-privileged permissions, national cloud availability and release stage, each footnoted |
| Dangers | What breaks in production, and the guard the code has for it |
| Checklist | What a reviewer checks before the code ships |

*Design guidance* in this workbook is marked as such: it is the program's position, not a vendor statement. Preview and beta features carry their stage wherever they appear.

## Chapters

The outline follows the project plan's phases and Book 04, Chapter 08's build order, which the plan calls fixed: emergency access first, then the activation policy, then the role settings, "because switching on approval before the emergency accounts exist is the one sequence that locks the agency out."

| # | Chapter | Plan phase | Starts from | What you build | Status |
|---|---|---|---|---|---|
| 01 | [Privileged inventory as code](01-privileged-inventory-as-code.md) | Phase 0, A0.1, A0.2, Gate 0 | Learn's samples for listing Microsoft Entra role assignments (pinned in `examples/third_party/entra-role-assignments-page`), then `examples/privileged-access` | One read of every privileged assignment: Entra roles active and eligible, groups expanded to members, Azure role assignment and eligibility schedules, each row given a tier, findings for standing privilege, direct assignments, unnamed groups, unclassified roles, too many Global Administrators or subscription owners, and a manifest with a hash per file | Written |
| 02 | [Emergency access accounts as code](02-emergency-access-as-code.md) | Phase 0, A0.4; Phase 1, A1.1 | Learn's emergency access standard and its alert queries (pinned in `examples/third_party/entra-emergency-access-page`), then `examples/privileged-access` | A check of each account against the standard (cloud-only, permanent active Global Administrator, phishing-resistant methods only, excluded from every enforced policy, validated within 90 days), and the alert as an ARM template that also sees non-interactive sign-ins and audit events | Written |
| 03 | [Conditional Access for administrators and the activation gate](03-conditional-access-for-administrators.md) | Phase 1, A1.5; Phase 2, A2.3, A2.5 to A2.6 | Microsoft's Conditional Access template for administrators as Graph JSON (pinned in `examples/third_party/conditional-access-template-page`), then `examples/privileged-access` | Authentication contexts c1 and c2, the privileged strength and the administrator policies as reviewed JSON; a pre-merge check (PA-CA-01 to PA-CA-09) including the emergency exclusion; a diff against the tenant and a dry run, with every new policy created report-only and enforcement only with `-AllowEnforce` | Written |
| 04 | [PIM for Microsoft Entra roles as code](04-pim-for-entra-roles-as-code.md) | Phase 1, A1.6; Phase 2, A2.1 to A2.2; Phase 3, A3.1 | Learn's Update rules in PIM samples and PIM role-assignment tutorial (pinned in `examples/third_party/graph-pim-rules-pages`), then `examples/privileged-access` | Appendix B as one reviewed JSON file per role, applied through `roleManagementPolicies` rules with a diff and a dry run, read and write permissions split by task, conversion of standing assignments after confirmed activation, a guard against the documented lockout, a back-out from `before.json`, active assignments capped at 15 days, and rollout waves starting with Tier 1 | Written |
| 05 | [PIM for Groups and the PRV groups](05-pim-for-groups.md) | Phase 2, A2.1; Phase 3, A3.3 | Microsoft's PIM for Groups request samples (pinned in `examples/third_party/graph-pim-for-groups-pages`), then `examples/privileged-access` | The PRV role-assignable groups, their member and owner schedules and two PIM policies as reviewed JSON; a read first, findings PA-PG-01 to -09, a plan with a diff, a dry run unless `-Apply`, guards G1 to G7 and least privilege per call; access packages deferred | Written |
| 06 | [PIM for Azure resources](06-pim-for-azure-resources.md) | Phase 3, A3.2 | Learn's PIM for Azure resources REST walkthroughs and Microsoft's REST examples (pinned in `examples/third_party/azure-pim-rest-examples`), then `examples/privileged-access` | Role management policies by tier at every management group, subscription and resource group; eligible assignments as reviewed JSON with a diff, a dry run and `-Apply`; standing Owner, Contributor and User Access Administrator found and converted to eligible; Reader to read, User Access Administrator to apply | Written |
| 07 | [Access reviews of privileged roles](07-access-reviews-of-privileged-roles.md) | Phase 2, A2.7; Phase 3, A3.7 | Learn's access reviews API tutorial for administrative roles (pinned in `examples/third_party/graph-access-reviews-roles-tutorial`), then `examples/privileged-access` | Review series for Entra roles (users), each PRV group's membership, and Azure roles (preview) as reviewed JSON, checked (including the guard that keeps the emergency accounts' Global Administrator on silence), a dry run and diff before `-Apply`, least privilege per task, and the decisions read back as evidence | Written |
| 08 | [Evidence and drift for the ISSO](08-evidence-and-drift.md) | Phase 3, A3.6; Phase 4, A4.3 | Learn's PIM audit history queries (pinned in `examples/third_party/entra-pim-audit-page`), then the first workbook's drift pipeline | A scheduled run of Chapter 01's inventory, Chapter 02's check and the PIM audit evidence from Graph, a comparison by fingerprint that treats Tier 0 drift as an incident and keeps names out of the tracker, packages with a SHA-256 per file, the tenant ID and a hash chain, and a period summary for Gate 4 | Written |

The samples named for Chapters 03 to 08 are candidates. Each chapter checks Learn, `microsoftgraph/*` and `Azure-Samples/*` again before it is written, and pins only what it runs. Microsoft Entra ID Governance, which PIM and access reviews use, is available in GCC, GCC High and DoD.[^pai-availability]

<!-- tour:begin (generated by the tour build; not part of the reviewed page) -->

## Narrated chapter tours

Every chapter has a narrated tour: a deck in Why, What, Who and How order, a self-running edition with captions, and a video. The tours were recorded on October 31, 2026 from the approved chapters, and a tour is re-recorded when its chapter changes. All of them are also on the [Watch page](../../../presentations/watch.md).

| # | Chapter | Watch | Length | Deck | Narrated deck |
|---|---|---|---|---|---|
| 01 | [Privileged Inventory as Code](01-privileged-inventory-as-code.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PA_01_Privileged_Inventory_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PA_01_Privileged_Inventory_Narrated.mp4) | 11 min | [DW_PA_01_Privileged_Inventory.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_01_Privileged_Inventory.pptx) | [Narrated](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_01_Privileged_Inventory_Narrated.pptx) |
| 02 | [Emergency Access Accounts as Code](02-emergency-access-as-code.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PA_02_Emergency_Access_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PA_02_Emergency_Access_Narrated.mp4) | 10 min | [DW_PA_02_Emergency_Access.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_02_Emergency_Access.pptx) | [Narrated](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_02_Emergency_Access_Narrated.pptx) |
| 03 | [Conditional Access for Administrators and the Activation Gate](03-conditional-access-for-administrators.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PA_03_CA_Activation_Gate_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PA_03_CA_Activation_Gate_Narrated.mp4) | 11 min | [DW_PA_03_CA_Activation_Gate.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_03_CA_Activation_Gate.pptx) | [Narrated](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_03_CA_Activation_Gate_Narrated.pptx) |
| 04 | [PIM for Microsoft Entra Roles as Code](04-pim-for-entra-roles-as-code.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PA_04_PIM_Entra_Roles_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PA_04_PIM_Entra_Roles_Narrated.mp4) | 11 min | [DW_PA_04_PIM_Entra_Roles.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_04_PIM_Entra_Roles.pptx) | [Narrated](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_04_PIM_Entra_Roles_Narrated.pptx) |
| 05 | [PIM for Groups and the PRV Groups](05-pim-for-groups.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PA_05_PIM_for_Groups_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PA_05_PIM_for_Groups_Narrated.mp4) | 11 min | [DW_PA_05_PIM_for_Groups.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_05_PIM_for_Groups.pptx) | [Narrated](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_05_PIM_for_Groups_Narrated.pptx) |
| 06 | [PIM for Azure Resources](06-pim-for-azure-resources.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PA_06_PIM_Azure_Resources_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PA_06_PIM_Azure_Resources_Narrated.mp4) | 12 min | [DW_PA_06_PIM_Azure_Resources.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_06_PIM_Azure_Resources.pptx) | [Narrated](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_06_PIM_Azure_Resources_Narrated.pptx) |
| 07 | [Access Reviews of Privileged Roles](07-access-reviews-of-privileged-roles.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PA_07_Access_Reviews_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PA_07_Access_Reviews_Narrated.mp4) | 12 min | [DW_PA_07_Access_Reviews.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_07_Access_Reviews.pptx) | [Narrated](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_07_Access_Reviews_Narrated.pptx) |
| 08 | [Evidence and Drift for the ISSO](08-evidence-and-drift.md) | [▶ Watch](../../../presentations/watch.html?v=DW_PA_08_Evidence_Drift_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_PA_08_Evidence_Drift_Narrated.mp4) | 12 min | [DW_PA_08_Evidence_Drift.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_08_Evidence_Drift.pptx) | [Narrated](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/DW_PA_08_Evidence_Drift_Narrated.pptx) |

<!-- tour:end -->

## Reading paths

- **Developers new to the project:** Book 04, [Chapter 04](../../../books/b04-access/04-privileged-roles-and-tiers.md) for the tiers, then Chapter 01.
- **Developers building the foundation (the plan's Phase 1):** Chapter 02 before anything else, then Chapters 03 and 04, in that order.
- **Platform engineers for Azure:** Chapter 01's Azure section, then Chapter 06.
- **ISSOs and reviewers of the code:** the checklists at the end of each chapter, and the manifests the runs write.

## Where this workbook sits

This is the developer workbook for the [Privileged Access & Administrative Identity project](../../privileged-access.md), one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook. The privileged model, the build and its evidence are [Book 04](../../../books/b04-access/index.md), Chapters 04 to 10 and [Appendix B](../../../books/b04-access/appendix-b-pim-role-settings.md). The Graph client pattern every chapter follows, one cloud table, a declared call list with its least-privileged permission and no default cloud, is the first workbook's [Chapter 02](../attribute-driven-migration/02-graph-clients-for-government-clouds.md). The drift and evidence pipeline Chapter 08 extends is the first workbook's [Chapter 09](../attribute-driven-migration/09-drift-pipelines-and-evidence.md).

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.0**, in [edition 2026.10](../../../about/archive.md#edition-2026-10) (October 31, 2026). Every edition is kept on the [Archive](../../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/project-plans/developer-workbooks/privileged-access).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.0 | [2026.10](../../../about/archive.md#edition-2026-10) | 2026-10-31 | First edition (12 merged changes since the workbook began) |

: Versions of this workbook, newest first {.striped .hover}

<!-- revisions:end -->

[^pai-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
[^pai-availability]: Microsoft Learn, "Microsoft Entra feature availability," other Microsoft Entra products, <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Oct 30, 2026).
