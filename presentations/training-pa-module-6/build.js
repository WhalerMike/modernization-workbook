// Privileged Access learning path, Module 6: PIM for Azure resources — the module's narrated deck.
// Teaches docs/training/privileged-access/06-pim-for-azure-resources.md, Learn-style: objectives, the concepts, "Try it"
// slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/privileged-access),
// Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module
// page, the learning path's verification log, or the kit (examples/privileged-access); the deck adds none. The narration
// names the original source the workbook footnotes for each fact (workbook Chapter 06's footnotes).
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pa-module-6/build.js \
//                      presentations/training-pa-module-6/Training_PA_Module_6.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 6: PIM for Azure resources",
  footer: "Federal Modernization Workbook  ·  Privileged Access learning path, Module 6: PIM for Azure resources",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Privileged Access learning path — Module 6: PIM for Azure resources";
const OUT = process.argv[2] || "Training_PA_Module_6.pptx";
const M = "Training, Privileged Access, Module 6";

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
  const s = title(SI, "Module 6: PIM for Azure resources", "Privileged Access learning path · Plan Phase 3 (A3.2), with workbook Chapter 06",
    ["Resource Manager, not Graph  ·  Scopes and holders  ·  The findings", "The plan and the apply  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 6 of the Privileged Access learning path: PIM for Azure resources. This module serves the project plan's task A3.2 in Phase 3, Azure privileged roles eligible through PIM, with Chapter 06 of the developer workbook. Owner, Contributor and User Access Administrator on a subscription are privileged too. The plan makes them eligible through PIM, with at most three subscription owners. In this module you hold PIM for Azure resources as code. One reviewed file says which scopes are governed, the settings for each tier, who is eligible, and which standing assignments are allowed and who owns each one. The code reads the estate, prints a diff, writes the requests it would send, and sends them only with Apply. It's illustrative: tested against fixtures and a fake.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why Azure roles need their own module");
  tag(s, "Why");
  const l = panel(s, "ARM", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "NOT IN MICROSOFT GRAPH", "Azure Resource Manager", [
    "Azure roles on the resource, instead of Graph permissions",
    "Owner, Contributor and User Access Administrator are privileged too",
    "At most three subscription owners",
  ], 13.5);
  const b = table(s, "Guards", 1.45, [2.1, 3.8], ["The lockout guard", "What it does"], [
    ["Eligible first", "An eligible replacement before each removal"],
    ["PA-AZ-05", "Flags the plan's own identity's standing role: decide it last"],
    ["Context", "Refused before its Conditional Access policy is confirmed"],
    ["Policies first", "A request that breaks a policy is refused"],
  ], { fontSize: 12.5, limit: 5.2, x: 6.85 });
  callout(s, "Lose", Math.max(l, b) + 0.3, 0.85, "FaUserShield", HEX.red, "So no holder loses the role ",
    "before they can activate it.");
  sources(s, "Sources: Module 6, \"Introduction\" and its lockout callout; Microsoft Learn, \"Best practices for Azure RBAC.\"");
  notes(s,
`Why its own module? Because PIM for Azure resources isn't in Microsoft Graph. It goes through Azure Resource Manager, and the caller needs Azure roles on the resource instead of Graph permissions. The roles matter: Owner, Contributor and User Access Administrator on a subscription are privileged, and Microsoft Learn's Azure R B A C best practices say at most three subscription owners. Four guards keep people from losing access. Eligible first: each standing assignment held by a user or group gets an eligible replacement before its removal, so no holder loses the role before they can activate it. Rule A Z oh five flags a standing assignment held by the identity the plan runs as; the apply needs it to finish, so decide it last, from another session, as this workbook's design guidance says. The desired state refuses an authentication context before its Conditional Access policy is confirmed, as Microsoft Learn advises. And policies go first, because a request that breaks a policy is refused.`,
  `${M} — Unit "Introduction"; the callout "The lockout check for this module."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 6", [
    "Explain why PIM for Azure resources goes through Resource Manager, and which API version",
    "Explain why role settings must be set at every governed scope",
    "Say who can and can't be made eligible",
    "Read the plan's three kinds of operation and its findings, PA-AZ-01 to PA-AZ-06",
    "Explain why the code declares User Access Administrator, not Owner, for the apply",
  ], [
    "Module 1: the Azure half of the inventory, the same two schedule lists",
    "Module 4: the seven managed rules, the same here",
    "Lab 2: a test management group, subscription and resource group, never production",
  ], 50);
  sources(s, "Sources: Module 6, \"Learning objectives,\" \"Prerequisites\"; \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll explain why PIM for Azure resources goes through Resource Manager, and which A P I version the code uses. You'll explain why role settings must be set at every governed scope. You'll say who can and can't be made eligible. You'll read the plan's three kinds of operation and its findings, A Z oh one to oh six. And you'll explain why the code declares User Access Administrator, not Owner, for the apply. Before you start, finish Module 1, whose Azure half reads the same two schedule lists, and Module 4, whose seven managed rules are the same here. Lab 2 needs a worldwide or G C C test tenant with a test management group, subscription and resource group, never production, and P2 or Governance licenses for eligible users.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 ARM, scopes, holders
{
  const s = content(SC, "Resource Manager, scopes and holders");
  tag(s, "What");
  const b = table(s, "Ctx", 1.45, [3.4, 8.75], ["What Microsoft Learn says", "What the code does"], [
    ["Three resource types under Microsoft.Authorization do the work; 2020-10-01 is the generally available release of each", "Pins api-version 2020-10-01"],
    ["Settings at a subscription aren't inherited by a resource group under it", "The file lists every scope it governs"],
    ["Users can be eligible; applications, service principals and managed identities can't activate", "A pipeline's standing Contributor is reported and left alone"],
    ["Best practice: at most three subscription owners", "PA-AZ-06 counts Owners after the plan"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Gov", b + 0.25, 0.85, "FaListCheck", HEX.navy, "What counts as privileged: ",
    "Learn's privileged administrator roles; the chapter governs the three the plan names.");
  sources(s, "Sources: Module 6, Unit 1; Microsoft Learn, \"API versions of Azure RBAC REST APIs,\" \"Configure Azure resource role settings in PIM,\" \"Eligible and time-bound role assignments.\"");
  notes(s,
`Unit 1: Resource Manager, scopes and holders. Resource Manager, not Graph: three resource types under Microsoft dot Authorization do the work, and Microsoft Learn's page on the Azure R B A C A P I versions marks twenty twenty, ten, oh one as the generally available release of every PIM resource type. The code pins it. Policies don't inherit: Microsoft Learn's page on Azure resource role settings says settings at a subscription aren't inherited by a resource group under it, so the file lists every scope it governs. Who can be eligible: users, not applications, service principals or managed identities, which can't perform the activation steps. So a standing Contributor held by a deployment pipeline is reported, and left alone. And what counts as privileged: Learn's privileged administrator roles, of which the chapter governs the three the plan names, with Microsoft's best practice of at most three subscription owners.`,
  `${M} — Unit 1: workbook Chapter 06, "The context the code depends on."`);
}

