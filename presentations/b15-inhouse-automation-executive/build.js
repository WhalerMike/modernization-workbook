// Building Day-Two Automation In-House — a ~9-minute single-topic EXECUTIVE briefing for Book 15.
// For a branch chief deciding whether to let staff build the day-two compliance application on the
// ServiceNow instance the agency already owns: the problem, why the funded options are closed, the no-cost
// path, AI-assisted development with guardrails, sandbox to production with two gates, the standards behind
// it, who does what, the evidence, the honest limits, and the ask (a small pilot in a developer instance).
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B15_InHouse_Automation_Executive.pptx
// Reuses the shared kit in ../_build/ and the helpers of ../b09-sdwan-executive/build.js.
// Every fact comes from a footnoted chapter: Book 15 Ch 13, with Ch 03, 10 and 11, Book 13 Ch 10 and
// Book 04 Ch 09. The pilot's scope, owner and next gate are labeled design guidance. Agency-neutral.
const path = require("path");
const fs = require("fs");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Book 15", title: "Building Day-Two Automation In-House",
  footer: "Book 15  ·  Federal Modernization Workbook  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "B15_InHouse_Automation_Executive.pptx";

// ------------------------------------------------------------------ helpers (as in ../start-here/build.js)
const NARR = require("./narration.js");
const used = new Set();
const WPM = 160;
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
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${say.trim()}\n\nDetail: ${body.trim()}\n\nSources: ${ref}`);
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
  if (text.length > 185) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return txt(s, "Sources", text, { x: 0.6, y, w: 11.6, h: 0.32, fontSize: 10, italic: true, color: HEX.slate });
};

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
  return txt(s, name, t, o);
};

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
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`slide ${pres.slides.length} ${name} table`, bottom);
  return bottom;
};

const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 15, fontFace: "Cambria", breakLine: true } });
  if (runs.length) txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.7 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.34 : 0) + (runs.length ? 0.08 : 0);
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 3 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.05, 0);
  if (need > y + h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  warn(`slide ${pres.slides.length} ${name} panel`, y + h);
};

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

// A callout whose text is checked for fit (the kit's callout sets 16.5 pt in a 10.65 in box).
const note = (s, name, y, h, iconName, color, lead, text) => {
  const need = lines(lead + text, 10.65, 16.5) * 16.5 / 72 * 1.2 + 0.1;
  if (need > h + 0.02) console.warn(`  ! slide ${pres.slides.length} ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  warn(`slide ${pres.slides.length} ${name} callout`, y + h);
  callout(s, name, y, h, iconName, color, lead, text);
};
const SUB = "Executive briefing  ·  Book 15 — Compliance Automation & Day-2 Operations";
const CH = "Book 15, Ch 13";

