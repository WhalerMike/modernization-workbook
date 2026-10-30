---
title: "Downloads"
subtitle: "Every file the workbook publishes: the four kits, the Ansible examples, a reference implementation, the nineteen books as Word documents, and the narrated videos"
description: "One place for every Federal Modernization Workbook download: the read-only Start Kit assessment scripts, the read-only validation kit for the track implementation guides, the Copilot agent pack for in-house automation, the Help Desk / Cloud Services Entra ID Operations Kit, the Ansible example playbooks, the application modernization reference implementation, each book as a Word document, and the narrated presentation videos."
doc-type: section-landing
---

# Downloads {.unnumbered}

Everything here is free to download. The kits and the Word editions are rebuilt from the same sources as the site, so a download always matches the page you read.

## Kits

| Kit | What's in it | Download |
|---|---|---|
| **Start Kit** — read-only estate assessment | PowerShell scripts that count the forest, the SQL Server estate, and RADIUS and NPS, with a one-page summary traced to its sources. Read-only by policy; unit-tested against fixtures, not proven against a live estate. Every script also comes as a `.txt` copy for Copilot and mail systems that block `.ps1` files. See [Book 00, Chapter 08](books/b00-orientation/08-pre-flight-and-assessment.md). | [start-kit.zip](../downloads/start-kit.zip), rebuilt on every site deploy from [`examples/start-kit`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit) |
| **Validation kit** — read-only checks for the track implementation guides | PowerShell checks for the **Validate** steps in the [Attribute-Driven Migration](books/guides/attribute-driven-migration-implementation.md), [Intune](books/guides/intune-track-implementation.md), [Azure Arc](books/guides/arc-track-implementation.md) and [non-person identity](books/guides/non-person-identity-implementation.md) implementation guides, plus the HR and dynamic-group checks from the [Attribute-Driven Migration guide](books/guides/attribute-driven-migration.md). They read Microsoft Graph, Azure Resource Graph and, optionally, Active Directory, and each returns a status with its evidence. Illustrative, fixture-tested, read-only; 39 checks. Not proven against a live tenant: run each check first in a test tenant. Every script also comes as a `.txt` copy for mail systems that block `.ps1` files. | [validation-kit.zip](../downloads/validation-kit.zip), rebuilt on every site deploy from [`examples/validation-kit`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit) |
| **Copilot agent pack** — Day-Two Automation Builder | Instructions, starter prompts and optional knowledge files that set up Microsoft 365 Copilot as a drafting and review assistant for in-house day-two automation, with a 17-test acceptance test to run before anyone relies on it. The agent drafts; people review, test and approve. Checked against Microsoft's Agent Builder limits, not yet built in a live tenant. See [Book 15, Chapter 13](books/b15-day2-operations/13-building-day-two-automation-in-house.md#when-the-approved-assistant-is-microsoft-365-copilot). | [copilot-agent-pack.zip](../downloads/copilot-agent-pack.zip), rebuilt on every site deploy from [`examples/copilot-agent-pack`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/copilot-agent-pack) |
| **Help Desk / Cloud Services Entra ID Operations Kit v1.6.2** | Five Word documents (intake and routing flow, administrative responsibilities, application access governance, governance structure brief, and the implementation path and run guide for the scripts), the routing matrix as a PowerShell module, the scripts with plain-text copies for mail systems that block `.ps1` files, and Pester tests that need no tenant. Its read-only app inventory also flags apps consented to act as every user, the Entra ID counterpart of the Start Kit's unconstrained-delegation check. Applies the help-desk model in [Book 15](books/b15-day2-operations/index.md). Not tenant-tested: run every change script with `-WhatIf` first. | [helpdesk-entra-operations-kit.zip](https://github.com/WhalerMike/modernization-workbook/releases/download/helpdesk-entra-kit-v1.6.2/helpdesk-entra-operations-kit.zip) · [release notes](https://github.com/WhalerMike/modernization-workbook/releases/tag/helpdesk-entra-kit-v1.6.2)<br>SHA-256 `5d00dce2008ba01d73cbe15c782153d7d0c8c786ce6c81ccd474220035181676` |
| **Ansible examples** — CMDB-driven inventory, assessment, Arc onboarding and drift | A dynamic inventory that reads a CMDB export and groups hosts by coverage tier, platform and configuration owner, and four small playbooks: the CM-8 inventory feed with Azure Arc agent status, Arc onboarding gated by check mode and an explicit `confirm_change=true`, a Linux baseline drift check pinned to check mode, and read-only Cisco IOS and Infoblox NIOS facts. Clean under `ansible-lint` (production profile) and `yamllint`, with tests that fail on any ungated write; run against a test control node, not proven against a live estate. See the companion guide [Ansible for Configuration Automation](books/guides/ansible-configuration-automation.md). | [ansible-examples.zip](../downloads/ansible-examples.zip), rebuilt on every site deploy from [`examples/ansible`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ansible), with a `.txt` copy of every playbook and script |
| **Application modernization reference implementation** | A Spring Boot REST service over PostgreSQL with its OpenAPI contract, a React front end, a DB2/Oracle to PostgreSQL migration tool that proves the move with row counts, checksums and aggregate reconciliation, and an agentic AI pattern with a provider-neutral interface and a stub model, so no API key is needed. Tests run against a real embedded PostgreSQL engine; docker-compose runs the whole stack. Illustrative, not production code. See [Book 18, Chapter 08](books/b18-application-modernization/08-the-reference-implementation.md). | [app-modernization.zip](../downloads/app-modernization.zip), rebuilt on every site deploy from [`examples/app-modernization`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/app-modernization), with a `.txt` copy of every source file |

## Books as Word documents

