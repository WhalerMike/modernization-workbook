// HR-Driven Identity learning path, Module 6: Time separations from the logs — the module's narrated deck.
// Teaches docs/training/hr-driven-identity/06-separation-timing.md, Learn-style: objectives, the concepts, "Try it"
// slides with the real Lab 1 commands and output (run November 2, 2026 in a scratch copy of examples/hr-lifecycle),
// Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module
// page, the path's verification log, or the kit's code and fixtures (examples/hr-lifecycle: separation_timing.py,
// config/separation.json, tests/fixtures/ch06); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-hr-module-6/build.js \
//                      presentations/training-hr-module-6/Training_HR_Module_6.pptx
const TITLE = "Module 6: Time separations from the logs";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  HR-Driven Identity learning path, Module 6: Time separations from the logs",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and the title slide's unit list for the Microsoft Automation path; this deck is on the HR path.
D.pres.title = `HR-Driven Identity learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "HR-DRIVEN IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_HR_Module_6.pptx";
const M = "Training, HR-Driven Identity, Module 6";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 6: Time separations from the logs", "HR-Driven Identity learning path · Gate G6 Separation, measured for every leaver",
    ["The leaver sequence  ·  The tenant schedule  ·  The two intervals  ·  ST-01 to ST-09", "Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 6 of the HR-Driven Identity learning path: time separations from the logs. This is Gate 6 of the implementation guide, separation, and it goes with Chapter 06 of the developer workbook. When a person separates, two things have to be shown: that access was blocked within the approved interval, and that the credential was revoked. In this module you'll join the records each system keeps about a leaver, compute two intervals for every one of them, separation-to-block and separation-to-revocation, and find the separations that went wrong. You'll run the measurement on fictional leavers, with no tenant. The module takes about forty-five minutes with its lab.`,
  `${M} — "Introduction"; module header.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why no single report tells you a leaver was blocked");
  tag(s, "Why");
  const b = table(s, "Where", 1.45, [5.2, 6.95], ["What happened to the leaver", "Where it's recorded"], [
    ["The leaver workflow's run completed", "Lifecycle Workflows"],
    ["The account was disabled", "The directory audit log"],
    ["The card was revoked", "The card system"],
    ["The devices were retired or wiped", "Intune"],
  ], { fontSize: 14, limit: 4.4 });
  callout(s, "Point", b + 0.35, 1.0, "FaUserXmark", HEX.red, "No Microsoft report gives the number: ",
    "join the records per leaver, compute two intervals, and find the separations that went wrong.");
  sources(s, "Sources: Module 6, \"Introduction.\"");
  notes(s,
`Why does this gate need code? Your ISSO has to show that each leaver's access was blocked within the approved interval and that the credential was revoked. No Microsoft report gives that number. Lifecycle Workflows records that a leaver run completed. The audit log records when the account was disabled. The card system records the card's revocation, and Intune records the devices being retired or wiped. Each lives in its own place. So in this module you join those records for each leaver, compute the two intervals, and find the separations that went wrong: an entry made late, a re-enable, a failed run, a card revoked too late, a delete before the devices were retired.`,
  `${M} — "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 6", [
    "Describe the leaver order: block first, revoke in parallel, reconcile, dispose last",
    "Define separation-to-block and separation-to-revocation, and say which records each reads",
    "Run the measurement and explain the ST findings, including the catch-up window",
    "Explain why the tenant schedule belongs inside the approved interval",
  ], [
    "Module 1: the pipeline sends active false no later than the leaver workflow's first run",
    "Module 3: the leaver and post-separation workflow files",
    "Module 5: card revocation reaches sign-in through the CRL",
  ], 45);
  sources(s, "Sources: Module 6, \"Learning objectives,\" \"Prerequisites.\"");
  notes(s,
`Here's what you'll be able to do by the end of the module. You'll describe the leaver order: block first, revoke in parallel, reconcile, and dispose last. You'll define separation-to-block and separation-to-revocation, and say which records each one reads. You'll run the measurement and explain its findings, including the catch-up window. And you'll explain why the tenant's workflow schedule belongs inside the approved interval. This module builds on three earlier ones. Module 1: the pipeline sends active false no later than the leaver workflow's first run. Module 3: the leaver and post-separation workflow files. And Module 5: a card's revocation reaches sign-in through the revocation list.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Leaver sequence
{
  const s = content(SC, "The leaver sequence: block first, dispose last");
  tag(s, "What");
  const b = table(s, "Step6", 1.45, [5.6, 6.55], ["The guide's Step 6", "Where Lab 1 sees it"], [
    ["Order the leaver as the sequence: block, revoke in parallel, reconcile, dispose", "The measurement reads the block, the card and the devices"],
    ["Time the leave date late in the day", "Read in Step 6"],
    ["Coordinate the two writers", "ST-05: a re-enable after the disable, with no cancellation in HR"],
    ["Build the emergency path", "On-demand runs, logged as changes"],
    ["Catch late separations", "ST-03: the three-day catch-up window"],
    ["Verify the block", "ST-01 and ST-02"],
    ["Dispose last", "ST-08: a delete before the devices were retired"],
  ], { fontSize: 12.5, limit: 5.4 });
  callout(s, "Built", b + 0.3, 0.85, "FaRoute", HEX.navy, "Already built: ",
    "Book 19, Chapter 05's custom task extension revokes the card and retires the devices.");
  sources(s, "Sources: Module 6, Unit 1 \"The leaver sequence\"; Lab 1, step 3; \"Summary\"; examples/hr-lifecycle/python/separation_timing.py.");
  notes(s,
`Unit 1 reads the guide's Step 6. It orders the leaver as a sequence: block first, revoke in parallel, reconcile, and dispose last. It times the leave date late in the day. It coordinates the two writers, so one can't undo the other; in the lab, a re-enable after the disable with no cancellation in HR is rule S T five. It builds an emergency path, whose on-demand runs are logged as changes. It catches separations that were entered late, which is S T three. It verifies the block, which is S T one and S T two. And it disposes last: deleting a user before the devices are retired is S T eight. Book 03 has the canonical leaver sequence, and Book 19's Chapter 05 has already built the custom task extension that revokes the card and retires the devices.`,
  `${M} — Unit 1 "The leaver sequence"; Book 03, Chapter 09 — "The canonical leaver sequence"; Book 19, Chapter 05 — "The leaver order."`);
}

