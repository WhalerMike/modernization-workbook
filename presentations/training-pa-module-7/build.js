// Privileged Access learning path, Module 7: Access reviews of privileged roles — the module's narrated deck.
// Teaches docs/training/privileged-access/07-access-reviews.md, Learn-style: objectives, the concepts, "Try it" slides
// with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/privileged-access), Lab 2,
// the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module page,
// the learning path's verification log, or the kit (examples/privileged-access); the deck adds none. The narration names
// the original source the workbook footnotes for each fact (workbook Chapter 07's footnotes).
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pa-module-7/build.js \
//                      presentations/training-pa-module-7/Training_PA_Module_7.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 7: Access reviews of privileged roles",
  footer: "Federal Modernization Workbook  ·  Privileged Access learning path, Module 7: Access reviews of privileged roles",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Privileged Access learning path — Module 7: Access reviews of privileged roles";
const OUT = process.argv[2] || "Training_PA_Module_7.pptx";
const M = "Training, Privileged Access, Module 7";

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
  const s = title(SI, "Module 7: Access reviews of privileged roles", "Privileged Access learning path · Plan Phase 2 (A2.7) and Phase 3 (A3.7), with workbook Chapter 07",
    ["Why reviews as code  ·  The series  ·  The checks and PA-AR-06  ·  The plan", "The evidence  ·  Try it: Lab 1  ·  Lab 2  ·  The federal requirement"]);
  notes(s,
`Welcome to Module 7 of the Privileged Access learning path: access reviews of privileged roles. This module serves the project plan's task A2.7 in Phase 2 and A3.7 in Phase 3, with Chapter 07 of the developer workbook. The approval gate controls the use of privilege. Reviews control who keeps the eligibility. The program's design creates one recurring review per role, Tier 0 monthly and the rest quarterly, with auto-apply on, and remove access when reviewers don't respond. In this module you define every privileged review series as code. You show a reviewer what a change will do before it reaches the tenant, apply it with the least permission that can, and hand the ISSO the decisions each review produced. The code is illustrative: tested against fixtures and a fake.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why reviews belong in code, and the lockout they can cause");
  tag(s, "Why");
  const l = panel(s, "Drift", 0.6, 1.45, 5.6, null, HEX.amber, HEX.amberTint, "A REVIEW SET UP BY HAND DRIFTS", null, [
    "A reviewer leaves",
    "A duration is shortened",
    "Auto-apply is switched off for one cycle, and never back on",
  ], 13.5);
  const r = panel(s, "Lock", 6.45, 1.45, 6.3, null, HEX.red, HEX.redTint, "THE LOCKOUT", "Global Administrator, reviewed by silence", [
    "The emergency accounts hold it as permanent active assignments",
    "Active assignments covered, Deny on silence, auto-apply on",
    "Miss one month, and the review removes them",
  ], 13.5);
  callout(s, "Guard", Math.max(l, r) + 0.3, 1.0, "FaUserShield", HEX.red, "So: ",
    "PA-AR-06 fails that review; PA-AR-E08 reports an emergency account a reviewer denied; and the code never deletes a series, because its decisions are evidence.");
  sources(s, "Sources: Module 7, \"Introduction\" and its lockout callout; Microsoft Learn, \"accessReviewScheduleSettings resource type.\"");
  notes(s,
`Why code? Because a review set up by hand drifts. A reviewer leaves, a duration is shortened, auto-apply is switched off for one cycle and never back on. And reviews have their own lockout. The emergency accounts hold Global Administrator as permanent active assignments. A review of Global Administrator that covers active assignments, with remove access on silence and auto-apply on, removes them if the reviewers miss one month. Microsoft Learn's reference for review settings cautions that auto-apply with a default decision can revoke all access. So rule A R oh six fails a review that would do that, and rule A R, E oh eight, reports an emergency account a reviewer denied. The apply refuses a plan with any finding. And the code never deletes a series, because deleting a definition deletes its decisions, and those are evidence.`,
  `${M} — Unit "Introduction"; the callout "The lockout check for this module."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 7", [
    "Explain why privileged reviews belong in code, and what licensing they need",
    "Name the series the program defines and the cadence for each tier",
    "Explain the PA-AR-06 guard, and why it changes the program's own setting",
    "Read a plan's actions: Create, Update, Replace, NoChange, Unmanaged, Conflict",
    "Read the evidence findings, PA-AR-E01 to PA-AR-E08",
  ], [
    "Module 2: the emergency accounts PA-AR-06 protects",
    "Module 5: the PRV groups, each reviewed through its own membership series",
    "Lab 2: a worldwide or GCC test tenant with Entra ID Governance, never production",
  ], 55);
  sources(s, "Sources: Module 7, \"Learning objectives,\" \"Prerequisites\"; \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll explain why privileged reviews belong in code, and what licensing they need. You'll name the series the program defines, and the cadence for each tier. You'll explain the A R oh six guard, and why it changes the program's own setting. You'll read a plan's actions: Create, Update, Replace, NoChange, Unmanaged and Conflict. And you'll read the evidence findings, A R, E oh one to E oh eight. Before you start, finish Module 2, for the emergency accounts that A R oh six protects, and Module 5, for the P R V groups, each reviewed through its own membership series. Lab 2 needs a worldwide or G C C test tenant with Microsoft Entra I D Governance, a trial will do, and never production.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Series
{
  const s = content(SC, "The series, the cadence and the licensing");
  tag(s, "What");
  const b = table(s, "Series", 1.45, [3.6, 8.55], ["Series", "What it reviews"], [
    ["Entra role series", "Users who hold a role; Tier 0 monthly, the rest quarterly"],
    ["PRV group membership", "Each PRV group's members (PIM for Groups reviews are in preview)"],
    ["Azure role series", "An Azure role, through a preview API"],
  ], { fontSize: 13, limit: 3.6 });
  const l = panel(s, "Groups", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "A ROLE SERIES COVERS USERS", null, [
    "Groups that hold the role are reviewed through their own membership series",
    "PA-AR-14 flags a group without one",
  ], 13);
  panel(s, "Lic", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "LICENSING", null, [
    "Microsoft Entra ID Governance for every reviewer and every reviewed privileged user: the stricter of two Learn pages",
  ], 13);
  sources(s, "Sources: Module 7, Unit 1; Microsoft Learn, \"Microsoft Entra ID Governance licensing fundamentals,\" \"Create an access review of PIM for Groups (preview)\"; Book 04, Ch 09.");
  notes(s,
`Unit 1: why reviews, and the series. Seven series follow the program's review schedule, in three kinds. Entra role series review the users who hold a role, Tier 0 monthly and the rest quarterly. P R V group membership series review each group's members; Microsoft Learn marks PIM for Groups reviews as preview. And an Azure role series goes through a preview A P I. A role series covers users. Groups that hold the role are reviewed through their own membership series, and rule A R fourteen flags a group without one. Licensing: the program budgets Microsoft Entra I D Governance for every reviewer and every reviewed privileged user. Microsoft Learn has two licensing pages that differ, and that's the stricter reading. The monthly and quarterly cadence is the program's own decision; NIST leaves the frequency to the organization.`,
  `${M} — Unit 1: workbook Chapter 07, "Why reviews, and why as code," "What it costs, and where it runs," "The reviewed JSON," "The bodies"; Book 04, Chapter 09 — "Cadence."`);
}

// ================================================================== 5 Checks
{
  const s = content(SC, "The checks: PA-AR-01 to PA-AR-14");
  tag(s, "What");
  const b = table(s, "AR", 1.45, [1.5, 1.5, 9.15], ["Rule", "Severity", "What it catches"], [
    ["PA-AR-01", "Finding", "No reviewers: Graph treats that as a self-review"],
    ["PA-AR-02, 03", "Finding", "No fallback reviewer; descriptionForReviewers missing or over 256 characters"],
    ["PA-AR-04", "Finding", "A monthly review longer than 27 days, a weekly one longer than 7"],
    ["PA-AR-05", "Finding", "Auto-apply off"],
    ["PA-AR-06", "Finding", "Deny or Recommendation on silence over active assignments of a role the emergency accounts hold"],
    ["PA-AR-07, 08", "Warn; Finding", "The no-response default isn't Deny; justification not required"],
    ["PA-AR-09, 10", "Finding; Warn", "Tier 0 not monthly, or another tier not quarterly; a start date in the past"],
    ["PA-AR-11, 12, 13", "Finding; Warn", "A group reviewing an Azure role; two series with one name; an unlisted managed series"],
    ["PA-AR-14", "Finding", "A group that holds a reviewed role has no membership series"],
  ], { fontSize: 11.5, limit: 5.7 });
  line(s, "Own", "PA-AR-06 changes the program's own setting: that series uses \"no change\" on silence, and PA-AR-E04 reports what nobody reviewed.", b + 0.2, 0.75, 13);
  sources(s, "Sources: Module 7, Unit 2 and the lockout callout; Microsoft Learn, \"Configure access reviewers,\" \"Create definitions\"; PaAccessReviews.psm1.");
  notes(s,
`Unit 2: the checks, the plan and the evidence. Rules A R oh one to fourteen check each series before it's applied. Oh one is the first: no reviewers. Microsoft Learn's page on configuring reviewers says Graph treats no reviewers as a self-review, and in this program assignees never review themselves. Oh two is no fallback reviewer, and oh three a missing or over-long description for reviewers. Oh four is a review longer than its cycle. Oh five is auto-apply off. Oh six is the lockout guard. And it changes the program's own setting: a review that covers the emergency accounts' Global Administrator uses no change on silence, and an unreviewed item becomes an evidence finding, E oh four, instead. That's the owner's decision. The rest check the default decision, justification, the tier's cadence, the start date, reviewers on Azure series, duplicate names, unlisted series, and a group that holds a reviewed role with no membership series of its own.`,
  `${M} — Unit 2: workbook Chapter 07, "The checks"; examples/privileged-access/powershell/PaAccessReviews/PaAccessReviews.psm1.`);
}

