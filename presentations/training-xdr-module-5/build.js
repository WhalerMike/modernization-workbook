// Defender XDR learning path, Module 5: Automation, operations and evidence — the module's narrated deck.
// Teaches docs/training/defender-xdr/05-automation-operations-and-evidence.md, Learn-style: objectives, the concepts
// (automation levels per device group and the response ladder; attack disruption exclusions; the operating cadence; the
// monthly evidence run; metrics, synthetic events and the evidence catalog), Lab 2's exact commands in a test tenant (not
// run by the authors, as the page says; the path has no Lab 1), the federal requirement and evidence, a two-question
// check, and the summary. Every fact comes from the module page and the Defender XDR implementation guide it sends the
// learner to (Steps 9 and 10, "Synthetic events", "Metrics", "Evidence catalog", and their footnotes); the deck adds none.
// Helpers: ../training-xdr-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-xdr-module-5/build.js \
//                      presentations/training-xdr-module-5/Training_XDR_Module_5.pptx
const P = require("../training-xdr-module-1/shared.js")({
  title: "Module 5: Automation, operations and evidence",
  footer: "Federal Modernization Workbook  ·  Defender XDR learning path, Module 5: Automation, operations and evidence",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_XDR_Module_5.pptx";
const M = "Training, Defender XDR, Module 5";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 5: Automation, operations and evidence", "Defender XDR Engineering and Operations · Automation set to the ladder, and evidence every month",
    ["Automation levels  ·  Attack disruption exclusions  ·  The cadence", "The monthly evidence run  ·  Metrics  ·  Lab 2 in a test tenant"]);
  notes(s,
`Welcome to Module 5, the last module of Defender X D R Engineering and Operations: automation, operations and evidence. Automation is where speed and outage meet. The same setting that contains a compromised laptop in minutes can lock out the account the security operations center needs to respond. In this module you set Defender's automation to the program's response ladder, and exclude what must never be contained automatically. Then you run the platform: the cadence, the monthly evidence run, the synthetic events, and the metrics an assessor reads. The module covers Steps 9 and 10 of the Defender X D R implementation guide. It takes about forty minutes, plus Lab 2 in your own test tenant.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: automation is where speed and outage meet");
  tag(s, "Why");
  const l = panel(s, "Speed", 0.6, 1.45, W2, null, HEX.teal, HEX.tealTint, "SPEED", null, [
    "Full automation remediates threats on workstations",
    "Microsoft recommends Full",
    "Every attack disruption action can be undone",
  ], 13);
  const r = panel(s, "Outage", 0.6 + W2 + G2, 1.45, W2, null, HEX.red, HEX.redTint, "OUTAGE", null, [
    "A contained server is an outage",
    "A contained emergency account is a lockout",
    "Exclusions reduce protection, Microsoft cautions",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaScaleBalanced", HEX.navy, "Two settings matter: ",
    "each device group's remediation level, and the exclusions for automatic attack disruption, both set to the program's response ladder.");
  sources(s, "Sources: Module 5, \"Introduction\"; Guide, Step 9, \"Dangers\"; Learn, Configure automatic attack disruption; Exclude assets from automated responses; automatic attack disruption overview.");
  notes(s,
`Why does automation need a boundary? Because it cuts both ways. On the speed side: Microsoft Learn recommends the full remediation level for device groups, so threats on workstations are remediated automatically, and Learn says every automatic attack disruption action can be undone by the security team. On the outage side: a contained server is an outage, and a contained emergency access account is a lockout, in the middle of the incident. The guide names both as dangers. And Learn itself cautions that exclusions reduce protection, so you can't exclude your way out either. The Security Operations and Telemetry book's response ladder decides what may act without a person. This module sets Defender's own automation to match it, with two settings: each device group's remediation level, and the exclusions for automatic attack disruption.`,
  `${M} — "Introduction"; guide, Step 9 (introduction, Enforcement, Rollback, Exclusions), "Dangers"; Microsoft Learn — "Configure automatic attack disruption," "Exclude assets from automated responses," "Automatic attack disruption in Microsoft Defender."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 5", [
    "Name the five automation levels and set each device group to the ladder",
    "Record attack disruption exclusions, with the authorizing official's approval",
    "Run the monthly evidence run and check its hashes a month later",
    "Show that the controls work, with synthetic events and the metrics",
  ], [
    "Modules 1 to 4",
    "Security Operations and Telemetry, Chapter 11, the response ladder, and Chapter 12, the metric set",
    "Lab 2: a test tenant, never production",
  ], 40);
  sources(s, "Sources: Module 5, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. Name the five automation levels, and set each device group's level to the response ladder. Record attack disruption exclusions for emergency access and service accounts, with the authorizing official's approval. Run the monthly evidence run, and check its hashes a month later. And use the synthetic events, the metrics and the evidence catalog to show that the controls work, not just that they exist. You need Modules 1 to 4. Skim the Security Operations and Telemetry book's Chapter 11, for the response ladder, and Chapter 12, for the metric set. Lab 2 runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Levels
{
  const s = content(SC, "Unit 1: automation levels per device group");
  tag(s, "How");
  const tb = table(s, "Levels", 1.45, [5.2, 6.95], ["Level (Microsoft Learn)", "Where the program uses it (risk-based recommended)"], [
    ["Full - remediate threats automatically", "Workstation groups, after the pilot: Microsoft's recommended setting"],
    ["Semi - require approval for core folders", "A semi level for server groups"],
    ["Semi - require approval for non-temp folders", "A semi level for server groups"],
    ["Semi - require approval for all folders", "The pilot: ring 1 workstations, two weeks, every action approved"],
    ["No automated response", "Only by recorded decision"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Server", tb + 0.3, 1.0, "FaServer", HEX.red, "Servers stay at a semi level: ",
    "isolating a server is never autonomous in the program's ladder. Rollback: Settings > Microsoft Defender XDR > Automated responses > Devices.");
  sources(s, "Sources: Module 5, Unit 1; Guide, Step 9 (Pilot, Audit phase, Enforcement, Rollback); Learn, Configure automatic attack disruption; Exclude assets from automated responses.");
  notes(s,
`Unit 1 is automated investigation and response, set per device group. Microsoft Learn lists five levels. Full, remediate threats automatically. Three semi levels, requiring approval for core folders, for non-temp folders, or for all folders. And no automated response. The program's choices are risk-based recommendations. The pilot puts ring one's workstation group at semi, require approval for all folders, so every remediation is proposed and an analyst approves it in the Action center. Those two weeks of pending actions, with the approval rate recorded, are the audit phase. Then workstation groups go to full, which Learn recommends. Server groups stay at a semi level, because isolating a server is never autonomous in the program's ladder. Rollback sets a device group back to a semi level, on the Devices page under automated responses in the Defender X D R settings. Learn says changing device groups needs Global Administrator or Security Administrator.`,
  `${M} — Unit 1 "Automation with approval boundaries"; guide, Step 9 (Prerequisites, Pilot, Report-only or audit phase, Enforcement, Rollback); Microsoft Learn — "Configure automatic attack disruption," "Exclude assets from automated responses."`);
}

// ================================================================== 5 Disruption exclusions
{
  const s = content(SC, "Attack disruption: exclude what must never be contained");
  tag(s, "Who");
  const p1 = panel(s, "Ident", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "IDENTITIES", null, [
    "Emergency access accounts",
    "Service accounts whose disablement would stop the SOC",
  ], 12.5);
  const p2 = panel(s, "Dev", 0.6 + W3 + G3, 1.45, W3, null, HEX.teal, HEX.tealTint, "DEVICES", null, [
    "Device groups and IP ranges",
    "Excluding a group also affects automated investigation for it",
  ], 12.5);
  const p3 = panel(s, "Approve", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.amber, HEX.amberTint, "EACH ONE", null, [
    "In the register, with the authorizing official's approval",
    "Reviewed quarterly",
  ], 12.5);
  callout(s, "Gov", Math.max(p1, p2, p3) + 0.3, 1.05, "FaTriangleExclamation", HEX.red, "Government clouds: ",
    "attack disruption's availability isn't specified on Learn; confirm it in the tenant. Contain User needs sensor v10.8470 or later.");
  sources(s, "Sources: Module 5, Unit 1; Guide, Step 9 (Prerequisites, Exclusions), \"What couldn't be verified\"; Learn, Exclude assets from automated responses; Configure automatic attack disruption.");
  notes(s,
`Automatic attack disruption has its own exclusions, under the automated response settings in Defender X D R. Microsoft Learn says the identities page holds user exclusions, and the devices page holds device groups and I P ranges. Learn names service accounts and emergency admin accounts as the use for user exclusions, and cautions that exclusions reduce protection. So the program excludes exactly two kinds of identity: the emergency access accounts, and the service accounts whose disablement would stop the S O C itself. Learn adds that excluding a device group from attack disruption also affects automated investigation and response for that group. Each exclusion goes in the register with the authorizing official's approval, and is reviewed every quarter. Two more facts from Learn. The contain user action needs sensor version ten point eight four seven zero or later, which the lab checks. And attack disruption's availability in G C C, G C C High and D O D isn't specified on Learn's government pages, so confirm it in the tenant.`,
  `${M} — Unit 1; guide, Step 9 (Prerequisites, Exclusions, Day-two), "What couldn't be verified"; Microsoft Learn — "Exclude assets from automated responses in automatic attack disruption," "Configure automatic attack disruption."`);
}

// ================================================================== 6 Cadence and the monthly run
{
  const s = content(SC, "Unit 2: the cadence and the monthly evidence run");
  tag(s, "How");
  const tb = table(s, "Cadence", 1.45, [5.0, 2.0, 5.15], ["Activity", "Cadence", "Output"], [
    ["Sensor health and coverage", "Weekly", "Coverage file; a ticket for every device not Active"],
    ["Prevention and ASR drift", "Weekly", "G3 and G4 queries; policy export diff"],
    ["Detection tuning; exception review; exercise", "Quarterly", "Test outputs; re-approved exceptions; exercise record"],
    ["Metrics and evidence package", "Monthly", "The metrics and evidence files, hashed"],
  ], { fontSize: 12, limit: 4.3 });
  callout(s, "Thirty", tb + 0.3, 1.05, "FaFileShield", HEX.navy, "Why the run files results: ",
    "advanced hunting keeps 30 days. The monthly run, hashed, is how anyone answers for an older month.");
  sources(s, "Sources: Module 5, Unit 2; Guide, Step 10 (the cadence table, the monthly evidence run), \"Dangers\"; Microsoft Learn, Monitor ASR rule activity.");
  notes(s,
`Unit 2 is operations. The operating rhythm belongs to the Security Operations and Telemetry book; this gate produces Defender's part of it, on a cadence that's the program's risk-based recommendation. Weekly: sensor health and coverage, with a ticket for every device not active, and prevention and Attack Surface Reduction drift, with the policy export compared against the last approved one. Quarterly: detection tuning for each rule, the exception register review, and an exercise, a tabletop plus the synthetic events. Monthly: the metrics and the evidence package, hashed. The monthly evidence run is a short script from the guide. It runs the read-only coverage, Attack Surface Reduction and prevention queries, exports the last thirty days of incidents with their classification and determination, and hashes every file. Why file the results? Because Microsoft Learn says advanced hunting keeps thirty days. The monthly run is how anyone can answer for an older month.`,
  `${M} — Unit 2 "Operations, evidence and metrics"; guide, Step 10 (cadence table; "The monthly evidence run"), "Dangers" (hunting evidence older than 30 days); Microsoft Learn — "Monitor ASR rule activity."`);
}

// ================================================================== 7 Metrics and synthetic events
{
  const s = content(SC, "Metrics measure coverage and effect, not settings");
  tag(s, "What");
  const tb = table(s, "Metrics", 1.45, [3.2, 4.6, 4.35], ["Metric", "Formula", "Why it isn't configuration presence"], [
    ["Protected coverage", "Active sensors ÷ in-scope devices in the CM-8 inventory", "A policy says nothing about devices that never checked in"],
    ["Enforcement depth", "Devices with every ASR rule in block, or excepted ÷ onboarded", "Audit mode is configured but protects nothing"],
    ["Detection validity", "Enabled detections with a passing known-bad test ÷ enabled", "A rule that can't be shown to fire isn't a control"],
    ["Synthetic-event success", "Events that produced their expected alert ÷ events run", "End-to-end proof of telemetry and route"],
  ], { fontSize: 11.5, limit: 4.7 });
  callout(s, "Synth", tb + 0.3, 1.0, "FaListCheck", HEX.teal, "Synthetic events, on ring 0 under a change record: ",
    "the detection test, the network protection test site, a controlled folder access write, an ASR demonstration, a detection's known-bad replay.");
  sources(s, "Sources: Module 5, Unit 2; Guide, \"Metrics,\" \"Synthetic events,\" \"Evidence catalog\"; Security Operations and Telemetry, Chapter 12.");
  notes(s,
`The metrics measure protected coverage and effectiveness, not whether a setting exists. They join Security Operations and Telemetry's metric set, and the targets are the program's to set. Four examples from the guide's seven. Protected coverage is onboarded devices with an active sensor, divided by in-scope devices in the inventory, because a policy assigned to a group says nothing about devices that never checked in. Enforcement depth is devices with every Attack Surface Reduction rule in block, or an approved exception, divided by onboarded devices, because audit mode is configured but protects nothing. Detection validity is enabled detections with a passing known-bad test this quarter, divided by enabled detections. And synthetic-event success is events that produced their expected alert, divided by events run. The synthetic events, run on ring zero devices under a change record, are the detection test, the network protection test site, a controlled folder access write by an untrusted app, a demonstration for each rule, and a custom detection's known-bad replay. They show an assessor that telemetry, detection and routing work end to end.`,
  `${M} — Unit 2; guide, "Metrics" (table), "Synthetic events" (table), "Evidence catalog"; Security Operations and Telemetry, Chapter 12 ("The metric set").`);
}
endModule(SC);

// ================================================================== 8 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 and 2: sensor version, device groups");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: on <pilot-device>: the sensor version, for Contain User (Learn's command)",
    "Get-ItemProperty -Path 'Registry::HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows Advanced Threat Protection\\Status' -Name \"MsSenseDllVersion\"",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10 });
  const p1 = panel(s, "Path", 0.6, c + 0.25, 7.3, null, HEX.navy, HEX.navyTint, "STEP 2: IN THE DEFENDER PORTAL FOR YOUR CLOUD", null, [
    "Settings > Microsoft Defender XDR > Automated responses > Devices: note each group's level",
    "Settings > Microsoft Defender XDR > Automated response > Identities: note the excluded users",
    "Compare both with the ladder decision record",
  ], 12);
  const p2 = panel(s, "Pass", 8.15, c + 0.25, 4.6, null, HEX.teal, HEX.tealTint, "PASS, AS THE GUIDE STATES IT", null, [
    "Step 1: v10.8470 or later",
    "Every server group at a semi level",
    "Workstations at Full or excepted",
    "Emergency accounts excluded",
  ], 12);
  if (Math.max(p1, p2) > 6.61) console.warn("  ! Lab panels may overflow");
  sources(s, "Sources: Module 5, \"Exercise: Lab 2,\" steps 1 and 2; Guide, Validate (G9), Step 9 (Rollback, Exclusions); Microsoft Learn, Configure automatic attack disruption.");
  notes(s,
`Lab 2 runs the guide's validate steps in a test tenant, never production. The authors haven't run them, as the page says. Every step reads, apart from the evidence files it writes in your own folder. You need Module 1's test tenant, reader account and test device, an account that can view the Defender portal's settings, and the ladder decision record for the test tenant, or the guide's Step 9 as the reference. Step one runs on the test device. It's Microsoft Learn's command that reads the sensor version from the registry. Contain user needs ten point eight four seven zero or later. Step two is a click path in the Defender portal for your cloud. Open the devices page under automated responses and note each device group's level. Then open the identities page and note the excluded users. Compare both with the ladder decision record. The guide's pass: every server group at a semi level, every workstation group at full or a recorded exception, and the emergency access accounts in the identity exclusions.`,
  `${M} — "Exercise: Lab 2, a test tenant," "You need," steps 1 and 2; guide, Validate (G9), Step 9 (Rollback, Exclusions).`);
}

