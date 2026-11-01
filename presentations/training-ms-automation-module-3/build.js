// Microsoft Automation learning path, Module 3: Intune through Microsoft Graph — the module's narrated deck.
// Teaches docs/training/ms-automation-intune.md, Learn-style: objectives, the concepts, a "Try it" slide with the real
// Lab 1 commands and output (run November 1, 2026 in examples/ms-automation), government-cloud differences, the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page or the kit;
// the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-ms-automation-module-3/build.js \
//                      presentations/training-ms-automation-module-3/Training_MS_Automation_Module_3.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 3: Intune through Microsoft Graph",
  footer: "Federal Modernization Workbook  ·  Microsoft Automation learning path, Module 3: Intune through Microsoft Graph",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_MS_Automation_Module_3.pptx";
const M = "Training, Microsoft Automation, Module 3";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SA = "Where agencies are";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 3: Intune through Microsoft Graph", "Microsoft Automation learning path · Reading and evidencing Intune, for federal tenants",
    ["Managed devices  ·  Compliance  ·  v1.0 versus beta  ·  Remote actions and exports", "The five checks  ·  Try it: Lab 1  ·  Where agencies are  ·  Evidence"]);
  notes(s,
`Welcome to Module 3 of the Microsoft Automation learning path: Intune through Microsoft Graph. Book 05 moves the fleet from Group Policy to Intune, and then has to prove, continuously, what each device is. In this module you'll map Book 05's evidence questions to the Graph API that answers each one, its least-privileged permission, and whether it's in version one point oh or only in beta. Then you'll run five read-only checks, in Python and PowerShell, against a fictional fleet. They complement the validation kit's Intune checks by reading Intune's own records. Like Module 2's checks, they're illustrative: tested against fixtures, not proven against live tenants.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why compliance records decide device access");
  tag(s, "Why");
  const l = panel(s, "Chain", 0.6, 1.45, 6.3, null, HEX.red, HEX.redTint, "THE CHAIN", "Access rests on a record", [
    "Conditional Access requires a compliant device",
    "Compliance is only as good as Intune's records",
    "By default, a device with no compliance policy counts as Compliant",
    "Microsoft recommends Not compliant, and a policy for every device",
  ], 14);
  const r = panel(s, "Ask", 7.15, 1.45, 5.6, null, HEX.navy, HEX.navyTint, "BOOK 05, CHAPTER 10 ASKS", null, [
    "Which devices fail which policy?",
    "Which devices does no policy reach?",
    "Which stopped checking in?",
    "Which aren't encrypted, or are below the OS floor?",
    "Which Autopilot registrations won't get a profile?",
  ], 14);
  callout(s, "Kit", Math.max(l, r) + 0.3, 0.9, "FaLaptop", HEX.teal, "Not a repeat of VK-INT-01 to 06: ",
    "those read Entra device objects, group tags and assignment design; these checks read Intune's own records.");
  sources(s, "Sources: Module 3, Unit 1 \"Introduction\"; Unit 3 (tenant-wide compliance settings): Learn, Intune reports (Oct. 30, 2026). Book 05, Ch 10.");
  notes(s,
`Why does this matter? Your Conditional Access policies already require a compliant device. That's only as good as Intune's compliance records, and by default, a device with no compliance policy assigned counts as compliant. Microsoft recommends changing that to not compliant, and targeting every device with a policy. Book 05's Chapter 10 asks for evidence a script can collect: which devices fail which policy, which devices no policy reaches, which stopped checking in, which aren't encrypted or are below the OS floor, and which Autopilot registrations won't get a profile. The validation kit already has six Intune checks, reading Entra device objects, group tags and assignment design. This module doesn't repeat them. Its checks read Intune's own records.`,
  `${M} — Unit 1 "Introduction"; Unit 3 "Compliance policies and compliance status."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Name the Graph API, least-privileged permission and stage for each Book 05 evidence question",
    "Explain which three things are beta-only, and what that means for evidence",
    "Read managed devices and compliance status, including the device-name join",
    "Keep remote actions and export jobs out of a read-only collector",
    "Say what differs in GCC High and DoD, and run the five checks on fixtures",
  ], [
    "Module 1; Module 2 for the Conditional Access side",
    "Lab 1: the kit, Python and PowerShell; no tenant",
    "Lab 2: a test tenant with an Intune license and test devices",
  ], 85);
  sources(s, "Sources: Module 3, Unit 1 \"Learning objectives,\" \"Prerequisites\"; Unit 9 \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about eighty-five minutes with the lab. You'll name the Graph API, least-privileged permission and stage for each of Book 05's evidence questions. You'll explain which three things the program relies on are beta-only. You'll read managed devices and per-policy compliance status, including why the checks join on device name. You'll keep remote actions and export jobs out of a read-only collector. And you'll say what differs in GCC High and DoD, and run the five checks. You need Module 1, and Module 2 for the Conditional Access side. Lab 2 needs a test tenant with an Intune license and a few test devices.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 APIs
{
  const s = content(SC, "Book 05's questions mapped to Intune APIs");
  tag(s, "What");
  const b = table(s, "APIs", 1.45, [3.7, 3.85, 3.4, 1.2], ["Question", "Graph API", "Least-privileged permission", "Stage"], [
    ["Enrolled devices: OS, compliance, encryption, sync", "GET /deviceManagement/managedDevices", "DeviceManagementManagedDevices.Read.All", "v1.0"],
    ["Compliance policies, assignments, device statuses", ".../deviceCompliancePolicies and children", "DeviceManagementConfiguration.Read.All", "v1.0"],
    ["Settings Catalog and endpoint security policies", "GET /deviceManagement/configurationPolicies", "DeviceManagementConfiguration.Read.All", "beta"],
    ["Assignment filters", "GET /deviceManagement/assignmentFilters", "DeviceManagementConfiguration.Read.All", "beta"],
    ["Autopilot registrations", "GET .../windowsAutopilotDeviceIdentities", "DeviceManagementServiceConfig.Read.All", "v1.0"],
    ["Profile assignment status", "The same, deploymentProfileAssignmentStatus", "DeviceManagementServiceConfig.Read.All", "beta"],
  ], { fontSize: 11.5, limit: 5.7 });
  line(s, "Lic", "Every Intune API in Graph needs an active Intune license for the tenant.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 3, Unit 2: each API's Microsoft Graph reference page, v1.0 and beta (accessed Oct. 30, 2026).");
  notes(s,
`Here are six of Book 05's questions with the Intune API that answers each. Enrolled devices, with their OS, compliance state, encryption and last sync, come from managed devices, with the managed devices read permission. Compliance policies, their assignments and their per-device statuses need the configuration read permission, in version one point oh. The Settings Catalog and endpoint security policies, and assignment filters, use the same permission, but they're beta only. Autopilot registrations are in version one point oh with the service configuration read permission, but whether each one has been given a deployment profile is beta only. And every Intune API in Graph needs an active Intune license for the tenant.`,
  `${M} — Unit 2 "The APIs, and v1.0 versus beta."`);
}

// ================================================================== 5 Beta
{
  const s = content(SC, "Three things the program relies on are beta-only");
  tag(s, "What");
  const w = 3.9, gap = 0.22;
  const items = [
    ["SETTINGS CATALOG", "configurationPolicies", ["Book 05's policy library is mostly Settings Catalog", "Exporting it as code (CM-2) depends on beta"]],
    ["ASSIGNMENT FILTERS", "assignmentFilters", ["The filter list is beta", "v1.0 can't tell which filter an assignment uses", "So VK-INT-04 needs -IncludeBeta"]],
    ["AUTOPILOT PROFILES", "deploymentProfileAssignmentStatus", ["v1.0 lists registrations", "Profile status and profiles are beta"]],
  ];
  let bottom = 0;
  items.forEach(([lab, head, pts], k) => {
    bottom = Math.max(bottom, panel(s, `B${k + 1}`, 0.6 + k * (w + gap), 1.45, w, 2.3, [HEX.navy, HEX.teal, HEX.amber][k],
      [HEX.navyTint, HEX.tealTint, HEX.amberTint][k], lab, head, pts, 13));
  });
  callout(s, "Beta", bottom + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "Microsoft: ",
    "beta APIs \"are subject to more frequent change.\" Re-run a beta-dependent check after a beta change before using it as evidence (design guidance).");
  sources(s, "Sources: Module 3, Unit 2 \"v1.0 versus beta\": Learn, configurationPolicies; assignmentFilters; assignment targets; Autopilot identity v1.0 and beta (Oct. 30, 2026).");
  notes(s,
`Microsoft supports the Intune beta APIs, but says they're subject to more frequent change, and recommends version one point oh where it can be used. Three things the program relies on are beta-only today. The Settings Catalog: Book 05's policy library is mostly Settings Catalog profiles, so exporting the library as code depends on beta. Assignment filters: the filter list is beta, and version one point oh can't tell you which filter an assignment uses, which is why the validation kit's filter check needs its include-beta switch. And Autopilot profiles: version one point oh lists registrations, but the profile assignment status and the profiles themselves are beta. As design guidance, re-run a beta-dependent check after each beta change before you use its result as evidence.`,
  `${M} — Unit 2 "The APIs, and v1.0 versus beta": "v1.0 versus beta."`);
}

// ================================================================== 6 Managed devices
{
  const s = content(SC, "Managed devices: what the checks read and leave out");
  tag(s, "What");
  const b = table(s, "Props", 1.45, [3.9, 8.25], ["Property", "What it holds"], [
    ["complianceState", "unknown, compliant, noncompliant, conflict, error, inGracePeriod or configManager"],
    ["lastSyncDateTime", "The last successful sync with Intune"],
    ["osVersion, isEncrypted", "The OS version, and \"Device encryption status\""],
    ["azureADDeviceId", "The join key to the Entra device object"],
  ], { fontSize: 13, limit: 3.9 });
  const l = panel(s, "Out", 0.6, b + 0.25, 6.0, null, HEX.teal, HEX.tealTint, "LEFT OUT OF $SELECT (DESIGN GUIDANCE)", null, [
    "userPrincipalName, emailAddress, userDisplayName, phoneNumber",
    "So a check's output never carries a person's name or address",
  ], 13);
  panel(s, "Default", 6.85, b + 0.25, 5.9, null, HEX.red, HEX.redTint, "DEFAULTS THAT LOOK LIKE DATA", null, [
    "ethernetMacAddress, physicalMemoryInBytes, iccid, udid return defaults in a list",
    "Real values need a GET of one device that selects them",
  ], 13);
  sources(s, "Sources: Module 3, Unit 3 \"Managed devices\": Microsoft Learn, managedDevice resource type, v1.0 (accessed Oct. 30, 2026).");
  notes(s,
`A managed device is Intune's record of an enrolled device. The checks read its compliance state, one of seven values from compliant to in grace period; its last successful sync; its OS version and encryption status; and its Entra device ID, the join key to the Entra device object. The same record also returns a person's name, email address and phone number. The checks name only what they need in select and leave those out, so a check's output never carries a person's name or address. That's design guidance. And watch for defaults that look like data: some properties, such as the MAC address and physical memory, return default values when you list devices. Their real values come only from reading one device and selecting them.`,
  `${M} — Unit 3 "Managed devices and compliance": "Managed devices."`);
}

