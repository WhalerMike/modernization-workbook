// Global Secure Access learning path, Module 2: The client and Microsoft traffic — the module's narrated deck.
// Teaches docs/training/global-secure-access/02-the-client-and-microsoft-traffic.md, Learn-style: objectives, the concepts
// (the client's reach, packaging and hardening, the Microsoft traffic profile and source IP restoration), Lab 2's exact
// commands in a test tenant (not run by the authors, as the page says; the path has no Lab 1), the federal requirement
// and evidence, a two-question check, and the summary. Every fact comes from the module page and the Global Secure Access
// implementation guide it sends the learner to (Steps 3 and 4, Metrics, and their footnotes); the deck adds none.
// Helpers: ../training-gsa-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-gsa-module-2/build.js \
//                      presentations/training-gsa-module-2/Training_GSA_Module_2.pptx
const P = require("../training-gsa-module-1/shared.js")({
  title: "Module 2: The client and Microsoft traffic",
  footer: "Federal Modernization Workbook  ·  Global Secure Access learning path, Module 2: The client and Microsoft traffic",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_GSA_Module_2.pptx";
const M = "Training, Global Secure Access, Module 2";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 2: The client and Microsoft traffic", "Global Secure Access as the Identity-Aware Network · Steps 3 and 4",
    ["The client's reach  ·  Package, harden, upgrade  ·  Client coverage", "The Microsoft traffic profile  ·  Source IP restoration  ·  Lab 2 in a test tenant"]);
  notes(s,
`Welcome to Module 2 of Global Secure Access as the Identity-Aware Network: the client and Microsoft traffic. Everything after this module depends on two things: a client on every managed Windows device, and the Microsoft traffic profile carrying that device's Microsoft three sixty-five and Entra I D traffic. This module covers Steps 3 and 4 of the Global Secure Access implementation guide. It takes about forty-five minutes, plus a lab in your own test tenant.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: the client and the profile carry everything after");
  tag(s, "Why");
  const l = panel(s, "Client", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "THE CLIENT", null, [
    "On every managed Windows device, deployed by Intune",
    "Opens a tunnel to the service edge after Entra sign-in",
    "Its coverage is the first metric every later step leans on",
  ], 13);
  const r = panel(s, "Profile", 0.6 + W2 + G2, 1.45, W2, null, HEX.teal, HEX.tealTint, "THE MICROSOFT TRAFFIC PROFILE", null, [
    "Makes the real source address visible to Entra ID",
    "The prerequisite for the compliant network check",
    "And for universal tenant restrictions, in Module 3",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaRoute", HEX.navy, "This module: ",
    "package the client the way Learn does, scope the profile to a pilot group, turn on source IP restoration, and measure what the service carries.");
  sources(s, "Sources: Module 2, \"Introduction\"; Guide, Steps 3 and 4; Microsoft Learn, Install the Global Secure Access client for Windows.");
  notes(s,
`Why does this matter? The client goes on every managed Windows device, deployed by Intune, and opens a tunnel to the service edge after the user signs in to Entra. How many devices actually carry it is the first metric every later step leans on. The Microsoft traffic profile is what makes the real source address visible to Entra I D, and it is the prerequisite for the compliant network check and universal tenant restrictions, which come in Module 3. So in this module you package the client the way Learn does, scope the profile to a pilot group, turn on source I P restoration, and measure how much of the pilot's traffic the service actually carries.`,
  `${M} — "Introduction"; guide, Step 3, Step 4 (prerequisite for source IP restoration, compliant network and universal tenant restrictions).`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 2", [
    "Name the client's platforms, prerequisites and what it doesn't support",
    "Package the client as a Win32 app with Learn's commands and detection rule",
    "Explain why DNS over HTTPS goes off and why hardening waits for ring 2",
    "Enable the Microsoft traffic profile for a pilot, with source IP restoration",
    "Compute client coverage and the share of sign-ins through the service",
  ], [
    "Module 1, with the telemetry on",
    "Devices and Endpoints, Chapter 04: skim the Win32 app model",
    "Lab 2: a test tenant, never production",
  ], 45);
  sources(s, "Sources: Module 2, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll name the client's platforms and prerequisites, and the configurations it doesn't support. You'll package it as a Win32 app with Learn's install command, return codes and detection rule. You'll explain why D N S over H T T P S is turned off in browsers, and why the hardening remediation waits for ring two. You'll enable the Microsoft traffic profile for a pilot group, with source I P restoration. And you'll compute client coverage, and the share of sign-ins the service carries. You need Module 1, with the telemetry on, and a skim of Devices and Endpoints, chapter four, for the Win32 app model. The lab runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Client's reach
{
  const s = content(SC, "Unit 1: where the client runs, and where it can't");
  tag(s, "Who");
  const tb = table(s, "Reach", 1.45, [3.1, 9.05], ["", "What Learn says"], [
    ["Runs on", "Windows 10 LTSC 2021 or later, Windows 11, Windows 11 on Arm (separate installer); AVD single-session and Windows 365"],
    ["Not on", "AVD multi-session; a machine hosting virtual machines with a Hyper-V external switch"],
    ["Device state", "Joined, hybrid joined or registered in the tenant; registered devices carry only Private Access"],
    ["Doesn't support", "IPv6 tunneling (IPv4 only), secure DNS, DNS over TCP from browsers' resolvers, Group Policy NRPT rules"],
    ["Government cloud", "Available in GCC"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "Exc", tb + 0.3, 0.95, "FaClipboardCheck", HEX.amber, "Exceptions: ",
    "hosts the client can't run on go on the exception list, each with an owner and a review date.");
  sources(s, "Sources: Module 2, Unit 1; Guide, Step 3 (Applies; prerequisites); Microsoft Learn, Install the Global Secure Access client for Windows; Known limitations for Global Secure Access.");
  notes(s,
`Unit 1 is where the client runs. Learn's client page: Windows ten L T S C 2021 or later, Windows eleven, and Windows eleven on Arm, which has a separate installer; Azure Virtual Desktop single-session and Windows three sixty-five, but not A V D multi-session. It can't be installed on a machine that hosts virtual machines with a Hyper-V external switch. The device must be joined, hybrid joined or registered in the tenant, and registered devices carry only Private Access. The client tunnels I P version four only, and it doesn't support secure D N S, D N S over T C P from browsers' built-in resolvers, or Group Policy N R P T rules. Like the rest of the service, it's available in G C C. Hosts it can't run on go on the exception list, each with an owner and a review date.`,
  `${M} — Unit 1 "Where agencies are: the client's reach"; guide, Step 3 (Applies; Learn's prerequisites); How-section (Exclusions); Microsoft Learn — "Install the Global Secure Access client for Windows," "Known limitations."`);
}

// ================================================================== 5 Package
{
  const s = content(SC, "Unit 2: package the client the way Learn does");
  tag(s, "How");
  const tb = table(s, "App", 1.45, [3.1, 9.05], ["Win32 app setting", "Learn's value"], [
    ["Install command", "powershell.exe -ExecutionPolicy Bypass -File Install-GSAClient.ps1"],
    ["Uninstall command", "\"GlobalSecureAccessClient.exe\" /uninstall /quiet /norestart"],
    ["Install behavior", "System"],
    ["Return codes", "0 success, 3010 soft reboot, 1618 retry"],
    ["Detection rule", "File: C:\\Program Files\\Global Secure Access Client\\TrayApp\\GlobalSecureAccessClient.exe, String (version) at least the packaged version"],
    ["Assignment", "Required, to the pilot group, with the restart grace period"],
  ], { fontSize: 11.5, limit: 5.2 });
  callout(s, "Script", tb + 0.3, 1.0, "FaLaptop", HEX.navy, "Learn's install script ",
    "sets IPv4 preferred, runs the installer quietly, and returns 3010 when a restart is needed; the Win32 Content Prep Tool wraps both.");
  sources(s, "Sources: Module 2, Unit 2; Guide, Step 3.1 and 3.2; Microsoft Learn, Install the Global Secure Access client for Windows (Intune packaging).");
  notes(s,
`Unit 2 packages the client. Download it from the Global Secure Access admin center, put it beside Learn's installation script, and wrap both with the Win32 Content Prep Tool. Learn's script sets I P version four preferred, runs the installer quietly, and returns thirty ten when a restart is needed. Then create the Win32 app in Intune with Learn's values. The install command runs the script through PowerShell. The uninstall command runs the client with uninstall, quiet and no-restart switches. Install behavior is System. The return codes are zero for success, thirty ten for a soft reboot, and sixteen eighteen for retry. The detection rule is the client's file, by version, at least the packaged version. And the assignment is Required, to the pilot group, with the restart grace period enabled.`,
  `${M} — Unit 2 "Package, harden, upgrade"; guide, Step 3.1, 3.2; Microsoft Learn — "Install the Global Secure Access client for Windows."`);
}

// ================================================================== 6 Harden
{
  const s = content(SC, "Unit 2, continued: DNS, hardening and upgrades");
  tag(s, "How");
  const p1 = panel(s, "DoH", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "DNS OVER HTTPS: OFF", null, [
    "The client doesn't support secure DNS",
    "Intune settings catalog: Control the mode of DNS-over-HTTPS, Disabled",
    "In Edge and Chrome",
  ], 12.5);
  const p2 = panel(s, "Harden", 0.6 + W3 + G3, 1.45, W3, null, HEX.amber, HEX.amberTint, "HARDENING: FROM RING 2", null, [
    "Hide Disable and Sign out; restrict non-privileged users",
    "Learn: let users run unrestricted first",
    "Confirm nobody needs to disable it",
  ], 12.5);
  const p3 = panel(s, "Upgrade", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.teal, HEX.tealTint, "UPGRADES: IN RINGS", null, [
    "A new app for each version",
    "Assign small, then widen",
    "Delete the old app last; rollback re-assigns it",
  ], 12.5);
  callout(s, "QUIC", Math.max(p1, p2, p3) + 0.3, 1.0, "FaTriangleExclamation", HEX.red, "Don't disable QUIC in browsers for this: ",
    "the guide handles QUIC in Step 5, which Module 5 teaches.");
  sources(s, "Sources: Module 2, Unit 2; Guide, Step 3.3 to 3.5; Microsoft Learn, Install the Global Secure Access client for Windows (DNS over HTTPS; client settings; updates).");
  notes(s,
`Three more client decisions. First, D N S over H T T P S. The client doesn't support secure D N S, so an Intune settings catalog profile sets Control the mode of D N S over H T T P S to Disabled, in Edge and Chrome, assigned to the same group. Second, hardening. Learn's remediation scripts can hide the disable and sign-out buttons and restrict non-privileged users. Learn's advice is to let users run unrestricted first and confirm nobody needs to disable the client, for a website or a parallel V P N, before restricting. So the guide deploys the remediation from ring two, not in the pilot. Third, upgrades, in rings: a new app for each new version, assigned to a small group, widened, and the old app deleted last. Rolling back re-assigns the previous app. And don't disable QUIC in browsers for this; Step 5 handles QUIC, in Module 5.`,
  `${M} — Unit 2; guide, Step 3.3, 3.4, 3.5; Microsoft Learn — "Install the Global Secure Access client for Windows."`);
}

// ================================================================== 7 Microsoft traffic profile
{
  const s = content(SC, "Unit 3: the Microsoft traffic profile and source IP");
  tag(s, "How");
  const p1 = panel(s, "Only", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "ONLY THIS PROFILE", null, [
    "Acquires Microsoft 365 and Entra ID traffic",
    "Never the Internet Access profile",
  ], 12.5);
  const p2 = panel(s, "Assign", 0.6 + W3 + G3, 1.45, W3, null, HEX.teal, HEX.tealTint, "ENABLE AND ASSIGN", null, [
    "Enable it with Learn's Graph request",
    "Assign the pilot group in the portal; no Graph request on the pages read",
  ], 12.5);
  const p3 = panel(s, "Signal", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.amber, HEX.amberTint, "SIGNALING", null, [
    "Carries source IP restoration",
    "On by default only after June 2025: set it explicitly",
  ], 12.5);
  callout(s, "Caution", Math.max(p1, p2, p3) + 0.3, 1.25, "FaTriangleExclamation", HEX.red, "Learn's caution: ",
    "once Conditional Access depends on IP locations or the compliant network, turning signaling off can block users. Policies come out of enforcement first.");
  sources(s, "Sources: Module 2, Unit 3; Guide, Step 4; Tutorial: Enable the Microsoft traffic profile; Source IP restoration; forwardingProfile resource type.");
  notes(s,
`Unit 3 is the Microsoft traffic profile. It acquires Microsoft three sixty-five and Entra I D traffic, and only this profile can; the Internet Access profile never does. Enable it with Learn's Graph request, filtered on the m three sixty-five traffic type. Then assign the pilot group in the admin center, under traffic forwarding; the pages the guide read give no Graph request for the assignment, so it's a portal step. Then set signaling. Signaling carries source I P restoration, so Entra sees the user's real address. It's on by default only for tenants that onboarded after June 2025, so the guide sets it explicitly and records the state. It's also the setting the compliant network check needs. And Learn's caution: once Conditional Access policies depend on I P locations or the compliant network, turning signaling off can block users, so those policies come out of enforcement first.`,
  `${M} — Unit 3; guide, Step 4.1 to 4.3; Microsoft Learn — "Tutorial: Enable the Microsoft traffic profile," "Source IP restoration," "forwardingProfile resource type."`);
}

// ================================================================== 8 Measure
{
  const s = content(SC, "No report-only mode: the pilot is the audit phase");
  tag(s, "What");
  const tb = table(s, "Measure", 1.45, [3.2, 5.6, 3.35], ["Measure", "How", "Starting target"], [
    ["Client coverage", "Device usage summary activeDeviceCount ÷ Intune's in-scope Windows devices", "98% after ring 3"],
    ["Sign-ins through the service", "SigninLogs: ThroughGSA ÷ Total, for in-scope users", "95%"],
    ["Source IP restoration", "Learn's test: a SharePoint sign-in shows the same IP, client on or off", "Same IP"],
  ], { fontSize: 12, limit: 4.4 });
  callout(s, "Pilot", tb + 0.3, 1.25, "FaRoute", HEX.teal, "The audit phase: ",
    "the profile has no report-only mode, so the pilot group is read through the sign-in query for five business days. Rollback: remove the ring's group from the assignment.");
  sources(s, "Sources: Module 2, Unit 3; Guide, Steps 3 and 4 (Validate, How-section), Metrics; Microsoft Learn, deployment guide for Microsoft Traffic.");
  notes(s,
`How do you know it works? The Microsoft traffic profile has no report-only mode, so the pilot group is the audit phase, read through the sign-in query for five business days. Three measures. Client coverage: the device usage summary's active device count, divided by Intune's count of in-scope Windows devices; the guide's starting target is ninety-eight percent after ring three. Sign-ins through the service: the share of sign-ins marked as through Global Secure Access, for in-scope users; the starting target is ninety-five percent. And source I P restoration, by Learn's deployment guide test: a SharePoint sign-in shows the same I P address with the client running and with it disabled. The rollback is simple: remove the ring's group from the profile's assignment.`,
  `${M} — Unit 3; guide, Step 3 Validate, Step 4 Validate and How-section, "Metrics"; Microsoft Learn — "Microsoft Global Secure Access deployment guide for Microsoft Traffic."`);
}
endModule(SC);

// ================================================================== 9 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 5: package, check and count");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1, in Command Prompt: package the client",
    "IntuneWinAppUtil.exe -c C:\\Packages\\GSA -s Install-GSAClient.ps1 -o C:\\Packages\\Out -q",
    "# Steps 2 and 3, in Intune: the Win32 app with Learn's values; DNS over HTTPS Disabled; no hardening yet",
    "# Step 4, on the pilot device as an administrator",
    "(Get-Item \"C:\\Program Files\\Global Secure Access Client\\TrayApp\\GlobalSecureAccessClient.exe\").VersionInfo.FileVersion",
    "Get-ItemProperty \"HKLM:\\SOFTWARE\\Microsoft\\Global Secure Access Client\" | Select-Object HideSignOutButton, ...",
    "Get-ItemProperty \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip6\\Parameters\" -Name DisabledComponents",
    "# Step 5: the devices the service sees (beta; Global Secure Access Log Reader is enough)",
    "Connect-MgGraph -Environment Global -Scopes \"NetworkAccessPolicy.Read.All\"",
    "Invoke-MgGraphRequest -Method GET -Uri (\".../beta/networkAccess/reports/getDeviceUsageSummary(startDateTime=...)\")",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS  ·  FULL COMMANDS ON THE MODULE PAGE", pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "Expect: ",
    "the packaged version or later; DisabledComponents 0x20, IPv4 preferred; no hardening values yet; the tray reads Connected.");
  sources(s, "Sources: Module 2, \"Exercise: Lab 2,\" steps 1 to 5; Guide, Step 3.1 to 3.3 and Validate.");
  notes(s,
`The lab runs in a test tenant, never production, and the authors haven't run it. You need Module 1's lab done, one Windows eleven test device joined to Entra I D, enrolled in Intune and in the pilot group, the client and Learn's script, and the Win32 Content Prep Tool. Step one packages the client in Command Prompt. Steps two and three are in Intune: the Win32 app with Learn's values, and the D N S over H T T P S profile; no hardening yet. Step four checks the pilot device: the file version should be the packaged version or later, Disabled Components should read hex twenty, I P version four preferred, and the four hardening values aren't set yet. Open the client's health check, keep the export, and the tray must read Connected. Step five asks Graph for the device usage summary, which is the numerator of client coverage.`,
  `${M} — "Exercise: Lab 2, a test tenant," "You need," steps 1 to 5; guide, Step 3 Validate.`);
}

// ================================================================== 10 Lab part 2
{
  const s = content(SL, "Lab 2, steps 6 to 9: profile, signaling, source IP");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 6: find and enable the Microsoft traffic profile; Module 6 rolls it back",
    "$p = Invoke-MgGraphRequest -Method GET -Uri \"https://graph.microsoft.com/beta/networkAccess/forwardingProfiles?`$filter=trafficForwardingType eq 'm365'\"",
    "Invoke-MgGraphRequest -Method PATCH -Uri \".../beta/networkAccess/forwardingProfiles/<profile-id>\" -Body '{\"state\":\"enabled\"}' ...",
    "# Step 7, in the admin center: Traffic forwarding > Microsoft traffic profile > User and group assignments",
    "# Step 8: turn on signaling and record it",
    "Invoke-MgGraphRequest -Method PATCH -Uri \".../beta/networkAccess/settings/conditionalAccess\" -Body '{\"signalingStatus\":\"enabled\"}' ...",
    "# Step 9: Learn's SharePoint test, client on and off; then in the workspace's Logs",
    "SigninLogs | where TimeGenerated > ago(7d)",
    "| summarize Total = count(), ThroughGSA = countif(tostring(IsThroughGlobalSecureAccess) =~ \"true\") by bin(TimeGenerated, 1d)",
    "| extend PctThroughGSA = round(100.0 * ThroughGSA / Total, 1)",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "Expect: ",
    "signalingStatus enabled; the same IP in both SharePoint sign-ins; PctThroughGSA, the share the service carried. Keep both on for Module 3.");
  sources(s, "Sources: Module 2, \"Exercise: Lab 2,\" steps 6 to 9; Guide, Step 4.1 to 4.3 and Validate.");
  notes(s,
`Step six finds the Microsoft traffic profile with Learn's filtered request and enables it. This writes to the test tenant, and Module 6 rolls it back. Step seven assigns the pilot group in the admin center, as an Application Administrator. Step eight turns on signaling and records the setting to a file; signaling status should read enabled. Step nine is the validation. On the pilot device, sign in to SharePoint with the client running, then disable the client from the tray and sign in again in a new browser session. With source I P restoration, the two sign-ins show the same I P address. Re-enable the client. Then, in the workspace, run the guide's sign-in query: P C T through G S A is the share of sign-ins the service carried. Run Module 1's freshness query again too. Keep the profile and signaling on; Module 3 needs them.`,
  `${M} — "Exercise: Lab 2," steps 6 to 9; guide, Step 4.1, 4.2, 4.3, Validate.`);
}
endModule(SL);

