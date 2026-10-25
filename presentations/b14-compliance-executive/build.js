// Book 14 — Federal Compliance & Authorization: the 30-minute EXECUTIVE briefing (Why / What / Who / How).
// Audience: authorizing officials, the CISO and CIO, ISSOs, the privacy officer and program managers.
// Decision-centered: every decision slide states the decision, its owner and when it's needed. No configuration detail.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B14_Compliance_Executive.pptx
// Every fact comes from a footnoted chapter of docs/books/b14-compliance/, named in the notes. Decision owners come
// from the book's responsibility matrix (Chapter 10) and the chapters' ownership tables; where an owner or a timing
// is the program's own recommendation, the notes say "design" or "the program's model".
const path = require("path");
const fs = require("fs");
const D = require("../_build/lib.js")({ book: "Book 14", title: "Federal Compliance & Authorization: executive briefing",
  footer: "Federal Modernization Workbook  ·  Book 14 Federal Compliance & Authorization  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B14_Compliance_Executive.pptx";

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

// ---------------------------------------------------------------- fit checks (print "!" on a likely overflow)
const LIMIT = 6.6; // the Sources line starts here
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) console.warn(`  ! title over 58 characters (${t.length}): ${t}`);
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
  if (text.length > 190) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return D.sources(s, text);
};

// ---------------------------------------------------------------- layout helpers (as in the Book 11 briefing)
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
// A row of step boxes across the top (labels above each step's heading), then two panels under it.
const steps = (s, prefix, list, tints, labels) => {
  const n = list.length, gap = 0.125, w = (12.15 - gap * (n - 1)) / n;
  list.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${prefix} ${i + 1}`, x, 1.5, w, 1.3, tints[i]);
    fit(`${prefix} step ${i + 1}`, lh(18) + lines(f[0], w - 0.24, 14.5) * lh(14.5) + lines(f[1], w - 0.24, 12.5) * lh(12.5), 1.2);
    txt(s, `${prefix} ${i + 1} text`, [
      { text: labels ? labels[i] : `${i + 1}`, options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: "Cambria", breakLine: true } },
      { text: f[0], options: { bold: true, color: HEX.navy, fontSize: 14.5, breakLine: true } },
      { text: f[1], options: { fontSize: 12.5 } },
    ], { x: x + 0.12, y: 1.55, w: w - 0.24, h: 1.2, valign: "middle" });
  });
};
const panels = (s, list) => list.forEach((p, i) => {
  const x = 0.6 + i * 6.15;
  box(s, `Panel ${i + 1}`, x, 2.98, 6.0, 2.12, p[3]);
  icon(s, p[0], x + 0.2, 3.06, 0.56, p[2]);
  txt(s, `Panel head ${i + 1}`, p[1], { x: x + 0.95, y: 3.06, w: 4.9, h: 0.56, bold: true, color: p[2], fontSize: 17, fontFace: "Cambria", valign: "middle" });
  fit(`Panel ${i + 1} list`, need(p[4], 5.6 - 0.3, 13.5, 2), 1.38);
  txt(s, `Panel text ${i + 1}`, bullets(p[4], 13.5), { x: x + 0.25, y: 3.68, w: 5.6, h: 1.38, paraSpaceAfter: 2 });
});
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
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b14-compliance");
const ALT = {};
for (const f of fs.readdirSync(BOOK).filter((n) => /^\d\d-.*\.md$/.test(n))) {
  const t = fs.readFileSync(path.join(BOOK, f), "utf8");
  for (const m of t.matchAll(/svg\/([\w-]+)\.svg\)\{[^}]*?fig-alt="([^"]+)"/g)) ALT[m[1]] = m[2];
}
// A committed diagram placed inside a box, keeping the PNG's aspect ratio (read from its header), centered across maxW.
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b14-compliance", "png");
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

const S_WHY = "Why proof, not a promise", S_WHAT = "What a control needs", S_WHO = "Who owns compliance", S_HOW = "How to authorize and monitor";

// ------------------------------------------------------------------ Title
{
  const s = D.titleSlide(S_WHY, checkTitle("Federal Compliance & Authorization: executive briefing"), "Book 14  ·  Proof, not a promise");
  D.agenda(s, 0.8, 4.82, 6.6);
  txt(s, "Series line", [
    { text: "Federal Modernization Workbook", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "A 30-minute briefing for authorizing officials, the CISO and CIO, ISSOs, privacy and program managers", options: { color: HEX.slate } },
  ], { x: 0.8, y: 5.45, w: 9.5, h: 0.9, fontSize: 16 });
  narrate(s,
`This is the executive briefing for Book 14 of the Federal Modernization Workbook, Federal Compliance and Authorization. It runs about thirty minutes, for the people who sign for a system or answer for it: authorizing officials, the CISO and the CIO, ISSOs, the senior agency official for privacy, and the program managers who own systems.

The argument fits in three sentences. A control that is described in a plan but can't be shown working is a promise, and an authorization built on promises decays the day after the assessment. The cloud provider proves its service, the agency proves its own system, and the authorizing official alone decides whether the residual risk is acceptable. And a control closes only when the mechanism that closes it exists and its proof is recorded.

I'll take four questions: why every control needs proof and what the federal clock asks for; what the baseline, the closure rule and the agency-level control families require; who owns compliance; and how to build the package and keep it current. Every decision slide names the decision, its owner and when it's needed; where the owner or timing is the program's own recommendation, the notes say so. Every date was checked against its source on October 21, 2026.`,
  "Book 14, index; Chapter 01 — Proof, Not a Promise; Chapter 10 — Who Owns Compliance.");
}

// ------------------------------------------------------------------ Why 1
{
  const s = content(S_WHY, "A promise ages; proof can be checked again");
  tag(s, "Why");
  rows(s, "Proof", "WHO OWES WHICH PROOF", [
    ["Cloud provider", "Its service, under FedRAMP's 2026 rules"],
    ["Agency", "Its own system and its side of the boundary"],
    ["Assessor", "Tests either party's evidence"],
    ["Authorizing official", "Alone accepts the residual risk"],
  ], 1.88, 0.8, 0.68);
  img(s, "ch01-promise-and-proof", 7.0, 1.5, 5.75, 3.6);
  decision(s, "Reuse the provider's certification as evidence, and authorize the agency's own system that uses the service: never a standalone ATO for the service itself",
    "Authorizing official", "Before the system uses the service");
  sources(s, "Sources: FedRAMP Consolidated Rules for 2026 (Using a Certified Service; AGU-USE-ABU); OMB M-24-15; FISMA; NIST SP 800-37 Rev. 2. Book 14, Chapters 01 and 03.");
  narrate(s,
`What an authorizing official needs is narrow: not that a control is supposed to be in place, but that it is, today, and the ability to show anyone who asks how they know.

A promise is a statement in a system security plan, backed by evidence gathered by hand for the last assessment; it was true the day it was signed and has been aging since. Proof is a record the system produces: what the control covers, when it was last checked and what it found, in a form another reviewer can check again and get the same answer. The program's definition is design, not a federal rule: produced by the system, machine-readable, current on a schedule, and checkable again.

Three parties sit inside federal compliance, and most requirements bind one of them directly. FedRAMP's 2026 guidance says each agency still authorizes its own systems, reuses the provider's certification as reusable security evidence, and should never create a standalone authorization to operate for a cloud service offering. M-24-15 gives a FedRAMP authorization a presumption of adequacy, and the authorizing official must still issue an authorization. "FedRAMP authorized" covers the provider's side of a shared boundary, not the agency's configuration, identities, data and integrations.

The decision: reuse the certification as evidence, and authorize the agency's own system. FedRAMP's agency rule requires that authorization for any federal system using a certified service.`,
  "Book 14, Chapter 01 — Proof, Not a Promise (Who owes which proof; The provider's certification is evidence, not the agency's authorization; What the program counts as proof); Chapter 03 (The indicators bind providers: AGU-USE-ABU).");
}