// ================================================================== 7 Compliance
{
  const s = content(SC, "Compliance status, coverage, and the name join");
  tag(s, "What");
  const l = panel(s, "Assign", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "ASSIGNMENTS", "A policy can reach no device", [
    "v1.0 group target: groupAssignmentTarget with a groupId",
    "Beta documents exclusionGroupAssignmentTarget",
    "No assignments, or only exclusions: the policy applies to no device",
  ], 13);
  const r = panel(s, "Status", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "DEVICE STATUSES", "Joined on device name", [
    "One row per device: nonCompliant, error, conflict, notAssigned and more",
    "Rows carry deviceDisplayName; the id is only \"Key of the entity\"",
    "So the checks join on name and flag names held twice (inference)",
  ], 13);
  callout(s, "Tenant", Math.max(l, r) + 0.3, 1.0, "FaShieldHalved", HEX.red, "Tenant-wide settings: ",
    "secureByDefault and deviceComplianceCheckinThresholdDays sit above every policy. Their read permission wasn't confirmed, so the checks don't read them.");
  sources(s, "Sources: Module 3, Unit 3: Learn, groupAssignmentTarget; exclusionGroupAssignmentTarget (beta); deviceComplianceDeviceStatus; deviceManagementSettings (Oct. 30, 2026).");
  notes(s,
`A compliance policy's assignments list its targets. In version one point oh a group target carries a group ID, and beta documents an exclusion target. A policy with no assignments, or with only exclusions, applies to no device, and remember, by default an unassigned device counts as compliant. Each policy's device statuses give one row per device, with a status such as non-compliant, error or conflict. But the row carries a device name, and its ID is described only as the key of the entity, not as the managed device's ID. So the checks join status rows to devices on the name, and flag names held by more than one device. That's an inference, and an open review item. Two tenant-wide settings sit above every policy; their read permission wasn't confirmed on Learn, so the checks don't read them.`,
  `${M} — Unit 3 "Managed devices and compliance": "Compliance policies and compliance status."`);
}

