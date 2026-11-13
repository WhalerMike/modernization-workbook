// Provider Notices learning path, Module 1: Why provider notices go unread — the module's narrated deck.
// Teaches docs/training/provider-notices/01-why-provider-notices-go-unread.md, Learn-style: objectives, the concepts the
// page sends the learner to (Book 15, Chapter 14; the guide's track at a glance and five providers compared; workbook
// Chapter 01, "The record"), three "Try it" slides with the real Lab 1 commands and output (run November 12, 2026 in a
// scratch copy of examples/provider-notices, the same output the page shows), the federal requirement and evidence, a
// two-question check, and the summary. Every fact comes from those pages, their footnotes or the kit; the deck adds none.
// Helpers: ./pn.js (the Microsoft Automation training decks' shared.js, renamed for this path).
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pn-module-1/build.js \
//                      presentations/training-pn-module-1/Training_PN_Module_1.pptx
const P = require("./pn.js")("Module 1: Why provider notices go unread");
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_PN_Module_1.pptx";
const M = "Training, Provider Notices, Module 1";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 1: Why provider notices go unread", "Provider Notices learning path · Before the gates: the track at a glance, with workbook Chapter 01's record",
    ["Where notices land  ·  The six kinds  ·  Who owns each kind  ·  Notice to task to closure", "One record, five providers  ·  Try it: Lab 1  ·  Evidence  ·  Check"]);
  notes(s,
`Welcome to Module 1 of the Provider Notices learning path: why provider notices go unread. Every cloud provider tells the agency, in writing and ahead of time, what it will change, retire or patch in the agency's own tenant, account, tenancy or project. The notices land in a portal or one person's inbox, and nobody owns them. This path teaches you to read each provider's notices from its own record, hold every notice as one record, give the ones that need action an owner and a due date, and keep the evidence. It follows the seven gates of the provider notices implementation guide, with the developer workbook Building Provider Notices. This first module comes before the gates. It takes about forty-five minutes, with a lab on fixtures. The code is illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Every channel ends at a person or a page, not a queue");
  tag(s, "Why");
  const b = table(s, "Where", 1.45, [3.1, 9.05], ["Provider", "Where its notices go"], [
    ["Azure", "Service Health in the portal; nobody is told unless someone created a Service Health alert, and it fires only for the subscriptions, services and regions its rule names"],
    ["Microsoft 365", "The Message center: each administrator's view is their own, and the weekly digest goes to each administrator's own primary email"],
    ["Oracle Cloud Infrastructure", "Email to the tenancy administrator; anyone else only through email preferences or announcement subscriptions"],
    ["AWS", "The root user's address, plus up to three alternate contacts: billing, operations and security"],
    ["Google Cloud", "The contacts set in Essential Contacts, by category; a category with no contact falls back to principals chosen by IAM role"],
  ], { fontSize: 12, limit: 5.3 });
  line(s, "Pattern", "No owner, no due date, no way to show it was dealt with. A retirement a year ahead is easy to agree with and easy to miss.", b + 0.2, 0.7, 13.5);
  sources(s, "Sources: Book 15, Ch 14 (Why provider notices go unread): Azure Service Health portal, FAQ; Message center; OCI Console Announcements; AWS contacts; Google Cloud contacts.");
  notes(s,
`Why do provider notices go unread? Providers don't hide them. Azure shows them in Service Health, but nobody is told unless someone created a Service Health alert, and Microsoft's own F A Q gives a rule that left out the affected subscription as a reason an alert never arrived. Microsoft 365 posts them in the Message center, where each administrator's view is their own, and the weekly digest goes to each administrator's own primary email. Oracle Cloud Infrastructure emails the tenancy administrator. AWS writes to the root user's address and up to three alternate contacts. And Google Cloud writes to its Essential Contacts. Every one of those channels ends at a person or a page, not a queue. The notice carries no owner, no due date and no way to show it was dealt with. Attackers imitate provider email, too. And a retirement announced a year ahead is easy to agree with, and easy to miss on the day.`,
  `${M} — Unit "Introduction"; Unit 1: Book 15, Chapter 14 — "Why provider notices go unread."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Explain why each provider's notices end at a person or a page, and why email stays an early warning",
    "Name the six kinds of notice and who owns each",
    "Read the record's fields, and tell a provider's action date from one the kit's rule inferred",
    "Show that a second read of the same notices changes no fingerprint",
  ], [
    "None from this path: this is the first module",
    "Optional: Book 15, Chapter 03, which routes Microsoft's service health email today",
    "Lab 1: PowerShell 7.1+ with Pester 5, and a copy of the repository; no tenant",
  ], 45);
  sources(s, "Sources: Module 1, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll explain why each provider's notices end at a person or a page, and why email stays an early warning, not the system of record. You'll name the six kinds of notice, and who owns each one. You'll read the record's fields, and tell a provider's own action date from one the kit's rule inferred. And you'll show that a second read of the same notices changes no fingerprint. There's nothing to take first: this is the first module. If you have time, read the intake, triage and routing chapter of Compliance Automation and Day-Two Operations, which routes Microsoft's service health email today and never acts on an email alone. Lab 1 needs PowerShell 7.1 or later with Pester 5, and a copy of the repository. No tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Six kinds
{
  const s = content(SC, "Six kinds of notice, and what each asks of you");
  tag(s, "What");
  const b = table(s, "Kinds", 1.45, [1.9, 4.6, 5.65], ["Kind", "What the provider is saying", "What it asks of the agency"], [
    ["Maintenance", "Work is scheduled that may affect availability", "Check the window against the systems that depend on it; tell the desk and users"],
    ["Retirement", "A feature, version or resource type is ending, with a date", "Plan and approve the migration before the date; review the contingency plan"],
    ["Advisory", "Information or a recommendation, often with no deadline", "Decide whether it applies, and record the decision"],
    ["Security", "A security-related notice about the agency's resources or account", "Assess the exposure and act within the security response window"],
    ["Change", "A change the agency must plan for, or act on to avoid disruption", "Treat it as a proposed change: impact analysis, then the change process"],
    ["Incident", "Something is broken now", "Correlate with open tickets, post a known issue, and activate contingency if warranted"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "Google", "Not every provider has every kind: Google Cloud's Personalized Service Health reports incidents only.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, Unit 1; Book 15, Ch 14 (The six kinds of notice): Azure Service Health portal; Message center; OCI Announcement model; AWS Health concepts.");
  notes(s,
`Each provider names its notices differently. The program sorts them into six kinds, because the kind decides who owns the notice and what it asks of the agency. Maintenance: work is scheduled that may affect availability, so check the window against the systems that depend on it. Retirement: a feature, version or resource type is ending, with a date, so plan and approve the migration before that date, and review the contingency plan if a system depends on it. Advisory: information or a recommendation, often with no deadline; decide whether it applies, and record the decision. Security: assess the exposure and act within the security response window. Change: treat it as a proposed change to the system, with an impact analysis and then the change process. And incident: something is broken now. Not every provider has every kind. Google Cloud's Personalized Service Health reports incidents only: its event category has one value, for service outage or degradation.`,
  `${M} — Unit 1: Book 15, Chapter 14 — "The six kinds of notice."`);
}

