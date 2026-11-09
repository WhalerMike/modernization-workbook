// Non-Person Identity learning path, Module 2: Owners, sponsors and the orphan rule — the module's narrated deck.
// Teaches docs/training/non-person-identity/02-owners-and-the-orphan-rule.md, Learn-style: objectives, the concepts,
// three "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of
// examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it), Lab 2, the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, the path's
// verification log, the guide's Steps 1f and 6 and workbook Chapter 02 that the page sends the learner to, or the
// kit; the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-2/build.js \
//                      presentations/training-npi-module-2/Training_NPI_Module_2.pptx
const TITLE = "Module 2: Owners, sponsors and the orphan rule";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 2: Owners, sponsors and the orphan rule",
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
const OUT = process.argv[2] || "Training_NPI_Module_2.pptx";
const M = "Training, Non-Person Identity, Module 2";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 2: Owners, sponsors and the orphan rule", "Non-Person Identity learning path · Gates G1 Inventory and G6 Lifecycle · Chapter 02",
    ["Why owners are a control  ·  The program's rule  ·  The check  ·  The orphan rule as a plan", "The write path  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 2 of the Non-Person Identity learning path: owners, sponsors and the orphan rule. In Module 1 you read every non-person identity into one register. Now you check who answers for each one. Ownership is part of Gate 1, Inventory, and the orphan rule is part of Gate 6, Lifecycle, and both come from Chapter 2 of the developer workbook. You'll check every identity for two human owners and an active service record, and build the orphan rule as a plan that a reviewer approves by its hash before anything changes. The code runs on your laptop, against the same fictional estate. It's illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why owners are a control, not a contact list");
  tag(s, "Why");
  const l = panel(s, "Owner", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "WHAT AN OWNER CAN DO", "Add a credential, and act as the app", [
    "So owners are a control, not a contact list",
    "The program wants two human owners on every app registration and service principal",
    "And a record in the system inventory",
  ], 13.5);
  const r = panel(s, "Orphan", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "AN IDENTITY WITH NO OWNER", "An orphan", [
    "Every AD account needs an application owner, found before the account is touched",
    "Decision D-NP2 says what happens to an orphan",
    "Never delete",
  ], 13.5);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaUserShield", HEX.red, "This module: ",
    "check ownership as code, and build the orphan rule as a plan a reviewer approves by its hash before anything changes.");
  sources(s, "Sources: Module 2, \"Introduction\"; Learn, Overview of enterprise application ownership in Microsoft Entra ID; the program's design guidance.");
  notes(s,
`Why does ownership matter so much? Because, as the program's guidance on app ownership warns, an owner can add a credential to an app, and then act as the app. So owners are a control, not a contact list. The program wants two human owners on every app registration and service principal, a record in the system inventory, and an application owner for every Active Directory account, found before the account is touched. An identity with no owner is an orphan, and the plan's decision D N P 2 says what happens to it. Whatever happens, the rule is never delete. In this module you check ownership as code, and you build the orphan rule as a plan that a reviewer approves by its hash, before anything changes.`,
  `${M} — Unit "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 2", [
    "State the program's ownership rule, and which owners the code counts as valid",
    "Explain D-NP2, the orphan rule, and how it differs from the program's orphaned-app policy",
    "Run the ownership check and read its findings and its orphan plan",
    "Show that the write path dry-runs without -Apply and refuses a plan whose hash nobody approved",
  ], [
    "Module 1: this module checks its register",
    "The guide's record each identity joins to: the owner and sponsor fields",
    "Lab 1: PowerShell 7.1+ with Pester 5, and a clone; no tenant",
  ], 60);
  sources(s, "Sources: Module 2, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty minutes with the lab. You'll state the program's ownership rule, and which owners the code counts as valid. You'll explain D N P 2, the orphan rule, and how it differs from the program's own policy for orphaned apps. You'll run the ownership check and read its findings and its orphan plan. And you'll show that the write path only dry-runs without the Apply switch, and refuses a plan whose hash nobody approved. Before you start, finish Module 1, because this module checks Module 1's register. And read the guide's record each identity joins to, for the owner and sponsor fields. Lab 1 needs PowerShell 7.1 or later with Pester 5, and a clone of the repository. No tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Owners and sponsors in the guide
{
  const s = content(SC, "Owners and sponsors in the guide: Step 1f and Step 6");
  tag(s, "What");
  const l = panel(s, "1f", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "STEP 1F  ·  JOIN TO THE RECORD", "Who answers for each identity", [
    "Two human owners for every app registration and service principal, never service accounts",
    "The business approver goes in the registry and serviceManagementReference",
    "A sponsor who is a federal employee mastered in HR; a contractor can't be the only sponsor",
  ], 12.5);
  const r = panel(s, "6", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "STEP 6  ·  THE LIFECYCLE", "Owner change, orphans, decommissioning", [
    "An owner who leaves starts a transfer at least ten business days ahead",
    "Orphans: an app with no named owner in the registry or the Owners list",
    "Decommissioning: disable first, then delete",
  ], 12.5);
  sources(s, "Sources: Module 2, Unit 1; the guide, Steps 1f and 6 (the program's design guidance); Learn, Deactivate an app registration.");
  notes(s,
`Unit 1 is the guide. Step 1 f joins each identity to its record and names who answers for it. In the program's design guidance, every app registration and service principal gets two human owners, never service accounts. The Owners list holds only the people who configure the app; the business approver goes in the registry and in the service management reference, because an owner can add a credential and act as the app. And each identity gets a sponsor who is a federal employee mastered in HR. A contractor can build or run a workload, but can't be its only sponsor. Then Step 6 runs the lifecycle. An owner who leaves or changes roles starts a transfer at least ten business days ahead. An app with no named owner is an orphan. And decommissioning always disables first, then deletes; Microsoft Learn's Deactivate an app registration documentation describes the reversible switch.`,
  `${M} — Unit 1 "Owners and sponsors in the guide"; the guide — Step 1f; Step 6, "Owner change," "Orphans," "Decommissioning."`);
}

