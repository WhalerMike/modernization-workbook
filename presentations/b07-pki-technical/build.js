// Book 07 — PKI & Certificates: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — Hardening and the target:   Module 1 (Ch03 hardening what stays), Module 2 (Ch04 the target PKI).
//   Part 2 — Issuing, migrating and retiring:  Module 3 (Ch06 device and user certificates),
//                                              Module 4 (Ch07 + Ch08 + Appendices A–B).
// Build:  node presentations/b07-pki-technical/build.js presentations/b07-pki-technical/B07_PKI_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b07-pki/; the notes name the chapter.
// Defensive content only: the ESC classes are described as misconfigurations to detect and fix.
// Narration: presentations/_build/narrate.py and captions.py, then build_narrated.ps1 (editor runs that).
const D = require("../_build/lib.js")({ book: "Book 07", title: "PKI & Certificates — Technical Deep Dive" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B07_PKI_Technical.pptx";

// ------------------------------------------------------------------ helpers
// Speaker notes with an automatic timing cue (narration runs ~142 words a minute).
const WPM = 142;
let clock = 0, words = 0, modWords = 0;
const modules = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const n = body.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; words += n; modWords += n;
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};
const endModule = (name) => { modules.push([name, modWords]); modWords = 0; };

// Rough fit check so tables and lists don't overflow (Calibri averages ~0.5 em per character).
const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// A table whose row heights follow the text. rows: arrays of strings or {text, options}.
const table = (s, name, y, colW, headers, rows, o = {}) => {
  const pt = o.fontSize || 12.5;
  const lh = pt / 72 * 1.2;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const rh = (r, bold) => Math.max(o.minRow || 0.34, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
  const hH = rh(headers, true);
  const rowH = [hH, ...rows.map((r) => rh(r))];
  const body = rows.map((r) => r.map((c, k) => {
    const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
    if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
    return base;
  }));
  const x = o.x != null ? o.x : 0.6;
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`${name} table`, bottom);
  if (process.env.FIT) console.log(`  table ${name}: bottom ${bottom.toFixed(2)} in`);
  return bottom;
};

// A tinted panel with a small caps label, a heading and bullets.
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13.5) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 16, fontFace: "Cambria", breakLine: true } });
  txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.75 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08;
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (need > y + h + 0.02) console.warn(`  ! ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
};

// A row of step boxes joined by arrows.
const flow = (s, name, y, h, steps, pt = 12.5) => {
  const n = steps.length, gap = 0.28, w = (12.15 - gap * (n - 1)) / n;
  steps.forEach((st, i) => {
    const x = 0.6 + i * (w + gap);
    const c = st.color || (i % 2 ? HEX.teal : HEX.navy);
    box(s, `${name} ${i + 1}`, x, y, w, h, st.tint || (i % 2 ? HEX.tealTint : HEX.navyTint));
    txt(s, `${name} ${i + 1} text`, [
      { text: st.head, options: { bold: true, color: c, fontSize: pt + 2.5, fontFace: "Cambria", breakLine: true } },
      { text: st.body, options: { fontSize: pt } },
    ], { x: x + 0.12, y: y + 0.1, w: w - 0.24, h: h - 0.2, paraSpaceAfter: 3 });
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

// Module divider: a Title-master slide with the module's contents and running time.
const divider = (sec, title, sub, items, mins) => {
  const s = D.titleSlide(sec, title, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 7.2, h: 1.6, paraSpaceAfter: 3 });
  return s;
};

const P1 = "Part 1 — Hardening and the target";
const P2 = "Part 2 — Issuing, migrating and retiring";

// ================================================================== 1 Title
{
  const s = D.titleSlide("Orientation", "PKI & Certificates: the technical deep dive", "Book 07 — from a hardened AD CS to Cloud PKI, Entra CBA and Federal PKI");
  txt(s, "Session map", [
    { text: "Part 1 — Hardening and the target", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  Hardening what stays   ·   Module 2  The target PKI", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Issuing, migrating and retiring", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Device and user certificates   ·   Module 4  Coexistence to decommissioning", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.2, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 07 of the Federal Modernization Workbook, PKI and Certificates. It's for the PKI engineers and architects who will run the move off Active Directory Certificate Services.

It comes in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is hardening and the target: first how to make the AD CS that stays the best-defended system you own, then the target architecture of four issuers and one lifecycle platform. Part 2 is issuing, migrating and retiring: the Intune certificate profiles, strong mapping and Entra certificate-based authentication, then coexistence, the six-wave migration, lifecycle monitoring and the decommissioning of the old CAs.

The slides show tables, checklists and decision matrices. The commands live in the chapters and appendices, and the book marks them as illustrative and untested against production; I'll point you to them rather than put them on screen.`,
  "Book 07, index; Chapters 03–08; Appendices A–B.");
}

// ================================================================== 2 Why
{
  const s = D.content("Orientation", "Why this matters: certificates fail at expiry, not at cutover");
  tag(s, "Why");
  subhead(s, "Hold head", "WHY AD CS IS THE HARDEST PART OF AD TO LEAVE", 0.6, 1.5, 5.6);
  const hold = [
    ["FaSitemap", "Wired into the forest", HEX.navy, "Templates, enrollment services, NTAuth, AIA and CRL objects live in the configuration partition"],
    ["FaCloud", "Cloud covers part of it", HEX.teal, "Cloud PKI issues only to Intune-managed devices; Intune doesn't manage Windows Server"],
    ["FaServer", "DCs need certificates", HEX.amber, "Kerberos certificate trust, LDAPS and smart card logon last as long as domain controllers do"],
  ];
  hold.forEach((r, i) => {
    const y = 1.88 + i * 1.12;
    icon(s, r[0], 0.6, y + 0.05, 0.6, r[2]);
    txt(s, `Hold ${i + 1}`, [
      { text: r[1], options: { bold: true, color: r[2], fontSize: 15.5, breakLine: true } },
      { text: r[3], options: { fontSize: 13 } },
    ], { x: 1.35, y, w: 4.9, h: 1.05 });
  });
  subhead(s, "Rules head", "THE RULES ARE MOVING UNDER CERTIFICATES ALREADY ISSUED", 6.5, 1.5, 6.3);
  table(s, "Rules", 1.85, [1.75, 4.4], ["Change", "What the book records"], [
    ["Public TLS", "Maximum validity 200 days from March 15, 2026 (in force), 100 days from March 15, 2027, 47 days from March 15, 2029"],
    ["KB5014754", "Full Enforcement since February 11, 2025; Compatibility mode gone since September 9, 2025"],
    ["Post-quantum", "NIST IR 8547 draft: RSA-2048 signatures deprecated after 2030, all RSA and ECDSA disallowed after 2035"],
    ["OMB M-26-15", "PQC migration plan due 120 days from June 24, 2026"],
  ], { x: 6.6, fontSize: 12.5 });
  callout(s, "Program", 5.35, 1.1, "FaTriangleExclamation", HEX.red, "Its own program: ",
    "issued certificates keep working after cutover until the first expiry wave finds no issuer. The replacement issuer has to be live first, and AD CS retires last.");
  sources(s, "Sources: CA/Browser Forum Ballot SC-081v3 and Baseline Requirements 2.3.1; KB5014754; NIST IR 8547 (ipd); OMB M-26-15; Microsoft Learn — Cloud PKI, Intune platforms. Book 07, Ch 01.");
  notes(s,
`Why this matters. A certificate is a signed naming claim that has already been handed out. It sits in device stores, on smart cards, in load balancers and in trust stores nobody remembers configuring. It doesn't move when the directory moves. It keeps working until it expires, and then whatever relied on it stops.

Three properties make AD CS the hardest part of Active Directory to leave. An enterprise CA is wired into the forest: its templates, enrollment services, NTAuth trust and publication points live in the configuration partition. The cloud replacements cover only part of the estate: Cloud PKI issues to Intune-managed devices, and Intune doesn't manage Windows Server. And domain controllers need certificates for as long as domain controllers exist.

Meanwhile the rules are moving under certificates already issued. Public TLS maximum validity is two hundred days today, a hundred days from March 15, 2027, and forty-seven days from March 15, 2029. KB5014754 put domain controllers in Full Enforcement on February 11, 2025, and Compatibility mode has been gone since September 9, 2025. NIST's draft post-quantum transition plan proposes deprecating RSA-2048 signatures after 2030 and disallowing RSA and ECDSA signatures after 2035, and OMB M-26-15 gave agencies a hundred and twenty days from June 24, 2026 to submit a migration plan.

So the move off AD CS runs as its own program. It fails at expiry, not at cutover, which can be months later and far from its cause.`,
  "Book 07, Chapter 01 — Why Certificates Outlive Every Migration.");
}

// ================================================================== 3 What AD CS holds up
{
  const s = D.content("Orientation", "What AD CS holds up, and the four verdicts");
  tag(s, "What");
  panel(s, "Footprint", 0.6, 1.5, 4.6, 3.75, HEX.navy, HEX.navyTint, "CHAPTER 02", "Not one server", [
    "Offline standalone root; enterprise issuing CAs issue from templates stored in AD",
    "Public Key Services: Templates, Enrollment Services, NTAuthCertificates, AIA, CDP, KRA, OID",
    "Autoenrollment every eight hours; renewal after 80 percent of validity",
    "Inventory four layers: CA, template, issued certificates, relying parties",
  ], 13);
  table(s, "Verdicts", 1.5, [1.35, 2.75, 3.15], ["Verdict", "Meaning", "Examples"], [
    [{ text: "RETIRE", options: { color: HEX.slate } }, "The consumer is going away", "EFS on migrated shares, retired SSIDs"],
    [{ text: "MIGRATE", options: { color: HEX.teal } }, "Cloud PKI through Intune, or Entra CBA, replaces it", "Wi-Fi and wired 802.1X, VPN, device auth, tenant sign-in"],
    [{ text: "BRIDGE", options: { color: HEX.amber } }, "Depends on AD or a server the cloud can't reach", "DCs, LDAPS, NPS and RADIUS, NTAuth trust"],
    [{ text: "RETAIN", options: { color: HEX.red } }, "No cloud equivalent; stays on-premises", "HSM code signing, network gear via SCEP"],
  ], { x: 5.5, fontSize: 12.5 });
  callout(s, "Order", 5.4, 1.05, "FaListCheck", HEX.amber, "Ask in this order: ",
    "retiring? then a cloud path? then dependent on AD itself? What's left is RETAIN, a short list with an owner and a review date on every entry.");
  sources(s, "Sources: Microsoft Learn — CA role service; Monitor AD CS publication health; autoenrollment renewal; Cloud PKI overview. Book 07, Ch 02; Appendix B.");
  notes(s,
`What AD CS holds up. It isn't one server. The typical estate is a two-tier hierarchy: an offline standalone root that signs the issuing CAs and its own CRL, and enterprise issuing CAs that issue from templates stored in Active Directory. Every enterprise CA also lives as objects in the forest's Public Key Services branch: certificate templates, enrollment services, the NTAuth certificates object, AIA and CDP containers, key recovery agents and OIDs. Those objects are forest-wide, which is exactly what ties AD CS to Active Directory. Domain members enroll through Group Policy autoenrollment, which runs every eight hours and renews a certificate after it passes eighty percent of its validity.

Chapter 02's inventory has four layers: the CAs, the templates, the issued certificates and the relying parties. The relying-party layer decides the order of work later, because a new issuer is useful only once everything that validates it trusts it.

Then every template and use case gets one of four verdicts, asked in order. RETIRE first, if the consumer is going away. MIGRATE, if Cloud PKI through Intune or Entra CBA replaces it: Wi-Fi, VPN, device authentication, tenant sign-in. BRIDGE, if it depends on AD itself or a server the cloud can't reach: domain controllers, LDAPS, NPS and NTAuth trust. RETAIN is what's left, such as HSM-held code signing, and every entry gets an owner and a review date. Appendix B applies these verdicts template by template; we'll come back to it in Module 4.`,
  "Book 07, Chapter 02 — What AD CS Holds Up; Appendix B.");
}
endModule("Orientation");

// ================================================================== 4 Module 1 divider
{
  const s = divider(P1, "Module 1: Hardening what stays", "Part 1 — Hardening and the target  ·  Chapter 03",
    ["The migration gate and the eight ESC classes as a detection checklist", "CA auditing and the program's risk-scoring matrix", "Baselines for retained AD CS, Cloud PKI and Entra CBA"], 11);
  notes(s,
`Module 1: hardening what stays. A migration off AD CS takes months, and for some workloads it never finishes. Throughout that time the enterprise CA keeps issuing certificates that domain controllers, VPN gateways, RADIUS servers and Entra ID accept as proof of identity. A CA can create credentials the whole environment trusts, so one over-privileged account or misconfigured setting on it can undo every other identity control.

That makes hardening the first technical workstream, not a cleanup task at the end. Everything in this module is defensive: what each misconfiguration is, how to detect it, and how to fix it.`,
  "Book 07, Chapter 03 — Hardening What Stays.");
}

