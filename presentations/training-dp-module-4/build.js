// Data Platform and SQL Server Identity learning path, Module 4: Entra logins and the parallel run — the module's narrated deck.
// Teaches docs/training/data-platform/04-entra-logins-and-the-parallel-run.md, Learn-style: objectives, the concepts (the
// three principal types; the kit's login plan; the parallel run, the cutover and the rollback), "Try it" slides with the
// module page's Lab 1 commands and expected output, Lab 2, the federal requirement and evidence, a two-question check, and
// the summary. Every fact comes from the module page, workbook Chapter 04 and Runbook R05 that the page sends the learner
// to, or the kit (examples/sql-server-identity); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-dp-module-4/build.js \
//                      presentations/training-dp-module-4/Training_DP_Module_4.pptx
const TITLE = "Module 4: Entra logins and the parallel run";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Data Platform and SQL Server Identity learning path, Module 4: Entra logins and the parallel run",
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
const OUT = process.argv[2] || "Training_DP_Module_4.pptx";
const M = "Training, Data Platform, Module 4";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 4: Entra logins and the parallel run", "Data Platform and SQL Server Identity learning path · Runbook R05, with workbook Chapter 04",
    ["Principals and the plan  ·  The parallel run", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 4 of the Data Platform and SQL Server Identity learning path: Entra logins and the parallel run. This is the migration itself. You add the Entra login beside the Windows one, prove it works, and only then turn the old one off. The module follows runbook R five, and Chapter 4 of the developer workbook, Building SQL Server Identity. Take it after Module 3.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the old login stays on until the new one is proven");
  tag(s, "Why");
  const l = panel(s, "Risk", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "WHAT CAN GO WRONG", "Two mistakes you can't take back", [
    "A wrong mapping locks people out",
    "A dropped login can't be rolled back",
  ], 13.5);
  const r = panel(s, "Rule", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE MODULE'S ANSWER", "Reviewable, and judged from evidence", [
    "Every Windows and SQL login gets an Entra login beside it",
    "The plan is T-SQL that executes nothing",
    "Readiness is judged from evidence, not silence",
  ], 13.5);
  callout(s, "Order", Math.max(l, r) + 0.3, 1.2, "FaRoute", HEX.navy, "On a Category 1 instance: ",
    "the new login is proven with a real sign-in; only then is the old one disabled, observed for 30 days and dropped.");
  sources(s, "Sources: Module 4, \"Introduction\"; workbook Chapter 04, \"Goal and audience\"; Runbook R05.");
  notes(s,
`Why does the order matter? On a Category 1 instance, every Windows and sequel login gets an Entra login beside it. The new login is proven with a real sign-in, and only then is the old one disabled, observed for thirty days and dropped. Two mistakes here can't be taken back. A wrong mapping locks people out, and a dropped login can't be rolled back. So the plan is written as reviewable T-SQL that executes nothing, and readiness is judged from evidence, not silence. In this module you write a fictional instance's plan and judge its parallel run on day one and day thirty.`,
  `${M} — Unit "Introduction"; workbook Chapter 04, "Goal and audience."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Name the three Entra principal types a FROM EXTERNAL PROVIDER login maps to, and the login type each shows",
    "Turn a reviewed mapping into create, cutover and rollback scripts, and say why a Windows group is denied CONNECT SQL instead of disabled",
    "State the parallel run's order and its exit criteria, and why local sessions don't count",
    "Judge a parallel run from snapshots, and say what comes after the disable",
  ], [
    "Module 3: Arc and the engine's identity",
    "PowerShell 7 and the kit, unzipped into C:\\FMWLabs",
    "No instance or tenant for Lab 1",
  ], 60);
  sources(s, "Sources: Module 4, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"Get the code.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty minutes with the lab. You'll name the three Entra principal types a login from an external provider maps to, and the login type each one shows. You'll turn a reviewed mapping into create, cutover and rollback scripts, and say why a Windows group is denied connect sequel instead of being disabled. You'll state the parallel run's order and its exit criteria, and why local sessions don't count. And you'll judge a parallel run from snapshots, and say what comes after the disable. Before you start, finish Module 3. Lab 1 runs in PowerShell 7 on the kit's fixtures, with no instance and no tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Three principal types
{
  const s = content(SC, "Three principal types a login can map to");
  tag(s, "What");
  const b = table(s, "Types", 1.45, [2.6, 3.3, 1.6, 4.65], ["Entra principal", "Named by", "Login type", "Use"], [
    ["User", "User principal name (UPN)", "E", "One person"],
    ["Security group", "Display name", "X", "The target: removes per-user churn"],
    ["Application", "Display name", "E", "Replaces an application's SQL login with a stored password; preferably a managed identity"],
  ], { fontSize: 13, limit: 4.2 });
  callout(s, "Mfa", b + 0.3, 1.2, "FaShieldHalved", HEX.navy, "The engine has no MFA logic: ",
    "Conditional Access decides before the token is issued. The login's name must match an existing Entra principal in the instance's tenant.");
  line(s, "Syn", "CREATE LOGIN [name] FROM EXTERNAL PROVIDER; then CREATE USER [name] FROM LOGIN [name] in each database.", b + 1.75, 0.45, 13.5);
  sources(s, "Sources: Module 4, Unit 2; workbook Chapter 04, \"What Microsoft gives you\"; Microsoft Learn, CREATE LOGIN and sys.server_principals.");
  notes(s,
`Unit 2 starts with the principals. Create login, from external provider, maps a login to one of three Entra principals. A user, named by its U P N. A security group, named by its display name. Or an application, also by display name. In sys dot server principals, users and applications show as type E, and groups as type X. Group logins are the target, because they remove per-user churn. And an application's sequel login with a stored password becomes an Entra application login, preferably a managed identity. Create user, from login, then makes the database user. One more thing to keep in mind: the engine has no M F A logic. Conditional Access decides before the token is issued.`,
  `${M} — Unit 2 "Principals and the plan"; workbook Chapter 04, "What Microsoft gives you."`);
}

