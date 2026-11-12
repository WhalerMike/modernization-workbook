// Zero Trust Assessment learning path, Module 3: From results to a closure register — the module's narrated deck.
// Teaches docs/training/zero-trust-assessment/03-from-results-to-a-closure-register.md, Learn-style: objectives, the
// concepts (normalize and dispose; the register entry; routing to finding families; weighing and exceptions), three
// "Try it" slides with the real Lab 1 commands and output (run November 12, 2026 in a scratch copy of
// examples/zta-results, the same output the page shows), Lab 2, the federal requirement and evidence, a two-question
// check, and the summary. Every fact comes from the module page, the Zero Trust Assessment implementation guide it sends
// the learner to (Steps 7 and 8), Book 11, Chapters 08 and 10, or the kit; the deck adds none. The module page is a draft
// awaiting review, and the title slide says so. Helpers: ../training-zta-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-zta-module-3/build.js \
//                      presentations/training-zta-module-3/Training_ZTA_Module_3.pptx
const P = require("../training-zta-module-1/shared.js")({
  title: "Module 3: From results to a closure register",
  footer: "Federal Modernization Workbook  ·  Zero Trust Assessment learning path, Module 3: From results to a closure register",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_ZTA_Module_3.pptx";
const M = "Training, Zero Trust Assessment, Module 3";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 3: From results to a closure register", "The Zero Trust Assessment as Evidence · Normalize, dispose, register, route and weigh",
    ["Normalize and dispose  ·  The register entry  ·  Finding families and routing", "Weighing and exceptions  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 3 of The Zero Trust Assessment as Evidence: from results to a closure register. This module is a draft, awaiting the editor's review, so recheck it after the review. In this module the guide's results kit does the mechanical part. It normalizes every result, lists what didn't run with what to do about it, and writes a closure-register entry for each finding, routed and weighed. People do the rest, and the register shows where. It covers Steps 7 and 8 of the Zero Trust Assessment implementation guide, and takes about fifty-five minutes, most of it in Lab 1.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: \"17 failed\" can't be acted on");
  tag(s, "Why");
  const l = panel(s, "Ask", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "SOMEONE HAS TO DECIDE", null, [
    "Which results are real findings",
    "Who owns each one, and which page remediates it",
    "What comes first",
    "Which are accepted for now, and by whom",
  ], 13.5);
  const r = panel(s, "Kit", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "THE KIT DOES THE MECHANICAL PART", null, [
    "Normalizes every result",
    "Lists what didn't run, with what to do",
    "Writes one register entry per finding, routed and weighed",
  ], 13.5);
  callout(s, "People", Math.max(l, r) + 0.3, 0.95, "FaUserCheck", HEX.teal, "People do the rest, ",
    "and the register shows where: the owner's entries, the weighting rationale, and the closure decision.");
  sources(s, "Sources: Module 3, \"Introduction\"; Guide, Steps 7 and 8; the guide's results kit (examples/zta-results).");
  notes(s,
`Why does this matter? A report that says seventeen failed can't be acted on. Someone has to decide which of those are real findings, who owns each one, which page in the workbook remediates it, what comes first, and which are accepted for now, and by whom. The results kit does the mechanical part. It normalizes every result. It lists what didn't run, with what to do about it. And it writes one closure-register entry for each finding, routed to a page and weighed. People do the rest: the owner fills their entries, writes why a finding is weighted as it is, and someone with the authority decides closure. The register shows exactly where each of those lands.`,
  `${M} — "Introduction"; guide, Steps 7 and 8.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Normalize an export and read its counts by result and pillar",
    "Work the dispositions for results that are neither a pass nor a finding",
    "Record the review of an Investigate result",
    "Read a register entry: what's filled, what a person fills, who decides closure",
    "Route a finding to its family's page, and check an exception's approver",
  ], [
    "Module 1; Module 2's Lab 2 for this Lab 2",
    "Book 11, Chapter 08's finding families and Chapter 10's closure chain",
  ], 55);
  sources(s, "Sources: Module 3, \"Learning objectives,\" \"Prerequisites\"; Book 11, Ch 08 and 10.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll normalize a Zero Trust Assessment export and read its counts by result and by pillar. You'll work the dispositions for results that are neither a pass nor a finding. You'll record the review of an investigate result. You'll read a closure-register entry and say what's filled, what a person fills, and who decides closure. And you'll route a finding to its family's remediation page, and check an exception's approver. You need Module 1, and Module 2's Lab 2 for this module's Lab 2. In Unit 2 you'll read two chapters of Zero Trust and Assessment: Close Before You Assess, for the finding families, and Evidence, Not Verdicts, for the closure chain.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Normalize and dispose
{
  const s = content(SC, "Unit 1: normalize every result, then dispose of the rest");
  tag(s, "What");
  const tb = table(s, "Disp", 1.45, [3.4, 8.75], ["Normalized result", "Disposition the kit lists in dispositions.csv"], [
    ["Skipped-Licensing", "A licensing decision"],
    ["Skipped-Disconnected", "A fix and re-run"],
    ["Unable-to-Evaluate", "A fix and re-run, or verify by hand"],
    ["Skipped-Not-Applicable", "A recorded reason; NotSupported is a boundary finding"],
  ], { fontSize: 13, limit: 4.0 });
  const l = panel(s, "Twice", 0.6, tb + 0.25, W2, null, HEX.navy, HEX.navyTint, "EACH RESULT, TWICE", null, [
    "The tool's status and the normalized one",
    "Never the tool's result text, which can name tenant objects",
  ], 12.5);
  panel(s, "Unknown", 0.6 + W2 + G2, tb + 0.25, W2, null, HEX.amber, HEX.amberTint, "NOTHING GUESSED", null, [
    "An unreviewed version, or an unknown status or reason: the kit says so",
    "And counts that result as Unable-to-Evaluate",
  ], 12.5);
  sources(s, "Sources: Module 3, Unit 1; Guide, Step 7; Book 11, Ch 10 (A normalized result taxonomy); examples/zta-results: config/taxonomy.json.");
  notes(s,
`Unit 1 normalizes and disposes. The kit writes each result twice: the tool's status and the normalized one. It never copies the tool's result text, because that text can name tenant objects. Everything that is neither a pass nor a finding lands in a dispositions file, with what to do about it. A skip for licensing needs a licensing decision. A skip because a service was disconnected, or a result the kit is unable to evaluate, needs a fix and a re-run, or a check by hand. A skip as not applicable needs a recorded reason, and not supported is flagged as a boundary finding. One more guard. If the export comes from a version the kit's taxonomy wasn't reviewed for, or carries a status or reason it doesn't know, the kit says so. It counts that result as unable to evaluate, rather than guessing.`,
  `${M} — Unit 1 "Normalize and dispose"; guide, Step 7 (the taxonomy, steps 2 and 3).`);
}

// ================================================================== 5 Register entry
{
  const s = content(SC, "Unit 2: one register entry per finding");
  tag(s, "What");
  const l = panel(s, "Fields", 0.6, 1.45, 7.2, null, HEX.navy, HEX.navyTint, "THE CLOSURE CHAIN'S FIELDS", "From Book 11, Chapter 10", [
    "The finding and tool version; the attack path; the owner",
    "The dependencies; the change; the pilot; the enforcement",
    "The test; the evidence; the residual risk",
    "The reassessment; the weighting; the closure decision",
  ], 13);
  const r = panel(s, "Who", 8.05, 1.45, 4.7, null, HEX.teal, HEX.tealTint, "WHO FILLS WHAT", null, [
    "The kit: what the tool and the family table know",
    "A person: the placeholders it leaves",
  ], 13);
  callout(s, "Close", Math.max(l, r) + 0.3, 1.05, "FaScaleBalanced", HEX.red, "The kit never marks a finding ready for closure: ",
    "the authorizing official decides for a POA&M item, the assessor for an assessment finding, and the register records who decided.");
  sources(s, "Sources: Module 3, Unit 2; Guide, Step 8; Book 11, Ch 10 (The closure chain).");
  notes(s,
`Unit 2 opens the closure register. Every finding gets one entry, with the fields of the closure chain from Evidence, Not Verdicts: the finding and the tool version, the attack path, the owner, the dependencies, the change, the pilot, the enforcement, the test, the evidence, the residual risk, the reassessment, the weighting, and the closure decision. The kit fills what it knows from the tool and the family table, and leaves placeholders for what a person decides. And it never marks a finding ready for closure. The authorizing official decides that for a plan of action and milestones item, and the assessor for an assessment finding. The register records who decided.`,
  `${M} — Unit 2 ("One entry per finding"); guide, Step 8; Book 11, Chapter 10 — "The closure chain."`);
}

// ================================================================== 6 Routing
{
  const s = content(SC, "Routing: each finding family to the page that fixes it");
  tag(s, "What");
  const tb = table(s, "Fam", 1.45, [3.6, 3.75, 4.8], ["Finding family (some of them)", "Remediation page", "Ready for closure when"], [
    ["Emergency access", "Book 04, Ch 04", "The sign-in alert fired on a test sign-in"],
    ["Standing privilege and PIM", "Book 04, Ch 08", "No permanent active assignment outside the exception register"],
    ["Device compliance gaps", "Book 05, Ch 10", "A noncompliant test device refused"],
    ["Application secrets", "Book 13, Ch 14", "No secret outside the exception register"],
    ["DDoS, WAF and public exposure", "Azure Security Engineering guide", "A blocked test request"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Unrouted", tb + 0.3, 1.05, "FaRoute", HEX.amber, "Unrouted: ",
    "a finding no family covers goes to the Zero Trust program lead. In 3.1.0 the email and collaboration threat-protection tests have no family yet.");
  sources(s, "Sources: Module 3, Unit 2; Guide, Step 8 (Where each finding family is remediated); Book 11, Ch 08 (Finding families); config/finding-families.json.");
  notes(s,
`Each test I D routes to a finding family, and each family to the page in the workbook that remediates it. The table is from Close Before You Assess, with the evidence the guide adds for when a finding is ready for closure. Emergency access goes to Access and Privilege, and is ready when the sign-in alert fired on a test sign-in. Standing privilege goes to its PIM chapter, and is ready when no permanent active assignment sits outside the exception register. Device compliance goes to Devices and Endpoints, ready when a noncompliant test device is refused. Application secrets go to Governance, Drift and Evidence. DDoS and web application firewall findings go to the Azure Security Engineering guide. A finding no family covers is unrouted, and goes to the Zero Trust program lead. In release three point one point oh, the email and collaboration threat-protection tests have no family yet, so they stay unrouted and visible.`,
  `${M} — Unit 2 ("Routing"); guide, Step 8 (the family table; unrouted findings); Book 11, Chapter 08 — "Finding families"; examples/zta-results/config/finding-families.json.`);
}

// ================================================================== 7 Weigh and exceptions
{
  const s = content(SC, "Weigh the finding, then check each exception's approver");
  tag(s, "Who");
  const l = panel(s, "Weigh", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "WEIGHING", "The kit's default, then the owner's", [
    "Default priority: severity divided by effort, in buckets P1 to P4 (design guidance)",
    "The owner weighs exploitability, blast radius, exposure, compensating controls, effort and dependency order",
    "And writes why",
  ], 12.5);
  const r = panel(s, "Exc", 0.6 + W2 + G2, 1.45, W2, null, HEX.red, HEX.redTint, "EXCEPTIONS", "Who may approve", [
    "With an expiry: the CISO's decision",
    "Without one: a standing risk acceptance, for the authorizing official",
    "The kit marks each: governed exception, lapsed acceptance, or wrong approver",
  ], 12.5);
  callout(s, "Order", Math.max(l, r) + 0.3, 0.95, "FaArrowsRotate", HEX.teal, "Dependency order: ",
    "the register lists each family's dependencies, so a Conditional Access finding waits for emergency access to be right.");
  sources(s, "Sources: Module 3, Unit 2; Guide, Step 8 (Weigh, then order; Exceptions); Book 11, Ch 10; examples/zta-results: config/taxonomy.json.");
  notes(s,
`Two more parts of Unit 2: weighing and exceptions. The kit sets a default priority: severity divided by effort, in buckets P one to P four. That's design guidance, in the kit's taxonomy file. Then the owner weighs each finding on six factors from Evidence, Not Verdicts: exploitability, blast radius, exposure, compensating controls, effort and dependency order. The owner writes the rationale into the entry. The register also lists each family's dependencies, so a Conditional Access finding waits for emergency access to be right. Exceptions follow the same rule as ScubaGear's omissions. An exception with an expiry is the see-so's decision. One without an expiry is a standing risk acceptance, and only the authorizing official can approve it. The kit checks each one, and marks it a governed exception, a lapsed acceptance, or a wrong approver.`,
  `${M} — Unit 2 ("Weighing," "Exceptions"); guide, Step 8 ("Weigh, then order," "Exceptions"); Book 11, Chapter 10.`);
}
endModule(SC);

// ================================================================== 8 Try it: normalize
{
  const s = content(SL, "Try it: normalize the first run, read what didn't run");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/zta-results (keep the out folder for Module 4)",
    "$ ./Invoke-ZtaNormalize.ps1 -ExportPath tests/fixtures/run-2026-10-27 -OutputPath out/run1",
    "Zero Trust Assessment 3.1.0: 33 tests",
    "  Pass                        8",
    "  Fail                       17",
    "  Planned                     1",
    "  Skipped-Licensing           2",
    "  Skipped-Disconnected        1",
    "  Skipped-Not-Applicable      2",
    "  Unable-to-Evaluate          2",
    "Findings: 17 (1 Investigate)",
    "$ Import-Csv out/run1/dispositions.csv | Format-Table testId, normalized, skippedBecause",
    "testId normalized             skippedBecause",
    "21800  Planned                UnderConstruction",
    "21883  Skipped-Licensing      NotLicensedEntraWorkloadID",
    "24548  Unable-to-Evaluate",
    "25416  Skipped-Not-Applicable NotApplicable",
    "27018  Skipped-Not-Applicable NotApplicable",
    "35005  Skipped-Disconnected   NotConnectedToService",
    "41050  Unable-to-Evaluate     TimeoutReached",
    "61009  Skipped-Licensing      NoCompatibleLicenseFound",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (THE SAME AS THE PAGE; TWO LINES OMITTED)", pt: 10 });
  line(s, "Read", "16 Failed plus 1 Investigate make 17 findings. 24548 ended in Error and 41050 timed out: a run to fix, not a control to fail.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 1 and 2; examples/zta-results: Invoke-ZtaNormalize.ps1, tests/fixtures/run-2026-10-27.");
  notes(s,
`Try it. Lab 1 normalizes and registers two fictional runs of a Contoso tenant, two weeks apart. Step one normalizes the first run. Thirty-three tests: eight pass, seventeen fail, one planned, two skipped for licensing, one disconnected, two not applicable, and two unable to evaluate. Seventeen findings, one of them investigate. The tool marked sixteen failed; the investigate result makes seventeen. The eight that are neither pass nor finding are in their own columns. Step two reads the dispositions. Two skips for licensing, two not applicable, one disconnected, one planned. And two unable to evaluate: test two four five four eight ended in error, and four one oh five oh timed out. Both of those are a run to fix, not a control to fail. The slide leaves out the written-to line and the table's underline; the page shows them.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2.`);
}

// ================================================================== 9 Try it: register
{
  const s = content(SL, "Try it: write the register and read its top rows");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 3 and 4",
    "$ ./Invoke-ZtaRegister.ps1 -RunPath out/run1 -OutputPath out/run1-register",
    "Register: 17 findings  P1 3  P2 10  P3 4  P4 0",
    "Governed exceptions: 0",
    "WARNING: Unrouted (assign a family): 41032",
    "Written to out/run1-register: register.json, register.csv, manifest.json",
    "$ Import-Csv out/run1-register/register.csv | Select-Object -First 5 | Format-Table testId, family, bucket, priority, owner",
    "testId family            bucket priority owner",
    "------ ------            ------ -------- -----",
    "24824  device-compliance P1     80       Endpoint engineering",
    "25533  ddos-waf-exposure P1     80       Platform team, with network engineering",
    "41032  unrouted          P1     80       Zero Trust program lead, to route",
    "21837  device-compliance P2     48       Endpoint engineering",
    "21772  app-secrets       P2     40       Application owners, with the platform teams",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (THE SAME AS THE PAGE)", pt: 10.5 });
  line(s, "Read", "41032, the Safe Links test, has no family: the program lead routes it. 21837 is the Investigate result, weighted down until confirmed.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 3 and 4; examples/zta-results: Invoke-ZtaRegister.ps1, config/finding-families.json, config/taxonomy.json.");
  notes(s,
`Step three writes the register for the first run: seventeen findings, three in P one, ten in P two, four in P three. And a warning: test four one oh three two is unrouted. That's the Safe Links test, which has no finding family, so the program lead routes it. Step four reads the top five rows. Two device compliance findings, owned by endpoint engineering. A DDoS and web application firewall finding, owned by the platform team. The unrouted Safe Links finding, owned by the Zero Trust program lead until it's routed. And an application secrets finding. Look at two one eight three seven. It's the investigate result, and its severity is weighted down, so it ranks below other high-risk findings of the same effort until a person confirms it. Every finding has an owner, even the one nobody has claimed yet.`,
  `${M} — "Exercise: Lab 1," steps 3 and 4.`);
}

// ================================================================== 10 Try it: review and exceptions
{
  const s = content(SL, "Try it: the second run, a review and two exceptions");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 5 and 6 (trimmed: … marks omitted lines and text; the page shows it all)",
    "$ Get-Content -Raw tests/fixtures/inputs/reviews.csv",
    "21837,confirmed,Endpoint engineering (example),2026-11-11,The device limit is 50 and Book 05 sets 10",
    "$ ./Invoke-ZtaNormalize.ps1 -ExportPath tests/fixtures/run-2026-11-10 -OutputPath out/run2 -ReviewsPath …",
    "Zero Trust Assessment 3.1.0: 34 tests",
    "…",
    "Findings: 15 (1 Investigate)",
    "$ Get-Content -Raw tests/fixtures/inputs/exceptions.csv",
    "25533,CISO,2026-10-30,2027-01-31,Public IPs move behind Front Door Premium in the January change window,…",
    "21885,ISSO,2026-09-01,,A legacy partner application keeps a localhost redirect URI,none",
    "$ ./Invoke-ZtaRegister.ps1 -RunPath out/run2 -OutputPath out/run2-register -ExceptionsPath …",
    "Register: 15 findings  P1 1  P2 10  P3 4  P4 0",
    "WARNING: Exceptions to fix (lapsed or wrong approver): 21885",
    "testId disposition        exceptionApprover exceptionExpires",
    "25533  governed-exception CISO              2027-01-31",
    "21885  wrong-approver     ISSO",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (THE SAME AS THE PAGE; TRIMMED WHERE MARKED)", pt: 10.5 });
  line(s, "Read", "21885's exception has no end date: a standing risk acceptance, which only the authorizing official can approve.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 5 and 6; examples/zta-results: tests/fixtures/inputs/reviews.csv, exceptions.csv.");
  notes(s,
`Steps five and six take the second run, two weeks later. The reviews file holds one row: endpoint engineering confirmed the investigate result, two one eight three seven, on November eleventh, with a note on why. The kit normalizes the second run with that review: thirty-four tests, fifteen findings. The exceptions file holds two rows. The first, on two five five three three, was approved by the see-so, with an expiry at the end of January, 2027: a governed exception. The second, on two one eight eight five, was approved by the I S S O, with no end date. The kit marks it a wrong approver. An exception with no end date is a standing risk acceptance, and only the authorizing official can approve it. So the register warns, and that exception goes back to be fixed.`,
  `${M} — "Exercise: Lab 1," steps 5 and 6.`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: register your test tenant's export");
  tag(s, "How");
  const c = code(s, "Lab2", 0.6, 1.45, 12.15, [
    "# Step 1: normalize the export from Module 2's Lab 2",
    "./Invoke-ZtaNormalize.ps1 -ExportPath <report-folder> -OutputPath out/lab2 -ReviewsPath <reviews-file>",
    "Import-Csv out/lab2/dispositions.csv | Format-Table testId, normalized, skippedBecause",
    "# Step 2: write the register",
    "./Invoke-ZtaRegister.ps1 -RunPath out/lab2 -OutputPath out/lab2-register -ExceptionsPath <exceptions-file>",
    "Import-Csv out/lab2-register/register.csv | Format-Table testId, family, bucket, owner",
    "# Step 4: back it out when you finish Module 4",
    "Remove-Item -Recurse -Force out/lab2, out/lab2-register",
  ], { label: "LAB 2  ·  ON THE ASSESSMENT HOST  ·  NOT RUN BY THE AUTHORS", pt: 10.5 });
  const tb = table(s, "Steps", c + 0.25, [2.6, 9.55], ["Also", "What you do"], [
    ["Your files", "Copies of templates/reviews.template.csv and exceptions.template.csv, filled for the test tenant"],
    ["Step 3: compare", "Every Failed and Investigate test has an entry, and no Skipped test does; note any unrouted test"],
  ], { fontSize: 12.5, limit: 6.4 });
  sources(s, "Sources: Module 3, \"Exercise: Lab 2\"; Guide, Steps 7 and 8; examples/zta-results: templates/.");
  notes(s,
`Lab 2 runs the same steps on the export from Module 2's Lab 2, on the assessment host. The authors haven't run it. You replace the report folder with Module 2's, and the reviews and exceptions files with your own copies of the kit's two templates, filled for your test tenant. Step one normalizes the export and lists the dispositions. Step two writes the register, with your exceptions. Step three is a comparison by eye: open the report's pillar tabs. Every failed and investigate test should have a register entry, and no skipped test should. Note any unrouted test for your program lead. Step four backs it out. The outputs hold your test tenant's results, so delete them when you finish Module 4.`,
  `${M} — "Exercise: Lab 2, your test tenant's export," steps 1 to 4.`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 3");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.1, 3.3, 3.75], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["CA-2, CA-7, CM-6: results normalized and counted honestly", "KSI-PIY-RIS, KSI-MLA-EVC, KSI-SVC-ACM", "results.json, summary.json, dispositions.csv, the reviews file"],
    ["CA-5: each finding's planned remediation", "None listed", "register.json, register.csv"],
    ["RA-7: findings weighed against risk tolerance; exceptions approved by the right official", "None listed", "The weighting rationale; the exceptions file"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "None listed ",
    "means Book 13, Appendix A pairs no KSI with the control. The evidence supports the controls; the assessor decides.");
  sources(s, "Sources: Module 3, \"The federal requirement,\" \"Summary\"; Guide, Steps 7 and 8; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; Book 13, App A.");
  notes(s,
`The federal requirement, in NIST special publication eight hundred fifty-three, revision five. C A two, C A seven and C M six: results normalized and counted honestly. The evidence is the normalized results, the summary, the dispositions, and the reviews file. C A five, the plan of action and milestones: each finding's planned remediation, evidenced by the register, in jay-son and C S V. And R A seven, risk response: findings weighed against risk tolerance, and exceptions approved by the right official. The evidence is the weighting rationale and the exceptions file. For C A five and R A seven, no key security indicator is listed: the mapping in Governance, Drift and Evidence pairs none with them. The evidence supports the controls; the assessor decides.`,
  `${M} — "The federal requirement" table; "Summary"; guide, Steps 7 and 8 (requirements and evidence).`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on Module 3", [
    { q: "Who marks a register entry ready for closure?", options: ["a. The kit, when the next run passes", "b. The pillar owner, when the change record closes", "c. The authorizing official for a POA&M item, or the assessor for an assessment finding"] },
    { q: "An exception has no expiry and was approved by the CISO. What does the kit report?", options: ["a. A governed exception", "b. A wrong approver: a standing exception is the authorizing official's decision", "c. A lapsed acceptance"] },
  ], "1 c: the register records who decided. 2 b: no expiry makes it a standing risk acceptance.");
  sources(s, "Sources: Module 3, \"Knowledge check,\" questions 2 and 3; Unit 2; Lab 1, step 6; Book 11, Ch 10.");
  notes(s,
`Check yourself with two questions. First: who marks a register entry ready for closure? The answer is c: the authorizing official, for a plan of action and milestones item, or the assessor, for an assessment finding. The kit never does, and the register records who decided. Second: an exception has no expiry, and was approved by the see-so. What does the kit report? The answer is b, a wrong approver. With no expiry it's a standing risk acceptance, and that's the authorizing official's decision. The module page has three more questions, each linked to the unit or lab step that answers it.`,
  `${M} — "Knowledge check," questions 2 and 3, and "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: a register that routes every finding");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Normalized two runs and worked their dispositions",
    "Recorded the review of an Investigate result",
    "Opened a closure register, routed to the pages that remediate each family",
    "Checked exceptions against their approvers",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 4", [
    "Reconcile, re-run and keep the evidence: compare, reconcile, seal",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the normalized results and summary, the dispositions, the reviews and exceptions files, and the register.");
  sources(s, "Sources: Module 3, \"Summary\"; learning path index; Module 4.");
  notes(s,
`To sum up. You normalized two runs and worked their dispositions. You recorded the review of an investigate result. You opened a closure register, routed to the pages that remediate each family, with a default weighting the owner refines. And you checked exceptions against their approvers. The evidence an I S S O keeps from this module: the normalized results and summary, the dispositions, the reviews and exceptions files, and the register. Keep the out folder from Lab 1. Module 4, reconcile, re-run and keep the evidence, compares these two runs, and seals them.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/zero-trust-assessment/03-from-results-to-a-closure-register.md (The Zero Trust Assessment as Evidence, Module 3), a draft awaiting review; the path's verification log is docs/training/zero-trust-assessment/_verification/learning-path.md.",
  "Zero Trust Assessment: An Implementation Guide, Step 7 (the taxonomy and dispositions) and Step 8 (the register, the finding families, \"Weigh, then order,\" \"Exceptions\"), with their footnotes, read November 11, 2026.",
  "Book 11, Chapter 08 (Finding families) and Chapter 10 (A normalized result taxonomy; The closure chain; weighing; exceptions). The remediation pages: Book 04, Chapters 04 and 08; Book 05, Chapter 10; Book 13, Chapter 14; the Azure Security Engineering guide.",
  "NIST SP 800-53 Rev. 5 (CA-2, CA-5, CA-7, CM-6, RA-7); FedRAMP 20x KSIs, as Book 13, Appendix A maps them.",
  "Lab output: examples/zta-results (Invoke-ZtaNormalize.ps1, Invoke-ZtaRegister.ps1, config/taxonomy.json, config/finding-families.json, tests/fixtures), run November 12, 2026 with PowerShell 7.6, the same as the page; trimmed where the slides say so. Lab 2 not run by the authors.",
]);

finish(OUT);