// ================================================================== 9 Lab part 2
{
  const s = content(SL, "Lab 2, steps 3 to 5: the monthly run and its hashes");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 3: the guide's monthly evidence run (shortened here: the page has it in full)",
    "New-Item -ItemType Directory -Path <evidence-folder>",
    "Connect-MgGraph -Environment <graph-environment> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All",
    "$queries = @{ 'coverage' = '...'; 'asr' = '...'; 'prevention' = '...' }",
    "foreach ($k in $queries.Keys) { Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $queries[$k] } |",
    "    ConvertTo-Json -Depth 5 | Out-File \"<evidence-folder>/$k.json\" }",
    "Get-MgSecurityIncident -Filter \"createdDateTime ge ...\" -All | Select-Object Id, Severity, Status, Classification, ... |",
    "    Export-Csv \"<evidence-folder>/incidents.csv\" -NoTypeInformation",
    "Get-ChildItem <evidence-folder> -File | Get-FileHash -Algorithm SHA256 | Export-Csv \"<evidence-folder>/SHA256SUMS.csv\" -NoTypeInformation",
    "# Step 4: check the hashes, as next month's run does",
    "$recorded = Import-Csv <evidence-folder>/SHA256SUMS.csv | Where-Object { (Split-Path $_.Path -Leaf) -ne 'SHA256SUMS.csv' }",
    "$recorded | ForEach-Object { [pscustomobject]@{ Path = $_.Path;",
    "    Matches = ((Get-FileHash -Algorithm SHA256 -LiteralPath $_.Path).Hash -eq $_.Hash) } } | Format-Table -AutoSize",
    "# Step 5: back it out: nothing changed in the tenant",
    "Disconnect-MgGraph",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10 });
  callout(s, "Expect", c + 0.2, 0.95, "FaFileShield", HEX.teal, "Expected: ",
    "coverage, asr, prevention, incidents and SHA256SUMS files; Matches True for every evidence file. False means a file changed after filing.");
  sources(s, "Sources: Module 5, \"Exercise: Lab 2,\" steps 3 to 5; Guide, Step 10 (the monthly evidence run), Validate (G10); Microsoft Learn, List incidents.");
  notes(s,
`Step three is the guide's monthly evidence run, shortened on the slide; the page has it in full. Use a new, empty evidence folder, because the run hashes every file in it. It connects, runs the three read-only queries for coverage, Attack Surface Reduction and prevention, and writes each to a file. It exports the last thirty days of incidents, filtered on the created date time, which Microsoft Learn lists as filterable, with their severity, status, classification and determination. Then it hashes every file in the folder into a checksum file. You should see the coverage, A S R, prevention and incidents files, and the checksum file. Step four checks the hashes, the way next month's run checks last month's. It reads the checksum file, leaves out the checksum file's own entry, since the run writes it into the folder it hashes, and compares each recorded hash with a fresh one. Matches should be true for every evidence file. False means a file changed after it was filed. Step five backs it out: nothing changed in the tenant, so disconnect.`,
  `${M} — "Exercise: Lab 2," steps 3 to 5; guide, Step 10 ("The monthly evidence run"), Validate (G10); the path's verification log (the hash check); Microsoft Learn — "List incidents" (filterable properties).`);
}
endModule(SL);

