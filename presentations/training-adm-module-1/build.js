// Attribute-Driven Migration learning path, Module 1: Send HR records through a middleware that fails closed — the module's
// narrated deck. Teaches docs/training/attribute-driven-migration/01-the-hr-middleware.md, Learn-style: objectives, the
// concepts, "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of
// examples/hcm-entra), Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact comes
// from the module page, the learning path's verification log, Book 19 Chapter 01, or the kit (examples/hcm-entra); the
// deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-adm-module-1/build.js \
//                      presentations/training-adm-module-1/Training_ADM_Module_1.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 1: Send HR records through a middleware that fails closed",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration learning path, Module 1: The HR middleware",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Attribute-Driven Migration learning path — Module 1: Send HR records through a middleware that fails closed";
const OUT = process.argv[2] || "Training_ADM_Module_1.pptx";
const M = "Training, Attribute-Driven Migration, Module 1";

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
  const s = title(SI, "Module 1: The HR middleware that fails closed", "Attribute-Driven Migration learning path · Guide Gates 2 and 3, with Book 19 Chapter 01",
    ["Where the middleware sits  ·  What CSV2SCIM leaves to you  ·  Fail closed", "Send it whole  ·  Hold a mass disable  ·  Provenance  ·  Try it: Lab 1  ·  Lab 2"]);
  notes(s,
`Welcome to Module 1 of the Attribute-Driven Migration learning path: send HR records through a middleware that fails closed. The path teaches the workbook's book Building the Attribute-Driven Migration, one chapter per module, in the order of the implementation guide's gates. There are nine modules. This one serves Gates 2 and 3, and takes Chapter 01, the HR-to-Entra middleware. You'll see what the middleware owns and what the provisioning service owns, what Microsoft's CSV2SCIM sample leaves to you, and how the hardened client refuses bad rows, orders leavers first, holds a mass disable and ties every batch to its inputs by hash. Then you'll run it on your laptop against a fictional HR extract. The code is illustrative: tested against fixtures, not against a production tenant.`,
  `${M} — Unit 1 "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the middleware is where a record is first checked");
  tag(s, "Why");
  const b = table(s, "Gates", 1.45, [3.0, 9.15], ["Where", "What it means for an HR record"], [
    ["Every later gate", "Trusts the attributes HR sends"],
    ["Gate 2", "Proves the values true, before anything reads them"],
    ["Gate 3", "Maps them through sync, and sends the whole record every time"],
    ["The middleware", "Sits between the HR extract and Entra ID: where a record is first checked"],
  ], { fontSize: 13.5, limit: 4.4 });
  callout(s, "Point", b + 0.35, 0.95, "FaUserShield", HEX.red, "The gap: ",
    "Microsoft's CSV2SCIM sample sends every row it reads. A bad HR record becomes bad access faster than any ticket queue.");
  sources(s, "Sources: Module 1, Units 1 and 2; Microsoft Learn, \"API-driven inbound provisioning with PowerShell script\"; Book 19, Ch 01 \"What it leaves to you.\"");
  notes(s,
`Why start here? Every later gate trusts the attributes HR sends. A bad HR record becomes bad access faster than any ticket queue. So the guide proves the values true at Gate 2, and maps them through sync at Gate 3. The middleware, between the HR extract and Entra ID, is where a record is first checked. Microsoft's CSV2SCIM sample sends every row it reads. That's by design: it's a converter, and Microsoft Learn's page on API-driven inbound provisioning with PowerShell lists validation as a customization you add. In this module you see what a federal deployment has to add, and you run the client that adds it.`,
  `${M} — Unit 1 "Introduction"; Unit 2; Book 19, Chapter 01 — "What it leaves to you."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Explain what the middleware owns, what the provisioning service owns, and what a 202 Accepted means",
    "Describe what Microsoft's CSV2SCIM sample leaves to you",
    "Run the hardened client and read its counts, its quarantine and its exit codes",
    "Verify a run's provenance by hash, and show a rerun gives identical bytes",
    "Explain why the client sends every record whole and holds a mass disable",
  ], [
    "Microsoft Automation, Module 1: the clouds, sign-in and least privilege",
    "Lab 1: Python 3.10+ with pytest; no tenant",
    "Optional: PowerShell 7 with Pester 5, for the full chapter lab",
  ], 55);
  sources(s, "Sources: Module 1, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll explain what the middleware owns and what the provisioning service owns, and what a two-oh-two Accepted means. You'll describe what Microsoft's CSV2SCIM sample leaves to you. You'll run the hardened client and read its counts, its quarantine and its exit codes. You'll verify a run's provenance by hash, and show that a rerun gives identical bytes. And you'll explain why the client sends every record whole and holds a mass disable. Before you start, work through Microsoft Automation Module 1, for the clouds, sign-in and least privilege. Lab 1 needs Python 3.10 or later with pytest, and no tenant. PowerShell 7 with Pester 5 is optional: it runs the PowerShell client and Microsoft's sample, which the full chapter lab compares.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Where it sits
{
  const s = content(SC, "Where the middleware sits, and what a 202 means");
  tag(s, "What");
  const l = panel(s, "Mid", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE MIDDLEWARE OWNS", "Everything before the POST", [
    "What is sent, in what order, and how fast",
    "What record is kept: validation-report.json, quarantine.json, provenance.json, apply-results.json",
  ], 13);
  const r = panel(s, "Svc", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE PROVISIONING SERVICE OWNS", "The mapping, the match and the write", [
    "Maps SCIM attributes to directory attributes",
    "Matches incoming records to existing users, and writes",
  ], 13);
  callout(s, "202", Math.max(l, r) + 0.3, 1.05, "FaTriangleExclamation", HEX.amber, "The endpoint is asynchronous: ",
    "a 202 Accepted means the batch was staged for the provisioning job, not that any user was written. The Location header points at the provisioning logs.");
  sources(s, "Sources: Microsoft Learn, \"Perform bulkUpload,\" \"API-driven inbound provisioning with PowerShell script\"; Module 1, Unit 2; Book 19, Ch 01.");
  notes(s,
`Start with the split. The HR system writes a CSV extract. The middleware reads it, and sends SCIM bulk requests to the provisioning job's bulk upload endpoint. The provisioning service owns the mapping from SCIM attributes to directory attributes, the matching of incoming records to existing users, and the write. The middleware owns everything before the POST: what is sent, in what order, how fast, and what record is kept of it. Microsoft Learn's page on the PowerShell sample gives that split as Microsoft's design intent. And one thing to remember from this slide: Learn's bulk upload API reference says the endpoint is asynchronous. A two-oh-two Accepted means the batch was staged for the provisioning job, not that any user was written. The Location header points at the provisioning logs, where each record's result appears.`,
  `${M} — Unit 2 "Where the middleware sits"; Book 19, Chapter 01 — "Where the middleware sits."`);
}

