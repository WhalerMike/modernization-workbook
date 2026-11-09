// HR-Driven Identity learning path, Module 1: Name one writer for every account state — the module's narrated deck.
// Teaches docs/training/hr-driven-identity/01-one-writer-per-state.md, Learn-style: objectives, the concepts, "Try it"
// slides with the real Lab 1 commands and output (run November 2, 2026 in a scratch copy of examples/hr-lifecycle), Lab 2,
// the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module page,
// the learning path's verification log, or the kit (examples/hr-lifecycle); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-hr-module-1/build.js \
//                      presentations/training-hr-module-1/Training_HR_Module_1.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 1: Name one writer for every account state",
  footer: "Federal Modernization Workbook  ·  HR-Driven Identity learning path, Module 1: Name one writer for every account state",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "HR-Driven Identity learning path — Module 1: Name one writer for every account state";
const OUT = process.argv[2] || "Training_HR_Module_1.pptx";
const M = "Training, HR-Driven Identity, Module 1";

// The title slide, as shared.js draws it, with this path's name over the units.
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "HR-DRIVEN IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 1: Name one writer for every account state", "HR-Driven Identity learning path · Gate G1 Writers, with workbook Chapter 01",
    ["Why one writer comes first  ·  The register  ·  The register check  ·  The audit-log scan", "What the scan can't see  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 1 of the HR-Driven Identity learning path: name one writer for every account state. The HR pipeline makes an account exist. This path teaches what happens to that account afterward, how the HR record decides every change, and how you prove that it did. There are seven modules, one for each gate of the HR-driven identity implementation guide, and this one is Gate 1, Writers, with Chapter 01 of the developer workbook. It comes before every other gate. In it you'll read the lifecycle rows of a writer register, check the register's shape, and scan a month of directory audit records for writes by anyone but the named writer. The code runs on your laptop against fictional fixtures. It's illustrative: unit-tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why two writers on one value is a problem");
  tag(s, "Why");
  const b = table(s, "Writers", 1.45, [3.3, 3.6, 5.25], ["Writer", "What it can write", "When two writers meet"], [
    ["The HR feed", "An account's active value", "A late active true from the pipeline undoes the workflow's disable"],
    ["A Lifecycle Workflows leaver", "Disables the same account", "The later write wins, whichever it is"],
    ["A help desk technician", "A user's organization code", "The person's access moves without HR knowing"],
  ], { fontSize: 13.5, limit: 4.4 });
  callout(s, "Point", b + 0.35, 0.95, "FaUserShield", HEX.red, "This module: ",
    "name one writer, and a backstop, for every account-state transition and HR-mastered value, and test the audit log against that list.");
  sources(s, "Sources: Module 1, \"Introduction.\"");
  notes(s,
`Why does this come first? Picture three writers. Your HR feed sets an account's active value. A Lifecycle Workflows leaver can disable the same account. And a help desk technician can still edit a user's organization code. Each of those is a writer, and when two of them write the same value, the later one wins. So a late active true from the pipeline undoes the workflow's disable. A help desk edit to the organization code moves the person's access, and HR never knows. In this module you fix that before any other gate. You name one writer, and a backstop, for every account-state transition and every HR-mastered value, and then you test the directory audit log against that list.`,
  `${M} — Unit "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Explain why one writer per account state comes before every other gate",
    "Read the lifecycle rows of the writer register, and say which writer and backstop each names",
    "Run the register check and the audit-log scan, and read their findings",
    "Say what the scan can't see, and what covers it",
  ], [
    "The path's prerequisites: Book 03's overview; Microsoft Automation Modules 1 and 2; Python basics",
    "Lab 1: Python 3.10+ and pytest, and a clone; no tenant",
    "Lab 2: a worldwide or GCC test tenant, never production",
  ], 50);
  sources(s, "Sources: Module 1, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"Prerequisites,\" \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll explain why one writer per account state comes before every other gate. You'll read the lifecycle rows of the writer register and say which writer and which backstop each row names. You'll run the register check and the audit-log scan, and read what they find. And you'll say what the scan can't see, and what covers it. Before you start, you need the path's prerequisites: at least the overview of the Federal Modernization Workbook's HR-Driven Identity book, Microsoft Automation Modules 1 and 2, and enough Python to run a script and read JSON. Lab 1 needs Python 3.10 or later, pytest and a clone of the repository, and no tenant. Lab 2 needs a worldwide or GCC test tenant, never production.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "Prerequisites," "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 The rows
{
  const s = content(SC, "The lifecycle rows: one writer and a backstop each");
  tag(s, "What");
  const b = table(s, "Rows", 1.45, [4.6, 3.3, 4.25], ["Row (config/writer-register.json)", "Writer", "Backstop"], [
    ["Account created", "inbound-provisioning", "None"],
    ["Enabled at hire; disabled at separation; re-enabled on cancel", "inbound-provisioning", "lifecycle-workflows"],
    ["Deleted at disposition", "lifecycle-workflows", "None; inbound-provisioning is forbidden"],
    ["Hire date, leave date, manager", "inbound-provisioning", "None"],
    ["Organization code, worker type code", "inbound-provisioning", "ad-sync (interim)"],
    ["Certificate binding (certificateUserIds)", "cms-integration", "None"],
  ], { fontSize: 12.5, limit: 5.1 });
  callout(s, "Delete", b + 0.3, 0.95, "FaTriangleExclamation", HEX.navy, "Notice deletion: ",
    "the post-separation workflow writes it, and inbound provisioning never does.");
  sources(s, "Sources: Module 1, Unit 1 \"Why one writer comes first\"; examples/hr-lifecycle/config/writer-register.json (fictional identities).");
  notes(s,
`Here's the register you'll check in the lab. It's the guide's table of lifecycle rows, kept as reviewed JSON. Each row is an account-state transition or an HR-mastered value, and each names exactly one writer and, where there is one, a backstop. Inbound provisioning creates the account. It enables it at hire, disables it at separation, and re-enables it if a separation is cancelled, with Lifecycle Workflows as the backstop for all three. It writes the hire date, the leave date and the manager. The organization code and worker type code have the directory sync as an interim backstop, for synced users until Active Directory retires. The card management system's integration writes the certificate binding. And notice deletion: the post-separation workflow writes it, and inbound provisioning never does. The register forbids it.`,
  `${M} — Unit 1 "Why one writer comes first"; examples/hr-lifecycle/config/writer-register.json.`);
}

