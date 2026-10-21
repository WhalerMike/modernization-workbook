// Book 02 — Identity & Directory: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — Assessing the forest:   Module 1 (Ch07 read-only discovery), Module 2 (Ch08 + Appendices B–C).
//   Part 2 — Building the Entra ID target and migrating:  Module 3 (Ch09), Module 4 (Ch10 + Ch11).
// Build:  node presentations/b02-identity-technical/build.js presentations/b02-identity-technical/B02_Identity_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b02-identity/; the notes name the chapter.
// Narration: presentations/_build/narrate.py and captions.py, then build_narrated.ps1 (editor runs that).
const D = require("../_build/lib.js")({ book: "Book 02", title: "Identity & Directory — Technical Deep Dive" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout, sources } = D;
const OUT = process.argv[2] || "B02_Identity_Technical.pptx";

// ------------------------------------------------------------------ helpers
// Speaker notes with an automatic timing cue (narration runs ~142 words a minute).
const WPM = 142;
let clock = 0, words = 0;
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const n = body.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; words += n;
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};

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

const P1 = "Part 1 — Assessing the forest";
const P2 = "Part 2 — Building the target and migrating";

// ================================================================== 1 Title
{
  const s = D.titleSlide("Orientation", "Identity & Directory: the technical deep dive", "Book 02 — from Active Directory assessment to a governed Entra ID tenant");
  txt(s, "Session map", [
    { text: "Part 1 — Assessing the forest", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  Read-only discovery   ·   Module 2  Assessing the forest", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Building the Entra ID target and migrating", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Building the target   ·   Module 4  Migrating, governing, proving", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.2, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 02 of the Federal Modernization Workbook, Identity and Directory. It's for the architects and engineers who will actually run the move from Active Directory to Microsoft Entra ID.

It comes in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is assessing the forest: first what a standard account can learn without any elevated access, then the full privileged assessment and the evidence pipeline behind it. Part 2 is building the Entra ID target and migrating onto it: the sync, sign-in, group, service account, privileged access and Conditional Access decisions, then governance, the eleven-phase playbook, and a reference deployment that shows the whole sequence on one estate.

The slides show tables, flows and decision matrices. The code lives in the chapters and appendices; I'll point you to it rather than put it on screen.`,
  "Book 02, index; Chapters 07–11; Appendices B–C.");
}

// ================================================================== 2 Why this matters
{
  const s = D.content("Orientation", "Why this matters: identity now decides access");
  tag(s, "Why");
  subhead(s, "Policy head", "FEDERAL POLICY MOVED THE ACCESS DECISION", 0.6, 1.5, 5.6);
  const pol = [
    ["FaLandmark", "OMB M-22-09", HEX.navy, "Centralized identity, phishing-resistant MFA, at least one device signal; log in to applications, not networks"],
    ["FaBook", "NIST SP 800-207", HEX.teal, "No implicit trust from network location; access decided per session by dynamic policy"],
    ["FaSitemap", "CISA ZTMM", HEX.amber, "Identity is the first of five pillars, validated continuously at the optimal level"],
  ];
  pol.forEach((r, i) => {
    const y = 1.88 + i * 1.12;
    icon(s, r[0], 0.6, y + 0.05, 0.6, r[2]);
    txt(s, `Policy ${i + 1}`, [
      { text: r[1], options: { bold: true, color: r[2], fontSize: 15.5, breakLine: true } },
      { text: r[3], options: { fontSize: 13 } },
    ], { x: 1.35, y, w: 4.9, h: 1.05 });
  });
  subhead(s, "Direction head", "MICROSOFT'S DIRECTION — AD ISN'T RETIRING, BUT EVERY HYBRID PIECE IS MOVING", 6.5, 1.5, 6.3);
  table(s, "Direction", 1.85, [1.75, 4.4], ["Signal", "What Microsoft states"], [
    ["Sync", "Cloud Sync is replacing Connect Sync, which retires at full functional parity"],
    ["Federation", "Migrate from AD FS to cloud authentication, with password hash sync"],
    ["Protocols", "All NTLM versions deprecated June 2024; NTLMv1 removed in Windows 11 24H2 and Server 2025"],
    ["Authority", "Converting synced users to cloud-managed went GA in January 2026, object by object"],
  ], { x: 6.6, fontSize: 12.5 });
  callout(s, "Trap", 5.35, 1.1, "FaTriangleExclamation", HEX.red, "The lift-and-shift trap: ",
    "sync the forest as it stands and stale accounts, old trusts and privileged accounts arrive in the tenant, while the delegation and policy intent the OU tree carried has nowhere to land.");
  sources(s, "Sources: OMB M-22-09 (Jan. 26, 2022); NIST SP 800-207; CISA ZTMM v2.0; Microsoft Learn — Connect Sync, AD FS migration, NTLM deprecation, source-of-authority conversion. Book 02, Ch 01.");
  notes(s,
`Why this matters. Federal policy moved the access decision off the network and onto identity. OMB M-22-09 requires centralized identity management, phishing-resistant multifactor authentication for staff, contractors and partners, and at least one device-level signal, and it says users should log into applications rather than networks. NIST SP 800-207 grants no implicit trust from network location: access is decided per session by dynamic policy. And CISA's Zero Trust Maturity Model makes identity the first of its five pillars, validated continuously at the optimal level.

So the identity provider is the policy decision point for the whole estate. Whatever it believes about a person, a group or a device is what gets enforced, everywhere, at machine speed.

Microsoft isn't retiring Active Directory; it says it continues to support and enhance it. The forcing comes from the direction of its investment. Cloud Sync is replacing Connect Sync, which retires once Cloud Sync reaches full functional parity. Microsoft recommends moving from AD FS to cloud authentication with password hash sync. All versions of NTLM were deprecated in June 2024, and NTLMv1 is removed in Windows 11 24H2 and Windows Server 2025. And since January 2026 you can convert a synced user to cloud-managed, one object at a time.

The trap is the lift and shift. Synchronize the forest as it stands, and stale accounts, undocumented trusts and synced privileged accounts arrive in the tenant, while the delegation and policy intent that the OU tree carried has nowhere to land.`,
  "Book 02, Chapter 01 — Why Identity Matters.");
}

// ================================================================== 3 What the migration has to move
{
  const s = D.content("Orientation", "What the migration actually has to move");
  tag(s, "What");
  panel(s, "Placement", 0.6, 1.5, 5.75, 3.7, HEX.navy, HEX.navyTint, "CHAPTERS 02–03", "Placement becomes attributes", [
    "In AD an object's position decides delegation and policy; Entra ID governs by what an object carries",
    "Administrative units can't nest: an OU tree becomes a flat set of units",
    "An object can be in at most 30 administrative units",
    "For synced users, extension attributes are read-only in Graph: their source of authority is AD",
  ], 13.5);
  subhead(s, "Surface head", "THE ELEVEN DEPENDENCY TYPES (CHAPTER 04)", 6.6, 1.5, 6.1);
  const types = [
    ["1–5", "Users, computers, service accounts, groups, GPOs", "What most plans count", HEX.navy, HEX.navyTint],
    ["6–9", "DNS and DHCP, PKI, RADIUS and NPS, LDAP apps", "Fail silently when AD goes", HEX.red, HEX.redTint],
    ["10–11", "SPNs and service identities, trusts", "No direct Entra ID counterpart", HEX.amber, HEX.amberTint],
  ];
  types.forEach((t, i) => {
    const y = 1.88 + i * 1.12;
    box(s, `Type ${i + 1}`, 6.6, y, 6.15, 1.0, t[4]);
    txt(s, `Type ${i + 1} num`, t[0], { x: 6.75, y, w: 1.05, h: 1.0, fontSize: 20, bold: true, fontFace: "Cambria", color: t[3], valign: "middle" });
    txt(s, `Type ${i + 1} text`, [
      { text: t[1], options: { bold: true, color: t[3], fontSize: 14, breakLine: true } },
      { text: t[2], options: { fontSize: 13 } },
    ], { x: 7.8, y: y + 0.1, w: 4.85, h: 0.85, valign: "middle" });
  });
  callout(s, "Adapters", 5.35, 1.1, "FaCubes", HEX.amber, "One adapter per dependency: ",
    "PKI, RADIUS and the LDAP proxy are critical because they fail silently; the sync engine is high priority but finishes last, because it's the tether that keeps AD in production.");
  sources(s, "Sources: Microsoft Learn — administrative units and limits, onPremisesExtensionAttributes, cross-tenant synchronization. Book 02, Chapters 02–04.");
  notes(s,
`What has to move. Chapters 02 through 04 make two points that drive everything in this session.

First, placement becomes attributes. In Active Directory, an object's position in the forest, domain and OU tree decides who administers it and which Group Policy applies. Move a user to another OU and its administrators, inherited policies and often its access all change without anyone editing the user. Entra ID has no tree. It governs objects by what they carry: attributes, memberships, role assignments and policy conditions. Two limits decide how far the usual answer, administrative units, gets you. Administrative units can't nest, so an OU tree becomes a flat set of units. An object can belong to at most thirty of them. And for synced users, Graph treats the extension attributes as read-only, because their source of authority is still Active Directory. So the values your rules match on are written on-premises and arrive with each sync cycle.

Second, the surface is bigger than users and groups. The program's inventory names eleven dependency types. The first five are what plans usually count. Types six through nine, DNS and DHCP, PKI, RADIUS and the Network Policy Server, and LDAP-bound applications, fail silently when AD goes away. Types ten and eleven, service principal names and trusts, have no direct counterpart in Entra ID.

Each dependency gets an adapter. The PKI, RADIUS and LDAP proxy adapters are critical, because they fail silently. The sync engine finishes last, because it's what keeps AD in production until everything else has moved. The rest of this session is how you find all of that, rebuild it, and prove it.`,
  "Book 02, Chapter 02 — The Structural Problem; Chapter 04 — The Hidden Migration Surface.");
}

// ================================================================== 4 Module 1 divider
{
  const s = divider(P1, "Module 1: Read-only discovery", "Part 1 — Assessing the forest  ·  Chapter 07",
    ["What a standard domain account can read by default", "Where the default read boundary sits", "Turning gaps into a narrow, time-bound delegation request"], 8);
  notes(s,
`Module 1: read-only discovery. An assessment team rarely gets privileged access on day one. Authorization paperwork, security review and trust between teams all take time. The program spends that window learning what the directory already tells every employee.

A standard domain account, with no rights beyond the default, can read most of what the migration plan needs. Starting there changes nothing in the directory, applies least privilege, NIST SP 800-53 control AC-6, to the assessment team itself, and turns the request for elevated access into a list built from evidence instead of a general request for Domain Admin.`,
  "Book 02, Chapter 07 — Read-Only Discovery.");
}

// ================================================================== 5 What a standard account can read
{
  const s = D.content(P1, "What a standard account can read in a default forest");
  tag(s, "What");
  const b = table(s, "Read surface", 1.5, [3.9, 2.85, 5.4], ["Area", "Typical read-only result", "What it contributes to the plan"], [
    ["Topology, domain controllers, sites, subnets, site links", "Readable", "Scope, functional levels, the shape of replication"],
    ["OU hierarchy and Group Policy links", "Readable", "The structure attribute-driven targeting replaces"],
    ["GPOs and settings reports", "Usually, unless security filtering restricts a GPO", "The GPO-to-Intune inventory"],
    ["Users, groups, computers, SPNs", "Readable", "Identity inventory; service account discovery"],
    ["Certificate templates and enrollment services", "Readable (configuration partition)", "The AD CS dependency surface"],
    ["AD-integrated DNS zones", "Often readable; test it", "The DNS dependency surface"],
    ["Replication health; DNS server settings", "Needs a right or server access", "A delegation item or an admin export"],
  ], { fontSize: 12.5 });
  box(s, "Grants", 0.6, b + 0.15, 12.15, 6.5 - b - 0.15, HEX.tealTint);
  txt(s, "Grants text", [
    { text: "Why it's broad: ", options: { bold: true, color: HEX.teal } },
    { text: "Authenticated Users gets general, public, personal and web property sets on users; Pre–Windows 2000 Compatible Access gets read-all-properties on users and groups, and in most domains it contains Authenticated Users. " },
    { text: "So run a pre-flight: ", options: { bold: true, color: HEX.teal } },
    { text: "test what this account reads in this forest, and record which access every export relied on." },
  ], { x: 0.85, y: b + 0.22, w: 11.7, h: 6.5 - b - 0.3, fontSize: 13.5, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — password writeback access rights (default permissions); Active Directory security groups (Pre–Windows 2000 Compatible Access). Book 02, Ch 07.");
  notes(s,
`Here's what a standard account typically reads. Forest and domain topology, domain controllers, sites, subnets and site links are readable, which gives you scope, functional levels and the shape of replication. The OU hierarchy and Group Policy links are readable: that's the structure the attribute design later replaces. GPOs and their settings reports are usually readable, unless security filtering restricts a particular GPO. Users, groups, computers and service principal names are readable, which is your identity inventory and the start of service account discovery. Certificate templates and enrollment services sit in the configuration partition, so the AD CS dependency surface is visible too. AD-integrated DNS zones are often readable; test it. What you usually can't see is replication health and DNS server settings such as scavenging. Those need a right or server access, so they become a delegation item or an administrator-provided export.

Why is the default so broad? Read access is the sum of several default grants. Authenticated Users receives the general, public, personal and web information property sets on user objects. Pre–Windows 2000 Compatible Access receives list, read-all-properties and read-permissions rights on users, groups and InetOrgPerson objects. Its membership depends on a choice made when the domain was created: in the Windows 2000-and-later mode it contains Authenticated Users; in the older compatible mode, Everyone and Anonymous.

So in most domains a standard account reads most attributes of users and groups, but the exact result depends on the domain's history. The first step is therefore a pre-flight that tests what this account can actually read in this forest. Every later export records which access it relied on.`,
  "Book 02, Chapter 07 — Read-Only Discovery, \"What a standard account can read.\"");
}

// ================================================================== 6 The read boundary
{
  const s = D.content(P1, "Where the default read boundary sits");
  tag(s, "What");
  const cards = [
    ["FaUserShield", "Protected accounts", HEX.navy, HEX.navyTint, [
      "AdminSDHolder holds the template; SDProp resets protected objects every 60 minutes on the PDC emulator",
      "adminCount = 1 means is or was privileged: a clean-up list, not the current population"]],
    ["FaLock", "Confidential attributes", HEX.teal, HEX.tealTint, [
      "searchFlags bit 7 (128) requires CONTROL_ACCESS as well as read",
      "Windows LAPS: the expiration attribute shows coverage without reading the password",
      "Legacy LAPS is deprecated as of Windows 11 23H2: a finding already"]],
    ["FaKey", "Secrets", HEX.red, HEX.redTint, [
      "Password hashes leave a DC only by replication: Replicating Directory Changes and Changes All",
      "Never requested; any holder other than a DC or the sync account is a finding"]],
    ["FaDoorClosed", "Restricted containers", HEX.amber, HEX.amberTint, [
      "Deleted Objects: System and Administrators only; Reanimate Tombstone never needed",
      "Fine-grained password policies are Domain Admin territory: record as not seen"]],
  ];
  cards.forEach((c, i) => {
    const x = 0.6 + i * 3.07;
    box(s, `Card ${i + 1}`, x, 1.5, 2.93, 3.75, c[3]);
    icon(s, c[0], x + 0.15, 1.63, 0.55, c[2]);
    txt(s, `Card ${i + 1} head`, c[1], { x: x + 0.8, y: 1.63, w: 2.05, h: 0.55, bold: true, color: c[2], fontSize: 15, fontFace: "Cambria", valign: "middle" });
    txt(s, `Card ${i + 1} text`, bullets(c[4], 12.5), { x: x + 0.15, y: 2.3, w: 2.68, h: 2.9, paraSpaceAfter: 5 });
  });
  callout(s, "Coverage", 5.45, 1.05, "FaChartLine", HEX.slate, "Report measured coverage only: ",
    "the source guide quoted about 87 percent read-only coverage, and its own arithmetic gives about 94. Neither is a measurement; the pre-flight result is.");
  sources(s, "Sources: Microsoft Learn — Protected Accounts and Groups; mark an attribute confidential (KB 922836); Windows LAPS; DS-Replication-Get-Changes-All; Deleted Objects (KB 892806). Book 02, Ch 07.");
  notes(s,
`The assessment report should never claim coverage it doesn't have, so you need to know exactly where the default read boundary sits. Four mechanisms set it, and several are commonly misstated.

Protected accounts and groups. The AdminSDHolder object holds template permissions for Domain Admins, Enterprise Admins, Schema Admins, the operator groups, krbtgt and others. A process called S D Prop runs every sixty minutes by default on the PDC emulator and resets those objects to match. It acts on current members only. An account removed from a protected group keeps admin count set to one unless someone clears it. So admin count lists accounts that are or were privileged: a good clean-up list, not the current privileged population.

Confidential attributes. Setting bit seven, value one hundred twenty-eight, of an attribute's search flags means reading it needs the control access right as well, which by default only administrators hold. You can still show where a capability is deployed without seeing the secret: with Windows LAPS, the presence and age of the password expiration attribute shows coverage. Legacy Microsoft LAPS is deprecated as of Windows 11 23H2, so a forest still on it has a finding before the assessment even reaches identity.

Secrets. Password hashes leave a domain controller only through replication, which needs Replicating Directory Changes and Replicating Directory Changes All. The assessment never requests those. But which accounts already hold them is a key later check: any holder that isn't a domain controller or the sync service account is a finding.

Restricted containers. Deleted Objects is visible only to System and Administrators. Restoring needs Reanimate Tombstone, which an assessment never needs. Fine-grained password policies belong to Domain Admins, so record them as not seen rather than inferring them.

Finally, report only measured coverage.`,
  "Book 02, Chapter 07 — Read-Only Discovery, \"Where the default read boundary sits.\"");
}

// ================================================================== 7 Gap list and delegation request
{
  const s = D.content(P1, "From gap list to a narrow, time-bound delegation request");
  tag(s, "How");
  table(s, "Gaps", 1.5, [2.55, 2.85, 2.2], ["Gap", "Narrowest way to close it", "Read-only substitute"], [
    ["Replication health", "Admin-run replication summary, or SIEM data", "None reliable"],
    ["DC event logs", "Log export or SIEM read access", "None"],
    ["DNS server settings", "DNS administrator export", "Zone reads cover records only"],
    ["Issued-certificate database", "CA administrator export", "Template permissions"],
    ["Deleted Objects", "Read on the container for one named account", "Recycle Bin status"],
    ["Fine-grained password policies", "Domain Admin export", "None"],
    ["LAPS, BitLocker recovery", "Not requested; coverage only", "Expiration and child objects"],
  ], { fontSize: 12 });
  panel(s, "Rules", 8.0, 1.5, 4.75, 3.15, HEX.amber, HEX.amberTint, "THE REQUEST'S FIXED RULES", null, [
    "Read only; secret-exposing rights never requested",
    "Specific: right, object path, business reason per line",
    "Time-bound: accountExpires matches the window",
    "One named, dedicated standard account",
    "Prefer an export to a granted right",
  ], 13);
  panel(s, "Safe", 8.0, 4.75, 4.75, 1.75, HEX.navy, "FFFFFF", "RUN IT SAFELY", null, [
    "Tell security operations first: LDAP enumeration trips discovery alerts",
    "Hash every output file in a manifest; protect it as a map of the estate",
  ], 12.5);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-6); Microsoft Learn — Defender for Identity discovery alerts; Deleted Objects access; fine-grained password policies. Book 02, Ch 07.");
  notes(s,
`Every gap read-only discovery couldn't close gets recorded with four facts: what's missing, the narrowest right or export that would close it, why the plan needs it, and whether there's a read-only substitute.

Replication health and domain controller event logs come from an administrator-run summary, a log export, or SIEM access; the event logs are where you see NTLM use. DNS server settings like aging and scavenging come from a DNS administrator export, because zone reads cover records but not server settings. The issued-certificate database comes from a CA administrator, and tells you which certificates must be reissued from a new PKI. Deleted Objects needs read on that one container for one named account. Fine-grained password policies need a Domain Admin export. And confidential attributes like LAPS and BitLocker recovery data are never requested at all: you report coverage only.

The gap list becomes a short written request, and it follows fixed rules, because the request is what makes the least-privilege position credible. Read only: no write, create, delete or permission rights, and never the rights that expose secrets. Specific: each line names the right, the exact object path and the business reason; "Domain Admin for the assessment" is not an acceptable line. Time-bound: each delegation expires with the assessment window, and the account's expiry is set to match. One named, dedicated account with no existing elevated memberships. And preferably an export: if the directory team can run the report and hand over the output, that beats granting a right. The directory team implements the delegation with its own change process.

Run it safely. Tell security operations first, because broad LDAP enumeration looks like reconnaissance, and Defender for Identity raises discovery alerts for it. The output is a map of the estate, so keep it encrypted on a dedicated workstation, record a SHA-256 hash of every file in a manifest and disable the account when you're done.`,
  "Book 02, Chapter 07 — Read-Only Discovery, \"Recording what read-only discovery couldn't see\" and \"The delegation request.\"");
}

// ================================================================== 8 Module 2 divider
{
  const s = divider(P1, "Module 2: Assessing the forest", "Part 1 — Assessing the forest  ·  Chapter 08, Appendices B–C",
    ["Eight collection areas and the narrow rights they need", "Topology, Group Policy, AD CS, delegation, accounts and trusts", "The pipeline that turns each run into evidence"], 13);
  notes(s,
`Module 2: assessing the forest. Chapter 07 ends with a gap list. Chapter 08 fills it with the privileged half of discovery: the configuration partition, ACLs on OUs, every GPO's settings, DNS server configuration, the PKI containers and CA settings, and the delegation flags on every account.

The program's position is that the assessment is an evidence-producing process, not a set of scripts. Every run collects a fixed set of artifacts into a fixed directory layout, writes a manifest with a SHA-256 hash of every file, and commits the run to the program's Git repository. Appendix B carries the complete module, restored and corrected; Appendix C carries the identity-side module.`,
  "Book 02, Chapter 08 — Assessing the Forest; Appendix B — Forest Assessment Module.");
}

// ================================================================== 9 Eight areas, narrow rights
{
  const s = D.content(P1, "Eight collection areas, each on the narrowest right");
  tag(s, "How");
  table(s, "Rights", 1.5, [2.25, 3.45, 2.35], ["Collector area", "Minimum rights", "Main output"], [
    ["Topology", "Authenticated user", "ForestTopology.json"],
    ["OU hierarchy", "Read on OUs and their security descriptors", "OUHierarchy, OUDelegations"],
    ["Group Policy", "Read on GPOs and SYSVOL; delegated backup right", "GPOInventory, XML reports"],
    ["DNS", "Read on each DNS server object (not DnsAdmins)", "DNSInventory.json"],
    ["AD CS", "Read on Public Key Services; read on each CA", "PKISecurityReport.json"],
    ["Computers", "Authenticated user", "DelegationReport.csv"],
    ["Users and groups", "Authenticated user", "UserInventory, GroupInventory"],
    ["Trusts", "Authenticated user to list; Domain Admin to verify", "TrustMap.json"],
  ], { fontSize: 12 });
  panel(s, "Refuse", 8.45, 1.5, 4.3, 2.65, HEX.red, HEX.redTint, "RIGHTS THE PROGRAM REFUSES", null, [
    "DnsAdmins: a privileged group that Defender for Identity flags",
    "Standing Domain Admin: only trust verification needs it, run separately under just-in-time elevation",
  ], 13);
  panel(s, "Host", 8.45, 4.25, 4.3, 2.25, HEX.navy, HEX.navyTint, "THE HOST AND ACCOUNT", null, [
    "Windows Server 2025 or Windows 11 (build 26100+) with RSAT",
    "A gMSA with delegated read only; PSPKI optional",
  ], 13);
  sources(s, "Sources: Microsoft Learn — RSAT Features on Demand; DnsAdmins security assessment; netdom trust; Run assessments with MSAs; PSPKI (PKI Solutions). Book 02, Ch 08; App. B.");
  notes(s,
`The full assessment covers eight areas, run in a fixed order: forest topology, the OU hierarchy, Group Policy, DNS, AD CS, computers, users and groups, and trusts. Most of the forest is readable by any authenticated user. The parts that aren't are the reason Chapter 08 exists, so each collector runs on the narrowest right that works.

Topology, computers, and users and groups need only an authenticated user; delegation attributes are readable by default, though recursive group expansion is slow in big forests. The OU collector needs read permission on the OUs' security descriptors, because some ACLs aren't readable by default. Group Policy needs read on the GPOs and SYSVOL, plus the backup right through Group Policy Management delegation. DNS needs read on each DNS server, delegated on the server object. AD CS needs read on the Public Key Services containers and on each CA. And trusts: any user can list them, but verification needs domain administrator credentials.

Two rights the source design asked for are refused. DnsAdmins: Microsoft treats it as privileged, because its members control the DNS Server service, and Defender for Identity flags non-privileged members as a risk. Grant read on the DNS server object to a dedicated group instead. And standing Domain Admin: no assessment run uses one. Trust verification is the only step that needs those rights, and it runs separately under just-in-time elevation.

The host is a domain-joined Windows Server 2025 or Windows 11 machine with the Remote Server Administration Tools, at build 26100 or later. The account is a group managed service account, with delegated read and nothing more, so no password is ever stored. Two corrections from review: the AD CS administration module the source required isn't used by any function, and the PSPKI module is now optional, because its publisher no longer actively supports it.`,
  "Book 02, Chapter 08 — Assessing the Forest, \"Prerequisites\" and \"Security and least privilege\"; Appendix B.");
}

// ================================================================== 10 Topology, OUs, Group Policy
{
  const s = D.content(P1, "Topology, OUs and Group Policy: what the inventory must get right");
  tag(s, "What");
  panel(s, "Topology", 0.6, 1.5, 3.95, 4.95, HEX.navy, HEX.navyTint, "TOPOLOGY", "Roles and levels", [
    "Five FSMO roles: two per forest, three per domain — a three-domain forest has eleven holders",
    "The forest-root PDC emulator is the forest's time source",
    "Flag a functional level below 2016: a Server 2025 DC can't join it",
    "Server 2025 is the first new functional level since 2016",
  ], 12.5);
  panel(s, "OUs", 4.7, 1.5, 3.95, 4.95, HEX.teal, HEX.tealTint, "OU HIERARCHY", "Four things per OU", [
    "Placement and size: DN, depth, ManagedBy, object counts",
    "GPO links via Get-GPInheritance: order, enforced, enabled, blocked",
    "Non-inherited ACEs, built-ins dropped: the hand-made delegations",
    "A text rendering for human review",
  ], 12.5);
  panel(s, "GPO", 8.8, 1.5, 3.95, 4.95, HEX.amber, HEX.amberTint, "GROUP POLICY", "Classify before you migrate", [
    "Unlinked or empty: retire, don't migrate",
    "Overlapping: resolve first; Intune's migration refuses conflicting values",
    "Live: linked, enabled, non-empty, needs a decision",
    "Search site links too, or in-use GPOs look unlinked",
    "Group Policy analytics imports XML under 4 MB",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — FSMO roles; forest and domain functional levels; Get-GPInheritance; Group Policy scope; Intune Group Policy analytics. Book 02, Ch 08.");
  notes(s,
`Three areas carry most of the planning weight.

Topology first. Active Directory has five operations master roles. Two are forest-wide, the schema master and the domain naming master. Three exist in every domain: the PDC emulator, the RID master and the infrastructure master. So a three-domain forest has eleven role holders to record, not five. The PDC emulator in the forest root is also the authoritative time source for the forest. Record every functional level and flag two conditions. A level below Windows Server 2016 blocks the domain controller refresh, because a Server 2025 controller can join only a domain at 2016 or higher. And mixed domain levels. Server 2025 is the first new functional level since 2016. Capture site links with cost and interval, and the subnet map: an unmapped subnet sends clients to arbitrary domain controllers.

Second, the OU hierarchy. The goal is to capture what the tree encodes so the attribute design reproduces intent, not structure. For each OU, record placement and size; its GPO links, preferably through Get-GP-Inheritance, which returns link order, enforcement, enabled state and inheritance blocking; its non-inherited access control entries, with built-in principals dropped, which are the delegations someone made by hand and become the administrative unit candidates; and a text rendering for review.

Third, Group Policy, the largest and most consequential artifact. Every live setting moves to Intune, moves elsewhere, or retires. Sort GPOs into three groups. Unlinked or empty ones are retirement candidates. Overlapping settings must be resolved first, because Intune's migration refuses conflicting values. Live settings need a decision. One correction: the source searched only OUs and the domain root, so site-linked GPOs looked unlinked. And Intune's Group Policy analytics imports XML reports under four megabytes, so check sizes in the manifest.`,
  "Book 02, Chapter 08 — Assessing the Forest, \"Forest and domain topology,\" \"OU hierarchy and delegation,\" \"Group Policy inventory and analysis.\"");
}

// ================================================================== 11 AD CS escalation patterns
{
  const s = D.content(P1, "AD CS: the escalation patterns the assessment checks");
  tag(s, "What");
  table(s, "ESC", 1.5, [0.95, 4.6, 2.6], ["Pattern", "Condition", "Source of truth"], [
    ["ESC1", "Enrollee supplies the subject, an authentication EKU, no manager approval or signature, broad enroll rights", "Template name and enrollment flags, EKUs, ACL"],
    ["ESC2", "Any Purpose EKU, or no EKU at all", "Template EKU attributes"],
    ["ESC4", "Broad groups can write the template (Full Control, Write DACL)", "Template ACL"],
    ["ESC6", "CA flag EDITF_ATTRIBUTESUBJECTALTNAME2 lets any requester add a SAN", "certutil -getreg policy\\EditFlags"],
    ["ESC7", "Broad groups hold Manage CA or Manage Certificates", "The CA's own ACL; Appendix B doesn't collect it"],
  ], { fontSize: 12.5 });
  panel(s, "Fix", 8.95, 1.5, 3.8, 4.95, HEX.red, HEX.redTint, "THE CORRECTION THAT MATTERS", "Test the EKU, not key usage", [
    "The source tested Digital Signature key usage, which almost every template has",
    "Authentication EKUs: Client Auth, Smart Card Logon, PKINIT, Any Purpose",
    "A candidate counts only if a CA publishes it and broad groups can enroll",
    "Report only; the PKI owner remediates (Book 07)",
  ], 12.5);
  txt(s, "Lineage", [
    { text: "Naming: ", options: { bold: true, color: HEX.navy } },
    { text: "SpecterOps' 2021 research defined ESC1–ESC8; its tooling now covers patterns through ESC16. Defender for Identity's definitions are the reference." },
  ], { x: 0.6, y: 5.75, w: 8.15, h: 0.7, fontSize: 13 });
  sources(s, "Sources: SpecterOps (Certify; 2021 research); Microsoft Learn — Defender for Identity certificate assessments; certenroll.h flag enumerations; certutil; RFC 4556; RFC 5280. Book 02, Ch 08; App. B.");
  notes(s,
`AD CS matters twice in a migration. It issues the certificates devices, domain controllers and smart cards depend on, and its misconfigurations are among the most direct privilege-escalation paths in a forest.

The ESC naming comes from SpecterOps' 2021 research, which defined ESC1 through ESC8; its tooling now covers patterns through ESC16. Defender for Identity's definitions are the program's reference, and the assessment checks the ones it can see.

ESC1 is a template where the enrollee supplies the subject, an authentication extended key usage is allowed, no manager approval or authorized signature is required, and broad groups can enroll. ESC2 is a template with the Any Purpose usage, or none at all. ESC4 is a template ACL that gives a broad group rights such as Full Control or Write DACL. ESC6 is the CA flag that lets every requester specify the subject alternative name for every template; Microsoft's fix is to clear the flag and restart the service. ESC7 is broad groups holding Manage CA or Manage Certificates. That one needs the CA's own security settings, which Appendix B's collector doesn't read; Defender for Identity assesses it where a sensor runs on the CA.

The correction that matters most: the source's ESC1 check tested for the Digital Signature key usage. Almost every template has that, so it flagged nearly everything. The check has to test the extended key usage for an authentication purpose: client authentication, smart card logon, PKINIT client authentication, or Any Purpose. And a template that passes is a candidate only if a CA actually publishes it and broad groups can enroll.

Report only. Remediation belongs to the PKI owner, through Book 07. The same inventory also tells you whether user certificates can move to Entra certificate-based authentication.`,
  "Book 02, Chapter 08 — Assessing the Forest, \"Certificate Services (AD CS)\"; Appendix B — AD CS collector.");
}

// ================================================================== 12 Computers, delegation, accounts
{
  const s = D.content(P1, "Delegation, privileged groups and service accounts");
  tag(s, "What");
  subhead(s, "Deleg head", "CLASSIFY KERBEROS DELEGATION BY WHAT'S SET, IN THIS ORDER", 0.6, 1.5, 6.1);
  const b1 = table(s, "Delegation", 1.85, [3.3, 2.75], ["Attributes", "Classification"], [
    ["TrustedForDelegation true", "Unconstrained: critical unless a DC"],
    ["AllowedToDelegateTo + TrustedToAuthForDelegation", "Constrained, protocol transition"],
    ["msDS-AllowedToDelegateTo only", "Constrained, Kerberos only"],
    ["PrincipalsAllowedToDelegateToAccount", "Resource-based constrained"],
  ], { fontSize: 12.5 });
  txt(s, "Stale", [
    { text: "Staleness: ", options: { bold: true, color: HEX.navy } },
    { text: "LastLogonDate can lag by up to two weeks, so pair it with PasswordLastSet and use 90 days, as Defender for Identity does." },
  ], { x: 0.6, y: b1 + 0.15, w: 6.05, h: 0.85, fontSize: 13 });
  subhead(s, "SA head", "FOUR KINDS OF SERVICE ACCOUNT", 6.95, 1.5, 5.8);
  const b2 = table(s, "Service accounts", 1.85, [2.0, 3.8], ["Kind", "Migration note"], [
    ["User with SPNs", "Kerberoastable; highest priority to replace"],
    ["Standalone MSA", "One computer; password managed by it"],
    ["gMSA", "Several servers; password managed by the domain"],
    ["dMSA", "Server 2025 domains; machine-bound, disables the old password"],
  ], { x: 6.95, fontSize: 12.5 });
  box(s, "Limits", 6.95, b2 + 0.15, 5.8, 6.5 - b2 - 0.15, HEX.amberTint);
  txt(s, "Limits text", bullets([
    "Expand privileged groups recursively; report orphaned adminCount accounts",
    "A DC returns at most 5,000 values of member per response",
    "At most 1,015 group memberships per principal",
  ], 12.5), { x: 7.15, y: b2 + 0.22, w: 5.45, h: 6.5 - b2 - 0.3, paraSpaceAfter: 3, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — Kerberos constrained delegation; lastLogonTimestamp; dMSA and gMSA overviews; privileged access levels; 5,000-value LDAP limit; AD DS maximum limits. Book 02, Ch 08.");
  notes(s,
`Every computer object is a migration decision: Entra join, hybrid join, Azure Arc, retirement, or keep in Active Directory. The inventory carries the delegation attributes, and the source got two things wrong here, so classify by what's actually set, in this order.

Trusted for delegation set to true is unconstrained delegation. It lets a service impersonate any user who authenticates to it, to any service. Domain controllers are expected to have it, so exclude them as Defender for Identity does; every other unconstrained entry becomes a critical issue. A target list plus trusted-to-authenticate-for-delegation is constrained delegation with protocol transition. A target list alone is constrained, Kerberos only. The source labeled protocol transition even without a target list. And resource-based constrained delegation, which the source missed entirely, is configured on the resource side.

Staleness: Last Logon Date is a converted timestamp that can lag the true last logon by up to two weeks, so it's good enough for a ninety-day test, not a seven-day one. Pair it with Password Last Set, and treat a computer as stale only when both are old.

For users, expand the eight privileged groups recursively: Domain Admins, Enterprise Admins, Schema Admins, Administrators and the four operator groups. Then report orphaned admin count accounts, using recursive membership; the source's direct match missed nested members and over-reported orphans.

Service accounts come in four kinds. User accounts with service principal names are Kerberoastable and the highest priority to replace. Group managed service accounts span servers and stay the default for multi-server services. Delegated managed service accounts exist only in Server 2025 domains and disable the original password.

Two limits matter in large forests: a domain controller returns at most five thousand values of a multivalued attribute per response, and a principal can be in at most one thousand fifteen groups.`,
  "Book 02, Chapter 08 — Assessing the Forest, \"Computer objects\" and \"Users, groups and service accounts.\"");
}

// ================================================================== 13 Trusts
{
  const s = D.content(P1, "Trusts: decode the bits, state the direction plainly");
  tag(s, "What");
  subhead(s, "Bits head", "trustAttributes — DECODE FROM THE SPECIFICATION, KEEP THE RAW VALUE", 0.6, 1.5, 6.3);
  table(s, "Bits", 1.85, [0.75, 2.2, 3.25], ["Bit", "Name", "Meaning"], [
    ["0x1", "Non-transitive", "Can't be used transitively"],
    ["0x2", "Uplevel only", "Windows 2000 and later clients only"],
    ["0x4", "Quarantined domain", "SID filtering applies"],
    ["0x8", "Forest transitive", "Cross-forest, between forest roots"],
    ["0x10", "Cross-organization", "Partner isn't part of the organization"],
    ["0x20", "Within forest", "Partner is in the same forest"],
    ["0x40", "Treat as external", "Forest trust filtered as external"],
  ], { fontSize: 12.5, firstColor: HEX.teal });
  txt(s, "Later bits", [
    { text: "Keep the raw value too: ", options: { bold: true, color: HEX.navy } },
    { text: "the specification defines later bits for AES keys, RC4, PIM trusts and TGT delegation control, so nothing added later is lost." },
  ], { x: 0.6, y: 5.0, w: 6.2, h: 1.0, fontSize: 13 });
  panel(s, "Direction", 7.1, 1.5, 5.65, 2.45, HEX.navy, HEX.navyTint, "DIRECTION", "Access flows opposite to trust", [
    "Trusted domain's users reach the trusting domain's resources",
    "The source had inbound reversed: state which side's users reach which side's resources",
  ], 13);
  panel(s, "Posture", 7.1, 4.05, 5.65, 2.45, HEX.teal, HEX.tealTint, "POSTURE AND VERIFICATION", null, [
    "Selective authentication on: hardened. SID filtering on: standard. Neither: a finding",
    "Verify with netdom /verify under admin credentials, as a separate elevated step; Test-ADTrust isn't a cmdlet",
    "A forest trust doesn't convert: it names a partner to redesign in cross-tenant access",
  ], 12.5);
  sources(s, "Sources: [MS-ADTS] trustAttributes; Microsoft Learn — Get-ADTrust; netdom trust and query; forests and trusts; cross-tenant access overview. Book 02, Ch 08; App. B.");
  notes(s,
`Trusts are where undocumented history usually hides. Each trust is a trusted domain object in its domain's System container, and Get-AD-Trust returns them all.

Decode the trust attributes from the published bit values in the Active Directory technical specification, not from memory. One means non-transitive. Two, uplevel only: Windows 2000 and later clients. Four, quarantined domain: SID filtering applies. Eight, forest transitive: a cross-forest trust between forest root domains. Hex ten, cross-organization: the partner isn't part of your organization. Hex twenty, within forest. And hex forty, treat as external: a forest trust filtered as if it were external. The specification also defines later bits, for AES keys, RC4 and TGT delegation control, so record the raw value as well as the decoded list. That way, bits added later aren't lost.

Direction is relative, and access flows the opposite way to trust: members of the trusted domain can reach resources in the trusting domain. Seen from one domain, an inbound trust lets this domain's users reach the partner's resources, and an outbound trust lets the partner's users reach resources here. The source had this reversed. So for each trust, the assessment states plainly which side's users can reach which side's resources.

Then rate posture. Selective authentication on is hardened. SID filtering on is standard. Neither is a finding.

Verification: the source called Test-AD-Trust, which isn't a cmdlet in the ActiveDirectory module. Use netdom trust with the verify switch, which checks the secure channel secrets, or netdom query trust with verify for every outbound trust. Both need administrative credentials, so verification runs as its own elevated step, outside the scheduled collection.

Finally, a forest trust doesn't convert into anything in Entra ID. It identifies a partner whose access has to be redesigned with cross-tenant access settings, which Module 4 covers.`,
  "Book 02, Chapter 08 — Assessing the Forest, \"Trust relationships\"; Appendix B — trusts.");
}

// ================================================================== 14 The pipeline
{
  const s = D.content(P1, "Every run is evidence: manifest, Git and drift");
  tag(s, "How");
  flow(s, "Pipe", 1.5, 1.95, [
    { head: "Orchestrate", body: "Invoke-FMPADAssessment runs the collectors in a fixed order; a failed step is recorded, not hidden" },
    { head: "Manifest", body: "Run ID, host, account, window, and a SHA-256 hash for every file" },
    { head: "One commit", body: "A branch per run; the multi-file contents API commits the whole run at once" },
    { head: "Issues", body: "Only critical PKI patterns and unconstrained delegation", color: HEX.red, tint: HEX.redTint },
    { head: "Plans", body: "Artifacts feed the GPO, device, PKI, DNS and identity plans", color: HEX.amber, tint: HEX.amberTint },
  ], 12.5);
  panel(s, "Drift", 0.6, 3.6, 6.0, 2.9, HEX.teal, HEX.tealTint, "DRIFT", "Weekly, compared by stable key", [
    "A changed hash says that something changed; compare parsed objects by GUID or SID to say what",
    "Exclude timestamps, or every file looks changed",
    "Schedule under the gMSA: no stored password",
  ], 13);
  panel(s, "Handling", 6.75, 3.6, 6.0, 2.9, HEX.navy, "FFFFFF", "HANDLING", "A map for an attacker", [
    "Encrypted volumes; repository limited to the team and plan owners",
    "Keep 12 months; delete after 36 unless on legal hold",
    "Sign the module: AllSigned or RemoteSigned, never Bypass",
    "API token in a header from a credential store, never a URL",
  ], 13);
  sources(s, "Sources: Gitea API specification and API usage; Microsoft Learn — group managed service accounts; Run assessments with MSAs. Book 02, Ch 08; App. B (16 corrections to the source design).");
  notes(s,
`What makes a run evidence is the pipeline around the collectors.

The orchestrator runs them in the fixed order and writes the assessment manifest: a new GUID for the run; the domain, host and account; the start, end and duration; the staleness threshold; and every output file with its size, time and SHA-256 hash. A failed step is recorded in the manifest rather than stopping the run, so a partial run is visible as partial. Anyone holding the repository can recompute the hashes and show nothing changed after collection.

Then one run, one commit. The reference design uses a self-hosted Gitea instance. Each run gets its own branch, named for the domain and timestamp, and the multi-file contents endpoint commits the whole run, manifest included, as a single commit. The source committed one file per API call, hundreds of commits per run.

Issues are raised automatically for two classes only: critical PKI patterns, and unconstrained delegation on accounts that aren't domain controllers. Everything else goes to the planning documents: GPO reports to the Intune plan, computers to the device plan, the PKI report to certificate-based authentication readiness, trusts to the partner access plan, and users and groups to the identity design.

Drift: run weekly and compare with the last run. A changed hash tells you that something changed. To say what, compare parsed objects by a stable key, a GUID or SID, and exclude timestamps. Schedule under the managed service account, so no password is stored.

Handling: the data is a map for an attacker. Encrypt it, restrict the repository, keep runs at least twelve months and delete after thirty-six unless a legal hold applies, sign the module, and keep the API token in a credential store, never in a URL. Appendix B lists sixteen corrections made to the source design.`,
  "Book 02, Chapter 08 — Assessing the Forest, \"The assessment pipeline,\" \"Git integration,\" \"Security and least privilege\"; Appendix B.");
}

// ================================================================== 15 Module 3 divider
{
  const s = divider(P2, "Module 3: Building the Entra ID target", "Part 2 — Building the target and migrating  ·  Chapter 09, Appendix C",
    ["Decomposing AD and what each construct becomes", "Sync engine, sign-in method, groups and service accounts", "Privileged access and the Conditional Access framework"], 14);
  notes(s,
`Part 2: building the Entra ID target and migrating onto it. Module 3 is the target design.

The chapter's premise fits in one sentence. In Active Directory, where an object sits decides what applies to it. In Entra ID, what an object says about itself decides. So the target has to be built from attributes, not copied from containers. The environment throughout is a Microsoft 365 Government Community Cloud tenant, which uses the worldwide Microsoft Graph endpoint, not the separate endpoints that GCC High and DoD use. Check each feature against the government service descriptions, because some reach GCC later.`,
  "Book 02, Chapter 09 — Building the Entra ID Target.");
}

// ================================================================== 16 Decompose and license
{
  const s = D.content(P2, "Decompose first: where each AD construct lands, and its license");
  tag(s, "What");
  table(s, "Constructs", 1.5, [2.6, 4.25], ["AD construct", "Entra ID target"], [
    ["OU: policy scoping", "Conditional Access and Intune, targeted by group"],
    ["OU: delegation", "Administrative units (free to create)"],
    ["OU: logical organization", "Dynamic groups and attributes"],
    ["Forest", "The tenant: one trust boundary, no domain hierarchy"],
    ["Trusts", "B2B and cross-tenant access settings"],
    ["AdminSDHolder", "PIM plus protected actions, together"],
    ["Schema Admins", "No equivalent: Microsoft manages the schema"],
  ], { fontSize: 12.5 });
  table(s, "Licensing", 1.5, [3.3, 1.75], ["Feature", "Tier"], [
    ["Conditional Access", "P1"],
    ["Dynamic groups", "P1 per member"],
    ["AU-scoped administrator", "P1 each"],
    ["PIM, including PIM for Groups", "P2"],
    ["Risk-based Conditional Access", "P2"],
    ["Access reviews, entitlement", "Governance"],
    ["Lifecycle Workflows", "Governance"],
    ["CA for workload identities", "Workload ID Premium"],
  ], { x: 7.7, fontSize: 12.5, firstColor: HEX.teal });
  callout(s, "memberOf", 5.55, 0.95, "FaTriangleExclamation", HEX.red, "Replace any memberOf rule now: ",
    "after November 3, 2026 dynamic groups, dynamic AUs and access package auto-assignment that use the preview operator stop updating.");
  sources(s, "Sources: Microsoft Learn — Entra licensing; ID Governance licensing fundamentals; administrative unit licensing; memberOf dynamic rule (preview); protected actions. Book 02, Ch 09.");
  notes(s,
`Before any object moves, decompose the AD identity model into its parts, because each has its own path.

OUs do three jobs, and each goes somewhere different. Group Policy scoping becomes Conditional Access and Intune profiles, targeted by group membership, not container. Administrative delegation becomes administrative units, which are free to create, though each AU-scoped administrator needs P1. Logical organization becomes dynamic groups and attributes. The forest maps to the tenant: one trust boundary, no domain trusts inside it, and verified domains are routing suffixes, not security boundaries. Trusts become B2B and cross-tenant access settings. AdminSDHolder has no equivalent; Privileged Identity Management, which makes assignments eligible and time-bound, and protected actions, which demand an authentication context before high-impact permissions are used, together serve its purpose. And Schema Admins has none: Microsoft manages the schema.

This is the design principle: Entra ID inverts the governance model. Attributes decide memberships, and memberships decide policy. That's why attribute quality gates everything after it.

Licensing gates the governance features. Conditional Access needs P1. Dynamic groups need P1 per unique member. PIM, including PIM for Groups, and risk-based Conditional Access need P2. As of October 2026, access reviews and entitlement management need Entra ID Governance for the member users involved, with only some capabilities left under P2, and Lifecycle Workflows need Governance. Conditional Access for workload identities is a separate Workload Identities Premium license. The chapters assume P2 for everyone and Governance for the governed populations.

One date to act on: the preview member-of operator ends November 3, 2026. After that, dynamic groups, dynamic administrative units and auto-assignment policies that use it freeze. Replace those rules now.`,
  "Book 02, Chapter 09 — Building the Entra ID Target, \"Decomposing the Active Directory identity landscape\" and \"Licensing for governance features.\"");
}

// ================================================================== 17 Sync engine
{
  const s = D.content(P2, "Choosing the sync engine: Cloud Sync unless a Connect-only need applies");
  tag(s, "How");
  table(s, "Engines", 1.5, [3.6, 2.55, 2.55], ["Capability", "Connect Sync", "Cloud Sync"], [
    ["Deployment", "Windows Server", "Lightweight agents"],
    ["Disconnected forests", "No", "Yes"],
    ["High availability", "One active + staging", "Multiple active agents"],
    ["Objects per AD domain", "No stated limit", "Up to 150,000"],
    ["Group size", "250,000 members", "50,000 members"],
    ["Advanced sync rules", "Yes", "No (expressions)"],
    ["Cross-forest references, merging", "Yes", "No"],
    ["Group provisioning to AD", "No", "Yes"],
    ["On-demand provisioning", "No", "Yes"],
  ], { fontSize: 12.5 });
  txt(s, "Corrections", [
    { text: "Two corrections to older guidance: ", options: { bold: true, color: HEX.navy } },
    { text: "Connect's Group Writeback v2 was discontinued on June 30, 2024 — Cloud Sync's group provisioning to AD replaces it; and Cloud Sync now handles Exchange hybrid writeback. Never run two active Connect servers against one tenant." },
  ], { x: 0.6, y: 5.15, w: 8.7, h: 1.3, fontSize: 13 });
  panel(s, "Rec", 9.45, 1.5, 3.3, 4.95, HEX.teal, HEX.tealTint, "THE PROGRAM'S RULE", "Stay on Connect only for", [
    "More than 150,000 objects in a domain",
    "Groups over 50,000",
    "Advanced sync rules",
    "Cross-forest references or attribute merging",
    "Both can run with mutually exclusive scopes",
  ], 13);
  sources(s, "Sources: Microsoft Learn — Cloud Sync migration decision guide (Oct. 2026 revision); Group Writeback v2 discontinuation; hybrid identity scenarios. Book 02, Ch 09.");
  notes(s,
`The first hybrid-period decision is the sync engine. Connect Sync is the long-standing, full-featured engine on a Windows Server. Cloud Sync is a lightweight agent with its configuration in the cloud, and Microsoft now calls it the strategic direction: new features are built primarily on it.

Here's the comparison from Microsoft's decision guide as of its October 2026 revision. Connect Sync runs on a server; Cloud Sync runs as agents, which can sit on existing domain controllers. Both handle connected multi-forest; only Cloud Sync handles disconnected forests, which matters after mergers. For availability, Connect has one active server with a staging standby; Cloud Sync runs multiple active agents with automatic failover. Scale: Cloud Sync supports up to a hundred fifty thousand objects per AD domain and groups up to fifty thousand members; Connect has no stated object limit and goes to two hundred fifty thousand members. Connect has advanced sync rules and cross-forest references; Cloud Sync has neither. And Cloud Sync can provision groups from Entra ID back to AD, and test with on-demand provisioning; Connect can't.

Two corrections to older guidance. Group Writeback version two in Connect Sync was a preview that Microsoft discontinued on June 30, 2024; Cloud Sync's group provisioning to AD replaces it. And Cloud Sync now handles Exchange hybrid writeback, so Exchange alone no longer forces Connect.

The program's rule: Cloud Sync for new deployments, and plan to migrate existing Connect installations. Stay on Connect only where a forest needs something Cloud Sync doesn't do: more than a hundred fifty thousand objects in a domain, groups over fifty thousand, advanced rules, cross-forest references, or attribute merging. Both engines can run in one forest with mutually exclusive scopes, so you can move in stages. And never run two Connect servers in active mode against one tenant.`,
  "Book 02, Chapter 09 — Building the Entra ID Target, \"Choosing and configuring the sync engine.\"");
}

// ================================================================== 18 Sign-in and matching
{
  const s = D.content(P2, "Sign-in method and object matching");
  tag(s, "How");
  table(s, "Sign-in", 1.5, [2.4, 1.75, 1.75, 1.65], ["Criterion", "Password hash sync", "Pass-through", "AD FS"], [
    ["Validation", "Cloud", "Cloud, after an on-prem agent check", "On-premises"],
    ["Extra infrastructure", "None", "At least three agents, Tier 0", "AD FS and WAP farms"],
    ["Survives on-prem outage", "Yes", "No", "No"],
    ["Leaked-credential detection", "Yes", "Only with PHS on", "Only with PHS on"],
    ["Program position", { text: "Preferred", options: { bold: true, color: HEX.teal } }, "Transitional", { text: "Decommission", options: { bold: true, color: HEX.red } }],
  ], { fontSize: 12.5 });
  panel(s, "Match", 8.4, 1.5, 4.35, 3.6, HEX.navy, HEX.navyTint, "WHEN SYNC MEETS AN EXISTING CLOUD OBJECT", null, [
    "Hard match: sourceAnchor (ms-DS-ConsistencyGuid) to onPremisesImmutableId",
    "Soft match: UPN or primary SMTP, only if no immutable ID yet",
    "Either overwrites the cloud object: clean AD first",
    "Keep both match types blocked outside a planned window",
  ], 12.5);
  callout(s, "Hard match", 5.25, 1.25, "FaUserShield", HEX.red, "Since July 1, 2026: ",
    "Entra ID blocks a hard match onto a cloud account that already has onPremisesObjectIdentifier, or holds or is eligible for a privileged role — for both engines. Keep administrators cloud-only.");
  sources(s, "Sources: Microsoft Learn — choose the right authentication method; PTA agents; Connect for an existing tenant (hard-match protections); sign-in options. Book 02, Ch 09.");
  notes(s,
`The second decision is where passwords are validated. With password hash sync, validation happens in the cloud against a synchronized hash of the password hash, with no extra infrastructure, and it survives an on-premises outage. Pass-through authentication validates in the cloud after an on-premises agent checks AD; Microsoft recommends at least three agents in production, treated as tier zero, and it doesn't survive an outage. Federation with AD FS validates on-premises and needs AD FS and Web Application Proxy farms, load balancers and certificates.

Leaked-credential detection needs password hash sync. Microsoft recommends enabling it whichever method you choose: it's the fallback if agents or federation fail, and organizations that had it on recovered from ransomware outages in hours rather than weeks. The failover is manual. So the program's position is password hash sync preferred everywhere, pass-through transitional, and AD FS a decommission target.

Then, matching. When sync adds an object that might already exist in the cloud, Entra ID tries a hard match first: the source anchor, by default the consistency GUID, against the cloud object's immutable ID. Without one, a soft match on UPN or primary SMTP address, which only works if the cloud object has no immutable ID yet. Either one overwrites the cloud object's attributes, including the password hash, so clean AD first. Two tenant settings block soft match and hard-match takeover; Microsoft advises leaving both blocked except in a planned matching window.

And since July 1, 2026, Entra ID blocks a hard match onto a cloud account that already has an on-premises object identifier, or holds or is eligible for a privileged role, for both engines. Don't plan to take over cloud administrator accounts by sync.`,
  "Book 02, Chapter 09 — Building the Entra ID Target, \"Choosing the sign-in method,\" \"Soft match and hard match,\" \"UPN suffixes.\"");
}

// ================================================================== 19 Groups and service accounts
{
  const s = D.content(P2, "Groups and service accounts: one recorded decision per object");
  tag(s, "How");
  subhead(s, "Group head", "THE PER-GROUP DECISION", 0.6, 1.5, 5.9);
  const b = table(s, "Groups", 1.85, [3.25, 2.65], ["If the group…", "Decision"], [
    ["Guards only on-prem ACLs", "Keep in AD; don't sync"],
    ["Guards on-prem and cloud", "Synchronize"],
    ["Guards only cloud resources", "Convert to cloud-only"],
    ["Follows attributes exactly", "Convert to dynamic"],
    ["Has no members or assignments", "Retire"],
  ], { fontSize: 12.5 });
  txt(s, "Nesting", bullets([
    "App assignment and group licensing don't cascade to nested groups",
    "Flatten deep AGDLP chains; record the mapping",
  ], 12.5), { x: 0.6, y: b + 0.12, w: 5.9, h: 6.5 - b - 0.12, paraSpaceAfter: 3 });
  subhead(s, "SA head", "SERVICE ACCOUNTS: ELIMINATE STORED SECRETS", 6.8, 1.5, 5.95);
  const b2 = table(s, "Workloads", 1.85, [2.85, 3.1], ["Account and workload", "Entra ID target"], [
    ["Traditional, calls Entra-protected APIs", "App registration; certificate or federated credential"],
    ["Traditional, Azure-hosted", "Managed identity (user-assigned)"],
    ["Traditional or MSA, on-prem Kerberos", "gMSA"],
    ["gMSA moving to the cloud", "Workload identity federation"],
  ], { x: 6.8, fontSize: 12.5 });
  txt(s, "WIF", bullets([
    "Federated credential: issuer, exact subject (no wildcards), audience; at most 20",
    "Two human owners; no client secrets in production",
  ], 12.5), { x: 6.8, y: b2 + 0.12, w: 5.95, h: 6.5 - b2 - 0.12, paraSpaceAfter: 3 });
  sources(s, "Sources: Microsoft Learn — manage groups (nesting); Cloud Sync group provisioning; workload identity federation and its restrictions; managed identities. Book 02, Ch 09.");
  notes(s,
`Groups and service accounts each get one recorded decision per object.

For groups, the AGDLP model doesn't map one to one, because Entra ID has no group scope. So every AD security group gets one of five decisions. Used only for on-premises resource ACLs: keep it in AD and don't sync it, since a cloud copy adds nothing. Used for both on-premises and cloud: synchronize it, with AD as the source of authority during the transition. Used only for cloud resources: convert it to cloud-only. Membership follows attributes exactly: convert it to a dynamic group. No members or no assignments: retire it. Where a cloud-only group still has to guard a Kerberos application, Cloud Sync provisions it back to AD as a universal group.

Nesting works for fewer things in Entra ID. Conditional Access follows nested members, but group-based application assignment and group-based licensing don't cascade to nested groups. So flatten deep AGDLP chains to direct membership or a dynamic rule, and record the mapping for the audit trail.

For service accounts, the rule is to eliminate stored secrets. A traditional account that calls Microsoft 365 or other Entra-protected APIs becomes an application registration with a certificate, or a federated credential where the host has an OIDC issuer. One whose workload runs on an Azure resource becomes a managed identity, user-assigned preferred. On-premises Kerberos workloads, and standalone MSAs, go to a group managed service account. A gMSA whose workload moves to the cloud goes to workload identity federation.

A federated credential has three working parts: the issuer, a subject that must match exactly with no wildcards, and an audience. An application holds at most twenty, and a wrong subject fails only at token exchange, so test each one. Every application gets two human owners, and no client secrets in production.`,
  "Book 02, Chapter 09 — Building the Entra ID Target, \"Migrating groups\" and \"Modernizing service accounts.\"");
}

// ================================================================== 20 Privileged access
{
  const s = D.content(P2, "Privileged access: no standing admin, two break-glass accounts");
  tag(s, "Who");
  table(s, "Roles", 1.5, [2.4, 3.7], ["AD privileged group", "Entra ID target (eligible in PIM)"], [
    ["Domain Admins", "Global Administrator, held by very few (under five)"],
    ["Enterprise Admins", "Privileged Role Administrator"],
    ["Account Operators", "User Administrator scoped to AUs"],
    ["Server Operators", "Intune RBAC, or Azure RBAC"],
    ["Backup Operators", "Service-specific roles"],
    ["Group Policy Creator Owners", "Intune Policy and Profile Manager"],
  ], { fontSize: 12.5 });
  table(s, "PIM", 1.5, [2.85, 1.25, 1.2], ["PIM standard", "Max activation", "Approval"], [
    ["Global Admin, Privileged Role Admin", "4 hours", "Yes"],
    ["Security Administrator", "8 hours", "Yes"],
    ["Other admin roles", "8 hours", "No"],
    ["Security Reader, Global Reader", "12 hours", "No"],
  ], { x: 7.45, fontSize: 12.5, firstColor: HEX.teal });
  txt(s, "PIM notes", bullets([
    "Eligibility expires within 12 months and renews by review",
    "Fresh phishing-resistant sign-in through an authentication context",
  ], 12.5), { x: 7.45, y: 3.7, w: 5.3, h: 0.9, paraSpaceAfter: 3 });
  callout(s, "Break glass", 5.0, 1.5, "FaKey", HEX.red, "Emergency access: ",
    "two cloud-only onmicrosoft.com accounts, permanent active Global Administrator, passkey or CBA credentials stored separately, excluded from every restrictive policy, alerted on every sign-in, tested every 90 days.");
  sources(s, "Sources: Microsoft Learn — privileged roles; PIM role settings; PIM for Groups; emergency access accounts; protected actions. Book 02, Ch 09 (Book 04, App. B is the per-role reference).");
  notes(s,
`Privileged access has one core rule: no standing access to privileged roles. Every privileged assignment is eligible and activated just in time. The only permanent active assignments are the two emergency accounts. The mapping from AD groups is the program's design, not an equivalence.

Domain Admins maps to Global Administrator, held by very few; Microsoft recommends fewer than five, and most Domain Admin duties map to narrower roles. Enterprise Admins maps to Privileged Role Administrator, with its own approval chain. Account Operators becomes User Administrator scoped to administrative units; Conditional Access can't target AU-scoped assignments, so put those administrators in a group for policy targeting. Server Operators moves to Intune or Azure role-based access, Backup Operators to service-specific roles, and Group Policy Creator Owners to the Intune Policy and Profile Manager role.

The PIM standards: Global Administrator and Privileged Role Administrator activate for at most four hours, with approval, justification and a ticket number. Security Administrator gets eight hours with approval. Most other admin roles get eight hours without approval, and the reader roles twelve. Eligibility expires within twelve months and renews through an access review. And because PIM's own MFA setting can be satisfied by an earlier sign-in, the program uses PIM's authentication context option to force fresh, phishing-resistant authentication at activation. Configure named approvers outside the requester's chain, because with none configured, PIM falls back to active admins and can lock the tenant.

Emergency access: two cloud-only accounts in the onmicrosoft domain, permanent active Global Administrator, on a passkey security key or certificate-based authentication, each credential stored separately. Microsoft's mandatory MFA for admin portals applies to them too, so a password in a safe isn't enough. Exclude them from every restrictive policy, alert on every sign-in, and test them at least every ninety days.`,
  "Book 02, Chapter 09 — Building the Entra ID Target, \"Privileged access\" (mapping, PIM standards, emergency access accounts).");
}

// ================================================================== 21 Conditional Access
{
  const s = D.content(P2, "Conditional Access: personas, a baseline, and a staged rollout");
  tag(s, "How");
  table(s, "Personas", 1.5, [1.65, 3.45, 0.95], ["Persona", "Identified by", "Risk"], [
    ["Internals", "Worker type code EMP or CTR (extensionAttribute11)", "Standard"],
    ["Admins", "Account type Privileged, or a PIM-eligible group", "High"],
    ["Externals", "Guest from a partner tenant", "Elevated"],
    ["Guests", "Guest from other tenants or providers", "High"],
    ["Service accounts", "Workload identity assignment", "Variable"],
    ["Break-glass", "Dedicated exclusion group", "Excluded"],
  ], { fontSize: 12 });
  table(s, "Policies", 1.5, [1.15, 4.6], ["Policy", "Baseline control"], [
    ["CA001", "All users: block legacy authentication"],
    ["CA003", "Admins: phishing-resistant strength, 4-hour frequency"],
    ["CA006", "Internals: MFA strength, phishing-resistant as end state"],
    ["CA008", "Internals: block outside trusted countries"],
    ["CA013", "High user risk: require risk remediation"],
    ["CA015", "Workload identities: block outside trusted networks"],
  ], { x: 7.0, fontSize: 12, firstColor: HEX.teal });
  flow(s, "Rollout", 4.95, 1.0, [
    { head: "Report-only", body: "2–4 weeks; fix false positives" },
    { head: "Pilot", body: "2 weeks; IT first" },
    { head: "Phased waves", body: "4–8 weeks, each behind a gate" },
    { head: "Never off → on", body: "for all users; check break-glass first", color: HEX.red, tint: HEX.redTint },
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Conditional Access users and roles; authentication strengths; risk-based policies; workload identities. Book 02, Ch 09; App. C templates; Book 04, Ch 07 library.");
  notes(s,
`Conditional Access replaces the logon restrictions and network controls that Active Directory enforced through Group Policy. The program organizes it around personas: populations with distinct needs and risk.

Internals are employees and contractors, identified by the worker type code. Admins are users eligible for or holding privileged roles, identified by account type or a group of PIM-eligible users; target them by group, because role targeting supports built-in directory roles only, not AU-scoped or custom ones. Externals are guests from partner organizations, Guests are ad hoc external users, Service accounts are single-tenant workload identities, and Break-glass is the dedicated exclusion group.

The baseline set runs from CA001 through CA017. A few anchors. CA001 blocks legacy authentication for all users. CA003 requires the phishing-resistant authentication strength for admins, with a four-hour sign-in frequency. CA006 requires MFA for internals, phishing-resistant as the end state. CA008 blocks internals outside trusted countries. CA013 uses Microsoft's newer require risk remediation control for high user risk; it isn't supported for guests, so CA012 blocks risky guest sign-ins instead. CA015 blocks workload identities outside trusted networks. CA002, the old break-glass grant policy, is retired: a policy can't create an exemption; the exclusion on every other policy is the exemption. Appendix C carries Graph JSON templates, all created in report-only state. Book 04's library is authoritative and adds CA018 through CA038 for the CISA BOD 25-01 baseline.

Authentication strengths name what's accepted: phishing-resistant MFA is Windows Hello for Business, FIDO2 passkeys, or multifactor certificate-based authentication. Authenticator push and phone sign-in aren't phishing-resistant on their own.

Rollout has three stages: report-only for two to four weeks, a two-week pilot, then phased waves over four to eight weeks, each behind a monitoring gate. And never switch an all-users policy straight from off to on. Confirm the break-glass exclusion, and that both emergency accounts still sign in.`,
  "Book 02, Chapter 09 — Building the Entra ID Target, \"The Conditional Access framework\"; Appendix C — Conditional Access policy templates.");
}

// ================================================================== 22 Module 4 divider
{
  const s = divider(P2, "Module 4: Migrating, governing and proving it", "Part 2 — Building the target and migrating  ·  Chapters 10–11",
    ["Lifecycle Workflows, access reviews and phishing-resistant sign-in", "The eleven-phase playbook, monitoring and drift", "A reference deployment, and the evidence it leaves behind"], 13);
  notes(s,
`Module 4: migrating, governing, and proving it. Chapter 10 states the finish line: the migration ends when governance runs on its own. Joiners, movers and leavers flow from the HR record without a ticket, every privileged session starts with a phishing-resistant credential, and drift shows up in a diff instead of an incident.

We'll cover the governance machinery, the authentication roadmap and the eleven-phase playbook from Chapter 10, then Chapter 11's reference deployment, which runs the whole sequence on one representative two-forest estate and shows what the assessor receives at the end.`,
  "Book 02, Chapter 10 — Migrating and Governing; Chapter 11 — Reference Deployment.");
}

// ================================================================== 23 Governance loop
{
  const s = D.content(P2, "Governance runs as a loop: joiner, mover, leaver, review");
  tag(s, "How");
  const cols = [
    ["Pre-hire", "Hire date − 7 days", HEX.slate, HEX.grey, ["Confirm the account exists, disabled", "Request the onboarding package", "Temporary Access Pass to the manager"]],
    ["Joiner", "On the hire date", HEX.navy, HEX.navyTint, ["Enable the account", "Licenses by group", "Welcome email; department package"]],
    ["Mover", "Department, division or role changes", HEX.teal, HEX.tealTint, ["Swap department packages", "Dynamic groups and AU adjust", "Review remaining access"]],
    ["Leaver", "On the leave date", HEX.red, HEX.redTint, ["Disable; revoke sessions", "Remove packages, then licenses", "Groups at T+30; delete at T+90"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 3.07;
    box(s, `JML ${i + 1}`, x, 1.5, 2.93, 2.85, c[3]);
    txt(s, `JML ${i + 1} head`, [
      { text: c[0], options: { bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", breakLine: true } },
      { text: c[1], options: { fontSize: 12, italic: true, color: HEX.slate } },
    ], { x: x + 0.15, y: 1.6, w: 2.65, h: 0.75 });
    txt(s, `JML ${i + 1} list`, bullets(c[4], 12.5), { x: x + 0.15, y: 2.38, w: 2.68, h: 1.9, paraSpaceAfter: 3 });
  });
  table(s, "Reviews", 4.5, [3.6, 1.75, 2.4, 4.4], ["Access review", "Frequency", "Reviewers", "If reviewers don't respond"], [
    ["PIM-eligible role assignments", "Quarterly", "Security team", "Remove access (AC-6(7) evidence)"],
    ["Sensitive security groups; guests", "Quarterly", "Owners; sponsors", "Remove access; disable the guest"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: Microsoft Learn — Lifecycle Workflows execution conditions, templates and built-in tasks; access reviews; ID Governance licensing. Book 02, Ch 10.");
  notes(s,
`Governance in Active Directory was mostly a ticket queue: someone asked for membership, someone added it, and nobody took it away. The target replaces that with a loop. HR-driven provisioning creates and updates the account. Lifecycle Workflows run the joiner, mover and leaver tasks. Access packages grant access with an expiry. And access reviews remove what's no longer justified.

Lifecycle Workflows act on accounts that already exist; they don't create them. The time-based triggers key on the native employee hire date and leave date attributes, with an offset of up to a hundred eighty days. For synced users, those dates must be synced into Entra ID first.

Pre-hire runs seven days before the hire date: confirm the account exists, disabled; request the onboarding access package; and generate a Temporary Access Pass emailed to the manager, so the new hire registers a phishing-resistant credential on day one. Joiner runs on the day: enable the account, assign licenses by group, send the welcome email, request the department package. Mover fires on a change to department, division code or position category: remove the old department's package, request the new one, let dynamic groups and a dynamic administrative unit adjust, and review what's left. Leaver runs on the leave date: disable the account, revoke refresh and session tokens, remove access packages and then licenses after the mailbox is converted, remove group memberships at thirty days and delete at ninety.

Two cautions. The delete task doesn't support users holding Entra roles or role-assignable group membership, so remove privileged access first. And a synced user deleted only in the cloud comes back on the next sync; delete it in AD.

Reviews close the loop. PIM-eligible role assignments are reviewed quarterly by the security team, not by self-review, which leaves role-assignable groups out; that review is the AC-6(7) evidence. Sensitive groups go quarterly to owners, guests quarterly to sponsors.`,
  "Book 02, Chapter 10 — Migrating and Governing, \"Identity governance and lifecycle\"; Appendix C — extension attribute assignments.");
}

// ================================================================== 24 Phishing-resistant authentication
{
  const s = D.content(P2, "Phishing-resistant authentication, then the legacy cutoff");
  tag(s, "How");
  table(s, "Roadmap", 1.5, [0.75, 2.4, 3.0, 1.35], ["Phase", "Population", "Method", "Estimate"], [
    ["1", "Privileged accounts", "FIDO2 passkeys; PIV or CAC via CBA", "4–6 weeks"],
    ["2", "PIV and CAC holders", "Entra certificate-based authentication", "8–12 weeks"],
    ["3", "Managed Windows devices", "Windows Hello for Business", "8–12 weeks"],
    ["4", "Everyone else, mobile too", "Passkeys in Microsoft Authenticator", "8–12 weeks"],
  ], { fontSize: 12.5 });
  panel(s, "Methods", 8.3, 1.5, 4.45, 3.3, HEX.teal, HEX.tealTint, "AUTHENTICATION METHODS POLICY", null, [
    "SMS and voice off for staff (M-22-09)",
    "TAP: program sets one-time use, 1-hour life",
    "Passkey registration needs MFA in the last 5 minutes",
    "Registration campaign on; three snoozes",
  ], 12.5);
  flow(s, "Legacy", 4.95, 1.0, [
    { head: "Discover", body: "Sign-in logs and the legacy auth workbook" },
    { head: "Remediate", body: "OAuth 2.0, Graph mail APIs, or a relay" },
    { head: "Block", body: "Enforce CA001" },
    { head: "Monitor", body: "30 days; zero successful legacy sign-ins" },
  ], 12.5);
  sources(s, "Sources: OMB M-22-09; FedRAMP Rev. 5 IA-2 controls; Microsoft Learn — authentication strengths, passkeys, TAP, Exchange Basic auth deprecation. Book 02, Ch 10.");
  notes(s,
`Authentication modernization starts from the federal requirement. OMB M-22-09 requires phishing-resistant MFA for staff, contractors and partners, and requires agencies to stop supporting methods that fail to resist phishing, such as SMS and voice codes, for routine access. It names PIV as the simplest route. Its targets were set for the end of fiscal year 2024, so as of October 2026 these are requirements to meet, not goals.

That reorders the roadmap. Older plans put smart-card sign-in last. But a federal workforce already carries PIV or CAC cards, so Entra certificate-based authentication is the fastest path: the credential is issued, and it works directly against Entra ID without a federation server.

Phase one, privileged accounts: FIDO2 passkeys with attestation enforced, plus PIV or CAC through certificate-based authentication where the admin holds a card, in four to six weeks. Phase two, every PIV and CAC holder through certificate-based authentication. Phase three, managed Windows devices on Windows Hello for Business. Phase four, everyone else, including mobile, on passkeys in Microsoft Authenticator. Those last three are eight to twelve weeks each, and all four methods meet the built-in phishing-resistant strength. For NIST control IA-2(6), separate device, the program counts PIV cards and FIDO2 keys; Windows Hello lives in the device gaining access, so it isn't counted for privileged accounts.

The authentication methods policy: SMS and voice off for staff. Temporary Access Pass is one-time use with a one-hour life, against Microsoft's multi-use default. Passkey registration needs MFA in the last five minutes.

Then the legacy cutoff. Discover remaining legacy sign-ins in the logs. Remediate onto OAuth, the Graph mail APIs, or a supported relay. Block with CA001. And monitor for thirty days until there are zero successful legacy sign-ins.`,
  "Book 02, Chapter 10 — Migrating and Governing, \"Authentication modernization\" and \"The compliance amendment.\"");
}

// ================================================================== 25 Playbook
{
  const s = D.content(P2, "The eleven-phase playbook: each phase gated on validation");
  tag(s, "How");
  const rows = [
    ["0", "Assessment", "Inventory in Git; a decision for every group", "2–4"],
    ["1", "Sync deployment", "Object counts within ±1%; no sync errors", "2–3"],
    ["2", "Sign-in + CA report-only", "PHS verified; emergency sign-in tested", "3–4"],
    ["3", "Groups and dynamic groups", "Dynamic membership within ±2%", "4–6"],
    ["4", "Service accounts", "Every high-risk account converted or retired", "6–8"],
    ["5", "PIM rollout", "No permanent active roles but break-glass", "2–3"],
    ["6", "CA enforcement", "MFA registration above 95% first", "4–6"],
    ["7", "Phishing-resistant auth", "100% of privileged on FIDO2 or CBA", "8–16"],
    ["8", "Legacy auth cutoff", "30 days of zero legacy sign-ins", "2–4"],
    ["9", "Federation decommission", "Every domain managed; AD FS gone", "4–8"],
    ["10", "Steady-state governance", "Workflows, reviews and drift alerts running", "ongoing"],
  ];
  const half = (r) => r.map((c) => c);
  table(s, "Phases A", 1.5, [0.55, 2.4, 2.25, 0.75], ["#", "Phase", "Validation gate", "Weeks"], rows.slice(0, 6).map(half), { fontSize: 12, firstColor: HEX.teal });
  table(s, "Phases B", 1.5, [0.55, 2.4, 2.25, 0.75], ["#", "Phase", "Validation gate", "Weeks"], rows.slice(6).map(half), { x: 6.8, fontSize: 12, firstColor: HEX.teal });
  callout(s, "Gate", 5.35, 1.1, "FaClipboardCheck", HEX.amber, "Program estimates, not measurements: ",
    "40 to 70 weeks in total. Every phase has prerequisites, steps, validation and a rollback; the next starts only when the last one's validation criteria are met.");
  sources(s, "Sources: Microsoft Learn — staged rollout; migrate from federation to cloud authentication; Cloud Sync on-demand provisioning. Book 02, Ch 10, \"The migration execution playbook.\"");
  notes(s,
`The migration runs in eleven phases, zero through ten. Each has prerequisites, steps, validation criteria, a rollback procedure and a duration estimate, and a phase starts only when the previous one's validation criteria are met. The durations are planning estimates, not measured results; the total runs forty to seventy weeks.

Phase zero is assessment: the forest and identity inventories in Git, a UPN remediation plan, a recorded decision for every group, and every service account classified. Phase one deploys sync: at least two Cloud Sync agents, or Connect where required, password hash sync on, validated by object counts within one percent and no sync errors. Rollback removes objects from scope, recoverable for thirty days. Phase two sets the sign-in method and puts every Conditional Access policy in report-only, with the emergency account sign-in tested and logged.

Phase three migrates groups, with dynamic membership validated within two percent. Phase four modernizes service accounts, high-risk first, running old and new credentials in parallel for thirty days. Phase five rolls out PIM: zero permanent active assignments except the emergency accounts. Phase six enforces Conditional Access in waves, but only after MFA registration passes ninety-five percent in each targeted population. Phase seven is the phishing-resistant roadmap, validated by every privileged account on FIDO2 or certificate-based authentication, over eighty percent of managed-device users on Windows Hello, and over seventy percent of all users on a phishing-resistant method.

Phase eight cuts off legacy authentication after thirty consecutive days with zero legacy sign-ins. Phase nine decommissions federation, where it exists: staged rollout moves users to password hash sync in waves, then each domain is converted to managed with Graph PowerShell, never the retired MSOnline cmdlet, and AD FS stays recoverable for ninety days. Phase ten is steady-state governance: workflows, access packages, reviews and drift detection running, and the operations runbook committed to Git.`,
  "Book 02, Chapter 10 — Migrating and Governing, \"The migration execution playbook.\"");
}

// ================================================================== 26 Proving it
{
  const s = D.content(P2, "Proving it: logs, FedRAMP 20x indicators and drift");
  tag(s, "How");
  table(s, "Logs", 1.5, [2.15, 2.4, 1.3], ["Log", "Kept in Entra ID", "Program"], [
    ["Sign-in, audit", "7 days Free; 30 days P1/P2", "365 days"],
    ["Risky sign-ins", "Up to 90 days with P2", "365 days"],
    ["Provisioning", "Per Microsoft's reference", "180 days"],
    ["Graph activity", "Not retained; export only", "180 days"],
  ], { fontSize: 12 });
  table(s, "KSI", 1.5, [1.25, 2.6, 2.3], ["Controls", "FedRAMP 20x indicator", "Evidenced by"], [
    ["AC-2", "KSI-IAM-AAM", "Workflows; reviews"],
    ["AC-6", "KSI-IAM-ELP, KSI-IAM-JIT", "Groups and PIM"],
    ["IA-2, IA-5", "KSI-IAM-APM", "Strengths; the roadmap"],
    ["IA-5 non-user", "KSI-IAM-SNU", "Service account work"],
    ["AU-2", "KSI-MLA-LET, KSI-MLA-RVL", "Log Analytics; detections"],
  ], { x: 6.6, fontSize: 12, firstColor: HEX.teal });
  txt(s, "Detections", [
    { text: "Scheduled detections: ", options: { bold: true, color: HEX.navy } },
    { text: "no sign-in for 90 days · PIM activation 22:00–06:00 local · sign-ins with no Conditional Access applied · app credentials expiring within 30 days · any emergency-account sign-in (critical) · over 50 membership changes to one group in an hour." },
  ], { x: 0.6, y: 3.95, w: 12.15, h: 0.85, fontSize: 13 });
  callout(s, "Drift", 4.95, 1.5, "FaCodeBranch", HEX.navy, "Drift in Git: ",
    "a weekly scan on Sunday at 02:00 compares users with the committed identity baseline and opens an issue with the diff. Close each finding at the source, never by editing the copy. Attribute, membership and policy diffs are planned, not built.");
  sources(s, "Sources: Microsoft Learn — Entra data retention; Azure Monitor integration; audit activities. FedRAMP 20x KSI pages (Consolidated Rules for 2026). Book 02, Ch 10; App. C.");
  notes(s,
`Proving it starts with logs, because Entra ID keeps them only briefly. Sign-in and audit logs are kept seven days on the free tier and thirty on P1 or P2. Risky sign-ins reach ninety days only with P2. Microsoft Graph activity logs aren't retained at all; they're export only. And upgrading a license doesn't recover older data. So stream every category to a Log Analytics workspace and keep sign-in and audit logs three hundred sixty-five days.

On top of that, scheduled detections: stale accounts over ninety days; PIM activation between ten at night and six in the morning, after converting from UTC; interactive sign-ins with no Conditional Access applied; application credentials expiring within thirty days; any emergency account sign-in, which is critical; and more than fifty membership changes to one group in an hour.

For compliance, Compliance Manager has templates for NIST 800-53 Revision 5 and FedRAMP Moderate, but they don't produce indicator evidence, so treat them as a readiness check. Under FedRAMP 20x's Consolidated Rules for 2026, the controls map to Key Security Indicators. Account management maps to automating account management, evidenced by the workflows and reviews. Least privilege maps to ensuring least privilege and authorizing just-in-time, evidenced by groups and PIM. Authentication maps to adopting passwordless methods. Non-user authentication maps to securing non-user authentication, the service account work. And event logging maps to logging event types and reviewing logs.

Drift lives in Git. The identity assessment commits its JSON to an identity baseline branch, a weekly scan on Sunday at two in the morning compares against it, and drift opens an issue with the diff. The rule: close each finding at the source, never by editing the copy. Be clear about maturity: the comparison covers user additions and removals today; attribute, membership and policy diffs are planned.`,
  "Book 02, Chapter 10 — Migrating and Governing, \"Monitoring, audit, and compliance\" and \"Git-based drift detection\"; Appendix C — the orchestrator.");
}

// ================================================================== 27 Reference deployment
{
  const s = D.content(P2, "Reference deployment: one estate, five gated phases");
  tag(s, "Who");
  box(s, "Archetype", 0.6, 1.5, 12.15, 0.75, HEX.grey);
  txt(s, "Archetype text", [
    { text: "The archetype (illustrative):  ", options: { bold: true, color: HEX.navy } },
    { text: "about 50,000 users in two forests joined by an unowned trust; ~70,000 computers, 12,000 groups, thousands of service accounts; ~90 SQL Server instances; destination Microsoft 365 GCC." },
  ], { x: 0.8, y: 1.5, w: 11.8, h: 0.75, fontSize: 13.5, valign: "middle" });
  table(s, "Phases", 2.4, [1.6, 6.15, 4.4], ["Phase", "What happens", "Illustrative result"], [
    ["Discover", "Read-only survey of both forests; service-account scan; phase-tagged SPN inventory", "~400 accounts with SPNs: ~60 critical, ~100 high"],
    ["Normalize", "Organizational registry checked against the chart of record; a finding per unattributed principal", "~2,000 users, several hundred service accounts"],
    ["Map", "An adapter contract per surface; four carry the risk: sync, PKI, RADIUS, SQL Server", "Cross-forest manager chains decide the sync engine"],
    ["Migrate", "Provenance-chained events: requester, authority, document version, state hash", "~300 drift findings; one P1 halts a SQL migration"],
    ["Validate", "Pre- and post-migration SPN inventories compared", "~3 P1 SPN findings, re-registered and recaptured"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: OMB M-22-09; OMB M-26-14; CISA BOD 25-01; Microsoft Learn — SQL Server SPNs, Entra auth for SQL Server, Cloud Sync decision guide, Intune SCEP, Cloud PKI. Book 02, Ch 11.");
  notes(s,
`Chapter 11 puts it together on one representative estate. It's a framing pattern, not a report on a real engagement: the agency is a composite and the counts are illustrative orders of magnitude.

The archetype has about fifty thousand users in two forests, one inherited from an absorbed component, joined by a forest trust nobody documented or owns. About seventy thousand computer accounts, twelve thousand groups, several thousand service accounts, and about ninety SQL Server instances. The destination is Microsoft 365 GCC. Each phase ends with a signed readiness bundle, and the next phase starts only from that bundle.

Discover: the read-only survey of both forests, plus the service account scan. About four hundred accounts carry SPNs; about sixty rate critical and a hundred high. Every SQL Server SPN is captured with a pre-migration tag, because a missing or wrong SPN silently falls back to NTLM. About ten instances raise findings because their service accounts can't be attributed.

Normalize: both forests have an Operations OU holding different people. The agency builds an organizational registry and resolves the collision there, not by renaming groups. About two thousand users and several hundred service accounts get findings, resolved by the governance team, never auto-assigned.

Map: an adapter contract for each surface. Four carry the risk. Sync, where cross-forest manager chains decide the engine, since Cloud Sync doesn't support cross-forest references. PKI and RADIUS, which move in lockstep because 802.1X EAP-TLS depends on the same CA. And SQL Server, whose Entra authentication needs SQL Server 2022 or later and isn't supported on failover cluster instances.

Migrate: every operation is a provenance-chained record. About three hundred drift findings appear; one P1 stops a SQL Server migration until a role assignment is reduced. Validate compares the SPN inventories; about three P1 findings are re-registered.`,
  "Book 02, Chapter 11 — Reference Deployment, \"The archetype\" and Phases 1–5.");
}

// ================================================================== 28 Evidence and close
{
  const s = D.content(P2, "What the assessor receives, and what the agency keeps");
  tag(s, "Who");
  table(s, "Drift classes", 1.5, [2.45, 4.0, 1.4], ["Drift class", "Example", "Engine today"], [
    ["DRIFT-SCHEMA", "Attribute encoding doesn't match the schema version", "Shipped"],
    ["DRIFT-PROVENANCE", "A state change with no provenance event", "Shipped"],
    ["DRIFT-SEMANTIC", "A value slips back to a deprecated OU naming pattern", "Partial"],
    ["DRIFT-AUTHZ", "A policy contradicts the principal's assurance level", "Design only"],
    ["DRIFT-IDENTITY", "A tenant principal with no registry counterpart", "Design only"],
  ], { fontSize: 12 });
  panel(s, "Bundle", 8.7, 1.5, 4.05, 3.9, HEX.amber, HEX.amberTint, "THE EVIDENCE BUNDLE", "To the AO and assessor", [
    "Each phase's signed readiness bundle",
    "Both SPN inventories and their comparison",
    "The provenance chain; every drift finding",
    "GCC boundary compensating controls",
  ], 12.5);
  callout(s, "Keeps", 5.55, 0.95, "FaFileShield", HEX.navy, "The agency keeps it: ",
    "registry, schemas, findings and evidence stay when the integrator leaves. The authorizing official authorizes under NIST RMF; a 3PAO assesses providers, not this system.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2; NIST SP 800-63-4; FedRAMP 20x. Book 02, Ch 11, \"Phase 4,\" \"The evidence bundle,\" \"What survives the engagement.\"");
  notes(s,
`Last, what all this produces. During migration the program classifies drift into five classes. Schema drift: an attribute encoding that doesn't match the current schema version. Provenance drift: a state change with no provenance event in the chain, which halts the run. Semantic drift: a value slipping back into a deprecated naming pattern. Authorization drift: a Conditional Access policy that contradicts the assurance level recorded for the principal,. And identity drift: a principal in the tenant with no counterpart in the registry. Be honest about maturity. Schema and provenance detection are shipped, semantic is partial, and authorization and identity detection are design-only; today, people reviewing the assessment modules find those.

From Phase 2 on, the agency can produce an evidence bundle at any time: each phase's signed readiness bundle, both phase-tagged SPN inventories and their comparison, the provenance chain for every adapter operation, every drift finding with its remediation, and the GCC boundary finding with its compensating controls and when each was last verified.

Who reads it matters. FedRAMP authorizes cloud service offerings, and third-party assessment organizations assess providers. The agency's own system is authorized by its authorizing official under the Risk Management Framework, SP 800-37, which supports ongoing authorization. So the bundle goes to the security control assessor and the authorizing official, as it happens, not assembled over most of a year afterward.

And it belongs to the agency. When the integrator leaves, the registry, schemas, findings and evidence stay for the next authorization cycle.

So, from Monday: start read-only discovery with a pre-flight; turn the gaps into a narrow, time-bound request; make every run evidence; and gate every phase on its validation. Chapters 07 through 11 and the appendices carry the full detail and the code. Book 03, HR-Driven Identity, picks up where the attributes should come from. Thank you.`,
  "Book 02, Chapter 11 — Reference Deployment; Chapters 07–10; Book 03.");
}

// ================================================================== Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind Part 1 — Assessing the forest");
  const src = [
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles, Jan. 26, 2022.  ·  NIST SP 800-207, Zero Trust Architecture, Aug. 2020.  ·  CISA Zero Trust Maturity Model v2.0, Apr. 2023.",
    "NIST SP 800-53 Rev. 5 (Release 5.2.0), Access Control family (AC-6).",
    "Microsoft Learn: Troubleshoot password writeback access rights and permissions; Active Directory security groups (Pre–Windows 2000 Compatible Access).",
    "Microsoft Learn: Appendix C, Protected Accounts and Groups in Active Directory; Reducing the Active Directory Attack Surface (AdminSDHolder, SDProp).",
    "Microsoft Learn: Mark an attribute as confidential (KB 922836); Search-Flags attribute; What is Windows LAPS?; Windows LAPS schema extensions.",
    "Microsoft Learn: DS-Replication-Get-Changes-All; Deleted Objects container (KB 892806); Restoring Deleted Objects; fine-grained password policies; Defender for Identity alerts.",
    "Microsoft Learn: RSAT Features on Demand; FSMO roles; forest and domain functional levels; Get-GPInheritance; Group Policy analytics; DnsAdmins assessment; netdom trust.",
    "SpecterOps, Certify and the 2021 AD CS research (ESC1–ESC8); Defender for Identity certificate assessments; certenroll.h flags; RFC 4556; RFC 5280.",
    "Microsoft Learn: Kerberos constrained delegation; lastLogonTimestamp; gMSA and dMSA overviews; 5,000-value LDAP limit; AD DS maximum limits. [MS-ADTS] trustAttributes.",
    "Gitea API specification (OpenAPI 2.0) and API usage.  ·  Full footnotes with links and access dates: Book 02, Chapters 01–08 and Appendix B.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}
{
  const s = D.content("Backup", "Sources behind Part 2 — Building the target and migrating");
  const src = [
    "Microsoft Learn: Cloud Sync migration decision guide; Group Writeback v2 discontinuation; Configure Connect for an existing tenant (hard-match protections, July 1, 2026).",
    "Microsoft Learn: Choose the right authentication method; pass-through authentication agents; sign-in options and alternate login ID.",
    "Microsoft Learn: Entra licensing; ID Governance licensing fundamentals; dynamic membership rules; memberOf operator (preview, ends Nov. 3, 2026).",
    "Microsoft Learn: Manage groups (nesting); workload identity federation and its restrictions; Conditional Access for workload identities; managed identities.",
    "Microsoft Learn: Privileged roles; PIM role settings; PIM for Groups; emergency access accounts; protected actions; authentication strengths; risk-based policies.",
    "Microsoft Learn: Lifecycle Workflows execution conditions, templates and tasks; Temporary Access Pass; passkeys; Entra data retention; Azure Monitor integration.",
    "Microsoft Learn: Staged rollout; migrate from federation to cloud authentication; Exchange Online Basic authentication deprecation.",
    "FedRAMP: Rev. 5 controls (IA-2, AC-6(7)); FedRAMP 20x Key Security Indicators (Consolidated Rules for 2026).  ·  OMB M-26-14; CISA BOD 25-01.",
    "Microsoft Learn: SQL Server SPN registration; Entra authentication for SQL Server (with and without Arc); Intune SCEP; Cloud PKI.  ·  NIST SP 800-37 Rev. 2; NIST SP 800-63-4.",
    "Full footnotes with links and access dates: Book 02, Chapters 09–11 and Appendix C (whalermike.github.io/modernization-workbook/docs/books/b02-identity/).",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
