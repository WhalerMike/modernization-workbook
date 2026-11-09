// HR-Driven Identity learning path, Module 5: Check certificate-based authentication — the module's narrated deck.
// Teaches docs/training/hr-driven-identity/05-certificate-based-authentication.md, Learn-style: objectives, the
// concepts, "Try it" slides with the real Lab 1 commands and output (run November 2, 2026 in a scratch copy of
// examples/hr-lifecycle), what differs by cloud, Lab 2, the federal requirement and evidence, a two-question check,
// and the summary. Every fact comes from the module page, the path's verification log, or the kit's code and
// fixtures (examples/hr-lifecycle: cba_check.py, config/cba-expected.json, tests/fixtures/ch05); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-hr-module-5/build.js \
//                      presentations/training-hr-module-5/Training_HR_Module_5.pptx
const TITLE = "Module 5: Check certificate-based authentication";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  HR-Driven Identity learning path, Module 5: Check certificate-based authentication",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and the title slide's unit list for the Microsoft Automation path; this deck is on the HR path.
D.pres.title = `HR-Driven Identity learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "HR-DRIVEN IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_HR_Module_5.pptx";
const M = "Training, HR-Driven Identity, Module 5";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 5: Check certificate-based authentication", "HR-Driven Identity learning path · Gate G5 Credentials, for GCC and GCC High",
    ["Credentials follow HR events  ·  CRL limits per cloud  ·  The measurement  ·  The check", "Try it: Lab 1  ·  Same CRL, two clouds  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 5 of the HR-Driven Identity learning path: check certificate-based authentication. This is Gate 5 of the implementation guide, credentials, and it goes with Chapter 05 of the developer workbook. A PIV card's revocation reaches sign-in only through the certificate revocation list. So in this module you'll measure every revocation list and check the tenant's certificate-based authentication settings against the limits for your cloud: the trust store, each list against the cloud's limit, the multifactor mapping, revocation list validation and the phishing-resistant strength. You'll run the check on a fictional tenant for GCC and then for GCC High, and see the findings change. The module takes about forty-five minutes with its lab.`,
  `${M} — "Introduction"; module header.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why revocation is the weak link in card sign-in");
  tag(s, "Why");
  const b = table(s, "Why", 1.45, [5.4, 6.75], ["What goes wrong", "What follows"], [
    ["An issuing CA has no CRL configured", "Entra doesn't check revocation for that CA's certificates"],
    ["A configured CRL can't be downloaded in time", "Certificate-based authentication fails for every card from that CA"],
    ["A CRL grows with every revocation", "A list that fits today can cross your cloud's limit next month"],
  ], { fontSize: 14, limit: 4.4 });
  callout(s, "Point", b + 0.35, 1.0, "FaIdCard", HEX.red, "This module: ",
    "measure each CRL and check the tenant's settings against your cloud's limits, every day rather than once.");
  sources(s, "Sources: Module 5, \"Introduction.\"");
  notes(s,
`Why does this gate need code? Because revocation is where card sign-in quietly breaks. If an issuing certificate authority in the trust store has no revocation list configured, Entra doesn't check revocation for that authority's certificates at all. A revoked card keeps working. If a list is configured but can't be downloaded in time, certificate-based authentication fails for every card from that authority. Nobody can sign in. And a revocation list grows with every revocation, so a list that fits today can cross your cloud's limit next month. None of those shows up in a one-time configuration review. So this module measures each list and checks the tenant's settings against your cloud's limits, every day rather than once.`,
  `${M} — "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 5", [
    "State the interactive CRL limits for GCC and GCC High, and the download time limit",
    "Measure a set of CRLs and record failures as findings",
    "Run the certificate-based authentication check for a named cloud and explain its findings",
    "Explain why the same CRL can be a warning in one cloud and not in another",
  ], [
    "Module 3: the Temporary Access Pass bridges to the card; this gate ends the bridge",
    "Some PKI terms: issuing CA, CRL, policy OID (Book 07, Chapter 06)",
    "Lab 1: Python 3.10+, pytest; no tenant",
  ], 45);
  sources(s, "Sources: Module 5, \"Learning objectives,\" \"Prerequisites\"; HR-Driven Identity path, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of the module. You'll state the interactive revocation list limits for GCC and GCC High, and the download time limit. You'll measure a set of lists and record the failures as findings. You'll run the certificate-based authentication check for a named cloud and explain what it finds. And you'll explain why the same list can be a warning in one cloud and not in another. Before you start, finish Module 3: there, the Temporary Access Pass bridges a new hire to the card, and this gate ends that bridge. Some familiarity with P K I terms helps, like issuing authority, revocation list and policy O I D; Chapter 06 of the Federal Modernization Workbook's PKI and Certificates book explains them for Entra. Lab 1 needs Python and pytest, and no tenant.`,
  `${M} — "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Credentials follow HR events
{
  const s = content(SC, "Credentials follow HR events");
  tag(s, "What");
  const l = panel(s, "Step5", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "UNIT 1  ·  THE GUIDE'S STEP 5", "Bind credentials to HR events", [
    "Its step 1 gives the CRL limits per cloud",
    "Its later steps tie issuance and revocation to HR and contractor events",
    "Book 03, Chapter 09: why revocation checking matters",
    "Book 03, Chapter 09: a reissue changes the PIV certificate's binding to the Entra user",
  ], 13.5);
  const r = panel(s, "NotHere", 7.85, 1.45, 4.9, null, HEX.amber, HEX.amberTint, "NOT THIS MODULE'S", "Per-user binding", [
    "Binding coverage and affinity per user",
    "They belong to the validation kit's VK-PIV-01",
    "And to the ADM implementation guide's Gate 6",
  ], 13.5);
  callout(s, "Reads", Math.max(l, r) + 0.3, 1.0, "FaShieldHalved", HEX.navy, "This check reads the tenant's settings: ",
    "the trust store's CAs, the X.509 method, the authentication strengths and Conditional Access, plus each CRL's measurement.");
  sources(s, "Sources: Module 5, Unit 1 \"Credentials follow HR events\"; examples/hr-lifecycle/python/cba_check.py (module docstring).");
  notes(s,
`Unit 1 starts in the guide's Step 5, bind credentials to HR events. Its first step gives the revocation list limits for each cloud, and its later steps tie card issuance and revocation to HR and contractor events. Chapter 09 of the HR-Driven Identity book explains why revocation checking matters, and that a reissued card changes the binding between the PIV certificate and the Entra user. Notice what this module doesn't cover. Binding coverage and affinity for each user belong to the validation kit's check, V K PIV oh one, and to Gate 6 of the attribute-driven migration guide. This module checks the tenant's settings: the certificate authorities in the trust store, the X dot five-oh-nine certificate method, the authentication strengths and the Conditional Access policies, plus a measurement of each revocation list.`,
  `${M} — Unit 1 "Credentials follow HR events"; examples/hr-lifecycle/python/cba_check.py.`);
}

// ================================================================== 5 Limits
{
  const s = content(SC, "The CRL limits the check holds each cloud to");
  tag(s, "What");
  const b = table(s, "Limits", 1.45, [3.6, 4.6, 3.95], ["Cloud (--cloud)", "Interactive sign-in CRL limit", "Download within"], [
    ["gcc: the commercial service, which GCC uses", "20,000,000 bytes (20 MB)", "10 seconds"],
    ["gcchigh: Azure Government", "45,000,000 bytes (45 MB)", "10 seconds"],
    ["dod", "45,000,000 bytes", "10 seconds"],
  ], { fontSize: 13.5, limit: 4.0 });
  const l = panel(s, "Read", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "HOW THE KIT READS THEM", null, [
    "Learn gives the limits in MB; the check reads decimal MB, 1 MB = 1,000,000 bytes, the stricter reading",
    "There is no default cloud: you name it",
  ], 13);
  panel(s, "Design", 6.85, b + 0.25, 5.9, null, HEX.amber, HEX.amberTint, "DESIGN GUIDANCE", null, [
    "Warn at 80 percent of the interactive limit",
    "Warn when a CA certificate expires within 90 days",
  ], 13);
  sources(s, "Sources: Module 5, Unit 1; Knowledge check, answer 2; examples/hr-lifecycle: config/cba-expected.json, README \"Commands.\"");
  notes(s,
`Here are the limits the check holds each cloud to. GCC uses the commercial service, so its interactive sign-in limit for a revocation list is twenty megabytes. GCC High is Azure Government, at forty-five megabytes, and the kit holds DoD to the same. In every cloud a list must download within ten seconds. Learn gives those limits in megabytes; the kit reads them as decimal megabytes, a million bytes each, which is the stricter reading. There's no default cloud in the kit: you name it every time, so a GCC High check can't silently run against GCC's numbers. Two thresholds are the program's design guidance, not Learn's: a warning at eighty percent of the interactive limit, and a warning when an authority's certificate expires within ninety days.`,
  `${M} — Unit 1; "Knowledge check," answer 2; examples/hr-lifecycle/config/cba-expected.json; README "Commands."`);
}

// ================================================================== 6 Measurement
{
  const s = content(SC, "The measurement: download each CRL once");
  tag(s, "How");
  const l = panel(s, "Measure", 0.6, 1.45, 6.6, null, HEX.navy, HEX.navyTint, "UNIT 2  ·  cba_check.py measure", "One row per CRL", [
    "Downloads each CRL once, and records bytes, seconds and any error, with the time of the measurement",
    "An unreachable CRL is recorded, not raised: the failure is the finding",
    "A local path is read as a file, which is how Lab 1 runs with no network",
  ], 13.5);
  const r = panel(s, "Why", 7.45, 1.45, 5.3, null, HEX.teal, HEX.tealTint, "WHERE TO MEASURE FROM", null, [
    "The list grows with every revocation: measure every day",
    "Lab 2 measures the real CRLs from outside the agency network",
  ], 13.5);
  callout(s, "NoMeas", Math.max(l, r) + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "No measurement, no pass: ",
    "a configured CRL with no measurement row is CB-06, a Finding. Run measure against every CRL.");
  sources(s, "Sources: Module 5, Unit 2, \"The measurement\"; Lab 1, step 2; Lab 2; examples/hr-lifecycle/python/cba_check.py.");
  notes(s,
`Unit 2 has two parts, the measurement and the check. The measurement downloads each revocation list once and records its size in bytes, the seconds it took and any error, with the time it was measured. An unreachable list isn't an exception that stops the run: it's recorded, because the failure is exactly the finding you want. For the lab, a local path is read as a file, which is how Lab 1 runs on a laptop with no network. In Lab 2 you measure the real lists from outside the agency network. And the check insists on the measurement. A configured list with no measurement row is C B six, a Finding, so you can't pass the check by skipping the download.`,
  `${M} — Unit 2 "The measurement and the check": "The measurement"; Lab 1, step 2; Lab 2; cba_check.py.`);
}

