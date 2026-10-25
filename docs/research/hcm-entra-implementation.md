---
title: "Building Book 03's HR Pipeline: Oracle Fusion Cloud HCM to Microsoft Entra ID"
subtitle: "An implementation guide: reading Core HCM through HCM Extracts and Atom feeds, the middleware's five duties, the /bulkUpload contract, the two landing zones, Lifecycle Workflows, and the evidence the pipeline has to leave"
description: "Research under review: an implementation guide for building Book 03's HR-driven provisioning pipeline from Oracle Fusion Cloud HCM to Microsoft Entra ID and Active Directory with API-driven inbound provisioning. It covers what the Federal HR 2.0 solicitation says about identity, how Oracle publishes future-dated hires and separations, the Entra app setup, permissions, limits, logs and quarantine, the attribute mapping from Book 03's canonical schema to SCIM and the directories, the joiner, mover, leaver, rehire and conversion sequences, build phases mapped to Book 03 and Gate G1, security and privacy, testing and cutover, risks and vendor asks, with illustrative Python and PowerShell that convert and validate an extract."
research-status: in review
research-type: implementation guide
research-book: "Book 03"
date-modified: 2026-10-25
---

# Building Book 03's HR Pipeline: Oracle Fusion Cloud HCM to Microsoft Entra ID {.unnumbered}

[Book 03 — HR-Driven Identity](../books/b03-hr-identity/index.md) sets the design: HR is the source of authority for the person, a middleware in the agency's boundary does [five duties for every event](../books/b03-hr-identity/05-the-provisioning-pipeline.md#the-middleware-five-duties-per-event), Microsoft Graph `/bulkUpload` is the one door into the directory, users land in Active Directory or Entra ID depending on where they are in the migration, and Lifecycle Workflows act on the accounts that provisioning creates. [Chapter 06](../books/b03-hr-identity/06-canonical-attribute-schema.md) fixes the canonical schema, and [Chapter 12](../books/b03-hr-identity/12-execution-plan.md) the phases. This guide shows how to build that pipeline from Oracle Fusion Cloud HCM, the Core HCM platform that Federal HR 2.0 awarded, to Microsoft Entra ID.

::: {.callout-note}
## An example, not an endorsement
This guide names two vendors because Book 03's principal example does. It isn't an endorsement by any agency, and Book 03's identity model doesn't depend on either vendor. Every product, program and solicitation fact was checked against primary sources on October 25, 2026, and is footnoted. Statements marked *(design guidance)* are the program's recommendations; statements marked *(inference)* are conclusions the sources support but don't state.
:::

**The example code:** [examples/hcm-entra on GitHub](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hcm-entra). Equivalent Python and PowerShell clients convert an HCM Extract row into a SCIM bulk operation using Chapter 06's mapping, validate it the way Appendix A asks, and only post to `/bulkUpload` when told to. They're **illustrative: unit-tested against fixtures, not proven against live tenants**.

## What it covers

| Part | Content |
|---|---|
| Orientation | Book 03's pipeline mapped to Oracle and Microsoft components; what the Federal HR 2.0 solicitation says about identity; the two decisions to make first |
| 1. The Entra side | The two provisioning apps, setup, permissions, limits, provisioning logs, job quarantine, Lifecycle Workflows, Microsoft's Oracle pattern, GCC availability |
| 2. The Oracle side | HCM Extracts, Atom feeds, REST, how future-dated events are published, retention, the integration identity, FedRAMP status |
| 3. The mapping | Book 03's canonical schema through Oracle, the middleware and SCIM to AD and Entra ID; joiner, mover, leaver, emergency termination, rehire, conversion and cancellation |
| 4. Build and secure | Build phases mapped to Chapter 12 and Gate G1; security and privacy per Appendix B; testing and cutover per Appendix C |
| Close | The example code, risks, vendor asks, what couldn't be verified, and the source notes |

## What the research found

Ten findings change how the pipeline is planned:

- **The Federal HR 2.0 solicitation anticipates an identity feed from Core HCM.**
  - Its appendix of required integrations includes, in a sample interconnection table for a large department or agency, an "Identity Management Solution": "Provision identity attributes using Core HCM is the authoritative source for user identity data."[^he-pws-appb]
  - It also says the Core HCM Steering Committee "will review and approve any agency-specific integrations requirements."[^he-pws-appb]
  - Book 03 Chapter 03 says the reverse direction isn't in the solicitation. It is there as a sample, with no protocol or directory named. Submit the identity feed to the Steering Committee in Phase 0 *(design guidance)*.
- **OPM names its own Entra-based identity solution for the platform.** The performance work statement asks the contractor to "Integrate and implement OPM approved identity management solution using OPM MS Entra-based solution."[^he-pws-core] That is the platform's own sign-in and user provisioning, alongside the SCIM 2.0 requirement Book 03 records;[^he-pws-req5] it says nothing about how the platform feeds an agency's directory.
- **Persistent integrations with OPM-managed systems go through an OPM-hosted API gateway**, with OAuth 2.0, rate limiting and IP filtering; exceptions need written approval.[^he-pws-appb] Whether an agency's identity middleware reads Core HCM directly or through that gateway couldn't be verified. It decides the middleware's source authentication and egress, so ask before building it.
- **Future-dated hires and separations are hidden from the Atom feed by default.**
  - Oracle sets a future-dated entry's `updated` date to the effective start date and returns no entries with an `updated` date past today, unless the client asks by `published` date.[^he-ora-dated][^he-ora-read]
  - Oracle's polling guidance makes the client choose: process future-dated entries when they become effective, or immediately.[^he-ora-poll]
  - Lifecycle Workflows' scheduled trigger catches up only three days.[^he-lcw-exec] A pipeline that polls by effective date delivers a hire on the start date, too late for any pre-hire workflow set further ahead *(inference)*. Poll by published date and hold the effective dates in the middleware *(design guidance)*.
- **Atom feed entries are archived after 60 days and purged after 90 by default.**[^he-ora-purge] Any feed outage needs a reconciliation by extract; past 90 days the changes are gone.
- **Oracle's integration identity is a named user with a signing key.** For Fusion Applications REST paths, Oracle supports authorization code and JWT user assertion flows, says client credentials can be used "only for Spectra services," and recommends client assertion over client secret.[^he-ora-oauth] Oracle also says not to use REST for change detection or bulk: use Atom feeds and HCM Extracts.[^he-ora-workers]
- **Microsoft's two pages disagree on the permission to read provisioning logs.** Entra's guidance grants `ProvisioningLog.Read.All`;[^he-ms-grant] the Graph v1.0 reference for listing provisioning logs gives `AuditLog.Read.All` and `Directory.Read.All` as the least-privileged pair.[^he-ms-provlist] Test the narrow one first, and keep the log reader a separate identity from the uploader.
- **"Quarantine" means two things.** Book 03's [quarantine contract](../books/b03-hr-identity/appendix-a-lifecycle-rules.md#the-quarantine-contract) holds failed records in the middleware. Microsoft's quarantine is a state of the whole provisioning job: an empty notification email, invalid credentials, a tripped deletion threshold or a high failure rate puts the job there, cycles slow to daily, and after four weeks the job is disabled.[^he-ms-config][^he-ms-quar][^he-ms-accdel] Each needs its own runbook *(design guidance)*.
- **Lifecycle Workflows now writes account state in Active Directory too.** The enable, disable and delete tasks can act on synchronized AD users through the provisioning agent.[^he-lcw-tasks][^he-lcw-onprem] So account state has two writers, the pipeline's `active` value and the workflow; the pipeline must send `active` false no later than the leaver workflow's first run, or a later re-send can undo the workflow's disable *(inference; design guidance)*.
- **Custom security attributes are a new carrier for sensitive HR values.** API-driven provisioning can set them on Entra ID users; their values are redacted in provisioning logs, and only attribute-assignment roles can read them.[^he-ms-csa] They can't drive dynamic membership,[^he-ms-csa-faq] so access codes stay in `extensionAttribute10`–`12` as Chapter 06 says, and custom security attributes suit sensitive values that no rule reads *(design guidance)*.

