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
review-status: pending
---

# Building Privileged Access {.unnumbered}

*A developer workbook for the Privileged Access & Administrative Identity project*

::: {.callout-important appearance="default"}
## Status: draft, under review
This workbook is new material. Chapters 01 and 02 are written; the other six are planned. Every page is held for the owner's review: until a page is approved it is listed in the weekly source watch issue, and an approved page that changes goes back on that list. Narrated chapter tours will be recorded only after a chapter is approved. Every external claim was checked against Microsoft Learn or a workbook chapter on October 30, 2026 and carries a note, and each chapter keeps its verification log in the repository. The code is illustrative. Its tests pass against fixtures, but it has not been run against a production tenant.
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
| 03 | Conditional Access for administrators and the activation gate | Phase 1, A1.5; Phase 2, A2.3, A2.5 to A2.6 | Learn's Conditional Access Graph samples and templates; `examples/validation-kit` (VK-CA-01) | Authentication context `c1` and `PIM-Activation-c1`, the authentication strength, the administrator policies (CA003 to CA005, CA025 to CA027) and protected actions (preview) as reviewed JSON, with a pre-merge check for the emergency exclusion and a report-only to enforced rollout | Planned |
| 04 | PIM for Microsoft Entra roles as code | Phase 1, A1.6; Phase 2, A2.1 to A2.2 | Learn's tutorial for PIM role assignment and role management policy APIs | Appendix B's role settings as code (approval, approvers, authentication context, justification, ticket, durations) applied through `roleManagementPolicies` rules, eligibility schedule requests, conversion of standing assignments, and a guard against the documented lockout | Planned |
| 05 | PIM for Groups and the PRV groups | Phase 2, A2.1; Phase 3, A3.3 | Learn's PIM for Groups API tutorial | The `PRV-<tier>-<role>` role-assignable groups, their membership and ownership policies, and access packages that grant membership with approval, expiry and review | Planned |
| 06 | PIM for Azure resources | Phase 3, A3.2 | Learn's Azure PIM REST samples | Azure role management policies and eligibility schedule requests by scope, at most three subscription owners, and the elevate-access event as a Tier 0 alert | Planned |
| 07 | Access reviews of privileged roles | Phase 2, A2.7; Phase 3, A3.7 | Learn's access reviews API tutorial; Book 04, Chapter 10's review definition | Reviews of Tier 0 eligibility monthly and the other tiers quarterly, as code, with auto-apply, the no-response default and the review evidence | Planned |
| 08 | Evidence and drift for the ISSO | Phase 3, A3.6; Phase 4, A4.3 | The first workbook's [drift pipeline](../attribute-driven-migration/09-drift-pipelines-and-evidence.md) | A scheduled run of Chapters 01, 02, 04 and 07, a comparison with the last run that treats a Tier 0 drift as an incident, and the monthly evidence package with a hash chain | Planned |

The samples named for Chapters 03 to 08 are candidates. Each chapter checks Learn, `microsoftgraph/*` and `Azure-Samples/*` again before it is written, and pins only what it runs. Microsoft Entra ID Governance, which PIM and access reviews use, is available in GCC, GCC High and DoD.[^pai-availability]

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

[^pai-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
[^pai-availability]: Microsoft Learn, "Microsoft Entra feature availability," other Microsoft Entra products, <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (accessed Oct 30, 2026).
