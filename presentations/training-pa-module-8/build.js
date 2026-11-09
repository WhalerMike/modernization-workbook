// Privileged Access learning path, Module 8: Evidence and drift for the ISSO — the module's narrated deck.
// Teaches docs/training/privileged-access/08-evidence-and-drift.md, Learn-style: objectives, the concepts, "Try it" slides
// with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/), Lab 2, the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, the learning
// path's verification log, or the kit (examples/privileged-access, examples/drift-pipeline); the deck adds none. The
// narration names the original source the workbook footnotes for each fact (workbook Chapter 08's footnotes).
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pa-module-8/build.js \
//                      presentations/training-pa-module-8/Training_PA_Module_8.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 8: Evidence and drift for the ISSO",
  footer: "Federal Modernization Workbook  ·  Privileged Access learning path, Module 8: Evidence and drift for the ISSO",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Privileged Access learning path — Module 8: Evidence and drift for the ISSO";
const OUT = process.argv[2] || "Training_PA_Module_8.pptx";
const M = "Training, Privileged Access, Module 8";

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
  const s = title(SI, "Module 8: Evidence and drift for the ISSO", "Privileged Access learning path · Plan Phases 3 and 4 (A3.6, A4.3, Gate 4) · Chapter 08",
    ["State and events  ·  The audit findings  ·  Compare by fingerprint  ·  No names", "The package, the chain and the period  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 8 of the Privileged Access learning path: evidence and drift for the ISSO. It's the last module of the path. It serves the project plan's task A3.6 in Phase 3, A4.3 in Phase 4, and Gate 4, with Chapter 08 of the developer workbook. In it you run the privileged reads on a schedule, say what changed since the last run without putting anyone's name in the issue tracker, show every PIM activation in a window with its approval, and hand the ISSO a package and a period summary they can check with sha256sum alone. This lab uses two kits: the privileged-access folder in PowerShell, and the drift pipeline in a POSIX shell with Python. It's illustrative: tested against fixtures.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: evidence for every elevation in the period");
  tag(s, "Why");
  const l = panel(s, "Learn", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "TWO FACTS FROM MICROSOFT LEARN", null, [
    "Microsoft Entra audit logs are kept for 30 days with Entra ID P1 or P2",
    "PIM can log one activation under several correlation IDs; its request ID stays the same",
  ], 13.5);
  const r = panel(s, "EA", 6.85, 1.45, 5.9, null, HEX.red, HEX.redTint, "EMERGENCY ACCESS IN EVERY RUN", null, [
    "Every run repeats Module 2's check beside Module 1's inventory",
    "Emergency access rules, the Global Administrator count and root elevation count as Tier 0",
    "A new or changed Tier 0 Finding is an incident",
  ], 13);
  callout(s, "Gate", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.red, "The plan's last gate asks for ",
    "\"evidence for every elevation in the period.\" This module produces it, and a reviewer can check it with sha256sum alone.");
  sources(s, "Sources: Module 8, \"Introduction\" and its callout; Microsoft Learn, \"Microsoft Entra data retention,\" \"View audit history for Microsoft Entra roles in PIM\"; Book 04, Ch 10.");
  notes(s,
`Why this module? The plan's last gate, Gate 4, asks for evidence for every elevation in the period. Two facts from Microsoft Learn shape how you get it. Microsoft Learn's page on Entra data retention says audit logs are kept for thirty days with Microsoft Entra I D P1 or P2, so you have to read them before they're gone. And Microsoft Learn's page on PIM audit history shows that PIM can log one activation under several correlation I D's, while its request I D stays the same. And one thing carries over from Module 2: every run repeats the emergency access check beside the inventory. The comparison treats the emergency access rules, the Global Administrator count and root-scope elevation as Tier 0, whatever the row says, and any new or changed Tier 0 finding is an incident. That's the program's drift rule: a drift on a Tier 0 object is a security incident.`,
  `${M} — Unit "Introduction"; the callout "Emergency access in every run"; Book 04, Chapter 10 — "Drift detection and closure."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 8", [
    "Explain why the run reads state and PIM audit events, and why the windows must leave no gap",
    "Read the audit findings, PA-AUD-01 to PA-AUD-04",
    "Explain the comparison by fingerprint, and what counts as an incident",
    "Explain why issue drafts carry no names",
    "Package, chain and verify runs, and assemble a period for Gate 4",
  ], [
    "Modules 1 and 2: the run repeats their two reads",
    "The first workbook's Chapter 09: skim it",
    "Lab 1: PowerShell 7.1+ and Pester 5; Python 3.10+ with pytest and PyYAML; sha256sum",
  ], 65);
  sources(s, "Sources: Module 8, \"Learning objectives,\" \"Prerequisites,\" \"Exercise: Lab 1\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty-five minutes with the lab. You'll explain why the run reads both the tenant's state and the PIM audit events, and why the audit windows must leave no gap. You'll read the audit findings, audit rules oh one to oh four. You'll explain how the comparison works, by fingerprint, and what counts as an incident. You'll explain why issue drafts carry no names. And you'll package, chain and verify runs, and assemble a period for the Gate 4 review. Before you start, finish Modules 1 and 2: the run repeats their two reads unchanged. And skim Chapter 09 of the first developer workbook, which the comparison and the package build on. Lab 1 needs PowerShell 7.1 or later with Pester 5, and for the POSIX steps, Python 3.10 or later with pytest and PyYAML, and sha256sum.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; "Exercise: Lab 1."`);
}
endModule(SI);