// ================================================================== 5 The rule the code holds
{
  const s = content(SC, "The rule the code holds: stricter than Learn's");
  tag(s, "What");
  const b = table(s, "Rule", 1.45, [3.0, 4.35, 4.8], ["", "Learn", "The program (design guidance)"], [
    ["Owners", "At least two where possible; a service principal's owners are users or service principals", "Two human owners: a user, a member and enabled. Not service principals or guests"],
    ["The record", "serviceManagementReference for the team contact from the asset database", "A reference that names a record in the system inventory (D-NP1), not free text"],
    ["AD accounts", "No owners attribute the code can trust", "An application owner, from an owners file kept with the record"],
  ], { fontSize: 12.5, limit: 4.3 });
  callout(s, "Disable", b + 0.3, 0.95, "FaShieldHalved", HEX.navy, "Disable, never delete: ",
    "Learn's deactivation procedure is on beta, so the code sets accountEnabled to false on the tenant's service principal, on v1.0.");
  sources(s, "Sources: Learn, Overview of enterprise application ownership; Get-MgServicePrincipalOwner; Deactivate an app registration; Disable user sign-in for an application.");
  notes(s,
`Unit 2 reads the rule the code holds. Microsoft Learn's enterprise application ownership documentation recommends at least two owners where possible, and its Get M G Service Principal Owner reference describes a service principal's owners as users or service principals. The program's rule is stricter, and it's design guidance. Two human owners, never service accounts, and not service principals or guests: the code counts an owner only if it's a user, a member, and enabled. A service management reference that names a record in the system inventory, not free text. And for every Active Directory account, an application owner, which comes from an owners file kept with the record, because the directory has no owners attribute the code can trust. Then disable, never delete. Microsoft Learn's Deactivate an app registration procedure is on the beta endpoint, so the code disables the tenant's service principal instead, on version one point oh.`,
  `${M} — Unit 2 "The check and the plan": workbook Chapter 02, "The rule the code holds."`);
}

