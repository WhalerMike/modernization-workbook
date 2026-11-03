// Ticket-to-Machine learning path, Module 3: One Writer per Attribute — the module's narrated deck.
// Teaches docs/training/ticket-to-machine/03-one-writer-per-attribute.md, Learn-style: objectives, the concepts, two
// "Try it" slides with the real Lab 1 commands and output (run November 2, 2026 in a copy of
// examples/servicenow-sailpoint), Lab 2, what's available in government clouds, the federal requirement and evidence,
// a two-question check, and the summary. Every fact comes from the module page, the pages it sends the learner to (as
// its verification log says), or the kit; the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-ttm-module-3/build.js \
//                      presentations/training-ttm-module-3/Training_TTM_Module_3.pptx
const TITLE = "Module 3: One Writer per Attribute";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Ticket-to-Machine learning path, Module 3: One Writer per Attribute",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and labels the title slide for the Microsoft Automation path; this path's title slide
// and document title are set here.
P.D.pres.title = `Ticket-to-Machine learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "TICKET-TO-MACHINE LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_TTM_Module_3.pptx";
const M = "Training, Ticket-to-Machine, Module 3";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SA = "Where agencies are";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 3: One writer per attribute", "Ticket-to-Machine learning path · ServiceNow and SailPoint Identity Security Cloud · Guide Gate 2",
    ["Two writer patterns  ·  One approver system per class  ·  Lanes", "writer_check.py  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 3 of the Ticket-to-Machine learning path: one writer per attribute. This module follows the guide's Gate 2, which settles two decisions on paper before anything is connected: who writes each attribute, and which system approves each authority class. Then you'll use the developer workbook's Chapter 08 check, which reads two provisioning configurations, Entra inbound provisioning's and SailPoint's, and reports every attribute both of them write. You'll run it on fictional exports, add an alias, and see why the alias list and the directory name are inputs a reviewer has to confirm.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why drift that comes back means two writers");
  tag(s, "Why");
  const b = table(s, "Story", 1.45, [3.0, 9.15], ["", "What happens to department"], [
    ["Entra inbound", "Writes department from HR"],
    ["SailPoint", "Its Entra connector also writes department"],
    ["Every sync", "Each overwrites the other"],
    ["Module 4's drift", "Comes back the next day, no matter how often someone fixes it"],
  ], { fontSize: 13.5, limit: 4.4 });
  callout(s, "Point", b + 0.3, 1.0, "FaRightLeft", HEX.red, "Gate 2 settles it on paper: ",
    "one writer per attribute, and one approver system per authority class, before anything is connected.");
  sources(s, "Sources: Module 3, Unit 1 \"Introduction\"; workbook Chapter 08, \"In this chapter.\"");
  notes(s,
`Why does this module exist? Here's the story. Entra inbound provisioning writes department from HR. SailPoint's Entra connector also writes department. Each sync overwrites the other. And the drift you'll measure in Module 4 comes back the next day, no matter how often someone fixes it. The reconciliation sees the result, attribute drift that keeps coming back, but not the cause. Fixing the value by hand never settles it, because the next sync recreates the drift. Gate 2 settles it on paper, before anything is connected: one writer per attribute, and one approver system per authority class. In this module you learn those decisions, and you check two provisioning configurations against the first one.`,
  `${M} — Unit 1 "Introduction"; workbook Chapter 08 — "In this chapter," "What exists."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Explain the two writer patterns Gate 2 allows, and why only one at a time",
    "Explain why Gate 2 names one approver system per authority class",
    "Run writer_check.py over two configuration exports, and interpret each Finding, Warn and Info line",
    "Verify that the alias list and the directory name are inputs a reviewer checks",
  ], [
    "Module 2",
    "For the Graph export in Lab 2: Microsoft Automation, Module 1",
    "Lab 1: the kit's fixtures; no tenant",
    "Lab 2: a test Entra tenant and a SailPoint sandbox",
  ], 40);
  sources(s, "Sources: Module 3, Unit 1 \"Learning objectives,\" \"Prerequisites\"; Unit 5 \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about forty minutes with the lab. You'll explain the two writer patterns Gate 2 allows, and why it allows only one of them at a time. You'll explain why Gate 2 names one approver system for each authority class. You'll run the writer check over two configuration exports, and interpret each Finding, Warn and Info line it prints. And you'll verify that the alias list and the directory name are inputs a reviewer checks, not things the tool guesses. You need Module 2 first. For the Graph export in Lab 2, the Microsoft Automation path's first module helps. Lab 1 runs on fixtures, with no tenant.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Gaps
{
  const s = content(SC, "Gate 2 closes two of the four gaps on paper");
  tag(s, "What");
  const b = table(s, "Gaps", 1.45, [3.4, 5.9, 2.85], ["Gap", "What the products do as shipped", "Closed by"], [
    ["1 A ticket status isn't a re-read", "The Service Desk integration treats its task as complete from the ServiceNow status", "Gate 6"],
    [{ text: "2 Catalog app moves approval", options: { color: HEX.red } }, "Requests follow ServiceNow's approval process; Book 15 decides owner-governed access (A2, A3) in the governance platform", { text: "Gate 2: one approver system per class", options: { bold: true } }],
    ["3 No change-request tickets", "ISC's Service Desk integration raises only Service Request and Incident tickets", "Gate 5"],
    [{ text: "4 Two doors into the directory", options: { color: HEX.red } }, "SailPoint can provision Entra ID and AD; Book 03 makes Entra inbound provisioning the one writer", { text: "Gate 2: one writer per attribute", options: { bold: true } }],
  ], { fontSize: 12.5, limit: 5.0 });
  line(s, "Lanes", "Gate 2 also gives each change class a lane and a change-record type, and builds nothing: every later gate builds what it decides.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 3, Unit 2; the guide's \"The loop at a glance\" (the four gaps) and \"Step 2: Decide the writers and the approvers.\"");
  notes(s,
`Used as shipped, the two products fall short of the loop in four places, and Gate 2 closes two of them on paper. Gap two: with SailPoint's Service Catalog app, requests follow the approval process defined in ServiceNow, while the Federal Modernization Workbook's design decides owner-governed access, classes A two and A three, in the identity governance platform. Gate 2 answers with one approver system per authority class. Gap four: two doors into the directory. SailPoint can provision Entra ID and Active Directory, while the workbook's design makes Entra inbound provisioning the one writer of HR-mastered attributes. Gate 2 answers with one writer per attribute. It also gives each change class a lane and a change-record type. Every later gate builds what this one decides.`,
  `${M} — Unit 2 "The writers and the approvers"; the guide — "The loop at a glance," four gaps; "Step 2: Decide the writers and the approvers."`);
}

