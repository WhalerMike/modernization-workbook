// Book 13 — Governance, Drift & Evidence: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — The record and the drift engine:      Module 1 (Ch02–04, drift, one authoritative record, change control),
//                                                   Module 2 (Ch05–06, deterministic governance and the drift engine).
//   Part 2 — Evidence, owners and authorization:   Module 3 (Ch07–08, evidence over attestation and the adapter model),
//                                                   Module 4 (Ch09–12, who governs, tempo, reciprocity and scale).
// Build:  node presentations/b13-governance-technical/build.js presentations/b13-governance-technical/B13_Governance_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b13-governance/; the notes name the chapter.
// The program's own recommendations are labeled "program design" or "design guidance", federal obligations
// "federal requirement", as the book does.
// Goes deeper than the 15-minute deck (../b13-governance/) and points to the Appendix B reference deck
// (../b13-ticket-to-machine/) for the coordination loop, lanes and tempo rather than repeating them.
// Narration: narration.json (intent-first voice, keyed by slide title) is read by presentations/_build/narrate.py
// (the editor runs that). The notes keep the full detail for a live presenter.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 13", title: "Governance, Drift & Evidence — Technical Deep Dive" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B13_Governance_Technical.pptx";

// ------------------------------------------------------------------ helpers
// The kit's full-width callout, with a fit check (16.5 pt text in a 10.65-inch frame).
const callout = (s, name, y, h, iconName, color, label, text) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * 16.5 / 72) / 10.45) * 16.5 / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (y + h > LIMIT + 0.01) console.warn(`  ! ${name} callout runs into the Sources line: bottom ${(y + h).toFixed(2)}`);
  return D.callout(s, name, y, h, iconName, color, label, text);
};

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

// Rough fit check so tables and lists don't overflow (Calibri averages ~0.5 em per character).
const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// The short Sources line on every content slide: at most 185 characters.
const sources = (s, text) => {
  if (text.length > 185) throw new Error(`sources line over 185 characters (${text.length}): ${text}`);
  return D.sources(s, text);
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
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, w: colW.reduce((a, b) => a + b, 0), h: rowH.reduce((a, b) => a + b, 0), fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`${name} table`, bottom);
  if (o.limit && bottom > o.limit + 0.01) console.warn(`  ! ${name} table runs into the shape below: bottom ${bottom.toFixed(2)}, limit ${o.limit.toFixed(2)}`);
  if (process.env.FIT) console.log(`  table ${name}: bottom ${bottom.toFixed(2)} in`);
  return bottom;
};

// A tinted panel with a small caps label, a heading and bullets. Pass h = null to size it to its text.
// Returns the panel's bottom edge.
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13.5) => {
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08;
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (h == null) h = Math.ceil((need + 0.14 - y) * 20) / 20;
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 16, fontFace: "Cambria", breakLine: true } });
  if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: top - y - 0.14 });
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  if (need > y + h + 0.02) console.warn(`  ! ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  if (y + h - need > 0.75) console.warn(`  ! ${name} panel has ${(y + h - need).toFixed(2)} in of empty space`);
  if (process.env.FIT) console.log(`  panel ${name}: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  if (y + h > LIMIT + 0.01) console.warn(`  ! ${name} panel runs into the Sources line: bottom ${(y + h).toFixed(2)}`);
  return y + h;
};

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

