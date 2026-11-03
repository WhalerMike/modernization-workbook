// Attribute-Driven Migration learning path, Module 8: Run the drift pipeline and hand over the evidence — the module's
// narrated deck. Teaches docs/training/attribute-driven-migration/08-drift-and-evidence.md, Learn-style: objectives, the
// concepts, "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of
// examples/drift-pipeline), Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact
// comes from the module page, the learning path's verification log, Book 19 Chapter 09, or the kit (examples/drift-pipeline);
// the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-adm-module-8/build.js \
//                      presentations/training-adm-module-8/Training_ADM_Module_8.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 8: Run the drift pipeline and hand over the evidence",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration learning path, Module 8: Drift and evidence",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Attribute-Driven Migration learning path — Module 8: Run the drift pipeline and hand over the evidence";
const OUT = process.argv[2] || "Training_ADM_Module_8.pptx";
const M = "Training, Attribute-Driven Migration, Module 8";

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
  const s = title(SI, "Module 8: The drift pipeline and the evidence", "Attribute-Driven Migration learning path · Guide Gate 9, with Book 19 Chapter 09",
    ["Where the pipeline sits  ·  What Learn's samples leave to you  ·  Compare", "Findings without names  ·  The evidence package  ·  Try it: Lab 1  ·  Lab 2"]);
  notes(s,
`Welcome to Module 8 of the Attribute-Driven Migration learning path: run the drift pipeline and hand over the evidence. This module serves Gate 9, keep the attributes true, and takes Chapter 09 of Building the Attribute-Driven Migration, drift pipelines and evidence to the ISSO. You'll see where the pipeline sits, what Learn's sample workflows leave to you, how one run is compared with the last without treating a failed read as a fix, how findings go to the tracker without names, and how the evidence package forms a chain. Then you'll run it on your laptop against two days of fictional validation kit runs. If you're an ISSO reviewer, this module is yours in full. The code is illustrative: tested against fixtures, and the sample workflow has never run against Azure.`,
  `${M} — Unit 1 "Introduction"; learning path index ("If you're an ISSO reviewer").`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why Gate 9: without it, everything slowly decays");
  tag(s, "Why");
  const b = table(s, "Gate9", 1.45, [3.0, 9.15], ["Gate 9", "What it asks for"], [
    ["Validate", "Runs the HR, dynamic group and sync checks on the drift cadence"],
    ["Evidence", "Each cycle's run folder, the findings queue and the metrics for continuous monitoring"],
    ["Each kit check", "Compares the tenant with the program's record"],
    ["The pipeline", "Adds the second comparison: this run against the last"],
  ], { fontSize: 13.5, limit: 4.4 });
  callout(s, "Point", b + 0.35, 0.95, "FaFileShield", HEX.red, "This module: ",
    "read what changed between two days of runs, and hand over a package the ISSO can check with sha256sum and nothing else.");
  sources(s, "Sources: Module 8, Unit 1 \"Introduction\"; Book 19, Ch 09 \"Where the pipeline sits.\"");
  notes(s,
`Why does this module matter? Without Gate 9, everything slowly decays. Gate 9's Validate step runs the HR, dynamic group and sync checks on the drift cadence, and its evidence is each cycle's run folder, the findings queue and the metrics for continuous monitoring. Each validation kit check already compares the tenant with the program's record. The pipeline adds the second comparison: this run against the last. That finds change. In this module you run it on two days of fixture runs, read what changed, and hand over a package the ISSO can check with sha two fifty-six sum, and nothing else.`,
  `${M} — Unit 1 "Introduction"; Book 19, Chapter 09 — "Where the pipeline sits."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 8", [
    "Explain what the pipeline adds to the validation kit's own comparison",
    "Describe what Learn's sample workflows leave to you",
    "Compare two runs: new, resolved, changed, detail only, unchanged, unverified",
    "Explain why a failed read is unverified, not resolved",
    "Package and verify a run, and explain how the packages form a chain",
  ], [
    "Module 2: the pipeline reads the kit's runs and manifests",
    "Modules 1, 3 and 5 produce the provenance it packages",
    "Lab 1: Python 3.10+ with PyYAML and pytest; a shell with sha256sum",
  ], 55);
  sources(s, "Sources: Module 8, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll explain what the pipeline adds to the validation kit's own comparison. You'll describe what Learn's sample workflows leave to you. You'll compare two runs and read new, resolved, changed, detail only, unchanged and unverified. You'll explain why a failed read is unverified, not resolved. And you'll package and verify a run, and explain how the packages form a chain. Before you start, do Module 2: the pipeline reads the validation kit's runs and their manifests. Modules 1, 3 and 5 produce the provenance it packages. Lab 1 needs Python 3.10 or later with PyYAML and pytest, and a shell with sha two fifty-six sum, such as Git Bash.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Where it sits
{
  const s = content(SC, "Where the pipeline sits: change, not drift");
  tag(s, "What");
  const l = panel(s, "Rules", 0.6, 1.45, 6.6, null, HEX.navy, HEX.navyTint, "THE RULES IT BUILDS ON", "This workbook's own governance design", [
    "Drift is measured against a versioned record, not a snapshot",
    "No closure counts unless it carries its proof",
    "A finding closes only when a later observation shows the fixed state",
  ], 13);
  const r = panel(s, "Adds", 7.45, 1.45, 5.3, null, HEX.teal, HEX.tealTint, "WHAT THE PIPELINE ADDS", "This run against the last", [
    "That finds change",
    "Whether a change is drift is still the check's answer",
    "Yesterday's finding still here today: not new, still open",
  ], 13);
  callout(s, "Error", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "The closing rule, in code: ",
    "a check that ended in Error proves nothing, so its findings stay open as unverified.");
  sources(s, "Sources: Module 8, Unit 2 \"Where the pipeline sits\"; Book 19, Ch 09 \"Where the pipeline sits\" (the workbook's own design; no external standard).");
  notes(s,
`This workbook's own governance design already says what this pipeline must produce. These are the workbook's rules, not an external standard. Drift is measured against a versioned record, not a snapshot. No closure counts unless it carries its proof. And a finding closes only when a later observation shows the fixed state. The pipeline is a small part of that design. Each validation kit check compares the tenant with the program's record. The pipeline compares this run with the last, and that finds change. Whether a change is drift from the record is still the check's answer. A finding that was there yesterday and is still there today isn't new, but it is still open. And the comparison enforces the closing rule in code: a check that ended in Error proves nothing, so its findings stay open as unverified.`,
  `${M} — Unit 2 "Where the pipeline sits"; Book 19, Chapter 09 — "Where the pipeline sits."`);
}

