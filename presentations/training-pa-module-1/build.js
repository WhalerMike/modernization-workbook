// Privileged Access learning path, Module 1: Inventory every privileged assignment — the module's narrated deck.
// Teaches docs/training/privileged-access/01-privileged-inventory.md, Learn-style: objectives, the concepts, "Try it"
// slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/privileged-access),
// Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module
// page, the learning path's verification log, or the kit (examples/privileged-access); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pa-module-1/build.js \
//                      presentations/training-pa-module-1/Training_PA_Module_1.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 1: Inventory every privileged assignment",
  footer: "Federal Modernization Workbook  ·  Privileged Access learning path, Module 1: Inventory every privileged assignment",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Privileged Access learning path — Module 1: Inventory every privileged assignment";
const OUT = process.argv[2] || "Training_PA_Module_1.pptx";
const M = "Training, Privileged Access, Module 1";

// The title slide, as shared.js draws it, with this path's name over the units.
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
  const s = title(SI, "Module 1: Inventory every privileged assignment", "Privileged Access learning path · Plan Phase 0 (A0.1, A0.2, Gate 0), with workbook Chapter 01",
    ["What the inventory has to hold  ·  What Learn's sample misses  ·  The reader and the rows", "The findings  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence for Gate 0"]);
  notes(s,
`Welcome to Module 1 of the Privileged Access learning path: inventory every privileged assignment. Privilege should be just-in-time, by tier, and provable. This path teaches you to build the software that gets an estate there, in eight modules, one for each chapter of the developer workbook, Building Privileged Access. This one serves Phase 0 of the project plan, tasks A0.1 and A0.2, and Gate 0, with Chapter 01 of the workbook. In it you run Microsoft Learn's own samples to see what they miss, then run the workbook's inventory: one read of every privileged assignment, a tier for every row, findings for standing privilege, and a manifest that says which calls produced the files. The code runs on your laptop against a fictional tenant. It's illustrative: tested against fixtures, not run against a production tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why an active-only list stops being an inventory");
  tag(s, "Why");
  const l = panel(s, "List", 0.6, 1.45, 6.6, null, HEX.red, HEX.redTint, "BEFORE JUST-IN-TIME", "You have to be able to list it", [
    "Who holds which role, at which scope",
    "Standing or eligible",
    "Directly or through a group",
    "And in which tier",
  ], 14);
  const r = panel(s, "Shrinks", 7.45, 1.45, 5.3, null, HEX.amber, HEX.amberTint, "THE ADMIN CENTER'S LIST", "Active assignments aren't enough", [
    "Under PIM almost every human holder becomes eligible",
    "So an active-only list shrinks as the project succeeds",
  ], 14);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaListCheck", HEX.red, "This module: ",
    "one read of every privileged assignment, a tier for every row, findings for standing privilege, and a manifest of the calls behind the files.");
  sources(s, "Sources: Module 1, \"Introduction.\"");
  notes(s,
`Why start here? Because you can't make privilege just-in-time until you can list it: who holds which role, at which scope, standing or eligible, directly or through a group, and in which tier. The admin center's list of active assignments isn't enough. Under PIM almost every human holder becomes eligible, so a list of active assignments shrinks as the project succeeds, and it stops being an inventory just when you need one. In this module you build the inventory the rest of the path depends on: one read of every privileged assignment, a tier for every row, findings for standing privilege, and a manifest that says which calls produced the files.`,
  `${M} — Unit "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Name the four ways a role reaches a person, and why the inventory reads eligible as well as active",
    "Explain what Learn's sample for listing role assignments leaves out",
    "Run the inventory and read its findings, PA-INV-01 to PA-INV-09",
    "Explain why the tier comes from the program, not from Microsoft",
    "Say what the reader refuses, and why",
  ], [
    "The path's prerequisites: Book 04, Ch 04; the plan's gates; Microsoft Automation Modules 1 and 2; PowerShell 7",
    "Lab 1: PowerShell 7.1+ with Pester 5, and a copy of the repository; no tenant",
    "Lab 2: a worldwide or GCC test tenant and test subscription, never production",
  ], 50);
  sources(s, "Sources: Module 1, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"Prerequisites,\" \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll name the four ways a role reaches a person, and explain why the inventory reads eligible assignments as well as active ones. You'll explain what Microsoft Learn's sample for listing role assignments leaves out. You'll run the inventory and read its findings, rules I N V oh one to oh nine. You'll explain why the tier comes from the program, not from Microsoft. And you'll say what the reader refuses, and why. Before you start, you need the path's prerequisites: the chapter on privileged tiers in Book 04, the plan's gates, Microsoft Automation Modules 1 and 2, and PowerShell 7. Lab 1 needs PowerShell 7.1 or later with Pester 5 and a copy of the repository, and no tenant. Lab 2 needs a worldwide or G C C test tenant with a test Azure subscription, never production.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "Prerequisites," "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 What it holds
{
  const s = content(SC, "Four kinds of assignment, a route, and a tier");
  tag(s, "What");
  const b = table(s, "Kinds", 1.45, [3.6, 8.55], ["Learn's four kinds", "What the inventory does with it"], [
    ["Permanent eligible", "Read, so the list doesn't shrink as holders move to eligible"],
    ["Permanent active", "Learn says keep zero, except the emergency access accounts"],
    ["Time-bound eligible", "Read, with its end date"],
    ["Time-bound active", "Read, with whether it was assigned or activated"],
  ], { fontSize: 13, limit: 3.9 });
  const l = panel(s, "Route", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "HOW A ROLE REACHES A PERSON", null, [
    "A role on a role-assignable group reaches every member",
    "The program assigns roles to PRV-<tier>-<role> groups, never to a person",
  ], 13);
  panel(s, "Tier", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "WHERE THE TIER COMES FROM", "config/tiers.json (design guidance)", [
    "Keyed by role template ID",
    "A role not in the file is Unclassified, never assumed safe",
  ], 13);
  sources(s, "Sources: Module 1, Unit 1; Microsoft Learn, \"Plan a Privileged Identity Management deployment\"; Book 04, Ch 04; config/tiers.json.");
  notes(s,
`Unit 1: what the inventory has to hold. Microsoft Learn's guide to planning a PIM deployment names four kinds of assignment: permanent eligible, permanent active, time-bound eligible and time-bound active. And it says to keep zero permanently active assignments, except the emergency access accounts. So the inventory reads all four, eligible as well as active. Next, the route. A role assigned to a role-assignable group reaches every member of that group. The program's design assigns roles to groups named P R V, then the tier, then the role, and never to a person. Then the tier. It comes from the program's own file, tiers dot json, keyed by the role's template I D, which is the same in every tenant. A role that isn't in the file is reported as unclassified, never assumed safe. That file is this workbook's design guidance: the agency replaces it with its approved tier model.`,
  `${M} — Unit 1 "What the inventory has to hold": Book 04, Chapter 04 — "How a role reaches a person"; examples/privileged-access/config/tiers.json.`);
}

// ================================================================== 5 Learn's sample
{
  const s = content(SC, "What Learn's sample for role assignments leaves out");
  tag(s, "What");
  const b = table(s, "Gap", 1.45, [5.6, 6.55], ["Learn's sample, run as published", "What the inventory does instead"], [
    ["Sees no eligible assignment", "Reads the eligibility schedules too"],
    ["Returns a role-assignable group as one principal", "Expands the group once, marks each member row Via Group"],
    ["Resolves no names and assigns no tier", "Names every row and gives it a tier"],
    ["Passes neither -All nor -PageSize", "Follows every page"],
    ["Reads transitive assignments from beta, on a hard-coded host", "Sends only to the named cloud's own host"],
    ["Reads no Azure role assignments", "Reads Azure schedules for each scope you name"],
  ], { fontSize: 12.5, limit: 5.4 });
  callout(s, "Most", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "The most important row: ",
    "the sample sees no eligible assignment, the state the project moves every human holder into.");
  sources(s, "Sources: Module 1, Unit 1; Microsoft Learn, \"List Microsoft Entra role assignments\"; tests/MicrosoftSamples.Tests.ps1 (Chapter 01).");
  notes(s,
`Microsoft Learn's page on listing Microsoft Entra role assignments has a sample, and the kit runs it as published against a stand-in, so you can see exactly what it misses. The most important gap: it sees no eligible assignment. That's the state the project moves every human holder into, so an inventory built on it gets emptier as the work succeeds. It also returns a role-assignable group as one principal and never reads its members. It resolves no names and assigns no tier. It passes neither the All nor the page size option, so it doesn't follow every page. It reads transitive assignments from the beta endpoint, on a hard-coded host. And it reads no Azure role assignments at all. The workbook's inventory closes each of those gaps, and Lab 1's first step shows the eligible gap with your own eyes.`,
  `${M} — Unit 1, "What it leaves to you"; examples/privileged-access/tests/MicrosoftSamples.Tests.ps1, Chapter 01.`);
}