// ================================================================== 5 Findings
{
  const s = content(SC, "The findings: PA-AZ-01 to PA-AZ-06");
  tag(s, "What");
  const b = table(s, "AZ", 1.45, [1.5, 1.6, 6.7, 2.35], ["Rule", "Severity", "What it catches", "From"], [
    ["PA-AZ-01", "Finding; Info", "Standing Owner, Contributor or User Access Administrator outside the exceptions", "Learn"],
    ["PA-AZ-02", "Finding", "A standing assignment held by a service principal or managed identity", "Learn"],
    ["PA-AZ-03", "Finding", "User Access Administrator at root scope (/)", "Learn"],
    ["PA-AZ-04", "Warn", "An eligibility the file doesn't declare, or one that never expires: reported, never removed", "Design"],
    ["PA-AZ-05", "Finding", "A standing assignment held by the identity the plan runs as", "Design"],
    ["PA-AZ-06", "Finding", "More than three Owners on a subscription, after the plan", "Learn"],
  ], { fontSize: 12.5, limit: 5.2 });
  line(s, "Info", "PA-AZ-01 is Info for a holder on the exceptions list with an owner; an exception with no owner doesn't count.", b + 0.2, 0.45, 13);
  sources(s, "Sources: Module 6, Unit 2 and Lab 1, step 4; Microsoft Learn, \"Plan a PIM deployment,\" \"Best practices for Azure RBAC\"; PaAzurePim.psm1.");
  notes(s,
`The findings, A Z oh one to oh six. Oh one is standing Owner, Contributor or User Access Administrator outside the exceptions, against Microsoft Learn's advice of zero permanently active assignments. It's Info for a holder on the exceptions list with an owner. Oh two is a standing assignment held by a service principal or managed identity, which Microsoft Learn says can't be made eligible. Oh three is User Access Administrator at root scope, the elevated access Microsoft Learn says to remove when the task is done. Oh four is an eligibility the file doesn't declare, or one that never expires. It's reported, never removed by the plan. Oh five is the plan's own identity holding a standing role, the kit's own design. And oh six is more than three Owners on a subscription, counted after the plan.`,
  `${M} — Unit 2: workbook Chapter 06, "What it adds"; examples/privileged-access/powershell/PaAzurePim/PaAzurePim.psm1.`);
}

