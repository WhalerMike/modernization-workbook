// Privileged Access learning path, Module 4: PIM for Microsoft Entra roles as code — the module's narrated deck.
// Teaches docs/training/privileged-access/04-pim-for-entra-roles.md, Learn-style: objectives, the concepts, "Try it"
// slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/privileged-access),
// Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module
// page, the learning path's verification log, or the kit (examples/privileged-access); the deck adds none. The narration
// names the original source the workbook footnotes for each fact (workbook Chapter 04's footnotes).
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pa-module-4/build.js \
//                      presentations/training-pa-module-4/Training_PA_Module_4.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 4: PIM for Microsoft Entra roles as code",
  footer: "Federal Modernization Workbook  ·  Privileged Access learning path, Module 4: PIM for Microsoft Entra roles as code",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Privileged Access learning path — Module 4: PIM for Microsoft Entra roles as code";
const OUT = process.argv[2] || "Training_PA_Module_4.pptx";
const M = "Training, Privileged Access, Module 4";

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
  const s = title(SI, "Module 4: PIM for Microsoft Entra roles as code", "Privileged Access learning path · Plan Phases 1 to 3 (A1.6, A2.1, A2.2, A3.1) · Chapter 04",
    ["The lockout's two halves  ·  Seven managed rules  ·  The role files, the checks and the alert check", "The waves and the conversion  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 4 of the Privileged Access learning path: PIM for Microsoft Entra roles as code. This module serves the project plan's task A1.6 in Phase 1, A2.1 and A2.2 in Phase 2, and A3.1 in Phase 3, with Chapter 04 of the developer workbook. Each Microsoft Entra role has its own PIM settings: how long an activation lasts, whether it needs approval, a ticket, an authentication context, and how long an assignment may last. Set by hand in the portal, they drift role by role. In this module you hold them as code, one reviewed file per role. You see exactly what a change will do before it happens, apply it to one rollout wave with the least privilege the writes need, and prove from a read-back that the tenant now matches the files. The code is illustrative: tested against fixtures and a fake.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why role settings as code, and the lockout they can cause");
  tag(s, "Why");
  const l = panel(s, "Drift", 0.6, 1.45, 5.6, null, HEX.amber, HEX.amberTint, "SET BY HAND, THEY DRIFT", "Per role, in the portal", [
    "Activation length",
    "Approval, a ticket, an authentication context",
    "How long an assignment may last",
  ], 13.5);
  const b = table(s, "Guards", 1.45, [2.6, 3.65], ["The guard", "What it refuses"], [
    ["PA-PIM-01", "Approval required with no approver"],
    ["PA-PIM-02", "Any change until the emergency accounts hold Global Administrator active, permanent and direct"],
    ["-ActivationGateChecked", "Setting a context until a person states PIM-Activation-c1 is On"],
  ], { fontSize: 12.5, limit: 5.0, x: 6.45 });
  callout(s, "Any", Math.max(l, b) + 0.3, 0.95, "FaUserShield", HEX.red, "Any Finding blocks -Apply: ",
    "and PIM won't remove the last active Global Administrator.");
  sources(s, "Sources: Module 4, \"Introduction\" and its lockout callout; Microsoft Learn, \"Configure Microsoft Entra role settings in PIM.\"");
  notes(s,
`Why does this matter? Because this module writes the settings that cause the documented lockout, so it refuses both halves of it. Rule pim oh one fails a role file that requires approval with no approver. Rule pim oh two fails the run if fewer emergency accounts hold Global Administrator active, permanent and direct than the emergency access file requires. The code changes no role setting until Module 2's half holds in the tenant. And the Activation Gate Checked switch is a person's statement that the activation gate's policy is On. The apply won't set an authentication context without it, because the gate's state can't be read from version one point oh. Any finding blocks the apply. And PIM itself won't remove the last active Global Administrator.`,
  `${M} — Unit "Introduction"; the callout "The lockout check for this module."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Explain the documented lockout's two halves, and the check that refuses each",
    "Name the seven activation and assignment rules the code manages, and where their bounds come from",
    "Read a role's diff and the plan's findings, PA-PIM-01 to PA-PIM-09",
    "Explain what the read-only alert check, PA-PIM-10 to PA-PIM-13, looks for and where each finding is fixed",
    "Explain the rollout waves, and why a later wave waits",
    "Explain the order for converting a standing assignment",
  ], [
    "Module 2: the emergency accounts this module won't proceed without",
    "Module 3: the activation gate c1 and its policy",
    "Lab 2: a worldwide or GCC test tenant with Entra ID P2 or ID Governance, never production",
  ], 55);
  sources(s, "Sources: Module 4, \"Learning objectives,\" \"Prerequisites\"; \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll explain the documented lockout's two halves, and the check that refuses each. You'll name the seven activation and assignment rules the code manages, and where their bounds come from. You'll read a role's diff and the plan's findings, pim oh one to oh nine. You'll explain what the read-only alert check, pim ten to thirteen, looks for, and where each finding is fixed. You'll explain the rollout waves, and why a later wave waits for an earlier one. And you'll explain the order for converting a standing assignment. Before you start, finish Module 2, for the emergency accounts this module refuses to proceed without, and Module 3, for the activation gate and its policy. Lab 2 needs a worldwide or G C C test tenant, never production, with Microsoft Entra I D P2 or I D Governance licenses for the test users and approvers.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Settings and rules
{
  const s = content(SC, "Settings per role, which Graph calls rules");
  tag(s, "What");
  const b = table(s, "Rules", 1.45, [5.6, 6.55], ["The seven rules the code manages", "What each sets"], [
    ["Expiration_EndUser_Assignment", "How long an activation lasts"],
    ["Enablement_EndUser_Assignment", "What an activation requires, such as a ticket"],
    ["AuthenticationContext_EndUser_Assignment", "The authentication context, c1"],
    ["Approval_EndUser_Assignment", "Approval, and who approves"],
    ["Expiration_Admin_Eligibility", "How long an eligible assignment may last"],
    ["Expiration_Admin_Assignment", "How long an active assignment may last"],
    ["Enablement_Admin_Assignment", "What an active assignment requires"],
  ], { fontSize: 12.5, limit: 5.2 });
  line(s, "Other", "Each role's policy has 17 predefined rules; the code reads the other ten, the notification rules among them, and leaves them alone.", b + 0.2, 0.75, 13);
  sources(s, "Sources: Module 4, Unit 1; Microsoft Learn, \"Rules in PIM - mapping guide\"; Book 04, Ch 08 Step 4; PimEntraRoles.psm1.");
  notes(s,
`Unit 1: settings, rules and the lockout. Settings are per role, and Microsoft Graph calls them rules. Microsoft Learn's mapping guide for rules in PIM shows that each role's policy has seventeen predefined rules. By the program's design, the code manages seven of them, the activation and assignment rules, and leaves the notification rules alone. For the person who activates: how long the activation lasts, what it requires, such as a ticket, the authentication context, and approval. For the administrator who assigns: how long an eligible assignment may last, how long an active assignment may last, and what an active assignment requires. The authentication context needs its policy first; that's Module 3's gate. And remember the lockout. Microsoft Learn's PIM settings page says that with no approvers selected, the active Privileged Role and Global Administrators become the default approvers, and in the lockout there are none. Learn's fix has two halves: emergency access accounts, and named approvers.`,
  `${M} — Unit 1 "Settings, rules and the lockout": workbook Chapter 04, "The context the code depends on"; Book 04, Chapter 08 — Step 4; examples/privileged-access/powershell/PimEntraRoles/PimEntraRoles.psm1.`);
}

