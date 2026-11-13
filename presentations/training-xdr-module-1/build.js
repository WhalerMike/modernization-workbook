// Defender XDR learning path, Module 1: Architecture, access and onboarding — the module's narrated deck.
// Teaches docs/training/defender-xdr/01-architecture-access-and-onboarding.md, Learn-style: objectives, the concepts
// (components, boundaries and control planes; each government cloud; roles and the read path; onboarding and sensor
// health), Lab 2's exact commands in a test tenant (not run by the authors, as the page says; the path has no Lab 1),
// the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module page and
// the Defender XDR implementation guide it sends the learner to (Steps 1 and 2, the reference architecture, the
// government-cloud table, and their footnotes); the deck adds none.
// Helpers: ./shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-xdr-module-1/build.js \
//                      presentations/training-xdr-module-1/Training_XDR_Module_1.pptx
const P = require("./shared.js")({
  title: "Module 1: Architecture, access and onboarding",
  footer: "Federal Modernization Workbook  ·  Defender XDR learning path, Module 1: Architecture, access and onboarding",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_XDR_Module_1.pptx";
const M = "Training, Defender XDR, Module 1";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 1: Architecture, access and onboarding", "Defender XDR Engineering and Operations · The service, each cloud, the roles, and the sensor everywhere",
    ["Components and control planes  ·  Each government cloud  ·  Roles and the read path", "Onboarding and sensor health  ·  Lab 2 in a test tenant  ·  Evidence"]);
  notes(s,
`Welcome to Module 1 of the learning path Defender X D R Engineering and Operations: architecture, access and onboarding. Before any prevention setting matters, two things have to be true. The right people can see and act on the service, in the tenant's own cloud. And the sensor is on every device it should be. In this module you learn the service's shape and its government-cloud limits, you set who can do what, and you prove the sensor's coverage with a query whose result you can file. The module covers Steps 1 and 2 of the Defender X D R implementation guide. It takes about forty minutes, plus Lab 2 in your own test tenant. The path covers Windows clients and Windows Server only, for a civilian agency in Microsoft three sixty-five G C C, with notes for G C C High and D O D.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: a license is not a defended endpoint");
  tag(s, "Why");
  const l = panel(s, "License", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "WHAT A LICENSE GIVES YOU", null, [
    "The right to run the sensor and the service",
    "Not the sensor on every device, healthy",
    "Not a role model, or a read path in the right cloud",
  ], 13);
  const r = panel(s, "Prove", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "WHAT THIS MODULE PROVES", null, [
    "The right people can see and act, through PIM",
    "The SOC reads incidents in the tenant's own cloud",
    "Every in-scope device is onboarded and Active, or excepted",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaShieldHalved", HEX.red, "The guide's idea: ",
    "the sensor on every device and healthy, settings enforced, and every alert ending in a decision someone can show.");
  sources(s, "Sources: Module 1, \"Introduction\"; Guide, opening statement, \"The track at a glance,\" Steps 1 and 2.");
  notes(s,
`Why start here? The guide opens with one idea. A Defender license is not a defended endpoint. The sensor has to be on every device and healthy, the prevention settings have to be enforced and not just configured, and every alert has to end in a decision someone can show. A license gives you the right to run the sensor and the service. It doesn't put the sensor on every device, it doesn't give anyone the right role, and it doesn't connect the security operations center to the tenant's own cloud. So this module proves three things before anything else is built. The right people can see and act, through roles assigned with privileged identity management. The S O C reads incidents through Microsoft Graph, in the tenant's own cloud. And every in-scope device is onboarded with an active sensor, or is in the exception register with a reason. Gates 1 and 2 come first in the guide, and every later gate depends on them.`,
  `${M} — "Introduction"; guide, opening statement, "The track at a glance," "The path on one page."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Name the components, the two trust boundaries and each setting's control plane",
    "Read the government-cloud table; record a missing feature as a disposition",
    "Describe the unified RBAC roles and why PIM assigns them",
    "Connect to Microsoft Graph in GCC, GCC High or DoD and read incidents",
    "Prove onboarding and sensor health on a device and across the fleet",
  ], [
    "The guide's \"How to read this guide\" and prerequisites",
    "The Privileged Access guide's PIM model: skim it",
    "Lab 2: a test tenant, never production",
  ], 40);
  sources(s, "Sources: Module 1, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. Name Defender X D R's components, its two trust boundaries, and which control plane holds which setting. Read the guide's government-cloud availability table, and record a feature your cloud doesn't have as a disposition, not a failed control. Describe the program's unified role-based access control roles, and why they're assigned through pim. Connect to Microsoft Graph in G C C, G C C High or D O D, and read incidents. And prove onboarding and sensor health, on one device and across the fleet. Before you start, read the guide's How to read this guide section and its prerequisites, and skim the Privileged Access implementation guide's pim model for the eligible roles. Lab 2 runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Components and control planes
{
  const s = content(SC, "Unit 1: two boundaries, one control plane per setting");
  tag(s, "What");
  const tb = table(s, "Planes", 1.45, [3.1, 4.6, 4.45], ["Control plane", "What it holds", "Rule"], [
    ["Intune", "Endpoint security policies: antivirus, firewall, EDR onboarding, Attack Surface Reduction", "Assigned to Entra device groups, never user groups"],
    ["Defender portal", "Automation levels, device groups, attack disruption exclusions, custom detections", "Settings Intune doesn't hold"],
    ["Defender for Servers and Arc", "Windows Server, in Azure, AWS, Google Cloud or Oracle Cloud Infrastructure", "Security settings management from Intune"],
    ["Group Policy", "Wins over Intune by default for the same rule", "Never set one rule in both"],
  ], { fontSize: 12, limit: 4.9 });
  callout(s, "Boundaries", tb + 0.3, 1.0, "FaSitemap", HEX.navy, "Two boundaries: ",
    "the agency's holds the devices, SOC tools and evidence; Microsoft's holds the service, built in Azure US Government for a US Government tenant.");
  sources(s, "Sources: Module 1, Unit 1; Guide, \"Reference architecture\"; Microsoft Learn, Configure ASR rules and exclusions; Microsoft Defender for US Government.");
  notes(s,
`Unit 1 is the shape of the service. Defender X D R joins Defender for Endpoint, Defender for Identity, Defender for Office three sixty-five and Defender for Cloud Apps in one portal and one incident queue. Two trust boundaries matter. The agency's boundary holds the devices, the S O C's tools and the evidence store. Microsoft's holds the service. Microsoft Learn's page on Defender for U S Government says that for a U S Government tenant it's built in the Azure U S Government environment, and G C C, G C C High and D O D each have their own portal. Then the control planes. Learn says Intune is the recommended tool for distributing Defender for Endpoint settings, and that its policies apply to device objects only, so they're assigned to Entra device groups, never user groups. Settings Intune doesn't hold, like automation levels and custom detections, live in the Defender portal. Servers in Azure, A W S, Google Cloud or Oracle Cloud Infrastructure reach Defender through Defender for Servers and Azure Arc, as the Devices and Endpoints book describes. And one rule above all: one control plane per setting, because Group Policy wins over Intune by default.`,
  `${M} — Unit 1 "Components, boundaries and control planes"; guide, "Reference architecture" (trust boundaries, control planes, data flows); Microsoft Learn — "Configure attack surface reduction rules and exclusions," "Microsoft Defender for US Government."`);
}

