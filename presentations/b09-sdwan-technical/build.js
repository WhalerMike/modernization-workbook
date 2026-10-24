// Book 09 — SD-WAN: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — Transport and the branch edge:   Module 1 (Ch01, Ch02, Ch05 transport physics and what SD-WAN can fix),
//                                              Module 2 (Ch02, Ch03, Ch05, Ch08, Ch12, App A the branch edge and TIC 3.0).
//   Part 2 — Governing and transforming:      Module 3 (Ch02, Ch05, Ch06, Ch08 securing and governing the fabric),
//                                              Module 4 (Ch10, Ch11, Ch13 the field-office transformation).
// Companion to presentations/b09-network-technical/, which covers SD-WAN at module level; this deck goes deeper
// and avoids repeating its slides.
// Build:  node presentations/b09-sdwan-technical/build.js presentations/b09-sdwan-technical/B09_SDWAN_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b09-network/; the notes name the chapter.
// Program positions are labeled "design guidance", the book's inferences "inference", the governed path
// "proposed", and the field-office figures "illustrative costs", as the chapters label them.
// Defensive content only. Narration: narration.json (spoken text) through presentations/_build/narrate.py.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 09", title: "SD-WAN — Technical Deep Dive" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "B09_SDWAN_Technical.pptx";

// ------------------------------------------------------------------ helpers
// Speaker notes with an automatic timing cue (narration runs ~142 words a minute).
const WPM = 142;
let clock = 0, words = 0, modWords = 0;
const modules = [];
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
const notes = (s, body, ref) => {
  const n = body.trim().split(/\s+/).length;
  const start = clock; clock += (n / WPM) * 60; words += n; modWords += n;
  s.addNotes(`[${mmss(start)}–${mmss(clock)}]  ${body.trim()}\n\nWorkbook: ${ref}`);
};
const endModule = (name) => { modules.push([name, modWords]); modWords = 0; };

// Titles: 58 characters at most, and unique across the deck (narration.json is keyed to them).
const titles = [];
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  if (titles.includes(t)) throw new Error(`duplicate title: ${t}`);
  titles.push(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };
// A short Sources line on every content slide (the backup slides carry the full lists).
const sources = (s, text) => {
  if (text.length > 185) throw new Error(`Sources line over 185 characters (${text.length}): ${text}`);
  return D.sources(s, text);
};

// A committed diagram placed inside a box, keeping the PNG's aspect ratio (read from its header).
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b09-network", "png");
const img = (s, name, alt, x, y, maxW, maxH) => {
  const file = path.join(DIAG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  if (process.env.FIT) console.log(`  image ${name}: ${w.toFixed(2)} x ${h.toFixed(2)}, bottom ${(y + h).toFixed(2)} in`);
  return { w, h, bottom: y + h };
};

// Rough fit check so tables and lists don't overflow (Calibri averages ~0.5 em per character).
const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

// A table whose row heights follow the text. rows: arrays of strings or {text, options}.
const table = (s, name, y, colW, headers, rows, o = {}) => {
  const pt = o.fontSize || 12.5;
  const lh = pt / 72 * 1.2;
  const cellText = (c) => (typeof c === "string" ? c : c.text);
  const rh = (r, bold) => Math.max(o.minRow || 0.34, Math.max(...r.map((c, k) => lines(cellText(c), colW[k], bold ? pt * 1.05 : pt))) * lh + 0.12);
  const hH = rh(headers, true);
  const rowH = [hH, ...rows.map((r) => rh(r))];
  const body = rows.map((r) => r.map((c, k) => {
    const base = typeof c === "string" ? { text: c, options: {} } : { text: c.text, options: Object.assign({}, c.options) };
    if (k === 0 && o.firstBold !== false) Object.assign(base.options, { bold: true, color: o.firstColor || HEX.navy });
    return base;
  }));
  const x = o.x != null ? o.x : 0.6;
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`${name} table`, o.limit != null ? bottom - o.limit + LIMIT : bottom);
  if (o.limit != null && bottom > o.limit + 0.01) console.warn(`  ! ${name} table runs past ${o.limit.toFixed(2)} in: bottom ${bottom.toFixed(2)} in`);
  if (process.env.FIT) console.log(`  table ${name}: bottom ${bottom.toFixed(2)} in`);
  return bottom;
};

// A tinted panel with a small caps label, a heading and bullets. Pass h = null to size it to its text.
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13.5) => {
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08;
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (h == null) h = need - y + 0.12;
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 16, fontFace: "Cambria", breakLine: true } });
  txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.12 });
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  if (need > y + h + 0.02) console.warn(`  ! ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  if (y + h - need > 0.6) console.warn(`  ~ ${name} panel has ${(y + h - need).toFixed(2)} in of slack`);
  warn(`${name} panel`, y + h);
  if (process.env.FIT) console.log(`  panel ${name}: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  return y + h;
};

