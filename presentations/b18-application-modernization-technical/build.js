// Book 18 — Application Modernization: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — Deciding and designing:   Module 1 (Ch01–02, the portfolio, the dispositions and the scored triage),
//                                       Module 2 (Ch03–04, the target reference architecture and moving the data).
//   Part 2 — Governing and running:    Module 3 (Ch05–07, generative and agentic AI, compliance by design, the board and gates),
//                                       Module 4 (Ch08–10, the reference implementation, TOGAF and Zachman, the waves).
// Build:  node presentations/b18-application-modernization-technical/build.js presentations/b18-application-modernization-technical/B18_Application_Modernization_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b18-application-modernization/; the notes name the chapter.
// The program's own recommendations are labeled "program design" or "design guidance", and product versions and support
// windows are stated as of the book's check dates (October 28–29, 2026), as the book does.
// Goes deeper than a briefing: triage scoring mechanics, the reference architecture's components, schema conversion,
// validation, cut-over and coexistence, agent guardrails, controls and gates, the reference implementation, the
// TOGAF ADM and Zachman mapping and wave planning, for architects, application and data engineers, DBAs and ISSOs.
// Narration: narration.json (intent-first voice, keyed by slide title) is read by presentations/_build/narrate.py
// (the editor runs that). The notes keep the full detail for a live presenter.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 18", title: "Application Modernization — Technical Deep Dive" });
const { HEX, txt, box, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B18_Application_Modernization_Technical.pptx";

// ------------------------------------------------------------------ helpers
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// The kit's full-width callout, with a fit check (16.5 pt text in a 10.65-inch frame).
const callout = (s, name, y, h, iconName, color, label, text) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * 16.5 / 72) / 10.45) * 16.5 / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  warn(`${name} callout`, y + h);
  if (process.env.FIT) console.log(`  callout ${name}: bottom ${(y + h).toFixed(2)} in`);
  return D.callout(s, name, y, h, iconName, color, label, text);
};

// Speaker notes with an automatic timing cue (live delivery runs ~142 words a minute).
const WPM = 142;
let clock = 0, words = 0, modWords = 0;
const modules = [];
const mmss = (t) => { const r = Math.round(t); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`; };
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
  const rowH = [rh(headers, true), ...rows.map((r) => rh(r))];
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
  warn(`${name} panel`, y + h);
  return y + h;
};

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

// A committed diagram placed inside a box, keeping the PNG's aspect ratio (read from its header).
// Alt text is the chapter's own fig-alt, read from the chapter so the two can't drift apart.
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b18-application-modernization", "png");
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b18-application-modernization");
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
  warn(`${name} image`, y + h);
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

const P1 = "Part 1 — Deciding and designing";
const P2 = "Part 2 — Governing and running";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "Application Modernization: the technical deep dive", "Book 18 — Application Modernization: triage, the target architecture, data, AI, gates and waves");
  txt(s, "Session map", [
    { text: "Part 1 — Deciding and designing", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  The portfolio and the triage   ·   Module 2  The target architecture and the data", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Governing and running", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  AI, compliance and governance   ·   Module 4  Implementation, frameworks, waves", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.9, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 18 of the Federal Modernization Workbook, Application Modernization. It's for enterprise and solution architects, application and data engineers, database administrators and ISSOs: the people who decide what each legacy application becomes, build the ones that change, move their data and prove the result.

It runs in two parts and four modules you can watch separately. Part 1 is deciding and designing: the portfolio argument, the six dispositions and the scored triage, then the target reference architecture and moving data off DB2 and Oracle. Part 2 is governing and running: generative and agentic AI with guardrails, compliance by design, the review board and its four gates, then the reference implementation, the TOGAF and Zachman mapping, and the waves.

Three labels to listen for. Program design is marked as such: the rubric, the stack choices, the gates and the wave sizes are the book's design, not federal requirements. Product versions and support windows are as of October 28 and 29, 2026, and they move. And the reference implementation is illustrative: its tests pass against real PostgreSQL, but it hasn't been run against a real DB2 or Oracle database or in production. I'll describe the code rather than walk through it.`,
  "Book 18, index; Chapters 01–10.");
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: a portfolio, not a rewrite");
  tag(s, "Why");
  const pic = img(s, "ch01-portfolio-not-rewrite", 0.6, 1.5, 6.6, 3.9);
  const pb = panel(s, "GAO", 7.45, 1.5, 5.3, null, HEX.red, HEX.redTint, "WHAT GAO FOUND (JULY 2025)", null, [
    "More than $100 billion a year on federal IT; about 79% of FY 2025 planned spending goes to O&M",
    "11 most critical systems, about 23 to 60 years old, about $754 million a year to run",
    "3 of the 11 had plans with all key elements; 2 had no plan",
    "The extent of legacy IT is unknown: investments aren't flagged as legacy",
  ], 13.5);
  callout(s, "Segments", Math.max(pic.bottom, pb) + 0.25, 0.9, "FaRoute", HEX.red, "Policy already says it: ",
    "A-130 asks for useful segments of narrow scope and brief duration; the FAR asks for increments that each stand alone.");
  sources(s, "Sources: GAO-25-107795 (July 2025) and product page; GAO-19-471 (June 2019); OMB Circular A-130 §5.d(1); FAR 39.103; Fowler, \"Strangler Fig\" (2024). Book 18, Ch 01.");
  notes(s,
`Why this matters. Most federal IT money keeps existing systems running. GAO's July 2025 review puts federal IT spending at more than 100 billion dollars a year, with agencies typically reporting about 80 percent on operations and maintenance; for fiscal 2025 the 24 CFO Act agencies planned about 83 billion, 79 percent. 

Its list of the most critical systems: 11 in 2025, about 23 to 60 years old, about 754 million dollars a year to run. Only 3 had plans with all three key elements GAO looks for, milestones, the work to modernize and the disposition of the legacy system, and 2 had no plan. None of those elements is a technology choice. And GAO says the extent of legacy IT is simply unknown, because OMB doesn't require investments to be flagged as legacy.

Two readings matter. Eleven systems are the top of the list, not the list: the bulk of the cost sits in thousands of ordinary applications. And the gap is planning, decided per system.

The figure is the book's argument. Big-bang rewrites deliver value only at the end, have to rediscover the old system's real specification, and concentrate risk in one cut-over. Federal policy already points the other way: A-130 asks for useful segments of narrow scope and brief duration, and the FAR's modular contracting rule asks for increments that each deliver a workable system.`,
  "Book 18, Chapter 01 — A Portfolio, Not a Rewrite, \"The scale of the problem,\" \"Why big-bang rewrites fail.\"");
}
endModule("Orientation");

// ================================================================== 3 Module 1 divider
{
  const s = divider(P1, "Module 1: The portfolio and the triage", "Part 1 — Deciding and designing  ·  Chapters 01–02",
    ["The application as the unit, and the six dispositions", "Six criteria scored on two axes, with confidence flags", "The seven-rule decision table, owner review and calibration"], 9);
  notes(s,
`Module 1: the portfolio and the triage. Before anyone picks a framework or a database, every application needs a decision about what it becomes. In a portfolio of thousands that can't be a study per application; a three-month assessment of each would outlast most of them.

So: why the application is the unit of decision, and the six dispositions with the vendor vocabularies they line up with; the six criteria and where their data already lives; the two axes and the confidence flags; the seven-rule decision table; and the owner review, decision record and calibration that keep it honest.`,
  "Book 18, Chapter 01 — A Portfolio, Not a Rewrite; Chapter 02 — Triaging the Portfolio.");
}

// ================================================================== 4 Six dispositions
{
  const s = content(P1, "Six dispositions, in rising order of cost and risk");
  tag(s, "What");
  const tb = table(s, "Dispositions", 1.5, [1.5, 3.9, 3.0, 1.85, 1.9], ["Disposition", "Signals that point to it", "What it ends with", "AWS 7 Rs", "Microsoft CAF"], [
    ["Retire", "Few users; duplicates another system; function not needed; a product or shared service does it", "No running application; a records disposition; hosting and license cost stops", "Retire; Repurchase", "Retire; Replace"],
    ["Retain", "Stable, supported, meets its need; or too risky to move before something else", "A documented reason and a review date", "Retain", "Retain"],
    ["Rehost", "A sound application on a platform being exited", "Same application, new hosting", "Rehost; Relocate", "Rehost"],
    ["Replatform", "Logic is sound; the platform under it is unsupported or expensive", "Same logic on a supported platform", "Replatform", "Replatform"],
    ["Refactor", "Valuable, changing often, blocked by its structure or language", "Services on the target; legacy pieces retired one by one", "Refactor or re-architect", "Refactor; Rearchitect"],
    ["Rebuild", "Valuable, but the code can't be salvaged or requirements outgrew it", "A new application on the target", "Refactor or re-architect", "Rebuild"],
  ], { fontSize: 12, limit: 5.6 });
  callout(s, "Choices", tb + 0.2, 0.9, "FaScaleBalanced", HEX.navy, "Two deliberate choices: ",
    "replace is a form of retire, so \"could a product or shared service do this?\" is tested before refactor; relocate is a form of rehost.");
  sources(s, "Sources: AWS Prescriptive Guidance, migration strategies; Microsoft CAF and the 6 Rs of app modernization; OMB A-130 §5.a(3). The six names are program vocabulary. Book 18, Ch 01–02.");
  notes(s,
`The unit of decision is the application. A program or mission area is too coarse: one area holds applications that should be retired next to ones that should be rebuilt. A platform, the mainframe or the Oracle estate, treats a hundred different applications as one, and can't be retired until every one has a decision. The application works, because it has a mission owner, a data set, a code base, dependencies and an authorization boundary.

The table lists the six dispositions in rising order of cost and risk, and that order is the rubric's first rule: an application gets the cheapest disposition that meets its mission need, and every step down the table has to be justified by the scores. Retire and retain are decisions, not projects; they need an owner's agreement, and for retire a decommissioning checklist, but no engineering team.

The right two columns line the six up with what vendors say. AWS's Prescriptive Guidance lists seven Rs and warns that refactoring is the most complex strategy and isn't recommended for large migrations. Microsoft's Cloud Adoption Framework lists eight.

Two choices are deliberate. Replace is a form of retire, because the new service is an acquisition with its own authorization; and A-130 says custom development should start only when no existing alternative can meet the need. Relocate is a form of rehost. The six names are the program's vocabulary, not federal policy.`,
  "Book 18, Chapter 01 — \"The unit of decision is the application\"; Chapter 02 — Triaging the Portfolio, \"The six dispositions,\" \"Where the names come from.\"");
}

// ================================================================== 5 Six criteria
{
  const s = content(P1, "Six criteria, each scored from data you already hold");
  tag(s, "What");
  const tb = table(s, "Criteria", 1.5, [1.95, 3.3, 4.0, 2.9], ["Criterion", "What it asks", "Where the data comes from", "Grounding"], [
    ["Mission criticality", "How much the mission depends on it; what happens if it fails or is wrong", "Business impact analysis; FIPS 199 availability and integrity; high value asset designation", "FIPS 199; GAO's unmet mission needs"],
    ["Technical condition", "Is it supported, patchable and changeable?", "Configuration database; vulnerability scans; vendor support dates; hardware and software age", "A-130: phase out unsupported components; GAO: 7 of 11"],
    ["Data sensitivity", "What data it holds, and how hard it is to move", "FIPS 199 confidentiality; PII inventory and PIAs; engine and size", "FIPS 199; A-130's PII inventory"],
    ["Cost", "What it costs to run, and what each disposition would cost", "IT spending data; hosting, license and support contracts; staff time", "40 U.S.C. 11312 risk-adjusted return"],
    ["Skills", "Can the agency staff it today and in five years?", "Workforce data; contracts; the languages in the code base", "GAO on COBOL and assembly skills"],
    ["Dependencies", "What it calls, what calls it, what shares its data", "Network flows; interface agreements; database links; batch schedules", "AWS: unmigrated dependencies"],
  ], { fontSize: 12, limit: 5.6 });
  callout(s, "Twice", tb + 0.2, 0.9, "FaDatabase", HEX.amber, "Two scoring rules: ",
    "dependencies decide sequence, not disposition; and PL/SQL and stored procedures count twice, in skills and in migration effort.");
  sources(s, "Sources: FIPS 199 §§3–4; OMB A-130 §5.a(1); GAO-25-107795; 40 U.S.C. §11312; AWS Prescriptive Guidance, migration strategies. Book 18, Ch 02.");
  notes(s,
`The six criteria come from what GAO, federal policy and the providers' guidance say drives modernization risk and value, and every one can be scored from data the agency mostly holds already.

Mission criticality: how much the mission depends on the application, from the business impact analysis, the FIPS 199 availability and integrity impact, and any high value asset designation. Technical condition: is it supported, patchable and changeable, from the configuration database, scans and vendor support dates. Data sensitivity: the FIPS 199 confidentiality impact, the PII inventory and privacy impact assessments, plus the engine and size, because sensitivity here also means how hard the data is to move. Cost: run cost and the cost of each disposition, which is what the Clinger-Cohen capital planning statute's risk-adjusted return asks for. Skills: about the future, not the present. An application one contractor team maintains in a language few people still learn scores badly even if it runs well, because GAO's point is that those skills cost more as the pool shrinks. Dependencies: network flows, interface agreements, database links and batch schedules.

Two rules in the callout. A heavily connected application may still be refactored, but not first; Chapter 10 uses the dependency score to build waves. And business logic in the database counts twice: it raises the skills score and the migration effort, and makes a rehost or replatform harder than it looks.`,
  "Book 18, Chapter 02 — \"The six triage criteria.\"");
}

