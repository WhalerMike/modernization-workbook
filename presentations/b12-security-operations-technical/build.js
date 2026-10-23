// Book 12 — Security Operations & Telemetry: the 50-minute TECHNICAL deep dive, in two parts and four modules.
//   Part 1 — Evidence and detection:           Module 1 (Ch02 + Ch03 the evidence contract and identity telemetry),
//                                               Module 2 (Ch04 + Ch05 platform and M365 telemetry to detection).
//   Part 2 — Findings and who acts on them:    Module 3 (Ch06 + Ch07 + Ch08 vulnerability, patch, baselines, posture),
//                                               Module 4 (Ch09 + Ch10 data protection and who runs security operations).
// Build:  node presentations/b12-security-operations-technical/build.js presentations/b12-security-operations-technical/B12_Security_Operations_Technical.pptx
// Every fact on a slide comes from a footnoted chapter of docs/books/b12-security-operations/; the notes name the chapter.
// Program recommendations are labeled "design guidance" and readings between sources "inference", as the book does.
// Defensive content only. The queries and scripts stay in the chapters, which mark them as illustrative.
// Narration: narration.json (spoken text, keyed by slide title) is read by presentations/_build/narrate.py (editor runs that).
const D = require("../_build/lib.js")({ book: "Book 12", title: "Security Operations & Telemetry — Technical Deep Dive" });
const { pres, HEX, txt, box, icon, tag, bullets, tableOpts, head, callout } = D;
const OUT = process.argv[2] || "B12_Security_Operations_Technical.pptx";
const fs = require("fs");
const path = require("path");

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
  txt(s, `${name} head`, runs, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.75 });
  const top = y + 0.15 + (label ? 0.25 : 0) + (heading ? 0.36 : 0) + 0.08;
  txt(s, `${name} list`, bullets(items, pt), { x: x + 0.2, y: top, w: w - 0.35, h: y + h - top - 0.08, paraSpaceAfter: 4 });
  const need = top + items.reduce((a, t) => a + lines(t, w - 0.6, pt) * pt / 72 * 1.2 + 0.06, 0);
  if (need > y + h + 0.02) console.warn(`  ! ${name} text may overflow its panel: needs ${need.toFixed(2)}, has ${(y + h).toFixed(2)}`);
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

// A committed diagram placed inside a box, keeping the PNG's aspect ratio (read from its header).
const DIAG = path.join(__dirname, "..", "..", "docs", "images", "diagrams", "b12-security-operations", "png");
const img = (s, name, alt, x, y, maxW, maxH) => {
  const file = path.join(DIAG, `${name}.png`);
  const b = fs.readFileSync(file);
  const ar = b.readUInt32BE(16) / b.readUInt32BE(20);
  let w = maxW, h = maxW / ar;
  if (h > maxH) { h = maxH; w = maxH * ar; }
  s.addImage({ path: file, x: x + (maxW - w) / 2, y, w, h, altText: alt });
  if (y + h > LIMIT + 0.01) console.warn(`  ! ${name} image runs into the Sources line: bottom ${(y + h).toFixed(2)}`);
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

const P1 = "Part 1 — Evidence and detection";
const P2 = "Part 2 — Findings and who acts on them";

// ================================================================== 1 Title
{
  const s = titleSlide("Orientation", "Security Operations: the technical deep dive", "Book 12 — Security Operations & Telemetry: evidence, detection, findings and owners");
  txt(s, "Session map", [
    { text: "Part 1 — Evidence and detection", options: { bold: true, color: HEX.navy, breakLine: true } },
    { text: "Module 1  The evidence contract and identity   ·   Module 2  Platform telemetry to detection", options: { color: HEX.ink, breakLine: true } },
    { text: "Part 2 — Findings and who acts on them", options: { bold: true, color: HEX.teal, breakLine: true } },
    { text: "Module 3  Vulnerability, patch and posture   ·   Module 4  Data protection and who runs it", options: { color: HEX.ink } },
  ], { x: 0.8, y: 4.75, w: 8.6, h: 1.5, fontSize: 15, paraSpaceAfter: 2 });
  notes(s,
`This is the technical deep dive for Book 12 of the Federal Modernization Workbook, Security Operations and Telemetry. It's for SOC engineers, detection engineers and security architects: the people who make every plane of the estate emit evidence, turn it into detections, and close findings with proof.

It runs in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is evidence and detection: the evidence contract and identity telemetry from Entra ID, then the Azure and Microsoft 365 audit planes and how Microsoft Sentinel and Defender XDR turn a log store into a detection engine. Part 2 is findings and who acts on them: vulnerability management under BOD 26-04, patch and configuration baselines and cloud posture, then data protection for CUI and who runs security operations.

The slides show tables, flows and decision matrices. The queries, templates and scripts live in the chapters, marked illustrative and untested against production; I'll point you to them rather than put code on screen. Where something is the program's own recommendation rather than a vendor or federal requirement, the slide says design guidance.`,
  "Book 12, index; Chapters 01–10.");
}

// ================================================================== 2 Why
{
  const s = content("Orientation", "Why this matters: a coverage gap looks like quiet");
  tag(s, "Why");
  subhead(s, "Planes head", "SIX PLANES MUST EMIT (DESIGN GUIDANCE)", 0.6, 1.5, 7.1);
  table(s, "Planes", 1.85, [1.6, 4.25, 1.25], ["Plane", "What it must emit (examples)", "Chapter"], [
    ["Identity", "Sign-ins, role changes, privileged activation, risk detections", "03"],
    ["Cloud platform", "Control-plane activity, resource logs, posture state", "04, 08"],
    ["Microsoft 365", "Unified audit: mailbox, file and administrative activity", "04"],
    ["Endpoints", "Process, file, network and sign-in events; tool alerts", "05, 07"],
    ["Network", "Flows, firewall and proxy decisions, DNS, remote access", "05"],
    ["Data", "Labeling events, DLP matches, sensitive-store access", "09"],
  ], { fontSize: 12, limit: 5.35 });
  panel(s, "Silent", 7.95, 1.5, 4.8, 3.7, HEX.red, HEX.redTint, "FOUR WAYS A GAP STAYS SILENT", null, [
    "Never connected: resource logs need a diagnostic setting on each resource",
    "Connected, not flowing: a green connector can mean only that a rule exists",
    "Collected, not analyzed: the Sentinel data lake tier runs no analytics rules",
    "Switched off: disabling logging is documented attacker behavior",
  ], 12.5);
  callout(s, "Alerts", 5.4, 1.1, "FaChartLine", HEX.amber, "M-26-14 scores alerts, not volume: ",
    "collection operations are scored by the share of the baseline with actionable alerts, from under 50% at Level 1 to 95% at Level 4.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AU-6, AU-12, SI-4); OMB M-26-14, App. B–C; Microsoft Learn — Sentinel data lake, resource logs, AWS connector; CISA cloud logs playbook. Book 12, Ch 01.");
  notes(s,
`Why this matters. Most agencies run a SIEM and can show an auditor millions of events a day. Every one of those numbers measures what arrived; none measures what didn't. Security operations fail most often not because an analyst missed an alert, but because the evidence never arrived and nothing said so.

NIST keeps two things apart that are easy to buy as one. AU-12 says generate audit records; AU-6 and SI-4 say review, analyze and detect. An agency can satisfy the first and fail the others. OMB M-26-14, which rescinded M-21-31 on May 22, 2026, scores collection operations by alerting: actionable alerts covering under half the minimum baseline at Level 1, at least 70 percent at Level 3, at least 95 percent at Level 4. Level 3 across all elements is due within 320 days of CISA's Logging Reference Architecture, published August 20, 2026, and a system scores at its lowest element.

The six planes are the program's model, design guidance; the activities each supports come from M-26-14's baseline. Gaps stay silent four ways. Azure resource logs aren't collected until each resource has a diagnostic setting. A Sentinel AWS connector's status means a collection rule exists, not that data was ingested. Logs sent only to the Sentinel data lake tier don't generate alerts, so, as an inference, such a source can meet retention while adding nothing to alerting. And CISA calls disabling logging well-documented attacker behavior. None of the four shows in what arrived; only a comparison with what was expected finds them.`,
  "Book 12, Chapter 01 — You Can't Defend What You Can't See, \"A warehouse is not a detection engine,\" \"The six planes that must emit,\" \"Why gaps stay silent.\"");
}
endModule("Orientation");

// ================================================================== 3 Module 1 divider
{
  const s = divider(P1, "Module 1: The evidence contract and identity", "Part 1 — Evidence and detection  ·  Chapters 02–03",
    ["One record shape, one join key and one queue for every finding", "Entra ID categories, tables and the tenant-scope setting from code", "Retention per table, proving emission, Graph as targeted evidence"], 12);
  notes(s,
`Module 1: the evidence contract and identity telemetry. A multi-cloud agency runs several management stacks, each reporting in its own schema against its own inventory. Their records can be stored together but not joined, so no one can say what's true about one asset across all of them.

The program's answer is a contract, not a console: one record shape, keyed to authoritative asset identity and time, landing in one queue. Then we apply it to identity, the first plane an attacker touches, where Entra ID keeps its own logs for only a month unless someone sends them somewhere.`,
  "Book 12, Chapter 02 — Telemetry Is the Precondition: The Evidence Contract; Chapter 03 — Identity Telemetry from Entra ID.");
}

// ================================================================== 4 Evidence contract fields
{
  const s = content(P1, "The evidence contract: eight fields, every source");
  tag(s, "What");
  table(s, "Fields", 1.5, [1.55, 4.8, 2.6], ["Field", "Meaning", "AU-3 element"], [
    ["asset_id", "Naming-plane name or address: the join key", "Where; object identity"],
    ["source", "The stack, appliance or agent that emitted it", "Source"],
    ["surface", "Cloud, network, OS, identity or data", "Where"],
    ["control", "The SP 800-53 control it evidences", "Type, as a control"],
    ["state", "Measured value: patch level, cipher, label", "What occurred"],
    ["verdict", "Pass, warn or fail against intended state", "Outcome"],
    ["observed_at", "When measured, in synchronized time", "When"],
    ["disposition", "Applied, accepted risk (POA&M) or open", "None: remediation status"],
  ], { fontSize: 12, limit: 5.5 });
  panel(s, "Envelope", 9.75, 1.5, 3.0, 3.95, HEX.navy, HEX.navyTint, "PROVENANCE ENVELOPE", "Design guidance", [
    "Issuer and source classification",
    "Chain of transformations",
    "Lineage hash",
    "Deterministic, sealed, reproducible bundles",
    "Drift findings are package artifacts",
  ], 12.5);
  callout(s, "ASIM", 5.6, 0.9, "FaTableList", HEX.teal, "ASIM helps, and stops short: ",
    "normalizing to it covers much of the contract, but it has no control, verdict or disposition, and no authoritative asset identity.");
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AU-3); OMB M-26-14, App. C (log management); Microsoft Learn — ASIM normalization. Field set and envelope are program design. Book 12, Ch 02.");
  notes(s,
`Coordination across stacks that don't share a vendor comes from a contract that fixes, before any data flows, what every record must say. The program's record has eight fields; the field set is design guidance.

AU-3 requires audit records to establish six things: event type, when, where, source, outcome, and the identity of the individuals, subjects or objects involved. The fields carry each one. asset_id is where and what. source and surface say what produced the record, on what kind of surface. control states the event type in control terms, the SP 800-53 control the record evidences. state is the measured value, verdict the outcome against the intended state, observed_at the time. disposition isn't an AU-3 element; it's the remediation status, where the closure rule lives. What the contract adds is uniformity: a patch record and a firewall record can be compared, joined and counted. Without a schema agreed in advance, no dashboard built afterward can recover one.

Every record also carries a provenance envelope: issuer, source classification, the chain of transformations and a lineage hash, with bundles sealed deterministically and reproducible from raw telemetry. Those are design positions; the nearest external anchor is M-26-14's Level 3 log management, logs encrypted in transit and at rest and regularly hashed for veracity.

The contract doesn't require one vendor's schema. Sentinel's ASIM is the same idea inside one SIEM, so one rule works across sources, and an agency can implement much of the contract by normalizing to ASIM and adding control, verdict and disposition. What ASIM can't supply is authoritative asset identity, which is next.`,
  "Book 12, Chapter 02 — The Evidence Contract, \"The contract: one record, every source.\"");
}

