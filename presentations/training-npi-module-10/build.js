// Non-Person Identity learning path, Module 10: Find drift and file the evidence — the module's narrated deck.
// Teaches docs/training/non-person-identity/10-drift-and-evidence.md, Learn-style: objectives, the concepts, five
// "Try it" slides with the real Lab 1 commands and output (run November 3, 2026: steps 1 to 6 in a scratch copy of
// examples/non-person-identity in PowerShell 7, steps 7 to 10 in a scratch copy of examples/drift-pipeline in Git Bash,
// and the pytest suite in the repository), Lab 2, the federal requirement and evidence, a two-question check, and the
// summary. Every fact comes from the module page, the path's verification log, the guide's Step 6 and Evidence
// section and workbook Chapter 10 that the page sends the learner to, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-10/build.js \
//                      presentations/training-npi-module-10/Training_NPI_Module_10.pptx
const TITLE = "Module 10: Find drift and file the evidence";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 10: Find drift and file the evidence",
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
const OUT = process.argv[2] || "Training_NPI_Module_10.pptx";
const M = "Training, Non-Person Identity, Module 10";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 10: Find drift and file the evidence", "Non-Person Identity learning path · Gate G6 Lifecycle, with workbook Chapter 10",
    ["Why drift  ·  The approved baseline  ·  The drift rules  ·  Reviews and vintages", "The package and the chain  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 10 of the Non-Person Identity learning path: find drift and file the evidence. This module is Gate 6, Lifecycle, with Chapter 10 of the developer workbook. You'll run two days of drift against a baseline a reviewer approved, compare two years of the A I use-case inventory, package both days with a hash for every file, chained, verify a package with a standard checksum tool, and assemble a period for the ISSO. Then you'll break it on purpose, and watch the checks refuse. If you're an ISSO reviewer, this module is yours in full. The code runs on your laptop against fixtures, in PowerShell and in Python. It's illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index — "If you're an ISSO reviewer."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why every gate's state has to be kept true");
  tag(s, "Why");
  const l = panel(s, "Drift", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "DRIFT", "Against a baseline someone approved", [
    "Every gate before this one ends in a state: an owner, a target, a credential, a scope",
    "A credential added by hand, a new consent grant, an app unused for 90 days, an owner who left: all drift",
  ], 13);
  const r = panel(s, "Evidence", 6.85, 1.45, 5.9, null, HEX.navy, HEX.navyTint, "EVIDENCE", "Trusted without trusting you", [
    "Each run packaged with a SHA-256 for every file, and chained to the one before",
    "The ISSO checks a package with sha256sum alone",
    "A period summary shows the checks ran every day, with no gap",
  ], 13);
  sources(s, "Sources: Module 10, \"Introduction\"; Microsoft Learn, Remove unused applications; Entra security operations guide for applications.");
  notes(s,
`Why does this module come at the end? Because every gate before it ends in a state: an owner, a target, a credential, a scope. This module keeps that state true. A credential added by hand, a new consent grant, an app nobody has used in ninety days, which is Microsoft Learn's threshold for an unused app, or an owner who left: each one shows up as drift, against a baseline someone approved. Then the evidence has to reach the ISSO in a form they can trust without trusting you. Each run is packaged with a hash for every file, and chained to the run before. The ISSO checks a package with the standard checksum tool alone. And a period summary shows whether the checks ran every day, with no gap.`,
  `${M} — Unit "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 10", [
    "Explain why the drift run compares with a baseline only when a reviewer approved its SHA-256",
    "Read the drift findings, and say when a credential counts as added inside the pipeline",
    "Compare two AI use-case inventory vintages against the register",
    "Package two runs, chained, verify one with sha256sum, and assemble a period for the ISSO",
    "Show that an edited file and a package chained out of order are both refused",
  ], [
    "Modules 1 and 2: the drift run runs Chapters 01 and 02 unchanged",
    "Module 4: the credential log decides what's inside the pipeline",
    "Module 9: sponsor attestations and the vintage",
    "Lab 1: PowerShell 7 with Pester 5; Python 3.10+ with pytest and PyYAML; sha256sum",
  ], 75);
  sources(s, "Sources: Module 10, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about seventy-five minutes with the lab. You'll explain why the drift run compares with a baseline only when a reviewer approved its hash. You'll read the drift findings, and say when a credential counts as added inside the pipeline. You'll compare two vintages of the A I use-case inventory against the register. You'll package two runs, chained, verify one with the checksum tool, and assemble a period for the ISSO. And you'll show that an edited file and a package chained out of order are both refused. Before you start: Modules 1 and 2, because the drift run runs their code unchanged; Module 4, for the credential log; and Module 9. Lab 1 also needs Python with pytest and PyYAML, and a shell with sha two fifty-six sum.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Unit 1: the gate and the evidence
{
  const s = content(SC, "The gate: run the lifecycle, and file the output");
  tag(s, "What");
  const l = panel(s, "Step6", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE GUIDE'S STEP 6", "Run the lifecycle", [
    "Owner change",
    "Orphans",
    "Access reviews of owners",
    "Decommissioning: disable first, then delete",
  ], 13.5);
  const r = panel(s, "Ev", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE GUIDE'S EVIDENCE SECTION", "File every run", [
    "Run the checks on the continuous monitoring cadence",
    "File their output with the date, the tenant and the check version",
  ], 13.5);
  callout(s, "Req", Math.max(l, r) + 0.3, 0.95, "FaClipboardCheck", HEX.navy, "Validate (G6) names ",
    "AC-2(3), AC-6(7), AU-6 and CA-7, with KSIs KSI-IAM-AAM, KSI-MLA-RVL and KSI-MLA-EVC.");
  sources(s, "Sources: Module 10, Unit 1; the guide, Step 6, Validate (G6) and \"Evidence\"; NIST SP 800-53 Rev. 5; FedRAMP, Key Security Indicators.");
  notes(s,
`Unit 1 is the guide's Step 6, run the lifecycle, which has four parts: owner change, orphans, access reviews of owners, and decommissioning, which disables first and deletes only afterward. In the program's guidance, a non-person identity's events come from its owning system and from credential expiry, not from HR. Then the guide's Evidence section adds the program's rule this module turns into code: run the checks on the continuous monitoring cadence, and file their output with the date, the tenant and the check version. The guide's validate step for Gate 6 names NIST special publication eight hundred fifty-three controls A C two, enhancement three; A C six, enhancement seven; A U six; and C A seven. The FedRAMP K S I's it lines up with are K S I I A M A A M, K S I M L A R V L and K S I M L A E V C.`,
  `${M} — Unit 1 "The gate and the evidence"; the guide — Step 6, Validate (G6 Lifecycle), "Evidence."`);
}

