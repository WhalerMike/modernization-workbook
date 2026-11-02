// HR-Driven Identity learning path, Module 7: Find lifecycle drift and file the evidence — the module's narrated deck.
// Teaches docs/training/hr-driven-identity/07-drift-and-evidence.md, Learn-style: objectives, the concepts, "Try it"
// slides with the real Lab 1 commands and output (run November 2, 2026 in a scratch copy of examples/hr-lifecycle and
// examples/drift-pipeline), Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every
// fact comes from the module page, the path's verification log, or the kit's code and fixtures (examples/hr-lifecycle:
// lifecycle_drift.py, config/drift.json, tests/fixtures/ch07; examples/drift-pipeline/python/hr_evidence.py); the deck
// adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-hr-module-7/build.js \
//                      presentations/training-hr-module-7/Training_HR_Module_7.pptx
const TITLE = "Module 7: Find lifecycle drift and file the evidence";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  HR-Driven Identity learning path, Module 7: Find lifecycle drift and file the evidence",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and the title slide's unit list for the Microsoft Automation path; this deck is on the HR path.
D.pres.title = `HR-Driven Identity learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "HR-DRIVEN IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_HR_Module_7.pptx";
const M = "Training, HR-Driven Identity, Module 7";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 7: Find lifecycle drift and file the evidence", "HR-Driven Identity learning path · Gate G7 Drift and evidence, for the ISSO",
    ["What the evidence has to show  ·  Drift classes  ·  Six metrics  ·  Package, chain, period", "Try it: Lab 1  ·  Lab 2  ·  Evidence  ·  The end of the path"]);
  notes(s,
`Welcome to Module 7, the last module of the HR-Driven Identity learning path: find lifecycle drift and file the evidence. This is Gate 7 of the implementation guide, and it goes with Chapter 07 of the developer workbook. The first six gates each produce a result. This gate keeps those results true over time, and hands the ISSO something they can check. In this module you'll write one read-only run of the lifecycle drift classes and the six lifecycle metrics, from the HR export, the directory, the card system and the earlier modules' outputs. Then you'll package each run with a hash chain, verify it, and assemble a reporting period. The module takes about an hour with its lab.`,
  `${M} — "Introduction"; module header.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why accounts drift, and why the record must last");
  tag(s, "Why");
  const b = table(s, "Drift", 1.45, [7.2, 4.95], ["How an account drifts from the HR record", "Drift class"], [
    ["A worker with no account", "LD-01 missing identity"],
    ["A terminated worker still enabled", "LD-02 stale access"],
    ["An account nobody owns", "LD-03 orphan account"],
    ["A write by the wrong identity", "LD-04 unauthorized write"],
    ["A card still active after a separation", "LD-05, LD-06 credential drift"],
  ], { fontSize: 14, limit: 4.9 });
  callout(s, "Last", b + 0.3, 1.0, "FaFileShield", HEX.red, "And the record has to last: ",
    "Entra keeps its own logs for only 30 days, while the evidence has to outlive the accounts it describes.");
  sources(s, "Sources: Module 7, \"Introduction\"; Unit 2 \"The drift classes\"; examples/hr-lifecycle/python/lifecycle_drift.py.");
  notes(s,
`Why does this gate exist? Because accounts drift from the HR record, even after every earlier gate is done right. A worker shows up in HR with no account. A terminated worker's account is still enabled. An account turns up that nobody owns. Someone other than the named writer changes a value. A card stays active after a separation. Each of those is a drift class, and the run in this module finds them all. There's a second problem: time. Entra keeps its own logs for only thirty days, and the evidence has to outlive the accounts it describes, which are eventually disposed of. So the findings and metrics have to leave the directory, in a form an ISSO can check later.`,
  `${M} — "Introduction"; Unit 2 — "The drift classes."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 7", [
    "Name the six lifecycle drift classes and the six metrics, and say which module's output feeds each",
    "Write a run from the earlier modules' outputs and read its findings",
    "Package runs with a hash chain, verify a package, and check it with sha256sum",
    "Assemble a period, and explain why it can be incomplete even when the chain is whole",
  ], [
    "Modules 1, 2, 3, 4 and 6: the run reads their outputs; Lab 1 rebuilds them",
    "Book 19, Chapter 09: the drift pipeline the packaging builds on",
    "Lab 1 also calls examples/drift-pipeline",
  ], 60);
  sources(s, "Sources: Module 7, \"Learning objectives,\" \"Prerequisites\"; \"Exercise: Lab 1.\"");
  notes(s,
`Here's what you'll be able to do by the end. You'll name the six lifecycle drift classes and the six metrics, and say which module's output feeds each. You'll write a run from the earlier modules' outputs and read its findings. You'll package runs with a hash chain, verify a package, and check it yourself with sha256sum. And you'll assemble a reporting period, and explain why it can be incomplete even when its chain is whole. This run reads the outputs of Modules 1, 2, 3, 4 and 6. You don't need to have kept them: the first step of the lab rebuilds them. The packaging builds on the drift pipeline in Book 19's Chapter 09, and the lab calls it from the same clone.`,
  `${M} — "Learning objectives," "Prerequisites"; "Exercise: Lab 1."`);
}
endModule(SI);