// ================================================================== 11 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 2");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.0, 2.9, 4.25], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["CM-6, CM-7, SI-4: managed devices carry the client and can't silently turn it off", "KSI-MLA-EVC, KSI-CNA-RNT", "App assignment and detection rule, remediation results, device usage summary"],
    ["AC-17, AU-3, SI-4: Microsoft traffic acquired, sign-ins carry the real source IP", "KSI-IAM-ELP, KSI-MLA-OSM", "Profile export and assignments, signaling GET, sign-in query result"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. The program's mapping also lines Step 4 up with TIC 3.0 Remote User Pattern 2, to a sanctioned cloud provider.");
  sources(s, "Sources: Module 2, \"The federal requirement\"; Guide, Federal requirements and KSIs, by step; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; TIC 3.0 Remote User Use Case v2.2.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five. The client supports C M six, C M seven and S I four: managed devices carry the client and can't silently turn it off. The evidence is the Intune app's assignment and detection rule, the remediation results, and the device usage summary. The Microsoft traffic profile supports A C seventeen, A U three and S I four: Microsoft three sixty-five and Entra traffic acquired, and sign-ins carrying the real source I P. The evidence is the profile export and its assignments, the signaling GET, and the sign-in query result. Each row lines up with fed-ramp twenty X indicators, and the program's mapping lines Step 4 up with tick three point oh's Remote User Pattern two. The evidence supports the controls; the assessor decides.`,
  `${M} — "The federal requirement" table; guide, "Federal requirements and KSIs, by step" (Steps 3 and 4), "TIC 3.0 alignment."`);
}

