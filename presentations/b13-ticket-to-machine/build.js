// Book 13, Appendix B — Ticket-to-Machine Reference: a narrated reference deck (about 10 minutes).
// The coordination loop, the five-clause request chain, the five lanes, change and drift classes, severity
// and tempo, the leadership measures, the evidence record, four worked examples, the certificate exception,
// one front door for detection tools, and the failure modes a reference implementation review found.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B13_Ticket_to_Machine.pptx
// Code model: ../start-here/build.js (narration.js keyed by slide title, Detail block in the notes),
// with the table, panel and fact-box styles of ../b15-day2-operations-technical/build.js.
// Every fact comes from docs/books/b13-governance/appendix-b-ticket-to-machine-reference.md or
// 10-ticket-to-machine.md. Lanes, ceilings, severities and windows are labeled program design, and the
// worked examples illustrative, as the appendix labels them. Agency-neutral.
const path = require("path");
const fs = require("fs");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Book 13", title: "Ticket-to-Machine Reference",
  footer: "Book 13  ·  Ticket-to-Machine Reference  ·  Federal Modernization Workbook" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B13_Ticket_to_Machine.pptx";

// ------------------------------------------------------------------ helpers (as in start-here and b15 technical)
const NARR = require("./narration.js");
const used = new Set();
const WPM = 142;
let clock = 0;
const per = [];
const titles = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const title = titles[titles.length - 1];
  const say = NARR[title];
  if (!say) throw new Error(`no narration for slide: ${title}`);
  used.add(title);
  const n = say.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; per.push({ slide: pres.slides.length, n, title });
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${say.trim()}\n\nDetail: ${body.trim()}\n\nWorkbook: ${ref}`);
};

const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams");
const img = (s, name, alt, x, y, maxW, maxH) => {
  const [series, base] = name.split("/");
  const file = path.join(DIAG, series, "png", `${base}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  return { w, h };
};
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  titles.push(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };

const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6;
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

const sources = (s, text, y = 6.62) => {
  if (text.length > 185) throw new Error(`slide ${pres.slides.length} Sources line over 185 characters (${text.length}): ${text}`);
  return txt(s, "Sources", text, { x: 0.6, y, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

// Text with a fit check.
const T = (s, name, t, o) => {
  const size = o.fontSize || 14;
  const runs = typeof t === "string" ? [{ text: t, options: {} }] : t;
  const paras = []; let cur = { chars: 0, size };
  runs.forEach((r) => {
    const ro = r.options || {}; const sz = ro.fontSize || size;
    cur.size = Math.max(cur.size, sz); cur.chars += (r.text || "").length * (sz / size);
    if (ro.breakLine || ro.bullet) { paras.push(cur); cur = { chars: 0, size }; }
  });
  if (cur.chars) paras.push(cur);
  const need = paras.reduce((h, p) => h + lines("x".repeat(Math.round(p.chars)), o.w - 0.1, p.size) * p.size / 72 * 1.2 + (o.paraSpaceAfter || 0) / 72, 0);
  if (need > o.h * 1.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow: needs ${need.toFixed(2)}, has ${o.h.toFixed(2)}`);
  if (process.env.FIT) console.log(`  text ${name}: needs ${need.toFixed(2)}, has ${o.h.toFixed(2)}`);
  return txt(s, name, t, o);
};

// The kit's full-width callout, with a fit check (16.5 pt text in a 10.65-inch frame), or a smaller size.
const callout = (s, name, y, h, iconName, color, label, text, pt = 16) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * pt / 72) / 10.45) * pt / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! slide ${pres.slides.length} ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (process.env.FIT) console.log(`  callout ${name}: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  box(s, name, 0.6, y, 12.15, h, "FFFFFF", color);
  const d = Math.min(0.8, h - 0.2);
  icon(s, iconName, 0.85, y + (h - d) / 2, d, color);
  txt(s, `${name} text`, [{ text: label, options: { bold: true, color } }, { text }],
    { x: 1.9, y: y + 0.05, w: 10.65, h: h - 0.1, fontSize: pt, valign: "middle" });
  return y + h;
};

// A table whose row heights follow the text. rows: arrays of strings or {text, options}.
const table = (s, name, y, colW, headers, rows, o = {}) => {
  const pt = o.fontSize || 12.5;
  const lh = pt / 72 * 1.2;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const rh = (r, bold) => Math.max(o.minRow || 0.32, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
  const rowH = [rh(headers, true), ...rows.map((r) => rh(r))];
  const body = rows.map((r) => r.map((c, k) => {
    const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
    if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
    return base;
  }));
  const x = o.x != null ? o.x : 0.6;
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, w: colW.reduce((a, b) => a + b, 0), fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`slide ${pres.slides.length} ${name} table`, bottom);
  if (process.env.FIT) console.log(`  table ${name}: bottom ${bottom.toFixed(2)} in`);
  return bottom;
};

// A tinted panel with a small caps label, a heading and bullets (or numbered steps).
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13, numbered = false) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 15.5, fontFace: "Cambria", breakLine: true } });
  if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.7 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.35 : 0) + (runs.length ? 0.08 : 0);
  const list = numbered
    ? items.map((t, k) => ({ text: t, options: { bullet: { type: "number" }, breakLine: k < items.length - 1, fontSize: pt } }))
    : bullets(items, pt);
  txt(s, `${name} list`, list, { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 3 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.7, pt) * pt / 72 * 1.2 + 0.05, 0);
  if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  if (process.env.FIT) console.log(`  panel ${name}: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
};

// A row of step boxes joined by arrows.
const flow = (s, name, y, h, steps, pt = 12, x0 = 0.6, W = 12.15) => {
  const n = steps.length, gap = 0.28, w = (W - gap * (n - 1)) / n;
  steps.forEach((st, i) => {
    const x = x0 + i * (w + gap);
    const c = st.color || (i % 2 ? HEX.teal : HEX.navy);
    box(s, `${name} ${i + 1}`, x, y, w, h, st.tint || (i % 2 ? HEX.tealTint : HEX.navyTint));
    const runs = [{ text: st.head, options: { bold: true, color: c, fontSize: pt + 1.5, fontFace: "Cambria", breakLine: !!st.body } }];
    if (st.body) runs.push({ text: st.body, options: { fontSize: pt } });
    T(s, `${name} ${i + 1} text`, runs, { x: x + 0.1, y: y + 0.08, w: w - 0.2, h: h - 0.16, paraSpaceAfter: 2, fontSize: pt });
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

// Tinted fact boxes in a row: [label, color, tint, text].
const facts = (s, name, top, h, items, pt = 12) => {
  const gap = 0.15, w = (12.15 - gap * (items.length - 1)) / items.length;
  items.forEach((f, i) => {
    const x = 0.6 + i * (w + gap);
    box(s, `${name} ${i + 1}`, x, top, w, h, f[2]);
    txt(s, `${name} ${i + 1} text`, [
      { text: f[0], options: { bold: true, color: f[1], fontSize: 15, fontFace: "Cambria", breakLine: true } },
      { text: f[3], options: { fontSize: pt } },
    ], { x: x + 0.15, y: top + 0.08, w: w - 0.3, h: h - 0.14, valign: "middle" });
    const need = 0.32 + lines(f[3], w - 0.3, pt) * pt / 72 * 1.2;
    if (need > h - 0.1) console.warn(`  ! slide ${pres.slides.length} ${name} box ${i + 1} may overflow: needs ${need.toFixed(2)}, has ${(h - 0.1).toFixed(2)}`);
  });
};

// The "program design" marker on slides that carry the program's lanes, ceilings, severities or windows.
const design = (s, text, x = 0.6, y = 1.42, w = 12.15) =>
  txt(s, "Design label", text, { x, y, w, h: 0.28, fontSize: 11, bold: true, color: HEX.amber, valign: "middle" });

const SUB = "Appendix B, narrated reference  ·  Book 13 — Governance, Drift & Evidence";
const S0 = "Orientation";
const S1 = "The loop and the lanes";
const S2 = "Tempo, measures and evidence";
const S3 = "Examples and exceptions";
const S4 = "Close";

// ================================================================== 1 Title
{
  const s = titleSlide(S0, "Book 13 — Ticket-to-Machine Reference", SUB);
  T(s, "Session map", [
    { text: "THE REFERENCE BEHIND CHAPTER 10  ·  ABOUT 10 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "The loop, the five clauses and the five lanes  ·  Change and drift classes", options: { color: HEX.ink, breakLine: true } },
    { text: "Tempo, measures and the evidence record  ·  Four worked examples  ·  Exceptions", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Book 13, Appendix B and Chapter 10. Lanes, ceilings, severities and windows are program design; examples are illustrative.", 6.08);
  notes(s,
`A narrated walk through Book 13, Appendix B, the reference tables and worked examples behind Chapter 10, "Operational Tempo: Ticket to Machine, Not Ticket to Human." The appendix's epigraph: a ticket is evidence only when it authorized something that then ran, and a re-read proved the result. Coverage: the coordination loop and the five-clause request chain; the five lanes and which classes of change take each; drift classes and default lanes; severity and tempo; the leadership measures; the evidence record; four worked examples; the certificate exception; one front door for detection tools; and the failure modes a security review of a reference implementation found. The appendix's own caution applies throughout: the lanes, ceilings, severities and response windows are the Federal Modernization Program's design, not federal requirements; where a federal document says something relevant, it is cited. The worked examples are illustrative patterns, not records of a real engagement, and every identifier in them is invented. Product capabilities change quickly; confirm current behavior with each vendor before a plan, procurement or acquisition decision rests on this material. The control-by-control mapping is in Appendix A.`,
  "Book 13, Appendix B (In this appendix; Program design, with illustrative examples).");
}

