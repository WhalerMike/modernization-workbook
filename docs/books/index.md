---
title: "The Workbook Books"
subtitle: "The workbook's documents organized into nineteen topic books, each framed Why / What / Who / How, and a code-first developer workbook"
description: "The Federal Modernization Workbook organized as nineteen topic books. Each book consolidates the workbook's pages on one topic into an ordered, footnoted reading sequence with a Word edition and a 15-minute presentation."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: books
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# The Workbook Books {.unnumbered}

The workbook grew as separate whitepapers, guides, series and case studies. The books reorganize that material by topic. Each book opens with one question (its **Why**), then covers **What** changes, **Who** owns it, and **How** to do it. Every external claim is checked against a primary source and endnoted, diagrams follow one house style, and each book has a Word edition and a 15-minute narrated presentation. This site publishes only the books. When a book is built, the pages it replaces move to the repository's `archive/` folder and their old addresses forward to the new chapters. All nineteen topic books are now published; the archived sources stay in the [repository](https://github.com/WhalerMike/modernization-workbook). Book 19, [Building the Attribute-Driven Migration](b19-developer-workbook/index.md), is different: it is a developer workbook, a code-first companion to the Attribute-Driven Migration for the developers who build its middleware, checks and pipelines, held for review page by page. The developer workbooks for other projects are under [Projects](../project-plans/developer-workbooks/index.md). Each book's deck is on the [Presentations](../presentations/index.md) page.

::: {.fmw-books-table}
| Book | Topic | Opening question | Status | Chapters | Pages | Last updated |
|---|---|---|---|---:|---:|---|
| **B00** | **[Orientation & Program](b00-orientation/index.md)** | **Why modernize, and why now?** | **Draft** | 10 + 3 app. | 215 | 2026-10-31 |
| **B01** | **[The Transformation Arc: Client-Server to Hybrid Cloud](b01-transformation-arc/index.md)** | **Why is modernization so hard?** | **Draft** | 12 + 2 app. | 170 | 2026-10-31 |
| **B02** | **[Identity & Directory: AD to Entra ID](b02-identity/index.md)** | **Why does identity matter?** | **Draft** | 11 + 3 app. | 345 | 2026-10-31 |
| **B03** | **[HR-Driven Identity & Lifecycle](b03-hr-identity/index.md)** | **Why should HR, not IT, decide who exists?** | **Draft** | 13 + 3 app. | 185 | 2026-10-31 |
| **B04** | **[Access & Privilege](b04-access/index.md)** | **Why is every access decision a policy decision?** | **Draft** | 10 + 2 app. | 280 | 2026-10-31 |
| **B05** | **[Devices & Endpoints: GPO to Intune and Arc](b05-devices/index.md)** | **Why can't Group Policy come to the cloud?** | **Draft** | 10 + 1 app. | 275 | 2026-10-31 |
| **B06** | **[Data Platform: SQL Server Identity](b06-data-platform/index.md)** | **Why is the database where legacy authentication hides?** | **Draft** | 33 + 3 app. | 275 | 2026-10-31 |
| **B07** | **[PKI & Certificates](b07-pki/index.md)** | **Why do certificates outlive every migration?** | **Draft** | 8 + 3 app. | 180 | 2026-10-31 |
| **B08** | **[DNS, DHCP & IPAM](b08-ddi/index.md)** | **Why is DNS now the control plane?** | **Draft** | 12 + 3 app. | 190 | 2026-10-31 |
| **B09** | **[Network & Transport](b09-network/index.md)** | **Why does physics decide the architecture?** | **Draft** | 13 + 3 app. | 295 | 2026-10-31 |
| **B10** | **[Cloud Boundary & Landing Zone](b10-cloud-boundary/index.md)** | **Why does the authorization boundary decide what you can use?** | **Draft** | 11 + 2 app. | 185 | 2026-10-31 |
| **B11** | **[Zero Trust & Assessment](b11-zero-trust/index.md)** | **Why is Zero Trust a whole-agency property, not a product?** | **Draft** | 10 + 1 app. | 150 | 2026-10-31 |
| **B12** | **[Security Operations & Telemetry](b12-security-operations/index.md)** | **Why can't you defend what you can't see?** | **Draft** | 12 + 1 app. | 275 | 2026-10-31 |
| **B13** | **[Governance, Drift & Evidence](b13-governance/index.md)** | **Why does compliance decay the day after the audit?** | **Draft** | 12 + 2 app. | 225 | 2026-10-31 |
| **B14** | **[Federal Compliance & Authorization](b14-compliance/index.md)** | **Why does every control need proof, not a promise?** | **Draft** | 12 + 2 app. | 330 | 2026-10-31 |
| **B15** | **[Compliance Automation & Day-2 Operations](b15-day2-operations/index.md)** | **Why does modernization succeed or fail at the help desk?** | **Draft** | 13 + 1 app. | 275 | 2026-10-31 |
| **B16** | **[People: Training & Education](b16-people/index.md)** | **Why do people, not tools, close the gap?** | **Draft** | 10 + 1 app. | 185 | 2026-10-31 |
| **B17** | **[AI Identity Governance](b17-ai-identity/index.md)** | **Why do AI agents need identities and owners?** | **Draft** | 10 + 1 app. | 210 | 2026-10-31 |
| **B18** | **[Application Modernization](b18-application-modernization/index.md)** | **Why is application modernization a portfolio decision, not a rewrite?** | **Draft** | 10 | 135 | 2026-10-31 |
| **B19** | **[Building the Attribute-Driven Migration](b19-developer-workbook/index.md)** | **Why does the migration need code with tests, not only runbooks?** | **Draft** | 9 | 145 | 2026-10-30 |
:::