// A committed diagram placed inside a box, keeping the PNG's aspect ratio (read from its header).
// Alt text is the chapter's own fig-alt, read from the chapter so the two can't drift apart.
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b13-governance", "png");
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b13-governance");
const ALT = {};
for (const f of fs.readdirSync(BOOK).filter((n) => n.endsWith(".md"))) {
  const md = fs.readFileSync(path.join(BOOK, f), "utf8");
  for (const m of md.matchAll(/svg\/([a-z0-9-]+)\.svg\)\{#[^}]*?fig-alt="([^"]+)"/g)) ALT[m[1]] = m[2];
}
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
  if (process.env.FIT) console.log(`  image ${name}: ${w.toFixed(2)} x ${h.toFixed(2)}, bottom ${(y + h).toFixed(2)}`);
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

const P1 = "Part 1 — The record and the drift engine";
const P2 = "Part 2 — Evidence, owners and authorization";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "Governance, Drift & Evidence: the technical deep dive", "Book 13 — Governance, Drift & Evidence: the record, the drift engine, evidence and who governs");
  txt(s, "Session map", [
    { text: "Part 1 — The record and the drift engine", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  Drift, the record and change control   ·   Module 2  Deterministic rules and the drift engine", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Evidence, owners and authorization", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Evidence and the adapter model   ·   Module 4  Who governs, reciprocity and scale", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.9, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 13 of the Federal Modernization Workbook, Governance, Drift and Evidence. It's for governance engineers, platform owners and ISSOs: the people who keep an authoritative record true, build the checks that compare the estate with it, and hand an authorizing official evidence they can re-run instead of trust.

It runs in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is the record and the drift engine: why governance decays, drift and its five classes, one authoritative record and the change path into it, then deterministic rules in three layers and the engine that classifies drift and sets severity. Part 2 is evidence, owners and authorization: evidence over attestation and the adapter model, then who governs, ticket to machine, reciprocity and ongoing authorization, and running continuous monitoring at scale.

The 15-minute Book 13 deck covers the argument; this one goes a level down, into the tables and the mechanics. The coordination loop, the five lanes and the tempo are walked through in the narrated Ticket-to-Machine reference deck for Appendix B, so I'll point to it rather than repeat it. The YAML records in the chapters are illustrative, not tested schemas; I'll describe their shape. Where something is the program's own design rather than a federal requirement, the slide says so.`,
  "Book 13, index; Chapters 01–12; Appendices A and B.");
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: a signed package starts aging at once");
  tag(s, "Why");
  subhead(s, "Modes head", "FOUR STRUCTURAL FAILURE MODES (PROGRAM DESIGN)", 0.6, 1.5, 7.3);
  const tb = table(s, "Modes", 1.85, [2.3, 1.85, 3.15], ["Failure mode", "Looks like a…", "Actually needs"], [
    ["Fragmented identity context", "Directory problem", "Resolution rules every consuming system follows, stated once"],
    ["Uncorrelated telemetry", "SIEM problem", "One record shape every source emits before the SIEM sees it"],
    ["Point-in-time evidence", "GRC-tool problem", "Evidence regenerated from the record plus telemetry"],
    ["Tool-shaped policy", "Policy-engine problem", "Intent, platform mapping and enforcement kept separate"],
  ], { fontSize: 13.5, limit: 4.9 });
  const pb = panel(s, "Federal", 8.15, 1.5, 4.6, null, HEX.navy, HEX.navyTint, "THE DESTINATION IS SET: LAW, OMB AND NIST", null, [
    "FISMA: testing \"no less than annually,\" including automated tools",
    "SP 800-137: ongoing awareness, at a frequency that supports risk decisions",
    "SP 800-37 Task M-6: the AO reviews posture on an ongoing basis",
    "A-130: move to ongoing authorization when eligible and approved",
  ], 13.5);
  callout(s, "Automation", Math.max(tb, pb) + 0.3, 1.0, "FaTriangleExclamation", HEX.red, "NIST's own caveat: ",
    "without substantial automation, moving from static to ongoing authorization isn't feasible or practical.");
  sources(s, "Sources: 44 U.S.C. § 3554(b)(5); NIST SP 800-37 Rev. 2 (Task M-6, App. F); SP 800-137 §1, §2.2; OMB Circular A-130, App. I. Failure modes are program design. Book 13, Ch 01.");
  notes(s,
`Why this matters. The week a package is signed, it's true. The next morning an administrator changes a firewall rule to fix an outage, a contractor's role ends but the account stays enabled, a provider ships a new default, and an agent updates itself. Most of it is authorized; none of it reaches the package. The next assessment rediscovers the gap as new findings, and a fresh snapshot starts aging.

The program reads four structural failure modes in that cycle, and it uses them as a diagnostic, not a staffing complaint. Each looks like a tooling gap and isn't: a better policy engine is still a place intent gets trapped, which the Active Directory to Entra ID migration shows: the OU tree's implicit intent has to be found and restated. Every fix sits underneath the tools.

The destination is already federal policy. FISMA sets annual testing as a floor, with automated tools. SP 800-137 defines continuous monitoring as ongoing awareness, at a frequency sufficient for risk decisions. SP 800-37's Task M-6 has the authorizing official review posture on an ongoing basis, and Circular A-130 directs the move to ongoing authorization when a system is eligible and the AO approves. What lags is practice, and NIST says why: without substantial automation, the transition isn't feasible. Checkbox governance raises the frequency and the cost of each manual reassembly together. The program's response is evidence regenerated deterministically from one record.`,
  "Book 13, Chapter 01 — Why Compliance Decays the Day After the Audit, \"Four structural failure modes,\" \"What federal guidance already asks for.\"");
}
endModule("Orientation");

// ================================================================== 3 Module 1 divider
{
  const s = divider(P1, "Module 1: Drift, the record and change control", "Part 1 — The record and the drift engine  ·  Chapters 02–04",
    ["Where drift comes from, and the five classes it falls into", "One authoritative record, its consumer rule and six planes", "The five-clause path, pull requests and closure with proof"], 14);
  notes(s,
`Module 1: drift, the record and change control. Drift can only be measured against something, and it can only stay measured if every change to that something travels one path.

So the module goes in that order. First, what drift is in NIST's terms, the five places it comes from and the five classes the program sorts it into. Then the authoritative record itself: what it holds, how runtime systems consume it without copying it, and the six control planes cut by authority. Then the five-clause path every change travels, the pull request that governs changes to the record, and the rule that no closure counts unless it carries its proof.`,
  "Book 13, Chapter 02 — Drift Is the Primary Threat; Chapter 03 — One Authoritative Record; Chapter 04 — Change Control and Provenance.");
}

// ================================================================== 4 Drift sources
{
  const s = content(P1, "Drift: five sources, silent unless something compares");
  tag(s, "Why");
  img(s, "ch02-drift-sources", 0.6, 1.5, 7.45, 3.8);
  panel(s, "Controls", 8.3, 1.5, 4.45, null, HEX.navy, HEX.navyTint, "SP 800-53, READ TOGETHER", "Drift detection, unnamed", [
    "CM-2: a current baseline under configuration control",
    "CM-3: the only legitimate way to change it",
    "CM-6: settings match, or carry an approved deviation",
    "CA-7: keep checking, at a frequency risk decisions need",
  ], 14);
  callout(s, "Silent", 5.45, 1.0, "FaTriangleExclamation", HEX.red, "Silent by construction: ",
    "each system reports its declared state, which is exactly what drift has moved away from; nothing raises an alarm.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-2, CM-3, CM-6, CA-7); SP 800-37 Rev. 2, Task M-1; SP 800-137 §3.2.2; CISA/NSA AA23-278A. Book 13, Ch 02.");
  notes(s,
`Drift is any difference between what the authoritative record says should be true and what the running estate does: a setting changed and never recorded, an account that outlived its owner, a group rule that stopped evaluating, a change with nothing to show who authorized it.

NIST's catalog doesn't use the word, but four controls read together describe drift detection. CM-2 is the record of what should be true. CM-3 is the only legitimate way to change it. CM-6 says running settings match the record or carry an approved deviation. CA-7 says someone keeps checking and acts on what they find. The program's term covers more than settings: identity facts, group rules, role assignments and the evidence chain can all drift.

The five sources come from SP 800-37's Task M-1. Unauthorized change, from adversaries or, more often, an administrator fixing an outage at two in the morning. Authorized change that never reaches the record, like an emergency approved by phone. Provider change, which NIST says can be difficult to detect. Facts that decay as staff move and leave. And tool and agent updates that move the estate even when each is benign. SP 800-137 calls configuration the most volatile family.

The program ranks drift first among governance threats for three reasons: it's continuous, it's silent, and it's the opening other attacks use. The NSA and CISA red-team advisory lists defaults, privilege separation and patching among systemic weaknesses. Not every misconfiguration is drift, but one that was right at assessment and wrong six months later is exactly what a snapshot can't see.`,
  "Book 13, Chapter 02 — Drift Is the Primary Threat, \"What drift is, in NIST's terms,\" \"Where drift comes from,\" \"Why drift is the primary threat.\"");
}

// ================================================================== 5 Five classes
{
  const s = content(P1, "Five drift classes, each a question asked of the record");
  tag(s, "What");
  const pic = img(s, "ch02-five-classes", 0.6, 1.5, 6.3, 2.3);
  panel(s, "Discipline", 0.6, pic.bottom + 0.25, 6.3, null, HEX.teal, HEX.tealTint, "THE OPERATING DISCIPLINE (PROGRAM DESIGN)", null, [
    "Detect deterministically: same record and state, same findings",
    "Classify deterministically: severity from class and active use",
    "Remediate under contract, within the actuation ladder",
    "Treat findings as evidence in the same chain as everything else",
  ], 14);
  table(s, "Classes", 1.5, [1.45, 2.45, 1.8], ["Class", "What has diverged", "First response"], [
    ["Schema", "Structure no longer fits the declared schema", "Correct the data, or the schema"],
    ["Semantic", "Shape valid; meaning stale or different", "Fix at the source, not the copy"],
    ["Provenance", "No resolvable, authorized record behind a change", "Investigate before changing"],
    ["Authorization", "Something acted outside what the record authorizes", "Investigate before changing"],
    ["Identity", "An object or issuer doesn't resolve to the record", "Investigate before changing"],
  ], { x: 7.05, fontSize: 13, limit: 6.5 });
  sources(s, "Sources: Book 13, Ch 02 (five classes are program design, not a NIST taxonomy); Book 01, Ch 11 (actuation ladder). Book 13, Ch 02.");
  notes(s,
`Calling everything configuration drift loses the ability to respond correctly, because different divergences need different fixes and carry different risk. So the program names five classes, each a question it asks of a record or a change. The classes are the program's design, not a NIST taxonomy.

Schema asks whether the shape is still valid: an attribute value that fails its expected format. Semantic asks whether the value is still true: a department code that no longer matches HR, or a group rule that has stopped evaluating. Provenance asks whether every change traces to an authorized source: a setting changed with no change record, or an evidence chain with a missing link. Authorization asks whether anything acted outside what was authorized: a role assignment that isn't in the delegation matrix, or a write to an HR-mastered attribute by the wrong principal. Identity asks whether every object and actor resolves to the record: an enabled account that matches no worker.

The right-hand column is why the cut matters. A schema finding is fixed by correcting the data or the schema. A semantic finding is fixed at the source of the fact, never in the copy. The last three can mean someone acted without authority, so they're investigated before anything is changed. Severity follows from the class and from whether the claim is in active use: the same divergence matters more on a live access path than on a dormant record.

The discipline has four steps: detect deterministically, classify deterministically, remediate under contract, and treat findings as evidence. Book 01's actuation ladder sets how far remediation goes without a person.`,
  "Book 13, Chapter 02 — Drift Is the Primary Threat, \"How the program names drift,\" \"From naming to discipline.\"");
}

// ================================================================== 6 The record
{
  const s = content(P1, "One authoritative record: every copy is a pointer");
  tag(s, "What");
  img(s, "ch03-record-and-pointers", 0.6, 1.5, 4.6, 4.95);
  const cb = panel(s, "Consumer", 5.45, 1.5, 7.3, null, HEX.navy, HEX.navyTint, "THE CONSUMER RULE (PROGRAM DESIGN)", null, [
    "Resolve by a stable, package-relative reference, from any working directory",
    "Read-only at runtime: a different value is a change request, not a write",
    "No private copies: hardcoded paths and sibling-checkout fallbacks are forbidden",
  ], 12.5);
  const hb = table(s, "Holds", cb + 0.2, [1.7, 2.75, 2.85], ["Surface", "What it holds", "Example"], [
    ["Governance documents", "Policies, plans and evidence", "Delegation matrix; an authorized plan"],
    ["Schemas", "The authority for structure", "Plan schema; attribute schema"],
    ["Rules", "Consumer rules and validation logic", "Group naming rules; drift rules"],
  ], { x: 5.45, fontSize: 12.5, limit: 5.65 });
  txt(s, "Provenance", [
    { text: "Provenance block on every derived artifact: ", options: { bold: true, color: HEX.teal } },
    { text: "source, version (a commit), when derived, by what mechanism, and a content hash over the claim." },
  ], { x: 5.45, y: hb + 0.2, w: 7.3, h: 0.7, fontSize: 13.5 });
  sources(s, "Sources: NIST SP 800-53 Rev. 5.2.0 (CM-2); FedRAMP 2026 Rev5 CM reference; Pro Git §10.2. Consumer rule and provenance block are program design. Book 13, Ch 03.");
  notes(s,
`For twenty years the Active Directory OU tree was the governance model: one placement set delegation, Group Policy scope, group membership and an audit boundary. Entra ID, Intune and Conditional Access replaced the parts, but not the framework for deciding what each part should hold. Migrate into a flat directory without one, and every system ends up with its own slightly different idea of who belongs where.

The program's answer is one authoritative record: the origin of every identity, addressing, enforcement, telemetry and governance claim it handles. Every other representation is a provenance-anchored pointer that knows where it came from and can be checked, refreshed or retired. Single means logically single: replicas are fine as long as exactly one copy accepts authoritative writes. It's CM-2's baseline configuration, kept in a form machines can compare.

The record lives in a version-controlled repository holding governance documents, schemas and rules, with a document registry that is itself part of the record. Code consumes it under three rules. Resolve by a stable reference. Read-only at runtime. And no private copies, because each one is a quiet second source of truth: a script reading a local copy of the delegation matrix "because the repository was slow" is enforcing a matrix nobody reviewed.

Every derived artifact carries a provenance block: source document, version, time, the mechanism that derived it, and a content hash over the claim. Git underneath is content-addressable, so pinning to a commit pins exact content. That's how an auditor asks what the authoritative value was on a date, and gets a machine-readable answer.`,
  "Book 13, Chapter 03 — One Authoritative Record, \"What the record is,\" \"Where the record lives,\" \"The consumer rule,\" \"The provenance chain.\"");
}

// ================================================================== 7 Six planes
{
  const s = content(P1, "Six control planes, cut by authority, not by log source");
  tag(s, "What");
  img(s, "ch03-six-planes", 0.6, 1.5, 4.2, 4.95);
  table(s, "Authority", 1.5, [2.3, 2.55, 3.05], ["Class of fact", "Authoritative source", "What the record holds"], [
    ["Who a worker is and where they sit", "HR system of record", "Authority map, crosswalk and derivation rules"],
    ["Contractors and non-employees", "One authority per fact, federal sponsor", "Which register owns which fact"],
    ["Devices", "Asset-lifecycle registry", "Device classes, tiers, attribute map"],
    ["Declared infrastructure", "Infrastructure-as-code repository", "The reference, and the drift rules"],
    ["Structure, intent, plans, evidence", "The record itself", "Everything: authoritative origins"],
  ], { x: 4.85, fontSize: 12, limit: 5.15 });
  panel(s, "Upstream", 4.85, 4.7, 7.9, null, HEX.teal, HEX.tealTint, null, null, [
    "Corrections flow upstream: fix the owning source or derivation rule, never the copy",
    "Synced users' extension attributes are mastered on-premises and read-only in Entra ID",
  ], 12.5);
  sources(s, "Sources: NIST SP 800-207 §2, §3.4.1; Microsoft Graph, onPremisesExtensionAttributes. The six planes and authority map are program design. Book 13, Ch 03.");
  notes(s,
`The record covers the whole control surface, divided into six control planes, each authoritative for its domain with its own source of truth, schemas and class of drift findings. Identity is the root namespace: every actor named once, with its assurance level. Addressing derives names and addresses from identity and policy. Network derives paths from who and where. Telemetry and location treats signals as control input. Security and compliance holds the policy decision and enforcement points, kept on the decision side of SP 800-207's control-plane and data-plane line. Management does drift detection, stewardship and evidence.

Don't confuse these with Book 12's six planes, which are cut by where logs come from. Six is the program's design: the smallest cut that names every source an AO evaluates, gives every finding one owning team, and avoids folding everything into identity, because a stale DNS record and a stale group membership have different owners. Authority flows one way; cycles exist only at runtime, and only through an explicit artifact.

The record doesn't master every fact. A personnel action creates employment status; the identity platform issues credentials. What the record holds is the authority: which system owns each fact, who receives a copy, how it's derived and who may write it. Two rules follow. Corrections flow upstream. And the platform decides where a write is accepted: for a synchronized user, the fifteen extension attributes are mastered in on-premises AD and read-only in Entra ID. A write by any principal other than the slot's single writer is a drift finding.`,
  "Book 13, Chapter 03 — One Authoritative Record, \"The six control planes,\" \"Why six,\" \"Who is authoritative for what.\"");
}

// ================================================================== 8 Five-clause path
{
  const s = content(P1, "The five-clause path every MACD-R change travels");
  tag(s, "How");
  img(s, "ch04-five-clause-path", 0.6, 1.5, 6.9, 4.95);
  table(s, "MACDR", 1.5, [1.2, 3.8], ["Class", "Identity · infrastructure example"], [
    ["Move", "A worker transfers division · a server changes segment"],
    ["Add", "A joiner's account before start · a device enrolls"],
    ["Change", "CA policy conditions edited · a DNS record updated"],
    ["Deletion", "A leaver disabled, then deleted · a device retired"],
    ["Reset", "A credential reissue · a wipe or certificate re-key"],
  ], { x: 7.75, fontSize: 12, limit: 4.6 });
  panel(s, "Clause3", 7.75, 4.65, 5.0, null, HEX.navy, HEX.navyTint, "CLAUSE 3 IN THE WORKED EXAMPLE", null, [
    "Entra PIM: eligible, not active; activation can need approval, MFA and a reason",
    "The activation record joins the operation's evidence",
  ], 12);
  sources(s, "Sources: Microsoft Learn — What is Microsoft Entra PIM?; Book 00, Ch 04 (principle 2). The five classes and five clauses are program design. Book 13, Ch 04.");
  notes(s,
`Most drift isn't malicious. It's a technician fixing a group membership in the portal, a hotfix during an outage, a migration script run over a weekend with a standing administrator account. Each change may be correct; none leaves the record able to say who asked, who approved, or whether it worked. So the program has one path for every operational change, with no second path for urgent or routine work.

Every change is one of five classes, MACD-R: move, add, change, deletion and reset. The classes don't change what the path requires; they change which source of truth originates the work and which check proves it done.

Every change travels five clauses, and skipping one makes the operation unauthorized by construction: a drift finding, not a change with a missing form. One, it originates with the source of truth: a joiner in HR, a control gap, a migration wave. Two, the authorization resolves from the authority model, not from whoever is nearby; pre-authorized lanes are standing authorizations with a scope and an expiry, never the absence of approval. Three, it executes under least privilege, elevated just in time, and the activation record binds who could act to what was done. Four, it closes with provenance: the verification payload, a timestamp and the checker's identity. Five, the closure emits integrity-protected evidence into continuous monitoring with no human assembly.

For clause three, Entra PIM makes a role eligible rather than active, and activation can require approval, MFA and a justification, with an audit history.`,
  "Book 13, Chapter 04 — Change Control and Provenance, \"Five change classes,\" \"The five-clause path.\"");
}

// ================================================================== 9 Pull requests and identities
{
  const s = content(P1, "Changing the record: the pull request is the authorization");
  tag(s, "How");
  const prb = panel(s, "PR", 0.6, 1.5, 6.1, null, HEX.navy, HEX.navyTint, "A PULL REQUEST AGAINST THE RECORD (PROGRAM DESIGN)", null, [
    "The registry moves with the change",
    "Doctrinal changes carry a reviewed decision record",
    "Schema, layer and plan-validation checks run before merge",
    "Two people per change; a second, security approver for the most sensitive objects",
    "The merge is signed and verified",
    "Rollback is a revert, with the same record as the change",
  ], 14);
  const idb = panel(s, "Identities", 6.95, 1.5, 5.8, null, HEX.teal, HEX.tealTint, "TWO IDENTITIES, NOT ONE", "Decide never acts; act never decides", [
    "Separate service principals, credential stores and log streams",
    "Revoking either one stops the system safely",
  ], 13.5);
  const enb = panel(s, "Enforce", 6.95, idb + 0.2, 5.8, null, HEX.amber, HEX.amberTint, "PLATFORMS CAN ENFORCE IT", null, [
    "Protected branches: reviews, status checks, signed commits",
    "They don't bind administrators by default; turn that on",
  ], 13.5);
  callout(s, "Emergency", Math.max(prb, enb) + 0.25, 0.95, "FaUserClock", HEX.red, "A path, not an exemption: ",
    "change under a just-in-time role, back-port by pull request within one business day; the drift monitor reports it meanwhile.");
  sources(s, "Sources: GitHub Docs — About protected branches; FedRAMP 2026 KSI-CMT (LMC, RMV, VTD); Book 04, Ch 10. The pull-request rules are program design. Book 13, Ch 04.");
  notes(s,
`The path governs changes to the estate. Changes to the record itself, a rule, a delegation matrix, a schema or a plan, travel the same path in repository form: the change is a pull request, and the pull request is the authorization. The six rules are the program's design. The registry entry moves with every artifact added, changed, superseded or retired. Superseding, retiring or rescoping a document needs a reviewed decision record in the same change, so a direct commit with no decision record behind it is itself a drift signal. Schema validation, the layer's rule checks and, for an operational plan, the validation gate run before merge. At least one approver of record other than the author, with a second approver from security for objects like emergency-access exclusions or the pipeline's own permissions. The merge is signed. And rollback is a revert.

Repository platforms can enforce most of this. GitHub's protected branches can require approving reviews, dismiss stale approvals, require the last push to be approved by someone else, require status checks and signed commits. By default those rules don't bind administrators, so turn on the setting that applies them to administrators and bypass roles. A rule administrators can skip is a standing exception.

Emergencies get a path, not an exemption: a direct change under a just-in-time activation with a ticket, back-ported within one business day, with the drift monitor reporting it until then. FedRAMP's change-management indicators ask providers for the same.

The identity that decides and the identity that acts each get a service principal, credential store and log stream, so a compromised one can't finish the job alone.`,
  "Book 13, Chapter 04 — Change Control and Provenance, \"Changing the record: pull requests,\" \"Two identities, not one.\"");
}

// ================================================================== 10 Closure with proof
{
  const s = content(P1, "No closure counts unless it carries its proof");
  tag(s, "How");
  const pic = img(s, "ch04-closure-record", 0.6, 1.5, 7.1, 2.7);
  panel(s, "Rule", 7.95, 1.5, 4.8, null, HEX.teal, HEX.tealTint, "THREE REQUIREMENTS (PROGRAM DESIGN)", null, [
    "Every closure carries its verification payload",
    "Human-only closure is a flagged exception, counted separately",
    "Reports are derivations, re-run and diffed, never compilations",
  ], 13.5);
  table(s, "Controls", pic.bottom + 0.2, [1.45, 1.35, 1.35, 7.95], ["Control", "NIST", "FedRAMP", "Where the path supports it"], [
    ["CM-3", "M, H", "C, D", "Change classes; the pull request as review and decision record; retained history"],
    ["CM-5(1)", "H", "C, D", "PIM activation and branch-protection records, landing in the evidence stream"],
    ["AU-10", "H", "D", "Signed merges and closure records; a design choice below the High baseline"],
    ["SA-10", "M, H", "C, D", "A developer control: the platform's own code; for a cloud service, the provider's"],
  ], { fontSize: 12, limit: 6.5 });
  sources(s, "Sources: NIST SP 800-53 Rev. 5.2.0 (AU-10, CM-3, CM-5, CM-5(1), CM-5(4), SA-10); SP 800-53B; FedRAMP 2026 Rev5 CM, AU and SA references. Book 13, Ch 04.");
  notes(s,
`Clause four is the strictest part of the path. A remediation task, a daily check, a milestone or a control test closed by someone clicking complete, with no machine-readable verification attached, is prose, not evidence. It asserts that work happened and proves nothing an assessor can consume.

So every state change leaves a provenance record: the originating record by reference and version, the authorization or the standing grant with its scope and expiry, the execution identity and its just-in-time activation, observed and recorded times, which aren't always the same moment, the verification payload and the mechanism that ran it, and a hash and signature.

The rule has three requirements, all program design. Every closure carries its payload; without one it doesn't validate. Human-only closure stays possible as an escape hatch, but it's flagged, counted separately and never aggregated into control tests, continuous monitoring or service levels: a pipeline that can't tell probe-backed closures from attested ones is attesting fiction. And every report is derived from the closure stream by a generator that can be re-run and diffed.

The path is built to make controls easy to show, and two details are easy to get wrong. AU-10 non-repudiation is a High-baseline control, Class D only in FedRAMP's reference, so at Moderate the signing is recommended but not obliged. SA-10 is a developer control: it covers the program's own tooling and a provider's service, not every tenant change, which is CM-3's job. And CM-5(4), dual authorization, is in no NIST baseline, so the program's two-person rule is its own design.`,
  "Book 13, Chapter 04 — Change Control and Provenance, \"Provenance for every state change,\" \"No closure counts unless it carries its proof,\" \"How the path lines up with the controls.\"");
}
endModule("Module 1");

// ================================================================== 11 Module 2 divider
{
  const s = divider(P1, "Module 2: Deterministic rules and the drift engine", "Part 1 — The record and the drift engine  ·  Chapters 05–06",
    ["Determinism, three rule layers and the re-run as verification", "Rules as code, and where they meet OSCAL", "The drift engine: one model, computed severity, the ladder"], 12);
  notes(s,
`Module 2: deterministic rules and the drift engine. Module 1 gave the program one record and one controlled path into it. Neither answers the next question: when the program turns that record into a statement about the estate, how does anyone know the statement is right?

The usual answer is trust. The program's answer is determinism: same record version, same inputs, same evidence, byte for byte, so an assessor can repeat the run and compare. We'll look at what that requires, the three layers the rules live in, and then the drift engine that compares, classifies, sets severity and leaves a remediation contract for every finding.`,
  "Book 13, Chapter 05 — Deterministic Governance; Chapter 06 — The Drift Engine.");
}

// ================================================================== 12 Determinism
{
  const s = content(P1, "Determinism, not automation, is what an assessor can check");
  tag(s, "What");
  img(s, "ch05-rerun-is-verification", 0.6, 1.5, 5.6, 4.0);
  table(s, "Determinism", 1.5, [2.0, 2.15, 2.15], ["Property", "Automation", "Determinism"], [
    ["Reproducibility", "May vary by run, operator or time", "Same record version and inputs, same bundle"],
    ["Provenance", "Optional", "A full envelope on every claim"],
    ["Verification", "Not guaranteed", "An assessor re-runs and compares hashes"],
  ], { x: 6.45, fontSize: 12, limit: 3.65 });
  panel(s, "Pipeline", 6.45, 3.65, 6.3, null, HEX.teal, HEX.tealTint, "EVERY EMISSION (PROGRAM DESIGN)", null, [
    "No silent drops · append-only writes",
    "Ordered by the data, not arrival · idempotent ingestion",
  ], 14);
  callout(s, "Canon", 5.65, 0.85, "FaHashtag", HEX.navy, "Byte-identical needs a canonical form: ",
    "RFC 8785 is one published scheme; the serialization and pinned toolchain belong in the rule set.");
  sources(s, "Sources: RFC 8785 (JSON Canonicalization Scheme); NIST SP 800-53 Rev. 5 (CA-7(1)). Determinism and the pipeline properties are program design. Book 13, Ch 05.");
  notes(s,
`Determinism means that given the same version of the authoritative record and the same collected inputs, the governance platform produces the same evidence, byte for byte. If that holds, an assessor doesn't trust the run; they repeat it and compare. It's a design property of the program's tooling, not a federal requirement.

Three properties make governance deterministic, and none of them is speed. Reproducibility, tested by independent re-execution. Provenance: a full envelope on every claim. And hash-verifiable lineage: the bundle hash is computed over the claims' hashes, so changing any claim breaks it. Automation gives you faster output; determinism gives you output someone else can check.

Byte-for-byte is harder than it sounds. Two runs that agree can still serialize differently, and the hashes differ though nothing meaningful changed. The cure is a canonical serialization, such as RFC 8785, the JSON Canonicalization Scheme, with deterministic property sorting. Whatever scheme is used has to be fixed, documented and part of the rule set, along with a pinned toolchain.

The pipeline holds every emission to four properties: no silent drops, append-only writes, order defined by the data rather than arrival, and idempotent ingestion. Bundles move through assemble, seal, submit and close, and a sealed bundle is immutable. The diagram is the payoff: the record version and archived inputs, through the same pipeline, give a hash H for the program and H-prime for the assessor's re-run. Equal means verified by reproduction; different is a finding in its own right. That's what makes CA-7(1)'s independent ongoing assessment practical, and why the inputs must be archived.`,
  "Book 13, Chapter 05 — Deterministic Governance, \"Automation is not determinism,\" \"How the pipeline keeps determinism,\" \"What changes for the program.\"");
}

// ================================================================== 13 Three rule layers
{
  const s = content(P1, "Three rule layers, three change boundaries");
  tag(s, "What");
  img(s, "ch05-three-rule-layers", 0.6, 1.5, 5.4, 4.1);
  table(s, "Review", 1.5, [1.65, 2.35, 2.5], ["Layer", "Reviewed by", "Evidence it leaves"], [
    ["1  Authoritative rules", "The governance body that owns the record", "A recorded decision, linked from the rule's provenance"],
    ["2  Policy mappings", "Adapter or indicator owner, with schema validation", "A schema-validated diff of the registry"],
    ["3  Runtime enforcement", "Engineering review, with tests", "Test results and the contracts the code emits"],
  ], { x: 6.25, fontSize: 12, limit: 3.95 });
  panel(s, "WhyThree", 6.25, 3.6, 6.5, null, HEX.navy, HEX.navyTint, "WHY THREE AND NOT TWO", null, [
    "Cadence: rules need governance review; mappings shouldn't wait",
    "Blast radius: a registry edit versus a superseding decision",
    "Attribution: a shift in meaning, a mapping, or the code",
  ], 12.5);
  callout(s, "Runtime", 5.75, 0.8, "FaShieldHalved", HEX.amber, "Only the runtime may change state: ",
    "rules and mappings are read-only to it, and the actuation ladder caps how far it acts.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-3, CM-3(2), CM-4) and SP 800-53B Moderate baseline. The three-layer model is program design. Book 13, Ch 05.");
  notes(s,
`The program keeps its rules in three layers, so that what a rule means, where it applies and how it's evaluated can each be versioned, reviewed and drift-checked on its own. The common failure, policy-as-config, puts all three in one file and collapses three change boundaries into one.

Layer 1, authoritative rules, says what rules exist and what they mean. A rule declares a stable versioned identifier, a statement a person can read, schema constraints and its provenance, and nothing about where it applies. It ships to the runtime as read-only data. Layer 2, policy mappings, joins a rule to a component and a scope and to the controls it supports. Schema validation checks every proposed mapping, so a dangling entry that names a retired rule becomes a provenance finding, not a runtime crash. Layer 3, runtime enforcement, is the evaluation logic: the adapters and an enforcement library called by the engine, with no command-line surface of its own by design, so enforcement goes through the engine's gates.

Each layer has its own reviewer and leaves its own evidence. That's how the program evidences CM-3 and CM-4: which review happened, and what it produced.

Why not fold mappings into rules? Cadence: rule changes go through governance; mappings shouldn't wait for it. Blast radius: a bad mapping is a registry edit, a bad rule needs a superseding decision. And drift attribution: separate layers let the engine tell an assessor whether a finding is a shift in meaning, a mapping mistake, or code that disagrees with its rule. The runtime is the only layer that changes observable state, and the ladder sets how far.`,
  "Book 13, Chapter 05 — Deterministic Governance, \"Three layers of rules,\" \"Reviewing rules,\" \"Why three layers and not two.\"");
}

// ================================================================== 14 Rules as code and OSCAL
{
  const s = content(P1, "Rules as code, and where they meet OSCAL's models");
  tag(s, "How");
  const scb = panel(s, "Scuba", 0.6, 1.5, 5.1, null, HEX.navy, HEX.navyTint, "THE SAME SEPARATION, PUBLISHED", "ScubaGear and OPA", [
    "PowerShell reads the tenant's settings",
    "OPA compares them with Rego written to the baselines",
    "Results reported as HTML, JSON and CSV",
  ], 13.5);
  panel(s, "Pure", 0.6, scb + 0.25, 5.1, null, HEX.teal, HEX.tealTint, "EVALUATION IS A PURE FUNCTION", null, [
    "Of rule version, mapping and collected input only",
    "Never the operator, the clock or the return order",
    "observed_at is input, recorded at collection",
  ], 13.5);
  subhead(s, "OSCAL head", "THE CORRESPONDENCE IS THE PROGRAM'S OWN, NOT OSCAL'S", 5.95, 1.5, 6.8);
  table(s, "OSCAL", 1.85, [2.6, 2.0, 2.2], ["Program artifact", "Closest OSCAL model", "Why"], [
    ["Controls the rules support", "Catalog, tailored by a profile", "Points at a published baseline"],
    ["Mappings for one adapter", "Component definition", "How one component meets controls"],
    ["All mappings for a system", "SSP implementation", "The plan imports what components declare"],
    ["Runtime findings in a window", "Assessment results", "Evidence from assessment activities"],
    ["Open findings with dates", "POA&M", "What the owner still has to address"],
  ], { x: 5.95, fontSize: 13, limit: 6.5 });
  sources(s, "Sources: CISA ScubaGear README; Open Policy Agent docs; NIST OSCAL Layers and Models; SP 800-53 Rev. 5 (CM-2, CM-6, CA-7) and SP 800-53B. Book 13, Ch 05.");
  notes(s,
`Writing rules as code means each layer is a file in version control, changed through review, tested before it lands and evaluated by a program. The idea isn't unique to this program. CISA's ScubaGear works in the same three steps: PowerShell reads a Microsoft 365 tenant's settings, Open Policy Agent compares them against Rego policies written to CISA's baselines, and results come out as HTML, JSON and CSV. Collection, decision and reporting are separate, and the policy is a reviewable file.

The chapter shows three illustrative fragments. A layer-1 rule for organization codes states the meaning and the pattern and resolves against the organization registry, with its decision record. A layer-2 mapping binds that rule to the Entra directory adapter, a scope, and the controls it supports, AC-2 and CM-6. And a layer-3 finding carries the rule and version, the mapping, the record version, a hash of the collected input, the subject, the result and the drift class. Evaluation is a pure function of rule version, mapping and input. Nothing depends on the operator, the clock at evaluation time or the order objects came back in.

The mapping layer is where a rule meets a control. CM-6, CM-2 with CM-2(2), and CA-7 are all Moderate; CM-6(1), automated management of settings, is High only. A deterministic rule set satisfies them with evidence rather than narrative: rules are the documented settings, mappings bind them, findings are the monitoring.

The table is the program's own correspondence to OSCAL's three layers. FedRAMP's Key Security Indicators are a separate target that binds providers; an agency maps its own rules to SP 800-53.`,
  "Book 13, Chapter 05 — Deterministic Governance, \"Rules as code,\" \"How rules map to controls.\"");
}

// ================================================================== 15 Drift engine
{
  const s = content(P1, "The drift engine compares against a versioned record");
  tag(s, "How");
  img(s, "ch06-drift-pipeline", 0.6, 1.5, 6.5, 4.95);
  const vb = panel(s, "Versioned", 7.35, 1.5, 5.4, null, HEX.navy, HEX.navyTint, "NOT A LAST-KNOWN-GOOD SNAPSHOT", null, [
    "The expected state is reproducible from the version",
    "Approved change isn't drift: it updates the record first",
    "If the estate is right and the record stale, the fix is a reviewed record change",
  ], 13.5);
  panel(s, "Cadence", 7.35, vb + 0.25, 5.4, null, HEX.teal, HEX.tealTint, "TWO CLOCKS", null, [
    "On every proposed change to the record",
    "Against the estate, through adapters; cadence set per check",
  ], 13.5);
  sources(s, "Sources: NIST SP 800-128 §2.2, §3.4.1; SP 800-53 Rev. 5 (CA-7, CA-7(4)). The engine's model, severity and contract are program design. Book 13, Ch 06.");
  notes(s,
`The drift engine is the part of the platform that finds the gap between declared and observed state, classifies it, sets its severity and records what was done. The idea is old: NIST's guide to security-focused configuration management, SP 800-128, says planning and change control usually aren't sufficient to keep a once-secure system secure; monitoring finds when the actual configuration has diverged. What the program adds is a fixed classification, severity that follows from it rather than from a debate, and a record of every response.

The engine compares against a versioned record, not a last-known-good snapshot, and that matters three ways. The expected state is reproducible, so a finding can be re-derived later. Approved change isn't drift: a change through Chapter 04's path updates the record first and the estate converges. The engine does SP 800-128's reconciliation structurally, because an approved change carries a provenance record. And the record can be wrong. If the estate is right and the record stale, the fix is a reviewed change to the record. The engine raises the finding either way; it doesn't decide which side is right.

Detection runs on two clocks. On every proposed change to rules, mappings or registries, checks find schema and provenance drift in the record itself before it reaches the estate. Against the estate, a scheduled comparison reads platforms through adapters, and between runs the engine can watch the platform's own change events, as Book 02 does with the Entra audit log. Each check's cadence is set by its owning book, which is how the program meets CA-7 and CA-7(4).`,
  "Book 13, Chapter 06 — The Drift Engine, \"Drift as a signal,\" \"What the engine compares against,\" \"Cadence.\"");
}

// ================================================================== 16 One drift model
{
  const s = content(P1, "One drift model: domain checks are instances, not lists");
  tag(s, "What");
  img(s, "ch06-one-drift-model", 0.6, 1.5, 7.4, 3.3);
  subhead(s, "Built head", "MATURITY, OCTOBER 2026", 8.25, 1.5, 4.5);
  table(s, "Built", 1.85, [1.75, 1.35, 1.4], ["Class", "On change", "At runtime"], [
    ["Schema", { text: "Built", options: { color: HEX.teal, bold: true } }, { text: "Built", options: { color: HEX.teal, bold: true } }],
    ["Provenance", { text: "Built", options: { color: HEX.teal, bold: true } }, { text: "Built", options: { color: HEX.teal, bold: true } }],
    ["Semantic", "n/a", { text: "Partly built", options: { color: HEX.amber, bold: true } }],
    ["Authorization", "n/a", { text: "Design only", options: { color: HEX.red, bold: true } }],
    ["Identity", "n/a", { text: "Design only", options: { color: HEX.red, bold: true } }],
  ], { x: 8.25, fontSize: 12, limit: 4.85 });
  callout(s, "Contention", 5.05, 0.95, "FaCodeBranch", HEX.red, "Contention, a write to a demoted copy: ",
    "an authorization finding, critical when the copy is in use, and the sign a second source of truth is growing back.");
  txt(s, "Interim", "Until one runtime runs every check, record a person's finding in the remediation-contract shape.",
    { x: 0.6, y: 6.12, w: 12.15, h: 0.4, fontSize: 13, color: HEX.ink, italic: true });
  sources(s, "Sources: Book 13, Ch 06 (domain checks from Books 00–03 mapped to five classes); Ch 03 (contention). The model and maturity table are program design. Book 13, Ch 06.");
  notes(s,
`Earlier books defined drift checks for their own domains, with their own names. Those checks stay; each book owns its domain's detail. But they aren't separate taxonomies. Each is an instance of one of the five classes, and Chapter 06's mapping table is the reconciliation.

Book 00's attribute categories govern values only, so Format and Value map to schema, and Orphan and Phantom to semantic. Book 01's Value drift, an attribute that differs from HR, and Processing drift, a paused rule, are semantic; its Orphan drift, a group not in the governed library, is identity. The words Value and Orphan mean different things in Book 00 and Book 01; the class column resolves it. Book 02's administrative-unit checks spread across the classes: a role assignment not in the matrix is authorization, a missing unit is identity, and a dynamic group as a role principal is schema, because the registry declares something the platform can't represent.

One finding belongs to the record itself: contention, a write to a copy that was demoted after the roster of authoritative sources was ratified. It's authorization drift, critical when the copy is in use and otherwise high, and it's the signal that a second source of truth is trying to grow back.

Be precise with an assessor about maturity. The model is complete; the engine isn't. Schema and provenance are built on change and at runtime; semantic is partly built; authorization and identity are design only, found today by the domain books' assessment modules and by people. Until one runtime runs them all, record a person's finding in the same contract shape.`,
  "Book 13, Chapter 06 — The Drift Engine, \"One model, many domain checks,\" \"What is built today.\"");
}

// ================================================================== 17 Severity and ladder
{
  const s = content(P1, "Severity sets the clock; the ladder sets who acts");
  tag(s, "How");
  table(s, "Severity", 1.5, [1.35, 3.35, 2.6, 1.15], ["Severity", "Default rule", "Response", "Target"], [
    ["P1", "A live claim with provenance, authorization or identity drift", "Halt and alert; never auto-remediated", "Immediate"],
    ["P2", "A live claim with schema or semantic drift", "Within the class's ladder ceiling", "1 hour"],
    ["P3", "Drift in a dormant or historical claim", "Within the ceiling", "24 hours"],
    ["P4", "Style or metadata, no effect on meaning", "Within the ceiling", "72 hours"],
  ], { fontSize: 12, limit: 4.15 });
  panel(s, "Ladder", 0.6, 4.2, 8.45, null, HEX.amber, HEX.amberTint, "THE CEILING, PER OPERATION CLASS (BOOK 01, CHAPTER 11)", null, [
    "L0 Record · L1 Observe · L2 Advise · L3 Gated actuation, the default · L4 only for enumerated classes",
    "Permanent L3: tenant-wide roles, CA enforcement, bulk device state, wide network policy",
    "Machine Configuration: Audit is L1; Apply and Autocorrect enumerates that setting at L4",
  ], 13);
  panel(s, "Never", 9.3, 1.5, 3.45, null, HEX.red, HEX.redTint, "THE ENGINE NEVER…", null, [
    "Auto-remediates a P1",
    "Fixes the copy instead of the record",
    "Edits the record itself",
    "Judges whether a rule is correct",
    "Accepts risk",
  ], 14);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CA-7, CM-3(5), CM-6(2)) and SP 800-53B; Microsoft Learn — Azure Machine Configuration. Severities and targets are program design. Book 13, Ch 06.");
  notes(s,
`Every finding carries one of four severities, and the domain books' critical, high, medium and low are the same scale as P1 to P4. The targets, immediate, one hour, 24 hours and 72 hours, are the program's defaults: CA-7 leaves frequencies and responses to the organization, and this table is the program's choice.

Severity is computed, not argued. The default is a function of the drift class and whether the claim is in active use. A domain check can pin its own severity in its book, as Book 00 does for Format, which is critical and halts the pass. Either way it's a lookup, so "is this serious?" becomes "did the classifier run correctly?", which can be tested.

Two independent settings govern every response, and confusing them is the most common design mistake. Severity sets the clock and whether the run halts. The operation class's ceiling on the actuation ladder sets who may act. So a P3 isn't automatically something the engine fixes alone. At L4, it fixes and records; at L3, it generates a plan, runs it dry and waits for a person. Some classes stay L3 permanently. Being deterministic is necessary for automatic remediation, not sufficient. Platforms offer the same distinction: Azure Machine Configuration's Audit is an L1 posture, and choosing Apply and Autocorrect is a decision to enumerate that setting at L4, which belongs in the record. CM-3(5) and CM-6(2) cover automatic response; neither is in the Moderate baseline, so it's the agency's choice.

And the engine never does five things: auto-remediate a P1, fix the copy, edit the record, judge a rule, or accept risk.`,
  "Book 13, Chapter 06 — The Drift Engine, \"Severity,\" \"What the engine remediates, and what it doesn't,\" \"The remediation contract.\"");
}
endModule("Module 2");

// ================================================================== 18 Module 3 divider
{
  const s = divider(P2, "Module 3: Evidence over attestation, and adapters", "Part 2 — Evidence, owners and authorization  ·  Chapters 07–08",
    ["Attestation as the wrapper, evidence as the substance", "The evidence chain, the envelope and what each hash proves", "Adapters: classes, missions, the contract and the lifecycle"], 10);
  notes(s,
`Module 3: evidence over attestation, and the adapter model. Part 1 built a record, a change path, deterministic rules and a drift engine. Part 2 asks what all that produces for an authorizing official, and who stands behind it.

This module is the evidence. First, the difference between a signed statement and a system-produced artifact, and how far NIST and FedRAMP already go toward the second. Then the four-stage evidence chain, the provenance envelope and exactly what hashes, hash chains and signatures prove. Then the adapters that read every platform into one record, and the contract each one has to keep.`,
  "Book 13, Chapter 07 — Evidence Over Attestation; Chapter 08 — The Adapter Model.");
}

// ================================================================== 19 Attestation vs evidence
{
  const s = content(P2, "Attestation names who's accountable; evidence shows it");
  tag(s, "Why");
  table(s, "Versus", 1.5, [1.95, 2.55, 2.75], ["", "Attestation", "Evidence"], [
    ["Answers", "Who is accountable?", "Is it true, and can I check?"],
    ["Covers", "The moment of signing", "Each collection, continuous or per interval"],
    ["Verified by", "Re-reading; interviewing the signer", "Repeating the collection and comparing hashes"],
    ["Role here", "The accountability wrapper", "The primary artifact (program design)"],
  ], { fontSize: 12.5, limit: 4.05 });
  panel(s, "Same", 0.6, 4.1, 7.25, null, HEX.navy, HEX.navyTint, "WHAT DOESN'T CHANGE, BY DESIGN", null, [
    "The authorizing official still authorizes and accepts residual risk",
    "People still own the rules: a wrong rule gives the same wrong evidence",
    "Some controls stay attestations; the package says which",
  ], 13.5);
  panel(s, "Guidance", 8.1, 1.5, 4.65, null, HEX.teal, HEX.tealTint, "FEDERAL GUIDANCE ALREADY GOES MOST OF THE WAY", null, [
    "SP 800-53A: desired-state comparison counts as assessment results; the method is test",
    "SP 800-37: a tool report with the required content is the assessment report",
    "FedRAMP 2026: \"don't simply review documentation or screenshots\"",
    "20x packages maintained by automation, quarterly (A) to weekly (D)",
  ], 14);
  sources(s, "Sources: NIST SP 800-53A Rev. 5, App. C and F, §3.2.3.5; SP 800-37 Rev. 2 (fn. 108, App. F); FedRAMP 2026 IVV-IAS-VIM, IVV-CSO-USR, CPO rules. Book 13, Ch 07.");
  notes(s,
`An attestation is a person or body signing that a system was in a stated condition at a stated time. It answers who is accountable, and federal authorization needs that: the AO, the system owner and the assessor all sign, and nothing here removes a signature. Evidence is an artifact a machine produced from the system that shows the condition. A screenshot is weak evidence; a record read through the platform's interface, stamped with when and how, and bound to the source by a hash, is strong, because someone else can repeat it. An attestation can only be re-read.

The program inverts the usual package. Evidence is the substance; attestation is the human review on top, for the rules, the decisions and the acceptance of risk. That's a design position, and federal guidance goes most of the way. SP 800-53A's ongoing-assessment appendix describes a desired-state specification compared automatically with actual state, says the results are equivalent to assessment results, and says automated assessment uses the test method. SP 800-37 says a tool's report that contains what an assessment report must is the assessment report, and that manual assessment fills what tools can't reach. FedRAMP's 2026 rules bind providers and assessors, but tell assessors not to simply review documentation or screenshots, and expect 20x packages maintained by automation, from every three months for Class A to weekly for Class D.

Three things don't change: the AO authorizes, people own the rules, and some controls, like a policy approval or a physical inspection, remain attestations. Say which.`,
  "Book 13, Chapter 07 — Evidence Over Attestation, \"Two artifacts, two questions,\" \"What federal assessment guidance already says,\" \"What changes, and what doesn't.\"");
}

// ================================================================== 20 Evidence chain
{
  const s = content(P2, "The evidence chain and the provenance envelope");
  tag(s, "What");
  img(s, "ch07-evidence-chain", 0.6, 1.5, 6.4, 4.2);
  table(s, "Envelope", 1.5, [2.15, 3.5], ["Field", "What it carries"], [
    ["source_classification", "Authoritative, derived or synthesized, set by the adapter's declaration"],
    ["transformation_chain", "Every step, each with the previous step's hash"],
    ["lineage_hash", "Binds the claim to the exact source record"],
    ["signer_certificate, signature", "Bind the claim to the identity that produced it"],
  ], { x: 7.1, fontSize: 12, limit: 5.15 });
  txt(s, "Thumbprint", [
    { text: "Two separate fields, on purpose: ", options: { bold: true, color: HEX.red } },
    { text: "a certificate thumbprint identifies the certificate; it doesn't sign anything." },
  ], { x: 7.1, y: 4.15, w: 5.65, h: 0.7, fontSize: 13.5 });
  callout(s, "Drift", 5.8, 0.8, "FaArrowsRotate", HEX.teal, "Drift is evidence too: ",
    "findings and remediation contracts enter at stage 2, in the same bundle as the state that drifted.");
  sources(s, "Sources: NIST OSCAL Layers and Models; Microsoft Learn — X509Certificate2.Thumbprint; Book 12, Ch 02. The chain and envelope are program design. Book 13, Ch 07.");
  notes(s,
`The evidence chain has four stages. Capture: an adapter reads a platform's native state through its own interface, read-only, and records when and by which method, an API call, a batch export, an event stream or a manual upload. It declares its mission and boundary, so each observation carries its source classification from the start. Normalize: each observation becomes a claim in the common record, the shape Book 12's evidence contract defines, wrapped in the provenance envelope; a claim that can't be wrapped is rejected with a reason, not dropped. Assemble and seal: claims for a window are bundled, validated and sealed with a bundle hash. Emit: the sealed bundle produces the package artifacts, and OSCAL has a model for each: system security plan, component definition, assessment results and POA&M. Coming out of one bundle, they can't disagree about the same window. Book 11, Chapter 09 traces one ScubaGear result through all four stages.

Four envelope fields carry the weight. source_classification says whether a value was read from its owning system, derived from authoritative values, or synthesized by the program, such as a default or an inference. It's set by the adapter's declaration, not an operator, so an assessor checks it by re-running the adapter, and knows which numbers to test directly and which to trace. transformation_chain records every step, each with the previous step's hash, which is what makes append-only checkable. lineage_hash binds the claim to its source record. And the certificate fingerprint and the signature are separate fields because a thumbprint is a client-computed hash that identifies which certificate was used; it doesn't sign anything.

Drift findings and their contracts enter at stage two like any other claim.`,
  "Book 13, Chapter 07 — Evidence Over Attestation, \"The evidence chain, from source to package,\" \"The provenance envelope.\"");
}

// ================================================================== 21 Integrity
{
  const s = content(P2, "Hash, hash chain, signature: what each one proves");
  tag(s, "What");
  const pic = img(s, "ch07-integrity-layers", 0.6, 1.5, 6.75, 2.95);
  panel(s, "Three", 7.6, 1.5, 5.15, null, HEX.navy, HEX.navyTint, "DON'T CLAIM MORE THAN EACH PROVES", null, [
    "A hash detects change, but anyone who changes data can recompute it",
    "A hash chain detects removal and reordering",
    "A signature binds data to an identity (FIPS 186-5)",
  ], 13.5);
  table(s, "Verify", pic.bottom + 0.15, [2.9, 7.2, 2.05], ["What an assessor can verify", "What the assessor does", "800-53A method"], [
    ["Independent re-execution", "Re-runs a window from the record version and archived inputs; compares bundle hashes", "Test"],
    ["Per-claim source classification", "Samples authoritative claims and reads the same values at the source", "Test, examine"],
    ["Tamper-evident lineage", "Recomputes lineage hashes; checks chains and signatures", "Examine, test"],
    ["Drift-coupled scope", "Follows a provenance finding to exactly the claims it affects", "Examine"],
  ], { fontSize: 12, limit: 6.5 });
  sources(s, "Sources: FIPS 186-5; NIST OSCAL Reference v1.2.3 (back-matter hashes); SP 800-53 Rev. 5 (AU-9, AU-9(3), AU-10, SI-7, SR-4); SP 800-53A; OMB M-26-14, App. C. Book 13, Ch 07.");
  notes(s,
`Integrity claims are easy to overstate, so be exact about three mechanisms. A hash, such as SHA-256, changes if any byte of the input changes, and computing the bundle hash over the claims' hashes in a fixed order builds a tree: change any source record, claim or step, and the bundle hash changes. But a hash can't show who produced the data; anyone who can change the data can recompute it. A hash chain, binding each step to the previous step's hash, detects deletion, insertion and reordering. And a signature, which FIPS 186-5 describes as detecting unauthorized modification and authenticating the signatory, binds the bundle to a key. How strong that is depends on how the key is issued and protected, which is Book 07's subject. All three need the same canonical serialization every time.

These map onto controls assessors already test: AU-9 and AU-9(3) protecting audit information cryptographically, AU-10 non-repudiation, SI-7 integrity verification and SR-4 provenance. M-26-14's mature log management asks for logs regularly hashed for veracity.

The table is what the assessor does with it. Re-execution is the one that matters most: same hash, verified by reproduction; different, a finding in its own right. SP 800-53A's tests for reusing earlier results, changed conditions, elapsed time and independence, read like a specification for this. The bundle answers the first two; it answers independence only if the assessor, not the operator, performs the re-run, so give assessors their own read access to archived inputs and the pipeline. Honest limits: signing is designed, not deployed, and interval evidence isn't continuous.`,
  "Book 13, Chapter 07 — Evidence Over Attestation, \"Integrity: what each mechanism proves,\" \"What an assessor can verify,\" \"Honest limits.\"");
}

// ================================================================== 22 Adapters
{
  const s = content(P2, "Adapters: one platform's dialect into one record");
  tag(s, "What");
  const pic = img(s, "ch08-adapter-translation", 0.6, 1.5, 6.6, 3.15);
  txt(s, "Narrow", [
    { text: "Deliberately narrow: ", options: { bold: true, color: HEX.navy } },
    { text: "an adapter holds no rules, makes no decisions and never edits the authoritative record." },
  ], { x: 0.6, y: pic.bottom + 0.2, w: 6.6, h: 0.6, fontSize: 14 });
  panel(s, "Missions", 0.6, 5.55, 6.6, 0.9, HEX.teal, HEX.tealTint, null, null, [
    "Five missions: identity · telemetry · policy · enforcement · integration",
  ], 13);
  table(s, "Kinds", 1.5, [1.75, 1.75, 1.95], ["", "Conformance", "Modernization"], [
    ["Behavior", "Observes and emits claims", "Moves state toward a target"],
    ["Changes the platform", "Never", "Only on an authorized plan"],
    ["Changes the record", "Never", "Never directly"],
    ["Ladder", "L1 Observe", "Up to the ceiling; L3 by default"],
    ["Listed in", "The read-only list", "The change-making list"],
  ], { x: 7.3, fontSize: 12, limit: 5.2 });
  txt(s, "Lists", "Two files, one schema: the change-making list is the grant of write authority, visible in any diff.",
    { x: 7.3, y: 4.45, w: 5.45, h: 0.75, fontSize: 13, color: HEX.ink });
  sources(s, "Sources: Book 13, Ch 08; Book 01, Ch 03 and Ch 11; Book 02, Ch 04. The adapter classes, missions and lists are program design. Book 13, Ch 08.");
  notes(s,
`The program doesn't replace the platforms an agency runs. Its platforms stay where they are. An adapter is a translator with one job: read a platform's native state through its own interface and express it in the common record, wrapped in the provenance envelope. A change-making adapter also does the reverse, turning an authorized plan into the platform's own calls. Either way the platform's idiosyncrasies stop at the adapter, and the rules, the drift engine and the evidence chain see one record, whichever vendor produced it.

It's deliberately narrow. An adapter that embedded its own policy would be a second, unreviewed source of truth; it doesn't decide, because the engine classifies, the ladder sets the ceiling and a named role approves; and it never edits the record.

There are two kinds. Conformance adapters are read-only: they observe and emit, at L1, and nothing at L4 is possible through one, by construction. Modernization adapters change state toward a target on authorized plans, and they read too, because every change starts and ends with a read. The two live in separate files under one schema, so a reviewer can check the most important invariant before reading any code: an unexpected entry on the change-making list is visible in the diff. That list is the grant of authority to write.

Each adapter also declares exactly one of five missions. Two classes by five missions is ten cells, with no miscellaneous; a tool serving two missions becomes two adapters, so the AO can read evidence by mission.`,
  "Book 13, Chapter 08 — The Adapter Model, \"An overlay, not a replacement,\" \"Two kinds: read-only and change-making,\" \"Five missions.\"");
}

// ================================================================== 23 Contract and lifecycle
{
  const s = content(P2, "The adapter contract, versioning and lifecycle");
  tag(s, "How");
  const pic = img(s, "ch08-adapter-lifecycle", 0.6, 1.5, 6.1, 2.95);
  panel(s, "Versions", 0.6, pic.bottom + 0.2, 6.1, null, HEX.amber, HEX.amberTint, "TWO VERSIONS PER ADAPTER", null, [
    "Its own, by Semantic Versioning, in every step",
    "The platform API's, pinned: Graph v1.0, never beta",
    "Endpoint from the declared cloud; unknown fails at start",
  ], 12.5);
  table(s, "Invariants", 1.5, [1.75, 4.1], ["Invariant", "What it means"], [
    ["Boundary", "Runs inside the declared boundary, or names the exception"],
    ["No record edits", "Read-only writes nothing; change-making writes only its platform, on a plan"],
    ["Certificate-anchored", "Emits under its own workload identity, bound to a certificate"],
    ["Object identity only", "Claims resolve to authoritative identifiers, not display names"],
  ], { x: 6.9, fontSize: 12, limit: 4.4 });
  panel(s, "ReadOnly", 6.9, 4.4, 5.85, null, HEX.red, HEX.redTint, "READ-ONLY IS VERIFIED, NOT ASSUMED", null, [
    "Compare what the identity is granted with what is declared",
    "More than declared is a finding, whatever the code does",
  ], 13);
  sources(s, "Sources: Microsoft Learn — Graph permissions, versioning and national clouds; ScubaGear v1.8.0 permissions; Semantic Versioning 2.0.0; SP 800-53 (AC-6, SA-9). Book 13, Ch 08.");
  notes(s,
`An adapter is defined by its declaration, not its code: an entry in one of the two lists, schema-validated on every change. The chapter's illustrative entry for an Entra directory reader carries its class, mission, status and version, the pinned platform API and cloud, read-only Graph application permissions, its evidence class, interval or continuous, and four invariants every adapter inherits. Boundary: it runs inside the declared authorization boundary or names the exception and the decision that allowed it. No edits to the record. Certificate-anchored, so every claim's issuer resolves. And object identity only, which is what makes Book 12's join on authoritative identity possible. An emission outside the declared envelope is authorization drift; a declaration that breaks the schema is schema drift.

Read-only comes first: discovery precedes change, and least privilege is AC-6. But read-only has to be verified. ScubaGear's Graph permissions all end in Read, yet assessing Power Platform needs an administrator role, and a Global Administrator always has the permissions. A tool built to observe can run under an identity that can change things, so the conformance check compares granted with declared.

Each adapter tracks two versions: its own, by Semantic Versioning, and the platform API's, pinned. Microsoft says beta APIs aren't supported in production and deprecates a version at least 24 months before removal, so production adapters pin v1.0, and a beta-only dependency is a recorded risk with an owner. The endpoint comes from the declared cloud: GCC uses the global endpoint, GCC High and DoD their own.

Active status is earned through three test levels; retirement names a successor and flags any remaining reference as provenance drift.`,
  "Book 13, Chapter 08 — The Adapter Model, \"The contract,\" \"Read-only first,\" \"Versioning,\" \"Earning active status, and retiring.\"");
}
endModule("Module 3");

// ================================================================== 24 Module 4 divider
{
  const s = divider(P2, "Module 4: Who governs, reciprocity and scale", "Part 2 — Evidence, owners and authorization  ·  Chapters 09–12",
    ["Five questions, one owner each; exceptions and the board", "Ticket to machine in brief; reciprocity and ongoing authorization", "Continuous monitoring as a project; coverage and the gap register"], 16);
  notes(s,
`Module 4: who governs, reciprocity and scale. Everything so far is a machine, and none of it decides anything. A drift finding is a question: change the estate, change the record, or carry the difference for a while? The machine can answer the first for routine classes. The other two need a person with the authority to answer them.

So this module names the owners, then turns to the tempo, briefly, since it has its own reference deck. Then how one body of evidence serves many agencies and keeps an authorization current, and how the whole model survives a hundred systems without a separate arrangement for each.`,
  "Book 13, Chapter 09 — Who Governs; Chapter 10 — Ticket to Machine; Chapter 11 — Reciprocity; Chapter 12 — Governance at Scale.");
}

// ================================================================== 25 Who governs
{
  const s = content(P2, "Who governs: five questions, one owner each");
  tag(s, "Who");
  const pic = img(s, "ch09-who-governs", 0.6, 1.5, 6.4, 3.45);
  panel(s, "Steward", 0.6, pic.bottom + 0.2, 6.4, 6.45 - pic.bottom - 0.2, HEX.teal, HEX.tealTint, "TWO JOBS, KEPT APART", null, [
    "The steward keeps the record: custody, merge rights, checks, backups",
    "Information owners decide what each fact means",
  ], 12.5);
  table(s, "Deciders", 1.5, [3.25, 2.5], ["Change (program design)", "Decided by"], [
    ["Layer-1 rule inside the agreed architecture", "The steward"],
    ["A rule that encodes a control requirement", "The CISO; the steward implements"],
    ["Target architecture or authoritative origin", "Steward, with the sponsor's concurrence"],
    ["Policy mapping (layer 2)", "The adapter or indicator owner"],
    ["Runtime enforcement code (layer 3)", "The owning platform team"],
    ["Engine, classifier or thresholds", "Steward, with an outside reviewer"],
    ["Raise an operation class to L4", "The authorizing official"],
  ], { x: 7.0, fontSize: 12, limit: 6.5 });
  sources(s, "Sources: NIST SP 800-37 Rev. 2, App. D, Tasks P-7, M-1, M-6; SP 800-137 §2.4; SP 800-53 (CM-3, CM-3(4)); 36 CFR 1220.34. The model is program design. Book 13, Ch 09.");
  notes(s,
`Governance decays the same way compliance does. If nobody owns a rule, it goes stale; if nobody reads findings, they pile up; if nobody signs for an exception, it becomes permanent, and the record then describes an estate that no longer exists, with full provenance. So Chapter 09 asks five questions and gives each one owner. The model is program design; adapt it, but keep one decider per row.

The roles come from federal guidance. SP 800-37 supplies the decision rights: the AO is the only official who can accept risk, assigned to government personnel only, and its information owner or steward has authority over specified information. Its tasks give the continuous monitoring strategy to the senior accountable official for risk, change monitoring to the system owner, and ongoing authorization to the AO alone. SP 800-53's CM-3 supplies the board as a configuration change control element, and CM-3(4) puts security and privacy representatives on it, both Moderate.

Who keeps the record, and who decides what it says, are two jobs. The steward keeps it: branch protections, merge rights, checks, backups and the platform. Information owners decide meaning: HR for a worker type, an application owner for access, the CISO for a control requirement. A steward who edits a fact to make a finding go away has made someone else's decision.

The rule-change table adds the decider to each layer. The CISO's requirement stays the CISO's when written as code. A change to the classifier or thresholds gets a reviewer from outside the program office, the program's reading of CM-3(4). And only the AO raises a class to L4.`,
  "Book 13, Chapter 09 — Who Governs, \"Where the roles come from,\" \"Who keeps the authoritative record,\" \"Who approves rule changes.\"");
}

// ================================================================== 26 Exceptions and board
{
  const s = content(P2, "Exceptions, the board, and who governs the governors");
  tag(s, "Who");
  const pic = img(s, "ch09-exception-routing", 0.6, 1.5, 5.9, 3.45);
  panel(s, "Rules", 0.6, pic.bottom + 0.2, 5.9, 6.45 - pic.bottom - 0.2, HEX.amber, HEX.amberTint, null, null, [
    "No automatic renewal; renewed twice goes to the CISO and AO",
    "An exception never edits the rule; drift shows it as excepted",
  ], 12.5);
  const gb = panel(s, "Governors", 6.75, 1.5, 6.0, null, HEX.red, HEX.redTint, "WHO GOVERNS THE GOVERNORS", null, [
    "The steward can't approve the steward's own changes",
    "The component that detects drift doesn't accept it",
    "Platform changes get an outside reviewer",
    "Assessors read, re-run and never edit",
    "The AO stays outside the program office",
  ], 13);
  panel(s, "Board", 6.75, gb + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "THE BOARD REVIEWS; IT DOESN'T VOTE", null, [
    "CM-3's change control element; every two weeks with steering",
    "Quarterly: the exception register and every L4 class",
  ], 13);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-5, CA-5, CM-3, CM-3(4)); SP 800-37 Rev. 2; 36 CFR 1236.10; NARA GRS 3.1. Board, cadence and separations are program design. Book 13, Ch 09.");
  notes(s,
`A finding that can't be closed inside its window isn't closed by exception; it's carried, by a named decision, with an end date. A bounded exception has an end date and a compensating control: the owner writes it up, the steward records it in the register, and the CISO approves. Anything without an end date, past the agency's limit, or leaving a control unmet with no compensating control is a risk acceptance: the CISO recommends, the AO for the system decides, and it enters the POA&M, which CA-5 requires and SP 800-37 gives to the AO. No exception renews automatically; one renewed twice tells the CISO and AO that the rule or the system needs to change. And an exception never edits the rule. The drift engine keeps reporting the difference, marked excepted, so an excepted setting never looks like a passing one.

The governance board is CM-3's change control element for the record, usually the steering committee with a governance agenda. The board reviews; it doesn't vote, because a board that decides by consensus has no one accountable. It meets every two weeks, and still meets with nothing to decide: the drift trend, escalation rate and exceptions nearing their end dates are why it exists. Quarterly, it reviews the register and every L4 class.

The repository is a recordkeeping system. GRS 3.1 covers change records, and the records officer decides retention. History is never rewritten without the records officer's and CISO's concurrence.

And the governors are governed: no self-approval, enforced so administrators can't bypass it; the detector can't accept; assessors never edit; the AO stays outside.`,
  "Book 13, Chapter 09 — Who Governs, \"Who accepts exceptions,\" \"Who keeps the record as a record,\" \"The governance board,\" \"Who governs the governors.\"");
}

