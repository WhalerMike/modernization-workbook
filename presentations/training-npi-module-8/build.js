// Non-Person Identity learning path, Module 8: Convert Kerberos accounts to gMSAs and dMSAs — the module's narrated deck.
// Teaches docs/training/non-person-identity/08-gmsa-dmsa-and-the-kerberos-island.md, Learn-style: objectives, the
// concepts, four "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of
// examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it), Lab 2, the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, the path's
// verification log, the guide's Steps 2, 3 and 5 and workbook Chapter 06 that the page sends the learner to, or the
// kit; the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-8/build.js \
//                      presentations/training-npi-module-8/Training_NPI_Module_8.pptx
const TITLE = "Module 8: Convert Kerberos accounts to gMSAs and dMSAs";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 8: Convert Kerberos accounts to gMSAs and dMSAs",
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
const OUT = process.argv[2] || "Training_NPI_Module_8.pptx";
const M = "Training, Non-Person Identity, Module 8";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 8: Convert Kerberos accounts to gMSAs and dMSAs", "Non-Person Identity learning path · Gate G5 Conversion, with workbook Chapter 06",
    ["Why an end date  ·  The gate's steps  ·  Four dispositions  ·  The check and the plan", "The island list  ·  The write path  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 8 of the Non-Person Identity learning path: convert Kerberos accounts to group and delegated managed service accounts. This module is the on-premises part of Gate 5, Conversion, with Chapter 6 of the developer workbook. You'll give every Kerberos account a reviewed disposition, plan its move to a G M S A or, on a Windows Server 2025 domain, a D M S A, list what stays on the Kerberos island with an S P N owner and an end date, and reconcile every managed account with the program's end state. Then you'll see the write path run a plan only by its approved hash. The domain is fictional, and the apply changes only a fake, in memory.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why converting a Kerberos account isn't the end");
  tag(s, "Why");
  const b = table(s, "Kinds", 1.45, [3.2, 8.95], ["Account", "What it gives the workload"], [
    ["Traditional, with an SPN", "A password that never expires: the riskiest of the workloads that can't leave Kerberos yet"],
    ["gMSA", "A password that Windows changes for it"],
    ["dMSA (Windows Server 2025)", "Supersedes the old account and disables its password"],
  ], { fontSize: 13.5, limit: 3.6 });
  callout(s, "Point", b + 0.35, 1.25, "FaServer", HEX.red, "But a gMSA works only while AD is authoritative: ",
    "so every gMSA and dMSA must move to a workload identity, retire, or sit on a dated Kerberos island list with an SPN owner and an end date.");
  sources(s, "Sources: Module 8, \"Introduction\"; Microsoft Learn, Secure group managed service accounts; Delegated Managed Service Accounts overview. Chapter 06, \"The context.\"");
  notes(s,
`Why does this matter? Some workloads can't leave Kerberos yet. A traditional service account with an S P N and a password that never expires is the riskiest of them. Microsoft Learn's guidance on securing group managed service accounts says a G M S A gives the same workload a password that Windows changes for it. And Learn's overview of delegated managed service accounts says a D M S A, on a Windows Server 2025 domain, supersedes the old account and disables its password. But a G M S A works only while Active Directory is authoritative, which is why the program's guidance gives every one an end date. So converting isn't the end. Every G M S A and D M S A must either move to a workload identity, retire, or sit on a dated Kerberos island list, with an S P N owner and an end date. In this module you plan all three, and you see the write path refuse a plan nobody approved.`,
  `${M} — Unit "Introduction"; workbook Chapter 06 — "The context the code depends on."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 8", [
    "Name the four dispositions a Kerberos account can have, and what each one needs",
    "Explain why a dMSA can't be used for an MSA or an account with unconstrained delegation",
    "Read the plan, the island list and the reconciliation for a fictional domain",
    "Show that the write path runs only a plan whose SHA-256 was approved, and never deletes",
  ], [
    "Module 1: the lab reads Chapter 01's register",
    "Module 3: the matrix sends Kerberos-only accounts to a gMSA or a dMSA",
    "Lab 1: PowerShell 7.1+ with Pester 5, and a clone; no tenant",
  ], 60);
  sources(s, "Sources: Module 8, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty minutes with the lab. You'll name the four dispositions a Kerberos account can have, and what each one needs. You'll explain why a D M S A can't be used for a managed service account, or for an account with unconstrained delegation. You'll read the plan, the island list and the reconciliation for a fictional domain. And you'll show that the write path runs only a plan whose hash was approved, and never deletes. Before you start, finish Module 1, because the lab reads Chapter 1's register, and Module 3, where the matrix sends Kerberos-only accounts to a G M S A or a D M S A. Lab 1 needs PowerShell 7.1 or later with Pester 5, and a clone. No tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 The gate
{
  const s = content(SC, "The gate: a parallel run, then disable, never delete");
  tag(s, "What");
  const b = table(s, "Gate", 1.45, [3.0, 9.15], ["The guide", "What it says"], [
    ["Step 5", "Build the target, give it two owners, run old and new in parallel for 30 days, then disable, never delete"],
    ["Step 2: gMSA prerequisites", "A KDS root key, once per domain; domain controllers wait up to 10 hours before they allow a gMSA"],
    ["Step 3, step 7: AD-side credentials", "A gMSA's password is changed by Windows every 30 days by default; the interval is set only at creation"],
    ["Rollback, Step 5", "Re-enable the legacy account and revert the application's configuration"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Dmsa", b + 0.3, 0.95, "FaUserClock", HEX.navy, "A dMSA waits longer: ",
    "the code completes a dMSA migration only 28 days after it started, the four ticket lifetimes Microsoft Learn recommends.");
  sources(s, "Sources: Module 8, Unit 1; the guide, Steps 2, 3 and 5; Microsoft Learn, Create a KDS root key; Secure group managed service accounts; Delegated Managed Service Accounts overview.");
  notes(s,
`Unit 1 is the guide's gate. Its Step 5 is the program's guidance: build the target, give it two human owners, run old and new in parallel for thirty days, then disable the legacy account. Never delete it. Step 2 adds the prerequisites for a G M S A. Microsoft Learn's page on creating a K D S root key says the key is created once per domain, and domain controllers wait up to ten hours after it's created before they allow a G M S A. Step 3's seventh step covers the Active Directory side of credentials: Learn's guidance on securing group managed service accounts says Windows changes the password every thirty days by default, and the interval can be set only when the account is created. The rollback for Step 5 is to re-enable the legacy account and revert the application's configuration. A delegated account waits longer: Learn's overview of delegated managed service accounts recommends four ticket lifetimes, twenty-eight days, so the code completes a migration only then.`,
  `${M} — Unit 1 "The gate and the end date"; the guide — Steps 2, 3 and 5, "Rollback"; workbook Chapter 06 — "What it leaves to you."`);
}

// ================================================================== 5 Dispositions and rules
{
  const s = content(SC, "Four dispositions, and the program's four rules");
  tag(s, "What");
  const b = table(s, "Disp", 1.45, [2.6, 9.55], ["Disposition", "What it needs"], [
    ["Convert", "A target, gMSA or dMSA, the new account's name, the workload and its hosts"],
    ["Island", "It stays on Kerberos, with an SPN owner and an end date no later than D08's"],
    ["WorkloadIdentity", "Chapter 05 moves it, with a reference"],
    ["Retire", "Through the plan's reviewed decommission process"],
  ], { fontSize: 13, limit: 3.7 });
  panel(s, "Rules", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "THE PROGRAM'S RULES  ·  DESIGN GUIDANCE", null, [
    "Every Kerberos account has a reviewed disposition, in kerberos-dispositions.csv",
    "Who may retrieve a managed password is reviewed data, in password-retrievers.json, not what AD holds today",
    "Every account that stays has an SPN owner and an end date; never delete: the old account is disabled at most",
  ], 12.5);
  sources(s, "Sources: Module 8, Unit 2; the program's design guidance, in workbook Chapter 06, \"The context the code depends on,\" \"The inputs.\"");
  notes(s,
`Unit 2 starts with the context the code depends on. Every Kerberos account gets one of four dispositions. Convert, to a G M S A or a D M S A, with the new account's name, the workload and its hosts. Island: it stays on Kerberos, with an S P N owner and an end date no later than decision D oh eight's. Workload identity: Chapter 5 moves it. Or retire, through the plan's reviewed decommission process. The program adds four rules of its own. They're the program's design guidance, not Microsoft's. Every Kerberos account has a reviewed disposition, kept in a file the application owners own. Who may retrieve a managed password is reviewed data, not whatever Active Directory holds today. Every account that stays has an S P N owner and an end date. And never delete: the old account is disabled at most.`,
  `${M} — Unit 2 "The plan and the island": workbook Chapter 06, "The context the code depends on," "The inputs."`);
}

// ================================================================== 6 The check
{
  const s = content(SC, "The check: NPI-KRB-01 to NPI-KRB-09");
  tag(s, "What");
  const b = table(s, "KRB", 1.45, [1.7, 1.75, 8.7], ["Rule", "Severity", "What it flags"], [
    ["NPI-KRB-01", "Finding / Warn", "No KDS root key, or one usable less than 10 hours ago"],
    ["NPI-KRB-02", "Finding", "A Kerberos account with no disposition, or an unknown one"],
    ["NPI-KRB-03", "Finding", "Retrievers in AD that differ from the reviewed list"],
    ["NPI-KRB-04", "Finding", "An unusable target: a dMSA from an MSA, or with unconstrained delegation, or no 2025 host or domain"],
    ["NPI-KRB-05, 06", "Finding", "An island account with no SPN owner; no end date, or one after D08's"],
    ["NPI-KRB-07", "Finding", "Not reconciled with the end state, D11"],
    ["NPI-KRB-08", "Warn", "A managed service account in a privileged group"],
    ["NPI-KRB-09", "Info", "A SQL Server account, handed to the Data Platform plan"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "Why", "Unconstrained delegation stops working once a dMSA migration completes, so NPI-KRB-04 blocks that dMSA.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 8, Unit 2; Microsoft Learn, Create a KDS root key; Delegated Managed Service Accounts overview and FAQ; Secure gMSAs. Chapter 06, \"The check and the plan.\"");
  notes(s,
`The check runs nine rules, N P I K R B oh one to oh nine. Oh one, oh four and oh eight come from Microsoft Learn's pages on the root key, delegated managed service accounts and securing group managed service accounts; the others are the program's design guidance. Oh one: there's no K D S root key, or one that became usable less than ten hours ago. Oh two: a Kerberos account has no disposition, or an unknown one. Oh three: the accounts allowed to retrieve a managed password in Active Directory differ from the reviewed list. Oh four is the one to remember: an unusable target. Learn's overview and F A Q for delegated managed service accounts say a D M S A can't come from a managed service account, can't serve an account with unconstrained delegation, which stops working once the migration completes, and needs Windows Server 2025 on the hosts and the domain. Oh five and oh six: an island account with no S P N owner, or no end date, or one after D oh eight's. Oh seven: an account not reconciled with the end state. Oh eight warns about a privileged group, and oh nine hands SQL Server accounts on.`,
  `${M} — Unit 2 "The plan and the island": workbook Chapter 06, "The check and the plan"; Knowledge check, answer 2.`);
}

