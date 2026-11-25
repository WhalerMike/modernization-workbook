// Data Platform and SQL Server Identity learning path, Module 6: NTLM and the SPNs — the module's narrated deck.
// Teaches docs/training/data-platform/06-ntlm-and-the-spns.md, Learn-style: objectives, the concepts (what Microsoft
// gives you: the SPN states; the four patterns that generate NTLM; the NTLM audit and the fix file), "Try it" slides
// with the module page's own Lab 1 commands and expected output (the kit's fixtures, day 1 and day 30), Lab 2, the
// federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module page,
// workbook Chapter 06 and the Book 06 chapters and Runbook R06 it links, or the kit (examples/sql-server-identity);
// the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-dp-module-6/build.js \
//                      presentations/training-dp-module-6/Training_DP_Module_6.pptx
const TITLE = "Module 6: NTLM and the SPNs";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Data Platform and SQL Server Identity learning path, Module 6: NTLM and the SPNs",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and labels the title slide for the Microsoft Automation path; this path's title slide
// and document title are set here.
P.D.pres.title = `Data Platform and SQL Server Identity learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "DATA PLATFORM AND SQL SERVER IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_DP_Module_6.pptx";
const M = "Training, Data Platform, Module 6";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 6: NTLM and the SPNs", "Data Platform and SQL Server Identity learning path · Runbook R06, with workbook Chapter 06",
    ["The SPN states  ·  The patterns that generate NTLM  ·  Discovery first, fixes for review", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 6 of the Data Platform and SQL Server Identity learning path: NTLM and the SPNs. It goes with Runbook R oh six and Chapter 06 of the developer workbook, Building SQL Server Identity. You'll find every reason an instance's connections use NTLM or fail Kerberos, and write each S P N fix for review instead of running it. Take this module after Modules 5 and 2.`,
  `${M} — Unit 1 "Introduction"; workbook Chapter 06, "In this chapter."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why most NTLM is a missing or misplaced name");
  tag(s, "Why");
  const l = panel(s, "Today", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "HOW IT HAPPENS", "Kerberos first, then NTLM, or a failure", [
    "Windows Authentication tries Kerberos first",
    "No ticket for the instance's SPN: the connection uses NTLM",
    "The SPN on the wrong account: authentication fails outright",
  ], 13.5);
  const r = panel(s, "Goal", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "IN THIS MODULE", "Every reason, per instance", [
    "Every reason its connections use NTLM or fail Kerberos",
    "The setspn line that would fix each SPN problem",
    "Ready for a change window, not run",
  ], 13.5);
  callout(s, "Find", Math.max(l, r) + 0.3, 1.2, "FaRoute", HEX.navy, "The starting point: ",
    "you can't remove NTLM you haven't found, and most of what you find is a missing or misplaced name.");
  sources(s, "Sources: Module 6, Unit 1 \"Introduction\"; workbook Chapter 06, \"Goal and audience.\"");
  notes(s,
`Why does this matter? You can't remove NTLM you haven't found, and most of what you find is a missing or misplaced name. Windows Authentication tries Kerberos first. When the client can't get a ticket for the instance's S P N, it uses NTLM. And when the S P N sits on the wrong account, authentication fails outright. In this module you list, per instance, every reason its connections use NTLM or fail Kerberos, with the set S P N line that would fix each S P N problem, ready for a change window.`,
  `${M} — Unit 1 "Introduction"; workbook Chapter 06, "Goal and audience."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 6", [
    "Name the patterns that make SQL Server connections use NTLM, and the two SPN problems that fail instead of falling back",
    "Explain why local connections are left out of the count",
    "Run the kit's NTLM audit over fixtures on day 1 and day 30 and read its findings",
    "Read the fix file and say why nothing in it has run",
  ], [
    "Module 5",
    "Module 2: the audit snapshots this module reads",
    "PowerShell 7 and the kit, unzipped into C:\\FMWLabs",
  ], 50);
  sources(s, "Sources: Module 6, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"Get the code.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll name the patterns that make sequel server connections use NTLM, and the two S P N problems that fail instead of falling back. You'll explain why local connections are left out of the count. You'll run the kit's NTLM audit over fixtures on day 1 and day 30 and read its findings. And you'll read the fix file and say why nothing in it has run. Before you start, finish Module 5, and Module 2, whose audit snapshots this module reads. The lab runs in PowerShell 7, in the kit you unzipped into the F M W Labs folder.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; learning path index, "Get the code."`);
}
endModule(SI);

// ================================================================== 4 SPN states
{
  const s = content(SC, "What Microsoft gives you: the SPN states");
  tag(s, "What");
  const b = table(s, "States", 1.45, [5.2, 6.95], ["SPN state", "What happens"], [
    ["Maps to the account the service runs under", "Local connections use NTLM; remote connections use Kerberos"],
    ["Maps to an incorrect account", "Authentication fails"],
    ["Lookup fails, or no SPN", "Local and remote connections use NTLM"],
  ], { fontSize: 13, limit: 3.6 });
  callout(s, "Fmt", b + 0.25, 1.1, "FaHashtag", HEX.navy, "The SPN's form: ",
    "for TCP, MSSQLSvc/<FQDN>:<port>; for other protocols, MSSQLSvc/<FQDN> or MSSQLSvc/<FQDN>:<instancename>, on the account the service runs under.");
  line(s, "Local", "A connection made on the server itself always reports NTLM, so judge only remote connections.", b + 1.6, 0.45, 13.5);
  sources(s, "Sources: Module 6, Unit 2; workbook Chapter 06, \"What Microsoft gives you\" (Microsoft Learn).");
  notes(s,
`Start with what Microsoft Learn gives you. The client builds an S P N for the instance. For T C P it's M S SQL S V C, slash, the fully qualified name, colon, the port, registered on the account the service runs under. Learn's table of S P N states is the triage key. When the S P N maps to the account the service runs under, local connections use NTLM and remote ones use Kerberos. When it maps to an incorrect account, authentication fails. And when the lookup fails, or there's no S P N, local and remote connections both use NTLM. Notice the first row: a connection made on the server itself always reports NTLM, even when Kerberos is set up correctly. So you judge only remote connections.`,
  `${M} — Unit 2 "The patterns that generate NTLM"; workbook Chapter 06, "What Microsoft gives you."`);
}

