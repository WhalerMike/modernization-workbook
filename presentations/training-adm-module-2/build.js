// Attribute-Driven Migration learning path, Module 2: Write a validation kit check — the module's narrated deck.
// Teaches docs/training/attribute-driven-migration/02-a-validation-kit-check.md, Learn-style: objectives, the concepts,
// "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of
// examples/validation-kit), Lab 2, the federal requirement and evidence, a two-question check, and the summary. Every fact
// comes from the module page, the learning path's verification log, Book 19 Chapter 03, or the kit
// (examples/validation-kit); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-adm-module-2/build.js \
//                      presentations/training-adm-module-2/Training_ADM_Module_2.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 2: Write a validation kit check",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration learning path, Module 2: A validation kit check",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Attribute-Driven Migration learning path — Module 2: Write a validation kit check";
const OUT = process.argv[2] || "Training_ADM_Module_2.pptx";
const M = "Training, Attribute-Driven Migration, Module 2";

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
  const s = title(SI, "Module 2: Write a validation kit check", "Attribute-Driven Migration learning path · Guide Gate 3, with Book 19 Chapter 03",
    ["Why VK-SYNC-02  ·  The catalog entry and its lesson  ·  The function", "Rows and outcome  ·  The safety tests  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 2 of the Attribute-Driven Migration learning path: write a validation kit check. Every gate in the implementation guide ends with a Validate step, and most of them name a validation kit check. The kit is the executable form of those steps. This module serves Gate 3, and takes Chapter 03 of Book 19, which teaches how a check is built through one new check, V K SYNC oh two. It asks whether soft match and hard-match takeover are blocked, and if not, whether an approved window says why. You'll see the parts of a check, its three severities, why a missing value reads as off, and why a read-only check still has to ask for the least privilege it can. Then you'll run it on the kit's fixtures and on an export, and break it on purpose. Nothing signs in.`,
  `${M} — Unit 1 "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why soft and hard match must be blocked");
  tag(s, "Why");
  const b = table(s, "Match", 1.45, [2.6, 9.55], ["Match", "How the sync engine joins an AD object to a cloud account"], [
    ["Soft match", "On the primary SMTP address, and on the UPN when soft match on UPN is on"],
    ["Hard match", "On the source anchor, against onPremisesImmutableId"],
    ["Left open", "Either one lets an AD object take over a cloud account"],
  ], { fontSize: 13.5, limit: 3.9 });
  callout(s, "Point", b + 0.35, 1.05, "FaUserShield", HEX.red, "Gate 3, step 4: ",
    "block soft and hard match outside a planned window. VK-SYNC-02 asks: are both blocks on, and if not, is there an approved window that says why?");
  sources(s, "Sources: Module 2, Units 1, 2; Microsoft Learn, \"Configure Microsoft Entra Connect for an existing tenant\" and \"Set-EntraDirSyncFeature.\"");
  notes(s,
`Why this check? Gate 3 maps attributes through sync. Before a single AD user is synchronized into a tenant that already has cloud accounts, the sync engine has to decide which incoming object matches which cloud account. Microsoft Learn's pages on configuring Entra Connect for an existing tenant and on Set Entra Dir Sync Feature explain the two joins. A soft match joins on the primary SMTP address, and on the U P N when soft match on U P N is turned on. A hard match joins on the source anchor. Either one, left open, lets an AD object take over a cloud account. Learn's existing-tenant page advises keeping soft match blocked, offers a feature to block cloud object takeover through hard match, and says to turn each off only while a matching procedure needs it. So the question is simple: are both blocks on, and if not, is there an approved window that says why? The guide lists this as Gate 3's optional match-blocking check.`,
  `${M} — Unit 1 "Introduction"; Unit 2; Book 19, Chapter 03 — "Why this check."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 2", [
    "Describe the parts of a check: catalog entry, function, rows and outcome, fixtures and tests",
    "Explain Finding, Warn and Info, and why a missing value reads as off",
    "Explain why VK-SYNC-02 is optional and prefers an export to a live read",
    "Run the check on fixtures and on an export, and see Pass, Fail and Warn",
    "Explain what the safety tests refuse, and why a new check inherits them",
  ], [
    "Module 1, and Microsoft Automation, Module 1, for permissions and roles",
    "PowerShell 7 and Pester 5.5 or later",
    "You read PowerShell, and know Pester's Describe and It",
  ], 45);
  sources(s, "Sources: Module 2, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about forty-five minutes with the lab. You'll describe the parts of a check: its catalog entry, its function, its rows and outcome, and its fixtures and tests. You'll explain the three severities, Finding, Warn and Info, and why a missing value reads as off. You'll explain why this check is optional and prefers an export to a live read. You'll run it on fixtures and on an export, and see Pass, Fail and Warn. And you'll explain what the safety tests refuse, and why a new check inherits them. Before you start, finish Module 1, and Microsoft Automation Module 1 for permissions and roles. You need PowerShell 7 and Pester 5.5 or later, and you should be able to read PowerShell and know Pester's Describe and It.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Anatomy
{
  const s = content(SC, "The anatomy of a check: five parts");
  tag(s, "What");
  const b = table(s, "Parts", 1.45, [2.6, 3.6, 5.95], ["Part", "Where", "What it does"], [
    ["Catalog entry", "Private/Catalog.ps1", "ID, track, title, source, permissions, delegated role, stage; marks optional checks"],
    ["Function", "Checks/<TRACK>.ps1", "Invoke-Vk<Track><NN>, wrapped in Invoke-VkCheckBody"],
    ["Data read", "Get-VkData, Read-VkInputJson", "One path for fixtures, Graph and input files; logs every read as evidence"],
    ["Rows and outcome", "ConvertTo-VkFinding, Get-VkOutcome", "Detail rows with one shape; status from the rows"],
    ["Tests and fixtures", "tests/fixtures/pass, fail", "Pass clean data; fail planted problems with an exact count"],
  ], { fontSize: 12.5, limit: 4.9 });
  callout(s, "Body", b + 0.3, 1.05, "FaTriangleExclamation", HEX.navy, "The wrapper: ",
    "Invoke-VkCheckBody turns any exception into Error, so a read that throws can never come back as Pass. Don't catch inside the body.");
  sources(s, "Sources: Module 2, Unit 2; the kit's design: examples/validation-kit (Private/Catalog.ps1, Checks/SYNC.ps1, tests).");
  notes(s,
`This slide is the kit's own design, not a Microsoft rule. In the kit, every check has the same five parts. The catalog entry holds its I D, track, title, source, Graph permissions, delegated role and release stage, and marks it optional or preview. The function is named from the I D, here Invoke V K Sync oh two, and wraps its body in a shared helper. The data read goes through one path, for fixtures, Graph and input files, and logs every read as evidence. The rows have one shape, and the status comes from the rows. And the tests: the check must pass clean data and fail planted problems with an exact count. The wrapper does the work no check should repeat. It catches any exception and turns it into Error, so a read that throws can never come back as Pass. Don't catch exceptions inside the body to make a check more robust; that's how a check passes while blind.`,
  `${M} — Unit 2; Book 19, Chapter 03 — "The anatomy of a check," "The function."`);
}