// ================================================================== 12 Check
{
  const s = check(SS, "Check yourself: two questions on Module 2", [
    { q: "When does the guide deploy the remediation that hides Disable and restricts non-privileged users?", options: ["a. In the pilot, so nobody can turn the client off", "b. From ring 2, after confirming nobody in the pilot needs to disable it, as Learn advises", "c. Never; Learn advises against it"] },
    { q: "Which profile can acquire Microsoft 365 and Entra ID traffic?", options: ["a. Only the Microsoft traffic profile", "b. The Internet Access profile, if Microsoft destinations are added", "c. Either, whichever is enabled first"] },
  ], "1 b: unrestricted first, hardened from ring 2. 2 a: only the Microsoft traffic profile.");
  sources(s, "Sources: Module 2, \"Knowledge check,\" questions 2 and 3; Units 2 and 3; Guide, Step 3.4, Step 4.");
  notes(s,
`Check yourself with two questions. First: when does the guide deploy the remediation that hides the disable button and restricts non-privileged users? The answer is b: from ring two, after confirming nobody in the pilot needs to disable the client, as Learn advises. Second: which profile can acquire Microsoft three sixty-five and Entra I D traffic? The answer is a: only the Microsoft traffic profile. The Internet Access profile never acquires it. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 2 and 3, and "Check your answers."`);
}

