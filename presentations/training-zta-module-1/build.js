// Zero Trust Assessment learning path, Module 1: Evidence, not a verdict — the module's narrated deck.
// Teaches docs/training/zero-trust-assessment/01-evidence-not-a-verdict.md, Learn-style: objectives, the concepts, two
// "Try it" slides with the real Lab 1 commands and output (run November 12, 2026 in a scratch copy of
// examples/zta-results, the same output the page shows), the decision record and who reads the report, the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, the
// Zero Trust Assessment implementation guide it sends the learner to (Steps 1, 6 and 7, and their footnotes), Book 11,
// Chapter 05, or the kit; the deck adds none. The module page is a draft awaiting review, and the title slide says so.
// Helpers: ./shared.js (which wraps ../training-ms-automation-module-1/shared.js).
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-zta-module-1/build.js \
//                      presentations/training-zta-module-1/Training_ZTA_Module_1.pptx
const P = require("./shared.js")({
  title: "Module 1: Evidence, not a verdict",
  footer: "Federal Modernization Workbook  ·  Zero Trust Assessment learning path, Module 1: Evidence, not a verdict",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_ZTA_Module_1.pptx";
const M = "Training, Zero Trust Assessment, Module 1";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SW = "Who reads it";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 1: Evidence, not a verdict", "The Zero Trust Assessment as Evidence · What the assessment checks, and how to read what it reports",
    ["What it checks  ·  Four things it isn't  ·  Alongside ScubaGear  ·  The rubric and six statuses", "Why skipped isn't failed  ·  Try it: Lab 1  ·  The decision record  ·  Evidence"]);
  notes(s,
`Welcome to Module 1 of the learning path, The Zero Trust Assessment as Evidence: evidence, not a verdict. A note first: this module is a draft, awaiting the editor's review, so recheck it after the review. Microsoft's Zero Trust Assessment is a PowerShell module that tests a tenant against hundreds of configuration items drawn from Microsoft's configuration guidance. It produces a reading of the configuration on one day. In this module you'll learn what that reading can and can't tell you. Then, on a fictional export, you'll see why the tool's six statuses have to be sorted before anyone counts them. The path follows the ten steps of the Zero Trust Assessment implementation guide; this module covers Steps 1 and 6, and takes about forty minutes.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: a reading on one day, not a verdict");
  tag(s, "Why");
  const l = panel(s, "Is", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "WHAT THE ASSESSMENT IS", null, [
    "A PowerShell module that tests a tenant against Microsoft's configuration guidance",
    "Release 3.1.0: 364 tests in seven pillars",
    "Read-only, free, and the assessment part of Microsoft's Zero Trust Workshop",
  ], 13.5);
  const r = panel(s, "Doesnt", 0.6 + W2 + G2, 1.45, W2, null, HEX.red, HEX.redTint, "WHAT ITS REPORT DOESN'T TELL YOU", null, [
    "What a skipped test means",
    "What to fix first",
    "When a finding is closed",
  ], 13.5);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaScaleBalanced", HEX.red, "This module: ",
    "what the reading can and can't tell you, and why the tool's six statuses are sorted before anyone counts them.");
  sources(s, "Sources: Module 1, \"Introduction\"; Guide, Step 1; Microsoft Learn, What is the Zero Trust Assessment?; Zero Trust Assessment release 3.1.0.");
  notes(s,
`Why does this matter? The Zero Trust Assessment tests a tenant against hundreds of configuration items from Microsoft's guidance for Entra, Intune, Azure networking and Purview. Release three point one point oh, the current release, holds three hundred sixty-four tests in seven pillars. It's read-only, it's free, and it's the assessment component of Microsoft's Zero Trust Workshop. The report is accurate on the day it runs. What it doesn't do is tell you what a skipped test means, what to fix first, or when a finding is closed. Those are decisions for named people, and the report is the evidence they decide with. That's the title of this module: evidence, not a verdict.`,
  `${M} — "Introduction"; learning path index; guide, Step 1.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Say what the Zero Trust Assessment checks, and name the four things it isn't",
    "Explain why it doesn't replace ScubaGear under BOD 25-01",
    "Read the Risk Level, User Impact and Implementation Cost rubric",
    "Name the six statuses, and sort a skip reason into the taxonomy",
  ], [
    "Book 11, Chapter 05: the two assessment tools",
    "PowerShell 7.1 or later",
    "The kit's folder, examples/zta-results",
  ], 40);
  sources(s, "Sources: Module 1, \"Learning objectives,\" \"Prerequisites\"; learning path index; Book 11, Ch 05.");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about forty minutes with the lab. You'll say what the Zero Trust Assessment checks, and name the four things it isn't. You'll explain why it doesn't replace ScubaGear under CISA's directive B O D twenty-five oh-one. You'll read Microsoft's rubric: risk level, user impact and implementation cost. And you'll name the six statuses a test can end in, and sort a skip reason into the program's normalized taxonomy. Before you start, read the chapter on the two assessment tools in Zero Trust and Assessment; Unit 1 reads it with you. For the lab you need PowerShell seven point one or later, and the kit's folder, examples slash z t a results. No tenant is needed.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Four things it isn't
{
  const s = content(SC, "What it checks, and four things it isn't");
  tag(s, "What");
  const p1 = panel(s, "Checks", 0.6, 1.45, 12.15, null, HEX.navy, HEX.navyTint, "WHAT IT CHECKS", null, [
    "Hundreds of items from Microsoft's configuration guidance for Entra, Intune, Azure networking and Purview",
    "Seven pillars: Identity, Devices, Network, Data, Infrastructure, Security Operations and AI",
  ], 13);
  const tb = table(s, "Isnt", p1 + 0.2, [2.7, 9.45], ["It isn't", "What the module says"], [
    ["A verdict", "A finding is evidence for a decision a named person makes; a pass rate isn't a maturity stage"],
    ["A substitute for ScubaGear", "BOD 25-01 names CISA's SCuBA tools; ScubaGear covers products the Zero Trust Assessment doesn't test"],
    ["A supported product", "A community project maintained by Microsoft employees, provided as is"],
    ["A detector", "Microsoft's operations guidance calls it a configuration-posture check, to be paired with alerts"],
  ], { fontSize: 12.5, limit: 6.0 });
  line(s, "Record", "The decision record writes each of these down, with the scope, the run account, the cadence and the pinned version.", tb + 0.15, 0.4, 13.5);
  sources(s, "Sources: Module 1, Unit 1; Guide, Step 1; Microsoft Learn, What is the Zero Trust Assessment?; Operate Microsoft Entra Private Access; Zero Trust Assessment README.");
  notes(s,
`Unit 1: what it checks, and what it isn't. Microsoft Learn says the assessment tests hundreds of items from Microsoft's configuration guidance for Entra, Intune, Azure networking and Purview. The tool's release three point one point oh sorts its tests into seven pillars: identity, devices, network, data, infrastructure, security operations, and A I. Now the four things it isn't. It isn't a verdict: a finding is evidence for a decision a named person makes, and a pass rate isn't a maturity stage. It isn't a substitute for ScubaGear, which is the next slide. It isn't a supported product: its read me calls it a community project maintained by Microsoft employees, provided as is. And it isn't a detector: Learn's operations guidance for Global Secure Access calls it a configuration-posture check, to be paired with alerts. The program's decision record writes each of these down, with the scope, the run account, the cadence and the pinned tool version.`,
  `${M} — Unit 1 "What it checks, and what it isn't"; guide, Step 1; Microsoft Learn — "What is the Zero Trust Assessment?," "Operate Microsoft Entra Private Access"; Zero Trust Assessment README (3.1.0).`);
}