// ================================================================== 10 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 5");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.9, 3.65], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["G9: IR-4 (1) automated incident handling, SI-4 (7) automated response", "KSI-INR-RIR", "Device group levels, exclusions, Action center export"],
    ["G10: CA-7 continuous monitoring, AU-11 retention, IR-3 incident response testing", "KSI-MLA-EVC, KSI-INR-AAR", "Monthly package, exercise record"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. The closure map's audit and visibility row: Gates 2, 7 and 10 and the synthetic events.");
  sources(s, "Sources: Module 5, \"The federal requirement\"; Guide, \"Requirements and KSIs\"; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from the guide's requirements table. Gate nine supports I R four, enhancement one, automated incident handling processes, and S I four, enhancement seven, automated response to suspicious events, from NIST special publication eight hundred fifty-three, revision five. The evidence is the device group levels, the exclusions, and the Action center export. Gate ten supports C A seven, continuous monitoring; A U eleven, audit record retention; and I R three, incident response testing. The evidence is the monthly package and the exercise record. Each row lines up with fed-ramp twenty X key security indicators, which bind cloud service providers; the agency lines its own evidence up with them. The guide counts Gates two, seven and ten, with the synthetic events, as the closure map's audit and visibility row. The gates support these controls, and the assessor decides whether each is satisfied.`,
  `${M} — "The federal requirement" table; guide, "Requirements and KSIs" (G9, G10; closure map rows).`);
}

