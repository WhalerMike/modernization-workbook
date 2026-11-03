// Attribute-Driven Migration learning path, Module 9: Deploy to test, then production — the module's narrated deck.
// Teaches docs/training/attribute-driven-migration/09-deploying-to-test-and-production.md, Learn-style: objectives, the
// concepts, "Try it" slides with the real Lab 1 commands and output (the deploy scripts' dry runs, run November 3, 2026 in a
// scratch copy of examples, from an empty out folder), Lab 2, the federal requirement and evidence, a two-question check,
// and the summary. Every fact comes from the module page, the learning path's verification log, Book 19 Chapter 10, or the
// kit (examples/drift-pipeline/deploy); the deck adds none. Chapter 10 is held for review and hasn't been run against a live
// tenant; the deck says so.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-adm-module-9/build.js \
//                      presentations/training-adm-module-9/Training_ADM_Module_9.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 9: Deploy to test, then production",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration learning path, Module 9: Deploy to test, then production",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Attribute-Driven Migration learning path — Module 9: Deploy to test, then production";
const OUT = process.argv[2] || "Training_ADM_Module_9.pptx";
const M = "Training, Attribute-Driven Migration, Module 9";

// The title slide, as shared.js draws it, with this path's name over the units.
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "ATTRIBUTE-DRIVEN MIGRATION LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
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
  const s = title(SI, "Module 9: Deploy to test, then production", "Attribute-Driven Migration learning path · Every gate, with Book 19 Chapter 10",
    ["What the runbook adds  ·  The settings file and three identities  ·  The live test stage", "Promotion and waves  ·  Try it: Lab 1, the dry runs  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 9, the last module of the Attribute-Driven Migration learning path: deploy to test, then production. This module serves every gate, through Chapter 10's step-to-gate map, and takes Chapter 10 of Book 19. You'll see what the deployment runbook adds to the chapters: one settings file per stage, three identities, a record of every change with its rollback, and a go or no-go record before production. Then you'll dry-run its five deploy scripts on your laptop, against the kits' fixtures. One thing first. Chapter 10 is held for review, and nobody has run its runbook against a live tenant, subscription or forest. The scripts are tested against fixtures and their dry-run output is real. Every other result in the chapter is an expectation, not an observation.`,
  `${M} — Header; "Chapter 10 is held for review"; Unit 1 "Introduction."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a deployment isn't nine Lab 2s in a row");
  tag(s, "Why");
  const b = table(s, "Diff", 1.45, [5.6, 6.55], ["A chapter's Lab 2", "A deployment"], [
    ["One kit at a time, values typed into the commands", "All nine kits in a safe order; every value from one settings file per stage"],
    ["Signs in however is convenient", "Three identities with a certificate each; least privilege per step"],
    ["Backs out what it made, then stops", "Records every change, and writes the rollback from the record, newest first"],
    ["Ends in the test tenant", "A go or no-go record production's pre-flight check verifies; then waves"],
  ], { fontSize: 13, limit: 4.4 });
  callout(s, "Held", b + 0.35, 0.95, "FaTriangleExclamation", HEX.red, "Held for review: ",
    "nobody has run Chapter 10's runbook against a live tenant. This module's Lab 1 runs only the dry runs.");
  sources(s, "Sources: Module 9, Unit 1; \"Chapter 10 is held for review\"; Book 19, Ch 10 \"What this runbook adds\" (the workbook's own design).");
  notes(s,
`Why does deployment need its own module? Each chapter's Lab 2 changes the smallest thing it can, by hand, and backs it out. That proves one kit in isolation. A deployment differs in four ways. It runs all nine kits in a safe order, and reads every value from one settings file per stage. It signs in with three identities, each with a certificate, and least privilege per step. It records every change as it's made, and writes the rollback from that record, newest first. And it doesn't end in the test tenant: it ends with a go or no-go record that production's pre-flight check verifies, then production in waves. The order is the one this workbook's implementation guide sets: prove the attributes first, build groups and workflows paused or disabled, target by attribute, cut over by wave, then keep the attributes true.`,
  `${M} — Unit 1 "Introduction"; Book 19, Chapter 10 — "What this runbook adds to the chapters."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 9", [
    "Explain the four ways a deployment differs from a chapter's Lab 2",
    "Describe the settings file, the placeholders and the three identities",
    "Run the pre-flight check, and say which checks it runs dry and which live",
    "Record changes and read the rollback plan they produce",
    "Explain why a fixture smoke test can never promote, and what production's pre-flight check verifies",
  ], [
    "Modules 1 to 8, or at least their Lab 1s: this module doesn't teach the kits again",
    "Lab 1: Python 3.10+ with pytest, and a POSIX shell with sha256sum",
  ], 50);
  sources(s, "Sources: Module 9, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll explain the four ways a deployment differs from a chapter's Lab 2. You'll describe the settings file, the placeholders and the three identities. You'll run the pre-flight check, and say which checks it runs dry and which live. You'll record changes and read the rollback plan they produce. And you'll explain why a fixture smoke test can never promote, and what production's pre-flight check verifies. Before you start, do Modules 1 to 8, or at least their Lab 1s: this module doesn't teach the kits again. Lab 1 needs Python 3.10 or later with pytest, and a POSIX shell with sha two fifty-six sum.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Settings and identities
{
  const s = content(SC, "One settings file per stage, and three identities");
  tag(s, "What");
  const l = panel(s, "Settings", 0.6, 1.45, 5.8, null, HEX.navy, HEX.navyTint, "THE SETTINGS FILE", "test.json, then production.json", [
    "Every value the commands need: cloud, tenant, subscription, change record, kits",
    "The template's values are all placeholders",
    "No secrets, by construction: the loader refuses secret-like keys and values, and any placeholder left",
  ], 13);
  const r = panel(s, "Ids", 6.65, 1.45, 6.1, null, HEX.teal, HEX.tealTint, "THE IDENTITIES", "A certificate each, no client secret", [
    "deploy: the stage steps that change Entra, Intune and Azure",
    "reader: baselines, reconciliation, smoke tests",
    "provisioning: SynchronizationData-User.Upload only",
    "A named Groups Administrator for the one delegated step",
  ], 13);
  callout(s, "One", Math.max(l, r) + 0.3, 0.95, "FaUserShield", HEX.navy, "Design guidance: ",
    "one identity that can do everything is one credential that can break everything.");
  sources(s, "Sources: Learn, \"group: evaluateDynamicMembership\"; Learn, \"Sign into Azure with a service principal using the Azure CLI\"; Module 9, Unit 2; Book 19, Ch 10.");
  notes(s,
`Two ideas make the same commands run against test and production. First, one settings file per stage: test dot json, then production dot json. It holds every value the commands need, the cloud, the tenant, the subscription, the change record and the kits' settings. The template's values are all placeholders. And there are no secrets, by construction: the loader refuses a key or a value that looks like a secret, and any placeholder left unfilled. Second, the identities. Deploy changes Entra, Intune and Azure in the stage steps. Reader takes the baselines, the reconciliation and the smoke tests. Provisioning sends the HR batches, with one upload permission and nothing else. Each signs in with a certificate. And one named Groups Administrator signs in for rule validation, because Microsoft Learn's page for the group evaluateDynamicMembership API lists no application permission for it. Microsoft Learn's page on signing in to the Azure CLI with a service principal recommends certificate-based authentication. And splitting the work across three identities is this workbook's design guidance: one identity that can do everything is one credential that can break everything.`,
  `${M} — Unit 2 "What the runbook adds"; Book 19, Chapter 10 — "One environment settings file," "The identities and what each may do."`);
}