// ================================================================== 5 ScubaGear
{
  const s = content(SC, "Alongside ScubaGear under BOD 25-01, never instead");
  tag(s, "Why");
  const tb = table(s, "Cover", 1.45, [3.75, 4.6, 3.8], ["ScubaGear only", "Both", "Zero Trust Assessment only"], [
    ["Exchange Online mail flow: external forwarding, SPF, DKIM, DMARC", "Entra ID identity: legacy authentication, MFA, Conditional Access, privileged roles", "Intune device compliance and configuration"],
    ["Teams meeting and external-access policies", "Defender for Office 365 threat policies: Safe Links, Safe Attachments, anti-phishing", "Azure networking and infrastructure; Global Secure Access"],
    ["SharePoint and OneDrive sharing; Power Platform", "", "Purview labels, data loss prevention; security operations"],
  ], { fontSize: 12, limit: 4.7 });
  callout(s, "Directive", tb + 0.3, 1.0, "FaTriangleExclamation", HEX.red, "BOD 25-01 names CISA's SCuBA tools: ",
    "dropping ScubaGear because the Zero Trust Assessment covers identity leaves mail flow, Teams, sharing and Power Platform unassessed.");
  sources(s, "Sources: Module 1, Unit 1; Book 11, Ch 05 (Where they overlap, and where they don't); Guide, Step 1; CISA BOD 25-01; CISA ScubaGear.");
  notes(s,
`The second point deserves its own slide. CISA's directive B O D twenty-five oh-one names CISA's SCuBA tools, and the Zero Trust Assessment isn't one of them. The chapter on the two tools in Zero Trust and Assessment lays out where they overlap. Only ScubaGear covers Exchange Online mail flow, such as external forwarding, S P F, D-kim and D-mark; Teams meeting and external-access policies; SharePoint and OneDrive sharing; and Power Platform. Both cover Entra I D identity, such as legacy authentication, M F A, Conditional Access and privileged roles, and Defender for Office three sixty-five threat policies. Only the Zero Trust Assessment covers Intune devices, Azure networking and Global Secure Access, Purview, and security operations. So an agency that already runs the Zero Trust Assessment monthly still runs ScubaGear. The first runs alongside the second, never instead of it.`,
  `${M} — Unit 1; Book 11, Chapter 05 — "Where they overlap, and where they don't"; guide, Step 1 ("Not a substitute for ScubaGear").`);
}

