---
title: "The Daily Checks on One Dashboard: An Implementation Guide"
description: "An implementation guide for putting the operator runbook's daily checks on one Azure Monitor workbook in the Sentinel Log Analytics workspace, one tab per check, with a link out to the built-in portal page where a check's data isn't in Log Analytics. What Azure and Microsoft 365 offer for dashboards, what each daily check can show and from which table, GCC availability source by source, then six steps: connect the sources, fill the settings and validate the template, plan with what-if, deploy to test and production, read it each morning, and keep the evidence. The workbook is a view, not evidence: the evidence stays in the stored records and tracked tasks the checks produce."
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
reviewed-sha256: bbd4d6979cbaed71d86038d95b59a077ad2adda286805ab2b40b26b5aeffb76b
last-reviewed: 2026-11-20
---
# The Daily Checks on One Dashboard: An Implementation Guide

*A dashboard is a picture of the evidence. This guide builds the picture for the operator's morning, and keeps the evidence where it already lives.*

::: {.callout-note}
## In this guide
How an agency on Microsoft 365 GCC (Moderate), with its Microsoft Sentinel workspace in commercial Azure, puts the daily checks of the operator runbook on one Azure Monitor workbook. First, how to read the guide, what Azure and Microsoft 365 offer for dashboards, which daily checks fit a workbook and from which table, government-cloud availability source by source, and the prerequisites as one access request. Then six steps: connect the sources, fill the settings and validate the template, plan the deployment with what-if, deploy to test and production, read the workbook each morning, and keep the evidence. Then the federal requirements and KSIs, the RACI, the dangers, the implementation checklist and what couldn't be verified.
:::

::: {.callout-tip}
## Watch, present or train
**Narrated deck (about 9 minutes, captions)**: why a dashboard is a picture of the evidence, what Azure and Microsoft 365 offer for dashboards, the twelve daily checks and the tab each one gets (the synchronization servers, the domain controllers and the request-driven admin changes among them), GCC availability source by source, the RACI, then the six steps from connecting the sources (the servers, the replication probe and its one Tier 0 right among them) to keeping the evidence, the requirements, the dangers and what couldn't be verified, as a Why / What / Who / How deck, on the [Presentations](../../presentations/index.md#guide-daily-checks-dashboard) page, or [▶ watch it in the browser](../../presentations/watch.html?v=Guide_Daily_Checks_Dashboard_Narrated). The deck says this guide has been reviewed and approved.
**Code:** the developer workbook [*Building the Daily Checks Workbook*](../../project-plans/developer-workbooks/daily-checks/index.md) builds the workbook template, its validator, the fixture renderer and the deployment in `examples/daily-checks-workbook`, with labs on fixtures and in a test subscription.
**Training:** the learning path [*The Daily Checks on One Dashboard*](../../training/daily-checks-dashboard/index.md) teaches this guide in two modules, each with a lab and a knowledge check.
:::

## How to read this guide {#how-to-read}

**Where this guide sits.** The daily checks are [Book 15, Chapter 12](../b15-day2-operations/12-the-day-two-runbook.md): the cadence table's four daily rows, the daily column of [the cadence by control family](../b15-day2-operations/12-the-day-two-runbook.md#the-cadence-by-control-family), the morning synchronization check (task 6), event-log handling (task 7) and [Entra Health monitoring](../b15-day2-operations/12-the-day-two-runbook.md#entra-health-monitoring-and-recommendations). That chapter says what each check proves, which control it supports and who does it; this guide doesn't repeat it. It answers one question the chapter leaves open: can the operator see all of the daily checks in one place each morning? Mostly yes, on one Azure Monitor workbook, with a link out to the portal that holds the data for the checks a workbook can't read.

