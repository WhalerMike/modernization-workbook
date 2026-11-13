// Provider Notices learning path, Module 3: Microsoft 365 Message center — the module's narrated deck.
// Teaches docs/training/provider-notices/03-microsoft-365-message-center.md, Learn-style: objectives, the concepts the
// page sends the learner to (the guide's Step 2; workbook Chapter 02, "What Microsoft gives you," "What it leaves to
// you," "The code," "Dangers"), three "Try it" slides with the real Lab 1 commands and output (run November 12, 2026 in
// a scratch copy of examples/provider-notices, the same output the page shows), Lab 2, the federal requirement and
// evidence, a two-question check, and the summary. Every fact comes from those pages, their footnotes or the kit; the
// deck adds none. Helpers: ../training-pn-module-1/pn.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-pn-module-3/build.js \
//                      presentations/training-pn-module-3/Training_PN_Module_3.pptx
const P = require("../training-pn-module-1/pn.js")("Module 3: Microsoft 365 Message center");
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_PN_Module_3.pptx";
const M = "Training, Provider Notices, Module 3";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 3: Microsoft 365 Message center", "Provider Notices learning path · Gate G2 Microsoft 365, with workbook Chapter 02",
    ["Two read permissions  ·  The tenant's own Graph host  ·  Posts and issues as kinds", "Microsoft's date or the kit's rule  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence  ·  Check"]);
  notes(s,
`Welcome to Module 3 of the Provider Notices learning path: the Microsoft 365 Message center. This is Gate 2 of the provider notices implementation guide, with the second chapter of the developer workbook. The Message center is where Microsoft announces changes, retirements and actions for a Microsoft 365 tenant, and service health lists incidents and advisories. Microsoft Graph's service communications A P I reads both, with two read permissions. In this module you read the fixture tenant's posts and issues, see which ones Microsoft said need action and which the kit's rule marked, and watch the kit refuse to follow a next link off the tenant's own Graph host. It takes about fifty minutes, with a lab on fixtures and a lab for a test tenant. The code is illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Each administrator's Message center is their own");
  tag(s, "Why");
  const l = panel(s, "View", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "IN THE ADMIN CENTER", "A personal view, a personal digest", [
    "Archiving a post removes it only from that administrator's view",
    "The weekly digest goes by default to each administrator's own primary email",
    "The \"Act by\" date is rare enough that Microsoft says to pay extra attention when it appears",
  ], 13);
  const r = panel(s, "Host", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "THROUGH GRAPH", "One record, on the right host", [
    "Graph's service communications API reads posts and issues with two read permissions",
    "A GCC High tenant read on the worldwide host returns nothing",
  ], 13);
  callout(s, "Quiet", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.red, "An empty list looks like a quiet week: ",
    "so the kit reads only the cloud the settings name, and refuses a session in another environment or tenant.");
  sources(s, "Sources: Module 3, \"Introduction\"; Book 15, Ch 14 (Why provider notices go unread): Message center; Graph service communications API.");
  notes(s,
`Why does Microsoft 365 need its own gate? In the admin center, each administrator's view of the Message center is their own. Archiving a post removes it only from that administrator's view, and the weekly digest goes, by default, to each administrator's own primary email. Microsoft gives at least thirty days' notice of a major update that needs action, and the act-by date is rare enough that Microsoft says to pay extra attention when it appears. So the program reads the posts from Microsoft Graph instead, through the service communications A P I, with two read permissions. There's a trap. A GCC High tenant read on the worldwide Graph host returns nothing, and an empty list looks like a quiet week. So the kit reads only the cloud the settings name, and refuses a session in another environment or tenant.`,
  `${M} — Unit "Introduction"; Compliance Automation and Day-Two Operations, Chapter 14 — "Why provider notices go unread."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Name the reader's two Graph permissions, and the role data privacy messages need",
    "Say which Graph host each cloud uses, and why the wrong one fails silently",
    "Map Message center posts and service health issues to the record's kinds",
    "Tell a date Microsoft set from the kit's rule for a preventOrFixIssue post",
    "Show that the kit refuses a next link on another host",
  ], [
    "Module 1: the record and its action basis",
    "Book 15, Chapter 03: why nothing is approved on the strength of an email",
    "Lab 1: PowerShell 7.1+ with Pester 5; no tenant",
  ], 50);
  sources(s, "Sources: Module 3, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll name the two Graph permissions the reader needs, and the role that data privacy messages need. You'll say which Graph host each Microsoft 365 cloud uses, and why the wrong one fails silently. You'll map Message center posts and service health issues to the record's kinds. You'll tell a date Microsoft set from the kit's rule for a prevent-or-fix-issue post. And you'll show that the kit refuses a next link on another host. You need Module 1, for the record and its action basis, and the intake, triage and routing chapter of Compliance Automation and Day-Two Operations, which explains why nothing is approved on the strength of an email. Lab 1 needs PowerShell 7.1 or later with Pester 5. No tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 What Microsoft gives you
{
  const s = content(SC, "What Microsoft gives you: three calls, two permissions");
  tag(s, "What");
  const b = table(s, "Calls", 1.45, [5.0, 3.6, 3.55], ["Graph v1.0 call", "Permission", "What it lists"], [
    ["GET /admin/serviceAnnouncement/messages", "ServiceMessage.Read.All", "Message center posts"],
    ["GET /admin/serviceAnnouncement/issues", "ServiceHealth.Read.All", "Service health issues"],
    ["GET /admin/serviceAnnouncement/healthOverviews", "ServiceHealth.Read.All", "Health overviews, kept in the raw record"],
  ], { fontSize: 12.5, limit: 3.6 });
  const l = panel(s, "Consent", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "CONSENT AND ROLES", null, [
    "Both permissions granted only by an administrator; a delegated sign-in also needs an admin role",
    "Data privacy messages: only Global Administrators and Message Center Privacy Readers",
  ], 12.5);
  panel(s, "Cmdlet", 6.85, b + 0.25, 5.9, null, HEX.teal, HEX.tealTint, "LEARN'S OWN CMDLET", null, [
    "Get-MgServiceAnnouncementMessage, in Microsoft.Graph.Devices.ServiceAnnouncement",
    "The interim path, and Lab 2's cross-check",
  ], 12.5);
  sources(s, "Sources: Module 3, Unit 2; workbook Chapter 02 (What Microsoft gives you); Graph service communications API; List serviceAnnouncement messages, issues.");
  notes(s,
`Unit 2 starts with what Microsoft gives you. Learn's service communications overview names three list calls on Graph version one point oh: messages, for Message center posts, which need Service Message dot Read dot All; and issues and health overviews, which need Service Health dot Read dot All. The kit keeps the health overviews in the raw record for the run; the notices come from posts and issues. Both permissions are granted only by an administrator, and a delegated sign-in also needs an admin role. One exception matters: data privacy messages are visible only to Global Administrators and Message Center Privacy Readers, so where they matter, name a privacy reader to read them. And Learn has its own cmdlet for posts, Get M g Service Announcement Message. It's the interim path before the reader exists, and Lab 2's cross-check.`,
  `${M} — Unit 2: workbook Chapter 02 — "What Microsoft gives you"; the guide — Step 2, "Prerequisites," "Interim path."`);
}