// ================================================================== 27 Ticket to machine
{
  const s = content(P2, "Ticket to machine, in brief: the person stops at approval");
  tag(s, "How");
  const pic = img(s, "ch10-tempo-paths", 0.6, 1.5, 6.5, 3.45);
  txt(s, "Windows", [
    { text: "Windows (program design): ", options: { bold: true, color: HEX.navy } },
    { text: "P1 immediate · P2 1 hour · P3 24 hours · P4 72 hours. A shorter external clock wins." },
  ], { x: 0.6, y: pic.bottom + 0.15, w: 6.5, h: 0.6, fontSize: 13 });
  panel(s, "Qualify", 7.35, 1.5, 5.4, null, HEX.teal, HEX.tealTint, "A CLASS QUALIFIES WHEN ALL SIX HOLD", null, [
    "A machine can reach the surface",
    "The fix is deterministic, from the record",
    "The scope is bounded, blast radius computed first",
    "There is a way back, or a defined recovery",
    "A re-read can verify the result",
    "It isn't on the permanent-L3 list",
  ], 14);
  callout(s, "Reference", 5.75, 0.8, "FaRoute", HEX.amber, "Loop, lanes and worked examples: ",
    "see the narrated Ticket-to-Machine reference deck for Appendix B.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-5, AU-14, CM-3(1), CM-3(3), CM-6(1), SI-2(5)); SP 800-137 §2.3; CISA BOD 26-04; CA/B Forum SC-081v3. Book 13, Ch 10; App. B.");
  notes(s,
`Chapter 10 has its own narrated reference deck for Appendix B, which walks the coordination loop, the five lanes, the tempo and four worked examples, so here's the argument in brief.

A platform that detects perfectly and closes slowly produces a growing, accurate, timestamped list of things nobody fixed. What keeps the list short is tempo. The windows are the program's design, and an external clock wins whenever it's shorter: BOD 26-04's remediation timelines for exploited vulnerabilities, or CISA's one-hour incident notification.

Native tools can detect drift and change state, and show posture for their own boundary. What a console alone doesn't hold is the record an assessor relies on: who owns the finding, what clock they're on, who approved, and what re-test proves it closed. And putting a ticket in front of a person who then opens the console doesn't fix it: the closure is still an assertion. So wherever a machine can reach the surface, the ticket authorizes a machine. A human approves; the platform executes from a versioned plan under a service identity after a dry run, and re-reads the object. A 2xx response isn't closure.

A class qualifies on six tests. The ladder then decides where approval attaches: at L3 to each instance, at L4 to the class, accepted in advance by the AO with conditions. Certificates are the deliberate exception: validity falls to 47 days by 2029, so routine issuance closes by protocol automation, not a ticket per renewal. Where no machine can reach, the fallback is a declared exception: an approved, time-boxed, proxied and recorded session under AU-14, with counsel consulted, never a silent trip to the console.`,
  "Book 13, Chapter 10 — Operational Tempo: Ticket to Machine, \"The program's tempo,\" \"Which change classes qualify,\" \"When no machine can reach the surface\"; Appendix B.");
}

