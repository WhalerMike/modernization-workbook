// Non-Person Identity learning path, Module 13: Run the managed service account standard — the module's narrated deck.
// Teaches docs/training/non-person-identity/13-the-managed-service-account-standard.md, Learn-style: objectives, the
// concepts (who does what, the settings, machines run the steps, the steps S1 to S11), five "Try it" slides with the
// real Lab 1 commands and output (the kit's captures, data/kit-captures/npi/12-*, since the module runs workbook
// Chapter 12's Lab 1), Lab 2, the federal requirement and evidence, a two-question check, and the summary.
// Every fact comes from the module page, the companion guide's managed service account standard and workbook
// Chapter 12 that the page sends the learner to, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-13/build.js \
//                      presentations/training-npi-module-13/Training_NPI_Module_13.pptx
const TITLE = "Module 13: Run the managed service account standard";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 13: Run the managed service account standard",
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
const OUT = process.argv[2] || "Training_NPI_Module_13.pptx";
const M = "Training, Non-Person Identity, Module 13";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES, -AsOf 2026-11-20";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 13: Run the managed service account standard", "Non-Person Identity learning path · Every gMSA and dMSA, with workbook Chapter 12",
    ["Who does what  ·  The settings  ·  Machines run the steps  ·  S1 to S11", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 13 of the Non-Person Identity learning path: run the managed service account standard. It teaches the standard in the companion guide Service Accounts, with Chapter 12 of the developer workbook. Module 12 moved one account by hand. This module is about every account after that: how a G M S A is asked for, approved, created, watched, attested and retired the same way each time, with the same evidence. Take it after Modules 8 and 12.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why one standard for every managed service account");
  tag(s, "Why");
  const l = panel(s, "One", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "MODULE 12", "One account, by hand", [
    "One account moved, with Microsoft Learn's commands",
    "The kit planning the same moves",
  ], 13.5);
  const r = panel(s, "Every", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE STANDARD", "Every account, the same way", [
    "Asked for, approved, created, watched, attested and retired",
    "With the same evidence each time",
  ], 13.5);
  callout(s, "Split", Math.max(l, r) + 0.3, 1.2, "FaRoute", HEX.navy, "The work splits three ways: ",
    "SailPoint approves, reached through the agency's system access management tool. ServiceNow records the change and the findings. Microsoft's tools create and enforce.");
  sources(s, "Sources: Module 13, \"Introduction\"; learning path index; Service Accounts guide, \"The managed service account standard.\"");
  notes(s,
`Why a standard? Module 12 moved one account, with Microsoft Learn's commands, and the kit planned the same moves. The standard makes every managed service account after that go the same way: asked for, approved, created, watched, attested and retired, with the same evidence each time. It splits the work three ways. SailPoint approves, reached through the agency's system access management tool. ServiceNow records the change and the findings. And Microsoft's tools create and enforce: Active Directory PowerShell through Chapter 6's approved plan, Group Policy, Defender for Identity and, when the workload moves, Microsoft Entra.`,
  `${M} — Unit "Introduction"; Service Accounts guide — "The managed service account standard."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 13", [
    "Name who does what: the access management tool, SailPoint, ServiceNow, the pipeline and a person",
    "Give the standard's settings: name, OU, retriever group, encryption, interval, outbound-only, owners, cadence, 90 days",
    "Explain why machines run every step they can, and where people still must",
    "Run Chapter 12's checks on fixtures and read the findings, the Chapter 06 inputs, the certifications and the retirement list",
  ], [
    "Modules 8 and 12",
    "PowerShell 7.1 or later with Pester 5",
    "No tenant or domain",
  ], 55);
  sources(s, "Sources: Module 13, \"Learning objectives,\" \"Prerequisites.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll name who does what in the standard: the access management tool, SailPoint, ServiceNow, the pipeline and a person. You'll give the standard's settings: the name, the O U, the retriever group, encryption, the password interval, outbound-only, the owners, the certification cadence and the ninety-day window. You'll explain why machines run every step they can, and where people still must. And you'll run Chapter 12's checks on fixtures, and read the findings, the Chapter 6 inputs, the certifications, the ServiceNow findings and the retirement list. Before you start, finish Modules 8 and 12. You need PowerShell 7.1 or later with Pester 5, and no tenant or domain.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Who does what
{
  const s = content(SC, "Who does what, and what each system never does");
  tag(s, "Who");
  const b = table(s, "Roles", 1.45, [3.0, 5.85, 3.3], ["System", "Its job in the standard", "Never"], [
    ["Access management tool", "The request front end: an owner asks for, changes or retires an account; it hands the request to SailPoint", "Approves or writes anything"],
    ["SailPoint", "Approves every request, whatever its risk tier; aggregates gMSAs; correlates owners; runs certifications", "Writes a gMSA in AD"],
    ["ServiceNow", "The change record, the typed findings and the decommission ticket; closes a task only on a re-read", "Approves the account"],
    ["The pipeline, as gmsa-msapipe", "Runs the approved Chapter 06 plan: creates the gMSA, sets its retriever group, disables and moves a superseded account", "Runs a dMSA step, an uninstall or a delete"],
    ["A person", "Approves in SailPoint; runs the dMSA steps, Uninstall-ADServiceAccount and every delete; accepts risk", "Clicks through a portal to do the pipeline's work"],
  ], { fontSize: 12, limit: 5.7 });
  line(s, "Rights", "gmsa-msapipe is itself a gMSA, with two owners, a sponsor and its own certification (design guidance).", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 13, Unit 1; Service Accounts guide, \"Who does what\"; decisions WD-162, WD-163.");
  notes(s,
`Unit 1 is who does what. The agency's system access management tool is the request front end: an owner asks for, changes or retires an account there, and it hands the request to SailPoint. It never approves or writes anything itself. SailPoint approves every request, whatever its risk tier, aggregates the accounts, correlates each one to its owners and runs the certifications. It never writes a G M S A in Active Directory. ServiceNow holds the change record, the typed findings and the decommission ticket, and closes a task only on a re-read. It never approves the account. The pipeline runs Chapter 6's approved plan as G M S A dash M S A pipe, with only the delegated rights it needs. And a person still runs the D M S A steps, the uninstall and every delete. The pipeline's identity is itself a G M S A, with two owners, a sponsor and its own certification.`,
  `${M} — Unit 1 "Who does what, and the settings": Service Accounts guide, "Who does what."`);
}