// ================================================================== 7 The plan
{
  const s = content(SC, "The plan: one action per account, approved by hash");
  tag(s, "What");
  const b = table(s, "Plan", 1.45, [3.2, 7.55, 1.4], ["Action", "When", "Writes?"], [
    ["CreateGmsa", "Convert to a gMSA that doesn't exist; root key ready; retrievers reviewed", "Yes"],
    ["AwaitHostChange, AwaitParallelRun", "The server owner installs it and changes the identity; 30 days follow", "No"],
    ["DisableSuperseded", "30 days after the host change, the old account still enabled", "Yes"],
    ["CreateDmsa, StartDmsaMigration", "Convert to a dMSA that passes every limit; then start the migration", "Yes"],
    ["CompleteDmsaMigration", "28 days passed: disables the old account and moves its SPNs to the dMSA", "Yes"],
    ["SetRetrievers", "Retrievers differ from the reviewed list", "Yes"],
    ["Island, Blocked, HandedOff, ...", "Recorded, with the reason", "No"],
  ], { fontSize: 12, limit: 5.4 });
  line(s, "Hash", "kerberos-plan.json carries every input's SHA-256: the same inputs give the same bytes, so a reviewer approves one hash.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 8, Unit 2; Microsoft Learn, New-ADServiceAccount; Start- and Complete-ADServiceAccountMigration; dMSA overview. Chapter 06, \"The check and the plan.\"");
  notes(s,
`Each account becomes exactly one action in the plan. The G M S A path: create it, once the root key is ready and the retrievers are reviewed. Wait while the server owner installs it and changes the service's identity. Then a thirty-day parallel run, the program's guidance, and only then disable the old account. The D M S A path: create it, if it passes every limit, and start the migration. Twenty-eight days later, complete it. Microsoft Learn's overview of delegated managed service accounts says completing disables the old account and moves its S P N's to the D M S A. Set retrievers fixes a list that differs from the reviewed one. Anything else, like island, blocked or handed off, is recorded with its reason, and writes nothing. The plan carries every input's hash, and the same inputs always give the same bytes, so a reviewer approves one hash.`,
  `${M} — Unit 2 "The plan and the island": workbook Chapter 06, "The check and the plan."`);
}

