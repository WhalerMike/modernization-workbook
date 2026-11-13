// Provider Notices learning path, Module 8: Digest, evidence and go/no-go — the module's narrated deck.
// Teaches docs/training/provider-notices/08-digest-evidence-and-go-no-go.md, Learn-style: objectives, the concepts the
// page sends the learner to (Book 15, Chapter 14, "The weekly digest"; the guide's Step 7 and Evidence; workbook
// Chapter 07, "What it leaves to you," "The digest," "The evidence record," "Dangers"; the runbook's promotion
// go/no-go criteria in Chapter 08), three "Try it" slides with the real Lab 1 commands and output (run November 12, 2026
// in a scratch copy of examples/provider-notices, the same output the page shows), Lab 2, the federal requirement and
// evidence, a two-question check, and the summary. Every fact comes from those pages, their footnotes or the kit.
// Helpers: ../training-pn-module-1/pn.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pn-module-8/build.js \
//                      presentations/training-pn-module-8/Training_PN_Module_8.pptx
const P = require("../training-pn-module-1/pn.js")("Module 8: Digest, evidence and go/no-go");
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_PN_Module_8.pptx";
const M = "Training, Provider Notices, Module 8";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 8: Digest, evidence and go/no-go", "Provider Notices learning path · Gate G7 Digest and evidence, with workbook Chapter 07",
    ["The digest and its readers  ·  What the guide leaves to you  ·  The evidence record", "The stage check  ·  The go/no-go  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 8 of the Provider Notices learning path: digest, evidence and go/no-go. Most notices shouldn't be tasks. The weekly digest is how the owners see the rest, and how they see what needs action and by when. The evidence is what the ISSO keeps: every run recorded with the controls and K S I's it supports, every file's hash, and the hash of the record before it, so a changed file or a removed week shows. This module is Gate 7 of the provider notices implementation guide, with Chapter 7 of the developer workbook, and the deployment runbook's promotion criteria. It takes about sixty minutes. You'll write a week's digest, record three runs, check the chain, see a lab stage fail the go/no-go, and catch a file edited after it was recorded. The code is illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Most notices aren't tasks; the owners still need them");
  tag(s, "Why");
  const l = panel(s, "Digest", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "THE DIGEST", "How the owners see the rest", [
    "Once a week, for each provider: open notices, action required, the next 30 days, new, closed",
    "To the owners, not a shared mailbox",
    "Its home: the service desk supervisor's weekly queue review and the change advisory board's agenda",
  ], 13);
  const r = panel(s, "Ev", 6.85, 1.45, 5.9, null, HEX.navy, HEX.navyTint, "THE EVIDENCE", "What the ISSO keeps", [
    "Every run, with the controls and KSIs it supports",
    "Every file's hash",
    "The hash of the record before it, so a changed file or a removed week shows",
  ], 13);
  callout(s, "Watch", Math.max(l, r) + 0.3, 0.95, "FaChartLine", HEX.amber, "Two numbers to watch: ",
    "notices that reached their due date with the task still open, and notices never routed because no rule matched (design guidance).");
  sources(s, "Sources: Module 8, \"Introduction\"; Book 15, Ch 14 (The weekly digest); Book 15, Ch 10.");
  notes(s,
`Why a digest, and why evidence? Not every notice is a task, and most shouldn't be. The digest is how the owners see the rest. Once a week it lists, for each provider, the open notices; every notice that needs action, with its due date and owner; the maintenance and changes starting in the next thirty days; what's new in the last week; and what closed or stopped being listed. It goes to the owners, not to a shared mailbox. The Compliance Automation and Day-Two Operations book gives it a natural home in reviews that already exist: the service desk supervisor's weekly review of the queue, and the change advisory board's agenda, where the next thirty days of maintenance and changes belong. Two numbers from it are worth watching over time: notices that needed action and reached their due date with the task still open, and notices that were never routed because no rule matched them. That's design guidance. The evidence is the other half: what the ISSO keeps, recorded so a change or a gap shows.`,
  `${M} — Unit "Introduction"; Unit 1: Book 15, Chapter 14 — "The weekly digest" (design guidance).`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 8", [
    "Write the weekly digest, and read its five sections as an owner would",
    "Record a collection, a routing run and a digest as evidence, and name their steps, controls and KSIs",
    "Check the chain and SHA256SUMS, and show an edit fails both",
    "Check a stage's coverage, and read the runbook's promotion go/no-go",
  ], [
    "Module 7: this lab repeats its two collections and routings",
    "Lab 1: PowerShell 7.1+ with Pester 5; no tenant",
    "Lab 2: an earlier module's Lab 2 run folder, on agency storage",
  ], 60);
  sources(s, "Sources: Module 8, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll write the weekly digest, and read its five sections as an owner would. You'll record a collection, a routing run and a digest as evidence, and say which steps, controls and K S I's each record names. You'll check the evidence chain and the checksum file, and show that an edit after recording fails both. You'll check a stage's coverage, and name the steps a test stage and a production stage need. And you'll read the runbook's promotion go/no-go criteria, and say which ones the evidence check answers. You need Module 7 first, because this lab repeats its two collections and routings. Lab 1 needs PowerShell 7.1 or later with Pester 5, and no tenant. Lab 2 uses a run folder from an earlier module's Lab 2, kept on agency storage.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 The digest
{
  const s = content(SC, "The digest: five sections and their windows");
  tag(s, "What");
  const b = table(s, "Sec", 1.45, [0.8, 5.0, 6.35], ["#", "Section", "What it shows"], [
    ["1", "Open notices by provider", "Counted by kind and action required"],
    ["2", "Action required", "Soonest due first, with the assignment group the routing named, or digest when no task"],
    ["3", "Maintenance and changes in the next 30 days", "What starts soon enough to plan for"],
    ["4", "New in the last 7 days", "By first-seen time in the routing state"],
    ["5", "Closed or no longer listed in the last 7 days", "Including notices the provider stopped listing"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Files", b + 0.25, 0.95, "FaTableList", HEX.navy, "Written by Invoke-PnDigest.ps1: ",
    "digest.md for the owners, digest.csv with each notice's route and owner, and a manifest. -Days and -UpcomingDays set the windows.");
  sources(s, "Sources: Module 8, Unit 1; workbook Chapter 07 (The digest); the guide, Step 7.");
  notes(s,
`Unit 1 is the digest as code. The digest script reads a collection and the routing state, and writes a page in five sections. One: open notices by provider, counted by kind and by action required. Two: action required, soonest due first, with the assignment group the routing named, or the word digest when there's no task. Three: maintenance and changes starting in the next thirty days. Four: what's new in the last seven days, by the first-seen time in the routing state. And five: what closed or stopped being listed in the last seven days, including notices the provider simply stopped listing. It writes the page as Markdown for the owners, a spreadsheet file with each notice's route and owner, and a manifest. The window lengths are parameters, and in the scheduled run they come from the settings file's digest block. The guide's validation for the digest is simple: every action-required notice shows its due date and owner.`,
  `${M} — Unit 1: workbook Chapter 07 — "The digest"; the guide — Step 7, "Validate (G7 Digest and evidence)."`);
}

// ================================================================== 5 What the guide leaves to you
{
  const s = content(SC, "What the guide names, and what the kit adds");
  tag(s, "What");
  const b = table(s, "Adds", 1.45, [3.4, 4.0, 4.75], ["What the guide names", "Why naming isn't enough", "What the kit adds"], [
    ["The digest goes to the owners", "Owners read a page, not a JSON file", "digest.md in five sections; digest.csv with route and owner"],
    ["Every run is in the evidence", "A folder of files can be changed after the fact", "Each run checked against its manifest, copied, and recorded with every file's SHA-256"],
    ["Controls and KSIs per gate", "Someone has to say which run supports which", "Each record names its steps and their controls and KSIs"],
    ["Records kept over time", "A record removed from the middle goes unnoticed", "Each record holds the SHA-256 of the record before it"],
    ["A go/no-go", "Which steps still lack evidence?", "-Check -Stage lists every step the stage needs, pass or fail"],
  ], { fontSize: 12, limit: 5.3 });
  line(s, "Verdict", "A list of files isn't evidence until someone can check it.", b + 0.2, 0.45, 14);
  sources(s, "Sources: Module 8, Unit 2; workbook Chapter 07 (What it leaves to you); the guide (Evidence); examples/provider-notices/config/requirements.json.");
  notes(s,
`Unit 2 starts with what the guide leaves to you. The guide says the digest goes to the owners, but owners read a page, not a JSON file, so the kit writes a page and a spreadsheet. It says every run is in the evidence, but a folder of files can be changed after the fact, so the kit checks each run folder against its manifest, copies it, and records every file's SHA-256. It lists controls and K S I's per gate, but someone has to say which run supports which, so each record names its steps and their controls and K S I's, from the kit's requirements catalog. Records are kept over time, but a record removed from the middle goes unnoticed, so each record holds the hash of the record before it. And the guide asks for a go/no-go, which raises the question of which steps still lack evidence. The stage check answers it, step by step. The workbook's verdict: a list of files isn't evidence until someone can check it.`,
  `${M} — Unit 2: workbook Chapter 07 — "What it leaves to you."`);
}

// ================================================================== 6 The evidence record
{
  const s = content(SC, "The evidence record, and what a stage needs");
  tag(s, "What");
  const b = table(s, "Steps", 1.45, [5.6, 6.55], ["Run", "Steps it covers"], [
    ["A collection", "COL-<PROVIDER> for each provider read, NORMALIZE"],
    ["A routing run", "ROUTE, and CONTINGENCY if a payload asks for a plan review"],
    ["A digest", "DIGEST"],
    ["The runbook's pre-flight, scheduled run, alert plan, rollback", "PRE, RUN, ALERTS, RB"],
    ["Every record", "EVIDENCE"],
  ], { fontSize: 12.5, limit: 4.4 });
  panel(s, "Stage", 0.6, b + 0.2, 12.15, null, HEX.teal, HEX.tealTint, "-CHECK AND -CHECK -STAGE", null, [
    "-Check verifies SHA256SUMS against every file and walks the chain",
    "-Stage test needs PRE, RUN, ROUTE and DIGEST; production adds ALERTS. Any failing row exits 1",
  ], 12.5);
  sources(s, "Sources: Module 8, Unit 2; workbook Chapter 07 (The evidence record); the guide, Step 7.");
  notes(s,
`The evidence script records one run folder at a time. It re-hashes every file the run's manifest lists, copies the folder under runs, and writes a record with the time, the environment, the mode, the change record, the command, and the result, which is pass only if every file matches its manifest. The record names the steps the run covers, with their controls and K S I's, the claim language, every file's SHA-256, and the previous record's SHA-256. It appends an index file and rewrites a checksum file that the standard sha256sum tool can check. A collection covers one collection step per provider and the normalize step. A routing run covers route, and contingency if a payload asks for a plan review. A digest covers digest. The runbook's pre-flight, scheduled run, alert plan and rollback each have their own step. The check verifies the checksums and walks the chain. With a stage, it adds a row for each step that stage needs: test needs pre-flight, run, route and digest, and production adds alerts.`,
  `${M} — Unit 2: workbook Chapter 07 — "The evidence record"; the guide — Step 7.`);
}

// ================================================================== 7 Go/no-go and dangers
{
  const s = content(SC, "The promotion go/no-go, and the dangers it guards");
  tag(s, "Who");
  const b = table(s, "Go", 1.45, [0.6, 6.55, 5.0], ["#", "Criterion", "How it's checked"], [
    ["1", "The test stage's evidence passes", "-Check -Stage test, every row Pass"],
    ["2", "Each provider's collection matched the provider's own command", "Recorded in the change record"],
    ["3", "The smoke test passed", "ST-01 to ST-04"],
    ["4", "Routing reviewed; every security advisory and retirement routed to a task", "Read by the change manager and the ISSO"],
    ["5", "The alert policy applied, and its rollback rehearsed", "Applied in both results.json"],
    ["6", "Each provider's notice contacts are named", "PF-05"],
    ["7", "The known gaps are recorded with the ISSO", "Google's planned maintenance; AWS without a support plan; and others"],
  ], { fontSize: 11.5, limit: 5.3 });
  line(s, "Who", "The ISSO and the change advisory board record the decision with the test stage's evidence folder.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 8, Unit 2; workbook Chapter 08 (Promotion go/no-go criteria); Chapter 07 (Dangers).");
  notes(s,
`The runbook promotes to production only when seven criteria pass, and the ISSO and the change advisory board record the decision with the test stage's evidence folder. One: the test stage's evidence passes the stage check, every row. Two: every enabled provider's collection matched the provider's own command, recorded in the change record. Three: the smoke test passed. Four: the routing was reviewed, and every security advisory and retirement routed to a task. Five: the alert policy applied, and its rollback was rehearsed. Six: each provider's notice contacts are named. And seven: the known gaps are recorded with the ISSO, such as Google Cloud's planned maintenance and any AWS account without a support plan. The evidence check answers the first criterion directly. The chapter's dangers explain the rest of the design. A weekly run that stops silently shows as a gap in dates and a missing run record. A file edited later fails its hash. A removed record breaks the chain. And a pass read as a control decision is guarded by each record's claim: it supports the controls, and the assessor decides.`,
  `${M} — Unit 2: workbook Chapter 08 — "Promotion go/no-go criteria"; Chapter 07 — "Dangers."`);
}
endModule(SC);

// ================================================================== 8 Try it: digest
{
  const s = content(SL, "Try it: write and read the second week's digest");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1: Module 7's two collections and routings (day1, then day2), in examples/provider-notices",
    "Payloads: 12 create, 0 update, 0 close            ... then ...            Payloads: 1 create, 4 update, 1 close",
    "# Step 2: write the digest for the second week",
    "$ ./Invoke-PnDigest.ps1 -NoticesPath out/day2/notices.json -StatePath out/state.json -OutputPath out/digest \\",
    "    -AsOf 2026-11-16T12:00:00Z",
    "Digest: 16 open, 8 need action, 5 starting in the next 30 days, 2 new, 4 closed or no longer listed",
    "# Step 3: Get-Content out/digest/digest.md, \"Action required\" (trimmed)",
    "| 2026-12-01 | AWS                         | retirement | EC2: Instance retirement scheduled  | Cloud Platform Engineering (example) |",
    "| 2026-12-15 | Oracle Cloud Infrastructure | change     | Action required: replace the cert... | Cloud Operations (example)           |",
    "| ...                                                                                                                      |",
    "| 2027-09-30 | Azure                       | retirement | Retirement: Basic SKU public IP ... | Cloud Platform Engineering (example) |",
    "| not stated | Azure                       | security   | Security advisory: action recomm... | Security Operations (example)        |",
    "| not stated | Microsoft 365               | change     | (Updated) Update SharePoint Fram... | Cloud Operations (example)           |",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (WRAPPED AND TRIMMED)", pt: 10 });
  line(s, "Google", "The Google Cloud row of the first table is all zeros: both its incidents closed.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 1 to 3; examples/provider-notices: Invoke-PnDigest.ps1, tests/fixtures/day1 and day2 (fictional).");
  notes(s,
`Try it. Lab 1 runs in the provider notices folder of the examples, in PowerShell 7, on the kit's fictional fixtures. Step one repeats Module 7's two collections and routings in one go: twenty-two notices and twelve creates in the first week, then twenty-three notices and one create, four updates and one close in the second. Step two writes the digest for the second week, as of November sixteenth, 2026: sixteen open, eight that need action, five starting in the next thirty days, two new, and four closed or no longer listed. Step three reads it as the owners will. In action required, soonest first, the EC2 instance retirement on December first, the Oracle Cloud Infrastructure certificate bundle change on December fifteenth, and so on to the Azure retirement on September thirtieth, 2027, each with the group it was routed to. The two with no date sit at the bottom as not stated. And the Google Cloud row of the first table is all zeros, because both its incidents closed.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 3.`);
}

// ================================================================== 9 Try it: record and check
{
  const s = content(SL, "Try it: record three runs, check the chain and stage");
  tag(s, "How");
  const c = code(s, "Rec", 0.6, 1.45, 12.15, [
    "# Step 4: record the collection, the routing run and the digest (-EvidencePath out/evidence)",
    "Record 1: Pass (COL-AZURE, COL-M365, COL-OCI, COL-AWS, COL-GOOGLE, NORMALIZE, EVIDENCE)",
    "Record 2: Pass (ROUTE, CONTINGENCY, EVIDENCE)",
    "Controls: AU-9, CA-7, CM-3, CM-4, CP-2, SI-5",
    "Record 3: Pass (DIGEST, EVIDENCE)",
    "# Step 6: check the test stage's coverage",
    "$ ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check -Stage test",
    "SUMS           Pass  25 files match SHA256SUMS",
    "CHAIN          Pass  3 records, chain unbroken",
    "STEP-PRE       Fail  no passing record",
    "STEP-RUN       Fail  no passing record",
    "STEP-ROUTE     Pass  a passing record covers it",
    "STEP-DIGEST    Pass  a passing record covers it",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED)", pt: 10.5 });
  line(s, "Exit", "The command exits 1. A lab has no pre-flight or scheduled run, so criterion 1 fails, which is right. Module 9 runs both.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 4 to 7; examples/provider-notices: Invoke-PnEvidence.ps1, config/requirements.json.");
  notes(s,
`Step four records three runs as evidence: the second week's collection, its routing run, and the digest. Each passes. The collection covers all five providers and the normalize step. The routing run covers route and contingency, and so it adds C P two and the recovery planning K S I, because a payload asked for a contingency plan review. The digest covers digest. Each record also names its controls and K S I's. Step five checks the chain: twenty-five files match the checksum file, and the three records' chain is unbroken. Step six checks the test stage's coverage. The checksums and chain pass, route and digest pass, but pre-flight and run fail: no passing record. The command exits one. That's right. A lab has no pre-flight or scheduled run, so the go/no-go's first criterion fails. Module 9 runs both. Step seven reads the records' index: three rows, collect, route and digest, each pass.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 4 to 7.`);
}

// ================================================================== 10 Try it: tamper
{
  const s = content(SL, "Try it: edit a recorded file, and the check names it");
  tag(s, "How");
  const c = code(s, "Edit", 0.6, 1.45, 12.15, [
    "# Step 8: change a recorded file and check again",
    "$ Add-Content -Path out/evidence/runs/0003-digest/digest.md -Value 'edited after it was recorded'",
    "$ ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check",
    "SUMS           Fail  runs/0003-digest/digest.md changed",
    "CHAIN          Fail  runs/0003-digest/digest.md doesn't match 0003-digest.json",
    "# Step 9: run the kit's whole test suite",
    "$ Invoke-Pester -Path tests -Output None -PassThru | Select-Object PassedCount, FailedCount",
    "PassedCount FailedCount",
    "        140           0",
    "# After the steps",
    "$ Remove-Item -Recurse -Force out",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026", pt: 11 });
  line(s, "Both", "Both checks fail, name the file, and exit 1: the evidence no longer shows what was read, and the check says so.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 8 and 9; workbook Chapter 07 (Dangers); examples/provider-notices/tests/DigestEvidence.Tests.ps1.");
  notes(s,
`Step eight is the one an assessor cares about. You add a line to the recorded digest, as if someone edited it after it was recorded, and check again. Both checks fail, and both name the file. The checksum row says the digest changed. The chain row says the digest no longer matches the third record. And the command exits one. That's the guard against the workbook's danger of a recorded file edited later: the evidence would no longer show what was read, and the check says so. The same design catches a record removed from the middle, because each record holds the hash of the one before it. Step nine runs the kit's whole test suite: one hundred forty pass, none fail. The tests cover the digest's sections and counts, the record's fields and claim language, the chain, a changed file, a removed record, a failed run, and a stage's missing steps. Then delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 8 and 9; workbook Chapter 07 — "Dangers," "The tests."`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: a test environment's runs, recorded");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "An earlier module's Lab 2 run folder from a test tenant, account, tenancy or project, never production, on agency storage; a new evidence folder and state file; the test change record's number"],
    ["Route and digest", "Route and digest the test collection with the lab's routing and the new state file"],
    ["Record and check", "Record all three runs with -ChangeRecord, then -Check the chain"],
    ["Ask the owners", "Give the digest to the test environment's owners: did each action-required row reach the right person?"],
    ["Back it out", "Keep the evidence with its change record; delete only the copies outside agency storage"],
  ], { fontSize: 12, limit: 5.2 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 07, Lab 2, which has the exact commands.");
  sources(s, "Sources: Module 8, \"Exercise: Lab 2, a test environment's runs\"; workbook Chapter 07 (Lab 2).");
  notes(s,
`Lab 2 does the same with a real test environment's runs. You need the run folder from an earlier module's Lab 2, in a test tenant, account, tenancy or project, never production, kept on agency storage. You also need a new evidence folder, a new routing state file, and the test change record's number. Route and digest the test collection with the lab's routing. Record all three runs with the change record, and check the chain. Then do the step no script can: give the digest to the test environment's owners, and ask whether each action-required row reached the right person. To back it out, keep the evidence of the test stage with its change record, and delete only the copies outside agency storage. The authors haven't run Lab 2. The workbook's Chapter 7 has the exact commands.`,
  `${M} — Unit "Exercise: Lab 2, a test environment's runs"; workbook Chapter 07 — "Lab 2."`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G7");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.6, 3.3, 5.25], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["SI-5 c; SA-9 c; RA-3 f", "KSI-SCR-MON, KSI-SCR-MIT", "digest.md, digest.csv, each week"],
    ["CA-7; AU-9", "KSI-MLA-EVC, KSI-MLA-OSM", "records/, records.csv: steps, controls, KSIs, every file's hash, the previous record's hash"],
    ["AU-9", "KSI-MLA-OSM", "SHA256SUMS and -Check: unchanged since recorded, and a change caught"],
    ["CA-7", "KSI-MLA-EVC", "-Check -Stage: each step has a passing record, or the gap is named"],
    ["SA-9; SR-8", "KSI-SCR-MON", "The pre-flight's results.json, PF-05: each provider's contacts named (Module 9)"],
  ], { fontSize: 11.5, limit: 5.0 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; each record carries that sentence as its claim. The mapping is design guidance.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 8, \"Introduction\"; workbook Chapter 07 (Federal requirements and evidence); NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Gate 7 supports NIST special publication eight hundred fifty-three S I five, part c; S A nine, part c; R A three, part f, updating the risk assessment when the environment changes; C A seven, continuous monitoring; and A U nine, protection of audit information. The pre-flight's named contacts support S R eight, notification agreements. The digest, each week, is the evidence for the first three. The records and their index, with every file's hash and the previous record's hash, support continuous monitoring and the protection of audit information. The checksum file and the check show the folder is unchanged since it was recorded, and catch a change. The stage check shows each step has a passing record, or names the gap. Your organization still sets the parameters, and the assessor decides. K S I's are FedRAMP twenty X indicators for cloud service providers. The agency lines its evidence up with them and doesn't report them, and each record carries that sentence as its claim.`,
  `${M} — Unit "Introduction" (the federal requirement); workbook Chapter 07 — "Federal requirements and evidence."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on evidence", [
    { q: "A lab's evidence passes -Check but fails -Check -Stage test. Why?", options: ["a. The chain is broken", "b. The test stage needs passing PRE and RUN records, from the pre-flight and the scheduled run, which a lab doesn't make", "c. -Stage checks production only"] },
    { q: "Every row of -Check -Stage production passes. What does that tell the agency?", options: ["a. The controls are in place", "b. Every step production needs has a passing, unbroken, matching record; the records support the controls, and the assessor decides", "c. The KSIs are reported"] },
  ], "1 b: Module 9 makes both records. 2 b: a pass is evidence, not a control decision.");
  sources(s, "Sources: Module 8, \"Knowledge check,\" questions 3 and 5, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: a lab's evidence passes the check, but fails the check for the test stage. Why? The answer is b. The test stage needs passing pre-flight and run records, from the pre-flight and the scheduled run, and a lab doesn't make them. Module 9 does. Second: every row of the production stage check passes. What does that tell the agency? The answer is b. Every step the production stage needs has a passing record, in an unbroken chain, with matching checksums. The records support the controls, and the assessor decides them. A pass isn't a control decision, and it doesn't mean FedRAMP approved anything or that the agency reports K S I's. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 3 and 5; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary, and next: Module 9, the deployment runbook");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Wrote a week's digest, in five sections",
    "Recorded three runs as chained evidence, and checked the chain",
    "Saw a lab stage fail the go/no-go for the two steps it never ran",
    "Caught a file edited after it was recorded",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT (OPTIONAL)", "Module 9: Deploying to test and production", [
    "The pre-flight and the weekly run",
    "The stage check passes",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "each week's digest.md and digest.csv; records/, runs/, records.csv and SHA256SUMS; at promotion, the -Check -Stage output with the go/no-go record.");
  sources(s, "Sources: Module 8, \"Summary\"; Module 9; learning path index.");
  notes(s,
`To sum up. You wrote a week's digest, recorded three runs as chained evidence, checked the chain, saw a lab stage fail the go/no-go for the two steps it never ran, and caught a file edited after it was recorded. The evidence an ISSO keeps for Gate 7 is each week's digest, as a page and a spreadsheet file; the evidence folder's records, runs, index and checksum file; and, at promotion, the stage check's output with the go/no-go record. Before shipping, work through the chapter's checklist. Next, and optional, is Module 9: deploying to test and production. It's for whoever deploys the kit. It records a pre-flight and a weekly run, so the stage check that failed here passes, and then takes the same commands to production. Or go back to the learning path.`,
  `${M} — Unit "Summary"; Module 9; learning path index.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 8 deck", [
  "Module page: docs/training/provider-notices/08-digest-evidence-and-go-no-go.md (Provider Notices learning path, Module 8): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index.",
  "What the module sends the learner to: workbook Chapter 07, \"What it leaves to you,\" \"The digest,\" \"The evidence record,\" \"Lab 2,\" \"Federal requirements and evidence,\" \"Dangers\"; Chapter 08, \"Promotion go/no-go criteria\"; Provider Notices: An Implementation Guide, Step 7 and \"Evidence\"; Book 15, Chapter 14, \"The weekly digest.\" Their footnotes: NIST SP 800-53 Rev. 5 (OSCAL release 5.2.0) and FedRAMP's Key Security Indicators.",
  "Kit: examples/provider-notices (Invoke-PnCollect.ps1, Invoke-PnRoute.ps1, Invoke-PnDigest.ps1, Invoke-PnEvidence.ps1; config/routing.json and requirements.json; tests/fixtures/settings.lab.json, day1, day2; tests). Fictional estate. Illustrative: tested against fixtures, not run against a live tenant.",
  "Lab output: run November 12, 2026 with PowerShell 7.6 and Pester 5.9 in a scratch copy of examples/provider-notices; the same output the module page shows. Long commands are wrapped and output trimmed where the slides say so. Verification: docs/training/provider-notices/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