// ================================================================== 28 Reciprocity
{
  const s = content(P2, "Reciprocity: one package, each agency's own decision");
  tag(s, "How");
  const pic = img(s, "ch11-one-package-many-decisions", 0.6, 1.5, 5.95, 3.7);
  txt(s, "Position", [
    { text: "Program design: ", options: { bold: true, color: HEX.teal } },
    { text: "one package and one provider decision; each consuming agency's AO signs its own, within a latitude table." },
  ], { x: 0.6, y: pic.bottom + 0.15, w: 5.95, h: 1.05, fontSize: 13.5 });
  table(s, "Mechanisms", 1.5, [1.75, 4.2], ["SP 800-37 mechanism", "Who accepts the risk"], [
    ["Authorization to use", "The customer's AO, for the customer's information"],
    ["Joint authorization", "All participating AOs, only while they agree"],
    ["Type authorization", "The developer's AO issues the ATO; each site issues an ATU"],
  ], { x: 6.8, fontSize: 12, limit: 3.6 });
  panel(s, "M2415", 6.8, 3.8, 5.95, null, HEX.navy, HEX.navyTint, "M-24-15 AND FEDRAMP 2026 (FEDERAL REQUIREMENT)", null, [
    "Presume a maintained package adequate at or below its impact level",
    "Ask for more only on a documented, demonstrable need",
    "Each agency authorizes its own system; no standalone ATO for a cloud offering",
    "Review every quarterly Ongoing Certification Report",
  ], 12.5);
  sources(s, "Sources: NIST SP 800-37 Rev. 2, App. F; SP 800-53 (CA-6(1), CA-6(2)); OMB M-24-15; FedRAMP 2026 agency rules (AGU-*, CCM-AGM-ROR); OMB A-130. Book 13, Ch 11.");
  notes(s,
`A platform twenty agencies use gets examined by twenty assessment teams, producing twenty snapshots that diverge from each other and from the estate. NIST defines reciprocity as an agreement to accept each other's assessments. It's about accepting assessments, not transferring risk acceptance.

SP 800-37 gives three mechanisms. An authorization to use: a customer accepts a package another federal entity authorized, and the customer's AO carries the same responsibility as one issuing an ATO, for the customer's information. A joint authorization under CA-6(1) or CA-6(2): several AOs jointly accept the risk, in effect only while they agree. And a type authorization for an archetype deployed identically in many places.

For cloud services, M-24-15 sets a presumption of adequacy: agencies must presume a FedRAMP package adequate at or below its impact level, but only while it's maintained by continuous monitoring. It doesn't replace the agency's decision; it can be set aside only for a demonstrable need or a substantially deficient package, documented and reported to FedRAMP. FedRAMP's 2026 rules make that enforceable: complete the ATO process, notify FedRAMP with the letter, don't demand materials beyond its requirements, have GRC tools that produce and ingest OSCAL, and never create a standalone ATO for a cloud offering. And review each quarterly Ongoing Certification Report.

The program's position: one package and one provider decision cover a shared service, and each consuming agency's AO issues its own decision reusing it. Agencies differ in configuration, not packages: an election outside the latitude table is drift. One package concentrates risk by design, so its health is watched continuously.`,
  "Book 13, Chapter 11 — Reciprocity, Indicators and One Authorization, \"What reciprocity means,\" \"What M-24-15 says about reuse,\" \"What FedRAMP's 2026 rules add,\" \"One package for a shared service.\"");
}