// ================================================================== 5 The plan
{
  const s = content(SC, "The kit's login plan: reviewable, and it runs nothing");
  tag(s, "How");
  const l = panel(s, "Does", 0.6, 1.45, 6.4, null, HEX.navy, HEX.navyTint, "NEW-SQLLOGINPLAN", "What the plan does", [
    "Reads one instance from the audit snapshot, and the reviewed mapping",
    "Leaves out sa and the built-in principals",
    "Writes an unmapped login as UNRESOLVED, never a guess",
    "Mirrors server and database roles",
    "Writes create, cutover and rollback scripts, and executes nothing",
  ], 13);
  const r = panel(s, "Warn", 7.25, 1.45, 5.5, null, HEX.amber, HEX.amberTint, "IT WARNS WHEN", "One group, one role", [
    "A principal would hold more than one database role",
    "A principal would hold db_owner or sysadmin",
    "The plan is still written: split the group, or record why not",
  ], 13);
  callout(s, "Hand", Math.max(l, r) + 0.3, 1.2, "FaTriangleExclamation", HEX.amber, "Not mirrored: ",
    "explicit permissions, default schemas and object ownership. Runbook R05's Step 2 queries read them, and the DBA adds them by hand.");
  sources(s, "Sources: Module 4, Unit 2; workbook Chapter 04, \"The login plan\"; Runbook R05, Steps 1 and 2.");
  notes(s,
`The kit's login plan reads one instance from the audit snapshot, and the reviewed mapping. It leaves out the S A account and the built-in principals. A login with no mapping is written as unresolved, instead of a guess. It mirrors server and database roles, and writes three scripts: create, cutover and rollback. It executes nothing. It also warns when a principal would hold more than one database role, or D B owner or sys-admin, because the data platform book gives each group exactly one role, on one database, in one environment. A warning doesn't stop the plan. It's for the identity engineer to split the group, or record why not. What the plan doesn't mirror is explicit permissions, default schemas and object ownership. Runbook R five's queries read those, and the D B A adds them by hand.`,
  `${M} — Unit 2 "Principals and the plan"; workbook Chapter 04, "The login plan."`);
}