// ================================================================== 6 Plan and evidence
{
  const s = content(SC, "The plan, and the evidence each review produced");
  tag(s, "What");
  const b = table(s, "Plan", 1.45, [2.3, 3.6], ["Action", "What -Apply does"], [
    ["Create, Update", "Sends it, then reads it back"],
    ["Replace", "Leaves it for a person"],
    ["NoChange", "Nothing"],
    ["Unmanaged", "Reports it; never deletes"],
    ["Conflict", "Nothing until it's resolved"],
  ], { fontSize: 12.5, limit: 4.4 });
  table(s, "E", 1.45, [1.4, 4.6], ["Rule", "The evidence finding"], [
    ["E01, E02", "A series missing; an overdue instance"],
    ["E03", "A denial not applied"],
    ["E04", "The no-response default decided"],
    ["E05, E06", "Approved with no reason; a self-review"],
    ["E07", "Bulk decisions by one reviewer"],
    ["E08", "An emergency account denied"],
  ], { fontSize: 12.5, limit: 4.7, x: 6.75 });
  callout(s, "Replace", 5.0, 1.0, "FaListCheck", HEX.navy, "A Replace needs a person: ",
    "a scope change or a change of group reviewers can't go through the update API, so a person exports its evidence first.");
  sources(s, "Sources: Module 7, Unit 2; Microsoft Learn, \"Update accessReviewScheduleDefinition,\" \"List decisions\"; PaAccessReviews.psm1.");
  notes(s,
`The plan compares the reviewed file with the tenant. Create and Update are sent, then read back. Replace is a scope change or a change of group reviewers. Microsoft Learn's reference for updating a definition says the update A P I doesn't take those, so a person exports the series' evidence, deletes it in the portal, and runs again. NoChange does nothing. Unmanaged is a series in the tenant the file doesn't list; it's reported, and never deleted. Then the evidence. Each decision becomes a row, and eight checks find what went wrong: a missing series, an overdue instance, a denial that wasn't applied, an item the no-response default decided, an approval without a reason, a self-review, bulk decisions by one reviewer, and an emergency account a reviewer denied.`,
  `${M} — Unit 2: workbook Chapter 07, "The dry run, the diff and -Apply," "The evidence."`);
}
endModule(SC);

