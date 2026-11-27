// Data Platform and SQL Server Identity learning path, Module 9: Closure, Drift and Evidence — the module's narrated deck.
// Teaches docs/training/data-platform/09-closure-drift-and-evidence.md, Learn-style: objectives, the concepts (the five
// closure conditions; the closure record and what it can't settle; drift as a compliance finding), "Try it" slides with
// the module page's own Lab 1 commands and expected output, Lab 2, the federal requirement and evidence, a two-question
// check, and the summary. Every fact comes from the module page, workbook Chapter 09, the data platform book's Chapters 20
// and 21 and Runbook R09 that the page sends the learner to, or the kit (examples/sql-server-identity); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-dp-module-9/build.js \
//                      presentations/training-dp-module-9/Training_DP_Module_9.pptx
const TITLE = "Module 9: Closure, Drift and Evidence";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Data Platform and SQL Server Identity learning path, Module 9: Closure, Drift and Evidence",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and labels the title slide for the Microsoft Automation path; this path's title slide
// and document title are set here.
P.D.pres.title = `Data Platform and SQL Server Identity learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "DATA PLATFORM AND SQL SERVER IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_DP_Module_9.pptx";
const M = "Training, Data Platform, Module 9";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 9: Closure, Drift and Evidence", "Data Platform and SQL Server Identity learning path · Runbook R09, with workbook Chapter 09",
    ["The five closure conditions  ·  The closure record  ·  Drift as a compliance finding", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 9 of the Data Platform and SQL Server Identity learning path: closure, drift and evidence. It teaches Runbook R nine, continuous monitoring and closure, with Chapter 9 of the developer workbook, Building SQL Server Identity. You'll project an audit run onto the five closure conditions, see which fields the audit can't settle by itself, and compare two runs so a regression becomes a task. Take this module after Module 8.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why closure is a record, not a one-time action");
  tag(s, "Why");
  const l = panel(s, "Slide", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "AFTER THE MIGRATION", "An instance can slide back", [
    "An administrator switches it to mixed mode",
    "Someone creates a SQL login",
    "Someone adds a Windows login",
  ], 13.5);
  const r = panel(s, "Rec", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "SO CLOSURE IS", "A record that keeps coming back clean", [
    "Read on a schedule, every run",
    "Drift is the run that doesn't come back clean",
    "Each regression becomes a task",
  ], 13.5);
  callout(s, "Do", Math.max(l, r) + 0.3, 1.2, "FaRoute", HEX.navy, "In this module: ",
    "project an audit run onto the five closure conditions, see which fields the audit can't settle by itself, and compare two runs.");
  sources(s, "Sources: Module 9, \"Unit 1: Introduction\"; workbook Chapter 09, \"Goal and audience.\"");
  notes(s,
`Why does this matter? An instance brought to the Entra-exclusive posture can slide back. An administrator can switch it to mixed mode, create a SQL login, or add a Windows login. So closure isn't a one-time action. It's a record that keeps coming back clean on a schedule, and drift is the run that doesn't. In this module you project an audit run onto the five closure conditions, see which fields the audit can't settle by itself, and compare two runs so a regression becomes a task.`,
  `${M} — Unit 1 "Introduction"; workbook Chapter 09, "Goal and audience."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 9", [
    "Name the five closure conditions and the fields the closure record shows for each",
    "Explain why two fields are always external, and why a record with nothing NOT MET is \"ready for the assessor\", never \"closed\"",
    "Run the kit's closure record and drift comparison on the day-1 and day-30 fixtures, with and without the exception registry",
    "Say what the drift check catches, and why Arc going offline needs an Arc snapshot with each run",
  ], [
    "Module 8",
    "The audit of Module 2 and the Arc snapshot of Module 3: the closure record reads both",
  ], 55);
  sources(s, "Sources: Module 9, \"Learning objectives,\" \"Prerequisites.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll name the five closure conditions and the fields the closure record shows for each. You'll explain why two fields are always external, and why a record with nothing not met is ready for the assessor, never closed. You'll run the kit's closure record and drift comparison on the day-one and day-thirty fixtures, with and without the exception registry. And you'll say what the drift check catches, and why Arc going offline needs an Arc snapshot with each run. Before you start, finish Module 8. The closure record reads the audit from Module 2 and the Arc snapshot from Module 3.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 The five closure conditions
{
  const s = content(SC, "The five closure conditions");
  tag(s, "What");
  const b = table(s, "Cond", 1.45, [3.6, 8.55], ["Condition", "What shows it"], [
    ["1  No usable Windows-backed principal", "No enabled type U or G login holding CONNECT SQL, other than the break-glass group in the exception registry"],
    ["2  SQL Authentication eliminated", "No type S logins outside the registry; sa disabled and renamed; IsIntegratedSecurityOnly = 1, and on SQL Server 2025 IsExternalAuthenticationOnly = 1"],
    ["3  Entra observed working, nothing else", "Every usable login type E or X; Entra sign-in logs and SQL Server Audit; no remote NTLM or KERBEROS connections"],
    ["4  A cloud identity for the engine", "Arc agent connected, SQL extension deployed, Entra authentication configured; not supported on failover cluster instances"],
    ["5  MFA for every human", "Enforced by Conditional Access; verified in the sign-in logs and Conditional Access reports"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "One", "All five at once, on every production instance. LoginMode = 1 proves only that SQL logins are refused.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 9, Unit 2; Data Platform: SQL Server Identity, Chapter 20, \"The five closure conditions\"; Runbook R09, Step 2.");
  notes(s,
`Unit 2 is the five closure conditions. The data platform book, Data Platform: SQL Server Identity, defines the transformation as complete when five conditions hold at the same time on every production instance. One: no usable Windows-backed principal, other than the break-glass group in the exception registry. Two: SQL Authentication eliminated. No SQL logins outside the registry, the S A account disabled and renamed, and SQL logins refused, which on SQL Server 2025 also needs is external authentication only set to one. Three: Entra authentication observed working, and nothing else: every usable login is an Entra type, the sign-in logs and SQL Server Audit show it, and there are no remote N T L M or Kerberos connections. Four: a cloud identity for the engine: the Arc agent connected, the SQL extension deployed, and Entra configured, which failover cluster instances don't support. Five: M F A for every human. None of them is a single engine setting. Login mode one proves only that SQL logins are refused.`,
  `${M} — Unit 2 "The five closure conditions": Chapter 20, "The five closure conditions"; workbook Chapter 09, "The closure record."`);
}

// ================================================================== 5 The closure record
{
  const s = content(SC, "The closure record, and what it can't settle");
  tag(s, "How");
  const l = panel(s, "Fld", 0.6, 1.45, 6.4, null, HEX.navy, HEX.navyTint, "ELEVEN FIELDS PER INSTANCE", "met, NOT MET or external", [
    "Entra sign-ins and audit, and MFA: always external; the record points at the logs, never copies them",
    "Condition 4: from the Arc snapshot; external without it",
    "The exception registry: a login, an instance or *, an approver and an expiry",
  ], 12.5);
  const r = panel(s, "Nar", 7.25, 1.45, 5.5, null, HEX.amber, HEX.amberTint, "NARROWER THAN CHAPTER 20", "Read these two by hand", [
    "Condition 3 checks login types, but doesn't join them to the Entra inventory",
    "The protocol field reads one snapshot, not the whole validation period",
  ], 12.5);
  callout(s, "Ready", Math.max(l, r) + 0.25, 1.4, "FaFileShield", HEX.teal, "Nothing NOT MET is \"ready for the assessor, with the external evidence\", never \"closed\": ",
    "the closure is the six live evidence sets: compliance records, Entra sign-in logs, NTLM telemetry, the sa report, the Conditional Access report and the exception registry.");
  sources(s, "Sources: Module 9, Unit 2; workbook Chapter 09, \"The closure record\"; Data Platform: SQL Server Identity, Chapter 21; Runbook R09.");
  notes(s,
`The kit's closure record shows eleven fields per instance, and each one is met, not met, or external. Fields the audit can't see are external joins: Entra sign-ins and audit, and M F A for every human, are always external. The record points at those logs and doesn't copy them. Condition four comes from the Arc snapshot, and is external without it. The exception registry names a login, an instance or a star for every instance, an approver and an expiry. The record is narrower than the book's field set in two places, so read those by hand: condition three checks login types but doesn't join them to the Entra inventory, and the protocol field reads one snapshot, not the whole validation period. An instance with nothing not met is ready for the assessor, with the external evidence. It's never closed. The book's Chapter 21, What Done Looks Like, names six live evidence sets that close the transformation: the compliance records, the Entra sign-in logs, the N T L M telemetry, the S A status report, the Conditional Access report and the exception registry.`,
  `${M} — Unit 2 "The five closure conditions": workbook Chapter 09, "The closure record"; Chapter 21, "The evidence artifacts as live outputs"; Runbook R09, Step 2.`);
}

// ================================================================== 6 Drift
{
  const s = content(SC, "Drift as a compliance finding");
  tag(s, "What");
  const b = table(s, "Drift", 1.45, [4.6, 7.55], ["Between two runs", "What the comparison does"], [
    ["A new usable Windows or SQL login", "A row, unless the exception registry excuses it: the break-glass group isn't drift"],
    ["An Entra login removed; sa re-enabled", "A row for each"],
    ["SQL authentication accepted again; remote NTLM back", "A row for each"],
    ["An instance not seen before", "A row"],
    ["The Arc agent going offline", "Nothing in the audit changes: reported as Arc regressed only with both runs' Arc snapshots"],
    ["Mixed mode set in the registry, not yet restarted", "Invisible: the audit reads the running mode; R09 adds a registry check of LoginMode"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "Task", b + 0.25, 1.0, "FaTriangleExclamation", HEX.amber, "A compliance violation, not an advisory signal: ",
    "open a task for each row. Building Ticket-to-Machine turns a drift row into a typed task.");
  sources(s, "Sources: Module 9, Unit 3; Data Platform: SQL Server Identity, Chapter 20, \"Drift detection\"; Runbook R09, Step 3; workbook Chapter 09, \"Drift,\" \"Dangers.\"");
  notes(s,
`Unit 3 is drift. A drift event is a regression between two runs, and the book treats each one as a compliance violation, not an advisory signal. The kit's comparison returns a row for a new usable Windows or SQL login, an Entra login removed, S A re-enabled, SQL authentication accepted again, remote N T L M back after none, or an instance not seen before. It applies the exception registry, so the break-glass group isn't drift. The Arc agent going offline changes nothing in the audit, so the comparison reports Arc regressed only when you give it both runs' Arc snapshots. And a mode changed in the registry but not yet restarted is invisible, because the audit reads the running mode. Runbook R nine adds a registry check of login mode for that. Each row is a finding: open a task for it. The workbook Building Ticket-to-Machine turns a drift row into a typed task.`,
  `${M} — Unit 3 "Drift as a compliance finding": Chapter 20, "Drift detection"; Runbook R09, Step 3; workbook Chapter 09, "Drift," "Dangers."`);
}
endModule(SC);

// ================================================================== 7 Try it: project day 30
{
  const s = content(SL, "Try it: project day 30 onto the closure conditions");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "$ Set-Location C:\\FMWLabs\\sql-server-identity-code\\sql-server-identity",
    "$ $Run = \"C:\\FMWLabs\\results\\data-platform-09\\lab1\\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')\"   # then New-Item ...",
    "# Step 1: project day 30 onto the closure conditions",
    "$ ./Invoke-SqlClosure.ps1 -AuditPath tests/fixtures/audit-day30/audit.json `",
    "      -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -ArcPath tests/fixtures/arc/arc.json -OutputPath \"$Run\\closure\"",
    "Instance Met NotMet External Record",
    "SQLFCI04   2      7        2 open",
    "SQLPRD01   9      0        2 ready for the assessor, with the external evidence",
    "SQLPRD02   3      6        2 open",
    "SQLPRD06   5      4        2 open",
    "Conditions not met:",
    "SQLPRD02 1 No usable Windows login    NOT MET",
    "...",
    "SQLFCI04 4 Entra configured           NOT MET",
    "SQLPRD06 2 SQL logins refused         NOT MET",
    "...",
    "Wrote 2 files and manifest.json to $Run/closure",
    "Evidence for CLOSURE (Project the audit onto the five closure conditions): CA-7, CM-6, AC-2; KSI-MLA-EVC, KSI-SVC-ACM",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED, PATHS SHORTENED; "..." MARKS CUTS)`, pt: 10 });
  line(s, "Why", "SQLPRD06 runs SQL Server 2025 with IsExternalAuthenticationOnly = 0. SQLFCI04 is a failover cluster instance.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Unit 4: Exercise: Lab 1,\" step 1; workbook Chapter 09, Lab 1, step 1.");
  notes(s,
`Try it. Lab 1 runs on the kit's fictional estate, with no tenant. Open PowerShell 7, go to the kit's folder, and make this run's results folder, named for the time you start. Step one projects day thirty onto the closure conditions. Sequel P R D oh one, migrated in Chapter 4, has nine fields met, none not met, and two external, so it's ready for the assessor, with the external evidence. The other three are open. Sequel P R D oh six fails SQL logins refused, although is integrated security only is one, because it runs SQL Server 2025 and is external authentication only is zero. Sequel F C I oh four is a failover cluster instance. It can't take Entra authentication as built, so it needs a re-platform or a dated exception. The last line names the evidence: C A seven, C M six and A C two.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," step 1; workbook Chapter 09, Lab 1, step 1.`);
}

// ================================================================== 8 Try it: SQLPRD01's record and the registry
{
  const s = content(SL, "Try it: one instance's record, and the registry");
  tag(s, "How");
  const c = code(s, "Rec", 0.6, 1.45, 12.15, [
    "# Step 2: read SQLPRD01's whole record",
    "$ Import-Csv \"$Run\\closure\\closure.csv\" | Where-Object Instance -eq SQLPRD01 | Format-Table -AutoSize",
    "Instance Condition                    Status",
    "SQLPRD01 1 No usable Windows login    met",
    "SQLPRD01 2 SQL logins refused         met",
    "...",
    "SQLPRD01 3 No remote NTLM or Kerberos met",
    "SQLPRD01 3 Entra sign-ins and audit   external",
    "SQLPRD01 4 Arc agent connected        met",
    "...",
    "SQLPRD01 5 MFA for every human        external",
    "# Step 3: read the exception registry",
    "$ Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1",
    "$ (Read-SqlJson tests/fixtures/audit-day30/exceptions.json).exceptions | Format-Table instance, login, approvedBy, expires -AutoSize",
    "instance login                  approvedBy           expires",
    "*        CONTOSO\\SQL-BreakGlass Authorizing official",
    "SQLFCI04 vendorhr_app           ISSO                 2027-06-30",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS)`, pt: 10 });
  line(s, "Ext", "The two external rows are evidence sets 2 and 5: Entra sign-in logs and the Conditional Access report.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Unit 4: Exercise: Lab 1,\" steps 2 and 3; workbook Chapter 09, Lab 1; Data Platform: SQL Server Identity, Chapter 21.");
  notes(s,
`Step two reads sequel P R D oh one's whole record. Every field the audit can settle is met. The two external rows are condition three's Entra sign-ins and audit, and condition five's M F A for every human. They're evidence sets two and five of the book's Chapter 21: the Entra sign-in logs and the Conditional Access report. Step three reads the exception registry. The break-glass group is excepted on every instance, with no expiry, approved by the authorizing official. The vendor login on sequel F C I oh four has a date: June 30, 2027, approved by the I S S O.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 2 and 3; workbook Chapter 09, Lab 1, steps 2 and 3.`);
}

// ================================================================== 9 Try it: what the registry does
{
  const s = content(SL, "Try it: see what the registry does");
  tag(s, "How");
  const c = code(s, "Reg", 0.6, 1.45, 12.15, [
    "# Step 4: the same record with no exception registry and no Arc snapshot",
    "$ Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1",
    "$ $day30 = Read-SqlJson tests/fixtures/audit-day30/audit.json",
    "$ Get-SqlClosureRecord -Audit $day30 -Exceptions @() |",
    "      Where-Object { $_.Instance -eq 'SQLPRD01' -and $_.Status -ne 'met' } | Format-Table -AutoSize",
    "Instance Condition                  Status",
    "SQLPRD01 1 No usable Windows login  NOT MET",
    "SQLPRD01 3 Only Entra logins remain NOT MET",
    "SQLPRD01 3 Entra sign-ins and audit external",
    "SQLPRD01 4 Arc agent connected      external",
    "SQLPRD01 4 SQL extension deployed   external",
    "SQLPRD01 4 Entra configured         external",
    "SQLPRD01 5 MFA for every human      external",
  ], { label: `TRY IT  ·  ${CAP} (ONE COMMAND WRAPPED)`, pt: 10.5 });
  line(s, "Bg", "Without the registry, the break-glass group fails conditions 1 and 3; without the Arc snapshot, condition 4 is external.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Unit 4: Exercise: Lab 1,\" step 4; workbook Chapter 09, Lab 1, step 4.");
  notes(s,
`Step four shows what the registry does. It builds the same instance's record with no exception registry and no Arc snapshot, and lists every field that isn't met. Without the registry, sequel P R D oh one's enabled break-glass group fails conditions one and three: it's a usable Windows login, and it isn't an Entra one. Without the Arc snapshot, all three fields of condition four become external. Nothing about the instance changed. Only what the record was given.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 4; workbook Chapter 09, Lab 1, step 4.`);
}

// ================================================================== 10 Try it: compare day 1 with day 30
{
  const s = content(SL, "Try it: compare day 1 with day 30");
  tag(s, "How");
  const c = code(s, "Cmp", 0.6, 1.45, 12.15, [
    "# Step 5: compare day 1 with day 30",
    "$ ./Compare-SqlAuditRun.ps1 -BeforePath tests/fixtures/audit-day1/audit.json -AfterPath tests/fixtures/audit-day30/audit.json `",
    "      -ExceptionsPath tests/fixtures/audit-day30/exceptions.json -OutputPath \"$Run\\drift\"",
    "Instance Drift            Detail",
    "-------- -----            ------",
    "SQLPRD06 New legacy login CONTOSO\\jdoe (U), sysadmin",
    "",
    "Wrote 2 files and manifest.json to $Run/drift",
    "Evidence for DRIFT (Compare two audit runs for regressions): CA-7, CM-6; KSI-MLA-EVC, KSI-SVC-ACM",
    "Drift is a compliance finding: open a task for each row (Building Ticket-to-Machine routes it).",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED, PATHS SHORTENED)`, pt: 10.5 });
  callout(s, "Bg", c + 0.3, 1.0, "FaRoute", HEX.navy, "One row: ",
    "a Windows user added to sysadmin on SQLPRD06. The break-glass group is in both runs and in the registry, so it isn't drift.");
  sources(s, "Sources: Module 9, \"Unit 4: Exercise: Lab 1,\" step 5; workbook Chapter 09, Lab 1, step 5, \"Drift.\"");
  notes(s,
`Step five compares day one with day thirty, with the exception registry applied. One row comes back: a Windows user, contoso J doe, added to the sys-admin role on sequel P R D oh six. That's a new legacy login, and a compliance finding: open a task for it. The break-glass group is in both runs and in the registry, so it isn't drift. Notice what this run wasn't given: either run's Arc snapshot, so it doesn't read Arc at all.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 5; workbook Chapter 09, Lab 1, step 5, "Drift."`);
}

// ================================================================== 11 Try it: the manifest, the tests, the runs
{
  const s = content(SL, "Try it: the manifest, the tests and your runs");
  tag(s, "How");
  const c = code(s, "Man", 0.6, 1.45, 12.15, [
    "# Step 6: open the drift manifest",
    "$ Get-Content \"$Run\\drift\\manifest.json\"",
    "  \"step\": \"DRIFT\",",
    "  \"mode\": \"read-only\",",
    "  \"asOf\": \"2026-12-20\",",
    "  \"controls\": [ \"CA-7\", \"CM-6\" ],",
    "  \"ksis\": [ \"KSI-MLA-EVC\", \"KSI-SVC-ACM\" ],",
    "  \"files\": [ { \"file\": \"drift.csv\", \"sha256\": \"307892c2e129ac27c959e0ed382de9c140fe43fa730ec5343a0767f8f8d19abf\" }, ...",
    "# Step 7: run this chapter's tests",
    "$ Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 09*' -Output None -PassThru | Select-Object PassedCount, FailedCount",
    "PassedCount FailedCount",
    "          8           0",
    "# Step 8: list your runs",
    "$ Get-ChildItem C:\\FMWLabs\\results\\data-platform-09\\lab1 -Name",
    "<run>",
  ], { label: `TRY IT  ·  ${CAP} (MANIFEST TRIMMED AND REFLOWED; "..." MARKS A CUT)`, pt: 10.5 });
  line(s, "Keep", "Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in $Run.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Unit 4: Exercise: Lab 1,\" steps 6 to 8; workbook Chapter 09, Lab 1, steps 6 and 7.");
  notes(s,
`Step six opens the drift manifest. It records the step, drift; its mode, read-only; the snapshot's date; the controls, C A seven and C M six; the K S Is to line up with; and the S H A two fifty-six of each file it wrote. Step seven runs this chapter's tests: eight pass, none fail. Step eight lists your runs, one line per run. There's nothing to clean up. The kit's folder is as you unzipped it, and this run's results stay in the run folder. Check your work: you can say why sequel P R D oh one is ready for the assessor but not closed, why sequel P R D oh six fails SQL logins refused, and why the new sys-admin login is drift while the break-glass group isn't.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 6 to 8 and "Check your work"; workbook Chapter 09, Lab 1, steps 6 and 7.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: schedule the runs against a test instance");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A test job host and a test instance, never production; a gMSA with a Windows login holding the read rights Export-SqlAuditSnapshot.ps1 states, never sysadmin, in the test registry with an approver and an expiry"],
    ["1 and 2", "Write a run script: one audit snapshot, the closure record, the comparison with the previous run; run it once by hand"],
    ["3 and 4", "Schedule it weekly as the gMSA, start it now and check the result; the runs are read-only"],
    ["Arc", "Before each run, someone with Reader in commercial Azure (AzureCloud) exports the Arc snapshot; the gMSA can't sign in to Azure"],
    ["5: back it out", "Unregister-ScheduledTask removes the task; the run folders stay as evidence, inside your boundary"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "Not", b + 0.3, 0.9, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "nothing on the instance changes, but no step's output has been seen.");
  sources(s, "Sources: Module 9, \"Unit 5: Exercise: Lab 2\"; workbook Chapter 09, \"Lab 2: a test instance.\"");
  notes(s,
`Lab 2 schedules the same runs against one test instance. It wasn't run by the authors. You need a test job host and a test instance, never production, and a group managed service account on the host. Its Windows login on the instance holds the read rights the audit exporter states, never sys-admin, and it's recorded in the test exception registry with an approver and an expiry. Write a run script that takes one audit snapshot, projects it onto the closure record, and compares it with the previous run. Run it once by hand, then schedule it weekly as the group managed service account. The runs are read-only. For condition four, someone with Reader in commercial Azure exports an Arc snapshot before each run, because the service account can't sign in to Azure. Step five backs it out by removing the scheduled task. The run folders stay as evidence, inside your boundary.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test instance)"; workbook Chapter 09, "Lab 2: a test instance."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [2.6, 2.6, 2.75, 4.2], ["What the output shows", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["CLOSURE: the closure record, each scheduled run", "CA-7; CM-6; AC-2", "KSI-MLA-EVC, KSI-SVC-ACM", "closure.csv and its manifest per instance per run; the exception registry with approvers; the external evidence each external field names"],
    ["DRIFT: the comparison, each scheduled run", "CA-7; CM-6", "KSI-MLA-EVC, KSI-SVC-ACM", "drift.csv and its manifest, and the task opened for each row"],
  ], { fontSize: 12.5, limit: 4.6 });
  line(s, "Man", "Each manifest records the step, its controls and KSIs, and the SHA-256 of each file.", b + 0.25, 0.45, 13.5);
  line(s, "Ass", "The records support these controls; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.8, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Unit 1\" (the federal requirement), \"Unit 7\"; NIST SP 800-53; FedRAMP 20x KSIs; workbook Chapter 09, \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. Chapter 9 maps the closure record to three NIST SP 800-53 controls: C A seven, continuous monitoring; C M six, the authentication settings, read every run; and A C two, which accounts can sign in. It maps the drift comparison to C A seven and C M six. Keep the closure file and its manifest per instance per run, the exception registry with its approvers, and the external evidence each external field names. For drift, keep the drift file, its manifest, and the task opened for each row. Each manifest records the step, its controls and K S Is, and the S H A two fifty-six of each file. Runbook R nine lists the evidence for the evidenced and operated control states. K S Is are FedRAMP twenty X indicators for cloud service providers: your cloud providers report against them, the agency doesn't. The records support these controls; the assessor decides whether the closure posture holds.`,
  `${M} — Unit 1 (the federal requirement), Unit 7 (evidence an ISSO keeps); workbook Chapter 09, "Federal requirements and evidence"; Runbook R09, control states.`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on closure", [
    { q: "SQLPRD01's day-30 record has nine fields met, none NOT MET and two external. What does the kit call it?", options: ["a. Closed", "b. Ready for the assessor, with the external evidence", "c. Open, until the two external fields are met"] },
    { q: "SQLPRD06 has IsIntegratedSecurityOnly = 1, yet \"SQL logins refused\" is NOT MET. Why?", options: ["a. It runs SQL Server 2025, and IsExternalAuthenticationOnly is 0", "b. sa is still enabled on it", "c. The snapshot has no Arc data for it"] },
  ], "1 b: the two external fields still need their evidence, and the assessor decides. 2 a: SQL Server 2025 also needs IsExternalAuthenticationOnly = 1.");
  sources(s, "Sources: Module 9, \"Unit 6: Knowledge check,\" questions 1 and 2, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: sequel P R D oh one's day-thirty record has nine fields met, none not met, and two external. What does the kit call it? The answer is b: ready for the assessor, with the external evidence. The two external fields still need their evidence, and the assessor decides. Second: sequel P R D oh six has is integrated security only set to one, yet SQL logins refused is not met. Why? The answer is a: it runs SQL Server 2025, and is external authentication only is zero. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 2; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary: closure that keeps coming back clean");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Projected the day-30 audit onto the five closure conditions",
    "Saw which fields wait on evidence from outside the audit",
    "Saw what the exception registry and the Arc snapshot change",
    "Compared day 1 with day 30, so a regression became a finding",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 10", [
    "Deploying to test and production",
    "Before shipping: the Chapter 09 checklist",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaFileShield", HEX.teal, "The rule: ",
    "closure is the record that keeps coming back clean on a schedule, and each drift row is a task.");
  sources(s, "Sources: Module 9, \"Unit 7: Summary\"; workbook Chapter 09, \"Checklist.\"");
  notes(s,
`To sum up. You projected an audit run onto the five closure conditions, saw which fields wait on evidence from outside the audit, saw what the exception registry and the Arc snapshot change, and compared two runs so a regression became a finding. Closure is the record that keeps coming back clean on a schedule, and each drift row is a task. Before shipping, work through the Chapter 9 checklist. Next, Module 10: deploying to test and production.`,
  `${M} — Unit 7 "Summary"; workbook Chapter 09, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 9 deck", [
  "Module page: docs/training/data-platform/09-closure-drift-and-evidence.md (Data Platform and SQL Server Identity learning path, Module 9): Introduction and the federal requirement, objectives, prerequisites, Units 2 and 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: Data Platform: SQL Server Identity, Chapter 20, The Closure Condition (the five closure conditions, the closure record's field set, drift detection) and Chapter 21, What Done Looks Like (the evidence artifacts as live outputs); Runbook R09, Continuous Monitoring and Closure, Steps 2 and 3 and its control states. NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 09, Closure, Drift and Evidence (Building SQL Server Identity): \"The closure record,\" \"Drift,\" Lab 1, Lab 2 (not run by the authors), \"Federal requirements and evidence,\" \"Dangers,\" \"Checklist.\" Kit: examples/sql-server-identity (Invoke-SqlClosure.ps1, Compare-SqlAuditRun.ps1, powershell/SqlIdentity, tests/fixtures).",
  "Lab output: the module page's Lab 1 expected output on the kit's fictional fixtures; trimmed, wrapped, reflowed and with paths shortened to $Run where the slides say so.",
]);

finish(OUT);