// ================================================================== 8 Island list and write path
{
  const s = content(SC, "The island list, the reconciliation, the write path");
  tag(s, "What");
  const l = panel(s, "Island", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "WHAT CARRIES THE END DATE", "The island list and the reconciliation", [
    "island-list.csv: every account that stays on Kerberos, its SPN owner, end date, and whether it's ready for P4.6",
    "The hand-off is ready only when every row is",
    "reconciliation.json: every gMSA and dMSA, existing or planned, and where it ends up",
  ], 12.5);
  const r = panel(s, "Write", 6.85, 1.45, 5.9, null, HEX.red, HEX.redTint, "THE SEPARATE WRITE PATH", "It refuses to run unless", [
    "The plan's SHA-256 is the approved one",
    "It's for this domain, and no more than seven days old",
    "It's a person's session; nothing that removes, undoes or resets is ever run",
  ], 12.5);
  callout(s, "Read", Math.max(l, r) + 0.3, 0.95, "FaKey", HEX.teal, "The read holds no domain administration: ",
    "only a delegated read of the KDS root key's start and create times, plus a domain user's default read.");
  sources(s, "Sources: Module 8, Unit 2; the kit's design; Microsoft Learn, ms-Kds-Prov-RootKey class; ms-Kds-UseStartTime attribute. Chapter 06, \"The island list,\" \"The separate write path.\"");
  notes(s,
`These are the kit's design. Two outputs carry the chapter's end date. The island list holds every account that stays on Kerberos, with its S P N owner, its end date, and whether it's ready for P four point six, the program's S P N retirement work. The hand-off is ready only when every row is. The reconciliation covers every G M S A and D M S A, existing or planned, and says where it ends up. Writing to the domain lives in a separate script, and it refuses to run unless the plan's hash is the approved one, the plan is for this domain and no more than seven days old, and it's a person's session, never a job. Nothing that removes, undoes or resets is ever run. And the read holds no domain administration: Microsoft Learn's page for the root key class says its default security descriptor grants only Enterprise Admins, Domain Admins and SYSTEM, so the read gets a delegated read of the key's start and create times, nothing more.`,
  `${M} — Unit 2 "The plan and the island": workbook Chapter 06, "The island list and the reconciliation," "The separate write path."`);
}
endModule(SC);

