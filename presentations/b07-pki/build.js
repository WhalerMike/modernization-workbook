// Book 07 — PKI & Certificates: the 15-minute Why / What / Who / How deck.
// Build:  node presentations/b07-pki/build.js presentations/b07-pki/B07_PKI.pptx
// Every fact comes from a footnoted chapter of docs/books/b07-pki/, named in the notes.
const D = require("../_build/lib.js")({ book: "Book 07", title: "PKI & Certificates" });
const { HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B07_PKI.pptx";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide("Why certificates", "Why Do Certificates Outlive Every Migration?", "Book 07 — PKI & Certificates");
  D.agenda(s, 0.8, 4.7, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing on the book's argument and plan", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.6, w: 8, h: 0.8, fontSize: 16 });
  s.addNotes(
`[0:00–0:33]  This briefing comes from Book 07 of the Federal Modernization Workbook, PKI and Certificates: the move from Active Directory Certificate Services to Microsoft Cloud PKI, Entra certificate-based authentication and the Federal PKI.

Every other migration changes which system answers the question "who is this?" Certificates are how that answer gets proved. I'll cover why certificates outlive every migration, what the target PKI is, who owns the certificate estate, and how to move it without stranding a single certificate.

Workbook: Book 07, index.`);
}

// ------------------------------------------------------------------ Why 1
{
  const s = D.content("Why certificates", "Certificates fail at expiry, not at cutover");
  tag(s, "Why");
  const deps = [["Domain controllers", "KDC certificates and LDAPS"], ["Smart card and PIV", "NTAuth trust and DC certificates"],
    ["802.1X and VPN", "NPS and device certificates"], ["TLS listeners", "Web, API and SQL Server"], ["Signing and encryption", "Code signing, S/MIME, EFS keys"]];
  txt(s, "Deps head", "WHAT LEANS ON THE INTERNAL PKI", { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  deps.forEach((d, i) => {
    const y = 1.92 + i * 0.66;
    box(s, `Dep ${i}`, 0.6, y, 6.2, 0.56, i % 2 ? HEX.navyTint : HEX.grey);
    txt(s, `Dep ${i} text`, [{ text: `${d[0]}   `, options: { bold: true, color: HEX.navy } }, { text: d[1] }],
      { x: 0.8, y, w: 5.9, h: 0.56, fontSize: 14.5, valign: "middle" });
  });
  box(s, "Clocks box", 7.1, 1.55, 5.65, 3.65, HEX.amberTint);
  icon(s, "FaUserClock", 7.35, 1.75, 0.72, HEX.amber);
  txt(s, "Clocks head", [
    { text: "A SIGNED CLAIM ALREADY HANDED OUT", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Two clocks, one estate", options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria" } },
  ], { x: 8.25, y: 1.72, w: 4.4, h: 0.9, valign: "middle" });
  txt(s, "Clocks text", [
    { text: "The directory's clock: ", options: { bold: true, color: HEX.red } },
    { text: "cutover is declared complete, issued certificates keep working, and the first expiry wave finds no issuer.", options: { breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "The certificate's clock: ", options: { bold: true, color: HEX.teal } },
    { text: "the replacement issuer is live before the first expiry, renewals move use case by use case, and AD CS retires last." },
  ], { x: 7.35, y: 2.8, w: 5.25, h: 2.3, fontSize: 14.5 });
  callout(s, "Twice over", 5.45, 1.05, "FaTriangleExclamation", HEX.red, "It outlives the directory twice over: ",
    "issued certificates run until they expire, and the forest needs an issuer until its last domain controller retires.");
  sources(s, "Sources: Microsoft Learn — AD CS overview, LDAPS and smart card logon certificates, NPS certificates, Enterprise PKI. Book 07, Chapter 01.");
  s.addNotes(
`[0:33–1:50]  Why do certificates outlive every migration? Because a certificate isn't a record in a directory. It's a signed statement that's already been handed out: the holder of this private key is entitled to this name. When the directory moves, the certificate doesn't. It keeps working until it expires, and then whatever relied on it stops.

A great deal relies on it. Domain controllers need KDC certificates and LDAPS. Smart card and PIV logon need the issuing CA in the forest's NTAuth store and a certificate on every domain controller. 802.1X and VPN need NPS and device certificates. TLS listeners, including SQL Server, need them, and so do code signing and encryption keys.

That gives the program two clocks. On the directory's clock, cutover is declared complete and the first expiry wave finds no issuer, months later, far from its cause. On the certificate's clock, the replacement issuer is live before the first expiry, and AD CS retires last.

So the estate outlives the directory twice over: issued certificates run until they expire, and the forest needs an issuer until its last domain controller retires.

Workbook: Book 07, Chapter 01 — Why Certificates Outlive Every Migration.`);
}

// ------------------------------------------------------------------ Why 2
{
  const s = D.content("Why certificates", "The rules are moving under certificates already issued");
  tag(s, "Why");
  const rows = [["Before March 15, 2026", "398 days", "about 4"], ["March 15, 2026 (today)", "200 days", "about 7"],
    ["March 15, 2027", "100 days", "about 15"], ["March 15, 2029", "47 days", "about 31"]];
  s.addTable([head(["Public TLS issued from", "Max validity", "Per day, 1,000 certs"]),
    ...rows.map((r, i) => [{ text: r[0], options: { bold: true } }, { text: r[1], options: { bold: true, color: i < 2 ? HEX.navy : HEX.red } }, { text: r[2] }])],
    tableOpts([2.75, 1.75, 2.5], { y: 1.55, fontSize: 14, rowH: [0.45, 0.5, 0.5, 0.5, 0.5] }));
  txt(s, "Table note", "CA/Browser Forum Ballot SC-081v3 (April 2025). Daily renewals assume 250 working days and are program arithmetic; domain-validation reuse also falls to 10 days.",
    { x: 0.6, y: 4.1, w: 7.0, h: 0.75, fontSize: 12, italic: true, color: HEX.slate });
  const sides = [
    ["FaKey", "Mapping rules changed", "KB5014754: domain controllers in Full Enforcement since February 11, 2025, with no way back to compatibility mode after September 9, 2025.", HEX.amber, HEX.amberTint],
    ["FaLock", "Algorithms have a horizon", "NIST's draft IR 8547: RSA-2048 deprecated after 2030, all RSA and ECDSA signatures disallowed after 2035.", HEX.red, HEX.redTint],
  ];
  sides.forEach((r, i) => {
    const y = 1.55 + i * 1.72;
    box(s, `Side ${i}`, 7.85, y, 4.9, 1.58, r[4]);
    icon(s, r[0], 8.05, y + 0.2, 0.6, r[3]);
    txt(s, `Side ${i} text`, [{ text: r[1], options: { bold: true, color: r[3], fontSize: 16.5, fontFace: "Cambria", breakLine: true } }, { text: r[2], options: { fontSize: 13.5 } }],
      { x: 8.8, y: y + 0.12, w: 3.8, h: 1.38 });
  });
  callout(s, "Own program", 5.3, 1.2, "FaRoute", HEX.navy, "So the PKI is its own program: ",
    "manual lifecycle management can't keep up. The replacement is discovery, ownership, automated issuance and renewal, and evidence, run apart from the directory move.");
  sources(s, "Sources: CA/Browser Forum SC-081v3 and Baseline Requirements 2.3.1; Microsoft Support KB5014754; NIST IR 8547 (draft). Book 07, Chapter 01.");
  s.addNotes(
`[1:50–2:59]  A certificate estate used to be something you could leave alone between renewals. Three changes have ended that.

First, public TLS lifetimes are shrinking on a fixed schedule. Under the CA/Browser Forum's ballot SC-081v3, adopted in April 2025, the maximum validity fell from 398 days to 200 days on March 15, 2026. It drops to 100 days on March 15, 2027, and to 47 days on March 15, 2029. On the book's arithmetic, a thousand certificates means about seven renewals every working day now, and about thirty-one at 47 days.

Second, mapping rules changed under certificates already in use. Under KB5014754, domain controllers moved to Full Enforcement on February 11, 2025, with no way back after the September 9, 2025 update.

Third, the algorithms have a horizon. NIST's draft transition plan would deprecate RSA-2048 after 2030 and disallow RSA and ECDSA signatures after 2035.

So manual lifecycle management can't keep up, and the move off AD CS runs as its own program.

Workbook: Book 07, Chapter 01 — Why Certificates Outlive Every Migration.`);
}

// ------------------------------------------------------------------ What 1
{
  const s = D.content("What the target is", "What AD CS holds up, and the four verdicts");
  tag(s, "What");
  const v = [
    ["MIGRATE", "A cloud path replaces it: Cloud PKI through Intune, or Entra CBA", HEX.teal, HEX.tealTint],
    ["BRIDGE", "Both issuers run: DCs, LDAPS, NPS, and server TLS until its issuer is named", HEX.amber, HEX.amberTint],
    ["RETAIN", "No cloud equivalent: HSM code signing, network gear on SCEP", HEX.red, HEX.redTint],
    ["RETIRE", "The consumer is going away: let it expire, keep decryption keys", HEX.slate, HEX.grey],
  ];
  txt(s, "Verdict head", "EVERY TEMPLATE AND USE CASE GETS ONE VERDICT", { x: 0.6, y: 1.55, w: 8, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  v.forEach((w, i) => {
    const x = 0.6 + i * 3.06;
    box(s, `Verdict ${i}`, x, 1.95, 2.9, 1.65, w[3]);
    txt(s, `Verdict ${i} text`, [{ text: w[0], options: { bold: true, fontSize: 19, fontFace: "Cambria", color: w[2], breakLine: true } }, { text: w[1], options: { fontSize: 14 } }],
      { x: x + 0.2, y: 2.08, w: 2.5, h: 1.45 });
  });
  txt(s, "Facts", bullets([
    "An enterprise CA lives in the forest: templates, Enrollment Services and NTAuth sit in Public Key Services",
    "Inventory four layers — CA, template, issued certificate, relying party; the relying parties set the order of work",
    "Corrected: internal web and SQL Server TLS can't move to Cloud PKI; S/MIME stays BRIDGE for its key history",
  ], 14.5), { x: 0.6, y: 3.8, w: 12.15, h: 1.5, paraSpaceAfter: 5 });
  callout(s, "Order", 5.45, 1.05, "FaFilter", HEX.navy, "Ask in order: ",
    "is the consumer retiring? Is there an Intune or Entra path? Does it depend on AD itself? Whatever's left is RETAIN, with a named owner and a review date.");
  sources(s, "Sources: Microsoft Learn — certification authority role, Enterprise PKI, certificate templates, Cloud PKI overview, Intune S/MIME. Book 07, Chapter 02.");
  s.addNotes(
`[2:59–4:14]  What does AD CS hold up today? It isn't one server. It's a hierarchy, usually an offline root and enterprise issuing CAs; a set of forest-wide objects in the Public Key Services container, including the templates and the NTAuth store; and Group Policy autoenrollment, which runs on domain members every eight hours.

The inventory has four layers: the CAs, the templates, the certificates actually issued, and the relying parties. The relying parties set the order of work, because a new issuer is useful only once everything that validates its certificates trusts it.

Then every template and use case gets one of four verdicts. MIGRATE, where Cloud PKI or Entra certificate-based authentication replaces it. BRIDGE, where both issuers run because the consumer depends on AD or a server: domain controllers, LDAPS, NPS. RETAIN, where there's no cloud equivalent, like HSM-held code signing. And RETIRE, where the consumer is going away.

The book corrects its source here: internal web and SQL Server TLS can't move to Cloud PKI, and S/MIME stays BRIDGE because its key history has to survive.

Workbook: Book 07, Chapter 02 — What AD CS Holds Up.`);
}

// ------------------------------------------------------------------ What 2
{
  const s = D.content("What the target is", "Harden what stays before anything moves");
  tag(s, "What");
  const rows = [
    ["ESC1", "Requester-supplied subject on an authentication template", "Defender for Identity (preview)", "Critical"],
    ["ESC2", "Any Purpose or no EKU, broadly enrollable", "Defender for Identity", "Critical"],
    ["ESC3", "Enrollment agent template broadly enrollable", "Defender for Identity", "High"],
    ["ESC4", "Writable template ACL or unprivileged owner", "Defender for Identity; event 5136", "High"],
    ["ESC5", "Writable Public Key Services objects", "Manual review; event 5136", "High"],
    ["ESC6", "The CA's EDITF_ATTRIBUTESUBJECTALTNAME2 flag is on", "CA sensor (preview); edit flags", "Critical"],
    ["ESC7", "Unprivileged Manage CA or Issue and Manage Certificates", "CA sensor; events 4882, 4890", "High"],
    ["ESC8", "HTTP enrollment without HTTPS and Extended Protection", "CA sensor; IIS settings", "Critical"],
  ];
  s.addTable([head(["Class", "Misconfiguration to find and fix", "Detect with", "Program rating"]),
    ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] },
      { text: r[3], options: { bold: true, color: r[3] === "Critical" ? HEX.red : HEX.amber } }])],
    tableOpts([0.95, 5.5, 4.0, 1.7], { y: 1.5, fontSize: 12.5, rowH: [0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38] }));
  callout(s, "Gate", 5.15, 1.35, "FaShieldHalved", HEX.red, "The migration gate: ",
    "every Critical and High finding is fixed and verified before any workload migrates, because under BYOCA the cloud issuer inherits the hierarchy. Turn on CA auditing first: the CA audit filter and Audit Certification Services, both.");
  sources(s, "Sources: Microsoft Learn — Defender for Identity certificate assessments, secure and audit CA administration; KB5005413. Book 07, Chapter 03.");
  s.addNotes(
`[4:14–5:29]  AD CS keeps issuing trusted credentials while the migration runs, so the CA you're leaving has to be the best-defended system you own until it's gone. The book frames hardening strictly as a detect-and-fix checklist.

The eight classes carry the ESC labels that Microsoft Defender for Identity also uses: requester-supplied subjects on authentication templates; Any Purpose or no-EKU templates; open enrollment agent templates; writable template permissions; writable Public Key Services objects such as NTAuth; the CA-wide flag that lets any request supply a subject alternative name; unprivileged CA permissions; and web enrollment without HTTPS and Extended Protection.

Defender for Identity detects most of them, and the CA-level checks need its sensor on the CA. The fifth class has no assessment, so it's a manual review backed by directory-change event 5136. The ratings are the program's own scoring.

The gate is simple: every Critical and High finding is fixed and verified before any workload migrates, because the recommended cloud issuer chains to this hierarchy. And none of it has evidence until CA auditing is on, which takes two settings together.

Workbook: Book 07, Chapter 03 — Hardening What Stays.`);
}

// ------------------------------------------------------------------ What 3
{
  const s = D.content("What the target is", "Four issuers, each for what only it can serve");
  tag(s, "What");
  const iss = [
    ["FaCloud", "Cloud PKI", HEX.teal, HEX.tealTint, ["Intune-managed devices only", "SCEP only; three CAs per tenant", "CRL valid seven days; no OCSP"]],
    ["FaServer", "Retained AD CS", HEX.navy, HEX.navyTint, ["Domain controllers and LDAPS", "NPS, RADIUS and server TLS", "NDES devices; HSM code signing"]],
    ["FaIdCard", "Federal PKI", HEX.amber, HEX.amberTint, ["PIV, through the card management system", "Distribute the federal root", "Upload the chain to Entra ID"]],
    ["FaGlobe", "Public CA", HEX.red, HEX.redTint, ["Names the internet must trust", "On the shrinking public schedule", "Renewed through the CLM platform"]],
  ];
  iss.forEach((c, i) => {
    const x = 0.6 + i * 3.06;
    box(s, `Issuer ${i}`, x, 1.55, 2.9, 2.75, c[3]);
    icon(s, c[0], x + 0.2, 1.7, 0.6, c[2]);
    txt(s, `Issuer ${i} head`, c[1], { x: x + 0.9, y: 1.7, w: 1.9, h: 0.6, bold: true, color: c[2], fontSize: 16, fontFace: "Cambria", valign: "middle" });
    txt(s, `Issuer ${i} text`, bullets(c[4], 13.5), { x: x + 0.2, y: 2.45, w: 2.55, h: 1.8, paraSpaceAfter: 5 });
  });
  callout(s, "Root", 4.5, 1.15, "FaSitemap", HEX.navy, "One root decision: ",
    "for an established AD CS hierarchy, BYOCA — a Cloud PKI issuing CA signed by the offline root at a key ceremony. It keeps the chain every relying party already trusts, and makes the root's CRL a production dependency.");
  txt(s, "Licensing", [
    { text: "Entitlement: ", options: { bold: true, color: HEX.amber } },
    { text: "Cloud PKI needs a subscription on top of Intune Plan 1 or 2. From July 2026, E5 and E7 include it for commercial customers; government plans are to follow, so confirm it. GCC High since the week of September 28, 2026; not DoD." },
  ], { x: 0.6, y: 5.8, w: 12.15, h: 0.75, fontSize: 13.5 });
  sources(s, "Sources: Microsoft Learn — Cloud PKI overview, fundamentals, deployment models and BYOCA; GSA Federal PKI 101; FIPS 201-3. Book 07, Chapter 04.");
  s.addNotes(
`[5:29–6:49]  So what is the target? Not Cloud PKI instead of AD CS. That's true for devices and wrong for the estate. The target is four issuers, each for the subjects only it can serve.

Microsoft Cloud PKI issues to Intune-managed devices, and only to them, through SCEP, with three CAs per tenant, a CRL valid for seven days and no OCSP responder. A smaller, hardened AD CS stays for domain controllers and LDAPS, NPS and RADIUS, internal server TLS, network devices through NDES, and HSM-held code signing. The Federal PKI keeps issuing PIV; the target's job is to trust it, by distributing the federal root and uploading the chain to Entra ID. And a public CA serves names the internet must trust.

One decision ties them together: the root. For an established hierarchy, the program recommends bring-your-own-CA, a Cloud PKI issuing CA signed by the offline root. It keeps the existing chain, and makes the root's CRL a production dependency.

Check the entitlement too. The July 2026 change that puts Cloud PKI in Microsoft 365 E5 and E7 covers commercial customers, so confirm it for a government tenant.

Workbook: Book 07, Chapter 04 — The Target PKI: Cloud PKI, AD CS and Federal PKI.`);
}

// ------------------------------------------------------------------ What 4
{
  const s = D.content("What the target is", "One lifecycle platform: CyberArk Certificate Manager");
  tag(s, "What");
  const rows = [
    ["Cloud PKI", "Intune issues, renews and revokes; the CLM platform reads it for reporting"],
    ["Retained AD CS", "The CLM platform requests, renews and tracks server certificates"],
    ["Public CAs", "The CLM platform, with ACME where the endpoint supports it"],
    ["Federal PKI (PIV)", "The card management system and the credentialing office"],
  ];
  s.addTable([head(["Issuer", "Who manages the lifecycle"]), ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }])],
    tableOpts([2.3, 5.0], { y: 1.55, fontSize: 14, rowH: [0.45, 0.66, 0.66, 0.66, 0.66] }));
  box(s, "Vendor box", 8.15, 1.55, 4.6, 3.55, HEX.navyTint);
  icon(s, "FaArrowsRotate", 8.4, 1.75, 0.62, HEX.navy);
  txt(s, "Vendor head", "The product today", { x: 9.2, y: 1.75, w: 3.4, h: 0.62, bold: true, color: HEX.navy, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  txt(s, "Vendor list", bullets([
    "Venafi joined CyberArk on October 1, 2024",
    "Palo Alto Networks completed its CyberArk acquisition on February 11, 2026",
    "SaaS edition now sold as Next-Generation Trust Security",
    "No FedRAMP listing for it: deploy Certificate Manager, Self-Hosted in the boundary",
  ], 13.5), { x: 8.4, y: 2.5, w: 4.15, h: 2.5, paraSpaceAfter: 5 });
  callout(s, "Consolidate", 5.3, 1.2, "FaUserShield", HEX.teal, "Consolidate, don't add: ",
    "the program already has a CyberArk relationship, so lifecycle lands on one platform, with no second CLM vendor. Its CA account holds Issue and Manage Certificates, so scope and review it as a certificate manager.");
  sources(s, "Sources: CyberArk Certificate Manager Self-Hosted docs; Palo Alto Networks; Thoma Bravo; FedRAMP Marketplace dataset. Book 07, Chapters 01 and 04.");
  s.addNotes(
`[6:49–7:55]  Four issuers need one lifecycle platform. Intune and Cloud PKI renew what they put on managed devices. Nothing Microsoft-native does that for AD CS server certificates, public TLS, appliances, or certificates nobody inventoried. That's the job of certificate lifecycle management: discovery, ownership and automated renewal across issuers.

The program's platform is CyberArk Certificate Manager, now part of Palo Alto Networks. It's the program's existing vendor, so the program consolidates there and adds no second lifecycle vendor. The names have moved: Venafi became part of CyberArk in October 2024, Palo Alto Networks completed its acquisition of CyberArk on February 11, 2026, and the SaaS edition is now sold as Next-Generation Trust Security.

Two facts shape the deployment. The FedRAMP Marketplace has no listing for the certificate product, so the program runs Certificate Manager, Self-Hosted inside its own authorization boundary. And its AD CS account holds the certificate-manager permission, so it's scoped and reviewed like any other certificate manager.

Workbook: Book 07, Chapter 04 — The Target PKI: Cloud PKI, AD CS and Federal PKI; Chapter 01 — Why Certificates Outlive Every Migration.`);
}

// ------------------------------------------------------------------ Who
{
  const s = D.content("Who owns it", "Who decides, who does the work for certificates");
  tag(s, "Who");
  const cols = [
    ["FaBuildingColumns", "Decide", HEX.navy, HEX.navyTint, [["Sponsor and CIO", "Target hierarchy, AD CS retirement, renewal owners"], ["CISO and ISSO", "Issuance policy, trust anchors, binding strength"], ["Authorizing official", "Standing exceptions, low-affinity bindings"]]],
    ["FaUsersGear", "Do", HEX.teal, HEX.tealTint, [["PKI and CA administrators", "CAs, templates, CRLs, key ceremonies"], ["Identity and endpoint teams", "Entra trust store and bindings; Intune profiles"], ["CLM platform owner", "Discovery; server and public TLS renewal"]]],
    ["FaPeopleArrows", "Consulted", HEX.amber, HEX.amberTint, [["Server, network and app owners", "Server TLS, RADIUS, code signing"], ["PIV and credentialing office", "Every CBA binding for PIV"], ["Security operations", "Audit events, posture findings, drift"]]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Who col ${i + 1}`, x, 1.55, 3.95, 3.55, c[3]);
    icon(s, c[0], x + 0.22, 1.72, 0.62, c[2]);
    txt(s, `Who head ${i + 1}`, c[1], { x: x + 1.0, y: 1.72, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Who text ${i + 1}`, c[4].flatMap((r, k) => [{ text: r[0], options: { bold: true, color: c[2], breakLine: true } }, { text: r[1], options: { breakLine: k < c[4].length - 1 } }]),
      { x: x + 0.25, y: 2.5, w: 3.5, h: 2.5, fontSize: 14, paraSpaceAfter: 6 });
  });
  callout(s, "Separate", 5.3, 1.2, "FaScaleBalanced", HEX.red, "Separation of duties: ",
    "whoever can change a CA never alone decides what it issues. CA administrator, certificate manager, enrollment agent, auditor and backup custodian are separate named groups, and one renewal owner answers for each certificate class.");
  sources(s, "Sources: Microsoft Learn — secure, delegate and audit CA administration; certificateUserIds roles; NIST SP 800-37 Rev. 2, SP 800-53 SC-17. Book 07, Chapter 05.");
  s.addNotes(
`[7:55–9:05]  Who owns the certificate estate? In most forests, whoever installed the CA. Domain Admins and Enterprise Admins are CA administrators by default, and nobody decided that.

The book separates deciding from doing. The sponsor and CIO decide the target hierarchy, when each AD CS component retires, and who owns renewal for each certificate class. The CISO and ISSO decide issuance policy, trust anchors and the minimum binding strength. The authorizing official accepts standing exceptions, such as a low-affinity binding.

PKI and CA administrators run the CAs, templates, CRLs and key ceremonies. The identity team owns the Entra trust store and bindings, endpoint engineering owns the Intune profiles, and the CLM platform owner runs discovery and server renewal. Server, network and application owners, the PIV office and security operations are consulted.

The principle is separation of duties. Whoever can change a CA must never be the only person who decides what it issues. And whoever administers directory sync can change which account a certificate signs in as.

Workbook: Book 07, Chapter 05 — Who Owns the Certificate Estate.`);
}

