// Book 10 — Cloud Boundary & Landing Zone: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — The boundary and what it removes:  Module 1 (Ch01 + Ch02 + Ch03, why the boundary decides and FedRAMP 2026),
//                                                Module 2 (Ch04 + Ch09 + Ch10, GCC, the gap and the three responses).
//   Part 2 — Building it and owning it:          Module 3 (Ch05 + Ch06 + Ch07, landing zone, address plan, front door),
//                                                Module 4 (Ch08 + Ch11 + Appendix A, owners and the authorization package).
// Build:  node presentations/b10-cloud-boundary-technical/build.js presentations/b10-cloud-boundary-technical/B10_Cloud_Boundary_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b10-cloud-boundary/; the notes name the chapter.
// Program recommendations are labeled "design guidance" and readings between sources "inference", as the book does;
// Marketplace and documentation status is "as of" the book's read date (October 21, 2026).
// The Bicep, policy and configuration samples stay in the chapters, which mark them as illustrative.
// Narration: narration.json (spoken text, keyed by slide title) is read by presentations/_build/narrate.py (editor runs that).
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 10", title: "Cloud Boundary & Landing Zone — Technical Deep Dive" });
const { pres, HEX, txt, box, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B10_Cloud_Boundary_Technical.pptx";

// ------------------------------------------------------------------ helpers
// Speaker notes with an automatic timing cue (live delivery runs ~142 words a minute).
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

// Titles: at most 58 characters and unique across the deck (narrate.py keys narration on them).
const titles = new Set();
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  if (titles.has(t)) throw new Error(`duplicate slide title: ${t}`);
  titles.add(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };
// The short Sources line on every content slide: at most 185 characters.
const sources = (s, text) => {
  if (text.length > 185) throw new Error(`sources line over 185 characters (${text.length}): ${text}`);
  return D.sources(s, text);
};

// Rough fit check so tables and lists don't overflow (Calibri averages ~0.5 em per character).
const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// The kit's full-width callout, with a fit check (16.5 pt text in a 10.65-inch frame).
const callout = (s, name, y, h, iconName, color, label, text) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * 16.5 / 72) / 10.45) * 16.5 / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  warn(`${name} callout`, y + h);
  return D.callout(s, name, y, h, iconName, color, label, text);
};

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
  if (o.limit && bottom > o.limit + 0.01) console.warn(`  ! ${name} table runs into the shape below: bottom ${bottom.toFixed(2)}, limit ${o.limit.toFixed(2)}`);
  if (process.env.FIT) console.log(`  table ${name}: bottom ${bottom.toFixed(2)} in`);
  return bottom;
};

// A tinted panel with a small caps label, a heading and bullets.
// h = null sizes the panel to its content; the function returns the panel's bottom edge.
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13.5) => {
  if (h == null) h = panelNeed(w, label, heading, items, pt);
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 16, fontFace: "Cambria", breakLine: true } });
  txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.75 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08;
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (need > y + h + 0.02) console.warn(`  ! ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  if (y + h > LIMIT + 0.01) console.warn(`  ! ${name} panel runs into the Sources line: bottom ${(y + h).toFixed(2)}`);
  if (need < y + h - 0.7) console.warn(`  ! ${name} panel is much taller than its text: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  return y + h;
};

// Heights a panel or note box needs for its content, so each can be sized to fit rather than to fill.
const panelNeed = (w, label, heading, items, pt = 13.5) =>
  0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08 + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0) + 0.12;
const noteNeed = (w, text, pt = 12.5) => 0.1 + 11 / 72 * 1.2 + 0.04 + lines(text, w - 0.4, pt) * pt / 72 * 1.2 + 0.14;

// A tinted note box: a small caps label and one paragraph.
// h = null sizes the box to its text; the function returns the box's bottom edge.
const noteBox = (s, name, x, y, w, h, color, tint, label, text, pt = 12.5) => {
  if (h == null) h = noteNeed(w, text, pt);
  box(s, name, x, y, w, h, tint, color);
  txt(s, `${name} text`, [
    { text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } },
    { text, options: { fontSize: pt, color: HEX.ink } },
  ], { x: x + 0.2, y: y + 0.1, w: w - 0.4, h: h - 0.18, paraSpaceAfter: 2 });
  const need = 0.1 + 11 / 72 * 1.2 + 0.04 + lines(text, w - 0.4, pt) * pt / 72 * 1.2 + 0.08;
  if (need > h + 0.02) console.warn(`  ! ${name} note may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (need < h - 0.6) console.warn(`  ! ${name} note is much taller than its text: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  warn(`${name} note`, y + h);
  return y + h;
};

// Tinted fact boxes in a row: [label, color, tint, text].
const facts = (s, name, top, h, items, pt = 12) => {
  const gap = 0.15, w = (12.15 - gap * (items.length - 1)) / items.length;
  items.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${name} ${i + 1}`, x, top, w, h, f[2]);
    txt(s, `${name} ${i + 1} text`, [
      { text: f[0], options: { bold: true, color: f[1], fontSize: 14, fontFace: "Cambria", breakLine: true } },
      { text: f[3], options: { fontSize: pt } },
    ], { x: x + 0.15, y: top + 0.08, w: w - 0.3, h: h - 0.14, valign: "middle" });
    const need = 0.3 + lines(f[3], w - 0.3, pt) * pt / 72 * 1.2;
    if (need > h - 0.1) console.warn(`  ! ${name} box ${i + 1} may overflow: needs ${need.toFixed(2)}, has ${(h - 0.1).toFixed(2)}`);
  });
  warn(`${name} facts`, top + h);
};

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

// A committed diagram placed inside a box, keeping the PNG's aspect ratio (read from its header).
// Alt text is the chapter's own fig-alt for that figure, read from the book so the two never diverge.
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b10-cloud-boundary", "png");
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b10-cloud-boundary");
const ALT = {};
fs.readdirSync(BOOK).filter((f) => f.endsWith(".md")).forEach((f) => {
  const t = fs.readFileSync(path.join(BOOK, f), "utf8");
  for (const m of t.matchAll(/svg\/([\w-]+)\.svg\)\{[^}]*?fig-alt="([^"]*)"/g)) ALT[m[1]] = m[2];
});
const img = (s, name, x, y, maxW, maxH) => {
  const file = path.join(DIAG, `${name}.png`);
  const alt = ALT[name];
  if (!alt) throw new Error(`no fig-alt found in the chapters for ${name}`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  if (y + h > LIMIT + 0.01) console.warn(`  ! ${name} image runs into the Sources line: bottom ${(y + h).toFixed(2)}`);
  return { w, h, bottom: y + h };
};

// Module divider: a Title-master slide with the module's contents and running time.
const divider = (sec, title, sub, items, mins) => {
  const s = titleSlide(sec, title, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 7.2, h: 1.6, paraSpaceAfter: 3 });
  return s;
};

const P1 = "Part 1 — The boundary and what it removes";
const P2 = "Part 2 — Building it and owning it";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "Cloud Boundary & Landing Zone: the technical deep dive", "Book 10 — Cloud Boundary & Landing Zone: checks, landing zone, owners and evidence");
  txt(s, "Session map", [
    { text: "Part 1 — The boundary and what it removes", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  Why the boundary decides   ·   Module 2  GCC, the gap and three responses", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Building it and owning it", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Landing zone and front door   ·   Module 4  Who owns it, and the package", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 10 of the Federal Modernization Workbook, Cloud Boundary and Landing Zone. It's for the cloud and platform engineers who build the landing zone, and for the ISSOs who have to evidence what it contains. The book asks one question: why does the authorization boundary, not the product catalog, decide what an agency can use?

It runs in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is the boundary and what it removes: the three checks that decide whether a feature is usable, why the gaps stay invisible, and what FedRAMP's Consolidated Rules for 2026 changed; then Microsoft 365 GCC and its published exclusions, and the three responses when a capability is outside. Part 2 is building it and owning it: the landing zone, the address plan, network as code and the front door; then who owns each boundary decision and how it lands in the authorization package.

The Marketplace and documentation facts were read on October 20 and 21, 2026, and the slides say "as of" wherever a status can change. Where something is the program's own recommendation, the slide says design guidance; where it's a reading between sources, it says inference. The Bicep, policy and configuration samples stay in the chapters, marked illustrative and untested against a production tenant.`,
  "Book 10, index; Chapters 01–11; Appendices A–B.");
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: the license is not the boundary");
  tag(s, "Why");
  const im = img(s, "ch01-what-decides", 0.6, 1.5, 5.0, 3.85);
  const pb = panel(s, "Late", 5.85, 1.5, 6.9, null, HEX.red, HEX.redTint, "WHERE THE BOUNDARY SHOWS UP: LATE", "Same license, different products", [
    "A commercial tenant sees per-location network scores, informed network routing and Adoption Score; a GCC tenant sees none of them",
    "Each exclusion sits on its own product page, often in one sentence; there is no single list",
    "Discovery comes during an authorization cycle or a Zero Trust analytics rollout",
    "No tenant setting turns on a feature the environment doesn't offer: the gap is structural",
  ], 14.5);
  callout(s, "Ask", Math.max(im.bottom, pb) + 0.2, 0.95, "FaClipboardCheck", HEX.amber, "No citation, no feature: ",
    "list every cloud feature a design depends on with its Marketplace package, its environment availability and the page that says so.");
  sources(s, "Sources: FedRAMP, Using a FedRAMP Certified Cloud Service (2026); Microsoft Learn — network connectivity, informed network routing, Adoption Score. Book 10, Ch 01.");
  notes(s,
`Why this matters. Two agencies can hold the same Microsoft 365 license and be entitled to different products. One runs a commercial tenant and sees per-location network assessment scores, informed network routing to its SD-WAN and an Adoption Score. The other runs a GCC tenant and sees none of those, because Microsoft documents each as unavailable there.

Three decisions, made by three parties, have to line up. FedRAMP certifies a specific cloud service offering at a certification class. The provider runs each government environment with a published set of exclusions, documented one feature at a time. And the agency authorizes its own system, which uses the service as an external service; its authorizing official accepts the risk of the configuration selected and the integrations enabled. The feature an agency can use is the overlap of all three.

The typical case, a framing pattern rather than an engagement, starts with a GCC tenant in production and a system security plan that references features whose live behavior doesn't match what was written. Zero Trust analytics, anomaly detection and insider-risk work are partly blocked by signals the tenant never receives. The discovery comes late, during an authorization cycle, because nothing fails loudly. And no setting fixes it: the problem is structural, which is why treating each missing feature as an isolated finding keeps reopening. The ask is simple. No citation means unverified, not available.`,
  "Book 10, Chapter 01 — Why the Boundary Decides What You Can Use, \"The catalog is not the boundary,\" \"Where the boundary shows up: late.\"");
}
endModule("Orientation");

// ================================================================== 3 Module 1 divider
{
  const s = divider(P1, "Module 1: Why the boundary decides", "Part 1 — The boundary and what it removes  ·  Chapters 01–03",
    ["Three checks with three owners; class and features are different axes", "Why the gap stays invisible, and four things that change across it", "FedRAMP 2026: classes, scope as data, change notices, trust centers"], 12);
  notes(s,
`Module 1: why the boundary decides, and what changed at FedRAMP. First the three checks and their owners, and why impact level and feature availability are different axes. Then why the gaps stay invisible, with the most-cited GCC example checked against Microsoft's own documentation, and the program's model of the four things that change across any boundary. Then FedRAMP's Consolidated Rules for 2026, read from the published ruleset rather than from what's said about it: certification classes, the four rule families tagged boundary, Minimum Assessment Scope, change notification and trust centers.`,
  "Book 10, Chapters 01–03.");
}