// ================================================================== 5 Gov clouds
{
  const s = content(SC, "Unit 2: what each government cloud has");
  tag(s, "Who");
  const tb = table(s, "Gov", 1.45, [4.3, 2.75, 2.55, 2.55], ["Feature", "GCC", "GCC High", "DoD"], [
    ["Defender for Endpoint: prevent, detect, investigate, remediate", "Available", "Available", "Available"],
    ["Defender portal", "security.microsoft.com", "security.microsoft.us", "security.apps.mil"],
    ["Graph incidents and hunting", "Worldwide Graph host", "US Government L4", "US Government L5"],
    ["Security Exposure Management", { text: "Not available", options: { color: HEX.red, bold: true } }, { text: "Not available", options: { color: HEX.red, bold: true } }, { text: "Not available", options: { color: HEX.red, bold: true } }],
    ["Graph custom detections; attack disruption; Windows web content filtering", "Not yet specified", "Not yet specified", "Not yet specified"],
  ], { fontSize: 11.5, limit: 4.9 });
  callout(s, "Rule", tb + 0.3, 1.0, "FaScaleBalanced", HEX.teal, "Not yet specified means Learn doesn't say, ",
    "not that it's available. A feature your cloud lacks is recorded as not applicable, never as a failed control.");
  sources(s, "Sources: Module 1, Unit 2; Guide, \"Government-cloud availability by feature\"; Learn, Defender for Endpoint for US Government customers; What is Microsoft Security Exposure Management?");
  notes(s,
`Unit 2 is what each government cloud has, from the guide's availability table, read on Microsoft Learn on November eleventh, 2026. Learn's page on Defender for Endpoint for U S Government customers says prevention, detection, investigation and remediation are available in G C C, G C C High and D O D. Each cloud has its own portal: security dot microsoft dot com for G C C, security dot microsoft dot U S for G C C High, and security dot apps dot mil for D O D. Graph's incident and hunting A P I's are available, with G C C on the worldwide Graph host. Then the gap. Learn's page on Security Exposure Management says it's available in Public Cloud only, not in U S Government clouds, so attack paths and the exposure graph aren't there. And Learn doesn't say whether custom detection rules through Graph, automatic attack disruption, or web content filtering on Windows reach these clouds. The guide's rule: not yet specified means Learn doesn't say, not that it's available. A feature your cloud doesn't offer goes in the decision record and the closure register as not applicable, never as a failed control.`,
  `${M} — Unit 2 "What each government cloud has"; guide, "Government-cloud availability by feature"; Microsoft Learn — "Microsoft Defender for Endpoint for US Government customers," "Microsoft Defender for US Government," "What is Microsoft Security Exposure Management?"`);
}

