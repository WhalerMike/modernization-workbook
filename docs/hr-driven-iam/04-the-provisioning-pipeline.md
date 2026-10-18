---
title: "Chapter 04 — The Provisioning Pipeline"
description: "API-driven inbound provisioning end to end: the Oracle HCM source surfaces, the four middleware duties, the bulkUpload contract and its limits, the two landing zones (Active Directory through the provisioning agent, Entra ID directly), native connectors, and one-way writeback."
doc-type: hr-driven-iam-chapter
audience: [Executive, Technical, Customer]
family: hr-driven-iam
series-order: 4
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
aliases:
  - /docs/guides/hr-driven-lifecycle.html
---

# Chapter 04 — The Provisioning Pipeline

*One door into the directory, so there is exactly one door to instrument.*

::: {.callout-note}
## In this chapter
Why the canonical path is API-driven inbound provisioning. The Oracle HCM source surfaces. What the middleware must do for every event. The `bulkUpload` contract and its limits. The two landing zones and what each one does with structure. Native connectors and writeback.
:::

## The shape

> **HR system of record → integration middleware → Microsoft Graph `/bulkUpload` → Entra provisioning service → Entra ID or on-premises Active Directory**

The API client reads identity data from the authoritative source and posts it to the provisioning app's `/bulkUpload` endpoint as a SCIM bulk request. It doesn't compare source and target values to decide whether to create, update, enable or disable; the provisioning service does that, applies the attribute mappings the administrator configured, and writes the user to on-premises AD (hybrid users) or to Entra ID (cloud-only users). The endpoint answers `202 Accepted` and processes asynchronously; the client reads the provisioning logs API for the per-record result and resubmits failures.[^c04-api-concepts]

## Why this path and no other

- **Oracle Fusion Cloud HCM has no native Entra connector.** Entra's prebuilt HR connectors are for Workday and SAP SuccessFactors. Microsoft's own Oracle HCM integration guidance *is* the API-driven pattern: CSV extracts for the initial load, ATOM feeds or HCM Extracts for deltas, and optional writeback through Oracle's SCIM APIs.[^c04-oracle-tutorial]
- **The architecture is source-agnostic; the deployed source is configuration.** The middleware normalizes any HR export into the same SCIM payload, so the `/bulkUpload` call is identical whatever the source. If the source changes, the adapter changes; the pipeline and everything downstream don't.
- **One entry point gives one provenance stream.** All inbound identity writes pass through a single provisioning surface, which is what makes lineage and drift detection tractable (Chapter 09).
- **The procurement points the same way.** The Core HCM solicitation's requirements checklist asks for SCIM 2.0 near-real-time provisioning, the protocol this pipe speaks (Chapter 02).

If Microsoft later ships a native Oracle HCM connector, it becomes an optimization inside this architecture, not a replacement for it.

## The source: Oracle Fusion Cloud HCM

| Sync | Mechanism | Notes |
|---|---|---|
| Initial / full | HCM Extracts (or BI Publisher) to CSV | Full worker population, scoped by the filter rules of Chapter 10, Phase 1 |
| Delta | ATOM feeds: `newhire`, `empassignment`, `empupdate`, `termination`, `cancelworkrelship`, `workrelshipupdate` | Turn on immediately after the initial sync; a gap loses changes |
| Delta (alternative) | Periodic HCM Extract deltas | Simpler; latency equals the extract cadence |
| Enrichment | `workers` / `employees` REST endpoints | When a feed event doesn't carry an attribute the payload needs |

: Oracle HCM source surfaces {.striped .hover}

**Match key:** Oracle `PersonNumber` to `employeeId` in Entra ID and AD. The employee ID must be populated on existing accounts **before** the first full sync; matching is what prevents duplicate identities at go-live.

## The middleware: four duties per event

Azure Functions or Logic Apps, inside the agency's authorization boundary, doing four things for every event:

1. **Validate.** Required attributes present; unknown worker types refused. Fail closed.
2. **Sequence and retry.** Apply feed events in order and handle failures explicitly. An out-of-order mover/leaver pair is a correctness bug and a dropped event is a silent drift source. A failed transform retries and is recorded, never skipped.
3. **Normalize to SCIM.** Build the bulk request (`urn:ietf:params:scim:api:messages:2.0:BulkRequest`) with the core and enterprise user schemas, plus a schema extension for any attribute the core schemas don't carry.[^c04-api-concepts] The canonical payload is defined in Chapter 05.
4. **Write provenance.** One record per event (source event ID, payload hash, derivation inputs, outcome) to the agency's evidence store, before the Graph call returns. No record, no closure.

The middleware never writes back to the HR system's HR-mastered facts. Send the complete user record in every request, for full and delta syncs alike: if clearing attribute values is enabled, an omitted or null mapped attribute can clear the target value.[^c04-api-concepts]

## The `/bulkUpload` contract

| Property | Value |
|---|---|
| Endpoint | Microsoft Graph, worldwide endpoint `graph.microsoft.com` (Microsoft 365 GCC tenants use the worldwide endpoints)[^c04-graph-deployments] |
| Payload | SCIM bulk request; up to 50 operations per call |
| Throttling | 40 calls in any 5-second window; HTTP 429 beyond it |
| Tenant daily cap | 2,000 calls per 24 hours with Entra ID P1/P2; 6,000 with Entra ID Governance |
| Graph permissions for the client | `SynchronizationData-User.Upload` and `ProvisioningLog.Read.All` |
| Licensing floor | Entra ID P1; Entra ID Governance for Lifecycle Workflows |