// ================================================================== 5 The patterns
{
  const s = content(SC, "The patterns that generate NTLM at the SQL layer");
  tag(s, "What");
  const b = table(s, "Pat", 1.45, [3.6, 8.55], ["Pattern", "What it means"], [
    ["Missing or incorrect SPN", "No SPN: NTLM. An SPN on the wrong account fails, and a duplicate SPN breaks Kerberos too"],
    ["Cross-site connections", "A client that can't reach a domain controller"],
    ["Linked-server passthrough", "Passing the caller's credentials needs Kerberos delegation: NTLM can't make the second hop"],
    ["Non-domain-joined clients", "A client off the domain can't get a Kerberos ticket"],
  ], { fontSize: 13, limit: 4.9 });
  callout(s, "Tri", b + 0.3, 1.1, "FaTriangleExclamation", HEX.amber, "The triage point: ",
    "an SPN on the wrong account doesn't fall back to NTLM, it fails. It shows as an error, not as NTLM, and is triaged as a different problem.");
  sources(s, "Sources: Module 6, Unit 2; Book 06, Ch 14, Patterns One to Four; workbook Chapter 06, \"What it leaves to you.\"");
  notes(s,
`Unit 2 is the patterns. The data platform book's chapter on NTLM names four patterns at the sequel layer. A missing or incorrect S P N. Cross-site connections that can't reach a domain controller. Linked-server passthrough. And clients that aren't domain-joined. Its triage point matters most: an S P N on the wrong account doesn't fall back to NTLM, it fails, and a duplicate S P N breaks Kerberos too. That shows up as an error, not as NTLM, so it gets triaged as a different problem. And a linked server that passes the caller's credentials needs Kerberos delegation, because NTLM can't make the second hop.`,
  `${M} — Unit 2 "The patterns that generate NTLM"; workbook Chapter 06, "What it leaves to you."`);
}

