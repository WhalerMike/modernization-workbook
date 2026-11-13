// Defender XDR learning path, Module 3: Exposure and incidents — the module's narrated deck.
// Teaches docs/training/defender-xdr/03-exposure-and-incidents.md, Learn-style: objectives, the concepts (what Defender
// adds to vulnerability work in government clouds and what it can't do there; the interim path and owners; one incident
// queue, the severity table, containment and hand-off), Lab 2's exact commands in a test tenant (not run by the authors,
// as the page says; the path has no Lab 1), the federal requirement and evidence, a two-question check, and the summary.
// Every fact comes from the module page and the Defender XDR implementation guide it sends the learner to (Steps 5 and 6,
// and their footnotes); the deck adds none.
// Helpers: ../training-xdr-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-xdr-module-3/build.js \
//                      presentations/training-xdr-module-3/Training_XDR_Module_3.pptx
const P = require("../training-xdr-module-1/shared.js")({
  title: "Module 3: Exposure and incidents",
  footer: "Federal Modernization Workbook  ·  Defender XDR learning path, Module 3: Exposure and incidents",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_XDR_Module_3.pptx";
const M = "Training, Defender XDR, Module 3";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 3: Exposure and incidents", "Defender XDR Engineering and Operations · An owner for every vulnerability, a table for every incident",
    ["Exposure without Exposure Management  ·  The interim path  ·  Owners", "One queue  ·  The severity table  ·  Lab 2 in a test tenant  ·  Evidence"]);
  notes(s,
`Welcome to Module 3 of Defender X D R Engineering and Operations: exposure and incidents. Two queues decide whether the platform you built is used: the vulnerabilities waiting for an owner, and the incidents waiting for an analyst. In this module you learn what Defender adds to the vulnerability program in a government cloud, and what it can't do there. Then you learn how the security operations center triages, contains, hands off and closes every incident, to a table it can show. The module covers Steps 5 and 6 of the Defender X D R implementation guide. It takes about thirty-five minutes, plus Lab 2 in your own test tenant.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: two queues decide whether the platform is used");
  tag(s, "Why");
  const l = panel(s, "Vuln", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "THE VULNERABILITY QUEUE", null, [
    "A vulnerability without an owner is a finding against CM-8, not just RA-5",
    "Attack paths aren't there in US Government clouds",
    "The remediation clock belongs to Security Operations and Telemetry",
  ], 13);
  const r = panel(s, "Inc", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "THE INCIDENT QUEUE", null, [
    "One queue, with Sentinel onboarded to the Defender portal",
    "Triage windows and a containment rung by severity",
    "Every incident closed with a classification",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaRoute", HEX.teal, "This module: ",
    "what Defender adds and can't do in a government cloud, the interim path, and an incident table the SOC can show.");
  sources(s, "Sources: Module 3, \"Introduction\"; Guide, Steps 5 and 6; Security Operations and Telemetry, Chapters 06 and 11.");
  notes(s,
`Why these two together? Because both are queues, and a queue without an owner is where risk waits. The vulnerability queue: the remediation program, its clock and the Known Exploited Vulnerabilities catalog belong to the Security Operations and Telemetry book. The guide adds what Defender contributes, and its rule that a vulnerability without an owner is a finding against C M eight, the inventory control, not just R A five, vulnerability monitoring. That's the program's risk-based recommendation. And in a U S Government cloud, the attack-path features aren't there. The incident queue: one queue, with Sentinel onboarded to the Defender portal if the agency uses it, a triage window and a containment rung for each severity, and every incident closed with a classification and a determination. The response ladder and device isolation stay in Security Operations and Telemetry; this module fixes severity, triage, evidence and hand-off.`,
  `${M} — "Introduction"; guide, Step 5 (introduction, Ownership), Step 6 (introduction, Prerequisites).`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Say which exposure features each government cloud has, and record the missing one",
    "Prioritize with the interim path, and give every device group an owner",
    "Triage an incident to the severity table, pick its rung and hand it off",
    "Export open incidents, and one incident with its alerts, as evidence",
  ], [
    "Module 1: the Graph read path",
    "Security Operations and Telemetry, Chapters 06 and 11: skim them",
    "Lab 2: a test tenant, never production",
  ], 35);
  sources(s, "Sources: Module 3, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. Say which exposure features are available in G C C, G C C High and D O D, and record the one that isn't as not applicable. Prioritize vulnerabilities with the guide's interim path, and give every device group a remediation owner. Triage an incident to the severity table, pick its containment rung, and hand it off. And export the open incidents, and one incident with its alerts, as evidence. You need Module 1's Graph read path. Skim the Security Operations and Telemetry book's Chapter 06, for the remediation program and its clock, and Chapter 11, for the response ladder. Lab 2 runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Exposure
{
  const s = content(SC, "Unit 1: exposure without Exposure Management");
  tag(s, "Who");
  const tb = table(s, "Exp", 1.45, [5.2, 6.95], ["Capability", "GCC, GCC High and DoD (Microsoft Learn)"], [
    ["Security Exposure Management: attack paths, exposure graph, critical assets", { text: "Not available: Public Cloud only, not US Gov", options: { color: HEX.red, bold: true } }],
    ["Defender Vulnerability Management, core and premium", "Available, without report inaccuracy and request CVE support"],
    ["Microsoft Secure Score", "Available; some recommendations aren't"],
  ], { fontSize: 12.5, limit: 3.9 });
  callout(s, "ZTA", tb + 0.3, 1.05, "FaScaleBalanced", HEX.navy, "A Zero Trust Assessment test that needs Exposure Management ",
    "is not applicable in the tenant's cloud: recorded in the closure register as a disposition, not a failure.");
  sources(s, "Sources: Module 3, Unit 1; Guide, Step 5; Microsoft Learn, What is Microsoft Security Exposure Management?; Defender for Endpoint for US Government customers.");
  notes(s,
`Unit 1 is the government-cloud fact that shapes this gate. Microsoft Learn's page on Security Exposure Management says it's available in Public Cloud only, not in U S Government clouds. That's the product that holds attack paths, the exposure graph and critical asset management. Learn doesn't name G C C explicitly, but Defender for U S Government customers, G C C included, is built in Azure U S Government, so the guide treats G C C as not available too, and lists that as something it couldn't verify. What the government clouds do have, from Learn's Defender for Endpoint government page: Defender Vulnerability Management, core and premium, without two features, report inaccuracy and request C V E support; and Secure Score, with some recommendations missing. So a Zero Trust Assessment test that needs Exposure Management is recorded as not applicable in the tenant's cloud. It goes in the closure register as a disposition, not a failed control.`,
  `${M} — Unit 1 "Exposure without Exposure Management"; guide, Step 5 ("The government-cloud fact that shapes the gate"), "What couldn't be verified"; Microsoft Learn — "What is Microsoft Security Exposure Management?", "Defender for Endpoint for US Government customers."`);
}

// ================================================================== 5 Interim path and owners
{
  const s = content(SC, "The interim path: exposure, internet-facing, Tier 0");
  tag(s, "How");
  const p1 = panel(s, "Device", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "FROM DEVICEINFO", null, [
    "ExposureLevel",
    "IsInternetFacing",
    "AssetValue, MachineGroup",
  ], 12.5);
  const p2 = panel(s, "Rec", 0.6 + W3 + G3, 1.45, W3, null, HEX.teal, HEX.tealTint, "FROM VULNERABILITY MANAGEMENT", null, [
    "Its security recommendations",
    "High and critical CVEs by software and recommended update",
  ], 12.5);
  const p3 = panel(s, "Tier0", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.amber, HEX.amberTint, "THE CRITICAL-ASSET LIST", null, [
    "The Tier 0 inventory from Access and Privilege",
    "Stands in for critical asset management",
  ], 12.5);
  callout(s, "Sentinel", Math.max(p1, p2, p3) + 0.3, 1.05, "FaTriangleExclamation", HEX.red, "The DeviceTvm tables stay in Defender: ",
    "they aren't ingested into Sentinel, so a Sentinel query that names them returns nothing. Every device group maps to an owner.");
  sources(s, "Sources: Module 3, Unit 1; Guide, Step 5 (Interim path, Ownership, How-section notes); Microsoft Learn, DeviceInfo; DeviceTvmSoftwareVulnerabilities.");
  notes(s,
`The guide's interim path for attack paths uses what is there. From the device info table: exposure level and whether the device is internet-facing, with its asset value and machine group. From Defender Vulnerability Management: its recommendations, and the high and critical vulnerabilities by software and recommended update. And as the critical-asset list, the Tier zero inventory from the Access and Privilege book, standing in for critical asset management. Then ownership. Each device group or device tag maps to a remediation owner in the decision record, and the vulnerability manager works Security Operations and Telemetry's queue every week. One trap from Microsoft Learn's table reference: the device T V M tables stay in Defender. They aren't ingested into Sentinel, so a Sentinel query that names them returns nothing, and a silent rule there is not a clean bill of health. Run these queries in Defender, or through Graph, as the lab does.`,
  `${M} — Unit 1; guide, Step 5 ("Interim path for attack paths," "Ownership," "How-section notes"); Microsoft Learn — "DeviceInfo," "DeviceTvmSoftwareVulnerabilities."`);
}

// ================================================================== 6 One queue, severity table
{
  const s = content(SC, "Unit 2: one queue, one severity table");
  tag(s, "Who");
  const tb = table(s, "Sev", 1.45, [2.6, 1.9, 4.25, 3.4], ["Incident severity", "Triage within", "Containment rung", "Hand-off"], [
    ["High", "1 hour", "L3 gated: the playbook prepares, a named approver releases", "IR lead and ISSO; US-CERT reporting decision"],
    ["Medium", "24 hours", "L2 advise: enrich and ticket", "Analyst decides"],
    ["Low or informational", "72 hours", "L1 observe", "Tuning review if recurring"],
  ], { fontSize: 12, limit: 4.3 });
  callout(s, "Design", tb + 0.3, 1.05, "FaScaleBalanced", HEX.navy, "Program design, risk-based recommended: ",
    "the response windows follow the program's Ticket-to-Machine reference; the response ladder is Security Operations and Telemetry's.");
  sources(s, "Sources: Module 3, Unit 2; Guide, Step 6 (Enforcement); Microsoft Learn, List incidents; Security Operations and Telemetry, Chapter 11.");
  notes(s,
`Unit 2 is the incident queue. Microsoft Learn's page on listing incidents says Defender X D R correlates alerts that share attack techniques or an attacker into one incident. With Sentinel onboarded to the Defender portal, there's one queue. The severity table is the program's design, a risk-based recommendation. A high incident is triaged within one hour. Its containment rung is L three, gated: the playbook prepares the action, and a named approver releases it. It's handed off to the incident response lead and the I S S O, with the U S cert reporting decision made under the incident response plan. A medium incident is triaged within twenty-four hours, at L two, advise: enrich it and open a ticket, and the analyst decides. A low or informational incident within seventy-two hours, at L one, observe, with a tuning review if it keeps coming back. The rungs come from the response ladder in Security Operations and Telemetry's Chapter 11.`,
  `${M} — Unit 2 "One queue, one table"; guide, Step 6 (introduction, Prerequisites, Enforcement: the severity table); Microsoft Learn — "List incidents"; Security Operations and Telemetry, Chapter 11 (the response ladder).`);
}

// ================================================================== 7 Contain, hand off, close
{
  const s = content(SC, "Contain, hand off, close: what the record must show");
  tag(s, "How");
  const p1 = panel(s, "Never", 0.6, 1.45, W3, null, HEX.red, HEX.redTint, "NEVER BY A PLAYBOOK", null, [
    "Servers",
    "Privileged accounts",
    "Emergency access accounts: a human decides",
  ], 12.5);
  const p2 = panel(s, "Close", 0.6 + W3 + G3, 1.45, W3, null, HEX.navy, HEX.navyTint, "EVERY CLOSED INCIDENT", null, [
    "A classification and a determination",
    "assignedTo and comments, in the Graph record",
  ], 12.5);
  const p3 = panel(s, "Undo", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.teal, HEX.tealTint, "ROLLBACK", null, [
    "Containment undone from the Action center",
    "A wrongly closed incident reopened with a comment",
  ], 12.5);
  callout(s, "Evidence", Math.max(p1, p2, p3) + 0.3, 1.05, "FaClipboardCheck", HEX.teal, "Evidence: ",
    "the severity table and IR plan version, the monthly export with alerts and classification, the quarterly exercise, and incidents closed late with the reason.");
  sources(s, "Sources: Module 3, Unit 2; Guide, Step 6 (Rollback, Exclusions, Evidence, Day-two); Microsoft Learn, List incidents.");
  notes(s,
`Three rules complete the gate. First, what's never contained by a playbook: servers, privileged accounts and emergency access accounts. For those, a human decides. Second, how an incident closes. Every incident closes with a classification and a determination, and Microsoft Learn says the Graph incident record carries both, along with who it's assigned to and the comments. Third, the way back. Containment actions are reversible from the Action center, such as releasing a device from isolation or re-enabling a user, as Security Operations and Telemetry describes. An incident closed by mistake is reopened with a comment. The pilot is two weeks of the day shift triaging every incident to the table and recording time to triage. The S O C lead reviews the queue daily. And the evidence: the severity table and the incident response plan's version, the monthly incident export with alerts, classification and timestamps, the quarterly exercise incident, and every incident closed outside its window, with the reason.`,
  `${M} — Unit 2; guide, Step 6 (Pilot, Rollback, Exclusions, Evidence checklist, Day-two ownership); Microsoft Learn — "List incidents."`);
}
endModule(SC);

// ================================================================== 8 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 3: vulnerabilities and exposure");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: connect in the tenant's cloud",
    "Connect-MgGraph -Environment <graph-environment> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All",
    "# Step 2: high and critical vulnerabilities (the KQL is one line on the page)",
    "$q = 'DeviceTvmSoftwareVulnerabilities | where VulnerabilitySeverityLevel in (\"Critical\", \"High\")",
    "      | summarize CVEs = dcount(CveId), Devices = dcount(DeviceId) by SoftwareVendor, SoftwareName,",
    "        RecommendedSecurityUpdate | order by Devices desc'",
    "Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $q } | ConvertTo-Json -Depth 5 | Out-File <evidence-folder>/g5-vulnerabilities.json",
    "# Step 3: exposed and internet-facing Windows devices",
    "$q = 'DeviceInfo | where Timestamp > ago(1d) | summarize arg_max(Timestamp, *) by DeviceId",
    "      | where ExposureLevel == \"High\" or IsInternetFacing == true",
    "      | project DeviceName, ExposureLevel, IsInternetFacing, AssetValue, MachineGroup'",
    "Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $q } | ConvertTo-Json -Depth 5 | Out-File <evidence-folder>/g5-exposed-devices.json",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10 });
  line(s, "Expect", "Pass: every exposed row has an owner and a ticket. If step 2 is empty, check the severity strings first.", c + 0.15, 0.5, 13);
  sources(s, "Sources: Module 3, \"Exercise: Lab 2,\" steps 1 to 3; Guide, Validate (G5), \"What couldn't be verified.\"");
  notes(s,
`Lab 2 runs the guide's validate queries in a test tenant, never production. The authors haven't run them, as the page says. Every step reads; nothing in the tenant changes. You need Module 1's test tenant and reader account, with vulnerability data from at least one onboarded device, and at least one incident in the queue. Module 1's detection test raises one. Step one connects in the tenant's cloud. Step two files the high and critical vulnerabilities, by vendor, software and recommended update. One caution the guide records: Learn's table reference doesn't list the severity strings, so the guide uses critical and high as the portal shows them. If the file comes back empty, check the values in your tenant before you trust it. Step three files the exposed and internet-facing Windows devices, with their asset value and machine group. The guide's pass: every row has an owner in the decision record and a ticket in the remediation queue.`,
  `${M} — "Exercise: Lab 2, a test tenant," "You need," steps 1 to 3; guide, Validate (G5), "What couldn't be verified" (VulnerabilitySeverityLevel strings).`);
}

