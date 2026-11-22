// Non-Person Identity learning path, Module 12: Migrate a service account — the module's narrated deck.
// Teaches docs/training/non-person-identity/12-service-account-migration.md, Learn-style: objectives, the concepts
// from the companion guide Service Accounts that the module's units send the learner to (the kinds of service
// identity, the decision path and the rules, Migrations A and B by hand, Migration C and what can't move), five
// "Try it" slides with the real Lab 1 commands and output (the module reruns workbook Chapter 06's and Chapter 05's
// Lab 1, so the output is the module page's and the kit's captures, data/kit-captures/npi/06-* and 05-*), Lab 2, the
// federal requirement and evidence, a two-question check, and the summary.
// The guide's own deck (presentations/guide-service-account-migration/) walks the guide; this deck teaches the module.
// Every fact comes from the module page, the companion guide and workbook Chapters 06 and 05 that the page sends the
// learner to, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-12/build.js \
//                      presentations/training-npi-module-12/Training_NPI_Module_12.pptx
const TITLE = "Module 12: Migrate a service account";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 12: Migrate a service account",
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
const OUT = process.argv[2] || "Training_NPI_Module_12.pptx";
const M = "Training, Non-Person Identity, Module 12";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 12: Migrate a service account", "Non-Person Identity learning path · A user account to a gMSA, a dMSA or Microsoft Entra",
    ["Kinds of service identity  ·  The decision path  ·  Migrations A, B and C", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 12 of the Non-Person Identity learning path: migrate a service account, from a user account to a G M S A, a D M S A or Microsoft Entra. It teaches the companion guide Service Accounts, with Chapters 6 and 5 of the developer workbook. The module takes about sixty-five minutes, with a lab on fixtures and a lab for a test domain.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why move one account by hand before you approve a plan");
  tag(s, "Why");
  const l = panel(s, "Before", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "THE PROBLEM", "The password nobody changes", [
    "Changing it breaks something",
    "Modules 7 and 8 taught the kit's plans for converting these accounts",
  ], 13.5);
  const r = panel(s, "Here", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THIS MODULE", "One account at a time, by hand", [
    "With Microsoft Learn's own commands",
    "So you know what the plans send before you approve one",
  ], 13.5);
  callout(s, "Moves", Math.max(l, r) + 0.3, 1.2, "FaRoute", HEX.navy, "Three moves, then the kit: ",
    "a user account to a gMSA; to a Windows Server 2025 dMSA; to a Microsoft Entra workload identity. Then the kit plans the same moves on fixtures.");
  sources(s, "Sources: Module 12, \"Introduction\"; Service Accounts guide, Migrations A, B and C.");
  notes(s,
`Why does this module exist? A service account's password is the one nobody changes, because changing it breaks something. Modules 7 and 8 taught the kit's plans for converting those accounts. This module takes one account at a time and walks it through each move by hand, with Microsoft Learn's own commands, so you know what the plans send before you approve one. There are three moves: a user account to a group managed service account, the same account to a Windows Server 2025 delegated managed service account, and an account to a Microsoft Entra workload identity, once the workload moves or gains a cloud path. Then you watch the kit plan the same moves on fixtures. The module adds no gate of its own: its moves are Gate G5's, and its rules are the track's.`,
  `${M} — Unit "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 12", [
    "Compare the kinds of service identity: who holds the credential, where it runs, its Kerberoasting exposure",
    "Choose a target with the decision path, and name its Chapter 03 disposition",
    "Follow Learn's steps to a gMSA and to a dMSA, with the checks before the switch and the rollback",
    "Say what moves to Microsoft Entra ID, what can't, and why a hybrid workload keeps both",
    "Match each step to the kit's plan action: run only by its approved hash, never a delete",
  ], [
    "Module 3: the dispositions",
    "Module 8, recommended",
    "PowerShell 7; a fictional domain and tenant",
  ], 65);
  sources(s, "Sources: Module 12, \"Learning objectives,\" \"Prerequisites.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll compare the kinds of service identity: who holds the credential, where it runs and how exposed it is to Kerberoasting. You'll choose a target with the guide's decision path, and name its Chapter 3 disposition. You'll follow Learn's steps to a G M S A and to a D M S A, with the checks before the switch and the rollback after it. You'll say what moves to Microsoft Entra I D, what can't, and why a hybrid workload keeps both. And you'll match each step to the kit's plan action, which runs only by its approved hash and never deletes. Take Module 3 first, for the dispositions. Module 8 is recommended: this module reruns part of its lab.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Kinds of service identity
{
  const s = content(SC, "Unit 1: who holds the credential, and who speaks Kerberos");
  tag(s, "What");
  const b = table(s, "Kinds", 1.45, [3.1, 4.6, 1.95, 2.5], ["Kind", "Who manages the credential", "Speaks", "Kerberoasting exposure"], [
    ["User account used as a service", "An administrator, by hand", "Kerberos, NTLM", "High when it holds an SPN"],
    ["Standalone MSA (sMSA)", "Windows: a 240-byte random password; one server", "Kerberos, NTLM", "Lower"],
    ["Group MSA (gMSA)", "Domain controllers compute it from the KDS root key; allowed hosts retrieve it", "Kerberos, NTLM", "Lower; not bound to a machine"],
    ["Delegated MSA (dMSA)", "A secret derived from the machine account, held only by the domain controller", "Kerberos", "Designed against it"],
    ["Managed identity", "Azure; you can't reach the credential", "OAuth", "None"],
    ["App registration, certificate", "You: a certificate from a trusted CA, kept in a vault", "OAuth", "None"],
    ["Federated credential", "The external issuer signs a token Entra ID trusts", "OAuth", "None"],
  ], { fontSize: 11.5, limit: 5.6 });
  line(s, "Kerb", "Nothing in Microsoft Entra ID speaks Kerberos for a service. A gMSA is a better password, not a different protocol.", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 12, Unit 1; Service Accounts guide, \"The kinds of service identity compared\"; Learn, dMSA overview, gMSA overview.");
  notes(s,
`Unit 1 starts with the guide's comparison table. Read it for two things: who manages each credential, and which kinds speak Kerberos. A user account used as a service has a password an administrator sets by hand, and it's highly exposed to Kerberoasting when it holds an S P N. An S M S A and a G M S A have a long random password that Windows manages; a G M S A's is computed by the domain controllers from the K D S root key, and any host allowed to retrieve it holds it. A D M S A binds the secret to the machine, and Microsoft Learn says it's designed against Kerberoasting. The Microsoft Entra kinds, a managed identity, an app registration with a certificate and a federated credential, speak OAuth, not Kerberos. So the table makes two things plain. Nothing in Microsoft Entra I D speaks Kerberos for a service. And a G M S A is a better password, not a different protocol.`,
  `${M} — Unit 1: Service Accounts guide, "The kinds of service identity compared."`);
}

// ================================================================== 5 Decision path and rules
{
  const s = content(SC, "Unit 1: the decision path, and the track's rules");
  tag(s, "Who");
  const b = table(s, "Path", 1.45, [0.5, 6.6, 3.55, 1.5], ["#", "Question: 1 to 8 in order, the first yes is the target", "Target", "Disposition"], [
    ["1", "Disabled, unused, or without an owner after inventory?", "Retire it", "Retire"],
    ["2", "Runs on an Azure resource, or moving to one?", "Managed identity, user-assigned", "Replatform"],
    ["3", "Runs in CI/CD or on a platform with its own OIDC issuer?", "A federated credential", "Replatform"],
    ["4", "Stays on premises but calls Graph or Azure APIs? If it also needs Kerberos, on to 5 to 8 too", "Arc identity, else a certificate", "Replatform"],
    ["5, 6", "Already a gMSA or dMSA; must stay traditional (no managed account, or unconstrained delegation)?", "Keep, with an end date", "Keep, KeepKerberos"],
    ["7", "Traditional, needs Kerberos; a 2025 domain controller and every host on 2025?", "A dMSA", "Replatform"],
    ["8", "Needs Kerberos, any other case, an sMSA included?", "A gMSA (an sMSA is replaced)", "Replatform"],
    ["9", "For a target from 5 to 8: Kerberos to a resource with no Entra equivalent?", "Also on the island list", "The same"],
  ], { fontSize: 11.5, limit: 5.55 });
  line(s, "Rules", "The rules: two owners and a sponsor; a reviewed disposition first; 30 days in parallel, then disable, never delete; no client secrets; no privileged groups; reviewed changes.", b + 0.15, 0.75, 13);
  sources(s, "Sources: Module 12, Unit 1; Service Accounts guide, \"The decision path,\" \"The program's rules for every migration.\"");
  notes(s,
`Next in Unit 1 is the decision path. Answer questions one to eight in order; the first yes is the target, and each target lines up with a Chapter 3 disposition. An account that's disabled, unused or without an owner is retired. A workload on Azure gets a managed identity; one in CI/CD gets a federated credential; one on premises that calls Graph gets the Arc identity or a certificate, and if it also needs Kerberos, it goes on to question five as well and takes two dispositions. Next come the exceptions. An account that's already a G M S A or D M S A is kept, and one that must stay a traditional account, because the service supports no managed account or relies on unconstrained delegation, is kept on Kerberos; each with an end date. Then a traditional account that needs Kerberos, with a Windows Server 2025 domain controller and every host on 2025, gets a D M S A. Any other case that needs Kerberos, a standalone account included, gets a G M S A. Question nine applies to every target from five to eight: Kerberos to a resource with no Entra equivalent also puts it on the island list. Then the track's rules, which a hand migration follows too: two named owners and a sponsor; a reviewed disposition first; a thirty-day parallel run, then disable, and never delete during the migration; no client secrets; no privileged groups; and changes that are reviewed.`,
  `${M} — Unit 1: Service Accounts guide, "The decision path," "The program's rules for every migration."`);
}

