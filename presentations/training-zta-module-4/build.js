// Zero Trust Assessment learning path, Module 4: Reconcile, re-run and keep the evidence — the module's narrated deck.
// Teaches docs/training/zero-trust-assessment/04-reconcile-re-run-and-keep-the-evidence.md, Learn-style: objectives, the
// concepts (comparing runs; reconciling with ScubaGear, AWS Security Hub CSPM and the other clouds through the control;
// the cadence and the evidence package), three "Try it" slides with the real Lab 1 commands and output (run November 12,
// 2026 in a scratch copy of examples/zta-results after Module 3's Lab 1, the same output the page shows), Lab 2, the
// federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, the
// Zero Trust Assessment implementation guide it sends the learner to (Steps 9 and 10, and their footnotes), Book 11,
// Chapter 10, or the kit; the deck adds none. The module page is a draft awaiting review, and the title slide says so.
// Helpers: ../training-zta-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-zta-module-4/build.js \
//                      presentations/training-zta-module-4/Training_ZTA_Module_4.pptx
const P = require("../training-zta-module-1/shared.js")({
  title: "Module 4: Reconcile, re-run and keep the evidence",
  footer: "Federal Modernization Workbook  ·  Zero Trust Assessment learning path, Module 4: Reconcile, re-run and keep the evidence",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_ZTA_Module_4.pptx";
const M = "Training, Zero Trust Assessment, Module 4";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 4: Reconcile, re-run and keep the evidence", "The Zero Trust Assessment as Evidence · Compare runs, reconcile across tools, seal the evidence",
    ["Comparing runs  ·  Reconciling through the control  ·  ScubaGear, Security Hub CSPM, other clouds", "Cadence and the evidence package  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 4 of The Zero Trust Assessment as Evidence: reconcile, re-run and keep the evidence. This module is a draft, awaiting the editor's review, so recheck it after the review. A single run is a reading. A program needs the readings over time, lined up with the other tools, and sealed so an assessor can check them months later. This module does all three. It covers Steps 9 and 10 of the Zero Trust Assessment implementation guide, takes about fifty minutes, and finishes the path.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: one run is a reading; a program needs three things");
  tag(s, "Why");
  const tb = table(s, "Need", 1.45, [3.1, 9.05], ["A program needs", "Because"], [
    ["Readings over time", "Which findings were fixed, which came back, and which only seemed to disappear because the run lost a connection"],
    ["One finding per setting", "The Zero Trust Assessment's findings lined up with ScubaGear's and, where the agency runs AWS, Security Hub CSPM's: one setting under one control, one owner"],
    ["Sealed runs", "So an assessor can check months later that the files are the ones the tool and the kit wrote"],
  ], { fontSize: 13, limit: 4.7 });
  callout(s, "Point", tb + 0.3, 0.95, "FaArrowsRotate", HEX.red, "This module: ",
    "compare two runs, reconcile across tools through the control, set a cadence, and seal, check and break an evidence package.");
  sources(s, "Sources: Module 4, \"Introduction\"; Guide, Steps 9 and 10.");
  notes(s,
`Why does this matter? A single run is a reading. A program needs three more things. First, the readings over time: which findings were fixed, which came back, and which only seemed to disappear because the run lost a connection. Second, one finding per setting. The Zero Trust Assessment's findings have to line up with ScubaGear's, and, where the agency runs AWS, with Security Hub's, so one setting under one control is one finding with one owner. And third, every run sealed, so an assessor can check months later that the files are the ones the tool and the kit wrote. In this module you'll compare two runs, reconcile through the control, set a cadence, and seal an evidence package, then break it on purpose.`,
  `${M} — "Introduction"; guide, Steps 9 and 10.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Compare two runs, and explain the kinds of change, including no longer evaluated",
    "Say why runs from different tool versions aren't compared without a review",
    "Reconcile a finding across three tools through the control, and say what each can't see",
    "Set a cadence, seal a run's evidence, check it, and see a broken one fail",
  ], [
    "Module 3's Lab 1: this lab uses its out folder",
    "Book 11, Chapter 10: Reconcile at the control",
  ], 50);
  sources(s, "Sources: Module 4, \"Learning objectives,\" \"Prerequisites\"; Book 11, Ch 10.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll compare two runs, and explain the kinds of change, including no longer evaluated. You'll say why runs from different tool versions aren't compared without a recorded review. You'll reconcile a finding across the Zero Trust Assessment, ScubaGear and Security Hub, through the control, and state what each tool can't see. And you'll set a cadence and seal a run's evidence package, then check it, and see a broken one fail. You need Module 3's Lab 1, because this lab uses its out folder. In Unit 2 you'll read the section on reconciling at the control, in Evidence, Not Verdicts, a chapter of Zero Trust and Assessment.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Comparing runs
{
  const s = content(SC, "Unit 1: comparing runs, and \"no longer evaluated\"");
  tag(s, "What");
  const tb = table(s, "Change", 1.45, [3.2, 8.95], ["The comparison sorts each test into", "Meaning"], [
    ["New; regressed", "A finding that wasn't there, or a pass that now fails"],
    ["Fixed; still open", "A finding that now passes, or still fails"],
    [{ text: "No longer evaluated", options: { bold: true, color: HEX.red } }, "A finding that's now skipped, planned, unable to evaluate or missing: not fixed"],
    ["Changed; unchanged", "Everything else"],
  ], { fontSize: 13, limit: 4.4 });
  const l = panel(s, "NLE", 0.6, tb + 0.25, W2, null, HEX.red, HEX.redTint, "WHY IT MATTERS MOST", null, [
    "Counting it as fixed would turn a lost connection into remediation",
  ], 12.5);
  panel(s, "Ver", 0.6 + W2 + G2, tb + 0.25, W2, null, HEX.navy, HEX.navyTint, "A NEW TOOL VERSION", null, [
    "Adds tests and moves every denominator: refused until someone records a review",
  ], 12.5);
  sources(s, "Sources: Module 4, Unit 1; Guide, Step 10, step 1; examples/zta-results: Invoke-ZtaCompare.ps1.");
  notes(s,
`Unit 1 compares runs. The kit's comparison sorts every test into new, regressed, fixed, still open, no longer evaluated, changed or unchanged. New is a finding that wasn't there before. Regressed is a pass that now fails. Fixed now passes, and still open still fails. No longer evaluated is the one that matters most. It's a finding that's now skipped, planned, unable to evaluate, or missing from the run. It isn't fixed, and counting it as fixed would turn a lost connection into remediation. So fix the run, and run it again. And one more rule: a new tool release adds tests and moves every denominator, so the kit refuses to compare runs from different versions until someone records that they reviewed the change.`,
  `${M} — Unit 1 "Comparing runs"; guide, Step 10, step 1.`);
}

// ================================================================== 5 Reconcile
{
  const s = content(SC, "Unit 2: reconcile through the setting and the control");
  tag(s, "What");
  const p1 = panel(s, "Spine", 0.6, 1.45, 12.15, null, HEX.teal, HEX.tealTint, "ONE SPINE FOR TOOLS WITH DIFFERENT IDENTIFIERS", null, [
    "Match each tool to the setting and the NIST SP 800-53 control it supports, not tool to tool",
    "Two tools failing one setting under one control: one finding, two pieces of evidence, one owner",
  ], 13);
  const p2 = panel(s, "Scuba", 0.6, p1 + 0.2, W2, null, HEX.navy, HEX.navyTint, "SCUBAGEAR", null, [
    "CISA maps every SCuBA policy to SP 800-53 controls",
    "Where both fail, the ScubaGear finding carries the BOD 25-01 reporting",
  ], 12.5);
  const p3 = panel(s, "SH", 0.6 + W2 + G2, p1 + 0.2, W2, null, HEX.amber, HEX.amberTint, "AWS SECURITY HUB CSPM", null, [
    "Each finding lists related requirements, such as NIST.800-53.r5 AC-4",
    "Its NIST standard supports a subset, with automated checks only",
    "A control with no resources reports PASSED at the account level",
  ], 12.5);
  line(s, "Own", "Each tool sees only its own platform: none of them sees the others' gaps.", Math.max(p2, p3) + 0.15, 0.4, 13.5);
  sources(s, "Sources: Module 4, Unit 2; Guide, Step 9; Book 11, Ch 10; NIST SP 800-53 Rev. 5 in Security Hub CSPM; AWS Security Hub CSPM compliance status; CISA ScubaGear.");
  notes(s,
`Unit 2 reconciles. Tools with different identifiers can't be matched to each other directly. Instead, each is matched to a common spine: the setting itself, and the control it supports in NIST special publication eight hundred fifty-three. When two tools fail the same setting under the same control, that's one finding, with two pieces of evidence, routed to one owner. CISA maps every SCuBA policy to those controls, and where both fail, the ScubaGear finding is the directive's deviation and carries B O D twenty-five oh-one's reporting. On AWS, each Security Hub finding lists its related requirements, such as A C four, and that's the spine. Two cautions from AWS itself. Its NIST standard supports only a subset of the framework, with automated checks only. And a control with no corresponding resources reports passed at the account level, so a pass can mean nothing was evaluated. Each tool sees only its own platform.`,
  `${M} — Unit 2 "Reconciling with ScubaGear and Security Hub CSPM"; guide, Step 9; Book 11, Chapter 10 — "Reconcile at the control, not tool to tool"; AWS — "NIST SP 800-53 Revision 5 in Security Hub CSPM," "Evaluating compliance status and control status."`);
}

// ================================================================== 6 Each cloud's posture tool
{
  const s = content(SC, "Where agencies are: one posture tool per platform");
  tag(s, "Who");
  const tb = table(s, "Tools", 1.45, [3.3, 4.45, 4.4], ["Platform", "Posture tool on the spine", "Note"], [
    ["Microsoft 365 GCC and Azure", "Zero Trust Assessment; ScubaGear for Microsoft 365", "The workbook's baseline; ScubaGear is the BOD 25-01 tool"],
    ["AWS", "Security Hub CSPM, its NIST SP 800-53 Rev. 5 standard", "GovCloud (US): available, with limits on integrations, some controls and cross-Region aggregation"],
    ["Oracle Cloud Infrastructure", "Cloud Guard", "Book 12, Ch 08 compares it"],
    ["Google Cloud", "Security Command Center", "Book 12, Ch 08 compares it"],
  ], { fontSize: 12.5, limit: 4.8 });
  callout(s, "Spine", tb + 0.3, 1.0, "FaRoute", HEX.teal, "The same spine on every cloud: ",
    "each tool's finding, matched to the setting and the control, with one owner. The reconciliation table holds one row per control.");
  sources(s, "Sources: Module 4, Unit 2; Guide, Step 9, \"Government-cloud availability\"; Book 12, Ch 08; AWS Security Hub CSPM in AWS GovCloud (US).");
  notes(s,
`Where are agencies? Most run more than one platform, and each has its own posture tool on the same spine. For Microsoft three sixty-five G C C and Azure, the workbook's baseline, it's the Zero Trust Assessment, with ScubaGear as the directive's tool for Microsoft three sixty-five. On AWS, it's Security Hub, with its standard for NIST eight hundred fifty-three, revision five. In AWS GovCloud, Security Hub is available, with limits on product integrations, some controls, and cross-Region aggregation. On Oracle Cloud Infrastructure, it's Cloud Guard, and on Google Cloud, Security Command Center. The chapter on cloud-native posture in Security Operations and Telemetry compares those two, and how their findings enter the evidence contract. The rule is the same everywhere: each finding is matched to the setting and the control, with one owner, in one row of the reconciliation table.`,
  `${M} — Unit 2 (each tool sees its own platform; OCI and Google Cloud); guide, Step 9 ("The same spine on the other clouds," the reconciliation table), "Government-cloud availability"; Book 12, Chapter 08; AWS — "AWS Security Hub CSPM in AWS GovCloud (US)."`);
}

// ================================================================== 7 Cadence and package
{
  const s = content(SC, "Unit 3: the cadence and the evidence package");
  tag(s, "Who");
  const tb = table(s, "Cadence", 1.45, [3.6, 5.55, 3.0], ["When (design guidance)", "What", "Owner"], [
    ["Monthly", "Full run; results and the POA&M regenerated", "Operators; the ISSO"],
    ["After each remediation wave", "A run of the affected pillar, so a fix is closed by evidence", "The pillar owner"],
    ["Before a tool upgrade", "The new version in the test tenant, compared with the old", "Assessment operators"],
    ["Quarterly", "Trend review: which findings regress, which dispositions recur", "The ISSM"],
  ], { fontSize: 12, limit: 4.5 });
  panel(s, "Pkg", 0.6, tb + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "THE EVIDENCE PACKAGE FOR A RUN", null, [
    "The export and its hash; the normalized results; the dispositions; the reviews and exceptions with their hashes",
    "The register; the comparison; the chained records with SHA256SUMS",
  ], 12.5);
  sources(s, "Sources: Module 4, Unit 3; Guide, Step 10; Book 15, Ch 12 (cadence); Microsoft Learn, Operate Microsoft Entra Private Access (the digest playbook).");
  notes(s,
`Unit 3 is the cadence and the evidence package. The cadence is design guidance, from the day-two runbook in Compliance Automation and Day-2 Operations. Monthly, a full run, with the results and the plan of action and milestones regenerated. After each remediation wave, a run of the affected pillar, so a fix is closed by evidence, not by a ticket. Before a tool upgrade reaches production, a run of the new version in the test tenant. And quarterly, a trend review. Microsoft's operations guidance for Global Secure Access includes a weekly scheduled digest; the guide explains two cautions before adopting it as written. The evidence package for a run holds the export and its hash, the normalized results, the dispositions, the reviews and exceptions with their hashes, the register, the comparison, and the chained records with the S H A two fifty-six sums file.`,
  `${M} — Unit 3 "Cadence and the evidence package"; guide, Step 10 (the cadence table, the digest playbook, the evidence package); Book 15, Chapter 12; Microsoft Learn — "Operate Microsoft Entra Private Access."`);
}
endModule(SC);

// ================================================================== 8 Try it: compare
{
  const s = content(SL, "Try it: compare Module 3's two runs");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/zta-results, after Module 3's Lab 1",
    "$ ./Invoke-ZtaCompare.ps1 -PreviousPath out/run1 -CurrentPath out/run2 -OutputPath out/compare",
    "  new                     2",
    "  regressed               1",
    "  fixed                   3",
    "  still-open             12",
    "  no-longer-evaluated     2",
    "  changed                 2",
    "  unchanged              12",
    "$ (Get-Content -Raw out/compare/comparison.json | ConvertFrom-Json).rows | Where-Object change -In … | Format-Table …",
    "testId change              previous           current",
    "21783  regressed           Pass               Fail",
    "21860  no-longer-evaluated Fail               Skipped-Disconnected",
    "21941  new                 absent             Fail",
    "41032  no-longer-evaluated Fail               Skipped-Disconnected",
    "41050  new                 Unable-to-Evaluate Fail",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (THE SAME AS THE PAGE; … SHORTENS A COMMAND)", pt: 10.5 });
  line(s, "Read", "The second run lost its Azure and Exchange connections: 21860 and 41032 weren't evaluated, not fixed. 41050 is new because run 1 timed out.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 1 and 2; examples/zta-results: Invoke-ZtaCompare.ps1, tests/fixtures/run-2026-11-10.");
  notes(s,
`Try it. Lab 1 picks up Module 3's two runs. Step one compares them: two new, one regressed, three fixed, twelve still open, two no longer evaluated, two changed, and twelve unchanged. Step two lists the ones to look at. Two one seven eight three regressed, from pass to fail. Two one nine four one is new: it wasn't in the first run at all. Now the two no longer evaluated. Two one eight six oh and four one oh three two both failed last time, and this time they were skipped as disconnected. The second run lost its Azure and Exchange connections. Those findings aren't fixed; they still need a run that connects. And four one oh five oh shows as new only because the first run timed out on it, not because something broke. The slide shortens step two's command; the page has it in full.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2.`);
}

// ================================================================== 9 Try it: seal and check
{
  const s = content(SL, "Try it: seal the second run and check the package");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 3 and 4: three records, one per output folder (the first command shown; the others name",
    "# out/run2-register and out/compare, at 20:01 and 20:02)",
    "$ ./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -RunPath out/run2 -AsOf 2026-11-10T20:00:00Z",
    "Record 1: Pass (NORMALIZE, EVIDENCE)",
    "Controls: AU-9, CA-2, CA-7, CM-6",
    "Record 2: Pass (REGISTER, EVIDENCE)",
    "Controls: AU-9, CA-5, CA-7, RA-7",
    "Record 3: Pass (COMPARE, EVIDENCE)",
    "Controls: AU-9, CA-7, CM-6",
    "$ ./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -Check -Package re-run -RunDate 2026-11-10",
    "SUMS             Pass  16 files match SHA256SUMS",
    "CHAIN            Pass  3 records, chain unbroken",
    "STEP-NORMALIZE   Pass  a passing record covers it for 2026-11-10",
    "STEP-REGISTER    Pass  a passing record covers it for 2026-11-10",
    "STEP-COMPARE     Pass  a passing record covers it for 2026-11-10",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (THE KSI AND WRITTEN-TO LINES OMITTED)", pt: 10.5 });
  line(s, "Read", "Each record holds its controls, every file's hash and the previous record's hash; the ISSO checks it with sha256sum -c SHA256SUMS.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 3 and 4; Guide, Step 10, step 2; examples/zta-results: Invoke-ZtaEvidence.ps1.");
  notes(s,
`Step three seals the second run's evidence. Each output folder becomes a record: the normalized run, the register, and the comparison, one after another. Each record names the controls its folder supports. The normalized run supports A U nine, C A two, C A seven and C M six; the register adds C A five and R A seven; the comparison supports A U nine, C A seven and C M six. Each record also holds every file's hash and the previous record's hash, so the records form a chain. Step four checks the package: sixteen files match the sums file, the chain of three records is unbroken, and a passing record covers each step for the run date. The I S S O doesn't need the kit to check this. In a POSIX shell, in the evidence folder, the standard sha two fifty-six sum check reads the same sums file.`,
  `${M} — "Exercise: Lab 1," steps 3 and 4; guide, Step 10, step 2 (the ISSO's check).`);
}

// ================================================================== 10 Try it: break it
{
  const s = content(SL, "Try it: break the seal on purpose");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 5: edit one file in the sealed package, and check again",
    "$ Add-Content -Path out/evidence/runs/0002-register-2026-11-10/register.csv -Value 'edited'",
    "$ ./Invoke-ZtaEvidence.ps1 -EvidencePath out/evidence -Check",
    "SUMS             Fail  runs/0002-register-2026-11-10/register.csv changed",
    "CHAIN            Fail  runs/0002-register-2026-11-10/register.csv doesn't match 0002-register-2026-11-10.json",
    "# Step 6: clean up",
    "$ Remove-Item -Recurse -Force out",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (THE SAME AS THE PAGE)", pt: 11 });
  const l = panel(s, "Sums", 0.6, c + 0.3, W2, null, HEX.red, HEX.redTint, "SUMS FAILS", null, [
    "The file no longer matches the hash in SHA256SUMS",
  ], 13);
  const r = panel(s, "Chain", 0.6 + W2 + G2, c + 0.3, W2, null, HEX.navy, HEX.navyTint, "CHAIN FAILS", null, [
    "The file no longer matches the hash its record holds",
  ], 13);
  callout(s, "Months", Math.max(l, r) + 0.3, 0.95, "FaShieldHalved", HEX.teal, "Months later: ",
    "an assessor can show the files are the ones the tool and the kit wrote, or see exactly which one isn't.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 5 and 6; examples/zta-results: Invoke-ZtaEvidence.ps1.");
  notes(s,
`Step five breaks the seal on purpose. Add one line, the word edited, to the register file inside the sealed package, and check again. Two checks fail, and each says why. The sums check fails because the register file no longer matches its hash in the sums file. The chain check fails because the file no longer matches the hash its record holds. That's the point of sealing. Months later, an assessor can show that the files are the ones the tool and the kit wrote, or see exactly which one isn't. Step six cleans up: delete the out folder. In a real program, the sealed folder lives in the evidence repository, and retention follows the records officer's schedule.`,
  `${M} — "Exercise: Lab 1," steps 5 and 6; guide, Step 10 (retention).`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: a second run in your test tenant");
  tag(s, "How");
  const c = code(s, "Lab2", 0.6, 1.45, 12.15, [
    "# Step 1: make one change a Module 3 register entry points to, through its remediation page, under a change record",
    "# Step 2: re-run the assessment and normalize it",
    "New-Item -ItemType Directory -Path <report-folder-2>",
    "Invoke-ZtAssessment -Path <report-folder-2> -DisableTelemetry -NoBrowser",
    "./Invoke-ZtaNormalize.ps1 -ExportPath <report-folder-2> -OutputPath out/lab2-run2",
    "./Invoke-ZtaRegister.ps1 -RunPath out/lab2-run2 -OutputPath out/lab2-run2-register",
    "# Step 3: compare and seal (then seal -register and -compare, and -Check, as in Lab 1)",
    "./Invoke-ZtaCompare.ps1 -PreviousPath out/lab2 -CurrentPath out/lab2-run2 -OutputPath out/lab2-compare",
    "./Invoke-ZtaEvidence.ps1 -EvidencePath <evidence-folder> -RunPath out/lab2-run2",
    "# Step 4 (optional, an AWS test account): aws securityhub get-findings --region <region> --filters …",
    "# Step 5: back it out",
    "Remove-Item -Recurse -Force out, <report-folder-2>",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS  ·  SHORTENED: THE PAGE HAS EVERY COMMAND", pt: 10.5 });
  callout(s, "Fixed", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "What to look for: ",
    "the finding you fixed shows as fixed. If it shows as no-longer-evaluated, the second run didn't connect to the service that test reads.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 2\"; Guide, Steps 9 and 10; AWS Security Hub CSPM compliance status.");
  notes(s,
`Lab 2 makes one real change and proves it with evidence, in your test tenant, never production. The authors haven't run it. Step one: make one change that a finding in Module 3's Lab 2 register points to, through the page its remediation field names, under a change record. Step two: re-run the assessment into a new folder, then normalize it and write its register. Step three: compare it with the first run, seal all three output folders, and check the package. The finding you fixed should show as fixed. If it shows as no longer evaluated, the second run didn't connect to the service that test reads. Step four is optional: where you have an AWS test account with Security Hub and its NIST standard enabled, pull its active findings, and add one row to the reconciliation table. Step five backs it out. The slide shortens the lab; the page lists every command.`,
  `${M} — "Exercise: Lab 2, a second run in your test tenant," steps 1 to 5.`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 4");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 3.0, 3.55], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["CA-7: assessment at a defined frequency, changes between runs analyzed; correlation across tools", "KSI-MLA-EVC, KSI-SVC-ACM", "Each comparison.json; the reconciliation table"],
    ["AU-9 and AU-11: evidence protected and kept", "KSI-MLA-OSM, KSI-SVC-VRI", "records/, records.csv, SHA256SUMS, the exports"],
    ["CA-5: the POA&M regenerated from each run", "None listed", "The register and the POA&M items"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. Keep it by the records schedule; the program's default for assessment evidence is three years.");
  sources(s, "Sources: Module 4, \"The federal requirement,\" \"Summary\"; Guide, Steps 9 and 10; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; Book 11, Ch 09.");
  notes(s,
`The federal requirement, in NIST special publication eight hundred fifty-three, revision five. C A seven, continuous monitoring: assessment at a defined frequency, with the changes between runs analyzed, and results correlated across tools. The evidence is each comparison and the reconciliation table. A U nine and A U eleven: the evidence protected and kept. That's the records, the sums file and the exports. And C A five: the plan of action and milestones regenerated from each run, from the register. No key security indicator is listed for that one. The evidence supports the controls; the assessor decides. Retention follows the records officer's schedule; the program's default for assessment evidence, in Zero Trust and Assessment, is three years.`,
  `${M} — "The federal requirement" table; "Summary"; guide, Steps 9 and 10 (requirements and evidence, retention); Book 11, Chapter 09.`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on Module 4", [
    { q: "A finding Failed last month and is Skipped-Disconnected this month. What is it?", options: ["a. Fixed", "b. No longer evaluated: not fixed; fix the run's connection and re-run", "c. A new finding"] },
    { q: "A Security Hub CSPM control reports PASSED at the account level. What should you check?", options: ["a. Nothing; PASSED is a pass", "b. Whether any resource corresponds to the control: AWS produces an account-level PASSED when none does", "c. Whether the Zero Trust Assessment also passed"] },
  ], "1 b: a lost connection isn't remediation. 2 b: read a pass with the resource inventory.");
  sources(s, "Sources: Module 4, \"Knowledge check,\" questions 1 and 3; Units 1 and 2; Guide, Step 9; AWS Security Hub CSPM compliance status.");
  notes(s,
`Check yourself with two questions. First: a finding failed last month, and this month it's skipped, disconnected. What is it? The answer is b: no longer evaluated. It's not fixed. Fix the run's connection, and run it again. Second: a Security Hub control reports passed at the account level. What should you check? The answer is b: whether any resource corresponds to the control, because AWS produces an account-level pass when none does. Read the pass with the resource inventory. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 3, and "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: you've finished the path");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Compared two runs, and told a fix from a lost connection",
    "Reconciled across tools through the control",
    "Set a cadence",
    "Sealed, checked and broke an evidence package",
  ], 13.5);
  const r = panel(s, "Path", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "THE PATH", "Four modules, about 3 hours", [
    "With each module's Lab 1; Lab 2 isn't counted",
    "Back to the guide for the ten steps",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "each comparison, the reconciliation table, and the chained records with SHA256SUMS and the exports, by the records schedule.");
  sources(s, "Sources: Module 4, \"Summary\"; learning path index; Zero Trust Assessment: An Implementation Guide.");
  notes(s,
`To sum up. You compared two runs, and told a fix from a lost connection. You reconciled across tools through the setting and the control, on every platform the agency runs. You set a cadence. And you sealed, checked and broke an evidence package. The evidence an I S S O keeps from this module: each comparison, the reconciliation table, and the chained records with the sums file and the exports, by the records schedule. That finishes the learning path, The Zero Trust Assessment as Evidence: four modules, about three hours with each module's Lab 1. Lab 2, in your own test tenant, isn't counted, because a full run on a large tenant can take more than a day. For the ten steps in one place, go back to the Zero Trust Assessment implementation guide. Thank you.`,
  `${M} — "Summary," "Continue the path"; learning path index ("Total time").`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/zero-trust-assessment/04-reconcile-re-run-and-keep-the-evidence.md (The Zero Trust Assessment as Evidence, Module 4), a draft awaiting review; the path's verification log is docs/training/zero-trust-assessment/_verification/learning-path.md.",
  "Zero Trust Assessment: An Implementation Guide, Step 9 (the spine, ScubaGear, Security Hub CSPM, other clouds) and Step 10 (compare, seal, cadence, the evidence package, retention), \"Government-cloud availability\"; its footnotes, read November 11, 2026.",
  "AWS: NIST SP 800-53 Rev. 5 in Security Hub CSPM; AWS Security Hub CSPM compliance status; AWS Security Hub CSPM in AWS GovCloud (US). CISA BOD 25-01; CISA ScubaGear. Microsoft Learn, Operate Microsoft Entra Private Access (the scheduled digest playbook).",
  "Book 11, Chapter 09 (retention) and Chapter 10 (Reconcile at the control); Book 12, Chapter 08 (posture tools on other clouds, including Oracle Cloud Infrastructure Cloud Guard); Book 15, Chapter 12 (cadence). NIST SP 800-53 Rev. 5 (CA-5, CA-7, AU-9, AU-11); FedRAMP 20x KSIs, as Book 13, Appendix A maps them.",
  "Lab output: examples/zta-results (Invoke-ZtaCompare.ps1, Invoke-ZtaEvidence.ps1, the out folder from Module 3's Lab 1), run November 12, 2026 with PowerShell 7.6, the same as the page; trimmed where the slides say so. Lab 2 not run by the authors.",
]);

finish(OUT);
