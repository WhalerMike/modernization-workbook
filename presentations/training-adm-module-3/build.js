// Attribute-Driven Migration learning path, Module 3: Keep dynamic rules as code — the module's narrated deck.
// Teaches docs/training/attribute-driven-migration/03-dynamic-rules-as-code.md, Learn-style: objectives, the concepts,
// "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/dynamic-rules,
// with its pinned Learn samples and Book 03, in a throwaway Git repository), Lab 2, the federal requirement and evidence, a
// two-question check, and the summary. Every fact comes from the module page, the learning path's verification log,
// Book 19 Chapter 04, or the kit (examples/dynamic-rules); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-adm-module-3/build.js \
//                      presentations/training-adm-module-3/Training_ADM_Module_3.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 3: Keep dynamic rules as code",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration learning path, Module 3: Dynamic rules as code",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Attribute-Driven Migration learning path — Module 3: Keep dynamic rules as code";
const OUT = process.argv[2] || "Training_ADM_Module_3.pptx";
const M = "Training, Attribute-Driven Migration, Module 3";

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
  const s = title(SI, "Module 3: Keep dynamic rules as code", "Attribute-Driven Migration learning path · Guide Gate 4, with Book 19 Chapter 04",
    ["The guards  ·  What Learn's samples leave to you  ·  One file per group", "The linter  ·  The shadow diff  ·  The pause manifest  ·  Try it: Lab 1  ·  Lab 2"]);
  notes(s,
`Welcome to Module 3 of the Attribute-Driven Migration learning path: keep dynamic rules as code. This module serves Gate 4, the dynamic group library and administrative units, and takes Chapter 04 of Building the Attribute-Driven Migration. You'll write each dynamic group as a reviewed file with tests, lint it for the guards every user rule needs, show whom a change adds and removes, and see how to pause and resume safely in an incident. In the lab you'll run Microsoft Learn's own incident samples against a fake tenant, lint the program's rule pattern table, evaluate a rule against a fictional population, run the pull request check, and break a rule on purpose. The code is illustrative: tested against fixtures and a fake tenant, and the evaluator follows Microsoft Learn's page on dynamic membership rules but isn't the service.`,
  `${M} — Unit 1 "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a dynamic rule is access policy");
  tag(s, "Why");
  const b = table(s, "Gate", 1.45, [3.0, 9.15], ["Gate 4 asks for", "Why"], [
    ["Rules on codes", "\"Who sits under the Finance branch\" becomes \"who carries the Finance code\""],
    ["Guards", "One edit can remove hundreds of people at once"],
    ["Tests against named users", "So a reviewer can see what the rule does before it ships"],
    ["A shadow first", "Before the rule grants anything"],
  ], { fontSize: 13.5, limit: 4.4 });
  callout(s, "Point", b + 0.35, 0.95, "FaUserShield", HEX.red, "This module: ",
    "keep the rules as files in Git, with tests and a linter, and see what Learn's incident samples do when a group was paused on purpose.");
  sources(s, "Sources: Module 3, Unit 1 \"Introduction\"; the implementation guide's Gate 4 (this workbook's guidance).");
  notes(s,
`Why does this matter? Gate 4 replaces "who sits under the Finance branch" with "who carries the Finance code." In this workbook's design, HR attributes land in coded slots, and dynamic membership rules read those slots. So a dynamic rule is access policy, and one edit can remove hundreds of people at once. That's why the implementation guide asks for every rule on codes, with guards, tested against named users, and shadowed before it grants anything. In this module you keep the rules as files in Git, with tests and a linter, so a rule change gets the same review as any other code. And you see what Microsoft Learn's incident samples do when a group was paused on purpose before the incident.`,
  `${M} — Unit 1 "Introduction"; Book 19, Chapter 04 — "Where the rules sit."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Describe what Learn's pause and resume samples do well, and what they leave to you",
    "Write a rule as one file with an owner and tests",
    "Explain the guards the linter enforces, and why it works on the parsed rule",
    "Run the pull request check and read its shadow diff",
    "Explain how the pause manifest keeps a resume from turning on a group paused on purpose",
  ], [
    "Module 2, for how the VK-DG checks Gate 4 names are built",
    "Optional: Microsoft Automation, Module 2",
    "PowerShell 7.1+ and Pester 5, and a Git clone: step 4 compares with HEAD",
  ], 50);
  sources(s, "Sources: Module 3, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll describe what Learn's pause and resume samples do well, and what they leave to you. You'll write a rule as one file, with an owner and tests. You'll explain the guards the linter enforces, and why it works on the parsed rule rather than its text. You'll run the pull request check and read its shadow diff. And you'll explain how the pause manifest keeps a resume from turning on a group that was paused on purpose. Before you start, finish Module 2, for how the validation kit's dynamic group checks are built. Microsoft Automation Module 2 is optional background on groups through Graph. You need PowerShell 7.1 or later, Pester 5, and a Git clone of the repository, because step four compares the library with HEAD.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Guards and the engine
{
  const s = content(SC, "The guards every rule needs, and the engine's limits");
  tag(s, "What");
  const l = panel(s, "Guards", 0.6, 1.45, 6.2, null, HEX.navy, HEX.navyTint, "EVERY GOVERNED RULE", "ANDs two guards at the top", [
    "(user.accountEnabled -eq true)",
    "(user.userType -eq \"Member\")",
    "Reads coded slots: extensionAttribute10 for organization, 11 for worker type, 12 for position category",
    "Never display names",
  ], 13);
  const r = panel(s, "Engine", 7.05, 1.45, 5.7, null, HEX.teal, HEX.tealTint, "WHAT LEARN SAYS ABOUT THE ENGINE", null, [
    "A rule body can't exceed 3,072 characters",
    "Comparisons aren't case sensitive: fin-led matches \"FIN-LED\"",
    "Changes usually apply within a few hours, but can take more than 24",
    "memberOf is a preview that ends November 3, 2026",
  ], 13);
  callout(s, "Earlier", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.navy, "Earlier than the kit: ",
    "VK-DG-01 to 07 read the rules live; this chapter moves the same checks into the pull request.");
  sources(s, "Sources: Module 3, Unit 2; Microsoft Learn: \"Manage rules for dynamic membership groups,\" \"Understand and manage dynamic group processing,\" memberOf (preview).");
  notes(s,
`In this workbook's design, every governed rule uses one of two patterns, and ANDs two guards at the top: the account is enabled, and the user type is Member. So a disabled account and a guest can never qualify. The rule reads coded slots: extension attribute ten for organization, eleven for worker type, twelve for position category. Never display names. Microsoft Learn sets the stakes. Its page on managing rules for dynamic membership groups says a rule body can't exceed three thousand seventy-two characters. String comparisons aren't case sensitive, so lower-case fin-led matches the upper-case code, and the HR side has to keep codes clean. Its page on dynamic group processing says changes are usually applied within a few hours, but can take more than twenty-four. And its member of page says that operator is a preview that ends on November third, 2026. The validation kit already reads the rules live, with its dynamic group checks. This chapter moves the same checks earlier, into the pull request that changes a rule.`,
  `${M} — Unit 2 "The gate and what Learn's samples leave to you"; Book 19, Chapter 04 — "Where the rules sit."`);
}

