// Book 11 — Zero Trust & Assessment: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — The target and the tools:          Module 1 (Ch01 + Ch02 + Ch03, a whole-agency property, governance, the mandates),
//                                                Module 2 (Ch04 + Ch05 + Ch06, SCuBA and BOD 25-01, the two tools, beyond Microsoft 365).
//   Part 2 — Owning and running the assessment: Module 3 (Ch07 + Ch08, who owns Zero Trust, close before you assess),
//                                                Module 4 (Ch09 + Ch10 + Appendix A, the run, evidence not verdicts, the requirements map).
// Build:  node presentations/b11-zero-trust-technical/build.js presentations/b11-zero-trust-technical/B11_Zero_Trust_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b11-zero-trust/; the notes name the chapter.
// Program recommendations are labeled "design guidance" and readings between sources "inference", as the book does.
// The commands stay in Chapter 09, which marks them illustrative; the slides show tables, flows and decisions.
// Diagrams are the committed PNG renders; their alt text is read from the chapters' fig-alt attributes at build time.
// Narration: narration.json (spoken text, keyed by slide title) is read by presentations/_build/narrate.py (editor runs that).
const fs = require("fs");
const path = require("path");
const D = require("../_build/lib.js")({ book: "Book 11", title: "Zero Trust & Assessment — Technical Deep Dive" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head } = D;
const OUT = process.argv[2] || "B11_Zero_Trust_Technical.pptx";

// The kit's full-width callout, with a fit check (16.5 pt text in a 10.65-inch frame).
const callout = (s, name, y, h, iconName, color, label, text) => {
  const need = Math.ceil(((label.length + text.length) * 0.5 * 16.5 / 72) / 10.45) * 16.5 / 72 * 1.2 + 0.1;
  if (need > h) console.warn(`  ! ${name} callout may overflow: needs ${need.toFixed(2)}, has ${h.toFixed(2)}`);
  if (y + h > LIMIT + 0.01) console.warn(`  ! ${name} callout runs into the Sources line: bottom ${(y + h).toFixed(2)}`);
  return D.callout(s, name, y, h, iconName, color, label, text);
};

// ------------------------------------------------------------------ helpers
// Speaker notes with an automatic timing cue (live delivery runs ~142 words a minute).
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

// Titles: at most 58 characters and unique across the deck (narrate.py keys narration on them).
const titles = new Set();
const checkTitle = (t) => {
  if (t.length > 58) throw new Error(`title over 58 characters (${t.length}): ${t}`);
  if (titles.has(t)) throw new Error(`duplicate slide title: ${t}`);
  titles.add(t);
};
const content = (sec, t) => { checkTitle(t); return D.content(sec, t); };
const titleSlide = (sec, t, sub) => { checkTitle(t); return D.titleSlide(sec, t, sub); };

// Rough fit check so tables and lists don't overflow (Calibri averages ~0.5 em per character).
const lines = (text, w, pt) => Math.max(1, Math.ceil((String(text).length * 0.5 * pt / 72) / Math.max(0.3, w - 0.2)));
const LIMIT = 6.6; // top of the Sources line
const warn = (what, bottom) => { if (bottom > LIMIT + 0.01) console.warn(`  ! ${what} may overflow: bottom ${bottom.toFixed(2)} in`); };

const sources = (s, text) => {
  if (text.length > 185) console.warn(`  ! slide ${pres.slides.length} Sources line is long (${text.length} chars)`);
  return D.sources(s, text);
};

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
    if (o.center && k > 0) Object.assign(base.options, { align: "center" });
    return base;
  }));
  const x = o.x != null ? o.x : 0.6;
  s.addTable([head(headers), ...body], tableOpts(colW, { x, y, fontSize: pt, rowH, objectName: name }));
  const bottom = y + rowH.reduce((a, b) => a + b, 0);
  warn(`${name} table`, bottom);
  if (o.limit && bottom > o.limit + 0.01) console.warn(`  ! ${name} table runs into the shape below: bottom ${bottom.toFixed(2)}, limit ${o.limit.toFixed(2)}`);
  if (process.env.FIT) console.log(`  table ${name}: bottom ${bottom.toFixed(2)} in`);
  return bottom;
};

// A tinted panel with a small caps label, a heading and bullets.
const panel = (s, name, x, y, w, h, color, tint, label, heading, items, pt = 13.5) => {
  box(s, name, x, y, w, h, tint || "FFFFFF", color);
  const runs = [];
  if (label) runs.push({ text: label, options: { bold: true, color: HEX.slate, fontSize: 11, breakLine: true } });
  if (heading) runs.push({ text: heading, options: { bold: true, color, fontSize: 16, fontFace: "Cambria", breakLine: true } });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08;
  txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: top - y - 0.14 });
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (need > y + h + 0.02) console.warn(`  ! ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  if (need < y + h - 0.6) console.warn(`  ! ${name} panel has spare room: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
  if (y + h > LIMIT + 0.01) console.warn(`  ! ${name} panel runs into the Sources line: bottom ${(y + h).toFixed(2)}`);
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
    const need = y + 0.1 + (pt + 2.5) / 72 * 1.2 * lines(st.head, w - 0.24, pt + 2.5) + lines(st.body, w - 0.24, pt) * pt / 72 * 1.2;
    if (need > y + h) console.warn(`  ! ${name} step ${i + 1} may overflow: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
    if (i < n - 1) s.addShape(pres.shapes.RIGHT_ARROW, { objectName: `${name} arrow ${i + 1}`, x: x + w + 0.03, y: y + h / 2 - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.slate }, line: { color: HEX.slate } });
  });
};

const subhead = (s, name, text, x, y, w) => txt(s, name, text, { x, y, w, h: 0.3, fontSize: 12, bold: true, color: HEX.slate });

// Alt text for each committed diagram, taken from the fig-alt attribute in the chapter that shows it.
const BOOK = path.join(__dirname, "..", "..", "docs", "books", "b11-zero-trust");
const ALT = {};
for (const f of fs.readdirSync(BOOK).filter((n) => /^\d\d-.*\.md$/.test(n))) {
  const t = fs.readFileSync(path.join(BOOK, f), "utf8");
  for (const m of t.matchAll(/svg\/([\w-]+)\.svg\)\{[^}]*?fig-alt="([^"]+)"/g)) ALT[m[1]] = m[2];
}

// A committed diagram placed inside a box, keeping the PNG's aspect ratio (read from its header).
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b11-zero-trust", "png");
const img = (s, name, x, y, maxW, maxH) => {
  const alt = ALT[name];
  if (!alt) throw new Error(`no fig-alt found in the chapters for ${name}`);
  const file = path.join(DIAG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  if (y + h > LIMIT + 0.01) console.warn(`  ! ${name} image runs into the Sources line: bottom ${(y + h).toFixed(2)}`);
  if (process.env.FIT) console.log(`  image ${name}: ${w.toFixed(2)} x ${h.toFixed(2)}, bottom ${(y + h).toFixed(2)}`);
  return { w, h, bottom: y + h };
};

// Module divider: a Title-master slide with the module's contents and running time.
const divider = (sec, title, sub, items, mins) => {
  const s = titleSlide(sec, title, sub);
  txt(s, "Module contents", [
    { text: `IN THIS MODULE  ·  ABOUT ${mins} MINUTES`, options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...items.map((t, k) => ({ text: t, options: { bullet: true, fontSize: 15, color: HEX.ink, breakLine: k < items.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 7.2, h: 1.6, paraSpaceAfter: 3 });
  return s;
};

const P1 = "Part 1 — The target and the tools";
const P2 = "Part 2 — Owning and running the assessment";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "Zero Trust & Assessment: the technical deep dive", "Book 11 — Zero Trust & Assessment: mandates, tools, owners and evidence");
  txt(s, "Session map", [
    { text: "Part 1 — The target and the tools", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  A whole-agency property   ·   Module 2  SCuBA, the two tools, beyond Microsoft 365", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Owning and running the assessment", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Who owns it; close before you assess   ·   Module 4  The run, evidence, the map", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 11 of the Federal Modernization Workbook, Zero Trust and Assessment. It's for the security engineers and assessors who run the assessment: the people who run ScubaGear and Microsoft's Zero Trust Assessment, read what they produce, and turn it into evidence an authorizing official can rely on.

It runs in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is the target and the tools: what the federal documents actually require and what the maturity model's governance capability asks for, then SCuBA and BOD 25-01, the two assessment tools, and the estates beyond Microsoft 365. Part 2 is owning and running the assessment: who decides what, and why the known findings are closed before the maturity assessment runs, then the run itself, the evidence chain, how results are read, scored and reconciled, and the requirements map.

The commands live in Chapter 09, marked illustrative and untested against production; I'll point to them rather than put code on screen. Where something is the program's own recommendation rather than a federal or vendor requirement, the slide says design guidance, and where it's a reading between sources, it says inference.`,
  "Book 11, index; Chapters 01–10 and Appendix A.");
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: the worst failures sat beneath any tool");
  tag(s, "Why");
  panel(s, "Token", 0.6, 1.5, 5.95, 2.3, HEX.red, HEX.redTint, "A FORGED TOKEN, MAY AND JUNE 2023", null, [
    "Tokens forged with an acquired Microsoft consumer signing key read Exchange Online mail",
    "22 enterprise organizations and 503 personal accounts; access for at least six weeks",
    "Caught by a department's own alert on mailbox-access logs it paid for",
  ], 12.5);
  panel(s, "Guest", 0.6, 3.95, 5.95, 2.5, HEX.amber, HEX.amberTint, "BENEATH THE GUEST, 2023 AND 2024", null, [
    "ESXiArgs: over 3,800 ESXi servers; VM configuration files encrypted",
    "CVE-2024-37085: \"ESX Admins\" matched by name, so creating the group took the host",
    "Microsoft: many security products have limited visibility into ESXi",
  ], 12.5);
  img(s, "ch06-beneath-the-guest", 6.8, 1.5, 5.95, 3.1);
  txt(s, "Point", [
    { text: "Same point, opposite ends: ", options: { bold: true, color: HEX.red } },
    { text: "the tokens were valid to every system that checked them, and the host sits below every guest's EDR, identity and network controls. Each failure happened where no single platform's tool was looking." },
  ], { x: 6.8, y: 4.75, w: 5.95, h: 1.7, fontSize: 14, valign: "middle" });
  sources(s, "Sources: Cyber Safety Review Board (Mar. 2024); CISA and FBI AA23-039A; Microsoft Threat Intelligence (July 2024); VMware vSphere Authentication. Book 11, Ch 01, 06.");
  notes(s,
`Why this matters. Two documented incidents show why the whole-agency view is a security property and not a reporting preference.

In May and June 2023, an actor Microsoft tracks as Storm-0558 used a Microsoft consumer signing key it had acquired to forge authentication tokens and read Exchange Online mail. The Cyber Safety Review Board counted 22 enterprise organizations and 503 related personal accounts, with access to some mailboxes for at least six weeks, and called the intrusion preventable. The tokens were valid to every system that checked them. What caught it was a federal department's own custom alert on mailbox-access logs it had paid for; few, if any, other victims had that logging. The agency's evidence found what the provider's platform didn't.

The second sits beneath the guest. In February 2023, CISA and the FBI reported that ESXiArgs had compromised more than 3,800 ESXi servers by encrypting virtual machine configuration files. In July 2024, Microsoft reported ransomware operators exploiting CVE-2024-37085: domain-joined ESXi hosts gave full administration to any member of a group named ESX Admins, matched by name rather than by security identifier, so a domain user who could create that group took over the host. Microsoft noted that many security products have limited visibility into an ESXi hypervisor, and encrypting one hypervisor's file system reaches every virtual machine it hosts.

Guest EDR, identity signals and host firewalls observe the guest; an attacker on the host acts beneath all of them. Both cases make the same point from opposite ends.`,
  "Book 11, Chapter 01 — Zero Trust Is a Whole-Agency Property, \"Two incidents that sat beneath any single tool\"; Chapter 06, \"The hypervisor is a distinct threat class.\"");
}
endModule("Orientation");

// ================================================================== 3 Module 1 divider
{
  const s = divider(P1, "Module 1: A whole-agency property and its mandates", "Part 1 — The target and the tools  ·  Chapters 01–03",
    ["What the guidance describes, and why stapled reports aren't a score", "The maturity model's structure and five governance principles", "Four documents, four kinds of authority; M-22-09 by pillar"], 11);
  notes(s,
`Module 1: a whole-agency property, and what the mandates require. We start with what CISA's maturity model, OMB M-22-09 and NIST SP 800-207 actually say about scope, and why three separately run assessments are three partial results. Then the maturity model's structure, and the five governance principles that move a program past the Initial stage. And we finish with the documents themselves: which one sets requirements, which ones are guidance, and the requirements people cite that don't exist. An assessor who can't tell a guide from a mandate can't scope an assessment.`,
  "Book 11, Chapter 01 — Zero Trust Is a Whole-Agency Property; Chapter 02 — Governance Principles for Zero Trust; Chapter 03 — What CISA's Maturity Model and M-22-09 Actually Require.");
}