// ================================================================== 9 Try it: register, samples, tasks
{
  const s = content(SL, "Try it: the register, Learn's steps, each task's calls");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 to 3, in examples/non-person-identity",
    "$ ./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory",
    "Register: 35 identities (AD 15, Entra 20); risk HIGH 8, LOW 19, MEDIUM 8",
    "Findings: 8 Finding, 11 Warn, 3 Info; 3 handed to the Data Platform plan",
    "Written to out/inventory (manifest.json: tenant c0ffee00-0000-4000-8000-000000000001, ...)",
    "$ Invoke-Pester -Path tests/KerberosIslandSamples.Tests.ps1 -Output None -PassThru | Select-Object PassedCount, ...",
    "PassedCount FailedCount NotRunCount",
    "         17           0           0",
    "$ Import-Module ./powershell/NpiKerberosIsland/NpiKerberosIsland.psm1",
    "$ foreach ($t in 'kerberos-island', 'kerberos-apply') { $r = Get-NpiKrbRequiredRight -Task $t; ... }",
    "kerberos-island : Get-ADComputer, Get-ADDomainController, Get-ADObject, Get-ADServiceAccount, Get-ADUser",
    "kerberos-apply : Complete-ADServiceAccountMigration, Disable-ADAccount, Get-ADComputer, Get-ADDomainController,",
    "  Get-ADObject, Get-ADServiceAccount, Get-ADUser, New-ADServiceAccount, Set-ADServiceAccount,",
    "  Start-ADServiceAccountMigration",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS; WRAPPED)", pt: 10.5 });
  line(s, "Read", "The read task runs only Get-AD* cmdlets. No cmdlet that removes or undoes is on either list.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 1 to 3; Microsoft Learn's gMSA, dMSA and KDS root key procedures, pinned; examples/non-person-identity.");
  notes(s,
`Try it. Lab 1 runs in the non-person identity folder of the examples, in PowerShell 7. Its step one makes Chapter 1's register, so the chapter's steps are one ahead here. The inventory prints its three lines, ending with where it wrote the register. Step two runs Microsoft Learn's published gMSA, dMSA and root key procedures against the stand-ins: seventeen pass, none fail. Step three lists what each task runs. The read task, kerberos island, runs only the directory Get cmdlets: computers, domain controllers, objects, service accounts and users. The write task, kerberos apply, adds the cmdlets that create and set a service account, start and complete a migration, and disable an account. Notice what's missing from both lists: no cmdlet that removes or undoes anything. The output on the slide is trimmed and wrapped to fit.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 3.`);
}

