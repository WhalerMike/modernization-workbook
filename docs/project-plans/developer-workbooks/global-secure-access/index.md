---
title: "Building Global Secure Access"
subtitle: "A developer workbook for the Global Secure Access implementation guide"
description: "A developer workbook for deploying Microsoft Entra Internet Access and Private Access as the identity-aware network layer: a code-first companion for the developers who build the reads, checks, change plans, metrics and evidence behind the Global Secure Access implementation guide's twelve steps. Each chapter starts from Microsoft Learn, builds tested code in examples/global-secure-access, runs a lab against a fictional tenant's fixtures with no tenant, then a step in a test tenant, and lists the verified Graph facts, GCC availability with interim paths, the requirements and KSIs, the dangers and a checklist. The last chapter is the runbook for test and production."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-global-secure-access
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
last-reviewed: 2026-11-17
---
# Building Global Secure Access {.unnumbered}

*A developer workbook for the Global Secure Access implementation guide*

::: {.callout-important appearance="default"}
## Status: draft, waiting for review
All nine chapters are written and waiting for the owner's review. Every external claim carries a note and a read date against Microsoft Learn or a workbook page, and each chapter keeps its verification log in the repository. The code is illustrative: its 70 tests pass against a fictional tenant's fixtures, but it has not been run against a live tenant, and no Lab 2 has been run by the authors. Chapter 09, the deployment runbook, hasn't been run against a live tenant.
:::

