// Non-Person Identity learning path, Module 6: Conditional Access for workload identities — the module's narrated deck.
// Teaches docs/training/non-person-identity/06-conditional-access.md, Learn-style: objectives, the concepts, five "Try it"
// slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/non-person-identity,
// with examples/third_party and examples/drift-pipeline beside it), Lab 2, the federal requirement and evidence, a
// two-question check, and the summary. Every fact comes from the module page, the path's verification log, the
// guide's Step 4 and workbook Chapter 08 that the page sends the learner to, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-6/build.js \
//                      presentations/training-npi-module-6/Training_NPI_Module_6.pptx
const TITLE = "Module 6: Conditional Access for workload identities";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 6: Conditional Access for workload identities",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and labels the title slide for the Microsoft Automation path; this path's title slide
// and document title are set here.
P.D.pres.title = `Non-Person Identity learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "NON-PERSON IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_NPI_Module_6.pptx";
const M = "Training, Non-Person Identity, Module 6";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 6: Conditional Access for workload identities", "Non-Person Identity learning path · Gate G4 Least privilege, with workbook Chapter 08",
    ["The four limits  ·  CA015 and CA037  ·  The scope and the rings  ·  The pre-merge check", "The plan  ·  Enforcement and sign-ins  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 6 of the Non-Person Identity learning path: Conditional Access for workload identities. This module is the Conditional Access half of Gate 4, Least privilege, with Chapter 8 of the developer workbook. You'll hold the program's two workload policies as reviewed files, scoped by object I D, ring by ring. You'll check them before they merge, plan them against a fictional tenant, and create every one report-only. Then you'll read the service principal sign-ins, and see a ring enforced only when a person has reviewed them, the security chief has recorded the decision, and the change explicitly allows it. The code runs on your laptop against a fictional tenant. It's illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the scope matters as much as the policy");
  tag(s, "Why");
  const b = table(s, "Limits", 1.45, [3.4, 8.75], ["Limit", "What it means"], [
    ["Block is the only grant control", "A policy can block a service principal; it can't require anything else"],
    ["Single-tenant service principals only", "Registered in your tenant: not Microsoft or SaaS apps, not multitenant apps, not managed identities"],
    ["Assign directly", "A policy assigned to a group that holds a service principal isn't enforced for it"],
    ["Workload ID Premium", "Needed to create or change these policies"],
  ], { fontSize: 13, limit: 4.4 });
  callout(s, "Point", b + 0.3, 0.95, "FaShieldHalved", HEX.red, "This module: ",
    "CA015 (location) and CA037 (high risk) as reviewed files, scoped by object ID ring by ring, and created report-only.");
  sources(s, "Sources: Module 6, \"Introduction\"; the guide, Step 4e; Microsoft Learn, Conditional Access for workload identities.");
  notes(s,
`Why does the scope matter as much as the policy? Because Conditional Access for workload identities is narrow, as Microsoft Learn's Conditional Access for workload identities page sets out. Block is the only grant control. It covers single-tenant service principals registered in your tenant, and nothing else: not Microsoft or SaaS apps, not multitenant apps, and not managed identities. A policy assigned to a group that holds a service principal isn't enforced for it; you have to assign the service principal directly. And Workload I D Premium is needed to create or change these policies. So in this module you hold the program's two policies, C A oh fifteen for location and C A oh thirty-seven for high risk, as reviewed files. They're scoped by object I D, one ring at a time, and every one is created report-only.`,
  `${M} — Unit "Introduction"; the guide — Step 4e.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 6", [
    "State the four limits, and what covers the identities outside them",
    "Explain why each policy is rendered once per ring and always created report-only",
    "Run the pre-merge check, the tenant check and the plan, and read what each reports",
    "Read a sign-in summary and say whether a ring is ready",
    "Show a ring held without -AllowEnforce, enforced with it, and held again with an edited summary",
  ], [
    "Module 5: this module is the other half of Gate G4",
    "Module 1: the scope names service principals by the enterprise application's object ID",
    "Lab 1: PowerShell 7.1+ with Pester 5; no tenant",
  ], 65);
  sources(s, "Sources: Module 6, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty-five minutes with the lab. You'll state the four limits of Conditional Access for workload identities, and what covers the identities outside them. You'll explain why each policy is rendered once per ring and always created report-only. You'll run the pre-merge check, the tenant check and the plan, and read what each one reports. You'll read a sign-in summary and say whether a ring is ready for enforcement. And you'll see a ring held without the allow-enforce switch, enforced with it, and held again when the summary is edited. Before you start, finish Module 5, the other half of Gate 4, and Module 1, because the scope names service principals by the enterprise application's object I D, as the register records them.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 What the gate asks for
{
  const s = content(SC, "What Step 4 asks for: 4d attributes, 4e the policies");
  tag(s, "What");
  const l = panel(s, "4d", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "4D", "Custom security attributes and app filters", [
    "An attribute set for applications, such as Environment and DataClass",
    "A policy can select target applications by attribute; only string attributes work",
    "Service principals can't be dynamic group members, so attributes are how this track targets by fact",
  ], 12.5);
  const r = panel(s, "4e", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "4E", "Workload identity policies", [
    "For each Tier 1 single-tenant service principal: a location block and a high-risk block, assigned directly",
    "Both report-only first; results appear in the service principal sign-in logs",
    "Govern managed identities through role assignments and access reviews instead",
  ], 12.5);
  callout(s, "Lic", Math.max(l, r) + 0.3, 0.85, "FaKey", HEX.amber, "The licenses table: ",
    "Conditional Access for workload identities needs Workload ID Premium.");
  sources(s, "Sources: Module 6, Unit 1; the guide, Step 4 (4d, 4e), \"Licenses\"; Microsoft Learn: Filter for applications; Conditional Access for workload identities.");
  notes(s,
`Unit 1 is the guide's Step 4, sub-steps four d and four e. Four d is custom security attributes. You define an attribute set for applications, such as environment and data class, and, as Microsoft Learn's page on filtering for applications in Conditional Access says, a policy can then select target applications by attribute. Only string attributes work. And because service principals can't be members of dynamic groups, attributes are how this track targets by fact. Four e is the workload identity policies themselves. For each Tier 1 single-tenant service principal, assign it directly to a location block that allows only the networks it runs from, and to a high-risk block, both report-only first. The results appear in the service principal sign-in logs. Managed identities are governed through their role assignments and access reviews instead. And Microsoft Learn's Conditional Access for workload identities page says creating or changing these policies needs Workload I D Premium.`,
  `${M} — Unit 1 "What the gate asks for"; the guide — Step 4, 4d and 4e; "Licenses."`);
}

// ================================================================== 5 Policies, decisions, files
{
  const s = content(SC, "Two policies, two decisions, one policy per ring");
  tag(s, "What");
  const b = table(s, "Files", 1.45, [4.2, 7.95], ["Piece", "What it holds"], [
    ["CA015-ServiceAccounts-LocationRestriction", "Blocks the ring's service principals from anywhere but the named location NL-WorkloadEgress"],
    ["CA037-WorkloadIdentities-HighRisk-Block", "Blocks them at high service principal risk"],
    ["D-NP4, licensing", "Workload ID Premium for the Tier 1 single-tenant service principals"],
    ["D-NP5, enforcement", "The CISO's call: enforce, extend report-only, or enforce with dated, owned exclusions"],
    ["The scope file", "Each in-scope principal by object ID and ring; each out-of-scope identity with the control that covers it"],
  ], { fontSize: 12.5, limit: 4.9 });
  callout(s, "Ring", b + 0.3, 0.95, "FaSitemap", HEX.teal, "One policy per ring (design guidance): ",
    "each template is rendered per ring, so enforcing one ring changes one policy and leaves the next in report-only.");
  sources(s, "Sources: Module 6, Unit 2; workbook Chapter 08, \"The context the code depends on,\" \"The files.\"");
  notes(s,
`Unit 2 is the context and the files. The program's design guidance sets two policies. C A oh fifteen blocks the ring's service principals from anywhere but one named location, the workload egress ranges. C A oh thirty-seven blocks them when their risk is high. Two decisions frame them. D N P four is licensing: Workload I D Premium for the Tier 1 single-tenant service principals. D N P five is enforcement, and it's the CISO's call: enforce, extend report-only, or enforce with exclusions that are dated and owned. The scope file is the record: each in-scope principal by object I D and ring, and each identity that's out of scope, with the control that covers it instead. And each policy is rendered once per ring, so enforcing one ring changes one policy and leaves the next one in report-only. That's the program's design.`,
  `${M} — Unit 2 "The limits and the scope": workbook Chapter 08, "The context the code depends on," "The files."`);
}

// ================================================================== 6 Pre-merge check
{
  const s = content(SC, "The pre-merge check: NPI-WCA-01 to NPI-WCA-09");
  tag(s, "What");
  const b = table(s, "WCA", 1.45, [1.7, 10.45], ["Rule", "What it flags"], [
    ["NPI-WCA-01", "A policy that targets users, groups, roles, a filter or ServicePrincipalsInMyTenant, not the ring's object IDs"],
    ["NPI-WCA-02, 03", "A managed identity in scope; an in-scope principal that isn't a single-tenant app registered here"],
    ["NPI-WCA-04", "An object ID that isn't a service principal here, or one that's disabled"],
    ["NPI-WCA-05", "No D-NP4 record; a principal that isn't Tier 1; an unknown ring; a duplicate"],
    ["NPI-WCA-06", "An out-of-scope record with no control or reviewer; an eligible principal that isn't Tier 1 (Info)"],
    ["NPI-WCA-07", "A policy that isn't report-only and block, for all resources and all client app types"],
    ["NPI-WCA-08", "A range too broad; any excluded location but NL-WorkloadEgress; a trusted location"],
    ["NPI-WCA-09", "Enforcement without D-NP5 or a reviewed summary, out of ring order, or with an exclusion not owned and dated"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "Exit", "A Finding exits with code 1 and fails the pipeline.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 6, Unit 2, Lab 1 step 3; Chapter 08, \"The pre-merge check\"; Microsoft Learn, CA for workload identities, conditionalAccessConditionSet.");
  notes(s,
`The pre-merge check holds nine rules, N P W C A oh one to oh nine, and most come straight from the limits on Microsoft Learn's Conditional Access for workload identities page; the range, ring and decision rules are the program's design guidance. Oh one: a policy that targets users, groups, roles, a filter, or every service principal in the tenant, instead of the ring's object I D's. Oh two: a managed identity in scope. Oh three: a principal that isn't a single-tenant app registered here. Oh four: an object I D that isn't a service principal in the tenant. Oh five is the licensing record and the rings. Oh six: an out-of-scope identity recorded without the control that covers it. Oh seven: a policy that isn't report-only and block-only, for all resources and all client app types. Oh eight keeps the egress ranges narrow and untrusted. And oh nine guards enforcement. A finding exits with code one and fails the pipeline.`,
  `${M} — Unit 2 "The limits and the scope": workbook Chapter 08, "The pre-merge check."`);
}

// ================================================================== 7 Plan
{
  const s = content(SC, "The plan: six actions, and no delete");
  tag(s, "What");
  const b = table(s, "Plan", 1.45, [2.6, 9.55], ["Action", "When"], [
    ["Create", "The policy isn't in the tenant; always created report-only, whatever its ring's state"],
    ["Update", "It differs; the PATCH carries only the changed top-level properties"],
    ["NoChange", "It matches"],
    ["Blocked", "CA015 whose named location doesn't exist yet; the next run creates it"],
    ["Held", "The ring is marked for enforcement, but this run may not enforce it"],
    ["NotInRepository", "A workload policy no file names: reported and left alone"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Del", b + 0.3, 0.95, "FaShieldHalved", HEX.navy, "The code has no delete: ",
    "rollback drops the ring from the enforcement record and applies, so its policies return to report-only.");
  sources(s, "Sources: Module 6, Unit 3; workbook Chapter 08, \"The plan, the dry run and the writes.\"");
  notes(s,
`Unit 3 begins with the plan. It compares the files with the tenant and gives each policy one of six actions. Create, when the policy isn't in the tenant, and a new policy is always created report-only, whatever its ring's state. Update, when it differs; the patch carries only the properties that changed. No change, when it matches. Blocked, for a location policy whose named location doesn't exist yet; the next run creates it. Held, when the ring is marked for enforcement but this run may not enforce it. And not in repository, for a workload policy that no file names, such as one someone made in the portal. It's reported and left alone. The code has no delete at all. Rollback drops the ring from the enforcement record and applies, so its policies go back to report-only.`,
  `${M} — Unit 3 "Plan, sign-ins and enforcement": workbook Chapter 08, "The plan, the dry run and the writes."`);
}

// ================================================================== 8 Enforcement and sign-ins
{
  const s = content(SC, "Enforcement, ring by ring, and the sign-in reader");
  tag(s, "What");
  const l = panel(s, "Five", 0.6, 1.45, 6.3, null, HEX.red, HEX.redTint, "ALL FIVE, OR THE RING IS HELD", "Enforcement's five conditions", [
    "A D-NP5 record marks the ring",
    "-AllowEnforce in the change that enforces it",
    "A sign-in summary whose SHA-256 the ring's record cites",
    "The summary shows the ring ready",
    "Every earlier ring is enforced",
  ], 12.5);
  const r = panel(s, "Status", 7.15, 1.45, 5.6, null, HEX.teal, HEX.tealTint, "THE SIGN-IN READER", "Four statuses per principal", [
    "NoSignIns: nothing in the window",
    "NotEvaluated: sign-ins, no result from our policies yet",
    "WouldBlock: a report-only failure, a block, or an address outside the ranges",
    "Clear: ready only when every principal is Clear",
  ], 12.5);
  callout(s, "Hdr", Math.max(l, r) + 0.25, 0.95, "FaTriangleExclamation", HEX.amber, "The traps: ",
    "a beta filter for service principal sign-ins, and a header without which report-only results don't come back.");
  sources(s, "Sources: Module 6, Unit 3; Chapter 08, \"Enforcement, ring by ring,\" \"The sign-in reader\"; Microsoft Learn, List signIns (beta).");
  notes(s,
`Turning a policy on is the moment a production job can stop, so the code asks for five things at once, or the ring stays held. A D N P five record marks the ring. The change says allow enforce. The run names a sign-in summary whose hash the ring's record cites. That summary shows the ring ready. And every earlier ring is already enforced. The five conditions are the program's design guidance. The evidence comes from the sign-in reader. Following Microsoft Learn's List sign-ins reference, it reads the beta sign-in list with a filter for service principal sign-ins, and sends a header without which report-only results don't come back. Each principal gets one of four statuses: no sign-ins, not evaluated, would block, or clear. A ring is ready only when every principal in it is clear.`,
  `${M} — Unit 3 "Plan, sign-ins and enforcement": workbook Chapter 08, "Enforcement, ring by ring," "The sign-in reader."`);
}
endModule(SC);

// ================================================================== 9 Try it: steps 1 to 4
{
  const s = content(SL, "Try it: the permissions, and two pre-merge checks");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 to 4, in examples/non-person-identity",
    "$ Invoke-Pester -Path tests/NpiWorkloadCa.Tests.ps1 -FullNameFilter '*(Learn), run as published*' -Output None -PassThru | ...",
    "          9           0          39",
    "$ foreach ($t in 'wca-read', 'wca-signins', 'wca-apply') { ... Get-NpiWcaRequiredPermission -Task $t ... }",
    "wca-read : Application.Read.All, Policy.Read.All",
    "wca-signins : AuditLog.Read.All, Policy.Read.ConditionalAccess",
    "wca-apply : Application.Read.All, Policy.Read.All, Policy.ReadWrite.ConditionalAccess",
    "$ ./Invoke-NpiWorkloadCa.ps1 -Mode Check -ScopePath tests/fixtures/ch08/scope.json",
    "Pre-merge check: 0 Finding, 0 Warn, 0 Info",
    "$ Test-NpiWcaPolicyBody -Body (Read-NpiWcaLearnSample -Path ../third_party/entra-workload-identity-ca-page/workload-identity.md) \\",
    "    -EgressName NL-WorkloadEgress -Name learn-sample | Format-Table Rule, Severity",
    "NPI-WCA-01 Finding   NPI-WCA-01 Finding   NPI-WCA-07 Finding   NPI-WCA-07 Finding   NPI-WCA-08 Finding",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED; STEP 4'S ROWS ON ONE LINE)", pt: 10 });
  line(s, "Read", "The repository's files pass with exit code 0. Learn's sample, checked the same way, fails five times.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 1 to 4; examples/non-person-identity (NpiWorkloadCa; workload-ca/; tests/fixtures/ch08, fictional).");
  notes(s,
`Try it. Lab 1 runs in the non-person identity folder, in PowerShell 7, against a fictional tenant whose egress ranges are documentation ranges. Step one runs the tests on Learn's sample and page as published: nine pass, and the other thirty-nine in that file aren't run. Step two lists three tasks, with three sets of permissions. Reading the policies needs application and policy read. Reading sign-ins needs the audit log and the Conditional Access read. Only the apply task holds the Conditional Access write. Step three runs the pre-merge check on the repository's own files and the fixture scope: no findings, exit code zero. And step four runs the same check on Learn's sample. It fails five times: oh one twice, oh seven twice, and oh eight once. The sample is a model, not a file to create.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 4.`);
}

// ================================================================== 10 Try it: plan
{
  const s = content(SL, "Try it: check the tenant and plan, sending nothing");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "# Step 5",
    "$ ./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud gcc -ScopePath tests/fixtures/ch08/scope.json \\",
    "    -FixturePath tests/fixtures/ch08/tenant.json -OutputPath out/wca",
    "Checks: 0 Finding, 0 Warn, 2 Info",
    "Plan: 3 Create, 1 NoChange, 1 NotInRepository, 1 Update",
    "Dry run: 4 request(s) written to requests.json, none sent; rerun with -Apply to send them",
    "$ Get-Content out/wca/plan.json -Raw | ConvertFrom-Json | Format-Table Kind, Name, Action",
    "location NL-WorkloadEgress                                     Update",
    "policy   CA015-ServiceAccounts-LocationRestriction-Ring1       NoChange",
    "policy   CA037-WorkloadIdentities-HighRisk-Block-Ring1         Create",
    "policy   CA015-ServiceAccounts-LocationRestriction-Ring2       Create",
    "policy   CA037-WorkloadIdentities-HighRisk-Block-Ring2         Create",
    "policy   Workloads - block outside office (made in the portal) NotInRepository",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 10.5 });
  line(s, "Read", "The two Info are Legacy Reports and Build Pipeline: eligible, but not Tier 1. The portal-made policy is left alone.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" step 5; workbook Chapter 08, Lab 1.");
  notes(s,
`Step five checks the scope against the fictional tenant and builds the plan, sending nothing. The tenant check finds no findings and two information items: Legacy Reports and Build Pipeline are eligible but not Tier 1, so they're not in scope. The plan has three creates, one no change, one update and one not in repository. The named location is an update. Ring 1's location policy already exists and matches. Ring 1's risk policy and both of Ring 2's are new. And a policy someone made in the portal is reported as not in the repository, and left alone. The dry run writes its four requests to a file and sends none of them. You'd rerun with apply to send them.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 5; workbook Chapter 08 — "Lab 1: fixtures, no tenant."`);
}

// ================================================================== 11 Try it: sign-ins
{
  const s = content(SL, "Try it: read and summarize the sign-ins");
  tag(s, "How");
  const c = code(s, "Sign", 0.6, 1.45, 12.15, [
    "# Step 6",
    "$ ./Invoke-NpiWorkloadCa.ps1 -Mode SignIns -Cloud gcc -ScopePath tests/fixtures/ch08/scope.json \\",
    "    -FixturePath tests/fixtures/ch08/tenant.json -From 2026-10-12 -To 2026-10-30T12:00:00 -OutputPath out/wca-signins",
    "Service principal sign-ins 2026-10-12T00:00:00Z to 2026-10-30T12:00:00Z (18 days): 6 read",
    "Ring1: ready for enforcement",
    "  Mail Automation  Clear        sign-ins 1",
    "  Payroll Export   Clear        sign-ins 2",
    "Ring2: not ready",
    "  Deploy Bot       WouldBlock   sign-ins 2; outside the egress ranges: 203.0.113.7",
    "  HR Connector     NoSignIns    sign-ins 0",
    "Summary SHA-256: da391f12869037f18d222c223d38990565bd37b3bf115cb8d70617e44d6dc26b",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 11 });
  line(s, "Read", "Ring 2 isn't ready: a ring is ready only when every principal in it is Clear.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" step 6; Knowledge check, answer 5; workbook Chapter 08, \"The sign-in reader.\"");
  notes(s,
`Step six reads the service principal sign-ins over an eighteen-day window and summarizes them, principal by principal. Ring 1 is ready for enforcement: Mail Automation and Payroll Export are both clear. Ring 2 isn't ready. Deploy Bot would be blocked, because it signed in from two oh three dot oh dot one thirteen dot seven, outside the egress ranges. And HR Connector has no sign-ins at all, so there's nothing to judge. A ring is ready only when every principal in it is clear. The summary ends with its hash. Write that hash down: in step eight, the enforcement record cites it, and that's how a reviewer's approval is tied to exactly this evidence.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 6; "Check your answers," 5.`);
}

// ================================================================== 12 Try it: apply twice
{
  const s = content(SL, "Try it: apply against the fake, twice");
  tag(s, "How");
  const c = code(s, "Apply", 0.6, 1.45, 12.15, [
    "# Step 7: build a wca-apply client on the fake, plan and send, twice (the module page has the full block)",
    "$ foreach ($run in 1..2) { $client = New-NpiWcaClient -Cloud gcc -Task wca-apply -Invoke $fake.Invoke; ...",
    "    $sent = @(Invoke-NpiWcaPlan -Client $client -Plan $plan -Findings $findings | Where-Object Sent); \"Run ${run}: ...\" }",
    "Run 1: 4 sent",
    "Run 2: 0 sent",
    "$ $fake.Tenant.policies | Where-Object { $_.displayName -like 'CA0*' } | ForEach-Object { '{0,-50} {1}' -f ... }",
    "CA001-AllUsers-BlockLegacyAuthentication           enabled",
    "CA015-ServiceAccounts-LocationRestriction-Ring1    enabledForReportingButNotEnforced",
    "CA037-WorkloadIdentities-HighRisk-Block-Ring1      enabledForReportingButNotEnforced",
    "CA015-ServiceAccounts-LocationRestriction-Ring2    enabledForReportingButNotEnforced",
    "CA037-WorkloadIdentities-HighRisk-Block-Ring2      enabledForReportingButNotEnforced",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "Every workload policy is report-only. CA001, a user policy, stays enabled and untouched.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" step 7; verification log, claim 11.");
  notes(s,
`Step seven applies the plan against the fake, twice. You read the scope and the repository, build a client for the apply task on the fake tenant, and send the plan. The first run sends four requests. The second sends none, because everything already matches. That's what makes the apply safe to re-run. Then list the policies whose names start with C A oh. Every C A oh fifteen and C A oh thirty-seven policy is enabled for reporting but not enforced. That's report-only, in Graph's words. And C A oh oh one, a user policy that blocks legacy authentication, stays enabled and untouched. The code changes only the policies its files name.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 7; verification log — claim 11.`);
}

// ================================================================== 13 Try it: enforce, alert
{
  const s = content(SL, "Try it: enforce Ring 1, then edit one byte");
  tag(s, "How");
  const b = table(s, "Enf", 1.45, [5.4, 6.75], ["Step 8: plan with out/scope-ring1.json (D-NP5 and the summary's hash)", "Prints"], [
    ["Without -AllowEnforce", "Plan: 3 Create, 1 Held, 1 NotInRepository, 1 Update"],
    ["With -AllowEnforce and the reviewed summary", "Plan: 3 Create, 1 NotInRepository, 2 Update"],
    ["With -AllowEnforce and a copy with one byte added", "Plan: 3 Create, 1 Held, 1 NotInRepository, 1 Update"],
  ], { fontSize: 12.5, limit: 3.6 });
  const c = code(s, "Alert", 0.6, b + 0.25, 12.15, [
    "# Step 9: (Get-Content out/wca/alert-rule.json -Raw | ConvertFrom-Json).query",
    "AADServicePrincipalSignInLogs",
    "| where tostring(ResultType) == \"53003\"",
    "| where ServicePrincipalId in (\"5b000000-...-000000000001\", \"...-000000000002\", \"...-000000000006\", \"...-000000000007\")",
    "| project TimeGenerated, ServicePrincipalId, AppId, IPAddress, ResultType, ConditionalAccessPolicies",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (IDS TRIMMED)", pt: 10.5 });
  line(s, "Tests", "Step 10: Invoke-Pester -Path tests prints 513 passed, 0 failed. Then Remove-Item -Recurse -Force out.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 8 to 10; Chapter 08, \"Enforcement, ring by ring\"; Microsoft Learn, Entra error codes.");
  notes(s,
`Step eight tries to enforce Ring 1. You copy the scope and add an enforcement record: D N P five, outcome enforce, decided by the CISO, and Ring 1 with the summary's hash, reviewed by the ISSO. Plan without allow enforce, and Ring 1's location policy is held. Plan again with allow enforce and the reviewed summary, and the held becomes a second update: C A oh fifteen Ring 1 goes from report-only to enabled. Now add one byte to a copy of the summary and plan again, and it's held again, because the edited summary's hash isn't the one the reviewer recorded. Step nine reads the alert definition: a query over the service principal sign-in logs for result type five three oh oh three, which Microsoft Learn's error code list names as blocked by Conditional Access, for the four in-scope object I D's. Step ten runs the tests: five hundred thirteen pass.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 8 to 10.`);
}

// ================================================================== 14 Lab 2
{
  const s = content(SL, "Lab 2: report-only, then one ring, in a test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant, never production, with a Workload Identities Premium trial or license; one test app with a certificate; a host whose egress address you know"],
    ["Scope and plan", "The test app's enterprise application object ID in Ring 1; plan with a reading app"],
    ["Report-only", "Apply report-only; generate sign-ins from inside and outside the egress range"],
    ["Enforce", "In a separate change, after at least 14 days with the ring Clear, enforce Ring 1 and see a token from outside the range blocked"],
    ["Back it out", "Step 7 removes Ring 1 from the record and applies; then turn off or delete the policies by hand (the code never deletes)"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 08, Lab 2, which has the exact commands.");
  sources(s, "Sources: Module 6, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 runs the same path in your own test tenant, worldwide or G C C, never production, with a Workload Identities Premium trial or license, one test app registration with a certificate, and a host whose public egress address you know. Write a scope with the test app's enterprise application object I D in Ring 1, and plan with a reading app. Apply report-only, and generate sign-ins from inside and outside the egress range. Then, in a separate change, after at least fourteen days with the ring clear, enforce Ring 1, and watch a token from outside the range get blocked. To back it out, step seven removes Ring 1 from the enforcement record and applies, so both policies return to report-only. Then you turn them off or delete them by hand, because the code never deletes. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 15 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for this part");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.6, 3.5, 5.05], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["AC-3; IA-9", "KSI-IAM-ELP (AC-3); none cites IA-9", "The scope file; findings.json, NPI-WCA-01 to -09"],
    ["AC-6; CM-5", "KSI-IAM-ELP, KSI-IAM-JIT; KSI-CMT-RVP", "The permissions for wca-read, wca-signins, wca-apply"],
    ["CM-6; CM-3(2)", "KSI-SVC-ACM, KSI-MLA-EVC; KSI-CMT-VTD", "The pre-merge check; the files in workload-ca/"],
    ["AU-6; CA-7", "KSI-MLA-RVL; KSI-MLA-EVC", "signin-summary.json and its SHA-256"],
    ["CM-4(2) Verification of Controls", "KSI-CMT-VTD, KSI-CMT-LMC", "The held, enforced and edited plans"],
    ["SI-4 System Monitoring", "KSI-IAM-SUS, KSI-MLA-RVL, KSI-SVC-EIS", "alert-rule.json"],
  ], { fontSize: 11.5, limit: 5.5 });
  line(s, "KSI", "Gate G4 names AC-6, AC-6(5) and IA-9. KSIs are FedRAMP 20x provider indicators; the mapping is design guidance.", b + 0.2, 0.45, 13);
  sources(s, "Sources: Module 6, \"Introduction\" (the federal requirement); the guide's \"Evidence\" section.");
  notes(s,
`The federal requirement. This is the Conditional Access part of Gate 4, the guide's Step four e, and the guide's validate step names A C six, A C six enhancement five, and I A nine. The module's table maps each control to its evidence. Access enforcement and service identification: the scope file and the findings. Least privilege and access restrictions for change: the three tasks' permissions. Configuration settings and testing changes: the pre-merge check and the policy files. Audit review and continuous monitoring: the sign-in summary and its hash. Verification of controls: the held, enforced and edited plans. And system monitoring: the alert definition. K S I's are FedRAMP twenty X indicators for cloud service providers. The agency lines its evidence up with what its providers report; which file supports which indicator is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); the guide — "Evidence."`);
}

// ================================================================== 16 Check
{
  const s = check(SS, "Check yourself: two questions on workload policies", [
    { q: "A policy is assigned to a group that contains a Tier 1 service principal. What happens?", options: ["a. It's enforced for every member of the group", "b. It isn't enforced for it; assign it directly, by the enterprise application's object ID", "c. It's enforced only in report-only mode"] },
    { q: "A new CA037 policy is created on the same run that enforces its ring. What state is it created in?", options: ["a. Enabled", "b. Report-only; it turns on in the next run", "c. Off"] },
  ], "1 b: Microsoft Learn says assign directly. 2 b: every policy is created report-only, whatever its ring's state.");
  sources(s, "Sources: Module 6, \"Knowledge check,\" questions 1 and 3, and \"Check your answers\"; Microsoft Learn, Conditional Access for workload identities.");
  notes(s,
`Check yourself with two questions. First: a policy is assigned to a group that contains a Tier 1 service principal. What happens? The answer is b. It isn't enforced for the service principal. Microsoft Learn's Conditional Access for workload identities page says to assign it directly, by the enterprise application's object I D. Second: a new C A oh thirty-seven policy is created on the same run that enforces its ring. What state is it created in? The answer is b: report-only. Every policy is created report-only, whatever its ring's state, and it turns on in the next run. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 17 Summary
{
  const s = content(SS, "Summary, and next: Module 7, conversions");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Checked the policy files, and failed Learn's sample against the same rules",
    "Planned against a fictional tenant; created every policy report-only",
    "Summarized the service principal sign-ins",
    "Saw a ring enforced only with D-NP5, -AllowEnforce and the reviewed summary",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 7: Convert to managed identities and federation", [
    "Gate G5 Conversion",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "the scope file, the checks, plan.json and requests.json, the summary with the hash D-NP5 cites, the alert, each manifest.");
  sources(s, "Sources: Module 6, \"Summary\"; Module 7.");
  notes(s,
`To sum up. You checked the policy files, and failed Learn's sample against the same rules. You planned against a fictional tenant, created every policy report-only, and summarized the service principal sign-ins. And you saw a ring enforced only with the D N P five decision, the allow-enforce switch and the reviewed summary, and held again when the summary changed. The evidence an ISSO keeps is the scope file, the pre-merge check, the findings, the plan and its requests, the sign-in summary with the hash the D N P five record cites, the alert definition, and each run's manifest, all dated. Before you ship, work through the chapter's checklist. Next is Module 7: convert to managed identities and federation, Gate 5.`,
  `${M} — Unit "Summary"; Module 7.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 6 deck", [
  "Module page: docs/training/non-person-identity/06-conditional-access.md (Non-Person Identity learning path, Module 6): Introduction and its requirement table, objectives, prerequisites, Units 1 to 3, Lab 1, Lab 2, knowledge check and summary. The learning path index: what you need for the labs.",
  "What the module links for the design and rules: Non-Person Identity: An Implementation Guide, Step 4 (4d, 4e), \"Licenses\" and \"Evidence\"; workbook Chapter 08, \"The context the code depends on,\" \"The files,\" \"The pre-merge check,\" \"The plan, the dry run and the writes,\" \"Enforcement, ring by ring,\" \"The sign-in reader.\"",
  "Kit: examples/non-person-identity (Invoke-NpiWorkloadCa.ps1; powershell/NpiWorkloadCa; workload-ca/; tests/fixtures/ch08). Fictional tenant; documentation IP ranges. Illustrative: tested against fixtures, not run against a live tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7 and Pester 5 in a scratch copy of examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it; long commands are wrapped and output trimmed where the slides say so. Verification: docs/training/non-person-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
