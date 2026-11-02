// Ticket-to-Machine learning path, Module 6: Actuation and the Re-read Rule — the module's narrated deck.
// Teaches docs/training/ticket-to-machine/06-actuation-and-the-re-read.md, Learn-style: objectives, the concepts, two
// "Try it" slides with the real Lab 1 commands and output (run November 2, 2026 in a copy of
// examples/servicenow-sailpoint), Lab 2, what differs in government clouds, the federal requirement and evidence, a
// two-question check, and the summary. Every fact comes from the module page, the sections it sends you to read (the
// guide's Gates 5 and 6, the workbook's Chapter 05), its verification log, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-ttm-module-6/build.js \
//                      presentations/training-ttm-module-6/Training_TTM_Module_6.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 6: Actuation and the Re-read Rule",
  footer: "Federal Modernization Workbook  ·  Ticket-to-Machine learning path, Module 6: Actuation and the Re-read Rule",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
const OUT = process.argv[2] || "Training_TTM_Module_6.pptx";
const M = "Training, Ticket-to-Machine, Module 6";

// shared.js names the deck and the title slide for the Microsoft Automation path; this deck is on the
// Ticket-to-Machine path, so it sets its own document title and uses its own title slide (same layout).
P.D.pres.title = "Ticket-to-Machine learning path — Module 6: Actuation and the Re-read Rule";
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
const SA = "Government clouds";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 6: Actuation and the re-read rule", "Ticket-to-Machine learning path · A ticket authorizes a machine; only a re-read closes the finding",
    ["Actuation by lane  ·  The business rule  ·  The re-read client  ·  The guard and offline mode", "Try it: Lab 1  ·  Lab 2  ·  Government clouds  ·  Evidence"]);
  notes(s,
`Welcome to Module 6 of the Ticket-to-Machine learning path: actuation and the re-read rule. This module covers the guide's Gates 5 and 6, and the developer workbook's Chapter 05. In Module 5, an event became a finding with an intended state. Now the fix has to happen, and the finding has to close. You'll see where the fix runs on these products, lane by lane. Then you'll see how a ServiceNow business rule and a re-read client enforce one rule: a finding closes only when a re-read of the target shows the intended state. In the lab, you'll watch the client decide six waiting findings on two days. The code is illustrative, tested against fictional fixtures.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a closed ticket isn't a closed finding");
  tag(s, "Why");
  const l = panel(s, "Today", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "THE GAP", "Closure by ticket status", [
    "SailPoint's Service Desk integration treats a provisioning task as complete when the mapped ServiceNow status says so",
    "A technician sets a ticket to Closed, and nothing was checked",
  ], 13.5);
  const r = panel(s, "Rule", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "BOOK 13'S RULE", "A success response isn't closure", [
    "A finding closes only when a re-read of the target shows the intended state",
    "Gate 6 enforces it in ServiceNow, for findings and for the tickets the integration opens",
  ], 13.5);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaLightbulb", HEX.navy, "This module: ",
    "see where the fix runs, then enforce the rule and watch the re-read client decide six findings.");
  sources(s, "Sources: Module 6, Unit 1 \"Introduction\"; guide, Gate 6; workbook Chapter 05, \"What exists\" (Gap 1); SailPoint, SDIM: Best Practices.");
  notes(s,
`Why does this matter? SailPoint's Service Desk integration treats a provisioning task as complete when the mapped ServiceNow status says so. So a technician sets a ticket to Closed, and nothing was checked. The account might still be enabled. The group might still be there. Book 13's rule is different: a success response isn't closure. A finding closes only when a re-read of the target shows the intended state. Gate 6 enforces that in ServiceNow, for identity findings and for the tickets the Service Desk integration opens. In this module you see where the fix runs, and then you enforce the rule and watch the re-read client decide six findings.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 6", [
    "Explain how Gate 5 actuates by lane, and why the kit has no test for it",
    "Describe what the business rule does with a close, and who can close a finding",
    "Run the re-read client offline, and interpret verified, mismatch, pending and skipped",
    "Explain why a stale read waits, and why an empty intended state is never verified",
  ], [
    "Module 5, and Module 2's ServiceNow roles, for the verifier",
    "Lab 1: the kit, Python and Node.js; no tenant",
    "Lab 2: the developer instance, the verifier user, a test Entra tenant",
  ], 55);
  sources(s, "Sources: Module 6, Unit 1 \"Learning objectives,\" \"Prerequisites\"; Unit 6 \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll explain how Gate 5 actuates by lane, and why the kit has no test for it. You'll describe what the business rule does with a close, and who can close a finding. You'll run the re-read client offline and interpret its four outcomes: verified, mismatch, pending and skipped. And you'll explain why a stale read waits, and why an empty intended state is never verified. Before you start, finish Module 5, and review Module 2's ServiceNow roles, because the verifier is one of them. Lab 1 needs no tenant. Lab 2 needs your developer instance, the verifier user, and a test user in a test Entra tenant.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Actuation by lane
{
  const s = content(SC, "Gate 5: the ticket authorizes a machine, by lane");
  tag(s, "What");
  const b = table(s, "Lanes", 1.45, [3.0, 9.15], ["Lane", "Who or what acts"], [
    ["SailPoint connectors", "Owner-governed access: account create, update, enable, disable, delete; group, role, license and access-package changes. Disabling through the Entra connector also signs the user out"],
    ["ServiceNow Entra spoke", "Low-authority tasks, where its actions cover them. No MFA-reset action; the reset action only for cloud-only users"],
    ["Declared exception", "Disconnected applications: the ticket, a named approver, a time-boxed PIM activation and a recorded session, an end date and a POA&M item"],
    ["People", "Only through a just-in-time PIM activation, with the ticket number as justification; PIM doesn't check it, so a SIEM rule does"],
  ], { fontSize: 12.5, limit: 5.3 });
  callout(s, "NoTest", b + 0.25, 0.95, "FaTriangleExclamation", HEX.amber, "No automated check yet: ",
    "the kit's Pass 1 doesn't actuate, so Gate 5 is configuration of the products themselves.");
  sources(s, "Sources: Module 6, Unit 2 \"Actuation by lane\"; guide, Gate 5, steps 1, 2, 4 and 5, and \"Validate (G5 Actuation).\"");
  notes(s,
`Gate 5 is where the ticket authorizes a machine. The fix runs through a connector under a service identity, and a person's role stops at approval. There are four lanes. SailPoint's connectors provision owner-governed access: creating, updating, enabling, disabling and deleting accounts, and changing groups, roles, licenses and access packages. When the Entra connector disables an account, it also signs the user out of existing sessions. ServiceNow's Entra spoke handles low-authority tasks where its actions cover them; it has no MFA-reset action. Disconnected applications run as declared exceptions, with a named approver, a recorded session and an end date. And people act only through a just-in-time PIM activation. The kit's Pass 1 doesn't actuate, so Gate 5 is configuration of the products themselves, with no automated check yet.`,
  `${M} — Unit 2 "Actuation by lane"; guide — Gate 5, "Validate (G5 Actuation)."`);
}

// ================================================================== 5 Business rule
{
  const s = content(SC, "Gate 6: the business rule decides who can close");
  tag(s, "What");
  const b = table(s, "Rule", 1.45, [6.4, 5.75], ["The update", "What the business rule does"], [
    ["A person sets the state to Closed", "Redirects it to Awaiting verification"],
    ["An update with new evidence, from anyone else", "Redirects it: evidence alone isn't enough"],
    ["The verifier account, without new evidence", "Redirects it: the verifier alone isn't enough"],
    ["The verifier account, with a new evidence hash", "Lets the close stand"],
    ["A named exception approver, with a close note", "Lets the cancel stand: the declared-exception lane"],
  ], { fontSize: 13, limit: 4.9 });
  line(s, "Where", "It runs before update, on the state field, on the identity finding table and on tickets the Service Desk integration opened.", b + 0.25, 0.7, 14);
  sources(s, "Sources: Module 6, Unit 3; guide, Gate 6, steps 1 and 2; workbook Chapter 05, \"What exists\"; servicenow_scripts.test.js.");
  notes(s,
`Gate 6 starts with a business rule. It runs before update, on the state field, and it turns any close into Awaiting verification, unless the same update carries new evidence and comes from the verifier account. Walk through the cases. A person sets the state to Closed: redirected. An update that carries new evidence but comes from someone else: redirected, because evidence alone isn't enough. The verifier account without new evidence: redirected, because the verifier alone isn't enough. The verifier with a new evidence hash: the close stands. And a named exception approver can still cancel with a close note, which is the declared-exception lane. The rule covers the identity finding table and, on the incident and request item tables, the tickets SailPoint's Service Desk integration opened, so its status mapping no longer decides completion.`,
  `${M} — Unit 3 "The business rule and the verifier"; guide — Gate 6, steps 1 and 2.`);
}

// ================================================================== 6 Re-read client
{
  const s = content(SC, "The re-read client: read, compare, close or reopen");
  tag(s, "How");
  const b = table(s, "Reads", 1.45, [2.4, 5.0, 4.75], ["u_system", "The re-read", "Permission"], [
    ["isc_account", "GET /v3/accounts/{id}", "idn:accounts:read"],
    ["isc_identity", "A Search for one identity", "sp:search:read"],
    ["entra_user", "GET /v1.0/users/{id} in Graph; 404 when the user doesn't exist", "User.Read.All (application)"],
  ], { fontSize: 13, limit: 3.6 });
  const l = panel(s, "Match", 0.6, b + 0.25, 6.0, null, HEX.teal, HEX.tealTint, "A MATCH", "Close with the evidence", [
    "The query, the time, a SHA-256 of the response, the intended state and the checker",
    "Attached to the record as JSON",
  ], 13);
  panel(s, "Mismatch", 6.85, b + 0.25, 5.9, null, HEX.red, HEX.redTint, "A MISMATCH", "Reopen with the differences", [
    "The record goes back to work, with each difference in the note",
    "The client writes only with --apply",
  ], 13);
  sources(s, "Sources: Module 6, Unit 3; guide, Gate 6, step 3; workbook Chapter 05, \"What exists\" and \"The verified facts.\"");
  notes(s,
`The re-read client does the checking. It lists the waiting findings through ServiceNow's Table API, then re-reads each subject by its system. An ISC account is read by its ID. An ISC identity is found with a Search. And an Entra user is read through Microsoft Graph, which returns a 404 when the user doesn't exist. Each read has its own least permission, shown on the slide. Then the client compares what it read with the finding's intended state. On a match, it closes the record with the evidence: the query, the time, a SHA-256 hash of the response, the intended state and the checker, and it attaches that evidence as JSON. On a mismatch, it reopens the record with the differences. And it writes nothing unless you pass the apply option.`,
  `${M} — Unit 3 "The business rule and the verifier"; Chapter 05 — "What exists."`);
}

// ================================================================== 7 Stale reads
{
  const s = content(SC, "A stale read waits; a missing read is an error");
  tag(s, "What");
  const l = panel(s, "Stale", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "PENDING", "An ISC read reflects the last aggregation", [
    "A read older than the time the finding started waiting is pending, for a grace period",
    "24 hours by default (design guidance); after it, the read is a mismatch",
    "Tune --grace-hours to the longest aggregation interval, and record the setting",
  ], 13);
  const r = panel(s, "Missing", 6.85, 1.45, 5.9, null, HEX.red, HEX.redTint, "NEVER A MATCH", "A read nobody made", [
    "Offline, a subject with no saved read is an error",
    "Live, the reader raises on anything but a 404",
    "A saved read of null means the read found nothing",
  ], 13);
  callout(s, "Unverified", Math.max(l, r) + 0.3, 0.85, "FaUserClock", HEX.amber, "Not verified: ",
    "how long an ISC read lags the source. It depends on the aggregation schedule (verify list, item 17).");
  sources(s, "Sources: Module 6, Unit 3 and Unit 4; guide, Gate 6, steps 3 and 4; workbook Chapter 05, \"What exists,\" \"What this chapter adds,\" \"Dangers.\"");
  notes(s,
`Two kinds of read need care. First, a stale read. An ISC read reflects the last aggregation, not the source right now. So if the read is older than the time the finding started waiting, it can't show the fix yet. The client calls it pending, and waits for a grace period, twenty-four hours by default, which is design guidance. After the grace period, a read that still disagrees is a mismatch. Tune the grace period to the longest aggregation interval on your sources, and record the setting; how long the lag really is wasn't verified. Second, a missing read. A subject nobody read must never count as a match. In offline mode, a subject with no saved read is an error. The live reader raises on anything but a 404. And a saved read of null means the read found nothing.`,
  `${M} — Unit 3 "The business rule and the verifier"; Unit 4 "The guard and the offline mode"; Chapter 05 — "Dangers."`);
}

// ================================================================== 8 Guard and offline mode
{
  const s = content(SC, "Chapter 05 adds a guard and an offline mode");
  tag(s, "How");
  const l = panel(s, "Guard", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "THE GUARD", "An intended state that names nothing", [
    "{\"attributes\": {}, \"entitlements_absent\": []} is what the script stores for a native change the workflow didn't describe",
    "Comparing any read with it always \"matches\"",
    "Before reading, finding_contract.is_checkable rejects it: skipped, with the reason, never verified",
  ], 13);
  const r = panel(s, "Offline", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE OFFLINE MODE", "Test the rule with no tenant", [
    "--records-json: saved waiting records, in the Table API's shape",
    "--observations-json: saved reads, keyed by subject ID",
    "--now: fixes the clock for the grace period",
    "Same decisions, only the reader swapped; a dry run only: --apply is refused",
  ], 13);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaFilter", HEX.navy, "Before the guard: ",
    "the client would have closed that record, with evidence, on nothing.");
  sources(s, "Sources: Module 6, Unit 4 \"The guard and the offline mode\"; workbook Chapter 05, \"What exists\" and \"What this chapter adds.\"");
  notes(s,
`Chapter 05 adds two things. The first is a guard. The client already skipped a record whose intended state was completely empty. But it didn't skip one that was a non-empty object naming nothing, with empty attributes and an empty list of entitlements to remove. That's exactly what the script stores for a native change the workflow didn't describe, the Module 5 gap. Comparing any read with it always matches, so the client would have closed that record, with evidence, on nothing. Now, before reading anything, the client checks the intended state, and a record that names nothing checkable is skipped with the reason, never verified. The second is an offline mode. It takes saved waiting records, saved reads and a fixed clock, and makes the same decisions with only the reader swapped. It's a dry run only; the apply option is refused.`,
  `${M} — Unit 4 "The guard and the offline mode"; Chapter 05 — "What this chapter adds."`);
}

