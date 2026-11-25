---
title: "Building Application Modernization"
subtitle: "A developer workbook for Book 18's reference implementation and its identity remediation work packages"
description: "A developer workbook for Book 18, Application Modernization: a code-first companion for the developers who build a modernized application and move its data. It walks through the reference implementation in examples/app-modernization one step at a time: the API contract and the schema the service owns, the Db2 or Oracle data loaded into PostgreSQL by stated transform rules, the move proved three ways, an AI agent that can only propose, the React front end with an automated Section 508 rule check and the containers, then the application's own Microsoft Entra identity through Book 18 Appendix A's work packages: redirect URIs with DNS proof and an OAuth regression test, assignment enforcement, and the post-change test that seals one evidence pack. Each chapter runs a lab against fixtures on a laptop, then a step in a test environment, and lists the verified facts, the federal requirements and KSIs, the dangers and a checklist."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-application-modernization
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
# Building Application Modernization {.unnumbered}

*A developer workbook for Book 18's reference implementation and its identity remediation work packages*

::: {.callout-important appearance="default"}
## Status: written, waiting for review
All seven chapters are written and wait for the owner's review. Every Lab 1 was run as printed on November 24, 2026, and its output is shown. No Lab 2 has been run by the authors. The code is illustrative: its tests pass against fictional fixtures, an embedded PostgreSQL 18 server and an H2 stand-in for Db2 and Oracle, and it hasn't been run against a real Db2 or Oracle database, a real model or a production tenant.
:::

[Book 18](../../../books/b18-application-modernization/index.md) argues for modernizing a portfolio one application at a time, onto one target architecture, with the data moved and proved, AI that proposes rather than acts, and compliance built in. Its [Chapter 08](../../../books/b18-application-modernization/08-the-reference-implementation.md) ships a small, runnable slice of that architecture in [`examples/app-modernization`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/app-modernization), and its [Appendix A](../../../books/b18-application-modernization/appendix-a-identity-remediation-work-packages.md) gives the six identity work packages each application goes through. Neither teaches a developer to run the code step by step, see what each step proves, and keep the evidence.

This workbook does. It follows the reference implementation in the order an application moves: its contract and schema, its data, its agent, its front end, then its identity. Every chapter walks through code that exists and is tested, runs a lab on a laptop against fixtures, then names the smallest step in a test environment. Where a chapter needed a step no code covered, the kit gained it in the same change, with tests: lab report writers for the Java tests, an automated accessibility check, and a PowerShell module for Appendix A's WP4 to WP6 and the evidence records.

The target estate is a civilian agency at FedRAMP Moderate, in Microsoft 365 GCC with commercial Azure. GCC uses the worldwide Microsoft Graph and sign-in endpoints.[^ami-graph-clouds] The application runs wherever the agency hosts it; nothing in the kit depends on one cloud.

## The pieces and how they connect

| Piece | What it is | Where |
|---|---|---|
| The book | Why and what: triage, the target architecture, moving the data, AI, compliance, governance, waves, and the identity work packages | [Book 18 — Application Modernization](../../../books/b18-application-modernization/index.md) |
| This workbook | How, in code: seven chapters, each with a lab on fixtures and a lab in a test environment | This page and its chapters |
| Training path | Seven modules, one per chapter, each with the chapter's Lab 1 and a knowledge check | [Learning path: Application Modernization](../../../training/application-modernization/index.md) |
| Code | `examples/app-modernization`: the Spring Boot service, the migration CLI and the React front end (28 service, 15 migration and 10 web tests), and the `AppModernization` PowerShell module with `Invoke-AmIdentityApply.ps1` (37 Pester tests) | [`examples/app-modernization`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/app-modernization) · [app-modernization.zip](../../../../downloads/app-modernization.zip) |
| The application's identity, WP1 to WP3 | Owners and the orphan rule, least privilege, and the secret-to-managed-identity conversion, already built by another kit | [*Building Non-Person Identity*](../non-person-identity/index.md), Chapters [02](../non-person-identity/02-ownership-and-the-orphan-rule.md), [07](../non-person-identity/07-least-privilege-for-service-principals.md) and [05](../non-person-identity/05-workload-identity-federation-and-managed-identities.md) |
| The governance record | Where each application's owners, permissions, secrets and exceptions are kept | [Book 13, Chapter 14](../../../books/b13-governance/14-application-secret-and-configuration-governance.md) |

: The pieces of application modernization and where each lives {.striped .hover}

There is no implementation guide for this topic, and none is needed: Book 18's Chapter 08, its Appendix A and the kit's README hold the build steps, and this workbook runs them. There is no separate project plan either: Book 18's [Chapter 10](../../../books/b18-application-modernization/10-running-the-portfolio-in-waves.md) runs the portfolio in waves, and each application gets its own plan from triage.

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build or run, and who should read it |
| Start with the book and the standards | What Book 18 and the standards it cites give you, and what they leave to you, as a table of gaps the kit's tests pin |
| The code | What the kit does for this step, and the tests |
| Lab 1: fixtures, no tenant | Commands you can run on a laptop, with the output they gave when the chapter was written, ending with an evidence record |
| Lab 2 | The smallest step in a test environment (a test PostgreSQL server, a copy of the legacy database, a test host or a test tenant), and how to back it out; not run by the authors |
| Verified facts | The facts the code depends on, each footnoted |
| Federal requirements and evidence | What the output proves, the control it supports, the KSI it aligns to, and who keeps it |
| Dangers | What breaks in production, and the guard the code has for it |
| Checklist | What a reviewer checks before the code ships |