// ================================================================== 5 Learn's samples
{
  const s = content(SC, "What Learn's sample workflows leave to you");
  tag(s, "What");
  const b = table(s, "Gaps", 1.45, [5.4, 6.75], ["Learn's samples, checked as published", "What examples/drift-pipeline adds"], [
    ["Sign in with OIDC; id-token: write only; IDs in secrets", "Kept as the model: the same sign-in and the same single grant"],
    ["Run on push; no schedule (WF-02)", "A daily schedule, and workflow_dispatch"],
    ["Actions pinned by tag; v2, older than v3.1.0 (WF-05, WF-08)", "Every action pinned to a commit, Azure Login to v3.1.0's"],
    ["azcliversion and azPSVersion: latest (WF-09)", "Exact versions from repository variables"],
    ["The US Government sample doesn't parse as YAML (WF-01)", "The linter catches it; a cloud table gives each cloud's values"],
    ["The job names no environment (WF-10)", "The job runs in drift-gcc; the credential's subject is that environment"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "Verdict", b + 0.25, 0.95, "FaListCheck", HEX.navy, "The verdict: ",
    "use Learn's sign-in exactly. Pin it, schedule it, and put the rest of the pipeline behind it.");
  sources(s, "Sources: Learn, \"Use the Azure Login action with OpenID Connect\"; Azure/login v3.1.0 action.yml; GitHub Docs, \"Secure use reference\"; Module 8, Unit 2; Book 19, Ch 09.");
  notes(s,
`Microsoft Learn's page, Use the Azure Login action with OpenID Connect, has three sample workflows. They do the important part well: they sign in with OpenID Connect and no secret, ask for id-token write and nothing else, and keep the IDs in secrets. Keep that as the model. Here's what they leave to you, checked offline by the kit's workflow linter. They run on push and have no schedule, and drift isn't found because someone pushed a commit. They pin actions by tag, and version two is older than the current release of Microsoft's Azure Login action, v3.1.0. GitHub Docs' secure use reference advises pinning an action to a full commit SHA, because a tag can be moved. They ask for the latest Azure CLI and PowerShell, so the tool that produced the evidence changes without a review. The US Government sample doesn't parse as YAML. And the job names no environment, so the token's subject depends on the branch. The verdict: use Learn's sign-in exactly, pin it, schedule it, and put the rest behind it.`,
  `${M} — Unit 2; Book 19, Chapter 09 — "Start with Learn's sample," "What it leaves to you."`);
}

// ================================================================== 6 Compare
{
  const s = content(SC, "Compare: this run against the last");
  tag(s, "What");
  const b = table(s, "Results", 1.45, [2.0, 6.15, 4.0], ["Result", "Meaning", "In the tracker"], [
    ["new", "A row the previous run didn't have", "Opens an issue"],
    ["changed", "Same check and object, different severity or issue", "Opens an issue; the old one closes"],
    ["detail only", "Same finding, different Detail", "Nothing; recorded in the report"],
    ["resolved", "Gone from a check that read the tenant this run", "Closes the issue, citing the run"],
    ["unverified", "The check ended in Error or NotApplicable, or didn't run", "One issue per check; findings stay open"],
  ], { fontSize: 12.5, limit: 4.4 });
  panel(s, "Refuse", 0.6, b + 0.25, 12.15, null, HEX.red, HEX.redTint, "THE COMPARISON REFUSES", null, [
    "A run edited after the kit wrote it: every file is checked against the kit's own manifest",
    "Runs from different modes, clouds or tenants, a run with no tenant ID, and a \"current\" run that isn't later",
  ], 13);
  sources(s, "Sources: Module 8, Unit 3; Book 19, Ch 09 \"Compare\" (the kit's design); examples/drift-pipeline/python/drift_pipeline.py.");
  notes(s,
`Here's the comparison, and every rule on this slide is the kit's own design. It reads each kit run and checks it against the kit's own manifest: every listed file with the same hash, nothing missing, nothing added, and read only. A run edited after the kit wrote it is refused. It also refuses runs from different modes, clouds or tenants, a run whose manifest has no tenant ID, and a current run that isn't later than the previous one. Then it keys each Finding and Warn row by check, object ID and issue, and sorts it. New is a row the last run didn't have. Changed is the same check and object with a different severity or issue. Detail only is the same finding with different detail, and opens nothing. Resolved is gone from a check that read the tenant this run. And unverified is a check that ended in Error or didn't run: its findings stay open. Each finding has a fingerprint, so the tracker never opens a duplicate.`,
  `${M} — Unit 3 "Compare, findings and the package"; Book 19, Chapter 09 — "Compare."`);
}

// ================================================================== 7 Findings and package
{
  const s = content(SC, "Findings without names, and a chained package");
  tag(s, "What");
  const l = panel(s, "Issues", 0.6, 1.45, 5.6, null, HEX.navy, HEX.navyTint, "A DRAFTED ISSUE HOLDS", "Check, severity, object ID, issue, fingerprint", [
    "No name: for most checks that's a user principal name",
    "The evidence store holds the names; the tracker is read by more people",
    "A first run is a baseline: one summary issue",
  ], 13);
  const r = panel(s, "Pkg", 6.45, 1.45, 6.3, null, HEX.teal, HEX.tealTint, "THE EVIDENCE PACKAGE HOLDS", null, [
    "kit-run/: the validation kit run as written",
    "drift/: the drift report and summary",
    "provenance/: the other kits' latest provenance",
    "EVIDENCE-MANIFEST.json, with the previous package's hash",
    "SHA256SUMS: every file, in the format sha256sum -c reads",
  ], 13);
  callout(s, "Chain", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.navy, "A chain: ",
    "each manifest records the previous package's manifest hash, so a replaced package or a missing day shows as a break.");
  sources(s, "Sources: Module 8, Unit 3; Book 19, Ch 09 (this workbook's guidance); Learn, \"Store business-critical blob data with immutable storage in a WORM state.\"");
  notes(s,
`Findings go to the issue tracker without names; that's this workbook's guidance. A drafted issue holds the check, the severity, the object ID, the issue and the fingerprint. It leaves out the object's name, which for most checks is a user principal name. The evidence store is access-controlled and holds the names; the tracker is read by more people and doesn't need them. A first run is a baseline, so it opens one summary issue, not hundreds. Then the package. It holds the kit run as written, the drift report and summary, the latest provenance from the other kits, an evidence manifest, and a SHA256SUMS file that sha two fifty-six sum reads. Each manifest records the previous package's manifest hash, so the packages form a chain, and a replaced package or a missing day shows as a break. The packager doesn't sign. Microsoft Learn's page on immutable storage says a locked time-based retention policy lets blobs be created and read, but not modified or deleted, until the retention interval ends.`,
  `${M} — Unit 3; Book 19, Chapter 09 — "Findings without names," "The evidence package."`);
}
endModule(SC);

// ================================================================== 8 Try it: lint and clouds
{
  const s = content(SL, "Try it: lint the workflows, print a cloud's hosts");
  tag(s, "How");
  const c = code(s, "Lint", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 to 3, in examples/drift-pipeline",
    "$ python python/workflow_lint.py --learn-samples",
    "Learn sample 1: 5 finding(s), 4 warning(s)",
    "  Finding WF-02  on: No schedule trigger (triggers: push): drift checks must run without a person ...",
    "Learn sample 2: 7 finding(s), 4 warning(s) ...",
    "Learn sample 3: 1 finding(s), 0 warning(s)",
    "  Finding WF-01  file: Not valid YAML (mapping values are not allowed here); ...",
    "$ python python/workflow_lint.py workflow/drift-pipeline.yml",
    "workflow/drift-pipeline.yml: 0 finding(s), 0 warning(s)",
    "$ python python/drift_pipeline.py cloud --name dod",
    "  \"authority\": \"https://login.microsoftonline.us\", \"graph\": \"https://dod-graph.microsoft.us\",",
    "  \"azure_environment\": \"AzureUSGovernment\", ...",
    "$ python python/drift_pipeline.py cloud --name usgov",
    "error: unknown cloud 'usgov'; expected one of gcc, gcchigh, dod",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Exit", "The sample lint exits 2; the unknown cloud exits 1. An unknown name is refused, never mapped to worldwide.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 1 to 3; Learn, \"Microsoft Graph national cloud deployments\"; examples/drift-pipeline: workflow_lint.py, drift_pipeline.py.");
  notes(s,
`Try it. Lab 1 runs in the drift-pipeline folder of the examples, in a POSIX shell, and nothing signs in. Step one checks Learn's three sample workflows offline. Sample one has five findings and four warnings, sample two has seven findings and four warnings, and sample three has just one: it isn't valid YAML. The command exits two. Step two checks the pipeline's own workflow: zero findings, zero warnings. Step three prints a cloud's hosts. For DoD, the sign-in authority is login dot microsoftonline dot u s, the Graph host is dod-graph dot microsoft dot u s, and the Azure environment is Azure U S Government. Microsoft Learn's page, Microsoft Graph national cloud deployments, lists those GCC High and DoD Graph hosts. That's the trap: the Azure environment covers both GCC High and DoD, so the Graph host has to come from the profile. Then ask for a name it doesn't know, u s gov. It's refused, with exit code one, never mapped to worldwide.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 1 to 3; Book 19, Chapter 09 — "Clouds."`);
}

// ================================================================== 9 Try it: baseline and day 2
{
  const s = content(SL, "Try it: a baseline, then the next day");
  tag(s, "How");
  const c = code(s, "Day2", 0.6, 1.45, 12.15, [
    "# Step 4: record a baseline and package it ($PREV is the October 28 fixture run)",
    "$ python python/drift_pipeline.py compare --current $PREV --out out/day1",
    "{\"baseline\": true, \"counts\": {\"changed\": 0, \"detail_only\": 0, \"new\": 10, \"resolved\": 0, \"unchanged\": 0, ...}",
    "$ python python/drift_pipeline.py package --kit-run $PREV --diff out/day1/drift-report.json $P --out out/evidence",
    "{\"evidence_manifest_sha256\": \"6d9fffbc86009c18673ea37a3a5ed3805541331a8e921955380c1b1143374cd1\", ...}",
    "# Step 5: compare the next day ($CURR is October 29)",
    "$ python python/drift_pipeline.py compare --previous $PREV --current $CURR --out out/day2",
    "$ cat out/day2/drift-summary.md",
    "New 3, resolved 1, changed 1, detail only 1, unchanged 6, unverified checks 2.",
    "| VK-CA-01 | Pass | Fail |",
    "| VK-NPI-03 | Fail | Error |",
    "| VK-PIV-01 | Pass | not run |",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "VK-NPI-03's finding is unverified, not resolved: its read failed. Both compares exit 2.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 4 and 5; examples/drift-pipeline/tests/fixtures/runs (fictional).");
  notes(s,
`Step four records a baseline. The fixtures are two fictional validation kit runs, one day apart: October twenty-eighth and twenty-ninth. Compare the first with nothing, and it's a baseline: ten new findings, and the command exits two. Package it with the other kits' provenance, and the evidence manifest's hash starts six d nine f f f. Step five compares the next day. The summary reads: new three, resolved one, changed one, detail only one, unchanged six, unverified checks two. Its table shows which checks moved. VK-CA-01 went from Pass to Fail. VK-PIV-01 didn't run. And VK-NPI-03 went from Fail to Error. Look closely at that one. Yesterday it had a finding. Today its read failed. So the finding is unverified, not resolved. A failed read is never a fix.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 4 and 5.`);
}

// ================================================================== 10 Try it: findings and chain
{
  const s = content(SL, "Try it: draft findings, then package the chain");
  tag(s, "How");
  const c = code(s, "Chain", 0.6, 1.45, 12.15, [
    "# Step 6: draft the findings, then search them for a name and an object ID",
    "$ python python/drift_pipeline.py issues --diff out/day2/drift-report.json --out out/day2/issues.json",
    "{\"close\": 2, \"comment\": 0, \"open\": 6}",
    "$ grep -c \"gina@contoso.example\" out/day2/issues.json",
    "0",
    "$ grep -c \"00000000-0000-4000-8000-000000000011\" out/day2/issues.json",
    "1",
    "# Step 7: package day 2 with --previous-manifest (day 1's), then verify",
    "$ python python/drift_pipeline.py verify out/evidence/2026-10-29-0617-fixture-runner-fixture",
    "{\"evidence_manifest_sha256\": \"0932f0a3cd710c19bdfce05ff4f7595bf2d8d5e3b652921223d12fa49aada6ee\", \"files\": 16, ...}",
    "$ (cd out/evidence/2026-10-29-0617-fixture-runner-fixture && sha256sum -c --quiet SHA256SUMS)",
    "$ python -c \"... print(m['previous']['evidence_manifest_sha256']); print(m['tenant_id'])\"",
    "6d9fffbc86009c18673ea37a3a5ed3805541331a8e921955380c1b1143374cd1",
    "11111111-1111-4111-8111-111111111111",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Chain", "sha256sum prints nothing and exits 0. Day 2's manifest records day 1's hash: the chain.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 6 and 7; examples/drift-pipeline/python/drift_pipeline.py.");
  notes(s,
`Step six drafts the findings: six to open, two to close, no comments. Then search the drafts. For a user's address, grep counts zero; the name isn't there, and grep exits one. For the object ID, it counts one. The tracker gets the object ID and the fingerprint, never the name. Step seven packages the second day, chained to the first with the previous manifest option, and verifies it. The manifest hash starts oh nine three two, and verify reports sixteen files. Then the ISSO's own check, with no program code at all: sha two fifty-six sum, in the package's folder, prints nothing and exits zero. Last, read two fields of day two's manifest: the previous package's manifest hash, which is day one's, six d nine f f f, and the fixture tenant's placeholder ID. That's the chain.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 6 and 7.`);
}

// ================================================================== 11 Try it: break it
{
  const s = content(SL, "Try it: break the package, swap the runs");
  tag(s, "How");
  const c = code(s, "Break", 0.6, 1.45, 12.15, [
    "# Step 8: append a line to the packaged summary, and verify again",
    "$ echo \"edited after packaging\" >> \\",
    "    out/evidence/2026-10-29-0617-fixture-runner-fixture/drift/drift-summary.md",
    "$ python python/drift_pipeline.py verify out/evidence/2026-10-29-0617-fixture-runner-fixture",
    "error: out/evidence/2026-10-29-0617-fixture-runner-fixture: drift/drift-summary.md doesn't match its SHA-256",
    "(exit code 1)",
    "# then swap the runs",
    "$ python python/drift_pipeline.py compare --previous $CURR --current $PREV --out out/swapped",
    "error: the current run (2026-10-28T06:17:00Z) isn't later than the previous one (2026-10-29T06:17:00Z)",
    "(exit code 1)",
    "# Step 9: the tests (the page says about two minutes)",
    "$ python -m pytest tests -q",
    "142 passed",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 10.5 });
  line(s, "Clean", "Step 10 cleans up: rm -rf out", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 8 to 10; examples/drift-pipeline/tests.");
  notes(s,
`Step eight breaks it on purpose. Append one line to the packaged drift summary, and verify again. It fails, with exit code one: the summary doesn't match its hash. An edit after packaging can't hide. Then swap the runs, and compare the twenty-ninth as previous with the twenty-eighth as current. That's refused too: the current run isn't later than the previous one. Runs out of order can't make a finding look resolved. Step nine runs the tests: one hundred forty-two pass. They take about two minutes. Step ten cleans up. Check your work: given two runs, you can say what's new, resolved, changed or unverified, and given a package, you can show it's unedited and chained to the day before.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 8 to 10; "Check your work."`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: a scheduled run in your test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A test tenant and test subscription, never production; a private test repository"],
    ["Sign-in", "Register an app that trusts the repository through a federated credential; grant only the reads"],
    ["Storage", "An evidence container with an unlocked retention policy; set up the repository's environment"],
    ["Run", "Run the workflow by hand for a baseline, make one real change, run again, then let the schedule run"],
    ["Back it out", "Step 8 deletes the federated credential and the app; leave the test retention policy unlocked"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow Book 19, Chapter 09, Lab 2, step by step.");
  sources(s, "Sources: Module 8, Unit 5 \"Exercise: Lab 2\"; Book 19, Ch 09 Lab 2; Learn, \"Store business-critical blob data with immutable storage in a WORM state.\"");
  notes(s,
`Lab 2 runs the pipeline for real, in a test tenant and a test subscription, never production, from a private test repository that holds the validation kit and this example. Register an app that trusts the repository through a federated credential, so no secret is stored, and grant it only the reads. Make an evidence container with an unlocked retention policy, and set up the repository's environment. Run the workflow by hand for a baseline, make one real change, and run it again. Then let the schedule run. To back it out, step eight deletes the federated credential and the app. Leave the test retention policy unlocked: Microsoft Learn's page on immutable storage says an unlocked policy is only for short-term testing, and it can be deleted. The authors haven't run Lab 2. Follow Chapter 09's Lab 2, step by step.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test tenant)"; Book 19, Chapter 09 — "Lab 2: test tenant and test subscription."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 8");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.6, 2.9, 4.65], ["Requirement", "KSI", "Evidence the ISSO keeps"], [
    ["CA-7; CM-2: the first run is a packaged baseline", "KSI-MLA-EVC", "drift-report.json, EVIDENCE-MANIFEST.json"],
    ["CA-7; SI-4: a failed read never resolves", "KSI-MLA-EVC; KSI-MLA-RVL", "The evidence package"],
    ["CA-7; AU-6: findings by fingerprint, no names", "KSI-MLA-RVL", "The issue tracker"],
    ["AU-9; SI-7; CM-3: hashed, chained package", "KSI-SVC-VRI; KSI-CMT-LMC", "EVIDENCE-MANIFEST.json, SHA256SUMS"],
    ["SI-7; AU-9: edits and swaps refused", "KSI-SVC-VRI", "The test results"],
    ["SA-10; AC-6: pinned; reader can't write issues", "KSI-SCR-MIT; KSI-IAM-ELP", "The workflow file in Git"],
    ["IA-5: federated credential, no secret (Lab 2)", "KSI-IAM-SNU", "App registration; Entra audit log"],
  ], { fontSize: 11.5, limit: 5.9 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them (design guidance).", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (SP 800-53B Moderate baseline); FedRAMP, \"Key Security Indicators\"; Module 8, Unit 1 (Chapter 09's table); Unit 7.");
  notes(s,
`The federal requirement. The controls are from NIST SP 800-53, at NIST's Moderate baseline. This chapter turns the other chapters' outputs into continuous monitoring, control C A seven. The first run is a packaged baseline, for baseline configuration. Each run says what is new, resolved, changed and unverified, and a failed read never resolves a finding, for system monitoring. Each finding is opened or closed by fingerprint, with object IDs and no names, for audit review. The package hashes every file, carries the other kits' provenance and chains to the day before, for the protection of audit information and integrity. An edit after packaging and runs out of order are refused, and the tests show it. Every action is pinned, and the job that reads the tenant can't write to the tracker. And in Lab 2, the pipeline signs in with a federated credential, with no secret stored. The KSI column is from FedRAMP's Key Security Indicators, which are indicators for cloud service providers. Which output supports which control is this workbook's reading.`,
  `${M} — Unit 1 "Introduction" (Chapter 09's requirements, KSIs and evidence); Unit 7 "Summary."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on drift", [
    { q: "Yesterday VK-NPI-03 had a finding. Today its read failed with a 403. What does the comparison report?", options: ["a. Resolved", "b. Unverified, not resolved: a failed read is never a fix", "c. Unchanged"] },
    { q: "How does the ISSO check a package without the program's code?", options: ["a. By reading the drift summary", "b. With sha256sum -c SHA256SUMS in the package's folder", "c. By re-running the validation kit"] },
  ], "1 b: see Compare, and step 5 of the lab. 2 b: see the evidence package, and step 7 of the lab.");
  sources(s, "Sources: Module 8, Unit 6 \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: yesterday VK-NPI-03 had a finding. Today its read failed with a four-oh-three. What does the comparison report? The answer is b: unverified, not resolved. A failed read is never a fix, and you saw it in step five of the lab. Second: how does the ISSO check a package without the program's code? The answer is b: with sha two fifty-six sum, dash c, SHA256SUMS, in the package's folder. You did exactly that in step seven, and it printed nothing and exited zero. The module page has two more questions, on what goes into a drafted issue and on what shows a missing day, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 9, test then production");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Compared two days of kit runs without letting a failed read close a finding",
    "Drafted findings without names",
    "Packaged and verified a chain the ISSO checks with sha256sum alone",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 9: Deploy to test, then production", [
    "One settings file per stage",
    "A pre-flight check and a smoke test",
    "A rollback written from the record",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Before shipping: ",
    "work through the Chapter 09 checklist in Book 19.");
  sources(s, "Sources: Module 8, Unit 7 \"Summary\"; Module 9, \"Unit 1: Introduction.\"");
  notes(s,
`To sum up. You compared two days of kit runs without letting a failed read close a finding, drafted findings without names, and packaged and verified a chain of evidence the ISSO can check with sha two fifty-six sum alone. The evidence an ISSO keeps: each day's package, with its kit run, drift report, the other kits' provenance, the manifest and SHA256SUMS, in a container whose retention is locked in production; the findings in the tracker by fingerprint; and the workflow file and the pipeline app's registration. Gate 9 adds the scan schedule, the limits register and the metrics. Before shipping, work through the Chapter 09 checklist. Next is Module 9, the last: deploy to test, then production, with one settings file per stage, a pre-flight check, a smoke test that says go or no-go, and a rollback written from a record of every change.`,
  `${M} — Unit 7 "Summary"; Module 9 — "Unit 1: Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 8 deck", [
  "Module page: docs/training/attribute-driven-migration/08-drift-and-evidence.md (Attribute-Driven Migration learning path, Module 8): Units 1 to 7, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design: Book 19, Chapter 09 \"Where the pipeline sits,\" \"What Learn gives you,\" \"What it leaves to you,\" \"Clouds,\" \"Compare,\" \"Findings without names,\" \"The evidence package,\" Lab 2, Checklist; the implementation guide's Gate 9.",
  "Kit: examples/drift-pipeline (python/drift_pipeline.py; python/workflow_lint.py; workflow/drift-pipeline.yml; tests; tests/fixtures/runs and provenance). Fictional records. Illustrative: tested against fixtures; the sample workflow has never run against Azure.",
  "Lab output: run November 3, 2026 with Python 3.14.3 and PyYAML 6.0.3 in a scratch copy of examples, outside the repository; it matches the module page and data/kit-captures/adm (09-1 to 09-12). Verification: docs/training/attribute-driven-migration/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