// ================================================================== 11 Check
{
  const s = check(SS, "Check yourself: two questions on Module 5", [
    { q: "What level does the program set for a server device group?", options: ["a. Full, as Microsoft recommends", "b. A semi level: isolating a server is never autonomous in the program's ladder", "c. No automated response, always"] },
    { q: "An assessor asks for the coverage query result from four months ago. Where does it come from?", options: ["a. Advanced hunting, which keeps a year", "b. That month's evidence run: hunting keeps 30 days, so the filed, hashed result is the record", "c. It can't be produced"] },
  ], "1 b: workstations at Full, servers at a semi level. 2 b: the monthly run is the record.");
  sources(s, "Sources: Module 5, \"Knowledge check,\" questions 1 and 3; Units 1 and 2; Guide, Steps 9 and 10, \"Dangers.\"");
  notes(s,
`Check yourself with two questions. First: what level does the program set for a server device group? The answer is b, a semi level. Microsoft recommends full, and the program uses full for workstations, but isolating a server is never autonomous in the program's ladder. Second: an assessor asks for the coverage query result from four months ago. Where does it come from? The answer is b: that month's evidence run. Advanced hunting keeps thirty days, so the filed and hashed result is the record, and its checksum shows it hasn't changed. The module page has two more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 3, and "Check your answers."`);
}