// ================================================================== 4 Three checks
{
  const s = content(P1, "Three checks, three owners, one overlap you can use");
  tag(s, "What");
  const b = table(s, "Checks", 1.5, [2.15, 2.5, 3.85, 3.65], ["Check", "Who owns it", "The record to read", "What it can't tell you"], [
    ["The certification", "FedRAMP certifies; the provider scopes", "Marketplace listing (package and class); the provider's audit-scope list", "Which features a government environment switches off"],
    ["The environment", "The provider", "Per-feature notes for GCC, GCC High and DoD", "Whether the agency authorized the integration"],
    ["The agency's authorization", "The authorizing official", "The agency's own SSP and package", "Anything outside the certified offering"],
  ], { fontSize: 13.5 });
  const edges = [
    "GCC customer support is \"not included in the service accreditation boundary\"",
    "Viva Engage on some GCC plans \"does not support FedRAMP accreditation\"",
    "Intune has no GCC instance: GCC is the commercial instance",
    "Agents and clients on agency systems: outside FedRAMP, so the agency's to assess",
  ];
  const axes = [
    "The class sets assurance and what data may go in; features are per-environment product decisions",
    "Network connectivity, INR and Adoption Score are missing in GCC High too, already Class D",
    "Not a ladder: Windows release health and Office Scripts reach GCC, not GCC High",
  ];
  const y = b + 0.25, h = Math.max(panelNeed(5.95, "x", null, edges, 13.5), panelNeed(5.95, "x", null, axes, 13.5));
  panel(s, "Edges", 0.6, y, 5.95, h, HEX.navy, HEX.navyTint, "EDGES INSIDE AND OUTSIDE THE OFFERING", null, edges, 13.5);
  panel(s, "Axes", 6.8, y, 5.95, h, HEX.amber, HEX.amberTint, "IMPACT LEVEL AND FEATURES ARE DIFFERENT AXES", null, axes, 13.5);
  sources(s, "Sources: FedRAMP 2026 definitions, Using a Certified Service, MAS; Microsoft Learn — GCC service description, Intune government service, Office apps in Government plans. Book 10, Ch 01.");
  notes(s,
`The first check is a lookup, not an inference. FedRAMP's 2026 definitions describe a cloud service offering as a specific, packaged product or service that is the subject of a certification, and a certification class as the assurance it supplies, from minimal at Class A to significant at Class D. The Marketplace is the record. For Azure, Microsoft publishes service by service what sits inside the FedRAMP High scope of Azure public and Azure Government. For Microsoft 365 the package describes what's inside, and Microsoft's GCC service description shows two edges plainly: GCC customer support is not included in the service accreditation boundary, and Viva Engage, which can be added to some GCC plans, does not support FedRAMP accreditation.

The second check is the environment. GCC pairs with Entra ID in commercial Azure; GCC High and DoD pair with Entra ID in Azure Government. Intune has no separate GCC instance at all.

The third check belongs to the agency. Its authorizing official accepts risk for the agency's specific use, including the configuration selected and the integrations enabled. Agency-operated components live here too. Software delivered for installation on agency systems and not operated under shared responsibility, typically agents and clients, is entirely outside FedRAMP's scope, which makes it the agency's to assess.

And impact level is a different axis. The class governs assurance and, through the agency's categorization, what data may go in. The features missing in GCC are missing in GCC High too, and GCC High is already Class D. Restriction isn't a ladder either: Windows release health and Office Scripts in Excel reach GCC and stop there.`,
  "Book 10, Chapter 01, \"Three checks, three owners,\" \"Impact level and feature availability are different axes.\"");
}

// ================================================================== 5 Invisible + corrected
{
  const s = content(P1, "Why the boundary stays invisible, and a claim corrected");
  tag(s, "Why");
  panel(s, "Mechanisms", 0.6, 1.5, 4.55, null, HEX.red, HEX.redTint, "FOUR MECHANISMS", "Absence doesn't announce itself", [
    "Shared surfaces: the same admin centers and documentation",
    "Scattered exclusions: one sentence on each feature's own page",
    "Moving targets: Adoption Score's technology-experience categories retired for every tenant in early 2026",
    "Silence: a detection whose input never arrives looks like a quiet day",
  ], 14.5);
  const b = table(s, "Corrected", 1.5, [1.95, 3.6, 2.0], ["In the old example", "What Microsoft documents", "GCC verdict"], [
    ["Endpoint analytics", "Intune in GCC is the commercial instance; no GCC exclusion listed", "Not a GCC gap"],
    ["Device Health Attestation", "Planned for GCC High and DoD", "GCC High and DoD gap"],
    ["Locations, network fence", "Admin-center network connectivity: not GCC, GCC High or DoD", { text: "Confirmed GCC gap", options: { bold: true, color: HEX.red } }],
    ["Azure Arc server monitoring", "An Azure service, in Azure public's FedRAMP High scope", "Different boundary"],
    ["Expedited updates", "Planned for GCC High and DoD", "GCC High and DoD gap"],
  ], { fontSize: 12, x: 5.2 });
  noteBox(s, "Register", 5.2, b + 0.2, 7.55, null, HEX.navy, HEX.navyTint, "THE PROGRAM'S GCC GAP REGISTER: 26 ROWS",
    "8 vendor-confirmed, 15 inferred, 1 restricted, 2 retention-limited. Only confirmed rows support a claim; inferred rows are hypotheses to test.", 12.5);
  sources(s, "Sources: Microsoft Learn — Intune government service, endpoint analytics, Advanced Analytics, network connectivity, Adoption Score, Azure FedRAMP audit scope. Book 10, Ch 02.");
  notes(s,
`Why don't design teams see it? The program's working description is that GCC offers the same nominal product set, features appear in the portals and commercial documentation and get written into plans, and then some produce no data, raise no error, and have no documented GCC resolution. The mechanism has four parts. Shared surfaces: the same admin centers and documentation. Scattered exclusions: network connectivity, informed network routing, Adoption Score and the Office 365 CDN each carry a one-line exclusion on a separate page. Moving targets: Microsoft retired Adoption Score's whole Technology experiences area, including Network connectivity, Microsoft 365 Apps health and Endpoint analytics, for every tenant in January and February 2026. And silence: a control built on a signal that never arrives isn't a weak control; it's no control.

Now the correction. The program's earlier model used five features as its worked example. Checked against current documentation, one holds: the Locations tab belongs to admin-center network connectivity, unavailable in GCC. Device Health Attestation and expedited updates are listed as planned for GCC High and DoD, so the example appears to have merged GCC High's exclusions into GCC. Endpoint analytics lists no GCC exclusion. And Arc is an Azure service, in Azure public's FedRAMP High scope.

The lesson cuts both ways: an unverified boundary story hides features that are present and sends an agency to build compensations it doesn't need. The program's register of 26 GCC telemetry gaps keeps evidence classes apart. Even an inferred row, like degraded ID Protection risk scoring, needs its own evidence, because GCC pairs with Entra ID in commercial Azure.`,
  "Book 10, Chapter 02 — The Invisible Boundary, \"Why the boundary is invisible,\" \"The worked example, corrected.\"");
}

// ================================================================== 6 Four dimensions
{
  const s = content(P1, "Four dimensions change across any boundary");
  tag(s, "What");
  const gcc = [
    "Telemetry: network connectivity, INR, Adoption Score absent",
    "Identity: GCC pairs with commercial Entra ID; GCC High and DoD with Azure Government",
    "Enforcement: path selection is the agency's own measurement",
    "Provenance: a rebuilt signal is labeled derived",
  ];
  const im = img(s, "ch02-four-dimensions", 0.6, 1.5, 7.2, 2.6);
  const gb = panel(s, "GCC", 8.0, 1.5, 4.75, Math.max(im.h, panelNeed(4.75, "x", null, gcc, 12.5)), HEX.navy, HEX.navyTint, "APPLIED TO GCC, FROM DOCUMENTED FACTS", null, gcc, 12.5);
  const vy = Math.max(im.bottom, gb) + 0.25;
  panel(s, "Visible", 0.6, vy, 5.95, null, HEX.teal, HEX.tealTint, "MAKING IT VISIBLE (DESIGN GUIDANCE)", null, [
    "Boundary probe: functional, partial, silent or blocked",
    "In-boundary telemetry that says it's derived",
    "Compensating enforcement through the evidence chain",
    "One record the SSP, POA&M and component definition cite",
  ], 13.5);
  panel(s, "Rules", 6.8, vy, 5.95, null, HEX.amber, HEX.amberTint, "FOUR EVIDENCE RULES", null, [
    "Cite per row, with the date the page was read",
    "Label confidence; build only on confirmed rows",
    "Name the environment: GCC, GCC High, DoD",
    "Re-read on a schedule; a register is a snapshot",
  ], 13.5);
  sources(s, "Sources: FedRAMP 2026 definitions; MAS-CSO-MDI; Microsoft Learn — Azure feature availability. Dimensions, drift classes and mechanisms are program design. Book 10, Ch 02.");
  notes(s,
`A boundary in the program's architecture is any surface across which one of four things changes. This is the program's model, not a FedRAMP or Microsoft construct. Telemetry fidelity asks which signals actually arrive on this side; a violation raises DRIFT-SCHEMA or DRIFT-PROVENANCE. Identity authority asks who a claim's issuer resolves to here; DRIFT-IDENTITY. Enforcement responsibility asks whether the platform or the agency must enforce the control; DRIFT-AUTHZ. Provenance classification asks whether a claim is still authoritative or only derived; DRIFT-SEMANTIC. Be clear about maturity: on the workbook's Drift Engine page, detection for schema and provenance drift is shipped, semantic is a partial target, and authorization and identity drift are design only.

Applied to GCC with documented facts only: the network and adoption signals are absent; GCC pairs with Entra ID in commercial Azure while GCC High and DoD pair with Azure Government, so a cross-cloud trust crosses an identity boundary; path selection rests on the agency's own SD-WAN measurements, a platform feature turned agency duty; and any rebuilt signal is labeled derived.

Why the agency has to model this: FedRAMP's 2026 definition of federal customer data excludes analytics and telemetry generated by the provider, even though metadata about federal customer data is in the assessed scope. Nothing in a certification promises a telemetry feature.

The responses are design guidance: a boundary probe that records functional, partial, silent or blocked per capability; in-boundary adapters whose claims say derived; compensating enforcement through the same evidence chain; and one documentation surface. Four evidence rules keep it honest: cite per row with a date, label confidence, name the environment, re-read on a schedule.`,
  "Book 10, Chapter 02, \"Four things that change across a boundary,\" \"Making the boundary visible.\"");
}

// ================================================================== 7 FedRAMP 2026
{
  const s = content(P1, "FedRAMP 2026: services are certified; agencies authorize");
  tag(s, "What");
  const b1 = table(s, "Classes", 1.5, [1.2, 4.75], ["Class", "What it includes (NTC-0004, Feb. 2026)"], [
    ["A to D", "From minimal assurance at A to significant assurance at D"],
    ["Class B", "The former Li-SaaS and Low baselines"],
    ["Class C", "The current Moderate baseline"],
    ["Class D", "The current High baseline"],
  ], { fontSize: 12.5 });
  table(s, "Dates", b1 + 0.2, [1.9, 4.05], ["Date", "What happens"], [
    ["July 4, 2026", "Optional early adoption"],
    ["July 6, 2026", "Listings open for Initial Implementation"],
    ["Jan. 1, 2027", "Mandatory adoption"],
    ["June 11, 2027", "No new Rev5 certification requests"],
    ["Existing Rev5", "End date not final; \"likely no later than 2029\""],
  ], { fontSize: 12.5 });
  const im = img(s, "ch03-boundary-as-obligations", 6.8, 1.5, 5.95, 3.3);
  noteBox(s, "Counted", 6.8, im.bottom + 0.2, 5.95, null, HEX.navy, HEX.navyTint, "THE RULESET, COUNTED (VERSION 2026.10.13.01)",
    "\"Authorization boundary\": 0 times. \"Boundary\": 8 times: 3 in agency rules about the agency's own system, 4 as tags on the MAS, CMU, VDR and CDS families, 1 in SR-03 guidance.", 12);
  sources(s, "Sources: FedRAMP NTC-0004 (Feb. 25, 2026), NTC-0013 (June 16, 2026); FedRAMP 2026 timeline, definitions, CMU; fedramp-consolidated-rules.json; NIST CSRC glossary. Book 10, Ch 03.");
  notes(s,
`FedRAMP's 2026 rules rename the program's product. A cloud service offering is now FedRAMP Certified, at a Certification Class. FedRAMP announced the classes in Notice NTC-0004 in February 2026: Class B covers the former Li-SaaS and Low baselines, Class C includes the current Moderate baseline, Class D the current High baseline, and numbered levels were dropped to avoid confusion with the DoD impact level system. Two cautions. The class describes what FedRAMP assessed; the same notice lets agencies use a package at any security category they deem appropriate under the Risk Management Framework. And the Marketplace still shows the old word in parentheses, so cite the class.

Certification doesn't replace the agency's decision. Each agency still authorizes its own federal information systems and should never create a standalone authorization to operate for a cloud service offering.

The dates: optional early adoption July 4, 2026; Marketplace listings for Initial Implementation from July 6; mandatory adoption January 1, 2027; no new Rev5 certification requests after June 11, 2027. For existing Rev5 certifications the end date is not finalized but likely no later than 2029.

Because the rules ship as one machine-readable ruleset, the vocabulary can be counted. In version 2026.10.13.01, authorization boundary occurs zero times. Boundary occurs eight times: three in agency rules about the agency's own system, four as tags on the MAS, CMU, VDR and CDS families, and once in SR-03 supply-chain guidance. CMU rises in force by class: MAY at A and B, SHOULD at C, MUST at D. The only boundary the rules name is the agency's, which NIST still defines from OMB Circular A-130.`,
  "Book 10, Chapter 03 — What Changed at FedRAMP, \"Certification replaces authorization,\" \"The rules have no provider authorization boundary.\"");
}

