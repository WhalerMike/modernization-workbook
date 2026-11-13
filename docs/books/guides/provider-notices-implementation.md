---
title: "Provider Notices: An Implementation Guide"
description: "A gated guide for collecting the tenant-specific notices cloud providers send (scheduled maintenance, retirements, health and security advisories, upcoming changes and incidents), giving each an owner and tracking it to closure: Azure Service Health through Azure Resource Graph, with Service Health alerts at scale through Azure Policy; Microsoft 365 Message center and service health through the Microsoft Graph service communications API; Oracle Cloud Infrastructure Announcements; AWS Health; and Google Cloud Personalized Service Health. One normalized notice record, a router that turns notices needing action into Ticket-to-Machine typed tasks, a weekly digest, and hashed evidence. Each gate states the federal requirements it supports with their KSIs, the evidence an ISSO keeps, government-cloud availability, an interim path, and the read-only check in the provider notices kit that proves it."
doc-type: workbook-guide
audience: [Technical, Customer]
family: guides
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
research-status: draft
research-type: implementation guide
research-book: "Book 15"
review-status: approved
reviewed-sha256: 96e401046d389b78747d96946010cfb4dd96aac7f00c5d7d053e5394d90a140d
last-reviewed: 2026-11-09
---
# Provider Notices: An Implementation Guide

*Every provider tells you, in writing and ahead of time, what it will change, retire or patch in your tenant; the gap is that nobody reads it, owns it or closes it.*

::: {.callout-note}
## In this guide
How an agency collects the notices its cloud providers send about its own tenant, account, tenancy or project, gives each one that needs action an owner, and tracks it to closure, as gated steps an operator can run. First, how to read the guide and its checks, the track at a glance, prerequisites, a comparison of the five providers and the path on one page. Then seven gates: Azure Service Health, Microsoft 365, Oracle Cloud Infrastructure, AWS Health and Google Cloud, one per provider; routing notices to owners as Ticket-to-Machine tasks; and the digest and evidence. Each gate carries its federal requirements with their KSIs, the evidence the ISSO keeps, government-cloud availability, an interim path, a **Validate** step that names the kit's read-only check, a *Try it* box and rollback. Then the dangers, the evidence, rollback, a checklist and what couldn't be verified.
:::

## Watch or download

A two-part narrated deck series follows this guide at the level of its gates: for each gate, the steps, the commands from the developer workbook chapter's first lab with the kit's real output, the federal requirement and evidence, government-cloud availability, the interim path and rollback. Each part has a deck for presenting live, a narrated self-running deck with captions, a video and its narration script.

| Part | Gates | Deck and video | Narration script |
|---|---|---|---|
| Part 1: collecting what four providers publish (about @@Provider_Notices_Implementation_Part_1@@ minutes) | G1–G4 | [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/provider-notices-implementation-part-1) (the deck files come with the next edition) · [▶ Watch](../../presentations/watch.html?v=Provider_Notices_Implementation_Part_1_Narrated) (about @@Provider_Notices_Implementation_Part_1@@ min, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Provider_Notices_Implementation_Part_1_Narrated.mp4) | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/provider-notices-implementation-part-1/Provider_Notices_Implementation_Part_1_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/provider-notices-implementation-part-1/Provider_Notices_Implementation_Part_1_Narrated.vtt) |
| Part 2: Google Cloud, routing, the digest and the evidence (about @@Provider_Notices_Implementation_Part_2@@ minutes) | G5–G7 | [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/provider-notices-implementation-part-2) (the deck files come with the next edition) · [▶ Watch](../../presentations/watch.html?v=Provider_Notices_Implementation_Part_2_Narrated) (about @@Provider_Notices_Implementation_Part_2@@ min, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Provider_Notices_Implementation_Part_2_Narrated.mp4) | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/provider-notices-implementation-part-2/Provider_Notices_Implementation_Part_2_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/provider-notices-implementation-part-2/Provider_Notices_Implementation_Part_2_Narrated.vtt) |

: The implementation deck series {.striped .hover}

