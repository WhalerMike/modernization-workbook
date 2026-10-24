// The Field-Office WAN Case: SD-WAN for Executives — a ~7-minute EXECUTIVE business case for Book 09.
// The investment case for field-office SD-WAN in place of a per-office distribution point refresh:
// the problem, the physics floor, the 12-hub target, Year 1 capital, the five-year position and its MPLS
// sensitivity, TIC 3.0 and controller security, the roadmap, the five retirement gates, risks, and the ask.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js B09_SDWAN_Executive.pptx
// Reuses the shared kit in ../_build/ and the helpers of ../start-here/build.js.
// Every fact comes from a footnoted chapter: Book 09 Ch 01, 03, 05, 10, 11 and 13. Chapter 11's cost
// figures are its own planning estimates and stay labeled as assumptions; the owner and timing of the ask
// are labeled design guidance. Agency-neutral. The wider TIC 3.0 decisions are in ../b09-network-executive/.
const path = require("path");
const fs = require("fs");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Book 09", title: "Field-Office WAN Case",
  footer: "Book 09  ·  Federal Modernization Workbook  ·  Executive briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "B09_SDWAN_Executive.pptx";

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

const SUB = "Executive briefing  ·  Book 09 — Network & Transport";

// ================================================================== 1 Title
{
  const s = titleSlide("The case", "The Field-Office WAN Case: SD-WAN for Executives", SUB);
  txt(s, "Session map", [
    { text: "FIX THE CIRCUIT, NOT THE CONTENT  ·  ABOUT 7 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "The problem  ·  What SD-WAN can and can't fix  ·  The target  ·  The cost", options: { color: HEX.ink, breakLine: true } },
    { text: "Security and TIC 3.0  ·  Roadmap and gates  ·  Risks  ·  The decision", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Book 09, Ch 11 (worked case), with Ch 01, 03, 05, 10 and 13. Every cost is the chapter's planning estimate. Facts as of October 2026.", 6.08);
  notes(s,
`An executive business case for field-office SD-WAN. Book 09 Chapter 11 is a worked case, a framing pattern rather than a real engagement: about 1,500 field offices, about 70,000 managed Windows endpoints, branch traffic over MPLS to a central gateway, and a Configuration Manager distribution point in nearly every office. A proposal asks for about $50 million to refresh those distribution points. The chapter's alternative is SD-WAN over dedicated internet access with a 5G continuity path and a consolidated content tier at 12 hub sites. Chapter 11: "Every cost figure in this chapter is a planning estimate from the program's own analysis, not a quote." The wider TIC 3.0 and network decisions are in the Book 09 executive briefing. The workbook is independent analysis, not an official publication of any agency.`,
  "Book 09, Chapter 11 (introduction; Read this first).");
}

// ================================================================== 2 The problem
{
  const s = content("The case", "The problem: 1,500 servers doing a circuit's job");
  tag(s, "Why");
  table(s, "Unit cost", 1.5, [3.0, 1.35, 1.45], ["The $50M request, reconciled", "Per office", "× 1,500"], [
    ["Small form factor PC", "$3,500", "$5.3M"],
    ["1U server, ECC, out-of-band", "$12,000", "$18.0M"],
    ["1U server plus deployment", "$16,000", "$24.0M"],
    [{ text: "Proposed estimate", options: { color: HEX.red } }, { text: "$33,333", options: { bold: true, color: HEX.red } }, { text: "$50.0M", options: { bold: true, color: HEX.red } }],
  ], { fontSize: 13 });
  txt(s, "Unit cost note", "Planning unit costs are Chapter 11's assumptions. The request is about twice the fully loaded server case: ask whether it is acquisition cost or five-year cost of ownership.",
    { x: 0.6, y: 3.55, w: 5.8, h: 0.95, fontSize: 12.5, color: HEX.ink });
  panel(s, "Capacity", 6.75, 1.5, 6.0, 3.0, HEX.navy, HEX.navyTint, "CAPACITY, NOT OFFICE COUNT", "24 needed, not 1,500", [
    "4,000 clients per distribution point: Microsoft's published ceiling",
    "70,000 endpoints need 18 at the ceiling; 24 with headroom",
    "The other 1,476 compensate for branch circuits",
    "Content moved to the cloud; peer caching matured; circuits got cheaper",
  ], 13);
  note(s, "Timing", 4.8, 1.55, "FaTriangleExclamation", HEX.amber, "Timing: ",
    "Configuration Manager moved to an annual release cadence, and Microsoft says new device-management work happens in Intune. Hardware bought in FY26 depreciates through FY31.");
  sources(s, "Sources: Book 09, Ch 11 (The proposal under review; The timing problem; Published capacity limits; What changed). Microsoft Learn size-and-scale limits.");
  notes(s,
`Chapter 11's reconciliation, at the program's planning prices: small form factor PC $3,500 ($5.3M across 1,500); 1U rack server with ECC, out-of-band management and redundant power $12,000 ($18.0M); 1U server plus $4,000 per-site deployment $16,000 ($24.0M); proposed $33,333 per office ($50.0M), about twice the fully loaded server case. Decomposition request: the sponsor should state whether $50M is acquisition cost or five-year total cost of ownership, and itemize scope beyond the distribution point. Capacity (Microsoft's size-and-scale page): 4,000 clients per distribution point; 70,000 endpoints need 18 at the ceiling, 24 with headroom; "The other 1,476 serve no Configuration Manager requirement; they compensate for branch transport." What changed: content moved to Microsoft's content delivery network; peer cache, BranchCache and Delivery Optimization matured; dedicated internet access at 200 Mbps to 1 Gbps is assumed to cost less than the MPLS it replaces (Assumption 1). Timing: annual release cadence from version 2609 (shipped September 28, 2026, supported to March 28, 2028); hardware bought in FY26 depreciates through FY31. "The distribution point role isn't obsolete. The distribution-point-per-office topology is."`,
  "Book 09, Chapter 11 (The proposal under review; Why per-office distribution points are no longer the model).");
}

// ================================================================== 3 Physics floor
{
  const s = content("The case", "What SD-WAN fixes, and the floor it can't move");
  tag(s, "What");
  img(s, "b09-network/ch01-propagation-floor", "Observed round-trip time splits into a propagation delay of about 5 microseconds per kilometer of fiber, which engineering cannot reduce, plus everything else: queueing, congestion, jitter, loss and retransmits, and routes longer than the great circle, where optimization works. A table lists one-way and round-trip floors: metro 50 km 0.25 and 0.5 ms; cross-region 1,000 km 5 and 10 ms; New York to London 5,570 km 28 and 56 ms; New York to Singapore 15,330 km 77 and 153 ms.", 0.6, 1.5, 6.3, 4.95);
  panel(s, "Fixes", 7.15, 1.5, 5.6, 2.45, HEX.teal, HEX.tealTint, "WHAT SD-WAN FIXES", "The gap above the floor", [
    "Route inflation pulled toward the floor",
    "A tighter tail: fast failover, forward error correction, packet duplication",
    "Bulk transfers kept off latency-critical traffic",
  ], 13);
  panel(s, "Floor", 7.15, 4.15, 5.6, 2.3, HEX.red, HEX.redTint, "WHAT IT CAN'T", "The floor, and a 5G backup's limits", [
    "Light in fiber: about 5 microseconds per kilometer",
    "New York to London: at least 56 ms per round trip",
    "A 5G path keeps an office working; it won't carry an update wave",
  ], 13);
  sources(s, "Sources: Book 09, Ch 01 (the speed-of-light floor); Ch 05 (SD-WAN as differentiated transport; the hard ceiling); Ch 11 (Branch network).");
  notes(s,
`Book 09 Chapter 01: light in optical fiber covers roughly 200 km per millisecond, so every 1,000 km of path costs about 5 ms one way; optimization works on the gap above the floor, never the floor. Chapter 05: SD-WAN recovers route inflation and shrinks the tail with forward error correction, packet duplication and fast failover, and keeps bulk transfers off the commit path; "SD-WAN gets a path to the floor with a tight tail. It never gets it below the floor." Microsoft's worked figure for New York to London is 28 ms one way and 56 ms round trip. Chapter 11's branch network: every office gets a dedicated internet access circuit sized to seat count and a 5G fixed-wireless secondary for continuity. "5G is a continuity path, not a capacity path... It won't carry a feature-update wave." Symmetric, SLA-backed circuits beat raw bandwidth; verify physical path diversity per site.`,
  "Book 09, Chapters 01, 05 and 11.");
}

// ================================================================== 4 Target
{
  const s = content("The case", "The target: 12 hubs and 24 distribution points");
  tag(s, "What");
  img(s, "b09-network/ch11-hub-content-tier", "Two data centers, headquarters and the disaster recovery facility, each hold two standard source distribution points with the full content library, an SD-WAN control plane instance and internet breakout. Both feed ten regional hubs holding two pull distribution points each, twenty in all, with SD-WAN aggregation, regional breakout and security service edge enforcement. A capacity note reads 24 distribution points times 4,000 clients equals 96,000; about 70,000 endpoints, an assumption, is 73 percent utilization. The hubs connect over the SD-WAN overlay to about 1,500 field offices, each with a dedicated internet access circuit sized to seats, a 5G secondary path for continuity only, and no local distribution point; content stays local through peer caching, and cloud content arrives over the branch circuit.", 0.6, 1.5, 5.6, 5.0);
  const b = table(s, "Target", 1.5, [2.25, 4.15], ["Element", "Target"], [
    ["Hubs", "12: two data centers and ten regional hubs, in existing facilities"],
    ["Content tier", "24 distribution points, two per hub"],
    ["Capacity", "96,000 clients; 73% used at 70,000 endpoints (assumption)"],
    ["Field office", "Internet circuit sized to seats, 5G continuity path, SD-WAN overlay, no local server"],
    ["Local content", "Peer caching: one WAN copy per site, not per client"],
  ], { x: 6.35, fontSize: 12.5 });
  panel(s, "GCC", 6.35, 6.45 - 1.6, 6.4, 1.6, HEX.amber, HEX.amberTint, "SETTLED FOR GCC", "Microsoft 365 informed routing isn't available", [
    "Direct breakout, app-aware routing and QoS are, from Phase 1",
    "Cloud-dependent features stay enhancements, not dependencies",
  ], 13);
  if (b + 0.2 > 6.45 - 1.6) console.warn("  ! slide 4 GCC panel overlaps the table");
  sources(s, "Sources: Book 09, Ch 11 (Hub topology; Content tier; Branch network; Microsoft 365 path optimization in GCC). Microsoft Learn.");
  notes(s,
`Chapter 11's hub topology: one primary data center (headquarters campus), one secondary (existing disaster recovery facility) and ten regional hubs at existing regional offices, so no new real estate, power or accreditation boundary. Content tier: 70,000 endpoints (Assumption 2) at 4,000 clients per distribution point is a theoretical minimum of 18; 24 deployed (two per hub) gives 96,000-client capacity, 73% design utilization, 37% above the current estimate. Regional DPs are pull distribution points sourcing from the two data centers, turning fan-out into 2-to-20 instead of 1-to-1,500. Sizing trigger: add two DPs per 8,000 net new endpoints, or at sustained load above 3,200 clients per DP. Peer cache, BranchCache and Delivery Optimization are optimizations, not dependencies. Microsoft 365 informed network routing supports worldwide commercial tenants "but not the GCC Moderate, GCC High, DoD, Germany, or China clouds"; direct breakout, application-aware routing on measured path metrics, and QoS marking are the baseline from Phase 1.`,
  "Book 09, Chapter 11 (Target architecture).");
}

// ================================================================== 5 Cost
{
  const s = content("The case", "What it costs: about $10 million in Year 1");
  tag(s, "What");
  const b1 = table(s, "Capital", 1.5, [3.4, 2.0], ["Year 1 capital", "Amount"], [
    ["Branch equipment", "$5,085,000"],
    ["Hub equipment", "$1,048,224"],
    ["Control plane and services", "$3,850,000"],
    [{ text: "Total Year 1 capital", options: { color: HEX.navy } }, { text: "$9,983,224", options: { bold: true, color: HEX.navy } }],
  ], { fontSize: 13 });
  table(s, "Recurring", 1.5, [4.45, 2.0], ["Steady state, per year", "Amount"], [
    ["Internet circuits, tiered by office size", "$8,460,000"],
    ["Security service edge, 70,000 users", "$4,550,000"],
    ["5G secondary paths", "$1,350,000"],
    ["Total recurring, all items", "$15,714,000"],
    ["Less: MPLS retired (1,500 at $1,200 a month)", "−$21,600,000"],
    [{ text: "Net annual position", options: { color: HEX.teal } }, { text: "−$5,886,000", options: { bold: true, color: HEX.teal } }],
  ], { x: 6.3, fontSize: 13 });
  txt(s, "Capital note", "Branch: 1,500 edges in three tiers and 5G gear. Hubs: edge pairs, 24 servers, licenses, racks. Services: control plane, zero-touch staging, field installs, engineering.",
    { x: 0.6, y: b1 + 0.15, w: 5.4, h: 1.25, fontSize: 12.5, color: HEX.ink });
  note(s, "Estimates", 4.95, 1.5, "FaListCheck", HEX.amber, "Planning estimates, not quotes: ",
    "hardware at a 40% discount to the program's planning list prices. Replace every figure with the estate's own data before a budget submission.");
  sources(s, "Sources: Book 09, Ch 11 (Sizing and bill of materials; Year 1 capital; Annual recurring cost at steady state). All figures are the chapter's assumptions.");
  notes(s,
`Chapter 11, Year 1 capital: branch equipment $5,085,000 (750 Tier S, 525 Tier M and 225 Tier L edges, and 1,500 5G modules or gateways); hub equipment $1,048,224 (24 hub edges in high-availability pairs, 24 distribution point servers, 24 Windows Server 2025 Standard 16-core licenses at Microsoft's $1,176 suggested price, hub switching and racks at 12 sites); control plane and services $3,850,000 (on-premises SD-WAN control plane at two sites $400,000; zero-touch staging for 1,500 sites $1,200,000; field installation at 300 sites $750,000; professional services $1,500,000). Total $9,983,224. Annual recurring at steady state: dedicated internet access $8,460,000 (750 at $350, 525 at $500, 225 at $800 per month); 5G $1,350,000; SD-WAN subscriptions $750,000 branch and $72,000 hub; analytics and control plane support $100,000; hub internet transit $432,000; security service edge licensing $4,550,000 (70,000 users at $65); total $15,714,000. Less MPLS retired, 1,500 at $1,200 a month (Assumption 1): −$21,600,000. Net annual position −$5,886,000: "the program returns about $5.9M a year against today's transport spend." Hardware applies a 40% discount to planning list prices; the bill of materials names one vendor's line as a costable example, not a recommendation.`,
  "Book 09, Chapter 11 (Sizing and bill of materials; Cost model and sensitivity).");
}

// ================================================================== 6 Five-year and sensitivity
{
  const s = content("The case", "Five years out, and the one number that decides it");
  tag(s, "What");
  table(s, "Five year", 1.5, [0.75, 2.2, 1.05, 1.15, 1.3], ["Year", "Migration", "Capital", "Net savings", "Cumulative"], [
    ["1", "Design, hubs, pilot", "$10.0M", "$0", "−$10.0M"],
    ["2", "30% of offices", "$0", "$1.77M", "−$8.23M"],
    ["3", "70% of offices", "$0", "$4.12M", "−$4.11M"],
    ["4", "100%", "$0", "$5.89M", { text: "+$1.78M", options: { bold: true, color: HEX.teal } }],
    ["5", "Steady state", "$0", "$5.89M", { text: "+$7.67M", options: { bold: true, color: HEX.teal } }],
  ], { fontSize: 12.5 });
  table(s, "Sensitivity", 1.5, [1.75, 1.45, 2.3], ["MPLS per office, per month", "Net per year", "Character"], [
    ["$1,500", "−$11.29M", "Strongly cash-positive"],
    ["$1,200 (base)", "−$5.89M", "Cash-positive"],
    [{ text: "$873", options: { color: HEX.red } }, { text: "$0", options: { bold: true, color: HEX.red } }, { text: "Breakeven", options: { bold: true, color: HEX.red } }],
    ["$800", "+$1.31M", "Modest net cost"],
    ["$600", "+$4.91M", "Justify on capability"],
    ["$400", "+$8.51M", "Financial argument inverts"],
  ], { x: 7.25, fontSize: 12.5 });
  note(s, "Decides", 4.75, 1.65, "FaScaleBalanced", HEX.navy, "Against the refresh: ",
    "about $57.7M better over five years. The architecture holds on Microsoft's published limits; the cost case holds only once current MPLS cost is confirmed.");
  sources(s, "Sources: Book 09, Ch 11 (Five-year phased position; Sensitivity to current MPLS cost; Confidence statement). All figures are the chapter's assumptions.");
  notes(s,
`Chapter 11's five-year phased position: savings ramp as offices move at MPLS contract renewal. Year 1 design, hubs and pilot, $10.0M capital, cumulative −$10.0M; year 2, 30% of offices, $1.77M net savings, −$8.23M; year 3, 70%, $4.12M, −$4.11M; year 4, 100%, $5.89M, +$1.78M; year 5, steady state, $5.89M, +$7.67M. "The refresh reaches −$50M in year one and recurs at the next refresh cycle. The five-year difference is about $57.7M." The comparison is deliberately not scope for scope: the $10M also carries Microsoft 365, Teams, TIC 3.0 breakout and the Intune migration. Sensitivity: $1,500 per office per month, −$11.29M a year; $1,200 base, −$5.89M, capital repaid in about 20 months of steady-state savings; $873 breakeven ($15,714,000 ÷ (1,500 × 12)); $800, +$1.31M; $600, +$4.91M; $400, +$8.51M. Below breakeven the program is "still the better architecture and still cheaper than the refresh," justified on capability and mission. Confidence statement: the architectural conclusion holds across Assumptions 2 to 10; the financial conclusion depends on Assumption 1.`,
  "Book 09, Chapter 11 (Cost model and sensitivity; Assumptions to validate).");
}

// ================================================================== 7 Security
{
  const s = content("The conditions", "Security: the branch edge becomes a control");
  tag(s, "What");
  flow(s, "Security", 1.5, 2.1, [
    { head: "Parity on every path", body: "TIC 3.0 branch use case: every path lands on enforcement of equal strength" },
    { head: "Accreditation first", body: "The critical path; 12 hubs, not 1,500 offices, shrink the surface" },
    { head: "Telemetry gates MPLS", body: "No office's MPLS retires before its replacement telemetry is confirmed", color: HEX.amber, tint: HEX.amberTint },
    { head: "Controller first", body: "Estate-wide attack surface: secured before it carries traffic", color: HEX.red, tint: HEX.redTint },
  ], 12.5);
  table(s, "Controller", 3.85, [3.6, 8.55], ["Exposure", "What to require before production traffic"], [
    ["Administrative takeover", "Phishing-resistant MFA; management reachable only from an administrative network; privileged actions logged"],
    ["Rogue edges joining", "Certificate-based onboarding from the agency PKI; alert on unexpected peers"],
    ["Unpatched edges", "Fleet inventory; remediation inside BOD 26-04 windows, the shortest three days"],
    ["Lost forensic trail", "Management-plane and edge logs exported off-box, to the agency pipeline and CISA"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: Book 09, Ch 03; Ch 05 (branch edge and TIC 3.0; securing the controller; ED 26-03; BOD 26-02 and 26-04); Ch 11 (Security and TIC 3.0).");
  notes(s,
`Chapter 11: regional breakout means operating under the CISA TIC 3.0 Branch Office Use Case (Version 3.0, September 2026), with a security service edge doing the inspection the central gateway used to do, and it removes branch traffic from the MTIPS sensors that feed CISA telemetry. Three consequences: accreditation is the critical path (circuits in about ninety days; an authorized breakout architecture takes far longer; 12 hubs instead of 1,500 offices shrinks the surface by two orders of magnitude); telemetry continuity gates MPLS retirement; and the compliance case and cost case point at the same build. Chapter 05: the use case's policy enforcement parity means every path class must land on enforcement of equal strength, so the steering policy is a security control. Securing the controller: ED 26-03 (February 25, 2026) covered an actively exploited authentication bypass in a widely used SD-WAN manager and controller; BOD 26-02 governs end-of-support edge devices; BOD 26-04 (June 10, 2026) sets risk-based remediation windows, the shortest three days. Step zero of Chapter 13's sequence: bring the governor under vulnerability management, privileged-access control and logging before it carries production traffic. Several security service edge offerings are FedRAMP Certified at Moderate or High; the design doesn't depend on which.`,
  "Book 09, Chapters 03, 05, 11 and 13.");
}

// ================================================================== 8 Roadmap
{
  const s = content("The conditions", "The roadmap: hubs first, offices at renewal");
  tag(s, "How");
  flow(s, "Phases", 1.5, 2.45, [
    { head: "Phase 0 · months 0–6", body: "About $1.8M: design, TIC 3.0 branch package, control plane, ten-site pilot, CISA telemetry started" },
    { head: "Phase 1 · months 6–18", body: "Twelve hubs: aggregation, regional breakout, security service edge, 24 consolidated servers" },
    { head: "Phase 2 · months 18–48", body: "Office waves at MPLS renewal; each circuit retires only after its telemetry is confirmed" },
    { head: "Phase 3 · months 36+", body: "Microsoft 365 direct-path optimization; caching at hubs; servers retire as gates close", color: HEX.amber, tint: HEX.amberTint },
  ], 12.5);
  table(s, "Phase 0 exit", 4.2, [3.0, 9.15], ["The first gate", "Phase 0 exits when"], [
    ["Exit criteria", "Authorization to operate for regional breakout; pilot sites stable for 30 days; validated per-site costs"],
  ], { fontSize: 12.5 });
  note(s, "Refresh fork", 5.25, 1.2, "FaRoute", HEX.red, "The refresh is the fork: ",
    "BOD 26-02 removes end-of-support edge devices by about August 5, 2027. Specify replacements to the target's attributes, not like-for-like.");
  sources(s, "Sources: Book 09, Ch 11 (Implementation roadmap; Why this order); Ch 10 (BOD 26-02 pulls the refresh forward).");
  notes(s,
`Chapter 11's roadmap. Phase 0, months 0–6: architecture and detailed design; the TIC 3.0 branch use-case package and accreditation; on-premises SD-WAN control plane; a ten-site pilot across all transport types and tiers; telemetry coordination with CISA started; serviceability survey. Exit: authorization to operate for regional breakout; pilot sites stable for 30 days; validated per-site costs. Phase 0 is funded first, at about $1.8M over six months, out of the Year 1 total. Phase 1, months 6–18: twelve hubs, 24 consolidated distribution points, content migration, replacement telemetry and encrypted DNS. Phase 2, months 18–48: office waves keyed to MPLS renewal dates; each office's MPLS retired only after its replacement telemetry is confirmed. Phase 3, months 36+: Microsoft 365 direct-path optimization (not informed network routing); Connected Cache at the hubs; DPs retired as the gates close. Why this order: accreditation is the critical path; hubs close three problems at once; waves follow contract expiry, avoiding early-termination liability. Chapter 10: BOD 26-02 requires identified end-of-support edge devices off agency networks within 18 months, about August 5, 2027; tell whoever scopes the replacements, in writing, what the target requires of a branch device (application-aware steering, path measurement, deterministic egress, exportable telemetry, PQC-capable key exchange, a BOD 23-02 management plane, a FIPS 140-3 expectation).`,
  "Book 09, Chapter 11 (Implementation roadmap) and Chapter 10 (BOD 26-02 pulls the refresh forward).");
}

// ================================================================== 9 Gates
{
  const s = content("The conditions", "A gate, not a date: retiring the last server");
  tag(s, "How");
  img(s, "b09-network/ch11-retirement-gates", "The 24-distribution-point hub content tier, labeled interim, consolidated not permanent, leads down through five gates in sequence: app content, update content, OS provisioning, caching role and compliance evidence. When all are closed, retire the last distribution point, in whatever month that is; if any gate is open, keep the tier and don't force the cutover.", 0.6, 1.5, 4.0, 5.0);
  const b = table(s, "Gates", 1.5, [2.3, 5.75], ["Gate", "Closed when"], [
    ["1  App content", "Client apps and Office apps on Intune, and nothing still deployed from Configuration Manager"],
    ["2  Update content", "Windows Update and device configuration on Intune; the old update setting turned off"],
    ["3  OS provisioning", "Imaging moved from task sequences to Windows Autopilot"],
    ["4  Caching role", "No Connected Cache instance running on distribution-point hardware"],
    ["5  Compliance evidence", "No control evidence still sourced from the Configuration Manager site database"],
  ], { x: 4.7, fontSize: 12.5 });
  T(s, "Gate rule", [{ text: "Month 30 or month 60: ", options: { bold: true, color: HEX.navy } },
    { text: "close all five in month 30, retire in month 30. Gates still open at month 60? Keep the tier; don't force the cutover." }],
    { x: 4.7, y: b + 0.25, w: 8.05, h: 0.9, fontSize: 14 });
  sources(s, "Sources: Book 09, Ch 11 (When to retire the last distribution point; A gate, not a date). Microsoft Learn, co-management workloads.");
  notes(s,
`Chapter 11: "The 24-DP tier is the interim consolidated state, not a new floor." Co-management has seven workloads; "Some workloads are on Intune" isn't the same claim as "the content tier can be decommissioned." Gate 1, app content: client apps and Office Click-to-Run workloads on Intune for the whole validated population, and no required or available deployment still published from Configuration Manager. Gate 2, update content: Windows Update policies and device configuration on Intune, and the Configuration Manager software-update client setting turned off (also Windows Autopatch's co-management prerequisite). Gate 3, OS provisioning: bare-metal imaging moved to Windows Autopilot; the most common reason a "just in case" DP survives. Gate 4, caching role: no Connected Cache instance on distribution-point hardware. Gate 5, compliance evidence: compliance and Endpoint Protection reporting no longer cite the site database. "An estate that closes all five gates in month 30 should retire its last distribution point in month 30. One that hasn't closed them by month 60 should keep the 24-DP tier rather than force a cutover against an open gate."`,
  "Book 09, Chapter 11 (When to retire the last distribution point).");
}

// ================================================================== 10 Risks
{
  const s = content("The conditions", "Risks, and the assumptions to check first");
  tag(s, "Why");
  const b = table(s, "Risks", 1.5, [3.4, 1.0, 7.75], ["Risk", "Rating", "Mitigation"], [
    ["Accreditation slips", { text: "High", options: { bold: true, color: HEX.red } }, "Start Phase 0 with the package; a 12-month slip cuts the five-year net from about +$7.7M to +$1.8M"],
    ["MPLS costs less than assumed", { text: "High", options: { bold: true, color: HEX.red } }, "Validate before submission; below $873, present the case on capability"],
    ["Telemetry lags cutover", { text: "High", options: { bold: true, color: HEX.red } }, "Coordinate with CISA from Phase 0; gate each office's MPLS retirement on it"],
    ["Encryption licensed below circuit speed", { text: "Medium", options: { bold: true, color: HEX.amber } }, "State the throughput entitlement per platform; test under load in the pilot"],
    ["Twelve hubs concentrate risk", { text: "Medium", options: { bold: true, color: HEX.amber } }, "High-availability pairs, diverse transport, a fallback hub in policy"],
  ], { fontSize: 12.5 });
  table(s, "Assumptions", b + 0.2, [3.4, 2.3, 6.45], ["Assumption to validate", "Value used", "How to validate"], [
    ["1  MPLS per office, per month", "$1,200", "Telecom contract records: decides whether the program is cash-positive"],
    ["2  Managed endpoints", "70,000", "Configuration Manager device count: drives the server count"],
    ["5  Terrestrial availability", "85–95% of sites", "Serviceability survey against site addresses"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: Book 09, Ch 11 (Risks and mitigations; Assumptions to validate, ten in all, ordered by impact; Confidence statement).");
  notes(s,
`Chapter 11's risk register (selected). TIC 3.0 branch breakout accreditation slips, High: start Phase 0 with the accreditation package; fall back to hub-only breakout; a 12-month slip moves the five-year net from about +$7.7M to about +$1.8M and the advantage over the refresh from about $57.7M to about $51.8M, so the case survives but breakeven moves to year five. Current MPLS cost below the assumption, High: validate before submission; below $873, re-present on capability; it stays cheaper than $50M. Replacement telemetry lags cutover, High: agency–CISA–provider coordination from Phase 0; gate each office's MPLS retirement on confirmed telemetry. Encrypted throughput licensed below circuit speed, Medium. Twelve hubs concentrate risk, Medium. Others: segmentation blocking client-to-client traffic; terrestrial transport unavailable at 5–15% of sites (satellite or bonded cellular for that subset); telecom task-order changes; security service edge authorization level; Connected Cache placement; indoor 5G coverage. Ten assumptions, ordered by impact: 1 MPLS $1,200; 2 endpoints 70,000; 3 library 1.5 TB; 4 seat distribution 750/525/225; 5 terrestrial availability 85–95%; 6 TIC 3.0 not yet authorized for branch breakout; 7 co-management early; 8 OS deployment centralized; 9 client-to-client traffic assumed blocked; 10 replacement telemetry onboarding not started.`,
  "Book 09, Chapter 11 (Risks and mitigations; Assumptions to validate).");
}

// ================================================================== 11 Decision
{
  const s = content("The decision", "The decision to ask for");
  tag(s, "Who");
  panel(s, "Ask", 0.6, 1.5, 8.0, 3.45, HEX.navy, HEX.navyTint, "THE ASK · FROM CHAPTER 11'S RECOMMENDATION", "Defer, decompose, validate, fund Phase 0", [
    "Defer the $50M refresh pending a network modernization assessment",
    "Have the sponsor state acquisition or five-year cost, and itemize scope",
    "Validate the ten assumptions, starting with MPLS cost and endpoint count",
    "Fund Phase 0: about $1.8M over six months",
    "Track the five gates, not a date, for the last distribution point",
  ], 15);
  img(s, "b09-network/ch13-paired-branch", "The paired-branch study: select two branches with comparable user counts and application mix; instrument both for 30 days (WAN path events, application server CPU and new-connection rate, identity provider authentication volume, database cache hit ratio, help desk tickets by application); deploy the branch-edge policy layer at one branch only; instrument both for a further 30 days; the effect size is the post-period difference adjusted for the pre-period difference.", 8.85, 1.5, 2.1, 3.45);
  T(s, "Proof", [{ text: "PROOF BEFORE SCALE-OUT", options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } },
    { text: "A paired-branch study: 30 days, a change at one office, 30 more days. The difference is the business-case number." }],
    { x: 11.05, y: 1.55, w: 1.7, h: 3.35, fontSize: 12.5 });
  // decision strip, as in the Book 09 executive briefing; owner and timing are design guidance
  const y = 5.15, h = 1.3;
  box(s, "Decision strip", 0.6, y, 12.15, h, "FFFFFF", HEX.navy);
  icon(s, "FaScaleBalanced", 0.8, y + (h - 0.72) / 2, 0.72, HEX.navy);
  T(s, "Decision text", [{ text: "FIRST GATE   ", options: { bold: true, color: HEX.navy } }, { text: "Phase 0 exit: authorization for regional breakout, a stable pilot, validated per-site costs" }],
    { x: 1.7, y: y + 0.08, w: 6.25, h: h - 0.16, fontSize: 14.5, valign: "middle" });
  T(s, "Decision owner", [{ text: "OWNER · DESIGN GUIDANCE", options: { bold: true, color: HEX.teal, fontSize: 11, breakLine: true } }, { text: "Sponsor, with the CIO" }],
    { x: 8.1, y: y + 0.08, w: 2.3, h: h - 0.16, fontSize: 13.5, valign: "middle" });
  T(s, "Decision when", [{ text: "WHEN · DESIGN GUIDANCE", options: { bold: true, color: HEX.amber, fontSize: 11, breakLine: true } }, { text: "Before refresh money is committed" }],
    { x: 10.5, y: y + 0.08, w: 2.15, h: h - 0.16, fontSize: 13.5, valign: "middle" });
  sources(s, "Sources: Book 09, Ch 11 (Recommendation; Implementation roadmap); Ch 13 (How to confirm or refute the case). Owner and timing are design guidance.");
  notes(s,
`Chapter 11's recommendation: 1, defer the $50M refresh pending a network modernization assessment; 2, ask the sponsor to state whether $50M is acquisition cost or five-year total cost of ownership and itemize scope beyond the distribution point; 3, validate the ten assumptions, starting with MPLS cost per office and the endpoint population; 4, fund Phase 0 (architecture, TIC 3.0 accreditation package, control plane, ten-site pilot) at about $1.8M over six months; 5, confirm the planned distribution point count when co-management completes, and the fiscal year; 6, put network modernization and content-tier consolidation under one program; 7, track the five retirement gates, not the Phase 3 placeholder date. The first gate is Phase 0's exit criteria. Chapter 13's paired-branch study: two comparable branches instrumented for 30 days, the branch-edge change at one only, 30 more days; the post-period difference adjusted for the pre-period difference is the effect size, "agency-specific and defensible, and it is the number to put in a business case." Naming the sponsor with the CIO as owner, and "before the refresh money is committed" as the timing, is design guidance, consistent with the Book 09 executive briefing.`,
  "Book 09, Chapter 11 (Recommendation; Position statement) and Chapter 13 (How to confirm or refute the case).");
}

// ================================================================== 12 Next
{
  const s = content("The decision", "Where to read next");
  tag(s, "How");
  table(s, "Next", 1.5, [3.6, 8.55], ["Read or watch", "For"], [
    ["Book 09, Chapter 11", "The full worked case: sizing, bill of materials, cost model, roadmap, gates, risks, assumptions"],
    ["Book 09, Chapter 05", "What SD-WAN can and can't do; securing the controller and the edges"],
    ["Book 09, Chapters 03 and 10", "What TIC 3.0 requires; the long interim and the BOD 26-02 refresh fork"],
    ["Book 09, Chapter 13", "Sequencing, measuring cost in your own estate, the paired-branch study"],
    ["Book 09 executive briefing", "The wider network decisions, with owners and timing"],
  ], { fontSize: 13 });
  note(s, "Independent", 4.5, 1.1, "FaBook", HEX.slate, "Independent analysis: ",
    "every figure here is a planning estimate footnoted in the book. Not an official publication of any agency.");
  sources(s, "Sources: whalermike.github.io/modernization-workbook: Book 09 and the Presentations page.");
  notes(s,
`Where to go next: Book 09 Chapter 11 (the worked case); Chapter 05 (SD-WAN, SASE and governed-path transport, and securing the controller); Chapter 03 (what TIC 3.0 requires); Chapter 10 (the long interim and the BOD 26-02 refresh fork); Chapter 13 (sequencing, cost and evidence); the Book 09 executive briefing (the wider network decisions). Book 05 covers the Intune migration this program enables. The site is independent analysis, not an official government publication; no agency reviewed or endorsed it.`,
  "Book 09, Chapters 03, 05, 10, 11 and 13; the Book 09 executive briefing.");
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
    "Book 09, Chapter 11 — Field Office WAN Transformation: Microsoft Learn (Configuration Manager size and scale, release cadence and servicing, co-management workloads, peer cache, Delivery Optimization, Connected Cache, informed network routing); Microsoft Windows Server pricing; vendor data sheets for the costable example; FedRAMP Marketplace product data; CISA TIC 3.0 Branch Office Use Case (September 2026) and Using SASE in a Modern TIC 3.0 Solution.",
    "Book 09, Chapter 01 — Why physics decides the architecture (ITU-T G.114; propagation floor). Chapter 05 — SD-WAN, SASE and governed-path transport (CISA ED 26-03, BOD 26-02, BOD 26-04; NIST SP 800-53 Rev. 5).",
    "Book 09, Chapter 03 — What TIC 3.0 requires. Chapter 10 — The long interim (BOD 26-02, BOD 23-02, M-26-15, FIPS 140-3). Chapter 13 — Sequencing, cost and evidence (the paired-branch study).",
    "Every cost figure is Chapter 11's planning estimate, not a quote. Full footnotes with links and access dates are in each chapter at whalermike.github.io/modernization-workbook.",
  ], 13), { x: 0.6, y: 1.5, w: 12.1, h: 5.0, paraSpaceAfter: 6, fontSize: 13 });
  sources(s, "Sources: as listed. Facts as of October 2026; replace every planning estimate with the estate's own data.");
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