// ================================================================== 29 Ongoing authorization
{
  const s = content(P2, "Ongoing authorization, indicators and signed manifests");
  tag(s, "How");
  const pic = img(s, "ch11-ongoing-authorization", 0.6, 1.5, 5.3, 4.2);
  txt(s, "Reauth", "Under ongoing authorization, reauthorization is, in most instances, event-driven.",
    { x: 0.6, y: pic.bottom + 0.15, w: 5.3, h: 0.6, fontSize: 13, italic: true, color: HEX.ink });
  const kb = panel(s, "KSI", 6.15, 1.5, 6.6, null, HEX.navy, HEX.navyTint, "46 KEY SECURITY INDICATORS, TEN THEMES", "They bind providers, not agencies", [
    "Class C: at least two automated methods per indicator; Class D: four",
    "Agencies use them as vocabulary, and through each provider's quarterly report",
  ], 13);
  panel(s, "Manifest", 6.15, kb + 0.25, 6.6, null, HEX.red, HEX.redTint, "PROVING WHO PRODUCED A BUNDLE", null, [
    "An HMAC needs the shared key: whoever verifies it could have made it",
    "A hash manifest can be rewritten by whoever changes a file",
    "Program design: a manifest signed with the provider's key, checked against its certificate",
  ], 13);
  sources(s, "Sources: NIST SP 800-37 Rev. 2, App. F; OMB A-130, App. I; FedRAMP 2026 KSI reference, SDR-CSX-KSI, FRC-CSX-VVK; FIPS 198-1; FIPS 186-5. Book 13, Ch 11.");
  notes(s,
`Reciprocity reuses one package across agencies; ongoing authorization reuses one package across time, and the second is what makes the first safe. SP 800-37 defines it as follow-on risk determinations at agreed and documented frequencies, time- or event-driven, dependent on a robust continuous monitoring program, and A-130 requires the transition when a system is eligible and the AO approves.

The mechanics are specific. Two conditions: an initial authorization from a complete, zero-based review, and a continuous monitoring program monitoring controls at the required frequencies. The AO then issues a new decision that makes clear the system is no longer bound to its termination date. Reviews are time-driven, at the strategy's frequency, and event-driven, immediately on a trigger, and either way the AO acknowledges ongoing acceptance. Reauthorization becomes, in most instances, an event-driven action. This is where the book lands: the record, controlled change, deterministic rules, drift detection and system evidence are what a robust monitoring program looks like when it's built, and the same evidence keeps a shared package presumed adequate.

FedRAMP's 2026 rules have 46 Key Security Indicators in ten themes. They bind providers: a provider's Security Decision Record summarizes each, and Class C needs at least two automated methods per indicator, Class D four. The program's own deterministic rules aren't KSIs; where one bears on an indicator, the result carries a tag, read from FedRAMP's machine-readable ruleset.

And proof of who produced a bundle needs a signature. An HMAC uses a shared key; a hash manifest can be rewritten. Hence a signed manifest.`,
  "Book 13, Chapter 11 — Reciprocity, Indicators and One Authorization, \"Two corrections to the earlier design,\" \"The 2026 Key Security Indicators,\" \"One body of evidence, one standing decision.\"");
}

