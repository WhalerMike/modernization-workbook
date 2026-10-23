// Book 09 — Network & Transport: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — Policy and transport:      Module 1 (Ch03 + Ch04 TIC 3.0 in practice, token security),
//                                        Module 2 (Ch05 + Ch06 governed transport, legacy protocols).
//   Part 2 — Access and architecture:   Module 3 (Ch07 network access control),
//                                        Module 4 (Ch08 + Ch09 + Ch13 reference architecture and ownership).
// Build:  node presentations/b09-network-technical/build.js presentations/b09-network-technical/B09_Network_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b09-network/; the notes name the chapter.
// Program positions are labeled "design guidance" and the book's inferences "inference", as the chapters do.
// Defensive content only. Narration: narration.json (spoken text) through presentations/_build/narrate.py.
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 09", title: "Network & Transport — Technical Deep Dive" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "B09_Network_Technical.pptx";

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
  return { w, h };
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
  warn(`${name} table`, bottom);
  if (process.env.FIT) console.log(`  table ${name}: bottom ${bottom.toFixed(2)} in`);
  return bottom;
};

// A tinted panel with a small caps label, a heading and bullets.
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13.5) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 16, fontFace: "Cambria", breakLine: true } });
  txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.75 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08;
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (need > y + h + 0.02) console.warn(`  ! ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
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

const P1 = "Part 1 — Policy and transport";
const P2 = "Part 2 — Access and architecture";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "Network & Transport: the technical deep dive", "Book 09 — TIC 3.0, governed transport, 802.1X and the order of operations");
  txt(s, "Session map", [
    { text: "Part 1 — Policy and transport", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  TIC 3.0 in practice   ·   Module 2  Governed transport and legacy protocols", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Access and architecture", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Network access control   ·   Module 4  Reference architecture and ownership", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 09 of the Federal Modernization Workbook, Network and Transport. It's for the network engineers and architects who will move branches off hairpinned transport without turning the move into a compliance regression.

It comes in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is policy and transport: first what TIC 3.0 and the binding instruments around it actually require of a branch, and how token security changes where data can live; then SD-WAN, SASE and the governed path, and what legacy protocols such as Kerberos and NTLM need on a re-routed path. Part 2 is access and architecture: 802.1X and RADIUS after Active Directory, with Intune as the posture source, and then the reference architecture, the five design decisions and who owns each one.

The slides show tables, flows and decision matrices. The configuration examples live in the chapters, and the book marks them as illustrative and untested against production; I'll point you to them rather than put them on screen. Where a figure is the program's own planning value or design guidance, or the book's inference, the slide says so.`,
  "Book 09, index; Chapters 01–09 and 13.");
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: the floor, the pipe and the governor");
  tag(s, "Why");
  subhead(s, "Physics head", "DISTANCE SETS A FLOOR NO PRODUCT MOVES", 0.6, 1.5, 6.0);
  table(s, "Physics", 1.85, [2.0, 4.0], ["Figure", "What the book records"], [
    ["Light in fiber", "5 µs per km (ITU-T G.114 planning value): about 1 ms per 200 km, one way"],
    ["Voice budget", "150 ms is mouth-to-ear; terminals take 50–80 ms, leaving the network about 70–100 ms one way"],
    ["A hairpin", "Seattle via northern Virginia to a Pacific Northwest region: about 60 ms one way (arithmetic plus assumptions)"],
    ["A floor", "New York to London: 28 ms one way, 56 ms round trip, before any route is longer than a straight line"],
  ], { fontSize: 12.5 });
  subhead(s, "Control head", "TRANSPORT IS PHYSICS; CONTROL IS COMPLIANCE", 6.85, 1.5, 5.9);
  table(s, "Control", 1.85, [2.05, 3.85], ["Layer", "What it closes"], [
    ["The pipe (DIA, MPLS, LEO, 5G)", "One control family: telecommunications diversity (CP-8); each new pipe adds an SC-7(4) interface"],
    ["The governor (SD-WAN)", "Encryption across circuits, path selection, per-application telemetry"],
    ["The SASE layer above", "Boundary, flow, malware and monitoring: SC-7, AC-4, SI-3, SI-4"],
  ], { x: 6.85, fontSize: 12.5 });
  callout(s, "Regression", 5.4, 1.1, "FaTriangleExclamation", HEX.red, "Bare local breakout: ",
    "it fixes the hairpin and loses the assessed boundary. A branch moved from a governed hairpin to an ungoverned circuit is a compliance regression with better latency.");
  sources(s, "Sources: ITU-T G.114; Bozkurt et al., Why Is the Internet so Slow?!; NIST SP 800-53 Rev. 5; RFC 4364; CISA SASE guide (June 2026). Book 09, Ch 01–02.");
  notes(s,
`Why this matters. Two decisions get mixed up in almost every branch program, and the book's spine is pulling them apart.

The first is physics. ITU-T G.114 plans light in fiber at five microseconds per kilometer, about a millisecond for every two hundred kilometers, one way. The often-quoted 150 milliseconds for voice is mouth-to-ear: G.114's own voice-over-IP examples give the terminals fifty to eighty milliseconds, which leaves the network roughly seventy to a hundred. The book's worked hairpin, a Seattle office routed through northern Virginia to reach a Pacific Northwest cloud region, comes to about sixty milliseconds one way. So a hairpin spends most of the network budget before the call goes anywhere.

The second is compliance. Every transport is a pipe, and the pipe closes exactly one control family: telecommunications diversity, CP-8. Every new circuit also adds a managed interface that SC-7(4) expects to carry its own traffic-flow policy. Encryption across circuits, path selection and per-application telemetry come from the governor, usually SD-WAN. Boundary protection, flow enforcement, malware inspection and monitoring come from the SASE layer above it.

So bare local breakout, a direct internet circuit with nothing governing it, fixes latency and loses the assessed boundary. The book calls that a compliance regression with better latency.`,
  "Book 09, Chapter 01 — Why Physics Decides the Architecture; Chapter 02 — Transport Is Physics, Control Is Compliance.");
}

// ================================================================== 3 Order of operations
{
  const s = content("Orientation", "The order of operations, and where this deck goes");
  tag(s, "How");
  flow(s, "Sequence", 1.5, 2.05, [
    { head: "0 Secure the governor", body: "Vulnerability management, privileged access, off-box logs", color: HEX.red, tint: HEX.redTint },
    { head: "1 Buy the pipe", body: "On measured physics, inside the acquisition envelope" },
    { head: "2 Governor live", body: "Inspecting and logging at the site before production traffic" },
    { head: "3 Boundary change", body: "Decided before the first production cutover" },
    { head: "4 Microsoft 365", body: "Optimize traffic through its own SC-7(4) exception" },
    { head: "5 Evidence", body: "Registered; CISA telemetry parity before a circuit ends" },
  ], 11.5);
  table(s, "Map", 3.8, [3.2, 1.9, 7.05], ["Module", "Chapters", "What a practitioner leaves with"], [
    ["1 TIC 3.0 in practice", "03–04", "The obligations a branch must evidence; DNS, logging and telemetry after MTIPS; token security"],
    ["2 Governed transport", "05–06", "What SD-WAN and SASE close; securing the governor; Kerberos, round trips and egress on new paths"],
    ["3 Network access control", "07", "EAP-TLS, the NPS exit, Intune compliance retrieval, CoA, tiers, RADIUS hardening, rollout"],
    ["4 Architecture and ownership", "08–09, 13", "Four branch patterns, five design decisions, one decider per row and the evidence per gate"],
  ], { fontSize: 12.5 });
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (significant change); NIST SP 800-53 Rev. 5 (SC-7(4)); CISA SASE guide (June 2026). Book 09, Ch 02, 09, 13.");
  notes(s,
`The book's practical rule is an order of operations, and every module of this deck hangs off one of its steps.

Step zero is new in this edition: secure the governor first. An SD-WAN controller and its edges are internet-facing systems with estate-wide authority, so they come under vulnerability management, privileged-access control and off-box logging before they carry production traffic. Step two, the governor is live, inspecting and logging at that site before production traffic moves. Step three, treat the boundary change as the significant change it is. Decide it before the first cutover. Step four, Microsoft 365 Optimize traffic goes through its own documented SC-7(4) exception, not an ad hoc bypass. Step five, register the evidence, and confirm CISA telemetry parity before any legacy circuit or MTIPS service ends.

Two framing points. The book is explicit that this sequence is an engineering dependency, not a federal mandate; no OMB memorandum or CISA directive specifies it, and saying so is what makes it survive review. And lighting up fast connections before the security layer is live is, in the program's experience, the most common and costliest mistake in branch modernization.

The table is the map for the next fifty minutes.`,
  "Book 09, Chapter 02, \"Order of operations\"; Chapter 09, \"An owner for each step\"; Chapter 13 — Sequencing, Cost and Evidence.");
}
endModule("Orientation");

// ================================================================== 4 Module 1 divider
{
  const s = divider(P1, "Module 1: TIC 3.0 in practice, and token security", "Part 1 — Policy and transport  ·  Chapters 03–04",
    ["The TIC 3.0 document set, policy enforcement parity and CISA visibility", "Four binding obligations and the branch's own control assertions", "DNS, logging and telemetry after MTIPS; tokens and consistency"], 13);
  notes(s,
`Module 1: TIC 3.0 in practice, and token security. Most branch decisions are argued in policy terms: a local breakout refused "for TIC reasons," an SD-WAN bought because "TIC 3.0 requires it," a refresh deferred because "FedRAMP won't allow that path." Each statement is checkable, and most fail the check.

The opposite mistake is just as common: concluding that because policy is technology-neutral, the branch is unconstrained. It isn't. This module reads the documents themselves, as of October 2026, then states what they bind and what they leave to the agency. It ends with the data-side idea that makes the rest of the book work: identity, not network location, is what lets one source of truth serve many trust domains.`,
  "Book 09, Chapter 03 — What TIC 3.0 and Federal Policy Actually Require; Chapter 04 — Logical Centralization and Token-Based Security.");
}

// ================================================================== 5 TIC 3.0 as written
{
  const s = content(P1, "TIC 3.0 as written: four use cases, two hard rules");
  tag(s, "What");
  table(s, "Docs", 1.5, [3.45, 1.0, 1.55], ["Volume or use case", "Cover", "Content revised"], [
    ["Vol. 1 Program Guidebook", "1.2", "July 2025"],
    ["Vol. 2 Reference Architecture", "1.2", "July 2025"],
    ["Vol. 3 Security Capabilities Catalog", "3.3", "July 2025"],
    ["Vol. 4 Use Case Handbook", "1.2", "July 2025"],
    ["Vol. 5 Overlay Handbook", "1.2", "July 2025"],
    ["Traditional TIC Use Case", "1.0", "April 2021"],
    ["Branch Office Use Case", "3.0", "July 2025"],
    ["Remote User Use Case", "2.2", "July 2025"],
    ["Cloud Use Case", "1.2", "July 2025"],
  ], { fontSize: 12 });
  panel(s, "Rules", 6.85, 1.5, 5.9, 4.95, HEX.navy, HEX.navyTint, "WHAT CONSTRAINS A BRANCH", "Parity on every path; CISA keeps its view", [
    "Policy enforcement parity: a capability needed anywhere is applied at every access point, with parity on every conveyance path, SD-WAN included",
    "Preserve CISA visibility: TIC no longer sets durations (the 24-hour capture is gone), but telemetry duties under law, OMB and CISA remain",
    "No SASE use case: CISA's June 2026 SASE guide permits and describes; it doesn't require",
    "Catalog: 20 universal capabilities and 12 PEP groups; residual risk obliges controls or compensating controls",
  ], 12.5);
  sources(s, "Sources: CISA TIC 3.0 core guidance, Sept. 2026 republication (Program Guidebook 1.2, Catalog 3.3, Branch Office 3.0); CISA SASE guide v1.0; OMB M-19-26. Book 09, Ch 03.");
  notes(s,
`OMB M-19-26 replaced routing-based compliance with capability-based compliance in 2019, and CISA's June 2026 SASE guidance states the consequence: TIC 3.0 doesn't require routing through TIC access points if an alternative gives both the agency and CISA situational awareness.

Read the versions from the cover pages. CISA republished the set in September 2026, but the revision tables say the only 2026 changes were footnote links, so the substance dates from July 2025, or April 2021 for the Traditional use case. There are four use cases: Traditional, Branch Office, Remote User and Cloud. There's no SASE use case.

Two statements in the catalog constrain branch design more than any capability. Policy enforcement parity: once an agency decides a capability is needed, it implements it at every access point to that network or data. The Branch Office use case applies that to conveyance: where redundant links or SD-WAN are used, path priorities, the order security functions run in and policy enforcement should keep parity on every path. That's the only place TIC names SD-WAN, as an example of something to govern, not a requirement. And telemetry: TIC 2.x's 24-hour packet capture is gone, but the use case says that as branches connect directly to external services, agencies must preserve CISA visibility.

The guidebook's own principle is descriptive, not prescriptive, but it adds that where TIC's controls don't cover residual risk, agencies are obligated to apply controls or compensating controls. Discretion comes with an obligation.`,
  "Book 09, Chapter 03, \"From consolidation to capabilities,\" \"The document set, read from the cover pages,\" \"What the catalog and the Branch Office use case require.\"");
}