// ================================================================== 6 Two axes
{
  const s = content(P1, "Two axes, a confidence flag, and where the grid points");
  tag(s, "What");
  const pic = img(s, "ch02-value-health-grid", 0.6, 1.5, 6.6, 3.9);
  const a = panel(s, "Axes", 7.45, 1.5, 5.3, null, HEX.navy, HEX.navyTint, "TWO AXES (PROGRAM DESIGN)", null, [
    "Mission value: criticality, cost of the function if lost, number and kind of users",
    "Technical health: condition, skills, data sensitivity as difficulty, dependencies",
    "Each criterion 1 to 5; equal weights within an axis to start",
  ], 13);
  const b = panel(s, "Flags", 7.45, a + 0.2, 5.3, null, HEX.amber, HEX.amberTint, "CONFIDENCE FLAG ON EVERY SCORE", null, [
    "Measured, from system data; attested, by the owner; assumed, no data",
    "Mostly assumed: no final disposition until owner review",
  ], 13);
  callout(s, "Measured", Math.max(pic.bottom, b) + 0.2, 0.9, "FaChartLine", HEX.teal, "Score what's measured first: ",
    "AWS suggests no inbound connection for 90 days, or very low CPU and memory use, to find applications nobody uses.");
  sources(s, "Sources: Book 18, Ch 02 (the axes, weights and flags are program design); FIPS 199; AWS Prescriptive Guidance, About the migration strategies. Book 18, Ch 02.");
  notes(s,
`Each criterion is scored from 1 to 5, and the six combine into two axes. Mission value takes mission criticality, the cost of the function if it were lost, and the number and kind of users. Technical health takes technical condition, skills, data sensitivity read as migration difficulty, and dependencies. Weights are the agency's choice. The starting point is equal weights within each axis, adjusted after the pilot calibration.

The grid is where the two axes point. Low value and poor health: retire first, the cheapest modernization there is. High value and good health: retain with a review date, and rehost only if the platform is being exited. High value and poor health: replatform when the platform is the problem and the code is sound, refactor or rebuild when the code is the problem. And the note under the grid: dependencies decide the order, not the disposition.

Every score carries a confidence flag: measured from system data, attested by the owner, or assumed with no data. An application with mostly assumed scores can't get a final disposition; it goes to owner review first.

And keep it honest by scoring what's measured before what's believed. Utilization data, connection logs and support dates beat questionnaires; AWS's test for an unused application is no inbound connection for 90 days, or very low average CPU and memory.`,
  "Book 18, Chapter 02 — \"A scored rubric, not a study per application,\" \"Step 1: score two axes,\" \"Keeping it honest.\"");
}

// ================================================================== 7 Decision table
{
  const s = content(P1, "The decision table: seven rules, first match wins");
  tag(s, "How");
  const tb = table(s, "Rules", 1.5, [0.55, 6.0, 2.35, 3.25], ["#", "Condition", "Proposed disposition", "Why"], [
    ["1", "Mission value low (≤ 2), or a commercial or shared service already provides the function", "Retire", "Cheapest outcome; A-130 prefers existing alternatives"],
    ["2", "Technical health high (≥ 4) and no platform exit is forcing a move", "Retain, with a review date", "Don't spend on what works and is supported"],
    ["3", "Technical health high, but the hosting platform is being exited", "Rehost", "The application is sound; only its location changes"],
    ["4", "Code sound (condition and skills ≥ 3), but platform, runtime or database unsupported or costly", "Replatform", "Fix what is broken, keep what works"],
    ["5", "Mission value high, code hard to change or staff, and interceptable behind an interface", "Refactor", "Incremental replacement keeps the mission running"],
    ["6", "Mission value high, and the code can't be salvaged or requirements outgrew it", "Rebuild, in increments", "Only after rules 1–5 are ruled out"],
    ["7", "Any high-impact system proposed for refactor or rebuild, or any contested result", "Deep study first", "Spend analysis where the stakes are"],
  ], { fontSize: 12, limit: 5.7 });
  callout(s, "Scale", tb + 0.15, 0.85, "FaFilter", HEX.amber, "Rule 7 is what makes it scale: ",
    "most applications get a disposition from rules 1 to 4 for the cost of scoring; deep study goes to the dozens that need it.");
  sources(s, "Sources: Book 18, Ch 02 (the rubric, thresholds and rules are program design); OMB Circular A-130 §5.a(3)(c)–(d). Book 18, Ch 02.");
  notes(s,
`The decision table turns scores into a proposed disposition. The rules run in order and the first match wins, which is what keeps the cheapest disposition winning.

Rule 1: mission value 2 or below, or a commercial or shared service already provides the function: retire. Rule 2: technical health 4 or above and no platform exit forcing a move: retain, with a review date. Rule 3: healthy, but the hosting platform is being exited: rehost. Rule 4: the code is sound, condition and skills both 3 or above, but the platform, runtime or database is unsupported or costly: replatform.

Rule 5: mission value high, the code hard to change or staff, and the application can be intercepted behind an interface: refactor, because incremental replacement keeps the mission running. Rule 6: high value and the code can't be salvaged, or requirements have outgrown it: rebuild, still in increments, and only after rules 1 to 5 are ruled out.

Rule 7 is the override. Any high-impact system whose proposed disposition is refactor or rebuild, or any application whose owner contests the result, gets a deep study before the decision. That's how a rubric covers thousands of applications without becoming careless. Most get a disposition from rules 1 to 4 at the cost of a scoring exercise, and the expensive analysis goes to the dozens that need it.

One more discipline: don't let the rubric pick the technology. The disposition says how much an application changes; the target architecture says what it changes into.`,
  "Book 18, Chapter 02 — \"Step 2: apply the decision table,\" \"Keeping it honest.\"");
}

// ================================================================== 8 Owner review and record
{
  const s = content(P1, "Owner review, the decision record and calibration");
  tag(s, "Who");
  img(s, "ch02-triage-funnel", 0.6, 1.5, 6.6, 4.95);
  const a = panel(s, "Record", 7.45, 1.5, 5.3, null, HEX.teal, HEX.tealTint, "THE DECISION RECORD (PROGRAM DESIGN)", null, [
    "The disposition, the six scores and their confidence flags",
    "The rule that produced it, the owner's agreement and a review date",
    "A contested score is corrected with evidence, not argued around",
    "Read by the EA transition plan, capital planning and auditors",
  ], 13);
  panel(s, "Calibrate", 7.45, a + 0.2, 5.3, null, HEX.amber, HEX.amberTint, "CALIBRATE BEFORE THE PORTFOLIO", null, [
    "Run the rubric on 30 to 50 applications architects know well",
    "Where they disagree, change weights or thresholds, not their judgment",
    "Recalibrate after the first wave, with real costs",
  ], 13);
  sources(s, "Sources: Book 18, Ch 02 (owner review, the record and calibration are program design); OMB A-130 §5.a(2); 40 U.S.C. §11312. Book 18, Ch 02, 07.");
  notes(s,
`The funnel is the whole triage at scale. Most applications go straight to a recorded decision; only rule 7's contested, high-cost or high-impact cases detour through deep study. And the record feeds capital planning and the waves.

Owner review works like this. The proposed disposition goes to the application's mission owner and system owner for a fixed window. They can agree, or contest with evidence, and a contested score is corrected, not argued around.

The decision record holds the disposition, the six scores and their confidence flags, the rule that produced the disposition, the owner's agreement and a review date. It's the artifact the enterprise architecture's transition plan, the capital planning process and an auditor will all ask for, and Chapter 07 places it under the architecture review board as Gate 1.

Calibration comes first. Before the rubric touches the portfolio, run it on a pilot set of thirty to fifty applications experienced architects already know well, and compare answers. Where they disagree, the weights or thresholds change, not the architects' judgment of those applications. Repeat it after the first wave, when there are real costs for each disposition.

Leadership's job here is narrow and important: approve the rubric, not each decision. Agree the criteria, weights and rules once, then rule on the contested cases rule 7 sends up. And remember that retain isn't a failure; a portfolio where nothing is retained usually hasn't been triaged.`,
  "Book 18, Chapter 02 — \"Step 3: owner review and the record,\" \"Calibrating the rubric,\" \"What leadership should take from this\"; Chapter 01 — \"A decision is evidence.\"");
}
endModule("Module 1");

// ================================================================== 9 Module 2 divider
{
  const s = divider(P1, "Module 2: The target architecture and the data", "Part 1 — Deciding and designing  ·  Chapters 03–04",
    ["The layers, the versions and the upgrade cadence", "Contracts, containers, configuration and the strangler fig", "Converting, proving, cutting over and coexisting"], 16);
  notes(s,
`Module 2: the target architecture and the data. If every refactor and rebuild picks its own stack, the agency ends the decade with as many stacks as it started with, only newer. The point of one reference architecture is to make the common choices once, so the platform team, the security team and the authorizing official review one pattern instead of hundreds.

So: the layers and the choices, with versions and support windows as of October 28, 2026; contracts first, thin layers and configuration from outside; the strangler fig and the NIST security references; and then the hardest part of most refactors, the data: choosing the engine, converting the schema, proving nothing was lost, and cutting over without dual writes.`,
  "Book 18, Chapter 03 — The Target Reference Architecture; Chapter 04 — Moving the Data: DB2 and Oracle to PostgreSQL or SQL Server.");
}

// ================================================================== 10 Layers
{
  const s = content(P1, "One target: the layers and the program's choices");
  tag(s, "What");
  const pic = img(s, "ch03-reference-architecture", 0.6, 1.5, 6.0, 3.95);
  const tb = table(s, "Layers", 1.5, [1.55, 1.85, 2.6], ["Layer", "Program's choice", "As of October 2026"], [
    ["Services", "Java LTS and Spring Boot", "Java 25 LTS; Spring Boot 4.1.2"],
    ["Front ends", "React", "React 19.3 (Sept. 9, 2026)"],
    ["BFF, tooling, glue", "Node.js, LTS only", "Node.js 26 LTS scheduled Oct. 28, 2026"],
    ["API contracts", "OpenAPI, written first", "OpenAPI 3.2.1 (Sept. 10, 2026)"],
    ["Packaging", "OCI container images", "Image and distribution specs 1.1.1"],
    ["Orchestration", "Kubernetes or a managed service", "1.37; three minor releases maintained"],
    ["Data", "PostgreSQL or SQL Server", "Chapter 04"],
  ], { x: 6.75, fontSize: 12, limit: 5.6 });
  callout(s, "Design", Math.max(tb, pic.bottom) + 0.15, 0.85, "FaCubes", HEX.navy, "Program design, not a federal rule: ",
    "no federal policy names a language or framework; an agency standardized on .NET can keep this structure and swap the list.");
  sources(s, "Sources: OpenJDK JDK project; Spring Boot system requirements; react.dev versions; Node.js releases; OpenAPI 3.2.1; OCI; kubernetes.io releases (Oct. 28, 2026). Book 18, Ch 03.");
  notes(s,
`The figure is the target, top to bottom. React front ends are served as static assets and call APIs only. A backend-for-frontend in Node.js, one per front end where needed, and an API gateway that handles authentication, rate limits and routing and doubles as the strangler-fig façade. Domain services in Java 25 and Spring Boot 4.1, each publishing an OpenAPI 3.2 contract, beside the legacy application still serving the functions not yet moved. Data, where each service owns its schema, on PostgreSQL or SQL Server. And the platform: OCI images on Kubernetes, configuration from the environment, secrets from a vault or replaced by a workload identity.

The table is the program's choices and where they stood on October 28. Java 25 is the current long-term support release, generally available September 16, 2025; Java 27, out September 15, 2026, is a feature release not on vendors' LTS lists. Spring Boot 4.1.2 is current; it needs Java 17 or later and supports up to Java 27. Kubernetes 1.37 is the newest minor, and the project maintains the three most recent.

Why these? Large labor pools, long support windows and mature security, transaction and observability libraries, because the business rules of a refactored COBOL or PL/SQL application will need maintaining for decades. And they're the program's design: no federal policy names a language or framework. What A-130 requires is a target and a transition plan.`,
  "Book 18, Chapter 03 — The Target Reference Architecture, \"The layers and the choices,\" \"Services: Java and Spring Boot,\" \"Honest limits.\"");
}