// ================================================================== 5 Two writer patterns
{
  const s = content(SC, "Two writer patterns: pick one, not both");
  tag(s, "What");
  const l = panel(s, "A", 0.6, 1.45, 5.95, null, HEX.navy, HEX.navyTint, "PATTERN 1", "Entra inbound provisioning stays the door", [
    "SailPoint aggregates HR read-only",
    "SailPoint governs entitlements: groups, roles, access packages, application access",
  ], 13.5);
  const r = panel(s, "B", 6.8, 1.45, 5.95, null, HEX.teal, HEX.tealTint, "PATTERN 2", "SailPoint becomes the provisioning service", [
    "It takes on Book 03's middleware duties",
    "Book 03, Chapter 05: five duties per event",
  ], 13.5);
  callout(s, "Not", Math.max(l, r) + 0.3, 0.9, "FaTriangleExclamation", HEX.red, "Not both: ",
    "record each attribute's writer in the attribute map (design guidance).");
  line(s, "HCM", "SailPoint's Oracle HCM Cloud connector reads Core HCM directly, with no on-premises appliance, and writes back only the user name and work email.", Math.max(l, r) + 1.45, 0.7, 13.5);
  sources(s, "Sources: Module 3, Unit 2; the guide's Gate 2, step 1 (design guidance).");
  notes(s,
`Gate 2's first step is to choose one writer per attribute, and the guide offers two patterns, as design guidance. In the first, Entra inbound provisioning stays the door. SailPoint aggregates HR read-only, and governs entitlements: groups, roles, access packages and application access. In the second, SailPoint becomes the provisioning service, and takes on the duties the workbook's design gives the HR middleware. Pick one and write it down. Not both. Then record each attribute's writer in the program's attribute map. One fact helps the choice: SailPoint's Oracle HCM Cloud connector reads Core HCM directly, without an on-premises appliance, and writes back only the user name and work email. For the first pattern's build, the guide points to its Oracle HCM to Entra guide.`,
  `${M} — Unit 2 "The writers and the approvers"; the guide — "Step 2," step 1.`);
}

