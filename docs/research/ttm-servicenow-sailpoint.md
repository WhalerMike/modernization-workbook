---
title: "Ticket-to-Machine on ServiceNow and SailPoint: An Example"
subtitle: "A vendor-named companion to the vendor-neutral Book 13 Appendix B: the same loop, lanes and identity fixes, worked through on ServiceNow and SailPoint Identity Security Cloud"
description: "Research under review: an example implementation of Book 13's Ticket-to-Machine loop and the identity-maintenance fix catalog on ServiceNow (the front door and the record) and SailPoint Identity Security Cloud (identity governance), with what each product documents, where the integration falls short of the loop, and the federal availability of each piece."
research-status: in review
research-type: implementation guide
research-book: "Books 13, 15"
date-modified: 2026-10-24
last-reviewed: 2026-10-24
---

# Ticket-to-Machine on ServiceNow and SailPoint: An Example {.unnumbered}

::: {.callout-note}
## An example, not a recommendation
[Book 13, Appendix B — Ticket-to-Machine Reference](../books/b13-governance/appendix-b-ticket-to-machine-reference.md) is vendor-neutral on purpose: the loop runs on "whatever ITSM platform the agency already has." This companion picks two products to show what the loop looks like in practice: **ServiceNow** as the front door and the record, and **SailPoint Identity Security Cloud (ISC)** as identity governance. Other products can fill the same slots. Product facts are the vendors' own statements, checked on October 24, 2026. Mappings marked *(inference)* or *(design guidance)* are the program's.
:::

The loop in Book 13 has five steps: test, detect drift, raise a typed task, actuate on the native surface, and close with evidence from a re-read. The [draft on keeping identity correct after HR becomes the source](identity-maintenance.md) applies it to identity, with a catalog of the fixes that still happen. This page walks both through two named products, and finds four places where the products, used as shipped, fall short of the loop.

![The loop on ServiceNow and SailPoint: Core HCM is the source of authority and feeds SailPoint Identity Security Cloud by aggregation; SailPoint governs identities and entitlements and provisions Entra ID and AD through connectors; SailPoint and ServiceNow exchange tickets and requests; ServiceNow is the front door and the record, and uses its Entra spoke for simple tasks; a re-read on the next aggregation or native-change event, not the ticket status, closes the record; disconnected applications become declared exceptions through Service Desk tickets.](../images/diagrams/b13-governance/svg/ttm-snow-sailpoint.svg){fig-alt="Diagram. Core HCM, the source of authority where HR corrects facts, feeds SailPoint Identity Security Cloud by aggregation. SailPoint (identity governance: aggregates HR and runs lifecycle states, access requests and certifications, and native change detection) exchanges tickets and requests with ServiceNow (the front door and record: catalog, cases and change records, approvals per authority class, one closure record). SailPoint provisions Entra ID and AD through connectors; ServiceNow reaches Entra through its Entra spoke for A0 and A1 tasks. Entra and AD lead to a re-read on the next aggregation or a native-change event, not ticket status, and the evidence closes the ServiceNow record. A dashed red line from SailPoint leads to a declared exception: a disconnected application handled by a Service Desk ticket, a recorded session and an end date."}

## Watch or download

{{< fmw-video Research_TTM_ServiceNow_SailPoint_Narrated >}}

| Edition | File |
|---|---|
| Video (MP4, 1080p, about 10 minutes) | [Research_TTM_ServiceNow_SailPoint_Narrated.mp4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Research_TTM_ServiceNow_SailPoint_Narrated.mp4) |
| Narrated, self-running deck (about 10 minutes, captions) | [Research_TTM_ServiceNow_SailPoint_Narrated.pptx](../../presentations/research-ttm-servicenow-sailpoint/Research_TTM_ServiceNow_SailPoint_Narrated.pptx) |
| Deck, for presenting live | [Research_TTM_ServiceNow_SailPoint.pptx](../../presentations/research-ttm-servicenow-sailpoint/Research_TTM_ServiceNow_SailPoint.pptx) |
| Narration script and caption track | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-ttm-servicenow-sailpoint/Research_TTM_ServiceNow_SailPoint_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-ttm-servicenow-sailpoint/Research_TTM_ServiceNow_SailPoint_Narrated.vtt) |