// ================================================================== 6 Roles and the read path
{
  const s = content(SC, "Unit 3: roles through PIM, then read in the right cloud");
  tag(s, "Who");
  const tb = table(s, "Roles", 1.45, [3.0, 9.15], ["Program role", "Unified RBAC permissions (risk-based recommended)"], [
    ["Read", "Security data basics: analysts and the assessor's read-only account"],
    ["Responder", "Adds Alerts, Response and Basic live response"],
    ["Detection engineer", "Detection tuning (Manage), which the custom detection API accepts"],
    ["Tier 0 analyst only", "Advanced live response"],
  ], { fontSize: 12, limit: 3.6 });
  const c = code(s, "Connect", 0.6, tb + 0.2, 12.15, [
    "# GCC: Global  ·  GCC High: USGov  ·  DoD: USGovDoD",
    "Connect-MgGraph -Environment <graph-environment> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All",
  ], { label: "THE SOC'S READ PATH (GUIDE STEP 1)", pt: 11 });
  line(s, "Order", "Create every role and assignment first, then activate the workloads (at least Security Administrator).", c + 0.15, 0.45, 13);
  sources(s, "Sources: Module 1, Unit 3; Guide, Step 1; Learn, Create custom roles with Defender unified RBAC; Activate Defender unified RBAC; List incidents; security: runHuntingQuery.");
  notes(s,
`Unit 3 is who can do what. Microsoft Learn describes four permission groups in Defender's unified role-based access control: security operations, security posture, authorization and settings, and data operations. The program builds four roles from them; that's its risk-based recommendation. A read role, called Security data basics, for analysts and the assessor's read-only account. A responder role that adds alerts, response and basic live response. A detection engineer role with Detection tuning, manage, which the custom detection A P I accepts. And advanced live response only for Tier zero analysts. Each role is assigned to groups that pim governs, so no one holds it standing. Create every role and assignment before you activate the workloads; Learn says activation needs at least Security Administrator in Entra I D. Then connect the S O C's read path. Learn names Security Incident dot Read dot All as the least-privileged permission to list incidents, and Threat Hunting dot Read dot All to run queries. Connect with the environment of the tenant's cloud: Global for G C C, U S Gov for G C C High, U S Gov D O D for D O D. A session in the wrong cloud returns an empty list, and an empty list looks like a pass.`,
  `${M} — Unit 3 "Roles and the read path"; guide, Step 1 (steps 1 to 3), RACI, "Dangers" (a Graph session in the wrong cloud); Microsoft Learn — "Create custom roles with Microsoft Defender unified RBAC," "Activate Microsoft Defender unified RBAC," "List incidents," "security: runHuntingQuery."`);
}