: The `/bulkUpload` envelope[^c04-api-concepts] {.striped .hover}

Each endpoint belongs to one provisioning app, and an agency with several sources (HR for employees, a contractor system, a badging system that only updates attributes) creates one app per source.[^c04-api-concepts][^c04-api-faqs]

## Two landing zones

The same HR feed can land in two places, separately or at the same time:

- **API-driven inbound provisioning to Microsoft Entra ID** creates cloud-only users directly.
- **API-driven inbound provisioning to on-premises Active Directory** delivers the same payloads through the Microsoft Entra provisioning agent, which writes to AD DS from inside the agency network; Entra Connect then projects the user to the cloud.[^c04-api-concepts][^c04-oracle-tutorial]

### Landing in Active Directory

- **The OU is computed, not hand-picked.** An expression mapping on `parentDistinguishedName` derives the destination domain and OU from HR attributes.[^c04-plan-hr]
- **The reporting line becomes a reference.** The provisioning service writes AD's `manager` attribute as a DN reference to the already-provisioned supervisor; for cross-domain managers Microsoft recommends a separate app that updates only `manager`.[^c04-plan-hr]
- **High availability.** Deploy at least two provisioning agents, on servers with line of sight to the domain controllers.[^c04-plan-hr] The agent service runs as a group managed service account (gMSA); Domain or Enterprise Administrator credentials are needed once, to create it, not to run the agent.[^c04-agent-prereq] Delegate the gMSA rights to the target OUs only.
- **Termination reaches the domain controller.** The SCIM `active` value maps to AD's `accountDisabled`, so an HR termination disables the AD account, and Entra Connect carries that state to the cloud.[^c04-oracle-tutorial][^c04-plan-hr]

The caveat: **AD stores structure as place.** An OU is a container, and Group Policy that reads OU position inherits every reorganization. HR-driven provisioning keeps AD *correct*; it can't make AD attribute-native.

### Landing in Entra ID

Entra ID has no OUs. The worker record lands as attributes, and structure becomes data: `manager` (a directory relationship that drives the org chart in Teams and Outlook and approval routing), `department`, `jobTitle`, `employeeId`, `employeeType`, `employeeHireDate`, `employeeLeaveDateTime`, and `employeeOrgData` (`division`, `costCenter`). Chapter 05 fixes which of these the agency uses and for what; Chapter 08 shows how they become access.

| Dimension | Active Directory | Entra ID |
|---|---|---|
| Structural container | OU tree: structure as place, which GPO reads | None: structure as attributes, which policy reads through groups |
| Reporting line | `manager` DN reference | `manager` relationship |
| Org placement | OU computed at provisioning (`parentDistinguishedName`) | `department`, `employeeOrgData`, stamped |
| Membership | Static groups, manual or scripted | Rules for dynamic membership, evaluated by the service |
| Delegated admin | OU ACL delegation | Administrative units |
| Reorganization cost | OU restructure and GPO re-link: a project | Attribute re-stamp and rule re-evaluation: a data change |

: How each directory absorbs organizational structure {.striped .hover}

During coexistence, provision both zones, read structure from attributes, and retire OU-bound policy deliberately (Chapter 10, Phase 5).

## Native connectors

Where an HR source has a native connector (Workday, SAP SuccessFactors), it's an acceptable accelerator. The API-driven path stays canonical because it works for any source and because its middleware is where validation and provenance happen before the identity platform sees the record.

## Writeback: optional and one-way per attribute

Once inbound provisioning is proven, an optional outbound job can write identity-platform-mastered attributes the HR system wants to display (username, work email, work phone) back to Oracle HCM through its SCIM APIs.[^c04-oracle-tutorial] Two rules keep it safe: no attribute is writable in both directions (Chapter 03), and nothing in the plan depends on writeback.


::: {.callout-tip}
## Continue the series
[← Previous: Chapter 03 — Attribute Authority](03-attribute-authority.md) · [Index](index.md) · [Next: Chapter 05 — The Canonical Attribute Schema →](05-canonical-attribute-schema.md)
:::

[^c04-api-concepts]: Microsoft Learn, "API-driven inbound provisioning concepts," <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-concepts> (accessed Oct 19, 2026).
[^c04-oracle-tutorial]: Microsoft Learn, "Configure Oracle Human Capital Management (HCM) for automatic user provisioning," <https://learn.microsoft.com/en-us/entra/identity/saas-apps/oracle-hcm-provisioning-tutorial> (accessed Oct 19, 2026).
[^c04-graph-deployments]: Microsoft Learn, "National cloud deployments" (Microsoft Graph): "If you're working in a Microsoft 365 GCC environment, continue using the worldwide endpoints," <https://learn.microsoft.com/en-us/graph/deployments> (accessed Oct 19, 2026).
[^c04-api-faqs]: Microsoft Learn, "Frequently asked questions about API-driven inbound provisioning," <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-faqs> (accessed Oct 19, 2026).
[^c04-agent-prereq]: Microsoft Learn, "Prerequisites for Microsoft Entra Cloud Sync" (provisioning agent and gMSA requirements), <https://learn.microsoft.com/en-us/entra/identity/hybrid/cloud-sync/how-to-prerequisites> (accessed Oct 19, 2026).
[^c04-plan-hr]: Microsoft Learn, "Plan cloud HR application to Microsoft Entra user provisioning," <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/plan-cloud-hr-provision> (accessed Oct 19, 2026).
