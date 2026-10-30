// Attribute-Driven Migration to Entra ID — Deeper Dive Implementation, PART 3: proving it, cutting over and keeping it true.
// The deeper-dive series goes below the two-part technical deep dive and follows the implementation guide
// (docs/books/guides/attribute-driven-migration-implementation.md) and its project plan
// (data/project-plans/attribute-driven-migration.yaml). Part 1 is Gates 0–3, Part 2 Gates 4–6, Part 3 Gates 7–9.
//   Module 1 (Gate 7):          setting up the mover proof, following one personnel action, what must not change,
//                               reading a validation run and keeping the evidence.
//   Module 2 (Gate 8):          waves as attribute queries, the per-wave gate, retargeting provisioning and what still
//                               needs AD, Lifecycle Workflows at scale, retiring the OU tree and rolling back.
//   Module 3 (Gate 9, close):   drift classes, fixing at the source, the limits register, the standing checks per track,
//                               where the kits stop, what the overview simplified, decisions, checklist and next steps.
// Uses the shared slide helpers in ../attribute-driven-migration-technical-part-1/slides.js (not its SL slides).
// Every fact comes from the implementation guide, the companion guide, the chapters they link to, the validation kit
// (examples/validation-kit) or the project plans. Program recommendations are labeled design guidance.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node presentations/attribute-driven-migration-deeper-dive-part-3/build.js \
//                      presentations/attribute-driven-migration-deeper-dive-part-3/Attribute_Driven_Migration_Deeper_Dive_Part_3.pptx
const P = require("../attribute-driven-migration-technical-part-1/slides.js")({
  title: "Attribute-Driven Migration to Entra ID — Deeper Dive Implementation, Part 3",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration — Deeper Dive, Part 3: Gates 7–9",
});
const { D, HEX, txt, tag, content, titleSlide, notes, endModule, section, table, panel, callout, sources, sourceSlide, backup, finish } = P;
const box = D.box;
const OUT = process.argv[2] || "Attribute_Driven_Migration_Deeper_Dive_Part_3.pptx";

const IG = "Implementation guide";
const M1 = "Module 1 — Gate 7: the mover proof";
const M2 = "Module 2 — Gate 8: cut-over and the OU tree";
const M3 = "Module 3 — Gate 9: keeping it true";

// A code panel: Consolas in a light box, with an optional small caps label. Returns the bottom edge.
// Consolas averages 0.55 em per character, so the check below flags lines wider than the panel.
const code = (s, name, x, y, w, lines, o = {}) => {
  const pt = o.pt || 11;
  const lh = (pt / 72) * 1.2;
  const top = o.label ? 0.36 : 0.14;
  const h = top + lines.length * lh + 0.16;
  const widest = Math.max(...lines.map((l) => l.length));
  const needW = (widest * 0.55 * pt) / 72 + 0.4;
  if (needW > w + 0.01) console.warn(`  ! ${name} code may overflow its width: needs ${needW.toFixed(2)}, has ${w.toFixed(2)}`);
  if (y + h > 6.61) console.warn(`  ! ${name} code may overflow: bottom ${(y + h).toFixed(2)} in`);
  if (process.env.FIT) console.log(`  code ${name}: bottom ${(y + h).toFixed(2)} in, width need ${needW.toFixed(2)} of ${w.toFixed(2)}`);
  box(s, name, x, y, w, h, "F1F5F9", HEX.line);
  if (o.label) txt(s, `${name} label`, o.label, { x: x + 0.2, y: y + 0.1, w: w - 0.4, h: 0.24, fontSize: 10.5, bold: true, color: HEX.slate });
  txt(s, `${name} code`, lines.map((l, k) => ({ text: l.length ? l : " ", options: { breakLine: k < lines.length - 1 } })),
    { x: x + 0.2, y: y + top, w: w - 0.3, h: lines.length * lh + 0.06, fontFace: "Consolas", fontSize: pt, color: HEX.ink });
  return y + h;
};
const lines = (str) => str.replace(/^\n/, "").replace(/\n$/, "").split("\n");

