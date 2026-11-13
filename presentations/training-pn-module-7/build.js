// Provider Notices learning path, Module 7: Routing to owners — the module's narrated deck.
// Teaches docs/training/provider-notices/07-routing-to-owners.md, Learn-style: objectives, the concepts the page sends the
// learner to (Book 15, Chapter 14, "From notice to task to closure"; the guide's Step 6; workbook Chapter 06, "What the
// program gives you," "What it leaves to you," "The routing file," "The payload," "Runs and state," "Dangers"), three
// "Try it" slides with the real Lab 1 commands and output (run November 12, 2026 in a scratch copy of
// examples/provider-notices with examples/servicenow-sailpoint beside it, the same output the page shows), Lab 2, the
// federal requirement and evidence, a two-question check, and the summary. Every fact comes from those pages, their
// footnotes or the kit; the deck adds none. Helpers: ../training-pn-module-1/pn.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pn-module-7/build.js \
//                      presentations/training-pn-module-7/Training_PN_Module_7.pptx
const P = require("../training-pn-module-1/pn.js")("Module 7: Routing to owners");
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_PN_Module_7.pptx";
const M = "Training, Provider Notices, Module 7";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 7: Routing to owners", "Provider Notices learning path · Gate G6 Routing, with workbook Chapter 06",
    ["Rules in order  ·  The typed task and its two dates  ·  Five clauses  ·  Runs and state", "Close on the re-read  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence  ·  Check"]);
  notes(s,
`Welcome to Module 7 of the Provider Notices learning path: routing to owners. A notice nobody owns is the problem this path started with. This module is where each notice that needs action gets an owner. It's Gate 6 of the provider notices implementation guide, with Chapter 6 of the developer workbook. Each notice that needs action becomes a typed task in the service desk's front door, with a severity, a response window, and the provider's own date kept beside it. The rest go in the weekly digest. In this module you'll check the lab's routing, route two fictional weeks from all five providers as a dry run, read one payload in full, and watch a re-run write nothing. It takes about sixty-five minutes, with a lab on fixtures and a lab in a ServiceNow developer instance. The code is illustrative: tested against fixtures, not run against a live instance.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "A notice needs an owner, once, until the re-read");
  tag(s, "Why");
  const w = 5.95, g = 0.25;
  const p1 = panel(s, "Own", 0.6, 1.45, w, null, HEX.red, HEX.redTint, "NOBODY OWNS IT", null, [
    "A notice carries no owner and no due date",
    "Routing gives each one that needs action a typed task with both",
  ], 13);
  const p2 = panel(s, "Repeat", 0.6 + w + g, 1.45, w, null, HEX.amber, HEX.amberTint, "PROVIDERS REPEAT THEMSELVES", null, [
    "The same notice comes back every week",
    "The router remembers, and writes nothing for an unchanged notice",
  ], 13);
  const top2 = Math.max(p1, p2) + 0.2;
  panel(s, "Close", 0.6, top2, 12.15, null, HEX.navy, HEX.navyTint, "THE PROVIDER CLOSING ISN'T THE WORK BEING DONE", null, [
    "A retirement can close on the provider's side while the agency still runs the retired version",
    "So a task closes only on the agency's own re-read",
  ], 13);
  sources(s, "Sources: Module 7, \"Introduction\"; Book 15, Ch 14 (From notice to task to closure).");
  notes(s,
`Why does routing matter? Three reasons. First, a notice carries no owner and no due date. Routing is where each notice that needs action gets both: a typed task in the front door, not a second queue, with an owner, a severity, a response window, and the provider's own date. Second, providers repeat themselves. The same notice comes back in every weekly read. A router that ticketed it every week would fill the queue, and people would stop reading it. So the router remembers what it has routed, and writes nothing for a notice that hasn't changed. Third, a provider closing its notice isn't the agency's work being done. A retirement can close on the provider's side while the agency still runs the retired version. So a task closes only when the agency's own next collection shows the notice closed, or the agency's resources no longer affected. That's the re-read.`,
  `${M} — Unit "Introduction"; Unit 1: Book 15, Chapter 14 — "From notice to task to closure."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 7", [
    "Write routing rules in the right order, and say why security and retirements come first",
    "Route a collection as a dry run, and read what each payload is for: create, update or close",
    "Read a payload: severity, response window, the provider's date, contingency review, five clauses",
    "Explain why a re-run writes nothing, and why a provider's closure asks for the re-read",
    "Say where the agency's routing is written and kept",
  ], [
    "At least one of Modules 2 to 6",
    "Book 13, Appendix B: the typed task, its lanes, the five-clause request chain",
    "Lab 1: PowerShell 7.1+ with Pester 5; no tenant",
  ], 65);
  sources(s, "Sources: Module 7, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll write routing rules in the right order, and say why security advisories and retirements come before the general action-required rule. You'll route a collection as a dry run, and read what each payload is for: create, update or close. You'll read a task payload: its severity, priority and response window, the provider's own date, the contingency review flag and the five clauses. You'll explain why a re-run writes nothing, and why a provider's closure asks for the re-read instead of closing the task. And you'll say where the agency's routing is written and kept. Before you start, finish at least one of Modules 2 to 6, and read the Ticket-to-Machine reference appendix in Governance, Drift and Evidence, for the typed task, its lanes and the five-clause request chain. Lab 1 needs PowerShell 7.1 or later with Pester 5. No tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Rules in order
{
  const s = content(SC, "The routing file: rules tried in order");
  tag(s, "What");
  const b = table(s, "Rules", 1.45, [3.4, 8.75], ["Part of a rule", "What it holds"], [
    ["id, route", "task, digest or ignore"],
    ["match", "provider, kind, status; actionRequired, hasResources; servicePattern, regionPattern"],
    ["For a task", "severity P1 to P4, assignmentGroup, approverRole, contingencyReview"],
    ["Read-PnRouting refuses", "An unknown match key, another route, a task without severity or group, any <placeholder>"],
  ], { fontSize: 12.5, limit: 4.3 });
  callout(s, "Order", b + 0.25, 1.15, "FaArrowDownWideShort", HEX.amber, "First match wins: ",
    "security advisories, then retirements, then maintenance naming our resources, then open incidents naming them, then anything else needing action. A retirement is often also marked action required, and the retirement rule carries the contingency review.");
  sources(s, "Sources: Module 7, Units 1 and 2; Chapter 06 (The routing file), design guidance; Book 15, Ch 14 (From notice to task to closure).");
  notes(s,
`The agency's routing is a JSON file of ordered rules. Each rule has an I D, a match, and a route: task, digest or ignore. A match can name providers, kinds and statuses; whether action is required or the notice names resources; and patterns for services and regions. A task rule also carries a severity, P1 to P4, an assignment group, an approver role, and whether it needs a contingency review. The kit's routing check refuses an unknown match key, any route other than the three, a task without a severity or an assignment group, and any placeholder left in. Then the order. Rules are tried in order, and the first match wins, so the specific rules come first: security advisories, then retirements, then maintenance that names the agency's resources, then open incidents that name them, then anything else marked as needing action. The order matters. A retirement is often also marked action required, and the retirement rule, which carries the contingency review, should take it first.`,
  `${M} — Unit 1: Book 15, Chapter 14 — "From notice to task to closure"; Unit 2: workbook Chapter 06 — "The routing file."`);
}

// ================================================================== 5 The payload
{
  const s = content(SC, "The payload: a typed task with two dates");
  tag(s, "What");
  const b = table(s, "Pay", 1.45, [3.6, 8.55], ["Field", "What it holds"], [
    ["action, dedupe_key", "create, update or close; <provider>|<sourceId>"],
    ["severity, priority, response_due", "The finding contract: P1 immediate, P2 one hour, P3 24 hours, P4 72 hours (program design)"],
    ["action_required, action_due", "The provider's own date, kept apart from the response window"],
    ["contingency_review", "Set by the rule; the evidence step adds CP-2"],
    ["ticket_to_machine", "The Human decision lane and the five clauses, C1 to C5"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Dates", b + 0.25, 1.0, "FaScaleBalanced", HEX.navy, "Two dates, both right: ",
    "the response window says how fast the owner picks the task up; the provider's date says when the work must be done, and for a retirement it may be months away.");
  sources(s, "Sources: Module 7, Unit 2; Chapter 06 (What the program gives you; What it leaves to you; The payload); Book 13, App. B (severity and tempo).");
  notes(s,
`Each task is a ServiceNow-shaped payload. Its action is create, update or close, and its de-duplication key is the provider and the provider's own I D. Its severity, priority and response window come from the Ticket-to-Machine finding contract: P1 immediate, P2 one hour, P3 twenty-four hours, P4 seventy-two hours. Those windows are program design, not a federal requirement, and a test reads the contract and fails if they drift. Then the provider's own action date, kept in a separate field. The two dates answer different questions. The response window says how fast the owner must pick the task up. The provider's date says when the work must be done, and for a retirement it may be months away. Confusing them makes a P3 task look due in a year, or a retirement due tomorrow. The payload also carries the contingency review flag, and the Ticket-to-Machine block: the Human decision lane, and the five clauses of the request chain. Where it came from, who approves, what to do, the re-read check, and the evidence kept.`,
  `${M} — Unit 2: workbook Chapter 06 — "What the program gives you," "What it leaves to you," "The payload," "Dangers."`);
}

// ================================================================== 6 Runs and state
{
  const s = content(SC, "Runs and state: routed once, closed on the re-read");
  tag(s, "How");
  const b = table(s, "State", 1.45, [2.6, 9.55], ["The notice is", "What the router writes"], [
    ["new, open", "create, the first time a task-routed notice is open"],
    ["changed", "update: a different fingerprint, or its rule changed"],
    ["unchanged", "Nothing: the state keyed by <provider>:<sourceId> holds each fingerprint"],
    ["closed by the provider", "close, asking for the re-read (C4); it doesn't close the task"],
    ["absent", "update, asking for the re-read: open, from a provider read this run, no longer listed"],
  ], { fontSize: 12.5, limit: 4.7 });
  line(s, "Dry", "A provider not read this run never has its notices marked absent. Every run is a dry run unless -Send runs with routing.send true.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 7, Units 1 and 2; Chapter 06 (Runs and state; Dangers), design guidance; the guide, Step 6.");
  notes(s,
`Runs and state. The router compares each notice with its state, which is keyed by the provider and the provider's I D and holds each notice's fingerprint. A task-routed notice gets a create the first time it's open. It gets an update when it changes, meaning a different fingerprint, or when its rule changes. An unchanged notice writes nothing. When the provider closes its notice, the task gets a close payload, but that close asks for the re-read, clause C4; it doesn't close the task. The task is resolved on the agency's own check. And an open notice from a provider read in this run that's no longer listed is marked absent, and its task gets an update asking for the same re-read. A provider that wasn't read this run never has its notices marked absent. Each run writes the payloads, a task list, a routing spreadsheet file, the state and a manifest. It's a dry run: nothing is sent unless the scheduled run's send switch is given, with sending turned on in the settings.`,
  `${M} — Unit 2: workbook Chapter 06 — "Runs and state," "Dangers"; the guide — Step 6, step 4.`);
}
endModule(SC);

// ================================================================== 7 Try it: rules and route
{
  const s = content(SL, "Try it: six rules, 22 notices, 12 tasks");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/provider-notices: the lab's routing (fictional teams)",
    "R01 task   P2       Security Operations (example)",
    "R02 task   P3       Cloud Platform Engineering (example)",
    "R03 task   P3       Cloud Platform Engineering (example)",
    "R04 task   P2       Service Desk (example)",
    "R05 task   P3       Cloud Operations (example)",
    "R06 ignore",
    "# Step 2: the template as it ships",
    "Exception: Routing templates/routing.template.json still has a <placeholder>.",
    "# Steps 3 and 4: collect day one, then route it as a dry run",
    "$ ./Invoke-PnRoute.ps1 -NoticesPath out/day1/notices.json -RoutingPath config/routing.json ... ",
    "Notices: 22 new, 0 changed, 0 unchanged, 0 no longer listed",
    "Routes:  12 task, 9 digest only, 1 ignored",
    "Payloads: 12 create, 0 update, 0 close",
    "Dry run: 12 payloads written to out/day1-route/tasks, nothing sent. State: out/state.json",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Viva", "The Microsoft Viva post is ignored by R06; the rest that need no task go to the digest.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 1 to 4; examples/provider-notices: config/routing.json, templates/routing.template.json.");
  notes(s,
`Try it. Lab 1 runs in the provider notices folder of the examples, in PowerShell 7. The teams in the lab's routing are fictional. Step one checks the lab's routing: six rules, in the order they're tried. Five route to a task: security operations at P2, cloud platform engineering at P3 twice, the service desk at P2, and cloud operations at P3. The sixth ignores. Step two tries the template as it ships, and the kit refuses it, because it still has a placeholder. It runs only once every value is filled in, at work. Step three collects every provider from the day-one fixtures: twenty-two notices, as in Module 1. Step four routes them as a dry run. Twenty-two new notices. Twelve route to a task, nine go to the digest only, and one is ignored: the Microsoft Viva post, by rule R06. That's twelve create payloads, written to a folder, and nothing sent.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 4.`);
}

// ================================================================== 8 Try it: one payload
{
  const s = content(SL, "Try it: read the Azure retirement's payload");
  tag(s, "How");
  const c = code(s, "Pay", 0.6, 1.45, 12.15, [
    "# Step 5: read one payload (Format-List, trimmed)",
    "action                  : create",
    "dedupe_key              : azure|RT5J-6KL",
    "severity                : P3",
    "response_window_seconds : 86400",
    "response_due            : 2026-11-10T12:00:00Z",
    "action_due              : 2027-09-30T00:00:00Z",
    "assignment_group        : Cloud Platform Engineering (example)",
    "contingency_review      : True",
    "controls                : {CM-3, CM-4, CP-2, SI-5}",
    "lane                    : Human decision",
    "c2_approver_role        : System owner",
    "c4_reread_check         : The next collection shows the notice closed or no longer listed, or the named",
    "                          resources no longer affected",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED)", pt: 10.5 });
  line(s, "Two", "Picked up within 24 hours; the work is due by Microsoft's retirement date, ten months later.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" step 5; Chapter 06 (The payload); out/day1-route/tasks/create-azure-RT5J-6KL.json.");
  notes(s,
`Step five reads one payload in full: the Azure retirement from Module 1. It's a create, keyed on Azure and the notice's tracking I D. Its severity is P3, with a response window of eighty-six thousand four hundred seconds, twenty-four hours, so the response is due November tenth, 2026, a day after the run. The retirement date is kept apart, in the action due field: September thirtieth, 2027. Both are right. The owner picks the task up within a day, and the work is due by the retirement date, ten months later. It goes to cloud platform engineering, with the contingency review flag set, and it supports C M three, C M four, C P two and S I five. And the Ticket-to-Machine block puts it in the Human decision lane, with the system owner as approver, and a re-read check: the next collection shows the notice closed or no longer listed, or the named resources no longer affected.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 5.`);
}

// ================================================================== 9 Try it: re-run and second week
{
  const s = content(SL, "Try it: a re-run writes nothing; week two updates");
  tag(s, "How");
  const c = code(s, "Week", 0.6, 1.45, 12.15, [
    "# Step 6: route the same collection again, on a copy of the state",
    "Notices: 0 new, 0 changed, 22 unchanged, 0 no longer listed",
    "Payloads: 0 create, 0 update, 0 close",
    "No payloads: nothing new or changed needs a task.",
    "# Steps 7 and 8: collect and route the second week; what each payload is for",
    "Notices: 2 new, 6 changed, 15 unchanged, 1 no longer listed",
    "Payloads: 1 create, 4 update, 1 close",
    "change  ruleId action severity noticeId",
    "changed R01    close  P2       aws:arn:aws:health:us-east-1::event/IAM/AWS_IAM_SECURITY_NOTIFICATION/...",
    "absent  R04    update P2       azure:AB1C-2DE",
    "changed R03    update P3       azure:PM3F-4GH",
    "changed R05    update P3       m365:MC900003",
    "new     R05    create P3       m365:MC900005",
    "changed R03    update P3       oci:chain-example-01",
    "# Step 9: run the router's tests        PassedCount 31, FailedCount 0",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Close", "The AWS close and the Azure absent update both ask for the re-read; neither closes a task.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 6 to 9; examples/provider-notices/tests/Router.Tests.ps1; examples/servicenow-sailpoint (finding contract).");
  notes(s,
`Step six routes the same collection again, on a copy of the state. All twenty-two notices are unchanged, and the router writes nothing: no payloads, because nothing new or changed needs a task. That's the guard against the same notice being ticketed every week. Step seven collects and routes the second week. Two new notices, six changed, fifteen unchanged, and one no longer listed: one create, four updates and one close. Step eight reads what each payload is for. The Azure and Oracle rescheduled maintenance windows, and the updated Microsoft 365 post, are changed updates. The Azure incident the provider no longer lists is an absent update, asking for the re-read. The new Microsoft 365 post is a create. And the AWS security notification that AWS closed is a close, which also asks for the re-read, not for the task to be closed. Step nine runs the router's tests, including the one that reads the finding contract: thirty-one pass, none fail. Then delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 6 to 9.`);
}

// ================================================================== 10 Lab 2 and routing at work
{
  const s = content(SL, "Lab 2: one payload to a developer instance");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A ServiceNow Personal Developer Instance or sub-production instance, never production; an endpoint you build (its shape is not yet specified); a test integration user's token"],
    ["Send", "Put the token in the environment for this session only, never in a file; send one payload through the kit's sender"],
    ["Check", "The record's assignment group, priority, description and five clauses in the instance"],
    ["Back it out", "Delete the test record, clear the token, and delete out"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Work", b + 0.25, 1.0, "FaBuilding", HEX.amber, "Your routing stays at work: ",
    "written from the kit's template, with its Copilot prompts in Microsoft 365 Copilot Chat if that helps, and kept inside the agency's boundary. Not run by the authors.");
  sources(s, "Sources: Module 7, \"Exercise: Lab 2\"; Chapter 06 (Lab 2; Dangers); the guide (Prerequisites; Step 6, interim path).");
  notes(s,
`Lab 2 sends one payload to a ServiceNow developer instance. You need a Personal Developer Instance or a sub-production instance, never production, with an endpoint you build to accept the payload. Its shape is the agency's, and not yet specified. You also need a token for a test integration user, and Lab 1's steps three and four run first. Put the token in the environment for this session only, never in a file: the kit refuses secret-like values in a settings file. Send one payload through the kit's sender, and check the record's assignment group, priority, description and five clauses in the instance. Then back it out: delete the test record, clear the token, and delete the output. Until the endpoint exists, the service desk works from the dry run's task folder and routing file. And the agency's own routing is written at work, from the kit's template, with its Copilot prompts in Microsoft 365 Copilot Chat if that helps, and kept inside the agency's boundary. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, a ServiceNow developer instance"; workbook Chapter 06 — "Lab 2," "Dangers"; the guide — "Prerequisites," Step 6 "Interim path."`);
}
endModule(SL);

// ================================================================== 11 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G6");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.7, 3.0, 5.45], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["CM-3 b: the routing checked before it runs", "KSI-CMT-LMC, KSI-CMT-RVP", "Read-PnRouting on the agency's routing file"],
    ["SI-5 c and d", "KSI-SCR-MON", "tasks/, tasks.json, routing.csv"],
    ["CM-3 b and f; CM-4", "KSI-CMT-LMC, KSI-CMT-RVP", "Payloads for change, retirement and maintenance, and the change records they open"],
    ["CP-2 e", "KSI-RPL-ARP", "Payloads with contingency_review: true"],
    ["SI-5 d; CM-3 f", "KSI-SCR-MON, KSI-CMT-LMC", "state.json, routing.csv: routed once, re-runs write nothing, closure asks for the re-read"],
  ], { fontSize: 11.5, limit: 5.2 });
  line(s, "KSI", "No KSI cites base CM-4; KSI-CMT-LMC and KSI-CMT-VTD cite CM-4(2). The mapping is design guidance.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Introduction\"; Chapter 06 (Federal requirements and evidence): NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Gate 6 supports NIST special publication eight hundred fifty-three S I five, parts c and d: disseminating advisories to the people who act, and implementing directives in the established time frames. It supports C M three, parts b and f, and C M four: a change a provider announces is reviewed, and its impact analyzed, before it lands. And it supports C P two, part e: retirements and maintenance that name the agency's resources prompt a contingency plan review. The evidence is the routing check on the agency's file; the task payloads, the task list and the routing file; the payloads for changes, retirements and maintenance, and the change records they open; the payloads with the contingency review flag; and the state, which shows each notice routed once. No K S I cites base C M four; two cite its second enhancement. K S I's are FedRAMP twenty X indicators for cloud service providers, and which file supports which indicator is the program's mapping. The assessor decides whether each control is satisfied.`,
  `${M} — Unit "Introduction" (the federal requirement); workbook Chapter 06 — "Federal requirements and evidence."`);
}

// ================================================================== 12 Check
{
  const s = check(SS, "Check yourself: two questions on routing", [
    { q: "A task's response_due is tomorrow and its action_due is in ten months. Which is right?", options: ["a. One of them is a mistake", "b. Both: the window says how fast the owner picks it up; the provider's date, when the work is due", "c. action_due overrides response_due"] },
    { q: "AWS closes its security notification. What does the router do?", options: ["a. Closes the task", "b. Deletes the task", "c. Writes a close payload that asks for the re-read (C4); the task is resolved on the agency's own check"] },
  ], "1 b: two dates, two questions. 2 c: the provider closing its notice isn't the agency's work being done.");
  sources(s, "Sources: Module 7, \"Knowledge check,\" questions 2 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: a task's response due date is tomorrow, and its action due date is in ten months. Which is right? The answer is b, both. The response window says how fast the owner must pick the task up; the provider's date says when the work must be done. They answer different questions, so the kit keeps them in separate fields. Second: AWS closes its security notification. What does the router do? The answer is c. It writes a close payload that asks for the re-read, clause C4, and the task is resolved on the agency's own check. The provider closing its notice isn't the agency's work being done. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 4; "Check your answers."`);
}

// ================================================================== 13 Summary
{
  const s = content(SS, "Summary, and next: Module 8, digest and evidence");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Checked six routing rules, and saw the template refused",
    "Routed 22 notices into 12 task payloads",
    "Read one with both its dates and its five clauses",
    "Watched a re-run write nothing, and read week two's create, updates and close",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 8: Digest, evidence and go/no-go", [
    "Gate G7, with workbook Chapter 07",
    "The weekly digest and the evidence chain",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "each run's tasks/, tasks.json, routing.csv, state.json and manifest, dated; the reviewed routing file's SHA-256; and the change records the payloads open.");
  sources(s, "Sources: Module 7, \"Summary\"; Module 8; Chapter 06 (Checklist).");
  notes(s,
`To sum up. You checked six routing rules and saw the template refused, routed twenty-two notices into twelve task payloads, read one with both its dates and its five clauses, watched a re-run write nothing, and read the second week's create, updates and close. The evidence an ISSO keeps for Gate 6 is each routing run's task payloads, task list, routing file, state and manifest, all dated; the reviewed routing file's SHA-256; and the change records the payloads open. Before you ship, work through the chapter's checklist. Next is Module 8: digest, evidence and go/no-go. That's Gate 7: the weekly digest the owners read for everything that isn't a task, and the hashed evidence chain that records every run.`,
  `${M} — Unit "Summary"; Module 8; workbook Chapter 06 — "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 7 deck", [
  "Module page: docs/training/provider-notices/07-routing-to-owners.md (Provider Notices learning path, Module 7): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "What the module sends the learner to: Book 15, Chapter 14, \"From notice to task to closure\"; Provider Notices: An Implementation Guide, \"Prerequisites\" and Step 6; workbook Chapter 06, \"What the program gives you,\" \"What it leaves to you,\" \"The routing file,\" \"The payload,\" \"Runs and state,\" \"Lab 2,\" \"Federal requirements and evidence,\" \"Dangers,\" \"Checklist\"; Book 13, Appendix B (severity and tempo, the five-clause request chain); NIST SP 800-53 Rev. 5; FedRAMP KSIs.",
  "Kit: examples/provider-notices (Invoke-PnCollect.ps1, Invoke-PnRoute.ps1; powershell/ProviderNotices; config/routing.json with fictional teams; templates/routing.template.json; tests/fixtures/day1, day2; tests/Router.Tests.ps1), with the finding contract in examples/servicenow-sailpoint. Illustrative: tested against fixtures, not run against a live instance.",
  "Lab output: run November 12, 2026 with PowerShell 7.6 and Pester 5.9 in a scratch copy of examples/provider-notices with examples/servicenow-sailpoint beside it; the same output the module page shows. Output trimmed where the slides say so. Lab 2 not run by the authors.",
]);

finish(OUT);