The guide keeps Book 03's architecture unchanged. Findings 1, 2, 4 and 9 refine what Chapters 03 and 08 say; the rest add build detail.

## Orientation: Book 03's pipeline on Oracle and Entra

| Book 03 component (Chapter 05) | Oracle and Microsoft realization | Where it runs |
|---|---|---|
| Authoritative workforce source | Oracle Fusion Cloud HCM: HCM Extracts for bulk, Atom feeds for changes, `workers` REST for enrichment[^he-ora-extracts][^he-ora-feeds][^he-ora-workers] | Oracle's SaaS (FedRAMP Moderate listing, below) |
| Boundary transformation and governed model | The middleware: validate, sequence, normalize to SCIM, write provenance, reconcile | Azure Functions or Logic Apps in the agency's boundary |
| Provisioning service | Microsoft Graph `/bulkUpload` on an API-driven provisioning app[^he-ms-bulk] | Microsoft Entra provisioning service |
| Landing zone: Active Directory | *API-driven provisioning to on-premises Active Directory*, through the Microsoft Entra provisioning agent; then Connect Sync or Cloud Sync to the cloud[^he-ms-config] | Agent servers with line of sight to domain controllers |
| Landing zone: Entra ID | *API-driven provisioning to Microsoft Entra ID*, cloud-only users[^he-ms-config] | Entra ID |
| Lifecycle actions | Lifecycle Workflows from `employeeHireDate` and `employeeLeaveDateTime`[^he-ms-concepts] | Entra ID Governance |
| Evidence | Provenance store; provisioning logs; workflow history | Agency evidence store |

### What the solicitation says about identity

Book 03 Chapter 03 records the solicitation's SCIM 2.0 requirement. The final amendment says more:

| Where | What it says | What it means for the pipeline |
|---|---|---|
| Functional Requirements Matrix, Req. 5 | SCIM 2.0 provisioning "from the Government's identity provider (IdP) to the Contractor's system," near real time or within an SLA such as 15 minutes, with logging of provisioning events[^he-pws-req5] | Into the platform, not out of it. As Book 03 says |
| Core implementation, §5.1.1 | The platform in FedRAMP Moderate or higher environments; "OPM approved identity management solution using OPM MS Entra-based solution"[^he-pws-core] | Platform users sign in through OPM's solution; the agency's tenant is a separate concern |
| Strong authentication, §6.6.2 | Integrate with OPM's identity provider and accept a SAML assertion[^he-pws-sec] | Same |
| Appendix B, integration layer | Persistent connections for OPM-owned integrations through an OPM-hosted API gateway with OAuth 2.0, rate limiting and IP filtering[^he-pws-appb] | Ask whether the agency feed uses it |
| Appendix B, agency integrations | The Steering Committee approves agency-specific integrations; a sample large-agency interconnection lists an "Identity Management Solution" fed by Core HCM as "the authoritative source for user identity data"[^he-pws-appb] | The identity feed is an expected interconnection; get it approved |

The memo's sample onboarding timeline puts "Interconnection(s) go-live and production setup complete" and "Data Migration for obfuscation" at month 5, UAT "Shadow Mode" in months 6 to 8, and data migration and cutover at month 8.[^he-memo] Two consequences follow *(inference)*:
- Core HCM data before month 8 is obfuscated, so correlation against real `employeeId` values can't be proven in Core HCM until cutover unless person numbers survive obfuscation. Correlate against the legacy HR source in Phases 1 to 3.
- The platform's own shadow-mode UAT is the natural window for the pipeline's shadow mode (Phase 3).

### The two decisions to make first

**1. How the middleware reads future-dated events.** Polling by `updated` date is simple but delivers each hire and separation on its effective date. Polling by `published` date delivers it when HR enters it, and the middleware holds the effective date.[^he-ora-poll][^he-ora-dated] Book 03's day-one readiness and pre-separation steps need the second *(inference)*. Recommendation: published-date polling for `newhire`, `termination` and `cancelworkrelship`, with a daily changes-only extract as the reconciliation *(design guidance)*.

**2. Which path the middleware takes to Core HCM.** Directly to Oracle's endpoints with an Oracle integration user, or through OPM's API gateway with whatever credential OPM issues.[^he-pws-appb] This sets the credential type, the egress allow-list and the rate limits. Settle it with the HR 2.0 program before Phase 2.

## Part 1: The Entra side

### The provisioning apps

Two gallery applications expose the endpoint: *API-driven provisioning to on-premises Active Directory* for hybrid users, and *API-driven provisioning to Microsoft Entra ID* for cloud-only users. Each app has its own endpoint, so an agency creates one per source and per landing zone.[^he-ms-config][^he-ms-faq]

| Setup step | What to know |
|---|---|
| Roles | Application Administrator; plus Hybrid Identity Administrator for the AD app[^he-ms-config] |
| AD app | Install the provisioning agent, select the domain and the default OU, test the connection[^he-ms-config] |
| Notification email | Mandatory. "If the Notification Email is left empty, then the provisioning goes into quarantine when you start the execution"[^he-ms-config] |
| Start | *Start provisioning* puts the job in listen mode; *Restart provisioning* purges payloads waiting to be processed; *Provision on demand* "is not supported for API-driven inbound provisioning"[^he-ms-config] |
| Endpoint | Copied from **View technical information**; the portal shows a `beta` URL, and the Graph reference documents `POST /servicePrincipals/{servicePrincipalId}/synchronization/jobs/{jobId}/bulkUpload` in v1.0[^he-ms-faq][^he-ms-bulk] |
| Custom attributes | Add SCIM extension URNs to the app's attribute list, then map them; for 20 or more, Microsoft's CSV2SCIM script has an `UpdateSchema` mode[^he-ms-custom] |
| Matching | By default `externalId` matches `employeeId`; if no user matches, the job creates one[^he-ms-faq] |
| Deletion | `/bulkUpload` doesn't delete users; Microsoft points to the Lifecycle Workflows delete task. Microsoft also advises turning off the **Delete** target action; in AD a delete is a hard delete[^he-ms-faq] |
| Clearing values | A preview; send the complete record every time, because an omitted mapped attribute can clear the target[^he-ms-concepts] |

### The contract

| Property | Value |
|---|---|
| Request | SCIM `BulkRequest`, `Content-Type: application/scim+json`, at most 50 operations[^he-ms-bulk] |
| Response | `202 Accepted`, with a `Location` header pointing at the provisioning logs filtered on the job[^he-ms-bulk] |
| Manager | `manager.value` carries the manager's `externalId`; the service resolves it[^he-ms-bulk] |
| Methods | POST only; an update is another POST of the same record[^he-ms-faq] |
| Throttling | 40 calls in any 5-second window per the concepts page; 40 requests per second per the Graph reference. Pace to the stricter[^he-ms-concepts][^he-ms-bulk] |
| Daily cap | 2,000 calls per 24 hours with Entra ID P1 or P2; 6,000 with Entra ID Governance[^he-ms-concepts] |
| Licensing | Entra ID P1 for API-driven provisioning;[^he-ms-lic] Entra ID Governance for Lifecycle Workflows |