// ================================================================== 30 ConMon project
{
  const s = content(P2, "Continuous monitoring run as a chartered project");
  tag(s, "How");
  const pic = img(s, "ch12-conmon-project-phases", 0.6, 1.5, 6.6, 3.3);
  panel(s, "Small", 0.6, pic.bottom + 0.2, 6.6, 6.45 - pic.bottom - 0.2, HEX.teal, HEX.tealTint, "HELD SMALL SO A HUNDRED PROGRAMS COMPARE", null, [
    "The record's core, the drift model and the tooling surface",
    "Adapters, mappings and evidence grow, if they conform",
  ], 12);
  table(s, "Cadence", 1.5, [2.45, 1.45, 1.5], ["Signal (program design)", "Collected", "Reviewed"], [
    ["Critical (P1) drift findings", "Continuously or hourly", "Immediately"],
    ["Compliance-policy and CA results", "Daily", "Weekly"],
    ["Attribute and group changes", "Daily", "Weekly"],
    ["Residual risk register", "—", "Monthly, or on change"],
    ["Full control assessment", "—", "Quarterly"],
  ], { x: 7.35, fontSize: 12, limit: 4.75 });
  panel(s, "Boundaries", 7.35, 4.4, 5.4, null, HEX.navy, HEX.navyTint, "BOUNDARIES ARE GOVERNED OBJECTS", null, [
    "A closed set; adding one is a governed change",
    "Findings cite their boundary",
  ], 12);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CA-7, PM-31); SP 800-37 Rev. 2, Tasks P-5, P-7; SP 800-137; OMB A-130, App. I. Charter, phases and cadence are program design. Book 13, Ch 12.");
  notes(s,
`A real agency has dozens or hundreds of systems, several modernization programs and more than one boundary. Federal guidance already separates system from organization: CA-7's system-level strategy follows the organization-level one, PM-31 asks for that organization-wide strategy, P-7 gives it to the senior accountable official for risk, and A-130 requires metrics meaningful at every tier.

The scaling rule is program design: hold the definitions small, and let the uses grow if they conform. The record's core, the five classes and four severities, and the tooling surface stay small; adapters, mappings and evidence grow. If every program could add its own drift class, a P1 in one wouldn't mean a P1 in another, and PM-31's metrics would add incompatible numbers. One repository and one merge gate mean the record can't move on without the code that reads it.

Boundaries are recorded, not assumed. Adapters declare the boundary they observe, the set is closed, so a new exception is a new value with its decision, and findings cite their boundary, as in drift-provenance at the GCC Moderate edge.

The continuous monitoring program runs as a chartered project, to turn monitoring from periodic reporting into an operational fabric. Its five phases each end at a gate, like the migration gates: charter and alignment, the evidence contract, emission from at least two sources, aggregation on the naming-plane identity with unjoinable records counted, not dropped, and then detection for one object class with package artifacts generated and coverage published. The risk to plan for is more findings than the organization can remediate; severity orders them and routine classes move to the machine tempo.`,
  "Book 13, Chapter 12 — Governance at Scale, \"What stays small and what grows,\" \"Boundaries as governed objects,\" \"The continuous-monitoring program as a project.\"");
}

