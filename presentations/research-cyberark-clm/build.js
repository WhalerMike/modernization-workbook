// Implementing Book 07's certificate lifecycle on CyberArk Certificate Manager, Self-Hosted: a ~33-minute IMPLEMENTATION GUIDE.
//   Orientation: what the guide implements; prerequisites and decisions.
//   Part 1 — Build the platform · Part 2 — Connect the issuers · Part 3 — Discover, own and automate · Part 4 — Migrate and operate.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Research_CyberArk_CLM.pptx
// Modeled on presentations/research-infoblox-ddi/build.js and reuses the shared kit in ../_build/.
// Every fact comes from the verified research brief (C:\tmp\ib\research_cyberark_clm.md, all sources opened 2026-10-22),
// Book 07 (docs/books/b07-pki/) and the device-naming brief (C:\tmp\ib\research_device_naming.md).
// Program recommendations are labeled design guidance. Where the brief corrects Book 07, the slide says so.
// Narration: narrate.py and captions.py, then build_narrated.ps1 from ../_build/ (the editor runs those).
const path = require("path");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Certificate Lifecycle on CyberArk Certificate Manager", title: "Implementation Guide",
  footer: "Certificate lifecycle on CyberArk Certificate Manager  ·  Implementation guide  ·  Research — under review" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Research_CyberArk_CLM.pptx";

// ------------------------------------------------------------------ helpers (as in the Infoblox research deck)
const WPM = 142;
let clock = 0, words = 0;
const per = [];
const titles = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const n = body.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; words += n; per.push({ slide: pres.slides.length, n, title: titles[titles.length - 1] });
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nSources: ${ref}`);
};
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  titles.push(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };

const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6;
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

const sources = (s, text, y = 6.62) => {
  if (text.length > 185) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

const T = (s, name, t, o) => {
  const size = o.fontSize || 14;
  const runs = typeof t === "string" ? [{ text: t, options: {} }] : t;
  const paras = []; let cur = { chars: 0, size };
  runs.forEach((r) => {
    const ro = r.options || {}; const sz = ro.fontSize || size;
    cur.size = Math.max(cur.size, sz); cur.chars += (r.text || "").length * (sz / size);
    if (ro.breakLine || ro.bullet) { paras.push(cur); cur = { chars: 0, size }; }
  });
  if (cur.chars) paras.push(cur);
  const need = paras.reduce((h, p) => h + lines("x".repeat(Math.round(p.chars)), o.w - 0.1, p.size) * p.size / 72 * 1.2 + (o.paraSpaceAfter || 0) / 72, 0);
  if (need > o.h * 1.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow: needs ${need.toFixed(2)}, has ${o.h.toFixed(2)}`);
  return txt(s, name, t, o);
};

const table = (s, name, y, colW, headers, rows, o = {}) => {
  const pt = o.fontSize || 12.5;
  const lh = pt / 72 * 1.2;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const rh = (r, bold) => Math.max(o.minRow || 0.32, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
  const rowH = [rh(headers, true), ...rows.map((r) => rh(r))];
  const body = rows.map((r) => r.map((c, k) => {
    const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
    if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
    return base;
  }));
  const x = o.x != null ? o.x : 0.6;
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`slide ${pres.slides.length} ${name} table`, bottom);
  return bottom;
};

const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 15, fontFace: "Cambria", breakLine: true } });
  if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.7 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.34 : 0) + (runs.length ? 0.08 : 0);
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 3 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.05, 0);
  if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
};

