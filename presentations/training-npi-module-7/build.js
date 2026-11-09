// Non-Person Identity learning path, Module 7: Convert to managed identities and federation — the module's narrated deck.
// Teaches docs/training/non-person-identity/07-federation-and-managed-identities.md, Learn-style: objectives, the
// concepts, four "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of
// examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it), Lab 2, the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, the path's
// verification log, the guide's Step 5 and workbook Chapter 05 that the page sends the learner to, or the kit; the
// deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-7/build.js \
//                      presentations/training-npi-module-7/Training_NPI_Module_7.pptx
const TITLE = "Module 7: Convert to managed identities and federation";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 7: Convert to managed identities and federation",
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
const OUT = process.argv[2] || "Training_NPI_Module_7.pptx";
const M = "Training, Non-Person Identity, Module 7";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 7: Convert to managed identities and federation", "Non-Person Identity learning path · Gate G5 Conversion, with workbook Chapter 05",
    ["What Step 5 asks for  ·  The three values  ·  The checks  ·  The exchange test", "The plan and the parallel run  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 7 of the Non-Person Identity learning path: convert to managed identities and federation. This module is the first half of Gate 5, Conversion, with Chapter 5 of the developer workbook. It's where service accounts and secrets actually get replaced. You'll plan conversions in the program's order: a managed identity for an Azure-hosted workload, a federated credential where the host has an issuer, and a certificate only where neither applies. You'll check each federated credential against the claims the workload will present, and test it against a fake token endpoint before it's created. Then you'll read each conversion's parallel run, and see when the legacy account may be disabled. The code is illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why a federated credential can fail in silence");
  tag(s, "Why");
  const b = table(s, "Three", 1.45, [2.4, 9.75], ["Value", "Must match the workload's token exactly, case for case"], [
    ["Issuer", "The outside issuer, such as GitHub Actions or a Kubernetes cluster"],
    ["Subject", "Which workload on that issuer: a wrong one is created without any error"],
    ["Audience", "Exactly one, api://AzureADTokenExchange"],
  ], { fontSize: 13.5, limit: 3.6 });
  callout(s, "Point", b + 0.3, 1.2, "FaTriangleExclamation", HEX.red, "The silent failure: ",
    "a credential with the wrong subject fails only when the workload tries to exchange its token. So this module checks and tests each one before it's created.");
  sources(s, "Sources: Module 7, \"Introduction\"; Knowledge check, answer 2; Microsoft Learn, Workload identity federation concepts; FIC considerations.");
  notes(s,
`Why does this need care? Microsoft Learn's workload identity federation documentation explains it. A federated credential tells Microsoft Entra I D to trust tokens from an outside issuer, such as GitHub Actions or a Kubernetes cluster. Three values must match the workload's token exactly, case for case: the issuer, the subject, and the audience, which for Entra I D is exactly one value, A P I colon slash slash Azure A D Token Exchange. And here's the quiet failure. Learn says a credential with the wrong subject is created without any error. It fails only when the workload tries to exchange its token, which may be the day you cut over. So in this module, each federated credential is checked against the claims the workload will present, and tested against a fake token endpoint, before it's ever created.`,
  `${M} — Unit "Introduction"; "Check your answers," 2; workbook Chapter 05 — "What the code depends on."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 7", [
    "State the order of targets, and the finding a target out of order raises",
    "Name the three values a federated credential must match, and the audience Entra ID expects",
    "Explain why every federated credential gets a token exchange test before it's created",
    "Read a conversion's cutover gate and parallel run status, and say when the legacy account may be disabled",
  ], [
    "Module 3: the conversions follow the target and the wave it decides",
    "Module 4: a certificate target is issued and rotated under its rules",
    "Lab 1: PowerShell 7.1+ with Pester 5; no tenant",
  ], 60);
  sources(s, "Sources: Module 7, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty minutes with the lab. You'll state the order of targets, and the finding a target out of order raises. You'll name the three values a federated credential must match, and the audience Entra I D expects. You'll explain why every federated credential gets a token exchange test before it's created. And you'll read a conversion's cutover gate and its parallel run status, and say when the legacy account may be disabled. Before you start, finish Module 3, because the conversions follow the target and the wave it decides, and Module 4, because a certificate target is issued and rotated under its credential rules. Lab 1 needs PowerShell 7.1 or later with Pester 5, and no tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Step 5
{
  const s = content(SC, "What Step 5 asks for: build, own, run, disable");
  tag(s, "What");
  const b = table(s, "Steps", 1.45, [0.8, 3.3, 8.05], ["#", "Step", "What the guide asks"], [
    ["1", "Build the target", "A managed identity with its role assignments; a federated credential tested by an actual token exchange; a certificate from the vault; a gMSA; or a dMSA on a Windows Server 2025 domain"],
    ["2", "Own it", "Two human owners and a rotation schedule"],
    ["3", "Run in parallel", "Old and new for 30 days: the application uses the new identity, and the legacy account stays enabled"],
    ["4", "Disable the legacy account", "Don't delete it. Remove an app's secret only after the new credential has carried production traffic"],
    ["5", "Record the result", "The target achieved, the date, and the disabled object's ID"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Danger", b + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "\"Federation trusts too much\" (design guidance): ",
    "a broad subject lets every workload on that issuer in. Use exact subjects; approve each credential as a change.");
  sources(s, "Sources: Module 7, Unit 1; the guide, Step 5, Step 2 and \"Dangers\" (the program's design guidance).");
  notes(s,
`Unit 1 is the guide's Step 5, which has five parts. They're the program's conversion steps, design guidance, not Microsoft's. Build the target: a managed identity with its role assignments, a federated credential tested by an actual token exchange, a certificate credential from the vault, a group managed service account, or, on a Windows Server 2025 domain, a delegated managed service account. Give it two human owners and a rotation schedule. Run old and new in parallel for thirty days: the application uses the new identity, and the legacy account stays enabled, and you watch both. Disable the legacy account; don't delete it. For an app registration losing a secret, remove the secret only after the new credential has carried production traffic. And record the result: the target, the date and the disabled object's I D. The program's dangers table adds one more: federation trusts too much. A broad subject lets every workload on that issuer in, so the program's guidance is exact subjects, and approval of each credential as a change.`,
  `${M} — Unit 1 "What the gate asks for"; the guide — Step 5, Step 2, "Dangers."`);
}

// ================================================================== 5 Order and rules
{
  const s = content(SC, "The order of targets, and Learn's rules");
  tag(s, "What");
  const l = panel(s, "Order", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE PROGRAM'S ORDER", "Target by what the host allows", [
    "An Azure-hosted workload: a managed identity",
    "A host with an issuer, such as a pipeline: a federated credential",
    "A certificate only where neither applies",
    "A target out of order is NPI-WIF-01",
  ], 13);
  const r = panel(s, "Rules", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "WHAT LEARN STATES", "The match, and the limits", [
    "Exact and case-sensitive, with no wildcards",
    "At most 20 federated credentials on one app registration or user-assigned identity",
    "None on a system-assigned identity",
    "A wrong subject is created without error",
  ], 13);
  sources(s, "Sources: Module 7, Unit 2; workbook Chapter 05, \"What the code depends on\"; Microsoft Learn, FIC considerations and restrictions.");
  notes(s,
`Unit 2 starts with what the code depends on. The order of targets is the program's: an Azure-hosted workload gets a managed identity, a host with an issuer, such as a pipeline, gets a federated credential, and a certificate is used only where neither applies. A target out of that order raises N P W I F oh one. Then the rules on Microsoft Learn's page of important considerations and restrictions for federated identity credentials. The match is exact and case-sensitive, with no wildcards. An app registration or a user-assigned managed identity holds at most twenty federated credentials, and a system-assigned identity can't hold one at all. And, as you've heard, a credential with the wrong subject is created without error. Everything in the checks follows from those facts.`,
  `${M} — Unit 2 "What a federated credential must match": workbook Chapter 05, "What the code depends on."`);
}

// ================================================================== 6 The checks
{
  const s = content(SC, "The checks: NPI-WIF-01 to NPI-WIF-09");
  tag(s, "What");
  const b = table(s, "WIF", 1.45, [1.7, 1.2, 9.25], ["Rule", "Severity", "What it flags"], [
    ["NPI-WIF-01", "Finding", "A target out of the program's order"],
    ["NPI-WIF-02", "Finding", "A subject that isn't exactly, case for case, what the workload's issuer will present"],
    ["NPI-WIF-03", "Finding", "An issuer that isn't exactly the workload's, a trailing slash included, or one with whitespace"],
    ["NPI-WIF-04", "Finding", "Not exactly one audience, or not exactly api://AzureADTokenExchange"],
    ["NPI-WIF-05, 06", "Finding", "A bad name, a wildcard, a system-assigned parent; over 20 credentials, or a repeated issuer and subject"],
    ["NPI-WIF-07", "Warn", "A credential in the tenant the reviewed file doesn't hold: reported, never deleted"],
    ["NPI-WIF-08", "Finding", "The token exchange test failed"],
    ["NPI-WIF-09", "Finding", "A parallel run that isn't clean, such as a legacy credential still in use after cutover"],
  ], { fontSize: 12, limit: 5.5 });
  line(s, "Thr", "The order and the thresholds for a clean run are the program's (design guidance).", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 7, Unit 2; workbook Chapter 05, \"The checks\"; Microsoft Learn: Configure an app to trust an external IdP; FIC considerations.");
  notes(s,
`The checks are nine rules, N P W I F oh one to oh nine. Oh one is the order, the program's design guidance. Oh two, oh three and oh four are the three values, from Microsoft Learn's federation pages: a subject that isn't exactly what the workload's issuer will present, case for case; an issuer that isn't exactly the workload's, a trailing slash included; and an audience that isn't exactly the one Entra I D expects. Oh five and oh six are Microsoft Learn's limits: a bad name, a wildcard, a system-assigned parent, more than twenty credentials, or the same issuer and subject twice. Oh seven is a warning for a credential someone added outside the reviewed file; it's reported, never deleted. Oh eight is a failed token exchange test. And oh nine is a parallel run that isn't clean, such as an old secret still signing in after cutover.`,
  `${M} — Unit 2 "What a federated credential must match": workbook Chapter 05, "The checks."`);
}

// ================================================================== 7 Exchange test
{
  const s = content(SC, "What the workload presents, and the exchange test");
  tag(s, "What");
  const l = panel(s, "Claims", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE PRESENTED CLAIMS", "What the issuer will put in the token", [
    "GitHub: repo:<org/repo>:environment:<name>, or a branch or tag ref",
    "Kubernetes: system:serviceaccount:<namespace>:<name>",
    "Anything else, such as a pull request, is captured from a test run, not derived",
  ], 12.5);
  const r = panel(s, "Test", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE EXCHANGE TEST", "Learn's token request, to a fake", [
    "The client credentials request, sent only to a fake token endpoint",
    "The fake matches exactly and case-sensitively, as Learn describes",
    "Passes only if the named credential is the one that matched",
  ], 12.5);
  callout(s, "Not", Math.max(l, r) + 0.3, 0.95, "FaTriangleExclamation", HEX.amber, "What it doesn't prove: ",
    "that the real issuer will present those claims. That, and the real service's answer, are Lab 2's.");
  sources(s, "Sources: Module 7, Unit 2; answer 5; Chapter 05, \"The checks\"; Microsoft Learn: Configure an app to trust an external IdP; Client credentials flow.");
  notes(s,
`Two pieces make the check real. First, the code works out the claims the workload's issuer will put in its token. For GitHub, Microsoft Learn's trust page gives the formats: the repository and an environment, a branch or a tag. For Kubernetes, it's the service account. Anything it can't be sure of, such as a pull request, has to be captured from a real test run, not derived. Second, the exchange test. It builds the token request from Microsoft Learn's OAuth 2.0 client credentials flow page and sends it only to a fake token endpoint, which matches exactly and case-sensitively, the way Learn describes. It passes only if the named credential is the one that matched. Be clear about what that proves. It shows a credential will match the claims you recorded. Whether the real issuer presents those claims, and what the real service answers, is Lab 2's job.`,
  `${M} — Unit 2 "What a federated credential must match": workbook Chapter 05, "The checks"; "Check your answers," 5.`);
}

// ================================================================== 8 Plan and write path
{
  const s = content(SC, "The plan, the parallel run and the write path");
  tag(s, "What");
  const b = table(s, "Plan", 1.45, [3.0, 7.75, 1.4], ["Action", "When", "Writes?"], [
    ["CreateIdentity", "A user-assigned identity the file asks for doesn't exist", "After review"],
    ["CreateCredential", "It passes every check and its exchange test", "After review"],
    ["DisableLegacy", "A clean 30-day parallel run and the owner's approval: Disable-ADAccount", "After review"],
    ["Statuses", "AwaitingCutover, ParallelRunning, AwaitingOwnerApproval, Converted", "No"],
  ], { fontSize: 12.5, limit: 4.2 });
  callout(s, "Write", b + 0.3, 1.2, "FaUserShield", HEX.navy, "The write path: ",
    "the approved hash, one write at a time, the identity before its credential, never a DELETE, and a person with Cloud Application Administrator and Managed Identity Contributor.");
  sources(s, "Sources: Module 7, Unit 3; Chapter 05, \"The plan,\" \"The separate write path\"; Microsoft Learn: List signIns (beta); Configure a UAMI to trust an IdP.");
  notes(s,
`Unit 3 is the plan and the write path. Each conversion gets actions, and only three ever write. Create identity, for a user-assigned identity the file asks for that doesn't exist yet. Create credential, for a federated credential that passes every check and its exchange test. And disable legacy, after a clean thirty-day parallel run and the owner's approval, with Disable A D Account. Everything else is a status, from awaiting cutover, to parallel running, to awaiting the owner's approval, to converted. The thresholds for a clean run are the program's design guidance. The write path is separate. It runs only the plan whose hash was approved, one write at a time, the identity before its credential, because Microsoft Learn's trust page warns that parallel creates under one identity fail, and it never sends a delete. And it runs as a person with Cloud Application Administrator and Managed Identity Contributor.`,
  `${M} — Unit 3 "The plan, the parallel run and the write path": workbook Chapter 05, "The plan," "The separate write path."`);
}
endModule(SC);

