// Daily Checks Dashboard learning path, Module 1: One workbook, one tab per daily check — the module's narrated deck.
// Teaches docs/training/daily-checks-dashboard/01-one-workbook-one-tab-per-check.md, Learn-style: objectives, the
// units, Lab 1 (real kit output from data/kit-captures/dc/), Lab 2, the federal requirement, a three-question check and
// the summary. Every fact comes from the module page and the guide it sends the learner to
// (docs/books/guides/daily-checks-dashboard-implementation.md, whose footnotes are the cite names). Laid out with
// ../_build/devwb.js in page mode.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/training-dc-module-1/build.js
require("../_build/devwb.js")({
  workbook: "dc", dir: __dirname,
  pages: ["docs/training/daily-checks-dashboard/01-one-workbook-one-tab-per-check.md", "docs/books/guides/daily-checks-dashboard-implementation.md"],
  base: "Training_DC_Module_1",
  series: "Daily Checks Dashboard learning path, Module 1",
  title: "Module 1: One workbook, one tab per daily check",
  deckTitle: "Module 1: One workbook, one tab per check",
  subtitle: "The Daily Checks on One Dashboard · guide Steps 1 and 2",
  map: "The options · twelve tabs and where each lives · GCC · the template as code · Lab 1 and Lab 2 · a knowledge check",
  slides: [
    {
      say: `Welcome to Module 1 of the learning path The Daily Checks on One Dashboard: one workbook, one tab per daily check. In about forty minutes, plus a lab in a test workspace, you'll see which daily checks a workbook can show and from which table, which ones it can only link to, and how the workbook is kept as a reviewed file rather than something edited in the portal. The module has been reviewed and approved.`,
      detail: `Module 1 covers guide Steps 1 and 2. About 40 minutes, plus Lab 2. Units: dashboards in Azure and Microsoft 365; the twelve tabs and where each lives; the template as code. Exercises: Lab 1 (Chapters 01 and 02 of the developer workbook), Lab 2 (a test workspace). Then a knowledge check and the summary.`,
      cite: [],
      ref: "Module 1, introduction",
    },
    {
      part: "Why", title: "Objectives: what you'll be able to do",
      body: [
        { lead: "Most daily-check data is already in the Sentinel workspace. This module puts it on one page, honestly." },
        { bullets: [
          "Name the dashboard options in Azure and say **why the design is one workbook**",
          "Say, for each daily check, its **table or its link-out**, and how well it fits",
          "Give each source's **GCC availability**",
          "**Build** the template from the manifest and **validate** a portal export",
        ], label: "Learning objectives", color: "navy", pt: 15 },
      ],
      sources: "Sources: Module 1, “Introduction,” “Learning objectives.”",
      say: `Here's what you'll be able to do. Name the dashboard options in Azure, and say why the design is one workbook. Say, for each daily check, its table or its link-out, and how well it fits. Give each source's availability in G C C. And build the workbook's template from the manifest, then validate an export from the portal. You'll need the operator runbook's chapter on the daily checks as a prerequisite, and PowerShell 7 with Pester for the lab.`,
      detail: `Learning objectives as listed. Prerequisites: Compliance Automation and Day-Two Operations, Chapter 12 (the cadence tables and the telemetry-completeness check), about 20 minutes; PowerShell 7.1 or later with Pester 5 for Lab 1; the Azure CLI for Lab 2.`,
      cite: [],
      ref: "Module 1, “Learning objectives”; learning path, “Prerequisites”",
    },
    {
      part: "What", title: "Unit 1: dashboards in Azure and Microsoft 365",
      body: [
        { table: { head: ["Option", "Verdict for the daily checks"], w: [4.3, 7.85], rows: [
          ["Azure Monitor workbook", "The design: the widest set of Azure data, kept as a template"],
          ["Azure portal dashboard", "Partly: tiles, less of the logic"],
          ["Dashboards with Grafana", "Not yet: a preview"],
          ["Azure Managed Grafana; Power BI", "No; for trends only"],
          ["Microsoft 365 admin centers", "Built-in views each; the workbook links out where data stays there"],
        ] }, pt: 13 },
      ],
      sources: "Sources: Module 1, Unit 1; the guide, “Dashboards in Azure and Microsoft 365”; Learn, Azure Monitor visualization best practices.",
      say: `Unit 1. Microsoft's guidance compares workbooks, portal dashboards, Dashboards with Grafana, which is a preview, Azure Managed Grafana and Power BI. Workbooks read the widest set of Azure data and can be managed as Resource Manager templates. Microsoft 365 has built-in views in each admin center, but no single custom dashboard: a view across them needs their logs in Log Analytics. So the design is one workbook in the Sentinel workspace, and a link out where a check's data stays in another portal.`,
      detail: `Microsoft's guidance compares workbooks, portal dashboards, Dashboards with Grafana (a preview), Azure Managed Grafana and Power BI; workbooks read the widest set of Azure data and can be managed as ARM templates. Microsoft 365 has built-in views in each admin center, but no single custom dashboard. Design guidance: one workbook in the Sentinel workspace, and a link out where a check's data stays in another portal.`,
      cite: ["dcg-best", "dcg-arm"],
      ref: "Module 1, Unit 1",
    },
    {
      part: "What", title: "Unit 2: twelve tabs, and their GCC availability",
      body: [
        { cols: [[{ bullets: [
          "**Ten** tabs query tables in the workspace",
          "**Two** link out: Entra Health and the ITSM task queue",
          "**Three partial**: grants and admin changes (the ticket match stays in ITSM); log review (the review stays a procedure)",
          "Sync servers and domain controllers: **one row each**, through the Azure Monitor Agent, never a file share",
        ], label: "The tabs", color: "navy", pt: 13 }], [{ bullets: [
          "Workbooks, Entra and Intune logs, Defender XDR and Defender for Identity alerts, the Azure Monitor Agent, Logs Ingestion API: **available**",
          "Defender portal's connector overview: a commercial preview, **not assumed**",
          "Entra Health, Connect Health: **not yet specified**, so link-outs",
        ], label: "GCC (Moderate), commercial Azure", color: "teal", pt: 13 }]] },
      ],
      sources: "Sources: Module 1, Unit 2; the guide, “What each daily check can show,” “GCC availability.”",
      say: `Unit 2. Ten tabs query tables; two link out: Entra Health, and the I T S M task queue. Three of the ten are partial: the grants and admin changes tabs list changes, but the match to a ticket stays in the I T S M tool, and the log review tab shows the queue while the review stays a recorded procedure. The synchronization servers and domain controllers send their event logs through the Azure Monitor Agent, not to a file share, one row per server. On availability: workbooks, Entra and Intune logs, Defender X D R alerts, the Azure Monitor Agent and the Logs Ingestion API are all available with a G C C tenant and commercial Azure. The Defender portal's connector overview is a commercial-cloud preview, so it isn't assumed. And Entra Health monitoring and Connect Health are not yet specified.`,
      detail: `Ten tabs query tables; two (Entra Health and the ITSM task queue) link out. Three of the ten are partial: grants and admin changes (consents and Entra role assignments on grants, everything else request-driven on admin changes, never both), and the log review queue. The synchronization servers and domain controllers send their event logs and heartbeats through the Azure Monitor Agent, not to a file share, and each server has its own row, so one that stops sending is flagged. Availability from Learn: Sentinel workbooks GA in Azure commercial; Entra diagnostic settings; Intune in GCC is the commercial instance; Defender XDR alerts and incidents GA for Commercial and GCC, Defender for Identity alerts among them (with its own license); the Azure Monitor Agent on Arc-enabled servers, Windows Security Events via AMA and Azure Activity in commercial Azure; the Logs Ingestion API in commercial Azure; the Defender portal's Data & connectors Overview tab a public preview in commercial cloud environments, not assumed; Entra Health monitoring and Connect Health not yet specified.`,
      cite: ["dcg-sentinel-clouds", "dcg-intune-gov", "dcg-xdr-clouds", "dcg-mdi-gov", "dcg-ama", "dcg-health", "dcg-entra-health", "dcg-connect", "dcg-connect-adds"],
      ref: "Module 1, Unit 2",
    },
    {
      part: "What", title: "Unit 3: the template as code",
      body: [
        { lead: "Built from the manifest and one KQL file per query; checked by ten rules." },
        { table: { head: ["Check", "Why it matters in practice"], w: [2.3, 9.85], rows: [
          ["DC-V-04", "A widened look-back makes a month of data look like today's"],
          ["DC-V-05", "One query on another workspace mixes environments"],
          ["DC-V-06", "Without the banner, a tab reads as proof"],
          ["DC-V-10", "An export embeds IDs; Microsoft says to mask them, the kit fails them"],
        ] }, pt: 13.5 },
      ],
      sources: "Sources: Module 1, Unit 3; Building the Daily Checks Workbook, Ch 02; Learn, workbooks and ARM templates.",
      say: `Unit 3. The template is built from the manifest and one K Q L file per query, and a validator runs ten checks on it, or on any export from the portal. Four matter most in practice. A widened look-back makes a month of data look like today's. One query on another workspace mixes environments. Without the banner, a tab reads as proof. And an export embeds I D's: Microsoft says to mask them, and the kit simply fails them.`,
      detail: `The template is built from the manifest and one KQL file per query (New-DcTemplate). The validator runs ten checks (DC-V-01 to -10); the ones that matter most in practice are DC-V-04 (a widened look-back), DC-V-05 (a query on another workspace), DC-V-06 (the banner) and DC-V-10 (IDs an export embeds, which Learn says to mask).`,
      cite: ["dcg-arm"],
      ref: "Module 1, Unit 3",
    },
    {
      part: "Who", title: "Who this module is for",
      body: [
        { table: { head: ["Role", "What you take from Module 1"], w: [3.6, 8.55], rows: [
          ["Security operations", "The sources, the template and its validator"],
          ["Operators", "Which tab shows your family's check, and which link out"],
          ["ISSO reviewer", "Read the introduction and summary; skip the labs"],
        ] }, pt: 14 },
        { table: { head: ["Requirement", "KSI", "Evidence"], w: [5.0, 3.2, 3.95], rows: [
          ["CA-7, SI-4: each tab's tables answer", "KSI-MLA-EVC, KSI-MLA-LET", "The reachability record (Module 2)"],
          ["CM-2, CM-3: the reviewed build, no IDs", "KSI-SVC-ACM, KSI-CMT-LMC", "The validation record"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Module 1, “The federal requirement”; learning path, “Who this path is for.” KSIs: FedRAMP 20x indicators for providers.",
      say: `Who is this for? Security operations takes the sources, the template and its validator. Operators learn which tab shows their family's check, and which ones link out. An I S S O reviewer can read the introduction and summary and skip the labs. Two federal requirements: the reachability record supports continuous and system monitoring, and the validation record supports the baseline and change control. The steps support these controls; the assessor decides.`,
      detail: `Who this path is for: security operations (the sources, the template and its validator, the deployment and the reachability check); operators (what each tab shows, what STALE means, and where each finding goes); ISSO reviewer (what the kit records; read each module's introduction and summary and skip the labs). The federal requirement: CA-7, SI-4 (KSI-MLA-EVC, KSI-MLA-LET) the reachability record (Module 2); CM-2, CM-3 (KSI-SVC-ACM, KSI-CMT-LMC) the validation record and the template's SHA-256. KSIs are FedRAMP 20x indicators for cloud service providers.`,
      cite: [],
      ref: "Module 1, “The federal requirement”; learning path, “Who this path is for”",
    },
    {
      part: "How", title: "Lab 1: the tabs, and the edited export",
      body: [
        { terminal: "01-2", lines: "1-4" },
        { terminal: "02-3", lines: "1,12-17" },
      ],
      sources: "Sources: Building the Daily Checks Workbook, Ch 01 and 02, “Lab 1” (fictional fixtures).",
      say: `Lab 1 runs on a laptop with no tenant, in the developer workbook's Chapters 1 and 2. You'll list the twelve tabs and open the Entra Health tab: a link-out, with no table, to the Entra admin center. Then you'll validate a copy someone exported after editing the workbook in the portal. Four edits, four failures: a query on a workspace path, a thirty-day look-back, a missing banner, and a subscription path in the file.`,
      detail: `Chapter 01, Lab 1 step 2: ./Show-DcManifest.ps1 -Id entra-health (link-out; no table; Microsoft Entra Health, https://entra.microsoft.com > Entra ID > Monitoring & health > Health > Health Monitoring). Chapter 02, Lab 1 step 3: ./Test-DcWorkbook.ps1 -TemplatePath tests/fixtures/exported/edited.workbook.json: FAIL DC-V-05 risk; DC-V-04 devices 720 h of 72 h; DC-V-06 grants; DC-V-10; 4 of 89 checks failed. Chapter 01's Lab 1 also opens a partial tab and the Active Directory tab, reads the emergency access query and lists the freshness limits.`,
      cite: [],
      ref: "Module 1, “Exercise: Lab 1”",
    },
    {
      part: "How", title: "Lab 2: a test workspace",
      body: [
        { steps: [
          { title: "Chapter 01, Lab 2", text: "list which of the manifest's tables the test workspace has; each missing table is a source to connect" },
          { title: "Chapter 02, Lab 2", text: "open the template through the Advanced Editor, save a test copy, edit, export, validate the export; delete the copy" },
        ] },
        { callout: "a test subscription, never production. Not run by the authors.", label: "Where: ", color: "red", icon: "FaTriangleExclamation" },
      ],
      sources: "Sources: Module 1, “Exercise: Lab 2”; Building the Daily Checks Workbook, Ch 01 and 02, “Lab 2.”",
      say: `Lab 2 runs in a test workspace, never production, and the authors haven't run it. From Chapter 1, list which of the manifest's tables the test workspace has; each missing table is a source still to connect. From Chapter 2, open the template in the portal through the Advanced Editor, save a test copy, edit it, export it, and validate the export. Then delete the copy.`,
      detail: `Chapter 01, Lab 2: az cloud set --name AzureCloud; az login --tenant <tenant-id>; list the workspace's tables (az monitor log-analytics workspace table list) and print the manifest's tables it lacks; az logout. Chapter 02, Lab 2: Monitor > Workbooks > New; Advanced Editor; Gallery Template tab; paste; Apply; Done Editing; save "Daily checks (lab)"; edit one look-back; copy the Gallery Template to <downloads-folder>/daily-checks-export.json; ./Test-DcWorkbook.ps1 -TemplatePath that file; delete the copy and the export. Workbook Contributor on the test resource group for the lab only.`,
      cite: [],
      ref: "Module 1, “Exercise: Lab 2”",
    },
    {
      part: "How", title: "Knowledge check",
      body: [
        { steps: [
          { title: "1", text: "Entra Health's alerts are a daily check. What does their tab show? A: a query over SigninLogs. B: a link out to the Entra admin center. C: nothing." },
          { title: "2", text: "An export has the workspace's path in fallbackResourceIds. Which check fails? A: DC-V-10. B: DC-V-02. C: none." },
          { title: "3", text: "A password reset is in yesterday's audit log. Which tab lists it? A: grants, closed there. B: admin changes, matched to its ticket in ITSM. C: neither." },
        ] },
        { callout: "1 is B: the alerts aren't in Log Analytics; GCC not yet specified. 2 is A: the plan fills IDs per environment. 3 is B: a reset with no ticket opens a finding.", label: "Answers: ", color: "teal", icon: "FaListCheck" },
      ],
      sources: "Sources: Module 1, “Knowledge check,” questions 2, 4 and 5, and “Check your answers.”",
      say: `Three questions. First: Entra Health's alerts are a daily check, so what does their tab show? A query over the sign-in logs, a link out to the Entra admin center, or nothing? It's a link out, because the alerts aren't in Log Analytics and their G C C availability is not yet specified. Second: an export has the workspace's path saved in it; which check fails? Check ten, because the deployment plan fills I D's per environment, never the template. Third: a password reset is in yesterday's audit log; which tab lists it? The admin changes tab, where the operator matches it to its ticket, and a reset with no ticket opens a finding. In summary: every daily check now has a tab or a link-out, every source its availability, and the workbook is a reviewed template. Module 2 reads it, deploys it, and keeps the evidence.`,
      detail: `Knowledge check question 2: answer b, a link out to the Microsoft Entra admin center, because the alerts aren't in Log Analytics and their GCC availability is not yet specified. Question 4: answer a, DC-V-10: the template carries a subscription path; the deployment plan fills IDs per environment. Question 5: answer b, the admin changes tab: the operator matches it to its ticket in the ITSM tool, and a reset with no ticket opens a finding. Summary: you placed every daily check on a tab or a link-out, gave each source its GCC availability, and kept the workbook as a reviewed template that a validator checks. Evidence an ISSO keeps: the validation record (results.json and the template's SHA-256), recorded in Module 2.`,
      cite: [],
      ref: "Module 1, “Knowledge check”; “Summary”",
    },
  ],
});
