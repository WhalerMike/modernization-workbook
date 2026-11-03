// Non-Person Identity learning path, Module 5: Cut the privilege of service principals — the module's narrated deck.
// Teaches docs/training/non-person-identity/05-least-privilege.md, Learn-style: objectives, the concepts, four "Try it"
// slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/non-person-identity,
// with examples/third_party and examples/drift-pipeline beside it), Lab 2, the federal requirement and evidence, a
// two-question check, and the summary. Every fact comes from the module page, the path's verification log, the
// guide's Step 4 and workbook Chapter 07 that the page sends the learner to, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-5/build.js \
//                      presentations/training-npi-module-5/Training_NPI_Module_5.pptx
const TITLE = "Module 5: Cut the privilege of service principals";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 5: Cut the privilege of service principals",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and labels the title slide for the Microsoft Automation path; this path's title slide
// and document title are set here.
P.D.pres.title = `Non-Person Identity learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "NON-PERSON IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_NPI_Module_5.pptx";
const M = "Training, Non-Person Identity, Module 5";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 5: Cut the privilege of service principals", "Non-Person Identity learning path · Gate G4 Least privilege, with workbook Chapter 07",
    ["What Step 4 asks for  ·  The rule the code holds  ·  The check  ·  The hand-off and the review", "The plan and the write path  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 5 of the Non-Person Identity learning path: cut the privilege of service principals. This module is the first half of Gate 4, Least privilege, with Chapter 7 of the developer workbook. You'll sweep every service principal for what it holds: its application permissions, its delegated grants, its directory roles, and a managed identity's Azure roles. You'll flag the broad grants that have no current exception, hand the privileged service principals to the Privileged Access plan, and build the quarterly owner review. Then you'll turn the owners' decisions into a plan, and apply it only after a second person approves its hash. The code runs on your laptop against a fictional estate. It's illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a workload's privilege needs cutting first");
  tag(s, "Why");
  const l = panel(s, "Fast", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "A WORKLOAD ISN'T A PERSON", "Faster, and wider", [
    "A workload can use its access faster and more widely than any person",
    "An application permission gives an app everything its scope allows, across the tenant",
  ], 13.5);
  const r = panel(s, "Stays", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "GRANTED \"TO MAKE IT WORK\"", "It stays", [
    "A permission like Directory.ReadWrite.All granted to make it work stays until someone takes it away",
  ], 13.5);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaShieldHalved", HEX.red, "This module: ",
    "nothing is removed until a second person approves the plan's SHA-256, and the code removes a grant, never an app.");
  sources(s, "Sources: Module 5, \"Introduction\"; the guide, Step 4.");
  notes(s,
`Why does privilege need cutting? Because a workload can use its access faster and more widely than any person. An application permission gives an app everything its scope allows, across the whole tenant. And a permission like Directory dot ReadWrite dot All, granted to make it work, stays until someone takes it away. In this module you find those grants and take them away safely. You sweep every service principal, flag the broad grants without a current exception, and ask the owners. Two rules hold the whole time. Nothing is removed until a second person approves the plan's hash. And the code removes a grant, never an app.`,
  `${M} — Unit "Introduction"; the guide — Step 4.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 5", [
    "Explain an application permission versus a delegated grant, and why the type matters more than the name",
    "Name what makes a grant broad, and what a recorded exception must hold",
    "Say which service principals go to the Privileged Access plan, and why this chapter doesn't sweep them",
    "Run the sweep, read the review and the plan, and see the write path refuse a plan nobody approved",
  ], [
    "Module 1: the sweep reads its register and checks it against its manifest",
    "Module 2: the review goes to the owners it checks",
    "Microsoft Automation, Module 1: permissions",
    "Lab 1: PowerShell 7.1+ with Pester 5; no tenant",
  ], 60);
  sources(s, "Sources: Module 5, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty minutes with the lab. You'll explain the difference between an application permission and a delegated grant, and why the type matters more than the name. You'll name what makes a grant broad, and what a recorded exception must hold. You'll say which service principals go to the Privileged Access plan, and why this chapter doesn't sweep them. And you'll run the sweep, read the owner review and the plan, and watch the write path refuse a plan nobody approved. Before you start, finish Module 1, because the sweep reads its register, and Module 2, because the review goes to the owners it checks. Lab 1 needs PowerShell 7.1 or later with Pester 5, and no tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 What the gate asks for
{
  const s = content(SC, "What Step 4 asks for: Graph, directory roles, Azure");
  tag(s, "What");
  const b = table(s, "Steps", 1.45, [1.0, 3.2, 7.95], ["Step", "Where", "What the guide asks"], [
    ["4a", "Graph permissions", "Prefer delegated where a user is present: it gives the intersection of the user's rights and the scope. Judge by type, not name: Mail.ReadWrite and Mail.Send are critical as application permissions"],
    ["4a", "Unused grants", "Removing a permission from the app registration doesn't revoke an existing grant; tokens already issued stay valid for their lifetime"],
    ["4b", "Directory roles", "No standing privileged role without a justification; privileged service principals are control-plane (Tier 0) assets"],
    ["4c", "Azure RBAC", "Scope each managed identity's role to the resource it uses, never Owner or Contributor at a subscription or management group"],
  ], { fontSize: 12, limit: 5.2 });
  line(s, "Next", "Sub-steps 4d and 4e, attributes and Conditional Access for workload identities, are Module 6's.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, Unit 1; the guide, Step 4; Microsoft Learn: Graph permissions reference, Delete oAuth2PermissionGrant, Privileged roles, Azure RBAC best practices.");
  notes(s,
`Unit 1 is the guide's Step 4, sub-steps four a to four c. Four a is Graph permissions. Microsoft Learn's guidance is to prefer delegated access where a user is present, because a delegated grant gives the app only the intersection of the user's rights and the scope. And judge each grant by its type, not its name: the Microsoft Graph permissions reference shows Mail dot ReadWrite and Mail dot Send as application permissions, with the same names as their delegated versions, and the program rates them critical. Learn also says removing a permission from the app registration doesn't revoke an existing grant, and that tokens already issued stay valid for their lifetime. Four b is directory roles. Microsoft Learn's page on privileged roles calls a service principal with a highly privileged role a control-plane asset. Four c is Azure: Microsoft's guidance is to scope a role to the resource it's used on. Four d and four e are Module 6's.`,
  `${M} — Unit 1 "What the gate asks for"; the guide — Step 4, 4a to 4c; "Dangers."`);
}

// ================================================================== 5 The rule the code holds
{
  const s = content(SC, "The rule the code holds: review, justify, narrow");
  tag(s, "What");
  const b = table(s, "Rule", 1.45, [4.0, 8.15], ["Rule (design guidance)", "What it means"], [
    ["Owners review every grant", "Every quarter; the review closes with its findings acted on"],
    ["No broad permission without a justification", "An exception names a justification, an approver, an approval date and an end date"],
    ["Learn's narrower replacement", "Where Learn documents one, such as Sites.Selected or RBAC for Applications in Exchange Online"],
    ["Managed identities' Azure roles at the resource", "A role at a subscription or management group reaches everything under it"],
    ["Privileged service principals are handed off", "Directory roles and escalation permissions go to the Privileged Access plan"],
  ], { fontSize: 12.5, limit: 4.9 });
  callout(s, "Grant", b + 0.3, 0.95, "FaShieldHalved", HEX.red, "Remove the grant, never the app: ",
    "a write removes one app role assignment, through the resource service principal, or narrows one delegated grant.");
  sources(s, "Sources: Module 5, Unit 2; workbook Chapter 07, \"The rule the code holds\"; Microsoft Learn: Selected permissions; RBAC for Applications in Exchange Online.");
  notes(s,
`Unit 2 starts with the rule the code holds, which is the program's, so it's design guidance. Owners review every grant every quarter, and the review closes only when its findings are acted on. No broad permission stands without a recorded exception, which names a justification, an approver, an approval date and an end date. Where Microsoft Learn documents a narrower replacement, such as Selected permissions in SharePoint, or role-based access control for applications in Exchange Online, that's the target. A managed identity's Azure roles belong at the resource, because, as Microsoft Learn's Azure role assignment steps say, a role at a subscription or management group reaches everything under it. Privileged service principals are handed to the Privileged Access plan. And the code removes a grant, never the app: one app role assignment through the resource, or one delegated grant narrowed.`,
  `${M} — Unit 2 "The sweep and the rule": workbook Chapter 07, "The rule the code holds."`);
}

