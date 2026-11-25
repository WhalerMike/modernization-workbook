---
title: "Information Protection with Microsoft Purview: An Implementation Guide"
description: "A gated guide for building Book 20's information protection in a Microsoft 365 GCC tenant: twelve gates, one for each chapter of the book, from the data classes and the inventory through the label taxonomy, publication and defaults, container labels, Rights Management and recovery, message encryption, SharePoint and OneDrive, DLP and endpoint DLP, auto-labeling, audit and insider risk, AI data security, and operations. Each gate says when it is done, which Book 20 procedure to follow, the read-only Validate commands from Microsoft Learn with their pass condition, the federal requirements and KSIs it supports and the evidence the ISSO keeps. It states what Microsoft Purview doesn't yet offer in GCC, feature by feature, with the interim path."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: implementation guide
research-book: "Book 20"
review-status: pending
---
# Information Protection with Microsoft Purview: An Implementation Guide

*A published label isn't protected data: the label has to be on the content, its encryption has to open for the right people and stay shut for the rest, and the agency has to be able to show both.*

::: {.callout-note}
## In this guide
How an agency builds the information protection that [Book 20](../b20-information-protection/index.md) designs, as twelve gates an operator can run in order, one for each chapter of the book. First, how the guide and the book divide the work, government-cloud availability feature by feature with what isn't available in GCC, the order of the gates and the shells the commands run in. Then each gate: what done looks like, the Book 20 procedure to follow, a **Validate** step with read-only commands from Microsoft Learn and the result that passes, the federal requirements and KSIs it supports, and the evidence. Then the synthetic events, the dangers, what couldn't be verified, and where the operating artifacts already live.
:::

::: {.callout-tip}
## Watch, present or train
**Narrated deck:** planned, not yet built. **Developer workbook:** [*Building Information Protection*](../../project-plans/developer-workbooks/information-protection/index.md) builds the read-only checks behind the gates, in nine chapters, each with a lab on fixtures and a lab in a test tenant. **Training:** the learning path [*Information Protection with Microsoft Purview*](../../training/information-protection/index.md) teaches this guide in five modules, each with a lab on fixtures, a lab in a test tenant and a knowledge check.
:::

## How to read this guide