// ------------------------------------------------------------------ How 1
{
  const s = D.content("How to do it", "Intune delivers the certificate, strongly mapped");
  tag(s, "How");
  const paths = [
    ["FaCloud", "SCEP from Cloud PKI", "Key made on the device; no NDES, connector or on-premises CA", HEX.teal],
    ["FaServer", "SCEP from AD CS", "Through NDES and the Certificate Connector; template Enroll limited to NDES", HEX.navy],
    ["FaKey", "PKCS from AD CS", "Key made on the connector server and exported, so SCEP is preferred", HEX.amber],
  ];
  paths.forEach((r, i) => {
    const y = 1.6 + i * 1.12;
    icon(s, r[0], 0.6, y + 0.05, 0.62, r[3]);
    txt(s, `Path ${i}`, [{ text: r[1], options: { bold: true, color: r[3], fontSize: 16.5, breakLine: true } }, { text: r[2], options: { fontSize: 14 } }], { x: 1.4, y, w: 5.6, h: 1.02 });
  });
  const rows = [["May 10, 2022", "Compatibility mode; weak mappings warned"], ["April 11, 2023", "The Disabled setting is ignored"],
    ["February 11, 2025", "Full Enforcement by default"], ["September 9, 2025", "Registry key ignored; no way back"]];
  s.addTable([head(["KB5014754", "Strong-mapping step"]), ...rows.map((r, i) => [{ text: r[0], options: { bold: true, color: i > 1 ? HEX.red : HEX.amber } }, { text: r[1] }])],
    tableOpts([2.2, 3.35], { x: 7.2, y: 1.6, fontSize: 14, rowH: [0.42, 0.6, 0.6, 0.6, 0.6] }));
  callout(s, "Profiles", 5.3, 1.25, "FaClipboardCheck", HEX.amber, "What profiles need: ",
    "the {{OnPremisesSecurityIdentifier}} SAN URI on SCEP profiles — user certificates on every platform, device certificates on hybrid-joined Windows. Pilot in a new profile: editing one revokes what it issued.");
  sources(s, "Sources: Microsoft Learn — Cloud PKI, SCEP infrastructure and profiles, PKCS profiles, removing profiles; Microsoft Support KB5014754. Book 07, Chapter 06.");
  s.addNotes(
`[9:05–10:21]  How. Start with devices. Intune delivers certificates by three paths, and each needs the trusted certificate profile deployed first.

SCEP from Cloud PKI is the cleanest: the device makes its own key pair, with no NDES server, connector or on-premises CA. SCEP from AD CS runs through NDES and the Certificate Connector; its template lets the request supply the subject, so its Enroll permission stays limited to the NDES account. PKCS makes the key on the connector server and exports it, which is why the program prefers SCEP.

Strong mapping is no longer optional. KB5014754 began in compatibility mode in May 2022. Domain controllers moved to Full Enforcement on February 11, 2025, and since the September 9, 2025 update the registry key is ignored, so there's no way back. A certificate used against a domain controller without a strong mapping is rejected now.

So SCEP profiles add the on-premises security identifier as a SAN URI, for user certificates on every platform and device certificates on hybrid-joined Windows. Pilot it in a new profile, because editing one revokes what it issued.

Workbook: Book 07, Chapter 06 — Device and User Certificates: Intune and Entra CBA.`);
}

