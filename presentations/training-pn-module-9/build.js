// Provider Notices learning path, Module 9: Deploying to test and production (optional) — the module's narrated deck.
// Teaches docs/training/provider-notices/09-deploying-to-test-and-production.md, Learn-style: objectives, the concepts
// the page sends the learner to (workbook Chapter 08, the deployment runbook: what it depends on, before you start, the
// settings file, the code, the pre-flight checks, Stage 1, the promotion go/no-go, Stage 2 and the evidence), three
// "Try it" slides with the real Lab 1 dry-run commands and output (run November 12, 2026 in a scratch copy of
// examples/provider-notices, the same output the page shows), Lab 2, the federal requirement and evidence, a
// two-question check, and the summary, which ends the path. The runbook has never been run against a live tenant, and
// the deck says so. Every fact comes from those pages, their footnotes or the kit. Helpers: ../training-pn-module-1/pn.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pn-module-9/build.js \
//                      presentations/training-pn-module-9/Training_PN_Module_9.pptx
const P = require("../training-pn-module-1/pn.js")("Module 9: Deploying to test and production (optional)");
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_PN_Module_9.pptx";
const M = "Training, Provider Notices, Module 9";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 9: Deploying to test and production", "Provider Notices learning path · Optional, for whoever deploys the kit · Every gate, with workbook Chapter 08",
    ["The order  ·  The settings file  ·  The pre-flight  ·  Stage 1: test  ·  The go/no-go", "Stage 2: production  ·  Try it: the dry run  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 9 of the Provider Notices learning path: deploying to test and production. This module is optional. It's for whoever deploys the kit, and it follows Chapter 8 of the developer workbook, the deployment runbook, across every gate. One thing first, and it matters. Nobody has run this runbook against a live tenant, account, tenancy or project. Its deploy scripts have been run only in fixture mode, against a fictional test and production environment, and that dry-run output is real. Every live result in the chapter is labeled expected. This module's Lab 1 runs only the dry run. It takes about fifty-five minutes. You'll dry-run the pre-flight, the weekly run, the stage check and the rollback plans on fixtures.`,
  `${M} — Unit "Introduction"; the callout "Chapter 08 is a runbook nobody has run against a live tenant."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "One set of commands, run twice; only the settings change");
  tag(s, "Why");
  const l = panel(s, "Order", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "EACH STEP CAN BE UNDONE FIRST", "Before the next depends on it", [
    "Reads first, one provider at a time",
    "Routing as a dry run before anything is sent",
    "The one write to a cloud, the alert policy, only after the reads work",
    "The schedule last",
  ], 13);
  const r = panel(s, "Twice", 6.85, 1.45, 5.9, null, HEX.navy, HEX.navyTint, "TEST, THEN PRODUCTION", "A Lab 2 proves one provider", [
    "A deployment proves them together, on a schedule, with a rollback someone already ran",
    "In production, routing stays a dry run for the first week",
  ], 13);
  callout(s, "Live", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Not run live: ",
    "the deploy scripts ran only in fixture mode, against a fictional test and production environment. Every live result is labeled Expected.");
  sources(s, "Sources: Module 9, \"Introduction\"; workbook Chapter 08 (Status: a runbook nobody has run against a live tenant; What the runbook depends on).");
  notes(s,
`Why a runbook? Each provider's Lab 2 proves one provider in isolation. A deployment proves them together, on a schedule, with a rollback someone has already run. The runbook is one set of commands, run twice: once against test tenants, accounts, tenancies and projects, then unchanged against production. Only the settings file changes. The order puts each step where it can be undone before the next depends on it. Reads come first, one provider at a time. Routing runs as a dry run before anything is sent. The one write to a cloud, the Service Health alert policy, comes only after the reads work. And the schedule comes last. In production, routing stays a dry run for the first week before sending is turned on. The order is design guidance. And remember the status: the scripts ran only in fixture mode, and every live result is what the code and the providers' pages say should happen, not something anyone has seen.`,
  `${M} — Unit "Introduction"; workbook Chapter 08 — "Status," "What the runbook depends on."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 9", [
    "Describe the settings file's rules",
    "Run the pre-flight and the weekly run on fixtures, and read their checks",
    "Show the test stage's evidence passes, and production's pre-flight checks it (PF-07)",
    "Read the rollback plan, and show an unapproved hash applies nothing",
    "Explain the go/no-go, and why production routes as a dry run for a week",
  ], [
    "Modules 1 to 8, or at least their Lab 1s",
    "Module 8: the evidence chain and the stage check",
    "Lab 1: PowerShell 7.1+ with Pester 5; no tenant",
  ], 55);
  sources(s, "Sources: Module 9, \"Learning objectives,\" \"Prerequisites.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll describe the settings file's rules: no secrets, no placeholder in an enabled provider, the stage it says it is, and named notice contacts. You'll run the pre-flight and the weekly run on fixtures, and read their checks. You'll show that the test stage's evidence passes once a pre-flight and a weekly run are recorded, and that production's pre-flight checks it, in the check called P F oh seven. You'll read the rollback plan in reverse order, and show that an unapproved hash applies nothing. And you'll explain the promotion go/no-go, and why production routes as a dry run for its first week. You need Modules 1 to 8, or at least their Lab 1s, because this module doesn't teach the kit's chapters again. Module 8 matters most, for the evidence chain and the stage check this module passes.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Settings and the code
{
  const s = content(SC, "The settings file, and the kit's only writes");
  tag(s, "What");
  const l = panel(s, "Rules", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "READ-PNSETTINGS ENFORCES", "One JSON file per stage", [
    "No secrets: a secret-like name with a value stops the run; the ServiceNow token is an environment variable",
    "No placeholder like <tenant-id> in an enabled provider",
    "The stage it says it is (PF-01); named notice contacts (PF-05)",
  ], 12.5);
  const r = panel(s, "Writes", 6.85, 1.45, 5.9, null, HEX.red, HEX.redTint, "THE WRITES, EACH GATED", "Every collector call is a read", [
    "The Azure Policy assignment and remediation; the rollback: only with -Apply and the plan's approved SHA-256",
    "The scheduled task; payloads to the agency's endpoint, only with -Send and routing.send",
  ], 12.5);
  callout(s, "Cloud", Math.max(l, r) + 0.3, 1.05, "FaCloud", HEX.teal, "Which cloud: ",
    "the settings file names it. The estate is Microsoft 365 GCC with commercial Azure: graph.microsoft.com and management.azure.com. Any other name throws.");
  sources(s, "Sources: Module 9, Unit 1; workbook Chapter 08 (The settings file; What the runbook depends on; The code this chapter uses); Graph national cloud deployments.");
  notes(s,
`Unit 1 is what the runbook adds. One settings file per stage holds every value the commands need, and the settings reader enforces its rules before any command runs. No secrets: a secret-like name, such as password, client secret or token, with a value, stops the run, and the ServiceNow token is read at run time from an environment variable. No placeholders in an enabled provider. The stage it says it is, checked by the pre-flight. And named notice contacts for each enabled provider. Every collector call is a read. The kit's writes are few, and each is gated: the Azure Policy assignment and its remediation, and the rollback, run only with apply and the plan's approved SHA-256; payloads go to the agency's endpoint only with send and the settings flag. The settings file also names each provider's cloud. The estate the runbook writes for is Microsoft 365 G C C with commercial Azure, on the worldwide Graph and Resource Manager hosts. GCC High and DoD are other names in the same file. The kit doesn't build the ServiceNow endpoint; that's the agency's.`,
  `${M} — Unit 1: workbook Chapter 08 — "The settings file," "What the runbook depends on," "Which cloud, for these steps," "The code this chapter uses."`);
}

// ================================================================== 5 Pre-flight
{
  const s = content(SC, "The pre-flight: seven checks, reads only");
  tag(s, "What");
  const b = table(s, "PF", 1.45, [2.2, 4.4, 5.55], ["Check", "What it reads", "Fails when"], [
    ["PF-01", "The settings and routing files", "Wrong stage, no provider enabled, routing invalid, or sending on without an endpoint"],
    ["PF-02-<provider>", "The provider's tool: az, the Graph module, oci, aws, gcloud", "It isn't installed"],
    ["PF-03-<provider>", "The signed-in cloud", "Another cloud, tenant, partition or realm"],
    ["PF-04-<provider>", "The reader's first call; for AWS also the support plan", "The call fails (AWS: SubscriptionRequiredException)"],
    ["PF-05-<provider>", "noticeContacts", "Nobody is named to receive the provider's notices"],
    ["PF-06", "The output root", "It can't be written"],
    ["PF-07", "Production only: the test stage's evidence", "-Check -Stage test would fail"],
  ], { fontSize: 11.5, limit: 5.6 });
  line(s, "Exit", "Test-PnPreflight.ps1 writes results.json and a manifest, and exits 1 on any Fail.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 9, Unit 2; workbook Chapter 08 (Pre-flight checks; The code this chapter uses).");
  notes(s,
`Unit 2 is the stages, and every stage starts with the pre-flight. It reads only, and it runs after the readers sign in. P F oh one reads the settings and routing files, and fails on the wrong stage, no provider enabled, routing that doesn't validate, or sending turned on without an endpoint and token variable. Then four checks per enabled provider. Oh two: the provider's tool is installed. Oh three: the signed-in cloud is the one the settings name, not another cloud, tenant, partition or realm. Oh four: the reader's first call works, and for AWS that includes the support plan; without a qualifying plan the call fails with a subscription required exception. Oh five: somebody is named to receive the provider's notices. That's the pre-flight's link to S R eight. P F oh six checks that the output root can be written. And P F oh seven runs in production only: it fails if the test stage's evidence wouldn't pass its stage check. Production can't start until test has passed.`,
  `${M} — Unit 2: workbook Chapter 08 — "Pre-flight checks."`);
}

// ================================================================== 6 Stage 1
{
  const s = content(SC, "Stage 1: test, in nine steps");
  tag(s, "How");
  const b = table(s, "S1", 1.45, [0.8, 4.4, 6.95], ["Step", "What it does", "Why"], [
    ["1.1-1.2", "Sign in each reader; run the pre-flight", "Reads only, before anything else"],
    ["1.3", "Staged enable, one provider at a time", "Each cross-checked against the provider's own command; a failure in one would hide the others"],
    ["1.4", "Route as a dry run, and read the payloads", "Every security advisory and retirement has a payload the change manager recognizes"],
    ["1.5", "Smoke test, ST-01 to ST-04", "Expected results written down before it runs"],
    ["1.6", "Service Health alerts at the test subscription", "Applied with the hash a reviewer who isn't the operator approved"],
    ["1.7-1.8", "The weekly run on a schedule; the stage's evidence", "Windows Task Scheduler's own cmdlets; -Check -Stage test"],
    ["1.9", "Rehearse the rollback", "An approved plan reverses the deployment, and did"],
  ], { fontSize: 11.5, limit: 5.6 });
  line(s, "Kept", "The rollback leaves the remediation's resources until the change record decides; state, runs and evidence are kept.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 9, Unit 2; workbook Chapter 08 (Stage 1: test, Steps 1.1 to 1.9; Approvals); Service Health alerts with Azure Policy.");
  notes(s,
`Stage 1, the test stage, has nine steps. Sign in each reader, then run the pre-flight. Then the staged enable: read each enabled provider on its own, cross-check it against the provider's own command, and record it, before the providers run together, because a failure in one would hide the others. Route the full collection as a dry run, and have the service desk read the payloads: every security advisory and retirement should have one, with an assignment group the change manager recognizes. Run the smoke test, four checks with their expected results written down first. Then the one write to a cloud: the Service Health alert policy from Microsoft Learn's guidance on deploying alerts at scale with Azure Policy, at the test subscription, applied only with the hash a reviewer who isn't the operator approved. Schedule the weekly run with Windows Task Scheduler's own cmdlets, and check the stage's evidence. Finally, rehearse the rollback. Deleting the policy assignment doesn't remove the resources the remediation created; the change record decides on those.`,
  `${M} — Unit 2: workbook Chapter 08 — "Stage 1: test," Steps 1.1 to 1.9; "Approvals."`);
}

// ================================================================== 7 Go/no-go and production
{
  const s = content(SC, "The go/no-go, and production's dry-run week");
  tag(s, "Who");
  const l = panel(s, "Go", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "PROMOTE ONLY WHEN ALL SEVEN PASS", "Recorded by the ISSO and the change advisory board", [
    "Test evidence passes; each collection matched the provider's command; smoke test passed",
    "Routing reviewed; alert policy applied and its rollback rehearsed",
    "Notice contacts named; known gaps recorded with the ISSO",
  ], 12.5);
  const r = panel(s, "Prod", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "STAGE 2: PRODUCTION", "The same commands, the production file", [
    "Pre-flight with PF-07; staged enable; alerts at the management group",
    "First week: routing stays a dry run; the desk works from the payloads by hand",
    "Sending on only after the change manager approves",
  ], 12.5);
  callout(s, "Weekly", Math.max(l, r) + 0.3, 1.0, "FaArrowsRotate", HEX.amber, "Every week after: ",
    "-Check -Stage production needs PRE, ALERTS, RUN, ROUTE and DIGEST. A week with no new RUN record means the run stopped.");
  sources(s, "Sources: Module 9, Unit 2; workbook Chapter 08 (Promotion go/no-go criteria; Stage 2: production, Steps 2.1 to 2.6; Dangers).");
  notes(s,
`Promotion to production happens only when all seven go/no-go criteria pass, and the ISSO and the change advisory board record the decision. The test stage's evidence passes. Every provider's collection matched the provider's own command. The smoke test passed. The routing was reviewed. The alert policy applied, and its rollback was rehearsed. Each provider's notice contacts are named. And the known gaps are recorded with the ISSO. Stage 2 runs the same commands with the production settings file. The pre-flight now includes P F oh seven. Providers are enabled one at a time again, and the alert policy is applied at the management group. For the first week, routing stays a dry run: the service desk works from the payloads by hand, so duplicate or misrouted tasks don't reach the queue. Sending is turned on only after the change manager approves. From then on, check the production stage's evidence every week. It needs pre-flight, alerts, run, route and digest, and a week with no new run record means the run stopped.`,
  `${M} — Unit 2: workbook Chapter 08 — "Promotion go/no-go criteria," "Stage 2: production," "Dangers."`);
}
endModule(SC);

// ================================================================== 8 Try it: test stage
{
  const s = content(SL, "Try it: the test stage's pre-flight and weekly run");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1: the template is refused",
    "Exception: Settings deploy/settings.template.json still has a <placeholder> in provider 'azure'.",
    "# Step 2: the test stage's pre-flight (fixture mode, fictional environment; trimmed)",
    "$ ./deploy/Test-PnPreflight.ps1 -SettingsPath deploy/tests/fixtures/settings.test.json -Stage test ...",
    "PF-01           Pass  settings and routing read; providers: azure, m365, oci",
    "PF-05-azure     Pass  1 notice contact(s) named",
    "Preflight (test): 14 checks, 0 failed. Written to out/deploy-test/preflight",
    "# Step 3: record it          Record 1: Pass (PRE, EVIDENCE)   Controls: AU-9, CA-7, SA-9, SR-8",
    "# Step 4: the weekly run on the day-one fixtures",
    "RUN-COLLECT  Pass  15 notices from azure, m365, oci",
    "RUN-ROUTE    Pass  8 create, 0 update, 0 close; dry run",
    "RUN-DIGEST   Pass  13 open, 5 need action",
  ], { label: "TRY IT  ·  LAB 1 DRY RUN, RUN NOVEMBER 12, 2026 (TRIMMED)", pt: 10.5 });
  line(s, "Dry", "Nothing signs in and nothing is sent: the test and production environments are fictional.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Exercise: Lab 1,\" steps 1 to 4; examples/provider-notices/deploy: PnDeploy.psm1, Test-PnPreflight.ps1, Invoke-PnScheduledRun.ps1.");
  notes(s,
`Try it. Lab 1 is the runbook's dry run on the kit's fixtures, in the provider notices folder, in PowerShell 7. The test and production environments are fictional: nothing signs in, and nothing is sent. Step one loads the deploy module and checks the settings template. It's refused, because it still has a placeholder in the Azure provider. A filled-in file prints its stage instead. Step two runs the test stage's pre-flight. The test fixture enables Azure, Microsoft 365 and Oracle Cloud Infrastructure, so there are fourteen checks: P F oh one, the four per-provider checks for each of the three, and P F oh six. All fourteen pass. Step three records the pre-flight as evidence, with the example change record. Its controls include S R eight, for the named contacts. Step four runs the weekly run on the day-one fixtures: fifteen notices from three providers, eight creates routed as a dry run, and a digest with thirteen open and five that need action.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 4.`);
}