// ================================================================== 4 What the evidence has to show
{
  const s = content(SC, "What the evidence has to show: the guide's Step 7");
  tag(s, "What");
  const b = table(s, "Step7", 1.45, [4.3, 7.85], ["Step 7 says", "Where this module's code meets it"], [
    ["Run the drift classes", "lifecycle_drift.py run: LD-01 to LD-06"],
    ["Fix at the source", "The period counts findings opened and closed; each LD-04 closure at the source is kept"],
    ["Report the six metrics", "The run's metrics, with LD-07 out of bounds and LD-08 not measured"],
    ["Prove the sole source", "Not decided by this code: seven days of provisioning logs against the audit log (Book 03, Appendix C)"],
    ["Keep the evidence outside the directory", "hr_evidence.py package, verify and period"],
  ], { fontSize: 13, limit: 5.2 });
  callout(s, "NotHere", b + 0.3, 0.9, "FaTriangleExclamation", HEX.amber, "Not this module's: ",
    "attribute drift belongs to the ADM implementation guide's Gate 9.");
  sources(s, "Sources: Module 7, Unit 1 \"What the evidence has to show\"; Lab 1, step 6 (period-summary.md); \"Summary.\"");
  notes(s,
`Unit 1 reads the guide's Step 7, which asks for five things. Run the drift classes: that's the run command, with classes L D one to L D six. Fix at the source, not in the directory: the period counts findings opened and closed, and keeps each unauthorized-write finding's closure at the source. Report the six metrics: the run computes them and flags any out of bounds or not measured. Prove the sole source for each population: this code doesn't decide that; it's seven days of provisioning logs against the audit log, in Book 03's Appendix C. And keep the evidence outside the directory: that's the package, verify and period commands. Book 03's Chapter 11 has the design. Attribute drift isn't this module's; it belongs to Gate 9 of the attribute-driven migration guide.`,
  `${M} — Unit 1 "What the evidence has to show"; Book 03, Chapter 11; Lab 1, step 6; "Summary."`);
}

// ================================================================== 5 Drift classes
{
  const s = content(SC, "The drift classes: LD-01 to LD-08");
  tag(s, "What");
  const b = table(s, "LD", 1.45, [1.15, 3.2, 7.8], ["Rule", "Class", "Raised when"], [
    ["LD-01", "Missing identity", "An active worker record has no account"],
    ["LD-02", "Stale access", "Terminated in HR and enabled; or a contractor past the earliest end and enabled"],
    ["LD-03", "Orphan account", "An enabled account matches no worker or contractor record"],
    ["LD-04", "Unauthorized write", "Module 1's scan found a second writer or a forbidden write"],
    ["LD-05", "Credential drift", "An active PIV card for a separated worker"],
    ["LD-06", "Contractor credential drift", "An active card for a person whose engagement ended, or whom the contractor source doesn't hold"],
    ["LD-07", "Warn", "A metric is out of bounds"],
    ["LD-08", "Warn", "A metric isn't measured"],
  ], { fontSize: 12.5, limit: 6.0 });
  line(s, "Exc", "LD-01 to LD-06 are Findings. An enabled account on the exceptions list, with an owner, counts as resolved.", b + 0.15, 0.45, 13.5);
  sources(s, "Sources: Module 7, Unit 2 \"The drift classes\"; Knowledge check, answer 1; examples/hr-lifecycle: lifecycle_drift.py, config/drift.json.");
  notes(s,
`Unit 2 turns to the workbook chapter. Here are the classes. L D one, missing identity: an active worker record with no account. L D two, stale access: a worker terminated in HR whose account is still enabled, or a contractor past the earliest end and still enabled. L D three, orphan account: an enabled account that matches no worker or contractor record. L D four, unauthorized write: Module 1's audit scan found a second writer or a forbidden write. L D five, credential drift: an active PIV card for a separated worker. And L D six, the contractor version: an active card for someone whose engagement ended, or whom the contractor source doesn't hold at all. Those six are Findings. Two more rules are warnings about the metrics: L D seven, out of bounds, and L D eight, not measured.`,
  `${M} — Unit 2 "The run, the classes and the metrics": "The drift classes"; "Knowledge check," answer 1; lifecycle_drift.py.`);
}