// ================================================================== 5 Catalog lesson
{
  const s = content(SC, "The lesson in the catalog entry: least privilege");
  tag(s, "What");
  const l = panel(s, "Read", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "THE READ", "GET /directory/onPremisesSynchronization", [
    "Least-privileged permission: OnPremDirectorySynchronization.Read.All",
    "Learn lists no application permission for it",
    "Delegated: Global Administrator is the only supported role",
  ], 13);
  const r = panel(s, "So", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "SO VK-SYNC-02", "Does three things differently", [
    "It is optional: it runs only when named with -CheckId",
    "It prefers an export a signed-in Global Administrator saves",
    "It says so: DelegatedRole names the role and the reason",
  ], 13);
  callout(s, "Guide", Math.max(l, r) + 0.3, 0.95, "FaUserShield", HEX.navy, "Design guidance: ",
    "don't build a standing identity with a privileged role so a check can run on a schedule.");
  sources(s, "Sources: Module 2, Unit 2; Microsoft Learn, \"Get onPremisesDirectorySynchronization\" (Graph reference); the kit's catalog entry.");
  notes(s,
`Here's the lesson this check hides. The read is GET directory, on-premises synchronization. Microsoft Learn's Graph reference for that call, Get on-premises directory synchronization, names its least-privileged permission, OnPremDirectorySynchronization dot Read dot All, which looks harmless. But the same page lists no application permission for it at all, and for delegated access says Global Administrator is the only supported role. A read-only check, run live, would need the most powerful role in the tenant. The kit's design rule is that a check asks for the least privilege the question needs, and GET-only is necessary but not sufficient. So this check does three things differently. It's optional, so it stays out of a default run and runs only when named. It prefers an export, saved by a Global Administrator who is already signed in for other reasons. And it says so: the catalog names the role and the reason, before anyone runs it live.`,
  `${M} — Unit 2 "Why this check, and the lesson in its catalog entry"; Book 19, Chapter 03 — "The catalog entry, and the lesson in it."`);
}