// ================================================================== 6 Reader and rows
{
  const s = content(SC, "The reader and the rows");
  tag(s, "What");
  const l = panel(s, "Reader", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE READER", "Only what's declared", [
    "Only calls declared in config/calls.json, each with its permission",
    "GET only; any other method throws",
    "One host: the named cloud's Graph or Resource Manager",
    "Every page, following the next link",
  ], 13);
  const r = panel(s, "Rows", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE ROWS", "One row per assignment", [
    "Plane, role, tier and scope",
    "State: active or eligible, assigned or activated",
    "Route: Direct, or Via Group with the group's ID",
    "Group members read once, and counted as holders",
  ], 13);
  callout(s, "Basic", Math.max(l, r) + 0.3, 0.95, "FaUserShield", HEX.navy, "Why User.ReadBasic.All too: ",
    "without it a group member comes back with an ID and type only, and the review sees an unnamed holder (PA-INV-09).");
  sources(s, "Sources: Module 1, Unit 2 (\"The reader,\" \"The rows\"); examples/privileged-access: PrivilegedAccess.psm1, config/calls.json.");
  notes(s,
`Unit 2: the reader, the rows and the findings. The reader sends only the calls declared in the kit's call list, each with its least-privileged permission. It sends GET only; any other method throws. It sends to one host, the named cloud's own Graph or Resource Manager endpoint, and it follows every page. Note why it asks for User dot Read Basic dot All as well as Group Member dot Read Basic dot All. Without it, a group's member comes back with an I D and a type only, and the review sees an unnamed holder; that's rule I N V oh nine. The rows: one row per assignment, with its plane, role, tier and scope, its state, and its route, direct or through a group. When a role is on a group, the reader reads the group's members once, and each member gets its own row marked Via Group.`,
  `${M} — Unit 2 "The reader, the rows and the findings": "The reader," "The rows"; examples/privileged-access/powershell/PrivilegedAccess/PrivilegedAccess.psm1; config/calls.json.`);
}