// ================================================================== 6 Metrics
{
  const s = content(SC, "The six metrics, and where each value comes from");
  tag(s, "What");
  const b = table(s, "Metrics", 1.45, [4.0, 2.0, 6.15], ["Metric", "Starting threshold", "Where the value comes from"], [
    ["separationToBlockHoursP90", "at most 4", "Module 6's separation timing"],
    ["separationToRevocationHoursP90", "at most 24", "Module 6's separation timing"],
    ["transferToReviewHours", "at most 240", "Module 4's mover residual review"],
    ["joinerReadinessRate", "at least 0.95", "Module 3's day-one readiness"],
    ["correlationCoverage", "at least 0.99", "This run: enabled accounts that resolve to a current worker or contractor"],
    ["derivationPurity", "at least 0.8", "This run: access-granting memberships computed by rule"],
  ], { fontSize: 12.5, limit: 4.9 });
  callout(s, "Zero", b + 0.3, 1.05, "FaChartLine", HEX.navy, "Not measured, never zero: ",
    "a metric with no input is LD-08. The thresholds are the program's starting values; choosing them is the agency's CA-7 decision.");
  sources(s, "Sources: Module 7, Unit 2 \"The metrics\"; Knowledge check, answer 2; examples/hr-lifecycle/config/drift.json.");
  notes(s,
`The six metrics. Two come from Module 6: the ninetieth percentiles of separation-to-block, at most four hours, and separation-to-revocation, at most twenty-four. Transfer-to-review comes from Module 4's mover review, at most two hundred forty hours. The joiner readiness rate comes from Module 3, at least ninety-five percent. And two are computed by this run: correlation coverage, the share of enabled accounts that resolve to a current worker or contractor, at least ninety-nine percent; and derivation purity, the share of access-granting memberships computed by rule, at least eighty percent. Module 1's scan and Module 2's contractor decisions feed the drift classes instead. One rule matters most here: a metric with no input is not measured, never zero. And the thresholds are the program's starting values. Choosing them is the agency's decision under C A seven.`,
  `${M} — Unit 2 "The run, the classes and the metrics": "The metrics"; "Knowledge check," answer 2; config/drift.json.`);
}