// ================================================================== 2 Why
{
  const s = content(S0, "A ticket is evidence only when a re-read proves it");
  tag(s, "Why");
  img(s, "b13-governance/ch10-ticket-to-machine",
    "The same drift finding handled two ways. A violet card at the top: drift detected against the record, raised as a typed task on the configuration item with an owner, a clock and a severity. A red path, ticket to a human: a person opens the console because the ticket said so, changes it by hand under a personal admin account, and replies done, so closure is an assertion. A green path, ticket to a machine: a human approves, either the instance or the class in advance; the platform executes from a versioned plan under a service identity after a dry run; a re-read verifies that actual state matches the record; and the task is closed with evidence, the approval, run log, result and re-test.",
    0.6, 1.5, 5.6, 4.95);
  panel(s, "Human", 6.55, 1.5, 6.2, 1.95, HEX.red, HEX.redTint, "TICKET TO A HUMAN", "Changes who is to blame, not what is proved", [
    "A person opens the console because the ticket said so, under a personal admin account",
    "They reply \"done\": the closure is an assertion, prose rather than evidence",
  ], 13);
  panel(s, "Machine", 6.55, 3.6, 6.2, 2.15, HEX.teal, HEX.tealTint, "TICKET TO A MACHINE", "The person's role stops at approval", [
    "A human approves the instance, or the class in advance",
    "The platform runs a versioned plan under a service identity, after a dry run",
    "A re-read proves the result, and the record assembles itself",
  ], 13);
  T(s, "Why tempo", [{ text: "Why it matters: ", options: { bold: true, color: HEX.red } },
    { text: "a platform that detects perfectly and closes slowly builds an accurate list of things nobody fixed." }],
    { x: 6.55, y: 5.88, w: 6.2, h: 0.62, fontSize: 13 });
  sources(s, "Sources: Book 13, Ch 10 (opening; Ticket to machine, not ticket to human; figure); Appendix B (epigraph; The coordination loop).");
  notes(s,
`Chapter 10's argument. The drift engine (Chapter 06) turns every difference between the record and the estate into a remediation contract with a class, a severity and an escalation path. That is necessary and not sufficient: a platform that detects perfectly and closes slowly produces a growing, accurate, timestamped list of things nobody fixed, and its evidence then documents neglect rather than discipline. The default shape of change management: a ticket is raised, a person opens the console or runs a script because the ticket told them to, and replies "done." Adding a ticket in front of that doesn't change who is at the keyboard, what account they used or whether anything checked their work; Book 00, Chapter 04 is explicit that a task closed by a person clicking "complete" with no machine-readable verification is prose, not evidence. The program's rule: wherever a machine can reach the surface, the ticket authorizes a machine. A human approves; the platform executes under a service identity, from a versioned plan, after a dry run, and re-reads the object to verify the result. Running a change that way produces what an assessor checks for: a prior approval by a named person who isn't the requester; a version-controlled, access-restricted artifact; execution logged and attributed to the task and its service identity; a result verified by a re-read that can be re-tested. People tune the classifier, review escalations, decide exceptions and write the rules; they don't triage routine drift ticket by ticket. SP 800-137 is clear that a security program can't be fully automated; the tools still need people.`,
  "Book 13, Chapter 10 (opening; Ticket to machine, not ticket to human); Appendix B, epigraph.");
}

// ================================================================== 3 Coordination loop
{
  const s = content(S1, "The coordination loop: five steps, native surfaces");
  tag(s, "What");
  flow(s, "Loop", 1.55, 1.4, [
    { head: "1  Test", body: "A rule evaluates actual state against the authoritative record" },
    { head: "2  Detect drift", body: "A difference becomes a typed finding with a severity" },
    { head: "3  Raise a task", body: "Against the reconciled configuration item, with an owner and a clock" },
    { head: "4  Actuate", body: "On the native surface, under a service identity, through its own interface" },
    { head: "5  Close", body: "Re-read the post-change state; write one record of the whole chain", color: HEX.amber, tint: HEX.amberTint },
  ], 12.5);
  callout(s, "Never writes", 3.15, 0.95, "FaRoute", HEX.teal, "The coordination layer never writes the change itself: ",
    "it makes every drift owned, clocked, approved and evidenced. A console can't answer those four questions alone.", 15);
  table(s, "Direction", 4.35, [3.0, 9.15], ["Where federal policy points", "What it says (binds cloud providers; the program applies the logic to its own estate)"], [
    ["OMB M-24-15", "FedRAMP should oversee a provider's change process itself, rather than each individual change"],
    ["FedRAMP 2026 change rules", "Routine recurring changes need no formal notification; records of how each was classified stay auditable"],
    ["FedRAMP change indicator", "Prefer redeploying version-controlled resources to modifying them in place, \"wherever reasonable\""],
  ], { fontSize: 12 });
  sources(s, "Sources: Book 13, App B (The coordination loop): OMB M-24-15 §VI; FedRAMP 2026 rules, SCN and KSI-CMT-RMV. Ch 10 (Native tools change state).");
  notes(s,
`The coordination loop. Native consoles can detect drift and change state, and their dashboards show current posture inside their own boundary. What a console can't do on its own is answer the four questions an assessor asks about a finding: who owns it, by when, under whose approval, and with what evidence of closure. The program puts a coordination layer in front of the native tools and keeps every change on the native surface. 1 Test: a rule evaluates actual state against the authoritative record (Chapter 05). 2 Detect drift: a difference becomes a typed finding with a severity (Chapter 06). 3 Raise a typed task against the reconciled configuration item, with an owner and a clock. 4 Actuate on the native surface, under a service identity, through the platform's own interface. 5 Close with evidence: re-read the post-change state and write one record of the whole chain. The coordination layer never writes the configuration, applies the patch or edits the firewall rule itself. Federal direction: OMB M-24-15 asked FedRAMP to oversee a cloud provider's change process itself rather than each individual change. FedRAMP's 2026 rules let providers make routine recurring changes (fixing flaws, handling incidents, doing maintenance) without formal notification, while keeping auditable records of how each change was classified. FedRAMP's change management indicator (KSI-CMT-RMV) prefers redeploying version-controlled resources to modifying them in place "wherever reasonable." Those rules bind providers, not agencies; the program applies the same logic to an agency's own estate. Chapter 10 adds that SP 800-53 CM-3 asks for this record directly, and SP 800-37 asks organizations to monitor for unauthorized changes and their root cause.`,
  "Book 13, Appendix B, The coordination loop; Chapter 10, Native tools change state; they don't close findings.");
}

