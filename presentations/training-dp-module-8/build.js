// Data Platform and SQL Server Identity learning path, Module 8: AD CS Dependencies — the module's narrated deck.
// Teaches docs/training/data-platform/08-ad-cs-dependencies.md, Learn-style: objectives, the concepts (three places
// SQL Server touches AD CS; what Microsoft gives you about each; the issuer decision and the kit's classes), "Try it"
// slides with the module page's own Lab 1 commands and expected output (the kit's five fictional certificates), Lab 2,
// the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module page,
// workbook Chapter 08 and the Book 06 and Book 07 chapters and Runbook R10 it links, or the kit
// (examples/sql-server-identity); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-dp-module-8/build.js \
//                      presentations/training-dp-module-8/Training_DP_Module_8.pptx
const TITLE = "Module 8: AD CS Dependencies";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Data Platform and SQL Server Identity learning path, Module 8: AD CS Dependencies",
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
const OUT = process.argv[2] || "Training_DP_Module_8.pptx";
const M = "Training, Data Platform, Module 8";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 8: AD CS Dependencies", "Data Platform and SQL Server Identity learning path · Runbook R10, with workbook Chapter 08",
    ["Three places SQL Server touches AD CS  ·  The issuer decision and the order", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 8 of the Data Platform and SQL Server Identity learning path: A D C S dependencies. It goes with Runbook R ten and Chapter 08 of the developer workbook, Building SQL Server Identity. You'll list every certificate sequel server depends on, by class, issuer and expiry, before anyone dates a change to the certificate authority. Take this module after Module 7.`,
  `${M} — Unit 1 "Introduction"; workbook Chapter 08, "In this chapter."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the certificates nobody sees come first");
  tag(s, "Why");
  const l = panel(s, "Unseen", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "WHAT MOST AD CS PLANS NEVER SEE", null, [
    "The TLS certificate the engine presents",
    "The certificates behind certificate-mapped logins and endpoints",
    "The domain controller certificates that certificate-based sign-in needs",
  ], 13.5);
  const r = panel(s, "Goal", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "IN THIS MODULE", "A list for the PKI owner", [
    "Every certificate SQL Server depends on",
    "Its class, issuer, expiry and the action it needs",
    "Handed over before any CA date is set",
  ], 13.5);
  callout(s, "Own", Math.max(l, r) + 0.3, 1.2, "FaLandmark", HEX.navy, "Who decides: ",
    "Book 07, PKI & Certificates, owns which issuer serves which certificate. This module doesn't restate that decision; it feeds it.");
  sources(s, "Sources: Module 8, Unit 1 \"Introduction\"; workbook Chapter 08, \"Goal and audience.\"");
  notes(s,
`Why does this matter? Sequel server depends on certificates that most teams planning an A D C S decommission never see. The T L S certificate the engine presents. The certificates behind certificate-mapped logins and endpoints. And the domain controller certificates that certificate-based sign-in needs. The book P K I and Certificates owns the decision about which issuer serves which certificate. This module doesn't restate that decision; it feeds it. Before any certificate authority's date is set, you hand the P K I owner a list of every certificate sequel server depends on, with its class, issuer, expiry and the action each one needs.`,
  `${M} — Unit 1 "Introduction"; workbook Chapter 08, "Goal and audience."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 8", [
    "Name the three places SQL Server can depend on AD CS-issued certificates, and the issuer Book 07 assigns to each",
    "Explain why an expiring TLS certificate breaks clients and an expiring signing certificate doesn't lock anyone out",
    "Run the kit's certificate dependency list over fixtures and read its class, issuer, expiry and action",
    "Say why certificate-mapped (type C) logins aren't migrated to Entra logins",
  ], [
    "Module 7",
    "An endpoint that authenticates with NTLM or NEGOTIATE is also an NTLM source for Module 6",
    "PowerShell 7 and the kit, unzipped into C:\\FMWLabs",
  ], 40);
  sources(s, "Sources: Module 8, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"Get the code.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about forty minutes with the lab. You'll name the three places sequel server can depend on certificates that A D C S issued, and the issuer that P K I and Certificates assigns to each. You'll explain why an expiring T L S certificate breaks clients, while an expiring signing certificate doesn't lock anyone out. You'll run the kit's certificate dependency list over fixtures and read its class, issuer, expiry and action for each row. And you'll say why certificate-mapped, type C, logins aren't migrated to Entra logins. Before you start, finish Module 7. And remember from Module 6: an endpoint that authenticates with NTLM or negotiate is also an NTLM source. The lab runs in PowerShell 7, in the kit you unzipped into the F M W Labs folder.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; learning path index, "Get the code."`);
}
endModule(SI);