// ================================================================== 7 The run folder
{
  const s = content(SC, "The run: one read-only folder per run");
  tag(s, "How");
  const l = panel(s, "Run", 0.6, 1.45, 6.3, null, HEX.navy, HEX.navyTint, "lifecycle_drift.py run", "What a run folder holds", [
    "run.json: the tenant, cloud and mode, and a SHA-256 of each module output it read",
    "lifecycle/findings.json, metrics.json and a manifest",
    "Each module output is checked against its own manifest before it's read",
  ], 13.5);
  const r = panel(s, "Once", 7.15, 1.45, 5.6, null, HEX.amber, HEX.amberTint, "WRITTEN ONCE", "Why Lab 1 starts with rm -rf out", [
    "The tools refuse a folder that already holds a manifest.json",
    "So step 1 deletes out, then rebuilds the outputs of Modules 1, 2, 3, 4 and 6",
  ], 13.5);
  callout(s, "Mode", Math.max(l, r) + 0.3, 0.9, "FaDatabase", HEX.navy, "Fixture or tenant: ",
    "Lab 1 writes runs in fixture mode; Lab 2 writes them in tenant mode, from the test tenant's exports.");
  sources(s, "Sources: Module 7, Lab 1, steps 1 and 2; Lab 2; path verification log, claim 7; examples/hr-lifecycle/python/lifecycle_drift.py.");
  notes(s,
`A run is one folder, and it only reads. Its run dot JSON records the tenant, the cloud and the mode, and a SHA-256 of each module output it read, so anyone can tell exactly which inputs produced it. Beside it, the lifecycle folder holds the findings, the metrics and a manifest. Before the run reads an earlier module's output, it checks that output against its own manifest, so a changed file is caught, not silently used. The tools also write each output folder once: they refuse a folder that already holds a manifest. That's why the lab's first step deletes the out folder and rebuilds the five module outputs. Lab 1 writes its runs in fixture mode. Lab 2 writes them in tenant mode, from your test tenant's exports.`,
  `${M} — "Exercise: Lab 1," steps 1 and 2; Lab 2; verification log, claim 7; lifecycle_drift.py.`);
}

// ================================================================== 8 Package, chain, period
{
  const s = content(SC, "The package, the chain and the period");
  tag(s, "How");
  const w = 3.92, gap = 0.2;
  const items = [
    ["1 PACKAGE", "Seal one run", ["A SHA-256 per file, the tenant ID, and the previous package's manifest hash", "Written once; a run of another tenant is refused"]],
    ["2 VERIFY", "Recheck a package", ["hr_evidence.py verify", "Or the ISSO's own check: sha256sum -c SHA256SUMS"]],
    ["3 PERIOD", "Assemble a window", ["A gap or a broken chain means not complete", "Scores Gate 7's criteria, and maps AC-2, AU-6, PS-4, PS-5, CA-7"]],
  ];
  let bottom = 0;
  items.forEach(([lab, head, pts], k) => {
    bottom = Math.max(bottom, panel(s, `P${k + 1}`, 0.6 + k * (w + gap), 1.45, w, 2.15, [HEX.navy, HEX.teal, HEX.amber][k],
      [HEX.navyTint, HEX.tealTint, HEX.amberTint][k], lab, head, pts, 13));
  });
  callout(s, "Map", bottom + 0.3, 1.0, "FaScaleBalanced", HEX.teal, "Design guidance: ",
    "the control mapping is the program's; the assessor decides each control. The summary carries object keys and fingerprints only.");
  sources(s, "Sources: Module 7, Unit 2 \"The package, the chain and the period\"; Lab 1, steps 5 and 6; examples/drift-pipeline/python/hr_evidence.py.");
  notes(s,
`The packaging is three commands in the drift pipeline. Package seals one run: a SHA-256 for every file, the tenant I D, and the hash of the previous package's manifest, which is what chains them. A package is written once, and a run from a different tenant is refused. Verify rechecks a package. But the ISSO doesn't need the kit to trust it: sha256sum, checking the SHA256SUMS file, is their own independent check. Period assembles the packages in a reporting window. If there's a gap in coverage or a broken link in the chain, the period isn't complete. It also scores Gate 7's criteria and maps the findings and metrics to five controls. That mapping is the program's design guidance; the assessor decides each control.`,
  `${M} — Unit 2 "The run, the classes and the metrics": "The package, the chain and the period"; Lab 1, steps 5 and 6; hr_evidence.py.`);
}
endModule(SC);