// ================================================================== 4 Guidance and stapled reports
{
  const s = content(P1, "The guidance describes the enterprise, not a tenant");
  tag(s, "What");
  const g = table(s, "Guidance", 1.5, [1.45, 4.5], ["Document", "What it says about scope"], [
    ["CISA ZTMM v2.0", "Siloed services and staff become one strategy; Advanced builds toward \"enterprise-wide awareness (including externally hosted resources)\""],
    ["OMB M-22-09", "Enterprise-managed identities; as few agency identity systems as practicable; a complete device inventory, \"a necessary foundation\""],
    ["NIST SP 800-207", "No implicit trust from location or ownership; extend to \"virtual and cloud components\""],
  ], { fontSize: 13, limit: 4.6 });
  panel(s, "Caution", 0.6, g + 0.2, 5.95, 6.45 - g - 0.2, HEX.navy, HEX.navyTint, "ONE CAUTION FOR ASSESSORS", null, [
    "The model aligns to one administrative domain or accreditation boundary",
    "Assess provider reliance separately: a provider is a dependency, not the owner",
    "None of the three documents is scoped to a product or a tenant",
  ], 13.5);
  img(s, "ch01-three-reports-one-plane", 6.8, 1.5, 5.95, 2.7);
  panel(s, "Stapled", 6.8, 4.4, 5.95, 2.05, HEX.red, HEX.redTint, "WHEN THREE INVENTORIES DISAGREE", null, [
    "One workload is counted three times, or not at all",
    "No policy decision is made the same way twice",
    "Findings without shared identifiers can't be added up",
    "A scan can confirm unification; it can't create it",
  ], 13);
  sources(s, "Sources: CISA Zero Trust Maturity Model v2.0 (Apr. 2023); OMB M-22-09 (Jan. 2022); NIST SP 800-207 (Aug. 2020). Book 11, Ch 01.");
  notes(s,
`Three documents set the target, and none is scoped to a product. CISA's Zero Trust Maturity Model, version 2.0, asks agencies to move stove-piped, siloed services and staff into one strategy with agency-wide buy-in for a common architecture and governance. Its Advanced stage builds toward enterprise-wide awareness, including externally hosted resources. OMB M-22-09 asks for enterprise-managed identities, consolidation onto as few agency-managed identity systems as practicable, and a complete device inventory, which it calls a necessary foundation for any enterprise-wide zero trust architecture. NIST SP 800-207 grants no implicit trust from location or ownership, and says the approach should extend to virtual and cloud components.

One caution from the model matters to assessors. It's generally aligned to one administrative domain or accreditation boundary, and CISA tells agencies to assess separately how their reliance on service providers factors in. A cloud provider is inside the architecture as a dependency, not as its owner.

Now the usual calendar. The network list is keyed by address, the cloud estate by each provider's tags, the hypervisor estate by whatever its management plane calls a machine. When those disagree, one workload is counted three times or not at all. No policy decision is made the same way twice, because a policy engine needs one answer to what this device is and who owns it. And findings across domains that don't share identifiers are a sum of unlike things. A scan can confirm that an architecture is unified; it can't make it unified.`,
  "Book 11, Chapter 01 — Zero Trust Is a Whole-Agency Property, \"What the federal guidance actually describes,\" \"Three partial assessments are not one score.\"");
}

// ================================================================== 5 ZTMM structure and the stall
{
  const s = content(P1, "Five pillars, three capabilities: why programs stall");
  tag(s, "What");
  img(s, "ch02-pillars-and-capabilities", 0.6, 1.5, 6.1, 2.65);
  panel(s, "Patterns", 0.6, 4.35, 6.1, 2.1, HEX.red, HEX.redTint, "THREE FAILURE PATTERNS", null, [
    "Pillars are administered, not governed: no one correlates across them",
    "Evidence is per tool, not per claim, and can't be re-run",
    "Drift is found at audit time, months after it opened",
  ], 14);
  table(s, "Stages", 1.5, [1.35, 4.35], ["Stage", "CISA's stage text (ZTMM v2.0)"], [
    ["Traditional", "\"siloed pillars of policy enforcement\"; \"manual response and mitigation deployment\"; \"limited correlation of dependencies, logs, and telemetry\""],
    ["Advanced", "\"cross-pillar coordination\"; \"centralized visibility and identity control\"; \"policy enforcement integrated across pillars\""],
    ["Optimal", "\"cross-pillar interoperability with continuous monitoring\""],
  ], { x: 7.05, fontSize: 13, limit: 4.5 });
  txt(s, "Governance", [
    { text: "Governance, in CISA's words: ", options: { bold: true, color: HEX.amber } },
    { text: "\"the definition and associated enforcement of agency cybersecurity policies, procedures, and processes, within and across pillars.\"" },
  ], { x: 7.05, y: 4.35, w: 5.7, h: 2.1, fontSize: 15, valign: "middle" });
  sources(s, "Sources: CISA Zero Trust Maturity Model v2.0 (Apr. 2023), §5 and Table 7. Book 11, Ch 02.");
  notes(s,
`The model is not a shopping list. Its best-known figure shows five pillars, and a program that reads only that figure plans five procurements. Underneath sit three cross-cutting capabilities: Visibility and Analytics, Automation and Orchestration, and Governance. Governance, in CISA's words, is the definition and associated enforcement of policy, within and across pillars.

Three failure patterns recur. Pillars are administered, not governed: each has an owner, a tool and a roadmap, but nothing correlates decisions across them, so a cross-pillar decision degrades to the lowest common denominator. Evidence is per tool, not per claim: assembling it into one authorization narrative is a manual, point-in-time exercise that can't be re-run. And drift is found at audit time, months after it opened.

Put those next to the model's stage text and the stall is predictable. Traditional reads like the failure list: siloed pillars of policy enforcement, manual response, limited correlation of logs and telemetry. Advanced asks for cross-pillar coordination, centralized visibility and identity control, and enforcement integrated across pillars; Optimal for cross-pillar interoperability with continuous monitoring. Adding another per-pillar tool moves none of those, which is why programs that spend two years or more buying a tool per pillar stall at Initial or low Advanced. For an assessor the implication is direct: a stage describes how the enterprise behaves. A product can be configured to Advanced settings; only the agency reaches Advanced.`,
  "Book 11, Chapter 02 — Governance Principles for Zero Trust, \"The model is not a shopping list,\" \"Why programs stall below Advanced.\"");
}

// ================================================================== 6 Principles one and two
{
  const s = content(P1, "Principles one and two: defend identity and privilege");
  tag(s, "How");
  panel(s, "Identity", 0.6, 1.5, 5.95, 3.55, HEX.navy, HEX.navyTint, "PRINCIPLE ONE", "Identity: a necessary anchor, not sufficient", [
    "Root namespace (design guidance): devices, addresses, workloads and data named through it",
    "Continuous access evaluation: critical events revoke in near real time",
    "CAE sessions get tokens up to 28 hours; other clients keep one hour",
    "Phishing-resistant MFA; the plane's own log stream",
    "Federal guidance agrees: enhanced identity governance, centralized identity",
  ], 13);
  panel(s, "Privilege", 6.8, 1.5, 5.95, 3.55, HEX.teal, HEX.tealTint, "PRINCIPLE TWO", "Privilege: controls of its own", [
    "ZTMM Traditional: \"permanent access with periodic review\"; Optimal: just-in-time",
    "PIM: zero permanently active assignments but emergency accounts",
    "Emergency accounts: two or more, alerting, drilled every 90 days",
    "Activation needs MFA, a justification or an approval, for a set period",
    "Never grant administration to a recreatable group name",
  ], 13);
  callout(s, "Anchor", 5.25, 1.2, "FaFingerprint", HEX.red, "A naming claim, not a trust claim: ",
    "the 2023 forged tokens passed every check, so the identity plane is the highest-value target in the estate.");
  sources(s, "Sources: CISA ZTMM v2.0; NIST SP 800-207; OMB M-22-09; Microsoft Learn — continuous access evaluation, PIM, emergency access accounts; CSRB (2024). Book 11, Ch 02.");
  notes(s,
`Five principles address the patterns. The first two govern identity and privilege.

Principle one: identity is a necessary anchor, not a sufficient one. As design guidance, the program makes identity the root namespace: devices, addresses, workloads and data are named through the identity plane, so a device claim is keyed to an Entra object ID rather than a separate device identifier, and cross-pillar correlation reduces to resolving identity. But root namespace is a naming claim, not a trust claim. In 2023, tokens forged with a stolen provider key checked out everywhere. So the plane needs hardening of its own. Continuous access evaluation lets Exchange Online, SharePoint and Teams act on critical events in near real time. Note that CAE and short token lifetimes are alternatives, not a pair: sessions that negotiate CAE get long-lived tokens, up to 28 hours, while other clients keep the one-hour default. The requirement is prompt revocation by whichever mechanism the client supports. Add phishing-resistant MFA, which M-22-09 requires and the model places at Advanced with FIDO2 or PIV as examples, and give the plane's configuration its own high-priority log stream.

Principle two: privileged identity needs controls of its own. The model's Access Management function runs from permanent access with periodic review at Traditional to automated just-in-time, just-enough access at Optimal. In Entra that's Privileged Identity Management, with Microsoft's guidance of zero permanently active assignments except emergency accounts. Those are governed artifacts: two or more, monitored, alerting on use, drilled at least every 90 days and after staff changes. And administrative trust never hangs on a recreatable name: that's the ESX Admins lesson.`,
  "Book 11, Chapter 02 — Governance Principles, \"Principle one: identity is a necessary anchor, not a sufficient one,\" \"Principle two: privileged and administrative identity needs controls of its own.\"");
}

// ================================================================== 7 Principles three to five
{
  const s = content(P1, "Principles three to five: evidence, enforcement, boundary");
  tag(s, "How");
  const W = 3.88, G = 0.255;
  panel(s, "Evidence", 0.6, 1.5, W, 3.25, HEX.navy, HEX.navyTint, "PRINCIPLE THREE", "Evidence, not a feature", [
    "Reproducible: an assessor re-runs it without the operator",
    "Machine-readable: OSCAL in XML, JSON or YAML",
    "Regenerable from the record of what was closed",
    "If it can't be re-executed, it's an assertion",
  ], 13.5);
  panel(s, "Enforce", 0.6 + W + G, 1.5, W, 3.25, HEX.teal, HEX.tealTint, "PRINCIPLE FOUR", "Enforce, not only observe", [
    "Optimal: \"continuous enforcement and dynamic updates\"",
    "Gated (design guidance): a human approves the corrective action",
    "High-blast-radius changes stay gated permanently",
    "Convert one: block, reapply or expire instead of report",
  ], 13.5);
  panel(s, "Boundary", 0.6 + 2 * (W + G), 1.5, W, 3.25, HEX.amber, HEX.amberTint, "PRINCIPLE FIVE", "Model the cloud boundary", [
    "Government clouds lack some commercial features",
    "GCC uses the commercial Intune service",
    "Each gap: a governed finding with a disposition",
    "BOD 25-01 stops at tenants with a baseline",
  ], 13.5);
  callout(s, "Test", 4.95, 1.5, "FaScaleBalanced", HEX.amber, "The enforcement test: ",
    "when running state violates the policy, does anything happen besides a finding in next quarter's report? If not, it's observed, not enforced.");
  sources(s, "Sources: CISA ZTMM v2.0; NIST OSCAL; Microsoft Learn — Office features in government clouds, Intune for US Government; CISA BOD 25-01. Book 11, Ch 02.");
  notes(s,
`Principles three to five concern how governance works and where it stops.

Principle three: continuous evidence is a governance property, not a tool feature. Evidence has to be reproducible, so an assessor can re-run the pipeline without coordinating with the operator and get the same result; machine-readable, with NIST's OSCAL as the federal reference in XML, JSON and YAML; and regenerable from the record of what was closed. Per-tool evidence that can't be re-executed is an assertion.

Principle four: governance must enforce, not only observe. The model's Governance capability runs from manual or static enforcement at Traditional to full automation with continuous enforcement and dynamic updates at Optimal. Enforcement isn't autonomy: in the program's design, the governance layer generates the corrective action and a human approves it, with high-blast-radius operations gated permanently. A gated preventive control is still a control. Convert one policy this quarter: a Conditional Access policy that blocks rather than reports, a baseline that's reapplied rather than compared, an assignment that expires rather than waits for review.

Principle five: model the cloud boundary. Government clouds aren't the commercial service. Microsoft lists Office features unavailable in GCC, GCC High and DoD, and Intune features planned or unavailable for GCC High and DoD; GCC tenants use the commercial Intune service. A score read from a government tenant without knowing what it can use credits or penalizes the agency for platform decisions, so each gap is a governed finding with a compensating control or an accepted risk. Each mandate's edge is recorded too: BOD 25-01 stops at tenants with a SCuBA baseline.`,
  "Book 11, Chapter 02 — Governance Principles, \"Principle three,\" \"Principle four,\" \"Principle five: the cloud boundary must be modeled, not assumed away.\"");
}

