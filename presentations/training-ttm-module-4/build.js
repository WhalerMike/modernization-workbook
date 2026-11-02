// Ticket-to-Machine learning path, Module 4: Sources and the Starting Drift — the module's narrated deck.
// Teaches docs/training/ticket-to-machine/04-sources-and-starting-drift.md, Learn-style: objectives, the concepts, two
// "Try it" slides with the real Lab 1 commands and output (run November 2, 2026 in a copy of
// examples/servicenow-sailpoint), Lab 2, what differs in government clouds, the federal requirement and evidence, a
// two-question check, and the summary. Every fact comes from the module page, the pages it sends the learner to (as its
// verification log says), or the kit; the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-ttm-module-4/build.js \
//                      presentations/training-ttm-module-4/Training_TTM_Module_4.pptx
const TITLE = "Module 4: Sources and the Starting Drift";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Ticket-to-Machine learning path, Module 4: Sources and the Starting Drift",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and labels the title slide for the Microsoft Automation path; this path's title slide
// and document title are set here.
P.D.pres.title = `Ticket-to-Machine learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "TICKET-TO-MACHINE LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_TTM_Module_4.pptx";
const M = "Training, Ticket-to-Machine, Module 4";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SA = "Where agencies are";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 4: Sources and the starting drift", "Ticket-to-Machine learning path · ServiceNow and SailPoint Identity Security Cloud · Guide Gate 3",
    ["Connecting the sources  ·  Book 03's drift classes  ·  The reconciliation", "Run over run  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 4 of the Ticket-to-Machine learning path: sources and the starting drift. Before you fix anything, you need to know how far the directory is from HR. This module follows the guide's Gate 3, which connects the sources, correlates them on one key, and files the first measurement as the baseline, and the developer workbook's Chapter 06. You'll run the kit's read-only drift reconciliation over two days of fictional data, compare the runs as new, persisting and resolved, and see the comparison refuse two runs that measured different things.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why each drift needs a number before a ticket");
  tag(s, "Why");
  const b = table(s, "Drift", 1.45, [5.0, 3.0, 4.15], ["What you find", "Drift class", "Book 03 severity"], [
    ["A terminated employee still enabled in Entra ID", "Stale access", "High"],
    ["An account that matches nobody", "Orphan account", "High"],
    ["A department someone typed by hand", "Attribute drift", "Medium"],
  ], { fontSize: 13.5, limit: 3.6 });
  callout(s, "Point", b + 0.3, 1.0, "FaChartLine", HEX.red, "Gate 3: ",
    "connect the sources, correlate them on one key, and file the first measurement as the baseline. Later gates are measured against it.");
  sources(s, "Sources: Module 4, Unit 1 \"Introduction\"; Book 03, Chapter 11, \"Drift between HR and the directory\"; the guide's Gate 3, step 6.");
  notes(s,
`Why measure first? Because drift comes in kinds, and each kind needs a number before it needs a ticket. A terminated employee who's still enabled in Entra ID is stale access, which Book 03 rates High. An account that matches nobody is an orphan account, also High. A department someone typed in by hand is attribute drift, rated Medium. Without a measurement you can't say how many there are, whether they're growing, or whether a fix worked. So Gate 3 connects the sources, correlates them on one key, and files the first measurement as the baseline. Every later gate is measured against it. In this module you run that measurement twice, on two days, and compare the days.`,
  `${M} — Unit 1 "Introduction"; Book 03, Chapter 11 — "Drift between HR and the directory"; the guide — "Step 3," step 6.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Explain what Gate 3 connects, the key it correlates on, and what it files as the baseline",
    "Name Book 03's drift classes, and say which ones the kit doesn't compute",
    "Run the drift reconciliation over fixtures, and compare two runs as new, persisting and resolved",
    "Explain why a comparison of runs that computed different classes is refused",
  ], [
    "Module 3",
    "For the Graph reads: Microsoft Automation, Module 1, the four request patterns",
    "Lab 1: the kit's fixtures; no tenant",
    "Lab 2: a test Entra tenant and a SailPoint sandbox",
  ], 45);
  sources(s, "Sources: Module 4, Unit 1 \"Learning objectives,\" \"Prerequisites\"; Unit 5 \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about forty-five minutes with the lab. You'll explain what Gate 3 connects, the key it correlates on, and what it files as the baseline. You'll name Book 03's drift classes, and say which ones the kit doesn't compute. You'll run the drift reconciliation over fixtures and compare two runs as new, persisting and resolved. And you'll explain why a comparison of runs that computed different classes is refused. You need Module 3 first. For the Graph reads, the Microsoft Automation path's first module covers the four request patterns. Lab 1 runs on fixtures; Lab 2 needs a test tenant and a SailPoint sandbox.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Gate 3 steps
{
  const s = content(SC, "Gate 3: connect, correlate on employeeId, measure");
  tag(s, "What");
  const b = table(s, "Steps", 1.45, [0.6, 3.9, 7.65], ["", "Step", "What it means"], [
    ["1", "Aggregate HR into SailPoint", "As the authoritative source, read-only under Gate 2's first pattern"],
    ["2", "Connect Entra ID and AD", "The Entra SaaS connector, and the AD connector through the virtual appliance"],
    ["3", "Correlate on employeeId", "The key Book 03 joins on; uncorrelated accounts are orphan candidates, not errors to suppress"],
    ["4", "Turn on Native Change Detection", "On the Entra and AD sources: one event per changed account on aggregation"],
    ["5", "Run the kit's reconciliation", "Read-only: HR extract, Graph and ISC joined on employeeId; Book 03's classes as JSON and CSV"],
    ["6", "File the first run as the baseline", "Expect a burst of High findings in the first month: the measurement working"],
  ], { fontSize: 12, limit: 6.55 });
  sources(s, "Sources: Module 4, Unit 2; the guide's \"Step 3: Connect the sources and measure the starting drift.\"");
  notes(s,
`Gate 3 has six steps. One: aggregate HR into SailPoint as the authoritative source, read-only under Gate 2's first pattern. Two: connect Entra ID and Active Directory as SailPoint sources, the Entra connector and the Active Directory connector through the virtual appliance. Three: correlate on employee I D, the key Book 03 joins on, and treat uncorrelated accounts as orphan candidates, not errors to suppress. Four: turn on Native Change Detection on the Entra and Active Directory sources. It compares stored and newly read data on aggregation, and fires one event per changed account. Five: run the kit's drift reconciliation, read-only. And six: file the first run as the baseline. Expect a burst of High findings in the first month. Book 03 calls that the measurement working.`,
  `${M} — Unit 2 "Connecting the sources"; the guide — "Step 3: Connect the sources and measure the starting drift," Steps.`);
}

// ================================================================== 5 Drift classes
{
  const s = content(SC, "Book 03's drift classes, and what the kit computes");
  tag(s, "What");
  const b = table(s, "Classes", 1.45, [2.8, 5.2, 1.4, 2.75], ["Class", "Detection signal", "Severity", "In the kit"], [
    ["Missing identity", "Active HR records without a matching employeeId", "High", "Computed"],
    ["Stale access", "Terminated in HR, enabled in Entra or AD", "High", "Computed"],
    ["Orphan account", "Enabled accounts with no or unknown employeeId", "High", "Computed"],
    ["Attribute drift", "Field-by-field comparison", "Medium", "Department, manager"],
    ["Unauthorized write", "Entra audit: a writer other than the provisioning service", "High", "Only with the audit"],
    ["Credential drift", "Card system status and Intune certificate reports", "High", "Not computed"],
    ["Schema drift", "The middleware's validation output", "Medium", "Not computed"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "Defaults", "The severities are the program's defaults, not an external standard. A class not computed is said, in not_computed, not implied.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 4, Unit 2; Book 03, Chapter 11, \"Drift between HR and the directory\"; workbook Chapter 06, \"What exists.\"");
  notes(s,
`Here are Book 03's drift classes, the ones the finding contract carries, and what the kit computes. Missing identity: an active HR record with no matching account. Stale access: terminated in HR, enabled in the directory. Orphan account: an enabled account with no known employee I D. Those three are High, and the kit computes them. Attribute drift is Medium, and the kit compares department and manager. Unauthorized write, a write by anyone but the provisioning service, is High, and it's computed only when the run reads the Entra audit. Credential drift and schema drift are always reported as not computed, because they need the card system, Intune and the middleware's output. The severities are the program's defaults, not an external standard.`,
  `${M} — Unit 2 "Connecting the sources"; Book 03, Chapter 11 — "Drift between HR and the directory"; workbook Chapter 06 — "What exists."`);
}

// ================================================================== 6 The reconciliation
{
  const s = content(SC, "The reconciliation: inputs, stable IDs, outputs");
  tag(s, "How");
  const l = panel(s, "In", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "INPUTS (SAVED EXPORTS IN THE LABS)", "identity_drift.py, read-only", [
    "An HR extract: CSV, employeeId and status required",
    "Graph users: employeeId, accountEnabled, department, the manager's employeeId",
    "ISC identities from Search, and uncorrelated accounts",
    "Optionally, the Entra directory audit",
  ], 13);
  const r = panel(s, "Out", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "FINDING IDS AND OUTPUTS", null, [
    "Each ID hashes class, system, employee ID, object ID and attribute: the same drift, the same ID, every run",
    "The PowerShell client produces the same IDs",
    "JSON and CSV, with the classes computed and not computed",
    "--push-to-servicenow writes nothing without --apply",
  ], 13);
  line(s, "Events", "Events catch changes as they happen; the reconciliation catches the state, including drift whose event was missed.", Math.max(l, r) + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 4, Unit 3; workbook Chapter 06, \"In this chapter,\" \"What exists\"; implementation example, \"Build 3.\"");
  notes(s,
`The reconciliation is the kit's Build 3. It reads an HR extract, a C S V where employee I D and status are required; Graph users with their employee I D, enabled flag, department and manager's employee I D; SailPoint identities from Search and uncorrelated accounts; and, optionally, the Entra directory audit. In the labs each one is a saved export. Each finding's I D is a hash of its class, system, employee I D, object I D and attribute, so the same drift gets the same I D on every run, and the PowerShell client produces the same I Ds. It writes JSON and C S V, saying which classes were and weren't computed. Why run it at all, when events exist? Events catch changes as they happen; the reconciliation catches the state, including drift whose event was missed.`,
  `${M} — Unit 3 "Run over run"; workbook Chapter 06 — "In this chapter," "What exists."`);
}

// ================================================================== 7 Run over run
{
  const s = content(SC, "Run over run: new, persisting, resolved");
  tag(s, "How");
  const b = table(s, "Cmp", 1.45, [2.3, 4.5, 5.35], ["drift_compare.py", "Meaning", "What to do"], [
    ["New", "In this run, not the last", "Raise it"],
    ["Persisting", "In both runs", "Already raised; the de-duplication adds a counter"],
    ["Resolved", "In the last run, not this one: no longer measured", "A lead for the re-read; its record closes only on reread_verification.py"],
  ], { fontSize: 13, limit: 3.8 });
  callout(s, "Refuse", b + 0.3, 1.05, "FaTriangleExclamation", HEX.red, "It refuses ",
    "runs that computed different classes, one with the audit and one without: every finding of the class the second run skipped would look resolved.");
  line(s, "Day2", "The day-two fixture: HR corrects Erin's department to Finance, the value already typed into Entra ID. Graph now agrees; ISC, not yet re-aggregated, doesn't.", b + 1.6, 0.7, 13.5);
  sources(s, "Sources: Module 4, Unit 3; workbook Chapter 06, \"What this chapter adds\"; tests/fixtures/hr_extract_day2.csv.");
  notes(s,
`A scheduled run should raise only what's new, so Chapter 06 adds a comparison by finding I D. New means raise it. Persisting means it's already raised, and the de-duplication adds a counter. Resolved means it's no longer measured. That's a lead for the re-read, not a closure: its record still closes only on the re-read client. And the comparison refuses runs that computed different classes, one with the audit and one without, because every finding of the class the second run skipped would look resolved. The lab's day-two fixture tells a small story. HR corrects Erin's department from HR to Finance, the value someone had already typed into Entra ID by hand. Graph now agrees with HR. SailPoint, not yet re-aggregated, doesn't.`,
  `${M} — Unit 3 "Run over run"; workbook Chapter 06 — "What this chapter adds."`);
}

