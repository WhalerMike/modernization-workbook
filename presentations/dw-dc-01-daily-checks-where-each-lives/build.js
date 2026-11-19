// Building the Daily Checks Workbook, Chapter 01 — The Daily Checks and Where Each One Lives: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/daily-checks/01-the-daily-checks-and-where-each-lives.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-dc-01-daily-checks-where-each-lives/build.js
require("../_build/devwb.js")({
  workbook: "dc", chapter: 1, dir: __dirname,
  base: "DW_DC_01_Daily_Checks_Where_Each_Lives",
  title: "The Daily Checks and Where Each One Lives",
  map: "Why one row per check · what Learn gives and leaves · the manifest and its ten tabs · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to Building the Daily Checks Workbook. This is Chapter 1: the daily checks, and where each one lives. Before anything is drawn on a dashboard, each daily check in the operator runbook gets one row: what it reads, where else to look, and whether a workbook can show it at all. We'll start from what Microsoft Learn gives you, see what it leaves to you, read the kit's manifest and its ten tabs, and walk two labs. The chapter is a draft awaiting the owner's review, and the code is illustrative, tested against fixtures.`,
      detail: `The chapter is the code behind the guide's tab table and its Step 1. It starts with what Learn and the runbook give: the daily checks of the operator runbook (Compliance Automation and Day-Two Operations, Chapter 12) and the table reference pages for the sources. Then the kit's manifest, config/manifest.json: ten tabs, one per daily check, each with its tables, queries, link-outs, GCC note, fit and render rule. Lab 1 lists the tabs, opens a link-out tab and a partial one, and reads the emergency access query. Lab 2 lists which of the manifest's tables a test workspace actually has.`,
      cite: [],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why one row per daily check",
      body: [
        { lead: "Ten daily checks, most done one portal at a time. Some fit a workbook; some can only be linked to." },
        { cols: [[{ bullets: [
          "Say, for every daily check, **which table** shows it",
          "Say **where the operator looks** when Log Analytics doesn't have it",
          "Say **how much a tab can be trusted** to show",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who build or maintain the kit",
          "The security operations lead who owns the workspace",
          "No tenant needed until Lab 2",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 01, opening, “Goal and audience”; operator runbook (Compliance Automation & Day-2 Operations, Ch 12).",
      say: `Why start with a list? The operator runbook asks for ten checks every morning, and most of them are done one portal at a time. Some of that data is already in the Sentinel workspace; some of it never will be. So the goal is to say, for every daily check, which table shows it, where the operator looks when Log Analytics doesn't have it, and how much a workbook tab can be trusted to show. It's for the developers who maintain the kit and the security operations lead who owns the workspace, and you don't need a tenant until Lab 2.`,
      detail: `Goal: by the end of the chapter you can say, for every daily check in the runbook, which table shows it, where the operator looks when Log Analytics doesn't have it, and how much a workbook tab can be trusted to show. Audience: developers who build or maintain the kit, and the security operations lead who owns the workspace. You don't need a tenant until Lab 2.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.6, 8.55], rows: [
          ["Visualization options", "Workbooks for reports across Azure sources; portal dashboards, Dashboards with Grafana (preview), Azure Managed Grafana, Power BI"],
          ["Table references", "SigninLogs, AuditLogs, AADRiskyUsers, IntuneDeviceComplianceOrg, SecurityAlert, SecurityIncident, CommonSecurityLog, with their columns"],
          ["SentinelHealth", "Only the connectors Learn lists, and only once health monitoring is on"],
          ["Logs Ingestion API", "A custom application's records into a custom table whose name ends in _CL"],
          ["Entra Health monitoring", "A preview, in the Microsoft Entra admin center and by e-mail"],
          ["Intune export", "Once every 24 hours, up to 48 hours late; Intune in GCC is the commercial instance"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, visualization best practices; table references; Sentinel connector health; Logs Ingestion API; Entra Health; Intune to Azure Monitor.",
      say: `Here's what Microsoft Learn gives you. Its guidance on visualizations recommends workbooks for reports across Azure sources, and lists the other options. Its table reference pages give each source table and its columns, from sign-in logs to Intune's compliance export. Sentinel's health table covers only the connectors Learn lists, and only once health monitoring is turned on. The Logs Ingestion API sends your own records to a custom table ending in underscore C L. Entra Health monitoring is a preview in the admin center and by e-mail. And Intune exports compliance once a day, up to forty-eight hours late.`,
      detail: `Microsoft's guidance on Azure Monitor visualizations recommends workbooks for reports across Azure sources and lists the other options: portal dashboards, Dashboards with Grafana (preview), Azure Managed Grafana and Power BI. Learn's table reference pages give each source table and its columns. SentinelHealth covers only the connectors listed, once health monitoring is on. The Logs Ingestion API sends records to a custom table whose name ends in _CL. Entra Health monitoring is a preview shown in the Microsoft Entra admin center and by e-mail. Intune's export runs once every 24 hours and can take up to 48 hours; Intune in GCC is the commercial instance.`,
      cite: ["dc01-best", "dc01-tables", "dc01-health", "dc01-ingest", "dc01-entra-health", "dc01-intune"],
      ref: "“Start with Microsoft's documentation” — “What Microsoft gives you”; “Verified facts”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["Learn, as published", "Why it matters", "What the kit adds"], w: [3.4, 3.6, 5.15], rows: [
          ["A table per source; the checks in prose", "Nobody says which table shows which check", "One manifest row per check; a test that every tab has a check, GCC note, action and link-out"],
          ["Some checks have no Log Analytics data", "An empty tab looks healthy", "Link-out tabs with no tables or queries, and the click path"],
          ["Freshness is per source", "One look-back is wrong for half the tabs", "Expected tables, each with its own limit"],
          ["GCC availability on different pages", "A tab can assume a preview GCC doesn't have", "A GCC note per tab; link-outs only to allowed commercial portals"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 01, “What it leaves to you”; tests/DailyChecks.Tests.ps1, Chapter 01 block.",
      say: `What does it leave to you? Learn gives a table per source, and the runbook gives the checks in prose, but nobody says which table shows which check. So the kit has one manifest row per daily check. Some checks have no data in Log Analytics at all, and a tab built on missing data looks healthy: those become link-out tabs, with no tables and the click path instead. Freshness is per source, so each expected table gets its own limit. And because availability is spread across pages, each tab carries its GCC note. Every row here is pinned by a test.`,
      detail: `Each row is pinned by a test in the Chapter 01 block of tests/DailyChecks.Tests.ps1. A table per source and the runbook's checks in prose: one manifest row per daily check, with its tables; a test that every tab has a check, a GCC note, an action and a link-out. Some checks have no Log Analytics data (Entra Health, the ITSM queue): kind link-out tabs with no tables or queries, and the click path; a test that link-out tabs read nothing. Freshness is per source: expectedTables with a limit each, and a test that every table a tab reads is expected. GCC availability is on different pages, or not stated: a GCC note per tab, from the guide's table; a test that every link-out goes to a commercial portal on the allow list.`,
      cite: [],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "The manifest: ten tabs, one per check",
      body: [
        { table: { head: ["Tab", "Kind", "Fit", "Reads"], w: [2.6, 1.9, 1.7, 5.95], rows: [
          ["telemetry", "workbook", "strong", "the eight expected tables; SentinelHealth"],
          ["sync", "workbook", "strong", "DailySyncProbe_CL"],
          ["entra-health", "link-out", "link-out", "none: the Entra admin center"],
          ["risk", "workbook", "strong", "AADRiskyUsers, SigninLogs"],
          ["emergency-access", "workbook", "strong", "SigninLogs"],
          ["devices", "workbook", "good", "IntuneDeviceComplianceOrg"],
          ["grants", "workbook", "partial", "AuditLogs; the ticket match stays in the ITSM tool"],
          ["data", "workbook", "good", "SecurityAlert"],
          ["tasks", "link-out", "weak", "none: the ITSM tool's own queue"],
          ["log-review", "workbook", "partial", "SecurityIncident; the review stays a recorded procedure"],
        ] }, pt: 12 },
      ],
      sources: "Sources: examples/daily-checks-workbook/config/manifest.json. Chapter 01, “The code.”",
      say: `Here's the manifest. Ten tabs, one per daily check. Eight read tables: telemetry completeness, the synchronization probe, risky users and sign-ins, emergency access sign-ins, noncompliant devices, grants, D L P alerts, and the log review queue. Two are link-outs: Entra Health, because its alerts aren't in Log Analytics, and the catalog tasks, which live in the I T S M tool. Two of the eight are partial. The grants tab lists grants, but matching each to a ticket stays in the I T S M tool. And the log review tab shows the queue, while the review itself stays a recorded procedure.`,
      detail: `config/manifest.json has the workbook's name and schema, the not-evidence banner every tab carries, the hosts a link-out may point to, the five workbook parameters (the workspace, the emergency access object IDs, the compliant state value, the DLP product names and the ITSM queue's address), the expected tables with their freshness limits, and the ten tabs. Each tab has an id, title, the daily check it shows, its kind (workbook or link-out), its fit (strong, good, partial, weak or link-out), its tables, its queries (a file in queries/ and a look-back each), its link-outs (name, address, click path), its GCC note, its action and its render rule. Get-DcTab lists the tabs; Show-DcManifest.ps1 prints them, or one tab in full with -Id.`,
      cite: [],
      ref: "“The code” — “The manifest”",
    },
    {
      part: "Who", title: "Who keeps the manifest, and the data",
      body: [
        { cols: [[{ bullets: [
          "**Security operations**: the workspace, the manifest, the freshness limits",
          "**Developers**: the kit, its queries and its tests",
          "**Operators**: read their family's tabs each morning",
        ], label: "Roles", color: "teal", pt: 14 }], [{ bullets: [
          "Lab 1: nothing; it reads the kit's own files",
          "Lab 2: **Log Analytics Reader** on the test workspace",
          "Lab 2 only reads the table list, and signs out",
        ], label: "What each lab needs", color: "navy", pt: 14 }]] },
        { callout: "Each link-out has its click path, and its host is on the allow list.", label: "Reviewer's check: ", color: "amber", icon: "FaClipboardCheck" },
      ],
      sources: "Sources: Chapter 01, “Goal and audience,” “Lab 2,” “Checklist.”",
      say: `Who does what? Security operations owns the workspace, the manifest and the freshness limits. Developers own the kit, its queries and its tests. And the operators read their own family's tabs each morning. Lab 1 needs nothing but PowerShell: it reads the kit's own files. Lab 2 needs Log Analytics Reader on a test workspace; it only reads the table list, then signs out. A reviewer checks that each link-out has its click path and an allowed host.`,
      detail: `Audience: developers who build or maintain the kit, and the security operations lead who owns the workspace. Lab 2: a test subscription with a Log Analytics workspace that receives the test tenant's Entra, Intune and Defender XDR logs, never production; signed in as a person with Log Analytics Reader on the workspace. Checklist: every daily check in the operator runbook's two tables has a tab; each link-out has its click path, and its host is on the allow list; each expected table has a freshness limit set from its own cadence; Lab 2's list of missing tables is empty, or each missing table has a task under the guide's Step 1.`,
      cite: [],
      ref: "“Goal and audience”; “Lab 2”; “Checklist”",
    },
    {
      part: "How", title: "Lab 1: list the tabs",
      body: [
        { terminal: "01-1", lines: "1-3,6-15" },
        { terminal: "01-4" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures). Chapter 01, “Lab 1: fixtures, no tenant,” steps 1 and 4.",
      say: `Lab 1, in the kit's folder, with no tenant. Step 1 lists the tabs: ten of them, with the telemetry row left off the slide. Notice that entra health and tasks read no table at all, and that grants and log review are partial. Step 4 counts the tabs by fit: four strong, two good, two partial, one weak, and one link-out.`,
      detail: `Step 1: ./Show-DcManifest.ps1. Ten tabs; entra-health and tasks read no table; grants and log-review are partial. Step 4: Import-Module ./powershell/DailyChecks/DailyChecks.psm1; Get-DcTab | Group-Object Fit | Sort-Object Name | Select-Object Name, Count: good 2, link-out 1, partial 2, strong 4, weak 1.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1 and 4",
    },
    {
      part: "How", title: "Lab 1: a link-out tab and a partial one",
      body: [
        { terminal: "01-2" },
        { terminal: "01-3" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures). Chapter 01, “Lab 1,” steps 2–3.",
      say: `Step 2 opens a link-out tab. Entra Health has no table: the tab sends the operator to the Entra admin center, under Monitoring and health, then Health. Its G C C availability is not yet specified, so nothing is built on its data. Step 3 opens a partial tab. The grants tab reads the Entra audit logs, but its action says it plainly: each row is matched to its ticket in the I T S M tool, and a grant with no ticket opens a finding.`,
      detail: `Step 2: ./Show-DcManifest.ps1 -Id entra-health: link-out; Tables none; Link-out Microsoft Entra Health: https://entra.microsoft.com > Entra ID > Monitoring & health > Health > Health Monitoring; GCC not yet specified; health monitoring is a preview shown in the admin center, by e-mail and through Graph beta. Step 3: ./Show-DcManifest.ps1 -Id grants: workbook, fit partial; AuditLogs; link-out Entra audit logs; action: each row is matched to its ticket in the ITSM tool; a grant with no ticket opens a finding.`,
      cite: ["dc01-entra-health"],
      ref: "“Lab 1: fixtures, no tenant,” steps 2–3",
    },
    {
      part: "How", title: "Lab 1: the query and the freshness limits",
      body: [
        { terminal: "01-5" },
        { terminal: "01-6" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures). Chapter 01, “Lab 1,” steps 5–6; Learn, Intune to Azure Monitor.",
      say: `Step 5 reads the emergency access query. It's Microsoft's own sign-in query from its emergency access guidance, with the accounts' object I D's taken from a parameter instead of written into the query. Step 6 lists the eight expected tables and their limits. Sign-in and audit logs: sixty minutes. Intune's compliance export: two thousand eight hundred and eighty minutes, because it arrives once a day and can take up to forty-eight hours.`,
      detail: `Step 5: Get-Content queries/emergency-access-1.kql: let ids = dynamic([{EmergencyAccessIds}]); SigninLogs | where TimeGenerated > ago(1d) | where UserId in (ids) | project TimeGenerated, UserPrincipalName, UserId, IPAddress, ResultType, ResultDescription. Step 6: (Get-DcManifest).expectedTables: SigninLogs 60, AuditLogs 60, AADRiskyUsers 1440, SecurityAlert 1440, SecurityIncident 1440, IntuneDeviceComplianceOrg 2880, CommonSecurityLog 60, DailySyncProbe_CL 1440. Step 7 runs the chapter's tests: 7 passed, 0 failed.`,
      cite: ["dc01-intune"],
      ref: "“Lab 1: fixtures, no tenant,” steps 5–7",
    },
    {
      part: "How", title: "Lab 2: which tables does the workspace have?",
      body: [
        { code: [
          "az cloud set --name AzureCloud",
          "az login --tenant <tenant-id>",
          "Import-Module ./powershell/DailyChecks/DailyChecks.psm1",
          "$have = az monitor log-analytics workspace table list --resource-group <workspace-resource-group> `",
          "    --workspace-name <workspace-name> --query \"[].name\" -o tsv",
          "(Get-DcManifest).tabs | ForEach-Object { $_.tables } | Sort-Object -Unique | Where-Object { $_ -notin $have }",
          "az logout",
        ], label: "A test workspace, never production; not run by the authors", pt: 11.5 },
        { callout: "every name printed is a source the guide's Step 1 still has to connect: DailySyncProbe_CL until the probe's table exists, SentinelHealth until health monitoring is on.", label: "Read the result: ", color: "teal" },
      ],
      sources: "Sources: Chapter 01, “Lab 2: a test workspace,” steps 1–3.",
      say: `Lab 2 runs in a test workspace, never production, and the authors haven't run it. Sign in to commercial Azure, list the workspace's tables, and print every table a tab reads that the workspace doesn't have. It reads and changes nothing. Every name it prints is a source the guide's first step still has to connect: the probe's custom table until it's created, and the Sentinel health table until health monitoring is on. Then sign out.`,
      detail: `Lab 2 placeholders: <tenant-id>, <workspace-resource-group>, <workspace-name>. Step 1: az cloud set --name AzureCloud; az login --tenant <tenant-id>. Step 2: Import-Module; $have = az monitor log-analytics workspace table list --resource-group <workspace-resource-group> --workspace-name <workspace-name> --query "[].name" -o tsv; (Get-DcManifest).tabs | ForEach-Object { $_.tables } | Sort-Object -Unique | Where-Object { $_ -notin $have }. Step 3: az logout. The authors haven't run this lab.`,
      cite: [],
      ref: "“Lab 2: a test workspace”",
    },
    {
      part: "How", title: "Evidence, dangers and the checklist",
      body: [
        { table: { head: ["Output", "Supports", "KSI"], w: [6.0, 3.4, 2.75], rows: [
          ["Every daily check has a home: a table or a link-out (Lab 1)", "CA-7", "KSI-MLA-EVC"],
          ["The workspace has each table a tab reads (Lab 2)", "CA-7, SI-4", "KSI-MLA-EVC, KSI-MLA-LET"],
        ] }, pt: 12 },
        { table: { head: ["Danger", "The guard"], w: [5.5, 6.65], rows: [
          ["A tab built on data GCC doesn't have", "Link-out tabs; the GCC note per tab"],
          ["One freshness limit for every source", "Expected tables with a limit each"],
          ["A partial tab read as complete", "fit: partial, and the tab's action"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 01, “Federal requirements and evidence,” “Dangers,” “Checklist.” KSIs: FedRAMP 20x indicators for providers.",
      say: `Two outputs support federal requirements. Lab 1 shows every daily check has a home, a table or a link-out, which supports continuous monitoring, C A seven. Lab 2 shows the workspace has each table a tab reads, which also supports system monitoring, S I four. The manifest itself is design, not evidence; the kit's records in later chapters are. The dangers: a tab built on data G C C doesn't have, one freshness limit for every source, and a partial tab read as complete. Next, Chapter 2 builds the workbook's template and its validator.`,
      detail: `Federal requirements: every daily check has a home (Lab 1, steps 1 to 3) supports CA-7, KSI-MLA-EVC; the workspace has each table a tab reads (Lab 2, step 2) supports CA-7 and SI-4, KSI-MLA-EVC and KSI-MLA-LET. The manifest itself is design, not evidence. The kit's records support these controls; the agency's assessor decides them. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with them and doesn't report KSIs itself. Dangers: a tab built on data GCC doesn't have; one freshness limit for every source; a check with no home; a partial tab read as complete.`,
      cite: [],
      ref: "“Federal requirements and evidence”; “Dangers”; “Checklist”",
    },
  ],
});