// ================================================================== 6 Four obligations
{
  const s = content(P1, "Technology-neutral, not requirement-free");
  tag(s, "What");
  const b = table(s, "Obligations", 1.5, [2.3, 6.35, 3.5], ["Obligation", "What it requires at a branch", "Clock"], [
    ["Protective DNS", "All egress DNS resolution through CISA's Protective DNS (M-22-09; 6 U.S.C. § 663 note); root hints disabled; external resolvers reached only from authorized internal DNS servers", "Standing obligation"],
    ["BOD 23-02", "Management interfaces of routers, switches, firewalls, VPN concentrators, proxies and load balancers off the internet, or behind a separate policy enforcement point (preferred)", "14 days from discovery or CISA notice"],
    ["BOD 26-02", "End-of-support edge devices on the boundary and reachable from the internet are inventoried and decommissioned", "Inventory May 5, 2026; listed devices Feb. 5, 2027; all Aug. 5, 2027"],
    ["OMB M-26-15", "Anything terminating TLS or IPsec supports PQC key exchange (ML-KEM, FIPS 203), placed as close to the endpoint as feasible", "Plan due Oct. 22, 2026; mitigate by Dec. 31, 2030"],
  ], { fontSize: 12 });
  callout(s, "Refresh", b + 0.15, 6.5 - b - 0.15, "FaArrowsRotate", HEX.amber, "The refresh is the fork: ",
    "a branch router with its own internet circuit meets BOD 26-02's test, so replacing it is a dated obligation whatever program is funded. Write the target attributes into that purchase.");
  sources(s, "Sources: OMB M-22-09; CISA Encrypted DNS Implementation Guidance (2024); CISA BOD 23-02, BOD 26-02; OMB M-26-15; EO 14412; NIST CMVP FIPS 140-3 transition. Book 09, Ch 03.");
  notes(s,
`Four binding obligations land directly on branch equipment. None picks a product; all constrain what a branch can look like.

Egress DNS must go to CISA's Protective DNS. M-22-09 records it as an existing obligation, and CISA's Encrypted DNS Implementation Guidance says agencies must use Protective DNS for all egress resolution, under M-22-09 and 6 U.S.C. section 663 note; agency DNS must disable root hints; and only authorized internal DNS servers may talk to external resolvers.

BOD 23-02, June 2023, covers management interfaces on routers, switches, firewalls, VPN concentrators, proxies, load balancers and out-of-band server management. Within fourteen days of discovery or CISA notification, take the interface off the internet or, preferred, front it with a separate policy enforcement point.

BOD 26-02, February 5, 2026, covers end-of-support devices on the network boundary that are reachable from the internet. The milestones on the slide count from issue, with continuous discovery from February 5, 2028.

OMB M-26-15, June 24, 2026, implementing Executive Order 14412: all network infrastructure terminating TLS or IPsec, naming firewalls, VPN concentrators, cloud gateways and API proxies, must support PQC-capable key exchange using NIST algorithms. Mitigate as much quantum risk as feasible by December 31, 2030; the plan was due October 22, 2026.

One date sits on the same equipment: on September 22, 2026, FIPS 140-2 certificates moved to the CMVP Historical List. That isn't revocation, but new acquisition documents should state the validation expectation explicitly.`,
  "Book 09, Chapter 03, \"Technology-neutral is not requirement-free\"; \"The encryption requirement that is and isn't there\" (CMVP).");
}

// ================================================================== 7 Control assertions and SC-8
{
  const s = content(P1, "The branch as boundary: control assertions and SC-8");
  tag(s, "Who");
  table(s, "Controls", 1.5, [1.7, 3.6, 1.35], ["Control", "What the agency asserts", "Baselines"], [
    ["SC-7", "Monitor and control external interfaces", "L, M, H"],
    ["SC-7(4)", "A flow policy per external service", "M, H"],
    ["SC-7(8)", "Authenticated proxies for defined traffic", "M, H"],
    ["SC-8, SC-8(1)", "Cryptographic protection in transit", "M, H"],
    ["AC-4", "Enforce approved information flows", "M, H"],
    ["SI-4, CA-7", "Detect attacks; monitor with metrics", "L, M, H"],
    ["CP-8(2)", "Alternate path, no shared failure point", "M, H"],
    ["CP-8(3)", "Alternate from a separated provider", "H only"],
  ], { fontSize: 11.5 });
  panel(s, "Crypto", 7.45, 1.5, 5.3, 3.7, HEX.teal, HEX.tealTint, "ENCRYPTION", "What is and isn't required", [
    "SC-8(1) names TLS and IPsec as alternatives; nothing requires both",
    "SC-8(3) (message externals) and SC-8(4) (traffic patterns) aren't in any baseline",
    "End-to-end TLS, Protective DNS and an SC-7(4) policy: defensible with no overlay",
    "TLS 1.3 support required since Jan. 1, 2024 (SP 800-52 Rev. 2); 2030 is the PQC date",
  ], 12);
  callout(s, "Register", 5.35, 1.15, "FaListCheck", HEX.amber, "Cheap action: ",
    "inventory the cleartext protocols crossing branch WAN links (LDAP, unencrypted SMB, FTP, telnet, database) as an SC-8 exposure register: encrypt, tunnel or retire each.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B; NIST SP 800-52 Rev. 2; EO 14306; OMB M-22-09; CISA BOD 18-01. Book 09, Ch 03.");
  notes(s,
`The obligations that bite hardest are often the ones the agency wrote into its own packages. Where a branch breaks out locally, it is an external boundary, and the system security plan asserts controls about it.

None of this says an agency is out of compliance for lacking SD-WAN. It says an agency with an ungoverned branch edge will struggle to produce the evidence its assertions promise: what is monitored and controlled at that boundary, by what, under which traffic-flow policy, and where the record is. The gap surfaces at assessment, not deployment. It's an evidence argument, not a mandate argument. One correction: a diverse cellular path closes CP-8(2) at Moderate, but CP-8(3), provider separation, is High only.

On encryption. SC-8 can be met by physical or logical means. SC-8(1)'s discussion names TLS and IPsec as alternatives. The controls that would require protecting headers and routing information, SC-8(3), or concealing traffic patterns, SC-8(4), aren't in any baseline. So a branch whose traffic is TLS-protected end to end with validated modules, whose DNS reaches Protective DNS, with an SC-7(4) policy per external service, has a defensible implementation with no overlay. TLS versions are two requirements: SP 800-52 Revision 2 required TLS 1.3 support by January 1, 2024; EO 14306's January 2, 2030 date is post-quantum readiness, not a relaxation.

Where encryption is load-bearing is cleartext: the inventory on the slide is cheap, and CM-7(1) already asks you to find nonsecure protocols.`,
  "Book 09, Chapter 03, \"The control assertions an agency makes about its own boundary\" and \"The encryption requirement that is and isn't there.\"");
}

// ================================================================== 8 DNS, logging, telemetry
{
  const s = content(P1, "DNS, logging and CISA telemetry after MTIPS");
  tag(s, "How");
  panel(s, "DNS", 0.6, 1.5, 5.6, 3.75, HEX.navy, HEX.navyTint, "PROTECTIVE DNS", "Endpoints → agency resolvers → CISA", [
    "DDI provides the resolvers, root hints off and encrypted DNS; egress still terminates at CISA",
    "The silent trap: forwarding to a vendor's protective resolver, or an endpoint agent's own DoH to a vendor cloud",
    "Vendor threat intelligence at the internal resolver is fine; resolution instead of CISA isn't",
    "SASE can carry it: intercept DNS and DoH, forward to Protective DNS over DoH",
  ], 12.5);
  table(s, "Logging", 1.5, [3.65, 2.6], ["OMB M-26-14 (M-21-31 rescinded May 22, 2026)", "Date"], [
    ["CISA Logging Reference Architecture published", "Aug. 20, 2026"],
    ["First Agency Logging Plan to OMB and CISA", "Nov. 18, 2026"],
    ["At least Level 1 on every element", "Dec. 18, 2026"],
    ["At least Level 2", "Feb. 16, 2027"],
    ["At least Level 3", "July 6, 2027"],
    ["Minimum content includes source and destination addresses, protocols, ports, session attributes", "Searchable 6 months; retrievable 1 year"],
  ], { x: 6.45, fontSize: 12 });
  callout(s, "CLAW", 5.4, 1.1, "FaRoute", HEX.red, "Leaving MTIPS ends its sensors' telemetry: ",
    "onboard CLAW with CISA and the provider, and decommission MTIPS only after CISA confirms parity, not when cutover finishes (design guidance).");
  sources(s, "Sources: CISA Encrypted DNS Implementation Guidance; OMB M-26-14; CISA Logging Reference Architecture (Aug. 20, 2026); CISA SASE guide v1.0; TIC Program Guidebook. Book 09, Ch 03.");
  notes(s,
`Three things change at the branch when traffic stops passing the old access point: DNS, logging and CISA's telemetry.

DNS first. An enterprise DDI platform satisfies half the Protective DNS obligation: the authorized internal resolvers, root hints disabled, endpoints forced to those resolvers, and encrypted DNS under M-22-09. It doesn't replace CISA's resolvers. The compliant chain is endpoints, agency resolvers, then egress forwarded to Protective DNS. The trap is easy to configure by accident: a vendor's protective-DNS resolver has the same shape as CISA's, and forwarding egress to it satisfies the product design and breaches the federal requirement. So does an endpoint agent that opens its own DNS-over-HTTPS session to a vendor cloud.

Logging. OMB M-26-14, May 22, 2026, rescinded M-21-31. Agencies work to a five-level maturity model where a system's maturity is its lowest-scoring element. CISA published the Logging Reference Architecture on August 20, 2026, and the dates on the slide are worked from that. Minimum content includes source and destination addresses, protocols, ports and session attributes: the transport record a branch with nothing at its edge doesn't produce.

Telemetry. Legacy network telemetry came from sensors at MTIPS and access points through EINSTEIN 1 Enhanced. CISA's SASE guide says that at a SASE-based architecture, that telemetry is no longer provided; agencies can send it to CLAW, the Comprehensive Log Aggregation Warehouse, which requires coordination among agency, CISA and provider. The program's position: CLAW onboarding sits on the critical path, and MTIPS stays until parity is confirmed.`,
  "Book 09, Chapter 03, \"DNS: what satisfies the Protective DNS obligation\" and \"Logging and CISA telemetry after MTIPS\"; Book 08, Chapter 05.");
}

// ================================================================== 9 Policy currency and FedRAMP
{
  const s = content(P1, "Policy currency, and why FedRAMP never decides a route");
  tag(s, "What");
  table(s, "Currency", 1.5, [2.35, 4.15], ["Instrument", "Status, October 2026"], [
    ["M-19-26 (TIC 3.0)", "Operative; no rescinding instrument found"],
    ["M-22-09", "Operative and cited in CISA's 2026 documents; its deadlines have passed"],
    ["M-21-31", "Rescinded May 22, 2026 by M-26-14"],
    ["BOD 22-01, 19-02", "Revoked by BOD 26-04 (June 10, 2026): risk-based clocks, shortest 3 days"],
    ["ED 26-03", "Cisco SD-WAN systems, Feb. 25, 2026; V1 Mar. 11 added syslog to CLAW"],
    ["Networx, WITS 3", "Expired May 31 and Feb. 28, 2026"],
    ["GSA EIS", "Option periods to July 31, 2027 and July 30, 2032"],
  ], { fontSize: 12 });
  panel(s, "FedRAMP", 7.35, 1.5, 5.4, 4.95, HEX.teal, HEX.tealTint, "FEDRAMP", "Certifies services, not paths", [
    "Each agency authorizes its own systems; the route to a service is part of the agency's boundary",
    "Refused on FedRAMP grounds? Ask which control the change violates; there isn't one",
    "Don't cite a Moderate control count: Notice 0013 removed most parameter values",
    "\"FedRAMP Certified\", Classes A–D; mandatory adoption Jan. 1, 2027",
    "No new Rev5 requests after June 11, 2027",
  ], 12.5);
  sources(s, "Sources: OMB M-19-26, M-22-09, M-26-14; CISA BOD 26-04, ED 26-03; GSA legacy contracts and EIS pages; FedRAMP 2026 rules, NTC-0013, Marketplace. Book 09, Ch 03.");
  notes(s,
`Network documents written before mid-2026 are likely to carry at least one stale citation, so the book records the position as of October 21, 2026.

M-19-26 is operative. M-22-09 is operative and still cited as current in CISA's 2026 TIC and SASE documents, but its actions were due by the end of fiscal 2024, so its deadlines have passed and no successor was found. M-21-31 is gone. BOD 26-04, June 10, 2026, revoked BOD 22-01 and 19-02. Emergency Directive 26-03 was issued February 25, 2026, and its March 11 version required affected agencies to send SD-WAN syslog to CISA through CLAW. With Networx and WITS 3 expired, leaving MTIPS is a question of which EIS services are ordered, not of vehicles.

FedRAMP certifies cloud service offerings. It governs the service's security posture, not the topology used to reach it, and it doesn't prohibit SD-WAN or require hairpin routing. Under the 2026 rules each agency still authorizes its own systems. So when a network change is refused on FedRAMP grounds, ask one question: name the control or enhancement it violates. A refusal with no control basis is a governance failure, and the book says to record it as one.

Three precision points for packages written now. Notice 0013, June 16, 2026, removed the vast majority of FedRAMP-assigned parameter values and gives no new counts. The 2026 vocabulary is "FedRAMP Certified" with Certification Classes A through D; Microsoft 365 GCC, for example, is listed as Class C, Moderate; mandatory adoption is January 1, 2027. And FedRAMP stops accepting new Rev5 certification requests on June 11, 2027.`,
  "Book 09, Chapter 03, \"Policy currency, October 2026\" and \"FedRAMP does not constrain routing.\"");
}