// ================================================================== 8 MAS
{
  const s = content(P1, "Minimum Assessment Scope: a data test, per resource");
  tag(s, "What");
  const b = table(s, "MAS", 1.5, [1.75, 5.95], ["Rule", "What it requires"], [
    ["MAS-CSO-IIR", "Identify every resource likely to handle, or affect the security of, federal customer data; that set is the offering"],
    ["MAS-CSO-FLO", "Document information flows and security categories; resources \"MAY vary by security category\""],
    ["MAS-CSO-TPR", "For each third-party resource: its use, the reason, mitigations and compensating controls"],
    ["MAS-CSO-MDI", "Include metadata, \"including metadata about federal customer data,\" when its resource is in scope"],
    ["MAS-CSO-SUP", "Material on out-of-scope resources must be marked and separated, and isn't certified"],
  ], { fontSize: 12 });
  subhead(s, "MAS note", "Classes B to D; each rule wants machine-readable output and the code that generates it.", 0.6, b + 0.08, 7.7);
  const cb = panel(s, "Category", 8.55, 1.5, 4.2, null, HEX.navy, HEX.navyTint, "PER-RESOURCE CATEGORY", null, [
    "Ends one level stamped over everything, on the provider's side",
    "Ask which resource and which data a refusal rests on",
  ], 13.5);
  const ab = panel(s, "Agents", 8.55, cb + 0.15, 4.2, null, HEX.amber, HEX.amberTint, "AGENTS AND CLIENTS", null, [
    "Not operated under shared responsibility: \"entirely outside the scope of FedRAMP\"",
  ], 13.5);
  callout(s, "Visible", Math.max(ab, b + 0.4) + 0.2, 0.9, "FaListCheck", HEX.teal, "Scope must be visible without asking: ",
    "CDS-CSO-SVC requires a public list of services and categories; it says which services are in, not which features are off.");
  sources(s, "Sources: FedRAMP 2026 — Minimum Assessment Scope (IIR, FLO, TPR, MDI, SUP), Certification Data Sharing (SVC, PUB), Scope of FedRAMP (quoting OMB M-24-15). Book 10, Ch 03.");
  notes(s,
`Minimum Assessment Scope defines what the offering is. MAS-CSO-IIR requires the provider to identify every information resource likely to handle federal customer data or likely to affect its confidentiality, integrity or availability, and says that set is the offering. The test follows the data, not the subnet. FLO documents flows and security categories; TPR documents each third-party resource with its reason, mitigations and compensating controls; MDI brings metadata about federal customer data into scope; and SUP lets providers supply material about out-of-scope resources only if it's marked, separated, and understood not to be certified. The rules apply to Classes B through D, and each wants machine-readable output with the code that generates it.

FLO's note is the provision most likely to change a design conversation: resources may vary by security category. Much "we can't have that feature" reasoning rests on one level stamped across a whole environment. The rules don't require that habit, though whether a provider uses the flexibility is its choice.

The guidance on IIR draws a second line. Agents, application clients and mobile apps not fully managed by the provider aren't a cloud service, and are entirely outside FedRAMP. The cloud service an agent reports to is in FedRAMP's scope; the agent is in the agency's, with its configuration, its updates and the data it sends. Settle for each one whether it's operated under shared responsibility or simply delivered.

And scope must be visible without asking. CDS-CSO-SVC requires a public list of services and security categories, in marketing names, complete enough to tell what's in scope without requesting the package, with CDS-CSO-PUB adding JSON. That covers services. It doesn't say which features are switched off; Appendix A asks for both.`,
  "Book 10, Chapter 03, \"Minimum Assessment Scope: a test about data, not topology.\"");
}

// ================================================================== 9 SCN and feeds
{
  const s = content(P1, "Change is notified, not re-approved; data becomes a feed");
  tag(s, "How");
  img(s, "ch03-change-classes", 0.6, 1.5, 6.2, 3.85);
  const b = table(s, "Trust", 1.5, [1.75, 4.0], ["Trust-center rule", "Requirement"], [
    ["CDS-CSO-UTC", "Use a FedRAMP-compatible trust center for certification data"],
    ["CDS-TRC-PAC", "Documented programmatic access to all certification data"],
    ["CDS-TRC-USH", "Share \"without interruption\"; just-in-time access preferred"],
    ["CDS-TRC-ACL", "Log access; keep summaries at least six months"],
  ], { fontSize: 12, x: 7.0 });
  noteBox(s, "Listings", 7.0, b + 0.2, 5.75, null, HEX.navy, HEX.navyTint, "AS OF OCTOBER 21, 2026",
    "110 of 781 Marketplace listings had a trust-center field populated.", 12.5);
  callout(s, "Vocab", 5.55, 0.95, "FaBook", HEX.amber, "Two vocabularies for years: ",
    "MAS, CMU, VDR, CDS and SCN list Rev5 as well as 20x; read a Rev5 boundary diagram and 20x scope data each in its own terms.");
  sources(s, "Sources: FedRAMP 2026 — Significant Change Notification (EVA, RTR, ADP, TRF, HRM, HIS, EMG), Certification Data Sharing, Rev5 rulesets; Marketplace data (Oct. 21, 2026). Book 10, Ch 03.");
  notes(s,
`Change control replaces re-authorization. Under SCN-CSO-EVA the provider classifies every potential significant change in a fixed order. A change of certification class needs a new assessment and can't be done under these rules. A regularly recurring change, like patching, signature updates, capacity or firewall rule maintenance, is routine recurring, and providers should not file a notification. Substantive new risk is transformative: initial plans at least 30 business days before, final plans at least 10 before, notices within 5 business days after finishing and after verification, and documentation updated within 30. Everything else is adaptive: notify within 10 business days after. Business days throughout, in human-readable and JSON form.

Two consequences. Keeping current with commercial no longer carries a per-release compliance cost on the provider's side. And because notices are machine-readable, the agency can test each against its own authorization, which the agency rules expect: agencies must review each Ongoing Certification Report.

Certification data becomes a feed. Providers must use a FedRAMP-compatible trust center, defined as the complete and definitive source. It must offer documented programmatic access to all certification data, share without interruption, inventory and log access, and providers using one instead of USDA Connect must tell FedRAMP within five business days of denying an agency's access. On October 21, 2026, 110 of 781 listings had a trust-center field populated.

Rev5 and the new rules coexist. The boundary families and SCN list both 20x and Rev5, and Rev5 packages keep their provider-drawn boundary diagrams. Read each in its own vocabulary.`,
  "Book 10, Chapter 03, \"Change control replaces re-authorization,\" \"Certification data becomes a feed,\" \"Rev5 and the 2026 rules side by side.\"");
}
endModule("Module 1");

// ================================================================== 10 Module 2 divider
{
  const s = divider(P1, "Module 2: GCC, the gap and three responses", "Part 1 — The boundary and what it removes  ·  Chapters 04, 09–10",
    ["GCC as the worldwide service minus a published list", "The register, the probe and equivalents that say they're derived", "Exceptions, scope arguments and the alternative path"], 12);
  notes(s,
`Module 2: Microsoft 365 GCC and the three responses. First, how Microsoft itself describes GCC: the worldwide service with a published list of exclusions, not a perimeter that dims the commercial product. Then the largest documented loss, the admin center's network observability layer, and the three government packages on the Marketplace, including a second GCC package pursuing High. Then the playbook: a cited register, a boundary probe, in-boundary equivalents, documented exceptions, the scope arguments the 2026 rules allow, and the alternative path of changing the collaboration suite.`,
  "Book 10, Chapters 04, 09 and 10.");
}

// ================================================================== 11 GCC worldwide minus list
{
  const s = content(P1, "GCC is the worldwide service minus a published list");
  tag(s, "What");
  table(s, "Facts", 1.5, [4.15, 3.0], ["Documented fact", "What it means"], [
    ["One endpoint list for \"Worldwide (including GCC)\"; separate lists for GCC High and DoD", "Same network endpoints as commercial"],
    ["GCC pairs with Entra ID in Azure; GCC High and DoD with Entra ID in Azure Government", "Azure integration follows that pairing"],
    ["GCC customer support is \"not included in the service accreditation boundary\"", "Scope edges are marked per item"],
    ["GCC High and DoD: extra endpoint restrictions; allowlist requests on a three-week SLA", "The separate network regime starts at GCC High"],
    ["Windows release health: in GCC, not in GCC High or DoD", "There's no single ladder"],
  ], { fontSize: 12 });
  const im = img(s, "ch04-exclusions-both-ways", 7.95, 1.5, 4.8, 3.2);
  noteBox(s, "Both", 7.95, im.bottom + 0.2, 4.8, null, HEX.amber, HEX.amberTint, "CITE BOTH STATEMENTS",
    "The Marketplace says GCC \"leverages Azure Government as the IaaS/PaaS\"; Microsoft pairs GCC with commercial Entra ID. \"GCC Moderate\" names an environment, not a product.", 12);
  sources(s, "Sources: Microsoft Learn — M365 endpoints, Azure feature availability, GCC service description, GCC High network, Windows release health; Marketplace MSO365MT. Book 10, Ch 04.");
  notes(s,
`The usual picture of GCC is a compliance boundary around the commercial service that filters telemetry and withholds features for accreditation reasons. If that were right, the only moves would be to accept it or leave for GCC High. Microsoft's documentation describes something else, in five facts. There's no GCC endpoint list: Microsoft publishes one for Worldwide including GCC, and separate lists for GCC High and DoD. Office 365 GCC pairs with Entra ID in Azure, GCC High and DoD with Entra ID in Azure Government, so Azure integration follows that pairing. The GCC service description marks edges per item, such as customer support outside the accreditation boundary. The separately networked regime, with extra endpoint restrictions and on-premises allowlist requests on a three-week service level that can't be expedited, begins at GCC High. And some gaps run the other way: Windows release health, Word version history and Excel Office Scripts are in GCC and not GCC High.

One fact points the other way, and a reviewer may raise it. The Marketplace description says GCC leverages Azure Government as the IaaS and PaaS for the underlying infrastructure. That's about the infrastructure the package inherits controls from; it doesn't change the endpoint list or the Entra pairing you design against. Cite both statements in the system security plan, and paraphrase neither into "GCC runs on commercial Azure" or "GCC runs on Azure Government."

And GCC Moderate names the environment, not a distinct product or certification.`,
  "Book 10, Chapter 04 — GCC, GCC High and the Commercial Feature Gap, \"What GCC is, in Microsoft's own words,\" \"A note on names.\"");
}

// ================================================================== 12 Network observability
{
  const s = content(P1, "The largest documented loss: network observability");
  tag(s, "What");
  const lost = [
    "Assessment per tenant and location: 0 to 100 from TCP latency, download speed and UDP quality; 80 is the healthy baseline",
    "Per-location perimeter: egress, front doors, resolver, proxy, estimated latency gain",
    "Network insights, including TLS interception detection",
    "Provider attribution as ISP, Overlay or Corporate; Network Provider Index (US only)",
  ];
  const remains = [
    "Supports US Government (GCC); public report sharing disabled",
    "Runs locally from the location tested, not aggregated daily",
    "Flags egress over 500 miles away: likely more than 25 ms of added TCP latency",
  ];
  const ph = Math.max(panelNeed(7.0, "x", "x", lost, 14), panelNeed(4.9, "x", "x", remains, 14));
  panel(s, "Lost", 0.6, 1.5, 7.0, ph, HEX.red, HEX.redTint, "NOT IN GCC, GCC HIGH OR DOD", "Admin-center network connectivity", lost, 14);
  panel(s, "Remains", 7.85, 1.5, 4.9, ph, HEX.teal, HEX.tealTint, "WHAT REMAINS IN GCC", "The connectivity test tool", remains, 14);
  callout(s, "Cost", 1.5 + ph + 0.25, 0.95, "FaChartLine", HEX.amber, "The cost: ",
    "a commercial tenant compares SASE and transport providers from a dashboard; a GCC agency funds its own measurement to decide.");
  sources(s, "Sources: Microsoft Learn — admin-center network connectivity, network assessment, Network Insights, provider details, connectivity test tool, Adoption Score, INR, CDN. Book 10, Ch 04.");
  notes(s,
`The most consequential single exclusion isn't a telemetry detail; it's the whole network connectivity layer of the Microsoft 365 admin center. Microsoft says it supports commercial and 21Vianet tenants but not GCC Moderate, GCC High or DoD. A commercial tenant gets it at no extra license cost. It includes a network assessment for the tenant and each location: a 0 to 100 points value averaging TCP latency, download speed and UDP connection quality, compiled daily, with 80 as the healthy baseline, compared with other customers in the same city, and up to two years of history. It includes a per-location perimeter view: the egress point, in-use and optimal Exchange and SharePoint front doors, the recursive resolver and any proxy, with an estimated latency improvement. Network insights detect TLS interception. And provider attribution classes each network provider as ISP, Overlay or Corporate, attributes Exchange, SharePoint and Teams performance to each, and ranks providers by state in a Network Provider Index, currently US only.

Some measurement remains. The connectivity test tool supports GCC, with public report sharing disabled. It runs locally from the location being tested, and flags egress more than 500 miles from the office, which is likely to add more than 25 milliseconds of TCP latency.

Alongside it: Adoption Score is unavailable in GCC as a whole report; informed network routing isn't available to GCC Moderate; the Office 365 CDN is only for the production worldwide cloud. Treat the network layer as the largest documented loss for network decisions, and budget for the independent measurement that replaces it.`,
  "Book 10, Chapter 04, \"What agencies verifiably lose.\"");
}

