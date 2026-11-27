// Data Platform and SQL Server Identity learning path, Module 7: The Application Chain — the module's narrated deck.
// Teaches docs/training/data-platform/07-the-application-chain.md, Learn-style: objectives, the concepts (the database
// axis and the kit's columns; what Microsoft gives you, by driver; the change and the three gates), "Try it" slides with
// the module page's own Lab 1 commands and expected output (the kit's four fictional applications), Lab 2, the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, workbook
// Chapter 07 and the Book 06 chapters and Runbook R08 it links, or the kit (examples/sql-server-identity); the deck
// adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-dp-module-7/build.js \
//                      presentations/training-dp-module-7/Training_DP_Module_7.pptx
const TITLE = "Module 7: The Application Chain";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Data Platform and SQL Server Identity learning path, Module 7: The Application Chain",
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
const OUT = process.argv[2] || "Training_DP_Module_7.pptx";
const M = "Training, Data Platform, Module 7";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 7: The Application Chain", "Data Platform and SQL Server Identity learning path · Runbook R08, with workbook Chapter 07",
    ["The database axis  ·  The driver table  ·  The three gates", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 7 of the Data Platform and SQL Server Identity learning path: the application chain. It goes with Runbook R oh eight and Chapter 07 of the developer workbook, Building SQL Server Identity. You'll find every connection string, mask every stored password, and place each string on the database axis before anything changes. Take this module after Modules 6 and 4.`,
  `${M} — Unit 1 "Introduction"; workbook Chapter 07, "In this chapter."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the engine is only half the chain");
  tag(s, "Why");
  const l = panel(s, "Today", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "THE OTHER HALF", "A connection string", [
    "Most hold a password or a Windows credential",
    "Until each string moves to an Entra mode, the application keeps the instance tied to Windows Authentication",
  ], 13.5);
  const r = panel(s, "Goal", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "IN THIS MODULE", "Every string, and its move", [
    "Every SQL Server connection string an application holds",
    "Which ones carry a stored password",
    "Configuration change, driver or code change, the vendor's decision, or already done",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 1.0, "FaRoute", HEX.navy, "The order: ",
    "list and classify every string first. No string changes until the three gates hold.");
  sources(s, "Sources: Module 7, Unit 1 \"Introduction\" and Unit 7 \"Summary\"; workbook Chapter 07, \"Goal and audience.\"");
  notes(s,
`Why does this matter? The engine is only half the chain. The other half is a connection string, and most of them hold a password or a Windows credential. Until each string moves to an Entra mode, the application keeps the instance tied to Windows Authentication. In this module you list every sequel server connection string an application holds, and say which ones carry a stored password. Then you say whether each move is a configuration change, a driver or code change, the vendor's decision, or already done. No string changes until the three gates hold.`,
  `${M} — Unit 1 "Introduction"; Unit 7 "Summary."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 7", [
    "Place a connection string in column A, B, C or D of the database axis, and say who decides column D",
    "Name the managed identity and service-principal modes in each driver family, and why the Entra password mode is never a target",
    "Run the kit's connection scan over fixtures and read its masked strings, columns and targets",
    "List the three gates that must hold before a string changes",
  ], [
    "Module 6",
    "Module 4: the Entra login that gate 1 checks for",
    "PowerShell 7 and the kit, unzipped into C:\\FMWLabs",
  ], 50);
  sources(s, "Sources: Module 7, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"Get the code.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll place a connection string in column A, B, C or D of the database axis, and say who decides column D. You'll name the managed identity and service-principal modes in each driver family, and say why the Entra password mode is never a target. You'll run the kit's connection scan over fixtures and read its masked strings, columns and targets. And you'll list the three gates that must hold before a string changes. Before you start, finish Module 6, and Module 4, for the Entra login that gate one checks for. The lab runs in PowerShell 7, in the kit you unzipped into the F M W Labs folder.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; learning path index, "Get the code."`);
}
endModule(SI);