// ================================================================== 5 Files and bounds
{
  const s = content(SC, "The role files, the bounds and the waves");
  tag(s, "What");
  const l = panel(s, "Files", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE ROLE FILES", "config/pim-ch04", [
    "22 files, one per role; approvers named by alias",
    "tiers.json holds Learn's bounds and Appendix B's caps",
    "Activation at most 8 hours: the stricter of two Learn pages",
    "Active assignments capped at 15 days",
  ], 13);
  const b = table(s, "Waves", 1.45, [1.2, 4.7], ["Wave", "Roles"], [
    ["1", "Tier 1: the pilot class the owner chose"],
    ["2", "Tier 0"],
    ["3", "Tier 2"],
    ["4", "Read-only"],
  ], { fontSize: 13, limit: 4.0, x: 6.85 });
  callout(s, "Wait", Math.max(l, b) + 0.3, 0.95, "FaListCheck", HEX.navy, "A wave waits: ",
    "PA-PIM-07 refuses a wave until every earlier wave matches its files. The order after the first wave is design guidance.");
  sources(s, "Sources: Module 4, Units 1 and 2; Microsoft Learn, \"Configure Microsoft Entra role settings in PIM\"; config/pim-ch04/tiers.json.");
  notes(s,
`Unit 2: the files, the checks, the alert check and the conversion. The role files are twenty-two, one per role, with approvers named by alias. Beside them, a tiers file holds Microsoft Learn's bounds and the program's caps for each tier, which are this workbook's design guidance. Learn's pages disagree on how long an activation may last: the role settings page allows up to twenty-four hours, the PIM A P I overview at most eight. The code follows the stricter, eight hours. Active assignments are capped at fifteen days, the owner's decision. And the plan's order is fixed. The owner chose Tier 1 as the pilot class, so wave one is Tier 1, then Tier 0, Tier 2 and read-only. The order after the first wave is this workbook's design guidance. Rule pim oh seven refuses a wave until every earlier wave matches its files.`,
  `${M} — Units 1 and 2: workbook Chapter 04, "The role files"; examples/privileged-access/config/pim-ch04/tiers.json.`);
}