The [Presentations](../../presentations/index.md#implementation-provider-notices-part-1) page lists them with the other decks. The developer workbook's story deck, *One Retirement Notice, End to End*, and its chapter tours are on the [workbook's page](../../project-plans/developer-workbooks/provider-notices/index.md).

## How to read this guide

The books mention provider notices but don't run them. [Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md) routes Microsoft's service health email to the help desk supervisor, to correlate with open tickets, and warns that nothing is approved or changed on the strength of an email. [Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md) sends the Azure activity log's `ServiceHealth` category to the workspace. Neither collects the notices, assigns an owner, or tracks one to closure. This guide does, with the code in the provider notices kit, [`examples/provider-notices`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/provider-notices). The routing is the Ticket-to-Machine pattern of [Book 13, Chapter 10](../b13-governance/10-ticket-to-machine.md) and [Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md). Each step says what to do and in what order, and adds the gate, the federal requirement and the ISSO's evidence, and what's available in a government cloud.

**Where the facts come from.** Every API, permission, endpoint, field name and government-cloud statement was checked against the provider's own documentation on November 9, 2026: Microsoft Learn for Azure and Microsoft 365, Oracle's documentation for OCI, AWS's for AWS Health, and Google Cloud's for Personalized Service Health. The kit's Azure queries start from Learn's own samples. Control statements were read from NIST's OSCAL catalog and the KSIs' related controls from fedramp.gov's 2026 pages on the same day. The [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/provider-notices-implementation.md) lists every claim. Where a fact couldn't be verified, the guide says *not yet specified* and [lists it](#what-couldnt-be-verified). *(Design guidance)* marks the program's recommendations. The audience is a civilian agency at FedRAMP Moderate in Microsoft 365 GCC with commercial Azure, with workloads in Oracle Cloud Infrastructure and possibly AWS or Google Cloud; an agency whose HR platform runs on OCI reads that tenancy's announcements in Gate 3. The examples use the fictional `contoso.example`.

**The placeholders.** The commands are exact; replace these values once, everywhere:

| Placeholder | What it is |
|---|---|
| `<settings-file>` | Your copy of the kit's `deploy/settings.template.json` for this environment, every placeholder in an enabled provider filled |
| `<routing-file>` | Your routing file, written from the kit's `templates/routing.template.json` at work |
| `<subscription-id>`, `<reader-object-id>` | An Azure subscription in scope, and the object ID of the identity that reads |
| `<tenancy-ocid>`, `<group>` | The OCI tenancy's OCID, and the OCI group the reader belongs to |
| `<project-id>`, `<group-email>` | A Google Cloud project, and the Google group the reader belongs to |
| `<plan-sha256>` | The SHA-256 a plan's script prints, as the change record approved it |

: Placeholders used in this guide {.striped .hover}

**The checks.** Each **Validate** step names a read-only check from the kit. The kit has no `VK-` IDs; its checks are its entry scripts. Every collector call is a read declared in the kit's `config/calls.json` with its least-privileged role. The only writes are in `deploy/`, and they run only with `-Apply` and the plan's approved SHA-256. The checks are fixture-tested, not proven against a live tenant.

| Check | What it reports | Gate |
|---|---|---|
| `Invoke-PnCollect.ps1 -Provider azure` | Service issues, planned maintenance, health advisories, retirements and security advisories for the subscriptions in scope, with impacted resources | G1 |
| `deploy/New-PnAlertPolicy.ps1` (dry run) | The plan for Service Health alerts at scale with Azure Policy | G1 |
| `Invoke-PnCollect.ps1 -Provider m365` | Message center posts and service health issues | G2 |
| `Invoke-PnCollect.ps1 -Provider oci` | OCI announcements, the latest in each chain, with affected resources | G3 |
| `Invoke-PnCollect.ps1 -Provider aws` | AWS Health events with descriptions and affected entities | G4 |
| `Invoke-PnCollect.ps1 -Provider google` | Personalized Service Health incidents | G5 |
| `Invoke-PnRoute.ps1` (dry run) | New, changed, unchanged and no-longer-listed notices; the task payloads to create, update or close | G6 |
| `Invoke-PnDigest.ps1`, `Invoke-PnEvidence.ps1 -Check` | The weekly digest; the evidence chain and the stage's coverage | G7 |

: The provider notices kit's read-only checks {.striped .hover}

<!-- labs:begin labs (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Labs for this guide
Every gate's hands-on work is a lab in the developer workbook [*Building Provider Notices*](../../project-plans/developer-workbooks/provider-notices/index.md): Lab 1 on a laptop with the kit's fixtures, Lab 2 in a non-production environment. [The Labs page](../../training/labs.md#pn) lists them chapter by chapter, with what each needs and a direct link; each gate below links its own labs.
:::

<!-- labs:end -->

## The track at a glance

**The goal.** Every notice a provider publishes about the agency's own cloud estate is collected on a schedule, held as one record, and either given to an owner as a task with a due date or put in a weekly digest the owners read. A task closes only after the next collection shows the notice closed or the resource no longer affected (the re-read, clause C4 of the request chain), never because someone said it was done *(design guidance)*.

**The kinds of notice.** The kit's record has six kinds, mapped from each provider's own types:

| Kind | Azure | Microsoft 365 | OCI | AWS | Google Cloud |
|---|---|---|---|---|---|
| maintenance | `PlannedMaintenance` | none | `*_MAINTENANCE*` | `scheduledChange` | none (no planned maintenance in the API) |
| retirement | `HealthAdvisory` with `EventSubType` `Retirement` | a post tagged Retirement | none | `scheduledChange` whose code names a retirement or lifecycle event (kit rule) | none |
| advisory | `HealthAdvisory` | `stayInformed` posts; advisory issues | `ACTION_RECOMMENDED`, `INFORMATION` | `accountNotification` | none |
| security | `SecurityAdvisory` | none | none | `accountNotification` with the `SECURITY` persona | none |
| change | none | `planForChange`, `preventOrFixIssue` posts | `*_CHANGE*`, `ACTION_REQUIRED` | none | none |
| incident | `ServiceIssue` | incident issues | `PRODUCTION_EVENT_NOTIFICATION` | `issue` | `INCIDENT` |

: How each provider's types map to the record's kinds {.striped .hover}

Each record says whether action is required and by when, and whether the provider said so (Microsoft 365's `actionRequiredByDateTime`, OCI's `ACTION_REQUIRED` and `ACTION_REQUIRED_BY`, AWS's `actionability`) or a kit rule inferred it (an Azure retirement is due at the advisory's end, which Learn says is its end time).[^pn-arg-samples]

**Done when** *(design guidance)*:

- every enabled provider is collected at least weekly, by a reader with only the read role, in the cloud the settings file names;
- every notice that needs action has a task with an owner, a severity and a due date, and closes only on a re-read;
- retirements and maintenance that name the agency's resources prompt a contingency plan review;
- the digest goes to the owners every week, and every run is in the evidence chain.

## Prerequisites {#prerequisites}

- **Decisions first.** Who owns each provider's notices; which notices become tasks, for which assignment group and at which severity; and who receives each provider's own notice email today. The routing is the agency's, written at work from the kit's template with the kit's [Copilot prompts](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/provider-notices/copilot-prompts.md) in Microsoft 365 Copilot Chat. The routing, the settings files, the notices and the digests stay inside the agency's boundary; none of them belongs in a public or personal repository.
- **A change process that takes the tasks.** The router writes ServiceNow-shaped payloads. Sending them needs an endpoint the agency builds on its own instance; until it does, the payloads are files the service desk reads *(design guidance)*.
- **Tools.** PowerShell 7.1 or later, Pester 5 for the labs, and each enabled provider's CLI: Azure CLI with the `resource-graph` extension, the `Microsoft.Graph.Authentication` PowerShell module, the OCI CLI, the AWS CLI and the Google Cloud CLI.
- **A reader per provider, holding only its read role.** Writes (the Azure Policy assignment, rollback) run as a different identity, and only with `-Apply` *(design guidance)*:

| Provider | Read (the collector) | Elevated read, where the provider requires it | Write (deploy only) |
|---|---|---|---|
| Azure | Reader on each subscription[^pn-sub-tenant] | Service Health Security Reader, to see a security advisory's sensitive fields and impacted resources; Reader and Monitoring Reader can't[^pn-sec-elevated] | Permission to create the policy assignment and the role assignment for its managed identity at the scope[^pn-remediate] |
| Microsoft 365 | `ServiceMessage.Read.All`; `ServiceHealth.Read.All`; delegated sign-in also needs an admin role[^pn-graph-overview] | Global Administrator or Message Center Privacy Reader for data privacy messages[^pn-m365-roles] | None |
| OCI | `Allow group <group> to read announcements in tenancy` (`inspect` lists summaries only)[^pn-oci-policy] | None | None |
| AWS | A customer managed policy with `health:DescribeEvents`, `health:DescribeEventDetails`, `health:DescribeAffectedEntities`; AWS publishes no read-only managed policy for Health[^pn-aws-iam] | A qualifying AWS Support plan on the account; AWS's pages name the plans differently[^pn-aws-plan] [^pn-aws-plan-ug] | None |
| Google Cloud | `roles/servicehealth.viewer` (Personalized Service Health Viewer) on the project or organization[^pn-gcp-iam] | The Service Health API enabled on the project, once | None |

: Permissions by provider {.striped .hover}

## The five providers compared

| | Azure | Microsoft 365 | Oracle Cloud Infrastructure | AWS | Google Cloud |
|---|---|---|---|---|---|
| Where notices live | Service Health, queried through Azure Resource Graph's `ServiceHealthResources`[^pn-arg-samples] | Message center and service health, through Graph's service communications API[^pn-graph-overview] | Announcements service[^pn-oci-cli] | AWS Health API[^pn-aws-events] | Personalized Service Health[^pn-gcp-events] |
| Maintenance | Yes, with impacted resources[^pn-arg-impacted] | No separate type | Yes, with affected resources on the details call | Yes (`scheduledChange`), with affected entities | No: the API has one category, `INCIDENT`[^pn-gcp-event] |
| Retirements | Yes: health advisories with `EventSubType` `Retirement` | Posts tagged Retirement (the tag set isn't enumerated on Learn) | No separate type | No separate type; the kit infers it from the event type code | No |
| Security advisories | Yes; sensitive fields need an elevated role | No separate type | No separate type | No separate type; the kit uses the `SECURITY` persona | No |
| Says action is required | No field the kit reads; the kit's rule for retirements and security advisories | `actionRequiredByDateTime` | `ACTION_REQUIRED`, `ACTION_REQUIRED_BY` | `actionability` | No |
| Least-privileged reader | Reader | `ServiceMessage.Read.All`, `ServiceHealth.Read.All` | `read announcements` | Three `health:Describe*` actions | `roles/servicehealth.viewer` |
| Cost or plan | None stated for Resource Graph | None stated | None stated | A qualifying AWS Support plan | None stated |
| Push alternative | Service Health alerts, at scale through Azure Policy[^pn-policy] | Message center email | Announcement subscriptions (not used by the kit) | EventBridge `aws.health` events[^pn-aws-eb] | Not used by the kit |
| Government cloud | Azure Government (`management.usgovcloudapi.net`); Learn's samples link the Azure Government portal[^pn-arg-samples] | GCC on the global endpoint; GCC High `graph.microsoft.us`; DoD `dod-graph.microsoft.us`[^pn-graph-overview][^pn-graph-deployments] | US Government Cloud (OC2) endpoints in us-langley-1 and us-luke-1; OC3 not yet specified[^pn-oci-gov] | GovCloud (US): one endpoint in us-gov-west-1[^pn-aws-gov] | Not in Assured Workloads' FedRAMP Moderate, High, IL4 or IL5 packages[^pn-gcp-aw] |

: Provider notices across Azure, Microsoft 365, OCI, AWS and Google Cloud {.striped .hover}

## The path on one page

| Gate | Done when | Validate with |
|---|---|---|
| [G1 Azure Service Health](#step-1-azure-service-health) | Every subscription in scope is collected by a Reader, security advisories by Service Health Security Reader, and the Service Health alert policy is assigned and remediated | `Invoke-PnCollect.ps1 -Provider azure`; `deploy/New-PnAlertPolicy.ps1` |
| [G2 Microsoft 365](#step-2-microsoft-365-message-center-and-service-health) | Message center posts and service health issues are collected on the tenant's own Graph host | `Invoke-PnCollect.ps1 -Provider m365` |
| [G3 Oracle Cloud Infrastructure](#step-3-oracle-cloud-infrastructure-announcements) | Every tenancy's announcements are collected, the latest in each chain, with affected resources | `Invoke-PnCollect.ps1 -Provider oci` |
| [G4 AWS Health](#step-4-aws-health) | Every account's open and upcoming events are collected, with descriptions and affected entities | `Invoke-PnCollect.ps1 -Provider aws` |
| [G5 Google Cloud](#step-5-google-cloud-personalized-service-health) | The project's or organization's incidents are collected, and the gap for planned maintenance is recorded | `Invoke-PnCollect.ps1 -Provider google` |
| [G6 Routing](#step-6-route-notices-to-owners) | The agency's routing file is reviewed; every notice that needs action has a task; re-runs de-duplicate | `Invoke-PnRoute.ps1` (dry run) |
| [G7 Digest and evidence](#step-7-digest-and-evidence) | The weekly run is scheduled, the digest reaches the owners, and each stage's evidence passes | `Invoke-PnDigest.ps1`; `Invoke-PnEvidence.ps1 -Check -Stage` |

: The seven gates of provider notices {.striped .hover}

G1 to G5 are independent; enable only the providers the agency uses. G6 and G7 need at least one of them. Deploying to test and then production uses the kit's `deploy/` scripts with one settings file per environment, described under [G7](#step-7-digest-and-evidence).

## Step 1: Azure Service Health {#step-1-azure-service-health}

Service Health is where Azure publishes service issues, planned maintenance, health advisories (including upcoming retirements) and security advisories for a subscription. Resource Graph's `ServiceHealthResources` table answers the same questions for every subscription in scope with one query, and Learn publishes the queries.[^pn-arg-samples]

**Prerequisites.** Reader on each subscription in scope for the reader identity; Service Health Security Reader as well if it should see the sensitive fields of security advisories.[^pn-sub-tenant][^pn-sec-elevated] The settings file's `providers.azure` names the cloud and the subscriptions or management group.

**Steps.**

1. **Grant the reader its roles.** A subscription Owner runs, for each subscription in scope:

    ```powershell
    az role assignment create --assignee <reader-object-id> --role "Reader" --scope /subscriptions/<subscription-id>
    az role assignment create --assignee <reader-object-id> --role "Service Health Security Reader" --scope /subscriptions/<subscription-id>
    ```

2. **Sign in, in the right cloud, with the Resource Graph extension.** For Azure Government use `AzureUSGovernment`.

    ```powershell
    az cloud set --name AzureCloud
    az login
    az extension add --name resource-graph
    ```

3. **Collect.** The kit's query starts from Learn's "all active Service Health events" sample, adds the retirement sample's `EventSubType`, and converts the impact times as Learn's health advisory sample does; the impacted-resources query is Learn's, as published.[^pn-arg-samples][^pn-arg-impacted]

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider azure -OutputPath out/azure
    ```

4. **Alert at scale.** Plan the built-in policy *Configure subscriptions to enable Service Health Monitoring Alert Rules* at the management group, with a remediation task so existing subscriptions get the alert rule and action group, not only new ones. With no parameters, the remediation creates `rg-serviceHealthAlert`, the alert rule `ServiceHealthSubscriptionAlertRule` and the action group `ag-ServiceHealthAlertActionGroup` in each subscription and emails the subscription owners for every event type.[^pn-policy] The policy doesn't support a resource group scope. The CLI path needs the managed identity granted the definition's role, which the plan does with `--role` and `--identity-scope`.[^pn-remediate]

    ```powershell
    ./deploy/New-PnAlertPolicy.ps1 -SettingsPath <settings-file> -OutputPath out/alerts
    ./deploy/New-PnAlertPolicy.ps1 -SettingsPath <settings-file> -OutputPath out/alerts -Apply -ApprovedSha256 <plan-sha256>
    ```

    Run the second command only after the change record approves the plan's hash. Don't edit the alert rules the policy creates; change the assignment's parameters and remediate again, or the policy may overwrite the edit.[^pn-policy]

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| SA-9 (external system services), part c: monitor the provider's control compliance on an ongoing basis[^pn-oscal] | KSI-SCR-MIT, KSI-SCR-MON | `raw/azure.json`, `notices.json`, `manifest.json` with every call and its permission |
| SI-5 (security alerts, advisories and directives), part a: receive them from external organizations on an ongoing basis | KSI-SCR-MON | The same; security advisories' sensitive fields only with the elevated role |
| SI-5 and CA-7 (continuous monitoring): the alert path that runs between collections | KSI-SCR-MON, KSI-MLA-EVC | The alert plan, `results.json`, and the change record that approved the hash |

: Gate 1 requirements and evidence {.striped .hover}

The KSI column names the FedRAMP 20x Key Security Indicators whose related SP 800-53 controls include the row's control.[^pn-ksi] KSIs are indicators for cloud service providers: the agency authorizes its own system and lines its evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../b00-orientation/appendix-b-engagement-archetype.md)). Which record supports which indicator is the program's mapping *(design guidance)*; SA-9 to KSI-SCR-MIT and KSI-SCR-MON is also [Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md)'s row.

**Government-cloud availability.** Azure Government uses `az cloud set --name AzureUSGovernment` and Resource Manager `management.usgovcloudapi.net`.[^pn-gov-cli] Every `ServiceHealthResources` sample on Learn links the Azure Government portal as well as the global one; an explicit availability statement for the table in Azure Government is not yet specified.[^pn-arg-samples]

**Interim path.** Before the reader identity exists, a person with Reader runs Learn's query directly and keeps the output with the run:

```powershell
az graph query -q "ServiceHealthResources | where type =~ 'Microsoft.ResourceHealth/events' | extend eventType = properties.EventType, status = properties.Status, description = properties.Title, trackingId = properties.TrackingId, summary = properties.Summary, priority = properties.Priority, impactStartTime = properties.ImpactStartTime, impactMitigationTime = properties.ImpactMitigationTime | where (eventType in ('HealthAdvisory', 'SecurityAdvisory', 'PlannedMaintenance') and impactMitigationTime > now()) or (eventType == 'ServiceIssue' and status == 'Active')"
```

::: {.callout-important}
## Validate (G1 Azure Service Health)
- **`Invoke-PnCollect.ps1 -Provider azure`** reads both queries and writes every notice valid against the schema. Pass: the summary lists every subscription's events, and each security advisory has its summary (an empty summary means the reader lacks Service Health Security Reader).
- **`deploy/New-PnAlertPolicy.ps1`** (dry run) shows the assignment at the management group and its remediation. Pass after `-Apply`: Azure Policy shows the assignment compliant once remediation finishes.
- Gate owner: the cloud platform lead, with the ISSO.
:::

::: {.callout-tip}
## Try it: G1 Azure Service Health
On a laptop, no tenant, from `examples/provider-notices`:

```powershell
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider azure -AsOf 2026-11-09T12:00:00Z -OutputPath out/azure
```

Five notices: one incident, one maintenance window, one retirement, one security advisory and one advisory.
:::

<!-- labs:begin try-g1 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Labs and training: G1 Azure Service Health
- **On a laptop, no tenant:** [Chapter 01, Lab 1](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#lab-1-fixtures-no-tenant) of *The Notice Record and Azure Service Health*
- **In a test subscription:** [Chapter 01, Lab 2](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#lab-2-a-test-subscription)
- **As training:** [Module 2: Azure Service Health and alerts](../../training/provider-notices/02-azure-service-health-and-alerts.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** The collection only reads. For the alert policy, `deploy/Invoke-PnRollback.ps1` plans deleting the assignment; the resource groups, alert rules and action groups its remediation created stay until the change record decides on them.

## Step 2: Microsoft 365 Message center and service health {#step-2-microsoft-365-message-center-and-service-health}

Message center is where Microsoft announces changes, retirements and actions for a Microsoft 365 tenant; service health lists incidents and advisories. Graph's service communications API reads both.[^pn-graph-overview]

**Prerequisites.** An administrator consents to `ServiceMessage.Read.All` and `ServiceHealth.Read.All` for the reader, delegated or application; both kinds are granted only by an administrator, and a delegated sign-in also needs an admin role.[^pn-graph-overview] Data privacy messages are visible only to Global Administrators and Message Center Privacy Readers.[^pn-m365-roles]

**Steps.**

1. **Install the module and sign in to the tenant's own cloud.** GCC uses `Global`; GCC High `USGov`; DoD `USGovDoD`.

    ```powershell
    Install-Module Microsoft.Graph.Authentication -Scope CurrentUser
    Connect-MgGraph -Environment Global -Scopes ServiceMessage.Read.All,ServiceHealth.Read.All
    ```

2. **Collect.** The kit reads `/admin/serviceAnnouncement/messages`, `/issues` and `/healthOverviews` on v1.0 and follows `@odata.nextLink`.[^pn-graph-messages][^pn-graph-issues]

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider m365 -OutputPath out/m365
    ```

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| SA-9 c and SI-5 a, as in Gate 1 | KSI-SCR-MIT, KSI-SCR-MON | `raw/m365.json`, `notices.json`, `manifest.json` |
| CM-3 (configuration change control), part b: review proposed changes with a security and privacy impact analysis, for posts that announce a change | KSI-CMT-LMC, KSI-CMT-RVP | The task payloads for `change` and `retirement` notices (Gate 6) |

: Gate 2 requirements and evidence {.striped .hover}

**Government-cloud availability.** Learn's overview says the service communications API is available on Microsoft Graph national clouds, and each list method's table shows US Government L4 and L5.[^pn-graph-overview] GCC keeps the worldwide endpoint, `graph.microsoft.com`; GCC High uses `graph.microsoft.us` and DoD `dod-graph.microsoft.us`.[^pn-graph-deployments] The kit sends each call only to the cloud's own host and refuses a Graph session in another environment or tenant.

**Interim path.** Learn's own cmdlets, from `Microsoft.Graph.Devices.ServiceAnnouncement`, list the same posts:[^pn-graph-messages]

```powershell
Install-Module Microsoft.Graph.Devices.ServiceAnnouncement -Scope CurrentUser
Get-MgServiceAnnouncementMessage | Select-Object Id, Title, Category, ActionRequiredByDateTime
```

::: {.callout-important}
## Validate (G2 Microsoft 365)
- **`Invoke-PnCollect.ps1 -Provider m365`** writes every post and issue as a notice. Pass: a post with an action-required date is `actionRequired` with that date and the basis `provider: actionRequiredByDateTime`.
- Gate owner: the Microsoft 365 service owner.
:::

::: {.callout-tip}
## Try it: G2 Microsoft 365
On a laptop, no tenant, from `examples/provider-notices`:

```powershell
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider m365 -AsOf 2026-11-09T12:00:00Z -OutputPath out/m365
```

Six notices: a retirement with a provider date, a change the kit marks action required by its rule, three advisories and an open incident.
:::

<!-- labs:begin try-g2 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Labs and training: G2 Microsoft 365
- **On a laptop, no tenant:** [Chapter 02, Lab 1](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#lab-1-fixtures-no-tenant) of *Microsoft 365 Message Center and Service Health*
- **In a test tenant:** [Chapter 02, Lab 2](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#lab-2-a-test-tenant)
- **As training:** [Module 3: Microsoft 365 Message center](../../training/provider-notices/03-microsoft-365-message-center.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** Nothing to roll back: the collection only reads. Revoke the reader's consent when the kit is retired.

## Step 3: Oracle Cloud Infrastructure announcements {#step-3-oracle-cloud-infrastructure-announcements}

OCI publishes maintenance, changes, action-required notices and production events for a tenancy as announcements. Updates to one announcement form a chain; the kit keeps only the latest in each.[^pn-oci-cli] An agency whose HR platform runs on OCI reads that tenancy here, so platform maintenance reaches the HR system's owners before it lands.

**Prerequisites.** An IAM administrator adds this statement to a policy in the tenancy (root compartment) for the reader's group:[^pn-oci-policy]

```text
Allow group <group> to read announcements in tenancy
```

`inspect` instead of `read` lists summaries only, without the details call's affected resources.

**Steps.**

1. **Configure the OCI CLI** for the reader, in the tenancy's home region, as Oracle's CLI documentation describes.
2. **Cross-check the list.** The kit's call is Oracle's `list` command, latest in each chain:[^pn-oci-cli]

    ```powershell
    oci announce announcements list --compartment-id <tenancy-ocid> --all --should-show-only-latest-in-chain true
    ```

3. **Collect.** The kit lists, then reads each announcement's details for its affected resources.[^pn-oci-get]

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider oci -OutputPath out/oci
    ```

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| SA-9 c and SI-5 a, as in Gate 1 | KSI-SCR-MIT, KSI-SCR-MON | `raw/oci.json`, `notices.json`, `manifest.json` |
| CP-2 (contingency plan), part e: update the plan for changes to the system or environment of operation, when maintenance names the agency's resources | KSI-RPL-ARP | The task payload with `contingency_review: true` (Gate 6) |

: Gate 3 requirements and evidence {.striped .hover}

**Government-cloud availability.** Oracle's US Government Cloud page lists the Announcements API at `announcements.us-langley-1.oraclegovcloud.com` and `announcements.us-luke-1.oraclegovcloud.com`, in realm OC2.[^pn-oci-gov] OC3's endpoint is not yet specified; the kit refuses that realm.

**Interim path.** The announcement email Oracle sends to the tenancy's notification recipients, filed with the change record until the reader exists. Name who receives it in the settings file's `noticeContacts`; the preflight checks it.

::: {.callout-important}
## Validate (G3 Oracle Cloud Infrastructure)
- **`Invoke-PnCollect.ps1 -Provider oci`** writes one notice per chain. Pass: an `ACTION_REQUIRED` announcement is action required with its `ACTION_REQUIRED_BY` date, and maintenance lists its affected resources.
- Gate owner: the OCI platform lead, with the owner of each system on OCI.
:::

::: {.callout-tip}
## Try it: G3 Oracle Cloud Infrastructure
On a laptop, no tenant, from `examples/provider-notices`:

```powershell
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider oci -AsOf 2026-11-16T12:00:00Z -OutputPath out/oci
```

Four notices; the rescheduled maintenance replaces the original in its chain, with the new window.
:::

<!-- labs:begin try-g3 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Labs and training: G3 Oracle Cloud Infrastructure
- **On a laptop, no tenant:** [Chapter 03, Lab 1](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#lab-1-fixtures-no-tenant) of *Oracle Cloud Infrastructure Announcements*
- **In a test tenancy:** [Chapter 03, Lab 2](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#lab-2-a-test-tenancy)
- **As training:** [Module 4: Oracle Cloud Infrastructure announcements](../../training/provider-notices/04-oci-announcements.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** Nothing to roll back: the collection only reads. Remove the policy statement when the kit is retired.

## Step 4: AWS Health {#step-4-aws-health}

AWS Health publishes issues, scheduled changes and account notifications per account, with the affected resources.[^pn-aws-events]

**Prerequisites.** The account has a qualifying AWS Support plan; without one the API answers `SubscriptionRequiredException`. AWS's pages name the qualifying plans differently: the CLI reference names Business, Enterprise On-Ramp or Enterprise Support, the AWS Health User Guide names Business Support+, Enterprise Support or Unified Operations, and the GovCloud (US) guide names Business or Enterprise. Check the account's plan against the current pages.[^pn-aws-plan] [^pn-aws-plan-ug] The reader holds a customer managed policy with the three read actions; AWS publishes no read-only managed policy for Health, and `AWSHealthFullAccess` includes writes.[^pn-aws-iam]

**Steps.**

1. **Create the read policy.** Save this as `health-read.json`:

    ```json
    {
      "Version": "2012-10-17",
      "Statement": [
        { "Effect": "Allow", "Action": ["health:DescribeEvents", "health:DescribeEventDetails", "health:DescribeAffectedEntities"], "Resource": "*" }
      ]
    }
    ```

    Then create it and attach it to the reader's role:

    ```powershell
    aws iam create-policy --policy-name ProviderNoticesHealthRead --policy-document file://health-read.json
    ```

2. **Cross-check from the Health endpoint.** Commercial accounts use `us-east-1`; GovCloud (US) `us-gov-west-1`.[^pn-aws-endpoints][^pn-aws-gov]

    ```powershell
    aws health describe-events --region us-east-1
    ```

3. **Collect.** The kit reads open and upcoming events, then details and affected entities ten events at a time.[^pn-aws-details]

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider aws -OutputPath out/aws
    ```

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| SA-9 c and SI-5 a, as in Gate 1 | KSI-SCR-MIT, KSI-SCR-MON | `raw/aws.json`, `notices.json`, `manifest.json` |
| SI-5 d: implement directives in the established time frames, for events whose `actionability` is `ACTION_REQUIRED` | KSI-SCR-MON | The task payload with its `action_due` (Gate 6) |

: Gate 4 requirements and evidence {.striped .hover}

**Government-cloud availability.** In AWS GovCloud (US) the Health API has a single regional endpoint in `us-gov-west-1`, and EventBridge there doesn't send public events from the Service Health view.[^pn-aws-gov] The kit refuses a caller outside the settings' partition.

**Interim path.** An EventBridge rule on `aws.health` events, with `detail-type` `AWS Health Event`, pushes scheduled changes as they're published.[^pn-aws-eb] The kit doesn't build the rule. Without a support plan, the AWS Health Dashboard and its email are the only path.

::: {.callout-important}
## Validate (G4 AWS Health)
- **`Invoke-PnCollect.ps1 -Provider aws`** writes every open and upcoming event. Pass: the instance retirement is a retirement, due at its start, with the instance as its resource; an error naming `SubscriptionRequiredException` means the account has no qualifying support plan.
- Gate owner: the AWS account owner.
:::

::: {.callout-tip}
## Try it: G4 AWS Health
On a laptop, no tenant, from `examples/provider-notices`:

```powershell
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider aws -AsOf 2026-11-09T12:00:00Z -OutputPath out/aws
```

Five notices: two retirements, one maintenance window, one security notification and a closed incident.
:::

<!-- labs:begin try-g4 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Labs and training: G4 AWS Health
- **On a laptop, no tenant:** [Chapter 04, Lab 1](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#lab-1-fixtures-no-tenant) of *AWS Health*
- **In a test account:** [Chapter 04, Lab 2](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#lab-2-a-test-account)
- **As training:** [Module 5: AWS Health and the support plan](../../training/provider-notices/05-aws-health-and-the-support-plan.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** Nothing to roll back: the collection only reads. Detach and delete the read policy when the kit is retired.

## Step 5: Google Cloud Personalized Service Health {#step-5-google-cloud-personalized-service-health}

Personalized Service Health lists Google Cloud incidents relevant to a project or organization.[^pn-gcp-events] Its API has one event category, `INCIDENT`: planned maintenance isn't in it, so this gate covers incidents only.[^pn-gcp-event]

**Prerequisites.** The project owner enables the API once, and grants the reader's group the viewer role:[^pn-gcp-list][^pn-gcp-iam]

```powershell
gcloud services enable servicehealth.googleapis.com --project=<project-id>
gcloud projects add-iam-policy-binding <project-id> --member=group:<group-email> --role=roles/servicehealth.viewer
```

**Steps.**

1. **Cross-check the list.**[^pn-gcp-gcloud]

    ```powershell
    gcloud service-health events list --project=<project-id> --location=global
    ```

2. **Collect.** For an organization, set the settings file's `providers.google.scope` to `organization` and grant the role on the organization.

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider google -OutputPath out/google
    ```

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| SA-9 c and SI-5 a, as in Gate 1 | KSI-SCR-MIT, KSI-SCR-MON | `raw/google.json`, `notices.json`, `manifest.json` |

: Gate 5 requirements and evidence {.striped .hover}

**Government-cloud availability.** Assured Workloads' supported-products page lists Personalized Service Health under 25 regional packages, including US Data Boundary, but not under FedRAMP Moderate, FedRAMP High, IL2, IL4, IL5, CJIS or ITAR.[^pn-gcp-aw] A workload in one of those packages has no Personalized Service Health to read; record that as a gap with the ISSO.

**Interim path.** The organization-events call is verified on Google's REST reference, but the gcloud flags for it weren't read, so the kit marks it unverified and runs it only with `-AllowUnverified`.

::: {.callout-important}
## Validate (G5 Google Cloud)
- **`Invoke-PnCollect.ps1 -Provider google`** writes every incident. Pass: products and locations come from `eventImpacts`, and closed incidents are closed.
- Gate owner: the Google Cloud project owner.
:::

::: {.callout-tip}
## Try it: G5 Google Cloud
On a laptop, no tenant, from `examples/provider-notices`:

```powershell
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider google -AsOf 2026-11-09T12:00:00Z -OutputPath out/google
```

Two incidents, one open and one closed.
:::

<!-- labs:begin try-g5 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Labs and training: G5 Google Cloud
- **On a laptop, no tenant:** [Chapter 05, Lab 1](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#lab-1-fixtures-no-tenant) of *Google Cloud Personalized Service Health*
- **In a test project:** [Chapter 05, Lab 2](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#lab-2-a-test-project)
- **As training:** [Module 6: Google incidents and the maintenance gap](../../training/provider-notices/06-google-incidents-and-the-maintenance-gap.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** Nothing to roll back: the collection only reads. Remove the role binding when the kit is retired; leave the API enabled unless the project owner decides otherwise.

## Step 6: Route notices to owners {#step-6-route-notices-to-owners}

A notice that needs action becomes a task with an owner; the rest go in the digest. The router compares each run with the last, so a notice the provider hasn't changed never makes a second task.

**Prerequisites.** At least one of G1 to G5. The agency's routing file, written at work from the kit's template.

**Steps.**

1. **Write the routing at work.** Copy `templates/routing.template.json`, or fill `templates/routing-worksheet.csv`, inside the agency's boundary; the kit's [Copilot prompts](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/provider-notices/copilot-prompts.md) draft and review it in Microsoft 365 Copilot Chat. Rules are tried in order and the first match wins, so security advisories and retirements come before the general action-required rule *(design guidance)*.
2. **Check it.** The kit refuses an unknown match key, a task rule without a severity or assignment group, and a placeholder left in:

    ```powershell
    pwsh -NoProfile -Command "Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1; Read-PnRouting -Path <routing-file>"
    ```

3. **Route, as a dry run.** Each task payload is ServiceNow-shaped: the finding contract's severity, priority and response window (P1 immediate, P2 one hour, P3 24 hours, P4 72 hours; program design, not a federal requirement), the provider's own action date kept separate, a de-duplication key of provider and provider ID, and the five clauses of the request chain in the Human decision lane ([Book 13, Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md)).

    ```powershell
    ./Invoke-PnRoute.ps1 -NoticesPath out/azure/notices.json -RoutingPath <routing-file> -StatePath out/state.json -OutputPath out/route
    ```

4. **Send, once the endpoint exists.** The scheduled run sends only when the settings file's `routing.send` is true and `-Send` is given, to the settings' `https` endpoint with a token from the environment variable it names. A task closes only after the re-read (C4): the next collection shows the notice closed or no longer listed. A provider closing a notice produces a `close` payload that asks for the re-read; it doesn't close the task *(design guidance)*.

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| SI-5 c and d: disseminate advisories to the people who act, and implement directives in the established time frames or report the gap | KSI-SCR-MON | `tasks/`, `tasks.json`, `routing.csv`, `state.json` |
| CM-3 b and f, CM-4 (impact analyses): a change a provider announces is reviewed and its impact analyzed before it lands | KSI-CMT-LMC, KSI-CMT-RVP | The task payloads for `change`, `retirement` and `maintenance`, and the change records they open |
| CP-2 e: retirements and maintenance that name the agency's resources prompt a contingency plan review | KSI-RPL-ARP | Payloads with `contingency_review: true` |

: Gate 6 requirements and evidence {.striped .hover}

No KSI cites base CM-4; KSI-CMT-LMC and KSI-CMT-VTD cite CM-4(2).[^pn-ksi] CM-3 to KSI-CMT-LMC is also Book 13, Appendix A's row.

**Government-cloud availability.** Routing runs on the operator's workstation or a scheduler and calls no cloud; the ServiceNow endpoint is the agency's own.

**Interim path.** Before the endpoint exists, the service desk works from the dry run's `tasks/` folder and `routing.csv`, and records each task's number in the change record.

::: {.callout-important}
## Validate (G6 Routing)
- **`Invoke-PnRoute.ps1`** (dry run) prints new, changed, unchanged and no-longer-listed counts and each payload. Pass: every security advisory and retirement routes to a task; a second run on the same collection writes no payload.
- Gate owner: the change manager, with the ISSO for the security route.
:::

::: {.callout-tip}
## Try it: G6 Routing
On a laptop, no tenant, from `examples/provider-notices`:

```powershell
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/day1
./Invoke-PnRoute.ps1 -NoticesPath out/day1/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day1-route -AsOf 2026-11-09T12:00:00Z
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -AsOf 2026-11-16T12:00:00Z -OutputPath out/day2
./Invoke-PnRoute.ps1 -NoticesPath out/day2/notices.json -RoutingPath config/routing.json -StatePath out/state.json -OutputPath out/day2-route -AsOf 2026-11-16T12:00:00Z
```

Day 1 writes 12 create payloads. Day 2 writes 1 create, 4 updates (two rescheduled maintenance windows, an updated post, an incident no longer listed) and 1 close, and nothing for the 15 unchanged notices.
:::

<!-- labs:begin try-g6 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Labs and training: G6 Routing
- **On a laptop, no tenant:** [Chapter 06, Lab 1](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#lab-1-fixtures-no-tenant) of *Routing to Owners and Ticket-to-Machine Tasks*
- **In a ServiceNow developer instance:** [Chapter 06, Lab 2](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#lab-2-a-servicenow-developer-instance)
- **As training:** [Module 7: Routing to owners](../../training/provider-notices/07-routing-to-owners.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** Revert the routing file to the last reviewed version. The state file is the record of what was routed; keep it.

## Step 7: Digest and evidence {#step-7-digest-and-evidence}

The digest is what the owners read every week; the evidence is what the ISSO keeps. The deployment runbook takes both to a test environment, then production, with the same commands and one settings file per environment.

**Prerequisites.** G6. A settings file per environment, and a scheduler the agency runs; the kit doesn't register one.

**Steps.**

1. **Preflight the stage.** Reads only: the settings and routing files, each enabled provider's tool and signed-in cloud, the reader's first call (for AWS also the support plan), the named notice contacts, the output root, and in production the test stage's evidence (PF-01 to PF-07).

    ```powershell
    ./deploy/Test-PnPreflight.ps1 -SettingsPath <settings-file> -Stage test -OutputPath out/preflight
    ```

2. **Run the weekly collection, routing and digest.** Each step is recorded as evidence under the settings' output root.

    ```powershell
    ./deploy/Invoke-PnScheduledRun.ps1 -SettingsPath <settings-file>
    ```

3. **Record the preflight and check the stage.** The go/no-go needs a passing record for every step the stage lists (test: PRE, RUN, ROUTE, DIGEST; production adds ALERTS), an unbroken chain and a matching `SHA256SUMS`.

    ```powershell
    ./Invoke-PnEvidence.ps1 -EvidencePath <output-folder>/evidence -RunPath out/preflight
    ./Invoke-PnEvidence.ps1 -EvidencePath <output-folder>/evidence -Check -Stage test
    ```

    `<output-folder>` is the settings file's `outputRoot`. In production, pass the test stage's evidence folder to the preflight with `-TestEvidencePath`.

**Federal requirements and evidence.**

| Requirement | KSI | What the ISSO keeps |
|---|---|---|
| SI-5 c, SA-9, RA-3 (risk assessment), part f: update the assessment when the environment of operation changes significantly | KSI-SCR-MON, KSI-SCR-MIT | `digest.md`, `digest.csv`, each week |
| CA-7 (continuous monitoring), AU-9 (protection of audit information) | KSI-MLA-EVC, KSI-MLA-OSM | `records/`, `records.csv`, `SHA256SUMS`: time, environment, change record, command, result, controls, KSIs, every file's hash and the previous record's hash |
| SA-9 and SR-8 (notification agreements): who receives each provider's notices is named and current | KSI-SCR-MON | The preflight's `results.json` (PF-05) |

: Gate 7 requirements and evidence {.striped .hover}

**Government-cloud availability.** As in Gates 1 to 5, per provider; the run reads each provider in the cloud its settings file names.

**Interim path.** Run the four entry scripts by hand each week and record each run folder with `Invoke-PnEvidence.ps1` until the scheduler is in place.

::: {.callout-important}
## Validate (G7 Digest and evidence)
- **`Invoke-PnDigest.ps1`** writes the digest's five sections. Pass: every action-required notice shows its due date and owner.
- **`Invoke-PnEvidence.ps1 -Check -Stage test`** (then `production`). Pass: every row passes.
- Gate owner: the ISSO.
:::

::: {.callout-tip}
## Try it: G7 Digest and evidence
On a laptop, no tenant, from `examples/provider-notices`, after the G6 *Try it*:

```powershell
./Invoke-PnDigest.ps1 -NoticesPath out/day2/notices.json -StatePath out/state.json -OutputPath out/digest -AsOf 2026-11-16T12:00:00Z
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/day2 -AsOf 2026-11-16T12:00:00Z
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/day2-route -AsOf 2026-11-16T12:00:00Z
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/digest -AsOf 2026-11-16T12:00:00Z
./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check
```

The digest shows 16 open notices, 8 needing action and 5 starting in the next 30 days; the check shows the three records' chain unbroken.
:::

<!-- labs:begin try-g7 (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Labs and training: G7 Digest and evidence
- **On a laptop, no tenant:** [Chapter 07, Lab 1](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#lab-1-fixtures-no-tenant) of *The Weekly Digest and Evidence*
- **In a test environment's runs:** [Chapter 07, Lab 2](../../project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md#lab-2-a-test-environments-runs)
- **As training:** [Module 8: Digest, evidence and go/no-go](../../training/provider-notices/08-digest-evidence-and-go-no-go.md), with a knowledge check
:::

<!-- labs:end -->

**Rollback.** `deploy/Invoke-PnRollback.ps1` plans, in reverse order, unregistering the scheduled task and deleting the Service Health policy assignment, and runs only with `-Apply` and the approved hash. The state, runs and evidence are kept.

```powershell
./deploy/Invoke-PnRollback.ps1 -SettingsPath <settings-file> -OutputPath out/rollback
```

## Control states, change safety and assessment mapping {#pn-control-states}

This section states the guide against the workbook's conventions in [Book 00, Appendix D](../b00-orientation/appendix-d-control-states-and-evidence.md). Provider notices are a detective and operating loop: they inform owners and open tasks, and block nothing.

**Control states.** <!-- Book 00, Appendix D: Designed, Configured, Enforced, Evidenced, Operated -->

| State | This page | Evidence |
|---|---|---|
| Designed | [Prerequisites](#prerequisites) (owners, routing decisions, notice contacts); [G6](#step-6-route-notices-to-owners), step 1 (the routing file) | The reviewed routing file and the named owner of each provider's notices |
| Configured | [G1](#step-1-azure-service-health) to [G5](#step-5-google-cloud-personalized-service-health): a reader per provider holding only its read role; G1's alert policy planned | Role assignments and policy statements; each run's `manifest.json`; the alert plan |
| Enforced | Not applicable for the notices: the loop blocks nothing. The one setting applied at scope is G1's Service Health alert policy, remediated at the management group | The assignment compliant after remediation, and `results.json` |
| Evidenced | Each gate's **Validate**; G7's `Invoke-PnEvidence.ps1 -Check -Stage` | The check output, and the evidence records and `SHA256SUMS` it verified |
| Operated | [G7](#step-7-digest-and-evidence): the weekly run, the digest, tasks closed only on the re-read | The schedule, each week's digest, the evidence chain with no gap, the ISSO as gate owner |

A finding this page addresses is ready for closure when every applicable state has evidence; the authorizing official or assessor decides.

**How-template coverage.** Where the guide carries each subsection of [Appendix D's How template](../b00-orientation/appendix-d-control-states-and-evidence.md#how-section-template):

| Subsection | Where it is |
|---|---|
| Prerequisites | [Prerequisites](#prerequisites) and each gate's own; government-cloud availability in each gate and in [the five providers compared](#the-five-providers-compared) |
| Pilot | The test stage of [G7](#step-7-digest-and-evidence): one settings file per environment, and the test stage's evidence is a production preflight check |
| Report-only or audit phase | The dry runs: `deploy/New-PnAlertPolicy.ps1` without `-Apply` (G1) and `Invoke-PnRoute.ps1` without `-Send` (G6); task payloads stay files until the endpoint exists |
| Enforcement | Not applicable as a blocking control; the production switches are G1's `-Apply -ApprovedSha256` and G6's `-Send` |
| Rollback | [Rollback](#rollback), by gate, and `deploy/Invoke-PnRollback.ps1` |
| Exclusions | Not applicable: no person or sign-in is restricted. Providers not enabled, and Google Cloud's planned-maintenance gap, are recorded with the ISSO (G5) |
| Telemetry | Each run's `raw/` files and `manifest.json`; G1's Service Health alerts; the evidence chain |
| Evidence | [Evidence](#evidence) and its checklist |
| Day-two ownership | Each gate's owner; the ISSO for G7; owners read the weekly digest and work their tasks ([Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md)) |

: Where each How-template subsection is covered {.striped .hover}

**Change safety** *(design guidance)*. Only G1's policy assignment and G6's sending change anything outside the kit's own folders.

| Ring | Scope | Exit criteria |
|---|---|---|
| 0 | The test stage: test settings file, test subscriptions and a test ServiceNow endpoint, if built | `Invoke-PnEvidence.ps1 -Check -Stage test` passes |
| 1 | Production, collection and dry-run routing only | One week's digest read by the owners; the dry run's tasks match what the owners expected |
| 2 | Production, G1's alert policy applied and G6's `-Send` on | `Invoke-PnEvidence.ps1 -Check -Stage production` passes |

- **Emergency access:** not applicable: no sign-in is restricted.
- **Change window:** the change record that approves each plan's SHA-256, with the cloud platform lead on hand for G1 and the service desk for G6.
- **Backout triggers:** remediation that fails or reaches subscriptions outside scope; duplicate tasks on a re-run; tasks sent to the wrong assignment group *(program decision, settled as [WD-150](../../about/decision-register.md#wd-150))*.
- **Post-change validation:** G1's and G6's **Validate** steps, after each ring.

The guide addresses no Zero Trust Assessment test family, so it carries no assessment-mapping block; its requirements are SA-9, SI-5, CM-3, CP-2 and CA-7, in each gate's table.

## Dangers and how to avoid them {#dangers}

| Danger | What goes wrong | Mitigation |
|---|---|---|
| **A notice acted on from email alone** | Attackers send look-alike provider mail; a technician follows a link ([Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md)) | Act only on the notice the kit read from the provider's API, linked in the task |
| **Security advisories read without the elevated role** | Reader sees the advisory but not its summary, description or impacted resources[^pn-sec-elevated] | Grant Service Health Security Reader (G1); an empty summary in a security notice is the sign |
| **A reader in the wrong cloud** | A GCC High tenant read from `graph.microsoft.com` returns nothing, and the gate passes on an empty list | The settings name each cloud; the kit refuses a session in another cloud, tenant, partition or realm |
| **A task closed because the provider closed the notice** | The provider's fix isn't the agency's: a retirement can close while the resource still runs the retired SKU | A `close` payload asks for the re-read (C4); the task closes on the agency's own check *(design guidance)* |
| **Google maintenance assumed covered** | Personalized Service Health has no planned maintenance[^pn-gcp-event] | Record the gap with the ISSO; Google's maintenance reaches the project by other channels |
| **AWS without a support plan** | `SubscriptionRequiredException`; nothing is read[^pn-aws-plan] | The preflight's first call fails (PF-04-aws); use the dashboard until the plan is in place |
| **Policy-created alert rules edited by hand** | Remediation may overwrite the edit[^pn-policy] | Change the assignment's parameters and remediate again |
| **The agency's routing in a public repository** | Owners, assignment groups and which clouds matter, published | Routing, settings, notices and digests stay inside the boundary; the kit ships templates only |
| **The weekly run stops silently** | No digest, no evidence, no tasks | The evidence chain shows the gap; the go/no-go fails without a passing RUN record |

: Dangers in provider notices {.striped .hover}

## Evidence {#evidence}

Each gate's table names what the ISSO keeps. Together they make one file:

| Gate | Evidence | Key requirements | KSIs |
|---|---|---|---|
| G1 | `raw/azure.json`, notices, manifest; the alert plan and results | SA-9, SI-5, CA-7 | KSI-SCR-MIT, KSI-SCR-MON, KSI-MLA-EVC |
| G2 | `raw/m365.json`, notices, manifest | SA-9, SI-5, CM-3 | KSI-SCR-MIT, KSI-SCR-MON, KSI-CMT-LMC |
| G3 | `raw/oci.json`, notices, manifest | SA-9, SI-5, CP-2 | KSI-SCR-MIT, KSI-SCR-MON, KSI-RPL-ARP |
| G4 | `raw/aws.json`, notices, manifest | SA-9, SI-5 | KSI-SCR-MIT, KSI-SCR-MON |
| G5 | `raw/google.json`, notices, manifest | SA-9, SI-5 | KSI-SCR-MIT, KSI-SCR-MON |
| G6 | Task payloads, `routing.csv`, state | SI-5, CM-3, CM-4, CP-2 | KSI-SCR-MON, KSI-CMT-LMC, KSI-CMT-RVP, KSI-RPL-ARP |
| G7 | Digests, preflight results, evidence records, `records.csv`, `SHA256SUMS` | SI-5, SA-9, RA-3, CA-7, AU-9, SR-8 | KSI-SCR-MON, KSI-SCR-MIT, KSI-MLA-EVC, KSI-MLA-OSM |

: Evidence by gate {.striped .hover}

The kit's records support these controls; they don't by themselves decide them, and the agency's assessor does. SI-5, SA-9, CP-2 and CA-7 are in the NIST Low, Moderate and High baselines and FedRAMP Classes B, C and D, and CM-3 in Moderate and High and Classes C and D ([Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md); [Book 12, Appendix A](../b12-security-operations/appendix-a-requirements-mapping.md); [Book 14, Chapter 06](../b14-compliance/06-contingency-and-continuity.md)). File every run with its date, environment and kit version.

**Evidence checklist**

- [ ] **Configuration:** the settings file per environment, the routing file, the readers' role assignments and policy statements, and G1's alert plan, kept inside the boundary
- [ ] **Operational:** each week's `raw/` files, `notices.json`, task payloads, `state.json` and digest, kept with the evidence records
- [ ] **Test:** each gate's **Validate** result and the stage's `Invoke-PnEvidence.ps1 -Check` output, with date and operator
- [ ] **Exception:** providers not enabled, the Google Cloud planned-maintenance gap, and any gate passed on its interim path, each with the ISSO's acceptance
- [ ] **Assessor-ready artifact:** the evidence chain (`records/`, `records.csv`, `SHA256SUMS`) for the period, traceable to the four above

## Rollback

| Gate | Rollback |
|---|---|
| G1 Azure | None for the collection; plan and apply the policy assignment's deletion; the change record decides on the resources remediation created |
| G2 Microsoft 365 | None: read-only; revoke consent when retired |
| G3 OCI | None: read-only; remove the policy statement when retired |
| G4 AWS | None: read-only; detach the read policy when retired |
| G5 Google Cloud | None: read-only; remove the role binding when retired |
| G6 Routing | Revert the routing file; keep the state |
| G7 Digest and evidence | Unregister the schedule; keep runs and evidence |

: Rollback by gate {.striped .hover}

## Checklist

- [ ] Every subscription in scope read by a Reader, security advisories by Service Health Security Reader; the Service Health alert policy assigned and remediated (G1)
- [ ] Message center and service health read on the tenant's own Graph host (G2)
- [ ] Every OCI tenancy's announcements read, latest in each chain, with affected resources (G3)
- [ ] Every AWS account with a qualifying support plan read from its partition's Health endpoint (G4)
- [ ] Google Cloud incidents read, and the planned-maintenance gap recorded with the ISSO (G5)
- [ ] The routing reviewed; every notice that needs action has a task; re-runs de-duplicate; tasks close on the re-read (G6)
- [ ] The weekly run scheduled; the digest reaches the owners; each stage's evidence passes the go/no-go (G7)

## What couldn't be verified {#what-couldnt-be-verified}

- **Azure Resource Graph's column schema and time format.** Learn gives no full `ServiceHealthResources` column list or sample row. The kit projects the columns Learn's samples use and converts the impact times as Learn's health advisory sample does; `LastUpdateTime`'s raw format is not yet specified, and the kit accepts an ISO time, epoch seconds or milliseconds, or ticks.
- **Whether Resource Graph redacts security advisories' sensitive fields** for a Reader, as the REST list does. Not stated on Learn.
- **Resource Graph's Service Health table in Azure Government.** Learn's samples link the Azure Government portal; an explicit availability statement is not yet specified.
- **The `az graph query` output keys.** The kit reads `data` and `skip_token`, as Azure CLI prints them; Learn documents the REST response's `$skipToken`, not the CLI's keys.
- **The alert resource type the Service Health policy creates,** and its parameter names for a parameters file. Learn names the alert rule and action group, not the resource type or the parameter names; read them with `az policy definition show` before writing a parameters file.
- **Microsoft 365 Message center tags.** Learn doesn't enumerate them; the kit treats a post tagged `Retirement` as a retirement.
- **Which admin roles Graph accepts for a delegated read.** Learn says the signed-in user needs an admin role and doesn't name them.
- **OCI CLI output keys** (camelCase or kebab-case): not shown in Oracle's CLI reference. The kit accepts both. **OCI realm OC3**: Oracle's page wasn't readable; the kit refuses the realm.
- **The gcloud flags for organization events.** The REST call is verified; the kit marks the gcloud call unverified and runs it only with `-AllowUnverified`.
- **The ServiceNow side.** The router's payload is the kit's; the endpoint that takes it is the agency's to build.
- **The scheduler.** The kit doesn't register a schedule; rollback's step to unregister a Windows scheduled task assumes the agency used one.
- **Tenant behavior.** Nothing in this guide was run in a tenant, account, tenancy or project. The checks are fixture-tested, and every live command is unrun by the authors.

## Back to the books

[Book 15, Chapter 03](../b15-day2-operations/03-intake-triage-and-routing.md) (intake, triage and routing) · [Book 12, Chapter 04](../b12-security-operations/04-platform-and-m365-telemetry.md) (platform telemetry) · [Book 13, Chapter 10](../b13-governance/10-ticket-to-machine.md) and [Appendix B](../b13-governance/appendix-b-ticket-to-machine-reference.md) (Ticket-to-Machine) · [Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md) · [Book 14, Chapter 06](../b14-compliance/06-contingency-and-continuity.md) (contingency) · [Book 14, Chapter 07](../b14-compliance/07-supply-chain-risk-management.md) (supply chain) · [Ticket-to-Machine task catalog guide](ttm-task-catalog.md)

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/provider-notices-implementation.md).

<!-- revisions:end -->

[^pn-arg-samples]: Microsoft Learn, "Azure Resource Graph sample queries for Azure Service Health" (all active events; health advisories, whose mitigation time is the advisory's end; upcoming retirements as health advisories with EventSubType Retirement; planned maintenance; Azure Government portal links; emerging issues not queryable), <https://learn.microsoft.com/azure/service-health/resource-graph-samples> (accessed Nov 9, 2026).
[^pn-arg-impacted]: Microsoft Learn, "Resource Graph sample queries for impacted resources" (impacted resources by tracking ID; planned maintenance joined with `maintenanceresources`), <https://learn.microsoft.com/azure/service-health/resource-graph-impacted-samples> (accessed Nov 9, 2026).
[^pn-sub-tenant]: Microsoft Learn, "Subscription versus tenant level events" (Reader on a subscription to view Service Health events), <https://learn.microsoft.com/azure/service-health/subscription-vs-tenant> (accessed Nov 9, 2026).
[^pn-sec-elevated]: Microsoft Learn, "Access to sensitive information in security advisories" and "Elevated access for viewing security advisories" (Service Health Security Reader, or a role with the fetchEventDetails and listSecurityAdvisoryImpactedResources actions; Reader and Monitoring Reader can't view sensitive fields), <https://learn.microsoft.com/azure/service-health/impacted-resources-security> and <https://learn.microsoft.com/azure/service-health/security-advisories-elevated-access> (accessed Nov 9, 2026).
[^pn-policy]: Microsoft Learn, "Deploy Service Health alerts at scale using Azure Policy" (the built-in definition, management group or subscription scope, remediation for existing subscriptions, default resources, manual edits overwritten), <https://learn.microsoft.com/azure/service-health/service-health-alert-deploy-policy> (accessed Nov 9, 2026).
[^pn-remediate]: Microsoft Learn, "Remediate non-compliant resources with Azure Policy" (`az policy assignment create` with `--location` and `--mi-system-assigned`; roles granted automatically only through the portal), <https://learn.microsoft.com/azure/governance/policy/how-to/remediate-resources>, and Azure CLI reference for `az policy assignment create` (`--role`, `--identity-scope`) and `az policy remediation create`, <https://learn.microsoft.com/cli/azure/policy/assignment> and <https://learn.microsoft.com/cli/azure/policy/remediation> (accessed Nov 9, 2026).
[^pn-gov-cli]: Microsoft Learn, "Connect to Azure Government with Azure CLI," <https://learn.microsoft.com/azure/azure-government/documentation-government-get-started-connect-with-cli>, and "Azure CLI endpoints" (resource manager `https://management.usgovcloudapi.net/`), <https://learn.microsoft.com/cli/azure/azure-cli-endpoints> (accessed Nov 9, 2026).
[^pn-graph-overview]: Microsoft Learn, "Use the Microsoft Graph API to access service communications" (permissions, granted only by an administrator; a delegated user needs an admin role; available on national clouds, with the US Government L4 and L5 URLs), <https://learn.microsoft.com/graph/api/resources/service-communications-api-overview> (accessed Nov 9, 2026).
[^pn-graph-deployments]: Microsoft Learn, "National cloud deployments" (GCC continues using the worldwide endpoints), <https://learn.microsoft.com/graph/deployments> (accessed Nov 9, 2026).
[^pn-graph-messages]: Microsoft Learn, "List serviceAnnouncement messages" (`ServiceMessage.Read.All`; national cloud availability; the PowerShell module and cmdlet), <https://learn.microsoft.com/graph/api/serviceannouncement-list-messages?view=graph-rest-1.0> (accessed Nov 9, 2026).
[^pn-graph-issues]: Microsoft Learn, "List serviceAnnouncement issues" and "List healthOverviews" (`ServiceHealth.Read.All`), <https://learn.microsoft.com/graph/api/serviceannouncement-list-issues?view=graph-rest-1.0> and <https://learn.microsoft.com/graph/api/serviceannouncement-list-healthoverviews?view=graph-rest-1.0> (accessed Nov 9, 2026).
[^pn-m365-roles]: Microsoft Learn, "About admin roles in the Microsoft 365 admin center" (Message Center Privacy Reader; data privacy messages), <https://learn.microsoft.com/microsoft-365/admin/add-users/about-admin-roles> (accessed Nov 9, 2026).
[^pn-oci-cli]: Oracle, OCI CLI command reference, `oci announce announcements list` (`--compartment-id`, `--all`, `--should-show-only-latest-in-chain`), <https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/announce/announcements/list.html>, and the Python SDK's Announcement model (fields and enumerations), <https://docs.oracle.com/en-us/iaas/tools/python/latest/api/announcements_service/models/oci.announcements_service.models.Announcement.html> (accessed Nov 9, 2026).
[^pn-oci-get]: Oracle, OCI CLI command reference, `oci announce announcements get` (`--announcement-id`), <https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/announce/announcements/get.html> (accessed Nov 9, 2026).
[^pn-oci-policy]: Oracle, "Details for Announcements" (the `announcements` resource type; `inspect` lists, `read` adds the details), <https://docs.oracle.com/en-us/iaas/Content/Identity/Reference/announcementspolicyreference.htm>, and "Common Policies" (`Allow group AnnouncementReaders to read announcements in tenancy`), <https://docs.oracle.com/iaas/Content/Identity/Concepts/commonpolicies.htm> (accessed Nov 9, 2026).
[^pn-oci-gov]: Oracle, "Oracle US Government Cloud" (the Announcements API endpoints in us-langley-1 and us-luke-1), <https://docs.oracle.com/en-us/iaas/Content/General/Concepts/govfedramp.htm> (accessed Nov 9, 2026).
[^pn-aws-events]: AWS, AWS Health API Reference, "Event" (fields, `eventTypeCategory`, `statusCode`, `actionability`, `personas`), <https://docs.aws.amazon.com/health/latest/APIReference/API_Event.html>, and AWS CLI reference, `describe-events`, <https://docs.aws.amazon.com/cli/latest/reference/health/describe-events.html> (accessed Nov 9, 2026).
[^pn-aws-details]: AWS, AWS Health API Reference, "DescribeEventDetails" (1 to 10 event ARNs; `eventDescription.latestDescription`) and "AffectedEntity," <https://docs.aws.amazon.com/health/latest/APIReference/API_DescribeEventDetails.html> and <https://docs.aws.amazon.com/health/latest/APIReference/API_AffectedEntity.html> (accessed Nov 9, 2026).
[^pn-aws-plan]: AWS, AWS CLI reference, `health` (a Business, Enterprise On-Ramp or Enterprise Support plan; otherwise `SubscriptionRequiredException`), <https://docs.aws.amazon.com/cli/latest/reference/health/index.html> (accessed Nov 9, 2026).

[^pn-aws-plan-ug]: AWS, AWS Health User Guide, "Concepts for AWS Health", AWS Health API (a Business Support+, Enterprise Support or Unified Operations plan; otherwise `SubscriptionRequiredException`), <https://docs.aws.amazon.com/health/latest/ug/aws-health-concepts-and-terms.html#aws-health-api> (accessed Nov 9, 2026); and AWS GovCloud (US) User Guide, "AWS Health in AWS GovCloud (US)" (the API for Business or Enterprise support plan customers), <https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-health.html> (accessed Nov 9, 2026).
[^pn-aws-iam]: AWS, AWS Health User Guide, "Identity-based policy examples" (`health:Describe*`) and "AWS managed policies for AWS Health" (no read-only policy), <https://docs.aws.amazon.com/health/latest/ug/security_iam_id-based-policy-examples.html> and <https://docs.aws.amazon.com/health/latest/ug/security-iam-awsmanpol.html> (accessed Nov 9, 2026).
[^pn-aws-endpoints]: AWS, AWS Health User Guide, "Accessing the AWS Health API" (the active endpoint in us-east-1), <https://docs.aws.amazon.com/health/latest/ug/health-api.html> (accessed Nov 9, 2026).
[^pn-aws-gov]: AWS, AWS GovCloud (US) User Guide, "AWS Health" (a single regional endpoint in us-gov-west-1; EventBridge doesn't send public Service Health events), <https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-health.html> (accessed Nov 9, 2026).
[^pn-aws-eb]: AWS, Amazon EventBridge events reference, AWS Health (`source` `aws.health`, `detail-type` `AWS Health Event`), <https://docs.aws.amazon.com/eventbridge/latest/ref/events-ref-health.html> (accessed Nov 9, 2026).
[^pn-gcp-events]: Google Cloud, Personalized Service Health REST reference, `projects.locations.events.list` (`servicehealth.events.list`), <https://docs.cloud.google.com/service-health/docs/reference/rest/v1/projects.locations.events/list> (accessed Nov 9, 2026).
[^pn-gcp-event]: Google Cloud, Personalized Service Health REST reference, the Event resource (category `INCIDENT` only; states; impacts; updates), <https://docs.cloud.google.com/service-health/docs/reference/rest/v1/projects.locations.events> (accessed Nov 9, 2026).
[^pn-gcp-list]: Google Cloud, "List events" (enable `servicehealth.googleapis.com`), <https://docs.cloud.google.com/service-health/docs/list-events> (accessed Nov 9, 2026).
[^pn-gcp-gcloud]: Google Cloud, gcloud reference, `gcloud service-health events list`, <https://docs.cloud.google.com/sdk/gcloud/reference/service-health/events/list> (accessed Nov 9, 2026).
[^pn-gcp-iam]: Google Cloud, "Personalized Service Health roles and permissions" (`roles/servicehealth.viewer`), <https://docs.cloud.google.com/iam/docs/roles-permissions/servicehealth> (accessed Nov 9, 2026).
[^pn-gcp-aw]: Google Cloud, Assured Workloads, "Supported products" (Personalized Service Health's packages), <https://docs.cloud.google.com/assured-workloads/docs/supported-products> (accessed Nov 9, 2026).
[^pn-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0 (SA-9, SI-5, CM-3, CM-4, CP-2, SR-8, RA-3, CA-7, AU-9), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 9, 2026).
[^pn-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, indicator statements and "Related SP 800-53 Controls" by theme (supply chain risk, change management, recovery planning, monitoring, logging and auditing), <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (accessed Nov 9, 2026).