// ------------------------------------------------------------------ Why 2
{
  const s = content(S_WHY, "“Moderate” is a commitment of a known size");
  tag(s, "Why");
  img(s, "ch01-what-moderate-means", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Facts", "FaScaleBalanced", HEX.navy, HEX.navyTint, "Two facts, cited separately", [
    "NIST Moderate: 287 controls and enhancements (release 5.2.0)",
    "Low holds 149, High 370; the privacy baseline applies at any level",
    "FedRAMP Class C lists 322; 36 sit outside NIST Moderate",
    "CM-5(1): NIST High only, yet listed for Class C",
  ], 13.5, 7.1, 5.65);
  decision(s, "Approve each system's categorization, with the privacy official for any system holding PII, before any control is selected",
    "AO or designated representative; SAOP for PII", "Before control selection");
  sources(s, "Sources: FIPS 199; FIPS 200; NIST SP 800-53B and release 5.2.0 baseline profiles; FedRAMP notice on class designations; FedRAMP 2026 Rev5 control reference. Book 14, Ch 01, 03 and 10.");
  narrate(s,
`Three documents use "Moderate" for three things. FIPS 199 rates each information type's confidentiality, integrity and availability impact; moderate means a loss could have a serious adverse effect. Circular A-130 makes categorization a requirement, and says systems with personal information should generally be moderate or high for confidentiality. FIPS 200 takes the high-water mark: one objective at moderate and none higher makes a moderate system, determined before any controls are selected.

SP 800-53B holds the baselines. In release 5.2.0 the moderate baseline lists 287 controls and enhancements, 177 base controls and 110 enhancements, against 149 at low and 370 at high, and a separate privacy baseline applies at any impact level. That is the size of the promise.

FedRAMP's Class C is a separate fact. It includes the current Moderate baseline, but the 2026 control reference lists 322 controls and enhancements for it, 36 outside NIST Moderate. Automated access enforcement for changes is NIST High only, yet listed for Class C. A Moderate system on a Class C service inherits the provider's evidence for the provider's side, and proves its own side against its own tailored baseline.

The decision follows the RMF: the authorizing official or designated representative approves the categorization, with the senior agency official for privacy for a system with personal information, before control selection. A categorization only the system owner signed is a draft.`,
  "Book 14, Chapter 01 (What \"Moderate\" means: FIPS 199, FIPS 200, SP 800-53B, FedRAMP Class C); Chapter 03 (Two facts, not one); Chapter 10 (The responsibility matrix: security categorization, C-2 and C-3; One owner for each step).");
}

// ------------------------------------------------------------------ Why 3
{
  const s = content(S_WHY, "Annual is the floor, and tools only confirm a design");
  tag(s, "Why");
  steps(s, "Phase", [["Understand", "Gaps and root causes"], ["Design", "A pattern per gap"], ["Implement", "Mechanisms that emit records"], ["Govern", "POA&M and decision rights"], ["Validate", "Tools, as confirmation"], ["Authorize", "On proof"]],
    [HEX.grey, HEX.grey, HEX.grey, HEX.grey, HEX.tealTint, HEX.navyTint]);
  panels(s, [
    ["FaLandmark", "What the law already sets", HEX.navy, HEX.navyTint, ["FISMA: test at least annually; no three-year rule", "A-130: move to ongoing authorization when eligible", "CA-5, CA-6 and CA-7 sit in every NIST baseline", "Risk acceptance can't be delegated (SP 800-37)"]],
    ["FaFilter", "Why the tools come last", HEX.teal, HEX.tealTint, ["A conformance tool measures drift from a design", "It can't author the design that closes a finding", "Run first: accurate findings, nothing to close them", "Sequence above: the program's design, not a rule"]],
  ]);
  decision(s, "Fund the mechanisms that produce records before the tools that measure them, and run the assessment tools as confirmation",
    "CIO, with the executive sponsor", "Before the next assessment cycle");
  sources(s, "Sources: FISMA, 44 U.S.C. § 3554; OMB Circular A-130; NIST SP 800-53 Rev. 5 (CA-5, CA-6, CA-7); SP 800-37 Rev. 2; CISA ScubaGear and BOD 25-01. Book 14, Chapters 01 and 10.");
  narrate(s,
`The law never set a three-year rule. FISMA requires testing of every system's management, operational and technical controls at a frequency depending on risk, but no less than annually. Circular A-130 requires continuous monitoring, an initial authorization based on an explicit acceptance of risk, and a transition to ongoing authorization when a system is eligible and its authorizing official approves. The plan of action, the authorization and continuous monitoring are in the Low baseline and every baseline above it, and SP 800-37 says the explicit acceptance of risk can't be delegated. Only proof can satisfy that on an ongoing basis.

That's why assessment tools aren't a roadmap. ScubaGear verifies that a Microsoft 365 tenant conforms to CISA's secure configuration baselines, and BOD 25-01 makes running it mandatory in scope. But a conformance tool measures drift from an intended state; it can't author one. Run first, it measures drift from nothing, and the next scan finds the findings reopened.

The program's sequence, which is design, puts assessment fifth of six: understand root causes, design the closing pattern, implement the mechanisms, govern the plan of action and decision rights, validate with the tools, then authorize on proof.

The decision sits with the CIO and the executive sponsor, who own scope and funding in the program's model: fund the mechanisms that produce records, chiefly authoritative asset identity, cryptographic identity and one evidence contract, before the tools that measure them.`,
  "Book 14, Chapter 01 (Why every control needs proof; Why assessment tools aren't a roadmap; What leadership should take from this); Chapter 10 (The CIO: scope and funding, the program's model).");
}

