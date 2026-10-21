// Book 06 — Data Platform: SQL Server Identity. The 50-minute technical deep dive:
// Part 1 "Strategy" (Modules 1–3) and Part 2 "The runbooks for DBAs" (Modules 4–5, Runbooks R01–R10).
// Build:  node presentations/b06-data-platform-technical/build.js presentations/b06-data-platform-technical/B06_Data_Platform_Technical.pptx
// Every fact comes from a footnoted chapter or runbook of docs/books/b06-data-platform/, named in the notes.
const D = require("../_build/lib.js")({
  book: "Book 06",
  title: "Data Platform: SQL Server Identity, Technical Deep Dive",
  footer: "Federal Modernization Workbook  ·  Book 06 Data Platform: SQL Server Identity  ·  Technical deep dive",
});
const { pres, HEX, txt, box, icon, bullets, tableOpts, head, sources } = D;
const callout = (s, name, y, h, ic, color, label, text) => { fit(`slide ${pres.slides.length} callout ${name}`, [{ text: label }, { text }], 10.65, h - 0.1, 16.5); return D.callout(s, name, y, h, ic, color, label, text); };
const OUT = process.argv[2] || "B06_Data_Platform_Technical.pptx";

// ------------------------------------------------------------------ modules and helpers
const MODS = [
  { n: 1, part: 1, name: "The inheritance and the estate", short: "Inheritance & estate", c: HEX.red, t: HEX.redTint },
  { n: 2, part: 1, name: "The audit, the principals and the decision", short: "Audit & principals", c: HEX.navy, t: HEX.navyTint },
  { n: 3, part: 1, name: "NTLM, applications and closure", short: "NTLM, apps & closure", c: HEX.teal, t: HEX.tealTint },
  { n: 4, part: 2, name: "Runbooks R01–R05: inventory to Entra logins", short: "Runbooks R01–R05", c: HEX.amber, t: HEX.amberTint },
  { n: 5, part: 2, name: "Runbooks R06–R10: NTLM to certificates", short: "Runbooks R06–R10", c: HEX.ink, t: HEX.grey },
];
const PARTNAME = { 1: "Part 1 — Strategy", 2: "Part 2 — The runbooks for DBAs" };
const secName = (m) => `Module ${m.n} — ${m.short}`;

// Rough text-fit estimator (Calibri average glyph ≈ 0.49 em; line ≈ 1.2 em). Warns, never fails.
const WARN = [];
const runsOf = (t) => (typeof t === "string" ? [{ text: t, options: {} }] : t);
function estH(t, w, size, paraAfter = 0) {
  const paras = [];
  let cur = { chars: 0, size };
  runsOf(t).forEach((r) => {
    const o = r.options || {};
    const sz = o.fontSize || size;
    cur.size = Math.max(cur.size, sz);
    cur.chars += (r.text || "").length * (sz / size);
    if (o.breakLine) { paras.push(cur); cur = { chars: 0, size }; }
  });
  paras.push(cur);
  let h = 0;
  paras.forEach((p) => {
    const cpl = (w - 0.3) / (0.49 * p.size / 72);
    h += Math.max(1, Math.ceil(p.chars / cpl)) * (1.2 * p.size / 72) + paraAfter / 72;
  });
  return h;
}
function fit(name, t, w, h, size, paraAfter) {
  const need = estH(t, w, size, paraAfter);
  if (need > h * 1.02) WARN.push(`${name}: needs ~${need.toFixed(2)} in, has ${h.toFixed(2)} in`);
}
function T(s, name, t, o) { // text box with a fit check
  fit(`slide ${pres.slides.length} ${name}`, t, o.w, o.h, o.fontSize || 14, o.paraSpaceAfter || 0);
  return txt(s, name, t, o);
}
const B = (items, size) => bullets(items, size);
const rich = (label, color, body) => [{ text: label, options: { bold: true, color } }, { text: body }];

// Narration: a timing cue at 142 words per minute, then the notes.
const WPM = 142;
let clock = 0, words = 0;
const per = [];
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
function notes(s, body) {
  const spokenPart = body.split("\n\nWorkbook:")[0];
  const n = spokenPart.split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (n / WPM) * 60;
  words += n;
  per.push(n);
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body}`);
}

function modTag(s, m) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: `Tag module ${m.n}`, x: 0.6, y: 0.12, w: 1.25, h: 0.32, rectRadius: 0.06, fill: { color: m.c }, line: { color: m.c } });
  txt(s, `Tag module ${m.n} text`, `MODULE ${m.n}`, { x: 0.6, y: 0.12, w: 1.25, h: 0.32, fontSize: 11, bold: true, color: "FFFFFF", align: "center", valign: "middle", charSpacing: 1 });
  txt(s, "Part label", PARTNAME[m.part], { x: 1.95, y: 0.12, w: 4, h: 0.32, fontSize: 11, color: HEX.slate, valign: "middle" });
}
function badge(s, label, color) { // top-right safety marker on the runbook slides
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: "Safety badge", x: 9.75, y: 0.12, w: 3.0, h: 0.32, rectRadius: 0.06, fill: { color }, line: { color } });
  txt(s, "Safety badge text", label.toUpperCase(), { x: 9.75, y: 0.12, w: 3.0, h: 0.32, fontSize: 11, bold: true, color: "FFFFFF", align: "center", valign: "middle", charSpacing: 1 });
}
function flow(s, name, steps, y, h, colors, opts = {}) { // left-to-right boxes with arrows
  const n = steps.length, gap = 0.28, w = (12.15 - gap * (n - 1)) / n;
  const hs = opts.headSize || 14.5, bs = opts.bodySize || 12;
  steps.forEach((st, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${name} ${i + 1}`, x, y, w, h, colors[i % colors.length][1]);
    T(s, `${name} ${i + 1} text`, [{ text: st[0], options: { bold: true, color: colors[i % colors.length][0], fontSize: hs, breakLine: true } }, { text: st[1], options: { fontSize: bs } }],
      { x: x + 0.12, y: y + 0.07, w: w - 0.24, h: h - 0.14, fontSize: bs, valign: "middle" });
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.05, y: y + h / 2 - 0.1, w: 0.18, h: 0.2, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
}
function card(s, name, x, y, w, h, color, tint, heading, items, size = 12.5, iconName) {
  box(s, name, x, y, w, h, tint);
  let tx = x + 0.2;
  if (iconName) { icon(s, iconName, x + 0.18, y + 0.15, 0.5, color); tx = x + 0.82; }
  T(s, `${name} head`, heading, { x: tx, y: y + 0.12, w: x + w - tx - 0.15, h: 0.55, bold: true, color, fontSize: 15.5, fontFace: "Cambria", valign: "middle" });
  T(s, `${name} text`, B(items, size), { x: x + 0.2, y: y + 0.72, w: w - 0.4, h: h - 0.82, fontSize: size, paraSpaceAfter: 4 });
}
function table(s, name, rows, colW, o) {
  // fit estimate per row (tallest cell), against the given or default row height
  const sz = o.fontSize || 13;
  let need = 0;
  rows.forEach((r) => {
    let rh = 0;
    let ci = 0;
    r.forEach((c) => {
      const span = (c.options && c.options.colspan) || 1;
      const w = colW.slice(ci, ci + span).reduce((a, b) => a + b, 0);
      ci += span;
      rh = Math.max(rh, estH(c.text, w, (c.options && c.options.fontSize) || sz) + 0.12);
    });
    need += rh;
  });
  if (o.maxH && need > o.maxH * 1.02) WARN.push(`slide ${pres.slides.length} ${name}: table needs ~${need.toFixed(2)} in, has ${o.maxH}`);
  const opts = Object.assign({}, o); delete opts.maxH;
  s.addTable(rows, Object.assign(tableOpts(colW, opts), { objectName: name }));
}
const cells = (r, firstBold, color) => r.map((t, k) => (typeof t === "object" ? t : { text: t, options: k === 0 && firstBold ? { bold: true, color } : {} }));

