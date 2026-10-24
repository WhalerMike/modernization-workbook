// Start series, Episode 4: Making the Case at Your Agency — a ~6-minute EXECUTIVE briefing on the one-page ask.
// The four local numbers, the pitch for each decider (CIO, CISO, CHCO, authorizing official), the decision with an
// owner and a date, the charter roles, and what to bring to the meeting.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Start_04_Making_the_Case.pptx
// Reuses the shared kit in ../_build/ and the helpers of ../start-here/build.js (Episode 1).
// Every fact comes from a footnoted chapter: Book 00 Ch01/Ch03, Book 01 Ch09/Ch12, Book 03 Ch02/Ch03 (and Ch12 for
// the leaver measure). The one-page framing, the per-decider pitches and the four local numbers are labeled design
// guidance. Agency-neutral.
const path = require("path");
const fs = require("fs");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Start 04", title: "Making the Case at Your Agency",
  footer: "Start series, Episode 4  ·  Federal Modernization Workbook  ·  Executive briefing" });
const { pres, HEX, txt, box, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Start_04_Making_the_Case.pptx";

// ------------------------------------------------------------------ helpers (as in the CyberArk research deck)
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

const label = (s, name, text, x, y, w, color = HEX.red) =>
  txt(s, name, text, { x, y, w, h: 0.28, fontSize: 11, bold: true, color, valign: "middle" });


const SUB = "Executive briefing  ·  Start series, Episode 4";
const S = "Episode 4";

// ================================================================== 1 Title
{
  const s = titleSlide(S, "Making the Case at Your Agency", SUB);
  txt(s, "Session map", [
    { text: "TURNING THE CASE INTO A ONE-PAGE ASK  ·  ABOUT 6 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "One page, one decision  ·  Four local numbers  ·  A pitch for each decider", options: { color: HEX.ink, breakLine: true } },
    { text: "The decision, owner and date  ·  Charter roles  ·  What to bring", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Book 00, Ch 01 and 03; Book 01, Ch 09 and 12; Book 03, Ch 02 and 03. Framing and local numbers are design guidance.", 6.08);
  notes(s,
`Episode 4, the last of the Start series. Episodes 1 to 3 made the case (Book 00 Chapter 01; Book 03 Chapters 02 and 03), walked Phase 0 to Gate G0 and Phase 1 to Gate G1 (Book 00 Chapters 08 and 09; Book 01 Chapter 12). This episode is about the meeting: turning the case into a one-page ask with four local numbers, a pitch shaped for each decider (CIO, CISO, chief human capital officer, authorizing official), one decision with an owner and a date (Book 01 Chapter 12, "Where to start"), the charter roles (Book 00 Chapter 03) and what to bring. The one-page framing, the per-decider pitches and the four local numbers are the program's design guidance, not a federal requirement. The workbook is independent analysis, not an official publication of any agency.`,
  "Book 00, Chapters 01 and 03; Book 01, Chapters 09 and 12; Book 03, Chapters 02 and 03.");
}

// ================================================================== 2 One page
{
  const s = content(S, "One page, one decision");
  tag(s, "Why");
  flow(s, "Page", 1.6, 1.75, [
    { head: "The why", body: "Clocks set outside the agency; identity first, because everything decides on it" },
    { head: "Your numbers", body: "Four local numbers that make the case yours" },
    { head: "One decision", body: "Approve the four-week pre-flight, with a named owner and a start date", color: HEX.amber, tint: HEX.amberTint },
  ], 13.5);
  callout(s, "Small", 3.65, 1.15, "FaLightbulb", HEX.teal, "Deliberately small: ",
    "no vendor decision on day one, just an inventory, an owner and a date. Everything after it is decided at gates, from evidence.");
  callout(s, "Guidance", 5.05, 1.1, "FaBook", HEX.slate, "Design guidance: ",
    "the one-page shape, the four numbers and the pitches that follow are the workbook's suggestion for making the decision concrete. Adapt them.");
  sources(s, "Sources: Book 01, Ch 12 (Where to start) and Ch 09 (What to do next); Book 00, Ch 01 (clocks; sequencing). The framing is design guidance.");
  notes(s,
`Book 01 Chapter 12, "Where to start": "None of this requires a vendor decision on day one. It requires three things, and Phase 0 produces them: an inventory... an owner... a date." Book 01 Chapter 09, "What to do next": "It requires an inventory, an owner and a date." Book 00 Chapter 01: two kinds of clock now set dates from outside, federal policy and vendor support lifecycles; "The sequencing has a logic of its own, and it starts with identity. Policy, access, devices and data all decide on the basis of who or what is asking." Book 00 Chapter 01, what leadership should take from this: hold gates on evidence, not on the calendar. The one-page shape, the four local numbers and the per-decider pitches are the program's design guidance for making the decision concrete, not a federal requirement.`,
  "Book 01, Chapters 09 and 12; Book 00, Chapter 01.");
}

// ================================================================== 3 Four numbers
{
  const s = content(S, "Four local numbers that make it real");
  tag(s, "What");
  const b = table(s, "Numbers", 1.5, [3.3, 6.65, 2.2], ["Your number (design guidance)", "Why it matters", "Fact from"], [
    ["Windows Server 2016 servers you run", "End of support January 12, 2027; the operating system of many domain controllers built in the last decade", "Book 00, Ch 01"],
    ["Contractors outside the HR system", "Federal HR 2.0 covers federal employees; contractors and vendors need a designated source of their own", "Book 03, Ch 02 and 03"],
    ["Time to revoke a leaver's access", "From the day HR records a separation to the last account disabled; today other systems learn it by accident", "Book 03, Ch 02"],
    ["Your Federal HR 2.0 wave and dates", "Onboarding runs about 8 months; interconnections go live around month 5, where the identity window closes", "Book 03, Ch 03"],
  ], { fontSize: 12.5 });
  callout(s, "Measure", b + 0.3, Math.min(1.1, 6.5 - b - 0.3), "FaChartLine", HEX.teal, "Start with estimates: ",
    "the pre-flight's read-only assessment replaces them with measured counts, committed with provenance (design guidance).");
  sources(s, "Sources: Book 00, Ch 01 (vendor support); Book 03, Ch 02 (orphan timeline; what HR provides) and Ch 03 (program facts). The numbers are design guidance.");
  notes(s,
`Book 00 Chapter 01, vendor support: Windows Server 2016 end of support January 12, 2027; "Windows Server 2016 is the operating system of many domain controllers built in the last decade; its date falls inside the window in which most agencies will still be running a forest." Book 03 Chapter 03: "Federal HR 2.0 is a program for federal employees. Contractors and vendors are not in it. Their source is a separate decision"; Book 03 Chapter 02: contractors and vendors are outside HRIT and need a designated source of their own. Book 03 Chapter 02, the orphan timeline: HR records a separation on day −14; at day 0 the account, application logins and badge are still live; a ticket disables the directory account on day +3 while nine application accounts stay enabled; a review flags two on day +45; a penetration test signs in with one on day +180. "The fragments learn it by accident." Book 03 Chapter 03, program facts as of October 20, 2026: Wave 1 (~900K FTE) and Wave 2 (~1.1M FTE) through FY 2027; the memo's sample onboarding is about 8 months with interconnection go-live around month 5; "The window closes at the interconnection." Book 01 Chapter 10: the assessment's computer stream records each computer's operating system. Choosing these four numbers is design guidance.`,
  "Book 00, Chapter 01; Book 03, Chapters 02 and 03; Book 01, Chapter 10.");
}

// ================================================================== 4 CIO
{
  const s = content(S, "For the CIO: the clocks and the cost");
  tag(s, "Who");
  panel(s, "Clocks", 0.6, 1.5, 5.95, 3.15, HEX.red, HEX.redTint, "THE CLOCKS", "Set outside the agency", [
    "Windows Server 2016 end of support: January 12, 2027",
    "CISA BOD 26-02: listed end-of-support edge devices out by February 5, 2027",
    "OMB M-26-14: an agency logging plan, then three maturity levels",
    "Running past end of support becomes a risk acceptance the authorizing official signs",
  ], 13.5);
  panel(s, "Cost", 6.8, 1.5, 5.95, 3.15, HEX.navy, HEX.navyTint, "THE COST", "Sequence it once", [
    "Separate projects can only race the dates; one program can sequence them",
    "The first step is four weeks, with no vendor decision",
    "No license of its own, but the services it uses need them: Entra ID P1 for Conditional Access; P2 or ID Governance for PIM",
    "Fund and govern it as one sequence, not independent budget lines",
  ], 13.5);
  callout(s, "Pitch", 4.95, 1.1, "FaBuildingColumns", HEX.amber, "The CIO pitch (design guidance): ",
    "lead with the dates that land on your estate, and the cost of meeting them one project at a time.");
  sources(s, "Sources: Book 00, Ch 01 (federal policy; vendor support; why one program); Book 01, Ch 09 (what the program is and is not) and Ch 12.");
  notes(s,
`Book 00 Chapter 01: Windows Server 2016 end of support January 12, 2027; CISA BOD 26-02 (February 5, 2026) directs decommissioning of listed end-of-support edge devices within 12 months (February 5, 2027); OMB M-26-14 (May 22, 2026) rescinds M-21-31, with an Agency Logging Plan within 90 days of CISA's Logging Reference Architecture, then maturity Levels 1, 2 and 3 within 120, 180 and 320 days. "Running past end of support becomes a risk acceptance an authorizing official has to sign." Why one program: "The clocks make the cost visible... A program can sequence the work against those dates. A collection of projects can only race them." What leadership should take: "Fund and govern the program as a sequence... Budget lines that treat them as independent will produce independent answers to shared questions." Book 01 Chapter 09: the program "needs no license of its own, the services it orchestrates do. Conditional Access requires Microsoft Entra ID P1, Privileged Identity Management requires P2 or Entra ID Governance, and Lifecycle Workflows and access reviews for member users require Entra ID Governance." Book 01 Chapter 12: no vendor decision on day one. The CIO framing is design guidance.`,
  "Book 00, Chapter 01; Book 01, Chapters 09 and 12.");
}

// ================================================================== 5 CISO
{
  const s = content(S, "For the CISO: leavers and account findings");
  tag(s, "Who");
  img(s, "b03-hr-identity/ch02-orphan-timeline", "The orphan timeline from Book 03: day minus 14, HR records the separation and no other system is listening; day 0, the separation takes effect while the account, application logins and badge are still live; day plus 3, a ticket disables the account but nine application accounts stay enabled; day plus 45, a review flags two and nobody owns the other seven; day plus 180, a penetration test signs in with one and the gap is now an incident.", 0.6, 1.45, 12.15, 2.7);
  panel(s, "CISO", 0.6, 4.35, 12.15, 2.15, HEX.navy, HEX.navyTint, "THE CISO PITCH · DESIGN GUIDANCE", "Fix the wiring, not the symptom", [
    "Orphaned accounts are the structural output of systems with no event channel from HR, not an administrator's mistake",
    "NIST SP 800-53 expects account management aligned with termination and transfer (AC-2 l; PS-5); reviews are the check (AC-2 j)",
    "HR-driven identity starts with leavers, and measures separation-to-block from day one",
  ], 13.5);
  sources(s, "Sources: Book 03, Ch 02 (the orphan timeline; federal policy frame; why this can't be patched) and Ch 12 (Phase 4, leaver first). Pitch is design guidance.");
  notes(s,
`Book 03 Chapter 02: "An orphaned account is not an administrator's mistake. It is the structurally guaranteed output of an architecture in which the system that knows a person left (HR) and the systems that must act on it... share no event channel." The orphan timeline runs from day −14 (HR records the separation) to day +180 (a penetration test authenticates with an orphaned account). NIST SP 800-53 asks that account management be aligned "with personnel termination and transfer processes" (AC-2 l); PS-5, Personnel Transfer, exists to stop access accretion; quarterly reviews "sample state; they cannot observe transitions," and are the verification layer of AC-2 j, which the architecture keeps. Book 03 Chapter 12, Phase 4: turn causation on "leaver first, because revocation is where the risk and the evidence value are. Measure the separation-to-block and separation-to-revocation intervals from day one." The framing of AC-2 findings as the CISO's lead is design guidance.`,
  "Book 03, Chapters 02 and 12.");
}

// ================================================================== 6 CHCO
{
  const s = content(S, "For the CHCO: HR 2.0 and the contractor source");
  tag(s, "Who");
  img(s, "b03-hr-identity/ch03-hr20-window", "The Federal HR 2.0 window from Book 03: December 10, 2025, the OMB/OPM memo, one Core HCM platform and agencies pause their own; June 10, 2026, the Core HCM award to Oracle Fusion Cloud HCM; onboarding months 1 to 5, the window in which data standards, cleanup, interconnection design and the identity feed are decided; interconnection go-live, where the window closes; FY 2028, one system.", 0.6, 1.45, 12.15, 2.65);
  panel(s, "CHCO", 0.6, 4.3, 12.15, 2.2, HEX.teal, HEX.tealTint, "THE CHCO PITCH · DESIGN GUIDANCE", "Ride along, connect once", [
    "HR 2.0 rebuilds the HR side anyway; name the identity feed among the integration points before interconnections go live",
    "It covers federal employees only: choose the contractor source now (Core HCM contingent workers, PIV sponsorship, a suitability register)",
    "HR decides what the workforce attributes mean; identity engineering decides how they flow",
  ], 13.5);
  sources(s, "Sources: Book 03, Ch 03 (program facts; the opportunity, not the project) and Ch 12 (Phases 0 and 1); Book 01, Ch 09 (HR and the contractor sources).");
  notes(s,
`Book 03 Chapter 03: "An agency doesn't choose whether to implement Federal HR 2.0; the memo and the waves decide that. What the agency does choose is whether identity rides along." New interconnections are designed during onboarding (Appendix C asks agencies to define integration points, identify interfacing systems and document data flows). "The window closes at the interconnection," around month 5 of the memo's sample onboarding timeline (a planning assumption to confirm with the HR 2.0 program office). "Federal HR 2.0 is a program for federal employees. Contractors and vendors are not in it," and the HR 2.0 onboarding is the right time to make the contractor-source decision. Book 03 Chapter 12, Phase 0: name the HR-driven identity feed as one of the integration points; Phase 1: decide the contractor and vendor source (Core HCM contingent workers, the PIV sponsorship system, the agency's contractor suitability register, or a combination with one authority per fact). Book 01 Chapter 09: "HR decides what the authoritative attributes mean; identity engineering decides how they flow." Addressing this to the chief human capital officer is design guidance.`,
  "Book 03, Chapters 03 and 12; Book 01, Chapter 09.");
}

// ================================================================== 7 AO
{
  const s = content(S, "For the authorizing official: evidence over attestation");
  tag(s, "Who");
  panel(s, "Holds", 0.6, 1.5, 5.95, 2.95, HEX.amber, HEX.amberTint, "WHAT THE AUTHORIZING OFFICIAL HOLDS", "Risk acceptance, in writing", [
    "The only official who can accept security and privacy risk on the agency's behalf",
    "Every risk the program carries rather than removes reaches them in writing, with an end date",
    "Including deviations from mandatory BOD 25-01 baselines, which agencies must explain when they report",
  ], 13.5);
  panel(s, "Gets", 6.8, 1.5, 5.95, 2.95, HEX.teal, HEX.tealTint, "WHAT THEY GET IN RETURN", "Evidence over attestation", [
    "Gates evaluated from data, not executive signature",
    "Every change a signed plan; every plan an evidence packet",
    "Authorization packages regenerated from the source, not spreadsheets",
    "Gated actuation: a person approves before any automated change runs",
  ], 13.5);
  callout(s, "Pitch", 4.8, 1.1, "FaFileShield", HEX.navy, "The AO pitch (design guidance): ",
    "evidence produced by the work itself, in place of attestation assembled before each assessment.");
  sources(s, "Sources: Book 01, Ch 09 (the CISO and the authorizing official; governance properties; decision rights) and Ch 12 (key takeaways).");
  notes(s,
`Book 01 Chapter 09: "The authorizing official is the only organizational official who can accept security and privacy risk on the organization's behalf, and approves plans of action and milestones." Every place the program proposes to carry risk instead of removing it reaches the authorizing official; CISA's BOD 25-01 says authorizing officials may accept risk for deviations from the mandatory SCuBA policies, and agencies must explain those deviations when they report. "Every risk that the program carries rather than removes reaches the authorizing official in writing"; set the end date of every exception on the authorizing official's calendar. Governance properties: every change is a plan; "Evidence is built in. Every plan produces an evidence packet, and authorization packages regenerate from the source instead of spreadsheets." Gated actuation: a human approves before a corrective action runs; "a posture an authorizing official can sign." Book 01 Chapter 12 key takeaway: "Gate criteria are evaluated from data, not executive signature." The "evidence over attestation" framing is design guidance.`,
  "Book 01, Chapters 09 and 12.");
}

// ================================================================== 8 The decision
{
  const s = content(S, "The decision: an owner, a date and a first gate");
  tag(s, "How");
  panel(s, "Decision", 0.6, 1.5, 12.15, 1.6, HEX.amber, HEX.amberTint, "THE DECISION · DESIGN GUIDANCE", "One sentence to say yes to", [
    "Approve the four-week pre-flight, sponsored by a named executive and run by a named steward, starting on a set date, with Gate G0 on the calendar beside the external clocks",
  ], 14);
  table(s, "Questions", 3.4, [12.15], ["Before saying yes, the sponsor should be able to answer yes to each of these"], [
    ["Is the authoritative source in version control, not a vendor portal or shared drive?"],
    ["Can every production change be traced to a signed commit?"],
    ["Is drift detection continuous, not quarterly?"],
    ["Does every decision have one named decider, and has the authorizing official agreed to the risk-acceptance rows?"],
  ], { fontSize: 13, firstBold: false });
  sources(s, "Sources: Book 01, Ch 12 (Where to start) and Ch 09 (how a sponsor evaluates the program; what to do next). The sentence is design guidance.");
  notes(s,
`Book 01 Chapter 12, "Where to start": an inventory (the read-only assessment, committed with provenance); an owner (a named executive sponsor and steward, and a lead for each workstream); a date (Gate G0 on the calendar, with the external clocks beside it). Book 01 Chapter 09, "How a sponsor evaluates the program": an executive sponsor should require a "yes" to each of these before the program starts: Is the authoritative source in version control, not a vendor portal or shared drive? Can every production change be traced to a signed commit? Is drift detection continuous, not quarterly? Does the target surface come from plan artifacts, so every change has a rollback? Is the platform host one hardened Tier-0 box? Does every row of the decision matrix have one named decider, and has the authorizing official agreed to the risk-acceptance rows? "What to do next": name the owners; run a read-only assessment; stand up the platform host; set the dates. The one-sentence decision is design guidance.`,
  "Book 01, Chapters 09 and 12.");
}

// ================================================================== 9 Charter roles
{
  const s = content(S, "Charter roles: who signs what");
  tag(s, "Who");
  const b = table(s, "Roles", 1.5, [2.7, 3.55, 5.9], ["Role", "Who, typically", "Decides"], [
    ["Executive sponsor", "With the CIO", "Scope, funding and sequence; gates G3 and G5; when directory components retire"],
    ["Steward", "The program office's accountable lead", "Target architecture and the repository; gates G0, G1 and G4; co-signs G2"],
    ["Workstream leads", "Identity, policy, services and addressing, compute, access", "Playbook content and readiness in their domain"],
    ["CISO", "The senior agency information security officer", "Control requirements: MFA strength, the Conditional Access baseline, logging"],
    ["Authorizing official", "As the agency designates", "System and boundary authorization; residual risk; legacy-authentication end dates"],
    ["HR", "The HR system's business owner", "What the authoritative worker attributes mean"],
  ], { fontSize: 12.5 });
  callout(s, "Existing", b + 0.25, Math.min(1.05, 6.5 - b - 0.25), "FaUsersGear", HEX.teal, "Build from roles you already have: ",
    "the zero trust implementation lead OMB M-22-09 required, and the ICAM governance structure OMB M-19-17 requires.");
  sources(s, "Sources: Book 00, Ch 03 (governance and ownership; charter roles); Book 01, Ch 09 (who leads, decides and does the work; decision rights).");
  notes(s,
`Book 00 Chapter 03, governance and ownership: "The source charter left the names blank, and so does this one: the agency fills them in." Project sponsor (executive sponsor, with the CIO): scope, funding and sequence; gates G3 and G5; when Active Directory components retire. Project lead (the steward, the program office's accountable lead): target architecture and the authoritative repository; gates G0, G1 and G4; co-signs G2 with the sponsor. Domain leads (the five workstream leads: identity, policy, services and addressing, compute, access): playbook content and execution readiness in their domain. Book 01 Chapter 09's decision matrix: the CISO, acting as the senior agency information security officer, decides control requirements (MFA strength, Conditional Access baseline, logging); the authorizing official decides authorizing systems and boundary changes, accepting residual risk, and legacy authentication and NTLM end dates; HR decides authoritative worker attributes and their meaning. Book 00 Chapter 03: OMB M-22-09 required a zero trust strategy implementation lead within 30 days; OMB M-19-17 requires an integrated, agency-wide ICAM governance structure; build the steward and steering committee from those. "The HR system's business owner" and "as the agency designates" are placeholders for the agency to fill.`,
  "Book 00, Chapter 03; Book 01, Chapter 09.");
}

// ================================================================== 10 What to bring
{
  const s = content(S, "What to bring to the meeting");
  tag(s, "How");
  panel(s, "Bring", 0.6, 1.5, 6.1, 2.8, HEX.amber, HEX.amberTint, "BRING · DESIGN GUIDANCE", "The one-page ask", [
    "The ask in one sentence, with your four numbers filled in",
    "The external clocks that apply to your estate",
    "Candidate names for sponsor and steward",
    "A proposed start date and a Gate G0 date",
    "Leave with one decision recorded, whatever it is",
  ], 13.5);
  table(s, "Deeper", 1.5, [2.5, 3.55], ["Go deeper", "For"], [
    ["Start Here page", "The six-minute case and Episodes 2 to 4"],
    ["Book 00", "The charter, and decisions with owners and timing"],
    ["Book 01, Ch 09 and 12", "Who leads; the roadmap and its gates"],
    ["Book 03, Ch 02 and 03", "HR as the source of authority; Federal HR 2.0"],
  ], { x: 6.95, fontSize: 12.5 });
  callout(s, "Footnoted", 4.7, 1.0, "FaBook", HEX.slate, "Every claim is footnoted: ",
    "to a primary source in the books. The workbook is independent analysis, not an official publication of any agency.");
  sources(s, "Sources: whalermike.github.io/modernization-workbook: the Start Here page and Books 00, 01 and 03. The checklist is design guidance.");
  notes(s,
`What to bring is the program's design guidance, built from Book 01 Chapter 12 ("Where to start": an inventory, an owner, a date) and Book 01 Chapter 09 ("What to do next": name the owners, starting with the sponsor, the authorizing official and the steward; set the dates). The external clocks are in Book 00 Chapter 01. To go deeper: the Start Here page (the six-minute case and this series); Book 00 (the charter in Chapter 03 and the decisions leadership must make); Book 01 Chapters 09 and 12 (who leads; the roadmap with seven phases and six gates); Book 03 Chapters 02 and 03 (why HR is the source of authority; Federal HR 2.0). The site is independent analysis, not an official government publication; no agency reviewed or endorsed it.`,
  "Book 01, Chapters 09 and 12; Book 00, Chapters 01 and 03; Book 03, Chapters 02 and 03.");
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
    "Book 00, Chapter 01 — Why modernize now (OMB M-26-14; FedRAMP Consolidated Rules for 2026; Microsoft product lifecycle pages; why one program). Chapter 03 — The charter (roles; OMB M-22-09 and M-19-17).",
    "Book 01, Chapter 09 — Who leads the transformation (NIST SP 800-37 roles; CISA BOD 25-01; decision rights; how a sponsor evaluates the program; licensing). Chapter 12 — Migration roadmap (Where to start; key takeaways).",
    "Book 03, Chapter 02 — Why HR is the source of authority (the orphan timeline; NIST SP 800-53 Rev. 5 AC-2 and PS-5). Chapter 03 — Federal HR 2.0 (OMB/OPM memo of Dec. 10, 2025 and Appendices A–C; OPM Core HCM award). Chapter 12 — Execution plan (leaver first).",
    "Design guidance, not sourced fact: the one-page framing, the four local numbers, and the pitch for each decider.",
    "Full footnotes with links and access dates are in each chapter at whalermike.github.io/modernization-workbook.",
  ], 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 6, fontSize: 13 });
  sources(s, "Sources: as listed. Facts as of October 2026; verify wave dates with the HR 2.0 program office.");
}

// ------------------------------------------------------------------ report
const narrated = per.reduce((a, p) => a + p.n, 0);
console.log(`slides: ${pres.slides.length}; narrated: ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
per.forEach((p) => console.log(`  ${String(p.slide).padStart(2)}  ${String(p.n).padStart(3)}  ${p.title}`));
const unused = Object.keys(NARR).filter((t) => !used.has(t));
if (unused.length) throw new Error("narration with no slide: " + unused.join(" | "));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