// ================================================================== 5 Hosts
{
  const s = content(SC, "Each cloud has its own Graph host");
  tag(s, "What");
  const b = table(s, "Hosts", 1.45, [2.6, 4.75, 4.8], ["Settings cloud", "Graph host", "Connect-MgGraph -Environment"], [
    ["gcc", "graph.microsoft.com, the worldwide endpoint", "Global"],
    ["gcchigh (side note)", "graph.microsoft.us", "USGov"],
    ["dod (side note)", "dod-graph.microsoft.us", "USGovDoD"],
  ], { fontSize: 13, limit: 3.6 });
  panel(s, "Guard", 0.6, b + 0.25, 12.15, null, HEX.navy, HEX.navyTint, "THE GUARDS", null, [
    "The settings name the cloud and tenant; Assert-PnLiveContext compares Get-MgContext's environment and tenant before the first call",
    "A next link is a URL the response chose: followed only if it is on the cloud's own Graph host, or refused",
    "The API is available on the national clouds; each list method's table shows US Government L4 and L5",
  ], 12.5);
  sources(s, "Sources: Module 3, Unit 1; the guide, Step 2 (Government-cloud availability); workbook Chapter 02 (What it leaves to you); Graph national cloud deployments.");
  notes(s,
`Each Microsoft 365 cloud has its own Graph host. GCC keeps the worldwide endpoint, graph dot microsoft dot com, and signs in with the Global environment. That's the workbook's baseline. As a side note, GCC High uses graph dot microsoft dot U S, and DoD uses dod dash graph dot microsoft dot U S, each with its own environment name. The A P I is available on the national clouds, and each list method's table shows U S Government L four and L five. The kit has two guards. Before the first call, it compares the Graph session's environment and tenant with the settings, and refuses a mismatch. And a next link is a U R L the response chose, so the kit follows it only if it's on the cloud's own Graph host. Anything else is refused, so the token never goes somewhere the agency didn't choose.`,
  `${M} — Unit 1: the guide — Step 2, "Government-cloud availability"; Unit 2: workbook Chapter 02 — "What it leaves to you," "The code."`);
}