// ================================================================== 5 Settings
{
  const s = content(SC, "The standard's settings for every account");
  tag(s, "What");
  const b = table(s, "Settings", 1.45, [3.0, 9.15], ["Setting", "The standard"], [
    ["Name", "gmsa-<app> or dmsa-<app>; 15 characters or fewer before the $; unique in the forest (Learn)"],
    ["Where it lives", "<service-account-ou>, a dedicated OU; created only by DL-gMSA-Creators, whose only member is gmsa-msapipe"],
    ["Password retrievers", "Always one domain local group, DL-gMSA-<app>-Hosts"],
    ["Encryption; interval", "AES256 only; 30 days, stated at creation (Learn: set only at creation)"],
    ["No SPN", "Outbound-only (-RestrictToOutboundAuthenticationOnly) unless a recorded reason"],
    ["Owners; privileged groups", "Two named technical owners and a federal-employee sponsor; no privileged group"],
    ["Attestation", "SailPoint certification by the two owners: quarterly for R1, twice a year for R2, annually for R3"],
    ["Disabled before delete", "90 days, with no sign-in seen"],
  ], { fontSize: 12, limit: 6.5 });
  sources(s, "Sources: Module 13, Unit 1; Service Accounts guide, \"The standard's settings\"; Learn, Manage gMSAs; WD-159 to WD-167.");
  notes(s,
`The standard's settings. The name is G M S A dash app, or D M S A dash app, fifteen characters or fewer, and Microsoft Learn says it must be unique in the forest. It lives in a dedicated service-account O U, where only the creators group may create one, and that group's only member is the pipeline. Its password retrievers are always one domain local group of the hosts. Encryption is A E S two fifty-six only, and the password interval is thirty days, stated at creation, because Learn says it can be set only then. A G M S A with no S P N is outbound-only, unless there's a recorded reason. Every account has two named technical owners and a federal-employee sponsor, and no privileged group. The two owners certify it in SailPoint: quarterly for R one, twice a year for R two, annually for R three. And it stays disabled for ninety days, with no sign-in seen, before anyone deletes it.`,
  `${M} — Unit 1 "Who does what, and the settings": Service Accounts guide, "The standard's settings."`);
}

