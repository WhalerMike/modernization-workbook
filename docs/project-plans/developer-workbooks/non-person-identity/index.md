---
title: "Building Non-Person Identity"
subtitle: "A developer workbook for the Non-Person Identity Modernization project"
description: "A developer workbook for the Non-Person Identity Modernization project: a code-first companion for the developers who build its register of service accounts, service principals, managed identities and AI agents, the ownership check and orphan rule, the per-account decision, credential modernization, least privilege, Conditional Access for workload identities and the evidence. Each chapter starts from Microsoft Learn and Microsoft's own samples, builds tested code in the repository's examples folder, runs a lab against fixtures with no tenant, then a step in a test tenant, and lists the verified Graph, Azure and Active Directory facts, the dangers and a checklist."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-non-person-identity
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

# Building Non-Person Identity {.unnumbered}

*A developer workbook for the Non-Person Identity Modernization project*

::: {.callout-important appearance="default"}
## Status: draft, under review
This workbook is new material. Chapters 01 and 02 are written; Chapters 03 to 10 are planned. Every page is held for the owner's review: until a page is approved it is listed in the weekly source watch issue, and an approved page that changes goes back on that list. Narrated chapter tours will be recorded only after a chapter is approved. Every external claim was checked against Microsoft Learn or a workbook chapter on October 30, 2026 and carries a note, and each chapter keeps its verification log in the repository. The code is illustrative. Its tests pass against fixtures, but it has not been run against a production tenant or domain.
:::