// ================================================================== 6 Rubric
{
  const s = content(SC, "Reading the report: Microsoft's three-scale rubric");
  tag(s, "What");
  const tb = table(s, "Rubric", 1.45, [2.75, 3.4, 2.8, 3.2], ["Scale", "High", "Medium", "Low"], [
    ["Risk Level", "Potential environment-wide exposure until mitigated", "Moderate exposure", "Defense in depth or an operational optimization"],
    ["User Impact", "Many non-privileged users act or are told", "A subset of users", "Administrators act; users needn't be told"],
    ["Implementation Cost", "Programs needing ongoing commitment", "Projects", "Targeted actions"],
  ], { fontSize: 12.5, limit: 4.4 });
  const p = panel(s, "Report", 0.6, tb + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "THE REPORT", null, [
    "An Overview tab, then a tab per pillar; each test shows its risk and its status",
    "A selected test describes what was tested and the recommended remediation",
    "The tool's source adds Critical and Unranked to the risk levels",
  ], 13);
  sources(s, "Sources: Module 1, Unit 2; Guide, Step 6; Microsoft Learn, Zero Trust Assessment terminology; Get started with the Zero Trust Assessment.");
  notes(s,
`Unit 2 reads the report. It opens on an overview tab, then a tab for each pillar. Each test shows its risk and its status, and selecting a test describes what was tested and the recommended remediation. Every test carries three ratings from Microsoft's rubric, defined on Learn's terminology page. Risk level: high means potential environment-wide exposure until it's mitigated; medium, moderate exposure; low, defense in depth or an operational optimization. User impact: high means many non-privileged users have to act or be told; low means only administrators act. And implementation cost: high is a program needing ongoing commitment, medium a project, low a targeted action. The tool's own source adds two more risk levels, critical and unranked. These ratings feed the weighting you'll meet in Module 3. They aren't a priority on their own.`,
  `${M} — Unit 2 "Reading the report"; guide, Step 6 (the rubric table, the report's tabs); Microsoft Learn — "Zero Trust assessment terminology," "Get started with the Zero Trust Assessment."`);
}