// ================================================================== 7 Check: trust store and CRLs
{
  const s = content(SC, "The check, part 1: the trust store and each CRL");
  tag(s, "What");
  const b = table(s, "Trust", 1.45, [1.25, 1.4, 9.5], ["Rule", "Severity", "Raised when"], [
    ["CB-12", "Finding", "An issuing CA the card program uses isn't in the trust store"],
    ["CB-01", "Finding", "A CA has no CRL configured, so Entra doesn't check revocation for it (a root CA with none: a Warn, to confirm)"],
    ["CB-02", "Warn", "The CRL endpoint isn't HTTP; Learn recommends HTTP"],
    ["CB-06", "Finding", "A configured CRL has no measurement"],
    ["CB-04", "Finding", "The CRL couldn't be downloaded, or took over 10 seconds"],
    ["CB-03", "Finding", "The CRL is over the cloud's interactive limit"],
    ["CB-05", "Warn", "The CRL is over 80 percent of that limit"],
    ["CB-11", "Warn", "A CA certificate expires within 90 days"],
  ], { fontSize: 13, limit: 6.55 });
  sources(s, "Sources: Module 5, Unit 2, \"The check\"; Knowledge check, answers 1, 3, 4; examples/hr-lifecycle: cba_check.py, config/cba-expected.json.");
  notes(s,
`The check runs thirteen rules, C B one to C B thirteen. Eight of them look at the trust store and the lists. C B twelve: an issuing authority the card program uses isn't in the trust store. C B one: an authority has no revocation list configured, so Entra doesn't check revocation for it. A root with no list is only a warning to confirm, since a root that issues only authority certificates may publish none. C B two: the list's endpoint isn't plain H T T P, which Learn recommends. C B six: no measurement. C B four: the list couldn't be downloaded, or took longer than ten seconds. C B three: the list is over the cloud's interactive limit. C B five warns at eighty percent of it. And C B eleven warns when an authority's certificate expires within ninety days.`,
  `${M} — Unit 2 "The measurement and the check": "The check"; "Knowledge check," answers 1, 3 and 4; cba_check.py.`);
}