// ================================================================== 4 Five-clause chain
{
  const s = content(S1, "The five-clause request chain");
  tag(s, "How");
  const b = table(s, "Clauses", 1.5, [2.45, 3.75, 3.15, 2.8], ["Clause", "What the coordination layer checks", "Refuses when", "Evidence it leaves"], [
    ["1  Originates with the source of truth", "The task traces to a lineage record: a drift finding, an HR event or an approved request", "No origin record resolves", "The origin record's identifier"],
    ["2  Carries an authoritative authorization", "The approver resolves from the authority model; separation of duties holds, fail-closed", "The requester or plan author is the approver; the target isn't reconciled", "Approver, approval time, the authority rule that resolved"],
    ["3  Least privilege, just in time", "A time-boxed, scoped role activates; the native write runs through the platform's interface", "No activation (no activation, no actuation); a standing grant; the write is rejected", "Activation ID and expiry; run log tied to the task; artifact version"],
    ["4  Closes with provenance", "The post-change state is re-read; a success response is not closure", "The re-read doesn't show the intended state", "Verification payload, timestamp, checking mechanism's identity"],
    ["5  Emits verified evidence", "One closure record flows to continuous monitoring, with no human assembly", "The record can't be written or signed", "The closure record in the evidence chain"],
  ], { fontSize: 12.5 });
  callout(s, "Refusal", b + 0.15, 0.8, "FaListCheck", HEX.navy, "In order, every time: ",
    "if any clause fails the chain stops and the task isn't closed. A refusal is written to the record like a success.", 15);
  sources(s, "Sources: Book 13, Appendix B (The five-clause request chain); Book 00, Ch 04 (Principle 2); Book 01, Ch 11 (actuation ladder); Book 04, Ch 08.");
  notes(s,
`Every governed change, every move, add, change, deletion and reset, travels the five clauses of Book 00, Chapter 04, Principle 2. In the coordination layer they run in order; if any clause fails the chain stops and the task is not treated as closed, and a refusal is written to the record like a success. Clause 1, originates with the source of truth: the task traces to a lineage record (a drift finding, an HR event or an approved request); refuses when no origin record resolves; leaves the origin record's identifier. Clause 2, carries an authoritative authorization: the approver resolves from the authority model, separation of duties holds, fail-closed; refuses when the requester or the plan's author is the approver, or the target isn't reconciled to the authoritative record; leaves approver, approval time and the authority rule that resolved. Clause 3, executes under least privilege, elevated just in time: the executing identity activates a time-boxed, scoped role, then the native write runs through the platform's interface; refuses when no activation is issued (no activation, no actuation), the grant requested would be standing, or the write is rejected; leaves activation identifier and expiry, run log tied to the task, artifact version. Clause 4, closes with provenance: the post-change state is re-read from the platform; a success response is not closure; refuses when the re-read doesn't show the intended state; leaves verification payload, timestamp and identity of the checking mechanism. Clause 5, emits verified, secured evidence automatically: one closure record flows into the continuous-monitoring stream with no human assembly; refuses when the record can't be written or signed (Chapter 07). The chain mirrors the Book 01 actuation ladder: clause 2 is the human authorization L3 gated actuation requires for each instance, or the advance acceptance of the class at L4, and clause 4 is the re-test that makes the result something an authorizing official can rely on. Privileged elevation follows Book 04's request-with-approval model.`,
  "Book 13, Appendix B, The five-clause request chain.");
}

// ================================================================== 5 Five lanes
{
  const s = content(S1, "Five lanes: who approves, what runs, what it proves");
  tag(s, "Who");
  design(s, "PROGRAM DESIGN, NOT A FEDERAL REQUIREMENT  ·  THE LANE DECIDES WHO APPROVES, WHAT RUNS AND WHAT EVIDENCE RESULTS");
  const b = table(s, "Lanes", 1.78, [1.95, 3.55, 2.6, 2.45, 1.6], ["Lane", "Who approves", "What executes", "Evidence produced", "Ladder ceiling"], [
    ["Machine, autonomous", "The class, accepted in advance and in writing by the authorizing official, with scope limits, exclusions and review rate; the board reviews it quarterly", "The execution layer, through a native interface, inside the window", "Finding, rule and baseline version, before and after, re-read, run log", "L4: enumerated low-blast-radius classes only"],
    ["Machine, gated", "A named approver who isn't the requester or the plan's author: per instance, ring or approved batch", "The execution layer after a dry run, under a service identity", "The above, plus approval, dry run and activation", "L3: the default ceiling"],
    ["Human decision", "The role that owns the decision", "Whatever it authorizes, usually the gated lane", "The decision record, then gated-lane evidence", "L2 until decided"],
    ["Protocol-enforced", "The policy encoded in the protocol and in DNS", "The issuing protocol; no ticket per event", "Issuance logs, inventory, policy records", "Not a ticket lane"],
    ["Declared exception", "The system owner, with a named compensating control and an end date", "A person, in a time-boxed, proxied, recorded session", "The approval first, then the recording", "Temporary; tracked to closure"],
  ], { fontSize: 12.5 });
  warn("lanes", b);
  sources(s, "Sources: Book 13, Appendix B (Change classes and their lanes); Ch 10 (Approval gates keep humans on the decisions that matter); Book 01, Ch 11.");
  notes(s,
`Each class of change takes one of five lanes; the lane decides who approves, what runs and what evidence results. These are the program's design, not federal requirements. Machine, autonomous: approved as a class, in advance and in writing by the authorizing official, with its scope limits, exclusions and after-the-fact review rate; the governance board reviews each such class quarterly; the execution layer runs through a native interface inside the response window; evidence is the finding, rule and baseline version, before and after state, re-read and run log; ceiling L4, enumerated low-blast-radius classes only. Machine, gated: a named approver who isn't the requester or the plan's author, per instance, ring or approved batch; the execution layer runs after a dry run under a service identity; evidence adds the approval, dry run and activation; ceiling L3, the default. Human decision: the role that owns the decision; executes whatever the decision authorizes, usually the gated lane; L2 until decided. Protocol-enforced: the policy encoded in the protocol and in DNS; the issuing protocol runs with no ticket per event; issuance logs, inventory, policy records; not a ticket lane. Declared exception: the system owner, with a named compensating control and an end date; a person through a time-boxed, proxied and recorded privileged session; approval first, then the session recording; temporary, tracked to closure. Chapter 10: at L3 the approval attaches to the instance (a plan, a dry run, a named approver through the repository's review); at L4 it attaches to the class, with stated conditions that drop the class back to L3. Four mechanics keep both honest: separate identities for deciding and acting; no standing privilege for people; requesters don't approve; closure is a re-read, not a 2xx response. L3 is the default by design, not a federal requirement: CISA's Zero Trust Maturity Model describes itself as a general guide.`,
  "Book 13, Appendix B, Change classes and their lanes; Chapter 10, Approval gates keep humans on the decisions that matter.");
}

