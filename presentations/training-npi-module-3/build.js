// Non-Person Identity learning path, Module 3: Decide each identity's target — the module's narrated deck.
// Teaches docs/training/non-person-identity/03-decide-the-target.md, Learn-style: objectives, the concepts, three
// "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of
// examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it), Lab 2, the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, the path's
// verification log, the guide's Step 2 and workbook Chapter 03 that the page sends the learner to, or the kit; the
// deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-3/build.js \
//                      presentations/training-npi-module-3/Training_NPI_Module_3.pptx
const TITLE = "Module 3: Decide each identity's target";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 3: Decide each identity's target",
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
const OUT = process.argv[2] || "Training_NPI_Module_3.pptx";
const M = "Training, Non-Person Identity, Module 3";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 3: Decide each identity's target", "Non-Person Identity learning path · Gate G2 Decision, with workbook Chapter 03",
    ["Five places an identity ends  ·  Proposal, disposition, gate  ·  The matrix  ·  The findings", "Waves and rollback  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 3 of the Non-Person Identity learning path: decide each identity's target. You have a register from Module 1 and its owners from Module 2. Now every identity needs a target: where it ends up, and when. This module is Gate 2, Decision, with Chapter 3 of the developer workbook, which turns the program's migration path matrix into code. You'll run the matrix on the fixtures, read the owners' decisions and the waves they fall in, scope the Workload I D Premium license, and see why Gate 2 isn't met yet. The code runs on your laptop, against the same fictional estate. It's illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the decision has three owners, not one");
  tag(s, "Why");
  const b = table(s, "Three", 1.45, [2.6, 2.8, 6.75], ["Step", "Whose", "What it does"], [
    ["The proposal", "The matrix", "Proposes a target, by account type and where the workload runs"],
    ["The disposition", "The application owner", "Decides: retire, re-platform or keep, account by account (D-N3)"],
    ["The gate", "The ISSO", "Checks Gate 2: met only with no open Finding"],
  ], { fontSize: 13.5, limit: 3.6 });
  callout(s, "Five", b + 0.35, 0.95, "FaRoute", HEX.red, "Five places: ",
    "retire it; a gMSA or dMSA; a managed identity, a federated credential or a certificate. The program's rule: no stored secrets.");
  sources(s, "Sources: Module 3, \"Introduction\"; the program's migration path matrix and decision D-N3 (design guidance).");
  notes(s,
`Every identity ends in one of five places. Retire it. Move it to a group managed or delegated managed service account. Or move it to a managed identity, a federated credential, or a certificate. The program's migration path matrix, which is design guidance, decides by the account type and by where the workload runs, and its rule is simple: no stored secrets. But three things are easy to blur here, and the code keeps them apart. The matrix proposes a target. The application owner decides the disposition, account by account. And the ISSO checks the gate. Keep those three separate, and nobody can say the code made a decision that a person should have made. In this module you run all three on the fixtures, and read why Gate 2 isn't met yet.`,
  `${M} — Unit "Introduction"; workbook Chapter 03 — "The decisions the code holds."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Explain the difference between the matrix's proposal, the owner's disposition and Gate 2",
    "Name the target the matrix proposes for each account type and workload location",
    "Run the matrix on the fixtures and explain each finding",
    "Read a wave's rollback, and which identities workload Conditional Access can cover now and later",
  ], [
    "Modules 1 and 2: the matrix reads both runs",
    "Book 02, Chapter 09: the migration path matrix",
    "Lab 1: PowerShell 7.1+ with Pester 5, and a clone; no tenant",
  ], 55);
  sources(s, "Sources: Module 3, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll explain the difference between the matrix's proposal, the owner's disposition, and Gate 2. You'll name the target the matrix proposes for each account type and workload location. You'll run the matrix on the fixtures and explain each of its findings. And you'll read a wave's rollback, and say which identities Conditional Access for workload identities can cover now, and which after conversion. Before you start, finish Modules 1 and 2, because the matrix reads both of their runs. And read Book 2, Chapter 9, on the migration path matrix. Lab 1 needs PowerShell 7.1 or later with Pester 5, and a clone. No tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 The decision in the guide
{
  const s = content(SC, "The decision in the guide: Step 2, condensed");
  tag(s, "What");
  const b = table(s, "Step2", 1.45, [4.6, 3.6, 3.95], ["What you found", "Where it runs", "Target"], [
    ["Disabled, unused, or no owner after Step 1", "Anywhere", "Retire"],
    ["Traditional account", "Azure resource", "Managed identity, user-assigned preferred"],
    ["Traditional account calling Entra-protected APIs", "A host with an OIDC issuer", "App registration, federated credential"],
    ["Traditional account, Kerberos only", "On premises", "gMSA, or a dMSA on a Windows Server 2025 domain"],
    ["MSA", "On premises", "gMSA: upgrade first; an MSA or gMSA can't go to a dMSA"],
    ["App registration with a client secret", "Any", "Managed identity, then federation, then a certificate"],
  ], { fontSize: 12, limit: 5.1 });
  line(s, "Order", "Order of work: high-risk accounts first. A gMSA needs a KDS root key, once per domain; DCs wait up to 10 hours.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: the guide, Step 2 (design guidance); Learn, Create a KDS root key; Secure group managed service accounts; Delegated Managed Service Accounts overview.");
  notes(s,
`Unit 1 is the guide's Step 2, and the slide shows part of its condensed decision table, which is the program's design guidance. Anything disabled, unused or with no owner after Step 1 is retired. A traditional account for an Azure workload goes to a managed identity, user-assigned preferred. One calling Entra-protected A P I's from a host with an O I D C issuer gets an app registration with a federated credential. A Kerberos-only account on premises goes to a group managed service account, or a delegated one on a Windows Server 2025 domain. A managed service account is upgraded to a group managed one first, because, as Microsoft Learn's delegated managed service account documentation says, neither can be migrated to a delegated one. And a client secret is replaced: a managed identity, then federation, then a certificate. Two more points from Step 2. High-risk accounts go first. And a group managed account needs a K D S root key, created once per domain; Microsoft Learn's Create a K D S root key documentation says domain controllers wait up to ten hours after that.`,
  `${M} — Unit 1 "The decision in the guide"; the guide — Step 2.`);
}

