// Provider Notices learning path, Module 6: Google incidents and the maintenance gap — the module's narrated deck.
// Teaches docs/training/provider-notices/06-google-incidents-and-the-maintenance-gap.md, Learn-style: objectives, the
// concepts the page sends the learner to (the guide's Step 5 and its Dangers row; workbook Chapter 05, "What Google gives
// you," "What it leaves to you," "The code," "Dangers"; Book 15, Chapter 14, "Honest limits"), three "Try it" slides with
// the real Lab 1 commands and output (run November 12, 2026 in a scratch copy of examples/provider-notices, the same output
// the page shows), Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact comes
// from those pages, their footnotes or the kit; the deck adds none. Helpers: ../training-pn-module-1/pn.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pn-module-6/build.js \
//                      presentations/training-pn-module-6/Training_PN_Module_6.pptx
const P = require("../training-pn-module-1/pn.js")("Module 6: Google incidents and the maintenance gap");
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_PN_Module_6.pptx";
const M = "Training, Provider Notices, Module 6";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 6: Google incidents and the maintenance gap", "Provider Notices learning path · Gate G5 Google Cloud, with workbook Chapter 05",
    ["One category, INCIDENT  ·  The viewer role  ·  Products and locations  ·  The unverified call", "The gaps, written down  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence  ·  Check"]);
  notes(s,
`Welcome to Module 6 of the Provider Notices learning path: Google incidents and the maintenance gap. This is Gate 5 of the provider notices implementation guide, with Chapter 5 of the developer workbook. Google Cloud's Personalized Service Health lists the incidents relevant to a project or an organization. That's all it lists. So this gate is half collection and half honesty. In this module you'll read a fictional project's incidents, show that only one kind can ever arrive, and watch the kit refuse an organization-level call that nobody has verified. The gaps get written down with the ISSO, not papered over. It takes about forty-five minutes, with a lab on fixtures and a lab in a test project. The code is illustrative: tested against fixtures, not run against a live project.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "One category, and a gap in the federal packages");
  tag(s, "Why");
  const l = panel(s, "One", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "THE API", "One event category: INCIDENT", [
    "Service outage or degradation, relevant to the project or organization",
    "Planned maintenance and security notices aren't in it",
    "They reach a project by other channels, such as Essential Contacts",
  ], 13.5);
  const r = panel(s, "Aw", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "ASSURED WORKLOADS", "Not in the FedRAMP or IL packages", [
    "Listed under 25 regional packages, including US Data Boundary",
    "Not under FedRAMP Moderate, FedRAMP High, IL2, IL4, IL5, CJIS or ITAR",
  ], 13.5);
  callout(s, "Honest", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.red, "An empty list looks like good news: ",
    "so the gate records what can't arrive, and where a workload has nothing to read, with the ISSO.");
  sources(s, "Sources: Module 6; Chapter 05 (What Google gives you): Personalized Service Health Event resource; Assured Workloads supported products; Book 15, Ch 14: Google Cloud contacts.");
  notes(s,
`Why does Google Cloud need a module about a gap? Because of two facts. First, Personalized Service Health's event category has one value, incident, meaning a service outage or degradation. Planned maintenance isn't in it, and neither are security notices. Those reach a Google Cloud project by other channels, such as the contacts set in Essential Contacts. Second, Assured Workloads' supported-products page lists Personalized Service Health under twenty-five regional packages, including US Data Boundary, but not under FedRAMP Moderate, FedRAMP High, I L 2, I L 4, I L 5, C J I S or I T A R. A workload in one of those packages has no Personalized Service Health to read at all. Both gaps share a danger: an empty list looks like good news. So this gate collects what Google publishes, and writes down, with the ISSO, what can't arrive.`,
  `${M} — Unit "Introduction"; Unit 2: workbook Chapter 05 — "What Google gives you"; the guide — Step 5.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 6", [
    "Name the role and the one-time API enablement the reader needs",
    "Collect a project's incidents and read their products and locations",
    "Explain why planned maintenance isn't in this gate, and where it reaches the project",
    "Say which Assured Workloads packages don't include it, and what to record",
    "Show that the kit refuses an unverified call without -AllowUnverified",
  ], [
    "Module 1: the record and the six kinds",
    "Book 15, Chapter 14: \"Honest limits\"",
    "Lab 1: PowerShell 7.1+ with Pester 5; no project",
  ], 45);
  sources(s, "Sources: Module 6, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll name the role and the one-time A P I enablement the reader needs. You'll collect a project's incidents and read their products and locations. You'll explain why Google Cloud's planned maintenance isn't in this gate, and where it reaches the project instead. You'll say which Assured Workloads packages don't include Personalized Service Health, and what to record. And you'll show that the kit refuses an unverified call unless you pass allow unverified. Before you start, finish Module 1, on the record and the six kinds, and read the honest limits section of the provider notices chapter in Compliance Automation and Day-Two Operations. Lab 1 needs PowerShell 7.1 or later with Pester 5. No project.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Gate G5
{
  const s = content(SC, "Gate G5: enable, grant the viewer, then collect");
  tag(s, "What");
  const b = table(s, "Steps", 1.45, [2.6, 9.55], ["Step", "What the guide asks for"], [
    ["Enable, once", "The project owner enables servicehealth.googleapis.com on the project"],
    ["Grant", "roles/servicehealth.viewer, Personalized Service Health Viewer, to the reader's group on the project"],
    ["1. Cross-check", "gcloud service-health events list --project=<project-id> --location=global"],
    ["2. Collect", "Invoke-PnCollect.ps1 -Provider google; for an organization, scope organization and the role on it"],
    ["Validate", "Products and locations come from eventImpacts, and closed incidents are closed"],
  ], { fontSize: 12.5, limit: 4.9 });
  callout(s, "Scope", b + 0.25, 0.95, "FaLock", HEX.navy, "Grant at the project: ",
    "the viewer role at the organization for a project read gives more read scope than needed, unless the settings' scope is organization.");
  sources(s, "Sources: Module 6, Unit 1; the guide, Step 5: Google Cloud, List events; Service Health roles and permissions; gcloud service-health events list.");
  notes(s,
`Unit 1 is the guide's Step 5. The project owner does two things once. Enable the Service Health A P I on the project, and grant the reader's group the Personalized Service Health Viewer role. Then two steps. One: cross-check the list with Google's own command, G cloud service health events list, for the project, in the global location. Two: collect, with the provider set to Google. For a whole organization, set the settings file's Google scope to organization, and grant the role on the organization. Otherwise, grant it at the project: the viewer role on the organization, for a project read, is more read scope than the reader needs. The gate validates when products and locations come from the event's impacts, and closed incidents are closed. The gate owner is the Google Cloud project owner.`,
  `${M} — Unit 1: the guide — Step 5, "Validate (G5 Google Cloud)"; workbook Chapter 05 — "Dangers."`);
}

// ================================================================== 5 The reader
{
  const s = content(SC, "The incident reader: what Google leaves to you");
  tag(s, "What");
  const b = table(s, "Leave", 1.45, [4.0, 8.15], ["Google's material, as published", "What the kit adds"], [
    ["One category, INCIDENT", "Every Google notice is an incident; the gap is written down, not papered over"],
    ["Impacts as product and location objects", "Products and locations become the record's services and regions"],
    ["Updates over time, the description sometimes empty", "The latest update's description when the event has none"],
    ["No field that says action is required", "No action rule for Google: an open incident that names resources routes by the agency's rule"],
    ["A REST response object, or gcloud's bare list", "Both accepted"],
  ], { fontSize: 12.5, limit: 4.9 });
  line(s, "Code", "A CLOSED state closes the record; detailedCategory and relevance are kept as the provider's severity. The cloud is global.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 6, Unit 2; Chapter 05 (What it leaves to you; The code): Personalized Service Health REST reference, Event resource.");
  notes(s,
`Unit 2 is the reader. Google's Event resource has the one category, a state, a detailed category, relevance, impacts and updates. Here's what Google leaves to you, and what the kit adds. With one category, every Google notice is an incident, and the gap is written down in the guide, the chapter and the ISSO's record. Impacts come as product and location objects; they become the record's services and regions. An event's description is sometimes empty, so the kit takes the latest update's description. There's no field that says action is required, and the kit adds no action rule for Google: an open incident that names resources routes by the agency's own routing, in Module 7. Google's A P I returns a response object and G cloud a bare list, and the kit accepts both. A closed state closes the record, and the detailed category and relevance are kept as the provider's severity. The kit has no separate government endpoint for Personalized Service Health; the cloud is global.`,
  `${M} — Unit 2: workbook Chapter 05 — "What Google gives you," "What it leaves to you," "The code."`);
}

// ================================================================== 6 Unverified call and gaps
{
  const s = content(SC, "A call nobody verified isn't run; the gaps go on file");
  tag(s, "How");
  const w = 5.95, g = 0.25;
  const p1 = panel(s, "Unv", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "THE ORGANIZATION CALL", "Verified on REST, not in gcloud", [
    "Google's REST reference documents the organization call",
    "The gcloud flags for it weren't read, so config/calls.json marks it unverified",
    "The live invoker refuses it without -AllowUnverified",
  ], 12.5);
  const p2 = panel(s, "Gap", 0.6 + w + g, 1.45, w, null, HEX.red, HEX.redTint, "THE GAPS, WITH THE ISSO", "Design guidance", [
    "No planned maintenance through this API, for every project",
    "Any workload in a FedRAMP or IL package: nothing to read",
    "The ISSO decides the compensating channel",
  ], 12.5);
  callout(s, "Danger", Math.max(p1, p2) + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "The guide's danger: ",
    "Google maintenance assumed covered. A maintenance window lands with nobody told; the gap is in the record, the digest's provider table and the ISSO's file.");
  sources(s, "Sources: Module 6, Units 1 and 2; Chapter 05 (What it leaves to you; Dangers); the guide (Step 5, interim path; Dangers); Book 15, Ch 14 (Honest limits).");
  notes(s,
`Two guards make this gate honest. First, the organization call. Google's REST reference documents it, but the G cloud flags for it weren't read. So the kit's call list marks it unverified, and the live invoker refuses to run it unless you pass allow unverified. The kit doesn't run a command on a guess. That's the guide's interim path for an organization. Second, the gaps. Every project records that Google's planned maintenance doesn't come through this A P I. And any workload in an Assured Workloads FedRAMP or I L package records that it has no Personalized Service Health to read; the ISSO decides the compensating channel. The guide lists the danger plainly: Google maintenance assumed covered, and a maintenance window lands with nobody told. The guard is the gap itself, in the record, in the digest's provider table and in the ISSO's file. Until the A P I carries maintenance, it reaches the agency by the contacts it sets.`,
  `${M} — Unit 1: the guide — Step 5, "Interim path," and "Dangers"; Unit 2: workbook Chapter 05 — "What it leaves to you," "Dangers"; Book 15, Chapter 14 — "Honest limits."`);
}
endModule(SC);

// ================================================================== 7 Try it: role and collect
{
  const s = content(SL, "Try it: the viewer role, and two incidents");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 to 3, in examples/provider-notices (PowerShell 7)",
    "$ Get-PnRequiredPermission -Provider google | Format-List Call, Permissions, Verified",
    "Call        : google-events",
    "Permissions : roles/servicehealth.viewer (Personalized Service Health Viewer) on the project: servicehealth.events.list",
    "Verified    : True",
    "Call        : google-organization-events",
    "Permissions : roles/servicehealth.viewer on the organization: servicehealth.organizationEvents.list",
    "Verified    : False",
    "$ ./Invoke-PnCollect.ps1 ... -FixturePath tests/fixtures/day1 -Provider google -AsOf 2026-11-09T12:00:00Z",
    "google   global             2      1        0  incident 2",
    "$ Import-Csv out/google/notices.csv | Format-Table kind, status, title, services, regions",
    "incident open   Cloud SQL connection errors in us-east4 Google Cloud SQL us-east4",
    "incident closed Cloud Storage latency in us-central1    Cloud Storage    us-central1",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10 });
  line(s, "Two", "Two incidents, one open; none needs action by Google's word, because Google has no such field.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 1 to 3; examples/provider-notices: config/calls.json, tests/fixtures/day1 (fictional).");
  notes(s,
`Try it. Lab 1 runs in the provider notices folder of the examples, in PowerShell 7, for a fictional project, contoso example prod. Nothing signs in or sends a request. Step one lists what Google Cloud needs. Two calls. The project call needs the Personalized Service Health Viewer role on the project, for the events list permission, and it's verified. The organization call needs the same role on the organization, and it isn't verified. Step two collects Google Cloud from the day-one fixtures: two notices, one open, none needing action, both incidents. Step three reads the records. Cloud SQL connection errors in u s east four is open, with its product and its location. Cloud Storage latency in u s central one is closed. None needs action by Google's word, because Google has no field that says so; an open incident that names resources is routed by the agency's own rules.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 3.`);
}