// ================================================================== 8 Dangers
{
  const s = content(SC, "Dangers of a nightly run, and the guards");
  tag(s, "Why");
  const b = table(s, "Dangers", 1.45, [3.8, 4.5, 3.85], ["Danger", "What happens", "The guard"], [
    ["A class one run skipped looks resolved", "Unauthorized writes \"disappear\" the night the audit read fails", "The comparison refuses the runs"],
    ["A resolved finding closes the record", "Drift that left the measurement, not the estate, is called fixed", "Only the re-read closes"],
    ["Pushing every finding every night", "The tracker fills with repeats", "Push only what's new"],
    ["The first month's burst read as failure", "The pipeline is turned off before it's tuned", "Triage by class and severity"],
    ["An HR extract with names in a shared folder", "Personal data spreads", "Keep runs where HR data is allowed; delete lab copies"],
  ], { fontSize: 12, limit: 5.6 });
  sources(s, "Sources: Module 4, Unit 3; workbook Chapter 06, \"Dangers.\"");
  notes(s,
`Chapter 06's dangers are worth reading before you schedule anything. A class one run skipped looks resolved: unauthorized writes disappear on the night the audit read fails. The guard is the comparison's refusal. A resolved finding closes the record: drift that left the measurement, not the estate, gets called fixed. The guard is that only the re-read closes. Pushing every finding every night fills the tracker with repeats, so push only the comparison's new findings. The first month's burst gets read as failure, and the pipeline is turned off before it's tuned. Book 03 expects that burst, so triage it by class and severity. And an HR extract with names in a shared folder spreads personal data. The run folder is evidence: keep it where HR data is allowed.`,
  `${M} — Unit 3 "Run over run"; workbook Chapter 06 — "Dangers."`);
}
endModule(SC);