// ================================================================== 13 Three packages
{
  const s = content(P1, "Three packages, and why High won't bring features back");
  tag(s, "What");
  img(s, "ch04-three-packages", 0.6, 1.5, 12.15, 2.85);
  panel(s, "Fact", 0.6, 4.55, 5.95, 1.95, HEX.navy, HEX.navyTint, "FACT (MARKETPLACE, AS OF OCT. 21, 2026)", null, [
    "MSO365MTA: same name as MSO365MT, In Process, Class D, 0 authorizations",
    "Status events July 1, July 20 and Oct. 19, 2026",
    "Microsoft's GCC description says High; the record says Class C",
  ], 12);
  panel(s, "Inference", 6.8, 4.55, 5.95, 1.95, HEX.amber, HEX.amberTint, "INFERENCE, AND WHAT IT DOESN'T CHANGE", null, [
    "Likely a High effort for GCC alongside Class C: ask the provider",
    "A class change needs a new assessment, not an SCN",
    "Class changes what data may go in, not which features exist",
  ], 12);
  sources(s, "Sources: FedRAMP Marketplace products.json (Oct. 21, 2026) — MSO365MT, MSO365MTA, FR1824057433; SCN-CSO-EVA; NTC-0004; Microsoft Learn — GCC service description. Book 10, Ch 04, 09.");
  notes(s,
`The Marketplace carries three Microsoft 365 government packages that get run together. Read on October 21, 2026: MSO365MT, the GCC service most civilian agencies run, Certified at Class C, certification date November 20, 2014, with 100 authorizations. FR1824057433, GCC High, a different environment with its own endpoints and its own Entra pairing, Certified at Class D in December 2024, with 5. And MSO365MTA, which is new: the identical offering name and service description, the same independent assessor, In Process at Class D in Initial Implementation, with zero authorizations and status events on July 1, July 20 and October 19, 2026.

Keep fact and inference apart. The fact is that table. The inference is that MSO365MTA is a High certification effort for GCC running alongside the Class C one, which is consistent with the rule that a class change needs a new assessment. The Marketplace doesn't say whether it will supersede, run alongside or be withdrawn; that's a question for the provider, not a roadmap. Microsoft's own pages add a wrinkle: the GCC service description says Office 365 Government supports FedRAMP at a High impact level, while the Marketplace record says Class C. Cite the Marketplace and the package, and record the discrepancy.

Why it matters: an architecture that hard-codes a Moderate ceiling may be building on something that moves. But a higher class doesn't restore features. Network connectivity is already absent at Class D in GCC High. Never plan to recover a feature by waiting for a class; ask the provider, per feature, what would move it.`,
  "Book 10, Chapter 04, \"Microsoft is pursuing High for GCC, and what that doesn't change\"; Chapter 09, \"A higher class doesn't restore an excluded feature.\"");
}

// ================================================================== 14 Register, probe, equivalent
{
  const s = content(P1, "Work the gap as a list: register, probe, equivalent");
  tag(s, "How");
  table(s, "Register", 1.5, [1.75, 4.4], ["Register field", "What it holds"], [
    ["Capability", "The feature, in the provider's own name"],
    ["Clouds affected", "Each environment; exclusions run both ways"],
    ["Evidence class", "Vendor-confirmed, inferred, restricted or retention-limited"],
    ["Citation", "Provider page and section, with the date read"],
    ["Probe result", "What the agency's own tenant did, with the date"],
    ["Dependent designs", "Designs, controls or plans that rely on it"],
    ["Response", "Use, equivalent, exception, alternative path or going without, with its owner"],
  ], { fontSize: 13 });
  const prb = panel(s, "Probe", 7.0, 1.5, 5.75, null, HEX.navy, HEX.navyTint, "BOUNDARY PROBE (DESIGN GUIDANCE)", null, [
    "Tests for output, not the switch: works, absent, works with limits, fails silently",
    "Reruns on a cadence and after a provider notice that names a capability",
  ], 13.5);
  panel(s, "Derived", 7.0, prb + 0.2, 5.75, null, HEX.teal, HEX.tealTint, "SAY THAT IT'S DERIVED", null, [
    "Network assessments: scheduled CLI tests from each location, labeled derived",
    "Closes part of the gap; per-provider comparative scoring isn't replaced",
    "INR has no equivalent: the honest entry is an exception",
  ], 13.5);
  sources(s, "Sources: NIST SP 800-37 Rev. 2, App. G; Microsoft Learn — network connectivity, connectivity test tool, Intune government. Register and probe are program design. Book 10, Ch 09.");
  notes(s,
`NIST frames the choice in four options: when trust in an external provider isn't enough, employ compensating controls, accept greater risk, contract with a more trustworthy provider, or don't obtain the service. The program's playbook uses the same four moves, and it starts with a register, not a boundary. A perimeter can only be accepted or left; a list of published exclusions can be worked one row at a time.

The citation is what makes a row usable. "GCC withholds network telemetry" is an inference a Microsoft reader will reject. The documented sentence about admin-center network connectivity can't be rejected. Each row carries the fields on the slide. Only vendor-confirmed rows support a claim made to a provider or an assessor; inferred rows are hypotheses for the probe to test.

The probe, owned by the platform team, records a capability disposition: the capability, the tenant or subscription, the test, the observed result, the date, and the row it confirms or contradicts. It checks for output, not the switch, because the invisible boundary's failure is a report that never fills in. It reruns on a cadence and after any provider notice naming an affected capability, and every result feeds the boundary record.

Equivalents say they're derived. The worked case: admin-center network connectivity is unavailable, but the test tool supports signed-in tests, saved reports, network health status and command-line testing in GCC. Scheduled tests from each location, landing in one place and labeled derived, close part of the gap. They don't replace comparative per-provider scoring, and the row should say so. Informed network routing has no equivalent; the honest entry is an exception.`,
  "Book 10, Chapter 09 — In-Boundary Equivalents and Documented Exceptions, \"Start with a register,\" \"Probe what actually works,\" \"Build in-boundary equivalents.\"");
}

// ================================================================== 15 Exceptions and scope arguments
{
  const s = content(P1, "Exceptions, scope arguments and buying the capability");
  tag(s, "How");
  const eb = panel(s, "Exceptions", 0.6, 1.5, 5.2, null, HEX.amber, HEX.amberTint, "TWO KINDS OF DOCUMENTED EXCEPTION", null, [
    "Provider path: ExpressRoute for Microsoft 365 only when a regulation mandates direct connectivity, quoted with a link",
    "No FedRAMP rule or FISMA provision found that mandates it",
    "Agency path: the AO accepts the risk; it can't be delegated",
    "To close: POA&M with a milestone. To live with: signed, with an end or review date",
  ], 13.5);
  const tb = table(s, "Arguments", 1.5, [3.1, 3.6], ["Argument the 2026 rules allow", "Its limit"], [
    ["Categories vary by resource (MAS-CSO-FLO)", "Binds the provider; the agency still categorizes its own system"],
    ["Agents are outside FedRAMP (MAS-CSO-IIR)", "Not outside the agency's authorization"],
    ["Routine changes aren't notified (SCN)", "The agency still reviews ongoing reports"],
    ["Agencies can't demand more than FedRAMP", "Unless the agency head or a delegate finds a need"],
  ], { fontSize: 12, x: 6.05 });
  callout(s, "Badge", Math.max(eb, tb) + 0.25, 0.95, "FaScaleBalanced", HEX.teal, "Buy the capability, not the badge: ",
    "the Network Provider Program is closed to new providers; specify web-service ingestion, Optimize and Allow bypass, and hourly /version checks.");
  sources(s, "Sources: Microsoft Learn — ExpressRoute for M365, network last mile, Network Provider Program, managing endpoints; NIST SP 800-37, SP 800-53 CA-5; FedRAMP MAS, SCN, AGU. Book 10, Ch 09.");
  notes(s,
`A documented exception comes in two kinds, with different owners. The provider's own path: ExpressRoute for Microsoft 365 is the worked example. Microsoft doesn't recommend it, requires authorization, and grants it only in rare cases; an unauthorized subscription gets an error creating Microsoft 365 route filters. Its assessment guidance is precise: authorized only when a customer's regulatory requirement mandates direct connectivity, with the text excerpt and a link to the regulation. The program hasn't found a FedRAMP rule or a FISMA provision that mandates private connectivity, and TIC 3.0 mandates no specific technology, so writing ExpressRoute into a task order without the authorization in hand risks finding the gate afterwards. But the structure is the template for every provider ask: a named requirement, quoted, with a link.

The agency's own risk acceptance belongs to the authorizing official and can't be delegated. Gaps the agency intends to close go on the POA&M under CA-5, with a milestone and owner; gaps it lives with go into a signed exception with an end or review date, so "permanent" is a decision someone repeats.

Four scope arguments come with limits, on the slide. Categories vary by resource, but that binds the provider's description. Agents are outside FedRAMP, but not outside the agency's authorization. Routine changes aren't notified, but the agency still reviews ongoing reports. And agencies can't demand more than FedRAMP requires unless the agency head or a delegate finds a demonstrable need and notifies FedRAMP. These apply to Rev5 Class C certifications too.

Finally, buy the capability. The Network Provider Program is no longer open to new providers, so naming membership as a criterion restricts competition to a closed pool.`,
  "Book 10, Chapter 09, \"Use documented exceptions,\" \"Make the scope arguments the 2026 rules allow,\" \"Buy the capability, not the badge.\"");
}

// ================================================================== 16 Alternative path
{
  const s = content(P1, "Change the suite, keep the identity plane");
  tag(s, "How");
  img(s, "ch10-separable-planes", 0.6, 1.5, 4.5, 4.95);
  const rb = panel(s, "Read", 5.35, 1.5, 7.4, null, HEX.navy, HEX.navyTint, "READ THE CERTIFICATION, NOT THE ANNOUNCEMENT (AS OF OCT. 21, 2026)", null, [
    "Google Workspace Class D; asterisked services \"do not meet the SA-9(5) requirement\"",
    "Gemini for Government is listed at Class B (Low); Workspace High needs editions such as Enterprise Plus",
  ], 13.5);
  panel(s, "Keep", 5.35, rb + 0.2, 7.4, null, HEX.teal, HEX.tealTint, "KEEP IDENTITY AUTHORITATIVE (DESIGN GUIDANCE)", null, [
    "Entra ID provisions users and groups (match on primaryEmail) and federates SAML sign-in",
    "Conditional Access applies at sign-in, not inside the Google session",
    "Super admins use Google credentials, outside Conditional Access: few, 2SV, logged",
    "Anything the provisioning service didn't write is drift",
  ], 13.5);
  sources(s, "Sources: FedRAMP Marketplace (Oct. 21, 2026); Google FedRAMP scope; Workspace Admin Help; Microsoft Learn — Google provisioning, SSO; Nextgov/FCW; Stars and Stripes. Book 10, Ch 10.");
  notes(s,
`The third answer is to change the service that delivers the workload. It's only safe if the identity plane stays put: the collaboration suite is a workload that consumes identity, not a second directory of record.

Read the certification, not the announcement. As of October 21, 2026, Google Workspace is Certified at Class D, Zoom for Government and Webex for Government at Class C, Slack at C and GovSlack at D, Box at D, and Gemini for Government at Class B, Low, certified January 21, 2026. The provider says Workspace, Gemini in Workspace apps and the Gemini app are FedRAMP High authorized, so which AI features fall inside which offering is a question for the package. The Workspace listing says asterisked services don't meet SA-9(5), and the High configuration needs specific editions.

The public record has both outcomes. In September 2025 a cabinet-level department awarded a five-year agreement of up to 89 million dollars to move more than 50,000 staff to Workspace with Gemini, on a temporary 71 percent discount, so a cost model must price the renewal years. None of the sources describes the identity integration. A military department went the other way, ending about 150,000 licenses after an audit found about 16 percent in use. Measure adoption in the pilot.

The identity pattern is design guidance. Entra ID provisions users and groups, on custom domains verified in both, with manager, department and OrgUnitPath mapped from governed attributes, and federates sign-in over SAML. Close the gaps: super administrators sign in with Google credentials outside Conditional Access, and the derived directory must be checked for drift.`,
  "Book 10, Chapter 10 — Alternative Collaboration Paths, \"Read the certification, not the announcement,\" \"A public example,\" \"Keep the identity plane where it is.\"");
}
endModule("Module 2");