// ------------------------------------------------------------------ Why 4
{
  const s = content(S_WHY, "The federal clock: the dates ahead, and whom they bind");
  tag(s, "Why");
  const dates = [
    ["Oct 22, 2026*", "Post-quantum migration plan (M-26-15)", "Agency"],
    ["Nov 18, 2026*", "Agency Logging Plan (M-26-14)", "Agency"],
    ["Dec 7, 2026", "BOD 26-04 Phase III*; FedRAMP VDR and VER", "Both"],
    ["Jan 1, 2027", "FedRAMP 2026 rules mandatory", "Providers"],
    ["Feb 5, 2027*", "Listed edge devices out (BOD 26-02)", "Agency"],
    ["Mar 7, 2027", "VDR and VER corrective window ends", "Providers"],
    ["Jun 11, 2027", "Last new Rev5 applications", "Providers"],
    ["Jan 2, 2030", "TLS 1.3 supported (M-26-15)", "Agency"],
    ["Dec 31, 2030", "Quantum risk mitigated where feasible", "Agency"],
  ];
  leftTable(s, ["Date", "What is due", "Binds"],
    dates.map((r, i) => [bold(r[0], i === 0 ? HEX.red : HEX.navy), { text: r[1] }, { text: r[2], options: { color: r[2] === "Agency" ? HEX.teal : HEX.ink, bold: r[2] === "Agency" } }]),
    [1.5, 4.25, 1.15], [0.34, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36], 12);
  sideBox(s, "Moved", "FaArrowsRotate", HEX.red, HEX.redTint, "What moved this year", [
    "BOD 26-04 revoked BOD 19-02 and BOD 22-01",
    "M-26-05: attestations and SBOMs became contract choices",
    "M-26-15 put a firm 2030 date in front of 2035",
    "* Counted from a stated period; all checked Oct 21, 2026",
  ]);
  decision(s, "Keep one dated register of federal dates: the source, its exact wording, whom it binds and the day it was last checked",
    "Program office (the program's model)", "Now; re-verified at every gate");
  sources(s, "Sources: OMB M-26-15, M-26-14, M-26-05; CISA BOD 26-04, BOD 26-02; FedRAMP 2026 timeline and Notice NTC-0014. All checked October 21, 2026. Book 14, Chapter 02.");
  narrate(s,
`The instrument decides whom a date binds. FedRAMP rules bind cloud providers. CISA's binding operational and emergency directives bind federal civilian agencies, and their required actions become controls to evidence. OMB memoranda bind agencies, and NIST binds them through the standards they must follow.

Every date was checked against its issuing document on October 21, 2026; an asterisk marks the program's own count from a stated period. M-26-15 set the post-quantum migration plan at 120 days, October 22, 2026, with TLS 1.3 by January 2, 2030, as much quantum risk mitigated as feasible by December 31, 2030, and full migration by 2035. M-26-14 rescinded M-21-31 and counts from CISA's Logging Reference Architecture of August 20: the Agency Logging Plan on November 18. On December 7, BOD 26-04's Phase III binds agencies and FedRAMP's VDR and VER rules bind providers, with a corrective-action window to March 7, 2027. The Consolidated Rules are mandatory on January 1, 2027, and new Rev5 applications close on June 11, 2027, not January 1. None of FedRAMP's dates is an agency submission window.

Some things moved: BOD 26-04 revoked BOD 19-02 and 22-01, M-26-05 made attestations and SBOMs contract choices, and M-26-15 put 2030 in front of 2035.

The program's answer is design: one dated register in the authoritative record, naming the document, the exact wording, whether the date was published or counted, whom it binds and the day last checked, re-verified at every gate and whenever a source changes.`,
  "Book 14, Chapter 02 — The Federal Clock (Who each clock binds; FedRAMP's 2026 rules; M-26-14; M-26-05; M-26-15; The dates still ahead; How the program keeps the clock); Chapter 10 (The roles that keep the record).");
}

// ------------------------------------------------------------------ Why 5
{
  const s = content(S_WHY, "Directives leave standing work; support dates bind too");
  tag(s, "Why");
  cards(s, "Clock", [
    ["FaTriangleExclamation", "BOD 26-04, by risk", HEX.red, HEX.redTint, ["Revoked BOD 19-02 and BOD 22-01", "Phase III, Dec 7, 2026*: Table 1 remediation timelines", "Every externally reachable asset tagged", "No SBOM or VEX requirement in it"]],
    ["FaListCheck", "Standing directives", HEX.navy, HEX.navyTint, ["BOD 25-01: yearly tenant inventory; new tenants baselined before their ATO", "BOD 23-01: asset discovery every 7 days", "ED 25-03: Cisco updates within 48 hours"]],
    ["FaServer", "Support dates", HEX.amber, HEX.amberTint, ["SA-22, in the Moderate baseline: replace unsupported parts", "BOD 26-02: listed edge devices out by Feb 5, 2027*", "FIPS 140-2: existing systems only after Sep 21, 2026"]],
  ], 13);
  decision(s, "Retire each unsupported component by its date, or accept the risk of keeping it explicitly, as an open POA&M item",
    "Authorizing official", "Each end-of-support date");
  sources(s, "Sources: CISA BOD 26-04, BOD 25-01, BOD 26-02, BOD 23-01; ED 25-03; NIST SP 800-53 Rev. 5 (SA-22, SI-2); NIST CMVP. Book 14, Chapter 02. * Counted dates.");
  narrate(s,
`Directive deadlines pass; their requirements don't.

BOD 26-04, issued June 10, 2026, revokes BOD 19-02 and BOD 22-01. Phase I took effect on issuance, Phase II fell on August 9, and Phase III falls on December 7: remediate within the directive's Table 1 timelines, tag every asset reachable from outside, and record private as well as public addresses in CDM. It sets no SBOM or vendor-disclosure requirement.

BOD 25-01's dated actions have passed; its standing ones remain: a tenant inventory every first quarter, continuous or quarterly reporting, new mandatory policies on CISA's timelines, every new tenant baselined before its authorization to operate, and deviations explained. BOD 23-01 still requires asset discovery every seven days. ED 25-03 requires each Cisco update within 48 hours, and ED 26-01 each F5 update within a week. A recurring requirement needs recurring evidence.

Vendor support dates become compliance dates three ways. Through the baseline: unsupported components are to be replaced, and flaw remediation needs updates an unsupported product can't get. Through directives: BOD 26-02 decommissions listed edge devices by February 5, 2027 and all identified ones by August 5, 2027. And through the authorization. FIPS 140-2 modules have been for existing systems only since September 21, 2026.

So the decision for the authorizing official: a component kept past its end-of-support date carries an open finding, a plan-of-action item, and a risk the official accepts explicitly, or it's retired.`,
  "Book 14, Chapter 02 — The Federal Clock (BOD 26-04; BOD 25-01; BOD 26-02; Standing directives that are easy to forget; Emergency directives; FIPS 140-2; Vendor end of support).");
}

// ------------------------------------------------------------------ What 1
{
  const s = content(S_WHAT, "Two facts and one index: the baseline and the crosswalk");
  tag(s, "What");
  img(s, "ch03-two-facts-one-index", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Index", "FaTableList", HEX.navy, HEX.navyTint, "An index, not a decision", [
    "149 controls; it indexes 121 of the 287 in NIST Moderate",
    "A pointer to where a control is treated, never an inheritance claim",
    "The security plan still covers every control the baseline selects",
    "FedRAMP's 46 indicators bind providers, not agencies",
  ], 13.5, 7.1, 5.65);
  decision(s, "Fill the product inventory questionnaire against the estate as it is, verify each FedRAMP status that day, and decide every flag",
    "Boundary owner; the AO for uncertified services", "Before the security plan is written");
  sources(s, "Sources: NIST SP 800-53B and OSCAL baseline profiles; FedRAMP 2026 Rev5 control reference, Key Security Indicators and Marketplace data (Oct 21, 2026). Book 14, Ch 03; Apps A, B.");
  narrate(s,
`"Is this control required at Moderate?" is two questions. NIST's baseline says what an agency system implements: 287 at Moderate. FedRAMP's 2026 control reference says how a provider's service was certified: 322 for Class C. The program management and PII processing families sit outside both. Cite them separately.

The series crosswalk is a reverse index of 149 controls in 18 families: for each, where in the series it is treated. A row is a coverage pointer, not an inheritance claim; inheritance depends on the boundary and the assessor. It indexes 121 of the 287 Moderate controls and 122 of the 322 for Class C. Policy controls, the physical and maintenance families and 75 uncited enhancements have no row, so it can't stand in for the security plan.

FedRAMP's 46 Key Security Indicators, in ten themes, cite 118 of the 149, but they bind providers. Agencies complete their own authorization, keep tools that produce and ingest OSCAL JSON, and review each provider's quarterly report.

The questionnaire starts from the estate: whether each product is in use, the specific offering, its Marketplace status and class read that day, and where it runs. Certified only at a higher class is usable; not certified is a flag, and the program sends an uncertified in-boundary dependency to the authorizing official. The order is design: inventory, decide the flags, look up the controls, write what the index can't.`,
  "Book 14, Chapter 03 — The Control Baseline and the Crosswalk (Two facts, not one; A pointer, not an inheritance claim; What the index doesn't cover; The indicators bind providers; The product inventory questionnaire; How an agency uses the two together); Appendices A and B.");
}