// ================================================================== 9 Try it: day one
{
  const s = content(SL, "Try it: measure day one");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 2, in examples/servicenow-sailpoint (fixtures, no tenant)",
    "$ python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract.csv \\",
    "    --config tests/fixtures/config.fixtures.json --graph-users-json tests/fixtures/graph_users.json \\",
    "    --isc-identities-json tests/fixtures/isc_identities.json --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json \\",
    "    --entra-audit-json tests/fixtures/entra_audit.json --out-json out/day1.json --out-csv out/day1.csv",
    "  \"counts\": { \"attribute_drift\": 4, \"missing_identity\": 2, \"orphan_account\": 3, \"stale_access\": 2, \"unauthorized_write\": 1 },",
    "  \"not_computed\": { \"credential_drift\": ..., \"schema_drift\": ... },",
    "# Print Erin's and Carol's rows from out/day1.csv (one line in the lab)",
    "$ python -c \"import csv, json; [print(r['drift_class'], r['system'], r['employee_id'], r['attribute'], r['expected'], '->',",
    "    r['observed'], json.loads(r['evidence']).get('initiated_by', '')) for r in csv.DictReader(open('out/day1.csv',",
    "    encoding='utf-8')) if r['employee_id'] in ('E1002', 'E1004')]\"",
    "attribute_drift entra E1004 department HR -> Finance",
    "attribute_drift entra E1004 manager E1000 -> E1001",
    "attribute_drift isc E1004 manager E1000 -> E1001",
    "stale_access entra E1002 accountEnabled false -> true",
    "stale_access isc E1002 disabled true -> false",
    "unauthorized_write entra E1004 Department [\"HR\"] -> [\"Finance\"] helpdesk.admin@contoso.example",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (SUMMARY JSON FOLDED; COMMANDS WRAPPED)", pt: 10.5 });
  line(s, "Read", "Erin's department: HR expects HR, Entra ID holds Finance, typed by a help-desk account. Carol is terminated, and enabled in both. Step 1: 17 passed.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 4, Unit 4 \"Exercise: Lab 1,\" steps 1 and 2; workbook Chapter 06, Lab 1; tests/fixtures (fictional).");
  notes(s,
`Try it. Lab 1 runs in the kit's folder against fictional fixtures. Step one runs the drift and comparison tests: seventeen pass. Step two runs day one. The summary counts four attribute drifts, two missing identities, three orphan accounts, two stale access and one unauthorized write, and lists credential and schema drift as not computed. Then a one-line script prints Erin's and Carol's rows. Erin's department: HR expects HR, but Entra ID holds Finance, and the audit shows a help-desk account wrote it. That's both attribute drift and an unauthorized write. Her manager differs too, in Entra ID and in SailPoint. Carol is terminated in HR, but enabled in Entra ID and not disabled in SailPoint: stale access, twice.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2; workbook Chapter 06 — "Lab 1."`);
}