// ================================================================== 9 Try it: samples, permissions, plan
{
  const s = content(SL, "Try it: Microsoft's samples, the permissions, the plan");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 to 3, in examples/non-person-identity",
    "$ Invoke-Pester -Path tests/NpiFederationSamples.Tests.ps1 -Output None -PassThru | Select-Object PassedCount, FailedCount, NotRunCount",
    "         17           0           0",
    "$ foreach ($t in 'federation', 'federation-apply') { ... Get-NpiWifRequiredPermission -Task $t ... }",
    "federation : Application.Read.All, AuditLog.Read.All | Reader",
    "federation-apply : Application.Read.All, Application.ReadWrite.All | Managed Identity Contributor, Reader",
    "$ ./Invoke-NpiFederation.ps1 -Cloud gcc -ConversionsPath tests/fixtures/ch05/conversions.json \\",
    "    -CutoverLogPath tests/fixtures/ch05/cutover-log.csv -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation",
    "Conversions: 8 in 2 wave(s); token exchange tests: 4 passed, 2 failed",
    "Findings: 7 Finding, 1 Warn",
    "Plan: 20 actions, 4 of them writes (2 CreateCredential, 1 CreateIdentity, 1 DisableLegacy); nothing sent",
    "Parallel runs: conv-01 ReadyToDisableLegacy; conv-02 AwaitingCutover; ... conv-07 ParallelRunning; conv-08 LegacyStillInUse",
    "Plan SHA-256: 5ec0a52c70dc49ac6904c6923ac9b292e3c312d38594b6210cc9178c9f188bf2",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED; \"...\" MARKS CUTS)", pt: 10 });
  line(s, "Read", "In step 1, one test creates a credential from the Graph sample: the create succeeds, the exchange fails (AADSTS70021).", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 1 to 3; examples/non-person-identity (NpiFederation; tests/fixtures/ch05, fictional).");
  notes(s,
`Try it. Lab 1 runs in the non-person identity folder, in PowerShell 7, against a fictional tenant. Step one sends Microsoft's samples to the fakes, and seventeen tests pass. One of them is the whole risk in a single test: it creates a credential from the Graph sample, then exchanges a token with another subject. The create succeeds, and the exchange fails with A A D S T S seven double oh two one. Step two lists what each task needs. The read task holds two Graph read permissions and Reader. Only the apply task holds application read-write and Managed Identity Contributor. Step three builds the plan: eight conversions in two waves, four exchange tests passed and two failed, seven findings and one warning, and twenty actions, four of them writes. Nothing is sent, and the plan's hash is the same on every run with these inputs.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 3.`);
}