**Chapters** counts each book's chapters and appendices. **Pages** is the estimated page count of its Word edition, worked out from its words, tables and diagrams and checked against Word's own count (within about 7%). **Last updated** is the date of the book's latest change. All three are recalculated on every site build.

## Companion guides

Guides that support the books but belong to none of them: short practice guides, and cross-book reference guides that follow one piece of work through several books and link to the chapters that carry the detail.

| Guide | What it covers |
|---|---|
| [Effective Meetings — Purpose, Agenda, Roles, and Follow-Through](guides/effective-meetings.md) | Running program meetings: a real agenda, named roles, a parking lot, and written action items with owners and dates. Includes agenda and notes templates and a one-page checklist. |
| [Attribute-Driven Migration from Active Directory to Microsoft Entra ID](guides/attribute-driven-migration.md) | Cross-book reference: one migration run on attributes instead of OU placement, in nine stages from sourcing the attributes (with Federal HR 2.0) to drift correction, plus what Microsoft documents for devices, Azure Arc servers, service principals and PIV/CAC certificate binding. Links Books 01–07; [Word edition](../../downloads/attribute-driven-migration-guide.docx). |
| [Attribute-Driven Migration: An Implementation Guide](guides/attribute-driven-migration-implementation.md) | Cross-track implementation guide for the attribute foundation the four tracks share, in the order of the two technical deep-dive decks: ten gates from reading the OU tree through the schema and coded slots, proving the attributes, sync, the dynamic group library and administrative units, personas and targeting conventions, PIV binding and the mover proof, to cut-over, retiring the OU tree and drift. Each gate names the validation kit check that proves it and hands each track's own work to its guide. Its developer companion is [Book 19](b19-developer-workbook/index.md); [Word edition](../../downloads/attribute-driven-migration-implementation-guide.docx). |
| [Intune Track Implementation: Attribute-Driven Management of End-User Devices](guides/intune-track-implementation.md) | Cross-book implementation guide for the Intune track: seven gates from prerequisites and the coverage matrix through Autopilot group tags and one writer for device extension attributes, the targeting design, the computer half of Group Policy, cut-over waves with rollback, and stale-device cleanup, drift and evidence. Every gate names the validation kit checks that prove it. Links Book 05; [Word edition](../../downloads/intune-track-implementation-guide.docx). |
| [Azure Arc Track: Implementation Guide](guides/arc-track-implementation.md) | Cross-book implementation guide for the Arc track: servers on premises and in other clouds under Azure Resource Manager, in eight gated steps from the cloud choice and coverage matrix through the tag taxonomy, onboarding in waves, Azure Policy and machine configuration, Update Manager, access and the dangers, to operating the estate with its evidence. Links Books 05 and 06; [Word edition](../../downloads/arc-track-implementation-guide.docx). |
| [Non-Person Identity: An Implementation Guide](guides/non-person-identity-implementation.md) | Cross-book implementation guide for the non-person identity track: inventory service accounts and workload identities with an owner and sponsor for each, decide each one's target, set the credential rules, cut privilege, convert with a parallel run and run the lifecycle, with SQL Server principals, AI agents and the evidence. Pairs with the [Non-Person Identity Modernization plan](../project-plans/non-person-identity.md). Links Books 02, 04, 06 and 17; [Word edition](../../downloads/non-person-identity-implementation-guide.docx). |
| [Ansible for Configuration Automation](guides/ansible-configuration-automation.md) | Cross-book implementation guide: where Ansible fits beside Intune, Azure Arc, Azure Policy machine configuration and Configuration Manager, with one owning tool per setting; Arc onboarding at scale, Linux and Unix, network gear, VMware, Infoblox and cloud VMs as the tier-2 tool; Ansible Automation Platform in a federal setting; evidence for CM-2, CM-3, CM-6, CM-8 and AU; the dangers; and a phased adoption path. Links Books 05, 08, 12 and 15; [example playbooks](../../downloads/ansible-examples.zip). |
| [Building Book 03's HR Pipeline: Oracle Fusion Cloud HCM to Microsoft Entra ID](guides/hcm-entra-implementation.md) | *In review.* Implementation guide for Book 03's pipeline on named products: reading Core HCM through HCM Extracts and Atom feeds, the middleware's five duties, the `/bulkUpload` contract, the two landing zones, Lifecycle Workflows and the evidence the pipeline has to leave. |
| [HR-Driven Identity: An Implementation Guide](guides/hr-driven-identity-implementation.md) | *Draft.* Implementation guide for Book 03's lifecycle once the pipeline exists: seven gates from one writer per account state through employee and contractor sources, day-one joiners, access packages assigned from HR attributes with residual-access reviews, PIV and CAC binding tied to HR events, separation timing, and drift and evidence. Each gate carries its federal requirements and ISSO evidence, GCC and GCC High availability, an interim path and its validation kit check. |
| [Certificate Lifecycle on CyberArk Certificate Manager](guides/cyberark-certificate-lifecycle.md) | *In review.* Implementation guide for Book 07's certificate lifecycle on CyberArk Certificate Manager, Self-Hosted, from the platform build to the six migration waves. |
| [Implementing Book 08 on Infoblox NIOS](guides/infoblox-nios-implementation.md) | *In review.* Implementation guide for Book 08's DDI design on Infoblox NIOS 9.1, from the Grid build to migrating off Microsoft DNS and DHCP, signing, hardening and operating it. |
| [Building Book 09's SD-WAN Design on Cisco Catalyst SD-WAN](guides/cisco-sdwan-implementation.md) | *In review.* Implementation guide for Book 09's governed branch transport: the ED 26-03 gate, the hosted-or-on-premises decision, the 12-hub fabric, hardening, TIC 3.0 and Microsoft 365 paths, and the evidence the fabric has to emit. |
| [Ticket-to-Machine on ServiceNow and SailPoint: An Example](guides/ttm-servicenow-sailpoint.md) | *In review.* The vendor-neutral loop of Book 13 Appendix B, with its lanes and identity fixes, worked through on ServiceNow and SailPoint Identity Security Cloud. |
| [Integrating ServiceNow and SailPoint: An Implementation Example (Pass 1)](guides/snow-sailpoint-integration-kit.md) | *Draft.* Three identity builds behind the Ticket-to-Machine example: drift events become typed findings, findings close only on a re-read, and a read-only reconciliation measures Book 03's drift classes. |

Guides marked *Draft* or *In review* work like how-to guides on Microsoft Learn: each builds one book's design on a named product, and keeps its status label until it is reviewed and proved ([Status labels](../about/sources-and-verification.md#status-labels)).

## Explainers

[Explainers](explainers/index.md) set out one concept in plain language, like a concept article on Microsoft Learn, and link to the chapters that rely on it.