// ================================================================== 5 Join key
{
  const s = content(P1, "The join key: naming-plane identity plus observed time");
  tag(s, "How");
  panel(s, "Identity", 0.6, 1.5, 5.95, 2.95, HEX.navy, HEX.navyTint, "ASSET IDENTITY", "No stack's inventory ID is the key", [
    "ASIM's DvcId may be a Defender, Azure, Defender for IoT or AWS VPC ID",
    "Hostname as device ID: \"use it only as a last resort\"",
    "CM-8: all components, no duplicates, none from another system",
    "The CMDB reconciles to the naming plane; it isn't the key",
  ], 12.5);
  panel(s, "Time", 6.8, 1.5, 5.95, 2.95, HEX.teal, HEX.tealTint, "TIME", "observed_at, not arrival time", [
    "AU-8: UTC or a recorded offset; M-26-14: a traceable time source",
    "VPC flow logs without the start attribute: TimeGenerated is ingestion",
    "GuardDuty exports every six hours; TimeGenerated is update time",
    "Joining on arrival time matches the wrong records, with no error",
  ], 12.5);
  const inc = { text: "Included", options: { color: HEX.teal } };
  table(s, "Baseline", 4.62, [2.25, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 2.7], ["FedRAMP Rev. 5", "AU-3", "AU-8", "AU-6(1)", "AU-6(3)", "SI-4(16)", "CA-7", "AU-12(1) system-wide trail"], [
    ["Moderate baseline", inc, inc, inc, inc, inc, inc, { text: "High only; selected by design", options: { color: HEX.red, bold: true } }],
  ], { fontSize: 12, limit: 5.55 });
  callout(s, "Coverage", 5.68, 0.82, "FaListCheck", HEX.amber, "Coverage is a query: ",
    "join the naming plane's inventory, as a watchlist, to each plane's table; an expected asset with no record is a finding.");
  sources(s, "Sources: Microsoft Learn — ASIM common fields, device entity; AWS setup for Sentinel; NIST SP 800-53 Rev. 5 and SP 800-53B; FedRAMP Rev. 5 baseline; OMB M-26-14. Book 12, Ch 02.");
  notes(s,
`Putting records in one place isn't correlating them. Two records describe the same asset only if they carry the same asset_id, and every stack has its own. ASIM's DvcId can hold a Defender for Endpoint ID, an Azure resource ID, a Defender for IoT ID, an AWS VPC ID or vendor IDs, and Microsoft says to use the hostname only as a last resort. Each identifier is right inside its stack and meaningless outside it.

So the join key is the naming plane's authoritative name or address. CM-8 already asks for an inventory that includes all components, with no duplicate accounting and none assigned to another system; across stacks, that's the naming plane, which Books 08 and 10 build with IPAM and DDI. The CMDB reconciles to it.

Time is easier to get wrong. AU-8 needs UTC or a recorded offset, and M-26-14 a traceable time source. If AWS VPC flow logs use a custom format without the start attribute, TimeGenerated becomes the ingestion time; GuardDuty findings export every six hours by default, stamped with their update time. Correlate on arrival time and the pipeline joins the wrong records, with no error.

Identity plus time gives AU-12(1)'s system-wide, time-correlated trail. But AU-12(1) is in the High baseline only, in FedRAMP's workbook and NIST's SP 800-53B; at Moderate the program selects it by design. And coverage becomes a query: load the inventory as a Sentinel watchlist, join it to each plane's table, and every expected asset with no record is a finding.`,
  "Book 12, Chapter 02 — The Evidence Contract, \"The join key,\" \"Controls this chapter closes,\" \"Checking coverage against the inventory.\"");
}

// ================================================================== 6 One queue
{
  const s = content(P1, "One queue for every finding, and what closes it");
  tag(s, "What");
  table(s, "Streams", 1.5, [2.0, 2.6, 1.55, 2.4], ["Finding stream", "Typical source", "control", "Example verdict"], [
    ["Threat detection", "SIEM analytics, XDR", "SI-4, AU-6", "Rule matched; fail"],
    ["Vulnerability", "Scanner", "RA-5", "Present; fail"],
    ["Patch", "Update management", "SI-2", "Missing past due; fail"],
    ["Configuration", "Machine configuration, SCuBA", "CM-6", "Off baseline; warn or fail"],
    ["Cloud posture", "CSPM", "CM-6, CM-7, AC-3", "Resource exposed; fail"],
    ["Data protection", "DLP, classification", "AC-4, SC-28", "Labeled match; warn or fail"],
  ], { fontSize: 12, limit: 4.65 });
  panel(s, "Disposition", 9.4, 1.5, 3.35, 3.15, HEX.teal, HEX.tealTint, "DISPOSITION", "One closer", [
    "Applied: a later observation of the same asset shows the fix",
    "Accepted risk: the AO's POA&M reference",
    "Open: everything else",
  ], 12);
  panel(s, "Export", 0.6, 4.8, 5.95, 1.65, HEX.amber, HEX.amberTint, "DEFENDER FOR CLOUD CONTINUOUS EXPORT", null, [
    "Streams recommendations, secure score, alerts, compliance and attack paths",
    "Sends only on a health change: no new records isn't no open findings",
  ], 12);
  panel(s, "Membership", 6.8, 4.8, 5.95, 1.65, HEX.red, HEX.redTint, "QUEUE MEMBERSHIP CAN CHANGE SILENTLY", null, [
    "A built-in DLP alert-tuning rule (early October 2026) made signals behaviors",
    "They left the incident queue; disable the rule to keep them as alerts",
  ], 12);
  sources(s, "Sources: Microsoft Learn — Defender for Cloud continuous export; Investigate DLP alerts with Defender XDR (alert tuning note). Control mapping is program design. Book 12, Ch 02.");
  notes(s,
`Detection is one kind of finding. A missing patch, a known exploited vulnerability, configuration drift, a storage account open to the internet and a labeled file leaving the agency are all statements about an asset's state, against an intended state, at a time. In the program's design they're records of the same contract, in one queue. The control column is the program's mapping, design guidance, refined in Chapters 05 through 09.

The capability underneath is documented. Defender for Cloud's continuous export streams recommendations, secure score, alerts, regulatory compliance and attack paths to a workspace or event hub, with sub-recommendations per missing update and per vulnerability, landing in SecurityRecommendation and SecurityAlert. Two cautions: streaming export sends only when a resource's health state changes, so no new records doesn't prove no open findings; and the records carry the stack's own IDs until they're mapped to asset_id.

Data findings show how a queue loses a finding type silently. Purview DLP alerts have been routed to the Defender XDR incident queue. Microsoft now notes that a built-in alert tuning rule took effect in early October 2026, setting DLP signals as behaviors, so they no longer appear in the incident queue, though they stay in advanced hunting; an administrator disables the rule to keep them as alerts. Whether to keep it is a SOC tuning decision; the lesson is that queue membership has to be checked.

Disposition carries the closing rule: applied, when a later observation of the same asset shows the fix; accepted risk, with the authorizing official's POA&M reference; otherwise open. A resolved ticket or a suppressed alert closes nothing.`,
  "Book 12, Chapter 02 — The Evidence Contract, \"One queue for every finding.\"");
}

// ================================================================== 7 Entra categories
{
  const s = content(P1, "Entra ID: categories, tables and the tiers to enable");
  tag(s, "What");
  table(s, "Categories", 1.5, [3.25, 3.65, 1.3, 3.95], ["Category (diagnostic setting)", "Log Analytics table", "Tier", "What it captures"], [
    ["AuditLogs", "AuditLogs", "Core", "Application, group, user and license changes"],
    ["SignInLogs", "SigninLogs (lowercase i)", "Core", "Interactive sign-ins"],
    ["NonInteractiveUserSignInLogs", "AADNonInteractiveUserSignInLogs", "Core", "Token or code sign-ins on a user's behalf"],
    ["ServicePrincipalSignInLogs", "AADServicePrincipalSignInLogs", "Core", "Apps with certificates or client secrets"],
    ["ManagedIdentitySignInLogs", "AADManagedIdentitySignInLogs", "Core", "Managed identities"],
    ["ProvisioningLogs", "AADProvisioningLogs", "Core", "The Entra provisioning service"],
    ["MicrosoftGraphActivityLogs", "MicrosoftGraphActivityLogs", "Core", "Every Graph request against the tenant"],
    ["Four ID Protection categories", "AADRiskyUsers, AADUserRiskEvents, two SP tables", "High value", "Risk; needs ID Protection licensing"],
    ["MicrosoftServicePrincipalSignInLogs", "—", { text: "Off", options: { color: HEX.red, bold: true } }, "Preview; acting on it risks lock-out"],
  ], { fontSize: 11.5, limit: 5.3 });
  callout(s, "Streams", 5.42, 1.05, "FaUserShield", HEX.navy, "All four sign-in streams are core: ",
    "interactive sign-ins miss every token refresh, secret and managed identity. Manage volume by table plan, never by switching a stream off.");
  sources(s, "Sources: Microsoft Learn — identity logs you can stream; Sentinel Entra ID connector; ID Protection risk export; Graph activity logs. Tiers are program design. Book 12, Ch 03.");
  notes(s,
`Identity comes first because it's the join key for almost everything else, and its default misleads most. Entra ID records activity without any configuration, so the tenant looks instrumented. But with P1 or P2, audit and sign-in data is kept 30 days, seven on Free; Graph activity logs aren't kept unless routed; and an upgrade never recovers data that already expired. The fix is one tenant-level object, the Entra diagnostic setting.

The category you tick isn't always the table you query: most tables carry an AAD prefix, and SignInLogs lands in SigninLogs with a lowercase i. Rules and retention settings must name the table. The tiers are design guidance: Core carries AU-2, AU-3 and AU-12 evidence for every tenant; High value needs ID Protection licensing; Conditional categories, such as AD FS sign-ins, custom security attributes and Global Secure Access, produce data only when the feature is deployed. Microsoft recommends a separate destination for custom security attribute logs, so the program uses a separate workspace with narrower access.

Leave MicrosoftServicePrincipalSignInLogs off. Microsoft calls these preview logs high-volume and not essential for investigations, and warns that acting on them, for example by disabling applications, can cause tenant lock-out.

All four sign-in streams are core, because the three non-interactive ones are where unattended credentials work. Non-interactive and service-principal sign-ins can be five to ten times the interactive volume, and Microsoft estimates Graph activity at about 15 GiB a month for 1,000 users and 1,200 GiB for 100,000. Manage volume with table plans and transformations, never by leaving a stream off, and route Graph activity to the same workspace as sign-ins.`,
  "Book 12, Chapter 03 — Identity Telemetry from Entra ID, \"The log categories and their tables,\" \"Why all four sign-in streams are core.\"");
}

// ================================================================== 8 Deploy from code, retention
{
  const s = content(P1, "Deploy from code; set retention in the workspace");
  tag(s, "How");
  panel(s, "Deploy", 0.6, 1.5, 5.95, 3.45, HEX.navy, HEX.navyTint, "THE TENANT-SCOPE SETTING", "microsoft.aadiam/diagnosticSettings", [
    "API version 2017-04-01; tenant scope only, by Bicep or az rest",
    "Security Administrator; the setting's name can't be changed later",
    "Keep the category list in the repository as the logged-event list",
    "Commit the GET output with every change; compare on a schedule",
  ], 12.5);
  table(s, "Retention", 1.5, [1.85, 1.75, 2.35], ["Setting", "Value", "Why"], [
    ["Analytics retention", "At least 180 days", "M-26-14 searchable"],
    ["Total retention", "At least 365 days", "Retrievable, by search job"],
    ["Table plan", "Analytics; Basic only for hunted volume", "Cost by plan, not omission"],
  ], { x: 6.8, fontSize: 12, limit: 3.48 });
  table(s, "Clouds", 3.5, [1.2, 2.65, 2.1], ["Cloud", "Resource Manager", "Microsoft Graph"], [
    ["GCC", "management.azure.com", "graph.microsoft.com"],
    ["GCC High", "management.usgovcloudapi.net", "graph.microsoft.us"],
    ["DoD", "management.usgovcloudapi.net", "dod-graph.microsoft.us"],
  ], { x: 6.8, fontSize: 11.5, limit: 4.95 });
  callout(s, "Retain", 5.15, 1.3, "FaTriangleExclamation", HEX.red, "The retention block does nothing: ",
    "diagnostic-settings storage retention was disabled on September 30, 2025. Set retention per table; a cut to total retention waits 30 days.");
  sources(s, "Sources: Microsoft Learn — ARM reference microsoft.aadiam 2017-04-01; storage-retention migration; Log Analytics retention; Graph national clouds; OMB M-26-14, App. B. Book 12, Ch 03.");
  notes(s,
`A setting someone clicked once has no source of truth, no review trail and no drift detection. FedRAMP's 2026 indicators include KSI-MLA-EVC, configurations, especially infrastructure as code, continuously evaluated, and KSI-MLA-LET, a current list of the event types logged. So the program, as design guidance, deploys the Entra setting from code, keeps the category list in the repository as that list, and compares the deployed setting against it on a schedule.

Entra diagnostic settings are the Resource Manager type microsoft.aadiam/diagnosticSettings, API version 2017-04-01, deployable only at tenant scope, by tenant-scope Bicep or az rest. You need Security Administrator, the destination must exist first, and the name can't be changed later. A GET on the same path returns the deployed categories; commit that output with each change, so the evidence carries the deployed setting, not just the template.

The schema still has a retentionPolicy block. Leave it out: Microsoft disabled all diagnostic-settings storage retention on September 30, 2025, so any value there has no effect. Storage retention is a lifecycle policy now, and Log Analytics retention is set per table.

M-26-14's floor is six months searchable, usable immediately, and a year retrievable, usable after a step such as a search job. A workspace maps onto that: analytics retention up to two years, total retention up to twelve, a default of thirty days. The program sets at least 180 and 365 days on every identity table. Shortening total retention takes effect only after 30 days; lengthening applies to existing data. Endpoints follow the Microsoft 365 environment: GCC keeps worldwide endpoints, while GCC High and DoD use Azure Government's.`,
  "Book 12, Chapter 03 — Identity Telemetry, \"Path B,\" \"Path C,\" \"Retention: what the logging baseline asks for,\" \"Sovereign clouds.\"");
}