// ================================================================== 11 Support windows
{
  const s = content(P1, "Support windows: build the upgrade cadence in");
  tag(s, "How");
  subhead(s, "Boot head", "SPRING BOOT GENERATIONS (SPRING PROJECT DATA, OCT. 28, 2026)", 0.6, 1.5, 7.3);
  const tb = table(s, "Boot", 1.85, [1.55, 2.25, 1.75, 1.75], ["Generation", "First release", "Open source ends", "Commercial ends"], [
    ["4.2.x", "Scheduled Nov. 2026 (release candidate out)", "Dec. 31, 2027", "Dec. 31, 2028"],
    ["4.1.x (current)", "June 2026", "July 31, 2027", "July 31, 2028"],
    ["4.0.x", "November 2025", "Dec. 31, 2026", "Dec. 31, 2027"],
    ["3.5.x", "May 2025", "Ended June 30, 2026", "June 30, 2032"],
  ], { fontSize: 13, limit: 4.6 });
  const pb = panel(s, "Clocks", 8.15, 1.5, 4.6, null, HEX.navy, HEX.navyTint, "JAVA, NODE.JS, KUBERNETES", null, [
    "Java 25 is the current LTS; 26 and 27 are feature releases",
    "Design: build on the LTS; move to the next within a year",
    "Node.js 24 in maintenance Oct. 20, 2026; Node.js 22 ends Apr. 30, 2027",
    "From Node.js 27: one major a year, each going LTS",
    "Kubernetes: a minor about three times a year",
  ], 13);
  callout(s, "Cadence", Math.max(tb, pb) + 0.25, 0.9, "FaArrowsRotate", HEX.amber, "About thirteen months of open-source support per generation: ",
    "a 3.5 service already depends on commercial support, so fund platform upgrades as recurring work.");
  sources(s, "Sources: Spring project generations; Spring Boot system requirements; OpenJDK; Microsoft OpenJDK roadmap; Node.js releases and schedule; Kubernetes release cycle. Book 18, Ch 03.");
  notes(s,
`Versions are a snapshot, and the support windows matter more day to day than the versions.

Java first. Java 25 is the current long-term support release; the Microsoft Build of OpenJDK, for example, commits to supporting it until at least September 2030. Java 26 and 27 are feature releases. The program's design is to build on the current LTS and move to the next within a year of its release, not to chase feature releases.

Spring Boot's windows are shorter, and the table is Spring's own generations data. 4.2 is scheduled for November 2026 with a release candidate out. 4.1, current, loses open-source support July 31, 2027. 4.0 loses it at the end of 2026. And 3.5's open-source support already ended on June 30, 2026, though commercial support runs to 2032. So an application started on 3.5 already depends on commercial support for patches. Each recent generation has had about thirteen months of open-source support, which means a portfolio of Spring services needs an upgrade cadence built into the platform, not left to each project.

Node.js: through version 26, even-numbered releases became LTS and odd ones expired after six months. From 27, one major a year, every one going LTS after six months as Current. Production should run only Active or Maintenance LTS. Node.js 24 entered maintenance on October 20, and 22 reaches end of life April 30, 2027. The leadership point: fund the upgrade cadence, or the modernized portfolio becomes the next legacy one.`,
  "Book 18, Chapter 03 — \"Services: Java and Spring Boot,\" \"Node.js where it fits,\" \"Honest limits,\" \"What leadership should take from this.\"");
}

// ================================================================== 12 Contracts and configuration
{
  const s = content(P1, "Contracts first, thin layers, configuration from outside");
  tag(s, "How");
  const W = 3.95;
  const a = panel(s, "API", 0.6, 1.5, W, null, HEX.navy, HEX.navyTint, "API-FIRST WITH OPENAPI (DESIGN)", null, [
    "Write the contract first; review it with consumers; generate stubs and clients",
    "The contract is what the strangler-fig façade routes on",
    "Additive changes within a major version; breaking ones as a new major, side by side",
    "Test against the contract in the pipeline; publish it in a catalog",
  ], 13);
  const b = panel(s, "Node", 0.6 + W + 0.15, 1.5, W, null, HEX.teal, HEX.tealTint, "NODE.JS ONLY WHERE IT FITS", null, [
    "Backend-for-frontend: one per front end, owned by its team",
    "Front-end build and tooling; thin event glue",
    "A BFF holding business rules is a second services layer: refactor it",
    "Front ends render, validate for usability and call APIs",
  ], 13);
  const c = panel(s, "Config", 0.6 + 2 * (W + 0.15), 1.5, W, null, HEX.amber, HEX.amberTint, "CONTAINERS AND CONFIGURATION", null, [
    "OCI images on Kubernetes, or a managed service built on it",
    "Twelve-factor: whatever varies by deployment comes from the environment",
    "Design: the environment gives a reference; the secret comes from a vault or a workload identity",
    "Rehosted and replatformed apps can land on the same platform",
  ], 13);
  callout(s, "Litmus", Math.max(a, b, c) + 0.25, 0.9, "FaLock", HEX.amber, "Twelve-factor's litmus test: ",
    "could the code base be made open source at any moment without compromising any credentials?");
  sources(s, "Sources: OpenAPI 3.2.1 §2.1; Azure Architecture Center, Backends for Frontends pattern; The Twelve-Factor App, III. Config; OCI; Kubernetes releases; Book 17, Ch 06. Book 18, Ch 03.");
  notes(s,
`Three disciplines hold the architecture together.

API-first. Every service publishes its contract before its code, as an OpenAPI document. The program's design: write the contract first, review it with the consuming teams, and generate server stubs and client libraries from it. Treat the contract as the interface the strangler-fig façade routes on, so a legacy function and its replacement can sit behind the same contract while traffic moves. Version deliberately: additive changes within a major version, a new major run side by side for breaking ones. Test against the contract in the pipeline, which Chapter 07 makes a gate. And publish contracts in a catalog, so the next project reuses an API instead of building a duplicate.

Node.js for three jobs only. A backend-for-frontend, which the Azure Architecture Center describes as a separate backend per interface, managed by the front-end team, with cross-cutting concerns such as authorization and monitoring kept out of it. Front-end build tooling, since React builds run on Node regardless. And small event glue. A backend-for-frontend that starts holding business rules is a second services layer. Front ends stay thin as well; business rules belong in services, tested and authorized once.

Containers and configuration. Configuration follows twelve-factor, and its litmus test is the callout. The program tightens it: the environment supplies a reference, and the secret comes from a store, or better, a workload identity removes it, in Book 17's credential order.`,
  "Book 18, Chapter 03 — \"Front ends: React,\" \"Node.js where it fits,\" \"API-first with OpenAPI,\" \"Containers, orchestration and configuration.\"");
}

// ================================================================== 13 Strangler fig
{
  const s = content(P1, "The strangler fig, and the NIST security references");
  tag(s, "How");
  const pic = img(s, "ch03-strangler-fig", 0.6, 1.45, 12.15, 2.3);
  const W = 5.99;
  const y = pic.bottom + 0.2;
  panel(s, "Feasible", 0.6, y, W, null, HEX.amber, HEX.amberTint, "FEASIBILITY QUESTIONS FOR RULE 7'S DEEP STUDY", null, [
    "Requests must be interceptable, at a façade or another integration point",
    "Shared data: extract a domain, sync by CDC, validate, then switch the system of record",
    "Anti-corruption layer for cross-calls; the façade can't become the bottleneck",
    "Rollback ends when the legacy tables and procedures are removed",
  ], 12.5);
  panel(s, "NIST", 0.6 + W + 0.17, y, W, null, HEX.navy, HEX.navyTint, "NIST REFERENCES: GUIDANCE, NOT REQUIREMENTS", null, [
    "SP 800-204 (2019): microservices; the gateway, service authentication",
    "800-204A to D: service mesh, ABAC, DevSecOps, supply chain in CI/CD",
    "SP 800-190 (2017): images, registries, orchestrators, containers, hosts",
    "No newer revision or draft of either as of October 2026",
  ], 12.5);
  sources(s, "Sources: Fowler, \"Strangler Fig\" (2024); Azure Architecture Center, Strangler Fig pattern; NIST SP 800-204, 800-204A–D, SP 800-190 and their CSRC pages. Book 18, Ch 03.");
  notes(s,
`The strangler fig is how a refactor actually happens. Martin Fowler describes building new functionality alongside the legacy system and moving behavior over piece by piece until the old system can be retired. The figure is the Azure Architecture Center's mechanics in four stages. Introduce a façade that sends most requests to the legacy application. Move functions one at a time to new services behind the same contract, with an anti-corruption layer translating between old and new. Decommission the legacy application once nothing depends on it, removing its data only after validation. Then remove the façade, or keep it as an adapter. Rollback stays possible until the legacy objects are removed.

The left panel is the feasibility test, and it belongs in the deep study rule 7 calls for. Requests have to be interceptable: if the back end can't sit behind a façade and you can't change its code or another integration point such as its database, the pattern doesn't fit. Shared data needs a plan; the Azure example extracts one domain at a time, copies it with extract-transform-load, keeps it in sync with change data capture, validates, and only then makes the new database the system of record. Rollback has an end. And small systems may not need the pattern at all. For a mainframe, the façade is often an API layer in front of transactions that already exist.

The right panel is the federal security reference set. SP 800-204 covers microservices; SP 800-190 covers containers. Both are guidance for selecting SP 800-53 controls, not requirements.`,
  "Book 18, Chapter 03 — \"Replacing incrementally: the strangler fig,\" \"The federal security references.\"");
}

// ================================================================== 14 Data path and engine
{
  const s = content(P1, "Moving the data: convert, move, prove, then cut over");
  tag(s, "What");
  img(s, "ch04-convert-move-prove", 0.6, 1.5, 5.75, 4.95);
  const tb = table(s, "Engine", 1.5, [1.55, 2.5, 2.2], ["Factor", "PostgreSQL", "SQL Server"], [
    ["Current, Oct. 2026", "18 (Sept. 25, 2025), supported to Nov. 14, 2030; 19 at release candidate 1", "SQL Server 2025, 2022 and 2019 as migration targets"],
    ["Support model", "Five years per major; 14 gets no fixes after Nov. 12, 2026", "Microsoft's product lifecycle"],
    ["Typical fit (design)", "Oracle PL/SQL that converts well; open-source standardization", "An established SQL Server estate; Microsoft tooling preferred"],
    ["Identity", "Engine and platform specific", "Book 06 applies in full"],
  ], { x: 6.5, fontSize: 12, limit: 5.2 });
  panel(s, "Tools", 6.5, tb + 0.2, 6.25, null, HEX.teal, HEX.tealTint, "THE ENGINE ALSO CHOOSES THE TOOLS", null, [
    "No single conversion tool covers every source and target pair",
    "On SQL Server, arrive on Book 06's Entra connection pattern, not a SQL login",
  ], 13);
  sources(s, "Sources: PostgreSQL versioning policy and home page; Microsoft Learn, SQL Server Migration Assistant; Book 06, Ch 12 and 19. Book 18, Ch 04.");
  notes(s,
`Code can be replaced a piece at a time; data moves once, and the move isn't finished until someone can prove nothing was lost. So the program treats the data move as three jobs, each with evidence: convert the schema, move the rows, prove the result.

The figure is that path. Convert the schema with a tool and then human review. Move the rows with a full load, then change data capture or delta loads while both systems run. Prove the result three independent ways. Then choose a cut-over, big-bang, phased or parallel run, and the target becomes the system of record. Any mismatch loops back: fix and rerun.

Choosing the engine is usually settled by what the agency already runs and what the code assumes, not by features. PostgreSQL 18 shipped September 25, 2025 and is supported to November 2030. A migration targeting PostgreSQL 14 now lands on a version leaving support within weeks. SQL Server 2025, 2022 and 2019 are the targets of Microsoft's migration assistant.

Two practical points. The engine also chooses the conversion tooling, because no single tool covers every pair. And when the target is SQL Server, Book 06 applies in full: arrive already on its Microsoft Entra connection pattern rather than carrying a SQL login across and migrating it later.`,
  "Book 18, Chapter 04 — Moving the Data, opening section, \"Choosing the target engine,\" \"When the target is SQL Server.\"");
}

