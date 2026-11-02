// Ticket-to-Machine learning path, Module 7: Evidence for the ISSO — the module's narrated deck.
// Teaches docs/training/ticket-to-machine/07-evidence-for-the-isso.md, Learn-style: objectives, the concepts, two
// "Try it" slides with the real Lab 1 commands and output (run November 2, 2026 in a copy of
// examples/servicenow-sailpoint), Lab 2, the federal requirement and evidence, a two-question check, and the summary.
// Every fact comes from the module page, the sections it sends you to read (the guide's Gate 7 and "Evidence," the
// workbook's Chapter 07), its verification log, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-ttm-module-7/build.js \
//                      presentations/training-ttm-module-7/Training_TTM_Module_7.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 7: Evidence for the ISSO",
  footer: "Federal Modernization Workbook  ·  Ticket-to-Machine learning path, Module 7: Evidence for the ISSO",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
const OUT = process.argv[2] || "Training_TTM_Module_7.pptx";
const M = "Training, Ticket-to-Machine, Module 7";

// shared.js names the deck and the title slide for the Microsoft Automation path; this deck is on the
// Ticket-to-Machine path, so it sets its own document title and uses its own title slide (same layout).
P.D.pres.title = "Ticket-to-Machine learning path — Module 7: Evidence for the ISSO";
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "TICKET-TO-MACHINE LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
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
  const s = title(SI, "Module 7: Evidence for the ISSO", "Ticket-to-Machine learning path · Operate the tempo, export the records, verify the package",
    ["Operating the tempo  ·  Book 13's evidence record  ·  Four checks  ·  The package and the chain", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement  ·  Evidence"]);
  notes(s,
`Welcome to Module 7, the last module of the Ticket-to-Machine learning path: evidence for the ISSO. This module covers the guide's Gate 7 and the developer workbook's Chapter 07. In Module 6, a finding closed only on a re-read, with its evidence on the record. Now you turn those closed findings into the evidence an ISSO keeps. You'll learn what Gate 7 runs on a schedule and reports. Then you'll export a period's closed findings as Book 13's evidence records, chain one period to the next, and verify the package the way an ISSO would, including catching a record someone removed. If you're an ISSO reviewer, this module is yours in full. The code is illustrative, tested against fictional fixtures.`,
  `${M} — Unit 1 "Introduction"; the learning path's index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why ticket history doesn't prove the month");
  tag(s, "Why");
  const b = table(s, "Ask", 1.45, [6.5, 5.65], ["At the end of the month, the ISSO has to show", "Ticket history and screenshots"], [
    ["Every identity finding was owned, clocked, re-read and closed", "Show a status, not a re-read"],
    ["Nothing was edited after it closed", "Can't show an edit that left no trace"],
    ["Nothing was quietly dropped", "Can't show what's missing"],
  ], { fontSize: 13.5, limit: 4.2 });
  callout(s, "Point", b + 0.3, 0.95, "FaFileShield", HEX.red, "This module: ",
    "learn what Gate 7 runs and reports, then build and verify the evidence package for a period.");
  sources(s, "Sources: Module 7, Unit 1 \"Introduction.\" The right-hand column restates the module's point that ticket history and screenshots don't prove it.");
  notes(s,
`Why does this matter? At the end of the month, your ISSO needs to show an assessor three things. That every identity finding was owned, clocked, re-read and closed. That nothing was edited after it closed. And that nothing was quietly dropped. Ticket history and screenshots don't prove that. A ticket shows a status, not a re-read. And neither one can show an edit that left no trace, or a record that's simply missing. In this module you learn what Gate 7 runs and reports, then build and verify the evidence package for a period, a package that can prove all three.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 7", [
    "Explain what Gate 7 schedules and reports to the governance board",
    "Describe Book 13's evidence record, which of its fields Pass 1 leaves empty, and why",
    "Produce an evidence package for a period, and continue its hash chain into the next",
    "Verify a package, and explain how the verifier catches an edited or removed record",
  ], [
    "Module 6",
    "ISSO reviewers working only this module: Module 1, Unit 3, first",
    "Lab 1: the kit and Python; no tenant",
    "Lab 2: the developer instance, with a finding closed in Module 6's Lab 2",
  ], 45);
  sources(s, "Sources: Module 7, Unit 1 \"Learning objectives,\" \"Prerequisites\"; Unit 5 \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about forty-five minutes with the lab. You'll explain what Gate 7 schedules and reports to the governance board. You'll describe Book 13's evidence record, which of its fields Pass 1 leaves empty, and why. You'll produce an evidence package for a period, and continue its hash chain into the next. And you'll verify a package, and explain how the verifier catches an edited or removed record. Before you start, finish Module 6. If you're an ISSO reviewer working only this module, read Module 1's Unit 3 first, on the identity finding and its contract. Lab 1 needs no tenant. Lab 2 needs your developer instance, with at least one finding closed in Module 6's Lab 2.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Tempo
{
  const s = content(SC, "Gate 7: operating the tempo");
  tag(s, "What");
  const b = table(s, "Steps", 1.45, [3.3, 8.85], ["Gate 7 step", "What it means on these products"], [
    ["Schedule", "The drift reconciliation and the re-read client; keep their outputs with the date and the checker version"],
    ["Report", "Five measures to the governance board"],
    ["Route", "The identity fixes through the loop"],
    ["Export", "The evidence in Book 13's shape; Chapter 07 builds the ServiceNow half"],
    ["Review", "Each declared exception at its end date, and each L4 class quarterly"],
  ], { fontSize: 13, limit: 4.6 });
  line(s, "Tempo", "Book 13's tempo: P1 halts, P2 one hour, P3 24 hours, P4 72 hours. These are the program's windows, not federal ones.", b + 0.3, 0.7, 14);
  sources(s, "Sources: Module 7, Unit 2 \"Operating the tempo\"; guide, Gate 7, intro and steps 1 to 5; \"Validate (G7 Tempo and evidence).\"");
  notes(s,
`Once the loop runs, it runs on Book 13's tempo. P1 halts. P2 has one hour, P3 twenty-four hours, and P4 seventy-two hours. Those are the program's windows, not federal ones. Gate 7 is how you operate it, in five steps. Schedule the drift reconciliation and the re-read client, and keep their outputs with the date and the checker version. Report five measures to the governance board. Route the identity fixes through the loop. Export the evidence in Book 13's shape. And review each declared exception at its end date, and each L4 class quarterly. The guide's Gate 7 validation names the export as its automated check, and Chapter 07 builds its ServiceNow half. That's what you'll run in the lab.`,
  `${M} — Unit 2 "Operating the tempo"; guide — Gate 7.`);
}

// ================================================================== 5 Five measures
{
  const s = content(SC, "Five measures for the governance board");
  tag(s, "Who");
  const l = panel(s, "Measures", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "BOOK 13, CHAPTER 10", "What the tempo shows leadership", [
    "Detection coverage",
    "Window adherence",
    "Escalation rate",
    "Machine-closure share",
    "Declared-exception count",
  ], 14);
  const r = panel(s, "Validate", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "VALIDATE (G7)", "What's checked, and how", [
    "Automated, read-only: evidence_export.py; drift_compare.py classifies findings across two runs",
    "The five measures have no automated check yet",
    "Manual: a month of scheduled runs kept; the measures reported once; the first package accepted by the ISSO",
  ], 13);
  callout(s, "Interim", Math.max(l, r) + 0.3, 0.85, "FaRoute", HEX.navy, "Interim path: ",
    "until the export exists, assemble the package by hand from a report of closed findings and a SailPoint event search.");
  sources(s, "Sources: Module 7, Unit 2; guide, Gate 7, step 2, \"Validate (G7 Tempo and evidence)\" and \"Interim path\"; Book 13, Chapter 10.");
  notes(s,
`Gate 7 reports five measures to the governance board, from Book 13's Chapter 10: detection coverage, window adherence, escalation rate, machine-closure share, and the declared-exception count. How is Gate 7 validated? The automated checks are read-only. The evidence export writes and checks the records, and the drift comparison from Module 4 classifies findings across two runs. The five measures themselves have no automated check yet. The manual validation is that the scheduled runs have run for a month with outputs kept, the measures have been reported once, and the first monthly package has been assembled end to end and accepted by the ISSO. Until the export exists in your estate, the interim path is to assemble the package by hand, from a ServiceNow report of closed findings with their evidence attachments and a SailPoint event search for the same period.`,
  `${M} — Unit 2 "Operating the tempo"; guide — Gate 7, "Validate (G7 Tempo and evidence)," "Interim path."`);
}

// ================================================================== 6 Evidence record
{
  const s = content(SC, "Book 13's evidence record, field by field");
  tag(s, "What");
  const b = table(s, "Record", 1.45, [2.3, 6.3, 3.55], ["Field", "Where it comes from in this example", "In Pass 1"], [
    ["Origin", "The SailPoint trigger and workflow, the reconciliation finding ID, or the catalog request", "Recorded"],
    ["Owner and clock", "The ServiceNow assignment, severity, priority and due date", "Recorded"],
    ["Approval", "The ServiceNow approval or CAB record; the SailPoint approval; the L4 class acceptance", "null, with the reason"],
    ["Executing identity", "The connector's or the spoke's service principal; the PIM activation", "null, with the reason"],
    ["What ran", "The provisioning event, the workflow version, or the session recording", "null, with the reason"],
    ["Result", "The re-read evidence on the finding", "Recorded"],
    ["Closure", "The closed record, with its evidence hash and attachment", "Recorded"],
  ], { fontSize: 12, limit: 5.7 });
  line(s, "Why", "Pass 1 doesn't actuate: the change or catalog record that would hold them is a later pass. The record says so.", b + 0.2, 0.7, 14);
  sources(s, "Sources: Module 7, Unit 3; guide, \"Evidence\"; workbook Chapter 07, \"What this chapter adds\"; Book 13, Appendix B, \"The evidence record.\"");
  notes(s,
`Every lane writes the same record, Book 13's evidence record, with seven fields. The guide shows where each comes from on these products. Origin is the SailPoint trigger and workflow, the reconciliation finding, or the catalog request. Owner and clock are the ServiceNow assignment, severity, priority and due date. Approval is the ServiceNow or SailPoint approval. Executing identity is the connector's or spoke's service principal, or a person's PIM activation. What ran is the provisioning event, the workflow version or the session recording. Result is the re-read evidence, and closure is the closed record with its hash. In Pass 1, three of those are empty: approval, executing identity and what ran. Pass 1 doesn't actuate, so the record that would hold them is a later pass. The export writes each as null, with that reason, rather than leaving the field out or filling it.`,
  `${M} — Unit 3 "Evidence records and the package"; guide — "Evidence"; Chapter 07 — "What this chapter adds."`);
}

// ================================================================== 7 Export and four checks
{
  const s = content(SC, "One record per finding, and four checks on each");
  tag(s, "How");
  const b = table(s, "Checks", 1.45, [5.0, 7.15], ["evidence_export.py checks", "What a failure means"], [
    ["The evidence still hashes to u_evidence_hash", "Edited after closure, or cut short by the 4,000-character field"],
    ["A closed record carries evidence at all", "A close that bypassed the business rule"],
    ["The evidence says the intended state matched", "The record closed on something other than a match"],
    ["It finished inside its response window", "Verified after its due date: closed late"],
  ], { fontSize: 13, limit: 4.4 });
  const l = panel(s, "In", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "WHAT IT READS", null, [
    "Closed or cancelled findings, through the Table API",
    "Under its own read-only role, x_example_idkit.evidence_reader",
  ], 13);
  panel(s, "Out", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "WHAT IT WRITES", null, [
    "One record per finding: book13-evidence-record/identity-finding/v1",
    "Each check reported by name",
  ], 13);
  sources(s, "Sources: Module 7, Unit 3; workbook Chapter 07, \"What exists\" and \"What this chapter adds.\"");
  notes(s,
`The re-read client from Module 6 already writes the evidence onto each record it closes: the evidence itself as canonical JSON, its SHA-256 hash, the verification time, a close note and an attachment. But nothing read the records back out. Chapter 07 adds the evidence export. It reads closed and cancelled findings through the Table API, under its own read-only role, and writes one record per finding in Book 13's shape. Then it runs four checks on each, reported by name. Does the evidence still hash to the stored hash? If not, it was edited after closure, or cut short by the four-thousand-character field. Does a closed record carry evidence at all? If not, the close bypassed the business rule. Does the evidence say the intended state matched? And did it finish inside its response window, verified at or before its due date?`,
  `${M} — Unit 3 "Evidence records and the package"; Chapter 07 — "What exists," "What this chapter adds."`);
}

// ================================================================== 8 Package
{
  const s = content(SC, "The package: three files, a chain, and a verifier");
  tag(s, "How");
  const b = table(s, "Files", 1.45, [2.6, 9.55], ["File", "What it holds"], [
    ["records.jsonl", "One record per line, each with the SHA-256 of the line before, so a removed or reordered record breaks the chain"],
    ["summary.json", "Window adherence, the count of declared exceptions, and the records with problems"],
    ["manifest.json", "A SHA-256 per file, and the chain head"],
  ], { fontSize: 13, limit: 3.7 });
  const l = panel(s, "Options", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "OPTIONS", null, [
    "--previous-manifest continues last period's chain",
    "--generated-at fixes the timestamp: the same records give the same bytes",
    "--verify-dir recomputes every hash and walks the chain: the ISSO's check",
  ], 13);
  panel(s, "Signed", 6.85, b + 0.25, 5.9, null, HEX.amber, HEX.amberTint, "TAMPER-EVIDENT, NOT SIGNED", null, [
    "Anyone who can rewrite every file and the manifest can rewrite the chain",
    "Keep each manifest where the exporter can't write, and sign it if the program requires (design guidance)",
  ], 13);
  sources(s, "Sources: Module 7, Unit 3; workbook Chapter 07, \"What this chapter adds,\" its \"Illustrative code\" note, and \"Dangers.\"");
  notes(s,
`The export packages the period in three files. Records dot J S O N L holds one record per line, and each line carries the SHA-256 of the line before it, so a removed or reordered record breaks the chain. Summary dot JSON holds window adherence, the count of declared exceptions and the records with problems. And the manifest holds a SHA-256 for each file and the chain head. The previous-manifest option continues last period's chain into this one. The generated-at option fixes the timestamp, so the same records always give the same bytes. And verify-dir recomputes every hash and walks the chain. That's the check an ISSO runs on a package they receive. One caution: the package is tamper-evident, not signed. Anyone who can rewrite every file and the manifest can rewrite the chain. So, as design guidance, keep each manifest where the exporter can't write, and sign it if the program requires.`,
  `${M} — Unit 3 "Evidence records and the package"; Chapter 07 — "What this chapter adds," "Dangers."`);
}

// ================================================================== 9 Window adherence and fixtures
{
  const s = content(SC, "Window adherence, and five fictional records");
  tag(s, "What");
  const l = panel(s, "Window", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "HOW CHAPTER 07 MEASURES IT", "Closures, not open findings", [
    "Closures inside the window, over closures judged",
    "As Book 13 and Book 12, Chapter 12 define it",
    "Not a ratio of open findings that improves as new ones arrive",
  ], 13.5);
  const r = panel(s, "Five", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "tests/fixtures/evidence/closed_records.json", "One record per case", [
    "Closed in its window",
    "Closed late",
    "Evidence edited after it closed",
    "Cancelled as a declared exception",
    "Closed with no evidence at all",
  ], 13.5);
  callout(s, "Dates", Math.max(l, r) + 0.3, 0.85, "FaUserClock", HEX.amber, "Not verified: ",
    "the Table API's date format and time zone on your instance; the export parses both forms. Lab 2 checks it.");
  sources(s, "Sources: Module 7, Unit 3; workbook Chapter 07, \"What this chapter adds\" and \"What couldn't be verified.\"");
  notes(s,
`Window adherence needs care, because it's easy to measure in a way that flatters. Chapter 07 measures it the way Book 13 and Book 12's Chapter 12 define it: closures inside the window, over closures judged. It isn't a ratio of open findings, which improves as new ones arrive. The kit's fixture has five fictional closed records, one per case: one closed in its window, one closed late, one whose evidence was edited after it closed, one cancelled as a declared exception, and one closed with no evidence at all. You'll export all five in the lab. One thing wasn't verified: the format and time zone of the date values the Table API returns on a given instance. The export parses both common forms, and Lab 2 checks yours.`,
  `${M} — Unit 3 "Evidence records and the package"; Chapter 07 — "What this chapter adds," "What couldn't be verified."`);
}
// ================================================================== 10 Dangers
{
  const s = content(SC, "Dangers to the evidence, and the guard for each");
  tag(s, "Who");
  const b = table(s, "Dangers", 1.45, [3.6, 4.1, 4.45], ["Danger", "What happens", "The guard"], [
    ["A record edited after closure", "The evidence says something the re-read didn't", "The evidence hash is recomputed; a mismatch is reported"],
    ["u_evidence cut short by the field length", "The evidence can't be parsed, or hashes wrong", "Reported as invalid JSON; the attachment holds the full copy"],
    ["A close that bypassed the business rule", "A record with no evidence passes as closed", "\"Closed without re-read evidence\""],
    ["A record deleted from the period", "The package looks complete", "The chain breaks; --verify-dir reports it"],
    ["Fields filled to look complete", "Approval or execution claimed that never happened", "Later-pass fields are null with the reason, and tests pin it"],
    ["The export runs with the verifier's role", "It could close findings", "Its own read-only role; kit_calls.py --granted"],
  ], { fontSize: 12, limit: 6.55 });
  sources(s, "Sources: Module 7, Unit 3; workbook Chapter 07, \"Dangers.\"");
  notes(s,
`Chapter 07 lists the dangers to the evidence, and the guard for each. A record edited after closure would say something the re-read didn't, so the export recomputes the evidence hash and reports a mismatch. Evidence cut short by the field length can't be parsed, so it's reported, and the attachment holds the full copy. A close that bypassed the business rule is named: closed without re-read evidence. A record deleted from the period would make the package look complete, but the chain breaks and the verifier reports it. Fields filled in to look complete would claim an approval that never happened, so later-pass fields stay null with their reason, and tests pin that. And if the export ran with the verifier's role, it could close findings, so it runs under its own read-only role, which the kit's call list can check.`,
  `${M} — Unit 3 "Evidence records and the package"; Chapter 07 — "Dangers."`);
}
endModule(SC);

// ================================================================== 11 Try it 1
{
  const s = content(SL, "Try it: export October and verify the package");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 to 3, in examples/servicenow-sailpoint (fixtures, no tenant)",
    "$ python -m pytest tests/python/test_evidence_export.py -q",
    "8 passed in 0.98s",
    "$ python clients/python/evidence_export.py --records-json tests/fixtures/evidence/closed_records.json \\",
    "    --out-dir out/evidence --period 2026-10 --generated-at 2026-11-01T12:00:00Z",
    "5 evidence records: 4 closed on a re-read, 1 declared exception",
    "Window adherence: 2 of 3 closed inside the window",
    "  IDF0000902: closed after its response window",
    "  IDF0000903: evidence doesn't hash to u_evidence_hash: edited after closure, or cut short",
    "  IDF0000905: closed without re-read evidence",
    "Chain head 144f5e8494281f83598d2fae5eacac12b9b271c90372c0e503aafc2bd4cf0623; written to out/evidence",
    "$ python -c \"import json; r=json.loads(...readline()); [print(k, json.dumps(r[k])) for k in (...)]\"",
    "approval {\"reason\": \"not recorded in Pass 1: the change or catalog record ... is a later pass\", \"value\": null}",
    "$ python clients/python/evidence_export.py --verify-dir out/evidence",
    "Package holds: every file matches the manifest and the chain is unbroken.",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED)", pt: 11 });
  line(s, "Exit", "The export exits 1: three records have problems, and the run says so instead of producing a clean-looking package.", c + 0.25, 0.45, 14);
  sources(s, "Sources: Module 7, Unit 4 \"Exercise: Lab 1,\" steps 1 to 3; workbook Chapter 07, Lab 1; tests/fixtures/evidence/closed_records.json.");
  notes(s,
`Try it. Lab 1 runs in the kit's servicenow-sailpoint folder, with no tenant. Step one runs the chapter's tests, and eight pass. Step two exports October's closed findings. There are five records: four closed on a re-read, and one declared exception. Window adherence is two of three closed inside the window. Then it names three problems: one record closed after its response window, one whose evidence doesn't hash to the stored hash, so it was edited after closure or cut short, and one closed without re-read evidence. The command exits with one, because three records have problems, and the run says so instead of producing a clean-looking package. The one-line Python command prints three fields from the first record; on the slide it's trimmed, and so is its output. Each is null, with its reason. Step three verifies the package as the ISSO would, and it holds.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 1 to 3.`);
}

// ================================================================== 11 Try it 2
{
  const s = content(SL, "Try it: chain November, then remove a record");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 4 to 6",
    "$ python clients/python/evidence_export.py --records-json tests/fixtures/evidence/closed_records.json \\",
    "    --out-dir out/evidence-2026-11 --period 2026-11 --previous-manifest out/evidence/manifest.json \\",
    "    --generated-at 2026-12-01T12:00:00Z",
    "Chain head afa59e0f3038613ba36eb4a748da38bb3e76e8427d04038162d08fbdcc167bd1; written to out/evidence-2026-11",
    "# November's manifest.json:",
    "  \"chain_previous\": \"144f5e8494281f83598d2fae5eacac12b9b271c90372c0e503aafc2bd4cf0623\",",
    "$ python -c \"p='out/evidence/records.jsonl'; l=open(p).readlines(); del l[1]; open(p,'w').writelines(l)\"",
    "$ python clients/python/evidence_export.py --verify-dir out/evidence",
    "  records.jsonl: SHA-256 doesn't match the manifest",
    "  line 2 (IDF0000903): prev_sha256 doesn't match the line before",
    "Package does not hold: 2 problem(s).",
    "$ rm -rf out",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED)", pt: 11 });
  line(s, "Check", "Check your work: produce a package for a period, say what its problems are, and show whether a package you received still holds.", c + 0.25, 0.7, 14);
  sources(s, "Sources: Module 7, Unit 4 \"Exercise: Lab 1,\" steps 4 to 6; workbook Chapter 07, Lab 1.");
  notes(s,
`Step four starts November's chain from October's head. The export runs over the same fixture for period November, with the previous-manifest option pointing at October's manifest. On the slide, its first five lines are trimmed, because they repeat step two. The last line reports November's chain head, and November's manifest records October's head as its chain previous. So a period can't be swapped out without breaking the next one. Step five is the test that matters to an ISSO. A one-line Python command deletes the second record from October's records file, and then you verify again. The verifier finds two problems: the file's SHA-256 no longer matches the manifest, and the next line's previous hash no longer matches the line before it. The package does not hold. Step six deletes the out folder.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 4 to 6.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: export live from your developer instance");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "The developer instance from the earlier modules, with at least one finding closed in Module 6's Lab 2"],
    ["Create", "The evidence reader, and check its role against the kit's call list"],
    ["Export", "Live, from your developer instance"],
    ["Check", "The date format of due and finished"],
    ["Verify", "The package, with --verify-dir"],
    ["Back it out", "Delete out/evidence-live and the evidence reader's OAuth client, user and role"],
  ], { fontSize: 13, limit: 5.2 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the export runs under its own read-only role, never the verifier's, which could close findings.");
  sources(s, "Sources: Module 7, Unit 5 \"Exercise: Lab 2\"; workbook Chapter 07, \"Dangers\" and \"Lab 2: a ServiceNow developer instance.\"");
  notes(s,
`Lab 2 runs the export live against your own ServiceNow developer instance, with at least one finding closed in Module 6's Lab 2. Create the evidence reader, and check its role against the kit's call list. That matters: the export runs under its own read-only role, never the verifier's, because the verifier's role could close findings. Export live from your instance. Check the date format of the due and finished values, since that's one of the things the workbook couldn't verify. Then verify the package, exactly as you did in Lab 1. Back it out by deleting the live output folder and the evidence reader's OAuth client, user and role. The authors haven't run Lab 2.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test instance)"; Chapter 07 — "Dangers."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence to keep");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.3, 4.2, 4.65], ["Source", "NIST SP 800-53", "Evidence an ISSO keeps"], [
    ["Gate 7, the tempo", "CA-7, RA-7, CA-5, AU-6", "Scheduled run outputs and the five measures; window adherence and the overdue list; the exception register; the monthly package and its review"],
    ["Chapter 07, the records and the package", "CM-3, CA-7, AU-9", "The records, the manifest and the chain, verified with --verify-dir; summary.json"],
  ], { fontSize: 12.5, limit: 4.0 });
  callout(s, "Scope", b + 0.3, 1.15, "FaScaleBalanced", HEX.navy, "Not at Moderate: ",
    "AU-10 and CM-5(1), which Book 13 maps to the loop. At Moderate, the chain supports AU-9's integrity; signing is a further step.");
  sources(s, "Sources: Module 7, Unit 1 \"The federal requirement\"; Unit 7 \"Summary\"; guide, Gate 7 table; workbook Chapter 07, \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. The guide's Gate 7 table maps the tempo to NIST special publication eight hundred fifty-three: continuous monitoring, risk response, the plan of action and milestones, and audit record review. Chapter 07 maps the records and the package to configuration change control, continuous monitoring, and A U nine, protection of audit information. It also says what isn't evidenced yet: no approval, executing identity or run log until actuation is built. The evidence an ISSO keeps: the scheduled run outputs and the five measures, window adherence and the overdue list, the exception register, and the monthly package and its review; and from Chapter 07, the records, the manifest and the chain, verified, and the summary file. Two controls Book 13 maps to the loop, A U ten and C M five enhancement one, aren't in the Moderate baseline. At Moderate, the chain supports integrity, and signing the package is a further step.`,
  `${M} — Unit 1 "The federal requirement"; Unit 7 "Summary"; Chapter 07 — "Federal requirements and evidence."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on the evidence", [
    { q: "In each record, approval, executing_identity and what_ran are null. Why?", options: ["a. Pass 1 doesn't actuate, so the record that would hold them is a later pass; each null carries its reason", "b. The evidence reader can't read those fields", "c. Book 13's evidence record doesn't include them"] },
    { q: "How does the verifier catch a record removed from records.jsonl?", options: ["a. It compares the record count with the ServiceNow instance", "b. The file's SHA-256 no longer matches the manifest, and the next line's prev_sha256 no longer matches the line before", "c. It can't; a removed record is only found by an assessor"] },
  ], "1 a: the record says so rather than leaving the fields out or filling them. 2 b: see Lab 1, step 5.");
  sources(s, "Sources: Module 7, Unit 6 \"Knowledge check,\" questions 2 and 3, and \"Check your answers\"; workbook Chapter 07, \"What this chapter adds\" and Lab 1, step 5.");
  notes(s,
`Check yourself with two questions. First: in each record, approval, executing identity and what ran are null. Why? The answer is a. Pass 1 doesn't actuate, so the record that would hold them is a later pass, and each null carries its reason. The record says so, rather than leaving the fields out or filling them. Second: how does the verifier catch a record removed from the records file? The answer is b. The file's SHA-256 no longer matches the manifest, and the next line's previous hash no longer matches the line before it. You saw both in step five of the lab. The module page has two more questions, on why the export exits with one and on how window adherence is measured.`,
  `${M} — Unit 6 "Knowledge check," questions 2 and 3.`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary: you've finished the path");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Learned what Gate 7 runs and reports",
    "Exported a period's closed findings as Book 13 evidence records",
    "Chained one period to the next",
    "Verified a package the way an ISSO does, and caught a removed record",
  ], 13.5);
  const r = panel(s, "Path", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "THE PATH, END TO END", "Seven modules, Gates 1 to 7", [
    "The loop and the typed task",
    "Boundary, writers, sources and drift",
    "Drift to a task, the re-read, the evidence",
  ], 13.5);
  callout(s, "Next", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Before shipping: ",
    "work through the Chapter 07 checklist. What the workbook doesn't build yet is at the end of its chapters table.");
  sources(s, "Sources: Module 7, Unit 7 \"Summary\"; the learning path's index, \"Modules.\"");
  notes(s,
`To sum up. You learned what Gate 7 runs and reports. You exported a period's closed findings as Book 13 evidence records, chained one period to the next, and verified a package the way an ISSO does, including catching a record someone removed. Before shipping, work through the Chapter 07 checklist. And with that, you've finished the Ticket-to-Machine learning path. Across seven modules, you built the loop gate by gate: the typed task and its contract, the boundary and least privilege, one writer per attribute, the sources and the starting drift, drift to a task, the re-read rule, and now the evidence. What the workbook doesn't build yet, and why, is at the end of its chapters table. Thanks for working through the path.`,
  `${M} — Unit 7 "Summary"; the learning path's index — "Modules."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 7 deck", [
  "Module page: docs/training/ticket-to-machine/07-evidence-for-the-isso.md (Ticket-to-Machine learning path, Module 7), Units 1 to 7, and the path's verification log (docs/training/ticket-to-machine/_verification).",
  "The sections the module sends you to read: the example guide's Gate 7 (steps, requirements table, \"Interim path,\" \"Validate (G7 Tempo and evidence)\") and \"Evidence\"; the developer workbook's Chapter 07 (\"What exists,\" \"What this chapter adds,\" \"Dangers,\" \"Federal requirements and evidence,\" Lab 2); Book 13, Chapter 10 and Appendix B.",
  "Product pages Chapter 07 cites: ServiceNow Table API (Zurich); FedRAMP Marketplace data; SailPoint ISC v3 search Index enumeration (read November 1, 2026).",
  "Federal requirements: NIST SP 800-53 CA-5, CA-7, RA-7, AU-6, CM-3 and AU-9 at Moderate (SP 800-53B Moderate baseline, release 5.2.0; AU-10 and CM-5(1) not in it), as the guide's Gate 7 table and Chapter 07 map them.",
  "Lab output: examples/servicenow-sailpoint (evidence_export.py, tests/fixtures/evidence, test_evidence_export.py), run November 2, 2026 in a copy of the kit with Python 3.14.3; long lines wrapped and the Try it output trimmed. Lab 2 not run by the authors. Design guidance is labeled.",
]);

finish(OUT);