// ================================================================== 5 Schedule
{
  const s = content(SC, "The schedule, late entries and the catch-up window");
  tag(s, "What");
  const l = panel(s, "Late", 0.6, 1.45, 6.3, null, HEX.red, HEX.redTint, "LATE ENTRIES", "The scheduled trigger can miss them", [
    "Learn: a scheduled workflow still processes a user whose trigger date passed no more than three days ago",
    "Past three days, the scheduled trigger skips the user",
    "ST-03 is a Finding with no on-demand run, a Warn with one",
  ], 13.5);
  const r = panel(s, "Sched", 7.15, 1.45, 5.6, null, HEX.navy, HEX.navyTint, "THE TENANT SCHEDULE", "Part of the interval", [
    "The schedule can delay a scheduled leaver's run",
    "So the wait is part of separation-to-block",
    "Set the threshold and the schedule together",
  ], 13.5);
  callout(s, "Why", Math.max(l, r) + 0.3, 0.9, "FaUserClock", HEX.navy, "Book 03, Chapter 08: ",
    "a separation entered late misses the scheduled trigger. The emergency path runs the leaver on demand.");
  sources(s, "Sources: Module 6, Unit 1; Knowledge check, answers 2 and 3; examples/hr-lifecycle/config/separation.json (catch-up window).");
  notes(s,
`Two timing facts shape the measurement. First, late entries. Learn says a scheduled workflow still processes a user whose trigger date passed no more than three days ago. Past three days, the scheduled trigger skips the user. Book 03's Chapter 08 explains why a separation entered late misses it. So rule S T three flags any separation entered more than three days after its effective date: a Finding if nobody ran the leaver on demand, and only a Warn if someone did. Second, the tenant's schedule. Lifecycle Workflows runs on a schedule, and that can delay a scheduled leaver's run. The wait is part of separation-to-block, so the guide says the schedule belongs inside the approved interval. Set the threshold and the schedule together.`,
  `${M} — Unit 1; "Knowledge check," answers 2 and 3; Book 03, Chapter 08 — "Triggers and schedule"; config/separation.json.`);
}

