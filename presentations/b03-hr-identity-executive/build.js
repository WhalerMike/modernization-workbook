// Book 03 — HR-Driven Identity: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: CIO, CHCO and HR leadership, CISO, privacy officer and sponsors. Decision-centered: every decision
// slide states the decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B03_HR_Identity_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b03-hr-identity/ (and, for Gate G1, Book 00 Chapter 09
// and Book 01 Chapter 12), named in the notes. The responsibility matrix, the phase gates and their thresholds
// are the book's program design and proposed starting criteria, labeled as such; Federal HR 2.0 program facts
// are as of October 20, 2026. The contractor source of authority is left open, as the book leaves it.
// Diagrams are the committed PNGs in docs/images/diagrams/b03-hr-identity/png/; alt text is read from the
// chapters' fig-alt so it stays in step with the book. The spoken narration lives in narration.json.
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 03", title: "HR-Driven Identity",
  footer: "Federal Modernization Workbook  ·  Book 03 HR-Driven Identity  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B03_HR_Identity_Executive.pptx";

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
// print a "!" warning at build time when text may overflow its box.
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
  return txt(s, name, t, o);
};
const sources = (s, text) => {
  if (text.length > 170) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y: 6.62, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

// ---------------------------------------------------------------- diagrams
// The committed PNG, scaled to fit (maxW x maxH), centered in its area; alt text from the chapter's fig-alt.
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b03-hr-identity");
const PNG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b03-hr-identity", "png");
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
const rows = (s, prefix, label, list, top, step, h, w) => {
  const W = w || 6.2;
  txt(s, `${prefix} head`, label, { x: 0.6, y: 1.5, w: W, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });
  list.forEach((j, i) => {
    const y = top + i * step;
    box(s, `${prefix} ${i}`, 0.6, y, W, h, i % 2 ? HEX.navyTint : HEX.grey);
    T(s, `${prefix} ${i} text`, [{ text: `${j[0]}   `, options: { bold: true, color: HEX.navy } }, { text: j[1] }],
      { x: 0.8, y, w: W - 0.3, h, fontSize: 13.5, valign: "middle" });
  });
};
// A tinted box with an icon, a heading and a bullet list, sized to its content (default x 7.75 to 12.75).
const sideBox = (s, prefix, iconName, color, tint, heading, list, o = {}) => {
  const x = o.x || 7.75, w = o.w || 5.0, size = o.size || 13.5, y = o.y || 1.5;
  const listNeed = needFor(parasOf(bullets(list, size), size), w - 0.45, 6);
  const h = Math.max(o.minH || 0, Math.round((0.92 + listNeed + 0.2) * 100) / 100);
  if (y + h > 5.12) console.warn(`  ! slide ${pres.slides.length} ${prefix} box runs past the decision bar (bottom ${(y + h).toFixed(2)} in)`);
  box(s, `${prefix} box`, x, y, w, h, tint);
  icon(s, iconName, x + 0.25, y + 0.16, 0.6, color);
  T(s, `${prefix} head`, heading, { x: x + 1.0, y: y + 0.16, w: w - 1.15, h: 0.6, bold: true, color, fontSize: 16.5, fontFace: "Cambria", valign: "middle" });
  txt(s, `${prefix} list`, bullets(list, size), { x: x + 0.25, y: y + 0.92, w: w - 0.45, h: listNeed + 0.1, paraSpaceAfter: 6 });
  return h;
};
// A small tinted panel with a bold heading and a short bullet list, at a fixed place (no icon).
const panel = (s, prefix, x, y, w, h, tint, color, heading, list, size) => {
  const pt = size || 13;
  box(s, `${prefix} panel`, x, y, w, h, tint);
  T(s, `${prefix} panel text`, [{ text: heading, options: { bold: true, color, fontSize: pt + 1, breakLine: true } }, ...bullets(list, pt)],
    { x: x + 0.2, y: y + 0.1, w: w - 0.35, h: h - 0.2, fontSize: pt, paraSpaceAfter: 3 });
};
// A table on the left (x 0.6) with a navy header row; warns when a cell's text won't fit its row.
const leftTable = (s, header, body, colW, rowH, fontSize) => {
  const pt = fontSize || 12.5;
  [header, ...body].forEach((r, i) => r.forEach((c, j) => {
    const t = typeof c === "string" ? c : c.text;
    const need = linesFor(t.length, colW[j] - 0.2, pt) * lineH(pt) + 0.1;
    if (need > rowH[i] + 0.02) console.warn(`  ! slide ${pres.slides.length} table row ${i} col ${j} may wrap past its height (${need.toFixed(2)} > ${rowH[i]})`);
  }));
  return s.addTable([head(header), ...body], tableOpts(colW, { y: 1.5, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH }));
};
const bold = (t, color) => ({ text: t, options: { bold: true, color: color || HEX.navy } });

const S_WHY = "Why HR is the source of authority", S_WHAT = "What data, owned by whom, flowing how",
  S_WHO = "Who owns workforce identity", S_HOW = "How to run it and know it works";

// ------------------------------------------------------------------ Title
{
  const s = titleSlide(S_WHY, "HR-Driven Identity: the executive briefing", "Book 03 — HR-Driven Identity  ·  Executive briefing");
  D.agenda(s, 0.8, 4.8, 6.6);
  T(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "30 minutes for the CIO, CHCO and HR leadership, CISO, privacy officer and sponsors", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.4, w: 9.6, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 03 of the Federal Modernization Workbook, HR-Driven Identity. It runs about thirty minutes, for the people who make the calls: the CIO, the Chief Human Capital Officer and HR leadership, the CISO, the privacy officer and the program's sponsors.

The argument fits in three sentences. Access is now decided by identity, and the attributes it reads, organization, position, status and supervisor, are workforce facts that only the HR system of record originates. In most agencies those facts reach the directory by ticket. And two migrations already under way, Federal HR 2.0 and the move from Active Directory to Entra ID, rebuild both ends of that connection, so this is the cheapest moment the agency will get to start HR-driven identity.

I'll take four questions: why HR should decide who exists, and why now; what data, owned by whom, flowing how; who owns, uses and guards workforce identity; and how to run joiner, mover and leaver, bind credentials, settle the contractor source, sequence the plan and know it works.

Three labels run through the deck, as they do through the book. The responsibility matrix, the phase gates and their thresholds are program design and proposed starting criteria, for the agency to approve or replace. Federal HR 2.0 facts are as of October 20, 2026, and they change. And the contractor source of authority is a decision the book leaves open.

Every decision slide names the decision, its owner and when it's needed, and the last slide gathers them into one table.`,
  "Book 03, index; Chapter 01 — Overview and Applicability (The proposal; The ask); Chapter 12 (About the numbers in the gates).");
}

// ------------------------------------------------------------------ Track: this book is the HR track
{
  const s = content(S_WHY, "Book 03 is the HR track: people, from their records");
  tag(s, "Why");
  const cols = [
    ["FaUserCheck", "What it accomplishes", HEX.teal, HEX.tealTint, [
      "Employees from HR; contractors from the contractor source of authority",
      "Joiner, mover and leaver change access by rule, not by ticket",
      "One set of true attributes read by groups, delegation and access policy"]],
    ["FaClipboardCheck", "How you know", HEX.navy, HEX.navyTint, [
      "Every enabled account matches an HR or contractor record, or an owned exception",
      "No hand-kept membership left in OU-derived groups",
      "Drift checks clean; fixes made at the source (design guidance)"]],
    ["FaRoute", "Covered elsewhere", HEX.amber, HEX.amberTint, [
      "End-user devices, the Intune track: Book 05",
      "Servers, the Arc track: Book 05, Chapter 09",
      "Service accounts: Book 02, Chapter 09",
      "Data-platform principals: Book 06; AI agents: Book 17"]],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Track col ${i + 1}`, x, 1.5, 3.95, 3.5, c[3]);
    icon(s, c[0], x + 0.22, 1.64, 0.6, c[2]);
    T(s, `Track head ${i + 1}`, c[1], { x: x + 0.98, y: 1.64, w: 2.85, h: 0.6, bold: true, color: c[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
    T(s, `Track text ${i + 1}`, bullets(c[4], 13.5), { x: x + 0.25, y: 2.38, w: 3.55, h: 2.55, paraSpaceAfter: 6 });
  });
  D.callout(s, "Reach", 5.15, 0.95, "FaTriangleExclamation", HEX.red, "HR never describes a device, a server or a service: ",
    "a device rule can't read its owner, and a service account answers to its owner and sponsor, not to a hire date.");
  T(s, "Requirements", [{ text: "Federal requirements:  ", options: { bold: true, color: HEX.navy } },
    { text: "NIST SP 800-53 AC-2, AC-2(1), PS-4, PS-5, IA-4(4); OMB M-19-17; OMB M-22-09 §III.A (Book 03, Ch 11: control support, not control closure)" }],
    { x: 0.6, y: 6.16, w: 12.15, h: 0.42, fontSize: 11.5, valign: "middle" });
  sources(s, "Sources: Book 03, Chapters 01, 02, 06, 08, 10, 11; Book 05, Ch 03; attribute-driven migration guide. Full citations in the backup.");
  narrate(s,
`First, where this book sits. The series moves four populations of identity to the cloud, each on its own track with its own source of truth, and Book 03 is the HR track: people.

What it accomplishes: every employee account follows the HR system of record, and every contractor account follows the contractor source of authority, which remains the agency's decision. Joiners, movers and leavers then change access by rule, not by ticket, because groups, delegated administration and Conditional Access all read the same true attributes.

How you know you're there, as program design guidance: every enabled account correlates to an authoritative record or carries an owned exception; every group that used to be built from OU position is a validated rule, with no hand-maintained membership; and the scheduled drift comparison runs clean, with findings fixed at the source. The book's own gates, in Chapter 12 and Appendix C, take precedence.

What this book doesn't cover: end-user devices and servers, the Intune and Arc tracks in Book 05; and the non-person identities, service accounts in Book 02, data-platform principals in Book 06, and AI agents in Book 17. HR never describes a device, a server or a service.

For the federal controls, the design supports account management, termination and transfer, and identifier status in SP 800-53, under the M-19-17 ICAM framework. It supports them; it doesn't close them.`,
  "Book 03, Chapter 01 (the proposal; contractors and vendors need their own source); Chapter 06; Chapter 08 (joiner, mover, leaver); Chapter 10 (from attributes to access); Chapter 11 (control support: AC-2, AC-2(1), PS-4, PS-5, IA-4); Chapter 12 and Appendix C (gates). Book 05, Chapter 03 (device facts don't come from the primary user). Non-person identities: Book 02, Chapter 09; Book 06; Book 17. Success criteria are program design guidance.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "Access now runs on employee data");
  tag(s, "Why");
  figure(s, "ch02-zero-trust-dependency", 0.6, 6.9);
  sideBox(s, "Frame", "FaLandmark", HEX.navy, HEX.navyTint, "What federal policy points to", [
    "M-22-09: every request evaluated",
    "SP 800-207: policy reads enterprise attributes",
    "FICAM playbook: HR as the authoritative source",
    "AC-2: accounts aligned with termination, transfer",
    "No OPM document specifies Entra ID",
  ]);
  takeaway(s, "FaTriangleExclamation", HEX.red, "The accuracy of employee data is now the accuracy of access.  ",
    "A wrong department is the wrong access; a stale status is a valid token for a separated person.");
  sources(s, "Sources: OMB M-22-09; NIST SP 800-207; CISA ZTMM 2.0; FICAM ILM Playbook; NIST SP 800-53 Rev. 5 AC-2; Microsoft Learn — dynamic groups. Book 03, Ch. 01, 02.");
  narrate(s,
`Start with what a token actually asserts. It carries claims, an identifier, group memberships, role assignments, and those claims are projections of upstream facts: this person is employed, holds this position, reports to this supervisor, and their affiliation ends on this date. The identity platform can prove a claim was signed by the right party. It can't tell you whether the claim is true.

That matters more now. M-22-09 makes Zero Trust federal strategy, with every request evaluated. NIST SP 800-207 has the policy engine read the attributes the enterprise assigns to the account, and CISA's maturity model defines an identity as a set of attributes. In Entra ID, a user signs in with a PIV card, gets a token, and Conditional Access and dynamic groups decide what it reaches, from organization, position, status and supervisor.

So the cost of bad data changed. A wrong department now means the wrong dynamic groups, and so the wrong access; a stale status means a valid token for a separated person, usable from anywhere.

Federal guidance points one way without naming a product. The FICAM Identity Lifecycle Management Playbook, best practice rather than policy, recommends designating HR systems as the authoritative source for identity creation and termination, and SP 800-53 asks for account management aligned with termination and transfer. One caution stated up front: no OPM document specifies Entra ID integration. OPM fixes the HR side; the identity side is the agency's decision.`,
  "Book 03, Chapter 02 — Why HR Is the Source of Authority (What the claims in a token assert; Why the agency needs HR-driven ICAM now; The federal policy frame); Chapter 01 (One caution, stated up front).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "Why orphans keep coming back: no channel from HR");
  tag(s, "Why");
  figure(s, "ch02-orphan-timeline", 0.6, 12.15, 2.05);
  panel(s, "Patches", 0.6, 3.75, 5.95, 1.35, HEX.grey, HEX.slate, "Three patches that don't hold", [
    "Clean the directory: a snapshot, not a source",
    "Make the directory master: tickets again",
    "Review to correctness: samples state, misses moves",
  ]);
  panel(s, "Fix", 6.8, 3.75, 5.95, 1.35, HEX.tealTint, HEX.teal, "The fix: a designated origin, with events", [
    "A hire creates the account; a change updates it",
    "A separation disables it, on the effective date",
    "A rehire re-links the same person",
  ]);
  decision(s, "Designate the HR system of record as the source of authority for workforce identity, and build HR-driven identity into both migrations",
    "ICAM governance body (sponsor chairs)", "Now, before either migration ends");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (PS-5, AC-2); Microsoft Learn — What is HR-driven provisioning? Book 03, Chapters 01, 02. The timeline is an illustrative pattern.");
  narrate(s,
`Ask an estate three questions, who works here, what do they do, and who do they report to, and no single system answers. The answers sit in regional OU trees, in each application's own account store, in onboarding spreadsheets and separation checklists, and in organization charts. Each fragment is locally maintained and globally wrong, and none is designated to win.

The visible symptom is the orphaned account: an enabled credential whose human justification has ended. The timeline is the book's illustration. HR records a separation two weeks ahead, and no other system is listening. On the day it takes effect, the account, the application logins and the badge are all still live. A ticket disables the directory account on day three but not nine application accounts; a review flags two of them at day forty-five; and at day one hundred and eighty a penetration test signs in with one. Nothing in that is a failure of diligence. It's the wiring working as built: one system that records the truth and five that need it, with no channel between them.

Three patches fail for structural reasons. Cleaning the directory produces a correct snapshot with no event source behind it. Making the directory the master puts employment facts back into tickets. And quarterly reviews sample state; they can't observe transitions.

The fix is a designated origin with an event feed: HR-driven provisioning, where a hire creates the account and a separation disables it. The decision: designate it now, inside both migrations.`,
  "Book 03, Chapter 02 — Why HR Is the Source of Authority (The fragmented truth problem; The visible symptom: orphaned accounts; Why this can't be patched; What HR-driven provisioning means); Chapter 01 (The ask); Chapter 07 (responsibility matrix: Gov. body).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "Federal HR 2.0: the window closes at interconnection");
  tag(s, "Why");
  figure(s, "ch03-hr20-window", 0.6, 12.15, 2.05);
  panel(s, "Facts", 0.6, 3.75, 5.95, 1.35, HEX.amberTint, HEX.amber, "Program facts, as of October 20, 2026", [
    "Oracle Fusion Cloud HCM, awarded June 10, 2026",
    "Wave 2 (about 1.1M FTE) moves in FY 2027",
    "Interconnection near month 5 of ~8 (sample)",
  ]);
  panel(s, "Gives", 6.8, 3.75, 5.95, 1.35, HEX.tealTint, HEX.teal, "What HR 2.0 rebuilds that identity can use", [
    "New interconnections, designed in onboarding",
    "HR data cleaned once, at the source",
    "One platform, so one standard crosswalk",
  ]);
  decision(s, "Name the HR-driven identity feed among the agency's HR 2.0 integration points, and name HR as the source in the Entra ID migration plan",
    "HR 2.0 point of contact; ISSO signs", "Phase 0, before interconnection design");
  sources(s, "Sources: OMB/OPM memo, Creating “Federal HR 2.0” (Dec 10, 2025), Appendices A–C; OPM Core HCM award; solicitation 24322626R0007. Book 03, Chapters 01, 03, 12.");
  narrate(s,
`Why now? Because Federal HR 2.0 is coming regardless. The joint OMB and OPM memo of December 10, 2025 moves the government's more than 100 Core HCM systems onto one platform, and agencies have paused their own Core HCM procurement. OPM awarded the platform to Oracle on June 10, 2026: Oracle Fusion Cloud HCM. Wave 2, the remaining agencies at about 1.1 million FTE, transitions in fiscal 2027. The first agencies were expected to start moving as fiscal 2027 began, with initial go-lives reported for January to March 2027. The government-wide goal is fiscal 2028. Those facts change; confirm them at engagement time.

An agency doesn't choose whether to implement HR 2.0. It chooses whether identity rides along. HR 2.0 rebuilds the interconnections anyway, during onboarding; HR data is reviewed and migrated anyway; and one platform means one standards-based crosswalk instead of one per provider. The solicitation already provisions the platform's own users from the government's identity provider. The reverse direction, HR events driving Entra ID, isn't in it; that's the agency's to propose.

The window closes at the interconnection. The memo's sample timeline runs about eight months, with interconnection go-live around month five, a planning assumption. A feed designed into onboarding costs a fraction of one retrofitted after. And the two migrations need each other: done separately, the directory migration moves ticket-created accounts as they are, and an HR feed targets a directory about to change.

So in Phase 0 the agency's HR 2.0 point of contact names the identity feed, and the ISSO signs the inventory.`,
  "Book 03, Chapter 03 — Federal HR 2.0 (The program facts; Why this is the opportunity, not the project; What OPM requires, and what it leaves to the agency); Chapter 01 (Why together); Chapter 12 (Phase 0 — Program alignment and its gate).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "One owner per fact: the attribute authority map");
  tag(s, "What");
  figure(s, "ch04-authority-map", 0.6, 6.9);
  sideBox(s, "Rules", "FaListCheck", HEX.navy, HEX.navyTint, "Operating rules", [
    "Corrections flow upstream, never in the directory",
    "No attribute writable in both directions",
    "Effective dates: changes known before they're true",
    "No field drives access until its use is approved",
  ]);
  decision(s, "Sign the attribute authority map: every attribute an access decision reads, its authoritative system and its data-quality owner",
    "ICAM governance body; data architect records", "Phase 1 gate");
  sources(s, "Sources: Oracle Fusion Cloud HCM documentation (positions, assignments, date effectivity); Microsoft Learn — source of authority. Book 03, Chapters 01, 04, 07.");
  narrate(s,
`Now, what data. The human capital system isn't "the payroll system". It's where four kinds of fact are created rather than copied: the worker record, the position, the assignment, and the supervisory hierarchy. Each is created by a business act.

Two clarifications prevent the usual misreading. HR doesn't compete with the identity platform: HR is authoritative for who a worker is and where they sit; the identity platform is authoritative for how identity is proven and whether a request is permitted now. And the book separates source of authority, HR owning a person's facts, from Microsoft's object source of authority, which directory masters the account. HR can be the source for a person whose account is still mastered in Active Directory.

The property that matters most is effective dating. A future-dated hire or separation exists in HR before it's true, with the date it becomes true. That's what makes day-one readiness and same-day revocation possible.

So the map has one rule with no exceptions: corrections flow upstream. A wrong department in a token is fixed in the HR record or the derivation rule, never by hand-editing the directory, because a hand-edited copy is a new fragment. No attribute is writable in both directions, and no source field drives access until the agency approves its owner, meaning, values, quality, correction path and permitted use.

The governance body signs the map, because it binds several offices at once, and the data architect keeps the record. It's a Phase 1 gate item.`,
  "Book 03, Chapter 04 — Attribute Authority (What a human capital system actually owns; System of record versus identity provider; Effective dating; Authoritative versus derived attributes; Operating rules); Chapter 01 (Authority boundaries); Chapter 07 (responsibility matrix); Chapter 12 (Phase 1 gate).");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "One person, one key, through every source change");
  tag(s, "What");
  figure(s, "ch04-identifier-layers", 0.6, 6.9, 2.1);
  T(s, "Worker type", [
    { text: "Worker type is the boundary attribute: ", options: { bold: true, color: HEX.navy } },
    { text: "it sets member or guest treatment, license, access ceiling and the policy baseline, so it's derived from the worker record, never set by hand.", options: { color: HEX.ink } },
  ], { x: 0.6, y: 3.8, w: 6.9, h: 1.25, fontSize: 14.5, valign: "middle" });
  sideBox(s, "Key", "FaFingerprint", HEX.amber, HEX.amberTint, "Why the key must be the agency's", [
    "Core HCM cutover changes the source key",
    "Contractors come from another source",
    "A rehire re-links the same person",
    "A conversion keeps one identity",
    "The SSN is never the join key",
  ]);
  decision(s, "Decide the enterprise person key the agency controls, and map every source, directory and credential key to it",
    "ICAM governance body; data architect records", "Before Phase 1 closes");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (IA-4, IA-4(4)); FIPS 201-3; Oracle Change Worker Type; Microsoft Graph user resource (employeeId). Book 03, Chapters 04, 07.");
  narrate(s,
`IA-4 asks agencies to manage identifiers and prevent their reuse. The book's discipline is stricter and simpler: one governed person record, explicit affiliation records, and a stable key for each layer. It takes several keys because each layer has its own lifecycle. The source key changes when the HR system changes. An affiliation key starts with each new employment or contract.

So the agency needs one enterprise person key it controls, assigned once and never changed, with every other key mapped to it. Projecting the HR source's person number works while there's one source that never reassigns numbers. But the Core HCM cutover is exactly a source change, and contractors come from a different source. Many agencies already have a long-standing enterprise identifier; whatever is chosen has to fit its carrier, and Entra ID's employee ID holds at most sixteen characters. Then the move to Core HCM changes only the source key, and nothing downstream has to. A rehire re-links the same person instead of minting a new identity, and a contractor who converts keeps one key. The Social Security number is never the join key; the layered identifiers exist so it never has to be.

Worker type deserves special notice: employee, contractor, intern or volunteer sets member or guest treatment, license, access ceiling and policy baseline. Derived from the worker record, a contractor loses access on the engagement's end date.

The governance body makes the identifier decision before Phase 1 closes, and the data architect keeps the record.`,
  "Book 03, Chapter 04 — Attribute Authority (One person, layered identifiers; The identifier decision; The worker-type boundary; Privacy); Chapter 07 (The data architect: one key; responsibility matrix: enterprise person key).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "Map to OPM's standards once, not to vendor fields");
  tag(s, "What");
  figure(s, "ch06-standard-attribute-layer", 0.6, 5.2);
  sideBox(s, "Standard", "FaBook", HEX.navy, HEX.navyTint, "What the standard gives identity", [
    "The same elements and codes in every agency",
    "Nature-of-action codes as lifecycle triggers",
    "One crosswalk that outlives the next vendor",
    "Codes for access, never display strings",
    "It stops at federal employees",
  ], { x: 6.05, w: 6.7 });
  decision(s, "Build one governed crosswalk from OPM's standard data elements to the canonical model; the codes access reads come from the standard",
    "Data architect; HR owns the code lists", "Phase 1");
  sources(s, "Sources: OPM data standards (metadata repository); OPM Guide to Processing Personnel Actions; Microsoft Learn — dynamic membership rules. Book 03, Ch. 01, 06, 07.");
  narrate(s,
`The schema names Oracle fields because Oracle is the platform. But the durable contract sits one level up: OPM's standard personnel data. Every agency on the platform records the same data elements, with the same codes and meanings, defined by OPM's data standards, now kept in an online metadata repository. And every personnel action carries a nature-of-action code from the same standards. OPM requires the coded blocks of the SF-50 to use only listed codes, which is what makes them dependable as access inputs.

Mapping identity to the standard instead of to vendor fields means one crosswalk serves every employee population, survives the next vendor change, and can be reused by any agency on the platform. Vendor field names become boundary logic: if the source changes, the source contract and transformation change, and lifecycle and access policy don't.

The design rules are short. Use a native Entra attribute wherever one exists, because the org chart, Lifecycle Workflows and access-package approvals read them directly. Add an extension attribute only where a rule can't read a value natively. Put codes in access attributes, never display strings, because a display name changes whenever someone retypes it.

The standard stops at federal employees. Contractors map into the same model from their own source, which comes later in the deck.

The data architect owns the canonical schema and the crosswalk, and HR owns the code lists the access attributes carry. Both are Phase 1 work.`,
  "Book 03, Chapter 06 — Canonical Attribute Schema (The standard-attribute layer; Design rules); Chapter 01 (Standards before vendor fields); Chapter 07 (HR's three asks; responsibility matrix: canonical schema and crosswalk changes).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "The provisioning pipeline, at decision level");
  tag(s, "What");
  figure(s, "ch05-provisioning-services", 0.6, 6.9, 2.35);
  T(s, "Connector", [
    { text: "No native connector: ", options: { bold: true, color: HEX.navy } },
    { text: "Oracle Fusion Cloud HCM has no prebuilt Entra connector, and Microsoft's own Oracle guidance is API-driven inbound provisioning, through a middleware the agency runs.", options: { color: HEX.ink } },
  ], { x: 0.6, y: 4.0, w: 6.9, h: 1.05, fontSize: 14, valign: "middle" });
  sideBox(s, "Forces", "FaRoute", HEX.teal, HEX.tealTint, "Choices it forces", [
    "The middleware sits inside the agency boundary",
    "Fail closed; every event leaves a record",
    "AD first; Entra ID as populations move",
    "Writeback optional, one way per attribute",
  ]);
  decision(s, "Authorize the workforce identity feed and its middleware inside the agency's boundary, with provenance for every event",
    "Authorizing official; identity engineering builds", "Before the pilot");
  sources(s, "Sources: Microsoft Learn — API-driven inbound provisioning; plan cloud HR provisioning; Oracle HCM tutorial; NIST SP 800-47 Rev. 1. Book 03, Chapters 05, 07.");
  narrate(s,
`How the data flows, at decision level. The logical architecture is stable: the authoritative source, a boundary transformation, the governed workforce identity model, a provisioning service, and the target directories. The Microsoft realization is replaceable: Core HCM, a middleware of Azure Functions or Logic Apps, Microsoft Graph's bulk upload endpoint, the Entra provisioning service, and Entra ID or Active Directory.

Why that pattern? Oracle Fusion Cloud HCM has no native Entra connector; Entra's prebuilt HR connectors are for Workday and SAP SuccessFactors. Microsoft's own Oracle guidance is the API-driven pattern. And it gives one entry point, so one provenance stream.

The middleware runs inside the agency's authorization boundary and does five things for every event: validate and fail closed, apply events in order, normalize to SCIM, write a provenance record, and reconcile the result. No record, no verifiable outcome.

The same feed lands in two places. While Active Directory masters a population's accounts, HR lands users in AD and they sync up. As a population's accounts move to the cloud, HR lands them in Entra ID, and AD becomes a downstream target that shrinks as applications move. Writeback to HR is optional and one-way per attribute, and nothing depends on it.

The feed and middleware sit inside an authorization boundary, and the interconnection with Core HCM is an information exchange between systems. The authorizing official authorizes it and accepts its residual risk, before the pilot.`,
  "Book 03, Chapter 05 — The Provisioning Pipeline (Logical architecture and Microsoft realization; Why API-driven inbound provisioning; The middleware: five duties per event; Two landing zones; Writeback); Chapter 07 (The ISSO and the authorizing official; responsibility matrix: authorize the feed).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "Owners, users and guards of workforce identity");
  tag(s, "Who");
  figure(s, "ch07-owners-users-guards", 0.6, 6.9);
  sideBox(s, "Owners", "FaUsersGear", HEX.teal, HEX.tealTint, "Who owns what", [
    "HR: personnel data and its quality",
    "OPM: platform, standards, interconnection",
    "Contractor sources: who HR doesn't cover",
    "Data architect: one model, one key",
    "Help desk routes data errors; never fixes",
  ]);
  decision(s, "Name an accountable owner, by role, for each HR-mastered attribute, with a quality expectation HR accepts before automation",
    "HR leadership (CHCO)", "Phase 1, before the map is signed");
  sources(s, "Sources: OMB M-19-17; NIST SP 800-37 Rev. 2 (information owner); OMB M-19-23; OPM data standards guidance; Microsoft Learn — Entra roles. Book 03, Chapter 07.");
  narrate(s,
`Who owns it? The earlier chapters decided which system is authoritative for each fact. This one decides which people are, and most of them sit outside the CIO's organization. A system of record can be authoritative for worker type and still hold the wrong value for half the contractors, if no office accepts that keeping it right is its job.

Owners first. HR owns the facts only a personnel action creates, and their quality, at the source. OPM owns the government-wide definitions and the platform; the agency owns its side of the interconnection. And contractor sources own the people HR doesn't cover.

Users consume governed projections and change none of them. The identity team runs the directories and the provisioning. Security owns the leaver path end to end. The help desk moves from routine tickets to exceptions, and routes data errors to their owner instead of fixing them, so it holds a scoped help desk role rather than one that can rewrite user properties. Application owners decide the access rules for their applications.

The data architect keeps the parts consistent, as steward of the model rather than owner of any value: one name, one definition, one accountable owner and one key per attribute, under the agency's data governance body.

The program asks three concrete things of HR: name an owner for each HR-mastered attribute, own the code lists, and treat reassigning a departed supervisor's direct reports as HR work. HR leadership names those owners, by role, in Phase 1.`,
  "Book 03, Chapter 07 — Who Owns Workforce Identity (introduction; Who owns the data; Who uses it; The data architect; Where ownership fails: an owner without the means).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "Who decides what for workforce identity");
  tag(s, "Who");
  const owners = [
    ["Authority map, person key, contractor source", "ICAM governance body"],
    ["Meaning and code lists of HR attributes", "HR"],
    ["Canonical schema and crosswalk", "Data architect"],
    ["Privacy basis, PIA, minimized attribute set", "Privacy office"],
    ["Write rights; leaver timing and path", "Security"],
    ["Contractor sponsorship and end dates", "Contracting (the COR)"],
    ["PIV issuance and termination", "PIV office"],
    ["Access rules for an application", "Application owner"],
    ["Authorize the feed; accept residual risk", "Authorizing official"],
  ];
  leftTable(s, ["Decision", "Decides"], owners.map((r) => [{ text: r[0] }, bold(r[1], r[1] === "Authorizing official" ? HEX.amber : HEX.teal)]),
    [4.25, 2.65], [0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36], 12);
  sideBox(s, "Fails", "FaTriangleExclamation", HEX.red, HEX.redTint, "Where ownership usually fails", [
    "Ownership by console",
    "The help desk as a shadow source",
    "A key owned by the source system",
    "A leaver owned in pieces",
    "Privacy brought in at go-live",
  ]);
  decision(s, "Give security end-to-end ownership of the leaver path and its timing, with the AO consulted on any threshold looser than policy",
    "Security (CISO)", "Before leaver automation");
  sources(s, "Sources: OMB M-19-17; NIST SP 800-37 Rev. 2; NIST SP 800-79-2; FIPS 201-3. Book 03, Chapter 07 (responsibility matrix; ownership failures) and Chapter 12 (roles).");
  narrate(s,
`The book's responsibility matrix, in one view, with one decider per row. "Governance body" is the agency's ICAM governance structure under M-19-17, chaired by the executive sponsor.

The governance body decides the three things that bind several offices at once and that no single office can impose on the others: who owns each attribute, the enterprise person key, and the contractor source. HR decides what its attributes mean and owns their code lists. The data architect decides schema and crosswalk changes. The privacy office decides the disclosure basis, the privacy impact assessment and the minimized attribute set. Identity engineering decides the provisioning rules. Security decides who may write HR-mastered attributes, and the leaver timing. Contracting, through the COR, owns contractor sponsorship and end dates. The PIV office owns issuance and termination. Application owners decide access rules for their applications. And the authorizing official authorizes the feed and accepts residual risk.

The failures on the right share a root: in a ticket-driven estate, whoever can make a change ends up owning the data. The directory team fixes a wrong title because it can; HR, IT and the PIV office each do part of a leaver and nobody owns completion; and privacy first sees the feed at go-live.

The decision here is the leaver. Security owns the path end to end, the block threshold, the schedule and the grace periods, and consults the authorizing official, because a threshold looser than policy is a risk acceptance.`,
  "Book 03, Chapter 07 — Who Owns Workforce Identity (The responsibility matrix and its comments; Where ownership fails, and how the program prevents it; Who uses it: security).");
}

// ------------------------------------------------------------------ Who 3
{
  const s = content(S_WHO, "Privacy and PIV: guards with clocks of their own");
  tag(s, "Who");
  sideBox(s, "Privacy", "FaLock", HEX.red, HEX.redTint, "The privacy office", [
    "Moving HR records into identity is a disclosure",
    "Inside the agency: need to know; outside: a routine use",
    "A new routine use waits 30 days after publication",
    "An updated PIA, and only the attributes decisions read",
    "The privacy office decides, not the project",
  ], { x: 0.6, w: 5.95, minH: 3.55 });
  sideBox(s, "PIV", "FaIdCard", HEX.navy, HEX.navyTint, "The PIV and credentialing office", [
    "Sponsorship and adjudication can't be outsourced",
    "No one person can issue a PIV card alone",
    "A card not collected: terminated within 18 hours",
    "The separation record is the notification",
    "It decides how its system receives that record",
  ], { x: 6.8, w: 5.95, minH: 3.55 });
  decision(s, "Decide the privacy basis, the PIA update and the minimized attribute set in Phase 1, because those timelines can't be compressed at go-live",
    "Privacy office (SAOP)", "Phase 1 gate");
  sources(s, "Sources: Privacy Act, 5 U.S.C. 552a; OMB A-108; A-130; M-03-22; OPM/GOVT-1; FIPS 201-3; NIST SP 800-79-2. Book 03, Chapters 04, 07; Appendix B.");
  narrate(s,
`Two offices guard the data and the credential, and each brings a clock the project can't move.

The privacy office. HR records are a Privacy Act system of records, so moving them into identity systems is a disclosure that needs a basis. Inside the agency that maintains them, the Act permits disclosure to employees who need the record for their duties, and an identity platform the agency runs for its own access decisions normally rests on that. A routine use is for disclosure outside the agency, for example to a shared-service provider, and OMB's guidance says a new or significantly modified routine use can't be relied on until at least thirty days after it's published. Which basis applies depends on who maintains the records and where the platform runs, so the decision belongs to the privacy office, not the project. It also needs an updated privacy impact assessment, and carries only the attributes an identity decision reads.

The PIV office. FIPS 201-3 requires separation of duties, so no single person can issue a card without another authorized person, and NIST's issuer guideline says only the agency can decide sponsorship and adjudication, so those can't be outsourced. The office also owns termination: for a card that can't be collected, normal termination procedures must be completed within 18 hours of notification. In HR-driven identity, the notification is the separation record, and the PIV office decides how its card system receives it.

Privacy comes in at Phase 1, because those timelines can't be compressed at go-live.`,
  "Book 03, Chapter 07 — Who Owns Workforce Identity (Who guards it: the privacy office; the PIV and credentialing office); Chapter 04 (Privacy: the disclosure basis); Appendix B; Chapter 12 (Phase 1).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "Joiner, mover, leaver: by code, not by ticket");
  tag(s, "How");
  figure(s, "ch08-personnel-action-lifecycle", 0.6, 3.0);
  sideBox(s, "Events", "FaArrowsRotate", HEX.navy, HEX.navyTint, "Five events, five outcomes", [
    "Joiner: ready before day one",
    "Mover: old access leaves as new arrives",
    "Leaver: block first, then reconcile",
    "Rehire: the same person, the same key",
    "Conversion: re-derived, not re-created",
  ], { x: 3.8, w: 4.6, minH: 3.4 });
  sideBox(s, "Rules", "FaScaleBalanced", HEX.amber, HEX.amberTint, "Rules that prevent harm", [
    "Leave is not a leaver",
    "A separation wins precedence",
    "Cancellations re-enable, with evidence",
    "Contractors: contract and sponsor dates",
  ], { x: 8.6, w: 4.15, minH: 3.4 });
  decision(s, "Validate the nature-of-action trigger table, its exceptions and precedence rules before any lifecycle event is automated",
    "HR; security, labor relations, privacy validate", "Phase 1, before automation");
  sources(s, "Sources: OPM Guide to Processing Personnel Actions (Oct 2026 edition); NIST SP 800-53 Rev. 5 (PS-4, PS-5, IA-4); Microsoft Learn — Lifecycle Workflows. Book 03, Ch. 08.");
  narrate(s,
`Now, how. Joiner, mover and leaver, plus the two transitions estates forget until they hurt, rehire and conversion, are the five state changes a worker record goes through, and each maps to a fixed set of identity actions. A joiner's account is created ahead of the start date, with baseline access ready on day one. A mover's attributes are re-stamped, so the old organization's access leaves as the new one's arrives, and a review covers what remains. A leaver is blocked first and reconciled to the end. A rehire re-links the prior identity, and a conversion re-derives access on the same key.

What matters is the direction of causation. Nobody remembers to disable a leaver; the separation record causes it, on the effective date. Tickets survive only for exceptions.

For federal employees, the triggers already exist: every personnel action carries a nature-of-action code, and its first digit sets the family. Accessions are joiners, separations are leavers, conversions convert, and position and duty-station changes are movers. That's a government-wide trigger vocabulary instead of a local one. The mapping is the book's proposed interpretation, not an OPM rule.

Three rules prevent harm. Leave is not a leaver: furlough, leave without pay and suspension keep the person. A separation wins precedence when two actions land in one cycle. And a cancelled separation re-enables what it disabled, with evidence. Contractors have no SF-50; their events are contract and sponsorship dates.

HR, security, labor relations, privacy and personnel policy validate the table before anything automates.`,
  "Book 03, Chapter 08 — Joiner, Mover, Leaver (The lifecycle is an event stream; Personnel actions are the triggers; the three rules; Joiner; Mover; Leaver; Rehire and conversion); Appendix A — Lifecycle Rules.");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "Block first, then reconcile every credential");
  tag(s, "How");
  figure(s, "ch09-leaver-sequence", 0.6, 3.8);
  sideBox(s, "Creds", "FaKey", HEX.red, HEX.redTint, "Credentials, at decision level", [
    "Disabling an account doesn't revoke a PIV or device certificate",
    "Bind each PIV card by a high-affinity value, with one automated writer",
    "A PIV revocation reaches Entra on the CA's schedule; token revocation closes it now",
    "Built-in workflows don't revoke cards or retire devices: custom tasks do",
    "Two measures: separation to block, and to the last revocation",
  ], { x: 4.65, w: 8.1 });
  decision(s, "Make the card-management integration the only writer of the PIV binding, and require high-affinity binding in the tenant",
    "Security; the PIV office runs the CMS", "Before CBA and leaver automation");
  sources(s, "Sources: FIPS 201-3; FICAM ILM Playbook; Microsoft Learn — CBA, certificateUserIds, CRL validation, revoke user access, Lifecycle Workflows tasks. Book 03, Chapter 09.");
  narrate(s,
`Credentials need their own decision, because certificates don't follow the account. A PIV authentication certificate stays valid until it expires or is revoked, and an Intune device certificate stays on the device until Intune removes it. Disabling or deleting the Entra user touches neither. A lifecycle that stops at the account leaves a former worker's credentials live in every relying party that trusts them.

At the joiner, without the binding between the card's certificate and the account, a PIV card is just a badge. The book prefers a high-affinity binding, an identifier that can't be reused, so one certificate signs in as one user. That value changes on every reissue, so it's lifecycle data and needs one writer. Microsoft warns that for synchronized users, Active Directory administrators can change it for any account. So the program allows one automated writer, the card-management integration, and treats any other write as drift.

At the leaver, block first. Disable the account, then revoke sessions and refresh tokens: that closes Entra now. Then revoke the PIV card and derived credentials, retire or wipe devices, and remove access, in parallel, and reconcile every result. Dispose of the account last, because deleting it leaves device certificates valid. A PIV revocation reaches Entra only when the CA's revocation list refreshes, which is why the token step matters. The built-in workflow tasks don't revoke a card or retire a device, so custom tasks call those systems.

Security decides who may write the binding; the PIV office runs the card system.`,
  "Book 03, Chapter 09 — Credentials and Certificates (Why certificates need their own chapter; Binding the PIV certificate to the Entra user; Revocation checking; The canonical leaver sequence; Running it from Lifecycle Workflows; What the evidence must show); Chapter 07 (responsibility matrix: write permissions).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "Contractors: the source decision is still open");
  tag(s, "How");
  const opts = [
    ["Core HCM contingent worker", "A full worker record and lifecycle", "No contract, sponsor or vetting layer"],
    ["PIV sponsorship system", "Sponsor, adjudication, expiry", "Only people who get a card"],
    ["Contractor suitability register", "Contract link and suitability", "Often no engagement end date"],
    ["Non-employee lifecycle service", "Sponsor workflows, attestation", "A third source to govern"],
  ];
  leftTable(s, ["Option", "What it gives", "What it lacks"],
    opts.map((r) => [bold(r[0]), { text: r[1] }, { text: r[2] }]), [2.3, 2.3, 2.3], [0.42, 0.62, 0.62, 0.62, 0.62], 12);
  sideBox(s, "Rules", "FaUserTie", HEX.teal, HEX.tealTint, "Whichever source is chosen", [
    "One model and one person key",
    "One authority per fact; a federal sponsor",
    "Access ends at the earliest end condition",
    "Start read-only: reconcile register and PIV",
    "Ship the leaver trigger first",
  ]);
  decision(s, "Decide the contractor and vendor source, one authority per fact, and retire COR spreadsheets as a source of truth",
    "ICAM governance body", "Phase 1; revisit at Core HCM go-live");
  sources(s, "Sources: Oracle Fusion Cloud HCM — contingent workers; FIPS 201-3; NIST SP 800-79-2. Book 03, Chapters 06, 07, 12. The book leaves this decision to the agency.");
  narrate(s,
`One decision the book deliberately leaves open: where contractors come from. Federal HR 2.0 moves federal employees, and OPM's standards describe them. Contractors and vendors, often a large share of accounts and the share most likely to be orphaned, are in neither. Today they're usually tracked in COR spreadsheets, with a sponsor, a contract and an end date nobody is obliged to keep current. A spreadsheet can't be a source of authority.

There are four options, and no single one is complete. Core HCM's contingent worker type gives a full worker record and lifecycle, but no contract, sponsorship or vetting layer. The PIV sponsorship system has sponsorship, adjudication and an expiry, but only for people who get a card. A contractor suitability register links a person to a contract under agency authority, but often records the vetting decision, not the end of the engagement. And a non-employee lifecycle service adds a third source to govern.

So don't pick one. Give each fact one authority, and hang the record on an accountable federal sponsor who is mastered in HR. Access then ends at the earliest end condition: the contract ends, suitability is withdrawn, the card is revoked, or the sponsor leaves or misses recertification.

Start with what exists: reconcile the register and PIV enrollment against the directories, read-only, to measure the problem. Then use the register and sponsor attestation until Core HCM, leaver trigger first. The governance body decides in Phase 1, and revisits at Core HCM go-live.`,
  "Book 03, Chapter 06 — Canonical Attribute Schema (Contractors and vendors; One fact, one authority; Before a register becomes an authority; Sequence: start with what already exists); Chapter 07 (Contractor sources own the people HR doesn't cover); Chapter 12 (Phase 1; open verification register).");
}

// ------------------------------------------------------------------ How 4
{
  const s = content(S_HOW, "Seven gated phases, and the feed Gate G1 needs");
  tag(s, "How");
  figure(s, "ch12-phase-gates", 0.6, 12.15, 2.05);
  panel(s, "Gates", 0.6, 3.75, 5.95, 1.35, HEX.amberTint, HEX.amber, "Proposed starting criteria, agency-approved", [
    "Correlation of at least 99% on the pilot cohort",
    "Shadow mode before the pipeline acts",
    "Zero missed leavers across a pay-period cycle",
  ]);
  panel(s, "G1", 6.8, 3.75, 5.95, 1.35, HEX.tealTint, HEX.teal, "Program Gate G1, Foundation Complete", [
    "HR-to-cloud provisioning live for the foundation",
    "Attribute slots in use: free and single-writer",
    "So an HR connector can't stall the rollout",
  ]);
  decision(s, "Hold the rollout until Gate G1: the HR feed operational for the foundation scope, its attribute slots confirmed free and single-writer",
    "Program steward", "Gate G1, end of Foundation");
  sources(s, "Sources: Book 03, Chapter 12 (phases, gates, thresholds); Book 00, Chapter 09 (Gate G1 checklist); Book 01, Chapter 12 (Phase 1, G1, risk register).");
  narrate(s,
`The plan has seven phases, and each phase's gate is the next one's precondition. Align the program; settle attribute authority and the schema; build and test the pipeline; run a pilot; automate the lifecycle and derive access; cut over population by population; then sustain it.

One caveat governs the whole program: the source must be correct, not just designated. A drifted HR feed produces drifted access faster than any ticket queue could, so data quality at the source is Phase 1 work. Phases 1 and 2 produce no visible change for end users, which is exactly why they're tempting to skip.

The numbers in the gates, such as 99 percent correlation on the pilot cohort or zero missed leavers across a full pay-period cycle, are proposed starting criteria, not federal requirements. The agency approves or replaces each one, and a risk-tiered threshold, tighter for privileged populations, is usually more useful than one number. The pilot runs in shadow mode first: the pipeline computes what it would do, and every difference is explained before it acts. And automation turns on leaver first, because that's where the risk and the evidence value are.

This ties to the wider program. In Book 01's roadmap, Phase 1, Foundation, includes the HR-to-cloud provisioning feed for the foundation scope, and Gate G1, Foundation Complete, requires it operational, with the attribute slots in use confirmed free and single-writer. Book 01's risk register names the failure it prevents: an HR connector that breaks mid-rollout and stalls the program. The steward decides G1.`,
  "Book 03, Chapter 12 — Execution Plan (Sequencing principle; About the numbers in the gates; Phases 0–6; The program at a glance); Book 00, Chapter 09 (Gate G1 — Foundation Complete); Book 01, Chapter 12 (Phase 1 — Foundation; Gate G1; risk register).");
}

// ------------------------------------------------------------------ How 5
{
  const s = content(S_HOW, "Cut over one population at a time, then close tickets");
  tag(s, "How");
  figure(s, "ch05-two-patterns", 0.6, 6.0);
  sideBox(s, "Cutover", "FaDoorClosed", HEX.navy, HEX.navyTint, "For each population", [
    "Cut over as it moves to Entra ID",
    "Acceptance tests in business terms, signed",
    "A dry run on production data, writes off",
    "Seven days in which every change traces to HR",
    "Rollback: pause the job, restore the old path",
  ], { x: 6.85, w: 5.9 });
  decision(s, "Close the account-creation ticket path for each population once its validation report is signed and seven days prove HR is the sole source",
    "ISSO, HR and the business owner sign", "Per population, at its Entra ID move");
  sources(s, "Sources: Microsoft Learn — source of authority; road to the cloud; provisioning logs; synchronizationJob pause. Book 03, Chapters 05, 12; Appendix C.");
  narrate(s,
`Cutover happens one population at a time, and each population cuts over to HR-driven identity as it moves to Entra ID. That's where the two migrations meet. While Active Directory still masters a population's accounts, HR lands them in AD and they sync to the cloud. Once their accounts move to the cloud, HR lands them in Entra ID directly, and an AD account is provisioned from Entra ID only where an application still needs one. Retargeting a population is a configuration change, gated on evidence, with the AD leg kept dormant but intact until nothing remains synced. And the feed has to be ready when the agency's Core HCM interconnection goes live.

The cutover itself follows Appendix C. Acceptance tests are written in business terms, by worker type and event, so HR, the business and security can read them. Anything that could leave a separated person with access, or lock out an active one, blocks acceptance. A short validation report is signed before the cutover is scheduled. Then a dry run on production data with writes disabled, cutover with spot checks, and a written rollback: pause the provisioning job, which keeps its state, and return the population to the prior process.

Then the proof: for seven days, every create, change and disable must trace to an HR event. When that holds, the ticket path closes. Nobody requests an account for a new hire, because the hire causes it. HR, the identity owner, the ISSO and the population's business owner sign.`,
  "Book 03, Chapter 12 — Execution Plan (Phase 5 — Cutover, population by population); Chapter 05 (Two landing zones; Over the Entra ID migration); Appendix C — Acceptance and Cutover (Acceptance; The validation report; Dry run, cutover and rollback; Proving HR is the sole source; Closing the ticket path).");
}

// ------------------------------------------------------------------ How 6
{
  const s = content(S_HOW, "How you'll know it works: six numbers");
  tag(s, "How");
  const metrics = [
    ["Separation to block", "Access disabled within the period (PS-4)"],
    ["Separation to revocation", "Every credential revoked, or excepted"],
    ["Transfer to review", "Residual access reviewed (PS-5)"],
    ["Joiner readiness", "Ready at the start of day one"],
    ["Correlation coverage", "Orphans as a query, not a hunt"],
    ["Derivation purity", "Access computed by rule, not by hand"],
  ];
  leftTable(s, ["Metric", "What it shows"], metrics.map((r) => [bold(r[0]), { text: r[1] }]),
    [2.6, 4.3], [0.42, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], 12.5);
  sideBox(s, "Evidence", "FaFileShield", HEX.teal, HEX.tealTint, "Evidence that outlives the account", [
    "Entra keeps most logs for 30 days",
    "So route them to the agency's store",
    "Supports AC-2, PS-4, PS-5, IA-4; closes none",
    "Expect a burst of findings in month one",
  ]);
  decision(s, "Adopt the six lifecycle metrics as system-level monitoring metrics, and keep every log in the agency's store from the pilot's first day",
    "ISSO; security sets leaver thresholds", "From the pilot's first day");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AC-2, PS-4, PS-5, IA-4, CA-7, AU-11, SI-12); Microsoft Learn — provisioning logs, Lifecycle Workflows history, retention. Book 03, Ch. 11.");
  narrate(s,
`How will you know it's working? An event-driven lifecycle is also a measured one: every interval from event to action is a number. The book proposes six. Separation to block, the interval to a disabled account and revoked sessions, is the PS-4 measure. Separation to revocation runs to the last confirmed credential revocation. Transfer to review measures PS-5. Joiner readiness is the share of new hires ready at the start of day one. Correlation coverage turns the orphan population into a query instead of a hunt. And derivation purity is the share of access computed by rule rather than assigned by hand.

None of these numbers exists in a ticket-driven estate, because the events aren't recorded as events. They're also what continuous monitoring asks for: CA-7 has the organization set system-level metrics and how often to monitor them. Choosing them, and their thresholds, is the agency's decision.

Expect a surprise in the first month: a burst of high-severity drift findings. That burst is the measurement working, not the pipeline failing.

Evidence has to outlive the account. Entra ID keeps provisioning logs, workflow history and audit logs for about thirty days, far shorter than any federal records schedule, and expired data can't be recovered. So route them to the agency's log store from the pilot's first day. And the book's caution holds: the architecture supports these controls; it doesn't satisfy them on its own.

The ISSO owns the evidence, and security sets the leaver thresholds.`,
  "Book 03, Chapter 11 — Drift, Metrics and Evidence (The measured lifecycle; Drift between HR and the directory; The evidence each event leaves; Control support); Chapter 07 (The ISSO and the authorizing official; responsibility matrix: leaver timing); Chapter 12 (Phase 6).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Designate HR as the source of authority; start now", "ICAM governance body", "Now"],
    ["Name the identity feed among HR 2.0 integration points", "HR 2.0 contact; ISSO", "Phase 0"],
    ["Sign the attribute authority map", "ICAM governance body", "Phase 1 gate"],
    ["Decide the enterprise person key the agency controls", "ICAM governance body", "Before Phase 1 closes"],
    ["One governed crosswalk to OPM's standard elements", "Data architect; HR", "Phase 1"],
    ["Authorize the feed inside the agency's boundary", "Authorizing official", "Before the pilot"],
    ["Name an owner and quality bar per HR attribute", "HR leadership", "Phase 1"],
    ["Own the leaver path end to end", "Security", "Before leaver automation"],
    ["Privacy basis, PIA and the minimized attribute set", "Privacy office", "Phase 1 gate"],
    ["Validate the nature-of-action trigger table", "HR, with validators", "Before automation"],
    ["One automated writer for the PIV binding", "Security; PIV office", "Before CBA at scale"],
    ["Decide the contractor source; retire COR spreadsheets", "ICAM governance body", "Phase 1"],
    ["Hold rollout until Gate G1's HR feed is live", "Program steward", "Gate G1"],
    ["Close each population's ticket path after the proof", "ISSO, HR, business owner", "Per population"],
    ["Adopt the six metrics; keep evidence off the directory", "ISSO; security", "From the pilot"],
  ];
  const fs11 = 11, rh = [0.32, ...asks.map(() => 0.28)];
  asks.forEach((r) => r.forEach((c, j) => {
    const w = [6.6, 3.2, 2.35][j] - 0.2;
    if (linesFor(c.length, w, fs11) > 1) console.warn(`  ! close table cell may wrap: ${c}`);
  }));
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts([6.6, 3.2, 2.35], { y: 1.4, w: 12.15, fontSize: fs11, rowH: rh, margin: [0.02, 0.1, 0.02, 0.1] }));
  T(s, "Close line", [{ text: "Nobody requests an account for a new hire.  ", options: { bold: true, color: HEX.amber } },
    { text: "The hire causes it, the separation ends it, and every step leaves evidence." }],
    { x: 0.6, y: 6.05, w: 12.15, h: 0.52, fontSize: 15, valign: "middle", align: "center" });
  sources(s, "Sources: OMB/OPM Federal HR 2.0 memo; OMB M-19-17; FIPS 201-3; NIST SP 800-53 Rev. 5. Book 03, Chapters 01–12; Appendix C. Undated timings are design guidance.");
  narrate(s,
`So, the decisions, with their owners.

The ICAM governance body, chaired by the sponsor, designates HR as the source of authority now, signs the attribute authority map, decides the enterprise person key before Phase 1 closes, and decides the contractor source, retiring the COR spreadsheets as a source of truth.

In Phase 0, the agency's HR 2.0 point of contact names the identity feed among the integration points, and the ISSO signs the inventory.

In Phase 1, HR leadership names an owner and a quality expectation for each HR-mastered attribute; the data architect builds one crosswalk to OPM's standards, with HR owning the code lists; HR and its validators confirm the nature-of-action trigger table; and the privacy office decides the disclosure basis, the PIA and the minimized attribute set.

The authorizing official authorizes the feed inside the agency's boundary before the pilot. Security owns the leaver path end to end, and makes the card-management integration the only writer of the PIV binding. The program steward holds the rollout until Gate G1 shows the HR feed live. The ISSO, HR and each population's business owner close its ticket path after seven days of proof. And the ISSO adopts the six metrics, with every log kept in the agency's store from the pilot's first day.

The end state is simple to say. Nobody requests an account for a new hire: the hire causes it, the separation ends it, and every step leaves evidence. Book 03 has the detail, with every claim footnoted. Thank you.`,
  "Book 03, Chapter 01 (The ask; What success looks like); Chapter 07 — Who Owns Workforce Identity (The responsibility matrix); Chapters 03, 04, 06, 08, 09, 11, 12 and Appendix C (the decisions on each slide); Book 00, Chapter 09 (Gate G1).");
}

// ------------------------------------------------------------------ Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: federal HR, identity and privacy policy");
  const src = [
    "OMB/OPM, Creating “Federal HR 2.0” by Consolidating Core Human Capital Management Across the Federal Government (December 10, 2025), §I–§II and Appendices A–C.  ·  OPM Federal HRIT Modernization Core HCM award (June 10, 2026) and solicitation 24322626R0007, Amendment 4.  ·  OMB M-19-16 (QSMOs).",
    "OPM data standards (online metadata repository); OPM Guide to Processing Personnel Actions (October 2026 edition); OPM/GOVT-1 system-of-records notice.  ·  The Privacy Act, 5 U.S.C. 552a; OMB Circulars A-108 and A-130; OMB M-03-22 (privacy impact assessments); OMB M-19-23.",
    "OMB M-22-09 (Zero Trust); OMB M-19-17 (ICAM); OMB M-19-26 (TIC 3.0).  ·  GSA/FICAM Identity Lifecycle Management Playbook (best practice, not policy); FICAM Architecture.  ·  CISA Zero Trust Maturity Model, Version 2.0.",
    "NIST SP 800-207; SP 800-53 Rev. 5, release 5.2.0 (AC-2, AC-2(1), PS-4, PS-5, IA-4, IA-4(4), CA-7, AU-6, AU-11, SI-12); SP 800-37 Rev. 2; SP 800-47 Rev. 1; SP 800-63-4; SP 800-79-2; SP 800-157.  ·  FIPS 201-3.",
    "Full footnotes with links and access dates (October 20, 2026): Book 03, every chapter and Appendices A–C (whalermike.github.io/modernization-workbook/docs/books/b03-hr-identity/). Gate G1: Book 00, Chapter 09; Book 01, Chapter 12.",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: HR and identity platforms, October 2026");
  const src = [
    "Oracle Fusion Cloud HCM documentation: positions, assignments and date-effective objects; HCM Extracts and Atom feeds; the workers REST resource; contingent workers, renewal and Change Worker Type; SCIM APIs.",
    "Microsoft Learn: What is HR-driven provisioning?; plan cloud HR application to Microsoft Entra user provisioning; API-driven inbound provisioning concepts, limits and Graph permissions; the Oracle HCM integration tutorial; provisioning agent prerequisites.",
    "Microsoft Learn: source of authority for users and groups; road to the cloud; Microsoft Graph user resource (employeeId, employeeType, employeeHireDate, employeeLeaveDateTime, employeeOrgData); dynamic membership rules; administrative units.",
    "Microsoft Learn: Lifecycle Workflows (templates, built-in tasks, custom task extensions, schedule, run history); entitlement management and access reviews; ID Governance licensing and GCC availability; certificate-based authentication, certificateUserIds and CRL validation; revoke user access; Intune device certificates.",
    "Microsoft Learn: Entra ID data retention; provisioning logs; audit logs; emergency access accounts.  ·  Federal PKI Common Policy (PIV issuing CAs).",
  ];
  T(s, "Source list", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}

// ------------------------------------------------------------------ Backup: federal requirements (the deck's endnotes)
{
  const s = D.content("Backup", "Federal requirements: full citations");
  const R = [
    ["NIST SP 800-53 Rev. 5, Security and Privacy Controls", "AC-2 Account Management (including AC-2l, aligned with personnel termination and transfer); AC-2(1) Automated System Account Management", "Sept. 2020, updated Dec. 10, 2020; release 5.2.0, Aug. 27, 2025", "HR track: accounts follow HR events"],
    ["NIST SP 800-53 Rev. 5, Security and Privacy Controls", "PS-4 Personnel Termination; PS-5 Personnel Transfer", "Sept. 2020, updated Dec. 10, 2020; release 5.2.0, Aug. 27, 2025", "Leaver and mover"],
    ["NIST SP 800-53 Rev. 5, Security and Privacy Controls", "IA-4 Identifier Management; IA-4(4) Identify User Status (for example, contractor)", "Sept. 2020, updated Dec. 10, 2020; release 5.2.0, Aug. 27, 2025", "One person key; worker type"],
    ["OMB M-19-17, Enabling Mission Delivery through Improved Identity, Credential, and Access Management", "The enterprise ICAM policy framework; §IV Governance", "May 21, 2019", "HR as the source of authority"],
    ["OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles", "§III.A Identity: centralized identity management systems for agency users", "Jan. 26, 2022", "HR track"],
  ];
  s.addTable([head(["Primary source", "Section or control", "Date", "Used for"]),
    ...R.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }, { text: r[3] }])],
    tableOpts([3.3, 4.85, 1.95, 2.05], { y: 1.45, fontSize: 11.5, rowH: [0.36, 0.7, 0.7, 0.7, 0.7, 0.7] }));
  txt(s, "Requirements note", "Mapping from Book 03, Chapter 11 (Control support) and Chapters 02 and 08, sources checked October 20, 2026. Control support, not control closure: each control also needs agency policy, organization-defined parameters, procedures and assessment.",
    { x: 0.6, y: 6.0, w: 12.15, h: 0.55, fontSize: 11, italic: true, color: HEX.slate });
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
