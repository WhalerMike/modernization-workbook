// HR-Driven Identity learning path, Module 4: Assign access from attributes and review what a move leaves — the module's
// narrated deck. Teaches docs/training/hr-driven-identity/04-access-and-movers.md, Learn-style: objectives, the concepts,
// "Try it" slides with the real Lab 1 commands and output (run November 2, 2026 in a scratch copy of examples/hr-lifecycle),
// Lab 2, the GCC High gap, the federal requirement and evidence, a two-question check, and the summary. Every fact comes
// from the module page, the learning path's verification log, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-hr-module-4/build.js \
//                      presentations/training-hr-module-4/Training_HR_Module_4.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 4: Assign access from attributes and review what a move leaves",
  footer: "Federal Modernization Workbook  ·  HR-Driven Identity learning path, Module 4: Assign access from attributes and review what a move leaves",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "HR-Driven Identity learning path — Module 4: Assign access from attributes and review what a move leaves";
const OUT = process.argv[2] || "Training_HR_Module_4.pptx";
const M = "Training, HR-Driven Identity, Module 4";

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
const SA = "Government clouds and privilege";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 4: Access from attributes, and what a move leaves", "HR-Driven Identity learning path · Gate G4 Access and movers, with workbook Chapter 04",
    ["Access from attributes  ·  The policy files  ·  The lint  ·  The mover's residual review", "Try it: Lab 1  ·  Lab 2  ·  GCC High and privilege  ·  Evidence"]);
  notes(s,
`Welcome to Module 4 of the HR-Driven Identity learning path: assign access from attributes, and review what a move leaves. This is Gate 4, Access and movers, with Chapter 04 of the developer workbook. Module 3 got a new hire ready on day one, with an onboarding package. Department access comes from this gate. In this module you'll lint access package assignment policies before they reach the tenant, scan the tenant's policies for the member-of operator, and list what a move leaves behind for the manager of record to review. The code runs on your laptop, against a fictional population and a fictional mover. It's illustrative: unit-tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a rule on the organization code isn't enough");
  tag(s, "Why");
  const b = table(s, "Wrong", 1.45, [6.4, 5.75], ["How a rule goes wrong, unseen in the portal", "What catches it in this module"], [
    ["Two policies on one package that a user matches at once", "The lint, over a population (AA-02)"],
    ["A rule that reads a display name", "The lint (AA-04)"],
    ["A rule on memberOf, which Learn quarantines from November 3, 2026", "The lint (AA-01) and the tenant scan (MS-01)"],
    ["Access the person was given by hand: a rule can't see it", "The mover's residual review"],
  ], { fontSize: 13, limit: 4.3 });
  callout(s, "Point", b + 0.35, 0.95, "FaPeopleArrows", HEX.red, "When HR moves a person: ",
    "a rule on the organization code should take away the old department's access and give the new one. Automatic assignment policies do that.");
  sources(s, "Sources: Module 4, \"Introduction\"; Lab 1, steps 3 to 5; examples/hr-lifecycle/python/access_assignment.py.");
  notes(s,
`Why does this gate need checks? When HR moves a person to a new organization, a rule on the organization code should take away the old department's access and give the new one. Automatic assignment policies in entitlement management do that. But a rule can be wrong in ways the portal won't tell you. Two policies on one package can both match the same user. A rule can read a display name. Or a rule can use the member-of operator, which Learn quarantines from November 3, 2026. And no rule can see access the person was given by hand. So in this module, the lint catches the first three before a policy reaches the tenant, a scan finds member-of in the tenant's existing policies, and the residual review lists what a move leaves behind.`,
  `${M} — Unit "Introduction"; Lab 1, steps 3 to 5.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Explain why each package gets one automatic policy and no rule uses memberOf",
    "Run the policy lint over a population and explain AA-01, AA-02 and AA-09",
    "Run the memberOf scan on an export of the tenant's policies",
    "List a mover's residual access, classify each item, and read the transfer-to-review interval",
  ], [
    "Module 1: a move reaches the directory through the pipeline, never by hand",
    "Module 3: the day-one workflow requests the onboarding package",
    "Lab 2: a test tenant with ID Governance licenses",
  ], 50);
  sources(s, "Sources: Module 4, \"Learning objectives,\" \"Prerequisites\"; Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll explain why each access package gets one automatic policy, and why no rule uses member-of. You'll run the policy lint over a population, and explain three of its rules: A A oh one, oh two and oh nine. You'll run the member-of scan on an export of the tenant's policies. And you'll list a mover's residual access, classify each item, and read the transfer-to-review interval. Two modules come first. From Module 1: a move reaches the directory through the pipeline, never by hand. From Module 3: the day-one workflow requests the onboarding package, and department access comes from this gate. Lab 2 needs a worldwide or G C C test tenant with Entra ID Governance trial or test licenses.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Guide
{
  const s = content(SC, "Access from attributes: the guide's rules for Gate 4");
  tag(s, "What");
  const l = panel(s, "Rules", 0.6, 1.45, 6.6, null, HEX.navy, HEX.navyTint, "THE GUIDE'S STEP 4", "Six rules", [
    "One automatic policy per package",
    "No memberOf",
    "A grace period for movers",
    "Manager approval, with a fallback",
    "The mover workflow's residual review",
    "Privileged access kept out of rules",
  ], 13.5);
  const r = panel(s, "Quar", 7.45, 1.45, 5.3, null, HEX.red, HEX.redTint, "FROM NOVEMBER 3, 2026", "A memberOf policy is quarantined", [
    "It stays, but adds and removes nothing until the operator is removed",
    "Learn publishes a read-only script to find them",
  ], 13.5);
  callout(s, "Book", Math.max(l, r) + 0.3, 0.85, "FaBook", HEX.navy, "The design: ",
    "Book 03, Chapter 10 (rule patterns; packages and reviews; where dynamic membership stops) and Chapter 08, Mover.");
  sources(s, "Sources: Module 4, Unit 1 \"Access from attributes\"; knowledge check answer 1.");
  notes(s,
`Read the guide's Step 4. It sets six rules for this gate. One automatic policy per package. No member-of. A grace period for movers, so a move doesn't cut someone off mid-handover. Manager approval, with a fallback approver. The mover workflow's residual review. And privileged access kept out of rules altogether. Why no member-of? From November 3, 2026, Learn quarantines an automatic assignment policy whose rule uses it. The policy stays, but it adds and removes nothing until the operator is removed, and Learn publishes a read-only script to find those policies. Then read the design in Chapter 10 of the Federal Modernization Workbook's HR-Driven Identity book: its rule patterns, access packages and access reviews, and where dynamic membership stops. Its Chapter 08 says what a move must start.`,
  `${M} — Unit 1 "Access from attributes": the guide's Step 4; Book 03, Chapter 10; Chapter 08 — "Mover"; Knowledge check answer 1.`);
}