// ================================================================== 5 What CSV2SCIM leaves
{
  const s = content(SC, "What Microsoft's CSV2SCIM sample leaves to you");
  tag(s, "What");
  const b = table(s, "Gaps", 1.45, [2.3, 4.5, 5.35], ["Concern", "CSV2SCIM at f2e8c59", "What examples/hcm-entra adds"], [
    ["Record validation", "Validates the mapping, not the values", "Fails closed: 9 of the fixture's 19 rows quarantined"],
    ["Order", "File order", "Leavers first, then managers before reports"],
    ["Mass change", "No limit", "max_disables_per_run holds the run"],
    ["Clouds", "Hard-coded to graph.microsoft.com/beta", "One of the three Graph hosts; v1.0 or beta"],
    ["Least privilege", "Asks for Application.ReadWrite.All and more", "One permission to send; a separate log reader"],
    ["Repeatability", "A new random GUID per bulkId", "bulkId is the person key: same input, same hash"],
  ], { fontSize: 12.5, limit: 5.3 });
  callout(s, "Use", b + 0.25, 0.95, "FaListCheck", HEX.navy, "Design guidance: ",
    "use CSV2SCIM to validate a mapping, extend the schema and read cycle logs; use the hardened client for production sends.");
  sources(s, "Sources: Microsoft, CSV2SCIM sample at f2e8c59; Microsoft Learn, \"Microsoft Graph national cloud deployments\"; Book 19, Ch 01 \"What it leaves to you.\"");
  notes(s,
`Microsoft publishes a PowerShell sample for this integration, CSV2SCIM, with a full tutorial on Microsoft Learn. Use it; the repository keeps a pinned copy of Microsoft's sample at upstream commit f2e8c59. Run on the book's HR fixture, nineteen rows, it sends all nineteen. Here's what it leaves to you. It validates the mapping, not the values; the hardened client fails closed, and quarantines nine of the nineteen rows. It sends in file order; the client sends leavers first, then managers before their reports. It has no limit on mass change. Its endpoint is hard-coded to the worldwide beta host, and Learn's page on Microsoft Graph national cloud deployments gives other hosts for GCC High and DoD, so it can't reach them as written. Its sign-in asks for Application dot ReadWrite dot All, which can change any app in the tenant. And each bulk I D is a new random GUID, so a batch can't be traced to its inputs.`,
  `${M} — Unit 2; Book 19, Chapter 01 — "Start with Microsoft's sample: CSV2SCIM," "What it leaves to you."`);
}