// ================================================================== 6 Migrations A and B
{
  const s = content(SC, "Unit 2: Migrations A and B, in the order Learn gives");
  tag(s, "How");
  const l = panel(s, "A", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "MIGRATION A  ·  A1 TO A7", "A user account to a gMSA", [
    "One KDS root key for the forest, then its 10-hour wait",
    "Create; install and test on every host",
    "Switch the workload and move the SPNs in one window",
    "30 days in parallel, then disable and move the old account",
  ], 13);
  const r = panel(s, "B", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "MIGRATION B", "A user account to a dMSA", [
    "Learn's limits first: every host on Windows Server 2025",
    "Create, start, wait at least two ticket lifetimes, complete",
    "The program's 30 days covers four",
    "Never delete the original account",
  ], 13);
  callout(s, "Special", Math.max(l, r) + 0.3, 1.2, "FaTriangleExclamation", HEX.amber, "Special cases: ",
    "skim the guide's table of cases Learn documents, and stop on failover clusters and Microsoft Entra Domain Services.");
  sources(s, "Sources: Module 12, Unit 2; Service Accounts guide, \"Migration A,\" \"Migration B,\" \"Special cases Learn documents.\"");
  notes(s,
`Unit 2 is Migrations A and B, by hand. In Migration A, a user account to a G M S A, watch for the order. There's one K D S root key for the forest, and the domain controllers wait up to ten hours from its creation before they allow a G M S A to be created. Then you create the G M S A, install it and test it on every host. Then you switch the workload and move the S P N's in one change window. After a clean thirty days in parallel, the old account is disabled and moved. Migration B, a user account to a D M S A, starts with Learn's limits: every machine that uses the account must support D M S A. Then you create, start, wait and complete. Learn says to wait at least two ticket lifetimes; the program's thirty days covers four. Learn's D M S A page says never to delete the original account. Then skim the guide's special cases, and stop on failover clusters and Microsoft Entra Domain Services.`,
  `${M} — Unit 2 "Migrations A and B, by hand": Service Accounts guide, "Migration A," "Migration B," "Special cases Learn documents."`);
}