// ================================================================== 6 The audit and the fix file
{
  const s = content(SC, "Discovery first: the NTLM audit and the fix file");
  tag(s, "How");
  const b = table(s, "Aud", 1.45, [3.4, 8.75], ["Pattern the audit reports", "Fix the kit writes"], [
    ["Missing SPN", "setspn -S <spn> <service account>"],
    ["SPN on the wrong account", "setspn -D from that account, then setspn -S on the service account"],
    ["Duplicate SPN", "setspn -D from each account that isn't the service account"],
    ["Remote NTLM observed", "Find each client; local sessions are excluded"],
    ["Linked-server passthrough", "Constrained delegation, a mapped login, or the SQL Server 2025 managed-identity linked server"],
    ["Non-domain-joined client", "Move the principal to an Entra login with a token-based connection (Chapter 07)"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Not", b + 0.25, 1.15, "FaTriangleExclamation", HEX.amber, "Not detected: ",
    "cross-site connections look like a missing SPN in this data (confirm with klist first), and only the TCP SPN form is checked.");
  sources(s, "Sources: Module 6, Unit 3; workbook Chapter 06, \"The NTLM audit\"; Book 06, Ch 15, Phase A; Runbook R06, Phase 1.");
  notes(s,
`Unit 3 is discovery first, and fixes for review. The data platform book's three phases of NTLM elimination start with discovery: the baseline that later phases measure against. The kit's NTLM audit joins the audit snapshot, the estate, the domain's M S SQL S V C S P Ns, the linked servers and the client records. It builds the expected T C P S P N for each instance and compares it with who holds it. For a virtual or built-in service account, it expects the S P N on the computer account. It writes each set S P N fix to a file for review, and never runs it. Runbook R oh six puts each change in a window, with its back-out. Two patterns aren't detected. Cross-site connections look like a missing S P N in this data, so confirm with K list before changing anything. And only the T C P form of the S P N is checked.`,
  `${M} — Unit 3 "Discovery first, fixes for review"; workbook Chapter 06, "The NTLM audit," "Dangers."`);
}
// ================================================================== 6b Dangers
{
  const s = content(SC, "Dangers, and the guard against each");
  tag(s, "Who");
  table(s, "Dng", 1.45, [3.5, 4.1, 4.55], ["Danger", "What happens", "The guard"], [
    ["Running the fix file as a script", "Every SPN in it moves at once, outside review", "One reviewed line at a time, in a window, with its setspn -D or -S back-out"],
    ["A virtual or built-in service account", "The SPN belongs on the computer account; moving it would break Kerberos", "The kit expects DOMAIN\\HOST$ for NT SERVICE\\ and NT AUTHORITY\\ accounts"],
    ["Cross-site NTLM read as a missing SPN", "An SPN is added that changes nothing", "klist get from the client site before any fix"],
    ["A linked server \"fixed\" with unconstrained delegation", "The first server holds a reusable ticket for every caller", "R06's options: Entra authentication, constrained delegation, or a documented mapped-login exception"],
    ["Only the TCP SPN checked", "Named pipes or short-name clients still use NTLM", "Check the other SPN forms by hand where those clients exist"],
  ], { fontSize: 12, limit: 6.4 });
  sources(s, "Sources: Module 6, Unit 3; workbook Chapter 06, \"Dangers\"; Runbook R06, linked-server passthrough.");
  notes(s,
`Chapter 06 of the workbook names the dangers, and the guard against each. Running the fix file as a script moves every S P N in it at once, outside review; the guard is one reviewed line at a time, in a window, with its back-out. For a virtual or built-in service account, the S P N belongs on the computer account, and moving it to the service account would break Kerberos, so the kit expects the computer account for those. Cross-site NTLM read as a missing S P N leads to an S P N that changes nothing; run K list get from the client's site before any fix. A linked server fixed with unconstrained delegation leaves the first server holding a reusable ticket for every caller; Runbook R oh six's options are Entra authentication, constrained delegation, or a mapped login as a documented exception. And because only the T C P S P N is checked, named pipes or short-name clients can still use NTLM, so check those forms by hand.`,
  `${M} — Unit 3 "Discovery first, fixes for review"; workbook Chapter 06, "Dangers."`);
}
endModule(SC);

// ================================================================== 7 Try it: day 1
{
  const s = content(SL, "Try it: run the NTLM audit on day 1");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "$ Set-Location C:\\FMWLabs\\sql-server-identity-code\\sql-server-identity",
    "$ $Run = \"C:\\FMWLabs\\results\\data-platform-06\\lab1\\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')\"   # ...",
    "# Step 1: run the audit on day 1",
    "$ ./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json `",
    "      -EstatePath tests/fixtures/estate/estate.json -NtlmPath tests/fixtures/ntlm -OutputPath \"$Run\\ntlm\"",
    "Instance Pattern                   Effect",
    "SQLPRD01 Remote NTLM observed      41 remote NTLM sessions in the sample",
    "SQLPRD02 Missing SPN               Remote connections fall back to NTLM",
    "SQLFCI04 SPN on the wrong account  Held by CONTOSO\\svc-oldsql, service runs as CONTOSO\\svc-sqlfci04: authentication fails",
    "SQLPRD06 Duplicate SPN             Held by CONTOSO\\gmsa-sqlprd06$ and CONTOSO\\SQLPRD06$: Kerberos can't choose",
    "SQLPRD06 Remote NTLM observed      6 remote NTLM sessions in the sample",
    "SQLPRD01 Linked-server passthrough Calls to SQLLEG03 pass the caller's credentials: NTLM unless delegation is set",
    "SQLPRD06 Non-domain-joined client  dmz-web01 (192.0.2.15) can't get a Kerberos ticket",
    "Wrote 3 files and manifest.json to $Run/ntlm",
    "Evidence for NTLM (Find the NTLM patterns and plan the SPN fixes): IA-2, CM-6; KSI-SVC-ACM",
    "SPN fixes to review: 4, in $Run/ntlm/spn-fixes.txt",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED; "..." MARKS A CUT; PATHS SHORTENED)`, pt: 10 });
  line(s, "P01", "SQLPRD01's SPN is correct, yet 41 sessions use NTLM: its client is domain-joined, so look on the client side.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 6, Unit 4 \"Exercise: Lab 1,\" step 1; workbook Chapter 06, Lab 1.");
  notes(s,
`Try it. Lab 1 runs in PowerShell 7 on the kit's fictional estate, with no tenant. Go to the kit's folder, and make this run's results folder, named for the time you start, in U T C, so every run keeps its own results. Step one runs the audit on day 1: seven findings on four instances. SQL P R D oh two is missing its S P N, so remote connections fall back to NTLM. On SQL F C I oh four, the S P N is held by an old account, not the one the service runs as, so authentication fails. On SQL P R D oh six, two accounts hold it, so Kerberos can't choose. Then there's remote NTLM, a linked server passing the caller's credentials, and a client off the domain. Look at SQL P R D oh one: its S P N is correct, yet forty-one sessions use NTLM. The client file shows that host is domain-joined, so look on the client side: aliases, hosts file entries, D N S and old drivers.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," step 1; workbook Chapter 06, Lab 1.`);
}

// ================================================================== 8 Try it: the fix file
{
  const s = content(SL, "Try it: read the fix file");
  tag(s, "How");
  const c = code(s, "Fix", 0.6, 1.45, 12.15, [
    "# Step 2: read the fix file",
    "$ Get-Content \"$Run\\ntlm\\spn-fixes.txt\"",
    "# Review each line; run with Domain Admin rights in a change window. Nothing here has run.",
    "setspn -S MSSQLSvc/sqlprd02.contoso.example:1433 CONTOSO\\svc-sqlprd02",
    "setspn -D MSSQLSvc/sqlfci04.contoso.example:1433 CONTOSO\\svc-oldsql",
    "setspn -S MSSQLSvc/sqlfci04.contoso.example:1433 CONTOSO\\svc-sqlfci04",
    "setspn -D MSSQLSvc/sqlprd06.contoso.example:1433 CONTOSO\\SQLPRD06$",
  ], { label: `TRY IT  ·  ${CAP}`, pt: 12 });
  const l = line(s, "Four", "Four lines for three instances, and nothing has run.", c + 0.25, 0.45, 14);
  callout(s, "Dup", l + 0.2, 1.15, "FaKey", HEX.navy, "On SQLPRD06: ",
    "the SPN stays with the gMSA the service runs as and leaves the computer account. Removing a duplicate from the wrong account would stop Kerberos.");
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" step 2; workbook Chapter 06, Lab 1, \"Dangers.\"");
  notes(s,
`Step two reads the fix file: four lines for three instances, and nothing has run. The first line says so: review each line, and run it with Domain Admin rights in a change window. SQL P R D oh two gets its S P N added on its service account. On SQL F C I oh four, the S P N is deleted from the old account, then added to the one the service runs as. And on SQL P R D oh six, the S P N stays with the G M S A the service runs as, and leaves the computer account. That's the guard against a danger: a duplicate removed from the wrong account takes the S P N away from the service account, and Kerberos stops.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 2; workbook Chapter 06, "Dangers."`);
}