// ================================================================== 4 What the evidence shows
{
  const s = content(SC, "State, events, and a chain of windows with no gap");
  tag(s, "What");
  const b = table(s, "Run", 1.45, [3.0, 3.3, 5.85], ["The run's part", "Describes", "Read"], [
    ["The inventory", "The tenant's state", "Module 1's read, unchanged"],
    ["The emergency check", "The tenant's state", "Module 2's read, unchanged"],
    ["The PIM audit read", "The events in a window", "Every request, approval, activation and assignment"],
  ], { fontSize: 13, limit: 3.6 });
  const l = panel(s, "Chain", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "EVERY ELEVATION, IN CODE", "Design guidance", [
    "A chain of audit windows with no gap between them is what \"every elevation in the period\" means",
  ], 13);
  panel(s, "Refuse", 6.85, b + 0.25, 5.9, null, HEX.red, HEX.redTint, "THE AUDIT READ", null, [
    "Refuses a window that starts more than 30 days before the run",
    "Keeps each event as IDs, not names",
  ], 13);
  sources(s, "Sources: Module 8, Unit 1; Microsoft Learn, \"Microsoft Entra data retention,\" \"List directoryAudits\"; Book 04, Ch 08 Step 9.");
  notes(s,
`Unit 1: what the evidence has to show. The run has three parts. The inventory and the emergency check describe the tenant's state: who holds what, right now. The PIM audit read describes the events in a window: every request, approval, activation and assignment. And a chain of windows with no gap between them is what every elevation in the period means in code. That's this workbook's design guidance. The audit read refuses a window that starts more than thirty days before the run. With thirty days' retention, older events can't be read, and a window reaching further back would look complete when it isn't. Microsoft Learn's page on PIM audit history makes the same point from the other side: its data covers the past thirty days, so route the logs elsewhere to keep them longer. And the read keeps each event as I D's, not names.`,
  `${M} — Unit 1: workbook Chapter 08, "What the evidence has to show," "The run," "The audit read"; Book 04, Chapter 08 — Step 9.`);
}

// ================================================================== 5 Audit findings
{
  const s = content(SC, "The audit findings: PA-AUD-01 to PA-AUD-04");
  tag(s, "What");
  const b = table(s, "AUD", 1.45, [1.7, 2.6, 5.15, 2.7], ["Rule", "Severity", "What it catches", "From"], [
    ["PA-AUD-01", "Finding for T0 and T1; Warn otherwise", "A role assigned outside PIM", "Learn: monitor it"],
    ["PA-AUD-02", "Finding", "A Tier 0 or Tier 1 activation completed with no approval record in the window", "The program's tiers"],
    ["PA-AUD-03", "Finding", "An activation approved by its own requester", "Design; Gate 3"],
    ["PA-AUD-04", "Finding for T0; Warn otherwise", "A role setting changed in PIM, to reconcile with a reviewed change", "Learn: always alert"],
  ], { fontSize: 12.5, limit: 4.4 });
  callout(s, "PIM", b + 0.3, 0.9, "FaListCheck", HEX.navy, "Reconcile, don't trust: ",
    "a setting change in PIM is a finding until it matches a reviewed change to the files from Module 4.");
  sources(s, "Sources: Module 8, Unit 1; Microsoft Learn, \"Microsoft Entra security operations for PIM\"; workbook Chapter 08, \"The audit findings.\"");
  notes(s,
`The audit findings, rules oh one to oh four. Audit oh one is a role assigned outside PIM. Microsoft Learn's security operations guide for PIM says to monitor roles assigned outside PIM, and it's a finding for Tier 0 and Tier 1. Audit oh two is a Tier 0 or Tier 1 activation that completed with no approval record in the window, because the program's tiers require approval there. Audit oh three is an activation approved by its own requester; the plan's Gate 3 asks for requester and approver to be distinct for Tier 0, and that's the kit's design. And audit oh four is a role setting changed in PIM. Microsoft Learn's guide says to always alert on PIM setting changes for Privileged Role Administrator and Global Administrator. The change is a finding until it's reconciled with a reviewed change to the files from Module 4.`,
  `${M} — Unit 1: workbook Chapter 08, "The audit findings."`);
}