// ================================================================== 5 Writers
{
  const s = content(SC, "Four named writers, and why a writer is access");
  tag(s, "What");
  const l = panel(s, "Writers", 0.6, 1.45, 6.6, null, HEX.navy, HEX.navyTint, "THE REGISTER'S WRITERS", "Named groups of identities", [
    "inbound-provisioning: the HR app and the contractor-source app, through the same middleware",
    "lifecycle-workflows: the workflow tasks that enable, disable and delete",
    "cms-integration: writes the PIV binding (Gate 5)",
    "ad-sync: interim, the sync agent, for synced users until AD retires",
  ], 13);
  const r = panel(s, "Why", 7.45, 1.45, 5.3, null, HEX.teal, HEX.tealTint, "WHY BOOK 03 CARES", "A writer is an access decision", [
    "Whoever can write a slot decides what a rule on it grants",
    "The pipeline's active value and Lifecycle Workflows' tasks can both write account state",
  ], 13);
  callout(s, "Signed", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.navy, "Signed and scoped: ",
    "the register records who signed it and when, and carries a versioned scope filter.");
  sources(s, "Sources: Module 1, Unit 1 (Book 03, Ch 06 \"Writers\"; Ch 04 \"Operating rules\"); Summary; examples/hr-lifecycle/config/writer-register.json.");
  notes(s,
`The register names four writers, and each one is a named group of identities, so the scan can tell who made a write. Inbound provisioning is the HR app and the contractor-source app, which come through the same middleware. Lifecycle Workflows is the set of workflow tasks that enable, disable and delete. The card management integration writes the PIV binding, which is Gate 5's business. And the sync agent is an interim writer, for synced users until Active Directory retires. Why does the workbook's design treat this so seriously? Because whoever can write a slot decides what a rule on that slot grants. A writer is an access decision. And the pipeline's active value and the workflows' tasks can both write account state, so without a register, they collide. The register is signed, and carries a versioned scope filter.`,
  `${M} — Unit 1 "Why one writer comes first": Book 03, Chapter 06 — "Writers"; Chapter 04 — "Operating rules"; examples/hr-lifecycle/config/writer-register.json.`);
}