// ================================================================== 7 Onboarding
{
  const s = content(SC, "Unit 4: onboard by management plane, ring by ring");
  tag(s, "How");
  const p1 = panel(s, "Clients", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "WINDOWS CLIENTS", null, [
    "Intune's EDR policy, ES-004",
    "Package type: Auto from connector",
    "Ring 0, then ring 1, then rings 2 and 3",
  ], 12.5);
  const p2 = panel(s, "Servers", 0.6 + W3 + G3, 1.45, W3, null, HEX.teal, HEX.tealTint, "WINDOWS SERVER", null, [
    "Defender for Servers on Azure Arc",
    "Gov clouds: Server 2019 needs KB4586839 before onboarding",
    "Program standard: 2019 minimum",
  ], 12.5);
  const p3 = panel(s, "Rollback", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.red, HEX.redTint, "ROLLBACK", null, [
    "The offboarding package, as an EDR policy",
    "It expires seven days after download",
    "Never onboarding and offboarding on one device",
  ], 12.5);
  callout(s, "Except", Math.max(p1, p2, p3) + 0.3, 1.0, "FaListCheck", HEX.amber, "A device the sensor can't reach ",
    "goes in the exception register with a compensating control: a proxy, the streamlined connectivity set, or Windows Event Forwarding.");
  sources(s, "Sources: Module 1, Unit 4; Guide, Step 2; Microsoft Learn, Onboard Windows devices by using Intune; Defender for Endpoint for US Government customers.");
  notes(s,
`Unit 4 is onboarding, by management plane. Windows clients onboard through Intune's endpoint detection and response policy, E S oh-oh-four in the Devices and Endpoints book's policy library, with the package type Auto from connector. Assign it to ring zero, then ring one, then rings two and three. Windows Server onboards through Defender for Servers on Azure Arc. Microsoft Learn's government page says Windows Server twenty nineteen needs update K B four five eight six eight three nine before onboarding, so it reaches the right environment. The program's own standard assumes twenty nineteen as the minimum. Rollback is the offboarding package, deployed as an E D R policy. Learn says the package expires seven days after download, and you never deploy onboarding and offboarding to the same device at the same time. A device the sensor can't reach, such as an unsupported system, an isolated network or an appliance, goes in the exception register with a compensating control: the streamlined connectivity set or a proxy, or, where no path exists, Windows Event Forwarding of the Defender operational log, which Learn names for centralizing events without the service.`,
  `${M} — Unit 4 "Onboarding and sensor health"; guide, Step 2 (Prerequisites, Pilot, Enforcement, Rollback, Exclusions); Microsoft Learn — "Onboard Windows devices to Defender for Endpoint by using Intune," "Defender for Endpoint for US Government customers," "Test your ASR rules deployment" (Windows Event Forwarding).`);
}