// ================================================================== 9 Lab part 2
{
  const s = content(SL, "Lab 2, steps 4 to 6: export the incidents, back out");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 4: export the open incidents",
    "Get-MgSecurityIncident -Filter \"status eq 'active'\" -All | Select-Object Id, DisplayName, Severity, AssignedTo, CreatedDateTime |",
    "    Export-Csv <evidence-folder>/g6-open-incidents.csv -NoTypeInformation",
    "Import-Csv <evidence-folder>/g6-open-incidents.csv | Format-Table Id, Severity, AssignedTo",
    "# Step 5: one incident with its alerts",
    "Get-MgSecurityIncident -IncidentId <incident-id> -ExpandProperty alerts | ConvertTo-Json -Depth 10 |",
    "    Out-File <evidence-folder>/g6-incident-<incident-id>.json",
    "# Step 6: back it out: nothing changed in the tenant",
    "Disconnect-MgGraph",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.05, "FaClipboardCheck", HEX.teal, "Pass: ",
    "every open incident has an owner; the exported incident shows its alerts and evidence and, once resolved, its classification and determination.");
  sources(s, "Sources: Module 3, \"Exercise: Lab 2,\" steps 4 to 6; Guide, Validate (G6); Microsoft Learn, List incidents.");
  notes(s,
`Step four exports the open incidents. The filter asks for incidents whose status is active, and the export keeps the I D, the name, the severity, who it's assigned to, and when it was created. The second command reads the file back, so you can see the owner column. The guide's pass: every open incident has an owner. Step five exports one incident with its alerts. Use an incident number from step four's output. Microsoft Learn's page shows the expand property for alerts, so the file carries every alert in the incident and its evidence, and, once the incident is resolved, its classification and determination. That file is what an assessor traces from alert to closure. Step six backs it out. Nothing changed in the tenant, so you only disconnect. Keep the evidence folder with the rest of the path's files.`,
  `${M} — "Exercise: Lab 2," steps 4 to 6; guide, Validate (G6), Step 6 (Evidence: assessor-ready artifact); Microsoft Learn — "List incidents."`);
}
endModule(SL);