// ================================================================== 8 Remote actions and exports
{
  const s = content(SC, "Keep remote actions and exports out of a collector");
  tag(s, "How");
  const l = panel(s, "Actions", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "REMOTE ACTIONS", "An operator's permission", [
    "retire, wipe and syncDevice all need DeviceManagementManagedDevices.PrivilegedOperations.All",
    "Even a sync, which changes nothing on the device",
    "A collector holding it could wipe the fleet: keep it in a separate, approved pipeline (design guidance)",
  ], 13);
  const r = panel(s, "Export", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "REPORT EXPORT JOBS", "A write, and another host", [
    "Creating a job needs DeviceManagementConfiguration.ReadWrite.All; no read permission is listed",
    "The file is on blob storage with a signed URL, not the Graph host",
    "Select columns explicitly; don't automate on defaults",
  ], 13);
  callout(s, "Page", Math.max(l, r) + 0.3, 1.0, "FaListCheck", HEX.teal, "So the checks page the list APIs: ",
    "about 201 requests for 100 policies, well under Intune's 1,000 per 20 seconds per app per tenant.");
  sources(s, "Sources: Module 3, Unit 5: Learn, managedDevice; retire; wipe; syncDevice; Export Intune reports; Create export job; throttling limits (Oct. 30, 2026).");
  notes(s,
`Two things look useful and don't belong in a read-only collector. Remote actions: retire, wipe and even sync device all need the privileged operations permission, delegated or application. That's an operator's permission. A collector that holds it could wipe the fleet, so as design guidance, keep it in a separate pipeline with its own approval step. And report export jobs: creating one needs a read-write permission, with no read-only option listed, and the file it produces sits on blob storage behind a signed address, not on the Graph host. The example client won't send its token anywhere else. So the checks page through the list APIs instead. A hundred policies cost about two hundred and one requests, well under Intune's limit of a thousand per twenty seconds per app per tenant.`,
  `${M} — Unit 5 "Remote actions, limits and large exports."`);
}