### Permissions

| Identity | Permission | Note |
|---|---|---|
| Uploader | `SynchronizationData-User.Upload.OwnedBy` (least privileged) or `SynchronizationData-User.Upload` | The Graph reference ranks `.OwnedBy` least privileged; there is no user-assignable directory role for the API, and a User Administrator can call it directly[^he-ms-bulk] |
| Log reader | `ProvisioningLog.Read.All`; or, per the Graph list page, `AuditLog.Read.All` and `Directory.Read.All` | The pages disagree; test the narrow one[^he-ms-grant][^he-ms-provlist][^he-ms-perms] |
| Not for the middleware | `Synchronization.ReadWrite.All`, `Application.ReadWrite.All` | The pause switch belongs to an operator role (Appendix B) |

Entra's guidance frames `.OwnedBy` for an HR software vendor that creates its own provisioning app, together with `Application.ReadWrite.OwnedBy`.[^he-ms-grant] Whether an in-house client made owner of a gallery-created app gets the same scoping is worth testing *(inference)*. Microsoft's CSV2SCIM script also asks for `Application.Read.All` and `Synchronization.Read.All` to look up the job;[^he-ms-ps] configuring the endpoint directly avoids both *(design guidance)*. Microsoft recommends certificate authentication or managed identities for production.[^he-ms-grant]

### Provisioning logs: the reconcile duty

The client reads `GET /auditLogs/provisioning`, filtered on `jobId`, `cycleId`, `changeId`, `sourceIdentity/id` or `activityDateTime`; filters are case-sensitive. Each entry carries `provisioningAction` (`create`, `update`, `delete`, `stageddelete`, `disable`, `other`), `provisioningStatusInfo` with error details, the processing steps and the modified properties.[^he-ms-provlist][^he-ms-provres] The list API is available in the global service and both US Government clouds.[^he-ms-provlist] Match each entry to the source event by `externalId`, retry transient failures with the complete record, and turn permanent ones into owned exceptions (Chapter 05).

### Job quarantine and the deletion threshold

| Trigger | What happens | Source |
|---|---|---|
| Empty notification email | Quarantine when execution starts | [^he-ms-config] |
| Invalid credentials or configuration | Quarantine; one notification email | [^he-ms-quar] |
| Failure rate | Evaluated from 5,000 failures; quarantine above 40% failed or 40,000 failures (reference failures, such as manager updates, excluded); absolute limit 60,000 including reference failures | [^he-ms-quar] |
| Disables and deletions over the threshold | Quarantine until an administrator allows or rejects them; held objects appear as `StagedAction` or `StagedDelete` | [^he-ms-accdel] |
| While quarantined | Incremental cycles slow to once a day; after more than four weeks the job is disabled | [^he-ms-quar] |

Set the deletion threshold on both apps, watch the notification mailbox, and poll the job's status *(design guidance)*.

### Lifecycle Workflows

| Topic | What Microsoft documents |
|---|---|
| Trigger attributes | `employeeHireDate` and `employeeLeaveDateTime`, both DateTimeOffset, supported by HR inbound provisioning, Cloud Sync and Connect Sync[^he-lcw-sync] |
| Formats | A custom import to an AD string attribute must use `yyyyMMddHHmmss.fZ`; Graph expects `YYYY-MM-DDThh:mm:ssZ`[^he-lcw-sync] |
| Time of day | Hire early in the day (1 AM or 5 AM), leave late (9 PM or 11 PM); the tenant schedule (default every 3 hours) can delay a run; a new hire's Temporary Access Pass lifetime of 24 hours; know how the source gives time zones[^he-lcw-sync] |
| Triggers | Time based (0 to 180 days), attribute change, group membership change, sign-in inactivity, on-demand; a preview *Time based attribute V2* allows 0 to 365 days but "doesn't have a three-day catch-up window"[^he-lcw-exec] |
| Catch-up | Users whose trigger date passed no more than three days ago are still processed; each user is re-evaluated just before processing[^he-lcw-exec] |
| Synced AD users | Enable, disable and delete tasks act in AD when the task argument is set and the provisioning agent (1.1.1586.0 or later) is installed; deletes need the AD Recycle Bin[^he-lcw-tasks][^he-lcw-onprem] |
| Temporary Access Pass task | The user must have no other authentication methods, sign-ins or Entra role assignments[^he-lcw-tasks] |

### Microsoft's Oracle pattern

Microsoft's Oracle HCM guide is the starting point, and Book 03 follows it: an initial load by CSV from HCM Extracts, BI Publisher or Oracle Integration Cloud; deltas by Atom feeds (`newhire`, `empassignment`, `empupdate`, `termination`, `cancelworkrelship`, `workrelshipupdate`), by CSV extracts or by Oracle Integration Cloud; feeds turned on "immediately after your initial sync"; a custom module for validation, unique ID generation, sequencing, conversion and error handling; five to ten records first; hire date from `EffectiveStartDate`, leave date from `EffectiveDate`; optional writeback through the Oracle Fusion ERP gallery connector, Update only.[^he-ms-oracle]

Treat it as a pattern, not a specification *(design guidance)*:
- Its introduction says the API can "create, update, and delete users"; the FAQ says `/bulkUpload` doesn't delete.[^he-ms-oracle][^he-ms-faq]
- Its worksheets spell the leave-date URN `...COMPANYAME:1.0:User:TermDate`, while the hire date uses `COMPANYNAME`.[^he-ms-oracle] Copy the namespace from one place.
- Worksheet 2 maps Oracle *Username* to SCIM `displayName` and uses department and division names; its payload example uses `DepartmentId` and `BusinessUnitId`.[^he-ms-oracle] Chapter 06 decides: codes for access attributes, names for display.
- Its writeback setup asks for an Oracle administrator's username and password.[^he-ms-oracle] Writeback is optional in Book 03; defer it.

Microsoft's samples are starting points too. The Logic Apps template reads the CSV from an Azure file share with an access key, converts it through a third-party function deployed from GitHub with CORS set to `*`, and leaves log scanning and retry unimplemented; the PowerShell script chunks to 50 records and supports certificate authentication.[^he-ms-la][^he-ms-ps]

### GCC

API-driven provisioning became generally available in the US Government cloud in June 2025,[^he-ms-whatsnew] and Microsoft's feature table lists it, with provisioning-agent registration for US Government tenants; Entra ID Governance is available in GCC, GCC High and DoD.[^he-ms-feat] Microsoft 365 GCC tenants use the worldwide `graph.microsoft.com`; GCC High uses `graph.microsoft.us` and DoD `dod-graph.microsoft.us`.[^he-ms-deploy]

## Part 2: The Oracle side

### Surfaces

| Surface | Use in the pipeline | What Oracle documents |
|---|---|---|
| HCM Extracts | Initial load; daily reconciliation; lookahead of future-dated records | "The main way to retrieve data in bulk"; CSV, XML and other formats through BI Publisher; output retrieved as a byte stream[^he-ora-extracts] |
| Changes-only extracts | Daily reconciliation | Compares the current data with the baseline from previous runs; needs threading database details set up[^he-ora-changes] |
| Atom feeds, `employee` workspace | Changes | `/hcmRestApi/atomservlet/employee/<collection>`; `newhire`, `empassignment`, `empupdate`, `payupdate`, `termination`, `cancelworkrelship`, `workrelshipupdate`; triggered for employee, contingent worker and pending worker types[^he-ora-feeds] |
| `workers` REST | Enrichment only | All worker records as of a date (employee, contingent, pending); not for change detection or bulk[^he-ora-workers] |
| `publicWorkers` REST | Public directory data | Active workers today, including nonworkers; addressed by `PersonId`[^he-ora-public] |
| SCIM (`/hcmRestApi/scim/...`) | Optional writeback of username or work email | Oracle: use it "only ... to make necessary changes to HCM data including username or user email"[^he-ora-ems] |

