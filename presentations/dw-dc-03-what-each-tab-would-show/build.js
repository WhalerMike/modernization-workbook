// Building the Daily Checks Workbook, Chapter 03 — What Each Tab Would Show: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/daily-checks/03-what-each-tab-would-show.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-dc-03-what-each-tab-would-show/build.js
require("../_build/devwb.js")({
  workbook: "dc", chapter: 3, dir: __dirname,
  base: "DW_DC_03_What_Each_Tab_Would_Show",
  title: "What Each Tab Would Show",
  map: "Why an empty queue proves nothing · what Learn gives and leaves · the render rules · reachability · who · two labs · evidence",
  slides: [
    {
      say: `Welcome back to Building the Daily Checks Workbook. This is Chapter 3: what each tab would show. An empty queue over a source that stopped arriving looks exactly like a quiet night, and the renderer in this chapter says which one it is. We'll see what Microsoft Learn and the operator runbook give you, the renderer's rules, and the read-only reachability check, then walk two mornings in the fictional workspace. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.`,
      detail: `The chapter is the code behind the guide's Step 5 and the validation in its Step 1. It starts with the telemetry-completeness pattern, SentinelHealth, and Intune's export timing. Then the renderer's rules and the reachability check. Lab 1 renders the fictional workspace on the morning the Entra diagnostic setting stopped and the sync probe didn't run, then the next morning, checks the tables' reachability, and shows that the kit won't record a render as evidence. Lab 2 runs the reachability check against a test workspace.`,
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
        ] }, pt: 13 },
      ],
      sources: "Sources: operator runbook (Compliance Automation & Day-2 Operations, Ch 12); Learn, Sentinel connector health; Intune to Azure Monitor; az monitor log-analytics.",
      say: `Here's what you start with. The operator runbook's completeness check lists each expected table past its freshness limit, and it uses a fuzzy union, so a missing table shows up as a null instead of failing the query. Sentinel's health page gives the query for each connector's latest failure, and recommends Azure Monitor alert rules for health drifts. Microsoft's Intune page says compliance is exported once a day and can take up to forty-eight hours, and not to rely on a fixed completion time. And the Azure command line can run a query against a workspace, from its log analytics extension.`,
      detail: `Compliance Automation and Day-Two Operations, Chapter 12's telemetry-completeness check lists each expected table past its freshness limit, using union isfuzzy=true so a missing table shows as a null rather than failing the query. Sentinel's health page gives the SentinelHealth query for each connector's latest failure, and recommends Azure Monitor alert rules for health drifts. Intune's diagnostic settings export compliance once every 24 hours, and it "can take up to 48 hours" to arrive; Microsoft says not to "rely on a fixed or previously observed completion time." az monitor log-analytics query runs a KQL query against a workspace by its GUID; it comes from the Azure CLI's log-analytics extension.`,
      cite: ["dc03-health", "dc03-intune", "dc03-cli"],
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
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Chapter 03, “What it leaves to you,” “The reachability check”; tests/DailyChecks.Tests.ps1, deploy/tests.",
      say: `What does it leave to you? The completeness query lists dark tables, but the other tabs don't know their table is dark, so each tab names its own sources and limits. A query result is just rows or no rows, so each tab says what empty means. Intune's timing is variable, so the devices tab allows forty-eight hours. A screenshot is easy to file as evidence, so the render carries the banner and the kit refuses it. And nothing proves each tab's tables answer, so the kit asks the workspace for each table's newest record and count: delivering, late or missing.`,
      detail: `Each row is pinned by a test in the Chapter 03 block of tests/DailyChecks.Tests.ps1, or in deploy/tests. Test-DcReachability sends, for each table any tab reads, "<table> | where TimeGenerated > ago(3d) | summarize LastSeen = max(TimeGenerated), Records = count()" with az monitor log-analytics query, and compares the age with the table's limit. It reads only. -FixturePath reads saved answers instead, as Lab 1 does.`,
      cite: ["dc03-intune", "dc03-cli"],
      ref: "“What it leaves to you”; “The code” — “The reachability check”",
    },
    {
      part: "Who", title: "Who reads it, and who fixes the source",
      body: [
        { cols: [[{ bullets: [
          "**Operators**: telemetry first, then their family's tabs; each finding becomes a task",
          "**Security operations**: each dark source, as a high-severity task",
          "**ISSO**: keeps the reachability record, never the render",
        ], label: "Roles", color: "teal", pt: 14 }], [{ bullets: [
          "Lab 1: nothing; saved results only",
          "Lab 2: **Log Analytics Reader** on the test workspace",
          "The check sends only queries",
        ], label: "What each lab needs", color: "navy", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 03, “Goal and audience,” “Lab 2,” “Verified facts,” “Checklist.”",
      say: `Who does what? Operators read the telemetry tab first, then their own family's tabs, and each finding becomes a task. Security operations treats each dark source as a high-severity task. And the security officer keeps the reachability record, never the render. Lab 1 needs only saved results. Lab 2 needs Log Analytics Reader on a test workspace, which can view and search the monitoring data, and the check sends only queries.`,
      detail: `Lab 2: signed in as a person with Log Analytics Reader on the workspace ("View and search all monitoring data"). Checklist: the telemetry tab is read first, and each dark source has a task; no tab is read as clear while its source is stale; the reachability check passes in the test workspace, and its record is in the evidence; no render or screenshot is in the evidence package.`,
      cite: ["dc03-access"],
      ref: "“Goal and audience”; “Lab 2”; “Checklist”",
    },
    {
      part: "How", title: "Lab 1: the morning the logs stopped",
      body: [
        { terminal: "03-1", lines: "1-13" },
        { terminal: "03-2" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures, November 16, 2026). Chapter 03, “Lab 1,” steps 1–2.",
      say: `Lab 1. Step 1 renders the morning of November sixteenth in the fictional workspace. The Entra diagnostic setting stopped at ten past five the evening before, and the sync probe didn't run. Telemetry flags four rows: sign-in and audit logs are dark, the probe's table is dark, and the Office 365 connector's latest health event is a failure. The sync, risk, emergency access and grants tabs are all STALE. Step 2 shows why the risk tab isn't clear: its query returned no rows, but its source stopped fourteen hours ago.`,
      detail: `Step 1: ./Invoke-DcRender.ps1 -FixturePath tests/fixtures/day1 -AsOf 2026-11-16T07:30:00Z -OutputPath out/day1. Telemetry completeness ATTENTION, 4 of 9 rows need work; Synchronization probe STALE, DailySyncProbe_CL 1500 min old (limit 1440); Entra Health alerts LINK-OUT; Risky users and sign-ins STALE, SigninLogs 860 min old (limit 60); Emergency access sign-ins STALE; Noncompliant devices ATTENTION 3 of 3; Consents, roles and grants STALE, AuditLogs 860 min old, the 2 rows shown may be incomplete; DLP and label alerts ATTENTION 1 of 1; Catalog and remediation tasks LINK-OUT; Log review queue ATTENTION 2 of 2. Step 2: Get-Content tests/fixtures/day1/risk.json: rows empty; SigninLogs last 2026-11-15T17:10:00Z.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: the next morning",
      body: [
        { terminal: "03-3", lines: "1-13" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures, November 17, 2026). Chapter 03, “Lab 1,” step 3.",
      say: `Step 3 renders the next morning. The setting is back, and telemetry is clear. Now the queues show what they were hiding: one user at high risk, one emergency access sign-in, which turns out to be the quarterly validation drill, and the review records it as a drill, and one synchronization conflict. Grants and D L P alerts are clear, and this time clear means something, because their sources are fresh.`,
      detail: `Step 3: ./Invoke-DcRender.ps1 -FixturePath tests/fixtures/day2 -AsOf 2026-11-17T07:30:00Z -OutputPath out/day2. Telemetry completeness CLEAR, 8 rows, none flagged; Synchronization probe ATTENTION 1 of 1 (one PropertyConflict, verdict drift); Risky users and sign-ins ATTENTION 1 of 1 (one user at high risk); Emergency access sign-ins ATTENTION 1 of 1 (the quarterly validation drill); Noncompliant devices ATTENTION 1 of 1; Consents, roles and grants CLEAR; DLP and label alerts CLEAR; Log review queue ATTENTION 1 of 1.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” step 3",
    },
    {
      part: "How", title: "Lab 1: reachability, and a refused render",
      body: [
        { terminal: "03-4", lines: "1-12" },
        { terminal: "03-5" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures). Chapter 03, “Lab 1,” steps 4–5.",
      say: `Step 4 checks each table's reachability on the first morning, from saved answers. Sign-in logs, audit logs and the probe's table are late, and the Sentinel health table is missing altogether: health monitoring was never turned on in this workspace. The script exits with an error. Step 5 tries to record the first morning's render as evidence. The kit refuses: a rendered view is not evidence.`,
      detail: `Step 4: ./deploy/Test-DcReachability.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/reach-day1.json -OutputPath out/reach -AsOf 2026-11-16T07:30:00Z: AuditLogs Late 860 of 60; DailySyncProbe_CL Late 1500 of 1440; SentinelHealth Missing, table not found; SigninLogs Late 860 of 60; the others Delivering; exit code 1. Step 5: ./Invoke-DcEvidence.ps1 -EvidencePath out/evidence -RunPath out/day1: Exception: A rendered view is not evidence. Record the check's own output instead (the probe's result, the alert, the closed task), or the kit's validate, plan, deploy and reachability runs.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 4–5",
    },
    {
      part: "How", title: "Lab 1: record what the check found",
      body: [
        { terminal: "03-6" },
        { terminal: "03-7" },
        { callout: "the record's result is Fail. The record keeps what the check found; that is what makes it evidence.", label: "Note: ", color: "teal" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures). Chapter 03, “Lab 1,” steps 6–7.",
      say: `Step 6 records the reachability check instead. Record one, with result Fail: the record keeps what the check found, with continuous monitoring and system monitoring, and their indicators. A failing record is still evidence; it's evidence of the gap. Step 7 runs this chapter's tests and the evidence tests: sixteen passed, none failed.`,
      detail: `Step 6: ./Invoke-DcEvidence.ps1 -EvidencePath out/evidence -RunPath out/reach -AsOf 2026-11-16T07:32:00Z: Record 1: reachability Fail (REACH, EVIDENCE); Controls AU-9, CA-7, SI-4; KSIs KSI-MLA-EVC, KSI-MLA-LET, KSI-MLA-OSM. Step 7: Invoke-Pester -Path tests/DailyChecks.Tests.ps1 -FullNameFilter 'Chapter 03*', 'Evidence*': 16 passed, 0 failed. Then Remove-Item -Recurse -Force out.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 6–7",
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
          ["The render is refused as evidence", "CA-7", "KSI-MLA-EVC"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 03, “Lab 2,” “Federal requirements and evidence,” “Dangers.” KSIs: FedRAMP 20x indicators for providers.",
      say: `Lab 2 runs the same reachability check against a test workspace, never production; the authors haven't run it. Sign in to commercial Azure, add the log analytics extension, run the check, and sign out. Every table should be delivering; each late or missing one becomes a task. The reachability record supports continuous monitoring and system monitoring. The dangers you saw: a missing connector that looks healthy, a missed probe showing yesterday's green, and a render filed as evidence. Next, Chapter 4 deploys the workbook.`,
      detail: `Lab 2 placeholders: <tenant-id>, <settings-file>, <output-folder> (outside any repository). Back out: az logout; Remove-Item -Recurse -Force <output-folder>/reach if this was a rehearsal. Federal requirements: each tab's tables answer, with their age (reach.json) supports CA-7 and SI-4 (KSI-MLA-EVC, KSI-MLA-LET); a stale source shown as STALE supports SI-4; the render refused as evidence supports CA-7. The kit's records support these controls; the agency's assessor decides them. Dangers: a missing connector looks healthy; a missed probe shows yesterday's green verdict; a render filed as evidence; a reachability check with write rights.`,
      cite: [],
      ref: "“Lab 2: a test workspace”; “Federal requirements and evidence”; “Dangers”",
    },
  ],
});
