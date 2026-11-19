// Companion guide — The Daily Checks on One Dashboard: An Implementation Guide. The guide is a DRAFT awaiting the
// owner's review; the title slide says so. A narrated Why / What / Who / How deck, laid out with ../_build/devwb.js in
// page mode: every fact comes from docs/books/guides/daily-checks-dashboard-implementation.md, and cite names are that
// guide's footnotes (Microsoft Learn, read November 18, 2026). The narration names sources by their originals and books
// by their titles.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/guide-daily-checks-dashboard/build.js
const G = "docs/books/guides/daily-checks-dashboard-implementation.md";
require("../_build/devwb.js")({
  workbook: "dc", pages: [G], dir: __dirname,
  base: "Guide_Daily_Checks_Dashboard",
  series: "Companion guide: The Daily Checks on One Dashboard (draft)",
  title: "The Daily Checks on One Dashboard",
  deckTitle: "The daily checks on one dashboard",
  subtitle: "An implementation guide: one Azure Monitor workbook, a tab per daily check, and the evidence kept where it lives",
  map: "Why: a dashboard is a picture of the evidence · What: options, ten tabs, GCC · Who: the RACI · How: six steps, dangers",
  slides: [
    {
      say: `Welcome. This is the narrated briefing for a companion guide in the Federal Modernization Workbook: The Daily Checks on One Dashboard. One thing first: the guide is a draft, awaiting the owner's review. It answers a question the operator runbook leaves open: can the operator see all of the daily checks in one place each morning? Mostly yes, on one Azure Monitor workbook in the Sentinel workspace, with a link out to the portal that holds the data for the checks a workbook can't read. Its facts come from Microsoft Learn, read on November eighteenth, 2026. We'll go in four parts: why, what, who, and how.`,
      detail: `The guide puts the daily checks of the operator runbook (Compliance Automation and Day-Two Operations, Chapter 12) on one Azure Monitor workbook in the Sentinel Log Analytics workspace, one tab per check, with a link out to the built-in portal page where a check's data isn't in Log Analytics. Status: draft, review pending. Every product fact, table, column, role and availability statement was read on Microsoft Learn on November 18, 2026. The program's own positions are labeled design guidance. Starting state: a civilian agency at FedRAMP Moderate on Microsoft 365 GCC (Moderate); Sentinel on a Log Analytics workspace in commercial Azure; Entra ID, Intune and the Defender XDR connector sending logs to it; an ITSM tool that holds the tasks.`,
      cite: [],
      ref: "Opening; “In this guide”; “How to read this guide”",
    },
    {
      part: "Why", title: "A dashboard is a picture of the evidence",
      body: [
        { lead: "The workbook is a view. The evidence stays in the records each check writes and the tasks each finding opens." },
        { cards: [
          { title: "Security Operations", text: "“A dashboard is a picture of the evidence.” An assessor relies on regenerating the series from stored records.", color: "navy" },
          { title: "Compliance Automation", text: "A test that reads a dashboard tile “is a screenshot with a schedule.”", color: "teal" },
          { title: "This guide", text: "Every tab says so, and the kit refuses to record a rendered view as evidence.", color: "red" },
        ] },
      ],
      sources: "Sources: Guide, “How to read this guide”; Security Operations & Telemetry, Ch 12; Compliance Automation & Day-2 Operations, Ch 11.",
      say: `Here's the rule the guide keeps. The Security Operations book says it plainly: a dashboard is a picture of the evidence; what an assessor relies on is regenerating the numbers from the stored records. The Compliance Automation book says the same of tests: one that reads a dashboard tile is a screenshot with a schedule. So the workbook in this guide is a view. Every tab says so, and the kit refuses to record a rendered view as evidence. The evidence stays where it already lives: in the record each check writes, and the task each finding opens.`,
      detail: `Security Operations and Telemetry, Chapter 12: "A dashboard is a picture of the evidence." Compliance Automation and Day-Two Operations, Chapter 11: one that reads a dashboard tile "is a screenshot with a schedule." So the workbook is a view. Every tab says so. The evidence stays in the records each check already writes and the tasks each finding opens, and the kit refuses to record a rendered view as evidence (Step 6).`,
      cite: [],
      ref: "“How to read this guide” — The rule this guide keeps",
    },
    {
      part: "What", title: "Dashboards in Azure and Microsoft 365",
      body: [
        { table: { head: ["Option", "Fits the daily checks?", "Why"], w: [3.7, 2.4, 6.05], rows: [
          ["Azure Monitor workbook", "Yes: the design", "Reads every table the checks need; a tab per check; a reviewable template"],
          ["Azure portal dashboard", "Partly", "Pins tiles, but less of the logic a check needs"],
          ["Dashboards with Grafana (preview)", "Not yet", "Preview; the workbook does the same from the same data"],
          ["Azure Managed Grafana", "No", "External sources and private networking aren't needed here"],
          ["Power BI", "For trends", "The quarterly trend review, not the morning check"],
          ["Admin centers' built-in views", "Where data stays there", "Entra Health and the ITSM queue: the workbook links out"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, Azure Monitor best practices: analysis and visualizations; workbook data sources; workbooks and ARM templates. Guide, “Dashboards.”",
      say: `What does Azure offer? Microsoft's guidance compares the options. Workbooks are a flexible canvas over the most complete set of Azure data sources, and they can be managed as Resource Manager templates. Portal dashboards give a single pane of glass, but a workbook is richer. Dashboards with Grafana is a free preview; Azure Managed Grafana is for external sources and private networking; Power BI suits long-term trends. Microsoft 365 has no single custom dashboard: each admin center has its own built-in views. So the design is one workbook in the Sentinel workspace, and a link out where the data stays elsewhere.`,
      detail: `Workbooks "provide a flexible canvas for data analysis and the creation of rich visual reports" and can "tap into the most complete set of data sources from across Azure"; Azure portal dashboards give "a single pane of glass" and "a workbook provides richer functionality"; Dashboards with Grafana is a preview "available in the Azure portal for no additional cost"; Azure Managed Grafana for external data sources, private networking or managed identity authentication; Power BI for business reports and "long-term KPI" trends. Workbooks query Log Analytics, Resource Graph, Resource Manager, metrics and other sources, and can be managed as ARM templates. Microsoft 365: built-in views per admin center; a custom view across them needs their logs in Log Analytics, or Power BI. Design guidance: one workbook, "Daily checks", in the Sentinel workspace.`,
      cite: ["dcg-best", "dcg-sources", "dcg-arm"],
      ref: "“Dashboards in Azure and Microsoft 365”",
    },
    {
      part: "What", title: "Ten daily checks, ten tabs",
      body: [
        { table: { head: ["Tab", "Source", "Fit"], w: [3.3, 6.35, 2.5], rows: [
          ["Telemetry completeness", "Every expected table's newest record; SentinelHealth failures", "Strong"],
          ["Synchronization probe", "DailySyncProbe_CL via the Logs Ingestion API; Connect Health link-out", "Strong"],
          ["Entra Health alerts", "Admin center, e-mail, Graph beta only", "Link-out"],
          ["Risky users and sign-ins", "AADRiskyUsers; SigninLogs", "Strong"],
          ["Emergency access sign-ins", "SigninLogs by object ID: Microsoft's query", "Strong"],
          ["Noncompliant devices", "IntuneDeviceComplianceOrg, daily", "Good"],
          ["Consents, roles and grants", "AuditLogs; the ticket match stays in ITSM", "Partial"],
          ["DLP and label alerts", "SecurityAlert, via Defender XDR", "Good"],
          ["Catalog and remediation tasks", "The ITSM tool's own queue", "Weak"],
          ["Log review queue", "SecurityIncident; the review stays a procedure", "Partial"],
        ] }, pt: 11.5 },
      ],
      sources: "Sources: Guide, “What each daily check can show”; Learn table references; Sentinel health; Logs Ingestion API; emergency access; Defender XDR.",
      say: `Here are the ten tabs, one per daily check. Telemetry completeness, the synchronization probe, risky users and sign-ins, and emergency access sign-ins fit strongly. Noncompliant devices and D L P alerts fit well. Grants and the log review queue are partial: the grants tab lists them, but matching each to a ticket stays in the I T S M tool, and the log review tab shows the queue while the review stays a recorded procedure. Entra Health is a link-out, because its alerts aren't in Log Analytics. And the catalog tasks live in the I T S M tool's own dashboards.`,
      detail: `Telemetry completeness: every expected table's newest record (the runbook's harness query) and SentinelHealth connector failures. Synchronization probe: the probe's result in DailySyncProbe_CL through the Logs Ingestion API; link out to Connect Health and Microsoft 365 service health. Entra Health alerts: none in Log Analytics. Risky users and sign-ins: AADRiskyUsers and SigninLogs (RiskLevelDuringSignIn, RiskState). Emergency access: SigninLogs by the accounts' object IDs, Microsoft's own query. Noncompliant devices: IntuneDeviceComplianceOrg. Grants: AuditLogs by Learn's activity names; partial. DLP and label alerts: SecurityAlert; Defender XDR collects Purview DLP alerts. Tasks: ITSM. Log review: SecurityIncident; partial. A tab that shows nothing has only proved its query returned nothing; a tab doesn't close anything; a tab isn't the alert.`,
      cite: ["dcg-b15", "dcg-health", "dcg-ingest", "dcg-entra-health", "dcg-t-risky", "dcg-t-signin", "dcg-emergency", "dcg-t-intune", "dcg-activities", "dcg-xdr", "dcg-t-incident"],
      ref: "“What each daily check can show, and from where”",
    },
    {
      part: "What", title: "GCC availability, source by source",
      body: [
        { table: { head: ["Source or feature", "GCC (Moderate), commercial Azure"], w: [6.2, 5.95], rows: [
          ["Workbooks; Sentinel workbooks", "Available: GA in Azure commercial"],
          ["Entra diagnostic settings to the workspace", "Available"],
          ["Intune diagnostic settings", "Available: Intune in GCC is the commercial instance"],
          ["Defender XDR alerts and incidents", "Available: GA for Commercial and GCC"],
          ["SentinelHealth; the health workbook", "Available, for the connectors Learn lists"],
          ["Defender portal Data & connectors Overview", "Not assumed: a commercial-cloud preview"],
          ["Logs Ingestion API", "Available"],
          ["Entra Health monitoring; Connect Health", "Not yet specified: link-outs"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Learn, Sentinel feature support; Entra log streaming; Intune Government Service; Defender XDR cloud support; Sentinel health; Logs Ingestion API.",
      say: `What's available in G C C? G C C Moderate uses the commercial Entra service and pairs with commercial Azure, so the workspace, the workbook and the Logs Ingestion API are all in commercial Azure. Sentinel workbooks are generally available there. Entra and Intune both send their logs to the workspace; Microsoft says Intune in G C C is the same instance as the commercial service. Defender X D R alerts and incidents are generally available for G C C. The Defender portal's connector overview is a commercial-cloud preview, so it isn't assumed. And Entra Health monitoring and Connect Health are not yet specified, so their tabs are link-outs.`,
      detail: `Workbooks; Sentinel workbooks GA in Azure commercial. Entra diagnostic settings (SignInLogs, AuditLogs, RiskyUsers, UserRiskEvents) available. Intune diagnostic settings (DeviceComplianceOrg) available: Intune in GCC "is the same instance as Microsoft Intune in the commercial space." Defender XDR alerts and incidents in SecurityAlert and SecurityIncident GA for Commercial and GCC. SentinelHealth and the Data collection health monitoring workbook: commercial Azure, for the listed connectors. The Defender portal's Data & connectors Overview tab: a public preview "in commercial cloud environments", and Defender portal previews are commercial-cloud only: not assumed. Logs Ingestion API available. Entra Health monitoring (preview) and Connect Health: not yet specified; link-outs.`,
      cite: ["dcg-sentinel-clouds", "dcg-entra-logs", "dcg-intune-gov", "dcg-xdr-clouds", "dcg-health", "dcg-ingest", "dcg-entra-health", "dcg-connect"],
      ref: "“GCC availability”",
    },
    {
      part: "Who", title: "Who does what: the RACI",
      body: [
        { table: { head: ["Activity", "Security ops", "Identity eng.", "Endpoint owner", "ISSO", "Operators"], w: [3.4, 1.8, 1.8, 1.8, 1.65, 1.7], rows: [
          ["Sources connected", "A, R", "R", "R", "I", "I"],
          ["Settings and template", "A, R", "C", "C", "I", "C"],
          ["Plan, approval, deployment", "A, R", "I", "I", "C", "I"],
          ["The morning read", "A (telemetry)", "R (identity)", "R (devices)", "I", "R"],
          ["Evidence", "R", "I", "I", "A", "I"],
        ] }, pt: 12 },
        { callout: "the ISSO approves the plan's SHA-256 in the change record, and keeps the evidence. The assessor reads it.", label: "Separation: ", color: "teal" },
      ],
      sources: "Sources: Guide, “RACI”; Compliance Automation & Day-2 Operations, Ch 10 (the roles).",
      say: `Who does what? Security operations is accountable for the sources, the template and the deployment, and for the telemetry tab each morning. Identity engineering connects the Entra logs and the probe, and supplies the emergency access object I D's. The endpoint platform owner connects Intune and supplies the compliance state value. The operators read their own family's tabs. And the security officer is consulted on each plan, approving its hash in the change record, and is accountable for the evidence.`,
      detail: `RACI (R does it; A accountable; C consulted; I informed), roles from Compliance Automation and Day-Two Operations, Chapter 10. Sources connected: security operations A, R (workspace, Sentinel); identity engineering R (Entra, probe); endpoint platform owner R (Intune); ISSO I; operators I. Settings and template: security operations A, R; identity engineering C (object IDs); endpoint owner C (state values); ISSO I; operators C. Plan, approval and deployment: security operations A, R; ISSO C (approves the plan in the change record). The morning read: security operations A for telemetry; identity engineering R for identity tabs; endpoint owner R for devices; operators R for their family. Evidence: security operations R; ISSO A.`,
      cite: [],
      ref: "“RACI”",
    },
    {
      part: "How", title: "Step 1: connect the sources",
      body: [
        { steps: [
          { title: "Entra ID", text: "a diagnostic setting sends SignInLogs, AuditLogs, RiskyUsers and UserRiskEvents; Security Administrator" },
          { title: "Intune", text: "Reports > Diagnostics settings > DeviceComplianceOrg; once a day, up to 48 hours, possible duplicates" },
          { title: "Defender XDR", text: "incidents and alerts, including Purview DLP's, into SecurityIncident and SecurityAlert" },
          { title: "Sentinel health", text: "turn health monitoring on; install the Data collection health monitoring workbook" },
          { title: "The probe", text: "DailySyncProbe_CL with a data collection rule; Monitoring Metrics Publisher for the probe's identity" },
        ] },
        { callout: "the read-only reachability check: each table Delivering, Late or Missing.", label: "Validate: ", color: "teal" },
      ],
      sources: "Sources: Guide, Step 1; Learn, Entra log streaming; Intune to Azure Monitor; Defender XDR integration; Sentinel health; Logs Ingestion API.",
      say: `Now the six steps. Step 1 connects the sources. An Entra diagnostic setting sends sign-in, audit and risk logs to the workspace. Intune's diagnostic settings send the compliance export, once a day, up to forty-eight hours late. The Defender X D R connector brings incidents and alerts, including those it collects from Purview D L P. Health monitoring is turned on for Sentinel. And the morning synchronization probe gets its own custom table, written through the Logs Ingestion API. The check: a read-only reachability test reports each table as delivering, late or missing.`,
      detail: `Entra: SignInLogs, AuditLogs, RiskyUsers, UserRiskEvents; creating or editing a diagnostic setting needs Security Administrator. Intune: Reports > Diagnostics settings > DeviceComplianceOrg, as Intune Service Administrator with Log Analytics Contributor; exported once every 24 hours, up to 48 hours; the pipeline can duplicate data, so the tab reads the latest row per device and its limit is 48 hours. Defender XDR: incidents and alerts, including Purview DLP and ID Protection, into SecurityIncident and SecurityAlert at no ingestion charge. Sentinel: turn on health monitoring; install the Data collection health monitoring workbook from the Content hub. Probe: DailySyncProbe_CL with a data collection rule; the probe's identity gets Monitoring Metrics Publisher on the rule; columns SyncEnabled, LastSyncUtc, AgeMinutes, SyncLate, ConflictCount, Verdict. Validate: the reachability check needs Log Analytics Reader.`,
      cite: ["dcg-entra-logs", "dcg-intune", "dcg-xdr", "dcg-health", "dcg-ingest", "dcg-la-access"],
      ref: "“Step 1: Connect the sources”",
    },
    {
      part: "How", title: "Steps 2 and 3: validate, then preview",
      body: [
        { cols: [[{ bullets: [
          "One **settings file** per environment; IDs go into the deployed parameters, never the template",
          "Read your own **ComplianceState** and **ProductName** values",
          "**DC-V-01 to -10**: one tab per check, tables, look-backs, {Workspace}, banner, link-outs, no IDs",
          "Learn: mask the sensitive values an export embeds",
        ], label: "Step 2: settings and validation", color: "navy", pt: 13 }], [{ bullets: [
          "Microsoft.Insights/workbooks **2023-06-01**, kind shared",
          "sourceId: the workspace; a deterministic name, because what-if can't evaluate newGuid()",
          "**what-if** predicts the change and makes none",
          "A second person approves the plan's **SHA-256**; the kit refuses a Delete",
        ], label: "Step 3: plan and preview", color: "amber", pt: 13 }]] },
      ],
      sources: "Sources: Guide, Steps 2–3; Learn, workbooks and ARM templates; Microsoft.Insights/workbooks reference; Bicep what-if.",
      say: `Step 2 fills one settings file per environment, and checks the two values the kit can't know: the compliance state your workspace records, and the product names of D L P alerts. Those values, and every I D, go into the deployed workbook's parameters, never into the template. Then the validator runs ten checks on the template, which matters because Microsoft says an exported template embeds sensitive values that should be masked. Step 3 plans the deployment of one workbook resource and previews it with what-if, which changes nothing. A second person approves the plan's hash, and the kit refuses any plan that would delete.`,
      detail: `Step 2: fill one settings file per environment from deploy/settings.template.json (tenant, subscription, resource group, workspace resource ID and customer ID, emergency access object IDs, ComplianceState value, ProductName values, ITSM queue address); these go into the deployed workbook's parameters, never into the template; read your own distinct ComplianceState and ProductName values. Validate DC-V-01 to DC-V-10. Learn: "mask out any embedded sensitive values." Step 3: Microsoft.Insights/workbooks, API 2023-06-01, kind shared, with serializedData, displayName, category and sourceId; sourceId set to the workspace; a GUID derived from the resource group and display name, since what-if can't evaluate newGuid(). az deployment group what-if changes nothing and needs the same permissions as a deployment. A second person approves the plan's SHA-256; the kit refuses a plan with a Delete or with no what-if.`,
      cite: ["dcg-arm", "dcg-ref", "dcg-whatif"],
      ref: "“Step 2”; “Step 3”",
    },
    {
      part: "How", title: "Step 4: deploy to test, then production",
      body: [
        { table: { head: ["Who", "Role, least privilege"], w: [3.0, 9.15], rows: [
          ["Deployer", "Workbook Contributor and Microsoft.Resources/deployments/* on the resource group only, for the window"],
          ["Readers", "Workbook Reader, plus their own read access to each query's data"],
          ["Reachability", "Log Analytics Reader on the workspace"],
        ] }, pt: 12.5 },
        { steps: [
          { title: "Test", text: "preflight, plan with what-if, deploy the approved plan, open it, reachability" },
          { title: "Go or no-go", text: "a passing live record for preflight, validation, plan, deployment and reachability" },
          { title: "Production", text: "the same commands; the preflight refuses production without the test stage's evidence" },
        ] },
      ],
      sources: "Sources: Guide, Step 4; Learn, workbooks overview; built-in roles for Monitor; Bicep what-if; Log Analytics access.",
      say: `Step 4 deploys. Saving a shared workbook needs the workbooks write permission, which Workbook Contributor grants, and deploying through Resource Manager also needs deployment rights. Grant both on the workbook's resource group only, for the deployment window. Readers need Workbook Reader and their own access to the data. The test stage runs preflight, plans with what-if, deploys the approved plan, and checks reachability. It's a go when each of those has a passing live record. Production runs the same commands, and the preflight refuses it until the test stage's evidence passes. Rolling back deletes a view only.`,
      detail: `To save a shared workbook a person needs microsoft.insights/workbooks/write, which Workbook Contributor grants; to deploy through Resource Manager they also need Microsoft.Resources/deployments/*. Grant both on the workbook's resource group only. Readers need Workbook Reader (or Monitoring Reader) and read access to the data each query reads; a workbook shows only what its reader can already query. Test: preflight PF-01 to PF-06, plan with what-if, deploy the approved plan, open the workbook, reachability. Go: the test stage's evidence holds a passing live record for preflight, validation, plan, deployment and reachability. Production: the preflight refuses production without the test stage's evidence. Rollback: redeploy the previous approved plan, or delete the workbook; deleting removes a view only.`,
      cite: ["dcg-overview", "dcg-roles", "dcg-whatif", "dcg-la-access"],
      ref: "“Step 4: Deploy to test, then production”",
    },
    {
      part: "How", title: "Steps 5 and 6: read it, and keep the evidence",
      body: [
        { cols: [[{ bullets: [
          "**Telemetry completeness first**: a dark source makes every tab over it unreliable",
          "Each finding becomes, or is matched to, a **task**",
          "Link-out tabs: work Entra Health and the ITSM queue where they live",
          "The workbook never closes a task or proves a check happened",
        ], label: "Step 5: the morning read", color: "navy", pt: 13 }], [{ bullets: [
          "Recorded: validation, preflight, plan and what-if, deployment, reachability, rollback plan",
          "**Never recorded: a rendered view**",
          "A portal edit: export, validate, replace through review, redeploy",
          "Go/no-go counts only live records",
        ], label: "Step 6: the evidence", color: "teal", pt: 13 }]] },
      ],
      sources: "Sources: Guide, Steps 5–6.",
      say: `Step 5 is the morning read. Telemetry completeness comes first, because a dark source makes every tab over it unreliable. Then each tab in turn: each row that needs work becomes, or is matched to, a task with an owner. Entra Health and the I T S M queue are worked where they live. The workbook never closes a task, pages anyone, or proves a check happened. Step 6 keeps the evidence: the kit records the validation, preflight, plan, deployment, reachability check and rollback plan, each hashed and chained. A rendered view is never recorded. And a portal edit comes back as an export, is validated, and replaces the template through review.`,
      detail: `Step 5 (owner: the operator for each family): telemetry completeness first; each dark source opens a high-severity task, and the completeness alert rule, not the tab, is the record. Each row that needs work becomes, or is matched to, a task with an owner; dismissals and closures carry their reason in the task. Link-out tabs: open Entra Health and the ITSM queue and work them there. The workbook doesn't close a task, page anyone or prove a check happened. Step 6 (owner: the ISSO): the kit records the template's validation, the preflight, the plan and its what-if, the deployment, the reachability check and the rollback plan, each with its controls and KSIs and SHA-256 hashes, chained. A rendered view is refused: "A rendered view is not evidence." Drift: export, validate, replace the committed template through a reviewed change; a redeploy of the approved plan puts the reviewed version back.`,
      cite: [],
      ref: "“Step 5: Read it each morning”; “Step 6: Keep the evidence”",
    },
    {
      part: "How", title: "Requirements, dangers and what's unverified",
      body: [
        { table: { head: ["Danger", "The guard"], w: [5.2, 6.95], rows: [
          ["A dashboard taken as evidence", "The banner; the kit refuses a render; the checks' own records"],
          ["A missing connector looks healthy", "Telemetry first; STALE, never CLEAR, over a stale source"],
          ["IDs in the template", "DC-V-10; the plan fills IDs per environment"],
          ["A preview assumed in GCC", "Link-out tabs for anything not available or not specified"],
        ] }, pt: 12 },
        { callout: "the item schema field by field, GCC for Entra Health and Connect Health, the agency's ProductName and ComplianceState values, and some click paths.", label: "Not verified on Learn: ", color: "amber", icon: "FaTriangleExclamation" },
      ],
      sources: "Sources: Guide, “Federal requirements and KSIs,” “Dangers,” “What couldn't be verified.” KSIs: FedRAMP 20x indicators for providers.",
      say: `The workbook supports the monitoring the daily checks already do; it doesn't add a control. Its records support configuration and change control for the template and the deployment, and continuous monitoring for the reachability check; the assessor decides. The biggest dangers are a dashboard taken as evidence, and a missing connector that looks healthy. The guards are the banner, the refused render, and stale shown as stale. Some things couldn't be verified on Microsoft Learn: the workbook's item format field by field, G C C for Entra Health and Connect Health, and the values your own workspace records. The developer workbook and the learning path take it from here.`,
      detail: `Requirements: validate CM-2, CM-3 (KSI-SVC-ACM, KSI-CMT-LMC); preflight AC-6, CM-6; plan and what-if CM-3, CM-4; deploy CM-3, CM-2; reachability CA-7, SI-4 (KSI-MLA-EVC, KSI-MLA-LET); rollback plan CM-3, CP-2; evidence CA-7, AU-9. Each control-to-KSI pair reuses one the Azure Security Engineering guide verified. The records support these controls; the assessor decides; KSIs are FedRAMP 20x indicators for cloud service providers. Dangers: a dashboard taken as evidence; a missing connector looks healthy; stale tiles; IDs in the template; a workbook edited in place; a deployment that deletes; a broad reader; a preview assumed in GCC. What couldn't be verified: the workbook item schema; GCC availability of Entra Health monitoring and Connect Health; ProductName and ComplianceState values; portal click paths other than Entra Health and the Sentinel workbook.`,
      cite: [],
      ref: "“Federal requirements and KSIs, by step”; “Dangers”; “What couldn't be verified”",
    },
  ],
});