// ================================================================== 6 Fail closed
{
  const s = content(SC, "Fail closed: every row is built or refused");
  tag(s, "What");
  const l = panel(s, "Refuse", 0.6, 1.45, 6.6, null, HEX.red, HEX.redTint, "REFUSED, TO QUARANTINE.JSON", "With its reasons, the HR row and the payload", [
    "A required column is empty, or the person number doesn't fit employeeId",
    "The worker type is unknown, or refused: pending workers and nonworkers",
    "A code isn't in the code list, or a value is too long for its attribute",
    "A date doesn't parse; own manager; inactive with no termination date",
  ], 13);
  const r = panel(s, "Warn", 7.45, 1.45, 5.3, null, HEX.teal, HEX.tealTint, "WARNINGS, NOT REFUSALS", null, [
    "A suspended assignment stays active: leave is not a leaver",
    "A manager separating in the same run never blocks the joiner",
    "A separation older than the catch-up window is flagged",
  ], 13);
  callout(s, "Rule", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.navy, "Design guidance: ",
    "treat every new validation rule as a refusal until the HR owner agrees it can be a warning.");
  sources(s, "Sources: the kit's design, examples/hcm-entra/python/hcm_to_scim.py; Module 1, Unit 3; Book 19, Ch 01 \"Validate and fail closed\" (design guidance).");
  notes(s,
`The client takes each row and either builds a SCIM operation or refuses it with reasons. A row is refused when a required column is empty, the person number doesn't fit employee I D, the worker type is unknown or refused, such as a pending worker, a code isn't in the code list, a value is longer than the target attribute holds, a date doesn't parse, a worker is recorded as their own manager, or an inactive assignment has no termination date. Every refused row goes to the quarantine file, with its reasons, the unchanged HR row and the attempted payload. These rules are the kit's design. Some are warnings instead. A suspended assignment keeps the account active, because leave is not a leaver. A manager separating in the same run never blocks the joiner. And this workbook's guidance is to treat every new rule as a refusal until the HR owner agrees it can be a warning.`,
  `${M} — Unit 3 "Fail closed, send it whole, and keep the record"; Book 19, Chapter 01 — "Validate and fail closed."`);
}

// ================================================================== 7 Whole, ordered, held
{
  const s = content(SC, "Send it whole, leavers first, and hold a mass disable");
  tag(s, "What");
  const b = table(s, "Rules", 1.45, [2.6, 9.55], ["Rule", "What the client does, and why"], [
    ["Send it whole", "Every record complete: with clearing on (preview), an omitted attribute can clear the value"],
    ["Order", "Leavers first, then managers before their reports, then person key"],
    ["Duplicates", "A single separation wins and the rest are superseded; any other duplicate is refused"],
    ["Batch", "At most 50 operations per request"],
    ["Hold", "Too many disables (max_disables_per_run) or calls (daily_call_budget): exit 3"],
    ["Confirm", "Only --confirm-large-delta releases a held run"],
  ], { fontSize: 12.5, limit: 5.3 });
  line(s, "Quota", "The tenant quota: 2,000 calls in 24 hours with P1 or P2, 6,000 with ID Governance.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Microsoft Learn, \"API-driven inbound provisioning concepts,\" \"Perform bulkUpload\"; the kit's design (order, hold); Book 19, Ch 01.");
  notes(s,
`Three more rules. First, send the complete record every time. Microsoft Learn's page on API-driven inbound provisioning concepts says to include the whole user record in every bulk request. When the job's clear attribute values feature, a preview, is on, a null or empty value clears the target, and so can an omitted attribute. So the client never sends a partial record. Second, order. Leavers go first, then managers before their reports, then person key. When one person has several rows, a single separation wins and the rest are superseded; any other duplicate is refused. The bulk upload API reference allows at most fifty operations per request. Third, the hold. Two guards hold the whole run, with exit code three, until someone confirms it: more disables than the run allows, or more calls than the daily budget. The budget follows the quota on Learn's concepts page: two thousand calls a day with P1 or P2, and six thousand with ID Governance.`,
  `${M} — Unit 3; Book 19, Chapter 01 — "Send the complete record every time," "Order, batch and hold."`);
}

