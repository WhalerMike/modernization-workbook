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

## Federal requirements and KSIs

Controls and KSIs are only the pairs in `examples/daily-checks-workbook/config/requirements.json`, each reused from the Azure security kit's requirements file (read from fedramp.gov's 2026 KSI theme pages and NIST's catalog for that guide, November 11, 2026). No new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Scope checks

GCC Moderate and commercial Azure only: no other government cloud is named (the Learn pages' other columns weren't copied). No agency is named. Fixtures are fictional (`contoso.example`, Learn-style placeholder IDs).

## Review gate

`review-status: pending`. Not approved here.