// ================================================================== 5 The proposal
{
  const s = content(SC, "The proposal: matrix rows M01 to M19");
  tag(s, "What");
  const b = table(s, "Rows", 1.45, [1.7, 3.3, 7.15], ["Rows", "Account", "Proposed target"], [
    ["Retire first", "Unowned and unclaimed, or disabled", "Retire, with a stale-lead caution"],
    ["M01 to M05", "Traditional, off premises", "Managed identity; app registration with a federated credential; or with a certificate"],
    ["M06, M07", "Traditional, Kerberos", "dMSA where the domain and hosts allow it; otherwise gMSA"],
    ["M08 to M13", "MSA, gMSA, dMSA", "MSA to gMSA; keep a gMSA or dMSA; managed identity or federation once moved"],
    ["M14 to M18", "App registration, legacy SP", "A secret goes to a managed identity, then federation, then a certificate"],
    ["M19", "Managed identity", "Keep"],
  ], { fontSize: 12.5, limit: 5.1 });
  line(s, "Facts", "The workload facts come from the owner (workloads.csv). Without them, no proposal: NPI-MAT-02.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: the program's migration path matrix (design guidance); Learn, Securing on-premises and cloud-based service accounts; Delegated Managed Service Accounts overview.");
  notes(s,
`Unit 2 is the matrix as code. The proposal gives every identity in scope a target. SQL Server accounts are handed off, and an account found only by a password that never expires waits for confirmation. For the rest, retire comes first: for an account Module 2 found unowned and nobody claimed, or one already disabled. Otherwise the first matrix row that matches proposes the target. Rows one to five send a traditional account off premises to a managed identity, or an app registration with a federated credential or a certificate. Rows six and seven send a Kerberos account to a delegated managed service account where the domain and hosts allow one, otherwise a group managed one. Rows eight to thirteen handle the managed service accounts, fourteen to eighteen the app registrations, and nineteen keeps a managed identity. The workload facts come from the owner, and without them there's no proposal.`,
  `${M} — Unit 2 "The matrix as code": workbook Chapter 03, "The proposal (N2.1)."`);
}