// ================================================================== 6 The parallel run
{
  const s = content(SC, "The parallel run: create, validate, disable, observe, drop");
  tag(s, "What");
  const l = panel(s, "Exit", 0.6, 1.45, 6.2, null, HEX.navy, HEX.navyTint, "REQUIRED FOR PRODUCTION", "The exit criteria, while both logins work", [
    "Every application and job also appears on its Entra login",
    "No remote NTLM remains",
    "Nothing still arrives only on the legacy login",
    "Local sessions always report NTLM, so they don't count",
  ], 13);
  const r = panel(s, "Cut", 7.05, 1.45, 5.7, null, HEX.teal, HEX.tealTint, "CUTOVER AND ROLLBACK", "Nothing is dropped", [
    "A Windows user or SQL login is disabled; the rollback enables it",
    "A Windows group can't be disabled: it's denied CONNECT SQL; the rollback grants it back",
    "sa is disabled and renamed, never migrated",
  ], 13);
  callout(s, "Aud", Math.max(l, r) + 0.3, 1.2, "FaUserClock", HEX.navy, "A snapshot is a moment: ",
    "SQL Server Audit's SUCCESSFUL_LOGIN_GROUP records the whole window. The kit's judge reports readiness per legacy login, and never disables anything.");
  sources(s, "Sources: Module 4, Unit 3; workbook Chapter 04, \"The parallel-run judge\"; Runbook R05, Steps 3 and 4, \"Rollback,\" \"The sa account.\"");
  notes(s,
`Unit 3 is the parallel run. The order is create, validate, disable, observe for thirty days, then drop, and it's required for production. While both logins work, there are three exit criteria. Every application and job also appears on its Entra login. No remote N T L M remains. And nothing still arrives only on the legacy login. Connections made on the server itself always report N T L M, so they don't count. A snapshot is only a moment. Sequel Server Audit's successful login group records the whole window. The cutover disables a Windows user or a sequel login, and the rollback enables it. A Windows group can't be disabled that way, so the kit denies it connect sequel, and the rollback grants it back. Nothing is dropped. The S A account is disabled and renamed, never migrated. And the kit's judge reports readiness for each legacy login. It never disables anything.`,
  `${M} — Unit 3 "The parallel run"; workbook Chapter 04, "The parallel-run judge"; Runbook R05, Steps 3 and 4.`);
}
endModule(SC);

// ================================================================== 7 Try it: the plan
{
  const s = content(SL, "Try it: write SQLPRD01's login plan");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "$ Set-Location C:\\FMWLabs\\sql-server-identity-code\\sql-server-identity",
    "$ $Run = \"C:\\FMWLabs\\results\\data-platform-04\\lab1\\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')\"   # then New-Item ... $Run",
    "# Step 1: write SQLPRD01's login plan",
    "$ ./New-SqlLoginPlan.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 `",
    "      -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath \"$Run\\logins\"",
    "-- Login plan for SQLPRD01. Dry run: review every line; nothing here has run.",
    "IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'SQL-DBA-Admins')",
    "    CREATE LOGIN [SQL-DBA-Admins] FROM EXTERNAL PROVIDER;",
    "ALTER SERVER ROLE [sysadmin] ADD MEMBER [SQL-DBA-Admins];",
    "...",
    "Instance MappedLogins EntraPrincipals Unresolved",
    "SQLPRD01            4               4 none",
    "Wrote 5 files and manifest.json to C:/FMWLabs/results/data-platform-04/lab1/<run>/logins",
    "Create script SHA-256: deed30db5cccb0248289c1d62b013f092514bd6fb858406e068c8ec7adc3f709",
    "Warning: payroll-web-mi would hold 3 database roles (Payroll:db_datareader, Payroll:db_datawriter, Payroll:db_executor): ...",
    "Warning: SQL-DBA-Admins would hold db_owner or sysadmin: confirm it's needed (Chapter 16)",
    "Warning: SQL-Payroll-Users would hold 3 database roles (Payroll:db_datareader, Payroll:db_datawriter, PayrollArchive:db_datareader): ...",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED AND WRAPPED: "..." MARKS CUTS)`, pt: 10 });
  line(s, "Sa", "sa and NT SERVICE\\MSSQLSERVER aren't in it. The plan is still written: the warnings are for the identity engineer.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" setup and step 1; workbook Chapter 04, Lab 1.");
  notes(s,
`Try it. Lab 1 runs in PowerShell 7, from the kit's folder, on the kit's fictional estate. First, make this run's results folder: its name is the time you start, in U T C, so every run keeps its own results. Step one writes sequel P R D oh one's login plan. Four legacy logins map to four Entra principals. The create script starts with a dry-run comment: nothing here has run. Notice that S Q L dash D B A dash Admins gets sys-admin, because the Windows group it replaces had it. The S A account and the built-in service login aren't in the plan. Then the summary: four logins mapped, none unresolved, and the create script's hash. And three warnings. Payroll web M I and the payroll users group would each hold three roles, and the D B A group would hold sys-admin. The plan is still written. Splitting the groups, or recording why not, is the identity engineer's call before the mapping is approved.`,
  `${M} — Unit "Exercise: Lab 1 (fixtures, no tenant)," setup and step 1; workbook Chapter 04, Lab 1.`);
}

