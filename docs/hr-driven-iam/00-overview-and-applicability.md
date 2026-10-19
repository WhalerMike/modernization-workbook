---
title: "Chapter 00 — Overview and Applicability"
description: "The modernization outcomes, the governed workforce identity model in one paragraph, authority boundaries, architectural principles, where the series applies (Microsoft 365 GCC, Federal HR 2.0 agencies, hybrid estates) and where it doesn't, and what federal guidance does and does not require."
doc-type: hr-driven-iam-chapter
audience: [Executive, Technical, Customer]
family: hr-driven-iam
series-order: 0
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
aliases:
  - /docs/whitepapers/federal-hrit-productization.html
---

# Chapter 00 — Overview and Applicability

*The modernization goal is not a better HR connector. It is workforce identity changes that are timely, explainable, and measurable.*

::: {.callout-note}
## In this chapter
The problem the series addresses, the outcomes it is organized around, the architecture in one paragraph, the boundaries of authority, the principles every chapter follows, where the series applies and where it doesn't, and the federal-policy caution that governs the product-specific material.
:::

## The problem

Hire, transfer, conversion, leave, and separation are recorded as effective-dated workforce events. Identity and access services usually learn about them later — by ticket, by email, by periodic reconciliation, or by audit finding. The delay produces day-one access gaps, stale organizational attributes, access retained after a move, duplicate identities after a conversion or rehire, and accounts and credentials that stay active after their business justification has ended. Federal HR 2.0 is also consolidating Core HCM systems, which changes the feeds agencies integrate against today.

Replacing one connector with another doesn't solve that by itself. The modernization task is to establish a governed workforce identity model, connect authoritative events to the services that must act on them, make those actions resilient and observable, and measure the time from business event to verified identity outcome.

## The modernization outcomes

The series is organized around these outcomes:

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

Authoritative workforce systems publish effective-dated facts about people, affiliations, positions, assignments, worker types, and supervisors. Source-boundary transformations validate and normalize those facts into a governed workforce identity model. Provisioning and lifecycle services — in the Microsoft implementation, Entra ID's API-driven inbound provisioning and Lifecycle Workflows — deliver the model to Active Directory, Entra ID, credentialing, endpoint, privileged-access, application, and evidence services according to approved policy. Identity platforms remain authoritative for credentials, authentication, sessions, directory objects, and enforcement. Every material action produces an outcome, exception, or reconciliation record.

## The ask

Establish the governed workforce identity model and its authority map before automating lifecycle or access. Use effective-dated workforce events to initiate joiner, mover, leaver, rehire, and conversion actions. Treat source-specific mapping as replaceable boundary logic, not as the architecture. Instrument every delivery path, define failure and reconciliation behavior, and measure business-event-to-outcome latency.

## Authority boundaries

The human capital system is authoritative for employment and assignment facts to the extent those facts are created and governed there. The identity platform is authoritative for credentials, authentication methods, sessions, directory objects, and policy enforcement. The credentialing system remains authoritative for PIV issuance and revocation. Endpoint-management and PKI services remain authoritative for managed-device actions and device certificates. Application owners remain responsible for application-specific accounts and entitlements that enterprise identity services don't govern.

No system becomes authoritative because it receives a copy. No source field should drive access until the agency has approved its owner, meaning, values, quality expectations, correction path, and permitted use.

## Architectural principles

**Business authority before automation.** Automation magnifies the quality of its inputs. A designated source also has to be correct, timely, and governed enough for the decision it drives.

**Canonical model before source mechanics.** The durable contract is the governed workforce identity model. Oracle extracts, event feeds, REST interfaces, SCIM payloads, and vendor-specific mappings are implementation details at the system boundary. A source change alters the source contract and transformation; it doesn't require lifecycle and access policy to be rewritten.