// ================================================================== 4 Three places
{
  const s = content(SC, "Three places SQL Server touches AD CS");
  tag(s, "What");
  const b = table(s, "Three", 1.45, [3.4, 8.75], ["Dependency", "What it does, and why it matters"], [
    ["The TLS certificate", "Encrypts client connections. Entra-authenticated connections are always encrypted, so the Entra target depends on it more, not less"],
    ["Certificate-mapped (type C) logins and endpoints", "Type C logins carry permissions for signed modules and can't be used to connect; certificates of the same kind secure Service Broker and mirroring endpoints"],
    ["Certificate-based sign-in", "The interim posture for connections that can't reach Entra authentication but can negotiate Kerberos; it usually depends on AD CS through the domain controllers' certificates, not the PIV card"],
  ], { fontSize: 12.5, limit: 5.2 });
  line(s, "Type", "Type C logins sign code: moving them to Entra logins is effort they never needed.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 8, Unit 2; Book 06, Ch 22; Runbook R10, Step 2; workbook Chapter 08, \"Dangers.\"");
  notes(s,
`Unit 2 is the three places. The data platform book's chapter on where sequel server touches A D C S names three dependencies. First, the T L S certificate, which encrypts client connections. Entra-authenticated connections are always encrypted, so the Entra target depends on it more, not less. Second, certificate-mapped type C logins. They carry permissions for signed modules and can't be used to connect, and certificates of the same kind secure Service Broker and mirroring endpoints. So treating type C logins as connection logins, and moving them to Entra logins, is effort they never needed. Third, certificate-based sign-in. It's the program's interim posture for connections that can't reach Entra authentication but can negotiate Kerberos. And it usually depends on A D C S through the domain controllers' certificates, rather than through the piv card.`,
  `${M} — Unit 2 "Three places SQL Server touches AD CS"; workbook Chapter 08, "Dangers."`);
}

// ================================================================== 5 What Microsoft gives you
{
  const s = content(SC, "What Microsoft gives you: expiry differs by class");
  tag(s, "What");
  const l = panel(s, "Tls", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE TLS CERTIFICATE", null, [
    "Server Authentication EKU; KeySpec AT_KEYEXCHANGE from a legacy provider; every client name in the SAN",
    "A Key Storage Provider gives KeySpec = 0, which SQL Server can't use",
    "SQL Server checks validity only when it's configured, but clients that validate fail on an expired one",
  ], 12.5);
  const r = panel(s, "Sign", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "SIGNING CERTIFICATES", null, [
    "sys.server_principals marks a certificate-mapped login as type C, used only for code signing",
    "The built-in signing functions don't check expiry; Service Broker and backup encryption do",
    "sys.certificates gives each issuer_name and expiry_date",
  ], 12.5);
  callout(s, "Cloud", Math.max(l, r) + 0.3, 1.0, "FaCloud", HEX.navy, "And one more fact: ",
    "Microsoft Cloud PKI issues only to devices enrolled in Intune, which excludes Windows Server.");
  sources(s, "Sources: Module 8, Units 2 and 3; workbook Chapter 08, \"What Microsoft gives you\" (Microsoft Learn).");
  notes(s,
`Here's what Microsoft Learn gives you. A sequel server T L S certificate needs the Server Authentication enhanced key usage, a key spec of key exchange from a legacy provider, and every client name in the subject alternative name. A certificate from a Key Storage Provider gives a key spec of zero, which sequel server can't use. Sequel server checks the certificate's validity only when it's configured, but clients that validate the certificate fail on an expired one. Signing certificates are different. A certificate-mapped login shows as type C, used only for code signing, and the built-in signing functions don't check expiry, though Service Broker and backup encryption do. So an expiring T L S certificate breaks clients, and an expiring signing certificate doesn't lock anyone out. One more fact: Microsoft Cloud P K I issues only to devices enrolled in Intune, which excludes Windows Server.`,
  `${M} — Units 2 and 3; workbook Chapter 08, "What Microsoft gives you," "What it leaves to you."`);
}