The [Non-Person Identity Modernization project](../../non-person-identity.md) runs the [non-person identity track](../../../books/guides/attribute-driven-migration.md#non-person-identity-track) of the companion guide: every identity that isn't a person, from an Active Directory service account whose password never expires to an AI agent with a sponsor. Its operator material already exists: Book 02's [service accounts](../../../books/b02-identity/09-building-the-entra-target.md#service-accounts), [migration path matrix](../../../books/b02-identity/09-building-the-entra-target.md#the-migration-path-matrix) and [discovery function](../../../books/b02-identity/09-building-the-entra-target.md#discovering-service-accounts); Book 04's [applications and workload identities](../../../books/b04-access/05-applications-and-workload-identities.md) and [orphan policy](../../../books/b04-access/06-who-decides-access.md#ownership-changes-and-orphaned-apps); [Book 17](../../../books/b17-ai-identity/index.md) on AI identity; and the [implementation guide](../../../books/guides/non-person-identity-implementation.md). Those tell an operator what to decide and how to prove it. They don't teach anyone to build the software that reads the estate into one register, holds each decision as reviewed code, and hands the ISSO evidence a reviewer can check.

This workbook is for the developers who build that software. It is code first, and it starts from Microsoft. Each chapter begins with Microsoft Learn's own procedure or sample, runs it offline against fakes, and builds only what it leaves out, in the repository's [`examples`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples) folder, with tests. Each has a lab that runs on a laptop against fixtures with no tenant and no domain, then a short step in a test tenant with a way to back it out. Each lists the Graph, Azure and Active Directory facts the code depends on (endpoints, the least-privileged permission or right, availability in the US Government clouds, release stage), footnoted to Microsoft Learn with the date the page was read, then the dangers and a checklist.

The target estate is Microsoft 365 GCC (Moderate) with commercial Azure, and an on-premises Active Directory until the program retires it at G5. GCC uses the worldwide endpoints: `login.microsoftonline.com`, `graph.microsoft.com` and `management.azure.com`. GCC High and DoD have separate hosts.[^npi-deployments] Every chapter says so where an endpoint matters.

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| Start with Microsoft's sample | What Learn or Microsoft's sample gives you, the pinned copy, and what it leaves to you, as a table of gaps pinned by tests |
| The code | The example it builds, what it adds to Microsoft's sample, and the tests |
| Lab 1: fixtures, no tenant | Steps you can run anywhere, with the expected output |
| Lab 2: test tenant | The smallest change a test tenant needs, and how to back it out |
| Verified facts | Endpoints, least-privileged permissions and rights, national cloud availability and release stage, each footnoted |
| Dangers | What breaks in production, and the guard the code has for it |
| Checklist | What a reviewer checks before the code ships |

*Design guidance* in this workbook is marked as such: it is the program's position, not a vendor statement. Preview and beta features carry their stage wherever they appear.

## Chapters

The outline follows the project plan's phases: inventory, ownership, a decision per account, credential modernization, least privilege, Conditional Access for workload identities, AI agents and steady state. The plan's computed path runs through ownership, because an owner has to be found for every account "before anything is touched", so Chapters 01 and 02 come first.

| # | Chapter | Plan | Starts from | What you build | Status |
|---|---|---|---|---|---|
| 01 | [Non-person identity inventory as code](01-non-person-identity-inventory-as-code.md) | N0.1, N0.2, N0.4, N0.5, Gate 0 | Learn's commands for finding service accounts and service principals (pinned in `examples/third_party/entra-service-account-pages`) and its script exporting app registrations' secrets and certificates (pinned in `examples/third_party/entra-app-credentials-export-page`), then `examples/non-person-identity` | One register: AD service accounts, MSAs, gMSAs and dMSAs, app registrations, service principals, managed identities, federated credentials, Graph application permissions and consent grants, each with an owner count, credential kind, risk, candidate target and stale lead; SQL Server accounts handed to the Data Platform plan; findings NPI-INV-01 to -09 and a manifest with a SHA-256 per file and the tenant ID | Written |
| 02 | [Ownership and the orphan rule](02-ownership-and-the-orphan-rule.md) | N1.1, N1.3, D-N2, Gate 1 (N1.2's AI sponsor fields recorded for Chapter 09) | Learn's Graph samples for ownerless service principals, assigning owners and `serviceManagementReference` (pinned in `examples/third_party/graph-applications-tutorial-page`), then `examples/non-person-identity` | The ownership check over Chapter 01's register (two enabled human members, an active service record, an application owner for every AD account), findings NPI-OWN-01 to -09 with stable IDs, and the orphan rule as a dry-run plan: disable, never delete, once the identity governance officer confirms, a 30-day claim window, writes only with `-Apply` through a separate, delegated, reviewed path | Written |
| 03 | The migration path matrix as code | N2.1, D-N3, N2.2, D-N4, Gate 2 | Candidates: Learn's service account series (*Securing on-premises service accounts*, *Govern on-premises service accounts*) and Book 02's matrix | The matrix as reviewed data; a disposition per account (retire, re-platform, keep on Kerberos with an end date); waves with HIGH-risk accounts first and a rollback per wave; the Workload ID Premium scope as a decision file | Planned |
| 04 | App management policies and certificate rotation | N3.1, N3.7 | Candidates: Learn's Graph samples for application management policies (`tenantAppManagementPolicy`, `appManagementPolicy`) and Key Vault's certificate autorotation tutorial | Secrets and symmetric keys blocked and certificates capped at 180 days for new apps, as reviewed JSON with a diff and dry run; app instance property lock; rotation raised before expiry and approved by the owner | Planned |
| 05 | Workload identity federation and managed identities | N3.2 to N3.4 | Candidates: Learn's federated identity credential samples (Graph and Resource Manager) and Microsoft's GitHub Actions OIDC sample already pinned in `examples/third_party/azure-login-oidc-sample` | Federated credentials and managed identities as code; a token exchange test before each parallel run; the 30-day parallel run recorded, then the legacy account disabled | Planned |
| 06 | gMSAs, dMSAs and the Kerberos island | N3.5, N3.6, N7.3 | Candidates: Learn's *Getting started with group managed service accounts* and *Setting up delegated Managed Service Accounts* procedures | MSAs upgraded to gMSAs, traditional accounts moved to a gMSA or dMSA, the Kerberos accounts that stay islanded with an SPN owner and an end date, and the reconciliation with the program's end state before G5 | Planned |
| 07 | Least privilege for service principals | N4.1 to N4.3, Gate 4 | Candidates: Learn's *Review permissions granted to enterprise applications* and the Graph app role assignment samples | The permission sweep: broad Graph permissions replaced by specific ones, managed identities' Azure role assignments scoped to resources, the quarterly owner review; privileged service principals left to the Privileged Access plan (A3.4) | Planned |
| 08 | Conditional Access for workload identities | N5.1 to N5.3, D-N5, Gate 5 | Candidates: Learn's Conditional Access for workload identities page and its Graph policy samples | Tier 1 single-tenant service principals assigned directly, never through a group; location and risk policies created report-only with the sign-in evidence, then enforced ring by ring; out-of-scope identities recorded with the control that covers them | Planned |
| 09 | AI agent identities | N6.1 to N6.7, D-N6, Gate 6 | Candidates: Learn's Microsoft Entra Agent ID Graph samples (agent identities, blueprints, sponsors); agent Conditional Access and agent risk are preview and stay watch items | Agent identities and blueprints read with sponsors, technical owners and inventory records (the fields Chapter 02 records), the creation handshake, no stored secrets on blueprints, no standing privileged roles, sponsor mover and leaver tasks | Planned |
| 10 | Drift and evidence for the ISSO | N7.1, N7.2, N7.4, Gate 7 | The first workbook's [drift pipeline](../attribute-driven-migration/09-drift-pipelines-and-evidence.md); candidate: Learn's service principal sign-in activity report (beta) | A scheduled run of Chapters 01 and 02 compared by fingerprint, credentials added outside the pipeline, passwords that never expire, ownerless or unused registrations; packages with a SHA-256 per file, the tenant ID and a hash chain for AC-2, AC-6(5), IA-4, IA-5 and IA-9 | Planned |

The samples named for Chapters 03 to 10 are candidates. Each chapter checks Learn, `microsoftgraph/*` and `Azure-Samples/*` again before it is written, and pins only what it runs. Research gaps are numbered in blocks so the chapters can be written in parallel: Chapter NN uses rows (NN − 1) × 10 + 1 to NN × 10 − 1, so Chapter 01 has rows 1 to 9, Chapter 02 rows 11 to 19 and Chapter 10 rows 91 to 99.

## Reading paths

- **Developers new to the project:** Book 02, Chapter 09's [service accounts](../../../books/b02-identity/09-building-the-entra-target.md#service-accounts) and [matrix](../../../books/b02-identity/09-building-the-entra-target.md#the-migration-path-matrix), then Chapter 01.
- **Developers building Phases 0 and 1:** Chapters 01 and 02, in that order; Chapter 02 reads Chapter 01's register and checks it against its manifest.
- **Server and Active Directory engineers:** Chapter 01's AD section, then Chapter 06.
- **AI governance staff:** Book 17, [Chapter 05](../../../books/b17-ai-identity/05-owners-sponsors-and-lifecycle.md), then Chapter 09.
- **ISSOs and reviewers of the code:** the checklists at the end of each chapter, and the manifests the runs write.

## Where this workbook sits

This is the developer workbook for the [Non-Person Identity Modernization project](../../non-person-identity.md), one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook. The design is Book 02, [Chapter 09](../../../books/b02-identity/09-building-the-entra-target.md#modernizing-service-accounts) and [Chapter 10](../../../books/b02-identity/10-migrating-and-governing.md#phase-4-service-account-modernization); the application controls are Book 04, [Chapter 05](../../../books/b04-access/05-applications-and-workload-identities.md) and [Chapter 06](../../../books/b04-access/06-who-decides-access.md#ownership-changes-and-orphaned-apps); SQL Server's accounts go to the Data Platform plan and [Book 06](../../../books/b06-data-platform/09-what-arc-provides-to-sql-server.md#the-managed-identity-and-the-service-account); AI identity is [Book 17](../../../books/b17-ai-identity/index.md). The Graph client pattern every chapter follows, one cloud table, a declared call list with its least-privileged permission and no default cloud, is the first workbook's [Chapter 02](../attribute-driven-migration/02-graph-clients-for-government-clouds.md). Privileged non-human identities are swept in the [Building Privileged Access](../privileged-access/index.md) workbook's plan (A3.4), and this one doesn't repeat that sweep. The read-only checks VK-NPI-01 to VK-NPI-09 in the repository's validation kit are the gate checks the [implementation guide](../../../books/guides/non-person-identity-implementation.md) names; this workbook's code builds the register and the decisions those checks verify.

## Chapters

::: {#chapters}
:::

[^npi-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
