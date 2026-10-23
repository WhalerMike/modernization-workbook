// Start Here: Where Modernization Begins — a ~6-minute EXECUTIVE starting point for the whole workbook.
// The case for starting with identity: the clocks, the dependency chain, Federal HR 2.0, the access risk,
// then one bounded ask (Phase 0, four weeks) and the Gate G1 finish line.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Start_Here.pptx
// Reuses the shared kit in ../_build/ and the helpers of research-hybrid-credentials/build.js.
// Every fact comes from a footnoted chapter: Book 00 Ch01/Ch03, Book 01 Ch02/Ch12, Book 03 Ch02/Ch03.
// Local numbers and the shape of the ask are labeled design guidance. Agency-neutral.
const path = require("path");
const fs = require("fs");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Start Here", title: "Executive Briefing",
  footer: "Start here  ·  Federal Modernization Workbook  ·  Executive briefing" });
const { pres, HEX, txt, box, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Start_Here.pptx";

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


const SUB = "Executive briefing  ·  Start here";
const S = "Start here";

// ================================================================== 1 Title
{
  const s = titleSlide(S, "Start Here: Where Modernization Begins", SUB);
  txt(s, "Session map", [
    { text: "WHY IDENTITY COMES FIRST, AND THE FIRST STEP  ·  ABOUT 6 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "Four reasons to start now  ·  The first ask: a four-week pre-flight", options: { color: HEX.ink, breakLine: true } },
    { text: "The finish line: Gate G1  ·  Who decides  ·  Where to go next", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Book 00, Ch 01 and 03; Book 01, Ch 02 and 12; Book 03, Ch 02 and 03. Facts as of October 2026.", 6.08);
  notes(s,
`An executive starting point for the whole workbook. One case: modernization begins with identity, and the first step is bounded. Four reasons (the external clocks, the dependency chain, Federal HR 2.0, the access risk already carried), then one ask (Phase 0, a four-week pre-flight with no vendor decision) and the finish line (Gate G1, Foundation Complete). The workbook is independent analysis, not an official publication of any agency.`,
  "Book 00, Chapters 01 and 03; Book 01, Chapters 02 and 12; Book 03, Chapters 02 and 03.");
}

// ================================================================== 2 Four reasons
{
  const s = content(S, "Four reasons to start now");
  tag(s, "Why");
  flow(s, "Reasons", 1.6, 1.9, [
    { head: "1  The clocks", body: "Federal directives and end-of-support dates are set outside the agency", color: HEX.red, tint: HEX.redTint },
    { head: "2  Identity first", body: "Access, devices, data and certificates all decide on who or what is asking" },
    { head: "3  HR 2.0 is moving", body: "HR is rebuilt government-wide anyway; the identity side is left to the agency" },
    { head: "4  The risk is here", body: "Account decisions live in tickets and spreadsheets; reviews can't see transitions", color: HEX.amber, tint: HEX.amberTint },
  ], 13);
  callout(s, "Small start", 3.9, 1.1, "FaRoute", HEX.teal, "None of this needs a large commitment to begin: ",
    "the first step is a four-week pre-flight that produces an inventory, an owner and a date.");
  sources(s, "Sources: Book 00, Ch 01 (clocks, sequencing); Book 03, Ch 02 and 03; Book 01, Ch 12 (Where to start).");
  notes(s,
`Book 00 Chapter 01: "The sequencing has a logic of its own, and it starts with identity. Policy, access, devices and data all decide on the basis of who or what is asking, so identity has to be authoritative before the decisions that depend on it can be trusted." Book 03 Chapter 03: Federal HR 2.0 "is not the project. It is the opening." Book 03 Chapter 02: spreadsheets and email carry authoritative-grade decisions (who gets an account, when access ends) with none of the properties of a system of record. Book 01 Chapter 12: "None of this requires a vendor decision on day one."`,
  "Book 00, Chapter 01; Book 03, Chapters 02 and 03; Book 01, Chapter 12.");
}

// ================================================================== 3 Clocks
{
  const s = content(S, "The clocks nobody can move");
  tag(s, "Why");
  img(s, "b00-orientation/ch01-external-clocks", "The external clocks: federal policy dates (M-22-09 actions, BOD 25-01 mandatory Microsoft 365 policies June 20, 2025, the M-26-14 logging plan, FedRAMP Consolidated Rules mandatory January 1, 2027, BOD 26-02 edge devices out February 5, 2027, no new FedRAMP Rev5 applications June 11, 2027) and vendor end-of-support dates (including Windows Server 2016 on January 12, 2027 and SQL Server 2017 on October 12, 2027), all landing on one estate and one governed program.", 0.6, 1.45, 8.2, 4.95);
  panel(s, "Nearest", 9.0, 1.5, 3.75, 3.3, HEX.red, HEX.redTint, "THE NEAREST DATE", "Windows Server 2016", [
    "End of support January 12, 2027",
    "Often where domain controllers, certificate authorities and NPS run",
    "Bring your own count of 2016 servers (design guidance)",
  ], 13);
  sources(s, "Sources: Book 00, Ch 01 (external clocks; Microsoft lifecycle pages; CISA BOD 25-01 and 26-02; OMB M-26-14; FedRAMP).");
  notes(s,
`Book 00 Chapter 01's tables: OMB M-22-09 (Jan. 26, 2022); CISA BOD 25-01 (Dec. 17, 2024), mandatory SCuBA configurations for production cloud tenants; CISA BOD 26-02 (Feb. 5, 2026), end-of-support edge devices; OMB M-26-14 (May 22, 2026), which rescinds M-21-31 and sets risk-based logging; FedRAMP Consolidated Rules for 2026, launched June 25, 2026, mandatory January 1, 2027. End of support: Windows 10 and Exchange 2016/2019 passed October 14, 2025; SQL Server 2016 passed July 14, 2026; Windows Server 2012 ESU Year 3 passed October 13, 2026; Windows Server 2016 January 12, 2027; SQL Server 2017 October 12, 2027; Windows Server 2019 and MIM 2016 January 9, 2029. Book 00 Chapter 03: NPS uses the AD domain as its user account database when it's a domain member. The local count is design guidance.`,
  "Book 00, Chapter 01 (external clocks and end-of-support tables) and Chapter 03.");
}

// ================================================================== 4 Identity first
{
  const s = content(S, "Everything decides on identity");
  tag(s, "What");
  img(s, "b01-transformation-arc/ch02-dependency-chain", "The dependency chain from Book 01: inventory, plan, identity, policy, network services, devices and servers, access plane, retire AD DS, prove steady state.", 0.6, 1.45, 2.75, 5.05);
  panel(s, "Order", 3.6, 1.5, 9.15, 2.55, HEX.navy, HEX.navyTint, "THE WORKBOOK'S ORDER", "Identity first; the estate next; assurance last", [
    "Identity has to be authoritative before the decisions that depend on it can be trusted",
    "Network services, addressing and certificates follow: they carry the names and trust everything relies on",
    "Telemetry and governance come last in the build and first in importance once running",
  ], 13);
  table(s, "Books", 4.25, [2.2, 6.95], ["Books", "Where they sit"], [
    ["00–01", "The program: charter, principles, roadmap, gates"],
    ["02–04", "Identity, HR-driven identity, access and privilege"],
    ["05–09", "Devices, data, certificates, DNS, network"],
    ["10–17", "Boundary, Zero Trust, operations, governance, compliance, people, AI"],
  ], { x: 3.6, fontSize: 12 });
  sources(s, "Sources: Book 00, Ch 01 (sequencing) and Ch 02 (the numbering follows the dependency chain); Book 01, Ch 02.");
  notes(s,
`Book 00 Chapter 01: identity first because every later decision depends on it; network services, addressing and certificates follow because they carry the names and trust everything else relies on; telemetry and automated governance come last in the build and first in importance once running. Book 00 Chapter 02: "The numbering follows the dependency chain... Identity comes first because every later decision depends on it; the estate's infrastructure follows; boundary, assurance and operations come after." Book 01 Chapter 02's dependency chain: inventory, plan, identity (Entra ID authoritative for people and delegation; HR drives lifecycle), policy, network services, devices and servers, access plane, retire AD DS, prove steady state.`,
  "Book 00, Chapters 01 and 02; Book 01, Chapter 02.");
}

// ================================================================== 5 HR 2.0
{
  const s = content(S, "HR is being rebuilt anyway");
  tag(s, "Why");
  const b = table(s, "HR 2.0", 1.5, [3.0, 9.15], ["Fact", "Value (as of October 2026)"], [
    ["Directing instrument", "Joint OMB/OPM memo, \"Creating Federal HR 2.0\", December 10, 2025: one government-wide Core HCM platform"],
    ["Platform", "Oracle Fusion Cloud HCM (SaaS), awarded June 10, 2026"],
    ["Waves", "Wave 1 volunteers (~900K FTE) and Wave 2, all remaining agencies (~1.1M FTE), through FY 2027; adoption goal FY 2028"],
    ["Agency onboarding", "About 8 months; new interconnections live around month 5"],
    ["Agency obligation now", "Pause own Core HCM procurement and modernization; prepare integration points and data flows"],
  ], { fontSize: 12 });
  callout(s, "Opening", b + 0.25, Math.min(1.05, 6.5 - b - 0.25), "FaPeopleArrows", HEX.teal, "The opening, not the project: ",
    "OPM rebuilds the HR side; the identity connection is the agency's. Ride along and connect once.");
  sources(s, "Sources: Book 03, Ch 03 (OMB/OPM memo Dec. 10, 2025 and Appendices A–C; OPM award; Oracle announcement). Verify each agency's wave and dates.");
  notes(s,
`Book 03 Chapter 03's program facts as of October 20, 2026: the joint OMB/OPM memorandum of December 10, 2025 directs one government-wide Core HCM platform; agencies pause their own Core HCM procurement, development and related modernization. OPM awarded the Federal HRIT Modernization Core HCM contract to Oracle on June 10, 2026 (Oracle Fusion Cloud HCM, SaaS). Wave 1 (~900K FTE) and Wave 2 (~1.1M FTE) transition through FY 2027; the adoption goal is FY 2028. Appendix B's sample onboarding is about 8 months with interconnections live around month 5. Appendix C asks agencies to define integration points, identify interfacing systems and document data flows. The chapter: "Federal HR 2.0 is not the project. It is the opening: the HR side is rebuilt anyway, and the identity side is left to the agency." Wave membership and dates change; verify with the HR 2.0 program office.`,
  "Book 03, Chapter 03 (The program facts; Why this is the opportunity, not the project).");
}

// ================================================================== 6 Access risk
{
  const s = content(S, "The access risk agencies already carry");
  tag(s, "Why");
  panel(s, "Today", 0.6, 1.5, 6.0, 3.3, HEX.red, HEX.redTint, "TODAY", "Decisions without a record", [
    "Who gets an account, and when access ends, lives in tickets, spreadsheets and email",
    "A contractor roster is a copy the moment it's saved",
    "Quarterly reviews sample state; they can't see a transition",
    "A review 90 days after a separation certifies an orphan for a quarter",
  ], 13.5);
  panel(s, "Fix", 6.75, 1.5, 6.0, 3.3, HEX.teal, HEX.tealTint, "HR-DRIVEN IDENTITY", "Fix the cause", [
    "The HR record becomes the source of who works here, in what role, for whom",
    "Access follows attributes, so every entitlement has a because",
    "Reviews stay, sharper, as the check on that truth (AC-2 j)",
    "Contractors need a governed source too: an open decision in Book 03",
  ], 13.5);
  sources(s, "Sources: Book 03, Ch 02 (fragmented truth; reviews and AC-2 j, NIST SP 800-53 Rev. 5) and Ch 10 (from attributes to access).");
  notes(s,
`Book 03 Chapter 02: spreadsheets and email ("the onboarding tracker, the contractor roster, the separation checklist") carry authoritative-grade decisions with none of the properties of a system of record; "The spreadsheet knows a contractor started but is a copy the moment it is saved." On reviews: "Quarterly access reviews sample state; they cannot observe transitions. A review that runs ninety days after a separation certifies an orphan for a quarter"; reviews are the verification layer of AC-2 j (NIST SP 800-53 Rev. 5, AC-2 items j and l, PS-5), and the architecture keeps them. Book 03 Chapter 10: every entitlement has a "because": access exists because an attribute satisfied a rule. Contractors' source of authority is an open program decision.`,
  "Book 03, Chapters 02 and 10.");
}

// ================================================================== 7 The ask
{
  const s = content(S, "The first ask: four weeks, no vendor decision");
  tag(s, "How");
  flow(s, "Phase 0", 1.55, 1.6, [
    { head: "An inventory", body: "A read-only assessment of the estate, committed with provenance (Book 01 Ch 10)" },
    { head: "An owner", body: "A named executive sponsor and steward, and a lead for each workstream" },
    { head: "A date", body: "Gate G0 on the calendar, beside the external clocks", color: HEX.amber, tint: HEX.amberTint },
  ], 13.5);
  table(s, "G0", 3.45, [2.6, 9.55], ["Phase 0 — Pre-flight", "Weeks 1–4"], [
    ["Entry", "Executive sponsor and steward named; platform host provisioned; read-only assessment account created"],
    ["Work", "Build the platform host; run the assessment; seed the repository; least-privilege service principals for Entra ID, Intune and Azure Arc"],
    ["Gate G0, Ready to Plan", "Platform host operational; assessment committed; no open priority-one findings"],
  ], { fontSize: 12 });
  sources(s, "Sources: Book 01, Ch 12 (Phase 0; Where to start) and Ch 10 (analyzing the estate).");
  notes(s,
`Book 01 Chapter 12, "Where to start": "None of this requires a vendor decision on day one. It requires three things, and Phase 0 produces them: an inventory (the read-only assessment of Chapter 10, committed with provenance); an owner (a named executive sponsor and steward, and a lead for each workstream); a date (Gate G0 on the calendar, with the external clocks beside it)." Phase 0, weeks 1–4: entry, executive sponsor and steward named, platform host provisioned, read-only assessment account created; work, build the platform host, run the assessment, seed the repository, create least-privilege service principals for Entra ID, Intune and Azure Arc, profile transactions of any application proposed to move away from its data; Gate G0, Ready to Plan: platform host operational, assessment committed, no open priority-one findings.`,
  "Book 01, Chapter 12 (Phase 0 — Pre-flight; Where to start).");
}

// ================================================================== 8 G1
{
  const s = content(S, "The finish line: Gate G1, Foundation Complete");
  tag(s, "How");
  table(s, "G1", 1.5, [3.2, 8.95], ["Phase 1 — Foundation (weeks 5–8)", "Gate G1 passes when, measured from data"], [
    ["Identity", "Enterprise groups and administrative units in place and drift-clean"],
    ["Policy", "Baseline Conditional Access enforced: no user outside the MFA requirement except the documented emergency access accounts"],
    ["Emergency access", "Emergency access accounts vaulted and tested"],
    ["Services", "IP address management covering the platform host and Tier 0 infrastructure"],
    ["HR feed", "HR-to-cloud provisioning operational for the foundation scope"],
    ["Overall", "Zero drift across the foundation"],
  ], { fontSize: 12.5 });
  callout(s, "Data", 4.9, 1.0, "FaClipboardCheck", HEX.teal, "Evaluated from data, not executive signature: ",
    "when G1 passes, every later book has something solid to build on.");
  sources(s, "Sources: Book 01, Ch 12 (Phase 1 — Foundation; Gate G1; key takeaways); Book 03, Ch 12 (foundation-scope HR feed).");
  notes(s,
`Book 01 Chapter 12, Phase 1 — Foundation (weeks 5–8), goal: put the identity primitives in place before anything else moves. Identity: enterprise-level dynamic groups; administrative units for Tier 1 and selected Tier 2 scopes; the HR-to-cloud provisioning feed for the foundation scope (Book 03, Chapter 12). Policy: the enterprise Conditional Access baseline (MFA for all users, legacy authentication blocked, emergency access accounts excluded from every policy that blocks or restricts sign-in). Services: IPAM covering the platform host and Tier 0 infrastructure. Compute: platform host and pilot servers connected through Azure Arc. Gate G1: enterprise groups and administrative units drift-clean; baseline Conditional Access enforced with no user outside MFA other than documented emergency accounts; Tier 0 covered by IPAM; emergency accounts vaulted and tested; HR-to-cloud provisioning operational for the foundation scope; zero drift across the foundation. Key takeaway: "Gate criteria are evaluated from data, not executive signature."`,
  "Book 01, Chapter 12 (Phase 1 — Foundation; key takeaways); Book 03, Chapter 12.");
}

// ================================================================== 9 Who decides
{
  const s = content(S, "Who decides, and what to bring");
  tag(s, "Who");
  table(s, "Roles", 1.5, [2.6, 4.0], ["Role", "Decides"], [
    ["Executive sponsor, with the CIO", "Scope, funding and sequence; gates G3 and G5; when AD components retire"],
    ["Steward", "Target architecture and the authoritative repository; gates G0, G1 and G4"],
    ["Workstream leads", "Playbook content and readiness in their domain"],
  ], { fontSize: 12.5 });
  panel(s, "Bring", 7.4, 1.5, 5.35, 3.6, HEX.amber, HEX.amberTint, "BRING FOUR LOCAL NUMBERS · DESIGN GUIDANCE", "And one decision", [
    "How many Windows Server 2016 servers you run",
    "How many contractors sit outside the HR system",
    "How long a departing person keeps access",
    "Your Federal HR 2.0 wave and dates",
    "Ask: approve the four-week pre-flight, with a named owner and a start date",
  ], 13);
  sources(s, "Sources: Book 00, Ch 03 (charter roles and gate authorities); Book 01, Ch 09. The four numbers and the ask are design guidance.");
  notes(s,
`Book 00 Chapter 03's charter roles: project sponsor (executive sponsor, with the CIO) decides scope, funding and sequence, gates G3 and G5, and when Active Directory components retire; project lead (the steward, the program office's accountable lead) decides target architecture and the authoritative repository, gates G0, G1 and G4, and co-signs G2 with the sponsor; domain leads (identity, policy, services and addressing, compute, access) own playbook content and execution readiness. The charter leaves names blank; the agency fills them in. The four local numbers and the shape of the ask are the program's design guidance for making the decision concrete.`,
  "Book 00, Chapter 03 (charter roles); Book 01, Chapter 09.");
}

// ================================================================== 10 Next
{
  const s = content(S, "Where to go next");
  tag(s, "How");
  table(s, "Next", 1.5, [3.6, 8.55], ["Read or watch", "For"], [
    ["Book 00 executive briefing", "The decisions leadership must make, with owners and timing"],
    ["Book 01, Chapter 12", "The roadmap: seven phases and six gates"],
    ["Book 02 — Identity & Directory", "The identity foundation: Entra ID, groups, administrative units, delegation"],
    ["Book 03 — HR-Driven Identity", "The full case for HR as the source of authority, and Federal HR 2.0"],
    ["Presentations page", "A 15-minute deck for every book, with narrated editions"],
  ], { fontSize: 13 });
  callout(s, "Independent", 4.1, 1.0, "FaBook", HEX.slate, "Independent analysis: ",
    "every claim is footnoted to a primary source in the books. Not an official publication of any agency.");
  sources(s, "Sources: whalermike.github.io/modernization-workbook: Books 00–03 and the Presentations page.");
  notes(s,
`Where to go next: the Book 00 executive briefing (decisions with owners and timing); Book 01 Chapter 12 (seven phases, six gates); Book 02 (identity and directory); Book 03 (HR-driven identity and Federal HR 2.0); the Presentations page for every book's deck. The site is independent analysis, not an official government publication; no agency reviewed or endorsed it.`,
  "Books 00 to 03; the Presentations page.");
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
    "Book 00, Chapter 01 — Why modernize now: OMB M-22-09; CISA BOD 25-01 and BOD 26-02; OMB M-26-14; FedRAMP Consolidated Rules for 2026; Microsoft product lifecycle pages.",
    "Book 00, Chapter 02 — How to use this workbook (the numbering follows the dependency chain); Chapter 03 — The charter (roles and gate authorities).",
    "Book 01, Chapter 02 — The problem (dependency chain); Chapter 10 — Analyzing the estate; Chapter 12 — Migration roadmap (Phases 0 and 1, Gates G0 and G1, Where to start).",
    "Book 03, Chapter 02 — Why HR is the source of authority (NIST SP 800-53 Rev. 5, AC-2 and PS-5); Chapter 03 — Federal HR 2.0 (OMB/OPM memo of Dec. 10, 2025; OPM Core HCM award; Oracle announcement); Chapter 10 — From attributes to access.",
    "Full footnotes with links and access dates are in each chapter at whalermike.github.io/modernization-workbook.",
  ], 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 6, fontSize: 13 });
  sources(s, "Sources: as listed. Facts as of October 2026; verify wave dates with the HR 2.0 program office.");
}

// ------------------------------------------------------------------ report
const narrated = per.reduce((a, p) => a + p.n, 0);
console.log(`slides: ${pres.slides.length}; narrated: ${narrated} words, about ${(narrated / WPM).toFixed(1)} minutes at ${WPM} wpm`);
const unused = Object.keys(NARR).filter((t) => !used.has(t));
if (unused.length) throw new Error("narration with no slide: " + unused.join(" | "));
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dup.length) throw new Error("duplicate titles: " + dup.join(", "));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