// ================================================================== 5 Owners
{
  const s = content(SC, "Who owns each kind: the roles the program already has");
  tag(s, "Who");
  const b = table(s, "Own", 1.45, [1.9, 5.35, 4.9], ["Kind", "Owns it (decides what happens)", "Does the work"], [
    ["Incident", "The service desk supervisor", "The service desk; the platform owner if anything must change"],
    ["Maintenance", "The platform owner of the affected platform", "The platform owner; the desk prepares for the calls"],
    ["Retirement", "The system owner of each affected system, who decides the schedule", "The platform owner, through a normal change"],
    ["Change", "The platform owner proposes; the change advisory board authorizes", "The platform owner"],
    ["Security", "Security operations", "Security operations, with the platform owner for any fix"],
    ["Advisory", "The platform owner of the platform it names", "The platform owner records whether it applies"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Unnamed", b + 0.2, 1.0, "FaUserXmark", HEX.amber, "Not yet specified: ",
    "who receives each provider's notices at the source, and who reviews the contingency plan when a notice names a system's resources.");
  sources(s, "Sources: Module 1, Unit 1; Book 15, Ch 14 (Who owns each kind), program design; Book 15, Ch 10.");
  notes(s,
`Who owns each kind? The Compliance Automation and Day-Two Operations book uses the roles it already has, and adds none. An incident belongs to the service desk supervisor, as service health is routed today. Maintenance belongs to the platform owner of the affected platform: the cloud platform owner for Azure, AWS, Google Cloud and each O C I tenancy, and the collaboration owner for Microsoft 365. A retirement belongs to the system owner of each affected system, who decides the schedule, and the platform owner does the work through a normal change. A change is proposed by the platform owner and authorized by the change advisory board, after the ISSO's security impact analysis. Security notices belong to security operations. And an advisory belongs to the platform owner of the platform it names. Two decisions have no owner yet, and the book doesn't invent one: who receives each provider's notices at the source, and who reviews the contingency plan when a notice names a system's resources.`,
  `${M} — Unit 1: Book 15, Chapter 14 — "Who owns each kind" (program design).`);
}

// ================================================================== 6 Notice to closure
{
  const s = content(SC, "From notice to task to closure on the re-read");
  tag(s, "How");
  const w = 5.95, g = 0.25;
  const p1 = panel(s, "Collect", 0.6, 1.45, w, null, HEX.navy, HEX.navyTint, "COLLECT FROM THE PROVIDER", null, [
    "A read-only identity, at least weekly, through each provider's own interface",
    "Each notice one record: kind, action required and by when, resources",
  ], 12.5);
  const p2 = panel(s, "Route", 0.6 + w + g, 1.45, w, null, HEX.amber, HEX.amberTint, "ROUTE BY RULES, IN ORDER", null, [
    "Security, retirement, maintenance naming our resources, open incidents, then any other action required",
    "First match wins; no match goes to the digest",
  ], 12.5);
  const top2 = Math.max(p1, p2) + 0.2;
  const p3 = panel(s, "Task", 0.6, top2, w, null, HEX.teal, HEX.tealTint, "A TYPED TASK IN THE FRONT DOOR", null, [
    "An owner, a severity and response window, and the provider's own date kept separately",
    "Keyed to the provider's notice ID: no second task",
  ], 12.5);
  const p4 = panel(s, "Close", 0.6 + w + g, top2, w, null, HEX.red, HEX.redTint, "CLOSE ON THE RE-READ", null, [
    "Only when the next collection shows the notice closed or our resources no longer affected",
    "A provider closing its notice isn't enough by itself",
  ], 12.5);
  line(s, "Email", "The provider's own record, read from its API, is the source of truth. Email stays an early warning.", Math.max(p3, p4) + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, Unit 1; Book 15, Ch 14 (From notice to task to closure); Book 13, App. B (severity and tempo; the five-clause request chain).");
  notes(s,
`Here's the loop the rest of the path builds. Collect from the provider, not the mailbox: a read-only identity reads each provider's notices at least weekly, through the provider's own interface, and each notice becomes one record. Route by rules, in order: security advisories, then retirements, then maintenance that names the agency's resources, then open incidents that name them, then anything else marked as needing action. The first match wins, and a notice that matches none goes to the weekly digest. A notice that needs action becomes a typed task in the I T S M front door, not a second queue, with an owner, a severity and response window, and the provider's own date kept separately. It's keyed to the provider's notice I D, so an unchanged notice never makes a second task. And a task closes only on the re-read: when the next collection shows the notice closed, or the agency's resources no longer affected. A retirement can close on the provider's side while the agency still runs the retired version.`,
  `${M} — Unit 1: Book 15, Chapter 14 — "From notice to task to closure"; "Why provider notices go unread."`);
}

// ================================================================== 7 The record
{
  const s = content(SC, "One record for five providers: fmp-provider-notice/1");
  tag(s, "What");
  const b = table(s, "Rec", 1.45, [3.9, 8.25], ["Field", "What it holds"], [
    ["noticeId", "<provider>:<sourceId>, the key the router de-duplicates on"],
    ["kind, status", "One of the six kinds; open or closed"],
    ["windowStart, windowEnd", "The impact window, in UTC"],
    ["services, regions, resources", "What it names, sorted and de-duplicated"],
    ["actionRequired, actionRequiredBy, actionBasis", "Whether action is needed, by when, and who said so: provider: <field> or rule: <the kit's rule>"],
    ["firstSeen", "When the kit first read it"],
    ["fingerprint", "SHA-256 of the record without firstSeen and fingerprint"],
  ], { fontSize: 12, limit: 5.3 });
  line(s, "Fp", "A provider's edit changes the fingerprint; reading the same notice again a week later doesn't.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, Unit 2; workbook Chapter 01 (The record); examples/provider-notices/schema/notice.schema.json.");
  notes(s,
`Unit 2 is the answer: one record for every provider's notice, called f m p provider notice, version one, defined by a JSON schema in the kit. The notice I D is the provider and the provider's own I D, and it's the key the router de-duplicates on. The kind is one of the six, and the status is open or closed. The window is the impact window, always in U T C. Services, regions and resources are what the notice names. Then three fields that matter most: whether action is required, by when, and the action basis, which says who said so. Either the provider said it, in a field the record names, or a rule of the kit's inferred it, and the record states the rule. First seen is when the kit first read the notice. And the fingerprint is a SHA-256 of the record without first seen and the fingerprint itself. So a provider's edit changes the fingerprint, and reading the same notice again a week later doesn't. That's how the router tells a changed notice from one it has already seen.`,
  `${M} — Unit 2: workbook Chapter 01 — "The record."`);
}

// ================================================================== 8 Five providers compared
{
  const s = content(SC, "Five providers compared: who says action is required");
  tag(s, "What");
  const b = table(s, "Cmp", 1.45, [2.9, 4.5, 4.75], ["Provider", "Where notices live", "Says action is required"], [
    ["Azure", "Service Health, through Azure Resource Graph", "No field the kit reads; the kit's rule for retirements and security advisories"],
    ["Microsoft 365", "Message center and service health, through Graph", "actionRequiredByDateTime"],
    ["Oracle Cloud Infrastructure", "The Announcements service", "ACTION_REQUIRED, ACTION_REQUIRED_BY"],
    ["AWS", "The AWS Health API", "actionability"],
    ["Google Cloud", "Personalized Service Health", "No; and no planned maintenance: one category, INCIDENT"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Basis", b + 0.25, 0.95, "FaScaleBalanced", HEX.navy, "Where the provider doesn't say: ",
    "the kit applies a stated rule, and the record's actionBasis begins with rule:, so nobody mistakes it for the provider's.");
  sources(s, "Sources: Module 1, Unit 2; the guide (track at a glance; five providers compared): Resource Graph samples for Service Health; Graph service communications API; AWS Health concepts.");
  notes(s,
`The guide compares the five providers, and one row matters most here: who says action is required. Azure's Service Health, read through Azure Resource Graph, has no field the kit reads that says so. So the kit applies a stated rule: a retirement is action required, due at the advisory's end time, and a security advisory is action required with no date, for the ISSO to review. Microsoft 365 has its act-by date field. Oracle Cloud Infrastructure has its action required type and action required by date. AWS has its actionability field. And Google Cloud's Personalized Service Health doesn't say, and has no planned maintenance at all: its event category has one value, incident. Wherever the provider doesn't say, the record's action basis begins with rule, and states the rule. Nobody mistakes the kit's inference for the provider's own word.`,
  `${M} — Unit 2: the guide — "The track at a glance," "The five providers compared."`);
}
endModule(SC);

// ================================================================== 9 Try it: collect
{
  const s = content(SL, "Try it: collect five providers into one list");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/provider-notices (PowerShell 7)",
    "$ Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1",
    "$ ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 \\",
    "    -AsOf 2026-11-09T12:00:00Z -OutputPath out/day1",
    "Collected as of 2026-11-09T12:00:00Z (Fixture mode, environment lab)",
    "",
    "Provider Cloud        Notices   Open   Action  By kind",
    "azure    AzureCloud         5      5        2  advisory 1, incident 1, maintenance 1, retirement 1, security 1",
    "m365     gcc                6      5        2  advisory 3, change 1, incident 1, retirement 1",
    "oci      oc1                4      3        1  advisory 1, change 1, incident 1, maintenance 1",
    "aws      aws                5      4        3  incident 1, maintenance 1, retirement 2, security 1",
    "google   global             2      1        0  incident 2",
    "",
    "22 notices, each valid against schema/notice.schema.json. Written to out/day1: notices.json, notices.csv,",
    "  raw/, manifest.json",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (WRAPPED)", pt: 10.5 });
  line(s, "Cloud", "Five providers, five shapes, one list. Every provider names its own cloud; there is no default.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" step 1; examples/provider-notices: Invoke-PnCollect.ps1, tests/fixtures/day1 (fictional).");
  notes(s,
`Try it. Lab 1 runs in the provider notices folder of the examples, in PowerShell 7, against two fictional weeks of notices from every provider. Nothing signs in to anything or sends a request. Step one imports the kit's module and collects every provider from the day-one fixtures, as of November ninth, 2026. Five from Azure, six from Microsoft 365 in the G C C cloud, four from Oracle Cloud Infrastructure, five from AWS and two from Google Cloud. Twenty-two notices in all, each valid against the schema, written as JSON and as a spreadsheet file, with the raw responses and a manifest. Notice the cloud column. Every provider names its own cloud in the settings, and there is no default. Five providers, five shapes, one list.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 1.`);
}

// ================================================================== 10 Try it: kinds and action basis
{
  const s = content(SL, "Try it: count the kinds, and see who said act");
  tag(s, "How");
  const c = code(s, "Basis", 0.6, 1.45, 12.15, [
    "# Step 2: count the notices by kind     advisory 5, change 2, incident 6, maintenance 3, retirement 4, security 2",
    "# Step 3: see who said each one needs action (output)",
    "aws    retirement  2026-12-01T00:00:00Z  provider: actionability ACTION_REQUIRED",
    "aws    security    no date               provider: actionability ACTION_REQUIRED",
    "aws    retirement  2027-01-15T00:00:00Z  rule: AWS scheduled change whose event type code names a retirement; ...",
    "azure  retirement  2027-09-30T00:00:00Z  rule: Azure retirement (HealthAdvisory, EventSubType Retirement); ...",
    "azure  security    no date               rule: Azure security advisory; the ISSO reviews every one",
    "m365   retirement  2027-01-31T08:00:00Z  provider: actionRequiredByDateTime",
    "m365   change      no date               rule: Message center category preventOrFixIssue",
    "oci    change      2026-12-15T00:00:00Z  provider: announcementType ACTION_REQUIRED",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Eight", "Eight need action: four times the provider said so, four times a kit rule did. With no provider date, the kit makes none up.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 2 and 3; Book 15, Ch 14 (Who owns each kind).");
  notes(s,
`Step two counts the notices by kind, across providers: five advisories, two changes, six incidents, three maintenance windows, four retirements and two security notices. The kind decides the owner, so the four retirements go to each affected system's owner, and the two security notices to security operations. Step three asks who said each one needs action. Eight notices do. Four times the provider said so: two from AWS's actionability field, one from Microsoft 365's act-by date, and one from Oracle's action required type. And four times a kit rule did: an AWS scheduled change whose code names a retirement, the Azure retirement, due at the advisory's end, the Azure security advisory, which the ISSO reviews, and a Microsoft 365 post in the prevent or fix issues category. The record says which, every time. And where the provider gave no date, the kit makes none up: it says no date.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 2 and 3.`);
}

// ================================================================== 11 Try it: retirement, fingerprints, tests
{
  const s = content(SL, "Try it: a second read changes no fingerprint");
  tag(s, "How");
  const c = code(s, "Fp", 0.6, 1.45, 12.15, [
    "# Step 4: read the Azure retirement in full (Format-List, trimmed)",
    "noticeId         : azure:RT5J-6KL",
    "actionRequiredBy : 2027-09-30T00:00:00Z",
    "actionBasis      : rule: Azure retirement (HealthAdvisory, EventSubType Retirement); due at the advisory end time",
    "resources        : {/subscriptions/.../publicipaddresses/pip-legacy01}",
    "fingerprint      : 02f776686826535d3b3709afe9090e6a16346e1bd34f48c794b9cbfff7cf4f7d",
    "# Step 5: read the same fixtures a day later (-AsOf 2026-11-10T12:00:00Z), compare the fingerprints",
    "Fingerprints that differ: 0",
    "# Step 6: run the record's tests",
    "PassedCount FailedCount",
    "         17           0",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED)", pt: 10.5 });
  line(s, "Again", "A second read changes firstSeen in the run but no fingerprint, so the router in Module 7 sees nothing new.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 4 to 6; workbook Chapter 01 (The record); examples/provider-notices/tests/Normalizer.Tests.ps1.");
  notes(s,
`Step four reads the Azure retirement in full. Its notice I D is azure, R T five J six K L. It's due on September thirtieth, 2027, by the kit's rule, at the advisory's end time. It names one public I P address, and its fingerprint is a SHA-256. Step five reads the same fixtures a day later, as of November tenth, and compares the fingerprints of the two runs. The same twenty-two notices come back, and the count of fingerprints that differ is zero. A second read changes first seen in the run, but no fingerprint, so the router in Module 7 sees nothing new and makes no second task. Step six runs the record's tests, for the notice record, the fingerprint, and times and text: seventeen pass, none fail. Then delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 4 to 6.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: none yet; first, list who receives notices");
  tag(s, "How");
  const l = panel(s, "None", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "NO LAB 2 IN THIS MODULE", "The record is the same in a test environment", [
    "Each provider's Lab 2, in Modules 2 to 6, fills it from a test subscription, tenant, tenancy, account or project",
    "Never production; fictional data",
  ], 13);
  const r = panel(s, "List", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "BEFORE YOU START THEM", "Who receives each provider's notices today", [
    "The guide's prerequisites start with that decision",
    "The runbook's pre-flight checks that each enabled provider names its notice contacts",
  ], 13);
  callout(s, "Work", Math.max(l, r) + 0.3, 0.95, "FaBuilding", HEX.amber, "Your routing stays at work: ",
    "the agency's routing, settings, notices, digests and evidence are written at work from the kit's templates and Copilot prompts.");
  sources(s, "Sources: Module 1, \"Exercise: Lab 2\"; learning path index, \"What you need for the labs\"; the guide (Prerequisites).");
  notes(s,
`This module has no Lab 2 of its own, because the record is the same in a test environment. Each provider's Lab 2, in Modules 2 to 6, fills it from a test subscription, tenant, tenancy, account or project. Never production, and only fictional data. Before you start them, do one thing: list who receives each provider's notices today. The guide's prerequisites start with that decision, and the deployment runbook's pre-flight checks that each enabled provider names its notice contacts. And remember where the real work happens. The labs use the kit's fictional routing. The agency's own routing, settings files, notices, digests and evidence are written at work, from the kit's templates and its Copilot prompts in Microsoft 365 Copilot Chat, and they stay on agency storage.`,
  `${M} — Unit "Exercise: Lab 2, your test environment"; learning path index — "What you need for the labs," "Your routing stays at work."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for the record");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.9, 3.0, 5.25], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["SA-9 c; SI-5 a", "KSI-SCR-MIT, KSI-SCR-MON", "raw/, notices.json, manifest.json: every notice each provider published, read with its calls and their roles"],
    ["SI-5; CA-7", "KSI-SCR-MON, KSI-MLA-EVC", "notices.json and notices.csv: each notice one record, valid against the schema"],
    ["CA-7", "KSI-MLA-EVC", "A re-read changes no fingerprint, so a notice is routed once"],
  ], { fontSize: 12, limit: 4.6 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 1, \"Introduction\"; NIST SP 800-53 Rev. 5 (SA-9, SI-5, CA-7); FedRAMP 20x KSIs; Book 15, Ch 14 (Evidence and the federal requirements it supports).");
  notes(s,
`The federal requirement. Every gate's collection supports NIST special publication eight hundred fifty-three S A nine, part c, monitoring external service providers on an ongoing basis, and S I five, part a, receiving security alerts and advisories. The record supports S I five and C A seven, continuous monitoring. The evidence is the raw responses, the notices and the manifest, which lists every call with its role; the notices as one record each, valid against the schema; and a re-read that changes no fingerprint, so a notice is routed once. The record is evidence for these controls. Your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. K S I's are FedRAMP twenty X indicators for cloud service providers. The agency lines this evidence up with what its providers report; it doesn't report K S I's itself. Which file supports which indicator is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); Book 15, Chapter 14 — "Evidence and the federal requirements it supports."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on notices", [
    { q: "Why does the program read each provider's API instead of its email?", options: ["a. The API is faster than email", "b. Email reaches a person who may have left, carries no owner or due date, and can be imitated", "c. Providers have stopped sending email"] },
    { q: "The Azure retirement's actionBasis starts with rule:. What does that mean?", options: ["a. Microsoft set the date", "b. The kit inferred it by a stated rule: Azure has no field the kit reads that says so", "c. The ISSO approved it"] },
  ], "1 b: the provider's own record is the source of truth; email stays an early warning. 2 b: the record names the kit's rule.");
  sources(s, "Sources: Module 1, \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: why does the program read each provider's A P I instead of its email? The answer is b. Email reaches a person who may have left, carries no owner or due date, and can be imitated. The provider's own record is the source of truth, and email stays an early warning. Second: the Azure retirement's action basis starts with rule. What does that mean? The answer is b. The kit inferred that action is required by a stated rule, because Azure has no field the kit reads that says so. Microsoft didn't set that date; the kit's rule took the advisory's end time, and the record says so. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 2, Azure Service Health");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Collected 22 fictional notices from five providers into one list",
    "Counted them by the six kinds",
    "Saw eight that need action, and who said so",
    "Showed that reading them again changes no fingerprint",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2: Azure Service Health and alerts", [
    "Gate G1, with workbook Chapter 01",
    "The Azure reader, and alerts at scale",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "each run's raw/, notices.json, notices.csv and the manifest.json that lists every call with its role and hashes every file, dated.");
  sources(s, "Sources: Module 1, \"Summary\"; Module 2; learning path index.");
  notes(s,
`To sum up. You collected twenty-two fictional notices from five providers into one list, counted them by the six kinds, saw eight that need action and who said so, and showed that reading them again changes no fingerprint. The evidence an ISSO keeps from this module's pattern is each run's raw responses, the notices as JSON and as a spreadsheet file, and the manifest that lists every call with its role and hashes every file, all dated. Modules 2 to 6 produce it for each provider, and Module 8 chains it. Next is Module 2: Azure Service Health and alerts. That's Gate 1, with the workbook's first chapter: the Azure reader, the elevated role security advisories need, and Service Health alerts at scale through Azure Policy.`,
  `${M} — Unit "Summary"; Module 2; learning path index — "Modules."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/provider-notices/01-why-provider-notices-go-unread.md (Provider Notices learning path, Module 1): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: modules, what you need for the labs, your routing stays at work.",
  "What the module sends the learner to: Book 15, Chapter 14, \"Why provider notices go unread,\" \"The six kinds of notice,\" \"Who owns each kind,\" \"From notice to task to closure,\" \"Evidence and the federal requirements it supports\" and their footnotes (Microsoft Learn, Oracle, AWS and Google Cloud documentation, NIST SP 800-53 Rev. 5, FedRAMP KSIs); Provider Notices: An Implementation Guide, \"The track at a glance,\" \"Prerequisites,\" \"The five providers compared\"; workbook Chapter 01, \"The record.\"",
  "Kit: examples/provider-notices (Invoke-PnCollect.ps1; powershell/ProviderNotices; schema/notice.schema.json; tests/fixtures/settings.lab.json, day1; tests/Normalizer.Tests.ps1). Fictional estate. Illustrative: tested against fixtures, not run against a live tenant.",
  "Lab output: run November 12, 2026 with PowerShell 7.6 and Pester 5.9 in a scratch copy of examples/provider-notices; the same output the module page shows. Long commands are wrapped and output trimmed where the slides say so. Verification: docs/training/provider-notices/_verification/learning-path.md.",
]);

finish(OUT);