// ================================================================== 31 Coverage and gaps
{
  const s = content(P2, "Coverage, the gap register, and three ways a gap closes");
  tag(s, "How");
  img(s, "ch12-gap-lifecycle", 0.6, 1.5, 5.6, 4.0);
  table(s, "Coverage", 1.5, [1.6, 4.7], ["Classification", "Meaning"], [
    ["Covered", "The platform enforces the control and produces evidence"],
    ["Partial", "Supported, but evidence or enforcement is incomplete"],
    ["Gap", "Required, but not delivered by the platform"],
    ["Out of scope", "Not required for this boundary or workload"],
  ], { x: 6.45, fontSize: 12, limit: 3.4 });
  table(s, "Close", 3.55, [2.05, 4.25], ["Decision", "Federal mechanism"], [
    ["Close by configuration", "A POA&M entry under CA-5 until the change is verified"],
    ["Compensating control", "Mitigation; evidence labeled as the substitute's"],
    ["Accept", "The AO's risk acceptance, which can't be delegated"],
  ], { x: 6.45, fontSize: 12, limit: 5.5 });
  callout(s, "Proven", 5.65, 0.85, "FaListCheck", HEX.teal, "Counts, not a percentage: ",
    "report proven claims, with a named test and current evidence, separately from asserted ones.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CA-5, PM-4); SP 800-37 Rev. 2 (Task R-4, App. F); SP 800-137; OMB A-130 (POA&Ms). The coverage doctrine and register are program design. Book 13, Ch 12.");
  notes(s,
`No single platform delivers every control, and a package that implies otherwise hides residual risk in the space between what the platform does and what the package says. The program's coverage doctrine makes that space explicit. Every control, per boundary or workload, is covered, partial, gap or out of scope. Partial is the honest answer for many controls, and the one most often rounded up to covered. SP 800-37 explains why it's normal: automated tools may not cover every control or every part of one, and manual assessment fills the gaps.

Every partial or gap becomes an entry in the gap closure register: the residual risk, the owner, the planned action, the evidence required, a target date and a status. Four rules govern it. No gap closes without evidence, and the evidence is named when the entry opens, not found when someone wants to close it. Accepted risk needs explicit approval and a review date. The register is reviewed on the monthly residual-risk cadence. And closed items stay, because the register is a history, not a to-do list.

A gap closes three ways, each on a federal mechanism. By configuration, with a POA&M milestone until the change is verified. By compensating control, which is SP 800-137's mitigation, with the evidence labeled as coming from the substitute. Or by acceptance, which only the AO can give. An accepted gap leaves the POA&M, which A-130 reserves for weaknesses not associated with accepted risks, and stays in the register.

And the coverage report gives counts, proven and asserted, so the AO accepts a risk they can see.`,
  "Book 13, Chapter 12 — Governance at Scale, \"Coverage, gaps and how gaps close,\" \"What doesn't scale automatically,\" \"The honest limits of coverage.\"");
}