// ================================================================== 6 Machines run the steps
{
  const s = content(SC, "Machines run the steps; people decide");
  tag(s, "Why");
  const l = panel(s, "Mach", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "MACHINES RUN", "Every step a script can", [
    "The request's checks, the plan and the AD writes",
    "The re-read that closes the ticket",
    "The monitoring, the certification campaigns, the evidence",
  ], 13);
  const r = panel(s, "People", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "PEOPLE", "Decide, approve, accept risk", [
    "Approve in SailPoint",
    "Run the steps that need Domain Admins or that delete",
    "Separation of duties (AC-5): approver, pipeline owner and deleter apart",
  ], 13);
  callout(s, "Req", Math.max(l, r) + 0.3, 1.2, "FaClipboardCheck", HEX.navy, "Why it lines up: ",
    "NIST SP 800-53 AC-2(1), AC-2(3), AC-2(4); FedRAMP KSI-IAM-AAM; CISA's Zero Trust Maturity Model. Automation supports a requirement; the assessor decides.");
  sources(s, "Sources: Module 13, Unit 2; Service Accounts guide, callout \"Machines run the steps; people decide\"; WD-170.");
  notes(s,
`Unit 2 is the standard's callout: machines run the steps, people decide. Every step a machine or a script can run, it runs: the request's checks, the plan, the Active Directory writes, the re-read that closes the ticket, the monitoring, the certification campaigns and the evidence. People decide, approve in SailPoint, accept risk, and run the few steps that need Domain Admins or that delete something. This lines up with the federal requirements better than the same work done by hand in a console or portal. NIST SP 800-53 has enhancements for automated account management, disabling accounts and automated audit actions: A C two, enhancements one, three and four. FedRAMP's K S I dash I A M dash A A M is Automating Account Management. And CISA's Zero Trust Maturity Model makes automation and orchestration a cross-cutting capability. Automation has limits, and the standard keeps them. Separation of duties keeps the approver, the pipeline's owner and the person who deletes apart, the authorizing official accepts the pipeline, and the pipeline's own identity is governed. Automation supports a requirement; the assessor decides.`,
  `${M} — Unit 2 "Machines run the steps": Service Accounts guide, callout "Machines run the steps; people decide."`);
}

// ================================================================== 7 Steps
{
  const s = content(SC, "The steps from request to retirement: S1 to S11");
  tag(s, "How");
  const b = table(s, "Steps", 1.45, [2.6, 7.0, 2.55], ["Step", "What happens", "Runs it"], [
    ["S1 Request", "The owner asks; Chapter 12 checks every field before SailPoint's approvers see it", "Owner; Chapter 12"],
    ["S2 Decide; S3 Approve", "The decision path gives the target; SailPoint approves; ServiceNow opens the change", "Owner; approvers"],
    ["S4 Create", "The approved plan: the gMSA in the OU, AES256, 30 days, its retriever group", "The pipeline"],
    ["S5 Install and restrict", "Install-ADServiceAccount, Test-ADServiceAccount; Group Policy; no privileged group", "Hosts; Group Policy"],
    ["S6 Register and close", "SailPoint aggregates it; the task closes only on Chapter 12's re-read", "SailPoint; Chapter 12"],
    ["S7 Watch; S8 Attest", "Defender for Identity and scheduled checks; the owners certify on the tier's cadence", "Scheduled; owners"],
    ["S9 Owner change", "An HR event starts a transfer; an orphan is disabled, then has 30 days to be claimed", "Workflow; SailPoint"],
    ["S10 Retire; S11 Move", "Disable and move; 90 days with no sign-in; a person deletes. S11: Migration C", "Pipeline, then a person"],
  ], { fontSize: 11.5, limit: 6.5 });
  sources(s, "Sources: Module 13, Unit 3; Service Accounts guide, \"The steps\" (S1 to S11).");
  notes(s,
`Unit 3 follows one G M S A through the steps. It's requested, and Chapter 12 checks every field before SailPoint's approvers see it: that's S1. It's decided, with the guide's decision path giving the target, in S2. SailPoint approves it, and ServiceNow opens the change record, in S3. The pipeline creates it from the approved plan, in the O U, A E S two fifty-six, thirty days and its retriever group, in S4. It's installed on the hosts and restricted with Group Policy, in S5. SailPoint aggregates it, and the ServiceNow task closes only on Chapter 12's re-read, in S6. It's watched with Defender for Identity, in S7, and certified by its owners, in S8. It's handed over when an owner leaves, in S9. And it's retired, in S10: the pipeline disables it and moves it, and after ninety days with no sign-in, a person uninstalls and deletes it. S11 is the move to Entra, when the workload moves.`,
  `${M} — Unit 3 "The steps from request to retirement": Service Accounts guide, "The steps."`);
}
endModule(SC);