// ================================================================== 6 Rows and outcome
{
  const s = content(SC, "Rows and outcome: Finding, Warn and Info");
  tag(s, "What");
  const b = table(s, "Sev", 1.45, [1.8, 10.35], ["Severity", "What it means in VK-SYNC-02"], [
    ["Finding", "Fails the check: a block that is off, with no open window"],
    ["Warn", "Needs a person, not a failure: a block off inside an approved window, until its last day"],
    ["Info", "Context, not counted: soft match on UPN, which can't be turned off once enabled"],
  ], { fontSize: 13, limit: 3.6 });
  panel(s, "Unsafe", 0.6, b + 0.25, 12.15, null, HEX.amber, HEX.amberTint, "DEFAULT TO THE UNSAFE ANSWER", null, [
    "A missing value reads as off, so an unexpected response gives a Finding, not a silent Pass",
    "Fail if any Finding, else Warn if any Warn, else Pass; the count is Findings plus Warns",
    "NotApplicable is for a tenant with nothing to check, never for a failed read",
  ], 13);
  sources(s, "Sources: Module 2, Unit 3; the kit's design (severities, unsafe default); Microsoft Learn, \"Set-EntraDirSyncFeature\" (soft match on UPN).");
  notes(s,
`Three severities, three meanings, and they're the kit's design. A Finding fails the check. A Warn needs a person to look, but isn't a failure: here, a block that's off inside an approved matching window, which the run's options record as the window's last day. The day after, the same state is a Finding again, without anyone editing anything. An Info row gives context and isn't counted: soft match on U P N, which Microsoft Learn's Set Entra Dir Sync Feature page says can't be turned off once it's enabled. The status comes from the rows: Fail if there's any Finding, else Warn if there's any Warn, else Pass. And the most important rule: a missing value is read as off. So a response shape the kit doesn't expect produces a Finding, not a silent Pass. Default every "is the control on" read to the unsafe answer. NotApplicable is for a tenant with nothing to check, never for a failed read.`,
  `${M} — Unit 3 "Rows, outcome and safety"; Book 19, Chapter 03 — "Rows and outcome."`);
}

// ================================================================== 7 Safety tests
{
  const s = content(SC, "The safety tests, and where the remediation goes");
  tag(s, "What");
  const l = panel(s, "Safety", 0.6, 1.45, 6.6, null, HEX.navy, HEX.navyTint, "SAFETY.TESTS.PS1", "Fails the build on any state-changing command", [
    "Write verbs, Invoke-RestMethod, Invoke-WebRequest, native programs, file redirection",
    "Every Invoke-MgGraphRequest carries a literal -Method GET",
    "A nextLink to another host is refused, so a token never leaves",
  ], 13);
  const r = panel(s, "Fix", 7.45, 1.45, 5.3, null, HEX.teal, HEX.tealTint, "THE REMEDIATION", "A write, so it stays out of the kit", [
    "Learn's command to block soft match goes in the change record the finding opens",
    "Run by the identity team under change control, never in the check",
  ], 13);
  callout(s, "Inherit", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.navy, "One data path: ",
    "VK-SYNC-02 passes the safety tests unchanged, so a new check inherits them instead of re-proving them.");
  sources(s, "Sources: Module 2, Unit 3; the kit's Safety.Tests.ps1; Microsoft Learn, \"Configure Microsoft Entra Connect for an existing tenant\" (the remediation).");
  notes(s,
`The safety tests are the kit's own design. They parse every script in the kit and fail the build on any state-changing command: write verbs, Invoke Rest Method, Invoke Web Request, native programs, file redirection, and more. Every Graph request must carry a literal Method GET, with one exception pinned by a test. A next link that points at a host other than the cloud's own Graph host is refused, so a token never leaves. This check passes those tests without any change to them, because it reads only through the kit's data path. That's the point of a single data path: a new check inherits the safety properties instead of re-proving them. If your check seems to need its own HTTP call, it doesn't; add what it needs to the data path. And the remediation, the command Microsoft Learn's existing-tenant page gives to block soft match, is a write, so it stays out of the kit, in the change record the finding opens.`,
  `${M} — Unit 3; Knowledge check answer 4; Book 19, Chapter 03 — "The safety tests."`);
}
endModule(SC);

