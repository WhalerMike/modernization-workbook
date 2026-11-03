// HR-Driven Identity learning path, Module 2: Run contractors from their own source — the module's narrated deck.
// Teaches docs/training/hr-driven-identity/02-contractor-sources.md, Learn-style: objectives, the concepts, "Try it"
// slides with the real Lab 1 commands and output (run November 2, 2026 in a scratch copy of examples/hr-lifecycle and
// examples/hcm-entra), Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact
// comes from the module page, the learning path's verification log, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-hr-module-2/build.js \
//                      presentations/training-hr-module-2/Training_HR_Module_2.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 2: Run contractors from their own source",
  footer: "Federal Modernization Workbook  ·  HR-Driven Identity learning path, Module 2: Run contractors from their own source",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "HR-Driven Identity learning path — Module 2: Run contractors from their own source";
const OUT = process.argv[2] || "Training_HR_Module_2.pptx";
const M = "Training, HR-Driven Identity, Module 2";

// The title slide, as shared.js draws it, with this path's name over the units.
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "HR-DRIVEN IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
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
  const s = title(SI, "Module 2: Run contractors from their own source", "HR-Driven Identity learning path · Gate G2 Sources, with workbook Chapter 02",
    ["Contractors need their own source  ·  The earliest end  ·  Source and reconciliation rules", "The sponsor review  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 2 of the HR-Driven Identity learning path: run contractors from their own source. This is Gate 2, Sources, with Chapter 02 of the developer workbook. In Module 1 you named one writer for every account state, and saw that inbound provisioning writes the leave date and the active value. This module applies that to the people HR doesn't hold: contractors. You'll compute each contractor's earliest end from several conditions, send the result through the same middleware as employees, reconcile what the contractor register, the card system and the directory say, without changing anything, and write a sponsor review that ends access when nobody answers. The code runs on fictional contractors, on your laptop. It's illustrative: unit-tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a contractor's end date keeps access alive");
  tag(s, "Why");
  const l = panel(s, "Where", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "EMPLOYEES COME FROM HR", "Your contractors don't", [
    "COR spreadsheets",
    "A suitability register",
    "The PIV sponsorship records",
  ], 14);
  const r = panel(s, "Gap", 6.85, 1.45, 5.9, null, HEX.red, HEX.redTint, "THE GAP", "An end date nobody updates", [
    "A contract is cut short; nobody updates the spreadsheet",
    "That end date keeps access alive",
  ], 14);
  callout(s, "Point", Math.max(l, r) + 0.35, 1.0, "FaUserClock", HEX.red, "This module: ",
    "give contractors an end date that can't be left open, send it through the employees' middleware, and reconcile without changing anything.");
  sources(s, "Sources: Module 2, \"Introduction.\"");
  notes(s,
`Why does this gate exist? Employees come from HR. Your contractors don't. They live on C O R spreadsheets, on a suitability register, or in the PIV sponsorship records. And when a contract is cut short, nobody updates the end date in a spreadsheet. That end date is what keeps the contractor's access alive. So in this module you give contractors an end date that can't be left open. You compute each contractor's earliest end from the contract, the completion date, suitability, the card and the sponsor. You send it through the same middleware as employees. And you reconcile what the register, the card system and the directory say, without changing anything in any of them.`,
  `${M} — Unit "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 2", [
    "Name the end conditions that make up a contractor's earliest end, and say why the earliest one wins",
    "Run the extract, read its decisions, and hand the extract to the HR middleware",
    "Run the read-only reconciliation and explain each CR finding",
    "Describe the sponsor review settings that end access when a sponsor doesn't respond",
  ], [
    "Module 1: inbound provisioning writes the leave date and active",
    "Lab 1: the path's setup; it also calls examples/hcm-entra",
    "Lab 2: a worldwide or GCC test tenant, never production",
  ], 50);
  sources(s, "Sources: Module 2, \"Learning objectives,\" \"Prerequisites\"; Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll name the end conditions that make up a contractor's earliest end, and say why the earliest one wins. You'll run the extract, read its decisions, and hand the extract to the HR middleware. You'll run the read-only reconciliation and explain each C R finding it reports. And you'll describe the sponsor review settings that end access when a sponsor doesn't respond. You need Module 1 first, for one fact in particular: inbound provisioning is the writer of the leave date and of the active value. Lab 1 uses the path's usual setup, and also calls the H C M to Entra middleware from the same clone. Lab 2 needs a worldwide or G C C test tenant, never production.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Order
{
  const s = content(SC, "The guide's order: measure, settle, then the leaver");
  tag(s, "What");
  const b = table(s, "Order", 1.45, [0.8, 3.6, 7.75], ["#", "Step", "In this module"], [
    ["1", "Measure before changing anything", "The reconciliation in Lab 1 is read-only: it changes nothing"],
    ["2", "Settle the six questions", "With the register's owner"],
    ["3", "Ship the contractor leaver before the joiner", "The leaver closes the gap where an end date nobody updates keeps access alive"],
  ], { fontSize: 13, limit: 3.5 });
  panel(s, "Design", 0.6, b + 0.3, 12.15, null, HEX.navy, HEX.navyTint, "WHERE THE DESIGN COMES FROM", null, [
    "Book 03, Chapter 06: why contractors fall outside Federal HR 2.0's scope",
    "Book 03, Appendix A, Contractor leavers: the end conditions and their order",
    "The contractor evaluation: an agency-owned register now, the Oracle contingent worker as a later source swap",
  ], 13);
  sources(s, "Sources: Module 2, Unit 1 \"Contractors need their own source\"; knowledge check answer 3.");
  notes(s,
`Start with the guide's Step 2, and notice its order. First, measure before changing anything; the reconciliation you'll run in the lab is read-only. Second, settle the six questions with the register's owner. Third, ship the contractor leaver before the joiner. Why the leaver first? Because the leaver closes the gap: a spreadsheet end date that nobody updates keeps access alive, and the middleware's earliest-end rule closes it. Then read where the design comes from. Chapter 06 of the Federal Modernization Workbook's HR-Driven Identity book explains why contractors fall outside Federal HR 2.0's scope. Its Appendix A gives the contractor end conditions and their order. And the contractor evaluation recommends an agency-owned register now, with the Oracle contingent worker as a later source swap.`,
  `${M} — Unit 1 "Contractors need their own source"; Knowledge check answer 3.`);
}

// ================================================================== 5 Earliest end
{
  const s = content(SC, "The earliest end: the first condition that applies");
  tag(s, "What");
  const b = table(s, "Ends", 1.45, [5.2, 6.95], ["End condition (config/contractor-rules.json)", "Where it comes from"], [
    ["The contract end", "The register's ContractEnd; required (CS-01)"],
    ["The completion date, when earlier", "The register's CompletionDate"],
    ["Suitability withdrawn", "The register's SuitabilityWithdrawnDate"],
    ["The card terminated, revoked or expired", "The card records; cardStatusesThatEnd"],
    ["The sponsor's separation, plus a grace period", "sponsorGraceDays: 30 (design guidance)"],
    ["A missed sponsor recertification", "recertificationDays: 180 (design guidance)"],
  ], { fontSize: 13, limit: 5.0 });
  callout(s, "Win", b + 0.3, 0.95, "FaUserClock", HEX.navy, "The earliest wins: ",
    "extract computes every condition that applies and takes the first. The agency sets the grace and recertification periods.");
  sources(s, "Sources: Module 2, Unit 2 \"The earliest end and the sponsor review\"; knowledge check answer 1; examples/hr-lifecycle/config/contractor-rules.json.");
  notes(s,
`Here's the heart of the gate: the earliest end. A contractor can stop needing access for several reasons, and the rules file lists them. The contract ends. The completion date comes earlier than the contract end. Suitability is withdrawn. The card is terminated, revoked or expired. The sponsor separates, plus a grace period, thirty days in the program's file. Or the sponsor misses a recertification, every hundred eighty days in the file. The extract computes every condition that applies to each contractor and takes the first one. That's the earliest end, and it becomes the leave date. A missing contract end isn't treated as no end; the record doesn't go through at all, because a contractor is never provisioned open-ended. The grace and recertification periods are design guidance: your agency sets them.`,
  `${M} — Unit 2 "The earliest end and the sponsor review": workbook Chapter 02, "The earliest end"; examples/hr-lifecycle/config/contractor-rules.json.`);
}