// ================================================================== 5 Gate and control points
{
  const s = D.content(P1, "The gate, and where the misconfigurations live");
  tag(s, "What");
  const cards = [
    ["FaFileShield", "Template objects", "ESC1–ESC4", HEX.navy, HEX.navyTint, [
      "Requester-supplied subject; Any Purpose or no EKU; enrollment agents; template ACL and owner",
      "Defender for Identity template assessments"]],
    ["FaSitemap", "Public Key Services", "ESC5", HEX.teal, HEX.tealTint, [
      "Write rights on NTAuthCertificates, Enrollment Services, the Templates container",
      "No Defender for Identity assessment: ACL review and event 5136"]],
    ["FaServer", "CA configuration", "ESC6, ESC7", HEX.amber, HEX.amberTint, [
      "The SAN edit flag; Manage CA and Issue and Manage Certificates",
      "CA assessments need the sensor on the CA; events 4882, 4890, 4892"]],
    ["FaGlobe", "HTTP enrollment", "ESC8", HEX.red, HEX.redTint, [
      "Web Enrollment and CES without HTTPS and Extended Protection",
      "CA sensor assessment; IIS binding and EPA settings"]],
  ];
  cards.forEach((c, i) => {
    const x = 0.6 + i * 3.07;
    box(s, `Card ${i + 1}`, x, 1.5, 2.93, 3.55, c[4]);
    icon(s, c[0], x + 0.15, 1.63, 0.55, c[3]);
    txt(s, `Card ${i + 1} head`, [
      { text: c[1], options: { bold: true, color: c[3], fontSize: 15, fontFace: "Cambria", breakLine: true } },
      { text: c[2], options: { bold: true, color: HEX.slate, fontSize: 12 } },
    ], { x: x + 0.8, y: 1.6, w: 2.05, h: 0.65, valign: "middle" });
    txt(s, `Card ${i + 1} text`, bullets(c[5], 12.5), { x: x + 0.15, y: 2.35, w: 2.68, h: 2.65, paraSpaceAfter: 5 });
  });
  callout(s, "Gate", 5.2, 1.3, "FaDoorClosed", HEX.red, "The migration gate: ",
    "Critical and High findings are remediated and verified before any certificate workload migrates. Under BYOCA the cloud issuer chains to this hierarchy and inherits every weakness.");
  sources(s, "Sources: SpecterOps, Certified Pre-Owned (2021; class names only); Microsoft Learn — Defender for Identity certificate assessments, posture assessments, US Government offerings. Book 07, Ch 03.");
  notes(s,
`The program carries one rule forward unchanged: misconfigurations rated Critical or High are remediated and verified before any certificate workload migrates. Migrating from a CA that can be made to issue arbitrary credentials propagates the weakness into whatever trusts the hierarchy next. And under the bring-your-own-CA model the program recommends, the new Cloud PKI issuing CA chains to the existing AD CS hierarchy, so it inherits every weakness the day it goes live.

The ESC names come from SpecterOps' 2021 research; Microsoft adopted the same labels in Defender for Identity, which is why they're the shared vocabulary. The book uses them only as labels for defensive checks. The classes live in four control points. Template objects hold ESC1 through ESC4. The Public Key Services objects hold ESC5, which Defender for Identity doesn't assess, so detection is an ACL review plus directory change auditing, event 5136. The CA's own configuration holds ESC6 and ESC7, and HTTP enrollment endpoints hold ESC8. Certificate template assessments are available to every customer with AD CS; CA assessments need a Defender for Identity sensor on the AD CS server, so install it on every enterprise CA that stays.

Two caveats from the book. In GCC, Defender for Identity uses the security dot microsoft dot com portal; Microsoft says new features reach GCC, GCC High and DoD within ninety days of commercial release, but preview features may not be supported there. The ESC1 and ESC6 assessments are still labeled preview, so confirm they appear in your tenant, and run the manual checks in the meantime.`,
  "Book 07, Chapter 03 — Hardening What Stays, \"The migration gate\" and \"The ESC taxonomy.\"");
}

