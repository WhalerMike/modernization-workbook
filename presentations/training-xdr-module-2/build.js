// Defender XDR learning path, Module 2: Prevention and Attack Surface Reduction — the module's narrated deck.
// Teaches docs/training/defender-xdr/02-prevention-and-attack-surface-reduction.md, Learn-style: objectives, the
// concepts (prevention through audit; rings and backout triggers; Attack Surface Reduction through audit, warn and
// block; exclusions and the server report), Lab 2's exact commands in a test tenant (not run by the authors, as the page
// says; the path has no Lab 1), the federal requirement and evidence, a two-question check, and the summary. Every fact
// comes from the module page and the Defender XDR implementation guide it sends the learner to (Steps 3 and 4, "Dangers",
// and their footnotes); the deck adds none.
// Helpers: ../training-xdr-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-xdr-module-2/build.js \
//                      presentations/training-xdr-module-2/Training_XDR_Module_2.pptx
const P = require("../training-xdr-module-1/shared.js")({
  title: "Module 2: Prevention and Attack Surface Reduction",
  footer: "Federal Modernization Workbook  ·  Defender XDR learning path, Module 2: Prevention and Attack Surface Reduction",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_XDR_Module_2.pptx";
const M = "Training, Defender XDR, Module 2";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 2: Prevention and Attack Surface Reduction", "Defender XDR Engineering and Operations · Audit before block, ring by ring, proved on the device",
    ["Prevention through audit  ·  Rings and backout triggers  ·  Audit, warn, block", "Exclusions  ·  The server report  ·  Lab 2 in a test tenant  ·  Evidence"]);
  notes(s,
`Welcome to Module 2 of Defender X D R Engineering and Operations: prevention and Attack Surface Reduction. A setting in a policy protects nothing until it's enforced on the device, and enforcing it all at once breaks the applications nobody listed. In this module you learn the order of the prevention settings, which of them have an audit mode, how Attack Surface Reduction moves through audit, warn and block, ring by ring, and how to prove each setting on the device rather than trusting a report. The module covers Steps 3 and 4 of the Defender X D R implementation guide. It takes about fifty minutes, plus Lab 2 in your own test tenant.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: configured is not enforced");
  tag(s, "Why");
  const l = panel(s, "Configured", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "CONFIGURED", null, [
    "A setting in an Intune policy",
    "Audit mode logs; it protects nothing",
    "A server can report compliant without enforcing",
  ], 13);
  const r = panel(s, "Enforced", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "ENFORCED", null, [
    "Block mode on the ring, with exit criteria met",
    "Proved on the device and in the events",
    "Exclusions recorded with owner and expiry",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaShieldHalved", HEX.red, "The closure map's endpoint hardening row: ",
    "prevention baselines and Attack Surface Reduction by staged rings, evidenced by policy and endpoint telemetry.");
  sources(s, "Sources: Module 2, \"Introduction\"; Guide, \"The track at a glance\" (control states), Steps 3 and 4, \"Requirements and KSIs.\"");
  notes(s,
`Why does this module matter? The guide separates configured from enforced. Configured is a setting in an Intune policy. Audit mode is configured, and it logs, but it protects nothing. And on Windows Server, Microsoft lists a known issue where an Attack Surface Reduction rule reports compliant without being enforced. Enforced is block mode on the ring, after the ring's exit criteria are met, proved on the device and in the events, with every exclusion recorded with an owner and an expiry. Getting there safely is the work of this module: audit first, then enforce ring by ring, with a way back. The guide counts Gates 3 and 4 as the closure map's endpoint hardening row: prevention baselines and Attack Surface Reduction by staged rings, evidenced by policy and endpoint telemetry.`,
  `${M} — "Introduction"; guide, "The track at a glance" (control states: Configured, Enforced), Steps 3 and 4, "Requirements and KSIs" (closure map rows).`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 2", [
    "Name the prevention settings that have an audit mode and those that don't",
    "Move network protection and controlled folder access from audit to block",
    "Run every rule through audit and warn into block; name the two that skip warn",
    "Record per-rule exclusions, and prefer an exclusion to a step back",
    "Verify each setting on the device and read the fleet's events",
  ], [
    "Module 1: the ring's devices onboarded",
    "Devices and Endpoints, ES-001, ES-003, ES-005: skim them",
    "Lab 2: a test tenant, never production",
  ], 50);
  sources(s, "Sources: Module 2, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. Name the prevention settings that have an audit mode, and the ones that don't. Move network protection and controlled folder access from audit to block, ring by ring, with exit criteria and backout triggers. Run every Attack Surface Reduction rule through audit and warn into block, and name the two rules that skip warn. Record per-rule exclusions, and prefer an exclusion to a step back. And verify each setting on the device, and read the fleet's audit and block events. You need Module 1, so the ring's devices are onboarded. Skim the Devices and Endpoints book's policies E S oh-oh-one for antivirus, E S oh-oh-three for the firewall, and E S oh-oh-five for Attack Surface Reduction: the setting values live there, not in the guide. Lab 2 runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Audit modes
{
  const s = content(SC, "Unit 1: which prevention settings have an audit mode");
  tag(s, "What");
  const tb = table(s, "Modes", 1.45, [3.4, 3.0, 5.75], ["Setting", "Audit mode?", "What audit does, or how it's staged"], [
    ["Network protection", "Yes, value 2", "Logs connections it would block (event 1125); block is 1 (event 1126)"],
    ["Controlled folder access", "Yes, value 2", "Logs untrusted writes to protected folders (1124); block is 1 (1123)"],
    ["Antivirus, firewall, tamper protection", { text: "No", options: { color: HEX.red, bold: true } }, "Straight to ring 1, with backout triggers set before the change"],
  ], { fontSize: 12, limit: 3.9 });
  const p1 = panel(s, "NP", 0.6, tb + 0.25, W2, null, HEX.navy, HEX.navyTint, "NETWORK PROTECTION NEEDS", null, [
    "Defender Antivirus active; behavior monitoring; cloud protection",
    "Server 2019+: AllowNetworkProtectionOnWinServer",
  ], 12);
  const p2 = panel(s, "UDP", 0.6 + W2 + G2, tb + 0.25, W2, null, HEX.amber, HEX.amberTint, "HIGH-UDP SERVER ROLES", null, [
    "Domain controllers, DNS, file, SQL Server:",
    "AllowDatagramProcessingOnWinServer set to false",
  ], 12);
  if (Math.max(p1, p2) > 6.61) console.warn("  ! Modes panels may overflow");
  sources(s, "Sources: Module 2, Unit 1; Guide, Step 3; Microsoft Learn, Configure network protection; Evaluate network protection; Configure controlled folder access.");
  notes(s,
`Unit 1 is prevention through audit. Antivirus, firewall and tamper protection carry the values from the Devices and Endpoints book's policy library, and they have no audit mode. They go straight to ring one, with backout triggers set before the change. Two settings do have an audit mode, value two. Microsoft Learn says network protection in audit logs the connections it would block, as event eleven twenty-five, and in block mode, value one, the block is event eleven twenty-six. Controlled folder access in audit logs untrusted writes to protected folders, event eleven twenty-four, and blocks them in block mode as event eleven twenty-three. Network protection has prerequisites: Defender Antivirus in active mode, behavior monitoring, and cloud protection with working connectivity. On Windows Server twenty nineteen and later, it also needs the setting that allows network protection on Windows Server. And on servers with heavy U D P traffic, such as domain controllers, D N S, file and sequel servers, Learn says to set datagram processing to false.`,
  `${M} — Unit 1 "Prevention through audit"; guide, Step 3 (Prerequisites, Report-only or audit phase, Telemetry); Microsoft Learn — "Configure network protection," "Evaluate network protection," "Configure controlled folder access," "Monitor controlled folder access."`);
}