// ================================================================== 10 Try it: check and findings
{
  const s = content(SL, "Try it: check nine Kerberos accounts, read the findings");
  tag(s, "How");
  const c = code(s, "Check", 0.6, 1.45, 8.0, [
    "# Step 4 (command on the module page), output:",
    "Kerberos accounts: 9 in scope; KDS root key Ready",
    "Findings: 6 Finding, 1 Warn, 2 Info",
    "Plan: 9 actions, 4 of them writes (1 CompleteDmsaMigration,",
    "  2 CreateGmsa, 1 SetRetrievers); nothing sent",
    "Island list: 5 accounts, 3 ready for P4.6; hand-off ready: False",
    "Reconciliation (D11 KerberosIsland): 1 HandedOff,",
    "  1 MovesToWorkloadIdentity, 3 OnIslandList, 1 Unreconciled",
    "Plan SHA-256: 5e1f7c33491948026603746e933fafed...",
    "# Step 5: Format-Table Rule, Severity, ObjectKey",
    "NPI-KRB-03 Finding  gmsa-web$",
    "NPI-KRB-04 Finding  svc-webfront",
    "NPI-KRB-05 Finding  svc-intranet",
    "NPI-KRB-06 Finding  gmsa-web$",
    "NPI-KRB-06 Finding  svc-intranet",
    "NPI-KRB-07 Finding  gmsa-intranet$",
    "NPI-KRB-08 Warn     gmsa-ops$",
    "NPI-KRB-09 Info     gmsa-sql$  (and svc-sqlprod)",
  ], { label: "LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED; WRAPPED)", pt: 10.5 });
  panel(s, "Read", 8.85, 1.45, 3.9, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "svc-webfront's dMSA is blocked: unconstrained delegation",
    "svc-intranet: no SPN owner, an end date after D08's",
    "gmsa-ops$ is in Domain Admins",
    "The hash is the same on every run",
  ], 12.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 4 and 5; examples/non-person-identity/tests/fixtures/ch06 (fictional domain).");
  notes(s,
`Step four checks the Kerberos accounts and builds the plan. Nine accounts are in scope, and the root key is ready. There are six findings, one warning and two information items. The plan has nine actions, four of them writes: one completed migration, two new G M S A's, and one retriever change. Nothing is sent. The island list holds five accounts, three of them ready for P four point six, so the hand-off isn't ready. The reconciliation leaves one account unreconciled. And the plan's hash is the same on every run with these inputs. Step five reads the nine findings. N P I K R B oh four blocks svc webfront's D M S A, because the account is trusted for unconstrained delegation. Oh five and oh six flag svc intranet: no S P N owner, and an end date after D oh eight's. And oh eight warns that gmsa ops is in Domain Admins.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 4 and 5.`);
}