// ================================================================== 10 Try it: compare
{
  const s = content(SL, "Try it: compare day two, then a run without the audit");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 3 runs day two with hr_extract_day2.csv: the same counts. The totals hide what moved.",
    "$ python clients/python/drift_compare.py --previous out/day1.json --current out/day2.json",
    "1 new, 11 persisting, 1 resolved",
    "  new       6456e1f12a60e6be attribute_drift isc E1004 department: expected 'Finance', observed 'HR'",
    "  resolved  1f0e34ebf049f163 attribute_drift entra E1004 department: expected 'HR', observed 'Finance'",
    "Resolved findings are leads for the re-read; their records close only on reread_verification.py.",
    "# Step 5 runs day two without --entra-audit-json: unauthorized_write moves to not_computed",
    "$ python clients/python/drift_compare.py --previous out/day1.json --current out/day2-noaudit.json",
    "error: The runs computed different drift classes (previous: attribute_drift, missing_identity, orphan_account,",
    "  stale_access, unauthorized_write; current: attribute_drift, missing_identity, orphan_account, stale_access).",
    "  A class one run didn't compute would look resolved; rerun with the same inputs.",
  ], { label: "TRY IT  ·  LAB 1 STEPS 4 AND 5, RUN NOVEMBER 2, 2026 (THE TWO DAY-TWO RUNS SUMMARIZED; THE ERROR WRAPPED)", pt: 10.5 });
  const b = table(s, "Read", c + 0.25, [2.6, 9.55], ["Step", "What it shows"], [
    ["4: exit 0", "Entra ID now agrees with HR (resolved: a lead); ISC, not re-aggregated, now differs (new)"],
    ["5: exit 2", "Without the refusal, the unauthorized write would have looked resolved. Step 6 deletes out"],
  ], { fontSize: 12.5, limit: 6.55 });
  sources(s, "Sources: Module 4, Unit 4 \"Exercise: Lab 1,\" steps 3 to 6; workbook Chapter 06, Lab 1.");
  notes(s,
`Step three runs day two, after HR's correction. The counts are exactly the same, and the totals hide what moved. Step four compares the days: one new, eleven persisting, one resolved. The resolved finding is Erin's department in Entra ID, which now agrees with HR. It's a lead for the re-read, and the tool says so: its record closes only on the re-read client. The new finding is Erin's department in SailPoint, which hasn't been re-aggregated and still holds the old value. Step five runs day two without the audit, so unauthorized write moves to not computed, and the comparison refuses: the runs computed different classes. It exits two. Without that refusal, the unauthorized write would have looked resolved. Step six deletes the output folder.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 3 to 6; workbook Chapter 06 — "Lab 1."`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: measure your test tenant on two days");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A test Entra tenant in the worldwide or GCC cloud, a SailPoint sandbox, and synthetic HR data like the fixtures"],
    ["Grant", "The read permissions from Module 2"],
    ["Run", "Write a synthetic HR extract that matches test users; run the client live on two days; compare the runs"],
    ["Push", "Nothing to ServiceNow"],
    ["Back it out", "Step 5: delete out, the synthetic extract, the app registration's permissions and certificate, and the sandbox API client"],
  ], { fontSize: 13, limit: 5.0 });
  callout(s, "NotRun", b + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow Chapter 06, Lab 2. The manager expansion and the ISC employee ID attribute are on the verify list.");
  sources(s, "Sources: Module 4, Unit 5 \"Exercise: Lab 2\"; workbook Chapter 06, \"Illustrative code\" note.");
  notes(s,
`Lab 2 runs the client live. You need a test Entra tenant in the worldwide or GCC cloud, a SailPoint sandbox, and synthetic HR data like the fixtures. Grant the read permissions from Module 2, and nothing more. Write a synthetic HR extract that matches your test users, run the client against the tenant and the sandbox on two days, and compare the runs. Push nothing to ServiceNow. Two things the fixtures can't prove are on the verify list: the manager expansion, and SailPoint's employee I D attribute. Back it out in step five: delete the output folder, the synthetic extract, the app registration's permissions and certificate, and the sandbox API client. The authors haven't run Lab 2; follow Chapter 06's Lab 2.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test instance)"; workbook Chapter 06 — "Illustrative code."`);
}
endModule(SL);

