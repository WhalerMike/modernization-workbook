// Non-Person Identity learning path, Module 1: Inventory every non-person identity — the module's narrated deck.
// Teaches docs/training/non-person-identity/01-inventory.md, Learn-style: objectives, the concepts, three "Try it"
// slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/non-person-identity,
// with examples/third_party and examples/drift-pipeline beside it), Lab 2, the federal requirement and evidence, a
// two-question check, and the summary. Every fact comes from the module page, the path's verification log, the
// guide's Step 1 and workbook Chapter 01 that the page sends the learner to, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-1/build.js \
//                      presentations/training-npi-module-1/Training_NPI_Module_1.pptx
const TITLE = "Module 1: Inventory every non-person identity";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 1: Inventory every non-person identity",
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
const OUT = process.argv[2] || "Training_NPI_Module_1.pptx";
const M = "Training, Non-Person Identity, Module 1";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 1: Inventory every non-person identity", "Non-Person Identity learning path · Gate G1 Inventory, with workbook Chapter 01",
    ["Why inventory first  ·  What Step 1 asks for  ·  The register  ·  The reader's rules", "Risk and the hand-off  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 1 of the Non-Person Identity learning path: inventory every non-person identity. A person leaves and HR tells you. A service account's owner leaves and nothing tells you. This path builds that missing record, through the six gates of the non-person identity implementation guide, with one module for each chapter of the developer workbook. This module is Gate 1, Inventory, with Chapter 1 of the workbook. You'll read every service account, managed service account, app registration, service principal and managed identity into one register, with its type, owners, credentials, risk and candidate target. You decide nothing yet. The code runs on your laptop, against a fictional estate. It's illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the inventory is always larger than you think");
  tag(s, "Why");
  const l = panel(s, "Entra", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "IN MICROSOFT ENTRA", "More than anyone asked for", [
    "Consent creates service principals",
    "Microsoft's own services create more",
    "So the inventory is always larger than the list of apps anyone asked for",
  ], 13.5);
  const r = panel(s, "AD", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "IN ACTIVE DIRECTORY", "No attribute says \"service account\"", [
    "Learn finds candidates by an SPN, trust for delegation and a password that never expires",
    "And warns that this might not find them all",
  ], 13.5);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaListCheck", HEX.red, "This module: ",
    "read every non-person identity into one register, with its type, owners, credentials, risk and candidate target. Inventory first; decide later.");
  sources(s, "Sources: Module 1, \"Introduction\"; Learn, Secure user-based service accounts in Active Directory; the guide, Step 1.");
  notes(s,
`Why start with an inventory? Because the list is always longer than you think. In Entra, consent creates service principals, and Microsoft's own services create more, so the inventory is always larger than the list of apps anyone asked for. And in Active Directory, no attribute marks a user as a service account. Microsoft Learn's guidance on securing user-based service accounts finds candidates by three signs: a service principal name, trust for delegation, and a password that never expires. And it warns that this might not find them all. So in this module you read every non-person identity into one register, with its type, its owners, its credentials, its risk and a candidate target. You don't decide anything yet. Inventory first; decide later.`,
  `${M} — Unit "Introduction"; the guide — Step 1.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Name the identity types the register holds, and where each is read from",
    "Explain the program's HIGH, MEDIUM and LOW risk rule, and why a stale account is only a lead",
    "Run the inventory against the fixtures and read its HIGH-risk findings",
    "Show that the reader refuses a call the task doesn't declare and a cloud it doesn't know",
  ], [
    "The guide's track at a glance: the system inventory or CMDB, not HR, is the source of truth",
    "Microsoft Automation, Module 1: permissions",
    "Lab 1: PowerShell 7.1+ with Pester 5, and a clone; no tenant",
  ], 55);
  sources(s, "Sources: Module 1, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll name the identity types the register holds, and where each one is read from. You'll explain the program's high, medium and low risk rule, and why a stale account is only ever a lead. You'll run the inventory against the fixtures and read its high-risk findings. And you'll show that the reader refuses a call the task doesn't declare, and a cloud it doesn't know. Before you start, read the guide's track at a glance: for this track, the system inventory or C M D B is the source of truth, not HR. And review Microsoft Automation Module 1 on permissions. Lab 1 needs PowerShell 7.1 or later with Pester 5, and a clone of the repository. No tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 What the gate asks for
{
  const s = content(SC, "What Gate 1 asks for: six sub-steps, one record");
  tag(s, "What");
  const b = table(s, "Steps", 1.45, [1.0, 4.4, 6.75], ["Step", "Inventory", "What to record"], [
    ["1a", "AD service accounts, MSAs, gMSAs and dMSAs", "Stale is a lead, not a verdict; which hosts can retrieve each gMSA's password"],
    ["1b", "App registrations and service principals", "servicePrincipalType: Application, ManagedIdentity, Legacy or ServiceIdentity"],
    ["1c", "Managed identities", "Their role assignments; user-assigned ones outlive their resources, so they orphan"],
    ["1d", "Workload identity federation", "Each federated credential's issuer, subject and audience"],
    ["1e", "AI agent identities", "Blueprints, agent identities and their sponsors, where the tenant exposes Agent ID"],
    ["1f", "Join to the record", "The system ID, two human owners and a sponsor who is a federal employee"],
  ], { fontSize: 12.5, limit: 5.2 });
  line(s, "VK", "Gate 1 is proved by the validation kit's VK-NPI-01, 06, 07 and 08: read-only checks that change nothing.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 1, Unit 1; the guide, Step 1 (1a to 1f), \"The record each identity joins to,\" \"How to read this guide.\"");
  notes(s,
`Unit 1 is the guide's Step 1, which has six sub-steps. One a: Active Directory service accounts, managed service accounts, and the group and delegated kinds. Stale is a lead, not a verdict, and for a group managed account you record which hosts can retrieve its password, because that's its real blast radius. One b: app registrations and service principals, with each one's service principal type. One c: managed identities and their role assignments; a user-assigned identity outlives the resources it's attached to, so it's the type that orphans. One d: every federated credential's issuer, subject and audience. One e: AI agent identities and their sponsors, where the tenant exposes them. And one f joins each identity to its record in the system inventory, with two human owners and a sponsor. The validation kit's read-only checks one, six, seven and eight prove the gate.`,
  `${M} — Unit 1 "What the gate asks for"; the guide — Step 1, "The record each identity joins to," "How to read this guide."`);
}