// ================================================================== 15 Schema conversion
{
  const s = content(P1, "Schema conversion: the dangerous conversions succeed");
  tag(s, "What");
  const tb = table(s, "Types", 1.5, [3.25, 4.25], ["Source behavior", "Why it matters on the target"], [
    ["Oracle DATE holds a time of day, with no fractional seconds or time zone", "PostgreSQL date drops the time; the faithful map is timestamp(0) without time zone"],
    ["Oracle NUMBER(p,s): precision 1 to 38, scale −84 to 127", "Floating point loses exactness; money and counts need an exact numeric type"],
    ["Oracle treats a zero-length string as null", "PostgreSQL and SQL Server don't, so IS NULL can return different rows"],
    ["Collation decides sort order", "A non-\"C\" PostgreSQL key collation sorts differently, and AWS DMS row validation fails"],
    ["Sequences generate key values", "Neither engine is gapless; advance each sequence past the highest key before the first insert"],
  ], { fontSize: 12.5, limit: 6.5 });
  panel(s, "Packages", 8.35, 1.5, 4.4, null, HEX.amber, HEX.amberTint, "PROCEDURES AND PACKAGES", null, [
    "PostgreSQL has no package object; tools emulate it",
    "AWS: members become package$member functions; state in aws_oracle_ext",
    "SSMA adds a schema of emulation functions",
    "Design: every emulation call is technical debt, paid down in the refactor",
    "A gapless legal number needs its own counter",
  ], 13);
  sources(s, "Sources: Oracle SQL Reference 23ai; PostgreSQL 18 docs; Microsoft Learn, Sequence numbers; AWS DMS validation; AWS SCT extension packs; SSMA for Db2. Book 18, Ch 04.");
  notes(s,
`Schema conversion is the part a tool does well and a person must still check. What a tool can't know is which behavior differences the application depends on. The dangerous conversions are the ones that succeed.

The table shows Oracle examples. Oracle DATE carries a time of day and PostgreSQL's date type doesn't, so mapping one to the other silently drops the time; the faithful mapping is a timestamp type such as timestamp zero without time zone. NUMBER allows precision 1 to 38 and scale from minus 84 to 127; mapping it to floating point loses exactness, so money and counts belong in an exact numeric type. Oracle treats a zero-length string as null; the targets distinguish them, so IS NULL queries can return different rows unless data or code is normalized. Collation changes sort order: AWS documents that a non-C primary key collation on PostgreSQL makes its row-by-row validation fail. And neither engine guarantees gapless sequences.

The sequence row has a cut-over consequence: advance every target sequence past the highest migrated key before the first new insert, or the new system issues keys that exist.

PL/SQL and DB2 SQL PL convert with varying success, and packages are the hardest, because PostgreSQL has none. AWS's conversion turns members into schema-qualified functions named package dollar member, with package variables held in an extension-pack schema; Microsoft's assistant adds its own emulation schema. The program records every emulation call as debt and pays it down in the refactor.`,
  "Book 18, Chapter 04 — \"Converting the schema,\" \"Type mapping: where meaning changes silently,\" \"Stored procedures and packages.\"");
}

// ================================================================== 16 Tools
{
  const s = content(P1, "The conversion tools as of October 2026");
  tag(s, "What");
  const tb = table(s, "Tools", 1.5, [2.55, 3.45, 2.75, 3.4], ["Tool", "Sources", "Targets", "Notes as of October 2026"], [
    ["AWS Schema Conversion Tool (desktop)", "Oracle 10.1+; Db2 LUW 9.1 to 11.5; Db2 for z/OS 12; SQL Server; others", "PostgreSQL and Aurora PostgreSQL, MySQL and others", "AWS states it is FedRAMP compliant; no end-of-support notice"],
    ["AWS DMS Schema Conversion (managed)", "Oracle; Db2 LUW; Db2 for z/OS (API and CLI only); SQL Server; SAP ASE", "Aurora or RDS for PostgreSQL (some MySQL, Redshift)", "Generative AI conversion on PostgreSQL paths; no GovCloud (US) Region listed"],
    ["SSMA for Db2", "Db2 z/OS 9.0+, Db2 LUW 9.8+, Db2 for i 7.1+", "SQL Server 2019 to 2025; Azure SQL Database and Managed Instance", "Current release v10.6"],
    ["SSMA for Oracle", "Oracle", "Same targets", "v10.6; Copilot GA since v10.4; generated code must be reviewed"],
    ["Ora2Pg (open source, GPL v3)", "Oracle; MySQL and MariaDB; SQL Server", "PostgreSQL", "25.0 (Apr. 20, 2025); cost assessment; no DB2 source"],
  ], { fontSize: 12, limit: 5.55 });
  callout(s, "Plan", tb + 0.2, 0.9, "FaTableList", HEX.navy, "Three planning facts: ",
    "only AWS's tools convert DB2 to PostgreSQL; SSMA targets only SQL Server and Azure SQL; AI conversion puts the model endpoint in the boundary.");
  sources(s, "Sources: AWS SCT user guide; AWS DMS Schema Conversion; Microsoft Learn: SSMA, SSMA for Db2 and for Oracle, Copilot in SSMA; Ora2Pg features and releases. Book 18, Ch 04.");
  notes(s,
`The tools as they stood in October 2026, named as examples of each category, not endorsements.

AWS's desktop Schema Conversion Tool covers Oracle, both Db2 platforms and SQL Server, among others. AWS states it's FedRAMP compliant. AWS DMS Schema Conversion is the managed version, with Db2 for z/OS through the API and command line only. It offers generative AI conversion on the PostgreSQL paths from Oracle and both Db2 platforms, and its published Region table lists no AWS GovCloud Region.

Microsoft's SQL Server Migration Assistant comes in Db2 and Oracle editions, both at version 10.6. The Oracle edition's AI-assisted conversion, Copilot, has been generally available since 10.4, using the agency's own Azure OpenAI resource or a Microsoft-managed endpoint with Entra ID sign-in, and Microsoft says generated code must be reviewed, validated and tested. Ora2Pg, open source under GPL version 3, is at 25.0 from April 2025 and has no DB2 source.

Three things shape the plan, and the callout has them. Note especially that AI-assisted options send source code to a model, which puts the endpoint, its region and its authorization inside the migration's boundary. The program treats AI-converted code as a draft a person reviews and validation tests.`,
  "Book 18, Chapter 04 — \"The conversion tools, October 2026,\" \"Honest limits,\" \"What leadership should take from this.\"");
}

// ================================================================== 17 Three checks
{
  const s = content(P1, "Proving nothing was lost: three checks, three blind spots");
  tag(s, "How");
  const tb = table(s, "Checks", 1.5, [3.15, 4.6, 4.4], ["Check", "What it catches", "What it can miss"], [
    ["Row counts per table", "Missing or duplicated rows; tables skipped entirely", "Rows that arrived with wrong values"],
    ["Order-independent checksum over canonicalized rows", "Any value that differs after canonical formatting, whatever the sort order or collation", "Errors in the transform itself, if computed after it"],
    ["Independent aggregate reconciliation", "Business-level differences: totals of amounts, counts per status code, each side in its own SQL", "Offsetting errors that cancel out in an aggregate"],
  ], { fontSize: 13, limit: 4.0 });
  const W = 5.99;
  panel(s, "Date", 0.6, tb + 0.2, W, null, HEX.red, HEX.redTint, "WHY THE THIRD CHECK EXISTS", null, [
    "Map Oracle DATE to a date-only type and a post-transform checksum agrees perfectly, and both are wrong",
    "An aggregate written against each database never passes through the transform",
    "Pick totals the business owner recognizes",
  ], 13);
  panel(s, "DMS", 0.6 + W + 0.17, tb + 0.2, W, null, HEX.navy, HEX.navyTint, "A TOOL'S ROW COMPARISON (AWS DMS)", null, [
    "Strong evidence for the second check; it isn't the third",
    "Needs a primary key or unique index; skips views and Oracle LONG",
    "Outside writes make it unreliable; it stops past 10,000 failed records",
  ], 13);
  sources(s, "Sources: AWS DMS user guide, Data validation (validation-only tasks, limitations); Book 18, Ch 08 (reference implementation). The three-check design is program design. Book 18, Ch 04.");
  notes(s,
`A migration is complete when the agency can show the target holds the same facts as the source. No single check shows that, because each check shares an assumption with the process it checks. So the program uses three, chosen so their blind spots don't overlap.

Row counts catch missing or duplicated rows. An order-independent checksum over canonicalized rows catches any changed value, but shares the transform's assumptions when it's computed after it. An independent aggregate reconciliation, totals and counts per status computed in each database's own SQL, catches business-level differences, but misses errors that cancel.

The red panel is why the third exists. If the transform maps Oracle DATE to a date-only type, a checksum over the transformed rows agrees with the target perfectly, and both are wrong. An aggregate written directly against each database doesn't pass through the transform, so it catches what the checksum can't. Choose aggregates the business owner recognizes: a program office that knows its monthly totals can judge a reconciliation in a way it can't judge a hash.

Tools do part of the work. AWS DMS compares each source row with its target after the full load, validates changes during change data capture, writes mismatches to a control table, and offers validation-only tasks for the cut-over window. Its limits are a good checklist: a primary key or unique index on each table, no views or LONG columns, rows changing during validation can't be validated, outside writes spoil results, and it stops past 10,000 failures. It's strong evidence for the second check, not the third. Every run produces a report that the gates examine and the change record retains.`,
  "Book 18, Chapter 04 — \"Proving that nothing was lost.\"");
}

// ================================================================== 18 Cut-over
{
  const s = content(P1, "Cut-over and coexistence: one writer per table");
  tag(s, "How");
  const pic = img(s, "ch04-cutover-options", 0.6, 1.5, 7.0, 2.45);
  panel(s, "CDC", 0.6, pic.bottom + 0.2, 7.0, null, HEX.amber, HEX.amberTint, "CHANGE DATA CAPTURE: CAUTIONS", null, [
    "Reads committed changes from the log: it can lag, but never applies a rejected change",
    "AWS DMS: not real-time replication; no latency SLA",
    "Db2 for z/OS: full load only, no CDC; use another product or keyed delta loads",
  ], 12.5);
  panel(s, "Rules", 7.85, 1.5, 4.9, null, HEX.teal, HEX.tealTint, "COEXISTENCE RULES (PROGRAM DESIGN)", null, [
    "One system of record per table; authority moves at each phase's gate",
    "No application dual writes: write once, publish by transactional outbox or CDC",
    "Fallback by reverse replication, still one writer",
    "Run the three checks on a schedule during coexistence",
    "Parallel run: the source governs until the gate is passed",
    "Bidirectional replication isn't multi-master: no conflict resolution",
  ], 13);
  sources(s, "Sources: AWS DMS user guide (ongoing replication; Db2 for z/OS limits); Azure Architecture Center: Scheduler Agent Supervisor (dual writes), Transactional Outbox. Book 18, Ch 04.");
  notes(s,
`Three cut-over strategies cover most applications, and the choice belongs to the application owner and the authorizing official.

Big-bang freezes writes, runs a final load, validates and switches everyone; rollback means reverting to the frozen source. Phased moves one domain or table set at a time, the data counterpart of the strangler fig. Parallel run keeps both live and reconciles outputs until they agree for an agreed period; it fits eligibility or payment calculations, and the program names the source as the system of record until the gate, so a disagreement always resolves one way. All three end at one gate: three validation results for the final state, and a rehearsed rollback plan.

Phased and parallel need coexistence for weeks or months. Change data capture reads committed changes from the source log, so the target can lag but never receive a change the source rejected. AWS says its CDC doesn't provide real-time replication, with no latency SLA. And for Db2 for z/OS as a source, AWS DMS supports full load only, so a mainframe DB2 system that must coexist needs a separate change-capture product or periodic delta loads keyed on a reliable change timestamp; the reference implementation's since mode is the second approach.

Dual writes fail in a specific way: the two writes don't share a transaction, so under retries and partial failures the stores drift invisibly. Hence the rules on the right: one writer per table, with authority moving table by table; write once and publish through a transactional outbox or CDC; reverse replication for fallback; and continuous validation.`,
  "Book 18, Chapter 04 — \"Cutting over,\" \"Coexistence without dual writes.\"");
}
endModule("Module 2");

// ================================================================== 19 Module 3 divider
{
  const s = divider(P2, "Module 3: AI, compliance and governance", "Part 2 — Governing and running  ·  Chapters 05–07",
    ["Where AI fits, the model interface and the agent's guardrails", "Controls across the life cycle, the SSDF, privacy and records", "The review board's decision rights, the four gates and their evidence"], 12);
  notes(s,
`Module 3: AI, compliance and governance. Part 1 decided what each application becomes and what it lands on. Part 2 is about keeping that true across a few hundred delivery teams under schedule pressure, each of whom can make a defensible local choice that adds up to a second legacy estate.

So: where generative and agentic AI fit, behind one provider-neutral interface, and the guardrails an agent needs; the controls a modernized application touches, where they land in the life cycle and the evidence each one leaves; secure development after M-26-05, privacy, data and records as design inputs; and the review board's decision rights and the four gates every change passes.`,
  "Book 18, Chapter 05 — Generative and Agentic AI in the Architecture; Chapter 06 — Compliance by Design; Chapter 07 — Who Governs the Architecture.");
}