// ================================================================== 8 Sensor health
{
  const s = content(SC, "Sensor health: Active, or a ticket, or an exception");
  tag(s, "What");
  const tb = table(s, "Health", 1.45, [3.4, 8.75], ["Sensor health state (Learn)", "What the program does"], [
    ["Active", "The pass: the device counts as protected coverage"],
    ["Inactive: no contact, typically 7 days or more", "A ticket for the operator"],
    ["No sensor data", "A ticket for the operator"],
    ["Impaired communications", "A ticket; check the government URL list and the proxy"],
    ["Misconfigured", "A ticket for the operator"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Day2", tb + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "Day two: ",
    "every device not Active for seven days is a ticket; the weekly coverage file is kept twelve months; exceptions are reviewed quarterly.");
  sources(s, "Sources: Module 1, Unit 4; Guide, Step 2 (Telemetry, Evidence, Day-two); Microsoft Learn, Device inventory field reference; DeviceInfo.");
  notes(s,
`How do you know the sensor is healthy? On the device, the sense service is running and the onboarding state in the registry is one. In the service, the device info table carries two columns: onboarding status, and sensor health state. Microsoft Learn's device inventory field reference lists five sensor health values. Active is the pass. Inactive means no contact, typically for seven days or more. Then no sensor data, impaired communications, and misconfigured. Every value but active is a ticket; for impaired communications, start with the government U R L list the firewall has to allow. Intune's E D R onboarding status report shows the same thing from the Intune side. The guide sets the day-two rule: the operator reviews coverage weekly, and every device that hasn't been active for seven days becomes a ticket. The weekly coverage file is kept twelve months. The platform owner reviews the exception register every quarter. And the assessor-ready artifact is coverage by ring, against the inventory the C M eight control asks for.`,
  `${M} — Unit 4; guide, Step 2 (Telemetry; Evidence checklist; Day-two ownership); Microsoft Learn — "Device inventory field reference" (sensor health state values), "DeviceInfo."`);
}
endModule(SC);

// ================================================================== 9 Lab 2 part 1
{
  const s = content(SL, "Lab 2, steps 1 to 3: connect, read, check the sensor");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: on your workstation, in PowerShell 7",
    "Install-Module Microsoft.Graph.Authentication, Microsoft.Graph.Security -Scope CurrentUser",
    "Connect-MgGraph -Environment <graph-environment> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All",
    "New-Item -ItemType Directory -Path <evidence-folder>",
    "# Step 2: read incidents",
    "Get-MgSecurityIncident -Top 5 | Select-Object Id, DisplayName, Severity, Status, CreatedDateTime",
    "# Step 3: on <pilot-device>, in an elevated PowerShell session",
    "sc.exe query sense",
    "Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows Advanced Threat Protection\\Status' -Name OnboardingState",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10.5 });
  const p1 = panel(s, "Pass2", 0.6, c + 0.2, W2, null, HEX.teal, HEX.tealTint, "STEP 2 PASSES WHEN", null, [
    "Up to five incidents, or an empty list in a new tenant, and no permission error",
  ], 12);
  const p2 = panel(s, "Pass3", 0.6 + W2 + G2, c + 0.2, W2, null, HEX.teal, HEX.tealTint, "STEP 3 PASSES WHEN", null, [
    "The SENSE service is running, and OnboardingState is 1",
  ], 12);
  if (Math.max(p1, p2) > 6.61) console.warn("  ! Lab panels may overflow");
  sources(s, "Sources: Module 1, \"Exercise: Lab 2,\" steps 1 to 3; Guide, Validate (G1), Validate (G2).");
  notes(s,
`Lab 2 runs the guide's own validate commands in a test tenant, never production. The authors haven't run them, as the page says, and the path has no Lab 1 on fixtures, because the guide has no kit yet. You need a test tenant licensed for Defender for Endpoint Plan 2, a reader account activated through pim, and a ring zero Windows test device onboarded through Intune. Values you supply are in angle brackets. Step one, on your workstation: install the two Graph modules, connect with the environment for your cloud, and create a folder for this lab's evidence files. Step two reads incidents. As the guide states it, a pass is up to five incidents, or an empty list in a new tenant, with no permission error. An error naming the role means the account lacks one of the reader roles. Step three runs on the test device, in an elevated session: query the sense service, and read the onboarding state from the registry. Microsoft Learn gives the value one for an onboarded device.`,
  `${M} — "Exercise: Lab 2, a test tenant," "You need," steps 1 to 3; guide, Validate (G1), Validate (G2).`);
}

