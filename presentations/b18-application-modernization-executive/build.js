// Book 18 — Application Modernization: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: CIO, CTO or chief architect, portfolio owners, CISO, privacy officer, authorizing officials and sponsors.
// Decision-centered: every decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B18_Application_Modernization_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b18-application-modernization/, named in the notes. The
// dispositions, the triage rubric, the technology stack, the gates, the factory and the wave design are the book's
// program design and are labeled as such; product versions, support windows and tool capabilities are dated
// observations (October 28–29, 2026); the reference implementation is illustrative.
// Diagrams are the committed PNGs in docs/images/diagrams/b18-application-modernization/png/; alt text is read from
// the chapters' fig-alt so it stays in step with the book. The spoken narration lives in narration.json.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 18", title: "Application Modernization",
  footer: "Federal Modernization Workbook  ·  Book 18 Application Modernization  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B18_Application_Modernization_Executive.pptx";

// Speaker notes with a timing cue worked out from the spoken words at about 142 words a minute,
// so the cues stay right when a slide's notes are edited. The "Workbook:" line isn't spoken.
const WPM = 142;
let clock = 0, spoken = 0;
const mmss = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const perSlide = [];
const narrate = (s, body, ref) => {
  const words = body.split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (words * 60) / WPM;
  spoken += words;
  perSlide.push(words);
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};

