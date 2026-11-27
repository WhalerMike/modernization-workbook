// Data Platform and SQL Server Identity learning path, Module 10: Deploying to Test and Production — the module's narrated deck.
// Teaches docs/training/data-platform/10-deploying-to-test-and-production.md, Learn-style: objectives, the concepts
// (settings and preflight; the plan and its three approved hashes; create, cutover and the way back; go or no-go, the
// seal, production and the break-glass path), "Try it" slides with the module page's own Lab 1 commands and expected
// output (a dry-run rehearsal of the test stage), Lab 2, the federal requirement and evidence, a two-question check, and
// the summary. Every fact comes from the module page, workbook Chapter 10, Runbook R05, the data platform book's Chapter 12
// and Appendix B that the page sends the learner to, or the kit (examples/sql-server-identity); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-dp-module-10/build.js \
//                      presentations/training-dp-module-10/Training_DP_Module_10.pptx
const TITLE = "Module 10: Deploying to Test and Production";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Data Platform and SQL Server Identity learning path, Module 10: Deploying to Test and Production",
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
const OUT = process.argv[2] || "Training_DP_Module_10.pptx";
const M = "Training, Data Platform, Module 10";
const CAP = "LAB 1 OUTPUT ON THE KIT'S EXAMPLE SETTINGS, DRY RUNS";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 10: Deploying to Test and Production", "Data Platform and SQL Server Identity learning path · Runbook R05, Appendix B, Chapter 10",
    ["Settings and preflight  ·  The approved plan  ·  Create, cutover and the way back  ·  The seal", "Try it: Lab 1, a dry-run rehearsal  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 10, the last module of the Data Platform and SQL Server Identity learning path: deploying to test and production. It teaches Runbook R oh five, login migration and the parallel run, and the break-glass design in Appendix B of the data platform book, with Chapter 10 of the developer workbook, Building SQL Server Identity. Everything in the earlier modules ends here. Take this module after Module 9.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the same commands run twice, test then production");
  tag(s, "Why");
  const l = panel(s, "Move", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "THE CHANGE", "One instance's logins move to Entra ID", [
    "From Windows to Microsoft Entra ID",
    "First on a test instance, then in production",
    "The same commands both times; only the settings file changes",
  ], 13.5);
  const r = panel(s, "Rule", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE RUNBOOK'S RULES", "Nothing runs unapproved", [
    "Nothing runs that a second person didn't approve by hash",
    "The way back is planned before the cutover",
    "Production preflight refuses to start until a real test stage is sealed",
  ], 13.5);
  callout(s, "Do", Math.max(l, r) + 0.3, 1.0, "FaRoute", HEX.navy, "In this module: ",
    "you rehearse that whole test stage as a dry run on the kit's example settings.");
  sources(s, "Sources: Module 10, \"Unit 1: Introduction\"; workbook Chapter 10, \"In this chapter.\"");
  notes(s,
`Why does this matter? This is the change itself: one instance's logins move from Windows to Microsoft Entra ID, first on a test instance, then in production. The commands are the same both times; only the settings file changes. Three rules hold it together. Nothing runs that a second person didn't approve by hash. The way back is planned before the cutover. And production's preflight refuses to start until a real test stage for the same instance is sealed in the evidence chain. In this module you rehearse that whole test stage as a dry run.`,
  `${M} — Unit 1 "Introduction"; workbook Chapter 10, "In this chapter."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 10", [
    "Name what preflight checks, PF-01 to PF-07, and what it can't see",
    "Explain how the three SHA-256 hashes tie the files a second person approved to the files that run",
    "Walk the test stage from preflight to the seal, and say what makes it a go or a no-go",
    "Explain why a dry-run stage seals only as a rehearsal, and why production preflight fails PF-06",
    "Name the rollback triggers and Appendix B's path when Entra can't be reached",
  ], [
    "Module 9: its closure record and drift schedule run during the observation",
    "The login plan and parallel run of Module 4",
  ], 70);
  sources(s, "Sources: Module 10, \"Learning objectives,\" \"Prerequisites.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about seventy minutes with the lab. You'll name what preflight checks, P F oh one to P F oh seven, and what it can't see. You'll explain how three S H A two fifty-six hashes tie the files a second person approved to the files that run. You'll walk the test stage from preflight to the seal, and say what makes it a go or a no-go. You'll explain why a dry-run stage seals only as a rehearsal, and why production preflight then fails P F oh six. And you'll name the rollback triggers, and the path when Entra can't be reached. Before you start, finish Module 9: its closure record and drift schedule run during the observation, and production's seal needs the closure record. This stage also runs Module 4's login plan and parallel run for real.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Settings and preflight
{
  const s = content(SC, "One settings file per environment, and preflight");
  tag(s, "What");
  const b = table(s, "Pf", 1.45, [2.0, 3.7, 6.45], ["Check", "What", "Detail"], [
    ["PF-01", "Settings complete", "The environment, the instance and its server"],
    ["PF-02", "Cloud", "AzureCloud: a GCC Moderate tenant's Arc resources are there"],
    ["PF-03", "Arc-eligibility Category 1", "From the Arc check"],
    ["PF-04", "Mapping resolves every login", "The reviewed mapping CSV"],
    ["PF-05", "Break-glass path recorded", "The break-glass group is in the exception registry"],
    ["PF-06", "Test stage sealed", "Production only: a sealed test stage for the same instance that isn't a rehearsal"],
    ["PF-07", "sa disabled and renamed", "A warning; it doesn't stop the change"],
  ], { fontSize: 12, limit: 4.75 });
  callout(s, "Set", b + 0.2, 1.05, "FaIdCard", HEX.navy, "The settings, from the template, inside your boundary, no secret: ",
    "the instance, its snapshots, the exception registry, the reviewed mapping, the evidence chain and the break-glass group.");
  line(s, "Rights", "Preflight can't see the deployer's rights: the deployer reads them after activating the role.", b + 1.4, 0.45, 13.5);
  sources(s, "Sources: Module 10, Unit 2; workbook Chapter 10, \"The settings,\" Stage 1 and Stage 2; Runbook R05, \"Preconditions.\"");
  notes(s,
`Unit 2 starts with the settings and preflight. One settings file per environment, filled from the template and kept inside your boundary, names the instance, its snapshots, the exception registry, the reviewed mapping, the evidence chain and the break-glass group. No secret goes in it. Preflight then checks seven things. P F oh one, the settings are complete. Oh two, the cloud is Azure Cloud, the commercial cloud where a G C C Moderate tenant's Arc resources are. Oh three, the instance is in Arc-eligibility Category 1. Oh four, the mapping resolves every login. Oh five, the break-glass path is in the exception registry. Oh six, for production only, a sealed test stage for the same instance that isn't a rehearsal. And oh seven, the S A account disabled and renamed, which is a warning and doesn't stop the change. Preflight can't see the deployer's rights, so the deployer reads them after activating the role.`,
  `${M} — Unit 2 "Settings, preflight and the approved plan": workbook Chapter 10, "The settings," Stage 1 steps 3 and 4, Stage 2; Runbook R05, "Preconditions."`);
}