// ================================================================== 7 Migration C
{
  const s = content(SC, "Unit 3: Migration C, and what can't move");
  tag(s, "What");
  const l = panel(s, "Order", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "LEARN'S ORDER OF PREFERENCE", "For an app's credential", [
    "A managed identity, whenever possible",
    "Federation, where the app doesn't run on Azure",
    "Otherwise a certificate from a trusted CA, in a vault",
    "Never a client secret",
  ], 13);
  const r = panel(s, "Targets", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE FOUR TARGETS", "C1 to C4, then C5 retires", [
    "C1 A user-assigned managed identity",
    "C2 An Arc-enabled server's identity",
    "C3 An app registration with a certificate",
    "C4 Workload identity federation",
  ], 13);
  callout(s, "Cant", Math.max(l, r) + 0.3, 1.2, "FaLock", HEX.red, "What can't move: ",
    "Kerberos or NTLM to a file share, a SQL Server login mapped to a Windows account, or a Kerberos-only app keeps its gMSA or dMSA.");
  sources(s, "Sources: Module 12, Unit 3; Service Accounts guide, \"Migration C,\" \"Dangers and how to avoid them\"; Learn, app credentials.");
  notes(s,
`Unit 3 is Migration C, from Active Directory to a Microsoft Entra workload identity. It starts when the workload moves to Azure, or gains a call to Graph or an Azure A P I, and only for what it reaches with OAuth. Learn's order of preference for an app's credential is a managed identity whenever possible; federation where the app doesn't run on Azure; otherwise a certificate from a trusted certificate authority, kept in a vault; and never a client secret. The guide has four targets, C1 to C4, and step C5 retires the on-premises account after the parallel run. And what can't move? Learn has no Entra identity a service can use for Kerberos or N T L M to an on-premises resource. A workload that reaches a file share, a SQL Server login mapped to a Windows account, or a Kerberos-only application that way keeps its G M S A or D M S A until that resource changes. That's why a hybrid workload keeps both.`,
  `${M} — Unit 3 "Migration C, and what can't move": Service Accounts guide, "Migration C," "Dangers and how to avoid them."`);
}
endModule(SC);