// ================================================================== 4 The database axis
{
  const s = content(SC, "The database axis, and the column the scan sets");
  tag(s, "What");
  const b = table(s, "Axis", 1.45, [1.4, 6.0, 4.75], ["Column", "When the kit sets it", "Target"], [
    ["A", "Configuration only: the driver's version is at or above the managed identity release", "The managed identity keyword on an Arc or Azure host"],
    ["B", "Code change: the driver has no Entra path (System.Data.SqlClient, SQLOLEDB, ODBC 13 and older), or is too old", "Move to Microsoft.Data.SqlClient, ODBC Driver 18 or MSOLEDBSQL first"],
    ["C", "Vendor-dependent: app.json says a vendor owns the application", "The vendor's supported mode, by release"],
    ["done", "Already on an Entra mode that isn't deprecated", "None"],
    ["review", "No app.json, or a driver the table doesn't know", "None until the owner fills app.json"],
  ], { fontSize: 12, limit: 5.1 });
  callout(s, "D", b + 0.25, 1.2, "FaUserTie", HEX.navy, "Column D, no Entra path today: ",
    "the scan never sets it. Only the owner can say a vendor has no release coming or an application is to be retired, with a dated entry in the exception registry.");
  sources(s, "Sources: Module 7, Unit 2; Book 06, Ch 18, \"Two axes\"; Runbook R08, four-class triage; workbook Chapter 07, \"The code.\"");
  notes(s,
`Unit 2 is the database axis. The data platform book's chapter on the four-class pattern for applications describes two independent axes: how users sign in to the application, and how the application connects to the database. On the database axis, evidence places each application in one of four columns. A is configuration only. B is a code change. C is vendor-dependent. And D is no Entra path today. The kit's scan reads each application's configuration files, masks every stored password, and sets A, B, C or done, from the driver, its version, the host, and whether a vendor owns the application. A string with no owner's file, or a driver the table doesn't know, goes to review. The scan never sets column D. Only the owner can say a vendor has no release coming or an application is to be retired, and that answer goes into the exception registry, with a date.`,
  `${M} — Unit 2 "The database axis"; workbook Chapter 07, "The code."`);
}

// ================================================================== 5 Driver table
{
  const s = content(SC, "What Microsoft gives you: Entra modes by driver");
  tag(s, "What");
  const b = table(s, "Drv", 1.45, [4.3, 2.6, 2.6, 2.65], ["Driver family (first release)", "Managed identity", "Service principal", "Credential chain"], [
    ["Microsoft.Data.SqlClient", "2.1", "2.0", "3.0"],
    ["ODBC", "17.3.1.1", "17.7", "—"],
    ["MSOLEDBSQL", "18.3", "18.5", "—"],
    ["mssql-jdbc", "12.2", "12.2", "12.2"],
  ], { fontSize: 13, limit: 4.0 });
  const l = panel(s, "Rules", 0.6, b + 0.25, 12.15, null, HEX.navy, HEX.navyTint, "WHAT THE DRIVER PAGES ALSO SAY", null, [
    "The Entra password mode is deprecated in every family: never a migration target",
    "A token doesn't grant database permissions by itself; prefer a specific mode in production over Default",
    "On an Arc-enabled server, only a local administrator or a member of Hybrid Agent Extension Applications can get the token",
  ], 12.5);
  sources(s, "Sources: Module 7, Unit 3; workbook Chapter 07, \"What Microsoft gives you\"; Book 06, Ch 19, Entra options by driver; config/drivers.json.");
  notes(s,
`Unit 3 starts with what Microsoft gives you. Each driver family added Entra modes in specific releases. Microsoft Data SQL Client added service principal in two point oh, managed identity in two point one, and Default in three point oh. The O D B C driver added managed identity in seventeen point three point one point one and service principal in seventeen point seven. The table gives the O L E D B driver eighteen point three and eighteen point five, and the J D B C driver twelve point two. In every family the Entra password mode is deprecated, so it's never a migration target. Microsoft also says a token doesn't grant database permissions by itself, and to prefer a specific mode in production, such as managed identity, over Default. And on an Arc-enabled Windows server, a process can get the machine's managed identity token only if it runs as a local administrator, or as a member of the Hybrid Agent Extension Applications group.`,
  `${M} — Unit 3 "The driver table and the three gates"; workbook Chapter 07, "What Microsoft gives you."`);
}