// ================================================================== 5 Rings
{
  const s = content(SC, "Enforce ring by ring, with backout triggers");
  tag(s, "How");
  const tb = table(s, "Rings", 1.45, [1.1, 2.6, 8.45], ["Ring", "Scope", "Exit criteria (risk-based recommended)"], [
    ["0", "Implementing team", "Audit events reviewed; test site blocked; no help-desk call"],
    ["1", "Pilot group", "Two weeks; every audited line-of-business block has an allow entry or a decision"],
    ["2", "Early adopters", "One week; \"Defender block\" help-desk calls under the threshold set before the change"],
    ["3", "Everyone in scope", "Post-change validation passes on a sample per site"],
  ], { fontSize: 12, limit: 4.3 });
  callout(s, "Backout", tb + 0.3, 1.05, "FaTriangleExclamation", HEX.red, "Backout triggers: ",
    "a blocked critical application with no allow path, or help-desk volume over the threshold. Rollback: back to audit in the same Intune policy.");
  sources(s, "Sources: Module 2, Unit 1; Guide, Step 3 (Pilot, Enforcement, Change safety, Rollback); Microsoft Learn, Configure tamper protection.");
  notes(s,
`Then enforcement. The pilot runs on rings zero and one for at least two weeks, with network protection and controlled folder access in audit; that length is the program's risk-based recommendation. Read the audit events every week and add allowed applications for controlled folder access before you enforce. Then turn each setting to block in the Intune policy, ring by ring. Ring zero, the implementing team, exits when the audit events are reviewed, the test site is blocked and no one has called the help desk. Ring one, the pilot group, after two weeks, when every audited line-of-business block has an allow entry or a decision. Ring two, early adopters, after one week, with help-desk calls tagged Defender block under the threshold set before the change. Ring three, everyone in scope, when post-change validation passes on a sample at each site. The backout triggers are a blocked critical application with no allow path, or help-desk volume over the threshold. Rollback sets the mode back to audit in the same policy. Microsoft Learn says tamper protection is turned off only from the console that set it.`,
  `${M} — Unit 1; guide, Step 3 (Pilot, Enforcement, change safety table and triggers, Rollback); Microsoft Learn — "Configure tamper protection."`);
}