// ================================================================== 8 Provenance
{
  const s = content(SC, "The provenance manifest: every batch tied by hash");
  tag(s, "What");
  const l = panel(s, "Manifest", 0.6, 1.45, 6.6, null, HEX.navy, HEX.navyTint, "PROVENANCE.JSON HOLDS", "Keys and hashes only", [
    "extract_sha256 and mapping_sha256: the inputs, by hash",
    "The counts, and whether the run was held",
    "Each batch's batch_sha256 and its person_keys",
    "The quarantined person keys",
  ], 13);
  const r = panel(s, "Trail", 7.45, 1.45, 5.3, null, HEX.teal, HEX.tealTint, "WHAT AN AUDITOR FOLLOWS", null, [
    "A provisioning-log line, to the person key",
    "To the batch and its Location",
    "To the extract and mapping, by hash",
  ], 13);
  callout(s, "BulkId", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.navy, "Why bulkId is the person key: ",
    "with a random bulkId, as in the sample, the same input would never produce the same hash.");
  sources(s, "Sources: the kit's design, examples/hcm-entra (provenance.json); Module 1, Unit 3; Knowledge check answer 2; Book 19, Ch 01 \"The provenance manifest.\"");
  notes(s,
`The last idea is the record, and it's the kit's design, not Microsoft's. The provenance file ties every batch to the exact inputs that produced it. It holds the hash of the extract and the hash of the mapping file, the counts, whether the run was held, each batch with its own hash and its person keys, and the quarantined keys. Each batch hash is the same one the apply results record when that batch is sent. So an auditor can go from a line in the provisioning logs to the person key, to the batch and its Location, to the extract and mapping files by hash. That only works because each operation's bulk I D is the person key. With a random bulk I D, as in the sample, the same input would never produce the same hash. The manifest carries keys and hashes only, so it can sit in the evidence store.`,
  `${M} — Unit 3; Knowledge check answer 2; Book 19, Chapter 01 — "The provenance manifest."`);
}
endModule(SC);

// ================================================================== 9 Try it: run and quarantine
{
  const s = content(SL, "Try it: run the client and read the quarantine");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/hcm-entra",
    "$ python python/hcm_to_scim.py --extract tests/fixtures/hcm_extract_sample.csv --as-of 2026-10-25 --out out",
    "{\"counts\": {\"ready\": 9, \"quarantined\": 9, \"superseded\": 1}, \"batches\": 1, \"disables\": 3, \"held\": false, ...}",
    "$ python -c \"import json; [print(q['person_key'], '|', '; '.join(q['reasons'])) for q in ...]\"",
    "100006 | worker type P refused: pending worker: provision from the hire record, not the pending record",
    "100007 | unknown worker type X",
    "(missing) | required column PersonNumber is empty",
    "12345678901234567 | PersonNumber doesn't fit employeeId (letters, digits and hyphens, at most 16 characters)",
    "100009 | worker is recorded as their own manager",
    "100010 | inactive assignment with no termination date: the leave date can't be set",
    "100014 | DepartmentName is longer than 64 characters",
    "100015 | PositionCategory 'ZZZ' isn't in the approved code list",
    "100016 | DepartmentCode 'org 300' isn't a code (A-Z, 0-9, hyphen)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10 });
  line(s, "Exit", "Exit code 2: rows were quarantined. 9 ready, 9 quarantined, 1 superseded, 3 disables, not held.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 1 and 2; examples/hcm-entra/tests/fixtures/hcm_extract_sample.csv (fictional).");
  notes(s,
`Try it. Lab 1 runs in the hcm-entra folder of the examples, on a fictional HR extract, and nothing in it sends a request. Step one runs the hardened client with an as-of date of October twenty-fifth. It prints its counts: nine rows ready, nine quarantined, one superseded, one batch, three disables, and the run isn't held. The command exits two, because rows were quarantined. Step two prints the quarantine, one line per refused row. A pending worker. An unknown worker type. A row with no person number at all. A seventeen-character key that doesn't fit employee I D. A worker recorded as their own manager. An inactive assignment with no termination date. A department name that's too long, a position category that isn't in the code list, and a department code with a space in it. Every one of those, CSV2SCIM would have sent.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2.`);
}