// ================================================================== 8 Try it: runs and Learn's samples
{
  const s = content(SL, "Try it: make the runs, then Learn's steps as tests");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/non-person-identity: Chapter 01's register, Chapter 02's owners, Chapter 03's dispositions",
    "$ ./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory | Out-Null",
    "$ ./Invoke-NpiOwnership.ps1 -Cloud gcc -RegisterRun out/inventory ... -OutputPath out/ownership | Out-Null",
    "$ ./Invoke-NpiMatrix.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership ... -OutputPath out/matrix | Out-Null",
    "# Step 2: see Learn's gMSA, dMSA and KDS steps run against the stand-ins",
    "$ (Invoke-Pester -Path tests/KerberosIslandSamples.Tests.ps1 -Output None -PassThru).Tests | ForEach-Object { \"$($_.Result)  $($_.Name)\" }",
    "Passed  creates a dMSA with New-ADServiceAccount -CreateDelegatedServiceAccount and AES256: the model for CreateDmsa",
    "Passed  sets msDS-DelegatedMSAState with -Properties, which Set-ADServiceAccount doesn't take: it fails as published",
    "Passed  restarts every running service on the host, not only the ones that run as the account",
    "...",
    "Passed  creates a gMSA with its retrievers at creation: the model for CreateGmsa",
    "Passed  sets no Kerberos encryption type on the gMSA",
    "Passed  leaves installing and uninstalling the gMSA to a person on each host",
    "Passed  ends its move to a gMSA by deleting the old service account identity",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS; 17 TESTS)`, pt: 10.5 });
  line(s, "Facts", "Seventeen tests, each a fact about one of Learn's published procedures. Step 1 prints nothing.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 12, \"Exercise: Lab 1,\" steps 1 and 2; Chapter 06, Lab 1; data/kit-captures/npi/06-1.txt, 06-2.txt.");
  notes(s,
`Try it. Lab 1 reruns parts of the workbook's Chapter 6 and Chapter 5 labs, in PowerShell 7, in the non-person identity folder. The domain and tenant are fictional, nothing signs in, and nothing is sent. Step one makes the runs Chapter 6 reads: Chapter 1's register, Chapter 2's owners and Chapter 3's dispositions. It prints nothing, and no account moves without its disposition. Step two runs Learn's G M S A, D M S A and K D S steps against stand-ins: seventeen tests, each a fact about one of Learn's published procedures. Match them to the guide. B1 skips Learn's delegated M S A state step, because it fails as published. B2 restarts only the service that uses the account, where Learn's step restarts every running service. A3 adds A E S two fifty-six, which Learn's G M S A sample leaves out. A4 is a person's step on each host. And A7 disables the old account, where Learn's Entra page deletes it.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2; workbook Chapter 06, Lab 1.`);
}