// ================================================================== 5 The plan and its three hashes
{
  const s = content(SC, "The plan, and the three hashes a second person approves");
  tag(s, "How");
  const l = panel(s, "Plan", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE PLAN WRITES", "Three files, each with its SHA-256", [
    "create.sql: the Entra logins and users",
    "cutover.sql: disable and deny the superseded logins",
    "rollback.sql: the way back",
  ], 13);
  const r = panel(s, "App", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE APPROVAL", "A second person, line by line", [
    "Reads the three files and records the three hashes in the change record",
    "A file that doesn't hash to its approved value is refused before anything connects",
  ], 13);
  callout(s, "Dep", Math.max(l, r) + 0.25, 1.3, "FaIdCard", HEX.navy, "The deployer: ",
    "its own Entra account, a member of the instance's Entra admin group, activated under PIM for the change window only, so sysadmin, ALTER ANY LOGIN and CONTROL SERVER all read 1.");
  line(s, "Par", "The parallel run is required for production: the data platform book's Chapter 12, Decision 2.", Math.max(l, r) + 1.75, 0.45, 13.5);
  sources(s, "Sources: Module 10, Unit 2; workbook Chapter 10, \"Before you start,\" Stage 1; Runbook R05, Step 1; Data Platform: SQL Server Identity, Chapter 12.");
  notes(s,
`The plan writes three files: create dot sequel, cutover dot sequel and rollback dot sequel, each with its S H A two fifty-six. A second person reads them line by line and records the three hashes in the change record. When the deploy runs, a file that doesn't hash to its approved value is refused before anything connects, so the files that run are the files that were approved. The deployer signs in as its own Entra account, a member of the instance's Entra admin group, activated under pim for the change window only, so that sys-admin, alter any login and control server all read one. And the book's Chapter 12, What the Engine-Authentication Decision Settles, makes the parallel run required for production.`,
  `${M} — Unit 2 "Settings, preflight and the approved plan": workbook Chapter 10, "Before you start," Stage 1 steps 5 and 6; Runbook R05, Step 1; Chapter 12, "Decision 2."`);
}