// ================================================================== 6 Checks
{
  const s = content(SC, "The checks: PA-PIM-01 to PA-PIM-09");
  tag(s, "What");
  const b = table(s, "PIM", 1.45, [1.6, 1.4, 9.15], ["Rule", "Severity", "What it catches"], [
    ["PA-PIM-01", "Finding", "Approval required with no approver: half of the documented lockout"],
    ["PA-PIM-02", "Finding", "Fewer emergency accounts with permanent, active, direct Global Administrator than required"],
    ["PA-PIM-03", "Finding", "An approver group that is also the role's eligible group"],
    ["PA-PIM-04", "Finding", "A file outside Learn's bounds or its tier's cap"],
    ["PA-PIM-05", "Warn", "An authentication context: its policy must be On before the rule is set"],
    ["PA-PIM-06", "Finding", "No policy for the role at tenant scope"],
    ["PA-PIM-07", "Finding", "An earlier rollout wave that doesn't match its files yet"],
    ["PA-PIM-08", "Warn", "Eligibility outside the role's PRV group; the access review removes it"],
    ["PA-PIM-09", "Warn; Info", "A standing active assignment: convert a user, document a service principal"],
  ], { fontSize: 12, limit: 5.9 });
  line(s, "Perm", "Reads and writes are different tasks; the code follows the API reference pages, which name narrower permissions.", b + 0.2, 0.45, 13);
  sources(s, "Sources: Module 4, Unit 2; Microsoft Learn, \"Configure Microsoft Entra role settings in PIM\"; PimEntraRoles.psm1.");
  notes(s,
`The checks, pim oh one to oh nine. Oh one and oh two are the lockout's two halves, from Microsoft Learn's PIM settings page: approval with no approver, and too few emergency accounts holding Global Administrator permanently. Oh three is the program's design: an approver group that's also the role's eligible group, so approval becomes self-approval. Oh four is a file outside Microsoft Learn's bounds or its tier's cap. Oh five warns on an authentication context, because its policy must be On first. Oh six is a role with no policy at tenant scope. Oh seven is the wave order. Oh eight is eligibility outside the role's P R V group, which the access review in Module 7 removes. And oh nine is a standing active assignment: a user to convert, or a service principal to document. Reads and writes are different tasks, and the code follows the Graph A P I reference pages, which name narrower permissions than Learn's how-to guides.`,
  `${M} — Unit 2: workbook Chapter 04, "The checks," "The calls and their permissions"; examples/privileged-access/powershell/PimEntraRoles/PimEntraRoles.psm1.`);
}