// ================================================================== 6 Rules
{
  const s = content(SC, "The source checks and the reconciliation's rules");
  tag(s, "What");
  const b = table(s, "Rules", 1.45, [1.15, 1.25, 9.75], ["Rule", "Severity", "What it means"], [
    ["CS-01", "Finding", "No contract end date: quarantined, never provisioned open-ended"],
    ["CS-02", "Finding", "The sponsor isn't in the HR export: no manager, no account"],
    ["CS-03", "Warn", "The sponsor separated: access ends after the grace period unless a new sponsor is recorded"],
    ["CR-01", "Finding", "An enabled account past its earliest end"],
    ["CR-02", "Finding", "An enabled contractor account with no register record (an orphan)"],
    ["CR-03", "Finding", "An active card for a person the contractor source doesn't hold"],
    ["CR-04", "Warn", "An active register record with no account"],
    ["CR-05", "Finding", "A leave date that isn't the earliest end, so the leaver workflow fires on the wrong day"],
  ], { fontSize: 12.5, limit: 5.6 });
  line(s, "Call", "The reconciliation's one Graph call: GET /users, with User-LifeCycleInfo.Read.All and User.Read.All.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 2, Unit 2; Lab 1, steps 1, 3 and 5; examples/hr-lifecycle/python/contractor_source.py.");
  notes(s,
`Two sets of rules. The extract's source checks, C S, look at each register record. No contract end is C S oh one, and the record is quarantined. A sponsor who isn't in the HR export is C S oh two: no manager, so no account. A sponsor who has separated is a C S oh three warning: access ends after the grace period unless someone records a new sponsor. Then the reconciliation's rules, C R, compare the register, the cards and the directory. C R oh one is an enabled account past its earliest end. C R oh two is an orphan, an enabled contractor account with no register record. C R oh three is an active card the source doesn't hold. C R oh four is a record with no account. And C R oh five is a leave date that isn't the earliest end, so the leaver workflow fires on the wrong day.`,
  `${M} — Unit 2 "The earliest end and the sponsor review"; Lab 1, steps 1, 3 and 5; examples/hr-lifecycle/python/contractor_source.py.`);
}