// ================================================================== 6 Create, cutover and the way back
{
  const s = content(SC, "Create, cut over, and the way back");
  tag(s, "How");
  const b = table(s, "Seq", 1.45, [2.6, 9.55], ["In order", "What happens"], [
    ["Create", "Adds the Entra logins and users beside the Windows ones and disables nothing: both paths stay open for the parallel run"],
    ["Parallel run", "Judged against its exit criteria: Cutover-ready, N of N"],
    ["Rollback dry run", "Before the cutover, so its record exists first"],
    ["Cutover", "Disables the superseded users and SQL logins, denies CONNECT SQL to the superseded groups, never drops"],
    ["Observation", "30 days"],
  ], { fontSize: 12, limit: 4.4 });
  callout(s, "Trig", b + 0.25, 1.7, "FaTriangleExclamation", HEX.amber, "Rollback triggers, set before the change: ",
    "a failed login on a just-disabled or just-denied login from a production application; a job or linked server failing to connect; an outage traced to the cutover. The approved rollback.sql opens the old path again at once.");
  sources(s, "Sources: Module 10, Unit 3; Runbook R05, Steps 3 and 4, \"Rollback\"; workbook Chapter 10, Stage 1, \"Rollback.\"");
  notes(s,
`Unit 3 is the change itself. The create adds the Entra logins and users beside the Windows ones, and disables nothing, so both paths stay open for the parallel run. The parallel run is judged against its exit criteria. The rollback plan is dry-run before the cutover, so its record exists first. The cutover disables the superseded users and SQL logins and denies connect sequel to the superseded groups. It never drops anything. Then thirty days of observation follow. The rollback triggers are set before the change: any failed login on a just-disabled or just-denied login from a production application, any job or linked server failing to connect, or an application owner reporting an outage traced to the cutover. Any one stops the stage. Runbook R oh five keeps every cutover reversible: the Windows database users are still there, so the approved rollback opens the old path again at once.`,
  `${M} — Unit 3 "Create, cut over, seal, then production": Runbook R05, Steps 3 and 4, "Rollback"; workbook Chapter 10, Stage 1 steps 7 to 10, "Rollback."`);
}

// ================================================================== 7 Go or no-go, the seal, production
{
  const s = content(SC, "Go or no-go, the seal, then production");
  tag(s, "What");
  const l = panel(s, "Go", 0.6, 1.45, 6.2, null, HEX.navy, HEX.navyTint, "THE TEST STAGE IS A GO WHEN", null, [
    "Preflight passed, and the deployer's rights read 1, 1, 1",
    "The three approved hashes match the files that ran",
    "The parallel run printed Cutover-ready: N of N",
    "30 days with no failed login on a disabled or denied login, and no drift row",
    "Every DEPLOY record says applied, not dry run",
  ], 12);
  const r = panel(s, "Seal", 7.05, 1.45, 5.7, null, HEX.teal, HEX.tealTint, "THE SEAL", null, [
    "Re-hashes every run's files",
    "Refuses a stage missing a required step, or a DEPLOY run that wasn't applied",
    "-Rehearsal: a record production preflight never accepts",
    "Appends one record with the previous record's hash",
  ], 12);
  callout(s, "Bg", Math.max(l, r) + 0.25, 1.35, "FaFileShield", HEX.teal, "When Entra can't be reached: ",
    "Appendix B's path is the registered break-glass Windows group, empty by default, with every membership change alerting.");
  sources(s, "Sources: Module 10, Unit 3; workbook Chapter 10, \"Go or no-go,\" \"Stage 2: production,\" \"Rollback\"; Data Platform: SQL Server Identity, Appendix B.");
  notes(s,
`The test stage is a go when five things hold. Preflight passed, and the deployer's rights read one, one, one. The three hashes in the change record match the files that ran. The parallel run printed cutover-ready, N of N. Thirty days of observation passed with no failed login on a disabled or denied login, and no drift row. And every deploy record says applied, not dry run. A no-go is a finding with an owner, and the stage is repeated. The seal re-hashes every run's files, refuses a stage missing a required step or with a deploy run that wasn't applied, and appends one record to the chain with the previous record's hash. Sealed with the rehearsal switch, it records a rehearsal, which production preflight never accepts. Production then runs the same steps, and its seal also needs the closure record from Module 9. When Entra can't be reached, Appendix B's path is the registered break-glass Windows group, empty by default, with every membership change alerting.`,
  `${M} — Unit 3 "Create, cut over, seal, then production": workbook Chapter 10, "Go or no-go," "Stage 2: production," "Rollback"; Appendix B, "Break-glass design."`);
}
endModule(SC);