// ================================================================== 5 The run and the baseline
{
  const s = content(SC, "One run, and a baseline that counts only when approved");
  tag(s, "What");
  const l = panel(s, "Run", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "INVOKE-NPIDRIFTRUN.PS1", "One folder per run", [
    "Chapter 01's inventory and Chapter 02's ownership check, unchanged, plus a drift folder",
    "run.json ties them together, with each task's manifest hash",
    "A task that fails is recorded as an error, never as an empty result",
  ], 12.5);
  const r = panel(s, "Base", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE BASELINE  ·  DESIGN GUIDANCE", "A fingerprint per identity", [
    "A SHA-256 over 20 governance columns: owners, credentials, permissions, grants and more",
    "Last logon and password age left out: they move daily",
    "Counts only when passed with its approved SHA-256, for this tenant and cloud",
  ], 12.5);
  callout(s, "Who", Math.max(l, r) + 0.3, 0.85, "FaUserCheck", HEX.amber, "In a real run, ",
    "a second person reviews the baseline candidate and passes you its hash.");
  sources(s, "Sources: Module 10, Unit 2; Lab 1, step 4; the kit's design and the program's design guidance, in workbook Chapter 10, \"The approved baseline.\"");
  notes(s,
`Unit 2 starts with what the evidence has to show: state, events and drift. The run and the baseline are the kit's design. One run writes one folder. It holds Chapter 1's inventory and Chapter 2's ownership check, unchanged, plus this chapter's drift folder, and a run record that ties them together by each task's manifest hash. A task that fails is recorded as an error, never as an empty result, so a failed read can't look like a fix. The baseline, the program's design guidance, is a fingerprint per identity: a hash over twenty governance columns, such as owners, credentials, permissions and grants. Last logon and password age are left out, because they move every day and aren't drift. And the baseline counts only when it's passed with the hash a reviewer approved, for this tenant and cloud. In a real run, a second person reviews it.`,
  `${M} — Unit 2 "Drift against an approved baseline": workbook Chapter 10, "What the evidence has to show," "The approved baseline."`);
}