// Section-divider slide for a module.
function divider(m, items, src, body) {
  const s = D.content(secName(m), `Module ${m.n} — ${m.name}`);
  modTag(s, m);
  txt(s, "Module numeral", String(m.n), { x: 0.6, y: 1.55, w: 1.7, h: 2.2, fontSize: 120, bold: true, fontFace: "Cambria", color: m.c, align: "center", valign: "middle" });
  txt(s, "In this module head", "IN THIS MODULE", { x: 2.6, y: 1.65, w: 9, h: 0.35, fontSize: 13, bold: true, color: HEX.slate, charSpacing: 1 });
  T(s, "In this module", B(items, 19), { x: 2.6, y: 2.05, w: 10.1, h: 2.65, fontSize: 19, color: HEX.navy, paraSpaceAfter: 6 });
  // module map
  txt(s, "Map part 1", PARTNAME[1], { x: 0.6, y: 4.85, w: 7.25, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  txt(s, "Map part 2", PARTNAME[2], { x: 7.95, y: 4.85, w: 4.8, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  MODS.forEach((mm, i) => {
    const w = 2.35, x = 0.6 + i * (w + 0.1), cur = mm.n === m.n;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { objectName: `Map ${mm.n}`, x, y: 5.2, w, h: 1.05, rectRadius: 0.08, fill: { color: cur ? mm.c : "FFFFFF" }, line: { color: cur ? mm.c : HEX.line, width: 1 } });
    txt(s, `Map ${mm.n} text`, [{ text: `Module ${mm.n}`, options: { bold: true, breakLine: true, fontSize: 13 } }, { text: mm.short, options: { fontSize: 12.5 } }],
      { x: x + 0.12, y: 5.25, w: w - 0.24, h: 0.95, color: cur ? "FFFFFF" : HEX.slate, align: "center", valign: "middle" });
  });
  sources(s, src);
  notes(s, body);
  return s;
}

// Runbook slide: lead line, numbered steps on the left, stacked boxes (gate, evidence…) on the right.
function runbook(m, { title, badgeText, badgeColor, lead, steps, boxes, src, body, stepSize = 12.5 }) {
  const s = D.content(secName(m), title);
  modTag(s, m);
  badge(s, badgeText, badgeColor);
  T(s, "Lead", lead, { x: 0.6, y: 1.42, w: 12.15, h: 0.36, fontSize: 14.5, italic: true, color: HEX.ink, align: "center" });
  const stepRuns = [];
  steps.forEach((st, i) => {
    stepRuns.push({ text: `${i + 1}  ${st[0]}  `, options: { bold: true, color: m.c === HEX.ink ? HEX.navy : m.c } });
    stepRuns.push({ text: st[1], options: { breakLine: i < steps.length - 1 } });
  });
  T(s, "Steps", stepRuns, { x: 0.6, y: 1.92, w: 7.45, h: 4.6, fontSize: stepSize, paraSpaceAfter: 7 });
  // right column: heights in proportion to estimated need
  const X = 8.25, W = 4.5, top = 1.92, avail = 4.6, gap = 0.12;
  const need = boxes.map((b) => 0.42 + estH(B(b.items, b.size || 12), W - 0.3, b.size || 12, 3) + 0.12);
  const total = need.reduce((a, b) => a + b, 0) + gap * (boxes.length - 1);
  if (total > avail * 1.02) WARN.push(`slide ${pres.slides.length} right column needs ~${total.toFixed(2)} in, has ${avail}`);
  const scale = (avail - gap * (boxes.length - 1)) / (total - gap * (boxes.length - 1));
  let y = top;
  boxes.forEach((b, i) => {
    const h = need[i] * scale;
    box(s, `Box ${b.head}`, X, y, W, h, b.tint || "FFFFFF", b.color);
    txt(s, `Box ${b.head} head`, b.head, { x: X + 0.15, y: y + 0.08, w: W - 0.3, h: 0.3, fontSize: 12, bold: true, color: b.color, charSpacing: 1 });
    txt(s, `Box ${b.head} text`, B(b.items, b.size || 12), { x: X + 0.15, y: y + 0.4, w: W - 0.3, h: h - 0.46, fontSize: b.size || 12, paraSpaceAfter: 3 });
    y += h + gap;
  });
  sources(s, src);
  notes(s, body);
  return s;
}
const GATE = { color: HEX.amber, tint: HEX.amberTint };
const EVID = { color: HEX.teal, tint: HEX.tealTint };
const NOTE = { color: HEX.navy, tint: HEX.navyTint };
const RISK = { color: HEX.red, tint: HEX.redTint };
const RO = HEX.teal, RR = HEX.amber, SETUP = HEX.slate;

// ================================================================== Title
{
  const s = D.titleSlide("Introduction", "SQL Server Identity: Strategy and the DBA Runbooks", "Book 06 — Data Platform: SQL Server Identity");
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook  ·  Technical deep dive, about 50 minutes", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Part 1  Strategy: Modules 1–3", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2  The runbooks for DBAs: Modules 4–5, Runbooks R01–R10", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.85, w: 7.6, h: 1.2, fontSize: 16 });
  notes(s,
`This is the technical deep dive for Book 06 of the Federal Modernization Workbook: Data Platform, SQL Server Identity. The book moves the SQL Server estate off Windows Authentication and onto Microsoft Entra ID, and this session is for the people who do that work: database administrators, the identity and server teams beside them, and the security staff who sign off.

It runs about fifty minutes, in two parts. Part 1 is the strategy, in three modules: why the inheritance must end and how the estate is rationalized; the authentication audit, the three principal types and the engine-authentication decision; and NTLM elimination, applications and the closure condition. Part 2 walks the ten runbooks in the order a DBA runs them. For each one: what it does, the gate it must pass, and the evidence it leaves.

One convention throughout. April 1, 2027 is the program's own NTLM backstop, not a Microsoft deadline, and I'll say which dates are external.

Workbook: Book 06, index; Chapter 02; Runbook R01.`);
}

// ================================================================== MODULE 1
divider(MODS[0], [
  "How Windows Authentication in SQL Server actually works, and where NTLM hides",
  "The three drivers that end it, and the 2027 dates that are real",
  "Inventory, three rationalization lenses, and the retain / consolidate / retire gate",
], "Sources: Book 06, Chapters 01–06.",
`Module 1: the inheritance and the estate. Three slides. First, what Windows Authentication in SQL Server actually is, precisely enough to see where NTLM hides. Second, the three drivers that end it, and the 2027 dates that are real. Third, the inventory, the rationalization lenses and the retain, consolidate or retire gate, which decides which instances enter the migration at all. The book's whole order, assess and consolidate, enable Arc, migrate logins, then eliminate NTLM, comes out of this module.

Workbook: Book 06, Chapters 01 to 06.`);

// ------------------------------------------------------------------ 1.1 Windows Authentication
{
  const m = MODS[0];
  const s = D.content(secName(m), "Windows Authentication, precisely");
  modTag(s, m);
  flow(s, "Kerberos path", [
    ["Driver", "Integrated Security hands off to SSPI"],
    ["Negotiate", "Picks Kerberos unless a system can't use it"],
    ["KDC ticket", "For the SPN MSSQLSvc/<FQDN>:<port>"],
    ["Engine", "Validates with the service account's key"],
  ], 1.5, 0.95, [[HEX.navy, HEX.navyTint]], { headSize: 14, bodySize: 12 });
  txt(s, "Defaults head", "MICROSOFT'S AUTHENTICATION DEFAULTS", { x: 0.6, y: 2.6, w: 7, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  table(s, "Defaults table", [
    head(["Where the SPN points", "Remote connection", "Local connection"]),
    cells(["The correct account", { text: "Kerberos", options: { bold: true, color: HEX.teal } }, { text: "NTLM", options: { bold: true, color: HEX.red } }], true, HEX.navy),
    cells(["Nowhere: missing, or lookup fails", { text: "NTLM", options: { bold: true, color: HEX.red } }, { text: "NTLM", options: { bold: true, color: HEX.red } }], true, HEX.navy),
    cells(["The wrong account", { text: "Authentication fails", options: { bold: true, color: HEX.amber, colspan: 2, align: "center" } }], true, HEX.navy),
  ], [3.1, 1.95, 1.95], { x: 0.6, y: 2.95, fontSize: 13.5, rowH: [0.38, 0.4, 0.4, 0.4], maxH: 1.7 });
  T(s, "Invisible", B([
    "Windows Authentication is always available and can't be disabled",
    "Which protocol was used shows only in sys.dm_exec_connections.auth_scheme, session by session",
    "No Entra sign-in: Conditional Access and sign-in risk see nothing",
  ], 13), { x: 0.6, y: 4.75, w: 7.0, h: 1.75, fontSize: 13, paraSpaceAfter: 5 });
  card(s, "Anchors", 7.85, 2.6, 4.9, 3.9, HEX.red, HEX.redTint, "Anchored outside Entra ID", [
    "Domain user account: password rotated by hand",
    "gMSA: the domain controller rotates it every 30 days by default",
    "Virtual account NT SERVICE\\MSSQLSERVER: reaches the network as the computer account",
    "sa: created disabled in Windows mode, often left enabled as a way in",
  ], 13, "FaKey");
  sources(s, "Sources: Microsoft Learn — Choose an authentication mode; Register an SPN for Kerberos connections; SSPI; Service accounts. Book 06, Chapter 01.");
  notes(s,
`Start with what the engine actually does. SQL Server doesn't check the password for a Windows login. It trusts the Windows principal token, and Windows Authentication is always available; it can't be disabled.

With Integrated Security, the driver hands off to SSPI, the Security Support Provider Interface, and its Negotiate package picks Kerberos unless one of the systems can't use it. The client asks the KDC on a domain controller for a service ticket to the instance's SPN, which for TCP names the SQL Server service class, the host's fully qualified name and the port. The engine validates the ticket with the service account's key. No password crosses the network, and Kerberos authenticates both ends.

The table is Microsoft's authentication defaults, and it's the one to remember. When the SPN maps to the correct account, remote connections use Kerberos, but local connections use NTLM. When the SPN is missing or the lookup fails, both use NTLM. When it's on the wrong account, authentication fails outright.

That silent fallback is the most consequential fault in the inheritance. The engine logs a failed SPN registration at startup, but not which protocol each connection used; only the auth scheme column of the connections DMV shows that. And none of these paths produces an Entra sign-in, so Conditional Access has nothing to evaluate.

The identities are anchored in Active Directory too: a domain account with a hand-rotated password, a group managed service account the domain controller rotates every thirty days by default, or the virtual account, which reaches the network as the computer account. And the SA login, created disabled in Windows mode, is often left enabled as an emergency way in.

None of this was a mistake. It was correct engineering for a domain-joined world that no longer exists.

Workbook: Book 06, Chapter 01 — What Windows Authentication Actually Is.`);
}

// ------------------------------------------------------------------ 1.2 Drivers and dates
{
  const m = MODS[0];
  const s = D.content(secName(m), "Three drivers end it; four 2027 dates are real");
  modTag(s, m);
  const dr = [
    ["FaPlugCircleXmark", "NTLM elimination", HEX.red, "All versions deprecated June 2024; NTLMv1 removed from Windows Server 2025. Disable-by-default is undated, so the program set its own backstop: 2027-04-01."],
    ["FaShieldHalved", "Zero trust in the path", HEX.navy, "M-22-09: phishing-resistant MFA at the application layer. Conditional Access acts only on Entra token requests; risk policies need P2."],
    ["FaKey", "The engine's identity", HEX.teal, "When AD stops being the identity source, service accounts lose their governance foundation. The engine needs an Entra identity first, through Azure Arc."],
  ];
  dr.forEach((r, i) => {
    const y = 1.55 + i * 1.22;
    icon(s, r[0], 0.6, y + 0.08, 0.62, r[2]);
    T(s, `Driver ${i + 1}`, [{ text: r[1], options: { bold: true, color: r[2], fontSize: 16, breakLine: true } }, { text: r[3], options: { fontSize: 13 } }], { x: 1.4, y, w: 5.9, h: 1.15, fontSize: 13 });
  });
  txt(s, "Dates head", "WHAT IS ACTUALLY DUE IN 2027", { x: 7.55, y: 1.55, w: 5.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  table(s, "Dates table", [
    head(["2027 date", "External lifecycle event"]),
    ...[["January 12", "Windows Server 2016 leaves extended support"], ["July 12", "SQL Server 2014: final ESU year ends"], ["July 13", "SQL Server 2016: first ESU year ends"], ["October 12", "SQL Server 2017 leaves extended support"]]
      .map((r) => [{ text: r[0], options: { bold: true, color: HEX.amber } }, { text: r[1] }]),
  ], [1.55, 3.65], { x: 7.55, y: 1.9, fontSize: 13.5, rowH: [0.4, 0.55, 0.55, 0.55, 0.55], maxH: 2.65 });
  T(s, "Not due", "Nothing external falls due on 2027-04-01: that date is the program's.", { x: 7.55, y: 4.6, w: 5.2, h: 0.6, fontSize: 13, italic: true, color: HEX.ink });
  callout(s, "Order", 5.35, 1.15, "FaRoute", HEX.navy, "The order of the book: ",
    "assess and consolidate → enable Arc → migrate logins → eliminate NTLM. None of the 2027 versions can take Entra logins, which need SQL Server 2022 or later.");
  sources(s, "Sources: Microsoft Learn — Deprecated features (NTLM); Windows Server removed features; lifecycle pages and ESU FAQ; OMB M-22-09. Book 06, Chapter 02; Runbook R09.");
  notes(s,
`Three drivers end the inheritance, and each is as well reasoned as the original design.

The first is NTLM. Microsoft deprecated every version, LAN Manager and NTLM versions 1 and 2, in June 2024. Version 1 is already removed from Windows Server 2025 and Windows 11 version 24H2; version 2 still works there. Microsoft's next step is to disable network NTLM by default in the next major Windows release, subject to change and with no calendar date. So the program set its own backstop: on April 1, 2027 its enforcement phase blocks NTLM across the estate. That isn't the completion date. It's the date by which consolidation, Arc, login migration and connection strings must already be done.

The second is zero trust. M-22-09 requires phishing-resistant MFA enforced at the application layer, with a device-level signal. Conditional Access can act only on an Entra token request; a Kerberos or NTLM exchange never asks it. Risk-based policies need Entra ID P2.

The third is the engine's own identity. When Active Directory stops being the identity source, the engine's service accounts lose their governance foundation, so the engine needs an Entra identity first, which on premises comes through Azure Arc.

What's actually due in 2027 are lifecycle dates. Windows Server 2016 leaves extended support on January 12. SQL Server 2014's final extended-security-update year ends on July 12, and SQL Server 2016's first on July 13. SQL Server 2017 leaves support on October 12. None of those versions can take Entra logins, so they're consolidation candidates, not in-place migrations.

The dependencies set the order: assess and consolidate, enable Arc, migrate logins, then eliminate NTLM.

Workbook: Book 06, Chapter 02 — Why the Inheritance Must End; Runbook R09.`);
}

// ------------------------------------------------------------------ 1.3 Inventory, lenses, gate
{
  const m = MODS[0];
  const s = D.content(secName(m), "Inventory, rationalize, then gate");
  modTag(s, m);
  const cols = [
    ["FaSitemap", "1  Discover", HEX.navy, HEX.navyTint, [
      "Network sweep: TCP 1433, Browser on UDP 1434; Find-DbaInstance, after software approval",
      "SPN trail: setspn -F -Q MSSQLSvc/* across the forest",
      "Assessment: Azure Migrate, MAP Toolkit, SSMS migration component (DMA retired July 16, 2025)",
    ]],
    ["FaFilter", "2  Rationalize", HEX.teal, HEX.tealTint, [
      "Utilization: zombies have no connections in over a year, no restores, a retired owner",
      "Version: Entra logins need SQL Server 2022+; 2008 and 2008 R2 can't upgrade in place",
      "Dependencies: linked servers, replication, SSIS, quarterly cross-database queries",
    ]],
    ["FaScaleBalanced", "3  Decide", HEX.amber, HEX.amberTint, [
      "Retain: straight to the audit",
      "Consolidate: the workload moves; the target is migrated, not the source",
      "Retire: no login enters the pipeline",
      "Constraints: collation, version-locked vendors, compliance isolation, indivisible dependencies",
    ]],
  ];
  cols.forEach((c, i) => card(s, `Lens col ${i + 1}`, 0.6 + i * 4.1, 1.5, 3.95, 3.75, c[2], c[3], c[1], c[4], 12.5, c[0]));
  callout(s, "Targets", 5.4, 1.1, "FaServer", HEX.navy, "Targets are chosen in the assessment: ",
    "standalone or availability-group SQL Server 2022/2025 on Arc hosts (not failover cluster instances), Azure SQL Managed Instance or Database, so authentication is migrated once, in final shape.");
  sources(s, "Sources: Microsoft Learn — SQL Server Browser; setspn; Azure Migrate; DMA retirement; upgrade paths; Entra authentication for SQL Server. dbatools. Book 06, Chapters 04–06.");
  notes(s,
`Before any authentication work, the estate has to be counted, because a twenty-year estate doesn't know what it has. The instances that matter most are the ones nobody manages, so they're discovered, not retrieved from a list, with three instruments that are each blind to what the others find.

A network and directory sweep listens: the default instance on TCP 1433, named instances on dynamic ports, and the Browser service on UDP 1434. The community dbatools module's Find-DbaInstance combines those signals, after the program's software approval. The SPN trail is independent: a forest-wide SetSPN query lists every instance ever registered for Kerberos, though not the ones whose registration failed. And Microsoft's assessment tooling adds workload and dependency data: Azure Migrate, the MAP Toolkit, and the migration component in Management Studio, since the Data Migration Assistant was retired on July 16, 2025.

Then three lenses. Utilization finds zombies: no connections in over a year, no restores, a retired owning application. Retiring them is the fastest way to shrink the migration surface. Version is a primary input, because Entra logins need SQL Server 2022 or later, and 2008 and 2008 R2 can't upgrade in place. Dependencies most often overturn a naive plan: linked servers, replication, SSIS packages and the quarterly cross-database query.

The lenses resolve into one verdict per instance. Retain goes straight to the audit. Consolidate moves the workload and retires the source. Retire removes the instance and every login it carries. Targets are chosen during the assessment, standalone or availability-group SQL Server on Arc hosts, since failover cluster instances can't use Entra authentication, or Azure SQL, so authentication is migrated once, in its final shape. And record the constraints honestly.

Workbook: Book 06, Chapters 04, 05 and 06.`);
}

// ================================================================== MODULE 2
divider(MODS[1], [
  "What the authentication audit reads, and why its output is a compliance record",
  "Three Arc-eligibility categories, and the engine and OS moving on separate tracks",
  "Three principal types replace Windows and SQL logins",
  "The parallel run, and the five positions the engine-authentication decision settles",
], "Sources: Book 06, Chapters 07, 08, 11 and 12.",
`Module 2: the audit, the principals and the decision. Four slides. What the authentication audit reads on every surviving instance, and why its output is a compliance record rather than a spreadsheet. The three Arc-eligibility categories, and the distinction between the engine and the operating system moving to Entra ID. The three principal types that replace Windows and SQL logins. And the parallel run, with the five decisions that turn the migration pattern into enforceable policy.

Workbook: Book 06, Chapters 07, 08, 11 and 12.`);

// ------------------------------------------------------------------ 2.1 The audit
{
  const m = MODS[1];
  const s = D.content(secName(m), "What the authentication audit reads");
  modTag(s, m);
  T(s, "Reads", [
    ...rich("Host and version  ", HEX.navy, "Version, edition, build. The host OS sets the Arc envelope: agent on Windows Server 2012–2025, SQL Server on Arc needs 2016+, program floor 2019."),
    { text: "", options: { breakLine: true } },
    ...rich("Domain and Arc  ", HEX.navy, "Domain-join state; is the Connected Machine agent and its managed identity present?"),
    { text: "", options: { breakLine: true } },
    ...rich("Authentication mode  ", HEX.navy, "Registry LoginMode (1 Windows, 2 mixed) checked against SERVERPROPERTY('IsIntegratedSecurityOnly'); a mismatch waits on a restart. 2025: IsExternalAuthenticationOnly."),
    { text: "", options: { breakLine: true } },
    ...rich("Service account and SPN  ", HEX.navy, "Domain account, gMSA or virtual account; is the right MSSQLSvc SPN registered?"),
  ], { x: 0.6, y: 1.5, w: 5.6, h: 3.9, fontSize: 13, paraSpaceAfter: 2 });
  table(s, "Login types", [
    head(["Type", "Login", "Outcome"]),
    ...[["U", "Windows user", "Entra user login (E)"], ["G", "Windows group", "Entra group login (X)"], ["S", "SQL login", "Managed identity or service principal, or a dated exception"],
      ["C, K", "Certificate or key mapped", "Code signing only (Runbook R10)"], ["E, X", "Entra login or group", "Already migrated"], ["sa", "Built-in SQL admin", "Disabled and renamed, never migrated"]]
      .map((r) => cells(r, true, HEX.navy)),
  ], [0.8, 2.15, 3.3], { x: 6.5, y: 1.5, fontSize: 12.5, rowH: [0.36, 0.42, 0.42, 0.55, 0.42, 0.42, 0.42], maxH: 3.85 });
  callout(s, "No W", 5.5, 1.0, "FaTriangleExclamation", HEX.red, "There is no type W: ",
    "a query for one returns zero rows and reports a clean instance. Each run is compared with the last; drift is a violation.");
  sources(s, "Sources: Microsoft Learn — Connected Machine agent and Arc SQL prerequisites; Change server authentication mode; sys.server_principals. Book 06, Chapters 07 and 12; Runbook R03.");
  notes(s,
`The audit runs only on what the gate kept, retain instances and consolidation targets, and its deliverable is a per-instance compliance record.

For each host it records every instance, with version, edition and build, and the host operating system, which sets the Arc envelope. The Connected Machine agent runs on Windows Server 2012 through 2025, SQL Server enabled by Arc needs 2016 or later, and the program sets its own floor at Windows Server 2019, because 2016 leaves support in January 2027. It records domain-join state and whether the Arc agent and managed identity are present.

Then the authentication mode. The registry value LoginMode is one for Windows Authentication mode and two for mixed. The audit cross-checks it against the running instance with the Is Integrated Security Only server property, because a mode change takes effect only after a restart, and any disagreement is an anomaly to resolve before migrating. On SQL Server 2025 enabled by Arc it also reads Is External Authentication Only, which shows the Disable SQL Authentication setting.

Every login is classified by its type in sys.server_principals: U, a Windows user; G, a Windows group; S, a SQL login; C and K, certificate- and key-mapped; and E and X, Entra logins already present. The letters are the view's values, not mnemonics. There's no type W, and a query written against one returns zero rows and reports a clean instance. Active SQL logins are a critical finding, and an enabled SA with a non-rotated password is the highest-priority finding of all.

The audit captures the engine's service account and checks its SPN. And each run is compared with the last: a new SQL login, a revert to mixed mode, or a new passthrough linked server is drift, and drift is a compliance violation.

Workbook: Book 06, Chapters 07 and 12; Runbook R03.`);
}

// ------------------------------------------------------------------ 2.2 Categories and layers
{
  const m = MODS[1];
  const s = D.content(secName(m), "Arc eligibility: three categories, two layers");
  modTag(s, m);
  const cats = [
    ["Category 1", "Entra-auth-ready", HEX.teal, HEX.tealTint, "Agent running, SQL extension deployed, Entra authentication configured, SQL Server 2022+.", "Migrate logins now."],
    ["Category 2", "Arc-eligible, not enabled", HEX.amber, HEX.amberTint, "Meets the prerequisites, but no agent or no Entra configuration.", "Deploy Arc first; many Windows logins, SQL logins or missing SPNs go first. Becomes Category 1 on the next run."],
    ["Category 3", "Not yet eligible", HEX.red, HEX.redTint, "Engine older than 2022, or a failover cluster instance on any version.", "Upgrade, re-platform, or a sunset-dated exception. The OS-layer NTLM block ignores exceptions."],
  ];
  cats.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Cat ${i + 1}`, x, 1.5, 3.95, 2.45, c[3]);
    T(s, `Cat ${i + 1} text`, [
      { text: c[0], options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
      { text: c[1], options: { bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", breakLine: true } },
      { text: c[4], options: { breakLine: true } },
      { text: c[5], options: { bold: true, color: HEX.navy } },
    ], { x: x + 0.2, y: 1.58, w: 3.55, h: 2.3, fontSize: 12.5, paraSpaceAfter: 4 });
  });
  const layers = [
    ["Layer 1 — SQL engine Entra authentication", HEX.navy, HEX.navyTint, "SQL Server 2022+, not a failover cluster instance, plus Arc and the SQL extension. Works on a domain-joined Windows Server 2019 host today."],
    ["Layer 2 — Server OS Entra sign-in", HEX.slate, HEX.grey, "Administrators sign in to Windows with Entra ID. Needs Windows Server 2025 with Desktop Experience and Entra-joins the server: a separate program."],
  ];
  layers.forEach((l, i) => {
    const x = 0.6 + i * 6.12;
    box(s, `Layer ${i + 1}`, x, 4.1, 6.0, 1.4, l[2]);
    T(s, `Layer ${i + 1} text`, [{ text: l[0], options: { bold: true, color: l[1], fontSize: 14, breakLine: true } }, { text: l[3] }], { x: x + 0.2, y: 4.15, w: 5.6, h: 1.3, fontSize: 12.5, valign: "middle" });
  });
  callout(s, "Unjoined", 5.62, 0.88, "FaLightbulb", HEX.navy, "Read the audit right: ",
    "“not yet domain-unjoined” means OS-level Entra sign-in isn't available yet, never “SQL migration blocked”.");
  sources(s, "Sources: Microsoft Learn — SQL Server enabled by Azure Arc; Entra authentication for SQL Server; Arc sign-in with Entra ID. Book 06, Chapters 07–08.");
  notes(s,
`The audit's most consequential output is a category for every instance, framed around Arc because Arc is the program's path to Entra authentication.

Category 1 is Entra-auth-ready: the Connected Machine agent is running, the Azure extension for SQL Server is deployed, Entra authentication is configured and the engine is SQL Server 2022 or later. There the audit's job is a precise login inventory, and migration starts now.

Category 2 is Arc-eligible but not enabled. Prioritize by the audit: instances with many Windows logins, active SQL logins or missing SPNs go first. The deployment is a server action, not a SQL Server change; when the agent connects a server with SQL Server installed, Arc installs the extension automatically. Once Entra authentication is configured, the instance becomes Category 1 on the next run.

Category 3 isn't yet eligible. An engine older than 2022 can't accept Entra logins, with or without Arc, so it upgrades and follows the Category 2 path, or carries an exception with a sunset date. Failover cluster instances belong here on any version, because Entra authentication isn't supported on them. And an exception doesn't save an instance from the program's NTLM block, which is applied in the operating system's security layer, not in the engine.

Then the distinction the book calls the most common misunderstanding. Layer 1 is the engine accepting Entra tokens: SQL Server 2022 or later, not a cluster instance, plus Arc and the extension. It doesn't need the server unjoined or Windows Server 2025; a domain-joined Windows Server 2019 host can have Entra logins today. Layer 2 is administrators signing in to the server itself with Entra ID. That needs Windows Server 2025 with Desktop Experience and Entra-joins the server, so it's a separate program, sequenced on its own.

Workbook: Book 06, Chapters 07 and 08.`);
}

// ------------------------------------------------------------------ 2.3 Principal types
{
  const m = MODS[1];
  const s = D.content(secName(m), "Three principal types replace Windows logins");
  modTag(s, m);
  flow(s, "Token path", [
    ["Sign in", "The client signs in to Entra ID"],
    ["Conditional Access", "Policy evaluated before any token"],
    ["Token", "Audience https://database.windows.net/"],
    ["Engine", "Validates; maps to an E or X login"],
  ], 1.5, 0.92, [[HEX.navy, HEX.navyTint], [HEX.teal, HEX.tealTint]], { headSize: 14, bodySize: 12 });
  table(s, "Principal table", [
    head(["Principal", "Login", "Replaces", "What governs it"]),
    ...[["Entra user, by UPN", "E", "Windows user (U)", "Conditional Access: MFA, device, risk. FIDO2 not yet supported on Arc"],
      ["Entra security group", "X", "Windows group (G)", "Dynamic membership from HR attributes; P1 per member"],
      ["Managed identity or service principal", "E", "SQL login (S)", "Credential type and workload-identity controls, not CA. An Arc identity is one per server"]]
      .map((r) => cells(r, true, HEX.navy)),
  ], [2.7, 0.8, 2.05, 6.6], { x: 0.6, y: 2.62, fontSize: 13, rowH: [0.38, 0.5, 0.5, 0.62], maxH: 2.1 });
  T(s, "Login facts", B([
    "CREATE LOGIN … FROM EXTERNAL PROVIDER looks the principal up in Microsoft Graph: the instance identity needs read permissions with admin consent",
    "SQL Server 2025: WITH OBJECT_ID pins a login when display names aren't unique",
    "Entra connections are always encrypted, so clients must trust the instance's certificate",
  ], 13), { x: 0.6, y: 4.85, w: 12.15, h: 1.65, fontSize: 13, paraSpaceAfter: 5 });
  sources(s, "Sources: Microsoft Learn — CREATE LOGIN; Entra authentication for SQL Server; Arc managed identity; Conditional access for Azure SQL; dynamic membership. Book 06, Chapter 11.");
  notes(s,
`This is where the engine stops accepting Kerberos tickets and NTLM exchanges and starts accepting Entra-issued OAuth 2.0 access tokens.

The mechanism is CREATE LOGIN FROM EXTERNAL PROVIDER, on SQL Server 2022 and later. The login is a passwordless external principal in master. At connection time the client presents a token whose audience is database.windows.net, and the engine validates it and maps it to the login. CREATE LOGIN looks the principal up through Microsoft Graph, so the instance's identity needs Graph read permissions with admin consent, or login creation fails. On SQL Server 2025, WITH OBJECT_ID pins a login when display names aren't unique. And Entra connections are always encrypted, so clients must trust the instance's certificate.

Three types. An Entra user login, type E, named by the user principal name; UPNs can differ from SAM account names, so the audit captures that mapping first. The engine has no MFA logic. Conditional Access enforces MFA, device compliance and sign-in risk before the token is issued, with no SQL-level prompt and no SQL-level bypass. One limit: FIDO2 security keys aren't yet supported for Entra authentication to SQL Server on Arc.

An Entra group login, type X, is the familiar AD group pattern. With a dynamic group driven by HR attributes, people gain and lose access as their attributes change, with no CREATE USER or DROP USER. That needs a P1 license per member, and access is only as strong as the write controls on those attributes.

And an application login, also type E, for a managed identity or service principal, replacing a SQL login and its stored password. Conditional Access doesn't cover these; service principals are reachable only through separately licensed workload-identity policies. On an Arc server the managed identity belongs to the server, so one login per server is the honest unit of attribution.

Workbook: Book 06, Chapter 11 — Three Principal Types.`);
}

// ------------------------------------------------------------------ 2.4 Parallel run and five decisions
{
  const m = MODS[1];
  const s = D.content(secName(m), "The parallel run and the five decisions");
  modTag(s, m);
  flow(s, "Parallel run", [
    ["Create", "An external-provider login per user or group; an unmapped principal blocks"],
    ["Validate", "A real Entra sign-in for each new login"],
    ["Disable", "Legacy Windows and SQL logins: disable, don't drop"],
    ["Observe", "30 days, with SQL Server Audit evidence"],
    ["Drop", "Only after no residual use"],
  ], 1.5, 1.2, [[HEX.navy, HEX.navyTint], [HEX.navy, HEX.navyTint], [HEX.amber, HEX.amberTint], [HEX.amber, HEX.amberTint], [HEX.red, HEX.redTint]], { headSize: 14, bodySize: 11.5 });
  table(s, "Decisions", [
    head(["The engine-authentication decision", "What it requires"]),
    ...[["1  Consolidation gates migration", "Only retain instances and consolidation targets are migrated"],
      ["2  The parallel run is required", "Always in production; non-production may compress the window with owner sign-off"],
      ["3  SQL Authentication eliminated", "Every type S migrates or carries a dated exception; sa disabled and renamed"],
      ["4  Pre-2022 is upgrade-or-except", "Failover cluster instances too; certificate-based sign-in is the interim posture"],
      ["5  The compliance record closes it", "“Done” is a queryable posture, re-verified continuously"]]
      .map((r) => cells(r, true, HEX.navy)),
  ], [4.6, 7.55], { x: 0.6, y: 2.9, fontSize: 13, rowH: [0.38, 0.44, 0.44, 0.44, 0.44, 0.44], maxH: 2.6 });
  T(s, "Arc 2025", [{ text: "On SQL Server 2025 with Arc: ", options: { bold: true, color: HEX.teal } }, { text: "Disable SQL Authentication closes the door for every SQL login, sa included, without a restart." }],
    { x: 0.6, y: 5.75, w: 12.15, h: 0.75, fontSize: 13.5 });
  sources(s, "Sources: Microsoft Learn — Disable SQL authentication for SQL Server enabled by Azure Arc; SQL Server Audit; sys.server_principals. Book 06, Chapters 11–12.");
  notes(s,
`No Windows login is dropped until its Entra replacement is validated. The engine-authentication decision makes a three-phase parallel run required in production.

Create: for every migrating user or group login, create the external-provider login for its Entra principal. Verify each mapping first; a principal with no confirmed Entra equivalent is a blocking finding, and building that mapping is the most labor-intensive step. Validate: test each new login with the principal's real Entra credential before any legacy login is touched. Then disable, don't drop, the legacy Windows and SQL logins, observe for thirty days, and only then drop them.

Observation needs evidence, not silence. Login metadata says what exists; only auditing says what's used, and Microsoft's own sequence uses SQL Server Audit with the successful-login action group. Disable-and-observe keeps every cutover reversible, so a wrong mapping locks no one out.

Around the pattern sit five decisions. One, consolidation gates migration. Two, the parallel run is required; non-production may shorten the window only with documented owner sign-off. Three, SQL Authentication is eliminated: every active SQL login migrates to a service principal or managed identity, or carries an exception with a compensating control and a sunset date, and SA is disabled and renamed, with emergency access as a monitored break-glass procedure. On SQL Server 2025 with Arc, the Disable SQL Authentication setting closes the door for every SQL login at once, without a restart. Four, pre-2022 instances and failover cluster instances upgrade, re-platform or carry a sunset-dated exception; connections that can't reach Kerberos or Entra by the backstop use certificate-based authentication as the interim posture. Five, the per-instance compliance record is the closure artifact, so done becomes a queryable posture instead of a claim.

Workbook: Book 06, Chapters 11 and 12.`);
}

// ================================================================== MODULE 3
divider(MODS[2], [
  "The four connection patterns that generate NTLM at the SQL layer",
  "Three phases: discover, restrict, eliminate",
  "Applications: the four-class pattern, read on two axes",
  "The closure condition: five conditions, held continuously",
], "Sources: Book 06, Chapters 14, 15, 18 and 20.",
`Module 3: NTLM, applications and closure, the last of the strategy. Four slides. The four connection patterns that generate NTLM at the SQL layer, because NTLM is a protocol, not a setting, and no single switch removes it. The three phases that do remove it: discover, restrict, eliminate. The four-class pattern for the applications upstream of the database, read on two axes. And the closure condition: five conditions that must hold at once, and keep holding.

Workbook: Book 06, Chapters 14, 15, 18 and 20.`);

// ------------------------------------------------------------------ 3.1 Four patterns
{
  const m = MODS[2];
  const s = D.content(secName(m), "Four patterns that generate NTLM");
  modTag(s, m);
  table(s, "Patterns", [
    head(["Pattern", "How it shows up", "Fix"]),
    ...[["1  Missing or incorrect SPN", "Silent NTLM fallback. A wrong-account SPN fails (“Cannot generate SSPI context”); a duplicate gives KDC_ERR_PRINCIPAL_NOT_UNIQUE", "setspn -S on the engine's account; remove the extra registration"],
      ["2  Cross-site connections", "No reachable domain controller for the service account's domain (port 88, DNS): NTLM where a trust allows, failure where it doesn't", "Restore DC reachability, DNS and trust, or move to Entra tokens. Cloud Kerberos trust isn't a fix"],
      ["3  Linked-server passthrough", "The double hop can't run on NTLM: “Login failed for user NT AUTHORITY\\ANONYMOUS LOGON”", "Mapped login, Entra identity (2022+), managed identity (2025) or constrained delegation"],
      ["4  Clients with no domain ticket", "Unjoined app hosts on Integrated Security; same-host connections; legacy SQLOLEDB or ODBC over named pipes", "Managed identity before the unjoin; TCP or a current driver (MSOLEDBSQL, ODBC 17+)"]]
      .map((r) => cells(r, true, HEX.teal)),
  ], [2.75, 5.2, 4.2], { x: 0.6, y: 1.5, fontSize: 12.5, rowH: [0.38, 0.8, 0.8, 0.8, 0.8], maxH: 3.75 });
  callout(s, "NTLMv1", 5.45, 1.05, "FaTriangleExclamation", HEX.red, "NTLMv1 is a critical finding: ",
    "event 4624 on a domain controller records the version under Package Name (NTLM only). Filter out anonymous logons, which report V1.");
  sources(s, "Sources: Microsoft Learn — Register an SPN; Cannot generate SSPI context; KDC_ERR_PRINCIPAL_NOT_UNIQUE; MSSQLSERVER_18456; Entra Kerberos; audit NTLMv1. Book 06, Chapter 14.");
  notes(s,
`Microsoft has deprecated every version of NTLM and removed version 1 from current Windows, but nothing in its timeline is a deadline for SQL Server. Eliminating NTLM means naming every connection pattern that produces it, and the book finds four.

Pattern one, a missing or incorrect SPN, the most common cause. If the driver can't get a ticket for the SPN it builds, it falls back to NTLM. The fix is SetSPN with the dash S switch, which checks for duplicates before adding. Two neighbors behave differently: an SPN on the wrong account doesn't fall back, it fails, typically with "Cannot generate SSPI context", and a duplicate SPN breaks Kerberos with a principal-not-unique error.

Pattern two, cross-site connections. The client needs a domain controller of the domain that holds the server's service account. If port 88 is blocked or DNS doesn't resolve it, Negotiate falls back to NTLM where a trust lets the server validate the account, and fails where it doesn't. Confirm with klist before changing firewall rules. Cloud Kerberos trust isn't a fix, because its partial ticket is still exchanged with an on-premises domain controller.

Pattern three, linked-server passthrough. Presenting the caller's identity to a second instance is a double hop, and NTLM can't make it; the symptom is a failed login for anonymous logon. Move each definition to a mapped login, an Entra identity on 2022 and later, a managed identity on 2025, or Kerberos constrained delegation.

Pattern four, clients with no domain ticket. An application on an unjoined host still using Integrated Security falls back to NTLM or fails, so its connection string moves to managed identity first. Connections on the instance's own host always use NTLM, and legacy providers over named pipes force it.

And NTLM version 1 found anywhere is a critical finding, not a migration item.

Workbook: Book 06, Chapter 14 — NTLMv1, NTLMv2 and the Patterns That Generate NTLM.`);
}

// ------------------------------------------------------------------ 3.2 Three phases
{
  const m = MODS[2];
  const s = D.content(secName(m), "Discover, restrict, eliminate");
  modTag(s, m);
  const ph = [
    ["Phase A", "Discover", HEX.navy, HEX.navyTint, [
      "The audit, plus auth_scheme per connection",
      "Events 4624 and 4625, logon type 3, package NTLM, on SQL hosts",
      "Restrict NTLM audit policies → NTLM Operational log; event 8004 on DCs",
      "Enhanced NTLM logging: Windows Server 2025, Windows 11 24H2; 2019 and 2022 with the October 13, 2026 updates",
    ]],
    ["Phase B", "Restrict", HEX.amber, HEX.amberTint, [
      "LAN Manager level 5: refuses LM and NTLMv1, still accepts NTLMv2 (target 2026-Q3)",
      "Fix SPNs, DC reachability, linked servers, connection strings",
      "Restrict NTLM deny settings for NTLMv2",
      "Exceptions are server-name lists on clients and DCs; none for the server role",
    ]],
    ["Phase C", "Eliminate", HEX.red, HEX.redTint, [
      "Restrict NTLM set to deny on every host, by 2027-04-01 (the program's date)",
      "Fails at the LSA, before the engine",
      "Instances on Entra logins are unaffected",
      "Open: whether the date holds for the pre-2022 long tail",
    ]],
  ];
  ph.forEach((p, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Phase ${i + 1}`, x, 1.5, 3.95, 3.85, p[3]);
    T(s, `Phase ${i + 1} head`, [{ text: p[0], options: { bold: true, fontSize: 12, color: HEX.slate, breakLine: true } }, { text: p[1], options: { bold: true, fontSize: 18, fontFace: "Cambria", color: p[2] } }],
      { x: x + 0.2, y: 1.58, w: 3.55, h: 0.75, fontSize: 18 });
    T(s, `Phase ${i + 1} text`, B(p[4], 12.5), { x: x + 0.2, y: 2.38, w: 3.55, h: 2.9, fontSize: 12.5, paraSpaceAfter: 5 });
  });
  callout(s, "Microsoft", 5.5, 1.0, "FaScaleBalanced", HEX.slate, "Microsoft's own change is different: ",
    "the October 2026 NTLMv1 update blocks only NTLMv1-derived single sign-on (MS-CHAPv2 Wi-Fi, VPN) on devices without Credential Guard.");
  sources(s, "Sources: Microsoft Learn — Restrict NTLM policies (Policy CSP); LAN Manager level; NTLM auditing enhancements; KB5066470; status code 0x32. Book 06, Chapters 14–15.");
  notes(s,
`The program's three phases apply to SQL Server unchanged. After the April 2027 block, any connection that needs NTLM fails in the Windows security subsystem, where the Local Security Authority enforces the policy, so the engine never sees it. Every pattern has to be resolved before Phase C, not after.

Phase A discovers. The authentication audit is the primary instrument, and Windows logging records what actually happened: events 4624 and 4625 with logon type 3 and the NTLM package on SQL Server hosts; the auth scheme column for per-connection proof; the Restrict NTLM audit policies, which log what a later deny would block, with event 8004 on domain controllers naming the server; and enhanced NTLM logging, which says who used NTLM and why Kerberos wasn't used.

Phase B restricts. First, the LAN Manager authentication level set to five. Be precise: domain controllers then refuse LM and version 1 but still accept version 2, so level five is the version-1 block, targeted for the third quarter of 2026, not an NTLM block. Microsoft's October 2026 update is a different control again; it blocks only NTLM version 1 derived single sign-on credentials, on devices without Credential Guard. Then the pattern work: SPNs, domain-controller reachability, linked servers and connection strings. Version 2 is restricted with the Restrict NTLM deny settings, whose exceptions are lists of server names on clients and domain controllers only. There's no list for the server role, so an instance that must keep accepting NTLM can't deny incoming NTLM.

Phase C eliminates: Restrict NTLM set to deny on every host. It's safe only after login migration is complete, and an instance on Entra logins is immune, because it isn't using NTLM. The book leaves one decision open: whether the date holds for the pre-2022 long tail.

Workbook: Book 06, Chapters 14 and 15.`);
}

// ------------------------------------------------------------------ 3.3 Four classes, two axes
{
  const m = MODS[2];
  const s = D.content(secName(m), "Applications: four classes, two axes");
  modTag(s, m);
  txt(s, "User axis head", "USER AXIS: THE FOUR CLASSES, IN PREFERENCE ORDER", { x: 0.6, y: 1.45, w: 7.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  table(s, "Classes", [
    head(["Class", "User sign-in", "SQL connection"]),
    ...[["Class 3 — OIDC (preferred)", "Entra ID issues the tokens; no LDAP, no AD query", "Managed identity or service principal"],
      ["Class 2 — SAML", "Entra ID as the SAML identity provider", "Managed identity or service principal"],
      ["Class 1 — App Proxy", "Entra preauthenticates; the app's AD dependency stays behind the proxy", "Managed identity or service principal"],
      [{ text: "Class 4 — Domain Services (last resort)", options: { bold: true, color: HEX.red } }, "A managed domain with LDAP, Kerberos and NTLM", { text: "Blocked: the instance carries a sunset-dated exception", options: { bold: true, color: HEX.red } }]]
      .map((r) => cells(r, true, HEX.teal)),
  ], [2.45, 2.65, 2.2], { x: 0.6, y: 1.8, fontSize: 12, rowH: [0.36, 0.62, 0.62, 0.62, 0.62], maxH: 3.4 });
  txt(s, "DB axis head", "DATABASE AXIS: SET BY EVIDENCE", { x: 8.15, y: 1.45, w: 4.6, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  const cols = [["A", "Configuration only", "Moves now, with OIDC or SAML", HEX.teal, HEX.tealTint], ["B", "Code change", "Scheduled", HEX.navy, HEX.navyTint], ["C", "Vendor-dependent", "Dated exception", HEX.amber, HEX.amberTint], ["D", "No Entra path", "Exception or retire", HEX.red, HEX.redTint]];
  cols.forEach((c, i) => {
    const x = 8.15 + (i % 2) * 2.33, y = 1.8 + Math.floor(i / 2) * 1.12;
    box(s, `Axis ${c[0]}`, x, y, 2.25, 1.02, c[4]);
    T(s, `Axis ${c[0]} text`, [{ text: `${c[0]}  ${c[1]}`, options: { bold: true, color: c[3], breakLine: true } }, { text: c[2] }], { x: x + 0.12, y: y + 0.06, w: 2.01, h: 0.9, fontSize: 12, valign: "middle" });
  });
  T(s, "Evidence", B(["Driver version supports the Entra mode", "Token acquisition and refresh", "Pooling: an AccessToken is part of the pool key", "Vendor support; client platform"], 12), { x: 8.15, y: 4.1, w: 4.6, h: 1.2, fontSize: 12, paraSpaceAfter: 2 });
  callout(s, "Join", 5.45, 1.05, "FaCubes", HEX.teal, "Join the two audits: ",
    "the application audit (Get-LDAPBindAccountInventory.ps1) and the authentication audit together show each instance's full chain.");
  sources(s, "Sources: Microsoft Learn — Authenticate apps and users; application proxy; SAML vs OIDC; Entra Domain Services; Microsoft.Data.SqlClient. Book 06, Chapter 18.");
  notes(s,
`The database is only half of the authentication path. An application that moved its user sign-in to Entra ID but still reaches SQL Server with a SQL login hasn't finished. The chain runs from user to application to database, and both legs have to leave Active Directory.

The program's LDAP-dependent-application plan sorts applications into four classes, in strict preference order; the numbers are identifiers, not ranks. Class 3, OpenID Connect, is the destination: Entra ID issues the tokens, there's no LDAP bind and no AD query, and the application reaches SQL Server with its managed identity. Class 2, SAML, removes the LDAP dependency but ranks below OIDC, because Microsoft recommends OIDC for new development. Class 1, Application Proxy, fronts an application that can't change; Entra preauthenticates users, so Conditional Access applies, but the application's own AD dependency stays behind the proxy. Class 4, Entra Domain Services, is the last resort: a managed domain with LDAP, Kerberos and NTLM. Its NTLM is still NTLM, and an instance serving a Class 4 application can't reach the Entra-exclusive posture, so it carries a sunset-dated exception.

The class describes only the user axis. The database connection is a second axis, set by evidence: does the deployed driver support the Entra mode, can the application use a managed identity or must its code refresh tokens, does pooling survive per-identity tokens, does the vendor support it, and does the platform have an Entra-capable driver. That places each application in column A, configuration only; B, code change; C, vendor-dependent; or D, no Entra path. OIDC or SAML in column A moves now; B is scheduled; C gets a dated exception; D means exception or retirement.

The application audit supplies the user axis, and it has to be joined to the authentication audit before an instance shows its full chain.

Workbook: Book 06, Chapter 18 — The Four-Class Pattern Applied to SQL-Consuming Applications.`);
}

// ------------------------------------------------------------------ 3.4 Closure
{
  const m = MODS[2];
  const s = D.content(secName(m), "Closure: five conditions, held continuously");
  modTag(s, m);
  const conds = [
    ["No usable Windows-backed principal", "Zero enabled type U or G logins with CONNECT SQL, apart from a registered break-glass group"],
    ["SQL Authentication eliminated", "No type S outside exceptions; sa disabled; LoginMode 1; on 2025, IsExternalAuthenticationOnly = 1"],
    ["Entra observed working, nothing else", "Only E and X logins; sign-in logs and SQL Server Audit agree; no NTLM or Kerberos in auth_scheme"],
    ["A cloud identity for the engine", "Arc agent connected, SQL extension deployed, Entra configured; a failover cluster instance can't meet it"],
    ["MFA for every human", "Conditional Access, read from the sign-in logs; applications follow Chapter 18's controls"],
  ];
  conds.forEach((c, i) => {
    const y = 1.5 + i * 0.8;
    s.addShape(pres.shapes.OVAL, { objectName: `Cond ${i + 1} dot`, x: 0.6, y: y + 0.12, w: 0.5, h: 0.5, fill: { color: HEX.teal }, line: { color: HEX.teal } });
    txt(s, `Cond ${i + 1} num`, String(i + 1), { x: 0.6, y: y + 0.12, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    T(s, `Cond ${i + 1} text`, [{ text: c[0], options: { bold: true, color: HEX.navy, breakLine: true } }, { text: c[1], options: { fontSize: 12 } }], { x: 1.25, y, w: 6.45, h: 0.76, fontSize: 13.5, valign: "middle" });
  });
  card(s, "Drift", 7.95, 1.5, 4.8, 1.95, HEX.red, HEX.redTint, "Drift is a violation", ["LoginMode 1 → 2", "A new type S, U or G login", "Arc agent offline, or the SQL extension unavailable"], 12.5);
  card(s, "Reading", 7.95, 3.55, 4.8, 1.95, HEX.navy, HEX.navyTint, "Reading the evidence", ["Shared token audience: per-instance proof is the instance's own audit", "Local connections always report NTLM", "LoginMode 1 proves only that SQL logins are refused"], 11.5);
  callout(s, "Validation", 5.62, 0.88, "FaUserClock", HEX.amber, "2027-04-01: ",
    "the months before it are the validation period, not the migration period.");
  sources(s, "Sources: Microsoft Learn — Disable SQL authentication (Arc); sys.server_principals; sys.dm_exec_connections; determine the authentication type; Conditional access for Azure SQL. Book 06, Chapters 12 and 20.");
  notes(s,
`A transformation that reaches its end state and stops monitoring will regress. Any administrator with permission can switch an instance back to mixed mode or create a new login, so closure is a posture, kept by continuous audit, drift detection and governance that treats regression as a violation.

The transformation is closed when five conditions hold at the same time on every production instance. One: no usable Windows-backed principal, meaning zero enabled user or group logins with CONNECT SQL, apart from a documented break-glass group. Two: SQL Authentication eliminated: no SQL logins outside the exception registry, SA disabled, LoginMode one, and on SQL Server 2025 Is External Authentication Only as well. Disabling SQL authentication doesn't remove logins or end live sessions, so the census still matters. Three: Entra authentication observed working, and nothing else: every usable login is type E or X, the sign-in logs and SQL Server Audit show the expected principals, and the auth scheme column shows no NTLM or Kerberos over the validation period. Four: the engine has a cloud identity, with the Arc agent connected, the extension deployed and Entra authentication configured; a failover cluster instance can't meet this as built. Five: every human authenticates with MFA through Conditional Access.

No single setting does this. SQL Server can't turn Windows Authentication off, so LoginMode one proves only that SQL logins are refused. The book calls the combined state the Entra-exclusive operational posture.

Two details govern how evidence is read. Every SQL resource shares one token audience, so a sign-in log can't say which instance a principal reached; the per-instance proof is the instance's own audit. And local connections always report NTLM, so separate them from remote ones.

Drift is a violation: LoginMode moving from one to two, a new SQL, user or group login, or the Arc agent going offline. And the final months before April 2027 are for validation, not migration.

Workbook: Book 06, Chapters 12 and 20 — The Closure Condition.`);
}

// ================================================================== MODULE 4
divider(MODS[3], [
  "R01 Prerequisites, the evidence envelope and the safety model",
  "R02 Estate discovery and the consolidation gate",
  "R03 The authentication audit",
  "R04 Arc deployment and the managed identity",
  "R05 Login migration and the parallel run",
], "Sources: Book 06, Runbooks R01–R05.",
`Part 2: the runbooks for DBAs. Module 4 covers the first five: prerequisites, discovery and the consolidation gate, the authentication audit, Arc and the managed identity, and login migration with its parallel run. For each, the steps, the gate that has to hold before the next runbook starts, and the evidence it leaves. One rule runs through all ten: read-only and derivation functions run directly, and anything that changes state plans by default or writes a reviewable script, then goes through change control. The commands are illustrative and untested against a production estate, so each runs first in a test environment.

Workbook: Book 06, Runbooks R01 to R05.`);

runbook(MODS[3], {
  title: "R01 — Prerequisites and the evidence model",
  badgeText: "Setup only", badgeColor: SETUP,
  lead: "Setup and orientation: it provisions nothing and changes no production state.",
  steps: [
    ["Toolchain", "PowerShell 7+; a Python interpreter with only the standard library, for the integrity seal; the Spec scripts under tools/discovery/; modules FMPSqlServerMigration, FMPIdentityAssessment and FMPPlanGenerators. azcmagent and az run only behind an explicit opt-in."],
    ["Evidence model", "Every function emits a provenance-sealed envelope: schema, artifact_type, data.records, provenance (module, version, UTC timestamp, content_hash). The seal omits the timestamp, so identical input gives an identical hash; a broken envelope is a DRIFT-PROVENANCE finding."],
    ["Safety model", "Read-only and derivation functions run directly. State changes plan by default (-Execute plus confirmation) or emit a reviewable script; the login and group generators have no -Server or -Execute. No embedded secrets; a GCC-Moderate tenant uses AzureCloud."],
    ["Offline snapshots", "Every function accepts captured JSON or CSV, so the whole chain can be run and tested without touching a live estate."],
  ],
  boxes: [
    Object.assign({ head: "RUN ORDER", items: ["R02 discovery and the gate", "R03 audit of the survivors", "R04 Arc, then R05 logins", "R06 NTLM, R07 groups and CA", "R08 connection strings", "R09 closure, R10 certificates"] }, NOTE),
    Object.assign({ head: "GATE", items: ["Nothing touches production until R02 defines the retain and target set; the first changes are R04 and R05"] }, GATE),
    Object.assign({ head: "EVIDENCE", items: ["One sealed envelope per step, in a dated folder under version control"] }, EVID),
  ],
  src: "Sources: Microsoft Learn — azcmagent connect and show; Planning identity for Azure Government. Book 06, Runbook R01.",
  body:
`Runbook R01 provisions nothing and changes no production state. It sets up what the other nine assume.

Step one, the toolchain. PowerShell 7 or later is the runtime. The one external dependency is a Python interpreter with only the standard library, which the modules call to compute the canonical integrity seal. The discovery Spec scripts are plain PowerShell, and three modules are imported from the repository root: SQL Server migration, identity assessment and plan generators. Live Azure and Graph operations need the Arc agent's command-line tool and the Azure CLI, and run only behind an explicit opt-in switch.

Step two, the evidence model. Every derivation and validation function emits a provenance-sealed envelope: the schema and artifact type, the records and summary counts, and provenance with the module, version, a UTC timestamp and a content hash. The seal leaves out the timestamp, so identical inputs give an identical hash. Artifacts are reproducible, and a broken or unattributed envelope is a provenance-drift finding by definition. Write each step's envelope to a dated folder under version control; that's what makes Runbook R09's runs comparable.

Step three, the safety model. Read-only and derivation functions run directly. State-changing functions either plan by default and execute only with an execute switch and confirmation, or generate a script and execute nothing; the login and group script generators have no server parameter at all. No secrets are embedded. A GCC-Moderate tenant is an Entra tenant in the commercial cloud, so its Arc resources use the AzureCloud name.

Step four, offline snapshots: every function accepts captured input, so the chain can be tested without touching a live estate. The run order is on the right, and nothing touches production until R02 has defined the retain and target set.

Workbook: Book 06, Runbook R01 — Prerequisites and Using This Companion.`,
});

runbook(MODS[3], {
  title: "R02 — Estate discovery and the consolidation gate",
  badgeText: "Read-only", badgeColor: RO,
  lead: "Phase 0: count everything first, decide what survives second.",
  steps: [
    ["Seed the inventory", "D1.8 audit in discovery-only form (MSSQLSvc SPNs, -TargetServers, services over CIM; version reads Unknown) and the D1.5 SPN trail (duplicates; orphans on disabled objects or with no logon in 180 days)."],
    ["Cast wider", "Find-DbaInstance with DomainServer, DataSourceEnumeration or IPRange; a forest-wide setspn -T * -F -Q; Azure Migrate or the Arc migration assessment."],
    ["Fuse: New-FMPEstateInventory", "Dedupes on host and instance, records discovered_by, applies a first pass: last access ≥ 400 days → retire; pre-2022 → consolidate; 2022+ → retain; too little signal → review."],
    ["Apply the lenses", "Index-usage counters reset at engine start: read sqlserver_start_time and take long-horizon evidence from audit, backups and the portfolio. Map sys.servers, sys.linked_logins, Agent, replication, SSIS."],
    ["Decide", "Architects confirm or override each verdict, with the reason recorded."],
  ],
  boxes: [
    Object.assign({ head: "GATE", items: ["Only retain instances and consolidation targets enter R03–R10", "Review never defaults to retain"] }, GATE),
    Object.assign({ head: "EVIDENCE", items: ["Sealed inventory envelope: classification counts and the denominator"] }, EVID),
    Object.assign({ head: "SAFETY", items: ["Sweeps generate probe traffic: schedule them with security operations", "Executing the consolidation is review-required"] }, RISK),
  ],
  src: "Sources: Microsoft Learn — setspn; Azure Migrate; Azure Data Studio and Arc migration assessment; DMA; sys.dm_db_index_usage_stats; sys.linked_logins. dbatools. Book 06, Runbook R02.",
  body:
`Runbook R02 is Phase 0: count everything first, decide what survives second. Discovery is read-only; the consolidation it leads to is review-required and belongs to the migration plan.

The inventory starts from the program's scripts. The D1.8 audit script, run in discovery-only form, finds instances from their SQL Server SPNs and an explicit target list and reads each host's services over CIM; without a connection, version and authentication mode read Unknown. The D1.5 SPN inventory gives the domain's SPN trail, with duplicates and orphans: SPNs on disabled objects, or on objects with no logon in 180 days. Those scripts miss what has no SPN, like an Express instance an installer dropped on an application server, so cast wider with Find-DbaInstance, a forest-wide SetSPN query, and Azure Migrate or the Arc migration assessment.

Then the program's estate-inventory function fuses the sources. It keys every instance on host and instance name, so duplicates collapse, records which instruments found each one, and applies a first pass on two signals: last access at or above 400 days means retire, a pre-2022 engine means consolidate, and 2022 or later means retain. Anything without enough signal lands in review, never silently in retain.

The lenses come next, with one caution. The index-usage DMV resets whenever the engine starts, so it can't prove 400 days of disuse unless the instance has run that long. Read the start time beside it, and take long-horizon evidence from login auditing, backup history and the application portfolio. For dependencies, read sys.servers and the linked logins, plus the Agent, replication and SSIS footprint.

Finally the architects confirm or override each verdict, with the reason recorded. The evidence is the sealed inventory, with its classification counts and its denominator. And schedule network sweeps with security operations, because intrusion detection can flag them.

Workbook: Book 06, Runbook R02 — Estate Discovery and the Consolidation Gate.`,
});

runbook(MODS[3], {
  title: "R03 — The authentication audit",
  badgeText: "Read-only", badgeColor: RO,
  lead: "The audit changes nothing, so run it first and run it often.",
  steps: [
    ["Prerequisites", "ActiveDirectory module (RSAT), remote CIM, and SQL permissions only for -QueryInstances. An under-privileged account returns a partial login list without error: confirm the count on a known instance."],
    ["Three passes", "Discovery only (no SQL connection) → add -TargetServers for hosts without an SPN → deep audit with -QueryInstances -TestConnectivity."],
    ["Read the verdict", "Version 16+: “Enable Entra ID auth via Azure Arc.” 2019 and earlier: “Upgrade to SQL 2022 + Arc.” EntraIDBlockers: mixed mode, enabled sa, orphaned logins, linked servers. Failover cluster instances aren't detected: flag them as Category 3."],
    ["Work around two defects", "-D5InputFile doesn't match D1.5's output and suppresses the live query: omit it. The -D1InputFile producer isn't published yet."],
    ["Run order", "D1.5 and D1.7, then D1.8, then D1.12 for owners and waves."],
  ],
  boxes: [
    Object.assign({ head: "GATE", items: ["Login count verified against a known instance", "Clustered instances flagged from the cluster inventory"] }, GATE),
    Object.assign({ head: "EVIDENCE", items: ["JSON with Metadata, Summary, InstanceAudits[]; _instances.csv; _logins.csv", "Kept under version control; it feeds R09"] }, EVID),
    Object.assign({ head: "FAILURE MODES", items: ["Query Failed and Timeout are recorded, not fatal", "No AD module: only -TargetServers hosts are audited"] }, NOTE),
  ],
  src: "Sources: Microsoft Learn — sys.linked_logins (metadata visibility); Entra authentication for SQL Server; KDC_ERR_PRINCIPAL_NOT_UNIQUE. Book 06, Runbook R03.",
  body:
`Runbook R03 is the audit script itself. It changes nothing, so run it first and run it often.

The prerequisites are the ActiveDirectory module for the live SPN query and the orphaned-login check, remote CIM to each host, and SQL Server permissions only for the deep audit, which connects with Windows integrated authentication. Watch one trap. Catalog views show only what the caller has permission on, so an under-privileged audit account returns a partial login list with no error. Grant the narrowest read that sees every login, and confirm the count against a known instance.

There are three passes, in order: discovery only, which opens no SQL connection; then adding target servers for hosts without an SPN; then the deep audit with query instances and test connectivity.

The output is a JSON file per run, an instances CSV and a logins CSV, and the script computes the readiness verdict. Major version sixteen and later gets "enable Entra ID auth via Azure Arc". 2019 and earlier gets "upgrade to 2022 plus Arc", which is Category 3. The blockers it flags are mixed mode, an enabled SA, orphaned logins and linked servers. It doesn't detect failover cluster instances, so flag those from the cluster inventory and treat them as Category 3.

Two input defects to work around. The SPN-inventory input file doesn't match what D1.5 writes, so passing it yields no instances and suppresses the live query; run without it. And the service-account input expects a script that isn't published yet. The run order for SQL Server is D1.5 and D1.7, then D1.8, then the owner matrix.

The script degrades rather than crashing: a failed connection is recorded as Query Failed, a slow port as Timeout. Keep every run under version control, because the audit JSON is the raw input to continuous monitoring in Runbook R09.

Workbook: Book 06, Runbook R03 — The Authentication Audit.`,
});

runbook(MODS[3], {
  title: "R04 — Arc deployment and the managed identity",
  badgeText: "Review-required", badgeColor: RR,
  lead: "No Arc, no machine identity; no machine identity, no Entra login.",
  steps: [
    ["Prerequisites", "A commercial subscription in the same tenant, --cloud AzureCloud: Entra authentication isn't offered in US Gov Virginia. Not an FCI; NT AUTHORITY\\SYSTEM can connect; a trusted TLS certificate. Outbound 443 for agent and extension; the engine reaches Entra ID directly (WinHTTP proxy)."],
    ["Enroll the host", "A certificate-based onboarding service principal with the Connected Machine Onboarding role. The SQL extension installs automatically unless tagged ArcSQLServerExtensionDeployment = Disabled."],
    ["Validate the token", "Local endpoint localhost:40342, a two-call challenge. aud = https://database.windows.net/, exp in the future, oid = the machine's principalId. Never log the token."],
    ["Extension, then Entra", "WindowsAgent.SqlServer shows Succeeded. 2025: primary managed identity, three Graph permissions on the identity. 2022: app registration, Key Vault certificate, Set Admin. Pilot first."],
  ],
  boxes: [
    Object.assign({ head: "GATE", items: ["azcmagent show: Connected, expected subscription", "Token aud, exp and oid checked", "Extension Succeeded; Entra admin set; encrypted test login"] }, GATE),
    Object.assign({ head: "ROLLBACK", items: ["Remove extensions → disconnect → uninstall", "Reconnect = new identity: re-grant Graph, Key Vault", "2025: treat Entra authentication as one-way"] }, RISK),
    Object.assign({ head: "FIX BEFORE EXECUTING", size: 11.5, items: ["Invoke-FMPArcOnboarding: no --proxy-url flag; no service-principal parameters", "Token check: use -TokenSnapshotPath, not -Live"] }, NOTE),
  ],
  src: "Sources: Microsoft Learn — Arc managed identity; Entra authentication setup (2022, 2025); Arc in US Government; Arc SQL prerequisites; azcmagent connect and disconnect. Book 06, Runbook R04.",
  body:
`Runbook R04 gives the host its cloud identity. Connecting a server to Arc creates a system-assigned managed identity with no secret anyone manages, and without it there's no Entra login. SQL Server 2025 uses that identity directly as its primary managed identity. SQL Server 2022 authenticates with an app registration and a certificate in Key Vault, and the machine identity is what downloads the certificate.

The prerequisites carry the traps. A GCC-Moderate tenant's Entra ID is in the commercial cloud, so the Arc resources live in a commercial subscription in the same tenant, and Entra authentication isn't available for SQL Server on Arc in US Government Virginia. The instance can't be a failover cluster instance, NT AUTHORITY SYSTEM must be able to connect or the extension can't provision, and clients must trust the TLS certificate. The agent and extension need outbound 443, and the engine contacts Entra ID directly, without the agent's proxy. That's the one to miss: the agent shows Connected while Entra logins fail.

Then four steps. Enroll with a certificate-based onboarding service principal; the SQL extension installs automatically unless a tag disables it. Validate the token from the local identity endpoint, a two-call challenge: the audience must be database.windows.net, the expiry in the future, and the object ID the machine's principal ID. Never log the token. Confirm the extension shows Succeeded. Then turn on Entra authentication, on a pilot first; a Privileged Role Administrator grants the Graph permissions, and setting the Entra admin creates the first sysadmin login.

Two program functions need correcting before you execute with them: the onboarding wrapper adds a proxy flag the agent doesn't have and falls back to interactive sign-in, and the token validator's live mode queries the Azure VM address.

Rollback runs in order: remove extensions, disconnect, uninstall. Reconnecting creates a new identity, so permissions are granted again. On SQL Server 2025, treat Entra authentication as one-way.

Workbook: Book 06, Runbook R04 — Arc Deployment and the Managed Identity.`,
});

runbook(MODS[3], {
  title: "R05 — Login migration and the parallel run",
  badgeText: "Review-required", badgeColor: RR,
  lead: "Add the Entra login beside the Windows one, watch both for 30 days, disable rather than drop.",
  steps: [
    ["Generate, dry run", "New-FMPEntraLoginMapping maps only matched principals, prefers Entra groups, flags the rest; New-FMPEntraLoginScript writes idempotent CREATE LOGIN … FROM EXTERNAL PROVIDER, with no SQL connection."],
    ["Database users beside", "CREATE USER … FROM LOGIN with the same roles, permissions, schemas and ownership. Not ALTER USER … WITH LOGIN: that converts only on Azure SQL Managed Instance."],
    ["Parallel run, 30 days", "SQL Server Audit SUCCESSFUL_LOGIN_GROUP for the whole window. auth_scheme: local sessions always show NTLM, and the Entra value isn't documented, so confirm it on the pilot."],
    ["Cut over", "Disable the Windows logins, group logins included; disabling a sysadmin member needs CONTROL SERVER. Rollback: re-enable."],
    ["Close sa", "Confirm another sysadmin can sign in, then disable sa. On Arc, the Disable SQL authentication option closes mixed mode once SQL logins are migrated."],
  ],
  boxes: [
    Object.assign({ head: "PRECONDITIONS", items: ["SQL Server 2022+, Arc, validated token, Entra admin (R04)", "A consolidated estate (R02); the R03 logins.csv", "Clients trust the TLS certificate"] }, NOTE),
    Object.assign({ head: "GATE: EXIT CRITERIA", items: ["Every app and job seen on its Entra login", "No remote NTLM rows", "Nothing arriving only on the legacy login"] }, GATE),
    Object.assign({ head: "EVIDENCE", items: ["The 30-day audit file; Test-FMPLoginParallelRun's cutover_ready verdict (pre-filter local sessions)"] }, EVID),
  ],
  src: "Sources: Microsoft Learn — Entra authentication setup (logins and users); ALTER USER; sys.dm_exec_connections; Audit action groups; ALTER LOGIN; Arc release notes. Book 06, Runbook R05.",
  body:
`Runbook R05 adds the Entra login beside the Windows one, watches both for thirty days, and disables rather than drops. Every step that runs T-SQL against an instance is review-required.

Don't start until the instance is on SQL Server 2022 or later, Arc-connected with a validated token and an Entra admin set; until the estate is consolidated; until you have the R03 logins file; and until clients trust the certificate.

Step one generates the statements, dry run first. The mapping from each Windows login to an Entra principal is the one piece of real judgment. The program's mapping function builds it from the identity reconciliation, not a spreadsheet: it maps only cleanly matched principals, prefers an Entra group, and flags every unresolved login. The script generator then writes an idempotent CREATE LOGIN file, with unresolved entries as commented-out to-do lines, and never opens a connection.

Step two creates an Entra database user beside each Windows user, with CREATE USER FROM LOGIN and the same roles, permissions, schemas and ownership. Don't convert with ALTER USER WITH LOGIN; on SQL Server it can't change a user's type, and the exception applies only to Azure SQL Managed Instance.

Step three is the thirty-day parallel run. Capture successful logins for the whole window with SQL Server Audit, because a point-in-time query misses short connections. The exit criteria: every application and job also appears on its Entra login, no remote NTLM remains, and nothing arrives only on the legacy login. Two cautions: local connections always report NTLM, and Microsoft doesn't document what an Entra connection reports in the auth scheme column, so confirm it on the pilot, and pre-filter local sessions before the readiness check.

Step four cuts over by disabling, including any group logins a principal also arrives through, and rollback is re-enabling. And close an enabled SA here: confirm another sysadmin can sign in, then disable it.

Workbook: Book 06, Runbook R05 — Login Migration and Parallel-Run Validation.`,
});

// ================================================================== MODULE 5
divider(MODS[4], [
  "R06 NTLM detection and remediation",
  "R07 Groups, administrative units and the Conditional Access perimeter",
  "R08 The application chain and connection strings",
  "R09 Continuous monitoring and the closure record",
  "R10 Certificate discovery for AD CS",
], "Sources: Book 06, Runbooks R06–R10.",
`Module 5 covers the last five runbooks: NTLM detection and remediation; groups, administrative units and the Conditional Access perimeter; the application chain and connection strings; continuous monitoring and the closure record; and certificate discovery for AD CS. The pattern holds. Detection and inventory are read-only and script-backed, and every remediation, provisioning or configuration change is review-required, dry run first, through change control. By the end of this module the posture isn't just reached; it's provable on every scheduled run.

Workbook: Book 06, Runbooks R06 to R10.`);

runbook(MODS[4], {
  title: "R06 — NTLM detection and remediation",
  badgeText: "Audit first", badgeColor: RR,
  lead: "Most of the NTLM you find is a missing or misplaced name, not a protocol choice.",
  stepSize: 12,
  steps: [
    ["Map SPNs (D1.5)", "Every MSSQLSvc SPN, with duplicates and orphans. A missing SPN is the most common silent-NTLM cause, a duplicate the second; no SPN under a domain account usually means a failed startup registration."],
    ["Classify collisions (D1.7)", "Exact, case-insensitive, port-variant, cross-object-type, DNS alias. CRITICAL: two or more enabled holders, or a computer and a user object. Query AD live, not the D1.5 file."],
    ["Delegation (D1.4)", "Unconstrained, constrained and resource-based delegation, and NTLM-dependency indicators."],
    ["Repair SPNs", "setspn -S MSSQLSvc/<FQDN>:<port>; remove misplaced registrations with -D, leaving one enabled owner."],
    ["Linked servers", "Entra authentication → Kerberos constrained delegation → a mapped remote login, as a documented exception only."],
    ["Group Policy", "Level 5 refuses LM and NTLMv1; Restrict NTLM with server-name exceptions; the full block on 2027-04-01."],
  ],
  boxes: [
    Object.assign({ head: "GATE", items: ["D1.7 reports zero CRITICAL collisions", "From a remote client: klist shows an MSSQLSvc ticket and auth_scheme reads KERBEROS"] }, GATE),
    Object.assign({ head: "EVIDENCE", items: ["New-FMPSpnRemediationPlan: each action mutating, requires_review, with a command_preview", "Get-FMPNtlmGpoReport: unconfigured, below_target, phase_b_ntlmv2_only, phase_c_full_block"] }, EVID),
    Object.assign({ head: "ROLLBACK", items: ["setspn -D, or re-add with -S; restore the prior policy values"] }, RISK),
  ],
  src: "Sources: Microsoft Learn — Register an SPN; setspn; misplaced SPN; sp_addlinkedsrvlogin; linked servers with Entra; Policy CSP; status code 0x32; klist. Book 06, Runbook R06.",
  body:
`Runbook R06 is detect, then remediate, and most of what you find is a missing or misplaced name rather than a protocol choice.

Detection is three read-only audits. The D1.5 SPN inventory maps every SQL Server SPN. In the program's experience a missing one is the most common cause of silent NTLM and a duplicate the second, and an instance under a domain account with no SPN usually means registration failed at startup. The D1.7 collision report classifies five collision types and marks as critical any SPN held by two or more enabled accounts, or by both a computer and a user object. Run it against Active Directory directly, because its input-file handoff has the same defect as R03's. And D1.4 finds delegation settings and NTLM-dependency indicators.

Remediation changes production, and the program's SPN plan and GPO report enforce nothing; they emit reviewable plans. Register a missing SPN with SetSPN dash S, in the fully qualified form. Repair a collision by removing the SPN from the disabled or wrong account, leaving exactly one enabled owner. For linked-server passthrough, the order of preference is Entra authentication on the linked server, then Kerberos with constrained delegation, then a mapped remote login only as a documented exception, because it brings back a stored password.

Then the Group Policy phases: level five refuses LM and version 1; the Restrict NTLM policies restrict version 2, with server-name exceptions at the domain controller and the client; and the full block comes on the program's April 2027 backstop. The GPO report classifies each policy's posture and never sets anything.

Verify with klist purge, reconnect and klist, and check that the auth scheme reads KERBEROS from a remote client. Rollback is SetSPN dash D and the prior policy values, and because the block is last, the Kerberos fixes are proven long before anything is refused.

Workbook: Book 06, Runbook R06 — NTLM Detection and Remediation.`,
});

runbook(MODS[4], {
  title: "R07 — Groups, admin units and the CA perimeter",
  badgeText: "Phase 2 review-required", badgeColor: RR,
  lead: "The group model survives; membership, administration and the outer boundary change.",
  stepSize: 12,
  steps: [
    ["Inventory", "Export-FMPEntraGroups (-IncludeDynamic for rules) and Export-FMPConditionalAccess. A policy's state doesn't show coverage: check its users and target resources. GCC keeps graph.microsoft.com."],
    ["Classify", "New-FMPEntraGroupClassification gives each group one type; a group with no usable signal lands in review."],
    ["The admin unit first", "Restricted management set at creation (it can't change later); Groups Administrator scoped to the unit, PIM-eligible, through a role-assignable group if assigned to one."],
    ["Groups and logins", "Create the groups inside, add them explicitly; New-FMPGroupLoginScript emits a login only where becomes_sql_login is true."],
    ["Know the costs", "Tenant admins can assign themselves over the unit (audited); members lose PIM, access reviews and entitlement management; 100 restricted units per tenant."],
  ],
  boxes: [
    Object.assign({ head: "FOUR GROUP TYPES", items: ["1 OU-derived → dynamic → login X", "2 Explicit role → assigned → login X", "3 Distribution list → M365 group, no login", "4 Mail-enabled security → split; access half only"] }, NOTE),
    Object.assign({ head: "GATE", items: ["Dynamic membership verified before binding", "Admin-unit scope denies outside groups", "Non-compliant device or location: no token"] }, GATE),
    Object.assign({ head: "PERIMETER", items: ["Azure SQL Database app; Arc coverage is a program assumption to confirm", "Users only; risk conditions need P2"] }, EVID),
  ],
  src: "Sources: Microsoft Learn — Get-MgGroup; Graph national clouds; group resource; restricted management AUs; AU role assignment; dynamic membership; CREATE LOGIN; Conditional access for Azure SQL. Book 06, Runbook R07.",
  body:
`Runbook R07 moves the access-control layer. The group model survives; what changes is who maintains membership, who may administer it, and the boundary every sign-in has to cross.

Phase 1 is read-only. The program's group export reads Entra groups through Microsoft Graph or replays a snapshot, and the dynamic switch captures membership rules. A GCC tenant keeps the worldwide Graph endpoint. The Conditional Access export confirms the perimeter, but a policy's state only says on, off or report-only; whether it covers SQL Server sign-ins depends on its users and target resources.

The classification function gives every group one of four types. Type 1, OU-derived, becomes a dynamic security group and a group login. Type 2, explicit role assignment, becomes an assigned group and a group login. Type 3, a distribution list, becomes a Microsoft 365 group with no SQL Server login at all. Type 4, mail-enabled security, splits into a mail group and an access group, and only the access half gets a login. Group logins are type X, not type E.

Phase 2 is review-required, and its order is fixed. First the DBA administrative unit, with restricted management turned on at creation, because it can't be changed later. Second, Groups Administrator scoped to that unit for the DBA lead, eligible through PIM rather than standing. Third, the groups inside it, added explicitly, with logins generated by the group-login script, which can never turn a distribution list into a login. Know the costs: tenant administrators can still assign themselves over the unit, though it's audited; its members can't be covered by PIM, access reviews or entitlement management; and a tenant gets at most 100 such units.

The dividend: once every login is an Entra principal, Conditional Access is the perimeter for human access. Microsoft documents targeting the Azure SQL Database application; that it governs Arc-enabled SQL Server is the program's working assumption, to confirm in the pilot. It reaches users only, and risk conditions need P2.

Workbook: Book 06, Runbook R07 — Groups, Administrative Units and the Conditional Access Perimeter.`,
});

runbook(MODS[4], {
  title: "R08 — Application chain and connection strings",
  badgeText: "Review-required", badgeColor: RR,
  lead: "Entra sign-in for users plus a stored password to the database leaves the back door open.",
  stepSize: 12,
  steps: [
    ["Inventory LDAP binds (D1.9)", "Event 4624 logon type 8; Directory Service events 2887 and 2889. 2889 needs LDAP Interface Events raised to 2 and isn't retroactive. -EventLogHours defaults to 168."],
    ["Correlate and classify", "New-FMPAppConnectionPlan joins D1.9 to the D1.8 audit and assigns OIDC, SAML, App Proxy or Domain Services from a capability map; no signal → review."],
    ["Change the connection string", "In configuration, never by script. Production: Authentication=Active Directory Managed Identity, or Service Principal with the secret in Key Vault. Default only for developer parity. Encryption turns on."],
    ["Arc host specifics", "The token comes from HIMDS at localhost:40342; the process must be in Hybrid agent extension applications. One identity per host: separate service principals where grants differ."],
    ["Audience and pooling", "Audience https://database.windows.net/, not the Azure Government one; pooled apps use AccessTokenCallback (SqlClient 5.2+)."],
  ],
  boxes: [
    Object.assign({ head: "GATE: THREE CONDITIONS", items: ["The Entra login exists (R05 or R07)", "The identity holds the database role", "Tested on a production-equivalent Arc stack with a trusted certificate"] }, GATE),
    Object.assign({ head: "EVIDENCE", items: ["Sessions log in on the Entra login; no NTLM or KERBEROS rows remain"] }, EVID),
    Object.assign({ head: "ROLLBACK", items: ["The prior connection string; the legacy login disabled, not dropped"] }, RISK),
  ],
  src: "Sources: Microsoft Learn — logon types; LDAP signing events; Microsoft.Data.SqlClient Entra modes; Arc managed identity; DefaultAzureCredential; Entra authentication for SQL Server. Book 06, Runbook R08.",
  body:
`Runbook R08 is the last mile. An application that signs users in with Entra ID but reaches the database with a stored password has moved its front door and left the back door where it was.

Phase 1 inventories the LDAP-bind dependency with the read-only D1.9 script. It combines account heuristics with domain controller evidence: event 4624 with logon type 8, a clear-text bind, and events 2887 and 2889 in the Directory Service log. Event 2889 names each client, but only after the LDAP interface diagnostic setting is raised to two, and nothing is logged retroactively, so start the window after the change and set it back afterward. D1.9 doesn't say which instance an application uses, so the program's connection-plan function joins it to the D1.8 audit, assigns each application a class from observable signals, and emits the connection-string change.

Phase 2 is the simplest change and the most gated, and it's made in application configuration, never by a script. In production, name a specific mode, such as Active Directory Managed Identity. The Default mode tries credential providers in sequence, which slows the first connection and can switch identity when the host changes. Service principal mode takes its secret from protected configuration, never from source. Setting the mode turns on encryption, so the server certificate must be trusted. On an Arc host the driver gets the machine's token from the local metadata service, and the process must be in the hybrid agent extension applications group. Every application on that host is then the same principal, so give each its own service principal where grants differ.

Three gates before cutover: the Entra login exists, the identity holds the right database role, and the change was tested on a production-equivalent Arc stack. The audience is database.windows.net, not the Azure Government one, and pooled applications use the access-token callback. Rollback is the prior connection string, with the legacy login disabled, not dropped.

Workbook: Book 06, Runbook R08 — The Application Chain and Connection-String Migration.`,
});

runbook(MODS[4], {
  title: "R09 — Continuous monitoring and closure",
  badgeText: "Read-only", badgeColor: RO,
  lead: "Closure isn't a day on the calendar; it's a record that keeps coming back clean.",
  stepSize: 12,
  steps: [
    ["Schedule the deep audit", "D1.8 -QueryInstances on the retain and target estate; every run's JSON under version control."],
    ["Project the closure record", "New-FMPClosureRecord: LoginMode 1; zero active S outside exceptions; zero active U and G; E and X reconciled; sa disabled and renamed; Arc connected; Entra configured; MFA as an external join. Verdict closed, closed_excepted or open, with failing_fields."],
    ["Diff runs for drift", "Compare-FMPClosureRun: mixed_mode_enabled, new_sql_auth_login, new_windows_login, arc_agent_offline are violations; instance_appeared may be a discovery gap. It reads the running mode: add a registry check for earlier warning."],
    ["Behavioral layer", "Defender for SQL alerts; Entra sign-in logs, four types; auth_scheme, logon events, SQL Server Audit. Any NTLM or Kerberos connection is an immediate alert."],
  ],
  boxes: [
    Object.assign({ head: "SIX EVIDENCE SETS", items: ["Closure records", "Entra sign-in logs", "Protocol telemetry", "sa-disabled report", "Conditional Access MFA report", "Exception registry"] }, EVID),
    Object.assign({ head: "GATE", items: ["All six satisfied together, across the validation period"] }, GATE),
    Object.assign({ head: "2027-04-01", items: ["The program's Phase C block, not an external deadline; the final months are validation"] }, NOTE),
  ],
  src: "Sources: Microsoft Learn — Change server authentication mode; sys.server_principals; Arc managed identity; Disable SQL authentication; Defender for SQL; sign-in logs; ESU FAQ. Book 06, Runbook R09.",
  body:
`Runbook R09 keeps proving the posture. Closure isn't a day on the calendar; it's a record that keeps coming back clean, and everything here is read-only.

Step one runs the D1.8 deep audit on a schedule against the retain and target estate, keeping every run's JSON under version control. It's the same script as R03, on a different cadence.

Step two projects each run onto the per-instance closure record. The fields are Windows Authentication mode, which proves only that SQL logins are refused; zero active SQL logins outside the exception registry; zero active user and group logins; every Entra login reconciled to a known principal; SA disabled and renamed; the Arc agent connected; Entra authentication configured, through the managed identity on 2025 or an app registration on 2022; and MFA through Conditional Access, joined from the sign-in logs rather than copied. The program's closure-record function returns closed, closed-excepted or open, with the failing fields.

Step three turns the difference between two runs into drift events: mixed mode enabled, a new SQL login, a new Windows login or the Arc agent offline, each a violation, plus instances that appear or disappear, which may be a discovery gap. One caution: the audit reads the running mode, so a registry change is invisible until the service restarts. Add a registry check if earlier warning matters.

Step four is the behavioral layer, three sources with distinct jobs. Defender for SQL raises threat alerts but isn't an authentication log. Entra sign-in logs record each token issued, and a token can be reused across connections. The instance and host record the protocol itself, and any NTLM or Kerberos connection is an immediate alert.

The transformation is closed when six evidence sets hold together across the validation period: closure records, sign-in logs, protocol telemetry, the SA report, the MFA report and the exception registry. Then April 1, 2027 arrives as a non-event.

Workbook: Book 06, Runbook R09 — Continuous Monitoring and the Closure Record.`,
});

runbook(MODS[4], {
  title: "R10 — Certificate discovery for AD CS",
  badgeText: "Read-only · analytical", badgeColor: RO,
  lead: "Find out what the CA still signs before anyone sets a date to switch it off.",
  stepSize: 12,
  steps: [
    ["Run the D1.10 audit", "PKI inventory, machine and user certificates, smart-card-required accounts (0x40000), LDAPS and other services, with the issuing CA on every certificate."],
    ["Read inside the engine", "sys.certificates joined on sid, with issuer_name. An empty registry value isn't “no certificate”: SQL Server picks one from the machine store or generates its own, so check the startup log. Endpoints: connection_auth_desc showing NTLM is an R06 finding."],
    ["Map three dependencies", "New-FMPSqlCertificatePlan: tls_server_cert, certificate_mapped_login, cba_posture."],
    ["Order the CA migration", "New-FMPPKIMigrationPlan: roots before issuing CAs; cycles and cross-domain dependencies are blockers."],
  ],
  boxes: [
    Object.assign({ head: "THREE DEPENDENCIES", items: ["TLS engine certificate: re-issue and distribute the new root before expiry", "Certificate-mapped logins and endpoints: code signing only; most are self-signed", "Certificate-based sign-in: a replacement CA issuing before AD CS retires"] }, NOTE),
    Object.assign({ head: "THE FINDING", items: ["Does the AD CS decommission run earlier than the replacement CA? No program decision exists yet"] }, RISK),
    Object.assign({ head: "FOR THE DECISION", items: ["Cloud PKI issues to Intune-managed devices; Intune doesn't support Windows Server"] }, GATE),
  ],
  src: "Sources: Microsoft Learn — LDAPS certificates; UserAccountControl flags; sys.certificates; SQL Server encryption; certificate requirements; CREATE LOGIN; CREATE CERTIFICATE; Cloud PKI. Book 06, Runbook R10.",
  body:
`Runbook R10 is discovery and analysis, not provisioning. Before anyone sets a date to switch off the certificate authority, someone has to find out what it still signs. The program has no decision yet on the move from AD CS to a cloud PKI, so this runbook produces the evidence that decision will need.

Step one runs the read-only D1.10 certificate audit across Active Directory: the PKI inventory, machine and user certificates, smart-card-required accounts, and service dependencies, including LDAP over TLS on domain controllers. It records the issuing CA on every certificate, which is exactly the signal for what depends on AD CS. It doesn't reach into an instance, so three in-engine reads supplement it. Join certificates to their logins on the SID, not the principal ID, and read the issuer name. An empty certificate setting doesn't mean no certificate, because SQL Server picks one from the machine store or generates its own; check the error log at startup. And check mirroring and availability-group endpoints; one reporting NTLM is also an R06 finding.

Step two maps the results to three dependencies. The engine's TLS certificate: every Entra connection requires encryption, so if the CA is gone when the certificate expires, encryption becomes what breaks the connection. Certificate-mapped logins and endpoints carry less risk than the source claimed, because certificate logins are used only for code signing and can't connect, and most are self-signed. And certificate-based sign-in, the interim posture for the NTLM long tail, needs a replacement CA issuing before AD CS retires.

Step three orders the CA migration, roots before issuing CAs, with cycles and cross-domain dependencies flagged as blockers. One fact for the decision: Microsoft Cloud PKI issues to Intune-managed devices, and Intune doesn't support Windows Server, so SQL Server hosts would need another enrollment path.

The finding is one question: does the AD CS decommission run earlier than its replacement? If it does, the interim posture is lost exactly when it's needed.

Workbook: Book 06, Runbook R10 — Certificate Discovery for SQL Server's AD CS Dependencies.`,
});

// ------------------------------------------------------------------ Close
{
  const m = MODS[4];
  const s = D.content(secName(m), "What to take back to the estate");
  modTag(s, m);
  const take = [
    ["FaFilter", "Count before you migrate", "The inventory and the gate decide where every hour of authentication work goes", HEX.navy, HEX.navyTint],
    ["FaChartLine", "Measure, don't assume", "A missing SPN turns Kerberos into NTLM silently; auth_scheme, Windows logs and SQL Server Audit show it", HEX.teal, HEX.tealTint],
    ["FaArrowsRotate", "Keep it reversible", "Create, validate, disable, observe 30 days, drop; a disabled login is an instant rollback", HEX.amber, HEX.amberTint],
    ["FaCubes", "Finish the chain", "No instance is closed while an application reaches it with Integrated Security or a stored password", HEX.red, HEX.redTint],
  ];
  take.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.5 + row * 1.62;
    box(s, `Take ${i + 1}`, x, y, 6.0, 1.5, a[4]);
    icon(s, a[0], x + 0.22, y + 0.38, 0.72, a[3]);
    T(s, `Take ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 17, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 13.5 } }],
      { x: x + 1.15, y: y + 0.1, w: 4.7, h: 1.3, fontSize: 13.5, valign: "middle" });
  });
  callout(s, "Prove", 4.85, 1.65, "FaClipboardCheck", HEX.navy, "Prove it continuously: ",
    "the closure record, drift detection and six evidence sets make “done” a queryable posture, and the certificate layer needs its own decision before AD CS goes. Read Book 06 for the chapters and the ten runbooks, every claim footnoted.");
  sources(s, "Sources: Book 06, Chapters 06, 11, 14, 18 and 20; Runbooks R05, R09 and R10.");
  notes(s,
`To close, five things to take back to the estate.

First, count before you migrate. The inventory and the retain, consolidate or retire gate decide where every hour of authentication work goes; migrating an instance you should have retired is waste against a fixed date.

Second, measure, don't assume. A missing SPN turns Kerberos into NTLM silently, and only the auth scheme column, the Windows logs and SQL Server Audit show it.

Third, keep it reversible. Create, validate, disable, observe for thirty days, then drop. A disabled login is an instant rollback.

Fourth, finish the chain. An instance isn't closed while any application still reaches it with Integrated Security or a stored password, or while a Class 4 application holds it on Windows Authentication.

Fifth, prove it continuously. The closure record, drift detection and the six evidence sets make done a queryable posture rather than a claim, and the certificate layer underneath needs its own decision before AD CS goes away.

April 1, 2027 is the program's backstop. If the work is finished well before it and the evidence has been clean for months, the block arrives as a non-event. Book 06 has the narrative chapters and the ten runbooks, with every external claim footnoted. Thank you.

Workbook: Book 06, Chapters 06, 11, 14, 18 and 20; Runbooks R05, R09 and R10.`);
}

// ================================================================== Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = D.content("Backup", "Sources behind Part 1 — Strategy");
  T(s, "Source list 1", B([
    "Microsoft Learn: Choose an authentication mode; Change server authentication mode; Register a Service Principal Name for Kerberos connections; SSPI architecture; Microsoft NTLM; Service accounts; Configure Windows service accounts.",
    "Microsoft Learn: Deprecated features for Windows client (NTLM); Features removed from Windows Server; How to enable NTLM 2 authentication; Policy CSP LocalPoliciesSecurityOptions and NTLM; NTLM auditing enhancements; KB5066470; Windows message center; status code 0x32.",
    "Microsoft Learn: Windows Server 2016, SQL Server 2014/2016/2017 lifecycle; SQL Server ESU FAQ; SQL Server end of support options; Upgrade SQL Server; Supported upgrades to SQL Server 2025.",
    "Microsoft Learn: SQL Server Browser service; setspn; Azure Migrate discovery and dependency analysis; Data Migration Assistant retirement; SSMS migration component; sys.linked_logins. dbatools: Find-DbaInstance.",
    "Microsoft Learn: Microsoft Entra authentication for SQL Server; CREATE LOGIN; sys.server_principals; SQL Server enabled by Azure Arc and its prerequisites; Arc managed identity; Disable SQL authentication; Conditional Access; Conditional access for Azure SQL; dynamic membership; Entra ID Protection.",
    "Microsoft Learn: Cannot generate SSPI context; KDC_ERR_PRINCIPAL_NOT_UNIQUE; Consistent authentication issues; MSSQLSERVER_18456; Kerberos constrained delegation; Credential Guard; Entra Kerberos; linked servers with Entra authentication; application proxy; SAML vs OIDC; Entra Domain Services; Microsoft.Data.SqlClient.",
    "OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles, January 26, 2022  ·  NIST SP 800-53 Rev. 5.",
  ], 11.5), { x: 0.6, y: 1.5, w: 12.15, h: 5.05, fontSize: 11.5, paraSpaceAfter: 5 });
}
{
  const s = D.content("Backup", "Sources behind Part 2 — The runbooks");
  T(s, "Source list 2", B([
    "R01: Microsoft Learn, azcmagent connect and azcmagent show; Planning identity for Azure Government applications.",
    "R02–R03: setspn; Azure Migrate; What's happening with Azure Data Studio; Data Migration Assistant; sys.dm_db_index_usage_stats; sys.linked_logins; Entra authentication for SQL Server; KDC errors. dbatools.",
    "R04: Arc managed identity and Entra authentication setup for SQL Server 2022 and 2025; Arc in US Government; Arc SQL prerequisites; Connect hybrid machines at scale; automatic connection; azcmagent connect and disconnect; uninstall the agent.",
    "R05: Entra authentication setup (logins and users); ALTER USER; sys.dm_exec_connections; determine the authentication type; SQL Server Audit action groups; CREATE SERVER AUDIT; ALTER LOGIN; Arc release notes.",
    "R06–R07: Register an SPN; setspn; misplaced SPN; sp_addlinkedsrvlogin; SPN support in client connections; gMSA Kerberos failures; Policy CSP; klist; Get-MgGroup; Graph national clouds; restricted management administrative units; dynamic membership.",
    "R08–R09: logon types; IdentityLogonEvents; LDAP signing; Microsoft.Data.SqlClient; credential chains; Arc identity and authorization; Defender for SQL servers on machines; sign-in logs; Ending Support in 2027.",
    "R10: LDAPS certificates; UserAccountControl flags; certificateUserIds; sys.certificates; encrypt connections; certificate requirements; CREATE LOGIN; CREATE CERTIFICATE; mirroring endpoints; NIST SP 800-53B; Microsoft Cloud PKI.",
    "Full footnotes with links and access dates: Book 06, every chapter and runbook (whalermike.github.io/modernization-workbook/docs/books/b06-data-platform/).",
  ], 11.5), { x: 0.6, y: 1.5, w: 12.15, h: 5.05, fontSize: 11.5, paraSpaceAfter: 5 });
}

console.log(`narrated words: ${words} (~${(words / WPM).toFixed(1)} min at ${WPM} wpm); per slide: ${per.join(" ")}`);
if (WARN.length) console.log("fit warnings:\n  " + WARN.join("\n  "));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