// ================================================================== 6 ESC1–ESC4
{
  const s = D.content(P1, "Template classes ESC1–ESC4: detect and fix");
  tag(s, "How");
  table(s, "Templates", 1.5, [0.8, 3.0, 4.3, 4.05], ["Class", "The misconfiguration", "How to detect it", "How to fix it"], [
    ["ESC1", "Requester supplies the subject or SAN on a client-authentication template that broad groups can enroll in",
      "Defender for Identity (preview); Supply in the request set; authentication EKUs; Enroll for Domain Users or similar; events 4886 and 4887 where requester and subject differ",
      "Any one closes it: build the subject from AD, remove unneeded EKUs, restrict Enroll, require manager approval, or unpublish"],
    ["ESC2", "Any Purpose or no EKU, enrollable by unprivileged users",
      "Defender for Identity; empty or Any Purpose application policies plus an unprivileged Enroll grant",
      "Restrict enrollment; replace Any Purpose with specific EKUs; add approval or signatures"],
    ["ESC3", "A Certificate Request Agent template unprivileged users can enroll in",
      "Defender for Identity; inventory agent templates and issued agent certificates; test restrictions with an allowed and a disallowed request",
      "Remove the EKU or broad enrollment, require approval, unpublish, or set CA enrollment agent restrictions"],
    ["ESC4", "Unprivileged write rights on, or ownership of, a template",
      "Defender for Identity (ACL and owner); Security tab; event 5136, with Audit Directory Service Changes and a SACL",
      "Remove the ACEs; privileged, monitored owner; keep the CA computer account's Read"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: Microsoft Learn — Defender for Identity certificate assessments; certenroll.h name flags; Audit Certification Services; Manage AD CS certificate templates; Secure, delegate and audit CA administration. Book 07, Ch 03.");
  notes(s,
`The template classes, as a checklist.

ESC1: a template lets the requester supply the subject or subject alternative name, permits client authentication, and broad unprivileged groups can enroll, so a member could obtain a certificate that names someone else. Detect it with Defender for Identity, and by hand: Supply in the request on the Subject Name tab, an authentication purpose such as Client Authentication, Smart Card Logon, PKINIT or Any Purpose, and Enroll granted to Authenticated Users, Domain Users, Domain Computers or Everyone. On the CA, events 4886 and 4887 show requests where the requester and the issued subject differ. Any one remediation closes it: build the subject from Active Directory, remove authentication EKUs the template doesn't need, restrict Enroll, require CA certificate manager approval, or take the template off every CA if it's unused.

ESC2 is Any Purpose or no EKU on a broadly enrollable template. A no-EKU template restricted to PKI administrators, such as a subordinate CA template, isn't the same exposure.

ESC3 is a broadly enrollable enrollment agent template. Treat an enrollment agent certificate as an impersonation capability. Microsoft doesn't publish a Windows Server 2025 procedure for enrollment agent restrictions, so validate the existing configuration in a lab first.

ESC4 is write rights or ownership on a template held by anyone but the PKI administrators. Changes are logged as event 5136 only when directory change auditing is on and the objects carry a matching SACL. One trap when you fix it: if you remove Authenticated Users from a template ACL, grant each issuing CA's computer account Read, or the CA can no longer read the template.`,
  "Book 07, Chapter 03 — Hardening What Stays, ESC1–ESC4.");
}

// ================================================================== 7 ESC5–ESC8
{
  const s = D.content(P1, "Directory and CA classes ESC5–ESC8, then ESC11 and ESC15");
  tag(s, "How");
  const b = table(s, "CA classes", 1.5, [0.8, 3.0, 4.3, 4.05], ["Class", "The misconfiguration", "How to detect it", "How to fix it"], [
    ["ESC5", "Unprivileged write on Public Key Services objects such as NTAuthCertificates or Enrollment Services",
      "No Defender for Identity assessment: review the container ACLs; compare the NTAuth store with the approved CA list; SACL plus event 5136",
      "Limit write to Enterprise Admins and the CA computer accounts; alert on NTAuth changes; never delete a flagged object without a dependency check"],
    ["ESC6", "The CA-wide EDITF_ATTRIBUTESUBJECTALTNAME2 flag lets any requester supply SANs on any template",
      "Defender for Identity CA assessment (sensor; preview); read the policy module's edit flags",
      "Find out why it was set, clear it, restart the service"],
    ["ESC7", "Unprivileged Manage CA or Issue and Manage Certificates on the CA",
      "Defender for Identity (sensor); baseline the CA's Security tab; alert on 4882, 4890 and 4892",
      "Remove from unprivileged groups; separate role groups of named accounts, each with an owner and review date"],
    ["ESC8", "Web Enrollment or CES accepts NTLM without HTTPS or Extended Protection",
      "Defender for Identity (sensor) and its issuance alert; inventory IIS: HTTP binding, Require SSL, EPA",
      "EPA Required; Require SSL; restart IIS; restrict NTLM; remove Web Enrollment nothing needs"],
  ], { fontSize: 12 });
  txt(s, "Later classes", [
    { text: "Also on the checklist: ", options: { bold: true, color: HEX.navy } },
    { text: "ESC11, RPC enrollment without packet privacy (turn the encryption flag back on); ESC15, templates on CAs unpatched for CVE-2024-49019 (remove unprivileged enrollment, turn off Supply in the request, patch)." },
  ], { x: 0.6, y: b + 0.12, w: 12.15, h: 6.5 - b - 0.12, fontSize: 13, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — Defender for Identity certificate assessments and alerts; Monitor AD CS publication health; certutil; KB5014754; KB5005413 (NTLM relay on AD CS). Book 07, Ch 03.");
  notes(s,
`The directory and CA classes.

ESC5 is unprivileged write access on the forest's Public Key Services objects. The NTAuth certificates object holds the CAs trusted to issue logon and domain controller certificates, and each enrollment services object records what a CA can issue and who can enroll. Write access to either is control over authentication. Defender for Identity has no ESC5 assessment, so review the ACLs, compare the NTAuth store with your approved CA list, and audit changes through event 5136.

ESC6 is the CA-wide flag that lets any requester supply subject alternative names on any template. Find out why it was turned on, since some old workflows depended on it, then clear it and restart the service. The book corrects a common belief here: KB5014754 introduced strong mapping, which reduces what a forged name can do against Kerberos, but it doesn't change what the CA will sign, and other relying parties may still trust the name. Clear the flag regardless.

ESC7 is unprivileged Manage CA or Issue and Manage Certificates. Build separate groups for CA administrators, certificate managers, enrollment agents, auditors and backup custodians. Service accounts count too: the Intune Certificate Connector and lifecycle tooling both hold Issue and Manage Certificates, so each is a certificate manager in all but name.

ESC8 is an HTTP enrollment endpoint that accepts NTLM without HTTPS or Extended Protection. Microsoft's advisory: Extended Protection set to Required, Require SSL, restart IIS, and restrict NTLM where you can. Better still, remove Web Enrollment wherever nothing depends on it, and apply the same rules to NDES.`,
  "Book 07, Chapter 03 — Hardening What Stays, ESC5–ESC8 and \"Beyond ESC8.\"");
}

// ================================================================== 8 CA auditing
{
  const s = D.content(P1, "Turn on CA auditing, then watch the baseline events");
  tag(s, "How");
  panel(s, "Settings", 0.6, 1.5, 4.7, 4.95, HEX.amber, HEX.amberTint, "TWO SETTINGS, NEITHER WORKS ALONE", "AD CS logs nothing by default", [
    "GPO on the CA servers: Audit Certification Services, Success and Failure",
    "CA audit filter: all categories, then restart in a maintenance window",
    "Full auditing can slow restarts on a large database: test it",
    "Forward by WEF to the SIEM; size the Security log to outlast an outage",
    "Generate each event in a test before writing the rule",
  ], 13);
  table(s, "Events", 1.5, [1.0, 3.35, 2.9], ["Event", "Meaning", "Why the program watches it"], [
    ["4886", "Request received", "Volume and requester, per template"],
    ["4887", "Request approved, certificate issued", "Every credential; retired templates"],
    ["4888", "Request denied", "Probing of restricted templates"],
    ["4870", "Certificate revoked", "Leaver and incident evidence"],
    ["4882", "CA security permissions changed", "ESC7 drift"],
    ["4885", "Audit filter changed", "Auditing turned down"],
    ["4890", "Certificate manager settings changed", "ESC7 drift"],
    ["4892", "A CA property changed", "ESC6 and configuration drift"],
    ["4896", "Rows deleted from the database", "Evidence destruction"],
    ["4897", "Role separation enabled", "Role model change"],
  ], { x: 5.5, fontSize: 12 });
  sources(s, "Sources: Microsoft Learn — Secure, delegate and audit CA administration; Audit Certification Services; Defender for Identity event auditing on AD CS. Book 07, Ch 03.");
  notes(s,
`Every detection in this module depends on evidence, and AD CS produces none by default. Two settings are needed, and neither works without the other. The CA's audit filter selects which CA operations are audited. The Audit Certification Services advanced audit subcategory lets the operating system generate the events. Set the subcategory to Success and Failure in a dedicated GPO linked to the CA servers, set the audit filter to cover every category, and restart the service in a maintenance window. Full auditing includes the start and stop category, which can slow restarts on a CA with a large database, so test that first.

Then watch Microsoft's focused baseline. 4886, 4887 and 4888 are requests received, issued and denied: issuance volume per template, every credential issued, and probing of templates that should be restricted. 4870 is revocation evidence. 4882 and 4890 are permission and certificate manager changes, which is ESC7 drift. 4885 is someone changing the audit filter. 4892 is a CA property change, which catches the ESC6 flag. 4896 is rows deleted from the CA database. 4897 is role separation enabled. Microsoft recommends generating each event in a nonproduction test before writing the collection rule, so an assumed event doesn't become a blind spot.

Forward through Windows Event Forwarding to a collector and the SIEM. Forwarding doesn't stop a full local log from overwriting evidence, so size the CA's Security log for the longest plausible collection outage.`,
  "Book 07, Chapter 03 — Hardening What Stays, \"Turn on CA auditing.\"");
}

// ================================================================== 9 Risk matrix
{
  const s = D.content(P1, "The risk-scoring matrix, and what closed means");
  tag(s, "Who");
  const b = table(s, "Risk", 1.5, [0.9, 4.6, 1.3, 1.85, 1.6, 1.9], ["Class", "Misconfiguration", "Risk", "Domain compromise?", "Priority", "Defender for Identity"], [
    ["ESC1", "Requester supplies subject on an authentication template", "Critical", "Yes", "Immediate", "Template; preview"],
    ["ESC2", "Any Purpose or no EKU, broadly enrollable", "Critical", "Possible", "Immediate", "Template"],
    ["ESC3", "Enrollment agent template broadly enrollable", "High", "Possible", "Within 2 weeks", "Template"],
    ["ESC4", "Writable template ACL or unprivileged owner", "High", "Possible", "Within 2 weeks", "Template"],
    ["ESC5", "Writable Public Key Services objects", "High", "Possible", "Within 2 weeks", "No; manual, 5136"],
    ["ESC6", "EDITF_ATTRIBUTESUBJECTALTNAME2 on", "Critical", "Yes", "Immediate", "CA sensor; preview"],
    ["ESC7", "Unprivileged Manage CA or Issue and Manage", "High", "Possible", "Within 2 weeks", "CA sensor"],
    ["ESC8", "HTTP enrollment without HTTPS and EPA", "Critical", "Yes", "Immediate", "CA sensor"],
  ], { fontSize: 12 });
  callout(s, "Closed", b + 0.15, 6.5 - b - 0.15, "FaClipboardCheck", HEX.teal, "Every row blocks migration until verified closed: ",
    "Defender for Identity shows no exposed entities (allow its 24-hour update lag), plus a manual re-check for ESC5. Ratings are the program's own scoring.");
  sources(s, "Sources: Microsoft Learn — Defender for Identity certificate assessments; posture assessments. Risk, compromise and priority columns are program scoring. Book 07, Ch 03.");
  notes(s,
`The program scores each class for prioritization. Be clear about what's whose. The risk level, domain-compromise and priority columns are the program's own scoring, carried forward from its PKI guide. The detection column is from Microsoft's documentation.

Four classes are Critical with Immediate priority: ESC1, ESC2, ESC6 and ESC8. Four are High, to be fixed within two weeks: ESC3, ESC4, ESC5 and ESC7. One change from the original guide: ESC2 is downgraded from Yes to Possible for domain compromise, because Microsoft describes its main effect as undermining trust in other certificate consumers rather than direct user impersonation.

Immediate means the finding is fixed, or the template or endpoint is taken out of service, before the next change window closes. And every row is a migration blocker until it's verified closed. Verified has a definition: the Defender for Identity assessment shows no exposed entities, remembering that scores and statuses update every twenty-four hours, plus a manual re-check for ESC5, which Defender for Identity doesn't assess.

That's the record the gate reads. Chapter 07's first wave doesn't exit until every Critical and High finding is remediated and re-tested, and the PKI owner and the security team have approved the assessment.`,
  "Book 07, Chapter 03 — Hardening What Stays, \"The risk-scoring matrix\"; Chapter 07, Wave 1.");
}

// ================================================================== 10 Baselines
{
  const s = D.content(P1, "Hardening baselines: retained AD CS, Cloud PKI and Entra CBA");
  tag(s, "How");
  panel(s, "ADCS", 0.6, 1.5, 3.95, 4.95, HEX.navy, HEX.navyTint, "THE AD CS THAT REMAINS", "Tier 0 until it's gone", [
    "Unpublish every template no BRIDGE or RETAIN workload needs",
    "Keep CRLs on schedule; test with -urlfetch from client networks",
    "Backup-CARoleService before every change",
    "Hardened management host; RPC only from endpoints that need it",
    "FIPS-validated HSM keys, non-exportable; dual control for the root",
  ], 12.5);
  panel(s, "CPKI", 4.7, 1.5, 3.95, 4.95, HEX.teal, HEX.tealTint, "MICROSOFT CLOUD PKI", "A new admin surface", [
    "Custom Intune roles and scope tags; no built-in PKI admin role",
    "EKUs fixed at creation; no Any Purpose",
    "Windows keys in the TPM KSP, otherwise fail: 2048-bit RSA",
    "One-year validity for authentication certificates",
    "No production CAs during a trial: trial keys stay in software",
  ], 12.5);
  panel(s, "CBA", 8.8, 1.5, 3.95, 4.95, HEX.amber, HEX.amberTint, "ENTRA CBA", "What it trusts and binds", [
    "High-affinity bindings required in production",
    "Custom strength: named issuers or policy OIDs, up to five each",
    "Require CRL validation; one HTTP CRL per CA; no OCSP",
    "CRL at least every 24 hours (program rule)",
    "CA scoping, GA since April 2026: one group per CA, 30 rules; pilot it",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Secure, delegate and audit CA administration; Cloud PKI overview and configure CA; SCEP profiles; Entra CBA technical concepts, CRL, authentication strengths; Entra what's new. Book 07, Ch 03.");
  notes(s,
`Three baselines close the module.

The AD CS that remains keeps running for months or years for BRIDGE and RETAIN workloads. Remove every template those workloads don't need from each CA's issuance list; it's reversible. Alert on requests for templates that should no longer be requested. Keep CRL publication on schedule, and test it from representative client networks. Back up the CA before every change. Treat CA servers as Tier 0, the program's designation, because the CA can mint domain authentication credentials. And the program requires FIPS 140-2 or 140-3 validated modules, CA keys held non-exportable in an HSM, and dual control for root ceremonies.

Cloud PKI removes most of that attack surface but adds its own. Scope administrators with custom Intune roles and scope tags; there's no built-in Intune PKI Administrator role. EKUs are fixed at creation. On Windows, set the key storage provider to TPM, otherwise fail; a 4096-bit key can only live in the software provider, so the program uses 2048-bit RSA in the TPM. The program sets one-year validity. And don't build production CAs during a trial.

Entra CBA is a relying party, so its hardening is about trust and binding. Require high-affinity bindings in production. Use a custom authentication strength that names issuers or policy OIDs, up to five of each, for sensitive resources. Require CRL validation; the program wants each trusted issuing CA to publish a CRL at least every twenty-four hours, because Entra caches it. And CA scoping, generally available since April 2026, ties each CA to one group, with up to thirty rules. A mistake can lock users out, so pilot it.`,
  "Book 07, Chapter 03 — Hardening What Stays, \"Hardening the AD CS that remains,\" \"Hardening Microsoft Cloud PKI,\" \"Hardening Entra certificate-based authentication.\"");
}
endModule("Module 1");

// ================================================================== 11 Module 2 divider
{
  const s = divider(P1, "Module 2: The target PKI", "Part 1 — Hardening and the target  ·  Chapter 04",
    ["What Microsoft Cloud PKI can and can't issue", "Cloud root or bring-your-own-CA, and the program's choice", "Retained AD CS, Federal PKI for PIV, and one lifecycle platform"], 10);
  notes(s,
`Module 2: the target PKI. The guide this book replaces said Microsoft Cloud PKI eliminates the need for on-premises AD CS for most certificate use cases. That's true for devices and wrong for the estate.

There's no single replacement for AD CS. The target is four issuers, each chosen for the subjects only it can serve: Cloud PKI for Intune-managed devices, a smaller and hardened AD CS for what still depends on Active Directory, the Federal PKI for PIV, and public CAs for names the internet must trust. Entra ID sits beside all of them as a relying party, not an issuer. One root-of-trust decision and one lifecycle platform hold them together.`,
  "Book 07, Chapter 04 — The Target PKI: Cloud PKI, AD CS and Federal PKI.");
}

// ================================================================== 12 Cloud PKI can / can't
{
  const s = D.content(P1, "Microsoft Cloud PKI: what it can and can't issue");
  tag(s, "What");
  const b = table(s, "Can", 1.5, [6.075, 6.075], ["Cloud PKI can", "Cloud PKI can't"], [
    ["Issue leaf certificates to Intune MDM-enrolled Android, iOS/iPadOS, macOS and Windows devices", "Issue to anything not enrolled in Intune: no domain controller, NPS, web or SQL Server certificate"],
    ["Issue user and device client-authentication certificates for Wi-Fi, VPN and CBA", "Issue the TLS server certificates RADIUS, Wi-Fi infrastructure and VPN gateways present"],
    ["Issue through SCEP, renew and revoke; RSA 2048, 3072 or 4096; SHA-256, 384 or 512", "Issue through PKCS or imported PKCS profiles"],
    ["Publish a CRL per CA: valid seven days, republished every 3.5 days and on each revocation", "Answer OCSP, or offer data residency"],
    ["Host up to three CAs per tenant: root, issuing and BYOCA issuing all count", "Change a CA's EKUs after creation: a new EKU means a new CA"],
  ], { fontSize: 12.5, firstBold: false });
  const facts = [
    ["Keys", HEX.navy, HEX.navyTint, "Licensed CAs: Azure Managed HSM, no subscription of your own. Trial CAs: software keys, never converted"],
    ["Licensing", HEX.teal, HEX.tealTint, "Add-on to Intune Plan 1 or 2. M365 E5 and E7 include it for commercial customers from July 2026; confirm Government entitlement"],
    ["Clouds", HEX.amber, HEX.amberTint, "GCC uses the commercial Intune service. GCC High from the week of Sept. 28, 2026. Not supported in DoD"],
  ];
  const top = b + 0.15, h = 6.5 - top;
  facts.forEach((f, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Fact ${i + 1}`, x, top, 3.95, h, f[2]);
    txt(s, `Fact ${i + 1} text`, [
      { text: f[0], options: { bold: true, color: f[1], fontSize: 14, fontFace: "Cambria", breakLine: true } },
      { text: f[3], options: { fontSize: 12 } },
    ], { x: x + 0.15, y: top + 0.08, w: 3.65, h: h - 0.14, valign: "middle" });
  });
  sources(s, "Sources: Microsoft Learn — Cloud PKI overview, fundamentals, deployment models, configure CA; Intune supported platforms; Intune add-ons, planning guide, what's new (2606, 2609); Intune GCC High and DoD. Book 07, Ch 04.");
  notes(s,
`Cloud PKI is a Microsoft-hosted PKI managed in the Intune admin center. It hosts the root and issuing CAs, a SCEP registration authority for each issuing CA, the CRL distribution point and the AIA endpoint, which together replace the on-premises CA, NDES server and Certificate Connector for device certificates.

What it can do. Issue client-authentication certificates to Intune-enrolled Android, Apple and Windows devices, through SCEP. Publish a CRL per CA, valid seven days, republished every three and a half days and on every revocation. And host up to three CAs per tenant.

What it can't. Issue to anything not enrolled in Intune; Intune doesn't support Windows Server, so no domain controller, NPS server, web server or SQL Server gets a Cloud PKI certificate. Issue the server certificates RADIUS and VPN gateways present; Microsoft says those must come from another CA. Issue through PKCS. Answer OCSP. And change a CA's EKUs after creation. Plan the three-CA count before you create anything.

Keys: licensed CAs use Azure Managed HSM; trial CAs use software keys that can't be converted after purchase. Licensing: Cloud PKI is a subscription on top of Intune Plan 1 or 2. From July 2026, Microsoft 365 E5 and E7 include it for commercial customers; Microsoft says Government plans are planned to align, subject to compliance and regulatory requirements, so confirm the entitlement on the current SKU. And availability: GCC uses the commercial Intune service, so availability follows it and licensing is the question. Cloud PKI became available in GCC High in the week of September 28, 2026, and isn't supported in DoD.`,
  "Book 07, Chapter 04 — The Target PKI, \"Microsoft Cloud PKI.\"");
}

// ================================================================== 13 Two models
{
  const s = D.content(P1, "Two ways to anchor trust: a cloud root or bring-your-own-CA");
  tag(s, "What");
  panel(s, "Root", 0.6, 1.5, 5.95, 3.75, HEX.teal, HEX.tealTint, "OPTION 1", "Cloud PKI root CA", [
    "Two-tier hierarchy, private to the tenant",
    "Root 5–25 years, issuing CA 2–10 years in the admin center; Graph allows custom periods",
    "Root key Microsoft-managed in Azure Managed HSM",
    "Every relying party has to be given the new root",
  ], 13);
  panel(s, "BYOCA", 6.8, 1.5, 5.95, 3.75, HEX.navy, HEX.navyTint, "OPTION 2", "Bring your own CA (BYOCA)", [
    "Intune makes the request; a private CA at any tier signs it with the Subordinate CA template",
    "The signer sets validity and hash; your key size caps the SCEP profiles; no 1024-bit or SHA-1",
    "AIA comes from your CA, and AD CS defaults to LDAP: set an HTTP AIA first",
    "Relying parties keep the chain, but also get the BYOCA issuing CA; Android needs the full chain",
  ], 13);
  callout(s, "RootCRL", 5.4, 1.1, "FaTriangleExclamation", HEX.red, "The root CRL becomes production: ",
    "under BYOCA every relying party, Entra ID included, must still fetch the private root's CRL. Entra accepts one HTTP CRL per CA and fails sign-in if it can't reach it.");
  sources(s, "Sources: Microsoft Learn — Cloud PKI deployment models; configure CA; configure BYOCA; renew a CA; Entra CBA overview and CRL. Book 07, Ch 04.");
  notes(s,
`Cloud PKI offers two ways to anchor trust, and both can coexist in one tenant.

The Cloud PKI root CA: you create a root and one or more issuing CAs in the cloud. It's a two-tier hierarchy. In the admin center the root's validity is five to twenty-five years and an issuing CA's is two to ten, never longer than its root; the Graph API allows custom periods. The catch is that every relying party has to be given the new root.

Bring your own CA: you create an issuing CA in the cloud, Intune generates a certificate signing request, and your private CA signs it. Four details matter. The signer doesn't have to be the root; Microsoft says it can be a root or issuing CA from any tier, using the Subordinate Certification Authority template. The signer sets the terms: validity and hash algorithm come from the signing CA, the key size you choose caps the SCEP profiles that use it, and 1024-bit keys and SHA-1 aren't supported. The AIA comes from your CA, and AD CS defaults to an LDAP location, so configure an HTTP AIA before signing; Android doesn't follow AIA paths, so deploy the full chain there. And relying parties still get one new certificate: Microsoft recommends deploying the BYOCA issuing CA certificate to them, because AIA retrieval isn't guaranteed on every platform. Renewal repeats the signing.

One consequence matters more than any of these. Under BYOCA the private root CRL stays where it is, and every relying party, Entra ID included, must still fetch it. An offline root that publishes its CRL only over LDAP, or late, breaks the cloud issuer as surely as the on-premises one.`,
  "Book 07, Chapter 04 — The Target PKI, \"Two deployment models\" and \"What BYOCA actually requires.\"");
}

// ================================================================== 14 Decision matrix
{
  const s = D.content(P1, "The deployment-model decision, and the program's choice");
  tag(s, "Who");
  table(s, "Matrix", 1.5, [2.2, 2.65, 2.85], ["Criterion", "Cloud PKI root CA", "BYOCA"], [
    ["Existing private PKI", "Not required", "Required: a CA at any tier signs"],
    ["Trust chain", "New chain to every relying party", "Existing chain, plus the BYOCA issuing CA"],
    ["Root key custody", "Microsoft-managed HSM", "Wherever the AD CS root key is held"],
    ["Ongoing on-premises dependency", "None", "Private root CRL reachable over HTTP"],
    ["CA count (of three)", "Two for a minimal hierarchy", "One per BYOCA issuing CA"],
    ["DC, LDAPS and server certificates", "Can't serve", "Can't serve"],
    ["Rollback", "Revert devices to AD CS and redistribute trust", "Simpler: the original root and issuing CAs keep running"],
  ], { fontSize: 12 });
  panel(s, "Choice", 8.5, 1.5, 4.25, 4.95, HEX.navy, HEX.navyTint, "PROGRAM RECOMMENDATION", "BYOCA, with three rules", [
    "Harden first: the root's hierarchy passes the Chapter 03 gate before it signs",
    "Sign with the offline root at a key ceremony, so the cloud CA is a peer of the AD CS issuing CAs",
    "Treat the root CRL as production: internet-reachable HTTP, monitored, next ceremony dated",
    "Building PKI for the first time, cloud-first? A Cloud PKI root removes every on-premises dependency",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Cloud PKI deployment models; configure BYOCA; renew a CA; Entra CBA overview. Criteria and recommendation are the program's assessment. Book 07, Ch 04.");
  notes(s,
`A Cloud PKI root needs no existing private PKI, brings a new chain that has to reach every relying party and every forest, and keeps the root key in a Microsoft-managed HSM. BYOCA needs a private CA to sign, preserves the chain relying parties already hold, keeps root custody wherever your AD CS root key is, and adds one ongoing on-premises dependency: the private root's CRL must stay published and reachable over HTTP. Neither model can serve domain controller, LDAPS or server certificates, because Cloud PKI issues only to Intune-enrolled devices. And rollback is simpler under BYOCA, because the original root and its issuing CAs keep running.

The program's recommendation, for an organization with an established AD CS hierarchy, an offline root and cross-forest trust, is BYOCA. It preserves the trust chain, needs one cloud CA rather than two, and keeps a natural rollback path. For an organization building PKI for the first time alongside cloud-first identity, a Cloud PKI root removes every on-premises dependency.

Three program rules go with BYOCA. Harden first: the root's hierarchy passes the Chapter 03 gate before it signs a cloud issuing CA. Sign with the root, not an AD CS issuing CA, so the cloud issuer is a peer of the existing issuing CAs and retiring them later doesn't touch it. And treat the root CRL as production: publish it to an internet-reachable HTTP location on a schedule with margin, monitor it, and record the next ceremony date before the current CRL expires.`,
  "Book 07, Chapter 04 — The Target PKI, \"The deployment-model decision matrix\" and \"The program's recommendation.\"");
}

// ================================================================== 15 Retained AD CS and server issuer
{
  const s = D.content(P1, "What AD CS is kept for, and who issues server certificates");
  tag(s, "What");
  table(s, "Kept", 1.5, [3.2, 4.0], ["Kept for", "Ends when"], [
    ["Domain controller and KDC certificates", "The last domain controller retires"],
    ["LDAPS", "LDAP-bound applications move"],
    ["NPS, RADIUS and VPN gateway server certificates", "RADIUS moves; until then, the server issuer decision"],
    ["Internal server TLS, including SQL Server", "See the issuer decision"],
    ["Network equipment through NDES", "Devices replaced or another path approved"],
    ["HSM-held code signing", "The signing requirement ends"],
    ["S/MIME issuance and key history", "Mail encryption moves and old keys aren't needed"],
  ], { fontSize: 12.5 });
  panel(s, "Issuer", 8.0, 1.5, 4.75, 4.95, HEX.teal, HEX.tealTint, "THE SERVER ISSUER DECISION", "Same chain, automated renewal", [
    "Internal names: retained AD CS, requested and renewed through CyberArk Certificate Manager",
    "Internet names: a public CA, also through the CLM platform",
    "After AD: a standalone AD CS issuing CA under the same root; template policy moves into the CLM platform",
    "Every retained CA stays under the Chapter 03 baseline",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Cloud PKI fundamentals and deployment models; smart card logon with third-party CAs; manage templates; CyberArk — Microsoft CA (enterprise and standalone) driver. Book 07, Ch 04.");
  notes(s,
`Chapter 04 records what AD CS is kept for and when each use ends.

Domain controller and KDC certificates stay until the last domain controller retires: servers can't get Cloud PKI certificates, and smart card or certificate logon to the domain needs a domain controller certificate chaining to a CA in the forest's NTAuth store. LDAPS stays until LDAP-bound applications move. NPS, RADIUS and VPN gateway server certificates stay until RADIUS moves, and until then they fall under the server issuer decision. Network equipment through NDES and HSM-held code signing stay too. And S/MIME: delivery can move to Intune imported PKCS, but the issuer and its key history stay.

That leaves internal server TLS, which Chapter 02 parked as BRIDGE until an issuer was named. The program's decision has three parts. Internal names are issued by the retained AD CS hierarchy, but requested and renewed through CyberArk Certificate Manager rather than by hand or by server autoenrollment, so every server certificate has an owner, an expiry alert and automated renewal in one place. That covers NPS and RADIUS servers, VPN and Remote Desktop gateways and SQL Server as well as web servers. Domain controller certificates, which also serve LDAPS, stay on autoenrollment. Names the internet must trust come from a public CA, also through the lifecycle platform, because public lifetimes are on the shrinking schedule. And after Active Directory: enterprise CAs need AD, and standalone CAs don't use templates. When the forest retires, server issuance moves to a standalone AD CS issuing CA under the same root, still driven by the lifecycle platform, which supports both kinds of Microsoft CA. That keeps server certificates on the existing chain with no new root to distribute.`,
  "Book 07, Chapter 04 — The Target PKI, \"AD CS, retained for what only it can do\" and \"The issuer decision for internal server certificates.\"");
}

// ================================================================== 16 Federal PKI and CLM
{
  const s = D.content(P1, "Federal PKI for PIV, and one lifecycle platform");
  tag(s, "Who");
  panel(s, "FPKI", 0.6, 1.5, 4.6, 3.6, HEX.navy, HEX.navyTint, "FEDERAL PKI", "For PIV: trust, don't issue", [
    "Shared service providers issue PIV under the Federal Common Policy; FIPS 201-3 sets the standard",
    "FCPCAG2 isn't in Microsoft, Mozilla or Apple stores: deploy it by Intune profile and GPO",
    "Domain smart card logon: issuing CA in NTAuth, a certificate on every DC",
    "Upload the chain to Entra ID; CBA validates, it doesn't issue",
  ], 12.5);
  table(s, "Lifecycle", 1.5, [2.3, 5.0], ["Issuer", "Who manages the lifecycle"], [
    ["Cloud PKI", "Intune issues, renews and revokes; the CLM platform reads its inventory"],
    ["AD CS (retained)", "The CLM platform, through its Microsoft CA integration (enterprise and standalone)"],
    ["Public CAs", "The CLM platform"],
    ["Federal PKI (PIV)", "The card management system and the credentialing office"],
  ], { x: 5.45, fontSize: 12.5 });
  callout(s, "CLM", 5.25, 1.25, "FaKey", HEX.amber, "CyberArk Certificate Manager, Self-Hosted: ",
    "its CA account holds Issue and Manage Certificates, so it's in the ESC7 review. The SaaS edition had no FedRAMP listing on Oct. 20, 2026, so it runs inside the program's boundary.");
  sources(s, "Sources: GSA IDManagement.gov, FPKI 101; NIST FIPS 201-3; Microsoft Learn — third-party smart card logon; CyberArk — Microsoft CA driver; Palo Alto Networks; FedRAMP Marketplace dataset (Oct. 20, 2026). Book 07, Ch 04.");
  notes(s,
`PIV certificates aren't issued by Cloud PKI or by the program's AD CS, and the migration doesn't change their issuer. The Federal PKI's root for the federal government is the Federal Common Policy CA G2, and shared service providers are contracted to issue the certificates on PIV cards. What the target PKI has to do for PIV is trust, not issue. Distribute the federal root, because it isn't in the Microsoft, Mozilla or Apple trust stores by default: an Intune trusted certificate profile for managed devices, Group Policy for domain members. Keep NTAuth right while the domain exists, because smart card logon with certificates from a non-Microsoft CA needs that issuing CA in NTAuth, and a certificate on every authenticating domain controller. And upload the chain to Entra ID, which validates PIV certificates against its trust store.

Then lifecycle. Cloud PKI and Intune issue, renew and revoke what they put on managed devices. Everything else is the lifecycle platform's job, and for this program it's CyberArk Certificate Manager, now part of Palo Alto Networks, from the program's existing machine-identity vendor; the program doesn't add a second lifecycle vendor.

Two facts shape how it's deployed. Its CA account is privileged: to enroll through a Microsoft CA it holds Read, Issue and Manage Certificates, and Request Certificates, so it falls under the ESC7 review. And in the FedRAMP Marketplace dataset as of October 20, 2026, none of Palo Alto Networks' authorized packages is Certificate Manager or Next-Generation Trust Security. Until one is, the program deploys Certificate Manager, Self-Hosted inside its own authorization boundary. That's a program decision, to revisit when the Marketplace changes.`,
  "Book 07, Chapter 04 — The Target PKI, \"Federal PKI for PIV\" and \"Certificate lifecycle management.\"");
}
endModule("Module 2");

// ================================================================== 17 Module 3 divider
{
  const s = divider(P2, "Module 3: Device and user certificates", "Part 2 — Issuing, migrating and retiring  ·  Chapter 06",
    ["Intune trusted certificate, SCEP and PKCS profiles", "Strong certificate mapping under KB5014754", "Entra CBA: trust, bindings, factors and staged rollout"], 12);
  notes(s,
`Module 3: device and user certificates. Intune puts certificates on devices. Entra ID decides whether a certificate proves who someone is. Those are two jobs, and each one fails differently.

When Intune delivery fails, a device has no certificate and Wi-Fi, VPN or an application refuses it. The failure is local and visible in the profile report. When Entra certificate-based authentication goes wrong, the danger is the opposite: a certificate that should fail might pass, because the trust store holds too much, revocation isn't configured, or a binding is weak. Keep the two jobs apart in planning. They meet at one point, a user certificate delivered by Intune and then used to sign in, and that's where most migration surprises come from.`,
  "Book 07, Chapter 06 — Device and User Certificates: Intune and Entra CBA, \"Two jobs, two failure modes.\"");
}

// ================================================================== 18 Delivery paths
{
  const s = D.content(P2, "Three delivery paths, one trusted certificate profile first");
  tag(s, "How");
  box(s, "Trusted", 0.6, 1.5, 12.15, 0.8, HEX.grey);
  txt(s, "Trusted text", [
    { text: "Deploy first — trusted certificate profile:  ", options: { bold: true, color: HEX.navy } },
    { text: "root and issuing CA certificates as DER .cer, one profile per platform; for BYOCA, every CA in the private chain plus the BYOCA issuing CA. No trusted root, no SCEP or PKCS." },
  ], { x: 0.8, y: 1.5, w: 11.8, h: 0.8, fontSize: 13.5, valign: "middle" });
  flow(s, "Paths", 2.5, 2.75, [
    { head: "SCEP with Cloud PKI", body: "Device makes the key and request; the Cloud PKI registration authority checks the Intune challenge; the issuing CA signs. No on-premises servers. Don't mix NDES and Cloud PKI URLs in one profile." },
    { head: "SCEP with AD CS", body: "NDES is the registration authority; the Certificate Connector adds the policy module that checks the challenge. The key stays on the device.", color: HEX.slate, tint: HEX.grey },
    { head: "PKCS with AD CS", body: "The connector generates the key on its own server and returns a PFX; the template must allow export. Program preference: SCEP wherever either fits.", color: HEX.amber, tint: HEX.amberTint },
  ], 12.5);
  callout(s, "Challenge", 5.4, 1.1, "FaLock", HEX.teal, "Why SCEP is safe on the internet: ",
    "Intune wraps each request in an encrypted, signed challenge, and the registration authority rejects any subject or SAN that doesn't match what Intune expected.");
  sources(s, "Sources: Microsoft Learn — trusted root profiles; Cloud PKI overview; configure BYOCA; SCEP infrastructure; PKCS profiles. Book 07, Ch 06.");
  notes(s,
`Every other profile depends on the trusted certificate profile. It deploys the public certificate of the root and of intermediate or issuing CAs, so the device can build the chain. Export each CA certificate as a DER-encoded file, never the private key, and create one profile per platform. With Cloud PKI, that's the Cloud PKI root and issuing CAs. With BYOCA, it's every CA in the private hierarchy as well as the BYOCA issuing CA, on every platform. If a device doesn't trust the root, the SCEP or PKCS profile fails.

Then three paths. SCEP with Cloud PKI: the device generates its own key pair and request; the old guide said Intune generates it, and it doesn't. The Cloud PKI registration authority checks the request against the Intune challenge, and the issuing CA signs. No on-premises CA, NDES server or connector. Don't mix NDES and Cloud PKI SCEP URLs in one profile.

SCEP with AD CS runs through two pieces of on-premises software: NDES as the registration authority, and the Certificate Connector, which adds the Intune policy module. The private key still never leaves the device.

PKCS doesn't use NDES. The connector generates the key pair on its own server, requests the certificate, and hands the certificate and key to Intune as a PFX. So the template must allow export, and the private key exists, however briefly, somewhere other than the device that uses it. That's the trade PKCS makes for not needing NDES, and it's why the program prefers SCEP wherever a use case allows either.`,
  "Book 07, Chapter 06 — Device and User Certificates, \"The trusted certificate profile comes first,\" \"SCEP profiles,\" \"PKCS and imported PKCS profiles.\"");
}

// ================================================================== 19 NDES, connector, use cases
{
  const s = D.content(P2, "NDES and the connector, and which profile for which use");
  tag(s, "How");
  panel(s, "NDES", 0.6, 1.5, 4.85, 4.95, HEX.slate, HEX.grey, "AD CS THROUGH NDES", "Strict infrastructure rules", [
    "Enterprise CA only; NDES server domain-joined, same forest, not a DC, not the CA",
    "Reverse proxy with passthrough preauthentication",
    "SCEP template: subject in the request, Enroll for the NDES account only",
    "Connector holds Issue and Manage Certificates: CA administrative tier",
    "Three templates per NDES server; no clustering; RA certificates expire",
    "Connector 6.2510.3.3007 (May 18, 2026) is current; let it auto-update",
  ], 12);
  table(s, "Uses", 1.5, [2.65, 2.0, 2.4], ["Use case", "Profile", "Issuer"], [
    ["Wi-Fi 802.1X, device or user", "Trusted + SCEP", "Cloud PKI"],
    ["VPN client authentication", "Trusted + SCEP", "Cloud PKI, or AD CS via NDES"],
    ["Web application mTLS client", "Trusted + SCEP", "Cloud PKI"],
    ["User certificate for Entra CBA", "Trusted + SCEP", "Cloud PKI or AD CS"],
    ["S/MIME signing", "PKCS", "AD CS or existing CA"],
    ["S/MIME encryption", "Imported PKCS", "Existing CA with key archival"],
    ["Certificate logon to AD", "SCEP or PKCS with the SID", "AD CS, or a CA in NTAuth"],
  ], { x: 5.7, fontSize: 12 });
  sources(s, "Sources: Microsoft Learn — SCEP infrastructure; Entra joined on-premises SSO with certificates; NDES enrollment agent renewal; Certificate Connector overview; PKCS profiles; Entra join planning. Book 07, Ch 06.");
  notes(s,
`When the issuer is AD CS, the infrastructure rules are strict. The CA must be an enterprise CA; a standalone CA isn't supported. The NDES and connector server is domain-joined in the same forest, and is neither a domain controller nor the issuing CA. Publishing NDES to the internet needs a reverse proxy with passthrough preauthentication. The SCEP template supplies the subject in the request, which is exactly the setting Chapter 03 treats as dangerous; here the policy module enforces the subject, so the template is safe only while Enroll is limited to the NDES service account. Audit that ACL like any other. And the connector's Issue and Manage Certificates right is a CA officer right, so the connector server belongs in the CA's administrative tier.

NDES picks a template by the request's purpose, so one server serves at most three templates. It can't be clustered; for availability, run several identical servers. Its own two registration-authority certificates expire like any other and are a frequent cause of outages.

Keep the connector current. The current release is 6.2510.3.3007, from May 18, 2026. Let it update itself and alert on Warning or Error.

Which profile for which use. Wi-Fi, VPN, web application client certificates and user certificates for Entra CBA are trusted plus SCEP, from Cloud PKI, or from AD CS while a relying party trusts only AD CS. S/MIME signing is PKCS; S/MIME encryption is imported PKCS from a CA with key archival, because old mail needs the old keys. And a user certificate for certificate logon to AD needs the SID added, from AD CS or a CA in NTAuth.`,
  "Book 07, Chapter 06 — Device and User Certificates, \"SCEP with AD CS through NDES,\" \"Keep the connector current,\" \"Which profile for which use.\"");
}

// ================================================================== 20 Strong mapping
{
  const s = D.content(P2, "Strong certificate mapping: Full Enforcement is the present");
  tag(s, "What");
  const b = table(s, "Phases", 1.5, [1.9, 4.2], ["Date", "KB5014754 phase"], [
    ["May 10, 2022", "Compatibility mode: strong preferred, weak allowed with warnings"],
    ["April 11, 2023", "The Disabled setting is ignored"],
    ["Feb. 11, 2025", "Full Enforcement where no value is set; Compatibility still selectable"],
    ["Sept. 9, 2025", "Registry key no longer honored; no way back"],
  ], { fontSize: 12.5 });
  table(s, "Events", b + 0.2, [1.1, 5.0], ["KDC event", "Meaning (2008-era DCs log 41, 48, 49)"], [
    ["39", "No strong mapping found"],
    ["40", "Certificate predates the account; no strong mapping"],
    ["41", "SID extension doesn't match the account's SID"],
  ], { fontSize: 12.5 });
  panel(s, "Needs", 6.95, 1.5, 5.8, 4.95, HEX.navy, HEX.navyTint, "WHAT INTUNE PROFILES NEED", "Strong from day one", [
    "Strong forms: the SID extension, the SID in a SAN URL, or IssuerSerialNumber, SKI or SHA1PublicKey on the account",
    "SCEP: SAN URI attribute {{OnPremisesSecurityIdentifier}}; Cloud PKI too",
    "PKCS: current connector with EnableSidSecurityExtension = 1",
    "User certificates on all platforms; device certificates only on hybrid joined Windows",
    "Logon CAs must be in NTAuth; pilot with a new profile, because editing one revokes",
  ], 12.5);
  sources(s, "Sources: Microsoft Support — KB5014754 (phases; Kdcsvc events 39–41, and 41/48/49 on Server 2008 and 2008 R2); Microsoft Learn — SCEP and PKCS profiles; third-party smart card logon; remove certificates. Book 07, Ch 06.");
  notes(s,
`Before May 2022, a domain controller mapped a certificate to an account by name. KB5014754 changed the KDC to want a strong mapping. The old guide said enforcement began in February 2025; that was one step of four. May 2022, Compatibility mode. April 2023, the Disabled setting is ignored. February 11, 2025, Full Enforcement for domain controllers with no value set. September 9, 2025, the registry key is no longer honored. As of October 2026, every current domain controller is in Full Enforcement with no supported way back.

A strong mapping is the SID extension AD CS adds, the SID in a tagged SAN URL, which is Intune's form, or an explicit strong value on the account, such as issuer and serial number, SKI or SHA-1 public key.

What Intune profiles need. It applies to user certificates on all platforms and to device certificates only on hybrid joined Windows devices, and the user or device must be synced from AD. For SCEP, add a SAN attribute of type URI with the on-premises security identifier variable. The old guide said Cloud PKI adds it automatically; Microsoft's instructions say you must add it. For PKCS, run the current connector and set the SID security extension registry value. Logon certificates need their issuing CA in NTAuth. Pilot with a new profile, because editing a SCEP profile revokes what it issued.

To find weak certificates, sweep the KDC's System log for events 39, 40 and 41. One trap on a mixed estate: on Server 2008 and 2008 R2, event 41 means no strong mapping, and the other two are logged as 48 and 49. Read the event text before you classify a hit.`,
  "Book 07, Chapter 06 — Device and User Certificates, \"Strong certificate mapping (KB5014754).\"");
}

// ================================================================== 21 CBA flow, trust store, revocation
{
  const s = D.content(P2, "Entra CBA: the sign-in, the trust store and revocation");
  tag(s, "How");
  flow(s, "Signin", 1.5, 1.75, [
    { head: "1 Username", body: "Home realm discovery; Use a certificate or smart card" },
    { head: "2 mTLS", body: "certauth endpoint requests the client certificate" },
    { head: "3 Validate", body: "Chain against the trust store; CRL checked" },
    { head: "4 Bind", body: "Username bindings find exactly one user" },
    { head: "5 Factor", body: "Single- or multifactor, against Conditional Access" },
  ], 12);
  panel(s, "Store", 0.6, 3.45, 5.95, 2.95, HEX.navy, HEX.navyTint, "TRUST STORE", null, [
    "Upload every CA in the user-certificate chain to the PKI-based store: 250 CAs, 8 KB each",
    "Privileged Authentication Administrator; bulk .p7b upload needs P1 or P2",
    "Every CA you add can authenticate any user it can be bound to",
  ], 12.5);
  panel(s, "CRL", 6.8, 3.45, 5.95, 2.95, HEX.red, HEX.redTint, "REVOCATION", null, [
    "One CRL per CA, internet HTTP or HTTPS (HTTP recommended); no OCSP, no LDAP",
    "Downloaded in 10 seconds; 20 MB commercial and GCC, 45 MB Azure Government",
    "Cached until next update: revoke sessions for an immediate cutoff",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Entra CBA technical concepts; set up Entra CBA; Entra CBA CRL; What is Entra CBA (unsupported scenarios). Book 07, Ch 06.");
  notes(s,
`How a CBA sign-in works, as Microsoft documents it. The user enters a username; Entra ID performs home realm discovery and offers Use a certificate or smart card. The client is redirected to the certificate authentication endpoint, certauth dot login dot microsoftonline dot com in the commercial cloud, which includes GCC, and the dot us endpoint in Azure Government. It requests the client certificate in a mutual-TLS handshake. Entra ID checks the chain and the CRL, and finds one user through the username bindings. If Conditional Access requires MFA and the certificate counts as multifactor, the user is signed in; if it's single-factor, Entra offers a registered second factor. Allow the endpoint through proxies and turn off TLS inspection for it, or the client certificate never reaches Entra ID.

The trust store. Upload every CA in the chain that issues user certificates. Microsoft highly recommends the PKI-based trust store, which holds up to two hundred fifty CAs. Managing it takes Privileged Authentication Administrator, and bulk upload needs P1 or P2. The trust store is also a blast radius: adding a CA lets any certificate it issues authenticate any user it can be bound to.

Revocation. Set each CA's base CRL URL, and the delta if published; without one, a revoked certificate still authenticates, so turn on Require CRL validation. Entra ID supports one CRL endpoint per CA over HTTP or HTTPS, with HTTP recommended, downloaded within ten seconds. It doesn't support OCSP. Interactive sign-in downloads CRLs up to twenty megabytes in the commercial cloud including GCC, and forty-five in Azure Government. And it caches the CRL until its next update, so revoke the user's sessions when revocation must be immediate.`,
  "Book 07, Chapter 06 — Device and User Certificates, \"How a CBA sign-in works\" and \"The trust store.\"");
}

// ================================================================== 22 Bindings and factors
{
  const s = D.content(P2, "Username bindings, affinity and factors");
  tag(s, "What");
  table(s, "Affinity", 1.5, [1.5, 4.4], ["Affinity", "Bindings to certificateUserIds"], [
    [{ text: "High", options: { color: HEX.teal } }, "SKI, SHA1PublicKey, IssuerAndSerialNumber"],
    [{ text: "Low", options: { color: HEX.red } }, "PrincipalName, RFC822Name, Subject, IssuerAndSubject"],
  ], { fontSize: 13 });
  panel(s, "Eval", 0.6, 2.85, 5.9, 3.6, HEX.navy, HEX.navyTint, "HOW ENTRA EVALUATES THEM", null, [
    "Priority order, lowest number first; only Graph shows it",
    "Requiring high affinity drops every low-affinity binding",
    "CBA is only as secure as the lowest-affinity binding: one low at most",
    "Production requires high affinity; set it only when certificateUserIds is correct",
  ], 12.5);
  panel(s, "Factor", 6.75, 1.5, 6.0, 4.95, HEX.amber, HEX.amberTint, "SINGLE OR MULTIFACTOR", "The authentication binding policy", [
    "Default single-factor; rules by issuer, policy OID, or both",
    "Issuer-and-OID beats OID, OID beats issuer; mixed results count as single-factor",
    "Multifactor only if a PIN or biometric protects the key: a PIV card, not a software certificate",
    "A derived credential with its own OID needs its own rule",
    "Target CBA to groups that hold certificates, never All users; keep a TAP path",
    "CBA needs no premium license; Conditional Access needs P1",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Entra CBA technical concepts; set up Entra CBA; Entra licensing. Book 07, Ch 06; Book 03, Ch 09.");
  notes(s,
`Username bindings map a certificate field to a user attribute. By default the SAN principal name maps to the user principal name. Microsoft classes subject key identifier, SHA-1 public key, and issuer and serial number as high affinity, and principal name, email, subject, and issuer and subject as low. The old guide classed issuer plus subject as high; Microsoft classes it as low, because a CA can issue several certificates with the same subject.

How Entra ID evaluates them. In priority order, lowest number first, and only Graph shows the priority. If the tenant or a custom rule requires high affinity, every low-affinity binding is dropped. So with several bindings, CBA is only as secure as the lowest-affinity one. Configure one low-affinity binding at most. The program's position: production tenants require high affinity, using issuer and serial number or SKI in certificate user IDs. Low-affinity UPN binding is acceptable in a pilot. But setting the tenant-wide requirement to high before every user's values are correct locks those users out.

The authentication binding policy decides one factor or two. The default is single-factor; rules can be by issuer, by policy OID, or both. Issuer-and-OID rules beat OID rules, and OID rules beat issuer rules; a certificate whose OIDs map to both is single-factor. Microsoft says to treat a certificate as multifactor only if a PIN or biometric protects it, so a PIV card qualifies and a software certificate doesn't.

Two rules prevent lockout. Target CBA to groups that hold valid certificates, never All users, and give people without a certificate another path, such as a Temporary Access Pass. CBA itself needs no premium license; Conditional Access, which every real deployment uses, needs P1.`,
  "Book 07, Chapter 06 — Device and User Certificates, \"Username bindings and affinity,\" \"Single-factor and multifactor certificates,\" \"Conditional Access.\"");
}

// ================================================================== 23 Staged rollout and AD FS
{
  const s = D.content(P2, "Staged rollout, and moving off AD FS");
  tag(s, "How");
  panel(s, "SRO", 0.6, 1.5, 5.95, 4.95, HEX.teal, HEX.tealTint, "STAGED ROLLOUT", "A test mechanism, not a mixed state", [
    "Synced users only; browser and modern authentication only",
    "Up to 10 groups per feature; no nested or dynamic groups",
    "200 users when a group is first added; later changes take up to 24 hours",
    "Password sign-in for CBA pilot users needs password hash sync",
    "Separate groups for the CBA method and for staged rollout",
    "Issue a TAP after adding a user, to skip the extra federated sign-in",
  ], 12.5);
  panel(s, "ADFS", 6.8, 1.5, 5.95, 4.95, HEX.navy, HEX.navyTint, "FROM AD FS TO ENTRA CBA", "Only the check point moves", [
    "Trust parity: every AD FS-trusted CA in the Entra store, with internet CRLs",
    "Binding parity: claim rules become bindings; sync altSecurityIdentities",
    "Protect the sync path: Entra Connect admins can change bound values",
    "Keep staged rollout short: federation risk lasts until conversion",
    "Record and back up the federation configuration first",
    "Conversion is reversible while the AD FS farm can be restored",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Staged rollout; Migrate from federation to Entra CBA; Migrate from federation to cloud authentication. Book 07, Ch 06; Appendix A.2.");
  notes(s,
`Staged rollout lets synchronized users in a federated domain sign in at Entra ID with CBA instead of being sent to AD FS, while everyone else stays federated. Microsoft is explicit that it's a temporary testing mechanism, not a permanent mixed state, and its limits are tighter than the old guide implied. It applies only to users synced by Entra Connect, and only to browser and modern authentication; legacy authentication still goes to the federation server. Up to ten groups per feature, and no nested or dynamic groups. A group added for the first time is limited to two hundred users, and later membership changes take up to twenty-four hours. Password sign-in for CBA pilot users works only with password hash sync. And issue a Temporary Access Pass right after adding a user, so the first sign-in doesn't fall back to the federation server.

The program pilots with cloud groups of ten to twenty users, confirms in the sign-in log which binding matched and what level was granted, and grows in steps until the domain converts.

Moving off AD FS certificate authentication doesn't change the credential or the PKI; only the place where authentication and revocation are checked moves. Get trust parity, with internet-reachable CRLs. Get binding parity, syncing account mappings to certificate user IDs where AD FS used them, and protect that sync path. Keep staged rollout short, because staged users stay exposed to a federation server compromise until the domain converts. Record the federation configuration and back up the farm. And the old guide called conversion one-way; it isn't. Microsoft's rollback is to re-federate, which works only while AD FS can still be brought back.`,
  "Book 07, Chapter 06 — Device and User Certificates, \"Staged rollout\" and \"Migrating from AD FS certificate authentication\"; Appendix A, checklist A.2.");
}
endModule("Module 3");

// ================================================================== 24 Module 4 divider
{
  const s = divider(P2, "Module 4: Coexistence, migration and retirement", "Part 2 — Issuing, migrating and retiring  ·  Chapters 07–08, Appendices A–B",
    ["Coexistence rules, two-way trust and CRL reachability", "Six gated waves and the template migration matrix", "Renewal, monitoring, decommissioning and evidence"], 12);
  notes(s,
`Module 4: coexistence, migration and retirement. Coexistence isn't a phase at the end of the project; it's the condition the project runs in. From the day the first Cloud PKI certificate is issued until the last AD CS-dependent workload retires, devices carry certificates from both issuers, relying parties trust both chains, and two sets of CRLs have to stay reachable.

For most of the migration, both PKIs are production. The plan has to say which one each certificate comes from on any given day, and how to go back. Then, after the migration, the work becomes keeping every certificate owned, renewed and checkable, and retiring the old CAs without stranding a single one.`,
  "Book 07, Chapter 07 — Coexistence and Migration; Chapter 08 — Lifecycle, Monitoring and Decommissioning.");
}

// ================================================================== 25 Coexistence rules and trust
{
  const s = D.content(P2, "Coexistence: five rules and trust in both directions");
  tag(s, "How");
  panel(s, "Rules", 0.6, 1.5, 4.9, 4.95, HEX.navy, HEX.navyTint, "THE COEXISTENCE RULES", null, [
    "One issuer per use case per population",
    "Trust goes up before issuance moves",
    "Revocation reachable wherever validation happens",
    "Nothing is revoked to force a move",
    "Every move has a tested rollback that doesn't depend on what it retired",
  ], 13.5);
  table(s, "Trust", 1.5, [2.25, 4.75], ["Direction", "How"], [
    ["AD CS into Entra ID", "Root and every intermediate and issuing CA in the trust store, each with an internet CRL"],
    ["Cloud chain into the forest", "GPO trusted roots, or publish RootCA to the directory; BYOCA adds the issuing CA to the intermediate store"],
    ["NTAuth", "Only for CAs that issue logon certificates, and only with strongly mapped profiles"],
    ["Each forest", "Its own distribution and NTAuth entry; one Entra trust store"],
  ], { x: 5.75, fontSize: 12 });
  txt(s, "Stays", [
    { text: "Stays on AD CS until AD retires: ", options: { bold: true, color: HEX.amber } },
    { text: "DC certificates from a Kerberos Authentication copy (Client, Server and KDC Authentication; HTTP CRL first for Entra-joined devices), LDAPS, and NPS and other server certificates." },
  ], { x: 5.75, y: 4.2, w: 7.0, h: 2.25, fontSize: 14, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — Windows Hello DC certificate guidance; Entra joined SSO; LDAPS certificates; set up Entra CBA; GPO certificate distribution; certutil -dspublish; NTAuth import. Book 07, Ch 07.");
  notes(s,
`The program's coexistence rules. Each use case has one issuer at a time per population: a device group gets its Wi-Fi certificate from AD CS or from Cloud PKI, never both by design. Trust goes up before issuance moves: a relying party trusts the new chain before the first certificate from it reaches anything that relying party sees. Revocation must be reachable wherever validation happens. Nothing is revoked to force a move: an AD CS certificate is replaced at renewal or expiry. And every move has a tested rollback that doesn't depend on something the move retired.

What stays on AD CS until Active Directory retires. Domain controller certificates, because Cloud PKI doesn't issue to servers. Use a copy of the Kerberos Authentication template. Entra-joined devices can't read a CRL from AD before they authenticate, so publish an HTTP CRL listed first. LDAPS stays too; the old guide said it could move to Cloud PKI, but an LDAPS endpoint is a server. Other server certificates stay on AD CS as well, renewed through CyberArk Certificate Manager, as Chapter 04 decided. NPS needs care: it must trust the Cloud PKI chain before the first pilot device gets a cloud Wi-Fi certificate, and keep trusting AD CS until the last AD CS client certificate expires.

Trust runs both ways. AD CS into Entra ID: upload the root and every intermediate and issuing CA, each with an internet-facing CRL; that's also what lets AD FS certificate authentication move without reissuing anything. The cloud chain into the forest: by Group Policy or by publishing to the directory. NTAuth only for CAs that will issue logon certificates. And each forest needs its own distribution, while every forest's user-issuing root goes into the single Entra trust store.`,
  "Book 07, Chapter 07 — Coexistence and Migration, \"Two PKIs, one estate,\" \"What stays on AD CS,\" \"Trust in both directions.\"");
}

// ================================================================== 26 CRL availability
{
  const s = D.content(P2, "CRL availability: outages are revocation outages");
  tag(s, "What");
  const b = table(s, "CRLs", 1.5, [2.65, 3.0, 3.1, 3.4], ["CA", "Where its CRL lives", "Who must reach it", "Watch for"], [
    ["Cloud PKI root and issuing", "Intune-hosted; seven days, republished every 3.5", "Every relying party, including on-premises RADIUS and VPN", "Outbound HTTP from RADIUS and VPN servers to the Intune CDP and AIA"],
    ["BYOCA issuing CA", "Intune-hosted", "As above", "Parent CRL and AIA come from the private CA; AD CS defaults to LDAP AIA"],
    ["AD CS CAs for CBA user certificates", "Often LDAP plus an internal HTTP URL", "Entra ID, over the internet: one HTTP (or HTTPS) URL per CA", "Internal-only URLs; CRLs over 20 MB (commercial and GCC) or 45 MB (Azure Government)"],
    ["AD CS behind DC certificates", "As above", "Entra-joined devices, before authentication", "LDAP-only CDPs: publish an HTTP CDP first"],
  ], { fontSize: 12 });
  callout(s, "Fix", b + 0.15, 6.5 - b - 0.15, "FaRoute", HEX.amber, "Fixing a CDP: ",
    "add an internet HTTP location; only certificates issued after the change carry it. Entra uses the URL in its trust store, so CBA works at once. Publish on plain anonymous HTTP, not an app proxy.");
  sources(s, "Sources: Microsoft Learn — Cloud PKI overview; configure BYOCA; Entra CBA CRL; set up Entra CBA; Entra joined SSO CRL requirements. Book 07, Ch 07.");
  notes(s,
`Most coexistence outages are revocation outages. Relying parties now sit in three places, inside the network, on the internet, and in Entra ID, and each CA's CRL must be reachable from all three wherever its certificates are validated.

Every relying party that validates Cloud PKI certificates, including on-premises RADIUS and VPN servers, needs outbound HTTP to the Intune-hosted CDP and AIA. A BYOCA issuing CA's own CRL is Intune-hosted too, but its parent CRL and AIA come from the private CA, and AD CS defaults to an LDAP AIA location. AD CS CAs that issue user certificates for Entra CBA usually publish over LDAP plus an internal HTTP URL; Entra ID needs one internet HTTP or HTTPS URL per CA, HTTP recommended, with no OCSP and no LDAP, and watch the CRL size limits, twenty megabytes for commercial and GCC and forty-five for Azure Government. And the CAs behind domain controller certificates must serve Entra-joined devices that haven't authenticated yet, so LDAP-only distribution points break them.

Fixing an AD CS distribution point means two things. Add an HTTP location reachable from the internet, using HTTP rather than HTTPS. And recognize that the new URL appears only in certificates issued after the change. Entra ID uses the CRL URL configured in its trust store, not the one inside each certificate, so CBA works as soon as the trust store points at the published CRL; other relying parties keep failing until their certificates renew. The program publishes on plain anonymous HTTP, not through an application proxy, because Entra ID must download the CRL without authentication within ten seconds.`,
  "Book 07, Chapter 07 — Coexistence and Migration, \"CRL availability.\"");
}

// ================================================================== 27 Six waves
{
  const s = D.content(P2, "Six gated waves, each with a tested rollback");
  tag(s, "How");
  const b = table(s, "Waves", 1.5, [1.85, 1.0, 4.85, 4.45], ["Wave", "Weeks", "Exit gate", "Rollback"], [
    ["1 Assess", "1–4", "Every template classified; Critical and High findings remediated and re-tested; PKI owner and security sign off", "None needed: the wave reads"],
    ["2 Foundation", "5–8", "Issuing CA active; trust profiles on 99% of devices; test certificate valid everywhere; CRLs reachable from all three places", "Unassign trust; remove CAs from Entra; delete a Cloud PKI CA last"],
    ["3 Pilot", "9–16", "95% issuance success; CBA at the intended level; every pilot relying party accepts the chain", "Remove SCEP assignments: devices fall back to AD CS certificates"],
    ["4 Scale", "17–28", "Cloud certificates for every MIGRATE use case; AD CS autoenrollment removed per ring", "Per ring: re-link autoenrollment, then remove SCEP"],
    ["5 Cutover", "29–36", "Domains managed; AD FS certificate authentication off", "Re-federate; four-hour objective while AD FS is restorable (30 days)"],
    ["6 Decommission", "37–44", "MIGRATE-only components retired; root retained and documented", "Restore the CA from backup: plan 8–12 hours"],
  ], { fontSize: 11.5 });
  callout(s, "Revoke", b + 0.12, 6.5 - b - 0.12, "FaArrowsRotate", HEX.red, "Removing a profile revokes: ",
    "unassigning or editing a SCEP profile revokes its certificates on Windows and Apple platforms, so autoenrollment stays on until each wave's exit gate.");
  sources(s, "Sources: Microsoft Learn — remove SCEP or PKCS certificates; staged rollout; migrate from federation; AD FS decommission guide; Cloud PKI in-place renewal. Thresholds and durations are program figures. Book 07, Ch 07; App. A.");
  notes(s,
`The migration runs as six waves. Each wave's exit gate is the next one's entry gate, and each has its own rollback. The durations are program planning figures for a single-forest estate, not commitments; scale them to the wave 1 inventory. Appendix A turns each wave into a checklist with an owner and a verification per line.

Wave 1, Assess, weeks one to four: inventory every CA and template, run the Chapter 03 checklist, classify every template, list every relying party, and run the strong-mapping sweep. It reads, so it needs no rollback. Wave 2, Foundation: create the Cloud PKI CAs with licensed keys, upload user-issuing CAs to the Entra trust store, deploy trust profiles and the cloud chain to domain-joined relying parties, and test. The gate is trust profiles on at least ninety-nine percent of managed devices and every CRL reachable from inside, outside and Entra. Wave 3, Pilot, fifty to a hundred devices: Wi-Fi then VPN, then CBA through staged rollout, with AD CS autoenrollment left on so the rollback works. The gate is ninety-five percent issuance success. Wave 4, Scale, in rings; remove autoenrollment for each ring once its cloud certificates are accepted. Wave 5, Cutover: record federation settings, convert domains starting with the smallest, and keep AD FS restorable for thirty days, which is what makes the four-hour recovery objective achievable. Wave 6, Decommission.

The rules across waves: rehearse each rollback in a test scope first, and never let a rollback depend on a component the same wave retires. Removing or editing a SCEP profile revokes its certificates on Windows and Apple platforms, so treat profile changes as changes with impact.`,
  "Book 07, Chapter 07 — Coexistence and Migration, \"Renewal while two issuers overlap,\" \"The migration playbook,\" \"Rollback rules\"; Appendix A, checklist A.1.");
}

// ================================================================== 28 Template matrix
{
  const s = D.content(P2, "The template matrix: classify by what was actually issued");
  tag(s, "Who");
  table(s, "Matrix", 1.5, [2.75, 2.1, 3.0], ["AD CS template", "Class", "Target"], [
    ["User; Computer and Workstation", "MIGRATE (servers BRIDGE)", "Cloud PKI SCEP, SID URI where used against AD"],
    ["Web Server", "RETAIN", "AD CS or public CA, via CyberArk Certificate Manager"],
    ["Kerberos Authentication; LDAPS", "BRIDGE", "AD CS until the last DC; the DC certificate serves LDAPS"],
    ["Domain Controller (older)", "BRIDGE, then superseded", "A Kerberos Authentication copy"],
    ["RAS and IAS Server", "BRIDGE", "AD CS while NPS runs, renewed via CyberArk"],
    ["Exchange Signature Only", "MIGRATE (delivery)", "Intune PKCS profile from AD CS"],
    ["Exchange User", "MIGRATE (delivery); RETAIN (issuer)", "Imported PKCS; the existing CA keeps issuing"],
    ["Basic EFS; EFS Recovery Agent", "RETIRE (agent last)", "None; keep recovery keys while data remains"],
    ["Enrollment Agent; OCSP Response Signing", "RETIRE, conditionally", "When no workflow or OCSP consumer remains"],
  ], { fontSize: 11.5 });
  panel(s, "Ready", 8.65, 1.5, 4.1, 4.95, HEX.teal, HEX.tealTint, "BEFORE A MIGRATE ROW MOVES", "Wave 4's per-ring exit test", [
    "Every relying party trusts the new chain and reaches its CRL",
    "The Intune profile issues at the program's threshold",
    "Certificates used against AD are strongly mapped",
    "Old certificates on a dated path to expiry; autoenrollment off only after that",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Cloud PKI overview; Intune platforms; PKCS profiles; certificate template concepts; Windows Hello DC certificates; LDAPS; EAP-TLS requirements; Entra CBA CRL. Book 07, Appendix B; Ch 02.");
  notes(s,
`Appendix B is the starting matrix that seeds wave 1. Classify each template by what it actually issued, not by its name.

Three facts drive most rows. Cloud PKI issues only through SCEP, only to Intune-enrolled devices, and Intune doesn't manage Windows Server, so every server certificate is BRIDGE or RETAIN, never MIGRATE. And PKCS profiles move delivery to Intune, not issuance off AD CS.

So: User, Computer and Workstation Authentication are MIGRATE for Intune-managed devices, to Cloud PKI SCEP, with the SID URI where the certificate is used against AD; servers stay on autoenrollment. Web Server is RETAIN, on AD CS or a public CA for internet-facing names, with lifecycle automation through CyberArk Certificate Manager. The old guide had it as MIGRATE to Cloud PKI; web servers aren't Intune devices. Kerberos Authentication and LDAPS are BRIDGE until the last domain controller; the domain controller certificate from the Kerberos Authentication copy serves LDAPS. The older Domain Controller templates lack the KDC Authentication OID, so they're superseded by a Kerberos Authentication copy. RAS and IAS Server stays while NPS runs, renewed through CyberArk Certificate Manager. Exchange Signature Only migrates delivery. Exchange User carries two verdicts: MIGRATE for delivery, because Intune delivers it, and RETAIN for the issuer, because the existing CA and its key history stay. EFS retires, but the recovery agent retires last: keep its certificates and keys until no encrypted data remains.

Before any MIGRATE row moves, four things must be true, and they're wave 4's per-ring exit test. Every relying party trusts the new chain and can reach its CRL. The Intune profile issues at the program's success threshold. Certificates used against Active Directory carry a strong mapping. And the template's remaining certificates are on a dated path to expiry, with autoenrollment removed only after the profile is issuing. For BRIDGE rows, record the event that ends them, so retirement is scheduled rather than forgotten.`,
  "Book 07, Appendix B — Certificate Template Migration Matrix; Chapter 02.");
}

// ================================================================== 29 Renewal and monitoring
{
  const s = D.content(P2, "Renewal at scale, monitoring and drift");
  tag(s, "How");
  table(s, "Engines", 1.5, [2.2, 3.0, 4.2], ["Renewal engine", "Covers", "What to watch"], [
    ["Intune profiles", "Certificates on Intune-managed devices", "Apple renews only inside the threshold, unlocked; a failed renewal isn't retried"],
    ["AD CS autoenrollment", "DC certificates, which also serve LDAPS", "CA online and CRL current while the class exists"],
    ["CyberArk Certificate Manager", "Server TLS incl. NPS and RADIUS, public TLS, appliances, network devices", "A Server Owner per certificate; a scoped CA account"],
  ], { fontSize: 12 });
  panel(s, "ACME", 10.15, 1.5, 2.6, 2.25, HEX.navy, HEX.navyTint, "ACME", null, [
    "Through the CLM platform: http-01, dns-01",
    "ACME service: FIPS mode off",
  ], 11.5);
  panel(s, "Drift", 0.6, 3.9, 12.15, 2.55, HEX.red, HEX.redTint, "DRIFT THE PROGRAM DETECTS, AT LEAST WEEKLY", null, [
    "Expiring within two renewal windows with no engine bound  ·  issuance outside policy (4887 for retired templates, NTAuth changes, unrecorded certificates)",
    "Missing strong mapping (no SID extension or SAN URL; event 39)  ·  a SID mismatch (event 41; 49 on 2008-era DCs) treated as a security event",
    "Trust store drift: an unapproved anchor is an SC-17(b) finding  ·  stale CRLs (AADSTS220501)  ·  posture regression in Defender for Identity",
  ], 12.5);
  sources(s, "Sources: CA/Browser Forum SC-081v3 and BRs; RFC 8555; CyberArk — Certificate Manager Self-Hosted and ACME docs (v26.1); Microsoft Learn — SCEP profiles; AD CS revocation; KB5014754; Entra CBA. Book 07, Ch 08.");
  notes(s,
`Migration ends on a date; certificates don't. Public TLS validity falls to forty-seven days from March 15, 2029. The schedule binds publicly trusted certificates, but the program aligns internal lifetimes with it as automation proves itself. The design rule: no certificate class may depend on a person remembering a date. The target has three renewal engines.

Intune profiles renew certificates on managed devices at the profile's renewal threshold, with a new key pair for SCEP. On Apple platforms, renewal happens only inside the threshold window with the device unlocked, and a failed renewal leaves the expired certificate in place without a retry. AD CS autoenrollment renews domain controller certificates, which also serve LDAPS, so the CA must stay online and its CRL current. And CyberArk Certificate Manager discovers, tracks and renews server TLS, including NPS and RADIUS servers, appliances, public TLS and network devices, with a Server Owner on every certificate.

Neither Microsoft issuer in the target offers ACME, so the program provides it through the lifecycle platform. CyberArk documents the http-01 and dns-01 challenges. One federal limit: CyberArk's installation guide says FIPS mode isn't supported for its ACME service at all, so run the ACME service on dedicated servers outside the FIPS-mode server set.

The drift checks run at least weekly and are committed to the evidence repository, because an assessor asks how long a finding stayed open. Watch for certificates within two renewal windows of expiry with no engine bound, issuance outside policy, missing strong mapping, trust store anchors that aren't approved, stale CRLs, and posture regressions. And treat a SID mismatch as a security event: it can mean the certificate was issued to a different user. That's event 41 on current domain controllers, but event 49 on Server 2008 and 2008 R2, where 41 means no strong mapping.`,
  "Book 07, Chapter 08 — Lifecycle, Monitoring and Decommissioning, \"Renewal at scale,\" \"ACME where it applies,\" \"Monitoring,\" \"Compliance and drift detection.\"");
}

// ================================================================== 30 Decommission and evidence
{
  const s = D.content(P2, "Retire AD CS last, and hand the assessor the evidence");
  tag(s, "Who");
  panel(s, "Decom", 0.6, 1.5, 5.5, 4.95, HEX.amber, HEX.amberTint, "GATE: CUTOVER DONE, 30 DAYS CLEAN, RETAINED CLASSES RUNNING", null, [
    "Confirm no dependents; stop new issuance; deny pending requests",
    "Back up and archive the database and key, password stored separately",
    "Revoke for cessation of operation; final CRL outlives the certificates",
    "Remove NDES and web services before the CA; move OCSP users to CRLs",
    "Remove the CA from Entra, Intune, GPO, NTAuth and the CLM platform",
    "Keep CDP and AIA serving until the last certificate expires; record it",
  ], 12.5);
  table(s, "Evidence", 1.5, [1.55, 4.85], ["Control", "What the assessor reads"], [
    ["IA-5(2)(a)", "TPM key storage; PKCS hosts in scope; bindings, affinity and strong-mapping event counts"],
    ["IA-5(2)(b)", "Trust store export with a CRL per CA; Require CRL validation; CRL freshness; caching"],
    ["SC-12", "Managed HSM (FIPS 140-3 Level 3); AD CS HSM keys, ceremonies, custody"],
    ["SC-17(a)", "Certificate policy, template inventory, 4886–4888, CLM records; Federal PKI for PIV"],
    ["SC-17(b)", "Entra, Intune, GPO and NTAuth anchors; trust store drift findings"],
  ], { x: 6.35, fontSize: 12 });
  sources(s, "Sources: Microsoft Learn — Decommission an enterprise CA (KB 889250); AD CS revocation and CDP changes; Managed HSM; NIST SP 800-53 Rev. 5 (IA-5(2), SC-12, SC-17). Book 07, Ch 08.");
  notes(s,
`Last, retiring AD CS, which is the program's sixth wave. It applies only to the CAs and role services that no longer serve a retained class; domain controller, LDAPS and RADIUS certificates usually keep at least one issuing CA alive for as long as domain controllers exist. The gate: cutover complete, the thirty-day rollback window passed with no incidents, and every retained class running on the CAs that remain.

Confirm nothing depends on the CA, using the lifecycle inventory and the CA database. Stop new issuance: remove the templates, unlink autoenrollment, deny pending requests. Back up the database and key, with the backup and its password through separate channels. Revoke outstanding certificates for cessation of operation, set the CRL lifetime past the remaining certificates' lifetime, and publish. Remove NDES and the web services before the CA, and move any OCSP consumers to CRL checking. Clean up trust in Entra, Intune, Group Policy, NTAuth and the lifecycle platform. Keep the CDP and AIA endpoints serving until the last certificate expires, delete templates only after every CA in the forest is gone, and commit a decommission record. Under BYOCA, the root and any CA that signed the Cloud PKI issuing CA stay.

The assessor reads NIST SP 800-53 evidence: key storage and binding settings for IA-5 enhancement two, the trust store and CRL configuration for path validation, HSM key protection for SC-12, and the certificate policy and approved trust anchors for SC-17.

So, from Monday: harden first and gate on it, choose the root deliberately, issue strongly mapped certificates, run both PKIs with reachable CRLs, and retire AD CS last, with evidence. Chapters 03 through 08 and the appendices carry the detail. Thank you.`,
  "Book 07, Chapter 08 — Lifecycle, Monitoring and Decommissioning, \"Decommissioning AD CS\" and \"The evidence an assessor reads\"; Chapters 03–07; Appendices A–B.");
}
endModule("Module 4");

// ================================================================== Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind the orientation and Module 1");
  const src = [
    "CA/Browser Forum, Ballot SC-081v3 (voting Apr. 4–11, 2025); Baseline Requirements v2.3.1 (Oct. 4, 2026), §1.2.2.  ·  NIST IR 8547 ipd (Nov. 12, 2024).  ·  OMB M-26-15 (June 24, 2026); OMB M-22-09.",
    "Microsoft Learn: What is AD CS?; Certification Authority role service; Configure a CA to use ML-DSA; Post-Quantum Cryptography in AD CS; Monitor AD CS publication health with Enterprise PKI.",
    "Microsoft Learn: Manage AD CS certificate templates; Certificate templates concepts; autoenrollment renewal (approval required for renewals); ObjectIdGroupId (certenroll.h).",
    "W. Schroeder and L. Christensen, SpecterOps, Certified Pre-Owned (June 2021), cited for the ESC class names only.",
    "Microsoft Learn: Defender for Identity — Security assessment: Certificates; security posture assessments; configure Windows event auditing; US Government offerings; alerts in Defender format.",
    "Microsoft Learn: Secure, delegate and audit CA administration; Audit Certification Services; Review and dispose of pending requests; certutil; Windows security baseline (Audit Directory Service Changes).",
    "Microsoft Learn: X509CertificateTemplateSubjectNameFlag and ms-PKI-Certificate-Name-Flag.  ·  Microsoft Support: KB5014754; KB5005413 (NTLM relay on AD CS).",
    "Microsoft Learn: Cloud PKI overview, deployment models and configure CA; SCEP profiles; SCEP infrastructure (revocation permissions).",
    "Microsoft Learn: Entra CBA technical concepts; CBA CRL; What is Entra CBA; custom authentication strengths; Entra releases and announcements (April 2026, CA scoping).",
    "Full footnotes with links and access dates: Book 07, Chapters 01–03 (whalermike.github.io/modernization-workbook/docs/books/b07-pki/).",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}
{
  const s = D.content("Backup", "Sources behind Module 2 — The target PKI");
  const src = [
    "Microsoft Learn: Microsoft Cloud PKI fundamentals; Overview of Microsoft Cloud PKI (prerequisites, features, architecture, trial, limitations); Cloud PKI deployment models.",
    "Microsoft Learn: Configure root and issuing CA for Cloud PKI; Configure Cloud PKI — Bring your own CA; Renew a certificate authority in Cloud PKI.",
    "Microsoft Learn: Intune supported operating systems and browsers; Intune Suite add-on capabilities; Intune planning guide (costs and licensing); Intune for US Government GCC High and DoD.",
    "Microsoft Learn: What's new in Microsoft Intune, weeks of June 29, 2026 (2606) and September 28, 2026 (2609).",
    "Microsoft Learn: What is Entra CBA (unsupported scenarios); Entra CBA CRL; Guidelines for smart card logon with third-party CAs; Manage AD CS certificate templates.",
    "GSA IDManagement.gov, Federal Public Key Infrastructure 101.  ·  NIST FIPS 201-3, PIV of Federal Employees and Contractors (Jan. 2022).",
    "CyberArk documentation v26.1: Microsoft ADCS — Enterprise and Standalone (Trust Protection Foundation CA template).",
    "Thoma Bravo, CyberArk completes acquisition of Venafi (Oct. 1, 2024).  ·  Palo Alto Networks, completes acquisition of CyberArk (Feb. 11, 2026), Form 8-K Ex. 99.1.",
    "Palo Alto Networks, CyberArk Certificate Manager is now Next-Generation Trust Security.  ·  GSA, FedRAMP Marketplace product dataset (last changed Oct. 20, 2026).",
    "Full footnotes with links and access dates: Book 07, Chapter 04.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}
{
  const s = D.content("Backup", "Sources behind Module 3 — Device and user certificates");
  const src = [
    "Microsoft Learn: Trusted root certificate profiles; Create and assign SCEP certificate profiles (strong mapping for KB5014754); Configure and use PKCS certificates; Remove SCEP or PKCS certificates.",
    "Microsoft Learn: Configure infrastructure to support SCEP with Intune; Certificate Connector for Microsoft Intune (lifecycle, what's new); Renewal of the NDES enrollment agent certificate.",
    "Microsoft Learn: Using certificates for Entra joined on-premises SSO (requirements, high availability); Plan your Entra join implementation (RADIUS and Wi-Fi).",
    "Microsoft Support: KB5014754, Certificate-based authentication changes on Windows domain controllers (phases; Kdcsvc events 39, 40, 41).",
    "Microsoft Learn: Guidelines for enabling smart card logon with third-party CAs; What's new in Intune notices (strong mapping for SCEP and PKCS).",
    "Microsoft Learn: Entra CBA technical concepts; Set up Entra CBA; Entra CBA CRL; What is Entra CBA (unsupported scenarios, OCSP).",
    "Microsoft Learn: Microsoft Entra licensing (Conditional Access); Migrate from federation to Entra CBA; Staged rollout; Migrate from federation to cloud authentication.",
    "Microsoft Learn: Cloud PKI overview; Intune supported platforms; Intune planning guide; What's new in Intune (2606, 2609).",
    "Book 03, Chapter 09 (PIV, bindings, certificateUserIds write path); Book 05, Chapters 08–09.",
    "Full footnotes with links and access dates: Book 07, Chapter 06 and Appendix A.2.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}
{
  const s = D.content("Backup", "Sources behind Module 4 — Coexistence to decommissioning");
  const src = [
    "Microsoft Learn: On-premises certificate trust deployment (DC certificates); Configure SSO for Entra joined devices (CRL); Hybrid certificate trust PKI; LDAP over SSL certificates; LDAPS with a third-party CA.",
    "Microsoft Learn: EAP-TLS and PEAP certificate requirements; Distribute certificates by Group Policy; Valid root CAs distributed by GPO may appear untrusted; certutil -dsPublish; Import third-party CAs into NTAuth.",
    "Microsoft Learn: Cloud PKI overview; configure BYOCA; What's new in Intune (2605, in-place issuing CA renewal); Remove SCEP or PKCS certificates; SCEP infrastructure (validity period).",
    "Microsoft Learn: Staged rollout; Migrate from federation to cloud authentication; Migration best practices; AD FS decommission guide.  ·  CyberArk, Certificate Manager Self-Hosted introduction.",
    "Microsoft Learn: Certificate templates concepts; Purview data security solutions; Entra join planning.  ·  Appendix B sources as listed in the appendix.",
    "CA/Browser Forum SC-081v3 and Baseline Requirements §1.2.2.  ·  RFC 8555, ACME (Mar. 2019).  ·  CyberArk, ACME integration with Certificate Manager Self-Hosted (v26.1).",
    "Microsoft Learn: Operate certificate revocation, CRL publication and CDP changes in AD CS; Monitor AD CS publication health; Monitoring for Cloud PKI; Intune reports; Custom compliance settings.",
    "Microsoft Learn: Configure CAs for Entra CBA; AADSTS50017; AADSTS220501; Troubleshooting PKCS deployment; SCEP fails after CA renewal; Connector prerequisites.",
    "Microsoft Learn: Decommission a Windows enterprise CA (KB 889250); What is Azure Key Vault Managed HSM.  ·  NIST SP 800-53 Rev. 5 (IA-5(2), SC-12, SC-17).",
    "Full footnotes with links and access dates: Book 07, Chapters 07–08 and Appendices A–B.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