// ================================================================== 10 Tokens and consistency
{
  const s = content(P1, "Token security and consistency classes in practice");
  tag(s, "How");
  table(s, "Tokens", 1.5, [2.0, 2.3, 2.3], ["", "Perimeter model", "Token model"], [
    ["Trust lives", "In the caller's network location", "In a signed claim the caller presents"],
    ["Isolation", "A segment, often with its own store", "A verified identity, per request"],
    ["Data layout", "A store per trust domain", "One store, many trust domains"],
    ["Top secret", "Long-lived database credential", "Short-lived token minted on demand"],
  ], { fontSize: 12 });
  txt(s, "Token detail", [
    { text: "Inbound: ", options: { bold: true, color: HEX.navy } },
    { text: "check the signature, that tid is a GUID and the issuer matches it; key stored data by tid.  ", options: {} },
    { text: "Outbound: ", options: { bold: true, color: HEX.navy } },
    { text: "a managed identity's Entra token as the PostgreSQL password, valid 5 to 60 minutes; nothing durable to steal." },
  ], { x: 0.6, y: 4.05, w: 6.6, h: 1.2, fontSize: 13 });
  panel(s, "Consistency", 7.45, 1.5, 5.3, 3.7, HEX.teal, HEX.tealTint, "NEED LESS GLOBAL SYNCHRONIZATION", "Pick the weakest class that's correct", [
    "One authoritative writer per fact; everything else derived",
    "Strong in a region, asynchronous across regions",
    "Example: multi-region strong writes cost 2 × farthest RTT + 10 ms at p99; blocked past 8,000 km by default",
    "Bounded staleness, causal order, CRDT merges, voters on short paths",
  ], 12);
  callout(s, "Risk", 5.35, 1.15, "FaUserShield", HEX.red, "The risk it imports: ",
    "isolation now lives in code. Keep tenant resolution small, tested and fail-closed, and test that no validated identity for tenant A can reach tenant B's data.");
  sources(s, "Sources: NIST SP 800-207; OMB M-22-09; Microsoft Learn — access tokens, claims, PostgreSQL Entra auth, Cosmos DB consistency; Shapiro et al. Book 09, Ch 04.");
  notes(s,
`Chapter 04 is the data-side half of the book, and it matters to network people because it changes which flows have to be synchronous.

The case for many small databases rested on scale, which bigger single machines have weakened, and on isolation by perimeter, which token security removes. NIST SP 800-207 grants no implicit trust based on network location, and M-22-09 says reaching an application from a particular network mustn't be treated as less risky than from the internet. Once every request carries a verifiable claim, the trust boundary travels with the request.

Inbound, a multitenant service validating Entra tokens checks the signature against the issuer's keys, checks that the tenant ID claim is a GUID and the issuer matches that tenant, and keys any stored data by tenant ID. Outbound, Azure Database for PostgreSQL flexible server accepts an Entra access token in the password field; a managed identity requests one, valid five to sixty minutes, so no database password exists to steal.

Distinguish logical from physical centralization: one source of truth is almost always right; one server in one place is limited by propagation delay, blast radius and residency law. Then choose a consistency class per flow. Cosmos DB documents what strong consistency costs over distance: write latency of twice the round trip between the farthest regions plus ten milliseconds at the 99th percentile, and strong consistency across regions more than 8,000 kilometers apart blocked by default.

The cost is named plainly: when isolation is enforced by per-request scoping, the blast radius moves into that code path.`,
  "Book 09, Chapter 04 — Logical Centralization and Token-Based Security.");
}
endModule("Module 1");

// ================================================================== 11 Module 2 divider
{
  const s = divider(P1, "Module 2: Governed transport and legacy protocols", "Part 1 — Policy and transport  ·  Chapters 05–06",
    ["SD-WAN path classes and tail tools; what SASE above it closes", "Securing the controller and edges; the proposed governed path", "Kerberos, round trips and egress on re-routed paths"], 14);
  notes(s,
`Module 2: governed transport and legacy protocols. Chapter 02 separated the pipe from the governor. This module is about the governor in three layers: SD-WAN decides which traffic takes which path and measures it; SASE decides whether a flow is allowed and inspects it at a policy enforcement point; and the governed path, still a proposal in the program, decides whether the path itself was authorized for this caller and intent. Over all three sits the question the sources answered only briefly: who protects the governor?

The second half turns to what rides on those paths. Re-routing a branch breaks things for a short list of documented reasons, and the book replaces several widely repeated mechanisms that don't occur. Design around the real list, not the folklore.`,
  "Book 09, Chapter 05 — SD-WAN, SASE and Governed-Path Transport; Chapter 06 — Legacy Protocols on Re-Routed Paths.");
}

// ================================================================== 12 SD-WAN
{
  const s = content(P1, "SD-WAN works the gap above the floor, and the tail");
  tag(s, "What");
  table(s, "Classes", 1.5, [1.6, 5.75, 2.4, 2.4], ["Class", "What it carries", "Wants", "Path"], [
    ["Lean", "Consensus heartbeats, quorum acknowledgements, clock sync; at a branch, voice, interactive sessions, sign-in", "Minimum RTT and jitter", "Shortest, least congested"],
    ["Bulk", "Snapshots, backups, re-sync, asynchronous log shipping; at a branch, patch and content distribution", "Throughput and cost", "High bandwidth, latency-tolerant"],
  ], { fontSize: 12 });
  const cards = [
    ["Route inflation", HEX.navy, HEX.navyTint, ["Internet pings ran more than 3× the vacuum light bound", "UK South to East US: median 78 ms against a ~62 ms fiber floor, about 1.3× (arithmetic)", "Path selection recovers the excess, nothing below the floor"]],
    ["Shrink the tail", HEX.teal, HEX.tealTint, ["A quorum waits for its slowest member: p99, not the mean", "FEC: one vendor sends a parity packet per four, rebuilding one loss", "Packet duplication on two tunnels; failover before TCP reacts"]],
    ["The ceiling", HEX.red, HEX.redTint, ["New York to London: 56 ms round trip at 200 km/ms", "Every cross-continent synchronous commit pays it", "Keep bulk off the commit path; spend clock certainty, not round trips"]],
  ];
  cards.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    box(s, `Card ${i + 1}`, x, 3.15, 3.95, 3.3, c[2]);
    txt(s, `Card ${i + 1} head`, c[0], { x: x + 0.18, y: 3.25, w: 3.6, h: 0.4, fontSize: 16, bold: true, color: c[1], fontFace: "Cambria" });
    txt(s, `Card ${i + 1} text`, bullets(c[3], 12.5), { x: x + 0.18, y: 3.7, w: 3.62, h: 2.7, paraSpaceAfter: 5 });
  });
  sources(s, "Sources: Bozkurt et al. (PAM 2017); Microsoft Learn — Azure latency (to July 30, 2026), TCP/IP tuning; Cisco SD-WAN policies guide; Spanner. Book 09, Ch 05.");
  notes(s,
`SD-WAN selects among underlay paths per traffic class, and the honest claim is that it helps meaningfully, but only inside the gap between observed latency and the physical floor.

The lean class is consensus heartbeats, leader election, quorum acknowledgements and clock synchronization, and at a branch, voice, interactive sessions and sign-in. The bulk class is snapshots, backups, re-sync after a partition and asynchronous log shipping, and at a branch, patch and content distribution.

Route inflation is the recoverable part. Microsoft's published median between UK South and East US is 78 milliseconds, against a round-trip fiber floor of about 62. A managed backbone runs about 1.3 times the floor on that pair, and that ratio, not a vendor claim, is the ceiling on what path selection does for a cross-ocean flow.

The underrated effect is the tail. A quorum commit waits for its slowest member, so commit latency is a p99 statistic inflated by loss and jitter, not by propagation. Cisco Catalyst SD-WAN, as one documented example, sends a parity packet for every four, recovering one lost packet per group, always or above a loss threshold. Packet duplication sends latency-critical packets on two tunnels and keeps the first. Class separation keeps a patch wave from queuing ahead of a voice call.

The ceiling doesn't move: New York to London is 56 milliseconds round trip at 200 kilometers per millisecond.`,
  "Book 09, Chapter 05, \"SD-WAN as differentiated transport.\"");
}

// ================================================================== 13 SASE above SD-WAN
{
  const s = content(P1, "SASE above SD-WAN: who closes which control");
  tag(s, "Who");
  table(s, "Functions", 1.5, [3.25, 2.4, 2.0], ["Function", "Provided by", "Supports"], [
    ["Path selection, class separation, failover", "SD-WAN overlay", "Availability; SC-7(4)"],
    ["Encryption across every circuit", "SD-WAN tunnels", "SC-8"],
    ["Per-application path telemetry", "SD-WAN edges, controller", "SI-4; logging"],
    ["Web and cloud-app policy, inspection, malware", "SASE: SWG, CASB, NGFW", "SC-7; malicious code"],
    ["Access to private applications", "SASE: ZTNA", "AC-17"],
    ["Telemetry to CISA", "SASE solution to CLAW", "CISA obligations"],
    ["Telecommunications diversity", "The pipes themselves", "CP-8"],
  ], { fontSize: 12 });
  panel(s, "PoP", 8.45, 1.5, 4.3, 2.35, HEX.amber, HEX.amberTint, "THE PEP HAS A LOCATION", null, [
    "A distant or poorly peered PoP is a hairpin with another name",
    "Measure branch-to-PoP latency before cutover",
  ], 12.5);
  panel(s, "Listings", 8.45, 4.0, 4.3, 2.45, HEX.navy, HEX.navyTint, "FEDRAMP STATUS IS PER OFFERING", null, [
    "Listings cover the cloud plane, not the agency's edge appliances",
    "One vendor can hold Moderate and High listings: cite the offering",
  ], 12.5);
  sources(s, "Sources: CISA SASE guide v1.0 (June 2026); CISA TIC 3.0 Branch Office Use Case 3.0; Microsoft 365 connectivity principles; FedRAMP Marketplace (Oct. 21, 2026). Book 09, Ch 05.");
  notes(s,
`SD-WAN governs paths. It doesn't inspect content, enforce web or cloud-application policy, or broker access to private applications; those belong to the security services above it.

CISA's June 2026 guide defines SASE as networking tools, with SD-WAN, routing and bandwidth optimization as examples, combined with a secure web gateway, cloud access security broker, zero trust network access and next-generation firewall. CISA lists SD-WAN among SASE's networking tools, but "for example" isn't "required." SD-WAN alone doesn't satisfy the Branch Office use case; the boundary, flow and malware closures come from above.

The PEP has a location. Microsoft's connectivity guidance says routing through a cloud security provider can hurt if the provider isn't well peered, and to evaluate the number and location of PoPs relative to branches and to Microsoft's peering points. Treat a distant PoP as a hairpin with a different name.

Authorization status isn't uniform. As of October 21, 2026, for example: Palo Alto Networks GCS-HIGH, covering Prisma Access and Prisma SD-WAN, is Class D, High; Cisco Catalyst SD-WAN for Government is Class C, Moderate; Netskope NewEdge Government and Zscaler Private Access are Class D. Zscaler holds both a High and a Moderate internet-access listing, as separate packages. Read statuses from the Marketplace data when the requirement is written.`,
  "Book 09, Chapter 05, \"What the branch edge adds,\" \"SASE above SD-WAN,\" \"The enforcement point has a location,\" \"Authorization status is not uniform.\"");
}