// ================================================================== 5 Files
{
  const s = content(SC, "The program's three policy files");
  tag(s, "What");
  const b = table(s, "Files", 1.45, [3.9, 4.9, 3.35], ["Policy (config/access)", "Rule", "Settings"], [
    ["AUTO ORG-100 Program Operations", "extensionAttribute10 ORG-100, and employeeType Employee or Contractor", "Automatic; removes when the user leaves scope; 7-day grace"],
    ["AUTO ORG-210 Infrastructure Services", "extensionAttribute10 ORG-210, and employeeType Employee or Contractor", "Automatic; removes when the user leaves scope; 7-day grace"],
    ["REQUEST Infrastructure administrator eligibility", "extensionAttribute10 ORG-210, and employeeType Employee", "A request policy: grants eligibility only; tier T1"],
  ], { fontSize: 12.5, limit: 4.4 });
  callout(s, "Codes", b + 0.3, 0.95, "FaHashtag", HEX.navy, "Written on the codes HR owns: ",
    "the organization code and the worker type, never a department name.");
  sources(s, "Sources: Module 4, Unit 2 \"The lint and the residual review\"; examples/hr-lifecycle/config/access/*.json.");
  notes(s,
`Here are the program's policy files, kept as reviewed version one point oh bodies. Two are automatic policies, one per package. Program Operations matches organization code O R G one hundred, and Infrastructure Services matches O R G two ten, each for employees and contractors. Each one both creates assignments when a user enters scope and removes them when the user leaves it, with a seven-day grace period before removal. The third is a request policy for infrastructure administrator eligibility. It's scoped to employees in O R G two ten, but it doesn't assign anything automatically. It only decides who may request eligibility. It's marked tier T one, privileged. Notice that every rule is written on the codes HR owns, the organization code and the worker type, never on a department name.`,
  `${M} — Unit 2 "The lint and the residual review": workbook Chapter 04, "The policy files"; examples/hr-lifecycle/config/access.`);
}