// ================================================================== 8 Try it: settings and preflight
{
  const s = content(SL, "Try it: copy the settings and preflight the test stage");
  tag(s, "How");
  const c = code(s, "Pre", 0.6, 1.45, 12.15, [
    "$ Set-Location C:\\FMWLabs\\sql-server-identity-code\\sql-server-identity",
    "$ $Run = \"C:\\FMWLabs\\results\\data-platform-10\\lab1\\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')\"   # then New-Item ...",
    "# Step 1: copy the example settings into this run's folder",
    "$ foreach ($e in 'test', 'production') { ... $s.chainPath = \"$Run\\evidence\\chain.jsonl\" ... }",
    "$ Get-Content \"$Run\\settings.test.json\"",
    "  \"environment\": \"test\", \"cloud\": \"AzureCloud\", \"instance\": \"SQLPRD01\", \"server\": \"sqlprd01.contoso.example,1433\", ...",
    "  \"breakGlassLogin\": \"CONTOSO\\\\SQL-BreakGlass\", \"approver\": \"Change advisory board (fictional)\"",
    "# Step 2: preflight the test stage (PRE)",
    "$ ./deploy/Test-SqlPreflight.ps1 -SettingsPath \"$Run\\settings.test.json\" -OutputPath \"$Run\\test\\preflight\"",
    "Check What                         Result Detail",
    "PF-01 Settings complete            pass   test: SQLPRD01 on sqlprd01.contoso.example,1433",
    "PF-02 Cloud                        pass   AzureCloud (a GCC Moderate tenant's Arc resources are in AzureCloud, WD-028)",
    "PF-03 Arc-eligibility Category 1   pass   Category 1: Ready: plan the logins (Chapter 04)",
    "PF-04 Mapping resolves every login pass   4 mapped; unresolved: none",
    "PF-05 Break-glass path recorded    pass   CONTOSO\\SQL-BreakGlass is in the exception registry",
    "PF-07 sa disabled and renamed      warn   sa is still enabled or named sa: remediate it on its own track (Runbook R05), ...",
    "Preflight: every check passed.",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED AND REFLOWED: "..." MARKS CUTS)`, pt: 10 });
  line(s, "Warn", "PF-07 warns: the example's sa is still enabled under its own name on day 1. It doesn't stop the change.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 10, \"Unit 4: Exercise: Lab 1,\" steps 1 and 2; workbook Chapter 10, Stage 1, step 4.");
  notes(s,
`Try it. Lab 1 rehearses the whole test stage on the kit's example settings, as dry runs: nothing connects to an instance, and nothing runs with the apply switch. Open PowerShell 7, go to the kit's folder, and make this run's results folder. Step one copies the kit's two example settings files, test and production, into the run folder, and points their evidence chain at it, so the kit's folder stays as you unzipped it. They describe the fixtures' sequel P R D oh one. Step two preflights the test stage. Every check passes, and P F oh seven warns: the example's S A account is still enabled under its own name on day one. It doesn't stop the change. P F oh six isn't run, because it's for production only.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2; workbook Chapter 10, Stage 1, step 4.`);
}

// ================================================================== 9 Try it: audit, Arc and the plan
{
  const s = content(SL, "Try it: the audit, the Arc check and the plan");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "# Step 3: run the audit and the Arc check (AUDIT, ARC)",
    "$ ./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -OutputPath \"$Run\\test\\audit\"",
    "$ ./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath tests/fixtures/arc/arc.json -OutputPath \"$Run\\test\\arc\"",
    "Instance Severity Finding          Detail",
    "SQLPRD01 highest  sa enabled       sa is enabled under the name 'sa'",
    "SQLPRD01 critical Usable SQL login payroll_report: migrate to an Entra login or record an exception",
    "...",
    "Instance Version Agent                  Extension Entra           Category Next",
    "SQLPRD01 2022    Connected              deployed  appRegistration        1 Ready: plan the logins (Chapter 04)",
    "...",
    "# Step 4: plan the change (PLAN)",
    "$ ./deploy/New-SqlDeploymentPlan.ps1 -SettingsPath \"$Run\\settings.test.json\" -OutputPath \"$Run\\test\\plan\"",
    "Phase    Statements Sha256",
    "create           16 deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709",
    "cutover           5 0a04162bf925eea425ac5a820fcf5e68b2169faf1b996c2acb10c14aec6cbad3",
    "rollback          5 b2d5964e9a6d29731d139b2b3fc72b59e6748196959142e5f6f521b2863470c8",
    "Evidence for PLAN (Plan the change for one environment, with its hash): CM-3, CM-4; KSI-CMT-LMC, KSI-CMT-RVP",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS)`, pt: 10 });
  line(s, "Hash", "Three .sql files, each with its SHA-256: the three values a second person approves.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 10, \"Unit 4: Exercise: Lab 1,\" steps 3 and 4; workbook Chapter 10, Stage 1, steps 2 and 5.");
  notes(s,
`Step three runs the audit and the Arc check on the snapshots the settings name. In a real stage these are the instance's own snapshots, taken that day. The audit flags sequel P R D oh one's S A account, enabled under its own name, and a usable SQL login, and the Arc check puts sequel P R D oh one in Category 1: ready to plan the logins. Step four plans the change. It writes three sequel files: the create, with sixteen statements; the cutover, with five; and the rollback, with five. Each has its S H A two fifty-six. Those are the three values a second person approves.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 3 and 4; workbook Chapter 10, Stage 1, steps 2 and 5.`);
}