*Design guidance* in this workbook is marked as such: it is the program's position, not a standard's.

## Chapters

Chapters 01 to 05 follow the application; read them in order. Chapters 06 and 07 are the application's identity and can be read on their own once Chapter 01 is done.

| # | Chapter | Book 18 | What you build or run | Status |
|---|---|---|---|---|
| 01 | [The contract and the schema the service owns](01-the-contract-and-the-schema-the-service-owns.md) | [Ch 03](../../../books/b18-application-modernization/03-the-target-reference-architecture.md), [08](../../../books/b18-application-modernization/08-the-reference-implementation.md) | The contract-versus-code test, the API's problem details on real PostgreSQL, and the schema in one Flyway file | Written |
| 02 | [Moving the data: the transform and the load](02-moving-the-data-the-transform-and-the-load.md) | [Ch 04](../../../books/b18-application-modernization/04-moving-the-data.md) | The legacy Db2 schema loaded into the service's own schema by stated transform rules, with each edge case shown side by side | Written |
| 03 | [Proving the move](03-proving-the-move.md) | [Ch 04](../../../books/b18-application-modernization/04-moving-the-data.md) | Row counts, a canonical checksum and independent aggregates; three kinds of damage and the checks that catch each; the delta from the watermark | Written |
| 04 | [An agent that only proposes](04-an-agent-that-only-proposes.md) | [Ch 05](../../../books/b18-application-modernization/05-generative-and-agentic-ai.md) | Triage that writes a pending proposal, an audit row for every tool call, the guards against a misbehaving model, and a person's decision | Written |
| 05 | [The front end, its accessibility check and the containers](05-the-front-end-its-accessibility-check-and-the-containers.md) | [Ch 03](../../../books/b18-application-modernization/03-the-target-reference-architecture.md), [06](../../../books/b18-application-modernization/06-compliance-by-design.md) | The React tests, an automated WCAG 2.0 A and AA rule check of each screen state, the build, and the containers | Written |
| 06 | [The application's identity: redirect URIs and assignment](06-the-applications-identity-redirect-uris-and-assignment.md) | [Appendix A](../../../books/b18-application-modernization/appendix-a-identity-remediation-work-packages.md), WP1 to WP5 | The before snapshot, which work packages apply, WP4's redirect check with DNS proof and the OAuth regression test, WP5's assignment plan, the gated write path and the rollback | Written |
| 07 | [The post-change test and the evidence pack](07-the-post-change-test-and-the-evidence-pack.md) | [Appendix A](../../../books/b18-application-modernization/appendix-a-identity-remediation-work-packages.md), WP6 | The sign-ins since the change and the backout trigger, the test record, the sealed pack, and the chain of every step's evidence record | Written |

: Chapters of Building Application Modernization {.striped .hover}

**What isn't here yet.** A deployment runbook chapter, like the other workbooks' last chapter, isn't written: the kit's containers have never been run by the authors (Book 18, Chapter 08), so a runbook would rest on an untested base. Chapter 05's Lab 2 is the first step toward one. Narrated chapter tours come after review.

## Reading paths

- **Anyone new to the topic:** Book 18's [Chapter 01](../../../books/b18-application-modernization/01-a-portfolio-not-a-rewrite.md) and [Chapter 08](../../../books/b18-application-modernization/08-the-reference-implementation.md), then Chapter 01 here.
- **Developers who build services:** Chapters 01, 04 and 05.
- **Data engineers moving a database:** Chapters 02 and 03, with Book 18's [Chapter 04](../../../books/b18-application-modernization/04-moving-the-data.md).
- **Identity engineers running the remediation factory:** Chapters 06 and 07, with *Building Non-Person Identity* for WP1 to WP3.
- **ISSOs and reviewers of the code:** each chapter's federal requirements and checklist, then Chapter 07.
- **Learners:** the [Application Modernization learning path](../../../training/application-modernization/index.md), seven modules, one per chapter, each with the chapter's Lab 1 as its exercise and a knowledge check.

## Where this workbook sits

This is the developer workbook for [Book 18](../../../books/b18-application-modernization/index.md), one of the [developer workbooks](../index.md) under Projects. The identity work packages it builds on are Book 18's [Appendix A](../../../books/b18-application-modernization/appendix-a-identity-remediation-work-packages.md); the applications reach them through Book 18's [Chapter 02](../../../books/b18-application-modernization/02-triaging-the-portfolio.md#identity-and-access-intake-fields) attack-path rank and [Chapter 10](../../../books/b18-application-modernization/10-running-the-portfolio-in-waves.md#identity-remediation-factory) factory.

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This workbook has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/project-plans/developer-workbooks/application-modernization).

<!-- revisions:end -->

[^ami-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