// ================================================================== 8 Check: method and policy
{
  const s = content(SC, "The check, part 2: the method and the policy");
  tag(s, "What");
  const b = table(s, "Method", 1.45, [1.25, 1.4, 9.5], ["Rule", "Severity", "Raised when"], [
    ["CB-07", "Finding", "The X.509 certificate authentication method isn't enabled"],
    ["CB-08", "Warn", "CRL validation isn't required of every CA, or a CA is exempted from it"],
    ["CB-09", "Finding", "A PIV policy OID isn't mapped to multifactor, and the default mode is single-factor"],
    ["CB-13", "Warn", "Low-affinity username binding fields are configured (PrincipalName, RFC822Name)"],
    ["CB-10", "Finding", "No enabled policy for all users and all resources requires a phishing-resistant strength"],
  ], { fontSize: 13, limit: 4.6 });
  const l = panel(s, "Strong", 0.6, b + 0.25, 6.6, null, HEX.navy, HEX.navyTint, "PHISHING-RESISTANT, FOR CB-10", null, [
    "A strength counts only if every allowed combination is fido2, windowsHelloForBusiness or x509CertificateMultiFactor",
    "CB-10 is SCuBA MS.AAD.3.1v1",
  ], 13);
  panel(s, "Exempt", 7.45, b + 0.25, 5.3, null, HEX.amber, HEX.amberTint, "AN EXEMPTED CA", null, [
    "Allowed only while its CRL is fixed, with an end date",
    "CB-13 points to the affinity decision and VK-PIV-01",
  ], 13);
  sources(s, "Sources: Module 5, Unit 2, \"The check\"; examples/hr-lifecycle: cba_check.py, config/cba-expected.json.");
  notes(s,
`The other five rules look at the method and the policy. C B seven: the X dot five-oh-nine certificate method isn't enabled. C B eight warns when revocation list validation isn't required of every authority, or when an authority is exempted from it. An exemption is allowed only while that authority's list is being fixed, and with an end date. C B nine: a PIV policy O I D isn't mapped to multifactor, and the default mode is single-factor, so a card sign-in may not count as multifactor. C B thirteen warns about low-affinity username bindings. And C B ten is the SCuBA rule: no enabled Conditional Access policy for all users and all resources requires a phishing-resistant strength. A strength counts only if every combination it allows is FIDO2, Windows Hello for Business, or multifactor certificate.`,
  `${M} — Unit 2 "The measurement and the check": "The check"; cba_check.py; config/cba-expected.json.`);
}
endModule(SC);

