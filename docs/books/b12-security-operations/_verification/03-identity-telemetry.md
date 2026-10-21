# Verification — Chapter 03, Identity Telemetry from Entra ID

Checked October 21, 2026 by writer W2. Source: `docs/operational-guides/siem-telemetry-emission/01-entra-id.md` (2,136 words, archived after the book). Microsoft claims verified with the Microsoft Learn MCP tools (`microsoft_docs_fetch` / `microsoft_docs_search`); OMB M-26-14 downloaded from whitehouse.gov and text-extracted; FedRAMP KSI page fetched from fedramp.gov; NIST control titles read from NIST's OSCAL SP 800-53 Rev. 5 catalog (release 5.2.0) on GitHub. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Entra keeps audit/sign-in logs 30 days (P1/P2), 7 days (Free); Graph activity logs not retained unless routed; upgrade not retroactive | Opening | verified (new) | Learn, Microsoft Entra data retention |
| 2 | Diagnostic settings route to Log Analytics, Event Hubs, storage, partner solutions | Opening | verified | Learn, Configure Entra diagnostic settings |
| 3 | Security Administrator needed to create/edit a diagnostic setting | Prerequisites | verified | Learn, identity logs you can stream |
| 4 | Custom security attribute logs need Attribute Log Administrator plus Security Administrator; configured on a separate tab | Prerequisites | verified | Learn, identity logs you can stream; Configure diagnostic settings |
| 5 | Destination must exist before the setting | Prerequisites | verified | Learn, Configure diagnostic settings |
| 6 | Event Hubs subscription and namespace must be associated with the same Entra tenant | Prerequisites | verified | Learn, Stream logs to an event hub |
| 7 | Graph activity logs need Entra ID P1 or P2 | Prerequisites | verified | Learn, Graph activity logs overview; data retention page |
| 8 | Sentinel Entra connector needs P1/P2 for sign-in logs; Workload ID Premium for the two SP risk tables | Prerequisites | verified (new) | Learn, Sentinel Entra ID connector |
| 9 | Category names differ from table names; most tables have AAD prefix | Categories | verified | Learn, ID Protection export risk data |
| 10 | Category-to-table mapping for core and ID Protection categories, GSA categories, ADFSSignInLogs, MicrosoftGraphActivityLogs | Categories table | verified | Learn, Sentinel Entra connector table; ID Protection export mapping |
| 11 | `RiskyAgents` → `RiskyAgents`, `AgentRiskEvents` → `AgentRiskEvents` | Categories table | corrected | Tables are `AADRiskyAgents` and `AADAgentRiskEvents` (ID Protection export mapping; Azure Monitor table reference) |
| 12 | `CustomSecurityAttributeAuditLogs` → table `CustomSecurityAttributeAuditLogs` | Categories table | corrected | Table is `AADCustomSecurityAttributeAuditLogs` (Azure Monitor table reference) |
| 13 | Keep custom security attribute logs separate from directory audit logs; readable only with Attribute Log Reader/Administrator | Categories | verified (new) | Learn, Manage access to custom security attributes; Configure diagnostic settings |
| 14 | Tier labels Core / High value / Conditional | Categories | restated-as-design | Program tiering; no Microsoft tier labels used (Learn mentions tiers but shows none) |
| 15 | MicrosoftServicePrincipalSignInLogs: complex, high volume, "not essential for security investigations," don't disable apps (tenant lock-out) | Warning | verified | Learn, identity logs you can stream |
| 16 | "The ingestion cost is real and the analytic value is negative" | Warning | restated-as-design | Reworded as the program's position |
| 17 | Non-interactive and SP sign-ins 5–10x interactive volume | Four sign-in streams | verified (new) | Learn, Stream logs to an event hub |
| 18 | Graph activity log volume estimates (15 GiB/month at 1,000 users; 1,200 at 100,000); no filtering in diagnostic settings; transformations or Basic plan reduce cost | Four sign-in streams | verified (new) | Learn, Graph activity logs overview |
| 19 | Route Graph activity logs to same workspace as SignInLogs to cross-reference | Four sign-in streams | verified | Learn, identity logs you can stream |
| 20 | "This is the exact failure the repo's own boundary probe was written to catch … `01-entra-diagnostic-completeness.kql`" | Four sign-in streams | removed | Internal engine artefact, not citable and not to be named in the workbook |
| 21 | Portal path Entra ID > Monitoring & health > Diagnostic settings; Export Settings shortcut | Path A | verified | Learn, Stream logs to an event hub; Configure diagnostic settings |
| 22 | Setting name can't be changed later | Path A | verified | Learn: "If you're editing an existing integration, you can't change the name" |
| 23 | Data appears after roughly 15 minutes | Path A | corrected | General Entra guidance: up to three days; ID Protection page: around 15 minutes; Graph activity logs: within 30 minutes, occasionally 2 hours |
| 24 | KSI-MLA-EVC "requires" configuration "is persistently evaluated and tested" (quoted) | Path A note | corrected | FedRAMP Consolidated Rules for 2026 MLA page: EVC is configurations, especially IaC, continuously evaluated and tested; paraphrased, not quoted; KSI-MLA-LET added |
| 25 | `microsoft.aadiam/diagnosticSettings`, API 2017-04-01, tenant scope | Path B | verified | Learn ARM template reference |
| 26 | `retentionPolicy` honored only for storage accounts | Path B | corrected | Diagnostic-settings storage retention deprecated; all retention functionality disabled Sept 30, 2025; block removed from the Bicep; storage retention via lifecycle management, LA retention per table |
| 27 | Source cited a Data Factory REST page for the retention claim | Path B | corrected | Replaced with Azure Monitor migration page |
| 28 | `az monitor diagnostic-settings create` cannot create the Entra setting ("opaque failure") | Path C | restated | Learn: the command creates resource-scope settings by resource ID; "opaque failure" dropped as unverified |
| 29 | GET returns the categories a tenant supports | Path C | verified (reworded) | ARM reference: "perform a GET diagnostic settings operation" to obtain categories |
| 30 | Azure Government ARM endpoint management.usgovcloudapi.net | Sovereign clouds | verified | Learn, Compare Azure Government and global Azure |
| 31 | "GCC … stays on the worldwide ARM and Graph endpoints" | Sovereign clouds | verified | Graph national cloud deployments (GCC uses worldwide endpoints); feature-availability (GCC paired with Entra in commercial Azure) |
| 32 | Graph endpoints: graph.microsoft.us (L4/GCC High), dod-graph.microsoft.us (DoD); login.microsoftonline.us | Sovereign clouds | verified (new DoD row) | Learn, Graph national cloud deployments |
| 33 | Graph activity logs and signIns API available in US Gov L4/L5 | Sovereign clouds | verified (new) | Learn, Graph activity logs; List signIns |
| 34 | Sentinel Entra ID connector GA in Azure Government | Sovereign clouds | verified (new) | Learn, Sentinel feature support |
| 35 | Graph API "isn't designed for pulling large amounts of activity data" | Graph | verified | Learn, Analyze activity logs with Graph |
| 36 | v1.0 `signIns` returns interactive, non-interactive, SP and MI sign-ins | Graph endpoints | corrected | v1.0 List signIns returns interactive and successful federated sign-ins; other streams via beta with `signInEventTypes` filter |
| 37 | Graph returns only data within Entra default retention; page size max 1,000 | Graph | verified (new) | Learn, List signIns |
| 38 | `/beta/auditLogs/signUps` endpoint | Graph endpoints | removed | Sign-ups apply to external (customer) tenants; not relevant to workforce telemetry |
| 39 | AuditLog.Read.All least privilege for list directoryAudits and signIns; Get directoryAudit needs AuditLog.Read.All and Directory.Read.All | Permissions | verified | Learn, List/Get directoryAudit, List signIns |
| 40 | Supporting roles for delegated access | Permissions | corrected | Directory audits: Reports Reader, Security Administrator, Security Reader; sign-ins add Global Reader and Security Operator (source listed Global Reader for all) |
| 41 | appliedConditionalAccessPolicies omitted without Policy.Read.All / Policy.Read.ConditionalAccess / Policy.ReadWrite.ConditionalAccess | CA warning | verified | Learn, List signIns; user roles added (Global Reader, Security Administrator, Security Reader, Conditional Access Administrator) |
| 42 | "This is the repo's boundary-probe symptom #5" | CA warning | removed | Internal artefact |
| 43 | Recommend Policy.Read.ConditionalAccess as narrowest | CA warning | restated-as-design | Program choice among the three permissions Microsoft lists |
| 44 | Always apply createdDateTime filter; unbounded queries time out | Examples | verified | Learn, List signIns |
| 45 | `Get-MgAuditLogDirectoryAudit`, `Get-MgAuditLogSignIn` cmdlets | Examples | verified | Learn, Analyze activity logs with Graph |
| 46 | `Connect-MgGraph -Environment USGov`; `https://graph.microsoft.us/.default`; app registration in the national cloud's admin center | Examples | verified | Learn, Graph SDK national clouds |
| 47 | KQL used `count` and plain `union`; "absent from the result" means never received data | Verify | corrected | `count()` restored; `union isfuzzy=true` needed or a missing table fails the whole query (Kusto union reference); query rebuilt against an expected-table list with time bound |
| 48 | "This query is canon … executed by the GCC Boundary Probe adapter … DRIFT-BOUNDARY findings" | Verify | removed | Internal engine material |
| 49 | Sentinel connector writes same tables; "enabling both does not duplicate data" | Sentinel | removed (no-duplication claim); verified (same tables, needs read/write on diagnostic settings) | Learn, Sentinel Entra connector; duplicate-setting check stated as program design |
| 50 | "Expected EPS at 5,000 users" in Vol III Book 06 | Sentinel | removed | Not carried; link to the compliance volume instead |
| 51 | M-21-31 retention | Retention (new section) | corrected | M-26-14 rescinded M-21-31; 6 months searchable / 1 year retrievable, with definitions (notes 6 and 7); Appendix B item 5 identity and privilege-change logging |
| 52 | LA analytics retention up to 2 years; total up to 12 years via search jobs; default 30 days; per-table CLI/PowerShell; 30-day wait on shortening | Retention | verified (new) | Learn, Manage data retention in a Log Analytics workspace |
| 53 | 180-day analytics / 365-day total mapping to searchable/retrievable | Retention | restated-as-design | Program mapping of M-26-14 definitions onto LA retention states |
| 54 | AU-2, AU-3, AU-11, AU-12, AC-2, AC-6 control names | Throughout | verified | NIST OSCAL SP 800-53 Rev. 5 catalog 5.2.0 |
| 55 | "26 telemetry signals the FedRAMP Moderate boundary blocks outright" (B.1.3) | What this chapter doesn't cover | removed | Internal document reference, not verifiable here; boundary questions pointed to Book 10 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter (author, canon-source, repo-path, lifecycle) | — | Not carried: internal metadata |
| Prerequisites table | Before you start | Carried; licensing row expanded (Sentinel connector) |
| The log categories (table) | The log categories and their tables | Carried with two table-name corrections and source attributions |
| Tip: confirm table names against your workspace | The log categories (prose) and Verify emission | Merged |
| Warning: do not enable MicrosoftServicePrincipalSignInLogs | Warning callout | Carried |
| Why the four sign-in categories are not optional | Why all four sign-in streams are core | Carried; boundary-probe reference removed; volume and cost facts added |
| Path A — Portal | Path A: the portal | Carried; timing corrected |
| Note: portal fine for first tenant, wrong for fleet (KSI-MLA-EVC) | Note callout | Carried, KSI wording corrected, KSI-MLA-LET added |
| Path B — Tenant-scope ARM/Bicep | Path B | Carried; retentionPolicy removed |
| Important: retentionPolicy does nothing for Log Analytics | Important callout | Carried and corrected (feature disabled Sept 30, 2025) |
| Path C — az rest (PUT and GET) | Path C | Carried; ARM endpoint variable added for Azure Government |
| Note: Sovereign clouds | Sovereign clouds | Expanded into a GCC / GCC High / DoD table |
| Microsoft Graph — targeted evidence, not the feed | Microsoft Graph section | Carried |
| Endpoints table | Endpoints table | Carried; v1.0 signIns scope corrected; beta sign-ups removed |
| Permissions | Permissions | Carried; roles corrected |
| Warning: CA data separately gated | Warning callout | Carried; boundary-probe reference removed |
| Example — CA failures in a bounded window; PowerShell equivalent | Examples | Carried (dates updated); GCC High and DoD scope note expanded |
| Verify emission (KQL, absent vs stale) | Verify emission | Carried; query corrected and rebuilt |
| Important: this query is canon | — | Not carried: internal engine material |
| Sentinel data connector | Verify emission, final paragraph | Carried in part; no-duplication and EPS claims removed; link to Vol III Book 06 on GitHub |
| What this page does not cover | What this chapter doesn't cover | Carried; links to Ch04, Book 04, Book 10; B.1.3 reference removed |
| (new) Retention | Retention: what the logging baseline asks for | Added from M-26-14 and Log Analytics retention pages, replacing the source's forward reference to a crosswalk page |