// ================================================================== 6 Lint
{
  const s = content(SC, "The lint: AA-01 to AA-09, over a population");
  tag(s, "What");
  const b = table(s, "AA", 1.45, [1.2, 10.95], ["Rule", "What it flags"], [
    ["AA-01", "A rule that uses memberOf: quarantined from November 3, 2026"],
    ["AA-02", "Users in the population who match more than one automatic policy on one package"],
    ["AA-03", "More identities in scope than Learn's 15,000 per policy"],
    ["AA-04", "Warn: a rule that reads no coded slot or worker type"],
    ["AA-05", "An automatic policy that doesn't both create and remove assignments"],
    ["AA-06", "Warn: a grace period over the program's 14 days (design guidance)"],
    ["AA-07", "A request policy that doesn't route to the manager with a fallback approver"],
    ["AA-08", "Warn: a rule outside the evaluator's subset; lint it with examples/dynamic-rules"],
    ["AA-09", "Tier T1 access assigned by rule: privileged access is requested and activated through PIM"],
  ], { fontSize: 12, limit: 5.9 });
  line(s, "Pop", "The evaluator checks each rule over a population of users; that is how it finds overlap.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, Unit 2; Lab 1, step 3; examples/hr-lifecycle/python/access_assignment.py.");
  notes(s,
`The lint has nine rules, and it checks each rule over a population of users, which is how it finds overlap. A A oh one is a rule on member-of. A A oh two is users who match more than one automatic policy on one package; they can lose access. A A oh three is more identities in scope than Learn's fifteen thousand per policy. A A oh four warns on a rule that reads no coded slot or worker type. A A oh five is an automatic policy that doesn't both create and remove. A A oh six warns on a grace period over the program's fourteen days, which is design guidance. A A oh seven is a request policy without the manager and a fallback approver. A A oh eight sends a rule the evaluator can't read to the dynamic-rules kit. And A A oh nine is tier one access assigned by rule.`,
  `${M} — Unit 2 "The lint and the residual review": workbook Chapter 04, "The lint"; examples/hr-lifecycle/python/access_assignment.py.`);
}