### Reading the feeds

- **Parameters.** `updated-min`/`updated-max` or `published-min`/`published-max` (lower bound exclusive, upper inclusive; ISO 8601 such as `2017-07-14T14:04:00.000Z`), `page-size`, `page`, `orderBy`, and `archive=yes` for archived entries.[^he-ora-read][^he-ora-poll]
- **Order and failure.** Process entries chronologically, advance the last-processed timestamp only on success, and stop at the first failure.[^he-ora-poll] Entries at the same timestamp can come back on the next poll, so processing must be idempotent *(inference)*.
- **Future-dated entries.** Hidden until effective unless polled by published date (finding 4).[^he-ora-dated]
- **Retention.** 60 days to archive, 90 to purge, by default.[^he-ora-purge]
- **Feed configuration.** The `empassignment` feed must be configured to include `PeriodOfServiceId` in its context, or the context "does not provide enough information."[^he-ora-ems]
- **Keys.** Use `PersonNumber`: "PersonID can vary across environments."[^he-ora-ems]

### Lifecycle signals

| Event | What Oracle's entitlement guide shows[^he-ora-ems] | Pipeline action *(design guidance)* |
|---|---|---|
| Hire | `newhire`, then `empassignment` for the assignment; appears on the effective date unless polled by published date | Joiner; hold the hire date |
| Pending worker | `newhire` with PeriodType `P`, WorkerType `PWK`, created before the hire date | Out of scope unless the agency provisions from the pending record |
| Rehire | A new work relationship for an existing person; "check your data for an existing PersonNumber" | Same `externalId`: the existing account re-links |
| Promotion or transfer | `empupdate` and `empassignment` with ActionCode `PROMOTION` or `TRANSFER` and old and new BusinessUnitId, OrganizationId, PositionId, LocationId, JobId | Mover: re-send the complete record |
| Termination | `termination` with `ActualTerminationDate` | Leaver |
| Cancelled work relationship | `cancelworkrelship` with DMLOperation `DELETE`; "check if the employee has another active work relationship"; no work relationships means terminated | Cancellation or rescinded offer (Appendix A), never a blind leaver |

Oracle's REST pages give worker types as Employee (E), Contingent Worker (C), Pending Worker (P) and Nonworker (N); its feed samples use values such as `EMP` and `PWK`, and one sample shows `E`.[^he-ora-ems] Map both forms.

### The integration identity

Oracle's OAuth tokens come from the OCI IAM identity domain of the Fusion instance. For Fusion Applications REST paths the supported flows are authorization code, authorization code with PKCE and JWT user assertion; "The Client Credentials grant type can be used only for Spectra services."[^he-ora-oauth] Oracle's entitlement guide uses JWT for feeds and SCIM.[^he-ora-ems] So the middleware asserts a dedicated integration user with a private key held in a vault *(inference)*. Give that user a custom role limited to the employee feeds, worker reads and extracts it needs; the SCIM writeback privilege (`ASE_REST_SERVICE_ACCESS_IDENTITY_INTEGRATION_PRIV`) only if writeback is in scope.[^he-ora-ems] The exact read privileges couldn't be verified from Oracle's public pages.

### FedRAMP

The FedRAMP Marketplace lists Oracle's "Fusion Cloud" (package F1603257882) as FedRAMP Certified at Class C, Moderate, on the agency path, certified January 13, 2020, with 10 authorizations; it's SaaS covering ERP, HCM, supply chain and CX, deployed as a Government Community Cloud.[^he-fr] The solicitation asks for FedRAMP Moderate or higher.[^he-pws-core] Whether OPM's Core HCM instance runs under that package couldn't be verified.

## Part 3: The mapping

### Canonical schema to directory