// ================================================================== 6 D-NP2
{
  const s = content(SC, "The orphan rule, D-NP2, and the orphaned-app policy");
  tag(s, "What");
  const l = panel(s, "DN2", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "D-NP2  ·  THE PLAN'S DECISION, OWNED BY THE CISO", "What the code follows", [
    "Disable once the identity governance officer confirms the finding",
    "Then 30 days for the office to name an owner or retire it",
    "Never delete",
  ], 13);
  const r = panel(s, "B04", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "THE PROGRAM'S ORPHANED-APP POLICY", "Runs the other way round", [
    "30 days to assign an owner",
    "Then access suspended on day 31",
    "The program's rule for AI agents disables first",
  ], 13);
  callout(s, "Settled", Math.max(l, r) + 0.3, 0.95, "FaScaleBalanced", HEX.teal, "Settled: ",
    "the program follows D-NP2, the stricter rule: disable first, then the 30-day claim window. The guide and the code both follow it.");
  sources(s, "Sources: Module 2, Unit 2; the program's decision D-NP2 and governance policy (design guidance); Learn, Governing Microsoft Entra service accounts.");
  notes(s,
`Now the orphan rule itself. The plan's decision D N P 2, which the C I S O owns, says: disable the identity once the identity governance officer confirms the finding, then allow thirty days for the office to name an owner or retire it. Never delete. The program's own governance policy for orphaned apps runs the other way round: thirty days to assign an owner, then access is suspended on day thirty-one. And the program's rule for AI agents disables first, because an agent can act. The program settled on D N P 2, the stricter of the two: disable first, then thirty days to claim it. The guide's Orphans step and the code both follow it. Microsoft Learn's Governing Microsoft Entra service accounts documentation agrees on the shape: disable, but don't delete until the review is complete.`,
  `${M} — Unit 2: workbook Chapter 02, "The rule the code holds"; the guide — Step 6, "Orphans"; Knowledge check answer 2.`);
}

// ================================================================== 7 The check
{
  const s = content(SC, "The check: NPI-OWN-01 to NPI-OWN-09");
  tag(s, "What");
  const b = table(s, "Own", 1.45, [1.7, 1.2, 9.25], ["Rule", "Severity", "What it flags"], [
    ["NPI-OWN-01", "Finding", "An app registration or legacy service principal with no valid human owner: an orphan candidate"],
    ["NPI-OWN-02", "Finding", "One valid human owner"],
    ["NPI-OWN-03 to 05", "Warn", "An owner that is a service principal; a guest; disabled or not found"],
    ["NPI-OWN-06", "Finding", "No service-management reference"],
    ["NPI-OWN-07", "Finding", "A reference that isn't a record key, names no record, or names a retired one"],
    ["NPI-OWN-08", "Finding", "An AD account with no valid application owner in the owners file: an orphan candidate"],
    ["NPI-OWN-09", "Info", "An AD account found only by a password that never expires, not checked until confirmed"],
  ], { fontSize: 12.5, limit: 5.3 });
  line(s, "AI", "The AI sponsor fields are recorded, empty, for every agent identity and AI record; Module 9 checks them.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Learn, Get a user; Overview of enterprise application ownership; the program's design guidance (the rules); examples/non-person-identity (NpiOwnership).");
  notes(s,
`The check reads each owner once, with only User dot Read dot All, and applies nine rules, N P I O W N oh one to oh nine. Oh one is an app registration or legacy service principal with no valid human owner, which makes it an orphan candidate. Oh two is one valid owner, not two. Oh three, four and five are warnings: an owner that's a service principal, a guest, or disabled or not found. Oh six is no service management reference, and oh seven a reference that names no record, or a retired one. Oh eight is an Active Directory account with no valid application owner in the owners file, another orphan candidate. And oh nine, information only, is an account Module 1 found only by a password that never expires. The fields for AI sponsors are recorded, empty, for Module 9 to check.`,
  `${M} — Unit 2 "The check and the plan": workbook Chapter 02, "The check."`);
}