**The rule this guide keeps.** [Book 12, Chapter 12](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md#what-an-assessor-verifies) says it plainly: "A dashboard is a picture of the evidence." [Book 15, Chapter 11](../b15-day2-operations/11-attestation-and-the-compliance-app.md#assessed-control-state-ca-2) says the same of tests: one that reads a dashboard tile "is a screenshot with a schedule." So the workbook is a view. Every tab says so. The evidence stays in the records each check already writes and the tasks each finding opens, and the kit refuses to record a rendered view as evidence (Step 6).

**Where the facts come from.** Every product fact, table, column, role and availability statement was read on Microsoft Learn on November 18 or 19, 2026, with the date in each note; facts the books already verified are cited by link to the chapter that holds them. The [verification log](https://github.com/WhalerMike/modernization-workbook/blob/main/docs/books/guides/_verification/daily-checks-dashboard-implementation.md) lists each claim with its source. Where Learn is silent, the guide says *not yet specified* and lists it under [What couldn't be verified](#what-couldnt-be-verified). The program's own positions are labeled *Design guidance*.

**The starting state the guide assumes.** A civilian agency at FedRAMP Moderate on Microsoft 365 GCC (Moderate), which uses the commercial Microsoft Entra ID service; Microsoft Sentinel on a Log Analytics workspace in commercial Azure ([Book 12](../b12-security-operations/index.md)); Entra ID, Intune and the Defender XDR connector sending their logs to that workspace; the operator runbook of Book 15, Chapter 12 in use; and an ITSM tool that holds the tasks. Examples use the fictional `contoso.example`.

<!-- labs:begin labs (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-tip}
## Labs for this guide
Every gate's hands-on work is a lab in the developer workbook [*Building the Daily Checks Workbook*](../../project-plans/developer-workbooks/daily-checks/index.md): Lab 1 on a laptop with the kit's fixtures, Lab 2 in a non-production environment. [The Labs page](../../training/labs.md#dc) lists them chapter by chapter, with what each needs and a direct link.
:::

<!-- labs:end -->

## Dashboards in Azure and Microsoft 365 {#options}

Microsoft's guidance on Azure Monitor visualizations compares the options. Workbooks "provide a flexible canvas for data analysis and the creation of rich visual reports" and can "tap into the most complete set of data sources from across Azure"; Azure portal dashboards give "a single pane of glass" and can combine Azure Monitor data with other Azure services, while "a workbook provides richer functionality"; Dashboards with Grafana is a preview "available in the Azure portal for no additional cost" for Azure data sources; Azure Managed Grafana is the choice for external data sources, private networking or managed identity authentication; and Power BI suits business reports and "long-term KPI" trends from imported log query results.[^dcg-best] Workbooks query Log Analytics workspaces, Azure Resource Graph, Azure Resource Manager, metrics and other sources,[^dcg-sources] and they can be created and managed as ARM templates.[^dcg-arm]

Microsoft 365 has no single customizable dashboard. Each admin center has its own built-in views: Microsoft 365 service health in the admin center, incidents and alerts in the Defender portal, Entra Health and Connect Health in the Entra admin center, reports in Intune and alerts in Purview. A custom view across them needs their logs in Log Analytics (or Sentinel), read by a workbook, or imported into Power BI.

| Option | Fits the daily checks? | Why |
|---|---|---|
| **Azure Monitor workbook** in the Sentinel workspace | **Yes: the design** | Reads every table the checks need; one tab per check; deployable and reviewable as a template |
| Azure portal dashboard | Partly | Pins tiles, but less of the logic a check needs |
| Dashboards with Grafana (preview) | Not yet | Preview; the workbook does the same from the same data |
| Azure Managed Grafana | No | Its advantages (external sources, private networking) aren't needed for this workspace |
| Power BI | For trends | The quarterly trend review, not the morning check |
| The admin centers' built-in views | Where the data stays there | Entra Health and the ITSM queue: the workbook links out to them |

*Design guidance:* one workbook, called "Daily checks", saved against the Sentinel workspace, one tab per daily check, and a link out to the built-in page where the data isn't in Log Analytics.

## What each daily check can show, and from where {#tabs}

This table is the home of the tab-by-tab design; the kit's [`config/manifest.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/daily-checks-workbook/config/manifest.json) carries the same rows, and its validator keeps the template equal to them.

| Tab | Daily check (Book 15, Chapter 12) | Source | Kind | Fit |
|---|---|---|---|---|
| Telemetry completeness | Telemetry-completeness check, network sources included | Every expected table's newest record (the chapter's harness query);[^dcg-b15] `SentinelHealth` connector failures[^dcg-health] | Workbook | Strong |
| Synchronization probe | Synchronization and service-health probe (task 6), with the synchronization servers' own errors and backup result | The probe's result in a custom table, `DailySyncProbe_CL`, written through the Logs Ingestion API;[^dcg-ingest] the servers' Application-log errors and warnings and their backup events in `Event`, and their agents' last heartbeat in `Heartbeat`, sent by the Azure Monitor Agent;[^dcg-ama-events][^dcg-t-heartbeat] link out to Connect Health[^dcg-connect] and Microsoft 365 service health | Workbook and link-out | Strong |
| Active Directory | Domain controllers while they remain Tier 0 ([Book 12, Chapter 03](../b12-security-operations/03-identity-telemetry.md#domain-controllers-while-they-remain-tier-0)); event-log handling (task 7); log review findings | Each domain controller's last heartbeat (`Heartbeat`);[^dcg-t-heartbeat] the replication probe's result in `DcReplicationProbe_CL` (`repadmin /showrepl * /csv` through the Logs Ingestion API);[^dcg-repadmin][^dcg-ingest] the High-rated security events Book 12, Chapter 03 lists, in `SecurityEvent` from the Windows Security Events via AMA connector;[^dcg-secevents] Directory Service, DFS Replication and DNS Server errors and the replication events Learn's troubleshooting articles name, in `Event`;[^dcg-ad-events] Defender for Identity alerts in `SecurityAlert`;[^dcg-xdr] link out to Connect Health for AD DS[^dcg-connect-adds] | Workbook and link-out | Good |
| Entra Health alerts | Entra Health alerts | None in Log Analytics: the alerts are in the Entra admin center, by e-mail and through Microsoft Graph beta[^dcg-entra-health] | Link-out | Link-out |
| Risky users and sign-ins | Risky-user and risky-sign-in triage | `AADRiskyUsers` (risk level and state per user) and `SigninLogs` (`RiskLevelDuringSignIn`, `RiskState`)[^dcg-t-risky][^dcg-t-signin] | Workbook | Strong |
| Emergency access sign-ins | Emergency access alert reviewed for any firing | `SigninLogs` by the accounts' object IDs, Microsoft's own query[^dcg-emergency] | Workbook | Strong |
| Noncompliant devices | Noncompliant-device queue | `IntuneDeviceComplianceOrg`, Intune's daily organizational compliance export[^dcg-t-intune][^dcg-intune] | Workbook and link-out | Good |
| Consents, roles and grants | Any consent, role or access grant with no ticket | `AuditLogs` by Learn's activity names[^dcg-t-audit][^dcg-activities] | Workbook | Partial: the match to a ticket stays in the ITSM tool |
| Admin changes | The request-driven tasks (tasks 1 to 5 and 8) matched to their tickets: password resets, authentication-method changes, accounts created, users updated by catalog scripts, custom role definitions; Azure role assignments | `AuditLogs` by Learn's activity names;[^dcg-activities-admin] `AzureActivity` role assignment and role definition writes from the subscription's activity log.[^dcg-t-azact][^dcg-rbac-alert] Consents and Entra role assignments stay on the grants tab | Workbook | Partial: the match to a ticket stays in the ITSM tool |
| DLP and label alerts | DLP and label-change alerts triaged | `SecurityAlert`; Defender XDR collects Purview DLP alerts and sends them through its connector[^dcg-xdr][^dcg-t-alert] | Workbook | Good |
| Catalog and remediation tasks | Catalog and remediation tasks | The ITSM tool's own queue and dashboards | Link-out | Weak |
| Log review queue | Log review findings (task 7) | `SecurityIncident`, open incidents[^dcg-t-incident] | Workbook | Partial: the queue only; the review stays a recorded procedure |

The three tabs added on November 19, 2026 replace two habits the runbook already rules out. The synchronization servers' and domain controllers' event logs go to the workspace through the Azure Monitor Agent, not to a file share written by a scheduled script (task 7: "an administrative share is never an evidence destination"), and the morning look at who reset what becomes one list to match against tickets. Each server and domain controller has its own row: one that stops sending shows up as a stale heartbeat, never as a quiet night.

Three things a tab can't do. A tab that shows nothing has only proved that its query returned nothing: if the table behind it stopped arriving, an empty queue looks exactly like a quiet night, which is why the telemetry tab comes first and why the kit's renderer shows such a tab as *stale*, never clear. A tab doesn't close anything: each finding still becomes a task with an owner. And a tab isn't the alert: the emergency access sign-in alert and the completeness alert are Azure Monitor alert rules, which Microsoft recommends for both.[^dcg-emergency][^dcg-health]

## GCC availability {#availability}

GCC (Moderate) uses the commercial Microsoft Entra ID service and pairs with commercial Azure, so the workspace, the workbook and the Logs Ingestion API are all in commercial Azure.

| Source or feature | GCC (Moderate), commercial Azure | Where Learn says it |
|---|---|---|
| Azure Monitor workbooks; Sentinel workbooks | Available: Sentinel workbooks are GA in Azure commercial | [^dcg-sentinel-clouds] |
| Entra diagnostic settings to the workspace (`SignInLogs`, `AuditLogs`, `RiskyUsers`, `UserRiskEvents`) | Available | [^dcg-entra-logs] |
| Intune diagnostic settings (`DeviceComplianceOrg`) | Available: Intune in GCC "is the same instance as Microsoft Intune in the commercial space" | [^dcg-intune-gov] |
| Defender XDR alerts and incidents in `SecurityAlert` and `SecurityIncident` | Available: GA for Commercial and GCC | [^dcg-xdr-clouds] |
| `SentinelHealth` and the Data collection health monitoring workbook | Available in commercial Azure, for the connectors Learn lists | [^dcg-health] |
| The Defender portal's *Data & connectors* Overview tab | Not assumed: a public preview "in commercial cloud environments," and Defender portal previews are commercial-cloud only | [^dcg-health][^dcg-sentinel-clouds] |
| Logs Ingestion API, for the sync probe's and the replication probe's tables | Available in commercial Azure | [^dcg-ingest] |
| Azure Monitor Agent on Azure Arc-enabled servers (synchronization servers, domain controllers), sending Windows event logs to `Event` and heartbeats to `Heartbeat` | Available in commercial Azure: Learn lists on-premises servers through Azure Arc | [^dcg-ama][^dcg-ama-events] |
| Windows Security Events via AMA connector (`SecurityEvent`) | Available: GA in Azure commercial | [^dcg-sentinel-clouds][^dcg-secevents] |
| Defender for Identity alerts in `SecurityAlert` | Available: GA for Commercial and GCC; Defender for Identity needs its own license (standalone, or in plans such as Microsoft 365 G5) | [^dcg-xdr-clouds][^dcg-mdi-gov] |
| Azure Activity connector, `AzureActivity` | Available: GA in Azure commercial | [^dcg-sentinel-clouds][^dcg-activity-log] |
| Microsoft 365 service health through Microsoft Graph (`ServiceHealth.Read.All`) | Available on the worldwide endpoint GCC uses; already read by the [provider notices kit](provider-notices-implementation.md), so the sync tab links out rather than store a second copy | [^dcg-graph-health] |
| Entra Health monitoring (preview) | *Not yet specified*: the tab links out | [^dcg-entra-health] |
| Microsoft Entra Connect Health, for sync and for AD DS | *Not yet specified*: the tabs link out | [^dcg-connect][^dcg-connect-adds] |

Where a source isn't available or isn't specified, the tab is a link out with the click path, never a tab that assumes the data.

## Prerequisites: the access request {#prerequisites}

**Owner:** security operations, who submit it with the change record. **Authority:** *Design guidance*, built on the roles Learn names in each note.

Steps 1 to 4 need the rights, the data sources and the values below. They are the same ones those steps name, collected in one place so the deployer can submit one request. The workbook is a read-only view: it changes no log data, alert rule or task, and deleting it removes only the view. Fill each `<placeholder>` at work and keep the filled copy inside the agency's boundary.

**1. Access rights.**

| # | Right | Scope | Who | Why | Duration |
|---|---|---|---|---|---|
| 1 | **Workbook Contributor** | The workbook's resource group only | Deployer | Save a shared workbook (`microsoft.insights/workbooks/write`)[^dcg-overview][^dcg-roles] | Deployment window only (test, then production) |
| 2 | **`Microsoft.Resources/deployments/*`** (a custom role, or an existing role that includes it) | Same resource group only | Deployer | Run the what-if preview and the deployment; what-if needs the same permissions as a deployment[^dcg-whatif] | Deployment window only |
| 3 | **Log Analytics Reader** | The Sentinel workspace | Deployer | The read-only reachability check[^dcg-la-access] | Deployment window only |
| 4 | **Workbook Reader** (or Monitoring Reader) | The workbook's resource group | Daily-check operators | Open the workbook[^dcg-roles] | Standing |
| 5 | Read access to the tables each tab reads (Log Analytics Reader, or resource-context or table-level access) | The Sentinel workspace | Daily-check operators | A workbook shows only what its reader can already query[^dcg-overview][^dcg-la-access] | Standing, per role |
| 6 | **Reports Reader** (Microsoft Entra) | The tenant | Daily-check operators | Open Entra Health monitoring from its link-out tab[^dcg-entra-health] | Standing |
| 7 | **Monitoring Metrics Publisher** | The sync probe's data collection rule | The probe's identity, not a person | Write the probe's result to `DailySyncProbe_CL`[^dcg-ingest] | Standing |
| 8 | **Monitoring Metrics Publisher** | The replication probe's data collection rule only | The replication probe's sending identity, not a person | Write `DcReplicationProbe_CL`[^dcg-ingest] | Standing |
| 9 | **Enterprise Admins, or equivalent**, on the host that runs `repadmin` | The forest | The replication probe's run-as identity: a Tier 0 identity on a Tier 0 host, never a lower-tier server | Learn names it as the minimum to read forest-wide replication status with `repadmin /showrepl * /csv`;[^dcg-repadmin] a narrower read right is *not yet specified* on Learn ([What couldn't be verified](#what-couldnt-be-verified)) | Standing, Tier 0 rules ([Book 04](../b04-access/04-privileged-roles-and-tiers.md)) |

Not requested: Global Administrator, Owner, Microsoft Sentinel Contributor, or any write access to the workspace's data. Row 9 is the one Tier 0 right in the request: the agency's Tier 0 owner decides whether the probe runs at all, or whether the tab reads replication only from the Directory Service events and Connect Health for AD DS. Grant rows 1 to 3 through PIM for the deployment window, as [Chapter 04](../../project-plans/developer-workbooks/daily-checks/04-deploying-to-test-and-production.md#before-you-start) of the developer workbook says.

**2. One-time setup, only where it isn't already in place.** Step 1 gives each item in full.

| # | Item | Who, with which role | Done when |
|---|---|---|---|
| 1 | The Entra diagnostic setting sends `SignInLogs`, `AuditLogs`, `RiskyUsers` and `UserRiskEvents` to the workspace | Security Administrator[^dcg-entra-logs] | `SigninLogs`, `AuditLogs` and `AADRiskyUsers` hold records from the last hour |
| 2 | Intune **Reports** > **Diagnostics settings** sends **DeviceComplianceOrg** to the workspace | Intune Service Administrator, with Log Analytics Contributor on the workspace[^dcg-intune] | `IntuneDeviceComplianceOrg` holds records from the last 48 hours |
| 3 | The Defender XDR connector brings incidents and alerts, Purview DLP alerts among them | The workspace's Sentinel owner; nothing new requested[^dcg-xdr] | `SecurityIncident` and `SecurityAlert` hold recent records |
| 4 | **Auditing and health monitoring** is on in Sentinel's settings, and the **Data collection health monitoring** workbook is installed | The workspace's Sentinel owner; nothing new requested[^dcg-health][^dcg-enable-health] | `_SentinelHealth() \| take 20` returns records |
| 5 | The custom table `DailySyncProbe_CL` and its data collection rule | Contributor rights on the workspace for the table; Monitoring Contributor on the resource group for the rule, once[^dcg-ingest-tutorial][^dcg-dcr-perms] | The probe writes one row each morning |
| 6 | The synchronization servers and domain controllers are Azure Arc-enabled, with the Azure Monitor Agent | Azure Connected Machine Onboarding (or Contributor) on the resource group for onboarding;[^dcg-arc-onboard] the server's Tier 0 administrator runs it | Each server appears in `Heartbeat` |
| 7 | A data collection rule for Windows events: the synchronization servers' Application log (errors, warnings and the backup's events), and the domain controllers' Directory Service, DFS Replication and DNS Server logs, associated with those servers | Monitoring Contributor, which creates rules and associates them with machines[^dcg-dcr-perms][^dcg-ama-events] | `Event` holds records from each server in the last day |
| 8 | The Windows Security Events via AMA connector for the domain controllers, with an event set (or a custom XPath set) that includes the events Book 12, Chapter 03 lists | The workspace's Sentinel owner; Monitoring Contributor for the rule[^dcg-secevents] | `SecurityEvent` holds records from each domain controller in the last hour |
| 9 | The subscription's activity log sent to the workspace (a diagnostic setting, or the Azure Activity connector) | The subscription's owner of diagnostic settings[^dcg-activity-log] | `AzureActivity` holds records from the last day |
| 10 | The custom table `DcReplicationProbe_CL`, its data collection rule, and a scheduled task that runs the kit's replication probe each morning | As item 5; the task on a Tier 0 host under access row 9 | The probe writes one row per replication link each morning |

**3. Values for the settings file,** one file per environment, from the kit's `deploy/settings.template.json` (Step 2).

| Setting | Where it comes from |
|---|---|
| `tenantId`, `subscriptionId`, `resourceGroup`, `location` | The tenant, and the subscription and resource group that will hold the workbook |
| `workspaceResourceId`, `workspaceCustomerId` | The Log Analytics workspace's **Properties** |
| `emergencyAccessObjectIds` | The emergency access accounts' object IDs, not their names |
| `compliantStateValue` | `IntuneDeviceComplianceOrg \| where TimeGenerated > ago(7d) \| distinct ComplianceState`, run in the workspace; take the value that means compliant |
| `dlpProductNames` | `SecurityAlert \| where TimeGenerated > ago(30d) \| distinct ProductName`, run in the workspace; take the values of Purview DLP and sensitivity label alerts |
| `itsmQueueUrl` | The ITSM queue that holds the catalog and remediation tasks |
| `syncServers`, `domainControllers` | `Heartbeat \| where TimeGenerated > ago(1d) \| distinct Computer`, run in the workspace; take the names exactly as the `Computer` column records them |
| `syncEventSources`, `backupEventSources` | `Event \| where TimeGenerated > ago(7d) and Computer in (<sync-server-names>) \| distinct Source`, run in the workspace; take the synchronization service's sources and the backup's (Windows Server Backup logs as `Microsoft-Windows-Backup`[^dcg-backup-event]) |
| `identityAlertProductNames` | `SecurityAlert \| where TimeGenerated > ago(30d) \| distinct ProductName`, run in the workspace; take the value of Defender for Identity alerts |
| `replicationIngestionEndpoint`, `replicationDcrImmutableId`, `replicationStreamName` | The replication probe's data collection rule: its logs ingestion endpoint (JSON view) and immutable ID (Overview), and the stream, `Custom-DcReplicationProbe_CL`[^dcg-ingest] |
| `outputRoot`, `evidencePath`, `changeRecord` | Agency storage outside any repository, and the change record |

Learn documents the `ComplianceState`, `ProductName`, `Computer` and `Source` columns, not their values, so those come from the agency's own workspace ([What couldn't be verified](#what-couldnt-be-verified)). The kit's [Copilot prompts](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/daily-checks-workbook/copilot-prompts.md) help pick them at work.

**4. Other items.**

| # | Item | Notes |
|---|---|---|
| 1 | A change record with a second approver | The approver reads the plan and the what-if result and records the plan's SHA-256 (Step 3) |
| 2 | A test subscription and workspace | Test first; the kit refuses production without the test stage's evidence (Step 4) |
| 3 | Workstation tools | PowerShell 7; the Azure CLI with its `log-analytics` extension, signed in to commercial Azure (`AzureCloud`); Pester 5 for the kit's tests |
| 4 | Evidence storage | An agency folder for the plan, what-if, deployment and reachability records (Step 6) |
| 5 | A rollback | Redeploy the previous approved plan, or delete the workbook; no data is affected (Step 4) |

## Step 1: Connect the sources {#step-1}

**Owner:** security operations (the workspace and the activity log), identity engineering (Entra, the sync probe and the synchronization servers), the endpoint platform owner (Intune), the Tier 0 owner (the domain controllers and the replication probe). **Authority:** *Design guidance*, except where noted.

1. **Entra ID.** A diagnostic setting sends `SignInLogs`, `AuditLogs`, `RiskyUsers` and `UserRiskEvents` to the workspace; creating or editing one needs Security Administrator.[^dcg-entra-logs] [Book 12, Chapter 03](../b12-security-operations/03-identity-telemetry.md) holds the program's setting and its command.
2. **Intune.** In the Intune admin center, **Reports** > **Diagnostics settings**, send **DeviceComplianceOrg** to the workspace, as Intune Service Administrator with Log Analytics Contributor on the workspace. The export runs once every 24 hours and can take up to 48 hours to arrive, and the pipeline can duplicate data, so the tab reads the latest row per device and its freshness limit is 48 hours.[^dcg-intune] [Book 05, Chapter 10](../b05-devices/10-operating-and-evidencing-the-fleet.md#what-log-analytics-receives-and-when) already says this for the program.
3. **Defender XDR.** The Defender XDR connector brings incidents and alerts, including those Defender XDR collects from Purview DLP and ID Protection, into `SecurityIncident` and `SecurityAlert`, at no ingestion charge.[^dcg-xdr]
4. **Sentinel health.** Turn on health monitoring for the workspace, so `SentinelHealth` records connector health for the connectors that support it (among them Office 365 and Defender for Endpoint), and install the **Data collection health monitoring** workbook from the Content hub.[^dcg-health]
5. **The synchronization probe's table.** Create a custom table, `DailySyncProbe_CL`, with a data collection rule, and grant the probe's identity **Monitoring Metrics Publisher** on the rule; the probe of task 6 then sends its result through the Logs Ingestion API.[^dcg-ingest] The columns are the probe's own fields: `SyncEnabled`, `LastSyncUtc`, `AgeMinutes`, `SyncLate`, `ConflictCount` and `Verdict`. [Book 12, Chapter 06](../b12-security-operations/06-vulnerability-management.md#keeping-the-history) uses the same API for the vulnerability summary.
6. **The synchronization servers and domain controllers.** Arc-enable each server and install the Azure Monitor Agent, which collects "according to data collection rules (DCRs) associated with the agent";[^dcg-ama] one rule sends the Windows event logs to the `Event` table.[^dcg-ama-events] On the synchronization servers, collect the Application log's errors and warnings and the backup's events: Learn doesn't list the synchronization service's run-profile event IDs, so the tab keeps every error and warning from the sources the settings name. [Book 12, Chapter 03](../b12-security-operations/03-identity-telemetry.md#the-entra-connect-server) already forwards the same log for Entra Connect's admin actions, and [Book 15, Chapter 12](../b15-day2-operations/12-the-day-two-runbook.md#entra-connect-sync-server-checks) keeps the configuration export as the backup of the synchronization policy; the nightly server backup's result is the event this tab reads. On the domain controllers, collect the Directory Service, DFS Replication and DNS Server logs, and turn on the Windows Security Events via AMA connector, which writes to `SecurityEvent`; a Security log collected by an ordinary rule goes to `Event` instead.[^dcg-ama-events][^dcg-secevents] This replaces any script that copies event logs to a file share ([task 7](../b15-day2-operations/12-the-day-two-runbook.md#event-log-handling)).
7. **The replication probe.** Create `DcReplicationProbe_CL` and its rule as in item 5. The kit's `Invoke-DcReplicationProbe.ps1` runs `repadmin /showrepl * /csv`, whose output carries each link's last success, last failure and last failure status,[^dcg-repadmin] writes one record per link with a verdict (failing when the last status isn't 0), and with `-Send` posts them to the Logs Ingestion API.[^dcg-ingest-code] It reads and changes nothing in the directory, but Learn names Enterprise Admins or equivalent for that read, so it runs as a Tier 0 identity on a Tier 0 host (access row 9). `dcdiag` "must be ran with administrative rights",[^dcg-dcdiag] and Learn doesn't document its output format, so the probe doesn't parse it; Connect Health for AD DS shows replication status and alerts in the admin center as a link-out.[^dcg-connect-adds]
8. **The activity log.** Send the subscription's activity log to the workspace, where it's stored in `AzureActivity`.[^dcg-activity-log] The admin changes tab reads role assignment and custom role writes from it, as Learn's alert on privileged Azure role assignments does.[^dcg-rbac-alert]

**Validate.** The kit's read-only reachability check asks the workspace, for every table a tab reads, for its newest record and count, and reports each as Delivering, Late or Missing ([Chapter 03, Lab 2](../../project-plans/developer-workbooks/daily-checks/03-what-each-tab-would-show.md#lab-2-a-test-workspace)). It needs Log Analytics Reader on the workspace, which can "view and search all monitoring data."[^dcg-la-access]

## Step 2: Fill the settings and validate the template {#step-2}

**Owner:** security operations. **Authority:** *Design guidance*.

1. **Fill one settings file per environment** from the kit's `deploy/settings.template.json`: tenant, subscription, resource group, the workspace's resource ID and customer ID, the emergency access accounts' object IDs, the `ComplianceState` value your workspace records for a compliant device, the `ProductName` values of DLP and label alerts in `SecurityAlert`, and the ITSM queue's address. These values go into the deployed workbook's parameters, never into the template, and the filled file stays inside the agency's boundary.
2. **Check the two values the kit can't know.** Book 05, Chapter 10 warns not to hard-code compliance state strings; read the distinct `ComplianceState` and `ProductName` values in your own workspace and put them in the settings.
3. **Validate the template.** The kit's validator checks the gallery template against the manifest, DC-V-01 to DC-V-10: one tab per daily check, each query's tables and look-back, every query scoped to the `{Workspace}` parameter, the not-evidence banner and the link-outs on every tab, the telemetry list equal to the manifest's, and no GUIDs, subscription paths, e-mail addresses or secrets ([Chapter 02](../../project-plans/developer-workbooks/daily-checks/02-the-workbook-template-and-its-validator.md)). Microsoft's own guidance on exported templates is to "mask out any embedded sensitive values," because an export often embeds the subscription and resource group.[^dcg-arm]

**Validate.** `Test-DcWorkbook.ps1` reports every check passing; a copy edited in the portal and exported from the **Advanced Editor**'s **Gallery Template** tab passes the same checks before it replaces the committed template.

## Step 3: Plan the deployment and preview it {#step-3}

**Owner:** security operations, with a second person approving. **Authority:** *Microsoft-recommended* (what-if before deploying); otherwise *Design guidance*.

1. **Plan.** The kit writes the ARM parameters (the template with this environment's workspace and parameter values), the what-if and create commands, and a plan file with its SHA-256. The resource is `Microsoft.Insights/workbooks`, API version 2023-06-01, `kind` `shared`, with `serializedData`, `displayName`, `category` and `sourceId`.[^dcg-ref] The kit sets `sourceId` to the workspace, so the workbook shows under that workspace's **Workbooks**,[^dcg-arm] and names the resource with a GUID derived from the resource group and display name, so a redeploy updates the same workbook; what-if can't evaluate `newGuid()`.[^dcg-whatif]
2. **Preview with what-if.** `az deployment group what-if` predicts the changes "if the specified Bicep file is deployed" and changes nothing; it has the same permission requirements as a deployment.[^dcg-whatif] The plan records each predicted change; a first deployment shows one **Create**.
3. **Approve.** A second person reads the plan and the what-if result and approves the plan's SHA-256 in the change record.

**Validate.** The plan shows only a create or modify of one `Microsoft.Insights/workbooks` resource and no delete; the kit refuses to deploy a plan whose what-if shows a delete, or a plan with no what-if.

## Step 4: Deploy to test, then production {#step-4}

**Owner:** security operations. **Authority:** *Design guidance*.

1. **Least privilege.** To save a shared workbook a person needs `microsoft.insights/workbooks/write`, which the **Workbook Contributor** role grants;[^dcg-overview][^dcg-roles] to deploy through Resource Manager they also need `Microsoft.Resources/deployments/*`.[^dcg-whatif] Grant both on the workbook's resource group only, for the deployment. The [access request](#prerequisites) lists every right in one table. Readers of the workbook need **Workbook Reader** (or Monitoring Reader) and read access to the data each query reads; a workbook shows only what its reader can already query.[^dcg-overview][^dcg-roles][^dcg-la-access]
2. **Test.** Preflight (PF-01 to PF-06), plan with what-if, deploy the approved plan, open the workbook and run the reachability check. The [runbook](../../project-plans/developer-workbooks/daily-checks/04-deploying-to-test-and-production.md) gives every command.
3. **Go or no-go.** The test stage's evidence holds a passing live record for the preflight, the validation, the plan, the deployment and the reachability check.
4. **Production.** The same commands with the production settings file; the preflight refuses production without the test stage's evidence.

**Rollback.** Redeploy the previous approved plan, or delete the workbook. Deleting it removes a view only: no log data, alert rule or task changes.

## Step 5: Read it each morning {#step-5}

**Owner:** the operator for each family, as Book 15, Chapter 12's [Who does it](../b15-day2-operations/12-the-day-two-runbook.md#who-does-it) assigns. **Authority:** *Design guidance*.

1. **Telemetry completeness first.** A dark source makes every tab that reads it unreliable. Each dark source opens a high-severity task; the completeness alert rule, not the tab, is the record.
2. **Then each tab in turn.** Each row that needs work becomes, or is matched to, a task with an owner. Dismissals and closures carry their reason in the task, not in the workbook.
3. **Link-out tabs.** Open Entra Health and the ITSM queue from their tabs and work them there.
4. **What the workbook never does.** It doesn't close a task, page anyone or prove a check happened. The checks' own records do that ([Book 15, Chapter 11](../b15-day2-operations/11-attestation-and-the-compliance-app.md#the-evidence-and-continuous-monitoring-pipeline)).

**Validate.** The kit's renderer, run on saved query results, prints what each tab would show; on the fixtures, a morning when the Entra diagnostic setting has stopped shows the risk and emergency access tabs as stale, not clear ([Chapter 03](../../project-plans/developer-workbooks/daily-checks/03-what-each-tab-would-show.md)).

## Step 6: Keep the evidence {#step-6}

**Owner:** the ISSO. **Authority:** *Design guidance*.

1. **What is recorded.** The kit records the template's validation, the preflight, the plan and its what-if, the deployment, the reachability check and the rollback plan, each as a timestamped record with its controls and KSIs, the SHA-256 of every file and of the record before it.
2. **What is not.** A rendered view. `Invoke-DcEvidence.ps1` refuses one: "A rendered view is not evidence."
3. **Drift.** When someone edits the workbook in the portal, export its gallery template, validate it, and replace the committed template through a reviewed change; a redeploy of the approved plan puts the reviewed version back.

**Validate.** `Invoke-DcEvidence.ps1 -Check -Stage test` passes: every file matches `SHA256SUMS`, the chain is unbroken, and every step the stage needs has a passing live record.

## Federal requirements and KSIs, by step {#requirements}

The workbook supports the monitoring the daily checks already do; it doesn't add a control. NIST SP 800-53 Rev. 5 leaves monitoring frequencies to the organization (CA-7), and Book 15, Chapter 12 [maps each daily check](../b15-day2-operations/12-the-day-two-runbook.md#the-runbook-at-a-glance) to its own controls: CA-7 and SI-4 for the probe and the completeness check, AU-6 for log review, AC-2, IA-5 and CM-3 for the tasks.

| Step | What the kit's record shows | NIST SP 800-53 Rev 5 | KSIs |
|---|---|---|---|
| 2: Validate | The template matches the manifest and carries no IDs | CM-2, CM-3 | KSI-SVC-ACM, KSI-CMT-LMC |
| 4: Preflight | Settings, cloud, sign-in and scope were right | AC-6, CM-6 | KSI-IAM-ELP, KSI-SVC-ACM |
| 3: Plan and what-if | The change was previewed and approved by hash | CM-3, CM-4 | KSI-CMT-LMC, KSI-CMT-RVP |
| 4: Deploy | The approved plan, and only it, was deployed | CM-3, CM-2 | KSI-CMT-LMC, KSI-SVC-ACM |
| 1, 4: Reachability | Each tab's tables answer, and how fresh they are | CA-7, SI-4 | KSI-MLA-EVC, KSI-MLA-LET |
| 4: Rollback plan | The way back was written before the change | CM-3, CP-2 | KSI-CMT-LMC, KSI-RPL-ARP |
| 1: Replication probe | Every replication link's last result, sent to the workspace | CA-7, SI-4 | KSI-MLA-EVC, KSI-MLA-LET |
| 6: Evidence | The records are hashed and chained | CA-7, AU-9 | KSI-MLA-EVC, KSI-MLA-OSM |

Each control-to-KSI pair reuses one the [Azure Security Engineering guide](azure-security-implementation.md#requirements) verified on fedramp.gov's 2026 KSI pages. The records support these controls; the agency's assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with what its providers report against them and doesn't report KSIs itself.

**Where agencies are.** *Design guidance, from the program's experience:* the daily checks are usually done one portal at a time, and what was checked is recorded in an e-mail or not at all, which is the ungoverned shape [task 6](../b15-day2-operations/12-the-day-two-runbook.md#the-morning-synchronization-check) describes. Workbooks are common in Sentinel workspaces, but saved by hand, unreviewed and edited in place, with workspace IDs embedded. The risk this guide guards against is the opposite of no dashboard: a green dashboard taken as proof.

## RACI {#raci}

R = does it; A = accountable; C = consulted; I = informed. The roles are Book 15, Chapter 10's.

| Activity | Security operations | Identity engineering | Endpoint platform owner | ISSO | Operators |
|---|---|---|---|---|---|
| Sources connected (Step 1) | A, R (workspace, Sentinel) | R (Entra, probe) | R (Intune) | I | I |
| Settings and template (Step 2) | A, R | C (object IDs) | C (state values) | I | C |
| Plan, approval and deployment (Steps 3, 4) | A, R | I | I | C (approves the plan in the change record) | I |
| The morning read (Step 5) | A for telemetry | R for identity tabs | R for devices | I | R for their family |
| Evidence (Step 6) | R | I | I | A | I |

## Dangers and how to avoid them {#dangers}

| Danger | What happens | The guard |
|---|---|---|
| A dashboard taken as evidence | Screenshots of green tiles go into the package; nothing shows the checks happened | The banner on every tab; the kit refuses to record a render; the evidence is the checks' own records |
| A missing connector looks healthy | A table stops arriving and every tab over it shows an empty, calm queue | The telemetry tab first; the renderer shows STALE, never CLEAR, over a stale source; the completeness alert rule |
| Stale tiles | Intune's export is a day or two old and is read as live | Each tab states its source's cadence; the devices tab's limit is 48 hours |
| IDs in the template | An exported template carries the subscription, resource group and workspace into a repository | DC-V-10; the plan fills IDs per environment; filled settings stay at work |
| A workbook edited in place | The portal copy drifts from the reviewed one, unnoticed | Export, validate, replace through review; redeploy the approved plan |
| A deployment that deletes | A complete-mode template or wrong scope removes resources | The plan refuses any Delete in its what-if |
| A broad reader | Someone is given workspace-wide read to see one tab | A workbook shows only what its reader can query; grant data access per role[^dcg-la-access] |
| A silent server read as a quiet one | A synchronization server or domain controller stops sending and its tab shows no errors | A row per server from the settings list, flagged when its heartbeat is past an hour; a missing backup event is flagged too |
| A Tier 0 probe on a lower tier | The replication probe's Enterprise Admins identity runs on an ordinary server | Run it only on a Tier 0 host as a Tier 0 identity, or don't run it and read the Directory Service events and Connect Health instead |
| Two copies of one check | Entra role assignments shown on both the grants and admin changes tabs, worked twice or by neither owner | Consents and Entra role assignments are on the grants tab only; a test keeps them off the admin changes query |
| A preview assumed in GCC | A tab is built on the Defender portal's preview overview or Entra Health data | Link-out tabs for anything not available or not specified in GCC |

## Implementation checklist {#checklist}

- [ ] Entra, Intune and Defender XDR logs reach the workspace; health monitoring is on; the probe writes `DailySyncProbe_CL`.
- [ ] Every synchronization server and domain controller is in `Heartbeat`; their event logs reach `Event`, the domain controllers' security events reach `SecurityEvent`, and no script writes event logs to a share.
- [ ] The activity log reaches `AzureActivity`; the Tier 0 owner has decided on the replication probe, and where it runs it writes `DcReplicationProbe_CL` from a Tier 0 host.
- [ ] The reachability check shows every table Delivering in the test workspace.
- [ ] One settings file per environment, filled at work, with the workspace's own `ComplianceState` and `ProductName` values.
- [ ] The template passes DC-V-01 to DC-V-10.
- [ ] The plan's what-if shows one workbook created or modified and nothing deleted; a second person approved its SHA-256.
- [ ] Deployers hold Workbook Contributor and deployment rights on the resource group only; readers hold Workbook Reader and their own data access.
- [ ] The test stage's evidence passes before production.
- [ ] Operators read the telemetry tab first, and every finding becomes a task.
- [ ] No rendered view or screenshot is in the evidence package.

## What couldn't be verified {#what-couldnt-be-verified}

- **The workbook item schema.** Learn documents the ARM resource and shows sample `serializedData`, but not every field of the Notebook/1.0 item format (tabs, groups, parameter types). The kit follows the shape the portal's Advanced Editor exports; [Chapter 02's Lab 2](../../project-plans/developer-workbooks/daily-checks/02-the-workbook-template-and-its-validator.md#lab-2-a-test-workspace) round-trips it through the portal.
- **GCC availability of Entra Health monitoring and Connect Health:** not yet specified on the pages read; both are link-outs.
- **The `ProductName` values of DLP and label alerts in `SecurityAlert`, and Intune's `ComplianceState` values:** Learn documents the columns, not their values; the settings file holds them, read from the agency's own workspace.
- **The synchronization service's event IDs and sources.** Learn's ADSync PowerShell reference documents `Get-ADSyncRunProfileResult` but not its output fields, and no Learn page lists the run-profile events in the Application log;[^dcg-adsync] the tab keeps every error and warning from the sources the settings name, read from the agency's own workspace. Windows Server Backup's success event ID isn't on Learn either; its failure event 517 is.[^dcg-backup-event]
- **The event log names `DFS Replication` and `DNS Server`** as the `EventLog` column records them: Learn's articles say "the DFSR log" and "the DNS event log". The query filters by event ID and level, not by log name, and Lab 2 confirms the names for the collection rule.
- **A read right narrower than Enterprise Admins for `repadmin /showrepl * /csv`, and `dcdiag`'s output format:** not on Learn; the probe needs Tier 0 rights and doesn't parse `dcdiag`. The repadmin CSV's `Destination DSA`, `Naming Context` and `Number of Failures` columns are the tool's own header; Learn's article names `Source DSA`, `Last Success Time`, `Last Failure Time` and `Last Failure Status`.[^dcg-repadmin]
- **Whether every High-rated event is in the connector's Common set:** the guide asks for an event set or custom XPath that includes them; Lab 2 confirms.
- **Portal click paths** for the link-outs other than Entra Health and the Sentinel workbook: not read on Learn for this guide; Lab 2 confirms them.

## Back to the books

- [Book 15, Chapter 12: The Day-Two Operator Runbook and Validation](../b15-day2-operations/12-the-day-two-runbook.md)
- [Book 15, Chapter 11: Attestation, Evidence and the Compliance Application](../b15-day2-operations/11-attestation-and-the-compliance-app.md)
- [Book 12, Chapter 12: Evidence, Metrics and Continuous Monitoring](../b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md)
- [Book 12, Chapter 03: Identity telemetry](../b12-security-operations/03-identity-telemetry.md)
- [Book 05, Chapter 10: Operating and evidencing the fleet](../b05-devices/10-operating-and-evidencing-the-fleet.md#what-log-analytics-receives-and-when)

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

This guide has not been published in an edition yet. Each edition is kept, with its Word editions, decks and videos, on the [Archive](../../about/archive.md) page. Every change so far is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/daily-checks-dashboard-implementation.md).

<!-- revisions:end -->

[^dcg-best]: Microsoft Learn, "Azure Monitor best practices - Analysis and visualizations" (Azure workbooks, Grafana: Dashboards with Grafana (preview) and Azure Managed Grafana, Azure dashboards, Power BI), <https://learn.microsoft.com/azure/azure-monitor/visualize/best-practices-visualize> (accessed Nov 18, 2026).
[^dcg-sources]: Microsoft Learn, "Azure Workbooks data sources," <https://learn.microsoft.com/azure/azure-monitor/visualize/workbooks-data-sources> (accessed Nov 18, 2026).
[^dcg-arm]: Microsoft Learn, "Azure Monitor workbooks and Azure Resource Manager templates" (the Gallery Template and ARM template tabs of the Advanced Editor; `workbookSourceId`; `kind` shared; "mask out any embedded sensitive values"), <https://learn.microsoft.com/azure/azure-monitor/visualize/workbooks-automate> (accessed Nov 18, 2026).
[^dcg-ref]: Microsoft Learn, "Microsoft.Insights/workbooks - Bicep, ARM template & Terraform AzAPI reference," API version 2023-06-01 (`kind`: "Only valid value is shared"; `category`, `displayName` and `serializedData` required; `version` "like 'Notebook/1.0'"), <https://learn.microsoft.com/azure/templates/microsoft.insights/workbooks> (accessed Nov 18, 2026).
[^dcg-whatif]: Microsoft Learn, "Bicep What-If: Preview Changes Before Deployment" (`az deployment group what-if`; `--no-pretty-print`; same permissions as a deployment, `Microsoft.Resources/deployments/*`; change types; `newGuid()` not evaluated), <https://learn.microsoft.com/azure/azure-resource-manager/bicep/deploy-what-if> (accessed Nov 18, 2026).
[^dcg-overview]: Microsoft Learn, "Azure Workbooks overview," Access control (Monitoring Reader, Monitoring Contributor, `microsoft.insights/workbooks/write`), <https://learn.microsoft.com/azure/azure-monitor/visualize/workbooks-overview> (accessed Nov 18, 2026).
[^dcg-roles]: Microsoft Learn, "Azure built-in roles for Monitor," Workbook Contributor ("Can save shared workbooks") and Workbook Reader ("Can read workbooks"), <https://learn.microsoft.com/azure/role-based-access-control/built-in-roles/monitor> (accessed Nov 18, 2026).
[^dcg-la-access]: Microsoft Learn, "Manage access to Log Analytics workspaces," Log Analytics Reader and access modes, <https://learn.microsoft.com/azure/azure-monitor/logs/manage-access> (accessed Nov 18, 2026).
[^dcg-b15]: [Book 15, Chapter 12, The telemetry-completeness check](../b15-day2-operations/12-the-day-two-runbook.md#the-telemetry-completeness-check), whose `union isfuzzy=true` pattern the kit's query keeps.
[^dcg-health]: Microsoft Learn, "Monitor the health of your Microsoft Sentinel data connectors" (the Data & connectors Overview tab, public preview in commercial cloud environments; the Data collection health monitoring workbook; `SentinelHealth`, supported connectors, the latest-failure query; Azure Monitor alert rules recommended), <https://learn.microsoft.com/azure/sentinel/monitor-data-connector-health> (accessed Nov 18, 2026).
[^dcg-ingest]: Microsoft Learn, "Logs Ingestion API in Azure Monitor" (custom tables ending `_CL`; a data collection rule; Monitoring Metrics Publisher on the rule; Microsoft Entra authentication), <https://learn.microsoft.com/azure/azure-monitor/logs/logs-ingestion-api-overview> (accessed Nov 18, 2026).
[^dcg-connect]: Microsoft Learn, "What is Microsoft Entra Connect and Connect Health" (alerts, synchronization errors and service information in the Microsoft Entra admin center; Microsoft Entra ID P1), <https://learn.microsoft.com/entra/identity/hybrid/connect/whatis-azure-ad-connect> (accessed Nov 18, 2026).
[^dcg-entra-health]: Microsoft Learn, "Learn about Microsoft Entra Health monitoring" (preview; signals and alerts in the Microsoft Entra admin center; e-mail notifications; Reports Reader), <https://learn.microsoft.com/entra/identity/monitoring-health/concept-microsoft-entra-health> (accessed Nov 18, 2026); Book 15, Chapter 12 holds the Graph beta read.
[^dcg-t-risky]: Microsoft Learn, Azure Monitor Logs reference, "AADRiskyUsers," <https://learn.microsoft.com/azure/azure-monitor/reference/tables/aadriskyusers> (accessed Nov 18, 2026).
[^dcg-t-signin]: Microsoft Learn, Azure Monitor Logs reference, "SigninLogs," <https://learn.microsoft.com/azure/azure-monitor/reference/tables/signinlogs> (accessed Nov 18, 2026).
[^dcg-emergency]: Microsoft Learn, "Manage emergency access admin accounts," Monitor sign-in and audit logs (the `SigninLogs` query by `UserId`; an Azure Monitor alert rule; validate at least every 90 days), <https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access> (accessed Nov 18, 2026).
[^dcg-t-intune]: Microsoft Learn, Azure Monitor Logs reference, "IntuneDeviceComplianceOrg," <https://learn.microsoft.com/azure/azure-monitor/reference/tables/intunedevicecomplianceorg> (accessed Nov 18, 2026).
[^dcg-intune]: Microsoft Learn, "Route logs to Azure Monitor using Microsoft Intune" (Reports > Diagnostics settings; DeviceComplianceOrg; Intune Service Administrator and Log Analytics Contributor; exported once every 24 hours, up to 48 hours; duplicate data), <https://learn.microsoft.com/intune/governance/integrate-azure-monitor> (accessed Nov 18, 2026).
[^dcg-t-audit]: Microsoft Learn, Azure Monitor Logs reference, "AuditLogs," <https://learn.microsoft.com/azure/azure-monitor/reference/tables/auditlogs> (accessed Nov 18, 2026).
[^dcg-activities]: Microsoft Learn, "Microsoft Entra audit log activity reference" ("Consent to application," "Add delegated permission grant," "Add app role assignment to service principal," "Add member to role," "Add eligible member to role"), <https://learn.microsoft.com/entra/identity/monitoring-health/reference-audit-activities> (accessed Nov 18, 2026).
[^dcg-xdr]: Microsoft Learn, "Microsoft Defender XDR integration with Microsoft Sentinel" (services whose alerts Defender XDR collects include Microsoft Purview Data Loss Prevention and Microsoft Entra ID Protection; `SecurityAlert` and `SecurityIncident` ingested at no charge), <https://learn.microsoft.com/azure/sentinel/microsoft-365-defender-sentinel-integration> (accessed Nov 18, 2026).
[^dcg-t-alert]: Microsoft Learn, Azure Monitor Logs reference, "SecurityAlert," <https://learn.microsoft.com/azure/azure-monitor/reference/tables/securityalert> (accessed Nov 18, 2026).
[^dcg-t-incident]: Microsoft Learn, Azure Monitor Logs reference, "SecurityIncident," <https://learn.microsoft.com/azure/azure-monitor/reference/tables/securityincident> (accessed Nov 18, 2026).
[^dcg-sentinel-clouds]: Microsoft Learn, "Microsoft Sentinel feature support for Azure commercial/other clouds" (Workbooks GA in Azure commercial; in the Defender portal, features in preview are available only in the commercial cloud), <https://learn.microsoft.com/azure/sentinel/feature-availability> (accessed Nov 18, 2026).
[^dcg-entra-logs]: Microsoft Learn, "Logs available for streaming from Microsoft Entra ID" (`AuditLogs`, `SignInLogs`, `RiskyUsers`, `UserRiskEvents`; Security Administrator to create or edit a diagnostic setting), <https://learn.microsoft.com/entra/identity/monitoring-health/concept-diagnostic-settings-logs-options> (accessed Nov 18, 2026).
[^dcg-intune-gov]: Microsoft Learn, "Microsoft Intune Government Service overview" ("GCC is the same instance as Microsoft Intune in the commercial space"), <https://learn.microsoft.com/intune/fundamentals/government-service> (accessed Nov 18, 2026).
[^dcg-xdr-clouds]: Microsoft Learn, "Support for Microsoft Defender XDR connector data types in Microsoft Sentinel for different clouds" (incidents, and Defender XDR alerts in `SecurityAlert`, generally available for Commercial / GCC), <https://learn.microsoft.com/azure/sentinel/microsoft-365-defender-cloud-support> (accessed Nov 18, 2026).
[^dcg-enable-health]: Microsoft Learn, "Turn on auditing and health monitoring in Microsoft Sentinel" (Settings > **Auditing and health monitoring** > **Enable**; the `_SentinelHealth()` check; no role named), <https://learn.microsoft.com/azure/sentinel/enable-monitoring> (accessed Nov 19, 2026).
[^dcg-ingest-tutorial]: Microsoft Learn, "Tutorial: Send data to Azure Monitor Logs with Logs ingestion API (Azure portal)," Prerequisites ("at least contributor rights" on the workspace; permissions to create DCR objects), <https://learn.microsoft.com/azure/azure-monitor/logs/tutorial-logs-ingestion-portal> (accessed Nov 19, 2026).
[^dcg-dcr-perms]: Microsoft Learn, "Create data collection rules (DCRs) using JSON," Permissions (Monitoring Contributor to create or edit DCRs, on the subscription, resource group or DCR), <https://learn.microsoft.com/azure/azure-monitor/data-collection/data-collection-rule-create-edit> (accessed Nov 19, 2026).
[^dcg-ama]: Microsoft Learn, "Azure Monitor Agent Overview" (supported environments include on-premises servers through Azure Arc; the agent "collects data according to data collection rules (DCRs) associated with the agent"), <https://learn.microsoft.com/azure/azure-monitor/agents/azure-monitor-agent-overview> (accessed Nov 19, 2026).
[^dcg-ama-events]: Microsoft Learn, "Collect Windows events from virtual machines with Azure Monitor Agent" (Windows event data "can only be sent to a Log Analytics workspace where it's stored in the Event table"; a Security log selected in a DCR goes to `Event`, and the Sentinel connector sends it to `SecurityEvent` instead; Arc-enabled on-premises servers), <https://learn.microsoft.com/azure/azure-monitor/vm/data-collection-windows-events>; and Azure Monitor Logs reference, "Event" (`Computer`, `EventLog`, `Source`, `EventID`, `EventLevelName`, `RenderedDescription`), <https://learn.microsoft.com/azure/azure-monitor/reference/tables/event> (both accessed Nov 19, 2026).
[^dcg-t-heartbeat]: Microsoft Learn, Azure Monitor Logs reference, "Heartbeat," <https://learn.microsoft.com/azure/azure-monitor/reference/tables/heartbeat>, and the "Unavailable computers" sample query (`Heartbeat | summarize LastHeartbeat=max(TimeGenerated) by Computer`), <https://learn.microsoft.com/azure/azure-monitor/reference/queries/heartbeat> (both accessed Nov 19, 2026).
[^dcg-secevents]: Microsoft Learn, "Windows security event sets that can be sent to Microsoft Sentinel" (the Windows Security Events via AMA connector writes to `SecurityEvent`; All events, Common, Minimal, Custom), <https://learn.microsoft.com/azure/sentinel/windows-security-event-id-reference>; "Windows agent-based connections" (non-Azure machines need Azure Arc before the connector), <https://learn.microsoft.com/azure/sentinel/connect-services-windows-based>; and Azure Monitor Logs reference, "SecurityEvent" (`Computer`, `EventID`, `Activity`), <https://learn.microsoft.com/azure/azure-monitor/reference/tables/securityevent> (all accessed Nov 19, 2026). The event list is [Book 12, Chapter 03](../b12-security-operations/03-identity-telemetry.md#domain-controllers-while-they-remain-tier-0)'s.
[^dcg-ad-events]: Microsoft Learn troubleshooting articles: "Active Directory replication Event ID 2042" (Directory Service log), <https://learn.microsoft.com/troubleshoot/windows-server/active-directory/active-directory-replication-event-id-2042>; "Active Directory replication Event ID 1388 or 1988," <https://learn.microsoft.com/troubleshoot/windows-server/active-directory/active-directory-replication-event-id-1388-1988>; "Troubleshoot Event ID 1311 messages" (NTDS KCC), <https://learn.microsoft.com/troubleshoot/windows-server/active-directory/troubleshoot-event-id-1311-messages>; "Troubleshooting Active Directory Replication Problems" (1925, NTDS KCC), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/troubleshoot/troubleshooting-active-directory-replication-problems>; "DFSR event ID 2213" (dirty shutdown; replication resumed manually), <https://learn.microsoft.com/troubleshoot/windows-server/networking/dfsr-event-id-2213>; "Troubleshoot missing SYSVOL and NETLOGON shares" (4012, replication stopped past `MaxOfflineTimeInDays`), <https://learn.microsoft.com/troubleshoot/windows-server/networking/troubleshoot-missing-sysvol-and-netlogon-shares>; "Troubleshoot DNS Event ID 4013" (the DNS event log), <https://learn.microsoft.com/troubleshoot/windows-server/networking/troubleshoot-dns-event-id-4013> (all accessed Nov 19, 2026).
[^dcg-repadmin]: Microsoft Learn, "Repadmin /showrepl" (`/csv`), <https://learn.microsoft.com/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/cc742066(v=ws.11)>; "Diagnose AD replication failures" (`repadmin /showrepl * /csv`; the Source DSA, Last Success Time, Last Failure Time and Last Failure Status columns; Enterprise Admins credentials), <https://learn.microsoft.com/troubleshoot/windows-server/active-directory/diagnose-replication-failures>; "Troubleshooting Active Directory Replication Problems" ("Membership in Enterprise Admins, or equivalent, is the minimum required"), <https://learn.microsoft.com/windows-server/identity/ad-ds/manage/troubleshoot/troubleshooting-active-directory-replication-problems> (all accessed Nov 19, 2026). [Book 02, Chapter 07](../b02-identity/07-read-only-discovery.md) cites the same requirement.
[^dcg-dcdiag]: Microsoft Learn, Windows commands, "dcdiag," <https://learn.microsoft.com/windows-server/administration/windows-commands/dcdiag> (accessed Nov 19, 2026).
[^dcg-connect-adds]: Microsoft Learn, "Using Microsoft Entra Connect Health with AD DS" (summary cards for domain controllers, replication status and alerts; performance monitoring), <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-health-adds>; and "Microsoft Entra Connect Health agent installation" (a feature of Microsoft Entra ID P1 or P2), <https://learn.microsoft.com/entra/identity/hybrid/connect/how-to-connect-health-agent-install> (both accessed Nov 19, 2026). GCC availability not stated on the pages read.
[^dcg-mdi-gov]: Microsoft Learn, "Microsoft Defender service description," Microsoft Defender for Identity (a per-user license, standalone or in plans including Microsoft 365 E5/A5/G5 and Microsoft Defender Suite/EDU/GOV), <https://learn.microsoft.com/office365/servicedescriptions/microsoft-365-service-descriptions/microsoft-365-tenantlevel-services-licensing-guidance/microsoft-defender-service-description> (accessed Nov 19, 2026); [Book 02, Chapter 06](../b02-identity/06-who-owns-the-migration.md) holds the license note.
[^dcg-backup-event]: Microsoft Learn, "System state backup fails" (Log Name: Application, Source: Microsoft-Windows-Backup, Event ID 517, Level: Error), <https://learn.microsoft.com/troubleshoot/windows-server/backup-and-storage/system-writer-not-found-in-backup> (accessed Nov 19, 2026).
[^dcg-adsync]: Microsoft Learn, "Microsoft Entra Connect: ADSync PowerShell Reference" (`Get-ADSyncRunProfileResult` "retrieves one or more run profile results"; output type not detailed), <https://learn.microsoft.com/entra/identity/hybrid/connect/reference-connect-adsync> (accessed Nov 19, 2026).
[^dcg-activities-admin]: Microsoft Learn, "Microsoft Entra audit log activity reference" ("Reset password (by admin)," "Admin started password reset," "Reset password," "Admin registered security info," "Admin updated security info," "Admin deleted security info," "Add user," "Update user," "Add role definition," "Update role definition"), <https://learn.microsoft.com/entra/identity/monitoring-health/reference-audit-activities> (accessed Nov 19, 2026). [Book 15, Appendix A](../b15-day2-operations/appendix-a-help-desk-task-reference.md) maps each help-desk task to its activity.
[^dcg-t-azact]: Microsoft Learn, Azure Monitor Logs reference, "AzureActivity" (`OperationNameValue`, `Caller`, `ActivityStatusValue`, `ResourceGroup`, `_ResourceId`, `CorrelationId`), <https://learn.microsoft.com/azure/azure-monitor/reference/tables/azureactivity>; and "Azure permissions for Management and governance" (`Microsoft.Authorization/roleAssignments/write`, "Create a role assignment"; `roleDefinitions/write`, "Create or update a custom role definition"), <https://learn.microsoft.com/azure/role-based-access-control/permissions/management-and-governance> (both accessed Nov 19, 2026).
[^dcg-rbac-alert]: Microsoft Learn, "Alert on privileged Azure role assignments" (a query on `OperationNameValue =~ "Microsoft.Authorization/roleAssignments/write"`), <https://learn.microsoft.com/azure/role-based-access-control/role-assignments-alert> (accessed Nov 19, 2026).
[^dcg-activity-log]: Microsoft Learn, "Azure Monitor activity log" ("Create a diagnostic setting to send activity log entries"; stored in a table called `AzureActivity`; 90 days in the activity log itself), <https://learn.microsoft.com/azure/azure-monitor/fundamentals/activity-log> (accessed Nov 19, 2026).
[^dcg-ingest-code]: Microsoft Learn, "Sample code to send data to Azure Monitor using Logs ingestion API" (`{endpoint}/dataCollectionRules/{dcrImmutableId}/streams/{streamName}?api-version=2023-01-01`; token scope `https://monitor.azure.com`; stream `Custom-<table>`), <https://learn.microsoft.com/azure/azure-monitor/logs/tutorial-logs-ingestion-code> (accessed Nov 19, 2026).
[^dcg-arc-onboard]: Microsoft Learn, "Connect hybrid machines to Azure at scale" (the Azure Connected Machine Onboarding role, or Contributor), <https://learn.microsoft.com/azure/azure-arc/servers/onboard-service-principal> (accessed Nov 19, 2026).
[^dcg-graph-health]: Microsoft Learn, "List healthOverviews" and "List issues" (`GET /admin/serviceAnnouncement/healthOverviews`, `/issues`; `ServiceHealth.Read.All`, delegated or application; global service), <https://learn.microsoft.com/graph/api/serviceannouncement-list-healthoverviews>, <https://learn.microsoft.com/graph/api/serviceannouncement-list-issues>; and "National cloud deployments" (GCC continues using the worldwide endpoints), <https://learn.microsoft.com/graph/deployments> (all accessed Nov 19, 2026).