// ================================================================== 6 Intervals
{
  const s = content(SC, "The two intervals, and the records each reads");
  tag(s, "What");
  const b = table(s, "Int", 1.45, [3.5, 8.65], ["Interval, from the HR effective time", "Ends at"], [
    ["Separation-to-block", "Blocked: the later of the first Disable account and the first Update StsRefreshTokenValidFrom Timestamp audit record"],
    ["Separation-to-revocation", "Revoked: the last of the block, the card system's revocation and the device actions"],
  ], { fontSize: 13.5, limit: 3.6 });
  const l = panel(s, "Reads", 0.6, b + 0.25, 6.6, null, HEX.navy, HEX.navyTint, "WHAT THE MEASUREMENT READS", null, [
    "The HR separations: effective and entered times, cancelled, card collected",
    "Audit records and leaver run results, exported from Graph",
    "The card system's revocations; Intune device actions; privileged role holders",
  ], 13);
  panel(s, "Rule", 7.45, b + 0.25, 5.3, null, HEX.amber, HEX.amberTint, "NO GUESSED TIMES", null, [
    "Missing either audit record: not blocked, and ST-02",
    "A cancelled separation isn't measured",
    "Audit events from 24 hours before the effective time count",
  ], 13);
  sources(s, "Sources: Module 6, Unit 2 \"The intervals\"; Knowledge check, answer 1; examples/hr-lifecycle: separation_timing.py, config/separation.json.");
  notes(s,
`Unit 2 defines the two intervals. Both start at the HR effective time. Separation-to-block ends when the person was blocked, and the code takes that as the later of two audit records: the first Disable account, and the first session revocation, which the audit log calls Update S T S Refresh Token Valid From Timestamp. Disabled but still holding a session isn't blocked. Separation-to-revocation ends at the last of three things: the block, the card system's revocation and the device actions. To compute them, the measurement reads the HR separations, the audit records and leaver run results exported from Graph, the card system's revocations, Intune's device actions, and the list of privileged role holders. It never guesses. A leaver missing either audit record is not blocked, and that's a finding. A cancelled separation isn't measured at all.`,
  `${M} — Unit 2 "The intervals and the rules": "The intervals"; "Knowledge check," answer 1; separation_timing.py.`);
}

// ================================================================== 7 Rules
{
  const s = content(SC, "The rules: ST-01 to ST-09");
  tag(s, "What");
  const b = table(s, "Rules", 1.45, [1.15, 1.5, 9.5], ["Rule", "Severity", "Raised when"], [
    ["ST-01", "Finding", "Separation-to-block is over the threshold"],
    ["ST-02", "Finding", "No block recorded, or no account found to measure"],
    ["ST-03", "Finding or Warn", "Entered more than 3 days after the effective date: a Finding with no on-demand run, a Warn with one"],
    ["ST-04", "Finding", "An uncollected card was revoked more than 18 hours after notice"],
    ["ST-05", "Finding", "Re-enabled after the disable, with no cancellation in HR"],
    ["ST-06", "Warn", "A privileged leaver: the disable task doesn't support users with role assignments; confirm the verified path ran"],
    ["ST-07", "Finding", "A leaver run failed; route it to the exception queue"],
    ["ST-08", "Finding", "The user was deleted before the device retire or wipe completed"],
    ["ST-09", "Finding", "Separation-to-revocation is over the threshold"],
  ], { fontSize: 12.5, limit: 6.55 });
  sources(s, "Sources: Module 6, Unit 2 \"The rules\"; Knowledge check, answers 2 and 4; examples/hr-lifecycle/python/separation_timing.py.");
  notes(s,
`Here are the nine rules. S T one and S T nine compare the two intervals with their thresholds. S T two: no block was recorded, or there's no account to measure. S T three is the late entry, past the three-day catch-up window. S T four: a card that couldn't be collected was revoked more than eighteen hours after notice. S T five: the account was re-enabled after the disable, with no cancellation in HR. S T six is a warning for a privileged leaver, because the disable task doesn't support users with role assignments, so someone has to confirm the verified path ran. S T seven: a leaver run failed, and goes to the exception queue. And S T eight: the user was deleted before the device retire or wipe completed. Disposal comes last.`,
  `${M} — Unit 2 "The intervals and the rules": "The rules"; "Knowledge check," answers 2 and 4; separation_timing.py.`);
}