The [Global Secure Access implementation guide](../../../books/guides/global-secure-access-implementation.md) deploys Microsoft's security service edge in twelve steps, in a run order that puts the logs before anything is enforced and nothing before its path exists. The guide holds Learn's commands, the authority labels, the RACI, the metrics and the requirements; the design is [Book 09, Chapter 05](../../../books/b09-network/05-sd-wan-sase-and-governed-transport.md#microsofts-security-service-edge-global-secure-access). Those tell an operator what to configure and how to prove it. They don't give anyone the software that reads the tenant, checks it against each step, keeps the changes as reviewed files a second person approves, and hands the ISSO evidence an assessor can re-hash.

This workbook is that software, in the repository's [`examples/global-secure-access`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/global-secure-access) folder. Each chapter begins with Microsoft Learn's own procedure or request, says what it leaves to the agency, and builds only that, with tests. Each has a lab that runs on a laptop against one fictional tenant, `contoso.example`, seen during its pilot and two weeks later, then a short step in a test tenant with a way to back it out. Each lists the Graph facts the code depends on (endpoint, least-privileged permission, GCC availability, release stage), footnoted to Microsoft Learn with the date the page was read, the requirements and KSIs its output supports, the dangers and a checklist.

**GCC.** The target is Microsoft 365 GCC (Moderate), which uses the worldwide endpoints `graph.microsoft.com`, `login.microsoftonline.com` and `management.azure.com`.[^gsawi-deployments] Learn states that Global Secure Access is available in GCC for the product as a whole; a preview feature's GCC availability is *not yet specified*.[^gsawi-limits] The kit carries the guide's availability table and fails a decision that relies on such a feature without an approved exception, naming the guide's interim path instead (Chapter 01). Most of the network access API is beta: Learn says beta APIs "are subject to change" and aren't supported in production applications, so the kit runs it interactively, signed in as a person, never on a schedule.[^gsawi-beta]

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| Start with Microsoft's documentation | What Learn gives you, and what it leaves to you, as a table of gaps pinned by tests |
| The code | The checks or scripts the chapter adds, and the tests |
| Lab 1: fixtures, no tenant | Exact commands on the fictional tenant, with the kit's real output |
| Lab 2: a test tenant | Exact commands in a test tenant, with a back-out step; not run by the authors |
| Verified facts | Endpoints, least-privileged permissions, GCC availability and release stage, each footnoted |
| Federal requirements and evidence | What each output proves, the SP 800-53 controls it supports and the KSIs it aligns to |
| Dangers and checklist | What breaks in production, the guard for it, and what a reviewer checks |

*Design guidance* in this workbook is the program's position, not a vendor statement.

## Chapters

Two chapters for each module of the learning path, in the guide's run order, and the runbook.

| # | Chapter | Guide steps | What you build | Status |
|---|---|---|---|---|
| 01 | [Decision, licensing and GCC availability](01-decision-licensing-and-gcc-availability.md) | 1 | The call list, the availability table with interim paths, and checks GSA-DEC-01 to -09 on each function's decision record | Written |
| 02 | [The configuration export and logs first](02-configuration-export-and-logs-first.md) | 2, 12.1 | One read-only collection with a hashed manifest that later chapters refuse to read if it changed; the architecture record and the network diagnostic setting checked before any pilot | Written |
| 03 | [The client and its coverage](03-the-client-and-its-coverage.md) | 3 | A device script for the guide's Validate values; coverage against Intune's count; version, IPv4, DNS over HTTPS, health and hardening from ring 2 | Written |
| 04 | [Microsoft traffic and change plans](04-microsoft-traffic-and-change-plans.md) | 4 | The profile, signaling and the sign-in share; the plan every change goes through, applied only with its approved SHA-256 | Written |
| 05 | [The compliant network and tenant restrictions](05-compliant-network-and-tenant-restrictions.md) | 7, 8 | The compliant network policy, ready to enforce only after a clean report-only period and `-AllowEnforce`; TRv2 default, registered partners and tagging | Written |
| 06 | [Private applications and administrative paths](06-private-apps-and-admin-paths.md) | 6, 10 | Connector resilience; narrow, non-overlapping segments; group assignments; per-app policies; phishing-resistant RDP and SSH; Quick Access to zero | Written |
| 07 | [Internet Access, QUIC and TLS inspection](07-internet-access-and-tls-inspection.md) | 5, 9 | Security profiles and categories; governed bypasses; QUIC by the interim path; the inspection certificate, CA, privacy scope and failure share | Written |
| 08 | [Rings, metrics and the evidence package](08-rings-metrics-and-evidence.md) | 11, 12 | Telemetry freshness and CISA telemetry; the guide's eight metrics; the ring exit and Go or No-go; the rollback plan; hashed, chained evidence | Written |
| 09 | [Deploying to test and production](09-deploying-to-test-and-production.md) | 11 | The runbook: settings per environment, preflight PF-01 to -06, staged enable, smoke test, rollback, go/no-go, production by ring | Written; not run against a live tenant |

## Reading paths

- **Developers new to the project:** the guide's [How to read this guide](../../../books/guides/global-secure-access-implementation.md#how-to-read) and [GCC table](../../../books/guides/global-secure-access-implementation.md#availability), then Chapter 01.
- **The platform owner:** Chapters 02, 04 and 06, then Chapter 09.
- **The policy owner:** Chapter 01's decision records, Chapter 05's enforcement gate and Chapter 07's bypasses and privacy scope.
- **ISSOs and reviewers of the code:** each chapter's requirements table and checklist, and Chapter 08's evidence.
- **Learners:** the [learning path](../../../training/global-secure-access/index.md), whose six modules each link two chapters' Lab 1 and run the guide's Lab 2.

## Where this workbook sits

This is one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook, the fourth piece of the [Global Secure Access implementation guide](../../../books/guides/global-secure-access-implementation.md#how-to-read) beside its narrated deck and [learning path](../../../training/global-secure-access/index.md). It links instead of rebuilding: the emergency access accounts and the privileged groups behind the administrative apps are [*Building Privileged Access*](../privileged-access/index.md)'s; the closure register that turns a Zero Trust Assessment's network findings into register entries is the [Zero Trust Assessment results kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/zta-results)'s, whose `network-access` family points at the guide; and scheduled drift comparison is the [drift pipeline](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/drift-pipeline)'s. The code downloads as one zip, [global-secure-access-code.zip](../../../../downloads/global-secure-access-code.zip), from the [Downloads](../../../downloads.md) page, and the [Labs](../../../training/labs.md#gsa) page lists every lab.

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This workbook has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/project-plans/developer-workbooks/global-secure-access).

<!-- revisions:end -->

[^gsawi-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (read for the program's other workbooks; carried).
[^gsawi-limits]: Microsoft Learn, "Known limitations for Global Secure Access," Global Secure Access in Government Cloud, <https://learn.microsoft.com/entra/global-secure-access/reference-current-known-limitations> (read November 11, 2026, for the guide).
[^gsawi-beta]: Microsoft Learn, the beta notice on each Microsoft Graph beta page, for example "List forwardingProfiles," <https://learn.microsoft.com/graph/api/networkaccess-networkaccessroot-list-forwardingprofiles?view=graph-rest-beta> (accessed November 17, 2026).
