// Building Defender XDR, Chapter 06 — Detections as Code: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/defender-xdr/06-detections-as-code.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-xdr-06-detections-as-code/build.js
require("../_build/devwb.js")({
  workbook: "xdr", chapter: 6, dir: __dirname,
  base: "DW_XDR_06_Detections_As_Code",
  title: "Detections as Code",
  map: "Why a rule must fire · Learn's three calls · what they leave · the repository · validate, test, plan · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 6: detections as code. A rule that can't be shown to fire isn't a control, and a rule nobody can trace to a reviewed file isn't a change anyone approved. We'll start from Learn's create, list and update calls for custom detection rules, read the repository layout, the validation, the tests against each rule's windows, and the deployment plan, and walk two labs. Publishing the plan is Chapter 9's. The chapter is a draft awaiting review; the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's G7 Advanced hunting and detections as code. You start with Learn's create, list and update calls and the guide's three steps, and what they leave to you. Then you read the repository layout, the validation, the tests against each rule's windows, and the deployment plan. Lab 1 validates and tests a three-rule repository and reads the plan. Lab 2 tests one rule in a test tenant. Publishing the plan is Chapter 09's.`,
      cite: [],
      ref: "Opening; “In this chapter”",
    },
    {
      part: "Why", title: "Why a rule must fire, and trace to a file",
      body: [
        { lead: "A rule that can't be shown to fire isn't a control. A rule nobody can trace to a reviewed file isn't a change anyone approved." },
        { cols: [[{ bullets: [
          "Keep custom detections as files",
          "Prove each fires on its known-bad event and stays quiet otherwise",
          "Produce a deployment plan an approver signs by its hash",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who maintain the kit",
          "The detection engineer who owns G7",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
        { callout: "the rule lifecycle (author, test, alert-only, promote, review) is the Security Operations book's; this chapter builds its test and deployment.", label: "Lifecycle: ", icon: "FaBook", color: "amber" },
      ],
      sources: "Sources: Chapter 06, opening, “Goal and audience.” Security Operations, Chapter 11.",
      say: `Why treat detections as code? Two reasons. A rule that can't be shown to fire isn't a control. And a rule that nobody can trace back to a reviewed file isn't a change anyone approved. By the end of this chapter you can keep custom detections as files, prove each one fires on its known-bad event and stays quiet otherwise, and produce a deployment plan that an approver signs by its hash. It's for the developers and the detection engineer who owns this gate. The rule lifecycle itself, author, test, alert-only, promote and review, is the Security Operations book's; this chapter builds its test and its deployment.`,
      detail: `Goal: by the end of this chapter you can keep custom detections as files, prove each fires on its known-bad event and stays quiet otherwise, and produce a deployment plan an approver can sign by its hash. Audience: developers who maintain the kit, and the detection engineer who owns G7. The rule lifecycle (author, test, alert-only, promote, review) is Book 12's Chapter 11 (Security Operations, Detection Engineering and Response); you should have run Chapter 05's Lab 1.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "Why", title: "What Microsoft Learn's three calls give you",
      body: [
        { table: { head: ["Call", "Least privilege", "Notes"], w: [4.2, 3.4, 4.55], rows: [
          ["POST /security/rules/detectionRules", "CustomDetection.ReadWrite.All", "Detection tuning (Manage) or Security Administrator; 10 creates a minute per app"],
          ["GET /security/rules/detectionRules", "CustomDetection.Read.All", "Security Reader, Global Reader, Security Operator, Security Administrator"],
          ["PATCH .../detectionRules/{id}", "CustomDetection.ReadWrite.All", "Supply only the properties that change"],
        ] }, pt: 12.5 },
        { cols: [[{ callout: "queryCondition, schedule, status (enabled, disabled), and detectionAction with an alertTemplate and, optionally, automatedActions.", label: "A rule: ", icon: "FaCodeBranch", color: "navy" }], [{ callout: "the detectionRules pages have no national-cloud table: not yet specified. The guide's interim path is the portal, from the same file.", label: "GCC: ", icon: "FaCloud", color: "red" }]] },
      ],
      sources: "Sources: Learn, Create detectionRule; List detectionRule objects; Update detectionRule; Graph security API, Custom detections. Chapter 06.",
      say: `Microsoft Learn's Graph pages give three calls. Post to create a rule, which needs read-write custom detection and the Detection tuning manage permission, or Security Administrator; the quota is ten creates a minute per application. Get to list the rules, with the read permission. And patch to update one, supplying only the properties that change. A rule has a query, a schedule, a status of enabled or disabled, and a detection action with an alert template, and optionally automated actions, like isolating devices. None of these pages has a national-cloud table, so the API's GCC availability is not yet specified. The guide's interim path is the portal, from the same file.`,
      detail: `Learn's Graph v1.0 pages give three calls: POST /security/rules/detectionRules to create a rule, GET to list them and PATCH /security/rules/detectionRules/{id} to update one, supplying only the properties that change. Reading needs CustomDetection.Read.All; writing needs CustomDetection.ReadWrite.All and Detection tuning (Manage) in unified RBAC, or Security Administrator (Security Operator only where Defender for Endpoint RBAC is off). A rule has a queryCondition.queryText, a schedule.frequency, a status (enabled, disabled) and a detectionAction with an alertTemplate and, optionally, automatedActions such as isolating devices. The create quota is 10 rules a minute per application. runHuntingQuery takes the query and an ISO 8601 Timespan (default 30 days); advanced hunting keeps 30 days. None of Learn's detectionRules pages has a national-cloud table, so the API's GCC availability is not yet specified.`,
      cite: ["xdr06-create", "xdr06-list", "xdr06-update", "xdr06-quotas"],
      ref: "“Start with Microsoft Learn's commands” — “What the guide and Learn give you”",
    },
    {
      part: "What", title: "What the calls leave to you, and the verdict",
      body: [
        { table: { head: ["Learn gives", "Why it isn't enough", "What the kit adds"], w: [3.0, 4.1, 5.05], rows: [
          ["A request body", "Nothing checks a rule first", "Validation: type, id, query, schedule, title, severity, status"],
          ["automatedActions in the body", "A rule could isolate on its own", "Held: containment stays with Gate 9 and a person"],
          ["“Test against the window”", "One window can't show sensitive and quiet", "<id>.test.json: known-bad and known-good, both run"],
          ["Create and update calls", "The repository and the tenant drift", "The plan: create, update changed, hold, report orphans"],
          ["“Enable after review”", "Enabled in the file, never tested", "Held unless its test passed this run"],
          ["—", "A plan changes after approval", "plan.sha256; publishing applies only that hash"],
        ] }, pt: 11.5 },
        { lead: "Verdict: use Learn's body shape and calls as they are; build the gate in front of them." },
      ],
      sources: "Sources: examples/defender-xdr tests/Checks.Tests.ps1 (Chapter 06). Chapter 06, “What it leaves to you,” “The verdict.”",
      say: `What's left to you? Nothing checks a rule before it reaches the tenant, so the kit validates it. Automated actions in the same body could let a rule isolate devices on its own, outside the response ladder, so such a rule is held. One test window can't show a rule is both sensitive and quiet, so each rule has two. The repository and the tenant drift, so the kit plans: create, update only what changed, hold what failed, report orphans. A file marked enabled might never have been tested, so it's held. And an approved plan could change afterwards, so it carries a hash. The verdict: the API deploys anything it's given; build the gate in front of it.`,
      detail: `Each row is pinned by a test in tests/Checks.Tests.ps1, Chapter 06. A request body: validation, the Graph type, an id that matches its file, a query, a schedule, a title and severity, a status. automatedActions in the same body: a rule with automated actions is held; containment stays with Gate 9 and a person. "Test against the validation window": <id>.test.json, the tables, a known-bad window with minRows, a known-good window with maxRows, both run. Create and update calls: the plan, create what isn't deployed, update only the changed properties, hold what failed, report orphans. "Enable after review": a rule whose file says enabled is held unless its test passed in this run. An approver signs off on a plan that changes afterwards: plan.sha256; publishing (Chapter 09) applies only the approved hash. GCC availability not stated: detections.deployVia: portal writes a portal sheet from the same files instead of Graph requests.`,
      cite: [],
      ref: "“What it leaves to you”; “The verdict”",
    },
    {
      part: "What", title: "The repository: two files per rule",
      body: [
        { code: [
          "contoso-office-encoded-powershell.json        # the Graph request body (Learn's example shape)",
          "contoso-office-encoded-powershell.test.json   # tables, knownBad { timespan, minRows },",
          "                                              #         knownGood { timespan, maxRows }",
        ], label: "ONE FOLDER, THE SETTINGS' inputs.rules", pt: 12 },
        { steps: [
          { title: "Validate", text: "TYPE, ID, NAME, QUERY, SCHEDULE, ALERT, NO-AUTOMATION, STATUS, DATASET, TABLES (the query starts from a declared table)" },
          { title: "Test", text: "Each rule's query over both windows, through runHuntingQuery" },
          { title: "Read", text: "The deployed rules: GET /security/rules/detectionRules" },
          { title: "Plan", text: "create; update with only the changed properties; held with the reason; orphan, reported and never deleted" },
        ], pt: 13 },
      ],
      sources: "Sources: Learn, Create detectionRule; runHuntingQuery. examples/defender-xdr (Invoke-XdrDetections.ps1, templates/). Chapter 06, “The repository.”",
      say: `The repository is one folder with two files per rule. The rule file is the Graph request body, in Learn's example shape. Beside it, a test file names the tables the query reads, a known-bad window that must return at least some rows, and a known-good window that must stay under a threshold. The detection check does four things. Validates each rule, including no automated actions, and that the query starts from a declared table. Tests each rule's query over both windows, through the hunting API. Reads the deployed rules. And plans: create, update only the changed properties, hold with the reason, and report orphans, never deleting them.`,
      detail: `One folder (the settings' inputs.rules), two files per rule: <id>.json, the Graph request body (Learn's example shape); <id>.test.json, tables, knownBad { timespan, minRows }, knownGood { timespan, maxRows }. Templates for both are in templates/. Invoke-XdrDetections.ps1 (Invoke-XdrDetectionCheck) reads the repository and: 1 validates each rule (Test-XdrDetectionRule): TYPE, ID, NAME, QUERY, SCHEDULE, ALERT, NO-AUTOMATION, STATUS, DATASET and TABLES; 2 tests each rule's query over its two windows (Test-XdrDetectionQuery), through runHuntingQuery; 3 reads the deployed rules; 4 plans (New-XdrDetectionPlan): create, update with only the changed properties, held with the reason, orphan for a deployed rule not in the repository (reported, never deleted). It writes validation.csv, tests.csv, deployed-rules.json, plan.json, plan.sha256, summary.json, raw/ and the manifest; on the portal path, portal-sheet.md too.`,
      cite: ["xdr06-create", "xdr06-hunting"],
      ref: "“The code” — “The repository”; “Validate, test, plan”",
    },
    {
      part: "Who", title: "Who writes the rules, who signs the plan",
      body: [
        { cards: [
          { title: "Detection engineer", text: "Owns G7: writes each rule and its test; quarterly review per rule", color: "navy" },
          { title: "Approver", text: "Reads plan.json and records its SHA-256 in the change record", color: "teal" },
          { title: "SOC", text: "Replays each known-bad event on ring 0 under a change record", color: "amber" },
        ], pt: 13.5 },
        { callout: "a known-bad window older than 30 days returns nothing; keep the replay current.", label: "Illustrative code: ", icon: "FaFileShield", color: "red" },
      ],
      sources: "Sources: Chapter 06, “Goal and audience,” the “Illustrative code” callout; the guide, G7 day-two and synthetic events.",
      say: `Who's involved? The detection engineer owns this gate, writes each rule and its test file, and reviews every rule each quarter. The approver reads the plan and records its hash in the change record. And the security operations center replays each known-bad event on a ring 0 device, under a change record, as the guide's synthetic events table describes. One caution: advanced hunting keeps thirty days. A known-bad window older than that returns nothing, so keep the replay current.`,
      detail: `Audience: developers who maintain the kit, and the detection engineer who owns G7. Day-two (the guide's G7): detection engineer; quarterly review per rule. The approver signs the plan's SHA-256. Illustrative code: the three fixture rules are fictional, and their known-bad events are replays on a ring 0 device under a change record, as the guide's synthetic events table describes. A known-bad window older than 30 days returns nothing; keep the replay current.`,
      cite: [],
      ref: "“Goal and audience”; the “Illustrative code” callout",
    },
    {
      part: "How", title: "Lab 1: validate, test and plan the repository",
      body: [
        { terminal: "06-2", lines: "2-4,7-14,17-22,24", pt: 10.5 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 06, “Lab 1: fixtures, no tenant,” steps 1–2.",
      say: `Lab 1, in the kit's folder. Step 1 reads one rule's test file: one table, a known-bad day that must return a row, and a quiet day that must return none. Step 2 validates, tests and plans. The admin-share rule fails validation: it would isolate devices on its own. It also fails its quiet day, three rows where one is allowed, so it would have been noisy too. The plan creates the LSASS dump-tool rule. It updates only the status of the encoded PowerShell rule, which is deployed disabled and now enabled in its file after a passing test. It holds the admin-share rule. And it reports a legacy rule, made in the portal and in no file, as an orphan.`,
      detail: `Work in examples/defender-xdr. Step 1: Get-Content tests/fixtures/rules/contoso-office-encoded-powershell.test.json. Step 2: ./Invoke-XdrDetections.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/detections -AsOf 2026-11-16T12:00:00Z. contoso-admin-share-copy fails validation (NO-AUTOMATION) and its known-good window (3 rows where 1 is allowed). The plan creates contoso-lsass-dump-tool, updates only the status of contoso-office-encoded-powershell (deployed disabled, now enabled in the file after a passing test), holds the admin-share rule, and reports contoso-legacy-rdp-rule, made in the portal and in no file, as an orphan. 3 rules, 1 validation failure, tests 5 passed and 1 failed.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: the plan's hash, and the portal path",
      body: [
        { terminal: "06-3", pt: 10.5 },
        { terminal: "06-4", lines: "4,27-28", pt: 10.5 },
        { callout: "the update's body holds status and nothing else: Learn's PATCH supplies only what changes.", label: "Read it: ", icon: "FaListCheck", color: "teal" },
      ],
      sources: "Sources: Learn, Update detectionRule. examples/defender-xdr (fictional fixtures). Chapter 06, “Lab 1: fixtures, no tenant,” steps 3–4.",
      say: `Step 3 reads the plan an approver signs: its hash, and the two actions, a post that creates and a patch that updates. The update's body holds the status and nothing else, because Learn's patch supplies only what changes. Step 4 runs the same repository on the interim path, with deploy via set to portal. The same plan comes out, as a sheet for the Defender portal, each rule with its file's hash. Delete what the lab made when you're done.`,
      detail: `Step 3: Get-Content out/detections/plan.sha256; (Get-Content out/detections/plan.json | ConvertFrom-Json).actions | Format-Table ruleId, action, method, path -AutoSize. The update's body holds status and nothing else. Step 4: write tests/fixtures/settings.portal.json with detections.deployVia = 'portal', then ./Invoke-XdrDetections.ps1 -SettingsPath tests/fixtures/settings.portal.json ... -OutputPath out/detections-portal; Get-Content out/detections-portal/portal-sheet.md. The same plan as a sheet for the Defender portal, each rule with its file's SHA-256 (the slide shows the run's last lines). Expected result: 3 rules, 1 validation failure, tests 5 passed and 1 failed; plan 1 create, 1 update, 1 held, 1 orphan. Delete out and tests/fixtures/settings.portal.json.`,
      cite: ["xdr06-update"],
      ref: "“Lab 1: fixtures, no tenant,” steps 3–4",
    },
    {
      part: "How", title: "Lab 2: test one rule in a test tenant",
      body: [
        { steps: [
          { title: "Make the known-bad event", text: "On a ring 0 test device, under a change record, run the activity your rule detects" },
          { title: "Sign in with read scopes, then validate, test and plan", text: "Connect-MgGraph -Environment Global with ThreatHunting.Read.All and CustomDetection.Read.All; ./Invoke-XdrDetections.ps1 -SettingsPath <settings-file>" },
          { title: "Read tests.csv", text: "The known-bad window should pass; if listing the rules fails, record it and set deployVia to portal" },
          { title: "Back it out", text: "Nothing was deployed: Disconnect-MgGraph" },
        ], pt: 13.5 },
        { callout: "a test tenant, never production. Publishing is Chapter 09's, with an approved hash.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Learn, List detectionRule objects; runHuntingQuery. Chapter 06, “Lab 2: a test tenant.”",
      say: `Lab 2 uses a test tenant, never production. First make the known-bad event: on a ring 0 test device, under a change record, run the activity your rule detects. Then sign in with read scopes only, and run the detection check with your own rule folder, its known-bad window covering the replay. The test file should show the known-bad window passing. If listing the deployed rules fails in the test tenant, record it in the verification log and set deploy via to portal. Nothing was deployed, so you just sign out. Publishing comes in Chapter 9, with an approved hash.`,
      detail: `Use a test tenant, never production. Make the known-bad event first: on a ring 0 test device, under a change record, run the activity your rule detects. Placeholders: <tenant-id>, <settings-file> (with inputs.rules naming a folder that holds your rule and its test file, its knownBad window covering the replay) and <output-folder>. 1 Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ThreatHunting.Read.All,CustomDetection.Read.All; ./Invoke-XdrDetections.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/detections. tests.csv should show the known-bad window Pass. If GET /security/rules/detectionRules fails in the test tenant, record it and set detections.deployVia to portal. 2 Disconnect-MgGraph. Not run by the authors.`,
      cite: ["xdr06-list", "xdr06-hunting"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.4, 2.4, 2.35, 2.0], rows: [
          ["Each rule fires on its known-bad event and stays quiet otherwise (tests.csv)", "SI-4, AU-6 (1) and (3)", "MLA-OSM, MLA-LET", "Detection engineer"],
          ["Each change comes from a reviewed file, in a plan with a hash", "CM-3", "CMT-LMC", "Detection engineer; approver"],
          ["What is deployed matches the repository; orphans named", "CM-3, SI-4", "CMT-LMC, MLA-OSM", "Detection engineer"],
        ] }, pt: 12.5 },
        { lead: "The pairs are the guide's G7 row. The kit's records support these controls; the assessor decides them." },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5; FedRAMP, Key Security Indicators. Chapter 06, “Federal requirements and evidence.”",
      say: `Here's what this gate proves, against NIST's catalog. Each rule firing on its known-bad event and staying quiet otherwise supports system monitoring and audit review, analysis and reporting. Each change coming from a reviewed file, in a plan with a hash, supports configuration change control. And what's deployed matching the repository, with orphans named, supports both. The indicators are FedRAMP's, as the guide maps them. The records support these controls; the assessor decides them.`,
      detail: `Each rule fires on its known-bad event and stays quiet in its known-good window (tests.csv): SI-4, AU-6 (1) and (3); KSI-MLA-OSM, KSI-MLA-LET; the detection engineer, quarterly per rule. Each change to a rule comes from a reviewed file, in a plan with a hash (plan.json, plan.sha256, validation.csv): CM-3; KSI-CMT-LMC; the detection engineer, the approver signs the hash. What is deployed matches the repository; orphans named (deployed-rules.json, the plan's orphans): CM-3, SI-4; KSI-CMT-LMC, KSI-MLA-OSM; the detection engineer. The pairs are the guide's G7 row.`,
      cite: [],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.6, 4.2, 4.35], rows: [
          ["A rule with automated isolation", "A server or emergency account contained by a query", "NO-AUTOMATION: held"],
          ["A rule enabled without a test", "A silent or noisy rule in production", "Held unless its test passed this run"],
          ["A rule made in the portal", "Nobody can say what it is or who approved it", "Reported as an orphan"],
          ["A plan changed after approval", "The approver signed something else", "Publishing checks the SHA-256"],
          ["A table column renamed", "The rule stops firing", "The weekly test run; Learn's naming changes page"],
          ["The API not available in GCC", "Deployment fails mid-change", "deployVia: portal, the same files"],
        ] }, pt: 11.5 },
      ],
      sources: "Sources: examples/defender-xdr (Test-XdrDetectionRule, New-XdrDetectionPlan). Chapter 06, “Dangers.”",
      say: `What breaks in production? A rule with automated isolation could contain a server or an emergency account by query; it's held. A rule enabled without a test is silent or noisy; it's held unless its test passed this run. A rule made in the portal can't be traced; it's an orphan. A plan changed after approval means the approver signed something else; publishing checks the hash. A renamed column makes a rule stop firing; the weekly test run catches it. And if the API isn't available in GCC, the portal path deploys the same files.`,
      detail: `A rule with automated isolation: a server or an emergency account contained by a query; guard: NO-AUTOMATION, held. A rule enabled without a test: a silent or noisy rule in production; guard: held unless its test passed in this run. A rule made in the portal: nobody can say what it is or who approved it; guard: reported as an orphan. A plan changed after approval: the approver signed something else; guard: publishing checks the SHA-256. A table column renamed: the rule stops firing; guard: the weekly test run; Learn's schema naming changes page. The API not available in GCC: deployment fails mid-change; guard: deployVia: portal, the same files.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { cols: [[{ bullets: [
          "Every rule has a test file with both windows inside the last 30 days",
          "No rule has automated actions",
          "Every enabled rule passed its known-bad test this run",
        ], label: "The rules", color: "navy", pt: 13.5 }], [{ bullets: [
          "Every orphan has a decision: into the repository, or disabled from a file",
          "The plan's SHA-256 is recorded with the approval",
        ], label: "The plan", color: "teal", pt: 13.5 }]] },
        { callout: "Chapter 07, Identity Signals and Automation Boundaries, sets what Defender may do on its own once these rules fire.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 06, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. Every rule has a test file, with both windows inside the last thirty days. No rule has automated actions. Every enabled rule passed its known-bad test in this run. Every orphan has a decision: into the repository, or disabled from a file. And the plan's hash is recorded with the approval. Next, Chapter 7 sets what Defender may do on its own once these rules fire, and joins identity and cloud-app signals to the endpoint's. Thanks for watching.`,
      detail: `Checklist: Every rule has a test file with both windows inside the last 30 days. No rule has automated actions. Every enabled rule passed its known-bad test this run. Every orphan has a decision: into the repository, or disabled from a file. The plan's SHA-256 is recorded with the approval. Next: Chapter 07 — Identity Signals and Automation Boundaries.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