// ================================================================== 6 Approvers and lanes
{
  const s = content(SC, "One approver system per class, and a lane for each");
  tag(s, "What");
  const b = table(s, "Lanes", 1.45, [2.9, 5.6, 3.65], ["Lane (Book 13)", "On these products (inference)", "Change record in ServiceNow"], [
    ["Machine, autonomous (L4)", "SailPoint lifecycle states and birthright access, for classes the authorizing official enumerated", "Standard change"],
    ["Machine, gated (L3)", "A SailPoint access request with approval; a catalog item run by the spoke", "Normal change where needed"],
    ["Human decision", "SailPoint certifications; ServiceNow approval or CAB", "The decision record"],
    ["Declared exception", "A Service Desk ticket for a disconnected application", "The ticket and the register entry"],
    ["Emergency change", "ServiceNow emergency change", "Straight to CAB authorization"],
  ], { fontSize: 12, limit: 4.9 });
  callout(s, "Appr", b + 0.25, 1.15, "FaUserCheck", HEX.navy, "Approvers, for example (design guidance): ",
    "ServiceNow approves A0 and A1; SailPoint approves A2 and A3; the catalog app only collects. Every timeout rejects or cancels, never approves.");
  sources(s, "Sources: Module 3, Unit 2; the guide's Gate 2, steps 2 to 4 and its lane table (inference); Book 13, Appendix B, \"Change classes and their lanes.\"");
  notes(s,
`Step two chooses one approver system per authority class. The guide's example, design guidance: ServiceNow approves A zero and A one through its Ask for Approval flow. SailPoint approves A two and A three, through access-request approvals by an owner, a manager or a governance group. The Service Catalog app only collects A two and A three requests. And every approval's timeout outcome is reject or cancel, never approve. Step three gives each change class a lane, following the workbook's design. The mapping onto these products is the program's inference. An autonomous class runs as a standard change, and the authorizing official accepts any class run that way. A gated class is an access request with approval. Step four writes the decisions to the record as a reviewed change.`,
  `${M} — Unit 2 "The writers and the approvers"; the guide — "Step 2," steps 2 to 4; Book 13, Appendix B — "Change classes and their lanes."`);
}

