---
title: "Chapter 01 — Overview and Applicability"
description: "The proposal: use Federal HR 2.0 and the Active Directory to Entra ID migration together to start HR-driven Entra ID, Active Directory and ICAM, built on OPM standard attributes. The outcomes, the architecture in one paragraph, authority boundaries, principles, where the book applies and where it doesn't, and what federal guidance does and does not require."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b03-hr-identity
book: B03
part: Why
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 01 — Overview and Applicability

*This book is not about implementing HRIT. It is about using Federal HR 2.0, and the move from Active Directory to Entra ID, to start HR-driven identity.*

::: {.callout-note}
## In this chapter
The proposal and why now. The problem it solves, the outcomes it is measured by, the architecture in one paragraph, the boundaries of authority, the principles every chapter follows, where the book applies and where it doesn't, and the federal-policy caution that governs the product-specific material.
:::

## The proposal

Access is now decided by identity: a token and the attributes behind it, evaluated on every request. In most agencies those attributes don't come from the personnel record. IT types them in from tickets, so the record of who works here and the record of who can get in drift apart, and every gap between them is access that shouldn't exist. Two migrations already under way rebuild both ends of that connection: Federal HR 2.0 moves HR onto one government-wide platform, and the move from Active Directory to Entra ID moves identity to the cloud. This book argues for using them together to **start HR-driven identity**, so the HR record becomes the source of authority and accounts, credentials and access follow from it by rule, with evidence.

In many agencies there is no enterprise HR-driven identity lifecycle. Accounts in Active Directory and Entra ID — and the credentials, devices and access that hang off them — are created, changed and removed by tickets, email and manual process. Microsoft describes this starting point plainly: IT staff "have relied on manual methods to create, update, and delete employees," and those processes are error prone, insecure and hard to manage.[^c01-hrdriven]

Two migrations are coming to those agencies regardless:

- **HR moves to the Core HCM platform.** Federal HR 2.0 consolidates more than 100 agency Core HCM systems onto one government-wide platform, Oracle Fusion Cloud HCM, with new interconnections and HR data reviewed and migrated for the move (Chapter 03).[^c01-hr20][^c01-award]
- **Identity moves from Active Directory toward Entra ID.** Microsoft's path is to transfer users' *source of authority* (SOA), meaning which directory masters the account object, from Active Directory to the cloud and govern the user lifecycle with Microsoft Entra ID Governance, keeping Active Directory accounts only where applications still need them.[^c01-soa][^c01-road]

The proposal is to use the two together as the opportunity to **start HR-driven identity**: the HR system of record becomes the source of authority for who works here, in what role and for whom, and Entra ID, Active Directory and the rest of ICAM follow from it by rule, with evidence. Microsoft calls this HR-driven provisioning — "the process of creating digital identities based on a human resources system," in which "the HR systems become the source of authority."[^c01-hrdriven] This book adds two things Microsoft's guidance leaves to the agency. For federal employees, the contract is **OPM's standard personnel data** — the government-wide data standards and nature-of-action codes — not one vendor's field names. And because HRIT covers federal employees only, **contractors and vendors** — tracked today in contracting officer's representative (COR) spreadsheets — need their own authoritative source, mapped into the same model (Chapter 06).