// ================================================================== 6 Kinds
{
  const s = content(SC, "Posts and issues become kinds, with their basis");
  tag(s, "What");
  const b = table(s, "Kinds", 1.45, [3.9, 2.0, 6.25], ["Source", "Kind", "Action required"], [
    ["Post tagged Retirement", "retirement", "If actionRequiredByDateTime is set (provider)"],
    ["Post, planForChange", "change", "If actionRequiredByDateTime is set (provider)"],
    ["Post, preventOrFixIssue", "change", "The provider's date if set; otherwise the kit's rule, no date"],
    ["Post, stayInformed", "advisory", "If actionRequiredByDateTime is set (provider)"],
    ["Issue, incident or advisory", "incident, advisory", "No; isResolved closes it"],
  ], { fontSize: 12.5, limit: 4.7 });
  callout(s, "Tags", b + 0.25, 1.05, "FaLightbulb", HEX.amber, "Not yet specified: ",
    "Learn doesn't enumerate the Message center tags; the kit treats Retirement as a retirement. A post past its end date is closed.");
  sources(s, "Sources: Module 3, Unit 2; workbook Chapter 02 (What it leaves to you; The code); List serviceAnnouncement messages.");
  notes(s,
`No post category says retirement, so the kit maps posts and issues to kinds. A post tagged Retirement is a retirement. Plan-for-change and prevent-or-fix-issue posts are changes. Stay-informed posts are advisories. A service health issue is an incident or an advisory, by its classification, and it closes when it's resolved. Action required comes from one field: Microsoft's action-required-by date, the only field that says Microsoft wants action, and the record's basis names it. The one kit rule is for a prevent-or-fix-issue post without a date: it's action required, with no date, labeled rule. No date is ever made up. The kit also matches enum values without regard to case, strips the markup from a post's body, caps the summary at two thousand characters, and closes a post once its end date has passed. One gap remains: Learn doesn't enumerate the tags, so that's not yet specified.`,
  `${M} — Unit 2: workbook Chapter 02 — "What it leaves to you," "The code."`);
}
endModule(SC);

// ================================================================== 7 Try it: permissions, hosts, collect
{
  const s = content(SL, "Try it: two permissions, three hosts, six notices");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 to 3, in examples/provider-notices (PowerShell 7)",
    "$ Get-PnRequiredPermission -Provider m365 | Format-Table Call, Permissions, Verified",
    "m365-messages         ServiceMessage.Read.All     True",
    "m365-issues           ServiceHealth.Read.All      True",
    "m365-health-overviews ServiceHealth.Read.All      True",
    "$ foreach ($c in 'gcc', 'gcchigh', 'dod') { $x = Get-PnCloud -Provider m365 -Cloud $c; ... }",
    "gcc      https://graph.microsoft.com      Global",
    "gcchigh  https://graph.microsoft.us       USGov",
    "dod      https://dod-graph.microsoft.us   USGovDoD",
    "$ ./Invoke-PnCollect.ps1 ... -FixturePath tests/fixtures/day1 -Provider m365 -AsOf 2026-11-09T12:00:00Z ...",
    "Provider Cloud        Notices   Open   Action  By kind",
    "m365     gcc                6      5        2  advisory 3, change 1, incident 1, retirement 1",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "Two read permissions and nothing that writes. Six notices from a fictional GCC tenant: five open, two needing action.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 1 to 3; examples/provider-notices: config/calls.json, tests/fixtures/day1 (fictional).");
  notes(s,
`Try it. Lab 1 runs in the provider notices folder of the examples, in PowerShell 7, against a fictional tenant in G C C. Step one lists what Microsoft 365 needs: three calls, and only two permissions, Service Message dot Read dot All for the posts, and Service Health dot Read dot All for the issues and the health overviews. All three are marked verified, and nothing writes. Step two prints each cloud's Graph host: the worldwide host for G C C with the Global environment, then the U S Government hosts for GCC High and DoD. Step three collects Microsoft 365 from the day-one fixtures, as of November ninth, 2026: six notices, five open, two needing action. Three advisories, a change, an incident and a retirement.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 3.`);
}