// ================================================================== 7 writer_check reads two exports
{
  const s = content(SC, "writer_check.py reads two provisioning exports");
  tag(s, "How");
  const l = panel(s, "Entra", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "ENTRA INBOUND JOB'S SCHEMA", "Graph synchronization schema", [
    "Rules whose targetDirectoryName is the Entra directory (default Azure Active Directory)",
    "Enabled object mappings to User",
    "flowType Always: updates on every change; ObjectAddOnly: only at creation",
  ], 13);
  const r = panel(s, "ISC", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "ISC SOURCE'S PROVISIONING POLICIES", "On the source that writes Entra ID", [
    "Each policy's usageType and fields[].name",
    "UPDATE: the update profile, for attribute sync",
    "CREATE: the create profile, when the account is made",
    "Other usage types are ignored",
  ], 13);
  callout(s, "Why", Math.max(l, r) + 0.3, 1.05, "FaCodeBranch", HEX.navy, "Why it's a build now: ",
    "Pass 2 planned this read-only check; both configurations export as JSON through documented reads, so it runs on files, offline, today.");
  sources(s, "Sources: Module 3, Unit 3; workbook Chapter 08, \"Why this is a build, and why now,\" \"What this chapter adds.\"");
  notes(s,
`The guide names the automated check for Gate 2, built in the workbook's Chapter 08. Why now? The implementation example planned a read-only check of the two provisioning mappings for Pass 2, and both configurations export as JSON through documented reads, so the check runs on files, offline, today. It reads two exports. The first is the inbound job's synchronization schema, from Microsoft Graph. It takes the rules that target the Entra directory, the enabled mappings to User, and each attribute's flow type: Always updates it on every change, and Object Add Only sets it only at creation. The second is the SailPoint source's provisioning policies. An Update policy is used for attribute sync, a Create policy when the account is made, and other usage types are ignored.`,
  `${M} — Unit 3 "Checking for two writers"; workbook Chapter 08 — "Why this is a build, and why now," "What this chapter adds."`);
}

// ================================================================== 8 Finding, Warn, Info
{
  const s = content(SC, "Finding, Warn and Info, and the inputs to review");
  tag(s, "What");
  const b = table(s, "Sev", 1.45, [1.8, 4.8, 5.55], ["Result", "When", "What it means"], [
    ["Finding", "Both systems update the attribute", "Each overwrites the other: the command exits 1"],
    ["Warn", "One updates it, the other sets it at creation", "Two sources for its first value"],
    ["Info", "Both set it only at creation", "Noted, not a conflict"],
  ], { fontSize: 13, limit: 3.4 });
  const l = panel(s, "Alias", 0.6, b + 0.25, 6.0, null, HEX.amber, HEX.amberTint, "THE ALIAS LIST (DESIGN GUIDANCE)", null, [
    "SailPoint's field names are the connector's, not necessarily Entra ID's",
    "Matched case-insensitively; --alias field=attribute for each pair that differs",
    "The check doesn't guess: the alias list is a reviewed input",
  ], 12.5);
  panel(s, "Dir", 6.85, b + 0.25, 5.9, null, HEX.red, HEX.redTint, "THE DIRECTORY NAME", null, [
    "A wrong --entra-directory would make every attribute look unwritten",
    "So the check refuses a name the schema doesn't target",
  ], 12.5);
  sources(s, "Sources: Module 3, Unit 3; workbook Chapter 08, \"What this chapter adds,\" \"Dangers.\"");
  notes(s,
`For each attribute both systems write, the check gives one of three results. A Finding when both update it: each overwrites the other, and the command exits one. A Warn when one updates it and the other sets it at creation: two sources for its first value. And Info when both set it only at creation. Two inputs need a reviewer. First, the alias list. SailPoint's field names are the connector's, not necessarily Entra ID's. The check matches names case-insensitively, and takes an alias for each pair that differs. It doesn't guess. Which connector field writes which Entra attribute is something to confirm in the source's schema. Second, the directory name. A wrong name would make every attribute look unwritten, so the check refuses a name the schema doesn't target.`,
  `${M} — Unit 3 "Checking for two writers"; workbook Chapter 08 — "What this chapter adds," "Dangers."`);
}