// ================================================================== 6b Alert check
{
  const s = content(SC, "The alert check: PA-PIM-10 to PA-PIM-13");
  tag(s, "What");
  const b = table(s, "Alert", 1.45, [1.6, 2.6, 7.95], ["Rule", "CISA baseline", "A Finding until the security monitoring mailbox is an additional recipient"], [
    ["PA-PIM-10", "MS.AAD.7.7v1", "On a highly privileged role's assignment alert, for eligible or active assignments"],
    ["PA-PIM-11", "MS.AAD.7.8v1", "On Global Administrator's activation alert"],
    ["PA-PIM-12", "MS.AAD.7.7v1", "On the PIM for Groups member policy of a group that holds one of those roles"],
    ["PA-PIM-13", "MS.AAD.7.8v1", "On the member policy of a group that holds Global Administrator"],
  ], { fontSize: 12.5, limit: 4.0 });
  const l = panel(s, "Read", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "READ-ONLY", "Invoke-PaPimAlertCheck.ps1", [
    "Its own task, pim-alerts; it changes nothing",
    "PIM's default recipients don't count",
    "Fictional tenant: all 11 are Findings",
  ], 12.5);
  panel(s, "Fix", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "WHERE EACH IS FIXED", null, [
    "A role: Role settings > Notifications",
    "A group: PIM for Groups Settings > Member > Notifications",
    "Its tests are a separate suite, baseline/tests",
  ], 12.5);
  sources(s, "Sources: Module 4, Unit 2; workbook Chapter 04, \"The alert check\"; CISA BOD 25-01 (MS.AAD.7.7v1, 7.8v1); ScubaGear; Invoke-PaPimAlertCheck.ps1.");
  notes(s,
`The alert check. CISA's baseline under B O D twenty-five oh-one asks for two alerts the role files don't set. M S A A D seven point seven: an alert on every eligible or active assignment to the eight highly privileged roles. And seven point eight: an alert on every Global Administrator activation. So a separate script reads them under its own read-only task, pim alerts, and changes nothing. Pim ten and pim eleven check each role's notification settings. Pim twelve and pim thirteen check the PIM for Groups member policy of each group that holds one of those roles. Each is a finding until an additional recipient, the security monitoring mailbox, is set: under the role's role settings, notifications, or the group's PIM for Groups settings, member, notifications. PIM's default recipients don't count. On the fictional tenant, all eleven are findings. Its tests are a separate suite, in the baseline tests folder.`,
  `${M} — Unit 2: workbook Chapter 04, "The alert check"; examples/privileged-access/Invoke-PaPimAlertCheck.ps1.`);
}

// ================================================================== 7 Conversion
{
  const s = content(SC, "Converting a standing assignment, in order");
  tag(s, "What");
  const b = table(s, "Conv", 1.45, [3.8, 8.35], ["State", "What happens"], [
    ["WaitingForEligibility", "The role's PRV group is made eligible first"],
    ["WaitingForConfirmedActivation", "The person activates through the group; the activation is confirmed with a ticket"],
    ["Confirmed", "Only now can the active assignment be removed"],
  ], { fontSize: 13.5, limit: 3.8 });
  const l = panel(s, "Only", 0.6, b + 0.3, 6.0, null, HEX.navy, HEX.navyTint, "ONLY -Apply -Convert REMOVES", null, [
    "And only for Confirmed rows",
    "confirmed-activations.csv carries each ticket",
  ], 13.5);
  panel(s, "Last", 6.85, b + 0.3, 5.9, null, HEX.red, HEX.redTint, "THE LAST GLOBAL ADMINISTRATOR", null, [
    "PIM won't remove the last active Global Administrator",
  ], 13.5);
  sources(s, "Sources: Module 4, Unit 2 and its lockout callout; Book 04, Ch 08 Step 5; examples/privileged-access/powershell/PimEntraRoles/PimEntraRoles.psm1.");
  notes(s,
`Converting standing assignments goes in a fixed order, and each row carries its state. Waiting For Eligibility: the role's P R V group is made eligible first. Waiting For Confirmed Activation: the person activates the role through the group, and the activation is confirmed, with a ticket. Confirmed: only now can the active assignment be removed. Only the Apply switch with the Convert switch removes anything, and only for confirmed rows; the confirmed-activations file carries each ticket. So no one loses a role before they've shown they can activate it. And as a backstop, PIM won't remove the last active Global Administrator.`,
  `${M} — Unit 2: workbook Chapter 04, "Converting standing assignments"; Book 04, Chapter 08 — Step 5.`);
}
endModule(SC);

