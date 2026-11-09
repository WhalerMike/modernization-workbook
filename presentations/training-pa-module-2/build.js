// Privileged Access learning path, Module 2: Emergency access first — the module's narrated deck.
// Teaches docs/training/privileged-access/02-emergency-access-first.md, Learn-style: objectives, the concepts, "Try it"
// slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/privileged-access),
// Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module
// page, the learning path's verification log, or the kit (examples/privileged-access); the deck adds none. The narration
// names the original source the workbook footnotes for each fact (workbook Chapter 02's footnotes).
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pa-module-2/build.js \
//                      presentations/training-pa-module-2/Training_PA_Module_2.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 2: Emergency access first",
  footer: "Federal Modernization Workbook  ·  Privileged Access learning path, Module 2: Emergency access first",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Privileged Access learning path — Module 2: Emergency access first";
const OUT = process.argv[2] || "Training_PA_Module_2.pptx";
const M = "Training, Privileged Access, Module 2";

const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "PRIVILEGED ACCESS LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
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
  const s = title(SI, "Module 2: Emergency access first", "Privileged Access learning path · Plan Phases 0 and 1 (A0.4, A1.1) · Chapter 02",
    ["The documented lockout  ·  The standard and the check  ·  PA-EA-08 and report-only", "The alert  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence for Gate 1"]);
  notes(s,
`Welcome to Module 2 of the Privileged Access learning path: emergency access first. This module serves the project plan's task A0.4 in Phase 0 and A1.1 in Phase 1, with Chapter 02 of the developer workbook. It's the one step in the project that can't move. In it you check each emergency access account against Microsoft Learn's standard, from code, with rules E A oh one to E A ten. You build the alert on their use as a reviewed template that also sees non-interactive sign-ins and audit events. And you keep a drill record. The code runs on your laptop against the same fictional tenant as Module 1. It's illustrative: tested against fixtures, not run against a production tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why emergency access comes before any setting changes");
  tag(s, "Why");
  const l = panel(s, "Lock", 0.6, 1.45, 6.4, null, HEX.red, HEX.redTint, "THE DOCUMENTED LOCKOUT", "No one can approve", [
    "Every Global Administrator and Privileged Role Administrator eligible",
    "Approval required",
    "No approvers selected",
    "So administration is locked",
  ], 13.5);
  const r = panel(s, "Lean", 7.25, 1.45, 5.5, null, HEX.navy, HEX.navyTint, "EVERY LATER MODULE THAT WRITES LEANS ON THIS ONE", null, [
    "Module 3 keeps the emergency group excluded from every policy file",
    "Module 4 refuses any PIM change until the accounts hold Global Administrator, active, permanent and direct",
    "Module 7 refuses a review that would remove them",
  ], 12.5);
  callout(s, "Exc", Math.max(l, r) + 0.3, 0.95, "FaUserShield", HEX.red, "The main exception: ",
    "Module 1 reported ea01 as Info only because the exceptions list names it. This module checks the exception is what it claims to be.");
  sources(s, "Sources: Module 2, \"Introduction\"; Microsoft Learn, \"Manage emergency access accounts in Microsoft Entra ID\"; the project plan's critical path.");
  notes(s,
`Why first? The project plan's critical path says that switching on approval before the emergency accounts exist is the one sequence that locks the agency out. And Microsoft Learn documents the case. Every Global Administrator and Privileged Role Administrator is eligible, approval is required, and no approvers are selected. So no one can approve, and administration is locked. That's why every later module that writes leans on this one. Module 3 keeps the emergency group excluded from every policy file. Module 4 refuses any PIM change until the emergency accounts hold Global Administrator, active, permanent and direct. And Module 7 refuses a review that would remove them. The emergency accounts are also the main exception to zero permanently active assignments. Module 1 reported E A oh one as Info only because the exceptions list names it. Here you make sure the exception is what it claims to be.`,
  `${M} — Unit "Introduction"; the callout "Do this before Modules 3 to 8 change anything."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 2", [
    "Explain the documented lockout, and why the emergency accounts come before any approval",
    "Name what Learn's standard asks of each account, and the rule that checks each item",
    "Explain why the alert reads three tables, and matches object IDs, not names",
    "Run the check and read its findings",
    "Say why every enforced policy must exclude the accounts, and a report-only one needn't",
  ], [
    "Module 1: the module and the fictional tenant this lab uses again",
    "Reading KQL helps for the alert, but isn't required",
    "Lab 2: a worldwide or GCC test tenant and test subscription, never production",
  ], 55);
  sources(s, "Sources: Module 2, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll explain the documented lockout, and why the emergency accounts come before any approval is switched on. You'll name what Microsoft Learn's standard asks of each emergency account, and the rule that checks each item. You'll explain why the alert reads three tables, not one, and why it matches object I D's, not names. You'll run the check and read its findings. And you'll say why every enforced Conditional Access policy must exclude the accounts, and why a report-only one needn't. Before you start, finish Module 1: this lab uses its module and its fictional tenant again. Reading K Q L helps for the alert, but isn't required. Lab 2 needs a worldwide or G C C test tenant with a test Azure subscription, never production.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 The standard
{
  const s = content(SC, "What Learn's standard asks of each emergency account");
  tag(s, "What");
  const b = table(s, "Std", 1.45, [5.2, 6.95], ["Microsoft Learn's standard", "The rule that checks it"], [
    ["Two or more accounts", "PA-EA-01"],
    ["Cloud-only, on *.onmicrosoft.com", "PA-EA-02 (the domain); PA-EA-03 (synchronized from on-premises)"],
    ["Global Administrator, active and permanent in PIM", "PA-EA-05: not eligible only, time-bound, activated or inherited"],
    ["Passkey (FIDO2) or certificate-based authentication", "PA-EA-06: no phone, Authenticator, OATH, email or Temporary Access Pass"],
    ["Excluded from policies that block or restrict, through one group", "PA-EA-07 (in the group); PA-EA-08 (each policy excludes it)"],
    ["Validated at least every 90 days", "PA-EA-09, from emergency-validations.csv"],
  ], { fontSize: 12.5, limit: 5.3 });
  callout(s, "Prog", b + 0.25, 0.9, "FaUserShield", HEX.navy, "The program adds: ",
    "dual custody and a post-use review; and two rules of its own, PA-EA-04 (a disabled account) and PA-EA-10 (a stranger in the group).");
  sources(s, "Sources: Module 2, Unit 1; Microsoft Learn, \"Manage emergency access accounts in Microsoft Entra ID\"; Book 04, Ch 04; PrivilegedAccess.psm1.");
  notes(s,
`Unit 1: the standard and the check. Microsoft Learn's page on managing emergency access accounts sets the standard. Two or more accounts, cloud-only, on the tenant's on-microsoft dot com domain. Passkey or certificate-based authentication. Global Administrator, active and permanent in PIM. Excluded, through one group, from the Conditional Access policies that block or restrict sign-in. And validated at least every ninety days. Each item has a rule. E A oh one counts the accounts. Oh two checks the domain, and oh three that the account isn't synchronized from on-premises. Oh five wants Global Administrator active, permanent and direct. Oh six flags any method that isn't phishing-resistant: phone, Authenticator, software OATH, email or a Temporary Access Pass. Oh seven and oh eight check the exclusion group, and oh nine the drill record. The program adds dual custody and a post-use review, and two rules of its own design: oh four, a disabled account, and E A ten, a stranger in the group.`,
  `${M} — Unit 1 "The standard and the check": workbook Chapter 02, "What Microsoft gives you," "The check"; Book 04, Chapter 04 — "Emergency access accounts"; examples/privileged-access/powershell/PrivilegedAccess/PrivilegedAccess.psm1.`);
}

// ================================================================== 5 PA-EA-08
{
  const s = content(SC, "PA-EA-08: enforced policies, and report-only ones");
  tag(s, "What");
  const b = table(s, "EA8", 1.45, [3.3, 2.0, 6.85], ["The policy's state", "PA-EA-08", "Why"], [
    ["Enforced (enabled)", "Finding", "It doesn't exclude an emergency account, through the group or directly"],
    ["Report-only", "Info", "Learn says report-only policies need no exclusion"],
    ["Off", "Nothing", "It applies to no one"],
  ], { fontSize: 13, limit: 3.6 });
  const l = panel(s, "Every", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "EVERY ENFORCED POLICY", "Design guidance", [
    "The code checks every enforced policy, rather than judging which ones \"block or restrict\"",
  ], 13);
  panel(s, "Strict", 6.85, b + 0.25, 5.9, null, HEX.amber, HEX.amberTint, "STRICTER LATER", "Module 3 comes back to this", [
    "Book 04, Chapter 10's pre-merge check wants the exclusion on report-only policies too",
    "Excluding the group before enforcement is required",
  ], 13);
  sources(s, "Sources: Module 2, Unit 1; Microsoft Learn, \"Manage emergency access accounts,\" \"Analyze Conditional Access policy impact\"; PrivilegedAccess.psm1.");
  notes(s,
`Pay attention to E A oh eight. Microsoft Learn says to exclude the emergency accounts from the policies that block or restrict sign-in. The code doesn't try to judge which policies do that. It checks every enforced policy, and that choice is this workbook's design guidance. An enforced policy that doesn't exclude an emergency account, through the group or directly, is a finding. A report-only policy that doesn't exclude the group is only Info. Microsoft Learn says report-only policies need no exclusion. But the exclusion is required before the policy is enforced. And the program's own pre-merge check, which Module 3 builds, is stricter: it wants the exclusion on every policy file, whatever its state. Module 3 comes back to this.`,
  `${M} — Unit 1, PA-EA-08: workbook Chapter 02, "The check"; Book 04, Chapter 10 — "A pre-merge check for the emergency access exclusion."`);
}

// ================================================================== 6 The alert
{
  const s = content(SC, "The alert: three tables, matched on object IDs");
  tag(s, "What");
  const b = table(s, "Tables", 1.45, [4.3, 7.85], ["Table", "What it catches"], [
    ["SigninLogs", "Interactive sign-ins: the only table Learn's three sample queries read"],
    ["AADNonInteractiveUserSignInLogs", "A refreshed token in a stolen session; FIDO2 sign-ins that obtain a refresh token"],
    ["AuditLogs", "A role change an emergency account makes; a security method registered on one"],
  ], { fontSize: 13, limit: 3.6 });
  const l = panel(s, "IDs", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "OBJECT IDS ONLY", null, [
    "A rename can't hide a sign-in",
    "The query refuses a user principal name",
  ], 13);
  panel(s, "Rule", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "NEW-PaEmergencyAlertRule", "An ARM template, for review", [
    "Severity 0; threshold greater than 0; every 5 minutes",
    "It deploys nothing: that's the reviewed pipeline's job",
  ], 13);
  sources(s, "Sources: Module 2, Unit 2; Microsoft Learn, \"Manage emergency access accounts,\" \"What are non-interactive user sign-ins\"; PrivilegedAccess.psm1.");
  notes(s,
`Unit 2: the alert. Microsoft Learn's page has three sample queries, and all three read the sign-in log of interactive sign-ins. The example adds two more tables. The non-interactive sign-in log, because a refreshed token in a stolen session is a non-interactive sign-in, and Microsoft Learn says new sign-ins that obtain a refresh token with FIDO2 keys are logged as non-interactive too. And the audit log, for a role change made by an emergency account, and a security method registered on one, which is the start of a takeover. The query matches object I D's only, so a rename can't hide a sign-in, and it refuses a user principal name. Then the kit wraps it in an A R M template, with Microsoft Learn's severity zero and a threshold of greater than zero, evaluated every five minutes. It deploys nothing. Deployment is the reviewed pipeline's job.`,
  `${M} — Unit 2 "The alert": workbook Chapter 02, "What it leaves to you," "The alert"; examples/privileged-access/powershell/PrivilegedAccess/PrivilegedAccess.psm1 (Get-PaEmergencyQuery, New-PaEmergencyAlertRule).`);
}
endModule(SC);

// ================================================================== 7 Try it: queries and permissions
{
  const s = content(SL, "Try it: Learn's queries, and six read permissions");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 8.0, [
    "# Lab 1, steps 1 and 2, in examples/privileged-access",
    "PS> Invoke-Pester -Path tests/MicrosoftSamples.Tests.ps1 `",
    "      -FullNameFilter '*Chapter 02*' -Output None -PassThru |",
    "      Select-Object PassedCount, FailedCount",
    "PassedCount FailedCount",
    "----------- -----------",
    "          7           0",
    "",
    "PS> Import-Module ./powershell/PrivilegedAccess/PrivilegedAccess.psm1",
    "PS> (Get-PaRequiredPermission -Task emergency-access).GraphPermissions `",
    "      -join ', '",
    "GroupMember.ReadBasic.All, Policy.Read.All,",
    "RoleAssignmentSchedule.Read.Directory, User.Read.All,",
    "User.ReadBasic.All, UserAuthenticationMethod.Read.All",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 11 });
  panel(s, "Read", 8.85, 1.45, 3.9, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "7 passed, 0 failed",
    "Of five emergency events in the export, Learn's two-ID query finds the two interactive sign-ins",
    "Six permissions, nothing that writes",
  ], 13);
  line(s, "Note", "Long lines are wrapped to fit; type the commands as the module page writes them.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 1 and 2; examples/privileged-access: tests/MicrosoftSamples.Tests.ps1, config/calls.json.");
  notes(s,
`Try it. Lab 1 runs in the privileged-access folder, in one PowerShell 7 session, against the fictional tenant. Step one runs Microsoft Learn's queries over a sign-in export, with Pester. Seven pass and none fail. The tests show what they find: of five emergency events in the export, Learn's two-I D query finds the two interactive sign-ins, and misses the rest. Step two loads the module and lists the permissions the check needs. There are six: Group Member dot Read Basic dot All, Policy dot Read dot All, Role Assignment Schedule to read, User dot Read dot All, User dot Read Basic dot All, and User Authentication Method dot Read dot All. Nothing writes. The output on the slide is wrapped to fit.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 8 Try it: check
{
  const s = content(SL, "Try it: check the accounts and write the alert template");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Lab 1, step 3",
    "PS> ./Invoke-PaEmergencyCheck.ps1 -FixturePath tests/fixtures/tenant.json -ConfigPath tests/fixtures/inputs/emergency-access.json `",
    "      -ValidationsPath tests/fixtures/inputs/emergency-validations.csv -AsOf 2026-10-30 -OutputPath out/emergency `",
    "      -WorkspaceResourceId /subscriptions/22222222-2222-4222-8222-222222222222/resourceGroups/rg-logs/providers/ `",
    "        Microsoft.OperationalInsights/workspaces/law-identity `",
    "      -ActionGroupResourceId /subscriptions/22222222-2222-4222-8222-222222222222/resourceGroups/rg-logs/providers/ `",
    "        Microsoft.Insights/actionGroups/ag-soc -Location eastus",
    "Emergency access: 9 Finding, 0 Warn, 1 Info",
    "Alert rule written to emergency-alert.json for review; deploy it with your reviewed pipeline",
    "Written to out/emergency (manifest.json lists every request and file hash)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (THE TWO RESOURCE IDS WRAPPED; EACH IS ONE WORD)", pt: 10.5 });
  table(s, "Read", c + 0.25, [3.0, 9.15], ["Read it", "What the run printed"], [
    ["10 results", "9 Finding, 0 Warn, 1 Info"],
    ["The alert", "Written to emergency-alert.json for review; nothing deployed"],
    ["The manifest", "Every request and each file's hash"],
  ], { fontSize: 13, limit: 6.1 });
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" step 3; examples/privileged-access: Invoke-PaEmergencyCheck.ps1, tests/fixtures (fictional).");
  notes(s,
`Step three checks the fictional tenant's accounts and writes the alert template. You give it the tenant fixture, the emergency access configuration, the drill record, a date to judge the drills by, the thirtieth of October, an output folder, and, for the alert, the Log Analytics workspace, the action group and a location. The check finds nine findings, no warnings and one information item. It writes the alert rule to emergency-alert dot json, for review, and tells you to deploy it with your reviewed pipeline; it doesn't deploy anything itself. And as always, the manifest lists every request and the hash of every file. On the slide, the two resource I D's are wrapped to fit; on the command line, each one is a single word.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 3.`);
}

