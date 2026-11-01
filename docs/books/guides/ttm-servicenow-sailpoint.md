---
title: "Ticket-to-Machine on ServiceNow and SailPoint: An Example Implementation Guide"
subtitle: "Book 13's loop built on two named products, in seven gates: confirm the boundary, decide the writers and approvers, connect the sources, open the front door, actuate on the native surface, close only on a re-read, and operate the tempo"
description: "Research draft: a gated implementation guide that builds Book 13's Ticket-to-Machine loop on ServiceNow (the front door and the record) and SailPoint Identity Security Cloud (identity governance), as an example rather than a recommendation. Seven gates, each with its steps, the federal requirement it meets and the evidence an ISSO keeps, the FedRAMP status of each product used and the Microsoft Entra features in GCC and GCC High, an interim path, a Validate step that names the integration kit's tests or says there is no automated check yet, and rollback."
research-status: draft
research-type: implementation guide
research-book: "Books 13, 15"
date-modified: 2026-11-01
last-reviewed: 2026-11-01
aliases:
  - /docs/research/ttm-servicenow-sailpoint.html
---

# Ticket-to-Machine on ServiceNow and SailPoint: An Example Implementation Guide {.unnumbered}

*Two products can carry the loop, but neither closes it on its own: the ticket has to authorize a machine, and only a re-read can close the ticket.*

::: {.callout-note}
## An example, not a recommendation
[Book 13, Appendix B — Ticket-to-Machine Reference](../b13-governance/appendix-b-ticket-to-machine-reference.md) is vendor-neutral on purpose: the loop runs on "whatever ITSM platform the agency already has." This guide picks two products to show what building it looks like: **ServiceNow** as the front door and the record, and **SailPoint Identity Security Cloud (ISC)** as identity governance. Other products can fill the same slots, and naming these two isn't an endorsement by the program or any agency. Product facts are the vendors' own statements, footnoted with the date each page was read; FedRAMP facts are from the FedRAMP Marketplace. Statements marked *(inference)* or *(design guidance)* are the program's.
:::

::: {.callout-note}
## In this guide
Book 13's five-step loop (test, detect drift, raise a typed task, actuate on the native surface, close with evidence) built for identity on ServiceNow and SailPoint ISC. Where agencies usually start, the loop at a glance with the four places the products fall short of it, and the prerequisites. Then seven gates: confirm the authorization boundary; decide one writer per attribute and one approver per authority class; connect the sources and measure the starting drift; open the front door so findings and requests become typed tasks; actuate on the native surface by lane; close only on a re-read; and operate the tempo with the identity fixes and the evidence. Each gate carries the federal requirement it meets and the evidence an ISSO keeps, the availability of each product and feature it uses, an interim path, a **Validate** step and its rollback. Then the dangers, the evidence, rollback, a checklist and what couldn't be verified.
:::

![The loop on ServiceNow and SailPoint: Core HCM is the source of authority and feeds SailPoint Identity Security Cloud by aggregation; SailPoint governs identities and entitlements and provisions Entra ID and AD through connectors; SailPoint and ServiceNow exchange tickets and requests; ServiceNow is the front door and the record, and uses its Entra spoke for simple tasks; a re-read on the next aggregation or native-change event, not the ticket status, closes the record; disconnected applications become declared exceptions through Service Desk tickets.](../../images/diagrams/b13-governance/svg/ttm-snow-sailpoint.svg){fig-alt="Diagram. Core HCM, the source of authority where HR corrects facts, feeds SailPoint Identity Security Cloud by aggregation. SailPoint (identity governance: aggregates HR and runs lifecycle states, access requests and certifications, and native change detection) exchanges tickets and requests with ServiceNow (the front door and record: catalog, cases and change records, approvals per authority class, one closure record). SailPoint provisions Entra ID and AD through connectors; ServiceNow reaches Entra through its Entra spoke for A0 and A1 tasks. Entra and AD lead to a re-read on the next aggregation or a native-change event, not ticket status, and the evidence closes the ServiceNow record. A dashed red line from SailPoint leads to a declared exception: a disconnected application handled by a Service Desk ticket, a recorded session and an end date."}

## Watch or download

{{< fmw-video Research_TTM_ServiceNow_SailPoint_Narrated >}}

| Edition | File |
|---|---|
| Video (MP4, 1080p, about 10 minutes) | [Research_TTM_ServiceNow_SailPoint_Narrated.mp4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Research_TTM_ServiceNow_SailPoint_Narrated.mp4) |
| Narrated, self-running deck (about 10 minutes, captions) | [Research_TTM_ServiceNow_SailPoint_Narrated.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/Research_TTM_ServiceNow_SailPoint_Narrated.pptx) |
| Deck, for presenting live | [Research_TTM_ServiceNow_SailPoint.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/Research_TTM_ServiceNow_SailPoint.pptx) |
| Narration script and caption track | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-ttm-servicenow-sailpoint/Research_TTM_ServiceNow_SailPoint_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-ttm-servicenow-sailpoint/Research_TTM_ServiceNow_SailPoint_Narrated.vtt) |

The deck was made from the October 24, 2026 version of this page, before it became a gated guide; its products, gaps and identity fixes still match. The vendor-neutral original has its own narrated deck, linked from [Book 13, Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md).

## How to read this guide

This guide owns the order of work and the gates. It links to the pages that hold the rest rather than repeating them:

| Question | Where the answer lives |
|---|---|
| Why the loop, the lanes, the tempo and the evidence record | [Book 13, Chapter 10](../b13-governance/10-ticket-to-machine.md) and [Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md); the controls behind the lanes are in [Appendix A](../b13-governance/appendix-a-requirements-mapping.md#controls-behind-the-ticket-to-machine-lanes) |
| Which request needs which authority, and who approves | [Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md#triage-by-required-authority), built on [Book 04, Chapter 06](../b04-access/06-who-decides-access.md#the-help-desk-and-cloud-services-authority-split) |
| The drift classes and their severities | [Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md#drift-between-hr-and-the-directory) |
| **The order of work on ServiceNow and SailPoint, the gates, the federal evidence per gate, availability and rollback** | **This guide** |
| The code for Pass 1 (drift to a typed task, re-read before close, drift reconciliation), its permissions and its tests | The [integration kit page](snow-sailpoint-integration-kit.md) and the kit's [README on GitHub](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint) |
| Building the kit step by step, as a developer | The developer workbook (coming), *Building Ticket-to-Machine* |
| Building the ServiceNow side in-house when there's no identity governance product | [Book 15, Chapter 13](../b15-day2-operations/13-building-day-two-automation-in-house.md#the-no-funding-path) |

: What this guide owns and what it hands off {.striped .hover}

**Labels.** Facts carried from a linked chapter rely on that chapter's verification log. Facts this guide adds are footnoted and listed in its [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/ttm-servicenow-sailpoint.md). The audience is a civilian agency at FedRAMP Moderate, usually in Microsoft 365 GCC, where Entra ID runs in Microsoft's commercial cloud and Microsoft Graph is `graph.microsoft.com`.[^ttm-graph]

**Validate steps.** Each gate ends with a Validate step. Where the [integration kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint) or the [validation kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/validation-kit) has a test or check that proves part of the gate, the step names it; the kit's tests run against mocked responses and prove logic, not the live integration. Where nothing automated exists yet, the step says so and gives the manual check.

## Where agencies start {#where-agencies-start}

The guide assumes the starting state most agencies report, and gives an interim path at each gate for the parts that don't match.

| Area | Assumed starting state | What it changes |
|---|---|---|
| Service management | ServiceNow ITSM already in use for incidents and requests; access requests are catalog items fulfilled by hand, and a ticket closes when a technician writes "done" | Gate 4 reuses the instance; Gate 6 stops the "done" closure |
| Which ServiceNow cloud | Some agencies run on ServiceNow's Government Community Cloud, others on its commercial cloud | Gate 1: only the former has a FedRAMP listing |
| Identity governance | SailPoint ISC, SailPoint IdentityIQ, another product, or none | ISC is this guide's example; with none, Book 15's in-house path applies |
| Directories | Active Directory synchronized to Entra ID; AD groups granted by hand from tickets; some cloud-only groups | Gate 5 moves the grants to connectors |
| HR feed | Either Book 03's pipeline (Entra inbound provisioning from HR) is live, or accounts are still created from tickets | Gate 2 decides who writes each attribute |
| Microsoft tenant | Microsoft 365 GCC; a minority in GCC High | Availability notes cover both |
| Disconnected applications | Applications with only an administrative console and no connector | Gate 5's declared-exception lane |
| Evidence | Ticket history and console screenshots; no re-read | Gates 6 and 7 |

: The starting state this guide assumes {.striped .hover}

## The loop at a glance

| Loop step (Book 13) | Done by, in this example | Gate |
|---|---|---|
| 1. Test | SailPoint aggregation and lifecycle-state evaluation on refresh;[^ttm-lcs] the kit's read-only drift reconciliation | 3 |
| 2. Detect drift | SailPoint *Identity Attributes Changed* and *Native Change Account Updated* events;[^ttm-trig][^ttm-ncd] certification findings[^ttm-certs] | 3, 4 |
| 3. Raise a typed task | A SailPoint workflow posting to a ServiceNow endpoint (a build);[^ttm-wf] the Service Catalog app for requests; Service Desk tickets for disconnected applications[^ttm-apps][^ttm-sdim] | 4 |
| 4. Actuate on the native surface | SailPoint's Entra and Active Directory connectors;[^ttm-entra][^ttm-ad] ServiceNow's Entra ID spoke for low-authority tasks[^ttm-spoke] | 5 |
| 5. Close with evidence | A re-read of the target through SailPoint or Microsoft Graph, not the ticket status (a build) | 6 |

: The loop on ServiceNow and SailPoint {.striped .hover}

**Four gaps between the products and the loop.** Used as shipped, the two products fall short of the loop in four places. Each gate that closes one says so.

| Gap | What the products do | The fix, and where |
|---|---|---|
| 1. A ticket status isn't a re-read | SailPoint's Service Desk integration uses the mapped ServiceNow status to decide when its provisioning task is "treated as complete"[^ttm-sdim-bp] | Close only on a re-read: [Gate 6](#step-6-close-only-on-a-re-read) |
| 2. The catalog app moves access approval into ServiceNow | With the Service Catalog app, requests follow "the approval process defined within ServiceNow,"[^ttm-apps] while Book 15 decides owner-governed access (A2, A3) in the identity governance platform | One approver system per authority class: [Gate 2](#step-2-decide-the-writers-and-the-approvers) |
| 3. No change-request tickets from ISC | ISC's Service Desk integration supports only Service Request and Incident tickets;[^ttm-sdim] IdentityIQ's can also create change requests[^ttm-iiq-itsm] | A ServiceNow flow raises the change record: [Gate 5](#step-5-actuate-on-the-native-surface) |
| 4. Two doors into the directory | SailPoint can provision Entra ID and AD, and Book 03 makes Entra inbound provisioning the one writer of HR-mastered attributes | One writer per attribute: [Gate 2](#step-2-decide-the-writers-and-the-approvers) |

: The four gaps and the gate that closes each {.striped .hover}

## Prerequisites {#prerequisites}

**Subscriptions.** Each piece is licensed separately; confirm each against the agency's agreements before Gate 1.

| Piece | What it needs | Source |
|---|---|---|
| SailPoint ISC | The ISC subscription, in its FedRAMP environment (Gate 1) | [^ttm-fr] |
| SailPoint's ServiceNow apps | Each app is separate: Service Desk needs an active ISC ServiceNow Service Desk license; the Service Catalog (Portal) integration needs additional licensing | [^ttm-sdim][^ttm-catalog] |
| ServiceNow Entra ID spoke | An Integration Hub subscription | [^ttm-spoke] |
| Entra ID | P1 or above for Book 03's API-driven inbound provisioning, where it's the writer (Gate 2); PIM for people who act (Gate 5) under the agency's existing Entra licensing | [Book 03, Chapter 05](../b03-hr-identity/05-the-provisioning-pipeline.md#why-api-driven-inbound-provisioning) |

: What each piece needs {.striped .hover}

**Integration identities.** Four non-person identities carry the integration, each with two named owners and a federal sponsor in the system inventory, and each governed on the [non-person identity track](non-person-identity-implementation.md#step-1-inventory-every-non-person-identity) *(design guidance)*:

1. SailPoint's Entra connector app registration in the agency's tenant (the GCC High endpoints are a source setting, Gate 1);[^ttm-gov]
2. the ServiceNow Entra spoke's app registration, a custom app that obtains OAuth 2.0 tokens, delegated or application;[^ttm-spoke]
3. the ServiceNow integration user the SailPoint workflow posts as, and the verifier account the re-read client closes records as ([kit permissions](snow-sailpoint-integration-kit.md#permissions));
4. the ISC API client the kit's clients read with.

**Environments.** A ServiceNow Personal Developer Instance or sub-production instance and a SailPoint sandbox tenant, with synthetic data like the kit's fixtures, before production ([Book 15, Chapter 13](../b15-day2-operations/13-building-day-two-automation-in-house.md#three-environments)).

**Roles in the program.** A gate owner for each gate, the identity governance office (IGO) for decisions about access, the ServiceNow platform owner, the SailPoint administrator, and the ISSO who receives each gate's evidence ([Book 13, Chapter 09](../b13-governance/09-who-governs.md)).

## The path on one page

| Gate | Done when | Closes gap | Validate with |
|---|---|---|---|
| [G1 Boundary](#step-1-confirm-the-authorization-boundary) | Each product's FedRAMP status, the actions that run from a vendor cloud, and the integration identities are recorded and accepted | — | VK-NPI-02, VK-NPI-05; manual record |
| [G2 Writers and approvers](#step-2-decide-the-writers-and-the-approvers) | One writer per attribute and one approver system per authority class are decided, and each change class has a lane | 2, 4 | No automated check yet |
| [G3 Sources and starting drift](#step-3-connect-the-sources-and-measure-the-starting-drift) | HR, Entra ID and AD are aggregated and correlated on `employeeId`; the starting drift is measured | — | Kit drift tests; VK-HR-01, VK-HR-04 |
| [G4 Front door](#step-4-open-the-front-door) | Drift events, requests and disconnected-application work arrive in ServiceNow as typed, owned, clocked tasks | — | Kit contract and ServiceNow script tests |
| [G5 Actuation](#step-5-actuate-on-the-native-surface) | Each lane actuates through a connector or a declared exception, under a service identity, with a change record where its class needs one | 3 | No automated check yet |
| [G6 Re-read](#step-6-close-only-on-a-re-read) | No finding or Service Desk ticket closes without a re-read of the target | 1 | Kit re-read and business-rule tests |
| [G7 Tempo and evidence](#step-7-operate-the-tempo) | Windows are measured, the identity fixes route through the loop, and the evidence package is produced on a schedule | — | No automated check yet for the export |

: The seven gates {.striped .hover}

## Step 1: Confirm the authorization boundary {#step-1-confirm-the-authorization-boundary}

**Prerequisites.** The subscriptions above, or a draft of them; the agency's authorizing official and ISSO named for the system that consumes these services.

### Steps

1. **Confirm each product's FedRAMP status on the Marketplace** on the day the decision is made, and record the listing, its impact level, its certification path and its date (the table below was read on November 1, 2026). How to read a listing is in [Book 10, Chapter 01](../b10-cloud-boundary/01-why-the-boundary-decides.md#the-certification-what-fedramp-certified).
2. **Confirm what's inside the authorization.** SailPoint says the FedRAMP-authorized ISC is hosted in AWS GovCloud and lists the modules it includes; it doesn't publish a list of features that aren't available there.[^ttm-sp-fedramp] Ask SailPoint in writing whether Workflows, Native Change Detection and the workflow HTTP Request step, which Gates 3 to 6 rely on, are in the authorized environment, and what API domain a FedRAMP tenant uses ([kit verify list](snow-sailpoint-integration-kit.md#what-couldnt-be-verified)).
3. **Confirm the product purchased is the one authorized.** SailPoint now markets ISC as "Human Fabric," and its documentation is moving to that name, while the Marketplace still lists "SailPoint Identity Security Cloud."[^ttm-hf][^ttm-ncd-help]
4. **Record which actions run from a vendor's cloud.** SailPoint's cloud connectors call Microsoft Graph from SailPoint's cloud; only the Active Directory path runs through SailPoint's on-premises virtual appliance.[^ttm-ad] SailPoint workflows also call out from SailPoint's cloud to the ServiceNow endpoint *(inference)*. Book 15 prefers execution through a connector inside the boundary, so each vendor-cloud action is a recorded data flow.
5. **Confirm the apps are in the government Store.** ServiceNow's government cloud has an isolated Store instance;[^ttm-store] confirm that SailPoint's ServiceNow apps and the Entra spoke are installable there before planning on them.
6. **Register the integration identities** from the prerequisites in the system inventory, with their permissions, owners and credential type (certificate or federated credential, never a long-lived secret, per the [credential rules](non-person-identity-implementation.md#step-3-set-the-credential-rules)).

**Federal requirements and evidence.**

| Requirement | What this gate does | Evidence the ISSO keeps |
|---|---|---|
| NIST SP 800-53 SA-9 External System Services (Moderate) | Confirms each external service's authorization and the agency's oversight of it ([Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md#provenance-and-integrity-of-the-record-au-sa-sr-and-si)) | Marketplace listings with the date read; the vendor's written answers on feature scope |
| FedRAMP authorization of cloud services used | Uses only listed offerings, or records the gap as a risk for the authorizing official ([Book 10](../b10-cloud-boundary/index.md)) | The authorization package or letter for each offering the agency relies on |
| SP 800-53 CA-3 Information Exchange (Moderate) | Records each flow between the products and the tenant | The data-flow record: source, destination, identity, data |
| SP 800-53 IA-5 Authenticator Management; AC-6 Least Privilege (Moderate) | Integration identities use certificates and least privilege | The identity register; VK-NPI-02 and VK-NPI-05 output |

: Gate 1 requirements and evidence {.striped .hover}

**Availability** (FedRAMP Marketplace, read November 1, 2026).[^ttm-fr]

| Slot | Offering | FedRAMP status |
|---|---|---|
| Front door, record, change approval | ServiceNow, Government Community Cloud | FedRAMP Certified, High (Class D), JAB path, since August 12, 2019 |
| Front door, if on ServiceNow's commercial cloud | — | No listing of its own; the Marketplace lists one ServiceNow offering, the Government Community Cloud |
| Identity governance | SailPoint Identity Security Cloud | FedRAMP Certified, Moderate (Class C), agency path, since June 5, 2024 |
| Identity governance, self-hosted | SailPoint IdentityIQ | No listing of its own; it appears as a component inside another provider's High offering |

: The products and their FedRAMP status {.striped .hover}

**Why ISC for the example:** it has a public listing a reader can check, it reaches both Entra ID and Active Directory, and SailPoint documents its ServiceNow integrations.[^ttm-apps] IdentityIQ fits an agency that must run identity governance inside its own boundary, needs a High system, or needs change-request tickets from the governance tool.[^ttm-iiq-itsm]

**Interim path.** On ServiceNow's commercial cloud, the authorizing official decides whether identity tasks may run there before a move to the government cloud; until then, keep ticket payloads to identifiers and no personal data beyond what the task needs *(design guidance)*. Where a feature's presence in the ISC FedRAMP environment is unconfirmed, build Gates 3 to 6 in the sandbox and hold production until SailPoint confirms it.

::: {.callout-important}
## Validate (G1 Boundary)
- **Manual:** the Marketplace record and the vendor answers are filed; every vendor-cloud action is in the data-flow record; the authorizing official has accepted the boundary or recorded the gaps. No automated check yet.
- **VK-NPI-05** lists the integration service principals with high-privilege Graph roles (the connector's and the spoke's write permissions will appear); each one has a justification in the identity register.
- **VK-NPI-02** shows no integration credential longer than the policy maximum and none expiring without an owner.
- **Rollback:** nothing to roll back; this gate records and decides.
:::

## Step 2: Decide the writers and the approvers {#step-2-decide-the-writers-and-the-approvers}

This gate closes gaps 2 and 4 on paper before anything is connected. Every later gate builds what it decides.

**Prerequisites.** Gate 1 passed; the [program attribute map](../b03-hr-identity/06-canonical-attribute-schema.md#program-attribute-map) and Book 15's [authority classes](../b15-day2-operations/03-intake-triage-and-routing.md#triage-by-required-authority) adopted.

### Steps

1. **Choose one writer per attribute (gap 4).** Book 03's design makes Entra inbound provisioning the one writer of HR-mastered attributes into the directory. SailPoint's Oracle HCM Cloud connector reads Core HCM directly, without an on-premises appliance, and writes back only the user name and work email.[^ttm-hcm] Pick one of two patterns and write it down *(design guidance)*:
   - **Entra inbound provisioning stays the door**, and SailPoint aggregates HR read-only and governs entitlements (groups, roles, access packages, application access); or
   - **SailPoint becomes the provisioning service** and takes on Book 03's middleware duties ([Book 03, Chapter 05](../b03-hr-identity/05-the-provisioning-pipeline.md#the-middleware-five-duties-per-event)).

   Not both. Record each attribute's writer in the attribute map, and the [Oracle HCM to Entra guide](hcm-entra-implementation.md#the-two-decisions-to-make-first) for the first pattern's build.
2. **Choose one approver system per authority class (gap 2).** For example *(design guidance)*: ServiceNow approves A0 and A1 through its Ask for Approval flow ([Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md#routing-two-pipelines-and-an-escalation-lane)); SailPoint approves A2 and A3 through access-request approvals by owner, manager or governance group;[^ttm-appr] and the Service Catalog app only collects A2 and A3 requests. Set every approval's timeout outcome to reject or cancel, never approve.
3. **Assign each change class a lane** on these products, from Appendix B's [lanes](../b13-governance/appendix-b-ticket-to-machine-reference.md#change-classes-and-their-lanes). The mapping below is the program's *(inference)*; the authorizing official accepts any class run autonomously.

| Lane (Book 13) | On these products | Change record in ServiceNow |
|---|---|---|
| Machine, autonomous (L4) | SailPoint lifecycle states and birthright access, for classes the authorizing official enumerated | Standard change: pre-authorized, no peer or CAB step[^ttm-chg] |
| Machine, gated (L3) | A SailPoint access request with approval; a ServiceNow catalog item executed by the spoke | Normal change where the class needs one: peer or technical approval, then CAB[^ttm-chg] |
| Human decision | SailPoint certification decisions; ServiceNow approval or CAB | The decision record, then the gated lane |
| Protocol-enforced | Neither product: certificates stay with the CLM platform ([Book 13](../b13-governance/appendix-b-ticket-to-machine-reference.md#certificates-and-the-clm-platform)) | None per event |
| Declared exception | A Service Desk ticket for a disconnected application, a recorded session and an end date | The ticket and the exception register entry |
| Emergency change | ServiceNow emergency change; a SailPoint workflow or a manual lifecycle-state change | Emergency change: goes straight to CAB authorization[^ttm-chg] |

: Book 13's lanes on ServiceNow and SailPoint (inference) {.striped .hover}

4. **Write the decisions to the authoritative record** as a reviewed change, steward and sponsor approving ([Book 13, Chapter 09](../b13-governance/09-who-governs.md#who-approves-rule-changes)).

**Federal requirements and evidence.**

| Requirement | What this gate does | Evidence the ISSO keeps |
|---|---|---|
| SP 800-53 AC-5 Separation of Duties (Moderate) | One approver system per class; the requester never approves | The approver-per-class table, merged with its review |
| SP 800-53 CM-3 Configuration Change Control (Moderate) | Each change class has a lane and a change-record type | The lane table |
| SP 800-53 AC-2 Account Management (Low, Moderate, High) | One writer per attribute keeps account changes traceable to the source | The attribute map with each attribute's writer |
| Book 13's L4 acceptance | Any autonomous class is accepted in writing by the authorizing official | The signed class acceptance |

: Gate 2 requirements and evidence {.striped .hover}

**Availability.** Nothing new is used. Book 03's API-driven inbound provisioning, if it's the writer, is available in Azure for US Government, as are PIM, entitlement management, access reviews and Lifecycle Workflows (read November 1, 2026).[^ttm-entra-gov] In GCC, Entra ID is the commercial service.[^ttm-graph]

**Interim path.** Where the HR pipeline isn't live yet, SailPoint can't be measured against a source of authority; decide the writers now, and run Gates 3 to 6 against the HR extract the kit reads, until Book 03's pipeline lands.

::: {.callout-important}
## Validate (G2 Writers and approvers)
- **No automated check yet.** The kit's planned Pass 2 adds a read-only check that flags any attribute with two writers ([Pass 2](snow-sailpoint-integration-kit.md#planned-for-pass-2)).
- **Manual:** every HR-mastered attribute has exactly one writer in the attribute map; every authority class has exactly one approver system; every change class has a lane and a change-record type; the decisions are merged in the record.
- **Rollback:** re-decide by a reviewed change; the record keeps the history.
:::

## Step 3: Connect the sources and measure the starting drift {#step-3-connect-the-sources-and-measure-the-starting-drift}

Loop steps 1 and 2 for identity: SailPoint reads the sources, and the kit measures how far the directory is from HR before anything is fixed.

**Prerequisites.** Gate 2 passed; the integration identities from Gate 1 in place with read permissions only.

### Steps

1. **Aggregate HR into SailPoint** as the authoritative source, read-only under the first pattern of Gate 2.
2. **Connect Entra ID and Active Directory** as SailPoint sources: the Entra SaaS connector (accounts, groups, licenses, roles, administrative units, access packages, PIM)[^ttm-entra] and the AD connector through the virtual appliance.[^ttm-ad] In GCC High, set the Entra source's Graph and token endpoints to `graph.microsoft.us` and `login.microsoftonline.us`.[^ttm-gov]
3. **Correlate on `employeeId`**, the key Book 03 joins on. Treat uncorrelated accounts as orphan candidates, not errors to suppress.
4. **Turn on Native Change Detection** on the Entra and AD sources, for the attributes and entitlements the record governs. It compares stored and newly read data on aggregation and fires one event per changed account; it isn't available on Non-Employee Lifecycle Management sources.[^ttm-ncd-help]
5. **Run the kit's drift reconciliation read-only**: it joins the HR extract, Microsoft Graph and ISC on `employeeId` and reports Book 03's drift classes as JSON and CSV ([Build 3](snow-sailpoint-integration-kit.md#build-3-drift-reconciliation)). Expect a burst of High findings in the first month; Book 03 calls that the measurement working.
6. **File the first run as the baseline.** Later gates are measured against it.

**Federal requirements and evidence.**

| Requirement | What this gate does | Evidence the ISSO keeps |
|---|---|---|
| SP 800-53 AC-2 Account Management | Finds accounts with no worker, and workers with no account | The baseline drift report |
| SP 800-53 CA-7 Continuous Monitoring (Low, Moderate, High) | Starts a repeatable comparison of the record and the estate | The drift report, its date and the checker version |
| SP 800-53 CM-8 System Component Inventory, read for identities *(inference)* | One correlated inventory of accounts per person | Correlation rate and uncorrelated-account list |

: Gate 3 requirements and evidence {.striped .hover}

**Availability.** The SailPoint Entra connector documents Azure Government endpoint overrides;[^ttm-gov] GCC tenants use the worldwide endpoints.[^ttm-graph] Native Change Detection's presence in the ISC FedRAMP environment wasn't confirmed (Gate 1, step 2).

**Interim path.** Without SailPoint, or before it's connected, run the kit's reconciliation against the HR extract and Graph alone; the ISC inputs are optional files ([kit README](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/servicenow-sailpoint)). AD-only groups wait for the appliance.

::: {.callout-important}
## Validate (G3 Sources and starting drift)
- **Integration kit (logic, mocked):** `tests/python/test_identity_drift.py` and `tests/powershell/Get-IdentityDrift.Tests.ps1` prove the drift classes against the fixtures, the same finding IDs from both clients, and that unauthorized writes are reported as not computed without an audit extract.
- **Live:** the reconciliation's findings on a synthetic HR extract match a hand count (kit lab item 4, [what must still be proven](snow-sailpoint-integration-kit.md#how-its-tested-and-what-must-still-be-proven)).
- **Validation kit:** **VK-HR-01** (enabled members with no `employeeId`) and **VK-HR-04** (duplicate `employeeId` values) are clean, or each row has an owner, because the join depends on the key.
- **Rollback:** disconnect the source or turn off Native Change Detection; the gate only reads.
:::

## Step 4: Open the front door {#step-4-open-the-front-door}

Loop step 3: every drift event, request and residual manual step arrives in ServiceNow as a typed task with an owner, a clock and a severity, through one front door ([Book 13, Chapter 10](../b13-governance/10-ticket-to-machine.md#how-the-service-desk-fits)).

**Prerequisites.** Gate 3 passed; the ServiceNow instance's state model and assignment groups agreed.

### Steps

1. **Create the identity finding table and its endpoint** in a scoped application: a table extending Task, a Scripted REST API resource that validates the payload, maps severity to a priority and a due date on Book 13's tempo, de-duplicates on source, subject and class, and stores the intended state a re-read must find ([Build 1](snow-sailpoint-integration-kit.md#build-1-drift-to-a-typed-task); table and setup in the kit README).
2. **Create one SailPoint workflow per trigger**, posting to that endpoint with an HTTP Request step. Workflows can't be created enabled; enable each after a test run.[^ttm-wf]
3. **Install the Service Catalog app** for people's requests, with the approval routing Gate 2 decided. SailPoint says requests are raised "after Separation of Duties checks," approved in ServiceNow, provisioned by ISC, and the status written back.[^ttm-apps]
4. **Install the Service Desk integration** for disconnected applications only. It turns ISC provisioning actions into Service Request or Incident tickets.[^ttm-sdim] Each one is a declared exception (Gate 5).
5. **Route by authority**, Book 15's triage order, so a finding or request lands with the owner of its class ([Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md#triage-by-required-authority)).
6. **Feed other detection tools into the same queue**, not a second one ([Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md#one-front-door-for-detection-tools)).

**Federal requirements and evidence.**

| Requirement | What this gate does | Evidence the ISSO keeps |
|---|---|---|
| SP 800-53 CM-3 Configuration Change Control | Every proposed change is a documented, owned record | Finding and request records with origin, owner, clock |
| SP 800-53 RA-7 Risk Response (Low, Moderate, High) | Findings are responded to inside declared windows | Due dates by severity; overdue list |
| SP 800-53 CA-7 Continuous Monitoring | Monitoring results become tracked work | The finding queue with origin records |
| SP 800-53 AC-5 Separation of Duties | Requests pass an SoD check and an approver who isn't the requester | Approval history on each request |

: Gate 4 requirements and evidence {.striped .hover}

CM-3(1), automated documentation, notification and prohibition of changes, is what this gate builds, but it's in the High baseline only ([Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md#configuration-management-cm)); at Moderate the program adopts the shape as design.

**Availability.** SailPoint's ServiceNow apps and their presence in the government Store weren't confirmed (Gate 1). The Scripted REST API and custom table are platform features of the instance the agency already runs.

**Interim path.** Without the Service Catalog app, keep the existing catalog items and have a ServiceNow flow create the SailPoint access request through ISC's API, approving A0 and A1 in ServiceNow only *(design guidance)*. Without the SailPoint workflows, post the reconciliation's findings with the drift client's `--push-to-servicenow` option on a schedule.

::: {.callout-important}
## Validate (G4 Front door)
- **Integration kit (logic, mocked):** `tests/python/test_contract.py` (the workflow file's shape, no secrets in it, every payload field read by the ServiceNow script); `tests/servicenow/servicenow_scripts.test.js` ("creates a finding with priority and due date from severity," "tempo windows," "de-duplicates an open finding," "validation failures return 400").
- **Live:** a native change on a test account raises one finding with the right priority and due date, and a repeat de-duplicates (kit lab item 1).
- **Manual:** one test request through the catalog app shows the SoD check and the approver Gate 2 named.
- **Rollback:** disable the workflows and the catalog items; findings already raised stay as records.
:::

## Step 5: Actuate on the native surface {#step-5-actuate-on-the-native-surface}

Loop step 4: the ticket authorizes a machine. The fix runs through a connector under a service identity; a person's role stops at approval, except in the declared-exception lane.

**Prerequisites.** Gate 4 passed; Gate 2's lanes in the record. The kit's Pass 1 doesn't actuate anything, so this gate is configuration of the products themselves.

### Steps

1. **Provision through SailPoint's connectors** for A2 and A3: account create, update, enable, disable and delete; group, role, license and access-package changes.[^ttm-entra] When the Entra connector disables an account, it also signs the user out of existing sessions.[^ttm-entra]
2. **Use the ServiceNow Entra spoke for A0 and A1** where its actions cover the task. Its documented coverage and its gaps (no MFA-reset action; the reset action only for cloud-only users) are in [Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md#prefer-the-connector-and-check-what-it-actually-covers); validate it against the installed spoke.
3. **Raise change records where the class needs them (gap 3).** A ServiceNow flow raises a standard, normal or emergency change from the request item by change class; the kit plans this for Pass 2 ([Pass 2](snow-sailpoint-integration-kit.md#planned-for-pass-2)).
4. **Run the declared-exception lane** for disconnected applications: the Service Desk ticket, a named approver before the session, a time-boxed PIM activation and a recorded session, an end date and a POA&M item for an actuator or retirement ([Book 13, Chapter 10](../b13-governance/10-ticket-to-machine.md#when-no-machine-can-reach-the-surface)).
5. **Keep people off standing privilege.** Where a person must act, they activate an eligible role through PIM with the ticket number as justification; PIM doesn't check the number against the ticket, so a SIEM rule does ([Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md#what-entra-id-enforces-and-what-the-program-has-to-build)).
6. **Verify the person before a sensitive action.** An authentication-method reset isn't the connector's "MFA attribute management";[^ttm-entra] it stays with the help desk's verification procedure, which follows NIST SP 800-63B-4 ([Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md#verify-the-person-before-a-sensitive-action)).

**Federal requirements and evidence.**

| Requirement | What this gate does | Evidence the ISSO keeps |
|---|---|---|
| SP 800-53 CM-5 Access Restrictions for Change (Low, Moderate, High) | Changes run under scoped service identities, not personal admin accounts | Connector and spoke identities with their permissions |
| SP 800-53 AC-3 Access Enforcement; AC-6 Least Privilege | Approved access is enforced by the connector; people activate just in time | SailPoint provisioning events; PIM activation records |
| SP 800-53 CM-3 | Classes that need a change record get one | Change records linked from the request |
| SP 800-53 AU-14 Session Audit (in no baseline; tailored in) | Declared-exception sessions are recorded, with counsel consulted | Session recordings attached to the ticket |
| NIST SP 800-63B-4 | Resets and recovery follow the verification procedure | The verification rung on the ticket ([Book 15](../b15-day2-operations/03-intake-triage-and-routing.md#the-evidence-each-ticket-leaves)) |
| SP 800-53 CA-5 Plan of Action and Milestones | Each declared exception has an end | The POA&M item |

: Gate 5 requirements and evidence {.striped .hover}

**Availability.** PIM is available in Azure for US Government (read November 1, 2026).[^ttm-entra-gov] The Entra spoke's connection points at `https://graph.microsoft.com` by default and its page doesn't mention the US Government clouds:[^ttm-spoke] it fits GCC; for GCC High, confirm with ServiceNow before use. SailPoint's connector endpoints for GCC High are documented.[^ttm-gov]

**Interim path.** Until the change-record flow exists, the approver raises the change record by hand and links it to the request; the closure still waits for Gate 6. Where the spoke isn't licensed, A0 and A1 tasks stay help desk tasks against an approved ticket, with the PIM activation recorded.

::: {.callout-important}
## Validate (G5 Actuation)
- **No automated check yet.** Pass 1 doesn't actuate, so the kit has no test for this gate.
- **Manual, in the lab:** one task per lane runs end to end: an L3 access request provisions through the connector; an A1 task runs through the spoke; a disconnected-application ticket runs as a declared exception with its recording; an emergency change is recorded after the fact. Each leaves its record.
- **VK-NPI-05** re-run: no integration identity holds a Graph permission beyond what its lane needs.
- **Rollback:** each connector action is reversed by its paired action (re-enable, re-add, reassign) through the same lane; a leaver's deprovisioning is rollback-never by design, with recovery through a new request ([Book 13, Chapter 10](../b13-governance/10-ticket-to-machine.md#which-change-classes-qualify)).
:::

## Step 6: Close only on a re-read {#step-6-close-only-on-a-re-read}

Loop step 5, and gap 1. A finding, or a ticket SailPoint's Service Desk integration opened, closes only when a re-read of the target shows the intended state. "A success response is not closure" ([Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md#the-five-clause-request-chain)).

**Prerequisites.** Gates 4 and 5 passed; the verifier account from Gate 1.

### Steps

1. **Add the *Awaiting verification* state** and the business rule that turns any close into it, unless the update carries new evidence and comes from the verifier account; a named exception approver can still cancel with a note, which is the declared-exception lane ([Build 2](snow-sailpoint-integration-kit.md#build-2-the-re-read-rule)).
2. **Apply the same rule to Service Desk tickets** on the incident and request item tables, so SailPoint's status mapping no longer decides completion.[^ttm-sdim-bp][^ttm-status]
3. **Schedule the re-read client**: it reads waiting records, re-reads the account through ISC, the identity through ISC Search, or the user through Microsoft Graph, and closes with the query, time, response hash and checker, or reopens with the differences.[^ttm-search] An ISC read reflects the last aggregation, so the client waits a grace period before calling a stale read a mismatch.
4. **Tune the grace period to the aggregation schedule**, and record the setting.

**Federal requirements and evidence.**

| Requirement | What this gate does | Evidence the ISSO keeps |
|---|---|---|
| SP 800-53 CM-3 (records of changes retained) | Each closure carries its proof | The evidence attachment and hash on each closed record |
| SP 800-53 CM-4(2) Verification of Controls (Moderate) | The change is verified after it's made | The re-read result and time |
| SP 800-53 CA-7 | Closure feeds monitoring | Closed and reopened counts per period |
| SP 800-53 AU-12 Audit Record Generation (Low, Moderate, High) | The verifier's actions are attributable | The verifier account's audit trail |

: Gate 6 requirements and evidence {.striped .hover}

**Availability.** The re-read uses ISC's Accounts and Search APIs and Graph's users endpoint; GCC uses the worldwide Graph endpoint and GCC High `graph.microsoft.us`.[^ttm-graph] The ISC API domain for a FedRAMP tenant wasn't confirmed (Gate 1).

**Interim path.** Before the client runs on a schedule, the verifier runs it by hand once a day (dry run first, then apply); the business rule still blocks a person's close.

::: {.callout-important}
## Validate (G6 Re-read)
- **Integration kit (logic, mocked):** `tests/python/test_reread_verification.py` and `tests/powershell/Invoke-ReReadVerification.Tests.ps1` (dry run writes nothing; a match closes with evidence and an attachment; a mismatch reopens with a note; a stale ISC read waits for the grace period); `tests/servicenow/servicenow_scripts.test.js` ("a person closing a finding is redirected to awaiting verification," "evidence alone, or the verifier alone, is not enough," "on incident, only SDIM-opened tickets are governed").
- **Live:** a person's close becomes *Awaiting verification*; the client closes it only after the account shows the intended state; a mismatch reopens it (kit lab items 2 and 3).
- **Rollback:** disable the business rule; records return to the platform's normal state model, and closures lose their evidence until it's re-enabled.
:::

## Step 7: Operate the tempo {#step-7-operate-the-tempo}

Once the loop runs, it runs on Book 13's tempo: P1 halts, P2 one hour, P3 24 hours, P4 72 hours, the program's windows rather than federal ones ([Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md#severity-and-tempo)).

### Steps

1. **Schedule the drift reconciliation and the re-read client**, and keep their outputs with the date and the checker version.
2. **Report the five measures** to the governance board: detection coverage, window adherence, escalation rate, machine-closure share and declared-exception count ([Book 13, Chapter 10](../b13-governance/10-ticket-to-machine.md#what-the-tempo-shows-leadership)).
3. **Route the identity fixes through the loop**, below.
4. **Export the evidence**: a nightly bundle of SailPoint events and ServiceNow records in Book 13's [evidence shape](../b13-governance/appendix-b-ticket-to-machine-reference.md#the-evidence-record), planned for the kit's Pass 2.
5. **Review each declared exception** at its end date, and each L4 class quarterly.

**The identity fixes, on these products.** From the [identity maintenance explainer's](../explainers/identity-maintenance.md) fix catalog. Everything here is *(inference)* or *(design guidance)* unless a note cites a source.

| Fix | Detect | Route and track | Fix and carry back |
|---|---|---|---|
| A wrong fact in HR | SailPoint *Identity Attributes Changed*;[^ttm-trig] or a "my information is wrong" catalog item | ServiceNow case to HR | HR corrects it in Core HCM; SailPoint re-aggregates. SailPoint can't write HR-mastered attributes back: only user name and work email are writable[^ttm-hcm] |
| A late or retroactive personnel action | A lifecycle-state change on aggregation[^ttm-lcs] | ServiceNow emergency change if after the fact | The leaver state disables accounts; the Entra connector revokes sessions on disable[^ttm-lcs][^ttm-entra] |
| An urgent leaver HR hasn't entered | A manager or security calls | ServiceNow emergency change | A SailPoint workflow or a manual lifecycle-state change runs the same leaver sequence[^ttm-wf] |
| A record the pipeline couldn't apply | A failed provisioning action, or a Service Desk "Failed" status[^ttm-status] | ServiceNow task to the identity data steward | Re-run through SailPoint, never by hand |
| A write outside the pipeline | **Native Change Detection**: an account updated outside SailPoint[^ttm-ncd] | ServiceNow finding, provenance class | SailPoint restores the value; the writer's access is reviewed. The closest fit in the catalog |
| An account that matches nobody | Uncorrelated accounts on aggregation | The account owner decides | Correlate it to a person, or disable it |
| The same person twice, or a broken link | SailPoint correlation; rehire and conversion handling[^ttm-hcm] | Data architect | A correlation-rule change. SailPoint notes partial support for some mover cases in the change feed[^ttm-hcm] |
| A fact HR doesn't own (contractors) | A separate contractor source in SailPoint | Sponsor | Correct it in the contractor source. SailPoint lists Non-Employee Risk Management among the FedRAMP ISC's capabilities;[^ttm-sp-fedramp] confirm it from the authorization package |
| A rule that derives the wrong access | A certification campaign[^ttm-certs] | Governance body, through a ServiceNow normal change | Change the role or lifecycle rule |
| Residual access after a move | Attribute-change trigger, then a certification; access granted by the previous lifecycle state is revoked automatically[^ttm-trig][^ttm-lcs] | Entitlement owner | Revocation through the connector, else a Service Desk ticket[^ttm-certs] |
| A credential that outlives the person | Outside both products: PIV and certificates | Credentialing office | The card system and the CLM platform (Book 07) |

: The identity fixes on ServiceNow and SailPoint {.striped .hover}

**Federal requirements and evidence.**

| Requirement | What this gate does | Evidence the ISSO keeps |
|---|---|---|
| SP 800-53 CA-7 Continuous Monitoring | The loop runs on a declared cadence | Scheduled run outputs; the five measures |
| SP 800-53 RA-7 Risk Response | Windows are kept or escalated | Window adherence and the overdue list |
| SP 800-53 CA-5 | Declared exceptions are tracked to closure | The exception register and POA&M items |
| SP 800-53 AU-6 Audit Record Review (Low, Moderate, High) | Events and closures are reviewed | The monthly evidence package and its review |

: Gate 7 requirements and evidence {.striped .hover}

**Availability.** Nothing beyond Gates 1 to 6.

**Interim path.** Until the evidence export exists, assemble the monthly package by hand from a ServiceNow report of closed findings with their evidence attachments and a SailPoint event search for the same period.

::: {.callout-important}
## Validate (G7 Tempo and evidence)
- **No automated check yet** for the evidence export or the measures; both are planned for Pass 2.
- **Manual:** the scheduled runs have run for a month with outputs kept; the five measures are reported once; the first monthly evidence package is assembled end to end and accepted by the ISSO.
- **Rollback:** stop the schedules; the records stay.
:::

## Dangers and how to avoid them {#dangers}

| Danger | What goes wrong | Mitigation |
|---|---|---|
| **Closure by ticket status** | A mapped "Closed" status completes SailPoint's provisioning task with nothing checked[^ttm-sdim-bp] | Gate 6's rule on every table SailPoint writes to |
| **Two approver systems for one class** | The catalog app and SailPoint both approve, or neither does[^ttm-apps] | Gate 2's approver-per-class table |
| **Two writers for one attribute** | Entra inbound provisioning and SailPoint overwrite each other | Gate 2's attribute map; the Pass 2 check |
| **A vendor-cloud action nobody recorded** | Connector calls leave SailPoint's cloud, outside the boundary the authorizing official reviewed[^ttm-ad] | Gate 1's data-flow record |
| **A feature outside the authorization** | A workflow or detection feature used in production isn't in the FedRAMP environment | Written confirmation from SailPoint before production (Gate 1) |
| **"MFA attribute management" taken for a reset procedure** | A connector changes authentication data without verifying the person[^ttm-entra] | Resets stay with the help desk's verification (Gate 5) |
| **The integration identity as a back door** | The connector's or spoke's app registration holds broad Graph write rights | Certificates, two owners, VK-NPI-05 review (Gates 1 and 5) |
| **The declared exception that never ends** | A disconnected application stays manual for good | End date, POA&M item, review at the end date (Gate 7) |

: Dangers in this example {.striped .hover}

## Evidence {#evidence}

The mapping is the program's, from Book 13's [Appendix A](../b13-governance/appendix-a-requirements-mapping.md) and the [federal framework crosswalk](../../reference/federal-framework-crosswalk.md); the authorizing official and assessors decide whether a control is satisfied. Every lane writes the same record ([Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md#the-evidence-record)); this is where each field comes from here.

| Book 13 evidence-record field | Where it comes from in this example |
|---|---|
| Origin | The SailPoint trigger and workflow, the reconciliation finding ID, or the catalog request |
| Owner and clock | The ServiceNow assignment, severity, priority and due date |
| Approval | The ServiceNow approval or CAB record for A0 and A1; the SailPoint approval for A2 and A3; the L4 class acceptance |
| Executing identity | The SailPoint connector's or the spoke's service principal; the PIM activation for a person |
| What ran | The SailPoint provisioning event, the workflow version, or the session recording |
| Result | The re-read evidence on the finding |
| Closure | The closed record with its evidence hash and attachment |

: The evidence record on ServiceNow and SailPoint {.striped .hover}

Run the checks on the continuous-monitoring cadence and file their output with the date, the tenant and the checker version. Entra ID's own audit logs are kept for 30 days on P1 or P2, so forward them to the SIEM ([Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md#what-entra-id-enforces-and-what-the-program-has-to-build)).

## Rollback

| Gate | Rollback |
|---|---|
| G1 Boundary | Nothing to roll back |
| G2 Writers and approvers | Re-decide by a reviewed change |
| G3 Sources | Disconnect the source or turn off Native Change Detection; read-only |
| G4 Front door | Disable workflows and catalog items; records stay |
| G5 Actuation | The paired action through the same lane; leavers recover by a new request |
| G6 Re-read | Disable the business rule; closures lose evidence until it's back |
| G7 Tempo | Stop the schedules; records stay |

: Rollback by gate {.striped .hover}

## Checklist

- [ ] FedRAMP status of each offering recorded with its date; feature scope confirmed in writing; vendor-cloud actions in the data-flow record (G1)
- [ ] Integration identities registered, certificate-based, least-privileged; VK-NPI-02 and VK-NPI-05 reviewed (G1)
- [ ] One writer per attribute; one approver system per authority class; a lane and a change-record type per class (G2)
- [ ] HR, Entra ID and AD aggregated and correlated on `employeeId`; baseline drift filed; VK-HR-01 and VK-HR-04 clean or owned (G3)
- [ ] Findings, requests and disconnected-application work arrive as typed, owned, clocked tasks (G4)
- [ ] Each lane actuates through a connector or a declared exception; change records where the class needs them (G5)
- [ ] No finding or Service Desk ticket closes without a re-read (G6)
- [ ] Tempo measured; identity fixes routed; monthly evidence package accepted (G7)

## What couldn't be verified

From public documentation read on November 1, 2026, unless noted:

- **ISC feature parity in the FedRAMP environment.** SailPoint's FedRAMP page lists modules but not Workflows, Native Change Detection or the HTTP Request step, and no page was found listing what isn't available there.[^ttm-sp-fedramp]
- **The ISC API domain for a FedRAMP tenant**, and the Native Change Account Updated trigger ID ([kit verify list](snow-sailpoint-integration-kit.md#what-couldnt-be-verified)).
- **SailPoint's ServiceNow apps and the Entra spoke in ServiceNow's government Store.** The Store pages render by script.[^ttm-store]
- **The Service Catalog app's approval and status write-back.** SailPoint's apps overview states them;[^ttm-apps] its integration page, revised October 30, 2026, now describes a "ServiceNow Portal Integration" and doesn't state where approval is defined.[^ttm-catalog]
- **The Entra spoke in GCC High.** Its page documents only the worldwide Graph endpoint.[^ttm-spoke]
- **How often the Service Desk integration checks ticket status**, SailPoint event retention, and end-dated access requests (from the October 24 review; not re-checked).
- **Whether SailPoint's current documentation still treats IdentityIQ's change-request ticket type as supported** on every release: the IdentityIQ page lists `changeRequest` without a release or revision date.[^ttm-iiq-itsm]

## Status and review

**Draft.** This page was rewritten on November 1, 2026 from a 140-line example into a gated implementation guide, and the rewrite hasn't been reviewed, so it moved from *In review* back to *Draft*. Product and FedRAMP facts were re-read on November 1, 2026 where the footnote says so; the rest carry the October 24, 2026 review. To move it to **Proved**, build Gates 3 to 6 in a ServiceNow developer instance and a SailPoint sandbox, run the kit's lab items, and record the evidence here. This page names products to illustrate the vendor-neutral design; it isn't an endorsement by the program or any agency. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

::: {.callout-tip}
## Back to the books
- [Book 13 — Governance](../b13-governance/index.md): [Chapter 10](../b13-governance/10-ticket-to-machine.md) for the tempo and the ticket-to-machine rule, [Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md) for the lanes and the evidence record, [Appendix A](../b13-governance/appendix-a-requirements-mapping.md) for the controls.
- [Book 15 — Compliance Automation & Day-2 Operations](../b15-day2-operations/index.md): [Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md) for triage and routing, [Chapter 13](../b15-day2-operations/13-building-day-two-automation-in-house.md) for the in-house path.
- [Book 03, Chapter 11](../b03-hr-identity/11-drift-metrics-and-evidence.md) for the drift classes, and the [identity maintenance explainer](../explainers/identity-maintenance.md) for the fix catalog.
- The [integration kit page](snow-sailpoint-integration-kit.md) for the Pass 1 code, and the [non-person identity guide](non-person-identity-implementation.md) for the integration identities.
:::

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/ttm-servicenow-sailpoint.md).

<!-- revisions:end -->

[^ttm-fr]: FedRAMP Marketplace data, <https://www.fedramp.gov/marketplace/products.json> (last change November 1, 2026): ServiceNow Government Community Cloud (F1305072116: FedRAMP Certified, High, Class D, JAB path, certified August 12, 2019); SailPoint Identity Security Cloud (FR2001938710A: FedRAMP Certified, Moderate, Class C, agency path, certified June 5, 2024); UberEther IAM Advantage (FR2208555094), whose service description lists SailPoint IdentityIQ among its components. No other ServiceNow offering is listed (read November 1, 2026).
[^ttm-sp-fedramp]: SailPoint, "Identity for government and critical infrastructure" (FedRAMP Moderate ATO; hosted in AWS GovCloud; modules and capabilities included, among them Non-Employee Risk Management; no list of unavailable features), <https://www.sailpoint.com/solutions/fedramp-isc> (read November 1, 2026).
[^ttm-hf]: SailPoint, Human Fabric product page, <https://www.sailpoint.com/products/human-fabric> (read October 24, 2026).
[^ttm-sdim]: SailPoint, "Integrating SailPoint with ServiceNow Service Desk" (revised September 21, 2026: converts Identity Security Cloud provisioning actions into tickets; supports only the Service Request and Incident ticket types; requires an active Identity Security Cloud ServiceNow Service Desk license), <https://documentation.sailpoint.com/connectors/servicenow/sdim/help/integrating_servicenow_sdim/intro.html> (read November 1, 2026).
[^ttm-sdim-bp]: SailPoint, "SDIM: Best Practices" (status mapping determines when a ticket is closed in ServiceNow, so that the provisioning task "is also treated as complete"), <https://documentation.sailpoint.com/connectors/servicenow/sdim/help/integrating_servicenow_sdim/best_practices.html> (read November 1, 2026).
[^ttm-status]: SailPoint, "SDIM: Status Mapping," <https://documentation.sailpoint.com/connectors/servicenow/sdim/help/integrating_servicenow_sdim/status_mapping.html>, and "Configuring SailPoint for ServiceNow Service Desk," <https://documentation.sailpoint.com/connectors/servicenow/sdim/help/integrating_servicenow_sdim/configure_sailpoint.html> (read October 24, 2026).
[^ttm-apps]: SailPoint, "Getting Started with ServiceNow" (the Identity Governance, Service Desk and Service Catalog apps; Service Catalog requests for roles, access profiles and entitlements raised after separation-of-duties checks, approved through "the approval process defined within ServiceNow," provisioned by Identity Security Cloud with the status updated in ServiceNow), <https://documentation.sailpoint.com/connectors/servicenow/service_catalog/help/common/snow/servicenow_apps_intro.html> (read November 1, 2026).
[^ttm-catalog]: SailPoint, "Integrating ISC with the ServiceNow Service Catalog Application" (revised October 30, 2026: describes the ServiceNow Portal Integration, a separate app in the ServiceNow Store that requires additional licensing or subscriptions), <https://documentation.sailpoint.com/connectors/servicenow/service_catalog/help/integrating_service_catalog/intro.html> (read November 1, 2026).
[^ttm-iiq-itsm]: SailPoint, "Configuring IdentityIQ to Integrate with ServiceNow" (ticket types `serviceRequest`, `incident` and `changeRequest`), <https://documentation.sailpoint.com/connectors/identityiq/servicenow/sdim/help/integrating_servicenow_sdim/configuring__to_integrat.html> (read November 1, 2026; the address cited on October 24 now returns not found).
[^ttm-spoke]: ServiceNow, "Microsoft Entra ID spoke" (Zurich: ten action categories; requires an Integration Hub subscription; a custom app in Microsoft Entra issues OAuth 2.0 tokens, delegated with the authorization code grant or application with client credentials; the connection alias points at `https://graph.microsoft.com`), <https://www.servicenow.com/docs/bundle/zurich-integrate-applications/page/administer/integrationhub/concept/microsoft-azure-ad-spoke.html> (read November 1, 2026).
[^ttm-store]: ServiceNow, "Environments with federal or regional ServiceNow Store instances" (Yokohama: regulated environments, including the government cloud, have an isolated Store instance), <https://www.servicenow.com/docs/r/VbEA8DxUy61CFZ25mbYrcQ/VHU4zAdCjZkmR77lHBQOVw> (read November 1, 2026).
[^ttm-gov]: SailPoint, "Azure Government Endpoint Configuration" (Microsoft Entra connector: `msGraphResourceBase` `https://graph.microsoft.us`, `msGraphTokenBase` `https://login.microsoftonline.us`, set through the source-update API), <https://documentation.sailpoint.com/connectors/saas/msentraid/help/saas_connectivity/microsoft_entra_id/endpoint_configuration.html> (read November 1, 2026).
[^ttm-graph]: Microsoft Learn, "Microsoft Graph national cloud deployments" (Microsoft 365 GCC continues to use the worldwide endpoints; GCC High uses `https://graph.microsoft.us`; Azure US Government sign-in at `https://login.microsoftonline.us`), <https://learn.microsoft.com/graph/deployments> (read November 1, 2026).
[^ttm-entra-gov]: Microsoft Learn, "Microsoft Entra feature availability" (Azure for US Government: Privileged Identity Management, access reviews, entitlement management and Lifecycle Workflows available; API-driven inbound provisioning available; Microsoft Entra ID Governance available in GCC, GCC High and DoD), <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (read November 1, 2026).
[^ttm-ncd-help]: SailPoint, "Managing Native Change Detection" (detects accounts created, updated or deleted out of band, on aggregation, one event per changed account; not available for Non-Employee Lifecycle Management sources; the page now names the product SailPoint Human Fabric), <https://documentation.sailpoint.com/saas/help/sources/native_change_detection.html> (read November 1, 2026).
[^ttm-ncd]: SailPoint Developer, "Native Change Account Updated" event trigger, <https://developer.sailpoint.com/docs/extensibility/event-triggers/triggers/native-change-account-updated> (read October 24, 2026).
[^ttm-trig]: SailPoint Developer, "Identity Attributes Changed" event trigger, <https://developer.sailpoint.com/docs/extensibility/event-triggers/triggers/identity-attribute-changed> (read October 24, 2026).
[^ttm-lcs]: SailPoint Developer, "Lifecycle States," <https://developer.sailpoint.com/docs/api/lifecycle-states> (read October 24, 2026).
[^ttm-certs]: SailPoint, "Understanding Certifications," <https://documentation.sailpoint.com/saas/help/certs/understanding_certifications.html> (read October 24, 2026).
[^ttm-wf]: SailPoint Developer, "Workflows," <https://developer.sailpoint.com/docs/api/workflows>, and SailPoint's Identity Security Cloud OpenAPI specification, WorkflowBody ("Workflows cannot be created in an enabled state"), <https://github.com/sailpoint-oss/api-specs/blob/main/idn/v2025/schemas/workflows/WorkflowBody.yaml> (read October 24, 2026).
[^ttm-entra]: SailPoint, "Microsoft Entra SaaS: Supported Features" (accounts, groups, service-plan licenses, directory roles, administrative units, access packages, PIM for roles and groups, MFA attribute management; on disable, the user is signed out of existing sessions), <https://documentation.sailpoint.com/connectors/saas/msentraid/help/saas_connectivity/microsoft_entra_id/supported_features.html> (read November 1, 2026).
[^ttm-ad]: SailPoint, "Integrating SailPoint with Active Directory" (revised September 17, 2026), <https://documentation.sailpoint.com/connectors/active_directory/help/integrating_active_directory/intro.html> (read October 24, 2026).
[^ttm-search]: SailPoint Developer, "Search," <https://developer.sailpoint.com/docs/api/search> (read October 24, 2026).
[^ttm-chg]: ServiceNow, "Change types" (Zurich IT Service Management: standard changes pre-authorized, with no group, peer or CAB step; normal changes need two levels of approval; emergency changes go directly to CAB authorization; an unplanned change to a configuration item creates an unauthorized change request), <https://www.servicenow.com/docs/r/MlbQAgTiiiMOLOw9T36wJg/0mfA2AyAdGPOssbbVgOLLQ> (read November 1, 2026).
[^ttm-appr]: SailPoint Developer, "Access Request Approvals," <https://developer.sailpoint.com/docs/api/access-request-approvals> (read October 24, 2026).
[^ttm-hcm]: SailPoint, "Oracle HCM Cloud SaaS: Supported Features," <https://documentation.sailpoint.com/connectors/saas/oracle_hcm_cloud/help/saas_connectivity/oracle_hcm_cloud/supported_features.html> (read October 24, 2026).