// ================================================================== 10 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 3");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.9, 3.65], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["G5: RA-5 vulnerability monitoring, SI-2 flaw remediation, CM-8", "KSI-MLA-EVC, KSI-PIY-GIV", "Vulnerability query output; the remediation queue"],
    ["G6: IR-4 incident handling, IR-5 monitoring, IR-6 reporting, AU-6", "KSI-INR-RIR, KSI-INR-RPI, KSI-MLA-RVL", "Incident exports with classification"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. KSIs are FedRAMP 20x indicators for cloud service providers that the agency lines its evidence up with.");
  sources(s, "Sources: Module 3, \"The federal requirement\"; Guide, \"Requirements and KSIs\"; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from the guide's requirements table. Gate five supports R A five, vulnerability monitoring and scanning, S I two, flaw remediation, and C M eight, the system component inventory, all from NIST special publication eight hundred fifty-three, revision five. The evidence is the vulnerability query output and the remediation queue. Gate six supports the incident response family: I R four, incident handling; I R five, incident monitoring; and I R six, incident reporting; with A U six, audit record review, analysis and reporting. The evidence is the incident exports, with their classification. Each row lines up with fed-ramp twenty X key security indicators, which bind cloud service providers; the agency lines its own evidence up with them. The gates support these controls, and the assessor decides whether each is satisfied.`,
  `${M} — "The federal requirement" table; guide, "Requirements and KSIs" (G5, G6).`);
}