// ================================================================== 5 What Learn's samples leave
{
  const s = content(SC, "What Learn's incident samples leave to you");
  tag(s, "What");
  const b = table(s, "Gaps", 1.45, [5.0, 7.15], ["Learn's samples, run as published", "What examples/dynamic-rules adds"], [
    ["Pause all records nothing about what it paused", "New-DrPauseManifest records every state first"],
    ["Resume noncritical turns on a group paused on purpose", "Invoke-DrResume resumes only what this manifest paused"],
    ["An unknown cloud answer, such as GCCHigh, selects worldwide", "Get-DrGraphEndpoint refuses a cloud name it doesn't know"],
    ["Nothing in the resume scripts enforces a wait", "Noncritical resumes wait 24 hours by default"],
    ["Interactive only", "-Apply to act, a dry run without it, and a fake tenant in the tests"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Verdict", b + 0.3, 0.95, "FaTriangleExclamation", HEX.navy, "The verdict: ",
    "use Learn's samples as the model for the incident path, and keep them pinned; the runbook uses the manifest-based functions.");
  sources(s, "Sources: Module 3, Unit 2; Microsoft Learn, \"PowerShell samples for dynamic membership processing\" (pinned at 07cb73d); the kit's functions.");
  notes(s,
`Microsoft Learn publishes five PowerShell samples for dynamic membership processing, for an incident: when a rule change or a mass update starts moving members you didn't intend, pause processing, then resume it in order. The repository pins Learn's pages and runs the scripts, unmodified, against a fake tenant. They do a lot well: pause all skips a group already paused, and signs in to the chosen cloud with only the scopes it needs. But they leave you four things. Pause all records nothing about what it paused. Resume noncritical turns on every paused group, including one paused on purpose before the incident. An answer the cloud prompt doesn't recognize, such as G C C High, selects the worldwide endpoint. And nothing enforces a wait before a resume. The verdict, which is this workbook's guidance: use the samples as the model, and keep them pinned. The runbook uses the manifest-based functions, because during recovery the question is "what did we pause?"`,
  `${M} — Unit 2; Book 19, Chapter 04 — "What Learn gives you," "What they leave to you."`);
}

// ================================================================== 6 One file per group
{
  const s = content(SC, "One file per group, evaluated offline");
  tag(s, "What");
  const c = code(s, "File", 0.6, 1.45, 7.6, [
    "# rules/fin-led-not-contractors.json (trimmed)",
    "\"displayName\": \"FIN-LED everyone but contractors\",",
    "\"kind\": \"user\",",
    "\"owner\": \"FIN-LED access owner\",",
    "\"critical\": false,",
    "\"membershipRule\": \"(user.accountEnabled -eq true) -and",
    "  (user.userType -eq \\\"Member\\\") -and ...\",",
    "\"tests\": [",
    "  { \"member\": \"u01\", \"expected\": true },",
    "  { \"member\": \"u02\", \"expected\": false },",
    "  { \"member\": \"u06\", \"expected\": false } ]",
  ], { label: "THE LIBRARY  ·  ONE JSON FILE PER GROUP", pt: 11 });
  panel(s, "Parts", 8.45, 1.45, 4.3, null, HEX.teal, HEX.tealTint, "WHAT EACH PART DOES", null, [
    "owner approves changes",
    "critical: resumed first",
    "tests name fictional members",
    "Six rules: the program's patterns",
  ], 13);
  line(s, "Eval", "The offline evaluator is for tests and reviews, not the engine: it refuses memberOf and date comparisons rather than guess.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 3, Unit 3; the kit's design (examples/dynamic-rules/rules); Microsoft Learn, \"Manage rules for dynamic membership groups.\"");
  notes(s,
`Each group is a JSON file in the rules folder. Here's one: FIN-LED everyone but contractors. It's a user rule. The owner is the person who approves changes. The critical flag marks the groups an incident responder resumes first. The membership rule starts with the two guards. And the tests name members of a fictional population, built to exercise each guard: a disabled employee, a guest with a copied organization code, a worker with an empty worker-type slot, a lower-case code, a manager and their reports, and three devices. The library's six rules are the program's own rule patterns, with the guards in place. A parser follows the grammar on Microsoft Learn's page on dynamic membership rules, and an evaluator tests a parsed rule against each fixture member. It's for tests and reviews; it isn't the engine. It refuses member of and the date comparisons rather than guess.`,
  `${M} — Unit 3 "The library, the linter, the shadow diff and the pause"; Book 19, Chapter 04 — "One file per group," "Parse and evaluate offline."`);
}

// ================================================================== 7 Lint, shadow, pause
{
  const s = content(SC, "The linter, the shadow diff and the pause manifest");
  tag(s, "What");
  const b = table(s, "Tools", 1.45, [2.6, 9.55], ["Tool", "What it does"], [
    ["Test-DrRule", "Eleven lint rules, DR-01 to DR-11, on the parsed rule: a guard inside an -or protects nothing"],
    ["DR-03, DR-04", "The two guards must be ANDed at the top of every user rule"],
    ["DR-10 (Info)", "-ne on a coded slot also admits an empty slot; add (... -ne null) if it must not qualify"],
    ["Invoke-DrLibraryCheck", "The pull request check: lint, test, and each changed rule's adds and removes"],
    ["New-DrPauseManifest", "Records every collection's state before an incident pause"],
    ["Invoke-DrResume", "Resumes only collections this manifest paused, and refuses any other ID"],
  ], { fontSize: 12.5, limit: 5.3 });
  line(s, "Diff", "The shadow diff writes the adds and removes to out/check-results.json; the live equivalent is VK-DG-04.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 3, Unit 3; Book 19, Ch 04 \"Lint,\" \"The shadow diff,\" \"The pause manifest\"; examples/dynamic-rules README.");
  notes(s,
`Three tools do the governing. The linter applies eleven rules, D R oh one to D R eleven. Two matter most: D R oh three and oh four require the guards to be ANDed at the top of the rule. A guard inside an or protects nothing, and a regular expression over the rule text can't tell the difference. That's why the linter works on the parsed tree. D R ten is a note: not-equals on a coded slot also admits someone whose slot is empty, so add a not-null clause if an empty slot must not qualify. The pull request check lints every rule, runs every test, and for each rule file changed, prints whom the change adds and removes. That's the shadow diff. And the pause manifest records every collection's state before an incident pause. The resume touches only what that manifest paused, and refuses any other I D.`,
  `${M} — Unit 3; Book 19, Chapter 04 — "Lint," "The shadow diff," "The pause manifest."`);
}
endModule(SC);

// ================================================================== 8 Try it: Learn's samples
{
  const s = content(SL, "Try it: run Learn's samples against a fake tenant");
  tag(s, "How");
  const c = code(s, "Learn", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/dynamic-rules, in PowerShell 7",
    "$ . ./tests/LearnSampleHarness.ps1",
    "# a fake tenant: 'FIN-LED all members' On, 'Held for review' Paused before the incident",
    "$ Invoke-LearnSample -Page \"$pages/powershell-pause-all-dynamic-membership.md\" -Tenant $t -Answers $answers",
    "$ Invoke-LearnSample -Page \"$pages/powershell-resume-noncritical-dynamic-membership.md\" -Tenant $t ...",
    "$ $t.Collections.Values | Select-Object displayName, state",
    "FIN-LED all members On",
    "Held for review     On",
    "# the pause again, with GCCHigh as the cloud answer",
    "$ $t.Calls[0].Uri",
    "https://graph.microsoft.com/v1.0/groups?$filter=groupTypes%2Fany%28c%3Ac%20eq%20...",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "\"Held for review\" was paused on purpose, and the resume turned it on. GCCHigh reached the worldwide host.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 3, Lab 1, step 1; Microsoft Learn, \"PowerShell samples for dynamic membership processing\"; the kit's LearnSampleHarness.ps1.");
  notes(s,
`Try it. Lab 1 runs in the dynamic-rules folder of the examples, in PowerShell 7. Step one loads the harness, which extracts each of Microsoft Learn's sample scripts from its pinned page and runs it, unmodified, against a fake tenant. The tenant has two groups. FIN-LED all members is on. Held for review was paused before the incident, on purpose. Run Learn's pause all sample, then its resume noncritical sample, and read the states. Both groups are on. Held for review was paused on purpose, and the resume turned it on. Then run the pause again, with G C C High as the answer to the cloud prompt, and read the first call's address. It starts with graph dot microsoft dot com, the worldwide host. In a G C C High tenant, that run would sign in to the wrong cloud. The slide trims the setup commands; the module page has them in full.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," step 1.`);
}

// ================================================================== 9 Try it: lint, evaluate, check
{
  const s = content(SL, "Try it: lint the patterns, evaluate a rule, run the check");
  tag(s, "How");
  const c = code(s, "Lint", 0.6, 1.45, 12.15, [
    "# Step 2: lint the program's rule pattern table",
    "$ Get-Content ./tests/fixtures/book03-patterns.json -Raw | ConvertFrom-Json | ForEach-Object { Test-DrRule ... }",
    "Finding  DR-05 Legal employer Rule reads a display-name attribute instead of a coded slot",
    "Info     DR-03 Direct reports Direct reports rule: Learn says it cannot be combined with other rules, ...",
    "# Step 3: evaluate a rule against the population",
    "$ Get-DrMembers -Population $pop -Rule '(user.accountEnabled -eq true) -and (user.userType -eq \"Member\")",
    "    -and (user.extensionAttribute10 -eq \"FIN-LED\")'",
    "u01",
    "u02",
    "u06",
    "u08",
    "u09",
    "# Step 4: the pull request check",
    "$ pwsh ./powershell/Invoke-DrLibraryCheck.ps1 -BaseRef HEAD",
    "6 rule(s); 0 finding(s), 0 warning(s); 0 changed file(s)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED AND WRAPPED)", pt: 10 });
  line(s, "Read", "The guards keep out u04 (disabled) and u05 (a guest). The check exits 0.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 3, Lab 1, steps 2 to 4; the kit's fixtures (fictional); Microsoft Learn, \"Manage rules for dynamic membership groups\" (direct reports).");
  notes(s,
`Step two lints the program's own rule pattern table, this workbook's design. Two rows come back. The Legal employer pattern is a Finding, D R oh five: it reads a display-name attribute instead of a coded slot. The row exists to show that case. The Direct reports pattern is Info, D R oh three: Microsoft Learn's page on dynamic membership rules says that rule can't be combined with any other, so it carries no guards, and the group must not grant access on its own. Step three evaluates a rule against the fictional population: the two guards, and the FIN-LED organization code. Five members match: u oh one, oh two, oh six, oh eight and oh nine. The guards keep out u oh four, who is disabled, and u oh five, a guest with a copied code. Step four runs the pull request check against HEAD: six rules, no findings, no warnings, no changed files, and exit code zero.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 2 to 4.`);
}

// ================================================================== 10 Try it: break a rule
{
  const s = content(SL, "Try it: break a rule on purpose, then run the tests");
  tag(s, "How");
  const c = code(s, "Break", 0.6, 1.45, 12.15, [
    "# Step 5: delete the empty-slot clause from one rule, and run the check again",
    "$ (Get-Content -Raw $f).Replace(' -and (user.extensionAttribute11 -ne null)', '') | Set-Content -NoNewline $f",
    "$ pwsh ./powershell/Invoke-DrLibraryCheck.ps1 -BaseRef HEAD",
    "Info     DR-10 FIN-LED everyone but contractors user.extensionAttribute11 -ne also admits users whose",
    "                                                slot is empty; add (user.extensionAttribute11 -ne null) ...",
    "Finding  DR-11 FIN-LED everyone but contractors Expected u06 to be outside; the evaluator says True",
    "fin-led-not-contractors.json (changed): adds u06; removes",
    "6 rule(s); 1 finding(s), 0 warning(s); 1 changed file(s)",
    "(exit code 2)",
    "# put the clause back; then step 6, the tests",
    "$ Invoke-Pester ./tests",
    "Tests Passed: 70, Failed: 0, Skipped: 0, Inconclusive: 0, NotRun: 0",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "One clause gone: the linter notes it, u06's test fails, and the shadow diff shows exactly whom it adds.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 5 and 6; examples/dynamic-rules/rules/fin-led-not-contractors.json.");
  notes(s,
`Step five breaks a rule on purpose. You delete the empty-slot clause, extension attribute eleven not null, from the FIN-LED everyone but contractors rule, and run the check again. Three things catch it. The linter notes D R ten: not-equals on the worker-type slot also admits users whose slot is empty. The rule's own test fails, D R eleven: u oh six should be outside the group, and the evaluator now says true. u oh six is the worker with the empty worker-type slot. And the shadow diff prints the change: the file changed, and it adds u oh six. One finding, one changed file, and exit code two, so the pull request can't merge. Put the clause back. Step six runs the tests: all seventy pass, fifty-seven for the module and thirteen that run Learn's samples. No module, tenant or network needed.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 5 and 6; Book 19, Chapter 04 — "The tests."`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: create the groups paused, then drill a pause");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A test tenant, never production, with fictional users whose slots match the population fixture"],
    ["Sign in", "To the right cloud with the least you need: a Groups Administrator, delegated"],
    ["Create", "The library's groups, paused; compare the offline evaluator with Graph's beta evaluator"],
    ["Shadow and drill", "Turn processing on and shadow-diff live with VK-DG-04; drill a pause and resume"],
    ["Back it out", "Step 6 deletes the groups, then lists every dynamic group and unit that isn't on"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow Book 19, Chapter 04, Lab 2, step by step.");
  sources(s, "Sources: Module 3, Unit 5 \"Exercise: Lab 2 (your test tenant)\"; Book 19, Ch 04 \"Lab 2: test tenant.\"");
  notes(s,
`Lab 2 runs the library in a test tenant, never production, with fictional users whose slots match the population fixture. Sign in to the right cloud with the least you need: a Groups Administrator, in a delegated session. Create the library's groups paused, so nothing moves yet. Compare the offline evaluator with Graph's beta evaluator for every test, so you know the evaluator agrees with the engine. Then turn processing on and shadow-diff live with V K D G oh four, and drill an incident pause and resume with the manifest. To back it out, step six deletes the test groups, then lists every dynamic group and administrative unit that isn't on, to confirm nothing is left paused that the record didn't pause before. The authors haven't run Lab 2. Follow Chapter 04's Lab 2, step by step.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test tenant)"; Book 19, Chapter 04 — "Lab 2: test tenant."`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 3");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [4.3, 2.75, 5.1], ["Requirement", "KSI", "Evidence the ISSO keeps"], [
    ["AC-2; AC-3: guards keep disabled and guests out", "KSI-IAM-ELP", "The rule library and its fixture"],
    ["CM-3; CM-4: tests pass; adds and removes listed", "KSI-CMT-VTD; KSI-CMT-LMC", "The pull request, with out/check-results.json"],
    ["CM-3(2): a broken rule fails the check", "KSI-CMT-VTD", "The pull request's check run"],
    ["SA-11; SR-3: Learn's samples pinned", "KSI-SCR-MIT; KSI-CMT-VTD", "snapshot.json and LearnSamples.Tests.ps1"],
    ["CM-3: pause records first (Lab 2)", "KSI-CMT-LMC", "drill-manifest.json, with the drill record"],
    ["AC-6: only what's needed (Lab 2)", "KSI-IAM-ELP", "The Entra sign-in and audit logs"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them (design guidance).", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 3, Units 1 and 7; NIST SP 800-53 (SP 800-53B Moderate baseline); FedRAMP, \"Key Security Indicators.\"");
  notes(s,
`The federal requirement. The controls are NIST special publication eight hundred fifty-three controls in its Moderate baseline: A C two, A C three, C M three, C M four, C M three enhancement two, S A eleven, S R three and A C six. A rule change is a configuration change, and its review is the evidence. The guards keep disabled accounts and guests out, for account management and access enforcement; the evidence is the rule library and its fixture, in the repository. Every rule passes its tests and each change's adds and removes are listed, for change control and impact analysis; that's the pull request, with its check results. A broken rule fails the check, which is the testing of changes. Learn's samples run unchanged and are pinned, with their snapshot and tests. In Lab 2, the incident pause records each state first, and the resume touches only what it paused: the drill manifest. And the session asks only for what it needs, shown in the sign-in and audit logs. The Key Security Indicators come from FedRAMP's Key Security Indicators list. Which output supports which control is this workbook's reading.`,
  `${M} — Unit 1 "Introduction" (Chapter 04's requirements, KSIs and evidence); Unit 7 "Summary."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on rules as code", [
    { q: "Learn's resume sample runs after an incident. What happens to a group paused for review before it?", options: ["a. It stays paused", "b. It's turned on with the rest", "c. The sample asks first"] },
    { q: "Why does the linter work on the parsed rule, not on its text?", options: ["a. Parsing is faster", "b. A guard inside an -or protects nothing, and a text search can't tell the difference", "c. Learn requires it"] },
  ], "1 b: you saw it in step 1 of the lab; the pause manifest fixes it. 2 b: the guards must be ANDed at the top (DR-03, DR-04).");
  sources(s, "Sources: Module 3, Unit 6 \"Knowledge check,\" questions 1 and 2, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: Learn's resume sample runs after an incident. What happens to a group that was paused for review before the incident? The answer is b: it's turned on with the rest. You saw that in step one of the lab, and it's why the program's runbook uses the pause manifest, whose resume touches only what it paused. Second: why does the linter work on the parsed rule, not on its text? The answer is b: a guard inside an or protects nothing, and a text search can't tell the difference. The guards must be ANDed at the top of the rule. The module page has two more questions, on what the pull request check shows for a broken rule and which collections a responder can resume, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 2; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary, and next: Module 4, Group Policy as code");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Kept the rules as reviewed files with tests",
    "Linted them for the guards",
    "Saw whom a one-clause change adds",
    "Saw why an incident pause needs a record of what was paused before",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 4: Move Group Policy as code", [
    "A per-setting move plan",
    "Settings catalog files, reviewed",
    "Create only what a dry run showed",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Before shipping a rule change: ",
    "work through the Chapter 04 checklist in Book 19.");
  sources(s, "Sources: Module 3, Unit 7 \"Summary\"; Module 4, \"Unit 1: Introduction.\"");
  notes(s,
`To sum up. You kept the rules as reviewed files with tests, linted them for the guards, saw whom a one-clause change adds, and saw why an incident pause needs a record of what was paused before. The evidence an ISSO keeps: the rule library and its commits, and each pull request's check run and check results. In Lab 2, the Entra audit log for the paused creation, the evaluator comparison, the live shadow diff and the drill manifest. Before shipping a rule change, work through the Chapter 04 checklist. Next is Module 4: move Group Policy as code. The OU tree scoped Group Policy, and Group Policy inheritance retires with it. You'll turn Group Policy analytics into a per-setting move plan, keep settings catalog policies as reviewed files, and create only what a dry run showed, with the least permission that works.`,
  `${M} — Unit 7 "Summary"; Module 4 — "Unit 1: Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/attribute-driven-migration/03-dynamic-rules-as-code.md (Attribute-Driven Migration learning path, Module 3): Units 1 to 7, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design: Book 19, Chapter 04 \"Where the rules sit,\" \"What Learn gives you,\" \"What they leave to you,\" \"One file per group,\" \"Parse and evaluate offline,\" \"Lint,\" \"The shadow diff,\" \"The pause manifest,\" \"The tests,\" Lab 2, Checklist; the implementation guide's Gate 4.",
  "Kit: examples/dynamic-rules (README; powershell/DynamicRules.psm1; powershell/Invoke-DrLibraryCheck.ps1; rules/; tests/; tests/fixtures/population.json) and the pinned Learn pages in examples/third_party/dynamic-membership-samples. Fictional population. Illustrative.",
  "Lab output: run November 3, 2026 with PowerShell 7.6.9 in a scratch copy of examples/dynamic-rules, its pinned samples and Book 03, in a throwaway Git repository; it matches the module page and data/kit-captures/adm (04-1 to 04-9). Verification: docs/training/attribute-driven-migration/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