Each book downloads as one Word document with its chapters in reading order, its notes and its diagrams. The [books page](books/index.md) lists each book's chapter and page counts.

| Book | Word edition |
|---|---|
| [Book 00 — Orientation & Program](books/b00-orientation/index.md) | [b00-orientation-bundle.docx](../downloads/b00-orientation-bundle.docx) |
| [Book 01 — The Transformation Arc](books/b01-transformation-arc/index.md) | [b01-transformation-arc-bundle.docx](../downloads/b01-transformation-arc-bundle.docx) |
| [Book 02 — Identity & Directory](books/b02-identity/index.md) | [b02-identity-bundle.docx](../downloads/b02-identity-bundle.docx) |
| [Book 03 — HR-Driven Identity](books/b03-hr-identity/index.md) | [b03-hr-identity-bundle.docx](../downloads/b03-hr-identity-bundle.docx) |
| [Book 04 — Access & Privilege](books/b04-access/index.md) | [b04-access-bundle.docx](../downloads/b04-access-bundle.docx) |
| [Book 05 — Devices & Endpoints](books/b05-devices/index.md) | [b05-devices-bundle.docx](../downloads/b05-devices-bundle.docx) |
| [Book 06 — Data Platform: SQL Server Identity](books/b06-data-platform/index.md) | [b06-data-platform-bundle.docx](../downloads/b06-data-platform-bundle.docx) |
| [Book 07 — PKI & Certificates](books/b07-pki/index.md) | [b07-pki-bundle.docx](../downloads/b07-pki-bundle.docx) |
| [Book 08 — DNS, DHCP & IPAM](books/b08-ddi/index.md) | [b08-ddi-bundle.docx](../downloads/b08-ddi-bundle.docx) |
| [Book 09 — Network & Transport](books/b09-network/index.md) | [b09-network-bundle.docx](../downloads/b09-network-bundle.docx) |
| [Book 10 — Cloud Boundary & Landing Zone](books/b10-cloud-boundary/index.md) | [b10-cloud-boundary-bundle.docx](../downloads/b10-cloud-boundary-bundle.docx) |
| [Book 11 — Zero Trust & Assessment](books/b11-zero-trust/index.md) | [b11-zero-trust-bundle.docx](../downloads/b11-zero-trust-bundle.docx) |
| [Book 12 — Security Operations & Telemetry](books/b12-security-operations/index.md) | [b12-security-operations-bundle.docx](../downloads/b12-security-operations-bundle.docx) |
| [Book 13 — Governance, Drift & Evidence](books/b13-governance/index.md) | [b13-governance-bundle.docx](../downloads/b13-governance-bundle.docx) |
| [Book 14 — Federal Compliance & Authorization](books/b14-compliance/index.md) | [b14-compliance-bundle.docx](../downloads/b14-compliance-bundle.docx) |
| [Book 15 — Compliance Automation & Day-2 Operations](books/b15-day2-operations/index.md) | [b15-day2-operations-bundle.docx](../downloads/b15-day2-operations-bundle.docx) |
| [Book 16 — People: Training & Education](books/b16-people/index.md) | [b16-people-bundle.docx](../downloads/b16-people-bundle.docx) |
| [Book 17 — AI Identity Governance](books/b17-ai-identity/index.md) | [b17-ai-identity-bundle.docx](../downloads/b17-ai-identity-bundle.docx) |
| [Book 18 — Application Modernization](books/b18-application-modernization/index.md) | [b18-application-modernization-bundle.docx](../downloads/b18-application-modernization-bundle.docx) |

## Companion guides as Word documents

| Guide | Word edition |
|---|---|
| [Attribute-Driven Migration from Active Directory to Microsoft Entra ID](books/guides/attribute-driven-migration.md) | [attribute-driven-migration-guide.docx](../downloads/attribute-driven-migration-guide.docx) |
| [Attribute-Driven Migration: An Implementation Guide](books/guides/attribute-driven-migration-implementation.md) | [attribute-driven-migration-implementation-guide.docx](../downloads/attribute-driven-migration-implementation-guide.docx) |
| [Intune Track Implementation: Attribute-Driven Management of End-User Devices](books/guides/intune-track-implementation.md) | [intune-track-implementation-guide.docx](../downloads/intune-track-implementation-guide.docx) |
| [Azure Arc Track: Implementation Guide](books/guides/arc-track-implementation.md) | [arc-track-implementation-guide.docx](../downloads/arc-track-implementation-guide.docx) |
| [Non-Person Identity: An Implementation Guide](books/guides/non-person-identity-implementation.md) | [non-person-identity-implementation-guide.docx](../downloads/non-person-identity-implementation-guide.docx) |

## Developer workbooks as Word documents

Draft, held for review page by page; see [Developer Workbooks](project-plans/developer-workbooks/index.md).

| Developer workbook | Word edition |
|---|---|
| [Building the Attribute-Driven Migration](project-plans/developer-workbooks/attribute-driven-migration/index.md) | [building-the-attribute-driven-migration-bundle.docx](../downloads/building-the-attribute-driven-migration-bundle.docx) |
| [Building Privileged Access](project-plans/developer-workbooks/privileged-access/index.md) | [building-privileged-access-bundle.docx](../downloads/building-privileged-access-bundle.docx) |

## Videos and presentations

- **Narrated presentation videos:** watch them on the [Videos](presentations/watch.md) page, or download the MP4s from the [October 23, 2026 video release](https://github.com/WhalerMike/modernization-workbook/releases/tag/videos-2026-10-23).
- **HR-driven identity interview videos:** the [October 20, 2026 release](https://github.com/WhalerMike/modernization-workbook/releases/tag/hr-identity-interview-2026-10-20).
- **Decks** (PowerPoint, with and without narration), scripts and captions: the [Presentations](presentations/index.md) page.
