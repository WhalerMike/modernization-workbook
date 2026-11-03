// Ticket-to-Machine learning path, Module 1: The Loop and the Typed Task — the module's narrated deck.
// Teaches docs/training/ticket-to-machine/01-the-loop-and-the-typed-task.md, Learn-style: objectives, the concepts, two
// "Try it" slides with the real Lab 1 commands and output (run November 2, 2026 in a copy of
// examples/servicenow-sailpoint), Lab 2, the federal requirement and evidence, a two-question check, and the summary.
// Every fact comes from the module page, the pages it sends the learner to (as its verification log says), or the kit;
// the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-ttm-module-1/build.js \
//                      presentations/training-ttm-module-1/Training_TTM_Module_1.pptx
const TITLE = "Module 1: The Loop and the Typed Task";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Ticket-to-Machine learning path, Module 1: The Loop and the Typed Task",
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
const OUT = process.argv[2] || "Training_TTM_Module_1.pptx";
const M = "Training, Ticket-to-Machine, Module 1";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 1: The loop and the typed task", "Ticket-to-Machine learning path · ServiceNow and SailPoint Identity Security Cloud · Guide Gate 4",
    ["The five-step loop  ·  Where the kit sits  ·  The identity finding's contract", "Severity and tempo  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 1 of the Ticket-to-Machine learning path: the loop and the typed task. This path builds the identity half of the Federal Modernization Workbook's Ticket-to-Machine loop on two named products: ServiceNow as the front door and the record, and SailPoint Identity Security Cloud for identity governance. They're an example, not an endorsement. This module starts at the guide's Gate 4, because every other gate writes or reads the record that gate defines: the identity finding. You'll map the kit's files to the loop's five steps, learn the finding's data contract, and check payloads on a laptop the way ServiceNow will, before anything reaches an instance.`,
  `${M} — Unit 1 "Introduction"; Learning path index, "An example, not an endorsement," "Modules."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a ticket marked done isn't a record");
  tag(s, "Why");
  const b = table(s, "Asks", 1.45, [3.4, 4.0, 4.75], ["An assessor asks", "A ticket closed on \"done\"", "A typed task carries"], [
    ["Who owns it?", "Nobody can say who owned the drift", "An owner"],
    ["By when?", "Nobody can say when it fell due", "A severity and a clock: a due date"],
    ["Under whose approval?", "It told a person to open a console", "An approval, added in later chapters"],
    ["With what evidence of closure?", "A claim: \"done\"", "An intended state a later re-read can check"],
  ], { fontSize: 13, limit: 4.7 });
  callout(s, "Point", b + 0.3, 0.95, "FaClipboardCheck", HEX.red, "Book 13's answer: ",
    "one record with a class, a severity, an owner, a clock and an intended state. Every step of the loop writes or reads it.");
  sources(s, "Sources: Module 1, Unit 1 \"Introduction\"; Book 13, Appendix B, \"The coordination loop\" (the four questions an assessor asks).");
  notes(s,
`Why start with a record? Picture your agency's service desk. An access ticket closes when a technician types done. Nobody can say who owned the drift, when it fell due, or what the account should look like afterward. An evidence record has to answer four questions about every finding: who owns it, by when, under whose approval, and with what evidence of closure. In NIST special publication eight hundred fifty-three, control C M three asks for that record directly. A ticket closed on done answers none of them; it records a claim. The workbook's answer is a typed task: one record with a class, a severity, an owner, a clock, and an intended state that a later re-read can check. Approval comes in later modules. Every step of the loop writes or reads this record, so it's where you start.`,
  `${M} — Unit 1 "Introduction"; Book 13, Appendix B — "The coordination loop."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Explain the loop's five steps, and name the kit file that performs each one",
    "Describe the fields of the identity finding's data contract, and what each is for",
    "Validate a payload on a laptop, and predict whether ServiceNow accepts, rejects or de-duplicates it, and when it falls due",
    "Recognize an intended state that gives the re-read nothing to check",
  ], [
    "Book 13, Chapter 10; skim Appendix B",
    "Read Python and JSON; run a terminal",
    "Lab 1: Python 3.10+ with pytest and requests; Node.js 18+; a Bash-compatible shell",
    "No ServiceNow instance or SailPoint tenant until Lab 2",
  ], 50);
  sources(s, "Sources: Module 1, Unit 1 \"Learning objectives,\" \"Prerequisites\"; Learning path index, \"Prerequisites,\" \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll explain the loop's five steps and name the file in the kit that performs each one. You'll describe the fields of the identity finding's data contract and what each one is for. You'll validate a finding payload on a laptop, and predict whether ServiceNow accepts it, rejects it or de-duplicates it, and when it falls due. And you'll recognize an intended state that gives the re-read nothing to check. Before you start, read Chapter 10 of the Governance, Drift and Evidence book, and skim its Appendix B. For Lab 1 you need Python, Node.js and a Bash-compatible shell. You don't need a ServiceNow instance or a SailPoint tenant until Lab 2.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; Learning path index — "Prerequisites," "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 The loop
{
  const s = content(SC, "The loop: five steps, and a layer that never writes");
  tag(s, "What");
  const w = 2.3, gap = 0.16;
  const steps = [
    ["1 TEST", "A rule checks actual state against the authoritative record"],
    ["2 DETECT DRIFT", "A difference becomes a typed finding with a severity"],
    ["3 RAISE A TYPED TASK", "Against the configuration item, with an owner and a clock"],
    ["4 ACTUATE", "On the native surface, under a service identity"],
    ["5 CLOSE WITH EVIDENCE", "Re-read the post-change state; one record of the chain"],
  ];
  let bottom = 0;
  steps.forEach(([lab, t], k) => {
    bottom = Math.max(bottom, panel(s, `S${k + 1}`, 0.6 + k * (w + gap), 1.45, w, 1.6, [HEX.navy, HEX.navy, HEX.teal, HEX.amber, HEX.teal][k],
      [HEX.navyTint, HEX.navyTint, HEX.tealTint, HEX.amberTint, HEX.tealTint][k], lab, null, [t], 13));
  });
  callout(s, "Layer", bottom + 0.3, 0.95, "FaRoute", HEX.navy, "The coordination layer ",
    "never writes the configuration itself. In the program's model the ticket authorizes a machine; the person's role ends at approval.");
  sources(s, "Sources: Module 1, Unit 2; Book 13, Appendix B, \"The coordination loop.\"");
  notes(s,
`The loop has five steps. One, test: a rule evaluates actual state against the authoritative record. Two, detect drift: a difference becomes a typed finding with a severity. Three, raise a typed task against the reconciled configuration item, with an owner and a clock. Four, actuate on the native surface, under a service identity, through the platform's own interface. And five, close with evidence: re-read the post-change state and write one record of the whole chain. The coordination layer in front of the native tools never writes the configuration itself. Its job is to make every drift an owned, clocked, approved and evidenced piece of work. In the program's model, the ticket authorizes a machine, and the person's role ends at approval.`,
  `${M} — Unit 2 "The loop, and where the kit sits"; Book 13, Appendix B — "The coordination loop."`);
}