// ================================================================== 9 Five checks
{
  const s = content(SC, "The five checks and the controls they evidence");
  tag(s, "How");
  const b = table(s, "Checks", 1.45, [2.75, 5.6, 3.8], ["Check", "What it reports", "Evidences"], [
    ["noncompliant-devices", "Devices noncompliant, in grace, in error or conflict, with failing policies", "CM-6; M-22-09 device signal; MS.AAD.3.7v1"],
    ["compliance-coverage", "Policies with no assignment or only exclusions; devices no policy reports on", "CM-2, CM-6; MS.AAD.3.7v1"],
    ["stale-checkin", "No sync in 14 days (validity) or 90 (cleanup), or none at all", "CM-8; M-22-09 inventory"],
    ["device-posture", "Windows and macOS not encrypted; below the OS floor (Windows 10.0.26100)", "SC-28(1), AC-19(5); SI-2, CM-6"],
    ["autopilot-profiles (beta)", "Registrations not assignedInSync, with the detailed status", "CM-8(1); CM-2"],
  ], { fontSize: 12, limit: 5.1 });
  callout(s, "Reader", b + 0.25, 1.0, "FaLock", HEX.teal, "A reader's set: ",
    "DeviceManagementManagedDevices.Read.All, DeviceManagementConfiguration.Read.All, DeviceManagementServiceConfig.Read.All. None can change a device.");
  sources(s, "Sources: Module 3, Unit 7 \"The five checks\": NIST SP 800-53 Rev. 5 Moderate baseline; ScubaGear aad.md (Oct. 30, 2026); kit README.");
  notes(s,
`Five checks. Noncompliant devices lists devices that are noncompliant, in grace, in error or in conflict, with the failing policies. Compliance coverage lists policies with no assignment or only exclusions, and devices no policy reports on. Stale check-in lists devices with no Intune sync inside the fourteen-day validity period or the ninety-day cleanup age, or none at all. Device posture lists Windows and Mac devices not reporting encryption, and devices below the OS floor. And Autopilot profiles, on beta, lists registrations whose profile isn't assigned and in sync. Every control they evidence is in the NIST Moderate baseline: configuration settings, the baseline, the inventory, encryption, and flaw remediation. The mapping is the program's reading; the assessor decides. The permissions are a reader's set.`,
  `${M} — Unit 7 "The five checks."`);
}
endModule(SC);