// ================================================================== 7 Six statuses
{
  const s = content(SC, "Six statuses a test can end in");
  tag(s, "What");
  const tb = table(s, "Status", 1.45, [2.6, 9.55], ["Status", "What it means"], [
    ["Passed", "The configuration matched"],
    ["Failed", "It didn't"],
    ["Investigate", "The tool needs a person to look before it's a finding or not"],
    ["Skipped", "The test didn't run, with a reason: not licensed, not connected, not applicable, not supported, timed out"],
    ["Planned", "The test is still under construction in the tool"],
    ["Error", "The test couldn't be evaluated"],
  ], { fontSize: 13, limit: 4.7 });
  callout(s, "Owner", tb + 0.3, 1.0, "FaUserCheck", HEX.teal, "Each pillar owner notes: ",
    "every Investigate, Skipped and Error result, and every Failed result whose feature may not exist in the tenant's cloud.");
  sources(s, "Sources: Module 1, Unit 2; Guide, Step 6; the tool's 3.1.0 source (Get-ZtTestStatus, the skip reasons).");
  notes(s,
`Each test ends in one of six statuses, from the tool's own source. Passed: the configuration matched. Failed: it didn't. Investigate: the tool needs a person to look before it's a finding or not. Skipped: the test didn't run, and it carries a reason, such as not licensed, not connected, not applicable, not supported, or timed out. Planned: the test is still under construction in the tool. And error: the test couldn't be evaluated. A pillar owner reads their tab with the risk and status filters, and notes every investigate, skipped and error result, with its reason. They also note every failed result whose feature may not exist in the tenant's cloud. That last case matters for federal tenants, and we'll come back to it.`,
  `${M} — Unit 2 (the statuses table); guide, Step 6; the tool's 3.1.0 source — Get-ZtTestStatus.ps1, Add-ZtTestResultDetail.ps1.`);
}

// ================================================================== 8 Skipped isn't failed
{
  const s = content(SC, "Why skipped isn't failed: the normalized taxonomy");
  tag(s, "What");
  const tb = table(s, "Tax", 1.45, [2.6, 6.3, 3.25], ["Normalized result", "From the tool", "Counted as"], [
    ["Pass", "Passed", "Evidence of conformance for that run"],
    ["Fail", "Failed; Investigate until reviewed", "A finding"],
    ["Planned", "Planned", "Neither"],
    ["Skipped-Licensing", "Not licensed for the feature", "Neither; a licensing decision"],
    ["Skipped-Disconnected", "A service wasn't connected", "Neither; a gap in the run"],
    ["Skipped-Not-Applicable", "NotApplicable, NotDotGovDomain, NotSupported", "Neither; a recorded reason"],
    ["Unable-to-Evaluate", "Error; TimeoutReached; anything unlisted", "Neither; fix the run"],
  ], { fontSize: 12, limit: 5.3 });
  line(s, "Twice", "Every result is recorded twice: the tool's value, unchanged, and one of seven normalized results.", tb + 0.15, 0.4, 13.5);
  sources(s, "Sources: Module 1, Unit 3; Book 11, Ch 10 (A normalized result taxonomy); Guide, Step 7.");
  notes(s,
`Unit 3 is the rule this whole path rests on: a skipped test is not a failed control. The program records every result twice: the tool's value, unchanged, and one of seven normalized results, from the taxonomy in Evidence, Not Verdicts, a chapter of Zero Trust and Assessment. Passed is a pass. Failed is a finding, and so is investigate, until a person reviews it. Planned is neither. A test skipped for a missing license is a licensing decision. One skipped because a service wasn't connected is a gap in the run. One skipped as not applicable gets a recorded reason. And an error, a timeout, or any value the taxonomy doesn't list is unable to evaluate: fix the run, or verify by hand. None of those skips is a failed control, and none of them is a pass. Each one goes in its own column, with its reason.`,
  `${M} — Unit 3 "Why skipped isn't failed"; Book 11, Chapter 10 — "A normalized result taxonomy"; guide, Step 7 (the taxonomy table).`);
}
endModule(SC);