// ================================================================== 9 Try it: check and plan
{
  const s = content(SL, "Try it: check the Kerberos accounts and build the plan");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "# Step 3: check the Kerberos accounts and build the plan",
    "$ ./Invoke-NpiKerberosIsland.ps1 -Cloud gcc -RegisterRun out/inventory -MatrixRun out/matrix `",
    "      -ProgramDatesPath tests/fixtures/ch03/inputs/program-dates.json -FixturePath tests/fixtures/estate.json `",
    "      -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -InputPath tests/fixtures/ch06/inputs -OutputPath out/kerberos",
    "Kerberos accounts: 9 in scope; KDS root key Ready",
    "Findings: 6 Finding, 1 Warn, 2 Info",
    "Plan: 10 actions, 5 of them writes (1 CompleteDmsaMigration, 2 CreateGmsa, 2 SetRetrievers); nothing sent",
    "Run by: 1 person, 4 pipeline",
    "Island list: 6 accounts, 4 ready for P4.6; hand-off ready: False",
    "Reconciliation (D11 KerberosIsland): 1 HandedOff, 4 OnIslandList, 1 Unreconciled",
    "Plan SHA-256: 74c66192a61051b6cb2122b36e3fc0d3430c512f89c6feff123fd23b040b43b5",
  ], { label: `TRY IT  ·  ${CAP} (COMMAND WRAPPED)`, pt: 10.5 });
  line(s, "Kds", "KDS root key Ready is the guide's step A2: the check reads the key's start time, with a delegated read, and never creates a key.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 12, \"Exercise: Lab 1,\" step 3; Chapter 06, Lab 1; data/kit-captures/npi/06-4.txt.");
  notes(s,
`Step three checks the Kerberos accounts and builds the plan. Nine accounts are in scope. The plan has ten actions, five of them writes: one D M S A completion, two G M S A creations and two retriever changes. One write is a person's and four are the pipeline's, and nothing is sent. Note the plan's S H A two fifty-six on the last line: it's what someone approves. Look first at K D S root key Ready. That's the guide's step A2. The check reads the key's start time, with a delegated read, and it never creates a key. Learn's K D S page says the forest needs one root key, and the guide says to create only one.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 3; workbook Chapter 06, Lab 1.`);
}

// ================================================================== 10 Try it: the two migrations
{
  const s = content(SL, "Try it: read the two migrations the plan sends");
  tag(s, "How");
  const c = code(s, "Two", 0.6, 1.45, 12.15, [
    "# Step 4: read the two migrations the plan sends",
    "$ (Get-Content out/kerberos/kerberos-plan.json -Raw | ConvertFrom-Json).actions | Where-Object Account -in 'svc-intranet', 'svc-hrsync' |",
    "      Select-Object Action, Account, Cmdlet, Params | ConvertTo-Json -Depth 4",
    "[ { \"Action\": \"CompleteDmsaMigration\", \"Account\": \"svc-hrsync\", \"Cmdlet\": \"Complete-ADServiceAccountMigration\",",
    "    \"Params\": { \"Identity\": \"dmsa-hrsync$\",",
    "                \"SupersededAccount\": \"CN=svc-hrsync,OU=Service Accounts,DC=corp,DC=contoso,DC=example\" } },",
    "  { \"Action\": \"CreateGmsa\", \"Account\": \"svc-intranet\", \"Cmdlet\": \"New-ADServiceAccount\",",
    "    \"Params\": { \"Name\": \"gmsa-intranet\", \"DNSHostName\": \"gmsa-intranet.corp.contoso.example\",",
    "                \"Path\": \"OU=Service Accounts,DC=corp,DC=contoso,DC=example\",",
    "                \"PrincipalsAllowedToRetrieveManagedPassword\": [",
    "                  \"CN=DL-gMSA-intranet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example\" ],",
    "                \"KerberosEncryptionType\": \"AES256\", \"ManagedPasswordIntervalInDays\": 30 } } ]",
  ], { label: `TRY IT  ·  ${CAP} (JSON REFLOWED)`, pt: 10.5 });
  line(s, "A3B3", "CreateGmsa is step A3 under the standard: OU, one host group, AES256, 30 days. CompleteDmsaMigration is step B3, 40 days after it started.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 12, \"Exercise: Lab 1,\" step 4; Service Accounts guide, \"Migration A,\" \"Migration B,\" \"The managed service account standard.\"");
  notes(s,
`Step four reads the two migrations the plan sends. Create G M S A, for S V C dash intranet, is the guide's step A3 under the managed service account standard: a name, its D N S host name, the service-account O U, its one domain local group of hosts as the retrievers, A E S two fifty-six, and the thirty-day interval stated at creation. It isn't outbound-only, because it takes over S V C dash intranet's S P N's. Complete D M S A migration, for S V C dash H R sync, is step B3, with the D M S A and the superseded account's distinguished name. Its migration started forty days before, more than the program's thirty.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 4; Service Accounts guide, "The managed service account standard."`);
}