// ================================================================== 20 Where AI fits
{
  const s = content(P2, "Where AI fits, behind one provider-neutral interface");
  tag(s, "What");
  img(s, "ch05-where-ai-fits", 0.6, 1.5, 5.3, 4.95);
  const tb = table(s, "Patterns", 1.5, [2.0, 1.9, 2.75], ["Pattern", "What it can change", "Risk to design for"], [
    ["Assistive feature", "Nothing directly; a person accepts or edits", "Confabulation; over-reliance"],
    ["Retrieval-augmented generation", "Nothing directly", "Disclosure beyond the caller's rights; poisoned or stale sources"],
    ["Code modernization assistance", "The repository, through review", "Plausible, subtly wrong code; unattended runs"],
    ["Agent that calls tools", "Whatever its tools can reach", "Excessive agency; prompt injection; runaway loops"],
  ], { x: 6.1, fontSize: 12, limit: 4.4 });
  panel(s, "Interface", 6.1, tb + 0.2, 6.65, null, HEX.navy, HEX.navyTint, "THE INTERFACE MUST GIVE FOUR THINGS (DESIGN)", null, [
    "One call shape; provider, model and endpoint are configuration",
    "A record of which provider, model and version answered, for whom",
    "A deterministic stub, so guardrails are tested repeatably",
    "Timeouts, rate limits and quotas in one place",
  ], 12.5);
  sources(s, "Sources: NIST AI 600-1 §2; OWASP Top 10 for LLM Applications 2025; Lewis et al. (2020); Microsoft Learn, GitHub Copilot modernization; AWS Transform; Spring AI 2.0.2. Book 18, Ch 05.");
  notes(s,
`A model is a component behind an interface, called by a service that owns the business rules, with its output treated as input to be checked, not as a decision. An AI feature is part of the application's system and boundary, and M-25-22 requires an ATO before deployment.

The figure orders four patterns by how much each can change. An assistive feature drafts, summarizes or classifies in a screen and changes nothing directly; design for confabulation, NIST's word for confidently stated false content, and over-reliance. Retrieval-augmented generation answers from agency content retrieved at query time; the program's rule is that retrieval runs with the caller's permissions, never a broader service account, so the model can't be handed a document the user couldn't open. Code modernization assistance changes the repository: GitHub Copilot modernization upgrades Java projects to 11, 17, 21 or 25 and Spring Boot up to 4.0 with build validation at each step, and AWS Transform for mainframe analyzes COBOL and PL/I applications and refactors COBOL into Java. Their output is a draft in a branch that passes the gates; the program doesn't use the CLI's allow-all unattended mode on a production repository. And an agent that calls tools can change whatever its tools reach.

They all call models through one interface, and the design asks four things of it: one call shape with provider, model and endpoint as configuration; a record of what answered, for whom; a deterministic stub for tests; and limits in one place, which is OWASP's mitigation for unbounded consumption.`,
  "Book 18, Chapter 05 — Generative and Agentic AI in the Architecture, opening section, \"Where AI fits,\" \"One provider-neutral model interface.\"");
}

// ================================================================== 21 Guardrails
{
  const s = content(P2, "Agent guardrails: read, propose, never write");
  tag(s, "How");
  img(s, "ch05-agent-guardrails", 0.6, 1.5, 6.0, 4.95);
  const a = panel(s, "Guards", 6.85, 1.5, 5.9, null, HEX.navy, HEX.navyTint, "THE GUARDRAILS (PROGRAM DESIGN, FROM OWASP)", null, [
    "An identity and a human sponsor for every agent (Book 17)",
    "A tool allow-list enforced outside the model; every denial audited",
    "Least privilege enforced by the systems the tools call",
    "Human approval for any action that changes a record",
    "A hard step limit against runaway loops and cost",
    "Model output untrusted; external content kept separate and marked",
    "An audit record of every call, denial and approval",
  ], 12.5);
  panel(s, "MCP", 6.85, a + 0.2, 5.9, null, HEX.red, HEX.redTint, "MCP IS HOW AN AGENT REACHES A TOOL, NOT A GUARDRAIL", null, [
    "Spec 2026-07-28: it can't enforce its security principles at the protocol level",
    "An approved MCP server is one more allow-list entry, not a substitute",
  ], 12.5);
  sources(s, "Sources: OWASP LLM01, LLM05, LLM06, LLM10 (2025); OMB M-25-21 §4(b)(v); MCP specification 2026-07-28 and governance; Book 17, Ch 04–06. Book 18, Ch 05.");
  notes(s,
`An agent's risk comes from what it can do, not what it can say. OWASP's 2025 list calls it Excessive Agency. Prompt injection makes that dangerous, because an agent reading a document or an email can be steered by instructions hidden in it, and OWASP says it's unclear whether fool-proof prevention exists. So the design can't rely on the model refusing. It has to make sure a steered agent still can't do much harm.

The figure is the loop. The agent's identity carries its ID, its human sponsor and its allowed tools. The model proposes the next tool call. A step limit check stops and audits when the limit is reached. An allow-list check denies and audits anything off the list. Anything that changes a record goes to propose action, which records a pending proposal and changes nothing; a human approves, and the service applies the change under its own authorization and rules.

The approval guardrail changes application design most. The program gives an agent no tool that writes to a system of record. A proposal carries the agent's identity, reasoning and evidence; a person with authority reviews it in the application; and approval runs through the same business rules a human-entered change passes. The agent never holds write permission, so no injected instruction can give it one.

The MCP specification, version 2026-07-28, says hosts must get user consent before invoking tools and that it can't enforce its security principles itself. So the guardrails stay in the host and behind each tool. And watch approval fatigue: measure how often approvers reject or amend.`,
  "Book 18, Chapter 05 — \"The guardrails an agent needs,\" \"Tool protocols: the Model Context Protocol,\" \"Honest limits.\"");
}

// ================================================================== 22 Controls in the life cycle
{
  const s = content(P2, "Compliance by design: controls across the life cycle");
  tag(s, "What");
  const pic = img(s, "ch06-controls-in-the-lifecycle", 0.6, 1.5, 2.75, 4.1);
  const tb = table(s, "Families", 1.5, [0.85, 2.95, 5.35], ["Family", "Controls most touched", "Evidence the application should produce (program design)"], [
    ["SA", "SA-3, SA-8, SA-11, SA-15, SA-22", "Reference architecture and patterns; pipeline test and scan results; the triage record"],
    ["SR", "SR-3, SR-4, SR-11", "A software bill of materials per build; signed artifacts; base-image policy"],
    ["AC", "AC-2, AC-3, AC-6", "Service, workload and agent identities with owners; access reviews"],
    ["AU", "AU-2, AU-3, AU-12, SA-15(13)", "Structured logs in one schema, including agent calls, denials and approvals"],
    ["CM", "CM-2, CM-3, CM-4, CM-7, CM-8", "Infrastructure as code; pull requests as change records; generated inventory"],
    ["SC", "SC-7, SC-8, SC-12, SC-28", "Platform encryption in transit and at rest; network policy as code; managed keys"],
    ["SI", "SI-2, SI-7, SI-10", "Scan results and remediation times; validation of all input, model output included"],
    ["PT", "PT-2, PT-3, PT-5, PT-7", "Data-flow records naming authority and purpose; notices; the PIA"],
  ], { x: 3.6, fontSize: 11, limit: 5.75 });
  callout(s, "Legacy", Math.max(tb, pic.bottom) + 0.12, 0.8, "FaTriangleExclamation", HEX.red, "Legacy is a compliance finding: ",
    "A-130 gives systems that can't be protected high priority for upgrade, replacement or retirement (SA-22).");
  sources(s, "Sources: OMB Circular A-130 §5.a(1)(c), Appendix I; NIST SP 800-53 Rev. 5, release 5.2.0 (Aug. 27, 2025) catalog. Evidence mapping is program design. Book 18, Ch 06.");
  notes(s,
`Compliance usually arrives as a package assembled at the end. Modernization is the moment that can change, because the agency is choosing the architecture, platform and pipeline anyway. A control implemented once in the target is inherited by every application on it; a pipeline that records its results produces evidence on every merge. A-130 asks for exactly this: security, privacy, records and supply chain considered throughout the life cycle, and requirements integrated into the architecture and engineering processes.

The figure is where the controls land. At the top, unsupported components feed a modernization plan. Design carries SA-8 engineering principles, PT-2 and PT-3 authority and purpose with the privacy impact assessment, and decision records. Build carries SA-11, SA-15, the SSDF and an SBOM for SR-4 provenance. Deploy carries baseline and change control, the component inventory and encryption. Operate carries logging, flaw remediation and account review with agents included. Evidence from every stage flows to one authorization record.

SP 800-53 is at release 5.2.0, issued August 27, 2025. The table is the eight families application work touches most and the evidence the program wants from each.

The callout matters for triage. A-130 asks for a plan for systems that can't be protected, including vendor-unsupported components, with a high priority for upgrade, replacement or retirement, and SA-22 is the control. So retaining an application on unsupported software with no plan is an open finding. The program records compensating controls, risk acceptance and a review date. And a migration's validation report is SI-7 evidence; its cut-over is a CM-3 change with a CM-4 impact analysis.`,
  "Book 18, Chapter 06 — Compliance by Design, opening section, \"Legacy as a compliance finding,\" \"The controls application work touches most.\"");
}

// ================================================================== 23 SSDF, privacy, records
{
  const s = content(P2, "Secure development, privacy, data and records");
  tag(s, "How");
  const W = 3.95;
  const a = panel(s, "SSDF", 0.6, 1.5, W, null, HEX.navy, HEX.navyTint, "THE SSDF AFTER M-26-05", null, [
    "M-26-05 (Jan. 23, 2026) rescinded M-22-18 and M-23-16",
    "A complete software and hardware inventory is still required",
    "SP 800-218 v1.1 stays final; v1.2 a draft since Dec. 17, 2025",
    "PO.3.3, PS.3.2, PW.7, PW.8: a spec for the pipeline",
  ], 13);
  const b = panel(s, "Privacy", 0.6 + W + 0.15, 1.5, W, null, HEX.teal, HEX.tealTint, "EVENTS THAT REOPEN PRIVACY (DESIGN)", null, [
    "A new data store or a new engine",
    "A new flow: services, an API, a BFF, change data capture",
    "An AI feature: a new use PT-3's purpose must cover",
    "Test data: synthetic or masked outside production",
    "Retirement: a disposition of the PII it holds",
  ], 13);
  const c = panel(s, "Records", 0.6 + 2 * (W + 0.15), 1.5, W, null, HEX.amber, HEX.amberTint, "DATA AND RECORDS", null, [
    "M-25-05: the data inventory entry moves with the data asset",
    "Records duties run from design to decommissioning",
    "Design: the records officer reviews every retire, and any migration that drops history",
  ], 13);
  callout(s, "Producer", Math.max(a, b, c) + 0.25, 0.9, "FaFileShield", HEX.navy, "For code the agency builds, it is the producer: ",
    "the attestation question never applied the same way, and the pipeline generates its own SBOM for free.");
  sources(s, "Sources: OMB M-26-05; NIST SP 800-218 v1.1 and Rev. 1 draft; SP 800-218A; OMB Circular A-130 §5.f, §5.h, Appendix II; OMB M-25-05; Evidence Act. Book 18, Ch 06–07.");
  notes(s,
`Three design inputs that are usually treated as reviews at the end.

Secure development. OMB M-26-05, January 23, 2026, rescinded M-22-18 and its companion M-23-16. The expectation underneath stayed: agencies continue to keep a complete software and hardware inventory and set assurance policies that match risk, and a vendor SBOM is now a contract choice. For software the agency builds, which is most of what this book modernizes, the agency is the producer, and the SSDF is the practice set. SP 800-218 version 1.1 from February 2022 remains final; version 1.2 has been an initial public draft since December 17, 2025. Several practices read as a pipeline specification: PO.3.3, tools generate artifacts; PS.3.2, provenance such as an SBOM per release; PW.7 and PW.8, review and test, including AI-generated code.

Privacy. A-130 requires Privacy Act compliance, PIAs when developing or using IT, minimization and an inventory of PII systems, with privacy review from the earliest planning. The program names the modernization events that reopen privacy work, so the privacy office hears at design review: a new store or engine, a new flow, an AI feature, test data, and retirement.

Data and records. M-25-05 requires a comprehensive data inventory and makes chief data officers responsible; when a data asset moves or splits, its entry moves, and the program adds that to the cut-over checklist. A-130 builds records duties into design through decommissioning, so retirement and any migration that drops history or attachments are records decisions in disguise.`,
  "Book 18, Chapter 06 — \"Secure development after M-26-05,\" \"Privacy as a design input,\" \"Data governance: the Evidence Act and chief data officers,\" \"Records: from design to decommissioning\"; Chapter 07 — \"What SBOMs are for, after M-26-05.\"");
}

