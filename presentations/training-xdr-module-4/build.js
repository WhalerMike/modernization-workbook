// Defender XDR learning path, Module 4: Hunting, detections as code and identity signals — the module's narrated deck.
// Teaches docs/training/defender-xdr/04-hunting-detections-and-identity-signals.md, Learn-style: objectives, the
// concepts (the rule file, validation datasets and schema governance, deploying through Graph and the government-cloud
// interim path; Defender for Identity and Defender for Cloud Apps signals and their gaps), Lab 2's exact commands in a
// test tenant (not run by the authors, as the page says; the path has no Lab 1), the federal requirement and evidence, a
// two-question check, and the summary. Every fact comes from the module page and the Defender XDR implementation guide it
// sends the learner to (Steps 7 and 8, and their footnotes); the deck adds none.
// Helpers: ../training-xdr-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-xdr-module-4/build.js \
//                      presentations/training-xdr-module-4/Training_XDR_Module_4.pptx
const P = require("../training-xdr-module-1/shared.js")({
  title: "Module 4: Hunting, detections as code and identity signals",
  footer: "Federal Modernization Workbook  ·  Defender XDR learning path, Module 4: Hunting, detections as code and identity signals",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_XDR_Module_4.pptx";
const M = "Training, Defender XDR, Module 4";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 4: Hunting, detections and identity signals", "Defender XDR Engineering and Operations · Detections as files, tested before they run, and one query across sources",
    ["The rule file  ·  Validation datasets  ·  Deploying through Graph", "Identity and cloud-app signals  ·  Lab 2 in a test tenant  ·  Evidence"]);
  notes(s,
`Welcome to Module 4 of Defender X D R Engineering and Operations: hunting, detections as code, and identity signals. A detection that lives only in a portal can't be reviewed, compared or rolled back, and one that can't be shown to fire isn't a control. In this module you learn to keep custom detections as files, test each one against data it must find and data it must stay quiet in, and deploy it through Microsoft Graph. Then you join the identity and cloud-app sensors to the endpoint's alerts, in one query. The module covers Steps 7 and 8 of the Defender X D R implementation guide. It takes about forty-five minutes, plus Lab 2 in your own test tenant.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: a rule that can't be shown to fire isn't a control");
  tag(s, "Why");
  const l = panel(s, "Portal", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "A RULE THAT LIVES IN A PORTAL", null, [
    "No review before it runs",
    "No comparison between what's deployed and what was approved",
    "No clean way back",
  ], 13);
  const r = panel(s, "Code", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "A RULE KEPT AS A FILE", null, [
    "Reviewed, and deployed disabled, then enabled by a reviewed change",
    "Tested against a known-bad event and a known-good window",
    "Deployed rules compared with the repository",
  ], 13);
  callout(s, "Lifecycle", Math.max(l, r) + 0.3, 0.95, "FaCodeBranch", HEX.teal, "The lifecycle: ",
    "author, test, alert-only, promote, review, from Security Operations and Telemetry, Chapter 11; this module puts it in a repository.");
  sources(s, "Sources: Module 4, \"Introduction\"; Guide, Step 7; Security Operations and Telemetry, Chapters 05 and 11.");
  notes(s,
`Why detections as code? A rule that lives only in a portal has three problems. No one reviews it before it runs. No one can compare what's deployed with what was approved. And there's no clean way back. A rule kept as a file fixes all three. It's reviewed, deployed disabled, and enabled by a reviewed change to the file. It's tested against a known-bad event it must find, and a known-good window it must stay quiet in. And a weekly export compares what's deployed with the repository. The lifecycle itself, author, test, alert-only, promote and review, comes from the Security Operations and Telemetry book's Chapter 11, which also says a rule that reads only Defender tables is written as a Defender custom detection. This module puts those detections in a repository and deploys them through the Graph A P I. Rules that correlate across other sources stay as Sentinel analytics rules, in that book.`,
  `${M} — "Introduction"; guide, Step 7 (introduction; Day-two); Security Operations and Telemetry, Chapter 05 ("What Defender XDR contributes"), Chapter 11 ("Rule lifecycle and testing").`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Write a custom detection as a file, and say why it starts disabled",
    "Test a rule against a validation window, within the 30-day limit",
    "Deploy through Graph's detectionRules API, or the portal where it isn't specified",
    "Name Defender for Identity's and Cloud Apps' government-cloud gaps",
    "Run the query that finds a user with alerts from more than one source",
  ], [
    "Module 3",
    "Security Operations and Telemetry, Chapter 11, rule lifecycle: skim it",
    "Lab 2: a test tenant, never production",
  ], 45);
  sources(s, "Sources: Module 4, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. Write a custom detection as a repository file, and say why it starts disabled. Test a rule against a validation window, and explain the thirty-day limit. Deploy a rule through the Graph detection rules A P I, and use the portal, from the same file, where the A P I's government-cloud availability isn't specified. Name Defender for Identity's and Defender for Cloud Apps' government-cloud gaps, and their interim path. And run the cross-source query that finds a user with alerts from more than one source. You need Module 3. Skim the rule lifecycle in the Security Operations and Telemetry book's Chapter 11. Lab 2 runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 The rule file
{
  const s = content(SC, "Unit 1: the rule file, in Learn's shape, disabled");
  tag(s, "What");
  const c = code(s, "Rule", 0.6, 1.45, 7.6, [
    "{",
    "  \"@odata.type\": \"#microsoft.graph.security.detectionRule\",",
    "  \"id\": \"contoso-office-encoded-powershell\",",
    "  \"displayName\": \"Suspicious encoded PowerShell from Office\",",
    "  \"status\": \"disabled\",",
    "  \"queryCondition\": { \"queryText\": \"DeviceProcessEvents | where ...\" },",
    "  \"schedule\": { \"frequency\": \"PT1H\" },",
    "  \"detectionAction\": { \"alertTemplate\": {",
    "    \"severity\": \"high\",",
    "    \"entityMappings\": { \"hosts\": [ ... ] },",
    "    \"tactics\": [ { \"tactic\": \"Execution\", ... \"T1059.001\" } ] } }",
    "}",
  ], { label: "THE GUIDE'S EXAMPLE, SHORTENED", pt: 10 });
  panel(s, "Rules", 8.45, 1.45, 4.3, null, HEX.navy, HEX.navyTint, "THE RULES", null, [
    "Starts disabled until the test passes",
    "No automated actions: containment stays on the ladder",
    "Enabling is a reviewed change to status",
    "Rollback: status back to disabled",
  ], 12);
  line(s, "Perms", "Deploying needs CustomDetection.ReadWrite.All and Detection tuning (Manage) or Security Administrator.", c + 0.15, 0.5, 13);
  sources(s, "Sources: Module 4, Unit 1; Guide, Step 7 (steps 1 and 3, Rollback); Microsoft Learn, Create detectionRule; Use the Microsoft Graph security API.");
  notes(s,
`Unit 1 is the rule file. It follows the example shape on Microsoft Learn's page for creating a detection rule: the type, a short client-chosen I D, a display name, the status, the query, a schedule, and the alert template, with its severity, entity mappings and the attack technique. The guide's example looks for encoded PowerShell launched by Word, Excel or Outlook, every hour. Four rules apply. The file starts with status disabled, until its test passes. Automated actions such as isolate are left out, because containment stays on the response ladder. Enabling a rule is a change to the status in the file, reviewed and redeployed. And rollback sets the status back to disabled. Learn says deploying needs the Custom Detection dot Read Write dot All permission, and a role the A P I accepts: Detection tuning, manage, in unified role-based access control, or Security Administrator. The Graph security A P I's quota is ten new rules a minute per application.`,
  `${M} — Unit 1 "Detections as code"; guide, Step 7 (Prerequisites; steps 1 to 3; Rollback); Microsoft Learn — "Create detectionRule," "Use the Microsoft Graph security API" (custom detections quotas).`);
}