// ================================================================== 10 Lab 2 part 2
{
  const s = content(SL, "Lab 2, steps 4 to 6: coverage, detection test, back out");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 4: file the fleet's coverage (one line of KQL in $q)",
    "$q = 'DeviceInfo | where Timestamp > ago(1d) | summarize arg_max(Timestamp, *) by DeviceId",
    "      | where OSPlatform startswith \"Windows\" | summarize Devices = count() by OnboardingStatus, SensorHealthState'",
    "Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $q } | ConvertTo-Json -Depth 5 |",
    "    Out-File <evidence-folder>/g2-coverage.json",
    "# Step 5: on <pilot-device>, from an elevated Command Prompt, exactly as Learn publishes it",
    "powershell.exe -NoExit -ExecutionPolicy Bypass -WindowStyle Hidden $ErrorActionPreference = 'silentlycontinue';",
    "  (New-Object System.Net.WebClient).DownloadFile('http://127.0.0.1/1.exe', 'C:\\\\test-MDATP-test\\\\invoice.exe');",
    "  Start-Process 'C:\\\\test-MDATP-test\\\\invoice.exe'",
    "# Step 6: back it out",
    "Disconnect-MgGraph",
  ], { label: "LAB 2  ·  WRAPPED TO FIT: EACH COMMAND IS ONE LINE ON THE PAGE", pt: 10.5 });
  callout(s, "Client", c + 0.3, 1.05, "FaTriangleExclamation", HEX.amber, "Pass: every device Active or excepted; an alert in about 10 minutes. ",
    "Learn lists servers, not Windows 10 or 11, for the test: on a client, a missing alert is inconclusive.");
  sources(s, "Sources: Module 1, \"Exercise: Lab 2,\" steps 4 to 6; Guide, Validate (G2), \"What couldn't be verified\"; Microsoft Learn, Run a detection test.");
  notes(s,
`Step four files the fleet's coverage. The query takes the latest record for each Windows device and counts them by onboarding status and sensor health state. It runs through Graph so the result is a file you can keep. On the slide it's wrapped to fit; on the page each command is one line. The guide's pass: every device onboarded with an active sensor, or in the exception register. Learn doesn't list the exact onboarding status strings, so the query groups by them rather than filtering on one. Step five is Microsoft's detection test, on the test device, under its change record, from an elevated Command Prompt, exactly as Learn publishes it. Learn says an alert appears in about ten minutes. One caution the guide records: Learn's page lists Windows Server versions as supported, not Windows ten or eleven, so on a client a missing alert is inconclusive; rely on the coverage query and Module 2's network protection test. Step six backs it out. Nothing changed but the alert the test raised: resolve that incident in the test tenant, and disconnect.`,
  `${M} — "Exercise: Lab 2," steps 4 to 6; guide, Validate (G2), "What couldn't be verified" (the detection test on clients; OnboardingStatus strings); Microsoft Learn — "Run a detection test on a device recently onboarded to Defender for Endpoint."`);
}
endModule(SL);

// ================================================================== 11 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 1");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.9, 3.65], ["Requirement (NIST SP 800-53 Rev. 5; OMB)", "KSI", "Evidence"], [
    ["G1: AC-2 and AC-6, least privilege for security tooling; AU-9 (4)", "KSI-IAM-ELP, KSI-MLA-ALA", "Role export, PIM report"],
    ["G2: CM-8 inventory and SI-4 monitoring; M-22-09's device actions, EDR deployed widely", "KSI-PIY-GIV, KSI-MLA-OSM", "Coverage file, exception register"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. KSIs are FedRAMP 20x indicators for cloud service providers that the agency lines its evidence up with.");
  sources(s, "Sources: Module 1, \"The federal requirement\"; Guide, \"Requirements and KSIs\"; NIST SP 800-53 Rev. 5; OMB M-22-09; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from the guide's requirements table. Gate one supports A C two and A C six from NIST special publication eight hundred fifty-three, revision five: account management and least privilege, here for the security tooling itself. It also supports A U nine, enhancement four, which limits access to audit tools. The evidence is the role export and the pim assignment report. Gate two supports C M eight, the system component inventory, and S I four, system monitoring, along with O M B memorandum M twenty-two oh-nine's device actions, including endpoint detection and response deployed widely, as M twenty-two oh-one describes. The evidence is the coverage file and the exception register. Each row lines up with a fed-ramp twenty X key security indicator, which binds cloud service providers; the agency uses them as a vocabulary for its own evidence. The gates support these controls. The assessor decides whether each is satisfied.`,
  `${M} — "The federal requirement" table; guide, "Requirements and KSIs" (G1, G2).`);
}