// ================================================================== 10 Try it: approve, dry-run create, wrong hash
{
  const s = content(SL, "Try it: approve the hashes, then dry-run the create");
  tag(s, "How");
  const c = code(s, "Cre", 0.6, 1.45, 12.15, [
    "# Step 5: approve the hashes",
    "$ Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1",
    "$ $create = Get-SqlFileHash \"$Run\\test\\plan\\create.sql\"     # and $cutover and $rollback the same way, then Format-List",
    "Create   : deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709                              ...",
    "# Step 6: dry-run the create phase (DEPLOY)",
    "$ ./deploy/Invoke-SqlDeploy.ps1 -PlanPath \"$Run\\test\\plan\" -Phase create -ApprovedHash $create -OutputPath \"$Run\\test\\deploy-create\"",
    "Dry run: hash matches. Would run 16 statements on sqlprd01.contoso.example,1433 (test):",
    "  CREATE LOGIN [payroll-reporting-app] FROM EXTERNAL PROVIDER;",
    "  ...",
    "  ALTER SERVER ROLE [sysadmin] ADD MEMBER [SQL-DBA-Admins];",
    "  ...",
    "test        SQLPRD01 create         16 dry run",
    "# Step 7: try a hash that isn't the approved one",
    "$ ./deploy/Invoke-SqlDeploy.ps1 -PlanPath \"$Run\\test\\plan\" -Phase create -ApprovedHash ('0' * 64) -OutputPath \"$Run\\test\\deploy-wrong-hash\"",
    "Exception: Refused: create.sql hashes to deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709,",
    "    not the approved 0000...0000. Re-plan and re-approve.",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED AND WRAPPED: "..." MARKS CUTS)`, pt: 10 });
  line(s, "Ref", "Without -Apply the deploy connects to nothing. A wrong hash is refused before anything connects.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 10, \"Unit 4: Exercise: Lab 1,\" steps 5 to 7; workbook Chapter 10, Stage 1, steps 6 and 7.");
  notes(s,
`Step five approves the hashes. The approver re-hashes the three files after reading them, and this lab keeps each hash in a variable, as a change record would keep it. Step six dry-runs the create phase with the approved hash. Without the apply switch it connects to nothing: it checks the hash and prints the sixteen statements it would run. Create login from external provider for each Entra login, the Entra admin group added to sys-admin, then the database users and their roles. Step seven tries a hash that isn't the approved one, sixty-four zeros. The deploy stops before anything connects: re-plan and re-approve.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 5 to 7; workbook Chapter 10, Stage 1, steps 6 and 7.`);
}

// ================================================================== 11 Try it: parallel run, rollback, cutover
{
  const s = content(SL, "Try it: parallel run, rollback, then cutover");
  tag(s, "How");
  const c = code(s, "Cut", 0.6, 1.45, 12.15, [
    "# Step 8: judge the parallel run (PARALLEL) on day 30's snapshot",
    "$ ./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -Instance SQLPRD01 `",
    "      -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath \"$Run\\test\\parallel\"",
    "Legacy               Entra                 LegacySessions EntraSessions Ready Why",
    "CONTOSO\\svc-payroll  payroll-web-mi                     0            44  True already cut over (disabled or denied): ...",
    "...",
    "Cutover-ready: 4 of 4: every exit criterion met",
    "# Step 9: dry-run the rollback (RB), before the cutover",
    "$ ./deploy/Invoke-SqlRollback.ps1 -PlanPath \"$Run\\test\\plan\" -ApprovedHash $rollback -OutputPath \"$Run\\test\\rollback\"",
    "Dry run: hash matches. Would run 5 statements to restore the logins on sqlprd01.contoso.example,1433:",
    "  GRANT CONNECT SQL TO [CONTOSO\\PayrollUsers];",
    "  ALTER LOGIN [CONTOSO\\svc-payroll] ENABLE;   ...",
    "# Step 10: dry-run the cutover (DEPLOY)",
    "$ ./deploy/Invoke-SqlDeploy.ps1 -PlanPath \"$Run\\test\\plan\" -Phase cutover -ApprovedHash $cutover -OutputPath \"$Run\\test\\deploy-cutover\"",
    "  DENY CONNECT SQL TO [CONTOSO\\PayrollUsers];  -- group: superseded by SQL-Payroll-Users",
    "  ALTER LOGIN [CONTOSO\\svc-payroll] DISABLE;  -- superseded by payroll-web-mi                ...",
    "  ALTER SERVER ROLE [sysadmin] DROP MEMBER [CONTOSO\\SQL-Admins];  -- DENY doesn't bind sysadmin members",
    "  DENY CONNECT SQL TO [CONTOSO\\SQL-Admins];  -- group: superseded by SQL-DBA-Admins",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED AND WRAPPED: "..." MARKS CUTS)`, pt: 10 });
  line(s, "Rb", "Nothing is dropped: the rollback's ENABLE and GRANT CONNECT SQL reverse the cutover's DISABLE and DENY.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 10, \"Unit 4: Exercise: Lab 1,\" steps 8 to 10; workbook Chapter 10, Stage 1, steps 8 to 10, \"Rollback.\"");
  notes(s,
`Step eight judges the parallel run on day thirty's snapshot. In the fixtures, day thirty is after the cutover, so each legacy login reads as already cut over: cutover-ready, four of four. Step nine dry-runs the rollback, before the cutover, so its record exists first. It would grant connect sequel back to the groups, and enable the superseded logins. Step ten dry-runs the cutover. Users and SQL logins are disabled, and groups are denied connect sequel. The Windows admin group leaves the sys-admin role first, because a deny doesn't bind sys-admin members. Nothing is dropped, which is why the rollback can reverse it at once.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 8 to 10; workbook Chapter 10, Stage 1, steps 8 to 10, "Rollback."`);
}

// ================================================================== 12 Try it: the seal
{
  const s = content(SL, "Try it: seal the stage, then seal it as a rehearsal");
  tag(s, "How");
  const c = code(s, "Seal", 0.6, 1.45, 12.15, [
    "# Step 11: try to seal the stage without the parallel run (EVIDENCE)",
    "$ ./deploy/Invoke-SqlEvidence.ps1 -Stage test -Instance SQLPRD01 -RunPaths \"$Run\\test\\preflight\", ..., \"$Run\\test\\rollback\" `",
    "      -ChainPath \"$Run\\evidence\\chain.jsonl\" -AsOf 2026-12-20",
    "Exception: Stage 'test' is missing evidence for: PARALLEL. No record written.",
    "# Step 12: try to seal the whole stage: the same command, with \"$Run\\test\\parallel\" in -RunPaths",
    "Exception: Stage 'test' has a DEPLOY run that wasn't applied (dry run).",
    "    Seal it with -Rehearsal, which preflight never accepts as a stage.",
    "# Step 13: seal it as a rehearsal: the same command, with -Rehearsal",
    "Stage    : test (rehearsal)",
    "Instance : SQLPRD01",
    "Steps    : PRE, AUDIT, ARC, PLAN, DEPLOY, PARALLEL, DEPLOY, RB",
    "Record   : <record>",
    "Previous : (first)",
    "Sealed the test stage as a rehearsal in $Run/evidence/chain.jsonl",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED AND WRAPPED, PATHS SHORTENED; "..." MARKS A CUT)`, pt: 10.5 });
  line(s, "Rec", "<record> is the first 16 characters of the record's hash; it differs from run to run.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 10, \"Unit 4: Exercise: Lab 1,\" steps 11 to 13; workbook Chapter 10, \"Go or no-go.\"");
  notes(s,
`Step eleven tries to seal the stage without the parallel run. The seal refuses a stage missing a step the kit's requirements file requires, and writes no record. Step twelve tries to seal the whole stage. Every step is there, but the deployments were dry runs, so the seal refuses again, and points you to the rehearsal switch. Step thirteen runs the same command with that switch. It writes the record, marked as a rehearsal, with the eight steps it sealed and no previous record, since it's the first. The record's short hash differs from run to run, because the record names this run's folders.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 11 to 13; workbook Chapter 10, "Go or no-go."`);
}

// ================================================================== 13 Try it: production preflight
{
  const s = content(SL, "Try it: production preflight refuses the rehearsal");
  tag(s, "How");
  const c = code(s, "Prod", 0.6, 1.45, 12.15, [
    "# Step 14: preflight production",
    "$ ./deploy/Test-SqlPreflight.ps1 -SettingsPath \"$Run\\settings.production.json\" -OutputPath \"$Run\\production\\preflight\"",
    "Check What                         Result Detail",
    "PF-01 Settings complete            pass   production: SQLPRD01 on sqlprd01.contoso.example,1433",
    "...",
    "PF-06 Test stage sealed            FAIL   no sealed (non-rehearsal) test-stage record for SQLPRD01 in $Run\\evidence\\chain.jsonl",
    "PF-07 sa disabled and renamed      warn   sa is still enabled or named sa: remediate it on its own track (Runbook R05), ...",
    "Preflight: 1 check(s) failed. Stop here.",
    "(exit code 1)",
    "# Step 15: run the deployment tests",
    "$ Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Entry scripts and the runbook*', 'Evidence*' -Output None -PassThru | ...",
    "PassedCount FailedCount",
    "         10           0",
    "# Step 16: list your runs",
    "$ Get-ChildItem C:\\FMWLabs\\results\\data-platform-10\\lab1 -Name",
    "<run>",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED, PATHS SHORTENED; "..." MARKS CUTS)`, pt: 10 });
  line(s, "Stop", "Only a real test stage, every DEPLOY applied and sealed without -Rehearsal, lets production start.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 10, \"Unit 4: Exercise: Lab 1,\" steps 14 to 16; workbook Chapter 10, \"Stage 2: production.\"");
  notes(s,
`Step fourteen preflights production. P F oh one to oh five pass, as they did for test. P F oh six fails: the chain holds only a rehearsal, and production needs a sealed test stage that isn't one. Preflight says stop here, and exits with code one. Step fifteen runs the deployment tests: ten pass, none fail. Step sixteen lists your runs. There's nothing to clean up: this run's results stay in the run folder. Check your work: you can walk the test stage from preflight to the seal, and say why a wrong hash is refused before anything connects, why a dry-run stage seals only as a rehearsal, and why production preflight then fails P F oh six.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 14 to 16 and "Check your work"; workbook Chapter 10, "Stage 2: production."`);
}