// ================================================================== 5 Live test stage
{
  const s = content(SC, "The live test stage: nothing grants access unchecked");
  tag(s, "What");
  const b = table(s, "Order", 1.45, [0.9, 3.6, 5.85, 1.8], ["#", "Component", "Starts", "Guide gate"], [
    ["1", "Baseline evidence", "Read only", "2, 5"],
    ["2", "HR-to-Entra middleware", "Dry run, then five records", "2, 3"],
    ["3", "Dynamic rules", "Created paused, validated, then on", "4"],
    ["4", "Lifecycle Workflows", "Created disabled; one on-demand run", "7, 8"],
    ["5", "Group Policy as code", "Test OU; Intune dry run; cut-over drill", "5, 8"],
    ["6", "Machine configuration", "Audit, then apply and monitor", "5"],
    ["7", "Ansible beside Arc", "Wave plan, check mode, then connect", "5, 8"],
    ["8", "Drift pipeline", "First run is the baseline", "9"],
    ["9", "Smoke test, evidence, rollback drill, evidence check", "—", "All"],
  ], { fontSize: 11.5, limit: 5.9 });
  line(s, "Rec", "Every change is recorded with rollback.py add: the rollback is only as complete as the record.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 9, Unit 3; Book 19, Ch 10 \"Stage 1: live test\" (its order table; the workbook's own design).");
  notes(s,
`The live test stage deploys every component to the test tenant, the test subscription and the test forest, in an order where nothing grants access before it has been checked. First, baseline evidence, read only. Then the HR middleware, as a dry run and then five records. Dynamic rules are created paused, validated, then turned on. Lifecycle Workflows are created disabled, with one on-demand run. Group Policy goes to a test organizational unit, with an Intune dry run and a cut-over drill. Machine configuration runs in audit first, then apply and monitor. Ansible plans its wave and runs in check mode before it connects. The drift pipeline's first run is the baseline. And the stage ends with the smoke test, the evidence package, a rollback drill and the evidence check. Every change is recorded as it's made: the rollback is only as complete as the record.`,
  `${M} — Unit 3 "The stages and the promotion"; Book 19, Chapter 10 — "Stage 1: live test."`);
}