// ================================================================== 7 Findings
{
  const s = content(SC, "The findings: PA-INV-01 to PA-INV-09");
  tag(s, "What");
  const b = table(s, "INV", 1.45, [1.5, 1.2, 9.45], ["Rule", "Severity", "What it catches"], [
    ["PA-INV-01", "Finding", "Standing active Tier 0 or Tier 1 outside the documented exceptions (Info when an owned exception covers it)"],
    ["PA-INV-02", "Warn", "An Entra role assigned straight to a user, not through a PRV group"],
    ["PA-INV-03", "Warn", "A group that holds a role but isn't named PRV-<tier>-..., or names the wrong tier"],
    ["PA-INV-04", "Finding", "Five or more Global Administrators (Learn: fewer than five), or fewer than two users"],
    ["PA-INV-05", "Warn", "A role with no tier: classify it before it's treated as safe"],
    ["PA-INV-06", "Warn", "Eligibility that never expires"],
    ["PA-INV-07", "Finding", "User Access Administrator at root scope, which is what elevate access grants"],
    ["PA-INV-08", "Finding", "More than three Owners on a subscription (Learn's best practice: at most three)"],
    ["PA-INV-09", "Warn", "Group members whose names the run couldn't read"],
  ], { fontSize: 12, limit: 6.0 });
  line(s, "Learn", "Two thresholds are Learn's: Global Administrators and subscription Owners. The rest are the program's.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, Unit 2; Microsoft Learn, \"Best practices for Microsoft Entra roles,\" \"Best practices for Azure RBAC\"; CISA ScubaGear MS.AAD.7.1v1; PrivilegedAccess.psm1.");
  notes(s,
`The findings, I N V oh one to oh nine. Oh one is the big one: standing active privilege in Tier 0 or Tier 1 outside the documented exceptions. An exception counts only if it has an owner, and then the row is Info. Oh two is a role assigned straight to a user, not through a P R V group. Oh three is a group that holds a role but isn't named for its tier. Oh four counts Global Administrators: five or more is a finding, because Microsoft Learn's best practices for Entra roles advise fewer than five, and so is fewer than two users, the floor in CISA's ScubaGear baseline, M S A A D seven point one, version one. Oh five is a role with no tier. Oh six is eligibility that never expires. Oh seven is User Access Administrator at root scope, which is what elevate access grants. Oh eight is more than three Owners on a subscription, against Microsoft Learn's Azure R B A C best practice of at most three. And oh nine is a group member whose name the run couldn't read. Those thresholds come from Microsoft Learn and CISA; the other rules are the kit's own design.`,
  `${M} — Unit 2, "The findings"; examples/privileged-access/powershell/PrivilegedAccess/PrivilegedAccess.psm1, Test-PaInventory.`);
}
endModule(SC);