// ================================================================== 12 Where agencies are
{
  const s = content(SA, "Where agencies are: GCC, GCC High, and interim paths");
  tag(s, "Who");
  const b = table(s, "Gov", 1.45, [2.6, 9.55], ["Tenant", "What changes for Gate 3"], [
    ["GCC", "Uses the worldwide endpoints"],
    ["GCC High", "Set the Entra source's Graph and token endpoints to graph.microsoft.us and login.microsoftonline.us; the connector documents the overrides"],
    ["ISC FedRAMP", "Native Change Detection's presence there wasn't confirmed (Gate 1, step 2)"],
  ], { fontSize: 13, limit: 4.0 });
  panel(s, "Interim", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "INTERIM PATH", "Without SailPoint, or before it's connected", [
    "Run the kit's reconciliation against the HR extract and Graph alone: the ISC inputs are optional files",
    "AD-only groups wait for the virtual appliance",
  ], 13);
  sources(s, "Sources: Module 4, Unit 2; the guide's Gate 3, step 2, Availability and Interim path; \"Where agencies start.\"");
  notes(s,
`Where are agencies? Most on this path run Microsoft 365 GCC, and a minority GCC High. GCC tenants use the worldwide endpoints. In GCC High, you set the Entra source's Graph and token endpoints to graph dot microsoft dot U S and login dot microsoftonline dot U S; SailPoint's Entra connector documents those overrides. One open question for every tenant: Native Change Detection's presence in SailPoint's FedRAMP environment wasn't confirmed, which is one of the things Gate 1 asks SailPoint in writing. The interim path: without SailPoint, or before it's connected, run the kit's reconciliation against the HR extract and Graph alone, because the SailPoint inputs are optional files. Active Directory-only groups wait for the appliance.`,
  `${M} — Unit 2 "Connecting the sources"; the guide — "Where agencies start"; "Step 3," step 2, Availability and Interim path.`);
}
endModule(SA);