// ================================================================== 6 Issuer decision and the kit's classes
{
  const s = content(SC, "The issuer decision, and the class on every row");
  tag(s, "How");
  const b = table(s, "Cls", 1.45, [3.6, 8.55], ["Class (the kit's use)", "Issuer, and the action when an enterprise AD CS CA issued it"], [
    ["TLS for client connections", "Retained AD CS hierarchy, requested and renewed through the CLM platform; move it before its issuing CA is retired"],
    ["Certificate-mapped login or endpoint", "Not renewed by the CLM platform: replace or re-map before this CA is retired"],
    ["Certificate-based sign-in (NTLM interim)", "Domain controller certificates stay on AD CS autoenrollment until the last DC retires; retire it with the interim posture"],
  ], { fontSize: 12.5, limit: 4.4 });
  callout(s, "Kit", b + 0.25, 1.15, "FaListCheck", HEX.navy, "What the kit adds: ",
    "ADCS is yes when the issuer is one of your enterpriseCAs, from the PKI owner; a warning inside a 90-day window from config/thresholds.json.");
  sources(s, "Sources: Module 8, Unit 3; Book 07, Ch 04; Book 06, Ch 22; Runbook R10, Step 3; workbook Chapter 08, \"The code.\"");
  notes(s,
`Unit 3 is the issuer decision and the order. P K I and Certificates gives each class of certificate one issuer and one renewal engine. Sequel server's T L S certificate comes from the retained A D C S hierarchy, requested and renewed through the C L M platform. Its deadline is the issuing C A it chains to being retired, not A D C S as a whole. A certificate-mapped login or endpoint isn't renewed by the platform, so it's replaced or re-mapped by hand before its C A is retired. Domain controller certificates stay on A D C S autoenrollment until the last domain controller retires, so the interim posture keeps what it depends on. The kit turns each certificate's use into a class and an action. It marks it yes when its issuer is one of your enterprise C As, a list the P K I owner supplies, and it warns inside a ninety-day window.`,
  `${M} — Unit 3 "The issuer decision and the order"; workbook Chapter 08, "The code."`);
}
// ================================================================== 6b Dangers
{
  const s = content(SC, "Dangers, and the guard against each");
  tag(s, "Who");
  table(s, "Dng", 1.45, [3.5, 4.1, 4.55], ["Danger", "What happens", "The guard"], [
    ["The TLS certificate expires after its CA goes", "Clients that validate refuse to connect; every Entra connection validates", "The class and window on every row; the lifecycle platform renews it from the retained AD CS hierarchy first"],
    ["An empty registry value read as \"no certificate\"", "A store certificate or a self-generated one is in use, unseen", "Lab 2 step 2, and R10's error-log check"],
    ["A replacement certificate from a Key Storage Provider", "KeySpec = 0; SQL Server can't use it", "Check KeySpec before renewal"],
    ["Type C logins treated as connection logins", "Effort spent moving them to Entra logins, which they never needed", "They sign code; replace only a certificate whose issuer is AD CS"],
    ["An issuer missing from enterpriseCAs", "An AD CS certificate reads no", "The PKI owner supplies the list of enterprise CA names"],
  ], { fontSize: 12, limit: 6.4 });
  sources(s, "Sources: Module 8, Unit 3; workbook Chapter 08, \"Dangers\"; Book 06, Ch 22.");
  notes(s,
`Chapter 08 of the workbook names the dangers, and the guard against each. If the T L S certificate expires after its C A goes, clients that validate refuse to connect, and every Entra connection validates. The guard is the class and window on every row, with the lifecycle platform renewing it from the retained A D C S hierarchy before its issuing C A is retired. An empty registry value read as no certificate hides a store certificate or a self-generated one; Lab 2's second step and R ten's error-log check find it. A replacement certificate from a Key Storage Provider has a key spec of zero, which sequel server can't use, so check the key spec before renewal. Type C logins treated as connection logins waste effort, because they sign code. And an issuer missing from the enterprise C A list makes an A D C S certificate read no, so the P K I owner supplies that list.`,
  `${M} — Unit 3 "The issuer decision and the order"; workbook Chapter 08, "Dangers."`);
}
endModule(SC);

