// Building the Daily Checks Workbook, Chapter 03 — What Each Tab Would Show: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/daily-checks/03-what-each-tab-would-show.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-dc-03-what-each-tab-would-show/build.js
require("../_build/devwb.js")({
  workbook: "dc", chapter: 3, dir: __dirname,
  base: "DW_DC_03_What_Each_Tab_Would_Show",
  title: "What Each Tab Would Show",
  map: "Why an empty queue proves nothing · what Learn gives and leaves · the render rules · reachability · the replication probe · who · two labs · evidence",
  slides: [
    {
      say: `Welcome back to Building the Daily Checks Workbook. This is Chapter 3: what each tab would show. An empty queue over a source that stopped arriving looks exactly like a quiet night, and the renderer in this chapter says which one it is. We'll see what Microsoft Learn and the operator runbook give you, the renderer's rules, the read-only reachability check and the replication probe, then walk two mornings in the fictional workspace, one of them with a domain controller gone silent. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.`,
      detail: `The chapter is the code behind the guide's Step 5 and the validation in its Step 1. It starts with the telemetry-completeness pattern, SentinelHealth, and Intune's export timing. Then the renderer's rules, the reachability check and the replication probe. Lab 1 renders the fictional workspace on the morning the Entra diagnostic setting stopped, the sync probe didn't run and a domain controller went silent, then the next morning, runs the replication probe on saved repadmin output, checks the tables' reachability, and shows that the kit won't record a render as evidence. Lab 2 runs the reachability check against a test workspace.`,
      cite: [],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why an empty queue proves nothing",
      body: [
        { lead: "A dashboard's most dangerous state isn't red. It is green over a source that stopped arriving." },
        { cols: [[{ bullets: [
          "Show, **without a tenant**, what each tab would display on a given morning",
          "Tell an operator which tabs **can't be trusted** because their source went quiet",
          "Prove each tab's tables **answer** in a real workspace",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers",
          "Security operations",
          "The operators who read the workbook each morning",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 03, opening, “Goal and audience.”",
      say: `Why this chapter? A dashboard's most dangerous state isn't red. It's green over a source that stopped arriving. A risk queue with no rows can mean nobody is at risk, or that the sign-in logs stopped coming in last night. By the end of the chapter you can show, without a tenant, what each tab would display on a given morning; tell an operator which tabs can't be trusted because their source went quiet; and prove each tab's tables answer in a real workspace. It's for developers, security operations, and the operators who read the workbook each morning.`,
      detail: `Goal: show, without a tenant, what each tab would display on a given morning; tell an operator which tabs can't be trusted because their source has gone quiet; and prove each tab's tables answer in a real workspace. Audience: developers, security operations, and the operators who read the workbook each morning.`,
      cite: [],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "What", title: "What Learn and the runbook give you",
      body: [
        { table: { head: ["Source", "What it gives"], w: [3.5, 8.65], rows: [
          ["The runbook's completeness check", "Each expected table past its freshness limit; union isfuzzy=true, so a missing table shows as a null"],
          ["Sentinel's health page", "The query for each connector's latest failure; Azure Monitor alert rules recommended for health drifts"],
          ["Intune to Azure Monitor", "Compliance exported once every 24 hours, up to 48 hours; don't rely on a fixed completion time"],
          ["The Azure CLI", "az monitor log-analytics query, by the workspace's GUID, from the log-analytics extension"],
          ["Heartbeat query samples", "“Unavailable computers”: each computer's latest Heartbeat"],
          ["repadmin /showrepl * /csv", "Each link's last success, last failure and status; Enterprise Admins or equivalent to read it"],
          ["Logs Ingestion API", "A JSON array posted to the data collection rule's stream"],
        ] }, pt: 12 },
      ],
      sources: "Sources: operator runbook (Compliance Automation & Day-2 Operations, Ch 12); Learn, Sentinel health; Intune; az monitor; Heartbeat; repadmin; Logs Ingestion API.",
      say: `Here's what you start with. The operator runbook's completeness check lists each expected table past its freshness limit, and it uses a fuzzy union, so a missing table shows up as a null instead of failing the query. Sentinel's health page gives the query for each connector's latest failure, and recommends Azure Monitor alert rules for health drifts. Microsoft's Intune page says compliance is exported once a day and can take up to forty-eight hours, and not to rely on a fixed completion time. The Azure command line can run a query against a workspace, from its log analytics extension. Learn's unavailable-computers query takes each computer's latest heartbeat. The replication report gives each link's last success, last failure and status, and reading it forest-wide needs Enterprise Admins or equivalent. And the Logs Ingestion API takes a list of records posted to a collection rule's stream.`,
      detail: `Compliance Automation and Day-Two Operations, Chapter 12's telemetry-completeness check lists each expected table past its freshness limit, using union isfuzzy=true so a missing table shows as a null rather than failing the query. Sentinel's health page gives the SentinelHealth query for each connector's latest failure, and recommends Azure Monitor alert rules for health drifts. Intune's diagnostic settings export compliance once every 24 hours, and it "can take up to 48 hours" to arrive; Microsoft says not to "rely on a fixed or previously observed completion time." az monitor log-analytics query runs a KQL query against a workspace by its GUID; it comes from the Azure CLI's log-analytics extension. Learn's "Unavailable computers" query takes each computer's latest Heartbeat. repadmin /showrepl * /csv reports each replication link's last success, last failure and last failure status, and reading it forest-wide needs Enterprise Admins or equivalent; the Logs Ingestion API takes a JSON array posted to the data collection rule's stream.`,
      cite: ["dc03-health", "dc03-intune", "dc03-cli", "dc03-heartbeat", "dc03-repadmin", "dc03-ingest"],
      ref: "“Start with Microsoft's documentation” — “What Microsoft gives you”",
    },
    {
      part: "What", title: "The render rules, in order",
      body: [
        { steps: [
          { title: "LINK-OUT", text: "the tab's check lives in another portal" },
          { title: "NO DATA", text: "no query result at all" },
          { title: "STALE", text: "any source past its freshness limit; the rows shown may be incomplete" },
          { title: "ATTENTION", text: "any row the tab's rule flags" },
          { title: "NO DATA", text: "no rows where a row is expected (the probe)" },
          { title: "CLEAR", text: "nothing to work, and every source fresh" },
        ] },
        { callout: "a stale source never renders CLEAR. The render carries the banner, and the kit refuses to record it as evidence.", label: "The rule: ", color: "red", icon: "FaTriangleExclamation" },
      ],
      sources: "Sources: examples/daily-checks-workbook (Get-DcRender). Chapter 03, “The code” — “The render rules.”",
      say: `Here are the renderer's rules, in order. A link-out tab shows LINK-OUT. No query result at all shows NO DATA. If any source the tab depends on is past its freshness limit, the tab shows STALE, and says the rows it does show may be incomplete. Otherwise, any row the tab's rule flags shows ATTENTION. No rows where a row is expected, like the morning probe, shows NO DATA. And only then, CLEAR. So a stale source never renders clear. The render carries the banner, and the kit refuses to record it as evidence.`,
      detail: `Each workbook tab's render rule in the manifest has freshness (source table to limit in minutes), emptyMeans (clear or no-data) and flag (the rows that need work: any, eq a value, or older-than-column for the telemetry rows). Get-DcRender reads one fixture file per tab and decides, in order: a link-out tab shows LINK-OUT; no result shows NO DATA; any source past its limit shows STALE and says the rows shown may be incomplete; any flagged row shows ATTENTION; no rows where a row is expected shows NO DATA; otherwise CLEAR. Invoke-DcRender.ps1 writes render.json and render.md, both with the banner, and a manifest marked notEvidence. The output depends only on -AsOf and the fixtures: a test renders twice, once under another culture, and compares the hashes.`,
      cite: [],
      ref: "“The code” — “The render rules”",
    },
    {
      part: "What", title: "What it leaves to you, and reachability",
      body: [
        { table: { head: ["Learn, as published", "What the kit adds"], w: [5.0, 7.15], rows: [
          ["The completeness query lists dark tables", "Each tab names its sources and limits; a stale source makes the tab STALE"],
          ["A query result is rows or no rows", "emptyMeans: an empty probe is NO DATA; an empty risk queue over fresh sources is CLEAR"],
          ["Intune's timing is variable", "The devices tab's limit is 48 hours"],
          ["A screenshot is easy to file", "The banner on the render; Write-DcEvidence refuses it"],
          ["No reachability check", "Newest record and count per table: Delivering, Late or Missing"],
          ["“Unavailable computers” lists only servers that once reported", "One row per server from the settings; an empty heartbeat is flagged"],
          ["repadmin prints a CSV in local time on one host", "Invoke-DcReplicationProbe: a record per link, a verdict, UTC, sent with -Send"],
        ] }, pt: 11.5 },
      ],
      sources: "Sources: Chapter 03, “What it leaves to you,” “The reachability check,” “The replication probe”; tests/DailyChecks.Tests.ps1, deploy/tests.",
      say: `What does it leave to you? The other tabs don't know their table is dark, so each tab names its own sources and limits, and says what empty means. Intune's timing is variable, so the devices tab allows forty-eight hours. A screenshot is easy to file as evidence, so the render carries the banner and the kit refuses it. Nothing proves each tab's tables answer, so the kit asks the workspace for each table's newest record and count: delivering, late or missing. Learn's unavailable-computers query lists only servers that once reported, so the sync and Active Directory tabs start from the settings' server lists, one row each. And the replication report is a file in local time on one host, so the kit's probe turns it into one record per link, with a verdict and times in U T C, and sends it to the workspace.`,
      detail: `Each row is pinned by a test in the Chapter 03 block of tests/DailyChecks.Tests.ps1, or in deploy/tests. Test-DcReachability sends, for each table any tab reads, "<table> | where TimeGenerated > ago(3d) | summarize LastSeen = max(TimeGenerated), Records = count()" with az monitor log-analytics query, and compares the age with the table's limit. It reads only. -FixturePath reads saved answers instead, as Lab 1 does. Rows can carry their own limit: the sync and Active Directory tabs' per-server rows have HeartbeatLimitMin (60) and, for the synchronization servers, BackupLimitMin (1,560), so a server that stopped sending is ATTENTION, never quiet. ConvertFrom-DcRepadminCsv reads repadmin /showrepl * /csv and writes one record per link (DestinationDc, SourceDc, NamingContext, Failures, LastSuccessUtc, LastFailureUtc, LastFailureStatus, Verdict: failing when the last status isn't 0); Invoke-DcReplicationProbe.ps1 writes probe.json and a hashed manifest (task probe), exits 1 if any link fails, and with -Send posts the records with az rest to the data collection rule's stream (api-version=2023-01-01, token audience https://monitor.azure.com). It reads the directory and changes nothing.`,
      cite: ["dc03-intune", "dc03-cli", "dc03-heartbeat", "dc03-repadmin", "dc03-ingest"],
      ref: "“What it leaves to you”; “The code” — “The reachability check,” “The replication probe”",
    },
    {
      part: "Who", title: "Who reads it, and who fixes the source",
      body: [
        { cols: [[{ bullets: [
          "**Operators**: telemetry first, then their family's tabs; each finding becomes a task",
          "**Security operations**: each dark source, as a high-severity task",
          "**ISSO**: keeps the reachability and probe records, never the render",
        ], label: "Roles", color: "teal", pt: 14 }], [{ bullets: [
          "Lab 1: nothing; saved results only",
          "Lab 2: **Log Analytics Reader** on the test workspace",
          "The check sends only queries",
          "The live probe: **Enterprise Admins** or equivalent, so a Tier 0 host only (Chapter 04)",
        ], label: "What each lab needs", color: "navy", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 03, “Goal and audience,” “Lab 2,” “Verified facts,” “Checklist.”",
      say: `Who does what? Operators read the telemetry tab first, then their own family's tabs, and each finding becomes a task. Security operations treats each dark source as a high-severity task. And the security officer keeps the reachability and probe records, never the render. Lab 1 needs only saved results. Lab 2 needs Log Analytics Reader on a test workspace, which can view and search the monitoring data, and the check sends only queries. The live replication probe is different: reading replication needs Enterprise Admins or equivalent, so Chapter 4 runs it only on a Tier 0 host, or not at all.`,
      detail: `Lab 2: signed in as a person with Log Analytics Reader on the workspace ("View and search all monitoring data"). Checklist: the telemetry tab is read first, and each dark source has a task; no tab is read as clear while its source is stale; the reachability check passes in the test workspace, and its record is in the evidence; no render or screenshot is in the evidence package; every synchronization server and domain controller has a heartbeat row, and none is past its limit. Dangers: a Tier 0 probe run from a lower tier (Enterprise Admins credentials on an ordinary server): Chapter 04 runs the probe only on a Tier 0 host, or not at all.`,
      cite: ["dc03-access", "dc03-repadmin"],
      ref: "“Goal and audience”; “Lab 2”; “Checklist”",
    },
    {
      part: "How", title: "Lab 1: the morning the logs stopped",
      body: [
        { terminal: "03-1", lines: "1-15" },
        { terminal: "03-2" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures, November 16, 2026). Chapter 03, “Lab 1,” steps 1–2.",
      say: `Lab 1. Step 1 renders the morning of November sixteenth in the fictional workspace. The Entra diagnostic setting stopped at ten past five the evening before, and the sync probe didn't run. Telemetry flags four rows: sign-in and audit logs are dark, the probe's table is dark, and the Office 365 connector's latest health event is a failure. The sync, risk, emergency access, grants and admin changes tabs are all STALE, even the sync server's two overnight export errors. The Active Directory tab's sources are fresh, so it can be read: the third domain controller went silent at seven the evening before, and both links from it are failing. Step 2 shows why the risk tab isn't clear: no rows, but its source stopped fourteen hours ago.`,
      detail: `Step 1: ./Invoke-DcRender.ps1 -FixturePath tests/fixtures/day1 -AsOf 2026-11-16T07:30:00Z -OutputPath out/day1. Telemetry completeness ATTENTION, 4 of 14 rows need work; Synchronization probe STALE, DailySyncProbe_CL 1500 min old (limit 1440), the 4 rows shown may be incomplete (including the two export errors the synchronization server logged overnight); Active Directory ATTENTION 4 of 8 (CTX-DC-03 stopped sending a heartbeat at 19:00, both links from it are failing, and the knowledge consistency checker logged event 1311); Entra Health alerts LINK-OUT; Risky users and sign-ins STALE, SigninLogs 860 min old (limit 60); Emergency access sign-ins STALE; Noncompliant devices ATTENTION 3 of 3; Consents, roles and grants STALE, AuditLogs 860 min old, the 2 rows shown may be incomplete; Admin changes STALE, the 2 rows shown may be incomplete; DLP and label alerts ATTENTION 1 of 1; Catalog and remediation tasks LINK-OUT; Log review queue ATTENTION 2 of 2. Step 2: Get-Content tests/fixtures/day1/risk.json: rows empty; SigninLogs last 2026-11-15T17:10:00Z.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: the next morning",
      body: [
        { terminal: "03-3", lines: "1-15" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures, November 17, 2026). Chapter 03, “Lab 1,” step 3.",
      say: `Step 3 renders the next morning. The setting is back, and telemetry is clear. Now the queues show what they were hiding: one user at high risk, one emergency access sign-in, which turns out to be the quarterly validation drill, and the review records it as a drill, and one synchronization conflict. The staging synchronization server wrote no backup event, so it's flagged too. The admin changes tab lists yesterday's five request-driven changes, each to be matched to its ticket. Grants, D L P alerts and Active Directory are clear, and this time clear means something, because their sources are fresh.`,
      detail: `Step 3: ./Invoke-DcRender.ps1 -FixturePath tests/fixtures/day2 -AsOf 2026-11-17T07:30:00Z -OutputPath out/day2. Telemetry completeness CLEAR, 13 rows, none flagged; Synchronization probe ATTENTION 2 of 3 (one PropertyConflict, verdict drift; the staging synchronization server wrote no backup event); Active Directory CLEAR, 8 rows, none flagged, and only because its sources are fresh; Risky users and sign-ins ATTENTION 1 of 1 (one user at high risk); Emergency access sign-ins ATTENTION 1 of 1 (the quarterly validation drill); Noncompliant devices ATTENTION 1 of 1; Consents, roles and grants CLEAR; Admin changes ATTENTION 5 of 5 (yesterday's five request-driven changes, each to match to its ticket); DLP and label alerts CLEAR; Log review queue ATTENTION 1 of 1.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” step 3",
    },
    {
      part: "How", title: "Lab 1: the replication probe",
      body: [
        { terminal: "03-4" },
        { callout: "without -Send it writes probe.json and sends nothing. A failing link makes it exit 1: that is a finding, not a broken script.", label: "Note: ", color: "teal" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures, saved repadmin output). Chapter 03, “Lab 1,” step 4; “The replication probe.”",
      say: `Step 4 runs the replication probe on the first morning's saved replication report. Without the send switch, it writes its file and sends nothing. Four links between the fictional domain controllers. Two are healthy. Two are failing, nine failures each, with status seventeen twenty-two, and both come from the third domain controller, the one that went silent. The script exits with an error, because a failing link is a finding. That record, not the tab, is what Chapter 4 sends to the workspace each morning.`,
      detail: `Step 4: ./Invoke-DcReplicationProbe.ps1 -SettingsPath tests/fixtures/settings.lab.json -InputPath tests/fixtures/repl/showrepl-day1.csv -OutputPath out/probe -AsOf 2026-11-16T06:00:00Z: CTX-DC-01 from CTX-DC-02 healthy; CTX-DC-01 from CTX-DC-03 9 failures, last success 2026-11-15T19:02:08Z, status 1722, failing; CTX-DC-02 from CTX-DC-01 healthy; CTX-DC-02 from CTX-DC-03 9 failures, status 1722, failing. "4 links, 2 failing; not sent (no -Send). Written to out/probe: probe.json, manifest.json"; exit code 1. repadmin prints the host's local time; -TimeZoneId names the zone and the records carry UTC.`,
      cite: ["dc03-repadmin"],
      ref: "“The code” — “The replication probe”; “Lab 1: fixtures, no tenant,” step 4",
    },
    {
      part: "How", title: "Lab 1: reachability, and a refused render",
      body: [
        { terminal: "03-5", lines: "1-17" },
        { terminal: "03-6" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures). Chapter 03, “Lab 1,” steps 5–6.",
      say: `Step 5 checks each table's reachability on the first morning, from saved answers. Sign-in logs, audit logs and the probe's table are late, and the Sentinel health table is missing altogether: health monitoring was never turned on in this workspace. The servers' heartbeat, event and security event tables are all delivering. The script exits with an error. Step 6 tries to record the first morning's render as evidence. The kit refuses: a rendered view is not evidence.`,
      detail: `Step 5: ./deploy/Test-DcReachability.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/reach-day1.json -OutputPath out/reach -AsOf 2026-11-16T07:30:00Z: AuditLogs Late 860 of 60; DailySyncProbe_CL Late 1500 of 1440; SentinelHealth Missing, table not found; SigninLogs Late 860 of 60; the others Delivering, among them AzureActivity, DcReplicationProbe_CL, Event, Heartbeat and SecurityEvent; exit code 1. Step 6: ./Invoke-DcEvidence.ps1 -EvidencePath out/evidence -RunPath out/day1: Exception: A rendered view is not evidence. Record the check's own output instead (the probe's result, the alert, the closed task), or the kit's validate, plan, deploy and reachability runs.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 5–6",
    },
    {
      part: "How", title: "Lab 1: record what the checks found",
      body: [
        { terminal: "03-7" },
        { terminal: "03-8" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures). Chapter 03, “Lab 1,” steps 7–8.",
      say: `Step 7 records the reachability check and the probe instead. Records one and two, both with result Fail: each record keeps what its check found, with continuous monitoring and system monitoring, and their indicators. A failing record is still evidence; it's evidence of the gap. Step 8 runs this chapter's tests and the evidence tests: twenty-seven passed, none failed.`,
      detail: `Step 7: ./Invoke-DcEvidence.ps1 -EvidencePath out/evidence -RunPath out/reach -AsOf 2026-11-16T07:32:00Z: Record 1: reachability Fail (REACH, EVIDENCE); then -RunPath out/probe -AsOf 2026-11-16T07:33:00Z: Record 2: probe Fail (PROBE, EVIDENCE); both Controls AU-9, CA-7, SI-4; KSIs KSI-MLA-EVC, KSI-MLA-LET, KSI-MLA-OSM. Step 8: Invoke-Pester -Path tests/DailyChecks.Tests.ps1 -FullNameFilter 'Chapter 03*', 'Evidence*': 27 passed, 0 failed. Then Remove-Item -Recurse -Force out.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 7–8",
    },
    {
      part: "How", title: "Lab 2, evidence and dangers",
      body: [
        { code: [
          "az cloud set --name AzureCloud",
          "az login --tenant <tenant-id>",
          "az extension add --name log-analytics",
          "./deploy/Test-DcReachability.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/reach",
          "az logout",
        ], label: "Lab 2, a test workspace: read-only; not run by the authors", pt: 11.5 },
        { table: { head: ["Output", "Supports", "KSI"], w: [6.2, 2.9, 3.05], rows: [
          ["Each tab's tables answer, with their age (reach.json)", "CA-7, SI-4", "KSI-MLA-EVC, KSI-MLA-LET"],
          ["Every replication link's last result (probe.json)", "CA-7, SI-4", "KSI-MLA-EVC, KSI-MLA-LET"],
          ["The render is refused as evidence", "CA-7", "KSI-MLA-EVC"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 03, “Lab 2,” “Federal requirements and evidence,” “Dangers.” KSIs: FedRAMP 20x indicators for providers.",
      say: `Lab 2 runs the same reachability check against a test workspace, never production; the authors haven't run it. Sign in to commercial Azure, add the log analytics extension, run the check, and sign out. Every table should be delivering; each late or missing one becomes a task. The reachability record and the probe's record support continuous monitoring and system monitoring. The dangers you saw: a missing connector that looks healthy, a missed probe showing yesterday's green, a silent server read as a quiet one, and a render filed as evidence. Next, Chapter 4 deploys the workbook.`,
      detail: `Lab 2 placeholders: <tenant-id>, <settings-file>, <output-folder> (outside any repository). Back out: az logout; Remove-Item -Recurse -Force <output-folder>/reach if this was a rehearsal. Federal requirements: each tab's tables answer, with their age (Lab 1, step 5; Lab 2, step 2: reach.json) supports CA-7 and SI-4 (KSI-MLA-EVC, KSI-MLA-LET); a stale source shown as STALE supports SI-4; every replication link's last result (Lab 1, step 4: probe.json) supports CA-7 and SI-4 (KSI-MLA-EVC, KSI-MLA-LET); the render refused as evidence supports CA-7. The kit's records support these controls; the agency's assessor decides them. Dangers: a missing connector looks healthy; a missed probe shows yesterday's green verdict; a render filed as evidence; a silent server read as a quiet one (one row per server from the settings); a Tier 0 probe run from a lower tier (Chapter 04: a Tier 0 host only, or not at all); a reachability check with write rights.`,
      cite: [],
      ref: "“Lab 2: a test workspace”; “Federal requirements and evidence”; “Dangers”",
    },
  ],
});