// ================================================================== 5 Validation and schema
{
  const s = content(SC, "Validation datasets, schema governance, 30 days");
  tag(s, "How");
  const p1 = panel(s, "Bad", 0.6, 1.45, W3, null, HEX.red, HEX.redTint, "KNOWN-BAD", null, [
    "An event the rule must find",
    "From the synthetic events, or a ring 0 replay",
  ], 12.5);
  const p2 = panel(s, "Good", 0.6 + W3 + G3, 1.45, W3, null, HEX.teal, HEX.tealTint, "KNOWN-GOOD", null, [
    "A window the rule must stay quiet in",
    "Under its threshold",
  ], 12.5);
  const p3 = panel(s, "Schema", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.navy, HEX.navyTint, "SCHEMA GOVERNANCE", null, [
    "Each file names its tables and columns",
    "Weekly: run each query; fail it on a renamed column",
  ], 12.5);
  callout(s, "Thirty", Math.max(p1, p2, p3) + 0.3, 1.05, "FaTriangleExclamation", HEX.amber, "Advanced hunting keeps 30 days: ",
    "a validation window is at most 30 days. runHuntingQuery defaults to 30 and takes an ISO 8601 Timespan, such as P30D.");
  sources(s, "Sources: Module 4, Unit 1; Guide, Step 7 (Schema governance, Validation datasets); Microsoft Learn, security: runHuntingQuery; Advanced hunting schema naming changes.");
  notes(s,
`Every rule has a validation dataset, and a rule that can't be shown to fire isn't finished. The known-bad half is an event the rule must find, from the guide's synthetic events or a replay on a ring zero device. The known-good half is a window the rule must stay quiet in, or stay under its threshold. Then schema governance, the program's risk-based recommendation. Each rule file names the tables and columns it reads, and a weekly review runs each rule's query and fails it when a column is renamed. Microsoft Learn keeps a list of naming changes in the advanced hunting schema. One limit shapes all of this. Advanced hunting keeps thirty days, so a validation window is at most thirty days. Learn's page for the run hunting query A P I says it defaults to thirty days, and takes an I S O eighty-six oh one time span, such as P thirty D, which the lab uses.`,
  `${M} — Unit 1; guide, Step 7 ("Schema governance," "Validation datasets"), "Synthetic events"; Microsoft Learn — "security: runHuntingQuery," "Advanced hunting schema, naming changes."`);
}