// ================================================================== 5 The register's reads
{
  const s = content(SC, "The register: two AD reads, nine Graph, one ARM");
  tag(s, "What");
  const b = table(s, "Reads", 1.45, [3.5, 8.65], ["What", "Where it's read"], [
    ["User accounts used as services", "Get-ADUser -LDAPFilter: Learn's three criteria and the naming convention, in one query"],
    ["MSAs, gMSAs and dMSAs", "Get-ADServiceAccount, with who may retrieve each password"],
    ["App registrations, owners, federated credentials", "Graph: applications, their owners and federatedIdentityCredentials"],
    ["Service principals by type", "Graph: servicePrincipals, and the owners of legacy ones"],
    ["Graph application permissions", "Graph's own service principal for its app roles, then appRoleAssignedTo"],
    ["Delegated consent grants", "Graph: oauth2PermissionGrants; tenant-wide consent shows as AllPrincipals"],
    ["A user-assigned identity's federated credentials", "Azure Resource Manager: they live there, not in Graph"],
  ], { fontSize: 12, limit: 5.6 });
  line(s, "Row", "Every identity gets one row with the same columns, whatever its type, so the register writes to one CSV.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 1, Unit 2; Learn, Get-ADUser, Get-ADServiceAccount, Graph list APIs, FIC List (ARM); Chapter 01, \"What the register has to hold.\"");
  notes(s,
`Unit 2 is the register as code. It reads two collections from Active Directory, nine from Microsoft Graph, and one from Azure Resource Manager. From the directory: the user accounts used as services, found with Learn's three criteria and the naming convention in one server-side query; and the managed service accounts of every kind, with who may retrieve each password. From Graph: app registrations with their owners and federated credentials; service principals by type; Graph's own app roles, so a permission shows up by name; and the delegated consent grants, where tenant-wide consent shows as all principals. And one read people forget: a user-assigned identity's federated credentials live in Resource Manager, not in Graph. Every identity gets one row with the same columns, whatever its type, so the whole register lands in one file.`,
  `${M} — Unit 2 "The register as code"; workbook Chapter 01 — "What the register has to hold," "The register."`);
}