// ================================================================== 24 Review board
{
  const s = content(P2, "The architecture review board: one decider each");
  tag(s, "Who");
  const tb = table(s, "Board", 1.5, [3.4, 2.75, 2.15], ["Decision", "Decider", "Recorded as"], [
    ["Approved-technology list, and each tier", "Chief architect, as board chair", "Pull request with a decision record"],
    ["Reference patterns and their versions", "Chief architect", "Pattern repository release"],
    ["An exception to a standard", "Chief architect, with an end date", "Decision record with an expiry"],
    ["A design at Gate 2", "Chief architect or a delegate", "Decision record in the app's repository"],
    ["An application's disposition", "Application owner, with the steward", "Triage record"],
    ["Security and privacy control requirements", "CISO and senior agency official for privacy", "Requirement committed as policy"],
    ["Residual risk for the system", "Authorizing official alone", "Authorization decision"],
    ["Contracts and licenses", "CIO (FITARA) and sponsor", "Acquisition record"],
  ], { fontSize: 12, limit: 6.5 });
  const a = panel(s, "Members", 9.15, 1.5, 3.6, null, HEX.teal, HEX.tealTint, "WHO SITS ON IT (DESIGN)", null, [
    "Chief architect, chairing",
    "Lead architects: apps, data, integration, platform",
    "CISO's and privacy office's representatives (CM-3(4))",
    "Platform lead and steward",
    "The AO observes; never a member",
  ], 12.5);
  panel(s, "Tiers", 9.15, a + 0.2, 3.6, null, HEX.navy, HEX.navyTint, "THE TECHNOLOGY LIST", null, [
    "Adopt, trial, contain, retire",
    "DB2 and Oracle: contain or retire",
    "Versions and end dates, for SA-22",
  ], 12.5);
  sources(s, "Sources: OMB A-130 §5.a(2); NIST SP 800-53 Rev. 5 (PM-7, PL-8, SA-17, CM-3, CM-3(4), CM-4, SA-22) and 800-53B; OMB M-26-10; Nygard (2011). Book 18, Ch 07.");
  notes(s,
`No federal rule says to have an architecture review board, but several require what one produces. A-130 requires an enterprise architecture with a baseline, a target and a transition plan. In SP 800-53, PM-7 asks for that architecture, PL-8 asks each system's security and privacy architecture to fit it, and SA-17 asks developers for a consistent design. CM-3 asks a named change body to weigh security and privacy impact, with those representatives on it. And FITARA, restated in M-26-10 on March 31, 2026, means no IT contract without CIO approval: a board can recommend a technology, not buy one.

The board is the program's change control body for the target architecture. The table is its decision rights, and the rule is Book 13's: the board reviews, it doesn't vote, and every decision has one decider. The chief architect decides the technology list, the patterns, exceptions with end dates, and Gate 2 designs. The application owner decides the disposition. The CISO and privacy official set control requirements. The authorizing official alone accepts residual risk, and attends only as an observer, because that separation is something assessors check. The CIO approves contracts.

The board governs through three versioned artifacts that change by pull request. The technology list has four tiers, adopt, trial, contain and retire, with DB2 and Oracle in contain or retire depending on triage, and it carries versions and end-of-support dates, because a list without versions is a brochure. Reference patterns are runnable starting points, so Gate 2 for a standard service is short. And architecture decision records, in Nygard's 2011 format, numbered and superseded rather than deleted, are the cheapest evidence the program has.`,
  "Book 18, Chapter 07 — Who Governs the Architecture, \"What federal policy asks for, and what it leaves open,\" \"The architecture review board,\" \"Standards and patterns.\"");
}

// ================================================================== 25 Four gates
{
  const s = content(P2, "Four gates, and the evidence each one leaves");
  tag(s, "How");
  img(s, "ch07-gates-and-evidence", 0.6, 1.5, 2.35, 4.95);
  const tb = table(s, "Gates", 1.5, [1.55, 4.3, 2.05, 1.9], ["Gate", "What passes it", "Who decides", "Evidences"], [
    ["1  Disposition", "A scored triage record and a disposition the owner has signed", "Application owner, with the steward", "PM-5, CM-8, SA-22"],
    ["2  Design review", "Decision records; the OpenAPI contract; data classification; threat model; privacy check", "Chief architect or delegate", "PL-8, SA-3, SA-8, SA-17 (High), CM-4"],
    ["3  Pull request and CI", "Independent review; unit, contract and integration tests; static and dependency scans; an SBOM", "Code owner", "CM-3, SA-10, SA-11, SA-15"],
    ["4  Release", "A signed build with provenance; impact analysis; a change record linking the pull requests", "Release owner", "CM-3, CM-4, SR-4"],
  ], { x: 2.95, fontSize: 12, limit: 4.6 });
  panel(s, "Git", 2.95, tb + 0.2, 9.8, null, HEX.navy, HEX.navyTint, "GIT AND PIPELINE PRACTICE (DESIGN)", null, [
    "Trunk-based development or short-lived branches; protected branches that bind administrators too",
    "CI keeps its outputs (SSDF PO.3.3, PS.3.2); signed builds with SLSA 1.2 provenance",
    "SBOM contents per CISA's 2026 Minimum Elements (July 29, 2026)",
  ], 12.5);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 and 800-53B; SP 800-218 v1.1; DORA, trunk-based development; GitHub protected branches; SLSA 1.2; CISA 2026 SBOM Minimum Elements. Book 18, Ch 07.");
  notes(s,
`Every application the triage changes passes four gates; retire and retain pass only the first.

Gate 1, disposition: once per application and at each re-triage, a scored triage record and a signed disposition, decided by the owner with the steward. It evidences the system and component inventories and unsupported components. Gate 2, design review: before build for replatform, refactor and rebuild, and for rehost only when the runtime changes. It needs a decision record for each departure from a pattern, the interface contract, a data classification, a threat model and the privacy check that decides whether a PIA is needed. Gate 2 also applies the authorizing official's threshold for a significant change and records the answer; the threshold itself is the official's to set. Gate 3, every change: a pull request reviewed by someone other than the author, passing unit, contract and integration tests, static analysis, dependency scans and an SBOM. Gate 4, every production deployment: a signed build with provenance, a recorded impact analysis and a change record linking its pull requests.

Two gates are meetings and two are automation, deliberately. Gates 1 and 2 happen rarely and need judgment; 3 and 4 happen many times a day, and a program that runs Gate 3 as a meeting stalls or stops running it.

The panel is the practice that makes 3 and 4 cheap. Protected branches should bind administrators too; a rule administrators can skip is a standing exception. CI keeps its outputs. Releases are signed with SLSA provenance. Each output is kept by system, because no closure counts unless it carries its proof.`,
  "Book 18, Chapter 07 — \"Four gates,\" \"Git and pipeline practice,\" \"Agile without skipping the gates,\" \"How the gates become evidence.\"");
}
endModule("Module 3");

// ================================================================== 26 Module 4 divider
{
  const s = divider(P2, "Module 4: Reference implementation, frameworks, waves", "Part 2 — Governing and running  ·  Chapters 08–10",
    ["The reference implementation, and what its tests prove", "TOGAF's ADM phases and Zachman's cells", "Waves on the program's gates, the factory, metrics and funding"], 16);
  notes(s,
`Module 4: the reference implementation, the frameworks and the waves. Arguments about architecture are cheap; code that runs isn't. So this module starts with the small, tested slice of the target that ships with the book, and is honest about what its tests prove.

Then it places the work where enterprise architecture offices already file things: TOGAF's Architecture Development Method and Zachman's cells. And it ends with how the portfolio actually runs: waves laid on the program's phases and gates, the factory that makes each wave cheaper, the metrics and funding, and the decisions with their owners.`,
  "Book 18, Chapter 08 — The Reference Implementation; Chapter 09 — Mapping the Work to TOGAF and Zachman; Chapter 10 — Running the Portfolio in Waves.");
}

// ================================================================== 27 Reference implementation
{
  const s = content(P2, "The reference implementation: one application in miniature");
  tag(s, "What");
  img(s, "ch08-reference-implementation", 0.6, 1.5, 6.0, 4.95);
  const tb = table(s, "Parts", 1.5, [1.5, 3.85, 0.6], ["Part", "What it shows", "Ch."], [
    ["REST service", "Spring Boot over PostgreSQL; Flyway owns the schema; a contract test; RFC 9457 errors", "03"],
    ["Front end", "React: case list, Run triage, approve or reject proposals", "03"],
    ["Migration tool", "JDBC from DB2 or Oracle; transform, upsert, delta mode; three checks", "04"],
    ["Agent", "ModelClient with a stub; identity, sponsor, allow-list, step limit, audit", "05"],
    ["Containers", "A compose file and two Dockerfiles", "03"],
  ], { x: 6.8, fontSize: 12, limit: 5.0 });
  panel(s, "Versions", 6.8, tb + 0.2, 5.95, null, HEX.amber, HEX.amberTint, "VERSIONS, OCT. 28, 2026", null, [
    "Spring Boot 4.1.2; PostgreSQL 18.6; React 19.3.1",
    "Departures: compiled for Java 21, not 25; contract in OpenAPI 3.1, not 3.2",
  ], 12.5);
  sources(s, "Sources: examples/app-modernization; Maven Central (spring-boot); PostgreSQL versioning; npm registry (react); RFC 9457. Illustrative, synthetic data, no authentication. Book 18, Ch 08.");
  notes(s,
`The reference implementation lives in the repository's examples, app-modernization folder. It's one mission application in miniature: a case-management service with a front end, a legacy database it was moved from, and an AI agent that helps triage cases. It's illustrative, not production code: synthetic data, no authentication, never run against a real DB2 or Oracle database or in production.

The figure is its parts. The React front end calls the Spring Boot service. The service owns the PostgreSQL schema through one versioned Flyway migration, the V1 baseline, so nothing else creates tables, which is Chapter 03's rule that each service owns its data. It runs the triage agent, which writes only pending proposals a person decides, through a provider-neutral ModelClient with a stub by default. On the other side, a synthetic legacy DB2 or Oracle schema, with H2 as a stand-in in tests, feeds the migration tool, which loads into the same PostgreSQL schema and proves the load.

The versions were current when it was built: Spring Boot 4.1.2, the latest on Maven Central on October 28 when 4.2 was at its first release candidate; PostgreSQL 18.6; React 19.3.1. Two choices differ from Chapter 03's target and should be read that way. It's compiled for Java 21, not 25, only because the build machine had a Java 21 kit, and it uses nothing Java 25 would reject. And the contract is OpenAPI 3.1, not 3.2; moving it is a header change and a test run.`,
  "Book 18, Chapter 08 — The Reference Implementation, opening section, \"What is in it.\"");
}

// ================================================================== 28 What the code proves
{
  const s = content(P2, "What the code shows: contract, three checks, guardrails");
  tag(s, "How");
  const W = 3.95;
  const a = panel(s, "Contract", 0.6, 1.5, W, null, HEX.navy, HEX.navyTint, "THE SERVICE AND ITS CONTRACT", null, [
    "Five endpoints; openapi.yaml written by hand and served",
    "A test compares it with Spring's mappings, both ways",
    "Undocumented endpoint or unbuilt path: a red build",
    "Errors as problem details: 404, 400, 409",
  ], 12.5);
  const b = panel(s, "Migrate", 0.6 + W + 0.15, 1.5, W, null, HEX.amber, HEX.amberTint, "THE MIGRATION TOOL", null, [
    "DB2-style legacy habits: padded CHAR, one-letter codes, a 0001-01-01 sentinel",
    "Documented transforms; an unmappable value stops the run",
    "Delta mode can't see applicant changes or deletes",
    "Report: keys, counts and digests, never row contents",
  ], 12.5);
  const c = panel(s, "Agent", 0.6 + 2 * (W + 0.15), 1.5, W, null, HEX.teal, HEX.tealTint, "THE AGENT", null, [
    "Won't start without an agent ID and a sponsor",
    "Unlisted tools refused and audited; arguments validated",
    "Step limit of five by default",
    "Writes only PENDING proposals; a decision in its own name is refused",
  ], 12.5);
  callout(s, "Break", Math.max(a, b, c) + 0.25, 0.9, "FaClipboardCheck", HEX.teal, "The tests break things on purpose: ",
    "one changed amount fails checksum and aggregates; a truncated name fails only the checksum; stub modes misbehave.");
  sources(s, "Sources: Book 18, Ch 08 and the README in examples/app-modernization; RFC 9457 (July 2023). The implementation is illustrative, not production code. Book 18, Ch 08.");
  notes(s,
`Three parts of the code show the book's patterns most directly.

The service has five endpoints: list cases, optionally by status, get one, run triage, list proposals, and record a person's decision. The contract comes first: openapi.yaml is written by hand and served by the service, and a test called OpenApiContractTest compares its operations with the request mappings Spring registered, in both directions. An endpoint missing from the contract fails the build, and so does a documented path nobody built, which is the cheapest form of Gate 3's contract test. Errors are RFC 9457 problem details.

The migration tool's legacy side has real legacy habits: fixed-width padded text, one-letter status codes, a closing date stored as year one because the column was declared not null decades ago, and timestamps with no time zone. It reads over JDBC, applies a short list of documented transforms, and stops on any value it can't map rather than guessing. Its since option is Chapter 04's delta pattern, and the README states what a delta can't see here: applicant changes and deletes. It validates whole tables three ways and writes a JSON report with no row contents, ready for the change record.

The agent proposes flagging a case open over a year or a likely duplicate. ModelClient's default is a rule-based stub needing no key or network. The service won't start without an agent ID and sponsor; unlisted calls are refused and audited; arguments are validated; the loop stops at five steps; and the decision endpoint is the only path that applies a proposal. The tests prove it by breaking things.`,
  "Book 18, Chapter 08 — \"The service and its contract,\" \"The migration tool and its three checks,\" \"The agent and its guardrails.\"");
}