// ================================================================== 9 Six records
{
  const s = content(SC, "Six fictional waiting records, one per outcome");
  tag(s, "What");
  const b = table(s, "Six", 1.45, [1.9, 6.1, 2.05, 2.1], ["Record", "The case", "Nov. 1, noon", "Nov. 2, noon"], [
    ["IDF0001001", "A reverted native change", "verified", "verified"],
    ["IDF0001002", "A terminated user still enabled in Entra ID", "mismatch", "mismatch"],
    ["IDF0001003", "An ISC account read before it was re-aggregated", "pending", "mismatch"],
    ["IDF0001004", "An attribute change", "verified", "verified"],
    ["IDF0001005", "A native change with an empty intended state", "skipped", "skipped"],
    ["IDF0001006", "An orphan account, disabled", "verified", "verified"],
  ], { fontSize: 13, limit: 5.2 });
  line(s, "Grace", "IDF0001003 started waiting at 06:00 on November 1; by noon on November 2 its 24-hour grace period has passed.", b + 0.3, 0.7, 14);
  sources(s, "Sources: Module 6, Unit 4; workbook Chapter 05, \"What this chapter adds\"; tests/fixtures/reread/awaiting_records.json; Lab 1, steps 2 and 3.");
  notes(s,
`The kit comes with six fictional waiting records, one per outcome, and the lab runs them on two days. The first is a reverted native change, and it verifies. The second is a terminated user still enabled in Entra ID: a mismatch. The third is an ISC account read before it was re-aggregated. At noon on November first it's pending; by noon the next day it's a mismatch. The fourth, an attribute change, verifies. The fifth is a native change with an empty intended state, and it's skipped by the guard. The sixth, an orphan account that was disabled, verifies. Why does the third one change? It started waiting at six in the morning on November first, so by noon on November second its twenty-four-hour grace period has passed, and the stale read now counts as a mismatch.`,
  `${M} — Unit 4 "The guard and the offline mode"; Chapter 05 — "What this chapter adds."`);
}
endModule(SC);