// ================================================================== 7 Try it: list
{
  const s = content(SL, "Try it: list the certificates");
  tag(s, "How");
  const c = code(s, "List", 0.6, 1.45, 12.15, [
    "$ Set-Location C:\\FMWLabs\\sql-server-identity-code\\sql-server-identity",
    "$ $Run = \"C:\\FMWLabs\\results\\data-platform-08\\lab1\\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')\"   # ...",
    "# Step 1: list the certificates",
    "$ ./Invoke-SqlCertDependency.ps1 -CertsPath tests/fixtures/certs/certs.json -OutputPath \"$Run\\certs\"",
    "Instance Class                                    ADCS ExpiresInDays Warning",
    "-------- -----                                    ---- ------------- -------",
    "SQLPRD01 TLS for client connections               yes             72 expires within 90 days",
    "SQLPRD06 TLS for client connections               no             481",
    "SQLPRD02 Certificate-mapped login                 yes             41 expires within 90 days",
    "SQLPRD02 Certificate-mapped endpoint              yes            254",
    "SQLFCI04 Certificate-based sign-in (NTLM interim) yes            100",
    "Wrote 2 files and manifest.json to $Run/certs",
    "Evidence for CERTS (Find the AD CS certificates SQL Server depends on): SC-8, SC-12, SC-17; KSI-SVC-SIN, KSI-SVC-ASM",
    "Blocking an AD CS decommission: 4 of 5",
  ], { label: `TRY IT  ·  ${CAP} ("..." MARKS A CUT; PATHS SHORTENED)`, pt: 10.5 });
  line(s, "Most", "SQLPRD01's TLS row matters most: in 72 days every client that validates refuses to connect, and Entra connections always validate.", c + 0.2, 0.75, 13.5);
  sources(s, "Sources: Module 8, Unit 4 \"Exercise: Lab 1,\" step 1; workbook Chapter 08, Lab 1.");
  notes(s,
`Try it. Lab 1 runs in PowerShell 7 on the kit's fictional certificate inventory, with no tenant. Go to the kit's folder and make this run's results folder, named for the time you start, in U T C. Step one lists the certificates. Four of the five came from the fictional enterprise C A, and two expire inside ninety days. The SQL P R D oh one T L S row matters most: in seventy-two days every client that validates the certificate refuses to connect, and Entra connections always validate. The SQL P R D oh two login row expires sooner, in forty-one days, but signing doesn't check expiry. The reason to replace it is its issuer. The last line counts the rows an enterprise A D C S C A issued: four of five, each needing its action before that C A is retired.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," step 1; workbook Chapter 08, Lab 1, "The code."`);
}