// ================================================================== 8 Thresholds
{
  const s = content(SC, "Which thresholds are samples the agency replaces");
  tag(s, "Who");
  const b = table(s, "Thr", 1.45, [4.2, 2.2, 5.75], ["Threshold (config/separation.json)", "Value", "Whose"], [
    ["Separation-to-block (ST-01)", "4 hours", "Sample: the agency's organization-defined period for PS-4"],
    ["Separation-to-revocation (ST-09)", "24 hours", "Sample: the agency approves or replaces it"],
    ["Uncollected card (ST-04)", "18 hours", "FIPS 201-3: terminated within 18 hours of notification"],
    ["Catch-up window (ST-03)", "3 days", "Learn: the scheduled workflow's window"],
  ], { fontSize: 13.5, limit: 4.6 });
  callout(s, "Approve", b + 0.35, 1.0, "FaScaleBalanced", HEX.teal, "The tool measures; the agency decides: ",
    "approve the block and revocation periods, and set the tenant schedule inside them.");
  sources(s, "Sources: Module 6, Unit 2 \"The rules\"; \"Introduction\" (FIPS 201-3); examples/hr-lifecycle/config/separation.json.");
  notes(s,
`Not every number in the rules is a requirement. Two are samples. The four-hour separation-to-block threshold and the twenty-four-hour separation-to-revocation threshold stand in for the agency's organization-defined periods under P S four. The agency approves them or replaces them. Two are fixed by their sources. The eighteen hours for an uncollected card is FIPS two oh one dash three's rule: a card that can't be collected is terminated within eighteen hours of notification. And the three-day catch-up window is Learn's, the window in which a scheduled workflow still picks up a user. So the tool measures, and the agency decides. Approve the block and revocation periods, and set the tenant schedule inside them.`,
  `${M} — Unit 2 "The intervals and the rules": "The rules"; "Introduction"; config/separation.json.`);
}
endModule(SC);