// ================================================================== 9 Verify and Graph
{
  const s = content(P1, "Prove emission, and use Graph as a magnifying glass");
  tag(s, "How");
  panel(s, "Verify", 0.6, 1.5, 5.95, 4.95, HEX.teal, HEX.tealTint, "AT 24 AND 72 HOURS, THEN DAILY", "Name the tables you expect", [
    "union isfuzzy=true over an explicit list, so a missing table can't break the query",
    "MISSING: never enabled, a different workspace, or nothing to report",
    "STALE: emission worked, then stopped; wide queries hide it",
    "Record expected-quiet exceptions for risk and provisioning tables",
    "First data can take up to three days; Graph activity usually 30 minutes",
    "One setting of record, from code; check for duplicate settings",
  ], 12.5);
  table(s, "Graph", 1.5, [2.9, 3.05], ["Graph auditLogs call", "What to know"], [
    ["v1.0 directoryAudits", "Directory audit history; AuditLog.Read.All"],
    ["v1.0 signIns", "Interactive and federated only; 1,000 a page"],
    ["beta signIns with signInEventTypes", "The three non-human streams; beta, not for production"],
    ["Any pull", "Only what Entra still holds: 30 days with P1 or P2"],
  ], { x: 6.8, fontSize: 12, limit: 4.25 });
  panel(s, "Omitted", 6.8, 4.4, 5.95, 2.05, HEX.red, HEX.redTint, "SILENTLY OMITTED FROM SIGN-IN PULLS", null, [
    "appliedConditionalAccessPolicies is dropped unless the caller can read Conditional Access",
    "Grant Policy.Read.ConditionalAccess to every evidence app that reads sign-ins",
  ], 12);
  sources(s, "Sources: Microsoft Learn — configure Entra diagnostic settings; KQL union isfuzzy; Graph List signIns, directoryAudits; analyze activity logs with Graph. Book 12, Ch 03.");
  notes(s,
`A setting that saved without error isn't proof that logs arrive. The program runs a completeness query 24 and 72 hours after any change, then daily. It compares an explicit list of expected tables with what arrived, so a table that never received data appears as MISSING instead of vanishing from the results. A union with isfuzzy set to true lets it run when a named table doesn't exist yet.

MISSING means never enabled, enabled against another workspace, or, for the risk tables, nothing to report; check the deployed setting before concluding. STALE is more dangerous: emission worked and then stopped, and wide queries keep returning old data that hides the gap. Quiet tenants may produce no provisioning or risk events in a week, so record an expected-quiet exception rather than lowering the bar for sign-ins. Microsoft says logs can take up to three days to appear; Graph activity usually takes thirty minutes. The tenant setting deployed from code stays the control of record, and you check for duplicate settings.

Microsoft Graph's auditLogs APIs answer "show me this specific thing." Microsoft says the API isn't designed for pulling large amounts of activity data, and it returns only what Entra still holds, thirty days with P1 or P2. The v1.0 signIns endpoint returns interactive and federated sign-ins; the three non-human streams appear only in beta, with a signInEventTypes filter. So the workspace is the evidence of record.

One trap for AC-2 and AC-6 evidence: appliedConditionalAccessPolicies is silently left out unless the caller can read Conditional Access. Grant Policy.Read.ConditionalAccess to every evidence app that reads sign-ins, and always bound the time range.`,
  "Book 12, Chapter 03 — Identity Telemetry, \"Verify emission,\" \"Microsoft Graph: targeted evidence, not the feed.\"");
}
endModule("Module 1");

// ================================================================== 10 Module 2 divider
{
  const s = divider(P1, "Module 2: Platform telemetry to detection", "Part 1 — Evidence and detection  ·  Chapters 04–05",
    ["Azure activity and resource logs, kept on by Azure Policy", "The Microsoft 365 unified audit log and its retention tiers", "Sentinel rules, connector paths, health checks and Defender XDR"], 13);
  notes(s,
`Module 2: from platform telemetry to detection. The Entra setting doesn't touch the next two pipelines. Azure resource activity has its own diagnostic settings, and Microsoft 365 workload activity lives in the unified audit log, behind its own API. Perfect identity telemetry can still leave you blind inside subscriptions and mailboxes.

Then the second half asks what all that data is for. Logs no rule reads are a record of what happened to you, not a defense against it. The control is the rule that fires, the incident it opens and the closure someone can show.`,
  "Book 12, Chapter 04 — Azure Platform and Microsoft 365 Audit Telemetry; Chapter 05 — From Log Warehouse to Detection: SIEM and XDR.");
}