// ================================================================== 6 The check
{
  const s = content(SC, "The check: NPI-LP-01 to NPI-LP-09");
  tag(s, "What");
  const b = table(s, "LP", 1.45, [1.7, 1.2, 9.25], ["Rule", "Severity", "What it flags"], [
    ["NPI-LP-01", "Finding", "A broad application permission with no recorded exception"],
    ["NPI-LP-02", "Finding", "An exception that ended, or names no justification, approver, approval date or end date"],
    ["NPI-LP-03", "Finding", "A broad delegated scope consented for all users, with no exception"],
    ["NPI-LP-04", "Finding", "A mail permission still granted in Entra whose exception names RBAC for Applications"],
    ["NPI-LP-05", "Warn", "Mail limited by an application access policy (legacy), or an exception with no mailbox control"],
    ["NPI-LP-06, 07", "Finding; Warn", "A managed identity's Azure role at subscription or wider; at resource group scope"],
    ["NPI-LP-08", "Info", "A privileged service principal handed to the Privileged Access plan"],
    ["NPI-LP-09", "Warn", "An app role the resource doesn't publish, so the permission can't be named"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "Sweep", "The sweep reads app role assignments on every resource, delegated grants, directory roles and Azure roles.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, Unit 2; workbook Chapter 07, \"The sweep,\" \"The check\"; Microsoft Learn: Graph permissions reference, Application Access Policies.");
  notes(s,
`The sweep reads every service principal in the register: its app role assignments on every resource, not just Graph, its delegated grants, its directory roles, and for a managed identity, its Azure roles. Then the check applies nine rules, N P L P oh one to oh nine. Most rest on Microsoft Learn's permission and role pages; the exception rules and the unnamed-role rule are the program's design guidance. Oh one: a broad application permission with no recorded exception. Oh two: an exception that ended, or that's missing a justification, an approver, an approval date or an end date. Oh three: a broad delegated scope consented for all users. Oh four is subtle: a mail permission still granted in Entra while its exception relies on Exchange's scoped access, so the scope does nothing. Oh five is mail limited by the legacy access policy. Oh six and oh seven grade a managed identity's Azure role by how wide its scope is. Oh eight hands a privileged app off. And oh nine is a role nobody can name.`,
  `${M} — Unit 2 "The sweep and the rule": workbook Chapter 07, "The sweep," "The check."`);
}

// ================================================================== 7 Hand-off and review
{
  const s = content(SC, "The hand-off, and the quarterly owner review");
  tag(s, "What");
  const l = panel(s, "Escalate", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "HANDED OFF WHOLE", "The four escalation permissions", [
    "AppRoleAssignment.ReadWrite.All and RoleManagement.ReadWrite.Directory can grant authorization",
    "Application.ReadWrite.All lets an app act as other entities",
    "DelegatedPermissionGrant.ReadWrite.All",
    "A holder, or a directory role, goes to pa-handoff.json, and gets no NPI-LP-01 here",
  ], 12.5);
  const r = panel(s, "Review", 6.85, 1.45, 5.9, null, HEX.navy, HEX.navyTint, "OWNER-REVIEW.CSV", "Only this quarter counts", [
    "One row per grant of every kept service principal, sent to its owners",
    "An earlier quarter's answer shows as LastDecision and doesn't count",
    "Closed when every row is decided this quarter, and no Remove or Narrow is still granted",
  ], 12.5);
  sources(s, "Sources: Module 5, Unit 2; Chapter 07, \"The check,\" \"The quarterly owner review\"; Microsoft Learn: Graph permissions reference; Grant or revoke API permissions.");
  notes(s,
`Two pieces sit between the check and the plan. First, the hand-off. Four escalation permissions let an app grant itself more or act as others. The Microsoft Graph permissions reference cautions that app role assignment read-write and role management read-write can grant authorization, and that application read-write lets an app act as other entities. And Microsoft Learn's guide to granting permissions says only appropriate users should reach apps granted delegated permission grant read-write. Any service principal holding one, or holding a directory role, is handed off whole to the Privileged Access plan, with everything it holds listed. It gets no finding here, so two plans never disagree about it. Second, the quarterly owner review. It has one row per grant of every service principal that stays here, sent to its owners. Under the program's design guidance, only decisions dated this quarter count; an earlier answer shows as the last decision, and the row is open again. The review closes when every row is decided this quarter and nothing approved for removal is still granted.`,
  `${M} — Unit 2 "The sweep and the rule": workbook Chapter 07, "The check," "The quarterly owner review."`);
}

// ================================================================== 8 Plan and write path
{
  const s = content(SC, "The plan, and the separate write path");
  tag(s, "What");
  const b = table(s, "Plan", 1.45, [3.0, 7.75, 1.4], ["Action", "When", "Writes?"], [
    ["RemoveAppRole", "An owner decided Remove on an application permission, and any named replacement is already granted", "After review"],
    ["NarrowGrant", "An owner decided Narrow on a delegated grant, to a smaller, non-empty subset", "After review"],
    ["AwaitReplacement", "Remove names a replacement, such as Sites.Selected, not yet granted", "No"],
    ["AwaitOwnerDecision; Kept", "No decision this quarter; kept under a current exception", "No"],
    ["RescopeByOwner; HandedOff", "Re-scope an Azure role in reviewed infrastructure code; a privileged service principal", "No"],
  ], { fontSize: 12, limit: 4.7 });
  callout(s, "Write", b + 0.3, 1.2, "FaUserShield", HEX.navy, "The write path: ",
    "the approved SHA-256, this tenant and cloud, no more than seven days old, a re-read before each write, and a person with Privileged Role Administrator, never an unattended app.");
  sources(s, "Sources: Module 5, Unit 3; Chapter 07, \"The plan,\" \"The separate write path\"; Microsoft Learn: Delete appRoleAssignedTo; Update oAuth2PermissionGrant.");
  notes(s,
`Unit 3 is the plan and the write path. The plan has one action per broad grant and per decided change, and only two kinds ever write. Remove app role removes an application permission an owner decided to remove, but only once any named replacement is already granted. Narrow grant shrinks a delegated grant to a smaller set of scopes, never to nothing. Everything else is recorded and sends nothing: waiting for a replacement or a decision, kept under an exception, re-scoped by the owner in reviewed infrastructure code, or handed off. The write path is a separate script. It runs only the plan whose hash was approved, for this tenant and cloud, no more than seven days old. It re-reads each target before writing. And it runs as a person with Privileged Role Administrator, never an unattended app, because, as the Microsoft Graph permissions reference cautions, the write permissions can grant authorization themselves. The seven-day limit is the program's design guidance.`,
  `${M} — Unit 3 "The plan and the write path": workbook Chapter 07, "The plan," "The separate write path."`);
}
endModule(SC);

// ================================================================== 9 Try it: samples, permissions, sweep
{
  const s = content(SL, "Try it: Learn's script, the permissions, the sweep");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# First make Chapter 01's register (Module 1, step 3); then steps 1 to 3",
    "$ Invoke-Pester -Path tests/NpiLeastPrivilegeSamples.Tests.ps1 -Output None -PassThru | Select-Object PassedCount, FailedCount, NotRunCount",
    "         10           0           0",
    "$ foreach ($t in 'least-privilege', 'least-privilege-apply') { ... Get-NpiLpRequiredPermission -Task $t ... }",
    "least-privilege : Application.Read.All, Directory.Read.All, RoleManagement.Read.Directory, Reader",
    "least-privilege-apply : Application.Read.All, AppRoleAssignment.ReadWrite.All, DelegatedPermissionGrant.ReadWrite.All, Directory.Read.All",
    "$ ./Invoke-NpiLeastPrivilege.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/ch07/estate-ch07.json \\",
    "    -InputPath tests/fixtures/ch07/inputs -OutputPath out/least-privilege",
    "Sweep: 11 service principals, 20 grants (12 Application, 5 AzureRole, 3 Delegated); 2 skipped; 3 handed to the Privileged Access plan",
    "Findings: 7 Finding, 3 Warn, 3 Info",
    "Owner review 2026-Q4: 15 rows, 9 decided, 6 open, 4 changes pending; closed: False",
    "Plan: 11 actions, 3 of them writes (1 NarrowGrant, 2 RemoveAppRole); nothing sent",
    "Plan SHA-256: fca44f9f423c5c3590bf1b90b36e13a8cc9c4565dc0fdb30c9d6ef4ce1a1a0f8",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED; \"...\" MARKS CUTS)", pt: 10 });
  line(s, "Skip", "The two skipped are the agent identity and its blueprint, which are Module 9's. The sweep only reads; the write task is separate.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 1 to 3; examples/non-person-identity (NpiLeastPrivilege; tests/fixtures/ch07, fictional).");
  notes(s,
`Try it. Lab 1 runs in the non-person identity folder, in PowerShell 7, against a fictional estate. First make Chapter 1's register, as in Module 1, because the sweep reads it. Step one runs Learn's review script against the stand-ins: ten tests pass. Step two lists what each task needs. The sweep holds three Graph read permissions and Reader. The write task is separate, and it's the one with app role assignment and delegated grant read-write. Step three sweeps eleven service principals and twenty grants: twelve application permissions, five Azure roles and three delegated grants. Two are skipped, the agent identity and its blueprint, which are Module 9's, and three are handed to the Privileged Access plan. The owner review has fifteen rows, six still open, so it isn't closed. And the plan has eleven actions, three of them writes. Nothing is sent.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 3.`);
}