// ================================================================== 12 Check
{
  const s = check(SS, "Check yourself: two questions on Module 1", [
    { q: "An Attack Surface Reduction policy in Intune is assigned to a user group. What happens?", options: ["a. It applies to every device the users sign in to", "b. It never applies: Defender for Endpoint management supports device objects only", "c. It applies after the next Group Policy refresh"] },
    { q: "A GCC High SOC connects without -Environment and lists incidents. The list is empty. Most likely?", options: ["a. The tenant has no incidents", "b. The session read the worldwide host; connect with -Environment USGov", "c. The account lacks Security Reader"] },
  ], "1 b: assign to Entra device groups. 2 b: an error would name the role; an empty list is the wrong-cloud danger.");
  sources(s, "Sources: Module 1, \"Knowledge check,\" questions 1 and 3; Units 1 and 3; Guide, \"Reference architecture,\" \"Dangers.\"");
  notes(s,
`Check yourself with two questions. First: an Attack Surface Reduction policy in Intune is assigned to a user group. What happens? The answer is b. It never applies, because Microsoft Learn says Defender for Endpoint management supports device objects only. Assign it to an Entra device group. Second: a G C C High S O C connects to Graph without the environment parameter and lists incidents, and the list is empty. What's the most likely reason? The answer is b. The session read the worldwide host instead of the tenant's own cloud; connect with U S Gov. A missing role would have produced an error naming it. An empty list with no error is exactly the danger the guide warns about. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 3, and "Check your answers."`);
}

// ================================================================== 13 Summary
{
  const s = content(SS, "Summary: the right access, and the sensor everywhere");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Placed each setting in its control plane",
    "Checked what your government cloud offers",
    "Read incidents through Graph in the tenant's own cloud",
    "Proved the sensor on a device and across the fleet",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2", [
    "Prevention and Attack Surface Reduction: audit, warn, block",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the role export and PIM report, the EDR policy export, the weekly coverage file, the detection test with its alert, and the exception register.");
  sources(s, "Sources: Module 1, \"Summary\"; learning path index; Module 2.");
  notes(s,
`To sum up. You placed each setting in its control plane: Intune for endpoint policy, the Defender portal for what Intune doesn't hold, and one plane per setting. You checked what your government cloud offers, and how to record what it doesn't. You read incidents through Microsoft Graph, in the tenant's own cloud. And you proved the sensor, on one device and across the fleet. The evidence an I S S O keeps from this module: the role export and the pim assignment report, the E D R policy export and its assignments, the weekly coverage file, the detection test with the alert it raised, and the exception register for every device not onboarded. Next is Module 2, prevention and Attack Surface Reduction, where the settings move through audit, warn and block, ring by ring.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/defender-xdr/01-architecture-access-and-onboarding.md (Defender XDR Engineering and Operations, Module 1); the path's verification log is docs/training/defender-xdr/_verification/learning-path.md.",
  "Defender XDR Engineering & Operations: An Implementation Guide: \"Reference architecture,\" \"Government-cloud availability by feature,\" Steps 1 and 2, \"Requirements and KSIs,\" \"Dangers,\" \"What couldn't be verified\"; its footnotes carry each source, read November 11, 2026.",
  "Microsoft Learn: Microsoft Defender for US Government; Defender for Endpoint for US Government customers; What is Microsoft Security Exposure Management?; Configure ASR rules and exclusions; Create custom roles with Defender unified RBAC; Activate Defender unified RBAC; List incidents; security: runHuntingQuery; Onboard Windows devices by using Intune; Troubleshoot Defender for Endpoint onboarding; Run a detection test; DeviceInfo; Device inventory field reference.",
  "NIST SP 800-53 Rev. 5 (AC-2, AC-6, AU-9 (4), CM-8, SI-4); OMB M-22-09; FedRAMP 20x KSIs, as Security Operations and Telemetry, Chapter 12, and Devices and Endpoints, Chapter 10, map them.",
  "Lab 2's commands are the page's, with its placeholders; the path has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