// ================================================================== 6 The change and the gates
{
  const s = content(SC, "The change, and the three gates in front of it");
  tag(s, "How");
  const l = panel(s, "Chg", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE CHANGE ON AN ARC-ENABLED SERVER", null, [
    "Integrated Security becomes Authentication=Active Directory Managed Identity",
    "The application's process account must be allowed to request the host's token",
    "Off Arc, no managed identity: the kit names the service-principal mode, certificate preferred, never Default",
  ], 13);
  const r = panel(s, "Gates", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE THREE GATES", "All must hold first", [
    "1. The Entra login exists",
    "2. The role is granted",
    "3. The change is tested in a production-equivalent environment",
  ], 13);
  callout(s, "Fail", Math.max(l, r) + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "The danger: ",
    "a string changed before the gates hold fails at sign-in. The scan's target is advice, not a change: it rewrites nothing.");
  sources(s, "Sources: Module 7, Unit 3; Book 06, Ch 19, the change and the gate conditions; Runbook R08, three gates; workbook Chapter 07, \"Dangers.\"");
  notes(s,
`Then the change. The data platform book's chapter on connection string migration gives it for an application on an Arc-enabled server. Integrated Security becomes Authentication equals Active Directory Managed Identity, and the application's process account must be allowed to request the host's token. Off Arc there's no managed identity, so the kit names the service-principal mode, with a certificate preferred. It never suggests Default. The change is simple, but gated. Gate one: the Entra login exists. Gate two: the role is granted. Gate three: the change is tested in a production-equivalent environment. A string changed before the gates hold fails at sign-in. And the scan's target is advice, not a change: the kit rewrites nothing.`,
  `${M} — Unit 3 "The driver table and the three gates"; workbook Chapter 07, "The code," "Dangers."`);
}
// ================================================================== 6b Dangers
{
  const s = content(SC, "Dangers, and the guard against each");
  tag(s, "Who");
  table(s, "Dng", 1.45, [3.5, 4.1, 4.55], ["Danger", "What happens", "The guard"], [
    ["A password copied into a report", "The scan's output becomes a secret store", "Masking in ConvertFrom-SqlConnectionString, and a test that no fixture password appears"],
    ["The password mode counted as done", "A deprecated flow that can't do MFA stays in production", "deprecatedModes; the finding names it"],
    ["Active Directory Default in production", "The first connection is slow, and the identity can change with host settings", "Name the mode; off Arc the kit names the service-principal mode, certificate preferred"],
    ["Every application on a host shares the Arc identity", "One login's grants cover everything allowed to ask for the token", "Keep the group to the accounts that need it; give an application its own service principal where grants differ"],
    ["A string changed before the gates hold", "The application fails at sign-in", "Gates 1 to 3 in Lab 2, in that order"],
  ], { fontSize: 12, limit: 6.4 });
  sources(s, "Sources: Module 7, Unit 3; workbook Chapter 07, \"Dangers.\"");
  notes(s,
`Chapter 07 of the workbook names the dangers, and the guard against each. A password copied into a report turns the scan's output into a secret store, so the kit masks every password, and a test checks that no fixture password appears. The password mode counted as done would leave a deprecated flow that can't do M F A in production, so the finding names it. Active Directory Default in production makes the first connection slow, and the identity can change with host settings, so name the mode. Every application on a host shares the Arc identity, so one login's grants cover everything allowed to ask for the token. Keep the Hybrid Agent Extension Applications group to the accounts that need it, and give an application its own service principal where its grants differ. And a string changed before the gates hold fails at sign-in, so Lab 2 checks gates one to three, in that order.`,
  `${M} — Unit 3 "The driver table and the three gates"; workbook Chapter 07, "Dangers."`);
}
endModule(SC);

