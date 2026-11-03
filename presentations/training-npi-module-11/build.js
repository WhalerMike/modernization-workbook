// Non-Person Identity learning path, Module 11: Deploy to test, then production — the module's narrated deck.
// Teaches docs/training/non-person-identity/11-deploying-to-test-and-production.md, Learn-style: objectives, the
// concepts, four "Try it" slides with the real Lab 1 dry-run commands and output (run November 3, 2026 in a scratch
// copy of examples/non-person-identity), Lab 2, the federal requirement and evidence, a two-question check, and the
// summary. Chapter 11 is held for review and nobody has run its runbook against a live tenant; the deck says so.
// Every fact comes from the module page, the path's verification log, workbook Chapter 11 that the page sends the
// learner to, or the kit; the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-11/build.js \
//                      presentations/training-npi-module-11/Training_NPI_Module_11.pptx
const TITLE = "Module 11: Deploy to test, then production";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 11: Deploy to test, then production",
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
const OUT = process.argv[2] || "Training_NPI_Module_11.pptx";
const M = "Training, Non-Person Identity, Module 11";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 11: Deploy to test, then production", "Non-Person Identity learning path · Every gate, with workbook Chapter 11 (held for review)",
    ["What the runbook adds  ·  The safe order  ·  The settings file  ·  The five scripts", "The stages and the promotion  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 11 of the Non-Person Identity learning path: deploy to test, then production. This is the last module, and it serves every gate: each step of the runbook names the gate it moves forward. It goes with Chapter 11 of the developer workbook, the deployment runbook. One thing first. Chapter 11 is held for the owner's review, and nobody has run its runbook against a live tenant, subscription or forest. Its deploy scripts are tested against fictional tenants served by a fake, and their dry-run output is real. Every live result in the chapter is labeled Expected. So this module's Lab 1 runs only the dry run, on the kit's fixtures, and you'll read the live stages rather than run them.`,
  `${M} — Unit "Introduction"; the "Chapter 11 is held for review" callout; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a deployment proves what each Lab 2 can't");
  tag(s, "Why");
  const l = panel(s, "Lab2", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "EACH CHAPTER'S LAB 2", "One piece, by hand, backed out", [
    "Proves one piece in a test tenant",
    "Then backs it out",
  ], 13.5);
  const r = panel(s, "Deploy", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "A DEPLOYMENT", "Every piece together", [
    "In an order that can be undone",
    "Against an environment someone depends on",
  ], 13.5);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaRoute", HEX.red, "One set of commands, run twice: ",
    "against a test tenant, subscription and forest, then unchanged against production. Only the settings file changes.");
  sources(s, "Sources: Module 11, \"Introduction\"; workbook Chapter 11, \"What the runbook depends on.\"");
  notes(s,
`Why a runbook? Each chapter's Lab 2 proves one piece in a test tenant, by hand, and then backs it out. A deployment has to prove them together, in an order that can be undone, against an environment someone depends on. So the runbook is one set of commands, run twice. First against an Entra test tenant, an Azure test subscription and an Active Directory test forest. Then, unchanged, against production. Only the settings file changes. In this module you dry-run the scripts that guard that order: the settings check, the preflight, the smoke test, the rollback, and the evidence check that the promotion to production depends on.`,
  `${M} — Unit "Introduction"; workbook Chapter 11 — "What the runbook depends on."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 11", [
    "Explain what the runbook adds to each Lab 2, and why the policies that can block a sign-in come last",
    "Describe the settings file's rules: no secret, no placeholder, and the stage it says it is",
    "Run the preflight, the smoke test and the rollback plan on fixtures, and read their checks",
    "Show that a rollback plan whose SHA-256 nobody approved sends nothing",
    "Explain why a fixture stage can never pass the evidence check, and what production's preflight needs",
  ], [
    "Modules 1 to 10, or at least their Lab 1s",
    "Module 10, for the evidence package and the first-week drift runs",
    "Lab 1: PowerShell 7.1+ with Pester 5, and a clone; no tenant",
  ], 60);
  sources(s, "Sources: Module 11, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty minutes with the lab. You'll explain what the runbook adds to each chapter's Lab 2, and why the policies that can block a sign-in come last. You'll describe the settings file's rules: no secret, no placeholder, and the stage it says it is. You'll run the preflight, the smoke test and the rollback plan on fixtures, and read their checks. You'll show that a rollback plan whose hash nobody approved sends nothing. And you'll explain why a fixture stage can never pass the evidence check, and what production's preflight needs from the test stage. Before you start, finish Modules 1 to 10, or at least their Lab 1s: this module doesn't teach the kit's chapters again. Module 10 matters most, for the evidence package and the first-week drift runs.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Safe order
{
  const s = content(SC, "The safe order: what can block a sign-in comes last");
  tag(s, "What");
  const b = table(s, "Order", 1.45, [0.6, 4.3, 1.0, 6.25], ["#", "Step", "Gate", "Why it's safe at this point"], [
    ["1", "Inventory and owners", "G1", "Read only"],
    ["2", "App management policy, pilot and synthetic app", "G3", "No report-only mode, but only a create or update that breaks it is refused: existing secrets keep working"],
    ["3", "Federated credential and managed identity", "G5", "On the pilot workload, beside the old secret"],
    ["4", "gMSA on a test host", "G5", "After the KDS root key has replicated"],
    ["5", "Conditional Access for workload identities", "G4", "Report-only in test, to estimate its effect; production enables it wave by wave"],
  ], { fontSize: 12.5, limit: 5.3 });
  line(s, "Gates", "The runbook decides nothing the gates decide: it deploys the controls that let each gate pass (design guidance).", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 11, \"Introduction,\" Unit 1; Learn, app management policies; Conditional Access for workload identities; Chapter 11, \"What the runbook depends on.\"");
  notes(s,
`Unit 1 starts with the safe order. Inventory and owners come first, and they only read. Then the app management policy, scoped to a pilot application and a synthetic one. Microsoft Learn documents no report-only mode for these policies, but it says a policy refuses only a create or update that breaks it, so an existing secret keeps working while the pilot runs. Then a federated credential and a managed identity on the pilot workload, beside the old secret. Then a group managed service account on a test host, once the key distribution root key has replicated. And last, Conditional Access for workload identities, in report-only mode, which Learn's Conditional Access documentation lets you use to estimate a policy's effect. In production it's enabled wave by wave, after a reviewed sign-in summary. The runbook decides nothing the gates decide; it deploys the controls that let each gate pass.`,
  `${M} — Unit 1 "What the runbook adds": workbook Chapter 11, "What the runbook depends on" (the safe order).`);
}