// ================================================================== 7 Middleware and review
{
  const s = content(SC, "The middleware sends it; the sponsor review ends it");
  tag(s, "What");
  const l = panel(s, "Mid", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE EXTRACT", "It doesn't send anything", [
    "contractor_source.py writes an extract in the HR middleware's layout",
    "The middleware from Book 19, Chapter 01 (examples/hcm-entra) builds the SCIM requests",
    "Its dry run is its default",
  ], 13);
  const r = panel(s, "Rev", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE SPONSOR REVIEW", "On the contractor package's policy", [
    "Bi-annual",
    "The manager, the sponsor, reviews; a named fallback reviewer",
    "Remove access when no one responds",
  ], 13);
  callout(s, "Unconfirmed", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Unconfirmed: ",
    "the kit lists the requestor's manager as an access review reviewer among what Lab 2 must confirm.");
  sources(s, "Sources: Module 2, Unit 2; examples/hr-lifecycle README (\"What it builds on,\" \"Not covered\"); config/contractor-rules.json.");
  notes(s,
`Two more pieces. First, the extract doesn't send anything. It writes a file in the HR middleware's layout, and the middleware from Chapter 01 of Building the Attribute-Driven Migration builds the skim requests. Its dry run is its default, so nothing reaches a tenant unless you ask it to. And in Module 1's register, inbound provisioning already names both the HR app and the contractor-source app, through that same middleware. Second, the sponsor review. It goes on the contractor access package's assignment policy. It runs twice a year. The manager, who is the sponsor, reviews, with a named fallback reviewer. And when nobody responds, access is removed. One caution from the kit: using the requestor's manager as a reviewer is among the things it lists as unconfirmed, so Lab 2 checks it.`,
  `${M} — Unit 2 "The earliest end and the sponsor review": workbook Chapter 02, "The sponsor review"; examples/hr-lifecycle README — "What it builds on," "Not covered."`);
}
endModule(SC);