// ================================================================== 11 Try it: plan, island, reconciliation
{
  const s = content(SL, "Try it: the plan, the island list, the reconciliation");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "# Step 6: the plan's actions (Format-Table Action, Account, Write, Cmdlet), the writes",
    "SetRetrievers           gmsa-web$     True Set-ADServiceAccount",
    "CreateGmsa              msa-print01$  True New-ADServiceAccount",
    "CompleteDmsaMigration   svc-hrsync    True Complete-ADServiceAccountMigration",
    "CreateGmsa              svc-intranet  True New-ADServiceAccount",
    "Blocked                 svc-webfront False   (and four more recorded actions: ...)",
    "# Step 7: island-list.csv (Account, Type, SpnOwnerUpn, EndDate, ReadyForP46)",
    "dmsa-hrsync$   dMSA        hr-apps.owner@contoso.example 2027-06-30 True",
    "gmsa-intranet$ gMSA                                      2028-12-31 False",
    "gmsa-print$    gMSA        print.owner@contoso.example   2027-06-30 True",
    "gmsa-web$      gMSA        web.owner@contoso.example     2027-09-30 False",
    "svc-webfront   Traditional web.owner@contoso.example     2027-06-30 True",
    "# reconciliation.json: gmsa-intranet$  gMSA  Planned True  Island  Unreconciled  (and five more rows: ...)",
  ], { label: "LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Read", "svc-hrsync's migration started 40 days ago, so the plan completes it. gmsa-intranet$ has no SPN owner: not ready.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 6 and 7; examples/non-person-identity/tests/fixtures/ch06 (fictional domain).");
  notes(s,
`Step six reads the plan. Nine actions, and these are the four writes. Set retrievers for gmsa web. Create a G M S A for the managed service account msa print oh one, and for svc intranet. And complete the D M S A migration for svc h r sync, whose migration started forty days ago, past the twenty-eight-day wait. svc webfront is blocked. The other actions are recorded with their reasons and write nothing. Step seven reads the island list and the reconciliation. Five island rows, each under the name the account will end up with. gmsa intranet has no S P N owner and ends at the end of 2028, so it isn't ready for P four point six, and its reconciliation outcome is unreconciled. gmsa web isn't ready either, because its end date runs past D oh eight's.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 6 and 7.`);
}