// ================================================================== 10 Try it: provenance and rerun
{
  const s = content(SL, "Try it: check the provenance, then rerun");
  tag(s, "How");
  const c = code(s, "Prov", 0.6, 1.45, 12.15, [
    "# Step 3: show the manifest, then hash the extract yourself",
    "$ cat out/provenance.json",
    "  \"extract_sha256\": \"ca06b111d5fdd45b8355952d0a9beb403eb442af61a6f4a5dc0f0ef9bb643344\", ...",
    "      \"batch_sha256\": \"ab8f211ec83923783587b701459178f7d3782bedb9881395ecf7d643bc3cdf06\",",
    "      \"person_keys\": [ \"100003\", \"100008\", \"100013\", \"100000\", ... ]",
    "$ python -c \"import hashlib,sys;print(hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest())\" \\",
    "    tests/fixtures/hcm_extract_sample.csv",
    "ca06b111d5fdd45b8355952d0a9beb403eb442af61a6f4a5dc0f0ef9bb643344",
    "# Step 4: run it again into out-2, and compare the bytes",
    "$ cmp out/bulk-request-001.json out-2/bulk-request-001.json && cmp out/provenance.json \\",
    "    out-2/provenance.json && echo identical",
    "identical",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED AND WRAPPED)", pt: 10.5 });
  line(s, "Lead", "The batch starts with the leaver, 100003. Microsoft's sample gives a new bulkId every run, so its hashes never repeat.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 3 and 4; Book 19, Ch 01 \"The provenance manifest.\"");
  notes(s,
`Step three checks the provenance. Show the manifest, then hash the extract yourself. The hash you compute, starting c a oh six b one one one, is the same as the extract hash in the manifest. So the record really is tied to this file. Look at the batch's person keys, too: they start with the leaver, one hundred thousand and three. Leavers first. Step four runs the client again, into a second output folder, and compares the bytes of the bulk request and the manifest. They're identical. That's the property the bulk I D buys you: the same input gives the same batch hash, every time. Microsoft's sample gives a new bulk I D on every run, so its hashes never repeat. The long commands on the slide are wrapped, and the manifest is trimmed.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 3 and 4.`);
}

// ================================================================== 11 Try it: break and hold
{
  const s = content(SL, "Try it: break a row, hold a run, run the tests");
  tag(s, "How");
  const c = code(s, "Break", 0.6, 1.45, 12.15, [
    "# Step 5: worker 100005's DepartmentCode in lower case",
    "$ sed '/^100005,/s/ORG-100/org-100/' tests/fixtures/hcm_extract_sample.csv > extract-broken.csv",
    "$ python python/hcm_to_scim.py --extract extract-broken.csv --as-of 2026-10-25 --out out-broken",
    "{\"counts\": {\"ready\": 8, \"quarantined\": 10, \"superseded\": 1}, \"batches\": 1, \"disables\": 3, ...}",
    "100005 | DepartmentCode 'org-100' isn't a code (A-Z, 0-9, hyphen)",
    "# Step 6: hold a run",
    "$ echo '{\"max_disables_per_run\": 1}' > settings-hold.json",
    "$ python python/hcm_to_scim.py ... --settings settings-hold.json --out out-hold",
    "{... \"held\": true, \"hold_reason\": \"3 disables exceed max_disables_per_run (1): held for confirmation",
    "  (Book 03, Appendix B pause switch)\"}",
    "(exit code 3)",
    "# Step 7: the tests",
    "$ python -m pytest -q -p no:cacheprovider tests/python",
    "70 passed",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10 });
  line(s, "Clean", "Step 8 cleans up: rm -rf out out-2 out-broken out-hold extract-broken.csv settings-hold.json", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 5 to 8; examples/hcm-entra: python/hcm_to_scim.py, tests/python.");
  notes(s,
`Step five breaks a row on purpose. The sed command writes a copy of the extract with worker one hundred thousand and five's department code in lower case. Run the client on it, and the counts become eight ready and ten quarantined, and the quarantine says why: the lower-case value isn't a code. One small typo in HR, and the record stops at the middleware instead of reaching the directory. Step six holds a run. A settings file allows only one disable per run, and the fixture has three. So the client holds the whole run, with exit code three, and says why: three disables exceed the limit, held for confirmation. Nothing is sent until someone confirms it with the confirm large delta option. Step seven runs the tests: seventy pass. Step eight cleans up.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 5 to 8.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: send five records to your test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A test tenant, never production, with Microsoft Entra ID P1, P2 or ID Governance"],
    ["The app", "Create an API-driven inbound provisioning app, and extend its schema with CSV2SCIM"],
    ["The sender", "One permission; a certificate or managed identity, never a secret"],
    ["Send and reconcile", "Send five fictional records with the hardened client; reconcile against the provisioning logs"],
    ["Back it out", "Step 7 sends the five again as inactive, with a termination date, and unsets the token variable"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow Book 19, Chapter 01, Lab 2, step by step.");
  sources(s, "Sources: Module 1, Unit 5 \"Exercise: Lab 2 (your test tenant)\"; Book 19, Ch 01 \"Lab 2: test tenant.\"");
  notes(s,
`Lab 2 runs the client against a test tenant, never production, with Microsoft Entra ID P1, P2 or ID Governance. Create an API-driven inbound provisioning app, and extend its schema with CSV2SCIM. Grant the sender one permission, with a certificate or a managed identity, never a secret. Send five fictional records with the hardened client, and reconcile them against the provisioning logs. Remember the two-oh-two: the reconciliation is where you find out whether each record was written. To back it out, step seven sends the five records again as inactive, with a termination date, and unsets the token variable. The authors haven't run Lab 2. Follow Chapter 01's Lab 2, step by step.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test tenant)"; Book 19, Chapter 01 — "Lab 2: test tenant."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 1");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.9, 2.4, 5.85], ["Requirement", "KSI", "Evidence the ISSO keeps"], [
    ["SI-10 Input Validation; AC-2", "KSI-IAM-AAM", "validation-report.json, keys and hashes only"],
    ["SI-10; IA-4 Identifier Management", "KSI-IAM-AAM", "quarantine.json, in the access-controlled audit store"],
    ["CM-3 Change Control; AU-3", "KSI-CMT-LMC", "provenance.json: every batch tied by hash to its inputs"],
    ["AC-2; CM-3, for a mass disable", "KSI-IAM-AAM", "The change record with the --confirm-large-delta confirmation"],
    ["SA-11; SR-3 Supply Chain", "KSI-CMT-VTD; KSI-SCR-MIT", "The test results, and the pinned sample's snapshot.json"],
    ["AC-6; IA-5 (Lab 2)", "KSI-IAM-ELP; KSI-IAM-SNU", "The app registration and its consent record"],
    ["AU-6; AC-2 (Lab 2)", "KSI-MLA-RVL", "The findings queue, and the reconciliation report"],
  ], { fontSize: 12, limit: 5.9 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them (design guidance).", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: NIST SP 800-53B Moderate baseline; FedRAMP, \"Key Security Indicators\"; Module 1, Units 1 and 7; Book 19, Ch 01 \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. The middleware is where an HR record becomes an account, so its outputs are account-management evidence. The validation report supports input validation, S I ten, and account management, A C two. The quarantine supports identifier management, and lives in the access-controlled audit store, because it holds personal data. The provenance manifest supports configuration change control and the content of audit records. A confirmed mass disable leaves a change record. The tests and the pinned sample's snapshot support developer testing and supply chain controls. And Lab 2 adds the sender's app registration and consent record, and the reconciliation against the provisioning logs. The controls are from NIST SP 800-53, in its Moderate baseline. Key Security Indicators are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with what its providers report. Which output supports which control is this workbook's reading.`,
  `${M} — Unit 1 "Introduction" (Chapter 01's requirements, KSIs and evidence); Unit 7 "Summary."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on the middleware", [
    { q: "The /bulkUpload endpoint answers 202 Accepted. What does that tell you?", options: ["a. Every user in the batch was written to the directory", "b. The batch was staged; each record's result appears in the provisioning logs", "c. The batch was validated against the code lists"] },
    { q: "A run would disable more accounts than max_disables_per_run allows. What happens?", options: ["a. The client sends the first batch and stops", "b. The client drops the extra disables", "c. The whole run is held, with exit code 3, until someone confirms it with --confirm-large-delta"] },
  ], "1 b: the endpoint is asynchronous, so reconcile against the logs. 2 c: the whole run is held (step 6 of the lab).");
  sources(s, "Sources: Module 1, Unit 6 \"Knowledge check,\" questions 1 and 3, and \"Check your answers\"; Microsoft Learn, \"Perform bulkUpload.\"");
  notes(s,
`Check yourself with two questions. First: the bulk upload endpoint answers two-oh-two Accepted. What does that tell you? The answer is b: the batch was staged for the provisioning job, and each record's result appears in the provisioning logs. Learn's bulk upload API reference says the endpoint is asynchronous, so a two-oh-two is never proof that a user was written. Second: a run would disable more accounts than the maximum disables per run allows. What happens? The answer is c: the whole run is held, with exit code three, until someone confirms it with the confirm large delta option. You saw that in step six of the lab. The module page has two more questions, on the bulk I D and on partial records, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 2, a validation kit check");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Saw where the middleware's job ends and the provisioning service's begins",
    "Ran the client that refuses bad rows and orders leavers first",
    "Held a mass disable, and checked the record by hash",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2: Write a validation kit check", [
    "VK-SYNC-02, Gate 3's match-blocking check",
    "Read only, least privilege",
    "Can't pass when it didn't look",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Before shipping: ",
    "work through the Chapter 01 checklist in Book 19.");
  sources(s, "Sources: Module 1, Unit 7 \"Summary\"; Module 2, \"Unit 1: Introduction.\"");
  notes(s,
`To sum up. You learned where the middleware's job ends and the provisioning service's begins, and you ran the client that refuses bad rows, orders leavers first, holds a mass disable, and keeps a record an auditor can follow by hash. The evidence an ISSO keeps: the validation report, the provenance manifest and, in Lab 2, the apply results, in the evidence store; the quarantine in the access-controlled audit store; the change record for any confirmed hold; the sender's app registration; and the reconciliation. Before shipping, work through the Chapter 01 checklist. Next is Module 2: write a validation kit check. You'll build and read V K SYNC oh two, the check that soft match and hard-match takeover are blocked, and see why a read-only check still asks for the least privilege it can.`,
  `${M} — Unit 7 "Summary"; Module 2 — "Unit 1: Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/attribute-driven-migration/01-the-hr-middleware.md (Attribute-Driven Migration learning path, Module 1): Units 1 to 7, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design: Book 19, Chapter 01 \"Where the middleware sits,\" \"What it leaves to you,\" \"Validate and fail closed,\" \"Send the complete record every time,\" \"Order, batch and hold,\" \"The provenance manifest,\" Lab 2, Checklist; the implementation guide's Gates 2 and 3.",
  "Kit: examples/hcm-entra (python/hcm_to_scim.py; config/mapping.json; tests/python; tests/fixtures/hcm_extract_sample.csv). Fictional records. Illustrative: tested against fixtures, not against a production tenant.",
  "Lab output: run November 3, 2026 with Python 3.14.3 in a scratch copy of examples/hcm-entra; it matches the module page and data/kit-captures/adm (01-2 to 01-8). Verification: docs/training/attribute-driven-migration/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