// ================================================================== 9 Try it: first run
{
  const s = content(SL, "Try it: rebuild the inputs and write the first run");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/hr-lifecycle",
    "$ rm -rf out",
    "$ python python/writer_register.py scan ... --out out/ch01            # Module 1; each of the five exits 2",
    "$ python python/contractor_source.py extract ... --out out/ch02/extract            # Module 2",
    "$ python python/joiner_workflows.py readiness ... --out out/ch03/readiness         # Module 3",
    "$ python python/access_assignment.py residual ... --out out/ch04/residual          # Module 4",
    "$ python python/separation_timing.py measure ... --out out/ch06                    # Module 6",
    "$ python python/lifecycle_drift.py run --hr tests/fixtures/ch07/hr-export.csv --contractors out/ch02/extract/decisions.json \\",
    "    --users tests/fixtures/ch07/workforce-users.json --exceptions tests/fixtures/ch07/exceptions.csv \\",
    "    --cards tests/fixtures/ch07/cards.csv --derivation tests/fixtures/ch07/derivation.json --writers out/ch01 \\",
    "    --readiness out/ch03/readiness --residual out/ch04/residual --timing out/ch06 --config config/drift.json \\",
    "    --since 2026-10-01 --until 2026-11-01 --cloud gcc --tenant-id 00000000-0000-4000-8000-00000000c0de \\",
    "    --mode fixture --out out/ch07/runs/2026-11-01T0600Z",
    "Run 2026-11-01T0600Z: 4 chapter outputs read (readiness, residual, timing, writers)",
    "  separationToBlockHoursP90            5.52  max 4  out of bounds",
    "  separationToRevocationHoursP90      110.0  max 24  out of bounds",
    "  transferToReviewHours                None  max 240  not measured",
    "  joinerReadinessRate                  0.25  min 0.95  out of bounds",
    "  correlationCoverage                0.5833  min 0.99  out of bounds",
    "  derivationPurity                   0.7637  min 0.8  out of bounds",
    "Lifecycle drift: 14 Finding, 6 Warn, 0 Info",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (STEP 1'S COMMANDS SHORTENED WITH ...; STEP 2 WRAPPED)", pt: 10 });
  line(s, "Read", "Five metrics out of bounds, one not measured. The last line, where to package the run, is left off.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 1 and 2; examples/hr-lifecycle: lifecycle_drift.py, config/drift.json, tests/fixtures/ch07.");
  notes(s,
`Try it. Step one deletes any out folder, then rebuilds five inputs, one command each: Module 1's writer scan, Module 2's contractor extract, Module 3's readiness, Module 4's mover residual and Module 6's separation timing. The full commands are on the module page; each one exits two, because each fixture holds findings. Step two writes the first run, for October. It reads four module outputs and prints the six metrics. Separation-to-block at five point five two hours, and revocation at a hundred ten, both out of bounds. Transfer-to-review isn't measured, because the mover's review is still open. Readiness is twenty-five percent, correlation coverage fifty-eight percent, and derivation purity seventy-six percent: all out of bounds. Fourteen Findings, six Warns.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2.`);
}

// ================================================================== 10 Try it: findings
{
  const s = content(SL, "Try it: read the run's findings");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "$ python -c \"import json; [print(r['Rule'], r['Severity'], r['Object']) for r in json.load(open('out/ch07/runs/2026-11-01T0600Z/lifecycle/findings.json'))]\"",
    "LD-01 Finding 100104                          LD-04 Finding morgan.lee@contoso.example",
    "LD-02 Finding drew.park@contoso.example       LD-04 Finding drew.park@contoso.example",
    "LD-02 Finding harper.vu@contoso.example       LD-04 Finding quinn.ross@contoso.example",
    "LD-02 Finding bailey.ortiz@contoso.example    LD-05 Finding 100303",
    "LD-03 Finding print.kiosk@contoso.example     LD-06 Finding 900002",
    "LD-03 Finding old.temp@contoso.example        LD-06 Finding 900011",
    "LD-04 Finding blake.ito@contoso.example       LD-07 Warn correlationCoverage    ... four more LD-07",
    "LD-04 Finding casey.ng@contoso.example        LD-08 Warn transferToReviewHours",
  ], { label: "TRY IT  ·  LAB 1, STEP 3, RUN NOVEMBER 2, 2026 (SET IN TWO COLUMNS; FOUR LD-07 LINES TRIMMED)", pt: 9.5 });
  const b = table(s, "Count", c + 0.25, [3.0, 9.15], ["Severity", "What step 3 shows"], [
    ["14 Findings", "One LD-01, three LD-02, two LD-03, five LD-04 (Module 1's four second writers and its forbidden delete), one LD-05, two LD-06"],
    ["6 Warns", "Five LD-07, one per metric out of bounds; one LD-08, for transfer-to-review"],
  ], { fontSize: 13, limit: 6.55 });
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" step 3; examples/hr-lifecycle: lifecycle_drift.py, tests/fixtures/ch07.");
  notes(s,
`Step three prints the findings, one line each. There are fourteen Findings. One missing identity, a worker with no account. Three stale accounts, among them Drew and Harper, two of Module 6's leavers, still enabled, and a contractor past the earliest end. Two orphans, a print kiosk and an old temp account. Five unauthorized writes, which are Module 1's four second writers and its forbidden delete, carried forward. One active card for a separated worker, and two contractor cards that should be gone. Then six Warns: five L D seven, one for each metric out of bounds, and one L D eight, for the metric that wasn't measured. Notice how the earlier modules' results reappear here. This run is where they all meet.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," step 3.`);
}