// ================================================================== 7 Try it: tutorial and permissions
{
  const s = content(SL, "Try it: Learn's tutorial, and each task's permissions");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/privileged-access",
    "PS> Invoke-Pester -Path tests/AccessReviews.Tests.ps1 -FullNameFilter '*(Learn), run as published*' -Output None -PassThru |",
    "      Select-Object PassedCount, FailedCount",
    "PassedCount FailedCount",
    "----------- -----------",
    "         11           0",
    "# Step 2: list each task's permissions",
    "PS> Import-Module ./powershell/PaAccessReviews/PaAccessReviews.psm1",
    "PS> 'access-reviews-plan', 'access-reviews-apply', 'access-reviews-evidence' | ForEach-Object { Get-PaArRequiredPermission -Task $_ } |",
    "      Format-Table Task, GraphPermissions, AzureRoles",
    "Task                    GraphPermissions             AzureRoles",
    "----                    ----------------             ----------",
    "access-reviews-plan     {AccessReview.Read.All}      {Reader}",
    "access-reviews-apply    {AccessReview.ReadWrite.All} {User Access Administrator}",
    "access-reviews-evidence {AccessReview.Read.All}      {Reader}",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026", pt: 10.5 });
  line(s, "Read", "The third test shows the tutorial's POST, sent twice, leaves two series with the same name.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 1 and 2; Microsoft Learn, \"Review access to administrative roles using access reviews APIs.\"");
  notes(s,
`Try it. Lab 1 runs in one PowerShell 7 session. Step one runs Microsoft Learn's tutorial for reviewing access to administrative roles against the fake, as published. Eleven tests pass. The third is the one to notice: the tutorial's POST, sent twice, leaves two series with the same name. That's why the code plans before it writes, and why rule A R twelve exists. Step two lists each task's permissions. Planning needs Access Review dot Read dot All, and Reader for the Azure series. Applying needs Access Review dot ReadWrite dot All, and User Access Administrator. Reading the evidence needs the same as planning. Write only to apply.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 8 Try it: plan
{
  const s = content(SL, "Try it: the dry run and the diff");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "# Lab 1, step 3",
    "PS> ./Invoke-PaAccessReviews.ps1 -Cloud gcc -Mode Plan -ConfigPath tests/fixtures/ch07/access-reviews.json `",
    "      -FixturePath tests/fixtures/ch07/tenant.json -AsOf 2026-10-30 -OutputPath out/reviews-plan",
    "Plan: 1 Create, 2 Update, 1 Replace, 3 NoChange, 1 Unmanaged",
    "Checks: 0 Finding, 1 Warn, 1 Info",
    "Dry run: nothing sent (2 write(s) would be sent with -Apply)",
    "# Step 4: read the diff",
    "PS> Get-Content out/reviews-plan/plan.json -Raw | ConvertFrom-Json |",
    "      Format-Table name, action, @{ n = 'changes'; e = { $_.changes -join ', ' } }",
    "name                                       action    changes",
    "PAR-T0-GlobalAdministrator-Monthly         Update    settings.instanceDurationInDays",
    "PAR-T0-PrivilegedRoleAdministrator-Monthly Create",
    "PAR-T1-ExchangeAdministrator-Quarterly     Replace   reviewers",
    "PAR-PRV-T0-GlobalAdmin-Monthly             NoChange",
    "PAR-PRV-T0-PrivRoleAdmin-Monthly           NoChange",
    "PAR-PRV-T1-ExchangeAdmin-Quarterly         NoChange",
    "PAR-AZ-T0-Owner-Platform-Monthly           Update    settings.instanceDurationInDays",
    "PAR-T0-SecurityAdministrator-Monthly       Unmanaged",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (THE \"Written to\" LINE AND A HEADER RULE LEFT OUT)", pt: 10.5 });
  line(s, "Read", "The two writes are the Graph ones; the Azure update needs -IncludePreview. bodies/ holds each request body for review.", c + 0.2, 0.45, 13);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 3 and 4; examples/privileged-access: Invoke-PaAccessReviews.ps1, tests/fixtures/ch07 (fictional).");
  notes(s,
`Step three runs the dry run. One Create, two Updates, one Replace, three NoChange and one Unmanaged. The checks: no findings, one warning, one information item. Nothing is sent; two writes would be sent with Apply. Step four reads the diff. The Tier 0 Global Administrator series is an Update: its instance duration changes. The Privileged Role Administrator series doesn't exist yet: Create. The Exchange Administrator series changes its reviewers, so it's a Replace, left for a person. Three P R V group series match. The Azure Owner series is an Update too, but it goes through a preview A P I, so it needs the Include Preview switch; that's why only two writes count. And a Security Administrator series in the tenant isn't in the file: Unmanaged, never deleted. The bodies folder holds each request body for a reviewer to read.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 3 and 4.`);
}