// ================================================================== 6 The disposition: findings
{
  const s = content(SC, "The disposition and the waves: NPI-MAT-01 to -09");
  tag(s, "What");
  const b = table(s, "Mat", 1.45, [1.7, 10.45], ["Rule", "What it flags"], [
    ["NPI-MAT-01", "No disposition recorded, or one the code doesn't know"],
    ["NPI-MAT-02", "No proposal: the workload facts are missing, or no row matches"],
    ["NPI-MAT-03", "A target that doesn't fit; an MSA or gMSA sent to a dMSA; unconstrained delegation under a dMSA"],
    ["NPI-MAT-04", "The owner chose a target the matrix didn't propose (a Finding with no reason)"],
    ["NPI-MAT-05", "An account kept in AD with no end date, one past, or one after G5"],
    ["NPI-MAT-06", "An account kept on Kerberos with no SPN owner who is an enabled member"],
    ["NPI-MAT-07", "A HIGH-risk account re-platformed outside wave 1"],
    ["NPI-MAT-08", "A wave with no rollback owner who is an enabled member, or no review date"],
    ["NPI-MAT-09", "The Workload ID Premium scope (D-N4): no decision, or an identity Conditional Access can't cover"],
  ], { fontSize: 12, limit: 6.5 });
  sources(s, "Sources: Learn, Delegated Managed Service Accounts overview and FAQ; the program's decisions D-N3 and D-N4 and plan task N2.2 (design guidance).");
  notes(s,
`The owner's disposition is read row by row, and what's missing or wrong becomes a finding, N P I M A T oh one to oh nine. Oh one: no disposition. Oh two: no proposal, because the workload facts are missing. Oh three: a target that doesn't fit, such as a managed or group managed service account sent to a delegated one, which Microsoft Learn's delegated managed service account documentation says can't be done. Oh four: the owner chose a target the matrix didn't propose; that's allowed, with a reason on the record. Oh five: an account kept in Active Directory with no end date, or one past the program's dates. Oh six: an account kept on Kerberos with no S P N owner. Oh seven: a high-risk account re-platformed outside wave 1. Oh eight: a wave with no rollback owner, or no review date. And oh nine is the Workload I D Premium scope.`,
  `${M} — Unit 2: workbook Chapter 03, "The disposition (D-N3) and the waves (N2.2)."`);
}

// ================================================================== 7 Waves, D-N4, Gate 2
{
  const s = content(SC, "Waves and rollback, D-N4, and Gate 2");
  tag(s, "What");
  const l = panel(s, "Waves", 0.6, 1.45, 4.0, null, HEX.navy, HEX.navyTint, "WAVES (N2.2)", "Each with its rollback", [
    "Built from the members' targets",
    "Re-enable the legacy account; revert the configuration",
    "A dMSA: Undo-ADServiceAccountMigration; the superseded account is kept",
  ], 12.5);
  const m = panel(s, "DN4", 4.75, 1.45, 4.0, null, HEX.teal, HEX.tealTint, "WORKLOAD ID PREMIUM (D-N4)", "Who CA can cover", [
    "Only single-tenant service principals registered in the tenant",
    "Not multitenant apps or managed identities",
    "The program licenses Tier 1",
  ], 12.5);
  const r = panel(s, "Gate", 8.9, 1.45, 3.85, null, HEX.amber, HEX.amberTint, "GATE 2  ·  THE ISSO'S", "Five criteria", [
    "Met only when no finding of severity Finding is open",
    "Each criterion lists its open findings",
  ], 12.5);
  sources(s, "Sources: Learn, Setting up delegated Managed Service Accounts; Conditional Access for workload identities; Workload ID FAQ; the program's decision D-N4.");
  notes(s,
`Three more pieces. First, the waves. Each wave's rollback is built from its members' targets: re-enable the legacy account and revert the application's configuration, and for a delegated managed service account, the undo command from Microsoft Learn's Setting up delegated Managed Service Accounts documentation, with the superseded account kept, never deleted. Second, decision D N 4, on the Workload I D Premium license. Microsoft Learn's Conditional Access for workload identities documentation says it covers only single-tenant service principals registered in the tenant. Multitenant apps and managed identities aren't covered. The program's position, which is design guidance, is to license the single-tenant service principals classified Tier 1, and the code counts who's eligible now and after conversion. It buys nothing. Third, Gate 2 itself, the ISSO's: five criteria, each reported with its open findings, and the gate is met only when no finding of severity Finding is open.`,
  `${M} — Unit 2: workbook Chapter 03, "The decisions the code holds," "The disposition (D-N3) and the waves (N2.2)," "Gate 2."`);
}
endModule(SC);