// ================================================================== 8 Try it: samples and permissions
{
  const s = content(SL, "Try it: Learn's samples, and each task's permissions");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/privileged-access",
    "PS> Invoke-Pester -Path tests/PimEntraRoles.Tests.ps1 -FullNameFilter '*(Learn), run as published*' -Output None -PassThru |",
    "      Select-Object PassedCount, FailedCount",
    "PassedCount FailedCount",
    "----------- -----------",
    "         13           0",
    "",
    "PS> Import-Module ./powershell/PimEntraRoles/PimEntraRoles.psm1",
    "PS> 'pim-plan', 'pim-apply', 'pim-convert' | ForEach-Object {",
    "      \"$_`: \" + ((Get-PaPimRequiredPermission -Task $_).GraphPermissions -join ', ') }",
    "pim-plan: RoleAssignmentSchedule.Read.Directory, RoleEligibilitySchedule.Read.Directory, RoleManagementPolicy.Read.Directory",
    "pim-apply: RoleAssignmentSchedule.Read.Directory, RoleEligibilitySchedule.Read.Directory,",
    "  RoleEligibilitySchedule.ReadWrite.Directory, RoleManagementPolicy.Read.Directory, RoleManagementPolicy.ReadWrite.Directory",
    "pim-convert: RoleAssignmentSchedule.Read.Directory, RoleAssignmentSchedule.ReadWrite.Directory,",
    "  RoleEligibilitySchedule.Read.Directory, RoleManagementPolicy.Read.Directory",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 10.5 });
  line(s, "Read", "Three reads to plan; apply adds two writes, and convert adds one: RoleAssignmentSchedule.ReadWrite.Directory.", c + 0.25, 0.45, 13);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 1 and 2; Microsoft Learn, \"Update rules in PIM by using Microsoft Graph\"; config/calls-ch04.json.");
  notes(s,
`Try it. Lab 1 runs in one PowerShell 7 session, because steps four to six use the settings step three defines. Step one sends Microsoft Learn's samples to the fake, as published. Thirteen tests pass. The fourth shows that all six of Learn's updates apply, and yet Application Administrator still differs from its file in six of seven rules. Learn's samples aren't the program's settings. Step two lists each task's permissions. Planning needs three reads: role assignment schedules, role eligibility schedules and role management policies. Applying adds two writes: role eligibility schedules and role management policies. And converting adds only one write: role assignment schedules. The output on the slide is wrapped to fit.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 9 Try it: wave 1
{
  const s = content(SL, "Try it: dry-run wave 1, the pilot class");
  tag(s, "How");
  const c = code(s, "W1", 0.6, 1.45, 12.15, [
    "# Lab 1, step 3",
    "PS> $lab = @{ Cloud = 'gcc'; FixturePath = 'tests/fixtures/ch04/tenant.json'; BindingsPath = 'tests/fixtures/ch04/inputs/pim-bindings.json'",
    "        EmergencyConfigPath = 'tests/fixtures/inputs/emergency-access.json'; ExceptionsPath = 'tests/fixtures/inputs/exceptions.csv'",
    "        ConfirmedPath = 'tests/fixtures/ch04/inputs/confirmed-activations.csv'; AsOf = '2026-10-30' }",
    "PS> ./Invoke-PaPimRoleSettings.ps1 @lab -Wave 1 -OutputPath out/pim-wave1",
    "Wave 1 (9 roles): 0 Finding, 13 Warn, 0 Info",
    "Plan: 43 rule updates, 8 eligibility requests, 2 standing assignments to convert (0 confirmed)",
    "Dry run: nothing was sent",
    "Written to out/pim-wave1 (manifest.json lists every request and file hash)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026", pt: 10.5 });
  table(s, "Read", c + 0.25, [3.0, 9.15], ["Read it", "What the run printed"], [
    ["9 roles", "Tier 1's roles: 0 Finding, 13 Warn"],
    ["The plan", "43 rule updates, 8 eligibility requests, 2 standing assignments to convert, none confirmed yet"],
    ["Dry run", "Nothing was sent"],
  ], { fontSize: 13, limit: 6.1 });
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" step 3; examples/privileged-access: Invoke-PaPimRoleSettings.ps1, tests/fixtures/ch04 (fictional).");
  notes(s,
`Step three dry-runs wave one, the pilot class, Tier 1. First you put the run's settings in one variable, the lab table: the cloud, the fixture tenant, the bindings from aliases to groups, the emergency access file, the exceptions, the confirmed activations, and the date. Later steps reuse it. Then run wave one. Nine roles, no findings, thirteen warnings. The plan: forty-three rule updates, eight eligibility requests, and two standing assignments to convert, none confirmed yet, so neither would be removed. It's a dry run, so nothing was sent, and the manifest lists every request it would send and the hash of every file.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 3.`);
}

// ================================================================== 10 Try it: diff
{
  const s = content(SL, "Try it: read a role's diff, and the findings");
  tag(s, "How");
  const c = code(s, "Diff", 0.6, 1.45, 12.15, [
    "# Lab 1, step 4",
    "PS> Import-Csv out/pim-wave1/diff.csv | Where-Object Role -EQ 'Exchange Administrator' | Format-Table RuleId, Property, Tenant, Desired",
    "RuleId                                   Property                         Tenant       Desired",
    "AuthenticationContext_EndUser_Assignment isEnabled                        False        True",
    "AuthenticationContext_EndUser_Assignment claimValue                                    c1",
    "Approval_EndUser_Assignment              isApprovalRequired               False        True",
    "...  (five more Approval_EndUser_Assignment rows: mode, justification, stages, timeout)",
    "Approval_EndUser_Assignment              primaryApprovers                              group:9e000000-0000-4000-8000-000000000011",
    "Expiration_Admin_Assignment              maximumDuration                  180.00:00:00 15.00:00:00",
    "PS> Get-Content out/pim-wave1/findings.json -Raw | ConvertFrom-Json | Where-Object Rule -NE 'PA-PIM-05' |",
    "      Format-Table Rule, Severity, Object, Issue",
    "PA-PIM-09 Warn     Application Administrator Erin Patel holds the role standing: convert to eligibility through the PRV group",
    "PA-PIM-08 Warn     Exchange Administrator    Dana Reyes is eligible outside the PRV group (schedule res-dana-exchange); ...",
    "PA-PIM-09 Warn     Exchange Administrator    Carl Ops holds the role standing: convert to eligibility through the PRV group",
    "PA-PIM-09 Warn     Exchange Administrator    Contoso-Mail-Automation (#microsoft.graph.servicePrincipal) holds the role standing: ...",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS; HEADER RULES LEFT OUT)", pt: 10 });
  line(s, "Read", "The nine PA-PIM-05 rows the second command leaves out ask you to confirm the activation gate.", c + 0.2, 0.45, 13);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" step 4; examples/privileged-access/tests/fixtures/ch04 (fictional identities).");
  notes(s,
`Step four reads the diff for one role, Exchange Administrator. It was partly set by hand, so its diff is short. The authentication context goes to C one. Approval goes to required, single stage, with justification, one day to decide, and the approvers named: the group P I M Approvers T1. And the active assignment maximum goes from a hundred eighty days to fifteen. Then the findings, leaving out the nine pim oh five rows, which ask you to confirm the activation gate. Three are pim oh nine, standing assignments: Erin Patel on Application Administrator and Carl Ops on Exchange Administrator, both to convert through the P R V group, and an automation service principal to document as an exception or replace, because this code removes users only. And one is pim oh eight: Dana Reyes is eligible outside the P R V group, which Module 7's access review removes, not this code. The slide trims the output.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 4.`);
}

