---
title: "Learning path: Azure Security Engineering"
subtitle: "Five modules: the baseline and the exposure register, DDoS protection and the WAF, the edge and the egress, Private Link, DNS and Key Vault, and policy, drift and evidence, each with a lab of the guide's checks in your own test subscription"
description: "A learning path in five modules for platform owners, operators, security monitors, policy owners and ISSO reviewers, built from the Azure Security Engineering implementation guide: how the guide divides the work with the landing-zone books, the security baseline in audit at the intermediate root and the Resource Graph inventory of every public exposure; DDoS protection on every public IP and the web application firewall from detection to prevention; an origin nothing can reach around Front Door or Application Gateway, and egress through Azure Firewall with threat intelligence and IDPS denying; private endpoints that resolve through central DNS zones, and vaults behind RBAC with purge protection and an audit log; and the security initiative, exemptions that expire, the operating model, the metrics and the evidence. GCC Moderate with commercial Azure first, Azure Government as side notes, and the AWS, Google Cloud and Oracle Cloud Infrastructure equivalents. Each module's lab runs the guide's Validate checks in a test subscription; each ends with a knowledge check."
doc-type: training-path
research-status: draft
research-type: training module
research-book: "Book 10"
series-order: 0
listing:
  - id: azs-modules
    contents:
      - "[0-9][0-9]-*.md"
    type: table
    fields: [title, description]
    sort: "series-order asc"
    sort-ui: false
    filter-ui: false
review-status: pending
last-reviewed: 2026-11-13
---
# Learning path: Azure Security Engineering {.unnumbered}

A landing zone decides what can be deployed; it doesn't decide what the internet can reach, what leaves, or who can read a key. Those are engineered one service at a time, and each one has to be proved. This learning path teaches you to engineer and prove them in an agency's Azure estate. You work through the ten steps of [Azure Security Engineering](../../books/guides/azure-security-implementation.md) in five modules, and in each you run the guide's own checks in a test subscription.

**Watch first.** The guide's narrated deck, about 16 minutes, covers the ten steps in one sitting, and each module names the slides that cover it. Its video is being exported; until it is on the [Presentations](../../presentations/index.md) page, read the narration in the [script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-azure-security/Guide_Azure_Security_Narration_Script.md).

Like a [Microsoft Learn learning path](https://learn.microsoft.com/training/), it is a short series of modules, each built on the one before. The modules don't repeat the guide or [Book 10](../../books/b10-cloud-boundary/index.md). They tell you what to read, in what order, what to run, and what to check you understood.

## Who this path is for

| Role | What you get from the path |
|---|---|
| Platform owner | The baseline, the exposure register, the DDoS plan, the firewall policy, the private DNS zones, remediation, and the recurring reviews |
| Operator | The guide's commands and checks for each service, and how to back out what the failover test changes |
| Application owner | The WAF's tuning and prevention switch, the origin lock-down and failover, and the vault your workload reads |
| Security monitor | The DDoS alert and runbook, the WAF and firewall logs, and the audit log's allowed and denied reads |
| Policy owner and ISSO reviewer | The initiative, exemptions that expire, the monthly export, the metrics, the requirements and KSIs each step supports, and the evidence you keep |

**Level:** intermediate. **Products:** Azure Resource Graph, Azure Policy, Azure DDoS Protection, Azure Web Application Firewall, Azure Front Door, Azure Application Gateway, Azure Firewall, Azure Private Link and private DNS, Azure Key Vault, Microsoft Defender for Cloud and Azure Monitor, through Azure CLI and Az PowerShell. **Scope:** a civilian agency at FedRAMP Moderate whose Microsoft 365 GCC tenant pairs with commercial Azure; Azure Government appears as side notes. Each module that compares clouds names the AWS, Google Cloud and Oracle Cloud Infrastructure equivalents from the guide.

## Prerequisites

- [Book 10, Chapter 05](../../books/b10-cloud-boundary/05-the-landing-zone.md): the landing zone this guide builds on. Module 1 reads it with you.
- The guide's [prerequisites](../../books/guides/azure-security-implementation.md#prerequisites): the roles, eligible through PIM, and Azure CLI with the `resource-graph` and `azure-firewall` extensions, and the Az PowerShell module.
- For the labs: a test tenant and test subscription, never production, where the guide's steps have been applied to a pilot management group, a test application and a pilot spoke, as each lab lists; and a Windows machine with PowerShell 7.

## What you'll be able to do

When you finish the path, you'll be able to:

- say which parts of Azure security the books design and which the guide engineers, and what differs in Azure Government and on other clouds;
- assign the security baseline in audit and build the exposure register with an owner on every row;
- prove every public IP is under DDoS protection with logs and an alert, and every HTTP endpoint behind a WAF in prevention mode;
- prove an origin refuses requests that go around the edge, and that workload egress goes through a firewall that denies;
- prove a PaaS resource resolves privately and refuses requests from outside, and that a vault allows its managed identity and refuses everyone else;
- hold all of it with policy and expiring exemptions, and hand an assessor the evidence and metrics.

## Modules

Work through them in order.

| # | Module | Guide steps | Lab | Time |
|---|---|---|---|---|
| 1 | [The baseline and the exposure register](01-the-baseline-and-the-exposure-register.md) | 1 and 2 | Lab 2 | 50 min, plus the lab |
| 2 | [DDoS protection and the web application firewall](02-ddos-protection-and-the-waf.md) | 3 and 4 | Lab 2 | 50 min, plus the lab |
| 3 | [The edge and the egress](03-the-edge-and-the-egress.md) | 5 and 6 | Lab 2 | 55 min, plus the lab |
| 4 | [Private Link, DNS and Key Vault](04-private-link-dns-and-key-vault.md) | 7 and 8 | Lab 2 | 50 min, plus the lab |
| 5 | [Policy, drift and evidence](05-policy-drift-and-evidence.md) | 9 and 10 | Lab 2 | 50 min, plus the lab |

: The modules of the Azure Security Engineering learning path {.striped .hover}

**Total time:** about 4 hours 15 minutes of reading, plus the labs, which depend on how much of the guide has been applied in your test subscription.

**Labs.** The guide has no kit and no developer workbook yet, so there is no Lab 1 on fixtures: each module's lab is a **Lab 2** that runs the guide's own **Validate** checks, and its read-only commands, in a test subscription, every step a copy-paste command block. The expected results are the ones the guide's Validate steps state; the authors haven't run the labs, and no lab shows captured output. Only Module 3's failover test writes, and its next step undoes it. The developer workbook, with Lab 1 on fixtures and Lab 2 in a test subscription, is planned. [The Labs page](../labs.md#azs) lists every lab in the path.

::: {#azs-modules}
:::