// ================================================================== 9 Try it: every fix
{
  const s = content(SL, "Try it: every fix, including those that aren't setspn");
  tag(s, "How");
  const c = code(s, "All", 0.6, 1.45, 12.15, [
    "# Step 3: read every fix",
    "$ Import-Csv \"$Run\\ntlm\\ntlm.csv\" | Format-Table Instance, Pattern, Fix -Wrap",
    "Instance Pattern                   Fix",
    "SQLPRD01 Remote NTLM observed      Find each client (the clients rows, or sys.dm_exec_connections",
    "                                   client_net_address); local sessions are excluded",
    "SQLPRD02 Missing SPN               setspn -S MSSQLSvc/sqlprd02.contoso.example:1433 CONTOSO\\svc-sqlprd02",
    "SQLFCI04 SPN on the wrong account  setspn -D MSSQLSvc/sqlfci04.contoso.example:1433 CONTOSO\\svc-oldsql;",
    "                                   setspn -S MSSQLSvc/sqlfci04.contoso.example:1433 CONTOSO\\svc-sqlfci04",
    "SQLPRD06 Duplicate SPN             setspn -D MSSQLSvc/sqlprd06.contoso.example:1433 CONTOSO\\SQLPRD06$",
    "SQLPRD06 Remote NTLM observed      Find each client (the clients rows, or sys.dm_exec_connections",
    "                                   client_net_address); local sessions are excluded",
    "SQLPRD01 Linked-server passthrough Constrained delegation, a mapped login, or the SQL Server 2025",
    "                                   managed-identity linked server",
    "SQLPRD06 Non-domain-joined client  Move CONTOSO\\Reports-Readers to an Entra login with a token-based",
    "                                   connection (Chapter 07)",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED)`, pt: 10.5 });
  line(s, "Kinds", "Not every fix is a setspn line: some find a client, some choose delegation, some move a login to Entra.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" step 3; workbook Chapter 06, \"The NTLM audit.\"");
  notes(s,
`Step three reads every fix, including the ones that aren't set S P N lines. For remote NTLM, the fix is to find each client, from the client rows or the client address in the connections view; local sessions are excluded. For the linked-server passthrough on SQL P R D oh one, it's constrained delegation, a mapped login, or the sequel server twenty twenty-five managed-identity linked server. And for the client off the domain, it's moving Reports Readers to an Entra login with a token-based connection, which is the next module's subject.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 3; workbook Chapter 06, "The NTLM audit."`);
}

// ================================================================== 10 Try it: day 30
{
  const s = content(SL, "Try it: run the audit on day 30");
  tag(s, "How");
  const c = code(s, "D30", 0.6, 1.45, 12.15, [
    "# Step 4: run it on day 30",
    "$ ./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json `",
    "      -EstatePath tests/fixtures/estate/estate.json -NtlmPath tests/fixtures/ntlm -OutputPath \"$Run\\ntlm-day30\"",
    "Instance Pattern                   Effect",
    "SQLPRD02 Missing SPN               Remote connections fall back to NTLM",
    "SQLFCI04 SPN on the wrong account  Held by CONTOSO\\svc-oldsql, service runs as CONTOSO\\svc-sqlfci04: authentication fails",
    "SQLPRD06 Duplicate SPN             Held by CONTOSO\\gmsa-sqlprd06$ and CONTOSO\\SQLPRD06$: Kerberos can't choose",
    "SQLPRD06 Remote NTLM observed      6 remote NTLM sessions in the sample",
    "SQLPRD01 Linked-server passthrough Calls to SQLLEG03 pass the caller's credentials: NTLM unless delegation is set",
    "SQLPRD06 Non-domain-joined client  dmz-web01 (192.0.2.15) can't get a Kerberos ticket",
    "Wrote 3 files and manifest.json to $Run/ntlm-day30",
    "Evidence for NTLM (Find the NTLM patterns and plan the SPN fixes): IA-2, CM-6; KSI-SVC-ACM",
    "SPN fixes to review: 4, in $Run/ntlm-day30/spn-fixes.txt",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED; PATHS SHORTENED)`, pt: 10 });
  line(s, "Gone", "SQLPRD01's remote NTLM is gone: its logins moved to Entra. The SPN problems stay: nobody ran the fixes.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" step 4; workbook Chapter 06, Lab 1.");
  notes(s,
`Step four runs the same audit on the day-30 snapshot. SQL P R D oh one's remote NTLM is gone: its logins moved to Entra in Chapter 04 of the workbook. But the S P N problems on the other instances are still there, because nobody ran the fixes. The audit finds; it doesn't repair. The linked-server and client findings come from the same fixture files on both days, so they're unchanged.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 4; workbook Chapter 06, Lab 1.`);
}