// ================================================================== 8 Try it: samples and permissions
{
  const s = content(SL, "Try it: Learn's samples, and five read permissions");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 8.0, [
    "# Lab 1, steps 1 and 2, in examples/privileged-access",
    "PS> Invoke-Pester -Path tests/MicrosoftSamples.Tests.ps1 `",
    "      -FullNameFilter '*Chapter 01*' -Output None -PassThru |",
    "      Select-Object PassedCount, FailedCount, NotRunCount",
    "PassedCount FailedCount NotRunCount",
    "----------- ----------- -----------",
    "          9           0           7",
    "",
    "PS> Import-Module ./powershell/PrivilegedAccess/PrivilegedAccess.psm1",
    "PS> (Get-PaRequiredPermission -Task inventory).GraphPermissions -join ', '",
    "GroupMember.ReadBasic.All, RoleAssignmentSchedule.Read.Directory,",
    "RoleEligibilitySchedule.Read.Directory, RoleManagement.Read.Directory,",
    "User.ReadBasic.All",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 11 });
  panel(s, "Read", 8.85, 1.45, 3.9, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "9 passed; the 7 not run are Chapter 02's",
    "One test shows the eligible-only holders never appear",
    "Five permissions",
    "Nothing ends in ReadWrite",
  ], 13);
  line(s, "Note", "Long lines are wrapped to fit; type the commands as the module page writes them.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 1 and 2; examples/privileged-access: tests/MicrosoftSamples.Tests.ps1, config/calls.json.");
  notes(s,
`Try it. Lab 1 runs in the privileged-access folder of the examples, in one PowerShell 7 session, against a fictional tenant served by a fake. Nothing signs in, and nothing leaves the machine. Step one runs Microsoft Learn's samples against the stand-ins, with Pester. Nine pass, none fail, and seven don't run: those seven are Chapter 02's, for the next module. The second test is the one to notice. It shows that the fixture's eligible-only holders never appear in the sample's output. Step two loads the module and lists the permissions the inventory needs. There are five: Group Member, Role Assignment Schedule, Role Eligibility Schedule and Role Management, each to read, and User dot Read Basic dot All. Nothing ends in ReadWrite. The output on the slide is wrapped to fit.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 9 Try it: run
{
  const s = content(SL, "Try it: run the inventory against the fictional tenant");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Lab 1, step 3",
    "PS> ./Invoke-PaInventory.ps1 -FixturePath tests/fixtures/tenant.json -OutputPath out/inventory `",
    "      -AzureScope /subscriptions/11111111-1111-4111-8111-111111111111,",
    "        /providers/Microsoft.Management/managementGroups/contoso-root,",
    "        /subscriptions/22222222-2222-4222-8222-222222222222 `",
    "      -ExceptionsPath tests/fixtures/inputs/exceptions.csv -ControlPlaneSubscriptionId 22222222-2222-4222-8222-222222222222",
    "Assignments: 30 rows (Azure T0=4, Azure T1=5, Azure T2=1, Entra T0=8, Entra T1=2, Entra T2=2, Entra Unclassified=1)",
    "Findings: 10 Finding, 7 Warn, 1 Info",
    "Written to out/inventory (manifest.json lists every request and file hash)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (THE -AzureScope LIST WRAPPED)", pt: 11 });
  const b = table(s, "Read", c + 0.25, [3.0, 9.15], ["Read it", "What the run printed"], [
    ["30 rows", "Entra and Azure, each with a tier; one Entra role is Unclassified"],
    ["18 findings", "10 Finding, 7 Warn and 1 Info"],
    ["The manifest", "Every request and the SHA-256 of each file"],
  ], { fontSize: 13, limit: 6.1 });
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" step 3; examples/privileged-access: Invoke-PaInventory.ps1, tests/fixtures/tenant.json (fictional).");
  notes(s,
`Step three runs the inventory against the fictional tenant. You give it the fixture, an output folder, three Azure scopes, two subscriptions and the root management group, the exceptions list, and the control-plane subscription. It reads thirty rows. In Azure, four are Tier 0, five Tier 1 and one Tier 2. In Entra, eight are Tier 0, two Tier 1, two Tier 2, and one is unclassified: a role that isn't in the tier file, reported rather than assumed safe. The run raises ten findings, seven warnings and one information item. And it writes everything to the output folder, with a manifest that lists every request it sent and the hash of every file it wrote, so a reviewer can check later which calls produced the evidence. The scope list on the slide is wrapped to fit.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 3.`);
}