// ================================================================== 6 Register check
{
  const s = content(SC, "The register check: WR-01 to WR-09");
  tag(s, "What");
  const b = table(s, "WR", 1.45, [1.3, 1.3, 9.55], ["Rule", "Severity", "What it catches"], [
    ["WR-01", "Finding", "A row with no single named writer, or a row that appears twice"],
    ["WR-02", "Finding", "A writer or backstop that isn't defined under writers"],
    ["WR-03", "Warn", "A writer with no identities, so the scan can't attribute its writes"],
    ["WR-04", "Finding", "A required account-state transition with no row"],
    ["WR-05", "Finding", "Deletion written by inbound provisioning"],
    ["WR-06", "Finding", "A backstop that is the writer itself"],
    ["WR-07", "Finding", "Rows for the same audited change that name different writers"],
    ["WR-08, WR-09", "Warn", "The register isn't recorded as signed; the scope filter has no version"],
  ], { fontSize: 12.5, limit: 5.7 });
  line(s, "Exit", "Exit codes, for every tool in the kit: 0 clean, 2 findings or warnings, 1 error.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 1, Unit 2 \"The register and the scan\"; examples/hr-lifecycle: python/writer_register.py, README \"Commands.\"");
  notes(s,
`The kit checks the register in two ways. The first is the register check, rules W R oh one to oh nine, which test the register's shape before you trust it. A row must name a single writer and appear only once. Every writer and backstop must be defined. A writer with no identities gets a warning, because the scan couldn't attribute its writes. Every required account-state transition, created, enabled, disabled, re-enabled and deleted, needs a row. Deletion must never be written by inbound provisioning. A backstop can't be the writer itself. Two rows for the same audited change can't name different writers. And the register should be recorded as signed, with a versioned scope filter. Every tool in the kit uses the same exit codes: zero when clean, two for findings or warnings, one for an error.`,
  `${M} — Unit 2 "The register and the scan": workbook Chapter 01, "The checks"; examples/hr-lifecycle/python/writer_register.py; README "Commands."`);
}

// ================================================================== 7 The scan
{
  const s = content(SC, "The audit-log scan: every protected write, judged");
  tag(s, "What");
  const b = table(s, "WS", 1.45, [2.6, 1.3, 8.25], ["Who made the write", "Rule", "Result"], [
    ["The row's writer", "—", "Counted as writer; no finding"],
    ["The row's backstop", "WS-02", "Warn: confirm the writer acted or was late"],
    ["Anyone else", "WS-01", "Finding: a second writer"],
    ["A writer the row forbids", "WS-04", "Finding: inbound provisioning deleting an account, for example"],
  ], { fontSize: 13, limit: 3.8 });
  const l = panel(s, "Reads", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "WHAT IT READS", null, [
    "A directoryAudits export, successful records in the window",
    "Matched on the activity, and for an Update user on the modifiedProperties name",
  ], 13);
  panel(s, "Writes", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "WHAT IT WRITES", null, [
    "An output folder whose manifest.json holds each file's SHA-256",
    "queries.json: one saved directoryAudits filter per row, which Module 7 runs",
  ], 13);
  sources(s, "Sources: Module 1, Unit 2; Lab 1, steps 3 and 5; examples/hr-lifecycle: python/writer_register.py, README.");
  notes(s,
`The second check is the scan. It reads an export of the directory audit log, keeps the successful records inside the window you give it, and matches each one to a row of the register: by the activity, such as Disable account, and for an Update user record, by the name of the property that changed. Then it judges who made the write. The row's writer is fine. The backstop gets W S oh two, a warning: confirm the writer acted, or find out why it was late. Anyone else is W S oh one, a second writer, and that's a finding. And a writer the row forbids, like inbound provisioning deleting an account, is W S oh four. The scan writes an output folder with a manifest that holds each file's hash, and a saved query for every row, which Module 7 runs.`,
  `${M} — Unit 2 "The register and the scan"; Lab 1, steps 3 and 5; examples/hr-lifecycle/python/writer_register.py.`);
}