// ================================================================== 14 Securing the governor
{
  const s = content(P1, "Securing the governor before it carries traffic");
  tag(s, "How");
  flow(s, "ED", 1.5, 1.3, [
    { head: "Inventory", body: "Every in-scope manager, controller, edge" },
    { head: "Preserve", body: "Logs and forensic images, stored off the device" },
    { head: "Patch, hunt", body: "Then look for compromise" },
    { head: "Rebuild", body: "From patched images if root-compromised; migrate edges" },
    { head: "Harden, report", body: "Vendor guide; syslog to CISA through CLAW" },
  ], 11.5);
  table(s, "Exposures", 3.0, [3.0, 7.0, 2.15], ["Exposure", "What to require", "SP 800-53 anchor"], [
    ["Takeover of manager or controller", "Phishing-resistant MFA for privileged accounts; management reachable only from an admin network; actions logged", "IA-2(1), AC-6(9), SC-7(5)"],
    ["Rogue edges or peers", "Certificate onboarding from the agency PKI; validator allow-list; alert on unexpected peers", "IA-3, CM-8"],
    ["Unpatched or end-of-support edges", "Fleet inventory with versions and support dates; BOD 26-04 windows; BOD 26-02 replacement plan", "CM-8, SI-2"],
    ["Drift across hundreds of edges", "Hardened baseline; drift detection against the controller's intended state", "CM-6"],
    ["Lost forensic trail", "Management and edge logs off-box to the agency pipeline and CISA", "AU-6, AU-9"],
    ["Cloud-hosted control plane", "Its authorization status and boundary disposition recorded in the package", "CA-3, SA-9"],
  ], { fontSize: 11.5 });
  sources(s, "Sources: CISA ED 26-03 and V1 (Feb. 25 and Mar. 11, 2026); CISA BOD 26-02, BOD 26-04; NIST SP 800-53 Rev. 5 (release 5.2.0). Book 09, Ch 05, 08.");
  notes(s,
`A paper that credits the governor with closing controls owes the reader the controls that protect it. SD-WAN replaces a few hardened egress points with a fleet of internet-facing edges, one per office, and adds a control plane with authority over routing and policy for the whole estate.

The risk isn't hypothetical. On February 25, 2026, CISA issued Emergency Directive 26-03 for Cisco Catalyst SD-WAN Manager: an authentication bypass giving an unauthenticated remote attacker administrative privileges, CVE-2026-20127, and a privilege escalation, CVE-2022-20775. The directive's sequence is a template for any SD-WAN control plane, and the flow on the slide is that sequence: inventory every in-scope system; collect logs and forensic images and store logs off the device; patch; hunt; rebuild the management plane from patched images if root compromise is found, then migrate the edges; harden to the vendor's guide; and send SD-WAN syslog to CISA through CLAW. The point isn't one vendor: be able to run that sequence before you're ordered to.

Two standing directives govern the fleet. BOD 26-02 puts end-of-support edges on 12- and 18-month clocks with continuous discovery after 24 months. BOD 26-04 replaced flat clocks with a risk model whose shortest window is three days, and an internet-facing edge scores high on exposure by definition. An agency that can't patch a branch appliance in those windows has a problem to solve before it deploys several hundred.

The table is the minimum control set. This is step zero of the order of operations.`,
  "Book 09, Chapter 05, \"Securing the controller and the edges\"; Chapter 08, Decision 4.");
}

// ================================================================== 15 Governed path
{
  const s = content(P1, "The governed path, and the records the fabric emits");
  tag(s, "What");
  panel(s, "Path", 0.6, 1.5, 5.75, 4.95, HEX.amber, HEX.amberTint, "PROPOSED DIRECTION, NOT RATIFIED", "Token-bound transport", [
    "Identity is the boundary only halfway: data-plane tokens prove identity at connect, then the session coasts",
    "An overlay tunnel carries identity, application, posture, location, token, lease and certificate chain",
    "Leased, not opened: the lease ends with the token; a session stops being first-class",
    "DRIFT-TRANSPORT: a flow with no issuing token is P2; path versus canonical binding is P4",
    "Adapters observe and emit evidence; they don't route packets or pick a vendor",
  ], 12.5);
  table(s, "Records", 1.5, [1.8, 2.35, 2.05], ["Field (illustrative)", "SD-WAN decision", "SASE decision"], [
    ["Who decided", "controller_id", "pdp_id"],
    ["Decision", "path-selection, failover, steering, QoS", "permit, deny, escalate"],
    ["Identity", "identity_context", "identity_context"],
    ["Scope", "source and destination", "resource_scope"],
    ["Path or overlay", "selected_path", "network_overlay, certificate"],
    ["Basis and time", "policy_refs, timestamp", "policy_refs, timestamp"],
  ], { x: 6.55, fontSize: 11.5 });
  txt(s, "Disposition", [
    { text: "Boundary disposition is explicit: ", options: { bold: true, color: HEX.navy } },
    { text: "in-boundary, a named exception or a compensating controller. Test hooks already exist: SC-23, AC-12, SC-10, SC-7(4)." },
  ], { x: 6.55, y: 5.2, w: 6.2, h: 1.25, fontSize: 13, valign: "middle" });
  sources(s, "Sources: NIST SP 800-207; AWS RDS IAM authentication; Microsoft Learn — PostgreSQL Entra auth FAQ; SPIFFE overview; NIST SP 800-53 Rev. 5 (SC-23, AC-12, SC-10). Book 09, Ch 05.");
  notes(s,
`This slide is forward-looking, and the book labels it that way: it rests on the program's decision on application-aware networking and a token-bound transport plane, whose status is Proposed, with its implementing specifications still open.

The gap it names: NIST SP 800-207 grants access per session, after evaluating trust in the requester. Data-plane tokens meet that at connection and then stop. AWS says its database sign-in token is used only for authentication and doesn't affect the established session; Microsoft documents managed-identity tokens for PostgreSQL as valid for up to 24 hours. The proposal calls identity the new boundary "but only halfway."

The proposal's answer is an application-aware overlay where the path is a typed, governed object, carrying identity, application, posture, location, token, lease and certificate chain. Tunnels are leased, not opened: the lease is bounded by a short-lived, audience-scoped token. It adds a sixth drift class, DRIFT-TRANSPORT: a flow with no issuing token is a P2 finding, and variance between the canonical organizational and location binding and the observed path is P4.

Whether or not the governed path is adopted, the program's SD-WAN and SASE specifications set the same adapter contract: identity consumed from the identity plane, overlays bound to identity-issued certificates, and every decision a record with provenance. The field names are design positions, not a vendor API. Where a PDP emits no records, they may be synthesized from logs and labeled as derived.`,
  "Book 09, Chapter 05, \"The governed path\" and \"The evidence the fabric must emit.\"");
}

// ================================================================== 16 What breaks
{
  const s = content(P1, "What breaks on re-routed paths, and what doesn't");
  tag(s, "What");
  panel(s, "Breaks", 0.6, 1.5, 5.4, 4.95, HEX.red, HEX.redTint, "DOCUMENTED REASONS", "Design around this list", [
    "Idle timeouts and resets at a proxying enforcement point",
    "Certificate pinning and end-to-end mutual TLS under inspection",
    "Authentication bound to the TLS channel (Extended Protection)",
    "NTLM over HTTP needs one held connection",
    "Applications keyed to the client IP address",
    "Protocols the PEP can't parse; HTTP/2 not negotiated by one inspector",
    "MTU black holes where ICMP is filtered: hangs, not failures",
  ], 12.5);
  table(s, "Myths", 1.5, [2.65, 4.0], ["Repeated claim", "What the documents say"], [
    ["A path change breaks TCP sequence numbers", "State lives in the endpoints; a changed source address breaks it. Address continuity is the property"],
    ["KDCs check the client IP in tickets", "KdcUseClientAddresses 0 and KdcDontCheckAddresses 1 by default; RFC 4120 makes addresses optional"],
    ["Kerberos needs a DC within 5 ms", "SkewTime is 5 minutes; the client waits 10 seconds and retries three times"],
    ["Tickets expire mid-session", "TGT 10 hours, renewable 7 days; service tickets 600 minutes; only new connections need one"],
    ["M-22-09 mandates 15-minute tokens", "It sets no lifetime; it asks for continuous session evaluation"],
  ], { x: 6.1, fontSize: 11.5 });
  sources(s, "Sources: RFC 9293; RFC 4120; RFC 4821; Microsoft Learn — Kerberos KDC registry keys, Max-Ticket-Age, TLS inspection, EPA, Delivery Optimization proxy; OMB M-22-09. Book 09, Ch 06.");
  notes(s,
`Sessions do fail more often behind an enforcement point and after a path change, but the earlier analysis gave the wrong reasons, and wrong mechanisms produce wrong remedies.

The documented reasons. An enforcement point that terminates and re-originates connections reaps idle connections on its own schedule, so a connection pool that assumes idle connections stay open finds them closed. TLS inspection decrypts and re-encrypts with the inspector's certificate, so pinned applications and end-to-end mutual TLS fail; Microsoft's own inspection service handles that with bypass rules. Extended Protection binds authentication to a TLS channel a proxy changes, and NTLM over HTTP needs one held connection. Some applications key state to the client IP; Delivery Optimization is documented as unable to pass a proxy that changes it. And path MTU discovery fails as a hang when ICMP "packet too big" is filtered.

Now the corrections. A path change doesn't cause sequence-number discontinuity: RFC 9293 keeps sequence state in each endpoint, and the route isn't part of it. What breaks a connection is a change in the address the server sees, such as a different NAT. So the operative property is address continuity, which strengthens the case for deterministic egress. Kerberos doesn't break under NAT on Microsoft defaults: RFC 4120 makes ticket addresses optional and puts any check on the application server, and Windows doesn't populate or enforce them. There's no five-millisecond requirement; the five is SkewTime, in minutes. Tickets are long-lived, and a service ticket expiring mid-connection doesn't interrupt it. And no federal policy sets a fifteen-minute token refresh.`,
  "Book 09, Chapter 06, \"What actually breaks,\" \"Address continuity, not sequence continuity,\" \"Kerberos: the real dependencies.\"");
}

// ================================================================== 17 Domain controller path
{
  const s = content(P1, "A defined domain controller path for every branch");
  tag(s, "How");
  panel(s, "Needs", 0.6, 1.5, 4.6, 3.75, HEX.navy, HEX.navyTint, "NEEDS A REACHABLE DC", "Five operations", [
    "Initial TGT at logon, including first sign-in",
    "First service ticket per on-premises service; TGT renewal",
    "Group Policy from SYSVOL",
    "Password changes, including forced ones",
    "Hybrid join, and periodic line of sight after it",
  ], 13);
  table(s, "Ways", 1.5, [2.3, 5.0], ["Way to provide the path", "What it covers"], [
    ["Private path", "MPLS, an IPsec tunnel or the SD-WAN overlay to the datacenter, separate from internet egress"],
    ["ZTNA connector publishing DCs", "Entra Private Access, for example: Kerberos SSO only; not Group Policy or password change"],
    ["Kerberos KDC proxy", "Service tickets and password change over HTTPS when no DC can be located"],
    ["Remove the dependency", "Microsoft Entra join instead of hybrid join (Book 05)"],
  ], { x: 5.45, fontSize: 12 });
  callout(s, "NTLM", 5.4, 1.1, "FaPlugCircleXmark", HEX.red, "Hide the DCs and Kerberos falls back silently: ",
    "under NTLM the resource server calls a DC for every new token. Cloud apps keep working, so the report is \"everything works except signing in.\"");
  sources(s, "Sources: Microsoft Learn — Kerberos SSP/AP and overview, NTLM overview, hybrid join, Private Access Kerberos SSO; MS-KKDCP. Book 09, Ch 06.");
  notes(s,
`The list of operations that genuinely need a reachable domain controller is short and specific. Initial TGT acquisition at logon, including the first sign-in on a device. Service tickets for on-premises services, and TGT renewal. Group Policy from SYSVOL. Password changes, including expiry-forced ones. And Microsoft Entra hybrid join: registration needs line of sight, and hybrid-joined devices need it periodically after. Cloud access isn't on the list.

A branch on local breakout reaches its DCs over whatever private path or connector the agency provides, not over the internet egress. Worse, when Kerberos can't reach a KDC, Windows falls back to NTLM and pass-through authentication, silently. Under NTLM the resource server contacts a DC every time it needs a new access token, so hiding DCs quietly manufactures the NTLM the program is eliminating.

Three mechanisms provide the path. A private path. A ZTNA connector that publishes the DCs: Entra Private Access's guidance says that covers single sign-on only, not password change or Group Policy. Or a KDC proxy, which Windows clients use when they can't locate a DC. The durable answer, per Microsoft, is Entra join.

The corrected audit: confirm the KDC address settings are at their defaults; confirm every branch has a defined, monitored DC path for each operation; and where applications key state to source address, set a deterministic egress policy.`,
  "Book 09, Chapter 06, \"What genuinely needs a reachable domain controller,\" \"Ways to provide the path,\" \"The corrected remediation.\"");
}