// ================================================================== 8 Four documents
{
  const s = content(P1, "Four documents, four kinds of authority, no score");
  tag(s, "What");
  img(s, "ch03-instrument-authority", 0.6, 1.5, 6.3, 4.95);
  table(s, "Myths", 1.5, [2.5, 3.1], ["Often cited", "What the record shows"], [
    ["A required maturity stage", "None; the model is \"a general guide\"; FedRAMP certifies services"],
    ["Certificate-based auth at Advanced", "FIDO2 or PIV are named as examples"],
    ["\"M-22-09 §4\"", "Sections I–III; pillar actions at §III.A–E"],
    ["A federal Zero Trust score", "No federal document defines one"],
    ["M-22-09 requires ScubaGear", "That requirement is BOD 25-01's"],
    ["Inline decryption is required", "\"neither require nor prohibit\""],
    ["M-21-31 logging tiers apply", "Rescinded by M-26-14, May 22, 2026"],
  ], { x: 7.15, fontSize: 12.5, minRow: 0.55, limit: 6.45 });
  sources(s, "Sources: EO 14028 (May 2021); OMB M-22-09; CISA ZTMM v2.0; NIST SP 800-207; OMB M-26-14 (May 2026); CISA BOD 25-01; FedRAMP Rules for 2026. Book 11, Ch 03.");
  notes(s,
`Zero Trust programs are usually argued by citation, and most citations fail when you check them. Four documents set the target, with different authority.

Executive Order 14028, May 2021, is binding. It directed the government to advance toward zero trust and required each agency head, within 60 days, to develop a plan. OMB M-22-09, January 2022, is binding: specific actions by pillar with FY 2024 deadlines. CISA's maturity model is guidance and says so: it should not be viewed as a strict set of requirements but as a general guide. NIST SP 800-207 is guidance too: the definitions, seven tenets and logical components the others rely on. The two middle documents were written to fit each other, but one way: M-22-09 borrows the model's structure, not its stages.

Below them, adjacent instruments bind particular surfaces: BOD 25-01 for cloud tenant configuration, M-26-14 for logging, whose reference architecture will align with the maturity model, and each system security plan's SP 800-53 assertions.

On the right are requirements people cite that don't exist. Nothing requires a maturity stage, and FedRAMP certifies services, leaving agencies to authorize their own systems. The Identity pillar names FIDO2 or PIV as examples, not certificate-based authentication. There is no M-22-09 section four; the pillar actions are section three, A through E. No federal document defines a Zero Trust score. The ScubaGear requirement is BOD 25-01's, not M-22-09's. Inline decryption is neither required nor prohibited. And M-21-31's event-logging tiers went with its rescission on May 22, 2026.`,
  "Book 11, Chapter 03 — What CISA's Maturity Model and M-22-09 Actually Require, \"Four documents, four kinds of authority,\" \"Requirements that are cited but don't exist.\"");
}

// ================================================================== 9 M-22-09 actions
{
  const s = content(P1, "What M-22-09 requires, pillar by pillar, in October 2026");
  tag(s, "What");
  table(s, "Actions", 1.5, [2.3, 9.85], ["Pillar (M-22-09 §III)", "Required actions, summarized (\"must\" is the memorandum's word)"], [
    ["Program", "A strategy implementation lead within 30 days; an FY 2022–2024 plan and budget estimate within 60; the C-suite aligned"],
    ["Identity", "Centralized identity management; MFA at the application layer; phishing-resistant MFA for staff, contractors and partners; no special-character or rotation rules; at least one device-level signal"],
    ["Devices", "Reliable asset inventories through CDM; EDR that meets CISA's requirements, deployed widely"],
    ["Networks", "Encrypted DNS where supported; HTTPS for all web and API traffic; .gov preloading; an isolation plan with CISA"],
    ["Applications", "Application security testing; independent evaluation; a public disclosure program; one internal FISMA Moderate app over the internet"],
    ["Data", "Initial automated categorization; audit access to data encrypted at rest in commercial cloud; logging \"as described in\" M-21-31"],
  ], { fontSize: 13, limit: 5.3 });
  callout(s, "Reading", 5.35, 1.1, "FaBook", HEX.navy, "In force, deadlines passed: ",
    "OMB's 2025–2026 index lists no rescission, so the actions are an existing obligation; read the logging action through M-26-14.");
  sources(s, "Sources: OMB M-22-09 (Jan. 26, 2022), §III.A–E; OMB memoranda index; OMB M-26-14 (May 22, 2026). Book 11, Ch 03, App A.");
  notes(s,
`M-22-09 is the only one of the four that sets dated actions for the program itself, and it addresses on-premises and hybrid systems, not just the cloud.

Program actions came first: a strategy implementation lead within 30 days, and within 60 an implementation plan for FY 2022 to 2024 with a budget estimate. The table restates the pillar actions. A few are narrower than they're usually quoted. Phishing resistance has a definition, authentication designed to detect and prevent disclosure of secrets to a site masquerading as a legitimate system, and a consequence: for routine self-service access by staff, contractors and partners, agency systems stop supporting SMS or voice codes, one-time codes and push notifications. PIV, including Derived PIV, is the simplest route; FIDO2 and WebAuthn are permitted. The network action is an isolation plan, not a product: the memo lists SP 800-207's three approaches and asks agencies to move away from a broad enterprise-wide network. The device signal is a floor, at least one, not a description of a mature policy engine.

Reading it in October 2026: the deadlines have passed, but OMB's memoranda index for 2025 and 2026 lists no rescission so the program treats it as in force with two adjustments. The Data pillar's logging action points to M-21-31, which M-26-14 rescinded on May 22, 2026, so it's read through M-26-14. And a passed deadline doesn't retire an action; agencies are now measured against it as an existing obligation. Appendix A, in Module 4, maps every action to the book that closes it.`,
  "Book 11, Chapter 03 — What the Mandates Require, \"What M-22-09 requires,\" \"Reading M-22-09 in October 2026\"; Appendix A, \"OMB M-22-09 objectives and actions.\"");
}
endModule("Module 1");

// ================================================================== 10 Module 2 divider
{
  const s = divider(P1, "Module 2: SCuBA, the two tools and beyond Microsoft 365", "Part 1 — The target and the tools  ·  Chapters 04–06",
    ["BOD 25-01's six actions, the mandatory list and reporting", "ScubaGear and the Zero Trust Assessment: what each checks", "Networks, other clouds and hypervisors: reconcile first"], 13);
  notes(s,
`Module 2: SCuBA, the two tools, and beyond Microsoft 365. BOD 25-01 is narrower and more concrete than the maturity model: it names configuration settings, tells agencies to implement them, and tells them how to prove it. We'll take its six actions, the mandatory list and the reporting routes. Then the two tools agencies use, which answer different questions and need more privilege than read-only suggests. And then the estates neither tool reaches, networks, other clouds and the hypervisor, where the reconciliation has to happen before any score means anything.`,
  "Book 11, Chapter 04 — SCuBA and BOD 25-01; Chapter 05 — ScubaGear and Microsoft's Zero Trust Assessment; Chapter 06 — Beyond Microsoft 365.");
}

// ================================================================== 11 BOD 25-01 actions
{
  const s = content(P1, "BOD 25-01: six required actions and a tight scope");
  tag(s, "What");
  const b = table(s, "BOD", 1.5, [0.45, 4.6, 2.05], ["#", "Required action", "Deadline"], [
    ["1", "Identify every in-scope tenant and its owner", "Feb. 21, 2025; each Q1"],
    ["2", "Deploy all SCuBA tools; report continuously or quarterly", "Apr. 25, 2025"],
    ["3", "Implement mandatory policies in effect at issuance", "June 20, 2025"],
    ["4", "Implement later updates to the mandatory policies", "CISA's timelines"],
    ["5", "Baseline a new tenant and monitor it", "Before its ATO"],
    ["6", "Identify and explain deviations in tool output", "With each report"],
  ], { fontSize: 12, limit: 4.25 });
  panel(s, "Scope", 0.6, b + 0.2, 7.1, 6.45 - b - 0.2, HEX.navy, HEX.navyTint, "IN SCOPE (CISA GUIDANCE, JULY 27, 2026)", null, [
    "Production tenants for official business, inside the authorization boundary",
    "Software as a service only: Azure subscriptions are out, even sharing the Entra tenant",
    "AO risk acceptance for deviations; stale baselines fall out after one year",
  ], 12.5);
  img(s, "ch04-bod-25-01-obligations", 7.95, 1.5, 4.8, 3.4);
  txt(s, "Measure", [
    { text: "Measure the substantive work: ", options: { bold: true, color: HEX.amber } },
    { text: "how many mandatory policies hold, and whether every open deviation is remediated on a date or accepted by the AO." },
  ], { x: 7.95, y: 5.05, w: 4.8, h: 1.4, fontSize: 14, valign: "middle" });
  sources(s, "Sources: CISA BOD 25-01 (Dec. 17, 2024); CISA BOD 25-01 implementation guidance (updated July 27, 2026). Book 11, Ch 04.");
  notes(s,
`CISA issued BOD 25-01 on December 17, 2024. It binds civilian executive branch agencies, for every production or operational cloud tenant in a federal information system with a finalized SCuBA baseline. At issuance that meant Microsoft 365 only; baselines finalized later come into scope when issued.

Six required actions. Inventory every in-scope tenant by February 21, 2025, and update it every first quarter. Deploy all SCuBA assessment tools and begin continuous reporting by April 25, 2025, through CISA's continuous monitoring or quarterly in a machine-readable format. Implement the mandatory policies in effect at issuance by June 20, 2025. Implement later updates on the timelines CISA's Required Configurations page sets. Baseline any new tenant and start monitoring before its authorization to operate. And explain deviations with each report.

The figure splits them. Inventory, deployment and deviation explanations are administrative: each can be done in days, and each is satisfied by a report that faithfully lists forty open deviations every week. Actions three to five are substantive, and in practice they mean remediation. Much of it depends on things outside the tenant: legacy authentication can't be blocked until the applications that use it have moved.

Authorizing officials may accept risk for deviations under agency policy, and a baseline not updated within a year falls out of scope. CISA's implementation guidance, updated July 27, 2026, tightens scope: production tenants doing official business, inside the authorization boundary, software as a service only. Azure subscriptions are out even when they share an Entra ID tenant with Microsoft 365, and only mandatory policies are required.`,
  "Book 11, Chapter 04 — SCuBA and BOD 25-01, \"What BOD 25-01 requires,\" \"What 'in scope' means,\" \"Administrative obligations and substantive work.\"");
}

// ================================================================== 12 Mandatory list
{
  const s = content(P1, "The mandatory list is a subset of the baselines");
  tag(s, "What");
  const r = (a, b, c) => [a, b, c];
  table(s, "Mandatory", 1.5, [3.1, 1.5, 1.5], ["Product", "Mandatory", "1.8.0 baseline"], [
    r("Microsoft Entra ID", "20", "30"),
    r("Microsoft Defender", "8", "19"),
    r("Exchange Online", "10", "40"),
    r("Power Platform", "4", "9"),
    r("SharePoint Online and OneDrive", "4", "8"),
    r("Microsoft Teams", "4", "20"),
    r("Power BI", "none listed", "8"),
    r("Microsoft 365 total", "50", "134"),
  ], { fontSize: 12.5, center: true, limit: 5.0 });
  callout(s, "Page", 5.15, 1.3, "FaListCheck", HEX.navy, "The page governs: ",
    "track CISA's Required Configurations page, pin the baseline version you assess against, and treat a new repository indicator as notice.");
  panel(s, "Moves", 6.75, 1.5, 6.0, 1.75, HEX.amber, HEX.amberTint, "THE LIST MOVES", null, [
    "Revisions get a new suffix: one Entra policy in July 2025, three Teams in February 2026",
    "ScubaGear 1.8.0 (May 7, 2026); development baselines mark 22 Entra policies, not 20",
  ], 12);
  panel(s, "Workspace", 6.75, 3.4, 6.0, 1.6, HEX.teal, HEX.tealTint, "GOOGLE WORKSPACE IS IN SCOPE", null, [
    "Seven products; policies due December 1, 2026 (guidance: inventory Nov. 2)",
    "ScubaGoggles 1.0.0 shipped July 24, 2026",
  ], 12);
  sources(s, "Sources: CISA BOD 25-01 Required Configurations; ScubaGear 1.8.0 baselines; PowerShell Gallery (ScubaGear 2.0.0-rc2); ScubaGoggles releases; CISA guidance. Book 11, Ch 04.");
  notes(s,
`Confusing the baselines with the mandatory list leads to two opposite mistakes: treating every SHALL as binding, or treating the list as all of good practice.

The Required Configurations page is the authority. For Microsoft 365 it lists 50 policies. Against the numbered statements in ScubaGear 1.8.0's baselines: Entra ID 20 of 30, Defender 8 of 19, Exchange Online 10 of 40, Power Platform 4 of 9, SharePoint and OneDrive 4 of 8, Teams 4 of 20, and Power BI none of 8. The total of 134 is simply those counts added up. So, for example, MS.AAD.3.5, disabling SMS, voice and email one-time passcodes, is CISA's recommendation but not a directive obligation at the time of writing.

The list moves. Revised policies carry a new version suffix: MS.AAD.3.3 went to v2 in July 2025, and three Teams policies in February 2026. ScubaGear 1.8.0 shipped May 7, 2026; 2.0.0 is in preview, release candidate 2 on October 8, and the development-branch baselines run ahead: 22 Entra policies marked with a BOD 25-01 indicator against 20 on CISA's page. Until the page changes, the page governs. Track it, pin the baseline you assess against, and treat a new indicator as notice, not obligation.

Google Workspace is in scope too: Common Controls, Gmail, Calendar, Chat, Drive and Docs, Groups for Business and Meet. The Required Configurations page sets December 1, 2026; the implementation guidance sets inventory by November 2, tool deployment by December 1 and policies by December 31. The pages disagree, so plan to December 1. ScubaGoggles reached 1.0.0 on July 24, 2026.`,
  "Book 11, Chapter 04 — SCuBA and BOD 25-01, \"The mandatory list is a subset of the baselines,\" \"Google Workspace is in scope.\"");
}