// ================================================================== 8 The plan and the write path
{
  const s = content(SC, "The orphan plan, and the separate write path");
  tag(s, "What");
  const l = panel(s, "Plan", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE PLAN  ·  NOTHING IN IT WRITES", "One action per candidate and claim", [
    "Disable and AddOwner write, after review; every other action only records",
    "AwaitConfirmation, ClaimWindowOpen, RetirementCandidate, NomineeRefused, RecordOwner and more",
    "Same inputs, same plan, byte for byte: a reviewer approves a hash",
  ], 12.5);
  const r = panel(s, "Write", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "INVOKE-NPIORPHANACTION.PS1", "Refuses to run unless", [
    "The plan's SHA-256 is the approved one",
    "It's for this tenant and cloud, no more than seven days old",
    "The only PATCH body is accountEnabled false; DELETE is never sent",
  ], 12.5);
  callout(s, "Person", Math.max(l, r) + 0.3, 0.95, "FaUserShield", HEX.teal, "A person, not an app: ",
    "Application.ReadWrite.All can let an app act as other entities, and disabling is never automatic.");
  sources(s, "Sources: Learn, Microsoft Graph permissions reference; Update servicePrincipal; the kit's design (examples/non-person-identity, Invoke-NpiOrphanAction.ps1).");
  notes(s,
`The check's orphan candidates and the owners' claims become a plan, one action each, and nothing in the plan writes. Only two kinds of action can write, after review: Disable, and AddOwner, for a claim that names an enabled member. The rest only record: waiting for the officer's confirmation, a claim window still open, a retirement candidate, a refused nominee. The same inputs give the same plan, byte for byte, so a reviewer approves a hash. Then a separate script, the only code in the example that can write, runs the plan. It refuses unless the plan's hash is the approved one, the plan is for this tenant and cloud and no more than seven days old, and each write is declared. The only PATCH body it allows sets account enabled to false, and it never sends a delete. And a live run is a person's session, never an app's, because Microsoft Learn's Graph permissions reference warns that this write permission can let an app act as other entities, and the program's rule is that disabling is never automatic.`,
  `${M} — Unit 2: workbook Chapter 02, "The orphan rule as a plan," "The separate write path"; Knowledge check answer 5.`);
}
endModule(SC);

// ================================================================== 9 Try it: permissions and the check
{
  const s = content(SL, "Try it: the permissions, and the ownership check");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 to 4, in examples/non-person-identity (step 1 makes Module 1's register; step 2: 10 passed, 20 not run)",
    "$ Import-Module ./powershell/NpiOwnership/NpiOwnership.psm1",
    "$ foreach ($t in 'ownership', 'orphan-apply') { $p = Get-NpiRequiredPermission -Task $t; \\",
    "    \"$t : \" + ($p.GraphPermissions -join ', ') }",
    "ownership : User.Read.All",
    "orphan-apply : Application.Read.All, Application.ReadWrite.All, Directory.Read.All, User.Read.All",
    "",
    "$ ./Invoke-NpiOwnership.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json \\",
    "    -InputPath tests/fixtures/inputs -OutputPath out/ownership",
    "Ownership: 22 identities checked; 7 orphan candidates",
    "Findings: 20 Finding, 3 Warn, 1 Info. AI sponsor fields recorded for Chapter 09: 2",
    "Orphan plan: 10 actions, 3 of them writes (1 AddOwner, 2 Disable); nothing sent",
    "Plan SHA-256: 1e1799d7181bd1a3dc271c645fff8a60fc741ab1ebc219bb3011cc25953bad3e",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 10.5 });
  line(s, "Read", "The check reads people only; the write task is separate. The plan's hash is the same on every run with these inputs.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 1 to 4; examples/non-person-identity: Invoke-NpiOwnership.ps1, tests/fixtures/inputs (fictional).");
  notes(s,
`Try it. Lab 1 runs in the non-person identity folder, in PowerShell 7, on the fictional estate. Step one makes Module 1's register, because this check reads it. Step two sends the samples from Microsoft Learn's Graph applications tutorial to the fake: ten pass, and the twenty not run are Chapter 1's. Step three lists what each task needs. The ownership check needs only User dot Read dot All: it reads people, nothing else. The write task is separate, and it's the one that holds Application dot ReadWrite dot All. Step four checks ownership and builds the plan. Twenty-two identities are checked, and seven are orphan candidates. That's twenty findings, three warnings and one information item. The orphan plan has ten actions, and three of them write: one AddOwner and two disables. Nothing is sent. And the plan's hash is the same on every run with these inputs.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 4.`);
}