// ================================================================== 8 Try it: fail fixture
{
  const s = content(SL, "Try it: run the check on the fail fixture");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/validation-kit, in PowerShell 7",
    "$ Import-Module ./powershell/ValidationKit -Force",
    "$ $r = Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -FixturePath ./tests/fixtures/fail -AsOf 2026-10-30)",
    "$ $r | Select-Object CheckId, Status, Count",
    "VK-SYNC-02 Fail       2",
    "$ $r.Details | Format-Table Severity, Issue",
    "Finding  Soft match is not blocked",
    "Finding  Cloud object takeover through hard match is not blocked",
    "Info     Soft match on UPN is on; it cannot be turned off once enabled",
    "$ $r.Evidence.Queries | Format-Table Source, Query",
    "Graph (fixture) fixture:onPremisesSynchronization.json <= /v1.0/directory/onPremisesSynchronization",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TABLE HEADINGS TRIMMED)", pt: 10.5 });
  line(s, "Read", "Two Findings and one Info row: the count is 2, because Info isn't counted. The evidence names the fixture and the URI.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" step 1; examples/validation-kit/tests/fixtures/fail (fictional tenant).");
  notes(s,
`Try it. Lab 1 runs in the validation-kit folder of the examples, in PowerShell 7, and nothing signs in. Step one imports the module and runs the check against the fail fixture, a fictional tenant with both blocks off and soft match on U P N on, as of October thirtieth. The status is Fail, with a count of two. The details show why: soft match isn't blocked, and cloud object takeover through hard match isn't blocked. Those are the two Findings. The third row is Info: soft match on U P N is on, and it can't be turned off once enabled. It's context, so it isn't counted. Then the evidence: the source is Graph, in fixture mode, and the query names the fixture file and the URI a live run would call. A reviewer can tell from the evidence alone which path a result came from.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," step 1.`);
}