// ================================================================== 12 Try it: dry run, apply, refusal
{
  const s = content(SL, "Try it: dry-run, apply to the fake, and a refusal");
  tag(s, "How");
  const c = code(s, "Apply", 0.6, 1.45, 12.15, [
    "# Step 8: dry-run with the approved hash",
    "$ $sha = (Get-FileHash out/kerberos/kerberos-plan.json -Algorithm SHA256).Hash.ToLower()",
    "$ ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 $sha ...",
    "DryRun: 4 WouldSend",
    "  WouldSend SetRetrievers         gmsa-web$       Set-ADServiceAccount   (and three more: ...)",
    "# Step 9: the same command with -Apply, then with -ApprovedSha256 ('0' * 64)",
    "Apply: 4 Sent",
    "  Sent      CompleteDmsaMigration svc-hrsync      Complete-ADServiceAccountMigration   (...)",
    "The plan's SHA-256 is 5e1f7c33491948026603746e933fafed0572fb77532ff1477ad452397c353746, not the approved",
    "  0000000000000000000000000000000000000000000000000000000000000000; refusing to run a plan nobody reviewed.",
  ], { label: "LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS; WRAPPED)", pt: 10.5 });
  line(s, "Tests", "Step 10: Invoke-Pester -Path tests prints 513 passed, 0 failed. Then Remove-Item -Recurse -Force out.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 8 to 10; examples/non-person-identity (Invoke-NpiKerberosIslandAction.ps1; tests).");
  notes(s,
`Step eight is the write path's dry run. You take the plan's hash, which in a real run a second person would review and pass to you, and give it to the action script. It reports four would-send lines, one for each write, and sends nothing. Step nine runs the same command with the apply switch, against the fake. Four writes are sent, including the completed migration for svc h r sync. Then you pass a hash of zeros, a hash nobody approved. The script refuses: the plan's hash isn't the approved one, and it won't run a plan nobody reviewed. Pasted line by line, your shell carries on after the refusal. Step ten runs every test: five hundred thirteen pass, none fail. Then delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 8 to 10; learning path verification log — "Found during the re-run."`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: a test domain, and a real migration");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A test AD domain, never production: a Windows Server 2025 DC and member server, a KDS root key, Chapter 01's Lab 2 run"],
    ["Make and grant", "A traditional test account and a test MSA; grant the read only msKds-UseStartTime and msKds-CreateTime"],
    ["Check and apply", "Run the check; apply the plan as a person with Domain Admins or equivalent rights"],
    ["Migrate", "Start the dMSA migration, and complete it after 28 days"],
    ["Back it out", "Step 6: Learn's Undo-ADServiceAccountMigration by hand; re-enable the account; remove the test objects by hand"],
  ], { fontSize: 12.5, limit: 5.2 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 06, Lab 2, which has the exact commands. The code never runs the undo.");
  sources(s, "Sources: Module 8, \"Exercise: Lab 2, your test domain\"; Microsoft Learn, Setting up delegated Managed Service Accounts; learning path index.");
  notes(s,
`Lab 2 moves to a test Active Directory domain, never production, with at least one Windows Server 2025 domain controller, a Windows Server 2025 member server, an existing K D S root key, and Chapter 1's Lab 2 run. Make a traditional test account and a test managed service account. Grant the read only the root key's two date attributes, nothing else. Run the check, then apply the plan as a person with Domain Admins or equivalent rights. Start the D M S A migration, and complete it after twenty-eight days. To back it out, step six runs the undo command from Microsoft Learn's page on setting up delegated managed service accounts, by hand, because the code never runs it, re-enables the test account, removes the test objects by hand, and deletes the output folders. The authors haven't run Lab 2. The workbook's Chapter 6 has the exact commands.`,
  `${M} — Unit "Exercise: Lab 2, your test domain"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G5");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.6, 3.2, 5.35], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["IA-5; CM-3", "KSI-IAM-SNU; KSI-CMT-LMC", "kerberos-plan.json, with the register's and each input's SHA-256"],
    ["AC-2; IA-5", "KSI-IAM-SNU", "findings.json, NPI-KRB-01 to -07 and -09"],
    ["AC-6; CM-5", "KSI-IAM-ELP, KSI-IAM-JIT; KSI-CMT-RVP", "Get-NpiKrbRequiredRight for both tasks; password-retrievers.json"],
    ["CM-8; AC-2", "KSI-PIY-GIV; KSI-IAM-SNU", "island-list.csv; reconciliation.json"],
    ["CM-3; AC-2(3) Disable Accounts", "KSI-CMT-LMC; KSI-IAM-AAM", "results.json and manifest.json in the apply folder"],
  ], { fontSize: 11.5, limit: 5.0 });
  line(s, "Guide", "The guide's Validate (G5) names IA-5, IA-9 and AU-2. KSIs are FedRAMP 20x indicators; the mapping is design guidance.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 8, \"Introduction\"; NIST SP 800-53 Rev. 5; FedRAMP, Key Security Indicators; the guide, Validate (G5 Conversion) and \"Evidence.\"");
  notes(s,
`The federal requirement. The Kerberos accounts are the on-premises part of Gate 5, and the guide's validate step names I A five, I A nine and A U two. These are NIST special publication eight hundred fifty-three controls. The module's table maps each lab step to its evidence. For authenticator management and change control, the plan, with the register's and each input's hash. For account management, the findings. For least privilege and access restrictions for change, the rights each task holds, and the reviewed list of password retrievers. For the inventory, the island list and the reconciliation. And for change control and disabling accounts, the results and manifest in the apply folder. K S I's are FedRAMP twenty X indicators for cloud service providers; the agency lines its evidence up with them, and which file supports which indicator is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); the guide — Validate (G5 Conversion), "Evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on the Kerberos island", [
    { q: "A Kerberos account stays on the island. What must it have?", options: ["a. A client secret in Key Vault", "b. An SPN owner and an end date no later than D08's", "c. Nothing, until G5"] },
    { q: "Why is svc-webfront's dMSA blocked?", options: ["a. It's a SQL Server account", "b. It's trusted for unconstrained delegation, which stops working once a dMSA migration completes", "c. Its domain has no KDS root key"] },
  ], "1 b: the program's rule for every account that stays on Kerberos. 2 b: NPI-KRB-04.");
  sources(s, "Sources: Module 8, \"Knowledge check,\" questions 1 and 2, \"Check your answers\"; Microsoft Learn, Delegated Managed Service Accounts overview and FAQ.");
  notes(s,
`Check yourself with two questions. First: a Kerberos account stays on the island. What must it have? The answer is b: an S P N owner and an end date no later than D oh eight's. That's the program's design guidance for every account that stays on Kerberos, and the check enforces it with N P I K R B oh five and oh six. Second: why is svc webfront's D M S A blocked? The answer is b. The account is trusted for unconstrained delegation, and Microsoft Learn's delegated managed service account documentation says that stops working once a D M S A migration completes. That's N P I K R B oh four, and it's why the plan records the account as blocked instead of planning a write. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 2; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary, and next: Module 9, AI agent identities");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Checked nine Kerberos accounts in a fictional domain",
    "Read a plan with four writes, an island list and a reconciliation",
    "Applied the plan to a fake by its hash",
    "Saw a plan nobody approved refused",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 9: Govern AI agent identities", [
    "Blueprints and sponsors",
    "D-N6 by cloud",
    "Report-only agent policies",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "the plan and its approved SHA-256, the findings, island list, reconciliation, the apply folder's results and manifest, dated; the tests.");
  sources(s, "Sources: Module 8, \"Summary\"; Module 9, \"Introduction.\"");
  notes(s,
`To sum up. You checked nine Kerberos accounts in a fictional domain, read a plan with four writes, an island list and a reconciliation, applied the plan to a fake by its hash, and saw a plan nobody approved refused. The evidence an ISSO keeps for Gate 5 from this module is the plan with its approved hash, the findings, the island list, the reconciliation, and the apply folder's results and manifest, all dated, and the test result. Before you ship, work through the chapter's checklist. Next is Module 9: govern AI agent identities. Agents follow every gate you've done so far, and add three things: an agent can act, a blueprint holds every agent's credentials, and creation has to be gated.`,
  `${M} — Unit "Summary"; Module 9 — "Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 8 deck", [
  "Module page: docs/training/non-person-identity/08-gmsa-dmsa-and-the-kerberos-island.md (Non-Person Identity learning path, Module 8): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: what you need for the labs.",
  "What the module links for the design and rules: Non-Person Identity: An Implementation Guide, Steps 2, 3 (step 7) and 5, Validate (G5 Conversion), \"Rollback\" and \"Evidence\"; workbook Chapter 06, \"The context the code depends on,\" \"The check and the plan,\" \"The island list and the reconciliation,\" \"The separate write path.\"",
  "Kit: examples/non-person-identity (Invoke-NpiKerberosIsland.ps1, Invoke-NpiKerberosIslandAction.ps1; powershell/NpiKerberosIsland; tests/fixtures/ch06). Fictional domain; -Apply changes only a fake. Illustrative: tested against fixtures, not run against a live domain.",
  "Lab output: run November 3, 2026 with PowerShell 7 and Pester 5 in a scratch copy of examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it; output trimmed and wrapped where the slides say so. Verification: docs/training/non-person-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