// ================================================================== 11 Check
{
  const s = check(SS, "Check yourself: two questions on Module 3", [
    { q: "A GCC agency wants attack paths for its domain controllers. What does the program do?", options: ["a. Turn on Security Exposure Management", "b. Record it as not applicable; use exposure level, internet-facing devices, recommendations and the Tier 0 inventory", "c. Move the tenant to commercial"] },
    { q: "A playbook proposes isolating a domain controller during a High incident. What happens?", options: ["a. It runs, because the incident is High", "b. A human decides: servers and privileged or emergency accounts are never contained by a playbook", "c. It runs, and the SOC releases it later"] },
  ], "1 b: Exposure Management is Public Cloud only. 2 b: a server is never contained by a playbook.");
  sources(s, "Sources: Module 3, \"Knowledge check,\" questions 1 and 4; Units 1 and 2; Guide, Steps 5 and 6.");
  notes(s,
`Check yourself with two questions. First: a G C C agency wants attack paths for its domain controllers. What does the program do? The answer is b. Microsoft Learn says Exposure Management is Public Cloud only, so record it as not applicable, and use the interim path: exposure level, internet-facing devices, Vulnerability Management's recommendations, and the Tier zero inventory as the critical-asset list. Second: during a high incident, a playbook proposes isolating a domain controller. What happens? The answer is b. A human decides. Servers, and privileged or emergency accounts, are never contained by a playbook, whatever the severity. The module page has two more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 4, and "Check your answers."`);
}