// ================================================================== 6 Classes part 1
{
  const s = content(S1, "Change classes to lanes: drift, patching and access");
  tag(s, "How");
  txt(s, "Tests label", "A CLASS GOES TO A MACHINE ONLY WHEN IT PASSES ALL SIX TESTS (CHAPTER 10)", { x: 0.6, y: 1.42, w: 12.15, h: 0.26, fontSize: 11, bold: true, color: HEX.slate });
  const tests = ["Reachable", "Deterministic", "Bounded", "Reversible", "Verifiable", "Not permanently gated"];
  const tw = (12.15 - 0.12 * 5) / 6;
  tests.forEach((t, i) => {
    const x = 0.6 + i * (tw + 0.12);
    box(s, `Test ${i + 1}`, x, 1.72, tw, 0.42, HEX.navyTint);
    txt(s, `Test ${i + 1} text`, `${i + 1}  ${t}`, { x: x + 0.08, y: 1.72, w: tw - 0.16, h: 0.42, fontSize: 12.5, bold: true, color: HEX.navy, align: "center", valign: "middle" });
  });
  design(s, "THE PROGRAM'S STARTING ASSIGNMENT  ·  PROGRAM DESIGN  ·  AN AGENCY TUNES IT IN ITS OWN RECORD", 0.6, 2.24);
  table(s, "Classes A", 2.56, [3.3, 3.45, 2.6, 2.8], ["Class of change (example)", "Lane", "Approval needed", "Evidence beyond the default"], [
    ["Config drift, deterministic fix, low or medium (a setting reverted by hand)", "Machine, gated; autonomous only where the class is enumerated", "Per instance; or the class in advance", "The baseline version the fix restored"],
    ["Config drift, deterministic fix, high (storage opened to public access)", "Machine, gated, inside a 1-hour window; a person decides a non-deterministic fix", "Named approver per instance, unless enumerated", "Exposure window, detection to re-read"],
    ["Critical drift, or any authorization or provenance drift", "Halt and alert, then human decision", "Escalation path: steward, workstream lead or CISO", "Investigation notes linked to the finding"],
    ["Vulnerability remediation and patching", "Machine, gated by maintenance window", "Change approval for the window or batch", "Scan before and after; time against window"],
    ["Access request inside policy", "Machine, gated through the five clauses", "The approver named for that role", "Just-in-time activation and its expiry"],
    ["Over-privilege or idle entitlement (unused 90 days)", "Human decision by the owner, then gated removal", "Entitlement owner", "The decision and the re-read of the binding"],
  ], { fontSize: 11.5 });
  sources(s, "Sources: Book 13, Appendix B (Change classes and their lanes); Chapter 10 (Which change classes qualify: the six tests).");
  notes(s,
`Chapter 10's six tests, all of which a class must pass to qualify for a ticket to a machine (program design): 1 a machine can reach the surface through an API or management stack under a scoped service identity; 2 the fix is deterministic, the end state comes from the record, and if two careful engineers could reasonably choose different fixes the class doesn't qualify; 3 the scope is bounded, one object or a pre-materialized list, with blast radius computed before approval; 4 there is a way back, rollback-paired or rollback-never by design with a defined recovery path; 5 the result can be verified by a re-read; 6 the class isn't on the permanent-L3 list (tenant-wide roles, Conditional Access enforcement, bulk device state, network policy touching thousands of endpoints). The tests decide whether a machine executes; the ladder decides whether a human approves each instance first. Appendix B's starting assignment, first six classes: configuration drift with a deterministic fix, low or medium severity (a tenant setting reverted by hand away from the secure baseline): machine, gated; autonomous only where enumerated at L4; per instance at L3, the class in advance at L4; plus the baseline version restored. High severity (a storage account opened to public network access): machine, gated, inside a 1-hour window; a person decides the fix if it isn't deterministic; named approver per instance unless enumerated at L4; plus the exposure window from first detection to re-read. Critical drift, or any drift in authorization or provenance (a change with no provenance event; a policy contradicting a principal's recorded assurance level): halt and alert, then human decision, by the escalation path in the finding's contract (steward for the record, workstream lead for a platform, CISO for a control requirement or evidence); investigation notes linked. Vulnerability remediation and patching: machine, gated by maintenance window; change approval for the window or batch; scan before and after and time against the window. Access request inside policy: machine, gated through the five clauses; approver named for the role; JIT activation and expiry. Over-privilege or idle entitlement (unused 90 days): human decision by the entitlement owner, then gated removal; the decision and the re-read of the binding.`,
  "Book 13, Appendix B, Change classes and their lanes; Chapter 10, Which change classes qualify.");
}

// ================================================================== 7 Classes part 2
{
  const s = content(S1, "Change classes to lanes: big changes, records, exceptions");
  tag(s, "How");
  design(s, "THE PROGRAM'S STARTING ASSIGNMENT  ·  PROGRAM DESIGN  ·  A CLASS MOVES ONLY BY A REVIEWED CHANGE TO THE RECORD");
  const b = table(s, "Classes B", 1.78, [3.3, 3.45, 2.6, 2.8], ["Class of change (example)", "Lane", "Approval needed", "Evidence beyond the default"], [
    ["High-blast-radius change (tenant-wide role, Conditional Access, bulk device state)", "Machine, gated, permanently", "Named approver, after a dry run", "Dry-run output and rollback plan"],
    ["Change to the authoritative record (baseline, threshold, source)", "Human decision", "Reviewed pull request; steward and sponsor for architecture", "The merged change and its review"],
    ["Routine certificate issuance and renewal within policy", "Protocol-enforced", "None per event", "Issuance and inventory records"],
    ["Certificate anomaly (new CA, odd lifetime, unknown issuer)", "Human decision, then gated", "PKI owner", "The anomaly finding and its disposition"],
    ["No machine actuator exists yet (console-only appliance)", "Declared exception", "System owner, compensating control, end date", "Session recording; the POA&M item"],
    ["Emergency change (containment during an incident)", "Act first under incident procedures, then record", "Incident commander; retrospective review", "Retroactive task and assessment"],
  ], { fontSize: 11.5 });
  callout(s, "Two rules", b + 0.15, 1.0, "FaScaleBalanced", HEX.teal, "Two rules hold across the table: ",
    "a machine never changes the record to make drift disappear, and no class routes a gap through a person at a console without declaring it.", 14.5);
  sources(s, "Sources: Book 13, Appendix B (Change classes and their lanes); FedRAMP 2026 rules, SCN (emergency changes); Book 00, Ch 07 (decision rights).");
  notes(s,
`The rest of the starting assignment. High-blast-radius change (a tenant-wide role, a Conditional Access enforcement change, bulk device state, network policy touching thousands of endpoints): machine, gated, permanently; named approver after a dry run; dry-run output and rollback plan. Change to the authoritative record itself (a new baseline, a rule threshold, a change to which source is authoritative): human decision; reviewed pull request, with steward and sponsor for architecture or authoritative-origin rules; the merged change and its review. Routine certificate issuance and renewal within policy (a web server's certificate renewed automatically): protocol-enforced; none per event; issuance and inventory records. Certificate anomaly (a new issuing CA, a non-standard lifetime, a trust anchor change, an unknown-issuer certificate found in inventory, a blocked issuance attempt against a CAA record): human decision, then gated; PKI owner; the anomaly finding and its disposition. No machine actuator exists yet (an appliance with no supported interface): declared exception; system owner, with compensating control and end date; session recording and the exception's POA&M item. Emergency change (containment during an incident): act first under incident procedures, then record; incident commander, retrospective review; retroactive task and assessment. The emergency row follows the shape FedRAMP gives providers: significant changes may be made in an emergency without advance notification, provided procedures are followed, parties are notified and the materials and assessment are completed afterward. Two rules across the table: a machine never changes the authoritative record to make drift disappear (authority to change the record belongs to its review process, not to an adapter's fix path); and no class routes a gap through a person at a console without saying so: where no machine can reach the surface, the exception is declared, approved first and recorded. Decision rights for every approver are in Book 00, Chapter 07; the authorizing official alone accepts residual risk.`,
  "Book 13, Appendix B, Change classes and their lanes.");
}

// ================================================================== 8 Drift classes
{
  const s = content(S1, "Drift classes and their default lanes");
  tag(s, "What");
  design(s, "DEFAULT LANES ARE PROGRAM DESIGN  ·  CHAPTER 06 CARRIES THE FULL DRIFT MODEL");
  const b = table(s, "Drift", 1.78, [2.0, 4.6, 5.55], ["Drift class", "What it means", "Default lane"], [
    ["Schema", "A value's encoding or structure doesn't match the current schema", "Machine-executed when the transform is deterministic, gated unless the class is accepted as autonomous; a format failure on a claim in use is critical and halts"],
    ["Semantic", "A value is well formed but means the wrong thing, such as a deprecated naming pattern", "Machine, gated; often escalates"],
    ["Provenance", "A state change appears with no provenance event", "Halt and alert when the claim is in active use (P1); otherwise a P3 human decision"],
    ["Authorization", "A policy contradicts what the record says a principal may do", "Halt and alert when the claim is in active use (P1); otherwise a P3 human decision"],
    ["Identity", "A principal exists with no counterpart in the record, or the reverse", "Human decision, then gated"],
  ], { fontSize: 13 });
  callout(s, "Context", b + 0.2, 1.0, "FaTriangleExclamation", HEX.amber, "Honest limit: ",
    "semantic, authorization and identity drift reach a person more often than schema and provenance drift, because their fixes depend on context.", 14.5);
  sources(s, "Sources: Book 13, Appendix B (Drift classes and their default lanes); Chapter 06 (the drift engine); Chapter 10 (Honest limits); Book 02, Ch 11.");
  notes(s,
`The program's drift classes, as Book 02 names them, map to lanes by default; Chapter 06 carries the full model. Schema: a value's encoding or structure doesn't match the current schema; machine-executed when the transform is deterministic, gated at L3 unless the authorizing official has accepted the class at L4; a format failure on a claim in use is critical and halts. Semantic: a value is well formed but means the wrong thing, such as a deprecated naming pattern; machine, gated; often escalates. Provenance: a state change appears with no provenance event; halt and alert when the claim is in active use (P1), otherwise a P3 human decision. Authorization: a policy contradicts what the record says a principal may do; halt and alert when the claim is in active use (P1), otherwise a P3 human decision. Identity: a principal exists with no counterpart in the record, or the reverse; human decision, then gated. Chapter 06 sets severity from the drift class and whether the affected claim is in active use. Chapter 10's honest limits: automation is bounded to deterministic fixes; as runtime detection matures more classes qualify, but today semantic, authorization and identity drift escalate to a person more often than schema and provenance drift do, because their fixes depend on context.`,
  "Book 13, Appendix B, Drift classes and their default lanes; Chapter 10, Honest limits.");
}

