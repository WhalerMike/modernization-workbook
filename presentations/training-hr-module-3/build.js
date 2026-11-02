// HR-Driven Identity learning path, Module 3: Make joiners ready on day one — the module's narrated deck.
// Teaches docs/training/hr-driven-identity/03-joiners-and-the-temporary-access-pass.md, Learn-style: objectives, the
// concepts, "Try it" slides with the real Lab 1 commands and output (run November 2, 2026 in a scratch copy of
// examples/hr-lifecycle), Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact
// comes from the module page, the learning path's verification log, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-hr-module-3/build.js \
//                      presentations/training-hr-module-3/Training_HR_Module_3.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 3: Make joiners ready on day one",
  footer: "Federal Modernization Workbook  ·  HR-Driven Identity learning path, Module 3: Make joiners ready on day one",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "HR-Driven Identity learning path — Module 3: Make joiners ready on day one";
const OUT = process.argv[2] || "Training_HR_Module_3.pptx";
const M = "Training, HR-Driven Identity, Module 3";

// The title slide, as shared.js draws it, with this path's name over the units.
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "HR-DRIVEN IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
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
  const s = title(SI, "Module 3: Make joiners ready on day one", "HR-Driven Identity learning path · Gate G3 Joiners, with workbook Chapter 03",
    ["The joiner in the guide  ·  Workflows as files  ·  The lint  ·  The plan  ·  Readiness", "Try it: Lab 1  ·  Lab 2  ·  Federal requirement and evidence"]);
  notes(s,
`Welcome to Module 3 of the HR-Driven Identity learning path: make joiners ready on day one. This is Gate 3, Joiners, with Chapter 03 of the developer workbook. Modules 1 and 2 settled who writes each account state, and brought contractors in from their own source. Now the new hire's first morning. In this module you'll keep the Lifecycle Workflows definitions as reviewed files, lint them before they reach the tenant, plan each change against what the tenant already holds, and measure how many hires were actually ready on day one. You'll also see why the Temporary Access Pass a new hire gets should be short-lived and one-time use. The code runs on your laptop against fictional fixtures. It's illustrative: unit-tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the first morning needs workflows as code");
  tag(s, "Why");
  const b = table(s, "Needs", 1.45, [5.2, 6.95], ["On the first morning, a new hire needs", "Where it comes from"], [
    ["An enabled account", "The pipeline sent it early, disabled"],
    ["A license and baseline access", "Lifecycle Workflows can request them"],
    ["A way to sign in before the PIV card is bound", "A Temporary Access Pass"],
  ], { fontSize: 13.5, limit: 3.5 });
  const l = panel(s, "Problem", 0.6, b + 0.3, 12.15, null, HEX.red, HEX.redTint, "THE CATCH", null, [
    "Each workflow is a definition someone can change in the portal",
    "Learn makes every change a new version, not an in-place update",
  ], 13.5);
  callout(s, "Point", l + 0.25, 0.95, "FaUserCheck", HEX.red, "This module: ",
    "keep the workflows as reviewed files, lint them, plan each change, and measure who was ready on day one.");
  sources(s, "Sources: Module 3, \"Introduction.\"");
  notes(s,
`Why does the first morning need code? The pipeline sends a new hire's account early, and disabled. On the first morning, that person needs an enabled account, a license, baseline access, and a way to sign in before their PIV card is bound. Lifecycle Workflows can do all of that. But here's the catch. Each workflow is a definition that someone can change in the portal. And Learn makes every change a new version, rather than an in-place update. So in this module you keep the workflows as reviewed files. You lint them before they reach the tenant. You plan each change against what the tenant holds. And then you measure how many hires were actually ready on day one, because a workflow that ran isn't the same as a person who can work.`,
  `${M} — Unit "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Explain why workflows belong in reviewed files, and how the plan decides between a create and a new version",
    "Run the workflow lint and explain the Temporary Access Pass findings (JW-05)",
    "Explain why the workflow budget is held to 50",
    "Measure the day-one readiness rate and say what makes a hire ready",
  ], [
    "Module 1: the pipeline's active value, not the day-one workflow, enables the account",
    "Module 2: the contractor leaver workflow the files include",
    "Lab 2: a test tenant with ID Governance licenses",
  ], 50);
  sources(s, "Sources: Module 3, \"Learning objectives,\" \"Prerequisites\"; Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll explain why workflows belong in reviewed files, and how the plan decides between creating a workflow and making a new version. You'll run the workflow lint and explain its Temporary Access Pass findings, the J W oh five rule. You'll explain why the workflow budget is held to fifty. And you'll measure the day-one readiness rate, and say what makes a hire ready. Two modules come first. From Module 1: in this program, the pipeline's active value, not the day-one workflow, enables the account at hire. From Module 2: the contractor leaver workflow, which the files include. Lab 2 needs a worldwide or G C C test tenant with Entra ID Governance trial or test licenses.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Guide
{
  const s = content(SC, "The joiner in the guide: three things to notice");
  tag(s, "What");
  const b = table(s, "Notice", 1.45, [2.6, 9.55], ["Notice", "What the guide says"], [
    ["The workflow budget", "Learn gives two ceilings: 50 on the licensing page, 100 on the service limits page. Budget to 50 until Microsoft reconciles them (design guidance)"],
    ["The Temporary Access Pass", "Learn recommends at most 24 hours for a pass sent to a new hire; the tenant allows 10 minutes to 30 days"],
    ["Baseline access", "By access package, never by a direct group add"],
  ], { fontSize: 13, limit: 3.9 });
  panel(s, "Book", 0.6, b + 0.3, 12.15, null, HEX.navy, HEX.navyTint, "THE DESIGN: BOOK 03, CHAPTER 08", null, [
    "Its guardrails at agency scale, and its triggers and schedule",
    "In this program the pipeline enables the account at hire; the workflows do the rest",
  ], 13);
  sources(s, "Sources: Module 3, Unit 1 \"The joiner in the guide and the book\"; Prerequisites; knowledge check answers 2 and 3.");
  notes(s,
`Read the guide's Step 3, and notice three things. First, the workflow budget. Learn gives two tenant ceilings: fifty workflows on its licensing page, and a hundred on its service limits page. The guide budgets to fifty until Microsoft reconciles them; that's design guidance. Second, the Temporary Access Pass. The tenant allows a pass from ten minutes to thirty days, but Learn recommends at most twenty-four hours for a pass sent to a new hire. Third, baseline access comes by access package, never by adding the user to a group directly. Then read the design in Book 03's Chapter 08: its guardrails at agency scale, and its triggers and schedule. And keep Module 1's rule in mind: in this program, the pipeline's active value enables the account at hire, not a workflow.`,
  `${M} — Unit 1 "The joiner in the guide and the book"; Prerequisites; Knowledge check answers 2 and 3.`);
}