// ================================================================== 13 Validate
{
  const s = content(SS, "Validate Gate 3 before you file the baseline");
  tag(s, "How");
  const b = table(s, "Val", 1.45, [3.0, 9.15], ["Check", "What it proves"], [
    ["Kit tests (logic, mocked)", "test_identity_drift.py and the Pester tests: the classes on the fixtures, the same finding IDs from both clients, unauthorized writes reported as not computed without an audit extract"],
    ["Live", "On a synthetic HR extract, the findings match a hand count (kit lab item 4)"],
    ["Validation kit", "VK-HR-01 (enabled members with no employeeId) and VK-HR-04 (duplicate employeeId values) are clean, or each row has an owner"],
    ["Rollback", "Disconnect the source or turn off Native Change Detection; the gate only reads"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Key", b + 0.3, 0.95, "FaHashtag", HEX.navy, "Why the key checks come first: ",
    "the join depends on employeeId. A missing or duplicate key turns a person into an orphan or a missing identity.");
  sources(s, "Sources: Module 4, Unit 2; the guide's \"Validate (G3 Sources and starting drift).\"");
  notes(s,
`Before you file the baseline, validate the gate. The guide names four checks. The kit's tests prove the logic against mocked data: the drift classes on the fixtures, the same finding I Ds from the Python and PowerShell clients, and unauthorized writes reported as not computed when there's no audit extract. Live, the reconciliation's findings on a synthetic HR extract should match a hand count. The validation kit's two H R checks look at the key itself: enabled members with no employee I D, and duplicate employee I D values. Each should be clean, or each row should have an owner, because the join depends on the key. And rollback is simple, because the gate only reads: disconnect the source, or turn off Native Change Detection.`,
  `${M} — Unit 2 "Connecting the sources"; the guide — "Validate (G3 Sources and starting drift)."`);
}

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence to keep");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.9, 4.25, 4.0], ["SP 800-53", "What Gate 3 does", "Evidence the ISSO keeps"], [
    ["AC-2 Account Management", "Finds accounts with no worker, and workers with no account", "The baseline drift report"],
    ["CA-7 Continuous Monitoring", "Starts a repeatable comparison of the record and the estate", "The report, its date, the checker version"],
    ["CM-8 Inventory, for identities (inference)", "One correlated inventory of accounts per person", "Correlation rate; uncorrelated-account list"],
  ], { fontSize: 12.5, limit: 4.0 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "FROM CHAPTER 06 (AC-2, CA-7, SI-4)", null, [
    "Each run's JSON and CSV, with not_computed: what wasn't measured is said, not implied",
    "The comparison output, kept with each run",
  ], 12.5);
  sources(s, "Sources: Module 4, Unit 1 \"The federal requirement\"; Unit 7 \"Summary\"; the guide's Gate 3 requirements; workbook Chapter 06, \"Federal requirements.\"");
  notes(s,
`The federal requirement. The guide maps Gate 3 to NIST special publication eight hundred fifty-three. A C two, account management: it finds accounts with no worker, and workers with no account, and the baseline drift report is the evidence. C A seven, continuous monitoring: it starts a repeatable comparison of the record and the estate, kept with its date and checker version. And, by inference, C M eight, read for identities: one correlated inventory of accounts per person, shown by the correlation rate and the uncorrelated-account list. Chapter 06 maps the reconciliation and the comparison to account management, continuous monitoring and system monitoring, and adds each run's JSON and C S V, with what wasn't computed, and the comparison output kept with each run.`,
  `${M} — Unit 1 "The federal requirement"; Unit 7 "Summary"; the guide — Gate 3 requirements and evidence, "Validate (G3)"; workbook Chapter 06 — "Federal requirements and evidence."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on drift runs", [
    { q: "On day two, Entra ID matches HR for Erin's department. How does drift_compare.py report the day-one Entra finding?", options: ["a. As resolved, a lead for the re-read; its record still closes only on reread_verification.py", "b. As closed, and it closes the ServiceNow record", "c. As persisting, until ISC is re-aggregated"] },
    { q: "Why does drift_compare.py refuse to compare day one (with the audit) and day two (without it)?", options: ["a. The two runs have different file names", "b. Every unauthorized-write finding would look resolved, because the second run didn't compute that class", "c. It needs the audit on both days to compute finding IDs"] },
  ], "1 a: a resolved finding is a lead, not a closure. 2 b: a class one run skipped would look resolved.");
  sources(s, "Sources: Module 4, Unit 6 \"Knowledge check,\" questions 2 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions from the module's knowledge check. First: on day two, Entra ID matches HR for Erin's department. How does the comparison report the day-one Entra finding? The answer is a. As resolved, a lead for the re-read. Its record still closes only on the re-read client. A resolved finding is a lead, not a closure. Second: why does the comparison refuse to compare day one, with the audit, and day two, without it? The answer is b. Every unauthorized-write finding would look resolved, because the second run didn't compute that class. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 2 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 5, a typed task");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Learned how Gate 3 connects the sources and correlates them on employeeId",
    "Named Book 03's drift classes, and the two the kit doesn't compute",
    "Measured drift over two days, and compared the runs",
    "Saw why a comparison refuses runs that measured different things",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 5: Drift to a typed task", [
    "Predict the finding an ISC event produces",
    "Test a workflow change before you import it",
  ], 13.5);
  callout(s, "Ship", Math.max(l, r) + 0.3, 0.9, "FaListCheck", HEX.teal, "Before you ship: ",
    "work through the Chapter 06 checklist, and file the first run as the baseline.");
  sources(s, "Sources: Module 4, Unit 7 \"Summary\"; Module 5; Learning path index, \"What you'll be able to do\"; workbook Chapter 06, \"Checklist.\"");
  notes(s,
`To sum up. You learned how Gate 3 connects HR, Entra ID and Active Directory through SailPoint, and correlates them on employee I D, with uncorrelated accounts treated as orphan candidates. You named Book 03's drift classes, and the two the kit never computes. You measured drift over two days, and compared the runs as new, persisting and resolved. And you saw why the comparison refuses runs that measured different things, so nothing looks fixed just because it stopped being measured. Before you ship, work through the Chapter 06 checklist, and file the first run as the baseline. Next is Module 5, drift to a typed task: you'll predict the finding a SailPoint event produces, and test a workflow change before you import it.`,
  `${M} — Unit 7 "Summary"; workbook Chapter 06 — "Checklist"; Learning path index — "What you'll be able to do," "Modules."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/ticket-to-machine/04-sources-and-starting-drift.md (Ticket-to-Machine learning path, Module 4), Units 1 to 7, and the path's index. Its verification log (docs/training/ticket-to-machine/_verification) says every fact is on a page the module links; the deck uses only those pages.",
  "Pages the module sends you to: the example guide, \"Step 3: Connect the sources and measure the starting drift\" (steps, Gate 3 requirements and evidence, availability, interim path, Validate (G3)) and \"Where agencies start\"; Book 03, Chapter 11, \"Drift between HR and the directory\"; the implementation example's \"Build 3.\"",
  "Developer workbook Chapter 06 (in this chapter, what exists, what this chapter adds, Lab 1, Lab 2, federal requirements, dangers, checklist). NIST SP 800-53 Rev. 5 controls as the guide and Chapter 06 map them: AC-2, CA-7, SI-4, and CM-8 by inference.",
  "Lab output: a copy of examples/servicenow-sailpoint (identity_drift.py, drift_compare.py, tests/fixtures with fictional people), run November 2, 2026 with Python 3.14.3, exactly as the module's Lab 1 gives the commands; the Try it output is trimmed where the slides say so. Lab 2 not run by the authors. Inferences are labeled.",
]);

finish(OUT);