// ================================================================== 7 Residual
{
  const s = content(SC, "The mover's residual review: what a rule can't see");
  tag(s, "What");
  const b = table(s, "Classes", 1.45, [3.4, 5.25, 3.5], ["Class", "In the lab's mover, ORG-100 to ORG-210", "To review?"], [
    ["Kept by rule", "Infrastructure Services baseline", "No"],
    ["Removed by rule after grace", "Program Operations baseline, by October 26", "No"],
    ["Package-managed, rule-managed", "Groups behind the packages; a dynamic group", "No"],
    ["Requested: review", "Grants reporting workspace", "Yes: manager of record"],
    ["Outside packages: review", "Two groups held by direct or nested assignment", "Yes: manager of record"],
  ], { fontSize: 12.5, limit: 4.8 });
  callout(s, "Interval", b + 0.3, 1.0, "FaUserClock", HEX.navy, "The transfer-to-review interval: ",
    "PS-5's metric. RV-02 flags a review still open ten days after the move (design guidance).");
  sources(s, "Sources: Module 4, Unit 2; Lab 1, step 5; examples/hr-lifecycle: access_assignment.py, tests/fixtures/ch04 (fictional mover).");
  notes(s,
`The residual review classifies everything a mover holds after the move. Take the lab's mover, from O R G one hundred to O R G two ten. The new department's baseline is kept by rule. The old department's baseline is removed by rule after the seven-day grace period, by October 26. Groups that sit behind a package are package-managed, and a dynamic group is rule-managed. None of those need a person to decide. Two classes do. Access the mover requested, here a grants reporting workspace, goes to review. And groups held outside packages, by direct or nested assignment, go to review too. Those are the items a rule can't see, and they go to the manager of record. The time from the transfer to a finished review is P S five's metric, and R V oh two flags a review still open ten days after the move.`,
  `${M} — Unit 2 "The lint and the residual review": workbook Chapter 04, "The mover's residual review"; examples/hr-lifecycle/python/access_assignment.py.`);
}
endModule(SC);