// ================================================================== 17 Module 3 divider
{
  const s = divider(P2, "Module 3: Landing zone and front door", "Part 2 — Building it and owning it  ·  Chapters 05–07",
    ["Management groups and the policy each boundary decision becomes", "The address plan as join key; pools that mirror the authority", "Network as code and the governed provisioning loop"], 15);
  notes(s,
`Module 3, the start of Part 2: the landing zone, where the boundary becomes something Azure Resource Manager enforces. We'll go through the management group hierarchy and the policy each boundary decision becomes, the same pattern on AWS and GovCloud, and the contract every piece of automation should carry. Then the address plan as the join key the inventory needs, Virtual Network Manager pools that mirror the enterprise IPAM, and network as code. Then the front door: the governed loop that turns "run the module" into an approved, evidenced and reconciled change.`,
  "Book 10, Chapters 05–07.");
}

// ================================================================== 18 Hierarchy
{
  const s = content(P2, "The hierarchy is where boundary policy lands");
  tag(s, "What");
  const im = img(s, "ch05-management-groups", 0.6, 1.5, 6.3, 4.0);
  const rb = panel(s, "Recs", 7.15, 1.5, 5.6, null, HEX.navy, HEX.navyTint, "MICROSOFT'S RECOMMENDATIONS", "Flat, policy-driven, protected", [
    "Three to four levels; don't mirror the org chart",
    "No management groups for prod, test and dev: separate by subscription",
    "Workload rights at subscription scope; platform rights eligible through PIM",
    "Turn on RBAC for management group operations; default new subscriptions to Sandbox",
    "Moving a subscription is a boundary change",
  ], 14);
  callout(s, "Gov", Math.max(im.bottom, rb) + 0.2, 0.85, "FaTriangleExclamation", HEX.amber, "Azure Government: ",
    "the accelerators run unmodified only in public Azure; adapt policies, API versions and resources by hand.");
  sources(s, "Sources: Microsoft Learn — What is an Azure landing zone, landing zone FAQ, design areas, management groups, subscription vending, Deploy Azure landing zones. Book 10, Ch 05.");
  notes(s,
`Microsoft's Cloud Adoption Framework defines an Azure landing zone as an architecture for governing, securing and scaling a multi-subscription environment: one platform landing zone per Entra tenant, and workload landing zones, each an individual subscription. Microsoft's accelerators deploy the platform from Bicep or Terraform on Azure Verified Modules. The catch for Azure Government is that those options are supported only for public Azure, so the platform team adapts the code by hand: removing policies that don't exist there, adjusting API versions and removing unavailable resources.

In the program's design the landing zone sits on four planes that must already be authoritative: naming and addressing, device and cryptographic identity, organizational identity, and governed transport.

The baseline hierarchy puts an intermediate root under the tenant root, so nothing is assigned at the root itself. Platform holds Security, Management, Connectivity and Identity subscriptions; Landing zones holds Corp, Online and Local; Sandbox has looser policy; Decommissioned holds cancelled subscriptions for 30 to 60 days. Keep it flat, and don't mirror the org chart. Don't make management groups for production, test and development, so a test subscription faces production's boundary policy. Give workload teams rights at subscription scope during vending, and platform rights eligible through PIM. Protect the hierarchy: by default any principal can create management groups and new subscriptions land under the root, so turn on RBAC authorization and set a default group such as Sandbox. Subscription placement decides which boundary policy applies, so moving one is a boundary change.`,
  "Book 10, Chapter 05 — The Landing Zone, \"What a landing zone is,\" \"The substrate beneath it,\" \"The management group hierarchy.\"");
}

// ================================================================== 19 Decisions to policy
{
  const s = content(P2, "Five boundary decisions, five enforced mechanisms");
  tag(s, "How");
  img(s, "ch05-boundary-to-policy", 0.6, 1.5, 5.1, 4.95);
  const b = table(s, "Decisions", 1.5, [1.45, 5.35], ["Decision", "Mechanism and its fine print"], [
    ["Which cloud", "Azure and Azure Government both Class D; Government's Resource Manager is management.usgovcloudapi.net"],
    ["Which regions", "Allowed locations plus Allowed locations for resource groups, Deny at the intermediate root"],
    ["Which services", "Allowed resource types covers only types with tags and location: duplicate it in mode All"],
    ["Which settings", "FedRAMP regulatory compliance initiative in audit: \"only a partial view\""],
    ["Which exceptions", "Exemption, Mitigated or Waiver, with expiresOn and the deciding reference"],
  ], { fontSize: 12.5, x: 5.95 });
  noteBox(s, "Rollout", 5.95, b + 0.2, 6.8, null, HEX.amber, HEX.amberTint, "ROLLOUT (DESIGN GUIDANCE ON MICROSOFT'S ORDER)",
    "Deny returns 403; existing resources re-evaluate every 24 hours, a new or moved subscription in about 30 minutes. Audit first, fix or exempt, then Deny.", 12);
  sources(s, "Sources: Microsoft Learn — FedRAMP audit scope, built-in policies, disallowed resources, FedRAMP Moderate initiative, exemptions, effects, compliance data; Marketplace. Book 10, Ch 05.");
  notes(s,
`The package says what's in the boundary; the landing zone has to say the same thing in a form Resource Manager enforces. Each decision has a mechanism and a scope.

Which cloud: Azure and Azure Government both hold FedRAMP High, and on the Marketplace both are Class D. Which regions: Allowed locations, which excludes global resources, so pair it with Allowed locations for resource groups, both Deny at the intermediate root. Which services: Microsoft's audit-scope lists, last updated February 2026. Out of scope isn't forbidden, but it isn't inherited. Enforce with Allowed resource types and read the fine print: the built-in only affects types that support tags and location, so duplicate it with mode All. Which settings: the FedRAMP Moderate or High regulatory compliance initiative, in audit mode, which Microsoft calls only a partial view of compliance. Which exceptions: an exemption, Mitigated or Waiver, with an optional expiresOn; the program requires an expiry and a reference to the authorizing decision.

Enforcement order matters: disabled first, then append and modify, then deny, then audit, with the if-not-exists effects after the provider succeeds. A deny match fails the request with a 403. Policy assigned at a management group evaluates only resources in subscriptions and resource groups. So roll out in audit at the intermediate root, review the report with the system owner and the ISSO, fix or exempt, then switch to Deny. A policy that blocks production on day one teaches teams to ask for exemptions instead of fixing designs.`,
  "Book 10, Chapter 05, \"Where each boundary decision lands,\" \"Enforcing without breaking things.\"");
}

// ================================================================== 20 AWS and the adapter contract
{
  const s = content(P2, "AWS, GovCloud and automation that declares its boundary");
  tag(s, "How");
  const aws = [
    "SCPs never grant; they cap IAM users and roles, root included, not the management account",
    "GovCloud accounts are created in pairs from a commercial management account",
    "Audit and Log Archive accounts must exist first; Account Factory Create account unavailable",
    "No export-controlled data in Control Tower metadata",
    "Landing Zone Accelerator \"will not, by itself, make you compliant\"",
  ];
  const contract = [
    "In-boundary, or a named exception from a short canonical list",
    "No hardcoded hostnames: endpoints resolve from the declared cloud",
    "Fail closed on an unknown cloud",
    "Every claim records boundary, tenant, region and endpoint class",
  ];
  const ph = Math.max(panelNeed(6.55, "x", null, aws, 14.5), panelNeed(5.35, "x", null, contract, 14.5));
  panel(s, "AWS", 0.6, 1.5, 6.55, ph, HEX.navy, HEX.navyTint, "AWS ORGANIZATIONS AND CONTROL TOWER", null, aws, 14.5);
  panel(s, "Contract", 7.4, 1.5, 5.35, ph, HEX.teal, HEX.tealTint, "THE ADAPTER CONTRACT (DESIGN GUIDANCE)", null, contract, 14.5);
  callout(s, "Market", 1.5 + ph + 0.25, 0.95, "FaCloud", HEX.amber, "Marketplace, as of Oct. 21, 2026: ",
    "AWS GovCloud Class D (High); AWS US East/West Class C (Moderate); Azure and Azure Government both Class D (High).");
  sources(s, "Sources: AWS — Organizations SCPs, Control Tower in GovCloud (US), Landing Zone Accelerator; FedRAMP Marketplace (Oct. 21, 2026). Adapter contract is program design. Book 10, Ch 05.");
  notes(s,
`AWS expresses the same structure with Organizations: accounts for subscriptions, organizational units for management groups, service control policies for deny assignments. An SCP never grants a permission; it sets the maximum for IAM users and roles in member accounts, including the root user, doesn't affect the management account, and needs an organization with all features enabled. Control Tower runs in both GovCloud Regions, differently. Accounts can't be created inside GovCloud: CreateGovCloudAccount runs from a commercial management account and creates a pair, a standalone GovCloud account and a linked commercial one for billing and support. The GovCloud organization is independent, and its Audit and Log Archive accounts must exist before setup. Account Factory's Create account isn't available, and new customers can't deploy Account Factory for Terraform there. Control Tower metadata must not contain export-controlled data. Landing Zone Accelerator supports the GovCloud partition and, in AWS's words, won't by itself make you compliant.

The landing zone constrains what people deploy. Automation needs its own contract, because a collector that calls a commercial-only API from inside the boundary is a crossing nobody approved. The program's cloud specification is design guidance: every adapter operates in-boundary or through a named exception a formal decision added to a short canonical list, with no third option; endpoints resolve from the declared cloud; an unknown cloud fails closed; and every claim records its boundary, tenant, region and endpoint class: Graph v1.0, Graph beta, Resource Manager or Arc. A crossing without a declared exception shows up as provenance drift.`,
  "Book 10, Chapter 05, \"The same pattern on AWS,\" \"Every automation declares its boundary.\"");
}

// ================================================================== 21 Address plan
{
  const s = content(P2, "The address plan: the denominator every inventory needs");
  tag(s, "Why");
  const kb = panel(s, "Key", 0.6, 1.5, 5.6, null, HEX.navy, HEX.navyTint, "WHY IPAM IS THE JOIN KEY", null, [
    "CM-8: all components, no duplicates, none from other systems",
    "BOD 23-01: discovery every 7 days over \"the entire IPv4 space used by the agency\"",
    "A boundary isn't IP ranges: SaaS parts may hold no agency address",
    "IPAM can't see software, owner, classification or boundary",
  ], 13.5);
  const tb = table(s, "CMDB", 1.5, [3.95, 2.35], ["CMDB requirement (design guidance)", "Driver"], [
    ["Address correlation to the IPAM record", "CM-8"],
    ["One deduplicated record per asset", "CM-8"],
    ["Boundary classification, queryable", "CM-8, CA-3"],
    ["Owner scoping: owners see only theirs", "AC-3, AC-6"],
    ["Change audit into the SIEM", "AU-3, AU-12"],
    ["Unmanaged devices shown, not omitted", "CM-8"],
  ], { fontSize: 12, x: 6.45 });
  facts(s, "Fabrics", Math.max(kb, tb) + 0.25, 1.0, [
    ["Azure", HEX.navy, HEX.navyTint, "Layer 3 overlay; five reserved addresses per subnet"],
    ["AWS", HEX.teal, HEX.tealTint, "Five reserved; DNS server at VPC base plus two"],
    ["VMware NSX", HEX.amber, HEX.amberTint, "DHCP at logical gateways; VCF 9.1 native IPAM"],
  ], 12);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-8), SP 800-37; CISA BOD 23-01; FedRAMP KSI-PIY-GIV; Microsoft Learn — VNet FAQ; AWS — subnet sizing. CMDB set is program design. Book 10, Ch 06.");
  notes(s,
`Every deployment draws on an address and a network path, and both need one authority. CM-8 asks for an inventory that accurately reflects the system, includes all components, and doesn't double-count or include another system's components. Each of those tests needs a reference population. A scan enumerates what answered during a window; IPAM enumerates what was allocated. Without reconciliation, the scan is a sample with no denominator. That's the program's design position. BOD 23-01 points the same way: automated discovery every 7 days covering at minimum the entire IPv4 space used by the agency, a number only the address plan supplies.

One correction: an authorization boundary isn't defined by IP ranges. SaaS components may hold no agency address. And IPAM can't see installed software, patch state, owner, classification, boundary membership, relationships, or address-less assets like smart cards and HSMs. So IPAM is the join key and a CMDB is the asset record. The program sets requirements rather than naming a product. A proof of concept tests one managed laptop joining MDM record, lease, certificate and FQDN; an unenrolled device appearing within one lease cycle; and two owners who can't see each other's assets.

Software-defined networks have no broadcast. Azure assigns from the subnet and reserves five addresses. AWS reserves five too, with the Amazon DNS server at the VPC base plus two, which is a DNS server, not a DHCP responder. NSX handles DHCP at the logical gateways, and VCF 9.1 integrates natively with an enterprise IPAM. So the plan lives above all of them.`,
  "Book 10, Chapter 06 — IPAM and Network as Code, \"The address plan is the join key,\" \"What IPAM can't see,\" \"Addresses without broadcast.\"");
}