// ================================================================== 6 Deploy and gov clouds
{
  const s = content(SC, "Deploying through Graph, and the government clouds");
  tag(s, "Who");
  const tb = table(s, "Gov", 1.45, [4.4, 3.9, 3.85], ["API", "GCC", "GCC High and DoD"], [
    ["runHuntingQuery (Learn)", "Available (worldwide Graph host)", "Available: US Government L4 and L5"],
    ["detectionRules (Learn)", "Not yet specified: no national-cloud table", { text: "Not yet specified: create the rule in the portal from the same file", options: { color: HEX.red, bold: true } }],
  ], { fontSize: 12.5, limit: 3.9 });
  const c = code(s, "Deploy", 0.6, tb + 0.25, 12.15, [
    "Invoke-MgGraphRequest -Method POST -Uri 'v1.0/security/rules/detectionRules' -Body (Get-Content <rule-file> -Raw) `",
    "    -ContentType 'application/json'",
    "Invoke-MgGraphRequest -Method GET -Uri 'v1.0/security/rules/detectionRules' | ConvertTo-Json -Depth 10 |",
    "    Out-File <evidence-folder>/g7-deployed-rules.json",
  ], { label: "DEPLOY, THEN EXPORT WHAT'S DEPLOYED (GUIDE STEP 7)", pt: 10 });
  line(s, "Pass", "Pass: every repository rule deployed with the same query and status; nothing deployed that isn't in it.", c + 0.15, 0.5, 13);
  sources(s, "Sources: Module 4, Unit 1; Guide, Step 7, Validate (G7), \"What couldn't be verified\"; Microsoft Learn, security: runHuntingQuery; Create detectionRule.");
  notes(s,
`Deploying is a post of the file to the detection rules endpoint, then a read-back. Validation is an export of everything deployed, compared with the repository. The guide's pass: every rule in the repository is deployed with the same query text and status, and nothing is deployed that isn't in the repository. Now the government clouds. Microsoft Learn's run hunting query page has a national-cloud table: available on the global service, which G C C uses, and in U S Government L four and L five. Learn's detection rules pages have no national-cloud table, so the guide records the A P I's government-cloud availability as not yet specified, and lists it among the things it couldn't verify. The interim path in G C C High and D O D is to create the rule in the portal from the same repository file. The file stays the source of truth either way, and the deployed-rules check still compares the two.`,
  `${M} — Unit 1 ("Government clouds"); guide, Step 7 (Prerequisites, step 3), Validate (G7), "What couldn't be verified"; Microsoft Learn — "security: runHuntingQuery," "Create detectionRule."`);
}