// ================================================================== 10 Try it: findings and exchange tests
{
  const s = content(SL, "Try it: the findings and the exchange tests");
  tag(s, "How");
  const c = code(s, "Find", 0.6, 1.45, 6.4, [
    "# Step 4: Format-Table Rule, Severity, ObjectKey",
    "NPI-WIF-03 Finding  conv-02/payroll-prod",
    "NPI-WIF-02 Finding  conv-02/payroll-prod",
    "NPI-WIF-08 Finding  conv-02/payroll-prod",
    "NPI-WIF-07 Warn     conv-02/payroll-test",
    "NPI-WIF-04 Finding  conv-03/github-intranet-tag",
    "NPI-WIF-08 Finding  conv-03/github-intranet-tag",
    "NPI-WIF-01 Finding  conv-06",
    "NPI-WIF-09 Finding  conv-08",
  ], { label: "STEP 4, RUN NOVEMBER 3, 2026", pt: 11 });
  const c2 = code(s, "Ex", 7.25, 1.45, 5.5, [
    "# Step 5: exchange-tests.json",
    "Credential          Source  Passed",
    "payroll-prod        derived  False",
    "github-main         derived   True",
    "github-intranet     derived   True",
    "github-intranet-tag derived  False",
    "aks-webfront        derived   True",
    "gh-reports          derived   True",
  ], { label: "STEP 5 (SUBJECTSOURCE AS SOURCE)", pt: 11 });
  line(s, "Read", "payroll-prod: a trailing slash on the issuer, and Production for production. github-intranet-tag: an audience with a leading space.", Math.max(c, c2) + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 4 and 5; Knowledge check, answers 1 and 3; examples/non-person-identity/tests/fixtures/ch05.");
  notes(s,
`Step four reads the findings, eight rows, and each one is a small mistake that would have failed in silence. Payroll prod has an issuer with a trailing slash, and the environment Production, capital P, where the workflow presents production, lower case. That's oh three, oh two, and a failed exchange, oh eight. Payroll test is a warning, oh seven: it's in the tenant but not in the reviewed file. Github intranet tag has an audience with a leading space, so it's oh four and a failed exchange. Conversion six gives an Azure Functions app a certificate when a managed identity is available, which is oh one. And conversion eight's secret still signs in after cutover, oh nine. Step five reads the six exchange tests: payroll prod and github intranet tag fail, and the other four pass.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 4 and 5; "Check your answers," 1 and 3.`);
}

// ================================================================== 11 Try it: conversions
{
  const s = content(SL, "Try it: read each conversion's parallel run");
  tag(s, "How");
  const c = code(s, "Conv", 0.6, 1.45, 8.0, [
    "# Step 6: conversion-records.json",
    "Id      Target              Gate     Run                  Day",
    "--      ------              ----     ---                  ---",
    "conv-01 managedIdentity     Ready    ReadyToDisableLegacy  40",
    "conv-02 federatedCredential Blocked  AwaitingCutover",
    "conv-03 federatedCredential Blocked  AwaitingCutover",
    "conv-04 managedIdentity     NotReady AwaitingCutover",
    "conv-05 certificate         NotReady AwaitingCutover",
    "conv-06 certificate         Blocked  AwaitingCutover",
    "conv-07 managedIdentity     Ready    ParallelRunning       15",
    "conv-08 federatedCredential Ready    LegacyStillInUse      59",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026", pt: 11 });
  panel(s, "Read", 8.85, 1.45, 3.9, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "conv-01: a clean run past 30 days, approved: the one disable",
    "conv-07: day 15 of 30",
    "conv-08: the legacy credential is still in use on day 59",
    "Five are awaiting cutover",
  ], 12.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" step 6; workbook Chapter 05, \"The plan,\" Lab 1.");
  notes(s,
`Step six reads the conversions: each one's target, its cutover gate, its parallel run status and its day. Conversion one, to a managed identity, is ready to disable its legacy account on day forty: a clean run past thirty days, and the owner approved, so it's the one disable in the plan. Conversion seven is parallel running, on day fifteen of thirty, so it waits. Conversion eight is the warning sign: on day fifty-nine, the legacy credential is still in use, so it isn't clean, and nothing is disabled. The other five are awaiting cutover. Three of them are blocked by the findings you just read, and two aren't ready yet. Notice that a status isn't a write. Only the plan's three write actions ever change anything, and only after review.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 6; workbook Chapter 05 — "The plan."`);
}

// ================================================================== 12 Try it: dry run, apply, refuse
{
  const s = content(SL, "Try it: a dry run, the apply, and a refusal");
  tag(s, "How");
  const c = code(s, "Dry", 0.6, 1.45, 12.15, [
    "# Step 7: dry-run with the approved hash",
    "$ $sha = (Get-FileHash out/federation/plan.json -Algorithm SHA256).Hash.ToLower()",
    "$ ./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation/plan.json -ApprovedSha256 $sha ...",
    "DryRun: 4 WouldSend",
    "  WouldSend DisableLegacy    WRITE Disable-ADAccount -Identity ad000000-0000-4000-8000-000000000001",
    "  WouldSend CreateCredential POST  https://graph.microsoft.com/v1.0/applications/0a000000-.../federatedIdentityCredentials",
    "  WouldSend CreateIdentity   PUT   https://management.azure.com/.../userAssignedIdentities/id-webfront?api-version=2024-11-30",
    "  WouldSend CreateCredential PUT   https://management.azure.com/.../id-webfront/federatedIdentityCredentials/aks-webfront?...",
    "# Step 8: -Apply, then a hash nobody approved",
    "Apply: 4 Sent",
    "The plan's SHA-256 is 5ec0a52c70dc49ac6904c6923ac9b292e3c312d38594b6210cc9178c9f188bf2, not the approved",
    "  0000000000000000000000000000000000000000000000000000000000000000; refusing to run a plan nobody reviewed.",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Order", "The identity id-webfront is created before its credential. Apply sends the four in the same order.", c + 0.25, 0.45, 13.5);
  line(s, "Tests", "Step 9: Invoke-Pester -Path tests prints 513 passed, 0 failed. Then Remove-Item -Recurse -Force out.", c + 0.75, 0.45, 13.5);
  sources(s, "Sources: Module 7, \"Exercise: Lab 1,\" steps 7 to 9; examples/non-person-identity/Invoke-NpiFederation.ps1.");
  notes(s,
`Step seven dry-runs the plan with its approved hash. It would send four writes, in order. First, Disable A D Account for conversion one's legacy account. Disabled, not deleted. Then a post of an application's federated credential to Graph. Then a put of the user-assigned identity, id webfront, to Resource Manager, before a put of its credential. The identity always comes before its credential, one write at a time. Step eight applies the plan to the fake, and all four are sent, in the same order. Then it tries a hash nobody approved, all zeros, and the write path refuses: the plan's hash isn't the approved one, so it won't run a plan nobody reviewed. Step nine runs every test: five hundred thirteen pass, none fail. Then delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 7 to 9.`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: a real exchange, and a real disable");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant, test subscription, test AD domain and test repository, never production, with fictional names"],
    ["Who", "A reading app with Application.Read.All, AuditLog.Read.All and Reader; a person with Cloud Application Administrator and Managed Identity Contributor"],
    ["Convert", "A test conversion from a client secret to a federated credential; capture the real iss and sub from one workflow run"],
    ["Run it through", "Plan, apply, exchange for real, and run the parallel run through to the legacy account's disable"],
    ["Back it out", "Step 7: enable the test account again; remove the test credentials; delete the identity, the app and the account by hand; delete out"],
  ], { fontSize: 12, limit: 5.3 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 05, Lab 2, which has the exact commands.");
  sources(s, "Sources: Module 7, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 takes the same path in your own test tenant, worldwide or G C C, with a test subscription, a test Active Directory domain and a test repository. Never production, and only fictional names. A reading app holds two Graph read permissions and Reader, and a person with Cloud Application Administrator and Managed Identity Contributor does the write. Make a test conversion from a client secret to a federated credential. The key step is capturing the real issuer and subject from one workflow run, because that's the truth the check compares against. Then plan, apply, exchange a token for real, and run the parallel run through to the legacy account's disable. To back it out, step seven enables the test account again, removes the test credentials, and deletes the rest by hand, because this code never deletes. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G5");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.5, 3.4, 5.25], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["IA-5, IA-5(2); IA-9", "KSI-IAM-SNU (IA-5); none cites IA-9", "conversions.json; plan.json; findings.json, NPI-WIF-01 to -09"],
    ["IA-9; CM-4(2)", "KSI-CMT-VTD, KSI-CMT-LMC (CM-4(2))", "exchange-tests.json"],
    ["AC-2; AC-2(3) Disable Accounts", "KSI-IAM-SNU; KSI-IAM-AAM", "conversion-records.json; cutover-log.csv; the apply's results.json"],
    ["AC-6; CM-5", "KSI-IAM-ELP, KSI-IAM-JIT; KSI-CMT-RVP", "The permissions for federation and federation-apply"],
    ["CM-3", "KSI-CMT-RMV, KSI-CMT-LMC", "The plan's SHA-256; the dry-run and apply folders"],
    ["AU-2 and AU-12", "KSI-MLA-LET", "Lab 2: the beta sign-in entry with federatedIdentityCredential"],
    ["AU-9 and SI-7", "KSI-MLA-OSM (AU-9); KSI-SVC-VRI (SI-7)", "manifest.json in each output folder"],
  ], { fontSize: 11, limit: 5.7 });
  line(s, "KSI", "KSIs are FedRAMP 20x provider indicators; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.15, 0.45, 13);
  sources(s, "Sources: Module 7, \"Introduction\" (the federal requirement); the guide's \"Evidence\" section.");
  notes(s,
`The federal requirement. Gate 5 supports NIST special publication eight hundred fifty-three I A five, I A nine and A U two. Your organization still sets the organization-defined parameters, and the assessor decides whether each is satisfied. The module's table maps each control to its evidence. Authenticator management and service identification: the conversion file, the plan and the findings. Verification of controls: the exchange tests. Account management and disabling accounts: the conversion records, the cutover log and the apply's results. Least privilege and access restrictions for change: the two tasks' permissions. Change control: the plan's hash, and the dry-run and apply folders. Audit events: Lab 2's sign-in entry that shows a federated credential was used. And the run's integrity: the manifest in each output folder. K S I's are FedRAMP twenty X indicators for cloud service providers; which file supports which indicator is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); the guide — "Evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on conversion", [
    { q: "A credential's subject has Production where the workflow presents production. What happens when it's created?", options: ["a. Creation fails with an error", "b. It's created without error, and the exchange fails later; the check flags it first (NPI-WIF-02)", "c. Entra ID corrects the case"] },
    { q: "conv-01 ran 40 days with no logon by the old account, and the owner approved. What does the plan do with the legacy account?", options: ["a. Deletes it", "b. Disables it with Disable-ADAccount, after review; this code never deletes it", "c. Leaves it enabled for another 30 days"] },
  ], "1 b: a wrong subject is created successfully and fails only at the exchange. 2 b: disable, never delete.");
  sources(s, "Sources: Module 7, \"Knowledge check,\" questions 1 and 4, and \"Check your answers\"; Microsoft Learn, FIC considerations.");
  notes(s,
`Check yourself with two questions. First: a credential's subject has Production, capital P, where the workflow presents production, lower case. What happens when it's created in Entra I D? The answer is b. It's created without error, and the token exchange fails later. Microsoft Learn's workload identity federation documentation says a wrong subject is created successfully. The check flags it first, as N P W I F oh two. Second: conversion one ran forty days with no logon by the old account, and the owner approved. What does the plan do with the legacy account? The answer is b. It disables it with Disable A D Account, after review. This code never deletes it, so the rollback, enabling it again, stays possible. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary, and next: Module 8, gMSAs and dMSAs");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Planned eight conversions in two waves",
    "Caught a trailing slash, a wrong case and a stray space before any credential reached the tenant",
    "Read each conversion's parallel run",
    "Applied four approved writes to the fake, an identity before its credential",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 8: Convert Kerberos accounts to gMSAs and dMSAs", [
    "The second half of Gate G5",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "the conversions, cutover log, plan and its SHA-256, findings, exchange tests, conversion records and the apply folder, dated.");
  sources(s, "Sources: Module 7, \"Summary\"; Module 8.");
  notes(s,
`To sum up. You planned eight conversions in two waves, and caught a trailing slash, a wrong case and a stray space before any credential reached the tenant. You read each conversion's parallel run, applied four approved writes to the fake, an identity before its credential, and saw the write path refuse a plan nobody reviewed. The evidence an ISSO keeps for Gate 5 from this module is the conversion file, the cutover log, the plan with its approved hash, the findings, the exchange tests, the conversion records, and the apply folder's results and manifest, all dated. Before you ship, work through the chapter's checklist. Next is Module 8: convert Kerberos accounts to group managed and delegated managed service accounts.`,
  `${M} — Unit "Summary"; Module 8.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 7 deck", [
  "Module page: docs/training/non-person-identity/07-federation-and-managed-identities.md (Non-Person Identity learning path, Module 7): Introduction and its requirement table, objectives, prerequisites, Units 1 to 3, Lab 1, Lab 2, knowledge check and summary. The learning path index: what you need for the labs.",
  "What the module links for the design and rules: Non-Person Identity: An Implementation Guide, Step 5, Step 2, \"Dangers\" and \"Evidence\"; workbook Chapter 05, \"What the code depends on,\" \"The checks,\" \"The plan,\" \"The separate write path.\"",
  "Kit: examples/non-person-identity (Invoke-NpiFederation.ps1; powershell/NpiFederation; tests/fixtures/ch05). Fictional tenant. Illustrative: tested against fixtures, not run against a live tenant; the exchange test goes only to a fake.",
  "Lab output: run November 3, 2026 with PowerShell 7 and Pester 5 in a scratch copy of examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it; long commands are wrapped and output trimmed where the slides say so. Verification: docs/training/non-person-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