// ================================================================== 9 Severity and tempo
{
  const s = content(S2, "Severity and tempo: four windows");
  tag(s, "How");
  design(s, "THE PROGRAM'S INTERNAL WINDOWS FOR DRIFT AGAINST ITS OWN RECORD  ·  PROGRAM DESIGN, NOT AN EXTERNAL STANDARD");
  const b = table(s, "Tempo", 1.78, [1.2, 2.2, 1.15, 2.15], ["Severity", "May a machine fix it?", "Window", "Who approves"], [
    ["P1, critical", "No: the run halts and alerts", "Immediate", "A named role decides before anything changes"],
    ["P2, high", "Yes, if the fix is deterministic and the class qualifies", "1 hour", "An approver per instance, unless the class is enumerated"],
    ["P3, medium", "Yes, if the class qualifies", "24 hours", "Per instance, or the class approved in advance"],
    ["P4, low", "Yes, if the class qualifies", "72 hours", "Class approved in advance, reviewed after"],
  ], { fontSize: 12 });
  img(s, "b13-governance/ch10-tempo-paths",
    "The tempo: a classified finding with a severity from P1 to P4 and an operation class leads to three paths. P1 immediate: halt and alert, a named role decides. L3 default, ticket to a machine: a human approves each instance. L4 enumerated: the machine closes the loop for a class approved in advance. Where no machine can reach the surface, the fallback is a declared exception through an approved, time-boxed, proxied, recorded privileged session. All paths end in one closure record with the owner, clock, approval, execution and re-test, written to the evidence chain.",
    7.5, 1.78, 5.25, 3.3);
  callout(s, "External", Math.max(b, 4.95) + 0.2, 1.05, "FaUserClock", HEX.red, "An external clock governs when it is shorter or different: ",
    "vulnerabilities follow CISA BOD 26-04's timelines, and incidents CISA's one-hour notification. Auto-fix holds only for enumerated classes.", 14);
  sources(s, "Sources: Book 13, Appendix B (Severity and tempo): CISA BOD 26-04. Ch 10 (The program's tempo): CISA Federal Incident Notification Guidelines.");
  notes(s,
`The tempo is how quickly each severity must be handled; it bounds the response, not the occurrence. Drift is the signal, and a program with no findings is more likely blind than clean. P1, critical: no machine fix, the run halts and alerts; immediate; a named role decides before anything changes. P2, high: yes, if the fix is deterministic and the class qualifies (otherwise a person decides the fix); 1 hour; an approver per instance, unless the class is enumerated at L4. P3, medium: yes, if the class qualifies; 24 hours; an approver per instance, or the class approved in advance. P4, low: yes, if the class qualifies; 72 hours; the class approved in advance, reviewed after the fact. The source of this tempo said P3 and P4 findings auto-remediate; in the program's model that holds only for classes enumerated at L4, and everywhere else the machine executes after a person approves, which is still a ticket to a machine. These are the program's internal windows for drift against its own record; they don't replace external timelines. CISA's BOD 26-04 (June 10, 2026) sets remediation timelines for vulnerabilities by exposure, KEV status, automatability and technical impact, and an agency's vulnerability findings follow those; Chapter 10 notes it revoked BOD 22-01 and BOD 19-02. An incident runs on CISA's clock, which requires notification within one hour of the incident's identification by the agency's top-level incident response team. Where both apply, the external clock governs whenever it is shorter or different in kind. "May a machine fix it" never overrides the ceiling for the class. Chapter 10's three operating commitments: detection is continuous; remediation is bounded; escalation lands on named roles (steward, workstream lead, CISO), never a distribution list. Book 01, Chapter 12 makes a missed window on a priority-one finding a rollback trigger to the steward and sponsor.`,
  "Book 13, Appendix B, Severity and tempo; Chapter 10, The program's tempo.");
}

// ================================================================== 10 Leadership measures
{
  const s = content(S2, "What the tempo shows leadership: five measures");
  tag(s, "Who");
  const b = table(s, "Measures", 1.5, [2.6, 5.0, 4.55], ["Measure", "Question", "What a bad value means"], [
    ["Detection coverage", "What share of the estate emits drift findings?", "Drift outside coverage is invisible to the tempo"],
    ["Window adherence", "What share of findings close inside their window, and how many are open past it?", "The program is generating drift in its own operations"],
    ["Escalation rate", "What share of findings reach a human?", "Severity is rising, or the classifier needs tuning"],
    ["Machine-closure share", "What share of closures did a machine execute under an approval?", "Actuators aren't being added"],
    ["Declared-exception count", "How many open tasks have no machine actuator?", "Manual work is becoming permanent"],
  ], { fontSize: 13 });
  const y = b + 0.2, h = 6.5 - y;
  panel(s, "Staffing", 0.6, y, 6.0, h, HEX.teal, HEX.tealTint, "WHAT THE TEMPO DOESN'T NEED", "No round-the-clock staffing", [
    "Low and medium findings close through approved plans and autonomous classes",
    "Critical findings halt and hold until a person responds",
  ], 13);
  panel(s, "Roles", 6.75, y, 6.0, h, HEX.amber, HEX.amberTint, "WHAT IT DOES NEED", "The escalation roles must exist", [
    "A program without a steward has to designate one; tooling can't create authority",
    "Targets are the agency's to set; count overdue items apart from the ratio",
  ], 13);
  sources(s, "Sources: Book 13, Appendix B (Severity and tempo: the measures); Chapter 10 (What the tempo shows leadership; What the tempo doesn't require).");
  notes(s,
`The tempo names measures that belong to program leadership, not only to operations; Chapter 10 defines them. Detection coverage: share of the in-scope estate whose adapters report runtime findings, by drift class; drift on uncovered surfaces is invisible to the tempo, so the program is measuring less than it thinks. Window adherence: findings closed inside their response window divided by findings closed in the period, and separately the findings open past their window; a bad value means the tempo and the staffing don't match, or a class needs a machine actuator; the appendix puts it as the program generating drift in its own operations. Escalation rate: findings that reached a person divided by all findings, by class; either drift severity is rising, or the classifier needs tuning, or a class that should qualify for a machine doesn't yet. Machine-closure share: closures executed by a machine under an approval rather than by a person at a console; it should rise as actuators are added. Declared-exception count: open tasks with no machine actuator; it should fall, or manual work is becoming permanent. Targets are the agency's to set. Window adherence follows Book 12, Chapter 12's rule for vulnerability remediation: measure closures within the window and overdue items separately, because a ratio of open findings that aren't yet overdue improves every time new findings arrive. The board reviews all five on the cadence in Chapter 09. A tempo doesn't need round-the-clock staffing: low and medium findings close through approved plans and L4 classes, and critical findings halt and hold until a person responds. It does need the escalation roles to exist; a program without a steward has to designate one, because the tooling can't create authority.`,
  "Book 13, Appendix B, Severity and tempo (the measures); Chapter 10, What the tempo shows leadership.");
}