// ================================================================== 8 Try it: second week, one kind
{
  const s = content(SL, "Try it: a second week, and still one kind");
  tag(s, "How");
  const c = code(s, "Week", 0.6, 1.45, 12.15, [
    "# Step 4: collect the second week (-FixturePath tests/fixtures/day2 -AsOf 2026-11-16T12:00:00Z)",
    "google   global             2      0        0  incident 2",
    "kind     status title                                   windowEnd",
    "incident closed Cloud SQL connection errors in us-east4 2026-11-09T13:00:00Z",
    "incident closed Cloud Storage latency in us-central1    2026-11-04T13:20:00Z",
    "# Step 5: see what kinds Google can send, across both weeks",
    "$ Import-Csv out/google/notices.csv, out/google-day2/notices.csv | Group-Object kind | Format-Table Name, Count",
    "Name     Count",
    "----     -----",
    "incident     4",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED)", pt: 10.5 });
  line(s, "Kind", "One kind across both weeks. Maintenance, retirements and security notices never come through this API.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 4 and 5; Chapter 05 (What Google gives you): Personalized Service Health Event resource.");
  notes(s,
`Step four collects the second week, as of November sixteenth. The same two incidents, and now both are closed. The Cloud SQL incident ended on November ninth, at thirteen hundred U T C, an hour after the first week's read saw it open. That's the honest limit of a weekly read: it sees an incident after the fact. The weekly read is for owning and closing notices, not for detecting incidents, which still reach the desk as calls and alerts first. Step five groups both weeks by kind. Four records, and every one an incident. That's not the fixtures being thin. It's the A P I: its category has one value. Maintenance, retirements and security notices never come through this A P I, whatever the project's estate looks like, and that's the gap you write down.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 4 and 5; Book 15, Chapter 14 — "Honest limits."`);
}

// ================================================================== 9 Try it: unverified refused
{
  const s = content(SL, "Try it: the unverified call is refused");
  tag(s, "How");
  const c = code(s, "Org", 0.6, 1.45, 12.15, [
    "# Step 6: ask the live invoker for the organization call",
    "$ $s = Read-PnSettings -Path tests/fixtures/settings.lab.json",
    "$ $s.providers.google.scope = 'organization'; $s.providers.google.organization = '123456789012'",
    "$ Invoke-PnCall -Invoker (New-PnLiveInvoker -Settings $s -SkipContextCheck) -CallId google-organization-events",
    "Exception: Call google-organization-events isn't verified against its provider's documentation (The gcloud",
    "  group organization-events is listed on the gcloud beta reference; the exact GA flags for it weren't read.",
    "  The REST call is verified). Pass -AllowUnverified to run it.",
    "# Step 7: build the project command without running it",
    "service-health events list --project=contoso-example-prod --location=global --format=json",
    "# Step 8: run this chapter's tests        PassedCount 8, FailedCount 0",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (WRAPPED)", pt: 10.5 });
  line(s, "Before", "The refusal comes before gcloud starts. Then Remove-Item -Recurse -Force out.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 6 to 8; examples/provider-notices: config/calls.json; tests (Collectors.Tests.ps1, Live.Tests.ps1).");
  notes(s,
`Step six asks the live invoker for the organization call. You set the Google scope to organization, give a fictional organization number, and build a live invoker, skipping the sign-in check because nothing will run. The kit refuses before G cloud starts. The call isn't verified against its provider's documentation: the G cloud group for organization events is listed on the beta reference, and its exact flags weren't read; the REST call is verified. Pass allow unverified to run it. That's a decision someone makes on purpose, in a test project, not a default. Step seven builds the project command without running it: service health events list, for the project, in the global location, as JSON. That's the verified call. Step eight runs this chapter's tests: eight pass, none fail. Then delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 6 to 8.`);
}

// ================================================================== 10 Lab 2
{
  const s = content(SL, "Lab 2: a test project, and the gaps recorded");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A Google Cloud test project, never production, its project owner, and a Google group for the reader"],
    ["Set up", "Enable the API and grant the viewer role; sign in as the reader"],
    ["Cross-check", "Google's command against the collection; no incidents is a valid result"],
    ["Record", "Whether the project is in an Assured Workloads FedRAMP or IL package; in every case, that maintenance doesn't come through"],
    ["Back it out", "Remove the role binding and delete the run; the API stays enabled unless the project owner decides otherwise"],
  ], { fontSize: 12.5, limit: 4.9 });
  callout(s, "NotRun", b + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 05, Lab 2, which has the exact commands.");
  sources(s, "Sources: Module 6, \"Exercise: Lab 2\"; Chapter 05 (Lab 2: a test project): gcloud auth login; gcloud projects remove-iam-policy-binding.");
  notes(s,
`Lab 2 reads a real test project. You need a Google Cloud test project, never production, its project owner, and a Google group for the reader. Enable the A P I, grant the viewer role, and sign in as the reader. Then cross-check Google's own command against the collection. The project may have no incidents at all, and that's a valid result. Then the part that makes this gate different: record the gaps with the ISSO. Whether the project is in an Assured Workloads FedRAMP or I L package, and in every case, that Google's planned maintenance doesn't come through this A P I. To back it out, step four removes the role binding and deletes the run. It leaves the A P I enabled, unless the project owner decides otherwise. The authors haven't run Lab 2. The workbook's Chapter 5 has the exact commands.`,
  `${M} — Unit "Exercise: Lab 2, a test project"; workbook Chapter 05 — "Lab 2: a test project."`);
}
endModule(SL);

// ================================================================== 11 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G5");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.6, 3.0, 5.55], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["SA-9 c", "KSI-SCR-MIT, KSI-SCR-MON", "Get-PnRequiredPermission -Provider google; the role binding"],
    ["SA-9 c; SI-5 a", "KSI-SCR-MIT, KSI-SCR-MON", "raw/google.json, notices.json, manifest.json"],
    ["SA-9 c", "KSI-SCR-MON", "A call nobody verified isn't run"],
    ["SA-9 c; RA-3 f", "KSI-SCR-MON, KSI-SCR-MIT", "The gaps (no maintenance; not in the FedRAMP or IL packages), written down with the ISSO"],
  ], { fontSize: 12, limit: 4.8 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 6, Introduction; Chapter 05 (Federal requirements and evidence): NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Gate 5 supports NIST special publication eight hundred fifty-three S A nine, part c, monitoring external service providers on an ongoing basis, and S I five, part a, receiving security alerts and advisories. And recording the gaps supports R A three, part f: updating the risk assessment when there are significant changes to the environment of operation. The evidence is the permission list and the role binding; the raw Google response, the notices and the manifest; the refusal of a call nobody verified; and the gaps, no maintenance through the A P I and no Personalized Service Health in the FedRAMP or I L packages, written down with the ISSO. The gate's output is evidence for these controls. Your organization still sets their parameters, and the assessor decides whether each is satisfied. K S I's are FedRAMP twenty X indicators for cloud service providers; the agency lines its evidence up with them, and doesn't report them itself.`,
  `${M} — Unit "Introduction" (the federal requirement); workbook Chapter 05 — "Federal requirements and evidence."`);
}