// ================================================================== 5 Before you start
{
  const s = content(SC, "Before you start: PIM roles, approvals, a change record");
  tag(s, "What");
  const l = panel(s, "Roles", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "ROLES  ·  DESIGN GUIDANCE", "Every write is a person, through PIM", [
    "Each write is a named person's delegated sign-in, with a role activated through PIM for the change window",
    "The scheduled and read steps sign in as an app with a certificate",
    "Nothing signs in with a secret",
  ], 12.5);
  const r = panel(s, "Approve", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "APPROVALS", "Before each write", [
    "The change record, by the change advisory board",
    "The settings file, by the identity governance officer",
    "Each plan's SHA-256, by a reviewer who isn't the operator",
    "Promotion, by the ISSO and the change advisory board",
  ], 12.5);
  callout(s, "CR", Math.max(l, r) + 0.3, 0.95, "FaClipboardCheck", HEX.navy, "One change record per stage: ",
    "its number goes into the settings file's changeRecord, and every manifest the deploy scripts write repeats it.");
  sources(s, "Sources: Module 11, Unit 1; Learn, Activate a Microsoft Entra role in PIM; Chapter 11, \"Before you start.\"");
  notes(s,
`Before you start, three things are in place. Roles: every write in the runbook is a named person's delegated sign-in, with a role activated through Privileged Identity Management for the change window, which Microsoft Learn's P I M documentation shows how to activate. The scheduled and read steps sign in as an app with a certificate. Nothing signs in with a secret. That rule is this workbook's design guidance, from the kit's write paths. Approvals: the change advisory board approves the change record, the identity governance officer approves the settings file, a reviewer who isn't the operator approves each plan's hash, and the ISSO and the change advisory board approve the promotion to production. And one change record per stage. Its number goes into the settings file, and every manifest the deploy scripts write repeats it.`,
  `${M} — Unit 1 "What the runbook adds": workbook Chapter 11, "Before you start" (Roles, Approvals, The change record).`);
}