// ================================================================== 6 ASR stages
{
  const s = content(SC, "Unit 2: Attack Surface Reduction, audit, warn, block");
  tag(s, "How");
  const tb = table(s, "ASR", 1.45, [2.2, 2.6, 7.35], ["Ring", "Mode", "Exit criteria (risk-based recommended)"], [
    ["1", "Audit (2), 30 days", "Every audited rule hit has an exclusion, a fix or a decision"],
    ["1, then 2", "Warn (6), 14 days", "Unblock requests counted; none for a business-critical app left without a per-rule exclusion"],
    ["1, 2, then 3", "Block (1)", "Blocks per rule per week stable; help-desk volume under the threshold"],
  ], { fontSize: 12, limit: 3.9 });
  const p1 = panel(s, "Before", 0.6, tb + 0.25, W2, null, HEX.navy, HEX.navyTint, "BEFORE AUDIT (LEARN)", null, [
    "Turn off any related rule already in block or warn",
    "Then every rule in audit at once on ring 1",
  ], 12);
  const p2 = panel(s, "Microsoft", 0.6 + W2 + G2, tb + 0.25, W2, null, HEX.teal, HEX.tealTint, "MICROSOFT'S OWN POSITION", null, [
    "Standard protection rules can go to block without extensive testing",
    "The program runs all three stages anyway",
  ], 12);
  if (Math.max(p1, p2) > 6.61) console.warn("  ! ASR panels may overflow");
  sources(s, "Sources: Module 2, Unit 2; Guide, Step 4; Microsoft Learn, Test your ASR rules deployment; ASR rules overview; Configure ASR rules and exclusions.");
  notes(s,
`Unit 2 is Attack Surface Reduction. Microsoft Learn's rule modes are zero for off, one for block, two for audit, five for not configured, and six for warn. Before you audit, Learn says to turn off any related rule that's already in block or warn. Then put every rule in audit at once on ring one, which Learn recommends, to see which rules everyday business triggers. The program's stages are risk-based recommendations. Audit on ring one for thirty days, until every audited rule hit has an exclusion, a fix or a decision. Then warn, first on ring one and then on ring two, for fourteen days, counting unblock requests, until no business-critical application is left without a per-rule exclusion. Then block, ring by ring, until blocks per rule per week are stable and help-desk volume is under the threshold. Microsoft's own position, from its rules overview, is that the standard protection rules can go to block without extensive testing, and other rules are tested in audit first. The program runs all three stages anyway, and says so.`,
  `${M} — Unit 2 "Attack Surface Reduction, audit, warn, block"; guide, Step 4 (Pilot, Report-only or audit phase, Enforcement, the ring table); Microsoft Learn — "Test your ASR rules deployment," "ASR rules overview," "Configure ASR rules and exclusions."`);
}