// ---------------------------------------------------------------- checks
// Slide titles stay at or under 58 characters, and each narrated title must match narration.json.
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  titles.push(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };
// A conservative text-fit estimate (Calibri at about 0.55 em per character), used to size the panels and to
// print a "!" warning at build time when text may overflow its box. FIT=1 prints each box's estimated bottom.
const FIT = !!process.env.FIT;
const lineH = (pt) => (pt / 72) * 1.2;
const linesFor = (chars, w, pt) => Math.max(1, Math.ceil((chars * 0.55 * pt / 72) / Math.max(0.3, w)));
const needFor = (paras, w, pa) => paras.reduce((h, p) => h + linesFor(p.chars, w - (p.bullet ? 0.3 : 0.05), p.size) * lineH(p.size) + (pa || 0) / 72, 0);
const parasOf = (t, size) => {
  if (typeof t === "string") return [{ chars: t.length, size, bullet: false }];
  const out = []; let cur = { chars: 0, size: 0, bullet: false };
  t.forEach((r) => {
    const o = r.options || {}; const sz = o.fontSize || size;
    cur.size = Math.max(cur.size, sz); cur.chars += (r.text || "").length * (sz / Math.max(cur.size, sz)); cur.bullet = cur.bullet || !!o.bullet;
    if (o.breakLine || o.bullet) { out.push(cur); cur = { chars: 0, size: 0, bullet: false }; }
  });
  if (cur.chars) out.push(cur);
  return out.map((p) => Object.assign(p, { size: p.size || size }));
};
const T = (s, name, t, o) => {
  const need = needFor(parasOf(t, o.fontSize || 14), o.w, o.paraSpaceAfter);
  if (need > o.h * 1.02) console.warn(`  ! slide ${pres.slides.length} ${name}: text may overflow (needs ${need.toFixed(2)} in, has ${o.h.toFixed(2)})`);
  if (FIT) console.log(`    slide ${pres.slides.length} ${name}: text bottom ~${(o.y + need).toFixed(2)} in (box ${(o.y + o.h).toFixed(2)})`);
  return txt(s, name, t, o);
};
const sources = (s, text) => {
  if (text.length > 170) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y: 6.62, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

// ---------------------------------------------------------------- diagrams
// The committed PNG, scaled to fit (maxW x maxH), centered in its area; alt text from the chapter's fig-alt.
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b18-application-modernization");
const PNG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b18-application-modernization", "png");
const CHAPTERS = fs.readdirSync(BOOK).filter((f) => /^\d\d-.*\.md$/.test(f)).map((f) => fs.readFileSync(path.join(BOOK, f), "utf8")).join("\n");
const altFor = (name) => {
  const m = CHAPTERS.match(new RegExp(`svg/${name}\\.svg\\)\\{[^}]*fig-alt="([^"]+)"`));
  if (!m) throw new Error(`no fig-alt found in the chapters for ${name}`);
  return m[1];
};
const figure = (s, name, x, maxW, maxH, top) => {
  const file = path.join(PNG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  const H = maxH || 3.6, y0 = top || 1.5;
  let w = maxW, h = maxW / ar;
  if (h > H) { h = H; w = H * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y: y0 + (H - h) / 2, w, h, altText: altFor(name) });
  if (FIT) console.log(`    slide ${pres.slides.length} figure ${name}: ${w.toFixed(2)} x ${h.toFixed(2)} in, bottom ${(y0 + (H + h) / 2).toFixed(2)}`);
  return { w, h };
};

// ---------------------------------------------------------------- layout helpers
// The decision bar: every decision slide states the decision, its owner and when it's needed.
const decision = (s, what, owner, when) => {
  const y = 5.3, h = 1.2;
  box(s, "Decision bar", 0.6, y, 12.15, h, "FFFFFF", HEX.amber);
  icon(s, "FaScaleBalanced", 0.82, y + 0.25, 0.7, HEX.amber);
  const col = (name, x, w, label, text, color) => T(s, name, [
    { text: label, options: { bold: true, color, fontSize: 11, charSpacing: 1, breakLine: true } },
    { text, options: { fontSize: 14, color: HEX.ink } },
  ], { x, y: y + 0.08, w, h: h - 0.16, valign: "middle" });
  col("Decision", 1.75, 6.55, "DECISION", what, HEX.amber);
  col("Owner", 8.5, 2.1, "OWNER", owner, HEX.teal);
  col("When", 10.7, 1.95, "WHEN", when, HEX.navy);
};
// The bottom callout for a context slide (no decision on it), the same size and place as the decision bar.
const takeaway = (s, iconName, color, label, text) => D.callout(s, "Takeaway", 5.3, 1.2, iconName, color, label, text);
// A labeled list of tinted rows down the left half of the slide.
const rows = (s, prefix, label, list, top, step, h) => {
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.5, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, 6.2, h, i % 2 ? HEX.navyTint : HEX.grey);
    T(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h, fontSize: 13.5, valign: "middle" });
  });
};
// A tinted box with an icon, a heading and a bullet list, sized to its content (default x 7.75 to 12.75).
const sideBox = (s, prefix, iconName, color, tint, heading, list, o = {}) => {
  const x = o.x || 7.75, w = o.w || 5.0, size = o.size || 13.5, y = o.y || 1.5;
  const listNeed = needFor(parasOf(bullets(list, size), size), w - 0.45, 6);
  const h = Math.max(o.minH || 0, Math.round((0.92 + listNeed + 0.2) * 100) / 100);
  if (y + h > 5.12) console.warn(`  ! slide ${pres.slides.length} ${prefix} box runs past the decision bar (bottom ${(y + h).toFixed(2)} in)`);
  if (FIT) console.log(`    slide ${pres.slides.length} ${prefix} box: bottom ${(y + h).toFixed(2)} in`);
  box(s, `${prefix} box`, x, y, w, h, tint);
  icon(s, iconName, x + 0.25, y + 0.16, 0.6, color);
  T(s, `${prefix} head`, heading, { x: x + 1.0, y: y + 0.16, w: w - 1.15, h: 0.6, bold: true, color, fontSize: 16.5, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size), { x: x + 0.25, y: y + 0.92, w: w - 0.45, h: listNeed + 0.1, paraSpaceAfter: 6 });
  return h;
};
// A table with a navy header row (default at x 0.6); warns when a cell's text won't fit its row.
const leftTable = (s, header, body, colW, rowH, fontSize, o = {}) => {
  const pt = fontSize || 12.5;
  [header, ...body].forEach((r, i) => r.forEach((c, j) => {
    const t = typeof c === "string" ? c : c.text;
    const need = linesFor(t.length, colW[j] - 0.2, pt) * lineH(pt) + 0.1;
    if (need > rowH[i] + 0.02) console.warn(`  ! slide ${pres.slides.length} table row ${i} col ${j} may wrap past its height (${need.toFixed(2)} > ${rowH[i]})`);
  }));
  const y = o.y || 1.5;
  if (FIT) console.log(`    slide ${pres.slides.length} table: bottom ${(y + rowH.reduce((a, b) => a + b, 0)).toFixed(2)} in`);
  return s.addTable([head(header), ...body], tableOpts(colW, { x: o.x || 0.6, y, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

const S_WHY = "Why a portfolio, not a rewrite", S_WHAT = "What each application becomes",
  S_WHO = "Who governs the architecture", S_HOW = "How to run it in waves";

// ------------------------------------------------------------------ Title
{
  const s = titleSlide(S_WHY, "Application Modernization: the executive briefing", "Book 18 — Application Modernization  ·  Executive briefing");
  D.agenda(s, 0.8, 4.8, 6.6);
  T(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "30 minutes for the CIO, chief architect, portfolio owners, CISO, privacy officer, authorizing officials and sponsors", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.4, w: 9.0, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 18 of the Federal Modernization Workbook, Application Modernization: about thirty minutes for the CIO, the CTO or chief architect, portfolio and application owners, the CISO, the privacy officer, authorizing officials and sponsors.

The argument in three sentences. An agency with thousands of legacy mission applications can't rewrite its way out: grand rewrites run years late, run beside the old system and lose the knowledge buried in the old code. So the unit of decision is the application: each gets a disposition from a scored triage, and only the ones that change are engineered, on one target reference architecture. Data moves with proof, AI joins only with an owner for every agent, and the portfolio runs in waves under gates that produce compliance evidence.

Four questions: why a portfolio and not a rewrite; what each application becomes; who governs the architecture; and how to run it at scale.

Three labels run through the deck, as through the book. The dispositions, the rubric, the stack, the gates and the wave design are program design, not federal requirements. Product versions, support windows and tool capabilities are dated observations, checked October 28 and 29, 2026. And the reference implementation is illustrative.

Each decision slide names the decision, its owner and when it's needed; undated timings are design guidance. The last slide gathers them.`,
  "Book 18, index (Status — draft book; Why, what, who, how); Chapter 01 — A Portfolio, Not a Rewrite (The book's argument; Honest limits).");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "Most IT money keeps existing systems running");
  tag(s, "Why");
  leftTable(s, ["GAO's reviews", "June 2019", "July 2025"], [
    [bold("Systems most in need"), { text: "10, at 10 agencies" }, { text: "11, at 10 agencies" }],
    [bold("Age of those systems"), { text: "8 to 51 years" }, { text: "About 23 to 60 years" }],
    [bold("Complete plans"), { text: "8 of 10 agencies lacked them" }, { text: "3 of 11 had every key element" }],
    [bold("IT spend; share on O&M"), { text: "Over $90B; about 80%" }, { text: "Over $100B; 79% planned" }],
  ], [2.3, 2.3, 2.3], [0.42, 0.6, 0.6, 0.6, 0.6]);
  sideBox(s, "Lists", "FaTriangleExclamation", HEX.red, HEX.redTint, "What the lists don't show", [
    "11 systems: about $754M of $83B in O&M",
    "The bulk: thousands of ordinary applications",
    "Extent of legacy IT unknown; nothing flags it",
    "The gap is planning: milestones, work, disposition",
  ]);
  takeaway(s, "FaChartLine", HEX.red, "The problem is the whole portfolio, not the flagship systems.  ",
    "A program built only for the systems on GAO's list leaves most of the operations and maintenance cost where it is.");
  sources(s, "Sources: GAO-19-471 (June 11, 2019); GAO-25-107795 (July 17, 2025) and its product page (status as of February 2026). Book 18, Chapter 01.");
  narrate(s,
`Start with the money. GAO's July 2025 review puts federal IT and cyber-related spending at more than $100 billion a year, with agencies typically reporting about 80 percent of it on operations and maintenance of existing IT. For fiscal year 2025 the IT Dashboard figure for the 24 CFO Act agencies was about $83 billion, 79 percent of planned IT spending.

GAO has twice ranked the most critical legacy systems. In 2019: 10 systems at 10 agencies, aged 8 to 51 years, and 8 of the 10 agencies lacked complete plans. In 2025: 11 systems, about 23 to 60 years old, costing about $754 million a year; only 3 had plans with every key element, and 2 had none. Seven run with vulnerabilities that can't be fixed without modernization.

Two features matter. The reviews measure the top of the list: eleven systems at $754 million are a small share of $83 billion, and the bulk sits in thousands of ordinary applications. And the gap GAO keeps finding is planning, not technology: milestones, a description of the work, and the disposition of the legacy system, each decided per system.

GAO also notes the extent of legacy IT is unknown, because OMB doesn't require investments to be flagged as legacy. The figures are government-wide and self-reported; each agency should measure its own.`,
  "Book 18, Chapter 01 — A Portfolio, Not a Rewrite (opening; The scale of the problem; Honest limits).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "Big-bang rewrites fail; policy asks for segments");
  tag(s, "Why");
  rows(s, "Fails", "WHY A WHOLE-SYSTEM REWRITE FAILS", [
    ["Value", "Nothing arrives until the single cut-over"],
    ["Specification", "The real requirements live in the old code"],
    ["Risk", "All of it in one switch, with no easy way back"],
    ["Time", "A decade-long build ships decade-old choices"],
  ], 1.88, 0.76, 0.64);
  sideBox(s, "Policy", "FaLandmark", HEX.navy, HEX.navyTint, "What federal policy asks for", [
    "A-130: useful segments, narrow scope, brief duration",
    "Modular contracts within 180 days of solicitation",
    "IT delivered within 18 months",
    "FAR 39.103: each increment a workable system",
    "Replacement allowed, in pieces that stand alone",
  ]);
  decision(s, "Approve no modernization proposal that delivers nothing until a single cut-over: require useful segments that each stand on their own",
    "CIO, who approves IT contracts", "Before any contract is approved");
  sources(s, "Sources: GAO-25-107795; OMB Circular A-130 §5.d(1)(f)–(g); FAR 39.103 (FAC 2026-01); M. Fowler, Strangler Fig (2024); OMB M-26-10. Book 18, Chapters 01, 07.");
  narrate(s,
`The intuitive response is a replacement program: design, build, switch over. GAO's 2025 report recounts efforts abandoned over planning, cost and time to deliver, and investments that took more than a decade, partly because they weren't organized into manageable segments, contrary to OMB policy.

The reasons are structural. Value arrives only at the end, so the business case is tested when most of the money is spent. The specification is the old system: its real requirements are in its code, its data and its users' workarounds, and a rewrite must rediscover them all before go-live. Risk is concentrated in one cut-over with no easy way back. And a decade-long build ships technology chosen a decade earlier.

Federal policy points the other way. Circular A-130 asks agencies to structure major IT acquisitions into useful segments with a narrow scope and brief duration, with modular contracts awarded within 180 days of solicitation and IT delivered within 18 months. The FAR's modular contracting rule asks for increments that each deliver a workable system. Replacement isn't forbidden; it has to come in pieces that stand on their own.

Not every rewrite fails: a small, well-understood application with few integrations can be rebuilt in one step. The argument is against the whole-system rewrite as the default.

The decision sits with the CIO, who under FITARA, restated in OMB M-26-10, must approve IT contracts.`,
  "Book 18, Chapter 01 (Why big-bang rewrites fail; Honest limits; What leadership should take from this, item 3); Chapter 07 — Who Governs the Architecture (What federal policy asks for: FITARA and M-26-10; responsibility matrix: approve IT contracts and licenses).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "The application is the unit of decision");
  tag(s, "Why");
  figure(s, "ch01-portfolio-not-rewrite", 0.6, 6.9);
  sideBox(s, "Unit", "FaCubes", HEX.teal, HEX.tealTint, "Why the application", [
    "A program is too coarse: it mixes retire and rebuild",
    "A platform can't retire until every app decides",
    "An application has an owner, data, code, a boundary",
    "A-130: inventory, EA transition plan, disposition",
    "A recorded disposition is evidence",
  ]);
  decision(s, "Ask for the inventory before the program: every application listed with an owner and a proposed disposition, not a target-state design",
    "Steward runs it; sponsor and CIO read it", "Phase 0, before gate G0");
  sources(s, "Sources: OMB Circular A-130 §5.a(1)–(3); GAO-25-107795 (key plan elements); AWS and Microsoft migration strategy guidance. Book 18, Chapters 01 and 10.");
  narrate(s,
`A portfolio program still has to decide what happens to each thing in it. The program or mission area is too coarse: it holds applications that should be retired next to ones that should be rebuilt. The platform can't be retired until every application on it has a decision. The application works: it has a mission owner, a data set, a code base, dependencies and an authorization boundary.

Federal policy is organized that way already. A-130 requires an inventory of major systems and an enterprise architecture with a baseline, a target and a transition plan that covers disposition of systems, and wants unsupported systems phased out as rapidly as possible. GAO's third key plan element is a disposition for each legacy system.

The figure is the book's argument: triage each application; retire or retain without engineering; rehost or replatform with little code change; refactor or rebuild onto one target, with data moved with proof and AI only with an owner; all of it governed and run in waves.

A recorded disposition, with its scores and the owner's agreement, is itself evidence for the transition plan, capital planning and an audit.

So the first deliverable is the inventory, not a target-state design. That's Phase 0, which the steward clears at gate G0; the share dispositioned is a metric the sponsor and CIO read.`,
  "Book 18, Chapter 01 (The unit of decision is the application; What leadership should take from this, item 1); Chapter 10 — Running the Portfolio in Waves (The portfolio on the program's phases; Metrics: applications dispositioned).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "Six dispositions, cheapest first");
  tag(s, "What");
  const disp = [
    ["Retire", "Switched off; records dispositioned", "Few users; a service already does it"],
    ["Retain", "Kept on purpose, with a review date", "Stable, supported, meets the need"],
    ["Rehost", "New infrastructure, no code change", "Sound app on a platform being exited"],
    ["Replatform", "Limited change: engine or runtime", "Logic sound; platform unsupported"],
    ["Refactor", "Onto the target, piece by piece", "Valuable, but blocked by its structure"],
    ["Rebuild", "Written again, still in increments", "The code can't be salvaged"],
  ];
  leftTable(s, ["Disposition", "What happens", "What points to it"], disp.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [1.35, 2.75, 2.8], [0.38, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], 12);
  sideBox(s, "Decisions", "FaListCheck", HEX.amber, HEX.amberTint, "Two are decisions, not projects", [
    "Retire and retain need an owner, not a team",
    "Most early savings come from them",
    "Replace counts as retire; the product is bought",
    "A-130: custom build only if nothing else fits",
    "The six names are the program's vocabulary",
  ]);
  decision(s, "Fund decisions as well as projects: retire and retain on purpose, and fund the decommissioning work that makes each retirement real",
    "CIO, through capital planning", "Each budget cycle");
  sources(s, "Sources: Gartner (as reported, 2011); AWS Prescriptive Guidance (7 Rs); Microsoft CAF and the 6 Rs; OMB Circular A-130 §5.a(3). Book 18, Chapters 01 and 02.");
  narrate(s,
`Six dispositions, in rising order of cost and risk. Retire: switched off, its records kept, transferred or destroyed under the records schedule. Retain: kept on purpose, with a documented reason and a review date. Rehost: new infrastructure, no code change. Replatform: limited change, such as a new database engine, runtime or container. Refactor: restructured onto the target incrementally, behind a stable interface. Rebuild: written again on the target, still in increments.

The ordering is the rubric's first rule: the cheapest disposition that meets the mission need, with every step up justified by the scores.

The names come from Gartner's five options, which AWS dates to 2011, AWS's 7 Rs and the Cloud Adoption Framework's eight strategies; Microsoft's application modernization guidance uses the same six. Replace is treated as retire, because the new service is an acquisition with its own authorization, and A-130 says custom development should start only when no existing source can efficiently meet the need.

Two of the six are decisions, not projects. Retire and retain need an owner's agreement and, for retire, a decommissioning checklist, but no engineering team, and they're where most early savings are. A portfolio where nothing is retained has usually not been triaged.

The decision: fund decisions as well as projects, including decommissioning, through capital planning, where the CIO approves the IT components of agency plans.`,
  "Book 18, Chapter 02 — Triaging the Portfolio (The six dispositions; Where the names come from; Where capital planning and the TMF fit: the CIO's approval; What leadership should take from this, item 2); Chapter 01 (What leadership should take from this, item 2).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "Approve the rubric, not each decision");
  tag(s, "What");
  figure(s, "ch02-triage-funnel", 0.6, 6.6);
  sideBox(s, "Rubric", "FaTableList", HEX.amber, HEX.amberTint, "A score from data the agency holds", [
    "Six criteria, from mission to dependencies",
    "Two axes: mission value, technical health",
    "First matching rule wins; cheapest that fits",
    "Rule 7: deep study only where stakes are high",
    "Calibrate on 30 to 50 applications first",
  ], { x: 7.45, w: 5.3 });
  decision(s, "Agree the criteria, weights and rules once; then rule only on the contested and high-stakes cases that rule 7 sends up (program design)",
    "Program leadership; owners sign each disposition", "Before scoring the portfolio");
  sources(s, "Sources: FIPS 199; OMB Circular A-130; 40 U.S.C. §11312; GAO-25-107795; AWS Prescriptive Guidance. Book 18, Chapters 02 and 07. The rubric is program design.");
  narrate(s,
`Triage of thousands can't be a study per application; a three-month assessment each would outlast most of the applications. It's a rubric applied to data, with judgment kept for exceptions.

Six criteria are scored 1 to 5: mission criticality, technical condition, data sensitivity, cost, skills and dependencies. FIPS 199 does much of the first pass: every federal system already has a categorization, and its availability and integrity impact stand in for mission criticality, confidentiality for data sensitivity. Dependencies decide sequence, not disposition.

The criteria combine into two axes, mission value and technical health, and each score carries a confidence flag: measured, attested or assumed. The decision table applies in order and the first match wins, from retire for low value to rebuild only after cheaper options are ruled out. Rule 7 sends any high-impact refactor or rebuild, and any contested result, to deep study. That's how a rubric covers thousands without becoming careless.

Owners get a fixed review window; a contested score is corrected, not argued around. Calibrate first on thirty to fifty applications experienced architects know, changing the weights, not their judgment, and again after the first wave.

The rubric is program design. Leadership agrees it once and rules on what rule 7 sends up; each disposition is signed by its application owner at Gate 1.`,
  "Book 18, Chapter 02 (The six triage criteria; A scored rubric, not a study per application; Honest limits; What leadership should take from this, item 1); Chapter 07 (Four gates: Gate 1, disposition).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "One target architecture, and a budget to keep it current");
  tag(s, "What");
  figure(s, "ch03-reference-architecture", 0.6, 5.6);
  sideBox(s, "Stack", "FaCubes", HEX.navy, HEX.navyTint, "The program's stack, October 2026", [
    "Java 25 LTS and Spring Boot 4.1 for services",
    "React front ends; Node.js only where it fits",
    "OpenAPI contracts first; OCI containers on Kubernetes",
    "Spring Boot: about 13 months of open-source support",
    "Program's choice: no federal rule names a stack",
  ], { x: 6.45, w: 6.3 });
  decision(s, "Approve one target stack and a way to change it, and budget platform upgrades as recurring work",
    "Chief architect owns the list; CIO funds upgrades", "Before the first refactor starts");
  sources(s, "Sources: OpenJDK; Microsoft Build of OpenJDK roadmap; Spring project generations; React; Node.js releases; OpenAPI 3.2.1; Kubernetes (Oct 28, 2026). Book 18, Ch. 03.");
  narrate(s,
`If each project picks its own language, framework and hosting, the agency ends the decade with as many stacks as it started with, only newer. One reference architecture makes the common choices once, so the platform team, the security team and the authorizing official review one pattern instead of hundreds.

The program's choices, checked October 28, 2026: Java on the current long-term support release, Java 25, with Spring Boot for services; React front ends kept thin, with business rules in services; Node.js only for thin backends-for-frontend, build tooling and event glue, on an LTS release; OpenAPI contracts written before the code; OCI containers on Kubernetes; PostgreSQL or SQL Server for data; secrets from a vault or, better, a workload identity. No federal rule names a stack; an agency with an established alternative, .NET for example, can substitute its own list.

The risk is the stack aging. Recent Spring Boot generations have had about thirteen months of open-source support: 3.5 is already outside it, and 4.0 leaves it at the end of 2026. Node.js release lines change this month, and Kubernetes maintains only its three newest minor releases. The approved list has to be maintained, not published once.

So the chief architect owns the approved list and its upgrade dates, and platform upgrades are budgeted as recurring work, or the modernized portfolio becomes the next legacy one.`,
  "Book 18, Chapter 03 — The Target Reference Architecture (The layers and the choices; Services: Java and Spring Boot; Node.js where it fits; Containers, orchestration and configuration; Honest limits; What leadership should take from this, items 1 and 2); Chapter 07 (What it decides: approved-technology list).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "Replace in increments behind a stable interface");
  tag(s, "What");
  figure(s, "ch03-strangler-fig", 0.6, 12.15, 2.3, 1.45);
  const cards = [
    ["Requests can be intercepted", "If nothing can sit in front of it, the pattern doesn't fit"],
    ["Shared data has a plan", "One domain at a time: copied, kept in sync, validated"],
    ["Rollback has an end", "Practical until the legacy tables are removed, last"],
  ];
  cards.forEach((c, i) => {
    const x = 0.6 + i * 4.125;
    box(s, `Fit ${i}`, x, 3.95, 3.9, 1.15, i % 2 ? HEX.navyTint : HEX.grey);
    T(s, `Fit ${i} text`, [{ text: c[0], options: { bold: true, color: HEX.navy, breakLine: true } }, { text: c[1] }],
      { x: x + 0.15, y: 4.0, w: 3.6, h: 1.05, fontSize: 13.5, valign: "middle" });
  });
  decision(s, "Ask every refactor proposal to name its façade, its first function to move, its plan for shared data and when rollback ends",
    "Chief architect or delegate", "Gate 2, before build");
  sources(s, "Sources: Microsoft Learn, Azure Architecture Center, Strangler Fig pattern; M. Fowler, Strangler Fig (August 22, 2024). Book 18, Chapters 03 and 07.");
  narrate(s,
`A refactor happens through the strangler-fig pattern: new functionality is built alongside the legacy system and behavior moves over piece by piece. The figure's four stages: a façade intercepts requests and sends most to the legacy application; functions move one at a time to new services behind the same contract, with an anti-corruption layer translating between old and new; the legacy application is decommissioned once nothing depends on it; and the façade is removed or kept as an adapter.

The guidance also says when a refactor is feasible, which belongs in rule 7's deep study. Requests must be interceptable: if the back end can't sit behind a façade and none of its integration points can change, the pattern doesn't fit. Shared data needs a plan: one domain at a time, copied, kept in sync with change data capture, validated, and only then made the system of record. The façade mustn't become a bottleneck. Rollback stays practical until a domain's legacy tables and procedures are removed, a deliberate last step. And a small system may be simpler to replace whole.

The decision is a question at design review: name the façade, the first function to move, the shared-data plan and when rollback ends. The chief architect or a delegate decides at Gate 2.`,
  "Book 18, Chapter 03 (Replacing incrementally: the strangler fig; What leadership should take from this, item 3); Chapter 07 (What it decides: a design at Gate 2; Four gates).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Data moves once, and the move must be proven");
  tag(s, "What");
  figure(s, "ch04-convert-move-prove", 0.6, 4.4);
  sideBox(s, "Checks", "FaClipboardCheck", HEX.teal, HEX.tealTint, "Three checks whose blind spots don't overlap", [
    "Row counts: missing or duplicated rows",
    "Checksum: any changed value, in any order",
    "Totals the business knows, computed on each side",
    "Silent risks: dates losing their time, empty strings, keys",
    "Validation proves equivalence, not correctness",
  ], { x: 5.3, w: 7.45 });
  decision(s, "Before any cut-over, see row counts, a checksum and a reconciliation of totals the business recognizes, with every mismatch explained",
    "Application owner and authorizing official", "Before cut-over");
  sources(s, "Sources: Oracle SQL Language Reference 23ai; PostgreSQL 18 docs; AWS DMS data validation; Microsoft Learn, sequence numbers. Book 18, Chapters 04 and 07.");
  narrate(s,
`Code can be replaced a piece at a time; data moves once, and it's where projects lose the most trust. A bad screen is visible the day it ships; a row that didn't arrive, or a date that lost its time of day, may surface months later in a beneficiary's record. So the move is three jobs, each with evidence: convert the schema, move the rows, prove the result.

The dangerous conversions are the ones that succeed. Oracle's DATE holds a time of day; map it to PostgreSQL's date type and the time disappears. Oracle treats an empty string as null and the targets don't. Sequences must be advanced past the highest migrated key before the first insert, and neither engine guarantees gapless numbers.

No single check proves the move, because each shares an assumption with what it checks. Row counts catch missing or duplicated rows, not wrong values. A checksum over canonicalized rows catches any changed value, but computed after the transform it shares the transform's mistakes. An aggregate reconciliation written against each database, such as sums of amounts and counts per status, catches what the checksum can't; choose totals the business owner recognizes.

Validation proves equivalence, not correctness.

The cut-over choice belongs to the application owner and the authorizing official, and every strategy ends at the same gate: three results, every mismatch explained, and a rehearsed rollback.`,
  "Book 18, Chapter 04 — Moving the Data (opening; Type mapping: where meaning changes silently; Proving that nothing was lost; Cutting over; Honest limits; What leadership should take from this, item 1).");
}

// ------------------------------------------------------------------ What 6
{
  const s = content(S_WHAT, "Coexist without dual writes; settle the engine early");
  tag(s, "What");
  figure(s, "ch04-cutover-options", 0.6, 6.6);
  sideBox(s, "Engine", "FaDatabase", HEX.amber, HEX.amberTint, "The engine picks the tools", [
    "Only AWS's tools convert DB2 to PostgreSQL",
    "Microsoft's assistant targets only SQL Server",
    "DMS can't capture changes from Db2 for z/OS",
    "PostgreSQL 14 leaves support November 12, 2026",
    "AI conversion is a draft; its endpoint is in scope",
  ], { x: 7.4, w: 5.35 });
  decision(s, "Forbid application dual writes: one writer per table, replicated, never written twice; and settle each target engine before the wave plan commits dates",
    "Chief architect, as a standard", "Before the wave plan commits dates");
  sources(s, "Sources: AWS SCT, DMS Schema Conversion, DMS CDC and Db2 for z/OS limits; Microsoft SSMA; PostgreSQL versioning (Oct 2026). Book 18, Chapters 04 and 07.");
  narrate(s,
`Phased and parallel cut-overs keep old and new in step for weeks or months. The figure compares big-bang, with a freeze and one switch; phased, one module or table set at a time; and parallel run, reconciled until the outputs agree, which suits calculations such as eligibility or payment amounts.

Only one way of staying in step is safe by default. Change data capture reads committed changes from the source's log, so the target can lag but never receives a change the source rejected. Dual writes, where the application writes to both databases, fail because the two writes don't share a transaction; under load the stores drift, invisibly. The program's rule: one system of record per table at a time, no application dual writes, fallback by reverse replication, and validation on a schedule.

Two cautions. AWS's change data capture has no latency guarantee, and for Db2 for z/OS as a source DMS supports only full loads, so a mainframe DB2 system that must coexist needs a separate change-capture product or delta loads. And the engine chooses the tools: only AWS's tools convert DB2 to PostgreSQL, Microsoft's assistant targets only SQL Server and Azure SQL, and PostgreSQL 14 leaves community support on November 12, 2026.

The decisions: forbid dual writes as a standard, and settle the engine before the wave plan commits dates.`,
  "Book 18, Chapter 04 (Choosing the target engine; The conversion tools, October 2026; Cutting over; Coexistence without dual writes; What leadership should take from this, items 2 and 3); Chapter 07 (Standards and patterns).");
}

// ------------------------------------------------------------------ What 7
{
  const s = content(S_WHAT, "AI with an owner: agents read and propose");
  tag(s, "What");
  figure(s, "ch05-agent-guardrails", 0.6, 4.5);
  sideBox(s, "Guard", "FaUserShield", HEX.red, HEX.redTint, "One interface, and guardrails for every agent", [
    "Assistive and retrieval features change nothing alone",
    "One provider-neutral model interface; calls recorded",
    "Each agent: an identity, a sponsor, a tool allow-list",
    "Least privilege enforced by the systems it calls",
    "A step limit, and an audit of every call",
    "A change to a record is a proposal a person approves",
  ], { x: 5.4, w: 7.35 });
  decision(s, "No agent writes to a system of record, and none runs without a federal employee as its sponsor; fund one provider-neutral model interface",
    "Chief architect, as design standards", "Before the first agent runs");
  sources(s, "Sources: OMB M-25-21 fn. 22; M-25-22 §4(e)(i); OWASP LLM01, LLM06, LLM10 (2025); MCP specification 2026-07-28; Spring AI 2.0.2. Book 18, Chapters 05 and 07.");
  narrate(s,
`Generative AI fits the architecture as a component: a capability behind an interface, called by a service that owns the business rules, its output checked rather than obeyed. The federal rules are in Book 17; two points shape this design. M-25-21's AI risk acceptance is separate from system authorization, and M-25-22 requires an authorization to operate before deployment, so an AI feature is part of the application's system and boundary.

Assistive features and retrieval change nothing by themselves, and retrieval runs with the caller's permissions. Code modernization assistance produces drafts that pass the same review gates, never unattended on a production repository. An agent that calls tools can act. All of them call models through one provider-neutral interface owned by the platform: one call shape, a record of which model answered for which caller, a deterministic stub for tests, and limits in one place.

An agent's risk is what it can do. OWASP calls it Excessive Agency, and says of prompt injection that it's unclear whether fool-proof prevention exists. So the design assumes a steered agent and limits the harm: an identity and a human sponsor; a tool allow-list enforced outside the model, with denials audited; least privilege enforced by the systems it calls; a step limit; and no tool that writes to a system of record. A change becomes a pending proposal an authorized person approves.

Watch for approval fatigue. The chief architect makes these design standards.`,
  "Book 18, Chapter 05 — Generative and Agentic AI in the Architecture (Where AI fits; One provider-neutral model interface; The guardrails an agent needs; Tool protocols: the Model Context Protocol; Honest limits; What leadership should take from this); Chapter 07 (Standards and patterns).");
}

// ------------------------------------------------------------------ What 8
{
  const s = content(S_WHAT, "Compliance carried by the platform, not each app");
  tag(s, "What");
  figure(s, "ch06-controls-in-the-lifecycle", 0.6, 2.6);
  sideBox(s, "Legacy", "FaTriangleExclamation", HEX.red, HEX.redTint, "Legacy is a compliance finding", [
    "A-130: systems that can't be secured go first",
    "SA-22: replace unsupported components",
    "Retain without a plan is an open finding",
    "Inheritance is only as good as the platform's ATO",
  ], { x: 3.45, w: 4.55, minH: 3.4 });
  sideBox(s, "Evidence", "FaFileShield", HEX.navy, HEX.navyTint, "Evidence the pipeline writes", [
    "Test and scan results for every release",
    "A software bill of materials for every build",
    "Pull requests as change records",
    "SSDF 1.1 is final; version 1.2 is a draft",
  ], { x: 8.2, w: 4.55, minH: 3.4 });
  decision(s, "Treat every retained application on unsupported software as a finding: record a plan, compensating controls, a risk acceptance and a review date",
    "Application owner; the AO accepts the risk", "At triage, and at each review date");
  sources(s, "Sources: OMB Circular A-130 §5.a and Appendix I; SP 800-53 Rev. 5 (release 5.2.0); OMB M-26-05; SP 800-218 and its Rev. 1 draft. Book 18, Chapters 06 and 07.");
  narrate(s,
`Compliance is usually a package assembled at the end. Modernization is the moment to change that, because the agency is choosing the architecture, platform and pipeline anyway. A control the target architecture implements once is inherited by every application on it; a pipeline that records its results produces evidence on every merge and release.

A-130 asks for exactly this: security, privacy, records, transparency and supply chain considered throughout the life cycle, with controls built into the enterprise architecture and development processes. It also asks agencies to plan for systems that can't be appropriately protected, including unsupported components, and give them high priority for upgrade, replacement or retirement; in the catalog that's SA-22. So a retained application on unsupported software without a plan is an open finding, not a neutral decision.

The figure places the controls: engineering principles and PII authority at design; developer testing, the SSDF practices and an SBOM at build; baseline, change control, inventory and encryption at deploy; logging, flaw remediation and account review, agents included, in operation.

M-26-05 rescinded the attestation mandate in January 2026 but kept the software inventory and lets agencies require SBOMs by contract. For software it builds, the agency is the producer, and SSDF version 1.1 is the practice set; 1.2 is still a draft. Inheritance is only as good as the platform's own authorization.

The application owner records the plan; the authorizing official alone accepts the risk.`,
  "Book 18, Chapter 06 — Compliance by Design (opening; Legacy as a compliance finding; The controls application work touches most; Secure development after M-26-05; Evidence, not packages; Honest limits; What leadership should take from this, items 1 and 2); Chapter 07 (What it decides: residual risk).");
}

// ------------------------------------------------------------------ What 9
{
  const s = content(S_WHAT, "Privacy and records come in at design review");
  tag(s, "What");
  rows(s, "Events", "EVENTS THAT REOPEN PRIVACY AND RECORDS WORK", [
    ["New store", "A new engine changes where PII lives"],
    ["New flow", "Services, APIs and replication copy data"],
    ["AI feature", "Sending records to a model is a new use"],
    ["Test data", "Production PII outside production; mask it"],
    ["Retirement", "Records migrated, transferred or destroyed"],
  ], 1.88, 0.64, 0.54);
  sideBox(s, "Records", "FaBuildingColumns", HEX.teal, HEX.tealTint, "Data governance and records", [
    "Privacy review begins at the earliest planning",
    "The data inventory entry moves with the data",
    "The chief data officer's body sees the change",
    "The records officer reviews every retire",
    "Dropping history may be destroying records",
  ]);
  decision(s, "Route the named events to the privacy and records officials at design review, before anything is built",
    "Senior privacy official; records officer", "Gate 2, before build");
  sources(s, "Sources: OMB Circular A-130 §5.f, §5.h and Appendix II; Evidence Act (Pub. L. 115-435); OMB M-25-05; SP 800-53 PT family. Book 18, Chapters 06 and 07.");
  narrate(s,
`Modernization changes how personal information flows, and privacy obligations attach to those changes. A-130 requires privacy impact assessments when developing or using IT, PII limited to what's authorized and necessary, and an inventory of systems that handle it, and says the senior agency official for privacy's review should begin at the earliest planning stages.

So the program names the events that reopen privacy work. A new data store or engine changes where PII lives and who administers it. A new data flow, from splitting a monolith, adding an API or change data capture, creates copies the old assessment didn't describe. An AI feature is a new use of the information. Test data should be synthetic or masked. And retirement is a disposition of the PII a system holds.

Data governance follows the data. Under the Evidence Act and OMB M-25-05, agencies keep a comprehensive data inventory under their chief data officers; when a data asset moves or splits, its entry moves with it, and that's on the cut-over checklist.

Records decisions come in disguise. A-130 builds retention and disposition in from design to decommissioning. Retiring an application means migrating, transferring or destroying its records under an approved schedule, and a migration that drops history or attachments may be destroying records. So the records officer reviews every retire disposition.

These judgments aren't automatable; they go to the privacy and records officials at Gate 2.`,
  "Book 18, Chapter 06 (Privacy as a design input; Data governance: the Evidence Act and chief data officers; Records: from design to decommissioning; Honest limits; What leadership should take from this, item 3); Chapter 07 (What it decides; Who sits on it; Four gates: Gate 2).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "One decider for every architecture decision");
  tag(s, "Who");
  const owners = [
    ["Approved-technology list and patterns", "Chief architect"],
    ["An exception, with an end date", "Chief architect"],
    ["A design at Gate 2", "Chief architect or delegate"],
    ["An application's disposition", "Application owner"],
    ["Security and privacy control requirements", "CISO; senior privacy official"],
    ["Whether a change is significant", "Authorizing official"],
    ["Residual risk for the system", "Authorizing official"],
    ["Contracts and licenses", "CIO (FITARA)"],
    ["Charter the board and name its chair", "CIO"],
  ];
  leftTable(s, ["Decision", "Decides"], owners.map((r, i) => [{ text: r[0] }, bold(r[1], i === 5 || i === 6 ? HEX.amber : HEX.teal)]),
    [4.0, 2.9], [0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36], 12);
  sideBox(s, "Board", "FaUsersGear", HEX.teal, HEX.tealTint, "How the board works", [
    "The board reviews; it doesn't vote",
    "Security and privacy members, as CM-3(4) asks",
    "The AO observes; never a member",
    "It recommends technology; the CIO buys",
    "An exception touching a control goes to the AO",
  ]);
  decision(s, "Charter the architecture review board in an existing forum, name the chief architect as its chair, and give every decision one decider",
    "CIO", "Phase 1, before Gate 2 runs");
  sources(s, "Sources: OMB Circular A-130 §5.a(2); SP 800-53 Rev. 5 CM-3, CM-3(4), CM-4, PL-8, PM-7; OMB M-26-10 (FITARA). Book 18, Chapters 07 and 10.");
  narrate(s,
`The earlier decisions survive a few hundred delivery teams only if they have owners. Otherwise defensible shortcuts add up to a second legacy estate.

No federal rule requires an architecture review board, but several require what one produces. A-130 requires an enterprise architecture, and SP 800-53's PM-7, PL-8 and SA-17 ask for it, each system's place in it and designs consistent with it. CM-3 asks for a named change control body with security and privacy representatives, and CM-4 for impact analysis. Under FITARA, restated in OMB M-26-10, the CIO must approve IT contracts. A board can recommend a technology; it can't buy one.

So the board is the change control body for the target architecture, ideally an existing forum. The table is the book's decision list: the chief architect, as chair, decides the approved list, patterns, exceptions with an end date and Gate 2 designs; application owners decide dispositions; the CISO and the senior agency official for privacy set control requirements; the authorizing official alone decides significance and accepts residual risk; the CIO approves contracts and charters the board.

The board reviews; it doesn't vote. The authorizing official observes but isn't a member. And an exception that touches a control goes to the authorizing official through the plan of action and milestones.

The CIO charters the board in Phase 1, when the gates stand up.`,
  "Book 18, Chapter 07 — Who Governs the Architecture (What federal policy asks for; The architecture review board: what it decides, who sits on it; Responsibility matrix; Where governance goes wrong, item 5); Chapter 10 (The portfolio on the program's phases: Phase 1, Foundation).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "Four gates, and each one leaves proof");
  tag(s, "Who");
  figure(s, "ch07-gates-and-evidence", 0.6, 1.9);
  leftTable(s, ["Gate", "When", "Who decides", "What it leaves"], [
    [bold("1. Disposition"), { text: "Once per app; each re-triage" }, { text: "Application owner" }, { text: "A signed, scored triage record" }],
    [bold("2. Design review"), { text: "Before build" }, { text: "Chief architect or delegate" }, { text: "Decision records, contract, threat model, privacy check" }],
    [bold("3. Pull request and CI"), { text: "Every change" }, { text: "Code owner" }, { text: "Independent review, tests, scans, an SBOM" }],
    [bold("4. Release"), { text: "Every deployment" }, { text: "Release owner" }, { text: "Signed build, provenance, change record" }],
  ], [1.9, 2.15, 2.4, 3.6], [0.4, 0.58, 0.58, 0.58, 0.58], 12, { x: 2.7 });
  T(s, "Gates note", [{ text: "Two gates are meetings and two are automation.  ", options: { bold: true, color: HEX.navy } },
    { text: "Gates 3 and 4 run many times a day on protected branches that bind administrators too; a missing artifact is a failed gate." }],
    { x: 2.7, y: 4.4, w: 10.05, h: 0.7, fontSize: 14, valign: "middle" });
  decision(s, "Set the threshold for when a change is significant enough to reopen the authorization; Gate 2 applies it and records the answer",
    "Authorizing official", "In the monitoring strategy, before wave one");
  sources(s, "Sources: SP 800-53 Rev. 5 CM-3, CM-4, SA-11, SR-4; SP 800-218 PW.7, PO.3.3, PS.3.2; OMB M-26-05; CISA SBOM minimum elements (2026). Book 18, Chapter 07.");
  narrate(s,
`The board governs through three artifacts kept in a repository and changed by pull request: an approved-technology list with tiers and supported versions, since SA-22 asks for unsupported components to be replaced; runnable reference patterns; and architecture decision records. A list without versions is a brochure. Teams that start from a pattern inherit the review it already passed, so Gate 2 for a standard service is short.

Every application the triage changes passes four gates; retire and retain pass only the first. Gate 1: a scored triage record the owner signed. Gate 2, before build: decision records, the interface contract, a data classification, a threat model and the privacy check. Gate 3, every change: a pull request reviewed by someone other than its author, passing tests and scans, and an SBOM. Gate 4, every release: a signed build with provenance, an impact analysis and a change record.

Two are meetings and two are automation, deliberately. Gates 3 and 4 run many times a day on protected branches; bind administrators too, because a rule they can skip is a standing exception. The gates belong in the definition of done, so agile delivery doesn't conflict.

No closure counts unless it carries its proof. And only the authorizing official decides when a change is significant enough to reopen the authorization; that threshold lives in the continuous monitoring strategy, and Gate 2 applies it.`,
  "Book 18, Chapter 07 (Standards and patterns; Four gates; Git and pipeline practice; What SBOMs are for, after M-26-05; How the gates become evidence; Responsibility matrix: decide whether a change is significant).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "A reference implementation that states its limits");
  tag(s, "How");
  figure(s, "ch08-reference-implementation", 0.6, 4.9);
  sideBox(s, "Proved", "FaClipboardCheck", HEX.amber, HEX.amberTint, "What its tests prove, October 28, 2026", [
    "Verified: service and migration on real PostgreSQL",
    "Verified: the contract matches the code, both ways",
    "Verified: guardrails hold against a scripted stub",
    "Not verified: real DB2 or Oracle, or a real model",
    "Not verified: the containers; it has no sign-in",
  ], { x: 5.75, w: 7.0 });
  takeaway(s, "FaLightbulb", HEX.amber, "Illustrative, not production.  ",
    "Teams that start from a pattern inherit its review, but this one has never run against a real DB2 or Oracle database, a real model, or production.");
  sources(s, "Sources: Maven Central (Spring Boot 4.1.2); PostgreSQL versioning (18.6); npm registry (React 19.3.1); RFC 9457; Zonky embedded-postgres. Book 18, Chapter 08.");
  narrate(s,
`Arguments about architecture are cheap; code that runs isn't. The workbook ships a small reference implementation beside the book: a case-management service with a front end, a legacy database it was moved from, and an AI agent that helps triage cases.

It shows each pattern in code. A Spring Boot service over PostgreSQL that owns its schema, with an OpenAPI contract a test checks against the code in both directions. A React front end with pending proposals to approve or reject. A migration tool that reads a synthetic DB2-style or Oracle schema, stops on any value it can't map rather than guessing, and validates with row counts, a checksum and independent aggregates. Its tests break things on purpose: change one amount and two checks fail; truncate a name and only the checksum catches it. And an agent with an identity and sponsor the service won't start without, a tool allow-list, a five-step limit and one write path: pending proposals.

Verified on October 28, 2026: the service and migration tests pass against real PostgreSQL 18.6, the contract test passes, and the guardrails hold against the stub and scripted misbehaving replies. Not verified: real DB2 or Oracle, since H2's compatibility modes stood in; a real model; the containers. It has no authentication and only synthetic data.

Copy the pattern, not the claim.`,
  "Book 18, Chapter 08 — The Reference Implementation (What is in it; The service and its contract; The migration tool and its three checks; The agent and its guardrails; What was verified, and what wasn't); Chapter 07 (Standards and patterns: reference patterns).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "TOGAF is the order; Zachman is the checklist");
  tag(s, "How");
  figure(s, "ch09-adm-map", 0.6, 3.0);
  sideBox(s, "Require", "FaLandmark", HEX.navy, HEX.navyTint, "What federal policy requires", [
    "A-130: baseline, target, transition plan",
    "SP 800-53 PM-7 and PL-8",
    "No framework named; FEAF v2 is historical",
    "Triage, architecture and waves: the triad",
  ], { x: 3.8, w: 4.4, minH: 3.2 });
  sideBox(s, "Use", "FaSitemap", HEX.teal, HEX.tealTint, "Using the mappings", [
    "File the artifacts; don't redo them",
    "Zachman finds gaps; an empty cell is a question",
    "TOGAF's Phase H is the re-triage",
    "No framework buys compliance",
  ], { x: 8.35, w: 4.4, minH: 3.2 });
  takeaway(s, "FaBook", HEX.navy, "The requirement is the architecture, not the framework.  ",
    "Answer the assessor with the baseline, target and transition plan the book already produces, filed under the phase and cell the architecture office knows.");
  sources(s, "Sources: OMB Circular A-130 §5.a(2); SP 800-53 PM-7, PL-8; The Open Group, TOGAF Standard, 10th Ed.; Zachman Framework 3.0; FEAF v2 (archived). Book 18, Chapter 09.");
  narrate(s,
`Many agencies' enterprise architecture offices speak TOGAF or Zachman. The book maps its work onto both.

What's required: A-130 asks for an enterprise architecture with a baseline, a target and a transition plan, security and privacy built in, and names no framework. SP 800-53 carries it as PM-7 for the enterprise and PL-8 for each system. FEAF version 2, from 2013, is historical background on an archived page.

The current TOGAF Standard is the 10th Edition from The Open Group, announced April 2022, with a corrigendum applied in May 2025. Its Architecture Development Method is a cycle of phases around requirements management. The figure files each chapter under a phase: the portfolio argument is the vision; triage is business architecture and the choice of options; architecture, data and AI are information systems and technology; gates and validation are implementation governance; and re-triage is Phase H, which starts the next cycle.

Zachman's Framework, version 3.0, is a six-by-six grid of interrogatives and perspectives, explicitly not a methodology; it's the checklist. Read by column it shows the book's gaps: little on locations above the engineer row, and little on application timing such as batch windows, which belongs in design review.

File the artifacts, don't redo them; treat an empty cell as a question; and don't buy compliance with a framework. These mappings are the program's reading, unreviewed by either publisher.`,
  "Book 18, Chapter 09 — Mapping the Work to TOGAF and Zachman (What federal policy requires; The TOGAF Standard today; The Zachman Framework today; Mapping the chapters and artifacts; Using the mappings; Key takeaways).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Run the portfolio in waves on the program's gates");
  tag(s, "How");
  figure(s, "ch10-waves", 0.6, 2.5);
  sideBox(s, "Waves", "FaRoute", HEX.amber, HEX.amberTint, "Three kinds of wave", [
    "Pilot: a few simple apps plus one hard case",
    "Factory waves: move groups by shared database",
    "Plan five waves ahead; detail only the next",
    "Long tail: an owner, a reason, a review date",
  ], { x: 3.3, w: 4.65, minH: 3.25 });
  sideBox(s, "Factory", "FaUsersGear", HEX.navy, HEX.navyTint, "The modernization factory", [
    "Platform, patterns, pipelines, data tooling",
    "Runbooks and a small portfolio team",
    "Waves sized by measured throughput",
    "Wave five costs less per app than wave one",
  ], { x: 8.1, w: 4.65, minH: 3.25 });
  decision(s, "Run a pilot wave of three to five simple applications plus one representative hard case, and size later waves by measured throughput",
    "Steward and executive sponsor clear G2", "Phase 2, at gate G2");
  sources(s, "Sources: AWS Prescriptive Guidance (wave planning; large-migration phases); Microsoft CAF (wave planning; plan your migration). Book 18, Chapter 10.");
  narrate(s,
`A disposition for every application is a list, not a plan. Waves solve both: each batch moves through the same steps and leaves the next a little cheaper.

The portfolio runs inside the program's existing phases and gates, G0 to G5. Phase 0: inventory and triage. Phase 1: build the factory and stand up the gates. Phase 2: the pilot. Phase 3: factory waves, extended as long as the portfolio needs. Phase 4: decommission what the waves replaced, including DB2 and Oracle instances and licenses. Before G5, no production application may still authenticate against Active Directory. Phase 6: the long tail and re-triage. Gate authorities don't change; the evidence each gate reads does.

AWS and Microsoft agree: start small and fail fast, but put one or two complex, representative workloads in early waves. So the pilot is three to five simple applications plus one hard case with a DB2 or Oracle database and a real interface contract. Group by what must move together, above all a shared database. Plan four to five waves ahead, only the next in detail.

The factory is the platform, patterns, pipelines, data tooling, runbooks and a small portfolio team; it works if the fifth wave costs less per application than the first. The classic failures: a pilot that's too easy, waves sized by the schedule, and nothing actually retired.

The steward and executive sponsor clear G2.`,
  "Book 18, Chapter 10 — Running the Portfolio in Waves (The portfolio on the program's phases; Planning waves; Three kinds of wave; The modernization factory; Where wave programs go wrong).");
}

// ------------------------------------------------------------------ How 4
{
  const s = content(S_HOW, "Fund by wave, and measure from records");
  tag(s, "How");
  const metrics = [
    ["Applications dispositioned", "Triage record", "Sponsor, CIO"],
    ["Applications retired", "Retirement records", "Sponsor, CFO"],
    ["Applications modernized", "Gate records", "Steering committee"],
    ["First-run validations", "Validation reports", "Data lead, steward"],
    ["O&M cost avoided", "Budget data", "Sponsor, CFO, TMF"],
    ["Time to authorization", "Gate and ATO records", "CISO, AO"],
    ["Long-tail health", "Triage record", "Steward"],
  ];
  leftTable(s, ["Metric", "Source", "Read by"], metrics.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]),
    [2.6, 2.3, 2.0], [0.38, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4], 12);
  sideBox(s, "Fund", "FaBuildingColumns", HEX.teal, HEX.tealTint, "Paying for the waves", [
    "TMF: improve, retire or replace; usually under $25M",
    "Five-year repayment; results within 12 months",
    "Working capital funds: savings pay the next wave",
    "Cost avoided counts once the old system is off",
  ]);
  decision(s, "Sign the wave plan, fund it wave by wave, and re-score the whole portfolio every year in step with the budget cycle",
    "CIO", "Each budget cycle");
  sources(s, "Sources: TMF fit, process and 2026 call; MGT Act (Pub. L. 115-91 §1077); 40 U.S.C. §11312; OMB M-26-10; DORA metrics. Book 18, Chapters 02 and 10.");
  narrate(s,
`Waves are also a funding structure: each a request small enough to approve, with results soon enough to show.

The Technology Modernization Fund funds proposals that improve, retire or replace existing systems. Competitive projects are typically under $25 million, on a five-year repayment timeline, with measurable outcomes ideally within 12 months, and money is released in stages at milestones. The 2026 call kept legacy modernization as a priority, with initial proposals due October 20, 2026. A wave plan fits: fund the pilot and first factory waves, with milestones that match the gates.

The MGT Act lets CFO Act agencies set up IT working capital funds to improve, retire or replace systems and repay TMF transfers. Deposits stay available three years, the fund can't supplant operations and maintenance money, and cost-savings activities the CIO approves come first. So one wave's retirement savings can pay for the next.

Waves still go through capital planning, and OMB M-26-10 restates that the CIO advises on whether to continue, modify or terminate IT programs; a disposition is that advice made specific, which is why the CIO should sign the wave plan.

The table's metrics are reported at the monthly gate review, each from a record. Report cost avoided only from retirement records.

Re-score on triggers, such as end of support, an incident, or a cost or mission change, and re-score the whole portfolio yearly with the budget cycle.`,
  "Book 18, Chapter 10 (Metrics; Funding; Keeping the triage current; Where wave programs go wrong, item 3); Chapter 02 (Where capital planning and the TMF fit).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Approve no proposal that waits on a single cut-over", "CIO", "Before any contract"],
    ["Start with the inventory: an owner and a disposition for each", "Steward; sponsor and CIO", "Phase 0, gate G0"],
    ["Agree the rubric once; rule only on the contested cases", "Leadership; app owners sign", "Before scoring"],
    ["One target stack, with platform upgrades budgeted", "Chief architect; CIO", "Before first refactor"],
    ["Every refactor names its façade and when rollback ends", "Chief architect or delegate", "Gate 2"],
    ["Three validation results before every cut-over", "App owner and the AO", "Before cut-over"],
    ["No dual writes; settle each engine before dates", "Chief architect", "Before the wave plan"],
    ["Agents propose, never write; every agent has a sponsor", "Chief architect", "Before the first agent"],
    ["Unsupported software is a finding with a plan and a date", "App owner; the AO accepts", "Triage; review dates"],
    ["Privacy and records events go to design review", "Privacy and records officials", "Gate 2"],
    ["Charter the board; one decider per decision", "CIO", "Phase 1"],
    ["Set when a change reopens the authorization", "Authorizing official", "Before wave one"],
    ["Pilot with one hard case; size waves by throughput", "Steward and sponsor", "Phase 2, gate G2"],
    ["Fund retire and retain; sign the wave plan; re-score yearly", "CIO", "Each budget cycle"],
  ];
  const rh = [0.34, ...asks.map(() => 0.29)];
  asks.forEach((r) => r.forEach((c, j) => {
    const w = [6.6, 3.2, 2.35][j] - 0.2;
    if (linesFor(c.length, w, 11.5) > 1) console.warn(`  ! close table cell may wrap: ${c}`);
  }));
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts([6.6, 3.2, 2.35], { y: 1.45, w: 12.15, fontSize: 11.5, rowH: rh, margin: [0.03, 0.1, 0.03, 0.1] }));
  if (FIT) console.log(`    slide ${pres.slides.length} close table: bottom ${(1.45 + rh.reduce((a, b) => a + b, 0)).toFixed(2)} in`);
  T(s, "Close line", [{ text: "None of these is a rewrite.  ", options: { bold: true, color: HEX.amber } },
    { text: "Decide application by application, build the changed ones on one architecture, prove the data, govern the AI, and let the gates write the evidence." }],
    { x: 0.6, y: 6.0, w: 12.15, h: 0.56, fontSize: 14, valign: "middle", align: "center" });
  sources(s, "Sources: GAO-25-107795; OMB Circular A-130; SP 800-53 Rev. 5; OMB M-26-10; TMF; vendor docs (Oct 2026). Book 18, Chapters 01–10. Undated timings are design guidance.");
  narrate(s,
`So, the decisions, with their owners.

The CIO approves no proposal that delivers nothing until a single cut-over; charters the architecture review board and names its chair in Phase 1; and, each budget cycle, funds retire and retain and the decommissioning behind them, signs the wave plan and has the portfolio re-scored.

The steward runs the inventory in Phase 0, with an owner and a proposed disposition for every application. Leadership agrees the rubric once and rules only on contested and high-stakes cases; application owners sign each disposition.

The chief architect owns one target stack, with upgrades budgeted; asks every refactor at Gate 2 for its façade, first function, shared-data plan and rollback end; makes no dual writes a standard, with each engine settled before the wave plan commits dates; and makes no-write agents, a federal sponsor for every agent and one model interface design standards.

The application owner and the authorizing official see three validation results before every cut-over. A retained application on unsupported software is a finding with a plan, a risk acceptance and a review date. The privacy and records officials hear about the named events at design review. The authorizing official sets, before the first wave, when a change reopens the authorization. And the steward and sponsor run a pilot with one hard case, sizing later waves by throughput.

None of these is a rewrite. Book 18 has the detail, with every claim footnoted. Thank you.`,
  "Book 18, Chapter 01 (What leadership should take from this); Chapter 02 (What leadership should take from this); Chapters 03–06 (What leadership should take from this); Chapter 07 (Responsibility matrix; Key takeaways); Chapter 10 (Key takeaways; closing line).");
}

// ------------------------------------------------------------------ Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: federal policy, GAO and NIST");
  const src = [
    "GAO-19-471, Agencies Need to Develop Modernization Plans for Critical Legacy Systems (June 11, 2019).  ·  GAO-25-107795, Agencies Need to Plan for Modernizing Critical Decades-Old Legacy Systems (July 17, 2025), and its product page (status as of February 2026).",
    "OMB Circular A-130 (2016 revision), §5 and Appendices I and II.  ·  FAR 39.103, modular contracting (FAC 2026-01).  ·  40 U.S.C. §11312.  ·  Modernizing Government Technology Act, Pub. L. 115-91 §1077.  ·  Evidence Act, Pub. L. 115-435.",
    "OMB M-25-05 (January 15, 2025); M-25-21 and M-25-22 (April 3, 2025); M-26-05 (January 23, 2026); M-26-10 (March 31, 2026).  ·  Technology Modernization Fund: agency and project fit; process; 2026 call for proposals.",
    "NIST FIPS 199; SP 800-53 Rev. 5, release 5.2.0, and SP 800-53B; SP 800-218 (SSDF 1.1) and its Rev. 1 draft; SP 800-218A; SP 800-204 and 800-204A to D; SP 800-190; NIST AI 600-1.",
    "CISA, Careful Adoption of Agentic AI Services (May 1, 2026); 2026 Minimum Elements for a Software Bill of Materials (July 29, 2026).  ·  OWASP Top 10 for LLM Applications (2025) and for Agentic Applications (2026).  ·  FEAF v2 (archived, January 29, 2013).",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: frameworks, products and patterns");
  const src = [
    "AWS Prescriptive Guidance: migration strategies; large-migration portfolio playbook (wave planning); phases of a large migration.  ·  Microsoft Cloud Adoption Framework: migration strategies, wave planning, plan your migration; the 6 Rs of application modernization.  ·  Gartner's five options, as reported (2011).",
    "OpenJDK; Microsoft Build of OpenJDK roadmap; Spring Boot generations and system requirements; Spring AI 2.0.2; React versions; Node.js releases; OpenAPI 3.2.1; OCI specifications; Kubernetes releases; The Twelve-Factor App; PostgreSQL versioning (all as of October 28, 2026).",
    "Oracle SQL Language Reference 23ai; PostgreSQL 18 documentation; AWS SCT, DMS Schema Conversion, DMS validation and CDC; Microsoft SSMA for Db2 and for Oracle; Ora2Pg.  ·  Azure Architecture Center: Strangler Fig, Backends for Frontends, Transactional Outbox, Scheduler Agent Supervisor.  ·  M. Fowler, Strangler Fig (2024).",
    "Model Context Protocol specification 2026-07-28; GitHub Copilot modernization and AWS Transform (examples only).  ·  M. Nygard, Documenting Architecture Decisions (2011); DORA; GitHub protected branches; SLSA 1.2.  ·  The Open Group, TOGAF Standard, 10th Edition; Zachman Framework 3.0.",
    "Full footnotes with links and access dates (October 28–29, 2026): Book 18, every chapter (whalermike.github.io/modernization-workbook/docs/books/b18-application-modernization/).",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}

// ---------------------------------------------------------------- narration.json must match the narrated slides
{
  const NARR = JSON.parse(fs.readFileSync(path.join(__dirname, "narration.json"), "utf8"));
  const narrated = titles.slice(0, titles.indexOf("Backup"));
  if (NARR.length !== narrated.length) console.warn(`  ! narration.json has ${NARR.length} entries for ${narrated.length} narrated slides`);
  let said = 0;
  const per = NARR.map((e, i) => {
    if (e.slide !== i + 1) console.warn(`  ! narration.json entry ${i} is numbered ${e.slide}`);
    if (e.title !== narrated[i]) console.warn(`  ! narration.json slide ${i + 1} title ${JSON.stringify(e.title)} doesn't match ${JSON.stringify(narrated[i])}`);
    const n = e.say.split(/\s+/).filter(Boolean).length; said += n; return n;
  });
  console.log(`narration.json: ${said} words (${per.join(", ")}), about ${mmss((said * 60) / 160)} at 160 wpm`);
}

console.log(`notes: ${spoken} spoken words (${perSlide.join(", ")}), about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