// ================================================================== 7 Try it: scan
{
  const s = content(SL, "Try it: scan the four applications");
  tag(s, "How");
  const c = code(s, "Scan", 0.6, 1.45, 12.15, [
    "$ Set-Location C:\\FMWLabs\\sql-server-identity-code\\sql-server-identity",
    "$ $Run = \"C:\\FMWLabs\\results\\data-platform-07\\lab1\\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')\"   # ...",
    "# Step 1: scan the four applications",
    "$ ./Invoke-SqlConnectionScan.ps1 -Path tests/fixtures/apps -OutputPath \"$Run\\connections\" -AsOf 2026-11-20",
    "Application  File                                    Finding            Driver                        Column",
    "    Target",
    "claims-batch claims-batch/claims.config.json         Stored password    System.Data.SqlClient         B",
    "    Move to Microsoft.Data.SqlClient, ODBC Driver 18 or MSOLEDBSQL first",
    "payroll-web  payroll-web/appsettings.Production.json Entra already      Microsoft.Data.SqlClient      done",
    "payroll-web  payroll-web/web.config                  Windows integrated Microsoft.Data.SqlClient      A",
    "    Authentication=Active Directory Managed Identity",
    "reports-odbc reports-odbc/reports.dsn                Windows integrated ODBC Driver 13 for SQL Server B",
    "    Move to Microsoft.Data.SqlClient, ODBC Driver 18 or MSOLEDBSQL first",
    "vendor-hr    vendor-hr/vendorhr.ini                  Stored password    SQLOLEDB                      C",
    "    Move to Microsoft.Data.SqlClient, ODBC Driver 18 or MSOLEDBSQL first",
    "Wrote 2 files and manifest.json to $Run/connections",
    "Evidence for CONN (Find stored credentials and classify each connection string): IA-5, CM-6; ...",
    "Stored passwords: 2. Column A (configuration only): 1.",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED; "..." MARKS CUTS; PATHS SHORTENED)`, pt: 10 });
  line(s, "Col", "payroll-web: Arc host, Microsoft.Data.SqlClient 5.2.2, so column A. vendor-hr: a vendor owns it, so column C.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 7, Unit 4 \"Exercise: Lab 1,\" step 1; workbook Chapter 07, Lab 1.");
  notes(s,
`Try it. Lab 1 runs in PowerShell 7 on the kit's four fictional applications, with no tenant. Go to the kit's folder and make this run's results folder, named for the time you start, in U T C. Step one scans the four applications. Two strings hold a stored password, and one is already on Entra. Payroll web's web dot config string uses Windows integrated authentication. It runs on an Arc host with Microsoft Data SQL Client five point two point two, at or above the managed identity release, so it's column A: a configuration change. Claims batch and reports O D B C use drivers with no Entra path, so they're column B. Vendor H R is column C because a vendor owns it. The target text there is the kit's generic advice; the vendor's release decides.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," step 1; workbook Chapter 07, Lab 1.`);
}

// ================================================================== 8 Try it: masked strings
{
  const s = content(SL, "Try it: read the masked strings");
  tag(s, "How");
  const c = code(s, "Mask", 0.6, 1.45, 12.15, [
    "# Step 2: read the masked strings",
    "$ Import-Csv \"$Run\\connections\\connections.csv\" | Select-Object Application, Server, Masked | Format-List",
    "Application : claims-batch",
    "Masked      : Data Source=sqlprd02.contoso.example;Initial Catalog=Claims;User ID=claims_batch;Password=********;...",
    "Application : payroll-web",
    "Masked      : Server=tcp:sqlprd01.contoso.example,1433;Database=PayrollArchive;Authentication=Active Directory",
    "              Managed Identity;Encrypt=True",
    "Application : payroll-web",
    "Masked      : Server=sqlprd01.contoso.example;Database=Payroll;Integrated Security=SSPI;Encrypt=True",
    "Application : reports-odbc",
    "Masked      : DRIVER=ODBC Driver 13 for SQL Server;SERVER=sqlleg03.contoso.example;DATABASE=Reports;...",
    "Application : vendor-hr",
    "Masked      : Provider=SQLOLEDB;Data Source=sqlfci04.contoso.example;Initial Catalog=VendorHR;User ID=vendorhr_app;",
    "              Password=********",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS; SERVER LINES AND BLANK LINES LEFT OUT; WRAPPED)`, pt: 10.5 });
  line(s, "None", "No password reaches the output: every Password= and PWD= value becomes ********.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" step 2; workbook Chapter 07, \"The code,\" \"Dangers.\"");
  notes(s,
`Step two reads the masked strings. No password reaches the output. The scan replaces every password value with stars, and never returns or writes the password itself. That's the guard against a danger: a password copied into a report turns the scan's output into a secret store. Look at the two stored passwords: claims batch's sequel login, and vendor H R's. And look at payroll web's two strings: the archive database already uses Active Directory Managed Identity, and the payroll database still uses integrated security.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 2; workbook Chapter 07, "The code," "Dangers."`);
}

// ================================================================== 9 Try it: password mode
{
  const s = content(SL, "Try it: parse a deprecated password-mode string");
  tag(s, "How");
  const c = code(s, "Pwd", 0.6, 1.45, 12.15, [
    "# Step 3: parse a deprecated password-mode string",
    "$ Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1",
    "$ ConvertFrom-SqlConnectionString 'Server=sqlprd01.contoso.example;Database=Payroll;Authentication=Active Directory",
    "      Password;User ID=svc-payroll@contoso.example;Password=NotARealOne' | Format-List",
    "Server         : sqlprd01.contoso.example",
    "Authentication : entra",
    "Mode           : Active Directory Password",
    "Masked         : Server=sqlprd01.contoso.example;Database=Payroll;Authentication=Active Directory Password;",
    "                 User ID=svc-payroll@contoso.example;Password=********",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED)`, pt: 11 });
  const l = line(s, "Fnd", "It parses as entra, but the mode is deprecated: the scan reports it as a finding, never as done.", c + 0.25, 0.45, 14);
  callout(s, "Why", l + 0.2, 1.15, "FaTriangleExclamation", HEX.amber, "Why it matters: ",
    "a deprecated flow that can't do MFA would stay in production. deprecatedModes in config/drivers.json names it.");
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" step 3; workbook Chapter 07, \"What it leaves to you,\" \"Dangers.\"");
  notes(s,
`Step three parses a string that uses the deprecated password mode. It parses as entra, because it is an Entra mode. But the mode is the deprecated one, so the scan reports it as a finding, and never as done. A careless scan would count it as done, and a deprecated flow that can't do M F A would stay in production. The kit's driver configuration lists the deprecated modes, and the finding names it. And notice the password: even here, it comes back masked.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 3; workbook Chapter 07, "What it leaves to you," "Dangers."`);
}

// ================================================================== 10 Try it: driver table
{
  const s = content(SL, "Try it: read the kit's driver table");
  tag(s, "How");
  const c = code(s, "Tbl", 0.6, 1.45, 12.15, [
    "# Step 4: read the driver table",
    "$ (Get-Content config/drivers.json -Raw | ConvertFrom-Json).families |",
    "      Format-Table id, managedIdentity, servicePrincipal, credentialChain",
    "id                       managedIdentity servicePrincipal credentialChain",
    "--                       --------------- ---------------- ---------------",
    "Microsoft.Data.SqlClient 2.1             2.0              3.0",
    "ODBC                     17.3.1.1        17.7",
    "MSOLEDBSQL               18.3            18.5",
    "mssql-jdbc               12.2            12.2             12.2",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED)`, pt: 12 });
  line(s, "Rel", "The first release of each mode, as the data platform book's Chapter 19 gives it. The scan reads this file.", c + 0.25, 0.45, 14);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" step 4; workbook Chapter 07, \"What it leaves to you\"; Book 06, Ch 19.");
  notes(s,
`Step four reads the driver table the scan uses: the first release of each mode, as the data platform book's chapter on connection string migration gives it. Microsoft Data SQL Client has managed identity from two point one. That's why payroll web, on five point two point two, is column A. O D B C has managed identity from seventeen point three point one point one, so the reports application's O D B C thirteen driver has no Entra path, and it's column B. The last column is the credential chain mode. Microsoft lists Default from three point oh in the sequel client, and the kit never suggests it.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 4; workbook Chapter 07, "What it leaves to you," "The code."`);
}