// ================================================================== 5 Where the kit sits
{
  const s = content(SC, "Where the kit sits in the loop, in Pass 1");
  tag(s, "What");
  const b = table(s, "Kit", 1.45, [2.6, 7.9, 1.65], ["Loop step", "What does it in the kit", "Chapter"], [
    ["1 Test", "identity_drift.py joins the HR extract, Microsoft Graph and ISC on employeeId", "06"],
    ["2 Detect drift", "ISC event triggers (native change, attribute change) and the drift client", "04, 06"],
    ["3 Raise a typed task", "The ISC workflows' HTTP Request step and the Scripted REST resource, which writes u_identity_finding", "01, 04"],
    ["4 Actuate", "Not in Pass 1: no code writes to Entra ID, Active Directory or ISC", "—"],
    ["5 Close with evidence", "A business rule turns any close into Awaiting verification; reread_verification.py closes on a re-read", "05, 07"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Gap", b + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Note the empty step: ",
    "actuation has no code in Pass 1; it's left to a later pass. You'll meet it again in Module 6.");
  sources(s, "Sources: Module 1, Unit 2; workbook Chapter 01, \"The loop, and where the kit sits.\"");
  notes(s,
`Now map the kit onto that loop. Step one, test, is the drift client, which joins the HR extract, Microsoft Graph and SailPoint on employee I D. Step two, detect drift, is SailPoint's event triggers, for a native change or an attribute change, plus the drift client. Step three, raise a typed task, is the SailPoint workflows' HTTP Request step and the Scripted REST resource in ServiceNow, which writes the identity finding table. Step five, close with evidence, is a business rule that turns any close into Awaiting verification, and the re-read client, which closes only on a re-read. Notice step four. Actuation has no code in Pass 1: nothing in the kit writes to Entra ID, Active Directory or SailPoint. You'll meet that step again in Module 6.`,
  `${M} — Unit 2 "The loop, and where the kit sits"; workbook Chapter 01 — "The loop, and where the kit sits."`);
}

// ================================================================== 6 Products and gaps
{
  const s = content(SC, "The products at each step, and four gaps");
  tag(s, "What");
  const b = table(s, "Gaps", 1.45, [3.3, 5.6, 3.25], ["Gap", "What the products do as shipped", "Fixed at"], [
    ["1 A ticket status isn't a re-read", "SailPoint's Service Desk integration treats its task as complete from the mapped ServiceNow status", "Gate 6: close only on a re-read"],
    ["2 Catalog app moves approval", "Requests follow ServiceNow's approval process; Book 15 decides owner-governed access in the governance platform", "Gate 2: one approver system per class"],
    ["3 No change-request tickets", "ISC's Service Desk integration supports only Service Request and Incident tickets", "Gate 5: a ServiceNow flow raises it"],
    ["4 Two doors into the directory", "SailPoint can provision Entra ID and AD; Book 03 makes inbound provisioning the one writer", "Gate 2: one writer per attribute"],
  ], { fontSize: 12, limit: 5.1 });
  line(s, "Front", "Gate 4, the front door: a SailPoint workflow posting to a ServiceNow endpoint (a build), the Service Catalog app, and Service Desk tickets.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 1, Unit 2; the guide's \"The loop at a glance\" and its four gaps.");
  notes(s,
`The example guide shows which product does each step. For raising a typed task, which is Gate 4, it's a SailPoint workflow posting to a ServiceNow endpoint, which is a build; the Service Catalog app for people's requests; and Service Desk tickets for disconnected applications. Used as shipped, the two products fall short of the loop in four places. One: SailPoint's Service Desk integration treats its task as complete from the ServiceNow status, and a ticket status isn't a re-read. Two: the catalog app moves access approval into ServiceNow. Three: SailPoint's Service Desk integration raises only service requests and incidents, not change requests. And four: there are two doors into the directory. Each gate that closes a gap says so; the slide shows which.`,
  `${M} — Unit 2 "The loop, and where the kit sits"; the guide — "The loop at a glance," "Four gaps between the products and the loop."`);
}

// ================================================================== 7 Contract
{
  const s = content(SC, "The identity finding's data contract");
  tag(s, "What");
  const b = table(s, "Contract", 1.45, [3.6, 1.6, 6.95], ["Field", "Required", "What it's for"], [
    ["kind", "no", "finding (the default) or closure_signal"],
    ["source", "yes", "sailpoint-isc or drift-reconciliation"],
    ["drift_class", "yes", "One of Book 03's seven classes, from missing_identity to schema_drift"],
    ["severity", "no", "P1 to P4; defaults by class: Book 03 High to P2, Medium to P3 (design guidance)"],
    ["system", "no", "isc_account, isc_identity or entra_user: where the re-read happens"],
    ["account_id, identity_id, subject_id, employee_id", "one", "The subject; de-duplication uses the first present"],
    ["origin", "yes", "The trigger and workflow, or the drift finding ID and checker"],
    ["intended_state", "no", "What the re-read must find; derived from an ISC event when absent"],
  ], { fontSize: 12, limit: 6.55 });
  sources(s, "Sources: Module 1, Unit 3; kit README, \"The identity finding: data contract\"; workbook Chapter 01, \"The loop, and where the kit sits.\"");
  notes(s,
`Here's the record those steps share: the identity finding, and its data contract. Kind is a finding, the default, or a closure signal. Source is SailPoint or the drift reconciliation. The drift class is one of the workbook's seven drift classes, and it's required. Severity is P one to P four; leave it out and it defaults by class, High to P two and Medium to P three, which is design guidance. System says where the re-read happens: a SailPoint account, a SailPoint identity or an Entra user. One subject identifier is required, and de-duplication uses the first one present. Origin says what raised it. And the intended state says what a re-read must find; when a SailPoint event arrives without one, the script derives it. The implementation example maps each field to the workbook's evidence record.`,
  `${M} — Unit 3 "The identity finding and its contract"; kit README — "The identity finding: data contract"; workbook Chapter 01 — "The loop, and where the kit sits."`);
}

// ================================================================== 8 Scripted REST resource
{
  const s = content(SC, "What the Scripted REST resource does with a payload");
  tag(s, "How");
  const b = table(s, "Resp", 1.45, [2.0, 10.15], ["Response", "When"], [
    ["201", "Inserted, with sys_id, number and priority"],
    ["200", "deduplicated: true, with the existing sys_id: an active finding has the same source, subject, class and attribute"],
    ["400", "A validation failure, with the reason"],
  ], { fontSize: 13, limit: 3.4 });
  const l = panel(s, "Does", 0.6, b + 0.25, 6.3, null, HEX.navy, HEX.navyTint, "INSIDE SERVICENOW", "The contract's one enforcer", [
    "Validates the payload, or answers 400",
    "Maps severity to priority 1 to 4 and a due date on the program's tempo",
    "De-duplicates against an active finding",
    "Derives an intended state from an ISC event when there's none",
  ], 13);
  panel(s, "Before", 7.15, b + 0.25, 5.6, null, HEX.red, HEX.redTint, "BEFORE CHAPTER 01", null, [
    "Nothing outside ServiceNow applied the same rules",
    "A client learned a payload was wrong only from a 400 on a live instance",
  ], 13);
  sources(s, "Sources: Module 1, Unit 3; workbook Chapter 01, \"What exists\"; kit README, \"The identity finding: data contract\" (responses).");
  notes(s,
`The contract is enforced in one place: the Scripted REST resource, which runs inside ServiceNow. It validates the payload and answers four hundred with the reason when something's wrong. It maps severity to a priority, one to four, and a due date on the program's tempo. It de-duplicates against an active finding: when one already has the same source, subject, class and attribute, it answers two hundred with the existing record instead of creating a second. And when a SailPoint event arrives with no intended state, it derives one. A new finding gets two oh one, with its number and priority. Here's the problem Chapter 01 solved. Until then, nothing outside ServiceNow applied the same rules, so a client learned that a payload was wrong only from a four hundred on a live instance.`,
  `${M} — Unit 3 "The identity finding and its contract"; workbook Chapter 01 — "What exists"; kit README — "The identity finding: data contract."`);
}

// ================================================================== 9 Tempo
{
  const s = content(SC, "Severity and tempo: where the due dates come from");
  tag(s, "What");
  const b = table(s, "Tempo", 1.45, [2.2, 4.6, 2.0, 3.35], ["Severity", "May a machine fix it?", "Window", "Who approves"], [
    ["P1, critical", "No: the run halts and alerts", "Immediate", "A named role, before anything changes"],
    ["P2, high", "Yes, if the fix is deterministic and the class qualifies", "1 hour", "An approver per instance, unless the class is at L4"],
    ["P3, medium", "Yes, if the class qualifies", "24 hours", "Per instance, or the class approved in advance"],
    ["P4, low", "Yes, if the class qualifies", "72 hours", "The class approved in advance"],
  ], { fontSize: 12.5, limit: 4.7 });
  callout(s, "Design", b + 0.3, 1.0, "FaUserClock", HEX.amber, "Program design, not a federal requirement: ",
    "the windows bound the response, not the occurrence. An external clock, such as a CISA directive's, governs when it's shorter.");
  sources(s, "Sources: Module 1, Unit 3; Book 13, Appendix B, \"Severity and tempo\"; workbook Chapter 01, \"What exists,\" \"Federal requirements and evidence.\"");
  notes(s,
`Where do the due dates come from? The workbook's severity and tempo table. A P one, critical, isn't fixed by a machine: the run halts and alerts, and a named role decides. Its window is immediate. P two, high, has a one-hour window. P three, medium, twenty-four hours. And P four, low, seventy-two hours. The script turns those windows into each record's due date. Two cautions. These are the program's internal windows, program design, not a federal requirement. They bound the response, not the occurrence. And they don't replace external timelines: where a CISA directive sets a shorter clock, the external clock governs. The workbook also notes that a program with no findings is more likely blind than clean.`,
  `${M} — Unit 3 "The identity finding and its contract"; Book 13, Appendix B — "Severity and tempo"; workbook Chapter 01 — "What exists," "Federal requirements and evidence."`);
}

// ================================================================== 10 finding_contract.py
{
  const s = content(SC, "finding_contract.py, and an intent with nothing in it");
  tag(s, "How");
  const l = panel(s, "Adds", 0.6, 1.45, 6.3, null, HEX.navy, HEX.navyTint, "WHAT CHAPTER 01 ADDS", "The same rules, on a laptop", [
    "validate(payload): the 400s, the warnings, and the normalized severity, priority, system, subject, key and window",
    "The constants mirror the script's; a test reads the JavaScript and fails if they drift apart",
    "The command line checks a payload file, or every payload a drift run would post",
    "22 tests",
  ], 13);
  const r = panel(s, "Vacuous", 7.15, 1.45, 5.6, null, HEX.red, HEX.redTint, "is_checkable(intended)", "Present, but checks nothing", [
    "{\"attributes\": {}, \"entitlements_absent\": []} is a non-empty object",
    "A re-read finds no difference against it, and would close the record on nothing",
    "The check warns; for missing identity and unauthorized write, a person sets it later",
  ], 13);
  line(s, "Good", "Checkable: {\"disabled\": true}, {\"attributes\": {\"department\": \"Finance\"}}, {\"exists\": false}, an entitlement that must be absent.", Math.max(l, r) + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 1, Unit 3; workbook Chapter 01, \"What this chapter adds,\" \"The tests\"; kit README, \"The identity finding: data contract.\"");
  notes(s,
`Chapter 01 adds finding contract dot py, which applies the script's rules on a laptop. Its validate function returns the errors ServiceNow would answer four hundred to, warnings for what it would accept but the loop can't use, and the normalized values: severity, priority, system, subject, de-duplication key and window. Its constants mirror the script's, and a test reads the JavaScript and fails if they drift apart. Then there's is checkable. An intended state of empty attributes and an empty list of entitlements is a non-empty object, so it looks present. But a re-read finds no difference against it, and would close the record on nothing. So the check warns. For missing identity and unauthorized write, which the loop routes to a person first, the empty intent is expected until that person sets it.`,
  `${M} — Unit 3 "The identity finding and its contract"; workbook Chapter 01 — "What this chapter adds," "The tests."`);
}
endModule(SC);

// ================================================================== 11 Try it: samples
{
  const s = content(SL, "Try it: check five sample payloads");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 2, in examples/servicenow-sailpoint (fixtures, no tenant)",
    "$ python clients/python/finding_contract.py --validate tests/fixtures/payloads/samples.json --now 2026-11-01T12:00:00Z",
    "sample-1-good: ok stale_access P2 priority 2 due 2026-11-01T13:00:00Z system entra_user",
    "sample-2-typo: 400 drift_class must be one of missing_identity, stale_access, orphan_account, ...",
    "sample-3-empty-intent: ok unauthorized_write P2 priority 2 due 2026-11-01T13:00:00Z system isc_account",
    "sample-3-empty-intent: warning: intended_state names nothing a re-read can check (expected: Book 13 routes this ...)",
    "sample-4-bad-severity: 400 severity must be P1, P2, P3 or P4",
    "sample-5-closure: ok closure_signal (moves matches to Awaiting verification; never closes)",
    "3 accepted, 2 rejected, 0 would de-duplicate",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TWO LONG LINES TRIMMED)", pt: 11 });
  const b = table(s, "Read", c + 0.25, [3.0, 9.15], ["Sample", "What it shows"], [
    ["1 good", "No severity given: the class default gave P2 and a one-hour window"],
    ["2 and 4", "A typo in the class (stale_account) and a severity of P5: each a 400, and the command exits 1"],
    ["3 empty intent", "Accepted, with the warning: expected for an unauthorized write"],
    ["5 closure", "A closure signal moves matches to Awaiting verification; it never closes"],
  ], { fontSize: 12.5, limit: 6.55 });
  sources(s, "Sources: Module 1, Unit 4 \"Exercise: Lab 1,\" step 2; workbook Chapter 01, Lab 1; tests/fixtures/payloads/samples.json.");
  notes(s,
`Try it. Lab 1 runs in the kit's folder, on a laptop, against fictional fixtures, with no tenant. In step two you check five sample payloads the way the Scripted REST resource would. Sample one gave no severity, so the class default gave it P two and a one-hour window: due at one o'clock for a run at noon. Sample two has a typo in its drift class, and sample four has a severity of P five. Both would get a four hundred, so the command exits one. Sample three is accepted, but warned: its intended state names nothing a re-read can check, which is expected for an unauthorized write. And sample five, a closure signal, moves matching findings to Awaiting verification. It never closes them.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," step 2; workbook Chapter 01 — "Lab 1: fixtures, no tenant."`);
}

// ================================================================== 12 Try it: drift payloads
{
  const s = content(SL, "Try it: every payload the drift client would post");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: this chapter's tests",
    "$ python -m pytest tests/python/test_finding_contract.py -q",
    "22 passed in 1.38s",
    "# Step 4: run the drift reconciliation over the fixtures, then check its payloads",
    "$ python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract.csv \\",
    "    --config tests/fixtures/config.fixtures.json --graph-users-json tests/fixtures/graph_users.json \\",
    "    --isc-identities-json tests/fixtures/isc_identities.json --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json \\",
    "    --entra-audit-json tests/fixtures/entra_audit.json --out-json out/day1.json --out-csv out/day1.csv",
    "$ python clients/python/finding_contract.py --from-drift out/day1.json --now 2026-11-01T12:00:00Z",
    "1f0e34ebf049f163: ok attribute_drift P3 priority 3 due 2026-11-02T12:00:00Z system entra_user",
    "72cff206ce2db7b6: ok attribute_drift P3 priority 3 due 2026-11-02T12:00:00Z system entra_user",
    "08c2e4690b59573a: ok missing_identity P2 priority 2 due 2026-11-01T13:00:00Z system entra_user",
    "08c2e4690b59573a: warning: intended_state names nothing a re-read can check (expected: ...)",
    "7aabec019d85a331: ok unauthorized_write P2 priority 2 due 2026-11-01T13:00:00Z system entra_user",
    "12 accepted, 0 rejected, 0 would de-duplicate",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED: 5 OF 15 PAYLOAD LINES, NO DRIFT SUMMARY; COMMAND WRAPPED)", pt: 10.5 });
  line(s, "Read", "Step 3, node --test tests/servicenow/servicenow_scripts.test.js, prints tests 15, pass 15, fail 0. In step 4, twelve lines start ok; three carry the warning.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 1, Unit 4, steps 1, 3 and 4; workbook Chapter 01, Lab 1, step 4. Step 5 deletes the out folder.");
  notes(s,
`Step one runs the chapter's tests: twenty-two pass. Step three runs the ServiceNow script's own tests, the rules the Python mirrors, under Node: fifteen tests, fifteen pass, none fail. Then step four runs the drift reconciliation over the fixtures and checks every payload it would post. Twelve lines start ok. Attribute drift is P three, due in twenty-four hours; missing identities, orphans, stale access and the unauthorized write are P two, due in an hour. Three carry the warning: the two missing identities and the unauthorized write, the classes the loop routes to a person. And the last line is twelve accepted, none rejected, none de-duplicated. Erin's two drifts in Entra ID, her department and her manager, have their own keys. Step five deletes the output folder.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 1, 3, 4 and 5; workbook Chapter 01 — "Lab 1: fixtures, no tenant," step 4.`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: post a checked payload to a developer instance");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.6, 9.55], ["Step", "What you do"], [
    ["You need", "A ServiceNow Personal Developer Instance, never production; the web_service_admin role to create the Scripted REST API"],
    ["Build", "The finding table and the Scripted REST resource"],
    ["Lock it down", "A REST_Endpoint ACL"],
    ["Post", "A payload you checked in Lab 1; confirm the de-duplication and the 400"],
    ["Back it out", "Chapter 01, Lab 2, step 5: delete the test records, the ACL, the role, the API and the scoped application"],
  ], { fontSize: 13, limit: 5.0 });
  callout(s, "NotRun", b + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the workbook has no hosted sandbox, so you bring your own instance. Follow Chapter 01, Lab 2, step by step.");
  sources(s, "Sources: Module 1, Unit 5 \"Exercise: Lab 2\"; Learning path index, \"What you need for the labs\"; workbook Chapter 01, Lab 2.");
  notes(s,
`Lab 2 moves to a ServiceNow Personal Developer Instance, never production. You need the web service admin role to create the Scripted REST API. You build the finding table and the Scripted REST resource, and lock the resource down with a REST endpoint access control. Then you post a payload you already checked in Lab 1, and confirm two things on the instance: a repeat de-duplicates, and a malformed payload gets a four hundred. Back it out before you leave the module: step five of the chapter's Lab 2 deletes the test records, the access control, the role, the API and the scoped application. The authors haven't run Lab 2, and the workbook has no hosted sandbox: you bring your own instance.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test instance)"; Learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence to keep");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.4, 4.6, 4.15], ["NIST SP 800-53 (Moderate)", "What Gate 4 does", "Evidence the ISSO keeps"], [
    ["CM-3 Configuration Change Control", "Every proposed change is a documented, owned record", "Finding records with origin, owner, clock"],
    ["RA-7 Risk Response", "Findings are responded to inside declared windows", "Due dates by severity; overdue list"],
    ["CA-7 Continuous Monitoring", "Monitoring results become tracked work", "The finding queue with origin records"],
    ["AC-5 Separation of Duties", "Requests pass an SoD check and an approver who isn't the requester", "Approval history on each request"],
  ], { fontSize: 12, limit: 4.6 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "FROM THIS MODULE", null, [
    "The ServiceNow finding records, and the contract tests in the repository",
    "Each record's due date, which Module 7 measures as window adherence",
  ], 13);
  sources(s, "Sources: Module 1, Unit 1 \"The federal requirement\"; Unit 7 \"Summary\"; the guide's Gate 4 requirements; workbook Chapter 01, \"Federal requirements.\"");
  notes(s,
`The federal requirement. Gate 4 turns findings and requests into documented, owned, clocked records. The guide maps it to four controls in NIST special publication eight hundred fifty-three. C M three, configuration change control: every proposed change is a documented, owned record. R A seven, risk response: findings are answered inside declared windows. C A seven, continuous monitoring: monitoring results become tracked work. And A C five, separation of duties: a request passes a separation-of-duties check and an approver who isn't the requester. The evidence an ISSO keeps from this module: the ServiceNow finding records and the contract tests in the repository, and each record's due date, which Module 7 measures. Before shipping, work through the chapter's checklist.`,
  `${M} — Unit 1 "The federal requirement"; Unit 7 "Summary"; the guide — "Step 4: Open the front door," Gate 4 requirements and evidence; workbook Chapter 01 — "Federal requirements and evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on the typed task", [
    { q: "A payload has drift_class stale_access and no severity. What does the Scripted REST resource do?", options: ["a. Rejects it with a 400, because severity is required", "b. Accepts it as P4, with a 72-hour window", "c. Accepts it with the class default, P2, and a one-hour window"] },
    { q: "What does a closure_signal payload do to matching findings?", options: ["a. Closes them", "b. Moves them to Awaiting verification; it never closes them", "c. Reopens them for the owner to review"] },
  ], "1 c: the script defaults severity by class, as sample 1 showed. 2 b: only a re-read closes.");
  sources(s, "Sources: Module 1, Unit 6 \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions from the module's knowledge check. First: a payload has a drift class of stale access and no severity. What does the Scripted REST resource do? The answer is c. It accepts it with the class default, P two, and a one-hour window. The script defaults severity by class, and sample one in the lab showed exactly that. Second: what does a closure signal payload do to matching findings? The answer is b. It moves them to Awaiting verification, and it never closes them. Only a re-read closes a finding. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary, and next: Module 2, least privilege");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Mapped the kit's files to the loop's five steps, and found the step with no code",
    "Read the identity finding's contract and the tempo behind its due dates",
    "Checked payloads on a laptop the way ServiceNow will",
    "Checked every payload the drift client would post",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2: The boundary and least privilege", [
    "Gate 1: what runs where",
    "ServiceNow roles, ISC scopes and Graph permissions, checked against the call list",
  ], 13.5);
  callout(s, "Ship", Math.max(l, r) + 0.3, 0.9, "FaListCheck", HEX.teal, "Before you ship: ",
    "work through Chapter 01's checklist, including the parity test and the REST_Endpoint ACL.");
  sources(s, "Sources: Module 1, Unit 7 \"Summary\"; Module 2, Unit 1; workbook Chapter 01, \"Checklist.\"");
  notes(s,
`To sum up. You mapped the kit to the loop's five steps, and found that actuation has no code in Pass 1. You read the identity finding's contract, and the tempo its due dates come from. You checked payloads on a laptop the way ServiceNow will, and then every payload the drift client would post. Before you ship, work through Chapter 01's checklist: the constants match the deployed script, every client runs its payloads through the check, and the Scripted REST API requires authentication and a REST endpoint access control with a custom role. Next is Module 2, the boundary and least privilege: Gate 1's record of what runs where, and the ServiceNow roles, SailPoint scopes and Graph permissions each task needs, checked against the kit's call list.`,
  `${M} — Unit 7 "Summary"; workbook Chapter 01 — "Checklist"; Module 2, Unit 1.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/ticket-to-machine/01-the-loop-and-the-typed-task.md (Ticket-to-Machine learning path, Module 1), Units 1 to 7, and the path's index. Its verification log (docs/training/ticket-to-machine/_verification) says every fact is on a page the module links; the deck uses only those pages.",
  "Pages the module sends you to: Book 13, Appendix B, \"The coordination loop\" and \"Severity and tempo\"; the example guide, \"The loop at a glance\" (with the four gaps) and \"Step 4: Open the front door\" (Gate 4 requirements and evidence); developer workbook Chapter 01 (the loop and the kit, what exists, what this chapter adds, Lab 1, Lab 2, federal requirements, checklist).",
  "The kit's README, \"The identity finding: data contract\" (fields, responses, severity and tempo). NIST SP 800-53 Rev. 5 controls as the guide and Chapter 01 map them: CM-3, RA-7, CA-7, AC-5.",
  "Lab output: a copy of examples/servicenow-sailpoint (finding_contract.py, identity_drift.py, tests/fixtures, tests/servicenow), run November 2, 2026 with Python 3.14.3 and Node.js 24.14.1, exactly as the module's Lab 1 gives the commands; the Try it output is trimmed where the slides say so. Lab 2 not run by the authors. Design guidance is labeled.",
]);

finish(OUT);