// ------------------------------------------------------------------ What 2
{
  const s = content(S_WHAT, "A control closes only with its proof");
  tag(s, "What");
  img(s, "ch04-when-a-control-closes", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Roadmap", "FaUserClock", HEX.amber, HEX.amberTint, "A vendor roadmap is not a commitment", [
    "Every vendor claim carries the date it was verified",
    "Confirm with the vendor and the Marketplace before a plan rests on it",
    "53 offerings were Legacy FedRAMP Ready on Oct 21, 2026",
    "Write the capability into the contract (SA-4)",
  ], 13.5, 7.1, 5.65);
  decision(s, "Count a control closed only when its mechanism runs and its proof is recorded; keep each roadmap item in the POA&M",
    "System owner; the AO approves the POA&M", "At every closure");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CA-2, CA-5, SA-4); FedRAMP Marketplace data, October 21, 2026; FedRAMP 2026 rules. Book 14, Chapters 04 and 10. The two tests are program design.");
  narrate(s,
`Federal assessment asks whether controls are implemented correctly, operating as intended and producing the desired outcome, with weaknesses in a plan of action updated from assessments, audits and monitoring. A product bought, a feature announced or a ticket marked complete isn't the control operating.

The program's two tests are design. First, the mechanism exists: deployed, operating and reaching the part of the estate the control covers; a purchase order, an ended pilot or a roadmap fails. Second, its proof is recorded: a machine-readable verification, a time and the identity of what checked it. Fail the first and the control is open, a plan-of-action item with a milestone. Fail only the second and it looks closed and can't be shown to be.

Three rules keep the second test honest. Every closure carries its provenance. Human-only closure is an exception, flagged and counted separately, never folded into control tests or monitoring. And reports are derived from closure records, never compiled.

A vendor roadmap is not a commitment. FedRAMP stopped accepting Ready submissions after July 28, 2026, and on October 21 the Marketplace listed 53 offerings as Legacy FedRAMP Ready. Date every claim, confirm it with the vendor and the Marketplace before a plan or contract rests on it, and put the capability into the contract. Until it ships, it's an open item that the system owner keeps and the authorizing official approves.`,
  "Book 14, Chapter 04 — Closure: A Control Closes Only With Its Proof (What \"closed\" has to mean; Mechanism, not product; No closure counts without its proof; A vendor roadmap is not a commitment; How the rules line up with the controls); Chapter 10 (responsibility matrix: the POA&M rows).");
}

// ------------------------------------------------------------------ What 3
{
  const s = content(S_WHAT, "Program management: the agency's, never the provider's");
  tag(s, "What");
  img(s, "ch05-pm-layer", 0.6, 1.5, 5.6, 3.6);
  sideBox(s, "PM", "FaBuildingColumns", HEX.navy, HEX.navyTint, "No certification supplies it", [
    "37 PM controls and enhancements; FedRAMP lists a class for none",
    "FISMA and Circular A-130 bind the agency directly",
    "Closes when the artifact exists, a named official approved it, and it is still followed",
    "The program inventory lists systems; CM-8 lists components",
  ], 13.5, 6.45, 6.3);
  decision(s, "Approve the risk management strategy and its risk tolerance, which every POA&M date and risk acceptance will cite",
    "Head of agency (risk executive function)", "Before the next risk acceptance");
  sources(s, "Sources: NIST SP 800-53B (Table 3-13); SP 800-53 Rev. 5, PM family; FedRAMP 2026 Rev5 control reference; FISMA; OMB Circular A-130; SP 800-37 Rev. 2. Book 14, Chapters 05 and 10.");
  narrate(s,
`SP 800-53B marks the whole Program Management family deployed organization-wide, not associated with the security control baselines and independent of impact level. FedRAMP's 2026 control reference lists no class for any of its 37 controls and enhancements. So a provider's certification never satisfies one, and no single system's package closes the family. Circular A-130 puts it on the agency: develop and maintain an information security program plan documenting the program management and common controls.

Each control closes on an artifact a named official approved and the agency still follows: one program plan approved by a senior official; a signed appointment of the senior agency information security officer, whom FISMA has the CIO designate; a risk strategy that includes a determination of risk tolerance, the RMF's task P-2, with the head of agency primarily responsible; a process that keeps every system's plan of action comparable; a system inventory that agrees with each system's component inventory; and one organization-wide monitoring strategy.

Every later risk decision cites the strategy: an accepted residual risk, a plan-of-action due date, a supply chain finding carried rather than fixed. The program's template centers on a signed risk tolerance statement per category, with example values each agency sets; its scoring matrix and 90, 30 and 15 day windows are design. Where a federal timeline applies, such as KEV remediation under BOD 26-04, it governs.

The decision: the head of agency, or the senior accountable official for risk, approves the strategy and tolerance before the next acceptance cites it.`,
  "Book 14, Chapter 05 — Program Management Controls (The controls at a glance; PM-1; PM-2 and PM-10; PM-9; PM-4; PM-5; What is requirement and what is design); Chapter 10 (The head of agency and the risk executive; responsibility matrix: P-2).");
}