// ================================================================== 14 Lab 2
{
  const s = content(SL, "Lab 2: the real test stage, Chapter 10's Stage 1");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A test instance in Arc-eligibility Category 1, never production; a deployer activated under PIM for the change window; Reader to read Arc; the tools signed in to AzureCloud; filled test settings with no secret, a reviewed mapping, the registry with the break-glass group, and a second person to approve the hashes"],
    ["The run", "Lab 1's steps against your test instance, with -Apply on the create and the cutover, the parallel run and 30 days of observation, then a seal without -Rehearsal"],
    ["Back it out", "The approved rollback.sql, run with -Apply under its own change record and in its own run folder"],
  ], { fontSize: 12, limit: 5.2 });
  callout(s, "Not", b + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "no command has run with -Apply; each ran only as a dry run on the example settings and in the kit's Pester tests.");
  sources(s, "Sources: Module 10, \"Unit 5: Exercise: Lab 2\"; workbook Chapter 10, \"Before you start,\" Stage 1, \"Rollback.\"");
  notes(s,
`This module has no Lab 2 of its own. The real test-instance run is Chapter 10's Stage 1, and it wasn't run by the authors: every command has run only as a dry run on the kit's example settings and in its Pester tests. You need a test instance in Arc-eligibility Category 1, never production; a deployer activated under pim for the change window only; Reader on the subscriptions to read Arc; and the tools signed in to commercial Azure. You also need a filled test settings file with no secret, a reviewed mapping, the exception registry with the break-glass group, and a second person to approve the three hashes. The run is Lab 1's steps against your test instance, with the apply switch on the create and the cutover, the parallel run and thirty days of observation, then a seal without the rehearsal switch. To back it out, run the approved rollback with apply, under its own change record and in its own run folder. Run the test stage first, read every file you approve, and keep the evidence.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test instance)"; workbook Chapter 10, "Before you start," Stage 1, "Rollback."`);
}
endModule(SL);