// ================================================================== 8 Try it: extract
{
  const s = content(SL, "Try it: compute the earliest ends");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 8.3, [
    "# Lab 1, steps 1 and 2, in examples/hr-lifecycle",
    "$ python python/graph_export.py --task contractor-reconcile --list",
    "Task contractor-reconcile: User-LifeCycleInfo.Read.All, User.Read.All",
    "  GET /users  [User-LifeCycleInfo.Read.All, User.Read.All]",
    "$ python python/contractor_source.py extract \\",
    "    --register tests/fixtures/ch02/contractor-register.csv \\",
    "    --cards tests/fixtures/ch02/cards.csv \\",
    "    --sponsors tests/fixtures/ch02/hr-sponsors.csv \\",
    "    --rules config/contractor-rules.json \\",
    "    --as-of 2026-11-01 --out out/ch02/extract",
    "Contractors: 9 records: 3 active, 4 inactive (past their",
    "  earliest end), 2 quarantined",
    "Source: 2 Finding, 1 Warn, 1 Info",
    "Extract written to out/ch02/extract/contractors-extract.csv;",
    "  build the SCIM requests with examples/hcm-entra/...",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (WRAPPED, TRIMMED)", pt: 11 });
  panel(s, "Read", 9.15, 1.45, 3.6, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "One read, two permissions",
    "9 contractors as of November 1",
    "3 active, 4 inactive",
    "2 quarantined: CS-01 and CS-02",
    "Exit code 2 on this fixture",
  ], 13);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 1 and 2; verification log, \"Found during the re-run\" (exit code).");
  notes(s,
`Try it. Lab 1 runs in the hr-lifecycle folder, on fictional contractors. Step one lists the reconciliation's only read: one GET on users, with two read permissions, the lifecycle information read and User dot Read dot All. Step two computes the earliest ends. You give the extract the contractor register, the card records, the sponsors from the HR export, the rules file, and an as-of date, the first of November. It finds nine contractors. Three are active. Four are inactive, already past their earliest end. And two are quarantined, so they won't be provisioned at all. The source checks report two findings, one warning and one information item, and the exit code is two. The last line tells you the next step: build the skim requests with the middleware. The output is wrapped and trimmed to fit.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2; verification log — "Found during the re-run."`);
}