// ================================================================== 7 Warn
{
  const s = content(SC, "Warn is friction, not a safety valve");
  tag(s, "Who");
  const p1 = panel(s, "Needs", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "WARN NEEDS", null, [
    "Windows 10 1809 or later",
    "Platform 4.18.2008.9, engine 1.1.17400.5",
    "Not in Configuration Manager; older Windows treats warn as block",
  ], 12);
  const p2 = panel(s, "Unblock", 0.6 + W3 + G3, 1.45, W3, null, HEX.amber, HEX.amberTint, "UNBLOCK", null, [
    "Since platform 4.18.26060, needs administrator approval",
    "Brief the help desk before the warn ring",
    "A persistent need becomes a per-rule exclusion",
  ], 12);
  const p3 = panel(s, "NoWarn", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.red, HEX.redTint, "NO WARN: AUDIT TO BLOCK", null, [
    "Block credential stealing from the Windows local security authority subsystem",
    "Block Office applications from injecting code into other processes",
  ], 12);
  callout(s, "Help", Math.max(p1, p2, p3) + 0.3, 1.0, "FaUsersGear", HEX.teal, "The RACI: ",
    "the help desk is responsible for warn-mode unblock requests and user impact; the policy owner is accountable for the rings.");
  sources(s, "Sources: Module 2, Unit 2; Guide, Step 4 (Prerequisites, Enforcement), RACI, \"Dangers\"; Microsoft Learn, ASR rules overview.");
  notes(s,
`Warn shows the user the block, with a way to proceed. Microsoft Learn's rules overview says warn needs Windows ten, version eighteen oh nine or later, and a recent Defender Antivirus platform and engine. It isn't available in Configuration Manager, and on older Windows a rule set to warn acts as block. Warn isn't a safety valve, though. Since platform four point eighteen point two six oh six oh, using Unblock on a warn rule needs administrator approval, and Microsoft says a persistent need belongs in a per-rule exclusion, not repeated unblocks. So brief the help desk before the warn ring; the guide's RACI makes the help desk responsible for unblock requests and user impact, and the policy owner accountable for the rings. Two rules don't support warn at all, and go from audit straight to block. One blocks credential stealing from the Windows local security authority subsystem. The other blocks Office applications from injecting code into other processes.`,
  `${M} — Unit 2; guide, Step 4 (Prerequisites; the warn note under Enforcement), RACI, "Dangers" (warn treated as a safety valve); Microsoft Learn — "ASR rules overview" (modes; warn requirements; Unblock approval from 4.18.26060; rules without warn).`);
}