// ================================================================== 1 Title
{
  const s = titleSlide("The case", "Building Day-Two Automation In-House", SUB);
  txt(s, "Session map", [
    { text: "NO NEW MONEY, NO SHORTCUTS  ·  ABOUT 9 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "The problem  ·  Why buying is off the table  ·  What we can build  ·  AI with guardrails", options: { color: HEX.ink, breakLine: true } },
    { text: "Sandbox to production  ·  Who does what  ·  The evidence  ·  Limits  ·  The decision", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Book 15, Ch 13 (Building Day-Two Automation In-House), with Ch 10 and 11. Facts as of October 2026.", 6.08);
  notes(s,
`A single-topic executive briefing drawn from Book 15 Chapter 13. Audience: a branch chief (or any manager) deciding whether to let existing staff build the day-two compliance application on the ServiceNow instance the agency already owns, when there is no funding for the platform's compliance modules or a commercial identity-governance product. The chapter is program design except where it cites a source; every external fact on these slides is footnoted in the chapter. The workbook is independent analysis, not an official publication of any agency; it names ServiceNow and SailPoint only because they are the platforms its examples use, and endorses neither.`,
  "Book 15, Chapter 13 (introduction).");
}

// ================================================================== 2 The problem
{
  const s = content("The case", "The problem: procedures that leave no evidence");
  tag(s, "Why");
  panel(s, "Today", 0.6, 1.5, 5.9, 3.1, HEX.red, HEX.redTint, "TODAY", "Done, but not provable", [
    "Requests arrive by email or chat and never become a ticket",
    "Approval, if any, sits in an inbox",
    "A closed ticket says someone did some work",
    "Nobody re-checks that the fix held",
  ], 14);
  panel(s, "Needed", 6.85, 1.5, 5.9, 3.1, HEX.teal, HEX.tealTint, "WHAT AN ASSESSOR ASKS", "Owner, clock, approval, result", [
    "Who asked, and who approved it?",
    "When was it done, and by whom?",
    "Did a fresh read show the condition gone?",
    "Can someone other than the actor check it?",
  ], 14);
  note(s, "Gap", 4.85, 1.45, "FaTriangleExclamation", HEX.amber, "The gap: ",
    "a closed ticket proves somebody did some work; an assessed control proves the work held. Only the second goes in front of an authorizing official.");
  sources(s, "Sources: Book 15, Ch 03 (one front door), Ch 10 (requests handled outside the front door), Ch 11 (opening thesis); Book 13, Ch 10 (ticket to machine).");
  notes(s,
`Book 15 Chapter 03 sets one front door: email may start intake, but it never approves, verifies a person or closes a record. Chapter 10 lists "requests handled outside the front door: email or chat work that never became a ticket" as a measure the service desk manager watches. Chapter 11's thesis: "A closed ticket proves that someone did some work; an assessed control proves that the work held, and only the second one belongs in front of an authorizing official." Book 13 Chapter 10's evidence model for every routine change is an owner, a clock, an approval and a re-test result that someone other than the actor can check; native consoles change state but don't hold that record. The slide describes a common pattern generically; it makes no claim about any particular agency.`,
  "Book 15, Chapters 03, 10 and 11; Book 13, Chapter 10.");
}

// ================================================================== 3 Funding
{
  const s = content("The case", "Why the funded options are off the table");
  tag(s, "Why");
  table(s, "Options", 1.5, [3.6, 4.4, 4.15], ["Option", "What it gives", "Why it's closed here"], [
    ["ServiceNow Policy and Compliance Management", "Control records, scheduled tests, issues", "A separate subscription, requiring activation"],
    ["ServiceNow Continuous Authorization and Monitoring", "RMF workflow, POA&M view, OSCAL export", "A separate subscription"],
    ["A commercial identity-governance product", "Certification campaigns, connectors, role discovery", "A further product purchase"],
    ["Microsoft Entra ID Governance features", "Access reviews, lifecycle workflows", "Needs Entra ID Governance licensing"],
  ], { fontSize: 13 });
  note(s, "Choice", 4.85, 1.45, "FaRoute", HEX.navy, "Two choices: ",
    "leave the day-two design on paper, or build the essential joins on the instance the agency already pays for.");
  sources(s, "Sources: Book 15, Ch 13 (What the native route costs) and Ch 11 (What ServiceNow already provides); Book 04, Ch 09 (Licensing). ServiceNow documentation.");
  notes(s,
`Chapter 11 recommends buying ServiceNow's native applications first and building only what they lack. Chapter 13 notes the cost of that route. ServiceNow's documentation (Zurich release) says the Policy and Compliance Management plugin, com.sn_compliance, "is available as a separate subscription and requires activation," and that the Continuous Authorization and Monitoring plugin, com.sn_irm_cont_auth_monitor, "is available as a separate subscription." A commercial identity-governance product such as SailPoint Identity Security Cloud is a further purchase. Microsoft's access reviews and lifecycle workflows need Entra ID Governance licensing (Book 04 Chapter 09). No prices are given because none were verified from a primary source.`,
  "Book 15, Chapters 11 and 13; Book 04, Chapter 09.");
}

// ================================================================== 4 The no-cost path
{
  const s = content("What we build", "The no-cost path on the instance we already own");
  tag(s, "What");
  panel(s, "Build", 0.6, 1.5, 5.9, 3.55, HEX.navy, HEX.navyTint, "WHAT STAFF CAN BUILD", "A scoped application, nothing larger", [
    "Its own records for findings, tests and POA&M items",
    "Match each finding to the right CMDB asset",
    "Close work only when a re-read proves the fix",
    "Load the control map as data, and check it",
    "Read-only identity drift checks, no IGA product",
  ], 13.5);
  panel(s, "Not", 6.85, 1.5, 5.9, 3.55, HEX.red, HEX.redTint, "WHAT IT DOESN'T REPLACE", "Say so in writing, up front", [
    "Certification campaigns at scale",
    "A vendor-maintained connector library",
    "Machine-learning role discovery",
    "A separation-of-duties policy engine",
    "Vendor support and the vendor's own authorization",
  ], 13.5);
  note(s, "Sister", 5.25, 1.25, "FaPeopleArrows", HEX.teal, "A sister team: ",
    "an infrastructure team that already writes its own ServiceNow scripts lends conventions, a test instance and reviewers.");
  sources(s, "Sources: Book 15, Ch 13 (What staff can build; What it doesn't replace; A sister team as the model); Ch 11 (The compliance application). SailPoint docs.");
  notes(s,
`Chapter 13: the build is Chapter 11's scoped application, using platform features that come with the instance (tables, server-side scripts, outbound REST messages, Flow Designer, the MID Server, the Automated Test Framework and update sets) rather than the separately licensed modules. It contains: custom tables extending Task for findings, control tests and POA&M items; ingest, reconcile and gate scripts; the control map as data, checked in continuous integration; scheduled control tests and an export in the evidence pipeline's shape; and the read-only HR-to-Graph drift reconciliation and re-read-before-close rule from the workbook's ServiceNow and SailPoint example, which write nothing into Entra ID. What it doesn't replace (program assessment): SailPoint's certifications, where "designated people, such as managers or system owners," review users' access; its role discovery, which uses "a patented network graph analysis"; connector libraries; a separation-of-duties engine; vendor support and authorization. Limits: it covers the agency's own day-two loop, depends on its authors (so document it and keep a second maintainer), and must be retested on every platform upgrade. The sister-team model is program design, described generically: neither team approves its own changes.`,
  "Book 15, Chapter 13 (The no-cost path) and Chapter 11 (The compliance application, if you build one).");
}

// ================================================================== 5 AI guardrails
{
  const s = content("What we build", "AI-assisted development, with guardrails");
  tag(s, "What");
  table(s, "Rules", 1.5, [0.5, 4.3, 7.35], ["#", "Rule", "Why"], [
    ["1", "Approved assistants only", "Used under the agency's generative AI policy (OMB M-25-21, §3(b)(iv))"],
    ["2", "A named person reviews every line", "NIST SP 800-218A evaluates AI-generated and human-written code alike"],
    ["3", "No production data, credentials or secrets in a prompt", "Synthetic fixtures and placeholder names only"],
    ["4", "No secrets in the code either", "Credentials come from the platform's credential aliases"],
    ["5", "Check every platform API against vendor docs", "Assistants invent plausible methods and table names"],
    ["6", "Treat suggested libraries as acquisitions", "SSDF PW.4.4: verify third-party components"],
    ["7", "Record which tool drafted the change", "Answers the Chief AI Officer; shows if AI drafts fail more"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: Book 15, Ch 13 (AI-assisted development with guardrails). OMB M-25-21 (April 3, 2025); NIST SP 800-218 and SP 800-218A.");
  notes(s,
`OMB M-25-21, Accelerating Federal Use of AI through Innovation, Governance, and Public Trust, April 3, 2025, rescinds and replaces M-24-10 and is the current OMB memo on agency AI use as of October 2026. Section 3(b)(iv): within 270 days agencies "should develop a policy that sets the terms for acceptable use of generative AI for their missions and establishes adequate safeguards and oversight mechanisms." Section 3(a)(i): each agency designates a Chief AI Officer who promotes AI adoption "through a governance and oversight process" and maintains the AI use case inventory; Section 3(b)(v): inventories at least annually. Section 4(a): AI is high-impact "when its output serves as a principal basis for decisions or actions that have a legal, material, binding, or significant effect on rights or safety." The program's reading, which the Chief AI Officer decides, is that a coding assistant whose every line is reviewed isn't that principal basis. NIST SP 800-218A (July 2024): its practices "do not distinguish between human-written and AI-generated source code, because it is assumed that all source code should be evaluated for vulnerabilities and other issues before use." SSDF task PW.4.4: verify that acquired third-party components "comply with the requirements, as defined by the organization." M-26-05 (January 23, 2026) rescinded M-22-18 and M-23-16 and names SP 800-218 as a reference, so the SSDF is adopted by agency policy rather than attested. The seven rules are program design.`,
  "Book 15, Chapter 13 (The policy the agency's tools sit under; The rules).");
}

// ================================================================== 6 Sandbox to production
{
  const s = content("How it moves", "Sandbox to production, with two gates");
  tag(s, "How");
  img(s, "b15-day2-operations/ch13-sandbox-to-production", "A vertical chain: a developer sandbox (a Personal Developer Instance or agency sandbox, synthetic data only, where AI-drafted code starts) leads to gate 1, code review by a named reviewer who is never the author; then sub-production, where the update set is committed from source control and the Automated Test Framework suites run with results attached; then gate 2, change approval, where the change advisory board authorizes the change record under CM-3; then production, where an implementer who isn't the author commits the approved update set. A dashed arrow leads to the evidence of the path: the review record, test results and change record join the ticket's evidence. A dashed arrow labeled defect, fix in a new update set, runs from sub-production back to the sandbox.", 0.6, 1.45, 4.2, 5.05);
  const eb = table(s, "Envs", 1.5, [2.15, 6.0], ["Environment", "What may be in it, and what happens"], [
    ["Developer sandbox", "Synthetic data only; a PDI belongs to ServiceNow, outside the boundary. Drafting starts here"],
    ["Sub-production", "Agency test instance. Update set from source control; full ATF suites run"],
    ["Production", "Only the approved update set, committed by someone other than the author"],
  ], { x: 4.6, fontSize: 12.5 });
  panel(s, "Rules", 4.6, eb + 0.25, 8.15, 6.45 - eb - 0.25, HEX.amber, HEX.amberTint, "PLATFORM RULES", "What ServiceNow's own guidance says", [
    "Source control manages apps on non-production instances only",
    "Update sets move dev to test to production, never from two sources",
    "ATF tests run only on development and test instances",
    "Set the completed update set on production to Ignore",
  ], 13.5);
  sources(s, "Sources: Book 15, Ch 13 (Three environments; Source control, update sets and tests; The gates). ServiceNow documentation (PDI, source control, update sets, ATF).");
  notes(s,
`ServiceNow documentation: the developer program is free, and PDIs "cannot be clone targets or clone sources for customer or partner instances" because they belong to ServiceNow, so the program allows only synthetic data in one. ServiceNow's developer blog (July 10, 2026): a PDI 90 days or older with no explicit login in the past 10 days is eligible for reclamation; export update sets and connect scoped apps to source control. Source control integration lets developers "save and manage multiple versions of a global or scoped application from a non-production instance" and "does not support managing applications on a production instance." Update sets: "Move update sets from dev to test and then from test to production"; "Never migrate the same update set from multiple sources"; set the completed update set on production to Ignore. ATF: the execution property is disabled by default "to prevent you from accidentally running them on a production system"; "Run tests only on development, test, and other non-production instances." Gate 1: a named reviewer reads the whole change against the secure coding standard and records findings (SSDF PW.7.1, PW.7.2). Gate 2: a normal change with a security impact analysis and ATF results, authorized by the change advisory board; changes to approval rules, routing or integration permissions are never standard changes (Chapter 10). Defects are fixed in the sandbox in a new update set, never patched in place.`,
  "Book 15, Chapter 13 (Sandbox to production under a standard SDLC).");
}

// ================================================================== 7 Standards
{
  const s = content("How it moves", "What the standards ask, and how the path meets it");
  tag(s, "How");
  table(s, "Controls", 1.5, [3.9, 5.15, 3.1], ["Requirement", "How the path meets it", "Baseline"], [
    ["CM-3 Configuration change control", "Change record, impact analysis, CAB decision", "Moderate, High"],
    ["CM-3(2) Test before finalizing", "ATF suites in sub-production, results attached", "Moderate, High"],
    ["CM-4 Impact analyses", "Security impact analysis on the change", "Low, Moderate, High"],
    ["CM-5 Access restrictions for change", "Authors can't commit to production", "Low, Moderate, High"],
    ["AC-5 Separation of duties", "Author, reviewer, approver are different people", "Moderate, High"],
    ["SA-10, SA-11, SA-15 Developer controls", "Source control, testing evidence, a written process", "Moderate, High"],
    ["SSDF PO.5, PS.1, PW.7, PW.8", "Separate environments, protected code, review, testing", "NIST SP 800-218"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: Book 15, Ch 13 (The controls behind the path; The SSDF and its generative-AI profile). NIST SP 800-53 Rev. 5 (5.2.0), SP 800-53B, SP 800-218.");
  notes(s,
`Control text from the SP 800-53 Rev. 5 release 5.2.0 catalog; baselines from the SP 800-53B profiles. CM-3: review proposed changes and approve or disapprove them "with explicit consideration for security and privacy impact analyses," document decisions, implement only approved changes, retain records. CM-3(2): "Test, validate, and document changes to the system before finalizing the implementation of the changes." CM-4 and CM-5 are in all three baselines; AC-5, CM-3, CM-3(2), SA-10, SA-11 and SA-15 are in Moderate and High; CM-4(1), separate test environments, is High only and the program adopts it as design. SA-11 asks the developer to "produce evidence of the execution of the assessment plan and the results of the testing and evaluation." SA-10, SA-11 and SA-15 are written for "the developer"; when agency staff build the application the program reads the agency as the developer. SSDF Version 1.1 (SP 800-218, February 2022) is the current final version; SP 800-218 Rev. 1 (Version 1.2) was released as a draft on December 17, 2025 and was still a draft in October 2026. SP 800-218A (July 2024) is the generative-AI community profile; its scope is AI model development, and an agency using an approved assistant is in its "AI system acquirers" audience. Its considerations include human-in-the-loop review of security checks (PO.4) and keeping an AI model out of a critical security decision path without a human (PW.1).`,
  "Book 15, Chapter 13 (The controls behind the path; The SSDF and its generative-AI profile).");
}

// ================================================================== 8 Who
{
  const s = content("Who does it", "Who writes, reviews, approves and operates");
  tag(s, "Who");
  const b = table(s, "Roles", 1.5, [5.0, 3.0, 4.15], ["Decision or work", "Decides", "Does the work"], [
    ["Which AI coding assistants are approved", "Chief AI Officer", "CISO, ISSO, platform team consulted"],
    ["Secure coding standard and the AI rules", "CISO", "ITSM platform team"],
    ["Write and unit-test a change", "—", "Developers (agency staff)"],
    ["Code review of every line (gate 1)", "Reviewer, never the author", "Reviewer"],
    ["Move to production (gate 2)", "Change advisory board", "Implementer, not the author"],
    ["Operate the application", "System owner", "ITSM platform team"],
  ], { fontSize: 12.5 });
  note(s, "Train", b + 0.3, 1.25, "FaUsersGear", HEX.teal, "Train who we have: ",
    "free developer sandbox, our rules before real code, pairing with the sister team, listed reviewers, two maintainers per component.");
  sources(s, "Sources: Book 15, Ch 13 (Who writes, reviews, approves and operates; Training existing staff), extending Ch 10's matrix. OMB M-25-21 §2(e)(i).");
  notes(s,
`Chapter 13 adds rows to Chapter 10's responsibility matrix (program design). Approved AI assistants: the Chief AI Officer decides, because M-25-21 makes that office responsible for the agency's AI governance and oversight process and its use case inventory. Secure coding standard and AI rules: the CISO decides; the ITSM platform team writes it. Design of a new integration, identity or table: the system owner decides. Code review: the reviewer decides, not the developer's supervisor, who is the person most likely to wave a change through under schedule pressure. Change authorization: the change advisory board. Production commit: an implementer, not the author. Connector identity permissions: the CISO. Whether the build changes the instance's authorization: the authorizing official. Training (program design): platform fundamentals in a free PDI; the agency's process before its code; paired work with the sister team; reviewer qualification after supervised reviews; AI-assistant training on what never goes in a prompt. M-25-21 Section 2(e)(i) tells agencies to leverage AI training "to strengthen the technical skills of staff in AI and AI-enabling roles"; SSDF PO.2.2 asks for role-based training and periodic proficiency review. The curriculum fits Book 16's implementation track.`,
  "Book 15, Chapter 13 (Staffing and skills); Chapter 10 (The responsibility matrix).");
}

// ================================================================== 9 Evidence
{
  const s = content("Who does it", "The evidence it produces");
  tag(s, "How");
  table(s, "Records", 1.5, [4.4, 3.0, 4.75], ["Record", "Produced by", "What it proves"], [
    ["Review record: reviewer, decision, findings, AI tool used", "Gate 1", "Someone other than the author read every line"],
    ["ATF results for the update set", "Sub-production", "The change was tested before it was finalized"],
    ["Update set and its source-control commit", "Repository", "What moved matches what was reviewed"],
    ["Change record, impact analysis, CAB decision", "Gate 2", "The change was authorized with security impact considered"],
    ["Production commit by an implementer", "Production", "The author didn't move their own code"],
  ], { fontSize: 12.5 });
  note(s, "Query", 4.95, 1.45, "FaClipboardCheck", HEX.teal, "A query, not a narrative: ",
    "the records join Book 13's ticket-to-machine evidence, so an assessor gets a report instead of a binder.");
  sources(s, "Sources: Book 15, Ch 13 (Evidence: the development path is itself audit evidence); Book 13, Ch 10 and App B; NIST SP 800-53 CM-3, SA-11.");
  notes(s,
`Chapter 13: an in-house build has to make its own assurances, and the development path makes them as a by-product. The review record maps to AC-5 and SSDF PW.7; the ATF results to CM-3(2) and SA-11; the update set and commit to SA-10; the change record to CM-3 and CM-4; the production commit by an implementer to CM-5. These records fit Book 13 Chapter 10's model for every routine change: an owner, a clock, an approval and a result someone other than the actor can check. A change to the compliance application is a ticket like any other, and its closure carries the review, test results and change record as proof (Book 13 Appendix B). CM-3 asks for change records to be retained; SA-11 asks the developer to "produce evidence of the execution of the assessment plan and the results of the testing and evaluation." The application's own control tests, POA&M items and closures are written in the evidence contract's record shape (Chapter 11), so the authorization package needn't know whether the code was bought or built.`,
  "Book 15, Chapter 13 (Evidence); Book 13, Chapter 10 and Appendix B.");
}

// ================================================================== 10 Limits
{
  const s = content("The decision", "Honest limits");
  tag(s, "Why");
  table(s, "Limits", 1.5, [4.2, 7.95], ["Limit", "What it means"], [
    ["It isn't free", "Cost moves from a license line to staff time, sub-production capacity and retesting on every upgrade"],
    ["It isn't an IGA product", "No certification engine at scale, no connector library, no role discovery, no provisioning"],
    ["Review is only as good as the reviewer", "Keep changes small, list qualified reviewers, let them send work back"],
    ["AI speeds up mistakes too", "Invented APIs, insecure defaults, confident wrong logic: caught only by real review and tests"],
    ["Policy and guidance are moving", "M-25-21 is current as of October 2026; SSDF 1.2 is still a draft. Recheck both"],
    ["The sandbox is outside the boundary", "A PDI is for learning and synthetic drafts only"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: Book 15, Ch 13 (Honest limits). OMB memoranda index; NIST CSRC SSDF publications page; ServiceNow PDI documentation.");
  notes(s,
`Chapter 13's honest limits. Not free: developer and reviewer time, sub-production capacity and retesting on every platform upgrade are real costs, paid from existing staff time; leadership should see that trade stated plainly. Not an identity-governance product: the build buys time if needs grow into certifications, connectors, role discovery or provisioning; it doesn't remove the need. Review: a tired reviewer approving a long AI-drafted change is the weakest point; small changes, listed reviewers and a reviewer's right to send a change back are the guards, none a guarantee. AI: invented APIs, insecure defaults and confident but wrong logic are the usual failures. Moving targets: M-25-21 is the current OMB memo on agency AI use as of October 2026; SSDF Version 1.2 is still a draft; platform facts (PDI rules, source control behavior, ATF guidance) are dated to the instance's release. The PDI belongs to ServiceNow and sits outside the agency's boundary.`,
  "Book 15, Chapter 13 (Honest limits).");
}

// ================================================================== 11 Decision
{
  const s = content("The decision", "The decision: approve a small pilot");
  tag(s, "Who");
  panel(s, "Ask", 0.6, 1.5, 7.6, 3.45, HEX.navy, HEX.navyTint, "THE ASK · DESIGN GUIDANCE", "A pilot in a developer instance", [
    "Synthetic data only; no agency data, no real tenant",
    "One or two staff, trained on the rules first",
    "One approved AI assistant; a named reviewer who isn't the author",
    "One component: the re-read-before-close gate",
    "Code in an agency repository from day one",
  ], 14.5);
  panel(s, "Exit", 8.45, 1.5, 4.3, 3.45, HEX.teal, HEX.tealTint, "PILOT EXIT", "Come back with", [
    "The code and its review records",
    "Passing ATF suites",
    "A list of what failed review",
    "A go or no-go for sub-production",
  ], 14);
  const y = 5.15, h = 1.3;
  box(s, "Decision strip", 0.6, y, 12.15, h, "FFFFFF", HEX.navy);
  icon(s, "FaScaleBalanced", 0.8, y + (h - 0.72) / 2, 0.72, HEX.navy);
  T(s, "Decision text", [{ text: "THE DECISION   ", options: { bold: true, color: HEX.navy } }, { text: "Approve the pilot: small, reversible, no new money, evidence before commitment" }],
    { x: 1.7, y: y + 0.08, w: 6.25, h: h - 0.16, fontSize: 14.5, valign: "middle" });
  T(s, "Decision owner", [{ text: "OWNER · DESIGN GUIDANCE", options: { bold: true, color: HEX.teal, fontSize: 11, breakLine: true } }, { text: "Branch chief, ISSO consulted" }],
    { x: 8.1, y: y + 0.08, w: 2.3, h: h - 0.16, fontSize: 13.5, valign: "middle" });
  T(s, "Decision when", [{ text: "NEXT GATE · DESIGN GUIDANCE", options: { bold: true, color: HEX.amber, fontSize: 11, breakLine: true } }, { text: "Sub-production, by a normal change" }],
    { x: 10.5, y: y + 0.08, w: 2.15, h: h - 0.16, fontSize: 13.5, valign: "middle" });
  sources(s, "Sources: Book 15, Ch 13 (Three environments; Training existing staff); Ch 11 (Closure gate). Pilot scope, owner and next gate are design guidance.");
  notes(s,
`The ask is design guidance drawn from Chapter 13, not a federal requirement. Pilot scope: a Personal Developer Instance or agency development instance with synthetic data only (a PDI belongs to ServiceNow and sits outside the agency's boundary); one or two existing staff who have been taught the secure coding standard and the AI rules first; one assistant approved under the agency's generative AI policy; a named reviewer who isn't the author; code in an agency-owned repository from the first day, because PDIs are reclaimed after inactivity. The component is the gate from Chapter 11 and the workbook's ServiceNow and SailPoint example: a business rule that turns any attempt to close a finding into "awaiting verification" unless the update carries re-read evidence from the verifier account. Exit: the code, its review records, passing ATF suites, a list of what failed review (including AI-drafted errors), and a go or no-go for moving to sub-production. Moving to sub-production is a normal change through the change advisory board, and connecting to any real tenant needs the CISO's decision on the connector identity's permissions. Owner: the branch chief (or the manager who owns the staff's time), with the ISSO consulted.`,
  "Book 15, Chapter 13 (Sandbox to production; Staffing and skills) and Chapter 11 (The compliance application).");
}

// ================================================================== 12 Next
{
  const s = content("The decision", "Where to read next");
  tag(s, "How");
  table(s, "Next", 1.5, [3.6, 8.55], ["Read", "For"], [
    ["Book 15, Chapter 13", "This briefing in full, with every source footnoted"],
    ["Book 15, Chapter 11", "The compliance application, the attestation loop and the evidence pipeline"],
    ["Book 15, Chapter 10", "Who runs day two, and the responsibility matrix Chapter 13 extends"],
    ["Book 13, Chapter 10", "Ticket to machine: the evidence model every change follows"],
    ["ServiceNow and SailPoint example", "A worked, unit-tested starting point for the identity findings and the closure gate"],
  ], { fontSize: 13 });
  note(s, "Independent", 4.6, 1.1, "FaBook", HEX.slate, "Independent analysis: ",
    "not an official publication of any agency, and not an endorsement of any product.");
  sources(s, "Sources: whalermike.github.io/modernization-workbook: Book 15 and the Presentations page.");
  notes(s,
`Where to go next: Book 15 Chapter 13 (this briefing in full); Chapter 11 (the compliance application, attestation and the evidence pipeline); Chapter 10 (who runs day two); Book 13 Chapter 10 (ticket to machine); the workbook's examples/servicenow-sailpoint kit (illustrative, unit-tested against mocked responses, not yet proven against live tenants). The site is independent analysis, not an official government publication; no agency reviewed or endorsed it.`,
  "Book 15, Chapters 10, 11 and 13; Book 13, Chapter 10.");
}

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slide after this one is reference material and is not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
  sources(s, "Sources: full list on the following slide.");
}
{
  const s = content("Backup", "Sources behind this briefing");
  T(s, "Source list", bullets([
    "Office of Management and Budget: M-25-21, Accelerating Federal Use of AI through Innovation, Governance, and Public Trust (April 3, 2025); M-25-22, Driving Efficient Acquisition of AI in Government (April 3, 2025); M-26-05, Adopting a Risk-based Approach to Software and Hardware Security (January 23, 2026).",
    "NIST: SP 800-218, SSDF Version 1.1 (February 2022); SP 800-218 Rev. 1, SSDF Version 1.2 (draft, December 17, 2025); SP 800-218A, generative-AI community profile (July 2024); SP 800-53 Rev. 5 release 5.2.0 and SP 800-53B baselines.",
    "ServiceNow documentation: Policy and Compliance Management; Continuous Authorization and Monitoring; Understanding PDIs; source control integration; update sets; the Automated Test Framework. ServiceNow Developer Blog, PDI reclamation (July 10, 2026). SailPoint documentation: certifications; role discovery.",
    "Workbook: Book 15, Chapters 03, 10, 11 and 13; Book 13, Chapter 10 and Appendix B; Book 04, Chapter 09. Full footnotes with links and access dates are in each chapter at whalermike.github.io/modernization-workbook.",
  ], 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 6, fontSize: 13 });
  sources(s, "Sources: as listed. Facts as of October 2026.");
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
