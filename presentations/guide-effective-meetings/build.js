// Companion guide — Effective Meetings: Purpose, Agenda, Roles, and Follow-Through. A full, detailed narrated deck
// (Why / What / Who / How, Who = the roles) that covers every section of the guide, in the guide's own order.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Guide_Effective_Meetings.pptx   (FIT=1 prints layout bottoms)
// Every fact comes from docs/books/guides/effective-meetings.md and its four footnoted sources (18F/GSA, UPMC Children's
// Hospital of Pittsburgh faculty development, Portland State University's meeting toolbox, and Belludi on Grove), named
// in each slide's Sources line and notes. The guide's "working rule for the program" is labeled design guidance.
// The one diagram is the guide's committed PNG (docs/images/diagrams/guides/png/); its alt text is read from the
// guide's fig-alt. Everything else is drawn from the shared kit's shapes, cards and tables. The spoken narration lives
// in narration.json; each slide's notes carry that narration, then a Detail part, then the Workbook line.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Companion guide", title: "Effective Meetings",
  footer: "Federal Modernization Workbook  ·  Companion guide  ·  Effective Meetings" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "Guide_Effective_Meetings.pptx";
const FIT = !!process.env.FIT;

// ---------------------------------------------------------------- narration and notes
const NARR = JSON.parse(fs.readFileSync(path.join(__dirname, "narration.json"), "utf8"));
const WPM = 150;
let clock = 0, spoken = 0;
const mmss = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const perSlide = [];
const G = "Companion guide, Effective Meetings — ";
// Notes: the spoken part (from narration.json, so the two never drift), the Detail part, and the Workbook line.
const narrate = (s, detail, section) => {
  const n = pres.slides.length;
  const e = NARR[n - 1];
  if (!e) { console.warn(`  ! slide ${n} has no narration.json entry`); return; }
  const words = e.say.split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (words * 60) / WPM; spoken += words; perSlide.push(words);
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${e.say.trim()}\n\nDetail: ${detail.trim()}\n\nWorkbook: ${G}${section}`);
};

// ---------------------------------------------------------------- checks
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  titles.push(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };
// Conservative text-fit estimate (Calibri at about 0.55 em per character); prints "!" when text may overflow its box.
const lineH = (pt) => (pt / 72) * 1.2;
const linesFor = (chars, w, pt) => Math.max(1, Math.ceil((chars * 0.55 * pt / 72) / Math.max(0.3, w)));
const needFor = (paras, w, pa) => paras.reduce((h, p) => h + linesFor(p.chars, w - (p.bullet ? 0.3 : 0.05), p.size) * lineH(p.size) + (pa || 0) / 72, 0);
const parasOf = (t, size) => {
  if (typeof t === "string") return t.split("\n").map((l) => ({ chars: l.length, size, bullet: false }));
  const out = []; let cur = { chars: 0, size: 0, bullet: false };
  t.forEach((r) => {
    const o = r.options || {}; const sz = o.fontSize || size;
    cur.size = Math.max(cur.size, sz); cur.chars += (r.text || "").length * (sz / Math.max(cur.size, sz)); cur.bullet = cur.bullet || !!o.bullet;
    if (o.breakLine || o.bullet) { out.push(cur); cur = { chars: 0, size: 0, bullet: false }; }
  });
  if (cur.chars) out.push(cur);
  return out.map((p) => Object.assign(p, { size: p.size || size }));
};
const bottomCheck = (name, bottom) => {
  if (FIT) console.log(`  slide ${pres.slides.length} ${name}: bottom ${bottom.toFixed(2)} in`);
  if (bottom > 6.56) console.warn(`  ! slide ${pres.slides.length} ${name} runs into the Sources line (bottom ${bottom.toFixed(2)} in)`);
};
const T = (s, name, t, o) => {
  const need = needFor(parasOf(t, o.fontSize || 14), o.w, o.paraSpaceAfter);
  if (FIT) console.log(`  slide ${pres.slides.length} text ${name}: needs ${need.toFixed(2)}, has ${o.h.toFixed(2)}`);
  if (need > o.h * 1.02) console.warn(`  ! slide ${pres.slides.length} ${name}: text may overflow (needs ${need.toFixed(2)} in, has ${o.h.toFixed(2)})`);
  return txt(s, name, t, o);
};
const sources = (s, text) => {
  if (text.length > 170) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y: 6.62, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

// ---------------------------------------------------------------- the guide's diagram
const GUIDE = fs.readFileSync(path.join(__dirname, "..", "..", "docs", "books", "guides", "effective-meetings.md"), "utf8");
const PNG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "guides", "png");
const altFor = (name) => {
  const m = GUIDE.match(new RegExp(`svg/${name}\\.svg\\)\\{[^}]*fig-alt="([^"]+)"`));
  if (!m) throw new Error(`no fig-alt found in the guide for ${name}`);
  return m[1];
};
const figure = (s, name, x, maxW, maxH, top) => {
  const file = path.join(PNG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y: top + (maxH - h) / 2, w, h, altText: altFor(name) });
  bottomCheck(`image ${name}`, top + (maxH + h) / 2);
};