// ================================================================== Title
section("Orientation");
{
  const s = titleSlide("Orientation", "Part 3: Proving it, cutting over and keeping it true", "Attribute-Driven Migration to Entra ID — deeper dive implementation, Gates 7 to 9");
  txt(s, "Session map", [
    { text: "Gate 7  The mover proof   ·   Gate 8  Cut-over and retiring the OU tree", options: { color: HEX.navy, bold: true, breakLine: true } },
    { text: "Gate 9  Drift, limits and the standing checks   ·   Decisions and checklist", options: { color: HEX.teal, bold: true, breakLine: true } },
    { text: "Part 1: Gates 0–3   ·   Part 2: Gates 4–6", options: { color: HEX.ink, breakLine: true } },
    { text: "Commands are the validation kit's; design guidance labeled as such", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 9.6, h: 1.65, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is Part 3 of the deeper dive implementation series for the Federal Modernization Workbook's companion guide, Attribute-Driven Migration from Active Directory to Microsoft Entra ID. The series goes one level below the two-part technical deep dive: it follows the implementation guide's ten gates and the project plan that schedules them, and it shows the commands, the input files, what a failing check looks like and the rollback each gate gives.

Part 1 covered Gates 0 to 3: reading the OU tree, the schema and the coded slots, proving the attributes, and sync. Part 2 covered Gates 4 to 6: the dynamic group library and administrative units, the personas and targeting conventions, and the PIV binding. Part 3 covers the last three. Gate 7 proves one mover across the tracks. Gate 8 cuts over by attribute query and retires the OU tree. Gate 9 keeps the attributes true for good.

Three labels apply. Facts come from the workbook: the implementation guide, the companion guide, the chapters they link to, the validation kit and the project plans. The validation kit is illustrative and fixture-tested, not proven against a live tenant, so run every check in a test tenant first. And the program's own recommendations are marked design guidance.`,
  `${IG}, "How to use this guide," Gates 7–9; the project plan, Phases 7–9; examples/validation-kit README.`);
}

// ================================================================== Gates 7 to 9 on one page
{
  const s = content("Orientation", "Gates 7 to 9 on one page");
  tag(s, "What");
  const tb = table(s, "Gates", 1.5, [1.95, 3.85, 2.75, 1.6, 2.0], ["Gate", "Done when", "Validate with", "Plan tasks", "Owner · lands before"], [
    ["7 Mover proven", "One personnel action changes access only through the attributes", "VK-DG-05, VK-HR-03; the workflow's run history", "A7.1, AG7", "CISO · program G2"],
    ["8 OU tree retired", "Every population cut over by query; nothing reads OU placement", "VK-HR-01 to 06, VK-DG-04, VK-DG-05 per wave", "A8.1–A8.4, AG8", "CISO · AD freeze (P5.1)"],
    ["9 Attributes kept true", "Drift scans running, findings closed at the source, zero-action plan", "VK-HR-03, VK-DG-05 to 07, each track's standing checks", "A9.1–A9.3, D-A8, AG9", "CISO · program G5"],
  ], { fontSize: 12, limit: 4.0 });
  const y = tb + 0.25;
  const a = panel(s, "Schedule", 0.6, y, 6.0, null, HEX.navy, HEX.navyTint, "THE SCHEDULE (PROJECT PLAN)", null, [
    "Gate 7 waits on the HR plan's mover automation (I4.3, week 12) and closes 17 days before G2",
    "Zero-float chain from G3 (week 36): A8.3, then A8.4 after P4.2 (week 38), last drift cycle in week 40",
    "Gate 8 lands 20 working days before P5.1; Gate 9, 40 before G5",
  ], 12.5);
  const b = panel(s, "Example", 6.85, y, 5.9, null, HEX.teal, HEX.tealTint, "THE RUNNING EXAMPLE", null, [
    "One budget analyst, keyed by an existing enterprise ID (placeholder E0042137)",
    "Gate 7: a personnel action moves the key from FIN-LED to FIN-AP",
    "Gate 8: the analyst's division is in wave 2; Gate 9: the nightly join is on the key",
  ], 12.5);
  if (process.env.FIT) console.log(`  onepage: ${Math.max(a, b).toFixed(2)}`);
  sources(s, "Sources: Implementation guide, \"The path on one page,\" \"One identifier through every gate\"; project plan, critical path note and tasks A7.1–AG9. Codes are placeholders.");
  notes(s,
`Here are the three gates on one page, from the implementation guide's path table. Gate 7 is done when one personnel action changes access only through the attributes; VK-DG-05 and VK-HR-03 prove it, with the mover workflow's own run history; plan task A7.1 carries it, and the CISO owns gate AG7, which closes before the program's G2, Pilot Clean. Gate 8 is done when every population has cut over by query and nothing reads OU placement any more; VK-HR-01 to 06, VK-DG-04 and VK-DG-05 run for each wave; tasks A8.1 to A8.4 carry it, and it lands before the program freezes AD at P5.1. Gate 9 is done when drift scans run, findings close at the source and the nightly plan is zero-action; it is the plan's last gate, with decision D-A8, and it lands before G5, AD Retired.

The project plan's schedule matters here because this is where the critical path lives. Early gates carry float. The zero-float chain starts at the program's G3 at the end of week 36: the transitional sync rules come out (A8.3), then, once the program retires the OU-based groups at P4.2 in week 38, the tree is frozen (A8.4), and the last full drift cycle closes Gates 8 and 9 in week 40. The only way to finish sooner is a shorter rollout. The mover proof waits on the HR plan's mover automation, I4.3, in week 12, and closes 17 days before G2.

The running example carries on from Parts 1 and 2: one budget analyst, keyed by an existing enterprise ID, with E0042137 as the placeholder value. The codes, FIN-LED and FIN-AP, stand in for the agency's own lists.`,
  `${IG}, "The path on one page," "One identifier through every gate"; project plan, critical path note, Phases 7–9.`);
}
endModule("Orientation");

// ================================================================== Module 1: Gate 7
section(M1);
{
  const s = content(M1, "Gate 7: set up the mover proof");
  tag(s, "How");
  const a = panel(s, "Steps", 0.6, 1.5, 5.75, null, HEX.amber, HEX.amberTint, "STEPS 1–3 (PLAN TASK A7.1)", null, [
    "Before: Gates 4–6 on the pilot; the HR plan's joiner and mover automation (I4.3); pilot policies assigned (P2.2)",
    "Pick a pilot test user who sponsors a non-person identity and has a managed laptop",
    "Record the start: groups, unit, persona, access packages, the device's groups, the sponsorship",
    "Take a VK-DG-05 snapshot with the baseline run below",
    "HR records the move as a personnel action (NOA 721, reassignment): FIN-LED to FIN-AP. Nobody opens a ticket",
  ], 12);
  const b = table(s, "Inputs", 1.5, [2.2, 2.5, 1.7], ["Input file in D:\\Inputs", "Columns", "Read by"], [
    ["exceptions.csv", "UserPrincipalName or Id, Owner, Reason", "VK-HR-01 to 03 (no owner: doesn't count)"],
    ["hr-export.csv", "OrgCode, Count", "VK-HR-03"],
    ["membership-snapshot.json", "The previous run's Snapshot\\membership-snapshot.json", "VK-DG-05"],
  ], { x: 6.55, fontSize: 11, limit: 4.6 });
  const c = code(s, "Baseline", 0.6, Math.max(a, b) + 0.2, 12.15, lines(String.raw`
# Step 2, the baseline: HR and dynamic-group checks, live, delegated sign-in with only the read scopes they need
.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track HR, DG -InputPath D:\Inputs
# Writes <run-id>\Snapshot\membership-snapshot.json, the next run's VK-DG-05 input. No previous snapshot: NotApplicable
`), { label: "THE VALIDATION KIT (READ-ONLY; RUN IT FIRST IN A TEST TENANT)" });
  if (process.env.FIT) console.log(`  g7setup: ${c.toFixed(2)}`);
  sources(s, "Sources: Implementation guide, Gate 7 steps 1–3; validation kit README, \"Run it,\" \"Inputs,\" \"What a run writes\"; Book 03, Ch 08 (NOA 721 is a mover).");
  notes(s,
`Gate 7 is the test of the whole model, and it runs before any population cuts over: one personnel action, no ticket, and every mechanism follows the attributes. The prerequisites are Gates 4 to 6 on the pilot, the HR plan's joiner and mover automation, task I4.3, and the program's pilot policies assigned, P2.2.

Steps one to three set it up. Pick a test user in the pilot who sponsors a non-person identity and has a managed laptop, because that's what lets one test reach three tracks. Record the starting state: groups, administrative unit, persona, access packages, the device's groups and the sponsorship.

Then take the baseline with the validation kit: the runner with the HR and dynamic-group tracks, delegated sign-in, and an input folder. The kit reads Graph and changes nothing. Three input files matter for this gate. exceptions.csv lists owned exceptions by user principal name or ID, with an owner and a reason; an exception with no owner doesn't count. hr-export.csv carries OrgCode and Count, for VK-HR-03. And membership-snapshot.json is the previous run's snapshot, for VK-DG-05. Every run writes its own snapshot of dynamic group counts under Snapshot; that file becomes the next run's input. With no previous snapshot, VK-DG-05 reports NotApplicable and writes the baseline.

Step three: HR records the move as a personnel action in the HR system, a reassignment, nature-of-action code 721, from FIN-LED to FIN-AP. Nobody opens a ticket.`,
  `${IG}, Gate 7, steps 1–3; examples/validation-kit/README.md — "Run it," "Inputs," "What a run writes"; Book 03, Chapter 08 — "Personnel actions are the triggers."`);
}
{
  const s = content(M1, "Gate 7: follow the personnel action through");
  tag(s, "How");
  const tb = table(s, "Hops", 1.5, [1.75, 5.3, 2.7, 2.4], ["Hop", "What should happen", "Where you see it", "Timing"], [
    ["1 Middleware", "Validates the event, writes provenance, sends the complete record to /bulkUpload with FIN-AP and the new division code", "Provenance record in the agency's log store", "Per event"],
    ["2 Provisioning, sync", "AD-landed: the agent updates the AD account; the next sync carries it up. Attribute-change triggers fire only after sync delivers it", "Provisioning logs", "The sync cycle"],
    ["3 Groups, units", "Leaves the FIN-LED groups and the old division unit, joins FIN-AP's and the new unit; the analyst group and the Internals persona don't change", "Audit log; VK-DG-05", "Usually hours; can be more than 24"],
    ["4 Mover workflow", "Removes the old access package, requests the new one, notifies the managers, starts a review of what's left", "Lifecycle Workflows run history", "Every 3 hours by default (1–24)"],
    ["5 At the engine", "SQL Server access from the old group ends only after rule processing, token expiry and session turnover", "The engine's own logins", "Tokens: 60–90 minutes by default"],
  ], { fontSize: 11.5, limit: 5.55 });
  callout(s, "Urgent", tb + 0.2, 0.75, "FaUserClock", HEX.red, "Latency is a design input: ",
    "urgent removal never waits for a rule. Disable the account and revoke sessions instead.");
  sources(s, "Sources: Implementation guide, Gate 7 step 4; companion guide, \"Worked example,\" \"Limits\" (latency); Book 03, Ch 05, 08; Book 02, Ch 10; Book 06, Ch 16.");
  notes(s,
`Step four is to follow the action through every hop, and to know where to look at each one.

Hop one, the middleware. It validates the event, writes a provenance record, and sends the analyst's complete record to the bulkUpload endpoint with organization code FIN-AP and the new division code. The provenance record lives in the agency's log store, not in Entra ID.

Hop two, provisioning and sync. Because the analyst is AD-mastered, the provisioning agent updates the AD account and the next sync cycle carries the values to Entra ID. Attribute-change triggers fire only after the sync delivers the change, so the workflow clock starts there, not at the personnel action.

Hop three, groups and units recompute. Because the record carries the new division code too, the analyst leaves the FIN-LED groups and the old division unit and joins FIN-AP's groups and the new division unit, usually within a few hours, but possibly more than 24. The analyst group and the Internals persona don't change, because position category and worker type didn't.

Hop four, the mover workflow: it removes the old department's access package, requests the new one, notifies the managers and starts a review of what's left. Lifecycle Workflows run on a tenant schedule, every three hours by default, settable from 1 to 24.

Hop five, at the engine. Access the SQL Server group gave ends only after rule processing, token expiry and session turnover; tokens last 60 to 90 minutes by default. So latency is a design input, and urgent removal disables the account and revokes sessions instead of waiting for a rule.`,
  `${IG}, Gate 7, step 4; companion guide, "Worked example: one user and one mover event," "Limits" (latency); Book 03, Chapters 05 and 08; Book 02, Chapter 10 — "Lifecycle Workflows," "Mover workflow"; Book 06, Chapter 16 — "When a change takes effect."`);
}
{
  const s = content(M1, "Gate 7: what must not change, and the proof");
  tag(s, "How");
  const a = panel(s, "Hold", 0.6, 1.5, 5.85, null, HEX.navy, HEX.navyTint, "STEP 5: WHAT MUST NOT CHANGE", null, [
    "The laptop's device groups stay put: device rules can't read the user's attributes",
    "A device attribute that should change is device reconciliation, not HR",
    "The service principal's sponsor is still the analyst's key; a sponsor's own mover event goes to the non-person guide, Step 6",
    "Nothing is assigned by hand, and no ticket is opened",
  ], 12.5);
  const b = panel(s, "Prove", 6.65, 1.5, 6.1, null, HEX.teal, HEX.tealTint, "STEP 6 AND VALIDATE (GATE OWNER: CISO)", null, [
    "Run the drift scan: it should find nothing to fix",
    "Rerun the kit with the step-2 snapshot in D:\\Inputs and a fresh hr-export.csv",
    "VK-DG-05: exactly the expected membership changes, and no others",
    "VK-HR-03: counts per organization code reconcile with the HR export",
    "The mover workflow's run history: it ran for the test user, and what it did (VK-HR-05 reads hire and leave triggers only)",
  ], 12.5);
  callout(s, "Rollback7", Math.max(a, b) + 0.25, 0.85, "FaArrowsRotate", HEX.amber, "Rollback: ",
    "reverse the personnel action in HR and let the same path reverse the access. A hand fix in the directory is exactly what this gate shows isn't needed.");
  sources(s, "Sources: Implementation guide, Gate 7 steps 5–6, Validate, Rollback; companion guide, \"Worked example\" step 5; non-person identity guide, Step 6.");
  notes(s,
`Step five checks what must not change, which proves as much as what does. The analyst's laptop keeps its device groups, because a device rule can reference only device attributes and can't see the user. If the device's own department value should change, that's device reconciliation on the Intune track, not HR. The service principal the analyst sponsors still records the analyst's key as its sponsor. A sponsor's own mover event is handled on the non-person track, in Step 6 of its implementation guide. And nothing is assigned by hand along the way.

Step six runs the drift scan, which should find nothing to fix.

Then the Validate step, owned by the CISO. Rerun the same kit command with the step-2 snapshot in the input folder and a fresh HR export. VK-DG-05, compared with that snapshot, should show exactly the expected membership changes and no others. VK-HR-03 should reconcile the counts per organization code with the HR export after the move. And the mover workflow's own run history should show it ran for the test user and what it did. VK-HR-05 doesn't cover this, because it reads hire and leave triggers only. And the evidence chain should run from the personnel action to the provisioning log entry, the group change and the drift report, joined on the key. Gate 7 closes before the program's G2.

Rollback is the easiest of any gate: reverse the personnel action in HR and let the same path reverse the access. Don't fix the directory by hand. A hand fix is exactly what this gate is meant to show isn't needed.`,
  `${IG}, Gate 7, steps 5–6, "Validate (Gate 7)," "Rollback"; companion guide, "Worked example," step 5; non-person identity implementation guide, Step 6.`);
}
{
  const s = content(M1, "Gate 7: read the run, keep the evidence");
  tag(s, "How");
  const c = code(s, "Failing", 0.6, 1.5, 6.6, lines(String.raw`
Details\VK-DG-05.csv   Status: Fail
Threshold: more than 10% and at least 5 members
FMP-Users-ORG-A    Finding  Membership changed beyond
                   the threshold since the last snapshot
                   Kind=user  Was=200 Now=150 Delta=-50
FMP-Devices-Tier0  Finding  (same issue)
                   Kind=device Was=20 Now=40 Delta=20

Details\VK-HR-03.csv   Status: Fail
ORG-D  Finding  Entra ID count differs from the HR export
`), { label: "A FAILING RUN (THE KIT'S FICTIONAL FAIL FIXTURE)" });
  const st = panel(s, "Status", 0.6, c + 0.2, 6.6, null, HEX.slate, "FFFFFF", "READING THE STATUS", null, [
    "Fail: at least one Finding row. Warn: rows to review, not a finding",
    "NotApplicable: nothing to check, or an input missing. Never Pass",
    "Error: a read failed. Never Pass",
  ], 12);
  const tb = table(s, "Evidence", 1.5, [2.65, 2.7], ["Evidence, joined on the key", "Entra ID keeps it"], [
    ["Personnel action; provenance record", "Not at all: agency log store"],
    ["Provisioning log entry", "30 days (premium); 7 (Free)"],
    ["Group change and the rule behind it", "Audit log: 30 days (P1/P2)"],
    ["Mover workflow run history", "Up to 30 days; download it"],
    ["Before and after states; kit run folders", "Outside: ValidationManifest.json hashes every file"],
    ["The drift report", "Outside Entra ID"],
  ], { x: 7.4, fontSize: 11.5, limit: 6.6 });
  if (process.env.FIT) console.log(`  evidence: status ${st.toFixed(2)}, table ${tb.toFixed(2)}`);
  sources(s, "Sources: Validation kit README, \"What a check returns,\" \"What a run writes\"; kit fail fixtures (DG.ps1, HR.ps1); Implementation guide, Gate 7 Evidence; Book 03, Ch 11.");
  notes(s,
`Here is what a failing run looks like, so the first one isn't a surprise. The rows on the left come from the kit's own fictional tenant, the fail fixture. VK-DG-05 compares each dynamic group's member count with the last snapshot; the default threshold is more than ten percent and at least five members. Here a user group went from 200 to 150 and a device group from 20 to 40, so both are findings. In the mover proof, a finding on a group the move shouldn't touch is the signal to stop. VK-HR-03 compares users per organization code with the HR export; a code whose counts differ is a finding.

Reading the status matters. Fail means at least one Finding row. Warn means rows that need review but aren't findings. NotApplicable means there was nothing to check, or an input file wasn't supplied, and the message says which; it is never a Pass. And a read that fails gives Error, never Pass.

On the right, the evidence to keep, joined on the person key. The personnel action and the middleware's provenance record aren't in Entra ID at all. Entra ID keeps the provisioning log entry for 30 days with a premium edition and 7 with Free, the audit log's group changes for 30 days with P1 or P2, and workflow run history viewable for up to 30 days, so download it. The kit's run folders carry a manifest with the SHA-256 of every file. Route all of it out of Entra ID from the pilot's first day, because retention isn't retroactive. The results name users, so store them as the data classification requires.`,
  `${IG}, Gate 7, "Evidence"; examples/validation-kit/README.md — "What a check returns," "What a run writes"; tests/fixtures/fail; Book 03, Chapter 11 — "The evidence each event leaves."`);
}
endModule("Module 1");

// ================================================================== Module 2: Gate 8
section(M2);
{
  const s = content(M2, "Gate 8: waves are attribute queries, leaver first");
  tag(s, "What");
  const tb = table(s, "Waves", 1.5, [1.5, 4.6], ["Track", "A wave selects its members by"], [
    ["Users", "HR-sourced attribute values, such as the division or region code"],
    ["Devices", "The attributes provisioning writes on the device object"],
    ["Servers", "Azure resource group and tag, once Arc-enabled"],
    ["Non-person", "The owning application: old and new credentials run in parallel before the legacy account is disabled"],
  ], { fontSize: 12, limit: 4.7 });
  const p = panel(s, "Pattern", 6.9, 1.5, 5.85, null, HEX.navy, HEX.navyTint, "THE WAVE PATTERN (BOOK 00, CH 09)", null, [
    "Lowest-risk region first; pilot division, then two or three divisions at a time",
    "Each division: plan, in-division pilot, full availability, drift-clean hold, weekly green, yellow or red",
    "Drift detection daily on the migrated scope from the first wave",
    "GPO links stay during a wave; removed after seven days of clean compliance",
  ], 12.5);
  const c = code(s, "Query", 0.6, Math.max(tb, p) + 0.2, 12.15, lines(String.raw`
# A wave's scope is a query whose group already exists: guards included, a roll-up of codes with -in
(user.extensionAttribute10 -in ["ORG-A"]) -and (user.accountEnabled -eq true) -and (user.userType -eq "Member")
`), { label: "A RULE IN THE KIT'S FIXTURE FORM (CODES ARE PLACEHOLDERS)" });
  callout(s, "Leaver", c + 0.15, 0.62, "FaUserXmark", HEX.red, "Leaver automation first, in every wave: ",
    "revocation is where the risk and the evidence are.");
  sources(s, "Sources: Implementation guide, Gate 8 steps 1–2; Book 00, Ch 09, \"Waves defined by attribute values\"; Book 01, Ch 04; Book 03, Ch 12; kit fixture groups.json.");
  notes(s,
`Gate 8 starts by writing each wave as an attribute query, plan task A8.1. Because waves are defined by attribute values rather than OUs, each wave's scope is a query on the authoritative source, and the dynamic groups that target it already exist.

Each track selects its wave members from its own source of truth. Users by their HR-sourced attributes, so a division or a region code. Devices by the attributes provisioning writes on the device object, so a region's people and their workstations can move in the same wave without one reading the other. Servers by Azure resource group and tag, once they're Arc-enabled. And non-person identities move with their owning application, running old and new credentials in parallel before the legacy account is disabled.

The pattern comes from Book 00 Chapter 09 and Book 01. Start with the lowest-risk region: a pilot division, then division by division, two or three at a time, each drift-clean before the next. Inside a wave every division follows the same sub-pattern: plan, in-division pilot, full availability, a drift-clean hold, and a weekly green, yellow or red report. Drift detection runs daily on the migrated scope from the first wave. GPO links stay in place during a wave and come off a migrated OU only after seven days of clean compliance.

The rule shown is the kit's fixture form: a roll-up of codes with the in operator, and the two guards every access rule carries. Which divisions go in which order is the program's wave plan, decision D07. And step two: leaver automation goes first in every wave, because revocation is where the risk and the evidence are. In the running example, the analyst's division is in wave 2, selected by its division code.`,
  `${IG}, Gate 8, steps 1–2 (A8.1); Book 00, Chapter 09 — "Waves defined by attribute values"; Book 01, Chapter 04 — "Migration phases"; Book 03, Chapter 12 — Phase 4; companion guide, Stage 7.`);
}
{
  const s = content(M2, "Gate 8: the per-wave attribute gate");
  tag(s, "How");
  const tb = table(s, "WaveGate", 1.5, [1.9, 6.6, 3.65], ["Step (A8.2)", "What it takes", "Proof"], [
    ["1 Validation report", "Acceptance results, open defects and their dispositions, the population's drift baseline, Appendix B checks, the rollback plan", "Signed before the cutover is scheduled"],
    ["2 Dry run", "Production data with writes disabled: the pipeline computes what it would do; every difference from the directory explained", "The dry-run differences"],
    ["3 Cutover", "One population; spot-check named records after the first cycle; rollback ready", "Spot checks"],
    ["4 Seven days", "Every create, change and disable traces to an HR event and a provenance record. An audit-log entry with no matching provisioning record is a finding, and the clock restarts", "Provisioning logs joined on the key (no kit check)"],
    ["5 Ticket path closes", "The service desk stops taking account-creation tickets for the population; exceptions go through the governed process", "The closure record"],
  ], { fontSize: 11.5, limit: 5.3 });
  code(s, "PerWave", 0.6, tb + 0.15, 12.15, lines(String.raw`
# Each wave: VK-HR-01 to 06, VK-DG-04 for every group the wave replaces, VK-DG-05 against the threshold
.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track HR, DG -InputPath D:\Inputs
# D:\Inputs\shadow-pairs.csv   CurrentGroupId,ProposedGroupId   (VK-DG-04 lists the adds and removes)
`));
  sources(s, "Sources: Implementation guide, Gate 8 step 3, Validate; Book 03, Appendix C (validation report; dry run; sole source; ticket path); validation kit README, \"Inputs.\"");
  notes(s,
`Step three is the per-wave attribute gate, plan task A8.2, and it comes straight from Book 03's Appendix C.

First, a short validation report gates every cutover: the acceptance results, open defects and their dispositions, the drift baseline for the population, the privacy and security checks of Appendix B, and the rollback plan. It's signed before the cutover is scheduled.

Second, a dry run on production data with writes disabled. The pipeline computes what it would do, and every difference from the directory is explained.

Third, the cutover itself, one population at a time, with named records spot-checked right after the first cycle and rollback ready.

Fourth, seven days in which every create, change and disable for the population traces to an HR event and a provenance record. The comparison is between the provisioning logs and the directory's audit log: anything in the audit log without a matching provisioning record came from somewhere else. A ticket, a script or a hand edit is a finding, and the clock restarts once it's closed. No kit check covers this; the provisioning logs, joined on the key, are the evidence.

Fifth, only then, the ticket path for account creation closes for that population, and exceptions go through the governed exception process.

The kit runs on every wave: the HR checks one to six, VK-DG-04 for each group the wave replaces, using shadow-pairs.csv with the current and proposed group IDs, and VK-DG-05 for the wave's membership change against the threshold. VK-HR-05 and 06 show the leaver path on time and the execution limits set.`,
  `${IG}, Gate 8, step 3 (A8.2), "Validate (Gate 8)"; Book 03, Appendix C — "The validation report," "Dry run, cutover and rollback," "Proving HR is the sole source," "Closing the ticket path"; examples/validation-kit/README.md — "Inputs."`);
}
{
  const s = content(M2, "Gate 8: retarget provisioning; what still needs AD");
  tag(s, "How");
  const a = panel(s, "Retarget", 0.6, 1.5, 5.6, null, HEX.amber, HEX.amberTint, "STEP 4: RETARGET, POPULATION BY POPULATION", null, [
    "Once the users' sync cycle completes, remove them from the HR-to-AD provisioning scope and add them to the HR-to-Entra configuration",
    "Keep the AD leg dormant but intact; populations move in the HR plan (I5.1, I5.2)",
    "Entry checks: HR writes Entra ID directly; no on-premises Exchange workloads; no AD FS federation; no LDAP bind or other password-based apps",
    "GCC: user source-of-authority transfer is unverified. Give it an owner and a decide-by date; plan the AD-mastered path as the default",
  ], 12);
  const b = table(s, "NeedsAD", 1.5, [3.1, 3.25], ["Still needs AD", "Response (design guidance)"], [
    ["Synced users' attributes", "Written in AD until the population moves"],
    ["Kerberos apps (written-back groups)", "Write the group back, or move the app to SAML or OIDC"],
    ["Disposing of synced users", "At the source: an Entra-only delete doesn't stick"],
    ["DNS, DHCP, Kerberos-bound legacy apps", "Track in Books 08 and 06; each Windows SQL login is an IA-2 gap"],
    ["Domain GPOs for hybrid-joined devices", "Intune first; disable links per population, rollback tested"],
  ], { x: 6.4, fontSize: 11.5, limit: 6.0 });
  callout(s, "Pause", Math.max(a, b) + 0.2, 0.72, "FaArrowsRotate", HEX.amber, "If a cutover goes wrong: ",
    "pause the provisioning job (it keeps its state), quarantine the batch, return to the prior process.");
  sources(s, "Sources: Implementation guide, Gate 8 steps 4 and 8; companion guide, Stage 7, \"What still needs AD during hybrid\"; Book 03, Appendix C; Book 03, Ch 12 register.");
  notes(s,
`Step four retargets provisioning per population. As a population becomes cloud-mastered, it moves from the HR-to-AD provisioning scope to the HR-to-Entra configuration, with the AD leg dormant but intact. Microsoft's source-of-authority guidance, as the companion guide cites it, says the same thing: once the users' sync cycle completes, remove them from the HR-to-AD scope and add them to the HR-to-Entra configuration. The populations themselves move in the HR plan, tasks I5.1 for employees and I5.2 for contractors.

Moving a user's source of authority has prerequisites Microsoft lists: the HR system integrated so changes go directly to Entra ID, no on-premises Exchange workloads, no AD FS federation for those users, and no applications that need password-based authentication such as LDAP bind. Make those the entry checks per population, and move the populations that pass first. And in GCC, whether source-of-authority transfer is available is still unverified in Book 03's open register. Give it an owner and a decide-by date, and plan the AD-mastered path as the default until it's confirmed.

Step eight is the list of what still needs AD, each with its response, design guidance. Synced users' attributes are written in AD until the population moves. Kerberos applications need a cloud group written back as a universal group, so write it back or move the app to SAML or OpenID Connect. Synced users are disposed of at the source, because an Entra-only delete doesn't stick. DNS, DHCP and Kerberos-bound legacy applications keep the forest alive; any Windows login to SQL Server is reported as an IA-2 gap. And domain GPOs stay for hybrid-joined devices: move the policy to Intune first, then disable links population by population. If a cutover goes wrong, Appendix C's rollback is to pause the provisioning job, which keeps its state, quarantine the batch, and return to the prior process.`,
  `${IG}, Gate 8, steps 4 and 8; companion guide, Stage 7 and "What still needs AD during hybrid"; Book 03, Appendix C — "Dry run, cutover and rollback"; Book 03, Chapter 12 — "Open verification register."`);
}
{
  const s = content(M2, "Gate 8: Lifecycle Workflows at agency scale");
  tag(s, "How");
  const tb = table(s, "LCW", 1.5, [2.2, 4.3, 5.65], ["Limit", "Value", "What to do (design guidance)"], [
    ["Workflows per tenant", "100. Twelve trees × joiner, mover, leaver × three worker types is 108", "A few general workflows that branch on codes, up to 5 administrative scopes each; a budget in change control"],
    ["On-demand run", "At most 10 users; ignores the execution conditions; bypasses quarantine", "A change with a second person; Lifecycle Workflows Administrator PIM-eligible with approval; logged"],
    ["Execution limits", "Tenant-wide or per workflow, a percentage or a count; a run over it is quarantined until approved", "Size to normal weekly volume; a reorganization is a change event, rehearsed, with a pre-agreed release"],
    ["Catch-up window", "Three days (not the Time based attribute V2 preview trigger)", "Report triggers in the past that never ran (VK-HR-05)"],
  ], { fontSize: 11, limit: 5.0 });
  code(s, "LcwRows", 0.6, tb + 0.15, 12.15, lines(String.raw`
VK-HR-05  Finding  Trigger date passed more than 3 days ago with no processing record (outside the catch-up window)
VK-HR-05  Warn     Trigger date passed with no processing record yet (inside the catch-up window)
VK-HR-06  Finding  Scheduled workflow with no execution limit: no tenant-wide threshold and none of its own
VK-HR-06  Warn     Workflow count against the default ceiling   (at 90 of 100; confirm per-workflow limits in the admin center)
`), { label: "WHAT THE KIT REPORTS (ISSUE TEXT FROM HR.PS1)" });
  sources(s, "Sources: Implementation guide, Gate 8 step 5; companion guide, \"Lifecycle Workflows,\" \"Lifecycle Workflows at scale\"; validation kit HR.ps1, README \"Known limits.\"");
  notes(s,
`Step five sizes Lifecycle Workflows for the agency, and this is where the companion guide's at-scale table earns its place. All of the responses are design guidance.

The ceiling is 100 workflows per tenant. A workflow per tree, per component or per worker type multiplies fast: twelve trees times joiner, mover and leaver times three worker types is 108, before pre-hire, rehire and conversion. So build a small set of general workflows that branch on the coded attributes through their scope rules, with up to five administrative scopes each, and keep a workflow budget in change control.

An on-demand run handles at most ten users, ignores the workflow's execution conditions and isn't subject to the execution limits. Run the leaver on the wrong ten people and nothing stops it. So every on-demand run is a change with a second-person check, and the Lifecycle Workflows Administrator role is PIM-eligible with approval.

Execution limits are a tenant-wide or per-workflow threshold, as a percentage, a count or both; a scheduled run over it is quarantined until an administrator approves. A reorganization that recodes many people fires the mover workflow for all of them, so plan it as a change event, rehearsed in test, with a pre-agreed release. For urgent terminations, disable and revoke rather than wait.

The kit checks two of these. VK-HR-05 reports a hire or leave date in the past with no processing record: a finding outside the three-day catch-up window, a warning inside it. VK-HR-06 reports any scheduled workflow with no execution limit, and warns at 90 of the 100 workflows. Microsoft notes a per-workflow limit set in the admin center isn't reflected in the API, so confirm a finding there first.`,
  `${IG}, Gate 8, step 5; companion guide, "Limits: Lifecycle Workflows," "Lifecycle Workflows at scale"; Book 03, Chapter 08 — "Guardrails at agency scale"; examples/validation-kit/powershell/ValidationKit/Checks/HR.ps1; README "Known limits."`);
}
{
  const s = content(M2, "Retiring the OU tree: disable, never delete");
  tag(s, "How");
  const a = panel(s, "Retire", 0.6, 1.5, 6.0, null, HEX.navy, HEX.navyTint, "STEPS 6–7 (A8.3, A8.4)", null, [
    "After G3: remove the account-type sync rule that reads OU placement, the OU-based scoping filters, and the provisioning OU computation",
    "After P4.2: remove the hand-made delegations Gate 0 found; confirm no OU drives access, scoping or policy",
    "Archive the tree's final export in Git. GPOs retire in the Endpoint plan; OUs go with the domain at G5",
    "Destructive items need approval one by one",
  ], 12);
  const b = panel(s, "Back", 6.8, 1.5, 5.95, null, HEX.amber, HEX.amberTint, "ROLLBACK: RE-ENABLE, NEVER RE-CREATE", null, [
    "Re-enable the disabled AD accounts and GPO links",
    "Put the population back in the HR-to-AD provisioning scope; reopen the ticket path",
    "Deleting a GPO removes the one-command rollback; an Entra-only delete of a synced user comes back at the next sync",
  ], 12);
  code(s, "Links", 0.6, Math.max(a, b) + 0.18, 12.15, lines(String.raw`
# Read-only: list the domain root and every OU that still has a GPO linked directly to it (Book 00, Ch 10)
foreach ($target in $targets) { $links = (Get-GPInheritance -Target $target).GpoLinks; if ($links) { $target } }
# The change, and its rollback, for one population's OU (Book 05, Ch 07); Backup-GPO first
Set-GPLink -Name $gpoName -Target $target -LinkEnabled No      # rollback: -LinkEnabled Yes
`), { pt: 11 });
  sources(s, "Sources: Implementation guide, Gate 8 steps 6–7, Validate, Rollback; Book 00, Ch 10; Book 05, Ch 07, 08; Book 01, Ch 04 (Phase 4); Book 03, Ch 08.");
  notes(s,
`Retiring the OU tree is two plan tasks, and both wait on the program. A8.3 comes after G3, once every population is cut over: remove the account-type sync rule that reads OU placement, the OU-based scoping filters, and the provisioning OU computation for cloud-mastered populations. A8.4 comes after the program retires the OU-based security groups at P4.2: remove the hand-made delegations Gate 0 found, confirm that no OU drives access, scoping or policy, and archive the tree's final export in Git as the record. The GPOs themselves are retired in the Endpoint plan, and the OUs go with the domain at G5. Legacy retirement is the only destructive phase, and it needs approval item by item.

Validate it two ways. The sync configuration export shows no rule or scoping filter reading OU placement. And the final OU export shows no delegation that grants access and no GPO link the Endpoint plan hasn't retired. Book 00 Chapter 10's read-only script lists the domain root and every OU that still has a GPO linked directly to it; on a retired estate the list is short and expected.

Rollback is by re-enabling, never by re-creating. Re-enable the disabled AD accounts and the disabled GPO links, put the population back in the HR-to-AD provisioning scope, and reopen the ticket path. That's why Book 05 disables a link rather than deleting the GPO: back the GPO up, set the link to disabled for one population's OU, and the rollback is the same command set back to enabled. Deleting the GPO removes that one-command rollback. And in the running example, when the analyst's population is cloud-mastered, the AD account it no longer needs is disabled, not deleted.`,
  `${IG}, Gate 8, steps 6–7, "Validate (Gate 8)," "Rollback"; Book 00, Chapter 10 (the GPO-link script); Book 05, Chapter 07 — Set-GPLink; Book 05, Chapter 08 — "Rollback"; Book 01, Chapter 04 — "Phase 4: legacy retirement"; Book 03, Chapter 08 — "Deletion."`);
}
endModule("Module 2");

// ================================================================== Module 3: Gate 9 and the close
section(M3);
{
  const s = content(M3, "Gate 9: drift classes and the two comparisons");
  tag(s, "What");
  const a = table(s, "HRDrift", 1.5, [2.0, 3.55, 0.85], ["HR against directory", "Detection signal", "Severity"], [
    ["Missing identity", "Active HR record with no matching employeeId", "High"],
    ["Stale access", "Same key: terminated in HR, enabled in the directory", "High"],
    ["Orphan account", "Enabled account with no or unknown employeeId", "High"],
    ["Attribute drift", "Field-by-field comparison of the schema", "Medium"],
    ["Unauthorized write", "Audit log: a writer other than the provisioning service", "High"],
    ["Credential drift", "Card management status joined on the worker", "High"],
    ["Schema drift", "The middleware's validation output", "Medium"],
  ], { fontSize: 11, limit: 6.6 });
  const b = table(s, "DirDrift", 1.5, [3.75, 1.05], ["Registry against tenant", "Severity"], [
    ["Unit rule differs from the registry", "High"],
    ["Unit rule processing paused", "High"],
    ["Role assignment not in the matrix", "Critical"],
    ["Restriction differs from its decision", "Critical"],
  ], { x: 7.95, fontSize: 11, limit: 4.4 });
  const c = panel(s, "DA8", 7.95, b + 0.2, 4.8, null, HEX.teal, HEX.tealTint, "D-A8 (CISO): SEVERITY AND RESPONSE TIMES", null, [
    "Option: high severity closed in days, the rest on a dated plan",
    "Each track's reconciliation feeds the same findings queue",
  ], 11.5);
  if (process.env.FIT) console.log(`  drift: ${Math.max(a, c).toFixed(2)}`);
  sources(s, "Sources: Implementation guide, Gate 9 steps 1–2; Book 03, Ch 11, \"Drift between HR and the directory\"; Book 02, Ch 05, \"Drift detection\"; project plan, D-A8.");
  notes(s,
`Gate 9 keeps the attributes true. Without it, everything slowly decays. It starts with the pilot, not after cut-over, and it's the plan's last gate.

Step one is decision D-A8: severity and response times, decided by the CISO. The plan's option is the program's classes with high severity closed in days and the rest on a dated plan, and possibly a stricter clock for unauthorized writes to the access slots. The severities on the slide are the program's defaults from Book 03, not an external standard.

Step two schedules two comparisons, plan task A9.1. On the left, HR against the directory, Book 03's drift classes. Missing identity: an active HR record with no matching key. Stale access: the same key terminated in HR but enabled in the directory. Orphan account: an enabled account with no key. Attribute drift: a field-by-field comparison of the schema. Unauthorized write: an audit-log write to an HR-mastered attribute by anyone but the provisioning service. Credential drift: a valid PIV binding or certificate for a separated worker. And schema drift: a record that fails validation in the middleware. Expect a burst of high-severity findings in the first month; that's the measurement working.

On the right, the unit and role registry against the tenant, from Book 02 Chapter 05: a unit rule that differs from the registry, paused processing, a role assignment that isn't in the matrix, and a restriction setting that differs from its decision. Each track's own reconciliation, the Intune guide's Step 6.2, the Arc guide's Step 8 and the non-person guide's Step 6, sends findings to the same queue. In the running example, a second account carrying the analyst's key is a finding.`,
  `${IG}, Gate 9, steps 1–2 (D-A8, A9.1); Book 03, Chapter 11 — "Drift between HR and the directory"; Book 02, Chapter 05 — "Drift detection"; project plan, D-A8.`);
}
{
  const s = content(M3, "Gate 9: fix at the source; logs; the limits register");
  tag(s, "How");
  const a = panel(s, "Source", 0.6, 1.5, 5.9, null, HEX.amber, HEX.amberTint, "STEPS 3 AND 5", null, [
    "Close every finding in the HR record or the rule, never the copy: the next cycle overwrites the copy",
    "Access reviews don't change dynamic membership: review the rule and its inputs",
    "Logs leave Entra ID from day one, to Azure Monitor, a storage account or the SIEM; retention isn't retroactive",
    "A9.3: a full cycle on the whole estate, closing at the source until the nightly plan is zero-action",
  ], 12);
  const b = table(s, "Limits", 1.5, [3.4, 2.65], ["Limits register (A9.2)", "Value"], [
    ["Dynamic rule body", "3,072 characters"],
    ["Dynamic groups per tenant (units count)", "15,000"],
    ["Lifecycle Workflows; custom task extensions", "100 each"],
    ["Tasks per workflow", "25"],
    ["Restricted management units", "100"],
    ["Dynamic units", "Global cloud (GCC); not GCC High or DoD"],
    ["memberOf rule preview", "Ends November 3, 2026"],
  ], { x: 6.7, fontSize: 11.5, limit: 5.6 });
  callout(s, "Review", Math.max(a, b) + 0.2, 0.62, "FaListCheck", HEX.navy, "Review the register with every design change: ",
    "a new workflow, unit or rule spends a budget.");
  sources(s, "Sources: Implementation guide, Gate 9 steps 3–5; companion guide, \"Limits\"; Book 02, Ch 10; Book 06, Ch 17; Book 03, Ch 10, 11; Book 02, Ch 05.");
  notes(s,
`Step three is the rule that makes drift findings close for good: fix at the source. Close every finding in the HR record or in the rule, never in the copy, because the next cycle overwrites the copy. Book 02's assessment pipeline says the same about its Git baseline. And access reviews don't change dynamic membership, so when a review questions someone's access, review the rule and its inputs instead of removing the member.

Logs leave Entra ID from day one. Entra ID's own retention is far shorter than any federal records schedule and it isn't retroactive, so route the audit, sign-in and provisioning logs to Azure Monitor, a storage account or the agency's SIEM from the pilot's first day. That's AU-11 in Book 03's mapping.

Step four keeps a limits register, plan task A9.2, reviewed with every design change. The values on the right are the companion guide's. A dynamic rule body is at most 3,072 characters. A tenant holds at most 15,000 dynamic groups, and dynamic units count against the same total. Lifecycle Workflows allow 100 workflows and 100 custom task extensions, with 25 tasks per workflow. There are at most 100 restricted management units. Dynamic administrative units run in the global cloud, which GCC uses, and not in GCC High or DoD. And the memberOf rule preview ends on November 3, 2026, after which groups that use it freeze in their last state.

Step five, plan task A9.3, runs a full drift cycle on the whole estate after cut-over and closes the findings at the source until the nightly plan is zero-action.`,
  `${IG}, Gate 9, steps 3–5 (A9.2, A9.3); companion guide, "Limits," "Monitoring both"; Book 02, Chapter 10 — "The assessment pipeline"; Book 06, Chapter 17 — "Access reviews"; Book 03, Chapters 10 and 11; Book 02, Chapter 05.`);
}
{
  const s = content(M3, "Gate 9: the standing checks, track by track");
  tag(s, "How");
  const tb = table(s, "Standing", 1.5, [1.55, 2.75, 7.85], ["Track", "Standing checks", "What they report"], [
    ["HR", "VK-HR-01, 03, 04", "Uncorrelated enabled users; counts per organization code against HR; duplicate employeeId values"],
    ["Groups, units", "VK-DG-05, 06, 07", "Membership change over the threshold; paused processing and memberOf rules; unit rules against their groups"],
    ["Intune", "VK-INT-01, 02", "Managed devices missing provisioning-written attributes; stale devices and hybrid duplicates"],
    ["Arc", "VK-ARC-01 to 07", "Missing tags, agent status, baseline compliance, CM-8 gaps, patching scope, role assignments, two tools on one setting"],
    ["Non-person", "VK-NPI-01, 02, 08", "Fewer than two owners; expiring or over-long credentials; AI agent identities without a sponsor"],
  ], { fontSize: 11.5, limit: 4.9 });
  code(s, "Tracks", 0.6, tb + 0.15, 12.15, lines(String.raw`
.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track HR, DG -InputPath D:\Inputs
.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track INT, DG -TenantId <tenant-id> -ClientId <app-id> -CertificateThumbprint <thumbprint>
.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track ARC -InputPath D:\Inputs -Option @{ BaselineAssignmentName = 'arc-baseline' }
.\Invoke-ValidationKit.ps1 -OutputPath D:\Validation -Track NPI -SkipAD
`), { label: "ON THE DRIFT CADENCE (TRACK RUNS BELONG TO THE TRACK GUIDES)", pt: 10.5 });
  sources(s, "Sources: Implementation guide, \"Validate (Gate 9)\"; validation kit README, \"Run it\" and permissions table; kit Catalog.ps1 check titles; Book 01, Ch 04; Book 03, Ch 12.");
  notes(s,
`Gate 9's Validate step is a set of standing checks, run on the drift cadence rather than once.

For the HR track: VK-HR-03 compares counts per organization code with HR, and VK-HR-01 and 04 catch uncorrelated accounts and duplicate keys. For groups and units: VK-DG-05 for membership change over the threshold, VK-DG-06 for paused processing and rules on the memberOf preview, and VK-DG-07 for administrative unit rules against their groups.

Each track also runs its own standing checks, in its own guide. Intune: VK-INT-01 for managed devices missing their provisioning-written attributes, and VK-INT-02 for stale devices and hybrid duplicates. Arc: VK-ARC-01 to 07, from missing tags and agent status through baseline compliance, servers in the CMDB with no tier, patching scope, role assignments, and two tools enforcing one setting. Non-person: VK-NPI-01 for owners, 02 for credentials, and 08 for AI agent identities without a sponsor.

The commands are the kit README's. The HR and dynamic-group run is delegated. The Intune run can be app-only with a certificate, never a secret. The Arc run needs Reader on the subscriptions and the baseline assignment name. The non-person run can skip AD.

Behind the checks sits Book 01's verification list: valid attributes for every HR-listed worker, every group on one of the two patterns, every unit rule mirroring its group with processing on, every policy targeting only governed groups, zero drift findings and a zero-action nightly plan. Book 03's six lifecycle metrics stay within thresholds on the ConMon cadence. The CISO owns the gate. It has no rollback: it's the standing loop, and a bad fix is reverted the same way, at the source.`,
  `${IG}, "Validate (Gate 9)," "Rollback"; examples/validation-kit/README.md — "Run it," permissions table; powershell/ValidationKit/Private/Catalog.ps1; Book 01, Chapter 04 — "Verification"; Book 03, Chapter 12 — Phase 6.`);
}
{
  const s = content(M3, "Where the kits stop");
  tag(s, "What");
  table(s, "Stops", 1.45, [0.6, 3.85, 4.1, 3.6], ["Gate", "What a kit covers", "What no kit covers yet", "Stand-in evidence"], [
    ["0", "Start Kit counts (site links included); VK-INT-07, Group Policy analytics readiness (beta)", "The per-group decision; the track tag per OU and GPO half", "The decision record in Git"],
    ["1", "VK-HR-01 and 04 on the key's carrier", "The schema and slot register themselves", "The signed register"],
    ["2", "VK-HR-01 to 04", "Field-by-field HR-to-directory comparison (HR-03 counts per code)", "The HR plan's baseline (I1.5)"],
    ["3", "VK-SYNC-01 on a sample; VK-HR-02 and 03 before and after", "Sync configuration, scoping, shadow differences, match blocking", "The sync reconciliation report"],
    ["4", "VK-DG-01 to 07", "—", "—"],
    ["5", "VK-CA-01 (emergency access, governed groups, grant and block pairs); VK-HR-02; track checks", "Conditions other than users and applications in a pair; report-only results", "The ca-export policy export and the report-only review"],
    ["6", "VK-PIV-01 (coverage and affinity, by account)", "Whether each value belongs to a current card; the tenant's affinity setting", "Card issuance record; sign-in logs"],
    ["7", "VK-DG-05, VK-HR-03", "Proof the mover workflow ran (VK-HR-05 reads hire and leave only)", "The workflow's run history"],
    ["8", "VK-HR-01 to 06, VK-DG-04, 05 per wave", "The seven-day sole-source report", "Provisioning logs joined on the key"],
    ["9", "VK-HR, VK-DG and each track's standing checks", "Registry-to-tenant comparison of role assignments", "The registry diff in Git"],
  ], { fontSize: 11, limit: 6.6 });
  sources(s, "Sources: Implementation guide, \"Where the kits stop,\" \"The path on one page,\" Gates 3, 5, 6 and 7 Validate; validation kit README (VK-SYNC-01, VK-CA-01, VK-PIV-01, VK-INT-07).");
  notes(s,
`This is the implementation guide's current table of where the kits stop. Every gate now has at least one kit check, but almost every check leaves a residual that no check reads, and for that residual the gate's Validate step names the evidence that stands in.

For this part, three rows matter. Gate 7 has VK-DG-05 and VK-HR-03, but no check proves the mover workflow ran: VK-HR-05 reads hire and leave triggers only. The stand-in is the workflow's own run history. Gate 8 has the per-wave checks, but no kit produces the seven-day sole-source report; the stand-in is the provisioning logs, joined on the key against the audit log. And Gate 9 has the HR, dynamic-group and track checks, but nothing compares role assignments in the tenant with the registry; the stand-in is the registry diff in Git, Book 02's pipeline.

The earlier gates, for completeness. Gate 0 has the Start Kit's counts and, on the Intune track, VK-INT-07 for Group Policy analytics readiness, a beta check; the per-group decision is a record in Git. Gate 1 checks the key's carrier but not the register itself, which is signed. Gate 2 compares counts per code, not field by field, so the HR plan's baseline stands in. Gate 3 now has VK-SYNC-01, which compares the coded slots for a sample exported from AD with Entra ID, joined on employeeId; it reads values, not the sync configuration, so the reconciliation report still stands in for scoping, shadow differences and match blocking. Gate 4 is fully covered. Gate 5 has VK-CA-01 for the emergency-access exclusion, governed groups and grant-and-block pairs on the users condition; other conditions and the report-only results are read from the ca-export policy export and the report-only review. Gate 6 has VK-PIV-01 for coverage and affinity by account; whether each value belongs to a current card comes from the card management system's issuance record and the sign-in logs.

Keep this table in the evidence packet. It tells an assessor, before they ask, which gates were checked by code and which by a record, and why.`,
  `${IG}, "Where the kits stop"; "How to use this guide" (the validation kit); examples/validation-kit/README.md — "How the guides' Validate steps map to the checks."`);
}
{
  const s = content(M3, "What the overview simplified");
  tag(s, "Why");
  const a = panel(s, "Mover", 0.6, 1.5, 3.9, null, HEX.red, HEX.redTint, "A MOVER REACHES MORE THAN GROUPS", null, [
    "AD groups granted file shares, applications and databases",
    "Access from an access package or a direct assignment doesn't leave on its own",
    "Leaving a licensed group can take the license, and the mailbox with it (held 30 days)",
    "So the review of what's left is a control, not a courtesy",
  ], 12);
  const b = panel(s, "Hybrid", 4.7, 1.5, 3.9, null, HEX.navy, HEX.navyTint, "HYBRID LASTS LONGER", null, [
    "Retiring AD means clearing named dependencies, not reaching a date",
    "The end may be a dated Kerberos island: program decision D11 at G0, confirmed or revised (D09) after G3",
    "An island with no retirement date goes to the authorizing official",
  ], 12);
  const c = panel(s, "Numbers", 8.8, 1.5, 3.95, null, HEX.amber, HEX.amberTint, "THE NUMBERS ARE PROPOSALS", null, [
    "99% correlation is a proposed starting point, not a federal requirement",
    "The agency sets it through risk governance; risk-tiered is usually better",
    "The kit's 10% delta threshold and the 90-day GPO window are defaults to tune",
  ], 12);
  callout(s, "Honest", Math.max(a, b, c) + 0.25, 0.8, "FaLightbulb", HEX.amber, "Design guidance: ",
    "plan the mover review, the hybrid tail and every threshold as decisions with owners, not as facts.");
  sources(s, "Sources: Book 00, Ch 01, 10; Book 03, Ch 08, 12; companion guide, dynamic group dangers; Book 01, Ch 09; program plan D11, D09; kit Core.ps1; Book 05, Ch 07.");
  notes(s,
`One honest slide about what the overview, and the deep dive before it, made look simpler than it is. This is design guidance.

First, a mover reaches more than groups. In AD, group membership granted access to file shares, applications and databases, and not all of that becomes a rule over an organization code. Access that came from an access package or a direct assignment doesn't leave when the rule stops matching; that's why the mover workflow starts a review of what's left, and why Book 03 calls that review a control, not a courtesy. And automatic removal has side effects: leaving a licensed group can take the license, and with an Exchange Online license, mailbox access, with the data held for 30 days.

Second, hybrid lasts longer than planned. Retiring AD means clearing a list of named dependencies, not reaching a date. The end state itself may be a dated Kerberos island rather than no AD at all. That's program decision D11, made provisionally at G0 by the executive sponsor and CIO, and confirmed or revised after G3 as D09. A Kerberos island with no retirement date is risk carried, so it goes to the authorizing official.

Third, the numbers are proposals. Ninety-nine percent correlation on the pilot is a proposed starting point, not a federal requirement; the agency sets it through risk governance, and a risk-tiered threshold is usually better. The kit's delta threshold of ten percent and five members is a default you can override, and Book 05's 90-day window for keeping a disabled GPO is a program design choice. Treat every one as a decision with an owner.`,
  `Book 00, Chapter 01 — "What it can reach"; Book 00, Chapter 10; Book 03, Chapter 08 — "Mover"; Book 03, Chapter 12 — "Sequencing principle"; companion guide, "Dynamic group dangers"; Book 01, Chapter 09; program master schedule, D11 and D09; validation kit Core.ps1 defaults; Book 05, Chapter 07.`);
}
{
  const s = content(M3, "Decisions, the checklist, and where to go next");
  tag(s, "Who");
  table(s, "Decisions", 1.45, [3.75, 2.35, 1.6], ["Decision (Gates 7–9)", "Who decides", "When"], [
    ["Mover proven (AG7)", "CISO", "Before G2"],
    ["Wave plan: divisions and order (D07)", "Executive sponsor", "After A8.1"],
    ["Each wave's go or no-go", "Identity engineering", "Every wave"],
    ["A population's cutover sign-off", "HR, identity owner, ISSO, business owner", "Per population"],
    ["Source-of-authority transfer in GCC", "An owner, with a decide-by date", "Before retargeting"],
    ["Release of a reorganization's quarantine", "Agreed in advance", "Per change event"],
    ["Each destructive retirement item", "Explicit approval per item", "Phase 4"],
    ["Drift severity and response times (D-A8)", "CISO", "After Gate 2"],
    ["Every drift finding; every wrong value", "CISO; HR fixes values", "Standing"],
  ], { fontSize: 11, limit: 6.6 });
  panel(s, "Next", 8.5, 1.45, 4.25, null, HEX.teal, HEX.tealTint, "CHECKLIST, THEN NEXT", null, [
    "Gate 7: one mover proved across the tracks, no ticket",
    "Gate 8: waves by query, leaver first, seven days of proof; rules removed; tree frozen and archived",
    "Gate 9: drift scans scheduled; findings closed at the source; limits register kept",
    "Next: the track guides (Intune Gate 5, Arc Step 3, non-person Step 5), the project plan, and the books",
  ], 11.5);
  sources(s, "Sources: Implementation guide, \"Prerequisites,\" Gates 7–9, \"Checklist,\" \"Back to the books\"; project plan, D-A8, D07; Book 03, Appendix C; companion guide, Stage 7.");
  notes(s,
`To close, the decisions in Gates 7 to 9 and who owns them, from the implementation guide's prerequisites and the two responsibility matrices.

The CISO signs off the mover proof, before G2. The executive sponsor owns the program's wave plan, D07: which divisions, in which order. Identity engineering decides each wave's go or no-go. A population's cutover is signed by HR, the identity owner, the ISSO and the business owner of the population, per Book 03's Appendix C. Whether source-of-authority transfer works in GCC needs a named owner and a decide-by date, with the AD-mastered path as the default. Who releases a reorganization's quarantine is agreed in advance. Every destructive retirement item needs explicit approval. The CISO decides drift severity and response times, D-A8, and owns every drift finding, while HR fixes every wrong value. And one decision carried from Gate 6 still gates AD's end: the ICAM governance body decides who writes the PIV binding after AD, D-A7, by week 39.

The checklist for these gates is three lines. Gate 7: one mover proved across the tracks with no ticket. Gate 8: waves by attribute query, leaver first, seven days of sole-source proof, the transitional rules removed, the OU tree frozen and archived. Gate 9: drift scans scheduled for HR, units and roles, findings closed at the source, and a limits register kept.

Where next: each track's own wave runbook, the Intune guide's Gate 5, the Arc guide's Step 3 and the non-person guide's Step 5; the project plan for dates and margins; and the books behind every gate. Parts 1 and 2 of this series cover the gates that come before.`,
  `${IG}, "Prerequisites," Gates 7–9, "Checklist," "Back to the books"; project plan, D-A7, D-A8, X-D07; Book 03, Appendix C — "Acceptance"; Book 01, Chapter 04 — "Phase 4"; companion guide, Stage 7.`);
}
endModule("Module 3");

// ================================================================== Backup
backup();
sourceSlide("Sources behind Module 1 — Gate 7: the mover proof", [
  "Attribute-Driven Migration implementation guide: \"How to use this guide,\" \"The path on one page,\" \"One identifier through every gate,\" Gate 7 (steps, Validate, Rollback, Evidence), \"Where the kits stop.\"",
  "Companion guide: \"Worked example: one user and one mover event,\" \"Limits\" (latency).  ·  Non-person identity implementation guide, Step 6.",
  "Book 02, Ch 10 (Lifecycle Workflows, mover workflow).  ·  Book 03, Ch 05 (middleware duties), Ch 08 (personnel actions, mover), Ch 11 (evidence each event leaves).  ·  Book 06, Ch 16 (when a change takes effect).",
  "Validation kit (examples/validation-kit): README \"What a check returns,\" \"Run it,\" \"Inputs,\" \"What a run writes\"; Checks/DG.ps1 and HR.ps1; tests/fixtures/fail (the fictional contoso.example tenant).",
  "Project plan (data/project-plans/attribute-driven-migration.yaml): A7.1, AG7, X-I43, X-G2; critical path note.",
]);
sourceSlide("Sources behind Module 2 — Gate 8: cut-over and the OU tree", [
  "Implementation guide: Gate 8 (steps 1–8, Validate, Rollback, Evidence), \"Rollback at a glance.\"",
  "Companion guide: Stage 7; \"Limits: Lifecycle Workflows\"; \"Lifecycle Workflows at scale\"; \"What still needs AD during hybrid\" (Microsoft source-of-authority guidance as the guide cites it).",
  "Book 00, Ch 09 (waves defined by attribute values), Ch 10 (GPO-link script).  ·  Book 01, Ch 04 (migration phases; Phase 4).  ·  Book 03, Ch 08, Ch 12 (Phase 4, Phase 5, open verification register), Appendix C.  ·  Book 05, Ch 07 (Set-GPLink, Backup-GPO), Ch 08 (rollback).",
  "Validation kit: README \"Inputs\" (shadow-pairs.csv), \"Known limits\" (VK-HR-05, VK-HR-06); Checks/HR.ps1; tests/fixtures/fail/groups.json (rule form).",
  "Project plan: A8.1–A8.4, AG8, X-D07, X-G3, X-P42, X-P51; Identity Lifecycle plan I5.1, I5.2. Could not verify: user source-of-authority transfer in GCC (Book 03, Ch 12 register).",
]);
sourceSlide("Sources behind Module 3 — Gate 9 and the close", [
  "Implementation guide: Gate 9 (steps, Validate, Rollback, Evidence), \"Where the kits stop,\" \"Prerequisites,\" \"Checklist,\" \"Back to the books.\"",
  "Companion guide: Stage 8, \"Limits,\" \"Dynamic group dangers and how to avoid them,\" \"Monitoring both.\"",
  "Book 00, Ch 01, Ch 10.  ·  Book 01, Ch 04 (verification), Ch 09 (authorizing official).  ·  Book 02, Ch 05 (drift detection), Ch 10 (assessment pipeline).  ·  Book 03, Ch 08, Ch 10, Ch 11, Ch 12, Appendix C.  ·  Book 05, Ch 07.  ·  Book 06, Ch 17.",
  "Validation kit: README \"Run it,\" permissions table; Private/Catalog.ps1 (check titles); Private/Core.ps1 (default options).",
  "Project plan: D-A7, D-A8, A9.1–A9.3, AG9, X-G5.  ·  Program master schedule: D07, D09, D11. Non-person identity plan: X-D11.",
]);

finish(OUT);