// ================================================================== 8 Try it: run the matrix
{
  const s = content(SL, "Try it: run Modules 1 and 2, then the matrix");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 to 3, in examples/non-person-identity (step 1: 12 passed, 31 not run)",
    "$ Import-Module ./powershell/NpiMatrix/NpiMatrix.psm1",
    "$ $p = Get-NpiMatrixRequiredPermission; $p.GraphPermissions -join ', '; $p.Methods -join ', '",
    "LicenseAssignment.Read.All, User.Read.All",
    "GET",
    "# Step 3: ./Invoke-NpiInventory.ps1 ... | Out-Null; ./Invoke-NpiOwnership.ps1 ... | Out-Null; then:",
    "$ ./Invoke-NpiMatrix.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership -InputPath ... -OutputPath out/matrix",
    "Matrix: 21 identities in scope, 20 proposed (1 AppRegistrationFederated, 2 dMSA, 2 gMSA, 7 Keep,",
    "  2 ManagedIdentity, 6 Retire); 3 handed off, 1 to confirm first, 10 out of scope",
    "Dispositions: 18 decided of 22; waves 1 (1, 1 HIGH), 2 (3, 1 HIGH)",
    "Workload ID Premium (D-N4): Tier1, 2 in scope; tenant holds 2 enabled units",
    "Findings: 7 Finding, 4 Warn, 1 Info",
    "Gate 2: not met (Every account has a disposition and a target from the matrix: 3; HIGH-risk accounts",
    "  in the first wave: 1; Every kept Kerberos account has an SPN owner: 1; Waves and their rollback",
    "  recorded: 1; Workload ID Premium scope decided (D-N4): 1)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED; \"...\" MARKS CUTS)", pt: 10.5 });
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 1 to 3; examples/non-person-identity: Invoke-NpiMatrix.ps1, tests/fixtures/ch03 (fictional).");
  notes(s,
`Try it. Step one evaluates Microsoft Learn's two service account decision tables, from Securing on-premises service accounts and Securing cloud-based service accounts, exactly as published: twelve tests pass, and the thirty-one not run are the example's own. Step two lists what the matrix needs: two read permissions, License Assignment dot Read dot All and User dot Read dot All, and only the GET method. Step three runs Modules 1 and 2 quietly, then the matrix. Twenty-one identities are in scope and twenty get a proposal: six retire, seven keep, two group managed and two delegated managed service accounts, two managed identities, and one federated credential. The owners have decided eighteen of twenty-two, in two waves, and each wave holds one high-risk account. The license decision is Tier 1, two in scope, and the tenant holds two units. Seven findings, four warnings, one information item. And the last line: Gate 2 is not met, with the open findings for each of its five criteria.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 3.`);
}

// ================================================================== 9 Try it: proposals and findings
{
  const s = content(SL, "Try it: read the proposals and the findings");
  tag(s, "How");
  const c = code(s, "Prop", 0.6, 1.45, 6.4, [
    "# Step 4 (excerpt): Name, Risk, Location, MatrixRow, Proposed",
    "svc-hrsync      HIGH   OnPremKerberos M06 dMSA",
    "svc-webfront    HIGH   OnPremKerberos M06 dMSA",
    "svc-intranet    MEDIUM OnPremKerberos M07 gMSA",
    "msa-print01$    MEDIUM OnPremKerberos M08 gMSA",
    "Payroll Export  MEDIUM Azure          M14 ManagedIdentity",
    "HR Connector    LOW",
    "Mail Automation HIGH   OidcIssuer     M15 AppRegistrationFederated",
    "Deploy Bot      LOW    Azure          M14 ManagedIdentity",
    "... and six Retire, seven Keep",
  ], { label: "STEP 4  ·  RUN NOVEMBER 3, 2026 (EXCERPT)", pt: 10.5 });
  code(s, "Find", 7.2, 1.45, 5.55, [
    "# Step 5: Rule, Severity, Object (12 rows)",
    "NPI-MAT-07 Finding svc-hrsync",
    "NPI-MAT-01 Finding svc-oldftp",
    "NPI-MAT-01 Info    jdoe",
    "NPI-MAT-06 Finding svc-webfront",
    "NPI-MAT-07 Warn    svc-webfront",
    "NPI-MAT-07 Warn    gmsa-ops$",
    "NPI-MAT-05 Finding dmsa-hrsync$",
    "NPI-MAT-02 Finding HR Connector",
    "NPI-MAT-04 Warn    Deploy Bot",
    "NPI-MAT-08 Finding Wave 2",
    "NPI-MAT-09 Warn    Payroll Export",
    "NPI-MAT-09 Finding Vendor Portal",
  ], { label: "STEP 5  ·  RUN NOVEMBER 3, 2026 (TYPES CUT)", pt: 10.5 });
  line(s, "Read", "svc-hrsync is HIGH-risk but in wave 2. HR Connector has no proposal: nobody recorded where it runs.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 4 and 5; examples/non-person-identity/tests/fixtures/ch03 (fictional).");
  notes(s,
`Step four reads the proposals. Six are retire: Module 2's orphans and the disabled accounts. svc hrsync and svc webfront go to a delegated managed service account, matrix row six. Payroll Export and Deploy Bot go to a managed identity, row fourteen, and Mail Automation to a federated credential, row fifteen. HR Connector has no proposal, because nobody recorded where it runs. Step five reads the twelve findings. svc hrsync is high risk, but scheduled in wave 2, so that's N P I M A T oh seven. svc webfront is kept on Kerberos with no S P N owner, oh six. The delegated account dmsa hrsync has no end date before G 5, oh five. Wave 2 has no rollback owner, oh eight. And Vendor Portal is multitenant, so Conditional Access can't cover it, oh nine.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 4 and 5.`);
}

