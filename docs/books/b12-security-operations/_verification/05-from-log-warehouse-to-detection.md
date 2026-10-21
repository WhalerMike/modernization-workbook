# Verification — Chapter 05, From Log Warehouse to Detection: SIEM and XDR

Writer W3. Source: `docs/compliance/Vol_III_Book_06_SIEM_XDR_Detection.md` (the detection-rule, playbook and incident-response sections went to Chapter 11; their ledger rows are here because this file covers the whole volume). All external sources opened October 21, 2026: Microsoft Learn through the Learn MCP tools (search and fetch), NIST SP 800-53 Rev. 5 from NIST's OSCAL catalog JSON on GitHub (usnistgov/oscal-content, parsed locally), OMB M-26-14 PDF text from whitehouse.gov, CISA and FedRAMP pages by fetch. No personal data was sent to any site. Nothing was executed against a tenant or workspace.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Source quoted AU-6 as "review and analyze system audit records for indications of inappropriate or unusual activity" | What AU-6 requires | corrected (full three-part text: review/analyze with frequency and potential impact; report; adjust on risk change) | NIST SP 800-53r5 OSCAL catalog, AU-6 |
| 2 | Source: AU-6(1) "explicitly" says manual ad hoc querying is not compliance | What AU-6 requires | corrected (AU-6(1) only requires integrating review/analysis/reporting with automated mechanisms; the chapter says the controls don't say a log store fails) | AU-6(1) text |
| 3 | AU-6(3), AU-6(4), SI-4, SI-4(2), SI-4(4), SI-4(5) text | What AU-6 requires | verified | NIST OSCAL catalog |
| 4 | Source: "AU-6 does not accept a log aggregator that has no detection rules" | SIEM vs aggregator note | restated-as-design | No control text says so; restated as what the controls imply plus program rule |
| 5 | M-26-14 Appendix B 5.k "Generating appropriate automated alerts"; Appendix C "logs generate actionable alerts", coverage tiers to 95%, detections routinely evaluated and tuned | What AU-6 requires | verified (new) | M-26-14 PDF, App. B and C |
| 6 | M-26-14: 6 months searchable / 1 year retrievable; definitions; records schedules not relieved; accurate timestamps, NTP | Retention; DNS section | verified | M-26-14 App. B items 1, 3 and notes 6–7 |
| 7 | Source: M-26-14 sets an "EL1 floor of 12 months active plus 18 months cold" and "five-level maturity model ... lowest watermark" | Retention | corrected (12/18 figures are M-21-31's; M-26-14 sets 6 months searchable, 1 year retrievable; five-level model exists, Levels 0–4) | M-26-14 App. B, App. C |
| 8 | FedRAMP 2026 KSI-MLA: logs persistently reviewed (RVL); SIEM used and reviewed (OSM) | What AU-6 requires | verified (paraphrased) | fedramp.gov 2026 MLA page |
| 9 | Source: FedRAMP 20x automation queries `SecurityAlert`/`SecurityIncident`; zero enabled rules "fails the KSI-MLA automated check" | (not carried) | removed | Not found on fedramp.gov KSI pages |
| 10 | Source: "2023 CISA/NSA advisory" on adversaries persisting months in federal tenants because logs were unmonitored | Opening | corrected (replaced with AA23-193A, CISA/FBI July 2023: an agency detected via `MailItemsAccessed` against a baseline; "not aware of other audit logs or events that would have detected this activity") | CISA AA23-193A |
| 11 | MTTD table "days to never" without SIEM | MTTD | restated-as-design (planning estimates, labeled) | — |
| 12 | MTTD table "minutes with Sentinel" | MTTD | corrected (replaced by the verified floor: scheduled interval 5 min–14 d plus 5-min delay; NRT 1-min cadence, 2-min delay, 50-rule cap, <12 h ingestion delay) | Learn: Scheduled analytics rules; NRT rules |
| 13 | `SecurityIncident` columns (CreatedTime, FirstActivityTime, ClosedTime, Status, Classification, Owner, RelatedAnalyticRuleIds, IncidentUrl) | MTTD and evidence queries | verified | Learn: SecurityIncident table reference |
| 14 | Assessor asks for "an alert in the last 30 days, the incident, and documentation" | Evidence standard | restated-as-design (practitioner experience, not a published FedRAMP procedure; adopted as program standard) | — |
| 15 | Four-part evidence record | Evidence standard | restated-as-design | — |
| 16 | Sentinel supported only in Defender portal after March 31, 2027; GA in Defender portal with or without XDR | Where Sentinel runs | verified (source predates; date extended from July 2026) | Learn: Sentinel in the Defender portal |
| 17 | Defender portal: GA features in commercial, GCC, GCC High, DoD; preview only commercial | Where Sentinel runs | verified | Learn: Sentinel feature availability |
| 18 | GCC pairs with Entra ID in commercial Azure; GCC High/DoD with Azure Government | Where Sentinel runs | verified | Learn: Cloud feature availability for US Government |
| 19 | Azure Gov availability: ASIM preview both; Repositories not in Gov; peer/blast-radius not in Gov; Entra ID, ID Protection, XDR, CEF/Syslog via AMA, Windows Security Events via AMA, TAXII, automation rules, NRT, UEBA anomalies GA both; MDTI matching analytics not in Gov | Several | verified | Learn: Sentinel feature availability |
| 20 | Defender XDR connector: GCC GA (Azure), GCC High GA (Azure Gov), DoD not available | Where Sentinel runs | verified | Learn: Cloud feature availability for US Government, Sentinel table |
| 21 | Entra ID connector log types and tables (incl. AADProvisioningLogs, MicrosoftGraphActivityLogs, NetworkAccessTraffic); P1/P2 for sign-in logs; Workload ID Premium for risky SP tables | Entra ID | verified | Learn: Entra ID data connector |
| 22 | Source: "Azure Active Directory connector" | Entra ID | corrected (Microsoft Entra ID connector) | Same |
| 23 | `SigninLogs.ResultType` string, "0" success; `MfaDetail` deprecated; `AuthenticationDetails` | Entra ID | verified (source used numeric comparison and MfaDetail) | Learn: SigninLogs table reference |
| 24 | Defender XDR connector streams incidents, alerts, hunting events; auto-enabled when onboarded to Defender portal | Defender XDR | verified | Learn: Connect Defender XDR |
| 25 | Streamable tables list, GA in GCC/GCC High/DoD | Defender XDR | verified | Learn: Supported streaming event types |
| 26 | Source tables `DeviceAlertEvents`, `DeviceVulnerabilityAssessmentEvent` | Defender XDR | corrected (not in streamable list; vulnerability tables not streamed; KEV rule moved to Defender alerts/Ch06) | Same |
| 27 | Source: "Microsoft 365 Defender connector" | Defender XDR | corrected (Microsoft Defender XDR) | Same |
| 28 | Source: Infoblox via CEF to "Log Analytics agent"; `CommonSecurityLog` `DeviceVendor == "Infoblox"`; event classes `DNS_RPZ`, `DHCP_LEASE`, `DNS_DNSSEC_FAIL` | DNS and DDI | corrected (NIOS sends syslog to `Syslog` with solution parser, works with Syslog via AMA, legacy agent deprecated; Infoblox cloud via CDC via AMA to `CommonSecurityLog`; event-class names not verifiable, dropped) | Learn: Syslog via AMA device config (Infoblox NIOS); Sentinel tables and connectors |
| 29 | AMA forwarder architecture: rsyslog/syslog-ng on 514, AMA, DCRs, Syslog vs CommonSecurityLog, duplication caution, TimeGenerated vs EventTime | DNS and DDI | verified | Learn: Syslog and CEF via AMA overview |
| 30 | ASIM DNS parsers: Infoblox NIOS (also BIND, BlueCat), BloxOne, Zscaler ZIA; `_Im_Dns` params; DnsQuery, SrcIpAddr, EventResultDetails | DNS and DDI | verified | Learn: ASIM parsers list; ASIM DNS schema |
| 31 | Windows DNS Events via AMA | DNS and DDI | verified (link to Book 08 Ch11, which cites it) | Learn: Sentinel feature availability |
| 32 | Source EPS estimates (6–7 EPS DNS, 0.6–2.3 Entra, 300–700 MDE, 100–500 SASE, 5–20 SQL); "Standard_B2s" forwarder | (not carried) | removed (unverifiable planning numbers) | — |
| 33 | Zscaler: CEF over TCP 514; Cloud NSS push connectors to `CommonSecurityLog` | SASE | verified | Learn: CEF via AMA device config (Zscaler); tables and connectors |
| 34 | Source: Netskope tables `Netskope_CL`, `NetskopeAlerts_CL` via "Cloud Exchange" | SASE | corrected (connector reference lists `NetskopeAlerts_CL` and other custom tables; `Netskope_CL` not found; told to take names from the reference) | Learn: tables and connectors |
| 35 | SI-4(4) application-layer telemetry requires an application-aware enforcement point | SASE | restated-as-design | — |
| 36 | Azure SQL audit to `AzureDiagnostics` category `SQLSecurityAuditEvents` | SQL audit | verified | Learn: SQL Database audit log format |
| 37 | Source: Arc SQL Server audit logs go to `AzureDiagnostics` via AMA | SQL audit | corrected (SQL Server audit to Windows Security log → Windows Security Events via AMA → `SecurityEvent`; requires "application generated" and generate-security-audits) | Learn: Write SQL Server Audit events to the Security log |
| 38 | Event 33205 "Audit event" | SQL audit | verified (message catalog); placement in Windows log flagged "confirm on a test instance" | Learn: Database Engine events and errors 31000–41399 |
| 39 | Defender for SQL Servers on Machines alerts; Arc onboarding | SQL audit | verified | Learn: Defender for SQL on Machines overview |
| 40 | Source: TAXII indicators into `ThreatIntelligenceIndicator` | Threat intelligence | corrected (`ThreatIntelIndicators`/`ThreatIntelObjects`; legacy table stopped July 31, 2025) | Learn: Threat intelligence in Sentinel |
| 41 | Source: Infoblox TIDE TAXII URL `csp.infoblox.com/ti-taxii/taxii2/`; polling 60 min; 5,000–50,000 indicators; TI map rules every 15 min | (not carried) | removed (vendor URL and volumes not verified; TI map cadence not verified) | — |
| 42 | `SentinelHealth` supported only for listed connectors; Microsoft's latest-failure query; Azure Monitor alerts recommended | Proving the connectors | verified | Learn: Monitor the health of your data connectors |
| 43 | Freshness, per-device and `_Im_Dns` health queries | Proving the connectors | restated-as-design (thresholds are program design; columns verified in items 13, 21, 25, 29, 30) | — |
| 44 | `Invoke-AzOperationalInsightsQuery -WorkspaceId -Query -Wait`; `.Results`; LINQ ToArray | Proving the connectors | verified | Learn: Invoke-AzOperationalInsightsQuery |
| 45 | UEBA: `BehaviorAnalytics.InvestigationPriority` 0–10 per event; `Anomalies.AnomalyScore` 0–1; IdentityInfo, UserPeerAnalytics | UEBA | verified | Learn: Advanced threat detection with UEBA |
| 46 | Source: priority score is a continuously updated per-user score fed by ID Protection; "review above 7 daily"; compound score "9–10" | UEBA | corrected (per-event score); daily review restated-as-design; compound-score claim removed | Same |
| 47 | UEBA data sources (both portals vs Defender-only; CommonSecurityLog Check Point/Fortinet/Zscaler; AD via MDI) | UEBA | verified | Learn: Enable UEBA |
| 48 | Source cmdlet `Set-AzSentinelUeba -DataSources` | (not carried) | removed (not found; UI path described instead) | — |
| 49 | Source: SASE flow logs into UEBA via the Microsoft 365 Defender connector | UEBA | corrected (UEBA reads supported `CommonSecurityLog` events, Defender portal only) | Learn: Enable UEBA |
| 50 | Defender portal: Defender creates incidents; Microsoft security rules disabled on onboarding; incident setting must stay enabled | Defender XDR's role | verified | Learn: Scheduled analytics rules |
| 51 | Defender XDR correlates endpoints, identities, email/collaboration, SaaS into incidents; attack disruption actions, Action Center, undo, exclusions | Defender XDR's role | verified | Learn: Automatic attack disruption; exclusions |
| 52 | Microsoft recommends custom detections as the preferred way to create new rules across Sentinel and XDR | Defender XDR's role | verified (paraphrased) | Learn: Work with NRT rules (Important note) |
| 53 | Division of labor between XDR and Sentinel | Defender XDR's role | restated-as-design | — |
| 54 | Control-closure table | Controls | restated-as-design | NIST text items 1–3 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, FOUO banner, "Draft Proposal" box, Date Code | — | Stamps dropped per brief |
| Series Context box | Ch05 opening paragraphs | Internal volume cross-references replaced with book links |
| What This Document Addresses | Ch05 opening | Four-mechanism summary condensed; agency-scale numbers dropped |
| SIEM vs. Log Aggregator note | Ch05 Warehouse versus detection engine | "AU-6 does not accept" restated (claim 4) |
| What AU-6 Actually Requires | Ch05 What AU-6 requires | Corrected text (claims 1–2) |
| Mean Time to Detect Without a Detection Engine (table and advisory) | Ch05 Mean time to detect; opening (AA23-193A) | Table rebuilt around verified latency floors (claims 11–12); advisory corrected (claim 10) |
| The FedRAMP Assessor Evidence Standard | Ch05 The assessor evidence standard | Restated as program standard (claims 14–15); sampling query added |
| Connector Architecture: Overview | Ch05 connector architecture intro and figure | — |
| Connector: InfoBlox NIOS Syslog (CEF/Syslog), with PowerShell check | Ch05 DNS and DDI appliances; Proving the connectors | Path corrected (claim 28); EPS dropped (claim 32); check rewritten as KQL plus a PowerShell wrapper |
| Connector: Entra ID, with PowerShell health loop | Ch05 Microsoft Entra ID; Proving the connectors | Tables updated (claims 21–23); loop replaced by one union query |
| Connector: Microsoft Defender for Endpoint (Microsoft 365 Defender) | Ch05 Microsoft Defender XDR | Tables corrected (claims 25–27); same-geography claim not verified, dropped |
| Connector: SASE (Zscaler or Netskope) | Ch05 SASE and secure web gateway | Corrected (claims 33–34) |
| Connector: SQL Audit Logs | Ch05 SQL audit | Corrected (claims 36–39) |
| Connector: InfoBlox TIDE via TAXII | Ch05 Threat intelligence | Vendor specifics dropped (claim 41); table corrected (claim 40) |
| Log Analytics Workspace Retention Configuration (table, PowerShell, AU-11 note) | Ch05 Retention, briefly; Ch12 | Retention tiers, `Set-AzOperationalInsightsTable` script, NARA GRS 3.2 three-year claim and cost ratios not carried here: Ch12 owns retention evidence; GRS 3.2 claim not verified |
| Detection Engineering Lifecycle | Ch11 Rule lifecycle and testing | — |
| Priority Detection Rules (each rule) | Ch11 rule library table and example rules | See Ch11 verification file |
| Additional Priority Rules table (11–20) | Ch11 rule library table | Condensed; overlapping rows merged |
| UEBA (What UEBA provides, Key signals, ID Protection integration, cmdlet) | Ch05 User and entity behavior analytics | Corrected (claims 45–49) |
| Defender for Identity integration during AD transition | Ch05 UEBA (last paragraph) | "Phase E" internal label dropped |
| Incident Automation: Automation architecture | Ch11 Playbooks | — |
| Playbook: Auto-suppress known false positives (JSON) | Ch11 Suppression of known-benign incidents | JSON not carried: property names (`IncidentRelatedAnalyticRuleNames`) not verified; described with verified automation-rule capabilities |
| Playbook: Auto-enrich incidents | Ch11 Enrich and ticket | Graph URLs not carried; enrichment set kept |
| Playbook: Auto-isolate device (PowerShell, warning) | Ch11 Device isolation | Endpoint, auth and trigger corrected (see Ch11 file) |
| Playbook: Auto-disable account | Ch11 Account disablement | Hybrid caveat added (see Ch11 file) |
| Incident Response Plan Structure: 800-61 mapping | Ch11 The incident response plan | — |
| The Seven IR Artifacts | Ch11 The incident response plan | Restated as program design; "20–40 pages" not carried |
| CISA Reporting Threshold note | Ch11 The incident response plan | Re-sourced to CISA Federal Incident Notification Guidelines; "major incident" definition and M-24-04 not carried (not verified in this pass) |
| AU-11 Retention Architecture: three tiers, M-26-14 note, WORM PowerShell | Ch05 Retention, briefly; Ch12 | M-26-14 figures corrected (claim 7); WORM script and tiers left to Ch12 |
| Cost Model; Commitment Tier note | — | Pricing figures not verified; not carried |
| NIST Control Closure: Closure Necessity (SI-4(4)) | Ch05 SASE section, last paragraph | Restated as design (claim 35) |
| NIST Control Closure table | Ch05 Controls table; Ch11 Controls table | Split by chapter; AU-7, AU-8 rows not carried (AU-8 point kept as the timestamp note in DNS section) |
| FedRAMP 20x KSI Alignment | Ch05 What AU-6 requires (KSI-MLA); Ch11 IR plan (KSI-INR) | Automation claims removed (claim 9) |