// ================================================================== 11 Evidence record
{
  const s = content(S2, "The evidence record: one shape for every lane");
  tag(s, "What");
  const b = table(s, "Record", 1.5, [2.0, 3.75, 3.3, 3.1], ["Field", "Machine lanes", "Declared exception", "Protocol-enforced"], [
    ["Origin", "Finding or request identifier", "Finding identifier", "Issuance policy identifier"],
    ["Owner and clock", "Task owner, response window, due time", "System owner, end date", "PKI owner"],
    ["Approval", "Approver and time, or the class acceptance and rule version", "Approver and time, before the session", "Policy version"],
    ["Executing identity", "Service identity, activation identifier", "The person, through the recorded session", "The protocol client's identity"],
    ["What ran", "Version-controlled artifact and its hash", "The session recording", "The issuance transaction"],
    ["Result", "Re-read post-state and time", "Re-read post-state and time", "Certificate in inventory"],
    ["Closure", "One record linking all of the above", "Same, plus the POA&M item", "Inventory entry"],
  ], { fontSize: 12.5 });
  callout(s, "Assessor", b + 0.2, 1.05, "FaClipboardCheck", HEX.navy, "What the assessor checks: ",
    "a prior approval, a version-controlled and access-restricted artifact, execution logged to the task, and a result that can be re-tested.", 14.5);
  sources(s, "Sources: Book 13, Appendix B (The evidence record): NIST SP 800-137, Executive Summary. Appendix A (control mapping); Chapter 07.");
  notes(s,
`Every lane writes the same record shape, so an assessor reads one format whatever the platform. Origin: finding or request identifier (machine lanes); finding identifier (declared exception); issuance policy identifier (protocol-enforced). Owner and clock: task owner, response window, due time; system owner and end date; PKI owner. Approval: approver and time, or the L4 class acceptance and rule version; approver and time, before the session; policy version. Executing identity: service identity and activation identifier; the person, through the recorded session; the protocol client's identity. What ran: version-controlled artifact and its hash; the session recording; the issuance transaction. Result: re-read post-state and time (both machine and exception lanes); certificate in inventory. Closure: one record linking all of the above; the same plus the POA&M item; inventory entry. What the assessor checks: the change traces to a prior approval, the artifact that ran is version-controlled and access-restricted, the execution is logged and attributable to the task, and the result is re-testable. The controls those properties evidence, CM-3, CM-5(1), CM-4(2) and AU-10 among them, are mapped in Appendix A; Chapter 07 covers how the record is protected and signed. NIST SP 800-137 is balanced on the point: organization-wide monitoring "cannot be efficiently achieved through manual processes alone or through automated processes alone," and where manual processes are used they must be repeatable and verifiable. The declared-exception lane exists to meet that test for the work machines can't yet do.`,
  "Book 13, Appendix B, The evidence record.");
}

// ================================================================== 12 Examples 1 and 2
{
  const s = content(S3, "Worked examples: a drifted setting and an access request");
  tag(s, "How");
  design(s, "ILLUSTRATIVE  ·  NAMES, IDENTIFIERS AND TIMES ARE INVENTED");
  panel(s, "Ex1", 0.6, 1.78, 6.0, 4.1, HEX.navy, HEX.navyTint, "EXAMPLE 1  ·  AUTONOMOUS CLASS", "A configuration setting drifts", [
    "Nightly run finds a sharing setting allowing anonymous links: deterministic, P3",
    "The authorizing official has accepted this class (one setting, one tenant) as autonomous",
    "Task FMP-DRIFT-0412 to the collaboration team, due in 24 hours",
    "The service identity restores the baseline through the tenant's interface",
    "A re-read confirms it; one record closes it. Without the class acceptance, step 4 waits for an approver",
    "A repeat links to the first: a question for the steward, not another silent fix",
  ], 13.5, true);
  panel(s, "Ex2", 6.75, 1.78, 6.0, 4.1, HEX.teal, HEX.tealTint, "EXAMPLE 2  ·  GATED, THROUGH THE FIVE CLAUSES", "An access request", [
    "A request for an admin role carries origin record REQ-2291: clause 1",
    "The approver named for the role approves, and isn't the requester: clause 2",
    "A one-hour role activates; the user's role is assigned eligible, not standing: clause 3",
    "A re-read finds the eligible assignment and its end date: clause 4",
    "One closure record flows into the evidence chain: clause 5",
    "Self-approval would have been refused, and the refusal would be the record",
  ], 13.5, true);
  sources(s, "Sources: Book 13, Appendix B (Worked examples: Example 1 and Example 2); Book 04, Ch 09 (access review cycle). Illustrative.");
  notes(s,
`All four examples are illustrative; names, identifiers and times are invented. Example 1, a configuration setting drifts. The nightly rule run compares a cloud tenant's sharing setting to the baseline in the authoritative record and finds it set to allow anonymous links. The rule is deterministic, the finding is P3, and in this example the authorizing official has accepted this class, restoring one named sharing setting on one tenant to its baseline, for L4. The governance platform raises task FMP-DRIFT-0412 against the tenant's configuration item, owner the collaboration platform team, due in 24 hours. Because the class is enumerated at L4, no per-instance approval is needed: the execution layer activates its service identity, calls the tenant's configuration interface to restore the baseline value, and records the artifact version that ran. It re-reads the setting and closes the task with one record: finding, baseline version, before and after values, run log and re-read time. Without the L4 acceptance, the execution step would wait for a named approver; nothing else would change. An assessor reads a CM-6 deviation detected and corrected, a CM-3 record of the change and a CA-7 monitoring result, all from one task. If the setting drifts again the next week, the second finding links to the first, and a pattern of repeats becomes a question for the record's steward. Example 2, an access request through gated actuation. A user requests an administrative role for a project; the request carries origin record REQ-2291 (clause 1 passes). The approver named for the role approves; clause 2 checks the approver isn't the requester. The execution layer activates a just-in-time role for its own identity, expiring in one hour, and assigns the user's role through the directory's interface as eligible for the project's duration, not standing (clause 3). It re-reads the assignments and finds the eligible assignment with its end date (clause 4). One closure record, with request, approval, activation, run log and re-read, flows into the evidence chain (clause 5). Had the requester tried to approve their own request, clause 2 would have refused and the refusal would be the record. Book 04, Chapter 09 covers the review cycle that later recertifies the grant.`,
  "Book 13, Appendix B, Worked examples (Examples 1 and 2).");
}

// ================================================================== 13 Examples 3 and 4
{
  const s = content(S3, "Worked examples: an unknown issuer and no actuator yet");
  tag(s, "How");
  design(s, "ILLUSTRATIVE  ·  NAMES, IDENTIFIERS AND TIMES ARE INVENTED");
  panel(s, "Ex3", 0.6, 1.78, 6.0, 3.3, HEX.amber, HEX.amberTint, "EXAMPLE 3  ·  HUMAN DECISION, THEN GATED", "An unknown-issuer certificate", [
    "Inventory finds a certificate from a CA not on the approved list; anomalies raise tickets, renewals don't",
    "Task FMP-PKI-0087 to the PKI owner, P2. No automatic fix: who depends on it is unknown",
    "The PKI owner decides: replace through the approved issuer, deny-list the rogue CA",
    "The gated lane runs it: the server's protocol client re-requests; a re-read confirms the chain",
  ], 13, true);
  panel(s, "Ex4", 6.75, 1.78, 6.0, 3.3, HEX.red, HEX.redTint, "EXAMPLE 4  ·  DECLARED EXCEPTION", "No actuator yet", [
    "A finding names a legacy appliance managed only through an interactive console",
    "The system owner approves: named engineer, two-hour window, recorded proxy session, daily config export as compensating control",
    "An end date and a POA&M item: build an actuator or retire the appliance",
    "The change is made in session; a re-read of the export closes the task, recording attached",
  ], 13, true);
  callout(s, "Visible", 5.3, 0.95, "FaUserShield", HEX.red, "Visible, approved first, temporary: ",
    "a silent console session for the same change would have produced none of that.", 15);
  sources(s, "Sources: Book 13, Appendix B (Worked examples: Example 3 and Example 4); Chapter 10 (When no machine can reach the surface). Illustrative.");
  notes(s,
`Example 3, an unknown-issuer certificate. The certificate inventory finds a certificate on an internal web server issued by a CA that isn't in the approved list; routine issuance never raises a ticket, an anomaly does. The finding becomes task FMP-PKI-0087, owner the PKI owner, severity P2. No automatic fix applies, because replacing a certificate without knowing who depends on it can break a service. The PKI owner decides to replace the certificate through the approved issuer and to add the rogue CA to the trust-store deny list; the decision is recorded. The replacement runs in the gated lane: the protocol client on the server requests a new certificate from the approved issuer, and the platform re-reads the endpoint to confirm the new chain. Example 4, no actuator yet. A drift finding names a legacy network appliance whose only management surface is an interactive console. The system owner approves a declared exception: a named engineer, a two-hour window, access through the privileged access proxy with session recording, and a compensating control of daily configuration export and comparison. The exception carries an end date and a POA&M item for building an actuator or retiring the appliance. The engineer makes the change inside the recorded session; the platform re-reads the appliance's exported configuration and closes the task with the recording attached. The exception is visible, approved before the work, and temporary. Chapter 10's sequence for this path: the task is raised like any other; it is marked as having no machine actuator, itself recorded as an exception in the register; a named approver approves target, change, time box and operator before the session starts; the operator activates an eligible role and connects through a recording proxy; the session closes when the time box ends; the re-read verifies and the recording is attached. SP 800-53 AU-14 provides for session auditing, developed with legal counsel, since recordings capture whatever is on screen. A class that stays manual for good is a standing risk acceptance for the authorizing official.`,
  "Book 13, Appendix B, Worked examples (Examples 3 and 4); Chapter 10, When no machine can reach the surface.");
}

