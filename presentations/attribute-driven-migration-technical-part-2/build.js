// Companion guide — Attribute-Driven Migration to Entra ID, technical deep dive, PART 2:
// devices, servers, non-person identities, and running the migration.
//   Module 1 (the Intune and Arc tracks):  what Intune covers, Intune targeting, devices, dynamic device group dangers,
//                                          what Arc covers, Arc servers, and the devices neither tool covers.
//   Module 2 (the non-person track, PIV):  service accounts, workload identities and AI agents, service principals and
//                                          custom security attributes, the object-type crosswalk, PIV and CAC binding.
//   Module 3 (running it):                 the worked mover example, Stages 7 and 8, the limits of administrative units and
//                                          Lifecycle Workflows, what still needs AD, the checklist and the decisions.
// Part 1 (../attribute-driven-migration-technical-part-1/) carries the model and the HR track, and holds the shared slide
// builders (slides.js) this file picks from.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node presentations/attribute-driven-migration-technical-part-2/build.js \
//                      presentations/attribute-driven-migration-technical-part-2/Attribute_Driven_Migration_Technical_Part_2.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Attribute-Driven Migration to Entra ID — Technical Deep Dive, Part 2",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration — Part 2: Devices, servers, non-person identities",
});
const { SL, HEX, txt, tag, G, content, titleSlide, divider, notes, endModule, section, table, sources, sourceSlide, backup, finish } = P;
const OUT = process.argv[2] || "Attribute_Driven_Migration_Technical_Part_2.pptx";

const M1 = "Module 1 — The Intune and Arc tracks";
const M2 = "Module 2 — The non-person track and PIV";
const M3 = "Module 3 — Running it";