// ================================================================== 11 Activity and resource logs
{
  const s = content(P1, "Azure: the activity log and resource logs");
  tag(s, "What");
  table(s, "Planes", 1.5, [2.15, 5.0, 5.0], ["", "Activity log (control plane)", "Resource logs (data plane)"], [
    ["By default", "Collected; kept 90 days, then deleted", "Not collected: one diagnostic setting per resource"],
    ["Records", "Create, update, delete and action; RBAC changes; typically not reads", "Operations inside a resource, such as reading a Key Vault secret"],
    ["Export", "az monitor diagnostic-settings subscription create, or subscription-scope Bicep", "allLogs category group, sent to resource-specific tables"],
    ["Cost, limits", "No ingestion charge; enable all eight categories", "Up to five settings per resource; \"not completely lossless\""],
    ["Traps", "New-AzDiagnosticSetting can't export it; management-group settings miss events", "Exclude logging storage and event hubs from bulk scripts; delete settings with the resource"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Specific", 5.15, 1.3, "FaTableList", HEX.amber, "Resource-specific tables, not AzureDiagnostics: ",
    "the shared table hits the 500-column limit and moves fields into AdditionalFields, where a rule on a named column silently stops matching.");
  sources(s, "Sources: Microsoft Learn — Activity log; activity log schema; diagnostic settings; resource logs; AzureDiagnostics table; az monitor diagnostic-settings subscription. Book 12, Ch 04.");
  notes(s,
`Two Azure planes, two mechanisms. Export only the activity log and you can prove a key vault was created, but not who read its secrets.

The activity log records control-plane operations. Azure collects it by default, keeps it ninety days and doesn't typically capture reads. Export has no ingestion charge, lands in AzureActivity, and keeps the only record of who created a resource. Administrative is where every Azure RBAC change is recorded, the AC-2 and AC-6 evidence for Azure; the program enables all eight categories. Use the subscription form of the CLI or a subscription-scope template; Microsoft says New-AzDiagnosticSetting can't be used for the activity log. A management-group setting doesn't capture every subscription event, because events without the hierarchy property never propagate up, so the program sets both and deduplicates at query time with a hash of all fields.

Resource logs record operations inside a resource. They aren't collected by default; each resource needs its own setting, up to five, and Microsoft says they aren't completely lossless. Use the allLogs category group, which picks up categories added later.

Send them to resource-specific tables. Every table is limited to 500 columns, and AzureDiagnostics, the superset table, hits that first: fields move into AdditionalFields, and a rule on a named column silently stops matching. Decide once and apply everywhere. Two traps: scripts can create the self-reference loop the portal blocks, and a re-created resource can inherit an old setting.`,
  "Book 12, Chapter 04 — Azure Platform and Microsoft 365 Audit Telemetry, Parts 1 and 2.");
}

// ================================================================== 12 Azure Policy
{
  const s = content(P1, "Azure Policy keeps new resources emitting, not old ones");
  tag(s, "How");
  flow(s, "Policy", 1.5, 1.95, [
    { head: "Assign", body: "Activity log policy and the allLogs initiative (140 policies) at the top management group" },
    { head: "New resource", body: "After a successful create or update, DINE waits 10 minutes, then deploys" },
    { head: "Evaluate", body: "Existing resources are only marked non-compliant; nothing deploys", color: HEX.red, tint: HEX.redTint },
    { head: "Remediate", body: "One task per policy; 500 resources by default, up to 50,000" },
    { head: "Compare", body: "Compliant count against the resource inventory: the coverage metric" },
  ], 12);
  panel(s, "Identity", 0.6, 3.65, 5.95, 2.8, HEX.amber, HEX.amberTint, "THE ASSIGNMENT'S MANAGED IDENTITY", null, [
    "Needs the roles in the definition's roleDefinitionIds",
    "The portal grants them; SDK, template and pipeline assignments must grant them by hand",
    "Changing a definition doesn't update the identity's roles",
    "Management-group assignments: remediation tasks only after evaluation",
  ], 12.5);
  panel(s, "Liveness", 6.8, 3.65, 5.95, 2.8, HEX.teal, HEX.tealTint, "LIVENESS IS NOT COVERAGE", null, [
    "AzureActivity by subscription and category; stale after 6 hours",
    "List subscriptions with no activity-log setting directly",
    "AzureDiagnostics by resource type is the migration backlog",
    "Only policy compliance against the inventory shows coverage",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Azure Policy built-ins for Azure Monitor; built-in initiatives; deployIfNotExists effect; remediate non-compliant resources; AzureActivity. Book 12, Ch 04.");
  notes(s,
`What exists today is configured; a resource created tomorrow is born silent unless policy makes emission a property of the platform. The built-ins cover both planes: an activity-log policy, and initiatives for allLogs resource logging, 140 policies, and the audit group, 69. The program assigns the activity-log policy and the allLogs initiative at the top management group.

Here's where DeployIfNotExists stops. It acts when a resource provider handles a create or update and returns success, waits ten minutes by default, and deploys if the setting is missing. During a regular compliance evaluation it only marks resources non-compliant. Existing resources are fixed only by a remediation task. The common failure: the initiative is assigned, new resources comply, the dashboard trends green, and everything older emits nothing.

Remediation tasks have limits. One task covers one DINE policy, so a 140-policy initiative needs a task per non-compliant policy, each covering 500 resources by default and up to 50,000. For management-group assignments, tasks come after evaluation. The assignment's managed identity needs the definition's roles: the portal grants them, but SDK, template and pipeline assignments must grant them by hand, and changing a definition doesn't update them.

The program's sequence: assign, wait for evaluation, run a task per policy, then compare the compliant count with the inventory. That comparison is its answer to KSI-MLA-EVC and KSI-MLA-LET. Liveness queries prove something arrives, but they can't show a subscription that never sent anything, so list the subscriptions with no export directly.`,
  "Book 12, Chapter 04 — Platform Telemetry, \"Part 3: enforce emission with Azure Policy,\" \"Verify Azure emission.\"");
}

// ================================================================== 13 Unified audit log
{
  const s = content(P1, "The unified audit log: verify, collect, deduplicate");
  tag(s, "How");
  img(s, "ch04-audit-collector-loop", "The Management Activity API collector loop: start each subscription once per content type, waiting 15 minutes between start requests, with first content taking up to 12 hours; on every run, list available content in windows of 24 hours or less by availability time, following NextPageUri to the end; fetch each blob within 7 days with PublisherIdentifier on every call; deduplicate on contentId and record Id and write to the workspace; then re-list a trailing window, because events arrive out of order. An outage longer than 7 days is a permanent gap.", 0.6, 1.5, 6.0, 3.85);
  txt(s, "Detect", [
    { text: "Detect it: ", options: { bold: true, color: HEX.red } },
    { text: "the program treats Set-AdminAuditLogConfig as high severity, because turning auditing off blinds everything after it." },
  ], { x: 0.6, y: 5.5, w: 6.0, h: 0.95, fontSize: 13.5, valign: "middle" });
  table(s, "Rules", 1.5, [1.95, 4.0], ["Rule", "What breaks without it"], [
    ["Check in Exchange Online", "In Security & Compliance PowerShell the flag always reads False"],
    ["15-minute spacing", "Start requests are throttled; first content can take 12 hours"],
    ["24-hour windows", "Selected by availability (contentCreated), at most 7 days back"],
    ["Fetch within 7 days", "A longer collector outage is a permanent gap"],
    ["Deduplicate on Id", "Blobs arrive out of order; duplicates are by design"],
    ["GCC host", "manage-gcc.office.com, though GCC Graph is worldwide"],
    ["PublisherIdentifier", "Without it, one shared global throttling quota"],
  ], { x: 6.8, fontSize: 12, limit: 6.5 });
  sources(s, "Sources: Microsoft Learn — Turn auditing on or off; Office 365 Management Activity API reference, FAQ and schema; Search-UnifiedAuditLog. Book 12, Ch 04.");
  notes(s,
`The unified audit log covers Exchange, SharePoint, OneDrive, Entra ID, Teams, Power BI and more, and it's the plane most often assumed rather than checked. Microsoft says auditing is on by default but tells administrators to verify it; it's off by default for Business Basic, Standard and Premium. Check with Get-AdminAuditLogConfig in Exchange Online PowerShell; in Security and Compliance PowerShell the property is always False, even when auditing is on. With auditing off, neither the API nor Sentinel can reach audit data, so the program treats Set-AdminAuditLogConfig as a high-severity detection.

The collector is an Entra app with permission to read activity data. GCC differs here even though it matches worldwide elsewhere: Graph uses worldwide endpoints, but this API has its own manage-gcc host, and GCC High and DoD have their own too. You subscribe per tenant to five content types: Entra ID, Exchange, SharePoint, General, which includes Teams, and DLP. PublisherIdentifier is the collector author's tenant GUID; without it, calls share one global throttling quota.

The rules that break first-time collectors: wait fifteen minutes between start requests, and allow twelve hours for first content. List content in windows of 24 hours or less, no more than seven days back, selected by when content became available, not when events happened. Follow NextPageUri to the end. Content is fetchable for seven days, so a longer outage is a permanent gap. Events arrive out of order and duplicates are by design, so track each contentId, deduplicate on the record Id, and re-list a trailing window every run.`,
  "Book 12, Chapter 04 — Platform Telemetry, \"Part 4: the Microsoft 365 unified audit log,\" Steps 1–5.");
}

// ================================================================== 14 UAL retention
{
  const s = content(P1, "Unified audit retention follows the user's license");
  tag(s, "Who");
  table(s, "Tiers", 1.5, [3.35, 4.6], ["Tier", "Retention"], [
    ["Audit (Standard)", "180 days for records from October 17, 2023 on (90 days before)"],
    ["Audit (Premium), default policy", "One year for Entra ID, Exchange, OneDrive and SharePoint; not modifiable"],
    ["Audit (Premium), other workloads", "180 days unless a custom policy sets longer"],
    ["Premium plus 10-Year add-on", "Up to 10 years, per licensed user"],
    ["Non-user entities", "A fixed one year; custom policies don't apply"],
  ], { fontSize: 12, limit: 4.4 });
  panel(s, "Split", 8.8, 1.5, 3.95, 4.95, HEX.red, HEX.redTint, "THE SPLIT NO DASHBOARD SHOWS", null, [
    "Non-E5 and guest users: 180 days",
    "A shorter custom policy shortens licensed users too",
    "Over 180 days needs the acting user's license",
    "Policies aren't retroactive",
    "Record the license map in the SSP",
  ], 12.5);
  panel(s, "Both", 0.6, 4.55, 7.95, 1.9, HEX.teal, HEX.tealTint, "THE PROGRAM RUNS BOTH (DESIGN GUIDANCE)", null, [
    "Sentinel Microsoft 365 connector: Exchange, SharePoint and Teams into OfficeActivity, free to ingest",
    "Management Activity API collector: the full feed, Audit.General and DLP.All included, into the agency's workspace",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — audit log retention policies; auditing solutions; Purview service description and GCC plans; OfficeActivity; Sentinel billing. Book 12, Ch 04.");
  notes(s,
`Turning on the unified audit log doesn't by itself meet M-26-14's six months searchable and a year retrievable. How long Microsoft keeps a record depends on the license of the user who acted, and on audit retention policies.

Audit Standard keeps records 180 days for anything generated from October 17, 2023, ninety days before that. Audit Premium's default policy keeps a year for Entra ID, Exchange, OneDrive and SharePoint, and it can't be modified; other workloads get 180 days unless a custom policy sets longer. The ten-year add-on extends that per licensed user, and non-user entities, service principals and system events, get a fixed year.

The trap: the one-year default applies only to users with an E5-level license. Microsoft says non-E5 and guest users are retained for 180 days. Federal tenants are rarely uniformly licensed, so most have a split horizon that no dashboard shows. A shorter custom policy shortens licensed users too, retention past 180 days needs the acting user's license, and policies aren't retroactive.

So the program's position, design guidance, is that the Purview tier isn't the evidence store. A Management Activity API collector writes every record to the agency's own workspace at the M-26-14 baseline, and the licensing split goes in the system security plan. Sentinel's Microsoft 365 connector adds Exchange, SharePoint and Teams to OfficeActivity, free to ingest, but not every workload, so run both. Verify twice: the workspace shows the SIEM receiving; a tenant-side search shows the tenant recording.`,
  "Book 12, Chapter 04 — Platform Telemetry, \"Retention: the tier that decides the evidence,\" \"Microsoft Sentinel ingestion,\" \"Verify Microsoft 365 emission.\"");
}

// ================================================================== 15 Warehouse vs engine
{
  const s = content(P1, "From warehouse to detection: the MTTD floor");
  tag(s, "What");
  table(s, "Engine", 1.5, [2.05, 2.35, 2.75], ["Property", "Log warehouse", "Detection engine"], [
    ["Runs on a schedule", "Ingestion only", "Analytics rules over lookback windows"],
    ["An attack pattern appears", "Nothing until someone queries", "A rule fires; an incident opens"],
    ["Who decides what to look for", "Whoever queries", "A versioned, reviewed rule library"],
    ["Record of review", "Query history, if kept", "Rule, evidence, owner, actions, closure"],
  ], { fontSize: 12, limit: 4.0 });
  table(s, "Floor", 1.5, [1.5, 3.35], ["Rule type", "What bounds detection time"], [
    ["Scheduled", "Interval and lookback 5 minutes to 14 days; runs 5 minutes late"],
    ["NRT", "Every minute on a 2-minute delay; 50 per workspace; sources under 12 hours late"],
    ["Behavioral", "Slower by design: the baseline must exist first"],
  ], { x: 7.9, fontSize: 12, limit: 4.0 });
  panel(s, "Rule", 0.6, 4.15, 12.15, 2.3, HEX.navy, HEX.navyTint, "DESIGN GUIDANCE", null, [
    "No source counts as monitored until an enabled rule reads it, and no rule counts until its output reaches an owned incident queue",
    "MTTD: incident CreatedTime minus FirstActivityTime from SecurityIncident (latest row per incident), read as a lower bound",
    "Every incident's evidence record has four parts: alert record, linked ticket, timestamped response notes, closure determination",
  ], 12.5);
  sources(s, "Sources: NIST SP 800-53 Rev. 5 (AU-6, SI-4); OMB M-26-14; Microsoft Learn — scheduled and NRT analytics rules; SecurityIncident table. Book 12, Ch 05.");
  notes(s,
`AU-6 has three parts: review and analyze records at a defined frequency for indications of unusual activity, report findings to defined roles, and adjust review when risk changes. All three are continuing activities. None names a product, but each implies a frequency, an output and a recipient. A workspace with every rule disabled pending tuning can show storage; it can't show analysis.

The difference is behavior, not product. A Log Analytics workspace alone is a warehouse; Sentinel's rules, incidents and automation make it a detection engine. The design rule: no source counts as monitored until an enabled rule reads it, and no rule counts until its output reaches an incident queue someone owns.

What can be stated precisely is the floor. A scheduled rule's interval and lookback each run from five minutes to fourteen days, and Sentinel runs it five minutes late to allow for ingestion. An NRT rule runs every minute on a two-minute delay, at most fifty per workspace, and only on sources under twelve hours late. So a scheduled rule's fastest alert is its interval plus five minutes plus source latency; an NRT rule's, about three minutes plus latency. Behavioral detections are slower by design.

MTTD is measurable once incidents exist: take the latest SecurityIncident row per incident and subtract FirstActivityTime from CreatedTime, as a lower bound. And prepare for the assessor's usual request, practitioner experience rather than a published procedure: an alert from the last thirty days, its incident and what was done, as a four-part record of alert, ticket, response notes and closure determination.`,
  "Book 12, Chapter 05 — From Log Warehouse to Detection, \"What AU-6 requires,\" \"Warehouse versus detection engine,\" \"Mean time to detect,\" \"The assessor evidence standard.\"");
}

// ================================================================== 16 Connector paths
{
  const s = content(P1, "Connector paths, and the table each one lands in");
  tag(s, "How");
  table(s, "Paths", 1.5, [1.7, 3.3, 3.45, 3.7], ["Source", "Path", "Lands in", "Watch for"], [
    ["Entra ID", "Entra diagnostic settings", "SigninLogs, AuditLogs, risk tables", "P1 or P2 for sign-ins; ResultType is a string; MfaDetail deprecated"],
    ["Defender XDR", "Connector; on automatically in the Defender portal", "SecurityIncident, SecurityAlert; streamed Device and Identity tables", "No vulnerability table streams; stream only what rules join"],
    ["DNS, DDI, SASE", "Syslog or CEF to a Linux forwarder running AMA", "Syslog, CommonSecurityLog; read through _Im_Dns", "TimeGenerated is forwarder time; EventTime uses its time zone"],
    ["SQL audit", "Azure SQL to Log Analytics; SQL Server to the Security log", "AzureDiagnostics (SQLSecurityAuditEvents); SecurityEvent", "Event 33205: confirm on a test instance first"],
    ["Threat intel", "TAXII 2.0 and 2.1 connector", "ThreatIntelIndicators, ThreatIntelObjects", "Legacy table unwritten since July 31, 2025"],
  ], { fontSize: 11.5, limit: 5.3 });
  callout(s, "Portal", 5.45, 1.0, "FaCloud", HEX.navy, "Plan in the Defender portal: ",
    "after March 31, 2027 Sentinel is supported only there. The Defender XDR connector isn't listed for DoD: confirm before designing on it.");
  sources(s, "Sources: Microsoft Learn — Sentinel in the Defender portal; feature availability; Entra ID, XDR, Syslog and CEF via AMA connectors; ASIM DNS; SQL audit; threat intel. Book 12, Ch 05.");
  notes(s,
`Two platform facts shape every connector decision. After March 31, 2027 Sentinel will be supported only in the Defender portal, where Microsoft says all generally available Sentinel features are in commercial, GCC, GCC High and DoD, with previews in commercial only. And the workspace's cloud decides which availability column applies: Repositories and the peer and blast-radius UEBA enrichments aren't in Azure Government. Microsoft's government page lists the Defender XDR connector as unavailable for DoD, which conflicts with the portal statement; until that's reconciled, a DoD tenant confirms it in its own portal.

Entra ID lands sign-ins, audit, the non-human streams, provisioning, Graph activity and risk tables; sign-ins need P1 or P2. In SigninLogs, ResultType is a string with zero for success, and MfaDetail is deprecated in favor of AuthenticationDetails. Defender XDR brings incidents and alerts and can stream hunting tables, all generally available in the government clouds; no vulnerability table streams, so exploitation surfaces as a Defender alert. Stream only what your rules join.

Appliances use a Linux forwarder running the Azure Monitor Agent: syslog into Syslog, CEF into CommonSecurityLog. TimeGenerated reflects the forwarder, and EventTime uses the forwarder's time zone, which matters to the join on time. Write DNS rules against the ASIM parser, not a vendor table, so they survive a platform change. SQL audit differs by location: Azure SQL writes to AzureDiagnostics; SQL Server can target the Windows Security log, which Microsoft calls appropriate for high-security environments, as event 33205, to be confirmed on a test instance. Threat intelligence now lands in ThreatIntelIndicators; the legacy table stopped receiving data after July 31, 2025.`,
  "Book 12, Chapter 05 — From Log Warehouse to Detection, \"Microsoft Sentinel connector architecture.\"");
}

// ================================================================== 17 Health and XDR division
{
  const s = content(P1, "Prove connectors deliver; split the work with XDR");
  tag(s, "Who");
  panel(s, "Health", 0.6, 1.5, 5.95, 4.95, HEX.teal, HEX.tealTint, "PROVE EVERY SOURCE IS STILL DELIVERING", null, [
    "SentinelHealth covers a subset: AWS, Office 365, Defender for Endpoint, TAXII and CCF connectors",
    "It doesn't cover the Entra diagnostic-settings path or syslog and CEF forwarders",
    "Freshness check: each table's last event against its allowed silence (design guidance)",
    "Per-device view: a table can be fresh while one appliance behind it is quiet",
    "Run the check as a scheduled rule, so a stale source opens an incident",
  ], 12.5);
  table(s, "Division", 1.5, [1.95, 4.0], ["Who (design guidance)", "Covers"], [
    ["Defender XDR", "What its sensors see: endpoints, on-premises identity, email, cloud apps"],
    ["Sentinel rules", "What Defender can't: DNS and DDI, SASE, SQL audit, other clouds, cross-source joins"],
    ["Custom detections", "Rules that read only Defender tables; confirm in your cloud"],
    ["Raw streaming", "Only the hunting tables Sentinel rules join"],
  ], { x: 6.8, fontSize: 12, limit: 4.15 });
  panel(s, "Disrupt", 6.8, 4.3, 5.95, 2.15, HEX.red, HEX.redTint, "AUTOMATIC ATTACK DISRUPTION", null, [
    "Revokes sessions, suspends users, contains devices, acts on OAuth apps",
    "Logged in the Action Center, reversible, with exclusions",
    "Reconcile it with the program's actuation ladder (Chapter 11)",
  ], 12);
  sources(s, "Sources: Microsoft Learn — Monitor data connector health; Defender XDR streaming event types; automatic attack disruption and exclusions; NRT rules (custom detections). Book 12, Ch 05.");
  notes(s,
`A connector that silently stops is worse than one never configured, because the program believes it's monitored. SentinelHealth records connector health for only a subset: AWS, Office 365, Defender for Endpoint, TAXII and threat intelligence platforms, and Codeless Connector Framework connectors. It doesn't cover the Entra diagnostic-settings path or syslog and CEF forwarders.

For everything else, check the data: compare each dependent table's last event with the longest silence it's allowed. The thresholds are design guidance and live in the rule library beside the rules that depend on each table. Add a per-device view, because CommonSecurityLog can be fresh while one firewall behind the forwarder has gone quiet. Run the check as a scheduled rule that opens an incident, so connector failure enters the same queue as everything else, and export it with a date for evidence.

Defender XDR and Sentinel overlap, and a program that doesn't divide the work pays twice and triages twice. With Sentinel in the Defender portal, Defender creates incidents from Sentinel alerts too, and a rule's incident-creation setting must stay on. The division of labor is design guidance: Defender detects what its sensors see; Sentinel rules cover DNS and DDI, SASE, SQL audit, other clouds and cross-source joins; rules that read only Defender tables become custom detections, which Microsoft now recommends for new rules; and raw streaming is selective.

Automatic attack disruption acts on its own: revoking sessions, suspending users, containing devices, acting on OAuth apps, every action logged, reversible and with exclusions. That's autonomous vendor response, and Chapter 11 reconciles it with the program's actuation ladder.`,
  "Book 12, Chapter 05 — From Log Warehouse to Detection, \"Proving the connectors still deliver,\" \"User and entity behavior analytics,\" \"What Defender XDR contributes.\"");
}
endModule("Module 2");

// ================================================================== 18 Module 3 divider
{
  const s = divider(P2, "Module 3: Vulnerability, patch and posture", "Part 2 — Findings and who acts on them  ·  Chapters 06–08",
    ["BOD 26-04's remediation clock and the daily KEV-joined queue", "Native actuation, one record, and baselines that record drift", "Cloud posture per platform and Kubernetes admission control"], 13);
  notes(s,
`Module 3: vulnerability, patch and posture. A vulnerability program is judged by one record: which flaw, on which asset, found when, due when, fixed when, and whether the fix beat the clock. Assessors probe three failures: a stale inventory that yields a clean report on a partial estate, CVSS buckets that ignore exploitation, and an agency that can show a scan and a policy but not that record.

Since June 2026 the federal rule puts exploitation and exposure first. Then we hand the queue to the platforms that fix things, and finish with the cloud control plane.`,
  "Book 12, Chapter 06 — Vulnerability Management; Chapter 07 — Patch, Configuration and Hardening Baselines; Chapter 08 — Cloud-Native Posture.");
}

// ================================================================== 19 BOD 26-04
{
  const s = content(P2, "BOD 26-04: four questions set the remediation clock");
  tag(s, "Why");
  img(s, "ch06-remediation-clock", "The BOD 26-04 remediation clock: one CVE on one asset is checked against four questions, publicly exposed from the agency exposure tag, in the KEV catalog from the CISA feed, automatable from CISA Vulnrichment with no when absent, and technical impact partial or total from Vulnrichment with total when absent. The answers map to five outcomes in Appendix A: 3 days and forensic triage for rows 1, 3 and 9; 3 days for rows 2 and 5; 14 days for rows 4, 6, 7, 10, 11 and 12; 60 days for rows 8, 13 and 14; and fix on system upgrade for rows 15 and 16. The deadline starts at KEV listing or first detection, whichever is earlier, and is a maximum the agency may shorten.", 0.6, 1.5, 6.6, 4.95);
  panel(s, "Rules", 7.45, 1.5, 5.3, 4.95, HEX.red, HEX.redTint, "ISSUED JUNE 10, 2026", "Revokes BOD 22-01 and BOD 19-02", [
    "The clock starts at KEV listing or first detection, whichever is earlier",
    "\"And forensic triage\": a patch doesn't evict an actor",
    "\"Fix on system upgrade\": the next scheduled major upgrade",
    "Timelines are maximums; no waivers; CVSS no longer sets them",
    "Phase III, December 7, 2026: meet Table 1 and tag every externally reachable asset",
  ], 12.5);
  sources(s, "Sources: CISA BOD 26-04, Appendix A Table 1, implementation guidance and announcement (June 10, 2026); BOD 22-01 (revoked); FedRAMP NTC-0014. Book 12, Ch 06.");
  notes(s,
`CISA issued BOD 26-04, Prioritizing Security Updates Based on Risk, on June 10, 2026. It revokes BOD 19-02 and BOD 22-01 and replaces their clocks with four questions about each vulnerable asset. Is it publicly exposed, reachable by untrusted entities over public networks? Is the CVE in KEV? Can an adversary automate every step of exploitation? And is the technical impact partial or total, where total includes exploits that reliably reveal credentials? Appendix A's Table 1 sets the maximum timeline for all sixteen combinations, from three days with forensic triage to fix on system upgrade.

Five rules apply. The clock starts when CISA adds the vulnerability to KEV or the agency identifies it and updates CDM, whichever is first. Forensic-triage rows need remediation or mitigation within three days plus triage of the asset, because, as CISA put it, a patch generally doesn't evict a threat actor; the guidance's recommended sequence runs from scoping in two hours to an escalation decision by seventy-two. Fix on system upgrade means the next scheduled major upgrade or rebuild. Timelines are dynamic maximums that agencies may shorten. And there are no waivers; the alternative is removing the asset from the network. Revoking 19-02 also ended the federal requirement to use CVSS for prioritization.

Phase I applied on issuance, including CDM reporting of KEV status. Phase III, by December 7, 2026, requires meeting Table 1 and continuously tagging every externally reachable asset by organization, environment, exposure and type. Exposure is the agency's determination; without a tag, CISA's fallback marks an asset public if it has a routable address, is a network device, or runs public-facing KEV software. And FedRAMP makes its VDR and VER rules mandatory for certified offerings on December 7, 2026.`,
  "Book 12, Chapter 06 — Vulnerability Management, \"The directive that governs KEV: BOD 26-04.\"");
}

// ================================================================== 20 Daily queue
{
  const s = content(P2, "The daily queue: inputs, defaults and the record");
  tag(s, "How");
  table(s, "Inputs", 1.5, [2.1, 3.55, 3.15], ["Input", "Source of truth", "When it's missing"], [
    ["Asset identity", "Authoritative inventory (CM-8)", "Unattributed: an inventory defect"],
    ["Exposure", "The agency's exposure tag on the asset", "Treat as public (stricter than CISA)"],
    ["KEV status, due date, triage flag", "CISA KEV JSON feed, pulled daily", "Not in KEV"],
    ["Automatable, impact", "CISA Vulnrichment SSVC on the CVE record", "No, and total (CISA guidance)"],
    ["First detected", "The program's own finding history", "Today; never recalculated"],
    ["Deadline", "Table 1 from the start; for KEV, the earlier of that and dueDate", "—"],
  ], { fontSize: 12, limit: 4.75 });
  panel(s, "Tools", 9.6, 1.5, 3.15, 3.25, HEX.navy, HEX.navyTint, "WHAT THE TOOLS DON'T DO", null, [
    "Defender's record has no KEV flag",
    "Exports are snapshots: keep history",
    "TVM tables aren't in Sentinel",
    "Internet-facing flag: Windows only",
  ], 12);
  panel(s, "Report", 0.6, 4.9, 12.15, 1.55, HEX.amber, HEX.amberTint, "REPORT CLOSURES, NOT AN OPEN-QUEUE SHARE (DESIGN GUIDANCE)", null, [
    "PastDueKev is a compliance failure, not a metric; Unattributed counts inventory defects",
    "Archive the files immutably; send the summary by the Logs Ingestion API (the Data Collector API's support ended September 14, 2026)",
  ], 12.5);
  sources(s, "Sources: CISA KEV feed (v2026.10.21, 1,754 entries); CVE record Vulnrichment; Microsoft Learn — vulnerability resource; DeviceTvm table; Logs Ingestion API. Book 12, Ch 06.");
  notes(s,
`CISA publishes KEV as an unauthenticated JSON feed; on October 21, 2026 it held 1,754 entries, 270 added since January 1, and since BOD 26-04 each entry carries a forensicTriage field. Use the catalog's dueDate rather than a computed window, because CISA calculates it from the data it has, and pull before the morning review. The KEV join is the agency's job: Defender's vulnerability record carries CVSS, exploit flags and EPSS but no KEV flag, so treat any tool's tag as a convenience and CISA's feed as the record. Automation and impact come from CISA's Vulnrichment SSVC data on the CVE record.

The clock is design guidance. Asset identity comes from the authoritative inventory, and an unattributable finding is an inventory defect. Exposure comes from the agency's tag, because the directive makes it the agency's call; Defender's internet-facing flag covers only Windows, so it's a cross-check. A missing tag is treated as public, stricter than CISA by design. Missing SSVC values default to not automatable and total impact, as CISA specifies. First detected comes from the program's own history and is never recalculated, because SI-2(3) measures from identification. For KEV findings the deadline is the earlier of Table 1 and CISA's due date.

The daily job joins DeviceTvmSoftwareVulnerabilities to the asset record and the feeds. Hunting returns at most 100,000 rows, Defender's exports are snapshots with no history, and its vulnerability tables aren't ingested into Sentinel, so the queue files are the record. Report closures within their timeline plus open items past it; an open-queue percentage improves whenever new findings arrive. Send the summary through the Logs Ingestion API; the HTTP Data Collector API reached end of support September 14, 2026.`,
  "Book 12, Chapter 06 — Vulnerability Management, \"The KEV catalog is data,\" \"The program's remediation clock,\" \"Building the daily queue,\" \"Keeping the history.\"");
}

// ================================================================== 21 DVM coverage
{
  const s = content(P2, "Defender Vulnerability Management: prove the coverage");
  tag(s, "How");
  panel(s, "Gate", 0.6, 1.5, 5.0, 4.95, HEX.navy, HEX.navyTint, "ARC ENROLLMENT IS THE GATE", "The sensor follows the inventory", [
    "Defender for Cloud deploys MDE.Windows or MDE.Linux to Arc machines, AWS and Google Cloud included",
    "Not the Azure Monitor Agent; the MMA dependency went in April 2022",
    "Server monitoring via the integration isn't available for Office 365 GCC: confirm the path",
    "Daily: Arc list against DeviceInfo by Azure resource ID, then hostname",
    "runHuntingQuery; older hunting endpoints stop February 1, 2027",
  ], 12);
  table(s, "Life", 1.5, [2.65, 4.25], ["Platform", "Status on October 21, 2026"], [
    ["Windows Server 2025, 2022, 2019", "Supported; 2022 in extended support since October 13"],
    ["Windows Server 2016", "End of support January 12, 2027; ESU through Arc"],
    ["Windows Server 2012 R2", "ESU ended October 13: flaws listed, none fixable"],
    ["SQL Server 2016", "End of support July 14, 2026; ESU available"],
    ["SQL Server 2014", "ESU year 3 runs to July 12, 2027"],
    ["Linux distributions", "Per distribution; Ubuntu Pro and RHEL ELS excluded"],
  ], { x: 5.85, fontSize: 12, limit: 4.85 });
  panel(s, "SQL", 5.85, 4.95, 6.9, 1.5, HEX.amber, HEX.amberTint, "SQL SERVER'S TWO SERVICING BRANCHES", null, [
    "A CU-branch instance takes only CU-branch fixes (CU<nn>-GDR), never the RTM GDR",
    "One delivery mechanism per instance: Arc automatic updates or Update Manager",
  ], 12);
  sources(s, "Sources: Microsoft Learn — migrate servers to Defender for Servers; onboard servers; DVM supported OS; DeviceInfo; runHuntingQuery; Lifecycle 2026–2027; SQL servicing. Book 12, Ch 06.");
  notes(s,
`Defender Vulnerability Management is Defender for Endpoint's vulnerability assessment, and it's the program's server and endpoint scanner because the sensor follows the inventory: a server enrolled in Azure Arc, in a subscription with Defender for Servers, is onboarded automatically. It doesn't ride the Azure Monitor Agent. Defender for Cloud deploys the Defender for Endpoint extension for Windows or Linux to Arc machines, including in AWS and Google Cloud, and Windows Server 2016 and 2012 R2 use the unified solution, which dropped the MMA dependency in April 2022. Arc enrollment stays the single gate, so the inventory and the scan scope remain one list.

Two boundary facts. Microsoft says server monitoring through the Defender for Cloud integration isn't currently available for Office 365 GCC customers, and government tenants call government API endpoints. Confirm the tenant's real path with Book 10.

Enrollment isn't coverage. A server can be in Arc and missing from Defender because the extension failed, the sensor is unhealthy or it belongs to another tenant; allow up to twelve hours for the first subscription in a tenant. The daily check compares the Arc machine list with DeviceInfo, joining on Azure resource ID and falling back to hostname, reported as weaker evidence. Every enrolled server that isn't reporting is an RA-5 finding. It uses Graph's runHuntingQuery, because the older hunting endpoints stop returning data on February 1, 2027.

Lifecycle sets the hard edge. For Windows Server 2012 R2, Extended Security Updates ended October 13, 2026: its flaws can be listed but not fixed, which makes it an upgrade, isolation or risk-acceptance decision for the authorizing official. And a SQL Server instance on the cumulative-update branch takes only CU-branch fixes, through one delivery mechanism per instance.`,
  "Book 12, Chapter 06 — Vulnerability Management, \"Defender Vulnerability Management on Arc-enabled servers,\" \"SQL Server: two servicing branches.\"");
}

// ================================================================== 22 Native actuation
{
  const s = content(P2, "Actuation is platform-native; governance is unified");
  tag(s, "Who");
  table(s, "Stacks", 1.5, [1.75, 3.65, 3.0, 3.75], ["Platform", "Guest OS stack", "Hypervisor, firmware", "Native output the record maps from"], [
    ["Microsoft", "Update Manager for servers and Arc; Intune for Windows clients", "Azure Local through Update Manager", "Resource Graph patch tables; guestconfigurationresources"],
    ["AWS", "Systems Manager Patch Manager and State Manager", "Provider", "EventBridge compliance-change events; Inspector to Security Hub"],
    ["Oracle Cloud", "OS Management Hub; Ksplice for kernels", "Provider", "Mapped once per stack (design guidance)"],
    ["VMware", "Guest stack of choice, such as Update Manager through Arc", "vSphere Lifecycle Manager, hardware support manager", "Mapped once per stack (design guidance)"],
    ["Red Hat", "Satellite; Ansible Automation Platform", "—", "Job results to the coordination layer (design guidance)"],
  ], { fontSize: 11.5, limit: 5.2 });
  callout(s, "Closure", 5.35, 1.1, "FaClipboardCheck", HEX.teal, "Closure needs both halves: ",
    "the stack's record says what was applied, and a later scan of the same asset_id no longer sees it. SI-2 applies where the agency runs the OS or app.");
  sources(s, "Sources: CISA BOD 26-04 guidance; Microsoft Learn — Update Manager, Resource Graph; AWS Patch Manager, Inspector; Oracle OSMH, Ksplice; Broadcom vLCM; Red Hat. Book 12, Ch 07.");
  notes(s,
`Only the platform that runs a workload can fix it; only a record every platform emits in the same shape can prove the estate is fixed. The program's position, design guidance: actuation is platform-native, governance is unified.

Start with scope. SI-2 applies to the layers the agency operates. BOD 26-04's guidance draws the line: for on-premises systems and IaaS the agency retains full responsibility; for PaaS and SaaS the provider takes the layers it runs and must report outstanding vulnerabilities to the agency. So enumerate by service model first, and neither claim SI-2 evidence for a managed database the provider patches, nor skip it for an IaaS VM because it's in the cloud. CM-8 is the precondition: five platforms give five inventories, which join only on the naming plane's asset_id.

Each platform patches with the stack its support model expects. Update Manager covers Azure, Arc and Arc-connected VMware machines, and delivers hotpatches on Arc-enabled Windows Server 2025, with a reboot roughly quarterly. Intune covers Windows clients, not servers. Systems Manager's compliance is a point-in-time snapshot that AWS says doesn't mean a node is secure. Ksplice patches kernels in memory but doesn't replace on-disk updates. vSphere Lifecycle Manager updates ESXi software and firmware together through a vendor hardware support manager.

Two properties matter. The hypervisor and firmware column has no cross-platform tool; an overlay agent can't reach below the OS. And live patching shrinks maintenance windows, which matters against a three-day clock, but counts only when the stack records it against the finding. Each stack's output maps once to the unified record, the SI-2(2) and SI-2(3) evidence. Closure needs both the actuation record and a clean re-scan.`,
  "Book 12, Chapter 07 — Patch, Configuration and Hardening Baselines, \"The shared-responsibility line,\" \"CM-8 is the precondition,\" \"Actuation is platform-native,\" \"Governance is unified: the record.\"");
}

// ================================================================== 23 Baselines
{
  const s = content(P2, "Baselines that record their own drift");
  tag(s, "How");
  table(s, "Modes", 1.5, [2.45, 3.45, 3.0], ["Machine configuration mode", "Behavior", "Evidence consequence"], [
    ["Audit", "Reports; never changes the machine", "Every drift visible as NonCompliant"],
    ["ApplyAndMonitor (default)", "Applies, then reports drift without fixing it", "Drift visible; the fix is a recorded action"],
    [{ text: "ApplyAndAutoCorrect", options: { color: HEX.red } }, "Corrects drift at the next evaluation", "Always Compliant: no record that drift happened"],
  ], { fontSize: 12, limit: 3.62 });
  panel(s, "Mode", 9.7, 1.5, 3.05, 1.95, HEX.red, HEX.redTint, "THERE IS NO AUDIT-THEN-REMEDIATE MODE", null, [
    "It's a rollout: assign Audit, change it later by pull request",
  ], 12);
  flow(s, "Life", 3.65, 1.6, [
    { head: "Author", body: "SCuBA, CIS or STIG settings as versioned code (CM-6)" },
    { head: "Assign", body: "Audit first; measure the drift population (CM-2)" },
    { head: "Detect", body: "A drift record per setting per asset (CM-6(1))" },
    { head: "Reconcile or report", body: "Fix idempotent settings; else POA&M and SI-2 row (CM-6(2))", color: HEX.amber, tint: HEX.amberTint },
  ], 12);
  txt(s, "Arc gap", [
    { text: "Missing isn't clean: ", options: { bold: true, color: HEX.red } },
    { text: "a disconnected Arc server keeps its guest assignments for 14 days, then deletes them. A server that drops out of the drift export is a coverage finding." },
  ], { x: 0.6, y: 5.45, w: 12.15, h: 1.0, fontSize: 14, valign: "middle" });
  sources(s, "Sources: Microsoft Learn — machine configuration assignments and remediation options; Resource Graph guest configuration samples; NIST SP 800-53 (CM-2, CM-6); NIST NCP. Book 12, Ch 07.");
  notes(s,
`SI-2 closes flaws; CM-2 and CM-6 hold the configuration that keeps them closed. A patched host that drifts, an SMBv1 client re-enabled or a firewall rule widened, has reopened the exposure. Every platform has a desired-state mechanism: Azure machine configuration for Azure VMs and Arc servers, State Manager on AWS, versioned Ansible playbooks.

A baseline no pipeline enforces is a document, not a control. The lifecycle is design guidance. Author settings as code from SCuBA, binding for Microsoft 365 under BOD 25-01, or from STIGs and CIS Benchmarks found through NIST's National Checklist Program. Assign in audit mode and measure the drift population first, because auto-remediating a setting the estate depends on is an availability incident. Detect drift per setting per asset. Then split the rules: remediate idempotent, low-blast-radius settings, and report anything needing judgment as a POA&M item and an SI-2 queue row. That's CM-6(1) and CM-6(2) in practice.

Machine configuration has exactly three assignment types. Audit reports and never changes anything. ApplyAndMonitor, the default, applies the configuration and then reports drift without correcting it. ApplyAndAutoCorrect fixes drift at the next evaluation, and Microsoft says there's no way to report when a drift was automatically corrected. So an attacker's change can be silently restored and the record shows only compliance. Use ApplyAndMonitor or Audit wherever drift must be evidenced, reserve autocorrect for low-risk settings, and say which is which in the baseline file. There's no audit-then-remediate mode; that's a rollout sequence.

The drift export reads guestconfigurationresources, one row per noncompliant setting per machine. A disconnected Arc server keeps its assignments for fourteen days, then deletes them, so a server that vanishes from the export is a coverage finding.`,
  "Book 12, Chapter 07 — Patch, Configuration and Hardening Baselines, \"Configuration state, not just patch level,\" \"The baseline lifecycle,\" \"Azure machine configuration and the drift export.\"");
}

// ================================================================== 24 Cloud posture
{
  const s = content(P2, "Cloud posture: owned tool first, then one queue");
  tag(s, "What");
  table(s, "Posture", 1.5, [1.6, 3.6, 3.1, 3.85], ["Platform", "Posture mechanism", "FedRAMP listing (Oct. 21, 2026)", "Treatment (design guidance)"], [
    ["Azure", "Defender for Cloud: Foundational and Defender CSPM", "Azure, Azure Government: Class D", "Primary; coordinates where it reaches"],
    ["AWS", "AWS Config conformance packs; Security Hub CSPM", "US East/West Class C; GovCloud Class D", "Primary for AWS where owned"],
    ["Google Cloud", "Security Command Center; Assured Workloads", "Google Services, Class D", "Adoption default"],
    ["Oracle Cloud", "Cloud Guard", "OCI Government Cloud, Class D", "Only mechanism: no Defender for Cloud"],
    ["VMware", "STIG readiness guides with InSpec, Ansible, PowerCLI", "Customer-operated: none", "The agency's own evidence"],
  ], { fontSize: 11.5, limit: 4.5 });
  panel(s, "Stops", 0.6, 4.6, 5.95, 1.85, HEX.amber, HEX.amberTint, "WHERE DEFENDER FOR CLOUD STOPS", null, [
    "AWS connector unavailable in national government clouds",
    "No CIEM or DevOps security in Azure Government; attack path unconfirmed",
  ], 12);
  panel(s, "Admit", 6.8, 4.6, 5.95, 1.85, HEX.navy, HEX.navyTint, "KUBERNETES ADMISSION (DESIGN GUIDANCE, CM-7)", null, [
    "No privileged pods, no images from unapproved registries",
    "No unscanned images, no mutable tags: refuse at the gate",
  ], 12);
  sources(s, "Sources: FedRAMP Marketplace data (Oct. 21, 2026); Microsoft Learn — Defender for Cloud support matrices, AWS quickstart, Defender for Containers; Kubernetes docs. Book 12, Ch 08.");
  notes(s,
`A host scanner can't tell you whether a bucket is public, a workload is internet-reachable, a role is over-permissioned or an image was scanned. Cloud security posture management reads those settings through each provider's API: CM-6 for cloud resources, a separate contribution from the operating-system baseline. An assessor who sees only one hasn't seen CM-6 closed.

The selection rule is design guidance. A Microsoft product is the default only where it actually coordinates other platforms. An owned native mechanism is primary for its own platform. Where nothing is owned, a named adoption default is recorded as a plan, not a capability. And every mechanism is checked on the Marketplace at procurement, because the agency still authorizes its own systems. The listings shown are from the Marketplace dataset of October 21, 2026: AWS Config and Security Hub CSPM appear in both the Moderate commercial and High GovCloud offerings, and VMware's STIG content is customer-operated, with no certification of its own. Prisma Cloud is listed at Moderate and High, and Wiz at High with a Moderate package in process; either is a legitimate whole-estate choice for the authorizing official.

Defender for Cloud's multicloud plans cover Azure, AWS and Google Cloud, not Oracle. Microsoft says its AWS connector isn't available on the national government clouds, and CIEM and DevOps security aren't in Azure Government; attack path is listed both ways, so test it.

Containers add three mechanisms: registry image scanning, where the fix is rebuild and redeploy; admission control for CM-7, where Pod Security Admission rejects privileged pods in enforce mode and policy engines add registry and tag rules; and runtime detection for SI-3. Every finding is an exported record in the same queue, and a suppression or exemption isn't a closure.`,
  "Book 12, Chapter 08 — Cloud-Native Posture, \"The owned-tool-first decision,\" \"CNAPP,\" \"Kubernetes and container security,\" \"Feeding the evidence contract.\"");
}
endModule("Module 3");

// ================================================================== 25 Module 4 divider
{
  const s = divider(P2, "Module 4: Data protection and who runs it", "Part 2 — Findings and who acts on them  ·  Chapters 09–10",
    ["CUI mapped to sensitivity labels, deployed as code", "DLP on three surfaces, and three meanings of customer key", "Decision rights, the responsibility matrix and separations"], 14);
  notes(s,
`Module 4: data protection and who runs security operations. Every control in the pipe can be satisfied while the payload leaves, because nothing upstream said what the payload was. An authenticated user on a compliant device, sending to an approved destination, passes every network and identity control, even with a file full of Social Security numbers.

Then the book's last question: who decides. The SOC runs the queue, but it doesn't decide what reaches it, how long the evidence lasts or which blind spots the agency can live with.`,
  "Book 12, Chapter 09 — Data Protection and Classification; Chapter 10 — Who Runs Security Operations.");
}

// ================================================================== 26 CUI labels
{
  const s = content(P2, "CUI to sensitivity labels: the Registry decides");
  tag(s, "What");
  table(s, "Labels", 1.5, [2.55, 2.75, 2.15, 2.15, 2.55], ["Tier", "Label (parent / sublabel)", "Marking", "Encryption", "Who can open it"], [
    ["Public", "Public", "None", "None", "Anyone"],
    ["Uncontrolled, not for release", "Internal", "No CUI or dissemination legend", "None", "Not restricted by the label"],
    ["CUI Basic", "CUI / CUI Basic", "Header CUI", "Tenant key", "Everyone in the tenant"],
    ["CUI Basic, category marked", "CUI / CUI//PRVCY", "Header CUI//PRVCY", "Tenant key", "Everyone in the tenant"],
    ["CUI Specified", "CUI / CUI//SP-TAX, one per authority", "Category marking", "Tenant key; DKE for the narrowest", "A mail-enabled holder group"],
  ], { fontSize: 11.5, limit: 4.45 });
  panel(s, "Rule", 0.6, 4.6, 5.95, 1.85, HEX.red, HEX.redTint, "32 CFR PART 2002 AND THE CUI REGISTRY", null, [
    "Two levels only; Privacy Act records are Basic, taxpayer information Specified",
    "CUI Basic systems: no less than moderate confidentiality",
  ], 12);
  panel(s, "Signal", 6.8, 4.6, 5.95, 1.85, HEX.teal, HEX.tealTint, "THE LABEL IS THE SIGNAL", null, [
    "Stored in clear text in metadata, so a CASB can read it",
    "Office apps insert markings; service auto-labeling doesn't",
  ], 12);
  sources(s, "Sources: 32 CFR Part 2002; NARA CUI Registry (Privacy, Federal Taxpayer Information, Health); Microsoft Learn — sensitivity labels, label encryption, Office marking. Book 12, Ch 09.");
  notes(s,
`A CASB sees the app, the user, device compliance, the destination and the volume, but it can't tell a press release from a Privacy Act record. The sensitivity label supplies that signal. Microsoft describes it as stored in clear text in file and email metadata, so other services can read it, and as staying with the content wherever it goes; label encryption is what protects the content itself.

The framework is Executive Order 13556 and NARA's 32 CFR Part 2002. CUI is the only lawful category of controlled unclassified information. There are two control levels: CUI Basic, whose authority sets no specific handling, and CUI Specified, whose authority does; everything else is uncontrolled and still handled under FISMA. CUI Basic systems are categorized at no less than moderate confidentiality. And markings are prescribed: banner CUI, with category markings mandatory for Specified and optional for Basic unless policy requires them.

The Registry decides the level. Privacy Act records under 5 U.S.C. 552a(b) are a Basic authority: banner CUI, or CUI//PRVCY where policy requires category markings. Federal taxpayer information under 26 U.S.C. 6103 is Specified: CUI//SP-TAX. "Internal" isn't a CUI category; it's uncontrolled information not cleared for release, with no dissemination control of its own.

The taxonomy is design guidance: a CUI parent whose sublabels carry marking and encryption; Basic encrypted to the tenant; one sublabel per Specified authority, encrypted to a mail-enabled security group, since encryption can't target a group that isn't mail-enabled. Don't set records to expire by default. Office apps insert markings; service auto-labeling applies encryption without the marking until the file is relabeled. Deploy it as code, to a pilot group first.`,
  "Book 12, Chapter 09 — Data Protection and Classification, \"Why CASB alone is insufficient,\" \"The federal CUI framework,\" \"Mapping CUI to sensitivity labels,\" \"The label taxonomy as code.\"");
}

// ================================================================== 27 DLP
{
  const s = content(P2, "DLP on three surfaces, simulated before enforced");
  tag(s, "How");
  table(s, "DLP", 1.5, [3.55, 1.95, 3.35, 3.3], ["Minimum policy (design guidance)", "Surface", "Condition", "Action"], [
    ["Block external sharing of CUI", "SharePoint, OneDrive", "Any CUI sublabel", "Block external users; tip; incident report"],
    ["Block external send of CUI", "Exchange", "Any CUI sublabel, external recipient", "Block; policy tip"],
    ["Block print and removable media", "Endpoint", "A CUI Specified sublabel", "Block; audit event"],
    ["Audit copy to network shares", "Endpoint", "Any CUI sublabel", "Audit"],
    ["Block CUI upload to unapproved apps", "CASB", "Any CUI sublabel; app not approved", "Block; alert"],
    ["Alert on bulk download", "SharePoint, CASB", "Unusual volume in a short window", "Alert to security operations"],
    ["Detect Social Security numbers", "Teams", "SSN type, high confidence", "Block; tip; alert"],
  ], { fontSize: 11.5, limit: 4.95 });
  callout(s, "Simulate", 5.1, 1.35, "FaFilter", HEX.amber, "Simulate, enforce, then watch overrides: ",
    "every policy starts in a test mode and is measured against real content. Repeated overrides and mass label removal are detections, not report lines.");
  sources(s, "Sources: Microsoft Learn — New-DlpComplianceRule, New-DlpCompliancePolicy; auto-labeling cmdlets; endpoint DLP; device onboarding; Purview GCC and GCC High plans. Book 12, Ch 09.");
  notes(s,
`Manual labeling catches the obviously sensitive document and misses the routine one, so automatic labeling classifies on content. Built-in sensitive information types cover U.S. Social Security, taxpayer ID, bank account, driver's license and passport numbers; there's no built-in employer identification number type, so EINs and agency case numbers need custom types, defined as XML rule packages.

DLP acts at three points, all available in GCC and GCC High. Service DLP runs server-side in Exchange, SharePoint, OneDrive and Teams, independent of the device. Endpoint DLP covers onboarded Windows 10 and 11, macOS, and Windows Server 2019 and later, where it's off until turned on; onboarding is shared with Defender for Endpoint, and an excluded device gets no policy. The CASB acts at the session, for apps routed through Conditional Access app control.

The minimum baseline on the slide is design guidance for a Moderate system. The cmdlet details matter: labels are matched inside ContentContainsSensitiveInformation, with label entries of type Sensitivity; severity is ReportSeverityLevel; GenerateAlert takes an email address; endpoint restrictions are settings like Print, RemovableMedia and NetworkShare, and Block or Warn also needs NotifyUser; and BlockAccessScope PerUser blocks external users while keeping the owner's access.

Sequence: run auto-labeling in TestWithoutNotifications and DLP in TestWithNotifications, measure against real content, resolve false positives, then enforce. A spike that stamps CUI Specified on routine files is an agency-wide help desk event. Before enforcement, turn on the detections for mass label removal and repeated overrides, Chapter 11's FMP-DET-05 and 06.`,
  "Book 12, Chapter 09 — Data Protection and Classification, \"Automatic labeling,\" \"DLP on three enforcement surfaces,\" \"Deployment sequence.\"");
}

// ================================================================== 28 Keys
{
  const s = content(P2, "Three meanings of customer-managed key");
  tag(s, "Who");
  table(s, "Keys", 1.5, [2.45, 3.3, 3.4, 3.0], ["Option", "What it protects", "Where the key lives", "What the agency gives up"], [
    ["BYOK, Rights Management root key", "Every label-encrypted item, tenant-wide", "RSA 2048 in the agency's Key Vault (Premium for HSM)", "Nothing functional; a key to keep available"],
    ["Purview Customer Key", "Service encryption at rest for Exchange, SharePoint, OneDrive and more", "Two keys in two vaults in two subscriptions, per workload", "Nothing functional; strict key hygiene"],
    ["Double Key Encryption", "Only content with a DKE label", "One in the agency's DKE service, one in Azure", "eDiscovery, search, web, coauthoring, Copilot"],
  ], { fontSize: 11.5, limit: 3.85 });
  panel(s, "CK", 0.6, 4.0, 5.95, 2.45, HEX.red, HEX.redTint, "CUSTOMER KEY RULES A ROTATION POLICY CAN BREAK", null, [
    "Soft delete and purge protection at creation, 90-day retention",
    "RSA keys with no expiration date: an expiring policy causes an outage",
    "Availability-key use is logged: \"Fallback to availability key\"",
  ], 12);
  panel(s, "Choice", 6.8, 4.0, 5.95, 2.45, HEX.navy, HEX.navyTint, "DESIGN GUIDANCE", null, [
    "BYOK or Microsoft-managed for the tenant key",
    "Customer Key where the AO requires agency-held keys at rest",
    "DKE only for the narrowest CUI Specified categories",
    "Key Vault HSMs: FIPS 140-3 Level 3; check each CMVP certificate",
  ], 12);
  sources(s, "Sources: Microsoft Learn — Rights Management root key and BYOK; Set up Customer Key; availability key; DKE; Key Vault; Managed HSM; NIST FIPS 140-3 transition. Book 12, Ch 09.");
  notes(s,
`Bring your own key means three different things in Microsoft 365, and an assessor will ask which one the security plan means.

BYOK for the Azure Rights Management root key covers every label-encrypted item, tenant-wide: an RSA 2048-bit key in the agency's Key Vault, Premium for HSM protection, with get, decrypt and sign granted to the service. It replaces the root for every label at once, so it doesn't distinguish Basic from Specified. Purview Customer Key is service encryption at rest for Exchange, SharePoint, OneDrive and more, with two keys in two vaults in separate subscriptions per workload. Double Key Encryption is the only per-label choice: one key in the agency's own DKE service and one in Azure, both needed to open the content, at the cost of eDiscovery, search, Office for the web, coauthoring and Copilot for that content.

The program's design guidance: BYOK or Microsoft-managed for the tenant key; Customer Key where the authorizing official requires agency-held keys at rest; DKE only for the narrowest Specified categories. Decide before labels encrypt production content.

Customer Key breaks ordinary rotation policies. Its vaults need soft delete and purge protection at creation with ninety-day retention, and the service accepts only keys without an expiration date, so a policy that sets an expiry, fine for an Azure SQL protector, causes an outage here. Use of Microsoft's availability key is logged as Fallback to availability key.

For Azure workloads, Key Vault Premium HSMs and Managed HSM are FIPS 140-3 Level 3; check each module's CMVP certificate. FIPS 140-2 certificates moved to the Historical List in September 2026: existing systems may keep using them, while new procurements should rely on 140-3.`,
  "Book 12, Chapter 09 — Data Protection and Classification, \"Keys the agency controls,\" \"Azure workloads,\" \"Keys on other clouds.\"");
}

// ================================================================== 29 Who runs it
{
  const s = content(P2, "Who runs security operations: decide, do, consult");
  tag(s, "Who");
  const pic = img(s, "ch10-who-runs-security-operations", "Who decides, who runs and who supplies security operations. Decision makers on top: the CIO and sponsor, who own scope, funding and which SOC is top-level; the authorizing official, who accepts residual risk including telemetry gaps, missed deadlines and standing suppressions; and the CISO and ISSOs, who set logging, detection and evidence requirements and decide major incidents. In the middle: the top-level SOC, which triages, investigates, responds and reports to CISA; security engineering, which owns the SIEM, rule library, playbooks and evidence pipeline; and records, privacy and counsel, who are consulted. At the bottom: the platform owners for identity, cloud and Microsoft 365, endpoints and servers, network and DNS, and data, who emit telemetry and remediate findings. Control assessors assess with the independence the authorizing official sets.", 0.6, 1.5, 6.1, 4.2);
  table(s, "Roles", 1.5, [2.05, 3.75], ["Role", "Decides"], [
    ["CIO / sponsor", "Scope, funding, which SOC is top-level"],
    ["CISO", "Requirements: emission, retention floor, coverage, evidence standard; major incidents"],
    ["Authorizing official", "Residual risk, including what isn't seen"],
    ["System owner / ISSO", "How and when the system's findings are fixed"],
    ["Top-level SOC", "Severity, assignment, closure; CISA notice within one hour"],
    ["Security engineering", "How a requirement is met in the platform"],
    ["Records, privacy, counsel", "Disposition; log content; legal review of monitoring"],
  ], { x: 6.95, fontSize: 12, limit: 5.75 });
  txt(s, "CCP", [
    { text: "The SOC is a common control provider: ", options: { bold: true, color: HEX.teal } },
    { text: "the monitoring it provides is inherited, so it is assessed, planned and POA&M'd like any other control." },
  ], { x: 0.6, y: Math.max(pic.bottom, 5.75) + 0.08, w: 12.15, h: 0.62, fontSize: 13.5, valign: "middle" });
  sources(s, "Sources: NIST SP 800-37 Rev. 2 (App. D; tasks M-1 to M-6); OMB M-26-14; CISA Federal Incident Notification Guidelines; BOD 26-04; TIC 3.0 Program Guidebook. Book 12, Ch 10.");
  notes(s,
`Most agencies can name their SOC. Fewer can say who decided a source is collected, who set its retention, who owns the rule that reads it, or who accepted the risk when it went quiet for three weeks. Those decisions get made by whoever holds the console. Chapter 10 assigns them, as the program's recommended design, consistent with Books 00 and 01: adapt it, but keep one decider per row.

The roles come from federal sources. NIST SP 800-37 makes the authorizing official the only official who can accept security and privacy risk, a government-only role, and assigns the continuous-monitoring tasks M-1 to M-6. M-26-14 requires logs to be readily available to the top-level SOC, an Agency Logging Plan, and logs for CISA and the FBI on request after a compromise. CISA's guidelines require notice within one hour of identification by the top-level CSIRT, SOC or IT department.

The program separates decides, does and consulted, because consequential decisions here look like settings: a retention slider, a rule toggle, one line in a template.

The CIO decides scope, funding and which SOC is top-level; the funding line for ingestion and retention is where most visibility gaps are actually decided. The CISO decides requirements: emission, the retention floor, coverage, the evidence standard, automated containment and major incidents, and owns the Agency Logging Plan. The authorizing official accepts residual risk, including what isn't seen. System owners decide how their findings are fixed. The SOC decides severity, assignment, closure and the one-hour notice.

SP 800-37 has no SOC role; its closest fit is a common control provider, so the SOC's inherited monitoring controls are assessed and POA&M'd like anyone else's.`,
  "Book 12, Chapter 10 — Who Runs Security Operations, \"Where the roles come from,\" \"The SOC is a common control provider,\" \"The roles.\"");
}

// ================================================================== 30 Matrix
{
  const s = content(P2, "The responsibility matrix: rows that narrow visibility");
  tag(s, "Who");
  table(s, "Matrix", 1.5, [4.1, 1.15, 1.15, 1.15, 1.15, 1.15, 1.15, 1.15], ["Decision (design guidance)", "CISO", "AO", "SO / ISSO", "SOC", "Sec. eng.", "Platform", "Records"], [
    ["What each plane must emit", "D", "", "C", "C", "R", "R", "C"],
    ["How each platform emits, kept on", "C", "", "C", "C", "C", "D, R", ""],
    ["Minimum security retention", "D", "C", "", "C", "R", "", "C"],
    ["Disposition; any shortening of retention", "C", "", "", "C", "R", "", "D"],
    ["Rule suppression with an end date", "D", "", "C", "R", "R", "", ""],
    ["Suppression or disabled rule, no end date", "R", "D", "C", "C", "R", "", ""],
    ["Playbook that acts on production", "D", "C", "C", "C", "R", "C", ""],
    ["Incident triage, severity and closure", "C", "", "C", "D, R", "C", "R", ""],
    ["Notification to CISA within one hour", "C", "", "C", "D, R", "", "", ""],
    ["Telemetry gap carried, not closed", "R", "D", "C", "C", "R", "C", ""],
    ["Missed or deferred BOD 26-04 deadline", "R", "D", "R", "C", "", "C", ""],
  ], { fontSize: 11.5, minRow: 0.3, limit: 5.85 });
  txt(s, "Key", [
    { text: "D decides  ·  R does the work  ·  C consulted.  ", options: { bold: true, color: HEX.navy } },
    { text: "An exception with an end date is the CISO's to approve; one without goes to the authorizing official." },
  ], { x: 0.6, y: 5.95, w: 12.15, h: 0.6, fontSize: 13, valign: "middle" });
  sources(s, "Sources: NIST SP 800-37 Rev. 2; OMB M-26-14; CISA notification guidelines; BOD 26-04; NARA GRS 3.2. The matrix is the program's recommended design. Book 12, Ch 10.");
  notes(s,
`Chapter 10's full matrix has twenty-eight rows; these are the ones that narrow what the agency can see. D decides, R does the work, C is consulted. The matrix is design guidance.

Emission splits three ways on purpose. The CISO decides what each plane must emit, in the Agency Logging Plan. Each platform owner decides how its platform emits and keeps it on through change. Security engineering decides where it lands and how it's parsed. That keeps the CISO from configuring platforms, and keeps platform teams from deciding alone that a category isn't worth emitting.

Retention splits in two. The CISO sets the security floor, at least M-26-14's six months searchable and a year retrievable. The records officer decides disposition above it, because M-26-14 says its minimums don't relieve agencies of records schedules. GRS 3.2's cybersecurity logging items still cite the rescinded M-21-31, and NARA lists their revision as in drafting, so how they apply is a records decision. Any shortening needs the records officer's concurrence, because deleted evidence can't come back for an investigation or a legal hold.

Suppressions split on time. One with an end date is a bounded decision for the CISO; one without leaves a source unanalyzed indefinitely, a standing risk acceptance for the authorizing official.

A playbook that acts on production, isolating a device or disabling an account, needs the CISO's approval and the affected platform owner's knowledge. CISA notification sits with the SOC, because an hour leaves no time for a decision to travel up and back. And a telemetry gap carried rather than closed, or a missed BOD 26-04 deadline, is a risk acceptance for the authorizing official, with an end date and a POA&M entry.`,
  "Book 12, Chapter 10 — Who Runs Security Operations, \"Three questions, one owner each,\" \"The responsibility matrix.\"");
}

// ================================================================== 31 Separations
{
  const s = content(P2, "Owners, roles and separations that keep evidence honest");
  tag(s, "How");
  table(s, "Roles", 1.5, [2.25, 3.65], ["Team", "Least-privileged Sentinel role"], [
    ["SOC analysts", "Sentinel Responder; Playbook Operator"],
    ["Detection engineering", "Sentinel Contributor, eligible not standing"],
    ["Platform engineering", "Log Analytics Contributor, eligible: connectors, retention"],
    ["Platform owners", "Sentinel Reader for their own plane, if any"],
    ["CISO and ISSOs", "Sentinel Reader; approve evidence"],
    ["Control assessors", "Sentinel Reader, time-bound; re-run evidence"],
  ], { fontSize: 12, limit: 4.66 });
  panel(s, "Record", 0.6, 4.7, 5.9, 1.75, HEX.navy, HEX.navyTint, "EVERY RULE'S OWNERSHIP RECORD (DESIGN GUIDANCE)", null, [
    "One named owner and a backup; purpose; every source table",
    "Response, last test, review date; suppressions with approver and end date",
  ], 12);
  panel(s, "Separate", 6.75, 1.5, 6.0, 4.95, HEX.red, HEX.redTint, "FIVE SEPARATIONS (DESIGN GUIDANCE)", null, [
    "No one quietly shortens the record: eligible rights and the records officer's concurrence (AU-9)",
    "Platform owners can't silence their own plane: an unexplained loss of emission is an incident",
    "A rule's author doesn't close the rule's gap",
    "The SOC doesn't assess the SOC",
    "The authorizing official stays outside security operations: a contractor can prepare a risk acceptance, never sign it",
  ], 12.5);
  sources(s, "Sources: Microsoft Learn — Roles and permissions in the Sentinel platform; Log Analytics retention permissions; NIST SP 800-37 Rev. 2; NIST SP 800-53 (AU-9). Book 12, Ch 10.");
  notes(s,
`Decision rights don't change what a console lets someone do; roles do. Every analytics rule and playbook has exactly one owner, a named engineer, recorded in the rule library with a backup, its purpose, every source table it reads, the response it hands to, its last test and review date, and any suppression with approver and end date. That record is design guidance; it lets a silent table be traced to the rules it blinds.

Sentinel uses Azure RBAC. Reader views; Responder manages incidents; Contributor creates and edits rules and content; Playbook Operator runs playbooks; and editing playbooks needs Logic App Contributor. Assign at the workspace's resource group; assignments are cumulative. Changing retention needs the tables write permission in Log Analytics Contributor. The program maps each team to the least it needs, with engineering roles eligible through PIM and assessors time-bound. Once automation can run playbooks in a resource group, any automation rule can run any playbook there, so acting playbooks get a resource group of their own.

Security operations holds the record of what everyone else did, so its separations matter more than most, and these five are design guidance. No one quietly shortens the record: retention rights are eligible and used only with the records officer's concurrence, under AU-9, because an engineer who can cut retention unrecorded can do what an intruder most wants. Platform owners can't silence their own plane; an unexplained loss of emission is an incident, not a ticket. A rule's author can tune it, but not suppress it past its end date. The SOC doesn't assess the SOC. And the authorizing official stays outside: a contractor can prepare a risk acceptance, never sign it.`,
  "Book 12, Chapter 10 — Who Runs Security Operations, \"Who owns each detection and playbook,\" \"Roles in each system,\" \"Keeping the roles apart.\"");
}

// ================================================================== 32 Decisions
{
  const s = content(P2, "Decisions to make, and what to run on Monday");
  tag(s, "How");
  table(s, "Decisions", 1.5, [4.8, 2.35, 0.9], ["Decision (design guidance)", "Who decides", "Ch."], [
    ["Which planes and assets must emit, checked against what arrives", "CISO, with platform owners", "01–05"],
    ["Stand up the naming plane before the evidence pipeline", "CIO funds; DNS and DDI team", "02"],
    ["Tag exposure on every externally reachable asset by December 7, 2026", "System owners", "06"],
    ["Resource-specific tables and allLogs everywhere, remediated", "Cloud platform team", "04"],
    ["The customer-key option, before labels encrypt production", "CISO; AO for Customer Key", "09"],
    ["Every blind spot, open suppression and missed deadline", "Authorizing official", "10"],
  ], { fontSize: 12, limit: 6.5 });
  panel(s, "Monday", 8.85, 1.5, 3.9, 4.95, HEX.teal, HEX.tealTint, "NO PROCUREMENT NEEDED", "Run these first", [
    "Entra completeness and table freshness queries",
    "Subscriptions with no activity-log export; remediation tasks",
    "Get-AdminAuditLogConfig in Exchange Online PowerShell",
    "The Arc-to-Defender coverage check",
    "An owner and a test date on every rule",
  ], 12.5);
  sources(s, "Sources: Book 12, Chapters 01–10; CISA BOD 26-04; OMB M-26-14. Decisions and sequence are program design guidance.");
  notes(s,
`So, the decisions, each with its owner, all of them design guidance.

The CISO, with the platform owners, names the planes and assets expected to emit and checks each against what arrives; coverage is measured against the inventory. The CIO funds the naming plane, and the DNS and DDI team stands it up before the evidence pipeline, because every record joins on its asset identity. System owners tag the exposure of every externally reachable asset before BOD 26-04's Phase III date, December 7, 2026; untagged, the program treats an asset as public. The cloud platform team commits to resource-specific tables and allLogs everywhere, and runs the remediation tasks for existing resources. The CISO decides the customer-key option before labels encrypt production, with the authorizing official deciding where Customer Key is required. And every blind spot, open-ended suppression and missed deadline goes to the authorizing official, with an end date.

Five things to run on Monday that need no procurement: the Entra completeness query and the table freshness check; the list of subscriptions with no activity-log export, and a remediation task per allLogs policy; Get-AdminAuditLogConfig, in Exchange Online PowerShell; the Arc-to-Defender coverage check; and an owner, source tables and a last-test date on every analytics rule.

You can't defend what you can't see, and a finding closes only when the thing is fixed, with proof. Chapters 02 through 10 carry the detail, every claim footnoted and every query marked illustrative. Thank you.`,
  "Book 12, Chapters 01–10; Chapter 10 — Who Runs Security Operations, \"What changes, in one table.\"");
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
  "NIST SP 800-53 Rev. 5 (release 5.2.0), OSCAL catalog: AC-2, AC-6, AU-2, AU-3, AU-6, AU-8, AU-12, AU-12(1), CA-7, CM-8, SI-4, SI-4(16).  ·  NIST SP 800-53B Moderate and High profiles.  ·  NIST SP 800-137.",
  "OMB M-26-14, Ensuring Effective and Efficient Agency Logging and Network Visibility (May 22, 2026), Appendices B and C.  ·  CISA Logging Reference Architecture (Aug. 20, 2026).",
  "CISA BOD 23-01 (Oct. 3, 2022); CDM program; Microsoft expanded cloud logs playbook.  ·  FedRAMP Rev. 5 baseline workbook (legacy notice June 23, 2026); Key Security Indicators, MLA theme.",
  "Microsoft Learn: Sentinel data lake; resource logs; AWS connector troubleshooting and AWS environment setup; ASIM normalization, common fields and device entity; Heartbeat; watchlists.",
  "Microsoft Learn: Defender for Cloud continuous export; Investigate DLP alerts with Defender XDR (alert tuning rule, early October 2026).  ·  NIST OSCAL layers and models.",
  "Microsoft Learn: Entra data retention; configure Entra diagnostic settings; identity logs you can stream; stream logs to an event hub; Graph activity logs; ID Protection risk export.",
  "Microsoft Learn: Sentinel Entra ID connector; ARM reference microsoft.aadiam diagnosticSettings 2017-04-01; migrate diagnostic-settings storage retention; Log Analytics data retention.",
  "Microsoft Learn: Graph national cloud deployments; Compare Azure Government; List signIns; List directoryAudits; analyze activity logs with Graph; Graph SDK national clouds; KQL union.",
  "Full footnotes with links and access dates: Book 12, Chapters 01–03.",
]);
sourceSlide("Sources behind Module 2 — Platform telemetry to detection", [
  "Microsoft Learn: Activity log in Azure Monitor; activity log event schema; diagnostic settings in Azure Monitor; resource logs; AzureDiagnostics and AzureActivity table references; az monitor diagnostic-settings subscription.",
  "Microsoft Learn: Azure Policy built-ins for Azure Monitor; built-in initiatives (Monitoring); deployIfNotExists effect; remediate non-compliant resources.  ·  FedRAMP KSI-MLA-EVC and KSI-MLA-LET.",
  "Microsoft Learn: Turn auditing on or off; Search-UnifiedAuditLog; Office 365 Management Activity API reference, FAQ and schema; Sentinel and Microsoft Teams.",
  "Microsoft Learn: Manage audit log retention policies; auditing solutions in Purview; Purview service description; Purview GCC and GCC High plans; OfficeActivity; Sentinel billing (free sources).",
  "CISA and FBI, AA23-193A, Enhanced Monitoring to Detect APT Activity Targeting Outlook Online (July 2023).  ·  NIST SP 800-53 Rev. 5: AU-6 and enhancements, SI-4 and enhancements.",
  "Microsoft Learn: scheduled and NRT analytics rules; SecurityIncident; Sentinel in the Defender portal; Sentinel feature availability; Cloud feature availability for US Government.",
  "Microsoft Learn: Entra ID and Defender XDR connectors; XDR streaming event types; Syslog and CEF via AMA; Infoblox NIOS; Zscaler CEF; tables and connectors reference; ASIM DNS schema and parsers.",
  "Microsoft Learn: SQL Database audit log format; SQL audit to the Security log; Database Engine events 31000–41399; Defender for SQL; threat intelligence; connector health; UEBA; attack disruption.",
  "Full footnotes with links and access dates: Book 12, Chapters 04–05.",
]);
sourceSlide("Sources behind Module 3 — Vulnerability, patch and posture", [
  "CISA BOD 26-04, Prioritizing Security Updates Based on Risk (June 10, 2026), Appendix A Table 1, and its implementation guidance and announcement.  ·  BOD 22-01 (revoked); BOD 23-01; BOD 26-02.",
  "FedRAMP NTC-0014, Response to BOD 26-04 (June 16, 2026); Vulnerability Detection and Response rules; Key Security Indicators and 20x Class C reference (October 13, 2026 mappings).",
  "CISA KEV catalog JSON feed, version 2026.10.21 (1,754 entries).  ·  CVE Services record for CVE-2024-37085, CISA ADP Vulnrichment container.",
  "Microsoft Learn: Defender vulnerability resource; DVM supported OS; migrate servers to Defender for Servers; onboard servers; Defender for Endpoint for US Government; DeviceInfo; DeviceTvmSoftwareVulnerabilities.",
  "Microsoft Learn: runHuntingQuery; Graph security API; software vulnerability export; Logs Ingestion API and Data Collector migration; Lifecycle (2026–2030); SQL Server servicing models; SQL Arc automatic updates.",
  "Microsoft Learn: Update Manager; Arc hotpatch; Intune update rings and expedite; Resource Graph tables; machine configuration assignments, remediation options and compliance; guest configuration samples.",
  "AWS: Systems Manager Patch Manager, State Manager, EventBridge events; Amazon Inspector; AWS Config NIST 800-53 pack; Security Hub CSPM.  ·  Oracle: OS Management Hub; Ksplice; Cloud Guard.",
  "Broadcom: vSphere Lifecycle Manager firmware; VCF 9.1 STIG compliance.  ·  Red Hat Satellite 6.19.  ·  Google Cloud: Security Command Center; Assured Workloads.  ·  FedRAMP Marketplace data (Oct. 21, 2026).",
  "Microsoft Learn: Defender for Cloud support matrices, AWS quickstart, attack paths, Defender for Containers; Azure Policy for Kubernetes.  ·  Kubernetes Pod Security Admission and Standards.  ·  NIST SP 800-190, SP 800-218.",
  "Full footnotes with links and access dates: Book 12, Chapters 06–08.",
]);
sourceSlide("Sources behind Module 4 — Data protection and who runs it", [
  "32 CFR Part 2002, Controlled Unclassified Information (eCFR, Oct. 1, 2026).  ·  NARA, About CUI; CUI Registry: Privacy, Federal Taxpayer Information, Health Information, General Law Enforcement.",
  "Microsoft Learn: sensitivity labels; label encryption; Office content marking; New-Label; New-LabelPolicy; sensitive information type definitions; custom SIT rule packages; trainable classifiers.",
  "Microsoft Learn: New-AutoSensitivityLabelPolicy and Rule; New-DlpCompliancePolicy and Rule; endpoint DLP; device onboarding; Defender for Cloud Apps session and information protection policies.",
  "Microsoft Learn: Rights Management root key; BYOK; Set up Customer Key; availability key; Double Key Encryption; Key Vault; Managed HSM; New-AzKeyVault; TDE with customer-managed key and rotation.",
  "NIST FIPS 140-3 Transition Effort (Historical List, September 2026).  ·  NIST SP 800-53B (AU-10, SC-12(1), AC-16).  ·  FedRAMP Key Security Indicators (SVC, MLA).",
  "NIST SP 800-37 Rev. 2, Appendix D roles and Monitor step tasks M-1 to M-6.  ·  OMB M-26-14 (Agency Logging Plan, log access, Appendix B).  ·  CISA Federal Incident Notification Guidelines.",
  "CISA BOD 26-04 (Phase I roles).  ·  CISA TIC 3.0 Program Guidebook v1.2 (September 2026).  ·  NARA GRS 3.2 (Transmittal 33) and GRS status updates (Transmittal 38, drafting).",
  "Microsoft Learn: Roles and permissions in the Microsoft Sentinel platform (Azure portal retirement notice); Log Analytics retention permissions.  ·  NIST SP 800-53 Rev. 5: AU-6, AU-9, SI-4.",
  "Full footnotes with links and access dates: Book 12, Chapters 09–10.",
]);

console.log(`notes: ${words} words, about ${(words / WPM).toFixed(1)} minutes at ${WPM} wpm`);
modules.forEach(([m, w]) => console.log(`  ${m}: ${w} words, ${(w / WPM).toFixed(1)} min`));
D.save(OUT).catch((e) => { console.error(e); process.exit(1); });