// ================================================================== 15 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [2.75, 2.0, 2.9, 4.5], ["What the output shows", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["PRE: preflight", "AC-6; CM-6", "KSI-IAM-ELP, KSI-SVC-ACM", "preflight.csv and its manifest; the deployer's rights read"],
    ["PLAN: the plan and its approval", "CM-3; CM-4", "KSI-CMT-LMC, KSI-CMT-RVP", "plan.json, the three .sql files, and the hashes in the change record with the approver"],
    ["DEPLOY: create and cutover", "CM-3; AC-2", "KSI-CMT-LMC", "Each deploy record with mode applied and the hash that ran"],
    ["RB: the rollback plan", "CM-3; CP-2", "KSI-CMT-LMC, KSI-RPL-ARP", "The rollback dry run, written before the cutover"],
    ["EVIDENCE: the seal", "CA-7; AU-9", "KSI-MLA-EVC, KSI-MLA-OSM", "chain.jsonl: each record with the SHA-256 of every manifest and the previous record's hash"],
  ], { fontSize: 11.5, limit: 5.6 });
  line(s, "Ass", "These records provide evidence for the change; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 10, \"Unit 1\" (the federal requirement), \"Unit 7\"; NIST SP 800-53; FedRAMP 20x KSIs; workbook Chapter 10, \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. Chapter 10 maps each step to NIST SP 800-53. Preflight supports A C six, least privilege, and C M six, configuration settings: keep the preflight file and its manifest, with the deployer's rights read. The plan and its approval support C M three and C M four, configuration change control and impact analysis: keep the plan, the three sequel files, and the hashes in the change record with the approver. The create and the cutover support C M three and A C two: keep each deploy record with mode applied and the hash that ran. The rollback plan supports C M three and C P two, the contingency plan: keep the rollback dry run, written before the cutover. And the seal supports C A seven and A U nine, protection of audit information: keep the chain, each record holding the S H A two fifty-six of every manifest and the previous record's hash. K S Is are FedRAMP twenty X indicators for cloud service providers: your cloud providers report against them, the agency doesn't. These records provide evidence for the change; the assessor decides.`,
  `${M} — Unit 1 (the federal requirement), Unit 7 (evidence an ISSO keeps); workbook Chapter 10, "Federal requirements and evidence"; Runbook R05, control states.`);
}