// ---------------------------------------------------------------- layout helpers
// A measured version of the kit's full-width callout (T draws the text so it gets the overflow check).
const callout = (s, iconName, color, label, text, y = 5.3, h = 1.1) => {
  box(s, "Takeaway", 0.6, y, 12.15, h, "FFFFFF", color);
  icon(s, iconName, 0.85, y + (h - 0.7) / 2, 0.7, color);
  T(s, "Takeaway text", [{ text: label, options: { bold: true, color } }, { text }],
    { x: 1.8, y: y + 0.05, w: 10.75, h: h - 0.1, fontSize: 16.5, valign: "middle" });
  bottomCheck("callout", y + h);
};
// A card: tinted box, icon on a circle, a Cambria heading and a body (string, runs or a bullet list).
const card = (s, prefix, x, y, w, h, o) => {
  box(s, `${prefix} card`, x, y, w, h, o.tint || "FFFFFF", o.line || o.color);
  const d = o.iconD || 0.6;
  if (o.icon) icon(s, o.icon, x + 0.2, y + 0.18, d, o.color);
  const hx = o.icon ? x + 0.3 + d : x + 0.22;
  T(s, `${prefix} head`, o.heading, { x: hx, y: y + 0.16, w: x + w - 0.15 - hx, h: o.headH || 0.64, bold: true, color: o.color,
    fontSize: o.headSize || 16.5, fontFace: "Cambria", valign: "middle" });
  const by = y + (o.headH || 0.64) + 0.32;
  const size = o.size || 13.5;
  const body = Array.isArray(o.body) && typeof o.body[0] === "string" ? bullets(o.body, size) : o.body;
  if (body) T(s, `${prefix} body`, body, { x: x + 0.22, y: by, w: w - 0.4, h: y + h - by - 0.12, fontSize: size, paraSpaceAfter: o.pa == null ? 6 : o.pa });
  bottomCheck(`${prefix} card`, y + h);
};
// A number on a colored circle.
const num = (s, n, x, y, d, color) => {
  s.addShape(pres.shapes.OVAL, { objectName: `Step ${n} circle`, x, y, w: d, h: d, fill: { color }, line: { color } });
  txt(s, `Step ${n} number`, String(n), { x, y, w: d, h: d, fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
};
// A table at (x, y) with a navy header row; warns when a cell's text won't fit its row.
const table = (s, name, header, body, colW, rowH, o = {}) => {
  const pt = o.fontSize || 12.5;
  [header, ...body].forEach((r, i) => r.forEach((c, j) => {
    const t = typeof c === "string" ? c : c.text;
    const need = t.split("\n").reduce((a, l) => a + linesFor(l.length, colW[j] - 0.2, pt), 0) * lineH(pt) + 0.1;
    if (need > rowH[i] + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} row ${i} col ${j} may wrap past its height (${need.toFixed(2)} > ${rowH[i]})`);
  }));
  const y = o.y || 1.5;
  s.addTable([head(header), ...body.map((r) => r.map((c) => (typeof c === "string" ? { text: c } : c)))],
    tableOpts(colW, { x: o.x || 0.6, y, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
  bottomCheck(`table ${name}`, y + rowH.reduce((a, b) => a + b, 0));
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });
const arrowR = (s, name, x, y, color) => s.addShape(pres.shapes.RIGHT_ARROW,
  { objectName: name, x, y, w: 0.34, h: 0.42, fill: { color: color || HEX.slate }, line: { color: color || HEX.slate } });
const line = (s, name, x, y, w, h, o = {}) => s.addShape(pres.shapes.LINE,
  { objectName: name, x, y, w, h, line: Object.assign({ color: HEX.slate, width: 2 }, o) });

// Sources (short forms for the slide lines; full citations are in Backup).
const SG = "Companion guide, Effective Meetings";
const S18F = "18F, GSA (2016)";
const SCHP = "Ploof, UPMC Children's Hospital of Pittsburgh (2016)";
const SCHPs = "Ploof, UPMC Children's (2016)", SPSUs = "Recktenwald, Portland State (2018)";
const SPSU = "Recktenwald, Portland State University (2018)";
const SGRV = "Belludi, Right Attitudes (2023)";
const src = (...xs) => `Sources: ${xs.join("; ")}. ${SG}.`;

const S_WHY = "Why meetings matter", S_WHAT = "What a good meeting needs", S_WHO = "Who: the roles",
  S_HOW = "How to run it: before, during, close, after";
const CW = (n, gap) => (12.15 - (n - 1) * gap) / n; // column width for n cards across the content width

// ------------------------------------------------------------------ 1 Title
{
  const s = titleSlide(S_WHY, "Effective Meetings", "Purpose, Agenda, Roles, and Follow-Through");
  D.agenda(s, 0.8, 4.8, 6.6);
  T(s, "Series line", [
    { text: "Federal Modernization Workbook  ·  Companion guide", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Why meetings matter, the agenda, the roles, and a before / during / close / after routine, with templates and a checklist", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.4, w: 9.0, h: 0.95, fontSize: 16 });
  narrate(s,
`The guide opens with one line: a meeting is a tool for deciding and coordinating; if it ends without decisions and owners, it was a status report that cost an hour of everyone's time. It covers why a modernization program lives or dies by its meetings, the three kinds of meeting and what each is for, the roles every meeting needs, and a before / during / after routine with an agenda template, a notes template and a one-page checklist. The practices come from public guidance, chiefly GSA's 18F team, and from facilitation training used in industry and academia. The deck follows the book decks' Why / What / Who / How order: Why (slides 2–4: why meetings matter), What (5–10: is a meeting needed, the three kinds, the agenda), Who (11–12: the roles), How (13–22: before, during, close, after, the two templates, the checklist, further reading).`,
  "In this guide");
}

// ------------------------------------------------------------------ 2 Why
{
  const s = content(S_WHY, "A modernization program runs on its meetings");
  tag(s, "Why");
  const kinds = [["FaArrowsRotate", "Change advisory boards"], ["FaRoute", "Cutover go / no-go calls"], ["FaSitemap", "Architecture reviews"],
    ["FaPeopleArrows", "Vendor working sessions"], ["FaBuildingColumns", "Steering committees"]];
  const w = CW(5, 0.2);
  kinds.forEach((k, i) => {
    const x = 0.6 + i * (w + 0.2);
    box(s, `Kind ${i}`, x, 1.5, w, 1.45, HEX.navyTint);
    icon(s, k[0], x + (w - 0.6) / 2, 1.62, 0.6, HEX.navy);
    T(s, `Kind ${i} text`, k[1], { x: x + 0.1, y: 2.3, w: w - 0.2, h: 0.55, fontSize: 14, bold: true, color: HEX.navy, align: "center", valign: "middle" });
  });
  const w2 = CW(2, 0.25);
  card(s, "Decisions", 0.6, 3.2, w2, 1.85, { icon: "FaScaleBalanced", color: HEX.teal, tint: HEX.tealTint, heading: "Where decisions are made",
    body: "Most of the program's decisions are made in one of these meetings." , size: 15 });
  card(s, "Slippage", 0.6 + w2 + 0.25, 3.2, w2, 1.85, { icon: "FaTriangleExclamation", color: HEX.red, tint: HEX.redTint, heading: "Where slippage starts",
    body: "Most of its slippage starts in one that ended without a clear decision or a named owner.", size: 15 });
  callout(s, "FaUserCheck", HEX.red, "A meeting is a tool for deciding and coordinating.  ",
    "If it ends without decisions and owners, it was a status report that cost an hour of everyone's time.");
  sources(s, src("the guide's own framing"));
  narrate(s,
`A modernization program is coordinated through meetings: change advisory boards, cutover go/no-go calls, architecture reviews, vendor working sessions, steering committees. Most of the program's decisions are made in one of them, and most of its slippage starts in one that ended without a clear decision or a named owner. This framing is the guide's own (no external source); the callout is the guide's opening line.`,
  "Why meetings matter to a modernization program");
}

// ------------------------------------------------------------------ 3 Why
{
  const s = content(S_WHY, "The habits are old, and they work");
  tag(s, "Why");
  const w = CW(3, 0.25);
  card(s, "Industry", 0.6, 1.5, w, 3.55, { icon: "FaBuilding", color: HEX.navy, tint: HEX.navyTint, heading: "Industry: Intel",
    body: ["A course on effective meetings was mandatory for new employees", "Often taught by Andy Grove himself, while he was CEO"] });
  card(s, "Government", 0.6 + (w + 0.25), 1.5, w, 3.55, { icon: "FaBuildingColumns", color: HEX.teal, tint: HEX.tealTint, heading: "Government: GSA's 18F",
    body: ["The federal digital-services team's short public guide (2016)", "A clear purpose, a complete agenda, assigned roles, written next steps"] });
  card(s, "Academia", 0.6 + 2 * (w + 0.25), 1.5, w, 3.55, { icon: "FaBook", color: HEX.amber, tint: HEX.amberTint, heading: "Academia",
    body: ["Faculty development: UPMC Children's Hospital of Pittsburgh (2016)", "Engineering: Portland State University's meeting toolbox (2018)", "The same structure"] });
  callout(s, "FaListCheck", HEX.navy, "The pattern is consistent because it works.  ",
    "Purpose, agenda, roles and written next steps: the same four ideas, from three different worlds.");
  sources(s, src(SGRV, S18F, SCHPs, SPSUs));
  narrate(s,
`Intel made a course on effective meetings mandatory for new employees, often taught by Andy Grove himself while he was CEO (Belludi, Right Attitudes, January 26, 2023). GSA's 18F published a short public guide, "How to run an efficient meeting" (December 14, 2016, archived on the 18F blog), built on a clear purpose, a complete agenda, assigned roles and written next steps. University faculty-development (Ploof, UPMC Children's Hospital of Pittsburgh, August 4, 2016) and engineering programs (Recktenwald, Portland State University, January 4, 2018) teach the same structure. The guide: "The pattern is consistent because it works."`,
  "Why meetings matter to a modernization program");
}

// ------------------------------------------------------------------ 4 Why
{
  const s = content(S_WHY, "Before, during, after: what each phase produces");
  tag(s, "Why");
  figure(s, "effective-meetings-lifecycle", 0.6, 12.15, 3.6, 1.5);
  callout(s, "FaArrowsRotate", HEX.teal, "The loop closes on the next agenda.  ",
    "What one meeting produces opens the next: start it by reviewing the previous action items.");
  sources(s, src(S18F, SCHPs, SPSUs, "the guide's figure"));
  narrate(s,
`The guide's figure: Before (purpose and meeting type, agenda sent a day ahead, roles assigned, only the people needed); During (start on time, confirm purpose and roles, follow the agenda, parking lot and timekeeping); After (notes sent the same day, actions with owner and due date, parking lot routed, reviewed at the next meeting). An arrow from After loops back to Before, labeled "next agenda": 18F recommends opening the next meeting by reviewing the previous action items. The How section later splits out the Close as its own phase, as the guide's "Running the meeting" section does.`,
  "Why meetings matter to a modernization program (figure: Before, during, and after)");
}

// ------------------------------------------------------------------ 5 What
{
  const s = content(S_WHAT, "Is a meeting needed at all?");
  tag(s, "What");
  const w = CW(2, 0.25);
  box(s, "Test card", 0.6, 1.5, w, 3.55, HEX.navyTint);
  icon(s, "FaFilter", 0.85, 1.7, 0.7, HEX.navy);
  T(s, "Test head", "18F's test", { x: 1.75, y: 1.72, w: w - 1.4, h: 0.65, bold: true, color: HEX.navy, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  T(s, "Test text", "Is the meeting a better use of the attendees' time than not meeting?",
    { x: 0.9, y: 2.65, w: w - 0.6, h: 1.4, fontSize: 24, fontFace: "Cambria", color: HEX.navy, valign: "middle" });
  T(s, "Test note", "Ask this first, before the agenda, the roles or the invitation.", { x: 0.9, y: 4.25, w: w - 0.6, h: 0.6, fontSize: 14, color: HEX.ink });
  bottomCheck("Test card", 5.05);
  const x2 = 0.6 + w + 0.25;
  box(s, "Reasons card", x2, 1.5, w, 3.55, "FFFFFF", HEX.line);
  icon(s, "FaClipboardCheck", x2 + 0.25, 1.7, 0.7, HEX.teal);
  T(s, "Reasons head", "The usual reasons for a meeting", { x: x2 + 1.15, y: 1.72, w: w - 1.4, h: 0.65, bold: true, color: HEX.teal, fontSize: 18, fontFace: "Cambria", valign: "middle" });
  const chips = [["Giving information", HEX.tealTint], ["Working a problem", HEX.tealTint], ["“Satisfying requirements”", HEX.grey], ["“Tradition”", HEX.grey]];
  const cw = (w - 0.75) / 2;
  chips.forEach((c, i) => {
    const cx = x2 + 0.25 + (i % 2) * (cw + 0.25), cy = 2.6 + Math.floor(i / 2) * 0.95;
    box(s, `Reason ${i}`, cx, cy, cw, 0.75, c[1]);
    T(s, `Reason ${i} text`, c[0], { x: cx + 0.1, y: cy, w: cw - 0.2, h: 0.75, fontSize: 15, bold: true, color: HEX.ink, align: "center", valign: "middle" });
  });
  T(s, "Reasons note", "From real work to simply satisfying requirements and tradition.", { x: x2 + 0.25, y: 4.5, w: w - 0.5, h: 0.4, fontSize: 13, italic: true, color: HEX.slate });
  callout(s, "FaLightbulb", HEX.teal, "Can some of those goals be met another way?  ",
    "The UPMC session asks it of each reason; the guide turns it into a working rule.");
  sources(s, src(S18F, SCHP));
  narrate(s,
`"Ask this first." 18F's test is whether the meeting is a better use of the attendees' time than not meeting. A faculty-development session at UPMC Children's Hospital of Pittsburgh (Dianna Ploof, EdD, Department of Pediatrics Faculty Development) lists the usual reasons for a meeting, from giving information and working a problem to simply "satisfying requirements" and "tradition," and asks whether some of those goals can be met another way.`,
  "Is a meeting needed at all?");
}

// ------------------------------------------------------------------ 6 What
{
  const s = content(S_WHAT, "Meet, write it down, or retire it");
  tag(s, "What");
  const rule = [
    ["FaTableList", HEX.navy, HEX.navyTint, "Information only, one way", "Nothing to discuss or decide; the information flows from one person to the rest.",
      "Send a written update", "Meet only if questions need live discussion"],
    ["FaScaleBalanced", HEX.teal, HEX.tealTint, "A problem to work, or a decision to make", "The group has to generate options, narrow them, or commit.",
      "Meet", "With the right people in the room"],
    ["FaArrowsRotate", HEX.amber, HEX.amberTint, "A recurring meeting", "Re-check its purpose each quarter.",
      "Cancel, or turn it into a written report", "If it no longer decides anything"],
  ];
  const w = CW(3, 0.25);
  rule.forEach((r, i) => {
    const x = 0.6 + i * (w + 0.25);
    box(s, `Rule ${i} card`, x, 1.5, w, 3.55, r[2]);
    icon(s, r[0], x + 0.2, 1.68, 0.6, r[1]);
    T(s, `Rule ${i} head`, r[3], { x: x + 0.95, y: 1.66, w: w - 1.1, h: 0.66, bold: true, color: r[1], fontSize: 16, fontFace: "Cambria", valign: "middle" });
    T(s, `Rule ${i} body`, r[4], { x: x + 0.22, y: 2.5, w: w - 0.4, h: 0.95, fontSize: 13.5 });
    box(s, `Rule ${i} action`, x + 0.2, 3.6, w - 0.4, 1.28, "FFFFFF", r[1]);
    T(s, `Rule ${i} action text`, [{ text: `→  ${r[5]}`, options: { bold: true, color: r[1], fontSize: 15.5, breakLine: true } }, { text: r[6], options: { fontSize: 13 } }],
      { x: x + 0.35, y: 3.66, w: w - 0.7, h: 1.16, valign: "middle" });
    bottomCheck(`Rule ${i} card`, 5.05);
  });
  callout(s, "FaRoute", HEX.amber, "Design guidance.  ",
    "This is the guide's working rule for the program, built on 18F's test and the UPMC list; it is not a quoted source requirement.");
  sources(s, src("working rule (design guidance)", S18F, SCHP));
  narrate(s,
`The guide's working rule for the program (design guidance, not a source requirement): information only, one way, means send a written update, and hold a meeting only if questions need live discussion. A problem to work or a decision to make means meet, with the right people in the room. A recurring meeting: re-check its purpose each quarter; a recurring meeting that no longer decides anything should be cancelled or turned into a written report. The descriptions in the cards' second lines ("nothing to discuss or decide"; "generate options, narrow them, or commit") paraphrase the guide's three meeting types on the next slide.`,
  "Is a meeting needed at all? (working rule)");
}

// ------------------------------------------------------------------ 7 What
{
  const s = content(S_WHAT, "Three kinds of meeting, and what each is for");
  tag(s, "What");
  const rows = [
    [bold("Information sharing"), "Mostly one-way reporting, with clarifying questions",
      "Material sent in advance; focus on what others need to know; no rehashing past decisions", bold("Shared understanding", HEX.teal)],
    [bold("Problem solving"), "Open discussion among many people",
      "A time limit, a note-taker, a divergent phase (generate ideas), then a convergent phase (narrow them)", bold("Options, criteria, and the questions still open", HEX.teal)],
    [bold("Decision making"), "The group commits to one option",
      "What is being decided, stated in advance; the method agreed in advance (consensus, majority, or deferral to an owner); everyone has the information",
      bold("A recorded decision, an owner, and next steps", HEX.teal)],
  ];
  table(s, "Types", ["Type", "What happens", "What it needs", "What it produces"], rows, [2.0, 2.75, 4.75, 2.65], [0.42, 0.85, 0.85, 1.1], { fontSize: 13 });
  callout(s, "FaListCheck", HEX.navy, "One meeting can hold more than one type.  ",
    "But each agenda item is one of them, and the agenda says which.", 5.15, 1.15);
  sources(s, src(SPSU + ", drawing on Cameron Herold, Meetings Suck (2016)"));
  narrate(s,
`Engineering-education guidance from Portland State University (Gerald Recktenwald, "Supplemental Notes: A Meeting Toolbox"), drawing on Cameron Herold's Meetings Suck, sorts meeting work into three types. Information sharing: mostly one-way reporting with clarifying questions; needs material sent in advance, focus on what others need to know, no rehashing past decisions; produces shared understanding. Problem solving: open discussion among many people; needs a time limit, a note-taker, a divergent phase then a convergent phase; produces options, criteria and the questions still open. Decision making: the group commits to one option; needs what is being decided stated in advance, the decision method agreed in advance (consensus, majority, or deferral to an owner), and everyone having the information; produces a recorded decision, an owner and next steps.`,
  "The three kinds of meeting");
}

// ------------------------------------------------------------------ 8 What
{
  const s = content(S_WHAT, "Don't do the work in the room; name the shift");
  tag(s, "What");
  const w = CW(2, 0.25);
  // Warning 1: a three-step mini flow.
  box(s, "Work card", 0.6, 1.5, w, 3.55, HEX.redTint);
  icon(s, "FaTriangleExclamation", 0.8, 1.68, 0.6, HEX.red);
  T(s, "Work head", "Don't do the work in the meeting", { x: 1.55, y: 1.66, w: w - 1.1, h: 0.64, bold: true, color: HEX.red, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  T(s, "Work trigger", "When the group starts doing detailed analysis together:", { x: 0.82, y: 2.45, w: w - 0.44, h: 0.5, fontSize: 13.5 });
  const steps1 = ["Stop", "Agree who, by when, and what they'll deliver", "Back to the agenda"];
  const sw = (w - 0.4 - 2 * 0.42) / 3;
  steps1.forEach((t, i) => {
    const x = 0.8 + i * (sw + 0.42);
    box(s, `Work step ${i}`, x, 3.05, sw, 1.75, "FFFFFF", HEX.red);
    T(s, `Work step ${i} text`, t, { x: x + 0.08, y: 3.1, w: sw - 0.16, h: 1.65, fontSize: 14, bold: true, color: HEX.red, align: "center", valign: "middle" });
    if (i < 2) arrowR(s, `Work arrow ${i}`, x + sw + 0.04, 3.72, HEX.red);
  });
  bottomCheck("Work card", 5.05);
  // Warning 2: reporting -> problem solving -> deciding.
  const x2 = 0.6 + w + 0.25;
  box(s, "Shift card", x2, 1.5, w, 3.55, HEX.navyTint);
  icon(s, "FaRightLeft", x2 + 0.2, 1.68, 0.6, HEX.navy);
  T(s, "Shift head", "Name the shift", { x: x2 + 0.95, y: 1.66, w: w - 1.1, h: 0.64, bold: true, color: HEX.navy, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  T(s, "Shift trigger", "When the discussion moves to a new kind of work, the facilitator says so out loud:", { x: x2 + 0.22, y: 2.45, w: w - 0.44, h: 0.5, fontSize: 13.5 });
  ["Reporting", "Problem solving", "Deciding"].forEach((t, i) => {
    const x = x2 + 0.2 + i * (sw + 0.42);
    box(s, `Shift step ${i}`, x, 3.05, sw, 1.75, "FFFFFF", HEX.navy);
    T(s, `Shift step ${i} text`, t, { x: x + 0.08, y: 3.1, w: sw - 0.16, h: 1.65, fontSize: 15, bold: true, color: HEX.navy, align: "center", valign: "middle" });
    if (i < 2) arrowR(s, `Shift arrow ${i}`, x + sw + 0.04, 3.72, HEX.navy);
  });
  bottomCheck("Shift card", 5.05);
  callout(s, "FaUsersGear", HEX.navy, "It keeps the group on the same task.  ",
    "Both warnings come from the same source, and both apply directly to technical programs.");
  sources(s, src(SPSU));
  narrate(s,
`Two warnings from Portland State's toolbox that the guide says apply directly to technical programs. Don't do the work in the meeting: when a group starts doing detailed analysis together, stop, agree on who will do it, by when, and what they'll deliver, then go back to the agenda. Name the shift: when a discussion moves from reporting to problem solving, or from problem solving to deciding, the facilitator should say so out loud; it keeps the group on the same task.`,
  "The three kinds of meeting (two warnings)");
}

// ------------------------------------------------------------------ 9 What
{
  const s = content(S_WHAT, "The agenda defines the meeting, and its end");
  tag(s, "What");
  const lw = 4.5;
  card(s, "Topic list", 0.6, 1.5, lw, 1.45, { icon: "FaTriangleExclamation", color: HEX.red, tint: HEX.redTint, heading: "A list of topics",
    body: "“Identity”  ·  “Network”  ·  “AOB”", size: 15, headH: 0.55 });
  card(s, "Real item", 0.6, 3.15, lw, 1.9, { icon: "FaUserCheck", color: HEX.teal, tint: HEX.tealTint, heading: "A real agenda item",
    body: "“Which three pilot sites go first?” focuses discussion better than “Pilot sites.”", size: 14.5, headH: 0.55 });
  const fields = [
    [bold("Item, as a question or outcome"), "Focuses the discussion"],
    [bold("Type"), "Inform, discuss, or decide, so people know how to take part"],
    [bold("Owner"), "The person who leads that item"],
    [bold("Time"), "Minutes allowed for the item"],
    [bold("Preparation"), "What to read or bring beforehand"],
  ];
  table(s, "Fields", ["Each item gives", "Why"], fields, [3.0, 4.4], [0.4, 0.62, 0.62, 0.62, 0.62, 0.62], { x: 5.35, fontSize: 13.5 });
  callout(s, "FaDoorClosed", HEX.navy, "When the agenda is done, the meeting is done.  ",
    "The agenda defines the meeting's content and tells everyone when it is over; a list of topic names does not.");
  sources(s, src(S18F, SCHP));
  narrate(s,
`18F: the agenda defines the meeting's content and tells everyone when it is over; when the agenda is done, the meeting is done. A list of topic names ("Identity," "Network," "AOB") does not do that. A real agenda gives, for each item: the item written as a question or outcome ("Which three pilot sites go first?" focuses discussion better than "Pilot sites," per the UPMC session); its type (inform, discuss, or decide, so people know how to take part, per 18F); an owner who leads it; the minutes allowed; and the preparation (what to read or bring).`,
  "The agenda: more than a list of topics");
}

// ------------------------------------------------------------------ 10 What
{
  const s = content(S_WHAT, "Around the items: purpose, title, timing, headcount");
  tag(s, "What");
  const w = CW(3, 0.25), h1 = 2.3;
  card(s, "Header", 0.6, 1.5, w, h1, { icon: "FaClipboardCheck", color: HEX.navy, tint: HEX.navyTint, heading: "Above the items",
    body: ["Purpose and expected outcomes", "Where the notes will be kept", "Call-in or room details"], size: 13.5 });
  card(s, "Title", 0.6 + (w + 0.25), 1.5, w, h1, { icon: "FaHashtag", color: HEX.navy, tint: HEX.navyTint, heading: "A specific title",
    body: "“Cutover go/no-go, wave 2,” not “Weekly sync.”", size: 15 });
  card(s, "One page", 0.6 + 2 * (w + 0.25), 1.5, w, h1, { icon: "FaTableList", color: HEX.navy, tint: HEX.navyTint, heading: "One page",
    body: "Keep the agenda to one page and put the detail in attachments.", size: 15 });
  const w2 = CW(2, 0.25), y2 = 4.0, h2 = 2.45;
  card(s, "Send", 0.6, y2, w2, h2, { icon: "FaUserClock", color: HEX.teal, tint: HEX.tealTint, heading: "Send it early",
    body: ["At least a day ahead, so people can prepare", "At a consistent time for recurring meetings", "Changes proposed before the meeting, not debated at its start"], size: 13.5 });
  card(s, "Schedule", 0.6 + w2 + 0.25, y2, w2, h2, { icon: "FaUsersGear", color: HEX.amber, tint: HEX.amberTint, heading: "Length and headcount (18F)",
    body: ["15 or 45 minutes, not the default 30 or 60: room between meetings, spare time if an item runs over",
      "Double digits? Ask whether everyone needs to attend; keep to about a dozen"], size: 13.5 });
  sources(s, src(S18F, SPSU));
  narrate(s,
`Above the items, the agenda states the meeting's purpose and expected outcomes, where the notes will be kept, and the call-in or room details (18F). Its title should be specific: "Cutover go/no-go, wave 2," not "Weekly sync" (Portland State). Keep it to one page and put the detail in attachments (Portland State). Send it early enough for people to prepare (at least a day ahead), at a consistent time for recurring meetings, and let attendees propose changes before the meeting rather than debating the agenda at its start (18F; Portland State). Scheduling (18F): 15- or 45-minute meetings instead of the default 30 or 60 leave room between meetings and spare time if an item runs over; once a meeting reaches double digits, ask whether everyone needs to attend; keep meetings to about a dozen people.`,
  "The agenda: more than a list of topics (header, sending, scheduling)");
}

// ------------------------------------------------------------------ 11 Who
{
  const s = content(S_WHO, "Six roles, and everyone knows which they hold");
  tag(s, "Who");
  const roles = [
    ["Leader / facilitator", "Convenes and runs the meeting; keeps to the agenda; draws out quieter people and stops one voice dominating; ends it when the agenda is done. Focuses on process; need not be who called it. Have a backup."],
    ["Timekeeper", "Tracks time on each item, warns when one will run over, and calls for the group to re-prioritize. Supports the facilitator; doesn't replace them."],
    ["Note-taker", "Records decisions, action items, open questions and parking-lot items, not a transcript. Checks the record for accuracy and publishes it."],
    ["Decision-maker", "The person (or people) with authority to decide. If they aren't in the room, a “decide” item can't be decided."],
    ["Participants", "Arrive on time and prepared; listen; keep disagreement about ideas, not people; accept the group's decision."],
    ["Closer (optional)", "Runs the close: summarizes outcomes, confirms every action has an owner and a date, sets up the next meeting. Often the facilitator."],
  ];
  table(s, "Roles", ["Role", "Responsibilities"], roles.map((r, i) => [bold(r[0], i === 3 ? HEX.amber : HEX.teal), r[1]]),
    [2.45, 9.7], [0.4, 0.78, 0.64, 0.64, 0.64, 0.64, 0.64], { fontSize: 13 });
  T(s, "Roles rule", [{ text: "Every meeting needs named roles, ", options: { bold: true, color: HEX.teal } }, { text: "and every attendee should know which one they hold." }],
    { x: 0.6, y: 6.08, w: 12.15, h: 0.42, fontSize: 15.5, align: "center", valign: "middle" });
  bottomCheck("Roles rule", 6.5);
  sources(s, src(S18F, SCHP, SPSU));
  narrate(s,
`Leader / facilitator: convenes and runs the meeting; keeps discussion on the agenda; draws out quieter people and stops one voice dominating; ends the meeting when the agenda is done; focuses on process and need not be the person who called the meeting (18F; UPMC; Portland State); have a backup (18F). Timekeeper: tracks time on each item, warns when an item will run over, calls for the group to re-prioritize; supports the facilitator but doesn't replace them (Portland State). Note-taker: records decisions, action items, open questions and parking-lot items, not a transcript; checks the record and publishes it (UPMC; Portland State). Decision-maker: the person or people with authority to decide; if they aren't in the room, a "decide" item can't be decided (18F). Participants: arrive on time and prepared; listen; keep disagreement about ideas, not people; accept the group's decision (Portland State). Closer (optional): summarizes outcomes, confirms every action item has an owner and a date, sets up the next meeting; often the facilitator (Portland State).`,
  "Roles");
}

// ------------------------------------------------------------------ 12 Who
{
  const s = content(S_WHO, "Who's taking notes? Combining and rotating roles");
  tag(s, "Who");
  const w = CW(3, 0.25);
  card(s, "Mistake", 0.6, 1.5, w, 3.55, { icon: "FaTriangleExclamation", color: HEX.red, tint: HEX.redTint, heading: "The most common mistake",
    body: "18F calls failing to assign a note-taker the most common meeting mistake. Any attendee can fix it by asking.", size: 15 });
  card(s, "Combine", 0.6 + (w + 0.25), 1.5, w, 3.55, { icon: "FaUsersGear", color: HEX.teal, tint: HEX.tealTint, heading: "Combine roles in small meetings",
    body: ["In small or recurring meetings, one person can hold more than one role", "The facilitator as closer", "The note-taker as timekeeper"], size: 14 });
  card(s, "Rotate", 0.6 + 2 * (w + 0.25), 1.5, w, 3.55, { icon: "FaArrowsRotate", color: HEX.navy, tint: HEX.navyTint, heading: "Rotate roles across the team",
    body: "Rotating roles across the team spreads the skill.", size: 15 });
  callout(s, "FaAddressBook", HEX.teal, "Any attendee can ask:  ", "“Who's taking notes?”");
  sources(s, src(S18F, SPSU));
  narrate(s,
`18F calls failing to assign a note-taker the most common meeting mistake; any attendee can ask, "Who's taking notes?" In small or recurring meetings one person can hold more than one role (the facilitator as closer, the note-taker as timekeeper), and rotating roles across the team spreads the skill (Portland State).`,
  "Roles");
}

// ------------------------------------------------------------------ 13 How: the four-phase flow
{
  const s = content(S_HOW, "Four phases, one loop: before, during, close, after");
  tag(s, "How");
  const phases = [
    ["Before", HEX.navy, HEX.navyTint, ["Confirm it's needed, and its type", "Agenda and prep sent", "Roles assigned; right people invited"], "An agenda, and the right people"],
    ["During", HEX.teal, HEX.tealTint, ["Start on time", "Follow the agenda", "Park what doesn't fit; take notes"], "Discussion, decisions, a parking lot"],
    ["Close", HEX.amber, HEX.amberTint, ["The last few minutes, reserved", "Read back decisions and actions", "Route the parking lot"], "Every action with an owner and a date"],
    ["After", HEX.slate, HEX.grey, ["Notes sent the same day", "Stored in the team record", "Reviewed at the next meeting"], "A written record, carried forward"],
  ];
  const w = 2.6, gap = (12.15 - 4 * w) / 3, y = 1.5, h = 3.25;
  phases.forEach((p, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${p[0]} card`, x, y, w, h, p[2]);
    s.addShape(pres.shapes.RECTANGLE, { objectName: `${p[0]} band`, x, y, w, h: 0.55, fill: { color: p[1] }, line: { color: p[1] } });
    txt(s, `${p[0]} name`, p[0], { x, y, w, h: 0.55, fontSize: 18, bold: true, fontFace: "Cambria", color: "FFFFFF", align: "center", valign: "middle" });
    T(s, `${p[0]} steps`, bullets(p[3], 13), { x: x + 0.15, y: y + 0.7, w: w - 0.3, h: 1.55, paraSpaceAfter: 4 });
    T(s, `${p[0]} produces`, [{ text: "PRODUCES", options: { bold: true, color: p[1] === HEX.slate ? HEX.ink : p[1], fontSize: 11, charSpacing: 1, breakLine: true } },
      { text: p[4], options: { bold: true, color: HEX.ink, fontSize: 13 } }], { x: x + 0.15, y: y + 2.3, w: w - 0.3, h: 0.85 });
    if (i < 3) arrowR(s, `Flow arrow ${i}`, x + w + (gap - 0.34) / 2, y + h / 2 - 0.21);
  });
  // The loop back: down from After, across under the cards, up into Before.
  const bx = 0.6 + w / 2, ax = 0.6 + 3 * (w + gap) + w / 2, ly = 5.15;
  line(s, "Loop down", ax, y + h, 0, ly - (y + h), { color: HEX.teal });
  line(s, "Loop across", bx, ly, ax - bx, 0, { color: HEX.teal });
  line(s, "Loop up", bx, y + h, 0, ly - (y + h), { color: HEX.teal, beginArrowType: "triangle" });
  T(s, "Loop label", [{ text: "next agenda:  ", options: { bold: true, color: HEX.teal } }, { text: "open by reviewing the previous action items" }],
    { x: 2.5, y: ly + 0.08, w: 8.2, h: 0.4, fontSize: 14, align: "center", valign: "middle" });
  callout(s, "FaDoorClosed", HEX.amber, "The close is its own phase.  ",
    "Reserve the last few minutes on the agenda for it, and aim to end early.", 5.75, 0.78);
  sources(s, src(S18F, SCHP, SPSU));
  narrate(s,
`The guide's "Running the meeting" section has four parts: Before, During, Close and After. The lifecycle figure on slide 4 shows three (Before, During, After), with the close folded in; this flow splits it out. Before: confirm the meeting is needed and its type, send the agenda with preparation, assign roles, invite only the people needed. During: start on time, follow the agenda, use a parking lot, take useful notes. Close: reserve the last few minutes on the agenda and aim to end early (18F; UPMC); read back decisions and actions, route the parking lot. After: send notes the same day, store them in the team record, review the previous action items at the next meeting (18F). The "produces" lines summarize what each phase's steps yield, in the guide's terms.`,
  "Running the meeting");
}

// ------------------------------------------------------------------ 14 How: Before
{
  const s = content(S_HOW, "Before: confirm, write, assign, remind");
  tag(s, "How");
  const steps = [
    ["Confirm the meeting is needed, and its type", "Inform, discuss, or decide"],
    ["Write and send the agenda", "With the preparation material attached"],
    ["Assign the roles, and invite only the people the items need", "See the test on the right"],
    ["Shortly before, send a reminder with the agenda", "Arrive early and test the equipment"],
  ];
  steps.forEach((st, i) => {
    const y = 1.5 + i * 1.22;
    box(s, `Before ${i}`, 0.6, y, 7.0, 1.05, i % 2 ? HEX.navyTint : HEX.grey);
    num(s, i + 1, 0.8, y + 0.22, 0.6, HEX.navy);
    T(s, `Before ${i} text`, [{ text: st[0], options: { bold: true, color: HEX.navy, breakLine: true } }, { text: st[1], options: { color: HEX.ink, fontSize: 13.5 } }],
      { x: 1.6, y: y + 0.06, w: 5.85, h: 0.93, fontSize: 15, valign: "middle" });
  });
  bottomCheck("Before steps", 1.5 + 3 * 1.22 + 1.05);
  card(s, "Invite", 7.85, 1.5, 4.9, 4.71, { icon: "FaUserCheck", color: HEX.teal, tint: HEX.tealTint, heading: "Who belongs on the invitation",
    body: ["Those affected by a decision", "Those with the knowledge, resources, or authority it requires", "The decision-maker, for any “decide” item"], size: 15 });
  sources(s, src(S18F, SCHP));
  narrate(s,
`Before: (1) confirm the meeting is needed and its type; (2) write and send the agenda, with preparation material attached; (3) assign the roles and invite only the people the items need: those affected by a decision, and those with the knowledge, resources, or authority it requires (UPMC); (4) shortly before, send a reminder with the agenda; arrive early and test the equipment (18F). The decision-maker line comes from the Roles section: if they aren't in the room, a "decide" item can't be decided (18F), and the checklist's Before row includes "Decision-maker attending."`,
  "Running the meeting — Before");
}

// ------------------------------------------------------------------ 15 How: During (start, stay on track)
{
  const s = content(S_HOW, "Start on time, and stay on the agenda");
  tag(s, "How");
  const w = CW(3, 0.25), h = 4.9;
  card(s, "Start", 0.6, 1.5, w, h, { icon: "FaDoorOpen", color: HEX.teal, tint: HEX.tealTint, heading: "Start",
    body: ["On time, every time", "State the purpose, confirm the agenda, name the roles", "Point to the notes, slides, and chat in use"], size: 14 });
  card(s, "Ground rules", 0.6 + (w + 0.25), 1.5, w, h, { icon: "FaPeopleArrows", color: HEX.navy, tint: HEX.navyTint, heading: "Ground rules",
    body: ["Agree or restate them at the start", "Share air time: “take space, make space”", "Treat different perspectives as valuable"], size: 14 });
  card(s, "Track", 0.6 + 2 * (w + 0.25), 1.5, w, h, { icon: "FaRoute", color: HEX.amber, tint: HEX.amberTint, heading: "Stay on track",
    body: ["Follow the agenda; leave it only deliberately, for a set time", "Summarize as you go", "Point latecomers to the agenda and notes; don't recap for them"], size: 14 });
  sources(s, src(S18F, SCHP));
  narrate(s,
`Start: start on time, every time (18F). Open by stating the purpose, confirming the agenda, and naming the roles; point to the notes, slides, and chat in use. Agree or restate ground rules; the UPMC session's examples include sharing air time ("take space, make space") and treating different perspectives as valuable. Stay on track: follow the agenda and leave it only deliberately, for a set time (18F); summarize as you go (UPMC); point latecomers to the agenda and notes instead of recapping for them (18F).`,
  "Running the meeting — During (Start; Stay on track)");
}

// ------------------------------------------------------------------ 16 How: During (parking lot, notes)
{
  const s = content(S_HOW, "The parking lot, and notes worth keeping");
  tag(s, "How");
  const lw = 7.2;
  box(s, "Lot card", 0.6, 1.5, lw, 3.55, HEX.amberTint);
  icon(s, "FaFilter", 0.8, 1.68, 0.6, HEX.amber);
  T(s, "Lot head", "Use a parking lot", { x: 1.55, y: 1.66, w: lw - 1.1, h: 0.64, bold: true, color: HEX.amber, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  const lot = [["Off the agenda, or can't be settled in time", ""], ["Parked where all can see it", "Notes section or whiteboard corner"],
    ["Given an action", "Another group, a future agenda, or a small team"], ["Reviewed before the meeting ends", ""]];
  const sw = (lw - 0.4 - 3 * 0.42) / 4;
  lot.forEach((l, i) => {
    const x = 0.8 + i * (sw + 0.42);
    box(s, `Lot step ${i}`, x, 2.5, sw, 2.35, "FFFFFF", HEX.amber);
    T(s, `Lot step ${i} text`, l[1] ? [{ text: l[0], options: { bold: true, color: HEX.amber, breakLine: true } }, { text: l[1], options: { fontSize: 12, color: HEX.ink } }]
      : [{ text: l[0], options: { bold: true, color: HEX.amber } }], { x: x + 0.06, y: 2.55, w: sw - 0.12, h: 2.25, fontSize: 13.5, align: "center", valign: "middle" });
    if (i < 3) arrowR(s, `Lot arrow ${i}`, x + sw + 0.04, 3.46, HEX.amber);
  });
  bottomCheck("Lot card", 5.05);
  card(s, "Notes", 0.6 + lw + 0.25, 1.5, 12.15 - lw - 0.25, 3.55, { icon: "FaAddressBook", color: HEX.teal, tint: HEX.tealTint, heading: "Take useful notes",
    body: ["Capture meaning, not dialogue", "Decisions and assigned tasks first", "Leave gaps in fast discussion; fill them the same day"], size: 14 });
  callout(s, "FaArrowsRotate", HEX.amber, "Following up on the parking lot  ",
    "is what keeps people willing to park topics.");
  sources(s, src(S18F, SCHP));
  narrate(s,
`Parking lot: topics that are off the agenda, or can't be settled in the time available, go into a visible parking lot: a section of the notes or a corner of the whiteboard (18F). Give each entry an action (send to another group, add to a future agenda, assign to a small team), and review the parking lot before the meeting ends; following up on it is what keeps people willing to park topics (UPMC). Useful notes (18F): capture meaning, not dialogue; prioritize decisions and assigned tasks; leave gaps during fast discussion and fill them in the same day.`,
  "Running the meeting — During (Use a parking lot; Take useful notes)");
}

// ------------------------------------------------------------------ 17 How: Close
{
  const s = content(S_HOW, "Close: read back decisions, owners and dates");
  tag(s, "How");
  T(s, "Close lead", [{ text: "Reserve the last few minutes on the agenda for the close, ", options: { bold: true, color: HEX.amber } }, { text: "and aim to end early." }],
    { x: 0.6, y: 1.5, w: 12.15, h: 0.45, fontSize: 17, align: "center", valign: "middle" });
  const steps = ["Read back the decisions", "Read back each action item with its owner and due date", "Route each parking-lot item",
    "Ask what is missing, and what to change next time", "Set the next meeting, and its facilitator if needed"];
  const w = CW(5, 0.2);
  steps.forEach((t, i) => {
    const x = 0.6 + i * (w + 0.2);
    box(s, `Close ${i}`, x, 2.15, w, 2.9, i === 1 ? HEX.amberTint : HEX.grey, i === 1 ? HEX.amber : null);
    num(s, i + 1, x + (w - 0.6) / 2, 2.32, 0.6, HEX.amber);
    T(s, `Close ${i} text`, t, { x: x + 0.12, y: 3.05, w: w - 0.24, h: 1.85, fontSize: 15, bold: i === 1, color: i === 1 ? HEX.amber : HEX.ink, align: "center", valign: "top" });
  });
  bottomCheck("Close steps", 5.05);
  callout(s, "FaUserCheck", HEX.amber, "Each owner confirms it out loud.  ",
    "Every action item leaves the room with an owner and a due date.");
  sources(s, src(S18F, SCHP, SPSU));
  narrate(s,
`Close: reserve the last few minutes on the agenda for the close, and aim to end early (18F; UPMC). (1) Read back the decisions. (2) Read back each action item with its owner and due date, and have each owner confirm it out loud (Portland State). (3) Route each parking-lot item. (4) Ask what is missing, and what to change about the meeting next time (UPMC). (5) Set the next meeting and its facilitator if one is needed (Portland State).`,
  "Running the meeting — Close");
}

// ------------------------------------------------------------------ 18 How: After
{
  const s = content(S_HOW, "After: notes the same day, no meeting after");
  tag(s, "How");
  const w = CW(3, 0.25), h = 2.75;
  card(s, "Send", 0.6, 1.5, w, h, { icon: "FaClipboardCheck", color: HEX.teal, tint: HEX.tealTint, heading: "Send the same day",
    body: "Notes and action items in writing, with owners and dates.", size: 15 });
  card(s, "Store", 0.6 + (w + 0.25), 1.5, w, h, { icon: "FaDatabase", color: HEX.navy, tint: HEX.navyTint, heading: "Store, and correct in the open",
    body: "Where the team keeps its records; any correction visible to everyone who attended.", size: 15 });
  card(s, "Review", 0.6 + 2 * (w + 0.25), 1.5, w, h, { icon: "FaArrowsRotate", color: HEX.amber, tint: HEX.amberTint, heading: "Review at the next meeting",
    body: "Open the next meeting by reviewing the previous action items.", size: 15 });
  callout(s, "FaLaptop", HEX.red, "Avoid the “meeting after the meeting.”  ",
    "Decisions made in the hallway exclude remote attendees and never reach the notes.", 4.55, 1.35);
  sources(s, src(S18F, SPSU));
  narrate(s,
`After: send the notes and action items in writing, with owners and dates, the same day (18F). Store the notes where the team keeps its records, and make any correction visible to everyone who attended (Portland State). Open the next meeting by reviewing the previous action items (18F). Avoid the "meeting after the meeting": decisions made in the hallway exclude remote attendees and never reach the notes (18F).`,
  "Running the meeting — After");
}

// ------------------------------------------------------------------ 19 How: agenda template
{
  const s = content(S_HOW, "Template: the agenda");
  tag(s, "How");
  const hdr = [
    [bold("Meeting"), "<specific title, e.g. “Wave 2 cutover go/no-go”>"],
    [bold("Date / time / length"), "<date>  <start>–<end>  (<15 | 45 | …> min)"],
    [bold("Location / bridge"), "<room, link, dial-in>"],
    [bold("Purpose"), "<one sentence>"],
    [bold("Expected outcomes"), "<decisions to make, outputs to produce>"],
    [bold("Notes kept at"), "<link>"],
  ];
  table(s, "Agenda header", ["Field", "Fill in"], hdr, [2.35, 5.0], [0.36, 0.34, 0.34, 0.34, 0.34, 0.34, 0.34], { fontSize: 12 });
  table(s, "Agenda roles", ["Role", "Name"], [[bold("Facilitator", HEX.teal), "<name>"], [bold("Timekeeper", HEX.teal), "<name>"],
    [bold("Note-taker", HEX.teal), "<name>"], [bold("Decision-maker(s)", HEX.amber), "<name(s)>"]],
  [2.4, 2.15], [0.36, 0.34, 0.34, 0.34, 0.34], { x: 8.2, fontSize: 12 });
  T(s, "Agenda roles note", "Every role named before the meeting.", { x: 8.2, y: 3.35, w: 4.55, h: 0.35, fontSize: 12, italic: true, color: HEX.slate });
  const items = [
    ["1", "Review open action items", "Inform", "<name>", "5", "Last notes"],
    ["2", "<question>?", "Decide", "<name>", "15", "<doc link>"],
    ["3", "<question>?", "Discuss", "<name>", "10", "–"],
    ["4", "Close: decisions, actions, parking lot", "–", "Facilitator", "5", "–"],
  ];
  table(s, "Agenda items", ["#", "Item (as a question)", "Type", "Owner", "Min", "Prep"],
    items.map((r, i) => r.map((c, j) => (j === 1 && (i === 0 || i === 3) ? bold(c, i === 3 ? HEX.amber : HEX.teal) : { text: c }))),
    [0.5, 5.2, 1.4, 1.85, 0.9, 2.3], [0.36, 0.36, 0.36, 0.36, 0.36], { y: 4.1, fontSize: 12.5 });
  T(s, "Agenda note", [{ text: "Opens with the open action items; ends with a reserved close.  ", options: { bold: true, color: HEX.navy } },
    { text: "Item 4 is the close, five minutes, run by the facilitator." }], { x: 0.6, y: 5.98, w: 12.15, h: 0.5, fontSize: 14, align: "center", valign: "middle" });
  bottomCheck("Agenda note", 6.48);
  sources(s, src("Templates: Agenda (the guide's design guidance, drawing on 18F and Portland State)"));
  narrate(s,
`The guide's agenda template, reproduced field for field. Header: MEETING (a specific title, e.g. "Wave 2 cutover go/no-go"); date / time / length (15, 45, … min); location / bridge (room, link, dial-in); purpose (one sentence); expected outcomes (decisions to make, outputs to produce); notes kept at (link). Roles: facilitator, timekeeper, note-taker, decision-maker(s). Items: number, item (as a question), type, owner, minutes, prep. Example rows: 1 Review open action items, Inform, 5 min, prep "Last notes"; 2 a question, Decide, 15 min, doc link; 3 a question, Discuss, 10 min; 4 Close: decisions, actions, parking lot, run by the facilitator, 5 min. The template is the guide's own; its fields follow 18F's agenda header and Portland State's toolbox.`,
  "Templates — Agenda");
}

// ------------------------------------------------------------------ 20 How: notes template
{
  const s = content(S_HOW, "Template: notes and action items");
  tag(s, "How");
  table(s, "Notes header", ["Field", "Fill in"], [
    [bold("Meeting / date"), "<title>  ·  <date>"],
    [bold("Attendees / absent"), "<names>  ·  <names>"],
    [bold("Roles"), "Facilitator / Timekeeper / Note-taker: <names>"],
  ], [2.1, 3.85], [0.36, 0.34, 0.34, 0.55], { fontSize: 12 });
  table(s, "Decisions", ["#", "Decision", "Decided by (name / method)"], [["D1", "<decision>", "<name / method>"]],
    [0.5, 2.85, 2.6], [0.36, 0.34], { y: 3.2, fontSize: 12 });
  table(s, "Open questions", ["Open question", "Who will answer, by when"], [["<question>", "<who>, <by when>"]],
    [2.95, 3.0], [0.36, 0.34], { y: 4.05, fontSize: 12 });
  const rx = 6.8;
  table(s, "Actions", ["#", "What", "Owner", "Due", "Status"], [["A1", "<deliverable>", "<name>", "<date>", "Open"], ["A2", "<deliverable>", "<name>", "<date>", "Open"]],
    [0.55, 2.2, 1.1, 1.1, 1.0], [0.36, 0.34, 0.34], { x: rx, fontSize: 12 });
  table(s, "Parking lot", ["Parking-lot item", "Route to"], [["<item>", "<group / future agenda / owner>"]],
    [2.15, 3.8], [0.36, 0.34], { x: rx, y: 2.75, fontSize: 12 });
  box(s, "Next meeting", rx, 3.65, 5.95, 0.65, HEX.navyTint);
  T(s, "Next meeting text", [{ text: "NEXT MEETING:  ", options: { bold: true, color: HEX.navy } }, { text: "<date>     " }, { text: "Facilitator:  ", options: { bold: true, color: HEX.navy } }, { text: "<name>" }],
    { x: rx + 0.2, y: 3.65, w: 5.6, h: 0.65, fontSize: 13.5, valign: "middle" });
  callout(s, "FaClipboardCheck", HEX.teal, "Decisions, actions, parking lot, open questions.  ",
    "Not a transcript: what was decided, who does what by when, and what is still open.", 4.95, 1.2);
  sources(s, src("Templates: Notes and action items (the guide's design guidance, drawing on 18F, UPMC and Portland State)"));
  narrate(s,
`The guide's notes and action-items template, field for field. Header: MEETING and DATE; attendees and absent; facilitator / timekeeper / note-taker. DECISIONS: D1, the decision, decided by name or method. ACTION ITEMS: number, what, owner, due, status (A1, a deliverable, owner, date, Open). PARKING LOT: item, and where it is routed (group, future agenda, or owner). OPEN QUESTIONS: the question, and who will answer by when. NEXT MEETING: date and facilitator. The sections mirror the note-taker's role: decisions, action items, open questions and parking-lot items, not a transcript (UPMC; Portland State).`,
  "Templates — Notes and action items");
}

// ------------------------------------------------------------------ 21 How: checklist
{
  const s = content(S_HOW, "The one-page checklist");
  tag(s, "How");
  const rows = [
    ["Before", HEX.navy, "Is a meeting needed?  ·  Type of each item set  ·  Agenda with owners, times, prep sent ≥ 1 day ahead  ·  Roles assigned  ·  Decision-maker attending  ·  Only needed people invited"],
    ["Start", HEX.teal, "On time  ·  Purpose, agenda, roles confirmed  ·  Ground rules  ·  Notes and parking lot visible"],
    ["During", HEX.teal, "Agenda followed  ·  Time tracked per item  ·  Quiet voices drawn in  ·  No work done in the room  ·  Off-topic items parked"],
    ["Close", HEX.amber, "Decisions read back  ·  Every action has an owner and a date  ·  Parking lot routed  ·  “What would we change?”  ·  Ended on time or early"],
    ["After", HEX.slate, "Notes sent same day  ·  Stored in the team record  ·  Actions reviewed at the next meeting"],
  ];
  table(s, "Checklist", ["Phase", "Check"], rows.map((r) => [bold(r[0], r[1] === HEX.slate ? HEX.ink : r[1]), r[2]]),
    [1.6, 10.55], [0.42, 0.85, 0.6, 0.85, 0.85, 0.6], { fontSize: 14 });
  T(s, "Checklist note", [{ text: "The whole guide on one page.  ", options: { bold: true, color: HEX.navy } }, { text: "Each check points back to a section: the agenda, the roles, the parking lot, the close." }],
    { x: 0.6, y: 5.85, w: 12.15, h: 0.55, fontSize: 15, align: "center", valign: "middle" });
  bottomCheck("Checklist note", 6.4);
  sources(s, src("One-page checklist (the guide's summary of the sections above)"));
  narrate(s,
`The guide's one-page checklist, reproduced row for row. Before: is a meeting needed; type of each item set; agenda with owners, times, prep sent at least one day ahead; roles assigned; decision-maker attending; only needed people invited. Start: on time; purpose, agenda, roles confirmed; ground rules; notes and parking lot visible. During: agenda followed; time tracked per item; quiet voices drawn in; no work done in the room; off-topic items parked. Close: decisions read back; every action has an owner and a date; parking lot routed; "What would we change?"; ended on time or early. After: notes sent same day; stored in the team record; actions reviewed at the next meeting.`,
  "One-page checklist");
}

// ------------------------------------------------------------------ 22 How: further reading and close
{
  const s = content(S_HOW, "Further reading, and the standard in one line");
  tag(s, "How");
  const w = CW(2, 0.25);
  card(s, "Grove", 0.6, 1.5, w, 2.55, { icon: "FaBook", color: HEX.navy, tint: HEX.navyTint, heading: "Andrew S. Grove, High Output Management",
    body: "Vintage, 1995 edition. Grove's own account of managing at Intel, including a chapter on meetings.", size: 15, headH: 0.8 });
  card(s, "Herold", 0.6 + w + 0.25, 1.5, w, 2.55, { icon: "FaBook", color: HEX.teal, tint: HEX.tealTint, heading: "Cameron Herold, Meetings Suck",
    body: "Lioncrest Publishing, 2016. The source of the roles and meeting types in Portland State's toolbox.", size: 15, headH: 0.8 });
  callout(s, "FaListCheck", HEX.navy, "The standard:  ",
    "a real agenda, named roles, a parking lot, and written action items with owners and dates.", 4.35, 1.2);
  T(s, "Live guide", [{ text: "The guide, with every footnote:  ", options: { bold: true, color: HEX.navy } },
    { text: "whalermike.github.io/modernization-workbook/docs/books/guides/effective-meetings.html" }],
  { x: 0.6, y: 5.8, w: 12.15, h: 0.5, fontSize: 14, align: "center", valign: "middle" });
  bottomCheck("Live guide", 6.3);
  sources(s, src("Further reading", SPSU));
  narrate(s,
`Further reading from the guide: Andrew S. Grove, High Output Management (Vintage, 1995 edition), Grove's own account of managing at Intel, including a chapter on meetings; Cameron Herold, Meetings Suck (Lioncrest Publishing, 2016), the source of the roles and meeting types in Portland State's toolbox. The one-line standard is the guide's own description: a real agenda, named roles, a parking lot, and written action items with owners and dates. This is a companion guide, not part of a numbered book.`,
  "Further reading");
}

// ------------------------------------------------------------------ Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: the guide's four references");
  const list = [
    "18F, U.S. General Services Administration, “How to run an efficient meeting,” December 14, 2016, archived on the 18F blog, https://blog.18f.org/2016/12/14/how-to-run-an-efficient-meeting/ (accessed Oct 21, 2026).",
    "Dianna Ploof, EdD, “Making Meetings More Effective,” Department of Pediatrics Faculty Development, UPMC Children's Hospital of Pittsburgh, August 4, 2016, https://www.chp.edu/-/media/chp/healthcare-professionals/documents/faculty-development/making-meetings-effective-handout.pdf (accessed Oct 21, 2026).",
    "Gerald Recktenwald, “Supplemental Notes: A Meeting Toolbox,” Portland State University, January 4, 2018, https://web.cecs.pdx.edu/~gerry/class/ME492/notes/pdf/meeting_toolbox.pdf (accessed Oct 21, 2026).",
    "Nagesh Belludi, “How to … Deal with Meetings That Get Derailed,” Right Attitudes, January 26, 2023, https://www.rightattitudes.com/2023/01/26/dealing-with-meetings-that-get-derailed/ (accessed Oct 21, 2026).",
  ];
  T(s, "Source list", bullets(list, 14), { x: 0.6, y: 1.5, w: 12.1, h: 4.9, paraSpaceAfter: 10 });
}
{
  const s = content("Backup", "Sources by section");
  const rows = [
    ["Why meetings matter", "The guide's framing; Belludi (Intel, Grove); 18F; UPMC; Portland State", "2–4"],
    ["Is a meeting needed at all?", "18F (the test); UPMC (reasons for meeting); the working rule is the guide's design guidance", "5–6"],
    ["The three kinds of meeting", "Portland State, drawing on Herold, Meetings Suck (types and both warnings)", "7–8"],
    ["The agenda", "18F (content and end, type, header, sending, length, headcount); UPMC (items as questions); Portland State (title, one page, sending)", "9–10"],
    ["Roles", "18F (facilitator, backup, decision-maker, note-taker mistake); UPMC; Portland State (timekeeper, participants, closer, combining, rotating)", "11–12"],
    ["Running the meeting", "18F (before, start, stay on track, parking lot, notes, after); UPMC (invitees, ground rules, parking-lot follow-up, close); Portland State (close, after)", "13–18"],
    ["Templates and checklist", "The guide's own templates and checklist, summarizing the sections above", "19–21"],
    ["Further reading", "Grove, High Output Management (1995 ed.); Herold, Meetings Suck (2016)", "22"],
  ];
  table(s, "By section", ["Guide section", "Sources", "Slides"], rows.map((r) => [bold(r[0]), r[1], r[2]]),
    [2.9, 8.15, 1.1], [0.38, 0.4, 0.58, 0.4, 0.58, 0.58, 0.58, 0.4, 0.4], { fontSize: 12 });
}
{
  const s = content("Backup", "Further reading and the live guide");
  const list = [
    "Andrew S. Grove, High Output Management (Vintage, 1995 edition): Grove's own account of managing at Intel, including a chapter on meetings.",
    "Cameron Herold, Meetings Suck (Lioncrest Publishing, 2016): the source of the roles and meeting types in Portland State's toolbox.",
    "Federal Modernization Workbook, companion guide, “Effective Meetings — Purpose, Agenda, Roles, and Follow-Through,” https://whalermike.github.io/modernization-workbook/docs/books/guides/effective-meetings.html (every claim footnoted; agenda and notes templates as plain text).",
    "Figure on slide 4: the guide's committed lifecycle diagram, docs/images/diagrams/guides/ (Before, During, After, with the loop back labeled “next agenda”).",
  ];
  T(s, "Reading list", bullets(list, 14), { x: 0.6, y: 1.5, w: 12.1, h: 4.9, paraSpaceAfter: 10 });
}

// ---------------------------------------------------------------- narration.json must match the narrated slides
{
  const narrated = titles.slice(0, titles.indexOf("Backup"));
  if (NARR.length !== narrated.length) console.warn(`  ! narration.json has ${NARR.length} entries for ${narrated.length} narrated slides`);
  let said = 0;
  const per = NARR.map((e, i) => {
    if (e.slide !== i + 1) console.warn(`  ! narration.json entry ${i} is numbered ${e.slide}`);
    if (e.title !== narrated[i]) console.warn(`  ! narration.json slide ${i + 1} title ${JSON.stringify(e.title)} doesn't match ${JSON.stringify(narrated[i])}`);
    if (/UIAO/.test(e.say)) console.warn(`  ! narration.json slide ${i + 1} names a forbidden term`);
    const n = e.say.split(/\s+/).filter(Boolean).length; said += n; return n;
  });
  console.log(`narration.json: ${said} words (${per.join(", ")}), about ${mmss((said * 60) / 160)} at 160 wpm`);
}

console.log(`slides: ${pres.slides.length} (${titles.indexOf("Backup")} narrated)`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