// ================================================================== 9 Try it: metadata and counts
{
  const s = content(SL, "Try it: read the export and count its statuses");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/zta-results (the fictional Contoso export of October 27)",
    "$ $e = Get-Content -Raw tests/fixtures/run-2026-10-27/zt-export/ZeroTrustAssessmentReport.json | ConvertFrom-Json",
    "$ $e | Select-Object CurrentVersion, TenantName, @{ n = 'Tests'; e = { $_.Tests.Count } }, EndOfJson | Format-List",
    "CurrentVersion : 3.1.0",
    "TenantName     : Contoso",
    "Tests          : 33",
    "EndOfJson      : EndOfJson",
    "$ $e.Tests | Group-Object TestStatus -NoElement | Sort-Object Name | Format-Table Name, Count",
    "Name        Count",
    "----        -----",
    "Error           1",
    "Failed         16",
    "Investigate     1",
    "Passed          8",
    "Planned         1",
    "Skipped         6",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (THE SAME AS THE PAGE)", pt: 10.5 });
  line(s, "Read", "EndOfJson is the marker the tool writes last: a file without it is incomplete. A pass rate here would divide 8 by a total that moves.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 1 and 2; examples/zta-results: tests/fixtures/run-2026-10-27.");
  notes(s,
`Try it. Lab 1 runs on the kit's fixtures, with no tenant: a fictional Contoso export in the shape release three point one point oh writes. Step one reads the export's metadata, from the jay-son file the tool writes under its zt-export folder. It's version three point one point oh, tenant Contoso, thirty-three tests, and it ends with the end-of-jay-son marker. That marker is the last thing the tool writes, so a file without it is incomplete. Step two counts the tool's statuses: one error, sixteen failed, one investigate, eight passed, one planned, and six skipped. Now think about a pass rate. It would divide eight by a total that moves with licensing and connections. Connect one more service next month and the rate changes, though nothing in the tenant did. That's why the program doesn't report one.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2.`);
}