// ================================================================== 8 Try it: cutover and rollback
{
  const s = content(SL, "Try it: read the cutover and the rollback");
  tag(s, "How");
  const c = code(s, "Cut", 0.6, 1.45, 12.15, [
    "# Step 2: read the cutover and the rollback",
    "$ Get-Content \"$Run\\logins\\sqlprd01-cutover.sql\", \"$Run\\logins\\sqlprd01-rollback.sql\"",
    "USE master;",
    "GO",
    "DENY CONNECT SQL TO [CONTOSO\\PayrollUsers];  -- group: superseded by SQL-Payroll-Users",
    "ALTER LOGIN [CONTOSO\\svc-payroll] DISABLE;  -- superseded by payroll-web-mi",
    "ALTER LOGIN [payroll_report] DISABLE;  -- superseded by payroll-reporting-app",
    "ALTER SERVER ROLE [sysadmin] DROP MEMBER [CONTOSO\\SQL-Admins];  -- DENY doesn't bind sysadmin members",
    "DENY CONNECT SQL TO [CONTOSO\\SQL-Admins];  -- group: superseded by SQL-DBA-Admins",
    "GO",
    "USE master;",
    "GO",
    "GRANT CONNECT SQL TO [CONTOSO\\PayrollUsers];",
    "ALTER LOGIN [CONTOSO\\svc-payroll] ENABLE;",
    "ALTER LOGIN [payroll_report] ENABLE;",
    "GRANT CONNECT SQL TO [CONTOSO\\SQL-Admins];",
    "ALTER SERVER ROLE [sysadmin] ADD MEMBER [CONTOSO\\SQL-Admins];",
    "GO",
  ], { label: `TRY IT  ·  ${CAP} (IN FULL)`, pt: 10 });
  line(s, "Grp", "ALTER LOGIN … DISABLE can't deny a Windows group; a server-permission DENY can. No line drops anything.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" step 2; workbook Chapter 04, Lab 1, \"Dangers,\" \"Verified facts\"; Microsoft Learn, ALTER LOGIN, DENY.");
  notes(s,
`Step two reads the cutover and the rollback. The user and the sequel login are disabled, and the rollback enables them. Contoso payroll users and Contoso sequel admins are Windows groups, so their lines are deny connect sequel and grant connect sequel. Alter login disable can't deny a Windows group, and a server-permission deny can. Contoso sequel admins is also a sys-admin member, and a deny doesn't apply to members of sys-admin. So the cutover takes the group out of the role first, and the rollback puts it back. Nothing is dropped.`,
  `${M} — Unit "Exercise: Lab 1," step 2; workbook Chapter 04, Lab 1, "Dangers," "Verified facts."`);
}