// ================================================================== 8 Try it: actions
{
  const s = content(SL, "Try it: read the action for each certificate");
  tag(s, "How");
  const c = code(s, "Act", 0.6, 1.45, 12.15, [
    "# Step 2: read the action for each",
    "$ Import-Csv \"$Run\\certs\\certificates.csv\" | Select-Object Instance, Class, Issuer, Action | Format-List",
    "Instance : SQLPRD01   Class : TLS for client connections   Issuer : CONTOSO-ISSUING-CA01",
    "Action   : Retained AD CS issues it through the CLM platform (Book 07, Ch 04); move it before this CA is retired",
    "Instance : SQLPRD06   Class : TLS for client connections   Issuer : Federal Bridge Test Issuer (fictional)",
    "Action   : Not AD CS: track it in the certificate lifecycle platform",
    "Instance : SQLPRD02   Class : Certificate-mapped login     Issuer : CONTOSO-ISSUING-CA01",
    "Action   : Not renewed by the CLM platform: replace or re-map before this CA is retired (Chapter 22)",
    "Instance : SQLPRD02   Class : Certificate-mapped endpoint  Issuer : CONTOSO-ISSUING-CA01",
    "Action   : Not renewed by the CLM platform: replace or re-map before this CA is retired (Chapter 22)",
    "Instance : SQLFCI04   Class : Certificate-based sign-in (NTLM interim)   Issuer : CONTOSO-ISSUING-CA01",
    "Action   : NTLM interim: it also depends on the domain controllers certificates; retire it with the interim posture",
  ], { label: `TRY IT  ·  ${CAP} (REFLOWED: INSTANCE, CLASS AND ISSUER ON ONE LINE; BLANK LINES LEFT OUT)`, pt: 10.5 });
  line(s, "Rule", "One action per class. A certificate AD CS didn't issue is tracked in the lifecycle platform.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" step 2; workbook Chapter 08, \"The code.\"");
  notes(s,
`Step two reads the action for each certificate. The SQL P R D oh one T L S certificate stays on the retained A D C S, issued through the C L M platform; move it before its C A is retired. The SQL P R D oh six T L S certificate isn't from A D C S at all, so it's tracked in the certificate lifecycle platform. The certificate-mapped login and endpoint on SQL P R D oh two aren't renewed by the C L M platform, so they're replaced or re-mapped before the C A is retired. And the certificate-based sign-in on SQL F C I oh four also depends on the domain controllers' certificates, so it's retired with the NTLM interim posture.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 2; workbook Chapter 08, "The code."`);
}

// ================================================================== 9 Try it: widen the window
{
  const s = content(SL, "Try it: widen the warning window");
  tag(s, "How");
  const c = code(s, "Win", 0.6, 1.45, 12.15, [
    "# Step 3: widen the window",
    "$ Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1",
    "$ Get-SqlCertificateDependency -Certs (Read-SqlJson tests/fixtures/certs/certs.json) -WarningDays 365 |",
    "      Format-Table Instance, Class, ExpiresInDays, Warning -AutoSize",
    "Instance Class                                    ExpiresInDays Warning",
    "-------- -----                                    ------------- -------",
    "SQLPRD01 TLS for client connections                          72 expires within 365 days",
    "SQLPRD06 TLS for client connections                         481",
    "SQLPRD02 Certificate-mapped login                            41 expires within 365 days",
    "SQLPRD02 Certificate-mapped endpoint                        254 expires within 365 days",
    "SQLFCI04 Certificate-based sign-in (NTLM interim)           100 expires within 365 days",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED)`, pt: 11 });
  line(s, "Def", "The 90 days is a default in config/thresholds.json; a parameter changes it for one run.", c + 0.25, 0.45, 14);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" step 3; workbook Chapter 08, \"What it leaves to you.\"");
  notes(s,
`Step three widens the window. The ninety days is a default in the kit's thresholds file, and a parameter changes it for one run. With a window of three hundred sixty-five days, four of the five certificates warn. Only SQL P R D oh six's T L S certificate, with four hundred eighty-one days left, stays quiet.`,
  `${M} — Unit 4 "Exercise: Lab 1," step 3; workbook Chapter 08, "What it leaves to you."`);
}

// ================================================================== 10 Try it: manifest, tests, runs
{
  const s = content(SL, "Try it: the manifest, the tests and your runs");
  tag(s, "How");
  const c = code(s, "Man", 0.6, 1.45, 12.15, [
    "# Step 4: open the manifest",
    "$ Get-Content \"$Run\\certs\\manifest.json\"",
    "  \"step\": \"CERTS\",  \"mode\": \"read-only\",  \"asOf\": \"2026-11-20\",",
    "  \"controls\": [ \"SC-8\", \"SC-12\", \"SC-17\" ],  \"ksis\": [ \"KSI-SVC-SIN\", \"KSI-SVC-ASM\" ],",
    "  { \"file\": \"certificates.csv\",  \"sha256\": \"daeb5397c44c213e7b106f47eb57416578a4b27e28e3a71e49c17a50b5f622b1\" },",
    "  { \"file\": \"certificates.json\", \"sha256\": \"e44433e5c534443c6bcffeaad45ce0acda5fa343613b791dd35eccd2bda34a84\" }",
    "# Step 5: run this chapter's tests",
    "$ Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 08*' -Output None -PassThru | ...",
    "PassedCount FailedCount",
    "          3           0",
    "# Step 6: list your runs",
    "$ Get-ChildItem C:\\FMWLabs\\results\\data-platform-08\\lab1 -Name",
    "<run>",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED AND REFLOWED: "..." MARKS A CUT)`, pt: 10.5 });
  line(s, "Ro", "Read-only: the list reads a saved inventory; nothing is issued, bound, changed or restarted.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 8, \"Exercise: Lab 1,\" steps 4 to 6; workbook Chapter 08, Lab 1.");
  notes(s,
`Step four opens the manifest: the step, its mode, read-only, its controls, S C eight, S C twelve and S C seventeen, its two K S Is, and the S H A two fifty-six of each file. Step five runs this chapter's tests: three pass, none fail. And step six lists your runs. There's nothing to clean up: the kit's folder is as you unzipped it, and each run's results stay in their own folder.`,
  `${M} — Unit 4 "Exercise: Lab 1," steps 4 to 6; workbook Chapter 08, Lab 1.`);
}

