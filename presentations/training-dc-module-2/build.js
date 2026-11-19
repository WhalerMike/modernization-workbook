// Daily Checks Dashboard learning path, Module 2: Reading it, deploying it and keeping the evidence — the module's
// narrated deck. Teaches docs/training/daily-checks-dashboard/02-reading-deploying-and-the-evidence.md, Learn-style:
// objectives, the units, Lab 1 (real kit output from data/kit-captures/dc/), the runbook and Lab 2, the federal
// requirement, a two-question check and the summary. Every fact comes from the module page and the guide it sends the
// learner to (docs/books/guides/daily-checks-dashboard-implementation.md, whose footnotes are the cite names). Laid out
// with ../_build/devwb.js in page mode.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/training-dc-module-2/build.js
require("../_build/devwb.js")({
  workbook: "dc", dir: __dirname,
  pages: ["docs/training/daily-checks-dashboard/02-reading-deploying-and-the-evidence.md", "docs/books/guides/daily-checks-dashboard-implementation.md"],
  base: "Training_DC_Module_2",
  series: "Daily Checks Dashboard learning path, Module 2",
  title: "Module 2: Reading it, deploying it and keeping the evidence",
  deckTitle: "Module 2: Read it, deploy it, keep the evidence",
  subtitle: "The Daily Checks on One Dashboard · guide Steps 3 to 6",
  map: "Reading each tab · STALE is not CLEAR · what-if and the approved hash · rollback · the evidence · Lab 1 and Lab 2 · a check",
  slides: [
    {
      say: `Welcome to Module 2 of The Daily Checks on One Dashboard: reading it, deploying it, and keeping the evidence. A dashboard's most dangerous state isn't red: it's green over a source that stopped arriving. In this module you read the workbook the way an operator should, telemetry first; deploy it the way a change should go, previewed and approved; and keep the evidence the way an assessor needs it. About forty minutes, plus a lab. The module has been reviewed and approved.`,
      detail: `Module 2 covers guide Steps 3 to 6. About 40 minutes, plus Lab 2. Units: reading the workbook; deploying it; the evidence. Exercises: Lab 1 (Chapter 03 of the developer workbook) and the runbook (Chapter 04, step 4); Lab 2 (Chapter 03's reachability check in a test workspace, then Chapter 04's Stage 1 with a change record).`,
      cite: [],
      ref: "Module 2, introduction",
    },
    {
      part: "Why", title: "Objectives: what you'll be able to do",
      body: [
        { lead: "Green over a source that stopped arriving is the state to fear." },
        { bullets: [
          "Read each tab as **ATTENTION, CLEAR, STALE, NO DATA or LINK-OUT**",
          "Explain why an empty queue over a stale source is **STALE**",
          "Run the **reachability check** and read its result",
          "**Deploy by an approved hash**, and roll back",
          "Say what **is, and isn't,** evidence",
        ], label: "Learning objectives", color: "navy", pt: 15 },
      ],
      sources: "Sources: Module 2, “Introduction,” “Learning objectives.”",
      say: `By the end of this module you'll be able to read each tab as attention, clear, stale, no data or link-out; explain why an empty queue over a stale source is stale; run the reachability check and read its result; deploy by an approved hash, and roll back; and say what is, and isn't, evidence.`,
      detail: `Learning objectives as listed on the module page.`,
      cite: [],
      ref: "Module 2, “Learning objectives”",
    },
    {
      part: "What", title: "Unit 1: reading the workbook",
      body: [
        { steps: [
          { title: "Telemetry first", text: "a dark source makes every tab over it unreliable; each dark source is a high-severity task" },
          { title: "Then each tab", text: "each row that needs work becomes, or is matched to, a task with an owner" },
          { title: "Link-outs", text: "work Entra Health and the ITSM queue where they live" },
          { title: "Never", text: "the workbook doesn't close a task, page anyone or prove a check happened" },
        ] },
        { callout: "an empty queue over a stale source is STALE, never CLEAR. A missed probe shows yesterday's verdict; a silent server is a row with an old heartbeat, flagged.", label: "The rule: ", color: "red", icon: "FaTriangleExclamation" },
      ],
      sources: "Sources: Module 2, Unit 1; the guide, Step 5; Building the Daily Checks Workbook, Ch 03, “The render rules.”",
      say: `Unit 1: reading the workbook. Telemetry completeness comes first, because every other tab depends on its sources: a dark source is a high-severity task. Then each tab in turn, and each row that needs work becomes, or is matched to, a task with an owner. Entra Health and the I T S M queue are worked where they live. The workbook never closes a task, pages anyone, or proves a check happened. And the rule: an empty queue over a stale source reads stale, never clear. A missed probe shows yesterday's verdict, so its tab is stale too. A synchronization server or domain controller that stops sending isn't an empty list: it's a row with an old heartbeat, flagged. And the replication probe needs Enterprise Admins or equivalent to read replication, so it runs only on a Tier 0 host, or not at all.`,
      detail: `Unit 1 (the guide's Step 5 and Chapter 03's render rules): telemetry completeness comes first, because every other tab depends on its sources; each dark source opens a high-severity task, and the completeness alert rule, not the tab, is the record. A tab with no rows has only proved its query returned nothing: if its source has gone quiet, the renderer shows STALE. A missed probe shows yesterday's verdict, so its tab is STALE too. A synchronization server or domain controller that stops sending isn't an empty list: it is a row with an old heartbeat, flagged. The replication probe needs Enterprise Admins or equivalent to read replication, so it runs only on a Tier 0 host, or not at all (Chapter 04). Each finding becomes a task; the workbook never closes one.`,
      cite: [],
      ref: "Module 2, Unit 1",
    },
    {
      part: "What", title: "Unit 2: deploying it",
      body: [
        { cols: [[{ bullets: [
          "**what-if** predicts the change and makes none; it needs the same rights as a deployment",
          "A second person approves the plan's **SHA-256**",
          "The kit deploys nothing else, and **refuses a Delete**",
        ], label: "Previewed and approved", color: "navy", pt: 14 }], [{ bullets: [
          "Deployer: **Workbook Contributor** and deployment rights on the resource group, for the window",
          "Rollback: **redeploy** the previous approved plan, or **delete** the workbook",
          "Deleting removes **a view only**",
        ], label: "Least privilege and the way back", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Module 2, Unit 2; the guide, Steps 3–4; Learn, Bicep what-if; built-in roles for Monitor.",
      say: `Unit 2: deploying it. What-if previews the change and makes none, and it needs the same deployment rights as the deployment itself. The plan's hash is what a second person approves, and the kit deploys nothing else; it refuses any plan that would delete. The deployer holds Workbook Contributor and deployment rights on the resource group only, for the window. Rollback is a redeploy of the previous approved plan, or a delete that removes a view and nothing else.`,
      detail: `What-if (az deployment group what-if) predicts the changes "if the specified Bicep file is deployed" and changes nothing; it has the same permission requirements as a deployment (Microsoft.Resources/deployments/*). The plan's SHA-256 is what a second person approves; the kit refuses a plan with a Delete. Workbook Contributor "Can save shared workbooks". Rollback: redeploy the previous approved plan, or delete the workbook; deleting removes a view only: no log data, alert rule or task changes.`,
      cite: ["dcg-whatif", "dcg-roles"],
      ref: "Module 2, Unit 2",
    },
    {
      part: "What", title: "Unit 3: the evidence",
      body: [
        { cols: [[{ bullets: [
          "The validation, preflight and plan",
          "The deployment",
          "The reachability check",
          "The rollback plan",
          "Each hashed and chained, with controls and KSIs",
        ], label: "Recorded", color: "teal", pt: 14 }], [{ bullets: [
          "A rendered view: **“A rendered view is not evidence.”**",
          "A screenshot of a tab",
          "Fixture or dry-run records, at the go/no-go",
        ], label: "Never recorded, or never counted", color: "red", pt: 14 }]] },
      ],
      sources: "Sources: Module 2, Unit 3; the guide, Step 6 and “Dangers.”",
      say: `Unit 3: the evidence. The kit records the validation, the preflight, the plan, the deployment, the reachability check and the rollback plan, each hashed and chained, with its controls and indicators. It refuses a render, with the words: a rendered view is not evidence. A screenshot of a tab isn't evidence either. And at the go or no-go, only live records count.`,
      detail: `The kit records the validation, preflight, plan, deployment, reachability check and rollback plan, each hashed and chained. It refuses a render: "A rendered view is not evidence." The stage's go/no-go counts only live records.`,
      cite: [],
      ref: "Module 2, Unit 3",
    },
    {
      part: "Who", title: "Who reads, who approves, who keeps",
      body: [
        { table: { head: ["Who", "In this module"], w: [3.6, 8.55], rows: [
          ["Operators", "Read telemetry first, then their family's tabs; open the tasks"],
          ["Security operations", "Plans, deploys and checks reachability"],
          ["A second person", "Approves the plan's SHA-256 in the change record"],
          ["ISSO", "Keeps the evidence folder; never a render or screenshot"],
        ] }, pt: 14 },
        { table: { head: ["Requirement", "KSI", "Evidence"], w: [4.4, 3.6, 4.15], rows: [
          ["CM-3, CM-4: previewed and approved", "KSI-CMT-LMC, KSI-CMT-RVP", "plan.json, whatif.json"],
          ["CA-7, SI-4: tables answer", "KSI-MLA-EVC, KSI-MLA-LET", "reach.json"],
          ["CA-7, AU-9: records chained", "KSI-MLA-EVC, KSI-MLA-OSM", "records/, SHA256SUMS"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Module 2, “The federal requirement,” “Summary”; the guide, RACI. KSIs: FedRAMP 20x indicators for providers.",
      say: `Who does what? Operators read telemetry first, then their family's tabs, and open the tasks. Security operations plans, deploys and checks reachability. A second person approves the plan's hash in the change record. And the security officer keeps the evidence folder, never a render or a screenshot. The plan and what-if support change control and impact analysis; the reachability record supports continuous and system monitoring; and the chained records support the protection of audit information. The assessor decides.`,
      detail: `The federal requirement: CM-3, CM-4 (KSI-CMT-LMC, KSI-CMT-RVP) plan.json, whatif.json, the change record; CA-7, SI-4 (KSI-MLA-EVC, KSI-MLA-LET) reach.json; CA-7, AU-9 (KSI-MLA-EVC, KSI-MLA-OSM) records/, SHA256SUMS. The steps support these controls; the assessor decides whether each is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers.`,
      cite: [],
      ref: "Module 2, “The federal requirement”",
    },
    {
      part: "How", title: "Lab 1: the morning the logs stopped",
      body: [
        { terminal: "03-1", lines: "1-15" },
        { terminal: "03-6" },
      ],
      sources: "Sources: Building the Daily Checks Workbook, Ch 03, “Lab 1,” steps 1 and 6 (fictional fixtures, November 16, 2026).",
      say: `Lab 1 is in the developer workbook's Chapter 3, on a laptop with no tenant. You render the morning of November sixteenth, when the Entra diagnostic setting stopped overnight, the probe didn't run and a domain controller went silent: four telemetry rows flagged; sync, risk, emergency access, grants and admin changes all stale; and the Active Directory tab, whose sources are fresh, flagging the silent controller. Then you render the next morning, run the replication probe on a saved replication report, and check reachability. And when you try to record the first render as evidence, the kit refuses.`,
      detail: `Chapter 03, Lab 1 step 1: ./Invoke-DcRender.ps1 -FixturePath tests/fixtures/day1 -AsOf 2026-11-16T07:30:00Z: telemetry ATTENTION 4 of 14; sync, risk, emergency access, grants and admin changes STALE; Active Directory ATTENTION 4 of 8 (CTX-DC-03 silent since 19:00, both links from it failing). Step 3 (day2): one user at high risk, one emergency access sign-in (the quarterly drill), one synchronization conflict. Step 4: the replication probe on saved repadmin output: 4 links, 2 failing. Step 5: the reachability check. Step 6: Invoke-DcEvidence.ps1 -RunPath out/day1: "A rendered view is not evidence." Chapter 04 step 4: read the fixture-mode plan output, one Create and the SHA-256 to approve.`,
      cite: [],
      ref: "Module 2, “Exercise: Lab 1”",
    },
    {
      part: "How", title: "Lab 2, a knowledge check and the summary",
      body: [
        { bullets: [
          "**Lab 2**: Chapter 03's reachability check against a test workspace; then, with a change record, Chapter 04's Stage 1 in the test subscription. Never production; not run by the authors",
          "**Q1.** SigninLogs stopped; the risk tab returns no rows. What does it show? A: CLEAR. B: STALE. C: NO DATA",
          "**Q2.** The what-if shows a Delete. What does the kit do? A: deploy. B: refuse the plan. C: ask for confirmation",
        ], pt: 14 },
        { callout: "Q1 is B: its source is past its 60-minute limit. Q2 is B: the workbook deployment never deletes.", label: "Answers: ", color: "teal", icon: "FaListCheck" },
      ],
      sources: "Sources: Module 2, “Exercise: Lab 2,” “Knowledge check,” questions 1 and 3, “Summary.”",
      say: `Lab 2 runs the reachability check against a test workspace, then, with a change record, the runbook's first stage in a test subscription: never production, and the authors haven't run it. Two questions. On the morning the sign-in logs stopped, the risk tab returns no rows: what does it show? Stale, because its source is past its sixty-minute limit. And when the what-if shows a delete, what does the kit do? It refuses the plan: the workbook deployment never deletes. In summary: you read the workbook telemetry first, deployed it previewed and approved by hash, and kept the checks' records as the evidence, never the picture.`,
      detail: `Lab 2: Chapter 03, Lab 2 (the reachability check against the test workspace); then, with a change record, Chapter 04's Stage 1 in the test subscription. Knowledge check question 1: b, STALE: its source is past its 60-minute limit, so the empty queue proves nothing. Question 3: b, refuse the plan: the workbook deployment never deletes. Summary: evidence an ISSO keeps from this module: the evidence folder with the preflight, validation, plan, deployment, reachability and rollback records, records.csv and SHA256SUMS, and the change record with the approved SHA-256. No render or screenshot.`,
      cite: [],
      ref: "Module 2, “Exercise: Lab 2”; “Knowledge check”; “Summary”",
    },
  ],
});