// ================================================================== 13 Reporting and the edge
{
  const s = content(P1, "Reporting to CISA, and what the directive doesn't cover");
  tag(s, "How");
  table(s, "Routes", 1.5, [2.35, 3.95], ["Reporting route", "How it works"], [
    ["CISA-hosted ScubaConnect", "CISA manages reporting after setup; results feed the CDM dashboard"],
    ["Self-hosted ScubaConnect", "The agency runs it and can keep local copies"],
    ["Agency-hosted: CLAW or TALON", "Automated scans at least quarterly; agency development work"],
    ["Manual", "CyberScope upload, quarterly or more often, from the latest tool version"],
  ], { fontSize: 13, minRow: 0.62, limit: 4.75 });
  panel(s, "Artifact", 7.15, 1.5, 5.6, 3.0, HEX.navy, HEX.navyTint, "THE REPORTED ARTIFACT", null, [
    "ScubaResults_ plus a UUID, in JSON: never renamed",
    "Required deviations appear as \"Omitted,\" with a rationale",
    "Omissions approved through risk management",
    "CISA's CSV tracker is, in effect, a POA&M",
    "The HTML report is for people, not for CISA",
  ], 14.5);
  callout(s, "Edge", 4.9, 1.55, "FaTriangleExclamation", HEX.red, "Not covered: ",
    "on-premises Active Directory, NTLM, domain controllers, Group Policy, endpoints, networks, and Azure infrastructure and platform services. A passing tenant can sit on a forest full of NTLM.");
  sources(s, "Sources: CISA BOD 25-01; BOD 25-01 implementation guidance (July 27, 2026); CISA ScubaConnect. Book 11, Ch 04.");
  notes(s,
`The directive allows continuous integration with CISA's monitoring or quarterly manual reporting, and the guidance describes four routes. CISA-hosted ScubaConnect, where CISA manages reporting after setup and results feed the CDM dashboard. Self-hosted ScubaConnect, where the agency runs it and can keep local copies. Agency-hosted, through CLAW or TALON, with automated scans at least quarterly and development work on the agency side. Or manual upload to CyberScope, quarterly or more often, from the most recent tool version.

Whatever the route, the reported artifact is the tool's JSON output, named ScubaResults plus a UUID, and agencies are told not to rename it. A deviation that's operationally required appears in the output as Omitted, with its rationale, and the guidance says omissions must be approved through the organization's security risk management process. CISA also supplies a CSV template for non-compliant policies, planned fixes and target dates, which is in effect a plan of action and milestones. For an assessor, that means the JSON file, the omission rationale and that tracker are the directive's evidence; the HTML report isn't.

And the edge. The directive governs cloud tenant configuration for products with a finalized baseline. It says nothing about on-premises Active Directory, NTLM, domain controllers, Group Policy, endpoints, networks, or Azure infrastructure and platform services. A tenant that passes every mandatory policy can sit on top of a forest full of NTLM dependencies and unmanaged devices. That's why the book doesn't stop here: BOD 25-01 sets a firm floor for the Microsoft 365 and Workspace tenants, and it doesn't certify Zero Trust maturity.`,
  "Book 11, Chapter 04 — SCuBA and BOD 25-01, \"How agencies report,\" \"What BOD 25-01 doesn't cover.\"");
}

// ================================================================== 14 Tools at a glance
{
  const s = content(P1, "ScubaGear and the Zero Trust Assessment at a glance");
  tag(s, "What");
  table(s, "Glance", 1.5, [2.25, 4.95, 4.95], ["", "ScubaGear (CISA)", "Zero Trust Assessment (Microsoft)"], [
    ["Question", "Does the tenant meet the federal baseline?", "How mature is the environment against Zero Trust guidance?"],
    ["Authority", "SCuBA baselines; BOD 25-01 requires deploying it", "Microsoft's Zero Trust and Secure Future Initiative guidance"],
    ["Current version", "1.8.0 (May 7, 2026); 2.0.0 in prerelease", "3.1.0 (October 20, 2026)"],
    ["How it runs", "Windows PowerShell 5; OPA evaluates Rego policies", "PowerShell 7 module; Graph, Azure, Exchange, SharePoint"],
    ["Finding ID; severity", "Policy ID; SHALL or SHOULD, mandatory or not", "Numeric test ID; risk High, Medium or Low"],
    ["Run roles", "Global Reader; Power Platform and Power BI need admin roles and licenses", "Admin consent first; then reader roles; 21 Graph read permissions"],
    ["Clouds", "-M365Environment commercial, gcc, gcchigh or dod", "Docs silent; source has USGov and USGovDoD; GCC is commercial"],
    ["Changes the tenant?", "No", "No; data stays on the local machine"],
  ], { fontSize: 12, limit: 5.35 });
  callout(s, "Privilege", 5.5, 0.95, "FaUserShield", HEX.red, "Read-only isn't low privilege: ",
    "test the exact roles in your tenant before you write the run book.");
  sources(s, "Sources: CISA ScubaGear repository and parameters; Microsoft Learn — Zero Trust Assessment overview and get started; ZeroTrustAssessment 3.1.0 source and release. Book 11, Ch 05.");
  notes(s,
`Agencies routinely run two free assessments of their Microsoft cloud and then ask whether they need both. They answer different questions. ScubaGear asks whether the Microsoft 365 tenant meets CISA's baselines, the mandatory policies among them. The Zero Trust Assessment asks how close the Microsoft environment, across identity, devices, network and data, is to Microsoft's guidance.

ScubaGear is CISA's tool. It runs in Windows PowerShell 5, queries the Microsoft 365 APIs and evaluates the settings with Open Policy Agent against Rego policies. Findings carry a policy ID such as MS.AAD.1.1v1, and severity comes from SHALL or SHOULD and whether the policy is mandatory. The Zero Trust Assessment is Microsoft's PowerShell 7 module with numeric test IDs and High, Medium or Low risk.

Read-only describes behavior, not privilege. ScubaGear needs Global Reader for most products, but Power Platform needs the Power Platform Administrator role with a Power Apps for Office 365 license, and Power BI a Fabric Administrator with a Power BI or Fabric license, plus a first-run consent to Graph read permissions. Microsoft's get-started page for the Zero Trust Assessment asks for a Global Administrator for the first connection and consent, and several reader and administrator roles afterward, while also saying later runs can use Global Reader. Test which applies before you write the run book. Microsoft's documentation doesn't discuss government clouds; the 3.1.0 source has Environment values for USGov and USGovDoD, and a GCC tenant uses the commercial endpoints. Confirm the run in your own cloud.`,
  "Book 11, Chapter 05 — ScubaGear and Microsoft's Zero Trust Assessment, \"The two tools at a glance,\" \"ScubaGear,\" \"The Zero Trust Assessment.\"");
}

// ================================================================== 15 Overlap
{
  const s = content(P1, "Where the two tools overlap, and the inverse gap");
  tag(s, "What");
  img(s, "ch05-two-tools-overlap", 0.6, 1.5, 6.6, 4.4);
  panel(s, "Caveats", 7.45, 1.5, 5.3, 4.4, HEX.red, HEX.redTint, "TWO CAVEATS BEFORE ANY PERCENTAGE", null, [
    "Shared surface isn't duplicate checks: 30 Entra policies (20 mandatory) against 135 identity tests",
    "Only a subset have a true one-to-one counterpart",
    "Inverse gap: 22 of the 50 mandatory policies sit in Exchange, Teams, SharePoint and Power Platform",
    "Release 3.1.0: 364 tests, now including Defender threat policies",
    "Drop ScubaGear and the directive's reporting stops too",
    "An earlier 47% overlap figure is illustrative and predates 3.1.0",
  ], 14.5);
  txt(s, "Keep both", [
    { text: "Keep both: ", options: { bold: true, color: HEX.teal } },
    { text: "ScubaGear for the directive, the Zero Trust Assessment for breadth; reconcile at the control." },
  ], { x: 0.6, y: 6.0, w: 12.15, h: 0.45, fontSize: 14, valign: "middle", align: "center" });
  sources(s, "Sources: SCuBA baselines (ScubaGear 1.8.0); CISA Required Configurations; ZeroTrustAssessment 3.1.0 source and release notes. Book 11, Ch 05.");
  notes(s,
`Here's the overlap. Both tools test Entra ID identity: legacy authentication, MFA, Conditional Access, privileged roles, risky users, application consent. As of 3.1.0, released October 20, 2026, the Zero Trust Assessment also tests Defender for Office 365 threat policies: Safe Links, Safe Attachments, anti-phishing and anti-spam. Only ScubaGear covers Exchange mail flow, including external forwarding, SPF, DKIM and DMARC, plus Teams meeting and external access, SharePoint and OneDrive sharing, and Power Platform and Power BI. Only the Zero Trust Assessment covers Intune, Azure networking and Global Secure Access, Purview labels and DLP, and security operations and AI-agent checks. Release 3.1.0 holds 364 tests: Identity 135, Network 70, Security Operations 57, Devices 43, then smaller Data, AI and Infrastructure groups.

Two caveats matter more than any percentage. Shared surface isn't duplicate checks. SCuBA's Entra baseline has 30 policies, 20 of them mandatory; the Zero Trust Assessment has 135 identity tests. Only a subset have a true one-to-one counterpart; the rest goes deeper than the federal baseline. And the inverse gap: 22 of the 50 mandatory Microsoft 365 policies sit in Exchange, Teams, SharePoint and Power Platform, with no Zero Trust Assessment counterpart. Drop ScubaGear because the other tool covers identity and you leave mandatory policies unassessed and stop the reporting the directive requires.

An earlier analysis of Microsoft's demo report put about 47 percent of its checks in SCuBA-covered areas. The book labels that illustrative, to be replaced before external release; it predates 3.1.0, and your split comes from running both tools against your tenant. Keep ScubaGear for the directive, add the Zero Trust Assessment for breadth, and reconcile at the control.`,
  "Book 11, Chapter 05 — ScubaGear and Microsoft's Zero Trust Assessment, \"Where they overlap, and where they don't,\" \"What this means for an agency.\"");
}

// ================================================================== 16 Beyond Microsoft 365
{
  const s = content(P1, "Beyond Microsoft 365: each tool answers for its platform");
  tag(s, "What");
  img(s, "ch06-who-answers", 0.6, 1.5, 7.55, 3.45);
  panel(s, "Words", 8.4, 1.5, 4.35, 3.45, HEX.navy, HEX.navyTint, "IN THEIR OWN WORDS", null, [
    "AWS: its NIST SP 800-53 standard supports \"a subset\" of requirements",
    "Azure Policy: \"only a partial view of your overall compliance status\"",
    "Broadcom: assumptions \"may not be valid in your environment\"",
    "FedRAMP: \"each agency still authorizes its own federal information systems\"",
  ], 14.5);
  callout(s, "Control", 5.15, 1.3, "FaRightLeft", HEX.teal, "Reconcile at the control: ",
    "SP 800-53 as tailored by the FedRAMP baselines, because each tool has its own finding identifiers and severity model.");
  sources(s, "Sources: AWS Security Hub CSPM NIST SP 800-53 Rev. 5; Microsoft Learn — Azure Policy NIST SP 800-53 Rev. 5; Broadcom VCF guidance; FedRAMP Rules for 2026. Book 11, Ch 06.");
  notes(s,
`Each provider's tool states its own limits, and the figure lines them up.

AWS says Security Hub CSPM's NIST SP 800-53 Rev. 5 standard supports a subset of requirements, through automated checks on certain services and resources, and doesn't support requirements that need manual checks. Microsoft says that in Azure Policy's regulatory compliance initiative, compliant refers only to the policy definitions and doesn't ensure full compliance with a control, and that compliance in Azure Policy is only a partial view. Broadcom's security configuration and hardening baselines for VMware Cloud Foundation and vSphere Foundation carry a disclaimer that their assumptions may not be valid in your environment.

FedRAMP draws the same line from the other side. It certifies the cloud service offering; each agency still authorizes its own federal information systems, and the authorizing official accepts risk for the agency's specific use, including the information processed, the configuration selected and the integrations enabled.

SP 800-207's multi-cloud use case says there should be no difference between enterprise-owned infrastructure and infrastructure any other provider operates, and names the cost: providers implement similar functionality in unique ways. So running every vendor's native tool produces as many reports as there are vendors, not one agency-level answer. The program reconciles them at the control level, SP 800-53 as tailored by the FedRAMP baselines, because the tools use different finding identifiers and severity models and none was built to substitute for another.`,
  "Book 11, Chapter 06 — Beyond Microsoft 365, \"What the federal documents say about scope,\" \"Each provider's tool answers for its own platform.\"");
}