// ================================================================== 32 Decisions
{
  const s = content(P2, "Decisions to make, and what to start on Monday");
  tag(s, "How");
  table(s, "Decisions", 1.5, [5.0, 2.55, 0.9], ["Decision (design guidance)", "Who decides", "Ch."], [
    ["Charter the governance board in writing and name the steward", "Sponsor and CIO", "09"],
    ["Ratify the roster of authoritative sources; demote every other copy", "Steward, with the sponsor", "03, 09"],
    ["Branch protection that binds administrators on the record", "Steward", "04"],
    ["Which operation classes, if any, may run at L4", "Authorizing official", "06, 09"],
    ["Assessor independence, and their own access to archived inputs", "Authorizing official", "07, 09"],
    ["Coverage per control: proven counted apart from asserted", "CISO", "09, 12"],
  ], { fontSize: 12, limit: 6.5 });
  panel(s, "Monday", 9.25, 1.5, 3.5, null, HEX.teal, HEX.tealTint, "NO NEW PLATFORM NEEDED", "Start with these", [
    "Find private copies of the record",
    "Count human-only closures separately",
    "Compare adapter grants with declarations",
    "Record people's findings as contracts",
    "Open the gap register",
  ], 14);
  sources(s, "Sources: Book 13, Chapters 03–12; NIST SP 800-37 Rev. 2; SP 800-53 Rev. 5 (CM-3, CA-5). Decisions and sequence are program design guidance.");
  notes(s,
`So, the decisions, each with its owner, all of them design guidance.

The sponsor and CIO charter the governance board in writing and name the steward, because they own scope and funding. The steward, with the sponsor's concurrence, ratifies the roster of authoritative sources, because it's a change to the rules for authoritative origin; every other copy is then demoted, and any write to it becomes contention. The steward turns on branch protection that binds administrators, because a rule administrators can skip is a standing exception. The authorizing official decides which operation classes, if any, run at L4, in writing, with conditions and a quarterly review; everything else stays at gated actuation. The authorizing official sets the independence assessors need, and the program gives assessors their own read access to the archived inputs and the pipeline, because a re-run only proves independence when the assessor performs it. And the CISO, who decides on continuous monitoring evidence, has coverage reported per control, with proven claims counted apart from asserted ones.

Five things to start on Monday that need no new platform. Look for private copies of the delegation matrix or attribute map: scripts with hardcoded paths or a local checkout. Count human-only closures separately from probe-backed ones in every report. Compare each adapter identity's granted permissions with what its declaration says. Record findings that people find in the remediation-contract shape, so evidence looks the same however it was found. And open the gap closure register, naming the evidence each entry needs before anyone tries to close it.

Governance that doesn't decay is governance whose gaps are written down, owned and evidenced. Chapters 01 through 12 and the two appendices carry the detail, every claim footnoted, and Appendix A maps every control. Thank you.`,
  "Book 13, Chapters 03, 04, 06, 07, 09 and 12; Appendix A — Requirements Mapping.");
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
  "Federal Information Security Modernization Act of 2014, 44 U.S.C. § 3554(b)(5).  ·  OMB Circular A-130 (July 2016), Appendix I, §4.d and §5.h.",
  "NIST SP 800-37 Rev. 2 (Dec. 2018): Executive Summary; §3.7 Tasks M-1 and M-6; Appendix F (ongoing authorization, reauthorization, transition).",
  "NIST SP 800-137 (Sept. 2011): §1, §2.2, §3.2.2 (security control volatility).  ·  CISA and NSA, AA23-278A, top ten misconfigurations (Oct. 5, 2023).",
  "NIST SP 800-53 Rev. 5 (release 5.2.0, OSCAL catalog): AU-10, CA-7, CA-7(6), CM-2, CM-2(2), CM-3, CM-3(2), CM-3(5), CM-5, CM-5(1), CM-5(4), CM-6, CM-6(1), CM-6(2), SA-10.  ·  SP 800-53B.",
  "FedRAMP Consolidated Rules for 2026: Rev5 control reference (CM, AU, SA families); Key Security Indicators, Change Management (KSI-CMT-LMC, RMV, RVP, VTD; Oct. 13, 2026 mappings).",
  "NIST SP 800-207, Zero Trust Architecture (Aug. 2020), §2 and §3.4.1.  ·  Microsoft Graph, onPremisesExtensionAttributes resource type.",
  "Pro Git, 2nd ed., §10.2 Git Objects.  ·  GitHub Docs, About protected branches.  ·  Microsoft Learn, What is Microsoft Entra Privileged Identity Management?",
  "Full footnotes with links and access dates: Book 13, Chapters 01–04.",
]);
sourceSlide("Sources behind Module 2 — Rules and the drift engine", [
  "RFC 8785, JSON Canonicalization Scheme (June 2020).  ·  CISA ScubaGear README.  ·  Open Policy Agent, Introduction.",
  "NIST SP 800-53 Rev. 5 (release 5.2.0, OSCAL catalog): CA-7, CA-7(1), CA-7(4), CM-2, CM-2(2), CM-3, CM-3(2), CM-3(5), CM-4, CM-6, CM-6(1), CM-6(2).",
  "NIST SP 800-53B Rev. 5 Moderate and High baseline profiles (OSCAL).  ·  NIST OSCAL, Layers and Models.",
  "NIST SP 800-128, Guide for Security-Focused Configuration Management (Aug. 2011, updated Oct. 10, 2019), §2.2 and §3.4.1.",
  "Microsoft Learn: What is Azure Machine Configuration?; Understand machine configuration assignment resources (Audit, ApplyandMonitor, ApplyandAutoCorrect).",
  "Workbook cross-references: Book 00, Ch 04 (principles); Book 01, Ch 04 and Ch 11 (actuation ladder); Book 02, Ch 05 and Ch 11; Book 03, Ch 11.",
  "Full footnotes with links and access dates: Book 13, Chapters 05–06.",
]);
sourceSlide("Sources behind Module 3 — Evidence and adapters", [
  "NIST SP 800-53A Rev. 5 (Jan. 2022): §3.2.3.5, Appendix C (assessment methods), Appendix F (ongoing assessment and automation).",
  "NIST SP 800-37 Rev. 2: §3.7 footnote 108; Appendix F, information generation, collection and independence.",
  "FedRAMP Consolidated Rules for 2026: IVV-IAS-VIM, IVV-CSO-USR; CPO-CSX-CPM, CPO-CSF-CPM; KSI-SVC-VRI.  ·  NIST OSCAL Layers and Models; OSCAL Reference v1.2.3 back-matter hashes.",
  "Microsoft Learn, X509Certificate2.Thumbprint.  ·  NIST FIPS 186-5, Digital Signature Standard (Feb. 3, 2023).  ·  OMB M-26-14 (May 22, 2026), Appendix C.",
  "NIST SP 800-53 Rev. 5: AC-6, AU-9, AU-9(3), AU-10, SA-9, SI-7, SR-4.  ·  NIST OSCAL Component Definition Model.  ·  Semantic Versioning 2.0.0.",
  "Microsoft Learn: Overview of Microsoft Graph permissions; Versioning, support, and breaking change policies for Microsoft Graph; Microsoft Graph national cloud deployments.",
  "CISA ScubaGear v1.8.0 documentation, Interactive Permissions.",
  "Full footnotes with links and access dates: Book 13, Chapters 07–08.",
]);
sourceSlide("Sources behind Module 4 — Who governs and scale", [
  "NIST SP 800-37 Rev. 2: Appendix D roles; Tasks P-5, P-7, M-1, M-6, R-4; Appendix F authorization types.  ·  NIST SP 800-137 §2.3, §2.4, §3.6.",
  "NIST SP 800-53 Rev. 5: AC-5, AU-14, CA-5, CA-6(1), CA-6(2), CA-7, CM-3, CM-3(1), CM-3(3), CM-3(4), CM-6(1), PM-4, PM-31, SI-2(5); SP 800-53B profiles.",
  "36 CFR 1220.34 and 1236.10.  ·  NARA GRS 3.1 (Transmittal 30), items 030 and 040.  ·  OMB M-19-17 (May 21, 2019), Governance.",
  "CISA BOD 26-04 (June 10, 2026).  ·  CISA Federal Incident Notification Guidelines.  ·  CA/Browser Forum Ballot SC-081v3 (April 2025).  ·  Microsoft Learn, Entra PIM.",
  "OMB M-24-15, Modernizing FedRAMP (July 25, 2024).  ·  OMB Circular A-130, Appendix I, §4.c and §4.d.",
  "FedRAMP Consolidated Rules for 2026: Using a FedRAMP Certified Cloud Service; ruleset 2026.10.13.01 (AGU-*, CCM-AGM-ROR, SDR-CSX-KSI, FRC-CSX-VVK); Key Security Indicators; Definitions.",
  "NIST FIPS 198-1, HMAC (July 2008).  ·  NIST FIPS 186-5 (Feb. 3, 2023).",
  "Full footnotes with links and access dates: Book 13, Chapters 09–12; Appendices A and B.",
]);

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