// ================================================================== 6 Promotion and production
{
  const s = content(SC, "Promotion, then production in waves");
  tag(s, "What");
  const l = panel(s, "Promo", 0.6, 1.45, 6.6, null, HEX.navy, HEX.navyTint, "PRODUCTION'S PRE-FLIGHT NEEDS", "Criteria 0 to 4, enforced by PF-09 and PF-10", [
    "A passing test evidence check: 17 of 17 rows",
    "A GO smoke report from a live test run",
    "Both hashes recorded in production.json's promotion",
    "The CISO's and identity engineering's approvals",
    "No shared tenant, subscription or deploy identity",
  ], 13);
  const r = panel(s, "Waves", 7.45, 1.45, 5.3, null, HEX.teal, HEX.tealTint, "THEN PRODUCTION", null, [
    "Tenant-wide pieces once",
    "Each wave leaver first, smoke-tested before the next",
    "Seven days of chained drift packages per wave",
  ], 13);
  callout(s, "Rb", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Production's rollback rule: ",
    "re-enable, never re-create. Roll back the wave, not the tenant.");
  sources(s, "Sources: Module 9, Unit 3; Book 19, Ch 10 \"Promotion go/no-go criteria,\" \"Stage 2: production\" (the workbook's own design and guidance).");
  notes(s,
`Then the promotion. Production's pre-flight check enforces what it can. Every requirement row of the test stage needs passing evidence: seventeen of seventeen. The test smoke test must be GO, from a live run in the test tenant. Production's settings must record that exact report's hash, and the evidence check's. The CISO and identity engineering must both approve, which is this workbook's design guidance. And test and production must share no tenant, subscription or deploy identity. The rest of the criteria are review. Then production runs the same commands with production dot json. The tenant-wide pieces run once. Then each wave, leaver first, smoke-tested before the next, with seven days of chained drift packages per wave. And production's rollback rule, from this workbook's implementation guide, is re-enable, never re-create. Roll back the wave, not the tenant: earlier waves that are drift-clean stay.`,
  `${M} — Unit 3; Book 19, Chapter 10 — "Promotion go/no-go criteria," "Stage 2: production," "Roll back in production."`);
}
endModule(SC);