// ================================================================== 10 Try it 1
{
  const s = content(SL, "Try it: re-read six findings at noon on November 1");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/servicenow-sailpoint (fixtures, no tenant)",
    "$ python -m pytest tests/python/test_reread_verification.py tests/python/test_reread_offline.py -q",
    "15 passed in 1.34s",
    "$ python clients/python/reread_verification.py --records-json tests/fixtures/reread/awaiting_records.json \\",
    "    --observations-json tests/fixtures/reread/observations.json --now 2026-11-01T12:00:00Z",
    "[dry-run] IDF0001001: verified; would PATCH state=3",
    "[dry-run] IDF0001002: mismatch; would PATCH state=1 (accountEnabled: intended False, observed True)",
    "IDF0001003: pending, the ISC copy predates the change; re-run after the next aggregation",
    "[dry-run] IDF0001004: verified; would PATCH state=3",
    "IDF0001005: skipped, the intended state names nothing a re-read can check",
    "[dry-run] IDF0001006: verified; would PATCH state=3",
    "1 mismatch, 1 pending, 1 skipped, 3 verified",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (LONG LINES WRAPPED)", pt: 11 });
  line(s, "Read", "Every line says what the client would do, and why: a dry run writes nothing. Pending and skipped records are never patched.", c + 0.25, 0.7, 14);
  sources(s, "Sources: Module 6, Unit 5 \"Exercise: Lab 1,\" steps 1 and 2; workbook Chapter 05, Lab 1; tests/fixtures/reread.");
  notes(s,
`Try it. Lab 1 runs in the kit's servicenow-sailpoint folder, with no tenant. Step one runs the re-read tests, and fifteen pass. Step two runs the client offline over the six waiting records, with the clock fixed at noon on November first. Read the output. Three records verify, and the client would patch each one to closed. The terminated user is a mismatch: the intended state says account enabled false, and the read says true, so the client would reopen it with that difference. The third record is pending, because the ISC copy predates the change, so re-run after the next aggregation. The fifth is skipped, because its intended state names nothing a re-read can check. Every line says what the client would do and why. It's a dry run, so nothing is written, and pending and skipped records are never patched.`,
  `${M} — Unit 5 "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2.`);
}