// ================================================================== 9 Try it: stage passes, production pre-flight
{
  const s = content(SL, "Try it: the stage check passes, then PF-07");
  tag(s, "How");
  const c = code(s, "Stage", 0.6, 1.45, 12.15, [
    "# Step 5: check the test stage's evidence",
    "$ ./Invoke-PnEvidence.ps1 -EvidencePath out/deploy-test/evidence -Check -Stage test",
    "SUMS           Pass  31 files match SHA256SUMS",
    "CHAIN          Pass  5 records, chain unbroken",
    "STEP-PRE       Pass  a passing record covers it",
    "STEP-RUN       Pass  a passing record covers it",
    "STEP-ROUTE     Pass  a passing record covers it",
    "STEP-DIGEST    Pass  a passing record covers it",
    "# Step 6: records.csv    1 preflight, 2 collect, 3 route, 4 digest, 5 scheduled-run: each Pass",
    "# Step 8: production's pre-flight, with -TestEvidencePath out/deploy-test/evidence (trimmed)",
    "PF-07           Pass  the test stage's evidence passes",
    "Preflight (production): 23 checks, 0 failed.",
  ], { label: "TRY IT  ·  LAB 1 DRY RUN, RUN NOVEMBER 12, 2026 (TRIMMED)", pt: 10.5 });
  line(s, "Two", "The two rows Module 8's lab failed now pass: the pre-flight and the weekly run are recorded.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Exercise: Lab 1,\" steps 5, 6 and 8; workbook Chapter 08 (Pre-flight checks); examples/provider-notices/Invoke-PnEvidence.ps1.");
  notes(s,
`Step five checks the test stage's evidence. Thirty-one files match the checksum file, and five records form an unbroken chain. And every step the test stage needs passes: pre-flight, run, route and digest. The two rows Module 8's lab failed now pass, because the pre-flight and the weekly run are recorded. Step six reads the records' index: the pre-flight, then the weekly run's collection, routing and digest, then the scheduled run itself, each pass. Step seven plans the test stage's rollback, one step that unregisters the weekly task if it exists, and changes nothing. Step eight runs production's pre-flight, and hands it the test stage's evidence. Production enables all five providers, so there are twenty-three checks, ending with P F oh seven: the test stage's evidence passes. Twenty-three checks, none failed. If the test stage hadn't passed, P F oh seven would fail, and production couldn't start.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 to 8.`);
}