// ------------------------------------------------------------------ What 4
{
  const s = content(S_WHAT, "Contingency: a plan, not a capability");
  tag(s, "What");
  rows(s, "CP", "WHAT CONTINGENCY PLANNING ASKS OF A MODERATE SYSTEM", [
    ["The plan", "Who declares, who is told, what comes back first; runbooks are its appendices"],
    ["The numbers", "The business impact analysis sets MTD, RTO and RPO"],
    ["The test", "A functional exercise with a restore from backup (SP 800-34)"],
    ["Alternates", "Storage, processing and telecom begin at Moderate"],
    ["Backups", "A replica copies ransomware too; keep point-in-time copies"],
  ], 1.88, 0.66, 0.58, 8.1);
  img(s, "ch06-planning-process", 8.95, 1.5, 3.8, 3.6);
  decision(s, "Each mission owner signs the maximum tolerable downtime; it is never lowered to fit a convenient technical answer",
    "Mission owner; the system owner approves the plan", "Before the plan is approved; then yearly");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CP family) and SP 800-53B; NIST SP 800-34 Rev. 1; FISMA; OMB Circular A-130; FedRAMP 2026 Rev5 control reference. Book 14, Chapter 06.");
  narrate(s,
`The other books build infrastructure meant to survive failure: tested failover, two circuits, good backups. An assessor would find a resilient estate and an open contingency plan finding, because the control asks for a plan: essential functions, recovery objectives and priorities, named roles, approval, distribution, coordination with incident handling, and review after changes and tests. The runbooks are its appendices.

The business impact analysis comes first. Under SP 800-34, the maximum tolerable downtime is what the system owner or authorizing official will accept for a mission outage; the recovery time objective must normally be shorter; the recovery point objective is tolerable data loss. Continuity-of-operations essential functions must meet a downtime limit of 12 hours or less. Where the recovery time can't be met and the limit can't move, the gap becomes a plan-of-action item.

At Moderate, alternate storage, processing and telecommunications are required. FedRAMP sets no test type and no backup frequency; those are the agency's to set. And SP 800-34 recommends a functional exercise with a restore from backup for a Moderate system, not just a tabletop.

A replica isn't a backup: it copies a deletion or a ransomware encryption faithfully. Microsoft 365's own replication is inherited; the agency still needs point-in-time backups and a tested restore each year.

The decision, from the chapter: each mission owner signs the downtime row for their system, and it isn't lowered to fit a convenient technical answer. The system owner approves the plan.`,
  "Book 14, Chapter 06 — Contingency Planning and Business Continuity (What the family asks, and at which baseline; The business impact analysis; The MTD is the mission owner's decision; Alternate storage and backups; Testing and training; What is requirement and what is design).");
}

// ------------------------------------------------------------------ What 5
{
  const s = content(S_WHAT, "Supply chain: know what you run; contract for the rest");
  tag(s, "What");
  img(s, "ch07-federal-position", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "SR", "FaCubes", HEX.teal, HEX.tealTint, "It closes on governance", [
    "SR-1, -2, -3, -5 and -8 sit in every NIST baseline",
    "Closing artifacts: plans, contracts, supplier records, SBOMs",
    "CISA's 2026 SBOM minimum elements: July 29, 2026",
    "Residual supply chain risk: the AO, and no one else",
  ], 13.5, 7.1, 5.65);
  decision(s, "Decide, acquisition by acquisition, whether to require an SBOM on request; for a cloud service, ask for the runtime environment",
    "Contracting officer; the CISO's team advises", "In each new acquisition");
  sources(s, "Sources: OMB M-26-05; NIST SP 800-53 Rev. 5 (SR, PM-30) and SP 800-53B; SP 800-161 Rev. 1; CISA 2026 SBOM minimum elements; FedRAMP NTC-0014. Book 14, Chapter 07.");
  narrate(s,
`A federal system is mostly other people's software, and the agency inherits each component's flaws the day it installs it. The program treats supply chain as an evidence problem.

The federal position moved on January 23, 2026, when OMB's M-26-05 rescinded M-22-18 and M-23-16. Agencies shall continue to maintain a complete inventory of software and hardware, and set assurance policies matched to their own risk. The secure development attestation form is optional. A contract term requiring a current SBOM on request is an agency choice; for a cloud platform it should cover the runtime production environment.

The controls are mostly governance. The policy, plan, controls, acquisition strategies and notification agreements are in every NIST baseline, and supplier assessments begin at Moderate.

The pipeline the program designs produces, per release, an SBOM in SPDX or CycloneDX, a vulnerability report joined to the KEV catalog, and exploitability statements people decide. CISA's 2026 minimum elements of July 29, 2026 replaced the 2021 NTIA list with seventeen fields.

FedRAMP's VDR and VER rules bind providers from December 7, 2026; agencies should review the reports with automation and fold them into their own plans of action.

Ownership, in the program's model: the CISO owns the strategy, the CIO approves the charter, the contracting officer owns contract terms, and residual supply chain risk sits with the authorizing official alone. The SBOM decision is made acquisition by acquisition.`,
  "Book 14, Chapter 07 — Supply Chain Risk Management (What the controls ask for; The federal position in October 2026; The evidence pipeline; FedRAMP: what binds cloud providers; Who owns what).");
}

// ------------------------------------------------------------------ What 6
{
  const s = content(S_WHAT, "Privacy: a public promise the agency keeps true");
  tag(s, "What");
  img(s, "ch08-privacy-artifacts", 0.6, 1.5, 5.0, 3.6);
  sideBox(s, "PT", "FaUserShield", HEX.navy, HEX.navyTint, "The agency's, end to end", [
    "The privacy baseline applies at any impact level; no PT control has a FedRAMP class",
    "New system of records: report to OMB and Congress 30 days before the Federal Register",
    "The privacy official approves the privacy plan before authorization",
    "Privacy Act statements at every collection, the telephone included",
  ], 13.5, 5.85, 6.9);
  decision(s, "Start each new or significantly changed system of records notice at least 60 days before the first collection under a new routine use",
    "Agency counsel and the SAOP", "60 days or more before first collection");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (PT) and the privacy baseline; Privacy Act of 1974; OMB Circulars A-130 and A-108; E-Government Act § 208; OMB M-17-12. Book 14, Chapter 08.");
  narrate(s,
`A system that processes personal information answers questions the security baseline doesn't: by what authority, for what purpose, did the agency tell the person, did it publish the system, does it hold more than it needs? The answers are documents the public can read, and records showing they match the system.

NIST's privacy baseline applies irrespective of impact level, and no privacy control carries a FedRAMP class; no 2026 indicator theme is about privacy. The privacy office and the system owner close these controls together.

The legal frame: the Privacy Act's systems of records, notices and Privacy Act statements; section 208 of the E-Government Act, a privacy impact assessment before developing or procuring IT that collects identifiable information about the public; Circular A-130, under which the senior agency official for privacy approves privacy plans before authorization and reviews the package for any system with personal information; Circular A-108 on notices; and M-17-12 on breaches, with a tabletop at least annually.

The notice timeline is commonly wrong. A-108 requires reporting a new or significantly modified system of records to OMB and Congress at least 30 days before the notice goes to the Federal Register, and OMB's review can't overlap publication. New routine uses then wait out a 30-day comment period. Plan on at least 60 days.

The decision: counsel and the privacy official start each notice at least 60 days before its first collection under a new routine use.`,
  "Book 14, Chapter 08 — Privacy: PII Processing and Transparency (The PT family; The legal frame; System of records notices (PT-6); Privacy Act statements; Before a system that processes PII goes live; Who owns what).");
}

