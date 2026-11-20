---
title: "Building Azure Security"
subtitle: "A developer workbook for the Azure Security Engineering implementation guide"
description: "A developer workbook for Azure Security Engineering: a code-first companion for the developers who build the read-only checks behind the guide's ten steps. Each chapter starts from the guide's Microsoft Learn commands and queries, builds tested code in the repository's examples folder (Azure Resource Graph and Resource Manager reads, findings, plans that are never run, drift, metrics and hashed evidence), runs a lab against a fictional estate with no subscription, then the same check in a test subscription, and lists the verified facts, the federal requirements and KSIs, the dangers and a checklist. The last chapter is the runbook from a test subscription to production."
doc-type: section-landing
fmw-eyebrow: "Projects · Developer workbook"
audience: [Technical]
family: dw-azure-security
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
reviewed-sha256: 448c18f8e7cd23b4c71abd348d0a7087f26b94c06a86287f454a48cecc28ca16
last-reviewed: 2026-11-20
---
# Building Azure Security {.unnumbered}

*A developer workbook for the Azure Security Engineering implementation guide*

::: {.callout-important appearance="default"}
## Status: approved
All nine chapters are written and approved. An approved page that changes goes back on the weekly source watch issue's list for review. The kit's tests pass against a fictional estate; nothing here has been run against a live subscription, and every Lab 2 and the runbook say so. Every external claim carries a note and a read date against Microsoft Learn or the guide, and each chapter keeps its verification log in the repository. Every chapter has a narrated tour, listed under *Narrated chapter tours* below, and the story deck *One Portal, End to End* is listed under *Reading paths*.
:::

[Azure Security Engineering](../../../books/guides/azure-security-implementation.md) tells an operator how to engineer the security of an agency's Azure estate in ten gated steps: the landing-zone baseline, the public exposure inventory, DDoS protection, the web application firewall, Front Door and Application Gateway, Azure Firewall and segmentation, Private Link and DNS, managed identities and Key Vault, Azure Policy and drift, and operations and evidence. Each step ends with a **Validate** check and an evidence checklist. What the guide doesn't give is the software that runs those checks every week across every subscription, keeps the register, notices what changed, and hands the ISSO evidence a reviewer can check.

This workbook is for the developers who build that software. It is code first. Each chapter begins with the guide's own commands and Resource Graph queries, which come from Microsoft Learn, says what they leave to you, and builds only that, in [`examples/azure-security`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/azure-security), with tests. Each has a lab that runs on a laptop against a fictional estate with no subscription at all, then the same check in a test subscription with a way to back it out. Each lists the facts the code depends on, footnoted to Microsoft Learn with the date the page was read, the federal requirements and KSIs its output supports, the dangers and a checklist. The last chapter is a runbook: it takes the kit from the labs to a live test subscription, then to production, with the same commands and one settings file per environment.

The target estate is Microsoft 365 GCC (Moderate) with commercial Azure: GCC pairs with commercial Azure, so the subscriptions are commercial and Resource Manager is `management.azure.com`.[^azsi-gov] The kit has that one cloud and no default: its settings file names `AzureCloud`, and a live run refuses an Azure CLI set to any other cloud.

## How each chapter is built

| Section | What it holds |
|---|---|
| Goal and audience | What you will build, and who should read it |
| Start with Microsoft Learn | The guide's Learn commands and queries for the step, what they give you, and what they leave to you, as a table of gaps the kit's tests pin |
| The code | The area of `examples/azure-security` the chapter builds, its rules and the tests |
| Lab 1: fixtures, no subscription | Exact commands against the fictional Contoso estate, with the output they print |
| Lab 2: a test subscription | The same check against a test management group, the guide's own Validate commands beside it, and how to back out |
| Verified facts | The calls, the role each needs, commercial Azure availability and the Learn page, each footnoted |
| Federal requirements and evidence | What each output proves, the requirement it supports, the KSI it aligns to, and who keeps it |
| Dangers | What breaks in production, and the guard the code has for it |
| Checklist | What a reviewer checks before the code ships |

*Design guidance* marks the program's own positions. Every rule the kit reports names its source in [`config/rules.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/azure-security/config/rules.json): a Learn statement, with the guide's footnote key, or design guidance.

## Chapters

The outline follows the guide's steps in order. Steps 1 and 2 come first; the guide lets Steps 3 to 8 run in parallel by workload once the inventory exists, and Step 9 turns them into policy.