// ================================================================== 13 Summary
{
  const s = content(SS, "Summary: a client counted, a profile measured");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Packaged the client with Learn's values",
    "Checked it on a pilot device and counted devices",
    "Enabled the Microsoft traffic profile for the pilot",
    "Turned on signaling and proved source IP restoration",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 3", [
    "The compliant network and tenant restrictions, report-only first",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the app's assignment and detection rule, the health check, the device usage summary, the profile export, the signaling GET, the source IP test and the sign-in share.");
  sources(s, "Sources: Module 2, \"Summary\"; learning path index; Module 3.");
  notes(s,
`To sum up. You packaged the client with Learn's values, checked it on a pilot device, counted the devices the service sees, enabled the Microsoft traffic profile for the pilot, turned on signaling, and proved source I P restoration. The evidence an I S S O keeps from this module: the Intune app's assignment export and detection rule, the client health check export, the device usage summary with the coverage ratio, the profile export and its assignments, the signaling GET, the source I P comparison, and the sign-in share. Next is Module 3, the compliant network and tenant restrictions, the two signals only Entra can produce from the network, run in report-only or a pilot before they block anyone.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 2 deck", [
  "Module page: docs/training/global-secure-access/02-the-client-and-microsoft-traffic.md (Global Secure Access as the Identity-Aware Network, Module 2); the path's verification log is docs/training/global-secure-access/_verification/learning-path.md.",
  "Global Secure Access & Zero Trust Network Engineering: An Implementation Guide: Steps 3 and 4, Metrics, Federal requirements and KSIs, by step; its footnotes carry each source, read November 11, 2026.",
  "Microsoft Learn: Install the Global Secure Access client for Windows; Known limitations for Global Secure Access; Tutorial: Enable the Microsoft traffic profile; Source IP restoration; forwardingProfile resource type (beta); reports: getDeviceUsageSummary (beta); Microsoft Global Secure Access deployment guide for Microsoft Traffic.",
  "CISA, TIC 3.0 Remote User Use Case v2.2. NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.",
  "Lab 2's commands are the module page's, abbreviated on the slides, with the guide's placeholders; the path has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