// ================================================================== 11 Try it: wave 2 and apply
{
  const s = content(SL, "Try it: wave 2 waits, and the apply needs the gate");
  tag(s, "How");
  const c = code(s, "W2", 0.6, 1.45, 12.15, [
    "# Lab 1, step 5: wave 2, Tier 0, before wave 1 is done",
    "PS> ./Invoke-PaPimRoleSettings.ps1 @lab -Wave 2 -OutputPath out/pim-wave2",
    "Wave 2 (5 roles): 9 Finding, 5 Warn, 2 Info",
    "Plan: 30 rule updates, 4 eligibility requests, 0 standing assignments to convert (0 confirmed)",
    "Blocked: fix every Finding before -Apply",
    "Dry run: nothing was sent",
    "# Step 6: apply wave 1 to the fake",
    "PS> ./Invoke-PaPimRoleSettings.ps1 @lab -Wave 1 -OutputPath out/pim-apply -Apply",
    "Exception: The plan sets an authentication context: confirm its Conditional Access policy is On (Chapter 03), then pass -ActivationGateChecked",
    "PS> ./Invoke-PaPimRoleSettings.ps1 @lab -Wave 1 -OutputPath out/pim-apply -Apply -ActivationGateChecked",
    "Wave 1 (9 roles): 0 Finding, 13 Warn, 0 Info",
    "Plan: 43 rule updates, 8 eligibility requests, 2 standing assignments to convert (0 confirmed)",
    "Applied: 51 requests sent; 0 differences from the role files after reading back",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (EACH RUN'S \"Written to\" LINE LEFT OUT)", pt: 10.5 });
  line(s, "Tests", "Step 7: Invoke-Pester -Path tests prints Tests Passed: 330, Failed: 0. Then Remove-Item -Recurse -Force out.", c + 0.25, 0.45, 13);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 5 to 7; examples/privileged-access: Invoke-PaPimRoleSettings.ps1.");
  notes(s,
`Step five tries wave two, Tier 0, before wave one is done. Five roles, nine findings, five warnings and two information items, and the run is blocked: fix every finding before the apply. The nine findings are pim oh seven, one for each Tier 1 role that doesn't match its file yet. The two Info rows are the emergency accounts, kept permanent active. Step six applies wave one to the fake. The first command stops before any write: the plan sets an authentication context, so confirm its Conditional Access policy is On, then pass Activation Gate Checked. The second command passes it. It sends the rule updates first and the eligibility requests second, fifty-one requests, then reads back: zero differences from the role files. Step seven runs the tests, three hundred thirty pass, and you delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 to 7.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: one role in your test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant, never production; Entra ID P2 or ID Governance for test users and approvers"],
    ["Check first", "Module 2's check with no Finding, and PIM-Activation-c1 On; then make the lab's role and groups"],
    ["Plan and apply", "Dry-run as a reader app, apply as a writer app, in a test copy of the files"],
    ["Convert", "Activate as a second test user, and convert their standing assignment"],
    ["Permissions", "Reader: the three pim-plan reads; writer: the two pim-apply writes; the convert write only for the conversion"],
    ["Back it out", "Restore the rules from the apply run's before.json, remove what the apply added, delete the lab folders"],
  ], { fontSize: 12.5, limit: 5.5 });
  callout(s, "NotRun", b + 0.2, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "work one role, with the emergency-access.json you wrote in Module 2's Lab 2.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 2, your test tenant.\"");
  notes(s,
`Lab 2 works one role in your own test tenant, worldwide or G C C, never production, with Microsoft Entra I D P2 or I D Governance licenses for the test users and approvers. Use a test copy of the files, and the emergency access file you wrote in Module 2's Lab 2. Check the prerequisites first: Module 2's check with no finding, and the activation gate's policy On. Then make the lab's role and groups, dry-run as a reader app, and apply as a writer app. Then activate as a second test user, and convert their standing assignment. The reader gets the three plan permissions; the writer adds the two apply writes; and the role assignment schedule write is granted only for the conversion. To back out, restore the rules from the apply run's before file, remove what the apply added, and delete the lab folders. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence for Module 4");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.0, 2.6, 4.55], ["Requirement", "KSI", "Evidence"], [
    ["AC-6, AC-2: activation, eligibility and active assignments in Learn's bounds and the tier caps", "KSI-IAM-JIT", "The role files, tiers.json; PA-PIM-04"],
    ["AC-2, AC-3; MS.AAD.7.6v1: approval to activate Global Administrator", "KSI-IAM-JIT", "global-administrator.json and its diff.csv rows"],
    ["AC-5, AC-2: an approver, the emergency accounts kept, no self-approval", "KSI-IAM-JIT", "PA-PIM-01, 02 and 03"],
    ["AC-6(5); MS.AAD.7.4v1, 7.5v1: no standing assignment; only through PIM", "KSI-IAM-JIT", "PA-PIM-09 and PA-PIM-08"],
    ["AU-6; MS.AAD.7.7v1, 7.8v1: alerts on highly privileged assignments and Global Administrator activation", "KSI-MLA-RVL", "PA-PIM-10 to 13 in out/pim-alerts, no Finding"],
    ["CM-3, CM-4(2): reviewed before, verified after", "KSI-CMT-LMC, -RMV, -VTD", "plan.json, diff.csv, before.json; verify.csv"],
    ["AC-6: least privilege for each identity", "KSI-IAM-ELP", "Three reads; each write task adds its own"],
  ], { fontSize: 11, limit: 5.3 });
  panel(s, "Keep", 0.6, b + 0.2, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "The role files and tiers.json; each wave's plan.json, diff.csv and before.json; the apply's verify.csv and manifest.json; per conversion, confirmed-activations.csv with its ticket",
  ], 12);
  sources(s, "Sources: Module 4, \"Introduction,\" \"Summary\"; NIST SP 800-53 Rev. 5; CISA BOD 25-01 (MS.AAD.7.4v1 to 7.8v1); FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. The role files, the plan and the read-back are the evidence for the plan's tasks A1.6, A2.1 and A2.2. From NIST special publication eight hundred fifty-three they support A C six, least privilege in time; A C two and A C three, approval before activation; A C five, separation of duties; and A C six, enhancement five. And from CISA's B O D twenty-five oh-one and its ScubaGear baseline: M S A A D seven point four, no standing assignment; seven point five, provisioning only through PIM; and seven point six, approval to activate Global Administrator. The alert check's findings support A U six, audit record review, and seven point seven and seven point eight, the alerts on highly privileged assignments and on Global Administrator activation. C M three and C M four, enhancement two, cover the change: reviewed before, verified after. The evidence an ISSO keeps: the role files and the tiers file; each wave's plan, diff and before files; the apply's verify file and manifest; and, for each conversion, the confirmed activations with their tickets.`,
  `${M} — Unit "Introduction" (the federal requirement and its table); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on PIM role settings", [
    { q: "A role file requires approval and names no approver. What happens?", options: ["a. PIM picks the Global Administrators as approvers", "b. PA-PIM-01 fails the file; it's half of the documented lockout", "c. The plan sends it, and the read-back reports it"] },
    { q: "Why does -Apply need -ActivationGateChecked?", options: ["a. It turns the Conditional Access policy On", "b. The gate's state can't be read from v1.0, so a person states PIM-Activation-c1 is On first", "c. It skips the read-back"] },
  ], "1 b: PA-PIM-01, from Learn's lockout. 2 b: the first apply in Lab 1, step 6 stopped before any write.");
  sources(s, "Sources: Module 4, \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: a role file requires approval and names no approver. What happens? The answer is b: rule pim oh one fails the file. It's half of the lockout Microsoft Learn documents. Second: why does the apply need the Activation Gate Checked switch? The answer is b: the gate's policy state can't be read from version one point oh, so a person states that the activation gate's policy is On before the context is set. You saw the first apply in Lab 1, step six, stop before any write. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 5, PIM for Groups");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Dry-ran the pilot wave and read a role's diff rule by rule",
    "Saw Tier 0 wait for Tier 1",
    "Saw the apply refuse until a person confirmed the gate",
    "Applied 51 requests with no differences left on the read-back",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 5: PIM for Groups and the PRV groups", [
    "The groups that hold each role's eligibility",
    "Their members, owners and policies, as one file",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaUserShield", HEX.teal, "Carry forward: ",
    "eligibility goes to the role's PRV group. Module 5 governs those groups.");
  sources(s, "Sources: Module 4, \"Summary\"; Module 5, \"Introduction.\"");
  notes(s,
`To sum up. You dry-ran the pilot wave, read a role's diff rule by rule, saw Tier 0 wait for Tier 1, saw the apply refuse until a person confirmed the gate, and then applied fifty-one requests with no differences left on the read-back. Carry one thing forward: eligibility for each role goes to the role's P R V group. Next is Module 5: PIM for Groups and the P R V groups. A P R V group's own state has to be governed too: who is a member or owner, until when, on which ticket, and how membership is activated. In Module 5 you keep that state in one reviewed file, and see the guards that keep people from losing access by mistake.`,
  `${M} — Unit "Summary"; Module 5 — "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/privileged-access/04-pim-for-entra-roles.md (Privileged Access learning path, Module 4): Introduction, its lockout callout and requirement table, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "Original sources, as workbook Chapter 04 footnotes them: Microsoft Learn, \"Configure Microsoft Entra role settings in PIM\"; \"Rules in PIM - mapping guide\"; \"Update rules in PIM by using Microsoft Graph\"; \"Manage Microsoft Entra role assignments by using PIM APIs\"; NIST SP 800-53 Rev. 5; CISA BOD 25-01 and the ScubaGear Entra ID baseline; FedRAMP, \"Key Security Indicators.\"",
  "Kit: examples/privileged-access (Invoke-PaPimRoleSettings.ps1; powershell/PimEntraRoles; config/pim-ch04; config/calls-ch04.json; tests/PimEntraRoles.Tests.ps1; tests/fixtures/ch04). Fictional identities. Illustrative: tested against fixtures and a fake, not run against a production tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7.6.9 and Pester 5.9.0 in a scratch copy of examples/, outside the repository; it matched data/kit-captures/pa/04-1.txt to 04-8.txt. Output is wrapped or trimmed where the slides say so. Verification: docs/training/privileged-access/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