// ------------------------------------------------------------------ What 7
{
  const s = content(S_WHAT, "Training: a record with a denominator");
  tag(s, "What");
  img(s, "ch09-training-evidence-chain", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "AT", "FaUserCheck", HEX.teal, HEX.tealTint, "What the rules actually set", [
    "Before access (A-130); awareness at least yearly (OPM)",
    "AT-2(3), social engineering, is required at Moderate",
    "Phishing exercises, AT-2(1), are optional",
    "Rosters from the identity platform, not a spreadsheet",
  ], 13.5, 7.1, 5.65);
  decision(s, "Set the completion threshold, and treat every overdue person in a privileged role as a finding, whatever the percentage",
    "CISO", "Before the next quarterly training review");
  sources(s, "Sources: FISMA; OMB Circular A-130; 5 CFR 930.301; NIST SP 800-50 Rev. 1; SP 800-53 Rev. 5 (AT, IR-2, CP-3) and SP 800-53B; OMB M-17-12. Book 14, Chapters 09 and 11.");
  narrate(s,
`Training asks whether people know what to do, and the only proof is a record of who was trained, on what and when, against a list of who should have been. A 98 percent dashboard has no denominator unless someone can say which roster, where the completions came from, and whether the high-risk roles are in the two percent.

The requirements: FISMA puts awareness training in every program, contractors included. Circular A-130 requires awareness and training, role-based training before access, knowledge testing and rules of behavior. OPM's rule at 5 CFR 930.301 requires awareness for all users at least annually. M-17-12 adds breach training before access.

Social engineering awareness is required at Moderate and in Class C; insider threat awareness at every level. Phishing exercises are optional, tailored in by choice, and NIST's guide says not to use legitimate brands or name federal organizations in the bait.

The evidence is the program's design: the learning management system as system of record, rosters derived from the identity platform, the system inventory and the plans, and a derived record of counts per population against a stated roster and window, with hashed sources and no names. It has no pass or fail field; the ISSO's review decides. The suggested threshold is 95 percent per population, with every overdue person in a privileged tier a finding.

The CISO owns the training policy, defines significant roles and sets the threshold, ahead of the quarterly training review.`,
  "Book 14, Chapter 09 — Training and Awareness Controls (What federal law and policy require; The controls, one by one; Phishing exercises; Training records as evidence; Who owns the training evidence); Chapter 11 (The cadence: quarterly training review).");
}

// ------------------------------------------------------------------ Who 1
{
  const s = content(S_WHO, "Who owns compliance: one decider per row");
  tag(s, "Who");
  img(s, "ch10-who-owns-compliance", 0.6, 1.5, 5.0, 3.6);
  sideBox(s, "Roles", "FaUsersGear", HEX.teal, HEX.tealTint, "Decide, own and check", [
    "System owner: more RMF tasks than any role; keeps the POA&M",
    "Authorizing official: the only one who can accept risk; never delegated",
    "Six government-only roles, among them the AO, CIO and CISO",
    "Contractors prepare every package; they sign none of those decisions",
  ], 13.5, 5.85, 6.9);
  decision(s, "Make every role a signed appointment with a name: the CISO, the privacy official and each authorizing official",
    "Head of agency and CIO", "Before the next package reaches an AO");
  sources(s, "Sources: FISMA; OMB Circular A-130; NIST SP 800-37 Rev. 2 (Appendix D; Task P-1); SP 800-53 Rev. 5 (PM-2, PM-10, PM-19, PM-29, CA-6). Book 14, Chapter 10.");
  narrate(s,
`Ask who owns compliance and the answer is often the security office, which means nobody in particular. The failures happen between the jobs: a plan of action nobody updates, a privacy plan nobody approved, a risk acceptance signed by someone who couldn't sign it.

The roles come from four layers. FISMA makes the head of agency accountable and has the CIO designate the senior agency information security officer. Circular A-130 adds the senior agency official for privacy and requires senior federal officials as authorizing officials. SP 800-37 defines each role and gives every RMF task a primary owner. And SP 800-53 makes the appointments controls. The evidence is a signed appointment with a name, not an organization chart.

The head of agency sets the risk strategy and names each authorizing official. The CIO designates the CISO and, in the program's model, owns scope and funding with the sponsor. The CISO sets control requirements and common controls, owns training and supply chain policy, and reviews provider reports or names a delegate. The privacy official approves categorization and privacy plans for systems with personal information. The authorizing official alone can accept risk; the designated representative prepares acceptances but signs none. The system owner owns more RMF tasks than any role.

SP 800-37 marks six roles inherently governmental, among them the authorizing official, the CIO, the CISO and the privacy official. Contractors can prepare every package and sign none of those decisions.

The decision: signed, named appointments for the CISO, the privacy official and each authorizing official, before the next package reaches one.`,
  "Book 14, Chapter 10 — Who Owns Compliance (Where the roles come from; The roles; Who must be a government official; The responsibility matrix: designation rows; What changes, in one table).");
}

// ------------------------------------------------------------------ Who 2
{
  const s = content(S_WHO, "The authorization path, and what keeps it honest");
  tag(s, "Who");
  img(s, "ch10-authorization-path", 0.6, 1.5, 3.2, 3.6);
  sideBox(s, "Handoffs", "FaRoute", HEX.amber, HEX.amberTint, "Where handoffs fail", [
    "The categorization is approved by nobody",
    "The system owner picks and pays the assessor",
    "The privacy plan goes unapproved",
    "The POA&M belongs to the ISSO alone",
  ], 13.5, 4.05, 4.25);
  sideBox(s, "Apart", "FaPeopleArrows", HEX.red, HEX.redTint, "Keep the roles apart", [
    "Nobody assesses their own work",
    "The AO isn't the system owner",
    "The CISO doesn't assess the CISO's controls",
    "No one approves their own acceptance",
  ], 13.5, 8.5, 4.25);
  decision(s, "Select the assessor and set the independence it needs before the assessment plan is approved",
    "AO or designated representative", "Before the assessment starts");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Tasks C-3, S-6, A-1, A-2, A-6, R-1, R-4, M-6); SP 800-53 Rev. 5 (CA-2(1), CA-7(1)); OMB Circular A-130. Book 14, Chapters 10 and 11.");
  narrate(s,
`One owner per step, from the RMF. The system owner and ISSO categorize and plan; the authorizing official approves the categorization and the plans, with the privacy official for systems with personal information. The authorizing official or representative selects the assessor, approves the assessment plan and sets independence. The assessor assesses and reports. The system owner remediates, keeps the plan of action and assembles the package. The authorizing official alone makes the authorization decision, and later the ongoing decision.

The handoffs fail four ways. The categorization is approved by nobody; one only the system owner signed is a draft. The system owner picks and pays the assessor, and the authorizing official must then decide whether the assessment is independent enough. The privacy plan goes unapproved, leaving the package incomplete. And the plan of action belongs to the ISSO alone, without the system owner's commitment, which makes it a wish list.

Five separations keep the roles honest. Nobody assesses their own work. The authorizing official isn't the system owner for the same system; where an agency can't separate them, the risk executive function reviews that system's acceptances. The CISO doesn't assess the CISO's own common controls. Requesters don't approve their own risk acceptances. And the privacy official's review isn't optional for systems with personal information.

The decision, from the RMF: the authorizing official or representative selects the assessor and sets its independence before the assessment starts. The assessor decides the findings; nobody else edits an assessment report.`,
  "Book 14, Chapter 10 — Who Owns Compliance (One owner for each step of the authorization path; The responsibility matrix; Keeping the roles apart); Chapter 11 (The assessment plan and the test plans: independence).");
}