| # | Chapter | Guide steps | What you build | Status |
|---|---|---|---|---|
| 01 | [The landing-zone baseline](01-the-landing-zone-baseline.md) | 1 | The kit's spine: one call list of Resource Graph and Resource Manager reads with a role and a Learn page each, fixture and live invokers that refuse another cloud, tenant or host, the run folder with its manifest; then the baseline check: hierarchy settings, the initiatives at the intermediate root, platform logs, Defender for Cloud plans | Draft |
| 02 | [The public exposure register](02-the-public-exposure-register.md) | 2 | The register of every public IP, Front Door profile, application gateway and public PaaS resource with its owner, DDoS state and WAF; new and gone exposures against last week's register; gaps against Defender for Cloud's export | Draft |
| 03 | [DDoS protection](03-ddos-protection.md) | 3 | Each public IP traced to its protection (IP Protection, a protected virtual network, none, a NAT gateway), with its diagnostic logs and its `IfUnderDDoSAttack` alert, and the coverage the guide's metric asks for | Draft |
| 04 | [The web application firewall](04-the-web-application-firewall.md) | 4 | Every WAF policy's mode, body inspection, rule sets and rate limit; a WAF and logs on every internet-facing endpoint; the Prevention switch as a plan the kit never runs | Draft |
| 05 | [Front Door, Application Gateway and the origin](05-front-door-application-gateway-and-the-origin.md) | 5 | Each origin's lock-down read from its configuration (Private Link, or the service tag with this profile's `X-Azure-FDID`), mixed and single-origin groups, TLS on custom domains and gateways, classic profiles | Draft |
| 06 | [Azure Firewall and egress](06-azure-firewall-and-egress.md) | 6 | Threat intelligence and IDPS in Deny, Premium and TLS inspection, firewall logs, each workload subnet's default route to the firewall, and the Draft + Deployment commands as a plan | Draft |
| 07 | [Private Link, DNS and Key Vault](07-private-link-dns-and-key-vault.md) | 7, 8 | Central `privatelink` zones linked to the hub, zone groups, resources still public behind a private endpoint, and every vault on RBAC with purge protection, a closed firewall, a private endpoint and AuditEvent logs | Draft |
| 08 | [Policy, drift and evidence](08-policy-drift-and-evidence.md) | 9, 10 | The security initiative and its exemptions' expiry, two weekly runs compared by fingerprint, the guide's metrics, and every run recorded as chained evidence with its controls and KSIs | Draft |
| 09 | [Deploying to test and production](09-deploying-to-test-and-production.md) | 1 to 10 | A runbook of exact commands: one settings file per environment with no secrets; preflight; Stage 1 in a test subscription with the weekly run, the security initiative planned in `DoNotEnforce` and applied only with its approved hash, a rehearsed rollback; go/no-go on the evidence; Stage 2 in production. Not yet run against a live subscription | Draft |

<!-- tour:begin (generated by the tour build; not part of the reviewed page) -->

## Narrated chapter tours

Every chapter has a narrated tour: a deck in Why, What, Who and How order, a self-running edition with captions, and a video. The tours were recorded on November 19, 2026 from the approved chapters, and a tour is re-recorded when its chapter changes. All of them are also on the [Watch page](../../../presentations/watch.md).

