// Data Platform and SQL Server Identity learning path, Module 2: The Authentication Audit — the module's narrated deck.
// Teaches docs/training/data-platform/02-the-authentication-audit.md, Learn-style: objectives, the concepts (what the
// audit reads; the findings and their severity; the Arc-eligibility categories and the service account), "Try it"
// slides with the module page's own Lab 1 commands and expected output (workbook Chapter 02's Lab 1 on the kit's
// fixtures), Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact comes from
// the module page, Runbook R03 and the Book 06 chapters it links, workbook Chapter 02, or the kit
// (examples/sql-server-identity); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-dp-module-2/build.js \
//                      presentations/training-dp-module-2/Training_DP_Module_2.pptx
const TITLE = "Module 2: The Authentication Audit";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Data Platform and SQL Server Identity learning path, Module 2: The Authentication Audit",
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
// Code lines are written raw, so Windows paths keep their backslashes.
const L = (s) => s.replace(/^\n/, "").replace(/\n$/, "").split("\n");
const OUT = process.argv[2] || "Training_DP_Module_2.pptx";
const M = "Training, Data Platform, Module 2";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 2: The Authentication Audit", "Data Platform and SQL Server Identity learning path · Runbook R03, with workbook Chapter 02",
    ["What the audit reads  ·  The findings  ·  The Arc-eligibility categories", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 2 of the Data Platform and SQL Server Identity learning path: the authentication audit. It teaches Runbook R oh three, with Chapter 2 of the developer workbook, Building SQL Server Identity. Module 1 decided which instances survive. Now you measure how each survivor authenticates.`,
  `${M} — Unit 1 "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why every later step depends on the audit");
  tag(s, "Why");
  const l = panel(s, "Rec", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "ON EACH SURVIVING INSTANCE", "How it authenticates today", [
    "Its authentication mode",
    "Every usable login, by type",
    "The state of sa",
    "The account the engine runs as",
  ], 13.5);
  const r = panel(s, "Use", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "WHAT DEPENDS ON IT", "Every later step", [
    "Arc, login migration and NTLM elimination start from this record",
    "It's re-run after every change, to measure progress",
  ], 13.5);
  callout(s, "Do", Math.max(l, r) + 0.3, 1.2, "FaListCheck", HEX.navy, "In this module: ",
    "you audit four fictional instances, rank their findings, and rerun the audit thirty days later.");
  sources(s, "Sources: Module 2, \"Introduction\"; Runbook R03; workbook Chapter 02.");
  notes(s,
`Why does this matter? For each instance that survived the gate, the audit records its authentication mode, every usable login by type, the state of the S A login, and the account the engine runs as. Every later step, Arc, login migration and N T L M elimination, depends on that record. And it's re-run after every change, to measure progress. In this module you audit four fictional instances, rank their findings, and rerun the audit thirty days later. Runbook R oh three is read-only from start to finish.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 2", [
    "Explain what the audit reads on each instance, and why it runs only on what Module 1 retained or chose as a target",
    "Rank the audit's findings, from an enabled sa down to the Arc-eligibility category",
    "Say what each Arc-eligibility category means, and why engine Entra authentication doesn't wait for OS-level Entra sign-in",
    "Explain why a single audit run can't show drift, and where the engine's service account goes",
  ], [
    "Module 1",
  ], 50);
  sources(s, "Sources: Module 2, \"Learning objectives,\" \"Prerequisites.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll explain what the audit reads on each instance, and why it runs only on what Module 1 retained or chose as a target. You'll rank the audit's findings, from an enabled S A down to the Arc-eligibility category. You'll say what each Arc-eligibility category means for the next step, and why engine Entra authentication doesn't wait for O S level Entra sign-in. And you'll explain why a single audit run can't show drift, and where the engine's service account goes. Before you start, finish Module 1.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 What the audit reads
{
  const s = content(SC, "What the audit reads on each instance");
  tag(s, "What");
  const b = table(s, "Read", 1.45, [2.9, 9.25], ["It reads", "What to know"], [
    ["Scope", "Only instances classified retain or consolidation target"],
    ["Authentication mode", "The running mode and the registry LoginMode are read in different places, and a change takes effect only after a restart: when they disagree, the kit reports a Mode anomaly"],
    ["Logins, by type", "From sys.server_principals: U Windows user, G Windows group, S SQL login, C certificate, K asymmetric key, E Entra user or application, X Entra group"],
    ["sa, and the engine", "Flags the sa account; captures the engine's service account and its SPN"],
  ], { fontSize: 12.5, limit: 5.2 });
  callout(s, "Short", b + 0.25, 1.2, "FaTriangleExclamation", HEX.amber, "A short list means a missing permission: ",
    "a reader without the right permissions gets a short login list and no error. The census leaves out built-in principals and counts only usable logins.");
  sources(s, "Sources: Module 2, Unit 2; Data Platform: SQL Server Identity, Chapter 07; Runbook R03; Chapter 02, \"The census.\"");
  notes(s,
`Unit 2 is what the audit reads. It runs only on instances classified retain or consolidation target. For each, it reads the authentication mode, and enumerates the logins from the server principals view by type: Windows users, Windows groups, SQL logins, logins mapped to a certificate or an asymmetric key, and the Entra types, E for a user or application and X for a group. It flags the S A account, and captures the engine's service account and its S P N. The running mode and the registry login mode are read in different places, and a change takes effect only after a restart, so the two can disagree. The kit reports that as a mode anomaly. And watch for this: a reader without the right permissions gets a short login list and no error. A short list means a missing permission, not a clean instance. The kit's census leaves out built-in principals, and counts only usable logins.`,
  `${M} — Unit 2 "What the audit reads"; workbook Chapter 02, "The census."`);
}

// ================================================================== 5 The findings
{
  const s = content(SC, "The findings, ranked by severity");
  tag(s, "What");
  const b = table(s, "Sev", 1.45, [2.6, 1.5, 8.05], ["Finding", "Severity", "When"], [
    ["sa enabled", "highest", "The login whose SID is 0x01 is enabled, whatever its name"],
    ["Usable SQL login", "critical", "Any other enabled SQL login with CONNECT SQL"],
    ["Mixed mode", "high", "IsIntegratedSecurityOnly is 0: SQL authentication is accepted"],
    ["Mode anomaly", "high", "The registry LoginMode disagrees with the running mode"],
    ["Service account", "medium", "The engine runs as a domain user account, or a built-in account"],
    ["sa not renamed", "medium", "sa is disabled but keeps its name"],
    ["Arc-eligibility", "info", "Category 3 for a failover cluster instance or a version before 2022; otherwise \"1 or 2\""],
  ], { fontSize: 12.5, limit: 6.5 });
  sources(s, "Sources: Module 2, Unit 2; Chapter 02, \"The findings\"; Data Platform: SQL Server Identity, Chapter 07, \"Login type classification.\"");
  notes(s,
`The audit returns one row per finding, with a severity from the data platform book's chapter, The Authentication Audit. Highest is S A enabled: the login whose security identifier is oh x oh one is enabled, whatever its name. Critical is any other usable SQL login. High is mixed mode, where SQL authentication is accepted, and a mode anomaly, where the registry disagrees with the running mode. Medium is the engine running as a domain user account or a built-in account, and an S A that's disabled but keeps its name. And at the bottom, an information row for each instance's Arc-eligibility category. The kit's audit script writes the census and the findings, each as a C S V and a jay-son file, and one manifest that hashes all four. A disabled login still counts as existing: Chapter 9's closure record decides when it's gone.`,
  `${M} — Unit 2 "What the audit reads"; workbook Chapter 02, "The findings."`);
}

// ================================================================== 6 Categories and the service account
{
  const s = content(SC, "The Arc-eligibility categories, and the engine's account");
  tag(s, "How");
  const b = table(s, "Cat", 1.45, [2.3, 9.85], ["Category", "What it means for the next step"], [
    ["1", "Ready for Entra logins now"],
    ["2", "Needs Arc deployed and Entra authentication configured first; many Windows logins, active SQL logins or missing SPNs go first"],
    ["3", "A version before SQL Server 2022, or a failover cluster instance on any version: upgrade, re-platform or carry a dated exception"],
  ], { fontSize: 13, limit: 4.0 });
  const l = panel(s, "Lay", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "TWO LAYERS", null, [
    "Layer 1, engine Entra authentication, proceeds on a domain-joined host",
    "It never waits for Layer 2, OS-level Entra sign-in",
    "The kit settles only the first pass here, 3 or \"1 or 2\"; Module 3 settles the rest",
  ], 13);
  const r = panel(s, "Svc", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "THE SERVICE ACCOUNT", null, [
    "The audit names the engine's service account and stops",
    "Converting a user account used as a service belongs to the service account guide, in the Data Platform project",
  ], 13);
  sources(s, "Sources: Module 2, Unit 3; Data Platform: SQL Server Identity, Chapters 07 and 08; Runbook R03; Chapter 02, \"The service account goes to another plan.\"");
  notes(s,
`Unit 3 is reading the audit. Its most consequential output is the Arc-eligibility category. Category 1 is ready for Entra logins now. Category 2 needs Arc deployed and Entra authentication configured first. Within it, instances with many Windows logins, active SQL logins or missing S P Ns go first. Category 3 is a version before SQL Server 2022, or a failover cluster instance on any version, and must upgrade, re-platform or carry a dated exception. Engine Entra authentication, Layer 1, proceeds on a domain-joined host, and never waits for O S level Entra sign-in, Layer 2. The kit settles only the first pass here, Category 3 or "1 or 2"; Module 3 settles the rest. And the audit names the engine's service account and stops. Converting a user account used as a service belongs to the service account guide.`,
  `${M} — Unit 3 "Reading the audit"; workbook Chapter 02, "The service account goes to another plan."`);
}
// ================================================================== 6b What each category asks of you
{
  const s = content(SC, "What each category asks of you");
  tag(s, "How");
  const b = table(s, "Ask", 1.45, [2.3, 9.85], ["Category", "What comes next"], [
    ["1", "Nothing in the infrastructure remains to be built: the audit has done its job when it delivers a precise login inventory"],
    ["2", "Arc deployment is a server-level action, not a SQL Server change: the agent connects the server and Arc installs the SQL extension; once Entra authentication is configured, the next audit re-classifies it to Category 1"],
    ["3", "Upgrade to SQL Server 2022 or later and follow the Category 2 path, or document a formal exception with a sunset date; a failover cluster instance re-platforms to a standalone instance or availability group"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Ntlm", b + 0.3, 1.2, "FaTriangleExclamation", HEX.amber, "The program's NTLM backstop, 2027-04-01: ",
    "a Category 3 instance's remaining NTLM connections fail then, exception or not; its Kerberos connections don't.");
  sources(s, "Sources: Module 2, Unit 3; Data Platform: SQL Server Identity, Chapter 08, \"Interpreting Category 1,\" \"Category 2,\" \"Category 3.\"");
  notes(s,
`What does each category ask of you? The data platform book's chapter, Reading the Audit, takes them in turn. For a Category 1 instance, nothing in the infrastructure remains to be built: the audit has done its job when it delivers a precise login inventory. For Category 2, the Arc deployment is a server-level action, not a SQL Server change. The agent connects the server, and Arc installs the Azure extension for SQL Server automatically. Once Entra authentication is configured on the instance, the next audit re-classifies it to Category 1. A Category 3 instance has two paths: upgrade the engine to SQL Server 2022 or later and follow the Category 2 path, or document a formal exception with a sunset date. A failover cluster instance re-platforms to a standalone instance or an availability group. And mind the program's N T L M backstop, April 1, 2027. A Category 3 instance's remaining N T L M connections fail then, whether it's excepted or not. Its Kerberos connections don't.`,
  `${M} — Unit 3 "Reading the audit"; Data Platform: SQL Server Identity, Chapter 08, "Interpreting Category 1," "Category 2," "Category 3."`);
}

// ================================================================== 6c Failure modes
{
  const s = content(SC, "When the audit degrades instead of failing");
  tag(s, "What");
  const b = table(s, "Fail", 1.45, [3.6, 8.55], ["State", "What it means"], [
    ["ActiveDirectory module absent", "SPN discovery is skipped: only the named hosts are audited, and orphaned logins can't be checked"],
    ["Domain controller unreachable", "The SPN query returns nothing; target a reachable one"],
    ["CIM unreachable on a host", "Service-account fields stay Unknown for that host; check WinRM, DCOM and the host firewall"],
    ["SQL connection fails", "The instance is recorded as Query Failed with an empty login inventory, rather than aborting the run"],
    ["TCP timeout", "TCPReachable is Timeout, as opposed to Yes or No; an instance that answers No is skipped"],
  ], { fontSize: 12.5, limit: 5.3 });
  line(s, "Know", "The script degrades rather than crashing: an empty or Unknown field is a state to read, not a clean result.", b + 0.3, 0.45, 13.5);
  sources(s, "Sources: Module 2, Unit 2; Runbook R03, \"Failure modes.\"");
  notes(s,
`Runbook R oh three's audit script degrades rather than crashing, so know what each state means. If the Active Directory module is absent, S P N discovery is skipped: only the hosts you name are audited, and orphaned logins can't be checked. If the domain controller is unreachable, the S P N query returns nothing, so target a reachable one. If a host can't be reached for its service details, the service-account fields stay unknown for that host. If the SQL connection fails, the instance is recorded as query failed, with an empty login inventory, rather than aborting the run. And a T C P timeout is recorded as timeout, as opposed to yes or no. An empty or unknown field is a state to read, not a clean result.`,
  `${M} — Unit 2 "What the audit reads"; Runbook R03, "Failure modes."`);
}
endModule(SC);

// ================================================================== 7 Try it: the instances
{
  const s = content(SL, "Try it: make the run's folder, read the instances");
  tag(s, "How");
  const c = code(s, "Inst", 0.6, 1.45, 12.15, L(String.raw`
$ Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
$ $Run = "C:\FMWLabs\results\data-platform-02\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
$ New-Item -ItemType Directory -Path $Run -Force | Out-Null
$ $Run
C:\FMWLabs\results\data-platform-02\lab1\<run>
# Step 1: read the four audited instances
$ Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$ (Read-SqlJson tests/fixtures/audit-day1/audit.json).instances | Select-Object name, productVersion, isIntegratedSecurityOnly, ...
name     productVersion isIntegratedSecurityOnly registryLoginMode isClustered serviceAccount
----     -------------- ------------------------ ----------------- ----------- --------------
SQLPRD01 16.0.4135.4                           0                 1           0 CONTOSO\svc-sqlprd01
SQLPRD02 16.0.4135.4                           1                 1           0 CONTOSO\svc-sqlprd02
SQLFCI04 15.0.4375.4                           0                 2           1 CONTOSO\svc-sqlfci04
SQLPRD06 17.0.1000.7                           1                 1           0 CONTOSO\gmsa-sqlprd06$
`), { label: `TRY IT  ·  ${CAP} (ONE COMMAND TRIMMED: "..." MARKS THE CUT)`, pt: 10.5 });
  line(s, "Mix", "SQLPRD01 runs in mixed mode (0) while its registry says Windows only (1).", c + 0.2, 0.45, 14);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" setup and step 1; Chapter 02, Lab 1, step 1.");
  notes(s,
`Try it. Lab 1 runs in PowerShell 7 on the kit's fictional estate, with no instance and no tenant. Go to the kit's folder, and make this run's results folder, named for the time you start, so running the lab again never overwrites a run. Step one reads the four audited instances. Only the instances Chapter 1 retained are audited. Look at sequel P R D oh one: it runs in mixed mode, zero, while its registry says Windows only, one. Sequel F C I oh four is clustered, and its registry says mixed. Three of the four engines run as domain user accounts, the S V C accounts in the contoso domain. And sequel P R D oh six, on SQL Server 2025, runs as a group managed service account, whose name ends in a dollar sign.`,
  `${M} — Unit 4 "Exercise: Lab 1," setup and step 1; workbook Chapter 02, Lab 1, step 1.`);
}

// ================================================================== 8 Try it: run the audit
{
  const s = content(SL, "Try it: run the audit");
  tag(s, "How");
  const c = code(s, "Aud", 0.6, 1.45, 12.15, L(String.raw`
# Step 2: run the audit
$ ./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -OutputPath "$Run\audit"
Instance U G S C K E X Disabled Usable
SQLPRD01 1 2 2 0 0 0 0        0      5
SQLPRD02 1 1 0 0 0 0 0        1      2
SQLFCI04 0 1 2 0 0 0 0        0      3
SQLPRD06 0 1 0 0 0 1 1        1      3
Instance Severity Finding          Detail
SQLPRD01 highest  sa enabled       sa is enabled under the name 'sa'
SQLPRD01 critical Usable SQL login payroll_report: migrate to an Entra login or record an exception
SQLPRD01 high     Mixed mode       SQL authentication is accepted (IsIntegratedSecurityOnly = 0)
SQLPRD01 high     Mode anomaly     Registry LoginMode 1, running mode 2: changed without a restart; resolve before migrating
SQLPRD01 medium   Service account  CONTOSO\svc-sqlprd01 is a user account with a password: the Data Platform project converts it ...
SQLPRD01 info     Arc-eligibility  Category 1 or 2 (run the Arc check)
...
SQLFCI04 info     Arc-eligibility  Category 3 (failover cluster instance)
SQLPRD06 info     Arc-eligibility  Category 1 or 2 (run the Arc check)
Wrote 4 files and manifest.json to C:/FMWLabs/results/data-platform-02/lab1/<run>/audit
Evidence for AUDIT (...): AC-2, IA-5, CM-6; KSI-PIY-GIV, KSI-IAM-SNU, KSI-SVC-ACM
`), { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS; TABLE RULES CUT)`, pt: 10.5 });
  line(s, "P06", "SQLPRD06 already has Entra logins (E and X), runs as a gMSA, and has no finding but its category.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" step 2; Chapter 02, Lab 1, step 2.");
  notes(s,
`Step two runs the audit. First the census: one row per instance, with usable logins counted by type, and disabled ones counted separately. Then the findings. Sequel P R D oh one has the full set: S A enabled, highest; a usable SQL login, payroll report, critical; mixed mode and a mode anomaly, both high, because the mode was changed without a restart; and a service account that's a user account with a password, medium. The cut rows give sequel F C I oh four almost the same list, with its own usable SQL login, vendor H R app. That login has a dated exception, but the audit reports it anyway; Chapter 9's closure record applies the exception. Sequel F C I oh four is Category 3, as a failover cluster instance. Sequel P R D oh two has only its service-account finding and its category. Sequel P R D oh six already has Entra logins, runs as a group managed service account, and has no finding but its category. The last line names the evidence: A C two, I A five and C M six.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 2; workbook Chapter 02, Lab 1, step 2, "The findings."`);
}

// ================================================================== 9 Try it: manifest and counts
{
  const s = content(SL, "Try it: open the manifest, count by severity");
  tag(s, "How");
  const c = code(s, "Man", 0.6, 1.45, 12.15, L(String.raw`
# Step 3: open the manifest
$ Get-Content "$Run\audit\manifest.json"
{
  "step": "AUDIT",
  "title": "Login census, authentication mode, sa and service-account findings",
  "mode": "read-only",
  "asOf": "2026-11-20",
  "controls": [ "AC-2", "IA-5", "CM-6" ],
  "ksis": [ "KSI-PIY-GIV", "KSI-IAM-SNU", "KSI-SVC-ACM" ],
  "files": [ { "file": "findings.csv", "sha256": "da5b8ba35d5e2bbf58d70c67c0bd90b675b6b60f08f58ee2466e09394b383fa7" }, ...
# Step 4: count the findings by severity
$ Import-Csv "$Run\audit\findings.csv" | Group-Object Severity | Select-Object Name, Count
Name     Count
critical     2
high         3
highest      2
info         4
medium       3
`), { label: `TRY IT  ·  ${CAP} (REFLOWED; "..." MARKS A CUT; TABLE RULES CUT)`, pt: 10.5 });
  line(s, "Four", "Four files hashed: findings.csv, findings.json, census.csv and census.json. Fourteen findings in all.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 3 and 4; Chapter 02, Lab 1, steps 3 and 4.");
  notes(s,
`Step three opens the manifest: four files, three controls and three K S Is, with each file's hash. The run was read-only. Step four counts the findings by severity: two highest, the two enabled S A logins; two critical, the two usable SQL logins; three high; three medium, the three service accounts; and four information rows, one category per instance.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 3 and 4; workbook Chapter 02, Lab 1, steps 3 and 4.`);
}

// ================================================================== 10 Try it: day 30
{
  const s = content(SL, "Try it: rerun the audit on day 30");
  tag(s, "How");
  const c = code(s, "D30", 0.6, 1.45, 12.15, L(String.raw`
# Step 5: rerun the audit on day 30
$ ./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -OutputPath "$Run\audit-day30"
Instance U G S C K E X Disabled Usable
SQLPRD01 0 1 0 0 0 2 2        3      5
SQLPRD02 1 1 0 0 0 0 0        1      2
SQLFCI04 0 1 2 0 0 0 0        0      3
SQLPRD06 1 1 0 0 0 1 1        1      4
Instance Severity Finding          Detail
SQLPRD01 medium   Service account  CONTOSO\svc-sqlprd01 is a user account with a password: the Data Platform project converts it ...
SQLPRD01 info     Arc-eligibility  Category 1 or 2 (run the Arc check)
...
SQLPRD06 info     Arc-eligibility  Category 1 or 2 (run the Arc check)
# Step 6: run this chapter's tests             # Step 7: list your runs
$ Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 02*' -Output None -PassThru | ...
PassedCount 6, FailedCount 0                   $ Get-ChildItem C:\FMWLabs\results\data-platform-02\lab1 -Name
`), { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS; STEPS 6 AND 7 REFLOWED SIDE BY SIDE)`, pt: 10.5 });
  line(s, "Drift", "SQLPRD06's U count went from 0 to 1, and no finding says so: a single audit doesn't compare runs.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 5 to 7; Chapter 02, Lab 1, steps 5 and 6.");
  notes(s,
`Step five reruns the audit on day 30. Sequel P R D oh one has moved to Entra logins. Its S A, renamed, a Windows login and payroll report are disabled, so disabled is three. Its two superseded Windows groups were denied connect SQL instead, so they leave the usable count without being counted as disabled. Nothing was dropped, and only its service-account finding and category remain. Now look at sequel P R D oh six. Its Windows user count went from zero to one, and no finding says so. A single audit doesn't compare runs; Chapter 9's drift check does. Step six runs this chapter's tests: six pass, none fail. Step seven lists your runs. There's nothing to clean up: the results stay in the run's own folder.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 5 to 7; workbook Chapter 02, Lab 1, steps 5 and 6.`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: audit a test instance's snapshot");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A test SQL Server instance, never production; PowerShell 7 with the SqlServer module; read grants for the lab only (VIEW SERVER STATE, or on 2022 and later VIEW SERVER PERFORMANCE STATE and VIEW SERVER SECURITY STATE; VIEW ANY DEFINITION or VIEW ANY SECURITY DEFINITION; CONNECT ANY DATABASE); never sysadmin"],
    ["1", "Check the reading login's own permissions"],
    ["2 and 3", "Export a SELECT-only audit snapshot, and compare its login count with one the instance's administrator trusts"],
    ["4 and 5", "Audit it; back it out: delete the run, keep lab2/audit.json for Module 3's Lab 2, have the grants removed"],
  ], { fontSize: 12.5, limit: 5.4 });
  callout(s, "Nr", b + 0.3, 0.75, "FaTriangleExclamation", HEX.amber, "Not run by the authors. ",
    "Nothing on the instance changes.");
  sources(s, "Sources: Module 2, \"Exercise: Lab 2\"; Chapter 02, \"Lab 2: a test instance.\"");
  notes(s,
`Lab 2 runs on your own test instance. It hasn't been run by the authors. You need a test SQL Server instance, never production, PowerShell 7 with the SQL Server module, and read permissions granted for the lab only. Never sysadmin. Check the reading login's own permissions first. Then export a SELECT-only audit snapshot, and compare its login count with one the instance's administrator trusts: a short list means a missing permission. Then audit it. Nothing on the instance changes. To back it out, delete the audit run, and have the administrator remove the lab's grants. Keep the snapshot if you go on to Module 3's Lab 2.`,
  `${M} — Unit 5 "Exercise: Lab 2"; workbook Chapter 02, "Lab 2: a test instance."`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.8, 2.75, 2.4, 3.2], ["What the step does", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["Counts every usable login by type on every audited instance", "AC-2 Account Management", "KSI-PIY-GIV, KSI-IAM-SNU", "census.csv, census.json and manifest.json"],
    ["Finds sa enabled, usable SQL logins and password-bearing service accounts", "IA-5 Authenticator Management", "KSI-IAM-SNU", "findings.csv, findings.json and manifest.json"],
    ["Finds mixed mode and a mode changed without a restart", "CM-6 Configuration Settings", "KSI-SVC-ACM", "findings.csv and manifest.json"],
  ], { fontSize: 12.5, limit: 5.2 });
  line(s, "Ass", "The run's files provide evidence; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.3, 0.45, 13.5);
  sources(s, "Sources: Module 2, \"Introduction\" (the federal requirement); Chapter 02, \"Federal requirements and evidence\"; NIST SP 800-53; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Chapter 2's table maps the audit to three controls in NIST SP 800-53. The login census supports A C two, Account Management, with the census files and the manifest as evidence. The S A, SQL login and service-account findings support I A five, Authenticator Management. And the mode findings support C M six, Configuration Settings. Runbook R oh three is read-only from start to finish, and its output feeds continuous-monitoring closure. K S Is are FedRAMP twenty X indicators for cloud service providers: the agency lines its own evidence up with them. The run's files provide evidence for each control; the agency still sets its parameters, and the assessor decides.`,
  `${M} — Unit 1 "Introduction" (the federal requirement); workbook Chapter 02, "Federal requirements and evidence."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on the audit", [
    { q: "Which finding does the audit rank highest?", options: ["a. Mixed mode", "b. sa enabled", "c. A usable SQL login"] },
    { q: "On day 30, SQLPRD06 has gained a Windows login. What does the day-30 audit say about it?", options: ["a. Nothing: a single audit doesn't compare runs, and Chapter 09's drift check does", "b. A critical finding for the new login", "c. It moves SQLPRD06 to Category 3"] },
  ], "1 b: sa enabled is highest, whatever its name. 2 a: one audit run can't show drift.");
  sources(s, "Sources: Module 2, \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: which finding does the audit rank highest? The answer is b: S A enabled. Second: on day 30, sequel P R D oh six has gained a Windows login. What does the day-30 audit say about it? The answer is a: nothing. A single audit doesn't compare runs; Chapter 9's drift check does. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: measure how each survivor authenticates");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Saw what the audit reads on each surviving instance, and how its findings rank",
    "Learned what each Arc-eligibility category means for the next step",
    "Audited four fictional instances, and saw why one run can't show drift",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 3: Arc and the Engine's Identity", [
    "Or workbook Chapter 02's checklist, before shipping",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "Evidence the ISSO keeps: ",
    "the run folder, census.csv, census.json, findings.csv and findings.json, with manifest.json holding each file's SHA-256.");
  sources(s, "Sources: Module 2, \"Summary\"; workbook Chapter 02, \"Checklist.\"");
  notes(s,
`To sum up. You learned what the audit reads on each surviving instance, how its findings rank, and what each Arc-eligibility category means for the next step. You audited four fictional instances, and saw why one audit run, on its own, can't show drift. The evidence an I S S O keeps from this module is the run folder, the census and findings files, and the manifest holding each file's hash. Before shipping, work through Chapter 2's checklist. Next is Module 3, Arc and the engine's identity.`,
  `${M} — Unit 7 "Summary"; workbook Chapter 02, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 2 deck", [
  "Module page: docs/training/data-platform/02-the-authentication-audit.md (Data Platform and SQL Server Identity learning path, Module 2): Introduction and its federal requirement, objectives, prerequisites, Units 2 and 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: Data Platform: SQL Server Identity, Chapters 07 (The Authentication Audit) and 08 (Reading the Audit); Runbook R03, The Authentication Audit: its primary script, failure modes and migration readiness. NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 02 of Building SQL Server Identity, The Authentication Audit: \"The census,\" \"The findings,\" \"The service account goes to another plan,\" Lab 1, Lab 2 (not run by the authors), \"Federal requirements and evidence,\" \"Checklist.\" Kit: examples/sql-server-identity (Invoke-SqlAuthAudit.ps1, powershell/SqlIdentity, tests/fixtures/audit-day1 and audit-day30).",
  "Lab output: the module page's Lab 1 expected output, on the kit's fictional fixtures; trimmed, wrapped and reflowed where the slides say so.",
]);

finish(OUT);