// ------------------------------------------------------------------ How 1
{
  const s = content(S_HOW, "The package: four linked, machine-readable records");
  tag(s, "How");
  img(s, "ch11-package-and-models", 0.6, 1.5, 6.3, 3.6);
  sideBox(s, "Disp", "FaListCheck", HEX.amber, HEX.amberTint, "A disposition for every failure", [
    "Actionable drift: open, with an owner and a deadline",
    "Governed exception: an in-date acceptance, with an expiry",
    "Lapsed acceptance: reverts to open; nothing is always satisfied",
    "NIST lets a tool generate the package; FedRAMP wants OSCAL",
  ], 13.5, 7.1, 5.65);
  decision(s, "Before accepting a clean result or an empty POA&M, ask what the assessment didn't look at",
    "Authorizing official", "At every authorization decision");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Tasks S-6, A-2, A-4, A-6, R-1, R-4); SP 800-53 Rev. 5 (CA-5); NIST OSCAL 1.2.3; FedRAMP 2026 agency rules (AGU). Book 14, Chapter 11.");
  narrate(s,
`SP 800-37 defines the package by its contents: the security and privacy plans, the assessment reports, the plans of action and milestones, and an executive summary, under version and change control. Each comes from a task with an owner, and the system owner assembles them.

Four details shape it. The package is meant to be generated: NIST says it may come from a security or privacy management tool. Risk acceptance stays with one person. And the decision carries a termination date or, under ongoing authorization, a review frequency.

OSCAL gives each artifact a machine-readable model; release 1.2.3 came out on August 7, 2026. The assessment plan imports the security plan, the results import the assessment plan, and the plan of action hangs from the security plan, so it carries items from audits and monitoring, not one run. FedRAMP's 2026 agency rules require governance, risk, compliance and inventory tools that produce and ingest at least OSCAL and JSON.

Every failing item gets one of three dispositions, the program's design: actionable drift, open with an owner and deadline; a governed exception, with an in-date acceptance and its expiry; or a lapsed acceptance, which reverts to open. Nothing is always satisfied, and an item closes only on re-test evidence.

An empty plan of action on a Moderate system means every control is effective, which is unusual, or that the assessment didn't look where the findings are. A clean result against a partial yardstick says the yardstick is partial. The authorizing official asks which, at every decision.`,
  "Book 14, Chapter 11 — The Authorization Package and Continuous Monitoring (What the package contains; One OSCAL model per artifact; Assessment results; The plan of action and milestones; What the authorizing official should find).");
}

// ------------------------------------------------------------------ How 2
{
  const s = content(S_HOW, "Continuous monitoring keeps the package current");
  tag(s, "How");
  steps(s, "Cadence", [["Regenerate", "Results, POA&M; posture to the AO"], ["Review", "Provider reports; evidence quality"], ["Exercise", "Incident response"], ["Re-assess", "Every control, independently"]],
    [HEX.amberTint, HEX.amberTint, HEX.grey, HEX.navyTint], ["Monthly", "Quarterly", "Semi-annual", "Annual"]);
  panels(s, [
    ["FaCloudArrowUp", "Provider reports, reviewed", HEX.teal, HEX.tealTint, ["An Ongoing Certification Report every three months", "Agencies MUST review each one (CCM-AGM-ROR)", "Notify FedRAMP of rescission-level concerns", "Classes C and D host a Quarterly Review"]],
    ["FaChartLine", "Toward ongoing authorization", HEX.navy, HEX.navyTint, ["A-130: transition when eligible, with AO approval", "A review frequency replaces the end date", "Manual controls are still assessed (SP 800-137)", "Vendor posture scores are signals, not evidence"]],
  ]);
  decision(s, "Designate the federal senior official who reviews each provider's quarterly report, and keep a record of every review",
    "CISO, or a named delegate", "Before January 1, 2027");
  sources(s, "Sources: FISMA; OMB Circular A-130; NIST SP 800-37 Rev. 2; SP 800-137; SP 800-53 Rev. 5 (CA-7); FedRAMP 2026 rules (CCM-AGM-ROR, AGU). Book 14, Ch 10, 11. Cadence is program design.");
  narrate(s,
`Continuous monitoring keeps the package's day recent. The control asks for a system-level strategy: metrics, frequencies, ongoing assessment, correlation, response and status reporting. SP 800-137 adds that monitoring can't be done through manual or automated processes alone, and every control, including management and operational ones, must still be assessed.

The program's cadence is design. Monthly: regenerate assessment results and the plan of action, run the secure configuration baseline, review aging items and expiring acceptances, and report posture to the authorizing official. Quarterly: evidence quality, each provider's Ongoing Certification Report and its Quarterly Review, and the training review. Semi-annually, an incident response exercise. Annually: the contingency test, a full independent re-assessment, and updated plans. The annual floor is FISMA's.

FedRAMP's rules are mostly for providers. Providers supply an Ongoing Certification Report every three months, and Classes C and D host a Quarterly Review. Agencies must review each report under rule CCM-AGM-ROR, should designate a federal senior information security official to do it, and must notify FedRAMP when a report raises a concern likely to lead to rescission.

Ongoing authorization: A-130 directs the transition when a system is eligible and its authorizing official approves; once monitoring is robust and mature, a review frequency replaces the end date. Vendor posture scores measure recommended actions taken, not whether an objective is satisfied.

The decision, from the book's matrix: the CISO decides who reviews each provider's report, or names a delegate, before the rules become mandatory on January 1, 2027.`,
  "Book 14, Chapter 11 (Continuous monitoring; The cadence; Ongoing authorization; What FedRAMP's 2026 rules expect; Vendor scores are not assessment evidence); Chapter 10 (responsibility matrix: review of cloud providers' Ongoing Certification Reports).");
}

// ------------------------------------------------------------------ How 3
{
  const s = content(S_HOW, "What remains: the residual risk the AO must see");
  tag(s, "How");
  img(s, "ch12-residual-risk", 0.6, 1.5, 6.55, 3.6);
  sideBox(s, "Residual", "FaTriangleExclamation", HEX.red, HEX.redTint, "Write the remainder down", [
    "Self-assessment is advisory until it is independently assessed",
    "A silent evidence source is a monitoring failure, not a pass",
    "A clean run against a partial rule set measures the rule set",
    "Only the AO accepts the remainder; it can't be delegated",
  ], 13.5, 7.35, 5.4);
  decision(s, "In every package, list what is proven, asserted, inherited and accepted, instead of one green score",
    "System owner; the AO accepts it, or doesn't", "From the next package update");
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (Task R-4); SP 800-53 Rev. 5 (CA-2(1), CA-7(1)); FedRAMP 2026 rules (CCM, AGU). Book 14, Chapters 11 and 12.");
  narrate(s,
`Build everything and risk still remains, and the authorizing official needs to see it, because only they can accept it.

Six kinds. Self-assessment until independently assessed: automated verdicts are the system's own team grading its own work, and the Moderate baseline asks for independent assessors. What automation can't see: SP 800-37 notes tools may not cover every control, so policies, plans, training effectiveness and physical protections are assessed manually at a set frequency. Risk inherited from providers: the assurance is the certification plus the agency's review of each quarterly report, and a capability the design assumed but the boundary lacks is the agency's gap. Evidence that stops arriving: the program treats a silent required source as a monitoring failure, not a pass. Risks outside control evaluation: mission risk, insider threat, physical security, and supply chain risk an inventory can't show, such as a supplier's ownership. And design not yet built, or vendor features not yet delivered.

None of this argues against the program. A package that lists what's proven, asserted, inherited and accepted gives the official a risk they can see; one green score hides the same risk and makes it theirs anyway.

The decision, in the program's design: from its next update, the system owner's package states the remainder, and the authorizing official accepts it, or doesn't.`,
  "Book 14, Chapter 12 — The Series as a Map (The residual risk after the whole program); Chapter 11 (Assessment results: what the report measured against and what it didn't).");
}