// ================================================================== 10 Try it
{
  const s = content(SL, "Try it: find the devices no policy reaches");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 2, in examples/ms-automation (output trimmed)",
    "$ python python/intune_tasks.py --from-json tests/fixtures/intune.json --as-of 2026-10-30T00:00:00Z compliance-coverage",
    "  \"CP-005 Kiosk and shared devices\" ...  \"finding\": \"exclusionOnly\"",
    "  \"CP-099 Old macOS pilot\" ...           \"finding\": \"unassigned\"",
    "  \"policyFindings\": 2,",
    "  \"devicesWithNoPolicyReported\": [ KSK-0001 (Windows), MAC-0001 (macOS) ],",
    "  \"ambiguousNames\": [ \"WS-0002\" ]",
    "# Lab 1, step 6: the Autopilot read as a GCC High run would make it",
    "$ python -c \"...try_beta(GraphClient('gcchigh', ...), '/deviceManagement/windowsAutopilotDeviceIdentities')\"",
    "{'stage': 'beta', 'available': False, 'items': [], 'reason': \"autopilot-device-identities isn't offered",
    " in gcchigh (graph-calls.json not_in_clouds)\"}",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 1, 2026", pt: 10.5 });
  line(s, "Read", "Two devices no policy reaches count as compliant by default. WS-0002 is two devices with one name. No request was made for GCC High.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 3, Unit 8 \"Exercise: Lab 1,\" steps 2 and 6; examples/ms-automation: intune_tasks.py, graphkit.py, graph-calls.json, tests/fixtures/intune.json.");
  notes(s,
`Try it. Lab 1 runs each check against a fictional fleet of nine devices and six Autopilot registrations. Here's step two, compliance coverage. Two policies reach no device: the kiosk policy has only an exclusion, and an old Mac pilot has no assignment at all. Two devices, a kiosk and a Mac, have no policy reporting on them, so with the tenant's default setting they count as compliant. And W S zero zero zero two is flagged as ambiguous: two devices share that name, so a status row could belong to either. Step six asks the client to read the Autopilot collection as a GCC High run would. It returns not available, with the reason, and makes no request, because the call list follows Intune's government service description, not the API page. The lab repeats two checks in PowerShell, with the same results.`,
  `${M} — Unit 8 "Exercise: Lab 1 (fixtures, no tenant)," steps 2, 6 and 7.`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: read your test tenant's fleet, read-only");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant, never production, with an Intune license and a few test devices"],
    ["Register", "One app in the tenant's own cloud, certificate credential, no secret"],
    ["Grant", "Only the read permissions for the checks you run; never PrivilegedOperations.All"],
    ["Run", "intune_tasks.py --cloud gcc --tenant <id> --client <app-id> --cert app.pem noncompliant-devices"],
    ["Compare", "With the Intune admin center's compliance, device and Autopilot views; record the open review items"],
    ["Back it out", "Remove the permissions; delete the app registration, its certificate and the saved results"],
  ], { fontSize: 12, limit: 5.4 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the saved results hold device names and serial numbers, so delete them when you're done.");
  sources(s, "Sources: Module 3, Unit 9 \"Exercise: Lab 2\"; examples/ms-automation README, \"Run it.\"");
  notes(s,
`Lab 2 runs the checks read-only against your own test tenant, worldwide or GCC, never production, with an Intune license and a few enrolled test devices. Register one app in the tenant's own cloud, with a certificate. Grant only the read permissions for the checks you run, and never the privileged operations permission. Run each task in Python, or connect in PowerShell and run it there; a missing permission stops the run before any Graph call. Compare the results with the Intune admin center's compliance, device and Autopilot views, and record the module's open review items, such as whether a status row's ID matches a managed device. Then back it out: remove the permissions, delete the app registration and its certificate, and delete the saved results, which hold device names and serial numbers. The authors haven't run Lab 2.`,
  `${M} — Unit 9 "Exercise: Lab 2 (your test tenant)."`);
}
endModule(SL);

// ================================================================== 12 Where agencies are: instances
{
  const s = content(SA, "Where agencies are: one Intune for GCC, one for High");
  tag(s, "Who");
  const b = table(s, "Inst", 1.45, [2.5, 4.4, 5.25], ["Tenant", "Intune instance", "Graph host"], [
    ["GCC", "\"The same instance as Microsoft Intune in the commercial space\"", "graph.microsoft.com"],
    ["GCC High", "A separate government instance, shared with DoD", "graph.microsoft.us"],
    ["DoD", "The same government instance", "dod-graph.microsoft.us"],
  ], { fontSize: 13, limit: 3.5 });
  const l = panel(s, "Na", 0.6, b + 0.25, 6.0, null, HEX.red, HEX.redTint, "GCC HIGH AND DOD: NOT AVAILABLE, NO PLANS", null, [
    "Windows Autopilot; Remediations",
    "Feature update and compatibility reports",
    "The ServiceNow connector; Subscription Activation",
  ], 12.5);
  panel(s, "Av", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "AVAILABLE", null, [
    "Standard MDM: compliance, configuration, app policies",
    "Log Analytics export; Defender security settings management",
    "Moving instances means unenrolling and re-enrolling every device",
  ], 12.5);
  sources(s, "Sources: Module 3, Unit 6: Learn, Intune for US Government GCC High and DoD service description; Graph national cloud deployments (Oct. 30, 2026).");
  notes(s,
`Where are agencies? Book 05's agency manages Windows with Group Policy, and often Configuration Manager, and is moving to Intune in a GCC tenant. GCC has no separate Intune instance. In Microsoft's words, GCC is the same instance as Intune in the commercial space, and it uses the worldwide Graph host. GCC High and DoD share a separate government instance, with their own Graph hosts, and moving between instances means unenrolling and re-enrolling every device. Microsoft's service description lists what isn't available there, with no plans to add it: Windows Autopilot, Remediations, feature update and compatibility reports, the ServiceNow connector and Subscription Activation. Standard device management, compliance, configuration and app policies, is available, with Log Analytics export and Defender security settings management.`,
  `${M} — Unit 6 "Where agencies are": GCC; GCC High and DoD.`);
}

// ================================================================== 13 Autopilot and interim
{
  const s = content(SA, "Autopilot in GCC High and DoD, and interim paths");
  tag(s, "Who");
  const l = panel(s, "Disc", 0.6, 1.45, 6.0, null, HEX.amber, HEX.amberTint, "ONE DISCREPANCY", "The API answers; the feature isn't offered", [
    "The Graph Autopilot pages list L4 and L5",
    "The service description lists Windows Autopilot as not available in GCC High and DoD",
    "The service description decides (inference); graph-calls.json follows it",
    "So autopilot-profiles is a GCC and commercial check",
  ], 13);
  const r = panel(s, "Int", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "INTERIM PATHS (DESIGN GUIDANCE)", null, [
    "Run compliance-coverage until it lists none, then set the default to Not compliant",
    "Devices still on Group Policy aren't in Intune: track them with VK-INT-06",
    "GCC High or DoD: Book 05, Ch 04 compares Autopilot device preparation",
    "Label the Settings Catalog export beta",
  ], 13);
  callout(s, "Gcc", Math.max(l, r) + 0.3, 0.85, "FaCloud", HEX.navy, "GCC's own gaps: ",
    "Book 05, Chapter 10's GCC (Moderate) boundary facts, such as Windows Update for Business reports.");
  sources(s, "Sources: Module 3, Unit 6: Learn, List windowsAutopilotDeviceIdentities; Intune government service description (Oct. 30, 2026). Book 05, Ch 04 and Ch 10.");
  notes(s,
`One discrepancy to know. The Graph reference pages for Autopilot device identities list the API in the GCC High and DoD clouds, while Intune's service description lists Windows Autopilot as not available there. The service description decides whether the feature can be used; an endpoint that answers doesn't make the feature supported. That's an inference, and the kit's call list follows the stricter statement, so the Autopilot check is for GCC and commercial tenants. The interim paths: run compliance coverage until it lists nothing, then change the tenant's default to not compliant. Devices still on Group Policy aren't in Intune yet, so track them with the validation kit's platform inventory. In GCC High or DoD, Book 05's Chapter 04 compares Autopilot device preparation. And label the Settings Catalog export as beta.`,
  `${M} — Unit 6 "Where agencies are": the Autopilot discrepancy, "Interim paths."`);
}
endModule(SA);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Intune");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.4, 8.75], ["Requirement", "What the checks evidence"], [
    ["NIST SP 800-53 Moderate", "CM-2, CM-6 baseline and settings; CM-8, CM-8(1) inventory; SC-28(1), AC-19(5) encryption; SI-2 OS floor"],
    ["OMB M-22-09", "At least one device-level signal when authorizing users: Intune compliance is that signal"],
    ["ScubaGear MS.AAD.3.7v1", "\"Managed devices SHOULD be required for authentication\"; ScubaGear has no Intune baseline"],
  ], { fontSize: 12.5, limit: 3.9 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "Each check's dated output with its evidences list, the app's permissions and consent, and the beta label",
    "Coverage showing every device under a policy, and the tenant-wide setting changed to Not compliant",
    "Encryption findings confirmed in Intune's report; the VK-INT results beside them",
  ], 13);
  sources(s, "Sources: Module 3, Unit 1; Unit 7; Unit 11: NIST Moderate baseline; ScubaGear aad.md and baselines folder (Oct. 30, 2026); Book 11, App A; Book 05, Ch 10.");
  notes(s,
`The federal requirement. Every control the checks evidence is in the NIST special publication eight hundred fifty-three Moderate baseline: configuration baseline and settings, the component inventory, protection of information at rest and encryption on mobile devices, and flaw remediation for the OS floor. Through Entra ID, compliance is the device-level signal that M-22-09 asks agencies to consider when authorizing users, and that ScubaGear's managed-device policy relies on. ScubaGear has no Intune baseline of its own. Book 11's Appendix A has the M-22-09 mapping, and Book 05's Chapter 10 says what an assessor reads. The evidence an ISSO keeps: each check's dated output, with its evidences list and the beta label; the coverage result and the changed default; and encryption findings confirmed in Intune's own report.`,
  `${M} — Unit 1 "The federal requirement"; Unit 7 "The five checks"; Unit 11 "Summary"; Book 11, Appendix A — "OMB M-22-09 objectives and actions."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on Intune", [
    { q: "A compliance policy's only assignment is an exclusion group. Which check reports it?", options: ["a. stale-checkin", "b. compliance-coverage: the policy reaches no device, and an unassigned device counts as compliant by default", "c. device-posture"] },
    { q: "What does autopilot-profiles report in a GCC High tenant?", options: ["a. Every registration as notAssigned", "b. An error from Graph", "c. \"Not evaluated,\" without calling Graph"] },
  ], "1 b: a policy with only exclusions reaches no device. 2 c: the service description lists Autopilot as not available.");
  sources(s, "Sources: Module 3, Unit 10 \"Knowledge check,\" questions 2 and 4; Unit 3; Unit 6.");
  notes(s,
`Check yourself with two questions. First: a compliance policy's only assignment is an exclusion group. Which check reports it? The answer is b, compliance coverage. A policy with only exclusions reaches no device, and by default an unassigned device counts as compliant. Second: what does the Autopilot check report in a GCC High tenant? The answer is c: not evaluated, without calling Graph, because Intune's service description lists Windows Autopilot as not available there. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — Unit 10 "Knowledge check," questions 2 and 4.`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary: you've finished the path");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Mapped Book 05's questions to Intune APIs, permissions and stage",
    "Learned which three things are beta-only",
    "Read devices and compliance status, and why the checks join on name",
    "Kept remote actions and export jobs out of the collector",
    "Ran the five checks, and saw why Autopilot is a GCC and commercial check",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "WHERE NEXT", "Put it on a schedule", [
    "The Intune track guide's Gate 6",
    "Planned modules: Azure Arc and Resource Manager, Teams, monitoring and evidence",
  ], 13.5);
  callout(s, "Path", Math.max(l, r) + 0.3, 0.85, "FaRoute", HEX.teal, "The learning path: ",
    "three modules, about 4 hours 25 minutes with each Lab 1.");
  sources(s, "Sources: Module 3, Unit 11 \"Summary\"; Module 1, Unit 1 (planned modules); Training index; Intune track guide, Gate 6.");
  notes(s,
`To sum up. You mapped Book 05's evidence questions to Intune APIs, their least-privileged permissions and their stage. You learned which three things the program relies on are beta-only. You read managed devices and compliance status, and saw why the checks join on device name. You kept remote actions and export jobs out of the collector. And you ran the five checks, and saw why Autopilot is a GCC and commercial check. That finishes the Microsoft Automation learning path: three modules, about four hours and twenty-five minutes with each lab. To put the checks on a schedule, go to the Intune track implementation guide's Gate 6. Modules on Azure Arc and Resource Manager, Teams, and monitoring are planned.`,
  `${M} — Unit 11 "Summary"; Module 1 — Unit 1 "Introduction" (the planned modules).`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/ms-automation-intune.md (Microsoft Automation learning path, Module 3), Units 1 to 11; its footnotes carry each Microsoft Learn page, read October 30, 2026; its verification log is docs/training/_verification/ms-automation-intune.md.",
  "Microsoft Learn pages the module cites: List managedDevices; managedDevice resource; deviceCompliancePolicies, assignments, deviceStatuses and resource; groupAssignmentTarget; deviceAndAppManagementAssignmentTarget; exclusionGroupAssignmentTarget (beta); deviceManagementSettings; deviceConfigurations; configurationPolicies (beta); assignmentFilters (beta).",
  "Also: windowsAutopilotDeviceIdentities v1.0 and beta; Autopilot deployment profiles (beta); mobileApps; retire, wipe and syncDevice; paging; throttling limits (Intune); Export Intune reports; Create export job; report names; Intune reports; Intune for US Government GCC High and DoD; Graph national cloud deployments.",
  "NIST SP 800-53 Rev. 5 Moderate baseline (OSCAL 5.2.0). CISA ScubaGear aad.md (MS.AAD.3.7v1 and the M-22-09 quotation) and baselines folder. Federal requirements by link: Book 11, Appendix A; Book 05, Chapter 10.",
  "Lab output: examples/ms-automation (intune_tasks.py, graphkit.py, graph-calls.json, FmwGraph.psm1, tests/fixtures/intune.json), run November 1, 2026 with Python 3.14.3 and PowerShell 7.6.9; the Try it output is trimmed. Lab 2 not run by the authors. Design guidance and inferences are labeled.",
]);

finish(OUT);