// ================================================================== 8 Try it: run the checks
{
  const s = content(SL, "Try it: run the standard's checks on the fixtures");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/non-person-identity",
    "$ ./Invoke-NpiGmsaStandard.ps1 -InputPath tests/fixtures/ch12/inputs -StandardPath tests/fixtures/ch12/standard.json `",
    "      -OutputPath out/msa-standard -AsOf 2026-11-20",
    "As of 2026-11-20; 5 request(s), 9 AD managed account(s), 8 register row(s)",
    "Findings: 25 Finding, 4 Warn, 3 Info",
    "Requests: 2 passed (REQ-2026-0201, REQ-2026-0202); 3 held",
    "Chapter 06 inputs: 2 kerberos-replatform.csv row(s), 1 password-retrievers.json gMSA(s)",
    "Certification: 1 Current, 2 DueSoon, 1 Overdue; 2 ServiceNow finding(s)",
    "Retirement: 1 DeleteCandidate, 1 EnabledInAd, 1 SignInSinceDisable, 1 Wait; nothing deleted",
    "  NPI-STD-01  REQ-2026-0203",
    "  ...",
    "  NPI-STD-29  gmsa-report$",
    "Manifest SHA-256: 12ef8d960e8c8d618215f13c007f5d597f3cfda7b6fc60b6b0f8057311b9522d",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED; "..." MARKS CUTS)`, pt: 10.5 });
  line(s, "Writes", "It writes its output folder and nothing else: nothing to AD, SailPoint, ServiceNow or Defender for Identity.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 13, \"Exercise: Lab 1,\" step 1; Chapter 12, Lab 1, step 1; data/kit-captures/npi/12-1.txt.");
  notes(s,
`Try it. Lab 1 runs in the non-person identity folder, with no domain. These are Chapter 12's Lab 1 steps, and the chapter shows each one's expected output. Step one runs the standard's checks on the fixtures, as of November 20, 2026: five requests, nine Active Directory managed accounts and eight register rows, each built to trip one or more rules. Look for the requests line: two passed, and three are held. Then the Chapter 6 inputs, the certifications, and the retirement list, which ends nothing deleted. Then one line per rule, and the manifest's hash. The script writes its output folder and nothing else: nothing to Active Directory, SailPoint, ServiceNow or Defender for Identity.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 1; workbook Chapter 12, Lab 1, step 1.`);
}

// ================================================================== 9 Try it: findings
{
  const s = content(SL, "Try it: read the findings, and gmsa-ops$");
  tag(s, "How");
  const c = code(s, "Find", 0.6, 1.45, 12.15, [
    "# Step 2: read the findings",
    "$ Get-Content out/msa-standard/findings.json -Raw | ConvertFrom-Json | Sort-Object Rule | Format-Table Rule, Severity, ObjectKey",
    "Rule       Severity ObjectKey",
    "NPI-STD-01 Finding  REQ-2026-0203        ...",
    "NPI-STD-10 Finding  gmsa-ops$",
    "NPI-STD-16 Finding  gmsa-ops$",
    "NPI-STD-18 Finding  gmsa-ops$",
    "NPI-STD-20 Finding  gmsa-print$          ...",
    "NPI-STD-23 Warn     gmsa-web$|CAMP-2026-Q4-R1|comms.sponsor@contoso.example",
    "NPI-STD-24 Finding  svc-backup",
    "NPI-STD-25 Warn     msa-print01$",
    "NPI-STD-26 Finding  gmsa-ops$",
    "NPI-STD-26 Finding  msa-print01$",
    "NPI-STD-26 Finding  svc-backup           ...",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS)`, pt: 10.5 });
  line(s, "Ops", "gmsa-ops$: SailPoint never aggregated it (STD-10), it's in Domain Admins (STD-16), no request explains it (STD-18).", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 13, \"Exercise: Lab 1,\" step 2; Chapter 12, Lab 1, step 2, \"What Chapter 12 checks\"; data/kit-captures/npi/12-2.txt.");
  notes(s,
`Step two reads the findings, sorted by rule. Rules oh one to oh nine check the requests, ten to nineteen reconcile SailPoint with Active Directory, twenty to twenty-three are the certifications, twenty-four to twenty-six compare Defender for Identity's list, and twenty-seven to twenty-nine are the retirement. Find the three findings on G M S A dash ops. N P I S T D ten: SailPoint never aggregated it. Sixteen: it's in Domain Admins. Eighteen: no request explains it. That's the drift rule, and it runs every time. Defender for Identity's rules show up too: S V C dash backup is a user account still serving as a service account, M S A dash print oh one is a standalone managed service account, and rule twenty-six lists three accounts Defender for Identity sees that the register doesn't.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 2; workbook Chapter 12, Lab 1, step 2, "What Chapter 12 checks."`);
}