// ================================================================== 7 Identity and cloud apps
{
  const s = content(SC, "Unit 2: identity and cloud-app signals, and their gaps");
  tag(s, "What");
  const tb = table(s, "MDI", 1.45, [3.6, 8.55], ["Signal", "What the guide sets, from Microsoft Learn"], [
    ["Defender for Identity sensors", "On domain controllers, AD FS, AD CS and Entra Connect servers; pilot one DC per domain first"],
    ["Sensor endpoints", "GCC: <workspace>sensorapi.atp.gcc.azure.com; GCC High and DoD: <workspace>sensorapi.atp.azure.us"],
    ["Defender for Cloud Apps gaps", "App Governance's predefined and threat-detection alerts: roadmap in GCC, GCC High and DoD"],
    ["Cloud Apps behaviors (BehaviorInfo)", "Not available for GCC; the interim path for OAuth-app abuse is Sentinel's application detections"],
  ], { fontSize: 11.5, limit: 4.7 });
  callout(s, "Ninety", tb + 0.3, 1.0, "FaUserShield", HEX.teal, "Defender for Identity: ",
    "new features reach the government clouds within 90 days, and previews may not be supported there. Domain controllers stay Tier 0.");
  sources(s, "Sources: Module 4, Unit 2; Guide, Step 8; Learn, Defender for Identity for US Government; Defender for Cloud Apps for US Government; Understand the advanced hunting schema.");
  notes(s,
`Unit 2 is identity and cloud-app signals. Defender for Identity's sensors go on domain controllers, A D F S, A D C S and Entra Connect servers, and Defender for Cloud Apps' connectors bring in software-as-a-service behavior, so both land in the same incidents as the endpoint. Pilot the sensors on one domain controller per domain first; domain controllers remain Tier zero until they're retired. Microsoft Learn's government page for Defender for Identity gives each cloud its sensor endpoint: a G C C address for G C C, and an azure dot U S address for G C C High and D O D, or the service tag. Learn also says new features reach the government clouds within ninety days of commercial release, and previews may not be supported there. Then the gaps. Learn's Cloud Apps government page lists App Governance's predefined policy alerts and threat-detection alerts as roadmap items in all three clouds. And Learn's advanced hunting schema says Cloud Apps behaviors aren't available for G C C. The interim path for O auth app abuse is the application detections in Sentinel, in the Security Operations and Telemetry book.`,
  `${M} — Unit 2 "Identity and cloud-app signals"; guide, Step 8 (introduction, Prerequisites, How-section notes); Microsoft Learn — "Defender for Identity for US Government offerings," "Defender for Cloud Apps for US Government offerings," "Understand the advanced hunting schema."`);
}
endModule(SC);

// ================================================================== 8 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 3: connect, write the file, test it");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: connect with the detection permissions",
    "Connect-MgGraph -Environment <graph-environment> -Scopes ThreatHunting.Read.All,CustomDetection.ReadWrite.All",
    "# Step 2: write the guide's example rule to <rule-file>, status disabled (the page has the whole file)",
    "@'",
    "{ \"@odata.type\": \"#microsoft.graph.security.detectionRule\", \"id\": \"contoso-office-encoded-powershell\", ...",
    "  \"status\": \"disabled\", ... }",
    "'@ | Set-Content -Path <rule-file> -Encoding utf8",
    "# Step 3: test the query against the 30-day validation window",
    "$rule = Get-Content <rule-file> -Raw | ConvertFrom-Json",
    "Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $rule.queryCondition.queryText; Timespan = 'P30D' } |",
    "    ConvertTo-Json -Depth 5 | Out-File <evidence-folder>/g7-contoso-office-encoded-powershell-test.json",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.05, "FaTriangleExclamation", HEX.amber, "Expected: ",
    "the query runs over 30 days. A quiet tenant returns no rows: that shows the known-good window only, not that the rule fires.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 2,\" steps 1 to 3; Guide, Step 7 (steps 1 and 2).");
  notes(s,
`Lab 2 runs the guide's own commands in a test tenant, never production. The authors haven't run them, as the page says. You need Module 1's test tenant, in the worldwide or G C C cloud; for G C C High or D O D, create the rule in the portal from the file instead of steps four and five. You need an account with Detection tuning, manage, or Security Administrator, activated through pim, and Defender for Identity or Cloud Apps connected, for step six to return rows. Step one connects with the hunting and custom detection permissions. Step two writes the guide's example rule to a file, with its status disabled. The slide shortens it; the page has the whole file, exactly as the guide gives it. Step three reads the file back and runs its query against the last thirty days, saving the output as the rule's test record. In a quiet test tenant it returns no rows. That shows the known-good window only. A rule isn't finished until its known-bad event is shown to fire.`,
  `${M} — "Exercise: Lab 2, a test tenant," "You need," steps 1 to 3.`);
}