// ================================================================== 11 Lab 2
{
  const s = content(SL, "Lab 2: R10's reads on your test instance");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "One test instance and its host, never production; PowerShell 7 with the SqlServer module on the host; a test reader with VIEW SERVER PERFORMANCE STATE, VIEW SERVER SECURITY STATE and VIEW ANY DEFINITION (VIEW SERVER STATE before 2022), never sysadmin; your enterprise issuing CA names"],
    ["1 to 4", "Read the configured TLS thumbprint, the host's certificates, the certificate-mapped logins and the endpoints"],
    ["5 and 6", "Save the reads by hand in the fixture's shape, and run the dependency list on them"],
    ["7", "Back it out: nothing changed; delete the lab2 folder, or keep the reads inside your boundary as R10's evidence"],
  ], { fontSize: 12, limit: 5.4 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors. ",
    "Every step reads: nothing is issued, bound, changed or restarted.");
  sources(s, "Sources: Module 8, Unit 5 \"Exercise: Lab 2\"; workbook Chapter 08, \"Lab 2: a test instance.\"");
  notes(s,
`Lab 2 runs Runbook R ten's reads on one test instance and its host, never production. It was not run by the authors. Every step reads: nothing is issued, bound, changed or restarted. Sign in as a test reader whose login holds the view-state and view-definition permissions the page lists, never sysadmin. Read the configured T L S thumbprint, the host's certificates, the certificate-mapped logins and the endpoints. An empty thumbprint means sequel server picked a certificate itself. Save the reads by hand in the fixture's shape, and run the dependency list on them. Then delete the lab folder, or keep the saved reads inside your boundary as R ten's evidence.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test instance)"; workbook Chapter 08, "Lab 2: a test instance."`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.0, 3.3, 2.4, 3.45], ["What the output shows", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["The dependency list (Lab 1; Lab 2 step 6)", "SC-8 Transmission Confidentiality and Integrity; SC-12; SC-17", "KSI-SVC-SIN, KSI-SVC-ASM", "certificates.csv and the manifest, per instance"],
    ["R10's reads (Lab 2 steps 1 to 5)", "SC-8, SC-12, SC-17", "KSI-SVC-SIN, KSI-SVC-ASM", "The saved reads (certs.json) with the date and the reader"],
  ], { fontSize: 12.5, limit: 5.0 });
  line(s, "Ass", "The list supports these controls; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.3, 0.45, 13.5);
  sources(s, "Sources: Module 8, Unit 1 (the federal requirement); NIST SP 800-53; FedRAMP 20x KSIs; Chapter 08, \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. Chapter 08 of the workbook maps the dependency list and Runbook R ten's reads to S C eight, S C twelve and S C seventeen in NIST SP 800-53. The list supports S C eight, because the certificate that protects connections is known and dated; S C twelve, key and certificate lifecycle; and S C seventeen, which P K I issued each certificate. R ten notes that S C eight and its enhancement one are in the moderate baseline, and that every Microsoft Entra-authenticated connection to sequel server needs encryption. The I S S O keeps the certificates file and the manifest per instance, and the saved reads with the date and the reader. K S Is are FedRAMP twenty X indicators for cloud service providers; your providers report against them, the agency doesn't. The list supports these controls; the assessor decides whether each one is in place.`,
  `${M} — Unit 1 "Introduction" (the federal requirement); workbook Chapter 08, "Federal requirements and evidence."`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on certificates", [
    { q: "The certificate behind SQLPRD02's certificate-mapped login expires in 41 days. Why replace it?", options: ["a. Because of its issuer: signing doesn't check expiry, but it came from the enterprise CA that will be retired", "b. Because the login can't connect once the certificate expires", "c. Because type C logins must move to Entra logins before cutover"] },
    { q: "The run ends with \"Blocking an AD CS decommission: 4 of 5\". What does it count?", options: ["a. Certificates inside the 90-day window", "b. The rows an enterprise AD CS CA issued, each needing its action before that CA is retired", "c. Instances with no TLS certificate configured"] },
  ], "1 a: type C logins sign code and never connect. 2 b: four of the five came from the enterprise CA.");
  sources(s, "Sources: Module 8, Unit 6 \"Knowledge check,\" questions 2 and 4, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: the certificate behind SQL P R D oh two's certificate-mapped login expires in forty-one days. Why replace it? The answer is a: because of its issuer. Signing doesn't check expiry, but the certificate came from the enterprise C A that will be retired. Second: the run ends with blocking an A D C S decommission, four of five. What does it count? The answer is b: the rows an enterprise A D C S C A issued, each needing its action before that C A is retired. The module page has two more questions, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 2 and 4; "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: the list goes to the PKI owners first");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Listed the certificates SQL Server depends on, by class, issuer and expiry",
    "Read the action each class needs before its issuing CA is retired",
    "Widened the warning window for one run",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 9: Closure, drift and evidence", [
    "Or workbook Chapter 08, for Lab 2 and its checklist",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "The ISSO keeps: ",
    "certificates.csv and manifest.json per instance, with the step, its controls and KSIs, and each file's SHA-256; R10's saved reads (certs.json) with the date and the reader.");
  sources(s, "Sources: Module 8, Unit 7 \"Summary\"; workbook Chapter 08, \"Checklist.\"");
  notes(s,
`To sum up. You listed the certificates sequel server depends on, by class, issuer and expiry, and read the action each class needs before its issuing C A is retired. The list goes to the owners of P K I and Certificates before any C A date is set; the issuer decision stays theirs. The I S S O keeps the certificates file and the manifest per instance, and Runbook R ten's saved reads with the date and the reader. Before shipping, work through the Chapter 08 checklist. Next is Module 9: closure, drift and evidence.`,
  `${M} — Unit 7 "Summary"; workbook Chapter 08, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 8 deck", [
  "Module page: docs/training/data-platform/08-ad-cs-dependencies.md (Data Platform and SQL Server Identity learning path, Module 8): Introduction and its federal requirement, objectives, prerequisites, Units 2 and 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: Book 06, Data Platform: SQL Server Identity, Chapter 22 (TLS certificates, certificate-mapped logins, certificate-based sign-in, the sequencing dependency, certificates and the CLM platform); Book 07, PKI & Certificates, Chapter 04 (the issuer decision); Runbook R10, certificate discovery for AD CS (Steps 2 and 3). NIST SP 800-53 and 800-53B; FedRAMP 20x KSIs.",
  "Workbook Chapter 08, Building SQL Server Identity, AD CS Dependencies: \"What Microsoft gives you\" (Microsoft Learn's certificate requirements, sys.server_principals, sys.certificates, CREATE CERTIFICATE, Microsoft Cloud PKI), \"What it leaves to you,\" \"The code,\" Lab 1, Lab 2 (not run by the authors), \"Dangers,\" \"Federal requirements and evidence,\" \"Checklist.\" Kit: examples/sql-server-identity.",
  "Lab output: the module page's Lab 1 expected output on the kit's fictional fixtures; trimmed, wrapped and reflowed, with paths shortened to $Run, where the slides say so.",
]);

finish(OUT);