// ================================================================== 6 Compare
{
  const s = content(SC, "Compare by fingerprint, and findings without names");
  tag(s, "What");
  const b = table(s, "Kinds", 1.45, [2.6, 9.55], ["Result", "What it means"], [
    ["new, changed", "A finding that wasn't there last run, or that changed"],
    ["resolved, unchanged", "Gone since last run, or the same"],
    ["unverified", "A task that didn't read the tenant this run: its findings stay open, never resolved"],
    ["incident", "A new or changed Tier 0 finding, or Tier 0 drift"],
  ], { fontSize: 13, limit: 3.9 });
  const l = panel(s, "Names", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "FINDINGS WITHOUT NAMES", null, [
    "Issue titles come from a fixed catalog",
    "Bodies carry object IDs and fingerprints",
  ], 13);
  panel(s, "Store", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "THE NAMES STAY", null, [
    "In the drift report, which goes to the access-controlled evidence store, not the tracker",
  ], 13);
  sources(s, "Sources: Module 8, Unit 2, Knowledge check answers 2 and 3; workbook Chapter 08, \"Compare, by fingerprint,\" \"Findings without names.\"");
  notes(s,
`Unit 2: compare, package and the period. The comparison matches findings between two runs by fingerprint, not by name. Each finding is new, changed, resolved or unchanged. A task that didn't read the tenant this run is unverified, and its findings stay open, never resolved: silence isn't a fix. And a new or changed Tier 0 finding, or drift on a Tier 0 object, is an incident. Then the issue drafts carry no names. Their titles come from a fixed catalog, and their bodies carry object I D's and fingerprints. The names stay in the drift report, which goes to the access-controlled evidence store, not to the issue tracker. That's this workbook's design, so the tracker never becomes a list of privileged people.`,
  `${M} — Unit 2: workbook Chapter 08, "Compare, by fingerprint," "Findings without names."`);
}

// ================================================================== 7 Package and period
{
  const s = content(SC, "The package, the chain, and what the ISSO receives");
  tag(s, "What");
  const l = panel(s, "Pkg", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE PACKAGE AND THE CHAIN", null, [
    "Each run becomes a package: EVIDENCE-MANIFEST.json and SHA256SUMS",
    "Each package records the previous package's manifest hash",
    "A replaced package or a missing day shows up as a break",
  ], 13);
  const r = panel(s, "Period", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "WHAT THE ISSO RECEIVES", "The period summary", [
    "PERIOD-MANIFEST.json and period-summary.md",
    "The Gate 4 criteria it speaks to, and the ones it leaves to people",
  ], 13);
  callout(s, "Check", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "Checkable without the code: ",
    "a reviewer runs sha256sum -c on SHA256SUMS, and pa_evidence.py verify checks the manifest.");
  sources(s, "Sources: Module 8, Unit 2 and Lab 1, steps 8 and 9; workbook Chapter 08, \"The package and the chain,\" \"What the ISSO receives.\"");
  notes(s,
`The package and the chain. Each run becomes a package, with an evidence manifest and a SHA256SUMS file. Each package records the previous package's manifest hash, so the packages form a chain. A replaced package, or a missing day, shows up as a break in that chain. And the reviewer doesn't need the code to check it: sha256sum, checking the sums file, is enough, and the kit's verify command checks the manifest. Then what the ISSO receives: a period, with its own manifest and a period summary. The summary speaks to the Gate 4 criteria the code can measure, and says plainly which ones it leaves to people.`,
  `${M} — Unit 2: workbook Chapter 08, "The package and the chain," "What the ISSO receives."`);
}
endModule(SC);