// ================================================================== 18 Round trips and egress
{
  const s = content(P1, "Round trips dominate; egress must be deterministic");
  tag(s, "How");
  img(s, "ch06-round-trip-decomposition", "Round-trip decomposition table. Branch to enforcement point is 20 to 30 ms one way at baseline and 5 to 15 ms with branch policy and a nearer breakout; enforcement point to cloud region stays 40 to 60 ms, set by region choice and the provider backbone. Round trip per query falls from 120–180 ms to 90–150 ms, so 30 sequential queries fall from 3.6–5.4 s to 2.7–4.5 s, about 17 to 25 percent less. Cutting to 3 batched queries gives 0.36–0.54 s or 0.27–0.45 s, about ten times less on either path.", 0.6, 1.5, 7.0, 3.2);
  txt(s, "Arithmetic note", [
    { text: "Illustrative design assumptions, not measurements. ", options: { bold: true, color: HEX.amber } },
    { text: "The branch device acts on the first leg only. Cutting 30 round trips to 3 gains about an order of magnitude; nearer breakout gains 17–25 percent. Substitute your own measured legs." },
  ], { x: 0.6, y: 4.65, w: 7.0, h: 1.8, fontSize: 13.5, valign: "middle" });
  panel(s, "Egress", 7.85, 1.5, 4.9, 4.95, HEX.teal, HEX.tealTint, "TOKEN ACCESS AND EGRESS", "Make the location signal true", [
    "No federal token lifetime; SP 800-63B-4: AAL2 24 h with 1 h idle, AAL3 12 h",
    "Entra access tokens: 1 hour, up to 28 hours in CAE sessions",
    "Dedicated, enumerable egress for sign-in and resource traffic, or CAE enforces critical events only",
    "Over 5,000 named-location IP ranges disables real-time enforcement",
    "Prioritize small identity exchanges at the constrained link",
  ], 12);
  sources(s, "Sources: Microsoft Learn — continuous access evaluation, strict location enforcement, token protection; NIST SP 800-63B-4 (July 2025); OMB M-22-09. Book 09, Ch 06, 13.");
  notes(s,
`The book redoes the chatty-application arithmetic, because the earlier analysis overclaimed. Take a branch with twenty to thirty milliseconds one way to its enforcement point and forty to sixty from there to the cloud region. A round trip is 120 to 180 milliseconds, and a transaction of thirty sequential queries spends 3.6 to 5.4 seconds on the network. With branch policy and a nearer breakout, the first leg falls to five to fifteen and the transaction to 2.7 to 4.5 seconds, seventeen to twenty-five percent less. The earlier sixfold claim can't happen: no branch appliance deletes the second leg. Cutting thirty round trips to three, by batching, stored procedures or a server-side API, gains about an order of magnitude on either path. The application change dominates, and that belongs to the application owner.

On tokens. M-22-09 sets no token lifetime; it asks for continuous session evaluation. The intervals that exist come from NIST SP 800-63B-4: reauthentication within 30 days at AAL1, 24 hours at AAL2 with a one-hour inactivity timeout, and 12 hours at AAL3, with an inactivity timeout that should be no more than fifteen minutes.

Transport matters in two ways. Queue priority: small identity exchanges shouldn't wait behind a backup. And deterministic egress: SD-WAN, load-balanced NAT, proxies and split tunnels all produce IP address variation. With dedicated, enumerable egress for both sign-in and resource traffic in named locations, CAE enforces location changes too; otherwise only critical events, and tokens fall back to an hour.`,
  "Book 09, Chapter 06, \"Round trips dominate\" and \"Token-based access and continuous verification\"; Chapter 13, \"Measuring cost in your own estate.\"");
}
endModule("Module 2");

// ================================================================== 19 Module 3 divider
{
  const s = divider(P2, "Module 3: Network access control after AD", "Part 2 — Access and architecture  ·  Chapter 07",
    ["802.1X roles, EAP-TLS, and why password methods are failing", "NPS as the AD dependency; Intune compliance retrieval and CoA", "Policy tiers, RADIUS hardening, certificates and a phased rollout"], 13);
  notes(s,
`Module 3: network access control after Active Directory. Every token, policy and inspection point in this book assumes the device on the wire is the device it claims to be. 802.1X turns that assumption into a proof.

User identity doesn't close the gap. An attacker with a stolen credential on an unmanaged laptop is refused by Conditional Access requiring a compliant device. An attacker who skips the credential and plugs into a conference-room jack gets a lease and a route at once, unless the port asks first. Network access control is the device half of zero trust, at the one place a connection is physically made. And the RADIUS server that checks the proof, Windows NPS, is usually the last piece of the network still standing on Active Directory. Book 02 Chapter 04 rates it critical: lose NPS before its replacement is validated, and the result is total loss of network access.`,
  "Book 09, Chapter 07 — Network Access Control: 802.1X and RADIUS; Book 02, Chapter 04.");
}

// ================================================================== 20 802.1X and EAP
{
  const s = content(P2, "Port admission: 802.1X roles and the EAP choice");
  tag(s, "What");
  flow(s, "Roles", 1.5, 1.45, [
    { head: "Supplicant", body: "On the device: Windows via Intune profiles, macOS via MDM, Linux wpa_supplicant" },
    { head: "Authenticator", body: "Switch or access point: relays EAP inside RADIUS and enforces the answer" },
    { head: "Authentication server", body: "RADIUS: validates, returns accept or reject plus VLAN, timeout, filter" },
  ], 12);
  table(s, "EAP", 3.15, [2.2, 1.45, 3.65], ["EAP method", "Credential", "Program position"], [
    ["PEAP-MSCHAPv2", "Password", "Retire: NTLMv1-class weakness; SSO now blocked"],
    ["EAP-TTLS with PAP", "Password", "Not for managed devices"],
    ["PEAP with EAP-TLS", "Certificate", "Acceptable where a platform requires it"],
    [{ text: "EAP-TLS", options: { color: HEX.teal } }, "Certificate", "Required for managed devices (design guidance)"],
  ], { fontSize: 12.5 });
  panel(s, "Breaking", 8.1, 3.15, 4.65, 3.3, HEX.red, HEX.redTint, "PASSWORD METHODS ARE BREAKING", null, [
    "Credential Guard, default on upgraded Windows 11 22H2 and Server 2025, blocks MS-CHAPv2 SSO",
    "October 2026 update: NTLMv1-derived SSO restricted even without Credential Guard",
    "Use RFC 9190 EAP-TLS 1.3; only EAP-TLS for WPA3 192-bit",
  ], 12);
  sources(s, "Sources: IEEE 802.1X-2020; RFC 2865, 3579, 9190; Microsoft Learn — EAP, Credential Guard, NTLMv1 hardening (Oct. 2026); NIST SP 800-120. Book 09, Ch 07.");
  notes(s,
`IEEE 802.1X-2020 is the current standard; it superseded the 2010 edition. Three roles in every admission. The supplicant is software on the device: Windows' built-in supplicant configured through Intune, macOS's native supplicant through MDM, wpa_supplicant on Linux. The authenticator is the switch or access point; it doesn't validate credentials, it relays and enforces. The authentication server is RADIUS: it validates the credential and returns accept or reject with attributes such as a VLAN, a session timeout or a filter. EAP runs between supplicant and server, carried inside RADIUS, and any RADIUS packet carrying an EAP message must also carry a Message-Authenticator. RADIUS protects responses with an MD5 hash over the packet and a shared secret; hold that thought.

The program's position is EAP-TLS for every managed device. It authenticates both ends: the server presents its certificate, the supplicant a machine certificate, and neither can be impersonated without the private key. With strict server validation it also defeats a look-alike rogue access point.

Two source corrections: NIST SP 800-120 was withdrawn in 2018 and can't be cited, and the claim that FedRAMP Moderate mandates mutual-certificate EAP couldn't be traced. EAP-TLS everywhere is design guidance grounded in the controls.

Password methods are failing on their own schedule. Credential Guard is on by default for eligible devices upgraded to Windows 11 22H2 and on Server 2025, and with it MS-CHAPv2 can't use signed-in credentials, so PEAP-MSCHAPv2 prompts or fails. From the October 2026 update, Windows 11 24H2 through 26H2 and Server 2025 restrict NTLMv1-derived credentials for SSO on devices without Credential Guard too.`,
  "Book 09, Chapter 07, \"How port-based admission works\" and \"Choosing the EAP method.\"");
}