[Book 20](../b20-information-protection/index.md) owns the subject. Each of its chapters already carries a How section with prerequisites, pilot, audit phase, enforcement, rollback, exclusions, telemetry, evidence and day-two ownership, and Chapter 12 holds the [implementation checklist](../b20-information-protection/12-operations-and-evidence.md#implementation-checklist), the [RACI](../b20-information-protection/12-operations-and-evidence.md#raci), the [evidence catalog](../b20-information-protection/12-operations-and-evidence.md#evidence-catalog) and the [metrics](../b20-information-protection/12-operations-and-evidence.md#metrics). This guide doesn't repeat them. It adds what an implementer needs on top: the order of the gates and what each one needs first, one place that says what Microsoft Purview offers in GCC and what it doesn't, a read-only Validate step for every gate with the result that passes, the federal requirements and FedRAMP KSIs each gate supports, and the synthetic events that prove the monitoring end to end. The federal CUI framework, the label taxonomy as code and the first DLP baseline are in [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md); this guide links there too.

**Where the facts come from.** The government-cloud table below was read on Microsoft Learn on November 24, 2026, from the Purview GCC planning page (last updated by Microsoft on August 24, 2026). Every command is one Book 20 already gives, taken from Learn and checked there on November 11, 2026; the footnotes name the Learn pages, and Book 20's chapter verification logs hold the claim-by-claim record. This guide's own [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/information-protection-implementation.md) lists what it adds. Where Learn doesn't say, the guide says *not yet specified* and [lists it](#what-couldnt-be-verified). Recommendations carry an authority label ([Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md#authority-labels)). The audience is a civilian agency at FedRAMP Moderate in Microsoft 365 GCC. Nothing here was run in a tenant; every command is unrun by the authors. Examples use the fictional `contoso.example`.

**The placeholders.** The commands are exact; replace these values once, everywhere:

| Placeholder | What it is |
|---|---|
| `<admin-upn>` | The operator's account, holding the read role the gate needs through PIM |
| `<pilot-user-upn>` | A ring 1 test user the gate owner has approved for tests |
| `<label-name>` | A sensitivity label's name, from the taxonomy of [Book 20, Chapter 02](../b20-information-protection/02-sensitivity-label-architecture.md#b20-02-the-taxonomy-from-classes-to-labels) |
| `<policy-name>` | A DLP or auto-labeling policy's name |
| `<test-sender>`, `<test-recipient>` | Two test mailboxes in the tenant |
| `<tenant>` | The tenant's SharePoint name, as in `https://<tenant>-admin.sharepoint.com` |
| `<evidence-folder>` | The folder, inside the agency's boundary, where a gate's evidence is written |

: Placeholders used in this guide {.striped .hover}

**The checks.** Every **Validate** step reads; nothing in it changes the tenant. The developer workbook's kit, [`examples/information-protection`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/information-protection), runs the same reads monthly, compares them with the agency's plan, finds drift and keeps the evidence; it writes nothing to the tenant. The changes each gate makes are Book 20's, run under a change record with the rollback that chapter gives. The pass conditions are the program's *(risk-based recommended)*.

<!-- labs:begin labs (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Labs for this guide
Every gate's hands-on work is a lab in the developer workbook [*Building Information Protection*](../../project-plans/developer-workbooks/information-protection/index.md): Lab 1 on a laptop with the kit's fixtures, Lab 2 in a non-production environment. [The Labs page](../../training/labs.md#ip) lists them chapter by chapter, with what each needs and a direct link; each gate below links its own labs.
:::

<!-- labs:end -->

## The pieces {#the-pieces}

An implementation guide is finished when it has its deck series, developer workbook and training path ([CONTRIBUTING](https://github.com/WhalerMike/modernization-workbook/blob/main/CONTRIBUTING.md#an-implementation-guide-is-finished-when-it-has-all-four-pieces)):

| Piece | State |
|---|---|
| This guide | Draft, November 24, 2026; awaiting review |
| Narrated deck and video | Planned |
| Developer workbook with Lab 1 on fixtures and Lab 2 in a test tenant | Draft, November 24, 2026; awaiting review: [*Building Information Protection*](../../project-plans/developer-workbooks/information-protection/index.md), nine chapters on the kit in `examples/information-protection` (read-only checks of the Purview configuration baseline against the agency's plan), each with Lab 1 on fixtures and Lab 2 in a test tenant, and a runbook for test and production |
| Training path | Draft, November 24, 2026; awaiting review: [Information Protection with Microsoft Purview](../../training/information-protection/index.md), five modules |

: The guide's pieces {.striped .hover}

## The track at a glance

**The goal.** Every class of agency data has an owner and a label; every label is published with a default someone can justify; CUI is encrypted to the people allowed to read it, and the agency can still recover it; DLP stops CUI leaving by the paths the outcomes name; unlabeled sensitive content is found and labeled; every label, DLP and encryption event is audited and reaches the log platform; AI assistants see only what their users may see; and the evidence for all of it can be produced on request *(risk-based recommended: the program's position)*.

**Done when** *(risk-based recommended)*:

- every gate's Validate step passes, and its evidence is filed against the [evidence catalog](../b20-information-protection/12-operations-and-evidence.md#evidence-catalog);
- every feature the tenant can't use (a license it doesn't hold, or a feature Learn doesn't list as available in GCC) has a decision record with its compensating control;
- the monthly baseline export and drift run of [Chapter 12](../b20-information-protection/12-operations-and-evidence.md#the-configuration-baseline) are running, and the first drift run has no unexplained differences.

**Control states.** Each Book 20 chapter states its own five control states ([Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md)). For the guide as a whole: **Designed** is G1 and the decision records; **Configured** is the first baseline export; **Enforced** is each gate's enforcement ring; **Evidenced** is every Validate step and the [synthetic events](#synthetic-events); **Operated** is G12. A finding is ready for closure when every applicable state has evidence; the authorizing official or assessor decides. Record each finding in the closure register of [Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain), and treat a Zero Trust Assessment or ScubaGear test skipped for a missing license or an unavailable GCC feature as a disposition, not a failed control ([Book 11, Chapter 10](../b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).

::: {.callout-note appearance="simple"}
## Assessment mapping
- **Microsoft Zero Trust pillar:** Data
- **CISA ZTMM pillar:** Data (inventory, categorization, availability, access, encryption), with the Visibility and Analytics, Automation and Orchestration and Governance cross-cutting capabilities ([Book 20, Appendix A](../b20-information-protection/appendix-a-requirements-mapping.md#cisa-zero-trust-maturity-model-the-data-pillar))
- **Depends on:** the groups labels grant rights to, from the identity lifecycle ([Book 03](../b03-hr-identity/index.md)); Conditional Access, PIM and emergency access ([Book 04](../b04-access/index.md)); managed, onboarded Windows devices ([Book 05](../b05-devices/index.md)); the log platform ([Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md))
- **Closure-map rows:** CM-12 (labels, defaults and containers) is G2 to G4; CM-13 (Rights Management and mail encryption) is G5 and G6; Book 20's part of CM-14 (audit and visibility) is G10 and G12 ([Book 20, Appendix A](../b20-information-protection/appendix-a-requirements-mapping.md#the-closure-map-rows-book-20-carries))
:::

## The reference architecture

Book 20's [reference architecture](../b20-information-protection/02-sensitivity-label-architecture.md#the-reference-architecture) has six planes: decisions, identity, policy, protection, data and monitoring. The gates build them in that order. G1 is the decisions plane; G2 to G4 and G8 to G11 configure the policy plane; G5 to G7 make the protection plane work in the workloads; G10 and G12 run the monitoring plane. The trust boundary that matters is the one encrypted content crosses: once a labeled file or message leaves the tenant, only the rights the label carries protect it, which is why G5's recovery test comes before encrypting labels go wide.

## GCC availability by feature {#government-cloud-availability}

Read on Microsoft Learn on November 24, 2026, from "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4, which Microsoft last updated on August 24, 2026.[^ip-gcc] Microsoft states that the status "is subject to change"; read the page again at each reassessment. "Not yet specified" means the page doesn't list the feature; it doesn't mean available.

| Feature | GCC | Gate |
|---|---|---|
| Data classification analytics: overview and content explorer; activity explorer | Available | G1 |
| Content explorer includes Teams data | **In development** | G1 |
| Exact data match sensitive information types | Available | G9 |
| Named entity sensitive information types and policy templates | **In development** | G9 |
| Manual labels; mandatory labels | Available | G2, G3 |
| Default label for an unlabeled file uploaded to a SharePoint document library | **In development** | G3, G7 |
| "Apply default label policies to ensure documents being edited" | **In development** | G3 |
| Sensitivity labels for Teams, Microsoft 365 groups and SharePoint sites | Available | G4 |
| Granular Conditional Access through sensitivity labels for SharePoint sites (authentication context) | **On engineering backlog** | G4 |
| Microsoft Purview Message Encryption; Advanced Message Encryption, with revocation | Available | G5, G6 |
| Customer Key; BYOK; Double Key Encryption | Available | G5 |
| Super user feature of the Rights Management service | Not yet specified | G5 |
| Co-authoring on encrypted documents | Available | G7 |
| Sensitivity labels for files in SharePoint and OneDrive (`EnableAIPIntegration`) | Not yet specified (not listed; the features that depend on it are listed Available) | G7 |
| DLP for files in SharePoint and OneDrive, email, and Teams chat and channel messages | Available | G8 |
| Endpoint DLP | Available | G8 |
| DLP simulation mode | Not yet specified | G8 |
| Auto-labeling for Exchange, SharePoint and OneDrive (service side) | Available | G9 |
| Auto-labeling in Office apps (client side) | Available; **mobile clients on engineering backlog** | G9 |
| New conditions for auto-labeling in Exchange Online | **In development** | G9 |
| Audit (Standard); Audit (Premium) with one-year and ten-year retention | Available | G10 |
| Audit search enhancements | **On engineering backlog** | G10 |
| Insider Risk Management: data theft by departing users, general data leaks | Available | G10 |
| Insider Risk Management: data leaks by disgruntled users; security policy violation templates and indicators; Defender for Endpoint indicators | **In development** | G10 |
| Communication Compliance: core policies, Exchange and Teams | Available | G10 |
| Communication Compliance: retention period on a policy | **On engineering backlog** | G10 |
| DSPM for AI: policies and analytics for AI apps | Available, but **only Microsoft Copilot and supported AI sites**, and **no "browse to URL" policy** | G11 |

: Microsoft Purview in GCC, for the features this guide relies on (read Nov 24, 2026) {.striped .hover}

**What isn't available in GCC, and the interim path.** Six features this design would use aren't available in GCC today. Each one gets a decision record ([Book 20, Chapter 01](../b20-information-protection/01-data-inventory-and-classification.md#decision-record-template)) naming the compensating control, and none is a failed control. The interim path is the Book 20 chapter's own where it gives one; the two marked *risk-based recommended* are the program's position.

| Not available in GCC | Interim path | Where |
|---|---|---|
| Default label for a SharePoint document library | Site owners label existing files, and a service-side auto-labeling policy scoped to the site catches new ones; legacy IRM stays on a library until its files are labeled | [Book 20, Chapter 07](../b20-information-protection/07-sharepoint-and-onedrive.md#how-move-legacy-irm-libraries-to-sensitivity-labels) |
| Authentication context through site labels | The container label's unmanaged-device setting with its app-enforced restrictions Conditional Access policy | [Book 20, Chapter 04](../b20-information-protection/04-teams-groups-and-sharepoint-containers.md#b20-04-container-classes-and-their-settings) |
| Teams data in content explorer | Inventory the SharePoint and OneDrive locations that hold Teams files, and read DLP for Teams matches in activity explorer *(risk-based recommended)* | [Book 20, Chapter 01](../b20-information-protection/01-data-inventory-and-classification.md#b20-01-inventory-find-where-the-data-already-is) |
| Client-side auto-labeling on Office mobile apps | Service-side auto-labeling and DLP cover the content once it is saved to Exchange, SharePoint or OneDrive *(risk-based recommended)* | [Book 20, Chapter 09](../b20-information-protection/09-auto-labeling-and-sensitive-information-types.md) |
| Communication Compliance retention period per policy | The product default applies; the records officer records it as a known limit | [Book 20, Chapter 10](../b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#the-charter-comes-first) |
| DSPM for AI beyond Microsoft Copilot and supported AI sites; the "browse to URL" policy | Endpoint DLP and browser controls for unapproved AI sites | [Book 20, Chapter 11](../b20-information-protection/11-ai-data-security.md#how-govern-sensitive-data-in-ai-interactions) |

: GCC gaps and their interim paths {.striped .hover}

Licensing is the other half: many of these features need an E5- or G5-level plan or an add-on. Book 20 states the license each chapter needs, from the Microsoft Purview service description; a feature the tenant isn't licensed for is a licensing decision, recorded the same way.

## The order of the gates {#the-path-on-one-page}

| Gate | Done when | Validate with |
|---|---|---|
| [G1 Classes, decisions and inventory](#step-1-classes-decisions-and-inventory) | Every class has an owner and a decision record; a dated inventory shows where each class's content is | `Get-DlpSensitiveInformationType`; `Export-ContentExplorerData` |
| [G2 The label taxonomy](#step-2-the-label-taxonomy) | Every label in the design exists with its marking and encryption, and the export matches the design table | `Get-Label` |
| [G3 Publication and defaults](#step-3-publication-and-defaults) | Labels are published ring by ring, with justified defaults and mandatory labeling | `Get-LabelPolicy`; `Search-UnifiedAuditLog` |
| [G4 Container labels](#step-4-container-labels) | Every CUI-bearing team, group and site carries a container label that sets privacy, guests, sharing and unmanaged-device access | `Get-Label` (container settings); `Get-SPOSite` |
| [G5 Rights Management and recovery](#step-5-rights-management-and-recovery) | Rights Management is active; the super user feature is off at rest and the recovery procedure is tested | `Get-AipService`; `Get-AipServiceSuperUserFeature` |
| [G6 Message encryption](#step-6-message-encryption) | The approved scenarios encrypt mail by rule or label, and an external recipient can open it | `Test-IRMConfiguration`; `Get-TransportRule` |
| [G7 SharePoint and OneDrive](#step-7-sharepoint-and-onedrive) | SharePoint and OneDrive can process labeled, encrypted files; legacy IRM libraries are moving to labels; co-authoring works | `Get-SPOTenant`; `Get-PolicyConfig` |
| [G8 DLP and endpoint DLP](#step-8-dlp-and-endpoint-dlp) | Each data outcome has a DLP policy that went through simulation into enforcement, ring by ring | `Get-DlpCompliancePolicy`; DLP audit search |
| [G9 Auto-labeling and sensitive information types](#step-9-auto-labeling-and-sensitive-information-types) | Custom types are tested; each auto-labeling policy went through simulation into labeling | `Test-DataClassification`; `Get-AutoSensitivityLabelPolicy` |
| [G10 Audit, insider risk and communication compliance](#step-10-audit-insider-risk-and-communication-compliance) | Audit is on, retained and routed; insider risk and communication compliance run under a charter | `Get-AdminAuditLogConfig`; `Get-UnifiedAuditLogRetentionPolicy`; synthetic-event search |
| [G11 AI data security](#step-11-ai-data-security) | Copilot interactions are audited; labeled content the decision record names is kept out of Copilot | `Search-UnifiedAuditLog -Operations CopilotInteraction`; `Get-DlpCompliancePolicy` |
| [G12 Operations and evidence](#step-12-operations-and-evidence) | The baseline export and drift run are monthly; the quarterly synthetic tests are filed | The baseline export; the drift run |

: The twelve gates of information protection {.striped .hover}

The numbering follows the book, but three steps come early. **G10's first step** (confirm that auditing is on) runs in week one, because every later Validate step searches the audit log. **G5's activation check and recovery rehearsal** come before G3 publishes an encrypting label beyond ring 1, so nothing is encrypted that the agency can't recover. **G7's label integration** comes before G9 scans SharePoint and OneDrive, because the services can't read encrypted files until it's on. Otherwise: G2 needs G1; G3 needs G2; G4 needs G3's container labels; G6 needs G5; G8 and G9 need G3; G11 needs G3, G8 and G10; G12 runs once the others have their first evidence.

## Prerequisites {#prerequisites}

- **Licenses.** Each Book 20 chapter names the plan its features need. A feature the agency isn't licensed for is a decision record, not a failed control.
- **Roles.** Read roles held through PIM ([Book 04](../b04-access/index.md)): Compliance Administrator or the narrower Purview role groups each chapter names for the Security & Compliance reads; View-Only Audit Logs or Audit Logs for audit search;[^ip-audit-bp] Global Reader or the Rights Management roles `Connect-AipService` accepts for the protection service;[^ip-aip-connect] SharePoint Administrator for the SharePoint reads. Learn says adding security groups to Purview role groups is supported only in commercial organizations, so in GCC the program assigns individual users and keeps the role register ([Book 20, Chapter 10](../b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#role-separation)).
- **Decisions first.** The class register and a decision record per control (G1), the [RACI](../b20-information-protection/12-operations-and-evidence.md#raci), the ring groups (ring 0 the platform team in a test tenant, ring 1 a pilot group, ring 2 early adopters, ring 3 everyone in scope) and the exclusion register.

**The shells.** The program runs cloud administration in PowerShell 7 and keeps Windows PowerShell 5.1 for on-premises modules; each shell below says what Learn supports.

| Shell | Module | Connect in GCC | PowerShell |
|---|---|---|---|
| Security & Compliance PowerShell | ExchangeOnlineManagement | `Connect-IPPSSession -UserPrincipalName <admin-upn>`: no extra parameters in Microsoft 365 GCC[^ip-connect-scc] | 7.6 or later for module 3.10.0 and later; Windows PowerShell 5.1 also supported[^ip-exo-module] |
| Exchange Online PowerShell | ExchangeOnlineManagement | `Connect-ExchangeOnline -UserPrincipalName <admin-upn>` | As above |
| Rights Management | AIPService | `Connect-AipService`; Learn lists no GCC-specific environment value, so the default is used, as in Book 20[^ip-aip-connect] | 7.4 or later with module 3.1.0.0 or later; Windows PowerShell 5.1[^ip-aip-install] |
| SharePoint Online Management Shell | Microsoft.Online.SharePoint.PowerShell | `Connect-SPOService -Url https://<tenant>-admin.sharepoint.com` | In PowerShell 7, only by importing the module with `-UseWindowsPowerShell`, which runs it in Windows PowerShell 5.1[^ip-spo-shell] |

: The shells the Validate steps use {.striped .hover}

## Step 1: Classes, decisions and inventory {#step-1-classes-decisions-and-inventory}

The agency decides what its data classes are, who owns each, and which federal overlay decisions bind them, then finds where that data already lives. Follow [Book 20, Chapter 01](../b20-information-protection/01-data-inventory-and-classification.md): [the authoritative data classes](../b20-information-protection/01-data-inventory-and-classification.md#b20-01-the-authoritative-data-classes), [the federal overlay decisions](../b20-information-protection/01-data-inventory-and-classification.md#b20-01-the-federal-overlay-decisions) and [the inventory](../b20-information-protection/01-data-inventory-and-classification.md#b20-01-inventory-find-where-the-data-already-is). The CUI framework behind the classes is [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md).

**Done when.** The class register lists every class with its authority, owner and handling rule; each Book 20 control has a decision record using [the template](../b20-information-protection/01-data-inventory-and-classification.md#decision-record-template); and a dated inventory shows, per class, which sensitive information types find it and where it is today.

**GCC.** Content explorer and activity explorer are available; Teams data in content explorer is in development (interim path above). Content explorer needs the Content Explorer List viewer and Content viewer roles, which are separate from the other Purview roles.[^ip-content-explorer]

::: {.callout-important}
## Validate (G1 Classes, decisions and inventory)
- **The tenant's sensitive information type catalog is readable** (Security & Compliance PowerShell):[^ip-content-explorer]

    ```powershell
    Connect-IPPSSession -UserPrincipalName <admin-upn>
    Get-DlpSensitiveInformationType | Select-Object Name, Id, Publisher |
      Export-Csv "<evidence-folder>\sit-catalog.csv" -NoTypeInformation -Encoding UTF8
    ```

    Pass: every type the class register names in its Detection column is in the file.
- **Each class's content can be counted**, one sensitive information type and workload at a time:[^ip-export-ce]

    ```powershell
    $page = Export-ContentExplorerData -TagType SensitiveInformationType -TagName 'U.S. Social Security Number (SSN)' -ConfidenceLevel high -Workload SharePoint -PageSize 1000
    $page[0] | Select-Object TotalCount, MorePagesAvailable
    ```

    Pass: a count returns for each type and workload the register names, and the full export ([Chapter 01's paging loop](../b20-information-protection/01-data-inventory-and-classification.md#b20-01-inventory-find-where-the-data-already-is)) is filed with the date.
- Gate owner: the policy owner for the classes, with the platform owner for the inventory.
:::

<!-- labs:begin try-g1 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G1 Classes, decisions and inventory
- **On a laptop, no tenant:** [Chapter 01, Lab 1](../../project-plans/developer-workbooks/information-protection/01-access-and-the-read-path.md#lab-1-fixtures-no-tenant) of *Access and the Read Path*
- **In a test tenant:** [Chapter 01, Lab 2](../../project-plans/developer-workbooks/information-protection/01-access-and-the-read-path.md#lab-2-a-test-tenant)
- **On a laptop, no tenant:** [Chapter 02, Lab 1](../../project-plans/developer-workbooks/information-protection/02-the-baseline-export.md#lab-1-fixtures-no-tenant) of *The Baseline Export*
- **In a test tenant:** [Chapter 02, Lab 2](../../project-plans/developer-workbooks/information-protection/02-the-baseline-export.md#lab-2-a-test-tenant)
- **On a laptop, no tenant:** [Chapter 03, Lab 1](../../project-plans/developer-workbooks/information-protection/03-the-data-inventory.md#lab-1-fixtures-no-tenant) of *The Data Inventory*
- **In a test tenant:** [Chapter 03, Lab 2](../../project-plans/developer-workbooks/information-protection/03-the-data-inventory.md#lab-2-a-test-tenant)
- **As training:** [Module 1: Classes, access and the baseline](../../training/information-protection/01-classes-access-and-the-baseline.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** RA-2, CM-12, PM-5(1), and AC-6 for the content explorer roles; 32 CFR Part 2002 (marking and safeguarding CUI) and OMB M-22-09's data categorization action. **KSIs:** KSI-PIY-GIV, KSI-IAM-ELP. **Evidence:** the class register, the decision records, the dated SIT catalog and inventory export.

## Step 2: The label taxonomy {#step-2-the-label-taxonomy}

The classes become a small set of sensitivity labels with content markings and encryption rights. Follow [Book 20, Chapter 02](../b20-information-protection/02-sensitivity-label-architecture.md): the [taxonomy](../b20-information-protection/02-sensitivity-label-architecture.md#b20-02-the-taxonomy-from-classes-to-labels), the [encryption settings](../b20-information-protection/02-sensitivity-label-architecture.md#b20-02-encryption-settings) and [How: build the taxonomy in a test tenant](../b20-information-protection/02-sensitivity-label-architecture.md#b20-02-how-build-the-taxonomy-in-a-test-tenant). The `New-Label` syntax with the four corrections to earlier scripts is [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#the-label-taxonomy-as-code).

**Done when.** Every label in the design table exists in the test tenant and then in production, with the scopes, header marking and encryption rights the table gives, and rights go only to mail-enabled groups, Microsoft 365 groups or the tenant's domain.

**GCC.** Manual and mandatory labels are available; the move to label groups (the modern label scheme) isn't listed for GCC and is irreversible, so the program doesn't start it without a decision record ([Chapter 02](../b20-information-protection/02-sensitivity-label-architecture.md#b20-02-priority-label-groups-and-the-modern-label-scheme)).

::: {.callout-important}
## Validate (G2 The label taxonomy)
- **The export matches the design table** (Security & Compliance PowerShell):[^ip-get-label]

    ```powershell
    Get-Label | Sort-Object Priority | Format-Table Priority, Name, DisplayName, ContentType, ParentId
    Get-Label | ConvertTo-Json -Depth 10 | Out-File "<evidence-folder>\labels.json" -Encoding utf8
    ```

    Pass: one row per label in the design table, in the table's priority order, with no label the design doesn't have.
- **Each label behaves as designed**: Chapter 02's [manual test](../b20-information-protection/02-sensitivity-label-architecture.md#b20-02-validate) (apply it, see the header, open as a member of the granted group, be refused as a non-member), with the expected and observed result recorded.
- Gate owner: the platform owner, with each class's policy owner.
:::

<!-- labs:begin try-g2 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G2 The label taxonomy
- **On a laptop, no tenant:** [Chapter 04, Lab 1](../../project-plans/developer-workbooks/information-protection/04-labels-policies-and-containers.md#lab-1-fixtures-no-tenant) of *Labels, Policies and Containers*
- **In a test tenant:** [Chapter 04, Lab 2](../../project-plans/developer-workbooks/information-protection/04-labels-policies-and-containers.md#lab-2-a-test-tenant)
- **As training:** [Module 2: Labels, publication and containers](../../training/information-protection/02-labels-publication-and-containers.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** AC-16 and MP-3; 32 CFR Part 2002's marking rules. **KSI:** KSI-SVC-ACM. **Evidence:** the design table, `labels.json` from test and production, the manual test record.

## Step 3: Publication and defaults {#step-3-publication-and-defaults}

Labels reach users through label policies, a pilot first, with defaults for documents, email, meetings, groups and sites, and Power BI, each with its reason. Follow [Book 20, Chapter 03](../b20-information-protection/03-label-publication-and-defaults.md): [defaults the agency can justify](../b20-information-protection/03-label-publication-and-defaults.md#b20-03-defaults-the-agency-can-justify) and [enforcement](../b20-information-protection/03-label-publication-and-defaults.md#b20-03-enforcement).

**Done when.** The label policies of [Chapter 02's publishing table](../b20-information-protection/02-sensitivity-label-architecture.md#b20-02-publishing-policies) exist in the right order, the production policy covers everyone in scope except the approved exclusion group, the defaults and mandatory labeling are set, and the labeled sample passes.

**GCC.** Label policies, defaults and mandatory labeling are available. The SharePoint library default label and "default label policies to ensure documents being edited" are in development (interim path above). Power BI defaults aren't listed for GCC.

::: {.callout-important}
## Validate (G3 Publication and defaults)
- **The policies and their settings are as designed:**[^ip-labelpolicy]

    ```powershell
    Get-LabelPolicy | Sort-Object Priority | Format-Table Name, Priority
    Get-LabelPolicy | Select-Object Name, Priority, Labels, ExchangeLocation, ExchangeLocationException, Settings |
      ConvertTo-Json -Depth 6 | Out-File "<evidence-folder>\label-policies.json" -Encoding utf8
    ```

    Pass: each policy's labels, scope, exclusion group and `Settings` (the default label and mandatory settings) match the design, in the designed order.
- **The labeled sample's events are in the audit log**, after Chapter 03's [labeled-sample test](../b20-information-protection/03-label-publication-and-defaults.md#b20-03-validate-a-labeled-sample) (Exchange Online PowerShell):

    ```powershell
    Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-1) -EndDate (Get-Date) `
      -UserIds '<pilot-user-upn>' -RecordType SensitivityLabelAction -ResultSize 100 |
      Select-Object CreationDate, Operations, UserIds
    ```

    Pass: an event for each step of the sample (the default applied, the upgrade, the downgrade with its justification).
- Gate owner: the platform owner.
:::

<!-- labs:begin try-g3 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G3 Publication and defaults
- **On a laptop, no tenant:** [Chapter 04, Lab 1](../../project-plans/developer-workbooks/information-protection/04-labels-policies-and-containers.md#lab-1-fixtures-no-tenant) of *Labels, Policies and Containers*
- **In a test tenant:** [Chapter 04, Lab 2](../../project-plans/developer-workbooks/information-protection/04-labels-policies-and-containers.md#lab-2-a-test-tenant)
- **As training:** [Module 2: Labels, publication and containers](../../training/information-protection/02-labels-publication-and-containers.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** AC-16, MP-3, and AT-2 through the label menu's help link. **KSIs:** KSI-SVC-ACM, KSI-MLA-RVL (the monthly downgrade review). **Evidence:** `label-policies.json`, the labeled sample and its audit export, the exclusion group's membership.

## Step 4: Container labels {#step-4-container-labels}

Labels applied to teams, Microsoft 365 groups and SharePoint sites set their privacy, guest access, sharing and unmanaged-device access; the files inside don't inherit them. Follow [Book 20, Chapter 04](../b20-information-protection/04-teams-groups-and-sharepoint-containers.md): the [container classes](../b20-information-protection/04-teams-groups-and-sharepoint-containers.md#b20-04-container-classes-and-their-settings), [prerequisites](../b20-information-protection/04-teams-groups-and-sharepoint-containers.md#b20-04-prerequisites) (group label support in Entra ID and the label sync) and [enforcement](../b20-information-protection/04-teams-groups-and-sharepoint-containers.md#b20-04-enforcement).

**Done when.** Every CUI-bearing team and site carries the container label its class needs; new teams and sites require a label; and the guest, sharing and unmanaged-device tests pass.

**GCC.** Container labels are available; authentication context through labels is on the engineering backlog (interim path above).

::: {.callout-important}
## Validate (G4 Container labels)
- **The container labels carry their settings** (Security & Compliance PowerShell):

    ```powershell
    'Internal site','CUI site','CUI Specified site' | ForEach-Object { Get-Label -Identity $_ } |
      ConvertTo-Json -Depth 8 | Out-File "<evidence-folder>\container-labels.json" -Encoding utf8
    ```

- **Every site's label is visible** (SharePoint Online Management Shell; see [the shells](#prerequisites)):[^ip-spo-shell]

    ```powershell
    Connect-SPOService -Url https://<tenant>-admin.sharepoint.com
    Get-SPOSite -Limit All |
      Select-Object Url, Template, Owner, SharingCapability, SensitivityLabel, ConditionalAccessPolicy |
      Export-Csv "<evidence-folder>\sites.csv" -NoTypeInformation -Encoding UTF8
    ```

    Pass: every CUI-bearing site in the inventory has the label its class needs; every site without a label is in the unlabeled-sites register; and Chapter 04's [five tests](../b20-information-protection/04-teams-groups-and-sharepoint-containers.md#b20-04-validate) pass.
- Gate owner: the platform owner, with the site owners.
:::

<!-- labs:begin try-g4 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G4 Container labels
- **On a laptop, no tenant:** [Chapter 04, Lab 1](../../project-plans/developer-workbooks/information-protection/04-labels-policies-and-containers.md#lab-1-fixtures-no-tenant) of *Labels, Policies and Containers*
- **In a test tenant:** [Chapter 04, Lab 2](../../project-plans/developer-workbooks/information-protection/04-labels-policies-and-containers.md#lab-2-a-test-tenant)
- **As training:** [Module 2: Labels, publication and containers](../../training/information-protection/02-labels-publication-and-containers.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** AC-3 and AC-21. **KSI:** KSI-MLA-RVL (mismatch events and the monthly unlabeled-site review). **Evidence:** the container label export, the site list with labels, the test record.

## Step 5: Rights Management and recovery {#step-5-rights-management-and-recovery}

The Azure Rights Management service encrypts labeled content and mail. The agency decides activation and onboarding deliberately, and keeps a just-in-time way to recover encrypted content when its owner is gone. Follow [Book 20, Chapter 05](../b20-information-protection/05-rights-management-and-recovery.md): [the decisions](../b20-information-protection/05-rights-management-and-recovery.md#b20-05-decide-activation-onboarding-and-recovery), [activate and stage the service](../b20-information-protection/05-rights-management-and-recovery.md#how-activate-and-stage-the-rights-management-service) and [recover through a super user, just in time](../b20-information-protection/05-rights-management-and-recovery.md#how-recover-encrypted-content-through-a-super-user-just-in-time). The tenant key choice is [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#keys-the-agency-controls).

**Done when.** The service is active; the onboarding control matches the ring; the super user feature is off with no standing super users; and the decryption-continuity test, including recovery, passes.

**GCC.** The Rights Management service, BYOK and Double Key Encryption are available. The super user feature isn't listed on the GCC page: confirm it in the test tenant before the recovery procedure depends on it, and record the result in the decision record.

::: {.callout-important}
## Validate (G5 Rights Management and recovery)
- **Active, and nobody can decrypt everything at rest** (AIPService module):[^ip-aip-su]

    ```powershell
    Connect-AipService
    Get-AipService
    Get-AipServiceOnboardingControlPolicy
    Get-AipServiceSuperUserFeature
    Get-AipServiceSuperUser
    ```

    Pass: `Enabled`; the onboarding control matches the ring; the super user feature `Disabled`; no super users listed.
- **The decryption-continuity test passes**: Chapter 05's [six steps](../b20-information-protection/05-rights-management-and-recovery.md#validate-the-decryption-continuity-test), after rings 1 and 3 and then quarterly, ending with the feature off again.
- Gate owner: the platform owner; the policy owner approves each recovery.
:::

<!-- labs:begin try-g5 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G5 Rights Management and recovery
- **On a laptop, no tenant:** [Chapter 05, Lab 1](../../project-plans/developer-workbooks/information-protection/05-rights-management-and-message-encryption.md#lab-1-fixtures-no-tenant) of *Rights Management and Message Encryption*
- **In a test tenant:** [Chapter 05, Lab 2](../../project-plans/developer-workbooks/information-protection/05-rights-management-and-message-encryption.md#lab-2-a-test-tenant)
- **As training:** [Module 3: Encryption and recovery](../../training/information-protection/03-encryption-and-recovery.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** SC-12, SC-13, SC-28, AC-5 and AC-6. **KSIs:** KSI-SVC-SIN, KSI-SVC-ASM, KSI-IAM-JIT (super user recovery through PIM). **Evidence:** `aipservice-configuration.json`, the PIM activation history, the decryption-continuity test record.

## Step 6: Message encryption {#step-6-message-encryption}

Mail that leaves the agency is encrypted by a label the sender chooses or by a mail flow rule for the approved scenarios, with branding, one-time passcodes and the sign-in options the program chose. Follow [Book 20, Chapter 06](../b20-information-protection/06-exchange-message-encryption.md): [the approved message scenarios](../b20-information-protection/06-exchange-message-encryption.md#decide-the-approved-message-scenarios) and [verify, brand and stage](../b20-information-protection/06-exchange-message-encryption.md#how-verify-brand-and-stage-message-encryption).

**Done when.** `Test-IRMConfiguration` passes; each approved scenario has its rule, enforced for its scope; and the encrypted test passes with an external recipient.

**GCC.** Message Encryption, Advanced Message Encryption and revocation are available, and mail flow rules are available in Exchange Online for GCC.[^ip-gcc]

::: {.callout-important}
## Validate (G6 Message encryption)
- **The configuration works end to end** (Exchange Online PowerShell):[^ip-ome-setup]

    ```powershell
    Connect-ExchangeOnline -UserPrincipalName <admin-upn>
    Get-IRMConfiguration | Format-List AzureRMSLicensingEnabled, SimplifiedClientAccessEnabled, DecryptAttachmentForEncryptOnly, LicensingLocation
    Test-IRMConfiguration -Sender <test-sender>@contoso.example -Recipient <test-recipient>@contoso.example
    Get-TransportRule | Format-Table Name, State, Mode, Priority
    ```

    Pass: `AzureRMSLicensingEnabled` is `True`; `OVERALL RESULT: PASS`; each approved scenario's rule is `Enabled` and in `Enforce` mode for its ring.
- **The encrypted test passes**: Chapter 06's [six steps](../b20-information-protection/06-exchange-message-encryption.md#validate-the-encrypted-test), after each ring and quarterly.
- Gate owner: the platform owner.
:::

<!-- labs:begin try-g6 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G6 Message encryption
- **On a laptop, no tenant:** [Chapter 05, Lab 1](../../project-plans/developer-workbooks/information-protection/05-rights-management-and-message-encryption.md#lab-1-fixtures-no-tenant) of *Rights Management and Message Encryption*
- **In a test tenant:** [Chapter 05, Lab 2](../../project-plans/developer-workbooks/information-protection/05-rights-management-and-message-encryption.md#lab-2-a-test-tenant)
- **As training:** [Module 3: Encryption and recovery](../../training/information-protection/03-encryption-and-recovery.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** SC-8, SC-13, AC-4 and AC-21; CISA BOD 25-01 for the Exchange settings the SCuBA baselines assess. **KSI:** KSI-SVC-SIN. **Evidence:** `irm-configuration.json`, the transport rule and OME configuration export, the encrypted test record and its message trace.

## Step 7: SharePoint and OneDrive {#step-7-sharepoint-and-onedrive}

Until label integration is on, SharePoint and OneDrive can't search, scan, co-author or apply DLP to the files labels encrypt. Follow [Book 20, Chapter 07](../b20-information-protection/07-sharepoint-and-onedrive.md): [turn on label integration](../b20-information-protection/07-sharepoint-and-onedrive.md#how-turn-on-label-integration-for-sharepoint-and-onedrive), [move legacy IRM libraries](../b20-information-protection/07-sharepoint-and-onedrive.md#how-move-legacy-irm-libraries-to-sensitivity-labels) and [turn on co-authoring](../b20-information-protection/07-sharepoint-and-onedrive.md#how-turn-on-co-authoring-for-encrypted-files).

**Done when.** Label integration (with PDF support) is on; every legacy IRM library is migrated or recorded with a date; co-authoring on encrypted files is on; and the labeled-files tests pass.

**GCC.** Co-authoring is available. Label integration isn't listed separately on the GCC page, though the features that depend on it are listed Available; confirm it in the test tenant. The library default label is in development, so in GCC IRM stays on a library until its files are labeled (interim path above).

::: {.callout-important}
## Validate (G7 SharePoint and OneDrive)
- **The tenant settings are on** (SharePoint Online Management Shell, then Security & Compliance PowerShell):[^ip-spo-labels][^ip-coauth]

    ```powershell
    Connect-SPOService -Url https://<tenant>-admin.sharepoint.com
    Get-SPOTenant | Format-List EnableAIPIntegration, EnableSensitivityLabelforPDF
    ```

    ```powershell
    Connect-IPPSSession -UserPrincipalName <admin-upn>
    Get-PolicyConfig | Format-List EnableLabelCoauth
    ```

    Pass: all three `True`.
- **Labeled files behave**: Chapter 07's [eight tests](../b20-information-protection/07-sharepoint-and-onedrive.md#validate-labeled-files-behave), with the audit records.
- Gate owner: the platform owner.
:::

<!-- labs:begin try-g7 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G7 SharePoint and OneDrive
- **On a laptop, no tenant:** [Chapter 05, Lab 1](../../project-plans/developer-workbooks/information-protection/05-rights-management-and-message-encryption.md#lab-1-fixtures-no-tenant) of *Rights Management and Message Encryption*
- **In a test tenant:** [Chapter 05, Lab 2](../../project-plans/developer-workbooks/information-protection/05-rights-management-and-message-encryption.md#lab-2-a-test-tenant)
- **As training:** [Module 3: Encryption and recovery](../../training/information-protection/03-encryption-and-recovery.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** AC-3 and SC-28. **KSI:** KSI-SVC-SIN. **Evidence:** the tenant setting export, the IRM library list with migration dates, the test record.

## Step 8: DLP and endpoint DLP {#step-8-dlp-and-endpoint-dlp}

Each DLP policy starts from a data outcome ("CUI isn't sent outside the agency except through the approved partner path"), runs in simulation as its pilot, then enforces ring by ring, with overrides and exceptions that stay narrow and expire. Follow [Book 20, Chapter 08](../b20-information-protection/08-dlp-and-endpoint-controls.md): [design from data outcomes](../b20-information-protection/08-dlp-and-endpoint-controls.md#design-from-data-outcomes), [workload DLP](../b20-information-protection/08-dlp-and-endpoint-controls.md#how-workload-dlp-from-simulation-to-enforcement) and [endpoint DLP on Windows](../b20-information-protection/08-dlp-and-endpoint-controls.md#how-endpoint-dlp-on-windows-devices). Book 12's first DLP baseline is in [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md).

**Done when.** Every outcome has its policy in `Enable` for everyone in scope, the ring versions are retired, every exception is in the register with an expiry, and the synthetic content is blocked on each surface with an alert.

**GCC.** DLP for SharePoint, OneDrive, email and Teams, endpoint DLP and the alerts dashboard are available; the simulation-mode dashboard isn't listed separately, so the program treats `TestWithoutNotifications` as the pilot whether or not the dashboard is there.

::: {.callout-important}
## Validate (G8 DLP and endpoint DLP)
- **Each policy is in the mode its stage says** (Security & Compliance PowerShell):[^ip-dlp-policy]

    ```powershell
    Get-DlpCompliancePolicy | Format-Table Name, Mode, Enabled, Workload
    Get-DlpComplianceRule | Format-Table Name, Policy, Disabled
    ```

    Pass: each outcome's production policy is `Enable`; ring policies the rollout has retired are `Disable`; nothing is in a test mode that the rollout plan doesn't put there.
- **A match reaches the audit log** after the synthetic test (Exchange Online PowerShell):[^ip-dlp-audit]

    ```powershell
    Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-1) -EndDate (Get-Date) -RecordType ComplianceDLPExchange -ResultSize 5000 |
      Select-Object CreationDate,UserIds,Operations,AuditData | Export-Csv "<evidence-folder>\dlp-exchange-last-day.csv" -NoTypeInformation
    ```

    Pass: the synthetic message's match is in the file. Repeat with `ComplianceDLPSharePoint` and `DLPEndpoint` for those surfaces.
- Gate owner: the platform owner, with the security monitor for alerts.
:::

<!-- labs:begin try-g8 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G8 DLP and endpoint DLP
- **On a laptop, no tenant:** [Chapter 06, Lab 1](../../project-plans/developer-workbooks/information-protection/06-dlp-and-auto-labeling.md#lab-1-fixtures-no-tenant) of *DLP and Auto-Labeling*
- **In a test tenant:** [Chapter 06, Lab 2](../../project-plans/developer-workbooks/information-protection/06-dlp-and-auto-labeling.md#lab-2-a-test-tenant)
- **As training:** [Module 4: DLP, auto-labeling and AI](../../training/information-protection/04-dlp-auto-labeling-and-ai.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** AC-4, MP-7 (endpoint DLP's removable-media rule), SI-4 and IR-4; CISA BOD 25-01 for the DLP settings the SCuBA baselines assess. **KSIs:** KSI-SVC-SIN, KSI-SVC-RUD (spill handling), KSI-MLA-RVL (the override review). **Evidence:** `dlp-policies.json`, `dlp-rules.json`, the synthetic test record per surface, the exception register.

## Step 9: Auto-labeling and sensitive information types {#step-9-auto-labeling-and-sensitive-information-types}

What users didn't label is found by sensitive information types, custom types kept as code, exact data match and classifiers, and labeled by service-side policies that run in simulation first. Follow [Book 20, Chapter 09](../b20-information-protection/09-auto-labeling-and-sensitive-information-types.md): [the classifier ladder](../b20-information-protection/09-auto-labeling-and-sensitive-information-types.md#the-classifier-ladder), [custom types as code](../b20-information-protection/09-auto-labeling-and-sensitive-information-types.md#custom-types-as-code), [exact data match](../b20-information-protection/09-auto-labeling-and-sensitive-information-types.md#exact-data-match) and [service-side auto-labeling](../b20-information-protection/09-auto-labeling-and-sensitive-information-types.md#how-service-side-auto-labeling-from-simulation-to-rollout).

**Done when.** Every custom type matches its positive sample and not its negative one; each auto-labeling policy has a simulation precision record and moved to `Enable` only with the policy owner's approval; and no policy turned itself on after the seven-day option.

**GCC.** Service-side auto-labeling and exact data match are available; named entity types and new Exchange conditions are in development; client-side auto-labeling on mobile is on the engineering backlog; custom trainable classifiers aren't listed.

::: {.callout-important}
## Validate (G9 Auto-labeling and sensitive information types)
- **Each custom type matches what it should and not what it shouldn't** (Security & Compliance PowerShell):[^ip-sit-ps]

    ```powershell
    Test-DataClassification -ClassificationNames 'Contoso Case Number' -TextToClassify 'Docket entry: case number CN-12345678 filed.'
    Test-DataClassification -ClassificationNames 'Contoso Case Number' -TextToClassify 'Reference CN-12345678 only.'
    ```

    Pass: the first returns the high-confidence pattern and the second the low one, as [Chapter 09](../b20-information-protection/09-auto-labeling-and-sensitive-information-types.md#custom-types-as-code) sets out; both results are kept with the rule package's commit.
- **Each policy is where its stage says:**[^ip-autolabel]

    ```powershell
    Get-AutoSensitivityLabelPolicy | Format-List Name,Mode,Enabled,SharePointLocation
    ```

    Pass: policies in simulation say `TestWithoutNotifications` or `TestWithNotifications`; policies the owner approved say `Enable`; none says `Enable` without an approval in the change record.
- Gate owner: the platform owner; the policy owner approves each move to `Enable`.
:::

<!-- labs:begin try-g9 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G9 Auto-labeling and sensitive information types
- **On a laptop, no tenant:** [Chapter 06, Lab 1](../../project-plans/developer-workbooks/information-protection/06-dlp-and-auto-labeling.md#lab-1-fixtures-no-tenant) of *DLP and Auto-Labeling*
- **In a test tenant:** [Chapter 06, Lab 2](../../project-plans/developer-workbooks/information-protection/06-dlp-and-auto-labeling.md#lab-2-a-test-tenant)
- **As training:** [Module 4: DLP, auto-labeling and AI](../../training/information-protection/04-dlp-auto-labeling-and-ai.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** AC-16 and CM-12; OMB M-22-09's action to automate data categorization. **KSI:** KSI-SVC-ACM (rule packages and policies as code). **Evidence:** `autolabel-policies.json`, `autolabel-rules.json`, the custom type rule packages, the simulation precision record.

## Step 10: Audit, insider risk and communication compliance {#step-10-audit-insider-risk-and-communication-compliance}

Audit is the floor: on, retained and routed to the log platform. Insider Risk Management and Communication Compliance come only after a charter settles the privacy, legal and labor-relations questions. Follow [Book 20, Chapter 10](../b20-information-protection/10-audit-insider-risk-and-communication-compliance.md): [audit is the floor](../b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#audit-is-the-floor), [turn on, retain and test Purview Audit](../b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#how-turn-on-retain-and-test-purview-audit), [the charter](../b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#the-charter-comes-first) and [insider risk and communication compliance](../b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#how-insider-risk-management-and-communication-compliance-under-a-charter). Routing to the log platform is [Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md).

**Done when.** Unified audit ingestion is on; the retention policies the evidence contract needs exist; the synthetic label events are found by search and in the log platform; and, where the charter is signed, the role groups hold only the people the role register names.

**GCC.** Audit (Standard) and Audit (Premium), with one-year and ten-year retention, are available; audit search enhancements are on the engineering backlog. The Management Activity API endpoint for GCC is `manage-gcc.office.com` ([Chapter 10](../b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#routing-audit-data-out-of-the-tenant)). Several insider risk templates and indicators are in development, and Communication Compliance can't set a retention period per policy (table above).

::: {.callout-important}
## Validate (G10 Audit, insider risk and communication compliance)
- **Audit is on, and retention is as designed.** Read ingestion in Exchange Online PowerShell; in Security & Compliance PowerShell the property always reads `False`:[^ip-audit-on][^ip-audit-retention]

    ```powershell
    Connect-ExchangeOnline -UserPrincipalName <admin-upn>
    Get-AdminAuditLogConfig | Format-List UnifiedAuditLogIngestionEnabled
    ```

    ```powershell
    Connect-IPPSSession -UserPrincipalName <admin-upn>
    Get-UnifiedAuditLogRetentionPolicy | Sort-Object -Property Priority | Format-List Priority,Name,Description,RecordTypes,Operations,UserIds,RetentionDuration
    ```

    Pass: `True`; each retention policy the decision record names is present with its duration and priority.
- **The synthetic label events are found**, after Chapter 10's [synthetic-event test](../b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#how-turn-on-retain-and-test-purview-audit) (Exchange Online PowerShell):

    ```powershell
    Search-UnifiedAuditLog -StartDate (Get-Date).AddHours(-4) -EndDate (Get-Date) -UserIds '<pilot-user-upn>' `
      -Operations FileSensitivityLabelApplied,FileSensitivityLabelRemoved,SensitivityLabelApplied,SensitivityLabelRemoved `
      -ResultSize 5000 | Select-Object CreationDate,UserIds,Operations,RecordType | Format-Table -AutoSize
    ```

    Pass: the applied and removed events are found within the target time, and the same events are in the log platform.
- **Role groups hold the people the register names** (Security & Compliance PowerShell):

    ```powershell
    Get-RoleGroupMember -Identity '<irm-investigators-role-group-name>'
    ```

- Gate owner: the platform owner for audit; the charter's owner for insider risk and communication compliance.
:::

<!-- labs:begin try-g10 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G10 Audit, insider risk and communication compliance
- **On a laptop, no tenant:** [Chapter 07, Lab 1](../../project-plans/developer-workbooks/information-protection/07-audit-and-the-synthetic-events.md#lab-1-fixtures-no-tenant) of *Audit and the Synthetic Events*
- **In a test tenant:** [Chapter 07, Lab 2](../../project-plans/developer-workbooks/information-protection/07-audit-and-the-synthetic-events.md#lab-2-a-test-tenant)
- **On a laptop, no tenant:** [Chapter 08, Lab 1](../../project-plans/developer-workbooks/information-protection/08-drift-metrics-and-the-monthly-evidence-run.md#lab-1-fixtures-no-tenant) of *Drift, Metrics and the Monthly Evidence Run*
- **In a test tenant:** [Chapter 08, Lab 2](../../project-plans/developer-workbooks/information-protection/08-drift-metrics-and-the-monthly-evidence-run.md#lab-2-a-test-tenant)
- **On a laptop, no tenant:** [Chapter 09, Lab 1](../../project-plans/developer-workbooks/information-protection/09-deploying-to-test-and-production.md#lab-1-stand-ins-no-tenant) of *Deploying to Test and Production*
- **In a test tenant:** [Chapter 09, Lab 2](../../project-plans/developer-workbooks/information-protection/09-deploying-to-test-and-production.md#lab-2-a-test-tenant)
- **As training:** [Module 5: Audit, drift and evidence](../../training/information-protection/05-audit-drift-and-evidence.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** AU-2, AU-12, AU-6, AU-11, SI-4, AC-5 and PM-12; OMB M-26-14's logging requirements and M-22-09's audit of access to data; CISA BOD 25-01 for the audit settings the SCuBA baselines assess. **KSIs:** KSI-MLA-LET, KSI-MLA-OSM, KSI-IAM-ELP. **Evidence:** `audit-status.json`, the retention policy export, the synthetic-event search record, the role register and charter.

## Step 11: AI data security {#step-11-ai-data-security}

Microsoft 365 Copilot works in the user's security context and honors labels and their usage rights, so the controls of G2 to G10 are the AI controls; Purview adds visibility into AI interactions and DLP for the Copilot location. Follow [Book 20, Chapter 11](../b20-information-protection/11-ai-data-security.md): [the AI data decisions](../b20-information-protection/11-ai-data-security.md#the-ai-data-decisions) and [govern sensitive data in AI interactions](../b20-information-protection/11-ai-data-security.md#how-govern-sensitive-data-in-ai-interactions). Identities for AI agents are [Book 17](../b17-ai-identity/index.md).

**Done when.** Copilot interactions are audited; the labels the decision record names are excluded from Copilot processing by a DLP policy in `Enable`; and Chapter 11's tests pass (a labeled file cited but not summarized; a synthetic sensitive value refused in a prompt).

**GCC.** Purview's controls for Microsoft Copilot are available; DSPM for AI sees only Microsoft Copilot and supported AI sites and can't create the "browse to URL" policy; the DLP for Copilot location isn't listed as its own row; web grounding is off by default (Chapter 11's table).

::: {.callout-important}
## Validate (G11 AI data security)
- **Copilot interactions are recorded** (Exchange Online PowerShell):[^ip-copilot-audit]

    ```powershell
    Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-1) -EndDate (Get-Date) `
      -Operations CopilotInteraction -ResultSize 50 |
      Select-Object CreationDate, UserIds, Operations
    ```

- **The Copilot DLP policy is enforcing** (Security & Compliance PowerShell):

    ```powershell
    Get-DlpCompliancePolicy -Identity "B20-Copilot-Exclude-CUI-SP" | Format-List Name, Mode
    ```

    Pass: interactions from the pilot user appear; the policy is `Enable`; Chapter 11's tests pass. A change to the policy reaches Copilot within four hours, so test after that.
- Gate owner: the platform owner; the policy owner approves the label exclusions.
:::

<!-- labs:begin try-g11 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G11 AI data security
- **On a laptop, no tenant:** [Chapter 06, Lab 1](../../project-plans/developer-workbooks/information-protection/06-dlp-and-auto-labeling.md#lab-1-fixtures-no-tenant) of *DLP and Auto-Labeling*
- **In a test tenant:** [Chapter 06, Lab 2](../../project-plans/developer-workbooks/information-protection/06-dlp-and-auto-labeling.md#lab-2-a-test-tenant)
- **As training:** [Module 4: DLP, auto-labeling and AI](../../training/information-protection/04-dlp-auto-labeling-and-ai.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** AC-6, AC-4 and SI-4. **KSIs:** KSI-SVC-SIN, KSI-MLA-LET (AI record types). **Evidence:** the Copilot DLP export, the AI test record, the audit export, the DSPM data risk assessments where available.

## Step 12: Operations and evidence {#step-12-operations-and-evidence}

The configuration is exported monthly as a dated baseline, compared with the last approved one, and every difference no change ticket explains is drift. Follow [Book 20, Chapter 12](../b20-information-protection/12-operations-and-evidence.md): [change control](../b20-information-protection/12-operations-and-evidence.md#change-control-for-information-protection), [the configuration baseline](../b20-information-protection/12-operations-and-evidence.md#the-configuration-baseline), [drift detection](../b20-information-protection/12-operations-and-evidence.md#drift-detection), [incident response for data events](../b20-information-protection/12-operations-and-evidence.md#incident-response-for-data-events) and the [operating cadence](../b20-information-protection/12-operations-and-evidence.md#operating-cadence). The drift engine is [Book 13, Chapter 06](../b13-governance/06-the-drift-engine.md).

**Done when.** The baseline export runs monthly under a read-only role, is committed with its change ticket, and the drift run has no unexplained differences; the quarterly synthetic tests are filed; the metrics are reported with their trend.

::: {.callout-important}
## Validate (G12 Operations and evidence)
- **The baseline export runs and is complete**: Chapter 12's [three export blocks](../b20-information-protection/12-operations-and-evidence.md#the-configuration-baseline), into `<evidence-folder>`. Pass: `labels.json`, `label-policies.json`, `autolabel-policies.json`, `autolabel-rules.json`, `dlp-policies.json`, `dlp-rules.json`, `irm-configuration.json`, `audit-status.json` and `aipservice-configuration.json` are all present and non-empty, and their SHA-256 values are recorded.
- **The drift signals are clean**: each row of Chapter 12's [drift table](../b20-information-protection/12-operations-and-evidence.md#drift-detection) (a policy back in a test mode, rights widened, a label unpublished, the super user feature on, audit off, the Copilot policy changed) is checked against the last approved export, and every difference has a change ticket.
- **Changes to auditing are themselves visible** (Exchange Online PowerShell):

    ```powershell
    Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-30) -EndDate (Get-Date) -Operations Set-AdminAuditLogConfig -ResultSize 5000 |
      Select-Object CreationDate,UserIds,Operations,AuditData
    ```

    Pass: every result has a change ticket.
- Gate owner: the platform owner; the assessor samples the package.
:::

<!-- labs:begin try-g12 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Try it: G12 Operations and evidence
- **On a laptop, no tenant:** [Chapter 01, Lab 1](../../project-plans/developer-workbooks/information-protection/01-access-and-the-read-path.md#lab-1-fixtures-no-tenant) of *Access and the Read Path*
- **In a test tenant:** [Chapter 01, Lab 2](../../project-plans/developer-workbooks/information-protection/01-access-and-the-read-path.md#lab-2-a-test-tenant)
- **On a laptop, no tenant:** [Chapter 02, Lab 1](../../project-plans/developer-workbooks/information-protection/02-the-baseline-export.md#lab-1-fixtures-no-tenant) of *The Baseline Export*
- **In a test tenant:** [Chapter 02, Lab 2](../../project-plans/developer-workbooks/information-protection/02-the-baseline-export.md#lab-2-a-test-tenant)
- **On a laptop, no tenant:** [Chapter 03, Lab 1](../../project-plans/developer-workbooks/information-protection/03-the-data-inventory.md#lab-1-fixtures-no-tenant) of *The Data Inventory*
- **In a test tenant:** [Chapter 03, Lab 2](../../project-plans/developer-workbooks/information-protection/03-the-data-inventory.md#lab-2-a-test-tenant)
- **As training:** [Module 1: Classes, access and the baseline](../../training/information-protection/01-classes-access-and-the-baseline.md), with a knowledge check
- **On a laptop, no tenant:** [Chapter 07, Lab 1](../../project-plans/developer-workbooks/information-protection/07-audit-and-the-synthetic-events.md#lab-1-fixtures-no-tenant) of *Audit and the Synthetic Events*
- **In a test tenant:** [Chapter 07, Lab 2](../../project-plans/developer-workbooks/information-protection/07-audit-and-the-synthetic-events.md#lab-2-a-test-tenant)
- **On a laptop, no tenant:** [Chapter 08, Lab 1](../../project-plans/developer-workbooks/information-protection/08-drift-metrics-and-the-monthly-evidence-run.md#lab-1-fixtures-no-tenant) of *Drift, Metrics and the Monthly Evidence Run*
- **In a test tenant:** [Chapter 08, Lab 2](../../project-plans/developer-workbooks/information-protection/08-drift-metrics-and-the-monthly-evidence-run.md#lab-2-a-test-tenant)
- **On a laptop, no tenant:** [Chapter 09, Lab 1](../../project-plans/developer-workbooks/information-protection/09-deploying-to-test-and-production.md#lab-1-stand-ins-no-tenant) of *Deploying to Test and Production*
- **In a test tenant:** [Chapter 09, Lab 2](../../project-plans/developer-workbooks/information-protection/09-deploying-to-test-and-production.md#lab-2-a-test-tenant)
- **As training:** [Module 5: Audit, drift and evidence](../../training/information-protection/05-audit-drift-and-evidence.md), with a knowledge check
:::

<!-- labs:end -->

**Supports** CM-3, CA-7, IR-4 and AU-6. **KSIs:** KSI-SVC-ACM, KSI-CMT-LMC, KSI-INR-RIR. **Evidence:** the monthly baseline exports, the drift-run results, the metrics history, the exclusion register, the closure-chain entries.

## Synthetic events {#synthetic-events}

Searchable synthetic events show the assessor that the telemetry, the route and the response work end to end, which is the minimum evidence for Book 20's part of closure-map row CM-14. Each is a Book 20 test; this is the one list. Run them on the [operating cadence](../b20-information-protection/12-operations-and-evidence.md#operating-cadence) under a change record.

| Test (gate) | Expected result | Where to find it |
|---|---|---|
| Label applied and removed in Office for the web (G3, G10) | `FileSensitivityLabelApplied` and `FileSensitivityLabelRemoved` | Audit search; the log platform |
| Downgrade with justification (G3) | The justification in the label event | Activity explorer; audit search |
| CUI file uploaded to a lower-labeled site (G4) | **Detected document sensitivity mismatch** and the email to the uploader and owners | Audit search |
| Super user recovery (G5) | `AddSuperUser` and `SetSuperUserFeatureState` in the admin log, then removal | `Get-AipServiceAdminLog` |
| Encrypted message to an external tester (G6) | Arrives encrypted; the rule's hit in message trace | Message trace |
| Synthetic CUI sent outside the tenant (G8) | Blocked; a DLP alert | `ComplianceDLPExchange` in audit search; the DLP alerts queue |
| Synthetic sensitive value in a Copilot prompt (G11) | Refused | Audit search; activity explorer |

: Synthetic events and where they surface {.striped .hover}

## Operating it: the artifacts Book 20 already holds

These are the guide's operating artifacts; they live in Book 20 and aren't repeated here.

| Artifact | Where |
|---|---|
| Decision record template | [Book 20, Chapter 01](../b20-information-protection/01-data-inventory-and-classification.md#decision-record-template) |
| Implementation checklist: pilot, enforcement, rollback, exception and validation per control | [Book 20, Chapter 12](../b20-information-protection/12-operations-and-evidence.md#implementation-checklist) |
| RACI | [Book 20, Chapter 12](../b20-information-protection/12-operations-and-evidence.md#raci) |
| Operating cadence | [Book 20, Chapter 12](../b20-information-protection/12-operations-and-evidence.md#operating-cadence) |
| Evidence catalog | [Book 20, Chapter 12](../b20-information-protection/12-operations-and-evidence.md#evidence-catalog) |
| Metrics M1 to M12 | [Book 20, Chapter 12](../b20-information-protection/12-operations-and-evidence.md#metrics) |
| Requirements mapping: controls, ZTMM, OMB and CISA instruments, KSIs | [Book 20, Appendix A](../b20-information-protection/appendix-a-requirements-mapping.md) |

: Where the operating artifacts live {.striped .hover}

## Requirements and KSIs

The rows say which requirements each gate supports and with what. The gates support these controls; they don't by themselves decide them, and the agency's assessor does. Control text and the full mapping are in [Book 20, Appendix A](../b20-information-protection/appendix-a-requirements-mapping.md); the KSI column uses FedRAMP's 2026 Key Security Indicators as a vocabulary for the agency's own evidence, as [Appendix A](../b20-information-protection/appendix-a-requirements-mapping.md#fedramps-2026-key-security-indicators-as-an-evidence-vocabulary) maps them. KSIs bind cloud service providers; the agency doesn't report them itself.

| Gate | Requirement it supports | KSI | What the ISSO keeps |
|---|---|---|---|
| G1 | RA-2, CM-12, PM-5(1), AC-6; 32 CFR Part 2002; OMB M-22-09 data categorization | KSI-PIY-GIV, KSI-IAM-ELP | Class register, decision records, inventory export |
| G2 | AC-16, MP-3; 32 CFR Part 2002 marking | KSI-SVC-ACM | Design table, `labels.json`, label test record |
| G3 | AC-16, MP-3, AT-2 | KSI-SVC-ACM, KSI-MLA-RVL | `label-policies.json`, labeled sample, audit export |
| G4 | AC-3, AC-21 | KSI-MLA-RVL | Container label export, site list with labels, test record |
| G5 | SC-12, SC-13, SC-28, AC-5, AC-6 | KSI-SVC-SIN, KSI-SVC-ASM, KSI-IAM-JIT | `aipservice-configuration.json`, PIM history, decryption-continuity record |
| G6 | SC-8, SC-13, AC-4, AC-21; CISA BOD 25-01 | KSI-SVC-SIN | `irm-configuration.json`, transport rules, encrypted test record |
| G7 | AC-3, SC-28 | KSI-SVC-SIN | Tenant settings, IRM library list, test record |
| G8 | AC-4, MP-7, SI-4, IR-4; CISA BOD 25-01 | KSI-SVC-SIN, KSI-SVC-RUD, KSI-MLA-RVL | DLP exports, synthetic test per surface, exception register |
| G9 | AC-16, CM-12; OMB M-22-09 automated categorization | KSI-SVC-ACM | Auto-labeling exports, rule packages, simulation precision record |
| G10 | AU-2, AU-12, AU-6, AU-11, SI-4, AC-5, PM-12; OMB M-26-14; CISA BOD 25-01 | KSI-MLA-LET, KSI-MLA-OSM, KSI-IAM-ELP | Audit status, retention export, synthetic-event record, role register |
| G11 | AC-6, AC-4, SI-4 | KSI-SVC-SIN, KSI-MLA-LET | Copilot DLP export, AI test record, audit export |
| G12 | CM-3, CA-7, IR-4, AU-6 | KSI-SVC-ACM, KSI-CMT-LMC, KSI-INR-RIR | Baseline exports, drift results, metrics, exclusion register |

: Requirements and KSIs by gate {.striped .hover}

## Dangers and how to avoid them {#dangers}

| Danger | What goes wrong | Mitigation |
|---|---|---|
| **A label deleted to undo a change** | Content that carries it keeps a label nobody can interpret | Unpublish or change the label; never delete it ([Chapter 12](../b20-information-protection/12-operations-and-evidence.md#change-control-for-information-protection)) |
| **Encryption before recovery** | Content encrypted to an owner who leaves can't be read | G5's recovery test before encrypting labels go past ring 1 |
| **The super user feature left on** | A standing ability to decrypt everything | Off at rest; on only through the PIM-gated procedure; drift alerts on it ([Chapter 05](../b20-information-protection/05-rights-management-and-recovery.md#how-recover-encrypted-content-through-a-super-user-just-in-time)) |
| **Audit status read in the wrong shell** | `UnifiedAuditLogIngestionEnabled` always reads `False` in Security & Compliance PowerShell, so the check fails or is "fixed" needlessly[^ip-audit-on] | Read it in Exchange Online PowerShell |
| **"Not available" read as zero** | An auto-labeling simulation's partial result is taken as no matches[^ip-autolabel] | Treat it as no result; rerun; export results before editing |
| **A policy turns itself on** | The portal's option enables an auto-labeling policy left unedited seven days after simulation[^ip-autolabel] | Leave the option unselected; check `Mode` after each simulation |
| **Encrypting with user-defined permissions in SharePoint** | The services can't process those files, so search, DLP and co-authoring stop working on them | Administrator-defined permissions for file labels ([Chapter 07](../b20-information-protection/07-sharepoint-and-onedrive.md)) |
| **Label groups migration started casually** | It's irreversible and isn't listed for GCC | A decision record and a test tenant first ([Chapter 02](../b20-information-protection/02-sensitivity-label-architecture.md#b20-02-priority-label-groups-and-the-modern-label-scheme)) |
| **A container label's group settings changed after publication** | The change isn't applied to groups that already carry the label | Create a new label instead ([Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md#labels-on-teams-groups-and-sites)) |
| **A feature assumed in GCC** | A step depends on something listed as in development or not listed at all | Check the [availability table](#government-cloud-availability) at each reassessment; record a decision |
| **A Copilot DLP change tested too soon** | The change takes up to four hours to reach Copilot, so a test passes or fails on the old policy | Wait four hours before testing ([Chapter 11](../b20-information-protection/11-ai-data-security.md#how-govern-sensitive-data-in-ai-interactions)) |

: Dangers in information protection {.striped .hover}

**Rollback** for each gate is in its Book 20 chapter and on one page in the [implementation checklist](../b20-information-protection/12-operations-and-evidence.md#implementation-checklist). Two rules hold for all of them: auditing is never turned off to undo anything, and a label is never deleted.

## What couldn't be verified {#what-couldnt-be-verified}

- **The super user feature in GCC.** The GCC planning page doesn't list it. Confirm it in the test tenant before the recovery procedure depends on it.
- **Label integration for SharePoint and OneDrive (`EnableAIPIntegration`) in GCC.** Not listed separately; the features that depend on it are listed Available.
- **DLP simulation mode and the DLP for Copilot location in GCC.** Not listed as their own rows.
- **A GCC value for `Connect-AipService`.** Learn lists environment values for other clouds but none for Microsoft 365 GCC; Book 20 and this guide use the default.
- **The SharePoint module in PowerShell 7.** Learn's connection page gives only the `-UseWindowsPowerShell` route, which runs the module in Windows PowerShell 5.1; it doesn't say the module runs natively in PowerShell 7.
- **Two rows the GCC page gives twice with different statuses** ("Disable unlocking of records"; the recycle-bin search for eDiscovery). Neither is used by this guide.
- **The FedRAMP KSI mapping.** Carried from [Book 20, Appendix A](../b20-information-protection/appendix-a-requirements-mapping.md), which checked it against fedramp.gov; not re-read for this guide.
- **Tenant behavior.** Nothing in this guide was run in a tenant. Every command is unrun by the authors.

## Back to the books

[Book 20](../b20-information-protection/index.md): [Chapter 01](../b20-information-protection/01-data-inventory-and-classification.md) (classes and inventory) · [Chapter 02](../b20-information-protection/02-sensitivity-label-architecture.md) (taxonomy) · [Chapter 03](../b20-information-protection/03-label-publication-and-defaults.md) (publication and defaults) · [Chapter 04](../b20-information-protection/04-teams-groups-and-sharepoint-containers.md) (containers) · [Chapter 05](../b20-information-protection/05-rights-management-and-recovery.md) (Rights Management and recovery) · [Chapter 06](../b20-information-protection/06-exchange-message-encryption.md) (message encryption) · [Chapter 07](../b20-information-protection/07-sharepoint-and-onedrive.md) (SharePoint and OneDrive) · [Chapter 08](../b20-information-protection/08-dlp-and-endpoint-controls.md) (DLP) · [Chapter 09](../b20-information-protection/09-auto-labeling-and-sensitive-information-types.md) (auto-labeling) · [Chapter 10](../b20-information-protection/10-audit-insider-risk-and-communication-compliance.md) (audit and insider risk) · [Chapter 11](../b20-information-protection/11-ai-data-security.md) (AI data security) · [Chapter 12](../b20-information-protection/12-operations-and-evidence.md) (operations and evidence) · [Appendix A](../b20-information-protection/appendix-a-requirements-mapping.md) (requirements). [Book 12, Chapter 09](../b12-security-operations/09-data-protection-and-classification.md) (CUI and the label taxonomy as code).

[^ip-gcc]: Microsoft Learn, "Plan for Microsoft Purview compliance and risk management solutions – GCC deployments," Step 4 (feature status table, footnote 1 "Identified status is subject to change," footnote 2 on DSPM for AI; page metadata dated August 24, 2026), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/plan-for-microsoft-purview-gcc-deployments> (accessed Nov 24, 2026); mail flow rules in GCC: "Exchange Online for US government environments," <https://learn.microsoft.com/office365/servicedescriptions/office-365-platform-service-description/office-365-us-government/exchange-online-for-us-government-environments> (accessed Nov 11, 2026, for Book 20, Chapter 06).
[^ip-connect-scc]: Microsoft Learn, "Connect to Security & Compliance PowerShell" (no *ConnectionUri* or *AzureADAuthorizationEndpointUri* needed in Microsoft 365 or Microsoft 365 GCC; works in Windows PowerShell 5.1 and PowerShell 7), <https://learn.microsoft.com/powershell/exchange/connect-to-scc-powershell> (accessed Nov 24, 2026).
[^ip-exo-module]: Microsoft Learn, "About the Exchange Online PowerShell module" (current release 3.10.1; module 3.10.0 and later require PowerShell 7.6.0 or later; all versions supported in Windows PowerShell 5.1), <https://learn.microsoft.com/powershell/exchange/exchange-online-powershell-v2> (accessed Nov 24, 2026).
[^ip-aip-install]: Microsoft Learn, "Install the AIPService PowerShell module for the Azure Rights Management service" (Windows PowerShell 5.1, or PowerShell 7.4 and later; PowerShell 7 requires AIPService 3.1.0.0 or later), <https://learn.microsoft.com/purview/install-aipservice-powershell> (accessed Nov 24, 2026).
[^ip-aip-connect]: Microsoft Learn, "Connect-AipService" (roles that can connect; `-EnvironmentName` values AzureCloud, AzureChinaCloud and AzureUSGovernment, none named for Microsoft 365 GCC), <https://learn.microsoft.com/powershell/module/aipservice/connect-aipservice> (accessed Nov 24, 2026).
[^ip-aip-su]: Microsoft Learn, "Configure Azure Rights Management super users for discovery services or data recovery," <https://learn.microsoft.com/purview/encryption-super-users>, and "Get-AipServiceConfiguration" (`SuperUsersEnabled`, `SuperUsers`; "You must use PowerShell to see a full list of protection configuration values"), <https://learn.microsoft.com/powershell/module/aipservice/get-aipserviceconfiguration> (accessed Nov 11, 2026, for Book 20, Chapter 05, and Nov 24, 2026).
[^ip-spo-shell]: Microsoft Learn, "Get started with SharePoint Online Management Shell" (in a PowerShell 7 console, import the module with `-UseWindowsPowerShell`; `Connect-SPOService -Url https://contoso-admin.sharepoint.com`), <https://learn.microsoft.com/powershell/sharepoint/sharepoint-online/connect-sharepoint-online> (accessed Nov 24, 2026).
[^ip-content-explorer]: Microsoft Learn, "Get started with Content Explorer (classic)" (Content Explorer List viewer and Content viewer roles), <https://learn.microsoft.com/purview/data-classification-data-explorer> (accessed Nov 11, 2026, for Book 20, Chapter 01).
[^ip-export-ce]: Microsoft Learn, "Export-ContentExplorerData" (output: TotalCount, MorePagesAvailable, RecordsReturned, PageCookie; one type or label per call), <https://learn.microsoft.com/powershell/module/exchangepowershell/export-contentexplorerdata> (accessed Nov 11, 2026, for Book 20, Chapter 01).
[^ip-get-label]: Microsoft Learn, "Get-Label" (Security & Compliance PowerShell only; `-IncludeDetailedLabelActions` expands label actions into properties), <https://learn.microsoft.com/powershell/module/exchangepowershell/get-label> (accessed Nov 24, 2026).
[^ip-labelpolicy]: Microsoft Learn, "Create and configure sensitivity labels and their policies," <https://learn.microsoft.com/purview/create-sensitivity-labels>, and "Set-LabelPolicy," parameter `-AdvancedSettings`, <https://learn.microsoft.com/powershell/module/exchangepowershell/set-labelpolicy> (accessed Nov 11, 2026, for Book 20, Chapter 03).
[^ip-ome-setup]: Microsoft Learn, "Set up Message Encryption" (verify Rights Management is active; `Test-IRMConfiguration`), <https://learn.microsoft.com/purview/set-up-new-message-encryption-capabilities> (accessed Nov 11, 2026, for Book 20, Chapter 06).
[^ip-spo-labels]: Microsoft Learn, "Enable sensitivity labels for files in SharePoint and OneDrive" (`EnableAIPIntegration`; PDF support; encryption settings the services can't process), <https://learn.microsoft.com/purview/sensitivity-labels-sharepoint-onedrive-files> (accessed Nov 11, 2026, for Book 20, Chapter 07).
[^ip-coauth]: Microsoft Learn, "Enable co-authoring for files encrypted with sensitivity labels," <https://learn.microsoft.com/purview/sensitivity-labels-coauthoring>, and "Set-PolicyConfig" (`-EnableLabelCoauth`), <https://learn.microsoft.com/powershell/module/exchangepowershell/set-policyconfig> (accessed Nov 11, 2026, for Book 20, Chapter 07).
[^ip-dlp-policy]: Microsoft Learn, "New-DlpCompliancePolicy," parameter `Mode` (Enable, Disable, TestWithNotifications, TestWithoutNotifications), <https://learn.microsoft.com/powershell/module/exchangepowershell/new-dlpcompliancepolicy> (accessed Nov 11, 2026, for Book 20, Chapter 08).
[^ip-dlp-audit]: Microsoft Learn, "Microsoft services that support auditing" (record types ComplianceDLPExchange, ComplianceDLPSharePoint, DLPEndpoint), <https://learn.microsoft.com/purview/audit-supported-services> (accessed Nov 11, 2026, for Book 20, Chapter 08).
[^ip-sit-ps]: Microsoft Learn, "Create a custom sensitive information type using PowerShell," <https://learn.microsoft.com/purview/sit-create-a-custom-sensitive-information-type-in-scc-powershell> (accessed Nov 11, 2026, for Book 20, Chapter 09).
[^ip-autolabel]: Microsoft Learn, "Automatically apply a sensitivity label to Microsoft 365 data" (simulation; the option to turn a policy on after seven days), <https://learn.microsoft.com/purview/apply-sensitivity-label-automatically>, and "Review simulation results for auto-labeling policies" (partial results; "Not available"), <https://learn.microsoft.com/purview/auto-label-simulation-results> (accessed Nov 11, 2026, for Book 20, Chapter 09).
[^ip-audit-on]: Microsoft Learn, "Turn auditing on or off" (verify in Exchange Online PowerShell; the value is always False in Security & Compliance PowerShell; changes to auditing status are audited), <https://learn.microsoft.com/purview/audit-log-enable-disable> (accessed Nov 11, 2026, for Book 20, Chapter 10).
[^ip-audit-retention]: Microsoft Learn, "Manage audit log retention policies," <https://learn.microsoft.com/purview/audit-log-retention-policies> (accessed Nov 11, 2026, for Book 20, Chapter 10).
[^ip-audit-bp]: Microsoft Learn, "Best Practices using the Search-UnifiedAuditLog cmdlet tool" (View-Only Audit Logs or Audit Logs role), <https://learn.microsoft.com/office/office-365-management-api/aip-unified-audit-logs-best-practices> (accessed Nov 11, 2026, for Book 20, Chapter 10).
[^ip-copilot-audit]: Microsoft Learn, "Audit log activities," section "Microsoft 365 Copilot admin activities" (`CopilotInteraction`), <https://learn.microsoft.com/purview/audit-log-activities> (accessed Nov 11, 2026, for Book 20, Chapter 11).

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/information-protection-implementation.md).

<!-- revisions:end -->