| Canonical field (Chapter 06) | Oracle source | Middleware rule *(design guidance)* | SCIM attribute | AD | Entra ID |
|---|---|---|---|---|---|
| Person number | `PersonNumber` | Required; at most 16 characters (the `employeeId` limit);[^he-ms-user] or the enterprise person key ([Chapter 04](../books/b03-hr-identity/04-attribute-authority.md#one-person-layered-identifiers)) | `externalId` | `employeeID` | `employeeId` |
| Employment active | Assignment status; `termination` | Active and suspended statuses true; inactive false at the effective time; future hires false until day one | `active` | `accountDisabled` | `accountEnabled` |
| Names | `workers.names`, `DisplayName` | Display only; `displayName` at most 256 characters[^he-ms-user] | `name.givenName`, `name.familyName`, `displayName` | `givenName`, `sn`, `cn` | `givenName`, `surname`, `displayName` |
| Job title | `JobName` | Display only; at most 128 characters[^he-ms-user] | `title` | `title` | `jobTitle` |
| Department | Department name | At most 64 characters[^he-ms-user] | enterprise `department` | `department` | `department` |
| Division, cost center | Business unit, cost center | Name or code, chosen once | enterprise `division`, `costCenter` | `division`, — | `employeeOrgData` |
| Legal employer | Legal employer | At most 64 characters[^he-ms-user] | enterprise `organization` | `company` | `companyName` |
| Manager | Manager's person number | Not self; unresolved never blocks a joiner; a separated manager is a finding | enterprise `manager.value` | `manager` (DN) | `manager` |
| Worker type | `WorkerType` | Unknown refused; pending and nonworker scoped separately | extension `workerType` | `employeeType` | `employeeType` |
| Worker type code | same | `EMP`, `CTR` | extension `workerTypeCode` | `extensionAttribute11` | `extensionAttribute11` |
| Job code | Job code | | extension `JobCode` | `extensionAttribute1` | `extensionAttribute1` |
| Hire date | `EffectiveStartDate` | Date, early local time and offset, as UTC | extension `HireDate` | `extensionAttribute2`, as `yyyyMMddHHmmss.fZ` | `employeeHireDate` |
| Leave date | `ActualTerminationDate` | Date, late local time and offset, as UTC | extension `TermDate` | `extensionAttribute3`, same | `employeeLeaveDateTime` |
| Work country | Work address country | ISO country code | `addresses[type eq "work"].country` | `co` | `country` |
| Organization code | Department ID | Code list | extension `orgCode` | `extensionAttribute10` | `extensionAttribute10` |
| Position category | Job family or position category | Code list | extension `positionCategory` | `extensionAttribute12` | `extensionAttribute12` |
| UPN, `samAccountName` | — | Generated in the app on create only, or by the middleware; the service doesn't resolve UPN conflicts[^he-ms-faq] | `userName` (optional) | `userPrincipalName`, `sAMAccountName` | `userPrincipalName` |
| Email | — | Not sent; the directory generates it | — | generated | `mail` |

The slot assignments are Book 03's program attribute map; Microsoft's Oracle worksheets supply slots 1 to 3.[^he-ms-oracle] For AD-landed users, convert the ISO dates in the AD app's mapping expression to the format Microsoft requires *(inference: test the expression in the tenant)*.[^he-lcw-sync]

### The sequences

- **Joiner.** The hire arrives at entry (published-date polling). The middleware sends the complete record with `HireDate` and `active` false, so the account exists disabled before day one, as Appendix C's first acceptance row requires *(design guidance)*. On the hire date, one writer enables it: the middleware re-sends with `active` true, or the day-one workflow's enable task does it (for synced users, through the agent).[^he-lcw-tasks]
- **Mover.** `empassignment` or `empupdate` arrives; the middleware re-sends the complete record; dynamic groups re-evaluate; an attribute-change workflow can start the residual-access review.
- **Leaver.** The termination arrives at entry. The middleware sends `TermDate` with `active` still true, so pre-separation workflows can run, then sends `active` false at the effective time, no later than the leaver workflow's first run. The workflow runs [Chapter 09's sequence](../books/b03-hr-identity/09-credentials-and-certificates.md#the-canonical-leaver-sequence): disable, revoke refresh tokens, the custom task extension for the card system and Intune, removals; deletion later through the delete task, never `/bulkUpload`.[^he-ms-faq]
- **Late separation.** A termination whose effective date passed more than three days ago misses the scheduled trigger; run the leaver workflow on demand.[^he-lcw-exec]
- **Emergency termination.** The on-demand workflow with the same sequence, and an immediate `active` false from the middleware. For AD-landed users the disable reaches Entra ID only after the next sync, so the session-revocation step is what closes the gap *(inference)*.
- **Rehire.** `newhire` for an existing `PersonNumber`; the same `externalId` re-links the existing account if it still exists.[^he-ora-ems][^he-ms-faq]
- **Conversion.** Oracle's change-worker-type process keeps the person number ([Chapter 04](../books/b03-hr-identity/04-attribute-authority.md#the-worker-type-boundary)); the worker type and its code change and access re-derives.
- **Cancellation.** Check for another active work relationship before treating `cancelworkrelship` as a leaver;[^he-ora-ems] a rescinded pre-hire is disabled and disposed under [Appendix A](../books/b03-hr-identity/appendix-a-lifecycle-rules.md#rescinded-offers-and-cancellations).

## Part 4: Build and secure

### Build phases mapped to Book 03

| Book 03 phase | Work on this stack | Exit evidence |
|---|---|---|
| 0 — Program alignment | Name the identity feed in the integration inventory; submit it to the Core HCM Steering Committee; settle the direct-or-gateway question; request a sandbox and the integration-user model | Inventory signed; Steering Committee request logged |
| 1 — Attribute authority and schema | Fix the mapping above against a sandbox extract; decide published-date polling; code lists; confirm slots 1–3 and 10–12 free; populate `employeeId` on existing accounts; decide pending and contingent-worker scope | Signed schema; correlation threshold met |
| 2 — Pipeline build and test | Middleware in the boundary; an AD app and an Entra app per source; uploader and log reader as separate identities; Oracle integration user with JWT assertion; notification mailbox; deletion threshold; workflows and custom task extensions; the example's validation rules | Joiner, mover and leaver end to end in a test tenant with provenance; Microsoft's five-to-ten-record trial |
| 3 — Hybrid go-live (pilot) | Provisioning agents under a gMSA; the full extract first, feeds immediately after;[^he-ms-oracle] shadow mode, aligned with the platform's shadow-mode UAT | Every difference explained; zero unmatched creations |
| 4 — Automation | Leavers first; the on-demand path for late separations; pre-hire workflows only after published-date polling is proven | Zero missed leavers across a pay period |
| 5 — Cutover | Switch the source contract to Core HCM at the agency's month-8 cutover; retarget populations from the AD app to the Entra app | Seven-day sole-source proof (Appendix C) |
| 6 — Sustain | Daily changes-only reconciliation; alerts on feed lag and job quarantine | Metrics on the continuous-monitoring cadence |

**Gate G1.** Book 00's Foundation gate requires that "HR-to-cloud provisioning is operational for the foundation scope, and the attribute slots in use are confirmed free and single-writer" ([Book 00, Chapter 09](../books/b00-orientation/09-design-pilot-and-rollout.md#gate-g1-foundation-complete)). On this stack the evidence is: the foundation population flowing through `/bulkUpload` from the current HR source, since Core HCM may not be live yet; provisioning-log reconciliation clean; slots 1–3 and 10–12 written only by the provisioning service; and the notification email and deletion threshold set on both apps. Produce the same evidence again when the source switches to Core HCM *(design guidance)*.

### Security and privacy

| Concern | On this stack |
|---|---|
| Uploader | `.OwnedBy` upload permission; owner of its app; nothing else[^he-ms-bulk] |
| Log reader | A separate identity with the provisioning-log permission (finding 7) |
| Entra credential | Managed identity or certificate, as Microsoft recommends for production.[^he-ms-grant] A Microsoft 365 GCC tenant uses the worldwide Entra service;[^he-ms-deploy] a managed identity in an Azure Government subscription belongs to a different tenant, so middleware hosted there needs a certificate credential *(inference)* |
| Oracle credential | JWT user assertion signed by a vault-held key for a dedicated integration user; no client secret[^he-ora-oauth] |
| Operational logs | Person key and payload hash only (Appendix B). In Logic Apps, *Secure Inputs* and *Secure Outputs* hide run-history data, but several built-in actions, including Parse JSON, Compose and For each, don't support Secure Outputs.[^he-ms-la-sec] Prefer Azure Functions for record handling, or restrict run-history access *(design guidance)* |
| Sensitive values | Custom security attributes for values no rule reads; redacted in provisioning logs[^he-ms-csa] |
| Write paths | One writer per attribute and per account state: the pipeline's `active` and the workflow's disable task coordinated (finding 9) |
| Guards | Deletion threshold on both apps;[^he-ms-accdel] the middleware's large-delta hold; the Delete target action off[^he-ms-faq] |
| Interconnection terms | The memo's month-1 interagency agreement[^he-memo] and the solicitation's integration security requirements (FISMA, the Privacy Act, FedRAMP, SP 800-53)[^he-pws-appb] are where the feed's data-exchange terms belong *(inference)* |

### Testing and cutover

- **Acceptance.** Each [Appendix C](../books/b03-hr-identity/appendix-c-acceptance-and-cutover.md#acceptance) scenario becomes a fixture row and a tenant test: a hire two weeks out (account exists, disabled), a reassignment, a separation, leave without pay (kept), a cancelled separation, a conversion, a record that fails validation.
- **Microsoft's sequence.** Start the job, send five to ten records, check matching in the logs, then send the full extract and turn on the feeds.[^he-ms-oracle]
- **Dry run.** The example clients' default mode computes every operation and refuses bad records without writing anything.
- **Sole-source proof.** Seven days of provisioning logs compared with the directory audit log (Appendix C).
- **Rollback.** Pause the job, which keeps its state, from an operator role. Don't use *Restart*: it purges the staged payloads.[^he-ms-config]

## The example code

[examples/hcm-entra](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/hcm-entra) has two equivalent clients, `python/hcm_to_scim.py` (standard library only) and `powershell/HcmToScim.psm1` with `Invoke-HcmToScim.ps1`. Both read `config/mapping.json`, which holds the mapping above, the code lists and the validation rules.

| What it does | Book 03 rule |
|---|---|
| Builds the complete SCIM record: core, enterprise and one extension namespace; dates as UTC ISO 8601 | Chapter 05, normalize; Chapter 06 |
| Refuses missing columns, keys longer than 16 characters, unknown or pending worker types, unknown statuses, codes off the list, values over Graph's limits, self-managers, and inactive records without a leave date | Fail closed; Appendix A quarantine contract |
| Keeps leave-without-pay active; sends future hires disabled; lets a separation win over a same-run mover; flags a separating manager and a separation older than the catch-up window | Appendix A; Appendix C |
| Orders leavers first and managers before reports; batches of at most 50 | Block first; the `/bulkUpload` contract |
| Writes a report with person keys and payload hashes only, and a quarantine file with the unchanged record | Appendix B logging |
| Holds the run when disables exceed a threshold | Appendix B pause switch |
| With `--apply` only: posts with a bearer token from the environment, to an allow-listed Graph `/bulkUpload` URL, paced under the documented limit, honoring `Retry-After`, stopping at the first failure | Chapter 05 |

On the fixture extract (19 fictional rows) both clients produce 9 operations, 9 quarantined records and 1 superseded record, with identical payload hashes. The tests ran 45 pytest cases and 40 Pester 5 cases, all passing. They prove the code does what its README says against the fixtures, not that a tenant or an Oracle extract behaves the same way. The clients don't read Atom feeds, hold future-dated events, write provenance or read the provisioning logs back; those are the rest of the middleware.

## Risks

| Risk | Rating | Mitigation *(design guidance)* |
|---|---|---|
| Future-dated events polled by effective date miss pre-hire and pre-separation workflows | High | Published-date polling with middleware-held dates; a lookahead extract; a test hire ten days out |
| A feed outage longer than 60 or 90 days loses changes | High | Alert on poll lag; daily changes-only reconciliation; a full extract after any gap |
| The identity feed isn't approved as an agency integration, or must move behind OPM's gateway late | High | Phase 0 Steering Committee request; settle the gateway question before building source authentication |
| Obfuscated data hides correlation defects until month 8 | Medium | Correlate against the legacy HR source in Phases 1 to 3; re-baseline at cutover |
| The provisioning-log permission is broader than planned | Medium | A separate reader identity; test the narrow permission first |
| Job quarantine stalls provisioning quietly | Medium | A monitored notification mailbox; job-status polling; a runbook separate from the middleware's quarantine |
| The pipeline and Lifecycle Workflows both write account state | Medium | `active` false no later than the leaver workflow's first run; the workflow as backstop |
| A URN typo or a name-versus-code mix-up breaks a mapping | Medium | One namespace constant; mapping tests like the example's |
| Personal data in Logic Apps run history | Medium | Functions for record handling; restricted run-history access |
| Writeback stores an Oracle administrator password | Medium | Defer writeback; if needed, a least-privileged account and vault-managed rotation |
| The V2 time-based trigger has no catch-up | Low | The standard trigger for leavers, or the on-demand runbook |

## Vendor asks

1. **HR 2.0 program:** is the agency identity feed an approved agency-specific integration, and does it go through OPM's API gateway? With what authentication, IP allow-listing and rate limits?
2. **OPM and Oracle:** which integration surfaces will agencies get on the shared platform (Atom feeds, HCM Extracts, REST), and with what integration-user model and privileges?
3. **OPM and Oracle:** do person numbers survive the month-5 obfuscated migration?
4. **OPM and Oracle:** under which FedRAMP package, and at what impact level, does the Core HCM instance run?
5. **Oracle:** the shared platform's Atom archive and purge settings; whether a `published-min` query returns current and future entries together; the exact privileges a read-only integration role needs.
6. **Oracle:** will the agency's Core HCM configuration record contingent workers (Book 03's open item)?
7. **Microsoft:** reconcile `ProvisioningLog.Read.All` with the Graph page's `AuditLog.Read.All` and `Directory.Read.All`; and the two throttling figures.
8. **Microsoft:** does `SynchronizationData-User.Upload.OwnedBy` scope correctly for an in-house client made owner of a gallery-created app?
9. **Microsoft:** correct the Oracle guide's `COMPANYAME` URN and its delete statement; confirm whether custom security attributes of type Integer and Boolean are supported (the page lists them as supported, and its troubleshooting table says they aren't set).[^he-ms-csa]

## What couldn't be verified

- **Oracle's US Government Cloud specifics for Fusion Applications.** Oracle's government pages on oracle.com refused automated access (HTTP 403); they weren't retried another way.
- **The read privileges for an Oracle integration role.** Oracle's public pages opened don't name them.
- **Which FedRAMP package covers OPM's Core HCM instance,** and whether agency integrations pass through OPM's API gateway.
- **Whether person numbers survive obfuscation** at month 5.
- **How Oracle sets `published` for a future-dated entry.** Oracle's example shows it equal to `updated`; no sentence states the rule. Also the Atom page-size limits.
- **A national-cloud table for `/bulkUpload`.** The API reference has none; availability rests on Microsoft's feature table and announcement.
- **Tenant behavior of everything above.** The example code is tested against fixtures only.

## Status and review

**In review.** Every claim was checked on October 25, 2026, against these sources:
- Microsoft Learn: API-driven inbound provisioning, the Graph API references, provisioning quarantine and deletion prevention, custom security attributes, Lifecycle Workflows and Logic Apps security
- Oracle's Fusion Cloud HCM documentation: Atom feeds, REST resources, OAuth, HCM Extracts and the entitlement-integration guide
- the December 2025 Federal HR 2.0 memo, OPM's Core HCM page and the final amendment of the Core HCM solicitation on SAM.gov
- FedRAMP Marketplace data

To move this guide to **Proved**:
- Build the pipeline in a test tenant against an Oracle sandbox.
- Run the example clients against a real extract and the provisioning logs.
- Record the evidence on this page.

This page names two vendors to illustrate Book 03's vendor-neutral design; it isn't an endorsement by any agency. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Book 03 — HR-Driven Identity](../books/b03-hr-identity/index.md), [Book 02 — Identity & Directory](../books/b02-identity/index.md), [Book 00, Chapter 09](../books/b00-orientation/09-design-pilot-and-rollout.md), and the implementation guide [Integrating ServiceNow and SailPoint](snow-sailpoint-integration-kit.md), whose drift reconciliation reads the same HR extract.

[^he-pws-req5]: Office of Personnel Management, Solicitation 24322626R0007, *Federal HRIT Modernization*, Amendment 4 (posted December 11, 2025), Performance Work Statement Appendix A, Functional Requirements Matrix, Req. 5 (p. 59: SCIM 2.0; create, update and deactivate from the Government's identity provider; near real time or within an SLA, for example 15 minutes; logging and audit), SAM.gov, <https://sam.gov/workspace/contract/opp/8cfe1844758c4fb2b10f5ef192b62f89/view>; attachment list <https://sam.gov/api/prod/opps/v3/opportunities/ed2202dc51c34f6c9941aa5f9e99d4a2/resources>, accessed October 25, 2026.
[^he-pws-core]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, PWS §5.1.1, Core HCM Platform Readiness (p. 26: environments FedRAMP Moderate or higher; "Integrate and implement OPM approved identity management solution using OPM MS Entra-based solution"; a single OPM ATO), SAM.gov, <https://sam.gov/workspace/contract/opp/8cfe1844758c4fb2b10f5ef192b62f89/view>, accessed October 25, 2026.
[^he-pws-sec]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, PWS §6.6.1 and §6.6.2 (p. 48: event logs to OPM's SIEM in real time; integration with OPM's identity provider and SSO, accepting a SAML assertion), SAM.gov, <https://sam.gov/workspace/contract/opp/8cfe1844758c4fb2b10f5ef192b62f89/view>, accessed October 25, 2026.
[^he-pws-appb]: Office of Personnel Management, Solicitation 24322626R0007, Amendment 4, PWS Appendix B, *Required Data Migration and System Integrations* (pp. 82–83: integration security and privacy requirements; OPM-hosted API Management gateway with OAuth 2.0, rate limiting and IP filtering, exceptions approved by the CO and COR; p. 88: the Core HCM Steering Committee reviews and approves agency-specific integrations; p. 95: *Sample Interconnection for Large Department/Agency*, "Identity Management Solution: Provision identity attributes using Core HCM is the authoritative source for user identity data"), SAM.gov, <https://sam.gov/workspace/contract/opp/8cfe1844758c4fb2b10f5ef192b62f89/view>, accessed October 25, 2026.
[^he-memo]: Office of Management and Budget and Office of Personnel Management, *Creating "Federal HR 2.0" by Consolidating Core Human Capital Management Across the Federal Government*, December 10, 2025, Appendix B, sample timeline (month 1 interagency agreement; month 5 "Interconnection(s) go-live and production setup complete" and "Data Migration for obfuscation"; months 6–8 "UAT Testing (Shadow Mode)"; month 8 data migration and cutover), <https://www.opm.gov/chcoc/latest-memos/creating-federal-hr-20-by-consolidating-core-human-capital-management-across-the-federal-government.pdf>, accessed October 25, 2026.
[^he-ms-concepts]: Microsoft Learn, "API-driven inbound provisioning concepts" (end-to-end flow; complete record in every request; clearing values preview; 40 calls in any 5-second window; 2,000 or 6,000 calls per 24 hours; up to 50 operations per call; provisioning logs API; Lifecycle Workflows from `employeeHireDate` and `employeeLeaveDateTime`), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-concepts>, accessed October 25, 2026.
[^he-ms-bulk]: Microsoft Learn, "Perform bulkUpload," Microsoft Graph v1.0 (40 requests per second; 50 operations; application least privilege `SynchronizationData-User.Upload.OwnedBy`, higher `SynchronizationData-User.Upload`; no user-assignable directory role, User Administrator can invoke; `application/scim+json`; `202 Accepted` with `Location`; `manager.value` is the manager's `externalId`), <https://learn.microsoft.com/en-us/graph/api/synchronization-synchronizationjob-post-bulkupload?view=graph-rest-1.0>, accessed October 25, 2026.
[^he-ms-faq]: Microsoft Learn, "Frequently asked questions about API-driven inbound provisioning" (endpoint format; matching on `externalId` and `employeeId`; UPN conflicts not handled; one app per source; no deletion through `/bulkUpload`; disable the Delete target action; AD deletes are hard deletes; POST only; writeback options), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-faqs>, accessed October 25, 2026.
[^he-ms-config]: Microsoft Learn, "Configure API-driven inbound provisioning app" (the two gallery apps; roles; agent and default OU for AD; mandatory notification email or quarantine; Start, Stop, Restart and Edit provisioning; Provision on demand not supported), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-configure-app>, accessed October 25, 2026.
[^he-ms-grant]: Microsoft Learn, "Grant access to the inbound provisioning API" (service principal or managed identity; `ProvisioningLog.Read.All` and `SynchronizationData-User.Upload`; `Application.ReadWrite.OwnedBy` and `SynchronizationData-User.Upload.OwnedBy` for HR software vendors; certificate authentication or managed identities for production), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-grant-access>, accessed October 25, 2026.
[^he-ms-custom]: Microsoft Learn, "Extend API-driven provisioning to sync custom attributes" (SCIM extension URNs in the app's attribute list; `UpdateSchema` for 20 or more attributes), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-custom-attributes>, accessed October 25, 2026.
[^he-ms-ps]: Microsoft Learn, "API-driven inbound provisioning with PowerShell script" (CSV2SCIM; chunks of 50; certificate authentication; `Application.Read.All` and `Synchronization.Read.All` to look up the job; previous-cycle logs; `-RestartService` only for testing), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-powershell>, accessed October 25, 2026.
[^he-ms-la]: Microsoft Learn, "API-driven inbound provisioning with Azure Logic Apps" (CSV from an Azure file share with an access key; the CSVtoJSONcore function deployed from GitHub with CORS set to `*`; managed identity; log scanning and retry not implemented in the sample), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-logic-apps>, accessed October 25, 2026.
[^he-ms-oracle]: Microsoft Learn, "Configure Oracle Human Capital Management (HCM) for automatic user provisioning" (initial sync by CSV; deltas by Atom feeds, CSV extracts or Oracle Integration Cloud; the six feed collections; feeds on immediately after the initial sync; custom module duties; `EffectiveStartDate` and `EffectiveDate`; five to ten records first; worksheets 1–6; writeback through the Oracle Fusion ERP connector with an admin username and password), <https://learn.microsoft.com/en-us/entra/identity/saas-apps/oracle-hcm-provisioning-tutorial>, accessed October 25, 2026.
[^he-ms-quar]: Microsoft Learn, "Application provisioning in quarantine status" (causes; cycles reduced to daily; disabled after four weeks; escrow evaluation from 5,000 failures, 40% or 40,000, absolute 60,000; retries at 6, 12 and 24 hours), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/application-provisioning-quarantine-status>, accessed October 25, 2026.
[^he-ms-accdel]: Microsoft Learn, "Enable accidental deletions prevention in the Microsoft Entra provisioning service" (threshold counts disables and deletions, evaluated per cycle; quarantine; Allow deletes; `StagedAction` and `StagedDelete`), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/accidental-deletions>, accessed October 25, 2026.
[^he-ms-provlist]: Microsoft Learn, "List provisioningObjectSummary," Microsoft Graph v1.0 (`GET /auditLogs/provisioning`; application least privilege `AuditLog.Read.All` and `Directory.Read.All`; `$filter`, `$orderby`, `$top`, `$skiptoken`, case-sensitive; global, US Government L4 and L5), <https://learn.microsoft.com/en-us/graph/api/provisioningobjectsummary-list?view=graph-rest-1.0>, accessed October 25, 2026.
[^he-ms-provres]: Microsoft Learn, "provisioningObjectSummary resource type," Microsoft Graph v1.0 (properties and filters; `provisioningAction` values), <https://learn.microsoft.com/en-us/graph/api/resources/provisioningobjectsummary?view=graph-rest-1.0>, accessed October 25, 2026.
[^he-ms-perms]: Microsoft Learn, "Microsoft Graph permissions reference" (`ProvisioningLog.Read.All`: "Read all provisioning log data"), <https://learn.microsoft.com/en-us/graph/permissions-reference>, accessed October 25, 2026.
[^he-ms-csa]: Microsoft Learn, "Provision custom security attributes from HR sources" (API-driven provisioning to Entra ID; String, Integer and Boolean in prerequisites, Boolean and Integer not set per troubleshooting; single-valued; values redacted in provisioning logs; viewing needs Attribute Assignment roles), <https://learn.microsoft.com/en-us/entra/identity/app-provisioning/provision-custom-security-attributes>, accessed October 25, 2026.
[^he-ms-csa-faq]: Microsoft Learn, "Assign, update, list, or remove custom security attributes for a user," FAQ ("custom security attributes assigned to users aren't supported for configuring rules for dynamic membership groups"), <https://learn.microsoft.com/en-us/entra/identity/users/users-custom-security-attributes>, accessed October 25, 2026.
[^he-ms-feat]: Microsoft Learn, "Microsoft Entra feature availability" (HR provisioning apps: API-driven inbound provisioning; provisioning agent registration for US Government tenants; Entra ID Governance in GCC, GCC High and DoD), <https://learn.microsoft.com/en-us/entra/identity/authentication/feature-availability>, accessed October 25, 2026.
[^he-ms-whatsnew]: Microsoft Learn, "Archive for Microsoft Entra releases and announcements," June 2025 ("API-driven provisioning is now generally available in US Gov cloud"; custom security attributes from HR sources generally available), <https://learn.microsoft.com/en-us/entra/fundamentals/whats-new-archive>, accessed October 25, 2026.
[^he-ms-lic]: Microsoft Learn, "Microsoft Entra licensing" (API-driven provisioning with Entra ID P1, P2, Governance and Suite), <https://learn.microsoft.com/en-us/entra/fundamentals/licensing>, accessed October 25, 2026.
[^he-ms-deploy]: Microsoft Learn, "Microsoft Graph national cloud deployments" (Microsoft 365 GCC uses the worldwide endpoints; GCC High `graph.microsoft.us`; DoD `dod-graph.microsoft.us`; US Government token endpoint `login.microsoftonline.us`), <https://learn.microsoft.com/en-us/graph/deployments>, accessed October 25, 2026.
[^he-ms-user]: Microsoft Learn, "user resource type," Microsoft Graph v1.0 (`employeeId` at most 16 characters; `department` and `companyName` 64; `jobTitle` 128; `displayName` 256; extension attributes up to 1,024 characters, read-only in the cloud for synced users), <https://learn.microsoft.com/en-us/graph/api/resources/user?view=graph-rest-1.0>, accessed October 25, 2026.
[^he-lcw-sync]: Microsoft Learn, "How to synchronize attributes for Lifecycle workflows" (DateTimeOffset attributes supported by HR inbound provisioning, Cloud Sync and Connect Sync; AD string format `yyyyMMddHHmmss.fZ`; Graph format; time of day; tenant schedule; Temporary Access Pass lifetime; time zones), <https://learn.microsoft.com/en-us/entra/id-governance/how-to-lifecycle-workflow-sync-attributes>, accessed October 25, 2026.
[^he-lcw-exec]: Microsoft Learn, "Lifecycle workflow execution conditions and scheduling" (trigger types; 0–180 days; V2 preview 0–365 days without the catch-up window; three-day catch-up; schedule every three hours by default; re-evaluation before processing), <https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-execution-conditions>, accessed October 25, 2026.
[^he-lcw-tasks]: Microsoft Learn, "Lifecycle Workflows tasks and definitions" (Enable, Disable and Delete user with `enableOnPremisesAccount`, `disableOnPremisesAccount` and `deleteOnPremisesAccount`; users with Entra role assignments not supported; Temporary Access Pass task requirements), <https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-tasks>, accessed October 25, 2026.
[^he-lcw-onprem]: Microsoft Learn, "Managing Users synchronized from Active Directory Domain Services to Microsoft Entra ID with Lifecycle Workflows" (user account tasks need the provisioning agent, at least 1.1.1586.0, with the HR-driven provisioning extension; gMSA permissions; AD Recycle Bin for deletes), <https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-on-premises>, accessed October 25, 2026.
[^he-ms-la-sec]: Microsoft Learn, "Secure access and data for workflows in Azure Logic Apps" (Secure Inputs and Secure Outputs; built-in operations that don't support them, including Parse JSON, Compose and For each; IP restriction on run-history content), <https://learn.microsoft.com/en-us/azure/logic-apps/set-up-security-permissions>, accessed October 25, 2026.
[^he-ora-ems]: Oracle, *Oracle Fusion Cloud HCM Integration with External Entitlement Management Systems* (PersonNumber over PersonID; `empassignment` configured with `PeriodOfServiceId`; joiner, mover and leaver feed samples; pending workers; rehire by existing PersonNumber; work relationship cancellation; "Do not use REST API to sync data from HCM"; JWT for feeds and SCIM; SCIM privilege `ASE_REST_SERVICE_ACCESS_IDENTITY_INTEGRATION_PRIV`; SCIM only for username or email), <https://docs.oracle.com/en/applications/fusion-apps/fusion-human-capital-management/hcmintegration/index.html>, accessed October 25, 2026.
[^he-ora-feeds]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Employee Feeds" (URL format; collections and triggers; "Feeds are triggered only for employee, contingent worker, and pending worker types"), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/Employee_Atom_Feeds.html>; and "Working with Atom," <https://docs.oracle.com/en/cloud/saas/human-resources/farws/Working_with_Atom.html>, accessed October 25, 2026.
[^he-ora-poll]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Poll a Feed" (process future-dated events when effective, using `updated`, or immediately, using `published`; chronological processing; stop on failure), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/Polling_a_Feed.html>, accessed October 25, 2026.
[^he-ora-read]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Read a Feed" (`updated-min`, `updated-max`, `published-min`, `published-max`; lower bound exclusive, upper inclusive; ISO 8601; `archive=yes`), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/Reading_a_Feed.html>, accessed October 25, 2026.
[^he-ora-dated]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Manage Date Effective Entries" ("future-dated events have the `updated` date attribute set to the effective start date"; "By default, no entries with updated date past the current date are returned"; when entries appear), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/Handling_Date_Effective_Entry.html>, accessed October 25, 2026.
[^he-ora-purge]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Manage Archive and Purge Settings" ("60 days for archive and 90 days for purge"), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/Manage_Archive_and_Purge_Settings.html>, accessed October 25, 2026.
[^he-ora-workers]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Workers REST Endpoints" (records as of a date; employee, contingent and pending workers; HCM Data Loader and HCM Extracts for bulk; Atom feeds, not REST, for detecting changes), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/api-workers.html>, accessed October 25, 2026.
[^he-ora-public]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Public Workers REST Endpoints" (active workers as of today, public information, including nonworkers; addressed by `PersonId`), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/api-public-workers.html>, accessed October 25, 2026.
[^he-ora-oauth]: Oracle, *REST API for Oracle Fusion Cloud HCM*, "Configure OAuth" (tokens from the OCI IAM identity domain; authorization code, PKCE and JWT user assertion for Fusion Applications paths; client credentials only for Spectra services; client assertion recommended over client secret), <https://docs.oracle.com/en/cloud/saas/human-resources/farws/configure_oauth.html>, accessed October 25, 2026.
[^he-ora-extracts]: Oracle, *Oracle Fusion Cloud HCM: HCM Extracts*, "Introduction to HCM Extracts" (the main bulk retrieval tool; BI Publisher formats including CSV; Extract Actions and BI ScheduleService output as a byte stream), <https://docs.oracle.com/en/cloud/saas/human-resources/fahex/introduction-to-hcm-extracts.html>, accessed October 25, 2026.
[^he-ora-changes]: Oracle, *Oracle Fusion Cloud HCM: HCM Extracts*, "How can I create a changes only extract?" (comparison with baseline data from previous runs; threading database details), <https://docs.oracle.com/en/cloud/saas/human-resources/fahex/how-can-i-create-a-changes-only-extract.html>, accessed October 25, 2026.
[^he-fr]: General Services Administration, FedRAMP Marketplace data, `products.json` (package F1603257882, Oracle, "Fusion Cloud": FedRAMP Certified, Class C, Moderate, agency path, certified January 13, 2020, 10 authorizations, SaaS, Government Community Cloud), <https://www.fedramp.gov/marketplace/products.json>, data as of October 25, 2026, accessed October 25, 2026.