// ================================================================== 11 Try it: manifest, tests, runs
{
  const s = content(SL, "Try it: the manifest, the tests and your runs");
  tag(s, "How");
  const c = code(s, "Man", 0.6, 1.45, 12.15, [
    "# Step 5: open the manifest",
    "$ Get-Content \"$Run\\ntlm\\manifest.json\"",
    "  \"step\": \"NTLM\",  \"mode\": \"read-only\",  \"asOf\": \"2026-11-20\",",
    "  \"controls\": [ \"IA-2\", \"CM-6\" ],  \"ksis\": [ \"KSI-SVC-ACM\" ],",
    "  { \"file\": \"ntlm.csv\",      \"sha256\": \"42c98c3f64661de7c2940a4d6823818e5da9742e877064718cef3f688c5b285e\" },",
    "  { \"file\": \"ntlm.json\",     \"sha256\": \"662a82a45a542c34cb44b20b55c595a6624a1267a8f7b1ba30685e08c27b374f\" },",
    "  { \"file\": \"spn-fixes.txt\", \"sha256\": \"5e1709df086a9db913f7a34eaae5231f1057ac361a368cc34b411d872536e521\" }",
    "# Step 6: run this chapter's tests",
    "$ Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 06*' -Output None -PassThru | ...",
    "PassedCount FailedCount",
    "          7           0",
    "# Step 7: list your runs",
    "$ Get-ChildItem C:\\FMWLabs\\results\\data-platform-06\\lab1 -Name",
    "<run>",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED AND REFLOWED: "..." MARKS A CUT)`, pt: 10.5 });
  line(s, "Hash", "The fix file is hashed with the findings, so the lines a change board approves are the lines that run.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 6, \"Exercise: Lab 1,\" steps 5 to 7, and Unit 7 \"Summary.\"");
  notes(s,
`Step five opens the manifest. It names the step, says the run was read-only, and lists the controls, I A two and C M six, with one K S I. Then the S H A two fifty-six of each file, the fix file included. That's the point: the fix file is hashed with the findings, so the lines a change board approves are the lines that run. Step six runs this chapter's tests: seven pass, none fail. And step seven lists your runs. There's nothing to clean up: the kit's folder is as you unzipped it, and each run's results stay in their own folder.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 5 to 7; Unit 7 "Summary."`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: your test domain and test instance");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A test domain and test instance, never production; PowerShell 7 on a domain-joined machine that isn't the SQL Server host, with setspn, ActiveDirectory and SqlServer 22 or later; a login with the snapshot's read rights; a certificate the client trusts"],
    ["1 to 5", "Query the SPNs read-only with setspn, snapshot the instance, write the audit's other inputs, and run the audit"],
    ["6", "The SPN fix is a change: only in an approved window, back-out line ready; then check auth_scheme and klist from a client"],
    ["7", "Back it out: setspn -D restores the old state if the window's checks failed; delete out/lab2"],
  ], { fontSize: 12, limit: 5.2 });
  callout(s, "NotRun", b + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "Not run by the authors. ",
    "Measure from another machine: a connection made on the SQL Server host always reports NTLM.");
  sources(s, "Sources: Module 6, Unit 5 \"Exercise: Lab 2\"; workbook Chapter 06, \"Lab 2: a test instance,\" \"Dangers.\"");
  notes(s,
`Lab 2 runs the audit on your own test domain and test instance, never production. It was not run by the authors. You need PowerShell 7 on a domain-joined machine that isn't the sequel server host, because a connection made on the host itself always reports NTLM. Steps one to five only read: query the domain's S P Ns with set S P N, snapshot the instance, write the audit's other inputs, and run the audit. Step six is a change. Run the one reviewed fix only in an approved window, with its back-out line ready, then check the auth scheme and K list from a client. If the window's checks fail, the set S P N delete line restores the old state, and step seven deletes the lab's output folder.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test instance)"; workbook Chapter 06, "Lab 2: a test instance."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.4, 2.6, 2.1, 4.05], ["What the output shows", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["The audit and fix plan (Lab 1, steps 1 to 5)", "CM-6 Configuration Settings", "KSI-SVC-ACM", "ntlm.csv and spn-fixes.txt with the manifest; the change record for each setspn line that ran"],
    ["The audit and fix plan", "IA-2 Identification and Authentication (Organizational Users)", "None in the kit", "The same findings, and the auth_scheme and klist record from a remote client after each fix"],
  ], { fontSize: 12.5, limit: 5.0 });
  line(s, "Ass", "The kit's records support these controls and provide evidence; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.3, 0.75, 13.5);
  sources(s, "Sources: Module 6, Unit 1 (the federal requirement); NIST SP 800-53; FedRAMP 20x KSIs; Chapter 06, \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. Chapter 06 of the workbook maps the audit and fix plan to C M six, Configuration Settings, in NIST SP 800-53, with the K S I S V C A C M. The evidence is the findings file and the fix file with the manifest, and the change record for each set S P N line that ran. It maps the same plan to I A two, Identification and Authentication for organizational users, which has no K S I pairing in the kit. Its evidence is the same findings, and the auth scheme and K list record from a remote client after each fix. Runbook R oh six lists the evidence for each remediation state. K S Is are FedRAMP twenty X indicators for cloud service providers; your providers report against them, the agency doesn't. The kit's records support these controls and provide evidence for them; the assessor decides whether each one is in place.`,
  `${M} — Unit 1 "Introduction" (the federal requirement); workbook Chapter 06, "Federal requirements and evidence."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on NTLM and SPNs", [
    { q: "On SQLFCI04 the SPN is held by CONTOSO\\svc-oldsql; the service runs as CONTOSO\\svc-sqlfci04. What happens to remote connections?", options: ["a. They fall back to NTLM", "b. Authentication fails", "c. They use Kerberos with the old account"] },
    { q: "What has happened to the lines in spn-fixes.txt when the audit finishes?", options: ["a. They have run against the domain", "b. Nothing in the file has run; each line is reviewed and run in a change window, with its back-out", "c. They ran in dry-run mode only"] },
  ], "1 b: an SPN on the wrong account fails rather than falls back. 2 b: the kit writes the fixes for review and never runs them.");
  sources(s, "Sources: Module 6, Unit 6 \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: on SQL F C I oh four, the S P N is held by the old account, but the service runs as its own account. What happens to remote connections? The answer is b: authentication fails. An S P N on the wrong account fails rather than falls back to NTLM. Second: what has happened to the lines in the fix file when the audit finishes? The answer is b: nothing in the file has run. Each line is reviewed and run in a change window, with its back-out. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary: find the NTLM, review the fixes");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU FOUND", null, [
    "The missing, misplaced and duplicate SPNs",
    "The remote NTLM, the linked-server passthrough and the client off the domain",
    "That the SPN problems stay until someone runs the reviewed fixes",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 7: The application chain", [
    "Or workbook Chapter 06, for Lab 2 and its checklist",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "The ISSO keeps: ",
    "ntlm.csv and spn-fixes.txt with manifest.json and each file's SHA-256; the change record for each setspn line that ran; the auth_scheme and klist record after each fix.");
  sources(s, "Sources: Module 6, Unit 7 \"Summary\"; workbook Chapter 06, \"Checklist.\"");
  notes(s,
`To sum up. You found the missing, misplaced and duplicate S P Ns, the remote NTLM, the linked-server passthrough and the client off the domain in the fictional estate. And you saw that the S P N problems stay until someone runs the reviewed fixes. The fix file is hashed with the findings, so the lines a change board approves are the lines that run. The I S S O keeps the findings and the fix file with the manifest, the change record for each set S P N line that ran, and the auth scheme and K list record from a remote client after each fix. Before shipping, work through the Chapter 06 checklist. Next is Module 7, the application chain.`,
  `${M} — Unit 7 "Summary"; workbook Chapter 06, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 6 deck", [
  "Module page: docs/training/data-platform/06-ntlm-and-the-spns.md (Data Platform and SQL Server Identity learning path, Module 6): Introduction and its federal requirement, objectives, prerequisites, Units 2 and 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: Book 06, Data Platform: SQL Server Identity, Chapter 14 (Patterns One to Four) and Chapter 15 (Phase A, discovery); Runbook R06, NTLM detection and remediation (Phase 1, repair a collision, linked-server passthrough, control states). NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 06, Building SQL Server Identity, NTLM and the SPNs: \"What Microsoft gives you\" (Microsoft Learn's SPN formats and authentication-defaults table), \"What it leaves to you,\" \"The NTLM audit,\" Lab 1, Lab 2 (not run by the authors), \"Dangers,\" \"Federal requirements and evidence,\" \"Checklist.\" Kit: examples/sql-server-identity (Invoke-SqlNtlmAudit.ps1, tests/fixtures).",
  "Lab output: the module page's Lab 1 expected output on the kit's fictional fixtures; trimmed, wrapped and reflowed, with paths shortened to $Run, where the slides say so.",
]);

finish(OUT);