The vendor-neutral original has its own narrated deck, linked from [Book 13, Appendix B](../books/b13-governance/appendix-b-ticket-to-machine-reference.md).

**Scripts:** the [integration kit](snow-sailpoint-integration-kit.md) implements this example in PowerShell and Python, with the SailPoint workflows and ServiceNow scripts (illustrative, unit-tested, not yet proven against live tenants).

## The products in this example

| Slot in the loop | Product | Federal status (FedRAMP Marketplace, October 24, 2026) |
|---|---|---|
| Front door, task record, change approval | ServiceNow, Government Community Cloud | FedRAMP Certified, High (Class D), JAB, since August 12, 2019[^fr] |
| Identity governance: HR aggregation, lifecycle, requests, certifications, provisioning | SailPoint Identity Security Cloud | FedRAMP Certified, Moderate (Class C), agency authorization, since June 5, 2024[^fr] |
| The alternative: SailPoint IdentityIQ, self-hosted | — | No listing of its own; it appears as a component inside another provider's High authorization[^fr] |

**Why ISC for the example:** it has a public FedRAMP listing a reader can check, it reaches both Entra ID and Active Directory, and SailPoint documents its ServiceNow integrations. IdentityIQ fits an agency that must run identity governance inside its own boundary, needs a High system, or needs ServiceNow change-request tickets from the governance tool, which only IdentityIQ's integration offers.[^iiq-itsm][^sdim] SailPoint now markets ISC as "Human Fabric" while the Marketplace still uses the older name, so confirm that the product purchased is the one authorized.[^hf]

## How the two products hand work to each other

SailPoint publishes the ServiceNow integrations as its own ServiceNow apps, each licensed separately; ServiceNow's documentation shows no SailPoint integration of its own.[^apps]

| Direction | Mechanism | What it does | Fit with the loop |
|---|---|---|---|
| SailPoint to ServiceNow | **Service Desk integration** | Turns provisioning actions SailPoint can't perform directly into ServiceNow Service Requests or Incidents, for "disconnected applications"; checks the ticket's status "at regular intervals"[^sdim][^apps][^status] | The residual manual step, and the declared exception. **Gap 1** below |
| ServiceNow to SailPoint | **Service Catalog app** | People request SailPoint roles, access profiles and entitlements in ServiceNow; SailPoint checks separation of duties; approval is "defined in ServiceNow"; SailPoint provisions and writes the status back[^apps] | One front door for people. **Gap 2** below |
| Both | **Identity Governance app** | Syncs user data and lets certifiers review inside ServiceNow; governs ServiceNow's own roles[^apps] | Reviewers work in one tool |
| ServiceNow to Entra ID | **Entra ID spoke** (Integration Hub) | Create, update, enable, disable and delete users, revoke sign-in sessions, and more, through Microsoft Graph[^spoke] | Simple, low-authority tasks routed to ServiceNow (Book 15) |

## The loop, step by step

| Loop step or lane | Done by | Documented mechanism | Status |
|---|---|---|---|
| 1. Test | SailPoint refresh and aggregation | Lifecycle states are evaluated on scheduled refreshes, and missing access is provisioned[^lcs] | Documented |
| 2. Detect drift | SailPoint | "Identity Attributes Changed" when authoritative-source attributes differ; native-change events when an account is updated outside SailPoint; certification findings[^trig][^ncd][^certs] | Documented; treating these as Book 13's drift classes is *(inference)* |
| 3. Raise a typed task | ServiceNow | Service Desk tickets from SailPoint; Service Catalog requests; drift events raised by a SailPoint workflow calling ServiceNow[^sdim][^apps][^wf] | Tickets and catalog documented; drift-to-task is a build *(design guidance)* |
| 4. Actuate | SailPoint connectors; the ServiceNow Entra spoke | Entra SaaS connector (accounts, groups, licenses, roles, administrative units, access packages, PIM) and the AD connector through SailPoint's on-premises appliance[^entra][^ad]; spoke actions[^spoke] | Documented as vendor capability |
| 5. Close with evidence | SailPoint events and search, and the ServiceNow record | SailPoint records Service Desk activity as events in Search; search covers identities, entitlements, events and account activity[^status][^search] | **Partial: Gap 1** |
| Machine, autonomous lane | SailPoint lifecycle states and birthright access; ServiceNow standard change | Pre-authorized, low-risk standard changes[^chg] | *(inference)* mapping |
| Machine, gated lane | SailPoint access request with approval; ServiceNow normal change | Approvers by owner, manager or governance group[^appr]; normal change with approvals[^chg] | *(inference)* mapping |
| Human decision | SailPoint certification decisions; ServiceNow approval or CAB | Unsigned revoke decisions aren't applied[^certs] | Documented |
| Protocol-enforced | Neither product: certificates stay with the CLM platform (Book 07) | — | — |
| Declared exception | Service Desk ticket for a disconnected application, a recorded session and an end date | [^sdim] | *(design guidance)* |
| Emergency change | ServiceNow emergency change; a SailPoint workflow or lifecycle-state change | Emergency changes go straight to the CAB; unplanned changes to a configuration item create an unauthorized change request[^chg] | Partly documented |