// ================================================================== 12 Summary
{
  const s = content(SS, "Summary: owned vulnerabilities, classified incidents");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Recorded Exposure Management as not applicable",
    "Filed the vulnerability and exposure queries",
    "Checked that each exposed device has an owner",
    "Exported open incidents and one with its alerts",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 4", [
    "Hunting, detections as code and identity signals",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the vulnerability query output and queue, the severity table and IR plan version, the monthly incident export, and incidents closed late with the reason.");
  sources(s, "Sources: Module 3, \"Summary\"; learning path index; Module 4.");
  notes(s,
`To sum up. You recorded Exposure Management as not applicable in a government cloud, and used the interim path instead. You filed the vulnerability and exposure queries, and checked that each exposed device has an owner and a ticket. And you exported the open incidents, and one incident with its alerts, for the record. The evidence an I S S O keeps from this module: the vulnerability query output and the remediation queue; the severity table and the incident response plan's version; the monthly incident export, with alerts, classification and timestamps; and every incident closed outside its window, with the reason. Next is Module 4: hunting, detections as code, and identity and cloud-app signals.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/defender-xdr/03-exposure-and-incidents.md (Defender XDR Engineering and Operations, Module 3); the path's verification log is docs/training/defender-xdr/_verification/learning-path.md.",
  "Defender XDR Engineering & Operations: An Implementation Guide: Steps 5 and 6, \"Requirements and KSIs,\" \"What couldn't be verified\"; its footnotes carry each source, read November 11, 2026. Security Operations and Telemetry, Chapters 06 and 11; Access and Privilege (the Tier 0 inventory).",
  "Microsoft Learn: What is Microsoft Security Exposure Management?; Defender for Endpoint for US Government customers; Microsoft Defender for US Government; DeviceInfo; DeviceTvmSoftwareVulnerabilities; List incidents; security: runHuntingQuery.",
  "NIST SP 800-53 Rev. 5 (RA-5, SI-2, CM-8, IR-4, IR-5, IR-6, AU-6); FedRAMP 20x KSIs, as Security Operations and Telemetry, Chapter 12, maps them.",
  "Lab 2's commands are the page's, with its placeholders; the slides wrap two queries to fit. The path has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