// ================================================================== 11 Try it 2
{
  const s = content(SL, "Try it: a day later, and the business rule's tests");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 3 to 5",
    "$ python clients/python/reread_verification.py --records-json tests/fixtures/reread/awaiting_records.json \\",
    "    --observations-json tests/fixtures/reread/observations.json --now 2026-11-02T12:00:00Z --out-json out/reread.json",
    "[dry-run] IDF0001003: mismatch; would PATCH state=1 (disabled: intended True, observed False)",
    "2 mismatch, 1 skipped, 3 verified",
    "$ node --test --test-name-pattern=\"redirected|verifier|exception approver|evidence alone|non-closing|SDIM\" \\",
    "    tests/servicenow/servicenow_scripts.test.js",
    "✔ a person closing a finding is redirected to awaiting verification",
    "✔ the verifier with fresh evidence may close",
    "✔ evidence alone, or the verifier alone, is not enough",
    "✔ exception approver may cancel with a close note",
    "✔ non-closing changes are untouched",
    "✔ on incident, only SDIM-opened tickets are governed",
    "ℹ tests 6",
    "ℹ pass 6",
    "$ rm -rf out",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED)", pt: 11 });
  line(s, "Check", "Check your work: for any waiting finding, say whether the client verifies, reopens, waits or skips it, and why.", c + 0.25, 0.45, 14);
  sources(s, "Sources: Module 6, Unit 5 \"Exercise: Lab 1,\" steps 3 to 5; workbook Chapter 05, Lab 1.");
  notes(s,
`Step three runs the same records a day later, at noon on November second, and keeps the results in a JSON file in an out folder, which the client creates. On the slide, the five unchanged lines are trimmed. The one that changed is the third record. Its grace period has passed, so the stale read is now a mismatch: the intended state says disabled true, and the read says false. The summary is now two mismatches, one skipped and three verified. The JSON file holds each result with its evidence hash. Step four runs the business rule's six tests, and they read like the rule itself: a person's close is redirected, the verifier with fresh evidence may close, evidence alone or the verifier alone isn't enough, an exception approver may cancel with a note, and only tickets the integration opened are governed. Step five deletes the out folder.`,
  `${M} — Unit 5 "Exercise: Lab 1 (fixtures, no tenant)," steps 3 to 5.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: enforce the rule in a developer instance");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "The developer instance from Modules 1 and 2, the verifier user from Module 2's Lab 2, a test user in a test Entra tenant"],
    ["Configure", "The business rule and its system properties"],
    ["Close as a person", "Watch the finding land in Awaiting verification"],
    ["Confirm the verifier", "Which user ServiceNow records for the verifier's OAuth client: the rule compares it with the verifier property"],
    ["Close with evidence", "From a Graph read of a disabled test user"],
    ["Back it out", "Delete the test findings and attachments, deactivate the rule if you built it for the lab, delete the properties"],
  ], { fontSize: 12.5, limit: 5.4 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the identity ServiceNow records for an OAuth client-credentials call is unverified (verify list, item 10).");
  sources(s, "Sources: Module 6, Unit 6 \"Exercise: Lab 2\"; workbook Chapter 05, \"What couldn't be verified\" and \"Lab 2: a ServiceNow developer instance.\"");
  notes(s,
`Lab 2 enforces the rule in your own ServiceNow developer instance. You need the instance from Modules 1 and 2, the verifier user from Module 2's Lab 2, and a test user in a test Entra tenant. Configure the business rule and its system properties. Close a finding as a person, and watch it land in Awaiting verification. Then confirm which user ServiceNow records for the verifier's OAuth client. That matters, because the rule compares it with the verifier property, and the workbook couldn't verify it. If it's wrong, every close is refused, and people look for a way around the rule. Finally, close a finding with evidence from a Graph read of a disabled test user. Then back it out: delete the test findings and their attachments, deactivate the rule if you built it for the lab, and delete the properties. The authors haven't run Lab 2.`,
  `${M} — Unit 6 "Exercise: Lab 2 (your test instance)"; Chapter 05 — "What couldn't be verified," "Dangers."`);
}
endModule(SL);