// ================================================================== 7 Try it: preflight
{
  const s = content(SL, "Try it: the test stage's pre-flight check");
  tag(s, "How");
  const c = code(s, "Pre", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/drift-pipeline: start clean, then the pre-flight check",
    "$ rm -rf out",
    "$ python deploy/preflight.py --settings deploy/tests/fixtures/test.json \\",
    "    --other deploy/tests/fixtures/production.json",
    "PASS PF-01  settings schema adm-deploy-settings/1, environment test",
    "PASS PF-02  no secret in the settings file",
    "PASS PF-03  no placeholder left ...",
    "PASS PF-06  9 kits present ...",
    "PASS PF-09  test and production use different tenants, subscriptions and identities",
    "PASS PF-10  test stage: no promotion record needed",
    "DRY  PF-11  would run: az cloud show --query name -o tsv  (expect AzureCloud) ...",
    "preflight: 0 failed, 0 warning(s); dry run (nothing signed in, nothing called)",
    "evidence 001-preflight.json: preflight pass",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Dry", "PF-01 to PF-10 run dry; the live probes (PF-11 to PF-16) print as DRY until --live.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Exercise: Lab 1,\" steps 1 and 2; Book 19, Ch 10 \"Try the scripts,\" \"Pre-flight checks.\"");
  notes(s,
`Try it. Lab 1 dry-runs the five deploy scripts against the kits' fixtures, in the drift-pipeline folder of the examples. Nothing signs in and nothing is called. Step one starts clean, with no out folder, because the evidence records are numbered within it. Step two runs the test stage's pre-flight check, with the production settings as the other file. P F oh one to P F ten pass: the settings schema, no secret in the file, no placeholder left, the cloud, certificate paths outside the repository, all nine kits present, and test and production on different tenants, subscriptions and identities. The test stage needs no promotion record. The live probes, the Azure CLI's cloud, tenant, subscription and signed-in identity, the PowerShell modules and the certificate files, print as DRY. The last two lines: zero failed, a dry run, and the first evidence record, preflight pass.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2; Book 19, Chapter 10 — "Pre-flight checks."`);
}