// ================================================================== 8 Can't see
{
  const s = content(SC, "What the scan can't see, and what it can't confirm");
  tag(s, "What");
  const l = panel(s, "AD", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "OUTSIDE THE ENTRA AUDIT LOG", "Writes made in Active Directory", [
    "For synced users, a write in AD never reaches this scan",
    "Only AD change auditing sees it",
    "The guide's interim path names the sync agent as a writer and reviews the OU ACLs",
  ], 13);
  const r = panel(s, "Names", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "UNCONFIRMED", "The audit property names", [
    "Each auditProperty is the program's reading, not Learn's: Learn doesn't document the names",
    "A wrong name makes the scan report nothing for that value",
    "Silence looks clean",
  ], 13);
  callout(s, "Lab2", Math.max(l, r) + 0.3, 0.95, "FaListCheck", HEX.amber, "So Lab 2 matters here: ",
    "confirm each name against a real audit record before the scan counts as evidence.");
  sources(s, "Sources: Module 1, Unit 2; Lab 2; Knowledge check answers 3 and 4; examples/hr-lifecycle README, \"Not covered.\"");
  notes(s,
`Two limits. First, what the scan can't see. For synced users, a write made in Active Directory never reaches the Entra audit log this scan reads. Only Active Directory's own change auditing sees it. The guide's interim path covers that: it names the sync agent as a writer in the register, and reviews the access control lists on the organizational units. Second, what the scan can't confirm. To match an Update user record, the register names the property that changed. Learn doesn't document those names, so each one is the program's reading. If a name is wrong, the scan reports nothing for that value, and silence looks exactly like a clean month. That's why Lab 2 matters more here than in most modules. Confirm every property name against a real audit record before the scan counts as evidence.`,
  `${M} — Unit 2 "The register and the scan": workbook Chapter 01, "What the scan doesn't see," "Dangers"; Lab 2; Knowledge check answers 3 and 4.`);
}
endModule(SC);