// ================================================================== 9 Try it: list and measure
{
  const s = content(SL, "Try it: list the reads and measure the CRLs");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 1 and 2, in examples/hr-lifecycle (fictional PKI, no tenant)",
    "$ python python/graph_export.py --task cba-read --list",
    "Task cba-read: Policy.Read.All, Policy.Read.AuthenticationMethod, PublicKeyInfrastructure.Read.All",
    "  GET /directory/publicKeyInfrastructure/certificateBasedAuthConfigurations  [PublicKeyInfrastructure.Read.All]",
    "  GET /directory/publicKeyInfrastructure/.../{pkiId}/certificateAuthorities  [PublicKeyInfrastructure.Read.All]",
    "  GET /policies/authenticationMethodsPolicy/authenticationMethodConfigurations/x509Certificate  [Policy.Read.AuthenticationMethod]",
    "  GET /policies/authenticationStrengthPolicies  [Policy.Read.AuthenticationMethod]",
    "  GET /identity/conditionalAccess/policies  [Policy.Read.All]",
    "$ python python/cba_check.py measure --urls tests/fixtures/ch05/crl-urls.txt --out out/ch05/crl-measurements.csv",
    "         4,096 bytes    0.000 s  tests/fixtures/ch05/crl/piv-ca1.crl",
    "         8,192 bytes    0.000 s  tests/fixtures/ch05/crl/piv-ca2.crl",
    "             0 bytes    0.000 s  tests/fixtures/ch05/crl/missing.crl  FileNotFoundError",
    "Measured 3 CRL(s) -> out/ch05/crl-measurements.csv",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (ONE PATH SHORTENED WITH ...)", pt: 10.5 });
  line(s, "Read", "Three permissions for five GET calls. The missing file is recorded, not raised; your times may differ.", c + 0.25, 0.45, 14);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" steps 1 and 2; examples/hr-lifecycle: graph_export.py, config/calls.json, tests/fixtures/ch05.");
  notes(s,
`Try it. Lab 1 runs in the h r lifecycle examples folder, against a fictional P K I, with no tenant. Step one lists what the reader will call. The task asks for three permissions, Policy dot Read dot All, Policy dot Read dot Authentication Method, and Public Key Infrastructure dot Read dot All, for five calls, and every one of them is a GET. Nothing here can change the tenant. Step two measures the fixture revocation lists. Two files measure at four and eight kilobytes. The third doesn't exist, and the tool records it as zero bytes with a file-not-found error, rather than stopping. That row is what becomes a finding in the check. Your times may differ from the slide; the fixtures are local files, so they read almost instantly.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2.`);
}