| # | Chapter | Watch | Length | Deck | Narrated deck |
|---|---|---|---|---|---|
| 01 | [The Landing-Zone Baseline](01-the-landing-zone-baseline.md) | [▶ Watch](../../../presentations/watch.html?v=DW_AZS_01_Landing_Zone_Baseline_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_AZS_01_Landing_Zone_Baseline_Narrated.mp4) | 9 min | [DW_AZS_01_Landing_Zone_Baseline.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-01-landing-zone-baseline) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-01-landing-zone-baseline) |
| 02 | [The Public Exposure Register](02-the-public-exposure-register.md) | [▶ Watch](../../../presentations/watch.html?v=DW_AZS_02_Public_Exposure_Register_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_AZS_02_Public_Exposure_Register_Narrated.mp4) | 8 min | [DW_AZS_02_Public_Exposure_Register.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-02-public-exposure-register) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-02-public-exposure-register) |
| 03 | [DDoS Protection](03-ddos-protection.md) | [▶ Watch](../../../presentations/watch.html?v=DW_AZS_03_DDoS_Protection_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_AZS_03_DDoS_Protection_Narrated.mp4) | 9 min | [DW_AZS_03_DDoS_Protection.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-03-ddos-protection) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-03-ddos-protection) |
| 04 | [The Web Application Firewall](04-the-web-application-firewall.md) | [▶ Watch](../../../presentations/watch.html?v=DW_AZS_04_Web_Application_Firewall_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_AZS_04_Web_Application_Firewall_Narrated.mp4) | 8 min | [DW_AZS_04_Web_Application_Firewall.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-04-web-application-firewall) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-04-web-application-firewall) |
| 05 | [Front Door, Application Gateway and the Origin](05-front-door-application-gateway-and-the-origin.md) | [▶ Watch](../../../presentations/watch.html?v=DW_AZS_05_Front_Door_and_the_Origin_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_AZS_05_Front_Door_and_the_Origin_Narrated.mp4) | 9 min | [DW_AZS_05_Front_Door_and_the_Origin.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-05-front-door-and-the-origin) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-05-front-door-and-the-origin) |
| 06 | [Azure Firewall and Egress](06-azure-firewall-and-egress.md) | [▶ Watch](../../../presentations/watch.html?v=DW_AZS_06_Azure_Firewall_and_Egress_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_AZS_06_Azure_Firewall_and_Egress_Narrated.mp4) | 9 min | [DW_AZS_06_Azure_Firewall_and_Egress.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-06-azure-firewall-and-egress) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-06-azure-firewall-and-egress) |
| 07 | [Private Link, DNS and Key Vault](07-private-link-dns-and-key-vault.md) | [▶ Watch](../../../presentations/watch.html?v=DW_AZS_07_Private_Link_DNS_Key_Vault_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_AZS_07_Private_Link_DNS_Key_Vault_Narrated.mp4) | 9 min | [DW_AZS_07_Private_Link_DNS_Key_Vault.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-07-private-link-dns-key-vault) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-07-private-link-dns-key-vault) |
| 08 | [Policy, Drift and Evidence](08-policy-drift-and-evidence.md) | [▶ Watch](../../../presentations/watch.html?v=DW_AZS_08_Policy_Drift_Evidence_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_AZS_08_Policy_Drift_Evidence_Narrated.mp4) | 10 min | [DW_AZS_08_Policy_Drift_Evidence.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-08-policy-drift-evidence) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-08-policy-drift-evidence) |
| 09 | [Deploying to Test and Production](09-deploying-to-test-and-production.md) | [▶ Watch](../../../presentations/watch.html?v=DW_AZS_09_Deploying_Test_Production_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/DW_AZS_09_Deploying_Test_Production_Narrated.mp4) | 10 min | [DW_AZS_09_Deploying_Test_Production.pptx](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-09-deploying-test-production) | [Narrated](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/dw-azs-09-deploying-test-production) |

<!-- tour:end -->

## Reading paths

- **Anyone, first:** the story deck *One Portal, End to End*, about 18 minutes with captions, which follows one fictional Contoso portal, its online subscription and the hub that serves it, from the landing-zone baseline to the deployment runbook, through every chapter, with the kit's own fixtures, a "Try it" command and a one-question check per scene: [▶ Watch](../../../presentations/watch.html?v=AZS_Story_One_Portal_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/AZS_Story_One_Portal_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/azs-story-one-portal) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/azs-story-one-portal/AZS_Story_One_Portal_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/azs-story-one-portal/AZS_Story_One_Portal_Narrated.vtt).
- **Developers new to the kit:** Chapter 01 for the call list, the invokers and the run folder, then Chapter 02.
- **Platform engineers:** Chapters 03, 06 and 07, the hub's controls.
- **Application owners and their developers:** Chapters 04 and 05, the edge in front of an application.
- **ISSOs and reviewers of the code:** each chapter's "Federal requirements and evidence" table and checklist, then Chapter 08.
- **Operators deploying the kit:** Chapter 09, after Lab 2 of Chapters 01 to 08.
- **Operators and ISSOs running the steps:** the [implementation guide](../../../books/guides/azure-security-implementation.md), whose Validate checks the labs run beside the kit.
- **Learners:** the [Azure Security Engineering learning path](../../../training/azure-security/index.md), five modules, each with a Lab 1 from these chapters and a Lab 2 in a test subscription.

## Where this workbook sits

This is one of the [developer workbooks](../index.md) under Projects in the Federal Modernization Workbook. The landing zone it reads is [Book 10's](../../../books/b10-cloud-boundary/05-the-landing-zone.md); the posture tool and the evidence contract are [Book 12, Chapter 08's](../../../books/b12-security-operations/08-cloud-native-posture.md); the closure chain that findings from a Zero Trust assessment enter is [Book 11, Chapter 10's](../../../books/b11-zero-trust/10-evidence-not-verdicts.md), and the [Zero Trust Assessment results kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/zta-results) files this kit's findings under its *DDoS, WAF and public exposure* family. PIM for the Azure roles this work needs is [*Building Privileged Access*, Chapter 06](../privileged-access/06-pim-for-azure-resources.md).

## Chapters

::: {#chapters}
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This workbook has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/project-plans/developer-workbooks/azure-security).

<!-- revisions:end -->

[^azsi-gov]: Azure Security Engineering, "Availability in commercial Azure" (Microsoft 365 GCC pairs with commercial Azure; Resource Manager at `management.azure.com`), [the guide](../../../books/guides/azure-security-implementation.md#gov-availability), with its Learn sources read November 11, 2026.