// ================================================================== 6 The reader
{
  const s = content(SC, "The reader: five rules every call obeys");
  tag(s, "What");
  const b = table(s, "Rules", 1.45, [2.4, 9.75], ["Rule", "What it enforces"], [
    ["Only declared calls", "config/calls.json lists each call and its permission; an undeclared call throws before anything is sent"],
    ["Reads only", "GET, and only declared Get-AD* cmdlets; a task declared as a write can't have a reader"],
    ["One host", "Every URL, every next link, on the cloud's own Graph or Resource Manager host, or the token isn't sent"],
    ["One tenant", "The live invoker refuses a session in another cloud or another tenant than -TenantId"],
    ["Every page", "Collections are followed to the end; the fake serves pages of two, so tests exercise paging"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "DRA", b + 0.3, 0.95, "FaKey", HEX.navy, "Why Directory.Read.All: ",
    "Learn's least-privileged permission for listing delegated grants. It's the broadest read the inventory holds, and the only reason it holds it.");
  sources(s, "Sources: Module 1, Unit 2; Learn, List oauth2PermissionGrants; Paging with the Graph SDKs; Chapter 01, \"The reader\"; the kit (NpiCore, calls.json).");
  notes(s,
`Every call goes through one reader, built for one task in one cloud, and it enforces five rules. Only declared calls: the configuration file lists each call with its permission, and a call the task doesn't declare throws before anything is sent. Reads only: it sends GET, and runs only the directory Get cmdlets the call list names. One host: every URL, including every next link, must be on the cloud's own Graph or Resource Manager host, or the token isn't sent. One tenant: a live run refuses a session in another cloud or another tenant. And every page: collections are read to the end. One permission deserves a note. The inventory holds Directory dot Read dot All only because Microsoft Learn's page for listing delegated permission grants names it as the least-privileged permission. It's the broadest read the inventory holds, and that's the only reason.`,
  `${M} — Unit 2 "The register as code": workbook Chapter 01, "The reader"; examples/non-person-identity/powershell/NpiCore, config/calls.json.`);
}

// ================================================================== 7 Risk, targets, stale, hand-off
{
  const s = content(SC, "Risk, the candidate target, stale leads, the hand-off");
  tag(s, "What");
  const l = panel(s, "Risk", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE PROGRAM'S RULE  ·  DESIGN GUIDANCE", "Risk and candidate target", [
    "HIGH: a password that never expires or unchanged over 365 days, a privileged AD group, unconstrained delegation, or a high-privilege Graph permission",
    "MEDIUM: other enabled traditional accounts, MSAs, gMSAs, legacy service principals, any client secret; LOW otherwise",
    "The target is a candidate only: Module 3 decides",
  ], 12.5);
  const r = panel(s, "Stale", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "LEADS, NOT VERDICTS", "Stale leads and the hand-off", [
    "Stale: an enabled AD account with no logon in 90 days",
    "Confirm against domain controller and Entra sign-in logs; the code never disables, moves or deletes",
    "An MSSQLSvc/ SPN, or a SQL Server or LDAP-bind name, goes to the Data Platform plan",
  ], 12.5);
  sources(s, "Sources: Module 1, Unit 2; Learn, Last-Logon-Timestamp attribute; Chapter 01, \"Risk, targets, stale leads and the hand-off\" (design guidance).");
  notes(s,
`Risk, the candidate target and the stale lead come from the program, not from Microsoft, so they're design guidance. An enabled identity is high risk for a password that never expires or hasn't changed in more than three hundred sixty-five days, membership of a privileged Active Directory group, unconstrained delegation, or a high-privilege Graph permission. Other enabled traditional accounts, managed service accounts, legacy service principals and anything holding a client secret are medium. Everything else is low. The target is only a candidate; Module 3 makes the decision. A stale lead is an enabled directory account with no logon in ninety days, and it's only a lead, because Microsoft Learn documents that the last logon timestamp isn't updated at every sign-in. Confirm it against the domain controller and Entra sign-in logs. The code never disables, moves or deletes anything. And SQL Server and LDAP-bind accounts are handed to the Data Platform plan.`,
  `${M} — Unit 2 "The register as code": workbook Chapter 01, "Risk, targets, stale leads and the hand-off."`);
}

// ================================================================== 8 The findings
{
  const s = content(SC, "The findings: NPI-INV-01 to NPI-INV-09");
  tag(s, "What");
  const b = table(s, "Find", 1.45, [1.7, 1.2, 9.25], ["Rule", "Severity", "What it flags"], [
    ["NPI-INV-01", "Finding", "A HIGH-risk identity, with its reasons and candidate target"],
    ["NPI-INV-02", "Warn", "A stale lead: an enabled AD account with no logon in 90 days, to confirm"],
    ["NPI-INV-03", "Warn", "An app registration or legacy service principal with fewer than two owners"],
    ["NPI-INV-04, 05", "Warn", "A client secret; an expired credential still on the object"],
    ["NPI-INV-06", "Warn", "A delegated grant consented for all users (AllPrincipals)"],
    ["NPI-INV-07", "Info", "A SQL Server or LDAP-bind account handed to the Data Platform plan"],
    ["NPI-INV-08", "Warn", "Found only by a password that never expires: may be a person"],
    ["NPI-INV-09", "Warn", "An object class or service principal type the register doesn't classify"],
  ], { fontSize: 12.5, limit: 5.6 });
  line(s, "ID", "Each finding has a stable ID, <rule>:<identity>, so the same gap keeps its name from run to run.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 1, Unit 2; workbook Chapter 01, \"The findings.\"");
  notes(s,
`The register becomes findings, under nine rules, N P I I N V oh one to oh nine. Only the first is a hard finding: a high-risk identity, with its reasons and candidate target. The rest are warnings to act on, or information. Oh two is a stale lead to confirm. Oh three is an app registration or legacy service principal with fewer than two owners. Oh four is a client secret, and oh five an expired credential still on the object. Oh six is a delegated grant consented for all users. Oh seven, information only, is an account handed to the Data Platform plan. Oh eight is an account found only by a password that never expires, which may be a person. And oh nine is a type the register doesn't classify. Every finding has a stable I D, so the same gap keeps its name from run to run.`,
  `${M} — Unit 2 "The register as code": workbook Chapter 01, "The findings."`);
}
endModule(SC);

// ================================================================== 9 Try it: samples and permissions
{
  const s = content(SL, "Try it: Learn's samples, and what the inventory needs");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 8.0, [
    "# Lab 1, steps 1 and 2, in examples/non-person-identity",
    "$ Invoke-Pester -Path tests/MicrosoftSamples.Tests.ps1 \\",
    "    -FullNameFilter '*Chapter 01*' -Output None -PassThru |",
    "    Select-Object PassedCount, FailedCount, NotRunCount",
    "PassedCount FailedCount NotRunCount",
    "         20           0          10",
    "",
    "$ Import-Module ./powershell/NpiInventory/NpiInventory.psm1",
    "$ $p = Get-NpiRequiredPermission -Task inventory",
    "$ $p.GraphPermissions -join ', '; $p.AzureRoles -join ', ';",
    "    $p.AdRights -join ', '",
    "Application.Read.All, Directory.Read.All",
    "Reader",
    "Read (default for authenticated domain users)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 11 });
  panel(s, "Read", 8.85, 1.45, 3.9, null, HEX.teal, HEX.tealTint, "READ IT", null, [
    "Learn's commands run as published, against stand-ins: 20 pass",
    "The 10 not run are Chapter 02's",
    "Two Graph reads, Reader, and a domain user's read",
    "Nothing ends in ReadWrite",
  ], 13);
  line(s, "Note", "Long commands are wrapped with a trailing backslash; type them as the module page writes them.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 1 and 2; examples/non-person-identity: tests/MicrosoftSamples.Tests.ps1, config/calls.json.");
  notes(s,
`Try it. Lab 1 runs in the non-person identity folder of the examples, in PowerShell 7, against a fictional estate. Nothing signs in to anything or sends a request. Step one runs Learn's own samples, exactly as published, against stand-ins. Twenty pass, none fail, and ten aren't run, because those ten are Chapter 2's. Step two lists what the inventory needs. Two Graph permissions: Application dot Read dot All and Directory dot Read dot All. The Reader role in Azure. And in Active Directory, only the default read every authenticated domain user has. Notice that nothing ends in ReadWrite. The inventory can't change anything, and that's what you'd show an assessor who asks what the reading process may do.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 and 2.`);
}

// ================================================================== 10 Try it: run and read HIGH
{
  const s = content(SL, "Try it: run the inventory, read the HIGH-risk rows");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Step 3: run the inventory against the fictional estate",
    "$ ./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory",
    "Register: 35 identities (AD 15, Entra 20); risk HIGH 8, LOW 19, MEDIUM 8",
    "Findings: 8 Finding, 11 Warn, 3 Info; 3 handed to the Data Platform plan",
    "Written to out/inventory (manifest.json: tenant c0ffee00-0000-4000-8000-000000000001, every request,",
    "  a SHA-256 per file)",
    "# Step 4: the NPI-INV-01 rows (Format-Table Object, Issue -Wrap)",
    "svc-hrsync (Traditional)          HIGH risk: password never expires; password not changed in 2800 days. ...",
    "svc-sqlprod (Traditional)         HIGH risk: password never expires; password not changed in 1968 days. ...",
    "svc-backup (Traditional)          HIGH risk: member of Backup Operators. ...",
    "svc-oldftp (Traditional)          HIGH risk: ... Candidate: Verify use first (stale lead); retirement ...",
    "jdoe (Traditional)                HIGH risk: password never expires. ...",
    "svc-webfront (Traditional)        HIGH risk: trusted for unconstrained delegation. ...",
    "gmsa-ops$ (gMSA)                  HIGH risk: member of Domain Admins. ...",
    "Mail Automation (AppRegistration) HIGH risk: holds Directory.ReadWrite.All. ...",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Jdoe", "jdoe was found only by a password that never expires (NPI-INV-08), so it may be a person.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 3 and 4; workbook Chapter 01, Lab 1; examples/non-person-identity/tests/fixtures/estate.json (fictional).");
  notes(s,
`Step three runs the inventory against the fictional estate. It reads thirty-five identities, fifteen from Active Directory and twenty from Entra, and rates eight high, eight medium and nineteen low. That's eight findings, eleven warnings and three information items, and three accounts handed to the Data Platform plan. The manifest records the tenant, every request, and a hash of every file. Step four reads the eight high-risk identities. Three accounts have passwords that never expire, and one of them, svc oldftp, is also a stale lead, so verify its use first. j doe was found only by a password that never expires, so it may be a person, not a service account. Others sit in Backup Operators or Domain Admins, or are trusted for unconstrained delegation. And the Mail Automation app holds a directory-wide write permission.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 3 and 4; workbook Chapter 01 — "Lab 1: fixtures, no tenant."`);
}

// ================================================================== 11 Try it: refuse and hand off
{
  const s = content(SL, "Try it: the reader refuses, and the hand-off");
  tag(s, "How");
  const c = code(s, "Refuse", 0.6, 1.45, 12.15, [
    "# Step 5: see the reader refuse",
    "$ $r = New-NpiReader -Cloud gcc -Task inventory -Invoke (New-NpiFixtureInvoker -Path tests/fixtures/estate.json).Invoke",
    "$ Invoke-NpiList -Reader $r -CallId graph-user -Bind @{ id = 'x' }",
    "Undeclared call 'graph-user' for task 'inventory'; add it to config/calls.json with its permission.",
    "$ Get-NpiCloud GCC",
    "Unknown cloud 'GCC'. Use global, gcc, gcchigh or dod.",
    "# Step 6: read the hand-off to the Data Platform plan",
    "$ Import-Csv out/inventory/data-platform-handoff.csv | Format-Table Name, Type, Spns, Risk",
    "Name         Type        Spns                                     Risk",
    "----         ----        ----                                     ----",
    "svc-sqlprod  Traditional MSSQLSvc/sql01.corp.contoso.example:1433 HIGH",
    "svc-ldapbind Traditional                                          MEDIUM",
    "gmsa-sql$    gMSA        MSSQLSvc/sql02.corp.contoso.example:1433 MEDIUM",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (ERRORS SHOWN AS THEIR MESSAGES)", pt: 10.5 });
  line(s, "Tests", "Step 7: Invoke-Pester -Path tests prints 513 passed, 0 failed. Then Remove-Item -Recurse -Force out.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 1,\" steps 5 to 7; examples/non-person-identity (NpiCore; tests).");
  notes(s,
`Step five shows the reader's rules at work. You build a reader for the inventory task, with the fixture invoker standing in for the network, and ask it for a call the task doesn't declare. It refuses before anything is sent, and tells you to add the call to the call list with its permission. Then you ask for the cloud G C C in capitals, and it refuses that too: the cloud names are global, gcc, gcchigh and dod, and it never guesses. Step six reads the hand-off to the Data Platform plan. Two accounts go by their SQL Server service principal names, svc sqlprod and the group managed account gmsa sql, and one, svc ldapbind, goes by its name. Step seven runs every test: five hundred thirteen pass, none fail. Then delete the output folder.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 5 to 7.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: inventory your own test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant with a test Azure subscription, and a test AD domain, never production, with fictional people"],
    ["Register a reader", "An app registration with a certificate"],
    ["Grant", "Application.Read.All, Directory.Read.All, and Reader on one resource group"],
    ["Run and compare", "Run the inventory live, and compare the register with the admin center's lists"],
    ["Back it out", "Step 8: remove the Reader assignment and the two permissions; delete the app and its certificate, and out/inventory-test"],
  ], { fontSize: 12.5, limit: 5.2 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 01, Lab 2, which has the exact commands.");
  sources(s, "Sources: Module 1, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 runs the same inventory against your own test tenant. You need a test tenant in the worldwide or G C C cloud, with a test Azure subscription, and a test Active Directory domain. Never production, and only fictional people. Register a reading app with a certificate, not a secret. Grant it Application dot Read dot All and Directory dot Read dot All, and Reader on one resource group. Then run the inventory live, and compare the register with the lists in the admin center. That comparison is what tells you whether a real tenant returns the shapes the fixtures assumed. To back it out, step eight removes the Reader assignment and the two permissions, deletes the app registration and its certificate, and deletes the output. The authors haven't run Lab 2. The workbook's Chapter 1 has the exact commands.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G1");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.6, 3.3, 5.25], ["NIST SP 800-53", "KSI", "Evidence"], [
    ["CM-8 System Component Inventory", "KSI-PIY-GIV", "register.json and register.csv; data-platform-handoff.csv"],
    ["AC-2; IA-4", "KSI-IAM-SNU (AC-2); KSI-IAM-ELP, KSI-IAM-JIT (IA-4)", "register.csv: IdentityId, Type, OwnerCount, OwnerIds"],
    ["AC-6(5); IA-5", "KSI-IAM-SNU, KSI-IAM-JIT", "findings.json, NPI-INV-01 (HIGH risk)"],
    ["AC-6, for the reading process", "KSI-IAM-ELP, KSI-IAM-JIT", "Get-NpiRequiredPermission -Task inventory; config/calls.json"],
    ["AU-9 and SI-7, the run's integrity", "KSI-MLA-OSM (AU-9); KSI-SVC-VRI (SI-7)", "manifest.json: tenant, every request, a SHA-256 per file"],
  ], { fontSize: 11.5, limit: 5.3 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them. The mapping is design guidance.", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 1, \"Introduction\"; NIST SP 800-53 (AC-2, AC-6, AU-9, CM-8, IA-4, IA-5, SI-7); FedRAMP 20x KSIs; the guide, \"Evidence.\"");
  notes(s,
`The federal requirement. Gate 1 supports NIST special publication eight hundred fifty-three A C two, I A four and C M eight. Your organization still sets the organization-defined parameters, and the assessor decides whether each is satisfied. The module's table maps each one to its evidence. For C M eight, system component inventory, it's the register, as JSON and as a spreadsheet file, and the Data Platform hand-off. For account and identifier management, it's the register's identity, type and owner columns. For privileged accounts and authenticator management, the high-risk findings. For least privilege of the reading process itself, the permission list and the call list. And for the run's integrity, the manifest, which holds the tenant, every request, and a hash of every file. K S I's are FedRAMP twenty X indicators for cloud service providers. The agency lines its evidence up with what its providers report; it doesn't report K S I's itself. Which file supports which indicator is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); the guide — "Evidence."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on the inventory", [
    { q: "An enabled AD account has had no logon for 90 days. What does the code do?", options: ["a. Disables it", "b. Raises a stale lead (NPI-INV-02) to confirm against DC and Entra sign-in logs, and changes nothing", "c. Deletes it after 30 days"] },
    { q: "jdoe is HIGH risk and also carries NPI-INV-08. Why does that matter?", options: ["a. It was found only by a password that never expires, so it may be a person", "b. It's a gMSA", "c. It holds a client secret"] },
  ], "1 b: a stale account is a lead only; the code never disables, moves or deletes. 2 a: Learn's criteria can find people too.");
  sources(s, "Sources: Module 1, \"Knowledge check,\" questions 2 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: an enabled Active Directory account has had no logon for ninety days. What does the code do? The answer is b. It raises a stale lead, N P I I N V oh two, to confirm against the domain controller and Entra sign-in logs, and it changes nothing. A stale account is only a lead, and the code never disables, moves or deletes anything. Second: j doe is high risk, and also carries N P I I N V oh eight. Why does that matter? The answer is a. It was found only by a password that never expires, so it may be a person, not a service account. Learn's criteria can find people too, so someone confirms it before the next module applies the ownership rule. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 2, owners and orphans");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Read a fictional estate of 35 identities into one register",
    "Found the eight HIGH-risk ones",
    "Saw the reader refuse an undeclared call",
    "Handed three SQL Server and LDAP-bind accounts to the Data Platform plan",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2: Owners, sponsors and the orphan rule", [
    "Two human owners and a sponsor",
    "The orphan rule",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "the register, findings, hand-off and the manifest that hashes them, dated; the step 2 permission list; the test result.");
  sources(s, "Sources: Module 1, \"Summary\"; Module 2.");
  notes(s,
`To sum up. You read a fictional estate of thirty-five identities into one register, found the eight high-risk ones, saw the reader refuse an undeclared call, and handed three SQL Server and LDAP-bind accounts to the Data Platform plan. The evidence an ISSO keeps for Gate 1 from this module is the register, the findings, the hand-off and the manifest that hashes them, all dated; the permission list from step two; and the test result. Before you ship, work through the chapter's checklist. Next is Module 2: owners, sponsors and the orphan rule. Every identity in this register needs two human owners and a sponsor, and Module 2 checks who they are and what happens when there's nobody left.`,
  `${M} — Unit "Summary"; Module 2.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/non-person-identity/01-inventory.md (Non-Person Identity learning path, Module 1): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design and rules: Non-Person Identity: An Implementation Guide, Step 1 (1a to 1f), \"The record each identity joins to,\" the validation kit table and \"Evidence\"; workbook Chapter 01, \"What the register has to hold,\" \"The reader,\" \"Risk, targets, stale leads and the hand-off,\" \"The findings.\"",
  "Kit: examples/non-person-identity (Invoke-NpiInventory.ps1; powershell/NpiCore and NpiInventory; config/calls.json and register.json; tests/fixtures/estate.json). Fictional estate. Illustrative: tested against fixtures, not run against a live tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7 and Pester 5 in a scratch copy of examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it; long commands are wrapped and output trimmed where the slides say so. Verification: docs/training/non-person-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