// ================================================================== 8 Try it: records and basis
{
  const s = content(SL, "Try it: Microsoft's date, or the kit's rule");
  tag(s, "How");
  const c = code(s, "Basis", 0.6, 1.45, 12.15, [
    "# Step 4: read the records (Format-Table noticeId, kind, status, actionRequired, actionRequiredBy, title)",
    "m365:EX900101 incident   open   false                               Some users may see delays receiving ...",
    "m365:MC900001 retirement open   true           2027-01-31T08:00:00Z Retirement of Basic authentication ...",
    "m365:MC900003 change     open   true                                Update SharePoint Framework solutions ...",
    "m365:TM900102 advisory   closed false                               Users couldn't load the Teams web app ...",
    "# Step 5: see who said each one needs action",
    "m365:EX900101 none",
    "m365:MC900001 provider: actionRequiredByDateTime",
    "m365:MC900002 none",
    "m365:MC900003 rule: Message center category preventOrFixIssue",
    "m365:MC900004 none",
    "m365:TM900102 none",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Two", "Microsoft set MC900001's date. MC900003 is a preventOrFixIssue post with no date: the kit's rule, and no date made up.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 4 and 5; workbook Chapter 02 (The code).");
  notes(s,
`Step four reads the records. M C nine hundred thousand and one is a retirement, of Basic authentication for S M T P AUTH client submission, due on January thirty-first, 2027. M C nine hundred thousand and three is a change, an update to SharePoint Framework solutions, and it needs action with no date. The incident is open, and the resolved Teams issue is closed. Step five asks who said each one needs action. For the retirement, it was Microsoft: the basis is provider, action-required-by date. For the SharePoint change, it was the kit's rule: a prevent-or-fix-issue post without a date is action required, and the record says rule, with the category. Everything else says none. So when someone asks where a date came from, the record answers, and where Microsoft gave none, the kit makes none up.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 4 and 5.`);
}

// ================================================================== 9 Try it: week two and the host guard
{
  const s = content(SL, "Try it: the second week, and a refused next link");
  tag(s, "How");
  const c = code(s, "Week", 0.6, 1.45, 12.15, [
    "# Step 6: collect the second week (-FixturePath tests/fixtures/day2 -AsOf 2026-11-16T12:00:00Z)",
    "m365     gcc                7      5        3  advisory 3, change 2, incident 1, retirement 1",
    "m365:EX900101 incident   closed                      Some users may see delays receiving external email",
    "m365:MC900003 change     open                        (Updated) Update SharePoint Framework solutions ...",
    "m365:MC900005 change     open   2027-02-28T08:00:00Z Action required: register your apps for the new mail ...",
    "# Step 7: build the live request without sending it, then try a next link on another host",
    "$ (Get-PnLiveCommand -CallId m365-messages -Settings $s).Uri",
    "https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/messages",
    "$ Get-PnLiveCommand ... -Arguments @{ nextLink = 'https://graph.example.net/v1.0/...?skip=100' }",
    "Exception: Refusing https://graph.example.net/v1.0/admin/serviceAnnouncement/messages?skip=100:",
    "  it isn't on the gcc Graph host https://graph.microsoft.com.",
    "# Step 8: run this chapter's tests            PassedCount 15   FailedCount 0",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (WRAPPED AND TRIMMED)", pt: 10.5 });
  line(s, "Next", "A new post with Microsoft's date, an updated title, a closed incident; and the token never leaves the tenant's host.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 6 to 8; workbook Chapter 02 (Dangers); examples/provider-notices/tests/fixtures/day2.");
  notes(s,
`Step six collects the second week, as of November sixteenth: seven notices. A new post, M C nine hundred thousand and five, is a change due February twenty-eighth, 2027, a date Microsoft set. The SharePoint post's title now starts with updated, so its fingerprint changes, and Module 7 will update its task. And the incident is closed. Step seven builds the live request without sending it. The first line prints the messages U R L on the worldwide Graph host, the right one for G C C. Then it tries a next link on another host, graph dot example dot net, and the kit refuses it: it isn't on the G C C Graph host. That's the guard that keeps the token on the tenant's own host. Step eight runs this chapter's tests: fifteen pass, none fail. Then delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 6 to 8.`);
}

// ================================================================== 10 Lab 2
{
  const s = content(SL, "Lab 2: a test tenant, delegated, two read scopes");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A Microsoft 365 test tenant in the worldwide or GCC cloud, never production; a test administrator who holds an admin role"],
    ["Sign in", "Delegated, with only ServiceMessage.Read.All and ServiceHealth.Read.All; an administrator consents once"],
    ["Cross-check", "Learn's cmdlet against the collection; look at the posts that need action"],
    ["Record", "The tags you see on retirement posts, which Learn doesn't list"],
    ["Back it out", "Sign out, delete the run, and remove the consent if it was granted only for this lab"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "NotRun", b + 0.25, 0.95, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 02, Lab 2, which has the exact commands.");
  sources(s, "Sources: Module 3, \"Exercise: Lab 2\"; workbook Chapter 02, Lab 2; Graph service communications API.");
  notes(s,
`Lab 2 runs the same read in a Microsoft 365 test tenant, in the worldwide or G C C cloud, never production. Sign in as a test administrator who holds an admin role. Learn doesn't name which admin roles Graph accepts for a delegated read, so the Message center reader roles are the narrowest to try. Sign in delegated, with only the two read scopes; an administrator consents to them once. Cross-check Learn's own cmdlet against the kit's collection, and look at the posts that need action. Then record one open item: the tags you see on retirement posts, which Learn doesn't list. To back it out, sign out, delete the run, and remove the consent in the Microsoft Entra admin center if it was granted only for this lab. The authors haven't run Lab 2. The workbook's Chapter 2 has the exact commands.`,
  `${M} — Unit "Exercise: Lab 2, a test tenant"; workbook Chapter 02 — "Lab 2: a test tenant."`);
}
endModule(SL);

// ================================================================== 11 Dangers
{
  const s = content(SS, "Dangers the gate guards against");
  tag(s, "Who");
  const b = table(s, "Dang", 1.45, [4.1, 8.05], ["Danger", "The guard"], [
    ["A GCC High or DoD tenant read on the worldwide host", "The cloud named in the settings; the session guard; every request on the cloud's own host"],
    ["A next link to another host", "Next links followed only on the cloud's host"],
    ["A broad Graph scope for convenience", "Two read permissions, declared per call"],
    ["A kit rule mistaken for Microsoft's deadline", "actionBasis names the rule; no date is made up"],
    ["Data privacy posts unseen", "Name a Message Center Privacy Reader where they matter"],
    ["The email trusted over the API", "The task links the post the kit read from Graph"],
  ], { fontSize: 12.5, limit: 5.6 });
  sources(s, "Sources: Module 3, Unit 2; workbook Chapter 02 (Dangers); Microsoft 365 admin roles; Book 15, Ch 03.");
  notes(s,
`The workbook chapter lists six dangers, and each has a guard. A GCC High or DoD tenant read on the worldwide host returns nothing, and the gate passes on an empty list; the guard is the cloud named in the settings, the session guard, and every request on the cloud's own host. A next link to another host would send the token somewhere the agency didn't choose; next links are followed only on the cloud's host. A broad Graph scope for convenience would let the reader change the tenant; it holds two read permissions, declared per call. A kit rule mistaken for Microsoft's deadline would give a post with no date an invented one; the action basis names the rule. Data privacy posts go unseen by the reader's role, so name a privacy reader where they matter. And look-alike email gets acted on, so the task links the post the kit read from Graph, as the intake, triage and routing chapter of Compliance Automation and Day-Two Operations requires.`,
  `${M} — Unit 2: workbook Chapter 02 — "Dangers."`);
}

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G2");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.6, 3.6, 4.95], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["SA-9 c", "KSI-SCR-MIT, KSI-SCR-MON", "Get-PnRequiredPermission -Provider m365: two read permissions; the consent record"],
    ["SA-9 c; SI-5 a", "KSI-SCR-MIT, KSI-SCR-MON", "raw/m365.json, notices.json, manifest.json; every request on the tenant's own Graph host"],
    ["SI-5; CM-3 b, through the tasks Module 7 routes", "KSI-SCR-MON, KSI-CMT-LMC, KSI-CMT-RVP", "Change and retirement notices with their actionBasis"],
  ], { fontSize: 12, limit: 4.6 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 3, \"Introduction\"; workbook Chapter 02 (Federal requirements and evidence); the guide, Step 2; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. Gate 2 supports NIST special publication eight hundred fifty-three S A nine, part c, and S I five, part a, as Gate 1 does. And for posts that announce a change, it supports C M three, part b: reviewing proposed changes with a security and privacy impact analysis, through the tasks Module 7 routes. The evidence is the permission list, two read permissions, and the consent record; the raw Microsoft 365 response, the notices and the manifest, with every request on the tenant's own Graph host; and the change and retirement notices, each with its action basis. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. K S I's are FedRAMP twenty X indicators for cloud service providers, and which file supports which indicator is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); the guide — Step 2; workbook Chapter 02 — "Federal requirements and evidence."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on Microsoft 365", [
    { q: "A GCC tenant is read on which Graph host?", options: ["a. graph.microsoft.us", "b. dod-graph.microsoft.us", "c. graph.microsoft.com, the worldwide endpoint"] },
    { q: "m365:MC900003 is action required with no date. Why?", options: ["a. Microsoft set actionRequiredByDateTime", "b. The kit's rule marks a preventOrFixIssue post without a date, labeled rule:", "c. It is tagged Retirement"] },
  ], "1 c: GCC keeps the worldwide endpoint. 2 b: the record names the kit's rule, and no date is made up.");
  sources(s, "Sources: Module 3, \"Knowledge check,\" questions 2 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: a G C C tenant is read on which Graph host? The answer is c: graph dot microsoft dot com, the worldwide endpoint. GCC High and DoD have their own hosts, but G C C keeps the worldwide one. Second: M C nine hundred thousand and three is action required with no date. Why? The answer is b. The kit's rule marks a prevent-or-fix-issue post without a date as action required, and labels the basis rule. Microsoft didn't set a date, and the kit doesn't make one up. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 3; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary, and next: Module 4, OCI announcements");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Listed the reader's two permissions, and saw each cloud's Graph host",
    "Collected six posts and issues, then the second week's seven",
    "Told Microsoft's dates from the kit's rule",
    "Watched the kit refuse a next link on another host",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 4: Oracle Cloud Infrastructure announcements", [
    "Gate G3, with workbook Chapter 03",
    "One policy statement, chains and realms",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "raw/m365.json, notices.json, notices.csv and manifest.json, dated; the permission list from step 1; and in Lab 2 the consent record.");
  sources(s, "Sources: Module 3, \"Summary\"; Module 4; workbook Chapter 02 (Checklist).");
  notes(s,
`To sum up. You listed the reader's two permissions, saw each cloud's Graph host, collected six posts and issues and then the second week's seven, told Microsoft's dates from the kit's rule, and watched the kit refuse a next link on another host. The evidence an ISSO keeps for Gate 2 is the raw Microsoft 365 response, the notices as JSON and as a spreadsheet file, and the manifest, all dated; the permission list from step one; and in Lab 2, the consent record. Before you ship, work through the chapter's checklist. Next is Module 4: Oracle Cloud Infrastructure announcements. That's Gate 3, with the workbook's third chapter: one policy statement, announcement chains, and the realms the kit reads. For an agency whose HR platform runs on Oracle Cloud, that's where its maintenance notices come from.`,
  `${M} — Unit "Summary"; Module 4.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/provider-notices/03-microsoft-365-message-center.md (Provider Notices learning path, Module 3): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "What the module sends the learner to: Provider Notices: An Implementation Guide, Step 2 (with Government-cloud availability, Interim path and Validate (G2)); workbook Chapter 02, \"What Microsoft gives you,\" \"What it leaves to you,\" \"The code,\" \"Dangers,\" \"Federal requirements and evidence,\" Lab 2; Book 15, Chapter 14, \"Why provider notices go unread\"; Book 15, Chapter 03.",
  "Microsoft Learn pages they cite: Use the Microsoft Graph API to access service communications; List serviceAnnouncement messages; List serviceAnnouncement issues; List healthOverviews; National cloud deployments; About admin roles in the Microsoft 365 admin center; Track new and changed features in the Message center. NIST SP 800-53 Rev. 5 (OSCAL 5.2.0); FedRAMP KSIs.",
  "Kit: examples/provider-notices (Invoke-PnCollect.ps1; powershell/ProviderNotices; tests/fixtures/day1 and day2; tests/Collectors.Tests.ps1, Live.Tests.ps1). Lab output: run November 12, 2026 with PowerShell 7.6 and Pester 5.9 in a scratch copy, the same output the page shows; wrapped and trimmed where the slides say so. Lab 2 not run by the authors. Illustrative: tested against fixtures, not run against a live tenant.",
]);

finish(OUT);