// ================================================================== 16 Check
{
  const s = check(SS, "Check yourself: two questions on the deployment", [
    { q: "You run the create with an approved hash that isn't the one create.sql hashes to. What happens?", options: ["a. The dry run lists the statements and flags the mismatch", "b. It is refused before anything connects: re-plan and re-approve", "c. It runs, and the seal later rejects the stage"] },
    { q: "The chain holds only the rehearsal record. What does production preflight report?", options: ["a. Every check passed, since the test stage is sealed", "b. PF-06 fails: no sealed, non-rehearsal test-stage record for SQLPRD01. Stop here", "c. PF-06 warns but doesn't stop the run"] },
  ], "1 b: Lab 1, step 7. 2 b: production needs a sealed test stage that isn't a rehearsal (Lab 1, step 14).");
  sources(s, "Sources: Module 10, \"Unit 6: Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: you run the create with an approved hash that isn't the one the create file hashes to. What happens? The answer is b: it's refused before anything connects. Re-plan and re-approve. Second: the chain holds only the rehearsal record. What does production preflight report? The answer is b: P F oh six fails, because there's no sealed test-stage record for sequel P R D oh one that isn't a rehearsal. Stop here. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 17 Summary
{
  const s = content(SS, "Summary: test first, then production, by hash");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU REHEARSED", null, [
    "Preflight and the three approved hashes",
    "The create, the parallel run, the rollback and the cutover, as dry runs",
    "A seal refused twice, then sealed as a rehearsal",
    "Production preflight refusing the rehearsal at PF-06",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Back to the learning path", [
    "Before shipping: the Chapter 10 checklist",
    "The real test stage: Chapter 10, Stage 1",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "The rule: ",
    "a real test stage, applied and sealed without -Rehearsal, is what lets production start, with the same commands and a different settings file.");
  sources(s, "Sources: Module 10, \"Unit 7: Summary\"; workbook Chapter 10, \"Checklist.\"");
  notes(s,
`To sum up. You rehearsed one instance's login migration through the test stage, from preflight and the approved hashes to the parallel run, the cutover and its rollback, and sealed it as a rehearsal that production preflight refuses. A real test stage, applied and sealed without the rehearsal switch, is what lets production start, with the same commands and a different settings file. Before shipping, work through the Chapter 10 checklist. That's the end of the Data Platform and SQL Server Identity learning path. Go back to the learning path's index for the modules and the code.`,
  `${M} — Unit 7 "Summary"; workbook Chapter 10, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 10 deck", [
  "Module page: docs/training/data-platform/10-deploying-to-test-and-production.md (Data Platform and SQL Server Identity learning path, Module 10): Introduction and the federal requirement, objectives, prerequisites, Units 2 and 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: Runbook R05, Login Migration and the Parallel Run (preconditions, Steps 1, 3 and 4, rollback, the sa account, control states); Data Platform: SQL Server Identity, Chapter 12, Decision 2, and Appendix B, break-glass design. NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 10, Deploying to Test and Production (Building SQL Server Identity): \"Before you start,\" \"The settings,\" Stage 1, \"Go or no-go,\" \"Stage 2: production,\" \"Rollback,\" \"Federal requirements and evidence,\" \"Checklist.\" Kit: examples/sql-server-identity (deploy/, powershell/SqlIdentity, tests/fixtures).",
  "Lab output: the module page's Lab 1 expected output, dry runs on the kit's example settings; trimmed, wrapped, reflowed and with paths shortened to $Run where the slides say so. Nothing has been run with -Apply.",
]);

finish(OUT);