// ================================================================== 5 Files
{
  const s = content(SC, "Six workflow files, all scoped on codes");
  tag(s, "What");
  const b = table(s, "Files", 1.45, [4.3, 3.6, 4.25], ["Workflow (config/workflows)", "Trigger", "Tasks"], [
    ["JML-Joiner-PreHire-Employees", "7 days before the hire date", "Generate TAP and send email"],
    ["JML-Joiner-DayOne-Employees", "On the hire date", "Request onboarding access package"],
    ["JML-Mover-OrgCode", "An attribute change", "Notify the manager; remove an access package assignment"],
    ["JML-Leaver-LastDay-Employees", "On the leave date", "Disable; revoke refresh tokens; remove package assignments"],
    ["JML-Leaver-LastDay-Contractors", "On the leave date", "Disable; revoke refresh tokens"],
    ["JML-Leaver-PostSeparation-Employees", "30 days after the leave date", "Delete user"],
  ], { fontSize: 12, limit: 5.2 });
  line(s, "Codes", "Every scope reads employeeType and a coded slot (extensionAttribute11 eq 'EMP' or 'CTR'), never a name.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 3, Unit 2 \"The lint, the plan and readiness\"; examples/hr-lifecycle/config/workflows/*.json.");
  notes(s,
`Here are the six workflow files, as reviewed version one point oh bodies. Two are joiners. The pre-hire workflow runs seven days before the hire date and generates the Temporary Access Pass and sends it by email. The day-one workflow runs on the hire date and requests the onboarding access package. One is the mover, triggered by an attribute change: it notifies the manager and removes an access package assignment. And three are leavers. On the leave date, employees are disabled, their refresh tokens revoked and their package assignments removed; contractors are disabled and their tokens revoked. Thirty days after the leave date, a separate post-separation workflow deletes the user. Notice the scopes. Every one reads the worker type and a coded slot, never a name, so renaming an organization can't silently drop anyone.`,
  `${M} — Unit 2 "The lint, the plan and readiness": workbook Chapter 03, "The workflow files"; examples/hr-lifecycle/config/workflows.`);
}