// ================================================================== 10 Try it: findings and plan
{
  const s = content(SL, "Try it: read the findings and the orphan plan");
  tag(s, "How");
  const c = code(s, "Find", 0.6, 1.45, 4.0, [
    "# Step 5: findings by rule",
    "Name       Count",
    "----       -----",
    "NPI-OWN-01     2",
    "NPI-OWN-02     4",
    "NPI-OWN-06     6",
    "NPI-OWN-07     3",
    "NPI-OWN-08     5",
  ], { label: "STEP 5  ·  RUN NOVEMBER 3, 2026", pt: 11 });
  code(s, "Plan", 4.85, 1.45, 7.9, [
    "# Step 6: Format-Table Action, Name, Write",
    "Action              Name               Write",
    "------              ----               -----",
    "Disable             svc-backup          True",
    "AwaitConfirmation   svc-oldftp         False",
    "RetirementCandidate svc-reports        False",
    "ClaimWindowOpen     sa-printsvc        False",
    "Exception           gmsa-ops$          False",
    "Disable             Legacy Reports      True",
    "AwaitConfirmation   Old SAML Connector False",
    "AddOwner            HR Connector        True",
    "NomineeRefused      Build Pipeline     False",
    "RecordOwner         svc-oldftp         False",
  ], { label: "STEP 6  ·  RUN NOVEMBER 3, 2026", pt: 11 });
  panel(s, "Read", 0.6, c + 0.25, 4.0, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "Legacy Reports and Old SAML Connector: no valid owner",
    "Build Pipeline, Vendor Portal: one each",
  ], 12);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 5 and 6; examples/non-person-identity/tests/fixtures (fictional estate).");
  notes(s,
`Step five groups the findings by rule. Two apps have no valid owner at all: Legacy Reports and Old SAML Connector. Four have only one valid owner. Build Pipeline's second owner is a service principal, and Vendor Portal's is a guest, so each counts only one. Six have no service management reference, three have a reference to a record that isn't active, and five directory accounts have no valid application owner. Step six reads the plan's ten actions. Three write: Disable for svc backup and for Legacy Reports, and AddOwner for HR Connector, from a claim. svc reports is a retirement candidate: it was disabled, and nobody claimed it in thirty days. And the claim for Build Pipeline named a guest, so the nominee is refused.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 and 6.`);
}