// ================================================================== 9 Dangers
{
  const s = content(SC, "What the check guards against, and what it misses");
  tag(s, "Why");
  const b = table(s, "Dangers", 1.45, [3.9, 4.3, 3.95], ["Danger", "What happens", "The guard"], [
    ["Two systems update one attribute", "Drift is fixed and recreated on the next sync, forever", "A Finding, exit 1"],
    ["Field names that differ hide a second writer", "The check reports no overlap", "--alias, reviewed"],
    ["The wrong directory name", "Every attribute looks unwritten", "The check refuses the name"],
    ["A disabled mapping counted", "False findings", "Disabled object mappings are skipped"],
    ["Writers outside provisioning policies", "The check misses them", "A person confirms"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Scope", b + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "What it doesn't check: ",
    "approver systems or lanes. It reads exports; those decisions stay a manual validation of Gate 2.");
  sources(s, "Sources: Module 3, Unit 3; workbook Chapter 08, \"Dangers\"; the guide's \"Validate (G2 Writers and approvers).\"");
  notes(s,
`Here's what the check guards against, from Chapter 08's dangers table. Two systems updating one attribute means drift that's fixed and recreated on every sync, forever; that's a Finding, and an exit code of one. Field names that differ can hide a second writer, so the check would report no overlap; the guard is the reviewed alias list. A wrong directory name makes every attribute look unwritten; the check refuses it. A disabled mapping counted would give false findings, so disabled object mappings are skipped. And here's what it misses: writers outside provisioning policies. A person has to confirm those. The guide is clear about scope, too. The check reads exports. It doesn't check approver systems or lanes; those stay a manual validation of Gate 2.`,
  `${M} — Unit 3 "Checking for two writers"; workbook Chapter 08 — "Dangers"; the guide — "Validate (G2 Writers and approvers)."`);
}
endModule(SC);

// ================================================================== 9 Try it: two writers
{
  const s = content(SL, "Try it: find the attribute with two writers");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 2 and 3, in examples/servicenow-sailpoint (fixtures, no tenant)",
    "$ python clients/python/writer_check.py --entra-schema tests/fixtures/writers/entra_inbound_schema.json \\",
    "    --isc-policies tests/fixtures/writers/isc_entra_source_policies.json",
    "Entra inbound writes 8 attributes; SailPoint writes 7; 1 Finding, 1 Warn, 2 Info",
    "  Finding department         Entra update SailPoint update both update it: each overwrites the other, so drift never settles",
    "  Warn    displayName        Entra update SailPoint create one updates it and the other sets it at creation: two sources ...",
    "  Info    mailNickname       Entra create SailPoint create both set it only at creation",
    "  Info    userPrincipalName  Entra create SailPoint create both set it only at creation",
    "$ python clients/python/writer_check.py --entra-schema tests/fixtures/writers/entra_inbound_schema.json \\",
    "    --isc-policies tests/fixtures/writers/isc_entra_source_policies.json --alias title=jobTitle",
    "Entra inbound writes 8 attributes; SailPoint writes 7; 2 Finding, 1 Warn, 2 Info",
    "  ...",
    "  Finding jobTitle           Entra update SailPoint update both update it: each overwrites the other, so drift never settles",
    "  ...",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED; COMMANDS WRAPPED)", pt: 10.5 });
  line(s, "Exit", "Both exit 1. Step 1, the chapter's tests: 6 passed. The alias made SailPoint's title visible as a second writer of jobTitle.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 3, Unit 4 \"Exercise: Lab 1,\" steps 1 to 3; workbook Chapter 08, Lab 1; tests/fixtures/writers.");
  notes(s,
`Try it. Lab 1 runs in the kit's folder against two fictional exports: an HR-to-Entra inbound job, and a SailPoint source that creates accounts and updates department, title and office location. Step one runs the chapter's tests: six pass. Step two checks the two exports. Entra inbound writes eight attributes and SailPoint writes seven, with one Finding, one Warn and two Info. The Finding is department: both update it, so each overwrites the other and the drift never settles. The command exits one. Step three maps SailPoint's title to Entra ID's job title, and runs it again. Now there are two Findings: job title joins department. Without the alias, the second writer of job title was invisible.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 1 to 3; workbook Chapter 08 — "What this chapter adds," "Lab 1."`);
}

// ================================================================== 10 Try it: guard and reads
{
  const s = content(SL, "Try it: the directory guard and the two reads");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 4: a directory name the schema doesn't target",
    "$ python clients/python/writer_check.py --entra-schema tests/fixtures/writers/entra_inbound_schema.json \\",
    "    --isc-policies tests/fixtures/writers/isc_entra_source_policies.json --entra-directory \"Microsoft Entra ID\"",
    "error: No synchronization rule targets 'Microsoft Entra ID'; the schema's targets are ['Azure Active Directory']",
    "# Step 5: the reads the two exports need",
    "$ python clients/python/kit_calls.py --task writer-check",
    "Task writer-check: export the two provisioning mappings writer_check.py compares (by hand; ... reads files only)",
    "isc",
    "  GET    /v3/sources/{sourceId}/provisioning-policies               idn:provisioning-policy:read",
    "graph",
    "  GET    /v1.0/servicePrincipals/{id}/synchronization/jobs/{jobId}/schema CustomSecAttributeProvisioning.Read.All",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED; COMMAND WRAPPED)", pt: 10.5 });
  const b = table(s, "Read", c + 0.25, [2.6, 9.55], ["Step", "What it shows"], [
    ["4: exit 2", "A wrong directory name doesn't pass as \"no overlap\""],
    ["5: GET only", "One read on ISC, one on Graph; writer_check.py itself reads files only"],
  ], { fontSize: 13, limit: 6.55 });
  sources(s, "Sources: Module 3, Unit 4 \"Exercise: Lab 1,\" steps 4 and 5; workbook Chapter 08, Lab 1.");
  notes(s,
`Step four shows the directory-name guard. The fixture's rules target Azure Active Directory, the name Learn's examples use. Ask for Microsoft Entra ID instead, and the check stops with an error that names the targets the schema does have, and exits two. That matters, because a wrong name would otherwise look like no overlap at all, and pass. Step five lists the reads the two exports need. On SailPoint, the provisioning policy read scope, for the source's provisioning policies. On Graph, the custom security attribute provisioning read permission, for the job's schema. Both are reads, and the writer check itself reads files only: you export the two configurations by hand. Check your work: given two exports and an alias list, you can say which attributes have two writers.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 4 and 5; workbook Chapter 08 — "What this chapter adds," "Lab 1."`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: export the real mappings and run the check");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A test Entra tenant with an inbound provisioning job, and a SailPoint sandbox with an Entra source. Both reads are GET only"],
    ["Export", "The inbound job's schema, and the Entra source's provisioning policies"],
    ["Check", "Build the alias list, run the check, and hand each Finding to the data architect"],
    ["Back it out", "Step 5: delete the exports if they hold anything beyond mappings; remove the Graph permission and the ISC API client"],
  ], { fontSize: 13, limit: 4.9 });
  callout(s, "NotRun", b + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow Chapter 08, Lab 2. Export mappings only: a policy with values may hold personal data.");
  sources(s, "Sources: Module 3, Unit 5 \"Exercise: Lab 2\"; workbook Chapter 08, \"Dangers.\"");
  notes(s,
`Lab 2 runs the check on your own exports. You need a test Entra tenant with an inbound provisioning job, and a SailPoint sandbox with an Entra source. Both reads are GET only. Export the inbound job's schema from the tenant, and the Entra source's provisioning policies from the sandbox. Build the alias list, run the check, and hand each Finding to the data architect, who decides the writer. Export mappings only: a schema with expressions is fine, but a policy with values may not be. Back it out in step five: delete the exports if they hold anything beyond mappings, and remove the Graph permission and the SailPoint API client. The authors haven't run Lab 2; follow Chapter 08's Lab 2 step by step.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test instance)"; workbook Chapter 08 — "Dangers."`);
}
endModule(SL);