// ================================================================== 6 Plan and apply
{
  const s = content(SC, "The plan, the apply, and the narrower role");
  tag(s, "What");
  const b = table(s, "Order", 1.45, [1.0, 4.6, 6.55], ["#", "The plan's order", "Why"], [
    ["1", "Policy updates", "A request that breaks a policy is refused"],
    ["2", "New eligible assignments", "So each holder can activate before losing standing access"],
    ["3", "Removal of standing assignments", "Last, after its eligible replacement"],
  ], { fontSize: 13, limit: 3.5 });
  const l = panel(s, "Roles", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "TWO TASKS, TWO ROLES", null, [
    "Reader reads; User Access Administrator applies",
    "The narrower of the two roles the PIM pages name; Owner isn't needed",
  ], 13);
  panel(s, "Same", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "THE SAME REQUESTS, AND A BACK-OUT", null, [
    "Each request's GUID comes from the run ID and the operation",
    "Every run writes state.json: each policy's rules as read",
  ], 13);
  sources(s, "Sources: Module 6, Unit 2; Microsoft Learn, \"Assign Azure resource roles in PIM\"; examples/privileged-access: config/calls-ch06.json, PaAzurePim.psm1.");
  notes(s,
`Unit 2: the plan and the apply. The call list has two tasks. Reader reads; User Access Administrator applies. Microsoft Learn's PIM pages name two roles that can manage assignments, and the code follows the stricter statement and declares the narrower one, User Access Administrator. Owner isn't needed for anything. The plan's order is fixed: policy updates first, then new eligible assignments, then removal of standing assignments. Each request has a G U I D derived from the run I D and the operation, so the dry run and the apply send exactly the requests the reviewer read. An eligibility the file doesn't declare is reported, never removed by the plan. And every run writes a state file, which holds each policy's rules as read. That's the back-out.`,
  `${M} — Unit 2: workbook Chapter 06, "What it adds."`);
}
endModule(SC);