// ================================================================== 9 Try it: window and export
{
  const s = content(SL, "Try it: a matching window, then an export");
  tag(s, "How");
  const c = code(s, "Win", 0.6, 1.45, 12.15, [
    "# Step 2: a window open until October 31; run on October 30, then on November 1",
    "$ (Invoke-VkCheck ... -AsOf 2026-10-30 -Option @{ MatchWindowOpenUntil = '2026-10-31' })).Status",
    "Warn",
    "$ (Invoke-VkCheck ... -AsOf 2026-11-01 -Option @{ MatchWindowOpenUntil = '2026-10-31' })).Status",
    "Fail",
    "# Step 3: an export that blocks soft match but not hard-match takeover, in ./inputs",
    "$ $r = Invoke-VkCheck -CheckId VK-SYNC-02 -Context (Get-VkRunContext -InputPath ./inputs -AsOf 2026-10-30)",
    "$ $r | Select-Object CheckId, Status, Count",
    "VK-SYNC-02 Fail       1",
    "$ $r.Evidence.Queries | Format-Table Source, Query",
    "Input  onprem-sync-export.json",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "Warn, then Fail: nobody edited anything. The export run is read as Input, and never needs the role.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 2 and 3; Book 19, Ch 03 \"Rows and outcome.\"");
  notes(s,
`Step two opens a matching window until October thirty-first. Run the same fail fixture on October thirtieth, inside the window, and the status is Warn: the blocks are off, but an approved window says why. Run it on November first, the day after the window closes, and it's Fail. Nobody edited anything. The window is a date, so a Warn can never quietly become permanent. Step three feeds the check an export. The first two commands make an inputs folder with an export that blocks soft match but not hard-match takeover. The status is Fail with a count of one: only the hard-match block is off. And the evidence's source is now Input, with the export's file name as the query. That's the path the check prefers, because reading a file never needs the Global Administrator role.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 2 and 3.`);
}

// ================================================================== 10 Try it: scope, tests, break
{
  const s = content(SL, "Try it: the scope, the tests, and a broken check");
  tag(s, "How");
  const c = code(s, "Scope", 0.6, 1.45, 12.15, [
    "# Step 4: what a live run would ask for",
    "$ Get-VkRequiredScope -Checks (Get-VkCheckCatalog -CheckId VK-SYNC-02)",
    "OnPremDirectorySynchronization.Read.All",
    "$ (Get-VkCheckCatalog -CheckId VK-SYNC-02).DelegatedRole",
    "Global Administrator (the only role Learn lists; delegated only, no application permission)",
    "# Step 5: is it in a default run?",
    "$ (Get-VkCheckCatalog).Id -contains 'VK-SYNC-02'",
    "False",
    "# Step 6: the whole kit's tests",
    "$ pwsh -NoProfile -Command \"Invoke-Pester -Path tests/powershell\"",
    "Tests Passed: 297, Failed: 0, Skipped: 0, Inconclusive: 0, NotRun: 0",
    "# Step 7: read 'blockSoftMatch', a property that doesn't exist; run fail, then pass; put it back, run pass",
    "Fail",
    "Fail",
    "Pass",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (STEP 7'S COMMANDS SUMMARIZED)", pt: 10 });
  line(s, "Read", "The pass fixture fails too, because the missing value reads as off. Step 8 removes ./inputs.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 1,\" steps 4 to 8; examples/validation-kit: Private/Catalog.ps1, Checks/SYNC.ps1.");
  notes(s,
`Step four shows what a live run would ask for: one permission, OnPremDirectorySynchronization dot Read dot All, and the delegated role, Global Administrator, the only role Microsoft Learn's Graph reference lists, with no application permission. Step five confirms the check isn't in a default run: the answer is False. Step six runs the whole kit's tests: two hundred ninety-seven pass, none fail. Step seven makes the check fail for the right reason. You change your copy of the check to read block soft match, a property that doesn't exist. The fail fixture still fails. And the pass fixture, with both blocks on, fails too, because the missing value reads as off. That's the unsafe default doing its job: a wrong property name can't produce a silent Pass. Put the name back, and the pass fixture passes again. Step eight removes the inputs folder.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 4 to 8.`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: run the check on your tenant's export");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A test tenant with Microsoft Entra Connect or Cloud Sync configured"],
    ["Export", "A Global Administrator saves the response of the one privileged read to a file"],
    ["Run", "Run the check on that export as any user; nothing in the kit runs with that role"],
    ["Compare", "Compare the result with the export, line by line"],
    ["Back it out", "Step 4 deletes the export: it isn't evidence by itself; the run's manifest is"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow Book 19, Chapter 03, Lab 2, step by step.");
  sources(s, "Sources: Module 2, Unit 5 \"Exercise: Lab 2 (your test tenant)\"; Book 19, Ch 03 \"Lab 2: test tenant.\"");
  notes(s,
`Lab 2 runs the check on a real export, in a test tenant with Microsoft Entra Connect or Cloud Sync configured. A Global Administrator of the test tenant saves the response of the one privileged read to a file. That's the only step that needs the role; nothing in the kit runs with it. Then you run the check on that export as any user, and compare the result with the export, line by line, so you know the check reads the tenant's real response shape. To back it out, step four deletes the export once the run's evidence is stored. The export isn't evidence by itself; the run's manifest, with a hash for every file of the run, is. The authors haven't run Lab 2. Follow Chapter 03's Lab 2, step by step.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test tenant)"; Book 19, Chapter 03 — "Lab 2: test tenant."`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 2");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.1, 2.0, 6.05], ["Requirement", "KSI", "Evidence the ISSO keeps"], [
    ["CM-6; CA-7; AC-2: no takeover unnoticed", "KSI-MLA-EVC", "The run's Results/ValidationResults.json"],
    ["CM-6: a deviation is approved and has an end", "KSI-MLA-EVC", "The window date in the run's options, and the change record"],
    ["AC-6: no standing Global Administrator", "KSI-IAM-ELP", "The evidence block saying the read came from an export; the catalog"],
    ["SA-11; CM-7: the kit can only read", "KSI-CMT-VTD", "The test results, including Safety.Tests.ps1"],
    ["SI-7; AU-3 (Lab 2)", "KSI-SVC-VRI", "ValidationManifest.json, a SHA-256 for every file of the run"],
    ["CM-3; CM-5: the remediation is a write", "KSI-CMT-LMC", "The change record the finding opens"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them (design guidance).", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 2, Units 1 and 7; NIST SP 800-53 (SP 800-53B Moderate baseline); FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. The controls are NIST special publication eight hundred fifty-three controls in its Moderate baseline: C M six, C A seven, A C two, A C six, S A eleven, C M seven, S I seven, A U three, C M three and C M five. A check is monitoring evidence only if it can't change what it reads, and can't pass when it didn't look. The run's validation results show that an AD object can't take over a cloud account unnoticed. A deviation is approved, documented, and has an end: the window date in the run's options, and its change record. Least privilege: no standing Global Administrator identity for a scheduled check, shown by the evidence block that says the read came from an export. The test results, including the safety tests, show the kit can only read. In Lab 2, the validation manifest holds a hash for every file of the run. And the remediation is a write under change control, never the check. The Key Security Indicators come from FedRAMP's Key Security Indicators list, FedRAMP 20x indicators for cloud service providers. Which output supports which control is this workbook's reading.`,
  `${M} — Unit 1 "Introduction" (Chapter 03's requirements, KSIs and evidence); Unit 7 "Summary."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on the check", [
    { q: "Soft match isn't blocked, and an approved window ends today. What does VK-SYNC-02 report tomorrow?", options: ["a. Warn, because the window was approved", "b. Fail: the day after the window's last day, the same state is a Finding again", "c. NotApplicable"] },
    { q: "A response comes back without the blockSoftMatchEnabled property. What does the check report?", options: ["a. Pass, because nothing says the block is off", "b. A Finding, because a missing value reads as off", "c. An error"] },
  ], "1 b: the window is a date (step 2 of the lab). 2 b: the unsafe default (step 7 of the lab).");
  sources(s, "Sources: Module 2, Unit 6 \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: the fixture says soft match isn't blocked, and an approved matching window ends today. What does the check report tomorrow, if nothing changes? The answer is b: Fail. The day after the window's last day, the same state is a Finding again. You saw that in step two of the lab. Second: a response comes back without the block soft match enabled property. What does the check report? The answer is b: a Finding, because a missing value reads as off. You saw that in step seven, when the pass fixture failed. The module page has two more questions, on why the check is left out of a default run and where a new HTTP call belongs, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary, and next: Module 3, dynamic rules as code");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Built your understanding of a check, from its catalog entry to its safety tests",
    "Saw Pass, Fail and Warn, and a window that ends on its own",
    "Saw how one check asks for the least privilege it can",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 3: Keep dynamic rules as code", [
    "One reviewed file per group",
    "A linter for the guards",
    "A shadow diff and a pause manifest",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Before shipping a new check: ",
    "work through the Chapter 03 checklist in Book 19.");
  sources(s, "Sources: Module 2, Unit 7 \"Summary\"; Module 3, \"Unit 1: Introduction.\"");
  notes(s,
`To sum up. You built your understanding of a check from its catalog entry to its safety tests, and saw how one check asks for the least privilege it can when its read needs the most powerful role. The evidence an ISSO keeps: the run's results, details, summary and validation manifest, in the evidence store; the window date and its change record; the Entra sign-in log for the one privileged export; and the change record for any remediation, which is never made by the check. Before shipping a new check, work through the Chapter 03 checklist. Next is Module 3: keep dynamic rules as code. A dynamic rule is access policy, and one edit can remove hundreds of people at once. You'll keep each rule as a reviewed file with tests and a linter, see whom a change adds and removes, and pause and resume safely in an incident.`,
  `${M} — Unit 7 "Summary"; Module 3 — "Unit 1: Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 2 deck", [
  "Module page: docs/training/attribute-driven-migration/02-a-validation-kit-check.md (Attribute-Driven Migration learning path, Module 2): Units 1 to 7, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design: Book 19, Chapter 03 \"Why this check,\" \"The anatomy of a check,\" \"The catalog entry, and the lesson in it,\" \"The function,\" \"Rows and outcome,\" \"The safety tests,\" Lab 2, Checklist; the implementation guide's Gate 3 and \"Where the kits stop.\"",
  "Kit: examples/validation-kit (powershell/ValidationKit: Private/Catalog.ps1, Checks/SYNC.ps1; tests/fixtures/pass and fail; tests/powershell). Fictional tenant. Illustrative: tested against fixtures, not against a production tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7.6.9 in a scratch copy of examples/validation-kit; it matches the module page and data/kit-captures/adm (03-1 to 03-8). Verification: docs/training/attribute-driven-migration/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