// ================================================================== 17 Reconcile first
{
  const s = content(P1, "Reconcile first: inventory, naming, no implicit trust");
  tag(s, "How");
  const W = 3.88, G = 0.255;
  panel(s, "Inventory", 0.6, 1.5, W, 2.3, HEX.navy, HEX.navyTint, "ONE INVENTORY", null, [
    "CM-8: all components, no duplicates",
    "BOD 23-01: discovery every 7 days, cloud VMs included",
    "Inference: not three lists joined at audit time",
  ], 13);
  panel(s, "Naming", 0.6 + W + G, 1.5, W, 2.3, HEX.teal, HEX.tealTint, "ONE NAMING AUTHORITY", null, [
    "SC-20, 21, 22 apply to all resolution",
    "Each cloud and VMware ship their own private DNS",
    "Names authoritative before the fact (design guidance)",
  ], 13);
  panel(s, "Trust", 0.6 + 2 * (W + G), 1.5, W, 2.3, HEX.amber, HEX.amberTint, "NO IMPLICIT TRUST", null, [
    "VPN, default VNet, flat virtual segment: one mistake",
    "M-22-09: move away from the broad enterprise network",
    "SP 800-207: no implicit trust zone",
  ], 13);
  panel(s, "Hypervisor", 0.6, 3.95, 5.95, 2.5, HEX.red, HEX.redTint, "THE HYPERVISOR IS ITS OWN SURFACE", null, [
    "Assess the management plane: inventory, baseline, scans, logs to the SIEM",
    "vCenter's Entra federation covers vCenter sign-in, not ESXi hosts",
    "Bind by verified identifier; no recreatable admin groups",
    "CISA listed CVE-2024-37085 as known exploited on July 30, 2024",
  ], 13);
  panel(s, "Layer", 6.8, 3.95, 5.95, 2.5, HEX.navy, HEX.navyTint, "THE UNIFICATION LAYER BECOMES THE TARGET", null, [
    "Tier 0 administration: time-bound, approved, never standing",
    "Its own telemetry and a blast-radius design",
    "Open formats: records exportable without the tool",
    "NIST: policy components are \"the key components of the entire enterprise\"",
  ], 13);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (CM-8, SC-20–22); BOD 23-01; OMB M-22-09; NIST SP 800-207; Microsoft Threat Intelligence; NVD CVE-2024-37085; Broadcom vCenter docs. Book 11, Ch 06.");
  notes(s,
`Three things are reconciled before assessing, then two hardening jobs follow.

One inventory. CM-8 requires an inventory that accurately reflects the system, includes all components and has no duplicate accounting. M-22-09 requires reliable inventories through CDM, and BOD 23-01 makes discovery operational: every 7 days, vulnerability enumeration every 14 days across discovered assets, cloud-operated virtual machines included. As the program's inference, an inventory that can't double-count can't be three teams' lists reconciled by hand at audit time.

One naming authority. SC-20 and SC-21 require integrity and origin authentication for name resolution, and SC-22 fault tolerance with internal and external roles separated. Each cloud and VMware ships its own private DNS, but the controls apply to the organization's resolution as a whole. The program's position: names are authoritative from one source before the fact, not reconciled after it.

No implicit trust from any boundary. A site-to-site VPN, a default virtual network and a flat virtualized segment are the same mistake.

Then the hypervisor. The program assesses the management plane as its own surface, with inventory, hardening baseline, scans and a log stream to the SIEM. CISA added CVE-2024-37085 to the KEV catalog on July 30, 2024. vCenter supports one external identity provider beside its local source; Entra federation over OpenID Connect with SCIM arrived in vSphere 8.0 Update 2, and it covers vCenter sign-in, not ESXi host authentication.

Finally, the unification layer becomes the most valuable target. NIST calls the policy engine and administrator the key components of the entire enterprise. Give the layer Tier 0 administration, its own telemetry, a blast-radius design in which losing it degrades reconciliation rather than access, and exportable records.`,
  "Book 11, Chapter 06 — Beyond Microsoft 365, \"Three things to reconcile before assessing,\" \"The hypervisor is a distinct threat class,\" \"The unification layer becomes the target,\" \"What a whole-agency score requires.\"");
}
endModule("Module 2");

// ================================================================== 18 Module 3 divider
{
  const s = divider(P2, "Module 3: Who owns Zero Trust, and close before assessing", "Part 2 — Owning and running the assessment  ·  Chapters 07–08",
    ["Why the posture needs an owner outside every pillar", "Decision rights, the matrix and least-privilege roles", "Six phases, and three responses to every finding"], 10);
  notes(s,
`Module 3: who owns Zero Trust, and why you close before you assess. Every pillar already has an owner; what's missing is an owner for the posture itself, and many assessment decisions are risk decisions that look like configuration. We'll walk the roles, the responsibility matrix and the least-privilege roles for the tools. Then the program's six-phase sequence, which puts the assessors at step five, and the three responses every finding is routed to, so a backlog shrinks instead of becoming permanent.`,
  "Book 11, Chapter 07 — Who Owns Zero Trust; Chapter 08 — Close Before You Assess.");
}

// ================================================================== 19 The posture owner
{
  const s = content(P2, "The posture needs an owner no pillar or provider holds");
  tag(s, "Who");
  img(s, "ch07-zero-trust-owners", 0.6, 1.5, 6.4, 4.95);
  panel(s, "Separate", 7.25, 1.5, 5.5, 2.55, HEX.navy, HEX.navyTint, "THREE REASONS FOR A SEPARATE OWNER", null, [
    "Scope: every provider's tool stops at its own edge",
    "Correlation: one finding can touch three pillars",
    "Risk: the model doesn't address risk acceptance",
    "The lead shouldn't own the biggest vendor relationship",
  ], 14);
  panel(s, "Rights", 7.25, 4.2, 5.5, 2.25, HEX.red, HEX.redTint, "DECISIONS THAT LOOK LIKE CONFIGURATION", null, [
    "An omission removes a policy from the report",
    "ScubaGear warns omissions can create blind spots",
    "The engineer types it; the risk owner decides it",
    "Expiring omission: the CISO. Standing one: the AO",
  ], 14);
  sources(s, "Sources: CISA ZTMM v2.0; OMB M-22-09; NIST SP 800-37 Rev. 2; CISA ScubaGear configuration docs; CISA BOD 25-01. The role model is program design. Book 11, Ch 07.");
  notes(s,
`Zero Trust programs don't fail for lack of owners. They fail because every owner is a pillar owner and nobody owns the question: what is the agency's posture across all five pillars and every estate, and what does the number on the cover page measure?

Three facts make the posture its own thing. Scope: both Microsoft-ecosystem tools stop at Microsoft's edge, and a provider assessing its own platform has no view of the others. Correlation: a stale service-principal credential matters to identity, applications and whatever data the principal reaches. Risk: the model says plainly that it doesn't address risk acceptance, which stays with the authorizing official under the Risk Management Framework. A maturity target, a tool score and a risk decision belong to three different people.

The figure is the program's model, design guidance. The CIO and sponsor own strategy, scope and tie-breaks, including writing down which estates the score covers so it can't quietly shrink. The Zero Trust program lead, often the strategy lead M-22-09 required, owns the score's definition, cross-pillar correlation, the assessment calendar and the prioritized program, and shouldn't also own the largest cloud vendor relationship. The CISO sets control requirements, the evidence standard and the approved tools; the authorizing official accepts residual risk.

Decision rights and work are different things. Marking a ScubaGear policy omitted removes it from the report, and ScubaGear's documentation warns that omissions and incorrect-result markings can introduce blind spots and must be approved through the organization's risk process. The engineer types the edit; the decision belongs to the risk owner, the CISO for an expiring omission and the authorizing official for a standing one.`,
  "Book 11, Chapter 07 — Who Owns Zero Trust, \"Why the posture needs its own owner,\" \"Decision rights and work are different things,\" \"The roles.\"");
}

// ================================================================== 20 Matrix
{
  const s = content(P2, "The responsibility matrix: one decider per row");
  tag(s, "Who");
  const H = ["Decision or work item", "CIO", "Lead", "CISO", "AO", "Pillar", "Plane", "SecOps", "Ops", "Assess", "Privacy"];
  const R = (...c) => c;
  const bottom = table(s, "Matrix", 1.5, [3.85, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83, 0.83], H, [
    R("Whole-agency score: covers and excludes", "C", "D, R", "C", "C", "C", "C", "", "", "C", ""),
    R("The unified naming and identity record", "C", "C", "C", "", "C", "D, R", "C", "", "", ""),
    R("Approved tools and pinned versions", "", "C", "D", "", "", "", "C", "R", "C", ""),
    R("Assessment accounts and consent scope", "", "", "D", "", "", "R", "C", "R", "", ""),
    R("Omission with an expiration date", "", "C", "D", "C", "R", "", "C", "R", "", ""),
    R("Omission or deviation with no end date", "", "C", "R", "D", "C", "", "C", "R", "", ""),
    R("Finding priority and sequence", "", "D", "C", "C", "R", "C", "C", "", "", ""),
    R("Remediation through change control", "", "C", "C", "", "D, R", "R", "C", "", "", ""),
    R("Plan of action and milestones per system", "", "C", "R", "D", "R", "", "", "", "C", ""),
    R("Drift findings surfaced to the AO", "", "R", "R", "D", "C", "", "R", "", "", ""),
    R("Handling and retention of outputs", "", "C", "D", "", "", "", "", "R", "", "C"),
    R("Native-tool findings admitted as evidence", "", "D", "C", "", "R", "", "", "R", "C", ""),
  ], { fontSize: 11, center: true, minRow: 0.35, limit: 6.2 });
  txt(s, "Legend", "D decides  ·  R does the work  ·  C consulted  ·  blank informed at most  ·  CISO column includes the ISSO  ·  Ops = assessment operators  ·  Plane = identity-plane owner (design guidance)",
    { x: 0.6, y: bottom + 0.08, w: 12.15, h: 0.32, fontSize: 11, color: HEX.slate });
  sources(s, "Sources: Book 11, Ch 07 responsibility matrix (program design); NIST SP 800-37 Rev. 2; CISA BOD 25-01 (AO acceptance of deviations).");
  notes(s,
`Here's the matrix, condensed from the chapter's twenty-two rows to the twelve assessors meet most. D decides, R does the work, C is consulted. Six rows need comment.

The score row gives the program lead the decision, because the definition of whole agency is what every other role has an incentive to narrow. The lead decides, the authorizing official and the assessors are consulted, and exclusions are written down.

The identity-plane row goes to the plane's owner, not the lead, because the plane is infrastructure with its own privileged access and blast radius, not a reporting artifact.

The omission rows split on time. The CISO approves an omission that expires, a bounded, reviewable decision recorded in the configuration file itself. One with no end date is a standing risk acceptance and goes to the authorizing official, matching BOD 25-01's assignment of deviation risk to authorizing officials.

Priority and remediation split too: the lead can say a finding is first; only the pillar owner says how it's closed, and the closure evidence has to meet the CISO's standard.

Drift goes to the authorizing official, because drift is change to an authorized system. A control that passed every interval and failed the last one is a different finding from one that has always failed, and the authorizing official decides whether it's a significant change.

And the native-tool row is the governance principle in one line: a provider's native posture tool is admitted as evidence for its own platform, by the lead, under the CISO's evidence standard. Never as the agency's score.`,
  "Book 11, Chapter 07 — Who Owns Zero Trust, \"The responsibility matrix.\"");
}

// ================================================================== 21 Roles in each system
{
  const s = content(P2, "Least-privilege roles for running and reading the tools");
  tag(s, "Who");
  table(s, "Roles", 1.5, [2.15, 2.65, 2.95, 1.35, 1.75, 1.3], ["Team", "ScubaGear run", "Zero Trust Assessment run", "CISA reporting", "Evidence repository", "SIEM"], [
    ["Assessment operators", "Global Reader; Power Platform Admin and license only if assessed", "Global Reader; Security Reader; SharePoint Admin; Azure Reader on scope", "Upload or run ScubaConnect", "Write unaltered outputs", "Own activity"],
    ["Identity engineering", "Grants one-time consent", "Grants consent; doesn't run under that account", "None", "Read", "Read"],
    ["Program lead", "None", "None", "Read", "Read; keep score definition", "Read"],
    ["CISO and ISSO", "None", "None", "Approve", "Approve evidence", "Read"],
    ["Pillar owners", "None", "None", "None", "Own findings; closure evidence", "Read"],
    ["Control assessors", "None", "None", "Read", "Re-run assembly", "Read"],
    ["Security operations", "None", "None", "None", "Read drift findings", "Detections on the accounts"],
  ], { fontSize: 11.5, limit: 5.45 });
  callout(s, "Accounts", 5.55, 0.9, "FaUserShield", HEX.red, "Among the most sensitive identities: ",
    "together they read every tenant. Eligible, not standing; sign-ins logged to the top-level SOC; telemetry is a CISO decision.");
  sources(s, "Sources: CISA ScubaGear permissions; ZeroTrustAssessment repository guide; Microsoft Learn — Zero Trust Assessment get started; OMB M-26-14. Book 11, Ch 07.");
  notes(s,
`Decision rights don't change what a console lets someone do; roles do, and the tools need broad read access. The program maps each team to the least-privileged role in each system.

Assessment operators run ScubaGear as Global Reader for most products, adding Power Platform Administrator with its license only if Power Platform is assessed. For the Zero Trust Assessment, the tool's own repository guide maps checks to roles: Global Reader for the Graph context, Security Reader for protection-policy checks, SharePoint Administrator for the SharePoint tenant commands, and Azure Reader on in-scope subscriptions. Identity engineering grants the one-time application consent through an authorized consent role, and doesn't run the assessment under that account. Everyone else reads, and security operations runs detections on the assessment accounts.

Three notes. The Zero Trust Assessment's guide says a highly privileged administrator is for initial consent only, and consent doesn't assign runtime roles; the assessment account should be a reader. Second, the assessment accounts are among the most sensitive identities in the design, because between them they can read the configuration of every tenant the agency runs: eligible rather than standing where the platform allows, with sign-ins logged to the top-level SOC as M-26-14 requires for privileged operations. Third, the Zero Trust Assessment sends a telemetry event by default carrying the tenant ID; DisableTelemetry turns it off, and whether to use it is a CISO decision recorded with the tool approval, not an operator's choice on the day.`,
  "Book 11, Chapter 07 — Who Owns Zero Trust, \"Roles in each system.\"");
}