// ================================================================== 22 Mirror and enforce
{
  const s = content(P2, "Mirror the authority, enforce the pool");
  tag(s, "How");
  img(s, "ch06-address-authority", 0.6, 1.5, 2.2, 4.95);
  const pb = panel(s, "Pattern", 3.05, 1.5, 4.7, null, HEX.navy, HEX.navyTint, "THE PATTERN (DESIGN GUIDANCE)", null, [
    "Reserve first in the enterprise IPAM",
    "Mirror: the root pool holds the Azure range; outside ranges are static CIDRs",
    "Enforce: Azure Policy denies a VNet with no pool allocation",
    "Reconcile by DDI discovery; a mismatch is a finding",
  ], 13.5);
  panel(s, "AVNM", 3.05, pb + 0.2, 4.7, null, HEX.teal, HEX.tealTint, "VIRTUAL NETWORK MANAGER IPAM", null, [
    "Pools up to seven layers; IPv4 and IPv6; IPAM Pool User role",
    "A VNet asks for a size; the pool picks the prefix",
  ], 13.5);
  panel(s, "Check", 8.0, 1.5, 4.75, null, HEX.red, HEX.redTint, "A BOUNDARY CHECK ON THE SERVICE", "Not in the audit-scope tables", [
    "Virtual Network Manager isn't named (Feb. 2026); VNet, DNS, Firewall and Private Link are",
    "Until confirmed in writing: confirm, carry an exception, or reconcile by discovery alone",
    "Infoblox Government Cloud: Class C, certified Dec. 15, 2022; read its current scope",
    "An on-premises DDI grid is in the agency's boundary and inherits nothing",
  ], 14);
  sources(s, "Sources: Microsoft Learn — AVNM IPAM, IPAM pools in Bicep, prevent overlap with Policy and IPAM, Azure FedRAMP audit scope; FedRAMP Marketplace (Oct. 21, 2026). Book 10, Ch 06.");
  notes(s,
`Azure Virtual Network Manager's IPAM creates a root pool and child pools up to seven layers. Virtual networks allocate non-overlapping CIDRs; static CIDRs reserve ranges in use outside Azure; IPv4 and IPv6 are supported; one pool can serve several regions; and the IPAM Pool User role lets teams consume a pool without managing it. Microsoft lists it as generally available wherever Virtual Network Manager is, except six regions, none in the United States.

The pattern keeps the enterprise IPAM authoritative. Reserve first in the enterprise IPAM. Mirror: the Azure root pool holds the Azure range, and every overlapping range used elsewhere goes in as a static CIDR so Azure can't hand it out. Enforce: Virtual Network Manager doesn't stop overlap on its own; Microsoft's documented fix is a policy that denies any virtual network without an allocation from the designated pool. A virtual network then asks for a size, and the pool picks the prefix. Then reconcile with DDI discovery; a mismatch is a finding. The Bicep and policy samples are in the chapter, illustrative and untested; roll out audit first.

Now the book's argument in miniature. Virtual Network Manager isn't named in Microsoft's FedRAMP audit-scope tables for either cloud, last updated February 2026, while Virtual Network, DNS, Firewall and Private Link are. Until Microsoft confirms it in writing, record the pool as a dependency and pick a Chapter 09 path. Check the enterprise IPAM's own status too: Infoblox Government Cloud is Class C, and its listing now covers Universal DDI and Universal Asset Insights.`,
  "Book 10, Chapter 06, \"Azure: mirror the authority, enforce the pool,\" \"A boundary check on the IPAM service itself.\"");
}

// ================================================================== 23 Network as code
{
  const s = content(P2, "Network as code: five modules in dependency order");
  tag(s, "How");
  img(s, "ch06-module-layers", 0.6, 1.5, 4.3, 4.0);
  table(s, "Modules", 1.5, [1.05, 3.1, 1.35, 2.15], ["Module", "Owns", "Depends on", "Substitution"], [
    ["platform", "Management groups, subscriptions or accounts, organization policy", "—", "Control Tower with Landing Zone Accelerator"],
    ["ipam", "Address allocation and the subnet plan: the source of truth", "platform", "AWS VPC IPAM"],
    ["ddi", "Authoritative DNS, DNSSEC, response policy zones, DHCP scopes", "ipam", "Another DDI platform; Route 53"],
    ["network", "Hub and spoke, segmentation, firewall and route intent", "ipam", "VPC and AWS Network Firewall"],
    ["edge", "The SASE or TIC 3.0 enforcement point capability set", "network, ddi", "Another SASE provider's code"],
  ], { fontSize: 11.5, x: 5.1, firstColor: HEX.teal });
  callout(s, "Inputs", 5.65, 0.85, "FaArrowsRotate", HEX.amber, "External inputs arrive as code: ",
    "Microsoft 365's web service has four instances and GCC uses Worldwide; poll /version at most hourly and fetch only on change.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (SC-7, SC-20 to SC-22, CM-2(2), CM-8(1), AC-4), SP 800-53B; Microsoft Learn — M365 IP and URL web service. Modules are program design. Book 10, Ch 06.");
  notes(s,
`The landing zone, the address plan and the network can all be built from reviewed source. The program's compliance volume organizes the build as five modules, each owning one plane and depending only on the layers beneath it. Each module writes its deployed state to the evidence record, and the ipam module's output is what makes the CM-8 join possible. The substitution column is the point of naming mechanisms rather than products: changing vendors changes syntax and connectors, not what the module does.

The naming module declares its properties instead of clicking them: an authoritative, DNSSEC-signed zone for SC-20; a validating resolver for SC-21; separate authoritative and recursive resources for SC-22; query logging for AU-12; a response policy zone on a named Protective DNS feed, starting log-only, for SC-7 and SI-4; and the zone identifier as an output the inventory join consumes.

Deploy in order through the change-controlled pipeline, never a portal: platform, then ipam, then ddi and network; run the response policy zone log-only first, then enforce; register the ipam output as the authoritative inventory source; and point the edge at the ddi resolver.

Some inputs change underneath the code. Microsoft 365's web service has four instances, and a GCC tenant uses Worldwide, so blocking commercial endpoints would block GCC itself. Entries update at the start of each month, with 30 days' notice before new endpoints are used. Each change becomes a pipeline change, so the lag is bounded and recorded. CM-2(2) and CM-8(1) state why reproducible matters: a scanner can only measure drift from a source of truth.`,
  "Book 10, Chapter 06, \"Network as code,\" \"Inputs that change underneath the code,\" \"Why reproducible matters.\"");
}

// ================================================================== 24 Front door
{
  const s = content(P2, "The front door: six steps from request to closed change");
  tag(s, "How");
  img(s, "ch07-provisioning-loop", 0.6, 1.5, 4.2, 4.95);
  const b = table(s, "Loop", 1.5, [5.6, 2.15], ["Step (order is design guidance)", "Control evidenced"], [
    ["1  Request: typed catalog variables, not free text", "CM-3"],
    ["2  Approve: the requester can't approve their own", "AC-5, CM-5, CM-3"],
    ["3  Plan: the approver reviews a speculative plan", "CM-3, CM-3(2)"],
    ["4  Apply: deployed state equals reviewed source", "CM-2, CM-3"],
    ["5  Reconcile: allocation checked with the IPAM; CMDB updated", "CM-8, CM-8(1)"],
    ["6  Close: validation gate; change record is evidence", "CM-3, AU-2"],
  ], { fontSize: 12, x: 5.0 });
  noteBox(s, "Step5", 5.0, b + 0.2, 7.75, null, HEX.teal, HEX.tealTint, "STEP 5 CARRIES THE MOST WEIGHT",
    "An unreconciled block is shadow inventory. The pipeline writes the allocation back with request number and owner, and fails the run on any mismatch.", 12.5);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-5, CM-2, CM-3, CM-5, CM-8), SP 800-53B Moderate; Microsoft Learn — subscription vending; CISA BOD 23-01. Book 10, Ch 07.");
  notes(s,
`A module any engineer with credentials can apply is no more controlled than the portal it replaced. CM-3 asks for proposed changes to be reviewed and approved with explicit consideration of security and privacy impact, decisions documented, only approved changes implemented, and records kept. Code supplies the reviewable artifact, not the approval, the record or the guarantee. CM-3(2) adds testing before changes are finalized, and CM-8(1) inventory updates as part of installation, not afterward; all are in the Moderate baseline.

Microsoft calls its version subscription vending, "an official front door": request capture and approval inside the existing ITSM tool, tied to the deployment pipeline; intake of budget, owner, networking and classification, so the subscription lands in the right management group; an IPAM system in the vending process; the platform team always creating the virtual networks that peer to the hub; and access set at creation, with PIM for groups.

The loop's step names and order are the program's design. Separation of duties is AC-5; CM-5 restricts who can make changes, which is the pipeline identity that alone may apply.

Step 5 carries the weight. An address block that code allocated but never reconciled is shadow inventory the moment it exists: CM-8 fails, and BOD 23-01's weekly discovery chases a range the agency's records don't contain. So the pipeline asks the IPAM for the block, or confirms the pool's choice against the enterprise reservation, writes the allocation back with the request number and owner, and fails the run if the two disagree.`,
  "Book 10, Chapter 07 — The Landing Zone Front Door, \"Why code isn't change control by itself,\" \"Microsoft's model: subscription vending,\" \"The provisioning loop.\"");
}

// ================================================================== 25 Building the loop
{
  const s = content(P2, "Building the loop, and why the pipeline is in scope");
  tag(s, "How");
  const tb = table(s, "Build", 1.5, [2.2, 2.35, 2.25], ["Integration", "Where Terraform runs", "Plan approval"], [
    ["ServiceNow CPG, Terraform connector", "Linux or Windows server, or Terraform Enterprise or Cloud, via a MID Server", "No plan-review step described"],
    ["HashiCorp ServiceNow Catalog 2.9 (Oct. 2025)", "HCP Terraform", "Plan-only run to an approver; rejected runs discarded"],
  ], { fontSize: 13.5 });
  const sb = panel(s, "Scope", 7.65, 1.5, 5.1, null, HEX.red, HEX.redTint, "THE PIPELINE IS INSIDE THE BOUNDARY", null, [
    "State and plan files hold secrets, even values marked sensitive",
    "Marketplace, Oct. 21, 2026: no HCP Terraform listing; GitHub Enterprise Cloud Class B; GitLab Dedicated for Government Class C",
    "Default: self-hosted runner and state backend in the boundary",
    "Vending identities can't use PIM: prefer managed identities",
  ], 14);
  const nb = noteBox(s, "Same", 0.6, tb + 0.25, 6.8, null, HEX.navy, HEX.navyTint, "THE REQUIREMENT EITHER WAY",
    "The approver sees the plan that will be applied, and an approved plan is applied without being regenerated.", 14);
  callout(s, "Drift", Math.max(sb, nb) + 0.25, 0.95, "FaArrowsRotate", HEX.amber, "After apply: ",
    "Azure Policy watches for drift; a finding opens a request through the same front door, and a portal fix without one is itself a finding.");
  sources(s, "Sources: ServiceNow CPG Terraform catalog item; HashiCorp — ServiceNow Catalog approval (Oct. 2, 2025), sensitive data; FedRAMP Marketplace (Oct. 21, 2026). Book 10, Ch 07.");
  notes(s,
`Two documented integrations can carry the loop on ServiceNow and Terraform. ServiceNow Cloud Provisioning and Governance creates a catalog item from a Terraform template; the provider type decides where Terraform runs, on a Linux or Windows server or Terraform Enterprise or Cloud, reached through a MID Server; credentials come from Terraform variables, not templates; and its instructions describe no plan-review step. HashiCorp's ServiceNow Service Catalog for Terraform, version 2.9 in October 2025, generates a plan-only run for a designated approver; on acceptance an apply run provisions, and on rejection the run is discarded and nothing changes. ServiceNow's Government Community Cloud is Class D.

The pipeline is inside the boundary. HashiCorp warns that secrets end up in state and plan files, values marked sensitive are still stored there, and anyone with access can read them. As of October 21, 2026 the Marketplace has no HCP Terraform listing, GitHub Enterprise Cloud is Class B under LI-SaaS, and GitLab Dedicated for Government is Class C. None forbids a tool; each inherits a matching certification, is carried in the package, or takes an exception. The program's default is a self-hosted runner and state backend inside the boundary. Vending identities can't use PIM, so they hold standing access.

After apply, policy re-evaluation catches drift. Plans that destroy or replace get a second approver; break-glass use is an exception to review; and keep modules small enough that plans get read.`,
  "Book 10, Chapter 07, \"Building the loop on ServiceNow and Terraform,\" \"The pipeline is inside the boundary too,\" \"After apply: drift,\" \"Honest limits.\"");
}
endModule("Module 3");