// ================================================================== 9 Lab part 2
{
  const s = content(SL, "Lab 2, steps 4 to 7: deploy disabled, compare, correlate");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 4: deploy the rule, disabled, and read it back",
    "Invoke-MgGraphRequest -Method POST -Uri 'v1.0/security/rules/detectionRules' -Body (Get-Content <rule-file> -Raw) -ContentType 'application/json'",
    "Invoke-MgGraphRequest -Method GET -Uri 'v1.0/security/rules/detectionRules/contoso-office-encoded-powershell'",
    "# Step 5: export what's deployed, to g7-deployed-rules.json",
    "# Step 6: users with alerts from more than one source in 7 days (the KQL is one line on the page)",
    "$q = 'AlertEvidence | where Timestamp > ago(7d) | where EntityType == \"User\" and isnotempty(AccountObjectId)",
    "      | join kind=inner (AlertInfo | project AlertId, Title, Severity) on AlertId",
    "      | summarize Sources = dcount(ServiceSource), SourceList = make_set(ServiceSource), Alerts = dcount(AlertId)",
    "        by AccountObjectId, AccountUpn | where Sources > 1 | order by Sources desc, Alerts desc'",
    "# Step 7: back it out: the rule stays disabled, the guide's rollback state",
    "Disconnect-MgGraph",
  ], { label: "LAB 2  ·  WRAPPED TO FIT: EACH COMMAND IS ONE LINE ON THE PAGE", pt: 10 });
  callout(s, "Expect", c + 0.3, 1.05, "FaChartLine", HEX.teal, "Expected: ",
    "the rule reads back disabled with the file's query; step 6 returns rows from more than one ServiceSource where the sources feed alerts.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 2,\" steps 4 to 7; Guide, Step 7 (step 3), Validate (G7), Validate (G8).");
  notes(s,
`Step four is the lab's only write: it posts the file to the detection rules endpoint, then reads the rule back by its I D. It should come back with the file's query text and status disabled, so it never runs. Step five exports everything deployed, which is the guide's validate step: every rule in the repository deployed with the same query and status, and nothing deployed that isn't in the repository. Step six is the guide's cross-source query. It takes the user entities in the last seven days of alert evidence, joins the alert info, and counts, for each user, the distinct service sources that raised alerts, keeping users seen by more than one. An identity seen by the endpoint, identity and cloud-app sensors together is a priority. The guide's pass: the query runs and returns rows from more than one service source across the fleet, showing the identity and cloud-app sources are feeding alerts. A test tenant with few alerts may return none. Step seven backs it out. The rule is deployed disabled, which is the guide's rollback state; leave it so, and disconnect.`,
  `${M} — "Exercise: Lab 2," steps 4 to 7; guide, Step 7 (step 3, Rollback), Validate (G7), Validate (G8).`);
}
endModule(SL);

// ================================================================== 10 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 4");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.9, 3.65], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["G7: SI-4 monitoring, AU-6 (1) and (3), CM-3 for rule changes", "KSI-MLA-OSM, KSI-MLA-LET, KSI-CMT-LMC", "Rule repository, test outputs, deployed-rules export"],
    ["G8: SI-4, AU-6 (3) correlate repositories, AC-2 (12) account monitoring", "KSI-MLA-OSM, KSI-MLA-RVL", "Correlation query output, sensor health"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. KSIs are FedRAMP 20x indicators for cloud service providers that the agency lines its evidence up with.");
  sources(s, "Sources: Module 4, \"The federal requirement\"; Guide, \"Requirements and KSIs\"; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from the guide's requirements table. Gate seven supports S I four, system monitoring; A U six, enhancements one and three, automated process integration and correlating audit record repositories; and C M three, configuration change control, here for rule changes. The evidence is the rule repository, the test outputs and the deployed-rules export. Gate eight supports S I four; A U six, enhancement three, correlating repositories; and A C two, enhancement twelve, account monitoring for atypical usage. The evidence is the correlation query output and the sensors' health. All from NIST special publication eight hundred fifty-three, revision five. Each row lines up with fed-ramp twenty X key security indicators, which bind cloud service providers; the agency lines its own evidence up with them. The gates support these controls, and the assessor decides whether each is satisfied.`,
  `${M} — "The federal requirement" table; guide, "Requirements and KSIs" (G7, G8).`);
}