// ================================================================== 29 Verified
{
  const s = content(P2, "What was verified on October 28, 2026, and what wasn't");
  tag(s, "How");
  const tb = table(s, "Verified", 1.5, [4.0, 8.15], ["Claim", "Status on October 28, 2026"], [
    ["The service works against real PostgreSQL", "Verified: 25 service tests pass against PostgreSQL 18.6 with the Flyway migration applied; one asserts the engine and version"],
    ["The contract matches the code", "Verified by the contract test, in both directions"],
    ["The migration tool's transforms and checks work", "Verified: 12 migration tests load into real PostgreSQL with the service's own schema"],
    ["The migration works against real DB2 or Oracle", { text: "Not verified: H2's DB2 and Oracle compatibility modes stand in, and one difference has already shown up", options: { bold: true, color: HEX.red } }],
    ["The agent's guardrails hold", "Verified against the stub and scripted misbehaving replies; not run against a real model"],
    ["The front end works", "6 component tests pass with network calls mocked; no end-to-end browser test"],
    ["The containers start", { text: "Not verified: Docker wasn't available; the compose file was checked only as YAML", options: { bold: true, color: HEX.red } }],
  ], { fontSize: 13, limit: 5.6 });
  callout(s, "Prod", tb + 0.2, 0.9, "FaShieldHalved", HEX.amber, "A production version adds: ",
    "sign-in through the agency's identity provider, a workload identity for the agent, secrets from a vault, an SBOM and signed builds.");
  sources(s, "Sources: Book 18, Ch 08, \"What was verified, and what wasn't\" and \"Running it\"; Zonky embedded-postgres 2.2.2 (Maven Central). Book 18, Ch 08.");
  notes(s,
`An architecture is easier to trust when it runs, and easier still when it says plainly what its tests don't prove. This is the book's own table.

Running it needs only Java 21 and Node.js 24. The Maven Wrapper downloads Maven, and the service and migration tests download real PostgreSQL binaries through Zonky's embedded PostgreSQL library and start them in the test process, so no database server or Docker is needed.

What's verified. 25 service tests pass against PostgreSQL 18.6 with the Flyway migration applied, and one asserts the engine and version. 12 migration tests pass, loading into real PostgreSQL with the service's own schema. The guardrails hold against the stub and the two scripted misbehaving modes, one asking for a tool it was never offered and one that never stops, but not against a real model. The front end's 6 component tests pass with network calls mocked; there's no end-to-end browser test.

What isn't, in red. The migration hasn't run against real DB2 or Oracle. The tests use H2's compatibility modes as a stand-in, and H2 isn't either engine: fixed-width text comparison, date types and driver behavior differ, and one difference has already shown up. Run the tool against a copy of the real source before relying on it. And the containers weren't started; Docker wasn't available, so the compose file was only checked as YAML.

A production version adds what the example leaves out on purpose: authentication through the agency's identity provider, with the decider taken from the signed-in user rather than the request; a workload identity for the agent, per Book 17; secrets from a vault; and the pipeline evidence of Chapters 06 and 07, such as a software bill of materials and signed builds.`,
  "Book 18, Chapter 08 — \"Running it,\" \"What was verified, and what wasn't.\"");
}

// ================================================================== 30 TOGAF
{
  const s = content(P2, "TOGAF: the ADM phases, and the chapters that do them");
  tag(s, "What");
  img(s, "ch09-adm-map", 0.6, 1.5, 3.8, 4.95);
  const tb = table(s, "ADM", 1.5, [2.95, 5.2], ["ADM phase", "Book 18 work it stands in for"], [
    ["Preliminary", "Ch 06, 07, 09: principles, the board and gates, tailoring the frameworks"],
    ["A  Architecture Vision", "Ch 01: scope, the problem and the case for change"],
    ["B  Business Architecture", "Ch 02: mission criticality, owners, cost"],
    ["C  Information Systems", "Ch 03, 04, 05: applications, data, AI"],
    ["D  Technology Architecture", "Ch 03, 08: runtimes, containers, building blocks"],
    ["E  Opportunities and Solutions", "Ch 02, 10: dispositions; move groups as work packages"],
    ["F  Migration Planning", "Ch 10: the wave plan"],
    ["G  Implementation Governance", "Ch 04, 07, 08: gates, validation, conformance"],
    ["H  Architecture Change Mgmt.", "Ch 10: re-triage starts the next cycle"],
    ["Requirements Management", "Ch 05, 06: AI, security, privacy and records requirements"],
  ], { x: 4.6, fontSize: 12, limit: 5.6 });
  panel(s, "Standard", 4.6, tb + 0.15, 8.15, null, HEX.navy, HEX.navyTint, null, null, [
    "TOGAF 10th Edition (C220), announced Apr. 25, 2022; Technical Corrigendum 1 applied May 2025",
  ], 12.5);
  sources(s, "Sources: The Open Group: TOGAF 10th Edition launch, C220 page, licensed downloads, ADM index; OMB A-130 §5.a(2). The mapping is the program's reading. Book 18, Ch 09.");
  notes(s,
`Many agencies have an enterprise architecture office that speaks TOGAF or Zachman. The book maps what it already does onto the phases and cells, so its records can be filed as they are. The mappings are the program's reading; neither The Open Group nor Zachman International has reviewed them.

First, the requirement. A-130 requires an enterprise architecture with a baseline, a target and a transition plan, and SP 800-53 carries it as PM-7, with PL-8 at the level of one system. It names no framework. FEAF version 2, from January 2013, survives only on an archived page and is historical. TOGAF and Zachman are choices.

The current TOGAF is the 10th Edition, announced April 25, 2022, document C220, with Technical Corrigendum 1 applied in May 2025.

The figure and table are the ADM with the chapters that do each phase's work. Preliminary is the capability: Chapters 06, 07 and this one. Vision is Chapter 01. Business is Chapter 02's mission criticality and owners. Information Systems is Chapters 03 to 05. Technology is Chapter 03 and the reference implementation. Opportunities and Solutions is the dispositions and move groups; Migration Planning is the wave plan; Implementation Governance is the gates and validation; Change Management is re-triage, which starts the next cycle. Requirements Management, at the center, is Chapters 05 and 06. One caution: the book runs several cycles at once, one for the portfolio and one per application, where Phase G happens on every change.`,
  "Book 18, Chapter 09 — Mapping the Work to TOGAF and Zachman, opening section, \"What federal policy requires,\" \"The TOGAF Standard today,\" \"Mapping the chapters and artifacts to TOGAF.\"");
}

// ================================================================== 31 Zachman
{
  const s = content(P2, "Zachman: the cells filled, and the gaps that show");
  tag(s, "What");
  const tb = table(s, "Cells", 1.5, [2.85, 2.6, 1.65, 5.05], ["Book 18 work", "Row (perspective)", "Column", "Cell"], [
    ["Ch 01–02 portfolio and triage", "1 Executive; 2 Business Mgmt.", "What; Who; Why", "Inventory Identification; Responsibility Definition; Motivation Definition"],
    ["Ch 03 target architecture", "3 Architect; 4 Engineer", "How; Where", "Process Representation; Distribution Specification"],
    ["Ch 04 data", "3 Architect; 4 Engineer; 6", "What", "Inventory Representation, Specification and Instantiations"],
    ["Ch 05 agents", "3 Architect; 4 Engineer", "Who; How", "Responsibility Representation; Responsibility Specification"],
    ["Ch 07 governance", "2 Business Mgmt.; 3 Architect", "Who; When", "Responsibility Definition; Timing Representation"],
    ["Ch 08 reference implementation", "5 Technician", "All six", "The Configuration cells, for one application"],
  ], { fontSize: 12, limit: 4.6 });
  const W = 5.99;
  panel(s, "Gaps", 0.6, tb + 0.2, W, null, HEX.red, HEX.redTint, "GAPS THE GRID SHOWS", null, [
    "Where is thin above row 4: locations and networks are Books 09 and 10",
    "When is thin below row 2: batch windows belong in each design review",
  ], 12.5);
  panel(s, "Use", 0.6 + W + 0.17, tb + 0.2, W, null, HEX.teal, HEX.tealTint, "USING THE MAPPINGS (DESIGN)", null, [
    "File, don't redo; answer PM-7 and PL-8 with the A-130 triad",
    "An empty cell is a question, not a defect",
  ], 12.5);
  sources(s, "Sources: Zachman Framework v3.0, The Enterprise Ontology (© 1987–2011); Zachman International, About and Evolution; NIST SP 800-53 PM-7, PL-8; archived FEAF v2 page. Book 18, Ch 09.");
  notes(s,
`The current Zachman Framework is version 3.0, The Enterprise Ontology, dated 2011 on the framework graphic. It's a six-by-six schema: the interrogatives What, How, Where, Who, When and Why as columns; and the audience perspectives as rows, from Executive through Business Management, Architect, Engineer and Technician to Enterprise, each with a reification stage: identification, definition, representation, specification, configuration and instantiation. A cell is named by column and stage, so Inventory Identification is row 1 of What. Zachman is emphatic that it is not a methodology. TOGAF is the order; Zachman is the checklist.

The table is the main cells the book fills. The portfolio and triage fill row 1 and 2 cells: the inventory, the owners as Responsibility Definition, the dispositions as Motivation Definition. The target architecture is Process Representation for services and contracts and Distribution Specification for containers. The data chapter runs down the What column, from logical model to physical schema to the migrated rows. Agents are Responsibility Representation and Specification. And the reference implementation is row 5, all six Configuration cells, for one application; its validation report is Inventory Instantiations.

Reading by column shows two gaps. Where is thin above row 4, because locations and networks are Books 09 and 10. When is thin below row 2: batch windows and event schedules belong in each design review's decision record.

File artifacts under their phase and cell; don't rewrite them. Answer PM-7 and PL-8 with A-130's baseline, target and transition plan. Treat an empty cell as a question. And no federal rule requires either framework, so claiming conformance proves nothing about controls.`,
  "Book 18, Chapter 09 — \"The Zachman Framework today,\" \"Mapping the chapters and artifacts to Zachman,\" \"Using the mappings.\"");
}

// ================================================================== 32 Waves on the phases
{
  const s = content(P2, "The waves on the program's phases and gates");
  tag(s, "How");
  img(s, "ch10-waves", 0.6, 1.5, 3.0, 4.95);
  const tb = table(s, "Phases", 1.5, [2.6, 4.2, 2.35], ["Phase and gate (Book 01)", "What it means for the portfolio", "Leaves behind"], [
    ["0 Pre-flight; G0", "Inventory, score, disposition and owner for every application", "Triage record; a first wave plan"],
    ["1 Foundation; G1", "Build the factory; stand up the review gates", "One test app moved end to end"],
    ["2 Pilot; G2", "Run the pilot wave", "Runbooks rewritten"],
    ["3 General rollout; G3", "Run the factory waves", "Apps modernized and authorized"],
    ["4 Legacy retirement; G4", "Decommission servers, DB2 and Oracle instances, licenses", "Retirement records, signed off"],
    ["5 AD DS retirement; G5", "No production app may still authenticate against AD", "A dependency check for G5"],
    ["6 Steady state", "Work the long tail; re-triage on a cadence", "A portfolio that stays current"],
  ], { x: 3.6, fontSize: 11.5, limit: 5.4 });
  panel(s, "Kinds", 3.6, tb + 0.12, 9.15, null, HEX.amber, HEX.amberTint, "THREE KINDS OF WAVE (PROGRAM DESIGN)", null, [
    "Pilot: three to five simple apps plus one hard case with DB2 or Oracle and a real contract",
    "Factory waves: move groups sized by measured throughput; long tail: owners and review dates",
  ], 12.5);
  sources(s, "Sources: Book 01, Ch 12 (phases, gates G0–G5 and authorities); AWS Prescriptive Guidance, wave planning; Microsoft CAF, migration wave planning. Book 18, Ch 10.");
  notes(s,
`The triage produced a list, not a plan. Waves are batches that move through the same steps, each leaving the next cheaper.

The portfolio doesn't need a second schedule. It runs inside Book 01's seven phases and gates G0 to G5. Phase 0 is the triage, leaving the record and a first wave plan. Phase 1 builds the factory: platform, patterns, pipelines, validation tooling and the gates, proven by one test application moved end to end. Phase 2 is the pilot wave, which leaves runbooks rewritten from what went wrong. Phase 3 runs the factory waves, for as long as the portfolio needs, reporting at the monthly gate review. Phase 4 decommissions what the waves replaced, with the records officer's sign-off. Phase 5 has no application work, but a hard dependency: no production application may still authenticate against Active Directory when G5 is decided. Phase 6 works the long tail and re-triages.

The panel is the three kinds of wave. AWS and Microsoft both say start small and simple; Microsoft adds one or two complex, representative workloads to early waves. The program takes both: three to five simple applications plus one hard case with a DB2 or Oracle database and a real contract, exiting only when every application has passed all four gates and every migration validated. Factory waves are move groups ranked by score and sized by measured throughput. The long tail isn't a wave; it's a managed list, and a retained application reaching end of support goes back to triage automatically.`,
  "Book 18, Chapter 10 — Running the Portfolio in Waves, opening section, \"The portfolio on the program's phases,\" \"Planning waves,\" \"Three kinds of wave.\"");
}

