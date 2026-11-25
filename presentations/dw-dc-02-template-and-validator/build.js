// Building the Daily Checks Workbook, Chapter 02 — The Workbook Template and Its Validator: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/daily-checks/02-the-workbook-template-and-its-validator.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-dc-02-template-and-validator/build.js
require("../_build/devwb.js")({
  workbook: "dc", chapter: 2, dir: __dirname,
  base: "DW_DC_02_Template_And_Validator",
  title: "The Workbook Template and Its Validator",
  map: "Why a file, not a portal edit · what Learn gives and leaves · the template · the ten checks · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome back to Building the Daily Checks Workbook. This is Chapter 2: the workbook's template, and its validator. A workbook edited in the portal is a change nobody reviewed, so the kit keeps it as a file and checks every copy against the manifest. We'll start from Microsoft Learn's page on workbooks as Resource Manager templates, see what it leaves to you, read how the template is built and the ten checks the validator runs, and walk two labs. The chapter has been reviewed and approved.`,
      detail: `The chapter is the code behind the guide's Step 2. It starts with Learn's workbook ARM template page, which explains the Advanced Editor's Gallery Template and ARM template tabs, shows serializedData, and advises masking the sensitive values an export embeds. Then how the kit builds its template from the manifest and queries/*.kql, and the ten checks its validator runs. Lab 1 confirms the template is the build, validates it, finds the four edits in a copy exported after someone changed the workbook in the portal, and records a validation. Lab 2 saves a test copy in the portal, exports it and validates the export.`,
      cite: [],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why keep the workbook as a file",
      body: [
        { lead: "A portal edit is a change nobody reviewed. An export can carry the subscription and workspace into a repository." },
        { cols: [[{ bullets: [
          "**Rebuild** the template from reviewed files",
          "Prove it has **one tab per daily check** and **no embedded IDs**",
          "Catch the portal edits that would drift into production unreviewed",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who maintain the kit",
          "The security operations engineer who edits the workbook",
          "No tenant until Lab 2",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 02, opening, “Goal and audience.”",
      say: `Why keep a dashboard as a file? Because a workbook edited in the portal is a change nobody reviewed, and an export of it can carry the subscription, resource group and workspace into a repository. By the end of this chapter you can rebuild the workbook's template from reviewed files, prove it has one tab per daily check and no embedded I D's, and catch the portal edits that would otherwise drift into production unreviewed. It's for the developers and for the security operations engineer who edits the workbook.`,
      detail: `Goal: rebuild the workbook's template from reviewed files, prove a template has one tab per daily check and no embedded IDs, and catch the portal edits that would otherwise drift into production unreviewed. Audience: developers who maintain the kit, and the security operations engineer who edits the workbook. No tenant until Lab 2.`,
      cite: [],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.6, 8.55], rows: [
          ["Two ways to manage workbooks as templates", "A workbook template, from the Advanced Editor's Gallery Template tab; a workbook instance, from its ARM template view"],
          ["The instance resource", "Microsoft.Insights/workbooks, kind shared; displayName, serializedData, version, sourceId, category"],
          ["serializedData", "The workbook's content: version Notebook/1.0 and its items"],
          ["Exports", "Often embed the subscription ID, resource group and resource IDs: mask them"],
          ["API version", "2023-06-01; kind's only valid value is shared"],
          ["Queries", "The Logs (Analytics) data source, with KQL, over Log Analytics workspaces"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, workbooks and ARM templates; Microsoft.Insights/workbooks reference; workbook data sources.",
      say: `Here's what Microsoft Learn gives you. Two ways to manage a workbook as a template: copy the Gallery Template from the Advanced Editor, or copy the Resource Manager template. The instance is a Microsoft dot Insights workbooks resource, kind shared, with a display name, a source I D, a category, and serialized data, which holds the workbook's content. And Learn warns that an exported template often embeds the subscription I D and resource group: its advice is to mask them. The resource reference gives API version 2023-06-01. Queries use the Logs data source, with K Q L.`,
      detail: `Learn explains two ways to manage a workbook as an ARM template: a workbook template, copied from the Gallery Template tab of the Advanced Editor, and a workbook instance, copied from the ARM template view. Its sample instance is a Microsoft.Insights/workbooks resource with kind shared and properties displayName, serializedData ({"version":"Notebook/1.0","items":[...]}), version, sourceId and category. Learn warns that an exported template often embeds "potentially sensitive values such as subscription ID and resource group name," and that it's "a best practice to mask out any embedded sensitive values." The resource reference gives API version 2023-06-01, with kind "Only valid value is shared." Workbooks query Log Analytics workspaces through the Logs (Analytics) data source with KQL.`,
      cite: ["dc02-arm", "dc02-ref", "dc02-sources"],
      ref: "“Start with Microsoft's documentation” — “What Microsoft gives you”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["Learn, as published", "Why it matters", "What the kit adds"], w: [3.2, 3.6, 5.35], rows: [
          ["Export from the portal, paste into a template", "The template is whatever someone last saved", "Built from the manifest and the KQL files; a test keeps the file equal to the build"],
          ["Mask embedded IDs by hand", "A missed one goes into a public repository", "DC-V-10 fails any GUID, subscription path, address, credential or parameter value"],
          ["A query is free text", "It can read an undeclared table, or a month of data", "DC-V-03 tables per tab; DC-V-04 look-back per query"],
          ["Each query names its own resources", "One query can read another workspace", "DC-V-05: every query reads {Workspace}"],
          ["Nothing says what a tab means", "A green tab is read as proof", "DC-V-06 the banner; DC-V-07 link-outs, allowed hosts only"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 02, “What it leaves to you”; tests/DailyChecks.Tests.ps1, Chapter 02 block.",
      say: `What does it leave to you? Learn's way is to export from the portal and paste, so the template is whatever someone last saved; the kit builds it from the manifest and the K Q L files, and a test keeps the committed file equal to the build. Masking I D's by hand misses one sooner or later, so a check fails any G U I D, subscription path, address or secret. A query is free text, so the kit checks each tab's tables and each query's look-back. It checks that every query reads the workspace parameter. And because nothing says what a tab means, every tab must carry the banner.`,
      detail: `Each row is pinned by a test in the Chapter 02 block of tests/DailyChecks.Tests.ps1. Export from the portal: New-DcTemplate builds it from the manifest and queries/*.kql; a test keeps the committed file equal to the build. Mask embedded IDs by hand: DC-V-10 fails any GUID, subscription path, e-mail address, credential, fallbackResourceIds or parameter value in the template. A query is free text: DC-V-03 (tables per tab) and DC-V-04 (look-back per query). Each query names its own resources: DC-V-05, every query reads the {Workspace} parameter. Nothing says what a tab means: DC-V-06, the not-evidence banner on every tab; DC-V-07, each manifest link-out, and only allowed hosts.`,
      cite: ["dc02-arm"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "The template, and the ten checks",
      body: [
        { cols: [[{ bullets: [
          "A header with the banner",
          "Parameters: the **workspace** picker and nine text values, all empty",
          "One **tab** per manifest tab, each setting selectedTab",
          "One **group** per tab: banner, daily check, what to do, link-outs, GCC note, its queries",
          "Every query a Logs query on **{Workspace}**",
        ], label: "New-DcTemplate", color: "navy", pt: 13 }], [{ table: { head: ["Check", "Looks for"], w: [1.5, 4.3], rows: [
          ["01, 02", "Notebook/1.0; one tab and group per check"],
          ["03, 04", "Declared tables; look-back within limit"],
          ["05", "Every query on {Workspace}"],
          ["06, 07", "Banner; link-outs and hosts"],
          ["08, 09", "Queries per kind; the telemetry list"],
          ["10", "No GUID, path, address or secret"],
        ] }, pt: 12 }]], split: 0.5 },
      ],
      sources: "Sources: examples/daily-checks-workbook (New-DcTemplate, Test-DcTemplate). Chapter 02, “The code.”",
      say: `Here's the code. The template has a header with the banner, then the parameters: a workspace picker and nine text values, from the emergency access accounts to the synchronization servers and the domain controllers, all left empty in the template. Then one tab per daily check, and one group per tab that shows when its tab is selected, holding the banner, the daily check, what to do, the link-outs with click paths, the G C C note, and its queries, each one a Logs query on the workspace parameter. The validator runs ten checks: the format, one tab per check, tables, look-backs, the workspace, the banner, link-outs and hosts, queries per tab kind, the telemetry list, and no I D's or secrets.`,
      detail: `New-DcTemplate returns the gallery template: a header with the banner; a parameters item (Workspace, a resource picker filtered to Log Analytics workspaces, and nine text parameters: the emergency access accounts, the compliant state value, the DLP product names, the ITSM queue, the synchronization servers and their event and backup sources, the domain controllers, and the Defender for Identity alert product names); a links item styled as tabs, one per manifest tab, each setting selectedTab; one group per tab, visible when selectedTab is its id, holding a text item and one query item per manifest query (KqlItem/1.0, queryType 0, resourceType microsoft.operationalinsights/workspaces, crossComponentResources {Workspace}). Every parameter value and fallbackResourceIds are empty: Chapter 04's plan fills them per environment. Checks DC-V-01 to DC-V-10 as listed; Test-DcWorkbook.ps1 prints a line per check and every failure, and exits 1 on any failure; -OutputPath writes results.json and a hashed manifest.json.`,
      cite: [],
      ref: "“The code”",
    },
    {
      part: "Who", title: "Who edits, who reviews, who deploys",
      body: [
        { cols: [[{ bullets: [
          "**Security operations engineer**: edits in a test copy, exports, validates",
          "**A second person**: reviews the change to the template",
          "**Developers**: keep the manifest and the queries",
        ], label: "Roles", color: "teal", pt: 14 }], [{ bullets: [
          "Lab 1: nothing; files only",
          "Lab 2: **Workbook Contributor** on the test resource group, for the lab only",
          "Lab 2 deletes its test copy at the end",
        ], label: "What each lab needs", color: "navy", pt: 14 }]] },
        { callout: "no export with IDs in it was committed, and every portal edit came back through review.", label: "Reviewer's check: ", color: "amber", icon: "FaClipboardCheck" },
      ],
      sources: "Sources: Chapter 02, “Goal and audience,” “Lab 2,” “Checklist.”",
      say: `Who does what? The security operations engineer edits a test copy in the portal, exports it and validates the export. A second person reviews the change before it replaces the template. Developers keep the manifest and the queries. Lab 1 needs only files. Lab 2 saves one test workbook, so it needs Workbook Contributor on the test resource group, for the lab only, and it deletes the copy at the end. A reviewer checks that no export with I D's in it was committed.`,
      detail: `Lab 2: use a test subscription with a Log Analytics workspace, never production. It saves one test workbook through the portal, so you need Workbook Contributor on the test resource group, activated for the lab only. Checklist: New-DcWorkbookTemplate.ps1 -Check passes on the branch; Test-DcWorkbook.ps1 passes every check; every portal edit came back as an export, was validated and replaced the template through a reviewed change; no export with IDs in it was committed.`,
      cite: [],
      ref: "“Goal and audience”; “Lab 2”; “Checklist”",
    },
    {
      part: "How", title: "Lab 1: the build, and all 89 checks",
      body: [
        { terminal: "02-3" },
        { terminal: "02-4" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures). Chapter 02, “Lab 1: fixtures, no tenant,” steps 1–2.",
      say: `Lab 1, in the kit's folder, with no tenant. Step 1 confirms the committed template matches the build of the manifest and the queries. Step 2 validates it: ten checks, eighty-nine results across the twelve tabs, and all of them pass.`,
      detail: `Step 1: ./New-DcWorkbookTemplate.ps1 -Check: workbook/daily-checks.workbook.json matches the manifest and queries. Step 2: ./Test-DcWorkbook.ps1: DC-V-01 1 checked; DC-V-02 1; DC-V-03 10; DC-V-04 19; DC-V-05 19; DC-V-06 12; DC-V-07 13; DC-V-08 12; DC-V-09 1; DC-V-10 1; all 89 checks pass.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: four edits in a portal export",
      body: [
        { terminal: "02-5", lines: "1,5-8,11-16" },
        { terminal: "02-6" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures). Chapter 02, “Lab 1,” steps 3–4; Learn, workbooks and ARM templates.",
      say: `Step 3 is the one to remember. A copy was exported after someone edited the workbook in the portal. Four edits, four failures: one risk query reads a workspace path instead of the parameter; the devices query looks back seven hundred and twenty hours; the grants tab lost its banner; and the file carries a G U I D and a subscription path. Step 4 shows what the export carried: the workspace's full resource path, exactly what Microsoft Learn says to mask.`,
      detail: `Step 3: ./Test-DcWorkbook.ps1 -TemplatePath tests/fixtures/exported/edited.workbook.json. FAIL DC-V-05 risk: risk-2 isn't scoped to the {Workspace} parameter as a Logs query; FAIL DC-V-04 devices: query 'devices-1' looks back 720 h, more than 72 h; FAIL DC-V-06 grants: the not-evidence banner is missing; FAIL DC-V-10: the template carries a GUID, a subscription path, fallbackResourceIds set; 4 of 89 checks failed; exit code 1. (The passing lines are left off the slide.) Step 4: (Read-DcJson -Path tests/fixtures/exported/edited.workbook.json).fallbackResourceIds: the fictional workspace's resource path.`,
      cite: ["dc02-arm"],
      ref: "“Lab 1: fixtures, no tenant,” steps 3–4",
    },
    {
      part: "How", title: "Lab 1: record the validation",
      body: [
        { terminal: "02-7", lines: "1,12-15" },
        { terminal: "02-8" },
      ],
      sources: "Sources: examples/daily-checks-workbook (fictional fixtures). Chapter 02, “Lab 1,” steps 5–6.",
      say: `Step 5 records a validation of the kit's template: the same eighty-nine checks pass, and the results go to a folder with a hashed manifest, ready for Chapter 4's evidence record. Step 6 runs this chapter's tests: ten passed, none failed. Then delete the output folder.`,
      detail: `Step 5: ./Test-DcWorkbook.ps1 -OutputPath out/validate -AsOf 2026-11-16T07:05:00Z: All 89 checks pass; Written to out/validate: results.json, manifest.json; (Test-DcRunFolder -Path out/validate).Detail: 1 file matches the manifest. (The per-check lines are left off the slide.) Step 6: Invoke-Pester -Path tests/DailyChecks.Tests.ps1 -FullNameFilter 'Chapter 02*': 10 passed, 0 failed. Then Remove-Item -Recurse -Force out.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 5–6",
    },
    {
      part: "How", title: "Lab 2: round-trip through the portal",
      body: [
        { steps: [
          { title: "Open", text: "Monitor > Workbooks > New; Advanced Editor (</>); Gallery Template tab: paste daily-checks.workbook.json; Apply; Done Editing. Pick the test workspace; open all twelve tabs" },
          { title: "Save, edit, export", text: "Save as “Daily checks (lab)” in the test resource group; change one look-back; copy the Gallery Template tab to <downloads-folder>/daily-checks-export.json" },
          { title: "Validate", text: "./Test-DcWorkbook.ps1 -TemplatePath <downloads-folder>/daily-checks-export.json: your edit, and the workspace the portal saved, both fail" },
          { title: "Back out", text: "Delete “Daily checks (lab)” in the portal; Remove-Item the export" },
        ] },
        { callout: "record any other difference the portal introduced in the workbook's research gaps. Not run by the authors.", label: "Also: ", color: "teal" },
      ],
      sources: "Sources: Chapter 02, “Lab 2: a test workspace,” steps 1–4; research gaps, row 1.",
      say: `Lab 2 runs in a test subscription, never production, and the authors haven't run it. Open the template in the portal through the Advanced Editor, pick the test workspace, and open all twelve tabs. Save a test copy, change one look-back, and copy the Gallery Template back out. Validate the export: your edit fails, and so does the workspace the portal saved into it. Record any other difference the portal introduced; that confirms the item format, which Learn doesn't document field by field. Then delete the test copy and the export.`,
      detail: `Lab 2 steps: (1) In the Azure portal: Monitor > Workbooks > New; open the Advanced Editor (</>); on the Gallery Template tab, replace the content with workbook/daily-checks.workbook.json; Apply, then Done Editing; select the test workspace and confirm each of the twelve tabs opens and shows the banner. (2) Save with the title "Daily checks (lab)" in the test resource group; Edit, change any one query's look-back, Done Editing, then copy the Gallery Template tab's content into <downloads-folder>/daily-checks-export.json. (3) ./Test-DcWorkbook.ps1 -TemplatePath <downloads-folder>/daily-checks-export.json; record any other difference. (4) Delete "Daily checks (lab)" in the portal; Remove-Item the export. Research gap 1: the workbook item schema isn't documented field by field on Learn.`,
      cite: [],
      ref: "“Lab 2: a test workspace”",
    },
    {
      part: "How", title: "Evidence, dangers and the checklist",
      body: [
        { table: { head: ["Output", "Supports", "KSI"], w: [6.2, 2.9, 3.05], rows: [
          ["The template is the reviewed build (Lab 1, step 1)", "CM-2", "KSI-SVC-ACM"],
          ["It matches the manifest, no IDs (steps 2, 5)", "CM-2, CM-3", "KSI-SVC-ACM, KSI-CMT-LMC"],
          ["A portal edit is caught before it replaces it", "CM-3", "KSI-CMT-LMC"],
        ] }, pt: 12 },
        { table: { head: ["Danger", "The guard"], w: [6.2, 5.95], rows: [
          ["A portal export committed as is", "DC-V-10"],
          ["A tab that silently widens its look-back", "DC-V-04"],
          ["One query on another workspace; the banner removed", "DC-V-05; DC-V-06"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 02, “Federal requirements and evidence,” “Dangers,” “Checklist.” KSIs: FedRAMP 20x indicators for providers.",
      say: `What does this support? The build check shows the template is the reviewed baseline, configuration management C M two. The validation record supports C M two and change control, C M three, and catching a portal edit before it replaces the template supports C M three. The dangers are the four edits you just saw: an export committed as is, a widened look-back, a query on another workspace, and a missing banner. Each has its check. Next, Chapter 3 shows what each tab would display, without a tenant.`,
      detail: `Federal requirements: the template is the reviewed build supports CM-2 (KSI-SVC-ACM); it matches the manifest and carries no IDs (results.json, the template's SHA-256) supports CM-2 and CM-3 (KSI-SVC-ACM, KSI-CMT-LMC); a portal edit is caught before it replaces the reviewed template supports CM-3 (KSI-CMT-LMC). The kit's records support these controls; the agency's assessor decides them. KSIs are FedRAMP 20x indicators for cloud service providers. Dangers: a portal export committed as is (DC-V-10); a tab that silently widens its look-back (DC-V-04); one query on another workspace (DC-V-05); the banner removed (DC-V-06); the telemetry list drifts from the manifest (DC-V-09).`,
      cite: [],
      ref: "“Federal requirements and evidence”; “Dangers”; “Checklist”",
    },
  ],
});
