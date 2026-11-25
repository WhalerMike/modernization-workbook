// Building the Daily Checks Workbook — the story deck: two mornings in one workspace.
// Teaches the whole developer workbook (docs/project-plans/developer-workbooks/daily-checks/) through one case: the
// fictional contoso.example workspace in the kit's own fixtures (examples/daily-checks-workbook/tests/fixtures/day1,
// November 16, 2026, and day2, November 17, 2026). Scenes in chapter order, each with a "Try it" slide showing the
// chapter's real Lab 1 output (data/kit-captures/dc/) and a one-question check whose answer opens the next scene.
// Chapter 04 has no Lab 1: its scene shows the page's own fixture-mode output. Laid out with ../_build/devwb.js in page
// mode; cite names are the four chapters' footnotes. No new facts.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dc-story-two-mornings/build.js
const D = "docs/project-plans/developer-workbooks/daily-checks/";
require("../_build/devwb.js")({
  workbook: "dc", dir: __dirname,
  pages: [D + "01-the-daily-checks-and-where-each-lives.md", D + "02-the-workbook-template-and-its-validator.md",
    D + "03-what-each-tab-would-show.md", D + "04-deploying-to-test-and-production.md"],
  base: "DC_Story_Two_Mornings",
  series: "Building the Daily Checks Workbook — Two Mornings",
  title: "Two Mornings, One Workspace",
  deckTitle: "Two Mornings, One Workspace",
  subtitle: "Building the Daily Checks Workbook — one fictional workspace, followed through every chapter",
  map: "Twelve checks, twelve tabs · an edited export · the morning the logs stopped · the next morning · a refused render · deploy by hash",
  slides: [
    {
      say: `Welcome to the story deck for Building the Daily Checks Workbook. Instead of four chapters one at a time, we'll follow one fictional workspace, for contoso dot example, through two mornings: November sixteenth, 2026, when something quietly broke overnight, and the next morning, when it was fixed. Every value comes from the kit's own test fixtures, and every output on a slide is what the kit really printed. The workbook has been reviewed and approved, and the code is illustrative, tested against fixtures.`,
      detail: `The case: the fictional contoso.example workspace in examples/daily-checks-workbook/tests/fixtures: day1 (November 16, 2026, 07:30 UTC: the Entra diagnostic setting stopped at 17:10 the day before, the sync probe didn't run, and domain controller CTX-DC-03 stopped sending at 19:00) and day2 (November 17, 2026: the setting restored, the probe ran). Scenes follow the chapters: the manifest (Chapter 01), the template and an edited export (Chapter 02), the two mornings, the replication probe and reachability (Chapter 03), the deployment (Chapter 04).`,
      cite: [],
      ref: "the workbook index; the four chapters",
    },
    {
      part: "Why", title: "The operator's morning, before the workbook",
      body: [
        { lead: "Twelve daily checks, most done one portal at a time. A quiet portal looks the same as a broken feed." },
        { steps: [
          { title: "Scene 1", text: "twelve checks become twelve tabs, two of them link-outs" },
          { title: "Scene 2", text: "an export edited in the portal fails four checks" },
          { title: "Scene 3", text: "November 16: the sign-in logs stopped, and a domain controller went silent" },
          { title: "Scene 4", text: "November 17: what the empty queues were hiding" },
          { title: "Scene 5", text: "the render is refused as evidence; the reachability and probe records aren't" },
          { title: "Scene 6", text: "the same commands in test, then production, deployed by hash" },
        ] },
      ],
      sources: "Sources: Building the Daily Checks Workbook, index and Chapters 01–04; the kit's fixtures day1 and day2.",
      say: `Here's the route. The operator runbook asks for twelve daily checks, most done one portal at a time, and a quiet portal looks just like a broken feed. Scene one turns twelve checks into twelve tabs. Scene two catches an export someone edited in the portal. Scene three is the morning of November sixteenth, when the sign-in logs stopped overnight and a domain controller went silent. Scene four is the next morning, and what the empty queues were hiding. Scene five tries to file the picture as evidence. And scene six deploys it, the same way twice.`,
      detail: `Scenes: (1) Chapter 01, the manifest; (2) Chapter 02, the validator and the edited export; (3) Chapter 03, day1; (4) Chapter 03, day2; (5) Chapter 03, the refused render, and the reachability and replication probe records; (6) Chapter 04, the runbook.`,
      cite: [],
      ref: "the four chapters",
    },
    {
      part: "What", title: "Scene 1: twelve checks, twelve tabs",
      body: [
        { terminal: "01-3", lines: "1-3,6-16" },
        { callout: "Entra Health's alerts aren't in Log Analytics, and its GCC availability is not yet specified: its tab is a link out to the Entra admin center.", label: "Why a link-out: ", color: "teal" },
      ],
      sources: "Sources: Chapter 01, “The code,” “Lab 1,” step 1 (fictional fixtures); Learn, Entra Health monitoring.",
      say: `Scene one. The kit's manifest gives each daily check one row, and the workbook one tab. Ten tabs read tables in the Sentinel workspace, among them the domain controllers on the Active Directory tab, and the request-driven admin changes. Two are link-outs. Entra Health's alerts live in the admin center and in e-mail, not in Log Analytics, and their G C C availability is not yet specified, so the tab sends the operator there instead of pretending. And the catalog tasks live in the I T S M tool. Three more tabs are partial: grants, admin changes, and the log review queue.`,
      detail: `Chapter 01, Lab 1 step 1: ./Show-DcManifest.ps1 (the telemetry row is left off the slide). Twelve tabs: telemetry, sync, active-directory, entra-health (link-out), risk, emergency-access, devices, grants (partial), admin-changes (partial), data, tasks (link-out, weak), log-review (partial). Entra Health monitoring is a preview shown in the Microsoft Entra admin center and by e-mail; GCC not yet specified.`,
      cite: ["dc01-entra-health"],
      ref: "Chapter 01, “The code”; “Lab 1,” step 1",
    },
    {
      part: "What", title: "Check 1: what does an empty tab prove?",
      body: [
        { lead: "The risk tab's query returns no rows. What has it proved?" },
        { cards: [
          { title: "A", text: "Nobody is at risk", color: "navy" },
          { title: "B", text: "Only that its query returned nothing; it depends on its source being fresh", color: "teal" },
          { title: "C", text: "That ID Protection is turned off", color: "amber" },
        ] },
      ],
      sources: "Sources: Chapter 03, “What it leaves to you,” “The render rules.”",
      say: `Check one. The risk tab's query returns no rows. What has it proved? A: nobody is at risk. B: only that its query returned nothing, which means something only if its source is fresh. Or C: that I D Protection is turned off. Hold your answer; the next scenes answer it.`,
      detail: `Answer: B. A tab that reads clear proves only that its query returned nothing; the renderer shows STALE, never CLEAR, when a source the tab depends on is past its freshness limit (Chapter 03, the render rules).`,
      cite: [],
      ref: "Chapter 03, “The code” — “The render rules”",
    },
    {
      part: "What", title: "Scene 2: an export edited in the portal",
      body: [
        { terminal: "02-5", lines: "1,12-17" },
        { callout: "an exported template often embeds the subscription and resource group: mask them. The kit's check fails them instead.", label: "Microsoft Learn: ", color: "amber", icon: "FaTriangleExclamation" },
      ],
      sources: "Sources: Chapter 02, “Lab 1,” step 3 (fictional fixtures); Learn, workbooks and ARM templates.",
      say: `Scene two, before any morning. Someone edited the workbook in the portal and exported it. The validator finds four edits: a risk query that reads a workspace path instead of the parameter, a devices query that now looks back thirty days, a grants tab that lost its banner, and a subscription path in the file. Microsoft's own advice is to mask the I D's an export embeds; the kit's check simply fails them. Remember the banner. It says the workbook is a view, not evidence.`,
      detail: `Chapter 02, Lab 1 step 3: ./Test-DcWorkbook.ps1 -TemplatePath tests/fixtures/exported/edited.workbook.json: FAIL DC-V-05 risk; FAIL DC-V-04 devices (720 h of 72 h); FAIL DC-V-06 grants (banner missing); FAIL DC-V-10 (GUID, subscription path, fallbackResourceIds); 4 of 89 checks failed; exit code 1. Learn advises masking the sensitive values an export embeds.`,
      cite: ["dc02-arm"],
      ref: "Chapter 02, “Lab 1,” step 3",
    },
    {
      part: "Who", title: "Who reads which tab each morning",
      body: [
        { table: { head: ["Who", "Reads", "Turns each finding into"], w: [3.2, 4.6, 4.35], rows: [
          ["Security operations", "Telemetry completeness, first", "A high-severity task per dark source"],
          ["Identity operations", "Sync probe, risk, emergency access, grants", "A task, or a recorded review"],
          ["Device support", "Noncompliant devices", "Work in Intune and the ITSM tool"],
          ["Data platform operators", "DLP and label alerts", "Triage in Purview or the Defender portal"],
          ["ISSO", "Nothing on the workbook", "Keeps the records, never the picture"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: the guide, Step 5 and RACI; Chapter 03, “Goal and audience,” “Checklist”; the manifest's actions.",
      say: `Who reads the workbook? Security operations reads telemetry completeness first, and opens a high-severity task for each dark source. Identity operations reads the sync probe, risk, emergency access and grants tabs. Device support works the noncompliant devices in Intune and the I T S M tool. The data platform operators triage D L P alerts in Purview or the Defender portal. And the security officer reads nothing on the workbook at all: they keep the records, never the picture.`,
      detail: `Roles per the guide's Step 5 and RACI (the operator for each family, as the operator runbook's Who does it assigns): telemetry first, each dark source a high-severity task; each row that needs work becomes, or is matched to, a task; link-out tabs worked where they live. The ISSO keeps the evidence: the kit's records, never a render (Chapter 03 checklist: no render or screenshot in the evidence package).`,
      cite: ["dc03-access"],
      ref: "Chapter 03, “Goal and audience,” “Checklist”; the guide, Step 5",
    },
    {
      part: "How", title: "Scene 3: the morning the logs stopped",
      body: [
        { terminal: "03-3", lines: "1-15" },
      ],
      sources: "Sources: Chapter 03, “Lab 1,” step 1 (fictional fixtures, November 16, 2026).",
      say: `The answer to check one is B: an empty tab proves only that its query returned nothing. Scene three: November sixteenth. At ten past five the evening before, the Entra diagnostic setting stopped, and this morning's probe didn't run. Telemetry flags four rows: three dark tables and a failing connector. And look at risk, emergency access, sync, grants and admin changes. They're not clear. They're stale. On a plain dashboard, the risk and emergency access tabs would have shown two calm, empty queues. The Active Directory tab's sources are fresh, and it shows why that matters: the third domain controller stopped sending at seven the evening before, and both replication links from it are failing.`,
      detail: `Chapter 03, Lab 1 step 1: ./Invoke-DcRender.ps1 -FixturePath tests/fixtures/day1 -AsOf 2026-11-16T07:30:00Z: Telemetry ATTENTION 4 of 14 (SigninLogs, AuditLogs and DailySyncProbe_CL dark; the Office 365 connector's latest health event a failure); Synchronization probe STALE (1500 min of 1440), including the two export errors the synchronization server logged overnight; Active Directory ATTENTION 4 of 8 (CTX-DC-03 stopped sending a heartbeat at 19:00, both links from it failing, and the knowledge consistency checker logged event 1311); Risky users and sign-ins STALE (SigninLogs 860 min of 60); Emergency access STALE; Noncompliant devices ATTENTION 3 of 3; Consents, roles and grants STALE, rows may be incomplete; Admin changes STALE; DLP ATTENTION 1; Log review ATTENTION 2; two LINK-OUT.`,
      cite: [],
      ref: "Chapter 03, “Lab 1,” step 1",
    },
    {
      part: "How", title: "Try it: render the first morning",
      body: [
        { code: [
          "./Invoke-DcRender.ps1 -FixturePath tests/fixtures/day1 -AsOf 2026-11-16T07:30:00Z -OutputPath out/day1",
          "Get-Content tests/fixtures/day1/risk.json",
        ], label: "From examples/daily-checks-workbook, PowerShell 7: no tenant", pt: 12 },
        { terminal: "03-4" },
      ],
      sources: "Sources: Chapter 03, “Lab 1,” steps 1–2 (fictional fixtures).",
      say: `Try it. From the kit's folder, render the first morning, then read what the risk tab's query returned. No rows at all. But its source, the sign-in logs, last arrived at ten past five the evening before. Shown as a quiet queue, this is the morning a risky sign-in goes unseen.`,
      detail: `Chapter 03, Lab 1 steps 1–2. Get-Content tests/fixtures/day1/risk.json: "rows": []; sources SigninLogs 2026-11-15T17:10:00Z, AADRiskyUsers 2026-11-15T16:55:00Z.`,
      cite: [],
      ref: "Chapter 03, “Lab 1,” steps 1–2",
    },
    {
      part: "How", title: "Scene 4: what the empty queues were hiding",
      body: [
        { terminal: "03-5", lines: "1-15" },
      ],
      sources: "Sources: Chapter 03, “Lab 1,” step 3 (fictional fixtures, November 17, 2026).",
      say: `Scene four: the next morning. The diagnostic setting is back, and telemetry is clear. Now the queues show what they were hiding. One user at high risk. One emergency access sign-in, which turns out to be the quarterly validation drill, and the review records it as a drill. One synchronization conflict, and a staging synchronization server that wrote no backup event. And the admin changes tab lists yesterday's five request-driven changes, each to be matched to its ticket. Grants, D L P alerts and Active Directory are clear, and this time clear means something, because their sources are fresh.`,
      detail: `Chapter 03, Lab 1 step 3: ./Invoke-DcRender.ps1 -FixturePath tests/fixtures/day2 -AsOf 2026-11-17T07:30:00Z: Telemetry CLEAR; Synchronization probe ATTENTION 2 of 3 (one PropertyConflict; the staging synchronization server wrote no backup event); Active Directory CLEAR; Risky users ATTENTION (one user at high risk); Emergency access ATTENTION (the quarterly validation drill); Noncompliant devices ATTENTION 1; grants CLEAR; Admin changes ATTENTION 5 of 5 (yesterday's five request-driven changes, each to match to its ticket); DLP CLEAR; Log review ATTENTION 1.`,
      cite: [],
      ref: "Chapter 03, “Lab 1,” step 3",
    },
    {
      part: "How", title: "Check 2: can the render be the evidence?",
      body: [
        { lead: "The first morning's render shows exactly what went wrong. Should it go in the evidence package?" },
        { cards: [
          { title: "A", text: "Yes: it is a dated picture of the problem", color: "navy" },
          { title: "B", text: "Yes, once a second person signs it", color: "amber" },
          { title: "C", text: "No: record the checks' own output, such as the reachability check", color: "teal" },
        ] },
      ],
      sources: "Sources: Chapter 03, “Lab 1,” steps 6–7; the guide, Step 6.",
      say: `Check two. The first morning's render shows exactly what went wrong. Should it go in the evidence package? A: yes, it's a dated picture of the problem. B: yes, once a second person signs it. Or C: no; record the checks' own output, like the reachability check. The next scene shows what the kit does.`,
      detail: `Answer: C. Write-DcEvidence refuses a render folder: "A rendered view is not evidence." The kit records the reachability check and the replication probe (Chapter 03, Lab 1, steps 6–7).`,
      cite: [],
      ref: "Chapter 03, “Lab 1,” steps 6–7",
    },
    {
      part: "How", title: "Scene 5: a refused render, a kept record",
      body: [
        { terminal: "03-8" },
        { terminal: "03-9" },
      ],
      sources: "Sources: Chapter 03, “Lab 1,” steps 4–7 (fictional fixtures).",
      say: `The answer is C. Scene five. The kit refuses to record the render: a rendered view is not evidence. Instead it records the reachability check, which asked the workspace for each table's newest record, and the replication probe, which found the third domain controller's two failing links. Both results are Fail, and that's the point: each record keeps what its check found, tagged with continuous monitoring and system monitoring and their indicators. A failing record is evidence of the gap; a screenshot is only a picture of it.`,
      detail: `Chapter 03, Lab 1 step 6: ./Invoke-DcEvidence.ps1 -EvidencePath out/evidence -RunPath out/day1: Exception: A rendered view is not evidence. Step 7: ./Invoke-DcEvidence.ps1 -RunPath out/reach: Record 1: reachability Fail (REACH, EVIDENCE); -RunPath out/probe: Record 2: probe Fail (PROBE, EVIDENCE); Controls AU-9, CA-7, SI-4; KSIs KSI-MLA-EVC, KSI-MLA-LET, KSI-MLA-OSM. The replication probe on day 1's saved repadmin output (step 4) found 4 links, 2 failing with status 1722, both from CTX-DC-03; the reachability check (step 5) found SigninLogs, AuditLogs and the sync probe's table Late, and SentinelHealth Missing.`,
      cite: [],
      ref: "Chapter 03, “Lab 1,” steps 4–7",
    },
    {
      part: "How", title: "Scene 6: test, then production, by hash",
      body: [
        { code: [
          "./deploy/New-DcDeploymentPlan.ps1 -SettingsPath <settings-test> -OutputPath <out-test>/plan -RunWhatIf",
          "# Fixture mode, November 16, 2026:",
          "  what-if: Create   Microsoft.Insights/workbooks/6e1c2b74-3f0d-5a59-9b8e-0c4f2d1a7b31",
          "./deploy/Invoke-DcDeploy.ps1 -PlanPath <out-test>/plan -ApprovedSha256 <plan-sha256> -OutputPath <out-test>/deploy -Apply",
          "./Invoke-DcEvidence.ps1 -EvidencePath <evidence-test> -Check -Stage test",
        ], label: "Chapter 04: the runbook (not run against a live subscription)", pt: 10.5 },
        { callout: "what-if predicts the change and makes none; a second person approves the plan's SHA-256; production waits for the test stage's evidence.", label: "The rule: ", color: "teal" },
      ],
      sources: "Sources: Chapter 04, “Stage 1,” steps 4–6, “Go or no-go,” “Stage 2”; Learn, Bicep what-if.",
      say: `Scene six. The workbook goes to a test subscription, then production, with the same commands and a different settings file. The plan previews the change with what-if, which predicts and changes nothing; on the fixtures it predicts one create, a single workbook. A second person approves the plan's hash, and the kit deploys nothing else, and never a plan that would delete. Production waits until the test stage's evidence passes. That's the story: twelve checks on one page, a picture the operator can trust only because the records behind it are kept.`,
      detail: `Chapter 04: plan with what-if (fixture mode, November 16, 2026: one Create of Microsoft.Insights/workbooks); approve the SHA-256 in the change record; Invoke-DcDeploy deploys only the approved plan with -Apply and refuses a Delete; the go/no-go: Invoke-DcEvidence.ps1 -Check -Stage test; production's preflight PF-06 refuses until the test stage's evidence passes. What-if needs the same permissions as a deployment. Nothing has been run against a live subscription.`,
      cite: ["dc04-whatif"],
      ref: "Chapter 04, “Stage 1,” “Go or no-go,” “Stage 2”",
    },
  ],
});