// ================================================================== 26 Module 4 divider
{
  const s = divider(P2, "Module 4: Who owns it, and the package", "Part 2 — Building it and owning it  ·  Chapters 08, 11, Appendix A",
    ["One decider per row, and the roles behind each", "The boundary record and the agency's half of the package", "Narratives, ongoing review and what to ask a provider"], 12);
  notes(s,
`Module 4: who owns the boundary, and how it lands in the authorization package. A cloud boundary has more owners than anything else in the workbook, and the gaps between them are where features quietly disappear. We'll name one decider per row, then write the boundary down once, as a record that the system security plan, the POA&M, the component definition and continuous monitoring all cite. Then control narratives at the boundary, keeping the package current, and what to ask a provider for.`,
  "Book 10, Chapters 08 and 11; Appendix A.");
}

// ================================================================== 27 Owners
{
  const s = content(P2, "One decider per row: who owns the boundary");
  tag(s, "Who");
  img(s, "ch08-boundary-owners", 0.6, 1.5, 5.0, 4.95);
  table(s, "Matrix", 1.5, [3.35, 1.7, 2.1], ["Decision (design guidance)", "Decides", "Does the work"], [
    ["Authorization boundary in scope", "Authorizing official", "System owner"],
    ["Boundary record and package current", "System owner", "System owner, ISSO, platform"],
    ["Landing zone design and policy", "Platform team", "Platform team"],
    ["Placing a new workload", "System owner", "Platform, workload owners"],
    ["Feature dependency vs dispositions", "System owner", "Platform, workload owners"],
    ["Documented exception, with end date", "Authorizing official", "System owner"],
    ["Provider change notice: risk change?", "Authorizing official", "System owner, CISO and ISSO"],
    ["Contract, SKU, shared responsibility", "Contracting officer", "Contracting officer"],
  ], { fontSize: 12.5, x: 5.6 });
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (P-11, R-4, App. D, G); FedRAMP 2026 agency use and responsibilities; FAR 1.602-1; Microsoft Learn — shared responsibility; Marketplace. Book 10, Ch 08.");
  notes(s,
`The 2026 rules assign two boundaries to two owners: the provider owns the service and its certification; the agency owns its own system and everything it builds, configures and connects inside it. The roles come from four sources. SP 800-37 gives the authorizing official the boundary decision, with input from the system owner, and says explicit acceptance of risk can't be delegated; a designated representative can run the process, not sign, and the role is assigned to government personnel only. The FedRAMP agency rules supply the provider-agency split. Microsoft's shared responsibility model keeps data, configuration and identities with the customer in every service model.

The matrix is design guidance; adapt it, but keep one decider per row. Five rows deserve comment. The boundary row goes to the authorizing official, with the system owner doing the work, because a boundary drawn by the team that builds the landing zone follows the landing zone rather than the mission. Placement goes to the system owner, not the platform team: vending a subscription nobody recorded is the cheapest way to make an authorized system unauthorized. Feature dependency is the row the invisible boundary punishes. Exceptions split: agency-side is a risk acceptance for the authorizing official; a provider-side request is the system owner's call. And only the agency head or a delegate can require more than FedRAMP does.

Acquisition decides more than people expect: the GCC listing says customers must buy a GCC SKU to be covered, and only contracting officers can change the contract. Across the four dimensions, the CISO decides telemetry evidence and identity trust rules, the authorizing official enforcement, and the ISSO how derived evidence is labeled.`,
  "Book 10, Chapter 08 — Who Owns the Boundary, \"Where the roles come from,\" \"The responsibility matrix,\" \"An owner for each impact dimension.\"");
}

// ================================================================== 28 Boundary record
{
  const s = content(P2, "The boundary record: write it once, cite it everywhere");
  tag(s, "How");
  img(s, "ch11-package-map", 0.6, 1.5, 5.9, 4.05);
  table(s, "Package", 1.5, [2.05, 2.95, 1.0], ["Package artifact", "What the boundary contributes", "Basis"], [
    ["SSP: boundary", "The boundary the AO determined, and every connection", "P-11, PL-2"],
    ["SSP: external services", "Each service, its package and class, and oversight roles", "SA-9"],
    ["SSP: information exchanges", "Each crossing that isn't the service: trusts, connectors, links", "CA-3"],
    ["POA&M", "Gaps the agency will close; not provider findings", "CA-5"],
    ["Component definition", "Each in-boundary equivalent, in OSCAL", "OSCAL"],
    ["Continuous monitoring", "Probe reruns, drift citing the boundary, provider notices", "CA-7"],
  ], { fontSize: 11.5, x: 6.75 });
  callout(s, "Half", 5.7, 0.8, "FaFileShield", HEX.navy, "The agency's half: ",
    "only what it implements, configures, operates or inherits; never provider control text pasted into the SSP.");
  sources(s, "Sources: NIST SP 800-37 Rev. 2, SP 800-53 Rev. 5 (PL-2, SA-9, CA-3, CA-5, CA-7); NIST OSCAL; FedRAMP 2026 agency use, responsibilities, Rev5 packages. Book 10, Ch 11.");
  notes(s,
`An agency never authorizes a cloud service; it authorizes its own system, and stays responsible for its own ATO or ATU even when it relies on a FedRAMP certification. SP 800-37 says the system owner assembles the package: security and privacy plans, assessment reports, POA&Ms and an executive summary. When controls come from an external provider, the agency ensures the provider makes the needed information available.

The 2026 rules say what the agency's half contains: only what the agency implements, configures, operates or inherits. Don't paste provider controls into the agency SSP, and don't blindly copy provider findings into agency POA&Ms. Review the provider's package and secure configuration guides and configure accordingly; notify FedRAMP with the ATO letter; and run governance tools that produce and ingest OSCAL and JSON.

The boundary record, kept by the system owner, holds in-scope services, tenants, subscriptions and connections, probe dispositions, the exclusion register, equivalents with their evidence class, and exceptions. Everything cites it rather than restating it, so when the probe sees a change, one record changes and every narrative is current. SA-9 is where the responsibility matrix and the three-party split get written into the plan: oversight roles and ongoing monitoring of the provider. CA-3 is where most crossings that aren't the service belong: a federated trust, a connector copying data out, a private link, each an exchange with an agreement. And drift findings cite the boundary they crossed, for example provenance drift at the GCC Moderate edge, so remediation scope is explicit.`,
  "Book 10, Chapter 11 — Evidencing the Boundary in the Authorization Package, \"What the package is,\" \"The boundary as one artifact\"; Chapter 08, \"Three parties, not two.\"");
}

// ================================================================== 29 Narratives
{
  const s = content(P2, "Narratives at the boundary, and whose package you read");
  tag(s, "How");
  const b = table(s, "Patterns", 1.5, [1.75, 2.85, 4.15], ["Pattern", "When it applies", "What the narrative says"], [
    ["Inherited", "The provider implements it for the service", "Which package and control; that the agency reviewed it"],
    ["Shared", "Provider part, agency part", "The provider's part by reference; the agency's in full, with guide settings"],
    ["Agency-implemented", "Entirely the agency's, agents included", "How the agency implements it"],
    ["Compensating", "A needed capability is outside the boundary", "What's missing, cited; what the equivalent covers; marked derived"],
  ], { fontSize: 12 });
  noteBox(s, "Four", 0.6, b + 0.2, 8.75, null, HEX.teal, HEX.tealTint, "A COMPENSATING NARRATIVE IN FOUR SENTENCES",
    "What the control needs. What the provider documents as unavailable here, cited. What the agency runs instead, what it does and doesn't cover, marked derived. Where the remaining gap is recorded.", 12.5);
  panel(s, "Chain", 9.6, 1.5, 3.15, null, HEX.navy, HEX.navyTint, "THE INHERITANCE CHAIN", null, [
    "GCC \"leverages Azure Government as the IaaS/PaaS\"",
    "Name both packages and the GCC SKU",
    "Listing's trust-center and guide fields empty (Oct. 21, 2026): get them via the package",
  ], 12.5);
  sources(s, "Sources: FedRAMP 2026 agency responsibilities, MAS; Marketplace MSO365MT, F1603087869, F1209051525 (Oct. 21, 2026); Microsoft Learn — FedRAMP offering FAQ. Book 10, Ch 11.");
  notes(s,
`Most controls aren't affected by the boundary. The ones that are fall into four patterns, and naming the pattern in each narrative lets an assessor follow it. Inherited: which package and control, and that the agency reviewed it. Shared: the provider's part by reference and the agency's part in full, including the settings from the secure configuration guide, evidenced by configuration exports and policy assignments. Agency-implemented: entirely the agency's, including agents and clients on agency systems, which the 2026 rules place outside FedRAMP and therefore inside the agency's scope. Compensating: a capability the control relied on is outside the boundary, and an equivalent does part of the work, with a POA&M entry or signed exception for the remainder.

The compensating pattern is easy to write badly. Naming the commercial capability as if it were in use, because it shows in the portal, is the invisible-boundary failure. Hiding the substitution is nearly as bad. A good one has the four sentences on the slide.

Know whose package you're reading. The Marketplace record for GCC says it leverages Azure Government as the IaaS and PaaS, relies on Azure Government-inherited services and refers readers to that package, and says customers must buy a GCC SKU to be covered. So the chain runs through two provider packages before it reaches the agency; name both, and the SKU. The same record had empty trust-center and configuration-guide fields on October 21, 2026. That isn't evidence the guidance doesn't exist; get it through the package and record where it came from. And Microsoft says customers need their own authorizations for components outside its services, which is exactly what the boundary record lists.`,
  "Book 10, Chapter 11, \"Know whose package you are reading,\" \"Writing control narratives at the boundary.\"");
}

// ================================================================== 30 Keeping current
{
  const s = content(P2, "Keeping the package current: one review, one decider");
  tag(s, "How");
  const im = img(s, "ch11-ongoing-review", 0.6, 1.5, 6.3, 3.45);
  noteBox(s, "Inputs", 0.6, im.bottom + 0.2, 6.3, null, HEX.navy, HEX.navyTint, "THREE INPUTS, ONE QUESTION",
    "Provider change notices, ongoing certification reports with Quarterly Reviews, and the probe and drift findings. Does this change a disposition, an equivalent or an exception?", 12.5);
  table(s, "Assessor", 1.5, [3.95, 1.75], ["What an assessor should find", "Where"], [
    ["The boundary matches what the landing zone contains", "SSP; record; drift report"],
    ["Each service named with package, class, chain and SKU", "External services"],
    ["No provider control text copied; inheritance by reference", "Control narratives"],
    ["Every design dependency has a dated disposition", "Boundary record"],
    ["Every gap on the POA&M or in a dated, signed exception", "POA&M; exceptions"],
    ["Notices and reports have a named reviewer and a record", "Continuous monitoring"],
  ], { fontSize: 11.5, x: 7.05 });
  sources(s, "Sources: FedRAMP 2026 — SCN, Collaborative Continuous Monitoring, agency use, timeline, Rev5 Class C, CDS; NIST SP 800-37 (App. F), SP 800-53 CA-7; NIST OSCAL. Book 10, Ch 11.");
  notes(s,
`A package describes the system on the day it was signed, and the boundary moves in both directions after that. Three inputs feed one review. Provider change notices: none for routine recurring changes, 10 business days after adaptive ones, at least 30 business days ahead of transformative ones, in JSON, with 12 months kept. SP 800-37 says it's incumbent on the customer to make sure the provider shares monitoring information and notifies it of significant changes. Ongoing certification reports and Quarterly Reviews: agencies must review each report against the risk tolerance in their authorization, should designate a senior information security official to represent them, and must tell FedRAMP of a serious concern. And the agency's own signals, the probe rerun and drift detection, are continuous monitoring under CA-7.

Anything that may change risk goes to the authorizing official, who decides whether it's a significant change, one likely to substantively affect the security or privacy posture. A provider removing a capability a compensating narrative depends on, or restoring one an exception covers, is exactly that kind of change.

Two models run at once: mandatory adoption on January 1, 2027, no new Rev5 requests after June 11, 2027, and the scope, change and data-sharing families apply to Rev5 Class C as well. Keep the record independent of either model, pull trust-center data programmatically where a provider has one, and use OSCAL: the SSP and component definition in its implementation layer, the POA&M in its assessment layer. The table is what an assessor should find, including that FedRAMP was notified with the authorization letter.`,
  "Book 10, Chapter 11, \"Keeping the package current,\" \"Two models at once,\" \"What an assessor should find.\"");
}