// ================================================================== 14 Certificate exception
{
  const s = content(S3, "The certificate exception: volume rules out a ticket");
  tag(s, "What");
  facts(s, "Certs", 1.5, 1.35, [
    ["398 → 47 days", HEX.red, HEX.redTint, "Maximum public TLS validity, in steps from March 2026 to March 2029"],
    ["ACME", HEX.navy, HEX.navyTint, "Automates issuance once a client proves control of a name, with no person in the loop"],
    ["CAA records", HEX.teal, HEX.tealTint, "A domain holder names the CAs allowed to issue, so part of the policy lives in DNS"],
    ["Short-lived", HEX.amber, HEX.amberTint, "Expiry, not revocation, becomes the normal end of a certificate's life"],
  ], 12.5);
  panel(s, "Routine", 0.6, 3.05, 6.0, 2.15, HEX.teal, "FFFFFF", "ROUTINE ISSUANCE AND RENEWAL", "Protocol-enforced, engine-driven", [
    "Intune profiles, AD CS autoenrollment and the CLM platform's drivers renew most certificates",
    "ACME only where the endpoint supports it; no ticket per event",
  ], 13);
  panel(s, "Anomaly", 6.75, 3.05, 6.0, 2.15, HEX.red, "FFFFFF", "ANOMALIES STILL USE THE FRONT DOOR", "Rare, consequential, need a human", [
    "A new issuing CA, a non-standard lifetime, a trust-anchor change",
    "An unknown-issuer certificate, or issuance blocked by a CAA record",
  ], 13);
  callout(s, "Rubber stamp", 5.38, 1.0, "FaTriangleExclamation", HEX.amber, "Why not ticket every renewal? ",
    "It wouldn't add rigor; it would train approvers to approve without reading.", 15);
  sources(s, "Sources: Book 13, App B (The certificate exception; Certificates and the CLM platform): CA/B Forum SC-081v3; RFC 8555; RFC 8659. Book 07, Ch 08.");
  notes(s,
`Certificates are a large share of operational work, so it's tempting to route them through the same front door. The program doesn't for routine lifecycle events, and the reason is volume. A configuration-drift finding is occasional and each one deserves a decision; a certificate estate with short validity periods generates renewals continuously. Publicly trusted TLS certificates are moving from a maximum of 398 days to 47 days in steps from March 2026 to March 2029 (CA/Browser Forum Ballot SC-081v3, April 2025). Routing every renewal through an approval ticket wouldn't add rigor; it would train approvers to approve without reading. So routine issuance is protocol-enforced and engine-driven. ACME (RFC 8555) automates issuance once a client proves control of a name, with no person in the loop. CAA records (RFC 8659) let a domain holder name the CAs allowed to issue for it, which puts part of the issuance policy in DNS where machines check it. Short-lived certificates make expiry, not revocation, the normal end of a certificate's life. "Protocol-enforced" means engine-driven: Intune profiles, AD CS autoenrollment and the CLM platform's drivers renew most certificates, and ACME automates issuance only where the endpoint supports it. Book 07 makes CyberArk Certificate Manager, Self-Hosted the system of record for every certificate Intune and the PIV system don't manage; it renews routine server and public TLS, its network discovery finds unknown-issuer and out-of-policy certificates, and it only watches domain controller certificates renewed by AD CS autoenrollment. The anomalies (a new issuing CA, a non-standard lifetime, a trust-anchor change, an unknown-issuer certificate found in inventory, a blocked issuance attempt against a CAA record) still come through the front door, because they are rare, consequential and need a human. Book 07, Chapter 08 covers the lifecycle and tooling. Vendor capabilities change by release; confirm current behavior before relying on it.`,
  "Book 13, Appendix B, The certificate exception; Certificates in this book and the CLM platform.");
}