// ================================================================== 10 Try it: alerts and rollback
{
  const s = content(SL, "Try it: plans in reverse, and a hash nobody approved");
  tag(s, "How");
  const c = code(s, "Rb", 0.6, 1.45, 12.15, [
    "# Step 9: the alert plan at the production management group: AL-01, AL-02 WouldApply",
    "Plan SHA-256: 6a1ec6adbd50bc2cec2bcc803ee45629bc0a0d7de416fcafd3216db443a4a3b7",
    "# Step 10: production's rollback plan, in reverse order (commands trimmed)",
    "RB-01  WouldApply  pwsh Get-ScheduledTask -TaskName 'ProviderNotices-Weekly' ... | Unregister-ScheduledTask ...",
    "RB-02  WouldApply  az policy assignment delete --name pn-service-health-alerts --scope .../mg-contoso-example",
    "RB-03  Manual      az group list --query [?name=='rg-serviceHealthAlert']",
    "Plan SHA-256: 1278f8275edaf48f33b8b23d02bb3736f574cebfa1f4191248ffda5628fb93e6",
    "Dry run: nothing changed.",
    "$ ./deploy/Invoke-PnRollback.ps1 ... -Apply -ApprovedSha256 ('0' * 64)",
    "Exception: The plan's SHA-256 is 1278f827...; -ApprovedSha256 must match it before -Apply runs anything.",
    "# Step 11: deploy tests    PassedCount 25   FailedCount 0   NotRunCount 0",
  ], { label: "TRY IT  ·  LAB 1 DRY RUN, RUN NOVEMBER 12, 2026 (TRIMMED)", pt: 10.5 });
  line(s, "Manual", "RB-03 is manual: the change record decides on what the remediation created.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 9, \"Exercise: Lab 1,\" steps 9 to 11; examples/provider-notices/deploy: New-PnAlertPolicy.ps1, Invoke-PnRollback.ps1, tests/Deploy.Tests.ps1.");
  notes(s,
`Step nine plans the Service Health alerts at the production management group: two steps, assign and remediate, each would apply, and a plan SHA-256. It's the same plan as Module 2's. Step ten plans production's rollback, in reverse order of the deployment. First, unregister the weekly scheduled task. Second, delete the policy assignment. Third, a manual step: list the resource group the remediation created, because the change record decides on what the remediation created, not the script. Dry run: nothing changed. Then the second command tries to apply that plan with a hash nobody approved, all zeros. It's refused: the approved hash must match the plan's SHA-256 before apply runs anything. That's the guard against a plan changed after approval. Step eleven runs the deploy scripts' tests: twenty-five pass, none fail and none are skipped, on Windows, where one of them runs only there. Then delete the dry run's folders.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 9 to 11; workbook Chapter 08 — "Dangers."`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: the test stage, then production");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A test environment for each enabled provider, never production, with each reader granted in its module's Lab 2; an approved change record"],
    ["People", "Someone who can create policy and role assignments; a reviewer who isn't the operator to approve each hash; a Windows run-as account"],
    ["Stage 1", "Settings, sign-in, pre-flight, staged enable, dry-run routing, smoke test, alert policy, schedule, evidence, rollback rehearsal"],
    ["Stage 2", "Only when every go/no-go criterion passes"],
    ["Back it out", "Step 1.9: the task unregistered and the assignment deleted; remediation's resources wait for the change record"],
  ], { fontSize: 12, limit: 5.2 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by anyone yet: ",
    "follow the workbook's Chapter 08, Stage 1 and Stage 2, which have the exact commands.");
  sources(s, "Sources: Module 9, \"Exercise: Lab 2, the test stage, then production\"; workbook Chapter 08 (Before you start; Stage 1; Stage 2).");
  notes(s,
`Lab 2 is the runbook itself, and nobody has run it yet. You need a test environment for each provider the agency enables, never production, with each reader already granted in its module's Lab 2, and an approved change record. You also need people: someone who can create policy and role assignments for the alert policy, a reviewer who isn't the operator to approve each plan's hash, and a Windows account for the scheduled run. Then follow Stage 1: fill and check the settings file, sign in each reader, run the pre-flight, enable the providers one at a time with a cross-check each, route as a dry run, run the smoke test, apply the alert policy with its approved hash, schedule the weekly run, check the stage's evidence and rehearse the rollback. Stage 2, production, comes only when every go/no-go criterion passes. To back it out, Step 1.9 applies the approved rollback. The state, runs and evidence are kept.`,
  `${M} — Unit "Exercise: Lab 2, the test stage, then production"; workbook Chapter 08 — "Before you start," "Stage 1: test," "Stage 2: production."`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for deploying");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.4, 3.4, 5.35], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["CM-3 b", "KSI-CMT-LMC, KSI-CMT-RVP", "The change record; the settings file's SHA-256 in results.json"],
    ["SA-9 c; SR-8", "KSI-SCR-MON", "preflight/results.json: every reader in its own cloud; notice contacts named"],
    ["SA-9 c; SI-5; CA-7; RA-3 f", "KSI-SCR-MIT, KSI-SCR-MON, KSI-MLA-EVC", "The weekly run's folder and records; the weekly digest"],
    ["CA-7; AU-9", "KSI-MLA-EVC, KSI-MLA-OSM", "The evidence folder, checked with -Check -Stage"],
    ["CM-3; CP-2", "KSI-CMT-LMC, KSI-RPL-ARP", "rollback/plan.json, results.json and its record"],
  ], { fontSize: 11.5, limit: 5.0 });
  line(s, "KSI", "KSIs belong to cloud providers; the agency lines its evidence up with them. Every alignment is design guidance.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 9, \"Introduction\"; workbook Chapter 08 (Requirements, KSIs and evidence); NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Every runbook step ends with a requirements table, and the kit writes an evidence record for each run. The change record and the settings file's hash support C M three, part b, reviewing proposed changes. The pre-flight's results support S A nine, part c, and S R eight, notification agreements: every reader works in its own cloud, and each provider's notice contacts are named. The weekly run's folder, its records and the weekly digest support S A nine, S I five, C A seven and R A three, part f. The evidence folder, checked with the stage check, supports continuous monitoring and the protection of audit information. And the rollback plan, its results and its record support C M three and C P two, the contingency plan. K S I's are FedRAMP twenty X indicators for cloud service providers. The agency lines its evidence up with them, and doesn't report them. Every alignment is the program's reading, and the assessor and the authorizing official decide each control.`,
  `${M} — Unit "Introduction" (the federal requirement); workbook Chapter 08 — "Requirements, KSIs and evidence."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on deploying", [
    { q: "Production's pre-flight fails PF-07. What does that mean?", options: ["a. A provider's tool isn't installed", "b. The test stage's evidence doesn't pass -Check -Stage test, so production can't start", "c. Sending is turned on"] },
    { q: "Why does production route as a dry run for its first week?", options: ["a. Payloads are invalid in the first week", "b. So duplicate or misrouted tasks don't reach the queue; the desk works from the payloads by hand until the change manager approves sending", "c. Providers publish nothing then"] },
  ], "1 b: PF-07 runs in production only. 2 b: sending needs the settings flag, -Send and the change manager's approval.");
  sources(s, "Sources: Module 9, \"Knowledge check,\" questions 3 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: production's pre-flight fails P F oh seven. What does that mean? The answer is b. The test stage's evidence doesn't pass its stage check, so production can't start. P F oh seven runs in production only, and it's the guard against deploying to production before test has passed. Second: why does production route as a dry run for its first week? The answer is b. So duplicate or misrouted tasks don't reach the queue. The service desk works from the payloads by hand, and sending is turned on only after the change manager approves, with the settings flag and the send switch. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 3 and 4; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: you've finished the Provider Notices path");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Saw the template refused, and passed the test pre-flight",
    "Recorded it, ran the weekly run, and passed the test stage's evidence check",
    "Passed production's pre-flight with PF-07, and planned the alerts",
    "Planned both rollbacks, and watched an unapproved hash apply nothing",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "WHERE NEXT", "The learning path's end", [
    "The chapter's checklist before shipping",
    "Back to the learning path",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.05, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "each stage's evidence folder, with the change record, the settings file and its SHA-256, the approved plan hashes and the weekly digests, on agency storage.");
  sources(s, "Sources: Module 9, \"Summary\"; workbook Chapter 08 (Evidence the ISSO keeps; Checklist); learning path index.");
  notes(s,
`To sum up. You saw the settings template refused, passed the test stage's pre-flight, recorded it, ran the weekly run, and passed the test stage's evidence check. You passed production's pre-flight with P F oh seven, planned the alerts at the management group, planned both rollbacks, and watched an unapproved hash apply nothing. The evidence an ISSO keeps for the deployment is each stage's evidence folder, with the change record, the settings file and its SHA-256, the approved plan hashes and the weekly digests filed beside it, on agency storage. Before shipping, work through the chapter's checklist. And remember that this runbook hasn't been run against a live tenant yet: run Stage 1 in test before anything touches production. That finishes the Provider Notices learning path: nine modules, from why notices go unread, through five providers, routing and evidence, to the deployment. Go back to the learning path for the whole map.`,
  `${M} — Unit "Summary"; workbook Chapter 08 — "Evidence the ISSO keeps," "Checklist"; learning path index.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 9 deck", [
  "Module page: docs/training/provider-notices/09-deploying-to-test-and-production.md (Provider Notices learning path, Module 9, optional): the status callout, Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index.",
  "What the module sends the learner to: workbook Chapter 08, \"Status,\" \"What the runbook depends on,\" \"Requirements, KSIs and evidence,\" \"Before you start,\" \"The settings file,\" \"The code this chapter uses,\" \"Pre-flight checks,\" \"Stage 1: test,\" \"Promotion go/no-go criteria,\" \"Stage 2: production,\" \"Evidence the ISSO keeps,\" \"Dangers,\" \"Checklist.\" Its footnotes: Microsoft Learn (National cloud deployments; Deploy Service Health alerts at scale using Azure Policy; Azure Policy remediation and CLI; app-only Graph PowerShell; ScheduledTasks cmdlets), NIST SP 800-53 Rev. 5 (OSCAL 5.2.0) and FedRAMP's Key Security Indicators.",
  "Kit: examples/provider-notices (deploy/PnDeploy.psm1, Test-PnPreflight.ps1, Invoke-PnScheduledRun.ps1, New-PnAlertPolicy.ps1, Invoke-PnRollback.ps1, settings.template.json, tests/fixtures; Invoke-PnEvidence.ps1). Fictional test and production environments. The runbook hasn't been run against a live tenant; its live results are labeled Expected.",
  "Lab output: the dry run, run November 12, 2026 with PowerShell 7.6 and Pester 5.9 on Windows in a scratch copy of examples/provider-notices; the same output the module page shows. Output trimmed where the slides say so. Verification: docs/training/provider-notices/_verification/learning-path.md. Lab 2 not run by anyone.",
]);

finish(OUT);