// ================================================================== 9 Try it: unresolved
{
  const s = content(SL, "Try it: leave one login out of the mapping");
  tag(s, "How");
  const c = code(s, "Unr", 0.6, 1.45, 12.15, [
    "# Step 3: leave one login out of the mapping",
    "$ Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1",
    "$ $audit = Read-SqlJson tests/fixtures/audit-day1/audit.json",
    "$ $short = Import-Csv tests/fixtures/mapping/sqlprd01-mapping.csv | Where-Object WindowsLogin -ne 'payroll_report'",
    "$ $plan = New-SqlLoginPlan -Instance $audit.instances[0] -Mapping $short",
    "$ $plan.Create | Select-String UNRESOLVED",
    "$ $plan.Cutover",
    "-- UNRESOLVED: payroll_report (S): map it, or record why it isn't migrated",
    "",
    "USE master;",
    "GO",
    "DENY CONNECT SQL TO [CONTOSO\\PayrollUsers];  -- group: superseded by SQL-Payroll-Users",
    "ALTER LOGIN [CONTOSO\\svc-payroll] DISABLE;  -- superseded by payroll-web-mi",
    "ALTER SERVER ROLE [sysadmin] DROP MEMBER [CONTOSO\\SQL-Admins];  -- DENY doesn't bind sysadmin members",
    "DENY CONNECT SQL TO [CONTOSO\\SQL-Admins];  -- group: superseded by SQL-DBA-Admins",
    "GO",
  ], { label: `TRY IT  ·  ${CAP} (IN FULL)`, pt: 10.5 });
  line(s, "Gap", "An unmapped login is UNRESOLVED and left out of the cutover: the plan never guesses an Entra principal.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" step 3; workbook Chapter 04, Lab 1, \"What it leaves to you.\"");
  notes(s,
`Step three leaves one login out of the mapping: the sequel login payroll report. It loads the kit's module, reads the day-one snapshot, drops that row from the mapping, and builds the plan again. The create script now carries an unresolved line: map it, or record why it isn't migrated. And the cutover leaves payroll report out. Its disable line is gone, so the login keeps working until someone maps it. The plan never guesses an Entra principal.`,
  `${M} — Unit "Exercise: Lab 1," step 3; workbook Chapter 04, Lab 1.`);
}