// ================================================================== 12 Summary
{
  const s = content(SS, "Summary: bounded automation, evidence every month");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Checked the sensor version for Contain User",
    "Compared device group levels and exclusions with the ladder",
    "Ran the monthly evidence run",
    "Checked its hashes",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "The guide's checklist", [
    "Work it gate by gate, from G1 to G10",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "device group levels, disruption exclusions with approvals, the monthly Action center export, the exercise record, and the package with SHA256SUMS.");
  sources(s, "Sources: Module 5, \"Summary\"; learning path index; Guide, \"Checklist.\"");
  notes(s,
`To sum up. You checked the sensor version that contain user needs. You compared the device group levels and the attack disruption exclusions with the ladder decision record. You ran the monthly evidence run, and you checked its hashes the way next month's run will. The evidence an I S S O keeps from this module: the device group list with each remediation level, the attack disruption exclusions with their approvals, the monthly Action center export, the quarterly exercise record, and the monthly package with its checksum file. That completes the learning path. From here, work the implementation guide's checklist, gate by gate, from one to ten, and keep the evidence each gate names. Thank you for following Defender X D R Engineering and Operations.`,
  `${M} — "Summary," "Continue the path"; guide, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 5 deck", [
  "Module page: docs/training/defender-xdr/05-automation-operations-and-evidence.md (Defender XDR Engineering and Operations, Module 5); the path's verification log is docs/training/defender-xdr/_verification/learning-path.md.",
  "Defender XDR Engineering & Operations: An Implementation Guide: Steps 9 and 10, \"Synthetic events,\" \"Metrics,\" \"Evidence catalog,\" \"Requirements and KSIs,\" \"Dangers,\" \"Checklist\"; its footnotes carry each source, read November 11, 2026. Security Operations and Telemetry, Chapters 11 and 12.",
  "Microsoft Learn: Configure automatic attack disruption; Exclude assets from automated responses in automatic attack disruption; the automatic attack disruption overview; Monitor ASR rule activity; List incidents; security: runHuntingQuery.",
  "NIST SP 800-53 Rev. 5 (IR-4 (1), SI-4 (7), CA-7, AU-11, IR-3); FedRAMP 20x KSIs, as Security Operations and Telemetry, Chapter 12, maps them.",
  "Lab 2's commands are the page's, with its placeholders; the slides shorten the monthly run to fit. The path has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
