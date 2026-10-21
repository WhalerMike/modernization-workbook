# Verification — Chapter 04, Azure Platform and Microsoft 365 Audit Telemetry

Checked October 21, 2026 by writer W2. Sources: `docs/operational-guides/siem-telemetry-emission/02-azure-platform.md` (1,650 words) and `03-m365-unified-audit.md` (1,681 words), both archived after the book. Microsoft claims verified with the Microsoft Learn MCP tools; OMB M-26-14 downloaded from whitehouse.gov and text-extracted; FedRAMP KSI page fetched from fedramp.gov; NIST control titles from NIST's OSCAL catalog. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Activity log = control plane, collected by default, 90-day retention, no charge; typically no reads | Part 1 | verified (reads, 90 days new) | Learn, Activity log in Azure Monitor |
| 2 | No ingestion charge for activity log export to LA; AzureActivity table; only place resource creator is recorded | Part 1 | verified (new) | Learn, Activity log |
| 3 | Eight categories and definitions; Administrative includes all RBAC changes | Categories | verified | Learn, Activity log event schema |
| 4 | "there is no separate RBAC audit log to fall back on" | Categories | removed | Not verifiable as stated; kept the verified "Administrative records RBAC changes" |
| 5 | `Get-AzEventCategory` confirms the list | Categories | removed | Not needed; schema page is authoritative |
| 6 | Enable all eight (low volume, health categories useful) | Categories | restated-as-design | Program choice, supported by no-ingestion-charge fact |
| 7 | Export begins within about 30 minutes (troubleshoot article) | Portal | removed | Portal steps dropped; Azure Monitor gives 90 minutes for diagnostic settings generally (not used) |
| 8 | Use `az monitor diagnostic-settings subscription create`; plain command is resource-scoped | CLI | verified | Learn, Diagnostic settings (CLI tab) |
| 9 | CLI parameters `--name --location --workspace --logs` | CLI | verified | Learn, az monitor diagnostic-settings subscription |
| 10 | `--location usgovvirginia` | CLI | corrected | Replaced with `<region>`; the region depends on whether the subscription is in commercial Azure or Azure Government |
| 11 | "You can't use this method for an activity log" (New-AzDiagnosticSetting) | CLI warning | verified | Learn, Diagnostic settings (PowerShell tab) |
| 12 | "see it fail or silently no-op" | CLI warning | restated | Kept only "failed call"; silent no-op not verified |
| 13 | Bicep `Microsoft.Insights/diagnosticSettings@2021-05-01-preview` | Bicep | verified | Learn, Diagnostic settings (Bicep tab uses this API version) |
| 14 | Management-group setting can replace per-subscription settings | Management groups | corrected | Learn: MG setting doesn't capture every subscription event; events without `hierarchy` don't propagate; keep subscription settings |
| 15 | Duplicates are the intended trade-off ("better than missing") | Management groups | verified (paraphrased) | Learn, Activity log; quoted phrase not reproduced |
| 16 | Dedupe KQL `hash(dynamic_to_json(pack_all))` | Management groups | corrected | `pack_all()` requires parentheses (Learn example) |
| 17 | Resource logs = data plane, not collected by default, per resource | Part 2 | verified | Learn, Activity log; Resource logs |
| 18 | Up to five settings per resource; one destination of each type per setting | Part 2 | verified (new) | Learn, Diagnostic settings |
| 19 | Resource logs "aren't completely lossless" | Part 2 | verified (new) | Learn, Resource logs |
| 20 | `az monitor diagnostic-settings categories list` | Part 2 | restated | Command shown as illustrative; not separately verified on a CLI reference page (flagged below) |
| 21 | `allLogs` category group survives new categories; `audit` group definition | Part 2 | verified | Learn, Diagnostic settings, Category groups |
| 22 | Not all services support category groups; SQL audit category doesn't enable auditing | Part 2 | verified (new) | Learn, Diagnostic settings |
| 23 | `--export-to-resource-specific true` | Part 2 | verified | Learn, Diagnostic settings CLI example |
| 24 | Resource-specific recommended (source cited a Cassandra page) | Resource-specific | corrected (source) | Replaced with Resource logs page: advantages, all services moving to it, recommended for new settings; most resources don't offer a choice |
| 25 | AzureDiagnostics column limit → new columns "silently dropped," audit fields disappear | Resource-specific | corrected | 500-column limit; overflow goes to `AdditionalFields` dynamic column, not dropped (Learn, AzureDiagnostics) |
| 26 | Switching mode leaves old data in AzureDiagnostics; use union | Resource-specific | verified (new) | Learn, Resource logs |
| 27 | Self-reference loop blocked in portal only | Warning | verified | Learn, Diagnostic settings |
| 28 | Delete settings when resource deleted/renamed/moved | Warning | verified (new) | Learn, Diagnostic settings |
| 29 | Built-in "Configure Azure Activity logs to stream to specified Log Analytics workspace" (DINE) | Part 3 | verified | Learn, Azure Policy built-ins for Azure Monitor |
| 30 | "Deploy Diagnostic Settings for <resource type> to Log Analytics workspace" pattern | Part 3 | corrected | Current built-ins are "Enable logging by category group for <type> to Log Analytics" plus allLogs (140 policies) and audit (69) initiatives |
| 31 | Managed identity needs Monitoring Contributor and Log Analytics Contributor | Part 3 | restated | Role names not verified for the current initiatives; replaced with Microsoft's rule: roles come from `roleDefinitionIds`, built-ins prepopulate, portal grants automatically, SDK/template must grant manually |
| 32 | DINE fires on create/update, not retroactively; remediation task needed | Part 3 | verified | Learn, deployIfNotExists effect |
| 33 | Default evaluation delay 10 minutes (PT10M) | Part 3 | verified (new) | Learn, deployIfNotExists effect |
| 34 | One DINE policy per remediation task; 500 default, 50,000 max; MG assignments can't create remediation at assignment time | Part 3 | verified (new) | Learn, Remediate non-compliant resources |
| 35 | `Start-AzPolicyRemediation`, `az policy remediation create` | Part 3 | verified | Learn, Remediate non-compliant resources |
| 36 | KSI-MLA-EVC quoted "persistently evaluated and tested" | Part 3 | corrected | Paraphrased per FedRAMP Consolidated Rules for 2026 (continuously evaluated and tested); KSI-MLA-LET added |
| 37 | Azure Arc policy library | Part 3 | restated | Pointed to Book 05 (settled fact: servers via Arc and machine configuration) |
| 38 | AzureActivity verify KQL with `count`, `Category` | Verify | corrected | `count()`; `CategoryValue` per Learn examples and column reference; case-insensitivity note added |
| 39 | Subscription loop with `subscription list --query "length(value)"` | Verify | restated | Kept as illustrative; output shape not verified on Learn (flagged below) |
| 40 | Policy compliance is the coverage metric; queries are liveness | Verify | restated-as-design | Program position |
| 41 | UAL covers Exchange, SharePoint, OneDrive, Teams, Power Platform, Purview | Part 4 | verified (reworded) | Search-UnifiedAuditLog description lists Exchange Online, SharePoint, OneDrive, Entra ID, Teams, Power BI and other services |
| 42 | Auditing on by default for enterprise; not for SMB (Business Basic/Standard/Premium) or unmanaged enterprise trials | Step 1 | verified | Learn, Turn auditing on or off |
| 43 | In S&C PowerShell `UnifiedAuditLogIngestionEnabled` always False | Step 1 | verified | Learn, Turn auditing on or off |
| 44 | Portal banner path; `Set-AdminAuditLogConfig`; up to 60 minutes; several hours to searchable; Audit Logs role in Compliance Management and Organization Management | Step 2 | verified | Learn, Turn auditing on or off |
| 45 | With auditing off: no Management API, no Sentinel, no Purview search, no Search-UnifiedAuditLog | Step 2 | verified | Learn, Turn auditing on or off |
| 46 | Status changes are audited (time, admin, IP) | Step 2 | verified | Learn, Turn auditing on or off |
| 47 | Search-UnifiedAuditLog default 100; ReturnLargeSet to 50,000; Microsoft recommends Management Activity API for programmatic download | Step 2 | verified (new) | Learn, Search-UnifiedAuditLog |
| 48 | Management Activity API is "app-only" | Step 3 | corrected | Learn FAQ: most collectors use client credentials; Microsoft says enable both application and delegated permissions for the first two permission sets |
| 49 | ActivityFeed.Read claim / Read activity data permission | Step 3 | verified (new) | Learn, API reference; FAQ |
| 50 | API roots: manage.office.com, manage-gcc.office.com, manage.office365.us, manage.protection.apps.mil | Step 3 | verified | Learn, API reference; FAQ |
| 51 | GCC authority `https://login.windows.net` | Step 3 | corrected | GCC is paired with commercial Entra ID (feature availability); Microsoft's samples and Graph deployments use login.microsoftonline.com |
| 52 | GCC High / DoD authority login.microsoftonline.us | Step 3 | verified | Learn, Graph national cloud deployments |
| 53 | Source cited a Power Platform CoE page for endpoints | Step 3 | corrected (source) | Replaced with the API reference |
| 54 | Five content types; subscriptions per tenant; no per-event selection | Step 4 | verified | Learn, API reference; FAQ |
| 55 | Workload descriptions for content types (Audit.General = Teams, Power Platform, Purview, Forms) | Step 4 | corrected | Microsoft says Audit.General includes "all other workloads"; Teams under Audit.General verified on the Teams–Sentinel page; other examples dropped |
| 56 | DLP sensitive data needs "Read DLP sensitive data" | Step 4 | verified (new) | Learn, API reference |
| 57 | PublisherIdentifier = "your organization's tenant GUID" | Step 4 | corrected | It is the tenant GUID of the organization writing the code (agency's own for in-house; vendor's for ISV); include on every call including blob GET |
| 58 | 15-minute throttle on start; stop not throttled; up to 12 hours for first blobs | Timing warning | verified | Learn, API reference |
| 59 | startTime/endTime both or neither, ≤24h, ≤7 days back; >24h "could be partial results" | Step 5 | verified | Learn, API reference |
| 60 | Time filter is content availability, not event time | Step 5 | verified (new) | Learn, API reference; FAQ |
| 61 | NextPageUri pagination | Step 5 | verified | Learn, API reference |
| 62 | Content retrievable 7 days; stopping loses content | Step 5 | verified (new) | Learn, API reference; FAQ |
| 63 | Webhooks de-emphasized; notifications slower than polling | Step 5 | verified (new) | Learn, FAQ |
| 64 | No latency SLA; core services typically 60–90 minutes | Timing warning | verified (new) | Learn, FAQ |
| 65 | Events not in order (quote) | Ordering | verified | Learn, API reference |
| 66 | Duplicates by design; API doesn't dedupe | Ordering | verified (new) | Learn, FAQ |
| 67 | Dedupe on contentId and record Id; trailing window | Ordering | restated-as-design | Program collector design; `Id` property verified in schema |
| 68 | Link to "Telemetry Modernization Spec" / "decision determinism requirement" | Ordering | removed | Archived internal spec; replaced with Ch02 evidence contract |
| 69 | Audit (Standard) 180 days (90 before Oct 17, 2023) | Retention | verified | Learn, audit log retention policies |
| 70 | Premium default one year for Exchange, SharePoint, OneDrive, AzureActiveDirectory workloads; non-modifiable | Retention | verified | Learn, audit log retention policies |
| 71 | Premium other workloads 180 days unless custom policy | Retention | verified | Learn |
| 72 | 10-year add-on per user | Retention | verified | Learn, retention policies; audit solutions |
| 73 | One-year default limited to E5 / Purview Suite / E5 eDiscovery and Audit users; non-E5 and guests 180 days (quote) | Retention warning | verified | Learn, retention policies |
| 74 | "every service account on a lower SKU — at 180 days" | Retention warning | corrected | Non-user entities (service principals, system events, application activity) have a fixed one-year retention (audit solutions note 2) |
| 75 | Policies not retroactive | Retention warning | verified | Learn, retention policies; audit solutions |
| 76 | Custom policies outrank default, can shorten retention; license required for >180 days | Retention warning | verified (new) | Learn, retention policies |
| 77 | Audit (Premium) licensing incl. G5 and E5/G5 eDiscovery & Audit | Retention | verified (new) | Learn, Purview service description |
| 78 | GCC and GCC High: Audit Standard/Premium, 1-year, 10-year, API bandwidth available | Retention | verified (new) | Learn, Plan for Purview – GCC; – GCC High |
| 79 | M-21-31 / AU-11 framing | Retention | corrected | M-26-14 Appendix B item 1 (6 months searchable, 1 year retrievable) |
| 80 | Purview retention tier is not the evidence store; collector to workspace | Retention | restated-as-design | Program position |
| 81 | Sentinel Microsoft 365 connector → OfficeActivity; Exchange, SharePoint, Teams | Sentinel | verified | Learn, OfficeActivity table; Sentinel tables reference |
| 82 | Those data types free | Sentinel | verified (new) | Learn, Sentinel billing |
| 83 | Office 365 connector GA in GCC, GCC High, DoD | Sentinel | verified (new) | Learn, feature availability |
| 84 | "substrate's evidence path … SIEM adapter spec requires a provenance envelope" | Sentinel | restated-as-design | Engine terms removed; restated as the program's evidence contract (Ch02) |
| 85 | "connector does not consume blobs in a way that hides them from an API subscription" | Sentinel | removed | Not verifiable |
| 86 | OfficeActivity verify KQL (`count`, OfficeWorkload, RecordType) | Verify | corrected | `count()`; columns verified on table reference |
| 87 | Tenant-side loop with record types AzureActiveDirectory, Exchange, SharePoint, MicrosoftTeams | Verify | corrected | `Exchange` isn't an AuditLogRecordType; used ExchangeAdmin, ExchangeItem, SharePointFileOperation (schema enum); `@()` wrapper for count |
| 88 | "A green KQL result with a stale pipeline can persist for hours on cached data" | Verify | removed | Not verifiable; kept the verified reasoning (only the tenant check distinguishes no activity from no capture) |
| 89 | AC-2, AC-6 control names | Categories | verified | NIST OSCAL SP 800-53 Rev. 5 catalog 5.2.0 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| 02 front matter | — | Internal metadata |
| 02 intro (two planes; Key Vault example) | Thesis line, Part 1 and Part 2 openings | Carried |
| 02 Part 1 Categories table | Categories table | Carried |
| 02 Tip: enable all eight | Categories prose | Carried as program design |
| 02 Portal steps | — | Not carried: the program deploys from code; CLI and Bicep cover it |
| 02 CLI | Export by CLI | Carried; region placeholder |
| 02 Warning: New-AzDiagnosticSetting | Important callout | Carried |
| 02 Bicep at subscription scope | Export by Bicep | Carried |
| 02 Management-group paragraph and Note: duplicates | Management groups don't replace subscription settings | Carried and corrected; KQL fixed |
| 02 Part 2 categories list and create | Part 2 | Carried |
| 02 Tip: resource-specific tables | Resource-specific tables | Carried, column-limit claim corrected |
| 02 Warning: self-reference loop | Warning callout | Carried; rename trap added |
| 02 Part 3 Azure Policy table | Part 3 table | Carried with current built-in names |
| 02 Important: DINE only fires on writes | Important callout | Carried and expanded with remediation limits |
| 02 KSI-MLA-EVC paragraph | Part 3 | Carried, wording corrected |
| 02 Arc policy library link | Book 05 link | Replaced (internal page not linked) |
| 02 Verify emission (KQL, subscription loop, AzureDiagnostics KQL, completeness note) | Verify Azure emission | Carried; KQL corrected |
| 02 Next | — | Replaced by the book's navigation |
| 03 front matter | — | Internal metadata |
| 03 intro | Part 4 opening | Carried, workload list corrected |
| 03 Step 1 + warning | Step 1 | Carried |
| 03 Step 2 + important | Step 2 | Carried; ReturnLargeSet added |
| 03 Step 3 + endpoint table + GCC note | Step 3 | Carried; GCC authority corrected; DoD retained; commercial row added |
| 03 Step 4 content types, start loop, list | Step 4 | Carried; PublisherIdentifier corrected and added to calls |
| 03 Warning: two timing rules | Warning callout | Carried; latency facts added |
| 03 Step 5 retrieve + constraints | Step 5 | Carried; availability-time and 7-day facts added |
| 03 Important: events not ordered | Important callout | Carried; duplicates added; internal spec link removed |
| 03 Retention table + warning | Retention | Carried; service-account claim corrected; non-user one-year row added |
| 03 Sentinel ingestion | Microsoft Sentinel ingestion | Carried; engine terms removed |
| 03 Verify emission | Verify Microsoft 365 emission | Carried; record types corrected |
| 03 Next (compliance crosswalk) | Where the evidence goes next | Replaced with links to Ch05, Ch12 and Vol III Book 06 |

## Not independently verified (flagged)

- `az monitor diagnostic-settings categories list` query shape (`categoryType`, `categoryGroups`) — command exists in the Azure CLI `diagnostic-settings` group but its output property names were not checked on a reference page.
- The JSON shape returned by `az monitor diagnostic-settings subscription list` (`value` array) — inferred from the documented `SubscriptionDiagnosticSettingsResourceCollection` return type.