// ================================================================== 7 Try it: examples and roles
{
  const s = content(SL, "Try it: Microsoft's examples, and each task's roles");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/privileged-access",
    "PS> Invoke-Pester -Path tests/AzurePim.Tests.ps1 -FullNameFilter \"*Microsoft's examples*\" -Output None -PassThru |",
    "      Select-Object PassedCount, FailedCount, NotRunCount",
    "PassedCount FailedCount NotRunCount",
    "----------- ----------- -----------",
    "          6           0          32",
    "",
    "# Step 2: list the roles each task needs",
    "PS> Import-Module ./powershell/PaAzurePim/PaAzurePim.psm1",
    "PS> (Get-PaAzRequiredRole -Task azure-pim-read).AzureRoles -join ', '",
    "Reader",
    "PS> (Get-PaAzRequiredRole -Task azure-pim-apply).AzureRoles -join ', '",
    "Reader, User Access Administrator",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026", pt: 11 });
  line(s, "Read", "Microsoft's own assignment example is an activation, though its assignmentType says Assigned. Owner isn't needed for anything.", c + 0.3, 0.75, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 1 and 2; examples/privileged-access: tests/AzurePim.Tests.ps1, config/calls-ch06.json.");
  notes(s,
`Try it. Lab 1 runs in one PowerShell 7 session. The fixture estate has a management group, contoso root, a workload subscription, a control-plane subscription, and a resource group, R G payroll. The identity that would run the apply is the fictional service principal S P P I M automation. Step one replays Microsoft's examples from the Azure R E S T A P I specifications. Six pass; the thirty-two not run are the chapter's other tests. The second test is the one to notice: Microsoft's own assignment example is an activation, though its assignment type says Assigned. Step two lists the roles each task needs. Reading needs Reader. Applying needs Reader and User Access Administrator. Owner isn't needed for anything.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 8 Try it: plan
{
  const s = content(SL, "Try it: plan the fictional estate, as a dry run");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "# Lab 1, step 3",
    "PS> ./Invoke-PaAzurePim.ps1 -Cloud gcc -FixturePath tests/fixtures/ch06/estate.json -DesiredPath tests/fixtures/ch06/desired.json `",
    "      -CallerPrincipalId c3000000-0000-4000-8000-000000000003 -OutputPath out/ch06 -RunId lab",
    "Read: 9 assignment and 2 eligibility schedules, 12 policies at 4 scopes",
    "Plan: 11 policy updates, 5 eligible assignments to add, 3 standing assignments to remove",
    "Findings: 7 Finding, 2 Warn, 1 Info",
    "Dry run: 19 requests written to plan.json, none sent. Review diff.txt, then rerun with -Apply.",
    "Written to out/ch06 (manifest.json lists every request and file hash)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026", pt: 10.5 });
  table(s, "Read", c + 0.25, [3.0, 9.15], ["Read it", "What the run printed"], [
    ["The read", "9 assignment and 2 eligibility schedules; 12 policies at 4 scopes"],
    ["The plan", "11 policy updates, 5 eligible assignments to add, 3 standing assignments to remove: 19 requests"],
    ["The findings", "7 Finding, 2 Warn, 1 Info; nothing sent"],
  ], { fontSize: 13, limit: 6.1 });
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" step 3; examples/privileged-access: Invoke-PaAzurePim.ps1, tests/fixtures/ch06 (fictional).");
  notes(s,
`Step three plans, as a dry run. You give it the cloud, the fixture estate, the desired state, the principal I D of the identity that would run the apply, so it can flag that identity's own roles, an output folder and a run I D. It reads nine assignment schedules and two eligibility schedules, and twelve policies at four scopes. The plan: eleven policy updates, five eligible assignments to add, and three standing assignments to remove. Nineteen requests, in that order. The findings: seven, with two warnings and one information item. It's a dry run, so the nineteen requests are written to the plan file, and none are sent. Review the diff, then run again with Apply.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 3.`);
}