// ================================================================== 22 Architecture first
{
  const s = content(P2, "Architecture first: the assessors run at step five");
  tag(s, "How");
  img(s, "ch08-close-then-assess", 0.6, 1.5, 4.7, 4.95);
  panel(s, "Cannot", 5.55, 1.5, 7.2, 2.3, HEX.red, HEX.redTint, "WHAT NEITHER ASSESSOR CAN DO", null, [
    "Design the Conditional Access set, legacy-auth retirement or device identity",
    "Build the naming plane under the SPF and DMARC records it checks",
    "Resolve a conflict between TIC 3.0, Zero Trust and FedRAMP",
    "Note: no 1.8.0 baseline has a DNSSEC policy",
  ], 13);
  panel(s, "Layers", 5.55, 3.95, 7.2, 2.5, HEX.teal, HEX.tealTint, "CLOSE FIRST: FOUR LAYERS, IN ORDER (DESIGN GUIDANCE)", null, [
    "Naming, addressing and certificates",
    "Device and workload identity",
    "Legacy-authentication elimination, in phases",
    "Governed exceptions: dated, owned, or remediated",
    "The RMF's order: implement, assess, authorize, monitor",
  ], 14);
  sources(s, "Sources: CISA BOD 25-01; SCuBA Exchange Online baseline; Microsoft Learn — Zero Trust Assessment; NIST SP 800-37 Rev. 2. The six phases are program design. Book 11, Ch 08.");
  notes(s,
`Agencies met BOD 25-01's early dates, and many now treat ScubaGear running and reporting as the answer. It isn't. ScubaGear measures deviation; it doesn't close any. A thermometer that reports a fever every day for a year isn't a treatment plan.

Neither tool can design the Conditional Access set, the legacy-authentication retirement or the device and workload identity chain. Neither can build the naming plane under the DNS records the baselines check: the Exchange baseline requires SPF for every domain and DMARC at p equals reject for every second-level domain, and ScubaGear can say a record is missing, not give the agency an owner for every zone. And neither resolves a conflict between TIC 3.0, Zero Trust and FedRAMP.

So the program's sequence, design guidance, puts the assessors at phase five. Understand gaps and root causes, design the closure pattern, implement it, govern it with owners, POA&Ms and risk acceptances, then validate with both tools, as confirmation rather than discovery, and authorize. A first read-only run can inform the phase-one gap list, but running the assessor as the program there only yields an unowned list. The RMF runs implement, assess, authorize, monitor, and BOD 25-01 itself requires a new tenant's baseline before its ATO.

For the BOD 25-01 surface, closing first means four layers in order: naming, addressing and certificates; device and workload identity; legacy-authentication elimination in phases, so Book 04's CA001 meets MS.AAD.1.1v1 only after the last legacy client has moved; and governed exceptions, each open deviation remediated on a date or carried as a dated, owned risk acceptance.`,
  "Book 11, Chapter 08 — Close Before You Assess, \"What the assessors can't do,\" \"The sequence: architecture before assessment,\" \"Closing findings first.\"");
}

// ================================================================== 23 Triage
{
  const s = content(P2, "Route every finding to one of three responses");
  tag(s, "How");
  img(s, "ch08-finding-triage", 0.6, 1.5, 6.9, 3.2);
  const r = table(s, "Responses", 1.5, [1.65, 3.4], ["Response", "What it produces"], [
    ["Configuration change", "A change record; a pass at the next run"],
    ["Architectural work", "An owner, a target date, a link to the layer's work item"],
    ["Risk acceptance", "An AO decision with a review date; \"Omitted\" with a rationale"],
  ], { x: 7.7, fontSize: 12, limit: 4.7 });
  panel(s, "Continuous", 0.6, 4.9, 12.15, 1.55, HEX.navy, HEX.navyTint, "THEN ASSESS CONTINUOUSLY (DESIGN GUIDANCE)", null, [
    "Drift between runs, an exception lifecycle and a monitoring gate over each tool's verdicts; fail only when a finding is unowned",
    "Not an assessor, not a maturity model, not a remediator: it stands on the tool's own output",
  ], 12.5);
  txt(s, "Only failure", [
    { text: "The only failure state: ", options: { bold: true, color: HEX.red } },
    { text: "a finding with no response recorded." },
  ], { x: 7.7, y: r + 0.15, w: 5.05, h: 4.7 - r - 0.15, fontSize: 14, valign: "middle" });
  sources(s, "Sources: CISA BOD 25-01 and implementation guidance (Omitted with rationale). Routing and the continuous layer are program design. Book 11, Ch 08.");
  notes(s,
`Not every finding waits for architecture. The program routes each current finding from either tool to exactly one response, and records which.

A configuration change, when the fix is a setting and nothing depends on the old behavior: a change record now, and a passing result at the next run. Architectural work, when the fix depends on a layer that doesn't exist yet: an owner, a target date and a link to that layer's work item. Or a risk acceptance, when the deviation is operationally required for now: an authorizing-official decision with a review date, reflected as Omitted with a rationale in the tool output. The only state the program treats as failure is a finding with no response recorded.

Then assess, continuously. What a point-in-time scan doesn't give you is a durable run-to-run record, aging of each open deviation against a target, and a clean signal for new deviation versus known, governed exception. The program builds that layer over the tools' output without reimplementing either. For ScubaGear it adds drift detection, an exception lifecycle and a continuous-monitoring gate over the pass and fail verdicts. For Zero Trust Assessment results and maturity self-assessments, it sorts every below-target finding into actionable new drift, a lapsed acceptance or a governed exception, and fails the pipeline only when something is genuinely unowned. It's explicit about what it isn't: not an assessor, not a maturity model, not a remediator. That's what makes remediate deviations something CISA or an assessor can check: a re-runnable disposition of every open finding.`,
  "Book 11, Chapter 08 — Close Before You Assess, \"Route every finding to one of three responses,\" \"Then assess, continuously,\" \"Where this argument stops.\"");
}
endModule("Module 3");

// ================================================================== 24 Module 4 divider
{
  const s = divider(P2, "Module 4: Running the assessment, evidence not verdicts", "Part 2 — Owning and running the assessment  ·  Chapters 09–10, Appendix A",
    ["Preparing and running both tools", "From a tool result to sealed, re-runnable OSCAL evidence", "Read, score, reconcile, re-assess; the requirements map"], 16);
  notes(s,
`Module 4: running the assessment, and evidence rather than verdicts. A ScubaGear report that someone archives and rereads at audit time is a point-in-time opinion; the same output, wrapped with its provenance and sealed into a bundle an assessor can rebuild months later, is evidence. We'll prepare the run, run both tools, and follow the output into the evidence chain with one worked trace. Then we read, score, reconcile and re-assess the results, and close with the controls the evidence supports and the decisions for this quarter.`,
  "Book 11, Chapter 09 — Running the Assessment and Ingesting the Evidence; Chapter 10 — Evidence, Not Verdicts; Appendix A — Requirements Mapping.");
}

// ================================================================== 25 Before the first run
{
  const s = content(P2, "Before the first run: scope, host, accounts, output, logs");
  tag(s, "How");
  table(s, "Prep", 1.5, [1.55, 5.6, 5.0], ["Decide", "What the program does", "Why"], [
    ["Scope", "ScubaGear: the BOD 25-01 tenant inventory. Zero Trust Assessment: written per run, with tagged Azure subscriptions", "Its coverage depends on connections, permissions and licenses"],
    ["Host", "Dedicated Windows hosts inside the boundary; a clean host or session per tool", "Windows PowerShell 5 against PowerShell 7; conflicting dependencies"],
    ["Accounts", "A dedicated, CISO-approved reader per tool; a separate one-time consent", "Consent doesn't assign runtime roles"],
    ["Output", "Controlled data: protected directory, moved unaltered, then deleted from the host", "Microsoft: the report holds information attackers could use"],
    ["Logging", "Assessment sign-ins and consent grants in the Agency Logging Plan", "M-26-14: identity per operation; the plan is due 90 days after CISA's architecture"],
  ], { fontSize: 13, minRow: 0.62, limit: 5.25 });
  callout(s, "Runner", 5.4, 1.05, "FaServer", HEX.red, "The wrong place: ",
    "a shared, internet-hosted build runner for a file that maps a federal tenant's weaknesses.");
  sources(s, "Sources: CISA BOD 25-01; ScubaGear dependencies; ZeroTrustAssessment guide; Microsoft Learn; OMB M-26-14; CISA Logging Reference Architecture (Aug. 20, 2026). Book 11, Ch 09.");
  notes(s,
`Five things are decided before either tool touches a production tenant, each owned in Chapter 07.

Scope. BOD 25-01's tenant inventory, updated every first quarter, is ScubaGear's scope list. The Zero Trust Assessment reaches wider and its coverage depends on connections, permissions and licenses, so its scope is written per run, including which Azure subscriptions are tagged for its Infrastructure pillar.

The host. ScubaGear runs only on Windows, because at least one Microsoft library it depends on is tied to Windows PowerShell 5. The Zero Trust Assessment needs PowerShell 7 and, for full coverage, Windows, since its SharePoint Online and Azure Information Protection checks are skipped elsewhere. Their dependencies conflict, and its guide recommends a dedicated virtual machine, so the program uses a separate clean host or session per tool, inside the authorization boundary.

Accounts. A dedicated, CISO-approved reader per tool and a separate one-time consent by an administrator authorized to grant it.

Output handling. Microsoft warns the report and export folder hold sensitive tenant information attackers could use, and advises deleting the generated folder once the report is stored securely. The program treats every output of both tools as Controlled: written to a protected directory, moved unaltered to the evidence repository, deleted from the host.

Logging. M-26-14 requires logs that identify the identity used for operations and every change to privilege levels, available to the top-level SOC. CISA published the Logging Reference Architecture on August 20, 2026, and the memo gives agencies 90 days from its release for the first Agency Logging Plan, so the assessment hosts and accounts belong in that plan now.`,
  "Book 11, Chapter 09 — Running the Assessment, \"Before the first run.\"");
}

// ================================================================== 26 Running both tools
{
  const s = content(P2, "Running both tools: pin, record, never edit the output");
  tag(s, "How");
  table(s, "Run", 1.5, [2.0, 5.05, 5.1], ["", "ScubaGear 1.8.0", "Zero Trust Assessment 3.1.0"], [
    ["Runtime", "Windows PowerShell 5.1; Initialize-SCuBA installs OPA", "PowerShell 7.6 or later; Install-PSResource or Install-Module"],
    ["Government cloud", "-M365Environment gcc, gcchigh or dod", "GCC uses the default Global environment"],
    ["Connections", "The Microsoft 365 APIs", "Graph, Azure, Exchange, Security & Compliance, SharePoint, AIP: each separate"],
    ["Recorded each run", "Tool version, configuration file hash, organization", "Tool version; review before comparing across versions"],
    ["Evidence file", "ScubaResults_{UUID}.json: hashed and copied only", "zt-export\\ZeroTrustAssessmentReport.json"],
    ["Human views", "BaselineReports.html; ActionPlan.csv (failing SHALLs)", "ZeroTrustAssessmentReport.html; a classic report"],
    ["Watch for", "Config file holds annotations, omissions with expiry, exclusions", "A community project; can exceed 24 hours; don't stop it"],
  ], { fontSize: 12.5, limit: 5.2 });
  callout(s, "Goggles", 5.05, 1.3, "FaPlugCircleXmark", HEX.amber, "A stated gap: ",
    "ScubaGoggles reached 1.0.0, but the program's adapter registry has no ScubaGoggles entry, so Workspace evidence isn't in the chain yet.");
  sources(s, "Sources: ScubaGear repository, release v1.8.0 and README; ZeroTrustAssessment guide and 3.1.0 release; Microsoft Learn — Zero Trust Assessment; Graph national clouds. Book 11, Ch 09.");
  notes(s,
`The run itself. The commands are in Chapter 09, illustrative and untested against production.

ScubaGear installs from the PowerShell Gallery in Windows PowerShell 5.1; Initialize-SCuBA installs the dependencies, OPA included. For BOD 25-01 submissions, CISA's documentation calls for a configuration file and the organization's tenant name; M365Environment picks gcc, gcchigh or dod. The configuration file is where the agency's baseline decisions live: annotations with action plans, omissions with rationales and optional expiry, exclusions such as emergency access accounts. It's an input to the run, so it's versioned and its hash is recorded, exactly like the tool version.

Each run writes a time-stamped directory. BaselineReports.html and the individual reports are for humans. The JSON file carries run and tenant metadata, summary counts, every result and the raw provider output, and it's the evidence: never edited, renamed or regenerated, only hashed and copied, the same rule CISA applies to CyberScope submissions. ActionPlan.csv lists failing SHALL controls only and seeds the POA&M.

The Zero Trust Assessment is a community project maintained by Microsoft employees, not a supported product, and it moves fast: 3.1.0 asks for PowerShell 7.6 or later. Connect-ZtAssessment connects separately to Graph, Azure, Exchange Online, Security and Compliance, SharePoint and Azure Information Protection; one success doesn't grant the others. A GCC tenant uses the default Global environment. Expect more than a day on a large tenant, and don't stop it when it logs warnings. Its evidence is the JSON report data in the export folder, and the export folder also holds a database of sensitive tenant data, kept only as the records decision allows.`,
  "Book 11, Chapter 09 — Running the Assessment, \"Running ScubaGear,\" \"Running the Zero Trust Assessment.\"");
}