// ================================================================== 6 Settings file
{
  const s = content(SC, "The settings file: four rules, checked before any command");
  tag(s, "What");
  const b = table(s, "Rules", 1.45, [3.0, 9.15], ["Rule (design guidance)", "What Read-NpiDeploySettings does"], [
    ["No secrets", "A field named like a secret, or a value shaped like a client secret or a PEM key, stops the run; identities are named by client ID and certificate thumbprint"],
    ["No placeholders", "A value still shaped like <tenant-id> stops the run"],
    ["The stage it says it is", "The file's environment must match the stage the command is told to run"],
    ["The same commands for both stages", "Every value comes from the file: moving from test to production changes the file and nothing else"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "One", b + 0.3, 0.95, "FaFileShield", HEX.navy, "One JSON file per stage: ",
    "the tenant, the cloud, the identities, the operators, the pilot, the synthetic objects, the policies and the waves.");
  sources(s, "Sources: Module 11, Unit 1; workbook Chapter 11, \"The environment settings file\"; examples/non-person-identity/deploy/settings.template.json.");
  notes(s,
`The settings file is one JSON file per stage. It holds every value the commands need: the tenant, the cloud, the identities, the operators, the pilot, the synthetic objects, the policies and the waves. The kit checks it before any command runs, against four rules, which are this workbook's design. No secrets: a field whose name looks like a secret, or a value that looks like a client secret or a private key, stops the run. The identities are named by client I D and certificate thumbprint, and the private key stays in the operator's certificate store. No placeholders: a value still shaped like an angle-bracketed tenant I D stops the run. The stage it says it is: the file's environment must match the stage you tell the command to run. And the same commands for both stages: moving from test to production changes the file, and nothing else.`,
  `${M} — Unit 1 "What the runbook adds": workbook Chapter 11, "The environment settings file."`);
}

// ================================================================== 7 Five scripts
{
  const s = content(SC, "The code it adds: five scripts, each with a fixture mode");
  tag(s, "What");
  const b = table(s, "Scripts", 1.45, [3.4, 4.9, 3.85], ["Script", "What it does", "What it may write"], [
    ["Test-NpiDeployPreflight.ps1", "PF-01 to PF-11; results, snapshot and manifest; exits 1 on any Fail", "Nothing"],
    ["Invoke-NpiDeploySmokeTest.ps1", "ST-01 to ST-07 on the synthetic service principal and service account", "One probe expected to be refused: a new secret on the synthetic app"],
    ["Invoke-NpiDeployRollback.ps1", "Plan prints the plan's SHA-256; Apply checks it, the tenant and a seven-day age, then dry-runs, or sends with -Apply", "PATCH on policies, accountEnabled, Enable- and Disable-ADAccount. Never a delete"],
    ["Write-NpiDeployEvidence.ps1", "Records a step that ran an earlier chapter's script", "Only the evidence folder"],
    ["Test-NpiDeployEvidence.ps1", "Every requirement row present and passing, SHA256SUMS matching; exits 1 on a gap", "Nothing"],
  ], { fontSize: 11.5, limit: 5.8 });
  line(s, "Fix", "-FixturePath serves Graph and AD from a file and sends nothing anywhere. That's how Lab 1 runs.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 11, Unit 1; workbook Chapter 11, \"The code this chapter adds\"; examples/non-person-identity/deploy.");
  notes(s,
`The runbook adds five scripts, each with a fixture mode that serves Graph and Active Directory from a file and sends nothing anywhere. The preflight runs checks P F oh one to eleven, writes a snapshot that the rollback restores, and writes nothing to the tenant. The smoke test runs checks S T oh one to oh seven against a synthetic service principal and service account. Its one write is a probe that's expected to be refused: a new secret on the synthetic app. The rollback has two modes. Plan writes the plan and prints its hash. Apply checks the approved hash, the tenant and a seven-day age, then dry-runs, or sends only with the apply switch. It patches policies and enables or disables accounts, and it never deletes. The evidence writer records a step that ran an earlier chapter's script. And the evidence check is the go or no-go.`,
  `${M} — Unit 1 "What the runbook adds": workbook Chapter 11, "The code this chapter adds."`);
}

// ================================================================== 8 Stages and promotion
{
  const s = content(SC, "The stages and the promotion to production");
  tag(s, "What");
  const l = panel(s, "Test", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "STAGE 1  ·  LIVE TEST", "Steps 1.1 to 1.8", [
    "Prepare synthetic objects; run the preflight",
    "Deploy in the safe order: Steps 1.1 to 1.5",
    "Smoke test, capture the evidence, rehearse the rollback",
    "Then deploy again",
  ], 13);
  const r = panel(s, "Prod", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "STAGE 2  ·  PRODUCTION", "Only after the go/no-go", [
    "Starts only when every go/no-go criterion is signed: nine rows",
    "PF-11: the test smoke test passed, in another tenant",
    "Conditional Access enabled one wave at a time",
  ], 13);
  callout(s, "Expected", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Not run live by anyone: ",
    "every live result in Stages 1 and 2 is labeled Expected. Lab 1 runs only the dry run.");
  sources(s, "Sources: Module 11, Unit 2; workbook Chapter 11, \"Stage 1: live test,\" \"Promotion go/no-go criteria,\" \"Stage 2: production.\"");
  notes(s,
`Unit 2 is the stages. The live test stage prepares synthetic objects, runs the preflight, and deploys in the safe order, Steps 1.1 to 1.5. Then it runs the smoke test, captures the evidence, rehearses the rollback, and deploys again. Production starts only when every go or no-go criterion is signed, nine rows of them, and its preflight adds one check that runs only in production: P F eleven, which needs the test stage's smoke test to have passed every check, in another tenant. Then production enables Conditional Access for workload identities one wave at a time. Remember the status: nobody has run these stages against a live tenant, and every live result in them is labeled Expected. That's why Lab 1 runs only the dry run.`,
  `${M} — Unit 2 "The stages and the promotion": workbook Chapter 11, "Stage 1: live test," "Promotion go/no-go criteria," "Stage 2: production."`);
}
endModule(SC);

// ================================================================== 9 Try it: template and preflight
{
  const s = content(SL, "Try it: the template refused, and the test preflight");
  tag(s, "How");
  const c = code(s, "Pre", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/non-person-identity",
    "$ Import-Module ./deploy/NpiDeploy.psm1 -Force",
    "$ Read-NpiDeploySettings -Path deploy/settings.template.json -Stage test",
    "The settings file deploy/settings.template.json isn't usable:",
    "  environment: placeholder <test-or-production> not replaced",
    "  tenantId: placeholder <tenant-id> not replaced  ...",
    "$ ./deploy/Test-NpiDeployPreflight.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test ...",
    "Preflight (Fixture, test, CHG-2026-1102-T): 12 Pass, 1 Warn",
    "  PF-06 Warn   G4   Operator Conditional Access administrator: ... Conditional Access Administrator active",
    "Evidence: PRE-preflight.json (Warn)",
    "Evidence: S0-change-record-approvals-and-settings-file.json (Pass)",
    "Result: GO for this stage. File results.json, snapshot.json and manifest.json with the change record.",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Warn", "The Warn: a standing role assignment, not a PIM-eligible one. The preflight reports it but doesn't block.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 11, \"Exercise: Lab 1,\" steps 1 and 2; examples/non-person-identity/deploy (NpiDeploy.psm1, Test-NpiDeployPreflight.ps1; fixtures).");
  notes(s,
`Try it. Lab 1 runs in the non-person identity folder, in PowerShell 7. The test and production tenants are fictional and served by a fake, so nothing signs in and nothing is sent. Step one loads the deploy module and checks the template, and it's refused on purpose. You get an error, then every problem at once, starting with the environment placeholder that hasn't been replaced. A filled-in file prints one line instead. Step two runs the test stage's preflight. It prints twelve passes and one warning. The warning is P F oh six: the fixture's Conditional Access administrator holds a standing assignment, not one that's eligible through P I M, and the preflight reports it but doesn't block. It writes two evidence records, and its last line says go for this stage.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 10 Try it: smoke test
{
  const s = content(SL, "Try it: the smoke test on synthetic objects");
  tag(s, "How");
  const c = code(s, "Smoke", 0.6, 1.45, 12.15, [
    "# Step 3: run the smoke test (command trimmed)",
    "$ ./deploy/Invoke-NpiDeploySmokeTest.ps1 -SettingsPath tests/fixtures/deploy/settings.test.json -Stage test ...",
    "Smoke test (Fixture, test, Conditional Access expected ReportOnly): 8 Pass",
    "  ST-01 Pass  G1  Synthetic app is in the register with two owners and no secret: ...",
    "  ST-02 Pass  G1  Synthetic service account is detected and rated HIGH: ...",
    "  ST-03 Pass  G3  App management policy refuses a new secret on the synthetic app: refused: Graph returned",
    "                  400 (BadRequest): (fixture) Refused by the app management policy (real code unverified).",
    "  ST-04 Pass  G5  Synthetic app's federated credential matches the settings exactly: ...",
    "  ST-05 Pass  G4  Workload policy CA015-... assigns the synthetic service principal directly: ...",
    "  ST-05 Pass  G4  Workload policy CA037-... assigns the synthetic service principal directly: ...",
    "  ST-06 Pass  G4  Synthetic sign-ins show the workload policies' result (Graph beta): ...",
    "  ST-07 Pass  G5  gMSA test host can retrieve the gMSA's password: ...",
    "Evidence: SMOKE-smoke-test.json (Pass)",
    "Result: PASS. File results.json and manifest.json with the change record.",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED AND WRAPPED)", pt: 10.5 });
  line(s, "Unv", "ST-03 says (real code unverified): Learn doesn't give the error an app management policy returns.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 11, \"Exercise: Lab 1,\" step 3; Learn, app management policies API overview; examples/non-person-identity/deploy/Invoke-NpiDeploySmokeTest.ps1.");
  notes(s,
`Step three runs the smoke test against the synthetic service principal and service account. It prints eight passes, for checks S T oh one to oh seven, with oh five run once for each workload policy. The synthetic app is in the register with two owners and no secret. The synthetic service account is found and rated high. The app management policy refuses a new secret on the synthetic app. The federated credential matches the settings exactly. Each workload policy assigns the synthetic service principal directly. The synthetic sign-ins show the policies' result. And the test host can retrieve the group managed account's password. Read S T oh three closely. It says the fixture's refusal is real code unverified, because Microsoft Learn doesn't give the exact error an app management policy returns.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 3; workbook Chapter 11 — "Illustrative code."`);
}

// ================================================================== 11 Try it: rollback
{
  const s = content(SL, "Try it: the rollback planned, refused, then dry-run");
  tag(s, "How");
  const c = code(s, "Rb", 0.6, 1.45, 12.15, [
    "# Step 4: plan the rollback (-Mode Plan ... -To Disabled -IncludeSmokeCleanup ...)",
    "Rollback plan (test, to Disabled): 7 action(s)",
    "  RB-01 G4  ConditionalAccessState CA015-...   RB-04 G3       AppPolicyOff  npi-pilot-block-secrets",
    "  RB-02 G4  ConditionalAccessState CA037-...   RB-05 G5       AdEnable      svc-payexport",
    "  RB-03 G3  TenantAppPolicyRestore ...         RB-06, RB-07   Cleanup: SpDisable, AdDisable",
    "Plan SHA-256 for the reviewer: 2d365b3052a6db5e5f134937f011974afe132f790e607b21e9de8d071ca29ed2",
    "# Step 5: apply it with -ApprovedSha256 ('0' * 64)",
    "The plan's SHA-256 is 2d365b30..., not the approved 00000000.... Nothing was sent.",
    "# Step 6: apply it with the plan's own hash, without -Apply",
    "Rollback DryRun (Fixture, test): 7 WouldApply",
    "  RB-01 WouldApply  ConditionalAccessState CA015-... enabledForReportingButNotEnforced -> disabled",
    "  RB-02 WouldApply  ConditionalAccessState CA037-... enabledForReportingButNotEnforced -> disabled",
    "Evidence: ROLLBACK-rollback.json (DryRun)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED AND REFLOWED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Hash", "No action is a delete. In a real stage, a reviewer who isn't the operator passes you the hash.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 11, \"Exercise: Lab 1,\" steps 4 to 6; examples/non-person-identity/deploy/Invoke-NpiDeployRollback.ps1.");
  notes(s,
`Steps four to six are the rollback. Step four plans it from the preflight's snapshot, with the synthetic objects' cleanup. Seven actions: turn the two workload policies off, restore the tenant's default app management policy, turn the pilot policy off, re-enable the legacy account, and disable the two synthetic objects. No action is a delete. The plan prints its hash for the reviewer. Step five applies the plan with a hash nobody approved, all zeros, and it stops: the plan's hash isn't the approved one, and nothing was sent. Step six applies it with the plan's own hash, but without the apply switch, so it's a dry run: seven would-apply actions, with both workload policies going from report-only to disabled. In a real stage, a reviewer who isn't the operator passes you that hash.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 4 to 6.`);
}

// ================================================================== 12 Try it: promotion and evidence
{
  const s = content(SL, "Try it: production's preflight, and the evidence check");
  tag(s, "How");
  const c = code(s, "Ev", 0.6, 1.45, 12.15, [
    "# Step 7: production's preflight, with -PromotionEvidencePath out/dryrun/test-smoke",
    "Preflight (Fixture, production, CHG-2026-1116-P): 14 Pass",
    "  PF-11 Pass   Promotion Test stage smoke test passed, in another tenant: test, tenant",
    "               c0ffee00-0000-4000-8000-0000000000e1, 8/8 Pass",
    "# Step 8: check the test stage's evidence",
    "Evidence for the test stage (CHG-2026-1102-T): 4 of 9 requirement rows present and passing",
    "  S1.1  Missing  ...  S1.5  Missing     ROLLBACK  Failing  DryRun  KSI-CMT-RMV, KSI-RPL-ABO",
    "Result: NO-GO on evidence.",
    "# Step 9: read the evidence records",
    "PRE-preflight.json: Warn; ...   ROLLBACK-rollback.json: DryRun; KSIs KSI-CMT-RMV, KSI-RPL-ABO",
    "S0-change-record-approvals-and-settings-file.json: Pass; KSIs KSI-CMT-LMC, KSI-IAM-JIT",
    "SMOKE-smoke-test.json: Pass; ...",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED AND REFLOWED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Tests", "Step 10, the deploy tests: 55 passed, 0 failed, 0 not run.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 11, \"Exercise: Lab 1,\" steps 7 to 10; examples/non-person-identity/deploy (Test-NpiDeployEvidence.ps1; tests/NpiDeploy.Tests.ps1).");
  notes(s,
`Step seven runs production's preflight, with the test stage's smoke test as its promotion evidence. Fourteen passes, including P F eleven, which runs in production only: the test stage's smoke test passed, eight of eight, in another tenant. Step eight checks the test stage's evidence, and it says no-go. Four of nine requirement rows are present and passing. Steps 1.1, 1.2, 1.3 and 1.5 are missing, because they record their evidence only when they run against a tenant. And the rollback row fails on dry run, which the go or no-go doesn't accept. The exit code is one, and that's right for a dry run. Step nine lists the four evidence records and the K S I's each names. Step ten runs the deploy scripts' fifty-five tests.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 7 to 10.`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: the live test stage, then production");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "An Entra test tenant with Workload ID Premium and Entra ID P1 or P2, an Azure test subscription and an AD test forest, never production"],
    ["And", "An approved change record; the reader app and the deployment identity, each with a certificate; operators eligible through PIM; the earlier Lab 2s"],
    ["What you do", "Fill in and check the settings file, create the synthetic objects and the pilot policy, run the preflight, deploy Steps 1.1 to 1.5"],
    ["Then", "Run the smoke test, capture the evidence, rehearse the rollback, deploy again, check the evidence"],
    ["Back it out", "Step 1.8: the approved rollback, the gMSA uninstalled, the tenant checked against the baseline. The kit never deletes"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by anyone yet: ",
    "production only when every go/no-go criterion is signed.");
  sources(s, "Sources: Module 11, \"Exercise: Lab 2, the live test stage, then production\"; workbook Chapter 11, Stage 1, Step 1.8.");
  notes(s,
`Lab 2 is the live test stage, and then production. Nobody has run it yet. You need an Entra test tenant with Workload ID Premium and Entra ID P1 or P2, an Azure test subscription and an Active Directory test forest, never production. You also need an approved change record, the reader app and the deployment identity, each with a certificate, operators eligible for their roles through P I M, and the second labs of Chapters 1, 4, 5, 6 and 8 already run. Fill in and check the settings file, create the synthetic objects and the pilot policy, run the preflight, and deploy Steps 1.1 to 1.5. Then run the smoke test, capture the evidence, rehearse the rollback, deploy again, and check the evidence. To back it out, Step 1.8 applies the approved rollback and checks the tenant against the baseline. The kit never deletes. Production comes only when every go or no-go criterion is signed.`,
  `${M} — Unit "Exercise: Lab 2, the live test stage, then production."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence, every gate");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.6, 3.2, 5.35], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["CM-3; CM-5; AC-5", "KSI-CMT-LMC; KSI-IAM-JIT", "S0 record: the change record, the settings file's SHA-256"],
    ["IA-5, IA-5(2), IA-9; AC-6, AC-6(5)", "KSI-IAM-SNU; KSI-IAM-ELP", "PRE record, PF-02 and PF-05"],
    ["CA-7, CM-2; CM-3(2), CM-4(2)", "KSI-MLA-EVC; KSI-CMT-VTD", "PRE record, PF-09 and PF-08"],
    ["AC-2, CM-8, IA-4; IA-5, IA-9; AC-3, AC-6; AU-2, AU-12", "KSI-PIY-GIV, -IAM-SNU, -IAM-ELP, -MLA-LET, -MLA-EVC", "SMOKE record: ST-01 to ST-07"],
    ["AU-9", "KSI-MLA-OSM", "SHA256SUMS, checked by Test-NpiDeployEvidence.ps1"],
    ["CM-3; CP-10", "KSI-CMT-RMV, KSI-RPL-ABO", "ROLLBACK record from an applied rollback; DryRun isn't accepted"],
  ], { fontSize: 11, limit: 5.7 });
  line(s, "KSI", "Every alignment is the program's reading (design guidance); the assessor and the AO decide each control.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 11, \"Introduction\"; NIST SP 800-53; FedRAMP 20x KSIs; Chapter 11, \"Requirements, KSIs and evidence.\"");
  notes(s,
`The federal requirement. Every runbook step ends with a requirements table, and the kit writes an evidence record for each row. The change record and the settings file's hash cover NIST special publication eight hundred fifty-three C M three, C M five and A C five. The preflight's checks on the deployment identity and the reader app cover authenticator management and least privilege, I A five and A C six. Its baseline and policy-state checks cover continuous monitoring and change testing. The smoke test covers account, inventory, identifier, access and audit controls. The SHA256SUMS file covers A U nine. And the rollback record covers C M three and C P ten, system recovery, but only from an applied rollback; a dry run isn't accepted. K S I's are FedRAMP twenty X indicators for cloud providers, and every alignment is the program's reading. The assessor and the authorizing official decide each control.`,
  `${M} — Unit "Introduction" (the federal requirement); workbook Chapter 11 — "Requirements, KSIs and evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on the runbook", [
    { q: "The rollback's plan SHA-256 isn't the one the reviewer approved. What does -Mode Apply do?", options: ["a. Applies the plan and warns", "b. Stops before it sends anything: \"Nothing was sent.\"", "c. Rewrites the plan"] },
    { q: "In the dry run, why does Test-NpiDeployEvidence.ps1 end NO-GO on evidence?", options: ["a. The smoke test failed", "b. Steps 1.1 to 1.5 record evidence only against a tenant, and a DryRun rollback isn't accepted", "c. The preflight had a Warn"] },
  ], "1 b: the hash check comes before any request. 2 b: a fixture stage can never pass the evidence check.");
  sources(s, "Sources: Module 11, \"Knowledge check,\" questions 3 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: the rollback's plan hash isn't the one the reviewer approved. What does apply mode do? The answer is b. It stops before it sends anything, and says nothing was sent. You saw it in step five. Second: in the dry run, why does the evidence check end no-go? The answer is b. Steps 1.1 to 1.5 record their evidence only when they run against a tenant, and a dry-run rollback records dry run, which the go or no-go doesn't accept. So a fixture stage can never pass the evidence check, and that's by design. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 3 and 4; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary: you've finished the learning path");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU DRY-RAN", null, [
    "A settings file refused for its placeholders",
    "A preflight that says go with one Warn, and a smoke test on synthetic objects",
    "A rollback refused without its approved hash, and dry-run with it",
    "A production preflight that checks the test smoke test, and a no-go on a fixture stage",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "You've finished the path", [
    "Back to the learning path",
    "Or the Labs page, for every lab in the workbook",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "one record per requirement row, the run folders, the operator's inputs, and SHA256SUMS, checked with sha256sum -c.");
  sources(s, "Sources: Module 11, \"Summary\"; workbook Chapter 11, \"Evidence the ISSO keeps.\"");
  notes(s,
`To sum up. You dry-ran the runbook's own scripts: a settings file refused for its placeholders, a preflight that says go with one warning, a smoke test on synthetic objects, a rollback plan refused without its approved hash and dry-run with it, a production preflight that checks the test stage's smoke test, and an evidence check that says no-go on a fixture stage. The evidence an ISSO keeps for each stage is the evidence folder, with one record per requirement row, the run folders they cover, the operator's input files, and the SHA256SUMS file, which the ISSO checks with sha256sum dash c. Before you run a stage, work through the chapter's checklist. And that's the end of the path. Go back to the learning path, or to the Labs page for every lab in the workbook.`,
  `${M} — Unit "Summary"; workbook Chapter 11 — "Evidence the ISSO keeps," "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 11 deck", [
  "Module page: docs/training/non-person-identity/11-deploying-to-test-and-production.md (Non-Person Identity learning path, Module 11): the held-for-review callout, Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: workbook Chapter 11 (held for review; not run against a live tenant), \"What the runbook depends on,\" \"Before you start,\" \"The environment settings file,\" \"The code this chapter adds,\" \"Pre-flight checks,\" Stages 1 and 2, \"Promotion go/no-go criteria,\" \"Evidence the ISSO keeps.\" Its Microsoft Learn footnotes: app management policies; Conditional Access for workload identities; Activate a Microsoft Entra role in PIM. FedRAMP, Key Security Indicators; NIST SP 800-53.",
  "Kit: examples/non-person-identity/deploy (NpiDeploy.psm1; the five scripts; settings.template.json; tests/NpiDeploy.Tests.ps1) and tests/fixtures/deploy. Fictional tenants served by a fake. Illustrative: tested against fixtures, not run against a live tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7 and Pester 5 in a scratch copy of examples/non-person-identity; output trimmed and reflowed where the slides say so. Step 10 printed 55 passed, run in the same session after step 8, once the test cleared the exit code step 8 leaves (fixed November 3, 2026). Verification: docs/training/non-person-identity/_verification/learning-path.md. Lab 2 not run by anyone.",
]);

finish(OUT);