// ================================================================== 11 Try it: dry run, apply, refuse
{
  const s = content(SL, "Try it: dry-run, apply, and a hash nobody approved");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Step 7: dry-run with the approved hash",
    "$ $sha = (Get-FileHash out/ownership/orphan-plan.json -Algorithm SHA256).Hash.ToLower()",
    "$ ./Invoke-NpiOrphanAction.ps1 -Cloud gcc -PlanPath out/ownership/orphan-plan.json -ApprovedSha256 $sha ... -OutputPath out/orphan-dryrun",
    "DryRun: 3 WouldSend",
    "  WouldSend Disable  WRITE Disable-ADAccount -Identity ad000000-0000-4000-8000-000000000003",
    "  WouldSend Disable  PATCH https://graph.microsoft.com/v1.0/servicePrincipals/5b000000-0000-4000-8000-000000000003",
    "  WouldSend AddOwner POST https://graph.microsoft.com/v1.0/applications/0a000000-.../owners/$ref",
    "# Step 8: apply to the fake (-Apply), then a hash nobody approved ('0' * 64)",
    "Apply: 3 Sent",
    "The plan's SHA-256 is 1e1799d7..., not the approved 0000...; refusing to run a plan nobody reviewed.",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Tests", "results.json: record DisabledOn 2026-10-30; the claim window ends 2026-11-29. Step 9: 513 tests passed, 0 failed.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 7 to 9; path verification log, claim 10; examples/non-person-identity/Invoke-NpiOrphanAction.ps1.");
  notes(s,
`Step seven computes the plan's hash and dry-runs the plan with it. Without the Apply switch, the write path runs its prechecks and stops, reporting three writes it would send: a directory disable for svc backup, a PATCH that turns off the Legacy Reports service principal, and a POST that adds an owner to HR Connector. Step eight sends them to the fake with Apply: three sent. In the results file, each disable tells the operator to record disabled on October thirtieth, and that the claim window ends November twenty-ninth. Then you run the same plan with a hash of all zeros, which nobody approved, and it refuses to run a plan nobody reviewed. Step nine runs every test: five hundred thirteen pass. Delete the output folder when you're done, because it names accounts and owners.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 7 to 9; verification log, claim 10.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: two test orphans in your own tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant and a test AD domain, never production, with fictional people, and Module 1's Lab 2 run"],
    ["Make two orphans", "An app registration with no owners, and a test service account"],
    ["Check", "Run the check with an app holding only User.Read.All"],
    ["Confirm and approve", "Confirm both as the identity governance officer; a second person approves the plan's hash"],
    ["Run it", "Dry-run, then apply, as a person with Cloud Application Administrator"],
    ["Back it out", "Step 6: accountEnabled back to true, enable the account, delete both test objects, the test app and the out folders"],
  ], { fontSize: 12.5, limit: 5.4 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 02, Lab 2, which has the exact commands.");
  sources(s, "Sources: Module 2, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 runs the rule in your own test tenant: worldwide or G C C, with a test Active Directory domain, never production, with fictional people, and with Module 1's Lab 2 already run. Make two test orphans: an app registration with no owners, and a test service account. Run the check with an app that holds only User dot Read dot All. Confirm both orphans as the identity governance officer. Then have a second person approve the plan's hash, which is the separation of duties the evidence records. Dry-run the plan, then apply it, signed in as a person with Cloud Application Administrator. To back it out, step six turns the service principal back on, enables the test account, deletes both test objects and the test app's registration, and deletes the output. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence: G1 and G6");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.4, 3.6, 5.15], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["AC-2 (account managers)", "KSI-IAM-SNU", "ownership.json; findings.json, NPI-OWN-01 to -05, -08, -09"],
    ["IA-4; CM-8", "KSI-IAM-ELP, KSI-IAM-JIT (IA-4); KSI-PIY-GIV (CM-8)", "findings.json, NPI-OWN-06 and -07: an active record"],
    ["AC-2(3) Disable Accounts; CM-3", "KSI-IAM-AAM; KSI-CMT-LMC, KSI-CMT-RVP", "orphan-plan.json and its SHA-256; the apply folder's results and manifest"],
    ["AC-5 Separation of Duties", "KSI-IAM-JIT", "igo-confirmations.csv; the hash approved by a second person"],
    ["AC-6 Least Privilege", "KSI-IAM-ELP, KSI-IAM-JIT", "Get-NpiRequiredPermission for ownership and orphan-apply"],
  ], { fontSize: 11.5, limit: 5.3 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 2, \"Introduction\" (the federal requirement).");
  notes(s,
`The federal requirement. Ownership is part of Gate 1 and the orphan rule part of Gate 6, and the guide's validate steps name A C two, A C two enhancement three, I A four and C M eight, among others. The module's table maps each one to its evidence. For account management, the ownership file and the owner findings. For identifier management and the component inventory, the findings that each identity names an active record. For disabling accounts and change control, the orphan plan with its hash, and the results and manifest from the apply. For separation of duties, the officer's confirmations, and the plan hash approved by a second person. And for least privilege, the permission lists for the two tasks. K S I's are FedRAMP twenty X indicators for cloud service providers; the agency lines its evidence up with them, and the mapping is the program's.`,
  `${M} — Unit "Introduction" (the federal requirement).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on owners", [
    { q: "Which owners does the code count as valid?", options: ["a. Any owner listed on the app", "b. Users who are members and enabled", "c. Users and service principals"] },
    { q: "You run Invoke-NpiOrphanAction.ps1 with an -ApprovedSha256 that isn't the plan's hash. What happens?", options: ["a. It sends the writes and logs a warning", "b. It refuses to run a plan nobody reviewed", "c. It sends only the disables"] },
  ], "1 b: guests and service principals raise warnings, and don't count. 2 b: the write path runs only the hash a reviewer approved.");
  sources(s, "Sources: Module 2, \"Knowledge check,\" questions 1 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: which owners does the code count as valid? The answer is b: users who are members and enabled. A guest or a service principal listed as an owner raises a warning, and doesn't count toward the two. Second: you run the orphan action script with an approved hash that isn't the plan's hash. What happens? The answer is b. It refuses to run a plan nobody reviewed. You saw that refusal in step eight of the lab. The module page has three more questions, each linked to the section that answers it, including how the code disables an orphaned app, and why the write path is a person's session.`,
  `${M} — Unit "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 3, decide the target");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Checked 22 identities for valid owners and active records",
    "Built an orphan plan of ten actions, three of them writes",
    "Dry-ran it and applied it to the fake",
    "Saw the write path refuse a hash nobody approved",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 3: Decide each identity's target", [
    "The matrix proposes a target",
    "The owner decides",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "ownership.json, findings.json, the plan and its approved hash, igo-confirmations.csv, and the dry-run and apply folders, dated.");
  sources(s, "Sources: Module 2, \"Summary\"; Module 3, \"Introduction.\"");
  notes(s,
`To sum up. You checked twenty-two identities for valid owners and active records, built an orphan plan of ten actions with three writes, dry-ran it, applied it to the fake, and saw the write path refuse a hash nobody approved. The evidence an ISSO keeps from this module is the ownership file, the findings, and the orphan plan with its approved hash; the officer's confirmations; and the dry-run and apply folders, with their results and manifests, all dated. Before you ship, work through the chapter's checklist. Next is Module 3: decide each identity's target. A matrix proposes where each identity should end up, the application owner decides, and the ISSO checks the gate.`,
  `${M} — Unit "Summary"; Module 3 — "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 2 deck", [
  "Module page: docs/training/non-person-identity/02-owners-and-the-orphan-rule.md (Non-Person Identity learning path, Module 2): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: what you need for the labs.",
  "What the module links for the design and rules: Non-Person Identity: An Implementation Guide, Step 1f and Step 6 (\"Owner change,\" \"Orphans,\" \"Decommissioning: disable first, then delete\"); workbook Chapter 02, \"The rule the code holds,\" \"The check,\" \"The orphan rule as a plan,\" \"The separate write path.\"",
  "Kit: examples/non-person-identity (Invoke-NpiOwnership.ps1; Invoke-NpiOrphanAction.ps1; powershell/NpiOwnership; config/calls.json; tests/fixtures/estate.json and inputs). Fictional estate. Illustrative: tested against fixtures, not run against a live tenant; -Apply in Lab 1 changes only the fake.",
  "Lab output: run November 3, 2026 with PowerShell 7 and Pester 5 in a scratch copy of examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it; long commands are wrapped and output trimmed where the slides say so. Verification: docs/training/non-person-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