// ================================================================== 27 Result to claim
{
  const s = content(P2, "From result to claim: four stages and one worked trace");
  tag(s, "How");
  flow(s, "Stages", 1.5, 1.5, [
    { head: "1 Tool run", body: "The tool's own unaltered output, inside the boundary" },
    { head: "2 Claim", body: "Claim ID, issuer, source class, timestamp, lineage hash" },
    { head: "3 Bundle and seal", body: "Same inputs give a byte-identical bundle" },
    { head: "4 OSCAL", body: "Assessment-results observations and POA&M items" },
  ], 12.5);
  img(s, "ch09-worked-trace", 0.6, 3.2, 4.6, 3.25);
  table(s, "Drift", 3.2, [3.75, 2.15, 1.45], ["Finding pattern (program drift standard)", "Drift class", "Severity"], [
    ["Configuration drifts from a passing baseline", "SCHEMA or SEMANTIC", "P3 (P2 if live)"],
    ["Claim without a complete provenance envelope", "PROVENANCE", "P1"],
    ["Conditional Access contradicts recorded assurance", "AUTHZ", "P1"],
    ["A principal in a finding doesn't resolve", "IDENTITY", "P1"],
  ], { x: 5.4, fontSize: 12, limit: 5.5 });
  txt(s, "Registry", [
    { text: "ScubaGear's registry entry: ", options: { bold: true, color: HEX.navy } },
    { text: "a conformance adapter with a policy mission, interval evidence and three-year retention by default." },
  ], { x: 5.4, y: 5.65, w: 7.35, h: 0.8, fontSize: 13.5, valign: "middle" });
  sources(s, "Sources: CISA ScubaGear results schema and SCuBA control mappings; NIST OSCAL models. The adapter, claim envelope and drift classes are program design. Book 11, Ch 09.");
  notes(s,
`The program treats each tool as an adapter, an input to one evidence chain, rather than a freestanding report.

Four stages. The tool run writes its own unaltered output inside the boundary. Claim normalization wraps every result, Pass, Fail, Warning and N/A alike, in a provenance envelope: claim ID, issuer identity, source classification, extraction timestamp and lineage hash. Bundle assembly seals the claims from one run interval deterministically: the same tenant state, policy version and canon version produce a byte-identical bundle, so an assessor can re-run the assembly months later and check the hash. And the OSCAL artifact emits assessment-results observations and POA&M items.

ScubaGear's registry entry declares it a conformance adapter with a policy mission class, interval evidence and three-year retention as the program's default. The control mapping lives in reviewed canon, not adapter code, starting from CISA's own mapping.

The worked trace is illustrative, not a historical finding. MS.AAD.1.1v1, legacy authentication shall be blocked, a SHALL policy CISA maps to CM-7, returns Fail because no enabled Conditional Access policy blocks legacy authentication for all users. The adapter wraps it with the tenant's Entra ID as issuer, authoritative source classification and a SHA-256 lineage hash over the raw result. It joins its indicator, opens a POA&M item because it fails outside any accepted exception, and is sealed. The OSCAL observation cross-references that item, and the lineage hash walks back to the raw result without re-running ScubaGear.

The drift classes on the right are the program's standard. Provenance, authorization and identity drift are P1, because each is load-bearing; configuration drift from a passing baseline starts at P3, P2 if it affects a live indicator.`,
  "Book 11, Chapter 09 — Running the Assessment, \"ScubaGear as a registered adapter,\" \"The four-stage pipeline,\" \"Drift: what a finding can raise,\" \"A worked trace.\"");
}

// ================================================================== 28 Findings versus absence of evidence
{
  const s = content(P2, "Findings, manual checks and absence of evidence");
  tag(s, "How");
  table(s, "Scuba", 1.5, [1.75, 4.1], ["ScubaGear result", "How the program treats it"], [
    ["Fail", "A finding; if mandatory, a directive gap first"],
    ["Warning", "A finding (failed SHOULD), lower priority"],
    ["N/A", "A manual check for the pillar owner; not a pass"],
    ["Omitted", "Not a finding; a decision with an owner and expiry"],
    ["Incorrect Result", "Not a finding; the original result is kept"],
    ["Error", "Absence of evidence: fix the run, re-run"],
    ["Pass", "Conformance evidence for that interval"],
  ], { fontSize: 12.5, limit: 5.0 });
  table(s, "ZTA", 1.5, [1.75, 4.1], ["Zero Trust Assessment", "How the program treats it"], [
    ["Failed", "A finding"],
    ["Investigate", "A finding pending manual review"],
    ["Skipped", "Absence of evidence, with the reason"],
    ["Planned", "Not yet built by Microsoft; ignored"],
    ["Error", "Absence of evidence: fix access, re-run"],
    ["Passed", "Conformance evidence for that run"],
  ], { x: 6.9, fontSize: 12.5, minRow: 0.45, limit: 5.0 });
  callout(s, "Skip", 5.05, 1.3, "FaFilter", HEX.amber, "A skip is not a pass, or a gap: ",
    "in a government cloud, confirm a premium license applies in the boundary before scoring it; otherwise record a boundary finding.");
  sources(s, "Sources: CISA ScubaGear results schema; ZeroTrustAssessment guide and status definitions; Microsoft Learn — government cloud feature availability. Book 11, Ch 10.");
  notes(s,
`Read the result before counting it. The two tools use different words for the same outcomes, and some outcomes aren't findings at all.

ScubaGear returns Pass, Fail, Warning, N/A, Omitted, Incorrect Result or Error, each policy SHALL or SHOULD. Fail is a finding, and if the policy is on the mandatory list, a directive gap first. Warning is a finding at lower priority. N/A is typically a manual check: a work item for the pillar owner to verify by hand, not a pass. Omitted and Incorrect Result aren't findings, but each is a decision with an owner, and Incorrect Result keeps the original result. Error is absence of evidence: fix the run and re-run.

The Zero Trust Assessment returns Passed, Failed, Investigate, Skipped, Planned or Error. Failed is a finding; Investigate is a finding pending manual review. Skipped covers a service not connected, a license missing, a feature unsupported, a check that doesn't apply, or a timeout, and it's absence of evidence recorded with the reason. Planned is a check Microsoft hasn't built yet, ignored.

A skipped check is the easiest result to misread. The tool's own guide says missing prerequisites produce skips that are not evidence the tenant meets a recommendation, and that permission errors should be investigated rather than treated as security failures. In a government cloud, premium capabilities may be unavailable or unauthorized, so confirm the license applies in the boundary before scoring a gap. Score it failed and you overstate the gap; score it passed and you overstate the posture. Record it as a boundary finding for Book 10.`,
  "Book 11, Chapter 10 — Evidence, Not Verdicts, \"Read the result before counting it,\" \"Absence of evidence is a different claim.\"");
}

// ================================================================== 29 Score, rank, reconcile
{
  const s = content(P2, "Score, rank and reconcile at the control, not the tool");
  tag(s, "How");
  table(s, "Score", 1.5, [1.75, 4.2], ["Step (design guidance)", "Method"], [
    ["Severity", "0 to 100: risk level weighted by status"],
    ["Priority", "Severity divided by effort (implementation cost)"],
    ["Buckets", "P1 at 50 or above, P2 at 30, P3 at 15, P4 above 0"],
    ["User impact", "Sets the communications plan, not the rank"],
    ["Quadrant", "Quick wins: next change window. Projects: a funded roadmap"],
  ], { fontSize: 13, minRow: 0.55, limit: 4.85 });
  panel(s, "Spine", 6.8, 1.5, 5.95, 3.35, HEX.teal, HEX.tealTint, "ONE SPINE FOR BOTH TOOLS", null, [
    "Policy IDs and numeric test IDs don't match; neither do severity models",
    "Spine: the tenant setting and the SP 800-53 control",
    "CISA maps each SCuBA policy to Rev. 5 controls in FedRAMP High",
    "The program's table carries Zero Trust Assessment checks onto the same controls",
    "Same setting and control: one finding, two evidence items, one owner",
  ], 14);
  callout(s, "Toolkit", 5.05, 1.4, "FaTriangleExclamation", HEX.red, "Install the toolkit from the program's repository: ",
    "a same-named package on the public Python index is an unrelated project, and that would put someone else's code on a host holding tenant data.");
  sources(s, "Sources: Microsoft Learn — Zero Trust Assessment glossary; CISA SCuBA control mappings; PyPI (unrelated fmp package). The scoring method is program design. Book 11, Ch 09, 10.");
  notes(s,
`Only findings get scored: ScubaGear Fail and Warning, Zero Trust Assessment Failed and Investigate. The scoring is the program's method, design guidance, documented so anyone can check it.

Severity, zero to a hundred, is the check's risk weighted by its status, so a failed high-risk check outranks an Investigate item of the same risk. Priority is severity divided by effort, so a high-severity, low-effort quick win outranks a high-severity project. Buckets: P1 at 50 or above, P2 at 30, P3 at 15, P4 above zero. The inputs come from Microsoft's three scales. Risk Level drives severity; Implementation Cost drives effort; and User Impact doesn't change rank, it changes the communications plan and the change window. The remediation quadrant sends quick wins to the next change window and major projects to a pillar owner's roadmap with a funded milestone. And a P1 is a priority, not a risk acceptance.

The program's toolkit produces the dashboard workbook, a Power BI CSV with one row per check and a remediation playbook with portal steps and Microsoft Learn links, no scripts. Install it from the program's own repository and verify downloaded scripts against their published hashes: a package with the same name on the public Python index is an unrelated import formatter.

Then reconcile at the control, not tool to tool. Policy IDs and numeric test IDs don't match. The spine is the tenant setting and the SP 800-53 control. CISA maps every SCuBA policy to Rev. 5 controls within the FedRAMP High baseline, and the program's table carries Zero Trust Assessment checks onto the same controls. A ScubaGear Fail and a Zero Trust Assessment Failed on the same setting and control are one finding with two pieces of evidence, routed to one pillar owner.`,
  "Book 11, Chapter 10 — Evidence, Not Verdicts, \"Score and rank the findings,\" \"Reconcile at the control, not tool to tool\"; Chapter 09, \"Ingesting the Zero Trust Assessment.\"");
}

// ================================================================== 30 Exceptions, POA&M, re-assessment
{
  const s = content(P2, "Exceptions, POA&Ms and re-assessment on a cadence");
  tag(s, "How");
  panel(s, "Exceptions", 0.6, 1.5, 6.3, 2.35, HEX.amber, HEX.amberTint, "EXCEPTIONS LIVE IN THE CONFIGURATION FILE", null, [
    "Annotate, mark incorrect, or omit with a rationale and expiry",
    "Reviewed pull requests; hash per run; schema catches expired entries",
    "Time decides the approver: CISO if it expires, AO if it doesn't",
    "A compensating control is its own adapter, with its own evidence",
  ], 12.5);
  panel(s, "POAM", 0.6, 4.0, 6.3, 2.45, HEX.navy, HEX.navyTint, "EVERYTHING ELSE BECOMES A POA&M ITEM", null, [
    "One per system (CA-5), approved by the AO; RA-7: respond within risk tolerance",
    "Seeds: ActionPlan.csv, the playbook tracker, OSCAL POA&M items",
    "Each names an owner, the control, closing evidence and re-test",
    "The ZTA has no exception file: same repository, same rule",
  ], 13.5);
  img(s, "ch10-reassessment-loop", 7.15, 1.5, 5.6, 3.2);
  panel(s, "Cadence", 7.15, 4.85, 5.6, 1.6, HEX.teal, HEX.tealTint, "RE-ASSESS ON A CALENDAR", null, [
    "And after each remediation wave; quarterly is the floor",
    "Compare scores only on the same tool version",
  ], 12.5);
  sources(s, "Sources: CISA ScubaGear configuration docs; BOD 25-01 guidance; NIST SP 800-53 Rev. 5 (CA-5, CA-7, RA-7); NIST SP 800-37; NIST OSCAL; ZeroTrustAssessment guide. Book 11, Ch 10.");
  notes(s,
`An exception is a governed artifact, not a sentence in a Word document.

ScubaGear provides the mechanism. Its configuration file can annotate a policy with a comment and remediation date; it can mark a result incorrect, with a comment; and it can omit a policy with a rationale and an optional expiration, after which the policy returns to the report. The program adds three rules: the file is canon, changed by reviewed pull request with its hash recorded per run, and a schema check catches omissions whose policy no longer exists or whose expiry has passed; time decides the approver, the CISO if it expires and the authorizing official if it doesn't; and a compensating control is registered as its own adapter, so the exception points at evidence rather than a promise. The Zero Trust Assessment has no exception file, so accepted findings go in the same repository.

Everything not fixed in the next change window and not excepted becomes a POA&M item. Three outputs seed it: ActionPlan.csv, the playbook's tracker, and OSCAL POA&M items from the bundle. Each names the owner, the control, the closing evidence and the re-test.

Re-assess on the lead's calendar and after each remediation wave, so a finding closes by evidence, not ticket status. Quarterly is ScubaGear's floor for manual and agency-hosted reporting. Each re-run adds an interval rather than replacing a report. Invoke-SCuBADiff, which compares two results files, is on the development branch, not in 1.8.0. Compare Zero Trust Assessment scores only on the same version, and send interval-to-interval drift to the authorizing official.`,
  "Book 11, Chapter 10 — Evidence, Not Verdicts, \"Exceptions belong in the configuration file,\" \"From findings to plans of action and milestones,\" \"Re-assess on a cadence.\"");
}

