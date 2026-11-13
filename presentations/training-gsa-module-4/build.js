// Global Secure Access learning path, Module 4: Private applications and administrative paths — the module's narrated deck.
// Teaches docs/training/global-secure-access/04-private-apps-and-admin-paths.md, Learn-style: objectives, the concepts
// (Quick Access and per-app access, connectors across clouds including Oracle Cloud Infrastructure, administrative RDP,
// domain controllers), Lab 2's exact commands in a test tenant (not run by the authors, as the page says; the path has no
// Lab 1), the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module
// page and the Global Secure Access implementation guide it sends the learner to (Steps 6 and 10, the comparison, and their
// footnotes); the deck adds none.
// Helpers: ../training-gsa-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-gsa-module-4/build.js \
//                      presentations/training-gsa-module-4/Training_GSA_Module_4.pptx
const P = require("../training-gsa-module-1/shared.js")({
  title: "Module 4: Private applications and administrative paths",
  footer: "Federal Modernization Workbook  ·  Global Secure Access learning path, Module 4: Private applications and administrative paths",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_GSA_Module_4.pptx";
const M = "Training, Global Secure Access, Module 4";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 4: Private apps and administrative paths", "Global Secure Access as the Identity-Aware Network · Steps 6 and 10",
    ["Quick Access and per-app access  ·  Connectors across clouds", "Administrative RDP  ·  Domain controllers  ·  Lab 2 in a test tenant"]);
  notes(s,
`Welcome to Module 4 of Global Secure Access as the Identity-Aware Network: private applications and administrative paths. A V P N gives a user an address on the network and lets the network decide the rest. Private Access gives each application its own path: its own hosts and ports, its own assigned group, its own Conditional Access. This module covers Steps 6 and 10 of the Global Secure Access implementation guide, and takes about fifty minutes, plus a lab in your own test tenant.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: from an address pool to one path per app");
  tag(s, "Why");
  const l = panel(s, "VPN", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "A VPN ADDRESS POOL", null, [
    "A user gets an address on the network",
    "A compromised user or device can move laterally",
    "Discovery and lateral movement across the pool",
  ], 13);
  const r = panel(s, "PA", 0.6 + W2 + G2, 1.45, W2, null, HEX.teal, HEX.tealTint, "ONE PATH PER APPLICATION", null, [
    "Its own hosts, ports and protocol",
    "Its own assigned group, never individuals",
    "Its own Conditional Access, report-only first",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaUserShield", HEX.navy, "Then the paths attackers want most: ",
    "administrative RDP behind phishing-resistant authentication, and domain controllers behind the Private Access sensor.");
  sources(s, "Sources: Module 4, \"Introduction\"; Guide, Steps 6 and 10, Assessment mapping; Network and Transport, Chapter 05.");
  notes(s,
`Why does this matter? A V P N address pool gives a user an address on the network. If that user or device is compromised, the attacker can discover and move laterally across everything the pool reaches. Private Access replaces the pool with one path per application: its own hosts, ports and protocol, its own assigned group, never individuals, and its own Conditional Access, in report-only first. A compromised user or device can reach what it was assigned, and nothing else. Then the module does the same for the paths an attacker wants most: administrative remote desktop, behind phishing-resistant authentication, and domain controllers, behind the Private Access sensor.`,
  `${M} — "Introduction"; guide, Step 6 and Step 10 (assessment mapping callouts); Network and Transport, Chapter 05.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Explain why Quick Access is a bridge that should shrink to nothing",
    "Build a Private Access app: connector group, segments, group, policy",
    "Say where connector groups go, including in AWS, Google Cloud and OCI",
    "Put administrative hosts behind the phishing-resistant strength",
    "Describe the DC sensor's audit-first order and run Learn's klist test",
  ], [
    "Module 2 (Module 3 isn't needed here)",
    "Network and Transport, Chapter 05: Private Access",
    "Lab 2: a test tenant, never production",
  ], 50);
  sources(s, "Sources: Module 4, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll explain why Quick Access is a bridge that should shrink to nothing. You'll build a Private Access application: bound to a connector group, with only the segments it uses, a group assignment, and a Conditional Access policy. You'll say where connector groups go, including for applications in A W S, Google Cloud and Oracle Cloud Infrastructure. You'll put administrative hosts behind the phishing-resistant authentication strength. And you'll describe the domain controller sensor's audit-first order, and run Learn's klist test. You need Module 2; Module 3 isn't needed here, because the compliant network check doesn't apply to Private Access apps. Read Network and Transport, chapter five, on Private Access. The lab runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Quick Access to per-app
{
  const s = content(SC, "Unit 1: Quick Access is the bridge, per-app the goal");
  tag(s, "What");
  const tb = table(s, "Build", 1.45, [3.0, 9.15], ["Learn's Graph tutorial", "What each step does"], [
    ["Create the app", "Instantiate the custom application template; mark it a Private Access app"],
    ["Bind it", "To one connector group"],
    ["Add segments", "Only what it uses: one host, its ports, its protocol"],
    ["Assign a group", "The app's User role; not individuals; nested groups aren't supported"],
    ["Conditional Access", "On the app, report-only first: MFA and a compliant or hybrid-joined device, emergency access excluded"],
  ], { fontSize: 12, limit: 4.9 });
  callout(s, "Rules", tb + 0.25, 1.4, "FaTriangleExclamation", HEX.amber, "Learn's rules: ",
    "segments can't overlap between apps, except a per-app segment overrides Quick Access; clients take up to 15 minutes to pick up a change; no MFA sign-in frequency on Quick Access.");
  sources(s, "Sources: Module 4, Unit 1; Guide, Step 6; Private Access using Microsoft Graph APIs; How to configure per-app access; Conditional Access for Private Access apps.");
  notes(s,
`Unit 1. Network and Transport, chapter five, holds the design: Quick Access as the bridge from the V P N, application discovery to find what's actually used, and then per-app applications, each with its own assignment and policy. Learn's Graph tutorial is the build. Create the app from the custom application template and mark it a Private Access app. Bind it to one connector group. Add only the segments it uses: one host, its ports, its protocol. Assign a group, with the app's User role; not individuals, and nested groups aren't supported. Then put Conditional Access on it, in report-only first, following Learn's example: multifactor authentication and a compliant or hybrid-joined device, with emergency access excluded. Learn's rules: segments may not overlap between apps, except that a per-app segment overrides an overlapping Quick Access segment. Clients take up to fifteen minutes to pick up a change. And Microsoft advises against an M F A sign-in frequency on Quick Access, because D N S queries trigger prompts.`,
  `${M} — Unit 1 "Quick Access, per-app access and connectors"; guide, Step 6.1 to 6.6; Microsoft Learn — "Configure Microsoft Entra Private Access using Microsoft Graph APIs," "How to configure per-app access," "Conditional Access for Private Access apps."`);
}

// ================================================================== 5 Connectors across clouds
{
  const s = content(SC, "Connectors: on premises, and in every cloud network");
  tag(s, "Who");
  const p1 = panel(s, "Conn", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "CONNECTORS", null, [
    "Outbound only; no inbound ports",
    "Windows Server 2019 or later, the program's standard",
    "At least two to a group",
  ], 12.5);
  const p2 = panel(s, "Clouds", 0.6 + W3 + G3, 1.45, W3, null, HEX.teal, HEX.tealTint, "AWS, GOOGLE CLOUD, OCI", null, [
    "Learn: private apps across hybrid and multicloud environments",
    "A connector group in each cloud's network, with line of sight",
  ], 12.5);
  const p3 = panel(s, "Gap", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.amber, HEX.amberTint, "NOT YET SPECIFIED", null, [
    "No connector procedure on Learn for any of the three",
    "The guide doesn't compare those providers' own access services",
  ], 12.5);
  callout(s, "OCI", Math.max(p1, p2, p3) + 0.3, 1.25, "FaCloud", HEX.teal, "The same for all three clouds: ",
    "an application in AWS, Google Cloud or Oracle Cloud Infrastructure is reached as an on-premises one is, through its own connector group in that cloud's network.");
  sources(s, "Sources: Module 4, Unit 1; Guide, A brief comparison, Step 6 How-section, What couldn't be verified; Microsoft Learn, What is Global Secure Access?");
  notes(s,
`Where do connectors go? They're outbound only, with no inbound ports, they run on the program's server standard of Windows Server 2019 or later, and they come at least two to a group, so a patch or an outage doesn't take the applications down. Now the clouds. Learn describes Private Access as reaching private apps across hybrid and multicloud environments, through connectors on Windows Server hosts with line of sight to the application. So an application in A W S, Google Cloud, or Oracle Cloud Infrastructure gets a connector group in that cloud's network, exactly as an on-premises one does. But Learn has no connector procedure specific to any of those three clouds, so the guide marks it not yet specified, and it doesn't compare those providers' own access services.`,
  `${M} — Unit 1 (Where agencies are, across clouds); guide, "A brief comparison with other security service edge offerings," Step 6 How-section (connectors), "What couldn't be verified"; Microsoft Learn — "What is Global Secure Access?"`);
}

// ================================================================== 5b Least privilege and day two
{
  const s = content(SC, "Least privilege, measured: the Quick Access residual");
  tag(s, "What");
  const tb = table(s, "LP", 1.45, [3.0, 9.15], ["", "What the guide asks"], [
    ["Validate", "From off the network: the app's port reachable, a port outside the segment refused; Policy tester shows the rule"],
    ["Report-only", "The app's policy for five business days, read in the sign-in log's report-only results"],
    ["Enforcement", "Policy On; ring groups added; then the VPN route for that app turned off (Module 6)"],
    ["Rollback", "Remove the group's assignment, or the policy back to report-only; the VPN route stays until the wave holds"],
    ["Day two", "The app owner reviews the assignment each quarter; the platform owner keeps two healthy, current connectors"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Metric", tb + 0.25, 1.15, "FaChartLine", HEX.teal, "The metric: ",
    "segments left in Quick Access, and apps without an assignment or a Conditional Access policy. The starting target for both is zero.");
  sources(s, "Sources: Module 4, Unit 1; Guide, Step 6 Validate and How-section, Metrics; Access and Privilege, Chapter 09 (access reviews).");
  notes(s,
`How do you know it's least privilege? The guide's Validate for Step 6: from a pilot device off the corporate network, reach the application on its port, and confirm that a port outside the segment fails; the client's Policy tester shows which rule handles the destination. The app's policy runs in report-only for five business days, read in the sign-in log's report-only results. Enforcement sets the policy on, adds ring groups, and then turns off the V P N route for that application, which Module 6 covers. Rollback removes the group's assignment, or puts the policy back in report-only, and the V P N route stays until the wave holds. On day two, the application owner reviews the assignment each quarter, as an access review, and the platform owner keeps at least two healthy, current connectors per group. The metric is the Quick Access residual: segments left in Quick Access, and apps without an assignment or a policy. The starting target for both is zero.`,
  `${M} — Unit 1; guide, Step 6 Validate, How-section, "Metrics" (Private Access least privilege; connector resilience); Access and Privilege, Chapter 09.`);
}

// ================================================================== 6 Admin RDP
{
  const s = content(SC, "Unit 2: administrative RDP as its own application");
  tag(s, "How");
  const l = panel(s, "Apps", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "SEPARATE FROM USER APPS", null, [
    "One app per tier or host group",
    "Segment: the admin host on 3389",
    "Assigned only to the privileged group PIM activation grants",
  ], 13);
  const r = panel(s, "Strength", 0.6 + W2 + G2, 1.45, W2, null, HEX.red, HEX.redTint, "THE POLICY", null, [
    "Built-in phishing-resistant authentication strength",
    "ID 00000000-0000-0000-0000-000000000004",
    "And a compliant device; report-only first",
  ], 13);
  callout(s, "Enf", Math.max(l, r) + 0.3, 1.25, "FaDoorClosed", HEX.teal, "Enforcement ends the old path: ",
    "policy On, then direct RDP removed from the VPN and from the server firewall, except from connector IPs.");
  sources(s, "Sources: Module 4, Unit 2; Guide, Step 10.1, 10.2 and How-section; Microsoft Learn, Zero Trust: Protect networks; Access and Privilege, Chapter 03.");
  notes(s,
`Unit 2 is administrative remote desktop. Administrative R D P, S S H and S M B are the paths an attacker wants most. Private Access makes each a per-app application with its own assignment and its own Conditional Access, so an administrator authenticates to Entra with a phishing-resistant method before the tunnel opens. Publish administrative hosts as their own applications, separate from user apps: one app per tier or host group, with the host on port thirty-three eighty-nine, assigned only to the privileged group whose pim activation grants it. The policy requires the built-in phishing-resistant authentication strength, whose I D ends in four, and a compliant device, in report-only first. Enforcement ends the old path: the policy goes on, and then direct R D P is removed from the V P N and from the server firewall, except from the connector I P's.`,
  `${M} — Unit 2 "Administrative paths"; guide, Step 10 (opening), 10.1, 10.2, How-section (Enforcement); Microsoft Learn — "Configure Microsoft Entra for Zero Trust: Protect networks."`);
}

// ================================================================== 7 DCs
{
  const s = content(SC, "Unit 3: domain controllers, for as long as they remain");
  tag(s, "How");
  const tb = table(s, "DC", 1.45, [3.2, 8.95], ["Learn's procedure", "What it means"], [
    ["Publish the DCs", "TCP 88, in Quick Access or an app; name the SPNs to protect"],
    ["Open and install", "Inbound TCP 1337 on the DCs; one sensor per DC, silent install, registered with a token"],
    ["Audit first", "The sensor installs in Audit mode; read its event log"],
    ["Application SPNs first", "Protect the DC's own SPN later, to avoid admin lockout; assess NTLM before restricting it"],
    ["Break glass", "From the admin center, or TmpBreakglass set to 1 and the sensor restarted"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Token", tb + 0.25, 1.15, "FaKey", HEX.red, "The registration token is a credential: ",
    "acquire it on a privileged access workstation, use it once, and clear the session.");
  sources(s, "Sources: Module 4, Unit 3; Guide, Step 10.3 and How-section; Private Access for domain controllers.");
  notes(s,
`Unit 3 is domain controllers. The program retires its domain controllers; until then, they're Tier zero. Learn's procedure: publish the D C's on T C P eighty-eight, in Quick Access or an app, and name the service principal names to protect. Open inbound T C P thirteen thirty-seven on the D C's. Install one sensor per D C, silently, and register it with a token. The sensor installs in Audit mode, so you read its event log before anything is enforced. Learn's advice is to test with application S P N's first, and protect the D C's own S P N only later, to avoid admin lockout, and to assess N T L M use before restricting it. The rollback is the sensor's break-glass mode, from the admin center, or a registry value set to one and the sensor restarted. And the registration token is a credential: acquire it on a privileged access workstation, use it once, and clear the session.`,
  `${M} — Unit 3 "Domain controllers, for as long as they remain"; guide, Step 10.3, How-section (Rollback); Microsoft Learn — "Configure Microsoft Entra Private Access for Active Directory domain controllers."`);
}
endModule(SC);

// ================================================================== 8 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 5: one application, one path");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: the connector groups and connectors (the guide's Step 2.1 URIs); <connector-group-id>",
    "# Step 2: create the app from the custom template; mark it a Private Access app",
    "Invoke-MgGraphRequest -Method POST -Uri \".../v1.0/applicationTemplates/8adf8e6e-67b2-4cf2-a259-e3dc5476c621/instantiate\" ...",
    "Invoke-MgGraphRequest -Method PATCH -Uri \".../beta/applications/<app-object-id>\" ... '{\"onPremisesPublishing\":{\"applicationType\":\"nonwebapp\",...}}'",
    "# Step 3: bind it to the connector group; add one segment",
    "... -Body '{\"destinationHost\":\"<app-fqdn>\",\"destinationType\":\"fqdn\",\"port\":0,\"ports\":[\"<app-ports>\"],\"protocol\":\"tcp\"}'",
    "# Step 4: assign the pilot group with the app's User role",
    "# Step 5: NET-PA-<app-name>-Device-MFA, enabledForReportingButNotEnforced: mfa AND compliantDevice",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS  ·  FULL COMMANDS ON THE MODULE PAGE", pt: 10 });
  callout(s, "Need", c + 0.3, 1.15, "FaServer", HEX.navy, "You need: ",
    "a Private Access test license; a test connector group with two connectors on Windows Server 2019 or later; a test app server and admin host; a privileged test group.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 2,\" steps 1 to 5; Guide, Step 6.1 to 6.5.");
  notes(s,
`The lab runs in a test tenant, never production, and the authors haven't run it. You need Module 2's lab done, a Private Access test license, a test connector group with two connectors on Windows Server 2019 or later, a test application server and a test administrative host reachable from the connectors, and a privileged test group whose members have phishing-resistant methods registered. Step one lists the connector groups and connectors; the guide's resilience metric wants at least two active connectors in the group. Step two creates the application from the custom template and marks it a Private Access app. Step three binds it to the connector group and adds one segment: the application's host name, its ports, and T C P. Step four assigns the pilot group with the app's User role. And step five puts the device and M F A policy on it, in report-only.`,
  `${M} — "Exercise: Lab 2, a test tenant," "You need," steps 1 to 5; guide, Step 6.1 to 6.5.`);
}

// ================================================================== 9 Lab part 2
{
  const s = content(SL, "Lab 2, steps 6 to 12: admin path, profile, tests");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 6: PA-AdminRDP, the same way: <admin-host-fqdn> on 3389-3389, assigned only to <admin-group-id>",
    "# Step 7: NET-PA-AdminRDP-PhishingResistant, report-only: compliantDevice + strength 00000000-...-000000000004;",
    "#         then enable the private forwarding profile and assign the groups in the admin center",
    "# Step 8, on the pilot device off the corporate network",
    "Test-NetConnection -ComputerName <app-fqdn> -Port <app-port>",
    "Test-NetConnection -ComputerName <app-fqdn> -Port <other-port>",
    "# Steps 9 to 11: private sessions in the workspace; RDP as a privileged user; the NET-PA- report-only results",
    "# Step 12 (optional, a test domain with the sensor), in Command Prompt",
    "klist purge",
    "klist get cifs/<server-fqdn>",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.15, "FaClipboardCheck", HEX.teal, "Expect: ",
    "the app's port reachable and a port outside the segment refused; klist issued with sensor and client off, SMB blocked with only the sensor on, issued after the prompt with both on.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 2,\" steps 6 to 12; Guide, Step 6.6 and Validate, Step 10.1, 10.2 and Validate.");
  notes(s,
`Step six publishes the administrative host the same way, on thirty-three eighty-nine, assigned only to the privileged group. Step seven creates the phishing-resistant policy in report-only, then enables the private forwarding profile and assigns the groups. Step eight tests the path from the pilot device off the corporate network, about fifteen minutes after the last change: the application's port should be reachable, and a port outside the segment should fail. The client's Policy tester shows which rule handles the destination. Step nine reads the private sessions in the workspace. Step ten connects with remote desktop as a privileged user, and the sign-in log shows the policy's report-only result. Step eleven reads both policies' report-only results; leave them in report-only. And step twelve is optional, where a test domain has the sensor: Learn's klist test. With client and sensor off, the ticket is issued. With the sensor on and the client off, S M B is blocked. With both on, the ticket is issued after the Conditional Access prompt.`,
  `${M} — "Exercise: Lab 2," steps 6 to 12; guide, Step 6.6, Step 6 Validate, Step 10.1, 10.2, Step 10 Validate.`);
}
endModule(SL);

// ================================================================== 10 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 4");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.7, 3.2, 4.25], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["AC-3, AC-6, AC-17, AC-17(3): each app reachable only by its group, on its ports, under Conditional Access", "KSI-IAM-ELP, KSI-CNA-ULN, KSI-CNA-MAT", "App, segment, assignment and policy exports; port tests; Quick Access residual"],
    ["IA-2(1), IA-2(2), AC-6(9), AC-17: admin paths need phishing-resistant auth and a compliant device", "KSI-IAM-APM, KSI-IAM-ELP, KSI-MLA-LET", "App and policy exports, sensor mode, klist record, break-glass rehearsal"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.15, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. The program's mapping lines Step 6 up with OMB M-22-09's application access without a VPN, and Step 10 with its phishing-resistant MFA.");
  sources(s, "Sources: Module 4, \"The federal requirement\"; Guide, Federal requirements and KSIs, by step; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; OMB M-22-09.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five. Private applications support A C three, A C six, A C seventeen, and its enhancement three: each application reachable only by its assigned group, on its ports, under Conditional Access. The evidence is the app, segment, assignment and policy exports, the reachable and unreachable port tests, and the Quick Access residual list. Administrative paths support I A two enhancements one and two, A C six enhancement nine, and A C seventeen: phishing-resistant authentication and a compliant device. The evidence is the app and policy exports, the sensor mode, the klist test record, and the break-glass rehearsal. The program's mapping lines Step 6 up with O M B memo M twenty-two oh nine's application access without a V P N, and tick three point oh's Remote User Pattern one, and Step 10 with the memo's phishing-resistant M F A. The evidence supports the controls; the assessor decides.`,
  `${M} — "The federal requirement" table; guide, "Federal requirements and KSIs, by step" (Steps 6 and 10).`);
}

// ================================================================== 11 Check
{
  const s = check(SS, "Check yourself: two questions on Module 4", [
    { q: "An application runs in Oracle Cloud Infrastructure. How does the guide reach it?", options: ["a. Through a connector group in that cloud's network, with line of sight, as for an on-premises app", "b. It can't; Private Access reaches only on-premises applications", "c. Through Oracle's own access service, which the guide compares in full"] },
    { q: "In what order does Learn protect SPNs with the domain controller sensor?", options: ["a. The DC's own SPN first, because it matters most", "b. Application SPNs first, the DC's own SPN later, to avoid admin lockout", "c. All SPNs at once, in Enforce mode"] },
  ], "1 a: a connector group in that cloud's network. 2 b: application SPNs first.");
  sources(s, "Sources: Module 4, \"Knowledge check,\" questions 3 and 5; Units 1 and 3; Guide, A brief comparison, Step 10.3.");
  notes(s,
`Check yourself with two questions. First: an application runs in Oracle Cloud Infrastructure. How does the guide reach it? The answer is a: through a connector group in that cloud's network, with line of sight to the application, as for an on-premises one. Second: in what order does Learn protect service principal names with the domain controller sensor? The answer is b: application S P N's first, the D C's own S P N later, to avoid admin lockout. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 3 and 5, and "Check your answers."`);
}

// ================================================================== 12 Summary
{
  const s = content(SS, "Summary: one path per app, admin paths locked");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Published an application with only its segments, group and policy",
    "Published an admin host behind the phishing-resistant strength",
    "Tested reachable and refused ports, and read the sessions",
    "Ran Learn's klist test where a sensor exists",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 5", [
    "Internet Access and TLS inspection, last in the run order",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "app, segment, assignment and policy exports; the port tests and Policy tester result; the private sessions; the admin sign-in; the klist record; the Quick Access residual.");
  sources(s, "Sources: Module 4, \"Summary\"; learning path index; Module 5.");
  notes(s,
`To sum up. You published one application and one administrative host as their own Private Access apps, each with only its segments, its own group, and a report-only policy. You tested the reachable and refused ports, read the private sessions and the policies' results, and, where a sensor exists, ran Learn's klist test. The evidence an I S S O keeps from this module: the app, segment, assignment and policy exports; the port test record and the Policy tester result; the private session query; the administrative sign-in record; the klist record; and the Quick Access residual list, which should shrink to nothing. Next is Module 5, Internet Access and T L S inspection, which come last in the run order.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/global-secure-access/04-private-apps-and-admin-paths.md (Global Secure Access as the Identity-Aware Network, Module 4); the path's verification log is docs/training/global-secure-access/_verification/learning-path.md.",
  "Global Secure Access & Zero Trust Network Engineering: An Implementation Guide: Steps 6 and 10, A brief comparison, What couldn't be verified, Federal requirements and KSIs, by step; its footnotes carry each source, read November 11, 2026.",
  "Microsoft Learn: Configure Microsoft Entra Private Access using Microsoft Graph APIs; How to configure per-app access; Conditional Access for Private Access apps; What is Global Secure Access?; Configure Microsoft Entra for Zero Trust: Protect networks; Private Access for domain controllers.",
  "Network and Transport, Chapter 05; Access and Privilege, Chapters 03 and 04. NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; OMB M-22-09.",
  "Lab 2's commands are the module page's, abbreviated on the slides, with the guide's placeholders; the path has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
