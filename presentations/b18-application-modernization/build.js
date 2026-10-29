// Book 18 — Application Modernization: the 15-minute Why / What / Who / How deck.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node presentations/b18-application-modernization/build.js presentations/b18-application-modernization/B18_Application_Modernization.pptx
// Every fact comes from a footnoted chapter of docs/books/b18-application-modernization/, named in the notes. The
// dispositions, rubric, gates, waves and factory are the book's program design and are labeled as such; product
// versions and tool facts are dated observations (October 28–29, 2026).
// Diagrams are the committed PNGs in docs/images/diagrams/b18-application-modernization/png/; alt text is read from
// the chapters' fig-alt so it stays in step with the book. The spoken narration lives in narration.json; the speaker
// notes carry the fuller detail for a live delivery. FIT=1 prints the estimated bottom of every text box.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 18", title: "Application Modernization" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B18_Application_Modernization.pptx";

// Speaker notes with a timing cue worked out from the spoken words at about 142 words a minute,
// so the cues stay right when a slide's notes are edited. The "Workbook:" line isn't spoken.
const WPM = 142;
let clock = 0, spoken = 0;
const mmss = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const perSlide = [];
const narrate = (s, body, ref) => {
  if (!/^Book 18, Chapters? \d\d/.test(ref)) console.warn(`  ! slide ${pres.slides.length} Workbook line doesn't start "Book 18, Chapter NN": ${ref}`);
  const words = body.split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (words * 60) / WPM;
  spoken += words;
  perSlide.push(words);
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};

// ---------------------------------------------------------------- checks (print "!" on a likely problem)
// Titles stay at or under 58 characters and are unique; Sources lines stay at or under 170 characters.
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) console.warn(`  ! title over 58 characters (${t.length}): ${t}`);
  if (titles.includes(t)) console.warn(`  ! duplicate title: ${t}`);
  titles.push(t);
  return t;
};
const content = (sec, t) => D.content(sec, checkTitle(t));
const titleSlide = (sec, t, sub) => D.titleSlide(sec, checkTitle(t), sub);
// A conservative text-fit estimate (Calibri at about 0.55 em per character).
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
  if (process.env.FIT) console.log(`  slide ${pres.slides.length} ${name}: needs ${need.toFixed(2)} of ${o.h.toFixed(2)} in; text bottom ${(o.y + need).toFixed(2)}, box bottom ${(o.y + o.h).toFixed(2)}`);
  return txt(s, name, t, o);
};
const sources = (s, text) => {
  if (text.length > 170) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y: 6.62, w: 11.4, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};