// ================================================================== 15 One front door
{
  const s = content(S3, "One front door for detection tools");
  tag(s, "How");
  const src = [
    "Native cloud posture engines",
    "Vulnerability scanners",
    "Cloud entitlement-management tools",
    "Certificate inventories",
    "Identity governance front end (requests, recertifications)",
  ];
  const bh = 0.62, gap = 0.12, top = 1.55;
  src.forEach((t, i) => {
    const y = top + i * (bh + gap);
    box(s, `Source ${i + 1}`, 0.6, y, 3.5, bh, i === 4 ? HEX.tealTint : HEX.navyTint);
    txt(s, `Source ${i + 1} text`, t, { x: 0.72, y, w: 3.26, h: bh, fontSize: 12.5, bold: true, color: i === 4 ? HEX.teal : HEX.navy, valign: "middle" });
    s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `Feed arrow ${i + 1}`, x: 4.2, y: y + bh / 2 - 0.11, w: 0.3, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
  const colH = src.length * bh + (src.length - 1) * gap;
  box(s, "Front door", 4.6, top, 3.3, colH, HEX.amberTint, HEX.amber);
  T(s, "Front door text", [
    { text: "One coordination layer", options: { bold: true, color: HEX.amber, fontSize: 16, fontFace: "Cambria", breakLine: true } },
    { text: "The same queue and the same five clauses for every source", options: { bullet: true, breakLine: true } },
    { text: "Correlated to the same request identifiers", options: { bullet: true, breakLine: true } },
    { text: "Closure written back from the record", options: { bullet: true } },
  ], { x: 4.75, y: top + 0.15, w: 3.0, h: colH - 0.3, fontSize: 13, paraSpaceAfter: 4, valign: "middle" });
  const ph = (colH - 0.15) / 2;
  panel(s, "Coverage", 8.05, top, 4.7, ph, HEX.red, "FFFFFF", "CAUTION 1", "Check actual platform coverage", [
    "On-premises virtualization was the gap that recurred across tool categories; treat it as open",
  ], 12.5);
  panel(s, "Alternatives", 8.05, top + ph + 0.15, 4.7, ph, HEX.navy, "FFFFFF", "CAUTION 2", "Alternatives don't change the rule", [
    "A multi-cloud posture engine, or a platform that builds the package: do a build-or-buy look first",
  ], 12.5);
  callout(s, "Rule", top + colH + 0.2, 0.95, "FaDoorOpen", HEX.amber, "Each tool is a detection engine, ",
    "not a second coordination layer of its own. Detection engines feed the front door; they don't each grow a queue.", 15);
  sources(s, "Sources: Book 13, Appendix B (One front door for detection tools); Chapter 10 (How the service desk fits); Book 10, Ch 07 (the front door).");
  notes(s,
`Many tools detect: native cloud posture engines, vulnerability scanners, entitlement-management tools for cloud identity, certificate inventories. The program's rule is that each is a detection engine feeding the one coordination layer, not a second coordination layer of its own. An entitlement tool that finds over-privileged cloud roles raises tasks in the same queue, under the same five clauses, as a posture engine that finds an open storage account. Access requests and recertifications can come from an identity governance front end; they land in the same record, correlated to the same request identifiers, with closure written back. Two cautions. First, check each detection tool's actual platform coverage before counting on it; in the program's own research, coverage of on-premises virtualization platforms was the gap that recurred across tool categories, and it should be treated as open until a vendor's current documentation shows otherwise. Second, a reviewer will raise alternative architectures: a single multi-cloud posture engine in place of several native ones, or a compliance platform that generates the authorization package directly from machine-readable evidence. Neither changes the one-front-door rule, and both deserve a build-or-buy look before custom investment. Chapter 10, How the service desk fits: the IT service management platform is the front door, not a second governance system; routing follows authority (Book 04, Chapter 06); the help desk executes against approved, assigned tickets and doesn't decide; the help desk is protected as a target, with the reset verification procedure a CISO decision; and the ticket closes when the execution layer's re-read and the next drift run agree. The ticket's status is a view of the record, not a substitute for it.`,
  "Book 13, Appendix B, One front door for detection tools; Chapter 10, How the service desk fits.");
}

// ================================================================== 16 Failure modes
{
  const s = content(S3, "Failure modes from a reference implementation review");
  tag(s, "Why");
  const b = table(s, "Failures", 1.5, [2.4, 4.75, 5.0], ["Failure mode", "What went wrong", "The fix, as a design rule"], [
    ["Origin not enforced", "Request identifiers were accepted without resolving, so a caller with no lineage record could invoke the chain", "Clause 1 resolves the origin or refuses; a negative test proves the refusal"],
    ["Command injection", "Parameter names were rendered unescaped into a script for the on-premises directory", "Never build commands by string; escape or allow-list every name and value"],
    ["Target substitution", "Caller input merged over defaults could override the intended target", "Fix the target from the authorized record; caller input can't override it"],
    ["Cleartext secret in a queue", "A password crossed a work queue in plain text", "Secrets never travel in task payloads; use a vault reference"],
    ["No post-state re-read", "One leg treated a successful dispatch as closure", "Clause 4 re-reads on every leg; a success code is not evidence"],
    ["Test mode skipped the risky path", "Every test short-circuited before the vulnerable code", "Test mode refuses on production; negative tests run the real path with hostile input"],
  ], { fontSize: 12 });
  callout(s, "Starting point", b + 0.18, 1.0, "FaShieldHalved", HEX.navy, "Tests prove only what they test: ",
    "negative tests and build-time gates prove specific refusals and mappings. The reference build is a starting point, not evidence.", 14.5);
  sources(s, "Sources: Book 13, Appendix B (Failure modes found in a reference implementation review).");
  notes(s,
`The program built a reference implementation of the five-clause chain on an IT service management platform, covering an identity-lifecycle domain with both a cloud directory leg and an on-premises directory leg. An adversarial security review of the on-premises leg found defects that were then fixed; each is a way the pattern fails while looking correct. Origin not enforced: the chain accepted request identifiers without resolving them, so a caller with no lineage record could invoke it; fix: clause 1 resolves the origin or refuses, and a negative test proves the refusal. Command injection: parameter names were rendered unescaped into a script for the on-premises directory; fix: never build commands by string, escape or allow-list every name and value. Target substitution: a merge of caller input over defaults let input override the intended target; fix: the target comes from the authorized record and caller input can't override it. Cleartext secret in a queue: a password crossed a work queue in plain text; fix: secrets never travel in task payloads, use a vault reference. No post-state re-read: one leg treated a successful dispatch as closure; fix: clause 4 re-reads on every leg, a success code is not evidence. Test mode skipped the risky path: every test ran in a mode that short-circuited before the vulnerable code; fix: test mode refuses on production, and negative tests run the real path with hostile input. The review supports two kinds of automated check. Negative tests prove the chain refuses what it must: self-approval, standing privilege, an unreconciled target, a missing origin and hostile parameter names. Build-time gates fail a build when a catalog item claims autonomous write without a recorded decision behind it, or when a control map names an actuator method that doesn't exist. Neither proves the code does everything the appendix describes; they prove the specific refusals and mappings they test. The reference implementation is a starting point to build and test from, not evidence that any agency's instance runs it.`,
  "Book 13, Appendix B, Failure modes found in a reference implementation review.");
}

// ================================================================== 17 Close
{
  const s = content(S4, "What to decide, and where to read next");
  tag(s, "Who");
  panel(s, "Decide", 0.6, 1.5, 6.0, 3.6, HEX.navy, HEX.navyTint, "DECISIONS THE REFERENCE LEAVES TO THE AGENCY", "What to decide", [
    "Which classes the authorizing official accepts as autonomous, with scope, exclusions and review rate",
    "Who the escalation roles are: steward, workstream leads, the CISO's representative",
    "The class-to-lane assignment in the agency's own record, changed only by review",
    "Targets for the five leadership measures, reviewed by the board",
    "An end date for every declared exception: an actuator, or retirement",
  ], 13);
  table(s, "Next", 1.5, [2.45, 3.6], ["Read next", "For"], [
    ["Book 13, Chapter 10", "The argument: tempo, the six tests, approval gates"],
    ["Book 13, Chapter 06", "The drift engine and severity"],
    ["Book 13, Chapter 07", "Protecting and signing the evidence record"],
    ["Book 13, Appendix A", "The control-by-control mapping"],
    ["Book 01, Chapter 11", "The actuation ladder and the permanent-gated list"],
    ["Book 07, Chapter 08", "The certificate lifecycle and tooling"],
  ], { x: 6.75, fontSize: 12.5 });
  callout(s, "Epigraph", 5.35, 1.0, "FaClipboardCheck", HEX.teal, "The test for every ticket: ",
    "it is evidence only when it authorized something that then ran, and a re-read proved the result.", 15);
  sources(s, "Sources: Book 13, Appendix B and Chapter 10 (Approval gates; What the tempo shows leadership; Honest limits); Chapter 09 (who governs).");
  notes(s,
`Decisions the reference leaves to the agency. Which classes, if any, the authorizing official accepts for L4 autonomous closure, in advance and in writing, with scope limits, exclusions, verification, after-the-fact review rate and the conditions that drop the class back to L3; Chapter 09 gives that decision to the authorizing official and the governance board reviews every L4 class quarterly. Who holds the escalation roles: a program without a named steward, workstream leads and a CISO's representative on the board has to name them first; the platform can't manufacture authority. The class-to-lane assignment: Appendix B's table is a starting assignment, tuned in the agency's own authoritative record, and a class moves only by a reviewed change to that record. Targets for the five leadership measures (detection coverage, window adherence, escalation rate, machine-closure share, declared-exception count) are the agency's to set; the board reviews all five. And every declared exception carries an end date, whose end is either a machine actuator for the surface or the surface's retirement; a class that stays manual for good is a standing risk acceptance for the authorizing official. Where to read next: Chapter 10 for the argument; Chapter 06 for the drift engine; Chapter 07 for the evidence record's protection and signing; Appendix A for the control mapping; Book 01, Chapter 11 for the actuation ladder; Book 07, Chapter 08 for certificates.`,
  "Book 13, Chapter 10 (Approval gates; What the tempo shows leadership; Honest limits); Appendix B.");
}

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slide after this one is reference material and is not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  sources(s, "Sources: full list on the following slide.");
}
{
  const s = content("Backup", "Sources behind this reference");
  T(s, "Source list", bullets([
    "Book 13, Appendix B — Ticket-to-Machine Reference: every section; Chapter 10 — Operational Tempo: Ticket to Machine, Not Ticket to Human.",
    "OMB M-24-15, Modernizing FedRAMP (July 25, 2024), §VI. FedRAMP Consolidated Rules for 2026: Significant Change Notification (SCN-CSO-EVA, -MAR, -EMG, SCN-RTR-NNR) and Key Security Indicators (KSI-CMT-RMV).",
    "CISA BOD 26-04, Prioritizing Security Updates Based on Risk (June 10, 2026); CISA Federal Incident Notification Guidelines.",
    "NIST SP 800-137 (ISCM, September 2011); SP 800-53 Rev. 5 (AC-5, AU-14, CM-3, CM-6, SI-2) and SP 800-53B baselines; SP 800-37 Rev. 2, Task M-1.",
    "CA/Browser Forum Ballot SC-081v3 (April 11, 2025); RFC 8555 (ACME); RFC 8659 (CAA). CyberArk Certificate Manager 26.1 documentation (ACME; discovery).",
    "Diagrams: Book 13, Chapter 10 figures (ticket to machine; tempo paths). Full footnotes with links and access dates (October 21–23, 2026) are in the appendix and chapter.",
  ], 13), { x: 0.6, y: 1.5, w: 12.1, h: 3.6, paraSpaceAfter: 6, fontSize: 13 });
  sources(s, "Sources: as listed. Lanes, ceilings, severities and windows are program design; worked examples are illustrative; confirm vendor behavior.");
}

// ------------------------------------------------------------------ report
const narrated = per.reduce((a, p) => a + p.n, 0);
per.forEach((p) => console.log(`  ${String(p.slide).padStart(2)}  ${String(p.n).padStart(3)}  ${p.title}`));
console.log(`slides: ${pres.slides.length}; narrated: ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
const unused = Object.keys(NARR).filter((t) => !used.has(t));
if (unused.length) throw new Error("narration with no slide: " + unused.join(" | "));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