// ================================================================== 6 Drift rules
{
  const s = content(SC, "The drift findings: NPI-DRF-01 to NPI-DRF-09");
  tag(s, "What");
  const b = table(s, "DRF", 1.45, [1.7, 1.9, 8.55], ["Rule", "Severity", "What it flags"], [
    ["NPI-DRF-01, 02", "Warn", "An identity new since the baseline; a changed fingerprint, with its columns"],
    ["NPI-DRF-03", "Finding", "Ownerless: an orphan candidate in Chapter 02's run; this code disables nothing"],
    ["NPI-DRF-04, 05", "Warn", "No sign-in for over 90 days; a credential that expires within 30 days"],
    ["NPI-DRF-06", "Finding", "An enabled AD account whose password never expires"],
    ["NPI-DRF-07", "Finding", "A credential added outside the pipeline, one per key"],
    ["NPI-DRF-08", "Finding / Warn", "A new consent grant or app permission; Finding when tenant-wide or high-privilege"],
    ["NPI-DRF-09", "Warn / Info", "An evidence gap, reported, never treated as a pass"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Pipe", b + 0.25, 0.95, "FaKey", HEX.red, "Inside the pipeline only when ",
    "the initiator is a listed pipeline identity and the target and key ID are in the rotation pipeline's credential log.");
  sources(s, "Sources: Module 10, Unit 2; Microsoft Learn, Remove unused applications; Renew expiring application credentials; security operations guide for applications.");
  notes(s,
`Nine drift rules run against the approved baseline. New and changed identities are warnings, with the exact columns that changed. Ownerless identities are findings: orphan candidates in Chapter 2's run, and this code disables nothing. An app with no sign-in for over ninety days, or a credential that expires within thirty, is a warning; both numbers are Microsoft Learn's, from its recommendations to remove unused applications and renew expiring credentials. An enabled directory account whose password never expires is a finding. So is a credential added outside the pipeline, one per key: Microsoft Learn's security operations guide for applications rates a credential added to an existing app as high risk. A new consent grant or app permission is a warning, or a finding when it's tenant-wide or high privilege. And the ninth is the honest one: an evidence gap is reported, never treated as a pass. The key rule, the program's design guidance: a credential counts as inside the pipeline only when two independent records agree, the listed pipeline identity and the rotation pipeline's credential log.`,
  `${M} — Unit 2 "Drift against an approved baseline": workbook Chapter 10, "The register drift findings"; Knowledge check, answers 2 and 3.`);
}

// ================================================================== 7 Reviews and vintages
{
  const s = content(SC, "The review cycle, and the annual vintage comparison");
  tag(s, "What");
  const l = panel(s, "Rev", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE REVIEW CYCLE  ·  NPI-REV-01 TO -04", "Reads the review records", [
    "An app holding Graph permissions with no owners' review in 92 days",
    "An agent with no sponsor attestation in 365 days; agent access with no end date",
    "A kind of review record not received: missing isn't passed",
  ], 12.5);
  const r = panel(s, "Vin", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE VINTAGE  ·  NPI-VIN-01 TO -05", "This year's AI inventory against last year's", [
    "A new piloted or deployed entry with no identity",
    "An entry retired while its identities are still enabled",
    "A changed authorization answer; an entry that left unreported",
  ], 12.5);
  sources(s, "Sources: Module 10, Unit 2; the program's design guidance; Microsoft Learn, Best practices for Microsoft Entra Agent ID. Chapter 10, \"The review cycle.\"");
  notes(s,
`Two more kinds of evidence sit beside the drift. The review cycle reads the review records that Chapters 7 and 9 build; this chapter doesn't run the reviews, it reads their records. Following the program's design guidance, it flags an app holding Graph permissions whose owners haven't reviewed it in ninety-two days, and agent access with no end date. And it flags an agent with no sponsor attestation in a year; Microsoft Learn's best practices for Agent I D say every six to twelve months. And a kind of review record that never arrived is a warning, because a missing record isn't a passed review. Then once a year, the program's vintage comparison checks this year's A I use-case inventory against last year's, by use case. It catches a new piloted or deployed system with no identity, a retired one whose identities are still enabled, a changed authorization answer, and an entry that left the inventory without being reported retired.`,
  `${M} — Unit 2 "Drift against an approved baseline": workbook Chapter 10, "The review cycle," "The annual vintage comparison."`);
}

