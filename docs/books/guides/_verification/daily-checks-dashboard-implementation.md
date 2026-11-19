# Verification — Guide: The Daily Checks on One Dashboard

New guide, written November 18, 2026, with the kit `examples/daily-checks-workbook`, after the owner asked whether the daily checks could go on a dashboard and, on the one-workbook design, said "Build it, and document it please." Every Microsoft fact was read on Microsoft Learn on November 18, 2026 with WebFetch (the Learn documentation service wasn't available to this session). Facts carried from the books are cited by link and rely on those pages' own verification logs. No personal name, e-mail address or agency detail was sent in any request.

## Search before writing (origin/main, November 18, 2026)

Searched `docs/`, `presentations/`, `examples/` and `data/` for *dashboard*, *daily check*, *workbook template*, *serializedData*, *Microsoft.Insights/workbooks*, *SentinelHealth*, *Connect Health*, *Grafana* and *portal dashboard*. Found: the daily checks themselves (Book 15, Chapter 12); the Sentinel health workbook and `SentinelHealth` (Book 15, Chapter 12, footnote `c12-sentinel-health`; Book 12, Appendix B, rollout telemetry); Entra workbook templates (Book 02, Chapter 10); the position that a dashboard is a picture of the evidence (Book 12, Chapter 12) and that a test reading a tile is a screenshot with a schedule (Book 15, Chapter 11); Intune's export timing (Book 05, Chapter 10); the Logs Ingestion API for a custom table (Book 12, Chapter 06); a legacy reference volume (`docs/compliance/Vol_III_Book_02_Vulnerability_Management.md`) that sketches an operations workbook over the retired HTTP Data Collector API, already superseded by Book 12, Chapter 06. No daily-checks dashboard, workbook template or kit existed. Nothing conflicts: this guide links each of those instead of repeating it.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Workbooks: flexible canvas, most complete set of Azure data sources; portal dashboards: single pane of glass, workbook richer; Dashboards with Grafana preview, no additional cost; Managed Grafana for external sources, private networking, managed identity; Power BI for long-term KPI trends | Options | verified; short quotes | `dcg-best` |
| 2 | Workbook data sources (Logs, Resource Graph, Resource Manager, metrics and others) | Options | verified | `dcg-sources` |
| 3 | Workbooks as ARM templates; Gallery Template and ARM template tabs; `workbookSourceId`; `kind` shared; mask embedded sensitive values | Options, Steps 2, 3 | verified; quote | `dcg-arm` |
| 4 | `Microsoft.Insights/workbooks` 2023-06-01; `kind` only `shared`; required `category`, `displayName`, `serializedData`; `version` like Notebook/1.0 | Step 3 | verified | `dcg-ref` |
| 5 | What-if predicts and changes nothing; same permissions as deployment, `Microsoft.Resources/deployments/*`; `--no-pretty-print`; change types; `newGuid()` not evaluated | Steps 3, 4 | verified | `dcg-whatif` |
| 6 | Access control: Monitoring Reader, Monitoring Contributor, `microsoft.insights/workbooks/write` | Step 4 | verified | `dcg-overview` |
| 7 | Workbook Contributor "Can save shared workbooks"; Workbook Reader "Can read workbooks" | Step 4 | verified | `dcg-roles` |
| 8 | Log Analytics Reader views and searches all monitoring data; access modes | Steps 1, 4, Dangers | verified | `dcg-la-access` |
| 9 | `SentinelHealth`: health monitoring must be on; supported connectors; latest-failure query; Azure Monitor alert rules recommended; Data collection health monitoring workbook; Data & connectors Overview tab public preview in commercial cloud environments | Tabs, Availability, Step 1 | verified; query used verbatim in `telemetry-2.kql` | `dcg-health` |
| 10 | Logs Ingestion API: custom tables `_CL`; DCR; Monitoring Metrics Publisher | Tabs, Availability, Step 1 | verified | `dcg-ingest` |
| 11 | Connect Health: alerts, sync errors, service information in the Entra admin center; P1 | Tabs, Availability | verified; GCC not stated | `dcg-connect` |
| 12 | Entra Health monitoring preview; admin center, e-mail; Reports Reader | Tabs, Availability | verified; GCC not stated (as Book 15 says) | `dcg-entra-health` |
| 13 | Table columns used by the queries (`AADRiskyUsers`, `SigninLogs`, `IntuneDeviceComplianceOrg`, `AuditLogs`, `SecurityAlert`, `SecurityIncident`, `CommonSecurityLog`) | Tabs; kit queries | verified on each table reference page | `dcg-t-*`; `CommonSecurityLog` in the kit's verification |
| 14 | Emergency access sign-in query by `UserId`; alert rule; validate every 90 days | Tabs | verified; the kit's query keeps Microsoft's projection | `dcg-emergency` |
| 15 | Intune diagnostic settings path, roles, DeviceComplianceOrg; daily export up to 48 hours; duplicates | Step 1 | verified; matches Book 05, Chapter 10 | `dcg-intune` |
| 16 | Audit activity names | Tabs; `grants-1.kql` | verified | `dcg-activities` |
| 17 | Defender XDR collects Purview DLP and ID Protection alerts; SecurityAlert and SecurityIncident at no charge | Tabs, Step 1 | verified | `dcg-xdr` |
| 18 | Sentinel Workbooks GA in Azure commercial; Defender portal previews commercial-cloud only | Availability | verified (only the commercial column used) | `dcg-sentinel-clouds` |
| 19 | Entra log categories and Security Administrator for diagnostic settings | Availability, Step 1 | verified | `dcg-entra-logs` |
| 20 | Intune GCC is the commercial service instance | Availability | verified; quote | `dcg-intune-gov` |
| 21 | Defender XDR incidents and alerts GA for Commercial / GCC | Availability | verified (only the Commercial / GCC column used) | `dcg-xdr-clouds` |
| 22 | Book 12, Chapter 12 and Book 15, Chapter 11 quotes | How to read | verified against the pages on origin/main | links |
| 23 | Where agencies are | Requirements | design guidance, labeled | — |
| 24 | Turning on Sentinel auditing and health monitoring: Settings > Auditing and health monitoring > Enable; `_SentinelHealth()` check; the page names no role, so the access request names the existing Sentinel owner and requests nothing new | Prerequisites | verified Nov 19, 2026 | `dcg-enable-health` |
| 25 | Logs Ingestion API tutorial prerequisites: at least contributor rights on the workspace; permissions to create DCR objects | Prerequisites | verified Nov 19, 2026 | `dcg-ingest-tutorial` |
| 26 | Monitoring Contributor creates or edits DCRs (subscription, resource group or DCR scope) | Prerequisites | verified Nov 19, 2026 | `dcg-dcr-perms` |
| 27 | AMA on Arc-enabled on-premises servers; collects by associated DCRs | Availability, Step 1 | verified Nov 19, 2026 | `dcg-ama` |
| 28 | Windows events go only to `Event`; a Security log in a DCR goes to `Event`, the Sentinel connector sends it to `SecurityEvent`; `Event` columns | Tabs, Step 1; `sync-2`, `sync-3`, `ad-4` | verified Nov 19, 2026. The page's XPath examples cover System and Security only: the log names `DFS Replication` and `DNS Server` aren't on Learn (listed as not verified) | `dcg-ama-events` |
| 29 | `Heartbeat` columns; Learn's "Unavailable computers" query | Tabs; `sync-3`, `ad-1` | verified Nov 19, 2026. The `Category` value for the Azure Monitor Agent isn't documented, so the queries don't filter on it | `dcg-t-heartbeat` |
| 30 | Windows Security Events via AMA writes to `SecurityEvent`; event sets; Arc before the connector; `SecurityEvent` columns; connector GA in Azure commercial | Tabs, Availability; `ad-3` | verified Nov 19, 2026 (feature-availability page, commercial column only) | `dcg-secevents`, `dcg-sentinel-clouds` |
| 31 | Event IDs 2042, 1988, 1311, 1925, 2213, 4012, 4013 and what each means | Tabs; `ad-4` | verified Nov 19, 2026 on Learn troubleshooting articles | `dcg-ad-events` |
| 32 | `repadmin /showrepl * /csv`; columns Source DSA, Last Success Time, Last Failure Time, Last Failure Status; Enterprise Admins or equivalent minimum | Tabs, Prerequisites, Step 1; `ConvertFrom-DcRepadminCsv` | verified Nov 19, 2026; the other column names are the tool's own header, not on Learn (listed) | `dcg-repadmin` |
| 33 | `dcdiag` needs administrative rights | Step 1 | verified Nov 19, 2026; output format not on Learn, so not parsed | `dcg-dcdiag` |
| 34 | Connect Health for AD DS: domain controllers, replication status, alerts; P1 or P2 | Tabs, Availability | verified Nov 19, 2026; GCC not stated | `dcg-connect-adds` |
| 35 | Defender for Identity alerts in the Defender XDR integration; `SecurityAlert (AATP)` GA for GCC; licensing (Defender service description) | Tabs, Availability; `ad-5` | verified Nov 19, 2026; the `ProductName` value isn't on Learn, so it is a setting | `dcg-xdr`, `dcg-xdr-clouds`, `dcg-mdi-gov` |
| 36 | Windows Server Backup failure: Application log, Microsoft-Windows-Backup, 517 Error | Prerequisites, couldn't verify | verified Nov 19, 2026; the success event ID isn't on Learn | `dcg-backup-event` |
| 37 | `Get-ADSyncRunProfileResult` exists; output not documented; no Learn list of run-profile event IDs | Couldn't verify | verified Nov 19, 2026 (absence) | `dcg-adsync` |
| 38 | Audit activity names for the admin changes tab | Tabs; `admin-1` | verified Nov 19, 2026. No activity is named for "require re-registration": the tab uses the admin security-info activities, as Book 12, Appendix B does | `dcg-activities-admin` |
| 39 | `AzureActivity` columns; `roleAssignments/write` and `roleDefinitions/write`; Learn's privileged role assignment alert query | Tabs; `admin-2` | verified Nov 19, 2026 | `dcg-t-azact`, `dcg-rbac-alert` |
| 40 | Activity log to the workspace through a diagnostic setting, stored in `AzureActivity`; Azure Activity connector GA in Azure commercial | Availability, Step 1 | verified Nov 19, 2026 | `dcg-activity-log`, `dcg-sentinel-clouds` |
| 41 | Logs Ingestion upload URI with `api-version=2023-01-01`; token scope `https://monitor.azure.com`; `Custom-` stream | Step 1; `Invoke-DcReplicationProbe` | verified Nov 19, 2026 (Learn's PowerShell sample) | `dcg-ingest-code` |
| 42 | Azure Connected Machine Onboarding role, or Contributor, to onboard Arc servers | Prerequisites | verified Nov 19, 2026 | `dcg-arc-onboard` |
| 43 | Service health through Graph: endpoints, `ServiceHealth.Read.All`, global service; GCC uses the worldwide endpoints | Availability | verified Nov 19, 2026; the same facts the provider notices guide verified Nov 9. Kept a link-out: the provider notices kit already collects service health, so the sync probe doesn't store a second copy | `dcg-graph-health` |

## The three tabs added November 19, 2026

The owner asked for all three ("Build all three") after the proposal to add the synchronization servers' rows, an Active Directory tab and an admin changes tab. Search before writing (origin/main, November 19, 2026), by topic and key terms (`repadmin`, `dcdiag`, `Heartbeat`, `roleAssignments/write`, the audit activity names, `Microsoft-Windows-Backup`, `Windows Security Events via AMA`, `ServiceHealth.Read`, Connect Health for AD DS, `DFS Replication`, `_CL`):

- **Reused, linked:** Book 12, Chapter 03's Entra Connect server section (Application log forwarding, Entra Connect Admin Actions) and its domain controller event list (4618, 4649, 4719, 4765, 4766, 4794, 4897, 4964, 5124, 1102), not restated; Book 15, Chapter 12's task 7 (forward to the log platform, never a share), its Connect Sync server checks (weekly; configuration export as the backup of the synchronization policy) and the cadence table's sync row (CP-9 backup result); Book 15, Appendix A and Book 12, Appendix B for the audit activity names; Book 02, Chapter 07 (repadmin's Enterprise Admins requirement) and Chapter 06 (Defender for Identity licensing in GCC); the provider notices guide and kit (service health through Graph).
- **Overlap avoided:** consents and Entra role assignments stay on the grants tab; the admin changes tab doesn't repeat them, and a test keeps them out of its query.
- **Conflicts:** none found. One tension is reported to the owner rather than resolved: a "read-only" replication probe needs Enterprise Admins or equivalent per Learn, a Tier 0 right.

## Federal requirements and KSIs

The replication probe's step (PROBE: CA-7, SI-4; KSI-MLA-EVC, KSI-MLA-LET) reuses the reachability step's pairs. Controls and KSIs are only the pairs in `examples/daily-checks-workbook/config/requirements.json`, each reused from the Azure security kit's requirements file (read from fedramp.gov's 2026 KSI theme pages and NIST's catalog for that guide, November 11, 2026). No new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Scope checks

GCC Moderate and commercial Azure only: no other government cloud is named (the Learn pages' other columns weren't copied). No agency is named. Fixtures are fictional (`contoso.example`, Learn-style placeholder IDs).

## Review gate

`review-status: pending`. Not approved here.