// ================================================================== 9 Try it: measure
{
  const s = content(SL, "Try it: measure the fictional leavers");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/hr-lifecycle (step 2's command wrapped across lines)",
    "$ python python/graph_export.py --task separation-read --list",
    "Task separation-read: AuditLog.Read.All, LifecycleWorkflows-Reports.Read.All",
    "  GET /auditLogs/directoryAudits  [AuditLog.Read.All]",
    "  GET /identityGovernance/lifecycleWorkflows/workflows/{workflowId}/userProcessingResults  [LifecycleWorkflows-Reports.Read.All]",
    "$ python python/separation_timing.py measure --separations tests/fixtures/ch06/hr-separations.csv \\",
    "    --users tests/fixtures/ch06/leaver-users.json --audits tests/fixtures/ch06/separation-audits.json \\",
    "    --results tests/fixtures/ch06/leaver-results.json --cards tests/fixtures/ch06/card-revocations.csv \\",
    "    --devices tests/fixtures/ch06/device-actions.csv --role-holders tests/fixtures/ch06/role-holders.csv \\",
    "    --config config/separation.json --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch06",
    "Leavers: 7 separated, 1 cancelled, 1 not blocked",
    "Separation-to-block hours: p50 0.25, p90 5.52, max 84.68 (threshold 4)",
    "Separation-to-revocation hours: p50 11.0, p90 110.0, max 395.0 (threshold 24)",
    "Separation: 10 Finding, 2 Warn, 0 Info",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026", pt: 10.5 });
  line(s, "Read", "Two read permissions. Exit code 2. The p90 to block, 5.52 hours, is over the 4-hour sample threshold.", c + 0.25, 0.45, 14);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 1 and 2; examples/hr-lifecycle: graph_export.py, separation_timing.py, tests/fixtures/ch06.");
  notes(s,
`Try it. Lab 1 runs in the h r lifecycle examples folder, on fictional leavers, with no tenant. Step one lists what the reader would call in a real tenant: two GET calls, the directory audits and the leaver workflow's processing results, for two read permissions. Step two runs the measurement over every input: the separations, the users, the audit records, the run results, the card revocations, the device actions and the role holders. It reports seven separated leavers, one cancelled, and one never blocked. The median separation-to-block is a quarter of an hour, but the ninetieth percentile is five point five two hours, over the four-hour sample, and the worst is nearly eighty-five. Revocation is worse: a ninetieth percentile of a hundred ten hours against twenty-four. Ten Findings, two Warns, exit code two.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2.`);
}

// ================================================================== 10 Try it: findings
{
  const s = content(SL, "Try it: read the twelve findings as stories");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "$ python -c \"import json; [print(r['Rule'], r['Severity'], r['Object']) for r in json.load(open('out/ch06/findings.json'))]\"",
    "ST-01 Finding casey.ng@contoso.example        ST-05 Finding harper.vu@contoso.example",
    "ST-01 Finding emery.sol@contoso.example       ST-07 Finding harper.vu@contoso.example",
    "ST-02 Finding drew.park@contoso.example       ST-08 Finding blake.ito@contoso.example",
    "ST-03 Finding drew.park@contoso.example       ST-09 Finding emery.sol@contoso.example",
    "ST-04 Finding casey.ng@contoso.example        ST-09 Finding blake.ito@contoso.example",
    "                                              ST-03 Warn emery.sol@contoso.example",
    "                                              ST-06 Warn kai.oto@contoso.example",
  ], { label: "TRY IT  ·  LAB 1, STEP 3, RUN NOVEMBER 2, 2026 (TWELVE LINES SET IN TWO COLUMNS)", pt: 10.5 });
  panel(s, "Story", 0.6, c + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "THE WORKBOOK'S STORY", null, [
    "Casey: blocked after 5.52 hours (ST-01); the uncollected card was revoked 23 hours after notice (ST-04)",
    "Drew: entered 6.8 days late, with no on-demand run, and never blocked (ST-02, ST-03)",
    "Harper: re-enabled with no cancellation (ST-05), and a failed run (ST-07); Kai holds a privileged role (ST-06)",
    "Blake: deleted before the device retire completed (ST-08)",
  ], 12.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" step 3; examples/hr-lifecycle: separation_timing.py, tests/fixtures/ch06.");
  notes(s,
`Step three prints the findings, one line each: twelve of them. Read them as stories about people. Casey was blocked after five and a half hours, over the threshold, and Casey's card, which couldn't be collected, was revoked twenty-three hours after notice, past FIPS's eighteen. Drew's separation was entered six point eight days late, nobody ran the leaver on demand, and Drew was never blocked at all. Harper was re-enabled after the disable with no cancellation in HR, and Harper's leaver run failed. Kai holds a privileged role, and the disable task doesn't support users with role assignments, so someone has to confirm the verified path ran. And Blake was deleted before the device retire completed. Emery shows the other side of S T three: entered late, but caught by an on-demand run, so it's only a Warn.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," step 3.`);
}