// ------------------------------------------------------------------ Close
{
  const s = content(S_HOW, "Decisions to make, owners and timing");
  tag(s, "How");
  const asks = [
    ["Authorize the agency's own system that uses each certified service", "AO", "Before the system uses it"],
    ["Approve each categorization before any control is selected", "AO; SAOP for PII", "Before control selection"],
    ["Fund record-producing mechanisms before the tools that measure them", "CIO and sponsor", "Before the next assessment"],
    ["Keep one dated register; retire or accept each unsupported component", "Program office; AO", "Every gate; each support date"],
    ["Fill the inventory questionnaire and decide every flag", "Boundary owner; AO", "Before the security plan"],
    ["Approve the risk strategy and tolerance; sign named appointments", "Head of agency; CIO", "Before the next acceptance"],
    ["Mission owners sign downtime limits; notices start 60+ days early", "Mission owners; SAOP", "Plan approval; collection"],
    ["Decide, per acquisition, whether to require an SBOM on request", "Contracting officer", "Each new acquisition"],
    ["Set the training threshold; name the provider-report reviewer", "CISO", "Next review; Jan 1, 2027"],
    ["Select the assessor; ask what the assessment didn't look at", "AO", "Assessment; each decision"],
    ["List what is proven, asserted, inherited and accepted", "System owner", "Next package update"],
  ];
  const colW = [6.65, 2.75, 2.75];
  const est = asks.reduce((h, r) => h + Math.max(0.36, Math.max(...r.map((c, j) => lines(c, colW[j] - 0.2, 12))) * lh(12) + 0.1), 0.36);
  fit("decision table", 1.45 + est, 5.82);
  s.addTable([head(["Decision", "Owner", "When"]), ...asks.map((r) => [{ text: r[0] }, bold(r[1], HEX.teal), bold(r[2])])],
    tableOpts(colW, { y: 1.45, w: colW.reduce((a, b) => a + b, 0), fontSize: 12, rowH: [0.34, ...asks.map(() => 0.36)] }));
  txt(s, "Close line", [{ text: "None of these is a procurement.  ", options: { bold: true, color: HEX.amber } },
    { text: "A promise is true on the day it's signed; proof keeps showing itself." }],
    { x: 0.6, y: 5.85, w: 12.15, h: 0.55, fontSize: 16, valign: "middle", align: "center" });
  sources(s, "Sources: NIST SP 800-37 Rev. 2; OMB Circulars A-130 and A-108; OMB M-26-05; FedRAMP 2026 rules. Book 14, Chapters 01–12; owners from Chapter 10's responsibility matrix.");
  narrate(s,
`So, the decisions, with their owners and timing. None of them is a procurement.

The authorizing official authorizes the agency's own system that uses each certified service, approves each categorization before controls are selected, selects the assessor and sets its independence, decides whether each unsupported component is retired or explicitly accepted, and asks what the assessment didn't look at.

The head of agency, or the senior accountable official for risk, approves the risk strategy and tolerance, and with the CIO signs named appointments. The CIO and executive sponsor fund the mechanisms that produce records before the tools that measure them. The CISO sets the training threshold and names the federal senior official who reviews provider reports, before January 1, 2027.

Mission owners sign their maximum tolerable downtime. Counsel and the privacy official start each system of records notice at least sixty days before its first collection. The contracting officer decides, acquisition by acquisition, whether to require an SBOM on request. The boundary and procurement owner fills the inventory questionnaire and decides every flag before the security plan is written. The program office keeps one dated register. And the system owner's package lists what's proven, asserted, inherited and accepted.

The next step needs no procurement: fill the questionnaire against the estate as it is, verify each FedRAMP status the day you record it, and decide every flag.

A promise is true on the day it's signed. Proof keeps showing itself. Book 14 has the detail, with every claim footnoted. Thank you.`,
  "Book 14, Chapters 01–12 (owners from Chapter 10's responsibility matrix and the chapters' ownership tables; timing from the chapters named on each slide); Appendix B — Product Inventory Questionnaire.");
}

// ------------------------------------------------------------------ Backup
{
  const s = D.content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources: law, OMB, NIST and privacy");
  const src = [
    "FISMA, 44 U.S.C. §§ 3551–3558 (including § 3553(b)(2), (h) and § 3554(b)(5)).  ·  Federal Acquisition Supply Chain Security Act.  ·  Privacy Act of 1974 (subsections (e)(3), (e)(4), (e)(7), (e)(11), (r), (u); section 7).  ·  E-Government Act of 2002, § 208.",
    "OMB Circular A-130 (with Appendices I and II); Circular A-108; M-24-15; M-26-05 (January 23, 2026); M-26-14 (May 22, 2026); M-26-15 (June 24, 2026); M-26-10; M-21-07; M-17-12; M-10-22; M-03-22.  ·  OPM, 5 CFR 930.301.",
    "FIPS 199; FIPS 200.  ·  NIST SP 800-53 Rev. 5, release 5.2.0, and SP 800-53B (baselines and OSCAL profiles).  ·  SP 800-37 Rev. 2 (Appendix D; Tasks P-1 to M-6).  ·  SP 800-34 Rev. 1.  ·  SP 800-137.  ·  SP 800-161 Rev. 1.  ·  SP 800-50 Rev. 1.  ·  SP 800-39.  ·  OSCAL 1.2.3 (August 7, 2026).",
    "NIST Cryptographic Module Validation Program: FIPS 140-2 transition to the Historical List (September 21, 2026).",
  ];
  fit("Source list 1", need(src, 12.1 - 0.3, 13, 8), 5.0);
  txt(s, "Source list 1", bullets(src, 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 8 });
}
{
  const s = content("Backup", "Sources: FedRAMP, CISA and the market");
  const src = [
    "FedRAMP Consolidated Rules for 2026 (launched June 25, 2026; mandatory January 1, 2027): Using a FedRAMP Certified Cloud Service; Agency Use (AGU-USE-ABU, AGU-USE-ROR, AGU-AGC-GRC); Collaborative Continuous Monitoring (CCM-AGM-ROR); Key Security Indicators; Rev5 control reference; Important Dates.",
    "FedRAMP notices on certification class designations and NTC-0014 (June 16, 2026; VDR and VER mandatory December 7, 2026).  ·  FedRAMP Marketplace dataset, read October 21, 2026.",
    "CISA BOD 26-04 (June 10, 2026); BOD 26-02 (February 5, 2026); BOD 25-01 (December 17, 2024); BOD 23-01; BOD 23-02; BOD 18-01; ED 25-03; ED 26-01; ED 26-03; ScubaGear; Logging Reference Architecture (August 20, 2026); 2026 Minimum Elements for a Software Bill of Materials (July 29, 2026); federal incident notification guidelines.",
    "Formats: SPDX 3.0; CycloneDX 1.7 (ECMA-424); CSAF 2.0; OpenVEX 0.2.0; SLSA 1.2.  ·  Microsoft Learn: Secure Score; Compliance Manager; Microsoft 365 resiliency and backup.",
    "Full footnotes with links and access dates (October 21, 2026): Book 14, every chapter and Appendices A and B (whalermike.github.io/modernization-workbook/docs/books/b14-compliance/).",
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