// ================================================================== 11 Try it: dry run
{
  const s = content(SL, "Try it: dry-run the plan with its approved hash");
  tag(s, "How");
  const c = code(s, "Dry", 0.6, 1.45, 12.15, [
    "# Step 5: dry-run the plan with its approved hash, as the pipeline",
    "$ $sha = (Get-FileHash out/kerberos/kerberos-plan.json -Algorithm SHA256).Hash.ToLower()",
    "$ ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 $sha -RunAs Pipeline `",
    "      -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath out/kerberos-dryrun",
    "DryRun as Pipeline: 1 Refused, 4 WouldSend",
    "  WouldSend  pipeline SetRetrievers         gmsa-ops$       Set-ADServiceAccount",
    "  WouldSend  pipeline SetRetrievers         gmsa-web$       Set-ADServiceAccount",
    "  WouldSend  pipeline CreateGmsa            msa-print01$    New-ADServiceAccount",
    "  Refused    person   CompleteDmsaMigration svc-hrsync      Complete-ADServiceAccountMigration",
    "  WouldSend  pipeline CreateGmsa            svc-intranet    New-ADServiceAccount",
  ], { label: `TRY IT  ·  ${CAP} (COMMAND WRAPPED)`, pt: 10.5 });
  line(s, "Hash", "Only a plan whose SHA-256 was approved runs. The dMSA's completion needs Domain Admins, so it's a person's (WD-163). No action deletes anything.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 12, \"Exercise: Lab 1,\" step 5; Chapter 06, Lab 1; decision WD-163; data/kit-captures/npi/06-8.txt.");
  notes(s,
`Step five dry-runs the plan with its approved hash, as the pipeline. This is the program's rule that changes are reviewed: the write path sends only a plan whose S H A two fifty-six was approved. The pipeline's G M S A would send the G M S A creations and the retriever changes. The D M S A's completion, step B3, needs Domain Admins, so it's a person's step, and the pipeline refuses it. M S A dash print oh one is an S M S A, so it goes to a G M S A, never to a D M S A. And no action deletes anything.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 5; workbook Chapter 06, Lab 1; decision WD-163.`);
}