// ================================================================== 13 Government clouds
{
  const s = content(SA, "What differs in government clouds for Gates 5 and 6");
  tag(s, "Who");
  const b = table(s, "Gov", 1.45, [3.2, 8.95], ["Piece", "What the guide found"], [
    ["PIM", "Available in Azure for US Government (read November 1, 2026)"],
    ["ServiceNow Entra spoke", "Points at graph.microsoft.com by default; its page doesn't mention the US Government clouds. It fits GCC; for GCC High, confirm with ServiceNow"],
    ["SailPoint connectors", "Endpoints for GCC High are documented"],
    ["The re-read in Graph", "GCC uses the worldwide Graph endpoint; GCC High uses graph.microsoft.us"],
    ["ISC API domain", "For a FedRAMP tenant, not confirmed (Gate 1)"],
  ], { fontSize: 12.5, limit: 4.9 });
  callout(s, "Interim", b + 0.25, 0.95, "FaRoute", HEX.teal, "Interim path (design guidance): ",
    "until the client runs on a schedule, the verifier runs it by hand once a day, dry run first; the rule still blocks a person's close.");
  sources(s, "Sources: Module 6, Units 2 and 3; guide, Gate 5 and Gate 6, \"Availability\" and \"Interim path.\"");
  notes(s,
`What differs in the government clouds? The guide's availability notes for Gates 5 and 6 answer it. PIM is available in Azure for U S Government. ServiceNow's Entra spoke points at the worldwide Graph host by default, and its page doesn't mention the U S Government clouds, so it fits GCC, but for GCC High, confirm with ServiceNow before use. SailPoint's connector endpoints for GCC High are documented. For the re-read itself, GCC uses the worldwide Graph endpoint, and GCC High uses graph dot microsoft dot u s. And the ISC API domain for a FedRAMP tenant wasn't confirmed. There are interim paths. Until the change-record flow exists, the approver raises the change record by hand. And until the re-read client runs on a schedule, the verifier runs it by hand once a day, dry run first; the business rule still blocks a person's close.`,
  `${M} — Unit 2 "Actuation by lane"; Unit 3 "The business rule and the verifier"; guide — Gates 5 and 6, "Availability," "Interim path."`);
}
endModule(SA);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence to keep");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [1.6, 5.6, 4.95], ["Gate", "NIST SP 800-53 and SP 800-63B-4", "Evidence an ISSO keeps"], [
    ["Gate 5", "CM-5, AC-3, AC-6, CM-3, AU-14, CA-5; SP 800-63B-4 for resets and recovery", "Connector and spoke identities with their permissions; provisioning events; activation records; change records"],
    ["Gate 6", "CM-3, CM-4(2), CA-7, AU-12", "The evidence attachment and hash on each closed record; the re-read result and time; the verifier's audit trail"],
    ["Chapter 05", "AC-5: no person closes a finding by setting its state", "The business rule and its properties; the work notes"],
  ], { fontSize: 12.5, limit: 4.7 });
  callout(s, "Clause", b + 0.25, 0.95, "FaClipboardCheck", HEX.teal, "Book 13's clause 4: ",
    "a success response is not closure. Chapter 07 exports the closure evidence for the period.");
  sources(s, "Sources: Module 6, Unit 1 \"The federal requirement\"; Unit 8 \"Summary\"; guide, Gates 5 and 6 tables; workbook Chapter 05, \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. The guide's Gate 5 table maps actuation to NIST special publication eight hundred fifty-three: access restrictions for change, access enforcement, least privilege, change control, session audit and the plan of action and milestones, and to special publication eight hundred sixty-three B, revision four, for resets and recovery. The Gate 6 table maps the re-read to change control, verification of controls, continuous monitoring and audit record generation. Chapter 05 adds separation of duties: no person can close a finding by setting its state. The evidence an ISSO keeps: connector and spoke identities with their permissions, provisioning events, activation records and change records for Gate 5; and for Gate 6, the evidence attachment and hash on each closed record, the re-read result and time, and the verifier account's audit trail. Before shipping, work through the Chapter 05 checklist.`,
  `${M} — Unit 1 "The federal requirement"; Unit 8 "Summary"; Chapter 05 — "Federal requirements and evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on the re-read rule", [
    { q: "At noon on November 1, IDF0001003 is pending. Why?", options: ["a. The ISC copy of the account predates the change, so the client waits for the next aggregation", "b. The verifier account isn't configured", "c. The intended state names nothing a re-read can check"] },
    { q: "Under the business rule, which update can close a finding?", options: ["a. A person setting the state to Closed Complete", "b. Any update that carries new evidence", "c. An update from the verifier account that carries new evidence"] },
  ], "1 a: a stale read waits, then becomes a mismatch. 2 c: evidence alone, or the verifier alone, isn't enough.");
  sources(s, "Sources: Module 6, Unit 7 \"Knowledge check,\" questions 1 and 2, and \"Check your answers\"; guide, Gate 6, step 1; Chapter 05, Lab 1.");
  notes(s,
`Check yourself with two questions. First: at noon on November first, record one thousand and three is pending. Why? The answer is a. The ISC copy of the account predates the change, so the client waits for the next aggregation. After the grace period, it becomes a mismatch. Second: under the business rule, which update can close a finding? The answer is c: an update from the verifier account that carries new evidence. Evidence alone, or the verifier alone, isn't enough. The module page has two more questions, on a missing saved read and on why the kit has no test for Gate 5.`,
  `${M} — Unit 7 "Knowledge check," questions 1 and 2.`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary, and next: Module 7, evidence for the ISSO");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Learned where actuation runs on these products, lane by lane",
    "Saw how the business rule and the re-read client keep a ticket status from closing a finding",
    "Saw how the client treats stale reads, missing reads and empty intended states",
    "Ran the client offline over six findings on two days",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 7: Evidence for the ISSO", [
    "Gate 7: operating the tempo",
    "Book 13's evidence records",
    "A hash-chained package, verified",
  ], 13.5);
  callout(s, "Check", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Before shipping: ",
    "work through the Chapter 05 checklist.");
  sources(s, "Sources: Module 6, Unit 8 \"Summary\"; Module 7, Unit 1.");
  notes(s,
`To sum up. You learned where actuation runs on these products: SailPoint's connectors, ServiceNow's Entra spoke, the declared-exception lane, and people only through just-in-time activation. You saw how the business rule and the re-read client keep a ticket status from closing a finding. You saw how the client treats stale reads, missing reads and empty intended states. And you ran it offline over six findings on two days. Before shipping, work through the Chapter 05 checklist. Next is Module 7, the last in the path: evidence for the ISSO. You'll learn what Gate 7 runs and reports, export closed findings as Book 13's evidence records, chain one period to the next, and verify the package the way an ISSO would.`,
  `${M} — Unit 8 "Summary"; Module 7 — Unit 1 "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 6 deck", [
  "Module page: docs/training/ticket-to-machine/06-actuation-and-the-re-read.md (Ticket-to-Machine learning path, Module 6), Units 1 to 8, and the path's verification log (docs/training/ticket-to-machine/_verification).",
  "The sections the module sends you to read: the example guide's Gate 5 and Gate 6 (steps, requirements tables, \"Availability,\" \"Interim path,\" \"Validate (G5 Actuation),\" \"Validate (G6 Re-read)\"); the developer workbook's Chapter 05 (\"What exists,\" \"What this chapter adds,\" \"Dangers,\" \"Federal requirements and evidence,\" Lab 2); Book 13, Appendix B.",
  "Product pages the guide and Chapter 05 cite: SailPoint, SDIM: Best Practices; ISC v3 getAccount and searchPost; ServiceNow Table API and Attachment API (Zurich); Microsoft Learn, Get a user (read November 1, 2026).",
  "Federal requirements: NIST SP 800-53 CM-5, AC-3, AC-5, AC-6, CM-3, CM-4(2), CA-5, CA-7, AU-12, AU-14, and NIST SP 800-63B-4, as the guide's Gate 5 and 6 tables and Chapter 05 map them.",
  "Lab output: examples/servicenow-sailpoint (reread_verification.py, tests/fixtures/reread, test_reread_offline.py, servicenow_scripts.test.js), run November 2, 2026 in a copy of the kit with Python 3.14.3 and Node.js 24.14.1; long lines wrapped and the Try it output trimmed. Lab 2 not run by the authors. Design guidance is labeled.",
]);

finish(OUT);