// ================================================================== 8 Try it: rollback
{
  const s = content(SL, "Try it: record four changes, write the rollback");
  tag(s, "How");
  const c = code(s, "Rb", 0.6, 1.45, 12.15, [
    "# Step 3: S=deploy/tests/fixtures/test.json; four rollback.py add commands, then the plan",
    "$ python deploy/rollback.py add --settings $S --kind dynamic-group --id 88888888-...-888888888801 \\",
    "    --name \"FIN ledger employees\"",
    "recorded dynamic-group 88888888-8888-4888-8888-888888888801 in .../deploy-record.json; evidence 003-rules.json",
    "$ python deploy/rollback.py plan --settings $S",
    "[4] policy-assignment  cloud  Remove-AzPolicyAssignment -Name 'adm-mc-tls-audit' -Scope '/subscriptions/...'",
    "[3] gpo-link-created   ad     Set-GPLink -Name 'FMP-Workstation-Baseline' -Target 'OU=ADM-Test,...' -LinkEnabled No ...",
    "[2] dynamic-group      cloud  Remove-MgGroup -GroupId '88888888-8888-4888-8888-888888888801'",
    "[1] provisioning-job   cloud  Invoke-MgGraphRequest -Method POST -Uri '/v1.0/servicePrincipals/.../pause'",
    "rollback plan: 4 step(s), newest first: 3 cloud, 1 ad",
    "wrote out/deploy-evidence/test/CHG-TEST-0101/rollback-cloud.ps1 ...",
    "evidence 006-rollback.json: rollback plan recorded",
    "nothing was run: review the scripts, then run them in a signed-in session",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED AND WRAPPED)", pt: 10 });
  line(s, "Read", "Each add records its change and writes an evidence record. The plan undoes them newest first, and runs nothing.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 9, \"Exercise: Lab 1,\" step 3; Book 19, Ch 10 \"Try the scripts against fixtures first.\"");
  notes(s,
`Step three records four changes the way the stage steps do: the provisioning job, a dynamic group, a Group Policy link the stage created, and a policy assignment. Each add records its change in the deploy record, and writes an evidence record for its step. Then the plan. It lists the four undo steps, newest first: remove the policy assignment, disable the Group Policy link, remove the dynamic group, and pause the provisioning job. Three are cloud steps and one is Active Directory, so it writes a cloud script, an A D script and a manual list, and its own evidence record. And notice the last line: nothing was run. You review the scripts, then run them in a signed-in session. The rollback is written from the record, not from memory on the day.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," step 3.`);
}

// ================================================================== 9 Try it: smoke
{
  const s = content(SL, "Try it: the smoke test says no-go on fixtures");
  tag(s, "How");
  const c = code(s, "Smoke", 0.6, 1.45, 12.15, [
    "# Step 4: the smoke test, on the fixture kit run and the other kits' fixture provenance",
    "$ python deploy/smoke_test.py --settings $S --fixture --kit-run tests/fixtures/runs/current/... \\",
    "    --hcm-provenance ... --dynamic-rules ... --mc-provenance ... --mc-mode Audit \\",
    "    --deploy-record $E/deploy-record.json --out $E/smoke",
    "PASS SM-01  kit run 2026-10-29-0617-fixture-runner-fixture matches its own manifest (read-only)",
    "PASS SM-02  fixture mode: run mode Fixture, tenant not compared ...",
    "FAIL SM-05  VK-HR-01 Fail (2 finding(s))",
    "FAIL SM-05  VK-DG-01 Fail (2 finding(s))",
    "FAIL SM-05  VK-CA-01 Fail (1 finding(s))",
    "FAIL SM-06  checks that ended in Error: VK-NPI-03",
    "FAIL SM-08  9 ready, 9 quarantined (limit 0) ...",
    "PASS SM-13  every change has a rollback",
    "smoke test: NO-GO (5 failed) for test/CHG-TEST-0101, fixture mode; report sha256 ...",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "Exit 2: the fixtures carry findings on purpose. The report's hash changes each run: it records when it ran.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Exercise: Lab 1,\" step 4; Book 19, Ch 10 \"Try the scripts against fixtures first.\"");
  notes(s,
`Step four runs the smoke test, on the fixture validation kit run and the other kits' fixture provenance. It reads the gates' checks again after the change, and answers go or no-go. It checks that the kit run matches its own manifest, and it notes fixture mode, so the tenant isn't compared. Then the failures. Three checks fail: VK-HR-01, VK-DG-01 and VK-CA-01. VK-NPI-03 ended in Error. And the HR dry run has nine rows quarantined, against a limit of zero. You'll recognize those from Modules 1 and 8. Every change has a rollback, so that passes. The answer is NO-GO, five failed, in fixture mode, and the exit code is two. The fixtures carry findings on purpose. The report's hash changes with each run, because the report records when it ran, so it isn't shown here.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," step 4.`);
}

// ================================================================== 10 Try it: evidence and promote
{
  const s = content(SL, "Try it: check the evidence, then try to promote");
  tag(s, "How");
  const c = code(s, "Promo", 0.6, 1.45, 12.15, [
    "# Step 5: check the stage's evidence, and let sha256sum confirm the records",
    "$ python deploy/evidence.py check --settings $S",
    "OK   R-PF-1   preflight  KSI-CMT-VTD, KSI-CMT-LMC                 001-preflight.json",
    "OK   R-PF-2   preflight  KSI-IAM-SNU, KSI-IAM-ELP                 001-preflight.json",
    "MISS R-HR-1   hr         KSI-IAM-AAM   002-hr.json  (only 'recorded' entries: the step has no passing record) ...",
    "evidence check: 2 of 17 requirement rows evidenced for test/CHG-TEST-0101; FAIL; ...",
    "$ (cd $E/evidence && sha256sum -c SHA256SUMS)",
    "001-preflight.json: OK ... 007-smoke.json: OK",
    "# Step 6: ask production's pre-flight check to promote on that report and that check",
    "$ python deploy/preflight.py --settings deploy/tests/fixtures/production.json --other $S ...",
    "FAIL PF-10  the test smoke report's SHA-256 isn't the one in promotion.test_smoke_report_sha256; ...",
    "  the test smoke report ran in fixture mode; promotion needs a live test run; ...",
    "preflight: 1 failed, 0 warning(s); dry run (nothing signed in, nothing called)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10 });
  line(s, "Tests", "Step 7: python -m pytest deploy/tests -q prints 46 passed. Step 8: rm -rf out.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Exercise: Lab 1,\" steps 5 to 8; Book 19, Ch 10 \"Try the scripts against fixtures first.\"");
  notes(s,
`Step five checks the stage's evidence against the requirement rows. Only two of seventeen are evidenced, both pre-flight rows, so the check fails with exit code two. Why are the others missing? A rollback add entry is recorded: it proves the change was written down, not that the step worked. And the smoke record is a failing fixture run. Then sha two fifty-six sum confirms every evidence record reads OK. Step six asks production's pre-flight check to promote on that report and that check. P F oh nine passes. P F ten fails: the hashes aren't the ones in the promotion record, the smoke report failed and ran in fixture mode, and promotion needs a live test run; the evidence check failed too. A fixture report, or a stage with unevidenced rows, can never promote. Step seven runs the tests, forty-six pass, and step eight cleans up.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 5 to 8.`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: the live test stage");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "An Entra test tenant, an Azure test subscription with Arc-enabled test servers, a test AD forest"],
    ["Before", "The three identities, and the objects made before the runbook starts"],
    ["Pre-flight", "Load test.json, sign in as the deploy identity, run the pre-flight check dry and live"],
    ["The stage", "The twelve steps of Stage 1, from the baseline to the rollback drill and the evidence check"],
    ["Back it out", "Step 11 runs the rollback written from the record, newest first; the kit should match the baseline"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by anyone yet: ",
    "every result in Chapter 10's stages is an expectation, not an observation. Never production.");
  sources(s, "Sources: Module 9, Unit 5 \"Exercise: Lab 2 (the live test stage)\"; Book 19, Ch 10 \"Stage 1: live test.\"");
  notes(s,
`Lab 2 is the live test stage itself. You need an Entra test tenant, an Azure test subscription with Arc-enabled test servers, and a test Active Directory forest, never production, plus the three identities and the objects the chapter lists as made before the runbook starts. Load the test stage's settings, sign in as the deploy identity, and run the pre-flight check dry and then live. Then follow the twelve steps of Stage 1: the baseline evidence, the HR middleware, dynamic rules, Lifecycle Workflows created disabled, Group Policy as code, machine configuration in audit, Ansible in check mode, the drift pipeline, the smoke test, the evidence package, the rollback drill and the evidence check. To back it out, step eleven runs the rollback written from the record, newest first. Nobody has run Lab 2 yet.`,
  `${M} — Unit 5 "Exercise: Lab 2 (the live test stage)"; Book 19, Chapter 10 — "Stage 1: live test," "Step 11: roll back."`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 9");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.6, 3.3, 4.25], ["Requirement", "KSI", "Evidence the ISSO keeps"], [
    ["CM-3(2): settings, kits, identities, cloud checked first", "KSI-CMT-VTD, KSI-CMT-LMC", "preflight.json, dry and live"],
    ["IA-5; AC-6: no secret; three certificate identities", "KSI-IAM-SNU, KSI-IAM-ELP", "preflight.json PF-02 and PF-05"],
    ["CM-4(2); CA-7: go or no-go after the change", "KSI-CMT-LMC, KSI-CMT-VTD, KSI-MLA-EVC", "smoke-report.json, the after run"],
    ["AU-9; SI-7: one package, a SHA-256 per file", "KSI-MLA-OSM, KSI-SVC-VRI", "The package, SHA256SUMS, verify"],
    ["CM-3: every change with its rollback, newest first", "KSI-CMT-LMC, KSI-CMT-RVP", "deploy-record.json, rollback scripts"],
  ], { fontSize: 12, limit: 5.0 });
  line(s, "KSI", "Every step leaves an evidence record naming its controls and KSIs; Chapter 10 adds no new KSI ID.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: NIST SP 800-53 Rev. 5; FedRAMP, \"Key Security Indicators\"; Module 9, Unit 1 (Chapter 10's requirements, KSIs and evidence); Unit 7.");
  notes(s,
`The federal requirement. The controls are from NIST SP 800-53, Revision 5, at the Moderate baseline. Every runbook step has a requirements table, and every step leaves an evidence record that names its controls and KSIs. The pre-flight check meets C M three, enhancement two: the settings, kits, identities and cloud are checked before any change, and pre-flight dot json is the evidence, dry and live. Its rows P F oh two and P F oh five show no secret in the settings file and three certificate identities, for authenticator management and least privilege. The smoke test reads the gates' checks again after the change and answers go or no-go, for the verification of controls and continuous monitoring. One evidence package with a hash per file, verified, protects the audit information. And every change is recorded with its rollback, newest first. The KSI column is from FedRAMP's Key Security Indicators, which are indicators for cloud service providers; Chapter 10 uses only KSI IDs this workbook already maps to the same controls.`,
  `${M} — Unit 1 "Introduction" (Chapter 10's requirements, KSIs and evidence); Unit 7 "Summary."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on the runbook", [
    { q: "The smoke test runs on fixtures with --fixture. Can its report promote to production?", options: ["a. Yes, if it says GO", "b. No: production needs a live, passing test run; a fixture record proves nothing about the stage", "c. Yes, with the CISO's approval"] },
    { q: "rollback.py add writes an evidence record for a step. Why does the evidence check still mark that row missing?", options: ["a. The record is 'recorded': it proves the change was written down, not that the step worked", "b. The record has no hash", "c. The rollback hasn't run yet"] },
  ], "1 b: see the promotion criteria, and steps 4 and 6 of the lab. 2 a: see step 5 of the lab.");
  sources(s, "Sources: Module 9, Unit 6 \"Knowledge check,\" questions 1 and 2, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: the smoke test runs on fixtures with the fixture option. Can its report promote to production? The answer is b: no. Production's pre-flight check needs a live, passing test run, and a fixture record proves nothing about the stage. You saw P F ten refuse it in step six. Second: rollback add writes an evidence record for a step. Why does the evidence check still mark that row missing? The answer is a: the record is recorded, which proves the change was written down, not that the step worked. That's why only two of seventeen rows were evidenced in step five. The module page has two more questions, on the three identities and on what production's pre-flight check compares, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 2; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: you've finished the path");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Ran a pre-flight check, and recorded changes with their rollback",
    "Saw a smoke test say no-go on fixtures",
    "Checked the evidence against the requirement rows",
    "Saw production's pre-flight refuse to promote without a live, passing test stage",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "WHERE TO GO NEXT", "The path is done", [
    "The learning path index",
    "The Labs page, for every lab",
    "The Chapter 10 checklist, before you run a stage",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Keep for each stage: ",
    "the settings file and its hash, preflight.json, the smoke report, the package, deploy-record.json and evidence-check.json.");
  sources(s, "Sources: Module 9, Unit 7 \"Summary\" and \"You've finished the path\"; Book 19, Ch 10 \"Evidence the ISSO keeps.\"");
  notes(s,
`To sum up. You dry-ran the runbook's own scripts: a pre-flight check, changes recorded with their rollback, a smoke test that says no-go on fixtures, an evidence check against the requirement rows, and a production pre-flight that refuses to promote without a live, passing test stage. The evidence an ISSO keeps, for each stage: the settings file and its hash, the pre-flight results, the validation kit runs before and after, each kit's outputs, the smoke report, the evidence package and its verify result, the deploy record and the rollback scripts, and the evidence folder with its evidence check. For production, add the promotion record and seven days of chained drift packages per wave. Before you run a stage, work through the Chapter 10 checklist. And that's the end of the learning path. The path's index and the Labs page list every module and every lab.`,
  `${M} — Unit 7 "Summary"; "You've finished the path"; Book 19, Chapter 10 — "Evidence the ISSO keeps."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 9 deck", [
  "Module page: docs/training/attribute-driven-migration/09-deploying-to-test-and-production.md (Attribute-Driven Migration learning path, Module 9): the held-for-review callout, Units 1 to 7, Lab 1, Lab 2, knowledge check and summary. The learning path index.",
  "What the module links: Book 19, Chapter 10 \"What this runbook adds to the chapters,\" \"Before you start,\" \"The identities and what each may do,\" \"One environment settings file,\" \"Try the scripts against fixtures first,\" \"Stage 1: live test,\" \"Promotion go/no-go criteria,\" \"Stage 2: production,\" \"Evidence the ISSO keeps.\"",
  "Kit: examples/drift-pipeline/deploy (preflight.py, rollback.py, smoke_test.py, evidence.py, requirements.json, tests and tests/fixtures/test.json and production.json). Fictional values. Chapter 10 is held for review and hasn't been run against a live tenant.",
  "Lab output: run November 3, 2026 with Python 3.14.3 in a scratch copy of examples, outside the repository, from an empty out folder; it matches the module page and Chapter 10's dry-run output except the per-run hashes, which the deck doesn't show. Verification: docs/training/attribute-driven-migration/_verification/learning-path.md.",
]);

finish(OUT);