// ================================================================== 8 Exclusions and servers
{
  const s = content(SC, "Unit 3: exclusions, one plane, and the server report");
  tag(s, "What");
  const tb = table(s, "Dangers", 1.45, [3.6, 8.55], ["Danger", "Mitigation"], [
    ["A rule turned off for one app", "A per-rule exclusion: ASR only per rule exclusions, a file path over a folder, owner and expiry"],
    ["Intune and Group Policy both set a rule", "One control plane per setting: Group Policy wins by default and Intune silently loses"],
    ["Disable Local Admin Merge is true", "Local per-rule exclusions don't apply: put the exclusion in the policy"],
    ["A server shows compliant", "Known issue, no fix date: check Get-MpPreference and the events on the server"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Prefer", tb + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "Microsoft's advice: ",
    "an exclusion is better than turning a rule off or back to audit. Rollback moves a rule one stage back: block to warn, warn to audit.");
  sources(s, "Sources: Module 2, Unit 3; Guide, Step 4 (Rollback, Exclusions, Telemetry), \"Dangers\"; Microsoft Learn, Configure ASR rules and exclusions; Test your ASR rules deployment.");
  notes(s,
`Unit 3 is exclusions, and the traps. When a rule in block breaks an application, Microsoft's advice in Learn is that an exclusion is better than turning the rule off or back to audit. Per-rule exclusions go in the same policy, under A S R only per rule exclusions, as a file path rather than a folder wherever you can, and each one goes in the register with an owner and an expiry. Learn adds that if Disable Local Admin Merge is true, local per-rule exclusions don't apply. Rollback, when you need it, moves a rule one stage back: block to warn, or warn to audit. Then the dangers. Configure a rule in Intune or in Group Policy, never both: Learn says Group Policy wins by default, so the Intune value silently loses. And on Windows Server, Learn lists a known issue, with no fix date, where a rule shows compliant without being enforced. So on servers, trust the device-side check and the events, not the compliance report.`,
  `${M} — Unit 3 "Exclusions, and what the server report doesn't prove"; guide, Step 4 (Rollback, Exclusions, Telemetry), "Dangers"; Microsoft Learn — "Configure ASR rules and exclusions," "Test your ASR rules deployment."`);
}
endModule(SC);

// ================================================================== 9 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 5: check every setting on the device");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# On <pilot-device>, in an elevated PowerShell session",
    "# Step 1: tamper and real-time protection (True means enabled)",
    "Get-MpComputerStatus | Select-Object IsTamperProtected, RealTimeProtectionEnabled",
    "# Step 2: network protection and controlled folder access modes (0 off, 1 block, 2 audit)",
    "Get-MpPreference | Select-Object EnableNetworkProtection, AllowNetworkProtectionOnWinServer,",
    "    AllowDatagramProcessingOnWinServer, EnableControlledFolderAccess",
    "# Step 3: firewall profiles as enforced",
    "Get-NetFirewallProfile -PolicyStore ActiveStore | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction",
    "# Step 4: in a browser other than Edge, open https://smartscreentestratings2.net",
    "# Step 5: each Attack Surface Reduction rule and its mode (Learn's command)",
    "$p = Get-MpPreference;0..([math]::Min($p.AttackSurfaceReductionRules_Ids.Count,$p.AttackSurfaceReductionRules_Actions.Count)-1) |",
    "  % {[pscustomobject]@{Id=$p.AttackSurfaceReductionRules_Ids[$_];Action=$p.AttackSurfaceReductionRules_Actions[$_]}} | Format-Table -AutoSize",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10 });
  line(s, "Expect", "Expected: both True; modes match the ring's stage; the test site blocked (1126) or audited (1125); each rule at 2, 6 or 1.", c + 0.15, 0.5, 13);
  sources(s, "Sources: Module 2, \"Exercise: Lab 2,\" steps 1 to 5; Guide, Validate (G3), Validate (G4).");
  notes(s,
`Lab 2 runs the guide's validate commands on a ring zero test device, in a test tenant, never production. The authors haven't run them, as the page says. You need Module 1's test tenant and test device, with the antivirus, firewall and Attack Surface Reduction policies assigned to its ring zero group. Steps one to five run on the device, in an elevated session. Step one shows tamper and real-time protection; both should be true, which means enabled. Step two shows the network protection and controlled folder access modes: zero off, one block, two audit, matching the ring's stage. Step three shows the firewall profiles as enforced, with the values the firewall policy sets. Step four is Microsoft Learn's network protection test: in a browser other than Edge, open the test site on the slide. In block mode the connection is blocked with a notification, event eleven twenty-six; in audit it isn't blocked, and the event is eleven twenty-five. Step five is Learn's command that lists each rule and its mode: two for audit, six for warn, one for block. On a server, this is the check to trust.`,
  `${M} — "Exercise: Lab 2, a test tenant," "You need," steps 1 to 5; guide, Validate (G3), Validate (G4).`);
}

