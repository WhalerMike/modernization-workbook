// Building the Daily Checks Workbook, Chapter 04 — Deploying to Test and Production: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/daily-checks/04-deploying-to-test-and-production.md;
// cite names are that chapter's footnotes. The chapter is a runbook with no Lab 1, so no slide shows a kit capture:
// the plan output is the page's own fixture-mode output, dated. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-dc-04-deploying-test-production/build.js
require("../_build/devwb.js")({
  workbook: "dc", chapter: 4, dir: __dirname,
  base: "DW_DC_04_Deploying_Test_Production",
  title: "Deploying to Test and Production",
  map: "Why the same commands twice · roles and tools · the test stage, step by step · go or no-go · production · rollback · the replication probe · evidence",
  slides: [
    {
      say: `Welcome back to Building the Daily Checks Workbook. This is Chapter 4: deploying to test and production. The same commands twice, with a different settings file, and a record of each step in between. It's a runbook, not a lab: it runs Chapters 2 and 3's scripts and the kit's deploy scripts. The output you'll see comes from the kit's fixture mode, on November sixteenth, 2026. Nothing here has been run against a live subscription, and the chapter has been reviewed and approved.`,
      detail: `The runbook takes the workbook from the repository to a test subscription, then production: settings per environment, preflight, the validation, the plan with what-if and an approved SHA-256, the deployment, the reachability check, the go/no-go, production and the rollback. It runs Chapters 02 and 03's entry scripts and the kit's deploy/ scripts. Every command below has been run in fixture mode and by the kit's 19 deploy tests, with a stand-in for the Azure CLI; none has been run against a live subscription.`,
      cite: [],
      ref: "“In this chapter”; the warning callout",
    },
    {
      part: "Why", title: "Why the same commands twice",
      body: [
        { lead: "A dashboard is still a change: previewed, approved by hash, deployed to test, then production, with a record of each step." },
        { cards: [
          { title: "Previewed", text: "what-if predicts the change and makes none", color: "navy" },
          { title: "Approved", text: "a second person approves the plan's SHA-256", color: "teal" },
          { title: "Recorded", text: "every step leaves a hashed, chained record", color: "amber" },
        ] },
        { callout: "the workbook, and any screenshot of it, is never on the evidence list.", label: "The rule: ", color: "red", icon: "FaTriangleExclamation" },
      ],
      sources: "Sources: Chapter 04, opening, “Stage 1,” “Federal requirements and evidence”; Learn, Bicep what-if.",
      say: `Why treat a dashboard like this? Because it's still a change to the estate, and an unreviewed change is exactly what the rest of the workbook guards against. So every deployment is previewed with what-if, which predicts the change and makes none. A second person approves the plan's hash, and the kit deploys nothing else. And every step leaves a hashed, chained record. One rule holds throughout: the workbook itself, and any screenshot of it, is never on the evidence list.`,
      detail: `What-if predicts the changes and makes none; it needs the same deployment rights as a deployment. The plan's SHA-256 is what a second person approves; Invoke-DcDeploy refuses any other hash, a plan with no what-if, a plan with a Delete, and a plan not made against the live environment. Evidence records: preflight, validation, plan and approval, deployment, reachability, rollback plan; the workbook itself, and any screenshot of it, is never on the list.`,
      cite: ["dc04-whatif"],
      ref: "Opening; “Stage 1” steps 4–6; “Federal requirements and evidence”",
    },
    {
      part: "What", title: "What the stages hold",
      body: [
        { table: { head: ["Step", "Command", "Writes"], w: [2.5, 6.15, 3.5], rows: [
          ["2 Preflight", "deploy/Test-DcPreflight.ps1 … -Live", "PF-01 to PF-06, results.json"],
          ["3 Validate", "Test-DcWorkbook.ps1 -OutputPath … -Environment test", "results.json, the template's SHA-256"],
          ["4 Plan", "deploy/New-DcDeploymentPlan.ps1 … -RunWhatIf", "parameters.json, whatif.json, plan.json"],
          ["6 Deploy", "deploy/Invoke-DcDeploy.ps1 … -ApprovedSha256 … -Apply", "result.json, the approved plan"],
          ["8 Reachability", "deploy/Test-DcReachability.ps1", "reach.json"],
          ["9 Rollback plan", "deploy/Invoke-DcRollback.ps1", "rollback.json"],
          ["10 Evidence", "Invoke-DcEvidence.ps1 for each folder", "records/, records.csv, SHA256SUMS"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 04, “Stage 1: the test environment,” steps 2–10.",
      say: `Here's what a stage holds. Preflight runs six checks. The validation records the template's checks and its hash. The plan writes the parameters, the what-if result and the plan file. The deployment writes its result beside the approved plan. Reachability records each table's age. The rollback plan is written before it's needed. And the evidence step records each folder, hashed and chained.`,
      detail: `Stage 1 steps: 1 sign in (az cloud set --name AzureCloud; az login; az extension add --name log-analytics); 2 preflight (PF-01 settings complete, PF-02 no secret, PF-03 output and evidence outside any repository, PF-04 AzureCloud and the settings' tenant and subscription, PF-05 the template validates, PF-06 production only, the test stage's evidence passes); 3 validate for the stage; 4 plan with what-if; 5 approve; 6 deploy (without -Apply prints and changes nothing); 7 smoke test in the portal; 8 reachability; 9 rollback plan; 10 record the evidence.`,
      cite: [],
      ref: "“Stage 1: the test environment”",
    },
    {
      part: "Who", title: "Who deploys, approves and reads",
      body: [
        { table: { head: ["Who", "Needs", "For"], w: [2.6, 5.4, 4.15], rows: [
          ["Deployer", "Workbook Contributor and Microsoft.Resources/deployments/* on the resource group, through PIM, for the window", "Plan, what-if, deploy"],
          ["Second person", "Read access to the plan and what-if", "Approves the SHA-256 in the change record"],
          ["Reachability check", "Log Analytics Reader on the workspace", "Read-only queries"],
          ["Readers", "Workbook Reader and their own data access", "A workbook shows only what its reader can query"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Chapter 04, “Before you start”; Learn, built-in roles for Monitor; Bicep what-if; Log Analytics access; workbooks overview.",
      say: `Who does what? The deployer needs Workbook Contributor, which can save shared workbooks, and deployment rights on the resource group, because a Resource Manager deployment and its what-if both need them. Both are granted through privileged identity management, for the deployment window only. A second person reads the plan and approves its hash. The reachability check needs only Log Analytics Reader. And readers need Workbook Reader and their own access to the data, because a workbook shows only what its reader can already query.`,
      detail: `The deployer needs Workbook Contributor (it can save shared workbooks: microsoft.insights/workbooks/write) and Microsoft.Resources/deployments/* on the workbook's resource group, because a Resource Manager deployment and its what-if both need deployment rights. Grant both through PIM for the deployment window only. The reachability check needs Log Analytics Reader on the workspace. Readers of the workbook need Workbook Reader and their own read access to the data; a workbook shows only what its reader can query.`,
      cite: ["dc04-roles", "dc04-whatif", "dc04-access", "dc04-overview"],
      ref: "“Before you start”",
    },
    {
      part: "How", title: "Plan, with what-if",
      body: [
        { code: [
          "./deploy/New-DcDeploymentPlan.ps1 -SettingsPath <settings-test> -OutputPath <out-test>/plan `",
          "    -RunWhatIf -ChangeRecord <change-record-id>",
          "",
          "# Fixture mode, November 16, 2026 (the saved what-if result):",
          "Plan (Fixture): out/plan/plan.json",
          "  what-if: Create   Microsoft.Insights/workbooks/6e1c2b74-3f0d-5a59-9b8e-0c4f2d1a7b31",
          "Create command: az deployment group create --name daily-checks-lab --resource-group rg-contoso-monitoring …",
          "Approve with:   -ApprovedSha256 <the plan's SHA-256>",
        ], label: "Stage 1, step 4", pt: 11 },
        { callout: "a first deployment shows one Create; a redeploy, a Modify of the same workbook. Anything else, and any Delete, stops the stage.", label: "Read it: ", color: "amber", icon: "FaClipboardCheck" },
      ],
      sources: "Sources: Chapter 04, “Stage 1,” step 4 (fixture-mode output, November 16, 2026); Learn, Bicep what-if.",
      say: `Step 4 is the heart of it. The plan writes this environment's parameters, the workspace and the parameter values the template leaves empty, then runs what-if and prints the create command and the hash to approve. In fixture mode, on November sixteenth, it predicts one create: a single workbook. A first deployment shows one create, and a redeploy shows a modify of the same workbook. Anything else, and any delete, stops the stage. Then a second person reads the plan and the what-if result, and records the hash in the change record.`,
      detail: `Stage 1 step 4: ./deploy/New-DcDeploymentPlan.ps1 -SettingsPath <settings-test> -OutputPath <out-test>/plan -RunWhatIf -ChangeRecord <change-record-id>. In fixture mode (the saved what-if result, November 16, 2026) the plan prints: Plan (Fixture): out/plan/plan.json; what-if: Create Microsoft.Insights/workbooks/<guid>; Create command: az deployment group create --name daily-checks-lab --resource-group rg-contoso-monitoring --subscription <fictional> --template-file deploy/main.json --parameters @out/plan/parameters.json; Approve with -ApprovedSha256. Step 5: a second person reads plan.json and whatif.json and records the SHA-256 in the change record.`,
      cite: ["dc04-whatif"],
      ref: "“Stage 1: the test environment,” steps 4–5",
    },
    {
      part: "How", title: "Deploy only the approved plan",
      body: [
        { code: [
          "./deploy/Invoke-DcDeploy.ps1 -PlanPath <out-test>/plan -ApprovedSha256 <plan-sha256> -OutputPath <out-test>/deploy",
          "./deploy/Invoke-DcDeploy.ps1 -PlanPath <out-test>/plan -ApprovedSha256 <plan-sha256> -OutputPath <out-test>/deploy -Apply",
        ], label: "Stage 1, step 6: without -Apply it prints and changes nothing", pt: 11 },
        { bullets: [
          "A plan folder that changed since its manifest",
          "A SHA-256 that isn't the approved one",
          "A plan with no what-if, or a what-if with a **Delete**",
          "A plan not made against the live environment",
        ], label: "The kit refuses", color: "red", pt: 14 },
        { callout: "Monitor > Workbooks > Daily checks under the test workspace: twelve tabs, each with the banner; the telemetry tab lists every expected table.", label: "Step 7, smoke test: ", color: "teal" },
      ],
      sources: "Sources: Chapter 04, “Stage 1,” steps 6–7.",
      say: `Step 6 deploys, and only the approved plan. Without the Apply switch, the command prints what it would run and changes nothing. With it, it deploys. And it refuses a plan folder that changed, a hash that isn't the approved one, a plan with no what-if or with a delete, and a plan that wasn't made against the live environment. Step 7 is the smoke test, in the portal: open the Daily checks workbook under the test workspace, check that the twelve tabs open with the banner, and that the telemetry tab lists every expected table.`,
      detail: `Stage 1 step 6: ./deploy/Invoke-DcDeploy.ps1 -PlanPath <out-test>/plan -ApprovedSha256 <plan-sha256> -OutputPath <out-test>/deploy, then the same with -Apply. The kit refuses a plan folder that changed, a SHA-256 that isn't the approved one, a plan with no what-if or with a Delete, and a plan not made against the live environment. Step 7: in the Azure portal, Monitor > Workbooks, open Daily checks under the test workspace, and confirm the twelve tabs open, each with the banner, and the telemetry tab lists every expected table.`,
      cite: [],
      ref: "“Stage 1: the test environment,” steps 6–7",
    },
    {
      part: "How", title: "Reachability, rollback plan and evidence",
      body: [
        { code: [
          "./deploy/Test-DcReachability.ps1 -SettingsPath <settings-test> -OutputPath <out-test>/reach",
          "./deploy/Invoke-DcRollback.ps1 -SettingsPath <settings-test> -OutputPath <out-test>/rollback",
          "./Invoke-DcEvidence.ps1 -EvidencePath <evidence-test> -RunPath <out-test>/preflight -ChangeRecord <change-record-id>",
          "#   … the same for validate, plan, deploy, reach and rollback",
          "./Invoke-DcEvidence.ps1 -EvidencePath <evidence-test> -Check -Stage test",
        ], label: "Stage 1, steps 8–10, and the go/no-go", pt: 10.5 },
        { callout: "every file matches SHA256SUMS, the chain is unbroken, and preflight, validation, plan, deployment and reachability each have a passing live record. Fixture records never count.", label: "Go: ", color: "teal", icon: "FaListCheck" },
      ],
      sources: "Sources: Chapter 04, “Stage 1,” steps 8–10; “Go or no-go.”",
      say: `Step 8 runs the reachability check against the test workspace. Step 9 plans the rollback before you need it. Step 10 records each folder as evidence. Then the go or no-go: the stage is a go when every file matches its hash list, the chain is unbroken, and the preflight, validation, plan, deployment and reachability each have a passing live record. Fixture records never count. A no-go is a finding with an owner, and the stage is repeated after the fix.`,
      detail: `Step 8: ./deploy/Test-DcReachability.ps1 -SettingsPath <settings-test> -OutputPath <out-test>/reach. Step 9: ./deploy/Invoke-DcRollback.ps1 -SettingsPath <settings-test> -OutputPath <out-test>/rollback. Step 10: ./Invoke-DcEvidence.ps1 -EvidencePath <evidence-test> -RunPath <out-test>/<folder> -ChangeRecord <change-record-id> for preflight, validate, plan, deploy, reach and rollback. Go or no-go: ./Invoke-DcEvidence.ps1 -EvidencePath <evidence-test> -Check -Stage test. A no-go is a finding with an owner; the stage is repeated after the fix.`,
      cite: [],
      ref: "“Stage 1: the test environment,” steps 8–10; “Go or no-go”",
    },
    {
      part: "How", title: "Production, rollback and day two",
      body: [
        { cols: [[{ bullets: [
          "The **same commands** with the production settings file",
          "The settings name the test stage's evidence; **PF-06 refuses production** until it passes",
          "The rollback plan points at the test plan as the previous one",
        ], label: "Stage 2: production", color: "navy", pt: 13.5 }], [{ bullets: [
          "**Redeploy the previous approved plan** when the content is wrong",
          "**Delete the workbook** when it shouldn't exist: find it by name, then delete",
          "Deleting removes **a view only**: no log data, alert rule or task changes",
        ], label: "Rollback", color: "red", pt: 13.5 }]] },
        { callout: "a portal edit comes back as an export, is validated, replaces the template through review, and is redeployed from a new plan. A server added or retired: update the settings' server list and redeploy.", label: "Day two: ", color: "teal" },
      ],
      sources: "Sources: Chapter 04, “Stage 2: production,” “Rollback,” “Day two.”",
      say: `Production runs the same commands with the production settings file. That file names the test stage's evidence folder, and the preflight refuses production until that evidence passes. There are two ways back, both planned in advance. Redeploy the previous approved plan when the content is wrong; its hash is already approved. Or delete the workbook when it shouldn't exist. Deleting it removes a view only: no log data, alert rule or task changes. And on day two, a portal edit comes back as an export, is validated, and replaces the template through review before it's redeployed. When a synchronization server or domain controller is added or retired, its settings list changes and the workbook is redeployed: a retired server left in the list shows as a silent one every morning.`,
      detail: `Stage 2: the same commands with <settings-production>, <out-production> and <evidence-production>; the production settings file names the test stage's evidence folder (testEvidencePath), and PF-06 refuses production until that evidence passes. Rollback: redeploy the previous approved plan when the content is wrong; delete the workbook when it shouldn't exist (the plan's find command lists it by display name, read-only; the delete command removes it). A rollback is a change: it gets its own change record and evidence record. Day two: a portal edit; a new daily check (add its row to the manifest, its query to queries/, rebuild, redeploy); the settings (when an emergency access account changes, update emergencyAccessObjectIds and redeploy; when a synchronization server or domain controller is added or retired, update syncServers or domainControllers and redeploy: a retired server left in the list shows as a silent one every morning).`,
      cite: [],
      ref: "“Stage 2: production”; “Rollback”; “Day two”",
    },
    {
      part: "How", title: "The replication probe, on a Tier 0 host",
      body: [
        { code: [
          "./Invoke-DcReplicationProbe.ps1 -SettingsPath <settings-test> -OutputPath <out-test>/probe",
          "./Invoke-DcReplicationProbe.ps1 -SettingsPath <settings-test> -OutputPath <out-test>/probe -Send",
          "./Invoke-DcEvidence.ps1 -EvidencePath <evidence-test> -RunPath <out-test>/probe -ChangeRecord <change-record-id>",
        ], label: "On a Tier 0 host, signed in as the probe's sending identity", pt: 10.5 },
        { bullets: [
          "Reads the directory and changes nothing, but needs **Enterprise Admins** or equivalent: a **Tier 0 identity on a Tier 0 host**",
          "Sends as an identity with **Monitoring Metrics Publisher** on its collection rule only",
          "A failing link exits 1: a **finding**, not a failed deployment; not a go/no-go step",
        ], label: "Only where the Tier 0 owner approves it", color: "red", pt: 13 },
        { callout: "the tab still shows heartbeats, events and Defender for Identity alerts; remove the replication table and query from the manifest through a reviewed change, rather than read an empty list as healthy.", label: "Without approval: ", color: "amber", icon: "FaTriangleExclamation" },
      ],
      sources: "Sources: Chapter 04, “The replication probe, where the Tier 0 owner approves it”; the guide's access request, row 9.",
      say: `The Active Directory tab reads replication from the probe's table. The probe reads the directory and changes nothing in it, but Microsoft names Enterprise Admins, or equivalent, as the minimum to read forest-wide replication status. So it runs only as a Tier 0 identity, on a Tier 0 host, each morning, and only where the Tier 0 owner approves it. The first command writes the probe's file without sending; read it. The second sends it, as an identity that can only publish to the probe's collection rule. A failing link is a finding, not a failed deployment. Without approval, skip it, and remove the replication table and query through a reviewed change, rather than read an empty list as healthy.`,
      detail: `The Active Directory tab reads replication from DcReplicationProbe_CL. The probe reads the directory and changes nothing in it, but Learn names Enterprise Admins, or equivalent, as the minimum to read forest-wide replication status, so it runs only as a Tier 0 identity, on a Tier 0 host, scheduled each morning (the guide's access request, access row 9). On the Tier 0 host, from examples/daily-checks-workbook, signed in with az login as the probe's sending identity (Monitoring Metrics Publisher on the probe's data collection rule only), with replicationIngestionEndpoint, replicationDcrImmutableId and replicationStreamName filled: the first command runs repadmin /showrepl * /csv and writes probe.json without sending; the second sends the records to the Logs Ingestion API; the third records it. A failing link makes the script exit 1 and the record's result Fail: that is the finding, not a failed deployment. The probe isn't a step the go/no-go requires. Without that approval, skip it: the tab still shows the domain controllers' heartbeats, events and Defender for Identity alerts, and links out to Connect Health for AD DS, but its replication query stays empty and the renderer shows the tab STALE: remove DcReplicationProbe_CL from the tab's freshness and tables in the manifest, and the query from the tab, through a reviewed change.`,
      cite: [],
      ref: "“The replication probe, where the Tier 0 owner approves it”",
    },
    {
      part: "How", title: "What each record supports",
      body: [
        { table: { head: ["Step", "NIST SP 800-53 Rev 5", "KSIs"], w: [4.6, 3.3, 4.25], rows: [
          ["Preflight", "AC-6, CM-6", "KSI-IAM-ELP, KSI-SVC-ACM"],
          ["Validate", "CM-2, CM-3", "KSI-SVC-ACM, KSI-CMT-LMC"],
          ["Plan and approval", "CM-3, CM-4", "KSI-CMT-LMC, KSI-CMT-RVP"],
          ["Deploy", "CM-3, CM-2", "KSI-CMT-LMC, KSI-SVC-ACM"],
          ["Reachability", "CA-7, SI-4", "KSI-MLA-EVC, KSI-MLA-LET"],
          ["Rollback plan", "CM-3, CP-2", "KSI-CMT-LMC, KSI-RPL-ARP"],
          ["The replication probe", "CA-7, SI-4", "KSI-MLA-EVC, KSI-MLA-LET"],
          ["Evidence", "CA-7, AU-9", "KSI-MLA-EVC, KSI-MLA-OSM"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 04, “Federal requirements and evidence.” KSIs: FedRAMP 20x indicators for cloud service providers.",
      say: `Here's what each record supports. Preflight supports least privilege and configuration settings. The validation supports the baseline and change control. The plan and its approval support change control and impact analysis. The deployment supports change control and the baseline. Reachability supports continuous monitoring and system monitoring. The rollback plan supports change control and the contingency plan. The replication probe's record supports continuous and system monitoring. And the evidence step supports continuous monitoring and the protection of audit information. The records support these controls; the assessor decides them. Thanks for following the four chapters; the workbook itself remains a view, and the records are the evidence.`,
      detail: `Federal requirements: preflight AC-6, CM-6 (KSI-IAM-ELP, KSI-SVC-ACM); validate CM-2, CM-3 (KSI-SVC-ACM, KSI-CMT-LMC); plan and approval CM-3, CM-4 (KSI-CMT-LMC, KSI-CMT-RVP); deploy CM-3, CM-2 (KSI-CMT-LMC, KSI-SVC-ACM); reachability CA-7, SI-4 (KSI-MLA-EVC, KSI-MLA-LET); rollback plan CM-3, CP-2 (KSI-CMT-LMC, KSI-RPL-ARP); the replication probe CA-7, SI-4 (KSI-MLA-EVC, KSI-MLA-LET); evidence CA-7, AU-9 (KSI-MLA-EVC, KSI-MLA-OSM). The kit's records support these controls; the agency's assessor decides them. KSIs are FedRAMP 20x indicators for cloud service providers. The workbook itself, and any screenshot of it, is never on this list. Checklist: one settings file per environment, no secret, outside any repository; preflight passes each stage; each what-if read, no Delete, SHA-256 approved by a second person; roles for the window only; test evidence passes before production; rollback plan for each stage; the Tier 0 owner has decided on the replication probe, and where it runs, it runs on a Tier 0 host.`,
      cite: [],
      ref: "“Federal requirements and evidence”; “Checklist”",
    },
  ],
});