// ================================================================== 11 Check
{
  const s = check(SS, "Check yourself: two questions on Module 4", [
    { q: "An auditor asks for a rule's validation against the last 90 days of hunting data. What's the limit?", options: ["a. None", "b. 30 days: advanced hunting keeps 30 days, and runHuntingQuery defaults to 30", "c. 7 days"] },
    { q: "A GCC High SOC wants to deploy rules as code. What does the program do?", options: ["a. Deploy through detectionRules, as in GCC", "b. The API's national-cloud availability isn't specified: create the rule in the portal from the same file", "c. Write the rule in Sentinel instead"] },
  ], "1 b: 30 days is the window. 2 b: the repository file stays the source; the portal is the interim path.");
  sources(s, "Sources: Module 4, \"Knowledge check,\" questions 2 and 3; Unit 1; Guide, Step 7, \"What couldn't be verified.\"");
  notes(s,
`Check yourself with two questions. First: an auditor asks for a rule's validation against the last ninety days of hunting data. What's the limit? The answer is b, thirty days. Advanced hunting keeps thirty days, and Microsoft Learn says the run hunting query A P I defaults to thirty. That's also why the monthly evidence run in Module 5 files its results. Second: a G C C High S O C wants to deploy rules as code. What does the program do? The answer is b. Learn doesn't specify the detection rules A P I's national-cloud availability, so the interim path is to create the rule in the portal, from the same repository file, and keep comparing the deployed rules with the repository. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 2 and 3, and "Check your answers."`);
}

// ================================================================== 12 Summary
{
  const s = content(SS, "Summary: tested detections, correlated signals");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Wrote a detection as a file, disabled",
    "Tested it against a 30-day validation window",
    "Deployed it through Graph and compared with the repository",
    "Ran the cross-source query",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 5", [
    "Automation, operations and evidence",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the detection repository at a tagged commit, each rule's test output, the deployed-rules export, the correlation output and sensor health.");
  sources(s, "Sources: Module 4, \"Summary\"; learning path index; Module 5.");
  notes(s,
`To sum up. You wrote a detection as a file, in Microsoft Learn's shape, with its status disabled. You tested its query against a thirty-day validation window, and saved the result as its test record. You deployed it through Graph, read it back, and compared everything deployed with the repository. And you ran the cross-source query that finds a user with alerts from more than one source. The evidence an I S S O keeps from this module: the detection repository at a tagged commit, each rule's test output, the deployed-rules export, the correlation query output, and the identity sensors' health. Next is Module 5, the last: automation with approval boundaries, the operating cadence, and the monthly evidence run.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/defender-xdr/04-hunting-detections-and-identity-signals.md (Defender XDR Engineering and Operations, Module 4); the path's verification log is docs/training/defender-xdr/_verification/learning-path.md.",
  "Defender XDR Engineering & Operations: An Implementation Guide: Steps 7 and 8, \"Synthetic events,\" \"Requirements and KSIs,\" \"What couldn't be verified\"; its footnotes carry each source, read November 11, 2026. Security Operations and Telemetry, Chapters 03, 05 and 11.",
  "Microsoft Learn: Create detectionRule; Use the Microsoft Graph security API; security: runHuntingQuery; Advanced hunting schema naming changes; Understand the advanced hunting schema; Migrate advanced hunting queries; AlertEvidence; AlertInfo; Defender for Identity for US Government; Defender for Cloud Apps for US Government.",
  "NIST SP 800-53 Rev. 5 (SI-4, AU-6 (1) and (3), CM-3, AC-2 (12)); FedRAMP 20x KSIs, as Security Operations and Telemetry, Chapter 12, maps them.",
  "Lab 2's commands are the page's, with its placeholders; the slides shorten the rule file and wrap the query to fit. The path has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