// ================================================================== 10 Try it: findings
{
  const s = content(SL, "Try it: read the ten findings");
  tag(s, "How");
  const c = code(s, "Find", 0.6, 1.45, 7.6, [
    "# Lab 1, step 4",
    "PS> Get-Content out/inventory/findings.json -Raw |",
    "      ConvertFrom-Json | Where-Object Severity -eq 'Finding' |",
    "      Format-Table Rule, Object",
    "Rule      Object",
    "----      ------",
    "PA-INV-01 alex.kim@contoso.example",
    "PA-INV-01 Contoso-Mail-Automation",
    "PA-INV-01 a0000000-0000-4000-8000-000000000007",
    "PA-INV-01 a0000000-0000-4000-8000-000000000014",
    "PA-INV-01 a0000000-0000-4000-8000-000000000010",
    "PA-INV-01 a0000000-0000-4000-8000-000000000001",
    "PA-INV-07 a0000000-0000-4000-8000-000000000001",
    "PA-INV-01 5e000000-0000-4000-8000-000000000002",
    "PA-INV-04 Global Administrator",
    "PA-INV-08 /subscriptions/11111111-1111-4111-8111-111111111111",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 10.5 });
  panel(s, "Read", 8.45, 1.45, 4.3, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "Seven PA-INV-01: standing Tier 0 or Tier 1",
    "PA-INV-07: User Access Administrator at root",
    "PA-INV-04: too many Global Administrators",
    "PA-INV-08: too many subscription Owners",
    "Azure rows show object IDs: Resource Manager returns IDs, not names",
  ], 12.5);
  line(s, "EA", "The emergency account ea01 isn't here: it's Info, because the exceptions list names it with an owner.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" step 4; examples/privileged-access/tests/fixtures (fictional identities).");
  notes(s,
`Step four prints the ten findings. Seven are I N V oh one, standing privilege in Tier 0 or Tier 1 outside the exceptions: a person, alex dot kim, an automation account, and several Azure holders. The Azure rows show object I D's, because Resource Manager returns I D's, not names. One holder also has I N V oh seven, User Access Administrator at root scope, the elevated access that reaches every subscription and management group. There's I N V oh four, too many Global Administrators, and I N V oh eight, too many Owners on one subscription. Notice who's missing: the emergency account, E A oh one. It's Info, not a finding, because the exceptions list names it, and the exception has an owner. An exception with no owner wouldn't count.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 4.`);
}