// A full-width callout whose estimated text height is checked against its box.
const note = (s, name, y, h, iconName, color, label, text) => {
  const need = lines(label + text, 10.65, 16.5) * 16.5 / 72 * 1.2 + 0.1;
  if (need > h + 0.02) console.warn(`  ! ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  warn(`${name} callout`, y + h);
  callout(s, name, y, h, iconName, color, label, text);
};

// A row of step boxes joined by arrows.
const flow = (s, name, y, h, steps, pt = 12.5) => {
  const n = steps.length, gap = 0.28, w = (12.15 - gap * (n - 1)) / n;
  steps.forEach((st, i) => {
    const x = 0.6 + i * (w + gap);
    const c = st.color || (i % 2 ? HEX.teal : HEX.navy);
    box(s, `${name} ${i + 1}`, x, y, w, h, st.tint || (i % 2 ? HEX.tealTint : HEX.navyTint));
    txt(s, `${name} ${i + 1} text`, [
      { text: st.head, options: { bold: true, color: c, fontSize: pt + 2.5, fontFace: "Cambria", breakLine: true } },
      { text: st.body, options: { fontSize: pt } },
    ], { x: x + 0.12, y: y + 0.1, w: w - 0.24, h: h - 0.2, paraSpaceAfter: 3 });
    const need = 0.1 + lines(st.head, w - 0.24, pt + 2.5) * (pt + 2.5) / 72 * 1.2 + lines(st.body, w - 0.24, pt) * pt / 72 * 1.2 + 0.1;
    if (need > h + 0.02) console.warn(`  ! ${name} step ${i + 1} may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

// Module divider: a Title-master slide with the module's contents and running time.
const divider = (sec, title, sub, items, mins) => {
  const s = titleSlide(sec, title, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 7.2, h: 1.6, paraSpaceAfter: 3 });
  return s;
};

const P1 = "Part 1 — Transport and the branch edge";
const P2 = "Part 2 — Governing and transforming";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "SD-WAN: the technical deep dive", "Book 09 — transport physics, the branch edge, governing the fabric, and the field-office transformation");
  txt(s, "Session map", [
    { text: "Part 1 — Transport and the branch edge", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  Transport physics   ·   Module 2  The branch edge and TIC 3.0", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Governing and transforming", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Securing and governing the fabric   ·   Module 4  The field-office transformation", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.95, w: 9.0, h: 1.4, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the SD-WAN technical deep dive for Book 09 of the Federal Modernization Workbook, Network and Transport.

It runs in two parts of about twenty-five minutes, in four modules you can watch separately. Part 1 is transport and the branch edge. Module 1 is the physics: the propagation floor, route inflation, the latency tail and the path classes, and what SD-WAN can and can't do about each. Module 2 is the branch edge: what direct internet access plus SASE still leaves ungoverned, what the TIC 3.0 Branch Office Use Case asks of the steering policy, where SASE sits, the four egress patterns and the Microsoft 365 Optimize exemption. Part 2 is governing and transforming. Module 3 secures and governs the fabric: the controller's attack surface, the controls owed before traffic, the proposed governed path, the evidence the fabric must emit and what it owes the applications riding on it. Module 4 is a worked field-office transformation: hubs, a consolidated content tier, the bill of materials, the cost model and its sensitivity, the roadmap and gates, the long interim and the paired-branch study.

The book labels its figures, and so do the slides: design guidance for program positions, inference where the book infers, proposed for the governed path, and illustrative costs for the field-office model. Vendor names appear only where the book uses them.`,
  "Book 09, index; Chapters 01–03, 05, 06, 08, 10–13; Appendices A–B.");
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: three layers and one question");
  tag(s, "Why");
  const b = table(s, "Layers", 1.5, [2.15, 3.0, 2.85], ["Layer", "The question it answers", "What it closes"], [
    ["SD-WAN, the governor", "Which traffic takes which path, and how each path is doing", "SC-8 across circuits; the SC-7(4) flow policy; per-application telemetry (SI-4)"],
    ["SASE above it", "Is this flow allowed, and what is inside it, at a policy enforcement point", "Boundary, flow and malware: SC-7, AC-4, SI-3"],
    ["Governed path (proposed)", "Was the path itself authorized for this caller and this intent", "Gives SC-23, AC-12, SC-10 a mechanism that emits evidence"],
    ["The pipes underneath", "None of the protection questions", "One family: CP-8, telecommunications diversity"],
  ], { fontSize: 12 });
  panel(s, "Question", 8.75, 1.5, 4.0, null, HEX.red, HEX.redTint, "THE QUESTION THE SOURCES SKIPPED", "Who protects the governor?", [
    "One control plane with routing and policy authority over every branch",
    "A fleet of internet-facing edges replacing a few hardened egress points",
    "February 2026: an emergency directive for an SD-WAN control plane",
  ], 12.5);
  note(s, "Honest", b + 0.2, 6.45 - b - 0.2, "FaRoute", HEX.teal, "The honest claim: ",
    "SD-WAN takes a path down to the floor physics sets, with a tight tail. It never goes below the floor, and it inspects nothing.");
  sources(s, "Sources: CISA SASE guide v1.0 (June 2026); NIST SP 800-53 Rev. 5 (release 5.2.0); CISA ED 26-03; NIST SP 800-207. Book 09, Ch 02, 05.");
  notes(s,
`Why this matters. The governor is three layers, and each answers a different question, which is the frame for the whole session.

SD-WAN decides which traffic takes which path and measures how each path is doing. SASE decides whether a flow is allowed and inspects it at a policy enforcement point, which is where boundary protection, flow enforcement and malware inspection come from. The governed path, still a proposal in the program, asks whether the path itself was authorized for this caller and this intent, and records the answer. And the pipes underneath close exactly one control family, telecommunications diversity.

Sitting over all three is the question the book says its sources answered only briefly: who protects the governor? An SD-WAN deployment replaces a few hardened egress points with a fleet of internet-facing edges, one per office, and adds a management and control plane with authority over routing and policy for the whole estate.

So the honest claim is narrow. SD-WAN can take a path down to the floor physics sets and tighten its tail. It never goes below the floor, and it doesn't inspect content; the closures that matter most at a branch come from the layer above it.`,
  "Book 09, Chapter 05 — SD-WAN, SASE and Governed-Path Transport (introduction); Chapter 02, \"The governor: what the control layer contributes.\"");
}

// ================================================================== 3 Map
{
  const s = content("Orientation", "Four modules hung on one sequence");
  tag(s, "How");
  flow(s, "Sequence", 1.5, 1.75, [
    { head: "0 Governor secured", body: "Controls in place before it carries traffic", color: HEX.red, tint: HEX.redTint },
    { head: "1 Pipe", body: "Ordered on per-site measurements" },
    { head: "2 Governor live", body: "Inspecting and logging at the site" },
    { head: "3 Boundary", body: "Significant change decided before cutover" },
    { head: "4 Microsoft 365", body: "Optimize under its own SC-7(4) exception" },
    { head: "5 Evidence", body: "Registered; CLAW parity before a circuit ends" },
  ], 11.5);
  table(s, "Map", 3.5, [3.3, 1.75, 7.1], ["Module", "Chapters", "What you leave with"], [
    ["1 Transport physics", "01, 02, 05", "The floor and the gap, route inflation, path classes, tail tools and the transport menu"],
    ["2 The branch edge and TIC 3.0", "02, 03, 05, 08, 12, App. A", "Parity on every path, SASE placement, egress patterns per site, and the Optimize exemption"],
    ["3 Securing and governing the fabric", "02, 05, 06, 08", "The governor's controls, the governed path (proposed), fabric evidence, and what applications need"],
    ["4 The field-office transformation", "10, 11, 13", "Hubs and content tier, BOM and cost model, gates, the long interim and the paired-branch study"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (significant change); NIST SP 800-53 Rev. 5 (SC-7(4)); CISA SASE guide v1.0 (CLAW). Book 09, Ch 02, 13.");
  notes(s,
`Every module hangs off the book's order of operations, so here it is once, in the words this deck will use.

Step zero: bring the governor under vulnerability management, privileged-access control and off-box logging before it carries production traffic. Step one: buy the pipe on measured physics, meaning per-site latency and loss recorded before the order, not a carrier's marketing figure. Step two: the governor is live, inspecting and logging at that site, before production traffic moves. Step three: treat the boundary change as a significant change. NIST defines that as a change likely to substantively affect the security or privacy posture of a system, and it may trigger an event-driven authorization action. Decide it before the first production cutover. Step four: handle Microsoft 365 Optimize traffic through its own documented SC-7(4) exception. Step five: register the evidence, and confirm CISA telemetry parity through CLAW before any legacy circuit or MTIPS service ends.

The book is explicit that this is an engineering dependency, not a mandate: no OMB memorandum, CISA directive or executive order specifies the sequence, and saying so is what makes it survive review.

Module 1 is about step one, the physics the pipe is bought against. Module 2 is steps three and four at the branch edge. Module 3 is step zero and the evidence in step five. Module 4 runs the whole sequence through a worked field-office estate.`,
  "Book 09, Chapter 13, \"The decision sequence\" and \"The phases behind the sequence\"; Chapter 02, \"Order of operations.\"");
}
endModule("Orientation");

// ================================================================== 4 Module 1 divider
{
  const s = divider(P1, "Module 1: Transport physics, and what SD-WAN can fix", "Part 1 — Transport and the branch edge  ·  Chapters 01, 02, 05",
    ["The propagation floor, the addressable gap, and route inflation", "Lean and bulk path classes, and the tools that shrink the tail", "The transport menu, and the one control family a pipe closes"], 9);
  notes(s,
`Module 1: transport physics, and what SD-WAN can and can't fix.

Most SD-WAN claims fail in one of two directions. Some promise the impossible, a long path made faster than light in fiber allows. Others undersell the real benefit, which is mostly in the latency tail rather than the average. This module separates the floor, which nothing moves, from the gap above it, where SD-WAN does its work. It sets out how much of that gap path selection can actually recover, maps the lean and bulk path classes onto the data layer's consistency decision, goes through the tail tools and what each one costs, and ends with the transport menu: every underlay is a pipe, and a pipe closes one control family.`,
  "Book 09, Chapter 01 — Why Physics Decides the Architecture; Chapter 02; Chapter 05, \"SD-WAN as differentiated transport.\"");
}

// ================================================================== 5 Floor and gap
{
  const s = content(P1, "The floor and the gap: what engineering can reach");
  tag(s, "What");
  img(s, "ch01-propagation-floor", "Observed round-trip time splits into a red Propagation delay card, about 5 microseconds per kilometer of fiber, which engineering cannot reduce, plus a green Everything else card: queueing, congestion, jitter, loss and retransmits, and routes longer than the great circle, where optimization works. A table lists one-way and round-trip floors: metro 50 km 0.25 and 0.5 ms; cross-region 1,000 km 5 and 10 ms; New York to London 5,570 km 28 and 56 ms; New York to Singapore 15,330 km 77 and 153 ms. A note says these are straight-fiber minimums and measured internet round trips run several times the vacuum speed-of-light bound.", 0.6, 1.5, 6.2, 4.95);
  subhead(s, "Kinds head", "FOUR KINDS OF NUMBER: LABEL EVERY FIGURE", 7.1, 1.5, 5.65);
  const b = table(s, "Kinds", 1.85, [1.95, 3.7], ["Type", "Examples the book uses"], [
    ["Constant or standard", "Speed of light; G.114's 5 µs per km of fiber, and its 150 ms and 400 ms thresholds"],
    ["Arithmetic", "The floors table; the Seattle hairpin worked through northern Virginia"],
    ["Measurement", "The 2017 path-inflation study; an agency's own latency samples"],
    ["Design assumption", "The 1.5 route-length factor and the 5 ms inspection allowance"],
  ], { x: 7.1, fontSize: 12 });
  panel(s, "Gap", 7.1, b + 0.2, 5.65, null, HEX.teal, HEX.tealTint, "OPTIMIZATION ATTACKS THE GAP, NEVER THE FLOOR", null, [
    "A claim to beat a path's floor hasn't been checked",
    "A claim to shrink the gap can be true; judge it by measurement",
  ], 12.5);
  sources(s, "Sources: ITU-T G.114 (5 µs/km); NIST CODATA (speed of light); Bozkurt et al., Why Is the Internet so Slow?! (PAM 2017). Book 09, Ch 01.");
  notes(s,
`Wide-area round-trip time is two components with completely different physics, added together. Propagation delay is the time the signal takes to cover the distance in fiber, and engineering can't reduce it; it's fixed by the length of the path. Everything else, queueing, congestion, jitter, loss and retransmission, and routes longer than the great circle, is the gap between what an agency observes and that floor. Every SD-WAN technique in Chapter 05 works on the second component. None of them removes a microsecond of the first.

The planning value is ITU-T G.114's five microseconds per kilometer for optical fiber, about two-thirds of the vacuum speed of light, or roughly a millisecond per two hundred kilometers one way.

The table on the right is a discipline the book asks every agency document to follow. Network business cases fail review when they mix kinds of number, so each figure is a constant or standard, arithmetic anyone can recompute, a measurement with its method and population, or a design assumption the program chose and expects to replace. A figure with no label is treated as an assumption until someone shows otherwise.

So a proposal claiming to make a long path faster than its floor hasn't been checked, and a proposal claiming to shrink the gap can be true and should be judged by measurement.`,
  "Book 09, Chapter 01, \"The speed-of-light floor\" and \"Measurements, estimates and assumptions.\"");
}

// ================================================================== 6 Route inflation
{
  const s = content(P1, "Route inflation: the ratio that caps path selection");
  tag(s, "What");
  const b = table(s, "Inflation", 1.5, [3.3, 2.15, 2.15], ["Step", "Value", "Type"], [
    ["Internet pings against the vacuum light bound", "More than 3×", "Measurement (2017)"],
    ["Light in fiber alone", "About 1.5× vacuum", "Standard (G.114)"],
    ["So a measured internet path runs at", "About 2× the fiber floor", "Arithmetic"],
    ["UK South to East US, provider backbone median", "78 ms round trip", "Measurement (to July 30, 2026)"],
    ["London to the Virginia region, fiber floor", "About 62 ms (6,150 km)", "Arithmetic"],
    ["Managed backbone on that pair", "About 1.3× the floor", "Arithmetic"],
  ], { fontSize: 12 });
  panel(s, "Fiber", 8.4, 1.5, 4.35, null, HEX.navy, HEX.navyTint, "NO PRODUCT SHORTENS A FIBER PATH", null, [
    "A faster circuit raises throughput; it doesn't straighten the path",
    "Carrier topology isn't geometry: only measurement shows the route",
    "Local breakout is the only fix for the geographic term",
    "The inspection point has a location too",
  ], 12.5);
  note(s, "Cap", b + 0.2, 6.45 - b - 0.2, "FaChartLine", HEX.teal, "The ceiling on path selection: ",
    "steering lean traffic onto a premium underlay recovers the difference between an internet path and a backbone path, roughly 2× down to 1.3× the floor, and nothing below it.");
  sources(s, "Sources: Bozkurt et al. (PAM 2017); Microsoft Learn, Azure network round-trip latency statistics (30 days to July 30, 2026); ITU-T G.114. Book 09, Ch 01, 05.");
  notes(s,
`How much of the gap can path selection actually recover? The book answers with a ratio rather than a vendor claim.

A 2017 measurement study compared internet latencies with the speed-of-light bound along the great circle and found ping times more than three times that bound. Fiber alone accounts for about one and a half times the vacuum bound, so a measured path at three times vacuum is running at roughly twice the straight-fiber floor. The excess is route length, peering and queueing, and that's the recoverable part.

A premium backbone shows how much is recoverable. Microsoft publishes median round-trip times between its regions from continuous probes; in the dataset ending July 30, 2026, UK South to East US took a median 78 milliseconds. As the book's own arithmetic, London to the East US region in southern Virginia is about 6,150 kilometers great-circle, so the fiber floor for a round trip is about 62 milliseconds. A managed backbone runs about 1.3 times the floor on that pair. That ratio is the ceiling on what path selection can do for a cross-ocean flow: SD-WAN that steers latency-critical traffic onto a premium underlay recovers the difference between an internet path and a backbone path, and nothing below the floor.

The panel is Chapter 01's warning for buyers. Distance is the one latency variable a buyer controls, and it's controlled by where traffic goes, not by what it goes through.`,
  "Book 09, Chapter 05, \"Recovering route inflation\"; Chapter 01, \"No product shortens a fiber path.\"");
}

// ================================================================== 7 Path classes
{
  const s = content(P1, "Lean and bulk: path classes mirror the data layer");
  tag(s, "What");
  const im = img(s, "ch05-path-classes", "Latency-critical traffic (consensus heartbeats, leader election, synchronous-commit acknowledgements, clock synchronization, voice and sign-in) goes to a blue lean low-latency path; bulk traffic (snapshots, backups, re-sync, analytics replication, asynchronous log shipping, patch and content distribution) goes to a slate fat bulk path. Both lead to a green card of what SD-WAN buys: a better underlay that pulls route inflation toward the floor, a tighter tail through forward error correction, packet duplication and fast failover, and bulk transfers that can't starve latency-critical traffic. A red hard-ceiling card notes New York to London stays at least 56 ms per synchronous round trip.", 0.6, 1.5, 7.3, 3.6);
  panel(s, "Clock", 8.2, 1.5, 4.55, null, HEX.amber, HEX.amberTint, "THE CLOCK ANGLE", null, [
    "Spanner's TrueTime keeps clock uncertainty generally under 10 ms (GPS and atomic clocks)",
    "Commit wait: ordering costs bounded uncertainty, not a cross-continent round trip",
    "Design position: clock sync rides the lean class with consensus traffic",
    "SD-WAN helps by supporting a design that propagates less often",
  ], 12.5);
  note(s, "Align", im.bottom + 0.2, 6.45 - im.bottom - 0.2, "FaRightLeft", HEX.navy, "Align the two decisions: ",
    "what must be strongly consistent rides the lean path; what can be eventual rides bulk. When they agree, a design gets the best synchronization physics allows.");
  sources(s, "Sources: Corbett et al., Spanner (OSDI 2012); Microsoft Learn, TCP/IP performance tuning for Azure VMs (New York to London). Book 09, Ch 04, 05, 08.");
  notes(s,
`SD-WAN's basic move is differentiated transport: put each traffic class on the path built for it. The two classes map directly onto what a distributed database, and most branch traffic, actually emits.

The lean class is consensus heartbeats, leader election, synchronous-commit quorum acknowledgements and clock synchronization, and at a branch, voice, interactive sessions and sign-in. The bulk class is base snapshots, backups, re-sync after a partition, analytics replication and asynchronous log shipping, and at a branch, patch and content distribution.

The point the book makes is that this is the network layer's reflection of a decision the data layer already makes: what must be strongly consistent and what can be eventually consistent. When the two decisions agree, a design gets the best synchronization physics allows.

The clock angle is the less obvious one. Google's Spanner orders transactions with TrueTime, which exposes clock uncertainty explicitly and keeps it generally under ten milliseconds using GPS and atomic references; a coordinator makes a commit visible only after its timestamp is certain to be in the past, which the paper calls commit wait. Ordering then costs bounded clock uncertainty instead of an extra round trip across a continent. The program's design position is that clock synchronization traffic belongs in the lean class beside consensus traffic. SD-WAN helps the speed-of-light problem here by supporting a design that propagates less often, not by reducing propagation.`,
  "Book 09, Chapter 05, \"SD-WAN as differentiated transport\" and \"The clock angle\"; Chapter 08, \"The single design rule.\"");
}

// ================================================================== 8 Tail tools
{
  const s = content(P1, "Tail tools, and what each one costs");
  tag(s, "How");
  const b = table(s, "Tools", 1.5, [2.25, 4.4, 3.0, 2.5], ["Tool", "What it does", "What it costs or needs", "What it acts on"], [
    ["Forward error correction", "Sends parity so a lost packet is rebuilt at the receiver; one vendor's documented example sends one parity packet per four, always or above a loss threshold", "Bandwidth, traded for latency", "Retransmission waits that set p99"],
    ["Packet duplication", "Copies each latency-critical packet onto an alternate tunnel; the receiver keeps the first to arrive", "Multiple WAN links; positioned for voice and video on noisy links", "A lossy path setting the tail"],
    ["Fast path failover", "Continuous path-quality measurement moves a class off a degrading link", "Measurement on every path", "Degradation before TCP's own loss detection reacts"],
    ["Class separation", "Keeps a re-sync, backup or patch wave from queuing ahead of heartbeats, commit acknowledgements or a voice call", "A path policy per class", "Self-inflicted tail latency"],
  ], { fontSize: 12 });
  note(s, "Tail", b + 0.2, 6.45 - b - 0.2, "FaArrowDownWideShort", HEX.teal, "The leverage point: ",
    "a quorum commit waits for its slowest member, so commit latency is a p99 statistic. A path at three times the floor with a ragged tail can end near the floor with a tight one.");
  sources(s, "Sources: Cisco Catalyst SD-WAN Policies Configuration Guide 17.x (Forward Error Correction; Packet Duplication for Noisy Channels). Book 09, Ch 05.");
  notes(s,
`This is the underrated effect, and for synchronization the most valuable. A quorum commit waits for the slowest member it must hear from, so commit latency is a tail statistic, p99, and the tail is inflated by loss, congestion and jitter rather than by propagation.

Forward error correction sends redundant parity data so a lost packet can be rebuilt at the receiver without waiting for a retransmission. The book's documented example is one vendor's implementation: a parity packet for every group of four, which recovers up to one lost packet per group, sent always or only when measured loss crosses a threshold. It trades bandwidth for latency, and for a quorum gated by its unluckiest packet, removing retransmission waits can cut p99 commit latency far more than any reduction in the mean.

Packet duplication sends a copy of each latency-critical packet on an alternate tunnel, and the receiver keeps whichever arrives first, so a lossy path stops setting the tail. The vendor positions it for voice and video on noisy links, and it needs more than one WAN link.

Fast path failover uses continuous path-quality measurement to move a class off a degrading link before the transport protocol's own loss detection reacts.

And class separation keeps bulk off the commit path. A re-sync or backup can saturate a link and queue the small consensus packets behind it, which is self-inflicted tail latency, exactly during the heavy-transfer events that would otherwise destabilize a database.`,
  "Book 09, Chapter 05, \"Shrinking the tail,\" \"Keeping bulk traffic off the commit path\" and \"The hard ceiling.\"");
}

// ================================================================== 9 Transport menu
{
  const s = content(P1, "The transport menu: every underlay is a pipe");
  tag(s, "What");
  const b = table(s, "Menu", 1.5, [2.25, 3.2, 2.45], ["Transport", "Physics that decides its use", "Planning figure"], [
    ["Terrestrial fiber (DIA)", "Propagation plus route length; lowest latency for a distance", "5 µs per km (standard)"],
    ["Carrier MPLS", "Carrier topology, not geography; separation without encryption", "Measure per circuit"],
    ["Low earth orbit", "Short space path, plus ground station to exchange", "12 ms between earth stations, 400 km orbit"],
    ["Medium earth orbit", "Long space path (about 14,000 km)", "110 ms between earth stations"],
    ["Geostationary", "Space path alone exceeds the network's voice share", "260 ms between earth stations"],
    ["5G and LTE", "Radio plus carrier core; contention by cell and hour", "4 ms or 1 ms one way, radio only, unloaded"],
    ["Commodity broadband", "Shared access; asymmetric; contention varies", "Measure per site"],
  ], { fontSize: 11.5 });
  panel(s, "Closes", 8.75, 1.5, 4.0, null, HEX.navy, HEX.navyTint, "WHAT TRANSPORT CLOSES", "One family, CP-8", [
    "Diverse cellular plus local internet closes CP-8(2) at Moderate",
    "CP-8(3) provider separation is a High-baseline control",
    "Each new pipe is another SC-7(4) managed interface",
    "Treat vendor satellite or cellular latency as an assumption until measured",
  ], 12.5);
  sources(s, "Sources: ITU-T G.114; ITU-R M.2410-0 (IMT-2020); IETF RFC 4364; NIST SP 800-53 Rev. 5 and SP 800-53B (CP-8, SC-7(4)). Book 09, Ch 02, 03.");
  notes(s,
`Every transport is a pipe. Their physics differ enormously, and their contribution to the protection controls is the same, which is none.

Terrestrial fiber propagates at about five microseconds a kilometer plus route length, the lowest latency for a given distance. Carrier MPLS rides the same fiber, but its latency is set by the carrier's topology, not geography, so it has to be measured per circuit. And it's separation, not encryption: the MPLS VPN standard says the architecture doesn't by itself encrypt data or detect tampering in transit. G.114's planning values make the satellite point without vendor figures: twelve milliseconds between earth stations for a 400-kilometer orbit, 110 for medium orbit, 260 for geostationary, which alone exceeds the network's share of the voice budget. The 5G and LTE figures, four milliseconds for broadband and one for low-latency, are IMT-2020 minimum requirements for the radio interface alone, unloaded, with a single user. They say nothing about the end-to-end path through a carrier core to a cloud region.

What transport does close is diversity. CP-8 asks for alternate telecommunications services; CP-8(2) asks that they not share a single point of failure with the primary, and a field office with local internet plus a physically diverse cellular path closes it at Moderate. CP-8(3), provider separation, is a High-baseline control and isn't asserted in a Moderate package. And every additional circuit is another managed interface that SC-7(4) expects to have its own traffic-flow policy. Diversity closes one family and enlarges another; the governor keeps the second manageable.`,
  "Book 09, Chapter 02, \"The transport menu\" and \"The one control family transport closes\"; Chapter 03, control assertions table.");
}
endModule("Module 1");

// ================================================================== 10 Module 2 divider
{
  const s = divider(P1, "Module 2: The branch edge and TIC 3.0", "Part 1 — Transport and the branch edge  ·  Chapters 02, 03, 05, 08, 12, Appendix A",
    ["What DIA plus SASE leaves ungoverned, and parity on every path", "Where SASE sits, and choosing an egress pattern per site", "The Microsoft 365 Optimize exemption and its instruments"], 12);
  notes(s,
`Module 2: the branch edge and TIC 3.0.

Most agencies that have adopted local breakout paired it with a SASE service, and they're moving in the right direction. What that changes is where inspection happens. It doesn't change whether the stretch between the user and the point of presence is governed. This module starts there, then reads what the TIC 3.0 Branch Office Use Case actually asks of the steering policy, places SASE in CISA's own model, compares the four egress patterns and how to choose one per site, and ends with the narrowest and most argued decision at a branch: what happens to Microsoft 365 Optimize traffic, and the instruments that let an authorizing official accept it knowingly.`,
  "Book 09, Chapter 02, \"What DIA plus SASE still leaves out\"; Chapters 03, 05, 08 and 12; Appendix A.");
}

// ================================================================== 11 DIA plus SASE
{
  const s = content(P1, "What DIA plus SASE still leaves ungoverned");
  tag(s, "Why");
  const im = img(s, "ch02-branch-edge", "Two side-by-side columns. The red-outlined left column, common: inspection without transport governance, runs from branch users through a red static-router card (no application steering or QoS, no path-health measurement, no failover and no per-application telemetry) to one DIA circuit and a violet SASE point of presence offering SWG, CASB, FWaaS and ZTNA. The green-outlined right column, governed: a branch-edge policy layer, runs from branch users through a blue branch-edge card (application-aware steering and QoS, continuous path-health measurement, sub-second failover and per-application telemetry) to two circuits, DIA as primary and a second circuit or 5G, which both reach the same violet SASE point of presence.", 0.6, 1.5, 6.4, 4.95);
  panel(s, "Gaps", 7.3, 1.5, 5.45, 3.15, HEX.red, HEX.redTint, "A BRANCH WITH DIA AND NO EDGE LAYER HAS", null, [
    "No path selection: a degraded link short of an outage stays the path",
    "No application awareness: sign-in and backups forwarded alike",
    "No queue management where traffic enters the constrained link",
    "No concurrent use of two circuits; failover manual or absent",
    "No per-application transport telemetry, only interface counters",
  ], 12.5);
  panel(s, "Objections", 7.3, 4.8, 5.45, 1.65, HEX.navy, HEX.navyTint, "OBJECTIONS, ANSWERED", null, [
    "Redundant? It decides paths before the PoP; SASE inspects at it",
    "Riskier? Yes, so it comes under vulnerability management (Module 3)",
  ], 12.5);
  txt(s, "Stretch", [
    { text: "Governed where it matters: ", options: { bold: true, color: HEX.navy } },
    { text: "the user-to-PoP stretch is the most variable and least instrumented part of the path." },
  ], { x: 0.6, y: im.bottom + 0.15, w: 6.4, h: 6.45 - im.bottom - 0.15, fontSize: 13, valign: "middle" });
  sources(s, "Sources: CISA SASE guide v1.0 (June 2026); CISA TIC 3.0 Branch Office Use Case 3.0; CISA TIC 3.0 FAQ. Book 09, Ch 02, 05.");
  notes(s,
`This slide is the reason a branch-edge layer exists at all, once SASE is in place.

A branch with a direct internet circuit and a SASE service but no branch-edge policy layer has five gaps, on the left of the diagram. No path selection: one link is the path, and if it degrades through latency, jitter or partial loss short of an outage, nothing at the branch notices or moves traffic; a second link, if there is one, sits idle as cold standby. No application awareness: interactive database traffic, authentication, video calls, backups and patch downloads are all forwarded the same way. No queue management before the WAN: quality of service has to be applied where traffic enters the constrained link, so without a device there the agency's stated prioritization exists only in a document. And no per-application transport telemetry: interface counters say a link was busy, not which application saw which latency over which path, which is what a monitoring assertion about transport needs. And it can't use two circuits at once.

The governed branch on the right is no more secure at the point of presence. It's governed and measured between the user and the point of presence, and that stretch is the most variable, most user-proximate and least instrumented part of the path.

Three objections usually follow. It's redundant: no, the edge decides which traffic goes where before it leaves the building, while SASE inspects what arrives, and CISA's own definition treats them as complementary. It adds risk: it does, and Module 3 is the answer. It isn't authorized under our controls: ask which control it violates; FedRAMP doesn't prescribe the path to a service, and a refusal with no control basis is a governance problem in its own right.`,
  "Book 09, Chapter 02, \"What DIA plus SASE still leaves out\"; Chapter 05, \"What the branch edge adds.\"");
}

// ================================================================== 12 TIC parity
{
  const s = content(P1, "TIC 3.0 at the branch: parity on every path");
  tag(s, "What");
  const b = table(s, "Patterns", 1.5, [2.35, 4.3, 2.75], ["Security pattern", "Options for where enforcement happens", "What to note"], [
    ["Branch to sanctioned cloud", "Direct, with capabilities at the branch or the cloud provider so long as parity holds; via the campus; via a CASB or security-as-a-service", "Where Microsoft 365 is classified"],
    ["Branch to web", "The same three options", "The riskiest: \"the greatest rigor\" at the branch PEP"],
    ["Branch to campus", "A protected connection over a private link or shared infrastructure such as the internet", "The overlay's job"],
  ], { fontSize: 12 });
  panel(s, "Bind", 10.2, 1.5, 2.55, null, HEX.teal, HEX.tealTint, "SD-WAN IN TIC", null, [
    "Named once, as an example of a conveyance to govern",
    "Not a requirement",
  ], 12);
  panel(s, "Sentences", 0.6, b + 0.2, 7.3, 2.0, HEX.navy, HEX.navyTint, "TWO SENTENCES THAT BIND THE STEERING POLICY", null, [
    "Across redundant links or SD-WAN, path priorities, the order security functions run in and enforcement keep parity on every path",
    "Verify flows reach the right destinations, and that the points deciding can't be bypassed or manipulated",
    "Together: every path class lands on enforcement of equal strength; the steering decision is a security control",
  ], 12.5);
  panel(s, "Gate", 8.1, b + 0.2, 4.65, 2.0, HEX.amber, HEX.amberTint, "THE CRITICAL PATH", null, [
    "A circuit can be ordered in about a quarter",
    "An authorized breakout architecture takes far longer",
    "And CISA visibility must be preserved",
  ], 12.5);
  sources(s, "Sources: CISA TIC 3.0 Branch Office Use Case 3.0 (Sept. 2026; Sec. 6, Policy Enforcement Parity, Sec. 7.2.3); Security Capabilities Catalog 3.3. Book 09, Ch 03, 05, 11.");
  notes(s,
`What does TIC 3.0 actually ask of an SD-WAN policy? Two sentences, and they turn out to bind the steering decision itself.

The Branch Office Use Case, version 3.0, applies the catalog's ideas to three security patterns: branch office to an agency-sanctioned cloud service provider, branch office to the web, and branch office to the agency campus. Each offers options for where enforcement happens: direct connection with capabilities at the branch or at the cloud provider, so long as policy enforcement parity is ensured; routing through the campus; or routing through a CASB or other security-as-a-service provider. The web pattern is the riskiest, and the use case asks for the greatest rigor at the branch enforcement point for it.

The use case is also the one TIC 3.0 document that names SD-WAN, and it does so as an example. Where multiple means of conveyance are used, redundant links, SD-WAN and so on, path priorities, the order in which security functions execute and policy enforcement should ensure security parity on all conveyance paths, so an attacker can't evade protection by steering traffic onto a path with less rigor. Its networking guidance adds that agencies should verify flows go to the right destinations and that the points making that decision can't easily be bypassed or manipulated. Read together, those are a requirement on the SD-WAN policy: every path class lands on enforcement of equal strength, and the steering decision is a security control.

The amber panel is the planning consequence. Local breakout is gated on an authorized security architecture, not on circuits. And as branches connect directly, agencies must preserve CISA visibility.`,
  "Book 09, Chapter 03, \"What the catalog and the Branch Office use case require\"; Chapter 05, \"What the branch edge adds, and what TIC 3.0 asks of it\"; Chapter 11, \"Security and TIC 3.0.\"");
}

// ================================================================== 13 Placing SASE
{
  const s = content(P1, "Placing SASE: geography, listings and the EIS order");
  tag(s, "Who");
  const cols = [
    ["Model", HEX.navy, HEX.navyTint, "CISA'S NOTIONAL ARCHITECTURE", [
      "SWG, CASB and NGFW manage traffic to external resources",
      "SD-WAN manages and routes internal agency traffic",
      "ZTNA controls access to private applications",
      "The SASE solution sends telemetry to CLAW",
      "Branches arrive by device agent or a forwarding branch firewall",
    ]],
    ["PoP", HEX.amber, HEX.amberTint, "THE ENFORCEMENT POINT HAS A LOCATION", [
      "Ask for PoP locations near each office cluster",
      "Measure branch-to-PoP latency before cutover",
      "A distant or poorly peered PoP is a hairpin with another name",
      "No informed network routing in GCC Moderate: the SD-WAN's own measurements decide",
    ]],
    ["Buy", HEX.teal, HEX.tealTint, "BUYING IT", [
      "FedRAMP status is per offering; it covers the cloud plane, not edges in offices",
      "Read status from Marketplace data when the requirement is written",
      "GSA lists SD-WAN under EIS: fully managed, co-managed or do-it-yourself",
      "Confirm the EIS service and line items with GSA first",
    ]],
  ];
  const pb = Math.max(...cols.map((c, i) => panel(s, c[0], 0.6 + i * 4.1, 1.5, 3.95, 3.05, c[1], c[2], c[3], null, c[4], 12.5)));
  note(s, "Alone", pb + 0.2, 1.05, "FaShieldHalved", HEX.navy, "SD-WAN alone doesn't satisfy the use case: ",
    "the boundary, flow and malware closures come from the services above it.");
  sources(s, "Sources: CISA SASE guide v1.0 (Sec. 4–5, App. C); Microsoft 365 connectivity principles; FedRAMP Marketplace (Oct. 21, 2026); GSA, TIC and EIS pages. Book 09, Ch 05, 10.");
  notes(s,
`Where does SASE sit relative to the SD-WAN, and what do you check before naming one in a requirement?

CISA's June 2026 guide defines SASE as networking tools, with SD-WAN, routing and bandwidth optimization as examples, combined with a secure web gateway, a cloud access security broker, zero trust network access and a next-generation firewall. In its notional reference architecture, the gateway, broker and firewall manage traffic to external resources; SD-WAN manages and routes internal agency traffic; ZTNA controls access to private applications; and the SASE solution sends telemetry to CISA's Comprehensive Log Aggregation Warehouse. Branch offices reach the service either through agents on devices or through branch firewalls that forward traffic to it.

The enforcement point has a location, so choosing a SASE service is partly a geography decision. Microsoft's connectivity guidance says routing through a cloud security provider can hurt if the provider isn't well peered, and to evaluate the number and location of points of presence against branch offices and Microsoft's peering points. Ask for PoP locations near each office cluster, measure branch-to-PoP latency before cutover, and treat a distant PoP as a hairpin with a different name. For GCC Moderate tenants, Microsoft 365 informed network routing isn't available, so path selection rests on the SD-WAN's own measurements.

On buying: a FedRAMP listing covers the cloud-delivered management and service plane, while the edge appliances in each office are agency equipment inside the agency's boundary. GSA lists SD-WAN among the EIS services for the TIC 3.0 use cases, fully managed, co-managed or do-it-yourself, but its main EIS service list doesn't name SD-WAN separately, so confirm the service and line items with GSA and the EIS contractor before writing the requirement.`,
  "Book 09, Chapter 05, \"SASE above SD-WAN,\" \"The enforcement point has a location,\" \"Authorization status is not uniform\"; Chapter 10, \"The legacy transport vehicles have expired.\"");
}

// ================================================================== 14 Egress patterns
{
  const s = content(P1, "Four egress patterns, and choosing one per site");
  tag(s, "What");
  const im = img(s, "ch08-branch-architectures", "A table of four branch architectures. A, hairpin, in amber: the path runs from the branch to the campus or an MTIPS access point and then out; enforcement sits at the central access point; the boundary is assessed but every flow pays the detour. B, bare local breakout, in red: the branch goes straight to the internet; enforcement sits nowhere the agency controls; it is a regression, with egress outside any assessed boundary. C, governed local breakout, in green: an SD-WAN edge sends traffic to a nearby policy enforcement point and then the cloud; enforcement sits at the branch edge and the SASE point of presence; the boundary is assessed after the boundary change and per-application telemetry exists. D, agent-delivered SASE, in blue: a device agent forwards to the nearest point of presence; enforcement sits at the SASE point of presence, with an edge firewall for agentless devices; the boundary is assessed once point-of-presence proximity and telemetry are verified.", 0.6, 1.5, 8.3, 3.3);
  panel(s, "Map", 9.15, 1.5, 3.6, null, HEX.teal, HEX.tealTint, "AGAINST THE USE CASE", null, [
    "A is the campus option",
    "C is direct access plus a security service",
    "D is the security-service option, by agent",
    "B isn't an option: none lacks a PEP",
  ], 12.5);
  panel(s, "Constraints", 0.6, im.bottom + 0.2, 12.15, 6.45 - im.bottom - 0.2, HEX.navy, HEX.navyTint, "PER SITE (DESIGN GUIDANCE): CHOOSE A, C OR D FROM MEASURED LATENCY AND DEVICE MIX, NEVER B; AND WHATEVER THE PATTERN", null, [
    "Microsoft 365 Optimize traffic goes through its own documented exception, not an ad hoc bypass",
    "DNS must reach the agency resolver whatever the egress: a redirect-target decision on the edge",
  ], 12.5);
  sources(s, "Sources: CISA SASE guide v1.0 (legacy and notional architectures); CISA TIC 3.0 Branch Office Use Case 3.0 (Sec. 6.1–6.3); Microsoft 365 connectivity principles. Book 09, Ch 08.");
  notes(s,
`At a branch the question is where traffic leaves and what enforces policy when it does. The diagram compares the four patterns the book uses on path, enforcement, telemetry and boundary status.

A, the hairpin, is the TIC 2.0 shape: CISA's SASE guide lists backhaul contention and latency first among its costs. The boundary is assessed and the telemetry reaches CISA, but every flow pays the detour. B, bare local breakout, is a direct circuit and a router; it fixes latency and loses the boundary. C, governed local breakout, puts an SD-WAN edge at the branch that sends lean traffic to a nearby enforcement point, bulk where it's cheapest and campus traffic over the overlay, with enforcement split between the edge and a nearby SASE point of presence. It's the program's reference pattern. D, agent-delivered SASE, sends managed devices' traffic to the nearest point of presence wherever they are, with a branch firewall forwarding for devices that can't run an agent.

The right-hand panel maps them onto the use case's own options.

The design guidance is Decision 3 in Chapter 08: choose A, C or D per site from measured latency and the site's device mix, never B, and file the authorization-boundary change for local egress before the first production flow leaves locally. Whatever the pattern, two constraints apply: Microsoft 365 Optimize traffic needs its own documented exception, which is next, and DNS has to reach the agency's resolver whatever the egress, which on an SD-WAN edge is a redirect-target decision Book 08 covers.`,
  "Book 09, Chapter 08, \"Branch architectures\" and \"Decision 3 — choose the egress pattern per site, and change the boundary first.\"");
}

// ================================================================== 15 Optimize
{
  const s = content(P1, "Microsoft 365 Optimize: three sets, one exception");
  tag(s, "What");
  const im = img(s, "ch12-optimize-exemption-paths", "A branch site sends two kinds of traffic. Microsoft 365 Optimize endpoint sets 1, 31 and 11 (Exchange Online, SharePoint and OneDrive, and Teams media) leave by local direct internet access without TLS break-and-inspect, under an SC-7(4) exception whose steering log is the enforcement evidence, and reach the nearest Microsoft 365 front door, where TLS and SRTP protect the flow. Allow, Default and web traffic, including the Microsoft Entra sign-in endpoints, is backhauled over the overlay to the campus PEP, which keeps TLS inspection, the web gateway, the CASB and proxy-based tenant restrictions for sign-in. A separate box lists the preconditions on the exempt path: tenant restrictions v2 signaled from the Windows device, DNS resolution local to the branch egress, and branch telemetry reaching CISA services.", 0.6, 1.5, 7.4, 3.0);
  table(s, "Sets", 1.5, [0.55, 2.0, 1.85], ["ID", "Service", "Ports"], [
    ["1", "Exchange Online", "TCP 443, 80; UDP 443"],
    ["31", "SharePoint and OneDrive", "TCP 443, 80; UDP 443"],
    ["11", "Teams media (IP ranges only)", "UDP 3478–3481"],
  ], { x: 8.35, fontSize: 12, limit: im.bottom });
  const y = im.bottom + 0.2;
  panel(s, "Controls", 0.6, y, 6.0, 6.45 - y, HEX.red, HEX.redTint, "NAME THE CONTROLS, NOT \"INSPECTION FORGONE\"", null, [
    "SI-3, AC-4 and AU-3 (with AU-12) on the exempt flows",
    "SI-4(10) where selected: it's a High-baseline enhancement",
    "SC-8 isn't a gap: TLS, SRTP and the overlay",
  ], 12.5);
  panel(s, "Narrow", 6.75, y, 6.0, 6.45 - y, HEX.navy, HEX.navyTint, "NARROWER THAN MICROSOFT ASKS (DESIGN POSITION)", null, [
    "Microsoft asks to bypass inspection for all Required endpoints",
    "Sign-in (Allow, set 56) stays on the inspected path",
    "Teams media has no names: steer it by IP prefix",
  ], 12.5);
  sources(s, "Sources: Microsoft 365 endpoints (Worldwide, Aug. 14, 2026) and connectivity principles; NIST SP 800-53 Rev. 5 and 800-53B; TIC 3.0 Catalog 3.3. Book 09, Ch 12.");
  notes(s,
`A branch that reaches Microsoft 365 over local internet has to decide what happens to the traffic Microsoft classifies as Optimize. Microsoft says send it straight to Microsoft without proxies or TLS inspection; the agency's boundary says every flow passes an enforcement point that can see into it. Both positions hold up, so the gap is a decision somebody signs, not a setting someone quietly changes.

The category is small. In the Worldwide list, last updated August 14, 2026, it's three endpoint sets: Exchange Online, SharePoint and OneDrive, and Teams media. Two properties shape the design. Teams media is published as IP ranges only, no names, so the edge has to steer it by IP prefix. And Exchange and SharePoint use UDP 443 as well as TCP, and Microsoft lists blocking QUIC and forcing fallback to TCP among practices known to cause connectivity issues.

The program's exemption is narrower than Microsoft asks. Microsoft's principles recommend bypassing inspection for all Required endpoints, and its endpoint guidance says break-and-inspect is incompatible with both Optimize and Allow. Exempting only Optimize is a deliberate design position: it covers mailbox, document and media traffic and leaves sign-in, which is in the Allow category, on the inspected path.

Then name the controls rather than writing "inspection forgone." The exemption punctures SI-3 malicious code protection, AC-4 flow enforcement and AU-3 audit content, with AU-12 by reference, on those flows. SI-4(10), visibility of encrypted communications, is High-baseline, so in a Moderate system it's affected only if selected; record it either way. SC-8 isn't a gap: the flows carry TLS or SRTP, and the overlay encrypts the rest.`,
  "Book 09, Chapter 12, \"Microsoft's endpoint categories,\" \"What Microsoft actually recommends,\" \"Name the controls, not 'inspection forgone.'\"");
}

// ================================================================== 16 Exemption mechanics
{
  const s = content(P1, "Exemption mechanics: TRv2, egress ranges, three signers");
  tag(s, "How");
  subhead(s, "TR head", "TENANT RESTRICTIONS V2: WHICH SIGNALING SURVIVES THE BYPASS", 0.6, 1.5, 7.2);
  const b1 = table(s, "TRv2", 1.85, [2.85, 1.55, 1.9, 1.05], ["Signaling path", "Sign-in plane", "Data plane", "Proxy?"], [
    ["Corporate proxy header injection", "Yes", "No", "Yes"],
    ["Universal, via Global Secure Access", "Yes", "Microsoft Graph only", "No"],
    ["Windows device signaling", "Yes", "SharePoint and Exchange", "No"],
  ], { fontSize: 12 });
  const pre = panel(s, "Pre", 0.6, b1 + 0.2, 7.35, null, HEX.red, HEX.redTint, "PRECONDITION TO CUTOVER (DESIGN POSITION)", null, [
    "Device-side TRv2 verified from the endpoint; gaps listed",
  ], 12.5);
  const rb = panel(s, "Rules", 8.2, 1.5, 4.55, null, HEX.amber, HEX.amberTint, "EGRESS RANGES: RULES R1–R5", null, [
    "R1 the post-NAT public address, not the interface",
    "R2 a unique range per circuit",
    "R3 static and agency-assigned",
    "R4 verified from the branch itself",
    "R5 IPv6 listed where enabled",
    "In GCC Moderate the ranges serve the agency's steering, probes and evidence",
  ], 12.5);
  table(s, "Signers", Math.max(pre, rb) + 0.2, [3.3, 6.4, 2.45], ["Instrument", "Decides", "Signs"], [
    ["SC-7(4) exception memo", "Whether to grant, on named and compensating controls", "Authorizing official"],
    ["Attachment A, site register", "Sites, circuits, mission need and expiry: the exception record", "System owner"],
    ["Attachment B, architecture review", "TIC 3.0 conformance and where each PEP capability sits; accepts no risk", "Review board"],
  ], { fontSize: 12 });
  sources(s, "Sources: Microsoft Learn, tenant restrictions v2; Global Secure Access; network connectivity; NIST SP 800-53 Rev. 5 SC-7(4)(d)–(e); RFC 5737, RFC 3849. Book 09, Ch 12; App. A.");
  notes(s,
`The attack an assessor will build against the exemption is tenant-to-tenant exfiltration: a user signs in to a personal or hostile tenant and moves agency data over a path nobody inspects. Tenant restrictions v2 is the control, so which signaling path survives the bypass matters.

Microsoft documents three. Proxy header injection covers the sign-in plane only. Universal tenant restrictions through Global Secure Access covers sign-in on all platforms, and the data plane for Microsoft Graph only. Windows device signaling covers the data plane too, including SharePoint and Exchange. An Optimize-only exemption doesn't remove proxy sign-in enforcement, because sign-in is Allow traffic and still crosses the proxy. What it exposes is the data plane, such as a token copied in from another device, which proxy signaling never protected. So the program's position is that device-side TRv2, verified from the endpoint, with the devices and browsers it doesn't cover listed rather than assumed empty, is a precondition to cutover.

The decision needs three documents, each signed by the person whose question it answers. The authorizing official signs the SC-7(4) exception memo, which needs a mission need, a duration and a review cadence under items (d) and (e). The system owner signs Attachment A, the site register, which is the exception record itself. The architecture review board signs Attachment B, which determines conformance and accepts no risk.

The register's egress-range rules catch the errors that make a fabric look configured while attributing traffic to the wrong place: record the post-NAT address, a unique range per circuit, static agency-assigned ranges, verified from the site, and IPv6 too. In GCC Moderate those ranges aren't registered with Microsoft, because informed network routing and network connectivity aren't available; they serve the agency's own steering, probes and scope evidence.`,
  "Book 09, Chapter 12, \"Tenant restrictions,\" \"The three instruments,\" \"What's different for GCC-Moderate tenants\"; Appendix A, completion rules R1–R5 and admission checklist.");
}
endModule("Module 2");

// ================================================================== 17 Module 3 divider
{
  const s = divider(P2, "Module 3: Securing and governing the fabric", "Part 2 — Governing and transforming  ·  Chapters 02, 05, 06, 08",
    ["The governor's attack surface, and the controls owed before traffic", "The governed path (proposed) and the evidence the fabric must emit", "What the fabric owes the applications riding on it"], 11);
  notes(s,
`Module 3: securing and governing the fabric.

A paper that credits the governor with closing controls owes the reader the controls that protect it. That's how the book puts it, and this module takes it seriously. It walks the governor's attack surface component by component, against the 2026 directives that describe exactly this class of system, and turns step zero into a checkable control set. Then it looks forward, to the proposed governed path, and back to what applies today: the decision records and declarations every adapter on the fabric should produce. It ends with the obligations that run the other way, what the fabric owes the legacy and modern applications that ride on it.`,
  "Book 09, Chapter 05, \"Securing the controller and the edges,\" \"The governed path,\" \"The evidence the fabric must emit\"; Chapter 06.");
}

// ================================================================== 18 Attack surface
{
  const s = content(P2, "The governor's attack surface, piece by piece");
  tag(s, "Why");
  const im = img(s, "ch05-governor-attack-surface", "A dashed red cluster labeled control and management plane with estate-wide authority holds three slate cards: a manager that configures and provisions every edge, a validator that authenticates and onboards edges, and a controller that distributes routes and policy. Dashed red arrows run from the manager and controller to an amber card for internet-facing edges, one per office, replacing a few hardened egress points. That leads to a green card of controls owed to the governor: MFA for privileged access and logging of privileged functions, hardened configuration and component inventory, flaw remediation on BOD 26-04 windows, end-of-support replacement under BOD 26-02, and management-plane logs held off-box. A red card notes ED 26-03 in 2026, an actively exploited authentication bypass in a widely used SD-WAN manager and controller.", 0.6, 1.5, 5.6, 4.95);
  const b = table(s, "Directives", 1.5, [1.55, 4.75], ["Directive", "What it means for an SD-WAN fleet"], [
    ["ED 26-03", "Feb. 25, 2026 (V1 Mar. 11): Cisco Catalyst SD-WAN Manager and Controller; an authentication bypass (CVE-2026-20127) and a privilege escalation (CVE-2022-20775); SD-WAN syslog to CISA through CLAW"],
    ["BOD 26-02", "An edge device is on the boundary and reachable from the internet: every branch edge. End-of-support devices out on 12- and 18-month clocks; continuous discovery by 24 months"],
    ["BOD 26-04", "Remediation set by exposure, KEV presence, exploit automation and impact; the shortest window is three days. An internet-facing edge scores high on exposure by definition"],
  ], { x: 6.45, fontSize: 12 });
  panel(s, "Plan", 6.45, b + 0.2, 6.3, null, HEX.red, HEX.redTint, "THE PROGRAM'S WORKING ASSUMPTION", null, [
    "Edge flaws land in the shortest windows",
    "Fix branch patching before deploying several hundred edges",
  ], 12.5);
  sources(s, "Sources: CISA ED 26-03 and V1 (Feb. 25 and Mar. 11, 2026); CISA BOD 26-02 (Feb. 5, 2026); CISA BOD 26-04 (June 10, 2026). Book 09, Ch 02, 05.");
  notes(s,
`The governor's exposure is new in two ways. The control plane holds estate-wide authority: on the diagram, a manager that configures and provisions every edge, a validator that authenticates and onboards edges, and a controller that distributes routes and policy. Whoever controls it decides where every branch's traffic goes, including where DNS queries are redirected. And a fleet of internet-facing edges, one per office, replaces a small number of hardened, centrally staffed egress points.

CISA's 2026 directives describe exactly this. On February 25, 2026, Emergency Directive 26-03 covered Cisco Catalyst SD-WAN Manager, formerly vManage, and Controller, formerly vSmart: an authentication bypass that lets an unauthenticated remote attacker gain administrative privileges, and a privilege escalation. The book's point isn't that one vendor had a bad year; it's that an SD-WAN control plane is exactly the high-value, estate-wide target an emergency directive gets written about.

Two standing directives govern the fleet in normal times. BOD 26-02 defines an edge device as one on the boundary of an agency network and reachable from the public internet, which covers every branch edge; listed end-of-support devices come out on twelve- and eighteen-month clocks, with continuous discovery after twenty-four. BOD 26-04 revoked BOD 22-01 and 19-02 and replaced flat clocks with a risk model built on exposure, presence in the Known Exploited Vulnerabilities catalog, exploit automation and technical impact, with a shortest window of three days.

The program's working assumption follows: an internet-facing edge scores high on exposure by definition, so its vulnerabilities will land in the shortest windows. An agency that can't patch a branch appliance inside them has a problem to solve before it deploys several hundred.`,
  "Book 09, Chapter 05, \"Securing the controller and the edges\"; Chapter 02, \"The governor is itself attack surface.\"");
}

// ================================================================== 19 Step zero checkable
{
  const s = content(P2, "Step zero, made checkable: the governor's controls");
  tag(s, "How");
  const b = table(s, "Zero", 1.5, [2.05, 4.65, 1.95, 3.5], ["Area", "Program design position", "SP 800-53", "Evidence to ask for"], [
    ["Management plane", "Named administrators, phishing-resistant MFA, least privilege; interfaces off the internet or behind a separate PEP (BOD 23-02)", "AC-2, AC-6, IA-2(1), SC-7", "External scans; the management access path; PEP policy"],
    ["Edge onboarding", "Certificate onboarding from the agency PKI; validator allow-list; alert on unexpected peers", "IA-3, CM-8", "Validator allow-list against the fleet inventory"],
    ["Configuration", "Hardened baseline and least functionality; a routing-policy change is a reviewed change, not a console edit", "CM-2, CM-6, CM-7", "Drift detection against the controller's intended state"],
    ["Flaws and lifecycle", "Remediation inside BOD 26-04 windows; BOD 26-02 replacement and continuous discovery", "SI-2, SA-22, CM-8", "Every edge listed with software version and support date"],
    ["Logging", "Controller audit, policy changes and edge events off-box, and to CISA where directed", "AU-2, AU-6, AU-9, AU-12", "An ED 26-03-style inventory, log pull and patch within a day"],
    ["Cloud control plane", "Its own authorization status and boundary disposition recorded in the package", "CA-3, SA-9", "Disposition: in-boundary, named exception or compensating"],
  ], { fontSize: 11 });
  note(s, "Spec", b + 0.15, 6.45 - b - 0.15, "FaClipboardCheck", HEX.teal, "Also in every edge specification: ",
    "PQC-capable key exchange (M-26-15) and a stated FIPS 140-3 expectation.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5; CISA BOD 23-02, 26-02, 26-04, ED 26-03; OMB M-26-15; NIST CMVP FIPS 140-3 transition. Book 09, Ch 02, 03, 05, 08, 10.");
  notes(s,
`Step zero is easy to say and hard to verify, so this slide makes it checkable. The positions are the program's design guidance from Chapters 02 and 05; the right-hand column is the evidence the book says an assessor or reviewer can ask for.

Management-plane access goes to named administrators with phishing-resistant multifactor authentication and least privilege, and the management interfaces themselves aren't reachable from the internet. BOD 23-02 already requires that for routers, firewalls and similar devices, with a separate policy enforcement point as the preferred action. Configuration has a hardened baseline and least functionality, so a change to agency-wide routing policy is a reviewed change, not a console edit, and drift across hundreds of edges is detected against the controller's intended state.

Flaws and lifecycle run on the federal clocks: BOD 26-04 windows for remediation, BOD 26-02 for replacement and continuous discovery. The check from Chapter 08's Decision 4 is concrete: the fleet inventory lists every edge with its software version and support date, and the agency could execute an ED 26-03-style inventory, log collection and patch sequence within a day. Logging of the governor itself, controller audit records, policy changes and edge events, goes off the devices to the agency pipeline and to CISA where a directive requires it. And a cloud-hosted controller needs its own authorization status and an explicit boundary disposition in the package.

Two attributes belong in every edge specification. M-26-15 requires infrastructure that terminates TLS or IPsec to support post-quantum key exchange. And since all FIPS 140-2 certificates moved to the Historical List on September 22, 2026, acquisition documents written now should state the FIPS 140-3 expectation rather than inherit an older one.`,
  "Book 09, Chapter 05, controls table; Chapter 02, \"The governor is itself attack surface\"; Chapter 08, Decision 4; Chapter 10, \"BOD 26-02 pulls the refresh forward.\"");
}

// ================================================================== 20 Governed path
{
  const s = content(P2, "The governed path: leased per intent (proposed)");
  tag(s, "What");
  img(s, "ch05-overlay-tunnel", "An edge device emitting identity, posture and application context has two paths. To the left, a red card for today's flat Layer-3/4 LAN lists no local breakout, no identity-aware routing, session trust that a hijack inherits, and resulting transport drift the program can't explain. To the right, a blue card for the proposed application-aware overlay: an OverlayTunnel is leased, not opened, carries identity, application, posture, location, token, lease and certificate chain, and its lease is bounded by a short-lived, audience-scoped token. It leads to a green card where the path becomes evidence: local breakout, identity-aware routing and per-intent authorization. A violet lane-discipline card states the program observes, reconciles and emits evidence but does not route packets or terminate tunnels.", 0.6, 1.5, 6.2, 4.95);
  const fb = panel(s, "Flat", 7.1, 1.5, 5.65, null, HEX.red, HEX.redTint, "PROPOSED, NOT RATIFIED  ·  WHY A FLAT LAN CAPS THE EDGE", null, [
    "No app-aware breakout: the edge's efficiency is spent on the detour",
    "No identity-aware routing: its identity signals have nowhere to land",
    "No per-call authorization: a hijacked session inherits the trust",
  ], 12.5);
  panel(s, "Lane", 7.1, fb + 0.2, 5.65, null, HEX.navy, HEX.navyTint, "DRIFT AND LANE DISCIPLINE", null, [
    "DRIFT-TRANSPORT: a flow with no issuing token is P2; path against canonical binding is P4",
    "Adapters observe, reconcile and emit evidence; they don't route packets",
  ], 12.5);
  sources(s, "Sources: NIST SP 800-207 (tenet 3); AWS RDS IAM authentication; Microsoft Learn, PostgreSQL Entra auth FAQ; SPIFFE overview; NIST SP 800-53 Rev. 5. Book 09, Ch 05.");
  notes(s,
`This slide is forward-looking, and the book labels it that way: it rests on the program's decision on application-aware networking and a token-bound transport plane, whose status is Proposed, with its implementing specifications still open. Read it as where the architecture is going, not where it has arrived.

The starting point is an efficient edge device: identity-anchored, emitting telemetry, compliant with policy. Put it on a flat datacenter LAN that isn't application-aware and its value is bounded three ways. Without local breakout and application-aware path selection, traffic hairpins and the device's efficiency is spent on the detour. Without identity-aware routing, every flow is treated alike, so its identity signals have nowhere to land. And without per-call authorization, trust collapses into a long-lived session, so a hijacked session inherits it. The program can then govern what runs and who runs it, but not how it gets there.

The proposal's answer, on the right of the diagram, is an overlay in which the path is a typed, governed object carrying identity, application, posture, location, token, lease and certificate chain. Tunnels are leased, not opened: the lease is bounded by a short-lived, audience-scoped token. It's the data-plane move, a fresh scoped credential per connection, transposed onto the network.

It also names a sixth drift class: a tunnel or flow observed with no issuing token is a P2 finding, and variance between the canonical organizational and location binding and the observed path is P4.

And lane discipline: the program's stake is governance, not packet forwarding. Adapters observe, reconcile and emit evidence; they don't route packets or terminate tunnels, and the agency runs whatever fabric it chooses.`,
  "Book 09, Chapter 05, \"The governed path\": \"An efficient edge device is necessary, not sufficient,\" \"Leased, not opened,\" \"A flat LAN is a drift generator,\" \"Lane discipline.\"");
}

// ================================================================== 21 Fabric evidence
{
  const s = content(P2, "The fabric's evidence: records, declarations and drift");
  tag(s, "How");
  const b = table(s, "Drift", 1.5, [1.6, 3.4, 3.2], ["Drift", "SD-WAN example", "SASE example"], [
    ["Schema", "Controller policy schema diverges from the canonical shape", "Vendor policy schema diverges from the canonical shape"],
    ["Provenance", "Telemetry chain breaks between site, controller and program, most often at a boundary crossing", "Overlay certificate fails to bind to an identity-plane object"],
    ["Authorization", "A policy decision emitted outside its declared scope", "A decision recorded outside the consent envelope"],
    ["Semantic or identity", "A service-level class means different things to controller and model", "The PDP gets an identity claim it can't resolve: halt and alert"],
  ], { fontSize: 12 });
  panel(s, "Declare", 9.0, 1.5, 3.75, null, HEX.teal, HEX.tealTint, "EACH ADAPTER DECLARES", null, [
    "A mission class: enforcement, telemetry or integration",
    "A class: modernization or conformance",
    "A boundary disposition; none fits, an authorizing decision first",
  ], 12.5);
  note(s, "Limits", b + 0.2, 6.45 - b - 0.2, "FaListCheck", HEX.amber, "Limits, stated (illustrative schema): ",
    "some telemetry is proprietary and some PDPs emit no records; synthesize from logs and label them derived.");
  sources(s, "Sources: program SD-WAN and SASE adapter specifications as summarized in Book 09; NIST SP 800-53 Rev. 5 (SC-7(4), SI-4). Book 09, Ch 05, 08, 13.");
  notes(s,
`Whether or not the governed path is adopted, this part applies now. The program's modernization specifications for SD-WAN and SASE set one contract for any adapter that observes them. Both consume identity from the identity plane rather than keeping a parallel identity store. The SASE overlay binds to certificates issued against identity-plane objects, not to per-device pre-shared keys or location-based trust. And every decision is a record with full provenance: for SD-WAN, which controller decided, the decision kind, path selection, failover, steering or QoS, source and destination, the selected path, the identity context, the service-level class, the policy references and the time; for SASE, the decision point, permit, deny or escalate, the resource scope, the overlay, the certificate thumbprint, the policy and the time. The book marks those field names as an illustrative schema, design positions rather than a vendor API.

Each adapter also declares a mission class, a class, and a boundary disposition.

The table is the drift those specifications watch for. Schema drift is a vendor policy diverging from the canonical shape. Provenance drift is a broken telemetry chain, most often at a boundary crossing, or an overlay certificate that doesn't bind to an identity object. Authorization drift is a decision emitted outside its declared scope. Semantic or identity drift is a service class that means different things to two systems, or a claim the decision point can't resolve, which halts and alerts.

The specifications are candid about limits: vendor maturity in government boundaries varies, some path telemetry is proprietary, and some decision points emit no records, so records may be synthesized from logs and labeled derived. Chapter 08's Decision 5 is the test: for a sample branch and application, produce the path, the latency, the policy that chose it and the PEP that inspected it, for any hour in retention.`,
  "Book 09, Chapter 05, \"The evidence the fabric must emit\"; Chapter 08, \"Decision 5 — make the path evidence.\"");
}

// ================================================================== 22 What the fabric owes applications
{
  const s = content(P2, "What the fabric owes the applications riding on it");
  tag(s, "How");
  const b = table(s, "Owes", 1.5, [2.2, 5.05, 4.9], ["Property", "Why it matters", "What the fabric has to do"], [
    ["Address continuity", "A path change doesn't break TCP sequence numbers; egress through a different NAT changes the address the server sees, and TCP resets the connection", "Deterministic egress: a stable, documented source address per branch, usually a NAT decision"],
    ["A defined DC path", "First logon, service tickets, SYSVOL, password change and hybrid join need a domain controller; hide it and Windows falls back to NTLM silently", "Carry DC traffic on a private path or the overlay, a ZTNA connector or a KDC proxy; Entra join removes it"],
    ["A stable location signal", "Microsoft names SD-WAN and load-balanced source NAT among causes of IP variation between sign-in and resource traffic", "Dedicated, enumerable egress for both; otherwise CAE enforces critical events only, on one-hour tokens"],
    ["Identity traffic priority", "Small authentication exchanges in an unmanaged queue wait behind a backup job", "Classify and prioritize identity traffic where it enters the constrained link"],
    ["Effective MTU", "Classic path MTU discovery needs ICMP \"packet too big\"; filtered, connections hang instead of failing", "Test for black holes when a path changes: a stalled transfer, not an outage"],
  ], { fontSize: 11.5 });
  note(s, "Rule", b + 0.2, 6.45 - b - 0.2, "FaRoute", HEX.teal, "The operative property is address continuity: ",
    "the one transport remedy here that a branch-edge layer actually delivers.");
  sources(s, "Sources: RFC 9293, RFC 4120, RFC 4821; Microsoft Learn: Kerberos KDC keys, hybrid join, Private Access Kerberos SSO, MS-KKDCP, CAE, strict location. Book 09, Ch 06, 10.");
  notes(s,
`The obligations run the other way too. A fabric that re-routes branch traffic owes the applications on it five properties, and Chapter 06 is careful to give the documented mechanisms rather than the folklore.

Address continuity first. A TCP connection is defined by its pair of sockets, and its sequence numbers live in endpoint state, so a path change alone doesn't break it. What breaks an established connection is a change in the address the server sees: if the new path egresses through a different NAT, the segments no longer match and TCP's reset processing tears it down.

A defined domain controller path. Five operations genuinely need one: first logon, service tickets for on-premises services, Group Policy from SYSVOL, password change, and hybrid join. A branch on local breakout reaches its DCs only over whatever private path the agency provides, and if it's missing, Windows silently falls back to NTLM. Carry DC traffic on a private path or the overlay, publish the DCs through a ZTNA connector, noting its single sign-on scope, or use a KDC proxy; the durable answer is Entra join.

A stable location signal. Microsoft names SD-WAN deployments and source NAT across load-balanced egress among the causes of IP variation between what Entra ID and the resource see. With dedicated, enumerable egress for both, continuous access evaluation enforces location changes on long-lived tokens; without it, critical events only, and tokens fall back to an hour.

Then two smaller ones: prioritize identity traffic where it enters the constrained link, and test for MTU black holes after a path change, which present as stalled transfers rather than outages.`,
  "Book 09, Chapter 06, \"What actually breaks,\" \"Address continuity, not sequence continuity,\" \"Kerberos: the real dependencies,\" \"Where transport actually matters.\"");
}
endModule("Module 3");

// ================================================================== 23 Module 4 divider
{
  const s = divider(P2, "Module 4: The field-office transformation", "Part 2 — Governing and transforming  ·  Chapters 10, 11, 13",
    ["A distribution-point refresh tested against a WAN program", "Hubs, content tier, BOM, cost model, roadmap and gates", "The long interim, the refresh fork and the paired-branch study"], 17);
  notes(s,
`Module 4: the field-office transformation.

This is the book's worked case, and it's a framing pattern, not a real engagement. The estate is one many civilian agencies will recognize: about 1,500 field offices, about 70,000 managed Windows endpoints, branch traffic on MPLS to a central gateway, and a Configuration Manager distribution point in nearly every office because the circuit was once too slow for anything else. A proposal asks for about fifty million dollars to refresh them. Every cost figure in this module is a planning estimate from the program's own analysis, labeled as an assumption, not a quote. The module tests the request, sets out the alternative, and then steps back to the interim most agencies are actually in, and to how a cost case gets proved.`,
  "Book 09, Chapter 11 — Field Office WAN Transformation; Chapter 10 — The Long Interim; Chapter 13 — Sequencing, Cost and Evidence.");
}

// ================================================================== 24 The case
{
  const s = content(P2, "The case: 1,500 distribution points, or the WAN");
  tag(s, "Why");
  subhead(s, "Cost head", "UNIT COST RECONCILED (PLANNING PRICES, ASSUMPTIONS)", 0.6, 1.5, 5.75);
  const b1 = table(s, "Unit", 1.85, [3.1, 1.25, 1.4], ["Configuration", "Per office", "× 1,500"], [
    ["Small form factor PC", "$3,500", "$5.3M"],
    ["1U server, ECC, out-of-band", "$12,000", "$18.0M"],
    ["1U server plus deployment", "$16,000", "$24.0M"],
    [{ text: "Proposed estimate", options: { bold: true } }, { text: "$33,333", options: { bold: true } }, { text: "$50.0M", options: { bold: true } }],
  ], { fontSize: 12 });
  subhead(s, "Limit head", "MICROSOFT'S PUBLISHED LIMITS DECIDE THE COUNT", 6.6, 1.5, 6.15);
  const b2 = table(s, "Limits", 1.85, [2.85, 1.05, 2.25], ["Constraint", "Limit", "At this scale"], [
    ["Clients per distribution point", "4,000", "18 at the ceiling; 24 with headroom"],
    ["Standard DPs per site", "250", "1,500 needs pull DPs"],
    ["Clients per management point", "25,000", "At least three, wherever DPs sit"],
    ["Windows clients per stand-alone primary", "150,000", "70,000 fit in one site"],
  ], { x: 6.6, fontSize: 12 });
  const b = Math.max(b1, b2);
  note(s, "Gap", b + 0.2, 6.45 - b - 0.2, "FaServer", HEX.amber, "The other 1,476 compensate for transport: ",
    "they serve no Configuration Manager requirement. The role isn't obsolete; one per office is.");
  sources(s, "Sources: Microsoft Learn, Configuration Manager size and scale, DP prerequisites, release cadence (2609); program planning prices (assumptions). Book 09, Ch 11.");
  notes(s,
`The request is about fifty million dollars to refresh distribution point hardware across about 1,500 offices, which is $33,333 an office. The program's reconciliation, using its own planning prices, puts a right-sized small-form-factor PC at $3,500, a server-class 1U box with ECC memory, out-of-band management and redundant power at $12,000, and that server plus $4,000 of field installation at $16,000, or $24 million across the estate. The proposal is about twice the fully loaded server case. So the first ask is a decomposition: is fifty million acquisition cost or five-year total cost of ownership, and what scope beyond the distribution point is bundled in?

Then the timing. Microsoft has moved Configuration Manager to an annual release cadence starting with 2609, says Intune is where new device-management innovation happens, and keeps Configuration Manager serving on-premises devices. It isn't end-of-life, but hardware bought now depreciates for five years, and if co-management completes in three or four, the estate funds 1,500 devices past their use.

The right-hand table decides the case. Microsoft's size-and-scale page sets 4,000 clients per distribution point, so 70,000 endpoints need eighteen at the ceiling and twenty-four with headroom. A primary site supports 250 standard DPs, so 1,500 is possible only with pull DPs. Seventy thousand clients need at least three management points wherever the DPs sit, and fit in one stand-alone primary.

The other 1,476 serve no Configuration Manager requirement; they compensate for branch transport. The book's accurate statement: the distribution point role isn't obsolete; the distribution-point-per-office topology is.`,
  "Book 09, Chapter 11, \"The proposal under review,\" \"The timing problem,\" \"Published capacity limits.\"");
}

// ================================================================== 25 Target
{
  const s = content(P2, "The target: 12 hubs and a 24-DP content tier");
  tag(s, "What");
  img(s, "ch11-hub-content-tier", "Top: a cluster of two data centers, the headquarters data center and the disaster recovery facility, each with two standard source distribution points holding the full content library, an SD-WAN control plane instance and internet breakout. Both feed a box for ten regional hubs, the primary data center as the pull source and the secondary as a dashed secondary source. The regional hubs hold two pull distribution points each, twenty in all, carrying targeted content, plus SD-WAN aggregation, regional breakout, security service edge enforcement and, later, Connected Cache on its own host. Beside the hubs a capacity note reads: 24 distribution points times 4,000 clients equals 96,000; about 70,000 endpoints, an assumption, is 73 percent utilization. The hubs connect over the SD-WAN overlay to a field office box for about 1,500 sites with a dedicated internet access circuit sized to seats, a 5G secondary path for continuity only, and no local distribution point. The field office leads to two green boxes: content stays local through peer cache, BranchCache and Delivery Optimization peers, one WAN copy per site rather than per client; and cloud-sourced content such as Windows and Microsoft 365 Apps updates, Defender definitions and Intune Win32 apps is delivered over the branch circuit.", 0.6, 1.5, 5.5, 4.95);
  const b = table(s, "Hubs", 1.5, [2.65, 0.85, 3.1], ["Site", "DPs", "Role"], [
    ["Primary data center", "2", "Source library; control plane primary; breakout"],
    ["Secondary data center", "2", "Library replica; control plane secondary"],
    ["Regional hubs (10)", "20", "Pull DPs; SD-WAN aggregation; regional breakout; SSE"],
    [{ text: "Capacity", options: { bold: true } }, "24", "96,000 clients; 73% at 70,000 (assumption)"],
  ], { x: 6.15, fontSize: 12 });
  panel(s, "Peers", 6.15, b + 0.2, 6.6, 6.45 - b - 0.2, HEX.teal, HEX.tealTint, "CONTENT STAYS LOCAL WITHOUT A SERVER: OPTIMIZATIONS, NOT DEPENDENCIES", null, [
    "Peer cache serves clients in the same boundary group (TCP 8003, UDP 8004)",
    "Delivery Optimization peers on TCP 7680; behind a hub, use Group mode or subnet",
    "Segmentation must allow client-to-client traffic on these ports (Assumption 9)",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn: size and scale; pull DPs; peer cache; client settings; Delivery Optimization configuration and reference. Book 09, Ch 11.");
  notes(s,
`The target architecture rests on six design principles, and the first two do most of the work: size the content tier to client capacity, not office count, and solve the transport problem at the transport layer instead of working around it with distributed content.

The diagram is the result. Twelve hubs in existing facilities, so no new real estate, power or accreditation boundary: the primary data center holds the source library and the SD-WAN control plane primary; the disaster recovery facility holds a replica and the control plane secondary; ten regional hubs carry SD-WAN aggregation, regional breakout, security service edge enforcement and two pull distribution points each. That's twenty-four DPs and 96,000 clients of capacity, 73 percent utilized at the assumed 70,000. Pull DPs that source from the two data centers turn the fan-out from one-to-1,500 into two-to-twenty, and distribution point groups limit each hub to its region's packages.

Every office gets a DIA circuit sized to its seats and a 5G path for continuity, and no local DP. Three peer mechanisms keep most bytes off the WAN. Configuration Manager peer cache serves clients in the same current boundary group, over HTTP or HTTPS on TCP 8003 and UDP 8004 for Windows PE, not SMB. Delivery Optimization peers on TCP 7680, and here's the SD-WAN detail: its default LAN mode groups devices sharing a public IP address, which is right for an office with its own breakout and wrong while branch traffic still egresses at a hub, because every office behind that hub shares an address. Microsoft's hub-and-spoke guidance is Group mode, subnet restriction, or both.

All three are optimizations, not dependencies. If segmentation blocks them, clients pull from the hub over a circuit sized for it.`,
  "Book 09, Chapter 11, \"Target architecture,\" \"Hub topology: 12 sites,\" \"Content tier: 24 distribution points,\" \"Keeping content local without a server.\"");
}

// ================================================================== 26 BOM
{
  const s = content(P2, "Branch tiers and the Year 1 bill of materials");
  tag(s, "How");
  const b1 = table(s, "Tiers", 1.5, [0.75, 1.5, 1.1, 1.75, 2.4], ["Tier", "Offices (assumed)", "Seats", "Primary circuit", "Example edge rating"], [
    ["S", "750", "Up to 25", "200–300 Mbps DIA", "Up to 500 Mbps IPsec"],
    ["M", "525", "26–50", "500 Mbps DIA", "Up to 1 Gbps IPsec"],
    ["L", "225", "51–100", "1 Gbps DIA", "Rated well above"],
    ["All", "1,500", "—", "5G secondary path", "Module or cellular gateway"],
  ], { fontSize: 12 });
  const b2 = table(s, "BOM", 1.5, [2.95, 1.55], ["Year 1 capital (illustrative)", "Amount"], [
    ["Branch equipment", "$5,085,000"],
    ["Hub equipment", "$1,048,224"],
    ["Control plane and services", "$3,850,000"],
    [{ text: "Total Year 1", options: { bold: true } }, { text: "$9,983,224", options: { bold: true } }],
  ], { x: 8.25, fontSize: 12 });
  const b = Math.max(b1, b2);
  panel(s, "Rules", 0.6, b + 0.2, 12.15, null, HEX.navy, HEX.navyTint, "FOUR BRANCH DESIGN RULES (PROGRAM POSITIONS)", null, [
    "Symmetric and SLA-backed beats raw bandwidth: 300 Mbps DIA over 1 Gbps best-effort cable",
    "5G is a continuity path, not a capacity path: keep feature-update waves off it",
    "Verify physical path diversity per site: two fiber providers often share one conduit",
    "License encrypted throughput to the circuit: above 250 Mbps needs it on this family, the costliest error",
  ], 12.5);
  sources(s, "Sources: example edge vendor data sheets and licensing guide; Windows Server 2025 pricing; carrier plan terms; program planning prices (assumptions). Book 09, Ch 11.");
  notes(s,
`The branch network has three tiers by seat count. The bill of materials uses one vendor's edge line as a costable example, not a recommendation; the book is explicit that the sizing and topology don't depend on the vendor. Seven hundred fifty small offices of up to 25 seats get 200 to 300 megabits of DIA on an edge rated up to 500 megabits of IPsec; 525 medium offices get 500 megabits on an edge rated to a gigabit; 225 large offices get a gigabit on a platform rated well above it. Every office gets a 5G module or cellular gateway.

Year 1 capital comes to about ten million dollars. Branch equipment is about $5.1 million, with hardware at a forty percent discount off the program's planning list prices. Hub equipment is about $1 million, including twenty-four DP servers and Windows Server licenses at Microsoft's suggested retail price. Control plane, zero-touch provisioning, field installation and professional services add $3.85 million.

The four rules are where these designs usually go wrong. A twenty-seat office needs low jitter and an SLA, not a gigabit, so the program's position is that 300 megabits of DIA serves voice, virtual desktop and Teams better than a gigabit of best-effort cable. Carrier fixed-wireless plans commonly let the carrier deprioritize traffic under congestion, so 5G keeps an office working through an outage but won't carry a feature-update wave. Cable plus 5G is genuinely diverse, while two nominally different fiber providers often share one conduit. And on this platform family, more than 250 megabits of encrypted throughput needs an additional license on every model except the hub-class models, including the 300-megabit small tier. Buying gigabit circuits against a 250-megabit crypto entitlement is the most common, and most expensive, costing error with this class of edge.`,
  "Book 09, Chapter 11, \"Branch network\" and \"Sizing and bill of materials.\"");
}

// ================================================================== 27 Cost model
{
  const s = content(P2, "The cost model, and the MPLS number that decides it");
  tag(s, "What");
  const b1 = table(s, "Recurring", 1.5, [3.4, 1.25, 1.55], ["Annual recurring (illustrative)", "Basis", "Annual"], [
    ["DIA, tiered by office class", "$350–$800/mo", "$8.46M"],
    ["5G secondary path", "$75/mo", "$1.35M"],
    ["SD-WAN subscriptions and support", "Branch, hub", "$0.92M"],
    ["Hub internet transit", "12 hubs", "$0.43M"],
    ["Security service edge, 70,000 users", "$65/user/yr", "$4.55M"],
    [{ text: "Total recurring", options: { bold: true } }, "", { text: "$15.71M", options: { bold: true } }],
    ["Less MPLS retired (Assumption 1)", "$1,200/mo", "−$21.60M"],
    [{ text: "Net annual position", options: { bold: true } }, "", { text: "−$5.89M", options: { bold: true } }],
  ], { fontSize: 11.5 });
  const b2 = table(s, "Sensitivity", 1.5, [1.75, 1.6, 2.6], ["MPLS / office / mo", "Net annual", "Character"], [
    ["$1,500", "−$11.29M", "Strongly cash-positive"],
    ["$1,200 (base)", "−$5.89M", "Cash-positive"],
    [{ text: "$873", options: { bold: true } }, { text: "$0", options: { bold: true } }, { text: "Breakeven", options: { bold: true } }],
    ["$600", "+$4.91M", "Net cost; justify on capability"],
    ["$400", "+$8.51M", "The financial argument inverts"],
  ], { x: 6.8, fontSize: 11.5 });
  const fb = panel(s, "Five", 6.8, b2 + 0.2, 5.95, null, HEX.teal, HEX.tealTint, "FIVE-YEAR PHASED POSITION", null, [
    "Positive cumulative in year 4 (+$1.78M); +$7.67M by year 5",
    "About $57.7M better than the $50M refresh",
  ], 12);
  const b = Math.max(b1, fb);
  note(s, "Ask", b + 0.15, 6.45 - b - 0.15, "FaScaleBalanced", HEX.amber, "Validate first: ",
    "below $873 the case stands on capability. Not scope for scope.");
  sources(s, "Sources: program cost model (planning estimates and assumptions, not quotes); breakeven arithmetic $15,714,000 ÷ (1,500 × 12). Book 09, Ch 11, 13.");
  notes(s,
`Every figure here is an illustrative planning estimate with its assumption labeled, and the case turns on one number the analysis doesn't hold.

At steady state, recurring cost is about $15.7 million a year: tiered DIA at $350, $500 and $800 a month, $8.46 million; 5G at $75 a month, $1.35 million; SD-WAN subscriptions, analytics and control plane support, about $0.9 million; hub internet transit, $0.43 million; and security service edge licensing for 70,000 users at $65 a year, $4.55 million. That last line matters. Chapter 13 calls the per-user SASE subscription the term most often left out of SD-WAN-versus-MPLS comparisons and the line most likely to dominate them. Against that, retiring MPLS at the assumed $1,200 per office per month saves $21.6 million, for a net return of about $5.9 million a year.

The five-year position ramps as offices move at MPLS renewal: about ten million of capital in year one, thirty percent of offices in year two, seventy in year three, all in year four, so cumulative goes positive in year four and reaches about $7.7 million by year five. The refresh is minus fifty million in year one and recurs.

The sensitivity table is the honest part. Breakeven is $15,714,000 divided by 1,500 offices times twelve months: $873 per office per month. Above it, the program funds itself. Below it, it's still the better architecture and still cheaper than the refresh, but it has to be argued on capability and mission, and the briefing should change once the number is known. Validate MPLS cost from telecom contract records before anything goes into a budget submission.`,
  "Book 09, Chapter 11, \"Cost model and sensitivity\"; Chapter 13, \"The cost structure, which you can build without unit prices.\"");
}

// ================================================================== 28 Roadmap and gates
{
  const s = content(P2, "The roadmap, and five gates before the last DP retires");
  tag(s, "How");
  const im = img(s, "ch11-retirement-gates", "An amber box at the top, the 24-DP hub content tier labeled interim, consolidated not permanent, leads down through five slate gate boxes in sequence. Gate 1, app content: client apps and Office Click-to-Run workloads on Intune, and no deployment still sourced from Configuration Manager. Gate 2, update content: Windows Update and device configuration workloads on Intune, and Configuration Manager software updates turned off in client settings. Gate 3, OS provisioning: task-sequence imaging replaced by Windows Autopilot, not a co-management workload. Gate 4, caching role: no Connected Cache instance still running on distribution-point hardware. Gate 5, compliance evidence: no control evidence still sourced from the Configuration Manager site database. Gate 5 leads, labeled all closed, to a green box: retire the last distribution point when all five are closed, in whatever month that is. A dashed red arrow labeled open gate leads from the gate sequence to a red box: any gate open, keep the tier and don't force the cutover.", 8.85, 1.5, 3.9, 4.95);
  const b = table(s, "Phases", 1.5, [0.75, 1.3, 5.9], ["Phase", "Months", "Exit criteria"], [
    ["0", "0–6", "ATO for regional breakout; ten-site pilot stable 30 days; validated per-site costs; CISA telemetry coordination started"],
    ["1", "6–18", "All twelve hubs in production; content from the hub tier; office DPs read-only fallback; pilot telemetry confirmed"],
    ["2", "18–48", "Waves keyed to MPLS renewal; each office's MPLS retired only after its replacement telemetry is confirmed"],
    ["3", "36+", "Microsoft 365 direct-path optimization (not INR); Connected Cache at hubs; DPs retired as gates close"],
  ], { fontSize: 12, limit: im.bottom });
  panel(s, "Why", 0.6, b + 0.2, 7.95, null, HEX.navy, HEX.navyTint, "WHY THIS ORDER", null, [
    "Accreditation, not procurement, is the critical path; Phase 0 is about $1.8M",
    "Hubs first: 12 sites shrink the accreditation surface by two orders of magnitude",
    "Waves follow contract expiry, not geography; the last cutover is gated",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn: co-management workloads; Windows Autopatch prerequisites; Connected Cache; program roadmap (design guidance). Book 09, Ch 11.");
  notes(s,
`The roadmap has four phases. Phase 0, months zero to six, is architecture, the TIC 3.0 branch use-case package and accreditation, the on-premises control plane, a ten-site pilot across every transport type and tier, CISA telemetry coordination and a serviceability survey. It exits with an authorization to operate for regional breakout, pilot sites stable for thirty days, and validated per-site costs replacing the chapter's estimates. It's funded first, at about $1.8 million out of the Year 1 total. Phase 2, months eighteen to forty-eight, migrates offices in waves keyed to MPLS renewal dates, and each office's MPLS is retired only after its replacement telemetry is confirmed. Phase 3 is Microsoft 365 direct-path optimization with GCC's available mechanisms, not informed network routing, and Connected Cache at the hubs.

Why that order? Accreditation, not procurement, is the critical path. Hubs first because one capital event at one set of facilities under one boundary delivers aggregation, regional breakout and the content tier together, and twelve sites instead of 1,500 shrinks the accreditation surface by two orders of magnitude.

And the last cutover is gated, not scheduled. The twenty-four-DP tier is interim. On the right, five gates: app content, meaning the client-apps and Office workloads on Intune and no deployment still published from Configuration Manager, because moving a slider doesn't withdraw deployments; update content, with Configuration Manager's update client setting turned off by hand; OS provisioning moved to Autopilot, the most common reason a just-in-case DP survives; no Connected Cache still running on DP hardware; and no compliance evidence still sourced from the site database. Close all five in month thirty and retire the last DP in month thirty. Not closed by month sixty, keep the tier rather than force a cutover.`,
  "Book 09, Chapter 11, \"Implementation roadmap,\" \"Why this order,\" \"When to retire the last distribution point.\"");
}

// ================================================================== 29 Long interim
{
  const s = content(P2, "The long interim, and the refresh fork");
  tag(s, "What");
  const b = table(s, "Interim", 1.5, [2.9, 4.45], ["Branch-edge function", "Obtainable before an award? (judgment)"], [
    ["Application-aware steering", "Partly: policy-based routing on existing edges, a few classes"],
    ["Multi-link use and failover", "Rarely: the most product-dependent function"],
    ["Path-health measurement", "Yes: synthetic transactions, IPFIX or NetFlow, endpoint telemetry"],
    ["Queue management before the WAN", "Partly: most branch routers can mark and queue"],
    ["Deterministic egress", "Usually: a NAT configuration decision"],
    ["Per-application telemetry", "Partly: flow records plus application logs, by hand"],
  ], { fontSize: 12 });
  const im = img(s, "ch10-refresh-fork", "An amber card at the top: BOD 26-02 requires all identified end-of-support edge devices off agency networks by about August 5, 2027, so the branch refresh happens on a directive clock whether or not an architecture program is funded. It splits into two paths. Left, a red card: like-for-like replacement, the same device class, topology and absence of policy and telemetry; the money is spent and the architecture question is closed for the life of the new equipment. Right, a green card: replacement specified to the target's attributes, listing application-aware steering, path measurement, deterministic egress, exportable per-application telemetry, PQC-capable key exchange under M-26-15, a management plane that satisfies BOD 23-02, and a stated FIPS 140-3 validation expectation; it costs requirements-writing time and keeps the option open.", 8.2, 1.5, 4.55, 4.0);
  note(s, "Fork", Math.max(b, im.bottom) + 0.2, 6.45 - Math.max(b, im.bottom) - 0.2, "FaArrowsRotate", HEX.amber, "Cheapest high-value action: ",
    "tell whoever scopes BOD 26-02 replacements, in writing, what the target needs of a branch device.");
  sources(s, "Sources: CISA BOD 26-02, BOD 23-02; OMB M-26-14, M-26-15; GSA EIS and TIC pages; OMB Circular A-11; NIST CMVP. Book 09, Ch 10.");
  notes(s,
`Most writing about branch networking assumes the agency is about to deploy SD-WAN. For many agencies it isn't, and won't be for years: acquisition takes several quarters, a program conceived now has usually missed the next budget submission, a thousand branches is a multi-year deployment on logistics alone, and the same staff carry three federal deadlines inside about fifteen months, the M-26-14 logging plan, the M-26-15 post-quantum plan and BOD 26-04's phased re-tooling.

The book argues the architecture by elimination rather than mandate. The legacy telecom vehicles had all ended by May 31, 2026; the hairpin is what M-19-26 moved policy away from; a new agency access point is a capital and staffing commitment; VPN backhaul is a hairpin under another name; and cloud-provider private connectivity solves less than agencies assume. What's left is local breakout, a cloud-delivered security stack nearby and a policy layer at the edge.

The scarcity is in the product category, not the functions. The table is the program's engineering judgment, not measurement: four of the six functions are partly obtainable now, path measurement and deterministic egress most readily, multi-link failover rarely.

Then the fork on the right. BOD 26-02 requires identified end-of-support edge devices off agency networks by about August 5, 2027, and a branch router with its own internet circuit meets the edge-device test, so a refresh happens on a directive clock whether or not anything is funded. Like-for-like spends the money and closes the architecture question for the life of the equipment. Specifying the target's attributes, steering and path measurement, deterministic egress, exportable per-application telemetry, PQC-capable key exchange, a BOD 23-02-compliant management plane and a FIPS 140-3 expectation, costs requirements-writing time and keeps it open.`,
  "Book 09, Chapter 10, \"The case by elimination,\" \"Why the target is years away,\" \"BOD 26-02 pulls the refresh forward,\" \"The interim posture.\"");
}

// ================================================================== 30 Sequencing and evidence
{
  const s = content(P2, "Cost structure, phase inversion and the paired branch");
  tag(s, "How");
  const im = img(s, "ch13-paired-branch", "Top to bottom. A slate card: select two branches with comparable user counts and application mix. A violet card: instrument both for 30 days, listing WAN path events, application server CPU and new-connection rate, identity provider authentication volume, database cache hit ratio, and help desk tickets tagged by application. An amber card: deploy the branch-edge policy layer at one branch only. A violet card: instrument both for a further 30 days. A green card: the effect size is the post-period difference adjusted for the pre-period difference, agency-specific and defensible.", 9.95, 1.5, 2.8, 4.95);
  const b = table(s, "Structure", 1.5, [3.4, 5.6], ["Architecture", "Recurring cost scales with"], [
    ["MPLS with central TIC or MTIPS", "Site count × port speed; insensitive to traffic"],
    ["DIA plus SASE, no branch edge", "User count: the structural break"],
    ["DIA plus SASE plus a branch edge", "Site count × bandwidth tier, plus users for SASE"],
    ["Agency-operated access point", "Internal; no published federal figure"],
  ], { fontSize: 12 });
  panel(s, "Inversion", 0.6, b + 0.2, 9.0, null, HEX.red, HEX.redTint, "PHASE INVERSION: THE BOOK'S INFERENCE, NOT A FINDING", null, [
    "Cloud migration finishes before transport is governed or measured",
    "Cost is attributed to the cloud; the remedies raise cloud spend",
    "Correction: instrument a sample of branches before the next wave",
    "Then re-baseline attribution, fix chattiness, and scope the edge program to where it pays",
  ], 12.5);
  sources(s, "Sources: GSA EIS Public Pricer; TeleGeography (Q4 2019); GAO-19-58, GAO-22-106195, GAO-26-107530, GAO-26-107919; CISA TIC Program Guidebook. Book 09, Ch 13.");
  notes(s,
`Three ideas from Chapter 13 close the technical argument: how to build the cost case without unit prices, the failure mode the book calls phase inversion, and the measurement that settles it in your own estate.

The cost structure is the program's analysis, not a price list. MPLS with a central TIC scales with site count times port speed, largely insensitive to traffic, because you buy ports. DIA plus SASE scales with user count, which is the structural break; for many small branches that tends to be favorable, for few large sites with many users it may not be. Adding a branch edge adds site count times bandwidth tier. The three-to-ten-times MPLS-to-broadband multiple comes from vendor marketing without a method; the one independent dataset found a smaller and less consistent gap. So price your own circuits and sites in GSA's EIS pricer.

Phase inversion is labeled inference: the parts are documented, the composed claim isn't. Cloud migration completes before the agency can govern and measure branch transport. Response times and bills come in worse than planned, the only metrics are cloud and application metrics, so cost is attributed to the cloud, and the remedies, more instances, caching, read replicas, raise cloud spend. The correction isn't to unwind anything: instrument a sample of branches first, re-baseline attribution, fix chattiness where it dominates, then scope the edge program to where measurement says it pays.

On the right is the direct test. Two comparable branches, thirty days instrumented, the change at one only, thirty more days, and the effect size is the post-period difference adjusted for the pre-period difference. Agency-specific and defensible, and the number to put in a business case.`,
  "Book 09, Chapter 13, \"Measuring cost in your own estate,\" \"Phase inversion,\" \"How to confirm or refute the case.\"");
}

// ================================================================== 31 Closing
{
  const s = content(P2, "What to decide, what to evidence, what to start");
  tag(s, "Who");
  const cols = [
    ["Decide", HEX.navy, HEX.navyTint, "DECIDE  ·  OWNER", [
      "Governor controls in place before traffic  ·  CISO",
      "Boundary change before local egress  ·  AO",
      "The Optimize SC-7(4) exception  ·  AO",
      "Each site's go/no-go  ·  System owner",
      "MTIPS exit only on CLAW parity  ·  CISO",
    ]],
    ["Evidence", HEX.teal, HEX.tealTint, "EVIDENCE FOR THE BOUNDARY CHANGE", [
      "Application-to-path policy (SC-7(4))",
      "QoS, failover and measured recovery time",
      "Path telemetry and decision records",
      "Exceptions, CLAW parity, known limitations",
      "Each exception's mission need, duration, review",
    ]],
    ["Start", HEX.amber, HEX.amberTint, "START NOW: NO AWARD NEEDED", [
      "Write the path policy; set deterministic egress",
      "Target attributes into the BOD 26-02 refresh",
      "Validate MPLS cost and the endpoint count",
      "Instrument a paired-branch study",
      "Start CLAW onboarding: three parties, own lead time",
    ]],
  ];
  const cb = Math.max(...cols.map((c, i) => panel(s, c[0], 0.6 + i * 4.1, 1.5, 3.95, 3.0, c[1], c[2], c[3], null, c[4], 12.5)));
  txt(s, "Close", "Physics for the pipe, the governor before traffic, the boundary before cutover, evidence before a circuit ends.",
    { x: 0.6, y: cb + 0.3, w: 12.15, h: 0.9, fontSize: 18, bold: true, color: HEX.navy, fontFace: "Cambria", valign: "middle", align: "center" });
  sources(s, "Sources: as on the preceding slides; full lists in the backup section. Owners and actions are program design guidance. Book 09, Ch 08–13; Appendix A.");
  notes(s,
`To close: what to decide, what to evidence, and what to start.

The decisions belong to named owners, and Chapter 09 gives each step one decider. The CISO and ISSO decide that the governor's controls are in place before it carries traffic. The authorizing official decides the boundary change before any site egresses locally, and grants or refuses the Optimize SC-7(4) exception. The system owner decides, site by site, whether each site is ready, and names a revert owner who can act within one shift. And the CISO makes CLAW parity, confirmed by security operations, the exit criterion for leaving MTIPS, with only the contracting officer able to end a circuit.

The evidence for the boundary change is the same material that later supports the SC-7, SI-4, AC-17 and CA-7 assertions: the application-to-path routing policy, which is the SC-7(4) traffic-flow policy; the QoS policy at the edge; the failover policy with its measured recovery time per site class; per-application path telemetry; the SD-WAN and SASE decision records; the traffic-flow exceptions with mission need, duration and review; CISA telemetry parity through CLAW onboarding; and an honest list of known limitations with compensating measures.

And what to start without an award: write the application-to-path policy now and establish deterministic egress. Put the target attributes in writing for whoever scopes the BOD 26-02 refresh. If you're facing a field-office content refresh, validate MPLS cost per office and the endpoint count before anything else. And instrument a paired-branch study before you buy, because the baseline can't be reconstructed afterward.

Physics for the pipe, the governor before traffic, the boundary before cutover, evidence before a circuit ends. Chapters 05, 08 and 10 through 13, and Appendix A, carry the detail. Thank you.`,
  "Book 09, Chapters 09 (\"An owner for each step\"), 10, 11, 12 and 13 (\"Evidence for the boundary change\"); Appendix A.");
}
endModule("Module 4");

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
{
  const s = content("Backup", "Sources behind the orientation and Module 1");
  const src = [
    "ITU-T G.114 (05/2003, amended 2009), One-way transmission time.  ·  NIST CODATA, speed of light in vacuum.  ·  ITU-R M.2410-0 (IMT-2020 minimum requirements).",
    "I. N. Bozkurt et al., Why Is the Internet so Slow?! (PAM 2017), and APNIC Blog summary (June 19, 2017).",
    "Microsoft Learn: Azure network round-trip latency statistics (30 days to July 30, 2026); TCP/IP performance tuning for Azure VMs (New York to London).",
    "Cisco Catalyst SD-WAN Policies Configuration Guide 17.x: Forward Error Correction; Packet Duplication for Noisy Channels.",
    "J. C. Corbett et al., Spanner: Google's Globally-Distributed Database (OSDI 2012).",
    "IETF RFC 4364, BGP/MPLS IP VPNs.  ·  NIST SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B (CP-8, SC-7(4), SC-8).  ·  NIST SP 800-37 Rev. 2 (significant change).",
    "CISA, The Journey to Zero Trust: Using SASE in a Modern TIC 3.0 Solution, v1.0 (June 2026).  ·  CISA ED 26-03.  ·  NIST SP 800-207.",
    "Full footnotes with links and access dates: Book 09, Chapters 01, 02, 05 and 13.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}
{
  const s = content("Backup", "Sources behind Module 2 — The branch edge and TIC 3.0");
  const src = [
    "CISA, TIC 3.0 Branch Office Use Case 3.0 (September 2026): Sec. 6 security patterns, Policy Enforcement Parity, Sec. 7.2.3.  ·  Security Capabilities Catalog 3.3.  ·  Reference Architecture 1.2.",
    "CISA SASE guide v1.0 (June 2026): Sec. 4–5 and Appendix C.  ·  CISA TIC 3.0 FAQ.  ·  OMB M-19-26.",
    "Microsoft Learn: Microsoft 365 network connectivity principles; managing Microsoft 365 endpoints; Worldwide endpoint list (Aug. 14, 2026); endpoints web service.",
    "Microsoft Learn: tenant restrictions v2; Global Secure Access (GCC availability); Microsoft 365 informed network routing; network connectivity in the admin center; Teams media encryption.",
    "FedRAMP Marketplace product data (Oct. 21, 2026).  ·  GSA, Trusted Internet Connections and Enterprise Infrastructure Solutions pages.",
    "NIST SP 800-53 Rev. 5 and SP 800-53B (SC-7(4)(c)–(e), SI-3, SI-4(10), AC-4, AU-3, AU-12, CP-8).",
    "IETF RFC 5737 and RFC 3849 (documentation addresses used in the Appendix A templates).",
    "Full footnotes with links and access dates: Book 09, Chapters 02, 03, 05, 08 and 12; Appendix A.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}
{
  const s = content("Backup", "Sources behind Module 3 — Securing the fabric");
  const src = [
    "CISA ED 26-03, Mitigate Vulnerabilities in Cisco SD-WAN Systems (Feb. 25, 2026; V1 Mar. 11, 2026).  ·  CISA BOD 26-02 (Feb. 5, 2026); BOD 26-04 (June 10, 2026); BOD 23-02.",
    "NIST SP 800-53 Rev. 5 (AC-2, AC-6(9), IA-2(1), IA-3, SC-7(5), SC-10, SC-23, AC-12, CM-2, CM-6, CM-7, CM-8, SI-2, SA-22, AU-2, AU-6, AU-9, AU-12, CA-3, SA-9).",
    "OMB M-26-15 (post-quantum key exchange); NIST FIPS 203; NIST CMVP FIPS 140-3 transition (Sept. 22, 2026).",
    "NIST SP 800-207, tenet 3.  ·  AWS RDS IAM database authentication.  ·  Microsoft Learn: Entra authentication for PostgreSQL FAQ.  ·  SPIFFE overview.",
    "Program SD-WAN and SASE modernization specifications, as summarized in Book 09 Chapter 05 (illustrative schema; governed path proposed).",
    "IETF RFC 9293 (TCP); RFC 4120 (Kerberos); RFC 4821 (PLPMTUD).  ·  Microsoft Learn: Kerberos KDC registry keys; NTLM; hybrid join plan and FAQ; Private Access Kerberos SSO; MS-KKDCP.",
    "Microsoft Learn: continuous access evaluation; strict location enforcement; token protection.",
    "Full footnotes with links and access dates: Book 09, Chapters 02, 05, 06 and 08.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}
{
  const s = content("Backup", "Sources behind Module 4 — The field-office transformation");
  const src = [
    "Microsoft Learn: Configuration Manager size and scale; DP prerequisites; content library; pull DPs; peer cache; client settings; release cadence and supported versions (2609).",
    "Microsoft Learn: co-management workloads; Windows Autopatch prerequisites; Microsoft Connected Cache (Configuration Manager and Enterprise); Delivery Optimization configuration and reference.",
    "Example edge vendor data sheets and licensing guide (as cited in Chapter 11); Microsoft Windows Server 2025 pricing; carrier fixed-wireless plan terms.",
    "FedRAMP Marketplace product data (Microsoft 365 GCC; example SD-WAN and security service edge listings).  ·  CISA TIC 3.0 Branch Office Use Case; CISA SASE guide.",
    "CISA BOD 26-02, BOD 23-02, BOD 26-04.  ·  OMB M-26-14, M-26-15, M-19-26; OMB Circular A-11.  ·  GSA EIS, TIC and transition pages.",
    "GAO-14-63, GAO-19-58, GAO-22-106195, GAO-25-107795, GAO-26-107530, GAO-26-107919.  ·  GSA EIS Public Pricer.  ·  TeleGeography (Q4 2019).",
    "Program planning prices and cost model (assumptions, not quotes); phase inversion is the book's inference.",
    "Full footnotes with links and access dates: Book 09, Chapters 10, 11 and 13.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}

console.log(`slides: ${pres.slides.length}; notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
