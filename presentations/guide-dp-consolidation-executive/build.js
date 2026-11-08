// Content Delivery Modernization (Distribution Point Consolidation): a ~8-minute EXECUTIVE DECISION deck for a CIO,
// a budget officer and an endpoint lead who are weighing a refresh of Configuration Manager distribution point hardware.
// The decision, the questions to answer first, the options compared, the target, the five gates, cost, the plan, the
// packaging follow-on (PSAppDeployToolkit) and the ask. Content is Book 09 Chapter 11 (a worked case; every cost is its
// planning estimate); the PSAppDeployToolkit slide uses the toolkit's site and Microsoft Learn. Agency-neutral.
// Build (Git Bash):  source /c/tmp/deckenv.sh && node build.js Guide_DP_Consolidation_Executive.pptx
// Reuses the shared kit in ../_build/ and the helpers of ../b09-sdwan-executive/build.js.
// figures are its own planning estimates and stay labeled as assumptions; the owner and timing of the ask
// are labeled design guidance. Agency-neutral. The wider TIC 3.0 decisions are in ../b09-network-executive/.
const path = require("path");
const fs = require("fs");
const KIT = path.join(__dirname, "..", "_build", "lib.js");
const D = require(KIT)({ book: "Content Delivery", title: "DP Consolidation",
  footer: "Content delivery  ·  Federal Modernization Workbook  ·  Executive decision briefing" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "Guide_DP_Consolidation_Executive.pptx";

// ------------------------------------------------------------------ helpers (as in ../b09-sdwan-executive/build.js)
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

const GUIDE = "https://whalermike.github.io/modernization-workbook/docs/books/guides/dp-consolidation.html";
const PLAN = "https://whalermike.github.io/modernization-workbook/docs/project-plans/content-delivery.html";
const PSADT = "https://psappdeploytoolkit.com/";
const SUB = "Executive decision briefing  ·  Content delivery modernization";

// ================================================================== 1 Title
{
  const s = titleSlide("The decision", "Content Delivery Modernization (DP Consolidation)", SUB);
  txt(s, "Session map", [
    { text: "FUND A DISTRIBUTION POINT REFRESH, OR CONSOLIDATE?  ·  ABOUT 10 MINUTES", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    { text: "The decision  ·  Questions first  ·  Capacity and timing  ·  Options compared", options: { color: HEX.ink, breakLine: true } },
    { text: "Target and gates  ·  Cost  ·  Plan, ten implementation stages, risks  ·  The ask", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.2, fontSize: 15, paraSpaceAfter: 2 });
  sources(s, "Sources: Book 09, Ch 11 (worked case). Every cost is the chapter's planning estimate. Facts as of October 2026.", 6.08);
  notes(s,
`A decision briefing for a CIO, a budget officer and an endpoint lead at an agency weighing a refresh of Configuration Manager distribution point hardware. Book 09 Chapter 11 is a worked case, "a framing pattern, not a real engagement": about 1,500 field offices, about 70,000 managed Windows endpoints, branch traffic over MPLS to a central gateway, and a distribution point in nearly every office. The proposal asks for about $50 million. Chapter 11: "Every cost figure in this chapter is a planning estimate from the program's own analysis, not a quote." The decision guide and the project plan carry the detail. The workbook is independent analysis, not an official publication of any agency.`,
  "Book 09, Chapter 11 (introduction; Read this first).");
}

// ================================================================== 2 The decision
{
  const s = content("The decision", "The decision: refresh 1,500 servers, or consolidate?");
  tag(s, "Why");
  table(s, "Unit cost", 1.5, [3.0, 1.35, 1.45], ["The $50M request, reconciled", "Per office", "× 1,500"], [
    ["Small form factor PC", "$3,500", "$5.3M"],
    ["1U server, ECC, out-of-band", "$12,000", "$18.0M"],
    ["1U server plus deployment", "$16,000", "$24.0M"],
    [{ text: "Proposed estimate", options: { color: HEX.red } }, { text: "$33,333", options: { bold: true, color: HEX.red } }, { text: "$50.0M", options: { bold: true, color: HEX.red } }],
  ], { fontSize: 13 });
  txt(s, "Unit cost note", "Planning unit costs are Chapter 11's assumptions. The request is about twice the fully loaded server case.",
    { x: 0.6, y: 3.55, w: 5.8, h: 0.7, fontSize: 12.5, color: HEX.ink });
  panel(s, "Position", 6.75, 1.5, 6.0, 2.85, HEX.navy, HEX.navyTint, "THE POSITION · FROM CHAPTER 11", "Defer the refresh, assess the network", [
    "Configuration Manager's limits say about 24 distribution points, not 1,500",
    "The other 1,476 compensate for branch circuits",
    "About $10M in Year 1 capital solves the same problem",
    "Expected cash-positive by Year 5 if circuits cost over $873 an office a month",
  ], 13);
  note(s, "Ask", 4.7, 1.65, "FaScaleBalanced", HEX.amber, "The decision: ",
    "do not commit refresh money yet. Answer the five questions on the next slide, then fund a six-month Phase 0 of about $1.8M.");
  sources(s, "Sources: Book 09, Ch 11 (The proposal under review; Recommendation; Position statement for a briefing). Planning estimates, not quotes.");
  notes(s,
`Chapter 11's reconciliation, at the program's planning prices: small form factor PC $3,500 ($5.3M across 1,500); 1U rack server with ECC, out-of-band management and redundant power $12,000 ($18.0M); 1U server plus $4,000 per-site deployment $16,000 ($24.0M); proposed $33,333 per office ($50.0M), "about twice the fully loaded server case." Position statement for a briefing: "The $50M distribution point refresh solves content delivery over constrained field office links. An SD-WAN and regional breakout program solves the same problem for about $10M in capital, is expected to be cash-positive by year five if current MPLS spend is above $873 per office per month, is a prerequisite for the Intune migration, and helps every other cloud workload. Recommend deferring the refresh pending a network modernization assessment." Phase 0 is funded at about $1.8M over six months.`,
  "Book 09, Chapter 11 (The proposal under review; Recommendation).");
}

// ================================================================== 3 Questions
{
  const s = content("The decision", "Questions to answer before any money moves");
  tag(s, "Why");
  table(s, "Questions", 1.5, [4.9, 4.45, 2.8], ["Question", "Why it decides", "Where the answer is"], [
    ["Is the $50M acquisition cost or five-year total cost of ownership? What is bundled beyond the distribution point?", "The alternative must be compared like for like", "The sponsor"],
    ["What is the planned distribution point count when co-management completes, and in which fiscal year?", "A refresh needs a target inventory", "The sponsor, the endpoint lead"],
    ["What does MPLS cost per office per month today?", "Decides if the program pays for itself: breakeven is $873", "Telecom contract records"],
    ["How many managed endpoints are there?", "Drives the distribution point count directly", "Configuration Manager device count"],
    ["Do branch rules allow client-to-client traffic on TCP 8003, UDP 8004 and TCP 7680?", "Affects peer sharing only, not the design", "Network security policy"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: Book 09, Ch 11 (Decomposition request; The question that sizes the requirement; Assumptions to validate, nos. 1, 2 and 9).");
  notes(s,
`Chapter 11's decomposition request: "Before any comparison is credible, the sponsor should state whether $50M is acquisition cost or five-year total cost of ownership, and itemize any scope beyond the distribution point itself." The gap to a fully loaded server case can be a five-year total cost of ownership presented as an equipment refresh, or scope bundled beyond the distribution point (circuit upgrades, switching, power or racks). The question that sizes the requirement: "What is the planned distribution point count when co-management completes, and in which fiscal year? A refresh needs a target inventory." Assumptions to validate, ordered by impact: 1, current MPLS cost per office per month ($1,200 used; decides whether the program is cash-positive); 2, managed endpoint population (70,000; drives the DP count directly); 9, client-to-client traffic at branches (assumed blocked; affects peering only). Ten assumptions in all; the owners named here are the chapter's validation sources, with the sponsor as the person asked to state the scope.`,
  "Book 09, Chapter 11 (The proposal under review; Assumptions to validate).");
}

// ================================================================== 4 Capacity and timing
{
  const s = content("The decision", "Capacity and timing: 24 needed, and a shrinking tier");
  tag(s, "Why");
  table(s, "Limits", 1.5, [3.4, 1.5, 2.3], ["Microsoft's published limit", "Limit", "At 70,000 endpoints"], [
    ["Clients per distribution point", "4,000", "18 at the ceiling; 24 with headroom"],
    ["Standard DPs per primary or secondary site", "250", "1,500 only possible with pull DPs"],
    ["Windows clients per stand-alone primary site", "150,000", "One site is enough"],
    ["Clients per management point", "25,000", "At least three management points"],
  ], { fontSize: 12.5 });
  panel(s, "Moved", 7.9, 1.5, 4.85, 2.75, HEX.teal, HEX.tealTint, "WHAT CHANGED", "Content left the closet", [
    "Windows and Microsoft 365 updates come from Microsoft's cloud",
    "Peer sharing matured",
    "Circuits cost less per office than MPLS (Assumption 1)",
  ], 13);
  note(s, "Timing", 4.5, 1.9, "FaTriangleExclamation", HEX.amber, "Timing: ",
    "Configuration Manager moves to annual releases (2609 shipped September 28, 2026; each version supported 18 months), and Intune is where new work happens. Hardware bought in FY26 depreciates through FY31. The role isn't obsolete; the server at every office is.");
  sources(s, "Sources: Book 09, Ch 11 (Published capacity limits; What changed; The timing problem). Microsoft Learn: Size and scale numbers; Updates and servicing.");
  notes(s,
`Chapter 11, from Microsoft Learn's size-and-scale page: 4,000 clients per distribution point; 250 standard distribution points per primary or secondary site and 2,000 additional pull distribution points per site, so 1,500 is possible only as, for example, 250 standard plus 1,250 pull; 150,000 Windows clients per stand-alone primary site; 25,000 clients per management point, so at least three management points wherever the DPs sit. "Treat 4,000 as a ceiling to stay under, not a target." "The other 1,476 serve no Configuration Manager requirement; they compensate for branch transport." What changed: content moved to Microsoft's content delivery network, handled by Delivery Optimization and Connected Cache; peer cache, BranchCache and Delivery Optimization peering matured; branch transport economics inverted (Assumption 1 in disguise). Timing: Microsoft moved Configuration Manager to an annual release cadence starting with version 2609, which shipped September 28, 2026 and is supported until March 28, 2028; each current-branch version is supported for 18 months. "Hardware bought in FY26 depreciates through FY31. If co-management completes in three to four years, the estate will have funded 1,500 devices for one or two years past their use." The accurate statement: "The distribution point role isn't obsolete. The distribution-point-per-office topology is."`,
  "Book 09, Chapter 11 (Why per-office distribution points are no longer the model; The timing problem).");
}

// ================================================================== 5 Options compared
{
  const s = content("The options", "Three options compared: refresh, consolidate, retire");
  tag(s, "What");
  const b = table(s, "Options", 1.5, [2.3, 3.2, 3.5, 3.15], ["", "Refresh", "Consolidate (interim)", "Retire (end state)"], [
    ["Distribution points", "About 1,500, one per office", "24 at 12 hubs; 96,000-client capacity", "None, when five gates close"],
    ["Money", "About $50M; recurs every refresh cycle", "About $10.0M Year 1 capital, including the transport", "No further distribution point refresh"],
    ["Content copies", "1.5 to 3 PB replicated", "24 copies; regional DPs hold a subset", "Cloud content via caching and peers"],
    ["Compliance footprint", "1,500 servers to baseline, scan and carry in the plan", "24 components, under 2% of 1,500", "None from distribution points"],
    ["Fits when", "Hardware bought in FY26 depreciates through FY31", "Consolidates the existing footprint, doesn't expand it", "Gate-driven, never date-driven"],
  ], { fontSize: 12 });
  note(s, "Order", b + 0.2, Math.min(1.1, 6.5 - b - 0.2), "FaRoute", HEX.teal, "One line, three stops: ",
    "consolidation is the interim state on the way to retirement, not a new floor.");
  sources(s, "Sources: Book 09, Ch 11 (What the distributed model costs; Content tier: 24 distribution points; When to retire the last distribution point; Year 1 capital).");
  notes(s,
`Chapter 11, what the distributed model costs at 1,500 distribution points: duplicated storage of 1.5 to 3 PB (1,500 copies of a 1–2 TB library), most never requested at most sites; every package replicates to 1,500 targets; a tiered pull hierarchy needed to stay stable; 1,500 servers to baseline, scan, patch and carry in the system security plan; no out-of-band management on small form factor platforms; a capital event every five years, indefinitely. Consolidation: 24 distribution points, two per hub across 12 sites, 96,000-client capacity, regional pull DPs holding a targeted subset (estimated at 60% of the full library); "Consolidating to 24 servers cuts the component count to under 2 percent of 1,500," though the labor doesn't fall in strict proportion. Year 1 capital $9,983,224, which includes the SD-WAN transport that the Intune migration also needs. The 24-DP tier "consolidates the existing footprint; it doesn't expand it," consistent with the Intune-first onboarding decision in the devices book. "The 24-DP tier is the interim consolidated state, not a new floor."`,
  "Book 09, Chapter 11 (Why per-office distribution points are no longer the model; Target architecture; Year 1 capital).");
}

// ================================================================== 6 Target
{
  const s = content("The options", "The target: 12 hubs and 24 distribution points");
  tag(s, "What");
  img(s, "b09-network/ch11-hub-content-tier", "Two data centers, headquarters and the disaster recovery facility, each hold two standard source distribution points with the full content library, an SD-WAN control plane instance and internet breakout. Both feed ten regional hubs holding two pull distribution points each, twenty in all, with SD-WAN aggregation, regional breakout and security service edge enforcement. A capacity note reads 24 distribution points times 4,000 clients equals 96,000; about 70,000 endpoints, an assumption, is 73 percent utilization. The hubs connect over the SD-WAN overlay to about 1,500 field offices, each with a dedicated internet access circuit sized to seats, a 5G secondary path for continuity only, and no local distribution point; content stays local through peer caching, and cloud content arrives over the branch circuit.", 0.6, 1.5, 5.6, 5.0);
  table(s, "Target", 1.5, [2.25, 4.15], ["Element", "Target"], [
    ["Hubs", "12: two data centers and ten regional hubs, in existing facilities"],
    ["Content tier", "24 distribution points, two per hub: 2 + 2 standard, 20 pull"],
    ["Capacity", "96,000 clients; 73% used at 70,000 endpoints (assumption)"],
    ["Field office", "Internet circuit sized to seats, 5G continuity path, SD-WAN overlay, no local server"],
    ["Growth", "Add two DPs per 8,000 new endpoints, or above 3,200 clients per DP"],
  ], { x: 6.35, fontSize: 12.5 });
  sources(s, "Sources: Book 09, Ch 11 (Hub topology: 12 sites; Content tier: 24 distribution points; Branch network; Sizing trigger). Microsoft Learn.");
  notes(s,
`Chapter 11's hub topology: one primary data center (headquarters campus), one secondary (the existing disaster recovery facility) and ten regional hubs at existing regional offices, so no new real estate, power or accreditation boundary. Content tier: 70,000 endpoints (Assumption 2) at 4,000 clients per distribution point is a theoretical minimum of 18; 24 deployed gives 96,000-client capacity, 73% design utilization, 37% above the current estimate. Two standard source DPs at each data center hold the full library; 20 pull DPs at the regional hubs hold a targeted subset; "turns the fan-out problem into a 2-to-20 relationship instead of 1-to-1,500." Boundary groups must point each office at its regional hub's DPs, with the other hubs as fallback. Sizing trigger: add two distribution points per 8,000 net new managed endpoints, or when sustained load at any hub exceeds 3,200 clients per DP (80% of the published ceiling). Every office gets a direct internet access circuit sized to seat count and a 5G fixed-wireless secondary for continuity; the 5G path "won't carry a feature-update wave."`,
  "Book 09, Chapter 11 (Target architecture).");
}

// ================================================================== 7 Local content
{
  const s = content("The options", "Keeping content local without a branch server");
  tag(s, "What");
  table(s, "Peers", 1.5, [2.45, 5.0, 4.7], ["Mechanism", "What it does", "What to know"], [
    ["Configuration Manager peer cache", "Designated clients serve content to others in the same boundary group", "Source must be a domain-joined client; TCP 8003, UDP 8004"],
    ["BranchCache", "Switched on through client settings; used where the distribution point supports it", "An optimization, not a dependency"],
    ["Delivery Optimization", "Peers cloud content between devices; TCP 7680", "Default LAN mode suits an office with its own breakout; behind a hub, use Group mode"],
  ], { fontSize: 12 });
  panel(s, "Cache", 0.6, 4.2, 12.15, 2.25, HEX.amber, HEX.amberTint, "CONNECTED CACHE IN GCC", "The later step for cloud content", [
    "Stand-alone form: not excluded for a GCC tenant (Intune uses the commercial service); listed unavailable only in GCC High and DoD",
    "Needs its own host, in the same boundary, and an Azure subscription; devices need a Windows Enterprise E3 or E5 license",
    "Nothing in Phases 0 through 2 depends on it; if peers are blocked, offices pull from the hub",
  ], 12.5);
  sources(s, "Sources: Book 09, Ch 11 (Keeping content local without a server; Connected Cache at the hubs). Microsoft Learn: peer cache; Delivery Optimization; Connected Cache.");
  notes(s,
`Chapter 11: three peer mechanisms keep most bytes off the WAN, "optimizations, not dependencies: if any is blocked, clients pull from the hub over a circuit sized for it." Configuration Manager peer cache: clients enabled as sources serve content to clients in the same current boundary group; a source must be a domain-joined Configuration Manager client and refuses requests on low battery, above 80% CPU or under heavy disk I/O; peer downloads use HTTP or HTTPS on TCP 8003, with UDP 8004 for the Windows PE broadcast, not SMB. BranchCache: Configuration Manager can enable it on clients through client settings. Delivery Optimization: peers on TCP 7680; blocking that port disables peering but not downloads; the default LAN mode groups devices that share a public IP address, which is wrong while branch traffic still egresses at a hub; Microsoft's guidance for hub-and-spoke topologies is Group mode, restricting peer selection to the subnet, or both, with Group mode recommended for most organizations. Connected Cache: the stand-alone form runs on Windows Server 2022 or later, Windows 11 or Ubuntu 24.04, needs an Azure subscription and a host with nothing else on port 80, so it can't share a server with a distribution point; for a GCC tenant it is listed as not available only in GCC High and DoD; each device that downloads needs a Windows Enterprise E3 or E5 (or equivalent) license; the Azure resource that manages the caches has to be placed in the boundary analysis.`,
  "Book 09, Chapter 11 (Keeping content local without a server; Connected Cache at the hubs).");
}

// ================================================================== 8 Gates
{
  const s = content("The options", "A gate, not a date: retiring the last server");
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
  sources(s, "Sources: Book 09, Ch 11 (When to retire the last distribution point; A gate, not a date). Microsoft Learn: co-management workloads.");
  notes(s,
`Chapter 11: "The 24-DP tier is the interim consolidated state, not a new floor." Co-management has seven workloads; "Some workloads are on Intune" isn't the same claim as "the content tier can be decommissioned." Gate 1, app content: client apps and Office Click-to-Run workloads on Intune for the whole validated population, and no required or available deployment still published from Configuration Manager; switching the slider doesn't withdraw Configuration Manager deployments, which stay in Software Center and still download from a DP. Gate 2, update content: Windows Update policies and device configuration on Intune, and the software-update client setting turned off by hand (also Windows Autopatch's co-management prerequisite). Gate 3, OS provisioning: bare-metal imaging moved to Windows Autopilot, the most common reason a "just in case" DP survives. Gate 4, caching role: no Connected Cache instance on distribution-point hardware. Gate 5, compliance evidence: compliance and Endpoint Protection reporting no longer cite the site database. "An estate that closes all five gates in month 30 should retire its last distribution point in month 30. One that hasn't closed them by month 60 should keep the 24-DP tier rather than force a cutover against an open gate."`,
  "Book 09, Chapter 11 (When to retire the last distribution point).");
}

// ================================================================== 9 Cost
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
`Chapter 11, Year 1 capital: branch equipment $5,085,000 (750 Tier S, 525 Tier M and 225 Tier L edges, and 1,500 5G modules or gateways); hub equipment $1,048,224 (24 hub edges in high-availability pairs, 24 distribution point servers at $12,000, 24 Windows Server 2025 Standard 16-core licenses at Microsoft's $1,176 suggested price, hub switching and racks at 12 sites); control plane and services $3,850,000 (on-premises SD-WAN control plane at two sites $400,000; zero-touch staging for 1,500 sites $1,200,000; field installation at 300 sites $750,000; professional services $1,500,000). Total $9,983,224. Annual recurring at steady state: dedicated internet access $8,460,000 (750 at $350, 525 at $500, 225 at $800 per month); 5G $1,350,000; SD-WAN subscriptions $750,000 branch and $72,000 hub; analytics and control plane support $100,000; hub internet transit $432,000; security service edge licensing $4,550,000 (70,000 users at $65); total $15,714,000. Less MPLS retired, 1,500 at $1,200 a month (Assumption 1): −$21,600,000. Net annual position −$5,886,000: "the program returns about $5.9M a year against today's transport spend." The cost model prices distribution point hardware and licensing; it doesn't price compliance labor.`,
  "Book 09, Chapter 11 (Sizing and bill of materials; Cost model and sensitivity).");
}

// ================================================================== 10 Five-year and sensitivity
{
  const s = content("The case", "Five years out, and the one number that decides it");
  tag(s, "What");
  table(s, "Five year", 1.5, [0.75, 2.2, 1.05, 1.15, 1.3], ["Year", "Migration", "Capital", "Net savings", "Cumulative"], [
    ["1", "Design, hubs, pilot", "$10.0M", "$0", "−$10.0M"],
    ["2", "Begins at month 18 (5% average)", "$0", "$0.29M", "−$9.71M"],
    ["3", "40% average", "$0", "$2.36M", "−$7.35M"],
    ["4", "80% average; done by month 48", "$0", "$4.71M", "−$2.64M"],
    ["5", "Steady state", "$0", "$5.89M", { text: "+$3.25M", options: { bold: true, color: HEX.teal } }],
  ], { fontSize: 12.5 });
  table(s, "Sensitivity", 1.5, [1.75, 1.45, 2.3], ["MPLS per office, per month", "Net per year", "Character"], [
    ["$1,500", "−$11.29M", "Strongly cash-positive"],
    ["$1,200 (base)", "−$5.89M", "Cash-positive"],
    [{ text: "$873", options: { color: HEX.red } }, { text: "$0", options: { bold: true, color: HEX.red } }, { text: "Breakeven", options: { bold: true, color: HEX.red } }],
    ["$800", "+$1.31M", "Modest net cost"],
    ["$600", "+$4.91M", "Justify on capability"],
    ["$400", "+$8.51M", "Financial argument inverts"],
  ], { x: 7.25, fontSize: 12.5 });
  note(s, "Decides", 4.85, 1.55, "FaScaleBalanced", HEX.navy, "Against the refresh: ",
    "about $53.3M better over five years. The design holds on Microsoft's published limits; the cost case holds only once current MPLS cost is confirmed.");
  sources(s, "Sources: Book 09, Ch 11 (Five-year phased position; Sensitivity to current MPLS cost; Confidence statement). All figures are the chapter's assumptions.");
  notes(s,
`Chapter 11's five-year phased position: savings ramp as offices move to local transport at MPLS contract renewal, from month 18 to month 48; at an even pace the average share of offices on local transport is 5% in year 2, 40% in year 3 and 80% in year 4, with steady state in year 5. Year 1 design, hubs and pilot, $10.0M capital, cumulative −$10.0M; year 2, $0.29M net savings, −$9.71M; year 3, $2.36M, −$7.35M; year 4, $4.71M, −$2.64M; year 5, $5.89M, +$3.25M. "The refresh reaches −$50M in year one and recurs at the next refresh cycle. The five-year difference is about $53.3M." The comparison isn't scope for scope: the $10M also carries Microsoft 365, Teams, TIC 3.0 breakout and the Intune migration. Sensitivity: $1,500 per office per month, −$11.29M a year; $1,200 base, −$5.89M, capital repaid in about 20 months of steady-state savings; $873 breakeven ($15,714,000 ÷ (1,500 × 12)); $800, +$1.31M; $600, +$4.91M; $400, +$8.51M. Below breakeven the program is "still the better architecture and still cheaper than the refresh," justified on capability and mission. Confidence statement: the architectural conclusion holds across Assumptions 2 to 10; the financial conclusion depends on Assumption 1.`,
  "Book 09, Chapter 11 (Cost model and sensitivity; Assumptions to validate).");
}

// ================================================================== 11 Roadmap
{
  const s = content("The plan", "The roadmap: hubs first, offices at renewal");
  tag(s, "How");
  flow(s, "Phases", 1.5, 2.45, [
    { head: "Phase 0 · months 0–6", body: "About $1.8M: design, TIC 3.0 branch package, control plane, ten-site pilot, telemetry coordination started" },
    { head: "Phase 1 · months 6–18", body: "Twelve hubs: aggregation, regional breakout, security service edge, 24 consolidated DPs, content migration" },
    { head: "Phase 2 · months 18–48", body: "Office waves at MPLS renewal; each circuit retires only after its telemetry is confirmed" },
    { head: "Phase 3 · months 36+", body: "Microsoft 365 direct-path optimization; Connected Cache; DPs retire as gates close", color: HEX.amber, tint: HEX.amberTint },
  ], 12.5);
  table(s, "Phase 0 exit", 4.2, [3.0, 9.15], ["The first gate", "Phase 0 exits when"], [
    ["Exit criteria", "Authorization to operate for regional breakout; pilot sites stable for 30 days; validated per-site costs replacing the estimates"],
  ], { fontSize: 12.5 });
  note(s, "Order", 5.25, 1.2, "FaRoute", HEX.teal, "Why this order: ",
    "accreditation, not procurement, is the critical path. Hubs close three problems at once; office waves follow contract expiry, not geography.");
  sources(s, "Sources: Book 09, Ch 11 (Implementation roadmap; Why this order; Security and TIC 3.0).");
  notes(s,
`Chapter 11's roadmap. Phase 0, months 0–6: architecture and detailed design; the TIC 3.0 branch use-case package and accreditation; on-premises SD-WAN control plane; a ten-site pilot across all transport types and tiers; telemetry coordination started; serviceability survey. Exit: authorization to operate for regional breakout; pilot sites stable for 30 days; validated per-site costs replacing the chapter's estimates. Phase 0 is funded first, at about $1.8M over six months, out of the Year 1 total. Phase 1, months 6–18: twelve hubs, 24 consolidated distribution points, content library migration and prestaging, replacement telemetry. Exit: all hubs in production; office DPs in read-only fallback. Phase 2, months 18–48: office migration in waves keyed to MPLS renewal dates; each office's MPLS retired only after its replacement telemetry is confirmed; office DPs retired. Phase 3, months 36+: Microsoft 365 direct-path optimization in production (not informed network routing); Connected Cache at the hubs as Intune workloads shift; DPs retired as the gates close. Why this order: accreditation is the critical path; hubs first because aggregation, breakout and the content tier arrive in one capital event; waves follow contract expiry, avoiding early-termination liability; the final cutover is gated, not scheduled.`,
  "Book 09, Chapter 11 (Implementation roadmap; Why this order).");
}


const IMPL = "https://whalermike.github.io/modernization-workbook/docs/books/guides/dp-consolidation-implementation.html";
const KITURL = "https://github.com/WhalerMike/modernization-workbook/tree/main/examples/dp-consolidation";
const readStrip = (s, y) => T(s, "Links", [
  { text: "READ AND RUN   ", options: { bold: true, color: HEX.slate, fontSize: 11 } },
  { text: "Implementation guide: DP consolidation", options: { bold: true, color: HEX.navy, hyperlink: { url: IMPL, tooltip: "Implementation guide: DP consolidation" } } },
  { text: "   ·   ", options: { color: HEX.slate } },
  { text: "Scripts kit: examples/dp-consolidation", options: { bold: true, color: HEX.navy, hyperlink: { url: KITURL, tooltip: "Scripts kit: examples/dp-consolidation" } } },
], { x: 0.6, y, w: 12.15, h: 0.4, fontSize: 13.5, valign: "middle" });

// ================================================================== 12 Implementation 1 to 5
{
  const s = content("The plan", "Implementation 1 to 5: analyze, size, fund, build, peer");
  tag(s, "How");
  table(s, "Stages", 1.5, [2.7, 5.6, 3.85], ["Stage", "What happens", "Microsoft Learn"], [
    ["1  Analyze the estate", "Inventory every DP, its boundary groups and the clients per DP; pull WAN circuit cost and quality per office", "Boundary groups and distribution points; Install and configure distribution points"],
    ["2  Size against the limits", "Test the count against 4,000 clients per DP and the site limits: 18 at the ceiling, 24 with headroom", "Size and scale numbers for Configuration Manager"],
    ["3  Funding decision gate", "Phase 0 exit: the five questions answered, costs validated. Fund the hub tier, or stop", "Support for current branch versions"],
    ["4  Build the hub tier", "12 hubs, 24 DPs; regional pull DPs source from the data centers; distribution point groups; prestage the library", "Use a pull-distribution point; Deploy and manage content"],
    ["5  Turn on peer caching", "Peer cache in boundary groups, BranchCache, and Delivery Optimization in Group mode", "Peer cache for clients; Configure Delivery Optimization"],
  ], { fontSize: 12 });
  readStrip(s, 6.12);
  sources(s, "Sources: Microsoft Learn, as named in each row; Book 09, Ch 11 (Implementation roadmap; Keeping content local without a server). Stage 1's circuit data is a program step.");
  notes(s,
`Stage 1, analyze the existing estate: list every distribution point and its boundary groups (Microsoft Learn: "Assign each distribution point to at least one boundary group"; clients get content from distribution points associated with their boundary group, then neighbor groups by fallback), count clients per DP, and pull WAN circuit data per office, which is the program's step: Chapter 11's Assumption 1 (MPLS cost per office per month), Assumption 2 (managed endpoints, from the Configuration Manager device count) and the serviceability survey. Stage 2, size against Microsoft's limits: 4,000 clients per distribution point, 250 standard DPs plus 2,000 pull DPs per site, 25,000 clients per management point (Microsoft Learn, size and scale numbers); 70,000 endpoints need 18 at the ceiling and 24 with headroom. Stage 3, the funding decision gate, is Phase 0's exit: authorization for regional breakout, a stable pilot and validated per-site costs; Microsoft Learn's current-branch support page sets the lifecycle clock (each version supported 18 months). Stage 4, build the hub tier: pull-distribution points source content from other distribution points, distribution point groups manage content centrally, and prestaged content moves the library without sending it across the network. Stage 5, peer caching: Configuration Manager peer cache within a boundary group, BranchCache through client settings, and Delivery Optimization in Group mode for hub-and-spoke networks. The implementation guide and the scripts kit are linked on the slide; the guide and kit are owned by the content delivery work and were not available to check when this deck was built.`,
  "Microsoft Learn (boundary groups; size and scale; current branch support; pull-distribution points; peer cache; Delivery Optimization); Book 09, Chapter 11.");
}

// ================================================================== 13 Implementation 6 to 10
{
  const s = content("The plan", "Implementation 6 to 10: migrate, package, shift, retire");
  tag(s, "How");
  table(s, "Stages", 1.5, [2.7, 5.6, 3.85], ["Stage", "What happens", "Microsoft Learn"], [
    ["6  Office waves", "At MPLS renewal, point each office's boundary at its hub's group; the office DP goes read-only, then retires", "Boundary groups and distribution points"],
    ["7  Package with PSAppDeployToolkit", "One standard package, delivered by either tool; Intune Win32 apps install silently", "Win32 app management in Microsoft Intune"],
    ["8  Co-management shifts", "Move client apps, Office apps, Windows Update and device configuration to Intune", "Co-management workloads"],
    ["9  Connected Cache", "Add the cache at the hubs for cloud content as Intune workloads shift", "Microsoft Connected Cache with Configuration Manager"],
    ["10  Five gates, then retire", "Close all five gates; then retire the last DP, in whatever month that is", "Co-management workloads; Connected Cache"],
  ], { fontSize: 12 });
  readStrip(s, 6.12);
  sources(s, "Sources: Microsoft Learn, as named in each row; PSAppDeployToolkit (psappdeploytoolkit.com); Book 09, Ch 11 (When to retire the last distribution point).");
  notes(s,
`Stage 6, office waves: waves follow MPLS contract renewal, not geography (Chapter 11); each office's boundary joins a boundary group whose content sources are its regional hub's DPs, with other hubs as fallback; the office distribution point goes to read-only fallback and then retires, and no office's MPLS circuit is decommissioned until its replacement telemetry is confirmed (Microsoft Learn: boundary groups and distribution points, fallback). Stage 7, packaging with PSAppDeployToolkit, the follow-on: Microsoft Learn says Intune Win32 apps must install silently, and the app catalog has to move for Gate 1; the toolkit's site describes a framework to standardize deploying software to Windows, with first-class support for Intune and ConfigMgr. Stage 8, co-management shifts: the workloads that matter to content are client apps, Office Click-to-Run apps, Windows Update policies and device configuration (Microsoft Learn: co-management workloads); resource access is no longer a separate decision. Stage 9, Connected Cache: the Configuration Manager integrated cache runs on a distribution point with no other roles and serves only content for workloads that have moved to Intune; the stand-alone form needs its own host (Microsoft Learn: Microsoft Connected Cache with Configuration Manager). Stage 10, the five retirement gates: app content, update content, OS provisioning, caching role and compliance evidence; all closed, retire the last distribution point; any open, keep the tier. The implementation guide and the scripts kit are linked on the slide.`,
  "Microsoft Learn (boundary groups; Win32 app management; co-management workloads; Connected Cache); PSAppDeployToolkit site; Book 09, Chapter 11.");
}

// ================================================================== 14 Risks
{
  const s = content("The plan", "Risks, and the assumptions to check first");
  tag(s, "Why");
  const b = table(s, "Risks", 1.5, [3.4, 1.0, 7.75], ["Risk", "Rating", "Mitigation"], [
    ["Accreditation slips", { text: "High", options: { bold: true, color: HEX.red } }, "Start Phase 0 with the package; hub-only breakout is the fallback. A 12-month slip cuts the five-year net from about +$3.3M to −$2.6M, and the lead over the refresh to about $47.4M"],
    ["MPLS costs less than assumed", { text: "High", options: { bold: true, color: HEX.red } }, "Validate before submission; below $873, present the case on capability"],
    ["Telemetry lags cutover", { text: "High", options: { bold: true, color: HEX.red } }, "Coordinate from Phase 0; gate each office's MPLS retirement on it"],
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
`Chapter 11's risk register (selected). TIC 3.0 branch breakout accreditation slips, High: start Phase 0 with the accreditation package; fall back to hub-only breakout, "a defensible end state that still removes the per-office DP"; a 12-month slip that delays every migration wave moves the five-year net from about +$3.3M to about −$2.6M and the advantage over the refresh from about $53.3M to about $47.4M; "the case survives against the refresh, but breakeven moves beyond year five." Current MPLS cost below the assumption, High: validate before submission; below $873, re-present on capability; it stays cheaper than $50M. Replacement telemetry lags cutover, High. Encrypted throughput licensed below circuit speed, Medium. Twelve hubs concentrate risk, Medium. Others: segmentation blocking client-to-client traffic; terrestrial transport unavailable at 5–15% of sites; telecom task-order changes; control-plane hosting; security service edge authorization level; Connected Cache placement; indoor 5G coverage. Ten assumptions, ordered by impact: 1 MPLS $1,200; 2 endpoints 70,000; 3 library 1.5 TB; 4 seat distribution 750/525/225; 5 terrestrial availability 85–95%; 6 TIC 3.0 not yet authorized for branch breakout; 7 co-management early; 8 OS deployment centralized; 9 client-to-client traffic assumed blocked; 10 replacement telemetry onboarding not started.`,
  "Book 09, Chapter 11 (Risks and mitigations; Assumptions to validate).");
}

// ================================================================== 15 PSAppDeployToolkit
{
  const s = content("The plan", "Next: one standard package for ConfigMgr and Intune");
  tag(s, "How");
  panel(s, "Problem", 0.6, 1.5, 5.9, 3.0, HEX.red, HEX.redTint, "THE GAP · MICROSOFT LEARN", "Two delivery paths, two behaviors", [
    "Intune Win32 apps must install silently: no dialogs, no prompts",
    "Apps are prepared as .intunewin packages with the Content Prep Tool",
    "Gate 1 closes only when the app catalog moves, not when a slider does",
  ], 13);
  panel(s, "Fix", 6.75, 1.5, 6.0, 3.0, HEX.teal, HEX.tealTint, "THE FOLLOW-ON · DESIGN GUIDANCE", "Standard packaging with PSAppDeployToolkit", [
    "A PowerShell framework to standardize deploying software to Windows, at scale",
    "First-class support for Intune and ConfigMgr, with standard exit-code handling",
    "Pre, Main and Post phases; user dialogs with deferrals and countdowns",
  ], 13);
  note(s, "Once", 4.75, 1.65, "FaListCheck", HEX.navy, "Package once, deliver from either: ",
    "content behaves the same whether ConfigMgr or Intune delivers it. A follow-on to the decision, not a condition of it; application packaging belongs to the devices book.");
  txt(s, "Sources", [
    { text: "Sources: ", options: { italic: true, color: HEX.slate, fontSize: 10 } },
    { text: "PSAppDeployToolkit", options: { italic: true, color: HEX.slate, fontSize: 10, hyperlink: { url: PSADT, tooltip: "PSAppDeployToolkit" } } },
    { text: " (psappdeploytoolkit.com); Microsoft Learn: Win32 app management in Microsoft Intune; Prepare Win32 app content for upload; Book 09, Ch 11 (Gate 1).", options: { italic: true, color: HEX.slate, fontSize: 10 } },
  ], { x: 0.6, y: 6.62, w: 11.6, h: 0.32, fontSize: 10 });
  notes(s,
`Chapter 11 puts "application packaging" out of scope and leaves it to the devices book; this slide is the follow-on, labeled design guidance. Microsoft Learn, Win32 app management in Microsoft Intune: Win32 apps are deployed through the Intune management extension; "Microsoft Intune does not support interactive application installations. Applications deployed through Intune must install silently"; the Microsoft Win32 Content Prep Tool converts installation files to the .intunewin format; Learn also notes that cloud-connected customers can use Configuration Manager for Windows app management, while Intune-only customers have greater management capabilities for their Win32 apps. Chapter 11, Gate 1: switching the client apps slider doesn't withdraw Configuration Manager deployments, so the app catalog has to move, not just the slider. PSAppDeployToolkit's site describes it as "A PowerShell-based framework to simplify and standardize deploying software to Windows, at scale," with first-class support for Intune and ConfigMgr, standardized deployment flows and exit code handling, Pre, Main and Post phases, and branded user dialogs with deferrals and countdown timers. The claim that one package behaves the same under both tools is the program's design intent, to be proved in the Phase 0 pilot.`,
  "PSAppDeployToolkit site; Microsoft Learn (Win32 app management; Prepare Win32 app content); Book 09, Chapter 11 (Gate 1).");
}

// ================================================================== 16 The ask
{
  const s = content("The decision", "The ask: defer, decompose, validate, fund Phase 0");
  tag(s, "Who");
  panel(s, "Ask", 0.6, 1.5, 7.6, 3.05, HEX.navy, HEX.navyTint, "THE ASK · FROM CHAPTER 11'S RECOMMENDATION", "Defer, decompose, validate, fund Phase 0", [
    "Defer the $50M refresh pending a network modernization assessment",
    "Have the sponsor state acquisition or five-year cost, and itemize scope",
    "Validate the ten assumptions, starting with MPLS cost and endpoint count",
    "Fund Phase 0: about $1.8M over six months",
    "Track the five gates, not a date, for the last distribution point",
  ], 14);
  T(s, "Links", [
    { text: "READ THE DETAIL", options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } },
    { text: "Decision guide: DP consolidation", options: { bold: true, color: HEX.navy, hyperlink: { url: GUIDE, tooltip: "Decision guide: Content delivery modernization" }, breakLine: true } },
    { text: "Project plan: content delivery", options: { bold: true, color: HEX.navy, hyperlink: { url: PLAN, tooltip: "Project plan: Content delivery" }, breakLine: true } },
    { text: "Book 09, Chapter 11: the full worked case", options: { color: HEX.ink } },
  ], { x: 8.45, y: 1.6, w: 4.3, h: 2.9, fontSize: 13.5, paraSpaceAfter: 6 });
  const y = 4.8, h = 1.5;
  box(s, "Decision strip", 0.6, y, 12.15, h, "FFFFFF", HEX.navy);
  icon(s, "FaScaleBalanced", 0.8, y + (h - 0.72) / 2, 0.72, HEX.navy);
  T(s, "Decision text", [{ text: "FIRST GATE   ", options: { bold: true, color: HEX.navy } }, { text: "Phase 0 exit: authorization for regional breakout, a stable pilot, validated per-site costs" }],
    { x: 1.7, y: y + 0.08, w: 6.25, h: h - 0.16, fontSize: 14.5, valign: "middle" });
  T(s, "Decision owner", [{ text: "OWNER · DESIGN GUIDANCE", options: { bold: true, color: HEX.teal, fontSize: 11, breakLine: true } }, { text: "Sponsor, with the CIO" }],
    { x: 8.1, y: y + 0.08, w: 2.3, h: h - 0.16, fontSize: 13.5, valign: "middle" });
  T(s, "Decision when", [{ text: "WHEN · DESIGN GUIDANCE", options: { bold: true, color: HEX.amber, fontSize: 11, breakLine: true } }, { text: "Before refresh money is committed" }],
    { x: 10.5, y: y + 0.08, w: 2.15, h: h - 0.16, fontSize: 13.5, valign: "middle" });
  sources(s, "Sources: Book 09, Ch 11 (Recommendation; Position statement for a briefing; Implementation roadmap). Owner and timing are design guidance.");
  notes(s,
`Chapter 11's recommendation: 1, defer the $50M refresh pending a network modernization assessment; 2, ask the sponsor to state whether $50M is acquisition cost or five-year total cost of ownership and itemize scope beyond the distribution point; 3, validate the ten assumptions, starting with MPLS cost per office and the endpoint population; 4, fund Phase 0 (architecture, TIC 3.0 accreditation package, control plane, ten-site pilot) at about $1.8M over six months; 5, confirm the planned distribution point count when co-management completes, and the fiscal year; 6, put network modernization and content-tier consolidation under one program, since both resolve at the same twelve facilities; 7, track the five retirement gates, not the Phase 3 placeholder date. The first gate is Phase 0's exit criteria. Naming the sponsor with the CIO as owner, and "before the refresh money is committed" as the timing, is design guidance. The decision guide and the project plan are linked on the slide. The site is independent analysis, not an official government publication; no agency reviewed or endorsed it.`,
  "Book 09, Chapter 11 (Recommendation; Position statement for a briefing).");
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
    "Book 09, Chapter 11 — Field Office WAN Transformation: Microsoft Learn (Configuration Manager size and scale, release cadence and servicing, co-management workloads, peer cache, Delivery Optimization, Connected Cache); Microsoft Windows Server pricing; vendor data sheets for the costable example; FedRAMP Marketplace product data; CISA TIC 3.0 Branch Office Use Case.",
    "Microsoft Learn — Win32 app management in Microsoft Intune; Prepare Win32 app content for upload.",
    "PSAppDeployToolkit — psappdeploytoolkit.com.",
    "Every cost figure is Chapter 11's planning estimate, not a quote. The decision guide and project plan are linked on the last narrated slide. Full footnotes with links and access dates are in the chapter at whalermike.github.io/modernization-workbook.",
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