// ================================================================== 10 Try it: findings and hand-off
{
  const s = content(SL, "Try it: the findings and the hand-off");
  tag(s, "How");
  const c = code(s, "Find", 0.6, 1.45, 5.0, [
    "# Step 4 (Group-Object Rule)",
    "Name      Count",
    "----      -----",
    "NPI-LP-01     2",
    "NPI-LP-02     1",
    "NPI-LP-03     1",
    "NPI-LP-04     1",
    "NPI-LP-05     1",
    "NPI-LP-06     2",
    "NPI-LP-07     1",
    "NPI-LP-08     3",
    "NPI-LP-09     1",
  ], { label: "STEP 4, RUN NOVEMBER 3, 2026", pt: 11 });
  const c2 = code(s, "Hand", 5.85, 1.45, 6.9, [
    "# pa-handoff.json (Name, Reasons)",
    "Build Pipeline",
    "  RoleManagement.ReadWrite.Directory",
    "  (can grant itself more)",
    "Deploy Bot",
    "  directory role: Cloud Application Administrator;",
    "  Application.ReadWrite.All (can grant itself more)",
    "id-deploy",
    "  Contributor at subscription scope",
    "  (a privileged administrator role)",
  ], { label: "THE HAND-OFF (WRAPPED)", pt: 11 });
  line(s, "Read", "Seven Findings, three Warns, and three Infos: the three service principals handed to the Privileged Access plan.", Math.max(c, c2) + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" step 4; workbook Chapter 07, Lab 1; examples/non-person-identity/tests/fixtures/ch07 (fictional).");
  notes(s,
`Step four reads the findings by rule, and every rule shows up. Oh one twice: the Mail Automation app holds the broad directory write permission and mail read-write with no exception. Oh two: HR Connector's exception for full control of sites has ended. Oh three: Partner CRM reads mail for all users. Oh four and oh five are the two mail rules. Oh six twice and oh seven: a batch machine's managed identity holds Azure roles at the subscription, a management group, and a resource group. Oh nine: an app role the resource doesn't publish. And oh eight three times, the hand-off. Build Pipeline holds role management read-write, so it can grant itself more. Deploy Bot holds a directory role and application read-write. And id deploy is Contributor on a subscription. All three go to the Privileged Access plan whole.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 4; workbook Chapter 07 — "Lab 1: fixtures, no tenant."`);
}