// ================================================================== 10 Lab part 2
{
  const s = content(SL, "Lab 2, steps 6 to 9: the fleet's events, one step back");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 6: on your workstation: prevention events, last 7 days (the KQL is one line on the page)",
    "Connect-MgGraph -Environment <graph-environment> -Scopes ThreatHunting.Read.All",
    "$q = 'DeviceEvents | where Timestamp > ago(7d) | where ActionType in (\"ExploitGuardNetworkProtectionAudited\", ...)",
    "      | summarize Events = count(), Devices = dcount(DeviceId) by ActionType'",
    "Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $q } | ConvertTo-Json -Depth 5 | Out-File <evidence-folder>/g3-prevention-events.json",
    "# Step 7: ASR events by rule, last 30 days (Learn's query), to g4-asr-events.json",
    "$q = 'DeviceEvents | where Timestamp > ago(30d) | where ActionType startswith \"Asr\" | summarize EventCount=count() by ActionType'",
    "# Step 8: detail for one rule (Learn's pattern for the Office child-process rule), to g4-asr-officechild.json",
    "# Step 9: on <pilot-device>: step one rule back (Intune overwrites it at the next refresh)",
    "Add-MpPreference -AttackSurfaceReductionRules_Ids <rule GUID> -AttackSurfaceReductionRules_Actions AuditMode",
  ], { label: "LAB 2  ·  SHORTENED TO FIT: THE PAGE HAS EVERY COMMAND IN FULL", pt: 10 });
  callout(s, "Expect", c + 0.3, 1.05, "FaChartLine", HEX.teal, "Expected: ",
    "a count per action type, with step 4's test among them; each rule's audited and blocked types named separately; rule at 2 after step 9.");
  sources(s, "Sources: Module 2, \"Exercise: Lab 2,\" steps 6 to 9; Guide, Validate (G3), Validate (G4), Step 4 (Rollback); Microsoft Learn, Monitor ASR rule activity.");
  notes(s,
`Steps six to eight run on your workstation, through Graph, so each result is a file. The slide shortens them to fit; the page has every command in full. Step six connects and counts the fleet's prevention events over seven days: network protection audited and blocked, controlled folder access audited and blocked, and tampering attempts. Step four's test should appear among them. Step seven is Microsoft Learn's query for Attack Surface Reduction events by rule over thirty days. Each rule has its own audited and blocked action types, and Learn says the events are throttled to unique processes each hour. Step eight is Learn's pattern for one rule's detail, here the Office child-process rule: the devices, files and command lines it audited or blocked, which is what an exclusion decision reads. Step nine is the only write. It's the guide's rollback for a single device under investigation: Learn's local command sets one rule back to audit. Step five's command now shows the rule at two. Intune overwrites the local value at the next policy refresh, and that's the back-out; nothing else is needed.`,
  `${M} — "Exercise: Lab 2," steps 6 to 9; guide, Validate (G3), Validate (G4), Step 4 (Rollback, Telemetry); Microsoft Learn — "Monitor ASR rule activity," "Configure ASR rules and exclusions."`);
}
endModule(SL);

// ================================================================== 11 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 2");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.9, 3.65], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["G3: SI-3 malicious code protection, SC-7 host firewall, CM-6 settings, SI-7 tamper protection", "KSI-SVC-ACM, KSI-CNA-EIS, KSI-MLA-EVC", "Policy exports, device checks, audit results"],
    ["G4: CM-7 least functionality, CM-6, SI-3", "KSI-SVC-ACM, KSI-MLA-EVC", "Rule-by-ring matrix, per-rule tests"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. KSIs are FedRAMP 20x indicators for cloud service providers that the agency lines its evidence up with.");
  sources(s, "Sources: Module 2, \"The federal requirement\"; Guide, \"Requirements and KSIs\"; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from the guide's requirements table. Gate three supports four controls from NIST special publication eight hundred fifty-three, revision five: S I three, malicious code protection; S C seven, boundary protection, here the host firewall; C M six, configuration settings; and S I seven, integrity, here tamper protection. The evidence is the policy exports, the device checks and the audit results. Gate four supports C M seven, least functionality, with C M six and S I three. The evidence is the rule-by-ring matrix, with the date each rule entered block, and the per-rule tests. Each row lines up with fed-ramp twenty X key security indicators, which bind cloud service providers; the agency lines its own evidence up with them. The gates support these controls, and the assessor decides whether each is satisfied.`,
  `${M} — "The federal requirement" table; guide, "Requirements and KSIs" (G3, G4).`);
}