// ================================================================== 31 Requirements mapping
{
  const s = content(P2, "Requirements mapping: the controls the evidence supports");
  tag(s, "What");
  table(s, "Map", 1.5, [2.6, 2.3, 7.25], ["SP 800-53 Rev. 5 control", "Closed by", "Evidence an assessor can expect"], [
    ["IA-2 (1), (2), (12)", "Books 04, 07", "Authentication methods policy; certificate-based authentication; sign-in logs"],
    ["AC-3, AC-6", "Book 04", "Conditional Access and role assignment exports; PIM settings"],
    ["CM-2, CM-6", "Books 04, 05", "SCuBA results; Intune and Azure Policy compliance; hypervisor hardening"],
    ["CM-8", "Books 05, 08", "One reconciled inventory across network, cloud and hypervisors"],
    ["SC-20, SC-21, SC-22", "Book 08", "Resolver architecture; DNSSEC validation; forwarding across platforms"],
    ["AC-4, SC-7 (5)", "Book 09", "Flow and segmentation policy per estate"],
    ["CA-2, CA-5, CA-7", "Book 11", "Assessment plan; POA&M traced to findings; monitoring reports"],
    ["IR-4", { text: "Not designed", options: { color: HEX.red, bold: true } }, "Incident records; the maturity model doesn't address response either"],
  ], { fontSize: 13, minRow: 0.44, limit: 5.5 });
  callout(s, "Claim", 5.6, 0.85, "FaClipboardCheck", HEX.navy, "Compliance-enabling, not a claim: ",
    "every control here is in the SP 800-53B Moderate baseline, and no 5.2.0 control mentions zero trust.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (release 5.2.0) and SP 800-53B OSCAL profiles; CISA ZTMM v2.0; BOD 23-01; OMB M-22-09. Book 11, App A.");
  notes(s,
`Appendix A maps the requirements, and it's careful about its own claim: compliance-enabling, not a compliance claim. It helps an agency reuse the workbook's design and evidence in its own implementation plan and system security plans; it doesn't say following the workbook satisfies any control.

These are the controls Zero Trust evidence most often supports, with the book that builds each capability. Authentication, IA-2 with its MFA and PIV enhancements, is closed by Books 04 and 07, evidenced by the authentication methods policy and sign-in logs. Least privilege and access enforcement, by Book 04's Conditional Access and PIM exports. Baselines and settings, CM-2 and CM-6, by SCuBA results, Intune and Azure Policy compliance, and hypervisor hardening. The inventory, CM-8, by one reconciled inventory across network, cloud and hypervisors, which is the program's reading with BOD 23-01 and M-22-09, not the control's wording. Name resolution, SC-20 to 22, by Book 08. Flow and boundary, by Book 09. Assessment, POA&M and continuous monitoring, CA-2, 5 and 7, by this book.

And the gaps are stated. Incident handling, IR-4, isn't designed in the workbook, and the maturity model doesn't address incident response either. The Data pillar has no book of its own yet; the Zero Trust Assessment's data findings are an input until it does.

Two reading notes. Every control and enhancement in the table is in the SP 800-53B Moderate baseline, checked against the OSCAL profile. And no control, enhancement or discussion text in release 5.2.0 mentions zero trust. Zero Trust evidence supports existing controls; it doesn't add a family.`,
  "Book 11, Appendix A — Requirements Mapping, \"NIST SP 800-53 controls a Zero Trust program asserts,\" \"Reading the controls.\"");
}

// ================================================================== 32 Decisions
{
  const s = content(P2, "Decisions for this quarter, none of them a purchase");
  tag(s, "How");
  table(s, "Decisions", 1.5, [5.95, 2.6], ["Decision (design guidance)", "Owner"], [
    ["Inventory which pillar evidence is reproducible", "Program lead"],
    ["Name a correlation owner and a posture owner outside any provider", "CIO"],
    ["Bring one adapter, usually ScubaGear, under the taxonomy as OSCAL", "Lead, with the pillar owner"],
    ["Move exceptions into the configuration file, with expirations", "CISO"],
    ["Surface interval-to-interval drift to the AO", "Lead and security operations"],
    ["Record government-cloud feature gaps as governed findings", "System owner and ISSO"],
    ["Reconcile network, cloud and virtualization identity first", "Identity-plane owner"],
    ["One detective control to preventive; time-box privilege", "CISO, identity engineering"],
  ], { fontSize: 13, minRow: 0.54, limit: 6.45 });
  panel(s, "Limits", 9.4, 1.5, 3.35, 4.9, HEX.red, HEX.redTint, "HONEST LIMITS", "Stated plainly", [
    "Continuous capture is target state",
    "The scoring method isn't a federal standard",
    "A P1 is a priority, not a risk acceptance",
    "Runtime drift only where adapters implement it",
    "No tool certifies Zero Trust maturity",
    "Evidence supports decisions; named people make them",
  ], 14.5);
  sources(s, "Sources: Book 11, Chapters 02, 07 and 10; CISA ZTMM v2.0; CISA BOD 25-01. Decisions, owners and sequence are program design guidance.");
  notes(s,
`So, the decisions for this quarter, each with its owner from Chapter 07, none of them a purchase.

The program lead inventories which pillar evidence is reproducible: can the pipeline be re-run without the operator? Where it can't, that's the adoption boundary. The CIO names a cross-pillar correlation owner, and an agency-level owner of the posture separate from any cloud provider relationship. The program lead, with the pillar owner, brings one adapter under the canonical taxonomy and emits its findings as OSCAL; ScubaGear is the usual first choice. The CISO moves exceptions into the configuration file and the repository, with expirations, and routes every standing one to the authorizing official. The lead and security operations stand up drift detection as a governance function and surface interval-to-interval drift to the authorizing official, the cheapest adoption step in the book. The system owner and ISSO model the cloud boundary, recording feature gaps as governed findings. The identity-plane owner reconciles network, every cloud and the virtualization estate to one source before anything is scored. And the CISO, with identity engineering, converts one detective control to preventive and time-boxes privileged access, including the assessment accounts.

The honest limits. Optimal maturity needs continuous, automated, cross-pillar evaluation, and continuous capture across every adapter is target state. The scoring method is the program's, documented and repeatable, not a federal standard. And no tool, and no number of tools, certifies Zero Trust maturity. The evidence supports the decisions; named people make them.

Chapters 01 through 10 and Appendix A carry the detail, every claim footnoted and every command marked illustrative. Thank you.`,
  "Book 11, Chapter 10 — Evidence, Not Verdicts, \"What an agency can do this quarter,\" \"Honest limits\"; Chapter 02, \"Governance decisions for this quarter.\"");
}
endModule("Module 4");

// ================================================================== Backup
{
  const s = content("Backup", "Backup");
  txt(s, "Backup note", "The slides after this one are reference material and are not narrated.", { x: 0.6, y: 3.2, w: 12.1, h: 0.6, fontSize: 18, color: HEX.slate, align: "center" });
}
const sourceSlide = (title, src) => {
  const s = content("Backup", title);
  txt(s, "Source list", bullets(src, 12), { x: 0.6, y: 1.5, w: 12.1, h: 5.1, paraSpaceAfter: 5 });
  const need = 1.5 + src.reduce((a, t) => a + lines(t, 11.8, 12) * 12 / 72 * 1.2 + 0.07, 0);
  if (need > 6.6) console.warn(`  ! ${title} source list may overflow: needs ${need.toFixed(2)}`);
};
sourceSlide("Sources behind the orientation and Module 1", [
  "Executive Order 14028, Improving the Nation's Cybersecurity (May 12, 2021), §3(b)(ii) and §10(k).  ·  OMB M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles (Jan. 26, 2022).",
  "OMB M-26-14, Ensuring Effective and Efficient Agency Logging and Network Visibility (May 22, 2026; rescinds M-21-31).  ·  OMB memoranda index (2025 and 2026).",
  "CISA, Zero Trust Maturity Model, Version 2.0 (April 2023), and its landing page (marked archived).  ·  NIST SP 800-207, Zero Trust Architecture (August 2020).  ·  NIST SP 1800-35 (June 2025).",
  "Cyber Safety Review Board, Review of the Summer 2023 Microsoft Exchange Online Intrusion (Mar. 20, 2024).  ·  CISA and FBI, AA23-039A, ESXiArgs Ransomware Virtual Machine Recovery Guidance (Feb. 8, 2023).",
  "Recorded Future on ESXiArgs and OpenSLP (Feb. 2023).  ·  Microsoft Threat Intelligence, ransomware operators exploit ESXi hypervisor vulnerability, CVE-2024-37085 (July 29, 2024).",
  "VMware by Broadcom, vSphere Authentication 8.0, identity sources for vCenter Single Sign-On.  ·  NIST OSCAL.  ·  FedRAMP, Using a FedRAMP Certified Cloud Service (Consolidated Rules for 2026).",
  "Microsoft Learn: continuous access evaluation; Privileged Identity Management; emergency access accounts; Office cloud features in GCC, GCC High and DoD; Intune for US Government.",
  "Full footnotes with links and access dates: Book 11, Chapters 01–03.",
]);
sourceSlide("Sources behind Module 2 — SCuBA, the tools, beyond M365", [
  "CISA BOD 25-01, Implementing Secure Practices for Cloud Services (Dec. 17, 2024); Required Configurations page; implementation guidance (updated July 27, 2026).",
  "CISA SCuBA project; ScubaGear repository, baselines, parameters, permissions and release 1.8.0 (May 7, 2026); PowerShell Gallery, ScubaGear 2.0.0-rc2 (Oct. 8, 2026); ScubaGoggles 1.0.0 and 1.0.1; ScubaConnect.",
  "CISA SCuBA control mappings to NIST SP 800-53 Rev. 5 (FedRAMP High).  ·  Microsoft Learn: What is the Zero Trust Assessment?; Get started with the Zero Trust Assessment.",
  "ZeroTrustAssessment GitHub repository: source, guide and release 3.1.0 (Oct. 20, 2026).",
  "NIST SP 800-53 Rev. 5: CM-8, SC-20, SC-21, SC-22.  ·  CISA BOD 23-01, Improving Asset Visibility and Vulnerability Detection on Federal Networks (Oct. 3, 2022).  ·  NVD, CVE-2024-37085.",
  "AWS, NIST SP 800-53 Rev. 5 in Security Hub CSPM.  ·  Microsoft Learn, NIST SP 800-53 Rev. 5 regulatory compliance built-in initiative.  ·  Broadcom, VMware Cloud Foundation security and compliance guidance.",
  "Broadcom, vCenter identity federation with Microsoft Entra ID; one external identity provider.  ·  FedRAMP Consolidated Rules for 2026.",
  "Full footnotes with links and access dates: Book 11, Chapters 04–06.",
]);
sourceSlide("Sources behind Module 3 — Owners; close before assessing", [
  "NIST SP 800-37 Rev. 2, Risk Management Framework: roles (Appendix D), authorizing official, common control providers, assessor independence.  ·  NIST SP 800-53 Rev. 5: CA-2, CA-7.",
  "CISA ZTMM v2.0 (adoption, risk acceptance not addressed, Governance).  ·  OMB M-22-09 (C-suite alignment; strategy implementation lead).  ·  OMB M-26-14 (logs for the top-level SOC).",
  "CISA BOD 25-01 and its implementation guidance (deviations, Omitted, reporting routes).  ·  CISA ScubaGear configuration file documentation (annotations, omissions, incorrect results) and permissions.",
  "ZeroTrustAssessment repository guide (roles, consent, telemetry).  ·  Microsoft Learn, Get started with the Zero Trust Assessment.",
  "SCuBA Exchange Online baseline (SPF, DMARC); ScubaGear 1.8.0 baselines (no DNSSEC policy).  ·  FedRAMP Key Security Indicators (46 indicators, ten themes).",
  "Full footnotes with links and access dates: Book 11, Chapters 07–08.",
]);
sourceSlide("Sources behind Module 4 — The run, evidence, the map", [
  "ScubaGear repository: dependencies, README, configuration file, reports and results schema; release v1.8.0; Invoke-SCuBADiff on the development branch; SCuBA control mappings.",
  "ZeroTrustAssessment repository: guide, status definitions, Connect-ZtAssessment source; release 3.1.0.  ·  Microsoft Learn: Zero Trust Assessment get started and glossary.",
  "Microsoft Graph national cloud deployments; government cloud feature availability.  ·  PyPI, the unrelated fmp package.  ·  CISA Logging Reference Architecture (Aug. 20, 2026).",
  "NIST OSCAL assessment-results and POA&M models.  ·  NIST SP 800-53 Rev. 5 (release 5.2.0): CA-5, CA-7, RA-7 and the controls in Appendix A; SP 800-53B Moderate profile.  ·  NIST SP 800-37 Rev. 2.",
  "OMB M-26-14 (Agency Logging Plan; six months searchable, one year retrievable).  ·  CISA BOD 25-01 and implementation guidance.  ·  CISA ZTMM v2.0 (Optimal stage).",
  "Full footnotes with links and access dates: Book 11, Chapters 09–10 and Appendix A.",
]);

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