// ================================================================== 9 Try it: diff
{
  const s = content(SL, "Try it: eligible first, then the removal");
  tag(s, "How");
  const c = code(s, "Diff", 0.6, 1.45, 12.15, [
    "# Lab 1, step 4: the + and - lines of diff.txt (scopes shortened: mg = .../managementGroups, sub1 = /subscriptions/1111...1111)",
    "+ eligible User Access Administrator at mg/contoso-root (T0) for b2000000-...-000000000001, P90D (converted)",
    "+ eligible Owner at sub1 (T1) for a1000000-...-000000000001, P180D (converted)",
    "+ eligible Owner at sub1 (T1) for b2000000-...-000000000002, P180D",
    "+ eligible Contributor at sub1/resourceGroups/rg-payroll (T1) for a1000000-...-000000000002, P180D (converted)",
    "+ eligible Contributor at sub1/resourceGroups/rg-payroll (T1) for b2000000-...-000000000003, P180D",
    "- active User Access Administrator at mg/contoso-root (T0) for b2000000-...-000000000001 (standing; eligible replacement first)",
    "- active Owner at sub1 (T1) for a1000000-...-000000000001 (standing; eligible replacement first)",
    "- active Contributor at sub1/resourceGroups/rg-payroll (T1) for a1000000-...-000000000002 (standing; eligible replacement first)",
    "PS> (Get-Content out/ch06/diff.txt | Where-Object { $_ -match '^~ ' }).Count",
    "70",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (SHORTENED: \"...\" AND THE SCOPE NAMES ABOVE)", pt: 10 });
  line(s, "Read", "Each (converted) line has its - active line: eligible replacement first. The 70 ~ lines are policy rule changes.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" step 4; examples/privileged-access/tests/fixtures/ch06 (fictional IDs).");
  notes(s,
`Step four reads the diff. The plus lines add eligible assignments: User Access Administrator at the root management group, Tier 0, for ninety days; Owner on the workload subscription, twice; and Contributor on the payroll resource group, twice, each for a hundred eighty days, Tier 1. Three of them say converted. Each converted line has its minus line below: the standing User Access Administrator, Owner and Contributor assignments those holders had, each removed only after its eligible replacement. Eligible replacement first. Then count the tilde lines: seventy policy rule changes, across the governed scopes. The slide shortens the I D's and scope names to fit.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 4.`);
}

// ================================================================== 10 Try it: findings
{
  const s = content(SL, "Try it: read the findings");
  tag(s, "How");
  const c = code(s, "Find", 0.6, 1.45, 12.15, [
    "# Lab 1, step 4, continued",
    "PS> Get-Content out/ch06/findings.json -Raw | ConvertFrom-Json | Where-Object Severity -ne 'Warn' | Format-Table Rule, Severity, Role, Scope",
    "Rule     Severity Role                      Scope",
    "----     -------- ----                      -----",
    "PA-AZ-01 Finding  User Access Administrator /providers/Microsoft.Management/managementGroups/contoso-root",
    "PA-AZ-05 Finding  User Access Administrator /providers/Microsoft.Management/managementGroups/contoso-root",
    "PA-AZ-03 Finding  User Access Administrator /",
    "PA-AZ-01 Finding  Owner                     /subscriptions/11111111-1111-4111-8111-111111111111",
    "PA-AZ-02 Finding  Contributor               /subscriptions/11111111-1111-4111-8111-111111111111",
    "PA-AZ-01 Info     Contributor               /subscriptions/22222222-2222-4222-8222-222222222222",
    "PA-AZ-01 Finding  Contributor               /subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-payroll",
    "PA-AZ-06 Finding  Owner                     /subscriptions/11111111-1111-4111-8111-111111111111",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026", pt: 10.5 });
  const l = panel(s, "AZ5", 0.6, c + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "PA-AZ-05", null, [
    "sp-pim-automation's own User Access Administrator: decide it last",
  ], 13);
  panel(s, "AZ2", 6.85, c + 0.25, 5.9, null, HEX.amber, HEX.amberTint, "PA-AZ-02", null, [
    "A pipeline's standing Contributor, which can't be made eligible",
  ], 13);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" step 4; examples/privileged-access/tests/fixtures/ch06 (fictional).");
  notes(s,
`Then the findings, leaving out the two warnings. Three A Z oh one findings: standing User Access Administrator at the root management group, standing Owner on the workload subscription, and standing Contributor on the payroll resource group. One oh one is Info: a Contributor on the control-plane subscription that's on the exceptions list with an owner. A Z oh five is the automation service principal's own User Access Administrator: the apply needs it to finish, so decide it last, from another session. A Z oh three is User Access Administrator at root scope, elevated access. A Z oh two is a pipeline's standing Contributor, which can't be made eligible, so it's reported and left alone. And A Z oh six: more than three Owners on the workload subscription.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 4.`);
}

// ================================================================== 11 Try it: apply and refuse
{
  const s = content(SL, "Try it: apply to the fake, and see the code refuse");
  tag(s, "How");
  const c = code(s, "Apply", 0.6, 1.45, 12.15, [
    "# Lab 1, step 5: apply against the fake",
    "PS> ./Invoke-PaAzurePim.ps1 -Cloud gcc -FixturePath tests/fixtures/ch06/estate.json -DesiredPath tests/fixtures/ch06/desired.json `",
    "      -CallerPrincipalId c3000000-0000-4000-8000-000000000003 -OutputPath out/ch06-apply -RunId lab -Apply",
    "Applied: 19 requests sent; left to change after a fresh read: 0",
    "# Step 6: see the code refuse",
    "PS> $read = New-PaAzClient -Cloud gcc -Task azure-pim-read -Invoke (New-PaAzFixtureInvoker -Path tests/fixtures/ch06/estate.json).Invoke",
    "PS> Invoke-PaAzWrite -Client $read -CallId azpim-policy-update -Bind @{ scope = '/subscriptions/1111...1111'; name = 'f600...0004' } `",
    "      -Body @{} -Apply",
    "Exception: Undeclared call 'azpim-policy-update' for task 'azure-pim-read'; add it to config/calls-ch06.json with its role.",
    "PS> ConvertTo-PaAzScope '/subscriptions/1111...1111/resourceGroups/rg-payroll/providers/Microsoft.Web/sites/payroll'",
    "Exception: '/subscriptions/1111...1111/resourceGroups/rg-payroll/providers/Microsoft.Web/sites/payroll' isn't a management group,",
    "  subscription or resource group scope",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (READ, PLAN AND FINDINGS LINES LEFT OUT; IDS SHORTENED WITH \"...\")", pt: 10.5 });
  line(s, "Tests", "Step 7: Invoke-Pester -Path tests prints Tests Passed: 330, Failed: 0. Then Remove-Item -Recurse -Force out.", c + 0.25, 0.45, 13);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 5 to 7; examples/privileged-access/powershell/PaAzurePim/PaAzurePim.psm1.");
  notes(s,
`Step five applies against the fake, with the same run I D, so it sends exactly the nineteen requests the dry run wrote. It prints the same read, plan and findings, then: nineteen requests sent, and after a fresh read, zero left to change. Step six shows the code refusing. Build a client for the read task, and try to write a policy update with it. It throws: that call isn't declared for the read task; add it to the call list with its role. A read client can't write. Then ask the code to treat a web app as a scope. It refuses: a scope must be a management group, a subscription or a resource group. Step seven runs the tests, three hundred thirty pass, and you delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 to 7.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: test scopes, and a one-day apply role");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant with a test management group, subscription and resource group, never production"],
    ["Prepare", "An app with Reader on each test scope; the desired state for the test scopes"],
    ["Plan and apply", "Plan live; apply under a one-day User Access Administrator assignment; try the narrower role on one scope"],
    ["Permissions", "No Graph permission; Reader to plan; User Access Administrator, time-bound for one day, to apply"],
    ["Back it out", "Wait five minutes; remove the eligible assignments; restore each policy from state.json; remove the app; delete the out folders"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "eligible users need Microsoft Entra ID P2 or Microsoft Entra ID Governance; use fictional users and groups.");
  sources(s, "Sources: Module 6, \"Exercise: Lab 2, your test tenant.\"");
  notes(s,
`Lab 2 runs in a worldwide or G C C test tenant, with a test management group, subscription and resource group, never production, and fictional users and groups. Eligible users need Microsoft Entra I D P2 or Microsoft Entra I D Governance. You prepare an app with Reader on each test scope, and write the desired state for the test scopes. You plan live, then apply under a User Access Administrator assignment that lasts one day, and try the narrower role on one scope. No Graph permission is needed at all. The back-out waits at least five minutes after the last assignment, removes the eligible assignments the run created, restores each policy from the dry run's state file, removes the app's roles and the app, and deletes the test output folders. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence for A3.2");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.0, 2.7, 4.45], ["Requirement", "KSI", "Evidence"], [
    ["AC-6, AC-6(1): each tier's role settings", "KSI-IAM-JIT", "The ~ lines in diff.txt against desired.json"],
    ["AC-6, AC-6(5), AC-2: standing privilege, service principals, root elevation, undeclared eligibility, Owners", "KSI-IAM-JIT, KSI-IAM-ELP", "PA-AZ-01 to 06 in findings.json"],
    ["CM-3: reviewed before it's made, with the back-out", "KSI-CMT-LMC, -RMV", "state.json, plan.json, diff.txt, manifest.json"],
    ["CM-3, CM-4(2): in order, and nothing left after", "KSI-CMT-LMC, -VTD, KSI-IAM-JIT", "diff-after.txt from the apply"],
    ["AC-6: least privilege for each identity", "KSI-IAM-ELP", "Reader; User Access Administrator; the refused write"],
  ], { fontSize: 11, limit: 4.9 });
  line(s, "BOD", "BOD 25-01's Entra ID policies cover Entra roles, not Azure roles, so the chapter claims none here.", b + 0.15, 0.45, 13);
  panel(s, "Keep", 0.6, b + 0.7, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "The reviewed desired.json; each run's state.json, plan.json, diff.txt and findings.json with its manifest; the apply's diff-after.txt",
  ], 12);
  sources(s, "Sources: Module 6, \"Introduction,\" \"Summary\"; NIST SP 800-53 Rev. 5; FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. The desired state, the plan and the read-back are the evidence for the plan's task A3.2, Azure privileged roles eligible through PIM. From NIST special publication eight hundred fifty-three they support A C six, with enhancements one and five, A C two, and C M three with C M four, enhancement two. Note one absence. CISA's B O D twenty-five oh-one has Microsoft Entra I D policies, and they cover Entra roles, not Azure roles, so the chapter claims none of them here. The evidence an ISSO keeps: the reviewed desired state; each run's state, plan, diff and findings, with its manifest; and the apply's diff-after file, which shows nothing left to change.`,
  `${M} — Unit "Introduction" (the federal requirement and its table); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on Azure PIM", [
    { q: "You set role settings at a subscription. Does a resource group under it get them?", options: ["a. Yes, always", "b. No: settings aren't inherited, so the file lists every governed scope", "c. Only for Owner"] },
    { q: "A deployment pipeline's service principal holds standing Contributor. What does the plan do?", options: ["a. Converts it to eligible", "b. Removes it", "c. Reports PA-AZ-02 and leaves it alone: service principals can't be made eligible"] },
  ], "1 b: Learn says settings aren't inherited. 2 c: seen in Lab 1, step 4.");
  sources(s, "Sources: Module 6, \"Knowledge check,\" questions 2 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: you set role settings at a subscription. Does a resource group under it get them? The answer is b: no. Microsoft Learn says the settings aren't inherited, so the file lists every governed scope. Second: a deployment pipeline's service principal holds standing Contributor. What does the plan do? The answer is c: it reports A Z oh two and leaves it alone, because service principals can't be made eligible. You saw it in Lab 1, step four. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 7, access reviews");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Read a fictional Azure estate at four scopes",
    "Planned 19 requests in order: policies, eligibility, removals",
    "Saw each conversion add the eligible assignment first",
    "Applied them to the fake with nothing left, and saw a read client refuse a write",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 7: Access reviews of privileged roles", [
    "Who keeps the eligibility",
    "Every review series as code",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaUserShield", HEX.teal, "Carry forward: ",
    "an eligibility the file doesn't declare is reported, not removed; the access review decides it.");
  sources(s, "Sources: Module 6, \"Summary\"; Module 7, \"Introduction.\"");
  notes(s,
`To sum up. You read a fictional Azure estate at four scopes, planned nineteen requests in order, policies, then eligibility, then removals, saw each conversion add the eligible assignment first, and applied them to the fake with nothing left to change. And you saw a read client refuse a write. Next is Module 7: access reviews of privileged roles. The approval gate controls the use of privilege; reviews control who keeps the eligibility. In Module 7 you define every privileged review series as code, show a reviewer what a change will do before it reaches the tenant, and hand the ISSO the decisions each review produced.`,
  `${M} — Unit "Summary"; Module 7 — "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 6 deck", [
  "Module page: docs/training/privileged-access/06-pim-for-azure-resources.md (Privileged Access learning path, Module 6): Introduction, its lockout callout and requirement table, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "Original sources, as workbook Chapter 06 footnotes them: Microsoft Learn, \"API versions of Azure RBAC REST APIs\"; \"Configure Azure resource role settings in PIM\"; \"Assign Azure resource roles in PIM\"; \"Eligible and time-bound role assignments in Azure RBAC\"; \"Plan a PIM deployment\"; \"Best practices for Azure RBAC\"; Azure/azure-rest-api-specs (the examples); NIST SP 800-53 Rev. 5; FedRAMP, \"Key Security Indicators.\"",
  "Kit: examples/privileged-access (Invoke-PaAzurePim.ps1; powershell/PaAzurePim; config/calls-ch06.json; tests/AzurePim.Tests.ps1; tests/fixtures/ch06). Fictional identities. Illustrative: tested against fixtures and a fake, not run against a production tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7.6.9 and Pester 5.9.0 in a scratch copy of examples/, outside the repository; it matched data/kit-captures/pa/06-1.txt to 06-8.txt. Output is shortened where the slides say so. Verification: docs/training/privileged-access/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