// ================================================================== 12 Check
{
  const s = check(SS, "Check yourself: two questions on Module 2", [
    { q: "Which two Attack Surface Reduction rules go from audit straight to block?", options: ["a. The LSASS credential-stealing rule and the Office code-injection rule: they don't support warn", "b. The two Office child-process rules", "c. None; every rule supports warn"] },
    { q: "A Windows Server shows an Attack Surface Reduction rule as compliant in Intune. Is that enough evidence?", options: ["a. Yes", "b. No: a known issue shows Server OS compliant without enforcement; check on the server", "c. Only if Group Policy also sets the rule"] },
  ], "1 a: no warn for those two. 2 b: trust Get-MpPreference and the events on the server, not the report.");
  sources(s, "Sources: Module 2, \"Knowledge check,\" questions 2 and 4; Units 2 and 3; Guide, Step 4, \"Dangers.\"");
  notes(s,
`Check yourself with two questions. First: which two Attack Surface Reduction rules go from audit straight to block? The answer is a: the rule that blocks credential stealing from the local security authority, and the rule that blocks Office applications from injecting code into other processes, because neither supports warn. Second: a Windows Server shows a rule as compliant in Intune. Is that enough evidence? The answer is b, no. Microsoft lists a known issue where the server shows compliant without the rule being enforced, so check on the server itself, with Get M P Preference and the events. Setting the rule in Group Policy too would only add the other danger. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 2 and 4, and "Check your answers."`);
}

// ================================================================== 13 Summary
{
  const s = content(SS, "Summary: audit first, block by ring, prove on device");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Checked every prevention setting on a test device",
    "Triggered the network protection test",
    "Filed the fleet's audit, block and rule events",
    "Stepped one rule back the way the rollback does",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 3", [
    "Exposure and incidents: owners for vulnerabilities, a table for incidents",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "policy exports per ring, weekly audit and block results, the tests, the rule-by-ring matrix with block dates, and every exclusion with approver and expiry.");
  sources(s, "Sources: Module 2, \"Summary\"; learning path index; Module 3.");
  notes(s,
`To sum up. You checked every prevention setting and every rule on a test device. You triggered Microsoft Learn's network protection test. You filed the fleet's audit and block events, and its Attack Surface Reduction events by rule. And you stepped one rule back on one device, the way the guide's rollback does. The evidence an I S S O keeps from this module: the antivirus, firewall and Attack Surface Reduction policy exports for each ring; the weekly audit and block query results; the network protection test and the tamper status; the per-rule tests; the rule-by-ring matrix, with the date each rule entered block; and every exclusion, with its approver and expiry. Next is Module 3, exposure and incidents, where every vulnerability gets an owner and every incident gets triaged to a table.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 2 deck", [
  "Module page: docs/training/defender-xdr/02-prevention-and-attack-surface-reduction.md (Defender XDR Engineering and Operations, Module 2); the path's verification log is docs/training/defender-xdr/_verification/learning-path.md.",
  "Defender XDR Engineering & Operations: An Implementation Guide: Steps 3 and 4, RACI, \"Requirements and KSIs,\" \"Dangers\"; its footnotes carry each source, read November 11, 2026. Devices and Endpoints, Chapter 08, policies ES-001, ES-003, ES-005 (the setting values).",
  "Microsoft Learn: Configure network protection; Evaluate network protection; Use network protection; Configure controlled folder access; Monitor controlled folder access; Configure tamper protection; Tamper protection overview; ASR rules overview; ASR rules reference; Configure ASR rules and exclusions; Test your ASR rules deployment; Monitor ASR rule activity; Get-NetFirewallProfile.",
  "NIST SP 800-53 Rev. 5 (SI-3, SC-7, CM-6, SI-7, CM-7); FedRAMP 20x KSIs, as Security Operations and Telemetry, Chapter 12, and Devices and Endpoints, Chapter 10, map them.",
  "Lab 2's commands are the page's, with its placeholders; the slides shorten two queries to fit. The path has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