// ================================================================== Title
{
  const s = titleSlide("Orientation", "Part 2: Devices, servers and non-person identities", "Attribute-Driven Migration to Entra ID — technical deep dive, and running the migration");
  txt(s, "Session map", [
    { text: "Module 1  The Intune and Arc tracks   ·   Module 2  The non-person track and PIV", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Module 3  Running it: cutover, drift, limits, checklist, decisions", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 1: the model and the HR track", options: { color: HEX.ink, breakLine: true } },
    { text: "Facts dated October 29, 2026  ·  design guidance labeled as such", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 9.6, h: 1.65, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is Part 2 of the technical deep dive for the Federal Modernization Workbook's companion guide, Attribute-Driven Migration from Active Directory to Microsoft Entra ID. Part 1 covered the model and the HR track: the four tracks, what the migration accomplishes and the federal rules behind it, the attributes primer, sourcing and proving people's attributes, and the mechanisms that read them.

Part 2 covers the other three tracks and then runs the migration. Module 1 is the Intune track for end-user devices and the Azure Arc track for servers, with what each tool covers and the four-tier strategy for what neither reaches. Module 2 is the non-person track, service accounts, service principals, managed and workload identities and AI agents, with the object-type crosswalk and PIV and CAC binding. Module 3 runs it: the worked mover example, the phased cutover, drift, the limits of administrative units and Lifecycle Workflows, what still needs AD, and the checklist and decisions for every track.

The same three labels apply. The guide is a map and the books hold the depth; Microsoft facts were checked on Microsoft Learn on October 29, 2026; and the program's own recommendations are marked design guidance.`,
  `${G}, "Beyond users: the Intune, Arc and non-person identity tracks," Stages 7–8, "Limits," "Checklist."`);
}

// ================================================================== Recap (new)
{
  const s = content("Orientation", "Recap: four tracks, and where the attributes live");
  tag(s, "What");
  const a = table(s, "RecapTracks", 1.5, [1.6, 2.35, 2.0], ["Track", "Source of truth", "What reads it"], [
    ["HR (Part 1)", "HR and the contractor source", "User groups, units, CA personas, Lifecycle Workflows"],
    ["Intune", "Device provisioning: Autopilot, enrollment, Graph writes", "Device groups, filters, CA device filters"],
    ["Arc", "Arc onboarding tags, then Azure Policy", "Azure Policy, Update Manager, RBAC"],
    ["Non-person", "The owner and sponsor record, not HR", "Workload CA, app roles, reviews, expiry checks"],
  ], { fontSize: 11.5, limit: 6.5 });
  const b = table(s, "RecapStores", 1.5, [2.55, 1.55, 1.8], ["Store (from Part 1)", "Dynamic rules", "Conditional Access"], [
    ["Native properties", "Most", "Through groups"],
    ["extensionAttribute1–15", "Users, devices", "Device filters"],
    ["Directory extensions", "Single-value", "Not documented"],
    ["Custom security attributes", "No", "App filters (SPs)"],
    ["Intune inventory", "No", "No (filters read it)"],
    ["Azure resource tags", "No", "No (Policy reads them)"],
    ["certificateUserIds", "No", "Through CBA"],
  ], { x: 6.85, fontSize: 11.5, limit: 6.5 });
  txt(s, "RecapNote", "Part 1 covered the HR track. Every device and server, and every workload, needs the same thing people got: one source of truth, written by one writer, read by policy.",
    { x: 0.6, y: Math.max(a, b) + 0.35, w: 12.15, h: 0.8, fontSize: 15, color: HEX.navy, bold: true });
  if (process.env.FIT) console.log(`  recap: tracks ${a.toFixed(2)}, stores ${b.toFixed(2)}`);
  sources(s, "Sources: Guide, \"Four tracks,\" \"Attributes\" (the attribute stores; which store each consumer reads); Microsoft Learn as cited there (Oct. 29, 2026). Track model: design guidance.");
  notes(s,
`A quick recap, because Part 2 builds on two things from Part 1.

First, the four tracks, each with its own source of truth. The HR track, which Part 1 covered, takes people's attributes from HR and the contractor source, and dynamic user groups, administrative units, Conditional Access personas and Lifecycle Workflows read them. The Intune track takes device attributes from device provisioning: the Autopilot registration and group tag, Intune enrollment and Graph writes by the provisioning service; dynamic device groups, assignment filters and Conditional Access device filters read them. The Arc track takes server attributes from Arc onboarding tags and the resource group, then Azure Policy; Azure Policy, Update Manager and Azure RBAC at management group, subscription or resource group read them. And the non-person track takes its accountability from the owner and sponsor record, the system inventory, the app registration and the AI inventory, never HR.

Second, the store table, reduced from Part 1's attributes primer. Native properties are read by most rules and by Conditional Access through groups. extensionAttribute1 to 15 are read by user and device rules, and by Conditional Access device filters on the device's own slots when it's managed, compliant or hybrid joined. Directory extensions are read by rules when single-valued. Custom security attributes can't be read by dynamic rules, but Conditional Access application filters read them on service principals. Intune's inventory is read only by assignment filters, Azure tags only by Azure Policy, Resource Graph and Update Manager, and certificateUserIds by certificate-based authentication. Later slides that mention a store point back to this table.`,
  `${G}, "Four tracks, each with its own source of truth," "Attributes: what you know from AD, and what Entra ID gives you"; Part 1, Module 1.`);
}
endModule("Orientation");

// ================================================================== Module 1
section(M1);
{
  const s = divider(M1, "Module 1: The Intune and Arc tracks", "End-user devices through Intune  ·  servers through Azure Arc  ·  Book 05",
    ["What Intune covers; targeting; device attributes; dynamic device group dangers", "What Azure Arc covers; servers through Azure Resource Manager", "Devices neither tool covers: a four-tier strategy"], 18);
  notes(s,
`Module 1: the Intune and Arc tracks. People were Part 1. Now the computers the OU tree held: end-user devices, which Intune manages, and member servers, which Azure Arc brings under Azure Resource Manager. Neither takes its attributes from HR, and a device rule can never read its owner's attributes, so each has its own source of truth.

So: what Intune covers, which isn't only Windows; Intune targeting, device groups and filters; how device attributes are written; the dangers of dynamic device groups and how to avoid them; what Arc covers, which isn't only Windows Server either; how tags and Azure Policy make a server attribute-driven; and the four-tier strategy for the devices and servers neither tool reaches.`,
  `${G}, "Intune track," "Which end-user devices Intune covers," "Azure Arc track," "Which servers Arc covers," "What neither tool reaches," "Dynamic device groups (Intune track)"; Book 05, Chapters 03, 04, 08, 09 and 10.`);
}
["intunecov", "intune", "devices", "dangersD", "arccov", "arc", "neither"].forEach((k) => SL[k]());
endModule("Module 1");

// ================================================================== Module 2
section(M2);
{
  const s = divider(M2, "Module 2: The non-person track and PIV", "Service accounts, workload identities, AI agents  ·  Books 02, 06 and 17",
    ["Service accounts, MSAs and gMSAs; workload identities and AI agents", "Service principals, custom security attributes, the object-type crosswalk", "PIV and CAC certificate binding as an attribute"], 14);
  notes(s,
`Module 2: the non-person track. Service accounts, service principals, managed and workload identities and AI agents have no HR record. Their accountability is a named owner and sponsor, and their lifecycle runs on the owning system's record and on credential expiry, not on a hire or leave date.

So: the AD service accounts, MSAs and gMSAs and the target for each; service principals, managed identities, workload identity federation and AI agent identities, each with its owner and sponsor, credentials and lifecycle; what Microsoft documents for targeting service principals by attribute, with custom security attributes; the object-type crosswalk across all four tracks; and PIV and CAC certificate binding, the people's credential, which is attribute-driven too.`,
  `${G}, "Non-person identity track," "Which attribute store each mechanism can read," "Object types, stores, writers and consumers," "PIV and CAC certificates as attributes"; Book 02, Chapters 06, 09 and 10; Book 17, Chapters 04–06.`);
}
["npi1", "npi2", "sp", "crosswalk", "piv", "cuid"].forEach((k) => SL[k]());
endModule("Module 2");

// ================================================================== Module 3
section(M3);
{
  const s = divider(M3, "Module 3: Running the migration", "Stages 7 and 8  ·  worked example  ·  limits, checklist and decisions",
    ["One analyst through a mover event, end to end", "Phased cutover by attribute-defined waves; drift correction", "Units, Lifecycle Workflows, what still needs AD; checklist and decisions"], 24);
  notes(s,
`Module 3: running it. The model is in place, every track's attributes are true, and every mechanism reads them. Now the guide follows one person through a mover event to show the chain working, then runs the cutover and the drift loop that keeps it true.

So: the worked example, one budget analyst and one reassignment with no ticket; Stage 7, the phased cutover and how a population proves HR is its sole source; Stage 8, drift detection and correction at the source; the limits of administrative units, Lifecycle Workflows and what could break at this estate's size, and what still needs AD during hybrid; and the checklist and decisions, with rows for every track.`,
  `${G}, "Worked example," Stages 7–8, "Limits," "Checklist."`);
}
["worked", "mover", "stage7", "stage8", "limAU", "lcw1", "lcw2", "needsAD", "checklist", "decisions"].forEach((k) => SL[k]());
endModule("Module 3");

// ================================================================== Backup
backup();
sourceSlide("Sources behind the recap and Module 1", [
  "Attribute-Driven Migration guide: \"Four tracks,\" \"Attributes,\" \"Beyond users\": \"Intune track,\" \"Which end-user devices Intune covers,\" \"Azure Arc track,\" \"Which servers Arc covers,\" \"What neither tool reaches\"; \"Dynamic device groups (Intune track).\"",
  "Book 05, Ch 02, 03, 04, 08, 09, 10; Book 09, Ch 07, 09; Book 12, Ch 01; Book 01, Ch 04; Book 06, Ch 09. Verification log D2, D5.",
  "Microsoft Learn (Oct. 29, 2026): Intune supported platforms and enrollment; Windows 365; Azure Virtual Desktop; Apple, Android and AOSP enrollment; Linux; ChromeOS connector; specialty devices; Defender device discovery.",
  "Microsoft Learn (Oct. 29, 2026): Assign policies in Intune; dynamic membership rules; Windows Autopilot device groups; Graph Update device; Intune filter properties; scope tags; stale devices; Intune device cleanup.",
  "Microsoft Learn (Oct. 29, 2026): Connected Machine agent prerequisites; choose Arc; Arc-enabled VMware vSphere; Arc-enabled SCVMM; multicloud connector; Arc-enabled Kubernetes; cloud-native server management; azcmagent connect; tag policies; Azure ABAC.",
  "Diagrams: Book 05 ch08-targeting-layers, ch09-arc-management-plane.",
]);
sourceSlide("Sources behind Module 2 — The non-person track and PIV", [
  "Attribute-Driven Migration guide: \"Non-person identity track,\" \"Which attribute store each mechanism can read,\" \"Object types, stores, writers and consumers,\" \"PIV and CAC certificates as attributes.\"",
  "Book 02, Ch 06 matrix; Ch 09 — \"Service accounts,\" migration path matrix, workload identity federation, governing service principals; Ch 10 — Phase 4.  ·  Book 17, Ch 04–06.  ·  Book 03, Ch 06, 09.  ·  Book 04, Ch 03, 05, 06.  ·  Book 07, Ch 06, 07.",
  "Microsoft Learn (Oct. 29, 2026): custom security attributes; CA filter for applications; app user and group assignment; CA for workload identities; Workload ID FAQ; application management policies; CBA technical concepts; Set up CBA; certificateUserIds; Authentication strengths; M-22-09 MFA.",
  "Unverified: certificateUserIds written through Graph by the card management system after AD (design guidance), workbook issue #130, open as of Oct. 29, 2026. Cloud Sync for certificateUserIds: not documented.",
  "Diagrams: Book 03 ch09-credential-assurance.",
]);
sourceSlide("Sources behind Module 3 — Running it", [
  "Attribute-Driven Migration guide: \"Worked example: one user and one mover event,\" Stage 7, Stage 8, \"Limits\" (administrative units; Lifecycle Workflows; at scale; what still needs AD), \"Checklist,\" \"The path on one page.\"",
  "Book 00, Ch 09 and 10.  ·  Book 01, Ch 04.  ·  Book 02, Ch 05, 06, 09, 10.  ·  Book 03, Ch 05, 06, 08, 10, 11, 12 and Appendix C.  ·  Book 05, Ch 08.  ·  Book 06, Ch 16, 17, Appendix A.  ·  Book 17, Ch 05.",
  "Microsoft Learn (Oct. 29, 2026): Guidance for user SOA; Transfer user SOA; administrative units; dynamic and restricted management units; ID Governance service limits; Lifecycle Workflow deployment; execution limits and quarantine; extensibility; understanding lifecycle workflows.",
  "Corrections stated as the guide states them: Lifecycle Workflows 100 per tenant (Book 02, Ch 10 said 50); the custom task extension timeout differs between two Microsoft pages.",
  "Could not verify: user SOA transfer in GCC (Book 03, Ch 12 open register); Federal HR 2.0 schedule after Oct. 20, 2026 (confirm with the HR 2.0 program office).",
  "Diagrams: Book 03 ch08-personnel-action-lifecycle, appc-cutover-sequence, ch11-drift-evidence-loop; Book 00 ch09-waves-by-attribute.",
]);
sourceSlide("Federal requirements: full citations", [
  "NIST, SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations, release 5.2.0 (August 27, 2025): CM-8 System Component Inventory (the device tiers); IA-2 Identification and Authentication, with IA-2(1), (2), (8), (12) (the Windows-login gap; PIV acceptance).",
  "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles, January 26, 2022, §III.A Identity (phishing-resistant MFA; the PIV binding).",
  "NIST, FIPS 201-3, Personal Identity Verification (PIV) of Federal Employees and Contractors, January 2022, §2.9.1, §2.9.4, §2.10.2 (reissuance and termination reach the binding).",
  "The full track-by-track mapping (AC, AU, CA, CM, IA, PS and SI controls; OMB M-19-17, M-25-21, M-26-14; the Federal HR 2.0 memo; SP 800-63-4; BOD 25-01) is in Part 1's federal-requirements slide and its citations.",
  "Mapping: the guide's \"The federal requirements each track satisfies,\" reusing Book 02 App A, Book 05 Ch 10, Book 06 App A and Book 17 App A. The program's reading; the authorizing official decides.",
]);

finish(OUT);