## Four gaps between the products and the loop

1. **A ticket status isn't a re-read.** SailPoint's Service Desk best practices say the mapped ServiceNow status decides when the provisioning task is "treated as complete."[^sdim-bp] That's the failure Book 13 calls closure by assertion. *(Design guidance:)* the ServiceNow record closes only on evidence: the next SailPoint aggregation, or a native-change event, showing the account in the intended state.
2. **The catalog app moves access approval into ServiceNow.** In [Book 15, Chapter 03](../books/b15-day2-operations/03-intake-triage-and-routing.md), access governed by an owner (classes A2 and A3) is decided in the identity governance platform. With the Service Catalog app, approval is defined in ServiceNow.[^apps] *(Design guidance:)* choose one approver system per authority class and write it down: for example, ServiceNow approves A0 and A1, and SailPoint approves A2 and A3, with the catalog app only collecting the request.
3. **No change-request tickets from ISC.** ISC's Service Desk integration creates Service Requests and Incidents only; IdentityIQ's can create change requests.[^sdim][^iiq-itsm] Where a change class needs a change record, a ServiceNow flow raises it from the request *(design guidance)*.
4. **One door into the directory becomes a choice.** SailPoint reads Oracle HCM Cloud directly, with no on-premises appliance, and writes back only the user name and work email,[^hcm] which matches what [Book 03](../books/b03-hr-identity/05-the-provisioning-pipeline.md) allows. But Book 03's design makes Entra inbound provisioning the one writer into the directory. *(Design guidance:)* pick one writer per attribute. Either Entra inbound provisioning stays the door and SailPoint governs entitlements, or SailPoint becomes the provisioning service and takes on Book 03's middleware duties. Not both.

## The identity fixes, on these products