// ================================================================== 8 Package, chain, ISSO
{
  const s = content(SC, "What the ISSO receives: the package, chain, period");
  tag(s, "What");
  const b = table(s, "Pkg", 1.45, [3.0, 9.15], ["Piece", "What it holds"], [
    ["The package", "The run, a summary.md with rule IDs and fingerprints but no names, EVIDENCE-MANIFEST.json and SHA256SUMS"],
    ["Before it writes", "The packager checks the run end to end: every manifest by hash, nothing extra, one tenant and cloud"],
    ["The chain", "Each package records the previous package's manifest hash: a replaced package or a missing day is a break"],
    ["The period", "Verifies every package, checks chain and coverage, and maps findings to each control"],
    ["No signing", "Hashes, plus a locked time-based retention policy on the evidence store"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Status", b + 0.3, 0.95, "FaFileShield", HEX.teal, "Each control's status: ",
    "\"evidence present; the assessor decides\" or \"evidence incomplete.\" The mapping is the program's and decides nothing.");
  sources(s, "Sources: Module 10, Unit 3; the kit's design; Microsoft Learn, immutable storage for blob data (WORM). Chapter 10, \"The package and the chain.\"");
  notes(s,
`Unit 3 is what the ISSO receives. Each run is packaged: the run itself, a summary with rule I D's and fingerprints but no names, an evidence manifest, and a checksum file anyone can verify with the standard tool. Before it writes anything, the packager checks the run end to end: every manifest by its hash, nothing extra, one tenant and one cloud. Each package records the previous package's manifest hash, so the packages form a chain, and a replaced package or a missing day shows up as a break. Then the period verifies every package, checks the chain and coverage, and maps findings to each control. There's no signing, by the kit's design: hashes, plus a locked time-based retention policy on the evidence store, the write once, read many storage Microsoft Learn documents for blob data. Each control reads either evidence present, the assessor decides, or evidence incomplete. The control mapping is the program's design guidance.`,
  `${M} — Unit 3 "What the ISSO receives": workbook Chapter 10, "The package and the chain," "What the ISSO receives."`);
}
endModule(SC);

// ================================================================== 9 Try it: steps 1-4
{
  const s = content(SL, "Try it: the rule, the permissions, two days of runs");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Steps 1 to 4, in examples/non-person-identity, in PowerShell 7 (commands on the module page)",
    "PassedCount 11   FailedCount 0   NotRunCount 40",
    "Application.Read.All, AuditLog.Read.All, Directory.Read.All, User.Read.All",
    "# Step 3: the first day, with no baseline",
    "Run 2026-10-29T0600Z-fixture (Fixture, gcc): inventory OK, ownership OK, drift OK",
    "Audit window 2026-10-28T06:00:00Z to 2026-10-29T06:00:00Z; baseline none: this run is a baseline candidate",
    "Drift findings: 14 Finding, 4 Warn, 5 Info; baseline candidate SHA-256 604ee088ae43a964072671234833aeb7...",
    "# Step 4: approve the baseline (its SHA-256) and run the second day",
    "Run 2026-10-30T0600Z-fixture (Fixture, gcc): inventory OK, ownership OK, drift OK",
    "Audit window 2026-10-29T06:00:00Z to 2026-10-30T06:00:00Z; baseline 2026-10-29T0600Z-fixture (604ee088ae43…)",
    "Drift findings: 18 Finding, 11 Warn, 5 Info; baseline candidate SHA-256 fbe346457c070d6bb7de0fbb43f35d54...",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "Four read permissions, nothing ending in ReadWrite. Day two compares with the baseline day one wrote.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 10, \"Exercise: Lab 1,\" steps 1 to 4; Microsoft's Sentinel rule NewAppOrServicePrincipalCredential, pinned; examples/non-person-identity.");
  notes(s,
`Try it. Steps one to six run in the non-person identity folder of the examples, in PowerShell 7. Step one runs Microsoft's Sentinel rule for new app credentials, the one Microsoft Learn's security operations guide for applications links, over the fixture: eleven tests pass, none fail, and forty of the file's other tests aren't run. Step two lists what the run needs: four Graph read permissions, Application, AuditLog, Directory and User dot Read dot All. Nothing ends in ReadWrite. Step three runs the first day, the twenty-ninth of October, with no baseline. Inventory, ownership and drift all report OK, and the run becomes a baseline candidate, with fourteen findings, four warnings and five information items, and its hash. Step four approves that baseline by its hash and runs the second day. It compares with the first day's baseline, and the drift appears: eighteen findings and eleven warnings.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 4.`);
}

// ================================================================== 10 Try it: drift and vintage
{
  const s = content(SL, "Try it: read the drift, and compare the vintages");
  tag(s, "How");
  const c = code(s, "Drift", 0.6, 1.45, 8.0, [
    "# Step 5: day two's findings, Group-Object Rule, Severity",
    "Name                Count",
    "NPI-DRF-01, Warn        2",
    "NPI-DRF-02, Warn        6",
    "NPI-DRF-03, Finding     7",
    "NPI-DRF-04, Warn        2",
    "NPI-DRF-06, Finding     3",
    "NPI-DRF-07, Finding     3",
    "NPI-DRF-08, Finding     1",
    "NPI-DRF-09, Info        5",
    "NPI-DRF-09, Warn        1",
    "NPI-REV-01, Finding     2",
    "NPI-REV-02, Finding     1",
    "NPI-REV-03, Finding     1",
    "# Step 6: ./Invoke-NpiVintage.ps1 ... -Vintage 2026 ...",
    "Vintage 2026: 5 changes (1 AuthorizationChanged, 1 Left,",
    "  2 New, 1 Retired); findings 3 Finding, 2 Warn, 1 Info",
  ], { label: "LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 10.5 });
  panel(s, "Read", 8.85, 1.45, 3.9, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "Twelve rows",
    "NPI-DRF-07: three credentials added outside the pipeline",
    "The pipeline's two certificate rotations aren't there",
    "NPI-DRF-08: Mail Automation's new grant for all users",
  ], 12.5);
  sources(s, "Sources: Module 10, \"Exercise: Lab 1,\" steps 5 and 6; examples/non-person-identity/tests/fixtures/ch10 (fictional tenant).");
  notes(s,
`Step five reads day two's drift, grouped by rule and severity: twelve rows. N P I D R F oh seven, three findings, holds the three credentials added outside the pipeline. Notice what isn't there: the pipeline's own two certificate rotations. Both were made by a listed pipeline identity and are in the credential log, so the two records agree. N P I D R F oh eight, one finding, is Mail Automation's new grant for all users. You'll also see seven ownerless identities, three enabled accounts whose passwords never expire, and the review cycle's findings. Step six compares the A I use-case inventory's 2026 vintage with 2025's, against the register. Five changes: one authorization changed, one entry left, two new and one retired, for three findings, two warnings and one information item.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 and 6.`);
}

// ================================================================== 11 Try it: package and verify
{
  const s = content(SL, "Try it: package both days, chained, and verify");
  tag(s, "How");
  const c = code(s, "Pkg", 0.6, 1.45, 12.15, [
    "# Step 7, in a POSIX shell at the root of your copy of the repository",
    "$ cd examples/drift-pipeline",
    "$ python python/npi_evidence.py package --run $DAY1 --out out/evidence",
    "{\"evidence_manifest_sha256\": \"574efc05...\", \"new\": 62, \"open\": 62, \"package\": \"2026-10-29T0600Z-fixture\", \"resolved\": 0}",
    "$ python python/npi_evidence.py package --run $DAY2 \\",
    "    --previous-manifest out/evidence/2026-10-29T0600Z-fixture/EVIDENCE-MANIFEST.json --out out/evidence",
    "{\"evidence_manifest_sha256\": \"35993595...\", \"new\": 19, \"open\": 80, \"package\": \"2026-10-30T0600Z-fixture\", \"resolved\": 1}",
    "# Step 8: verify the second package three ways",
    "$ python python/npi_evidence.py verify out/evidence/2026-10-30T0600Z-fixture",
    "{\"evidence_manifest_sha256\": \"35993595...\", \"files\": 21, \"run_id\": \"2026-10-30T0600Z-fixture\"}",
    "$ (cd out/evidence/2026-10-30T0600Z-fixture && sha256sum -c --quiet SHA256SUMS)",
    "$ grep -c contoso out/evidence/2026-10-30T0600Z-fixture/summary.md",
    "0",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS; WRAPPED)", pt: 10.5 });
  line(s, "Read", "sha256sum prints nothing and exits 0; grep finds no user principal name in the summary.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 10, \"Exercise: Lab 1,\" steps 7 and 8; examples/drift-pipeline (python/npi_evidence.py; tests/fixtures/npi-runs).");
  notes(s,
`Step seven switches to a second shell, a POSIX shell at the root of your copy of the repository, and moves into the drift pipeline folder. The runs it packages are the repository's copies of the two days you just made. Package day one, then day two, chained to day one's manifest. Each prints one line of JSON. The second says nineteen findings are new, eighty are open, and one is resolved. Step eight verifies the second package three ways. The packager's own verify reports twenty-one files. The standard checksum tool, run against the checksum file, prints nothing and exits zero. And a search of the summary for the fictional tenant's domain counts zero: no user principal name is in the summary. That's the check an ISSO can run with nothing but standard tools.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 7 and 8; learning path verification log — claim 12.`);
}

// ================================================================== 12 Try it: period
{
  const s = content(SL, "Try it: assemble the period for the ISSO");
  tag(s, "How");
  const c = code(s, "Period", 0.6, 1.45, 12.15, [
    "# Step 9: the period, with the vintage",
    "$ python python/npi_evidence.py period --evidence out/evidence --since 2026-10-28T06:00:00Z \\",
    "    --until 2026-10-30T06:00:00Z --vintage tests/fixtures/npi-vintage/vintage-2026 --out out/periods",
    "{\"chain_breaks\": 0, \"closed\": 1, \"complete\": false, \"coverage_gaps\": 0, \"opened\": 19, \"packages\": 2, ...}",
    "$ cat out/periods/period-2026-10-28_2026-10-30/period-summary.md      (the controls table)",
    "| AC-2 Account Management                      | 20 | 15 | evidence incomplete: Chapter 03 |",
    "| AC-6(5) Least Privilege, Privileged Accounts | 12 |  2 | evidence present; the assessor decides |",
    "| IA-4 Identifier Management                   | 11 |  3 | evidence present; the assessor decides |",
    "| IA-5 Authenticator Management                |  6 |  8 | evidence incomplete: Chapter 04, Chapter 06 |",
    "| IA-9 Service Identification and Authentication | 3 | 0 | evidence incomplete: Chapter 05, Chapter 08 |",
    "| M-25-21 AI use-case inventory and governance (OMB) | 5 | 3 | evidence present; the assessor decides |",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS; WRAPPED)", pt: 10.5 });
  line(s, "Read", "It exits 2: complete is false, because some chapters haven't sent their findings. No chain break, no gap.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 10, \"Exercise: Lab 1,\" step 9; Knowledge check, answer 5; examples/drift-pipeline (python/npi_evidence.py).");
  notes(s,
`Step nine assembles the period for the ISSO, from the twenty-eighth to the thirtieth of October, with the A I inventory's vintage. It exits two. The chain has no breaks and no coverage gaps, across two packages, with nineteen findings opened and one closed. But complete is false. The summary's controls table shows why: some chapters haven't sent their findings. A C two is evidence incomplete without Chapter 3's findings. I A five waits on Chapters 4 and 6, and I A nine on Chapters 5 and 8. The other controls read evidence present, the assessor decides. That's honest: an incomplete period says so, instead of passing. The summary also has a table for the project plan's Gate 7, steady state, which the guide's G 6 covers, and a row for each package with its manifest hash. The identity governance officer signs it.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 9; Knowledge check, answer 5; Summary.`);
}

// ================================================================== 13 Try it: break it
{
  const s = content(SL, "Try it: break it on purpose, then run the tests");
  tag(s, "How");
  const c = code(s, "Break", 0.6, 1.45, 12.15, [
    "# Step 10: edit a packaged file, then chain a package out of order",
    "$ echo edited >> out/evidence/2026-10-30T0600Z-fixture/summary.md",
    "$ python python/npi_evidence.py verify out/evidence/2026-10-30T0600Z-fixture",
    "error: out\\evidence\\2026-10-30T0600Z-fixture: summary.md doesn't match its SHA-256          (exit 1)",
    "$ python python/npi_evidence.py package --run $DAY1 --previous-manifest \\",
    "    out/evidence/2026-10-30T0600Z-fixture/EVIDENCE-MANIFEST.json --out out/swap",
    "error: this run (2026-10-29T06:00:00Z) isn't later than the previous package (2026-10-30T06:00:00Z)  (exit 1)",
    "$ python python/workflow_lint.py workflow/npi-evidence.yml",
    "workflow\\npi-evidence.yml: 0 finding(s), 0 warning(s)",
    "# Step 11: the tests",
    "Invoke-Pester -Path tests (PowerShell): 513 passed     python -m pytest tests -q: 142 passed",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED; EXIT CODES ADDED)", pt: 10.5 });
  line(s, "Clean", "Delete out in both folders when you're done: Remove-Item -Recurse -Force out, and rm -rf out.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 10, \"Exercise: Lab 1,\" steps 10 and 11; examples/drift-pipeline (python/npi_evidence.py, workflow_lint.py; tests).");
  notes(s,
`Step ten breaks it on purpose. Append one line to the packaged summary, and verify again. It exits one: the summary doesn't match its hash. Then try to package day one as if it came after day two, chained to day two's manifest. It exits one too: this run isn't later than the previous package. So an edited file and a swapped package are both refused, and that's what lets the ISSO trust the chain without trusting you. The step ends by linting the scheduled workflow, with no findings and no warnings. Step eleven runs the tests in both folders: five hundred thirteen Pester tests pass in PowerShell, and one hundred forty-two pytest tests pass in the drift pipeline. Then delete the output folder in both places.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 10 and 11.`);
}

// ================================================================== 14 Lab 2
{
  const s = content(SL, "Lab 2: three changes in your own test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant with Entra ID P1 or P2, never production, fictional people; Chapter 01's test host; Chapter 02's Lab 2 inputs"],
    ["Baseline", "A reader app with a certificate and the four read permissions; run a baseline and have it approved"],
    ["Three changes", "By hand: two secrets and one consent grant; then run the drift run"],
    ["Check and package", "Check the activity names against the admin center's audit log; package and verify the test runs"],
    ["Back it out", "Step 7: remove both secrets and the grant, the permissions and Reader; delete the app, its certificate, the runs and packages"],
  ], { fontSize: 12.5, limit: 5.3 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 10, Lab 2, which has the exact commands.");
  sources(s, "Sources: Module 10, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 moves to your own test tenant, worldwide or G C C, with Entra I D P one or P two, never production, with fictional people. You also need Chapter 1's test host and Chapter 2's Lab 2 inputs. Register a reader app with a certificate and the four read permissions, run a baseline, and have it approved. Then make three changes by hand: two secrets and one consent grant. Run the drift run, and check the activity names it found against the admin center's audit log, because that's what the fixture assumed. Then package and verify the test runs. To back it out, step seven removes both secrets and the consent grant, the four permissions and the Reader assignment, deletes the reader app and its certificate, and deletes the runs and packages. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 15 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G6");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.4, 3.9, 4.85], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["CM-2 Baseline Configuration; CM-3", "KSI-CMT-RMV, KSI-MLA-EVC, KSI-SVC-ACM; KSI-CMT-RVP", "drift/baseline-candidate.json and the approved SHA-256"],
    ["CA-7 Continuous Monitoring; AC-2", "KSI-MLA-EVC; KSI-IAM-SNU", "drift/findings.json, NPI-DRF-01 to -06"],
    ["AC-2(4); AU-6; SI-4", "KSI-MLA-LET, KSI-MLA-RVL; KSI-IAM-SUS", "drift/events.json; NPI-DRF-07 and -08"],
    ["AC-2(3) Disable Accounts", "KSI-IAM-AAM", "drift/signin-activity.json; NPI-DRF-04"],
    ["AC-6(7) Review of User Privileges", "KSI-IAM-AAM, KSI-IAM-JIT", "drift/review-cycle.json; NPI-REV-01 to -04"],
    ["AU-9; SI-7", "KSI-MLA-OSM; KSI-SVC-VRI", "EVIDENCE-MANIFEST.json, SHA256SUMS, summary.md; PERIOD-MANIFEST.json"],
  ], { fontSize: 11, limit: 5.6 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.2, 0.45, 12.5);
  sources(s, "Sources: Module 10, \"Introduction\"; NIST SP 800-53 Rev. 5; FedRAMP, Key Security Indicators; the guide's \"Evidence\" section.");
  notes(s,
`The federal requirement. These are NIST special publication eight hundred fifty-three controls, and the module's table maps each lab step to its evidence. For baseline configuration and change control, the baseline candidate and its approved hash. For continuous monitoring and account management, the drift findings. For automated audit actions, audit review and system monitoring, the events and the two credential and grant rules. For disabling accounts, the sign-in activity and the unused-app rule. For review of privileges, the review cycle. And for the integrity of the record, A U nine and S I seven, the evidence manifest, the checksum file and the summary, and the period manifest. K S I's are FedRAMP twenty X indicators for cloud service providers. The agency lines its evidence up with what its providers report; it doesn't report K S I's itself. Which file supports which indicator is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); the guide — "Evidence."`);
}

// ================================================================== 16 Check
{
  const s = check(SS, "Check yourself: two questions on drift and evidence", [
    { q: "A certificate rotation appears in the audit log. When does it count as inside the pipeline?", options: ["a. When a person made it during business hours", "b. When the initiator is a listed pipeline identity and the target and key ID are in the credential log", "c. When it's a certificate, not a secret"] },
    { q: "You append a line to a packaged summary.md and run verify. What happens?", options: ["a. It passes, because the summary isn't evidence", "b. It exits 1: summary.md doesn't match its SHA-256", "c. It rewrites the hash"] },
  ], "1 b: two independent records must agree. 2 b: the package's hashes cover every file.");
  sources(s, "Sources: Module 10, \"Knowledge check,\" questions 2 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: a certificate rotation appears in the audit log. When does it count as inside the pipeline? The answer is b: when the initiator is a listed pipeline identity, and the target and key I D are in the rotation pipeline's credential log. That's the program's design guidance: two independent records must agree, so a stolen pipeline credential used outside the log still shows up as N P I D R F oh seven. Second: you append a line to a packaged summary and run verify. What happens? The answer is b. It exits one, because the summary doesn't match its hash. That's what you did in step ten. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 4; "Check your answers."`);
}

// ================================================================== 17 Summary
{
  const s = content(SS, "Summary, and next: Module 11, test then production");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Ran two days of drift against an approved baseline",
    "Found three credentials added outside the pipeline",
    "Compared two AI inventory vintages",
    "Packaged and chained both days, assembled a period, and saw an edit and a swap refused",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 11: Deploy to test, then production", [
    "A preflight and a smoke test",
    "A rehearsed rollback",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "each day's package, the approved baseline's SHA-256, the vintage, and the period's manifest and summary, signed.");
  sources(s, "Sources: Module 10, \"Summary\"; Module 11.");
  notes(s,
`To sum up. You ran two days of drift against an approved baseline, found three credentials added outside the pipeline, compared two A I inventory vintages, packaged and chained both days, assembled a period for the ISSO, and saw an edited file and a swapped package refused. The evidence an ISSO keeps for Gate 6 is each day's package, with its evidence manifest, checksum file, summary and the run; the approved baseline's hash; the vintage comparison; and the period's manifest and summary, signed by the identity governance officer. Before you ship, work through the chapter's checklist. Next is Module 11, the last: deploy to test, then production. It runs every gate's code in one safe order, with a preflight, a smoke test, an evidence record per requirement and a rehearsed rollback.`,
  `${M} — Unit "Summary"; Module 11; learning path index — "What you'll be able to do."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 10 deck", [
  "Module page: docs/training/non-person-identity/10-drift-and-evidence.md (Non-Person Identity learning path, Module 10): Introduction and its requirement table, objectives, prerequisites, Units 1 to 3, Lab 1, Lab 2, knowledge check and summary. The learning path index: what you need for the labs.",
  "What the module links for the design and rules: Non-Person Identity: An Implementation Guide, Step 6, Validate (G6 Lifecycle) and \"Evidence\"; workbook Chapter 10, \"What the evidence has to show,\" \"The approved baseline,\" \"The register drift findings,\" \"The review cycle,\" \"The annual vintage comparison,\" \"The package and the chain,\" \"What the ISSO receives.\"",
  "Kit: examples/non-person-identity (Invoke-NpiDriftRun.ps1, Invoke-NpiVintage.ps1; powershell/NpiDrift; tests/fixtures/ch10) and examples/drift-pipeline (python/npi_evidence.py, workflow_lint.py; tests/fixtures/npi-runs, npi-vintage). Fictional tenant. Illustrative: tested against fixtures, not run against a live tenant.",
  "Lab output: run November 3, 2026: steps 1 to 6 with PowerShell 7 and Pester 5 in a scratch copy of examples/non-person-identity; steps 7 to 10 in Git Bash in a scratch copy of examples/drift-pipeline; pytest in the repository. Verification: docs/training/non-person-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