// ================================================================== 9 Try it: list and check
{
  const s = content(SL, "Try it: what the scan reads, and the register check");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 8.0, [
    "# Lab 1, steps 1 and 2, in examples/hr-lifecycle",
    "$ python python/graph_export.py --task writers-scan --list",
    "Task writers-scan: AuditLog.Read.All, Directory.Read.All",
    "  GET /auditLogs/directoryAudits  [AuditLog.Read.All]",
    "  GET /auditLogs/provisioning  [AuditLog.Read.All, Directory.Read.All]",
    "",
    "$ python python/writer_register.py check \\",
    "    --register config/writer-register.json",
    "Register: 0 Finding, 0 Warn, 0 Info",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026", pt: 11.5 });
  panel(s, "Read", 8.85, 1.45, 3.9, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "Two GET calls, two read permissions",
    "--list prints them; nothing signs in",
    "The register passes WR-01 to WR-09",
    "Exit code 0",
  ], 13);
  line(s, "Note", "Long commands are wrapped with a trailing backslash; type them as the module page writes them.", c + 0.3, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 1 and 2; examples/hr-lifecycle: graph_export.py, writer_register.py, config/calls.json.");
  notes(s,
`Try it. Lab 1 runs in the hr-lifecycle folder of the examples, on fictional fixtures, and nothing in it signs in to anything or sends a request. Step one lists what the scan reads, and with what permission. The list option prints the task's calls without making them: two GET calls against the audit logs, the directory audits and the provisioning logs, which need AuditLog dot Read dot All and Directory dot Read dot All. Those are the only two permissions a real run would need. Step two checks the program's register. It comes back with zero findings, zero warnings and zero information items, and an exit code of zero, so the register's shape passes every W R rule. That's the precondition for the scan: a register you've checked is one you can test the audit log against.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 10 Try it: scan
{
  const s = content(SL, "Try it: scan a month of audit records");
  tag(s, "How");
  const c = code(s, "Scan", 0.6, 1.45, 8.0, [
    "# Lab 1, step 3: scan October's audit records",
    "$ python python/writer_register.py scan \\",
    "    --register config/writer-register.json \\",
    "    --audit tests/fixtures/ch01/directory-audits.json \\",
    "    --since 2026-10-01 --until 2026-10-31 \\",
    "    --cloud gcc --out out/ch01",
    "Protected writes: 11 (writer 5, backstop 1,",
    "  second writer 4, forbidden 1)",
    "Writers: 5 Finding, 1 Warn, 0 Info",
    "Written to out/ch01 (manifest.json lists every",
    "  file's SHA-256)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (WRAPPED)", pt: 11.5 });
  panel(s, "Read", 8.85, 1.45, 3.9, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "11 protected writes in October",
    "5 by the writer, 1 by the backstop",
    "4 by a second writer, 1 forbidden",
    "Exit code 2: the fixture holds findings",
  ], 13);
  line(s, "Cloud", "--cloud has no default: gcc, gcchigh or dod picks the Graph host the saved queries are for.", c + 0.3, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" step 3; examples/hr-lifecycle: writer_register.py, README \"Commands\" (clouds).");
  notes(s,
`Step three scans October's audit records against the register. You give it the register, the audit export, a window from the first to the thirty-first of October, the cloud, and an output folder. The cloud option has no default; G C C, G C C High or D O D picks the Graph host. The scan found eleven protected writes. Five were by the writer the row names, which is what you want. One was by the backstop. Four were by a second writer, someone the register doesn't name at all. And one was by a writer the register forbids. That's five findings and one warning, so the exit code is two. The output folder's manifest lists every file's hash, so the run can be checked later. The output on the slide is wrapped to fit.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 3; examples/hr-lifecycle README — "Commands."`);
}

// ================================================================== 11 Try it: findings
{
  const s = content(SL, "Try it: read the findings and a saved query");
  tag(s, "How");
  const c = code(s, "Find", 0.6, 1.45, 12.15, [
    "# Step 4: python -c \"import json; [print(r['Rule'], r['Severity'], r['Object'], '|', r['Issue']) for r in ...]\"",
    "WS-01 Finding casey.ng@contoso.example | disabled-at-separation written by pat.helpdesk@contoso.example, ...",
    "WS-01 Finding morgan.lee@contoso.example | employeeLeaveDateTime written by sam.exchange@contoso.example, ...",
    "WS-01 Finding drew.park@contoso.example | manager written by pat.helpdesk@contoso.example, ...",
    "WS-01 Finding quinn.ross@contoso.example | orgCode written by OrgCode fix-up script, ...",
    "WS-04 Finding blake.ito@contoso.example | deleted-at-disposition written by inbound-provisioning, which the register forbids",
    "WS-02 Warn jordan.diaz@contoso.example | enabled-at-hire written by the backstop (lifecycle-workflows); ...",
    "# Step 5: python -c \"import json; print(json.load(open('out/ch01/queries.json'))[2])\"",
    "{'allowed': ['inbound-provisioning', 'lifecycle-workflows'], 'graphFilter': \"activityDateTime ge 2026-10-01T00:00:00Z",
    "  and activityDateTime le 2026-10-31T23:59:59Z and activityDisplayName eq 'Disable account'\", ...",
    "  'row': 'disabled-at-separation'}",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10 });
  line(s, "Tests", "Step 6: python -m pytest tests -q prints 57 passed. Then rm -rf out.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 4 to 6; examples/hr-lifecycle/tests/fixtures/ch01 (fictional records).");
  notes(s,
`Step four prints the findings, one line each. Four are W S oh one, second writers: a help desk technician disabled an account, an Exchange administrator edited a leave date, the help desk changed a manager, and a fix-up script wrote an organization code. None of them is inbound provisioning, the writer every one of those rows names. One is W S oh four: inbound provisioning deleted an account, which the register forbids. And one is the W S oh two warning: the backstop, Lifecycle Workflows, enabled a hire, so you confirm the pipeline acted or find out why it was late. Step five prints one saved query, the third, for the disabled-at-separation row: a filter on Disable account inside the window, with the pipeline and the workflows allowed. Step six runs the tests, fifty-seven pass, and you delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 4 to 6.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: scan your own test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant, never production"],
    ["Make two writes", "Two known changes in the admin center, then export the audit window"],
    ["Confirm the names", "Check the modifiedProperties names the register expects against the real records"],
    ["Scan", "Put your tenant's service principal IDs in a copy of the register, and scan: both changes should be WS-01"],
    ["Permissions", "A reader app with a certificate: AuditLog.Read.All and Directory.Read.All, application, admin consent; nothing else"],
    ["Back it out", "Restore the test users' values; remove the permissions; delete the app, its certificate, the export and output"],
  ], { fontSize: 12.5, limit: 5.4 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the steps are the workbook's Lab 2, written from Microsoft Learn's procedures.");
  sources(s, "Sources: Module 1, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 runs the same scan against your own test tenant, worldwide or G C C, never production. Make two known writes in the admin center, then export the audit window that holds them. Before you scan, confirm the property names the register expects against the real records. That's the step that turns the scan into evidence. Then put your tenant's service principal I D's in a copy of the register, and scan. Both of your admin center changes should come back as W S oh one, second writers. The reader app needs a certificate and two application permissions with admin consent, AuditLog dot Read dot All and Directory dot Read dot All, and nothing else. To back it out, restore the test users' values, remove the permissions, and delete the app, its certificate, the export and the output. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate 1");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.2, 8.95], ["NIST SP 800-53", "What Gate 1 does for it"], [
    ["AC-2 Account management", "Met by the register: one writer and a backstop per transition and HR-mastered value"],
    ["IA-4 Identifier management", "Met by the register, with AC-2"],
    ["AU-6 Audit review", "Met by reviewing writes outside the named writer: the audit-log scan"],
  ], { fontSize: 13, limit: 3.6 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "The signed register, with its lifecycle rows and the versioned scope filter",
    "The check output, and the scan's output folder with its manifest and the saved queries.json",
    "The AD auditing settings, which this code doesn't read",
  ], 13);
  sources(s, "Sources: Module 1, \"Introduction\" (the federal requirement); \"Summary\" (the evidence an ISSO keeps).");
  notes(s,
`The federal requirement. This gate supports NIST special publication eight hundred fifty-three A C two, account management, and I A four, identifier management, through the register. And it supports A U six, audit review, by reviewing writes made outside the named writer, which is what the scan does. The guide's Gate 1 requirements table and the workbook chapter carry the details. Your organization still sets the organization-defined parameters, and the assessor decides whether each is satisfied. The evidence an ISSO keeps for Gate 1: the signed register, with its lifecycle rows and the versioned scope filter; the output of the register check; the scan's output folder, with its manifest and the saved queries; and the Active Directory auditing settings, which this code doesn't read, because writes in Active Directory never reach the scan.`,
  `${M} — Unit "Introduction" (the federal requirement); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on writers", [
    { q: "HR and the leaver workflow can both disable an account. What does that row record?", options: ["a. Both, as equal writers, so either can act first", "b. One writer, with the other recorded as its backstop", "c. Neither; account state is left to the help desk"] },
    { q: "Which writes does the Entra audit-log scan not see?", options: ["a. Writes by Lifecycle Workflows", "b. Writes by the HR provisioning app", "c. Writes made in Active Directory for synced users"] },
  ], "1 b: one writer per row, and a backstop that isn't the writer (WR-01, WR-06). 2 c: only AD change auditing sees AD writes.");
  sources(s, "Sources: Module 1, \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: your HR feed and the leaver workflow can both disable an account. What does the register record for the disabled-at-separation row? The answer is b: one writer, with the other recorded as its backstop. The register check enforces it: one writer per row, and a backstop that isn't the writer itself. Second: which writes does the Entra audit-log scan not see? The answer is c: writes made in Active Directory for synced users. Only Active Directory's change auditing sees those, and the guide's interim path names the sync agent as a writer and reviews the access control lists. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 2, contractor sources");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Checked a writer register's shape",
    "Scanned a month of audit records against it",
    "Read the saved query Gate 7 runs",
    "Saw four second writers, one forbidden delete and one backstop that acted first",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2: Run contractors from their own source", [
    "Each contractor's earliest end",
    "A read-only reconciliation",
    "The sponsor review",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaUserShield", HEX.teal, "Carry forward: ",
    "inbound provisioning writes the leave date and the active value, for contractors too.");
  sources(s, "Sources: Module 1, \"Summary\"; Module 2, \"Prerequisites,\" \"Introduction.\"");
  notes(s,
`To sum up. You checked a writer register's shape, scanned a month of audit records against it, and read the saved query that Gate 7 runs. Along the way you saw four second writers, one forbidden delete, and one backstop that acted first. Carry one thing forward: inbound provisioning writes the leave date and the active value, and that's true for contractors too. Next is Module 2: run contractors from their own source. Contractors don't come from HR, and an end date nobody updates keeps access alive. In Module 2 you'll compute each contractor's earliest end, reconcile the register, the card system and the directory without changing anything, and write a sponsor review that removes access when nobody responds.`,
  `${M} — Unit "Summary"; Module 2 — "Prerequisites," "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/hr-driven-identity/01-one-writer-per-state.md (HR-Driven Identity learning path, Module 1): Introduction, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design and rules: the HR-driven identity implementation guide, Step 1 and its Gate 1 requirements table; Book 03, Chapter 06 \"Writers\" and Chapter 04 \"Operating rules\"; workbook Chapter 01, \"The checks,\" \"What the scan doesn't see,\" \"Dangers.\"",
  "Kit: examples/hr-lifecycle (README; config/writer-register.json; config/calls.json; python/writer_register.py; python/graph_export.py; tests/fixtures/ch01). Fictional identities. Illustrative: unit-tested against fixtures, not run against a live tenant.",
  "Lab output: run November 2, 2026 with Python 3.14.3 in a scratch copy of examples/hr-lifecycle; long commands are wrapped and the findings are trimmed where the slides say so. Verification: docs/training/hr-driven-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