// ================================================================== 9 Try it: Learn's body and apply
{
  const s = content(SL, "Try it: check Learn's body, then apply in the fake");
  tag(s, "How");
  const c = code(s, "Apply", 0.6, 1.45, 12.15, [
    "# Lab 1, step 5: check Learn's body with the example's rules",
    "PS> . ./tests/AccessReviewsSampleHarness.ps1",
    "PS> Test-PaArDefinition -Body (Get-ArTutorialCreateRequest).Body -AsOf 2026-10-30 | Format-Table Rule, Severity",
    "PA-AR-02 Finding   PA-AR-03 Finding   PA-AR-05 Finding   PA-AR-07 Warn   PA-AR-10 Warn",
    "# Step 6: apply in the fake (the same command as step 3, with -OutputPath out/reviews-apply -Apply)",
    "Applied: 2 write(s) sent; Replace and Unmanaged series are left for a person",
    "PS> Get-Content out/reviews-apply/results.json -Raw | ConvertFrom-Json | Format-Table Name, Action, Result, Note",
    "PAR-T0-GlobalAdministrator-Monthly         Update    Sent    read back",
    "PAR-T0-PrivilegedRoleAdministrator-Monthly Create    Sent    read back",
    "PAR-T1-ExchangeAdministrator-Quarterly     Replace   Skipped needs a person: export its evidence, delete it in the portal, rerun",
    "PAR-PRV-T0-GlobalAdmin-Monthly ...         NoChange  Skipped matches the tenant   (and the two other PRV series)",
    "PAR-AZ-T0-Owner-Platform-Monthly           Update    Skipped Azure role reviews use a preview API; pass -IncludePreview",
    "PAR-T0-SecurityAdministrator-Monthly       Unmanaged Skipped not in the reviewed JSON; never deleted",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (CONDENSED: TABLE HEADERS LEFT OUT, ROWS JOINED OR GROUPED)", pt: 10.5 });
  line(s, "Read", "Learn's tutorial body fails three of the program's rules: no fallback reviewer, no description, auto-apply off.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 5 and 6; Microsoft Learn, \"Review access to administrative roles using access reviews APIs.\"");
  notes(s,
`Step five checks the body from Microsoft Learn's tutorial with the example's rules. It fails three: A R oh two, no fallback reviewer; oh three, no description for reviewers; and oh five, auto-apply off. And it warns twice: oh seven, the no-response default isn't Deny, and ten, its start date is in the past. Step six applies in the fake, the same command as the dry run, with Apply. Two writes are sent: the Global Administrator update and the Privileged Role Administrator create, each read back. Everything else is skipped, with the reason. The Replace needs a person: export its evidence, delete it in the portal, and run again. The three P R V series match. The Azure update needs Include Preview. And the unmanaged series is never deleted. The slide condenses the two tables.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 and 6.`);
}

// ================================================================== 10 Try it: evidence
{
  const s = content(SL, "Try it: read the evidence");
  tag(s, "How");
  const c = code(s, "Ev", 0.6, 1.45, 12.15, [
    "# Lab 1, step 7",
    "PS> ./Invoke-PaAccessReviews.ps1 -Cloud gcc -Mode Evidence -ConfigPath tests/fixtures/ch07/access-reviews.json `",
    "      -FixturePath tests/fixtures/ch07/tenant.json -AsOf 2026-10-30 -OutputPath out/reviews-evidence",
    "Evidence: 18 decisions in 7 instances; 7 Finding, 2 Warn",
    "PS> Get-Content out/reviews-evidence/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object",
    "PA-AR-E01 Finding  PAR-T0-PrivilegedRoleAdministrator-Monthly",
    "PA-AR-E02 Finding  PAR-PRV-T0-GlobalAdmin-Monthly",
    "PA-AR-E08 Finding  PAR-T0-GlobalAdministrator-Monthly / Emergency Access 02",
    "PA-AR-E04 Finding  PAR-T0-GlobalAdministrator-Monthly / Frank Ode",
    "PA-AR-E05 Finding  PAR-T1-ExchangeAdministrator-Quarterly / Carl Ops",
    "PA-AR-E03 Finding  PAR-T1-ExchangeAdministrator-Quarterly / Frank Ode",
    "PA-AR-E04 Warn     PAR-T1-ExchangeAdministrator-Quarterly / Gina Lee",
    "PA-AR-E06 Finding  PAR-PRV-T0-GlobalAdmin-Monthly / Bo Chen",
    "PA-AR-E07 Warn     PAR-T1-ExchangeAdministrator-Quarterly / reviewer a0000000-0000-4000-8000-000000000013",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (THE \"Written to\" LINE AND TABLE HEADER LEFT OUT)", pt: 10.5 });
  line(s, "Read", "PA-AR-E08: a reviewer denied Emergency Access 02 in October.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" step 7; examples/privileged-access/tests/fixtures/ch07 (fictional identities).");
  notes(s,
`Step seven reads the evidence: eighteen decisions in seven instances, with seven findings and two warnings. E oh one: the Privileged Role Administrator series isn't in the tenant yet. E oh two: the Tier 0 Global Administrator group's series has no closed instance in time. E oh eight: a reviewer denied Emergency Access 02 in October, the finding this module exists to catch. E oh four: an item nobody reviewed, decided by the no-response default; a finding on Tier 0, a warning on Tier 1. E oh five: an approval without a justification. E oh three: a denial whose result wasn't applied. E oh six: someone reviewed their own access. And E oh seven: one reviewer recorded a run of identical decisions within minutes, the bulk-decision check from the program's design.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 7.`);
}

// ================================================================== 11 Try it: guard
{
  const s = content(SL, "Try it: the lockout guard refuses");
  tag(s, "How");
  const c = code(s, "Guard", 0.6, 1.45, 12.15, [
    "# Lab 1, step 8",
    "PS> $c = Read-PaArConfig tests/fixtures/ch07/access-reviews.json",
    "PS> ($c.reviews | Where-Object name -EQ 'PAR-T0-GlobalAdministrator-Monthly').defaultDecision = 'Deny'",
    "PS> $client = New-PaArClient -Cloud gcc -Task access-reviews-apply -Invoke (New-PaArFake -Path tests/fixtures/ch07/tenant.json).Invoke",
    "PS> Invoke-PaArApply -Client $client -Plan (Get-PaArPlan -Client $client -Config $c -AsOf 2026-10-30) -Apply",
    "Exception: Refusing -Apply: the plan has 1 Finding(s): PA-AR-06 PAR-T0-GlobalAdministrator-Monthly",
    "",
    "# Step 9: run the tests, then delete out",
    "PS> Invoke-Pester -Path tests",
    "Tests Passed: 330, Failed: 0, Skipped: 0, Inconclusive: 0, NotRun: 0",
    "PS> Remove-Item -Recurse -Force out",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (PESTER'S SUMMARY ON ONE LINE)", pt: 10.5 });
  const l = panel(s, "None", 0.6, c + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "NOTHING IS SENT", null, [
    "Deny on silence over the emergency accounts' Global Administrator is a Finding",
  ], 13);
  panel(s, "Out", 6.85, c + 0.25, 5.9, null, HEX.red, HEX.redTint, "DELETE out", null, [
    "The evidence folder names people",
  ], 13);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 8 and 9; examples/privileged-access/powershell/PaAccessReviews/PaAccessReviews.psm1.");
  notes(s,
`Step eight shows the lockout guard. Load the reviewed file, and change one thing: set the Tier 0 Global Administrator series' default decision to Deny. Then build a client that may write, plan, and apply. It refuses: the plan has one finding, A R oh six, on the Global Administrator series. Nothing is sent. If the reviewers missed a month, that review would have removed the emergency accounts' Global Administrator. Step nine runs the tests, three hundred thirty pass, and you delete the output folder, because the evidence folder names people.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 8 and 9.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: one series in your test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant with Entra ID Governance (a trial will do), never production"],
    ["Pick a role", "One with no real holders, such as Reports Reader, not Global Administrator"],
    ["Plan and apply", "A reader app and an applier app; a test JSON with one series; dry-run, then apply after a second person reads bodies/"],
    ["Evidence", "Close one instance as a test reviewer, and read the evidence"],
    ["Permissions", "AccessReview.Read.All for the reader; AccessReview.ReadWrite.All for the applier; User Access Administrator only for the optional Azure series"],
    ["Back it out", "Export the evidence first; delete the test series in the admin center; the apps, certificates and test groups; out/t-*"],
  ], { fontSize: 12.5, limit: 5.6 });
  callout(s, "NotRun", b + 0.2, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the code never deletes, so the back-out deletes the test series by hand, after exporting its evidence.");
  sources(s, "Sources: Module 7, \"Exercise: Lab 2, your test tenant.\"");
  notes(s,
`Lab 2 runs in a worldwide or G C C test tenant with Microsoft Entra I D Governance, a trial will do, and for the optional Azure step, a test Azure subscription. Never production. Pick a role with no real holders, such as Reports Reader, not Global Administrator. Register a reader app and an applier app, write a test file with one series, dry-run as the reader, and apply after a second person reads the bodies. Then close one instance as a test reviewer, and read the evidence. The reader gets Access Review dot Read dot All, the applier Access Review dot ReadWrite dot All, and User Access Administrator only for the optional Azure series. The back-out exports the evidence first, then deletes the test series in the admin center, because the code never deletes, along with the apps, their certificates and the test groups. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence for Module 7");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.2, 2.6, 4.35], ["Requirement", "KSI", "Evidence"], [
    ["AC-6(7), AC-2: every privileged role and PRV group has a series with the tier's cadence", "KSI-IAM-AAM, -JIT", "PA-AR-01, 02, 05, 08, 09, 14"],
    ["AC-6(7), AC-2, AC-5: each decision, and what went wrong", "KSI-IAM-AAM, -JIT", "decisions.csv, instances.json; PA-AR-E01 to E08"],
    ["AC-2: the emergency accounts stay usable", "KSI-IAM-JIT", "The PA-AR-06 refusal"],
    ["CM-3: what a run would change; an apply that never deletes", "KSI-CMT-LMC, -RMV", "plan.json and bodies/; results.json"],
    ["AU-11: the evidence exported before a series is deleted", "KSI-MLA-OSM", "The exported evidence folder"],
    ["AC-6: least privilege for each identity", "KSI-IAM-ELP", "Read to plan and read evidence; write only to apply"],
  ], { fontSize: 11, limit: 5.3 });
  panel(s, "Keep", 0.6, b + 0.2, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "The reviewed JSON and each plan's bodies/; each apply's results.json; each evidence run's decisions.csv, instances.json and findings.json, access-controlled",
  ], 12);
  sources(s, "Sources: Module 7, \"Introduction,\" \"Summary\"; NIST SP 800-53 Rev. 5; FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. The review series and their decisions are the evidence for the plan's tasks A2.7 and A3.7. From NIST special publication eight hundred fifty-three they support A C six, enhancement seven, review of user privileges; A C two, account review; A C five, separation of duties; and A U eleven, retention. A C six, enhancement seven, and A C two leave the frequency to the organization; monthly for Tier 0 and quarterly for the rest is the program's own decision, design guidance. The evidence an ISSO keeps: the reviewed file and each plan's bodies; each apply's results; and each evidence run's decisions, instances and findings, in the access-controlled evidence store, because they name people.`,
  `${M} — Unit "Introduction" (the federal requirement and its table); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on access reviews", [
    { q: "A Global Administrator review covers active assignments, with Deny on silence and auto-apply on. What does PA-AR-06 do?", options: ["a. Nothing; Deny is the program's default", "b. Fails it: missing one month would remove the emergency accounts' Global Administrator", "c. Turns auto-apply off"] },
    { q: "The plan shows a series as Replace. What does -Apply do with it?", options: ["a. Deletes and recreates it", "b. Skips it: a person exports its evidence and replaces it", "c. PUTs the new scope"] },
  ], "1 b: seen in Lab 1, step 8. 2 b: the update API doesn't take a new scope or new group reviewers; seen in step 6.");
  sources(s, "Sources: Module 7, \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: a Global Administrator review covers active assignments, with Deny on silence and auto-apply on. What does A R oh six do? The answer is b: it fails the review, because missing one month would remove the emergency accounts' Global Administrator. You saw it in Lab 1, step eight. Second: the plan shows a series as Replace. What does the apply do with it? The answer is b: it skips it. The update A P I doesn't take a new scope or new group reviewers, so a person exports the series' evidence and replaces it. You saw it in step six. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 8, evidence and drift");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Planned seven review series against a fictional tenant",
    "Saw Learn's tutorial body fail the program's rules",
    "Applied two writes, and left the Replace and the unmanaged series to a person",
    "Read 18 decisions and their findings, and saw the lockout guard refuse",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 8: Evidence and drift for the ISSO", [
    "The privileged reads on a schedule",
    "A hash-chained period for Gate 4",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaUserShield", HEX.teal, "Carry forward: ",
    "the decisions are evidence; they live in the access-controlled evidence store because they name people.");
  sources(s, "Sources: Module 7, \"Summary\"; Module 8, \"Introduction.\"");
  notes(s,
`To sum up. You planned seven review series against a fictional tenant, saw Learn's tutorial body fail the program's rules, applied two writes and left the Replace and the unmanaged series to a person, read eighteen decisions and their findings, and saw the lockout guard refuse a review that would remove the emergency accounts. Next is Module 8: evidence and drift for the ISSO, the last module of the path. You run the privileged reads on a schedule, say what changed since the last run without putting anyone's name in the issue tracker, and hand the ISSO a package and a period summary they can check with a hash tool alone.`,
  `${M} — Unit "Summary"; Module 8 — "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 7 deck", [
  "Module page: docs/training/privileged-access/07-access-reviews.md (Privileged Access learning path, Module 7): Introduction, its lockout callout and requirement table, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "Original sources, as workbook Chapter 07 footnotes them: Microsoft Learn, \"Review access to administrative roles using access reviews APIs\"; \"Configure access reviewers\"; \"Create definitions\"; \"Update accessReviewScheduleDefinition\"; \"accessReviewScheduleSettings resource type\"; \"List decisions\"; \"Create an access review of PIM for Groups (preview)\"; \"Microsoft Entra ID Governance licensing fundamentals\"; NIST SP 800-53 Rev. 5; FedRAMP, \"Key Security Indicators.\"",
  "Kit: examples/privileged-access (Invoke-PaAccessReviews.ps1; powershell/PaAccessReviews; config/calls-ch07.json; tests/AccessReviews.Tests.ps1 and its sample harness; tests/fixtures/ch07). Fictional identities. Illustrative: tested against fixtures and a fake, not run against a production tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7.6.9 and Pester 5.9.0 in a scratch copy of examples/, outside the repository; it matched data/kit-captures/pa/07-1.txt to 07-10.txt. Output is condensed where the slides say so. Verification: docs/training/privileged-access/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