// ================================================================== 10 Try it: day 1
{
  const s = content(SL, "Try it: judge the parallel run on day 1");
  tag(s, "How");
  const c = code(s, "D1", 0.6, 1.45, 12.15, [
    "# Step 4: judge day 1",
    "$ ./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 `",
    "      -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath \"$Run\\parallel-day1\"",
    "Legacy               Entra                 LegacySessions EntraSessions Ready Why",
    "CONTOSO\\PayrollUsers SQL-Payroll-Users                 12             0 False Entra principal not seen connecting;",
    "                                                                                still arrives only on the legacy login",
    "CONTOSO\\svc-payroll  payroll-web-mi                    41             0 False Entra principal not seen connecting;",
    "                                                                                41 remote NTLM sessions; still arrives only on the legacy login",
    "CONTOSO\\SQL-Admins   SQL-DBA-Admins                     0             0 False Entra principal not seen connecting",
    "payroll_report       payroll-reporting-app              3             0 False Entra principal not seen connecting;",
    "                                                                                still arrives only on the legacy login",
    "Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-04/lab1/<run>/parallel-day1",
    "Evidence for PARALLEL (Judge the parallel run against its exit criteria): AC-2, CA-7; KSI-MLA-EVC",
    "Cutover-ready: 0 of 4: keep the parallel run going",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED; THE TABLE'S DASHED LINE CUT)`, pt: 10 });
  line(s, "Loc", "CONTOSO\\SQL-Admins shows 0 legacy sessions: its one session was local, and local sessions don't count.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" step 4; workbook Chapter 04, Lab 1, \"The parallel-run judge.\"");
  notes(s,
`Step four judges the parallel run on day one. Nothing connects through Entra yet, so nothing is ready: zero of four, keep the parallel run going. Read the Why column. Every Entra principal is not yet seen connecting. Contoso S V C payroll still has forty-one remote N T L M sessions. And three legacy logins still carry traffic that arrives nowhere else. Now look at Contoso sequel admins. It shows zero legacy sessions. Its one session was local, and local sessions always report N T L M, so they don't count.`,
  `${M} — Unit "Exercise: Lab 1," step 4; workbook Chapter 04, Lab 1.`);
}

// ================================================================== 11 Try it: day 30
{
  const s = content(SL, "Try it: judge the parallel run on day 30");
  tag(s, "How");
  const c = code(s, "D30", 0.6, 1.45, 12.15, [
    "# Step 5: judge day 30",
    "$ ./Test-SqlParallelRun.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -Instance SQLPRD01 `",
    "      -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath \"$Run\\parallel-day30\"",
    "Legacy               Entra                 LegacySessions EntraSessions Ready Why",
    "CONTOSO\\PayrollUsers SQL-Payroll-Users                  0            11  True already cut over (disabled or denied):",
    "                                                                                observe 30 days, then drop",
    "CONTOSO\\svc-payroll  payroll-web-mi                     0            44  True already cut over (disabled or denied): ...",
    "CONTOSO\\SQL-Admins   SQL-DBA-Admins                     0             2  True already cut over (disabled or denied): ...",
    "payroll_report       payroll-reporting-app              0             3  True already cut over (disabled or denied): ...",
    "Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-04/lab1/<run>/parallel-day30",
    "Evidence for PARALLEL (Judge the parallel run against its exit criteria): AC-2, CA-7; KSI-MLA-EVC",
    "Cutover-ready: 4 of 4: every exit criterion met",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED AND WRAPPED: "..." MARKS CUTS)`, pt: 10 });
  line(s, "Next", "The snapshot is after the cutover. The judge says what comes next: observe 30 days, then drop. Nothing is dropped yet.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" step 5; workbook Chapter 04, Lab 1; Runbook R05, Step 4.");
  notes(s,
`Step five judges day thirty. Every Entra principal is seen connecting, and no legacy session remains: four of four, every exit criterion met. This snapshot is after the cutover. Contoso S V C payroll and payroll report are disabled, and the two groups are denied connect sequel. The judge reads that state, and says what runbook R five says comes next: observe for thirty days, then drop. Nothing has been dropped yet.`,
  `${M} — Unit "Exercise: Lab 1," step 5; workbook Chapter 04, Lab 1; Runbook R05, Step 4.`);
}

// ================================================================== 12 Try it: manifest, re-hash, tests
{
  const s = content(SL, "Try it: the manifest, the re-hash and the tests");
  tag(s, "How");
  const c = code(s, "Man", 0.6, 1.45, 12.15, [
    "# Step 6: open the manifest",
    "$ Get-Content \"$Run\\parallel-day30\\manifest.json\"",
    "  \"step\": \"PARALLEL\",  \"mode\": \"read-only\",  \"asOf\": \"2026-12-20\",  \"controls\": [ \"AC-2\", \"CA-7\" ],  \"ksis\": [ \"KSI-MLA-EVC\" ],  ...",
    "# Step 7: re-hash the plan",
    "$ Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1",
    "$ Test-SqlManifest -OutputPath \"$Run\\logins\" | Format-Table",
    "File                  Recorded     Now          Match",
    "plan.csv              757a194ad93b 757a194ad93b  True",
    "plan.json             0186896b0845 0186896b0845  True",
    "sqlprd01-create.sql   deed30db5ccc deed30db5ccc  True",
    "sqlprd01-cutover.sql  0a04162bf925 0a04162bf925  True",
    "sqlprd01-rollback.sql b2d5964e9a6d b2d5964e9a6d  True",
    "# Step 8: run this chapter's tests",
    "$ Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 04*' -Output None -PassThru | Select-Object PassedCount, FailedCount",
    "PassedCount FailedCount",
    "         11           0",
    "# Step 9: list your runs",
    "$ Get-ChildItem C:\\FMWLabs\\results\\data-platform-04\\lab1 -Name",
    "<run>",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED AND REFLOWED: "..." MARKS A CUT; TABLE RULES CUT)`, pt: 10 });
  line(s, "Hash", "The hash a reviewer approves is the hash of the files on disk. Nothing to clean up: results stay in $Run.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 6 to 9; workbook Chapter 04, Lab 1.");
  notes(s,
`Step six opens the day-thirty manifest. It names the step, parallel, its mode, read-only, its controls, A C two and C A seven, its K S I, and the hash of each file it wrote. Step seven re-hashes the plan. Every file's recorded hash matches the file on disk, and that matters: the hash a reviewer approves is the hash of the files on disk. Step eight runs this chapter's tests: eleven pass, none fail. And step nine lists your runs. There's nothing to clean up. The kit's folder is as you unzipped it, and this run's results stay in its own folder.`,
  `${M} — Unit "Exercise: Lab 1," steps 6 to 9; workbook Chapter 04, Lab 1.`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: one mapping on your test instance");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A test instance, never production: SQL Server 2022 or later, not a failover cluster instance, Arc-enabled in a commercial Azure test subscription, with Entra authentication and an Entra admin set (Module 3), and a certificate your client trusts"],
    ["Then", "PowerShell 7 with SqlServer (22 or later) and Az.Accounts; the Entra admin; a test member of the test Entra group; a legacy Windows login that holds no server role"],
    ["The lab", "Write a one-row mapping, read the create script, run it as the Entra admin; sign in as the group's member, validate a real Entra connection, judge the run"],
    ["Back it out", "Step 8, as the Entra admin: drop the database users, then the login, and delete the lab's files. The Windows login was never touched"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "Not", b + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "Not run by the authors. ",
    "The create script is the only step that changes anything. DROP LOGIN fails while the login is connected: wait for the session to close.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 2 (your test instance)\"; workbook Chapter 04, \"Lab 2: a test instance.\"");
  notes(s,
`Lab 2 runs one mapping on your own test instance. It's not run by the authors. You need a test instance, never production: Sequel Server 2022 or later, not a failover cluster instance, Arc-enabled in a commercial Azure test subscription, which is where a Microsoft 365 G C C Moderate tenant's Arc resources live. It needs Entra authentication configured, an Entra admin set, as in Module 3, and a certificate your client trusts. Write a one-row mapping for one Windows login, read the create script, and run it as the Entra admin. That's the only step that changes anything. Then sign in as a member of the test Entra group, validate a real Entra connection, and judge the run. To back it out, sign in as the Entra admin, drop the database users the script created, then the login, and delete the lab's files. Drop login fails while the login is connected, so wait for the member's session to close and run that line again.`,
  `${M} — Unit "Exercise: Lab 2 (your test instance)"; workbook Chapter 04, "Lab 2: a test instance."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.0, 3.4, 2.4, 3.35], ["What the output shows", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["LOGINS: the plan", "AC-2; CM-3 Configuration Change Control; CM-4 Impact Analyses", "KSI-CMT-LMC, KSI-CMT-RVP", "The reviewed create, cutover and rollback scripts, plan.csv, the mapping and the manifest with each SHA-256"],
    ["LOGINS: the plan", "IA-2 Identification and Authentication (Organizational Users)", "None in the kit", "The same scripts: each person's access moves to an Entra principal"],
    ["PARALLEL: the judge", "AC-2 Account Management; CA-7 Continuous Monitoring", "KSI-MLA-EVC", "parallel.csv per snapshot with its manifest, and the SQL Server Audit files R05 keeps"],
  ], { fontSize: 12, limit: 5.4 });
  line(s, "Ass", "The records support these controls and provide evidence for them; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.25, 0.75, 13.5);
  sources(s, "Sources: Module 4, \"Introduction\" (the federal requirement); workbook Chapter 04, \"Federal requirements and evidence\"; NIST SP 800-53; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Chapter 4's table maps the login plan to NIST SP 800-53 A C two, Account Management, C M three, Configuration Change Control, and C M four, Impact Analyses, with two K S Is. The plan also supports I A two, Identification and Authentication for organizational users, which has no K S I pairing in the kit. The evidence is the reviewed create, cutover and rollback scripts, the plan file, the mapping, and the manifest with each file's hash. The parallel-run judge supports A C two and C A seven, Continuous Monitoring. Its evidence is the parallel file for each snapshot with its manifest, kept with the Sequel Server Audit files runbook R five keeps for the window. K S Is are FedRAMP twenty X indicators for cloud service providers; your providers report against them, the agency doesn't. The records provide evidence for a control; the agency sets each control's parameters, and the assessor decides.`,
  `${M} — Unit "Introduction" (the federal requirement); workbook Chapter 04 — "Federal requirements and evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on the cutover", [
    { q: "Why does SQLPRD01's cutover write DENY CONNECT SQL TO [CONTOSO\\PayrollUsers] instead of ALTER LOGIN … DISABLE?", options: ["a. ALTER LOGIN … DISABLE can't deny a Windows group (error 15151), and a server-permission DENY can", "b. A DENY also drops the group's database users", "c. Groups are dropped at cutover, not disabled"] },
    { q: "A legacy login has been disabled at cutover. When can it be dropped?", options: ["a. Right away, since the rollback no longer needs it", "b. After 30 days' observation, when the audit record, with failed logins for the disabled login, shows nothing still depends on it", "c. Only when the instance is retired"] },
  ], "1 a: a Windows group can't be disabled; a DENY on CONNECT SQL stops it, and GRANT rolls it back. 2 b: observe 30 days, then drop.");
  sources(s, "Sources: Module 4, \"Knowledge check,\" questions 1 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: why does sequel P R D oh one's cutover deny connect sequel to the Contoso payroll users group, instead of disabling the login? The answer is a. Alter login disable can't deny a Windows group: it returns error fifteen one fifty-one. A server-permission deny can. Second: a legacy login has been disabled at cutover. When can it be dropped? The answer is b: after thirty days' observation, when the audit record, with failed logins for the disabled login, shows nothing still depends on it. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary: proven first, then turned off");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Wrote SQLPRD01's create, cutover and rollback scripts",
    "Saw an unmapped login written as UNRESOLVED",
    "Judged the parallel run before and after the cutover",
    "Re-hashed the plan and ran the chapter's tests",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 5: groups, roles and the perimeter", [
    "Or workbook Chapter 04, for Lab 2 and its checklist",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "Evidence an ISSO keeps: ",
    "the reviewed scripts, plan.csv, the mapping and the manifest with each SHA-256; parallel.csv per snapshot with its manifest, kept with R05's SQL Server Audit files.");
  sources(s, "Sources: Module 4, \"Summary\"; workbook Chapter 04, \"Checklist.\"");
  notes(s,
`To sum up. A reviewed mapping becomes Entra logins beside the Windows ones, as T-SQL that executes nothing until it's approved. The parallel run decides from evidence when a legacy login can be turned off, and nothing is dropped until thirty days' observation. You wrote a fictional instance's plan and judged its parallel run before and after the cutover. The I S S O keeps the reviewed scripts, the plan, the mapping and the manifest with each hash, and the parallel file for each snapshot, kept with the audit files. Before shipping, work through Chapter 4's checklist. Next, Module 5: groups, roles and the perimeter.`,
  `${M} — Unit "Summary"; workbook Chapter 04, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/data-platform/04-entra-logins-and-the-parallel-run.md (Data Platform and SQL Server Identity learning path, Module 4): Introduction and its federal requirement, objectives, prerequisites, Units 2 and 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: Data Platform: SQL Server Identity, Chapter 11 (Three Principal Types) and Chapter 12 (What the Engine-Authentication Decision Settles); Runbook R05, Login Migration & Parallel-Run Validation: preconditions, Steps 1 to 4, rollback and the sa account. NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 04 of Building SQL Server Identity, Entra Logins and the Parallel Run: \"What Microsoft gives you\" (Microsoft Learn's CREATE LOGIN, ALTER LOGIN, DENY and sys.server_principals pages), \"The login plan,\" \"The parallel-run judge,\" Lab 1, Lab 2 (not run by the authors), \"Dangers,\" \"Federal requirements and evidence.\" Kit: examples/sql-server-identity (New-SqlLoginPlan.ps1, Test-SqlParallelRun.ps1, config/requirements.json, tests/fixtures).",
  "Lab output: the module page's Lab 1 expected output, recorded on November 25, 2026 by running the lab against the kit unzipped into C:\\FMWLabs; trimmed, wrapped and reflowed where the slides say so.",
]);

finish(OUT);