// ================================================================== 10 Try it: waves and scope
{
  const s = content(SL, "Try it: the waves' rollback and the D-N4 scope");
  tag(s, "How");
  const c = code(s, "Waves", 0.6, 1.45, 12.15, [
    "# Step 6: read the waves and their rollback",
    "Wave 1: Mail Automation; rollback owner 'carol@contoso.example'",
    "  AppRegistrationFederated: Re-enable the legacy account or credential; revert the application's configuration;",
    "    remove the federated credential",
    "Wave 2: svc-hrsync, msa-print01$, Payroll Export; rollback owner ''",
    "  dMSA: Undo-ADServiceAccountMigration (Learn's undo for a dMSA migration); the superseded account is kept,",
    "    never deleted",
    "  gMSA: Re-enable the legacy account; set the service back to it",
    "  ManagedIdentity: Re-enable the legacy account; revert the application's configuration to it",
    "# Step 7: read the Workload ID Premium scope",
    "6",
    "4",
    "{\"Tier1\":2,\"Wide\":4,\"None\":0}",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 10.5 });
  line(s, "Tests", "Six single-tenant apps can be covered today, four after conversion. Step 8: 513 tests passed, 0 failed.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 3, \"Exercise: Lab 1,\" steps 6 to 8; knowledge check answer 4; examples/non-person-identity/config/migration-matrix.json.");
  notes(s,
`Step six prints each wave with its rollback. Wave 1 is Mail Automation, with a rollback owner, and its rollback re-enables the legacy credential, reverts the configuration and removes the federated credential. Wave 2 holds svc hrsync, a managed service account and Payroll Export, and its rollback owner is empty. That's the N P I M A T oh eight finding. Notice the delegated managed account's rollback is the undo command from Microsoft Learn's delegated managed service account documentation, and the superseded account is kept, never deleted. Step seven reads the Workload I D Premium scope. Six single-tenant app registrations can be covered by Conditional Access today, and four after conversion. Payroll Export is one that leaves: its owner's decision moves it to a managed identity, and managed identities aren't covered. Step eight runs every test: five hundred thirteen pass. Then delete the output, which names accounts and owners.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 6 to 8; Knowledge check answer 4.`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: run the matrix on your own test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant, never production, with fictional people, and the Lab 2 runs of Modules 1 and 2"],
    ["Grant", "User.Read.All and LicenseAssignment.Read.All to Module 1's reading app. The run only reads"],
    ["Inputs", "Write the owners' inputs for the test accounts"],
    ["Run and check", "Run the matrix; record what the license read shows; check in the admin center which principals CA can target"],
    ["Back it out", "Step 6: remove the two permissions and delete out/matrix-test"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 03, Lab 2, which has the exact commands.");
  sources(s, "Sources: Module 3, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 runs the matrix against your own test tenant, worldwide or G C C, never production, with fictional people, and with the Lab 2 runs of Modules 1 and 2 already done. The run only reads. Grant User dot Read dot All and License Assignment dot Read dot All to Module 1's reading app. Write the owners' inputs for your test accounts: where each workload runs, and each owner's decision. Run the matrix. Record what the license read shows, and check in the admin center which principals Conditional Access can actually target, because that's the scope the D N 4 decision rests on. To back it out, step six removes the two permissions and deletes the output. The authors haven't run Lab 2. The workbook's Chapter 3 has the exact commands.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G2");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.8, 3.0, 5.35], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["AC-2; IA-5", "KSI-IAM-SNU", "proposals.json; config/migration-matrix.json; decisions.json"],
    ["AC-6(5) Privileged Accounts (HIGH first)", "KSI-IAM-SNU, KSI-IAM-JIT", "findings.json, NPI-MAT-01 to -09"],
    ["CM-3 (waves and rollback)", "KSI-CMT-RVP", "waves.json"],
    ["AC-3 Access Enforcement (D-N4 scope)", "KSI-IAM-ELP, KSI-IAM-JIT", "workload-id-premium.json"],
    ["CA-7 Continuous Monitoring (gate status)", "KSI-MLA-EVC", "gate2.json"],
  ], { fontSize: 12, limit: 5.0 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 3, \"Introduction\" (the federal requirement); the guide, Validate (G2 Decision).");
  notes(s,
`The federal requirement. Gate 2 meets NIST special publication eight hundred fifty-three A C two and I A five, and the module's table maps the evidence. For account and authenticator management, the proposals, the reviewed matrix file and the owners' decisions. For privileged accounts, with high-risk first, the findings. For configuration change control, the waves and their rollback. For access enforcement, the Workload I D Premium scope. And for continuous monitoring, the gate's own status file. K S I's are FedRAMP twenty X indicators for cloud service providers. The agency lines its evidence up with what its providers report; it doesn't report K S I's itself. Which file supports which indicator is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); the guide — Validate (G2 Decision).`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on the decision", [
    { q: "Who decides an identity's disposition?", options: ["a. The matrix", "b. The application owner, account by account (D-N3)", "c. The ISSO"] },
    { q: "A HIGH-risk account is scheduled for re-platforming in wave 2. What happens?", options: ["a. NPI-MAT-07 raises a Finding: HIGH-risk accounts go in wave 1", "b. Nothing, as long as wave 2 has a rollback", "c. The code moves it to wave 1"] },
  ], "1 b: the matrix proposes; the owner decides; the ISSO checks the gate. 2 a: the code reports it, and changes nothing.");
  sources(s, "Sources: Module 3, \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: who decides an identity's disposition? The answer is b: the application owner, account by account, under decision D N 3. The matrix only proposes, and the ISSO checks the gate. Second: a high-risk account is scheduled for re-platforming in wave 2. What happens? The answer is a. N P I M A T oh seven raises a finding, because high-risk accounts go in wave 1. The code reports it; it doesn't move the account itself. You saw exactly that finding for svc hrsync in step five. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary, and next: Module 4, the credential rules");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Proposed a target for 20 identities",
    "Checked the owners' dispositions",
    "Read two waves and their rollback, and scoped Workload ID Premium",
    "Saw why Gate 2 isn't met on the fixtures",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 4: Set the credential rules", [
    "The app management policy",
    "Certificate rotation",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "proposals, decisions, waves, the D-N4 scope, findings, gate2.json and the manifest that hashes them, dated.");
  sources(s, "Sources: Module 3, \"Summary\"; Module 4, \"Introduction.\"");
  notes(s,
`To sum up. You proposed a target for twenty identities, checked the owners' dispositions, read two waves and their rollback, and scoped Workload I D Premium. Gate 2 isn't met on the fixtures, and you can say why. The evidence an ISSO keeps for Gate 2 from this module is the proposals, the decisions, the waves, the license scope, the findings, the gate's status, and the manifest that hashes them and the inputs, all dated. Before you ship, work through the chapter's checklist. Next is Module 4: set the credential rules. The tenant can block new secrets and cap certificate lifetimes itself, and the rest is a rotation plan, from renewal to removal.`,
  `${M} — Unit "Summary"; Module 4 — "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/non-person-identity/03-decide-the-target.md (Non-Person Identity learning path, Module 3): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: what you need for the labs.",
  "What the module links for the design and rules: Non-Person Identity: An Implementation Guide, Step 2 (the condensed decision table, order of work, prerequisites for a gMSA, Validate G2); workbook Chapter 03, \"The decisions the code holds,\" \"The proposal (N2.1),\" \"The disposition (D-N3) and the waves (N2.2),\" \"Gate 2.\"",
  "Kit: examples/non-person-identity (Invoke-NpiMatrix.ps1; powershell/NpiMatrix; config/migration-matrix.json and calls-ch03.json; tests/fixtures/ch03). Fictional estate. Illustrative: tested against fixtures, not run against a live tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7 and Pester 5 in a scratch copy of examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it; long commands are wrapped and output trimmed where the slides say so. Verification: docs/training/non-person-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
