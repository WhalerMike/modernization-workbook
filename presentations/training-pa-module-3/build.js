// Privileged Access learning path, Module 3: Conditional Access for administrators and the activation gate — the module's
// narrated deck. Teaches docs/training/privileged-access/03-conditional-access-and-the-activation-gate.md, Learn-style:
// objectives, the concepts, "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy
// of examples/), Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact comes from
// the module page, the learning path's verification log, or the kit (examples/privileged-access); the deck adds none. The
// narration names the original source the workbook footnotes for each fact (workbook Chapter 03's footnotes).
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pa-module-3/build.js \
//                      presentations/training-pa-module-3/Training_PA_Module_3.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 3: Conditional Access for administrators and the activation gate",
  footer: "Federal Modernization Workbook  ·  Privileged Access learning path, Module 3: Conditional Access and the activation gate",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Privileged Access learning path — Module 3: Conditional Access for administrators and the activation gate";
const OUT = process.argv[2] || "Training_PA_Module_3.pptx";
const M = "Training, Privileged Access, Module 3";

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
  const s = title(SI, "Module 3: Conditional Access and the activation gate", "Privileged Access learning path · Plan Phase 1 (A1.5) and Phase 2 (A2.3, A2.5, A2.6), with workbook Chapter 03",
    ["The gate and its order  ·  The pre-merge check  ·  Report-only and the exclusion  ·  The plan", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 3 of the Privileged Access learning path: Conditional Access for administrators, and the activation gate. This module serves the project plan's task A1.5 in Phase 1, and A2.3, A2.5 and A2.6 in Phase 2, with Chapter 03 of the developer workbook. In it you keep the administrator policies, the activation gate and the privileged authentication strength as files. You check them before they merge, plan what a run would change in the tenant, and see the code create every new policy report-only. This is the first module that writes, so it's the first that could lock people out, and you'll see the two guards that stand between the files and the tenant. The code is illustrative: tested against fixtures and a fake, not run against a production tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a second proof at the moment of activation");
  tag(s, "Why");
  const l = panel(s, "Admin", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "AN ADMINISTRATOR SIGNS IN", null, [
    "With a phishing-resistant method",
    "From a compliant device",
    "On a trusted network",
  ], 14);
  const r = panel(s, "Gate", 6.85, 1.45, 5.9, null, HEX.red, HEX.redTint, "AND PROVES IT AGAIN AT ACTIVATION", "The activation gate", [
    "Authentication context c1 and its policy PIM-Activation-c1",
    "PIM can require the context only after its policy exists and is On",
  ], 14);
  const b = table(s, "Guards", Math.max(l, r) + 0.25, [3.0, 9.15], ["The lockout guard", "What it stops"], [
    ["PA-CA-01", "A policy file that isn't disabled and doesn't exclude the emergency group"],
    ["-Apply", "Refuses to start on a pre-merge Finding, or a policy that leaves out the emergency group"],
  ], { fontSize: 13, limit: 6.2 });
  sources(s, "Sources: Module 3, \"Introduction\" and its lockout callout; Microsoft Learn, \"Configure Microsoft Entra role settings in PIM.\"");
  notes(s,
`Why this module? An administrator should sign in with a phishing-resistant method, from a compliant device, on a trusted network. And at the moment they activate a privileged role, they should prove it again. That second proof is the activation gate: authentication context C one, and its policy, PIM Activation C one. Microsoft Learn's PIM settings page says PIM can require the context only after its policy exists and is On. This is the first module that writes, so two guards stand between the files and the tenant. Rule C A oh one fails any policy file that isn't disabled and doesn't exclude the emergency group. Every file carries the exclusion whatever its state, because a file is enforced by changing one word; that's this workbook's design guidance. And the apply refuses to start if the pre-merge check has a finding, or if any policy it would write leaves out the emergency group.`,
  `${M} — Unit "Introduction"; the callout "The lockout check for this module."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Explain the order Learn sets for a context and its policy, and why report-only doesn't count",
    "Run the pre-merge check, and say which rules are Learn's and which the program's",
    "Explain how the code treats report-only policies and the emergency exclusion",
    "Read a plan: Create, Update, NoChange, Blocked, Held, Differs, NotInRepository",
    "Explain why every new policy is created report-only, and why the code never deletes",
  ], [
    "Module 2: the emergency accounts and their exclusion group",
    "Book 04, Ch 07's Wave 2: CA003, CA004, CA005, CA025 and CA027",
    "Lab 2: a worldwide or GCC test tenant with Entra ID P1, never production",
  ], 55);
  sources(s, "Sources: Module 3, \"Learning objectives,\" \"Prerequisites\"; \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll explain the order Microsoft Learn sets for an authentication context and its policy, and why report-only doesn't count. You'll run the pre-merge check and say which rules come from Microsoft Learn and which are the program's design. You'll explain how the code treats report-only policies and the emergency exclusion. You'll read a plan, with its seven actions. And you'll explain why every new policy is created report-only, and why the code never deletes. Before you start, finish Module 2, for the emergency accounts and their exclusion group, and read Wave 2 of the policy library in Book 04: the administrator policies C A oh oh three, oh oh four, oh oh five, oh two five and oh two seven. Lab 2 needs a worldwide or G C C test tenant with Microsoft Entra I D P1, never production.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Order
{
  const s = content(SC, "The gate and the order Learn sets for it");
  tag(s, "What");
  const b = table(s, "Order", 1.45, [6.4, 5.75], ["Microsoft Learn's rule", "What the code does"], [
    ["Create and enable the policy for a context before you select that context in PIM", "This module builds the gate and leaves it unselected; Module 4 selects c1"],
    ["No policy targets the context: PIM falls back to MFA, but not when the policy is off, report-only, or excludes the user", "PA-CA-04 warns on a context policy that isn't On"],
    ["Don't scope the policy to both the context and a directory role: at activation the user doesn't hold the role yet", "PA-CA-05 fails a context policy that also targets roles"],
  ], { fontSize: 12.5, limit: 4.6 });
  panel(s, "Three", 0.6, b + 0.25, 12.15, null, HEX.navy, HEX.navyTint, "THREE PIECES MEET HERE", null, [
    "The Wave 2 administrator policies; the activation gate and its context; the custom privileged authentication strength",
  ], 13);
  sources(s, "Sources: Module 3, Unit 1; Microsoft Learn, \"Configure Microsoft Entra role settings in PIM\"; Book 04, Ch 07, Ch 08 Step 2, Appendix A.");
  notes(s,
`Unit 1: the gate and its order. Three pieces of the design meet here: the Wave 2 administrator policies, the activation gate, and a custom authentication strength for privileged sign-ins. Microsoft Learn's page on PIM role settings sets the order, and the chapter quotes it. First, create and enable the Conditional Access policy for a context before you select that context in PIM. Second, if no policy targets the context, PIM falls back to M F A, but not when the policy is off, report-only, or excludes the user. Rule C A oh four warns when a context policy isn't On. Third, don't scope the policy to both the context and a directory role, because at activation the user doesn't hold the role yet, so the policy would never apply. Rule C A oh five fails that. So this module builds the gate and leaves it unselected. Module 4 selects C one only after this module's run shows the gate is On.`,
  `${M} — Unit 1 "The gate and its order": workbook Chapter 03, "The context the code depends on"; Book 04, Chapter 07 Wave 2, Chapter 08 Step 2, Appendix A.`);
}

// ================================================================== 5 Check
{
  const s = content(SC, "The pre-merge check: PA-CA-01 to PA-CA-09");
  tag(s, "What");
  const b = table(s, "CA", 1.45, [1.4, 1.6, 7.0, 2.15], ["Rule", "Severity", "What it catches", "From"], [
    ["PA-CA-01", "Finding; Info", "A policy that isn't disabled and doesn't exclude the emergency group", "Learn; design"],
    ["PA-CA-02", "Finding", "A report-only instrument set to enabled", "Design"],
    ["PA-CA-03", "Finding", "A placeholder, or a user target that isn't an object ID or Graph keyword", "Design"],
    ["PA-CA-04", "Warn", "An authentication context policy that isn't On", "Learn"],
    ["PA-CA-05", "Finding", "A context policy that also targets directory roles", "Learn"],
    ["PA-CA-06", "Finding; Warn", "MFA and a strength together; administrator roles with plain MFA", "Learn"],
    ["PA-CA-07", "Warn", "A role policy that leaves out any of the 14 roles Learn recommends", "Learn"],
    ["PA-CA-08", "Finding", "A context outside c1 to c25, or one the repository doesn't define", "Learn"],
    ["PA-CA-09", "Warn", "Report-only compliant device without Android, iOS and macOS excluded", "Learn"],
  ], { fontSize: 11.5, limit: 5.8 });
  line(s, "Five", "On the repository as merged, it passes with five Warn: rollout decisions, not mistakes.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 3, Unit 2; Microsoft Learn, \"Require phishing-resistant MFA for administrators,\" \"Conditional Access authentication strengths\"; PaConditionalAccess.psm1.");
  notes(s,
`Unit 2: the check, report-only, and the plan. The pre-merge check runs rules C A oh one to oh nine on every policy file before it merges. Some come from Microsoft Learn: a context policy that isn't On, or that also targets roles; M F A and an authentication strength together, or administrator roles with plain M F A; a policy that leaves out any of the fourteen roles Microsoft Learn's page on phishing-resistant M F A for administrators recommends; a context outside C one to C twenty-five; and a report-only compliant-device policy that doesn't exclude Android, i O S and mac O S. Others are the program's design: a report-only instrument set to enabled, and a placeholder or a user target that isn't an object I D. Oh one is both. On the repository as merged, the check passes with five warnings, and they're rollout decisions, not mistakes.`,
  `${M} — Unit 2: workbook Chapter 03, "The pre-merge check"; examples/privileged-access/powershell/PaConditionalAccess/PaConditionalAccess.psm1.`);
}

// ================================================================== 6 Report-only
{
  const s = content(SC, "Report-only policies and the emergency exclusion");
  tag(s, "What");
  const l = panel(s, "Learn", 0.6, 1.45, 4.0, null, HEX.navy, HEX.navyTint, "MICROSOFT LEARN", null, [
    "Doesn't require the exclusion on a report-only policy",
  ], 13.5);
  const m = panel(s, "Ch10", 4.75, 1.45, 4.0, null, HEX.amber, HEX.amberTint, "THE PROGRAM'S PRE-MERGE RULE", null, [
    "Stricter: every policy excludes the group",
  ], 13.5);
  const r = panel(s, "Code", 8.9, 1.45, 3.85, null, HEX.teal, HEX.tealTint, "THE CODE", null, [
    "Keeps the exclusion on every file",
    "Except a named report-only instrument, such as CA090: Info",
  ], 13.5);
  callout(s, "Never", Math.max(l, m, r) + 0.3, 1.0, "FaListCheck", HEX.teal, "Every new policy is created report-only, and nothing is deleted: ",
    "enforcing is a separate change that needs -AllowEnforce, and rollback is changing a file's state.");
  sources(s, "Sources: Module 3, Unit 2; Microsoft Learn, \"Manage emergency access accounts,\" \"Analyze Conditional Access policy impact\"; Book 04, Ch 07, Ch 10.");
  notes(s,
`Module 2 left a question open, and here's the answer. Microsoft Learn doesn't require the emergency exclusion on a report-only policy. The program's own pre-merge rule is stricter: every policy excludes the group. The code sides with the stricter rule. It keeps the exclusion on every file, except a named report-only instrument, such as C A oh nine oh, the policy that records emergency sign-ins, which is Info. And two more choices make the writes safe. Every new policy is created report-only. Enforcing it is a separate change, that needs the Allow Enforce switch. And the code never deletes. Rollback is changing a file's state, to disabled, and applying it.`,
  `${M} — Unit 2: workbook Chapter 03, "Report-only policies and the emergency exclusion"; Book 04, Chapter 07 — "Rollback"; Chapter 10.`);
}

// ================================================================== 7 Plan
{
  const s = content(SC, "Reading a plan: seven actions");
  tag(s, "What");
  const b = table(s, "Plan", 1.45, [2.6, 9.55], ["Action", "What it means"], [
    ["Create", "Not in the tenant. A policy is always created report-only"],
    ["Update", "Differs; the PATCH carries only the changed top-level properties, as Learn advises"],
    ["NoChange", "Matches the tenant"],
    ["Blocked", "Needs a strength or context the tenant doesn't have yet; the next run creates it"],
    ["Held", "The file says enabled, the tenant doesn't, and -AllowEnforce wasn't given"],
    ["Differs", "A strength that differs; the code doesn't update strengths"],
    ["NotInRepository", "In the tenant, not in the files: reported, never deleted"],
  ], { fontSize: 13, limit: 5.6 });
  line(s, "Dry", "A dry run writes plan.json and requests.json and sends nothing; -Apply sends them.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 3, Unit 2; Microsoft Learn, \"Update conditionalaccesspolicy\"; workbook Chapter 03, \"The plan, the dry run and the writes.\"");
  notes(s,
`The plan has seven actions. Create means the policy isn't in the tenant yet, and it's always created report-only. Update means it differs, and the patch carries only the changed top-level properties, as Microsoft Learn's reference for updating a policy advises. NoChange means it matches. Blocked means it needs an authentication strength or a context the tenant doesn't have yet, and the next run, once that exists, creates it. Held means the file says enabled, the tenant doesn't, and you didn't pass Allow Enforce. Differs is a strength that differs, because the code doesn't update strengths. And NotInRepository is a policy in the tenant that isn't in the files. It's reported, and never deleted. A dry run writes the plan and the requests it would send, and sends nothing.`,
  `${M} — Unit 2: workbook Chapter 03, "The plan, the dry run and the writes."`);
}
endModule(SC);

// ================================================================== 8 Try it: template and permissions
{
  const s = content(SL, "Try it: the template test, and each task's permissions");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/privileged-access",
    "PS> Invoke-Pester -Path tests/ConditionalAccess.Tests.ps1 -FullNameFilter '*Get conditionalAccessTemplate*' -Output None -PassThru |",
    "      Select-Object PassedCount, FailedCount",
    "PassedCount FailedCount",
    "----------- -----------",
    "          7           0",
    "",
    "PS> Import-Module ./powershell/PaConditionalAccess/PaConditionalAccess.psm1",
    "PS> (Get-PaCaRequiredPermission -Task ca-read).GraphPermissions -join ', '",
    "AuthenticationContext.Read.All, Policy.Read.All, Policy.Read.AuthenticationMethod",
    "PS> (Get-PaCaRequiredPermission -Task ca-apply).GraphPermissions -join ', '",
    "AuthenticationContext.Read.All, AuthenticationContext.ReadWrite.All, Policy.Read.All,",
    "  Policy.Read.AuthenticationMethod, Policy.ReadWrite.ConditionalAccess",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (THE LAST LINE WRAPPED)", pt: 11 });
  line(s, "Read", "Three read permissions plan; apply adds two write permissions and nothing else.", c + 0.3, 0.45, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 1 and 2; examples/privileged-access: tests/ConditionalAccess.Tests.ps1, config/calls-ch03.json.");
  notes(s,
`Try it. Lab 1 runs in the privileged-access folder, in one PowerShell 7 session, because step six uses a variable that step four loads. Step one tests Microsoft's Conditional Access template as published, the one the Graph reference returns for getting a template. Seven tests pass. Step two loads the Conditional Access module and lists each task's permissions. To read and plan, three: Authentication Context dot Read dot All, Policy dot Read dot All, and Policy dot Read dot Authentication Method. To apply, the same three, plus two writes: Authentication Context dot ReadWrite dot All, and Policy dot ReadWrite dot Conditional Access. Nothing else.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 9 Try it: check
{
  const s = content(SL, "Try it: the pre-merge check, on the files and the template");
  tag(s, "How");
  const c = code(s, "Chk", 0.6, 1.45, 12.15, [
    "# Lab 1, step 3: the repository's files",
    "PS> ./Invoke-PaCaAdmin.ps1 -CheckOnly -MapPath tests/fixtures/ch03/tenant-map.json",
    "Pre-merge check: 0 Finding, 5 Warn, 0 Info",
    "",
    "# Step 4: Microsoft's template",
    "PS> $t = Read-PaCaTemplatePage -Path ../third_party/conditional-access-template-page/conditionalaccesstemplate-get.md",
    "PS> $repo = Read-PaCaRepository -Path ca-policies -MapPath tests/fixtures/ch03/tenant-map.json",
    "PS> Test-PaCaPolicyBody -Body (ConvertFrom-PaCaTemplate -Template $t) -Repository $repo | Format-Table Rule, Severity",
    "Rule     Severity",
    "----     --------",
    "PA-CA-01 Finding",
    "PA-CA-03 Finding",
    "PA-CA-06 Warn",
    "PA-CA-07 Warn",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026", pt: 11 });
  line(s, "Read", "Microsoft's template: no emergency exclusion, display text in excludeUsers, plain MFA, 12 of the 14 roles missing.", c + 0.25, 0.45, 13);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 3 and 4; Microsoft Learn, \"Get conditionalAccessTemplate\"; examples/third_party (the template page).");
  notes(s,
`Step three runs the pre-merge check on the repository's own policy files. No findings, five warnings, which are the rollout decisions. A finding would print its rule and file and exit with code one, which fails the pipeline. Step four runs the same check on Microsoft's own template. You read the template page, load the repository, so the check knows the emergency group, and test the template's body. It fails the program's stricter rules four ways. C A oh one: it has no emergency exclusion. C A oh three: it has display text in its exclude users list, not an object I D. C A oh six: it uses plain M F A, not an authentication strength. And C A oh seven: it leaves out twelve of the fourteen roles Microsoft Learn recommends.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 3 and 4.`);
}

// ================================================================== 10 Try it: plan
{
  const s = content(SL, "Try it: plan against the fictional tenant, sending nothing");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "# Lab 1, step 5",
    "PS> ./Invoke-PaCaAdmin.ps1 -Cloud gcc -MapPath tests/fixtures/ch03/tenant-map.json -FixturePath tests/fixtures/ch03/tenant.json -OutputPath out/ca",
    "PS> Get-Content out/ca/plan.json -Raw | ConvertFrom-Json | Format-Table Kind, Name, Action",
    "Pre-merge check: 0 Finding, 5 Warn, 0 Info",
    "Plan: 3 Blocked, 4 Create, 1 NoChange, 1 NotInRepository, 2 Update",
    "Dry run: 6 request(s) written to requests.json, none sent; rerun with -Apply to send them",
    "Written to out/ca (manifest.json lists every request and file hash)",
    "Kind     Name                                             Action",
    "----     ----                                             ------",
    "context  c1                                               Create",
    "context  c2                                               Update",
    "strength FMP-Privileged-SeparateDevice                    Create",
    "policy   CA003-Admins-RequirePhishResistantMFA            Blocked",
    "policy   CA004-Admins-RequireCompliantDevice              Update",
    "policy   CA005-Admins-BlockUntrustedLocations             NoChange",
    "policy   CA025-Admins-BlockNonPAW                         Create",
    "policy   CA027-AllUsers-AzureManagement-BlockNonOperators Create",
    "policy   PIM-Activation-c1                                Blocked",
    "policy   ProtectedActions-c2                              Blocked",
    "policy   CA001-AllUsers-BlockLegacyAuth                   NotInRepository",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026", pt: 10.5 });
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" step 5; examples/privileged-access: Invoke-PaCaAdmin.ps1, ca-policies, tests/fixtures/ch03 (fictional).");
  notes(s,
`Step five plans against the fictional tenant, sending nothing. The check passes again, and the plan has three Blocked, four Create, one NoChange, one NotInRepository and two Update. The dry run writes six requests and sends none. Look at the list. Context C one is created and C two updated. The privileged authentication strength is created. Two policies are created, and the compliant-device policy is updated. Three are Blocked: C A oh oh three, because the strength it needs doesn't exist yet, and the two context policies, the activation gate and the protected actions policy, because C one doesn't exist yet either. And C A oh oh one, the legacy authentication block, is in the tenant but not in the files. It's reported as NotInRepository, and never deleted.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 5.`);
}

// ================================================================== 11 Try it: apply
{
  const s = content(SL, "Try it: apply three times, until nothing is left");
  tag(s, "How");
  const c = code(s, "Apply", 0.6, 1.45, 12.15, [
    "# Lab 1, step 6 (uses $repo from step 4)",
    "PS> $fake = New-PaCaFixtureInvoker -Path tests/fixtures/ch03/tenant.json -Cloud gcc",
    "PS> $findings = Test-PaCaRepository -Repository $repo",
    "PS> foreach ($run in 1..3) {",
    "        $client = New-PaCaClient -Cloud gcc -Invoke $fake.Invoke -Apply",
    "        $plan = Get-PaCaPlan -Repository $repo -Tenant (Get-PaCaTenant -Client $client)",
    "        $sent = @(Invoke-PaCaPlan -Client $client -Plan $plan -Findings $findings -EmergencyGroupId $repo.EmergencyGroupId | Where-Object Sent)",
    "        \"Run ${run}: $($sent.Count) sent\"",
    "    }",
    "Run 1: 6 sent",
    "Run 2: 3 sent",
    "Run 3: 0 sent",
    "PS> ($fake.Tenant.policies | Where-Object displayName -EQ 'PIM-Activation-c1').state",
    "enabledForReportingButNotEnforced",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026", pt: 10.5 });
  line(s, "Tests", "Step 7: Invoke-Pester -Path tests prints Tests Passed: 330, Failed: 0. Then Remove-Item -Recurse -Force out.", c + 0.25, 0.45, 13);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 6 and 7; examples/privileged-access/powershell/PaConditionalAccess/PaConditionalAccess.psm1.");
  notes(s,
`Step six applies the plan against the fake, three times in a row. Each run builds a client that may write, reads the tenant, plans, and applies, passing the check's findings and the emergency group, so the guards can refuse. The first run sends six requests: the contexts and the strength. The second run sends three: the three policies that were Blocked, now that what they need exists, and each is created report-only. The third run finds nothing to do, and sends nothing. Then read the activation gate's state in the fake tenant: enabled for reporting, but not enforced. The gate is still report-only. Turning it On is a separate, reviewed change. Step seven runs the tests, three hundred thirty pass, and you delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 6 and 7.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: plan, apply and enforce the gate in a test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant with Microsoft Entra ID P1, never production"],
    ["First", "Build Module 2's emergency accounts and confirm one can sign in; register a phishing-resistant method for each test administrator"],
    ["Plan and apply", "Write your tenant's map, register a reader app, plan, apply twice report-only"],
    ["Watch, then enforce", "Watch report-only results in the sign-in log, then enforce the gate alone with -AllowEnforce"],
    ["Permissions", "The three read permissions; for the apply, Policy.ReadWrite.ConditionalAccess and AuthenticationContext.ReadWrite.All"],
    ["Back it out", "Set each file the lab created to disabled and the contexts' isAvailable to false, then apply; nothing is deleted"],
  ], { fontSize: 12.5, limit: 5.6 });
  callout(s, "NotRun", b + 0.2, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "and don't select c1 in PIM in this lab; Module 4 does that.");
  sources(s, "Sources: Module 3, \"Exercise: Lab 2\" and its lockout callout; Microsoft Learn, \"Require phishing-resistant MFA for administrators.\"");
  notes(s,
`Lab 2 runs in a worldwide or G C C test tenant with Microsoft Entra I D P1, never production. Before it enforces anything, build Module 2's emergency accounts and confirm one can sign in. And register a phishing-resistant method for each test administrator first: Microsoft Learn warns that enabling the policy first risks locking you out. Then write your tenant's map, register a reader app, plan, and apply twice, report-only. Watch the report-only results in the sign-in log, and then enforce the gate alone, with Allow Enforce. Don't select C one in PIM in this lab; Module 4 does that. The reader needs the three read permissions, and the apply adds the two write permissions, and nothing else. To back out, set each file the lab created to disabled, and the contexts to unavailable, then apply. Turning a policy off needs no Allow Enforce, and nothing is deleted. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; the lockout callout.`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence for Module 3");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.6, 3.0, 4.55], ["Requirement", "KSI", "Evidence"], [
    ["IA-2(1); OMB M-22-09; MS.AAD.3.6v1", "KSI-IAM-APM", "The strength file and CA003; PA-CA-06, 07"],
    ["AC-6(1), AC-6(10): a fresh proof at elevation", "KSI-IAM-JIT", "PIM-Activation-c1.json, ProtectedActions-c2.json, the contexts; PA-CA-04, 05, 08"],
    ["AC-2: the emergency accounts stay usable", "KSI-IAM-JIT", "PA-CA-01 in the pull request's check run"],
    ["CM-3, CM-3(2): reviewed and tested before it's made", "KSI-CMT-LMC, -RMV, -VTD", "The pre-merge check; plan.json and requests.json"],
    ["AC-6: least privilege to plan and to apply", "KSI-IAM-ELP", "Three read permissions; apply adds two writes"],
  ], { fontSize: 11.5, limit: 5.0 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "The reviewed policy files and the pull request's check run; each run's plan.json and requests.json with its manifest; the audit records of the creates; the pull request that enabled the gate",
  ], 12.5);
  sources(s, "Sources: Module 3, \"Introduction,\" \"Summary\"; NIST SP 800-53 Rev. 5; OMB M-22-09; CISA BOD 25-01 (MS.AAD.3.6v1); FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. The policy files, the check and the plan are the evidence for the plan's tasks A1.5, A2.3, A2.5 and A2.6. Phishing-resistant M F A for administrators is required by NIST special publication eight hundred fifty-three I A two, enhancement one, by O M B memorandum M twenty-two oh-nine, and by CISA's B O D twenty-five oh-one and its ScubaGear baseline, M S A A D three point six, version one. The activation gate, a fresh proof at elevation, supports A C six, enhancements one and ten. The emergency exclusion keeps A C two's emergency accounts usable. And C M three covers every change, reviewed and tested before it's made. The evidence an ISSO keeps: the reviewed policy files and the pull request's check run; each run's plan and requests with its manifest; the Entra audit records of the creates; and the pull request that changed the gate's state to enabled.`,
  `${M} — Unit "Introduction" (the federal requirement and its table); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on the activation gate", [
    { q: "PIM-Activation-c1 is report-only, and PIM requires context c1 on activation. What happens?", options: ["a. The activation asks for the strength and a compliant device", "b. PIM's MFA fallback doesn't trigger, because the policy is report-only; so the gate must be On first", "c. PIM refuses every activation"] },
    { q: "A policy is in the tenant but not in the files. What does the plan do?", options: ["a. Deletes it", "b. Reports it as NotInRepository and never deletes it", "c. Imports it into the files"] },
  ], "1 b: Learn's order: create and enable the policy before you select the context. 2 b: seen for CA001 in Lab 1, step 5.");
  sources(s, "Sources: Module 3, \"Knowledge check,\" questions 1 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: the activation gate's policy is report-only, and PIM requires context C one on activation. What happens? The answer is b: PIM's M F A fallback doesn't trigger, because the policy is report-only. Nothing gates the activation. That's why Microsoft Learn says to create and enable the policy before you select the context. Second: a policy is in the tenant but not in the files. What does the plan do? The answer is b: it reports it as NotInRepository, and never deletes it. You saw that for C A oh oh one in Lab 1, step five. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 4, PIM for Entra roles");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Checked the administrator policies and the gate before merge",
    "Saw Microsoft's own template fail the program's stricter rules",
    "Planned against a tenant",
    "Applied three times until nothing was left, with the gate still report-only",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 4: PIM for Microsoft Entra roles as code", [
    "One reviewed file per role",
    "Selects c1 only once the gate is On",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaUserShield", HEX.teal, "Carry forward: ",
    "the gate's state can't be read from v1.0, so Module 4 asks a person to state it's On.");
  sources(s, "Sources: Module 3, \"Summary\"; Module 4, \"Introduction\" and its lockout callout.");
  notes(s,
`To sum up. You checked the administrator policies and the activation gate before merge, saw Microsoft's own template fail the program's stricter rules, planned against a tenant, and applied three times until nothing was left to change, with the gate still report-only. Carry one thing forward: the gate's policy state can't be read from the version one point oh A P I, so the next module asks a person to state that the gate is On before it sets the context. Next is Module 4: PIM for Microsoft Entra roles as code. You hold each role's PIM settings as one reviewed file, see exactly what a change will do, apply it one rollout wave at a time, and prove from a read-back that the tenant matches the files.`,
  `${M} — Unit "Summary"; Module 4 — "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/privileged-access/03-conditional-access-and-the-activation-gate.md (Privileged Access learning path, Module 3): Introduction, its lockout callout and requirement table, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "Original sources, as workbook Chapter 03 footnotes them: Microsoft Learn, \"Configure Microsoft Entra role settings in PIM\"; \"Require phishing-resistant MFA for administrators\"; \"Conditional Access authentication strengths\"; \"Manage emergency access accounts\"; \"Analyze Conditional Access policy impact\"; \"Get conditionalAccessTemplate\"; \"Update conditionalaccesspolicy\"; NIST SP 800-53 Rev. 5; OMB M-22-09; CISA BOD 25-01; FedRAMP, \"Key Security Indicators.\"",
  "Kit: examples/privileged-access (Invoke-PaCaAdmin.ps1; powershell/PaConditionalAccess; ca-policies; config/calls-ch03.json; tests/ConditionalAccess.Tests.ps1; tests/fixtures/ch03) and examples/third_party (the template page). Fictional identities. Illustrative: tested against fixtures and a fake, not run against a production tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7.6.9 and Pester 5.9.0 in a scratch copy of examples/, outside the repository; it matched data/kit-captures/pa/03-1.txt to 03-8.txt. Long lines are wrapped where the slides say so. Verification: docs/training/privileged-access/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