// ------------------------------------------------------------------ How 2
{
  const s = D.content("How to do it", "Entra CBA validates certificates; it issues none");
  tag(s, "How");
  const cols = [
    ["FaShieldHalved", "Trust and revocation", HEX.navy, HEX.navyTint, ["Upload every CA in the chain to the PKI-based trust store", "One HTTP CRL per CA, downloaded within 10 seconds or sign-in fails", "No OCSP and no LDAP; 20 MB CRL limit in commercial and GCC", "Require CRL validation: without a CRL, revoked certificates still work"]],
    ["FaFingerprint", "Binding and factors", HEX.teal, HEX.tealTint, ["High affinity: IssuerAndSerialNumber, SKI, SHA1PublicKey", "Low affinity: PrincipalName, RFC822Name, Subject, and Issuer + Subject", "Multifactor only with a PIN or biometric: a PIV card, not a software certificate", "Staged rollout is temporary: 10 groups, 200 users per new group"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 6.12;
    box(s, `Col ${i}`, x, 1.55, 6.0, 3.6, c[3]);
    icon(s, c[0], x + 0.25, 1.72, 0.62, c[2]);
    txt(s, `Col ${i} head`, c[1], { x: x + 1.05, y: 1.72, w: 4.7, h: 0.62, bold: true, color: c[2], fontSize: 19, fontFace: "Cambria", valign: "middle" });
    txt(s, `Col ${i} text`, bullets(c[4], 14), { x: x + 0.25, y: 2.5, w: 5.5, h: 2.6, paraSpaceAfter: 7 });
  });
  callout(s, "Affinity", 5.4, 1.1, "FaLock", HEX.red, "Production requires high affinity: ",
    "CBA is only as strong as its lowest-affinity binding. Switch the tenant to high only once every user's certificateUserIds is correct, or those users are locked out.");
  sources(s, "Sources: Microsoft Learn — Entra CBA technical concepts, CRL, set up CBA, staged rollout. Book 07, Chapter 06.");
  s.addNotes(
`[10:21–11:38]  On the user side, Entra certificate-based authentication is a relying party. It validates certificates and issues none, so its risk is the opposite: a certificate that should fail might pass.

Trust and revocation first. Upload every CA in the chain to the PKI-based trust store. Each CA gets one HTTP CRL, which Entra ID must download within ten seconds or the sign-in fails. There's no OCSP and no LDAP. Turn on Require CRL validation, because a CA uploaded without a CRL lets revoked certificates keep working.

Then binding. Issuer and serial number, subject key identifier and public-key hash are high affinity. Principal name, email, subject, and issuer plus subject are low; the old guide called issuer plus subject high. A certificate counts as multifactor only when a PIN or biometric protects it: a PIV card, not a software certificate. And staged rollout is a temporary test, limited to ten groups.

Production requires high affinity, because CBA is only as strong as its weakest binding. But switch only once every user's certificate user IDs are right, or those users are locked out.

Workbook: Book 07, Chapter 06 — Device and User Certificates: Intune and Entra CBA.`);
}

// ------------------------------------------------------------------ How 3
{
  const s = D.content("How to do it", "Run both PKIs, then migrate in six gated waves");
  tag(s, "How");
  const rows = [
    ["1 Assess", "1–4", "Every template classified; Critical and High fixed"],
    ["2 Foundation", "5–8", "Cloud CA live; trust on 99% of devices"],
    ["3 Pilot", "9–16", "95% issuance; pilot relying parties accept it"],
    ["4 Scale", "17–28", "Every managed device on cloud certificates"],
    ["5 Cutover", "29–36", "Domains managed; AD FS certificate auth off"],
    ["6 Decommission", "37–44", "MIGRATE-only AD CS components retired"],
  ];
  s.addTable([head(["Wave", "Weeks", "Exit gate"]), ...rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }])],
    tableOpts([2.2, 1.1, 5.4], { y: 1.5, fontSize: 13.5, rowH: [0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] }));
  box(s, "Rules box", 9.45, 1.5, 3.3, 3.4, HEX.tealTint);
  icon(s, "FaRightLeft", 9.7, 1.68, 0.6, HEX.teal);
  txt(s, "Rules head", "Coexistence", { x: 10.45, y: 1.68, w: 2.2, h: 0.6, bold: true, color: HEX.teal, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  txt(s, "Rules list", bullets([
    "Trust goes up before issuance moves",
    "Nothing is revoked to force a move",
    "CRLs reachable inside, outside and from Entra ID",
  ], 13.5), { x: 9.7, y: 2.45, w: 2.9, h: 2.4, paraSpaceAfter: 7 });
  callout(s, "Rollback", 5.15, 1.35, "FaArrowsRotate", HEX.slate, "Every wave has a tested rollback: ",
    "AD CS autoenrollment stays on through the pilot, and AD FS stays restorable for 30 days after cutover, with a four-hour recovery objective. Removing a SCEP assignment revokes its certificates, so it isn't a harmless undo.");
  sources(s, "Sources: Microsoft Learn — Cloud PKI, staged rollout, federation-to-cloud migration, removing SCEP profiles. Book 07, Chapter 07.");
  s.addNotes(
`[11:38–12:50]  For most of the migration, both PKIs are production. Devices carry certificates from both issuers, and relying parties trust both chains.

Three coexistence rules carry the weight. Trust goes up before issuance moves. Nothing is revoked to force a move; old certificates leave at renewal. And every CRL must be reachable from inside the network, from the internet and from Entra ID, because most coexistence outages are revocation outages.

The migration runs in six gated waves, about forty-four weeks on the program's planning figures for a single forest. Assess ends when every template is classified and Critical and High findings are fixed. Foundation puts the cloud CA live, with trust on ninety-nine percent of devices. Pilot needs ninety-five percent issuance success. Scale moves every managed device. Cutover converts federated domains and turns off AD FS certificate authentication. And Decommission retires what served only migrated workloads.

Every wave has a rehearsed rollback. Autoenrollment stays on through the pilot, and AD FS stays restorable for thirty days after cutover, with a four-hour recovery objective.

Workbook: Book 07, Chapter 07 — Coexistence and Migration.`);
}

// ------------------------------------------------------------------ How 4
{
  const s = D.content("How to do it", "Keep it renewed and checkable, then retire AD CS last");
  tag(s, "How");
  const eng = [
    ["FaLaptop", "Intune profiles", "Managed devices renew at the profile's threshold, with a new key pair", HEX.teal],
    ["FaServer", "AD CS autoenrollment", "Domain controllers, LDAPS and RADIUS, while the forest stays", HEX.navy],
    ["FaArrowsRotate", "CyberArk Certificate Manager", "Server, appliance and public TLS, with ACME where it fits", HEX.amber],
  ];
  txt(s, "Engines head", "THREE RENEWAL ENGINES, NO CALENDAR REMINDERS", { x: 0.6, y: 1.5, w: 6.4, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  eng.forEach((r, i) => {
    const y = 1.9 + i * 1.08;
    icon(s, r[0], 0.6, y + 0.05, 0.62, r[3]);
    txt(s, `Engine ${i}`, [{ text: r[1], options: { bold: true, color: r[3], fontSize: 16.5, breakLine: true } }, { text: r[2], options: { fontSize: 14 } }], { x: 1.4, y, w: 5.6, h: 1.0 });
  });
  box(s, "Decom box", 7.35, 1.5, 5.4, 3.6, HEX.redTint);
  icon(s, "FaDoorClosed", 7.6, 1.68, 0.62, HEX.red);
  txt(s, "Decom head", "Retiring an AD CS CA", { x: 8.4, y: 1.68, w: 4.2, h: 0.62, bold: true, color: HEX.red, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  txt(s, "Decom list", bullets([
    "Confirm nothing depends on it",
    "Stop issuance; back up the database and key",
    "Revoke for cessation of operation; publish a final CRL",
    "Remove the role services, then clean every trust store",
    "Keep CDP and AIA serving until the last certificate expires",
  ], 13.5), { x: 7.6, y: 2.45, w: 5.0, h: 2.6, paraSpaceAfter: 5 });
  callout(s, "Signals", 5.3, 1.25, "FaChartLine", HEX.navy, "Watch signals, not outages: ",
    "expiry with no renewal path, stale CRLs, issuance outside policy and trust-store drift are findings when they appear, not when something breaks. Under BYOCA, the CA that signed the cloud issuer stays.");
  sources(s, "Sources: CA/Browser Forum Baseline Requirements; RFC 8555; CyberArk ACME docs; Microsoft Learn — SCEP renewal, CRL operations, CA decommissioning. Book 07, Chapter 08.");
  s.addNotes(
`[12:50–14:04]  Migration ends on a date; certificates don't. With public TLS at 200 days today and 47 days from March 2029, no certificate class may depend on someone remembering a date.

Three renewal engines cover the target. Intune profiles renew managed devices at the profile's threshold, with a new key pair. AD CS autoenrollment renews domain controllers, LDAPS and RADIUS while the forest stays. And CyberArk Certificate Manager renews server, appliance and public TLS, using ACME where the endpoint supports it.

Monitoring watches signals, not outages: expiry with no renewal path, a stale CRL, issuance outside policy, trust-store drift. The checks run at least weekly, and their history is the evidence.

Retiring an AD CS CA comes last. Confirm nothing depends on it. Stop issuance, and back up the database and key. Revoke what's left for cessation of operation and publish a final CRL. Remove the role services and clean every trust store. And keep the CRL and AIA endpoints serving until the last certificate expires. Under bring-your-own-CA, the CA that signed the cloud issuer stays.

Workbook: Book 07, Chapter 08 — Lifecycle, Monitoring and Decommissioning.`);
}

// ------------------------------------------------------------------ Close
{
  const s = D.content("How to do it", "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaSitemap", "Confirm the root decision", "BYOCA signed by the offline root, after the hardening gate", HEX.navy, HEX.navyTint],
    ["FaLandmark", "Settle the Cloud PKI entitlement", "Confirm it for the government tenant; don't assume the E5 change", HEX.teal, HEX.tealTint],
    ["FaArrowsRotate", "Stand up the lifecycle platform", "CyberArk Certificate Manager, Self-Hosted, in the boundary", HEX.amber, HEX.amberTint],
    ["FaUserCheck", "Name the owners", "Issuance policy to the CISO; one renewal owner per class", HEX.red, HEX.redTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    txt(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3 });
  });
  callout(s, "Next", 5.15, 1.4, "FaRoute", HEX.navy, "Next step — wave 1, Assess: ",
    "four weeks to inventory every CA and template, close Critical and High findings, classify every use case and list every relying party. Book 07 has the detail, every claim footnoted, with deployment checklists and a template matrix.");
  sources(s, "Sources: Microsoft Learn — Cloud PKI BYOCA, Intune planning guide; CyberArk documentation; FedRAMP Marketplace. Book 07, Chapters 04, 05 and 07.");
  s.addNotes(
`[14:04–15:01]  So, four decisions.

Confirm the root decision: bring-your-own-CA, signed by the offline root, once the hierarchy has passed the hardening gate.

Settle the Cloud PKI entitlement for the government tenant, rather than assuming the commercial E5 change applies.

Stand up CyberArk Certificate Manager, Self-Hosted, inside the authorization boundary, as the single lifecycle tool.

And name the owners: issuance policy and trust anchors with the CISO, and one renewal owner for every certificate class.

The next step is wave one, Assess: four weeks to inventory every CA and template, close the Critical and High findings, classify every use case, and list every relying party.

Run certificates on their own clock, and the old CAs can retire without stranding anything. Book 07 has the detail, every claim footnoted, with deployment checklists and a template-by-template matrix. Thank you.

Workbook: Book 07, index; Chapters 04, 05 and 07; Appendices A and B.`);
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the slides");
  const src = [
    "Microsoft Learn: What is AD CS; certification authority role; certificate templates; Enterprise PKI health; LDAPS and smart card logon certificates; NPS certificates.",
    "Microsoft Learn: Defender for Identity certificate assessments; secure, delegate and audit CA administration; CRL operations; decommission an enterprise CA.  ·  KB5005413.",
    "Microsoft Learn: Cloud PKI overview, fundamentals, deployment models, BYOCA and CA renewal; Intune SCEP, PKCS and trusted certificate profiles; Certificate Connector.",
    "Microsoft Learn: Entra CBA technical concepts, CRL, setup and migration; staged rollout; migrate from federation.  ·  Microsoft Support: KB5014754.",
    "CA/Browser Forum: Ballot SC-081v3 (April 2025); Baseline Requirements 2.3.1 (October 4, 2026).  ·  RFC 8555 (ACME).  ·  NIST IR 8547 (initial public draft).",
    "CyberArk: Certificate Manager Self-Hosted, Microsoft CA and ACME documentation.  ·  Palo Alto Networks; Thoma Bravo; FedRAMP Marketplace dataset.",
    "GSA: Federal PKI 101.  ·  NIST FIPS 201-3; SP 800-37 Rev. 2; SP 800-53 Rev. 5 (IA-5(2), SC-12, SC-17).  ·  OMB M-22-09.",
    "Full footnotes with links and access dates: Book 07, every chapter (whalermike.github.io/modernization-workbook/docs/books/b07-pki/).",
  ];
  txt(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.55, w: 12.1, h: 5.0, paraSpaceAfter: 6 });
}

D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