// ================================================================== 11 Try it: manifest, tests, runs
{
  const s = content(SL, "Try it: the manifest, the tests and your runs");
  tag(s, "How");
  const c = code(s, "Man", 0.6, 1.45, 12.15, [
    "# Step 5: open the manifest",
    "$ Get-Content \"$Run\\connections\\manifest.json\"",
    "  \"step\": \"CONN\",  \"mode\": \"read-only\",  \"asOf\": \"2026-11-20\",",
    "  \"controls\": [ \"IA-5\", \"CM-6\" ],  \"ksis\": [ \"KSI-IAM-SNU\", \"KSI-SVC-ACM\" ],",
    "  { \"file\": \"connections.csv\",  \"sha256\": \"8d47142466c6cd3d369fb61ecf2c754473a52b245875f23ed141d28e79d11c2a\" },",
    "  { \"file\": \"connections.json\", \"sha256\": \"9376f94e5c88dae5dacc3cf3f2758ae7b26cdfa92adbed90333392d7ff19d9ac\" }",
    "# Step 6: run this chapter's tests",
    "$ Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 07*' -Output None -PassThru | ...",
    "PassedCount FailedCount",
    "          7           0",
    "# Step 7: list your runs",
    "$ Get-ChildItem C:\\FMWLabs\\results\\data-platform-07\\lab1 -Name",
    "<run>",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED AND REFLOWED: "..." MARKS A CUT)`, pt: 10.5 });
  line(s, "Ro", "The scan ran read-only: it wrote its own output and rewrote no application's configuration.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 5 to 7; workbook Chapter 07, \"The code.\"");
  notes(s,
`Step five opens the manifest: the step, its mode, read-only, its controls, I A five and C M six, its two K S Is, and the S H A two fifty-six of each file. The kit wrote its own output and rewrote nothing. Step six runs this chapter's tests: seven pass, none fail. And step seven lists your runs. There's nothing to clean up: the kit's folder is as you unzipped it, and each run's results stay in their own folder.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 5 to 7; workbook Chapter 07, "The code."`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: one column-A test application");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "An IIS application on an Arc-enabled host, Microsoft.Data.SqlClient 2.1 or later with Integrated Security, against a test instance on SQL Server 2022 or later with Entra authentication; the owner's app.json; PowerShell 7 as local administrator, SqlServer module, Azure CLI in AzureCloud"],
    ["1 to 3", "Copy the configuration and scan the copy; check gates 1 and 2: the login exists and holds a role"],
    ["4 to 6", "Let the application pool ask for the token; keep the original file; change the one string"],
    ["7 and 8", "Gate 3: see the application arrive on its Entra login; scan again: Entra already, column done"],
    ["9", "Back it out: restore the original, restart the pool, remove it from the group, sign out of Azure"],
  ], { fontSize: 12, limit: 5.6 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors. ",
    "Never production: one test application, in a test environment.");
  sources(s, "Sources: Module 7, Unit 5 \"Exercise: Lab 2\"; workbook Chapter 07, \"Lab 2: a test application.\"");
  notes(s,
`Lab 2 changes one string in one test application, never production. It was not run by the authors. It must be a column-A case: an I I S application on an Arc-enabled Windows host, using Microsoft Data SQL Client two point one or later with integrated security, against a test instance on sequel server twenty twenty-two or later with Entra authentication configured. Its owner writes the app file. You copy the configuration and scan the copy, then check gates one and two: the login exists and holds a role. You let the application pool ask for the token, keep the original file as the way back, and change the one string. Gate three is seeing the application arrive on its Entra login. Then a second scan should say Entra already, column done. Step nine backs it all out: it restores the original file, restarts the pool, removes it from the group and signs out of Azure.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test instance)"; workbook Chapter 07, "Lab 2: a test application."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.0, 2.9, 2.5, 3.75], ["What the output shows", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["The scan (Lab 1; Lab 2 steps 1 and 2)", "IA-5 Authenticator Management; CM-6 Configuration Settings", "KSI-IAM-SNU, KSI-SVC-ACM", "connections.csv with masked strings and the manifest; each application's app.json"],
    ["The change (Lab 2 steps 3 to 8)", "IA-5; CM-6", "KSI-IAM-SNU, KSI-SVC-ACM", "The gate queries' output, the before and after scans, the session read, the change record"],
  ], { fontSize: 12.5, limit: 5.0 });
  line(s, "Ass", "The scan's records support these controls; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.3, 0.75, 13.5);
  sources(s, "Sources: Module 7, Unit 1 (the federal requirement); NIST SP 800-53; FedRAMP 20x KSIs; Chapter 07, \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. Chapter 07 of the workbook maps both the scan and the change to I A five, Authenticator Management, and C M six, Configuration Settings, in NIST SP 800-53. The scan supports I A five: a stored password found, then removed. And it provides evidence for C M six: each string's authentication setting, recorded. For the scan, the I S S O keeps the connections file with masked strings and the manifest, and each application's app file. For a change, the gate queries' output, the before and after scans, the session read, and the change record. Runbook R oh eight lists the evidence for each state of the cutover. K S Is are FedRAMP twenty X indicators for cloud service providers; your providers report against them, the agency doesn't. The scan's records support these controls; the assessor decides whether each one is in place.`,
  `${M} — Unit 1 "Introduction" (the federal requirement); workbook Chapter 07, "Federal requirements and evidence."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on connection strings", [
    { q: "payroll-web's web.config uses Integrated Security=SSPI. Why does the scan put it in column A?", options: ["a. A vendor owns the application", "b. Arc host, Microsoft.Data.SqlClient 5.2.2, at or above the managed identity release: a configuration change", "c. It already uses an Entra mode"] },
    { q: "Which three conditions must hold before a connection string changes?", options: ["a. The Entra login exists, it holds the database role, and the change is tested in a production-equivalent environment", "b. The SPN is registered, the client is domain-joined, and NTLM is blocked", "c. The vendor approves, the password is rotated, and Conditional Access is on"] },
  ], "1 b: column A is a configuration change. 2 a: the three gates, in that order.");
  sources(s, "Sources: Module 7, Unit 6 \"Knowledge check,\" questions 1 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: payroll web's web dot config uses integrated security. Why does the scan put it in column A? The answer is b: it runs on an Arc host with Microsoft Data SQL Client five point two point two, at or above the managed identity release, so the move is a configuration change. Second: which three conditions must hold before a connection string changes? The answer is a: the Entra login exists, it holds the database role, and the change is tested in a production-equivalent environment. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary: every string found, masked and placed");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Scanned four fictional applications",
    "Found two stored passwords without writing either one out",
    "Placed each string in column A, B, C or done from its driver, host and owner",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 8: AD CS dependencies", [
    "Or workbook Chapter 07, for Lab 2 and its checklist",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "The ISSO keeps: ",
    "connections.csv with masked strings and connections.json, with manifest.json and each file's SHA-256; each app.json; for a change, the gate queries, scans, session read and change record.");
  sources(s, "Sources: Module 7, Unit 7 \"Summary\"; workbook Chapter 07, \"Checklist.\"");
  notes(s,
`To sum up. You scanned four fictional applications, found two stored passwords without writing either one out, and placed each string in column A, B, C or done, from its driver, host and owner. The scan advises; no string changes until the three gates hold. The I S S O keeps the connections files with masked strings and the manifest, each application's app file, and for a change, the gate queries' output, the before and after scans, the session read and the change record. Before shipping, work through the Chapter 07 checklist. Next is Module 8, A D C S dependencies.`,
  `${M} — Unit 7 "Summary"; workbook Chapter 07, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 7 deck", [
  "Module page: docs/training/data-platform/07-the-application-chain.md (Data Platform and SQL Server Identity learning path, Module 7): Introduction and its federal requirement, objectives, prerequisites, Units 2 and 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: Book 06, Data Platform: SQL Server Identity, Chapter 18 (two axes) and Chapter 19 (the connection-string change, Entra options by driver, the gate conditions); Runbook R08, application chain and connection strings (four-class triage, three gate conditions, control states). NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 07, Building SQL Server Identity, The Application Chain: \"What Microsoft gives you\" (Microsoft Learn's driver pages, Arc managed identity), \"What it leaves to you,\" \"The code,\" Lab 1, Lab 2 (not run by the authors), \"Dangers,\" \"Federal requirements and evidence,\" \"Checklist.\" Kit: examples/sql-server-identity (Invoke-SqlConnectionScan.ps1, config/drivers.json, tests/fixtures/apps).",
  "Lab output: the module page's Lab 1 expected output on the kit's fictional fixtures; trimmed, wrapped and reflowed, with paths shortened to $Run, where the slides say so.",
]);

finish(OUT);