// ================================================================== 12 Check
{
  const s = check(SS, "Check yourself: two questions on Google Cloud", [
    { q: "Why does Gate G5 cover incidents only?", options: ["a. The kit filters out everything else", "b. The API's event category has one value, INCIDENT; planned maintenance isn't in it", "c. The viewer role can't see maintenance"] },
    { q: "A workload is in an Assured Workloads FedRAMP Moderate package. What does the agency do?", options: ["a. Reads Personalized Service Health as usual", "b. Records the gap with the ISSO, and relies on the provider's other channels", "c. Nothing; an empty list means no incidents"] },
  ], "1 b: it's the API, not the kit. 2 b: Personalized Service Health isn't in that package, so there's nothing to read.");
  sources(s, "Sources: Module 6, \"Knowledge check,\" questions 2 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: why does Gate 5 cover incidents only? The answer is b. The A P I's event category has one value, incident, and planned maintenance isn't in it. It isn't the kit filtering anything, and it isn't the role. Second: a workload is in an Assured Workloads FedRAMP Moderate package. What does the agency do? The answer is b. Record the gap with the ISSO. Personalized Service Health isn't among that package's supported products, so the project has nothing to read, and relies on the provider's other channels. Answer c is the trap this module is about: an empty list doesn't mean no incidents. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 3; "Check your answers."`);
}

// ================================================================== 13 Summary
{
  const s = content(SS, "Summary, and next: Module 7, routing to owners");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Read the reader's role",
    "Collected two incidents, then saw both close",
    "Showed that only one kind ever arrives",
    "Watched the kit refuse a call nobody verified",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 7: Routing to owners", [
    "Gate G6, with workbook Chapter 06",
    "Every provider's notices, to an owner",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "raw/google.json, notices.json, notices.csv and manifest.json, dated; the role binding; and the written gaps.");
  sources(s, "Sources: Module 6, \"Summary\"; Module 7; Chapter 05 (Checklist).");
  notes(s,
`To sum up. You read the reader's role, collected two incidents and then saw both close, showed that only one kind ever arrives, and watched the kit refuse a call nobody verified. The evidence an ISSO keeps for Gate 5 is the raw Google response, the notices as JSON and as a spreadsheet file, and the manifest, all dated; the role binding; and the written gaps: no planned maintenance through the A P I, and any workload in a package that doesn't include Personalized Service Health. Before you ship, work through the chapter's checklist. That finishes the five providers. Next is Module 7: routing to owners. It takes the notices every provider produced, and gives the ones that need action an owner, a severity and a due date, as typed tasks in the service desk's front door.`,
  `${M} — Unit "Summary"; Module 7; workbook Chapter 05 — "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 6 deck", [
  "Module page: docs/training/provider-notices/06-google-incidents-and-the-maintenance-gap.md (Provider Notices learning path, Module 6): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "What the module sends the learner to: Provider Notices: An Implementation Guide, Step 5 and \"Dangers\"; workbook Chapter 05, \"What Google gives you,\" \"What it leaves to you,\" \"The code,\" \"Lab 2,\" \"Federal requirements and evidence,\" \"Dangers,\" \"Checklist,\" and their footnotes: Personalized Service Health REST reference (events list, Event resource); List events; Service Health roles and permissions; gcloud references; Assured Workloads supported products; NIST SP 800-53 Rev. 5; FedRAMP KSIs. Book 15, Chapter 14, \"Honest limits\" and Google Cloud contacts.",
  "Kit: examples/provider-notices (Invoke-PnCollect.ps1; powershell/ProviderNotices; config/calls.json; tests/fixtures/settings.lab.json, day1, day2; tests/Collectors.Tests.ps1, Live.Tests.ps1). Fictional project contoso-example-prod. Illustrative: tested against fixtures, not run against a live project.",
  "Lab output: run November 12, 2026 with PowerShell 7.6 and Pester 5.9 in a scratch copy of examples/provider-notices; the same output the module page shows. Long commands are wrapped and output trimmed where the slides say so. Lab 2 not run by the authors.",
]);

finish(OUT);