// ================================================================== 6 Lint
{
  const s = content(SC, "The lint: JW-01 to JW-15, before the tenant");
  tag(s, "What");
  const b = table(s, "JW", 1.45, [1.2, 10.95], ["Rule", "What it flags"], [
    ["JW-02", "Warn: a scope with no coded attribute, or one that reads a display value such as department"],
    ["JW-03, JW-06", "An offset outside -180 to 180 days; more than Learn's 25 tasks per workflow"],
    ["JW-05", "The pass: lifetime outside 10 to 43,200 minutes (Finding); over 24 hours, or not one-time use (Warn)"],
    ["JW-07", "More workflows than the budget"],
    ["JW-08", "A scheduled workflow with no execution limit recorded: set it in the admin center (Learn: not in the API)"],
    ["JW-09", "A joiner that adds the user to groups directly"],
    ["JW-11", "Delete and disable in one workflow; delete belongs in a separate post-separation workflow"],
    ["JW-15", "Warn, from the plan: a workflow in the tenant that no reviewed file defines"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "Label", "Some rules come from Learn, others are design guidance; the workbook's lint table says which.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 3, Unit 2; Lab 1, steps 3 and 4; examples/hr-lifecycle/python/joiner_workflows.py.");
  notes(s,
`The lint, rules J W oh one to fifteen, checks the files before anything reaches the tenant. A few to know. J W oh two warns when a scope uses no coded attribute, or reads a display value like department. J W oh three and oh six catch an offset beyond a hundred eighty days either way, and more than Learn's twenty-five tasks in a workflow. J W oh five is the pass: a lifetime outside ten minutes to thirty days is a finding, and over twenty-four hours, or not one-time use, is a warning. J W oh seven is over budget. J W oh eight is a scheduled workflow with no execution limit recorded; Learn says the limit isn't in the API, so you set it in the admin center and record it. J W oh nine is a direct group add. J W eleven is delete and disable together. Some rules come from Learn, and some are design guidance.`,
  `${M} — Unit 2 "The lint, the plan and readiness": workbook Chapter 03, "The lint"; examples/hr-lifecycle/python/joiner_workflows.py.`);
}

// ================================================================== 7 Plan and readiness
{
  const s = content(SC, "The plan, and what makes a hire ready");
  tag(s, "What");
  const l = panel(s, "Plan", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE PLAN", "Match by display name, then decide", [
    "No match in the tenant: create",
    "A changed file: a body for createNewVersion",
    "Unchanged: leave it alone",
    "A tenant workflow no file defines: JW-15",
    "Refuses to plan files that have lint findings",
  ], 13);
  const r = panel(s, "Ready", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "DAY-ONE READINESS", "A ready hire has all four", [
    "An account that exists and is enabled",
    "A license",
    "The onboarding package delivered",
    "A completed pre-hire run",
  ], 13);
  callout(s, "Rate", Math.max(l, r) + 0.3, 0.85, "FaChartLine", HEX.teal, "The rate: ",
    "ready hires over hires per start date, in summary.json, which Module 7 reads.");
  sources(s, "Sources: Module 3, Unit 2; Lab 1, steps 4 and 5; knowledge check answers 1 and 4.");
  notes(s,
`Two more ideas. The plan compares the files with an export of the tenant's workflows, matching them by display name. A file with no match becomes a create. A file that changed becomes a body for create new version, because Learn makes a definition change a new version. An unchanged file is left alone. A workflow in the tenant that no file defines gets the J W fifteen warning. And the plan refuses to run on files that still have lint findings. Then readiness. A hire is ready on day one only with all four: an account that exists and is enabled, a license, the onboarding package delivered, and a completed pre-hire run. The readiness rate is ready hires over hires for each start date, and it's saved in a summary file that Module 7 reads.`,
  `${M} — Unit 2 "The lint, the plan and readiness": workbook Chapter 03, "The plan," "Day-one readiness"; Knowledge check answers 1 and 4.`);
}
endModule(SC);

// ================================================================== 8 Try it: lists and lint
{
  const s = content(SL, "Try it: the reads, and the lint on the program's files");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/hr-lifecycle",
    "$ python python/graph_export.py --task joiner-plan --list",
    "Task joiner-plan: LifecycleWorkflows-Workflow.Read.All",
    "  GET /identityGovernance/lifecycleWorkflows/workflows  [LifecycleWorkflows-Workflow.Read.All]",
    "$ python python/graph_export.py --task joiner-readiness --list",
    "Task joiner-readiness: EntitlementManagement.Read.All, LifecycleWorkflows-Reports.Read.All, User-LifeCycleInfo.Read.All, User.Read.All",
    "  GET /users  [User-LifeCycleInfo.Read.All, User.Read.All]",
    "  GET /identityGovernance/lifecycleWorkflows/workflows/{workflowId}/userProcessingResults  [LifecycleWorkflows-Reports.Read.All]",
    "  GET /identityGovernance/entitlementManagement/assignments  [EntitlementManagement.Read.All]",
    "$ python python/joiner_workflows.py lint config/workflows --budget 50",
    "Workflows: 6 files, budget 50",
    "Lint: 0 Finding, 0 Warn, 0 Info",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026", pt: 10.5 });
  line(s, "Read", "The plan needs one read permission; readiness needs four, for three GET calls. The program's six files lint clean.", c + 0.25, 0.75, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 1 and 2; examples/hr-lifecycle/config/calls.json.");
  notes(s,
`Try it. Lab 1 runs in the hr-lifecycle folder, and nothing signs in or sends a request. Step one lists two tasks' reads. The plan needs only one permission, the Lifecycle Workflows workflow read, for one GET on the workflows. Readiness needs four permissions, for three GET calls: the users, each workflow's user processing results, and the access package assignments. Step two lints the program's own six workflow files with a budget of fifty. Zero findings, zero warnings, zero information items. That's the clean run an ISSO keeps: it shows a one-time pass of at most twenty-four hours, and an execution limit on every scheduled workflow.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2; "Summary."`);
}

// ================================================================== 9 Try it: bad lint
{
  const s = content(SL, "Try it: lint three broken workflows");
  tag(s, "How");
  const c = code(s, "Bad", 0.6, 1.45, 12.15, [
    "# Step 3: a budget of two, to see JW-07",
    "$ python python/joiner_workflows.py lint tests/fixtures/ch03/bad-workflows --budget 2",
    "Workflows: 3 files, budget 2",
    "Lint: 7 Finding, 4 Warn, 0 Info",
    "  JW-03 Finding: Bad-DayOne-GroupAdd: offsetInDays 200 is outside -180 to 180",
    "  JW-04 Finding: Bad-Leaver-DeleteSameDay: a leaver workflow triggered on employeeHireDate",
    "  JW-07 Finding: workflow count: 3 workflows over the budget of 2 (Learn's licensing page says 50, its limits page 100)",
    "  JW-08 Finding: Bad-PreHire-ByDepartment: scheduled with no execution limit recorded; set it in the admin center ...",
    "  JW-09 Finding: Bad-DayOne-GroupAdd: joiner adds the user to groups directly; give baseline access by access package",
    "  ...",
    "  JW-05 Warn: Bad-PreHire-ByDepartment: TAP lifetime 4320 minutes; Learn recommends at most 24 hours for a new hire",
    "  JW-05 Warn: Bad-PreHire-ByDepartment: TAP isn't one-time use; the tenant policy can force it (design guidance: do)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "Exit code 2. The two JW-05 Warns: a pass of 4,320 minutes, three days, and a pass that isn't one-time use.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" step 3; examples/hr-lifecycle/tests/fixtures/ch03/bad-workflows.");
  notes(s,
`Step three lints three broken copies, with a budget of two so you can see J W oh seven. Seven findings and four warnings, and an exit code of two. Read a few. One offset is two hundred days, beyond the limit. A leaver is triggered on the hire date. Three workflows are over the budget of two, and the message quotes both of Learn's ceilings. A scheduled workflow has no execution limit recorded. A joiner adds the user to groups directly, instead of giving baseline access by package. The slide trims a few more. Now find the two J W oh five warnings, the ones this module cares most about. One pass lasts four thousand three hundred twenty minutes, which is three days, well over the twenty-four hours Learn recommends for a new hire. The other pass isn't one-time use.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 3.`);
}

// ================================================================== 10 Try it: plan
{
  const s = content(SL, "Try it: plan the files against the tenant's export");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 8.6, [
    "# Step 4",
    "$ python python/joiner_workflows.py plan config/workflows \\",
    "    --current tests/fixtures/ch03/workflows.json --out out/ch03/plan",
    "  none        JML-Leaver-LastDay-Contractors",
    "  new-version JML-Joiner-DayOne-Employees",
    "  create      JML-Leaver-LastDay-Employees",
    "  none        JML-Mover-OrgCode",
    "  none        JML-Leaver-PostSeparation-Employees",
    "  none        JML-Joiner-PreHire-Employees",
    "Plan: 0 Finding, 1 Warn, 0 Info",
    "Plan written to out/ch03/plan/plan.json; nothing was sent",
    "$ python python/joiner_workflows.py plan tests/fixtures/ch03/bad-workflows \\",
    "    --current tests/fixtures/ch03/workflows.json --out out/ch03/plan-bad",
    "error: the files have lint findings; fix them before planning",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (WRAPPED)", pt: 10.5 });
  panel(s, "Read", 9.45, 1.45, 3.3, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "One new version, one create, four unchanged",
    "The Warn: JW-15, Onboard Marketing (legacy), made in the portal",
    "Broken files can't be planned",
  ], 13);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" step 4; examples/hr-lifecycle/tests/fixtures/ch03/workflows.json.");
  notes(s,
`Step four plans the program's files against an export of the tenant's workflows. The day-one workflow changed, so it gets a new version. The employee last-day leaver isn't in the tenant yet, so it's a create. The other four are unchanged and left alone. There's one warning, J W fifteen, for a workflow called Onboard Marketing, legacy: someone made it in the portal, and no file defines it. The plan is written to a file, and nothing is sent. Now try planning the broken folder. It stops with an error: the files have lint findings, fix them before planning. So the order is enforced. Lint first, then plan, then a reviewed send.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 4.`);
}

// ================================================================== 11 Try it: readiness
{
  const s = content(SL, "Try it: measure day one");
  tag(s, "How");
  const c = code(s, "Ready", 0.6, 1.45, 8.6, [
    "# Step 5",
    "$ python python/joiner_workflows.py readiness \\",
    "    --hires tests/fixtures/ch03/hr-hires.csv \\",
    "    --users tests/fixtures/ch03/hire-users.json \\",
    "    --prehire-results tests/fixtures/ch03/prehire-results.json \\",
    "    --assignments tests/fixtures/ch03/joiner-assignments.json \\",
    "    --workflows config/workflows --as-of 2026-11-02T08:00:00Z \\",
    "    --cloud gcc --out out/ch03/readiness",
    "Day one 2026-11-02: 1 of 4 hires ready (25%)",
    "Readiness: 0 Finding, 3 Warn, 0 Info",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (WRAPPED)", pt: 11 });
  panel(s, "Read", 9.45, 1.45, 3.3, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "1 of 4 hires ready",
    "summary.json holds the rate, 0.25",
    "Module 7 reads it",
  ], 13);
  line(s, "Tests", "Step 6: python -m pytest tests -q prints 57 passed. Then rm -rf out/ch03.", c + 0.3, 0.45, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 5 and 6; examples/hr-lifecycle/tests/fixtures/ch03 (fictional hires).");
  notes(s,
`Step five measures day one. You give it the HR hires, the hire accounts, the pre-hire workflow's results, the access package assignments, the workflow files, a moment, eight in the morning U T C on the second of November, the cloud, and an output folder. One of four hires was ready: twenty-five percent. Three hires get a readiness warning, because each one is missing at least one of the four things a ready hire has. The summary file holds the rate, zero point two five, and Module 7 reads it as one of the lifecycle metrics. Step six runs the tests, fifty-seven pass, and you delete the chapter's output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 and 6.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: plan and send one change in a test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant with ID Governance trial or test licenses, never production; test users hired in a few days"],
    ["Plan and send", "Export the workflows, plan one change, send it with Graph PowerShell as a Lifecycle Workflows Administrator"],
    ["Check", "Set the execution limit in the admin center; check the manager receives the pass; measure readiness on the start date"],
    ["Permissions", "A reader app with a certificate holding LifecycleWorkflows-Workflow.Read.All; the administrator role to send"],
    ["Back it out", "Delete a workflow the lab created (restorable for 30 days) or send the previous body as a version; remove the app"],
  ], { fontSize: 12, limit: 5.2 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the steps are the workbook's Lab 2, written from Microsoft Learn's procedures.");
  sources(s, "Sources: Module 3, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 runs one change in your own test tenant: worldwide or G C C, never production, with Entra ID Governance trial or test licenses, and test users whose hire date is a few days away. Export the tenant's workflows, plan one change, and send it with Graph PowerShell as a Lifecycle Workflows Administrator. Set the execution limit in the admin center, since it isn't in the API. Check that the manager receives the pass. And on the start date, measure readiness. The reader app needs a certificate and one permission, the workflow read. To back it out, delete a workflow the lab created, which can be restored for thirty days, or send the previous file's body as a further version. Then remove the reader app, its permission and certificate, and delete the export and output. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate 3");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.2, 8.95], ["Requirement", "What it asks of Gate 3"], [
    ["NIST SP 800-53 AC-2(1)", "Automated system account management"],
    ["IA-5", "The initial authenticator is time-limited and goes to an accountable person"],
    ["OMB M-22-09", "Phishing-resistant MFA, which the Temporary Access Pass bridges to"],
  ], { fontSize: 13, limit: 3.6 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "The reviewed workflow files, and the plan that changed each version, with its manifest",
    "The lint's clean run: a one-time pass of at most 24 hours; an execution limit on every scheduled workflow",
    "The readiness summary per start date; the run history exported past Entra's 30-day view",
  ], 13);
  sources(s, "Sources: Module 3, \"Introduction\" (the federal requirement); \"Summary\" (the evidence an ISSO keeps).");
  notes(s,
`The federal requirement. This gate meets NIST special publication eight hundred fifty-three A C two, enhancement one, automated system account management. It meets I A five: the initial authenticator is time-limited, and goes to an accountable person; that's the short, one-time pass sent to the manager. And it meets O M B M-22-09's phishing-resistant multifactor authentication, which the Temporary Access Pass bridges to until the PIV card is bound. The evidence an ISSO keeps for Gate 3: the reviewed workflow files, and the plan that changed each version, with its manifest. The lint's clean run, showing a one-time pass of at most twenty-four hours and an execution limit on every scheduled workflow. The readiness summary for each start date. And the workflows' run history, exported past Entra's thirty-day view.`,
  `${M} — Unit "Introduction" (the federal requirement); "Summary" (the evidence an ISSO keeps); Lab 2.`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on joiners", [
    { q: "You change the pre-hire workflow's offset in its file. What does plan produce?", options: ["a. A body for createNewVersion, because Learn makes a definition change a new version", "b. A PATCH that updates the workflow in place", "c. A delete and a create"] },
    { q: "Which hire counts as ready on day one?", options: ["a. One whose account exists, even if disabled", "b. One whose pre-hire workflow ran, whatever its result", "c. Enabled account, a license, the onboarding package delivered, a completed pre-hire run"] },
  ], "1 a: a changed file becomes a body for createNewVersion; no match becomes a create. 2 c: all four conditions.");
  sources(s, "Sources: Module 3, \"Knowledge check,\" questions 1 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: you change the pre-hire workflow's offset in its file. What does the plan produce for it? The answer is a: a body for create new version, because Learn makes a definition change a new version. There's no in-place update. A file with no match in the tenant would become a create. Second: which hire counts as ready on day one? The answer is c: one whose account exists and is enabled, holds a license, has the onboarding package delivered, and has a completed pre-hire run. All four. An account that exists but is disabled isn't ready, and neither is a pre-hire run that didn't complete. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 4, access and movers");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Linted six workflow files and three broken ones",
    "Planned a create and a new version against a tenant export",
    "Saw a portal-made workflow flagged",
    "Measured a day-one readiness rate of 25 percent",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 4: Assign access from attributes", [
    "One automatic policy per package",
    "The memberOf scan",
    "The mover's residual review",
  ], 13.5);
  callout(s, "Carry", Math.max(l, r) + 0.3, 0.85, "FaUserCheck", HEX.teal, "Carry forward: ",
    "the day-one workflow requests the onboarding package; department access comes from Gate 4.");
  sources(s, "Sources: Module 3, \"Summary\"; Module 4, \"Prerequisites,\" \"Introduction.\"");
  notes(s,
`To sum up. You linted the program's six workflow files and three broken ones. You planned a create and a new version against a tenant export, and saw a portal-made workflow flagged. And you measured a day-one readiness rate of twenty-five percent. Carry one thing forward: the day-one workflow requests the onboarding package, but department access comes from the next gate. Next is Module 4: assign access from attributes and review what a move leaves. You'll lint access package assignment policies before they reach the tenant, scan the tenant's policies for the member-of operator, and list what a move leaves behind for the manager of record to review.`,
  `${M} — Unit "Summary"; Module 4 — "Prerequisites," "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/hr-driven-identity/03-joiners-and-the-temporary-access-pass.md (HR-Driven Identity learning path, Module 3): Introduction, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design and rules: the HR-driven identity implementation guide, Step 3 and its Gate 3 requirements table; Book 03, Chapter 08 (guardrails at agency scale; triggers and schedule); workbook Chapter 03, \"The workflow files,\" \"The lint,\" \"The plan,\" \"Day-one readiness.\"",
  "Kit: examples/hr-lifecycle (README; config/workflows/*.json; config/calls.json; python/joiner_workflows.py; tests/fixtures/ch03). Fictional people. Illustrative: unit-tested against fixtures, not run against a live tenant.",
  "Lab output: run November 2, 2026 with Python 3.14.3 in a scratch copy of examples/hr-lifecycle; long commands are wrapped and output is trimmed where the slides say so. Verification: docs/training/hr-driven-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