// ================================================================== 11 Try it: review and plan
{
  const s = content(SL, "Try it: the open review rows, and the plan");
  tag(s, "How");
  const c = code(s, "Rev", 0.6, 1.45, 12.15, [
    "# Step 5: the open rows of owner-review.csv",
    "Name            Kind        Permission                                   Broad LastDecision",
    "Legacy Reports  Application unknown:a0000000-0000-4000-8000-0000000000ff False",
    "Mail Automation Application Mail.ReadWrite                               True",
    "vm-batch01      Application User.Read.All                                False Keep on 2026-07-15, an earlier quarter",
    "vm-batch01      AzureRole   Reader                                       False",
    "vm-batch01      AzureRole   Reader                                       True",
    "Mail Automation Delegated   User.Read                                    False",
    "# Step 6: the plan's actions, the three writes (8 more write nothing)",
    "RemoveAppRole      HR Connector     True",
    "RemoveAppRole      Mail Automation  True",
    "NarrowGrant        Partner CRM      True",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (STEP 6 TRIMMED TO ITS WRITES)", pt: 10.5 });
  line(s, "Safe", "HR Connector's Sites.FullControl.All can go because its replacement, Sites.Selected, is already granted.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 5 and 6; Knowledge check, answer 3; workbook Chapter 07, Lab 1.");
  notes(s,
`Step five reads the open rows of the owner review. There are six. One of them shows how the quarter works: the batch machine's User dot Read dot All was kept on July fifteenth, an earlier quarter. That answer doesn't count in the fourth quarter, so the row is open again, and the owner has to answer it. Step six reads the plan's eleven actions. Three write. Remove app role for HR Connector, whose full-control site permission can go because its replacement, selected sites, is already granted; a removal that names a replacement waits until it is. Remove app role for Mail Automation's broad directory permission. And narrow grant for Partner CRM's delegated grant. The other eight write nothing: three handed off, the kept ones, the rows awaiting a decision, and an Azure role for its owner to re-scope.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 and 6; "Check your answers," 3.`);
}

// ================================================================== 12 Try it: dry run, apply, refuse
{
  const s = content(SL, "Try it: a dry run, the apply, and a refusal");
  tag(s, "How");
  const c = code(s, "Dry", 0.6, 1.45, 12.15, [
    "# Step 7: dry-run with the approved hash",
    "$ $sha = (Get-FileHash out/least-privilege/lp-plan.json -Algorithm SHA256).Hash.ToLower()",
    "$ ./Invoke-NpiLeastPrivilegeAction.ps1 -Cloud gcc -PlanPath out/least-privilege/lp-plan.json -ApprovedSha256 $sha ...",
    "DryRun: 3 WouldSend",
    "  WouldSend RemoveAppRole DELETE .../servicePrincipals/5b000000-0000-4000-8000-000000000010/appRoleAssignedTo/ar-10",
    "  WouldSend RemoveAppRole DELETE .../servicePrincipals/5b000000-0000-4000-8000-000000000010/appRoleAssignedTo/ar-01",
    "  WouldSend NarrowGrant   PATCH  .../oauth2PermissionGrants/og-01",
    "# Step 8: -Apply, then a hash nobody approved",
    "Apply: 3 Sent",
    "The plan's SHA-256 is fca44f9f423c5c3590bf1b90b36e13a8cc9c4565dc0fdb30c9d6ef4ce1a1a0f8, not the approved",
    "  0000000000000000000000000000000000000000000000000000000000000000; refusing to run a plan nobody reviewed.",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Tests", "Both removals go through 5b000000-...-000000000010, Microsoft Graph's service principal: the resource, not the app.", c + 0.25, 0.45, 13.5);
  line(s, "Tests2", "Step 9: Invoke-Pester -Path tests prints 513 passed, 0 failed. Then Remove-Item -Recurse -Force out: the review names owners.", c + 0.75, 0.45, 13.5);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 7 to 9; Invoke-NpiLeastPrivilegeAction.ps1; Microsoft Learn, Delete appRoleAssignedTo.");
  notes(s,
`Step seven dry-runs the plan with its approved hash. It would send three requests. Two are deletes, and look where they go: through the service principal ending in one oh, which is Microsoft Graph's own service principal. The removal goes through the resource, not the app, the way Microsoft Learn's Delete app role assigned to reference says. The third is a patch that narrows one delegated grant. Step eight applies the plan to the fake, and three are sent. Then it tries a hash nobody approved, all zeros, and the write path refuses: the plan's hash isn't the approved one, so it won't run a plan nobody reviewed. Step nine runs every test: five hundred thirteen pass, none fail. Then delete the output folder. The owner review names owners, so don't leave it lying around.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 7 to 9.`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: one real removal in your test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant and a test subscription, never production; a test app registration and a test user-assigned managed identity"],
    ["Who", "A reading app with Application.Read.All, Directory.Read.All, RoleManagement.Read.Directory and Reader; a person with Privileged Role Administrator for the write"],
    ["Sweep and decide", "Grant the test app Directory.ReadWrite.All, sweep it, and record the owner's Remove decision"],
    ["Approve and apply", "A second person approves the plan's SHA-256; dry-run and apply it"],
    ["Confirm", "On the next sweep and in the audit log, the grant is gone"],
    ["Back it out", "Step 6: grant the removed permissions again with Learn's grant request; remove the test roles; delete the identity, the app and the out folders"],
  ], { fontSize: 12, limit: 5.4 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 07, Lab 2, which has the exact commands.");
  sources(s, "Sources: Module 5, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 makes one real removal in your own test tenant. You need a test tenant in the worldwide or G C C cloud and a test subscription, never production, with a test app registration and a test user-assigned managed identity. A reading app holds the three read permissions and Reader, and a person with Privileged Role Administrator does the write. Grant the test app the broad directory write permission on purpose, sweep it, and record the owner's remove decision. A second person approves the plan's hash. Then dry-run it and apply it, and confirm on the next sweep and in the audit log that the grant is gone. To back it out, step six grants the removed permissions again with Learn's grant request, removes the test identity's roles, and deletes the identity, the app and the output. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G4");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.4, 3.2, 5.55], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["AC-6 Least Privilege", "KSI-IAM-ELP, KSI-IAM-JIT", "sweep.json, identities.json, skipped.json; findings.json, NPI-LP-01 to -07 and -09"],
    ["AC-6(5) Privileged Accounts", "KSI-IAM-SNU, KSI-IAM-JIT", "pa-handoff.json; NPI-LP-08"],
    ["AC-6(7) Review of User Privileges", "KSI-IAM-AAM, KSI-IAM-JIT", "owner-review.csv, review-status.json"],
    ["CM-3; CM-5", "KSI-CMT-LMC, KSI-CMT-RVP", "lp-plan.json and its SHA-256; results.json and manifest.json"],
    ["AC-5 Separation of Duties", "KSI-IAM-JIT", "The plan's SHA-256, approved by a second person"],
    ["AU-9 and SI-7, the run's integrity", "KSI-MLA-OSM (AU-9); KSI-SVC-VRI (SI-7)", "manifest.json in each output folder"],
  ], { fontSize: 11.5, limit: 5.5 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.2, 0.45, 13);
  sources(s, "Sources: Module 5, \"Introduction\" (the federal requirement); the guide's \"Evidence\" section.");
  notes(s,
`The federal requirement. Gate 4 meets NIST special publication eight hundred fifty-three A C six, A C six enhancement five, and I A nine. The module's table maps each control to its evidence. For least privilege, it's the sweep and the findings. For privileged accounts, the hand-off file. For review of privileges, the owner review and its status. For change control, the plan and its hash, and the results and manifest from the dry run and the apply. For separation of duties, the plan's hash approved by a second person. And for the run's integrity, the manifest in each output folder. K S I's are FedRAMP twenty X indicators for cloud service providers. The agency lines its evidence up with what its providers report against them; it doesn't report K S I's itself. Which file supports which indicator is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); the guide — "Evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on least privilege", [
    { q: "Deploy Bot holds Application.ReadWrite.All and a directory role. What does the sweep do with it?", options: ["a. Raises NPI-LP-01 and plans a removal", "b. Hands it whole to the Privileged Access plan (NPI-LP-08), and leaves it out of the owner review", "c. Deletes the role assignment"] },
    { q: "Who sends the plan's writes in a live run?", options: ["a. An unattended app holding AppRoleAssignment.ReadWrite.All", "b. A person, signed in with Privileged Role Administrator, in a delegated session", "c. Any application owner"] },
  ], "1 b: a directory role or an escalation permission hands it off. 2 b: the write permissions can grant authorization themselves.");
  sources(s, "Sources: Module 5, \"Knowledge check,\" questions 2 and 4, and \"Check your answers\"; Microsoft Learn, Microsoft Graph permissions reference.");
  notes(s,
`Check yourself with two questions. First: Deploy Bot holds application read-write and a directory role. What does the sweep do with it? The answer is b. It hands it whole to the Privileged Access plan, as N P L P oh eight, and leaves it out of the owner review. A directory role or an escalation permission is enough to hand an identity off. Second: who sends the plan's writes in a live run? The answer is b: a person, signed in with Privileged Role Administrator, in a delegated session. The Microsoft Graph permissions reference cautions that the write permissions can grant authorization themselves, so they're never an unattended app's standing permission. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 4; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary, and next: Module 6, Conditional Access");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Swept 11 service principals and 20 grants",
    "Found the broad grants with no current exception",
    "Handed three privileged service principals to the Privileged Access plan",
    "Read the quarter's open review rows; applied three approved changes to the fake",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 6: Conditional Access for workload identities", [
    "The other half of Gate G4",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "the sweep, findings, hand-off, owner review and its status, the plan with its approved SHA-256, and the apply folder, dated.");
  sources(s, "Sources: Module 5, \"Summary\"; Module 6.");
  notes(s,
`To sum up. You swept eleven service principals and twenty grants, found the broad grants with no current exception, and handed three privileged service principals to the Privileged Access plan. You read the open rows of the quarter's owner review, applied three approved changes to the fake, and saw the write path refuse a plan nobody reviewed. The evidence an ISSO keeps for Gate 4 from this module is the sweep, the findings, the hand-off, the owner review and its status, the plan with its approved hash, and the apply folder's results and manifest, all dated. Before you ship, work through the chapter's checklist. Next is Module 6: Conditional Access for workload identities, the other half of Gate 4.`,
  `${M} — Unit "Summary"; Module 6.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 5 deck", [
  "Module page: docs/training/non-person-identity/05-least-privilege.md (Non-Person Identity learning path, Module 5): Introduction and its requirement table, objectives, prerequisites, Units 1 to 3, Lab 1, Lab 2, knowledge check and summary. The learning path index: what you need for the labs.",
  "What the module links for the design and rules: Non-Person Identity: An Implementation Guide, Step 4 (4a to 4c), \"Dangers\" and \"Evidence\"; workbook Chapter 07, \"The rule the code holds,\" \"The sweep,\" \"The check,\" \"The quarterly owner review,\" \"The plan,\" \"The separate write path.\"",
  "Kit: examples/non-person-identity (Invoke-NpiLeastPrivilege.ps1; Invoke-NpiLeastPrivilegeAction.ps1; powershell/NpiLeastPrivilege; config/least-privilege.json; tests/fixtures/ch07). Fictional estate. Illustrative: tested against fixtures, not run against a live tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7 and Pester 5 in a scratch copy of examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it; long commands are wrapped and output trimmed where the slides say so. Verification: docs/training/non-person-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