// ================================================================== 8 Try it: queries and permissions
{
  const s = content(SL, "Try it: Learn's queries, and nine read permissions");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/privileged-access",
    "PS> Invoke-Pester -Path tests/EvidenceDrift.Tests.ps1 -FullNameFilter '*as published*' -Output None -PassThru |",
    "      Select-Object PassedCount, FailedCount, NotRunCount",
    "PassedCount FailedCount NotRunCount",
    "----------- ----------- -----------",
    "          8           0          24",
    "# Step 2: list the permissions the run needs",
    "PS> Import-Module ./powershell/PaEvidence/PaEvidence.psm1",
    "PS> (Get-PaEvidencePermission -Task evidence-run).GraphPermissions -join ', '",
    "AuditLog.Read.All, GroupMember.ReadBasic.All, Policy.Read.All, RoleAssignmentSchedule.Read.Directory,",
    "  RoleEligibilitySchedule.Read.Directory, RoleManagement.Read.Directory, User.Read.All, User.ReadBasic.All,",
    "  UserAuthenticationMethod.Read.All",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (THE PERMISSIONS LINE WRAPPED)", pt: 11 });
  line(s, "Read", "Two of the 13 rows Learn's first query returns are role assignments made outside PIM. Nine permissions, none ReadWrite.", c + 0.3, 0.75, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 1 and 2; Microsoft Learn, \"View audit history for Microsoft Entra roles in PIM\"; config/calls-ch08.json.");
  notes(s,
`Try it. Steps one to four run in PowerShell 7, in the privileged-access folder. Step one runs Microsoft Learn's queries from its PIM audit history page over the fixture, as published. Eight pass; the twenty-four not run are the chapter's other tests. The third test is the one to notice: two of the thirteen rows the first query returns are role assignments made outside PIM, which a reader of the query could miss. Step two lists the permissions the run needs. Nine: Audit Log dot Read dot All for the events, and the read permissions Modules 1 and 2 already use. None ends in ReadWrite. The output on the slide is wrapped to fit.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 9 Try it: two days
{
  const s = content(SL, "Try it: run two days against the fictional tenant");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Lab 1, step 3",
    "PS> $lab = @{ Cloud = 'gcc'; TenantId = '11111111-1111-4111-8111-111111111111'; OutputPath = 'out/runs'",
    "        AuditFixturePath = 'tests/fixtures/ch08/audit.json'; EmergencyConfigPath = 'tests/fixtures/inputs/emergency-access.json'",
    "        ValidationsPath = 'tests/fixtures/inputs/emergency-validations.csv'; ExceptionsPath = 'tests/fixtures/inputs/exceptions.csv'",
    "        AzureScope = '/subscriptions/1111...1111', '/providers/Microsoft.Management/managementGroups/contoso-root', '/subscriptions/2222...2222'",
    "        ControlPlaneSubscriptionId = '22222222-2222-4222-8222-222222222222' }",
    "PS> ./Invoke-PaEvidenceRun.ps1 @lab -FixturePath tests/fixtures/tenant.json -AsOf 2026-10-29T06:00:00Z",
    "Run 2026-10-29T0600Z-fixture (Fixture, gcc): inventory OK, emergency-access OK, pim-audit OK",
    "Audit window 2026-10-28T06:00:00Z to 2026-10-29T06:00:00Z",
    "Written to out/runs/2026-10-29T0600Z-fixture (run.json lists each task's manifest hash)",
    "PS> ./Invoke-PaEvidenceRun.ps1 @lab -FixturePath tests/fixtures/ch08/tenant-day2.json -AsOf 2026-10-30T06:00:00Z",
    "Run 2026-10-30T0600Z-fixture (Fixture, gcc): inventory OK, emergency-access OK, pim-audit OK",
    "Audit window 2026-10-29T06:00:00Z to 2026-10-30T06:00:00Z",
    "Written to out/runs/2026-10-30T0600Z-fixture (run.json lists each task's manifest hash)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TWO SUBSCRIPTION IDS SHORTENED WITH \"...\")", pt: 10.5 });
  line(s, "Read", "The second window starts where the first ended. The Written to line may print the folder's full path on your machine.", c + 0.25, 0.45, 13);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" step 3; the path's verification log (the full path); examples/privileged-access: Invoke-PaEvidenceRun.ps1.");
  notes(s,
`Step three runs two days against the fictional tenant. First, one variable holds the run's settings: the cloud, the tenant I D, the output folder, the audit fixture, the emergency access files, the exceptions, the Azure scopes, and the control-plane subscription. Then run day one, as of six in the morning on the twenty-ninth of October. The inventory, the emergency check and the PIM audit read all report OK, and the audit window is the twenty-four hours before. Then day two, against the second day's tenant, as of the thirtieth. Notice the second window starts exactly where the first ended: no gap. Each run's folder has a run file that lists each task's manifest hash. On your machine, the Written to line may print the folder's full path; the path's verification log records that.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 3; the learning path's verification log, "Found during the re-run."`);
}

// ================================================================== 10 Try it: audit and baseline
{
  const s = content(SL, "Try it: day two's audit findings, and a baseline");
  tag(s, "How");
  const c = code(s, "Aud", 0.6, 1.45, 12.15, [
    "# Lab 1, step 4 (PowerShell)",
    "PS> Get-Content out/runs/2026-10-30T0600Z-fixture/pim-audit/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Tier, ObjectId",
    "PA-AUD-01 Finding  T0   a0000000-0000-4000-8000-000000000020",
    "PA-AUD-02 Finding  T0   a0000000-0000-4000-8000-000000000013",
    "PA-AUD-04 Finding  T0   62e90394-69f5-4237-9190-012177145e10",
    "# Step 5 (a POSIX shell): record a baseline and package it",
    "$ cd ../drift-pipeline",
    "$ DAY1=tests/fixtures/pa-runs/2026-10-29T0600Z-fixture",
    "$ DAY2=tests/fixtures/pa-runs/2026-10-30T0600Z-fixture",
    "$ python python/pa_evidence.py compare --current $DAY1 --out out/day1",
    "{\"baseline\": true, \"counts\": {... \"incidents\": 0, \"new\": 26, \"resolved\": 0, \"unchanged\": 0, \"unverified\": 0}, \"drift\": true}",
    "$ python python/pa_evidence.py package --run $DAY1 --diff out/day1/pa-drift-report.json --out out/evidence",
    "{\"evidence_manifest_sha256\": \"208f4d6f3a6f7cbe0edb9e5a194034b492b1369509ab4ffd875abccbb4809251\", \"package\": \"2026-10-29T0600Z-fixture\"}",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 9, 2026 (TABLE HEADER LEFT OUT; \"...\" MARKS CUT COUNTS)", pt: 10.5 });
  line(s, "Read", "The compare exits 2: a baseline with 26 new findings. The runs are the repository's copies of step 3's; a Pester test checks them.", c + 0.25, 0.75, 13);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 4 and 5; examples/drift-pipeline: python/pa_evidence.py, tests/fixtures/pa-runs (fictional).");
  notes(s,
`Step four reads the second day's audit findings. Three, all Tier 0. Audit oh one: a Privileged Role Administrator assigned outside PIM. Audit oh two: a Global Administrator activation with no approval. And audit oh four: a Global Administrator role setting change. Open the events file and you'll see object I D's, no names. Step five moves to a POSIX shell, in the drift pipeline folder. Two variables name the two days' runs: the repository's copies of the ones you made in step three, and a Pester test checks them against a fresh run. Compare day one with nothing before it: it's a baseline, with twenty-six new findings, and the compare exits with two. Then package day one. The package prints its evidence manifest hash, starting e one oh d eight five four three.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 4 and 5.`);
}

// ================================================================== 11 Try it: compare
{
  const s = content(SL, "Try it: compare the next day: six Tier 0 incidents");
  tag(s, "How");
  const c = code(s, "Cmp", 0.6, 1.45, 12.15, [
    "# Lab 1, step 6",
    "$ python python/pa_evidence.py compare --previous $DAY1 --current $DAY2 --out out/day2",
    "{\"baseline\": false, \"counts\": {\"assignments_added\": 1, ... \"audit\": 3, ... \"incidents\": 6, \"new\": 2, \"resolved\": 6, \"unchanged\": 20, ...}}",
    "$ cat out/day2/pa-drift-summary.md        (the incident table, from the summary)",
    "| Incident           | Rule or role                  | Tier | Object ID                            | Fingerprint      |",
    "| assignment added   | Privileged Role Administrator | T0   | a0000000-0000-4000-8000-000000000020 | 4323bc029b188d13 |",
    "| assignment removed | Global Administrator          | T0   | a0000000-0000-4000-8000-000000000005 | 5928390622b60afd |",
    "| finding new        | PA-INV-01                     | T0   | a0000000-0000-4000-8000-000000000020 | 98987fe7faba3739 |",
    "| audit              | PA-AUD-01                     | T0   | a0000000-0000-4000-8000-000000000020 | 932d0eec891401bc |",
    "| audit              | PA-AUD-02                     | T0   | a0000000-0000-4000-8000-000000000013 | 71b6976b97ac126b |",
    "| audit              | PA-AUD-04                     | T0   | 62e90394-69f5-4237-9190-012177145e10 | be47f0e001bbf3b2 |",
    "Names are in pa-drift-report.json, which goes to the evidence store, not to the issue tracker.",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS; COLUMNS ALIGNED)", pt: 10 });
  line(s, "Read", "The compare exits 2. Among the six resolved: Module 2's PA-EA-07 and two PA-EA-08 for ea02, now in the exclusion group.", c + 0.25, 0.75, 13);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" step 6; examples/drift-pipeline/python/pa_evidence.py.");
  notes(s,
`Step six compares the next day with the first. It's not a baseline now. One assignment added, one removed, three audit findings, two new findings, six resolved, twenty unchanged, and six incidents. The summary's incident table lists all six, each Tier 0, each with its object I D and fingerprint. A Privileged Role Administrator assignment added, and a Global Administrator assignment removed. A new I N V oh one finding for the person who got that role. And the three audit findings from step four. The summary ends by saying the names are in the drift report, which goes to the evidence store, not the issue tracker. The compare exits with two. And among the six resolved findings are Module 2's E A oh seven and two E A oh eight findings for E A oh two, which is now in the exclusion group.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 6.`);
}

// ================================================================== 12 Try it: issues and package
{
  const s = content(SL, "Try it: draft the issues, then package and verify day two");
  tag(s, "How");
  const c = code(s, "Pkg", 0.6, 1.45, 12.15, [
    "# Lab 1, step 7: draft the findings",
    "$ python python/pa_evidence.py issues --diff out/day2/pa-drift-report.json --out out/day2/issues.json",
    "{\"close\": 9, \"comment\": 0, \"open\": 7}",
    "$ grep -c contoso out/day2/issues.json",
    "0",
    "# Step 8: package and verify the second day, chained to the first",
    "$ python python/pa_evidence.py package --run $DAY2 --diff out/day2/pa-drift-report.json \\",
    "    --previous-manifest out/evidence/2026-10-29T0600Z-fixture/EVIDENCE-MANIFEST.json --out out/evidence",
    "{\"evidence_manifest_sha256\": \"cc2428c804bd7096c0b6befbbbc128a6af5fbdc64929a185b9bce8d876342794\", \"package\": \"2026-10-30T0600Z-fixture\"}",
    "$ python python/pa_evidence.py verify out/evidence/2026-10-30T0600Z-fixture",
    "{\"evidence_manifest_sha256\": \"cc2428c8...6342794\", \"files\": 15, \"run_id\": \"2026-10-30T0600Z-fixture\"}",
    "$ (cd out/evidence/2026-10-30T0600Z-fixture && sha256sum -c --quiet SHA256SUMS)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 9, 2026 (ONE HASH SHORTENED WITH \"...\")", pt: 10.5 });
  line(s, "Read", "grep prints 0 (and exits 1): no user principal name reaches the drafts. sha256sum prints nothing and exits 0.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 7 and 8; examples/drift-pipeline/python/pa_evidence.py.");
  notes(s,
`Step seven drafts the findings for the issue tracker: seven to open, nine to close, none to comment on. Then search the drafts for the fictional domain, contoso. Zero matches, and grep exits with one: no user principal name reaches the drafts. Step eight packages the second day, chained to the first: you pass day one's evidence manifest as the previous manifest. The new package's hash starts c c two four two eight c eight. Verify it: fifteen files, and the same hash. Then check it the way a reviewer would, with sha256sum alone, checking the sums file. It prints nothing and exits with zero. In the evidence manifest, the previous package's hash is day one's: that's the chain.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 7 and 8.`);
}

// ================================================================== 13 Try it: period
{
  const s = content(SL, "Try it: assemble the period for the ISSO");
  tag(s, "How");
  const c = code(s, "Per", 0.6, 1.45, 12.15, [
    "# Lab 1, step 9",
    "$ python python/pa_evidence.py period --evidence out/evidence --since 2026-10-28T06:00:00Z --until 2026-10-30T06:00:00Z --out out/periods",
    "{\"chain_breaks\": 0, \"complete\": false, \"coverage_gaps\": 0, \"incidents\": 6, \"packages\": 2, \"period\": \"period-2026-10-28_2026-10-30\"}",
    "$ cat out/periods/period-2026-10-28_2026-10-30/period-summary.md        (the Gate 4 table, from the summary)",
    "Activations 3 (T0 2, T1 1, T2 0); requests 4, approved 2, denied 1; T0 or T1 activations without approval 1; ...",
    "| Gate 4 criterion                                 | Status                                                      |",
    "| Residual standing privilege named, rationale, AO | not met: standing privilege outside the exceptions list     |",
    "| Evidence for every elevation in the period       | not met                                                     |",
    "| Exception register current                       | not decided by this code                                    |",
    "| Access-related GPO settings retired              | not decided by this code                                    |",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: CRITERIA SHORTENED, THE MIDDLE COLUMN AND PACKAGE TABLE LEFT OUT)", pt: 10 });
  const b = table(s, "Read", c + 0.25, [3.4, 8.75], ["Read it", "What the period says"], [
    ["2 packages", "Chain breaks 0, audit coverage gaps 0, 6 Tier 0 incidents"],
    ["Standing privilege", "1 on the exceptions list with a reason, 8 outside it (PA-INV-01 at period end)"],
    ["Every elevation", "3 activations, 1 Tier 0 or Tier 1 activation without approval: not met"],
  ], { fontSize: 12.5, limit: 6.1 });
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" step 9; examples/drift-pipeline/python/pa_evidence.py.");
  notes(s,
`Step nine assembles the period for the ISSO, from the twenty-eighth to the thirtieth of October. Two packages, no chain breaks, no audit coverage gaps, six incidents, and complete is false. The summary counts three activations, two Tier 0 and one Tier 1; four requests, two approved and one denied; and one Tier 0 or Tier 1 activation without approval. Then the Gate 4 table. Residual standing privilege: one on the exceptions list with a reason, eight outside it, so not met. Evidence for every elevation in the period: not met, because one activation had no approval. Whether the exception register is current, and whether the access-related group policy settings are retired, are left to people: not decided by this code. The period exits with two. Object I D's only; the packages hold the names, under the evidence store's access control.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 9.`);
}

// ================================================================== 14 Try it: break it
{
  const s = content(SL, "Try it: break it on purpose, then run the tests");
  tag(s, "How");
  const c = code(s, "Brk", 0.6, 1.45, 12.15, [
    "# Lab 1, step 10",
    "$ echo edited >> out/evidence/2026-10-30T0600Z-fixture/drift/pa-drift-summary.md",
    "$ python python/pa_evidence.py verify out/evidence/2026-10-30T0600Z-fixture",
    "error: out/evidence/2026-10-30T0600Z-fixture: drift/pa-drift-summary.md doesn't match its SHA-256",
    "$ python python/pa_evidence.py compare --previous $DAY2 --current $DAY1 --out out/swap",
    "error: the current run (2026-10-29T06:00:00Z) isn't later than the previous one (2026-10-30T06:00:00Z)",
    "$ python python/workflow_lint.py workflow/pa-evidence.yml",
    "workflow/pa-evidence.yml: 0 finding(s), 0 warning(s)",
    "# Step 11: PowerShell, in examples/privileged-access",
    "PS> Invoke-Pester -Path tests/EvidenceDrift.Tests.ps1      Tests Passed: 32",
    "PS> Invoke-Pester -Path tests                              Tests Passed: 330",
    "# Then the POSIX shell, in examples/drift-pipeline",
    "$ python -m pytest tests -q                                142 passed",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (EACH TEST RUN'S COUNT SHOWN BESIDE IT)", pt: 10.5 });
  line(s, "Read", "Each refusal exits 1. Then delete out in both folders: the out folders hold the fixture's privileged holders.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 10 and 11; the path's verification log (pytest needs the whole repository); examples/drift-pipeline.");
  notes(s,
`Step ten breaks it on purpose. Append a word to the drift summary inside day two's package, and verify it: the file doesn't match its hash, an error. Compare the days the wrong way round: refused, because the current run isn't later than the previous one. Each refusal exits with one. And the sample workflow that would run all this on a schedule lints clean. Step eleven runs the tests in both shells. In PowerShell, the evidence tests, thirty-two pass, then the whole suite, three hundred thirty. In the POSIX shell, pytest in the drift pipeline: a hundred forty-two pass. The path's verification log notes that this suite needs the whole repository, not just the drift pipeline folder. Then delete the output folder in both places, because they hold the fixture's privileged holders.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 10 and 11; the learning path's verification log.`);
}

// ================================================================== 15 Lab 2
{
  const s = content(SL, "Lab 2: two live runs, compared, packaged and verified");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant with Entra ID P2 or ID Governance and a test Azure subscription, never production"],
    ["Inputs", "The emergency access files from Module 2's Lab 2; exceptions.csv from Module 4's Lab 2"],
    ["Run", "Register a reader app; make one test activation; run twice, before and after it"],
    ["Check", "Check the fields the fixture assumed; cross-check against PIM's resource audit in the admin center"],
    ["Evidence", "Compare, package and verify the two live runs"],
    ["Permissions", "The nine read permissions from step 2, with admin consent, and Reader on the test subscription"],
    ["Back it out", "End the test activation and eligibility; remove the permissions, Reader and the app; delete out/runs-test and the packages"],
  ], { fontSize: 12, limit: 5.7 });
  callout(s, "NotRun", b + 0.2, 0.75, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the run only reads. Follow the workbook's Lab 2.");
  sources(s, "Sources: Module 8, \"Exercise: Lab 2, your test tenant.\"");
  notes(s,
`Lab 2 runs in a worldwide or G C C test tenant with Microsoft Entra I D P2 or I D Governance and a test Azure subscription, never production, with fictional people. The run only reads. It uses the emergency access files from Module 2's Lab 2 and the exceptions file from Module 4's. Register a reader app, make one test activation, and run twice, before and after it. Check the fields the fixture assumed, and cross-check against PIM's resource audit in the admin center. Then compare, package and verify the two live runs. The reader app needs the nine read permissions from step two, with admin consent, and Reader on the test subscription, nothing else. The back-out ends the test activation and eligibility, removes the permissions, the Reader assignment and the app, and deletes the test runs and the packages, which hold the tenant's privileged holders. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant."`);
}
endModule(SL);

// ================================================================== 16 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence for Gate 4");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.2, 2.9, 4.05], ["Requirement", "KSI", "Evidence"], [
    ["CA-7: one folder per run, each task's manifest hashed", "KSI-MLA-EVC", "out/runs/<run-id>/ and run.json"],
    ["AC-6(9), AC-2(4), AU-11: every PIM event in the window, read before retention closes", "KSI-MLA-LET, KSI-IAM-JIT, KSI-MLA-OSM", "pim-audit: events.json, requests.json, summary.json"],
    ["AU-6; MS.AAD.7.5v1, 7.6v1: outside PIM; no approval", "KSI-MLA-RVL", "PA-AUD-01 and PA-AUD-02"],
    ["CA-7, SI-4, IR-4: what changed; Tier 0 drift as an incident", "KSI-MLA-EVC, KSI-IAM-SUS", "pa-drift-summary.md"],
    ["AU-9: each package hashed, chained and verified", "KSI-MLA-OSM", "EVIDENCE-MANIFEST.json, SHA256SUMS, verify"],
    ["CA-7, AU-6, AC-6(9); the plan's Gate 4", "KSI-MLA-EVC, KSI-MLA-RVL", "PERIOD-MANIFEST.json, period-summary.md"],
  ], { fontSize: 10.5, limit: 5.4 });
  panel(s, "Keep", 0.6, b + 0.15, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS FOR GATE 4", null, [
    "Each run's folder and run.json; each package's manifest and SHA256SUMS, in the evidence store; the period's manifest and summary; the incident record each Tier 0 fingerprint matches",
  ], 11.5);
  sources(s, "Sources: Module 8, \"Introduction,\" \"Summary\"; NIST SP 800-53 Rev. 5; CISA BOD 25-01 (MS.AAD.7.5v1, 7.6v1); FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. The runs, the packages and the period are the evidence for the plan's tasks A3.6 and A4.3, and for Gate 4's evidence for every elevation in the period. From NIST special publication eight hundred fifty-three they support C A seven, continuous monitoring; A C six, enhancement nine, logging the use of privileged functions; A U six, audit review; A U nine, protection of audit information; and A U eleven, retention. Drift as an incident adds S I four and I R four. And from CISA's B O D twenty-five oh-one and its ScubaGear baseline: M S A A D seven point five, roles assigned only through PIM, and seven point six, approval to activate Global Administrator. The evidence an ISSO keeps for Gate 4: each run's folder; each package's manifest and sums, in the evidence store; the period's manifest and summary; and the incident record each Tier 0 fingerprint matches.`,
  `${M} — Unit "Introduction" (the federal requirement and its table); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 17 Check
{
  const s = check(SS, "Check yourself: two questions on evidence and drift", [
    { q: "Why does the audit read refuse a window that starts more than 30 days before the run?", options: ["a. Graph's paging stops at 30 days", "b. Audit logs are kept for 30 days with P1 or P2, so the window would look complete when it isn't", "c. PIM deletes requests after 30 days"] },
    { q: "What does the hash chain between packages show?", options: ["a. Who signed each package", "b. A replaced package or a missing day, as a break", "c. The order of the audit events"] },
  ], "1 b: older events can't be read. 2 b: each package records the previous package's manifest hash; seen in steps 8 and 10.");
  sources(s, "Sources: Module 8, \"Knowledge check,\" questions 1 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: why does the audit read refuse a window that starts more than thirty days before the run? The answer is b: Microsoft Entra audit logs are kept for thirty days with P1 or P2, so older events can't be read, and the window would look complete when it isn't. Second: what does the hash chain between packages show? The answer is b: a replaced package or a missing day, as a break, because each package records the previous package's manifest hash. You saw the chain in Lab 1, step eight, and an edited package fail in step ten. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 18 Summary
{
  const s = content(SS, "Summary: you've finished the path");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Ran two days of privileged reads; found a role assigned outside PIM and an unapproved Tier 0 activation",
    "Compared the days into six Tier 0 incidents, and drafted issues with no names",
    "Packaged and chained both runs, and assembled a period that shows Gate 4 isn't met yet",
    "Saw an edited package fail verification",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "WHERE NEXT", "The end of the path", [
    "Go back to the learning path",
    "Or find every lab in one place on the Labs page",
  ], 13.5);
  callout(s, "Path", Math.max(l, r) + 0.3, 0.85, "FaUserShield", HEX.teal, "The path in one line: ",
    "list privilege, guard the emergency accounts, hold every setting as reviewed code, review it, and prove it.");
  sources(s, "Sources: Module 8, \"Summary\"; learning path index, \"What you'll be able to do.\"");
  notes(s,
`To sum up. You ran two days of privileged reads against a fictional tenant, found a role assigned outside PIM and an unapproved Tier 0 activation, and compared the days into six Tier 0 incidents. You drafted issues with no names, packaged and chained both runs, assembled a period that shows Gate 4 isn't met yet, and saw an edited package fail verification. And you've finished the path. Across eight modules you listed every privileged assignment, checked the emergency accounts before anything else, kept Conditional Access and PIM settings for roles, groups and Azure resources as reviewed code, reviewed privileged access, and filed the evidence. Go back to the learning path, or find every lab in one place on the Labs page.`,
  `${M} — Unit "Summary"; learning path index — "What you'll be able to do."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 8 deck", [
  "Module page: docs/training/privileged-access/08-evidence-and-drift.md (Privileged Access learning path, Module 8): Introduction, its callout and requirement table, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index.",
  "Original sources, as workbook Chapter 08 footnotes them: Microsoft Learn, \"Microsoft Entra data retention\"; \"View audit history for Microsoft Entra roles in PIM\"; \"Microsoft Entra security operations for PIM\"; \"List directoryAudits\"; NIST SP 800-53 Rev. 5; CISA BOD 25-01 and the ScubaGear Entra ID baseline; FedRAMP, \"Key Security Indicators.\"",
  "Kit: examples/privileged-access (Invoke-PaEvidenceRun.ps1; powershell/PaEvidence; config/calls-ch08.json; tests/EvidenceDrift.Tests.ps1; tests/fixtures/ch08) and examples/drift-pipeline (python/pa_evidence.py; python/workflow_lint.py; workflow/pa-evidence.yml; tests/fixtures/pa-runs). Fictional identities. Illustrative: tested against fixtures.",
  "Lab output: run November 3, 2026 with PowerShell 7.6.9, Pester 5.9.0, Python 3.14.3 and Git Bash in a scratch copy of examples/, outside the repository; it matched data/kit-captures/pa/08-1.txt to 08-14.txt. Output is trimmed or shortened where the slides say so. Verification: docs/training/privileged-access/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