// ================================================================== 8 Try it: reads and lint
{
  const s = content(SL, "Try it: the reads, and the lint on the program's policies");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/hr-lifecycle",
    "$ python python/graph_export.py --task access-read --list",
    "Task access-read: EntitlementManagement.Read.All, User.Read.All",
    "  GET /identityGovernance/entitlementManagement/assignmentPolicies  [EntitlementManagement.Read.All]",
    "  GET /identityGovernance/entitlementManagement/assignments  [EntitlementManagement.Read.All]",
    "  GET /users/{userId}/transitiveMemberOf/microsoft.graph.group  [User.Read.All]",
    "$ python python/access_assignment.py lint config/access --population tests/fixtures/ch04/population.json",
    "Policies: 3 files",
    "Lint: 0 Finding, 0 Warn, 0 Info",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026", pt: 11 });
  line(s, "Read", "Three GET calls, two read permissions. The program's three policies lint clean over the population.", c + 0.3, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 1 and 2; examples/hr-lifecycle/config/calls.json.");
  notes(s,
`Try it. Lab 1 runs in the hr-lifecycle folder, and nothing signs in or sends a request. Step one lists the reads, and their permissions. Three GET calls: the assignment policies and the assignments in entitlement management, which need EntitlementManagement dot Read dot All, and each user's transitive group memberships, which need User dot Read dot All. Those are what the scan and the residual review read from a real tenant. Step two lints the program's three policy files over the fixture population. Zero findings, zero warnings, zero information items. That clean run is part of the evidence an ISSO keeps, beside the hash of each body sent.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2; "Summary."`);
}

// ================================================================== 9 Try it: bad lint and scan
{
  const s = content(SL, "Try it: lint broken policies and scan for memberOf");
  tag(s, "How");
  const c = code(s, "Bad", 0.6, 1.45, 12.15, [
    "# Step 3",
    "$ python python/access_assignment.py lint tests/fixtures/ch04/bad-access --population tests/fixtures/ch04/population.json",
    "Policies: 5 files",
    "Lint: 5 Finding, 2 Warn, 0 Info",
    "  AA-01 Finding: AUTO via group membership: rule uses memberOf; from November 3, 2026 the policy is quarantined and ...",
    "  AA-02 Finding: auto-by-department.json, auto-second-policy.json: 2 users match more than one automatic policy on ...",
    "  ...",
    "  AA-09 Finding: AUTO infra admin eligibility: tier T1 access assigned by rule; privileged access is requested and ...",
    "  ...",
    "# Step 4",
    "$ python python/access_assignment.py memberof-scan --policies tests/fixtures/ch04/assignment-policies.json",
    "Assignment policies read: 4; using memberOf: 1",
    "  MS-01 Finding: Shared drives (legacy): AUTO via group membership",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "Exit code 2 for both. The scan reads an export of the tenant's own policies: one of four still uses memberOf.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 3 and 4; examples/hr-lifecycle/tests/fixtures/ch04 (fictional policies).");
  notes(s,
`Step three lints five broken policies: five findings and two warnings, and an exit code of two. Find the three this module cares about. A A oh one: a policy whose rule uses member-of, which will be quarantined. A A oh two: two automatic policies on one package, and two users in the population match both, so they can lose access. And A A oh nine: tier one administrator eligibility assigned by rule, when privileged access should be requested and activated through PIM. The slide trims the other four. Step four turns from the files to the tenant. The member-of scan reads an export of the tenant's assignment policies, four of them, and one still uses member-of: a legacy shared drives package. That's the M S oh one finding, and the evidence you want is this scan with zero rows.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 3 and 4; "Summary."`);
}

// ================================================================== 10 Try it: residual
{
  const s = content(SL, "Try it: list a mover's residual access");
  tag(s, "How");
  const c = code(s, "Res", 0.6, 1.45, 12.15, [
    "# Step 5",
    "$ python python/access_assignment.py residual --mover tests/fixtures/ch04/mover.json \\",
    "    --assignments tests/fixtures/ch04/mover-assignments.json --memberships tests/fixtures/ch04/mover-memberships.json \\",
    "    --policies config/access --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch04/residual",
    "Mover jordan.diaz@contoso.example: 8 items held, 3 to the residual review",
    "Residual: 1 Finding, 3 Warn, 0 Info",
    "Written to out/ch04/residual (residual-review.csv goes to the manager of record)",
    "$ cat out/ch04/residual/residual-review.csv",
    "item,kind,via,class",
    "Grants reporting workspace,access package,REQUEST Grants reporting,requested: review",
    "APP-Legacy-Timekeeping-Approvers,group,direct or nested assignment,outside packages: review",
    "SHARE-ProgramOps-Finance,group,direct or nested assignment,outside packages: review",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (COMMAND WRAPPED)", pt: 10.5 });
  line(s, "Read", "The Finding is RV-02: the review is still open 13 days after the move, past the program's ten.", c + 0.25, 0.45, 13.5);
  line(s, "Tests", "Step 6: python -m pytest tests -q prints 57 passed. Then rm -rf out/ch04.", c + 0.75, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 5 and 6; examples/hr-lifecycle/tests/fixtures/ch04 (fictional mover).");
  notes(s,
`Step five lists one mover's residual. You give it the mover, the mover's assignments and group memberships, the program's policies, a moment, the first of November, the cloud and an output folder. The mover holds eight items, and three go to the residual review. Print the review sheet: one requested package, the grants reporting workspace, and two groups held outside packages, a legacy timekeeping approvers group and a finance share. Those three are the warnings. The finding is R V oh two: the move took effect on October 19, and the review is still open thirteen days later, past the program's ten. That sheet goes to the manager of record, and the manager's decisions and the interval are evidence too. Step six runs the tests, fifty-seven pass, and you delete the chapter's output.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 and 6; "Summary"; examples/hr-lifecycle/tests/fixtures/ch04/mover.json.`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: one automatic policy in a test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant with ID Governance trial or test licenses, never production; two test packages; three test users with coded attributes"],
    ["Scan", "Export the policies and run the scan beside Learn's read-only script"],
    ["Create and move", "Create one automatic policy; move a test user through the pipeline; run the residual review"],
    ["Permissions", "A reader app with a certificate: EntitlementManagement.Read.All and User.Read.All; Identity Governance Administrator to create"],
    ["Back it out", "Remove the test policy, choosing whether its assignments go; restore the user's code through the pipeline; remove the app"],
  ], { fontSize: 12, limit: 5.2 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the steps are the workbook's Lab 2, written from Microsoft Learn's procedures.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 runs the gate in your own test tenant: worldwide or G C C, never production, with Entra ID Governance trial or test licenses, two test access packages, and three test users with coded attributes. Export the tenant's policies, and run the scan beside Learn's read-only script, so you can compare them. Create one automatic policy. Move a test user through the pipeline, never by hand, and run the residual review. The reader app needs a certificate and two permissions, EntitlementManagement dot Read dot All and User dot Read dot All. Creating the policy takes the Identity Governance Administrator role. To back it out, remove the test policy, choosing whether its assignments are removed, restore the test user's code through the pipeline, remove the reader app, its permissions and certificate, and delete the export and output. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 12 GCC High and privilege
{
  const s = content(SA, "GCC High's gap, and privileged access out of rules");
  tag(s, "Who");
  const l = panel(s, "Gov", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "IF YOUR AGENCY IS IN GCC HIGH", "An availability gap", [
    "Administrative units with dynamic membership rules aren't available in Azure Government",
    "The guide gives the gap and its interim path in Step 4",
  ], 13.5);
  const r = panel(s, "Priv", 6.85, 1.45, 5.9, null, HEX.red, HEX.redTint, "PRIVILEGED ACCESS", "Never assigned by rule (AA-09)", [
    "HR attributes decide who may request eligibility",
    "The role is activated through PIM",
    "SCuBA MS.AAD.7.5v1: highly privileged roles only through a privileged access management system",
  ], 13.5);
  callout(s, "Req", Math.max(l, r) + 0.3, 0.85, "FaUserShield", HEX.red, "Required: ",
    "MS.AAD.7.5v1 is required under BOD 25-01.");
  sources(s, "Sources: Module 4, Unit 1; \"Introduction\" (the federal requirement); knowledge check answer 3.");
  notes(s,
`Two things differ by where you are and what you grant. First, government clouds. If your agency is in GCC High, note the gate's availability gap: administrative units with dynamic membership rules aren't available in Azure Government. The guide's Step 4 gives the gap and its interim path. Second, privileged access, wherever you are. A package that grants tier one administrator eligibility to everyone whose organization code matches is the A A oh nine finding. HR attributes should decide who may request eligibility, and the role is activated through PIM. That's what the program's request policy does. CISA's scuba policy seven point five keeps highly privileged roles only in a privileged access management system, and under BOD 25-01 it's required.`,
  `${M} — Unit 1 "Access from attributes"; "Introduction" (the federal requirement); Knowledge check answer 3.`);
}
endModule(SA);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate 4");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.2, 8.95], ["Requirement", "What it asks of Gate 4"], [
    ["NIST SP 800-53 AC-2", "Authorize access on organization-defined attributes, and account review"],
    ["AC-6, AC-5", "Least privilege; separation of duties"],
    ["PS-5", "Personnel transfer"],
    ["SCuBA MS.AAD.7.5v1", "Highly privileged roles only through privileged access management; required under BOD 25-01"],
  ], { fontSize: 12.5, limit: 3.9 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "The reviewed policy files, the lint's clean run and the hash of each body sent; AA-09's clean run",
    "The memberof-scan output with zero rows",
    "Each mover's residual sheet, the manager's decisions and the interval; the separation-of-duties settings",
  ], 12.5);
  sources(s, "Sources: Module 4, \"Introduction\" (the federal requirement); \"Summary\" (the evidence an ISSO keeps).");
  notes(s,
`The federal requirement. This gate supports NIST special publication eight hundred fifty-three A C two, which asks you to authorize access on organization-defined attributes and to review accounts. It supports A C six, least privilege, and A C five, separation of duties. It supports P S five, personnel transfer, which is what the residual review is for. And it supports scuba policy seven point five, highly privileged roles only through a privileged access management system, required under BOD 25-01. Your organization still sets the organization-defined parameters, and the assessor decides whether each is satisfied. The evidence an ISSO keeps for Gate 4: the reviewed policy files, the lint's clean run, and the hash of each body sent. The member-of scan's output with zero rows. A A oh nine's clean run. Each mover's residual sheet, the manager's decisions and the transfer-to-review interval. And the separation-of-duties settings in the package configuration.`,
  `${M} — Unit "Introduction" (the federal requirement); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on access and movers", [
    { q: "From November 3, 2026, what happens to an automatic policy whose rule uses memberOf?", options: ["a. It's deleted", "b. It's quarantined: it stays, but adds and removes nothing until the operator is removed", "c. It's converted to a request policy"] },
    { q: "In the residual review, which items go to the manager of record?", options: ["a. Every assignment and group the mover holds", "b. Only dynamic groups", "c. Assignments from request policies and groups held outside packages"] },
  ], "1 b: quarantined; Learn publishes a read-only script to find them. 2 c: the \"requested: review\" and \"outside packages: review\" items.");
  sources(s, "Sources: Module 4, \"Knowledge check,\" questions 1 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: from November 3, 2026, what happens to an automatic assignment policy whose rule uses member-of? The answer is b: it's quarantined. It stays, but it adds and removes nothing until the operator is removed, and Learn publishes a read-only script to find those policies. Second: in the residual review, which items go to the manager of record? The answer is c: assignments that came from request policies, and groups held outside packages. Everything a rule manages, kept, removed after grace, package-managed or rule-managed, takes care of itself. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 5, certificate checks");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Linted three good and five broken assignment policies over a population",
    "Found a memberOf policy in a tenant export",
    "Listed one mover's residual access, with an overdue review",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 5: Check certificate-based authentication", [
    "The trust store",
    "Each CRL against your cloud's limits",
  ], 13.5);
  callout(s, "Carry", Math.max(l, r) + 0.3, 0.85, "FaPeopleArrows", HEX.teal, "Carry forward: ",
    "a move reaches the directory through the pipeline; the rules and the review do the rest.");
  sources(s, "Sources: Module 4, \"Summary\"; Module 1 prerequisite; learning path index (Module 5).");
  notes(s,
`To sum up. You linted three good and five broken assignment policies over a population. You found a member-of policy in a tenant export. And you listed one mover's residual access, with a review that's overdue. Carry one thing forward: a move reaches the directory through the pipeline, never by hand, and then the rules and the residual review do the rest. Next is Module 5: check certificate-based authentication. You'll check the certificate-based authentication trust store, and each certificate revocation list, against your cloud's limits.`,
  `${M} — Unit "Summary"; Prerequisites; learning path index — "What you'll be able to do," Module 5.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/hr-driven-identity/04-access-and-movers.md (HR-Driven Identity learning path, Module 4): Introduction, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites, what you need for the labs, and Module 5.",
  "What the module links for the design and rules: the HR-driven identity implementation guide, Step 4 and its Gate 4 requirements table (with the GCC High gap and interim path); Book 03, Chapter 10 and Chapter 08, Mover; workbook Chapter 04, \"The policy files,\" \"The lint,\" \"The mover's residual review.\"",
  "Kit: examples/hr-lifecycle (README; config/access/*.json; config/calls.json; python/access_assignment.py; tests/fixtures/ch04). Fictional people and policies. Illustrative: unit-tested against fixtures, not run against a live tenant.",
  "Lab output: run November 2, 2026 with Python 3.14.3 in a scratch copy of examples/hr-lifecycle; long commands are wrapped and output is trimmed where the slides say so. The residual classes on the concept slide are the residual.json that step 5 writes. Lab 2 not run by the authors.",
]);

finish(OUT);