// ================================================================== 11 Try it: refuse and tests
{
  const s = content(SL, "Try it: see the reader refuse, then run the tests");
  tag(s, "How");
  const c = code(s, "Refuse", 0.6, 1.45, 12.15, [
    "# Lab 1, step 5",
    "PS> $r = New-PaReader -Cloud gcc -Task inventory -Invoke (New-PaFixtureInvoker -Path tests/fixtures/tenant.json).Invoke",
    "PS> Invoke-PaList -Reader $r -CallId ca-policies",
    "Exception: Undeclared call 'ca-policies' for task 'inventory'; add it to config/calls.json with its permission.",
    "PS> Get-PaCloud GCCHigh",
    "Exception: Unknown cloud 'GCCHigh'. Use global, gcc, gcchigh or dod.",
    "",
    "# Step 6: run the tests, then delete out",
    "PS> Invoke-Pester -Path tests",
    "Tests Passed: 330, Failed: 0, Skipped: 0, Inconclusive: 0, NotRun: 0",
    "PS> Remove-Item -Recurse -Force out",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (PESTER'S SUMMARY ON ONE LINE)", pt: 11 });
  const l = panel(s, "Refuse", 0.6, c + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "TWO REFUSALS", null, [
    "A call the inventory task doesn't declare",
    "A cloud name it doesn't know: there is no default cloud",
  ], 13);
  panel(s, "Out", 6.85, c + 0.25, 5.9, null, HEX.red, HEX.redTint, "DELETE out", null, [
    "It names the fixture's privileged holders",
  ], 13);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 5 and 6; examples/privileged-access/powershell/PrivilegedAccess/PrivilegedAccess.psm1.");
  notes(s,
`Step five shows the reader refusing. You build a reader for the inventory task in G C C, on the fake, and ask it for the Conditional Access policies. That call isn't declared for the inventory task, so it throws, and tells you to add it to the call list with its permission. Then you ask for a cloud called G C C High, with capital letters. The names are case-sensitive on purpose, so that's an unknown cloud, and it throws too: use global, G C C, G C C High or D O D. There's no default cloud. Step six runs the whole test suite, three hundred thirty tests, and all pass. Then delete the output folder, because it names the fixture's privileged holders. Pester prints its summary on several lines; the slide shows it on one.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 and 6.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: inventory your own test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant with a test Azure subscription, never production, with fictional people"],
    ["Register", "A reader app with a certificate"],
    ["Permissions", "The five Graph application permissions from step 2, with admin consent; Reader on the test subscription"],
    ["Run and check", "Run the inventory, cross-check it against the admin center's download, and check the two things the fixture assumed"],
    ["Back it out", "Remove the Reader assignment, the five permissions, the app and its certificate; delete out/inventory-test"],
  ], { fontSize: 13, limit: 5.0 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the run only reads. Follow the workbook's Lab 2, which gives every step as a command or a portal path.");
  sources(s, "Sources: Module 1, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 runs the inventory against your own test tenant, in the worldwide or G C C cloud, with a test Azure subscription, never production, and with fictional people. The run only reads. You register a reader app with a certificate, and grant it the five Graph application permissions from step two, with admin consent, and Reader on the test subscription. Then you run the inventory, cross-check it against the admin center's download, and check the two things the fixture assumed. To back it out, remove the Reader assignment, the five permissions, the app registration and its certificate, and delete the test output folder, which names the tenant's privileged holders. The path's authors haven't run Lab 2; the workbook's Lab 2 gives every step.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate 0");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.6, 2.6, 4.95], ["Requirement", "KSI", "Evidence"], [
    ["AC-2 and AC-6(5): every privileged assignment with a tier", "KSI-IAM-JIT", "inventory.json and inventory.csv"],
    ["AC-6, AC-6(5); MS.AAD.7.4v1: no standing Tier 0 or 1 outside an owned exception", "KSI-IAM-JIT, KSI-IAM-ELP", "PA-INV-01 and PA-INV-07 in findings.json"],
    ["AC-6: least privilege for the identity that reads", "KSI-IAM-ELP", "Five read permissions; the two refusals"],
    ["AU-9: protection of audit information", "KSI-MLA-OSM", "manifest.json: every request, each file's SHA-256"],
    ["CM-3(2): testing and validation of changes", "KSI-CMT-VTD", "The repository's test runs"],
  ], { fontSize: 11.5, limit: 4.9 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers: the agency lines its evidence up with them; it doesn't report them.", b + 0.15, 0.45, 12.5);
  panel(s, "Keep", 0.6, b + 0.7, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS FOR GATE 0", null, [
    "inventory.json and inventory.csv, in the access-controlled evidence store, because they name people; findings.json; manifest.json beside the files",
  ], 12.5);
  sources(s, "Sources: Module 1, \"Introduction,\" \"Summary\"; NIST SP 800-53 Rev. 5; CISA BOD 25-01 (MS.AAD.7.4v1); FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. The inventory is the evidence for the plan's Gate 0: standing administrative privilege inventoried and classified by tier. It supports NIST special publication eight hundred fifty-three A C two, account management, and A C six, enhancement five, privileged accounts restricted to defined roles. And it supports CISA's B O D twenty-five oh-one and the ScubaGear baseline M S A A D seven point four, version one: no permanent active assignment to a highly privileged role, with the emergency access accounts as the exception. The table pairs each with a KSI and an evidence file. KSIs are FedRAMP's twenty X Key Security Indicators for cloud service providers; the agency lines its evidence up with what its providers report, and doesn't report KSIs itself. The evidence an ISSO keeps for Gate 0: the inventory files, in the access-controlled evidence store, because they name people; the findings; and the manifest, beside the files it lists.`,
  `${M} — Unit "Introduction" (the federal requirement); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on the inventory", [
    { q: "Why doesn't the inventory use Learn's all-roles sample as its read?", options: ["a. The sample uses the beta endpoint for every call", "b. It sees no eligible assignment, the state the project moves every human holder into", "c. The sample needs a write permission"] },
    { q: "Why is the emergency account ea01 reported as Info, not as a PA-INV-01 Finding?", options: ["a. Emergency accounts are never read", "b. It holds an eligible assignment", "c. It's on exceptions.csv with an owner; an exception with no owner doesn't count"] },
  ], "1 b: under PIM almost every human holder is eligible, so an active-only list stops being an inventory. 2 c: PA-INV-01, and Lab 1, step 4.");
  sources(s, "Sources: Module 1, \"Knowledge check,\" questions 1 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: why doesn't the inventory use Microsoft Learn's all-roles sample as its read? The answer is b: the sample sees no eligible assignment, and that's the state the project moves every human holder into. Under PIM almost every human holder is eligible, so an active-only list stops being an inventory. Second: why is the emergency account, E A oh one, reported as Info, not as an I N V oh one finding? The answer is c: it's on the exceptions list with an owner. An exception with no owner doesn't count. You saw that in Lab 1, step four. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 2, emergency access first");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Ran Learn's samples and saw them miss every eligible holder",
    "Read 30 assignments from a fictional tenant, each with a tier",
    "Found standing privilege, too many Global Administrators and too many subscription Owners",
    "Saw the reader refuse an undeclared call and an unknown cloud",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2: Emergency access first", [
    "The one step that can't move",
    "Check each emergency account against Learn's standard",
    "Build the alert on their use",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaUserShield", HEX.teal, "Carry forward: ",
    "ea01 was Info only because the exceptions list names it. Module 2 checks that the exception is what it claims to be.");
  sources(s, "Sources: Module 1, \"Summary\"; Module 2, \"Introduction.\"");
  notes(s,
`To sum up. You ran Microsoft Learn's samples and saw them miss every eligible holder. Then you read thirty assignments from a fictional tenant, each with a tier, and found standing privilege, too many Global Administrators and too many subscription Owners. And you saw the reader refuse an undeclared call and an unknown cloud. Carry one thing forward: the emergency account was Info only because the exceptions list names it. Next is Module 2: emergency access first. It's the one step in this project that can't move, because approval switched on before the emergency accounts exist is the sequence that locks the agency out. In Module 2 you check each emergency account against Microsoft Learn's standard, and build the alert that watches them between drills.`,
  `${M} — Unit "Summary"; Module 2 — "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/privileged-access/01-privileged-inventory.md (Privileged Access learning path, Module 1): Introduction and its requirement table, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design and rules: workbook Chapter 01, \"What the inventory has to hold,\" \"What it leaves to you,\" \"The reader,\" \"The rows,\" \"The findings,\" Lab 1 and Lab 2; Book 04, Chapter 04, \"How a role reaches a person\"; the project plan's Gate 0.",
  "Kit: examples/privileged-access (Invoke-PaInventory.ps1; powershell/PrivilegedAccess/PrivilegedAccess.psm1; config/calls.json; config/tiers.json; tests/MicrosoftSamples.Tests.ps1; tests/fixtures). Fictional identities. Illustrative: tested against fixtures and a fake, not run against a production tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7.6.9 and Pester 5.9.0 in a scratch copy of examples/, outside the repository; it matched data/kit-captures/pa/01-1.txt to 01-7.txt. Long lines are wrapped where the slides say so. Verification: docs/training/privileged-access/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