// ================================================================== 12 Where agencies are
{
  const s = content(SA, "Where agencies are: the HR feed, and the clouds");
  tag(s, "Who");
  const b = table(s, "Start", 1.45, [2.6, 9.55], ["Area", "What the guide assumes, and what it changes"], [
    ["HR feed", "Either Book 03's pipeline (Entra inbound provisioning from HR) is live, or accounts are still created from tickets: Gate 2 decides who writes each attribute"],
    ["Availability", "Nothing new is used. API-driven inbound provisioning is available in Azure for US Government, as are PIM, entitlement management, access reviews and Lifecycle Workflows"],
    ["GCC", "Entra ID is the commercial service"],
  ], { fontSize: 12.5, limit: 4.5 });
  panel(s, "Interim", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "INTERIM PATH", "Where the HR pipeline isn't live yet", [
    "SailPoint can't be measured against a source of authority",
    "Decide the writers now, and run Gates 3 to 6 against the HR extract the kit reads, until Book 03's pipeline lands",
  ], 13);
  sources(s, "Sources: Module 3, Unit 2; the guide's \"Where agencies start\" and Gate 2 availability (read Nov. 1, 2026) and interim path.");
  notes(s,
`Where are agencies? The guide assumes one of two starting points for the HR feed. Either the workbook's HR pipeline, Entra inbound provisioning from HR, is already live, or accounts are still created from tickets. Either way, Gate 2 decides who writes each attribute. For availability, Gate 2 uses nothing new. If API-driven inbound provisioning is the writer, Microsoft Learn's feature availability page lists it in Azure for U S Government, as are PIM, entitlement management, access reviews and Lifecycle Workflows, read on November 1, 2026. In GCC, Entra ID is the commercial service. The interim path: where the HR pipeline isn't live yet, SailPoint can't be measured against a source of authority. Decide the writers now, and run Gates 3 to 6 against the HR extract the kit reads.`,
  `${M} — Unit 2 "The writers and the approvers"; the guide — "Where agencies start"; "Step 2," Availability and Interim path.`);
}
endModule(SA);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence to keep");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.0, 8.15], ["Requirement", "What Gate 2 and the check show"], [
    ["SP 800-53 AC-5 Separation of Duties", "One approver system per class; the requester never approves"],
    ["CM-3; AC-2", "Each change class has a lane and a record type; one writer keeps account changes traceable"],
    ["Book 13's L4 acceptance", "Any autonomous class is accepted in writing by the authorizing official"],
    ["CM-6, CM-3, CM-4, CA-7, SI-4", "Each attribute has one writer, or the overlap is named; drift traced to its cause; checked before a change lands"],
  ], { fontSize: 12.5, limit: 4.5 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "Gate 2: the attribute map with each attribute's writer, the approver-per-class table, the lane table",
    "Chapter 08: the check's output and the data architect's decisions, kept with the provisioning configuration",
  ], 12.5);
  sources(s, "Sources: Module 3, Unit 1 \"The federal requirement\"; Unit 7 \"Summary\"; the guide's Gate 2 requirements; workbook Chapter 08, \"Federal requirements.\"");
  notes(s,
`The federal requirement. The guide maps Gate 2 to NIST special publication eight hundred fifty-three. A C five, separation of duties: one approver system per class, and the requester never approves. C M three, configuration change control: each change class has a lane and a change-record type. A C two, account management: one writer per attribute keeps account changes traceable to the source. And the workbook's design requires the authorizing official to accept any autonomous class in writing. Chapter 08 maps the check to configuration settings, change control, impact analysis, continuous monitoring and system monitoring. The evidence an ISSO keeps: the attribute map with each writer, the approver and lane tables, and the check's output with the data architect's decisions.`,
  `${M} — Unit 1 "The federal requirement"; Unit 7 "Summary"; the guide — Gate 2 requirements and evidence; workbook Chapter 08 — "Federal requirements and evidence."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on two writers", [
    { q: "Why did adding --alias title=jobTitle add a Finding?", options: ["a. SailPoint's names are the connector's, so without the alias the second writer of jobTitle was invisible", "b. The alias tells Entra ID to stop writing title", "c. The alias turns on a stricter check mode"] },
    { q: "Gate 2 offers two writer patterns. Which choice does it rule out?", options: ["a. Entra inbound provisioning stays the door, and SailPoint governs entitlements", "b. SailPoint becomes the provisioning service", "c. Both Entra inbound provisioning and SailPoint write HR-mastered attributes"] },
  ], "1 a: the alias list is a reviewed input; the check doesn't guess. 2 c: \"Not both.\"");
  sources(s, "Sources: Module 3, Unit 6 \"Knowledge check,\" questions 2 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions from the module's knowledge check. First: why did adding the alias from title to job title add a Finding? The answer is a. SailPoint's field names are the connector's, so without the alias the second writer of job title was invisible. The check doesn't guess name pairs; the alias list is a reviewed input. Second: Gate 2 offers two writer patterns. Which choice does it rule out? The answer is c: both Entra inbound provisioning and SailPoint writing HR-mastered attributes. In the guide's words, not both. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 2 and 4; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 4, the starting drift");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Learned Gate 2's decisions: one writer per attribute, one approver system per class, a lane per change class",
    "Checked two provisioning configurations for attributes with two writers",
    "Saw why the alias list and the directory name are inputs a reviewer confirms",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 4: Sources and the starting drift", [
    "Gate 3: connect and correlate the sources",
    "Measure drift over two days, and compare the runs",
  ], 13.5);
  callout(s, "Ship", Math.max(l, r) + 0.3, 0.9, "FaListCheck", HEX.teal, "Before you ship: ",
    "work through the Chapter 08 checklist, and run the check whenever either provisioning configuration changes.");
  sources(s, "Sources: Module 3, Unit 7 \"Summary\"; Module 4, Unit 1; workbook Chapter 08, \"Checklist,\" \"Federal requirements and evidence.\"");
  notes(s,
`To sum up. You learned Gate 2's decisions: one writer per attribute, one approver system per authority class, and a lane and change-record type for each change class. You checked two provisioning configurations for attributes with two writers, and read each Finding, Warn and Info line. And you saw why the alias list and the directory name are inputs a reviewer has to confirm. Before you ship, work through the Chapter 08 checklist, and run the check whenever either provisioning configuration changes. Next is Module 4, sources and the starting drift: Gate 3 connects HR, Entra ID and SailPoint on one key, and you'll measure how far the directory is from HR over two days, and compare the runs without hiding what wasn't measured.`,
  `${M} — Unit 7 "Summary"; workbook Chapter 08 — "Checklist," "Federal requirements and evidence"; Module 4, Unit 1.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/ticket-to-machine/03-one-writer-per-attribute.md (Ticket-to-Machine learning path, Module 3), Units 1 to 7, and the path's index. Its verification log (docs/training/ticket-to-machine/_verification) says every fact is on a page the module links; the deck uses only those pages.",
  "Pages the module sends you to: the example guide, \"The loop at a glance\" (the four gaps), \"Step 2: Decide the writers and the approvers\" (the two writer patterns, the approver-per-class example, the lane table, Gate 2 requirements and evidence, availability read November 1, 2026, interim path), \"Validate (G2)\" and \"Where agencies start\"; Book 13, Appendix B, \"Change classes and their lanes.\"",
  "Developer workbook Chapter 08 (why this is a build, what exists, what this chapter adds, Lab 1, Lab 2, federal requirements, dangers, checklist). NIST SP 800-53 Rev. 5 controls as the guide and Chapter 08 map them: AC-5, CM-3, AC-2, CM-6, CM-4, CA-7, SI-4.",
  "Lab output: a copy of examples/servicenow-sailpoint (writer_check.py, kit_calls.py, tests/fixtures/writers), run November 2, 2026 with Python 3.14.3, exactly as the module's Lab 1 gives the commands; the Try it output is trimmed where the slides say so. Lab 2 not run by the authors. Design guidance and inferences are labeled.",
]);

finish(OUT);