// ================================================================== 10 Try it: check for GCC
{
  const s = content(SL, "Try it: check the fictional tenant for GCC");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 3 (the command wrapped across lines)",
    "$ python python/cba_check.py check --cloud gcc --exports tests/fixtures/ch05/exports \\",
    "    --crl tests/fixtures/ch05/crl-measurements.csv --expected config/cba-expected.json \\",
    "    --as-of 2026-11-01 --out out/ch05/check",
    "Cloud gcc: interactive CRL limit 20,000,000 bytes, download within 10 s",
    "CBA: 5 Finding, 7 Warn, 0 Info",
    "  CB-01 Finding: Contoso Example Legacy Intermediate: no CRL configured: Entra doesn't check revocation ...",
    "  CB-04 Finding: Contoso Example PIV Issuing CA 2 (renewed): CRL took 11.4 s to download; the limit is 10 s",
    "  CB-09 Finding: authentication mode: PIV policy OID(s) 2.16.840.1.101.3.2.1.48.11 not mapped to multifactor, ...",
    "  CB-10 Finding: Conditional Access: no enabled policy ... requires a phishing-resistant authentication strength ...",
    "  CB-12 Finding: Contoso Example PIV Issuing CA 2: issuing CA the card program uses isn't in the trust store",
    "  CB-05 Warn: Contoso Example PIV Issuing CA 2 (renewed): CRL is 18,500,000 bytes, over 80% of the gcc ...",
    "  ... six more Warns: CB-01 (root), CB-02, CB-08 (two), CB-11, CB-13",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (TRIMMED)", pt: 10.5 });
  line(s, "Exit", "Exit code 2. Four to find: CB-04 (11.4 seconds), CB-05 (18,500,000 bytes), CB-09 and CB-10.", c + 0.25, 0.45, 14);
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" step 3; examples/hr-lifecycle: cba_check.py, tests/fixtures/ch05/exports.");
  notes(s,
`Step three checks the fictional tenant for GCC. The first line names the limits it's using: twenty million bytes, and ten seconds. Then the count: five Findings, seven Warns, and exit code two. The lab asks you to find four of them. C B four: one authority's list took eleven point four seconds to download, over the ten-second limit, so in real life sign-in would fail for its cards. C B five: that same list is eighteen and a half million bytes, more than eighty percent of the GCC limit. C B nine: the PIV policy O I D isn't mapped to multifactor. And C B ten: no enabled policy requires a phishing-resistant strength. You'll also see a legacy intermediate with no list at all, and an issuing authority missing from the trust store.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," step 3.`);
}