// ================================================================== 10 Try it: Chapter 06 inputs
{
  const s = content(SL, "Try it: what Chapter 12 hands to Chapter 06");
  tag(s, "How");
  const c = code(s, "In", 0.6, 1.45, 12.15, [
    "# Step 3: read what goes to Chapter 06",
    "$ Get-Content out/msa-standard/kerberos-replatform.csv",
    "\"SamAccountName\",\"NewAccount\",\"Workload\",\"Hosts\",\"SpnOwnerUpn\",\"EndDate\",\"Reference\",",
    "    \"HostChangedOn\",\"MigrationStartedOn\",\"OutboundOnlyReason\",\"RequestId\",\"ChangeRecord\"",
    "\"svc-billing\",\"dmsa-billing$\",\"ScheduledTask\",\"BILL01\",\"\",\"2027-09-30\",\"\",\"\",\"\",\"\",\"REQ-2026-0202\",\"CHG0041202\"",
    "\"svc-payroll\",\"gmsa-payroll$\",\"Service\",\"PAY01;PAY02\",\"payroll.owner@contoso.example\",\"2028-12-31\",\"\",\"\",\"\",\"\",\"REQ-2026-0201\",\"CHG0041201\"",
    "$ Get-Content out/msa-standard/password-retrievers.json",
    "{ \"_comment\": \"Generated by Chapter 12 from approved requests (the kit's import format), for review ...\",",
    "  \"accounts\": {",
    "    \"gmsa-payroll$\": [ \"CN=DL-gMSA-payroll-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example\" ] },",
    "  \"requests\": {",
    "    \"gmsa-payroll$\": { \"requestId\": \"REQ-2026-0201\", \"changeRecord\": \"CHG0041201\" } } }",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED AND REFLOWED; "..." MARKS A CUT)`, pt: 10 });
  line(s, "Dmsa", "Both rows carry a RequestId and a ChangeRecord. Only the gMSA has a retriever group: a dMSA learns its hosts during its migration.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 13, \"Exercise: Lab 1,\" step 3; Chapter 12, Lab 1, step 3; data/kit-captures/npi/12-3.txt.");
  notes(s,
`Step three reads what the code hands to Chapter 6. The two requests that passed become two rows of the replatform file: a D M S A for the billing account and a G M S A for payroll. Check that both rows carry a request I D and a change record: the SailPoint request and the ServiceNow change that approved them. The retrievers file has one entry, for the payroll G M S A, naming its one group of hosts. The D M S A has no entry, because a D M S A learns its hosts during its migration. These files go into Chapter 6's reviewed inputs in a reviewed pull request, and Chapter 6's plan refuses a write with no request or change record. So the plan creates exactly what was approved.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 3; workbook Chapter 12, Lab 1, step 3, "What it hands to Chapter 06."`);
}

// ================================================================== 11 Try it: certifications
{
  const s = content(SL, "Try it: the certifications and the ServiceNow findings");
  tag(s, "How");
  const c = code(s, "Cert", 0.6, 1.45, 12.15, [
    "# Step 4: read the certifications and the ServiceNow findings",
    "$ Get-Content out/msa-standard/certification.json -Raw | ConvertFrom-Json | Format-Table Account, RiskTier, LastCertifiedOn, DueOn, Status",
    "Account        RiskTier LastCertifiedOn DueOn      Status",
    "-------        -------- --------------- -----      ------",
    "dmsa-hrsync$   R1                       2026-12-18 DueSoon",
    "gmsa-intranet$ R2       2026-06-01      2026-12-01 DueSoon",
    "gmsa-print$    R3       2025-10-15      2026-10-15 Overdue",
    "gmsa-web$      R1       2026-10-01      2027-01-01 Current",
    "$ Get-Content out/msa-standard/servicenow-findings.json -Raw | ConvertFrom-Json | Format-Table drift_class, severity, ...",
    "drift_class    severity account_name attribute             observed_value",
    "-----------    -------- ------------ ---------             --------------",
    "stale_access   P2       gmsa-print$  certificationDecision REVOKE",
    "orphan_account P2       gmsa-web$",
  ], { label: `TRY IT  ·  ${CAP} (ONE COMMAND TRIMMED: "..." MARKS THE CUT)`, pt: 10.5 });
  line(s, "Print", "gmsa-print$ is R3, last certified October 2025: overdue. Its owner revoked it, so it's a stale_access finding.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 13, \"Exercise: Lab 1,\" step 4; Chapter 12, Lab 1, step 4; data/kit-captures/npi/12-4.txt.");
  notes(s,
`Step four reads the certifications and the ServiceNow findings. Each account is due by its risk tier: R one every three months, R two every six, R three every twelve. G M S A dash print is R three, last certified in October 2025, so it's overdue. And its owner revoked it, so it becomes a stale access finding for ServiceNow, without anyone retyping it. The second finding is an orphan account, on G M S A dash web. Look back at step two's warning on the same account: a certification decided by someone who isn't an owner doesn't count. The code writes these findings as the payload a ServiceNow import or the integration kit's client posts; it doesn't post them itself.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 4; workbook Chapter 12, Lab 1, step 4, "What Chapter 12 checks," "What it never does."`);
}

// ================================================================== 12 Try it: retirement
{
  const s = content(SL, "Try it: the retirement list, then clean up");
  tag(s, "How");
  const c = code(s, "Ret", 0.6, 1.45, 12.15, [
    "# Step 5: read the retirement list",
    "$ Import-Csv out/msa-standard/retirement-list.csv | Format-Table SamAccountName, DisabledOn, LastLogon, DaysDisabled, Status",
    "SamAccountName DisabledOn LastLogon  DaysDisabled Status",
    "-------------- ---------- ---------  ------------ ------",
    "gmsa-batch$    2026-07-01 2026-09-15 142          SignInSinceDisable",
    "gmsa-legacy$   2026-08-01 2026-07-30 111          DeleteCandidate",
    "gmsa-oldfax$   2026-10-01 2026-09-28 50           Wait",
    "gmsa-report$   2026-06-01 2026-11-19 172          EnabledInAd",
    "# Step 6: clean up",
    "$ Remove-Item -Recurse -Force out",
  ], { label: `TRY IT  ·  ${CAP}`, pt: 10.5 });
  line(s, "Del", "Only gmsa-legacy$ may be deleted, and only by a person through the decommission ticket. The code never deletes.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 13, \"Exercise: Lab 1,\" steps 5 and 6; Chapter 12, Lab 1, step 5; data/kit-captures/npi/12-5.txt, 12-8.txt.");
  notes(s,
`Step five reads the retirement list. Only one account is a delete candidate: G M S A dash legacy, disabled for a hundred and eleven days with no sign-in since. G M S A dash batch signed in after it was disabled, so it isn't one. G M S A dash report is still enabled in Active Directory, though the register says it's disabled. And G M S A dash oldfax has been disabled for only fifty days, so it waits for ninety. Who deletes G M S A dash legacy, and through what? A person, through the decommission ticket. The code never deletes: it says which accounts a person may delete, and why. Step six cleans up by removing the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 and 6; workbook Chapter 12, Lab 1, step 5, "Machines run the steps."`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: the same checks on a test domain's exports");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A test AD domain, never production, with Chapter 06's Lab 2 done; a SailPoint sandbox with an AD source scoped to the OU; Defender for Identity on the test domain"],
    ["1 and 2", "Write the test domain's standard settings; put the SailPoint and Defender for Identity exports in the kit's import formats, mapping each column by hand"],
    ["3", "Run with -Server <dc>: a live read of the gMSAs with Get-ADServiceAccount, recorded in the manifest"],
    ["4", "Read the findings and the manifest: one READ of Get-ADServiceAccount, and nothing else"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Drift", b + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "a gMSA you created by hand in Chapter 06's Lab 2 with no request in the register shows as NPI-STD-18, the drift rule working.");
  sources(s, "Sources: Module 13, \"Exercise: Lab 2, your test domain\"; Chapter 12, \"Lab 2: test domain and exports.\"");
  notes(s,
`Lab 2 runs the same checks on a test domain's exports from SailPoint and Defender for Identity, with a live read of the G M S A's. The authors haven't run it. Use a test Active Directory domain, never production, after Chapter 6's Lab 2: a K D S root key, the service-account O U, the delegated creators group and at least one G M S A. You also need a SailPoint sandbox with an Active Directory source scoped to that O U, and Defender for Identity on the test domain. Write the test domain's standard settings, then put the exports in the kit's import formats, mapping each product column by hand. Run the checks with a domain controller named, so the script reads the G M S A's live. A G M S A you created by hand in Chapter 6's Lab 2, with no request in the register, is rule eighteen: that's the drift rule working. The manifest shows one read, and nothing else.`,
  `${M} — Unit "Exercise: Lab 2, your test domain"; workbook Chapter 12, "Lab 2: test domain and exports."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [1.7, 3.6, 3.0, 3.85], ["Step", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["S1 Request", "AC-2 Account Management; IA-4 Identifier Management", "KSI-IAM-SNU; KSI-IAM-ELP, IAM-JIT", "request-check.json, the SailPoint approval, the ServiceNow change"],
    ["S6 Register", "CM-8 System Component Inventory; AC-6 Least Privilege", "KSI-PIY-GIV; KSI-IAM-ELP, IAM-JIT", "reconciliation.json"],
    ["S8 Attest", "AC-2; AC-6(7) Review of User Privileges", "KSI-IAM-SNU; KSI-IAM-AAM, IAM-JIT", "certification.json, servicenow-findings.json"],
    ["S10 Retire", "AC-2(3) Disable Accounts", "KSI-IAM-AAM, IAM-JIT, IAM-SUS", "retirement-list.csv, the decommission ticket"],
  ], { fontSize: 12, limit: 5.3 });
  line(s, "Ass", "A row provides evidence for a control; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 13, \"Introduction\" (the federal requirement); NIST SP 800-53; FedRAMP 20x KSIs; Chapter 12, \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. Each step of the standard names what it supports, and these are the rows this module's lab produces evidence for. The request check in S1 supports A C two, Account Management, and I A four, Identifier Management, in NIST SP 800-53, with the SailPoint approval and the ServiceNow change beside it. The reconciliation in S6 supports C M eight, System Component Inventory, and A C six, Least Privilege. The certifications and the ServiceNow findings in S8 support A C two and A C six, enhancement seven, Review of User Privileges. And the retirement list in S10, with the decommission ticket, supports A C two, enhancement three, Disable Accounts. K S I's are FedRAMP twenty X indicators for cloud service providers. A row provides evidence for a control; the assessor decides.`,
  `${M} — Unit "Introduction" (the federal requirement); workbook Chapter 12 — "Federal requirements and evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on the standard", [
    { q: "Who creates a gMSA in production under the standard?", options: ["a. A Domain Admin, by hand", "b. The pipeline, as gmsa-msapipe, running Chapter 06's approved plan with only the delegated rights", "c. SailPoint's Active Directory connector"] },
    { q: "An R2 gMSA was last certified seven months ago. What does Chapter 12 report?", options: ["a. Nothing: R2 is certified once a year", "b. NPI-STD-20, certification overdue: R2 is certified every six months", "c. A delete candidate"] },
  ], "1 b: SailPoint never writes a gMSA. 2 b: R1 every 3 months, R2 every 6, R3 every 12.");
  sources(s, "Sources: Module 13, \"Knowledge check,\" questions 2 and 5, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: who creates a G M S A in production under the standard? The answer is b: the pipeline, as G M S A dash M S A pipe, running Chapter 6's approved plan with only the delegated rights. SailPoint never writes a G M S A, and ServiceNow's Active Directory spoke isn't used. Second: an R two G M S A was last certified seven months ago. What does Chapter 12 report? The answer is b: N P I S T D twenty, certification overdue, because R two is certified every six months. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 5; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary: every managed service account, the same way");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU RAN", null, [
    "The request checks: two passed, three held",
    "The findings, with gmsa-ops$ caught by the drift rule",
    "Chapter 06's inputs, each with its request and change record",
    "The certifications, a revoke as a ServiceNow finding, and the retirement list",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "The learning path's index", [
    "Back to the learning path",
    "Or workbook Chapter 12, for its evidence and tests",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "The standard: ",
    "asked for in the access management tool, approved in SailPoint, recorded in ServiceNow, created by the pipeline, watched, certified, and retired after 90 days disabled by a person.");
  sources(s, "Sources: Module 13, \"Summary\"; workbook Chapter 12, Lab 1, steps 6 and 7.");
  notes(s,
`To sum up. The standard makes every managed service account the same: asked for in the agency's system access management tool, approved in SailPoint, recorded in ServiceNow, created by the pipeline, restricted with Group Policy, watched with Defender for Identity, certified by its two owners on its risk tier's cadence, and retired after ninety days disabled, by a person. Chapter 12 checks each of those steps on every run and writes the evidence. In this module you ran its checks, found the drift on G M S A dash ops, read the inputs it hands to Chapter 6, and read the certifications and the retirement list. Chapter 12 goes on with its evidence file and its tests. Next, go back to the learning path's index.`,
  `${M} — Unit "Summary"; workbook Chapter 12, Lab 1, steps 6 and 7.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 13 deck", [
  "Module page: docs/training/non-person-identity/13-the-managed-service-account-standard.md (Non-Person Identity learning path, Module 13): Introduction and its requirement table, objectives, prerequisites, Units 1 to 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: the companion guide Service Accounts, \"The managed service account standard\" (the callout \"Machines run the steps; people decide,\" \"Who does what,\" \"The standard's settings,\" \"The steps\"), decisions WD-159 to WD-170, and its Microsoft Learn footnotes (Manage group Managed Service Accounts; gMSA overview). NIST SP 800-53; FedRAMP 20x KSIs; CISA Zero Trust Maturity Model.",
  "Workbook Chapter 12, The Managed Service Account Standard: \"What Chapter 12 checks,\" \"What it hands to Chapter 06,\" Lab 1, Lab 2 (not run by the authors), \"Federal requirements and evidence.\" Kit: examples/non-person-identity (Invoke-NpiGmsaStandard.ps1, powershell/NpiGmsaStandard, tests/fixtures/ch12).",
  "Lab output: the kit's captures, data/kit-captures/npi/12-1.txt to 12-5.txt and 12-8.txt (scripts/kit_captures.py), on fictional fixtures with -AsOf 2026-11-20; trimmed, wrapped and reflowed where the slides say so.",
]);

finish(OUT);