// ================================================================== 11 Try it: intervals
{
  const s = content(SL, "Try it: the intervals file Module 7 reads");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 7.2, [
    "# Lab 1, step 4",
    "$ cut -d, -f1,7,8,10 out/ch06/intervals.csv",
    "PersonNumber,separationToBlockHours,",
    "  separationToRevocationHours,status",
    "100301,0.25,11.0,measured",
    "100302,5.52,21.0,measured",
    "100303,,,not blocked",
    "100304,84.68,110.0,measured",
    "100305,0.1,10.0,measured",
    "100306,0.35,9.0,measured",
    "100307,,,cancelled",
    "100308,0.1,395.0,measured",
  ], { label: "TRY IT  ·  RUN NOVEMBER 2, 2026 (HEADER WRAPPED)", pt: 11.5 });
  const r = panel(s, "Read", 8.05, 1.45, 4.7, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "A header and eight rows: six measured, one not blocked (100303), one cancelled (100307)",
    "No guessed times: the not-blocked row has no intervals",
    "Step 5: the tests, 57 passed; then delete out",
  ], 13);
  line(s, "Next", "Module 7 rebuilds out/ch06 and reads its summary.json: the p90s become two of its six metrics.", Math.max(c, r) + 0.25, 0.45, 14);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 4 and 5; \"Summary\"; Module 7, \"Exercise: Lab 1,\" step 2.");
  notes(s,
`Step four cuts four columns from the intervals file: the person number, the two intervals and the status. There's a header and eight rows. Six are measured. One, person one hundred three oh three, is not blocked, and its interval columns are empty rather than guessed. One, one hundred three oh seven, is a cancelled separation, so it isn't measured. Look at one hundred three oh eight: blocked in six minutes, but not fully revoked for three hundred ninety-five hours, because the card and the devices came much later. Step five runs the tests, fifty-seven passed, and deletes the out folder. Module 7 rebuilds this output and reads its summary, where the two ninetieth percentiles become two of its six lifecycle metrics.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," steps 4 and 5; "Summary"; Module 7 — Lab 1, step 2.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: one scheduled and one on-demand test leaver");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A test tenant with Lifecycle Workflows licensed and a leaver workflow in Book 03's order, never production"],
    ["Permissions", "A reader app with a certificate holding AuditLog.Read.All and LifecycleWorkflows-Reports.Read.All, with admin consent, nothing else"],
    ["Run", "Make one scheduled and one on-demand test leaver; export the logs; confirm which audit activity the revoke task writes; measure"],
    ["Expect", "Each test user's separation-to-block includes the wait for the tenant schedule"],
    ["Back it out", "Remove the leave dates; re-enable or restore the users if needed; remove the permissions; delete the reader app, its certificate and the folders"],
  ], { fontSize: 12.5, limit: 5.4 });
  callout(s, "NotRun", b + 0.3, 0.9, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "Lab 2 follows the workbook's Chapter 06, Lab 2, written from Microsoft Learn's procedures.");
  sources(s, "Sources: Module 6, \"Exercise: Lab 2\"; HR-Driven Identity path, \"What you need for the labs\"; path verification log, claim 3.");
  notes(s,
`Lab 2 moves to your own test tenant, never production, with Lifecycle Workflows licensed and a leaver workflow in Book 03's order. The reader app holds a certificate and just the two permissions from step one, with admin consent. You make two test leavers, one scheduled and one run on demand, export the logs, and confirm which audit activity the session revoke task actually writes, because the measurement depends on that name. Then you measure. Expect each test user's separation-to-block to include the wait for the tenant schedule. That's the lesson from Unit 1, now in your own numbers. To back it out, remove the leave dates, re-enable or restore the users if you need them, remove the permissions, and delete the reader app, its certificate and the folders. The authors haven't run Lab 2.`,
  `${M} — "Exercise: Lab 2 (your test tenant)"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence to keep");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.0, 9.15], ["Requirement", "What this gate meets"], [
    ["NIST SP 800-53", "PS-4 personnel termination; AC-2(3) disable accounts; PS-7 for contractors; AC-2(13) high-risk individuals"],
    ["FIPS 201-3", "A card that can't be collected is terminated within 18 hours of notification"],
  ], { fontSize: 13, limit: 3.3 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS FOR GATE 6", null, [
    "intervals.csv, summary.json and findings.json with the manifest, per run",
    "The exported workflow runs, audit records, card revocations and device actions behind them",
    "The contractor rows of the intervals; the notice and revocation times for uncollected cards",
    "The emergency path's on-demand runs, logged as changes",
  ], 13);
  sources(s, "Sources: Module 6, \"Introduction\" (the federal requirement); \"Summary\" (the evidence an ISSO keeps).");
  notes(s,
`The federal requirement. In NIST special publication eight hundred fifty-three terms, this gate meets P S four, personnel termination; A C two, enhancement three, disable accounts; P S seven for contractors; and A C two, enhancement thirteen, disabling accounts for high-risk individuals. It also meets FIPS two oh one dash three's rule that a card that can't be collected is terminated within eighteen hours of notification. The evidence an ISSO keeps for Gate 6: the intervals, the summary and the findings, with their manifest, for every run. The exported workflow runs, audit records, card revocations and device actions behind them. The contractor rows of the intervals. The notice and revocation times for uncollected cards. And the emergency path's on-demand runs, logged as changes.`,
  `${M} — "Introduction" (the federal requirement); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on separations", [
    { q: "What does the code take as the moment a leaver was blocked?", options: ["a. The leaver workflow's completion time", "b. The later of the first Disable account and the first session revocation record", "c. The HR effective time"] },
    { q: "A separation is entered more than three days late, and nobody runs the leaver on demand. What's reported?", options: ["a. Nothing; the scheduled trigger catches it", "b. An ST-03 Finding, because it missed the catch-up window", "c. An ST-06 Warn"] },
  ], "1 b: the later of the disable and the session revocation. 2 b: past three days the scheduled trigger skips the user.");
  sources(s, "Sources: Module 6, \"Knowledge check,\" questions 1 and 2, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions from the module's knowledge check. First: what does the code take as the moment a leaver was blocked? The answer is b: the later of the first Disable account record and the first session revocation record. Not the workflow's completion time, and not the HR effective time, which is where the interval starts. Second: a separation is entered in HR more than three days after its effective date, and nobody runs the leaver on demand. What does the measurement report? The answer is b: an S T three Finding, because past three days the scheduled trigger skips the user. With an on-demand run, it would be only a Warn. The module page has two more questions, each linked to the section that teaches it.`,
  `${M} — "Knowledge check," questions 1 and 2; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 7, drift and evidence");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Ordered the leaver: block first, revoke in parallel, reconcile, dispose last",
    "Defined the two intervals, and the records each reads",
    "Measured fictional leavers and read the ST findings",
    "Saw why the tenant schedule sits inside the approved interval",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 7: Find lifecycle drift and file the evidence", [
    "Six drift classes and six metrics",
    "A hash-chained evidence package",
  ], 13.5);
  callout(s, "Feeds", Math.max(l, r) + 0.3, 0.9, "FaChartLine", HEX.teal, "This module's output feeds Module 7: ",
    "the two percentiles become lifecycle metrics in every run.");
  sources(s, "Sources: Module 6, \"Summary\"; Module 7, \"Introduction,\" \"Learning objectives.\"");
  notes(s,
`To sum up. You put the leaver in order: block first, revoke in parallel, reconcile, and dispose last. You defined separation-to-block and separation-to-revocation, and the records each one reads. You measured fictional leavers and found the ones that were blocked late, never blocked, re-enabled, failed, or deleted too early. And you saw why the tenant schedule belongs inside the approved interval. Next is Module 7, the last in the path: find lifecycle drift and file the evidence. It writes one read-only run of six drift classes and six metrics, reads this module's percentiles as two of them, and packages each run with a hash chain an ISSO can verify.`,
  `${M} — "Summary"; Module 7 — "Introduction," "Learning objectives."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: HR Module 6 deck", [
  "Module page: docs/training/hr-driven-identity/06-separation-timing.md (HR-Driven Identity learning path, Module 6): Introduction, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "The units it assigns: the HR-driven identity implementation guide, Step 6; Book 03, Chapter 09 (the canonical leaver sequence) and Chapter 08 (triggers and schedule); Book 19, Chapter 05 (the leaver order); the developer workbook Building HR-Driven Identity, Chapter 06 (The intervals; The rules; Lab 1; Lab 2; Federal requirements and evidence).",
  "Path: docs/training/hr-driven-identity/index.md (What you need for the labs) and its verification log, _verification/learning-path.md (Lab 1 re-run November 1, 2026; Lab 2 not run).",
  "Kit: examples/hr-lifecycle (README; python/separation_timing.py; python/graph_export.py; config/separation.json; tests/fixtures/ch06). The leavers are fictional.",
  "Lab output: run November 2, 2026 in a scratch copy of examples/hr-lifecycle with Python 3.14.3 (57 tests passed); the Try it output is trimmed or rearranged where the slide says so. Lab 2 not run by the authors.",
]);

finish(OUT);