// ================================================================== 11 Try it: package and verify
{
  const s = content(SL, "Try it: package two runs, chained, and verify");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 4 writes the next day's run (--since 2026-11-01 --until 2026-11-02): the same metrics and counts",
    "# Step 5 (commands wrapped; hashes shortened with ...)",
    "$ python ../drift-pipeline/python/hr_evidence.py package --run out/ch07/runs/2026-11-01T0600Z --out out/ch07/evidence",
    "$ python ../drift-pipeline/python/hr_evidence.py package --run out/ch07/runs/2026-11-02T0600Z \\",
    "    --previous-manifest out/ch07/evidence/2026-11-01T0600Z/EVIDENCE-MANIFEST.json --out out/ch07/evidence",
    "$ python ../drift-pipeline/python/hr_evidence.py verify out/ch07/evidence/2026-11-02T0600Z",
    "{\"evidence_manifest_sha256\": \"342c65f7...008e\", \"new\": 20, \"open\": 20, \"package\": \"2026-11-01T0600Z\", \"resolved\": 0}",
    "{\"evidence_manifest_sha256\": \"2892017a...39c9\", \"new\": 0, \"open\": 20, \"package\": \"2026-11-02T0600Z\", \"resolved\": 0}",
    "{\"evidence_manifest_sha256\": \"2892017a...39c9\", \"files\": 6, \"run_id\": \"2026-11-02T0600Z\"}",
    "$ (cd out/ch07/evidence/2026-11-02T0600Z && sha256sum -c SHA256SUMS)",
    "run/lifecycle/findings.json: OK        run/run.json: OK",
    "run/lifecycle/manifest.json: OK        summary.md: OK",
    "run/lifecycle/metrics.json: OK         EVIDENCE-MANIFEST.json: OK",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED; THE SIX OK LINES SET IN TWO COLUMNS)", pt: 10 });
  line(s, "Read", "The second package opens nothing and closes nothing: the inputs didn't change. Hashes match only on the committed fixtures.", c + 0.2, 0.65, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 4 and 5; Knowledge check, answer 3; examples/drift-pipeline/python/hr_evidence.py.");
  notes(s,
`Step four writes the next day's run, for the first of November, and it prints the same metrics and the same counts. Step five packages both runs. The first package opens twenty findings, the fourteen Findings and six Warns. The second package names the first one's manifest as its previous, which chains them. It opens nothing new and closes nothing, because the inputs didn't change between the two runs. Then verify confirms the second package: six files, and the same manifest hash the package command printed. Your hashes match these only if your fixtures are the committed ones. Finally, the ISSO's own check, with no kit at all: sha256sum, run inside the package folder, reports every file OK.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," steps 4 and 5; "Knowledge check," answer 3.`);
}