**Block first, reconcile to completion.** At an effective separation or emergency termination, disable sign-in and revoke sessions first. PIV and derived credentials, managed devices, certificates, entitlements, licenses, and application-specific access are then revoked or removed in parallel where practical and tracked to verified completion. A slow or unavailable external system must not delay the primary logical-access block. Chapter 07 gives the sequence.

**Native attributes first.** Organizational placement is carried by approved attributes and the manager relationship, not by directory-container position. Extensions are added only when a required policy can't use a supported native property.

**Control support, not control closure.** The architecture implements mechanisms and produces evidence that support controls such as account management, identifier management, personnel termination, personnel transfer, and information management. It doesn't establish compliance by itself. Control satisfaction also depends on approved agency policy, organization-defined parameters, operating procedures, inherited controls, privacy and records decisions, exception handling, and assessment.

## Where this series applies

- **Cloud:** a federal civilian agency using Microsoft 365 GCC (GCC-Moderate) and Entra ID in the commercial cloud, with commercial Azure services where the middleware needs them, under a FedRAMP Moderate authorization — subject to confirming tenant licensing, endpoint availability, and authorization boundaries.
- **Workforce source:** an Executive Branch civilian agency preparing for or operating on the Federal HR 2.0 Core HCM platform (Oracle Fusion Cloud HCM), or any other source that can provide governed workforce records and effective-dated changes.
- **Directories:** hybrid estates where some users are still mastered in on-premises Active Directory and others are cloud-mastered in Entra ID. Both are covered, because most agencies run both during coexistence.
- **Populations:** employees and other human affiliations for which the agency has identified an authoritative source, a lifecycle owner, and approved policy.

## Where it doesn't apply as written

- GCC High, DoD, national security, military personnel, and Intelligence Community environments, which need separate validation of scope, endpoints, services, and governing requirements. The Federal HR 2.0 memo initially excludes military personnel and the Intelligence Community.
- Non-person identities — service accounts, managed identities, application identities, shared accounts, robotic automation. They need a companion authority and lifecycle model and shouldn't be forced into the human-worker pattern because the same directory stores them.
- Directory migration itself (moving objects from AD to Entra ID), which is the companion [AD → Entra ID Identity Modernization Guide](../operational-guides/identity/identity-modernization.md).
- Application modernization. Legacy applications with local accounts, proprietary roles, RACF profiles, shared credentials, or nonstandard deprovisioning paths need an application-specific integration and revocation plan.
- A production interface specification for Federal HR 2.0. Procurement requirements, awarded-product capabilities, agency onboarding schedules, and post-award interfaces have to be verified at engagement time.

## One caution, stated up front

**No OPM document mandates or specifies Entra ID integration.** Federal guidance is deliberately product-neutral. OMB M-19-17 sets the federal enterprise ICAM policy framework, and the GSA/FICAM Identity Lifecycle Management Playbook — best practice, explicitly not policy — recommends authoritative workforce sources for identity creation and termination and supplies the joiner-mover-leaver doctrine. The Entra, Graph, Lifecycle Workflows, Conditional Access, Intune, and Microsoft Cloud PKI material in this series comes from Microsoft's own guidance and the agency's implementation decisions, not from OPM. Don't cite this series as OPM guidance for the Entra leg.

The Evidence Act supports reliable, governed evidence for agency decisions; this series doesn't cite it as a requirement for one system of record per data type.

## What success looks like

A covered identity can be traced from an authoritative workforce record to its directory objects, credentials, devices, access decisions, exceptions, and evidence. A joiner is ready within an approved threshold. A mover's access converges on the new assignment and residual access is reviewed. A leaver's logical access is blocked immediately and every linked revocation action is reconciled to completion. Drift is measurable, ownership is explicit, and a change of source system doesn't require the lifecycle policy to be redesigned.

::: {.callout-tip}
## Continue the series
[Index](index.md) · [Next: Chapter 01 — Why HR Is the Source of Authority →](01-why-hr-is-the-source-of-authority.md)
:::