From the [identity-maintenance draft's](identity-maintenance.md) fix catalog. Everything here is *(inference)* or *(design guidance)* unless a note cites a source.

| Fix | Detect | Route and track | Fix and carry back |
|---|---|---|---|
| A wrong fact in HR | SailPoint "Identity Attributes Changed";[^trig] or a caller uses a ServiceNow "my information is wrong" item | ServiceNow case to HR | HR corrects it in Core HCM; SailPoint re-aggregates. SailPoint can't write HR-mastered attributes back: only user name and work email are writable[^hcm] |
| A late or retroactive personnel action | A lifecycle-state change on aggregation[^lcs] | ServiceNow emergency change if after the fact | The leaver state disables accounts; the Entra connector revokes sessions on disable[^lcs][^entra] |
| An urgent leaver HR hasn't entered | A manager or security calls | ServiceNow emergency change | A SailPoint workflow or a manual lifecycle-state change runs the same leaver sequence[^wf] |
| A record the pipeline couldn't apply | A failed provisioning action, or a Service Desk "Failed" status[^status] | ServiceNow task to the identity data steward | Re-run through SailPoint, never by hand |
| A write outside the pipeline | **SailPoint native change detection**: an account updated outside SailPoint[^ncd] | ServiceNow task, provenance class | SailPoint restores the value; the writer's access is reviewed. The closest one-to-one fit in the catalog |
| An account that matches nobody | Uncorrelated accounts on aggregation[^ncd] | The account owner decides | Correlate it to a person, or disable it |
| The same person twice, or a broken link | SailPoint correlation; rehire and conversion handling[^hcm] | Data architect | A correlation-rule change. SailPoint notes partial support for some mover cases in the change feed[^hcm] |
| A fact HR doesn't own (contractors) | A separate contractor source in SailPoint | Sponsor | Correct it in the contractor source. SailPoint says its Non-Employee Risk Management product is inside the ISC FedRAMP authorization;[^nerm] confirm that from the authorization package, not the press release |
| A rule that derives the wrong access | A certification campaign[^certs] | Governance body, through a ServiceNow normal change | Change the role or lifecycle rule |
| Residual access after a move | Attribute-change trigger, then a certification; access granted by the previous lifecycle state is revoked automatically[^trig][^lcs] | Entitlement owner | Revocation through the connector, else a Service Desk ticket[^certs] |
| A credential that outlives the person | Outside both products: PIV and certificates | Credentialing office | The card system and the CLM platform (Book 07) |

## Federal availability and cautions

| Piece | GCC (Microsoft 365 Moderate) | GCC High | Note |
|---|---|---|---|
| SailPoint ISC | Worldwide Microsoft Graph endpoints apply[^graph] | Endpoint overrides documented for the Entra source[^gov] | FedRAMP Moderate[^fr] |
| ServiceNow Entra ID spoke | Default Graph endpoint fits[^spoke][^graph] | Not documented on the spoke page | Needs an Integration Hub subscription[^spoke] |
| SailPoint's ServiceNow apps | Not confirmed in ServiceNow's government Store | Not confirmed | ServiceNow's government cloud has an isolated Store instance[^store] |

- **Where the connector runs matters.** SailPoint's cloud connectors call Microsoft Graph from SailPoint's cloud; only the Active Directory path runs through SailPoint's on-premises appliance.[^ad] Book 15's rule is to execute through a connector inside the boundary, so record which actions run from the vendor's cloud *(inference)*.
- **Vendor claims aren't help desk policy.** The Entra connector lists "MFA attribute management"; that isn't the same as an authentication-method reset with identity proofing, which stays with the help desk procedure in Book 15.[^entra]
- **Confirm what's in the FedRAMP environment.** No SailPoint page was found that lists which features are or aren't available in the FedRAMP environment; ask before relying on any of the above.

## Status and review

**In review.** Product facts are from SailPoint, ServiceNow, Microsoft Learn and FedRAMP Marketplace data, opened October 24, 2026. What couldn't be verified: the ServiceNow Store listings for the SailPoint apps (pages render by script), their availability in the government Store, the Service Catalog app's internals, ISC feature parity in the FedRAMP environment, the Service Desk status-check interval, event retention in SailPoint, end-dated access requests, and the Entra spoke in GCC High. To move this example to **Proved**, build the loop in a lab with a test tenant and record the evidence here. This page names products to illustrate the vendor-neutral design; it isn't an endorsement by any agency. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Book 13, Appendix B — Ticket-to-Machine Reference](../books/b13-governance/appendix-b-ticket-to-machine-reference.md) and its narrated deck, [Book 15 — Compliance Automation & Day-2 Operations](../books/b15-day2-operations/index.md), and the draft [Keeping Identity Correct After HR Becomes the Source](identity-maintenance.md).

[^fr]: FedRAMP Marketplace data, <https://www.fedramp.gov/marketplace/products.json> (last change October 24, 2026): ServiceNow Government Community Cloud (F1305072116); SailPoint Identity Security Cloud (FR2001938710A); UberEther IAM Advantage (FR2208555094), whose component list includes SailPoint IdentityIQ. Accessed October 24, 2026.
[^iiq-itsm]: SailPoint, "Configuring IdentityIQ to Integrate with ServiceNow" (ticket types include change requests), <https://documentation.sailpoint.com/connectors/identityiq/itservice/help/it_service_management_infrastructure_modules/configuring__to_integrat.html>, accessed October 24, 2026.
[^sdim]: SailPoint, "Integrating SailPoint with ServiceNow Service Desk" (revised September 21, 2026), <https://documentation.sailpoint.com/connectors/servicenow/sdim/help/integrating_servicenow_sdim/intro.html>, accessed October 24, 2026.
[^hf]: SailPoint, Human Fabric product page, <https://www.sailpoint.com/products/human-fabric>, accessed October 24, 2026.
[^apps]: SailPoint, "Getting Started with ServiceNow" (the ServiceNow apps), <https://documentation.sailpoint.com/connectors/servicenow/service_catalog/help/common/snow/servicenow_apps_intro.html>, and "Integrating ISC with the ServiceNow Service Catalog Application" (revised October 23, 2026), <https://documentation.sailpoint.com/connectors/servicenow/service_catalog/help/integrating_service_catalog/intro.html>, accessed October 24, 2026.
[^status]: SailPoint, "SDIM: Status Mapping," <https://documentation.sailpoint.com/connectors/servicenow/sdim/help/integrating_servicenow_sdim/status_mapping.html>, and "Configuring SailPoint for ServiceNow Service Desk," <https://documentation.sailpoint.com/connectors/servicenow/sdim/help/integrating_servicenow_sdim/configure_sailpoint.html>, accessed October 24, 2026.
[^sdim-bp]: SailPoint, "SDIM: Best Practices," <https://documentation.sailpoint.com/connectors/servicenow/sdim/help/integrating_servicenow_sdim/best_practices.html>, accessed October 24, 2026.
[^spoke]: ServiceNow, "Microsoft Entra ID spoke" (Zurich), <https://www.servicenow.com/docs/bundle/zurich-integrate-applications/page/administer/integrationhub/concept/microsoft-azure-ad-spoke.html>, accessed October 24, 2026.
[^lcs]: SailPoint Developer, "Lifecycle States," <https://developer.sailpoint.com/docs/api/lifecycle-states>, accessed October 24, 2026.
[^trig]: SailPoint Developer, "Identity Attributes Changed" event trigger, <https://developer.sailpoint.com/docs/extensibility/event-triggers/triggers/identity-attribute-changed>, accessed October 24, 2026.
[^ncd]: SailPoint Developer, "Native Change Account Updated" event trigger, <https://developer.sailpoint.com/docs/extensibility/event-triggers/triggers/native-change-account-updated>, accessed October 24, 2026.
[^certs]: SailPoint, "Understanding Certifications," <https://documentation.sailpoint.com/saas/help/certs/understanding_certifications.html>, accessed October 24, 2026.
[^wf]: SailPoint Developer, "Workflows," <https://developer.sailpoint.com/docs/api/workflows>, accessed October 24, 2026.
[^entra]: SailPoint, "Microsoft Entra SaaS: Supported Features," <https://documentation.sailpoint.com/connectors/saas/msentraid/help/saas_connectivity/microsoft_entra_id/supported_features.html>, accessed October 24, 2026.
[^ad]: SailPoint, "Integrating SailPoint with Active Directory" (revised September 17, 2026), <https://documentation.sailpoint.com/connectors/active_directory/help/integrating_active_directory/intro.html>, accessed October 24, 2026.
[^search]: SailPoint Developer, "Search," <https://developer.sailpoint.com/docs/api/search>, accessed October 24, 2026.
[^chg]: ServiceNow, "Change types" (Zurich IT Service Management), <https://www.servicenow.com/docs/r/MlbQAgTiiiMOLOw9T36wJg/0mfA2AyAdGPOssbbVgOLLQ>, accessed October 24, 2026.
[^appr]: SailPoint Developer, "Access Request Approvals," <https://developer.sailpoint.com/docs/api/access-request-approvals>, accessed October 24, 2026.
[^hcm]: SailPoint, "Oracle HCM Cloud SaaS: Supported Features," <https://documentation.sailpoint.com/connectors/saas/oracle_hcm_cloud/help/saas_connectivity/oracle_hcm_cloud/supported_features.html>, accessed October 24, 2026.
[^nerm]: SailPoint press release, "SailPoint Non-Employee Risk Management FedRAMP authorized" (March 4, 2025), <https://www.sailpoint.com/press-releases/sailpoint-non-employee-risk-management-fedramp-authorized>, accessed October 24, 2026.
[^graph]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments>, accessed October 24, 2026.
[^gov]: SailPoint, "Azure Government Endpoint Configuration," <https://documentation.sailpoint.com/connectors/saas/msentraid/help/saas_connectivity/microsoft_entra_id/endpoint_configuration.html>, accessed October 24, 2026.
[^store]: ServiceNow, "Environments with federal or regional ServiceNow Store instances" (Yokohama), <https://www.servicenow.com/docs/r/VbEA8DxUy61CFZ25mbYrcQ/VHU4zAdCjZkmR77lHBQOVw>, accessed October 24, 2026.