// ================================================================== 10 Try it: skips and taxonomy
{
  const s = content(SL, "Try it: sort the skip reasons into the taxonomy");
  tag(s, "How");
  const c = code(s, "Lab3", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 3 and 4 (step 4's foreach shortened on the slide; the page has it in full)",
    "$ $e.Tests | Where-Object TestStatus -In 'Skipped', 'Planned' | Sort-Object TestId | Format-Table TestId, TestStatus, TestSkipped",
    "TestId TestStatus TestSkipped",
    "------ ---------- -----------",
    "21800  Planned    UnderConstruction",
    "21883  Skipped    NotLicensedEntraWorkloadID",
    "25416  Skipped    NotApplicable",
    "27018  Skipped    NotApplicable",
    "35005  Skipped    NotConnectedToService",
    "41050  Skipped    TimeoutReached",
    "61009  Skipped    NoCompatibleLicenseFound",
    "$ Import-Module ./powershell/ZtaResults/ZtaResults.psm1",
    "$ foreach ($s in ...) { '{0,-28} {1}' -f $s, (ConvertTo-ZtaResult -Test @{ ... TestSkipped = $s }).normalized }",
    "NotLicensedEntraWorkloadID   Skipped-Licensing",
    "NotConnectedToService        Skipped-Disconnected",
    "NotApplicable                Skipped-Not-Applicable",
    "TimeoutReached               Unable-to-Evaluate",
    "Investigate                  Fail",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (THE SAME AS THE PAGE)", pt: 10 });
  line(s, "Read", "Four skips, four different meanings, and none of them a failure. Investigate is a finding until someone reviews it.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 3 and 4; examples/zta-results: ZtaResults.psm1 (ConvertTo-ZtaResult), config/taxonomy.json.");
  notes(s,
`Step three lists what didn't run, with its reason. One test is planned, under construction. The six skips carry five different reasons: not licensed for workload I D, two not applicable, not connected to a service, a timeout, and no compatible license found. Step four sorts those reasons with the kit's own function, convert to Z T A result. Not licensed becomes skipped, licensing. Not connected becomes skipped, disconnected. Not applicable stays skipped, not applicable. The timeout becomes unable to evaluate. And an investigate result becomes fail. So that's four skips, four different meanings, and none of them a failure. The investigate result is a finding until someone reviews it, which you'll do in Module 3. The page lists every command for the lab in order, ready to paste.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," steps 3 and 4; examples/zta-results — ZtaResults.psm1, config/taxonomy.json.`);
}
endModule(SL);

// ================================================================== 11 Who reads it
{
  const s = content(SW, "Who decides: the decision record and the owners");
  tag(s, "Who");
  const l = panel(s, "Record", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "THE DECISION RECORD (STEP 1)", "The CISO approves it", [
    "Scope: the tenant, the pillars, the Azure subscriptions for Infrastructure",
    "The run account, the cadence, the pinned version",
    "Telemetry, and where the output goes",
  ], 12.5);
  const r = panel(s, "Owners", 0.6 + W2 + G2, 1.45, W2, null, HEX.teal, HEX.tealTint, "THE PILLAR OWNERS (STEP 6)", "They read their own tab", [
    "With the risk and status filters",
    "Note each Investigate, Skipped and Error result",
    "And each Failed result whose feature may not exist in the cloud",
  ], 12.5);
  panel(s, "Fed", 0.6, Math.max(l, r) + 0.2, 12.15, null, HEX.amber, HEX.amberTint, "IN A FEDERAL TENANT", null, [
    "GCC, the workbook's baseline: the default Global environment and the worldwide Graph and Azure endpoints",
    "GCC High and DoD: Learn says impersonation protection and spoof intelligence aren't yet available, so a failed impersonation test is a boundary finding",
  ], 12.5);
  sources(s, "Sources: Module 1, Units 1 and 2; Guide, Steps 1, 4 and 6; Microsoft Learn, Exchange Online for US government; Microsoft Graph national cloud deployments.");
  notes(s,
`Who decides? The decision record, from the guide's Step 1, scopes each run: the tenant, the pillars, and the Azure subscriptions for the infrastructure pillar; the run account; the cadence; the pinned tool version; telemetry; and where the output goes. The see-so approves it. Then each pillar owner reads their own tab, with the filters, and notes every investigate, skipped and error result, and every failed result whose feature may not exist in the tenant's cloud. For a G C C tenant, the workbook's baseline, the tool uses the worldwide endpoints. In G C C High and D O D, there's a case to know. Learn's Exchange Online service description says anti-phishing impersonation protection and spoof intelligence aren't yet available there. So a failed impersonation test in those clouds is a boundary finding, not a configuration change to make today.`,
  `${M} — Unit 1 (the decision record), Unit 2 (pillar owners; the GCC High example); guide, Step 1 (steps 1 to 3), Step 4, Step 6; "Government-cloud availability"; Microsoft Learn — "Exchange Online for US government environments," "Microsoft Graph national cloud deployments."`);
}
endModule(SW);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 1");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.0, 2.6, 4.55], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["CA-2: plan the assessment and its scope", "KSI-PIY-RIS", "The approved decision record"],
    ["CA-2: assessment results reviewed by the owners", "KSI-PIY-RIS", "Each pillar owner's dated reading notes"],
    ["CA-7: the frequency of assessment", "KSI-MLA-EVC", "The calendar entry and its owner"],
  ], { fontSize: 13, limit: 4.0 });
  callout(s, "KSI", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "KSIs are FedRAMP 20x indicators ",
    "for cloud service providers. The agency lines its own evidence up with them; it doesn't report KSIs itself.");
  sources(s, "Sources: Module 1, \"The federal requirement,\" \"Summary\"; Guide, Steps 1 and 6; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs; Book 00, App B.");
  notes(s,
`The federal requirement. Scoping and reading the assessment supports two controls in NIST special publication eight hundred fifty-three, revision five: C A two, control assessments, and C A seven, continuous monitoring. The approved decision record evidences planning the assessment and its scope. Each pillar owner's dated reading notes evidence that the owners reviewed the results. And the calendar entry, with its owner, evidences the frequency of assessment. Each row also names a fed-ramp twenty X key security indicator. Those indicators are written for cloud service providers. The agency lines its own evidence up with them; it doesn't report them itself. The evidence supports the controls, and the assessor decides. So the evidence an I S S O keeps from this module is the approved decision record and each owner's dated reading notes.`,
  `${M} — "The federal requirement" table; "Summary"; guide, Steps 1 and 6 (requirements and evidence); Book 00, Appendix B.`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on Module 1", [
    { q: "An agency already runs the Zero Trust Assessment monthly. Can it stop running ScubaGear?", options: ["a. Yes: the Zero Trust Assessment covers identity", "b. No: BOD 25-01 names CISA's SCuBA tools, and ScubaGear covers products the assessment doesn't test", "c. Only in GCC High"] },
    { q: "A test is Skipped with NotLicensedEntraIDP2. How is it counted?", options: ["a. As a failed control", "b. As a pass, because nothing was found", "c. As Skipped-Licensing: a licensing decision, neither a failure nor a pass"] },
  ], "1 b: run both, alongside each other. 2 c: a skip goes in its own column, with its reason.");
  sources(s, "Sources: Module 1, \"Knowledge check,\" questions 1 and 2; Unit 1; Unit 3; Book 11, Ch 05.");
  notes(s,
`Check yourself with two questions. First: an agency already runs the Zero Trust Assessment monthly. Can it stop running ScubaGear? The answer is b, no. CISA's directive names CISA's SCuBA tools, and ScubaGear covers Exchange Online, Teams, SharePoint and Power Platform policies the Zero Trust Assessment doesn't test. Second: a test is skipped with the reason not licensed Entra I D P two. How is it counted? The answer is c: skipped, licensing. It's a licensing decision, neither a failure nor a pass. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 2, and "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: evidence, not a verdict");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Saw what the Zero Trust Assessment checks, and four things it isn't",
    "Placed it alongside ScubaGear, never instead",
    "Read the rubric and the six statuses",
    "Sorted a fictional export's skips into the taxonomy",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2", [
    "Running the assessment safely: the host, consent, each cloud, the run and its hashes",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.85, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the approved decision record, and each pillar owner's dated reading notes.");
  sources(s, "Sources: Module 1, \"Summary\"; learning path index; Module 2.");
  notes(s,
`To sum up. You saw what the Zero Trust Assessment checks, and the four things it isn't: a verdict, a substitute for ScubaGear, a supported product, or a detector. You placed it alongside ScubaGear, never instead. You read Microsoft's rubric and the tool's six statuses. And in Lab 1 you sorted a fictional export's skips into the program's taxonomy, and saw why none of them is a failure or a pass. The evidence an I S S O keeps from this module is the approved decision record, and each pillar owner's dated reading notes. Next is Module 2, running the assessment safely: the host, consent and roles, connecting in each cloud, and the run and its hashes.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/zero-trust-assessment/01-evidence-not-a-verdict.md (The Zero Trust Assessment as Evidence, Module 1), a draft awaiting review; the path's verification log is docs/training/zero-trust-assessment/_verification/learning-path.md.",
  "Zero Trust Assessment: An Implementation Guide, Steps 1, 4, 6 and 7 and \"Government-cloud availability\"; its footnotes carry each source, read November 11, 2026: Microsoft Learn, What is the Zero Trust Assessment?; Get started with the Zero Trust Assessment; Zero Trust assessment terminology; Operate Microsoft Entra Private Access; Exchange Online for US government; Microsoft Graph national cloud deployments.",
  "The tool, release 3.1.0: Zero Trust Assessment release 3.1.0; Zero Trust Assessment README; its source for the statuses and the skip reasons. CISA BOD 25-01; CISA ScubaGear.",
  "Book 11, Chapter 05 (the two tools) and Chapter 10 (A normalized result taxonomy). NIST SP 800-53 Rev. 5 (CA-2, CA-7); FedRAMP 20x KSIs, as Book 13, Appendix A maps them; Book 00, Appendix B.",
  "Lab output: examples/zta-results (ZtaResults.psm1, config/taxonomy.json, tests/fixtures/run-2026-10-27), run November 12, 2026 with PowerShell 7.6, the same as the page; step 4's foreach is shortened on the slide.",
]);

finish(OUT);