// ================================================================== 31 What to ask
{
  const s = content(P2, "What to ask a cloud provider for, with the basis");
  tag(s, "How");
  const b = table(s, "Asks", 1.5, [0.6, 5.3, 6.25], ["#", "Request", "Rule or documented basis"], [
    ["A1", "The per-feature exclusion list, as data", "The provider's per-feature notes; extends CDS-CSO-SVC and -PUB"],
    ["A2", "The exception path for each feature", "ExpressRoute for Microsoft 365 authorization process"],
    ["A3", "Network observability in GCC, or the named obstacle", "Admin-center network connectivity documented as not in GCC"],
    ["A4", "What each certification would and wouldn't change", "Same-named packages; a class change needs a new assessment"],
    ["A5", "Delivered software outside the offering", "MAS-CSO-IIR guidance on agents and clients"],
    ["A6", "A trust center with programmatic access", "CDS-CSO-UTC; CDS-TRC-USH, -PAC, -ACL"],
    ["A7", "Change notifications as a JSON feed", "SCN-CSO-HRM, -HIS, -NOM"],
    ["A8", "Cryptographic modules per service, with CMVP status", "CMU-CSO-CMD, -UVM, -CAT"],
  ], { fontSize: 13.5 });
  callout(s, "Deflect", b + 0.25, 0.9, "FaListCheck", HEX.amber, "Hard to deflect: ",
    "name the item, cite the basis, ask for data rather than documents. A documented \"no\" is evidence too.");
  sources(s, "Sources: FedRAMP 2026 — CDS, SCN, CMU, MAS; Marketplace (Oct. 21, 2026); Microsoft Learn — network connectivity, ExpressRoute for M365, GCC service description. Book 10, App. A.");
  notes(s,
`"Give us commercial parity" can't be answered. A specific question tied to a published rule or exclusion can. Three habits make an ask hard to deflect: name one item, cite the basis with a link, and ask for data, not documents. Microsoft's ExpressRoute process sets the standard, and a provider that uses it for its own exceptions can't object to it being used in return.

The eight requests. A1: publish the per-feature exclusion list as data, with a stable identifier and a date per entry; FedRAMP already requires a public services list, and this extends it to features. A2: name the exception path per feature, remembering that FedRAMP and FISMA don't supply the regulatory trigger by themselves. A3: restore the network observability layer in GCC, or publish the specific obstacle: which data, which processing location, which control. A4: explain the same-named packages, the target date, and which exclusions, if any, Class D would lift. A5: list delivered agents and clients, and whether each is operated under shared responsibility. A6: a FedRAMP-compatible trust center with programmatic access; on October 21, 2026, none of the three Microsoft 365 government packages showed one. A7: change notifications as a JSON feed, with the 12-month history and the notification mechanism documented. A8: cryptographic modules per service with CMVP status and tenant defaults; NIST moved all FIPS 140-2 certificates to the Historical List on September 22, 2026, so validation status is a live question.

A1, A5, A6, A7 and A8 rest on obligations the rules already place on providers. Record each request, its date and the answer in the package.`,
  "Book 10, Appendix A — What to Ask a Cloud Provider For.");
}

// ================================================================== 32 Decisions
{
  const s = content(P2, "Decisions to make, and the first week's work");
  tag(s, "How");
  table(s, "Decisions", 1.5, [4.8, 2.35, 0.9], ["Decision (design guidance)", "Who decides", "Ch."], [
    ["The authorization boundary, before workloads arrive", "AO; system owner keeps the record", "08, 11"],
    ["A cited register; designs built only on confirmed rows", "System owner", "02, 04, 09"],
    ["A response per gap: equivalent, exception, other path or none", "AO decides exceptions", "09, 10"],
    ["Boundary policy at the intermediate root, audit then Deny", "Platform team; ISSO reviews", "05"],
    ["The enterprise IPAM as authority; the pool dependency recorded", "System owner; DDI team", "06"],
    ["No landing zone without a request; runner and state inside", "System owner; platform team", "07"],
  ], { fontSize: 13 });
  panel(s, "Week", 8.85, 1.5, 3.9, null, HEX.teal, HEX.tealTint, "NO PROCUREMENT NEEDED", "Start this week", [
    "Re-cite every row of the gap list in use",
    "Read each service's Marketplace class, with the date",
    "Allowed locations in audit at the intermediate root",
    "Find subscriptions under the tenant root; set a default group",
    "Name the reviewer for provider change notices",
  ], 14);
  sources(s, "Sources: Book 10, Chapters 01–11 and Appendix A. Decisions, owners and sequence are program design guidance.");
  notes(s,
`So, the decisions, each with an owner, all of them design guidance. The authorizing official determines the authorization boundary, meaning the services, tenants, subscriptions and connections, before workloads arrive, and the system owner keeps the record. The system owner, with the platform team, rebuilds the gap register with a citation per row and builds designs only on confirmed rows. For each gap, the system owner proposes a response, an equivalent, an exception, an alternative path or going without, and the authorizing official decides the exceptions. The platform team assigns boundary policy at the intermediate root in audit, reviews it with the ISSO, and then switches to Deny. The system owner, with the DDI team, keeps the enterprise IPAM as the authority and records the Virtual Network Manager dependency. And no landing zone stands up without a request, with the runner and state inside the boundary.

Five things to start this week that need no procurement. Re-cite every row of the gap list the agency already relies on, and relabel the rows that can't be cited. Read the Marketplace listing and class for each service in use, with the date. Assign Allowed locations in audit mode at the intermediate root. Find any subscription sitting under the tenant root, and set a default management group. And name the reviewer for provider change notices.

The license says what you bought; the boundary says what you may use. Write the boundary down once, cite it everywhere, and keep it current. Chapters 01 through 11 and the appendices carry the detail, every claim footnoted and every code sample marked illustrative. Thank you.`,
  "Book 10, Chapters 01–11; Appendix A.");
}
endModule("Module 4");

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
const sourceSlide = (title, src) => {
  const s = content("Backup", title);
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
  const need = 1.5 + src.reduce((a, t) => a + lines(t, 11.8, 12) * 12 / 72 * 1.2 + 0.07, 0);
  if (need > 6.6) console.warn(`  ! ${title} source list may overflow: needs ${need.toFixed(2)}`);
};
sourceSlide("Sources behind the orientation and Module 1", [
  "FedRAMP Consolidated Rules for 2026: Using a FedRAMP Certified Cloud Service; Definitions; Important Dates; Scope of FedRAMP (quoting OMB M-24-15); Minimum Assessment Scope (MAS-CSO-IIR, FLO, TPR, MDI, SUP).",
  "FedRAMP Consolidated Rules for 2026: Certification Data Sharing (CDS-CSO-PUB, SVC, UTC; CDS-TRC-USH, PAC, AAI, ACL, HMR, SSM; CDS-UTC-AAD); Significant Change Notification; Cryptographic Module Use; Rev5 rulesets.",
  "FedRAMP machine-readable ruleset fedramp-consolidated-rules.json, version 2026.10.13.01.  ·  Notices NTC-0004 (Feb. 25, 2026) and NTC-0013 (June 16, 2026).  ·  FedRAMP Marketplace products.json (Oct. 21, 2026).",
  "NIST CSRC glossary, \"authorization boundary\" (SP 800-37 Rev. 2 and SP 800-53 Rev. 5, from OMB Circular A-130).",
  "Microsoft Learn: network connectivity in the admin center; informed network routing; Adoption Score; Office 365 CDN quickstart; Windows release health; Office application availability in Government plans.",
  "Microsoft Learn: Azure, Dynamics 365, Microsoft 365 and Power Platform compliance scope; Office 365 GCC service description; Cloud feature availability for US Government; Intune for US Government GCC High and DoD.",
  "Microsoft Learn: Endpoint analytics overview; Advanced Analytics overview.",
  "Full footnotes with links and access dates: Book 10, Chapters 01–03.",
]);
sourceSlide("Sources behind Module 2 — GCC, the gap, three responses", [
  "Microsoft Learn: GCC High endpoints and endpoint list navigation; Azure feature availability (Microsoft 365 integration); Office 365 GCC service description; additional network requirements for GCC High and DoD.",
  "Microsoft Learn: network connectivity in the admin center; network assessment; Network Insights; network provider details and attribution; network connectivity test tool; Adoption Score; INR; Office 365 CDN.",
  "FedRAMP Marketplace products.json (Oct. 21, 2026): MSO365MT, MSO365MTA, FR1824057433, F1206081364, FR2604952026, FR1825941347A, F1511207635, FR1823447014, FR2230252267, F1212191840A.",
  "NIST SP 800-37 Rev. 2 (Task R-4, App. G); SP 800-53 Rev. 5 (CA-5).  ·  FedRAMP 2026: MAS, SCN, Agency Use (AGU-AGC-NAR, -TPP), Rev5 Class C, timeline.",
  "Microsoft Learn: Azure ExpressRoute for Microsoft 365; Assessing enterprise network last mile; Microsoft 365 Network Provider Program; Set up your network; Managing Microsoft 365 endpoints.",
  "Google Cloud: FedRAMP and DoD compliance scope (Workspace); public-sector blog, Dec. 5, 2025.  ·  Google Workspace Admin Help: Setting up SSO; Super administrator SSO.",
  "Microsoft Learn: Google Workspace automatic user provisioning with Entra ID; Google SSO with Entra ID; Conditional Access target resources.",
  "Public reporting: Nextgov/FCW (Oct. 29 and Dec. 29, 2025; Oct. 16, 2026); government-wide pricing agreement announcements (Apr. 10 and Aug. 21, 2025); Stars and Stripes and service news (Feb. 28, 2025).",
  "Full footnotes with links and access dates: Book 10, Chapters 04, 09 and 10.",
]);
sourceSlide("Sources behind Module 3 — Landing zone and front door", [
  "Microsoft Learn (Cloud Adoption Framework): What is an Azure landing zone; landing zone FAQ; design areas; implementation options; Deploy Azure landing zones (sovereign clouds); management groups; subscription vending.",
  "Microsoft Learn: compliance scope (Feb. 2026); Azure FedRAMP offering; Compare Azure Government and global Azure; built-in policies; disallowed resources; FedRAMP Moderate initiative; exemption structure.",
  "Microsoft Learn: Azure Policy effect basics and deny; What is Azure Policy; get compliance data; Virtual Network FAQ; AVNM IPAM concept, Bicep pools and static CIDRs, preventing overlap with Policy.",
  "AWS: Organizations service control policies; Control Tower in AWS GovCloud (US); Landing Zone Accelerator implementation guide; Amazon VPC subnet sizing.",
  "NIST SP 800-53 Rev. 5 release 5.2.0 (AC-4, AC-5, CM-2, CM-2(2), CM-3, CM-3(2), CM-5, CM-8, CM-8(1), SC-7, SC-20 to SC-22); SP 800-53B Moderate profile; SP 800-37 Rev. 2.",
  "CISA BOD 23-01 (Oct. 3, 2022).  ·  FedRAMP KSIs: PIY-GIV; CMT-LMC, -VTD, -RMV.  ·  Microsoft Learn: Microsoft 365 IP Address and URL web service.",
  "ServiceNow: CPG catalog item from a Terraform template.  ·  HashiCorp: ServiceNow Catalog approval workflow (Oct. 2, 2025); managing sensitive data in Terraform.",
  "FedRAMP Marketplace (Oct. 21, 2026): Azure (F1209051525), Azure Government (F1603087869), AWS GovCloud, AWS US East/West, Infoblox Government Cloud, ServiceNow GCC, GitHub Enterprise Cloud, GitLab Dedicated.",
  "Full footnotes with links and access dates: Book 10, Chapters 05–07.",
]);
sourceSlide("Sources behind Module 4 — Who owns it, and the package", [
  "NIST SP 800-37 Rev. 2: Tasks P-11, R-1, R-4; Appendix D roles; Appendix F (authorization to use, significant changes); Appendix G (authorization boundaries and external providers).",
  "NIST SP 800-53 Rev. 5: PL-2, SA-4, SA-9, CA-3, CA-5, CA-7.  ·  NIST OSCAL component definition model and layers.  ·  FAR 48 CFR 1.602-1.",
  "FedRAMP 2026: Using a Certified Cloud Service; Agency Use rules (AGU-USE-ABU, RSG, RCF, NFC, DSO; AGU-AGC-NAA, GRC, NAR, TPP); Federal Agencies responsibilities; Rev5 Certification Packages; Certification Packages.",
  "FedRAMP 2026: Collaborative Continuous Monitoring (CCM-AGM-ROR, -CSC); Significant Change Notification (incl. SCN-CSO-NOM); Certification Data Sharing; Cryptographic Module Use; timeline; Rev5 Class C.",
  "FedRAMP Marketplace products.json (Oct. 21, 2026): MSO365MT service description and listing message; Azure Government; Azure Commercial Cloud; trust-center field counts.",
  "Microsoft Learn: Shared responsibility in the cloud; Azure landing zone and subscription vending; FedRAMP offering FAQ; network connectivity; ExpressRoute for Microsoft 365; GCC service description.",
  "NIST FIPS 140-2 certificates moved to the Historical List, Sept. 22, 2026 (as recorded in Book 09, Chapter 03).",
  "Full footnotes with links and access dates: Book 10, Chapters 08 and 11; Appendix A.",
]);

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
