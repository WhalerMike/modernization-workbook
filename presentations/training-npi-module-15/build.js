// Non-Person Identity learning path, Module 15: Your first gMSA: set up the forest, then create a new gMSA — the module's
// narrated deck. Teaches docs/training/non-person-identity/15-your-first-gmsa.md, Learn-style: objectives, the concepts
// (the one-time setup in order; the KDS root key; a new gMSA for a new application; an SPN only when the workload needs
// one), "Try it" slides with the real Lab 1 commands and output (run on the kit's fixtures, tests/fixtures/m15, and
// checked by tests-m15/NpiFirstGmsa.Tests.ps1), Lab 2, the federal requirement and evidence, a two-question check, and the
// summary. Every fact comes from the module page, the companion guide's "Set it up once" and "A new gMSA for a new
// workload" and the steps they link, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-15/build.js \
//                      presentations/training-npi-module-15/Training_NPI_Module_15.pptx
const TITLE = "Module 15: Your first gMSA: set up the forest, then create a new gMSA";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 15: Your first gMSA",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
P.D.pres.title = `Non-Person Identity learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "NON-PERSON IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_NPI_Module_15.pptx";
const M = "Training, Non-Person Identity, Module 15";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES, -AsOf 2026-11-20";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 15: Your first gMSA", "Non-Person Identity learning path · Set up the forest, then create a new gMSA",
    ["Set up the forest once  ·  A new gMSA for a new application  ·  An SPN only if needed", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 15 of the Non-Person Identity learning path: your first G M S A. First you set up the forest, once. Then you create a new G M S A for a new application. It teaches two parts of the companion guide Service Accounts: set it up once, and a new G M S A for a new workload, with Chapters 6 and 12 of the developer workbook. Take it after Module 1 and before Module 8.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why start from nothing");
  tag(s, "Why");
  const l = panel(s, "Old", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "EVERY OTHER LAB", "Starts from an old account", [
    "A user account used as a service, an sMSA, a secret",
    "Move its SPNs, run in parallel, disable it",
  ], 13.5);
  const r = panel(s, "New", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THIS MODULE", "Starts from nothing", [
    "The forest gets what every gMSA needs, once",
    "A new application gets its gMSA from the first day, by the standard",
  ], 13.5);
  callout(s, "Order", Math.max(l, r) + 0.3, 1.2, "FaRoute", HEX.navy, "Before Module 8: ",
    "Module 8 converts the Kerberos accounts that already exist. This module sets up the forest they convert into.");
  sources(s, "Sources: Module 15, \"Introduction\"; Service Accounts guide, \"Set it up once,\" \"A new gMSA for a new workload.\"");
  notes(s,
`Why this module? Every other lab in this path starts from an account that already exists: a user account used as a service, a standalone managed service account, or a secret. You move its S P Ns, run in parallel, then disable it. This module starts from nothing. First the forest gets what every G M S A needs, once: a K D S root key, the O Us, a group that may create G M S As, and the pipeline's own G M S A. Then a new application gets its G M S A from the first day, by the managed service account standard, with no S P N to move, no parallel run and no old account to disable. That's why it comes before Module 8: Module 8 converts the accounts that already exist, into the forest this module sets up.`,
  `${M} — Unit "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 15", [
    "Set up a forest in order: the KDS root key and its wait, the OUs, DL-gMSA-Creators and its right, gmsa-msapipe",
    "Say when the backdated KDS key is allowed, and why a forest has only one key",
    "Follow a new workload's gMSA from request to a working service",
    "Decide whether a new gMSA is outbound-only, and register an SPN with setspn -S when it needs one",
    "Run Chapter 12's request check and Chapter 06's one-account plan on fixtures",
  ], [
    "Module 1, and the standard's settings",
    "PowerShell 7.1 or later with Pester 5",
    "No domain or tenant for Lab 1",
  ], 60);
  sources(s, "Sources: Module 15, \"Learning objectives,\" \"Prerequisites.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty minutes with Lab 1. You'll set up a forest for G M S As in the right order. You'll say when the backdated K D S key is allowed, and why a forest has only one key. You'll follow a new workload's G M S A from the request to a working service. You'll decide whether a new G M S A is outbound-only, and register an S P N when the workload needs one. And you'll run Chapter 12's request check and Chapter 6's one-account plan on fixtures. Before you start, finish Module 1 and read the standard's settings. You need PowerShell 7.1 or later with Pester 5, and no domain or tenant for Lab 1.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Setup in order
{
  const s = content(SC, "Set up the forest once, in this order");
  tag(s, "How");
  const b = table(s, "Setup", 1.45, [3.0, 6.55, 2.6], ["Step", "What happens", "Who"], [
    ["1 The KDS root key", "One per forest, created on a domain controller; confirmed by Event ID 4004; then wait up to 10 hours", "Domain or Enterprise Admin"],
    ["2 The OUs", "<service-account-ou> for managed service accounts; <holding-ou> for the disabled ones", "Domain Admin"],
    ["3 DL-gMSA-Creators", "The group, and the right to create msDS-GroupManagedServiceAccount objects on the OU, with dsacls (design guidance)", "Domain Admin"],
    ["4 gmsa-msapipe", "The pipeline's own gMSA, made once by hand by the standard, then the group's only member (WD-163)", "Domain Admin"],
  ], { fontSize: 12.5, limit: 5.2 });
  line(s, "After", "After the setup, nobody needs Domain Admins to create a gMSA: the pipeline does, through the approved plan.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 15, Unit 1; Service Accounts guide, \"Set it up once\" and A2; Learn, Create a KDS root key; Manage gMSAs.");
  notes(s,
`Unit 1 is the setup, and the order matters. First, the K D S root key, one per forest. A Domain Admin or Enterprise Admin creates it on a domain controller, confirms it with the K D S service's event forty oh oh four, and then waits: domain controllers wait up to ten hours before they allow a G M S A to be created, so the key replicates first. Second, the O Us: one for managed service accounts, and a holding O U for the disabled ones a migration retires. Third, the creators group, and the right to create G M S A objects on that O U. Microsoft Learn names the right but gives no command, so the guide uses D S A C L S, which is design guidance: run it in a test domain first, then check it. Fourth, the pipeline's own G M S A, made once by hand, by the standard, and then the group's only member. After that, nobody needs Domain Admins to create a G M S A.`,
  `${M} — Unit 1 "Set up the forest once": Service Accounts guide, "Set it up once"; A2.`);
}

// ================================================================== 5 KDS key
{
  const s = content(SC, "The KDS root key: one per forest, and the wait");
  tag(s, "What");
  const l = panel(s, "Prod", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "ANY FOREST", "Add-KdsRootKey -EffectiveImmediately", [
    "Then wait: up to 10 hours before a gMSA can be created",
    "Confirm it with the KDS service's Event ID 4004",
  ], 13);
  const r = panel(s, "Test", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "A SINGLE-DC TEST DOMAIN ONLY", "-EffectiveTime backdated 10 hours", [
    "Learn offers it for a test environment with one domain controller",
    "Never in production",
  ], 13);
  callout(s, "One", Math.max(l, r) + 0.3, 1.2, "FaKey", HEX.red, "Only one key: ",
    "Learn says more than one makes gMSAs fail after a password rotation, and a deleted, re-created key can stay cached until the KDC restarts on every domain controller.");
  sources(s, "Sources: Module 15, Unit 1; Service Accounts guide, A2; Learn, Create a KDS root key; Create gMSAs for Windows containers.");
  notes(s,
`The K D S root key deserves its own slide. In any forest, you create it with Add K D S Root Key, dash Effective Immediately, and then you wait, up to ten hours, before a G M S A can be created. Learn's K D S page offers a key backdated ten hours, but only for a test environment with one domain controller, and Learn's containers page says not to use it in production. So: never in production. And create only one. Learn says more than one key makes G M S As start failing after a password rotation, and a deleted and re-created key can stay cached, so the K D C has to be restarted on every domain controller.`,
  `${M} — Unit 1: Service Accounts guide, A2; Learn — "Create a Key Distribution Service (KDS) root key," "Create gMSAs for Windows containers."`);
}

// ================================================================== 6 New gMSA for a new application
{
  const s = content(SC, "A new gMSA for a new application");
  tag(s, "How");
  const b = table(s, "New", 1.45, [2.6, 9.55], ["Step", "For timesheet, a new service on TIME01 and TIME02"], [
    ["S1 to S3", "Asked for with no account to supersede; SailPoint approves; Chapter 12 checks every field; its row for Chapter 06 names the new gMSA itself"],
    ["S4 Create", "The pipeline runs Chapter 06's one-account plan: <service-account-ou>, AES256, 30 days, DL-gMSA-timesheet-Hosts, outbound-only"],
    ["S5 Install", "Each host restarts, then Install-ADServiceAccount and Test-ADServiceAccount: True"],
    ["The workload", "The service switched to the gMSA with a blank password; only the rights it needs"],
    ["Skipped", "No delegation to carry, no SPN to move, no 30-day parallel run, no account to disable"],
  ], { fontSize: 12.5, limit: 5.4 });
  line(s, "Why", "Those skipped steps exist to retire an old account. A new application has none.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 15, Unit 2; Service Accounts guide, \"A new gMSA for a new workload,\" A3 to A5; Learn, Manage gMSAs.");
  notes(s,
`Unit 2 follows one new application, timesheet, a service on two hosts. Its owner asks for a G M S A with no account to supersede. SailPoint approves, and Chapter 12 checks every field; the row it writes for Chapter 6 names the new G M S A itself, because there's no old account. The pipeline runs Chapter 6's one-account plan: the service-account O U, A E S two fifty-six, thirty days, its own hosts' group, and outbound-only. Each host restarts to pick up its group, then installs the G M S A and tests it. Then the service is switched to it, with a blank password, and given only the rights it needs. And look at what's skipped: no delegation to carry, no S P N to move, no thirty-day parallel run, no account to disable. Those steps exist to retire an old account, and a new application has none.`,
  `${M} — Unit 2 "A new gMSA for a new application": Service Accounts guide, "A new gMSA for a new workload."`);
}

// ================================================================== 7 SPN only if needed
{
  const s = content(SC, "An SPN only when the new workload needs one");
  tag(s, "What");
  const l = panel(s, "Out", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "TIMESHEET: A SERVICE", "No SPN: outbound-only", [
    "New-ADServiceAccount -RestrictToOutboundAuthenticationOnly",
    "The standard's default when nothing authenticates to it (WD-154)",
  ], 13);
  const r = panel(s, "Spn", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "VISITOR: AN IIS SITE", "HTTP/visitor.corp.contoso.example", [
    "Not outbound-only, with the reason recorded",
    "setspn -S, which checks for a duplicate first; setspn -L to confirm",
  ], 13);
  const c = code(s, "Spn", 0.6, Math.max(l, r) + 0.3, 12.15, [
    "# A person registers the SPN once nothing else holds it (the guide's step 5)",
    "setspn -S <service-class>/<host-fqdn> <DOMAIN>\\gmsa-<app>$",
    "setspn -L <DOMAIN>\\gmsa-<app>$",
  ], { label: "THE GUIDE'S COMMANDS (PLACEHOLDERS IN ANGLE BRACKETS)", pt: 12 });
  sources(s, "Sources: Module 15, Unit 2; Service Accounts guide, \"A new gMSA for a new workload,\" step 5, and the standard's settings; Learn, Setspn.");
  notes(s,
`Does the new G M S A need an S P N? Timesheet is a service that only calls out, so nothing authenticates to it with Kerberos. Its G M S A is outbound-only, which is the standard's default. Visitor is an I I S site that browsers reach with Kerberos, so its G M S A needs the S P N H T T P slash visitor. It isn't outbound-only, and the reason is recorded in the request. A person registers the S P N once nothing else holds it, with set S P N dash S, which Learn says checks for a duplicate before it adds one. Then set S P N dash L confirms it's on the G M S A.`,
  `${M} — Unit 2: Service Accounts guide, "A new gMSA for a new workload," step 5; Learn — "Setspn."`);
}
endModule(SC);

// ================================================================== 8 Try it: stand-ins
{
  const s = content(SL, "Try it: Learn's KDS and gMSA steps on the stand-ins");
  tag(s, "How");
  const c = code(s, "Pester", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/non-person-identity",
    "$ (Invoke-Pester -Path tests/KerberosIslandSamples.Tests.ps1 -FullNameFilter '*KdsRootKey*', `",
    "      '*Manage group Managed Service Accounts*' -Output None -PassThru).Tests | Where-Object Result -ne 'NotRun' | ...",
    "Passed  checks the KDS root key with Get-KdsRootKey, which returns the root key value itself",
    "Passed  offers Add-KdsRootKey backdated 10 hours, which the KDS page reserves for a test environment",
    "        with one domain controller",
    "Passed  creates a gMSA with its retrievers at creation: the model for CreateGmsa",
    "Passed  gives templates with angle-bracket placeholders that don't parse as PowerShell",
    "Passed  sets no Kerberos encryption type on the gMSA",
    "Passed  leaves installing and uninstalling the gMSA to a person on each host",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED; "..." MARKS A CUT)`, pt: 11 });
  line(s, "Six", "Six facts about Learn's own procedures. The standard adds AES256, which Learn's sample leaves out.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 15, \"Exercise: Lab 1,\" step 1; examples/non-person-identity/tests/KerberosIslandSamples.Tests.ps1.");
  notes(s,
`Try it. Lab 1 runs in the non-person identity folder, with no domain. Step one runs the kit's tests of Microsoft Learn's own K D S and G M S A procedures, against stand-ins for the Active Directory cmdlets. Six pass, each a fact about Learn's pages. Get K D S Root Key returns the key's value itself, so only an admin who would create the key runs it. The backdated key is for a test environment with one domain controller. Learn's G M S A sample sets its retrievers at creation, and sets no Kerberos encryption type, which is why the standard adds A E S two fifty-six. And installing the G M S A on each host is a person's step.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no domain," step 1.`);
}

// ================================================================== 9 Try it: requests
{
  const s = content(SL, "Try it: check the three requests (S1)");
  tag(s, "How");
  const c = code(s, "Req", 0.6, 1.45, 12.15, [
    "# Step 2: check the requests",
    "$ ./Invoke-NpiGmsaStandard.ps1 -InputPath tests/fixtures/m15/inputs -StandardPath tests/fixtures/ch12/standard.json `",
    "      -OutputPath out/first-gmsa -AsOf 2026-11-20",
    "As of 2026-11-20; 3 request(s), 0 AD managed account(s), 0 register row(s)",
    "Findings: 2 Finding, 0 Warn, 0 Info",
    "Requests: 2 passed (REQ-2026-0301, REQ-2026-0302); 1 held",
    "# Step 3: read why the third is held",
    "$ Get-Content out/first-gmsa/findings.json -Raw | ConvertFrom-Json | Format-List Rule, Object, Issue",
    "Rule   : NPI-STD-03",
    "Issue  : Name 'gmsa-kioskreporting$' isn't to the standard (WD-159): 19 characters before the $; ...",
    "Rule   : NPI-STD-04",
    "Issue  : 1 distinct owner(s); the standard needs exactly two named technical owners (WD-164)",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS A CUT)`, pt: 10.5 });
  line(s, "Held", "SailPoint approved REQ-2026-0303, and the code still holds it: approvers decide purpose and risk; the code checks the standard.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 15, \"Exercise: Lab 1,\" steps 2 and 3; Chapter 12, \"What Chapter 12 checks.\"");
  notes(s,
`Step two runs Chapter 12's request check on three approved requests for new workloads. The domain has no G M S A yet, so there's nothing to certify or retire. Two requests pass: timesheet and visitor. One is held. Step three reads why. Its name is nineteen characters before the dollar sign, and the standard allows fifteen. And it names only one owner, where the standard needs exactly two. SailPoint approved it, and the code still holds it. The approvers decide on the purpose and the risk; the code checks the standard, field by field, before anything is created.`,
  `${M} — Unit "Exercise: Lab 1," steps 2 and 3; workbook Chapter 12.`);
}

// ================================================================== 10 Try it: to Chapter 06
{
  const s = content(SL, "Try it: what goes to Chapter 06, with no old account");
  tag(s, "How");
  const c = code(s, "Ch6", 0.6, 1.45, 12.15, [
    "# Step 4: read what goes to Chapter 06",
    "$ Import-Csv out/first-gmsa/kerberos-replatform.csv | Format-Table SamAccountName, NewAccount, Workload, Hosts, ...",
    "SamAccountName  NewAccount      Workload   Hosts         OutboundOnlyReason RequestId     ChangeRecord",
    "--------------  ----------      --------   -----         ------------------ ---------     ------------",
    "gmsa-timesheet$ gmsa-timesheet$ Service    TIME01;TIME02                    REQ-2026-0301 CHG0041301",
    "gmsa-visitor$   gmsa-visitor$   IisAppPool VIS01                            REQ-2026-0302 CHG0041302",
    "$ (Get-Content out/first-gmsa/password-retrievers.json -Raw | ConvertFrom-Json).accounts | Format-List",
    "gmsa-timesheet$ : {CN=DL-gMSA-timesheet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example}",
    "gmsa-visitor$   : {CN=DL-gMSA-visitor-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example}",
  ], { label: `TRY IT  ·  ${CAP} (ONE COMMAND TRIMMED: "..." MARKS THE CUT)`, pt: 10.5 });
  line(s, "Same", "SamAccountName and NewAccount are the same: there's no old account. Each gMSA gets its own hosts' group.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 15, \"Exercise: Lab 1,\" step 4; Chapter 12, \"What it hands to Chapter 06.\"");
  notes(s,
`Step four reads what Chapter 12 hands to Chapter 6. Two rows, one for each request that passed, each with its request and its change record. Look at the first two columns. In a migration, the first one is the old account. Here it's the new G M S A itself, because there's no old account. And the retrievers file gives each G M S A its own domain local group of the hosts that run it.`,
  `${M} — Unit "Exercise: Lab 1," step 4; workbook Chapter 12.`);
}

// ================================================================== 11 Try it: plan
{
  const s = content(SL, "Try it: plan the timesheet gMSA (S4)");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "# Step 5: Chapter 06's one-account plan, for a gMSA that replaces no account",
    "$ $plan = New-NpiKrbGmsaPlan -Name 'gmsa-timesheet$' -RetrieverGroupDn 'CN=DL-gMSA-timesheet-Hosts,...' `",
    "      -AdStandardPath tests/fixtures/ch06/inputs/ad-standard.json -RequestId REQ-2026-0301 -ChangeRecord CHG0041301 ...",
    "$ $plan.actions[0] | Select-Object Action, Account, Cmdlet, RunBy, RequestId, ChangeRecord, Precheck | Format-List",
    "Action       : CreateGmsa                       RunBy        : pipeline",
    "Precheck     : krb-kds-root-keys: Ready; krb-service-accounts: gmsa-timesheet$ doesn't exist",
    "$ $plan.actions[0].Params",
    "Path                           OU=Service Accounts,DC=corp,DC=contoso,DC=example",
    "PrincipalsAllowedToRetrieveMa. {CN=DL-gMSA-timesheet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example}",
    "KerberosEncryptionType         AES256",
    "ManagedPasswordIntervalInDays  30",
    "RestrictToOutboundAuthenticat. True",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED AND REFLOWED: "..." MARKS CUTS)`, pt: 10.5 });
  line(s, "Std", "Every setting is the standard's. A name that breaks the standard makes the plan throw instead of planning.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 15, \"Exercise: Lab 1,\" step 5; Chapter 06, the kit's New-NpiKrbGmsaPlan.");
  notes(s,
`Step five builds Chapter 6's one-account plan, the plan for a G M S A that replaces no account. One action: create G M S A, run by the pipeline, with its request and change record. Its precheck names two things: the K D S root key must be ready, and the G M S A must not exist yet. The parameters are the standard's: the service-account O U, the hosts' group as the only retriever, A E S two fifty-six, thirty days, and outbound-only. A name that breaks the standard, like step three's, makes the plan throw instead of planning.`,
  `${M} — Unit "Exercise: Lab 1," step 5; workbook Chapter 06.`);
}

// ================================================================== 12 Try it: dry runs
{
  const s = content(SL, "Try it: the same plan, before and after the setup");
  tag(s, "How");
  const c = code(s, "Dry", 0.6, 1.45, 12.15, [
    "# Step 6: dry-run it in a forest with no KDS root key yet",
    "$ $sha = (Get-FileHash out/timesheet-plan/kerberos-plan.json -Algorithm SHA256).Hash.ToLower()",
    "$ ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/timesheet-plan/kerberos-plan.json -ApprovedSha256 $sha `",
    "      -RunAs Pipeline ... -KerberosFixturePath tests/fixtures/m15/ad-kerberos-no-kds-key.json ...",
    "DryRun as Pipeline: 1 Skipped",
    "  Skipped    pipeline CreateGmsa            gmsa-timesheet$ New-ADServiceAccount",
    "Outcome : Skipped",
    "Detail  : KDS root key Missing",
    "# Step 7: the same plan and hash, in the set-up forest",
    "$ ./Invoke-NpiKerberosIslandAction.ps1 ... -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json ...",
    "DryRun as Pipeline: 1 WouldSend",
    "  WouldSend  pipeline CreateGmsa            gmsa-timesheet$ New-ADServiceAccount",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS)`, pt: 10.5 });
  line(s, "Why", "Why the setup comes first: with no KDS root key, the plan creates nothing. Step 8 runs the module's 9 tests.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 15, \"Exercise: Lab 1,\" steps 6 to 8; examples/non-person-identity/tests-m15/NpiFirstGmsa.Tests.ps1.");
  notes(s,
`Step six dry-runs the plan, as the pipeline, with its approved hash, in a copy of the fictional forest before its setup, with no K D S root key. The create is skipped, and the detail says why: K D S root key missing. That's why Unit 1 comes first. Step seven runs the same plan, with the same hash, in the forest after its setup. Now the pipeline would send New A D Service Account. Nothing is sent in either run: they're dry runs. Step eight runs the module's nine tests, and cleans up.`,
  `${M} — Unit "Exercise: Lab 1," steps 6 to 8.`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: the setup and the gMSA in a test domain");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.0, 10.15], ["Step", "What you do"], [
    ["You need", "A test domain with one domain controller, never production; Domain Admin; a member server for <host>"],
    ["1 to 4", "The KDS root key (backdated only here, and only if none exists), the two OUs, DL-gMSA-Creators with dsacls, then gmsa-msapipe"],
    ["5", "The timesheet gMSA by hand, as the pipeline would: its hosts' group, New-ADServiceAccount, then read it back"],
    ["6", "On <host>, after a restart: Install-ADServiceAccount, Test-ADServiceAccount (True), a test service set to the gMSA"],
    ["7", "Back out the gMSA and its group; keep the setup, which is made once"],
  ], { fontSize: 12.5, limit: 5.2 });
  callout(s, "Not", b + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "Not run by anyone: ",
    "no step's output in Lab 2 has been seen. In any domain with more than one DC, use -EffectiveImmediately and wait 10 hours.");
  sources(s, "Sources: Module 15, \"Exercise: Lab 2, your test domain\"; Service Accounts guide, \"Set it up once,\" A2 to A5.");
  notes(s,
`Lab 2 does it for real, in a test domain with one domain controller, never production, as a Domain Admin, with a member server for the host. Nobody has run it yet, so no step's output has been seen. Steps one to four are the setup: the K D S root key, backdated only in this single domain controller test domain and only if none exists, the two O Us, the creators group with its right, and the pipeline's G M S A. Step five creates the timesheet G M S A by hand, the way the pipeline would. Step six, on the host after a restart, installs and tests it, and sets a test service to run as it. Step seven backs out the G M S A and its group, and keeps the setup, which is made once. In any domain with more than one domain controller, use Effective Immediately and wait ten hours.`,
  `${M} — Unit "Exercise: Lab 2, your test domain."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [1.9, 3.5, 3.0, 3.75], ["Step", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["S1 Request", "AC-2; IA-4; CM-8", "KSI-IAM-SNU; KSI-IAM-ELP, IAM-JIT; KSI-PIY-GIV", "request-check.json, findings.json"],
    ["S3 Approve", "AC-2; CM-3; AC-5", "KSI-IAM-SNU; KSI-CMT-LMC; KSI-IAM-JIT", "The request and change on every write in the plan"],
    ["S4 Create", "AC-6; IA-5; CM-3; AC-2(1)", "KSI-IAM-ELP, IAM-JIT; KSI-IAM-SNU, IAM-APM; KSI-CMT-LMC", "The plan's SHA-256; results.json; in production the apply manifest"],
    ["S5 Install", "AC-6; AC-6(5); CM-6", "KSI-IAM-ELP; KSI-IAM-JIT, IAM-SNU; KSI-CMT-LMC", "Test-ADServiceAccount True per host; the Group Policy report"],
  ], { fontSize: 11.5, limit: 5.4 });
  line(s, "Ass", "A row provides evidence for a control; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 15, \"Introduction\" (the federal requirement); Service Accounts guide, \"The steps\"; NIST SP 800-53; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement. The standard's steps each name what they support, and these are the rows this module's labs produce evidence for. The request check in S1 supports A C two, Account Management, I A four, Identifier Management, and C M eight, System Component Inventory, in NIST SP 800-53. The approval in S3 supports A C two, C M three, Configuration Change Control, and A C five, Separation of Duties, with the request and change carried on every write in the plan. The create in S4 supports A C six, Least Privilege, I A five, Authenticator Management, C M three and A C two enhancement one, automated account management, with the plan's hash and its results. And the install in S5 supports A C six, A C six enhancement five, and C M six, Configuration Settings. K S Is are FedRAMP twenty X indicators for cloud service providers. A row provides evidence for a control; the assessor decides.`,
  `${M} — Unit "Introduction" (the federal requirement); Service Accounts guide — "The steps."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on your first gMSA", [
    { q: "When may you use the KDS root key backdated 10 hours?", options: ["a. Whenever you can't wait 10 hours", "b. Only in a test environment with one domain controller, never in production", "c. In production, after a change record"] },
    { q: "A new IIS site needs the SPN HTTP/visitor.corp.contoso.example. What does the standard say?", options: ["a. Create the gMSA outbound-only and add the SPN later", "b. Not outbound-only, the reason recorded, and setspn -S, which checks for duplicates first", "c. Put the SPN on a user account"] },
  ], "1 b: Learn reserves it for a single-DC test domain. 2 b: outbound-only is for a gMSA with no SPN.");
  sources(s, "Sources: Module 15, \"Knowledge check,\" questions 2 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: when may you use the K D S root key backdated ten hours? The answer is b: only in a test environment with one domain controller, never in production. Second: a new I I S site needs the S P N H T T P slash visitor. What does the standard say? The answer is b: create the G M S A without the outbound-only restriction, record why, and register the S P N with set S P N dash S, which checks for duplicates first. Outbound-only is for a G M S A with no S P N. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 4; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary: set up once, then the standard from day one");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Learned the setup's order: the key, the OUs, the creators group, gmsa-msapipe",
    "Checked three new requests: two passed, one held",
    "Planned a gMSA that replaces no account, with the standard's settings",
    "Saw the plan create nothing until the forest has a KDS root key",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 8", [
    "Convert the Kerberos accounts that already exist",
    "Into the forest you just set up",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "The rule: ",
    "a new application gets its gMSA from the first day, by the standard: outbound-only unless it needs an SPN, and nothing to migrate from.");
  sources(s, "Sources: Module 15, \"Summary.\"");
  notes(s,
`To sum up. A forest is set up for G M S As once: one K D S root key, aged ten hours, the O Us, the creators group with its delegated right, and the pipeline's own G M S A. After that, a new application's G M S A follows the standard from the first day. It's requested and checked, planned and created by the pipeline with the standard's settings, installed and tested on its hosts, and given to the workload with a blank password. It's outbound-only unless the workload needs an S P N, and it has nothing to migrate from. Next, Module 8 converts the Kerberos accounts that already exist, into the forest you just set up.`,
  `${M} — Unit "Summary."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 15 deck", [
  "Module page: docs/training/non-person-identity/15-your-first-gmsa.md (Non-Person Identity learning path, Module 15): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2 (not run by anyone), knowledge check and summary.",
  "What the module links: the companion guide Service Accounts, \"Set it up once,\" \"A new gMSA for a new workload,\" \"The standard's settings,\" \"The steps,\" A2 to A5, and their Microsoft Learn footnotes (Create a KDS root key; Manage gMSAs; gMSA overview; Create gMSAs for Windows containers; Setspn; sc.exe config); decisions WD-154, WD-159, WD-163 and WD-164. NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 12, The Managed Service Account Standard (the request check), and Chapter 06, gMSAs, dMSAs and the Kerberos Island (the one-account plan and its dry run). Kit: examples/non-person-identity (Invoke-NpiGmsaStandard.ps1, New-NpiKrbGmsaPlan, Invoke-NpiKerberosIslandAction.ps1, tests/fixtures/m15, tests-m15).",
  "Lab output: run on the kit's fictional fixtures with -AsOf 2026-11-20 on November 24, 2026, and checked by tests-m15/NpiFirstGmsa.Tests.ps1 (9 passed); trimmed, wrapped and reflowed where the slides say so.",
]);

finish(OUT);