// ================================================================== 11 Same CRL, two clouds
{
  const s = content(SL, "Try it: the same tenant, checked for GCC High");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 4 (the command wrapped across lines)",
    "$ python python/cba_check.py check --cloud gcchigh --exports tests/fixtures/ch05/exports \\",
    "    --crl tests/fixtures/ch05/crl-measurements.csv --expected config/cba-expected.json \\",
    "    --as-of 2026-11-01 --out out/ch05/check-gcchigh",
    "Cloud gcchigh: interactive CRL limit 45,000,000 bytes, download within 10 s",
    "CBA: 5 Finding, 6 Warn, 0 Info",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 2, 2026 (FIRST TWO LINES OF OUTPUT)", pt: 11 });
  const b = table(s, "Diff", c + 0.25, [4.0, 4.05, 4.1], ["The 18,500,000-byte CRL that took 11.4 s", "GCC (limit 20,000,000)", "GCC High (limit 45,000,000)"], [
    ["Size: CB-05 warns at 80 percent", "Warn: over 16,000,000", "No Warn: under 36,000,000"],
    ["Time: CB-04, 10 seconds in every cloud", "Finding", "Finding"],
  ], { fontSize: 13, limit: 6.55 });
  sources(s, "Sources: Module 5, \"Exercise: Lab 1,\" step 4; Knowledge check, answers 3 and 4; examples/hr-lifecycle/config/cba-expected.json.");
  notes(s,
`What differs by cloud? Step four runs the same check on the same tenant, naming GCC High instead. The limit line now says forty-five million bytes, and the count drops to five Findings and six Warns. One warning went away: C B five. The eighteen and a half million byte list was over eighty percent of GCC's twenty megabytes, but it's well under eighty percent of forty-five, so in GCC High it's fine. The download time is different. The ten-second limit applies in every cloud, so the eleven point four second download is still a Finding. That's the lesson of this step: the same list can be a warning in one cloud and not in another, which is why the check always takes the cloud by name.`,
  `${M} — "Exercise: Lab 1 (fixtures, no tenant)," step 4; "Knowledge check," answers 3 and 4.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: revoke a test card and watch Entra refuse it");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A test tenant with certificate-based authentication configured for a test CA, never production"],
    ["Permissions", "A reader app with a certificate, holding only the three application permissions from step 1, with admin consent"],
    ["Run", "Export the configuration; measure the real CRLs from outside the agency network; check with your test PKI's thumbprints and OIDs"],
    ["Prove", "Revoke a test certificate, and confirm Entra refuses it after the next CRL publication"],
    ["Back it out", "Remove the permissions; delete the reader app and its certificate; reissue the test user's certificate if needed; delete the export and output folders"],
  ], { fontSize: 12.5, limit: 5.4 });
  callout(s, "NotRun", b + 0.3, 0.9, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "Lab 2 follows the workbook's Chapter 05, Lab 2, written from Microsoft Learn's procedures.");
  sources(s, "Sources: Module 5, \"Exercise: Lab 2\"; HR-Driven Identity path, \"What you need for the labs\"; path verification log, claim 3.");
  notes(s,
`Lab 2 moves to your own test tenant, never production, with certificate-based authentication configured for a test certificate authority. You create a reader app with a certificate that holds only the three permissions you listed in step one, with admin consent. You export the configuration, measure the real revocation lists from outside the agency network, and run the check with your test P K I's thumbprints and policy O I Ds. Then the proof: revoke a test certificate, and confirm Entra refuses it after the next revocation list is published. To back it out, remove the permissions, delete the reader app and its certificate, reissue the test user's certificate if you need it, and delete the export and output folders. The authors haven't run Lab 2.`,
  `${M} — "Exercise: Lab 2 (your test tenant)"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence to keep");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.4, 8.75], ["Requirement", "What this gate meets"], [
    ["NIST SP 800-53", "IA-2(12) acceptance of PIV credentials; IA-5(2) public key-based authentication"],
    ["CISA SCuBA, under BOD 25-01", "MS.AAD.3.1v1 and MS.AAD.3.6v1: phishing-resistant MFA"],
    ["FIPS 201-3; NIST SP 800-63-4", "FIPS 201-3's issuance and termination rules; SP 800-63-4"],
  ], { fontSize: 13, limit: 3.6 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS FOR GATE 5", null, [
    "The cba-read export and the check's findings and manifest, dated; each CRL measurement",
    "The CB-09 and CB-10 rows beside the ScubaGear report",
    "Lab 2's refused sign-in, with the revocation record and the CRL that published it; the mode rules in the export",
  ], 13);
  sources(s, "Sources: Module 5, \"Introduction\" (the federal requirement); \"Summary\" (the evidence an ISSO keeps).");
  notes(s,
`The federal requirement. This gate supports two controls in NIST special publication eight hundred fifty-three: I A two, enhancement twelve, acceptance of PIV credentials, and I A five, enhancement two, public key-based authentication. It supports SCuBA's two phishing-resistant multifactor policies, three point one and three point six, which BOD 25-01 requires. And it supports FIPS two oh one dash three's issuance and termination rules, and special publication eight hundred sixty-three dash four. Your organization still sets the organization-defined parameters, and the assessor decides whether each is satisfied. The evidence an ISSO keeps for Gate 5: the configuration export and the check's findings and manifest, dated, with each list's measurement. The C B nine and C B ten rows, beside the ScubaGear report. Lab 2's refused sign-in, with the revocation record and the list that published it. And the mode rules in the export.`,
  `${M} — "Introduction" (the federal requirement); "Summary" (the evidence an ISSO keeps).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on card sign-in", [
    { q: "What happens when an issuing CA in the trust store has no CRL configured?", options: ["a. Entra downloads the CRL from the certificate's distribution point", "b. Entra doesn't check revocation for that CA's certificates", "c. Sign-in fails for that CA's certificates"] },
    { q: "An 18,500,000-byte CRL raises CB-05 for GCC but not for GCC High. Why?", options: ["a. GCC High doesn't check CRL size", "b. CB-05 warns at 80 percent of the cloud's interactive limit, and GCC High's is 45 MB", "c. GCC High caches CRLs"] },
  ], "1 b: without a configured CRL, Entra doesn't check revocation (CB-01). 2 b: the same size is under 80 percent of 45 MB.");
  sources(s, "Sources: Module 5, \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions from the module's knowledge check. First: what happens when an issuing certificate authority in the trust store has no revocation list configured? The answer is b. Entra doesn't check revocation for that authority's certificates, which is rule C B one. Second: an eighteen and a half million byte list raises C B five for GCC but not for GCC High. Why? The answer is b. C B five warns at eighty percent of the cloud's interactive limit, and GCC High's limit is forty-five megabytes, so the same size is under the line. The module page has two more questions, each linked to the section that teaches it.`,
  `${M} — "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 6, separation timing");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Learned the interactive CRL limits: 20 MB for GCC, 45 MB for GCC High, 10 seconds everywhere",
    "Measured three CRLs, and recorded the missing one as a finding",
    "Checked a fictional tenant for GCC, then for GCC High",
    "Saw how the cloud's limit changes the findings",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 6: Time separations from the logs", [
    "Separation-to-block and separation-to-revocation",
    "Card revocation reaches sign-in through the CRL",
  ], 13.5);
  callout(s, "Daily", Math.max(l, r) + 0.3, 0.9, "FaArrowsRotate", HEX.teal, "Keep it running: ",
    "measure and check every day rather than once; a CRL that fits today can cross the limit next month.");
  sources(s, "Sources: Module 5, \"Summary\" and \"Introduction\"; Module 6, \"Prerequisites.\"");
  notes(s,
`To sum up. You learned the interactive revocation list limits, twenty megabytes for GCC and forty-five for GCC High, with ten seconds to download in every cloud. You measured three lists, and the missing one became a recorded finding instead of a crash. You checked a fictional tenant for GCC and then for GCC High, and saw how the cloud's limit changes the findings while the download limit doesn't. Keep the measurement and the check running every day, because a list that fits today can cross the limit next month. Next is Module 6, time separations from the logs: separation-to-block and separation-to-revocation for every leaver. It builds on this module, because a card's revocation reaches sign-in through the revocation list.`,
  `${M} — "Summary"; "Introduction"; Module 6 — "Prerequisites."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: HR Module 5 deck", [
  "Module page: docs/training/hr-driven-identity/05-certificate-based-authentication.md (HR-Driven Identity learning path, Module 5): Introduction, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary.",
  "The units it assigns: the HR-driven identity implementation guide, Step 5; Book 03, Chapter 09 (revocation checking; binding the PIV certificate); Book 07, Chapter 06; the developer workbook Building HR-Driven Identity, Chapter 05 (Why this gate needs code; The measurement; The check; Lab 1; Lab 2; Federal requirements and evidence).",
  "Path: docs/training/hr-driven-identity/index.md (What you need for the labs) and its verification log, _verification/learning-path.md (Lab 1 re-run November 1, 2026; Lab 2 not run).",
  "Kit: examples/hr-lifecycle (README; python/cba_check.py; python/graph_export.py; config/cba-expected.json; config/calls.json; tests/fixtures/ch05). Its CA names, thumbprints and OIDs are fictional.",
  "Lab output: run November 2, 2026 in a scratch copy of examples/hr-lifecycle with Python 3.14.3 (57 tests passed); the Try it output is trimmed where the slide says so. Lab 2 not run by the authors. Design guidance is labeled.",
]);

finish(OUT);