// ================================================================== 9 Try it: decisions
{
  const s = content(SL, "Try it: read the decisions and build the requests");
  tag(s, "How");
  const c = code(s, "Dec", 0.6, 1.45, 12.15, [
    "# Step 3",
    "$ python -c \"import json; [print(d['PersonKey'], d['Action'], d['EarliestEnd'], d['Reason']) \\",
    "    for d in json.load(open('out/ch02/extract/decisions.json'))]\"",
    "900001 active 2027-01-11 contract end",
    "900002 inactive 2026-10-15 completion date",
    "900003 inactive 2026-10-20 suitability withdrawn",
    "900004 inactive 2026-10-30 sponsor gone past the grace period",
    "900005 inactive 2026-10-25 sponsor recertification due",
    "900006 active 2026-11-10 contract end",
    "900007 quarantine  no contract end",
    "900008 quarantine 2027-03-31 contract end",
    "900009 active 2027-03-01 sponsor recertification due",
    "# Step 4",
    "$ python ../hcm-entra/python/hcm_to_scim.py --extract out/ch02/extract/contractors-extract.csv --as-of 2026-11-01 --out out/ch02/scim",
    "{\"counts\": {\"ready\": 7}, \"batches\": 1, \"disables\": 4, \"held\": false, \"hold_reason\": \"\"}",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (COMMAND WRAPPED)", pt: 10 });
  line(s, "Read", "Four inactive, four reasons. 900007 has no contract end (CS-01); 900008's sponsor isn't in the HR export (CS-02). Seven ready, four disables, nothing sent.", c + 0.2, 0.75, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 3 and 4; examples/hcm-entra (Book 19, Chapter 01); fictional records.");
  notes(s,
`Step three prints the nine decisions: each contractor's action, earliest end and reason. Look at the four inactive ones. Each is inactive for a different reason: a completion date, suitability withdrawn, a sponsor gone past the grace period, and a sponsor recertification that came due. The last one is the knowledge-check case: whatever the contract says, the earliest condition wins. The two quarantined records are nine hundred thousand and seven, which has no contract end, and nine hundred thousand and eight, whose sponsor isn't in the HR export. Step four hands the extract to the middleware. It reports seven records ready, in one batch, and four of them are disables, the four inactive contractors. Nothing is held, and nothing is sent: the middleware only builds the requests.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 3 and 4.`);
}

// ================================================================== 10 Try it: reconcile
{
  const s = content(SL, "Try it: reconcile the register, cards and directory");
  tag(s, "How");
  const c = code(s, "Rec", 0.6, 1.45, 12.15, [
    "# Step 5",
    "$ python python/contractor_source.py reconcile --register tests/fixtures/ch02/contractor-register.csv --cards tests/fixtures/ch02/cards.csv \\",
    "    --sponsors tests/fixtures/ch02/hr-sponsors.csv --accounts tests/fixtures/ch02/contractor-users.json --rules config/contractor-rules.json \\",
    "    --as-of 2026-11-01 --cloud gcc --out out/ch02/reconcile",
    "Reconciliation: 7 Finding, 1 Warn, 0 Info",
    "$ python -c \"import json; [print(r['Rule'], r['Severity'], r['Object'], '|', r['Issue']) for r in json.load(open('out/ch02/reconcile/findings.json'))]\"",
    "CR-01 Finding bailey.ortiz@contoso.example | enabled past its earliest end 2026-10-15 (completion date)",
    "CR-01 Finding cameron.wu@contoso.example | enabled past its earliest end 2026-10-20 (suitability withdrawn)",
    "CR-01 Finding devon.hale@contoso.example | enabled past its earliest end 2026-10-30 (sponsor gone past the grace period)",
    "CR-01 Finding ellis.ward@contoso.example | enabled past its earliest end 2026-10-25 (sponsor recertification due)",
    "CR-02 Finding temp.vendor@contoso.example | enabled contractor account with no register record (orphan)",
    "CR-03 Finding 900011 | active card for a person the contractor source doesn't hold (contractor credential drift)",
    "CR-05 Finding finley.moss@contoso.example | employeeLeaveDateTime 2026-12-10 isn't the earliest end 2026-11-10; ...",
    "CR-04 Warn indy.shah@contoso.example | active register record with no account",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (WRAPPED, TRIMMED: \"...\" MARKS A CUT)", pt: 10 });
  line(s, "Read", "The four CR-01 accounts are the four disables from step 4. Once those are sent, the next reconciliation shows no CR-01.", c + 0.2, 0.75, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" step 5; knowledge check answer 2; fictional records.");
  notes(s,
`Step five reconciles. You give it the same register, cards, sponsors and rules, plus an export of the contractor accounts in the directory, and it reports seven findings and one warning. Four are C R oh one: accounts still enabled past their earliest end. Those four are exactly the four disables the middleware built in step four, so once those disables are sent, the next reconciliation shows none. There's one orphan, C R oh two, an enabled contractor account with no register record. One C R oh three, an active card for someone the source doesn't hold. One C R oh five, a leave date that isn't the earliest end, so the leaver workflow would fire on the wrong day. And one warning, C R oh four, a register record with no account. The reconciliation changes nothing; it only reports.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 5; Knowledge check answer 2.`);
}

// ================================================================== 11 Try it: review
{
  const s = content(SL, "Try it: write the sponsor review settings");
  tag(s, "How");
  const c = code(s, "Rev", 0.6, 1.45, 12.15, [
    "# Step 6",
    "$ python python/contractor_source.py review --rules config/contractor-rules.json --out out/ch02/review",
    "Review settings written to out/ch02/review/assignment-policy-review.json for review; nothing was sent",
    "$ python -c \"import json; print(json.dumps(json.load(open('out/ch02/review/assignment-policy-review.json')), indent=2))\"",
    "  \"reviewSettings\": {",
    "    \"expirationBehavior\": \"removeAccess\",",
    "    \"fallbackReviewers\": [ { \"@odata.type\": \"#microsoft.graph.singleUser\", \"userId\": \"c1000000-...\" } ],",
    "    \"primaryReviewers\": [ { \"@odata.type\": \"#microsoft.graph.requestorManager\", \"managerLevel\": 1 } ],",
    "    \"schedule\": { \"expiration\": { \"duration\": \"P14D\", \"type\": \"afterDuration\" },",
    "      \"recurrence\": { \"pattern\": { ..., \"interval\": 6, ..., \"type\": \"absoluteMonthly\" }, ... },",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED AND REFLOWED)", pt: 10 });
  line(s, "Read", "Remove access on no response; the requestor's manager reviews at level 1; every six months; 14 days to answer.", c + 0.2, 0.45, 13.5);
  line(s, "Tests", "Step 7: python -m pytest tests -q prints 57 passed. Then rm -rf out.", c + 0.75, 0.45, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 6 and 7; knowledge check answer 4; examples/hr-lifecycle/config/contractor-rules.json.");
  notes(s,
`Step six writes the sponsor review settings, for review. The tool says so: nothing was sent. Print the file and read four values. The expiration behavior is remove access, so a missed recertification ends access, just as the earliest-end rule says. The primary reviewer is the requestor's manager, at level one, with a single named user as the fallback. The recurrence is absolute monthly with an interval of six, so the review runs every six months. And reviewers have fourteen days to answer. The file also names its target: merge these settings into the contractor package's assignment policy, and send the whole policy with the Graph PowerShell cmdlet after review. Step seven runs the tests, and fifty-seven pass. Then delete the output folder. The output on the slide is trimmed and reflowed.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 6 and 7; Knowledge check answer 4.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: send two test contractors in a test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant, never production"],
    ["Set up", "A contractor provisioning app"],
    ["Send and reconcile", "Two test contractors through the middleware's apply path; then reconcile against the tenant"],
    ["Review settings", "Apply them to a test contractor package"],
    ["Permissions", "SynchronizationData-User.Upload.OwnedBy on the contractor app only, for the middleware; User.Read.All and User-LifeCycleInfo.Read.All for the reader"],
    ["Back it out", "Restore the policy's review settings from your read-back; pause the job (it keeps its state); delete the test contractors; remove permissions and output"],
  ], { fontSize: 12, limit: 5.4 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the steps are the workbook's Lab 2, written from Microsoft Learn's procedures.");
  sources(s, "Sources: Module 2, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 runs the gate in your own test tenant, worldwide or G C C, never production. Set up a contractor provisioning app. Send two test contractors through the middleware's apply path, then reconcile against the tenant. And apply the review settings to a test contractor package; the chapter names the cmdlet and permission for updating the policy. The middleware's identity holds one permission, the synchronization upload permission, scoped to the contractor provisioning app only. The reader app holds User dot Read dot All and the lifecycle information read. To back it out, restore the policy's previous review settings from your read-back, pause the provisioning job, which keeps its state, delete the test contractors, remove the permissions, and delete the export and output folders. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate 2");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.2, 8.95], ["Requirement", "What it asks of Gate 2"], [
    ["NIST SP 800-53 AC-2", "Account management, for contractors too"],
    ["PS-7", "External personnel security"],
    ["IA-4(4)", "Identify each person by status, such as contractor"],
    ["OMB M-22-09", "Enterprise identity draws on HR, contract management and personnel security"],
  ], { fontSize: 13, limit: 3.8 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "Both reconciliation folders with their manifests: before the contractor leaver ships, and after, with zero CR-01",
    "The extract and the middleware's provenance manifest",
    "The authority-per-fact table signed by the governance body; the privacy office's determination for the register and card system",
  ], 13);
  sources(s, "Sources: Module 2, \"Introduction\" (the federal requirement); \"Summary\" (the evidence an ISSO keeps).");
  notes(s,
`The federal requirement. This gate meets NIST special publication eight hundred fifty-three A C two, account management, and P S seven, external personnel security. It meets I A four, enhancement four, which identifies each person by status, such as contractor. And it meets O M B M-22-09's expectation that enterprise identity draws on HR, contract management and personnel security. The evidence an ISSO keeps for Gate 2 starts with both reconciliation output folders and their manifests: one run before the contractor leaver ships, and one after, with zero C R oh one. Then the extract and the middleware's provenance manifest. The authority-per-fact table, signed by the governance body. And the privacy office's determination for the register and the card system.`,
  `${M} — Unit "Introduction" (the federal requirement); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on contractors", [
    { q: "The contract runs to January; sponsor recertification was due in October. Which end?", options: ["a. The contract end, because it's the contractual date", "b. The earliest condition that applies: the recertification due date", "c. Whichever date the COR entered most recently"] },
    { q: "What does a CR-01 finding mean?", options: ["a. An enabled account past its earliest end", "b. An account with no register record", "c. A register record with no account"] },
  ], "1 b: extract computes every end condition that applies and takes the first. 2 a: CR-01 is an enabled account past its earliest end.");
  sources(s, "Sources: Module 2, \"Knowledge check,\" questions 1 and 2, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: a contractor's contract runs to January, but their sponsor recertification was due in October. Which end does the extract use? The answer is b: the earliest condition that applies, the recertification due date. The extract computes every end condition and takes the first. Second: what does a C R oh one finding mean? The answer is a: an enabled account past its earliest end. An account with no register record is the orphan, C R oh two, and a record with no account is C R oh four. Once the disables are sent, the next reconciliation shows no C R oh one. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 2; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 3, joiners on day one");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Computed nine contractors' earliest ends",
    "Built the SCIM requests that disable four of them",
    "Reconciled the register, the cards and the directory",
    "Wrote the sponsor review that removes access on no response",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 3: Make joiners ready on day one", [
    "Workflows as reviewed files",
    "The lint and the plan",
    "Day-one readiness",
  ], 13.5);
  callout(s, "Carry", Math.max(l, r) + 0.3, 0.85, "FaUserClock", HEX.teal, "Carry forward: ",
    "Module 3's workflow files include the contractor leaver workflow.");
  sources(s, "Sources: Module 2, \"Summary\"; Module 3, \"Prerequisites,\" \"Introduction.\"");
  notes(s,
`To sum up. You computed nine contractors' earliest ends. You built the skim requests that disable four of them, without sending anything. You reconciled the register, the cards and the directory, and found the four accounts those disables will close, plus an orphan, a stray card and a wrong leave date. And you wrote the sponsor review that removes access when nobody responds. Next is Module 3: make joiners ready on day one. Its workflow files include the contractor leaver workflow from this gate. You'll keep Lifecycle Workflows definitions as reviewed files, lint them before they reach the tenant, plan each change against what the tenant holds, and measure how many new hires were actually ready on their first morning.`,
  `${M} — Unit "Summary"; Module 3 — "Prerequisites," "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 2 deck", [
  "Module page: docs/training/hr-driven-identity/02-contractor-sources.md (HR-Driven Identity learning path, Module 2): Introduction, objectives, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design and rules: the HR-driven identity implementation guide, Step 2 and its Gate 2 requirements table; Book 03, Chapter 06 and Appendix A, Contractor leavers; the contractor evaluation's recommendation; workbook Chapter 02, \"The earliest end,\" \"The sponsor review\"; Book 19, Chapter 01.",
  "Kit: examples/hr-lifecycle (README; config/contractor-rules.json; config/calls.json; python/contractor_source.py; tests/fixtures/ch02) and examples/hcm-entra (python/hcm_to_scim.py). Fictional people. Illustrative: unit-tested against fixtures, not run against a live tenant.",
  "Lab output: run November 2, 2026 with Python 3.14.3 in a scratch copy of examples/; long commands are wrapped, and output is trimmed or reflowed where the slides say so. Verification: docs/training/hr-driven-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