// ================================================================== 33 Factory, metrics, funding
{
  const s = content(P2, "Move groups, the factory, metrics and funding");
  tag(s, "How");
  const W = 3.95;
  const a = panel(s, "Plan", 0.6, 1.5, W, null, HEX.navy, HEX.navyTint, "PLANNING WAVES", null, [
    "A move group: apps that share a database or an owner move together",
    "A shared DB2 or Oracle schema: one move group, or one app goes first behind an interface",
    "Rank five waves deep; plan only the next in detail",
    "Re-score on triggers, and yearly with the budget",
  ], 12.5);
  const b = panel(s, "Factory", 0.6 + W + 0.15, 1.5, W, null, HEX.teal, HEX.tealTint, "THE FACTORY AND ITS METRICS", null, [
    "Platform, patterns, pipelines, data tooling, runbooks, a portfolio team",
    "Its test: wave five costs less per application than wave one",
    "Metrics from records: retired, validated first time, defects after cut-over, time to authorization, DORA",
  ], 12.5);
  const c = panel(s, "Fund", 0.6 + 2 * (W + 0.15), 1.5, W, null, HEX.amber, HEX.amberTint, "FUNDING BY WAVE", null, [
    "TMF: typically under $25M, five-year repayment, outcomes ideally in 12 months",
    "MGT Act working capital fund: three years; can't supplant O&M; savings fund the next wave",
    "Capital planning (40 U.S.C. 11312); the CIO signs the wave plan",
  ], 12.5);
  callout(s, "Avoided", Math.max(a, b, c) + 0.25, 0.9, "FaChartLine", HEX.amber, "Report cost avoided only from Phase 4 records: ",
    "it's a forecast until the old system is actually switched off.");
  sources(s, "Sources: AWS Prescriptive Guidance; Microsoft CAF; DORA metrics; TMF fit, process and 2026 call; MGT Act §1077(b); 40 U.S.C. §11312; OMB M-26-10. Book 18, Ch 02, 10.");
  notes(s,
`Planning the waves. AWS calls the unit a move group: applications and servers that must migrate together, such as those sharing a database or an owner. For applications the strongest rule is the database: applications sharing a DB2 or Oracle schema move together, or one goes first behind an interface the others call. AWS plans four to five waves ahead; Microsoft details only the next wave. Together: a ranked backlog five waves deep with only the next fully planned. And re-score on triggers, an end-of-support date within the horizon, an incident or finding, a material change in cost, users or mission, and at least yearly with the budget.

The factory is the people, platform and procedures that make each wave routine, and the program's has five parts: the platform, the patterns, reusable pipelines for Gates 3 and 4, data tooling, and runbooks with a small portfolio team under the steward. Its own test: the fifth wave costs less per application than the first. The metrics are reported monthly from records, not plans: dispositioned, retired with infrastructure actually off, modernized, migrations validated on the first run, cost avoided, DORA's lead time and change fail rate, defects in the first 30 days, time from Gate 2 to authorization, and long-tail health.

Funding follows the waves. The TMF funds proposals that improve, retire or replace systems, typically under 25 million with five-year repayment and outcomes ideally within 12 months, released in stages at milestones. MGT Act working capital funds hold deposits for three years, can't supplant O&M, and go first to CIO-approved cost-saving activities, so one wave's retirement savings pay for the next.`,
  "Book 18, Chapter 10 — \"Planning waves,\" \"The modernization factory,\" \"Metrics,\" \"Funding,\" \"Keeping the triage current\"; Chapter 02 — \"Where capital planning and the TMF fit.\"");
}

// ================================================================== 34 Decisions
{
  const s = content(P2, "Decisions, owners, and what to start on Monday");
  tag(s, "How");
  table(s, "Decisions", 1.5, [5.25, 2.65, 0.85], ["Decision (design guidance)", "Who decides", "Ch."], [
    ["The triage criteria, weights and rules, once; then the contested cases", "Leadership", "02"],
    ["Each application's disposition (Gate 1)", "Application owner, with the steward", "02, 07"],
    ["The approved-technology list, its versions and upgrade dates", "Chief architect, as board chair", "03, 07"],
    ["The security and privacy control requirements for designs", "CISO and privacy official", "06, 07"],
    ["An application's cut-over strategy", "Application owner and AO", "04"],
    ["Whether a change is significant; acceptance of residual risk", "Authorizing official", "07"],
    ["IT contracts, licenses and the wave plan", "CIO", "07, 10"],
  ], { fontSize: 13.5, limit: 6.5 });
  panel(s, "Monday", 9.6, 1.5, 3.15, null, HEX.teal, HEX.tealTint, "NO NEW PLATFORM NEEDED", "Start with these", [
    "Inventory every app with an owner",
    "Calibrate the rubric on 30 to 50 known apps",
    "Publish the approved list with end dates",
    "Ask for three validation results before cut-over",
    "Make \"no agent writes a record\" a standard",
  ], 14);
  sources(s, "Sources: Book 18, Chapters 01–10; OMB Circular A-130; NIST SP 800-53 Rev. 5; OMB M-26-10. Decisions and sequence are program design guidance.");
  notes(s,
`So, the decisions, each with its decider from the book, all program design guidance.

Leadership approves the rubric, not each decision: the criteria, weights and rules once, then the contested cases rule 7 sends up. The application owner, with the steward, decides each disposition at Gate 1. The chief architect, as board chair, owns the approved-technology list, its versions and its upgrade dates. The CISO and the senior agency official for privacy set the control requirements designs must meet. The application owner and the authorizing official choose an application's cut-over strategy. The authorizing official alone decides whether a change is significant enough to reopen the authorization, and accepts residual risk; an exception from the chief architect is never a risk acceptance. And the CIO approves IT contracts and licenses, which is a good reason to have the CIO sign the wave plan.

Five things to start on Monday that need no new platform. Build the inventory: an owner and a proposed disposition for every application. Calibrate the rubric on thirty to fifty applications your architects already know. Publish the approved-technology list with supported versions and end-of-support dates, and fail the build on a retired one. Before any cut-over, ask for the three results, row counts, a checksum and a reconciliation of totals the business recognizes, with every mismatch explained. And make it a design standard that no agent writes to a system of record: agents read and propose, people approve, services apply.

The book's argument in one line: decide application by application, build the changed ones on one architecture, prove the data moved, govern the AI, and let the gates write the evidence. Chapters 01 through 10 carry the detail, every claim footnoted and dated. Thank you.`,
  "Book 18, Chapters 02, 03, 04, 05, 06, 07 and 10, \"What leadership should take from this\" and \"Key takeaways.\"");
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
  "GAO-25-107795, Information Technology: Agencies Need to Plan for Modernizing Critical Decades-Old Legacy Systems (July 17, 2025), Highlights and pp. 1–12, 18–22; product page (status as of Feb. 2026).  ·  GAO-19-471 (June 11, 2019).",
  "OMB Circular A-130 (2016 revision): §5.a(1)–(3), §5.d(1)(e)–(g).  ·  FAR 48 CFR 39.103, Modular contracting (FAC 2026-01, Mar. 13, 2026).  ·  40 U.S.C. §11312 (a)–(b).  ·  NIST FIPS 199 (Feb. 2004), §§3–4.",
  "Martin Fowler, \"Strangler Fig\" (Aug. 22, 2024).  ·  Stephen Orban, \"6 Strategies for Migrating Applications to the Cloud,\" AWS (Nov. 1, 2016).  ·  Help Net Security, reporting Gartner's five options (May 16, 2011).",
  "AWS Prescriptive Guidance, Guide for AWS large migrations, \"About the migration strategies.\"  ·  Microsoft Learn: CAF, \"Select your cloud migration strategies\"; \"The 6 Rs of application modernization.\"",
  "Technology Modernization Fund: \"Agency and project fit\"; \"2026 Call for Proposals.\"  ·  Workbook cross-references: Book 06, Chapters 05–06.",
  "Full footnotes with links and access dates (Oct. 28, 2026): Book 18, Chapters 01–02.",
]);
sourceSlide("Sources behind Module 2 — Architecture and data", [
  "OpenJDK JDK project (JDK 25–27 GA dates); Microsoft Build of OpenJDK support roadmap; Spring Boot system requirements (4.1.2) and project generations (api.spring.io); react.dev versions; Node.js releases and Release WG schedule.json.",
  "OpenAPI Specification v3.2.1 (Sept. 10, 2026); OCI overview and image, distribution and runtime spec releases; Kubernetes releases and release cycle; The Twelve-Factor App, III. Config; Azure Architecture Center: Backends for Frontends, Strangler Fig.",
  "NIST SP 800-204 (Aug. 2019), SP 800-204A–D (2020–2024), SP 800-190 (Sept. 2017) and CSRC publication pages.",
  "PostgreSQL versioning policy and 18 documentation (date/time types, CREATE SEQUENCE); Oracle SQL Language Reference 23ai (data types, nulls); Microsoft Learn: Sequence numbers; SSMA overview, SSMA for Db2, SSMA for Oracle, Copilot in SSMA.",
  "AWS: SCT user guide and extension packs; DMS Schema Conversion; DMS data validation; DMS ongoing replication; Db2 for z/OS as a source; Prescriptive Guidance on Oracle packages.  ·  Ora2Pg.  ·  Azure Architecture Center: Scheduler Agent Supervisor; Transactional Outbox.",
  "Full footnotes with links and access dates (Oct. 28, 2026): Book 18, Chapters 03–04; Book 06, Chapters 12 and 19; Book 17, Chapter 06.",
]);
sourceSlide("Sources behind Module 3 — AI, compliance and governance", [
  "OMB M-25-21 (Apr. 3, 2025) §4(b)(v), fn. 22; M-25-22 §4(e)(i).  ·  NIST AI 600-1 (July 2024) §2; SP 800-218A (July 26, 2024).  ·  Lewis et al., arXiv:2005.11401 (2020).  ·  CISA, Careful Adoption of Agentic AI Services (May 1, 2026).",
  "OWASP GenAI Security Project: Top 10 for LLM Applications 2025 (LLM01, LLM05, LLM06, LLM10); Top 10 for Agentic Applications for 2026 (Dec. 9, 2025).  ·  Model Context Protocol specification 2026-07-28; governance.  ·  Spring AI 2.0.2.",
  "Microsoft Learn: GitHub Copilot modernization quickstart and CLI.  ·  AWS Transform for mainframe.  ·  OMB Circular A-130 §5.a, §5.f, §5.h, Appendices I–II.  ·  OMB M-26-05 (Jan. 23, 2026); M-25-05 (Jan. 15, 2025); M-26-10 (Mar. 31, 2026).",
  "NIST SP 800-53 Rev. 5 release 5.2.0 (Aug. 27, 2025) OSCAL catalog and SP 800-53B baselines; SP 800-218 v1.1 (Feb. 2022) and Rev. 1 initial public draft (Dec. 17, 2025).",
  "Nygard, \"Documenting Architecture Decisions\" (2011); DORA trunk-based development; GitHub protected branches; SLSA 1.2; CISA 2026 Minimum Elements for an SBOM (July 29, 2026).",
  "Full footnotes with links and access dates (Oct. 28, 2026): Book 18, Chapters 05–07; Book 13, Chapters 04, 07 and 09; Book 14; Book 17.",
]);
sourceSlide("Sources behind Module 4 — Implementation and waves", [
  "examples/app-modernization and its README.  ·  Maven Central: spring-boot metadata (4.1.2, 4.2.0-RC1); io.zonky.test:embedded-postgres 2.2.2.  ·  PostgreSQL versioning (18.6).  ·  npm registry, react latest (19.3.1).  ·  RFC 9457 (July 2023).",
  "The Open Group: TOGAF Standard 10th Edition launch (Apr. 25, 2022); C220 publication page (May 19, 2025, TC1); licensed downloads; ADM online chapter index; Guide to Security Architecture in TOGAF ADM (W055, 2005).",
  "Zachman Framework for Enterprise Architecture v3.0 (© 1987–2011); Zachman International, About and Evolution.  ·  Archived FEAF v2 (Jan. 29, 2013).  ·  NIST SP 800-53 Rev. 5: PM-5, PM-7, PL-8, CM-8, SA-22.",
  "AWS Prescriptive Guidance: wave planning; phases of a large migration.  ·  Microsoft CAF: migration wave planning; plan your migration.  ·  DORA software delivery performance metrics.",
  "TMF: fit, process and 2026 call.  ·  MGT Act, Pub. L. 115-91 §1077(b).  ·  40 U.S.C. §11312(a).  ·  OMB M-26-10.  ·  OMB Circular A-130 §5.a(1).  ·  Workbook: Book 01, Chapter 12; Book 13, Chapter 04.",
  "Full footnotes with links and access dates (Oct. 28, 2026): Book 18, Chapters 08–10.",
]);

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