const flow = (s, name, y, h, steps, pt = 12, x0 = 0.6, W = 12.15) => {
  const n = steps.length, gap = 0.28, w = (W - gap * (n - 1)) / n;
  steps.forEach((st, i) => {
    const x = x0 + i * (w + gap);
    const c = st.color || (i % 2 ? HEX.teal : HEX.navy);
    box(s, `${name} ${i + 1}`, x, y, w, h, st.tint || (i % 2 ? HEX.tealTint : HEX.navyTint));
    const runs = [{ text: st.head, options: { bold: true, color: c, fontSize: pt + 1.5, fontFace: "Cambria", breakLine: !!st.body } }];
    if (st.body) runs.push({ text: st.body, options: { fontSize: pt } });
    T(s, `${name} ${i + 1} text`, runs, { x: x + 0.1, y: y + 0.08, w: w - 0.2, h: h - 0.16, paraSpaceAfter: 2, fontSize: pt });
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

// Design-guidance and correction labels, so program design never reads as vendor fact.
const label = (s, name, text, x, y, w, color = HEX.red) =>
  txt(s, name, text, { x, y, w, h: 0.28, fontSize: 11, bold: true, color, valign: "middle" });

const divider = (sec, title, sub, items, mins, src) => {
  const s = titleSlide(sec, title, sub);
  txt(s, "Part contents", [
    { text: `IN THIS PART  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.65, w: 7.4, h: 1.4, paraSpaceAfter: 3 });
  sources(s, src, 6.08);
  return s;
};

const SUB = "Implementation guide  ·  Research — under review";
const OR = "Orientation";
const P1 = "Part 1 — Build the platform";
const P2 = "Part 2 — Connect the issuers";
const P3 = "Part 3 — Discover, own and automate";
const P4 = "Part 4 — Migrate and operate";

// ================================================================== 1 Title
{
  const s = titleSlide(OR, "Certificate Lifecycle on CyberArk Certificate Manager", SUB);
  txt(s, "Session map", [
    { text: "IMPLEMENTING BOOK 07'S CERTIFICATE LIFECYCLE, SELF-HOSTED  ·  ABOUT 44 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Orientation  ·  Part 1 Build the platform  ·  Part 2 Connect the issuers", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 3 Discover, own and automate  ·  Part 4 Migrate and operate", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: CyberArk Certificate Manager, Self-Hosted 26.1 docs; Microsoft Learn; FedRAMP Marketplace; NIST CMVP; Book 07. All opened Oct. 22, 2026.", 6.08);
  notes(s,
`This is an implementation guide. Book 07 decided that the program's certificate lifecycle platform is CyberArk Certificate Manager, from the vendor the agency already uses for machine identity. This guide shows how to build it, self-hosted, and connect it to Book 07's design, phase by phase.

It runs in four parts after a short orientation. Part 1 builds the platform: architecture, the FIPS posture, console sign-in, hardening, and backup. Part 2 connects the issuers: Active Directory Certificate Services, the public certificate authorities, the cloud, and Intune. Part 3 covers discovery, ownership and enrollment automation. And Part 4 maps the build onto Book 07's six migration waves and covers running it.

Three ground rules. Every fact comes from a primary source opened on October twenty-second, 2026, mostly CyberArk's version 26.1 documentation. Recommendations are labeled design guidance. And in three places the research corrects Book 07; I'll state the corrected fact each time, and Book 07 has been updated to match to match.`,
  "Research brief, Implementing Book 07's certificate lifecycle on CyberArk Certificate Manager, Self-Hosted (verified Oct. 22, 2026); CyberArk Trust Protection Foundation 26.1 documentation; Book 07, Chapters 01, 04, 05, 07 and 08.");
}

// ================================================================== 2 Issuer map
{
  const s = content(OR, "What this guide implements: Book 07's issuer map");
  tag(s, "What");
  const b = table(s, "Issuer map", 1.5, [3.15, 2.95, 2.75, 3.3], ["Certificate class", "Issuer", "Renewal engine", "CLM role"], [
    ["User and device auth on Intune-managed devices", "Cloud PKI (SCEP), or AD CS via the connector", "Intune profile renewal threshold", "None for Cloud PKI; AD CS-issued: monitor-only import"],
    ["PIV and derived PIV", "Federal PKI shared service provider", "Card and credential lifecycle", "None (may trust Federal PKI CAs for console sign-in)"],
    ["Domain controller, KDC, LDAPS", "Retained AD CS", "AD CS autoenrollment", "Monitor-only; never renews"],
    ["RADIUS/NPS, VPN and RD gateways, SQL, internal web, appliances", "Retained AD CS (standalone after AD)", "CyberArk Certificate Manager", "Owns renewal and provisioning"],
    ["Public-facing TLS", "Public CA authorized by CAA", "CyberArk Certificate Manager, ACME where it fits", "Owns renewal"],
    ["CA certificates and CRLs", "The hierarchy", "Key ceremony and CRL schedule", "Monitors CDP and OCSP endpoints"],
  ], { fontSize: 11 });
  callout(s, "SoR", b + 0.15, Math.min(0.95, 6.5 - b - 0.15), "FaDatabase", HEX.teal, "The CLM is the system of record ",
    "for every certificate that Intune and the PIV card system don't manage.");
  sources(s, "Sources: Book 07, Ch 04 (issuer map, CLM scope), Ch 05 (renewal ownership), Ch 08 (renewal engines); CyberArk 26.1 Installation Guide p. 89 (revocation monitoring).");
  notes(s,
`Book 07's target gives each class of subject its own issuer, and a lifecycle platform covers the issuers that don't renew their own certificates.

Intune-managed devices get user and device certificates from Microsoft Cloud PKI through SCEP, or during the bridge period from AD CS through the Intune connector. Intune renews them, so the CLM platform doesn't manage them. PIV cards come from a Federal PKI shared service provider through the card management system. Domain controller, KDC and LDAPS certificates stay on retained AD CS with autoenrollment; the platform watches them but never renews them.

Everything else lands on the platform. RADIUS and NPS servers, VPN and Remote Desktop gateways, SQL Server, internal web servers and appliances get certificates from the retained AD CS hierarchy, which becomes a standalone CA after Active Directory, requested and renewed through CyberArk Certificate Manager. Public-facing TLS comes from a public CA the agency authorizes in its CAA records, renewed by the platform, with ACME where the endpoint supports it. And for the hierarchy itself, the platform's revocation monitoring checks CRL and OCSP endpoints.

So the platform's job is simple to state: it's the system of record for every certificate Intune and the PIV system don't manage.`,
  "Book 07, Chapter 04 (issuer map; certificate lifecycle management), Chapter 05 (renewal ownership per certificate class), Chapter 08 (renewal engines); research brief section 10; CyberArk 26.1 Installation and Upgrade Guide (Certificate Revocation Monitoring).");
}

// ================================================================== 3 Prerequisites
{
  const s = content(OR, "Prerequisites and decisions before you build");
  tag(s, "What");
  panel(s, "Why SH", 0.6, 1.5, 4.3, 4.95, HEX.red, HEX.redTint, "WHY SELF-HOSTED", "No FedRAMP package for the SaaS", [
    "Marketplace, Oct. 22, 2026: no package for Certificate Manager, Next-Gen Trust Security or Trust Protection Foundation",
    "Palo Alto Networks' authorized packages cover privileged access, endpoint privilege and network security, not CLM",
    "So Self-Hosted runs inside the agency boundary, beside the CAs it manages (Book 07 decision)",
    "Avoid SaaS-dependent features (design guidance)",
  ], 12);
  table(s, "Prereqs", 1.5, [1.75, 5.95], ["Item", "Requirement in 26.1"], [
    ["Product", "Certificate Manager, Self-Hosted 26.1 (July 2026) on Trust Protection Foundation, formerly Venafi TPP; major releases about every six months"],
    ["Servers", "Windows Server 2016, 2019, 2022 or 2025, Server with UI, English media only; same OS version across the cluster"],
    ["Web stack", "IIS roles, .NET 4.8, VC++ runtimes, Edge WebView2"],
    ["Database", "SQL Server 2014–2022, English only, never on a platform server outside test; FULL recovery model; Enterprise edition recommended"],
    ["High availability", "SQL Always On availability groups; every server connects to the same database instance"],
  ], { x: 5.05, fontSize: 11.5 });
  sources(s, "Sources: FedRAMP Marketplace products.json (last change Oct. 22, 2026); CyberArk 26.1 System Requirements; Always On; SQL edition guidance; Installation Guide p. 2; Book 07, Ch 04.");
  notes(s,
`Why self-hosted? In the FedRAMP Marketplace data as of October twenty-second, there's no certificate-management package from Palo Alto Networks, CyberArk or Venafi: not Certificate Manager, not Next-Gen Trust Security, and not the Trust Protection Foundation. Palo Alto's authorized packages cover privileged access, endpoint privilege management and network security. So Book 07's decision stands: run Certificate Manager, Self-Hosted inside the agency's own authorization boundary, alongside the CAs it manages. The program's design guidance adds a corollary: avoid any feature that depends on the SaaS, and we'll meet two of those later.

The product runs on the Trust Protection Foundation, formerly the Venafi Trust Protection Platform. The current release is 26.1, from July 2026, and CyberArk typically ships major releases every six months, so plan an upgrade cadence from day one.

The servers run Windows Server 2016 through 2025, with the desktop experience, from English installation media only, and the same OS version across the cluster. They need IIS, .NET 4.8, the Visual C++ runtimes and WebView2. The database is SQL Server 2014 through 2022, also English only, and not on a platform server except in test. CyberArk strongly recommends the FULL recovery model, and recommends Enterprise edition because Standard needs an outage for the weekly index rebuild. For high availability, use Always On availability groups.`,
  "FedRAMP Marketplace products.json (last_change Oct. 22, 2026); CyberArk 26.1 System Requirements, Always On high availability, Choosing SQL Server Enterprise or Standard, Important Considerations, Installation and Upgrade Guide; Palo Alto Networks Next-Gen Trust Security page; Book 07, Chapter 04.");
}

// ================================================================== Part 1 divider
{
  const s = divider(P1, "Part 1: Build the platform", "Implementation guide  ·  Part 1 of 4",
    ["Architecture, sizing and high availability", "FIPS posture and console sign-in", "Hardening, service accounts, backup and recovery"], 8,
    "Sources: CyberArk 26.1 System Requirements, Installation Guide, security hardening and disaster recovery pages; NIST CMVP; Book 07 Ch 05.");
  notes(s,
`Part 1: build the platform.

We'll start with the architecture: the cluster, its components, how to size it and make it highly available. Then the FIPS posture, where you have to be careful about what you claim. Then how administrators sign in to the console. And finally hardening, least-privilege service accounts, and backup and recovery for the database and its keys.`,
  "CyberArk 26.1 System Requirements, Installation and Upgrade Guide, security hardening and disaster recovery documentation; NIST CMVP; Book 07, Chapter 05.");
}

// ================================================================== 4 Architecture
{
  const s = content(P1, "Architecture: cluster, components and availability");
  tag(s, "How");
  panel(s, "Cluster", 0.6, 1.5, 6.0, 3.7, HEX.navy, HEX.navyTint, "HOW A CLUSTER WORKS", null, [
    "Several platform servers on one database form a cluster; an MQTT Message Bus links them (TLS on 8883)",
    "Components switch on per server in the Configuration Console: CA Import, Lifecycle and Monitoring, Revocation Monitoring, Network Discovery, EST, SCEP, ACME, Reporting",
    "Processing engines, discovery zones and per-server components keep work on chosen servers",
    "Consoles: web console (Aperture), Policy Tree, and the MMC-based Configuration Console",
  ], 12);
  table(s, "Sizing", 1.5, [2.35, 3.65], ["Active certificates", "Servers"], [
    ["Up to 50,000", "2"],
    ["Up to 250,000", "6: 2 log and event, 2 web services, 2 back end"],
    ["1 million and more", "Designed with CyberArk; SQL Enterprise required"],
    ["Each server", "4 cores, 16 GB RAM, 5 GB disk"],
    ["Agents", "2 more servers per 40,000 managed servers"],
  ], { x: 6.75, fontSize: 11.5 });
  T(s, "HA", [
    { text: "Availability: ", options: { bold: true, color: HEX.teal } },
    { text: "SQL Always On; at least two servers per role; a load balancer in front of web services, which rolling upgrades need; a Microsoft CA Pool of up to three CA templates fails over after one stops answering (60-minute hold-off)." },
  ], { x: 0.6, y: 5.35, w: 12.15, h: 0.6, fontSize: 12 });
  T(s, "Ports", [
    { text: "Ports: ", options: { bold: true, color: HEX.navy } },
    { text: "443; 80 for SCEP only; 50443 EST; 8883 bus; 135 + 49152–65535 DCOM to AD CS; 1433 SQL; 514 syslog; 22, 25/587, 161, 445 as used." },
  ], { x: 0.6, y: 5.95, w: 12.15, h: 0.6, fontSize: 12 });
  sources(s, "Sources: CyberArk 26.1 System Requirements; Installation Guide pp. 54, 86–94; Rolling upgrades; Microsoft CA Pool; Always On high availability.");
  notes(s,
`The architecture. Several Trust Protection Foundation servers sharing one SQL database form a cluster, and a message bus, an MQTT broker using TLS on port 8883, links them.

Each server runs the components you switch on for it in the Configuration Console. The ones this guide uses are CA Import, Certificate Lifecycle and Monitoring, Certificate Revocation Monitoring, Network Discovery, the EST service, Network Device Enrollment for SCEP, the ACME service and Reporting. You can keep work on particular servers with processing engines, discovery zones, or by turning components off, and that matters later, when we keep ACME off the FIPS-mode servers.

Sizing comes from CyberArk's tables. Two servers handle up to fifty thousand active certificates. Up to two hundred fifty thousand takes six: two for log and event processing, two for web services and two back-end servers. Past a million, CyberArk designs it with you, and SQL Enterprise is required. Each server needs four cores, sixteen gigabytes of memory and five gigabytes of disk.

For availability: Always On for the database, at least two servers per role, and a load balancer in front of the web services, which rolling upgrades require. For the CAs, a Microsoft CA Pool holds up to three CA templates; if the first CA fails, the platform stops querying it for sixty minutes and fails over.`,
  "CyberArk 26.1 System Requirements (cluster, Message Bus, sizing, ports, network scoping); Installation and Upgrade Guide pp. 54 and 86–94 (components); Rolling upgrades; Always On high availability; Create and configure a Microsoft CA Pool.");
}

// ================================================================== 5 FIPS
{
  const s = content(P1, "FIPS posture: what you can and can't claim");
  tag(s, "What");
  panel(s, "Doc", 0.6, 1.5, 6.0, 3.55, HEX.teal, HEX.tealTint, "WHAT CYBERARK DOCUMENTS", null, [
    "Supports Windows servers with FIPS mode on, set by the Windows \"use FIPS compliant algorithms\" policy",
    "Advises FIPS mode \"only ... if required\" and links Microsoft's post not recommending it",
    "Database secrets encrypted by an AES-256 software key, an HSM key, or both",
    "HSMs: Entrust nShield Connect, Thales Luna (incl. Azure Dedicated HSM); self-certified list incl. AWS CloudHSM",
  ], 12);
  panel(s, "Claim", 6.75, 1.5, 6.0, 3.55, HEX.red, HEX.redTint, "WHAT NOT TO CLAIM", null, [
    "No CMVP certificate names Trust Protection Foundation or Certificate Manager (vendor \"Venafi\": none)",
    "CyberArk's #5205 and #5122 (FIPS 140-3, Level 1) don't name the product: don't cite them for it without a vendor letter",
    "No current Common Criteria certificate: TPP 23.1 was archived July 29, 2026",
  ], 12);
  callout(s, "Path", 5.2, 1.3, "FaKey", HEX.amber, "Evidence path (inference): ",
    "FIPS-mode Windows, using Microsoft's validated modules, plus the HSM's own CMVP certificate for database secrets. ACME servers can't be in FIPS mode (Part 3).");
  sources(s, "Sources: CyberArk 26.1 Installation Guide pp. 49–55; System Requirements; NIST CMVP search and certs #5205, #5122; Common Criteria lists.");
  notes(s,
`Be exact about FIPS.

What CyberArk documents: the Trust Protection Foundation supports Windows servers with FIPS mode enabled, through the Windows policy that says to use FIPS-compliant algorithms. The installation guide also says to enable it only if your industry requires it, and links Microsoft's post explaining why Microsoft no longer recommends FIPS mode. For a federal deployment, decide FIPS mode per server, deliberately. The database's secrets are encrypted with an AES-256 software key kept in the registry, a key held in a hardware security module, or both.

What not to claim. I searched NIST's validated-modules list on October twenty-second. Under the vendor name Venafi there's nothing. Under CyberArk there are two FIPS 140-3 Level 1 certificates, number 5205, the CyberArk Cryptographic Module, and number 5122, its Java counterpart. Neither names the Trust Protection Foundation or Certificate Manager, and I found no CyberArk statement saying which module the product uses. So don't cite either certificate for this product without a vendor letter. There's also no current Common Criteria certificate; the last one, for Trust Protection Platform 23.1, was archived on July twenty-ninth, 2026.

The defensible evidence path, and this is my inference, is FIPS-mode Windows, which uses Microsoft's validated modules, plus the HSM's own CMVP certificate for the database secrets. One catch, which Part 3 covers: servers running the ACME service can't be in FIPS mode at all.`,
  "CyberArk 26.1 Installation and Upgrade Guide pp. 49–55 (FIPS, encryption keys); System Requirements (HSMs); System encryption keys overview; NIST CMVP validated-modules search (Vendor Venafi; Vendor CyberArk) and certificates #5205 and #5122; Common Criteria Portal certified and archived product lists.");
}

// ================================================================== 6 Console sign-in
{
  const s = content(P1, "Console sign-in: Entra SSO with certificate-based auth");
  tag(s, "Who");
  panel(s, "Opts", 0.6, 1.5, 6.0, 4.0, HEX.navy, HEX.navyTint, "DOCUMENTED IN 26.1", null, [
    "Web console SSO by OIDC or SAML; Microsoft Entra ID listed as supported for SAML, OIDC and SCIM",
    "MMC snap-ins sign in with the OIDC device flow; the Authentication node holds one SAML connector",
    "Client-certificate login: trusted CAs selected, IIS set to require client certificates; identity from SAN UPN, email, CN or SID",
    "PIV and CAC are not named anywhere",
  ], 12);
  label(s, "Design label", "PROGRAM DESIGN GUIDANCE", 6.75, 1.5, 6.0);
  panel(s, "Design", 6.75, 1.82, 6.0, 3.68, HEX.teal, HEX.tealTint, null, "Entra SSO, with Entra CBA for PIV", [
    "Federate the web console to Entra ID; administrators present PIV through Entra certificate-based authentication (Book 07 Ch 06)",
    "One CBA trust store and Conditional Access, not a second one in IIS",
    "Master Admin eligible, not standing (Book 07 Ch 05); local master admin kept as break-glass",
    "Native client-certificate login only as a fallback",
  ], 12);
  T(s, "Tokens", [
    { text: "API tokens: ", options: { bold: true, color: HEX.amber } },
    { text: "defaults are a 90-day access token and a 1-year grant. Shorten both (design guidance). API keys are gone in 26.1; use OAuth tokens." },
  ], { x: 0.6, y: 5.7, w: 12.15, h: 0.75, fontSize: 12.5 });
  sources(s, "Sources: CyberArk 26.1 What's New; login experience; SSO vendor support; certificate auth in IIS; OAuth setup; deprecated features; Book 07, Ch 05–06.");
  notes(s,
`Who signs in to the console, and how.

Version 26.1 supports single sign-on to the web console through OIDC or SAML, and CyberArk's vendor table lists Microsoft Entra ID as supported for SAML, OIDC and SCIM. The MMC snap-ins sign in with the OIDC device flow. CyberArk also documents client-certificate login: you enable certificate authentication, choose the trusted CAs, and set the IIS site to require client certificates; the platform takes the identity from the certificate's UPN, email, common name, or SID extension. What CyberArk doesn't document is PIV or CAC by name.

So the program's design guidance is to federate the web console to Entra ID, and let administrators present their PIV card through Entra certificate-based authentication, as Book 07 Chapter 06 configures it. That keeps one CBA trust store and Conditional Access in front of the console, rather than a second, separate trust store in IIS. The native client-certificate login stays a fallback. Master Admin is eligible, not standing, and the local master admin is the break-glass.

Then the API. Automation authenticates with OAuth tokens from the platform's authentication server. The defaults are a ninety-day access token and a one-year grant, and the program's guidance is to shorten both. API keys are no longer supported.`,
  "CyberArk 26.1 What's New; Login experience; Vendor support for SSO; Configuration Console Authentication node; Configuring certificate authentication in the platform and IIS; Setting up OAuth; Authentication options; Deprecated features; Book 07, Chapters 05 and 06.");
}

// ================================================================== 7 Hardening
{
  const s = content(P1, "Hardening and least-privilege service accounts");
  tag(s, "How");
  table(s, "Harden", 1.5, [2.6, 9.55], ["Area", "What to do"], [
    ["IIS (vendor guidance)", "Host-header rewrite rule; debug off; httpOnlyCookies and requireSSL; GET and POST only; HSTS, X-Frame-Options, CSP; remove X-Powered-By"],
    ["Server certificate", "Replace the self-signed Venafi Operational Certificate on every server with a CA-issued one"],
    ["Database accounts", "Separate DBO account (install, upgrade) from the operational account; the operational account needs Log on as a Service and local Administrators on every server; gMSA supported"],
    ["Target credentials", "CAPI/IIS provisioning needs Windows administrator on the target; keep these in CyberArk's password vault via the Credential Provider (design guidance)"],
    ["Answer files", "They hold the admin password, database credentials and the software key: encrypt them"],
  ], { fontSize: 11.5 });
  callout(s, "Tier0", 5.0, 1.45, "FaUserShield", HEX.red, "Treat as Tier 0 (design guidance): ",
    "Master Admins, the software key and database backups. The platform holds certificate-manager rights on CAs, admin on Windows targets and private keys.");
  sources(s, "Sources: CyberArk 26.1 IIS hardening; web server security; Windows auth requirements; gMSA; CAPI permissions; credential pages; Installation Guide p. 86.");
  notes(s,
`Hardening. CyberArk's hardening section currently covers IIS only: a rewrite rule against host-header injection; web configuration settings with debugging off, cookies marked HTTP-only and secure, request filtering to GET and POST, strict transport security, frame and content security policy headers; and the X-Powered-By header removed. Apply all of it.

Every platform server ships with a self-signed certificate called the Venafi Operational Certificate. Replace it on every server with one issued by your CA before production.

The database needs two accounts: a DBO account used only to install and upgrade, and an operational account the services run as. CyberArk documents that the operational account needs Log on as a Service and local administrator rights on every platform server, and group managed service accounts are supported.

The provisioning drivers need privilege on the targets too. For Windows CAPI and IIS, CyberArk says the account must be a Windows administrator on the target. The program's guidance is to keep those credentials in CyberArk's Enterprise Password Vault, which the platform can query through the Credential Provider. And the installation answer files contain the admin password, the database credentials and the software key, so encrypt them.

So the platform concentrates privilege: certificate-manager rights on CAs, administrator on Windows targets, and private keys in its database. The program therefore treats the Master Admins, the software key and the database backups as Tier 0.`,
  "CyberArk 26.1 Security hardening best practices and IIS hardening; Securing the web server; Windows authentication requirements; Group managed service accounts; Rolling upgrades; CAPI permissions; CyberArk credential best-practice example; Securing credential objects; Installation and Upgrade Guide p. 86.");
}

// ================================================================== 8 Backup and DR
{
  const s = content(P1, "Backup and disaster recovery: database and keys");
  tag(s, "How");
  flow(s, "DR", 1.5, 1.55, [
    { head: "1 Prerequisites", body: "Local master admin, DB backup, connection info, software or HSM key" },
    { head: "2 Stop services", body: "On every platform server" },
    { head: "3 Restore DB", body: "Restore, recover users" },
    { head: "4 Service Broker", body: "ALTER DATABASE … SET ENABLE_BROKER" },
    { head: "5 Keys", body: "Import software key, or reconnect HSM (-hsmpin)" },
  ], 11.5);
  panel(s, "Backup", 0.6, 3.25, 6.0, 3.2, HEX.navy, HEX.navyTint, "BACK UP", null, [
    "Database on the FULL recovery model, on a schedule",
    "Software key: tppconfiguration.exe -keyexport; without it \"you cannot access data in the database\"",
    "HSM keys: the HSM vendor's backup; run HSMs in HA, since the platform shuts down if the HSM stays unreachable",
  ], 12);
  panel(s, "CA side", 6.75, 3.25, 6.0, 3.2, HEX.teal, HEX.tealTint, "AND ON THE CA SIDE", null, [
    "Backup-CARoleService before changing CA permissions for the CLM account",
    "Rehearse a restore before Wave 2 exits (design guidance)",
    "Store the key backup and its password through separate approved channels (Book 07 Ch 08)",
  ], 12);
  sources(s, "Sources: CyberArk 26.1 software key backup; HSM configuration; disaster recovery pages; Microsoft Learn, secure and delegate a CA; Book 07, Ch 08.");
  notes(s,
`Backup and recovery. The database and its encryption key are a pair.

Back up the database on the FULL recovery model. Export the software key with the configuration tool's key-export option, and keep it safe: CyberArk says that without it, you cannot access data in the database. If an HSM holds the key, use the HSM vendor's backup, and run the HSMs in high availability, because if the HSM stays unreachable the platform retries, logs, and then shuts down.

CyberArk's disaster recovery procedure has five steps. First, the prerequisites: local master admin credentials, the database backup, the database connection details, and the software key or HSM access. Second, stop the services on every platform server. Third, restore the database and recover its users. Fourth, re-enable SQL Service Broker on the restored database, which is easy to forget and stops the platform working if you do. Fifth, import the software key, or reconnect the HSM through the Configuration Console or the configuration tool's HSM PIN option.

On the CA side, Microsoft recommends backing up the CA with Backup-CARoleService before you change its permissions, which you're about to do for the platform's CA account. The program's guidance is to rehearse a full restore before Wave 2 exits, and Book 07 Chapter 08's rule applies to every key backup: store the backup and its password through separate approved channels.`,
  "CyberArk 26.1 Software key backup; HSM configuration; Using HSM-protected keys; Disaster recovery prerequisites, database recovery and HSM recovery; System Requirements; Microsoft Learn, Secure, delegate and audit a certification authority; Book 07, Chapter 08.");
}

// ================================================================== Part 2 divider
{
  const s = divider(P2, "Part 2: Connect the issuers", "Implementation guide  ·  Part 2 of 4",
    ["The AD CS driver, and scoping its account under ESC7", "Public and cloud CA drivers in 26.1", "Intune coexistence: who owns device certificates"], 7,
    "Sources: CyberArk 26.1 CA driver pages; Supported integrations; Deprecated features; Microsoft Learn (AD CS, Intune, Graph); Book 07 Ch 03–07.");
  notes(s,
`Part 2: connect the issuers.

First the AD CS driver: what it needs on the CA, how templates map, and which Windows Server versions are confirmed. Then how to scope its privileged account under the ESC7 review, which includes the first correction to Book 07. Then the public and cloud CA drivers, where release 26.1 changed one. And finally how the platform coexists with Intune, which owns device certificates.`,
  "CyberArk 26.1 CA driver documentation, Supported integrations, Deprecated features; Microsoft Learn AD CS, Intune and Microsoft Graph pages; Book 07, Chapters 03 to 07.");
}

// ================================================================== 9 AD CS driver
{
  const s = content(P2, "The AD CS driver: permissions, templates, versions");
  tag(s, "How");
  table(s, "MSCA", 1.5, [2.45, 9.7], ["Item", "What the documentation says"], [
    ["Driver", "\"Microsoft ADCS - Enterprise and Standalone\" CA template object; Microsoft CA Support installed on the platform; DCOM transport"],
    ["CA account rights", "Read, Issue and Manage Certificates, and Request Certificates on the CA"],
    ["Template mapping", "CA template assigned by policy on the folder or the certificate; vCert calls per-request template choice \"against CyberArk recommendations\". One CyberArk CA template object per AD CS template (inference)"],
    ["Enterprise or standalone", "Both supported; only enterprise CAs use AD templates, which fits the post-AD standalone CA"],
    ["End-date control", "May need EDITF_ATTRIBUTEENDDATE on the CA: a CA policy change under Book 07 Ch 03 (event 4892); leave it off unless needed (design)"],
    ["Approvals, import", "Manual approval per CA template or pool; CA Import pulls certificates by template since the last run"],
  ], { fontSize: 11.5 });
  callout(s, "WS2025", 5.35, 1.1, "FaTriangleExclamation", HEX.amber, "Windows Server 2025 CAs: ",
    "the driver page covers all supported Windows Server CAs, but the integrations table stops at 2022. Get written confirmation before Wave 2.");
  sources(s, "Sources: CyberArk 26.1 MS ADCS CA template; MSCA settings; CA chaining; CA import; Supported integrations; vCert README; Microsoft Learn templates.");
  notes(s,
`The AD CS driver. In the platform it's a CA template object called Microsoft Active Directory Certificate Services, Enterprise and Standalone. It needs Microsoft CA Support installed on the platform servers, and it talks to the CA over DCOM. The account it uses needs Read, Issue and Manage Certificates, and Request Certificates on the CA. That matches Book 07.

Template mapping is done by policy. A certificate gets its CA template object from the policy on its folder, or directly on the certificate. CyberArk's vCert tool expects the template to come from policy and calls choosing it per request against CyberArk's recommendations. So, by inference, the natural pattern is one CyberArk CA template object for each AD CS template the platform issues from.

Enterprise and standalone CAs are both supported. Only enterprise CAs use Active Directory templates, which is exactly why Book 07 moves server issuance to a standalone CA after the forest retires, with template policy living in the platform.

Letting requesters set end dates may need a CA policy flag turned on; that raises event 4892 under Book 07 Chapter 03, so the program's guidance is to leave it off unless you need it.

One open item. The driver page says it supports CAs on all supported Windows Server versions, and the platform runs on 2025. But CyberArk's supported-integrations table lists AD CS only through Windows Server 2022. If any retained CA runs Windows Server 2025, get written confirmation before Wave 2.`,
  "CyberArk 26.1 Microsoft ADCS Enterprise and Standalone CA template; MSCA certificate object settings; CA chaining; Configuring certificate import from a Microsoft CA; Microsoft CA Pool; Supported integrations; Deprecated features; System Requirements; vCert README; Microsoft Learn, Manage certificate templates.");
}

// ================================================================== 10 ESC7
{
  const s = content(P2, "Scoping the CLM's CA account under ESC7");
  tag(s, "Who");
  panel(s, "Fact", 0.6, 1.5, 5.6, 3.6, HEX.red, HEX.redTint, "WHY IT'S SENSITIVE", null, [
    "Issue and Manage Certificates is the certificate-manager right: issue, deny, revoke, reinstate, without Manage CA",
    "Defender for Identity's ESC7 assessment flags unprivileged holders of it",
    "Microsoft: define each certificate manager's templates and requesters; test allowed and denied requests",
  ], 12);
  label(s, "Fix label", "CORRECTS BOOK 07 CH 05 — BOOK 07 HAS BEEN UPDATED", 6.4, 1.5, 6.35);
  T(s, "Correction", [
    { text: "Microsoft publishes no Windows Server 2025 procedure for certificate-manager restrictions. ", options: { bold: true, color: HEX.navy } },
    { text: "So \"scope the account to its templates\" rests on template permissions plus lab-tested allowed and denied requests, not an assumed CA-side control." },
  ], { x: 6.4, y: 1.85, w: 6.35, h: 1.3, fontSize: 12.5 });
  label(s, "Design label", "PROGRAM DESIGN GUIDANCE", 6.4, 3.2, 6.35);
  T(s, "Controls", bullets([
    "Dedicated account (gMSA where the CA allows); deny interactive logon",
    "DCOM to the CA from the platform's engine servers only",
    "Read and Enroll only on the platform's templates",
    "Alert: 4887 for this requester outside those templates; 4882, 4890, 4892",
    "In the quarterly ESC7 review; negative test on record",
  ], 12), { x: 6.4, y: 3.5, w: 6.35, h: 2.0, paraSpaceAfter: 2, fontSize: 12 });
  T(s, "Infer", [
    { text: "Why the tests carry weight (inference): ", options: { bold: true, color: HEX.amber } },
    { text: "template permissions limit what the account requests; they don't narrow the certificate-manager right itself." },
  ], { x: 0.6, y: 5.6, w: 12.15, h: 0.75, fontSize: 12.5 });
  sources(s, "Sources: Microsoft Learn — secure, delegate and audit a CA; pending requests; Defender for Identity assessments; CyberArk 26.1 MS ADCS; Book 07 Ch 03, 05.");
  notes(s,
`Now the sensitive part. Issue and Manage Certificates is the AD CS certificate-manager right. Microsoft says it lets the holder issue, deny, revoke and reinstate certificates without the broader Manage CA permission. Defender for Identity's ESC7 assessment flags unprivileged holders of it.

Here's the first correction to Book 07. Chapter 05 says the program scopes the account to the templates the platform is meant to issue, as if the CA had a control for that. Microsoft's current guidance says to define each certificate manager's templates and requesters and to run positive and negative authorization tests, but it also says Microsoft Learn doesn't publish a Windows Server 2025 step-by-step procedure for configuring certificate-manager restrictions, and to validate any existing restriction in a lab first. So the scoping rests on template permissions, plus allowed and denied test requests proven in the lab. Book 07 has been updated to match to say so.

My inference about why that matters: template permissions limit what the account can request. They don't narrow the certificate-manager right itself, which is why the negative test and the alerts carry the weight.

The program's controls, as design guidance. A dedicated account, a group managed service account where the CA allows it, denied interactive logon. DCOM to the CA allowed only from the platform's engine servers. Read and Enroll only on the platform's templates. Alerts on event 4887 when this requester gets a certificate outside those templates, and on 4882, 4890 and 4892. And the account goes into the quarterly ESC7 review, with the negative test result on record.`,
  "Microsoft Learn, Secure, delegate and audit a certification authority; Review and dispose of pending certificate requests; Defender for Identity certificate posture assessments; CyberArk 26.1 Microsoft ADCS CA template and Securing credential objects; Book 07, Chapter 03 (ESC7) and Chapter 05 (four permission systems).");
}

// ================================================================== 11 Public and cloud CAs
{
  const s = content(P2, "Public and cloud CA drivers in 26.1");
  tag(s, "What");
  panel(s, "Public", 0.6, 1.5, 6.0, 3.4, HEX.navy, HEX.navyTint, "PUBLIC CA DRIVERS", null, [
    "DigiCert CertCentral (TLS, S/MIME), Sectigo Certificate Manager, GlobalSign MSSL, HID PKIaaS, QuoVadis, VikingCloud, Amazon",
    "Entrust Certificate Services removed in 26.1, migrated to Sectigo; the Entrust CA Gateway driver remains",
    "DigiCert client and S/MIME: an email SAN is now required, or renewals fail after upgrade",
    "No ACME-client driver to public CAs: the platform is an ACME server",
  ], 12);
  panel(s, "Cloud", 6.75, 1.5, 6.0, 3.4, HEX.teal, HEX.tealTint, "CLOUD (ONLY WHAT'S DOCUMENTED)", null, [
    "AWS Certificate Manager driver issues public and private certificates, with Amazon Private CA",
    "CA Import from Amazon Private CA via audit reports in S3 (at most every 30 minutes)",
    "Azure Key Vault is a provisioning target, not a CA: Certificates Officer and Secrets Officer roles",
    "Azure Government endpoints for Key Vault: not documented",
  ], 12);
  callout(s, "Entrust", 5.05, 1.4, "FaTriangleExclamation", HEX.amber, "Before upgrading to 26.1: ",
    "if the agency's public CA is Entrust, plan the issuing path first, and fix DigiCert client templates that lack an email SAN.");
  sources(s, "Sources: CyberArk 26.1 System Requirements; Supported integrations; Deprecated features; Important considerations; CA driver, import and Azure pages.");
  notes(s,
`The public and cloud CA drivers.

For public TLS, 26.1 documents drivers for DigiCert, Sectigo, GlobalSign, HID, QuoVadis, VikingCloud and Amazon. Two 26.1 changes matter before you upgrade. Entrust Certificate Services is no longer supported as a standalone CA; CyberArk says those customers migrated to Sectigo Certificate Manager, though the Entrust CA Gateway driver for Entrust's own CA software is still documented. So if the agency's public CA is Entrust, plan the issuing path before the upgrade. And for DigiCert client and S/MIME certificates, an email subject alternative name is now required; automated renewals without one fail after the upgrade.

Note one absence. There's no documented ACME client driver for public CAs, so no Let's Encrypt-style path out to the internet. The platform is an ACME server for your own clients, not an ACME client to public CAs.

On the cloud side, I'm stating only what's documented. The AWS Certificate Manager driver issues public and private certificates and works with Amazon Private CA, and CA Import can pull Private CA certificates through audit reports written to S3, which AWS limits to once every thirty minutes. Azure Key Vault is a provisioning target, not a CA: the platform stores certificates, keys and chains there and can bind them to web apps. What I couldn't find is any statement that the Key Vault driver supports Azure Government endpoints. Test that, or ask CyberArk, before you rely on it.`,
  "CyberArk 26.1 System Requirements; Supported integrations; Deprecated features; Important considerations; DigiCert, GlobalSign and Entrust CA Gateway driver pages; AWS Certificate Manager CA template; Configuring import from Amazon Private CA; Azure integration prerequisites and permissions.");
}

// ================================================================== 12 Intune coexistence
{
  const s = content(P2, "Intune coexistence: who owns device certificates");
  tag(s, "Who");
  panel(s, "Owns", 0.6, 1.5, 3.9, 3.95, HEX.navy, HEX.navyTint, "INTUNE OWNS DEVICE CERTIFICATES", null, [
    "Cloud PKI issues through SCEP to Intune-managed devices; Intune renews",
    "AD CS-issued Intune certificates (bridge) reach the CLM by CA Import: monitor-only, no renewal binding (design)",
    "SANs: {{DeviceName}} everywhere; {{FullyQualifiedDomainName}} only on domain-joined Windows",
  ], 11.5);
  panel(s, "Reject", 4.65, 1.5, 3.95, 3.95, HEX.red, HEX.redTint, "DOCUMENTED, BUT REJECTED (DESIGN)", null, [
    "The platform can be an Intune third-party SCEP CA (Entra app, Application.Read.All)",
    "It would be a second issuer for a migrating population (Ch 07 rule 1)",
    "Adds a tenant-wide consent; revocation after wipe depends on the third party's API",
  ], 11.5);
  label(s, "Fix label", "CORRECTS BOOK 07 CH 04 — BEING UPDATED", 8.75, 1.5, 4.0);
  panel(s, "Graph", 8.75, 1.82, 4.0, 3.63, HEX.teal, HEX.tealTint, null, "Cloud PKI reporting", [
    "No CyberArk Cloud PKI import exists",
    "Option: a custom job from Graph beta's Cloud PKI leaf report into the WebSDK Discovery/Import API",
    "Intune's certificates report stays the system of record",
  ], 11.5);
  T(s, "Perms", [
    { text: "Custom job needs: ", options: { bold: true, color: HEX.teal } },
    { text: "Graph application permission DeviceManagementCloudCA.Read.All (beta; listed for US Government L4 and L5) and a token with Certificate:Discover." },
  ], { x: 0.6, y: 5.6, w: 12.15, h: 0.75, fontSize: 12 });
  sources(s, "Sources: CyberArk 26.1 Intune integration; CA import; Discovery/Import API; Microsoft Learn SCEP partners, Graph Cloud PKI report; Book 07 Ch 04–07.");
  notes(s,
`Intune coexistence. Intune owns device certificates. Cloud PKI issues to Intune-managed devices through SCEP, and Intune's profiles renew them. The platform's role there is narrow.

During the bridge period, some Intune certificates still come from AD CS through the connector. Because a Microsoft CA import brings in mobile, user and client certificates the platform didn't enroll, those will appear in its inventory. The program's guidance is to import them as monitor-only, with no renewal binding, so Intune stays the renewal engine.

There's an option CyberArk documents that the program rejects. The platform can act as an Intune third-party SCEP CA: Intune profiles point at its SCEP endpoint, and it validates challenges with Intune through an Entra app. But Book 07 chose Cloud PKI for these devices, and this would make the platform a second issuer for a migrating population, which breaks Chapter 07's first coexistence rule. It also adds a tenant-wide consent, and Microsoft notes that revocation after a wipe depends on each third party's API.

Here's the second correction. Book 07 Chapter 04 says the platform reads Cloud PKI's inventory for reporting. CyberArk documents no Cloud PKI import. What exists is Microsoft Graph's beta Cloud PKI leaf-certificate report, and the platform's Discovery Import API. Joining them is a custom job, on a beta API. Book 07 has been updated to say that, and that Intune's certificates report remains the system of record.`,
  "CyberArk 26.1 Integrating with Microsoft Intune; Importing certificates from a CA; WebSDK POST Discovery/Import; Microsoft Learn, Third-party CA SCEP partners; Graph beta retrieveCloudPkiLeafCertificateReport; Create SCEP certificate profiles in Intune; device-naming research brief; Book 07, Chapters 04 to 07.");
}

// ================================================================== Part 3 divider
{
  const s = divider(P3, "Part 3: Discover, own and automate", "Implementation guide  ·  Part 3 of 4",
    ["Discovery scans and CA import", "Ownership: policy folders, owners and the CMDB", "Enrollment automation; Kubernetes, ServiceNow and SIEM"], 7,
    "Sources: CyberArk 26.1 discovery, policy, permissions, ACME, EST, SCEP, OAuth, Kubernetes and logging pages; vCert; cert-manager; ServiceNow Store.");
  notes(s,
`Part 3: discover, own and automate.

First, how the platform finds certificates: discovery scans and CA import. Then how each certificate gets an owner, through policy folders tied to identity and to the CMDB. Then the enrollment protocols, where the third correction to Book 07 sits. And finally three integrations: Kubernetes, ServiceNow and the SIEM, each with a boundary question.`,
  "CyberArk 26.1 discovery, policy, permissions, ACME, EST, SCEP, OAuth, Kubernetes discovery and logging documentation; vCert; cert-manager; ServiceNow Store.");
}

// ================================================================== 13 Discovery
{
  const s = content(P3, "Discovery scans and CA import");
  tag(s, "How");
  table(s, "Disc", 1.5, [2.4, 5.0], ["Method", "What it finds"], [
    ["Network Discovery", "TLS listeners on IPv4 ranges and ports; instant discovery of one IPv4 or IPv6 address"],
    ["CA Import", "Certificates a Microsoft CA or Amazon Private CA issued, by template; optional expired and revoked"],
    ["Onboard Discovery", "Agentless, with app config: F5, NetScaler, IIS (CAPI), AWS, Key Vault, DataPower"],
    ["Server Agent", "Keystores on Windows, RHEL, AIX, Solaris, SLES"],
    ["Discovery/Import API", "Results from a custom collector (token scope Certificate:Discover)"],
  ], { fontSize: 11.5 });
  panel(s, "Recon", 8.15, 1.5, 4.6, 3.35, HEX.teal, HEX.tealTint, "RECONCILIATION", null, [
    "Matches on subject, key usage, EKU and SAN DNS names",
    "The newer certificate becomes active",
    "Not applied to CA Import or Onboard Discovery",
    "So DNS names in SANs must be right",
  ], 12);
  callout(s, "Finding", 5.05, 1.4, "FaFilter", HEX.red, "Every discovered certificate with no issuance record is a finding ",
    "(Book 07 Ch 08). Wave 1: read-only scans of server and appliance ranges, plus CA Import of in-scope AD CS templates (design).");
  sources(s, "Sources: CyberArk 26.1 discovery overview; Network, Onboard and agent discovery; reconciliation; CA import; Discovery/Import API; Book 07, Ch 02, Ch 08.");
  notes(s,
`Discovery. Book 07 Chapter 02 points out that a CA database shows only what that CA issued. Certificates from public CAs, appliances or self-signing don't appear there, and finding them takes network discovery.

The platform has five ways in. Network Discovery scans IPv4 ranges and ports for TLS listeners, and can instantly check a single IPv4 or IPv6 address. CA Import pulls what a Microsoft CA or Amazon Private CA issued, template by template, optionally including expired and revoked certificates. Onboard Discovery is agentless and brings the application configuration with it. And the Discovery Import API takes results from a collector you write, such as the Graph job from Part 2.

Reconciliation decides whether a discovered certificate is one the platform already knows. It matches on subject, key usage, extended key usage and the DNS names in the subject alternative name, and the newer certificate becomes the active one. It doesn't apply to CA Import or Onboard Discovery.

The program's rule, from Book 07 Chapter 08: every certificate found on a listener with no issuance record and no owner is a finding. As design guidance for Wave 1, run read-only network scans of server and appliance ranges, and import the in-scope AD CS templates. That import needs the privileged CA account, so create it under the ESC7 controls first.`,
  "CyberArk 26.1 Certificate discovery overview; Configuring Network Discovery; Certificate reconciliation; Onboard Discovery; Agent discovery; Importing certificates from a CA; WebSDK POST Discovery/Import; Book 07, Chapter 02 and Chapter 08; research brief section 9.");
}

// ================================================================== 14 Ownership
{
  const s = content(P3, "Ownership: policy folders, owners and the CMDB");
  tag(s, "Who");
  panel(s, "Vendor", 0.6, 1.5, 5.6, 3.55, HEX.navy, HEX.navyTint, "WHAT THE PLATFORM PROVIDES", null, [
    "Placement rules and placement jobs put certificates into policy folders",
    "Policy sets inherited settings: CA template, key size and more",
    "Object permissions (View, Read, Write, Create, Revoke, Private Key) and Teams",
    "Roles: Master Admin, Server Owner, Certificate Approver, Team Owner; approval workflows",
    "Expiry intervals per object or policy; notification rules to email, SNMP, syslog, SQL",
  ], 11.5);
  label(s, "Design label", "PROGRAM DESIGN GUIDANCE", 6.4, 1.5, 6.35);
  panel(s, "Design", 6.4, 1.82, 6.35, 3.23, HEX.teal, HEX.tealTint, null, "Tie owners to identity and the CMDB", [
    "Policy tree mirrors Book 07 Ch 05's certificate classes",
    "Every certificate has a named Server Owner; Teams map to Entra groups (26.1 adds SCIM 2.0)",
    "CMDB owners through the ServiceNow app's CI association, if adopted",
    "Alert two renewal windows before expiry with no renewal path",
  ], 11.5);
  callout(s, "Rule", 5.2, 1.3, "FaUserCheck", HEX.amber, "An expiry is an ownership failure first: ",
    "every class has one renewal owner, who answers for it even when automation renews (Book 07 Ch 05).");
  sources(s, "Sources: CyberArk 26.1 placement rules; Policies; permissions and abilities; Teams; Workflows; expiration intervals; notification channels; What's New (SCIM); Book 07, Ch 05 and Ch 08.");
  notes(s,
`Ownership. Book 07 Chapter 05 says an expired certificate is almost always an ownership failure first, so every certificate class has one renewal owner, who answers for it even when automation does the renewing. The platform is where that's recorded.

What the platform provides: placement rules and placement jobs move discovered certificates into policy folders. A folder's policy sets inherited configuration, such as the CA template and key size. Object permissions are granted on folders and objects, and Teams group the people. The documented roles are Master Admin, Server Owner, Certificate Approver and Team Owner, and workflows can require approvals at lifecycle stages.

The program's design guidance turns that into ownership. Build the policy tree to mirror Book 07 Chapter 05's certificate classes, so a certificate's folder tells you its class and its renewal engine. Give every certificate a named Server Owner. Map Teams to Entra groups; release 26.1 adds SCIM 2.0, and CyberArk lists Entra ID as supported for it. If the agency adopts the ServiceNow app, which we'll see next, associate certificates with configuration items so the CMDB owner and the platform's owner agree. And follow Chapter 08's alert: any certificate within two renewal windows of expiry with no renewal path bound to it is an incident while it can still be fixed.`,
  "CyberArk 26.1 Placement rules; Policies overview; Permissions and abilities; Teams and policy folder permissions; Workflows; Configuring expiration event intervals; Notifications and logging; Notification channels; What's New (SCIM 2.0); Vendor support for SSO; ServiceNow Store, Machine Identity Protection; Book 07, Chapters 05 and 08.");
}

// ================================================================== 15 Enrollment
{
  const s = content(P3, "Enrollment automation: ACME, EST, SCEP, REST, agents");
  tag(s, "How");
  label(s, "Fix label", "CORRECTS BOOK 07 CH 08 — BOOK 07 HAS BEEN UPDATED", 0.6, 1.45, 12.15);
  T(s, "ACME FIPS", [
    { text: "ACME doesn't support FIPS mode at all: ", options: { bold: true, color: HEX.red } },
    { text: "the 26.1 Installation Guide says no server used for ACMEv2 can have FIPS enabled (not just win-acme). Run the ACME service on dedicated non-FIPS servers, or get a written vendor statement (design)." },
  ], { x: 0.6, y: 1.75, w: 12.15, h: 0.75, fontSize: 12.5 });
  table(s, "Proto", 2.6, [1.9, 10.25], ["Interface", "What 26.1 documents"], [
    ["ACME", "RFC 8555; http-01, dns-01; tested with certbot, win-acme, acme.sh; KeyChange unsupported; wildcard support stated inconsistently: test it"],
    ["EST", "Port 50443; client-certificate auth; CA Label in the URL picks the template; no /fullcmc, /serverkeygen, /csrattrs"],
    ["SCEP", "Network Device Enrollment on port 80; rules place certificates by challenge or subject; renewals match the existing object"],
    ["REST / vCert", "WebSDK with OAuth tokens; vCert v5.13.9 (July 27, 2026) needs zone View, Read, Write, Create"],
    ["Agentless, agent", "Drivers for IIS, Apache, Java keystores, F5, NetScaler, Key Vault, Palo Alto NGFW and more (licensed per instance); Server Agent"],
  ], { fontSize: 11.5 });
  sources(s, "Sources: CyberArk 26.1 Installation Guide p. 50; ACME; EST and its limits; SCEP and NDE rules; OAuth; System Requirements; What's New; vCert README and releases; Book 07, Ch 08.");
  notes(s,
`Enrollment automation, starting with the third correction to Book 07.

Book 07 Chapter 08 says CyberArk documents that the win-acme client needs FIPS mode off, and advises using another tested client where the server must run in FIPS mode. The 26.1 Installation and Upgrade Guide is broader. It says that because FIPS is not supported for ACMEv2, you can't have FIPS enabled on any server used for ACMEv2. The topic page still names only win-acme; the stricter text governs until CyberArk says otherwise. The program's design guidance: run the ACME service on dedicated servers that aren't in FIPS mode, kept out of the FIPS-mode set, or get a written vendor statement. Book 07 has been updated to match.

The ACME service itself implements RFC 8555 with http-01 and dns-01 challenges, and was designed and tested with certbot, win-acme and acme.sh. The page both lists wildcard issuance and calls it future work, so test it.

EST runs on port 50443 with client-certificate authentication, and a CA label in the URL selects the CA template; three optional EST functions aren't supported. SCEP, for network devices, needs port 80.

For everything else there's the REST API with OAuth tokens, and CyberArk's vCert command-line tool, currently version 5.13.9, which needs view, read, write and create on its zone. Agentless drivers push certificates to the endpoints, licensed per instance in 26.1, and the Server Agent covers the rest.`,
  "CyberArk 26.1 Installation and Upgrade Guide p. 50; ACME overview; EST overview, limitations and reference; Configuring SCEP; NDE rules; Setting up OAuth; System Requirements; What's New; vCert README and latest release; Book 07, Chapter 08.");
}

// ================================================================== 16 K8s, ServiceNow, SIEM
{
  const s = content(P3, "Kubernetes, ServiceNow and SIEM inside the boundary");
  tag(s, "How");
  panel(s, "K8s", 0.6, 1.5, 3.95, 4.95, HEX.navy, HEX.navyTint, "KUBERNETES", "Use cert-manager, not discovery", [
    "Platform Kubernetes Discovery imports from clusters registered to the SaaS, over 443 to api.venafi.cloud",
    "No FedRAMP SaaS, so don't plan on it in the boundary (design)",
    "cert-manager's CyberArk issuer talks to the self-hosted WebSDK: one Issuer per zone; no refresh tokens",
  ], 11.5);
  panel(s, "SN", 4.7, 1.5, 3.95, 4.95, HEX.amber, HEX.amberTint, "SERVICENOW", "Third-party app only", [
    "No first-party CyberArk app found in the Store",
    "AEYRiX \"Machine Identity Protection\" (July 29, 2026) supports Self-Hosted through a MID Server; CMDB CI association",
    "A supply-chain component to assess before adopting",
  ], 11.5);
  panel(s, "SIEM", 8.8, 1.5, 3.95, 4.95, HEX.teal, HEX.tealTint, "SIEM", "Syslog over TLS", [
    "Syslog channel in BSD, CEF or JSON; TLS supported",
    "Collector certificate needs an IP address SAN matching the connection IP, plus Server Authentication EKU",
    "So issue it with an iPAddress SAN even if you configure the collector by name",
  ], 11.5);
  sources(s, "Sources: CyberArk 26.1 Kubernetes discovery; syslog channel; cert-manager CyberArk issuer docs; ServiceNow Store (Machine Identity Protection and Lite); FedRAMP Marketplace.");
  notes(s,
`Three integrations, each with a boundary question.

Kubernetes. The platform has a Kubernetes Discovery component, but it imports certificates from clusters registered to the SaaS edition, and it needs outbound HTTPS to the SaaS service. With no FedRAMP package for the SaaS, the program's guidance is not to plan on it inside the boundary. The in-boundary path is cert-manager. Its CyberArk issuer, formerly the Venafi issuer, talks directly to the self-hosted WebSDK. You configure one issuer per zone, with an access token or username and password, and refresh tokens aren't supported, so plan token rotation.

ServiceNow. I found no first-party CyberArk app in the ServiceNow Store. There is a third-party app from AEYRiX, called Machine Identity Protection, released July twenty-ninth, 2026, that supports the self-hosted edition through a MID Server and associates certificates with CMDB configuration items. That's a third-party supply-chain component, so assess it like one before adopting it.

SIEM. The platform's log server has a syslog channel with BSD, CEF or JSON formats, and it supports TLS. There's a catch worth knowing before you build: the collector's server certificate must carry an IP address subject alternative name that matches the connection IP, plus the server authentication extended key usage. So issue the collector certificate with an IP address SAN even if you configure the collector by name.`,
  "CyberArk 26.1 Configuring Kubernetes discovery; Syslog channel configuration; cert-manager documentation, CyberArk (formerly Venafi) issuer; ServiceNow Store, AEYRiX Machine Identity Protection and Lite editions; FedRAMP Marketplace products.json; device-naming research brief.");
}

// ================================================================== Part 4 divider
{
  const s = divider(P4, "Part 4: Migrate and operate", "Implementation guide  ·  Part 4 of 4",
    ["The build mapped onto Book 07's six waves", "Renewal at shrinking public lifetimes; monitoring and drift", "Decommissioning, decisions and next steps"], 9,
    "Sources: Book 07 Ch 01, Ch 05, Ch 07, Ch 08; CA/Browser Forum Baseline Requirements (via Book 07); CyberArk 26.1 docs.");
  notes(s,
`Part 4: migrate and operate.

First, how the platform build fits into Book 07's six migration waves, as program design guidance. Then renewal as public TLS lifetimes shrink, and how the platform feeds monitoring and drift detection. Then its role in decommissioning AD CS. And finally the decisions to take, the questions for the vendor, and next steps.`,
  "Book 07, Chapters 01, 05, 07 and 08; CyberArk 26.1 documentation.");
}

// ================================================================== 17 Waves
{
  const s = content(P4, "Build sequence mapped to Book 07's six waves");
  tag(s, "How");
  label(s, "Design label", "PROGRAM DESIGN GUIDANCE — NOT VENDOR REQUIREMENTS", 0.6, 1.42, 12.15);
  table(s, "Waves", 1.75, [1.85, 6.3, 4.0], ["Wave (weeks)", "Platform work", "Gate addition"], [
    ["1 Assess (1–4)", "Two-server test cluster and SQL in the boundary; read-only discovery; CA Import of in-scope templates; CA account created under ESC7 controls", "Unexplained certificates logged as findings; CA account in the ESC7 baseline"],
    ["2 Foundation (5–8)", "Production cluster: two per role, load balancer, Always On, keys backed up; FIPS per server, ACME apart; operational certs; Entra SSO; syslog-TLS; policy tree; CA templates and pool; public CA; vault", "DR restore rehearsed; negative test passes; IIS hardening applied"],
    ["3 Pilot (9–16)", "Pilot servers (IIS, Apache, F5, NetScaler, one NPS) onto platform renewal; Server Owners; ACME pilot; autoenrollment stays on", "Every pilot cert has owner and engine; one renewal per driver type"],
    ["4 Scale (17–28)", "Ring by ring off server autoenrollment; EST/SCEP where approved; cert-manager; ServiceNow if adopted", "\"No renewal path\" drift = 0 in scope"],
    ["5 Cutover (29–36)", "Public TLS fully on the platform with CAA-approved CAs; lifetimes on the CA/B schedule; no hand renewals", "Assessor evidence pack"],
    ["6 Decommission (37–44)", "Inventory proves no dependents per CA; retire CA objects; repoint templates", "Record includes CA-object retirement"],
  ], { fontSize: 10.5 });
  sources(s, "Sources: research brief §9 (program design); Book 07, Ch 07 (waves 1–6 and gates), Ch 04 (issuer decision), Ch 08 (drift, decommissioning).");
  notes(s,
`Here's the build mapped onto Book 07's six waves. This is the platform work that runs alongside the Cloud PKI waves, with a gate added to each. It's program design guidance.

Wave 1, Assess, weeks one to four. Stand up a two-server test cluster and its SQL database inside the boundary. Run read-only network discovery and import the AD CS templates in scope. That import needs the privileged CA account, so create it now, under the ESC7 controls. Gate: every certificate without an issuance record is logged as a finding, and the CA account is in the ESC7 baseline.

Wave 2, Foundation. Build production: at least two servers per role, a load balancer, Always On, keys backed up. Decide FIPS mode per server, with ACME on its own servers. Replace the operational certificates, set up Entra single sign-on and syslog over TLS, build the policy tree, one CA template object per AD CS template, a CA pool, the public CA driver and the password-vault connection. Gate: a rehearsed restore, a passing negative test, and IIS hardening applied.

Wave 3, Pilot. Move pilot servers onto platform renewal, IIS, Apache, F5, NetScaler and one NPS server, assign Server Owners, and pilot ACME, with autoenrollment left on for rollback.

Wave 4, Scale, moves servers ring by ring off autoenrollment. Wave 5 puts all public TLS on the platform. Wave 6 retires CAs on the inventory's evidence.`,
  "Research brief section 9 (program design guidance); Book 07, Chapter 07 (migration playbook, waves 1 to 6 and exit gates), Chapter 04 (issuer decision for internal server certificates), Chapter 08 (drift patterns and decommissioning).");
}

// ================================================================== 18 Renewal
{
  const s = content(P4, "Renewal as public TLS lifetimes shrink");
  tag(s, "Why");
  table(s, "CAB", 1.5, [3.0, 2.0, 2.6], ["Public TLS issued", "Max validity", "Renewals/day, 1,000 certs"], [
    ["From Mar. 15, 2026 (in force)", "200 days", "about 7"],
    ["From Mar. 15, 2027", "100 days", "about 15"],
    ["From Mar. 15, 2029", "47 days", "about 31"],
  ], { fontSize: 12 });
  T(s, "Math note", "Last column: Book 07 arithmetic (250 working days, no early renewal). Domain-validation reuse falls to 10 days by 2029.",
    { x: 0.6, y: 3.35, w: 7.6, h: 0.6, fontSize: 11, color: HEX.slate });
  panel(s, "Engines", 8.4, 1.5, 4.35, 4.0, HEX.teal, HEX.tealTint, "HOW THE PLATFORM KEEPS UP", null, [
    "Drivers renew and push to IIS, Apache, F5, NetScaler and others",
    "ACME for web listeners whose client can answer a challenge",
    "dns-01 makes the authoritative zone the gate: consult the DNS team",
    "Internal lifetimes follow the schedule as automation proves itself (Book 07)",
  ], 11.5);
  callout(s, "Rule", 4.1, 1.4, "FaArrowsRotate", HEX.navy, "Book 07's design rule: ",
    "no certificate class may depend on a person remembering a date. Every class runs through Intune, autoenrollment or this platform.");
  sources(s, "Sources: Book 07, Ch 01 (CA/Browser Forum SC-081v3, Baseline Requirements 2.3.1) and Ch 08 (renewal engines, ACME); CyberArk 26.1 drivers and ACME pages.");
  notes(s,
`Why renewal automation can't wait. In April 2025 the CA/Browser Forum adopted a ballot that cuts the maximum validity of publicly trusted TLS certificates in steps. From March fifteenth, 2026, it's two hundred days, and that's in force now. From March fifteenth, 2027, a hundred days. From March fifteenth, 2029, forty-seven days. Book 07 works out what that means for a thousand certificates: about seven renewals every working day today, fifteen next year, and thirty-one in 2029. The reuse period for domain validation falls to ten days, so validation has to be automated too.

That's why Book 07 Chapter 08 sets one design rule: no certificate class may depend on a person remembering a date. Every class runs through one of three engines: Intune profiles, AD CS autoenrollment for domain controllers, or this platform.

On the platform, renewal works two ways. Drivers renew the certificate and push it to the endpoint, IIS, Apache, F5, NetScaler and the others. And ACME clients on web listeners renew themselves against the platform's ACME service. When you use the dns-01 challenge, the authoritative DNS zone becomes the gate for automated issuance, which is why the DNS team is consulted on ACME rollout.

The program aligns internal lifetimes with the schedule too, as the automation proves itself.`,
  "Book 07, Chapter 01 (CA/Browser Forum Ballot SC-081v3; Baseline Requirements 2.3.1; renewal arithmetic) and Chapter 08 (renewal at scale, ACME where it applies); CyberArk 26.1 provisioning driver and ACME documentation.");
}

// ================================================================== 19 Monitoring and drift
{
  const s = content(P4, "Monitoring and drift on the CLM platform");
  tag(s, "How");
  table(s, "Drift", 1.5, [3.1, 5.0, 4.05], ["Drift (Book 07 Ch 08)", "How the platform detects it", "Response"], [
    ["Expiring with no renewal path", "Certificate within two renewal windows of expiry, no engine bound", "Assign the owner; bind to an engine; reissue if late"],
    ["Issuance outside policy", "Discovered certificate with no enrollment record; event 4887 for the CA account outside its templates", "Investigate CA and requester; revoke with the right reason"],
    ["CRL near next update, or stale", "Certificate Revocation Monitoring checks CDP and OCSP endpoints, at least daily", "Publish and verify delivery"],
    ["Trust store drift (SC-17(b))", "Roots tree holds an anchor not on the approved list", "Remove unapproved anchors"],
  ], { fontSize: 11.5 });
  panel(s, "Signals", 0.6, 4.35, 6.0, 2.1, HEX.navy, HEX.navyTint, "SIGNALS TO SECURITY OPERATIONS", null, [
    "Platform events to the SIEM over syslog-TLS (CEF)",
    "Inventory, owners, expiry and renewal status in one view",
  ], 12);
  panel(s, "Evidence", 6.75, 4.35, 6.0, 2.1, HEX.teal, HEX.tealTint, "PERSIST THE EVIDENCE", null, [
    "Drift checks at least weekly; outputs committed to the evidence repository",
    "An assessor asks how long a finding stayed open",
  ], 12);
  sources(s, "Sources: Book 07, Ch 05 (security operations), Ch 08 (monitoring, drift patterns, persisting evidence); CyberArk 26.1 Installation Guide p. 89; syslog channel.");
  notes(s,
`Monitoring and drift. Book 07 Chapter 08 collects certificate signals from many places into one view, and security operations owns the alerts. The platform contributes the inventory, every certificate it knows with its owner, expiry and renewal status, and sends its events to the SIEM over syslog with TLS.

Four of Chapter 08's drift patterns are the platform's to catch. Expiring with no renewal path: a certificate within two renewal windows of expiry with no engine bound to it. Issuance outside policy: a discovered certificate with no enrollment record, or, from Part 2, event 4887 showing the platform's CA account received a certificate outside its templates. CRLs near their next update or served stale: the platform's Certificate Revocation Monitoring component checks CRL distribution points and OCSP endpoints, at least daily. And trust store drift: the program's guidance is to keep the platform's Roots tree limited to approved trust anchors, which is the SC-17 part b question an assessor asks.

And persist the evidence. In the program's model the drift checks run at least weekly, and their outputs are committed to the evidence repository. History matters more than any single run, because an assessor asks how long a finding stayed open, not only whether it's open now.`,
  "Book 07, Chapter 05 (security operations role) and Chapter 08 (monitoring, drift patterns, persisting the evidence); CyberArk 26.1 Installation and Upgrade Guide p. 89 (Certificate Revocation Monitoring); Syslog channel configuration; research brief section 11.");
}

// ================================================================== 20 Decommissioning
{
  const s = content(P4, "Decommissioning AD CS with the CLM inventory");
  tag(s, "How");
  flow(s, "Decom", 1.5, 1.6, [
    { head: "Gate", body: "Cutover done; 30-day rollback window passed", color: HEX.amber, tint: HEX.amberTint },
    { head: "1 No dependents", body: "CLM inventory + CA database" },
    { head: "2–5 Retire the CA", body: "Stop issuance, archive, final CRL, uninstall" },
    { head: "6 Clean up trust", body: "Entra, Intune, NTAuth and the CLM CA object" },
    { head: "7–9 Endpoints, record", body: "CDP/AIA until last expiry; decommission record" },
  ], 11.5);
  panel(s, "Platform", 0.6, 3.3, 6.0, 3.15, HEX.navy, HEX.navyTint, "THE PLATFORM'S PART", null, [
    "Step 1: prove no unexpired certificate in a migrated class is still in use",
    "Repoint CyberArk CA templates to a retained CA, or to the standalone CA after AD",
    "Step 6: retire the CA object in the platform; the record says so",
  ], 12);
  panel(s, "After", 6.75, 3.3, 6.0, 3.15, HEX.teal, HEX.tealTint, "AFTER ACTIVE DIRECTORY", null, [
    "Server issuance moves to a standalone AD CS CA under the same root",
    "Template policy then lives in the platform's policy, not in AD",
    "No new root to distribute; same trust chain",
  ], 12);
  sources(s, "Sources: Book 07, Ch 08 (decommissioning steps 1–9), Ch 07 (Wave 6), Ch 04 (after Active Directory); CyberArk 26.1 MS ADCS (enterprise and standalone).");
  notes(s,
`Decommissioning is Book 07's Wave 6, and the platform has a defined part in it.

The gate comes first: cutover complete, the thirty-day rollback window passed with no incidents, and every retained certificate class documented and running on the CAs that remain.

Step one of Book 07's procedure is to confirm nothing depends on the CA, and the platform's inventory is the main evidence, together with the CA database. It has to show that no unexpired certificate in a migrated class is still in use. Steps two to five retire the CA itself: stop new issuance, back up and archive the database and key, revoke outstanding certificates for cessation of operation and publish the final CRL, and uninstall the role services. Before you stop issuance, repoint any CyberArk CA template objects that used this CA to a retained CA, so renewals don't fail.

Step six cleans up trust: the Entra trust store, Intune trusted certificate profiles, NTAuth, and the CA object in the platform. Retiring that CA object is the platform owner's task, and the decommission record should say it was done. Steps seven to nine keep the CRL and AIA endpoints serving until the last certificate expires, and commit the record.

After Active Directory retires, Book 07 moves server issuance to a standalone AD CS issuing CA under the same root, still driven by the platform, which supports standalone Microsoft CAs. Template policy then lives in the platform, and there's no new root to distribute.`,
  "Book 07, Chapter 08 (Decommissioning AD CS, steps 1 to 9), Chapter 07 (Wave 6), Chapter 04 (after Active Directory); CyberArk 26.1 Microsoft ADCS Enterprise and Standalone CA template; Microsoft Learn, Manage certificate templates.");
}

// ================================================================== 21 Decisions and next steps
{
  const s = content(P4, "Decisions, vendor asks and next steps");
  tag(s, "How");
  panel(s, "Decide", 0.6, 1.5, 4.0, 4.95, HEX.navy, HEX.navyTint, "DECISIONS TO TAKE", null, [
    "FIPS mode per server; which servers run ACME",
    "HSM or software key; SQL Enterprise or Standard",
    "Console sign-in: Entra SSO with CBA",
    "Public CA path, if Entrust today",
    "Build the Graph-beta Cloud PKI feed, or not",
    "Adopt the third-party ServiceNow app, or not",
  ], 11.5);
  panel(s, "Ask", 4.75, 1.5, 4.0, 4.95, HEX.amber, HEX.amberTint, "ASK CYBERARK IN WRITING", null, [
    "ACME and FIPS: which statement governs",
    "AD CS on Windows Server 2025: supported",
    "Which crypto module the product uses; any CMVP coverage",
    "Key Vault driver on Azure Government",
    "PIV/CAC console login",
  ], 11.5);
  panel(s, "Next", 8.9, 1.5, 3.85, 4.95, HEX.teal, HEX.tealTint, "NEXT STEPS", null, [
    "Stand up the Wave 1 test cluster",
    "Create the CA account under ESC7 controls",
    "Lab-test allowed and denied requests",
    "Book 07 updates: Ch 03/05 (ESC7), Ch 04 (Cloud PKI), Ch 08 (ACME)",
  ], 11.5);
  sources(s, "Sources: research brief §0, §12 and §13; Book 07, Ch 04, Ch 05, Ch 07, Ch 08; CyberArk 26.1 documentation cited in Parts 1–3.");
  notes(s,
`To close: decisions, vendor asks, and next steps.

The decisions to take. Which servers run in FIPS mode, and which separate servers run ACME. Whether database secrets are protected by an HSM or by the software key, and whether SQL is Enterprise or Standard. Console sign-in through Entra single sign-on with certificate-based authentication. The public CA path, if the agency uses Entrust today. Whether to build the Cloud PKI feed on a beta API, and whether to adopt the ServiceNow app.

Ask CyberArk, in writing: which statement governs ACME and FIPS; whether AD CS on Windows Server 2025 is supported, given the stale table; which cryptographic module the product uses, and whether any CMVP certificate covers it; whether the Key Vault driver works with Azure Government; and whether PIV or CAC console login is supported as such.

Next steps: stand up the Wave 1 test cluster, create the CA account under the ESC7 controls, and lab-test allowed and denied requests. Book 07 has been updated in Chapters 03 and 05 for the ESC7 caveat, Chapter 04 for Cloud PKI reporting, and Chapter 08 for ACME and FIPS.

The program's recommendation is plain: CyberArk Certificate Manager, Self-Hosted, is the right platform for Book 07's lifecycle. It's the agency's existing machine-identity vendor, it covers every issuer the design assigns to it, and its risks are known and manageable. The backup slides list the risks, the assessor evidence and what couldn't be verified. This is the program's research, under review, not an endorsement by any federal agency. Thank you.`,
  "Research brief sections 0, 12 and 13; Book 07, Chapters 03, 04, 05, 07 and 08; CyberArk 26.1 documentation cited in Parts 1 to 3.");
}

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  sources(s, "Sources: full lists on the following slides. All sources opened Oct. 22, 2026.");
}

{
  const s = content("Backup", "Assessor evidence checklist");
  table(s, "Evidence", 1.45, [3.3, 6.75, 2.1], ["Evidence", "What the assessor reads", "Controls"], [
    ["Product and version", "Configuration Console About or upgrade status showing 26.1.x; vendor lifecycle date", "CM-8"],
    ["Cryptography", "FIPS policy state per server, and which run ACME; HSM model and its CMVP cert; statement that no product CMVP cert exists", "SC-13"],
    ["Database and keys", "Always On config, FULL recovery, backup schedule and last restore test; software key export custody", "SC-12, CP-9, CP-10"],
    ["CA account", "AD CS Security tab export; template ACLs; negative-test record; 4887, 4882, 4890, 4892 alerts", "AC-6, AU-6"],
    ["Console access", "Entra SAML/OIDC config; Master Admin membership and PIM eligibility; token lifetimes", "IA-2, AC-2"],
    ["Inventory", "% of in-scope certs with a Server Owner; expiring-without-renewal-path report; unknown-issuer findings", "CM-8, SC-17"],
    ["Logging", "Syslog-TLS channel config and SIEM receipt of platform events", "AU-4, AU-6"],
    ["Policy and approvals", "Policy tree against Book 07 Ch 05's renewal table; workflow approvals for sensitive templates", "SC-17(a)"],
    ["Hardening", "IIS hardening applied; operational certificates replaced", "SC-8, CM-6"],
    ["Trust anchors", "Roots tree limited to approved anchors", "SC-17(b)"],
  ], { fontSize: 10.5 });
  sources(s, "Sources: research brief §11 (program mapping); Book 07, Ch 08 (evidence an assessor reads); NIST SP 800-53 Rev. 5.");
}

{
  const s = content("Backup", "Risks register");
  table(s, "Risks", 1.45, [3.6, 5.2, 3.35], ["Risk", "Why it matters", "Manage it by"], [
    ["ACME and FIPS conflict", "Installation Guide forbids FIPS on ACME servers; topic page names only win-acme", "Separate non-FIPS ACME servers; vendor statement"],
    ["Kubernetes discovery needs the SaaS", "No FedRAMP package for the SaaS", "cert-manager issuer to the self-hosted WebSDK"],
    ["Entrust driver removed in 26.1", "Public TLS path breaks on upgrade if Entrust", "Plan the CA path before upgrading"],
    ["WS2025 AD CS support unclear", "Integrations table stops at 2022", "Written confirmation before Wave 2"],
    ["Concentration of privilege", "Certificate manager on CAs, admin on targets, private keys in the DB", "ESC7 controls; vault; Tier 0 handling"],
    ["English-only Windows and SQL; Standard SQL", "Weekly index-rebuild outage on Standard", "Enterprise edition, or schedule it"],
    ["Third-party ServiceNow app", "Supply-chain component plus MID Server", "Assess before adopting"],
    ["No CMVP or current CC certificate", "Can't claim validated crypto for the product", "FIPS-mode Windows plus HSM evidence"],
    ["Vendor docs inconsistent; renaming", "Wildcard ACME, stale tables; Palo Alto may rename again", "Lab-verify; check contract names"],
  ], { fontSize: 10.5 });
  sources(s, "Sources: research brief §0 and §12; CyberArk 26.1 docs; Common Criteria archived list; ServiceNow Store; Book 07, Ch 07.");
}

{
  const s = content("Backup", "Couldn't verify, or login-gated");
  T(s, "Gaps", bullets([
    "CyberArk Community and Marketplace (Prereq Check Script, Base Configuration Utility, Knowledge Center deprecation list, product life-cycle dates): login-gated.",
    "Which cryptographic module the product uses, and whether CMVP #5205 covers it: no vendor statement found.",
    "Azure Key Vault driver support for Azure Government endpoints: not found.",
    "CyberArk's own ServiceNow integration (Service Graph Connector): the blog redirects to a Palo Alto Idira page; scope and edition unknown.",
    "Explicit PIV/CAC smart-card login to the console: not documented (client-certificate login is).",
    "Certificate-manager restriction configuration on Windows Server 2025 AD CS: Microsoft says it isn't documented.",
    "Let's Encrypt or any generic ACME-client issuance from the platform to public CAs: not documented.",
    "NIST CMVP status-filtered searches returned identical lists for Active, Historical and Revoked; the two CyberArk certificates read Active on their own pages.",
  ], 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 6, fontSize: 13 });
  sources(s, "Sources: research brief §13 (couldn't verify / login-gated), Oct. 22, 2026.");
}

const srcSlide = (title, src) => {
  const s = content("Backup", title);
  T(s, "Source list", bullets(src, 11), { x: 0.6, y: 1.45, w: 12.1, h: 5.1, paraSpaceAfter: 3, fontSize: 11 });
  sources(s, "Sources: primary documents as listed. Access date for all: Oct. 22, 2026.");
};
srcSlide("Sources: CyberArk documentation, version 26.1", [
  "All at docs.venafi.com/Docs/current/TopNav/Content/ (mirrors docs.cyberark.com/mis-self-hosted): landing page; Installation and Upgrade Guide 26.1 PDF (July 2026); System Requirements; Supported integrations; What's New; Deprecated features; Important considerations.",
  "Install: Always On high availability; rolling upgrades; SQL Enterprise vs Standard; software key backup; gMSA; Windows auth requirements and overview; securing the web server; authentication options.",
  "Encryption keys: system keys overview; using HSM-protected keys; HSM configuration  ·  Disaster recovery: prerequisites; database recovery; HSM recovery  ·  Security: hardening best practices; IIS hardening.",
  "Drivers: Microsoft ADCS CA template; MSCA certificate settings; Microsoft CA Pool; CA chaining; DigiCert; GlobalSign; Entrust CA Gateway; AWS Certificate Manager; Azure prerequisites, app driver and permissions; CAPI permissions; F5 LTM Advanced; NetScaler; Apache; JKS.",
  "Discovery: importing certificates from a CA; Microsoft CA import; Amazon Private CA import; overview; Network Discovery; reconciliation; placement rules; Onboard Discovery; agent discovery; Kubernetes discovery.",
  "Enrollment: ACME (26.1); EST overview, limitations, reference; SCEP; NDE rules; Integrating with Microsoft Intune  ·  SDK: OAuth setup; WebSDK POST Discovery/Import.",
  "Identity and logging: certificate auth in the platform and IIS; Configuration Console Authentication node; login experience; SSO vendor support; syslog channel; notification channels; notifications and logging; expiration intervals.",
  "Administration: permissions and abilities; Teams and policy folders; policies; workflows; credential best practice (Enterprise Password Vault); securing credential objects.",
  "Palo Alto Networks, Next-Gen Trust Security, Certificate Manager page  ·  vCert README and latest release (v5.13.9, July 27, 2026)  ·  cert-manager, CyberArk (formerly Venafi) issuer.",
]);
srcSlide("Sources: Microsoft, government, standards and Book 07", [
  "Microsoft Learn: Secure, delegate and audit a certification authority; Review and dispose of pending certificate requests; Manage certificate templates; Defender for Identity certificate posture assessments.",
  "Microsoft Learn: Third-party CA SCEP partners for Intune; Graph beta retrieveCloudPkiLeafCertificateReport and summary report (Get-MgBetaDeviceManagementReportCloudPkiLeafCertificateReport); Create SCEP certificate profiles in Intune.",
  "FedRAMP Marketplace dataset, fedramp.gov/marketplace/products.json (last change Oct. 22, 2026).",
  "NIST CMVP validated-modules search (Vendor Venafi; Vendor CyberArk); certificates #5205 and #5122  ·  Common Criteria Portal certified and archived product lists  ·  NIST SP 1800-16, Securing Web Transactions: TLS Server Certificate Management (June 2020).",
  "ServiceNow Store: AEYRiX Machine Identity Protection; Machine Identity Protection Lite.",
  "Book 07: Ch 01 (CA/Browser Forum schedule), Ch 02 (inventory), Ch 03 (ESC7, auditing), Ch 04 (target PKI, CLM scope, FedRAMP posture), Ch 05 (roles, renewal ownership, four permission systems), Ch 06, Ch 07 (coexistence rules, waves 1–6), Ch 08 (renewal engines, ACME, monitoring, drift, decommissioning, evidence), Appendices A–B.",
  "Research brief, After Active Directory: who names devices and who registers their DNS records (Intune SCEP SAN variables).",
  "Program design guidance and inferences are labeled on the slides; they are not vendor or Microsoft statements.",
]);

// ------------------------------------------------------------------ report
const narrated = per.reduce((a, p) => a + p.n, 0);
console.log(`slides: ${pres.slides.length}; narrated notes: ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
console.log("per slide:\n" + per.map((p) => `  ${p.slide}  ${(p.n / WPM).toFixed(1)} min  ${p.n} w  ${p.title}`).join("\n"));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