// ================================================================== 21 NPS and options
{
  const s = content(P2, "NPS is the AD dependency: the replacement options");
  tag(s, "Who");
  panel(s, "Limits", 0.6, 1.5, 4.55, 4.95, HEX.slate, HEX.grey, "WHY NPS ISN'T THE TARGET", "It shrinks with the migration", [
    "Entra-joined devices don't support RADIUS relying on an on-premises computer object",
    "Entra ID has no RADIUS service; the NPS extension adds MFA only",
    "No posture engine: NAP is gone, and NPS isn't an Intune NAC partner",
    "Not on Server Core; exported config holds shared secrets in clear text",
  ], 12.5);
  table(s, "Options", 1.5, [2.4, 1.3, 1.25, 2.4], ["Option", "Entra-joined", "Intune posture", "How it's authorized"], [
    ["NPS (hybrid-phase interim)", "Only via AD workarounds", "No", "Agency-operated in boundary"],
    ["On-premises NAC (ISE 3.1+, ClearPass, Forescout, FortiNAC)", "Yes", "Yes", "Agency component; no FedRAMP listing applies"],
    ["Cloud NAC or RADIUS service", "Yes", "Varies", "Needs FedRAMP at the right class, for that function"],
    ["VPN or ZTNA federated to Entra", "Yes", "Yes, via CA", "The broker's own authorization"],
  ], { x: 5.4, fontSize: 11.5 });
  txt(s, "D3", [
    { text: "Decision D3 (design guidance): ", options: { bold: true, color: HEX.teal } },
    { text: "the RADIUS platform is gated by the Entra migration timeline. Name the trigger, and authorize Entra-native devices before cutover retires the AD computer objects." },
  ], { x: 5.4, y: 5.05, w: 7.35, h: 1.4, fontSize: 13.5, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — NPS certificates, overview and export; Entra join planning; RADIUS with Entra ID; Intune NAC; FedRAMP Marketplace. Book 09, Ch 07.");
  notes(s,
`NPS works today because most estates are hybrid-joined. It accepts an EAP-TLS or PEAP-TLS client certificate issued by an enterprise CA or mapped to an AD account, expects the device's DNS name in the computer certificate's SAN. Microsoft's Entra join planning states the consequence: Entra-joined devices don't support RADIUS authentication that relies on an on-premises computer object and certificate. Placeholder computer objects don't scale to a fleet. NPS's usefulness shrinks in proportion to the migration.

More limits. Entra ID has no RADIUS service; the NPS extension for Entra MFA adds a second factor while NPS still authenticates against AD, and NPS has no posture engine: Network Access Protection was deprecated in 2012 R2 and is absent from Server 2016 on, and NPS isn't on Intune's NAC partner list. And NPS isn't available on Server Core, and its exported XML configuration holds RADIUS shared secrets in clear text, so handle it as a secret.

The program's decision, D3 in the Federal Compliance book: run NPS well through the hybrid phase. But the decision record names the migration trigger.

The options. Cloud-delivered RADIUS is the most constrained by authorization, so the book is precise: as of October 21, 2026, the Marketplace lists no Portnox, SecureW2 or HPE Aruba cloud offering; IronWiFi is at Initial Implementation with no class; Juniper Mist is Class C, but its description doesn't name a NAC or RADIUS service; Forescout for Government is Class D. A listing covers only what's in its boundary, so confirm the specific RADIUS function is in the certified service before designing around it.`,
  "Book 09, Chapter 07, \"The RADIUS server is the Active Directory dependency\" and \"What can replace it.\"");
}

// ================================================================== 22 Intune posture and CoA
{
  const s = content(P2, "Posture from Intune: compliance retrieval and CoA");
  tag(s, "How");
  flow(s, "CRS", 1.5, 1.45, [
    { head: "1 Register", body: "NAC app in Entra ID, delegated permission to the Intune NAC API" },
    { head: "2 Configure", body: "Discovery URL; certificate auth with IntuneDeviceId://{{DeviceID}} as a SAN URI" },
    { head: "3 Query on connect", body: "Enrollment and compliance state; redirect unenrolled or noncompliant devices" },
  ], 12);
  panel(s, "Timing", 0.6, 3.15, 5.95, 3.3, HEX.navy, HEX.navyTint, "HOW FRESH POSTURE IS", null, [
    "Maintenance check-in about every 8 hours; at most one sync per 6.5 hours",
    "Windows re-evaluates on changes to firewall, antivirus, BitLocker, Secure Boot and OS build",
    "Unfiltered noncompliant-device query at most every 4 hours, or HTTP 503",
    "Legacy Intune NAC service ended March 31, 2024",
  ], 12.5);
  panel(s, "CoA", 6.8, 3.15, 5.95, 3.3, HEX.amber, HEX.amberTint, "CHANGE OF AUTHORIZATION (RFC 5176)", null, [
    "UDP 3799 by default; one switch family listens on 1700, ISE only: check every model",
    "NPS documents no dynamic authorization client",
    "A home-built CoA function needs a path to every switch, its own secret, accounting session IDs and per-device polling",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Intune NAC integration, policy refresh intervals, Windows compliance settings; RFC 5176; Cisco Catalyst 1300 CoA guide. Book 09, Ch 07.");
  notes(s,
`The program uses Intune device compliance as the posture signal instead of an inline NAC probe, because a second agent or agentless probe is a second management plane that has to be reconciled with MDM. The NAC minimum the program asks for: OS patches current within 30 days, BitLocker with the recovery key escrowed to Entra ID, Defender Antivirus on with definitions within seven days, Secure Boot, a TPM, and the firewall on for every profile.

The integration point is Intune's compliance retrieval service. Register the NAC product with Entra ID and grant delegated permissions to the Intune NAC API; configure it with the discovery URL and certificate authentication; and on connect it asks Intune for enrollment and compliance and redirects devices to enrollment or remediation. The certificate must carry the Intune device ID in the SAN as a URI the NAC vendor defines; Microsoft's example is IntuneDeviceId colon slash slash, then the device ID variable. The SAN goes in the SCEP or PKCS profile, Book 07 Chapter 06.

Timing shapes enforcement. Posture is only as fresh as Intune's view: check-in about every eight hours, at most one maintenance sync every six and a half.

Change of Authorization closes the window between a compliance failure and re-authentication. RFC 5176 is Informational; the default port is UDP 3799, but Cisco's Catalyst 1300, for example, listens on 1700 and supports only ISE as a client. NPS documents no CoA client. A home-built function is real engineering: a firewalled path to every switch's CoA port, its own rotated secret, session attributes that exist only in RADIUS accounting, and polling that respects the four-hour limit on broad queries. That cost argues for a NAC platform.`,
  "Book 09, Chapter 07, \"Posture comes from Intune, not from a probe\" and \"Change of Authorization.\"");
}

// ================================================================== 23 Tiers
{
  const s = content(P2, "Five policy tiers, MAB and session timers");
  tag(s, "What");
  img(s, "ch07-admission-decision", "Admission decision flow. A device connects to a switch port or the managed SSID. If no supplicant answers 802.1X, MAC Authentication Bypass checks for an approved IoT or OT device class: yes goes to the IoT segment, management systems only; no goes to the guest segment, internet only. If a supplicant answers, the RADIUS or NAC server checks for a valid EAP-TLS machine certificate chaining to the device identity CA and not revoked: no goes to quarantine, captive portal only. If valid, Intune compliance retrieval asks whether the device is compliant: no goes to remediation, update and management endpoints only; yes goes to production, agency resources per ACL. Change of Authorization moves the port when compliance changes, and re-authentication each shift is the backstop.", 0.6, 1.5, 4.6, 4.95);
  const b = table(s, "Tiers", 1.5, [1.45, 0.8, 2.3, 2.75], ["Tier", "VLAN", "Condition", "Access"], [
    ["Production", "100–190", "Valid certificate and Intune compliant", "Agency resources by ACL"],
    ["Remediation", "200", "Valid certificate, noncompliant", "Intune, Windows Update, Defender; DNS for those"],
    ["Quarantine", "999", "No, unknown, expired or revoked certificate", "Captive portal only"],
    ["Guest", "500", "MAB, unmanaged device", "Internet only"],
    ["IoT and OT", "300", "MAB, approved device class", "Its management systems only"],
  ], { x: 5.45, fontSize: 11.5 });
  table(s, "Timers", b + 0.15, [2.3, 1.65, 3.35], ["Timer (program values)", "Value", "Purpose"], [
    ["Session-Timeout", "28,800 s", "Re-authenticate each shift, CoA or not"],
    ["Termination-Action", "RADIUS-Request", "Re-authenticate, don't disconnect"],
    ["Idle-Timeout", "1,800 s", "Release quiet ports"],
  ], { x: 5.45, fontSize: 11.5 });
  sources(s, "Sources: Microsoft Learn — Intune NAC integration; Microsoft 365 endpoint lists per cloud; IEEE 802.1X-2020. VLAN numbers and timer values are program examples. Book 09, Ch 07.");
  notes(s,
`The RADIUS server returns a VLAN, and optionally a filter and session timeout, for every authenticated device. The VLAN is the enforcement. The numbers on the slide are the program's examples.

A device reaches production only by passing two independent checks: a certificate that's valid, issued by the device identity CA and not revoked, and a compliant state in Intune. Pass the first and fail the second and it goes to remediation, never silently to production. Remediation lets the device fix itself: updates install, definitions refresh, Intune re-evaluates, and CoA moves the port back without a reconnect. Build its allow list from Microsoft's endpoint lists for the tenant's cloud, which differ between commercial, GCC and GCC High. Quarantine's captive portal tells the person to call the help desk.

MAC Authentication Bypass admits devices that can't run a supplicant, phones, printers, badge readers, cameras, HVAC controllers: when the 802.1X timeout expires, the switch sends the MAC as the credential, and the policy matches approved device-class prefixes to the IoT segment and everything else to guest. The book's warning in full: MAB is classification, not authentication. MACs are trivially spoofed, so restrict MAB to classes where a supplicant is impossible, keep IoT routing minimal, and require 802.1X for every class that can do it.

The timers are program values. An eight-hour session timeout with RADIUS-Request as the termination action re-checks certificate and compliance once a shift even when CoA is down. So a device compliant at eight that fails a check at two lands in remediation by four at the latest, and much sooner when CoA works and Intune has registered the change.`,
  "Book 09, Chapter 07, \"The policy tiers,\" \"MAC Authentication Bypass,\" \"Session timers.\"");
}

// ================================================================== 24 RADIUS hardening, Wi-Fi, certs
{
  const s = content(P2, "RADIUS hardening, Wi-Fi and the server certificates");
  tag(s, "How");
  panel(s, "Radius", 0.6, 1.5, 3.95, 4.95, HEX.red, HEX.redTint, "SECURE RADIUS ITSELF", "After Blast-RADIUS", [
    "CVE-2024-3596 forges an Access-Accept for non-EAP methods such as PAP",
    "Require Message-Authenticator everywhere: turn on the KB5040268 settings, off by default (design guidance)",
    "One secret per authenticator, 32+ random characters, rotated every 180 days",
    "RadSec on new gear; RFC 6614 and 9765 are Experimental",
  ], 12);
  panel(s, "WiFi", 4.7, 1.5, 3.95, 4.95, HEX.navy, HEX.navyTint, "WIRED AND WIRELESS", "Same supplicant, same certificate", [
    "Multi-auth ports: the phone by MAB, the PC behind it by EAP-TLS",
    "Intune wired profile: Enforce on a mismatched port strands the device; pilot it",
    "WPA3-Enterprise is 802.1X; SAE is WPA3-Personal",
    "192-bit mode permits only EAP-TLS; Wi-Fi 7 enterprise needs WPA3-Enterprise",
  ], 12);
  table(s, "Certs", 1.5, [1.75, 2.2], ["Certificate", "Issuer and renewal"], [
    ["RADIUS server (EAP-TLS)", "Retained AD CS; CyberArk Certificate Manager renews; re-select in NPS (inference)"],
    ["NAC servers (ISE etc.)", "AD CS; request and import, or an adaptable driver (inference)"],
    ["NPS MFA extension", "Self-signed, 2 years; inventory or CLM-issue (design guidance)"],
    ["Device EAP-TLS", "Cloud PKI or AD CS; Intune renews"],
  ], { x: 8.8, fontSize: 11 });
  sources(s, "Sources: Blast-RADIUS (CVE-2024-3596); Microsoft KB5040268; IETF radext (RFC 6614, 9765); Microsoft Learn — Intune wired profiles, WPA3; CyberArk CM 26.1 docs. Book 09, Ch 07.");
  notes(s,
`RADIUS over UDP protects its responses with MD5, and in 2024 that became exploitable. Blast-RADIUS, CVE-2024-3596, lets an attacker between a RADIUS client and server forge an Access-Accept for a failed login without learning the credential or the secret. Nearly all UDP implementations were affected for non-EAP methods such as PAP; EAP is largely protected because the Message-Authenticator RFC 3579 requires can't be forged. For NPS, KB5040268 adds settings to send and require it and drop unprotected responses; all are off by default, and NPS already requires it for EAP clients. The program turns them on everywhere. Secrets: one per authenticator, 32 or more random characters, in a managed store, rotated every 180 days. RadSec replaces secrets and MD5 with mutual TLS; its standards-track version was in IESG evaluation in September 2026.

Wired: 802.1X on every access port facing an end device, multi-authentication so a phone and the PC behind it authenticate separately. One Intune warning: a wired profile set to Enforce on a port whose configuration doesn't match strands the device until the policy is removed by hand. Keep it at Do not enforce until the switch side enforces. Wireless: WPA3-Enterprise is 802.1X; SAE is WPA3-Personal.

Certificates. The RADIUS server certificate stays on retained AD CS while NPS remains, renewed through CyberArk Certificate Manager with the network team as owner; the CAPI driver installs it, and re-selecting it in the NPS policy is the book's inference. The NPS MFA extension's own certificate is easy to miss: self-signed, valid two years, on every NPS server. Device certificates are Intune's job.`,
  "Book 09, Chapter 07, \"Securing RADIUS itself,\" \"Wired and wireless,\" \"Certificates in this book and the CLM platform\"; Book 07, Chapters 05–07.");
}

// ================================================================== 25 Rollout and controls
{
  const s = content(P2, "Rollout in four phases, and the controls it closes");
  tag(s, "How");
  const b = table(s, "Phases", 1.5, [2.05, 0.95, 5.6, 3.55], ["Phase", "Weeks", "Work", "Exit"], [
    ["1 Monitor mode", "1–4", "802.1X in open mode on every port; the switch ignores rejects; log everything", "Baseline: compliant, noncompliant, MAB, bad certificates, unknowns"],
    ["2 Wired enforcement", "5–10", "Open mode off on workstation ports; re-push certificates; register IoT and OT in IPAM; captive portal; CoA tested; detections to the SOC", "Workstation ports enforced"],
    ["3 Wireless enforcement", "11–14", "WPA3-Enterprise profile through Intune; guest SSID in parallel", "Logs show every managed device moved; legacy SSID retired"],
    ["4 IoT segmentation", "15–20", "Per-class ACLs; IPAM registration before any MAB approval", "Rogue-device tabletop: quarantine, SOC alert, CoA"],
  ], { fontSize: 11.5 });
  callout(s, "Controls", b + 0.15, 6.5 - b - 0.15, "FaClipboardCheck", HEX.teal, "Controls closed: ",
    "IA-3, IA-3(1), AC-3, AC-18(1), AC-19, AC-20, SC-7(5), CM-6, CM-7 and CM-8. Not SC-7(3): that limits external connections, the TIC question, not switch ports.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (IA-3 discussion names 802.1X and EAP-TLS; SC-7(3)); Microsoft Learn — Intune NAC integration. Phases and durations are program figures. Book 09, Ch 07.");
  notes(s,
`Turning on enforcement before every device is enrolled is how a NAC program causes an outage: printers, badge readers and anything else without a supplicant lose connectivity at once. The program's sequence runs four phases over roughly 90 to 180 days, and it sits inside the RADIUS migration sequence in Book 02 Chapter 04: inventory every RADIUS client and policy, run old and new in parallel, cut clients over, and decommission NPS only after a thirty-day validation window. The phases and durations are program figures.

Monitor mode, weeks one to four: the exchange runs, RADIUS returns accept or reject, and the switch ignores the reject. The phase ends with a baseline, devices that passed and were compliant, passed but noncompliant, fell to MAB, had missing or expired certificates, or were unrecognized, which decides readiness and seeds the exception list. The later phases are on the slide.

The detections are the minimum three: a production-VLAN device whose Intune state isn't compliant; repeated 802.1X failures from one MAC in an hour; and a valid device certificate presented from a MAC that doesn't match the enrolled device, which suggests theft and should trigger quarantine.

The controls this closes: IA-3, whose discussion names 802.1X with EAP and RADIUS with EAP-TLS, plus IA-3(1), AC-3, AC-18(1), AC-19, AC-20, SC-7(5), CM-6, CM-7 and CM-8. One correction: the source listed SC-7(3), which limits external network connections and cites TIC. It belongs to Chapter 03, not switch ports.`,
  "Book 09, Chapter 07, \"Inventory, profiling and logs,\" \"Rolling it out,\" \"The controls this closes\"; Book 02, Chapter 04.");
}
endModule("Module 3");

// ================================================================== 26 Module 4 divider
{
  const s = divider(P2, "Module 4: Reference architecture and ownership", "Part 2 — Access and architecture  ·  Chapters 08–09, 13",
    ["Consistency classes meet network classes; four branch patterns", "Five design decisions and how to check each", "One decider per row, an owner per gate, and the evidence"], 11);
  notes(s,
`Module 4: reference architecture and ownership. The earlier modules argued the doctrine in pieces: centralize the truth and let tokens make it safe to share, refuse to span the speed of light synchronously, use SD-WAN to take paths down to the floor and SASE to make the traffic lawful, and admit only devices that prove who they are.

This module puts the pieces together twice, once for a data plane and once for a branch office, under the same rule. Then it turns to the part of the book that is new: the most expensive network mistakes aren't engineering errors but ownership gaps, a circuit bought before anyone owned the governor, a cutover before anyone filed the boundary change. Naming one decider for each step is cheaper than any product.`,
  "Book 09, Chapter 08 — Reference Architecture; Chapter 09 — Who Owns the Network and Its Transport; Chapter 13.");
}

// ================================================================== 27 One rule
{
  const s = content(P2, "One rule: align consistency class with transport class");
  tag(s, "What");
  table(s, "Mapping", 1.5, [2.75, 2.15, 1.5, 2.05], ["Data need", "Consistency", "Network class", "Synchronous across regions?"], [
    ["Authoritative writes to the source of truth", "Strong or serializable", "Lean", "No; inside a region"],
    ["Quorum durability across nearby zones", "Synchronous replication", "Lean", "Within a region only"],
    ["Cross-region durability and DR", "Asynchronous", "Bulk", "No, by design"],
    ["Read-mostly access far from the writer", "Bounded staleness, replica", "Bulk (refresh)", "No"],
    ["Multi-writer collaborative data", "Causal or CRDT merge", "Bulk", "No; merges"],
    ["Analytics and reporting", "Eventual", "Bulk", "No"],
  ], { fontSize: 11.5 });
  panel(s, "Place", 9.25, 1.5, 3.5, 4.95, HEX.teal, HEX.tealTint, "PLACEMENT", null, [
    "Voters on lean links; non-voting learners across regions",
    "Merge, don't coordinate, multi-writer data",
    "Clock certainty only where strong cross-region semantics are required",
    "Managed example: HA RPO 0 in-region; cross-region replicas typically 30 s–5 min",
  ], 12);
  txt(s, "SaaS", [
    { text: "Worked example: ", options: { bold: true, color: HEX.navy } },
    { text: "the program's SaaS data plane keeps one regional writer with token security in and out, so SD-WAN would matter only for asynchronous DR replication and replica freshness." },
  ], { x: 0.6, y: 5.25, w: 8.5, h: 1.2, fontSize: 13.5, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — PostgreSQL flexible server continuity, read replicas, managed identity; etcd learners; Shapiro et al. Book 09, Ch 04, 08.");
  notes(s,
`One rule ties the data layer to the network layer: align consistency class with transport class. The data layer asks what must be strongly consistent; the network layer asks what rides the lean path and what rides the bulk path. They're the same question from opposite ends.

Applied to common data needs, only the top two rows ride the lean path, and neither crosses a region synchronously. Everything that spans distance is asynchronous and rides bulk. Managed databases document the split as service behavior: Azure Database for PostgreSQL flexible server gives in-region high availability a recovery point objective of zero, while cross-region read replicas update asynchronously with an RPO Microsoft gives as typically thirty seconds to five minutes, and says replicas aren't for synchronous, up-to-the-minute scenarios. Placement makes it concrete: in Raft systems, etcd's learners replicate but can't vote or count toward quorum, so put voters on short links and learners across regions.

The worked example is the program's own multitenant SaaS data plane: one shared PostgreSQL flexible server holds the tenant registry, tenants are verified per request by token signature and tenant ID, the service signs in to the database with a short-lived Entra token, and hard-isolation customers get a provisioned stamp. With one writer in one region, there's no global synchronous commit path for SD-WAN to optimize. Differentiated transport would matter only for asynchronous disaster-recovery replication and read freshness, until a second synchronous region is needed. The one risk named plainly is the tenant-resolution code path.`,
  "Book 09, Chapter 08, \"The single design rule,\" \"The mapping,\" \"Worked example: the program's SaaS data plane.\"");
}

// ================================================================== 28 Branch patterns
{
  const s = content(P2, "Four branch egress patterns, compared");
  tag(s, "What");
  const b = table(s, "Patterns", 1.5, [2.25, 2.4, 2.25, 2.6, 2.65], ["", "A. Hairpin", "B. Bare breakout", "C. Governed breakout", "D. Agent SASE"], [
    ["Path to a cloud region", "Detour to the access point and back", "Shortest", "Branch to nearby PoP to region", "Device to nearest PoP to region"],
    ["Enforcement", "Central access point", "None the agency controls", "Branch edge and SASE PoP", "SASE PoP; branch firewall for agentless devices"],
    ["Path telemetry", "Only at the access point", "None", "At the edge, per path", "Agent-side; none for agentless"],
    ["CISA telemetry", "Existing integration", "None", "SASE to CLAW", "SASE to CLAW"],
    ["Boundary status", "Assessed", { text: "Regression", options: { bold: true, color: HEX.red } }, "Assessed after the boundary change", "Assessed once PoP and telemetry verified"],
  ], { fontSize: 11.5 });
  callout(s, "Choose", b + 0.15, 6.5 - b - 0.15, "FaRoute", HEX.teal, "Per site (design guidance): ",
    "choose A, C or D from measured latency and device mix, never B. C is the reference pattern; B isn't even an option in the Branch Office use case.");
  sources(s, "Sources: CISA SASE guide v1.0 (legacy and notional architectures); CISA TIC 3.0 Branch Office Use Case 3.0 (security patterns); Microsoft 365 connectivity principles. Book 09, Ch 08.");
  notes(s,
`At a branch, the rule changes vocabulary but not shape. The lean class is voice, interactive traffic, sign-in and the few AD operations that still need a domain controller; the bulk class is backups, patch waves and content. The question the branch adds is where traffic leaves and what enforces policy when it does.

A, hairpin: branch traffic goes to the campus or a managed access point and leaves there. CISA lists backhaul contention and latency first among its costs. The boundary is assessed and the telemetry reaches CISA, but every flow pays the detour.

B, bare local breakout: a direct circuit and a router. It fixes latency and loses the boundary, a regression relative to where it started.

C, governed local breakout: an SD-WAN edge steers each class, lean traffic to a nearby enforcement point, bulk where it's cheapest, campus traffic over the overlay, with enforcement split between the edge and a nearby SASE PoP. It's the program's reference pattern: every path class lands on enforcement of equal strength.

D, agent-delivered SASE: agents send traffic to the nearest PoP wherever the device is, and a branch firewall forwards for devices that can't run an agent. Its blind spots are agentless devices, branch-to-PoP path quality, and PoP distance.

These map onto the use case's own options: A is the campus option, C combines direct access with a security service, D is the security-service option by agent. B isn't an option at all, because every option puts a PEP somewhere the agency defines policy.`,
  "Book 09, Chapter 08, \"Branch architectures.\"");
}

// ================================================================== 29 Five decisions
{
  const s = content(P2, "Five design decisions, and how to check each");
  tag(s, "How");
  table(s, "Decisions", 1.5, [3.35, 4.2, 4.6], ["Decision", "What it requires", "How to check it"], [
    ["1 One writer, one region", "Writer and synchronous quorum in one region; cross-region copies asynchronous, bounded or merged", "Per system of record: writer's region, every replica's mode; any remote synchronous replica justified and measured"],
    ["2 Classify every flow; write the path policy", "Path class, priority, failover and source-address presentation per application class: the SC-7(4) policy", "The assessor gets a document naming every class; the SD-WAN configuration diffs against it"],
    ["3 Egress pattern per site; boundary first", "A, C or D from measured latency; the boundary change filed before the first local flow", "Every locally egressing site has an approved change dated before cutover and a named PEP per class"],
    ["4 The governor under control first", "Privileged access, baselines, BOD 26-04 patching, BOD 26-02 tracking, off-device logs", "Fleet inventory with versions and support dates; an ED 26-03-style sequence runnable within a day"],
    ["5 Make the path evidence", "Path telemetry and decision records to the log pipeline; CISA telemetry to CLAW", "For any branch, application and hour: path, latency, policy and PEP"],
  ], { fontSize: 11.5 });
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (SC-7(4)); CISA BOD 26-02, BOD 26-04, ED 26-03; CISA SASE guide v1.0 (telemetry equivalence). Book 09, Ch 08.");
  notes(s,
`Most of the risk in this architecture sits in five decisions. Each fails quietly when skipped: nothing breaks on the day, and the cost shows up later as latency nobody can attribute, a finding at assessment, or a breach of a device nobody patched.

Decision 1, one writer, one region. Check: for each system of record, name the writer's region and every replica's mode; any synchronous replica outside that region needs a written justification and a measured commit latency.

Decision 2, classify every flow and write the path policy: path class, priority, failover behavior and source-address presentation per application class. That's the SC-7(4) traffic-flow policy. Check: the assessor asking for the policy gets a document, and the SD-WAN configuration can be diffed against it.

Decision 3, choose the egress pattern per site from measured latency and device mix, never B, and file the boundary change before the first production flow leaves locally.

Decision 4, bring the governor under control before it carries traffic: privileged access, baselines, vulnerability management on BOD 26-04's windows, end-of-support tracking under BOD 26-02, management logs off the devices.

Decision 5, make the path evidence. CISA's guide is explicit that replacing MTIPS requires equivalent telemetry. Without it, the architecture works but can't be shown to work. Check: for a sample branch and application, produce the path, latency, policy and PEP for any hour in the retention window.`,
  "Book 09, Chapter 08, \"The five design decisions.\"");
}

// ================================================================== 30 RACI
{
  const s = content(P2, "One decider per row: the network responsibility matrix");
  tag(s, "Who");
  table(s, "RACI", 1.5, [4.0, 2.6, 2.75, 2.8], ["Decision or work item", "Decides", "Does the work", "Consulted (selected)"], [
    ["Governor platforms: SD-WAN, SASE, NAC (D3)", "Sponsor and CIO", "Network eng., acquisition", "AO, system owner, CISO"],
    ["Transport per site on measured physics", "Network engineering", "Network engineering", "Security arch., acquisition"],
    ["Target attributes for every refresh", "Security architecture", "Sec. arch., network, acquisition", "CIO, CISO"],
    ["TIC 3.0 use case and PEP placement", "Security architecture", "Security architecture", "AO, CISO, network, SecOps"],
    ["Boundary change filed before cutover", "Authorizing official", "System owner, CISO/ISSO", "CIO, sec. arch., network"],
    ["Governor live and logging, per site", "System owner", "Network engineering", "CISO, SecOps, facilities"],
    ["SC-7(4) Microsoft 365 exception", "Authorizing official", "System owner, sec. arch., network", "CISO, SecOps, app owners"],
    ["CISA telemetry parity, per branch", "CISO", "Security operations", "System owner, network"],
    ["Managed TIC or MPLS termination", "Contracting officer", "Acquisition", "CISO, network, SecOps"],
    ["MAB exception (no end date: AO)", "CISO", "Network eng., facilities", "Security operations"],
    ["NPS retirement timing", "Sponsor and CIO", "Network, endpoint and identity", "AO, CISO, SecOps"],
  ], { fontSize: 11 });
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (AO role); FAR 1.602-1 (contracting officer authority); GSA EIS; CISA SASE guide (CLAW coordination). Matrix is program design guidance. Book 09, Ch 09.");
  notes(s,
`Chapter 09 separates three kinds of involvement, as Book 02 does: a role decides when it's accountable and can say no, does the work when it builds, buys or runs the thing, and is consulted when the decision can't be made well without its input. The split matters more for networks than most systems, because many network decisions are risk decisions that look like engineering or purchasing. Terminating a TIC circuit before CLAW parity or keeping a MAB exception with no end date is a risk acceptance, and the authorizing official accepts risk under the Risk Management Framework. And under the FAR, only a contracting officer can terminate a contract.

The matrix is the program's recommended model; the slide shows a selection of its rows. Adapt it, but keep one decider per row. The boundary change and governor-before-traffic rows split on purpose: the AO decides whether the boundary may change, the system owner decides site by site whether a site is ready, because a site without its control layer live is the cheapest way to turn an approved design into an unapproved one. Telemetry splits three ways: the CISO decides parity, security operations confirms it, and the contracting officer terminates only after confirmation, which makes the field-office exit criterion enforceable. MAB splits on time: the CISO can approve a class, but one with no end date goes to the AO. And the refresh row goes to security architecture, because BOD 26-02 put boundary-device replacement on a directive clock, and a like-for-like refresh forecloses the architecture question for the life of the equipment.`,
  "Book 09, Chapter 09, \"Decision rights and work are different things,\" \"The roles,\" \"The responsibility matrix,\" \"Roles in each system.\"");
}

// ================================================================== 31 Owner per gate and evidence
{
  const s = content(P2, "An owner per gate, and the boundary-change evidence");
  tag(s, "How");
  table(s, "Gates", 1.5, [2.55, 2.0, 3.25], ["Step", "Decides", "Gate that ends it"], [
    ["0 Secure the governor", "CISO / ISSO", "Vulnerability management, privileged access, off-box logs"],
    ["1 Buy the pipe", "Network eng.; CO orders", "Latency and diversity recorded; order against a renewal date"],
    ["2 Governor live", "System owner, per site", "Live, inspecting, logging to the SIEM"],
    ["3 Boundary change", "Authorizing official", "Decided before the first cutover"],
    ["4 Microsoft 365", "Authorizing official", "SC-7(4) memo signed; site register current"],
    ["5 Evidence", "CISO", "Registered; CISA parity before a circuit ends"],
  ], { fontSize: 11.5 });
  panel(s, "Evidence", 8.6, 1.5, 4.15, 4.95, HEX.navy, HEX.navyTint, "THE PACKAGE CARRIES", null, [
    "Application-to-path policy (SC-7(4))",
    "QoS export; failover test with measured recovery time",
    "Per-application path telemetry and decision records",
    "Exceptions with need, duration and review",
    "CLAW parity confirmation",
    "Known limitations, including M-26-14 records no branch produces",
  ], 12);
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (significant change); NIST SP 800-53 Rev. 5 (SC-7(4)); OMB M-26-14; CISA SASE guide v1.0. Book 09, Ch 09, 13; Appendix A.");
  notes(s,
`Each step in the order of operations has one decider, and the gate between steps is a named person, not a date.

Step zero, the CISO and ISSO decide, network engineering does the work, and the gate is the controller and edges under vulnerability management, privileged access and off-box logging. Step one splits two ways: network engineering decides the physics, and the contracting officer places the order, sequenced to a renewal date already in the pipeline. Step two is decided by the system owner site by site, and the gate is a control layer live, inspecting and logging to the SIEM. Step three is the authorizing official's, prepared by the system owner and ISSO. Step four: the AO signs the SC-7(4) memo and the system owner the site register; Appendix A carries the instruments. Step five, the CISO, with security operations confirming CISA telemetry parity per branch.

The boundary change is decided on evidence, and it's the same material that later supports the SC-7, SI-4, AC-17 and CA-7 assertions: the application-to-path policy, which is the SC-7(4) traffic-flow policy; the QoS policy as a configuration export; the failover policy with a measured recovery time per site class; per-application path telemetry, or flow records plus synthetic transactions in the interim; the SD-WAN and SASE decision records; each exception with its mission need, duration and review; CLAW onboarding confirmation; and the known limitations. Under M-26-14, transport is also a logging-maturity question: where nothing at a branch produces the address, port and session record, say so as a known limitation rather than leave it implicit.`,
  "Book 09, Chapter 09, \"An owner for each step\"; Chapter 13, \"The decision sequence\" and \"Evidence for the boundary change\"; Appendices A–B.");
}

// ================================================================== 32 Closing
{
  const s = content(P2, "Decisions for the owners, and next steps");
  tag(s, "Who");
  table(s, "Asks", 1.5, [3.75, 2.2], ["Decision to put in front of an owner", "Owner"], [
    ["Governor platform and the NPS exit trigger (D3)", "Sponsor and CIO"],
    ["Target attributes for every refresh, BOD 26-02 included", "Security architecture"],
    ["Boundary change before any local egress", "Authorizing official"],
    ["MTIPS exit only on CLAW parity", "CISO"],
    ["EAP-TLS everywhere; MAB limits", "CISO"],
  ], { fontSize: 12.5 });
  panel(s, "Start", 6.75, 1.5, 6.0, 4.95, HEX.teal, HEX.tealTint, "START NOW: NO AWARD NEEDED", null, [
    "Verify egress DNS terminates at Protective DNS",
    "Inventory branch cleartext protocols as an SC-8 register",
    "Check KDC address defaults and every branch's DC path",
    "Write the application-to-path policy (SC-7(4))",
    "Specify 802.1X, RadSec, CoA, WPA3-Enterprise and PQC in refreshes",
    "Start CLAW onboarding; run 802.1X monitor mode",
    "Instrument a paired branch study before buying",
  ], 12.5);
  txt(s, "Close", "Governor before traffic, boundary before cutover, evidence before a circuit ends.",
    { x: 0.6, y: 4.6, w: 5.9, h: 1.85, fontSize: 17, bold: true, color: HEX.navy, fontFace: "Cambria", valign: "middle" });
  sources(s, "Sources: as on the preceding slides; full lists in the backup section. Actions and owners are program design guidance. Book 09, Ch 03, 06–09, 13.");
  notes(s,
`To close, the decisions this deck asks owners to make, and the work that needs no new contract.

Five decisions. The sponsor and CIO choose the governor platforms and write the NPS exit trigger into the D3 decision record, so the RADIUS replacement authorizes Entra-native devices before AD computer objects retire. Security architecture writes target attributes into every equipment refresh, including the BOD 26-02 replacements, because a like-for-like refresh forecloses the architecture for the life of the device. The authorizing official decides the boundary change before any site egresses locally. The CISO makes CLAW parity, confirmed by security operations, the exit criterion for leaving MTIPS. And the CISO sets EAP-TLS for managed devices and keeps MAB to device classes that can't run a supplicant, with end dates.

Then the work that starts on Monday. Verify egress DNS really terminates at Protective DNS. Inventory cleartext protocols on branch links as an SC-8 exposure register. Confirm the KDC address settings are at their defaults and that every branch has a defined, monitored path to a domain controller. Write the application-to-path policy now. Put 802.1X, RadSec, CoA, WPA3-Enterprise and post-quantum key exchange into every refresh specification. Start CLAW onboarding, which is a three-party effort with its own lead time, and run 802.1X in monitor mode to get the baseline. And before buying, instrument a paired-branch study: two comparable branches, thirty days before and after a change at one, and the difference in differences as the effect size.

Governor before traffic, boundary before cutover, evidence before a circuit ends. Chapters 03 through 09 and 13, and the appendices, carry the detail. Thank you.`,
  "Book 09, Chapters 03, 06, 07, 08, 09 and 13.");
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
    "ITU-T G.114 (05/2003, amended 2009), One-way transmission time.  ·  NIST CODATA speed of light.  ·  Bozkurt et al., Why Is the Internet so Slow?! (PAM 2017).  ·  ITU-R M.2410-0.",
    "IETF RFC 4364, BGP/MPLS IP VPNs (Sec. 1.6, 13.1).  ·  NIST SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B, OSCAL catalog and baselines.  ·  NIST SP 800-37 Rev. 2.",
    "CISA, TIC 3.0 core guidance, September 2026 republication: Program Guidebook 1.2, Reference Architecture 1.2, Security Capabilities Catalog 3.3, Use Case Handbook 1.2, Overlay Handbook 1.2.",
    "CISA, TIC 3.0 Branch Office Use Case 3.0; Remote User 2.2; Cloud 1.2; Traditional 1.0.  ·  CISA, The Journey to Zero Trust: Using SASE in a Modern TIC 3.0 Solution, v1.0 (June 2026).",
    "OMB M-19-26, M-22-09, M-26-14, M-26-15.  ·  EO 14028, EO 14306, EO 14412.  ·  CISA BOD 18-01, 23-02, 26-02, 26-04; ED 26-03 and V1.  ·  CISA Encrypted DNS Implementation Guidance (May 2024).",
    "CISA Logging Reference Architecture (Aug. 20, 2026).  ·  CISA Zero Trust Maturity Model v2.0.  ·  NIST SP 800-52 Rev. 2; CMVP FIPS 140-3 transition.",
    "FedRAMP: Consolidated Rules for 2026 (use, definitions, timeline); Notice NTC-0013 (June 16, 2026); Marketplace listing MSO365MT.",
    "GSA: legacy IT contracts (Networx, WITS 3); Enterprise Infrastructure Solutions and EIS transition pages.",
    "NIST SP 800-207.  ·  Microsoft Learn: Msv3 sizes; access tokens; validating claims; PostgreSQL flexible server managed identity and Entra auth; Cosmos DB consistency.  ·  Shapiro et al., CRDTs (2011).",
    "Full footnotes with links and access dates: Book 09, Chapters 01–04 (whalermike.github.io/modernization-workbook/docs/books/b09-network/).",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}
{
  const s = content("Backup", "Sources behind Module 2 — Governed transport");
  const src = [
    "Bozkurt et al. (PAM 2017).  ·  Microsoft Learn: Azure network round-trip latency statistics (30 days to July 30, 2026); TCP/IP performance tuning for Azure VMs.",
    "Cisco Catalyst SD-WAN Policies Configuration Guide 17.x: Forward Error Correction; Packet Duplication.  ·  Corbett et al., Spanner (OSDI 2012).",
    "CISA SASE guide v1.0 (June 2026); CISA TIC 3.0 Branch Office Use Case 3.0.  ·  Microsoft Learn: Microsoft 365 network connectivity principles.",
    "FedRAMP Marketplace product data (Oct. 21, 2026): Palo Alto Networks, Zscaler, Netskope, Cisco listings.  ·  GSA, Trusted Internet Connections (EIS solutions).",
    "NIST SP 800-207.  ·  AWS RDS IAM database authentication.  ·  Microsoft Learn: PostgreSQL Entra authentication FAQ.  ·  SPIFFE overview.",
    "CISA ED 26-03 and V1 (Feb. 25 and Mar. 11, 2026); BOD 26-02; BOD 26-04.  ·  NIST SP 800-53 Rev. 5 (SC-7(5), SC-10, SC-23, AC-12, IA-3, CM-6, CM-8, AU-9, CA-3, SA-9).",
    "RFC 9293 (TCP); RFC 4120 (Kerberos); RFC 4821 (PLPMTUD).  ·  Microsoft Learn: TLS inspection FAQ and limitations; KB 976918; IIS NTLM; Delivery Optimization proxy.",
    "Microsoft Learn: Kerberos KDC registry keys; Max-Ticket-Age; Max-Renew-Age; service ticket lifetime; Kerberos SSP/AP; NTLM overview; hybrid join plan and FAQ; Private Access Kerberos SSO; MS-KKDCP.",
    "NIST SP 800-63B-4 (July 2025).  ·  Microsoft Learn: continuous access evaluation; strict location enforcement; token protection.  ·  OMB M-22-09.",
    "Full footnotes with links and access dates: Book 09, Chapters 05–06.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}
{
  const s = content("Backup", "Sources behind Module 3 — Network access control");
  const src = [
    "IEEE 802.1X-2020, Port-Based Network Access Control.  ·  RFC 2865 (RADIUS); RFC 3579 (RADIUS and EAP); RFC 2132 (DHCP options); RFC 9190 (EAP-TLS 1.3); RFC 5176 (CoA).",
    "Microsoft Learn: EAP for network access; Credential Guard known issues; Windows message center (NTLMv1 hardening, October 2026); NPS best practices.",
    "NIST SP 800-120 (withdrawn 2018); NIST SP 800-153.  ·  Microsoft Learn: PEAP and EAP certificate requirements; Entra join planning (RADIUS and Wi-Fi); RADIUS with Entra ID; NPS overview.",
    "Microsoft Learn: Intune NAC integration (compliance retrieval service); policy refresh intervals; Windows compliance settings; NPS configuration export.",
    "FedRAMP Marketplace product data (Oct. 21, 2026): IronWiFi, Juniper Mist, Cisco Meraki US Government Region, Forescout for Government.",
    "Cisco: Catalyst 1300 Change of Authorization; ISE 3.4 Administrator Guide.  ·  Microsoft Learn: Intune Wi-Fi and wired profiles; NetworkAuthenticationType; Windows network security.",
    "Blast-RADIUS (CVE-2024-3596).  ·  Microsoft Support KB5040268.  ·  Microsoft Learn: RADIUS clients (Message-Authenticator).  ·  IETF radext: RFC 6614, RFC 9765.",
    "CyberArk Certificate Manager, Self-Hosted 26.1: CAPI, EST and supported drivers.  ·  Microsoft Learn: NPS extension for Entra MFA (self-signed certificate).",
    "CISA BOD 26-02.  ·  NIST SP 800-53 Rev. 5 (IA-3, IA-3(1), AC-3, AC-18(1), AC-19, AC-20, SC-7(3), SC-7(5), CM-6, CM-7, CM-8).",
    "Full footnotes with links and access dates: Book 09, Chapter 07; Book 02, Chapter 04; Book 07, Chapters 05–07.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}
{
  const s = content("Backup", "Sources behind Module 4 — Architecture and ownership");
  const src = [
    "Microsoft Learn: PostgreSQL flexible server business continuity, reliability and read replicas; managed identity; Entra authentication.  ·  AWS RDS IAM authentication.",
    "etcd, Learner design note.  ·  Shapiro et al., Conflict-free Replicated Data Types (SSS 2011).  ·  Microsoft Learn: validating claims.",
    "CISA SASE guide v1.0 (legacy architecture; notional architecture; telemetry).  ·  CISA TIC 3.0 Branch Office Use Case 3.0 (Sec. 6.1–6.3).  ·  Microsoft 365 connectivity principles.",
    "NIST SP 800-53 Rev. 5 (SC-7(4), CP-8).  ·  NIST SP 800-37 Rev. 2 (authorizing official; significant change).  ·  FAR 48 CFR 1.602-1.",
    "GSA, Enterprise Infrastructure Solutions.  ·  NIST, FIPS 140-3 transition.  ·  Microsoft Learn: Intune wired network prerequisites; Intune NAC integration.",
    "CISA BOD 26-02, BOD 26-04, ED 26-03.  ·  OMB M-26-14.",
    "GAO-19-58, GAO-22-106195, GAO-26-107530, GAO-26-107919 (cost and transition record behind Chapter 13's sequencing and paired-branch method).",
    "Federal Compliance volumes (repository): 802.1X network access control; network modernization; telecommunications modernization.",
    "Program positions (the matrix, gates, VLAN examples, timers, phases) are design guidance; phase inversion is the book's inference.",
    "Full footnotes with links and access dates: Book 09, Chapters 08–09 and 13; Appendices A–B.",
  ];
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
}

console.log(`slides: ${pres.slides.length}; notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
