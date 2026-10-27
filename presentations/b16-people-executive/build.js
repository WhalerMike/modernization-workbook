// Book 16 — People: Training & Education: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: the CIO, the chief human capital officer and HR leadership, the CISO, workforce and training leads, and
// the program's sponsors. Decision-centered: every decision slide states the decision, its owner and when it's needed.
// No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B16_People_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b16-people/, named in the notes. Decision owners come from
// the book's responsibility matrix (Chapter 08) and the gate criteria in Chapters 01, 08 and 10; where an owner or a
// timing is the program's own design, or our inference, the notes say so.
// Diagrams are the committed PNGs in docs/images/diagrams/b16-people/png/; alt text is read from the chapters' fig-alt.
// The spoken narration lives in narration.json; the speaker notes carry the full detail for a live delivery.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 16", title: "People & Training: the executive briefing",
  footer: "Federal Modernization Workbook  ·  Book 16 People: Training & Education  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B16_People_Executive.pptx";

// Speaker notes with a timing cue worked out from the spoken words at about 142 words a minute,
// so the cues stay right when a slide's notes are edited. The "Workbook:" line isn't spoken.
const WPM = 142;
let clock = 0, spoken = 0;
const mmss = (sec) => { const t = Math.round(sec); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
const perSlide = [];
const narrate = (s, body, ref) => {
  if (!/^Book 16, Chapter \d\d/.test(ref)) console.warn(`  ! slide ${pres.slides.length} Workbook line doesn't start "Book 16, Chapter NN": ${ref}`);
  const words = body.split(/\s+/).filter(Boolean).length;
  const start = clock;
  clock += (words * 60) / WPM;
  spoken += words;
  perSlide.push(words);
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};

// ---------------------------------------------------------------- checks (print "!" on a likely problem)
// Titles stay at or under 58 characters and are unique; Sources lines stay at or under 185 characters.
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) console.warn(`  ! title over 58 characters (${t.length}): ${t}`);
  if (titles.includes(t)) console.warn(`  ! duplicate title: ${t}`);
  titles.push(t);
  return t;
};
const content = (sec, t) => D.content(sec, checkTitle(t));
// Lines a string needs in a box w inches wide at pt points: greedy word wrap at about half an em per character.
const lines = (text, w, pt) => {
  const per = Math.max(4, Math.floor(w / (0.5 * pt / 72)));
  let n = 1, cur = 0;
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const len = word.length;
    if (cur === 0) cur = len;
    else if (cur + 1 + len <= per) cur += 1 + len;
    else { n += 1; cur = len; }
  }
  return n;
};
const lh = (pt) => (pt / 72) * 1.2;
const need = (items, w, pt, gap) => items.reduce((h, t) => h + lines(t, w, pt) * lh(pt) + (gap || 0) / 72, 0);
const fit = (where, h, has) => { if (h > has + 0.02) console.warn(`  ! slide ${pres.slides.length} ${where} may overflow: needs ${h.toFixed(2)} in, has ${has.toFixed(2)}`); };
const sources = (s, text) => {
  if (text.length > 185) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return D.sources(s, text);
};