// ================================================================== 12 Try it: period
{
  const s = content(SL, "Try it: assemble the period, and read why it fails");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 6",
    "$ python ../drift-pipeline/python/hr_evidence.py period --evidence out/ch07/evidence --since 2026-10-01 --until 2026-11-02 --out out/ch07/periods",
    "{\"chain_breaks\": 0, \"complete\": false, \"coverage_gaps\": 0, \"open_at_end\": 20, \"packages\": 2, \"period\": \"period-2026-10-01_2026-11-02\"}",
    "$ cat out/ch07/periods/period-2026-10-01_2026-11-02/period-summary.md",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026", pt: 9.5 });
  const b = table(s, "Gate7", c + 0.2, [6.6, 3.85, 1.7], ["Gate 7 criterion, from period-summary.md", "From this code", "Status"], [
    ["Lifecycle drift classes found and closed at the source", "20 open at the end", "not met"],
    ["Metrics on the ConMon cadence, within the agency's thresholds", "5 out of bounds; 1 not measured", "not met"],
    ["Evidence kept outside the directory, unbroken", "Chain breaks 0, gaps 0", "met"],
    ["Sole source proved per population", "Not decided by this code", "not decided"],
  ], { fontSize: 12.5, limit: 5.9 });
  line(s, "Exit", "Exit code 2. Step 7: 57 and 142 tests pass; then delete out, which holds fictional names.", b + 0.15, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 6 and 7; Knowledge check, answer 4; examples/drift-pipeline/python/hr_evidence.py.");
  notes(s,
`Step six assembles the period, from the first of October to the second of November. Two packages, no chain breaks, no coverage gaps, twenty findings open at the end, and complete is false. Exit code two. Print the period summary and you see why. It scores Gate 7's criteria. The evidence criterion is met: kept outside the directory, with an unbroken chain. But drift is still open, so the first criterion isn't met, and five metrics are out of bounds, so the second isn't either. The fourth, the sole source, isn't decided by this code at all. That's the point of this step: an unbroken chain proves the record is intact, not that the gate is passed. Step seven runs both test suites, fifty-seven and a hundred forty-two tests, and deletes the out folder.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," steps 6 and 7; "Knowledge check," answer 4.`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: schedule the run in a test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant, never production"],
    ["Permissions", "A reader app with a certificate or a federated credential, holding only the two permissions graph_export.py --task drift-read --list prints, with admin consent"],
    ["Run", "Export the workforce users; run Modules 1 to 6's Lab 2; write a run in tenant mode"],
    ["Schedule", "In Book 19, Chapter 09's workflow, with packages written to an immutable test storage container; assemble a period"],
    ["Back it out", "Remove the schedule; delete the reader app, its credential and consent; delete the test container if you made it; delete the local folders"],
  ], { fontSize: 12.5, limit: 5.4 });
  callout(s, "NotRun", b + 0.3, 0.9, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "Lab 2 follows the workbook's Chapter 07, Lab 2, written from Microsoft Learn's procedures.");
  sources(s, "Sources: Module 7, \"Exercise: Lab 2\"; HR-Driven Identity path, \"What you need for the labs\"; path verification log, claim 3.");
  notes(s,
`Lab 2 runs the same thing for real, in a worldwide or GCC test tenant, never production. The reader app uses a certificate or a federated credential, and holds only the two permissions the drift-read task lists, with admin consent. You export the workforce users, run Lab 2 of Modules 1 to 6 against the test tenant, and write a run in tenant mode. Then you schedule it in Book 19's Chapter 09 workflow, with each package written to an immutable test storage container, and assemble a period from the scheduled runs. To back it out, remove the schedule, delete the reader app, its credential and its consent, delete the test container if you created it for the lab, and delete the local folders. The authors haven't run Lab 2.`,
  `${M} — "Exercise: Lab 2 (your test tenant)"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence to keep");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.0, 9.15], ["Requirement", "What this gate meets"], [
    ["NIST SP 800-53", "CA-7 continuous monitoring (system-level metrics); AU-6 and AU-11 with SI-12, review and retention of audit records"],
    ["BOD 25-01", "Continuous reporting"],
  ], { fontSize: 13, limit: 3.3 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS FOR GATE 7", null, [
    "Every period's PERIOD-MANIFEST.json, period-summary.md and SHA256SUMS, with the approved thresholds",
    "The packages, with each LD-04 finding's closure at the source",
    "The storage container's retention and immutability settings, set to the records schedule",
    "The ScubaGear results beside the period; the guide's Evidence section gathers all seven gates",
  ], 13);
  sources(s, "Sources: Module 7, \"Introduction\" (the federal requirement); \"Summary\" (the evidence an ISSO keeps).");
  notes(s,
`The federal requirement. In NIST special publication eight hundred fifty-three terms, this gate meets C A seven, continuous monitoring with system-level metrics, and A U six and A U eleven with S I twelve: the review and retention of audit records. It also meets BOD 25-01's continuous reporting. The evidence an ISSO keeps for Gate 7: every period's manifest, summary and checksum file, with the approved thresholds. The packages, with each unauthorized-write finding's closure at the source. The storage container's retention and immutability settings, set to the records schedule. And the ScubaGear results beside the period. The guide's Evidence section gathers all seven gates into one file per population.`,
  `${M} — "Introduction" (the federal requirement); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on drift and evidence", [
    { q: "Module 4's mover review is still open, so there's no transfer-to-review value. How does the run report it?", options: ["a. As zero hours", "b. As the previous period's value", "c. As not measured (LD-08), never as zero"] },
    { q: "The period has zero chain breaks and zero coverage gaps, but complete is false. Why?", options: ["a. Drift is still open and metrics are out of bounds, so Gate 7's criteria aren't met", "b. Two packages aren't enough for a period", "c. sha256sum wasn't run"] },
  ], "1 c: a metric with no input is not measured, never zero. 2 a: an unbroken chain meets only the evidence criterion.");
  sources(s, "Sources: Module 7, \"Knowledge check,\" questions 2 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions from the module's knowledge check. First: Module 4's mover review is still open, so there's no transfer-to-review value. How does the run report it? The answer is c: as not measured, rule L D eight, never as zero. A zero would look like the best possible result, and it would be false. Second: the period reports zero chain breaks and zero coverage gaps, but complete is false. Why? The answer is a. Drift is still open and metrics are out of bounds, so Gate 7's criteria aren't met. The period scores the criteria, and an unbroken chain meets only the evidence criterion. The module page has three more questions, each linked to the section that teaches it.`,
  `${M} — "Knowledge check," questions 2 and 4; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary: you've finished the learning path");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Rebuilt the earlier modules' outputs",
    "Wrote two daily runs of the drift classes and metrics",
    "Packaged them with a hash chain, and verified a package",
    "Assembled a period that shows exactly which Gate 7 criteria are met",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "WHERE NEXT", "The end of the path", [
    "Go back to the learning path",
    "Or check your agency's progress against the guide's Checklist",
  ], 13.5);
  callout(s, "Seven", Math.max(l, r) + 0.3, 0.9, "FaClipboardCheck", HEX.teal, "Seven gates, one record: ",
    "the guide's Evidence section gathers all seven gates into one file per population.");
  sources(s, "Sources: Module 7, \"Summary\"; HR-Driven Identity path, \"What you'll be able to do.\"");
  notes(s,
`To sum up. You rebuilt the earlier modules' outputs, and wrote two daily runs of the lifecycle drift classes and metrics. You packaged them with a hash chain, verified a package with the kit and with sha256sum, and assembled a period that shows exactly which of Gate 7's criteria are met, and which aren't. And with that, you've finished the HR-Driven Identity learning path. Across seven modules you named one writer for every account state, ran contractors from their own source, made joiners ready on day one, assigned access from attributes, checked card sign-in, timed separations, and filed the evidence. Go back to the learning path, or check your agency's progress against the guide's checklist.`,
  `${M} — "Summary"; learning path index — "What you'll be able to do," "Modules."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: HR Module 7 deck", [
  "Module page: docs/training/hr-driven-identity/07-drift-and-evidence.md (HR-Driven Identity learning path, Module 7): Introduction, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "The units it assigns: the HR-driven identity implementation guide, Step 7 and Evidence; Book 03, Chapter 11 and Appendix C; Book 19, Chapter 09; the developer workbook Building HR-Driven Identity, Chapter 07 (The drift classes; The metrics; The package, the chain and the period; Lab 1; Lab 2; Federal requirements and evidence).",
  "Path: docs/training/hr-driven-identity/index.md and its verification log, _verification/learning-path.md (Lab 1 re-run November 1, 2026; the write-once folder rule, claim 7; Lab 2 not run).",
  "Kit: examples/hr-lifecycle (README; python/lifecycle_drift.py; config/drift.json; tests/fixtures/ch01 to ch07) and examples/drift-pipeline (python/hr_evidence.py). Names and keys in the fixtures are fictional.",
  "Lab output: run November 2, 2026 in a scratch copy of examples/ with Python 3.14.3 (57 and 142 tests passed); the Try it output is trimmed or rearranged where the slide says so. Lab 2 not run by the authors.",
]);

finish(OUT);