// ================================================================== 12 Try it: Migration C
{
  const s = content(SL, "Try it: Migration C's conversions, then clean up");
  tag(s, "How");
  const c = code(s, "Conv", 0.6, 1.45, 12.15, [
    "# Step 6: build Chapter 05's conversion plan (Migration C)",
    "$ ./Invoke-NpiFederation.ps1 -Cloud gcc -ConversionsPath tests/fixtures/ch05/conversions.json ... -OutputPath out/federation",
    "Conversions: 8 in 2 wave(s); token exchange tests: 4 passed, 2 failed",
    "Plan: 20 actions, 4 of them writes (2 CreateCredential, 1 CreateIdentity, 1 DisableLegacy); nothing sent",
    "# Step 7: read what each conversion replaces, and its parallel run",
    "$ Get-Content out/federation/conversion-records.json -Raw | ConvertFrom-Json | ForEach-Object { ... } | Format-Table",
    "Id      Legacy                               Target              Run                  Day",
    "conv-01 svc-hrsync                           managedIdentity     ReadyToDisableLegacy  40",
    "conv-02 Payroll Export secret payroll-2026   federatedCredential AwaitingCutover",
    "...",
    "conv-06 svc-mailer                           certificate         AwaitingCutover",
    "conv-07 svc-batch                            managedIdentity     ParallelRunning       15",
    "conv-08 Legacy Reports secret reports-secret federatedCredential LegacyStillInUse      59",
    "$ Remove-Item -Recurse -Force out",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS)`, pt: 10.5 });
  line(s, "C", "Five AD accounts and three secrets, in Learn's order of preference. conv-06 takes a certificate where a managed identity is available: NPI-WIF-01.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 12, \"Exercise: Lab 1,\" steps 6 and 7; Chapter 05, Lab 1; data/kit-captures/npi/05-3.txt; decision WD-123.");
  notes(s,
`Step six builds Chapter 5's conversion plan: that's Migration C. Step seven reads what each conversion replaces, and its parallel run. There are five Active Directory accounts and three client secrets, each going to a managed identity, a federated credential or a certificate, and the plan holds each to Learn's order of preference. Conversion six gives an Azure Functions app a certificate where a managed identity is available, so Chapter 5 flags it. Conversion one has run forty days on its user-assigned managed identity, so its old account shows ready to disable. That row exercises the parallel run only: the program's target for S V C dash H R sync is a D M S A, the completion in step four, so don't take it through step C5. Conversion eight's old secret still signs in on day fifty-nine, so it stays. Then delete the out folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 6 and 7; workbook Chapter 05, Lab 1; decision WD-123.`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: the moves for real, in a test domain");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.6, 9.55], ["Way", "What you do"], [
    ["By hand, one account", "The guide's Migration A, steps A1 to A7, with Learn's commands and the expected output after each; back out with Rollback (A)"],
    ["You need", "A test domain with a KDS root key older than 10 hours, a test user account with an SPN, and a member server that runs a test service as it"],
    ["Through the kit", "Chapter 06's Lab 2: a traditional test account, a test MSA and the gMSA's domain local retriever group; apply as a person (-RunAs Person -TestDomain)"],
    ["dMSA; back out", "A dMSA migration to completion on a Windows Server 2025 domain; Chapter 06's Lab 2, step 6, backs it out"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Never", b + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "a test domain, never production.");
  sources(s, "Sources: Module 12, \"Exercise: Lab 2, your test domain\"; Service Accounts guide, \"Migration A\"; Chapter 06, \"Lab 2.\"");
  notes(s,
`Lab 2 does the moves for real, in a test domain, never production. The authors haven't run it. There are two ways. By hand, for one account: the guide's Migration A, steps A1 to A7, with Learn's commands and the expected output after each one. You need a test domain with a K D S root key older than ten hours, a test user account with an S P N, and a member server that runs a test service as it. Back out with the guide's rollback for Migration A. Or through the kit: the workbook's Chapter 6 Lab 2. It makes a traditional test account, a test M S A and the G M S A's domain local retriever group, applies the plan as a person in the test domain, and runs a D M S A migration to completion on a Windows Server 2025 domain. Its step six backs it out.`,
  `${M} — Unit "Exercise: Lab 2, your test domain"; workbook Chapter 06, "Lab 2: test domain."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence for each step");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [2.0, 3.7, 2.8, 3.65], ["Step", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["A3, B1 Create", "AC-6; IA-5 Authenticator Management; CM-3", "KSI-IAM-ELP; IAM-APM; CMT-LMC", "The approved plan, its SailPoint request and ServiceNow change; the apply manifest"],
    ["A4 Install and test", "AC-6 Least Privilege", "KSI-IAM-ELP", "Test-ADServiceAccount True per host; password-retrievers.json"],
    ["A6, B3 Parallel run", "AC-2(3) Disable Accounts; IA-5", "KSI-IAM-AAM; IAM-SNU", "HostChangedOn or MigrationStartedOn; the apply manifest"],
    ["C1 to C4 Cloud", "IA-9 (tailored in); IA-5; AC-6", "None for IA-9; IAM-SNU; IAM-ELP", "Chapter 05's plan and apply manifests; Graph grants and roles"],
    ["Island", "CM-8; AC-2 Account Management", "KSI-PIY-GIV; IAM-SNU", "Chapter 06's island-list.csv"],
  ], { fontSize: 11.5, limit: 5.6 });
  line(s, "Ass", "KSIs are FedRAMP 20x indicators for cloud providers; which file supports which is the program's mapping (design guidance).", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 12, \"Introduction\" (the federal requirement); NIST SP 800-53; FedRAMP 20x KSIs; Service Accounts guide, \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. The guide's evidence table has a row for every step, and these are the rows this module practices, in NIST SP 800-53. Creating the account supports A C six, Least Privilege, I A five, Authenticator Management, and C M three, Configuration Change Control, with the approved plan, its SailPoint request and ServiceNow change, and the apply manifest. Installing and testing supports A C six, with Test A D Service Account true on each host. The parallel run supports A C two, enhancement three, Disable Accounts. The cloud identities support I A nine, Service Identification and Authentication, tailored in. And the island supports C M eight, System Component Inventory, with Chapter 6's island list. K S I's are FedRAMP twenty X indicators for cloud service providers, and which file supports which is the program's mapping: design guidance.`,
  `${M} — Unit "Introduction" (the federal requirement); Service Accounts guide — "Federal requirements and evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on the migrations", [
    { q: "Kerberos, a Windows Server 2025 domain controller, but one of the two hosts is on Windows Server 2022. The target?", options: ["a. A dMSA", "b. A gMSA", "c. A user-assigned managed identity"] },
    { q: "Learn's Entra page ends a move to a gMSA by deleting the old account. What does the program do?", options: ["a. The same, right after the switch", "b. Disables it after a clean 30-day parallel run; deletes it only later, through the decommission process"] },
  ], "1 b: a dMSA needs every host that uses it on Windows Server 2025. 2 b: the program follows the stricter reading.");
  sources(s, "Sources: Module 12, \"Knowledge check,\" questions 1 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: a workload stays on premises and needs Kerberos. The domain has a Windows Server 2025 domain controller, but one of the two hosts that run the service is on Windows Server 2022. What's the target? The answer is b, a G M S A. A D M S A needs every host that uses it on Windows Server 2025. Second: Learn's Entra page ends a move to a G M S A by deleting the old account. What does the program do? The answer is b. It disables the account after a clean thirty-day parallel run, and deletes it only later, through the decommission process. The program follows the stricter reading. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 1 and 4; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary: one account, by hand, then by plan");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Compared the kinds of service identity, and chose targets",
    "Read Learn's steps to a gMSA, a dMSA and Microsoft Entra",
    "Saw the kit plan the same moves, each sent only by its approved hash",
    "Saw five AD accounts and three secrets converted in Learn's order",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Back to the learning path", [
    "Or Module 11: Deploy to test, then production",
    "Before you move an account: the guide's Checklist",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "The evidence: ",
    "kerberos-plan.json and plan.json with their approved SHA-256, the apply manifests, Test-ADServiceAccount per host, and island-list.csv for what stays.");
  sources(s, "Sources: Module 12, \"Summary\"; Service Accounts guide, \"Federal requirements and evidence,\" \"Checklist.\"");
  notes(s,
`To sum up. You compared the kinds of service identity, chose targets with the decision path, and read Learn's steps for a user account to a G M S A, a D M S A and a Microsoft Entra workload identity. Then you saw the kit plan the same moves: a G M S A with the standard's settings, a D M S A migration completed after its parallel run, five Active Directory accounts and three secrets converted in Learn's order of preference, and every plan sent only by its approved hash. The evidence an ISSO keeps for a migration is the guide's evidence table by step, with the kit's two plans and their approved hashes, the apply manifests, Test A D Service Account on each host, and the island list for what stays. Before you move an account, work through the guide's checklist. Next, go back to the learning path, or take Module 11, Deploy to test, then production, if you haven't.`,
  `${M} — Unit "Summary."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 12 deck", [
  "Module page: docs/training/non-person-identity/12-service-account-migration.md (Non-Person Identity learning path, Module 12): Introduction and its requirement table, objectives, prerequisites, Units 1 to 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: the companion guide Service Accounts (\"The kinds of service identity compared,\" \"The decision path,\" \"The program's rules,\" Migrations A, B and C, \"Special cases,\" \"Dangers,\" \"Federal requirements and evidence,\" \"Checklist\"), decisions WD-123 and WD-163, and its Microsoft Learn footnotes. NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 06, gMSAs, dMSAs and the Kerberos Island, and Chapter 05, Workload Identity Federation and Managed Identities: Lab 1 and Lab 2 (not run by the authors). Kit: examples/non-person-identity (Invoke-NpiKerberosIsland.ps1, Invoke-NpiKerberosIslandAction.ps1, Invoke-NpiFederation.ps1, tests/KerberosIslandSamples.Tests.ps1).",
  "Lab output: the module page's Lab 1 and the kit's captures, data/kit-captures/npi/06-1.txt, 06-2.txt, 06-4.txt, 06-8.txt and 05-3.txt (scripts/kit_captures.py), on fictional fixtures; trimmed, wrapped and reflowed where the slides say so.",
]);

finish(OUT);