// ---------------------------------------------------------------- layout helpers (as in the Book 14 briefing)
// The decision bar: every decision slide states the decision, its owner and when it's needed.
const decision = (s, what, owner, when) => {
  const y = 5.3, h = 1.2;
  box(s, "Decision bar", 0.6, y, 12.15, h, "FFFFFF", HEX.amber);
  icon(s, "FaScaleBalanced", 0.82, y + 0.25, 0.7, HEX.amber);
  const col = (name, x, w, label, text, color) => {
    fit(`${name} column`, lh(11) + lines(text, w - 0.05, 14.5) * lh(14.5), h - 0.16);
    txt(s, name, [
      { text: label, options: { bold: true, color, fontSize: 11, charSpacing: 1, breakLine: true } },
      { text, options: { fontSize: 14.5, color: HEX.ink } },
    ], { x, y: y + 0.08, w, h: h - 0.16, valign: "middle" });
  };
  col("Decision", 1.75, 6.55, "DECISION", what, HEX.amber);
  col("Owner", 8.5, 2.1, "OWNER", owner, HEX.teal);
  col("When", 10.7, 1.95, "WHEN", when, HEX.navy);
};
// Three tinted cards across the slide, each with an icon, a heading and a bullet list.
const cards = (s, prefix, list, size) => list.forEach((c, i) => {
  const x = 0.6 + i * 4.1, pt = size || 13.5;
  box(s, `${prefix} card ${i + 1}`, x, 1.5, 3.95, 3.6, c[3]);
  icon(s, c[0], x + 0.22, 1.65, 0.62, c[2]);
  txt(s, `${prefix} head ${i + 1}`, c[1], { x: x + 1.0, y: 1.65, w: 2.8, h: 0.62, bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  fit(`${prefix} card ${i + 1}`, need(c[4], 3.5 - 0.3, pt, 6), 2.6);
  txt(s, `${prefix} text ${i + 1}`, bullets(c[4], pt), { x: x + 0.25, y: 2.42, w: 3.5, h: 2.6, paraSpaceAfter: 6 });
});
// A labeled list of tinted rows down the left of the slide (w inches wide).
const rows = (s, prefix, label, list, top, step, h, w) => {
  const rw = w || 6.2;
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.5, w: rw, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, rw, h, i % 2 ? HEX.navyTint : HEX.grey);
    fit(`${prefix} row ${i + 1}`, lines(`${j[0]}    ${j[1]}`, rw - 0.35, 14) * lh(14), h);
    txt(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: rw - 0.3, h, fontSize: 14, valign: "middle" });
  });
  if (top + (list.length - 1) * step + h > 5.14) console.warn(`  ! slide ${pres.slides.length} ${prefix} rows run into the decision bar`);
};
// A tinted box with an icon, a heading and a bullet list; x and w default to the right-hand column (7.75 to 12.75).
const sideBox = (s, prefix, iconName, color, tint, heading, list, size, x, w) => {
  const bx = x != null ? x : 7.75, bw = w || 5.0, pt = size || 13.5;
  box(s, `${prefix} box`, bx, 1.5, bw, 3.6, tint);
  icon(s, iconName, bx + 0.25, 1.66, 0.6, color);
  fit(`${prefix} heading`, lines(heading, bw - 1.1, 17) * lh(17), 0.62);
  txt(s, `${prefix} head`, heading, { x: bx + 1.0, y: 1.66, w: bw - 1.1, h: 0.6, bold: true, color, fontSize: 17, fontFace: "Cambria", valign: "middle" });
  fit(`${prefix} list`, need(list, bw - 0.4 - 0.3, pt, 6), 2.62);
  txt(s, `${prefix} list`, bullets(list, pt), { x: bx + 0.25, y: 2.4, w: bw - 0.4, h: 2.62, paraSpaceAfter: 6 });
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });
// A table on the left (x 0.6) with a navy header row; warns when its estimated height runs past the bottom.
const leftTable = (s, header, body, colW, rowH, fontSize, bottom) => {
  const pt = fontSize || 12.5;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const est = [header, ...body.map((r) => r.map(cellText))].reduce((h, r, k) =>
    h + Math.max(rowH[k] || rowH[rowH.length - 1], Math.max(...r.map((c, j) => lines(c, colW[j] - 0.2, pt))) * lh(pt) + 0.1), 0);
  fit("table", 1.5 + est, bottom || 5.12);
  s.addTable([head(header), ...body], tableOpts(colW, { y: 1.5, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};

// Alt text for each committed diagram, taken from the fig-alt attribute in the chapter that shows it.
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b16-people");
const ALT = {};
for (const f of fs.readdirSync(BOOK).filter((n) => /^\d\d-.*\.md$/.test(n))) {
  const t = fs.readFileSync(path.join(BOOK, f), "utf8");
  for (const m of t.matchAll(/svg\/([\w-]+)\.svg\)\{[^}]*?fig-alt="([^"]+)"/g)) ALT[m[1]] = m[2];
}
// A committed diagram placed inside a box, keeping the PNG's aspect ratio (read from its header), centered across maxW.
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b16-people", "png");
const img = (s, name, x, y, maxW, maxH) => {
  const alt = ALT[name];
  if (!alt) throw new Error(`no fig-alt found in the chapters for ${name}`);
  const file = path.join(DIAG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  if (y + h > 5.14) console.warn(`  ! slide ${pres.slides.length} ${name} image runs into the decision bar: bottom ${(y + h).toFixed(2)}`);
  if (process.env.FIT) console.log(`  image ${name}: ${w.toFixed(2)} x ${h.toFixed(2)} at x ${(x + (maxW - w) / 2).toFixed(2)}`);
  return { w, h };
};

const S_WHY = "Why people close the gap", S_WHAT = "What the curriculum teaches", S_WHO = "Who owns readiness", S_HOW = "How to run and measure it";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide(S_WHY, checkTitle("People & Training: the executive briefing"), "Book 16  ·  People, not tools, close the gap");
  D.agenda(s, 0.8, 4.82, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 30-minute briefing for the CIO, the chief human capital officer and HR leadership, the CISO, workforce and training leads, and sponsors", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.45, w: 10.5, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 16 of the Federal Modernization Workbook, People: Training and Education. It runs about thirty minutes, for the people who fund, staff and answer for the workforce side of the modernization: the CIO, the chief human capital officer and HR leadership, the CISO, the workforce and training leads, and the program's sponsors.

The argument fits in three sentences. Every earlier book changes what someone does, and while tools enforce the new rules, people make the decisions those rules depend on. A program that trains last pays twice, and it falls behind federal training requirements the agency already has. And readiness is something the program measures and evidences at every gate, with one owner for every decision.

I'll take four questions: why people, not tools, close the gap, and what federal workforce rules require; what the curriculum teaches, from the tracks and labs to the help desk and every user; who owns workforce readiness; and how to run the curriculum on the roadmap, keep the knowledge, and measure readiness. Every decision slide names the decision, its owner and when it's needed. Where an owner or a timing is the program's own design rather than a federal assignment, or our inference, the notes say so. Federal, NIST, Microsoft and vendor facts were checked by the book on October 21 and 22, 2026.`,
  "Book 16, Chapter 01 — People, Not Tools, Close the Gap; Chapter 08 — Who Owns Workforce Readiness; Book 16 index.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "The tools enforce; people make the decisions");
  tag(s, "Why");
  img(s, "ch01-people-close-the-gap", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Decide", "FaUserCheck", HEX.navy, HEX.navyTint, "Five decisions that now carry the risk", [
    "Is the caller who they say they are?",
    "Is the access request justified?",
    "Is the drift fixed, accepted or escalated?",
    "Is the exception still needed?",
    "Is the evidence complete for the AO?",
  ], 13.5, 7.1, 5.65);
  decision(s, "Add a training-readiness check, measured against a roster, to every gate from G0 to G5",
    "Program office", "From G0 (design)");
  sources(s, "Sources: Book 16, Chapters 01 and 08; Book 01, Chapter 12 (gates G0 to G5). The five decisions and the gate training check are program design.");
  narrate(s,
`A Conditional Access policy can require phishing-resistant sign-in for every user. It can't decide what happens when a caller tells the help desk their security key is lost, they're traveling, and they need to sign in now. A drift check can find a server that has left its baseline; it can't tell the change board whether the exception behind it was ever approved. The tool enforces a rule, and a person decides whether the rule still means anything.

The book's position, as design, is that the target estate moves risk from configuration to judgment. The old estate's risk sat in settings, like a domain admin group with forty members. The target removes most of those and leaves fewer human decisions that carry more weight: whether a caller is who they say, whether an access request is justified, whether a drift finding is fixed, accepted or escalated, whether an exception is still needed, and whether the evidence is complete before it goes to the authorizing official. A person who doesn't know the new rule falls back on the old habit, a source of drift no drift check can see until after the fact.

The decision, in the program's design: the program office, which owns the gate checklists, puts a training-readiness criterion measured against a roster into every gate from G0 to G5, next to the technical exit criteria.`,
  "Book 16, Chapter 01 — People, Not Tools, Close the Gap (Tools enforce; people decide; Training is part of each gate's readiness); Chapter 08 (The program office; responsibility matrix: training criteria in gate and wave checklists).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "Every book moves a decision to someone new");
  tag(s, "Why");
  rows(s, "Moves", "WHOSE WORK CHANGES, AND HOW (BOOKS 00 TO 15)", [
    ["Help desk", "Verifies, executes and escalates; never decides"],
    ["Administrators", "Activate roles just in time instead of holding them"],
    ["Owners and HR", "Owners approve access; HR keeps source data right"],
    ["ISSOs", "Assemble evidence from the systems that produce it"],
    ["Every user", "Signs in with a PIV card, Windows Hello or a passkey"],
  ], 1.88, 0.64, 0.56, 6.9);
  sideBox(s, "Patterns", "FaPeopleArrows", HEX.teal, HEX.tealTint, "Two patterns in every book", [
    "Jobs split into deciding and doing",
    "So two people now need each procedure",
    "Decisions move to people outside IT",
    "They need short training on one decision",
  ], 13.5, 7.75, 5.0);
  decision(s, "Draft the roster of every person whose work changes, built from HR and identity records",
    "CHCO's office (the roster's facts)", "Before G0");
  sources(s, "Sources: Book 16, Chapter 01 (What each book changes) and Appendix A; Chapter 08 (responsibility matrix: role rosters). Roles drawn from Books 00 to 15.");
  narrate(s,
`The workbook's books are organized around technology, but each one moves a decision from one person to another, or from a habit to a rule. The help desk verifies identity before every reset and executes approved requests instead of deciding them. Administrators activate privileged roles just in time instead of holding them. Application owners approve access instead of inheriting it, and HR keeps personnel data correct at the source, because accounts are now created, changed and disabled from it. ISSOs assemble evidence from the systems that produce it. And every user signs in with a PIV card, Windows Hello or a passkey.

Two patterns run through all of it. Almost every row splits a job that one person used to do into deciding and doing. Splitting the job is the control, and it also means two people now need to know the procedure where one used to. And many rows move a decision to people outside IT: HR staff, application owners, contracting officer's representatives, records officers. They need short, specific training on the one decision that is now theirs.

Every row is someone who needs to learn something before their part of the estate moves. The decision, from the G0 criteria: the role roster of every person whose work changes is drafted before G0, built from HR and identity records. In the book's matrix the CHCO's office decides the roster's facts and identity engineering joins them to role assignments.`,
  "Book 16, Chapter 01 (What each book changes in people's work; Training is part of each gate's readiness: G0); Chapter 08 (responsibility matrix: role rosters from HR and identity records); Appendix A.");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "Training scheduled last is paid for twice");
  tag(s, "Why");
  cards(s, "Twice", [
    ["FaTriangleExclamation", "First, at cutover", HEX.red, HEX.redTint, ["Untrained users call the help desk", "The desk turns callers away, or resets without the checks", "Admins ask for standing roles “until it settles”", "Exceptions granted under pressure stay"]],
    ["FaArrowsRotate", "Then, afterward", HEX.amber, HEX.amberTint, ["Workarounds found and removed", "People retrained; habits unlearned", "Unlearning is slower than learning", "A gap in the training evidence to explain"]],
    ["FaLandmark", "The rules say before", HEX.navy, HEX.navyTint, ["5 CFR 930.301: train on significant change", "AT-2 and AT-3: when system changes require", "A-130: role training before access", "IR-2 and CP-3: the same trigger"]],
  ], 13);
  decision(s, "Fund the learning program from a named budget, as part of the modernization",
    "Sponsor and CIO", "Before G0");
  sources(s, "Sources: 5 CFR 930.301; NIST SP 800-53 Rev. 5 (AT-2, AT-3, IR-2, CP-3); OMB Circular A-130, Appendix I; NIST SP 800-50 Rev. 1. Book 16, Chapters 01 and 08.");
  narrate(s,
`Many programs schedule training at the end: build the target, migrate the users, then train. The book's observation is that this is paid for twice.

The first payment comes at cutover. Users who haven't been taught the new sign-in call the help desk. A help desk that hasn't been taught the new verification procedure either refuses legitimate callers or resets accounts without the checks meant to stop impersonation. Administrators who haven't practiced just-in-time activation ask for standing roles until things settle. Each workaround is a small exception, and exceptions granted under pressure during a wave tend to stay.

The second payment comes afterward: the workarounds found and removed, people retrained, and habits unlearned, which is slower than learning. Meanwhile the training evidence has a gap someone has to explain.

Federal rules already put training first. OPM's rule requires training whenever there is a significant change in the system environment or procedures. SP 800-53 asks for literacy and role-based training when system changes require it, and IR-2 and CP-3 carry the same trigger. Circular A-130 requires role-based training before authorizing access. So training last also leaves the agency behind requirements it already has.

The decision: the sponsor and CIO fund the learning program as part of the modernization, before G0. The book's matrix gives them learning program funding and staffing, and SP 800-50 Rev. 1 notes that leaders need to know which budget training comes from.`,
  "Book 16, Chapter 01 (Why training last costs twice); Chapter 08 (The executive sponsor and the CIO; responsibility matrix: learning program funding and staffing; Readiness is an input to every gate: G0).");
}

// ------------------------------------------------------------------ Why 4
{
  const s = content(S_WHY, "What federal workforce rules actually require");
  tag(s, "Why");
  const srcs = [
    ["FISMA (2014)", "Trained personnel sufficient to comply; awareness for all, contractors included"],
    ["Workforce Assessment Act (2015)", "Identify every position doing cyber work, and code it"],
    ["OMB A-130 (2016)", "CHCO and CIO set competency requirements; workforce planning"],
    ["5 CFR 930.301 (2004)", "Awareness before access and yearly; training on significant change"],
    ["OPM coding (2017, 2022)", "Three-digit codes on position descriptions"],
    ["NICE, SP 800-181 Rev. 1", "The vocabulary: 42 work roles in v2.2.0 (guidance)"],
  ];
  leftTable(s, ["Source", "What it asks for"], srcs.map((r) => [bold(r[0]), { text: r[1] }]), [2.35, 4.55], [0.34, 0.5], 12);
  sideBox(s, "Not", "FaFilter", HEX.red, HEX.redTint, "What they don't require", [
    "No civilian rule requires a certification",
    "The only “annual” is the awareness floor",
    "NICE is guidance; coding positions is the mandate",
    "DoD 8140 doesn't apply to civilian agencies",
  ], 13.5, 7.75, 5.0);
  decision(s, "Set competency requirements jointly, and feed the program's new roles into the workforce plan",
    "CHCO with the CIO", "As roles change (design)");
  sources(s, "Sources: 44 U.S.C. § 3554; Pub. L. 114-113, Div. N, Title III; OMB A-130 § 5.c; 5 CFR 930.301; OPM coding memos; NIST SP 800-181 Rev. 1, NICE v2.2.0. Book 16, Ch 02.");
  narrate(s,
`Four kinds of source set the workforce requirements, written over twenty years.

FISMA is a staffing requirement more than a course requirement: the agency head must ensure the agency has trained personnel sufficient to help it comply, and awareness training covers personnel, including contractors. The Federal Cybersecurity Workforce Assessment Act of December 18, 2015 requires every agency to identify the positions that do cyber work and code each one. Circular A-130 has the CHCO, the CIO and others develop competency requirements for information resources staff, and keep a current workforce planning process. OPM's rule at 5 CFR 930.301, from June 14, 2004, requires awareness before access and at least annually, role-specific training by audience, and training on significant change. OPM's coding guidance of 2017 and 2022 puts three-digit codes on position descriptions. And NIST's NICE Framework, SP 800-181 Rev. 1, with components version 2.2.0 of April 28, 2026, supplies the vocabulary: 42 work roles in five categories.

What the rules don't require matters as much. No civilian source requires a particular industry certification; the Act asked agencies to measure certification. The only annual number is the awareness floor. NICE is guidance; coding positions under its structure is the mandate. And the Defense Department's 8140 qualification program doesn't apply to civilian agencies.

The decision follows A-130: the CHCO and the CIO set competency requirements together, and the program feeds its new roles into the workforce plan. Doing it as roles change is the program's design guidance.`,
  "Book 16, Chapter 02 — What Federal Workforce Rules Require (The sources at a glance; FISMA; OPM's rule; OMB Circular A-130; The NICE Framework; What the rules don't require; DoD 8140, as a contrast; Who owns which part).");
}

// ------------------------------------------------------------------ Why 5
{
  const s = content(S_WHY, "Coded positions are the cleanest roster source");
  tag(s, "Why");
  img(s, "ch02-from-position-to-curriculum", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "GAO", "FaHashtag", HEX.amber, HEX.amberTint, "Codes have to be kept true", [
    "GAO, 2019: 22 of 24 agencies gave 15,779 IT positions a non-IT code, about 19%",
    "Codes didn't match duties for 63 of 120 sampled positions",
    "Three new NICE roles have no OPM code yet",
    "A code that disagrees with a role is a finding",
  ], 13.5, 7.1, 5.65);
  decision(s, "Review the affected position descriptions and their codes as each workstream reaches its gate",
    "HR classification with the CIO's office", "Each workstream's gate (design)");
  sources(s, "Sources: OPM coding guidance (January 4, 2017; April 11, 2022); GAO-19-144 (March 12, 2019); NICE Framework Components v2.2.0. Book 16, Chapter 02. Uses of the code are design.");
  narrate(s,
`The code on a position description is the HR system's statement of what cyber work a position does. OPM's 2017 procedures have CIO staff, managers, and HR and classification staff partner to assign three-digit codes; 000 means no cyber function, and a position can carry up to three. Each code aligns to a NICE work role.

The codes haven't been reliable. GAO's March 2019 review found 22 of the 24 agencies it reviewed had given a non-IT work role code to 15,779 positions in the GS-2210 IT management series, about 19 percent, and at six agencies the codes didn't match the duties for 63 of 120 sampled positions. The three newest NICE work roles have no OPM code yet.

The program uses the code three ways, as design. As a roster input, beside the identity platform's role assignments and the system inventory; where they disagree, that's a finding for HR and the CIO's office together, not for the training office. As the link to a track, so a person who moves into a coded position is due for its training the day they move. And as a review trigger.

The decision, in the program's design: HR classification staff and the CIO's office review the affected position descriptions and their codes when each workstream reaches its gate. No source requires a review at that moment.`,
  "Book 16, Chapter 02 (Coding the positions; How OPM implemented it; How well it has worked; What the program does with the codes; The work roles the modernized estate needs).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "Education first, then a track for every role");
  tag(s, "What");
  rows(s, "Tracks", "EDUCATION BUILDS THE MODEL; TRAINING TEACHES THE JOB", [
    ["Education", "Six ideas before any tool, starting with governance and identity"],
    ["Compliance", "ISSOs, assessors, AOs: trace a control to its record"],
    ["Implementation", "Engineers: build it, then land its evidence"],
    ["Vendor and labs", "Product skill, practiced away from production"],
    ["End users", "Six short modules, timed to each wave"],
  ], 1.88, 0.64, 0.56, 6.9);
  img(s, "ch03-compliance-track-modules", 7.7, 1.5, 5.05, 3.6);
  decision(s, "Approve a training plan that names an owner for every track",
    "CHCO's office (training plans)", "By G0");
  sources(s, "Sources: Book 16, Chapters 01, 03 and 09; Chapter 08 (responsibility matrix); 5 CFR 410.201. The six ideas, the formats and the tracks are program design.");
  narrate(s,
`The program separates two kinds of learning, as design. Education builds the mental model, for everyone, before any tool, in six ideas in order: governance is a system that runs continuously; identity is the starting point; one map replaces many inventories; every derived record names its source and version; modernization is a lifecycle under change control; and drift is the feedback signal. Someone who holds those ideas understands why the help desk now asks for verification and why a screenshot isn't evidence. Someone who doesn't experiences each new rule as friction. Orientation comes as a 90-minute walkthrough, a self-serve written path, and a 45-minute briefing for auditors. For a sponsor, orientation is the whole requirement.

Training then teaches the job, by role, in four tracks. The compliance track teaches ISSOs, assessors and authorizing officials one skill above the others: tracing a control from the mechanism that closes it to the record that proves it. The implementation track teaches engineers to build and land evidence. Vendor training and labs supply the product skills underneath. And end-user training reaches everyone who signs in.

The decision: a training plan that names an owner for every track, which is one of the book's G0 training criteria. The book's matrix gives the CHCO's office the decision on training plans under 5 CFR 410; the training lead writes them.`,
  "Book 16, Chapter 01 (Education before training; Training is part of each gate's readiness: G0); Chapter 03 — The Compliance Track; Chapter 09 (Orientation: education before training); Chapter 08 (responsibility matrix: workforce development strategy and training plans); Chapter 10 (Readiness per role: executives).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "Engineers: a build is done when its evidence lands");
  tag(s, "What");
  img(s, "ch04-lab-pattern", 0.6, 1.5, 3.2, 3.6);
  sideBox(s, "Habits", "FaListCheck", HEX.amber, HEX.amberTint, "Three habits in every lab", [
    "Observe first: report-only, monitor and shadow modes",
    "Keep a way back in: emergency accounts first",
    "Export the record, never a screenshot",
  ], 13.5, 4.05, 4.25);
  sideBox(s, "Pair", "FaPeopleArrows", HEX.teal, HEX.tealTint, "Paired with the ISSO", [
    "Ten build modules, DDI first, day two last",
    "Each pairs with the compliance module that reads it",
    "At least 14 days in report-only (design)",
  ], 13.5, 8.5, 4.25);
  decision(s, "Pass no gate until the engineers who will carry out the next phase have passed their labs",
    "Steward (G1 gate owner)", "Before G1, then each gate");
  sources(s, "Sources: Microsoft Learn (Conditional Access report-only; emergency access accounts), checked Oct 22, 2026. Book 16, Chapters 04 and 10. Habits, pairing and 14 days are design.");
  narrate(s,
`The implementation track teaches the estate from the engineer's chair, in ten build modules: DNS, DHCP and IPAM, then identity, certificates, access, devices, network, the data platform, the cloud platform and security operations, and finally day-two operations. The order is a real dependency chain, and day-two operations comes last because it runs what every other module built.

The track's one rule, as design: a module is done when the thing works and its record sits where the evidence pipeline reads it. Three habits follow. Observe before you enforce: Microsoft's guidance is to deploy Conditional Access policies in report-only mode first, port access control starts in monitor mode, and provisioning starts in shadow mode; the program's design is at least 14 days in report-only. Keep a way back in: Microsoft recommends at least two cloud-only emergency access accounts, excluded from blocking policies, with every use alerted on and the accounts validated at least every 90 days. And export the record, not a screenshot.

Each build module pairs with the compliance module that reads its evidence, so an engineer and an ISSO work from the same records.

The decision ties the track to the gates. The book's criterion for G1, as design, is that every platform team member who will change production in Phases 1 and 2 has passed their lab, and the same check applies before later phases. The steward decides G1 in Book 01.`,
  "Book 16, Chapter 04 — The Implementation Track (The rule of the track; The build modules; Order and pairing); Chapter 10 (Readiness per gate: G1; Readiness per role: privileged administrators and platform teams).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "Certify what people can show, not attendance");
  tag(s, "What");
  img(s, "ch05-certification-path", 0.6, 1.5, 5.6, 3.6);
  sideBox(s, "Cert", "FaClipboardCheck", HEX.navy, HEX.navyTint, "Credentials earned with artifacts", [
    "Scored from 0, missing, to 3, assessor-ready",
    "Pass: every area at 2 or higher, three at 3, all four checks",
    "Two program credentials; both expire in 12 months",
    "Industry certifications can waive a module, never a capstone",
  ], 13.5, 6.45, 6.3);
  decision(s, "Once the training record is reliable, decide whether a current credential is a condition for privileged roles",
    "CISO (our inference)", "When the record is reliable");
  sources(s, "Sources: OMB A-130, Appendix I; NIST SP 800-50 Rev. 1; SP 800-53 Rev. 5 (AT-3, AT-4); Microsoft, CompTIA, ISC2 renewal pages. Book 16, Ch 05. Scale and credentials are design.");
  narrate(s,
`A-130 asks for measures that test users' knowledge, and SP 800-50 Rev. 1 recommends practical assessments that mimic the work role. So the program, by design, certifies what people can show.

Both track capstones are scored on one four-level scale: 0, missing; 1, named; 2, traced; and 3, assessor-ready, meaning a real result, dated against its freshness rule, with an honest statement of what isn't evaluated yet. The compliance capstone passes with every area at 2 or higher, at least three at 3, and all four whole-submission checks, among them that gaps stay gaps. The implementation capstone passes when the build works and the tooling's result moves because of it.

Two credentials, both program design: a practitioner credential and an assessor credential, each entered as a dated per-person record under AT-4. Both expire after 12 months, or sooner when the procedure changes, and renew by a short practical reassessment.

Industry certifications sit beside them as evidence of general skill. One can waive a module that teaches the same product skill, never a capstone. And no civilian rule requires one.

The decision is the agency's. The book offers a design: make a current credential a condition of eligibility for privileged roles, so access reviews can see it, but only once the training record is reliable. The book names no owner; we've placed it with the CISO, who owns the training policy and decides which roles are significant. That owner is our inference.`,
  "Book 16, Chapter 05 — Assessment and Certification (The scale; Checks that apply to the whole submission; Scoring; Two credentials; Recertification; Industry certifications); Chapter 08 (The CISO) for the owner, which is our inference.");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "Labs: practice everything, touch nothing real");
  tag(s, "What");
  img(s, "ch06-where-labs-run", 0.6, 1.5, 5.6, 3.6);
  sideBox(s, "Labs", "FaShieldHalved", HEX.teal, HEX.tealTint, "Labs need a plan, not a learner's luck", [
    "Developer sandboxes: limited eligibility; none in the government clouds",
    "No free sandbox in GCC High or DoD",
    "Rehearse once in the agency's own government tenant before each gate (design)",
    "Never production, never real data; tear it down",
  ], 13.5, 6.45, 6.3);
  decision(s, "Arrange lab tenants centrally, including a non-production government tenant for rehearsal",
    "Program office", "Before the first labs (design)");
  sources(s, "Sources: NIST SP 800-50 Rev. 1; SP 800-53 Rev. 5 (CM-4(1), SA-3(2)); Microsoft 365 Developer Program, GCC trials and Learn FAQ (Oct 21, 2026). Book 16, Chapters 04 and 06.");
  narrate(s,
`The books teach what to do and why, vendors teach their products, and labs are where people practice both without touching anything real. A vendor course earns a place, by design, only when it maps to a book procedure, is current, and produces a record the agency can keep. Free federal sources come first, including CISA Learning.

Certifications move fast. As Microsoft Learn showed on October 22, 2026, AZ-500 retired on August 31 with SC-500 as the path, AZ-800 and AZ-801 retired on September 30, and MS-102 retires on November 30. The program re-checks them at each gate, the same way it re-checks federal dates.

Lab tenants are harder to get than most programs expect. The Microsoft 365 developer sandbox is limited to eligible subscribers and partners, and isn't offered in the government clouds. There is no free sandbox in GCC High or DoD. So labs that need government-cloud behavior run in a non-production tenant or subscription the agency owns. The program's design is a two-step path: practice in a commercial sandbox, then rehearse the procedure once in the agency's own non-production government tenant before the gate, recording any step that behaved differently.

The rules for every lab: never a production tenant, never production data, and teardown as part of the lab.

The decision comes from the chapter: the program office arranges lab tenants rather than leaving each learner to find one. The timing, before the first labs, is design guidance.`,
  "Book 16, Chapter 06 — Vendor Training and Lab Environments (Choosing vendor training; Federal sources; Where lab environments come from; What changes in the government clouds; Rules for every lab); Chapter 04 (Example certifications).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Every user signs in differently by the last wave");
  tag(s, "What");
  img(s, "ch07-what-users-learn", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Policy", "FaFingerprint", HEX.navy, HEX.navyTint, "What policy sets for users", [
    "Phishing-resistant sign-in (M-22-09, SP 800-63B-4)",
    "Push approvals and codes: a fallback being retired",
    "Passwords: length, not complexity or rotation",
    "Training materials must meet Section 508",
  ], 13.5, 7.1, 5.65);
  decision(s, "Decide which sign-in methods users are taught, and the words they learn for reporting and the help desk",
    "CISO", "Before the pilot's first notice (design)");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-63B-4; 29 U.S.C. § 794d and the Revised 508 Standards; OMB M-24-08; Microsoft Entra deployment guidance. Book 16, Chapters 07 and 08.");
  narrate(s,
`Every user in the agency will sign in differently by the end of the program. The chapter's line is that they learn how from the agency before the change, or from an attacker after it, because a user who has never seen the new sign-in prompt can't tell a real one from a fake.

There are six modules, each ending in something the user does: phishing-resistant sign-in; self-service password reset and account recovery; device enrollment and compliance, including what the agency can and can't see; the new places files live; reporting suspicious messages, prompts and notices; and what the help desk will and won't ask.

Policy sets the target. M-22-09 requires phishing-resistant methods for staff, contractors and partners, and SP 800-63B-4, final in July 2025, says agencies shall require it and describes push approvals and one-time codes as not phishing-resistant. So push is taught as a fallback being retired. Microsoft's guidance is at least two registered methods per user. Password guidance has moved to length, with no composition rules or forced rotation. Which passkey types the agency allows is a CISO decision. Section 508 covers training materials, at WCAG 2.0 Level AA, and under M-24-08 the CHCO develops the accessibility training plans.

The decision: the CISO decides what users are taught to do about security, from sign-in methods to reporting and the help desk's rules, because those instructions are the policy in the form users see. Making the call before the pilot's first notice is our design guidance.`,
  "Book 16, Chapter 07 — End-User Training for the Modernized Estate (Modules 1 to 6; Accessible training); Chapter 08 (The CISO; responsibility matrix: what end users are taught to do about security).");
}

// ------------------------------------------------------------------ What 6
{
  const s = content(S_WHAT, "The help desk is trained first, and is a target");
  tag(s, "What");
  sideBox(s, "Never", "FaUserShield", HEX.red, HEX.redTint, "The help desk will never ask", [
    "For your password, your PIN or a code",
    "You to approve a sign-in prompt for them",
    "To send a reset link to a number given on the call",
    "You to install remote-access software from a link",
    "You to act before you can check",
  ], 13.5, 0.6, 6.0);
  sideBox(s, "First", "FaUserClock", HEX.navy, HEX.navyTint, "Trained before it gets the power", [
    "Phase 1 trains the desk before anyone migrates",
    "No technician eligible until training and verification are on record",
    "Observed scenario, with a social engineering attempt",
    "Attackers have posed as IT, and as employees",
  ], 13.5, 6.75, 6.0);
  decision(s, "Decide whether the help desk is trained and staffed for each wave",
    "Service desk manager", "Before each wave");
  sources(s, "Sources: CISA advisory AA23-320A (revised July 29, 2025); OMB A-130; OMB M-24-08; NIST SP 800-128. Book 16, Chapters 07 to 10. The will-and-won't list is program design.");
  narrate(s,
`The help desk becomes a target the moment users learn to trust it. CISA's advisory on the Scattered Spider group, last revised July 29, 2025, describes actors who posed as company IT or help desk staff to get credentials and one-time passwords from employees, and who posed as employees to the help desk.

So the program trains the help desk first. Phase 1 trains it before anyone else migrates, because Book 15 gives technicians roles that can reset credentials and issue Temporary Access Passes. A-130 requires role-based training before authorizing access, and the program applies that literally: no technician is made eligible for a help desk role until their training and an observed identity-verification scenario, including a social engineering attempt, are on record.

Users learn the desk's rules too, as design: it will never ask for a password, a PIN or a code; never ask you to approve a prompt for it; never send a reset link or code to a number given on the call; never ask you to install remote-access software from a link; and never pressure you to act before you can check. Every legitimate request survives a five-minute delay while the user hangs up and calls the published number.

The desk keeps learning, with a briefing before any approved change users will notice.

The decision: the service desk manager decides whether the desk is trained and staffed for each wave. The CISO owns the verification procedure the desk follows.`,
  "Book 16, Chapter 07 (Module 6: What the help desk will and won't ask); Chapter 09 (What each phase and gate needs; Train the help desk on every change); Chapter 10 (Readiness per role: help desk); Chapter 08 (The help desk; responsibility matrix).");
}

// ------------------------------------------------------------------ What 7
{
  const s = content(S_WHAT, "Waves move on readiness, not on the calendar");
  tag(s, "What");
  rows(s, "Wave", "ONE WAVE, IN DAYS BEFORE ENFORCEMENT (PROGRAM DEFAULTS)", [
    ["60 and 45 days", "Announce the change and why; register early; name champions"],
    ["30 days", "Assign the modules; announce the date; train the help desk"],
    ["15 and 7 days", "Reminders; managers see who hasn't registered or trained"],
    ["Readiness check", "Registration, completion and tickets against thresholds"],
    ["1 day", "Final notice; floor support in place"],
    ["14 days after", "Follow-up lessons and a survey; fix the next wave's material"],
  ], 1.88, 0.54, 0.48, 8.1);
  img(s, "ch07-wave-communications", 8.95, 1.5, 3.8, 3.6);
  decision(s, "Hold any wave that misses its thresholds: move its date, not its threshold",
    "Wave owner (identity engineering)", "Each wave's go/no-go");
  sources(s, "Sources: Microsoft Learn, phishing-resistant passwordless deployment guidance; NIST SP 800-50 Rev. 1. Book 16, Chapters 07, 08 and 10. The day counts are program defaults.");
  narrate(s,
`Book 01 moves users in groups: Tier 0 administrators register phishing-resistant methods in Phase 1, a pilot division proves the pattern in Phase 2, and the remaining divisions move in waves in Phase 3. Training follows the same groups, because a message months ahead is forgotten and one on the day is too late.

Microsoft's deployment guidance gives the cadence: tell users and encourage early registration 60 days before enforcement, repeat at 45, announce the date at 30, repeat with help desk contacts at 15 and 7, and give a final 24-hour notice, using channels beyond email. The program's wave calendar applies it, with program defaults: champions named early; modules assigned and the help desk trained by 30 days; managers sent the names of staff not yet registered or trained; follow-up lessons and a survey in the two weeks after.

Before enforcement, the readiness check reads three numbers against the wave's thresholds: method registration, training completion and help desk ticket volume. Microsoft recommends tracking ticket volume and slowing deployment, communications and enforcement when it rises, with date ranges rather than fixed dates. Wave messages come from one published sender, carry no sign-in link, and repeat the help desk rule, so they're hard to imitate.

The decision: the wave owner, identity engineering in Book 02's matrix, makes the go/no-go, with training completion now part of the check, and the division lead and steward confirm readiness at the division exit. A wave that isn't ready moves its date, not its threshold.`,
  "Book 16, Chapter 07 (Timing: what users are told around each wave; Help desk volume paces the waves; What to send, and what never to send); Chapter 10 (Readiness per gate); Chapter 08 (responsibility matrix: wave go/no-go).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "Who owns workforce readiness: one decider per row");
  tag(s, "Who");
  img(s, "ch08-who-owns-readiness", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Owners", "FaUsersGear", HEX.teal, HEX.tealTint, "Who decides what", [
    "CISO: training policy, significant roles, threshold, what users learn",
    "CHCO's office: workforce strategy, codes, rosters",
    "Sponsor and CIO: funding, wave communications, Section 508",
    "Supervisors: completion, and time to learn",
  ], 13.5, 7.1, 5.65);
  decision(s, "Name one training lead; brief the CHCO's office, labor relations and the Section 508 program manager",
    "Sponsor and CIO", "By G0");
  sources(s, "Sources: FISMA; 5 U.S.C. §§ 1401–1402; 5 CFR 410.201 and 930.301; NIST SP 800-37 Rev. 2 and SP 800-50 Rev. 1; OMB M-24-08. Book 16, Chapter 08. The model is design.");
  narrate(s,
`Ask who owns training and three offices answer at once: security owns the annual course, human resources owns the learning system, and the CIO's office owns the migration. Between them nobody owns whether the people who run, support and use the estate know how on the day it changes. Federal rules spread the duty too: FISMA across the agency head, the CIO and every user; the Chief Human Capital Officers Act gives the CHCO the workforce development strategy; OPM's 5 CFR 410.201 makes the head of agency responsible for training programs; and M-24-08 has the CIO lead the Section 508 program.

The book's model, as design, keeps one decider per row. The sponsor and CIO own funding and staffing, and the wave's communications and user readiness plan. The CISO owns the awareness and training policy, decides which roles have significant security responsibilities, sets the completion threshold, and decides what users are taught. The CHCO's office owns the workforce strategy, the training plans, position coding, the roster's facts and labor relations. Supervisors are accountable for their staff completing training, and for giving them the time. The training lead runs the curriculum day to day, and reports.

The decision, from the G0 criteria and the matrix: the sponsor and CIO staff the program with one named training lead, and the CHCO's office, labor relations and the Section 508 program manager are briefed at G0, before the first module is built, not after the first grievance.`,
  "Book 16, Chapter 08 — Who Owns Workforce Readiness (Where the roles come from; The roles; Readiness is an input to every gate: G0; The responsibility matrix).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "The training lead reports; others decide");
  tag(s, "Who");
  img(s, "ch08-readiness-into-gates", 0.6, 1.5, 1.9, 3.6);
  sideBox(s, "Apart", "FaFilter", HEX.amber, HEX.amberTint, "Keep the roles apart", [
    "Whoever reports the numbers doesn't judge them",
    "The record's producer doesn't review it",
    "Managers can't waive required training",
    "Phishing results are for learning, not discipline",
  ], 13.5, 2.7, 5.0);
  sideBox(s, "Gov", "FaLandmark", HEX.navy, HEX.navyTint, "Government decides", [
    "Contractors can build, deliver and report it all",
    "CISO, ISSO, gate and AO decisions: officials",
    "Untrained people in operation: the AO's risk",
  ], 13.5, 7.85, 4.9);
  decision(s, "Accept, or refuse, the risk of operating a system before its people are trained",
    "Authorizing official", "Before the system operates");
  sources(s, "Sources: NIST SP 800-50 Rev. 1 (example policies); 5 CFR 930.301 and 410.201. Book 16, Chapter 08; Book 14, Chapter 10. The separations are program design.");
  narrate(s,
`Readiness numbers are easy to improve without improving readiness, so the book keeps the roles apart, as design. The person who reports the numbers doesn't decide what they mean: the training lead reports completion per population, the ISSO reviews the record and routes the gaps, and the gate or wave owner decides go, no-go or conditional go, with the program office checking the criteria. The record's producer doesn't review it. Managers can't waive required training; a waiver is the CISO's or a named delegate's, recorded with an end date, following SP 800-50 Rev. 1's example policy. Phishing-exercise results serve learning, not discipline. And the communications office owns the channel, while the CISO owns the words that tell users how to sign in.

Who may hold these roles follows Book 14. The CIO and the CISO are government officials. The training lead, the course developers, the help desk and much of the program office can be contractors, and often are. Contractors can build, deliver and report all of the training; the decisions in the CISO's, the ISSO's, the gate owners' and the authorizing official's rows are made by government officials.

Two decisions sit above the matrix. The organization-wide training plan and the evaluation of training programs belong in the end to the head of the agency, who may designate officials. And accepting the risk of putting a system into operation before its people are trained is a risk acceptance like any other, which only the system's authorizing official can make.`,
  "Book 16, Chapter 08 (Readiness is an input to every gate; The responsibility matrix: comments and the two decisions above it; Keeping the roles apart; who may hold these roles).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Training runs on the roadmap, phase by phase");
  tag(s, "How");
  const phases = [
    ["0 → G0", "Sponsor, steering committee, ISSOs", "Orientation; compliance track begins"],
    ["1 → G1", "Platform teams; help desk", "Labs; the desk trained and verified first"],
    ["2 → G2", "Pilot users and champions", "First wave cycle; every module tested"],
    ["3 → G3", "Each wave", "Same cycle; modules fixed after each wave"],
    ["4 → G4", "AD administrators, app owners", "Role transition into cloud roles"],
    ["5 → G5", "AD administrators; help desk", "Retire every AD-era module and runbook"],
    ["6, steady", "Everyone, by role", "Refresh; new roles; annual evaluation"],
  ];
  leftTable(s, ["Phase → gate", "Who must be ready", "What they need (design)"],
    phases.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]), [1.4, 2.85, 3.25], [0.34, 0.4], 11.5);
  img(s, "ch01-training-at-each-gate", 8.3, 1.5, 4.45, 3.6);
  decision(s, "Schedule no gate without its training dates, and no wave without its training window",
    "Program office", "Every plan update (design)");
  sources(s, "Sources: 5 CFR 930.301(d); NIST SP 800-53 Rev. 5 (AT-2, AT-3); SP 800-50 Rev. 1; OMB A-130. Book 16, Chapters 01 and 09; Book 01, Chapter 12. The schedule is program design.");
  narrate(s,
`A curriculum on the roadmap's calendar arrives when people need it; one on the training office's calendar arrives after the help desk has already taken the calls. SP 800-50 Rev. 1 asks for one primary training calendar aligned with major IT releases, and in this program the releases are the waves. The planning rule, as design: no gate is scheduled without its training dates, and no wave without its training window, so a wave that slips moves its training with it.

The schedule by phase, all design. Before G0, leaders get the orientation and ISSOs start the compliance track. Before G1, platform teams take their labs, and the help desk is trained and verified before any new role is assigned. In the pilot, every new module is tested before the rollout uses it, and in the rollout, modules are corrected after each wave. Phase 4 trains Active Directory administrators into cloud roles. Phase 5 retires every AD-era module and runbook, the step most curricula skip. Then steady state: refresh, training on every new role, and the annual evaluation.

Modules stay current through a scheduled check: each module records the chapters it teaches, a changed chapter flags its modules, and revisions are versioned.

The decision: the program office owns the schedule, because only the program office knows when the next wave moves.`,
  "Book 16, Chapter 09 — Building and Running the Curriculum (Start from the roadmap, not the catalog; What each phase and gate needs people to know; Keeping the curriculum current); Chapter 01 (Training is part of each gate's readiness).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "Keep the knowledge when people and contracts change");
  tag(s, "How");
  cards(s, "Keep", [
    ["FaUsersGear", "Spread the knowledge", HEX.teal, HEX.tealTint, ["At least two qualified instructors per module (design)", "Module owners from the owning workstream", "Modules cite their source chapters, versioned"]],
    ["FaUserTie", "Contractors on record", HEX.navy, HEX.navyTint, ["In the same learning system as staff", "CORs accountable for completion", "Employer-trained still needs an agency record", "They deliver; officials decide"]],
    ["FaUserClock", "People in transition", HEX.amber, HEX.amberTint, ["AD administrators trained into cloud roles (Phase 4)", "Retrained or reassigned by G4", "Certifications belong to the person; keep your own record"]],
  ], 13);
  decision(s, "Record every contractor's training in the agency's learning system, with each COR accountable",
    "Contracting officer's representatives", "Before access");
  sources(s, "Sources: FISMA; OMB A-130 § 5.c and Appendix I; Microsoft exam registration guidance. Book 16, Chapters 02, 06, 08 and 09. Grouping these as retention is our inference.");
  narrate(s,
`The book has no chapter on retention by that name. This slide gathers what it says about keeping the workforce's knowledge as people and contracts change, and the framing is ours.

The need comes from the rules. FISMA's "sufficient" is measured against the work, and while the old and new estates run side by side, enough trained people for the old one may not be enough for both. A-130 asks agencies to plan their workforce so they can keep skills current and recruit and retain the talent they need.

The curriculum is built so knowledge doesn't sit in one head, as design. Module owners come from the workstream that owns the platform. Every module should have at least two qualified instructors, the cross-training rule Book 00 applies to every workstream. And module versions are kept, not overwritten.

People in transition: Active Directory administrators get role transition training into cloud roles in Phase 4, and by G4 the administrators of retiring platforms are retrained or reassigned.

Contractors: contracting officer's representatives are accountable for contractor completion. A contractor trained by their employer still needs a completion record the agency can show, entered or imported. And certifications belong to the person: Microsoft recommends registering for its exams with a personal account, so the agency keeps its own record of each credential and its expiry date.

The decision: contractors' training goes into the agency's learning system, with each COR accountable, before access.`,
  "Book 16, Chapter 02 (FISMA: trained people; A-130's competencies and workforce planning); Chapter 09 (Train-the-trainer; Keeping the curriculum current; What the learning management system records); Chapter 08 (Managers and supervisors; G4 criteria); Chapter 06 (Its records can be kept). The retention framing is our inference.");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Readiness is measured on the job, not in the course");
  tag(s, "How");
  img(s, "ch10-readiness-signals", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Measure", "FaChartLine", HEX.navy, HEX.navyTint, "Completion is not competence", [
    "Completion, for everyone",
    "Competence, wherever a mistake is a security event",
    "Behavior: registration, ticket volume and decay",
    "The pilot sets the baseline; each wave adjusts it",
  ], 13.5, 7.1, 5.65);
  decision(s, "Treat every overdue or unassessed person in a privileged role as a finding, whatever the percentage",
    "ISSO, against the CISO's threshold", "Every evidence review");
  sources(s, "Sources: OMB A-130, Appendix I; NIST SP 800-50 Rev. 1; SP 800-181 Rev. 1; Microsoft Entra authentication methods activity report. Book 16, Chapters 08 and 10. Targets are design.");
  narrate(s,
`A completion record says someone finished a course; readiness says they can do the job on the day the change arrives. SP 800-50 Rev. 1 says measurement must go beyond compliance, organized on the four Kirkpatrick levels: reaction, learning, behavior and results.

The practical rule, as design: completion is measured for everyone, and competence for every role where a mistake is a security event: the help desk, privileged administrators, platform engineers who change production, ISSOs, and the people named in incident response and contingency plans. For those roles a completion without a passing assessment doesn't count.

Signals beyond the learning system show behavior. Sign-in method registration by wave is the most direct end-user measure and costs nothing to collect, from Entra ID's authentication methods activity report, which needs Entra ID P1 or P2. Help desk tickets are read by volume per wave, by category, to separate how-do-I questions from configuration failures, and by decay, the days until volume returns to baseline. Surveys and phishing report rates add to the picture.

Targets are design. The pilot is the baseline; Book 00's pilot criteria, under 5 percent of pilot users raising tickets and over 80 percent positive, are illustrative. A target never measured against a baseline is a guess, and the report says so.

The decision follows Book 14: the ISSO reviews the record against the CISO's threshold, and every overdue or unassessed person in a privileged role is a finding, whatever the percentage.`,
  "Book 16, Chapter 10 — Measuring Readiness and Evidencing It (Completion is not competence; Readiness per role; Readiness per gate; Signals beyond the learning management system; Baselines and targets are design); Chapter 08 (responsibility matrix: the evidence row).");
}

// ------------------------------------------------------------------ How 4
{
  const s = content(S_HOW, "What the steering committee should see");
  tag(s, "How");
  const cad = [
    ["Every meeting", "One page: the next gate and next two waves, by role group"],
    ["Quarterly", "Completion and competence; surveys, tickets, revisions"],
    ["Annually", "OPM's evaluation: what training cost, changed and missed"],
    ["Each gate review", "The gate's readiness criteria, from the record"],
  ];
  leftTable(s, ["Cadence (design)", "What the committee sees"], cad.map((r) => [bold(r[0]), { text: r[1] }]), [2.0, 4.9], [0.34, 0.62], 13);
  sideBox(s, "Five", "FaListCheck", HEX.teal, HEX.tealTint, "Five questions, in order", [
    "Is the next gate's workforce ready?",
    "Are the next two waves ready?",
    "What happened in the last wave?",
    "Where are the privileged gaps? A count",
    "What must the committee decide?",
  ], 13.5, 7.75, 5.0);
  decision(s, "Review readiness at every meeting; evaluate the training program each year, as OPM requires",
    "Steering committee; head of agency yearly", "Each meeting; yearly");
  sources(s, "Sources: NIST SP 800-50 Rev. 1; 5 CFR 410.201 and 410.202. Book 16, Chapters 08, 09 and 10. The cadence and the five questions are program design.");
  narrate(s,
`SP 800-50 Rev. 1 describes an assessment report for senior leadership, produced regularly through the year, that analyzes attendance, feedback and metrics in plain language. And OPM's rules at 5 CFR 410 require agencies to evaluate their training programs annually against mission and performance goals.

The program's design fits that into the steering committee's rhythm. Every meeting: one page with readiness for the next gate and the next two waves, by role group, against threshold, and anything red with its cause and owner; it supports whether the next wave keeps its date. Quarterly: completion and competence by population, survey and ticket trends, and modules revised. Annually: the evaluation OPM requires, covering what training cost, what it changed and where the gaps are. And at each gate review, the gate's criteria evaluated from the record.

The one-page view answers five questions in order: is the next gate's workforce ready; are the next two waves ready; what happened in the last wave; where are the privileged gaps, as a count rather than a percentage, because each one is a finding; and what does the committee need to decide.

The report carries counts, not names. Per-person detail stays in the learning management system under its access controls.

The decision: the steering committee takes the readiness view at every meeting, and the annual evaluation belongs in the end to the head of the agency, who may designate officials to carry it out.`,
  "Book 16, Chapter 10 (Reporting to the steering committee); Chapter 08 (Two decisions sit above the matrix); Chapter 09 (The annual cycle).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Fund the learning program; name a training lead; brief CHCO, labor relations, 508", "Sponsor and CIO", "Before G0"],
    ["Training check at every gate; dates on the plan; central lab tenants", "Program office", "From G0"],
    ["Roster from HR and identity records; a training plan with track owners", "CHCO's office", "By G0"],
    ["Competency requirements; position codes reviewed at each gate", "CHCO, CIO; HR classification", "As roles change"],
    ["What users are taught; credential as a privileged-role condition", "CISO", "Before pilot; later"],
    ["Engineers pass their labs before the next phase", "Steward", "Before G1, each gate"],
    ["Help desk trained and staffed; waves held when thresholds miss", "Desk manager; wave owner", "Each wave"],
    ["Contractors' training on the agency's record", "CORs", "Before access"],
    ["Privileged gaps are findings; untrained operation is a risk call", "ISSO; authorizing official", "Each review"],
    ["Readiness at every meeting; the annual evaluation", "Steering committee; agency head", "Each meeting; yearly"],
  ];
  const colW = [6.65, 2.85, 2.65];
  const est = asks.reduce((h, r) => h + Math.max(0.36, Math.max(...r.map((c, j) => lines(c, colW[j] - 0.2, 12))) * lh(12) + 0.1), 0.36);
  fit("decision table", 1.45 + est, 5.82);
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts(colW, { y: 1.45, w: colW.reduce((a, b) => a + b, 0), fontSize: 12, rowH: [0.34, ...asks.map(() => 0.38)] }));
  txt(s, "Close line", [{ text: "None of these is a procurement.  ", options: { bold: true, color: HEX.amber } },
    { text: "Tools enforce the rules; trained people make the decisions." }],
    { x: 0.6, y: 5.85, w: 12.15, h: 0.55, fontSize: 16, valign: "middle", align: "center" });
  sources(s, "Sources: Book 16, Chapters 01 to 10; owners from Chapter 08's responsibility matrix and the gate criteria in Chapters 01, 08 and 10. Timings marked design in the notes.");
  narrate(s,
`So, the decisions, with their owners and timing. None of them is a procurement.

The sponsor and CIO fund the learning program from a named budget, name one training lead, and bring in the CHCO's office, labor relations and the Section 508 program manager at G0. The program office puts a training check against a roster into every gate, schedules no gate without its training dates and no wave without its window, and arranges lab tenants, including a non-production government tenant. The CHCO's office owns the roster's facts, the training plan with an owner for every track, competency requirements with the CIO, and the review of position codes.

The CISO decides what users are taught, and, once the record is reliable, whether a credential becomes a condition for privileged roles; that owner is our inference. The steward passes no gate until the next phase's engineers have passed their labs. The service desk manager decides whether the desk is ready for each wave, and the wave owner holds any wave that misses its thresholds. Contracting officer's representatives put contractors' training on the agency's record before access. The ISSO treats every privileged gap as a finding, and the authorizing official alone accepts the risk of operating with people untrained. The steering committee reviews readiness at every meeting, and the head of agency owns the annual evaluation.

The next step needs no procurement: draft the roster of everyone whose work changes. Tools enforce; people decide. Book 16 has the detail, with every claim footnoted. Thank you.`,
  "Book 16, Chapter 08 — Who Owns Workforce Readiness (responsibility matrix), with the gate criteria in Chapters 01 and 10 and the decisions on each slide from Chapters 01 to 10; Appendix A — The Curriculum Map.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: law, OMB, OPM and NIST");
  const src = [
    "FISMA, 44 U.S.C. § 3554.  ·  Federal Cybersecurity Workforce Assessment Act of 2015, Pub. L. 114-113, Division N, Title III (5 U.S.C. 301 note).  ·  Chief Human Capital Officers Act, 5 U.S.C. §§ 1401–1402.  ·  Section 508, 29 U.S.C. § 794d; Revised 508 Standards, 36 CFR Part 1194, Appendix A.  ·  15 U.S.C. § 7443.",
    "OMB Circular A-130 (July 2016), § 5.c, § 6.g and Appendix I § 4.h.  ·  OMB M-22-09 (January 26, 2022).  ·  OMB M-24-08 (December 21, 2023).",
    "OPM: 5 CFR 930.301; 5 CFR 410.201, 410.202 and 410.601; cybersecurity coding memoranda of January 4, 2017 and April 11, 2022; Interpretive Guidance for Cybersecurity Positions (October 2018).  ·  GAO-19-144 (March 12, 2019).",
    "NIST: SP 800-50 Rev. 1 (September 2024); SP 800-53 Rev. 5, release 5.2.0, and SP 800-53B; SP 800-37 Rev. 2; SP 800-181 Rev. 1 and NICE Framework Components v2.0.0, v2.1.0 and v2.2.0 (April 28, 2026); SP 800-63B-4 (July 2025); SP 800-128.",
    "Contrast only: DoD Directive 8140.01 and DoD Manual 8140.03, which don't apply to civilian agencies.",
  ];
  fit("Source list 1", need(src, 12.1 - 0.3, 13, 8), 5.0);
  txt(s, "Source list 1", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: CISA, FedRAMP, Microsoft and vendors");
  const src = [
    "CISA Cybersecurity Advisory AA23-320A, Scattered Spider (November 16, 2023; revised July 29, 2025).  ·  CISA Learning.  ·  FedRAMP Consolidated Rules for 2026, Key Security Indicators.",
    "Microsoft Learn: Plan a phishing-resistant passwordless authentication deployment in Microsoft Entra ID; Conditional Access report-only and emergency access accounts; self-service password reset; smart lockout; Intune device visibility; Authentication Methods Activity; the Report button in Outlook.",
    "Microsoft Learn certifications and exams, status as of October 22, 2026 (SC-300, SC-500, MD-102, AZ-802, AZ-700, DP-300, AZ-104, SC-200, SC-401, MS-102; AZ-500, AZ-800 and AZ-801 retired); renewal FAQ; Microsoft 365 Developer Program; Microsoft 365 Government trials.",
    "Examples only, checked on each vendor's site (October 21, 2026): CompTIA, ISC2 and ISACA certification pages; Infoblox, BlueCat, Cisco, Fortinet, Palo Alto Networks, Zscaler, SailPoint, AWS, Broadcom and ServiceNow training pages. Naming them endorses none.",
    "Full footnotes with links and access dates (October 21–22, 2026): Book 16, every chapter and Appendix A (whalermike.github.io/modernization-workbook/docs/books/b16-people/).",
  ];
  fit("Source list 2", need(src, 12.1 - 0.3, 13, 8), 5.0);
  txt(s, "Source list 2", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}

// The narration (narration.json) must name every slide before "Backup", in order, with the slide's own title.
const NARR = path.join(__dirname, "narration.json");
if (fs.existsSync(NARR)) {
  const nj = JSON.parse(fs.readFileSync(NARR, "utf8"));
  const narrated = titles.slice(0, perSlide.length);
  if (nj.length !== narrated.length) console.warn(`  ! narration.json has ${nj.length} entries for ${narrated.length} narrated slides`);
  nj.forEach((e, i) => {
    if (e.slide !== i + 1) console.warn(`  ! narration.json entry ${i + 1} is numbered ${e.slide}`);
    if (e.title !== narrated[i]) console.warn(`  ! narration.json slide ${i + 1} title "${e.title}" doesn't match the slide ("${narrated[i]}")`);
  });
  const said = nj.map((e) => e.say.split(/\s+/).filter(Boolean).length);
  console.log(`narration.json: ${said.reduce((a, b) => a + b, 0)} words (${said.join(", ")}), about ${mmss(said.reduce((a, b) => a + b, 0) * 60 / 150)} at 150 wpm`);
}
console.log(`notes: ${spoken} spoken words (${perSlide.join(", ")}), about ${mmss(clock)} at ${WPM} wpm`);
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