![The proposal: Federal HR 2.0 moves HR to Core HCM and the Entra ID migration moves identity to the cloud; together they start HR-driven identity, with OPM standard attributes as the contract, driving Entra ID, Active Directory and ICAM.](../../images/diagrams/b03-hr-identity/svg/ch01-thesis.svg){#fig-ch01-thesis fig-alt="A left-to-right flow. Two grey boxes on the left: Migration 1, HR moves to Core HCM (Federal HR 2.0: new platform, new interconnections, cleaned data), and Migration 2, Identity moves to Entra ID (users' object source of authority, the object SOA, moves from AD to the cloud). Migration 1 feeds an amber box, The contract: OPM standard attributes (data standards and personnel actions). The amber box and Migration 2 both feed a blue box, Start of authority: HR-driven identity (governed model, provenance per event). That feeds Entra ID and AD (accounts created, changed and disabled by HR events), which feeds a green box, ICAM (credentials, devices, access, assurance and evidence)."}

### Why now

Zero Trust is now federal strategy. OMB M-22-09 sets it, NIST SP 800-207 describes the architecture and CISA's Zero Trust Maturity Model measures it, with identity as its first pillar.[^c01-m2209][^c01-sp800207][^c01-ztmm] In this book's design, SASE is how Zero Trust is delivered at the network edge, and TIC 3.0 is what opened that path for agencies by dropping the requirement that agency traffic pass through a physical TIC access point.[^c01-m1926] Both move every access decision off the network perimeter and onto identity, and ICAM drives those decisions. In Entra ID the user presents a token from a phishing-resistant credential, and access is decided by Conditional Access and dynamic groups that read employee attributes.[^c01-dynamic] The accuracy of employee data now *is* the accuracy of access (Chapter 02).

### Why together

Done separately, each migration undercuts the other. The directory migration on its own moves ticket-created accounts to the cloud as they are. An HR feed built on its own targets a directory that is about to change. Done together, each population moves to Entra ID already sourced from HR, and the Active Directory accounts that remain are provisioned from the same source.

## The problem

Hire, transfer, conversion, leave and separation are recorded as effective-dated workforce events. Identity and access services learn about them later — by ticket, by email, by periodic reconciliation, or by audit finding. The delay produces day-one access gaps, stale organizational attributes, access retained after a move, duplicate identities after a conversion or rehire, and accounts and credentials that stay active after their business justification has ended (Chapter 02).

Adding a connector doesn't solve that by itself. The task is to establish a governed workforce identity model built on standard attributes, connect authoritative events to the services that must act on them, make those actions resilient and observable, and measure the time from business event to verified identity outcome.

## The modernization outcomes

The book is organized around these outcomes:

- day-one readiness for covered workforce populations;
- logical-access blocking at separation;
- completion of PIV, derived credential, device certificate, session, entitlement, and application-specific revocation actions;
- removal of access derived from a prior assignment;
- correlation between current workforce records and enabled enterprise accounts;
- identification and resolution of orphaned or unmatched accounts;
- explainability of covered access from authority through rule or approved exception; and
- audit and continuous-monitoring evidence produced by normal operation.

The canonical model, source transformations, provisioning services, workflows, and mappings are the means. These outcomes are the objectives.

## The architecture in one paragraph

Core HCM publishes effective-dated facts about people, affiliations, positions, assignments, worker types and supervisors, expressed in OPM's standard data elements and personnel actions. Source-boundary transformations validate and normalize those facts into a governed workforce identity model. Provisioning and lifecycle services — in the Microsoft implementation, Entra ID's API-driven inbound provisioning and Lifecycle Workflows, which Microsoft documents for Oracle Fusion Cloud HCM specifically[^c01-oracle-hcm] — deliver the model to Entra ID and Active Directory and through them to credentialing, endpoint, privileged-access, application and evidence services according to approved policy. Identity platforms remain authoritative for credentials, authentication, sessions, directory objects and enforcement. Every material action produces an outcome, exception or reconciliation record.

## The ask

Decide now to start HR-driven identity, and build it into both migrations rather than retrofitting it after they finish:

- name identity as a consumer of the agency's Core HCM interconnection, and HR as the source in the Entra ID migration plan;
- establish the standard-attribute crosswalk, the authority map and the privacy basis before automating anything;
- use effective-dated personnel actions to drive joiner, mover, leaver, rehire and conversion;
- cut each population over to HR-driven identity as it moves to Entra ID, and close the ticket path for it;
- instrument every delivery path, define failure and reconciliation behavior, and measure business-event-to-outcome latency.

## Authority boundaries

The human capital system is authoritative for employment and assignment facts to the extent those facts are created and governed there. The identity platform is authoritative for credentials, authentication methods, sessions, directory objects, and policy enforcement. The credentialing system remains authoritative for PIV issuance and revocation. Endpoint-management and PKI services remain authoritative for managed-device actions and device certificates. Application owners remain responsible for application-specific accounts and entitlements that enterprise identity services don't govern.

No system becomes authoritative because it receives a copy. No source field should drive access until the agency has approved its owner, meaning, values, quality expectations, correction path, and permitted use.

## Architectural principles

**Business authority before automation.** Automation magnifies the quality of its inputs. A designated source also has to be correct, timely, and governed enough for the decision it drives.

**Standards before vendor fields.** The durable contract is OPM's standard personnel data, mapped once into the governed identity model. Core HCM extracts, event feeds, REST interfaces, SCIM payloads and vendor-specific field names are implementation details at the system boundary. A source change alters the source contract and transformation; it doesn't require lifecycle and access policy to be rewritten. OPM's standards describe federal employees; contractors and vendors come from a separate source and map into the same model.

**Block first, reconcile to completion.** At an effective separation or emergency termination, disable sign-in and revoke sessions first. PIV and derived credentials, managed devices, certificates, entitlements, licenses, and application-specific access are then revoked or removed in parallel where practical and tracked to verified completion. A slow or unavailable external system must not delay the primary logical-access block. Chapter 09 gives the sequence.

**Native attributes first.** Organizational placement is carried by approved attributes and the manager relationship, not by directory-container position. Extensions are added only when a required policy can't use a supported native property.

**Privacy by design.** Moving personnel data into a directory is a disclosure. Identity is a routine-use consumer of the HR system of records and receives only the attributes its decisions read (Appendix B).

**Control support, not control closure.** The architecture implements mechanisms and produces evidence that support controls such as account management, identifier management, personnel termination, personnel transfer, and information management. It doesn't establish compliance by itself. Control satisfaction also depends on approved agency policy, organization-defined parameters, operating procedures, inherited controls, privacy and records decisions, exception handling, and assessment.

## Where this book applies

- **Cloud:** a federal civilian agency using Microsoft 365 GCC (GCC-Moderate), whose Entra ID tenant runs in Microsoft's commercial Azure cloud, with commercial Azure services where the middleware needs them, under a FedRAMP Moderate authorization — subject to confirming tenant licensing, endpoint availability, and authorization boundaries.[^c01-gcc][^c01-gcc-cloud]
- **Workforce source:** for federal employees, an Executive Branch civilian agency preparing for or operating on the Federal HR 2.0 Core HCM platform (Oracle Fusion Cloud HCM), or any other source that can provide governed workforce records and effective-dated changes. For contractors and vendors, which HRIT does not cover, the source the agency designates (Chapter 06).
- **Starting point:** agencies with no HR-driven provisioning today, where accounts come from tickets — the common case. Agencies that already run an HR-to-directory connector can use the same material to replace it.
- **Directories:** hybrid estates where some users are still mastered in on-premises Active Directory and others are, or are becoming, cloud-managed in Entra ID.
- **Populations:** employees and other human affiliations for which the agency has identified an authoritative source, a lifecycle owner, and approved policy.

## Where it doesn't apply as written

- GCC High, DoD, national security, military personnel, and Intelligence Community environments, which need separate validation of scope, endpoints, services, and governing requirements. The Federal HR 2.0 memo initially excludes military personnel and Intelligence Community agencies.[^c01-hr20]
- Non-person identities — service accounts, managed identities, application identities, shared accounts, robotic automation. They need a companion authority and lifecycle model and shouldn't be forced into the human-worker pattern because the same directory stores them.
- The directory migration itself (moving objects and applications from AD to Entra ID), which is the companion [Book 02 — Identity & Directory](../b02-identity/index.md), in particular [Chapter 09 — Building the Entra ID Target](../b02-identity/09-building-the-entra-target.md). This book covers where that migration's users come from.
- Application modernization. Legacy applications with local accounts, proprietary roles, RACF profiles, shared credentials, or nonstandard deprovisioning paths need an application-specific integration and revocation plan.
- A production interface specification for Federal HR 2.0. Procurement requirements, awarded-product capabilities, agency onboarding schedules, and post-award interfaces have to be verified at engagement time.

## One caution, stated up front

**No OPM document mandates or specifies Entra ID integration for the agency's own directory.** OPM's Core HCM solicitation names an Entra-based identity solution only for OPM's side, the platform's own sign-in and users, and lists an HR-fed identity interconnection only as a sample (Chapter 03).[^c01-pws] That is the opening, not an obstacle: OPM fixes the HR side, and the identity side is the agency's decision to make. Federal guidance is deliberately product-neutral. OMB M-19-17 sets the federal enterprise ICAM policy framework,[^c01-m1917] and the GSA/FICAM Identity Lifecycle Management Playbook — best practice, explicitly "not official policy" — recommends that agencies designate HR systems as the authoritative source for identity creation and termination and describes the create, modify and delete stages that joiner-mover-leaver doctrine builds on.[^c01-ilm] The Entra, Graph, Lifecycle Workflows, Conditional Access, Intune, and Microsoft Cloud PKI material in this book comes from Microsoft's own guidance and the agency's implementation decisions, not from OPM. Don't cite this book as OPM guidance for the Entra leg.

The Evidence Act supports reliable, governed evidence for agency decisions; this book doesn't cite it as a requirement for one system of record per data type.

## The enterprise data architecture contribution

This is an enterprise data architecture problem before it is an identity-product problem. The contribution, in one sentence: **establish authority, identifiers, standards, lineage and evidence, so workforce events produce measurable identity outcomes.**

| Contribution | What it means here | Where |
|---|---|---|
| Authority | One owner for every attribute; corrections flow upstream | Chapter 04 |
| Identifiers | An enterprise person key with layered source, affiliation, directory and credential keys | Chapter 04 |
| Standards | OPM data standards and nature-of-action codes as the shared vocabulary; one governed crosswalk | Chapters 06–08 |
| Lineage | A provenance record for every event, from the personnel action to every consumer | Chapters 05, 11 |
| Evidence | Lifecycle metrics, drift findings and control support produced by normal operation | Chapter 11 |

: The enterprise data architecture contribution {.striped .hover}

The architecture is stable; the products that realize it are replaceable (Chapter 05).

## What success looks like

A covered identity can be traced from a personnel action in Core HCM to its directory objects, credentials, devices, access decisions, exceptions, and evidence. A joiner is ready within an approved threshold. A mover's access converges on the new assignment and residual access is reviewed. A leaver's logical access is blocked immediately and every linked revocation action is reconciled to completion. No account is created by ticket for a covered population. Drift is measurable, ownership is explicit, and a change of source system doesn't require the lifecycle policy to be redesigned.

::: {.callout-tip}
## Continue the book
[← Previous: Book 03 — HR-Driven Identity](index.md) · [Book index](index.md) · [Next: Chapter 02 — Why HR Is the Source of Authority →](02-why-hr-is-the-source-of-authority.md)
:::

[^c01-hrdriven]: Microsoft Learn, "What is HR-driven provisioning?," <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/what-is-hr-driven-provisioning> (accessed Oct 20, 2026).
[^c01-hr20]: Office of Management and Budget and Office of Personnel Management, *Creating "Federal HR 2.0" by Consolidating Core Human Capital Management Across the Federal Government*, December 10, 2025, <https://www.opm.gov/chcoc/latest-memos/creating-federal-hr-20-by-consolidating-core-human-capital-management-across-the-federal-government.pdf> (accessed Oct 20, 2026). "More than 100 unique Core HCM software systems" (p. 1); exclusion of military personnel and Intelligence Community agencies (p. 1, note 3); data-migration preparation (Appendix C).
[^c01-award]: Office of Personnel Management, "OPM Awards Contract for First Ever Governmentwide HR Platform," <https://www.opm.gov/news/news-releases/opm-awards-contract-for-first-ever-governmentwide-hr-platform/> (accessed Oct 20, 2026); Oracle, "U.S. Office of Personnel Management Selects Oracle to Power Federal Workforce Modernization," June 11, 2026 (names Oracle Fusion Cloud Human Capital Management), <https://www.prnewswire.com/news-releases/us-office-of-personnel-management-selects-oracle-to-power-federal-workforce-modernization-302798451.html> (accessed Oct 20, 2026).
[^c01-soa]: Microsoft Learn, "Transfer user Source of Authority (SOA) to Microsoft Entra ID," <https://learn.microsoft.com/en-us/entra/identity/hybrid/user-source-of-authority-overview> (accessed Oct 20, 2026).
[^c01-road]: Microsoft Learn, "Transition to the cloud" (Move to cloud HR provisioning), <https://learn.microsoft.com/en-us/entra/architecture/road-to-the-cloud-migrate> (accessed Oct 20, 2026).
[^c01-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 20, 2026).
[^c01-sp800207]: National Institute of Standards and Technology, SP 800-207, *Zero Trust Architecture*, August 2020, <https://csrc.nist.gov/pubs/sp/800/207/final> (accessed Oct 20, 2026).
[^c01-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023, §5.1 Identity, <https://www.cisa.gov/sites/default/files/2023-04/CISA_Zero_Trust_Maturity_Model_Version_2_508c.pdf> (accessed Oct 20, 2026).
[^c01-m1926]: Office of Management and Budget, M-19-26, *Update to the Trusted Internet Connections (TIC) Initiative*, September 12, 2019, <https://www.whitehouse.gov/wp-content/uploads/2019/09/M-19-26.pdf> (accessed Oct 20, 2026). The memo notes that earlier TIC policy required traffic to flow through a physical TIC access point, which had become an obstacle to cloud adoption.
[^c01-dynamic]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID," <https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership> (accessed Oct 20, 2026).
[^c01-oracle-hcm]: Microsoft Learn, "Configure Oracle Human Capital Management (HCM) for automatic user provisioning," <https://learn.microsoft.com/en-us/entra/identity/saas-apps/oracle-hcm-provisioning-tutorial> (accessed Oct 20, 2026).
[^c01-gcc]: Microsoft Learn, "Plan for Microsoft 365 Government - GCC deployments" (GCC "provides compliance with US government requirements for cloud services, including FedRAMP Moderate"), <https://learn.microsoft.com/en-us/microsoftteams/plan-for-government-gcc> (accessed Oct 20, 2026).
[^c01-gcc-cloud]: Microsoft Learn, "Cross-cloud collaboration with Microsoft 365" (Microsoft 365 GCC is in the Microsoft Azure Commercial cloud environment), <https://learn.microsoft.com/en-us/microsoft-365/enterprise/cross-cloud-collaboration> (accessed Oct 20, 2026).
[^c01-m1917]: Office of Management and Budget, M-19-17, *Enabling Mission Delivery through Improved Identity, Credential, and Access Management*, May 21, 2019, <https://www.whitehouse.gov/wp-content/uploads/2019/05/M-19-17.pdf> (accessed Oct 20, 2026).
[^c01-ilm]: General Services Administration, IDManagement.gov, *Identity Lifecycle Management Playbook* (Disclaimer; Executive Summary; lifecycle stages), <https://www.idmanagement.gov/playbooks/ilm/> (accessed Oct 20, 2026).
[^c01-pws]: Office of Personnel Management, Solicitation 24322626R0007, *Federal HRIT Modernization*, Amendment 4 (December 11, 2025), Performance Work Statement §5.1.1(3) (p. 26: "Integrate and implement OPM approved identity management solution using OPM MS Entra-based solution") and Appendix B (p. 95: *Sample Interconnection for Large Department/Agency*, "Identity Management Solution"), SAM.gov, <https://sam.gov/workspace/contract/opp/8cfe1844758c4fb2b10f5ef192b62f89/view> (accessed Oct 25, 2026).