// The full-width bottom callout, with a fit check on its text.
const callout = (s, name, y, h, iconName, color, label, text) => {
  box(s, name, 0.6, y, 12.15, h, "FFFFFF", color);
  icon(s, iconName, 0.85, y + (h - 0.8) / 2, 0.8, color);
  T(s, `${name} text`, [{ text: label, options: { bold: true, color } }, { text }],
    { x: 1.9, y: y + 0.05, w: 10.65, h: h - 0.1, fontSize: 16.5, valign: "middle" });
};
// A table with a navy header row; warns when a cell's text won't fit its row.
const table = (s, header, body, colW, rowH, o = {}) => {
  const pt = o.fontSize || 12.5;
  [header, ...body.map((r) => r.map((c) => (typeof c === "string" ? c : c.text)))].forEach((r, i) => r.forEach((t, j) => {
    const need = linesFor(t.length, colW[j] - 0.2, pt) * lineH(pt) + 0.1;
    if (need > rowH[i] + 0.02) console.warn(`  ! slide ${pres.slides.length} table row ${i} col ${j} may wrap past its height (${need.toFixed(2)} > ${rowH[i]})`);
  }));
  const y = o.y || 1.5, bottom = y + rowH.reduce((a, b) => a + b, 0);
  if (process.env.FIT) console.log(`  slide ${pres.slides.length} table: bottom ${bottom.toFixed(2)} in`);
  return s.addTable([head(header), ...body], tableOpts(colW, { x: o.x || 0.6, y, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

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
  if (process.env.FIT) console.log(`  slide ${pres.slides.length} figure ${name}: ${w.toFixed(2)} x ${h.toFixed(2)} in, bottom ${(y0 + (H + h) / 2).toFixed(2)}`);
  return { w, h };
};

// ---------------------------------------------------------------- layout helpers
// A labeled list of tinted rows down the left half of the slide.
const rows = (s, prefix, label, list, top, step, h, size) => {
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.55, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, 6.2, h, i % 2 ? HEX.navyTint : HEX.grey);
    T(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: 5.9, h, fontSize: size || 14, valign: "middle" });
  });
};
// A tinted box with an icon, a small label, a heading and a bullet list.
const panel = (s, prefix, o) => {
  const { x, y, w, h, iconName, color, tint, label, heading, list } = o;
  const size = o.size || 14;
  box(s, `${prefix} box`, x, y, w, h, tint);
  icon(s, iconName, x + 0.25, y + 0.2, 0.68, color);
  T(s, `${prefix} head`, [
    ...(label ? [{ text: label, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } }] : []),
    { text: heading, options: { bold: true, color, fontSize: 17, fontFace: "Cambria" } },
  ], { x: x + 1.12, y: y + 0.15, w: w - 1.25, h: 0.8, valign: "middle", fontSize: 17 });
  T(s, `${prefix} list`, bullets(list, size), { x: x + 0.25, y: y + 1.05, w: w - 0.4, h: h - 1.12, paraSpaceAfter: 6, fontSize: size });
};
// A row of step boxes across the slide (numbered unless labels are given).
const steps = (s, prefix, list, tints, labels, labelColor, size) => {
  const n = list.length, gap = 0.125, w = (12.15 - gap * (n - 1)) / n;
  list.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i + 1}`, x, 1.5, w, 1.35, tints[i]);
    T(s, `${prefix} ${i + 1} text`, [
      { text: labels ? labels[i] : `${i + 1}`, options: { bold: true, color: labelColor ? labelColor[i] : HEX.amber, fontSize: 18, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: size || 14, breakLine: !!f[1] } },
      ...(f[1] ? [{ text: f[1], options: { fontSize: 12 } }] : []),
    ], { x: x + 0.12, y: 1.55, w: w - 0.24, h: 1.25, valign: "middle", fontSize: size || 14 });
  });
};
// Two tinted panels side by side under the step row.
const panels = (s, list, size) => list.forEach((p, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Panel ${i + 1}`, x, 3.0, 6.0, 2.1, p[3]);
  icon(s, p[0], x + 0.2, 3.08, 0.56, p[2]);
  T(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 3.08, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  T(s, `Panel text ${i + 1}`, bullets(p[4], size || 13), { x: x + 0.25, y: 3.7, w: 5.6, h: 1.36, paraSpaceAfter: 2, fontSize: size || 13 });
});
// Two tall tinted columns, each with an icon, a small label, a heading and a bullet list.
const columns = (s, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Column ${i + 1}`, x, 1.5, 6.0, 3.6, c[3]);
  icon(s, c[0], x + 0.25, 1.68, 0.68, c[2]);
  T(s, `Column head ${i + 1}`, [
    { text: c[1], options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: c[4], options: { bold: true, color: c[2], fontSize: 18, fontFace: "Cambria" } },
  ], { x: x + 1.12, y: 1.66, w: 4.75, h: 0.75, valign: "middle", fontSize: 18 });
  T(s, `Column text ${i + 1}`, bullets(c[5], size || 14), { x: x + 0.3, y: 2.6, w: 5.45, h: 2.4, paraSpaceAfter: 6, fontSize: size || 14 });
});
// Three tinted cards across the slide, each with an icon, a small label, a heading and a bullet list.
const cards3 = (s, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 4.1;
  box(s, `Card ${i + 1}`, x, 1.5, 3.95, 3.6, c[3]);
  icon(s, c[0], x + 0.22, 1.66, 0.62, c[2]);
  T(s, `Card head ${i + 1}`, [
    { text: c[1], options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: c[4], options: { bold: true, color: c[2], fontSize: 17, fontFace: "Cambria" } },
  ], { x: x + 1.0, y: 1.62, w: 2.85, h: 0.8, valign: "middle", fontSize: 17 });
  T(s, `Card text ${i + 1}`, bullets(c[5], size || 13.5), { x: x + 0.25, y: 2.55, w: 3.5, h: 2.45, paraSpaceAfter: 6, fontSize: size || 13.5 });
});

const S_WHY = "Why a portfolio, not a rewrite", S_WHAT = "What each application becomes",
  S_WHO = "Who governs the architecture", S_HOW = "How to run it at scale";

// ------------------------------------------------------------------ Title
{
  const s = titleSlide(S_WHY, "A Portfolio, Not a Rewrite", "Book 18 — Application Modernization");
  D.agenda(s, 0.8, 4.7, 6.6);
  T(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 15-minute briefing for CIOs, portfolio owners, enterprise and solution architects, data teams, ISSOs and authorizing officials", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.45, w: 9.6, h: 0.85, fontSize: 16 });
  narrate(s,
`This briefing comes from Book 18 of the Federal Modernization Workbook, Application Modernization. It's written for CIOs and portfolio owners, enterprise and solution architects, database and data teams, AI and application teams, ISSOs, privacy officers and authorizing officials.

I'll take four questions: why application modernization is a portfolio decision and not a rewrite; what each application should become, and what the changed ones are built on; who governs the architecture; and how to run it at scale, in waves.

The short version: decide application by application, build the changed ones on one architecture, prove the data moved, give every AI agent an owner, and let the review gates write the compliance evidence. The rubric, the gates and the waves are the book's program design, not federal requirements, and product versions are as of October 28, 2026.`,
  "Book 18, Chapter 01 — A Portfolio, Not a Rewrite (The book's argument); index (Why, what, who, how; Reading paths); Chapter 10 (closing line).");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "Most IT money keeps existing systems running");
  tag(s, "Why");
  table(s, ["", "GAO-19-471 (June 2019)", "GAO-25-107795 (July 2025)"], [
    [bold("Systems reviewed"), "65, from 24 agencies", "69"],
    [bold("Most in need of modernization"), "10, at 10 agencies", "11, at 10 agencies"],
    [bold("Age of those systems"), "8 to 51 years", "About 23 to 60 years"],
    [bold("Modernization plans"), "8 of 10 agencies lacked complete plans", "3 of 11 had all key elements; 2 had none"],
    [bold("Federal IT spending"), "More than $90 billion planned, FY 2019", "About $83 billion (79%) planned for O&M, FY 2025"],
  ], [1.9, 2.5, 2.6], [0.42, 0.55, 0.55, 0.55, 0.62, 0.78], { fontSize: 12.5 });
  panel(s, "Eleven", { x: 7.75, y: 1.5, w: 5.0, h: 3.55, iconName: "FaTriangleExclamation", color: HEX.red, tint: HEX.redTint,
    label: "THE 11 CRITICAL SYSTEMS, 2025", heading: "About $754 million a year", size: 13.5, list: [
      "8 use outdated languages such as COBOL and assembly",
      "4 have unsupported hardware or software",
      "7 have vulnerabilities only modernization can fix",
      "Of 2019's 10, three modernized by February 2025",
    ] });
  callout(s, "Plan", 5.3, 1.2, "FaListCheck", HEX.red, "The gap GAO keeps finding is planning, not technology: ",
    "milestones, the work to modernize and a disposition for the legacy system, all decided per system. And 11 systems are a sliver of $83 billion: most of the cost sits in ordinary applications.");
  sources(s, "Sources: GAO-25-107795 (July 17, 2025) and product page (status as of February 2026); GAO-19-471 (June 11, 2019). Book 18, Chapter 01.");
  narrate(s,
`Most of what federal agencies spend on IT keeps existing systems running. GAO's July 2025 review puts federal IT and cyber spending at more than 100 billion dollars a year. For fiscal 2025, the 24 CFO Act agencies planned about 83 billion dollars, 79 percent, for operations and maintenance. GAO's 2019 review gave the same "about 80 percent". The share has hardly moved in six years.

GAO ranked the most critical legacy systems both times. The 2025 list has 11 systems, about 23 to 60 years old, costing about 754 million dollars a year to run. Eight use languages such as COBOL and assembly, and seven carry vulnerabilities that can't be fixed without modernization. Only three of the eleven had plans with all of GAO's key elements.

Two lessons. The gap is planning, not technology: GAO's key elements are milestones, the work to modernize, and a disposition for the legacy system, all decided per system. And eleven systems are a small share of 83 billion; the bulk sits in thousands of ordinary applications. GAO also notes the full extent of federal legacy IT is unknown.`,
  "Book 18, Chapter 01 — A Portfolio, Not a Rewrite (opening; The scale of the problem; Honest limits).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "Big rewrites fail, and policy asks for segments");
  tag(s, "Why");
  rows(s, "Fail", "WHY BIG-BANG REWRITES FAIL", [
    ["Value comes last", "Nothing ships until cut-over; users wait years"],
    ["The old system is the spec", "Requirements hide in code, data and workarounds"],
    ["One risky cut-over", "One high-stakes switch, no easy way back"],
    ["The world moves", "A decade-long build ships decade-old choices"],
  ], 1.95, 0.8, 0.7, 14);
  panel(s, "Policy", { x: 7.1, y: 1.55, w: 5.65, h: 3.55, iconName: "FaLandmark", color: HEX.red, tint: HEX.redTint,
    label: "WHAT FEDERAL POLICY ASKS", heading: "Useful segments that stand alone", size: 14, list: [
      "A-130: narrow scope, brief duration for major IT",
      "Modular contracts within 180 days; IT within 18 months",
      "FAR 39.103: each increment a workable system",
      "A-130: a disposition for every system in the EA",
    ] });
  callout(s, "Unit", 5.35, 1.15, "FaCubes", HEX.red, "The unit of decision is the application: ",
    "it has a mission owner, a data set, a code base, dependencies and an authorization boundary. A program is too coarse, and a platform treats a hundred applications as one.");
  sources(s, "Sources: GAO-25-107795; Martin Fowler, “Strangler Fig” (2024); OMB Circular A-130 §5.a and §5.d; FAR 48 CFR 39.103 (FAC 2026-01). Book 18, Chapter 01.");
  narrate(s,
`The intuitive answer to an aging portfolio is a replacement program: design the new system, build it, switch over. GAO's work keeps finding such efforts running for years, restarted or abandoned, some taking more than a decade partly because they weren't split into manageable segments.

The reasons are structural. Value arrives only at the end. The real specification is the old system, its code, its data and its users' workarounds. Risk is concentrated in one cut-over. And the world moves while the build runs.

Federal policy already points the other way. Circular A-130 asks agencies to structure major IT acquisitions into useful segments with a narrow scope and brief duration, and expects IT delivered within 18 months. The FAR asks for increments that each deliver a workable system. A-130 also wants a disposition for each system in the enterprise architecture.

So the unit of decision is the application: it has an owner, data, code, dependencies and an authorization boundary to decide about.`,
  "Book 18, Chapter 01 — A Portfolio, Not a Rewrite (Why big-bang rewrites fail; The unit of decision is the application).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "Triage every application into one of six");
  tag(s, "What");
  figure(s, "ch02-value-health-grid", 0.6, 6.3, 3.6);
  panel(s, "Rules", { x: 7.1, y: 1.5, w: 5.65, h: 3.6, iconName: "FaFilter", color: HEX.navy, tint: HEX.navyTint,
    label: "THE DECISION TABLE (PROGRAM DESIGN)", heading: "First matching rule wins", size: 13, list: [
      "Low value, or a service already does it: retire",
      "Healthy, no platform exit: retain, with a date",
      "Healthy, platform being exited: rehost",
      "Code sound, platform unsupported: replatform",
      "Code is the problem: refactor, or rebuild in increments",
      "High-impact or contested: deep study first",
    ] });
  callout(s, "Score", 5.3, 1.2, "FaTableList", HEX.navy, "Score from data; study only the exceptions: ",
    "six criteria scored 1 to 5 from data the agency already holds, such as FIPS 199 impact and support dates. Owners confirm or contest, and the rubric is first calibrated on 30 to 50 known applications.");
  sources(s, "Sources: OMB Circular A-130; NIST FIPS 199; GAO-25-107795; AWS 7 Rs; Microsoft Cloud Adoption Framework and 6 Rs guidance; 40 U.S.C. §11312. Book 18, Chapter 02.");
  narrate(s,
`In a portfolio of thousands, triage can't be a three-month study per application. It has to be a rubric applied to data, with judgment kept for the exceptions.

The book uses six dispositions, in rising order of cost and risk: retire, retain, rehost, replatform, refactor and rebuild. They line up with Gartner's five options, AWS's seven Rs and Microsoft's lists; replacing an application with a commercial or shared service counts as retiring it. Every application gets the cheapest disposition that meets its mission need.

Six criteria are scored from data the agency mostly holds already: mission criticality, technical condition, data sensitivity, cost, skills and dependencies. FIPS 199 impact levels do a lot of the first pass. The scores combine into two axes, mission value and technical health, and a decision table proposes the disposition. Owners confirm or contest it in a fixed window. Most applications are decided by the first four rules; deep study goes only to high-impact refactors and rebuilds, and to contested cases. Retire and retain are decisions, not projects, and that's where most early savings are.`,
  "Book 18, Chapter 02 — Triaging the Portfolio (The six dispositions; Where the names come from; The six triage criteria; A scored rubric, not a study per application; Calibrating the rubric; Honest limits).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "One target architecture, replaced piece by piece");
  tag(s, "What");
  table(s, ["Layer", "Program's choice", "As of October 28, 2026"], [
    [bold("Services"), "Java LTS with Spring Boot", "Java 25 is LTS; Spring Boot 4.1 current"],
    [bold("Front ends"), "React, kept thin", "React 19.3 (September 2026)"],
    [bold("Thin layers"), "Node.js, LTS releases only", "Node.js 26 enters LTS October 28"],
    [bold("Contracts"), "OpenAPI, written first", "OpenAPI 3.2.1 (September 2026)"],
    [bold("Platform"), "OCI images on Kubernetes", "Kubernetes 1.37 the newest minor"],
    [bold("Data"), "PostgreSQL or SQL Server", "Chapter 04"],
  ], [1.4, 2.6, 2.9], [0.4, 0.55, 0.55, 0.55, 0.55, 0.55, 0.45], { fontSize: 12.5 });
  panel(s, "Fig", { x: 7.75, y: 1.5, w: 5.0, h: 3.6, iconName: "FaRightLeft", color: HEX.navy, tint: HEX.navyTint,
    label: "REFACTOR WITH THE STRANGLER FIG", heading: "Replace it piece by piece", size: 13.5, list: [
      "A façade routes each request to legacy or new",
      "Functions move one at a time, same contract",
      "An anti-corruption layer translates between them",
      "Rollback holds until the legacy objects go",
    ] });
  callout(s, "Cadence", 5.3, 1.2, "FaArrowsRotate", HEX.navy, "Fund the upgrade cadence: ",
    "recent Spring Boot generations get about thirteen months of open-source support, and 4.0's ends December 31, 2026. The stack is the program's design: no federal rule names a language, and an agency can substitute its own list.");
  sources(s, "Sources: OpenJDK; Spring Boot generations and requirements; React; Node.js schedule; OpenAPI 3.2.1; OCI; Kubernetes; Azure Architecture Center. Book 18, Chapter 03.");
  narrate(s,
`If every refactor picks its own stack, the agency trades one legacy problem for many new ones. So the applications that change land on one target, and the platform team, the security team and the authorizing official review one pattern instead of hundreds.

The program's choices are mainstream, with long support windows and large labor pools: Java and Spring Boot for services, React for thin front ends, Node.js only for thin layers like a backend-for-frontend, OpenAPI contracts written before the code, and containers on Kubernetes. Java 25 is the current long-term support release, and Spring Boot 4.1 is current. These are design choices, not federal requirements.

Versions are a snapshot. Recent Spring Boot generations get about thirteen months of open-source support, so the platform needs a funded upgrade cadence, or the modernized portfolio becomes the next legacy one.

A refactor happens through the strangler fig. A façade routes each request to the legacy application or a new service, functions move one at a time behind the same contract, and rollback stays possible until the legacy objects are removed.`,
  "Book 18, Chapter 03 — The Target Reference Architecture (The layers and the choices; Services: Java and Spring Boot; Node.js where it fits; API-first with OpenAPI; Replacing incrementally: the strangler fig; Honest limits; What leadership should take from this).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "Move the data once, and prove nothing was lost");
  tag(s, "What");
  figure(s, "ch04-convert-move-prove", 0.6, 4.3, 3.6);
  table(s, ["Check", "What it catches", "What it can miss"], [
    [bold("Row counts per table"), "Missing or duplicated rows", "Rows that arrived with wrong values"],
    [bold("Checksum over canonical rows"), "Any changed value, in any order", "A wrong transform it shares"],
    [bold("Independent aggregates"), "Business totals that disagree", "Errors that cancel out"],
  ], [2.3, 2.6, 2.75], [0.4, 0.55, 0.55, 0.55], { x: 5.1, fontSize: 12.5 });
  box(s, "Traps box", 5.1, 3.72, 7.65, 1.4, HEX.navyTint);
  icon(s, "FaDatabase", 5.3, 3.98, 0.68, HEX.navy);
  T(s, "Traps text", [
    { text: "Where meaning changes silently", options: { bold: true, color: HEX.navy, fontSize: 16, fontFace: "Cambria", breakLine: true } },
    { text: "Oracle DATE mapped to a date-only type drops the time of day", options: { bullet: true, breakLine: true } },
    { text: "Sequences aren't gapless; advance them past the highest key", options: { bullet: true } },
  ], { x: 6.15, y: 3.8, w: 6.5, h: 1.25, fontSize: 13.5, valign: "middle" });
  callout(s, "Writer", 5.3, 1.2, "FaPlugCircleXmark", HEX.red, "One writer per table; never dual-write: ",
    "coexistence runs through change data capture or delta loads. Two writes don't share a transaction, so the stores drift. AWS DMS offers no change data capture for Db2 for z/OS as a source.");
  sources(s, "Sources: Oracle SQL Reference 23ai; PostgreSQL 18 docs; AWS DMS User Guide (validation, replication, Db2 for z/OS); Azure Architecture Center. Book 18, Chapter 04.");
  narrate(s,
`Code can be replaced a piece at a time. Data moves once, and the move isn't finished until someone can prove nothing was lost. A row that didn't arrive, or a date that lost its time of day, may not surface until a beneficiary's record is wrong months later.

So the move is three jobs, each with evidence: convert the schema, move the rows, prove the result. The dangerous conversions are the ones that succeed: Oracle's DATE type carries a time, and mapping it to a date-only type drops it silently.

The proof is three independent checks: row counts, a checksum over canonicalized rows, and aggregates the business recognizes, computed separately on each side. No single check is enough, because each shares an assumption with what it checks; a checksum taken after a wrong transform agrees perfectly, and both are wrong.

During coexistence, each table has one writer, and changes flow by change data capture or delta loads. Dual writes don't share a transaction, so the two stores drift. Pick the engine with the tools in view: only AWS's tools convert D B two to PostgreSQL.`,
  "Book 18, Chapter 04 — Moving the Data (opening; Choosing the target engine; Type mapping; The conversion tools, October 2026; Proving that nothing was lost; Coexistence without dual writes; What leadership should take from this).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "AI joins with an identity, an owner and no write power");
  tag(s, "What");
  figure(s, "ch05-agent-guardrails", 0.6, 4.5, 3.6);
  panel(s, "Fits", { x: 5.35, y: 1.5, w: 7.4, h: 3.6, iconName: "FaUserShield", color: HEX.navy, tint: HEX.navyTint,
    label: "FOUR PLACES AI FITS, BY WHAT EACH CAN CHANGE", heading: "A model is a component behind one interface", size: 14, list: [
      "Assistive feature: changes nothing; a person accepts or edits",
      "Retrieval: answers only with the caller's own permissions",
      "Code modernization help: a draft through review and tests",
      "Agent that calls tools: an allow-list, a step limit, an audit trail",
      "Changes to records: proposals a person approves",
    ] });
  callout(s, "Write", 5.3, 1.2, "FaLock", HEX.navy, "No agent writes to a system of record: ",
    "agents read and propose, people approve, services apply. Prompt injection has no fool-proof prevention, so the guardrails live outside the model: in the host and the systems behind each tool.");
  sources(s, "Sources: OWASP Top 10 for LLM Applications 2025 (LLM01, LLM06, LLM10); NIST AI 600-1; MCP specification 2026-07-28; OMB M-25-21, M-25-22. Book 18, Chapter 05.");
  narrate(s,
`Generative AI fits the architecture best when it's treated like any other component: a capability behind an interface, called by a service that owns the business rules, with its output checked rather than trusted. And an agent acts, so it needs what any actor needs: an identity, a human who answers for it, permissions limited to its job, and a record of what it did.

AI fits in four places, ordered by what each can change. An assistive feature or a retrieval answer changes nothing by itself. Code modernization help produces a draft that goes through review and tests. An agent that calls tools can act.

The design can't rely on the model refusing bad instructions; OWASP says there's no fool-proof prevention for prompt injection. So the guardrails sit outside the model: a tool allow-list, a step limit, an audit trail, and no write power. An agent that thinks a record should change files a proposal, and a person approves it.`,
  "Book 18, Chapter 05 — Generative and Agentic AI in the Architecture (opening; Where AI fits; One provider-neutral model interface; The guardrails an agent needs; Tool protocols: the Model Context Protocol; What leadership should take from this).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Compliance by design: the platform carries controls");
  tag(s, "What");
  cards3(s, [
    ["FaTriangleExclamation", "LEGACY IS A FINDING", HEX.red, HEX.redTint, "Unsupported means a plan", [
      "A-130: high priority to upgrade, replace or retire",
      "SA-22: Unsupported System Components",
      "Retained: compensating controls, a risk acceptance, a date",
    ]],
    ["FaShieldHalved", "SP 800-53 REV. 5 (5.2.0)", HEX.navy, HEX.navyTint, "Evidence from the work", [
      "SA, SR, AC, AU, CM, SC, SI and PT carry most weight",
      "Validation report: SI-7 integrity evidence",
      "Cut-over: a CM-3 change with a CM-4 analysis",
    ]],
    ["FaCodeBranch", "SECURE DEVELOPMENT", HEX.teal, HEX.tealTint, "The SSDF after M-26-05", [
      "M-26-05 rescinded the attestation memo, M-22-18",
      "The software inventory is still required",
      "SSDF 1.1 is final; version 1.2 is still a draft",
    ]],
  ], 13.5);
  callout(s, "Privacy", 5.3, 1.2, "FaFileShield", HEX.navy, "Bring privacy and records in at design review: ",
    "a new data store, a new data flow, an AI feature, production data in test, and retirement each reopen the privacy impact assessment or the records schedule.");
  sources(s, "Sources: OMB Circular A-130 and Appendices I–II; NIST SP 800-53 Rev. 5 (release 5.2.0); OMB M-26-05; NIST SP 800-218; OMB M-25-05. Book 18, Chapter 06.");
  narrate(s,
`Compliance usually arrives as a package assembled at the end. Modernization is the one moment that can change, because the agency is choosing the architecture and the pipeline anyway. A control the platform implements once is inherited by every application built on it, and a pipeline that keeps its results produces evidence without anyone collecting it. Circular A-130 asks for exactly that, across the system life cycle.

It also makes legacy a compliance matter: systems that can't be protected, including unsupported ones, get high priority for upgrade, replacement or retirement. So a retained application on unsupported software is an open finding until it has a plan.

Data migration evidence lands in the control catalog too: the validation report shows integrity, and the cut-over is a controlled change.

And privacy and records come in at design review, not at authorization. A new data store, a new flow, an AI feature, test data, or retirement each reopens their work.`,
  "Book 18, Chapter 06 — Compliance by Design (opening; Legacy as a compliance finding; The controls application work touches most; Secure development after M-26-05; Privacy as a design input; Records: from design to decommissioning).");
}

// ------------------------------------------------------------------ Who
{
  const s = content(S_WHO, "One owner per decision, four gates per change");
  tag(s, "Who");
  steps(s, "Gate", [["Disposition", "Triage record; the owner signs"], ["Design review", "Decision record, contract, threat model"], ["Pull request", "Independent review, tests, scans, SBOM"], ["Release", "Signed build, provenance, change record"]],
    [HEX.amberTint, HEX.amberTint, HEX.tealTint, HEX.tealTint], ["Gate 1", "Gate 2", "Gate 3", "Gate 4"], [HEX.amber, HEX.amber, HEX.teal, HEX.teal]);
  panels(s, [
    ["FaUsersGear", "One decider for each decision", HEX.teal, HEX.tealTint, [
      "Chief architect: standards, patterns, exceptions",
      "Application owner: the disposition",
      "Authorizing official alone: residual risk",
      "CIO: IT contracts and licenses",
    ]],
    ["FaCodeBranch", "Two meetings, two automated", HEX.navy, HEX.navyTint, [
      "Gates 1 and 2 need judgment, once per application",
      "Gates 3 and 4 run on protected branches and pipelines",
      "Every gate's output is kept as evidence",
    ]],
  ]);
  callout(s, "Board", 5.3, 1.2, "FaBuildingColumns", HEX.teal, "The review board reviews; it doesn't vote: ",
    "security and privacy representatives sit on it, as CM-3(4) asks. The authorizing official observes but isn't a member, and the board can recommend a technology but can't buy one.");
  sources(s, "Sources: OMB A-130 §5.a(2); NIST SP 800-53 Rev. 5 (CM-3, CM-4, PL-8, PM-7, SA-22); OMB M-26-10; NIST SP 800-218; Nygard (2011). Book 18, Chapter 07.");
  narrate(s,
`A target architecture holds across thousands of applications only if someone owns each decision and every change passes the same few gates. Governance here means three things: who decides, what every change has to pass, and what record each pass leaves.

No federal rule requires an architecture review board, but A-130 and NIST's controls require what one produces. In the program's design, the board reviews and doesn't vote. The chief architect decides standards, patterns and exceptions. The application owner decides the disposition. The authorizing official alone accepts residual risk, and the CIO approves what the agency buys.

There are four gates: disposition, design review, the pull request, and release. Two are meetings, because they need judgment once per application. Two are automation, because they run many times a day on protected branches and a pipeline that keeps its outputs. A program that runs the pull-request gate as a meeting will stall or stop running it. And every gate leaves evidence behind.`,
  "Book 18, Chapter 07 — Who Governs the Architecture (What federal policy asks for; The architecture review board; Four gates; Git and pipeline practice; How the gates become evidence; Responsibility matrix; Key takeaways).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "A reference implementation you can run");
  tag(s, "How");
  figure(s, "ch08-reference-implementation", 0.6, 5.0, 3.6);
  panel(s, "Tests", { x: 5.85, y: 1.5, w: 6.9, h: 3.6, iconName: "FaClipboardCheck", color: HEX.amber, tint: HEX.amberTint,
    label: "WHAT WAS VERIFIED, OCTOBER 28, 2026", heading: "Tested, and plain about what isn't", size: 13.5, list: [
      "25 service tests pass against real PostgreSQL 18.6",
      "A contract test checks the OpenAPI file both ways",
      "Migration tests break one value; the checks catch it",
      "Agent guardrails hold against a misbehaving stub",
      "Not verified: real DB2 or Oracle, a real model, containers",
    ] });
  callout(s, "Illus", 5.3, 1.2, "FaLightbulb", HEX.amber, "Illustrative, not production: ",
    "synthetic data and no authentication. It runs Spring Boot 4.1.2 and React 19.3.1, but compiles for Java 21 and uses OpenAPI 3.1, short of the Chapter 03 targets.");
  sources(s, "Sources: examples/app-modernization; Maven Central (Spring Boot 4.1.2); PostgreSQL versioning policy; npm (React 19.3.1); RFC 9457. Book 18, Chapter 08.");
  narrate(s,
`An architecture is easier to trust when it runs. So the workbook ships a small reference implementation beside the book: one mission application in miniature, a case-management service with a React front end, the legacy database it was moved from, and an AI agent that helps triage cases.

Each part shows a pattern from the earlier chapters. A test checks the service's A P I contract against the code in both directions. The migration tool proves every load three ways, and its tests break a value on purpose to show the checks catch it. The agent has an identity, a sponsor, an allow-list and a step limit, and can only file proposals a person approves.

It's honest about its limits. It's illustrative, not production code: synthetic data, no authentication. Its tests run against real PostgreSQL, but it hasn't been run against a real D B two or Oracle database, a real model, or in containers.`,
  "Book 18, Chapter 08 — The Reference Implementation (opening; What is in it; The service and its contract; The migration tool and its three checks; The agent and its guardrails; What was verified, and what wasn't).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "TOGAF gives the order; Zachman, the checklist");
  tag(s, "How");
  columns(s, [
    ["FaRoute", "THE TOGAF STANDARD, 10TH EDITION", HEX.amber, HEX.amberTint, "The order to do the work in", [
      "The ADM: Preliminary, Phases A to H, requirements at the center",
      "Phases B to D compare baseline with target",
      "Phases E and F: dispositions and waves",
      "Phase H: re-triage starts the next cycle",
    ]],
    ["FaTableList", "THE ZACHMAN FRAMEWORK, VERSION 3.0", HEX.navy, HEX.navyTint, "A check that nothing is missing", [
      "Six interrogatives by six perspectives",
      "Not a methodology: no order, no starting point",
      "Thin cells show gaps, such as Where above row 4",
      "An empty cell is a question, not a defect",
    ]],
  ], 14);
  callout(s, "Req", 5.3, 1.2, "FaLandmark", HEX.amber, "The requirement is the architecture, not a framework: ",
    "A-130 asks for a baseline, a target and a transition plan, and PM-7 and PL-8 carry it into controls. FEAF v2 is historical. File the book's artifacts under both as they are.");
  sources(s, "Sources: OMB A-130 §5.a(2); NIST SP 800-53 Rev. 5 (PM-7, PL-8); The Open Group, TOGAF Standard, 10th Ed. (C220); Zachman International, Version 3.0. Book 18, Chapter 09.");
  narrate(s,
`Many agencies have an enterprise architecture office that speaks TOGAF or Zachman. A program that ignores that vocabulary forces every artifact to be translated; one that adopts it wholesale produces deliverables nobody reads. The book takes the middle course.

TOGAF's Architecture Development Method tells you the order: the triage is the business baseline, the reference architecture is the target, and the wave plan is the migration plan. Re-triage is change management, which starts the next cycle. Zachman's six-by-six grid tells you whether you've described everything. It isn't a method, and an empty cell is a question, not a defect.

The requirement behind both is the architecture itself. A-130 asks for a baseline, a target and a transition plan, and NIST's controls carry that forward. No federal rule requires either framework. The mappings are the book's own reading, so file its artifacts as they are, and answer the assessor with those three.`,
  "Book 18, Chapter 09 — Mapping the Work to TOGAF and Zachman (opening; What federal policy requires; The TOGAF Standard today; The Zachman Framework today; Using the mappings; Key takeaways).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Run the portfolio in waves");
  tag(s, "How");
  steps(s, "Wave", [["Pilot wave", "3 to 5 simple applications, plus one hard case"], ["Factory waves", "Move groups by shared data and owner"], ["Retirement", "Old servers, databases, licenses off"], ["Long tail", "Retained, with an owner and a review date"]],
    [HEX.amberTint, HEX.navyTint, HEX.redTint, HEX.grey], ["Phase 2", "Phase 3", "Phase 4", "Phase 6"], [HEX.amber, HEX.navy, HEX.red, HEX.slate]);
  panels(s, [
    ["FaLandmark", "Fund it wave by wave", HEX.amber, HEX.amberTint, [
      "TMF: improve, retire or replace; typically under $25M",
      "Working capital funds: savings pay the next wave",
      "The CIO signs the wave plan",
    ]],
    ["FaChartLine", "Measure from records, not plans", HEX.navy, HEX.navyTint, [
      "Applications dispositioned, with a named owner",
      "Cost avoided, counted from retirement records",
      "Migrations validated on the first run",
    ]],
  ]);
  callout(s, "Size", 5.3, 1.2, "FaArrowsRotate", HEX.amber, "Size waves by measured throughput, not the schedule: ",
    "plan four to five waves ahead and only the next in detail. The fifth wave should cost less per application than the first, and the triage is re-scored on triggers and at least yearly.");
  sources(s, "Sources: AWS Prescriptive Guidance; Microsoft Cloud Adoption Framework; TMF fit, process and 2026 call; MGT Act §1077(b); OMB M-26-10; DORA. Book 18, Chapter 10.");
  narrate(s,
`A disposition for every application is a list, not a plan. An agency can't start thousands of projects at once, and running them one at a time rediscovers the same problems. Waves solve both, and each wave leaves the next a little cheaper.

The waves run on the program's existing phases and gates. A pilot wave holds a few simple applications plus one representative hard case, so the first factory wave doesn't meet its first database package unprepared. Factory waves move groups that share data or an owner. Then retirement actually switches the old systems off, and the long tail keeps an owner and a review date for everything retained.

Waves are also a funding structure. The Technology Modernization Fund funds projects that improve, retire or replace systems, and working capital funds let one wave's retirement savings pay for the next.

Report from records, not plans. Cost avoided counts only once the old system is off.`,
  "Book 18, Chapter 10 — Running the Portfolio in Waves (opening; The portfolio on the program's phases; Planning waves; The modernization factory; Metrics; Funding; Keeping the triage current; Where wave programs go wrong).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, and next steps");
  tag(s, "How");
  const asks = [
    ["FaListCheck", "Ask for the inventory first", "An owner and a proposed disposition for every application", HEX.red, HEX.redTint],
    ["FaScaleBalanced", "Approve the rubric, not each decision", "Rule on contested cases; fund the retirements", HEX.navy, HEX.navyTint],
    ["FaDatabase", "Ask for three results before cut-over", "Counts, a checksum and business totals; no dual writes", HEX.teal, HEX.tealTint],
    ["FaUserCheck", "Every agent has a sponsor", "Agents propose; people approve; services apply", HEX.amber, HEX.amberTint],
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.55 + row * 1.72;
    box(s, `Ask ${i + 1}`, x, y, 6.0, 1.55, a[4]);
    icon(s, a[0], x + 0.25, y + 0.38, 0.75, a[3]);
    T(s, `Ask ${i + 1} text`, [{ text: a[1], options: { bold: true, color: a[3], fontSize: 18, fontFace: "Cambria", breakLine: true } }, { text: a[2], options: { fontSize: 14.5 } }],
      { x: x + 1.2, y: y + 0.15, w: 4.6, h: 1.3, fontSize: 18 });
  });
  callout(s, "Next", 5.15, 1.4, "FaRoute", HEX.navy, "Next step: ",
    "score a pilot set of 30 to 50 applications that experienced architects already know, calibrate the rubric against their judgment, then choose a pilot wave with one representative hard case.");
  sources(s, "Sources: GAO-25-107795; OMB Circular A-130; AWS and Microsoft wave-planning guidance; OWASP LLM06:2025. Book 18, Chapters 01, 02, 04, 05 and 10.");
  narrate(s,
`So, four decisions.

Ask for the inventory before the program. The first deliverable is a list of applications with an owner and a proposed disposition for each, not a target-state design.

Approve the rubric, not each decision. Agree the criteria and rules once, rule on the contested cases, and fund the decommissioning that makes retirements real.

Before any cut-over, ask for three results: row counts, a checksum, and totals the business recognizes, with every mismatch explained. And forbid dual writes.

And no agent writes to a system of record. Agents propose, people approve, services apply, and every agent has a sponsor.

The next step is small. Score a pilot set of thirty to fifty applications your architects already know, calibrate the rubric against their judgment, and pick a pilot wave with one representative hard case.

Decide application by application. Book 18 has the detail, every claim footnoted. Thank you.`,
  "Book 18, Chapters 01 (What leadership should take from this), 02 (Calibrating the rubric; What leadership should take from this), 04 (What leadership should take from this), 05 (What leadership should take from this) and 10 (Planning waves); index.");
}

// ------------------------------------------------------------------ Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: federal policy, GAO and NIST");
  const src = [
    "GAO: GAO-25-107795, Agencies Need to Plan for Modernizing Critical Decades-Old Legacy Systems (July 17, 2025) and its product page (status as of February 2026); GAO-19-471, Agencies Need to Develop Modernization Plans for Critical Legacy Systems (June 11, 2019).",
    "OMB: Circular A-130 (2016 revision), §5 and Appendices I–II; M-25-05 (January 15, 2025); M-25-21 and M-25-22 (April 3, 2025); M-26-05 (January 23, 2026); M-26-10 (March 31, 2026).  ·  FAR 48 CFR 39.103, FAC 2026-01 (March 13, 2026).",
    "Statutes: 40 U.S.C. §11312; Modernizing Government Technology Act, Pub. L. 115-91 §1077(b); Technology Modernization Fund fit, process and 2026 call for proposals.",
    "NIST: FIPS 199 (February 2004); SP 800-53 Rev. 5, release 5.2.0 (August 27, 2025) and SP 800-53B; SP 800-218 SSDF 1.1 (February 2022) and the 1.2 draft (December 17, 2025); SP 800-218A; SP 800-204, 800-204A–D and 800-190; AI 600-1 (July 2024).",
    "CISA: Careful Adoption of Agentic AI Services (May 1, 2026); 2026 Minimum Elements for a Software Bill of Materials (July 29, 2026).",
    "Full footnotes with links and access dates (October 28, 2026): Book 18, every chapter (whalermike.github.io/modernization-workbook/docs/books/b18-application-modernization/).",
  ];
  T(s, "Source list", bullets(src, 12.5), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6, fontSize: 12.5 });
}
{
  const s = content("Backup", "Sources: products, vendors and frameworks");
  const src = [
    "Runtimes and specifications, as of October 28, 2026: OpenJDK JDK project; Microsoft Build of OpenJDK support roadmap; Spring Boot generations, releases and system requirements (4.1.2); Spring AI 2.0.2; React versions (19.3) and npm (19.3.1); Node.js releases and schedule; OpenAPI 3.2.1; OCI image, distribution and runtime specifications; Kubernetes releases; The Twelve-Factor App.",
    "Data: PostgreSQL versioning policy and PostgreSQL 18 documentation; Oracle Database SQL Language Reference 23ai; Microsoft SQL Server Migration Assistant for Db2 and Oracle (v10.6); AWS Schema Conversion Tool, DMS Schema Conversion and DMS User Guide; Ora2Pg 25.0.",
    "Patterns and AI: Martin Fowler, Strangler Fig (2024); Azure Architecture Center (Strangler Fig, Backends for Frontends, Transactional Outbox, Scheduler Agent Supervisor); OWASP Top 10 for LLM Applications 2025 and Top 10 for Agentic Applications 2026; Model Context Protocol specification 2026-07-28; GitHub Copilot modernization; AWS Transform for mainframe; Lewis et al. (2020).",
    "Delivery and governance: AWS Prescriptive Guidance (7 Rs; large migrations; wave planning); Microsoft Cloud Adoption Framework and 6 Rs guidance; DORA; GitHub protected branches; SLSA 1.2; Nygard (2011); RFC 9457.  ·  Frameworks: The Open Group, TOGAF Standard, 10th Edition (C220); Zachman Framework 3.0.",
    "Vendors and products are named as examples, not endorsements.",
  ];
  T(s, "Source list", bullets(src, 12.5), { x: 0.6, y: 1.5, w: 12.1, h: 5.05, paraSpaceAfter: 6, fontSize: 12.5 });
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
  console.log(`narration.json: ${said} words (${per.join(", ")}), about ${mmss((said * 60) / 142)} at 142 wpm`);
}

console.log(`notes: ${spoken} spoken words (${perSlide.join(", ")}), about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