// ================================================================== 9 Try it: findings
{
  const s = content(SL, "Try it: read the findings for ea02 and the policies");
  tag(s, "How");
  const c = code(s, "Find", 0.6, 1.45, 7.6, [
    "# Lab 1, step 4",
    "PS> Get-Content out/emergency/findings.json -Raw |",
    "      ConvertFrom-Json | Format-Table Rule, Severity, Object",
    "Rule     Severity Object",
    "----     -------- ------",
    "PA-EA-02 Finding  ea02@contoso.example",
    "PA-EA-05 Finding  ea02@contoso.example",
    "PA-EA-06 Finding  ea02@contoso.example",
    "PA-EA-07 Finding  ea02@contoso.example",
    "PA-EA-09 Finding  ea02@contoso.example",
    "PA-EA-08 Finding  CA001-AllUsers-BlockLegacyAuth",
    "PA-EA-08 Finding  CA004-Admins-RequireCompliantDevice",
    "PA-EA-08 Info     CA090-AllUsers-ReportOnly-CoverageProbe",
    "PA-EA-08 Finding  PIM-Activation-c1",
    "PA-EA-10 Finding  carl.ops@contoso.example",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 9, 2026 (WRAPPED)", pt: 10.5 });
  panel(s, "Read", 8.45, 1.45, 4.3, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "ea01 passes",
    "ea02 fails five ways: domain, an ending assignment, a phone method, not in the group, an old drill",
    "Three enforced policies don't exclude the accounts",
    "The report-only one is Info",
    "carl.ops is in the group and shouldn't be",
  ], 12.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" step 4; examples/privileged-access/tests/fixtures (fictional identities).");
  notes(s,
`Step four prints the findings. E A oh one, the first account, passes. The second, E A oh two, fails five ways. It's on contoso dot example, not the on-microsoft dot com domain. Its Global Administrator assignment ends, so it isn't permanent. It has a phone method, which isn't phishing-resistant. It isn't in the exclusion group. And its last drill is too old. Then the policies. Three enforced policies don't exclude the accounts: the legacy authentication block, the compliant-device policy for administrators, and the activation gate's own policy. Each of those could lock the emergency accounts out. The report-only policy, a coverage probe for all users, is Info, as Microsoft Learn allows. And the last row, E A ten: carl dot ops is in the exclusion group, and shouldn't be, because every policy that excludes the group excludes him too.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 4.`);
}

// ================================================================== 10 Try it: match
{
  const s = content(SL, "Try it: the example's rule finds five events, not two");
  tag(s, "How");
  const c = code(s, "Match", 0.6, 1.45, 12.15, [
    "# Lab 1, step 5",
    "PS> $rows = (Get-Content tests/fixtures/signin-export.json -Raw | ConvertFrom-Json).rows",
    "PS> Find-PaEmergencyActivity -Rows $rows -AccountId 0e000000-0000-4000-8000-000000000001, 0e000000-0000-4000-8000-000000000002 |",
    "      Format-Table Source, AccountId, OperationName",
    "Source                          AccountId                            OperationName",
    "------                          ---------                            -------------",
    "SigninLogs                      0e000000-0000-4000-8000-000000000001 Sign-in activity",
    "AADNonInteractiveUserSignInLogs 0e000000-0000-4000-8000-000000000001 Sign-in activity",
    "AuditLogs                       0e000000-0000-4000-8000-000000000002 Add member to role",
    "AuditLogs                       0e000000-0000-4000-8000-000000000001 User registered security info",
    "SigninLogs                      0e000000-0000-4000-8000-000000000002 Sign-in activity",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026", pt: 11 });
  line(s, "Five", "Five rows where Learn's query found two: a non-interactive sign-in, a role change and a new security method.", c + 0.3, 0.45, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" step 5; examples/privileged-access: tests/fixtures/signin-export.json (fictional), PrivilegedAccess.psm1.");
  notes(s,
`Step five matches the same export with the example's rule. You load the export's rows and pass the two emergency accounts' object I D's. Five rows come back, where Microsoft Learn's query found two. The two interactive sign-ins are there, one for each account. And three more. A non-interactive sign-in by the first account, which is what a refreshed token in a stolen session looks like. An Add member to role event made by the second account: a role change. And a User registered security info event on the first account: a new method registered on an emergency account, the start of a takeover. Those are the three events the extra two tables exist to catch.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 5.`);
}

// ================================================================== 11 Try it: guards and tests
{
  const s = content(SL, "Try it: see the guards, then run the tests");
  tag(s, "How");
  const c = code(s, "Guard", 0.6, 1.45, 12.15, [
    "# Lab 1, step 6",
    "PS> Get-PaEmergencyQuery -AccountId ea01@contosoexample.onmicrosoft.com",
    "Exception: 'ea01@contosoexample.onmicrosoft.com' isn't an object ID",
    "PS> $t = Get-Content out/emergency/emergency-alert.json -Raw | ConvertFrom-Json",
    "PS> $t.resources[0].type, $t.resources[0].apiVersion, $t.resources[0].properties.severity -join ' | '",
    "Microsoft.Insights/scheduledQueryRules | 2023-12-01 | 0",
    "",
    "# Step 7: run the tests, then delete out",
    "PS> Invoke-Pester -Path tests",
    "Tests Passed: 330, Failed: 0, Skipped: 0, Inconclusive: 0, NotRun: 0",
    "PS> Remove-Item -Recurse -Force out",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (PESTER'S SUMMARY ON ONE LINE)", pt: 11 });
  const l = panel(s, "Guard", 0.6, c + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "TWO GUARDS", null, [
    "The query refuses a name: a rename would hide the account",
    "The template is a scheduled query rule, severity 0",
  ], 13);
  panel(s, "Out", 6.85, c + 0.25, 5.9, null, HEX.red, HEX.redTint, "DELETE out", null, [
    "It names the accounts",
  ], 13);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 6 and 7; Microsoft Learn, \"Microsoft.Insights scheduledQueryRules 2023-12-01\"; PrivilegedAccess.psm1.");
  notes(s,
`Step six shows the guards. Ask for the query with a user principal name, E A oh one at the on-microsoft dot com domain, and it refuses: that isn't an object I D. A query on names would miss the account after a rename. Then read the alert template the check wrote. Its resource is a Microsoft Insights scheduled query rule, A P I version twenty twenty-three, twelve, oh one, with severity zero. That's the reviewed template your pipeline deploys. Step seven runs the whole test suite: three hundred thirty pass. Then delete the output folder, because it names the accounts. Pester prints its summary on several lines; the slide shows it on one.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 6 and 7.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: check your test tenant and fire the alert");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant with a test Azure subscription, never production"],
    ["Logs", "Send AuditLogs, SignInLogs and NonInteractiveUserSignInLogs to a test workspace"],
    ["Check and query", "Register a reader app, run the check with your own accounts, run the query by hand in the workspace"],
    ["Alert and drill", "Deploy the alert from the reviewed template, and run a drill that fires it"],
    ["Permissions", "Security Administrator for the diagnostic setting; the six read permissions; Monitoring Contributor to deploy"],
    ["Back it out", "Delete the alert rule and action group, the permissions, the app and certificate, the diagnostic setting if the lab made it, and out/emergency-test"],
  ], { fontSize: 12.5, limit: 5.5 });
  callout(s, "NotRun", b + 0.2, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "if the test tenant's emergency accounts are real, treat the drill as Learn's validation drill: tell security operations first, and record it.");
  sources(s, "Sources: Module 2, \"Exercise: Lab 2, your test tenant\"; Microsoft Learn, \"Manage emergency access accounts\" (validation drills).");
  notes(s,
`Lab 2 runs in your own test tenant, worldwide or G C C, with a test Azure subscription, never production. You send the audit log and the interactive and non-interactive sign-in logs to a test workspace. You register a reader app, run the check with your own accounts, and run the query by hand in the workspace. Then you deploy the alert from the reviewed template, and run a drill that fires it. If the test tenant's emergency accounts are real, treat that drill as Microsoft Learn's validation drill: tell security operations first, and record it. You need at least Security Administrator for the diagnostic setting, the six read permissions for the reader app, and at least Monitoring Contributor to deploy the alert. The back-out deletes the alert rule and action group, the permissions, the app and its certificate, the diagnostic setting if the lab created it, and the test output. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate 1");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.9, 3.0, 4.25], ["Requirement", "KSI", "Evidence"], [
    ["AC-2; MS.AAD.7.3v1; MS.AAD.7.4v1's exception for emergency accounts", "KSI-IAM-JIT", "PA-EA-01 to 05, 07, 08 and 10"],
    ["IA-2(1); MS.AAD.3.6v1, phishing-resistant MFA", "KSI-IAM-APM", "PA-EA-06"],
    ["AC-2(2), the drills as compensating controls (design guidance)", "KSI-IAM-AAM, KSI-IAM-JIT", "PA-EA-09, from the drill record"],
    ["AC-2(4), AU-6 and SI-4, an alert on any use", "KSI-MLA-RVL, -LET, KSI-IAM-SUS", "emergency-alert.json: severity 0, every 5 minutes"],
    ["AC-6, least privilege for the identity that checks", "KSI-IAM-ELP", "Six read permissions"],
  ], { fontSize: 11.5, limit: 4.9 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS FOR GATE 1", null, [
    "findings.json with no Finding from the test tenant's run; the drill tickets and emergency-validations.csv; the reviewed alert template and its deployment record; manifest.json",
  ], 12.5);
  sources(s, "Sources: Module 2, \"Introduction,\" \"Summary\"; NIST SP 800-53 Rev. 5; CISA BOD 25-01 (MS.AAD.3.6v1, 7.3v1, 7.4v1); FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. The check is the plan's Gate 1 test, emergency access accounts tested, and the alert watches the accounts between drills. It supports NIST special publication eight hundred fifty-three A C two, with emergency accounts as a defined account type, and I A two, enhancement one, multifactor authentication to privileged accounts. The alert supports A C two, enhancement four, A U six and S I four. And from CISA's B O D twenty-five oh-one and its ScubaGear baseline: M S A A D seven point three, cloud-only privileged accounts, and three point six, phishing-resistant M F A for highly privileged roles. Treating the drills as compensating controls is the workbook's design guidance. The evidence an ISSO keeps for Gate 1: the findings with no finding from the test tenant's run; the drill tickets and the drill record; the reviewed alert template and its deployment record; and the manifest.`,
  `${M} — Unit "Introduction" (the federal requirement and its table); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on emergency access", [
    { q: "What is the lockout Learn documents?", options: ["a. A Conditional Access policy that blocks every country", "b. Every Global Administrator and Privileged Role Administrator eligible, approval required, no approvers selected", "c. An emergency account whose password expires"] },
    { q: "A report-only Conditional Access policy doesn't exclude the emergency group. What does PA-EA-08 report?", options: ["a. A Finding, like an enforced policy", "b. Info: Learn says report-only policies need no exclusion", "c. Nothing; report-only policies aren't read"] },
  ], "1 b: so no one can approve, and administration is locked. 2 b: seen for CA090 in Lab 1, step 4.");
  sources(s, "Sources: Module 2, \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: what is the lockout Microsoft Learn documents? The answer is b: every Global Administrator and Privileged Role Administrator eligible, approval required, and no approvers selected. No one can approve, so administration is locked. Second: a report-only Conditional Access policy doesn't exclude the emergency group. What does E A oh eight report? The answer is b: Info, because Microsoft Learn says report-only policies need no exclusion. You saw it for the policy that records emergency sign-ins in Lab 1, step four. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 3, the activation gate");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Checked two emergency accounts against Learn's standard",
    "Found one that fails five ways",
    "Found three enforced policies that would lock them out, and a stranger in their exclusion group",
    "Built an alert that sees five events where Learn's sample sees two",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 3: Conditional Access for administrators and the activation gate", [
    "The first module that writes",
    "PA-CA-01 keeps the emergency group excluded",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaUserShield", HEX.teal, "Carry forward: ",
    "before any later lab enforces anything, build the emergency accounts and confirm one can sign in.");
  sources(s, "Sources: Module 2, \"Summary\"; Module 3, \"Introduction.\"");
  notes(s,
`To sum up. You checked two emergency accounts against Microsoft Learn's standard and found one that fails five ways, three enforced policies that would lock them out, and a stranger in their exclusion group. And you built an alert that sees five events where Learn's sample sees two. Carry one thing forward: before any later lab enforces anything, build the emergency accounts and confirm one can sign in. Next is Module 3: Conditional Access for administrators and the activation gate. It's the first module that writes, so it's the first that could lock people out, and its first rule, C A oh one, keeps the emergency group excluded from every policy file.`,
  `${M} — Unit "Summary"; Module 3 — "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 2 deck", [
  "Module page: docs/training/privileged-access/02-emergency-access-first.md (Privileged Access learning path, Module 2): Introduction and its requirement table, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: what you need for the labs.",
  "Original sources, as workbook Chapter 02 footnotes them: Microsoft Learn, \"Manage emergency access accounts in Microsoft Entra ID\"; \"What are non-interactive user sign-ins in Microsoft Entra?\"; \"Analyze Conditional Access policy impact\"; \"Microsoft.Insights scheduledQueryRules 2023-12-01\"; NIST SP 800-53 Rev. 5; CISA BOD 25-01 and the ScubaGear Entra ID baseline; FedRAMP, \"Key Security Indicators.\"",
  "Kit: examples/privileged-access (Invoke-PaEmergencyCheck.ps1; powershell/PrivilegedAccess/PrivilegedAccess.psm1; tests/MicrosoftSamples.Tests.ps1; tests/fixtures). Fictional identities. Illustrative: tested against fixtures and a fake, not run against a production tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7.6.9 and Pester 5.9.0 in a scratch copy of examples/, outside the repository; it matched data/kit-captures/pa/02-1.txt to 02-8.txt. Long lines are wrapped where the slides say so. Verification: docs/training/privileged-access/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
